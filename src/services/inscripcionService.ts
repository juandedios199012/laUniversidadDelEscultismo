import { supabase } from '../lib/supabase';

/**
 * ======================================================================
 * 📝 INSCRIPCION SERVICE - CLIENTE DE MICROSERVICIO/API
 * ======================================================================
 * 
 * Este servicio actúa como un cliente puro de microservicio/API.
 * TODA la lógica de negocio reside en el backend (Supabase Database Functions).
 * ======================================================================
 */
export class InscripcionService {

  // ============= 📝 GESTIÓN DE INSCRIPCIONES ANUALES =============
  
  /**
   * 📝 Iniciar proceso de inscripción
   * Endpoint: POST /api/inscripciones/proceso
   */
  static async iniciarProceso(proceso: {
    año: number;
    fecha_inicio: string;
    fecha_fin: string;
    costo_inscripcion: number;
    rama: string;
    cupos_disponibles?: number;
    requisitos: string[];
    documentos_requeridos: string[];
    instrucciones: string;
  }): Promise<{ success: boolean; proceso_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('iniciar_proceso_inscripcion', {
          p_año: proceso.año,
          p_fecha_inicio: proceso.fecha_inicio,
          p_fecha_fin: proceso.fecha_fin,
          p_costo_inscripcion: proceso.costo_inscripcion,
          p_rama: proceso.rama,
          p_cupos_disponibles: proceso.cupos_disponibles,
          p_requisitos: proceso.requisitos,
          p_documentos_requeridos: proceso.documentos_requeridos,
          p_instrucciones: proceso.instrucciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al iniciar proceso:', error);
      throw error;
    }
  }

  /**
   * 📋 Procesar inscripción de scout
   * Endpoint: POST /api/inscripciones
   */
  static async procesarInscripcion(inscripcion: {
    scout_id: string;
    proceso_id: string;
    documentos_entregados: string[];
    observaciones?: string;
    responsable_inscripcion: string;
  }): Promise<{ success: boolean; inscripcion_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('procesar_inscripcion_scout', {
          p_scout_id: inscripcion.scout_id,
          p_proceso_id: inscripcion.proceso_id,
          p_documentos_entregados: inscripcion.documentos_entregados,
          p_observaciones: inscripcion.observaciones,
          p_responsable_inscripcion: inscripcion.responsable_inscripcion
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al procesar inscripción:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener estadísticas de inscripciones
   * Endpoint: GET /api/inscripciones/estadisticas
   */
  static async getEstadisticasInscripciones(año?: number): Promise<{
    total_inscritos: number;
    inscripciones_por_rama: Record<string, number>;
    documentos_pendientes: number;
    pagos_pendientes: number;
    cupos_ocupados: Record<string, { ocupados: number; disponibles: number }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_inscripciones', { p_año: año });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }
}

export default InscripcionService;