import { supabase } from '../lib/supabase';

/**
 * ======================================================================
 * 💰 PRESUPUESTO SERVICE - CLIENTE DE MICROSERVICIO/API
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
export class PresupuestoService {

  // ============= 🏕️ GESTIÓN DE CAMPAMENTOS =============
  
  /**
   * 🏕️ Obtener todos los campamentos
   * Endpoint: GET /api/presupuestos/campamentos
   */
  static async getAllCampamentos(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('presupuesto_campamentos')
        .select('*')
        .order('fecha_inicio', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener campamentos:', error);
      return [];
    }
  }

  /**
   * 🎯 Obtener campamento por ID
   * Endpoint: GET /api/presupuestos/campamentos/{id}
   */
  static async getCampamentoById(id: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('presupuesto_campamentos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener campamento:', error);
      return null;
    }
  }

  /**
   * ➕ Crear nuevo campamento
   * Endpoint: POST /api/presupuestos/campamentos
   */
  static async createCampamento(campamento: {
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    ubicacion?: string;
    descripcion?: string;
    tarifa_joven?: number;
    tarifa_adulto?: number;
    cupos_maximos?: number;
  }): Promise<{ success: boolean; campamento_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('presupuesto_campamentos')
        .insert({
          nombre: campamento.nombre,
          fecha_inicio: campamento.fecha_inicio,
          fecha_fin: campamento.fecha_fin,
          ubicacion: campamento.ubicacion,
          descripcion: campamento.descripcion,
          tarifa_joven: campamento.tarifa_joven || 0,
          tarifa_adulto: campamento.tarifa_adulto || 0,
          cupos_maximos: campamento.cupos_maximos,
          estado: 'planificacion',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, campamento_id: data.id };
    } catch (error) {
      console.error('❌ Error al crear campamento:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * ✏️ Actualizar campamento
   * Endpoint: PUT /api/presupuestos/campamentos/{id}
   */
  static async updateCampamento(id: string, updates: any): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('presupuesto_campamentos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al actualizar campamento:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 🗑️ Eliminar campamento
   * Endpoint: DELETE /api/presupuestos/campamentos/{id}
   */
  static async deleteCampamento(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('presupuesto_campamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al eliminar campamento:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // ============= 👥 GESTIÓN DE PARTICIPANTES =============

  /**
   * 👥 Obtener participantes de un campamento
   * Endpoint: GET /api/presupuestos/campamentos/{id}/participantes
   */
  static async getParticipantesByCampamento(campamentoId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_participantes_campamento', { p_campamento_id: campamentoId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener participantes:', error);
      throw error;
    }
  }

  /**
   * ➕ Agregar participante a campamento
   * Endpoint: POST /api/presupuestos/participantes
   */
  static async addParticipante(participante: {
    campamento_id: string;
    scout_id?: string;
    nombre: string;
    apellido: string;
    tipo_participante: 'joven' | 'adulto';
    email?: string;
    telefono?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; participante_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('agregar_participante_campamento', {
          p_campamento_id: participante.campamento_id,
          p_scout_id: participante.scout_id,
          p_nombre: participante.nombre,
          p_apellido: participante.apellido,
          p_tipo_participante: participante.tipo_participante,
          p_email: participante.email,
          p_telefono: participante.telefono,
          p_observaciones: participante.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al agregar participante:', error);
      throw error;
    }
  }

  /**
   * ✏️ Actualizar participante
   * Endpoint: PUT /api/presupuestos/participantes/{id}
   */
  static async updateParticipante(id: string, updates: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('actualizar_participante_campamento', {
          p_participante_id: id,
          p_datos_actualizacion: updates
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al actualizar participante:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Eliminar participante
   * Endpoint: DELETE /api/presupuestos/participantes/{id}
   */
  static async deleteParticipante(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('eliminar_participante_campamento', { p_participante_id: id });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al eliminar participante:', error);
      throw error;
    }
  }

  // ============= 💸 GESTIÓN DE GASTOS =============
  
  /**
   * 💸 Obtener gastos de un campamento
   * Endpoint: GET /api/presupuestos/campamentos/{id}/gastos
   */
  static async getGastosByCampamento(campamentoId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_gastos_campamento', { p_campamento_id: campamentoId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener gastos:', error);
      throw error;
    }
  }

  /**
   * 💸 Registrar gasto de campamento
   * Endpoint: POST /api/presupuestos/gastos
   */
  static async registrarGasto(
    campamentoId: string,
    concepto: string,
    categoria: string,
    monto: number,
    descripcion?: string,
    proveedor?: string,
    responsable?: string
  ): Promise<{ success: boolean; gasto_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_gasto_campamento', {
          p_campamento_id: campamentoId,
          p_concepto: concepto,
          p_categoria: categoria,
          p_monto: monto,
          p_descripcion: descripcion,
          p_proveedor: proveedor,
          p_responsable: responsable
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar gasto:', error);
      throw error;
    }
  }

  /**
   * ✏️ Actualizar gasto
   * Endpoint: PUT /api/presupuestos/gastos/{id}
   */
  static async updateGasto(id: string, updates: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('actualizar_gasto_campamento', {
          p_gasto_id: id,
          p_datos_actualizacion: updates
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al actualizar gasto:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Eliminar gasto
   * Endpoint: DELETE /api/presupuestos/gastos/{id}
   */
  static async deleteGasto(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('eliminar_gasto_campamento', { p_gasto_id: id });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al eliminar gasto:', error);
      throw error;
    }
  }

  // ============= 💰 GESTIÓN DE PAGOS =============
  
  /**
   * 💰 Obtener pagos de participantes
   * Endpoint: GET /api/presupuestos/campamentos/{id}/pagos
   */
  static async getPagosByCampamento(campamentoId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_pagos_campamento', { p_campamento_id: campamentoId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener pagos:', error);
      throw error;
    }
  }

  /**
   * 💰 Registrar pago de participante
   * Endpoint: POST /api/presupuestos/pagos
   */
  static async registrarPago(pago: {
    campamento_id: string;
    participante_id: string;
    monto_pagado: number;
    fecha_pago?: string;
    metodo_pago?: string;
    comprobante?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; pago_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_pago_participante', {
          p_campamento_id: pago.campamento_id,
          p_participante_id: pago.participante_id,
          p_monto_pagado: pago.monto_pagado,
          p_fecha_pago: pago.fecha_pago || new Date().toISOString(),
          p_metodo_pago: pago.metodo_pago,
          p_comprobante: pago.comprobante,
          p_observaciones: pago.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar pago:', error);
      throw error;
    }
  }

  // ============= 📈 GESTIÓN DE INGRESOS ADICIONALES =============

  /**
   * 📈 Obtener ingresos adicionales
   * Endpoint: GET /api/presupuestos/campamentos/{id}/ingresos
   */
  static async getIngresosAdicionalesByCampamento(campamentoId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_ingresos_adicionales', { p_campamento_id: campamentoId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener ingresos adicionales:', error);
      throw error;
    }
  }

  /**
   * 📈 Registrar ingreso adicional
   * Endpoint: POST /api/presupuestos/ingresos
   */
  static async registrarIngresoAdicional(ingreso: {
    campamento_id: string;
    concepto: string;
    monto: number;
    fecha_ingreso?: string;
    descripcion?: string;
    responsable?: string;
  }): Promise<{ success: boolean; ingreso_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_ingreso_adicional', {
          p_campamento_id: ingreso.campamento_id,
          p_concepto: ingreso.concepto,
          p_monto: ingreso.monto,
          p_fecha_ingreso: ingreso.fecha_ingreso || new Date().toISOString(),
          p_descripcion: ingreso.descripcion,
          p_responsable: ingreso.responsable
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar ingreso adicional:', error);
      throw error;
    }
  }

  // ============= 📊 CÁLCULOS Y REPORTES =============

  /**
   * 💰 Calcular ingresos esperados
   * Endpoint: GET /api/presupuestos/campamentos/{id}/ingresos-esperados
   */
  static async calcularIngresosEsperados(campamentoId: string): Promise<{
    jovenes: number;
    adultos: number;
    ingresos_participantes: number;
    ingresos_adicionales: number;
    total_esperado: number;
    tarifa_joven: number;
    tarifa_adulto: number;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('calcular_ingresos_esperados', { p_campamento_id: campamentoId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al calcular ingresos esperados:', error);
      throw error;
    }
  }

  /**
   * 💸 Calcular gastos de campamento
   * Endpoint: GET /api/presupuestos/campamentos/{id}/gastos-calculados
   */
  static async calcularGastosCampamento(campamentoId: string): Promise<{
    total_gastos: number;
    gastos_pendientes: number;
    gastos_por_categoria: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('calcular_gastos_campamento', { p_campamento_id: campamentoId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al calcular gastos:', error);
      throw error;
    }
  }

  /**
   * 📊 Generar reporte financiero completo
   * Endpoint: GET /api/presupuestos/campamentos/{id}/reporte-financiero
   */
  static async generarReporteFinanciero(campamentoId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_financiero', { p_campamento_id: campamentoId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar reporte financiero:', error);
      throw error;
    }
  }

  /**
   * 📈 Obtener resumen de campamento
   * Endpoint: GET /api/presupuestos/campamentos/{id}/resumen
   */
  static async getResumenCampamento(campamentoId: string): Promise<{
    participantes: { jovenes: number; adultos: number; total: number };
    finanzas: { ingresos_esperados: number; gastos_total: number; balance: number };
    pagos: { recibidos: number; pendientes: number; porcentaje_cobrado: number };
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_resumen_campamento_completo', { p_campamento_id: campamentoId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener resumen del campamento:', error);
      throw error;
    }
  }

  // ============= 📊 ANALYTICS Y ESTADÍSTICAS =============
  
  /**
   * 📊 Obtener estadísticas generales de presupuestos
   * Endpoint: GET /api/presupuestos/estadisticas
   */
  static async getEstadisticasGenerales(): Promise<{
    campamentos_activos: number;
    total_ingresos_mes: number;
    total_gastos_mes: number;
    scouts_con_pagos_pendientes: number;
    campamentos_con_deficit: number;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_presupuestos');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas generales:', error);
      throw error;
    }
  }

  /**
   * 🔍 Obtener proyección financiera
   * Endpoint: GET /api/presupuestos/campamentos/{id}/proyeccion
   */
  static async getProyeccionFinanciera(campamentoId: string): Promise<{
    ingresos_proyectados: number;
    gastos_proyectados: number;
    balance_proyectado: number;
    recomendaciones: string[];
    alertas: Array<{
      tipo: 'warning' | 'error' | 'info';
      mensaje: string;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_proyeccion_financiera', { p_campamento_id: campamentoId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener proyección financiera:', error);
      throw error;
    }
  }

  /**
   * 📋 Obtener estado de pagos por participante
   * Endpoint: GET /api/presupuestos/campamentos/{id}/estado-pagos
   */
  static async getEstadoPagosParticipantes(campamentoId: string): Promise<Array<{
    participante_id: string;
    participante_nombre: string;
    monto_total_esperado: number;
    monto_total_pagado: number;
    monto_pendiente: number;
    estado_pago: 'completo' | 'parcial' | 'pendiente';
    ultimo_pago?: string;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estado_pagos_participantes', { p_campamento_id: campamentoId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener estado de pagos:', error);
      throw error;
    }
  }

  // ============= 🗂️ REPORTES Y EXPORTACIÓN =============
  
  /**
   * 🗂️ Generar reporte de campamento
   * Endpoint: GET /api/presupuestos/reportes/campamento
   */
  static async generarReporteCampamento(
    campamentoId: string, 
    tipo: 'financiero' | 'pagos' | 'gastos' | 'participantes' | 'completo'
  ): Promise<{
    reporte_id: string;
    url_descarga?: string;
    datos: any;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_campamento_detallado', {
          p_campamento_id: campamentoId,
          p_tipo_reporte: tipo
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar reporte:', error);
      throw error;
    }
  }

  /**
   * 📋 Obtener categorías de gastos
   * Endpoint: GET /api/presupuestos/categorias-gastos
   */
  static async getCategoriasGastos(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_categorias_gastos');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener categorías:', error);
      throw error;
    }
  }

  /**
   * 🔄 Procesar pago masivo
   * Endpoint: POST /api/presupuestos/pagos-masivos
   */
  static async procesarPagoMasivo(pagos: Array<{
    participante_id: string;
    campamento_id: string;
    monto_pagado: number;
    metodo_pago?: string;
    observaciones?: string;
  }>): Promise<{
    success: boolean;
    pagos_procesados: number;
    errores: Array<{ participante_id: string; error: string }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('procesar_pago_masivo_participantes', { p_pagos: pagos });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error en pago masivo:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener análisis comparativo de campamentos
   * Endpoint: GET /api/presupuestos/analisis-comparativo
   */
  static async getAnalisisComparativo(año?: number): Promise<Array<{
    campamento_nombre: string;
    participantes_total: number;
    ingresos_total: number;
    gastos_total: number;
    balance: number;
    rentabilidad_porcentaje: number;
    fecha_inicio: string;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_analisis_comparativo_campamentos', { p_año: año });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener análisis comparativo:', error);
      throw error;
    }
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
 * 2. 📊 Validaciones y cálculos financieros en el backend
 * 3. 🎯 Frontend solo maneja UI y llamadas a API
 * 4. 🔐 Seguridad manejada por RLS policies
 * 5. 📈 Optimización de consultas complejas en PostgreSQL
 * 6. 💰 Lógica financiera y contable en el backend
 * 7. 📊 Reportes y analytics procesados en el servidor
 * 
 * Próximos pasos:
 * - Implementar todas las Database Functions correspondientes
 * - Agregar validaciones de presupuesto y límites financieros
 * - Implementar notificaciones automáticas de pagos
 * - Agregar análisis predictivo de gastos y flujo de caja
 * - Implementar alertas de sobregasto y déficit
 * ======================================================================
 */

export default PresupuestoService;