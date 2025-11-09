import { supabase } from '../lib/supabase';

/**
 * ======================================================================
 * 📊 REPORTS SERVICE - CLIENTE DE MICROSERVICIO/API
 * ======================================================================
 * 
 * Este servicio actúa como un cliente puro de microservicio/API.
 * TODA la lógica de negocio y cálculos residen en el backend (Supabase Database Functions).
 * ======================================================================
 */
export class ReportsService {

  // ============= 📊 REPORTES SCOUTS =============
  
  /**
   * 📋 Reporte general de scouts
   * Endpoint: GET /api/reports/scouts/general
   */
  static async getReporteGeneralScouts(): Promise<{
    total_scouts: number;
    scouts_por_rama: Record<string, number>;
    scouts_por_genero: Record<string, number>;
    scouts_activos: number;
    scouts_inactivos: number;
    nuevas_inscripciones_mes: number;
    promedio_asistencia: number;
    distribución_edades: Array<{
      rango_edad: string;
      cantidad: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_general_scouts');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar reporte general:', error);
      throw error;
    }
  }

  /**
   * 📈 Reporte de asistencia
   * Endpoint: GET /api/reports/asistencia
   */
  static async getReporteAsistencia(filtros?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    rama?: string;
    scout_id?: string;
  }): Promise<{
    promedio_asistencia_general: number;
    asistencia_por_rama: Record<string, number>;
    scouts_con_baja_asistencia: Array<{
      scout_id: string;
      nombre: string;
      porcentaje_asistencia: number;
    }>;
    tendencia_asistencia: Array<{
      mes: string;
      porcentaje: number;
    }>;
    detalles_por_reunion: Array<{
      fecha: string;
      tipo_reunion: string;
      total_inscritos: number;
      total_asistentes: number;
      porcentaje: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_asistencia', { p_filtros: filtros || {} });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar reporte de asistencia:', error);
      throw error;
    }
  }

  /**
   * 🏆 Reporte de progresión
   * Endpoint: GET /api/reports/progresion
   */
  static async getReporteProgresion(): Promise<{
    scouts_por_especialidad: Record<string, number>;
    insignias_otorgadas_mes: number;
    logros_pendientes: Array<{
      scout_id: string;
      nombre: string;
      logros_pendientes: number;
      tiempo_promedio_logro: number;
    }>;
    progresion_por_rama: Record<string, {
      scouts_total: number;
      scouts_progresando: number;
      porcentaje_progresion: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_progresion');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar reporte de progresión:', error);
      throw error;
    }
  }

  /**
   * 🎯 Reporte de actividades
   * Endpoint: GET /api/reports/actividades
   */
  static async getReporteActividades(periodo?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<{
    total_actividades: number;
    actividades_por_tipo: Record<string, number>;
    promedio_participacion: number;
    actividades_mas_exitosas: Array<{
      nombre: string;
      participantes: number;
      satisfaccion: number;
      fecha: string;
    }>;
    scouts_mas_participativos: Array<{
      scout_id: string;
      nombre: string;
      actividades_participadas: number;
    }>;
    evaluacion_objetivos: Array<{
      actividad: string;
      objetivos_cumplidos: number;
      objetivos_totales: number;
      porcentaje_cumplimiento: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_actividades', { p_periodo: periodo || {} });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar reporte de actividades:', error);
      throw error;
    }
  }

  /**
   * 💰 Reporte financiero
   * Endpoint: GET /api/reports/financiero
   */
  static async getReporteFinanciero(): Promise<{
    ingresos_totales: number;
    gastos_totales: number;
    balance: number;
    ingresos_por_concepto: Record<string, number>;
    gastos_por_categoria: Record<string, number>;
    flujo_caja_mensual: Array<{
      mes: string;
      ingresos: number;
      gastos: number;
      balance: number;
    }>;
    presupuestos_vs_ejecutado: Array<{
      categoria: string;
      presupuestado: number;
      ejecutado: number;
      porcentaje_ejecucion: number;
    }>;
    scouts_morosos: Array<{
      scout_id: string;
      nombre: string;
      monto_pendiente: number;
      meses_atraso: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_financiero');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar reporte financiero:', error);
      throw error;
    }
  }

  /**
   * 👥 Reporte de patrullas
   * Endpoint: GET /api/reports/patrullas
   */
  static async getReportePatrullas(): Promise<{
    ranking_patrullas: Array<{
      patrulla_id: string;
      nombre: string;
      puntos_totales: number;
      posicion: number;
    }>;
    participacion_por_patrulla: Record<string, number>;
    proyectos_activos: Array<{
      patrulla: string;
      proyectos_activos: number;
      proyectos_completados: number;
    }>;
    liderazgo_efectividad: Array<{
      patrulla: string;
      guia_patrulla: string;
      sub_guia: string;
      evaluacion_liderazgo: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_patrullas');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar reporte de patrullas:', error);
      throw error;
    }
  }

  /**
   * 🎓 Reporte de dirigentes
   * Endpoint: GET /api/reports/dirigentes
   */
  static async getReporteDirigentes(): Promise<{
    total_dirigentes: number;
    dirigentes_por_cargo: Record<string, number>;
    formacion_completada: Array<{
      dirigente_id: string;
      nombre: string;
      cursos_completados: number;
      cursos_pendientes: number;
      porcentaje_formacion: number;
    }>;
    evaluaciones_360: Array<{
      dirigente_id: string;
      nombre: string;
      promedio_evaluacion: number;
      areas_fortaleza: string[];
      areas_mejora: string[];
    }>;
    disponibilidad_actividades: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_dirigentes');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar reporte de dirigentes:', error);
      throw error;
    }
  }

  /**
   * 📈 Dashboard ejecutivo
   * Endpoint: GET /api/reports/dashboard
   */
  static async getDashboardEjecutivo(): Promise<{
    kpis_principales: {
      scouts_activos: number;
      asistencia_promedio: number;
      satisfaccion_actividades: number;
      balance_financiero: number;
    };
    tendencias: {
      crecimiento_scouts: number;
      retencion_rate: number;
      actividad_mensual: number;
    };
    alertas: Array<{
      tipo: 'warning' | 'danger' | 'info';
      mensaje: string;
      modulo: string;
      prioridad: number;
    }>;
    comparativo_periodo_anterior: {
      scouts: { actual: number; anterior: number; variacion: number };
      asistencia: { actual: number; anterior: number; variacion: number };
      actividades: { actual: number; anterior: number; variacion: number };
      ingresos: { actual: number; anterior: number; variacion: number };
    };
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_dashboard_ejecutivo');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar dashboard ejecutivo:', error);
      throw error;
    }
  }

  /**
   * 📄 Exportar reporte personalizado
   * Endpoint: POST /api/reports/custom
   */
  static async exportarReportePersonalizado(configuracion: {
    tipo: 'scouts' | 'actividades' | 'financiero' | 'patrullas' | 'dirigentes';
    formato: 'pdf' | 'excel' | 'csv';
    filtros: Record<string, any>;
    campos: string[];
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<{ url_descarga: string; nombre_archivo: string }> {
    try {
      const { data, error } = await supabase
        .rpc('exportar_reporte_personalizado', { p_configuracion: configuracion });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al exportar reporte personalizado:', error);
      throw error;
    }
  }

  /**
   * 📊 Generar análisis predictivo
   * Endpoint: GET /api/reports/predictivo
   */
  static async getAnalisisPredictivo(): Promise<{
    proyeccion_scouts: Array<{
      mes: string;
      proyeccion_inscripciones: number;
      proyeccion_bajas: number;
      scouts_estimados: number;
    }>;
    riesgo_desercion: Array<{
      scout_id: string;
      nombre: string;
      probabilidad_desercion: number;
      factores_riesgo: string[];
    }>;
    oportunidades_crecimiento: Array<{
      area: string;
      potencial_mejora: number;
      acciones_recomendadas: string[];
    }>;
    tendencias_satisfaccion: Array<{
      periodo: string;
      satisfaccion_promedio: number;
      prediccion_siguiente: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_analisis_predictivo');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar análisis predictivo:', error);
      throw error;
    }
  }
}

export default ReportsService;