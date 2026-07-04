import { supabase } from '../lib/supabase';

// ================================================================
// 📄 Servicio: Gestión de Documentos Administrativos (Cartas)
// ================================================================

export interface Institucion {
  id?: string;
  nombre_institucion: string;
  direccion?: string;
  encargado_nombre?: string;
  encargado_cargo?: string;
  telefono?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EventoCarta {
  id?: string;
  titulo?: string;
  dinamico_actividad: string;
  dinamico_dias?: string;
  dinamico_horas?: string;
  dinamico_partida?: string;
  dinamico_jovenes?: string;
  dinamico_adultos?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlantillaCarta {
  id?: string;
  nombre?: string;
  parrafo_presentacion?: string;
  parrafo_responsabilidad?: string;
  parrafo_despedida?: string;
  frase_cierre?: string;
  logo_url?: string;
  emblema_url?: string;
  carta_prefijo?: string;
  firma_nombre?: string;
  firma_cargo?: string;
  firma_dni?: string;
  firma_registro?: string;
  firma_url_imagen?: string;
  instagram?: string;
  facebook?: string;
  activa?: boolean;
}

type Ok<T> = { success: true } & T;
type Err = { success: false; error: string };

function fail(err: unknown, ctx: string): Err {
  console.error(`❌ ${ctx}:`, err);
  return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
}

export class DocumentosService {
  // ============= INSTITUCIONES =============
  static async listarInstituciones(soloActivos = false): Promise<Institucion[]> {
    try {
      const { data, error } = await supabase.rpc('api_listar_instituciones', {
        p_activos_solo: soloActivos,
      });
      if (error) throw error;
      const result = data as { success: boolean; data?: Institucion[]; error?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return result.data || [];
    } catch (err) {
      fail(err, 'Error al listar instituciones');
      return [];
    }
  }

  static async guardarInstitucion(inst: Institucion): Promise<Ok<{ id?: string }> | Err> {
    try {
      const { data, error } = await supabase.rpc('api_guardar_institucion', { p_datos: inst });
      if (error) throw error;
      const result = data as { success: boolean; id?: string; error?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return { success: true, id: result.id };
    } catch (err) {
      return fail(err, 'Error al guardar institución');
    }
  }

  static async eliminarInstitucion(id: string): Promise<Ok<{}> | Err> {
    try {
      const { data, error } = await supabase.rpc('api_eliminar_institucion', { p_id: id });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return { success: true };
    } catch (err) {
      return fail(err, 'Error al eliminar institución');
    }
  }

  // ============= EVENTOS =============
  static async listarEventos(): Promise<EventoCarta[]> {
    try {
      const { data, error } = await supabase.rpc('api_listar_eventos_carta');
      if (error) throw error;
      const result = data as { success: boolean; data?: EventoCarta[]; error?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return result.data || [];
    } catch (err) {
      fail(err, 'Error al listar eventos');
      return [];
    }
  }

  static async guardarEvento(evento: EventoCarta): Promise<Ok<{ id?: string }> | Err> {
    try {
      const { data, error } = await supabase.rpc('api_guardar_evento_carta', { p_datos: evento });
      if (error) throw error;
      const result = data as { success: boolean; id?: string; error?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return { success: true, id: result.id };
    } catch (err) {
      return fail(err, 'Error al guardar evento');
    }
  }

  static async eliminarEvento(id: string): Promise<Ok<{}> | Err> {
    try {
      const { data, error } = await supabase.rpc('api_eliminar_evento_carta', { p_id: id });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return { success: true };
    } catch (err) {
      return fail(err, 'Error al eliminar evento');
    }
  }

  // ============= PLANTILLA =============
  static async obtenerPlantilla(): Promise<PlantillaCarta | null> {
    try {
      const { data, error } = await supabase.rpc('api_obtener_plantilla_carta');
      if (error) throw error;
      const result = data as { success: boolean; data?: PlantillaCarta; error?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return result.data || null;
    } catch (err) {
      fail(err, 'Error al obtener plantilla');
      return null;
    }
  }

  static async guardarPlantilla(plantilla: PlantillaCarta): Promise<Ok<{ id?: string }> | Err> {
    try {
      const { data, error } = await supabase.rpc('api_guardar_plantilla_carta', { p_datos: plantilla });
      if (error) throw error;
      const result = data as { success: boolean; id?: string; error?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return { success: true, id: result.id };
    } catch (err) {
      return fail(err, 'Error al guardar plantilla');
    }
  }
}

export default DocumentosService;
