import { supabase } from '../lib/supabase';

// ================================================================
// TIPOS
// ================================================================

export interface HijoInfo {
  scout_id: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  foto_url: string | null;
  fecha_nacimiento: string | null;
  codigo_asociado: string | null;
  rama_actual: string;
  estado: string;
  parentesco: string;
}

// ================================================================
// SERVICIO
// ================================================================

export class PortalPadresService {
  /**
   * Obtener lista de scouts (hijos) vinculados al usuario autenticado.
   * La función SQL valida que solo se devuelvan scouts cuyo familiar
   * tiene el mismo correo que el usuario autenticado (SECURITY DEFINER).
   */
  static async getMisHijos(
    userId: string
  ): Promise<{ data: HijoInfo[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc(
        'api_portal_padres_mis_hijos',
        { p_user_id: userId }
      );

      if (error) {
        console.error('❌ Error al obtener mis hijos:', error);
        return { data: null, error: error.message };
      }

      if (!data?.success) {
        return { data: null, error: data?.error || 'Error al obtener datos' };
      }

      const hijos: HijoInfo[] = Array.isArray(data.data) ? data.data : [];
      return { data: hijos, error: null };
    } catch (err) {
      console.error('❌ Error inesperado en PortalPadresService:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Error desconocido',
      };
    }
  }
}

export default PortalPadresService;
