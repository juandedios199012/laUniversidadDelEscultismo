import { supabase } from '../lib/supabase';
import type { Scout } from '../lib/supabase';

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

/** Campos que un padre puede editar de su hijo — sin rama/patrulla/código/estado (paso "Scout", administrativo). */
export interface ActualizarHijoData {
  nombres?: string;
  apellidos?: string;
  fecha_nacimiento?: string;
  tipo_documento?: string;
  numero_documento?: string;
  sexo?: 'MASCULINO' | 'FEMENINO';
  celular?: string;
  celular_secundario?: string;
  telefono?: string;
  correo?: string;
  correo_secundario?: string;
  correo_institucional?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
  direccion_completa?: string;
  ubicacion_latitud?: number | null;
  ubicacion_longitud?: number | null;
  codigo_postal?: string;
  centro_estudio?: string;
  anio_estudios?: string;
  ocupacion?: string;
  centro_laboral?: string;
  religion?: string;
  estatura_cm?: number | null;
  peso_kg?: number | null;
  grupo_sanguineo?: string;
  factor_sanguineo?: string;
  seguro_medico?: string;
  tipo_discapacidad?: string;
  carnet_conadis?: string;
  descripcion_discapacidad?: string;
  condiciones?: Array<{ condicion?: string; fecha_atencion?: string }>;
  alergias?: Array<{ alergia?: string; mencionar?: string }>;
  medicamentos?: Array<{ medicamento?: string; dosis?: string; frecuencia?: string; activo?: boolean; fecha_inicio_duracion?: string }>;
  vacunas?: Array<{ vacuna?: string; fecha_ultima_dosis?: string }>;
  familiares?: Array<{
    id?: string;
    nombres: string;
    apellidos: string;
    sexo?: string;
    tipo_documento?: string;
    numero_documento?: string;
    parentesco: string;
    celular?: string;
    correo?: string;
    profesion?: string;
    centro_laboral?: string;
    cargo?: string;
    usar_direccion_scout?: boolean;
    direccion?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    es_contacto_emergencia?: boolean;
    es_apoderado?: boolean;
  }>;
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

  /**
   * Obtiene el registro completo de un hijo (mismo shape que usa el
   * wizard de dirigentes) para precargar el diálogo de edición completa.
   * La función SQL verifica que el scout pertenezca al usuario autenticado.
   */
  static async getHijoCompleto(scoutId: string): Promise<Scout | null> {
    try {
      const { data, error } = await supabase.rpc('api_portal_padres_obtener_hijo_completo', {
        p_scout_id: scoutId,
      });

      if (error || !data?.success) {
        console.error('❌ Error al obtener hijo completo:', error ?? data?.errors);
        return null;
      }

      return data.data ?? null;
    } catch (err) {
      console.error('❌ Error inesperado obteniendo hijo completo:', err);
      return null;
    }
  }

  /**
   * Actualiza los datos de un hijo (Personal, Contacto, Familiares,
   * Educación, Religión, Salud). Deliberadamente NO acepta rama_actual/
   * codigo_asociado/fecha_ingreso/estado — esos son administrativos
   * (paso "Scout"), y quedan fuera del tipo a propósito para que sea
   * imposible mandarlos desde este formulario. La función SQL además
   * verifica que el scout pertenezca al usuario autenticado antes de
   * guardar nada.
   */
  static async actualizarHijo(
    scoutId: string,
    updates: ActualizarHijoData,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('api_portal_padres_actualizar_hijo', {
        p_scout_id: scoutId,
        p_data: updates,
      });

      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Error al guardar los cambios' };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }
}

export default PortalPadresService;
