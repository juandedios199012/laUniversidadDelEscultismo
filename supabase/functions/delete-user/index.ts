// Edge Function: delete-user
//
// Elimina definitivamente una cuenta de Supabase Auth (y por cascada su fila
// en profiles y user_roles). A diferencia de toggleActivoUsuario (que solo
// desactiva sin perder el rastro), esto es irreversible.
//
// Si el usuario tiene registros en audit_log (o fue quien asignó un rol a
// otra persona, referenciado en user_roles.asignado_por), Postgres rechaza
// el borrado por la FK — se necesita limpiar esas referencias primero.
//
// Requiere, como secrets de esta función (nunca en el bundle del frontend):
//   SUPABASE_URL                (autoinyectado por Supabase)
//   SUPABASE_SERVICE_ROLE_KEY   (configurar con `supabase secrets set`)
//
// Despliegue:
//   supabase functions deploy delete-user
//
// Invocación desde el frontend:
//   supabase.functions.invoke('delete-user', { body: { user_id } })

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    return jsonResponse({ success: false, error: 'No tienes permiso para eliminar usuarios' }, 403);
  }

  let body: { user_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: 'Body inválido' }, 400);
  }

  const userId = body.user_id?.trim();
  if (!userId) {
    return jsonResponse({ success: false, error: 'user_id es requerido' }, 400);
  }
  if (userId === callerUser.user.id) {
    return jsonResponse({ success: false, error: 'No puedes eliminar tu propia cuenta' }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

  if (deleteError) {
    const esViolacionFk = /foreign key|violates|referenced/i.test(deleteError.message ?? '');
    return jsonResponse({
      success: false,
      error: esViolacionFk
        ? 'No se pudo eliminar: este usuario tiene historial (auditoría o roles que asignó a otros) que lo referencia. Hay que limpiar esos registros primero.'
        : (deleteError.message || 'No se pudo eliminar el usuario'),
    }, 400);
  }

  return jsonResponse({ success: true });
});
