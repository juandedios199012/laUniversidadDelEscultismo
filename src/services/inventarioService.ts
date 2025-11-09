import { supabase } from '../lib/supabase';
import type { InventarioItem, MovimientoInventario } from '../lib/supabase';

/**
 * ======================================================================
 * 📦 INVENTARIO SERVICE - CLIENTE DE MICROSERVICIO/API
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
export class InventarioService {
  
  // ============= 📋 OPERACIONES CRUD BÁSICAS =============
  
  /**
   * 📦 Obtener todos los items del inventario
   * Endpoint: GET /api/inventario
   */
  static async getAllItems(): Promise<InventarioItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener inventario:', error);
      return [];
    }
  }

  /**
   * 🎯 Obtener items por categoría
   * Endpoint: GET /api/inventario/categoria/{categoria}
   */
  static async getItemsByCategory(categoria: string): Promise<InventarioItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .eq('categoria', categoria)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener items por categoría:', error);
      return [];
    }
  }

  /**
   * 🔍 Obtener item por ID
   * Endpoint: GET /api/inventario/{id}
   */
  static async getItemById(id: string): Promise<InventarioItem | null> {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener item:', error);
      return null;
    }
  }

  /**
   * ➕ Crear nuevo item
   * Endpoint: POST /api/inventario
   */
  static async createItem(item: {
    nombre: string;
    categoria: string;
    descripcion?: string;
    cantidad: number;
    cantidad_minima?: number;
    ubicacion?: string;
    responsable?: string;
    costo?: number;
    proveedor?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; item_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .insert({
          nombre: item.nombre,
          categoria: item.categoria,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          cantidad_minima: item.cantidad_minima || 1,
          ubicacion: item.ubicacion,
          responsable: item.responsable,
          costo: item.costo || 0,
          proveedor: item.proveedor,
          observaciones: item.observaciones,
          estado: 'disponible',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, item_id: data.id };
    } catch (error) {
      console.error('❌ Error al crear item:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * ✏️ Actualizar item existente
   * Endpoint: PUT /api/inventario/{id}
   */
  static async updateItem(id: string, updates: Partial<InventarioItem>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('inventario')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al actualizar item:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 🗑️ Eliminar item
   * Endpoint: DELETE /api/inventario/{id}
   */
  static async deleteItem(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('inventario')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al eliminar item:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // ============= 📊 MOVIMIENTOS Y TRANSACCIONES =============
  
  /**
   * 📝 Registrar movimiento de inventario
   * Endpoint: POST /api/inventario/movimientos
   */
  static async registrarMovimiento(movimiento: {
    item_id: string;
    tipo: 'entrada' | 'salida' | 'ajuste' | 'prestamo' | 'devolucion';
    cantidad: number;
    motivo?: string;
    responsable?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; movimiento_id?: string; nuevo_stock?: number; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_movimiento_inventario', {
          p_item_id: movimiento.item_id,
          p_tipo: movimiento.tipo,
          p_cantidad: movimiento.cantidad,
          p_motivo: movimiento.motivo,
          p_responsable: movimiento.responsable,
          p_observaciones: movimiento.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar movimiento:', error);
      throw error;
    }
  }

  /**
   * 📈 Obtener historial de movimientos
   * Endpoint: GET /api/inventario/movimientos
   */
  static async getMovimientos(filtros?: {
    item_id?: string;
    tipo?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    responsable?: string;
  }): Promise<MovimientoInventario[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_movimientos_inventario', { p_filtros: filtros || {} });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener movimientos:', error);
      throw error;
    }
  }

  /**
   * 🔄 Procesar préstamo de item
   * Endpoint: POST /api/inventario/prestamos
   */
  static async procesarPrestamo(prestamo: {
    item_id: string;
    cantidad: number;
    responsable: string;
    fecha_devolucion_esperada?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; prestamo_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('procesar_prestamo_inventario', {
          p_item_id: prestamo.item_id,
          p_cantidad: prestamo.cantidad,
          p_responsable: prestamo.responsable,
          p_fecha_devolucion_esperada: prestamo.fecha_devolucion_esperada,
          p_observaciones: prestamo.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al procesar préstamo:', error);
      throw error;
    }
  }

  /**
   * ↩️ Procesar devolución de préstamo
   * Endpoint: POST /api/inventario/devoluciones
   */
  static async procesarDevolucion(devolucion: {
    prestamo_id?: string;
    item_id: string;
    cantidad: number;
    responsable: string;
    estado_item?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; devolucion_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('procesar_devolucion_inventario', {
          p_prestamo_id: devolucion.prestamo_id,
          p_item_id: devolucion.item_id,
          p_cantidad: devolucion.cantidad,
          p_responsable: devolucion.responsable,
          p_estado_item: devolucion.estado_item,
          p_observaciones: devolucion.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al procesar devolución:', error);
      throw error;
    }
  }

  // ============= 📊 ANALYTICS Y REPORTES =============
  
  /**
   * 📊 Obtener resumen del inventario
   * Endpoint: GET /api/inventario/resumen
   */
  static async getResumenInventario(): Promise<{
    total_items: number;
    items_stock_bajo: number;
    total_movimientos_mes: number;
    categorias_resumen: Array<{
      categoria: string;
      cantidad_items: number;
      valor_total: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_resumen_inventario');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener resumen:', error);
      throw error;
    }
  }

  /**
   * ⚠️ Obtener items con stock bajo
   * Endpoint: GET /api/inventario/alertas
   */
  static async getItemsStockBajo(): Promise<InventarioItem[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_items_stock_bajo');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener items con stock bajo:', error);
      throw error;
    }
  }

  // Mantener compatibilidad con método existente
  static async getItemsBajoStock(): Promise<InventarioItem[]> {
    return this.getItemsStockBajo();
  }

  /**
   * 💰 Calcular valor total del inventario
   * Endpoint: GET /api/inventario/valoracion
   */
  static async calcularValorTotal(categoria?: string): Promise<{
    valor_total: number;
    cantidad_total_items: number;
    valor_por_categoria: Array<{
      categoria: string;
      valor: number;
      cantidad_items: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('calcular_valor_inventario', { p_categoria: categoria });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al calcular valor total:', error);
      throw error;
    }
  }
  // ============= 🔍 BÚSQUEDAS Y FILTROS =============
  
  /**
   * 🔎 Búsqueda avanzada de items
   * Endpoint: GET /api/inventario/buscar
   */
  static async buscarItems(criterios: {
    termino?: string;
    categoria?: string;
    ubicacion?: string;
    responsable?: string;
    stock_bajo?: boolean;
    rango_costo?: { min: number; max: number };
  }): Promise<InventarioItem[]> {
    try {
      const { data, error } = await supabase
        .rpc('buscar_items_inventario', { p_criterios: criterios });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      throw error;
    }
  }

  // Mantener compatibilidad con método existente
  static async searchItems(query: string): Promise<InventarioItem[]> {
    return this.buscarItems({ termino: query });
  }

  /**
   * 📦 Obtener items disponibles
   * Endpoint: GET /api/inventario/disponibles
   */
  static async getItemsDisponibles(): Promise<InventarioItem[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_items_disponibles');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener items disponibles:', error);
      throw error;
    }
  }

  /**
   * 📋 Obtener lista de categorías
   * Endpoint: GET /api/inventario/categorias
   */
  static async getCategorias(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_categorias_inventario');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener categorías:', error);
      throw error;
    }
  }

  /**
   * 📍 Obtener lista de ubicaciones
   * Endpoint: GET /api/inventario/ubicaciones
   */
  static async getUbicaciones(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_ubicaciones_inventario');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener ubicaciones:', error);
      throw error;
    }
  }

  /**
   * 📈 Obtener estadísticas de movimientos
   * Endpoint: GET /api/inventario/estadisticas
   */
  static async getEstadisticasMovimientos(periodo: 'semana' | 'mes' | 'trimestre' | 'año'): Promise<{
    total_movimientos: number;
    entradas: number;
    salidas: number;
    prestamos: number;
    devoluciones: number;
    movimientos_por_dia: Array<{
      fecha: string;
      cantidad: number;
      tipo: string;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_movimientos', { p_periodo: periodo });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }

  // Mantener compatibilidad con método existente
  static async getEstadisticas() {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_inventario_legacy');

      if (error) throw error;
      return data || {
        total: 0,
        bajoStock: 0,
        prestados: 0,
        disponibles: 0
      };
    } catch (error) {
      console.error('❌ Error al obtener estadísticas legacy:', error);
      throw error;
    }
  }

  /**
   * 🔄 Actualizar stock masivo
   * Endpoint: PUT /api/inventario/stock-masivo
   */
  static async actualizarStockMasivo(actualizaciones: Array<{
    item_id: string;
    nueva_cantidad: number;
    motivo?: string;
  }>): Promise<{ success: boolean; actualizados: number; errores: Array<{ item_id: string; error: string }> }> {
    try {
      const { data, error } = await supabase
        .rpc('actualizar_stock_masivo', { p_actualizaciones: actualizaciones });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error en actualización masiva:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener historial de item
   * Endpoint: GET /api/inventario/{id}/historial
   */
  static async getHistorialItem(itemId: string): Promise<MovimientoInventario[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_historial_item', { p_item_id: itemId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener historial:', error);
      throw error;
    }
  }

  /**
   * 🗂️ Generar reporte de inventario
   * Endpoint: GET /api/inventario/reporte
   */
  static async generarReporte(tipo: 'completo' | 'stock_bajo' | 'movimientos' | 'valoracion', filtros?: any): Promise<{
    reporte_id: string;
    url_descarga?: string;
    datos: any;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_inventario', { 
          p_tipo: tipo, 
          p_filtros: filtros || {} 
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar reporte:', error);
      throw error;
    }
  }

  // ============= 🔄 MÉTODOS DE COMPATIBILIDAD =============
  
  /**
   * 📦 Registrar préstamo (método legacy)
   */
  static async registrarPrestamo(itemId: string, cantidad: number, destinatario: string, observaciones?: string): Promise<any> {
    return this.procesarPrestamo({
      item_id: itemId,
      cantidad,
      responsable: destinatario,
      observaciones
    });
  }

  /**
   * ↩️ Registrar devolución (método legacy)
   */
  static async registrarDevolucion(itemId: string, cantidad: number, observaciones?: string): Promise<any> {
    return this.procesarDevolucion({
      item_id: itemId,
      cantidad,
      responsable: 'Sistema',
      observaciones
    });
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
 * 2. 📊 Validaciones y cálculos en el backend
 * 3. 🎯 Frontend solo maneja UI y llamadas a API
 * 4. 🔐 Seguridad manejada por RLS policies
 * 5. 📈 Optimización de consultas en PostgreSQL
 * 6. 🔄 Métodos de compatibilidad para migración gradual
 * 
 * Próximos pasos:
 * - Implementar todas las Database Functions correspondientes
 * - Agregar cache para consultas frecuentes
 * - Implementar paginación para listas grandes
 * - Agregar compression para reportes grandes
 * ======================================================================
 */

export default InventarioService;