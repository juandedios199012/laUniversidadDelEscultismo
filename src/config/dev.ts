// ============================================================================
// CONFIGURACIÓN DE DESARROLLO
// ============================================================================
//
// Modo 1 — VITE_DEV_SKIP_AUTH=true
//   Sin sesión real de Supabase. Usa DEV_USER mock (role: super_admin).
//   Las lecturas de la BD pueden fallar si RLS no permite anon.
//   Las mutaciones (RPC) son simuladas en servicios con shouldSkipAuth().
//   ÚSALO PARA: desarrollo de UI puro sin necesidad de datos reales.
//
// Modo 2 — VITE_DEV_EMAIL + VITE_DEV_PASSWORD  (recomendado)
//   Auto-login silencioso con una cuenta real de Supabase.
//   Crea sesión autenticada real → todas las RPC funcionan.
//   Sin pantalla de login. Sesión persistida en localStorage.
//   ÚSALO PARA: desarrollo completo con datos reales de la BD.
//
// Ambas variables van en .env.local (gitignoreado, NUNCA commitear).
// ============================================================================

/** Detecta si estamos en localhost */
export const isLocalhost = () =>
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

/**
 * Modo 1: bypass de UI sin sesión real.
 * Activo solo cuando VITE_DEV_SKIP_AUTH=true en .env.local Y en localhost.
 */
export const shouldSkipAuth = () =>
  import.meta.env.VITE_DEV_SKIP_AUTH === 'true' && isLocalhost();

/**
 * Modo 2: auto-login silencioso con credenciales reales.
 * Requiere VITE_DEV_EMAIL y VITE_DEV_PASSWORD en .env.local.
 * Solo activo en localhost y cuando NO se usa skipAuth.
 */
export const shouldAutoLogin = () =>
  isLocalhost() &&
  !shouldSkipAuth() &&
  !!import.meta.env.VITE_DEV_EMAIL &&
  !!import.meta.env.VITE_DEV_PASSWORD;

export const DEV_AUTO_EMAIL    = import.meta.env.VITE_DEV_EMAIL    as string | undefined;
export const DEV_AUTO_PASSWORD = import.meta.env.VITE_DEV_PASSWORD as string | undefined;

/**
 * Usuario mock para Modo 1 (skipAuth).
 * Solo se usa cuando shouldSkipAuth() === true.
 * En producción este objeto nunca se utiliza.
 */
export const DEV_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@localhost',
  name: 'Usuario Desarrollo',
  avatar_url: undefined,
  role: 'super_admin' as const,
};

