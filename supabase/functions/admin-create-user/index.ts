// Edge Function: admin-create-user
//
// Crea una cuenta real en Supabase Auth con la clave puesta por el admin
// (no una invitación por correo): pensado para usuarios no técnicos que no
// quieren o no pueden revisar un correo de invitación. El admin define la
// clave y se la entrega al usuario por otro medio (WhatsApp, en persona).
//
// Acepta dos formas de identificar al usuario:
//   - identifier_type: 'dni'   -> arma un correo sintético <dni>@padres.interno
//                                  (mismo dominio que usan los padres; el nombre
//                                  del dominio es histórico — sirve para
//                                  cualquier rol logueado por DNI, no solo
//                                  padre_familia)
//   - identifier_type: 'email' -> usa el correo real tal cual, sin invitación
//
// Generaliza a ../create-parent-user (que queda sin uso; se puede borrar de
// Supabase cuando se quiera, esta función cubre el mismo caso y más).
//
// Ver ver_hijos_login_solo_dni_padre.md para el diseño original (solo padres);
// esta función lo extiende a cualquier rol (dirigentes, coordinadores, etc.)
// que prefiera clave directa en vez de invitación por correo.
//
// Requiere, como secrets de esta función (nunca en el bundle del frontend):
//   SUPABASE_URL                (autoinyectado por Supabase)
//   SUPABASE_SERVICE_ROLE_KEY   (configurar con `supabase secrets set`)
//
// Despliegue:
//   supabase functions deploy admin-create-user
//
// Invocación desde el frontend:
//   supabase.functions.invoke('admin-create-user', {
//     body: { identifier_type, identifier, full_name, password, role_ids }
//   })

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Debe coincidir con SYNTHETIC_EMAIL_DOMAIN en src/lib/syntheticEmail.ts.
// Duplicado a propósito: esta función corre en Deno (deploy independiente)
// y no puede importar código de src/.
const SYNTHETIC_EMAIL_DOMAIN = 'padres.interno';
const PADRE_ROLE_NAME = 'padre_familia';

type IdentifierType = 'dni' | 'email';

interface AdminCreateUserBody {
  identifier_type: IdentifierType;
  identifier: string;
  full_name: string;
  password: string;
  role_ids: string[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function sanitizeDni(dni: string): string {
  return dni.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Método no permitido' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ success: false, error: 'Función mal configurada: faltan secrets' }, 500);
  }

  // Cliente con el JWT de quien invoca — para verificar que el CALLER
  // (no lo que diga el body) tiene permiso de gestionar usuarios.
  const authHeader = req.headers.get('Authorization') ?? '';
  const callerClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: callerUser, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerUser?.user) {
    return jsonResponse({ success: false, error: 'No autenticado' }, 401);
  }

  const { data: puedeGestionar, error: permError } = await callerClient.rpc('check_user_permission', {
    required_permission: 'usuarios:gestionar',
  });
  if (permError || !puedeGestionar) {
    return jsonResponse({ success: false, error: 'No tienes permiso para crear usuarios' }, 403);
  }

  let body: AdminCreateUserBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: 'Body inválido' }, 400);
  }

  const identifierType = body.identifier_type;
  const identifierRaw = body.identifier?.trim();
  const fullName = body.full_name?.trim();
  const password = body.password ?? '';
  const roleIds = Array.isArray(body.role_ids) ? body.role_ids.filter(Boolean) : [];

  if (identifierType !== 'dni' && identifierType !== 'email') {
    return jsonResponse({ success: false, error: 'identifier_type debe ser "dni" o "email"' }, 400);
  }
  if (!identifierRaw) {
    return jsonResponse({
      success: false,
      error: identifierType === 'dni' ? 'El DNI es requerido' : 'El correo es requerido',
    }, 400);
  }
  if (!fullName) {
    return jsonResponse({ success: false, error: 'El nombre completo es requerido' }, 400);
  }
  if (password.length < 6) {
    return jsonResponse({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' }, 400);
  }
  if (roleIds.length === 0) {
    return jsonResponse({ success: false, error: 'Selecciona al menos un rol' }, 400);
  }

  // Cliente admin: usa la service_role key, bypassa RLS.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: rolesSeleccionados, error: rolesLookupError } = await adminClient
    .from('roles')
    .select('id, nombre')
    .in('id', roleIds);

  if (rolesLookupError || !rolesSeleccionados || rolesSeleccionados.length !== roleIds.length) {
    return jsonResponse({ success: false, error: 'Uno o más roles seleccionados no existen' }, 400);
  }

  const incluyePadreFamilia = rolesSeleccionados.some((r) => r.nombre === PADRE_ROLE_NAME);

  let email: string;
  let dniParaMetadata: string | undefined;

  if (identifierType === 'dni') {
    const dni = sanitizeDni(identifierRaw);
    if (!dni) {
      return jsonResponse({ success: false, error: 'El DNI es requerido' }, 400);
    }
    dniParaMetadata = identifierRaw;
    email = `${dni}@${SYNTHETIC_EMAIL_DOMAIN}`;

    if (incluyePadreFamilia) {
      // Solo tiene sentido validar contra familiares_scout cuando uno de los
      // roles elegidos es padre_familia (login como padre, ve el Portal de
      // Padres, que matchea por DNI contra familiares_scout).
      // No se filtra por tipo_documento = 'DNI': un padre/tutor puede
      // estar registrado con Carnet de Extranjería o Pasaporte y este
      // identificador (el "DNI" de login) es en realidad cualquier
      // número de documento — filtrar solo por DNI bloqueaba la
      // creación de cuenta para esos casos aunque el familiar sí
      // existiera en el sistema.
      const { data: familiarExistente, error: familiarError } = await adminClient
        .from('familiares_scout')
        .select('id, personas!inner(numero_documento, tipo_documento)')
        .eq('personas.numero_documento', identifierRaw)
        .in('personas.tipo_documento', ['DNI', 'CARNET_EXTRANJERIA', 'PASAPORTE'])
        .limit(1)
        .maybeSingle();

      if (familiarError) {
        return jsonResponse({ success: false, error: `Error verificando el documento: ${familiarError.message}` }, 500);
      }
      if (!familiarExistente) {
        return jsonResponse({
          success: false,
          error: 'No existe ningún familiar registrado con ese número de documento. Registra primero al hijo con este documento en el paso "Familiares".',
        }, 400);
      }
    }
  } else {
    email = identifierRaw.toLowerCase();
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      ...(dniParaMetadata ? { dni: dniParaMetadata } : {}),
    },
  });

  if (createError || !created?.user) {
    const message = createError?.message ?? '';
    const yaExiste = /already.*registered|already exists/i.test(message);
    return jsonResponse({
      success: false,
      error: yaExiste ? 'Ya existe un acceso con ese identificador' : (message || 'No se pudo crear el usuario'),
    }, 400);
  }

  const newUserId = created.user.id;

  // El trigger handle_new_user ya creó la fila en profiles (incluyendo dni,
  // si vino en el metadata) al insertarse en auth.users. Asignamos los roles.
  const { error: rolesInsertError } = await adminClient
    .from('user_roles')
    .insert(roleIds.map((roleId) => ({
      user_id: newUserId,
      role_id: roleId,
      asignado_por: callerUser.user.id,
    })));

  if (rolesInsertError) {
    return jsonResponse({
      success: false,
      error: `Usuario creado pero no se pudieron asignar roles: ${rolesInsertError.message}`,
      user_id: newUserId,
    }, 207);
  }

  return jsonResponse({ success: true, user_id: newUserId });
});
