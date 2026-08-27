// Login de Padres/Tutores por DNI (ver ver_hijos_login_solo_dni_padre.md)
//
// Supabase Auth exige un correo real para signInWithPassword/createUser, pero
// los Padres/Tutores solo tienen DNI (no todos tienen correo). La solución es
// un correo sintético derivado del DNI, que nunca se envía ni se muestra al
// usuario: el padre siempre ingresa su DNI, nunca este correo.
//
// IMPORTANTE: este mismo dominio está duplicado en
// supabase/functions/create-parent-user/index.ts porque las Edge Functions
// (Deno, deploy independiente) no pueden importar código de src/. Si cambias
// el dominio aquí, cámbialo también allá.
export const SYNTHETIC_EMAIL_DOMAIN = 'padres.interno';

/** Normaliza un DNI para usarlo como local-part de un correo (sin espacios, minúsculas, solo alfanumérico). */
export function sanitizeDni(dni: string): string {
  return dni.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function dniToSyntheticEmail(dni: string): string {
  return `${sanitizeDni(dni)}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

/** Un valor de login "parece DNI" si no tiene forma de correo electrónico. */
export function isLikelyDni(value: string): boolean {
  return !value.includes('@');
}

/**
 * Resuelve lo que el usuario escribió en el campo de login a un correo real
 * de auth.users: si parece DNI, lo convierte al correo sintético; si parece
 * correo, lo deja tal cual (dirigentes siguen entrando con su email real).
 */
export function resolveLoginEmail(identifier: string): string {
  const trimmed = identifier.trim();
  return isLikelyDni(trimmed) ? dniToSyntheticEmail(trimmed) : trimmed;
}
