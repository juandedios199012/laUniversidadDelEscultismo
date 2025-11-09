import { supabase } from '../lib/supabase';

/**
 * ======================================================================
 * 🏕️ GRUPO SCOUT SERVICE - CLIENTE DE MICROSERVICIO/API
 * ======================================================================
 * 
 * Este servicio actúa como un cliente puro de microservicio/API.
 * TODA la lógica de negocio reside en el backend (Supabase Database Functions).
 * ======================================================================
 */
export class GrupoScoutService {

  // ============= 🏕️ GESTIÓN DE GRUPOS SCOUT =============
  
  /**
   * 🏕️ Crear nuevo grupo scout
   * Endpoint: POST /api/grupos-scout
   */
  static async crearGrupo(grupo: {
    nombre: string;
    numeral: string;
    localidad: string;
    region: string;
    fecha_fundacion: string;
    fundador: string;
    lugar_reunion: string;
    patrocinadores?: Array<{
      nombre: string;
      tipo: string;
      contacto: string;
    }>;
  }): Promise<{ success: boolean; grupo_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('crear_grupo_scout', {
          p_nombre: grupo.nombre,
          p_numeral: grupo.numeral,
          p_localidad: grupo.localidad,
          p_region: grupo.region,
          p_fecha_fundacion: grupo.fecha_fundacion,
          p_fundador: grupo.fundador,
          p_lugar_reunion: grupo.lugar_reunion,
          p_patrocinadores: grupo.patrocinadores || []
        });

      if (error) throw error;
      return { success: true, grupo_id: data?.grupo_id };
    } catch (error) {
      console.error('❌ Error al crear grupo scout:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 📋 Obtener todos los grupos scout
   * Endpoint: GET /api/grupos-scout
   */
  static async getAllGrupos(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_grupos_scout');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener grupos scout:', error);
      return [];
    }
  }

  /**
   * 🎯 Obtener grupo por ID
   * Endpoint: GET /api/grupos-scout/{id}
   */
  static async getGrupoById(grupoId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_grupo_scout_por_id', { p_grupo_id: grupoId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener grupo scout:', error);
      return null;
    }
  }

  /**
   * ✏️ Actualizar grupo scout
   * Endpoint: PUT /api/grupos-scout/{id}
   */
  static async actualizarGrupo(grupoId: string, grupo: {
    nombre?: string;
    numeral?: string;
    localidad?: string;
    region?: string;
    fecha_fundacion?: string;
    fundador?: string;
    lugar_reunion?: string;
    patrocinadores?: Array<{
      nombre: string;
      tipo: string;
      contacto: string;
    }>;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('actualizar_grupo_scout', {
          p_grupo_id: grupoId,
          p_datos: grupo
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al actualizar grupo scout:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 🗑️ Eliminar grupo scout
   * Endpoint: DELETE /api/grupos-scout/{id}
   */
  static async eliminarGrupo(grupoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('eliminar_grupo_scout', { p_grupo_id: grupoId });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al eliminar grupo scout:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 📊 Obtener estadísticas del grupo
   * Endpoint: GET /api/grupos-scout/{id}/estadisticas
   */
  static async getEstadisticasGrupo(grupoId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_grupo', { p_grupo_id: grupoId });

      if (error) throw error;
      return data || {};
    } catch (error) {
      console.error('❌ Error al obtener estadísticas del grupo:', error);
      return {};
    }
  }

  /**
   * 🎯 Buscar grupos por criterios
   * Endpoint: GET /api/grupos-scout/buscar
   */
  static async buscarGrupos(criterios: {
    buscar_texto?: string;
    region?: string;
    estado?: string;
  }): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('buscar_grupos_scout', { p_criterios: criterios });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al buscar grupos scout:', error);
      return [];
    }
  }

  /**
   * 🏆 Agregar patrocinador al grupo
   * Endpoint: POST /api/grupos-scout/{id}/patrocinadores
   */
  static async agregarPatrocinador(grupoId: string, patrocinador: {
    nombre: string;
    tipo: string;
    contacto: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('agregar_patrocinador_grupo', {
          p_grupo_id: grupoId,
          p_patrocinador: patrocinador
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al agregar patrocinador:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 🗑️ Eliminar patrocinador del grupo
   * Endpoint: DELETE /api/grupos-scout/{id}/patrocinadores/{patrocinadorId}
   */
  static async eliminarPatrocinador(grupoId: string, patrocinadorId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('eliminar_patrocinador_grupo', {
          p_grupo_id: grupoId,
          p_patrocinador_id: patrocinadorId
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al eliminar patrocinador:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }
}

export default GrupoScoutService;