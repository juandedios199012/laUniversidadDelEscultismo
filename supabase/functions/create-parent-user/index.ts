// Edge Function: create-parent-user
//
// Crea una cuenta real en Supabase Auth para un Padre/Tutor a partir de su
// DNI (no de un correo real): construye un correo sintético
// dni_<dni>@padres.interno, crea el usuario ya confirmado (sin enviar
// correo, porque esa dirección no existe) y le asigna el rol padre_familia.
//
// Ver ver_hijos_login_solo_dni_padre.md para el diseño completo.
// Espeja el patrón de autorización de ../invite-user/index.ts, pero con
// createUser (no inviteUserByEmail) porque no hay bandeja de correo real
// a la que enviar la invitación.
//
// Requiere, como secrets de esta función (nunca en el bundle del frontend):
//   SUPABASE_URL                (autoinyectado por Supabase)
//   SUPABASE_SERVICE_ROLE_KEY   (configurar con `supabase secrets set`)
//
// Despliegue:
//   supabase functions deploy create-parent-user
//
// Invocación desde el frontend:
//   supabase.functions.invoke('create-parent-user', { body: { dni, full_name, password } })

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Debe coincidir con SYNTHETIC_EMAIL_DOMAIN en src/lib/syntheticEmail.ts.
// Duplicado a propósito: esta función corre en Deno (deploy independiente)
// y no puede importar código de src/.
const SYNTHETIC_EMAIL_DOMAIN = 'padres.interno';
const PADRE_ROLE_NAME = 'padre_familia';

interface CreateParentUserBody {
  dni: string;
  full_name: string;
  password: string;
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
    return jsonResponse({ success: false, error: 'No tienes permiso para crear accesos de padres' }, 403);
  }

  let body: CreateParentUserBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: 'Body inválido' }, 400);
  }

  const dniRaw = body.dni?.trim();
  const fullName = body.full_name?.trim();
  const password = body.password ?? '';
  const dni = dniRaw ? sanitizeDni(dniRaw) : '';

  if (!dniRaw || !dni) {
    return jsonResponse({ success: false, error: 'El DNI es requerido' }, 400);
  }
  if (!fullName) {
    return jsonResponse({ success: false, error: 'El nombre completo es requerido' }, 400);
  }
  if (password.length < 6) {
    return jsonResponse({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' }, 400);
  }

  // Cliente admin: usa la service_role key, bypassa RLS.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Verifica que exista al menos un familiar registrado con ese documento
  // (el "step Familiares" del registro del scout). Evita crear accesos
  // huérfanos que nunca verían a ningún hijo en el Portal de Padres.
  const { data: familiarExistente, error: familiarError } = await adminClient
    .from('familiares_scout')
    .select('id, personas!inner(numero_documento, tipo_documento)')
    .eq('personas.numero_documento', dniRaw)
    .eq('personas.tipo_documento', 'DNI')
    .limit(1)
    .maybeSingle();

  if (familiarError) {
    return jsonResponse({ success: false, error: `Error verificando el documento: ${familiarError.message}` }, 500);
  }
  if (!familiarExistente) {
    return jsonResponse({
      success: false,
      error: 'No existe ningún familiar registrado con ese número de documento. Registra primero al hijo con este DNI en el paso "Familiares".',
    }, 400);
  }

  const { data: rolPadre, error: rolError } = await adminClient
    .from('roles')
    .select('id')
    .eq('nombre', PADRE_ROLE_NAME)
    .maybeSingle();

  if (rolError || !rolPadre) {
    return jsonResponse({ success: false, error: `No se encontró el rol ${PADRE_ROLE_NAME}` }, 500);
  }

  const syntheticEmail = `dni_${dni}@${SYNTHETIC_EMAIL_DOMAIN}`;

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: syntheticEmail,
    password,
    email_confirm: true,
    user_metadata: { dni: dniRaw, full_name: fullName },
  });

  if (createError || !created?.user) {
    const message = createError?.message ?? '';
    const yaExiste = /already.*registered|already exists/i.test(message);
    return jsonResponse({
      success: false,
      error: yaExiste ? 'Ya existe un acceso para este DNI' : (message || 'No se pudo crear el usuario'),
    }, 400);
  }

  const newUserId = created.user.id;

  // El trigger handle_new_user ya creó la fila en profiles (incluyendo dni)
  // al insertarse en auth.users. Asignamos el rol padre_familia.
  const { error: rolesInsertError } = await adminClient
    .from('user_roles')
    .insert({ user_id: newUserId, role_id: rolPadre.id, asignado_por: callerUser.user.id });

  if (rolesInsertError) {
    return jsonResponse({
      success: false,
      error: `Usuario creado pero no se pudo asignar el rol: ${rolesInsertError.message}`,
      user_id: newUserId,
    }, 207);
  }

  return jsonResponse({ success: true, user_id: newUserId });
});
