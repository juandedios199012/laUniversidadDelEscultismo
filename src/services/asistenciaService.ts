
import { supabase } from '../lib/supabase';

/**
 * ======================================================================
 * 📊 ASISTENCIA SERVICE - CLIENTE DE MICROSERVICIO/API
 * ======================================================================
 * 
 * Este servicio actúa como un cliente puro de microservicio/API.
 * TODA la lógica de negocio reside en el backend (Supabase Database Functions).
 * 
 * Principios arquitectónicos:
 * - ❌ NO hay lógica de negocio en el frontend
 * - ✅ Solo llamadas a Database Functions
 * - ✅ Manejo consistente de errores
 * - ✅ Tipado fuerte para todas las operaciones
 * - ✅ Documentación clara de cada endpoint
 * ======================================================================
 */
export class AsistenciaService {
  /**
   * 📊 Registrar asistencia masiva
   * Endpoint: POST /api/asistencia/masiva
   */
  static async registrarAsistenciaMasiva(registros: Array<{
    reunion_id: string;
    scout_id: string;
    estado: 'presente' | 'ausente' | 'tardanza' | 'excusado';
    hora_llegada?: string;
    observaciones?: string;
    registrado_por?: string;
  }>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('asistencias')
        .insert(registros);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al registrar asistencia masiva:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }
  // ...otros métodos de la clase...

