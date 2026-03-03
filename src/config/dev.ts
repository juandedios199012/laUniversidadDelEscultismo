// ============================================================================
// CONFIGURACIÓN DE DESARROLLO
// ============================================================================
// Cambiar estos valores según necesidad durante desarrollo local
// ============================================================================

/**
 * Si es true, permite usar la app sin login en localhost
 * Útil cuando Supabase redirige a URLs de producción
 */
export const DEV_SKIP_AUTH = true;

/**
 * Detecta si estamos en entorno de desarrollo (localhost)
 */
export const isLocalhost = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
};

/**
 * Devuelve true si debemos saltar la autenticación
 */
export const shouldSkipAuth = () => {
  return DEV_SKIP_AUTH && isLocalhost();
};

/**
 * Usuario mock para desarrollo local sin auth
 * Tiene rol super_admin para acceso completo durante desarrollo
 */
export const DEV_USER = {
  id: 'dev-user-001',
  email: 'dev@localhost',
  name: 'Usuario Desarrollo',
  avatar_url: undefined,
  role: 'super_admin' as const
};
