import { supabase } from '../lib/supabase';

/**
 * ======================================================================
 * 📅 PROGRAMA SEMANAL SERVICE - CLIENTE DIRECTO SUPABASE
 * ======================================================================
 * 
 * Este servicio conecta directamente con las tablas de Supabase.
 * CRUD completo para programa_semanal y programa_actividades.
 * ======================================================================
 */
export class ProgramaSemanalService {

  // ============= 📅 GESTIÓN DE PROGRAMAS SEMANALES =============
  
  /**
   * 📅 Crear programa semanal
   * Endpoint: POST /api/programa-semanal
   */
  static async crearPrograma(programa: {
    fecha_inicio: string;
    fecha_fin: string;
    tema_central: string;
    rama: string;
    objetivos: string[];
    actividades: Array<{
      nombre: string;
      descripcion: string;
      hora_inicio: string;
      duracion_minutos: number;
      responsable?: string;
      materiales?: string[];
      observaciones?: string;
    }>;
    responsable_programa: string;
    observaciones_generales?: string;
  }): Promise<{ success: boolean; programa_id?: string; error?: string }> {
    try {
      // Crear programa principal
      const { data: programaData, error: programaError } = await supabase
        .from('programa_semanal')
        .insert([{
          codigo_programa: `PS${String(Date.now()).slice(-6)}`,
          fecha_inicio: programa.fecha_inicio,
          fecha_fin: programa.fecha_fin,
          tema_central: programa.tema_central,
          rama: programa.rama,
          objetivos: programa.objetivos,
          responsable_programa: programa.responsable_programa,
          observaciones_generales: programa.observaciones_generales,
          estado: 'PLANIFICADO'
        }])
        .select()
        .single();

      if (programaError) throw programaError;

      // Crear actividades asociadas
      if (programa.actividades && programa.actividades.length > 0) {
        const actividadesData = programa.actividades.map((act, index) => ({
          programa_id: programaData.id,
          nombre: act.nombre,
          descripcion: act.descripcion,
          hora_inicio: act.hora_inicio,
          duracion_minutos: act.duracion_minutos,
          responsable: act.responsable,
          materiales: act.materiales || [],
          observaciones: act.observaciones,
          orden_ejecucion: index + 1
        }));

        const { error: actividadesError } = await supabase
          .from('programa_actividades')
          .insert(actividadesData);

        if (actividadesError) throw actividadesError;
      }

      return { success: true, programa_id: programaData.id };
    } catch (error) {
      console.error('❌ Error al crear programa:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 📋 Obtener programas semanales
   * Endpoint: GET /api/programa-semanal
   */
  static async getProgramas(filtros?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    rama?: string;
    responsable?: string;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('programa_semanal')
        .select(`
          *,
          programa_actividades (*)
        `)
        .order('fecha_inicio', { ascending: false });

      // Aplicar filtros si existen
      if (filtros?.rama) {
        query = query.eq('rama', filtros.rama);
      }
      if (filtros?.fecha_desde) {
        query = query.gte('fecha_inicio', filtros.fecha_desde);
      }
      if (filtros?.fecha_hasta) {
        query = query.lte('fecha_fin', filtros.fecha_hasta);
      }
      if (filtros?.responsable) {
        query = query.ilike('responsable_programa', `%${filtros.responsable}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener programas:', error);
      return [];
    }
  }

  /**
   * 🎯 Obtener programa por ID
   * Endpoint: GET /api/programa-semanal/{id}
   */
  static async getProgramaById(id: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_programa_semanal_por_id', { p_programa_id: id });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener programa:', error);
      throw error;
    }
  }

  /**
   * 📊 Registrar evaluación del programa
   * Endpoint: POST /api/programa-semanal/evaluaciones
   */
  static async registrarEvaluacion(evaluacion: {
    programa_id: string;
    evaluador: string;
    cumplimiento_objetivos: number;
    participacion_scouts: number;
    calidad_actividades: number;
    uso_tiempo: number;
    satisfaccion_general: number;
    aspectos_positivos: string[];
    aspectos_mejora: string[];
    recomendaciones: string[];
    observaciones?: string;
  }): Promise<{ success: boolean; evaluacion_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_evaluacion_programa', {
          p_programa_id: evaluacion.programa_id,
          p_evaluador: evaluacion.evaluador,
          p_puntuaciones: {
            cumplimiento_objetivos: evaluacion.cumplimiento_objetivos,
            participacion_scouts: evaluacion.participacion_scouts,
            calidad_actividades: evaluacion.calidad_actividades,
            uso_tiempo: evaluacion.uso_tiempo,
            satisfaccion_general: evaluacion.satisfaccion_general
          },
          p_aspectos_positivos: evaluacion.aspectos_positivos,
          p_aspectos_mejora: evaluacion.aspectos_mejora,
          p_recomendaciones: evaluacion.recomendaciones,
          p_observaciones: evaluacion.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar evaluación:', error);
      throw error;
    }
  }

  /**
   * ✏️ Actualizar programa semanal
   * Operación directa con tabla programa_semanal
   */
  static async updatePrograma(id: string, programa: {
    fecha_inicio?: string;
    fecha_fin?: string;
    tema_central?: string;
    rama?: string;
    objetivos?: string[];
    actividades?: Array<{
      nombre: string;
      descripcion: string;
      hora_inicio: string;
      duracion_minutos: number;
      responsable?: string;
      materiales?: string[];
      observaciones?: string;
    }>;
    responsable_programa?: string;
    observaciones_generales?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};
      
      if (programa.fecha_inicio) updateData.fecha_inicio = programa.fecha_inicio;
      if (programa.fecha_fin) updateData.fecha_fin = programa.fecha_fin;
      if (programa.tema_central) updateData.tema_central = programa.tema_central;
      if (programa.rama) updateData.rama = programa.rama;
      if (programa.objetivos) updateData.objetivos = programa.objetivos;
      if (programa.actividades) updateData.actividades = programa.actividades;
      if (programa.responsable_programa) updateData.responsable_programa = programa.responsable_programa;
      if (programa.observaciones_generales) updateData.observaciones_generales = programa.observaciones_generales;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('programa_semanal')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al actualizar programa:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 🗑️ Eliminar programa semanal
   * Operación directa con tabla programa_semanal
   */
  static async deletePrograma(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('programa_semanal')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al eliminar programa:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 📊 Obtener estadísticas de programas
   * Endpoint: GET /api/programa-semanal/estadisticas
   */
  static async getEstadisticasProgramas(): Promise<{
    programas_planificados: number;
    programas_ejecutados: number;
    promedio_evaluacion: number;
    temas_mas_utilizados: Array<{ tema: string; frecuencia: number }>;
    responsables_activos: number;
    distribucion_por_rama: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_programas');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }
}

export default ProgramaSemanalService;