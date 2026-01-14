// ==========================================
// CONFIGURACIÓN SUPABASE COMPARTIDA
// Usada por Web y Mobile
// ==========================================

export const SUPABASE_CONFIG = {
  // Estas variables deben estar en .env en la raíz
  // y en mobile/.env
  url: process.env.VITE_SUPABASE_URL || '',
  anonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
};

// Validar que existan las credenciales
if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
  console.warn('⚠️ Supabase credentials not found in environment variables');
}
