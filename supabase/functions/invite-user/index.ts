// Edge Function: invite-user
//
// Crea una cuenta real en Supabase Auth para un nuevo usuario (invitación
// administrada, no auto-registro) y le asigna rol(es) en user_roles.
//
// Requiere, como secrets de esta función (nunca en el bundle del frontend):
//   SUPABASE_URL                (autoinyectado por Supabase)
//   SUPABASE_SERVICE_ROLE_KEY   (configurar con `supabase secrets set`)
//
// Despliegue:
//   supabase functions deploy invite-user
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role key del Dashboard>
//
// Invocación desde el frontend:
//   supabase.functions.invoke('invite-user', { body: { email, full_name, role_ids } })

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface InviteUserBody {
  email: string;
  full_name: string;
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
    return jsonResponse({ success: false, error: 'No tienes permiso para invitar usuarios' }, 403);
  }

  let body: InviteUserBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: 'Body inválido' }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  const fullName = body.full_name?.trim();
  const roleIds = Array.isArray(body.role_ids) ? body.role_ids.filter(Boolean) : [];

  if (!email || !fullName) {
    return jsonResponse({ success: false, error: 'email y full_name son requeridos' }, 400);
  }
  if (roleIds.length === 0) {
    return jsonResponse({ success: false, error: 'Selecciona al menos un rol' }, 400);
  }

  // Cliente admin: usa la service_role key, bypassa RLS, único con permiso
  // para invitar usuarios reales en auth.users.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  });

  if (inviteError || !invited?.user) {
    return jsonResponse({ success: false, error: inviteError?.message ?? 'No se pudo invitar al usuario' }, 400);
  }

  const newUserId = invited.user.id;

  // El trigger handle_new_user ya creó la fila en profiles al insertarse
  // en auth.users. Asignamos los roles solicitados.
  const { error: rolesError } = await adminClient
    .from('user_roles')
    .insert(roleIds.map((roleId) => ({
      user_id: newUserId,
      role_id: roleId,
      asignado_por: callerUser.user.id,
    })));

  if (rolesError) {
    return jsonResponse({
      success: false,
      error: `Usuario invitado pero no se pudieron asignar roles: ${rolesError.message}`,
      user_id: newUserId,
    }, 207);
  }

  return jsonResponse({ success: true, user_id: newUserId });
});
