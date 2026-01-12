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
      desarrollo: string;
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
      // Normalizar rama para coincidir con el ENUM (primera mayúscula, resto minúscula)
      const normalizarRama = (rama: string) => {
        if (!rama) return '';
        return rama.charAt(0).toUpperCase() + rama.slice(1).toLowerCase();
      };
      // Crear programa principal
      const { data: programaData, error: programaError } = await supabase
        .from('programa_semanal')
        .insert([{
          codigo_programa: `PS${String(Date.now()).slice(-6)}`,
          fecha_inicio: programa.fecha_inicio,
          fecha_fin: programa.fecha_fin,
          tema_central: programa.tema_central,
          rama: normalizarRama(programa.rama),
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
          desarrollo: act.desarrollo,
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
      desarrollo: string;
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
      if (programa.responsable_programa) updateData.responsable_programa = programa.responsable_programa;
      if (programa.observaciones_generales) updateData.observaciones_generales = programa.observaciones_generales;
      updateData.updated_at = new Date().toISOString();

      // 1. Actualizar programa principal
      const { error: errorPrograma } = await supabase
        .from('programa_semanal')
        .update(updateData)
        .eq('id', id);
      if (errorPrograma) throw errorPrograma;

      // 2. Sincronizar actividades (borrar, insertar, actualizar)
      if (Array.isArray(programa.actividades)) {
        // Obtener actividades actuales
        const { data: actividadesActuales, error: errorGet } = await supabase
          .from('programa_actividades')
          .select('id')
          .eq('programa_id', id);
        if (errorGet) throw errorGet;
        const idsActuales = (actividadesActuales || []).map((a: any) => a.id);
        const idsNuevos = programa.actividades.map((a: any) => a.id).filter(Boolean);

        // Eliminar actividades que ya no existen
        const idsAEliminar = idsActuales.filter((idA: string) => !idsNuevos.includes(idA));
        if (idsAEliminar.length > 0) {
          const { error: errorDelete } = await supabase
            .from('programa_actividades')
            .delete()
            .in('id', idsAEliminar);
          if (errorDelete) throw errorDelete;
        }

        // Insertar o actualizar actividades
        for (let i = 0; i < programa.actividades.length; i++) {
          const act = programa.actividades[i];
          const actividadData = {
            programa_id: id,
            nombre: act.nombre,
            desarrollo: act.desarrollo,
            hora_inicio: act.hora_inicio,
            duracion_minutos: act.duracion_minutos,
            responsable: act.responsable,
            materiales: act.materiales || [],
            observaciones: act.observaciones,
            orden_ejecucion: i + 1
          };
          if (act.id) {
            // Actualizar existente
            const { error: errorUpdate } = await supabase
              .from('programa_actividades')
              .update(actividadData)
              .eq('id', act.id);
            if (errorUpdate) throw errorUpdate;
          } else {
            // Insertar nueva
            const { error: errorInsert } = await supabase
              .from('programa_actividades')
              .insert([actividadData]);
            if (errorInsert) throw errorInsert;
          }
        }
      }

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

  // ============= 🏆 GESTIÓN DE PUNTAJES POR PATRULLA =============

  /**
   * 🏆 Registrar puntaje de una patrulla en una actividad
   */
  static async registrarPuntaje(puntaje: {
    actividad_id: string;
    patrulla_id: string;
    puntaje: number;
    observaciones?: string;
    registrado_por?: string;
  }): Promise<{ success: boolean; puntaje_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('api_registrar_puntaje_actividad', {
          p_actividad_id: puntaje.actividad_id,
          p_patrulla_id: puntaje.patrulla_id,
          p_puntaje: puntaje.puntaje,
          p_observaciones: puntaje.observaciones || null,
          p_registrado_por: puntaje.registrado_por || null
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar puntaje:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 🏆 Registrar puntajes masivos (todas las patrullas de una actividad)
   */
  static async registrarPuntajesMasivo(data: {
    actividad_id: string;
    puntajes: Array<{
      patrulla_id: string;
      puntaje: number;
      observaciones?: string;
    }>;
    registrado_por?: string;
  }): Promise<{ success: boolean; puntajes_registrados?: number; error?: string }> {
    try {
      const { data: result, error } = await supabase
        .rpc('api_registrar_puntajes_masivo', {
          p_actividad_id: data.actividad_id,
          p_puntajes: data.puntajes,
          p_registrado_por: data.registrado_por || null
        });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('❌ Error al registrar puntajes masivo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 📊 Obtener puntajes de una actividad
   */
  static async obtenerPuntajesActividad(actividad_id: string): Promise<Array<{
    id: string;
    patrulla_id: string;
    patrulla_nombre: string;
    patrulla_color: string;
    animal_totem: string;
    puntaje: number;
    observaciones?: string;
    registrado_por?: string;
    fecha_registro: string;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('api_obtener_puntajes_actividad', {
          p_actividad_id: actividad_id
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener puntajes:', error);
      return [];
    }
  }

  /**
   * 🏆 Obtener totales de puntajes por patrulla para un programa
   */
  static async obtenerTotalesPrograma(programa_id: string): Promise<Array<{
    patrulla_id: string;
    patrulla_nombre: string;
    color_patrulla: string;
    total_puntaje: number;
    actividades_participadas: number;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('api_obtener_totales_programa', {
          p_programa_id: programa_id
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener totales:', error);
      return [];
    }
  }

  /**
   * 📋 Obtener patrullas activas por rama
   */
  static async obtenerPatrullasActivas(rama: string): Promise<Array<{
    id: string;
    nombre: string;
    color_patrulla: string;
    animal_totem: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('patrullas')
        .select('id, nombre, color_patrulla, animal_totem')
        .eq('rama', rama)
        .eq('estado', 'ACTIVO')
        .order('nombre');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener patrullas:', error);
      return [];
    }
  }
}

export default ProgramaSemanalService;