  /**
   * 📋 Obtener todas las reuniones
   * Endpoint: GET /api/asistencia/reuniones
   */
  static async getReuniones(filtros?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    rama?: string;
    tipo_actividad?: string;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('programa_semanal')
        .select('*');

      if (filtros?.fecha_desde) {
        query = query.gte('fecha_inicio', filtros.fecha_desde);
      }

      if (filtros?.fecha_hasta) {
        query = query.lte('fecha_fin', filtros.fecha_hasta);
      }

      if (filtros?.rama) {
        query = query.eq('rama', filtros.rama);
      }

      // No hay tipo_actividad en programa_semanal, se omite ese filtro

      const { data, error } = await query.order('fecha_inicio', { ascending: false });

      if (error) throw error;
      // Mapear los campos para que coincidan con la interfaz Reunion
      return (data || []).map((row: any) => ({
        id: row.id,
        fecha: row.fecha_inicio,
        titulo: row.tema_central,
        descripcion: row.objetivos ? row.objetivos.join(', ') : '',
        rama: row.rama,
        tipo_actividad: 'reunion_semanal',
        ubicacion: '',
        hora_inicio: '',
        hora_fin: '',
        responsable: row.responsable_programa || '',
        total_invitados: undefined,
        asistencias_registradas: undefined
      }));
    } catch (error) {
      console.error('❌ Error al obtener reuniones:', error);
      return [];
    }
  }

  /**
   * 🎯 Obtener reunión por ID
   * Endpoint: GET /api/asistencia/reuniones/{id}
   */
  static async getReunionById(id: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('inscripciones')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener reunión:', error);
      return null;
    }
  }

  /**
   * ✏️ Actualizar reunión
   * Endpoint: PUT /api/asistencia/reuniones/{id}
   */
  static async updateReunion(id: string, updates: any): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('inscripciones')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al actualizar reunión:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 🗑️ Eliminar reunión
   * Endpoint: DELETE /api/asistencia/reuniones/{id}
   */
  static async deleteReunion(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('inscripciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al eliminar reunión:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // ============= ✅ GESTIÓN DE ASISTENCIAS =============
  
  /**
   * ✅ Registrar asistencia
   * Endpoint: POST /api/asistencia/registros
   */
  static async registrarAsistencia(asistencia: {
    reunion_id: string;
    scout_id: string;
    estado: 'presente' | 'ausente' | 'tardanza' | 'excusado';
    hora_llegada?: string;
    observaciones?: string;
    registrado_por?: string;
  }): Promise<{ success: boolean; asistencia_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('asistencias')
        .insert({
          reunion_id: asistencia.reunion_id,
          scout_id: asistencia.scout_id,
          estado: asistencia.estado,
          hora_llegada: asistencia.hora_llegada,
          observaciones: asistencia.observaciones,
          registrado_por: asistencia.registrado_por,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, asistencia_id: data.id };
    } catch (error) {
      console.error('❌ Error al registrar asistencia:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }



  /**
   * 📋 Obtener asistencias de una reunión
   * Endpoint: GET /api/asistencia/reuniones/{id}/asistencias
   */
  static async getAsistenciasReunion(reunionId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_asistencias_reunion', { p_reunion_id: reunionId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener asistencias:', error);
      throw error;
    }
  }

  /**
   * 👤 Obtener historial de asistencias de un scout
   * Endpoint: GET /api/asistencia/scouts/{id}/historial
   */
  static async getHistorialAsistenciaScout(scoutId: string, filtros?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    tipo_actividad?: string;
  }): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_historial_asistencia_scout', {
          p_scout_id: scoutId,
          p_filtros: filtros || {}
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener historial:', error);
      throw error;
    }
  }

  /**
   * ✏️ Actualizar asistencia
   * Endpoint: PUT /api/asistencia/registros/{id}
   */
  static async updateAsistencia(id: string, updates: {
    estado?: 'presente' | 'ausente' | 'tardanza' | 'excusado';
    hora_llegada?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('asistencias')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al actualizar asistencia:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // ============= 📊 REPORTES Y ESTADÍSTICAS =============
  
  /**
   * 📊 Obtener estadísticas de asistencia por scout
   * Endpoint: GET /api/asistencia/scouts/{id}/estadisticas
   */
  static async getEstadisticasAsistenciaScout(scoutId: string, periodo?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<{
    total_reuniones: number;
    asistencias: number;
    ausencias: number;
    tardanzas: number;
    excusados: number;
    porcentaje_asistencia: number;
    racha_asistencia_actual: number;
    racha_ausencia_actual: number;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_asistencia_scout', {
          p_scout_id: scoutId,
          p_periodo: periodo || {}
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas de scout:', error);
      throw error;
    }
  }

  /**
   * 📈 Obtener estadísticas generales de asistencia
   * Endpoint: GET /api/asistencia/estadisticas
   */
  static async getEstadisticasGenerales(filtros?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    rama?: string;
  }): Promise<{
    total_reuniones: number;
    promedio_asistencia: number;
    scouts_activos: number;
    scouts_irregulares: number;
    reunion_mejor_asistencia: {
      titulo: string;
      fecha: string;
      porcentaje: number;
    };
    scouts_mejor_asistencia: Array<{
      scout_id: string;
      nombre_completo: string;
      porcentaje_asistencia: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('api_obtener_estadisticas_generales', { p_filtros: filtros || {} });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas generales:', error);
      throw error;
    }
  }

  /**
   * 📋 Obtener reporte de asistencia por reunión
   * Endpoint: GET /api/asistencia/reuniones/{id}/reporte
   */
  static async getReporteAsistenciaReunion(reunionId: string): Promise<{
    reunion_info: {
      titulo: string;
      fecha: string;
      total_invitados: number;
    };
    resumen: {
      presentes: number;
      ausentes: number;
      tardanzas: number;
      excusados: number;
      porcentaje_asistencia: number;
    };
    detalle_scouts: Array<{
      scout_id: string;
      nombre_completo: string;
      rama: string;
      estado: string;
      hora_llegada?: string;
      observaciones?: string;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_reporte_asistencia_reunion', { p_reunion_id: reunionId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener reporte de asistencia por reunión:', error);
      throw error;
    }
  }
    /**
     * ======================================================================
     * 📝 NOTAS DE IMPLEMENTACIÓN
     * ======================================================================
     * 
     * Este servicio implementa el patrón de arquitectura de microservicio/API:
     * 
     * 1. 🔄 TODAS las operaciones usan Database Functions
     * 2. 📊 Lógica de asistencia y estadísticas en el backend
      scouts_activos: number;
    }>;
    tendencia_general: 'creciente' | 'estable' | 'decreciente';
    alertas: Array<{
      tipo: 'warning' | 'error' | 'info';
      mensaje: string;
      scouts_afectados?: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_tendencias_asistencia', { p_periodo: periodo });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener tendencias:', error);
      throw error;
    }
  }

  // ============= ⚠️ ALERTAS Y SEGUIMIENTO =============
  
  /**
   * ⚠️ Obtener scouts con asistencia irregular
   * Endpoint: GET /api/asistencia/alertas/irregulares
   */
  static async getScoutsAsistenciaIrregular(umbral_porcentaje: number = 70): Promise<Array<{
    scout_id: string;
    nombre_completo: string;
    rama: string;
    porcentaje_asistencia: number;
    ausencias_consecutivas: number;
    ultima_asistencia: string;
    recomendacion: string;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_scouts_asistencia_irregular', { p_umbral_porcentaje: umbral_porcentaje });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener scouts irregulares:', error);
      throw error;
    }
  }

  /**
   * 🎯 Obtener scouts destacados por asistencia
   * Endpoint: GET /api/asistencia/destacados
   */
  static async getScoutsDestacados(periodo?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<Array<{
    scout_id: string;
    nombre_completo: string;
    rama: string;
    porcentaje_asistencia: number;
    racha_actual: number;
    reconocimiento_sugerido: string;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_scouts_destacados_asistencia', { p_periodo: periodo || {} });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener scouts destacados:', error);
      throw error;
    }
  }

  // ============= 🗂️ REPORTES Y EXPORTACIÓN =============
  
  /**
   * 🗂️ Generar reporte de asistencia
   * Endpoint: GET /api/asistencia/reportes
   */
  static async generarReporteAsistencia(
    tipo: 'por_reunion' | 'por_scout' | 'por_periodo' | 'estadisticas',
    parametros: {
      reunion_id?: string;
      scout_id?: string;
      fecha_desde?: string;
      fecha_hasta?: string;
      rama?: string;
      formato?: 'json' | 'csv' | 'pdf';
    }
  ): Promise<{
    reporte_id: string;
    url_descarga?: string;
    datos: any;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_asistencia', {
          p_tipo: tipo,
          p_parametros: parametros
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar reporte:', error);
      throw error;
    }
  }

  /**
   * 📅 Obtener calendario de asistencias
   * Endpoint: GET /api/asistencia/calendario
   */
  static async getCalendarioAsistencias(filtros: {
    fecha_desde: string;
    fecha_hasta: string;
    scout_id?: string;
    rama?: string;
  }): Promise<Array<{
    fecha: string;
    reuniones: Array<{
      reunion_id: string;
      titulo: string;
      estado_asistencia?: 'presente' | 'ausente' | 'tardanza' | 'excusado';
      hora_inicio?: string;
      ubicacion?: string;
    }>
  }>> {
    // Implementación pendiente
    return [];
  }
}

/**
 * ======================================================================
 * 📝 NOTAS DE IMPLEMENTACIÓN
 * ======================================================================
 * 
 * Este servicio implementa el patrón de arquitectura de microservicio/API:
 * 
 * 1. 🔄 TODAS las operaciones usan Database Functions
 * 2. 📊 Lógica de asistencia y estadísticas en el backend
 * 3. 🎯 Frontend solo maneja UI y llamadas a API
 * 4. 🔐 Seguridad manejada por RLS policies
 * 5. 📈 Cálculos de tendencias y patrones en PostgreSQL
 * 6. ⚠️ Sistema de alertas automático
 * 7. 📊 Reportes complejos procesados en el servidor
 * 
 * Características especiales:
 * - Registro masivo de asistencias para eficiencia
 * - Detección automática de patrones irregulares
 * - Sistema de reconocimiento por asistencia destacada
 * - Notificaciones configurables por umbral
 * - Calendario integrado de asistencias
 * 
 * Próximos pasos:
 * - Implementar todas las Database Functions correspondientes
 * - Agregar integración con sistema de notificaciones
 * - Implementar análisis predictivo de asistencia
 * - Agregar gamificación por asistencia perfecta
 * ======================================================================
 */
export default AsistenciaService;