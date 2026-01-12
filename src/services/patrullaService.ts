import { supabase } from '../lib/supabase';

/**
 * ======================================================================
 * 🦅 PATRULLA SERVICE - CLIENTE DE MICROSERVICIO/API
 * ======================================================================
 * 
 * Este servicio actúa como un cliente puro de microservicio/API.
 * TODA la lógica de negocio reside en el backend (Supabase Database Functions).
 * ======================================================================
 */
export class PatrullaService {

  // ============= 🦅 GESTIÓN DE PATRULLAS =============
  
  /**
   * 🦅 Crear nueva patrulla
   * Endpoint: POST /api/patrullas
   */
  static async crearPatrulla(patrulla: { nombre: string; rama: string }): Promise<{ success: boolean; patrulla_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('crear_patrulla', {
          p_nombre: patrulla.nombre,
          p_rama: patrulla.rama
        });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al crear patrulla:', error);
      throw error;
    }
  }

  /**
   * 📋 Obtener todas las patrullas
   * Endpoint: GET /api/patrullas
   */
  static async getPatrullas(filtros?: {
    rama?: string;
    activas_solo?: boolean;
  }): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_patrullas', { p_filtros: filtros || {} });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener patrullas:', error);
      throw error;
    }
  }

  /**
   * 🎯 Obtener patrulla por ID
   * Endpoint: GET /api/patrullas/{id}
   */
  static async getPatrullaById(id: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_patrulla_por_id', { p_patrulla_id: id });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener patrulla:', error);
      throw error;
    }
  }

  // ============= 👥 GESTIÓN DE MIEMBROS =============
  
  /**
   * 👤 Agregar scout a patrulla
   * Endpoint: POST /api/patrullas/{id}/miembros
   */
  static async agregarMiembro(patrullaId: string, scoutId: string, cargo?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('agregar_miembro_patrulla', {
          p_patrulla_id: patrullaId,
          p_scout_id: scoutId,
          p_cargo: cargo
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al agregar miembro:', error);
      throw error;
    }
  }

  /**
   * 👥 Obtener miembros de patrulla
   * Endpoint: GET /api/patrullas/{id}/miembros
   */
  static async getMiembrosPatrulla(patrullaId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_miembros_patrulla', { p_patrulla_id: patrullaId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener miembros:', error);
      throw error;
    }
  }

  /**
   * 👑 Asignar guía de patrulla
   * Endpoint: PUT /api/patrullas/{id}/guia
   */
  static async asignarGuia(patrullaId: string, scoutId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('asignar_guia_patrulla', {
          p_patrulla_id: patrullaId,
          p_scout_id: scoutId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al asignar guía:', error);
      throw error;
    }
  }

  // ============= 🏆 SISTEMA DE PUNTOS =============
  
  /**
   * 🏆 Registrar puntos para patrulla
   * Endpoint: POST /api/patrullas/puntos
   */
  static async registrarPuntos(registro: {
    patrulla_id: string;
    concepto: string;
    puntos: number;
    categoria: string;
    fecha?: string;
    responsable?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; registro_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_puntos_patrulla', {
          p_patrulla_id: registro.patrulla_id,
          p_concepto: registro.concepto,
          p_puntos: registro.puntos,
          p_categoria: registro.categoria,
          p_fecha: registro.fecha || new Date().toISOString(),
          p_responsable: registro.responsable,
          p_observaciones: registro.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar puntos:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener ranking de patrullas
   * Endpoint: GET /api/patrullas/ranking
   */
  static async getRankingPatrullas(periodo?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    rama?: string;
  }): Promise<Array<{
    patrulla_id: string;
    nombre: string;
    total_puntos: number;
    posicion: number;
    puntos_por_categoria: Record<string, number>;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_ranking_patrullas', { p_periodo: periodo || {} });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener ranking:', error);
      throw error;
    }
  }

  // ============= 🎯 ACTIVIDADES Y PROYECTOS =============
  
  /**
   * 🎯 Crear proyecto de patrulla
   * Endpoint: POST /api/patrullas/proyectos
   */
  static async crearProyecto(proyecto: {
    patrulla_id: string;
    nombre: string;
    descripcion: string;
    objetivo: string;
    fecha_inicio: string;
    fecha_fin_estimada: string;
    responsable_scout_id?: string;
    categoria: string;
    recursos_necesarios?: string[];
    presupuesto_estimado?: number;
  }): Promise<{ success: boolean; proyecto_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('crear_proyecto_patrulla', {
          p_patrulla_id: proyecto.patrulla_id,
          p_nombre: proyecto.nombre,
          p_descripcion: proyecto.descripcion,
          p_objetivo: proyecto.objetivo,
          p_fecha_inicio: proyecto.fecha_inicio,
          p_fecha_fin_estimada: proyecto.fecha_fin_estimada,
          p_responsable_scout_id: proyecto.responsable_scout_id,
          p_categoria: proyecto.categoria,
          p_recursos_necesarios: proyecto.recursos_necesarios || [],
          p_presupuesto_estimado: proyecto.presupuesto_estimado
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al crear proyecto:', error);
      throw error;
    }
  }

  /**
   * 📋 Obtener proyectos de patrulla
   * Endpoint: GET /api/patrullas/{id}/proyectos
   */
  static async getProyectosPatrulla(patrullaId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_proyectos_patrulla', { p_patrulla_id: patrullaId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener proyectos:', error);
      throw error;
    }
  }

  // ============= 💰 GESTIÓN FINANCIERA =============
  
  /**
   * 💰 Registrar ingreso de patrulla
   * Endpoint: POST /api/patrullas/finanzas/ingresos
   */
  static async registrarIngreso(ingreso: {
    patrulla_id: string;
    concepto: string;
    monto: number;
    fecha: string;
    fuente: string;
    observaciones?: string;
  }): Promise<{ success: boolean; ingreso_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_ingreso_patrulla', {
          p_patrulla_id: ingreso.patrulla_id,
          p_concepto: ingreso.concepto,
          p_monto: ingreso.monto,
          p_fecha: ingreso.fecha,
          p_fuente: ingreso.fuente,
          p_observaciones: ingreso.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar ingreso:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener balance financiero
   * Endpoint: GET /api/patrullas/{id}/balance
   */
  static async getBalancePatrulla(patrullaId: string): Promise<{
    saldo_actual: number;
    ingresos_mes: number;
    gastos_mes: number;
    proyectos_pendientes_costo: number;
    recomendaciones: string[];
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_balance_patrulla', { p_patrulla_id: patrullaId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener balance:', error);
      throw error;
    }
  }

  // ============= 📊 REPORTES Y ESTADÍSTICAS =============
  
  /**
   * 📊 Obtener estadísticas de patrulla
   * Endpoint: GET /api/patrullas/{id}/estadisticas
   */
  static async getEstadisticasPatrulla(patrullaId: string): Promise<{
    miembros_activos: number;
    promedio_asistencia: number;
    proyectos_completados: number;
    proyectos_activos: number;
    total_puntos_año: number;
    posicion_ranking: number;
    especialidades_obtenidas: number;
    actividades_participadas: number;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_patrulla', { p_patrulla_id: patrullaId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }

  /**
   * 🗂️ Generar reporte de patrulla
   * Endpoint: GET /api/patrullas/{id}/reporte
   */
  static async generarReportePatrulla(patrullaId: string, tipo: 'general' | 'puntos' | 'finanzas' | 'proyectos'): Promise<{
    reporte_id: string;
    datos: any;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_patrulla', {
          p_patrulla_id: patrullaId,
          p_tipo: tipo
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar reporte:', error);
      throw error;
    }
  }
}

/**
 * ======================================================================
 * 📝 NOTAS DE IMPLEMENTACIÓN
 * ======================================================================
 * 
 * Sistema completo de gestión de patrullas con:
 * - Gestión de miembros y cargos
 * - Sistema de puntos y competencias
 * - Proyectos y actividades propias
 * - Gestión financiera autónoma
 * - Reportes y estadísticas detalladas
 * ======================================================================
 */

export default PatrullaService;