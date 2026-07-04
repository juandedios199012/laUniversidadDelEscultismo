/**
 * Finanzas Service
 * Maneja todas las operaciones financieras: ingresos, egresos, préstamos
 */

import { supabase } from '@/lib/supabase';

// ============= TIPOS =============

export type TipoTransaccion = 'INGRESO' | 'EGRESO' | 'PRESTAMO_RECIBIDO' | 'PRESTAMO_DEVUELTO';

export type CategoriaFinanzas = 
  // Ingresos
  | 'CUOTA_INSCRIPCION' | 'CUOTA_MENSUAL' | 'CUOTA_ACTIVIDAD' | 'DONACION' 
  | 'VENTA_PRODUCTOS' | 'RIFAS' | 'OTROS_INGRESOS'
  // Egresos
  | 'MATERIALES' | 'ALIMENTACION' | 'TRANSPORTE' | 'ALQUILER_EQUIPOS' 
  | 'UNIFORMES' | 'PRIMEROS_AUXILIOS' | 'PUBLICIDAD' | 'EMERGENCIA' 
  | 'SERVICIOS' | 'OTROS_EGRESOS';

export type EstadoPrestamo = 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'CANCELADO';

export type MetodoPago = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA' | 'TARJETA' | 'OTRO';

export interface ResumenFinanciero {
  ingresos: number;
  egresos: number;
  balance: number;
  prestamos_pendientes: number;
  saldo_disponible: number;
}

export interface Transaccion {
  id: string;
  tipo: TipoTransaccion;
  categoria: CategoriaFinanzas;
  monto: number;
  monto_cubierto?: number;
  concepto: string;
  descripcion?: string;
  proveedor_beneficiario?: string;
  fecha_transaccion: string;
  metodo_pago?: MetodoPago;
  numero_operacion?: string;
  notas?: string;
  responsable_nombre?: string;
  evidencias_count?: number;
}

export interface NuevaTransaccion {
  tipo: TipoTransaccion;
  categoria: CategoriaFinanzas;
  monto: number;
  monto_cubierto?: number;
  concepto: string;
  descripcion?: string;
  proveedor_beneficiario?: string;
  fecha_transaccion: string;
  cuenta_id?: string;
  actividad_id?: string;
  responsable_id?: string;
  metodo_pago?: MetodoPago;
  numero_operacion?: string;
  notas?: string;
  // Datos de préstamo (si aplica)
  prestamista_id?: string;
  prestamista_nombre?: string;
  prestamista_tipo?: 'DIRIGENTE' | 'PADRE' | 'SCOUT' | 'EXTERNO';
  fecha_vencimiento?: string;
  motivo_prestamo?: string;
}

export interface Prestamo {
  id: string;
  monto_prestado: number;
  monto_devuelto: number;
  saldo_pendiente: number;
  estado: EstadoPrestamo;
  fecha_prestamo: string;
  fecha_vencimiento?: string;
  fecha_devolucion_completa?: string;
  motivo?: string;
  prestamista_tipo: string;
  prestamista_nombre: string;
  transaccion_concepto?: string;
}

export interface EstadisticaCategoria {
  categoria: CategoriaFinanzas;
  total: number;
  cantidad: number;
}

// ============= CONTABILIDAD POR PERSONA (Saldos Virtuales) =============

export type TipoMovimientoPersona = 'INGRESO' | 'EGRESO';

export interface NuevoMovimientoPersona {
  persona_id: string;
  tipo_movimiento: TipoMovimientoPersona;
  concepto: string;
  monto: number;
  fecha?: string;
  notas?: string;
}

export interface SaldoPersona {
  persona_id: string;
  nombres: string;
  apellidos: string;
  numero_documento?: string;
  total_ingresos: number;
  total_egresos: number;
  saldo: number;
  movimientos_count: number;
  ultima_fecha?: string;
}

export interface MovimientoPersona {
  id: string;
  tipo_movimiento: TipoMovimientoPersona;
  concepto: string;
  monto: number;
  fecha: string;
  notas?: string;
  created_at?: string;
}

export interface MovimientosPersonaDetalle {
  persona: {
    persona_id: string;
    nombres: string;
    apellidos: string;
    numero_documento?: string;
  };
  saldo: number;
  data: MovimientoPersona[];
}

// ============= CONSTANTES =============

export const CATEGORIAS_INGRESO: { value: CategoriaFinanzas; label: string; emoji: string }[] = [
  { value: 'CUOTA_INSCRIPCION', label: 'Cuota de Inscripción', emoji: '📝' },
  { value: 'CUOTA_MENSUAL', label: 'Cuota Mensual', emoji: '📅' },
  { value: 'CUOTA_ACTIVIDAD', label: 'Cuota de Actividad', emoji: '🏕️' },
  { value: 'DONACION', label: 'Donación', emoji: '🎁' },
  { value: 'VENTA_PRODUCTOS', label: 'Venta de Productos', emoji: '🛍️' },
  { value: 'RIFAS', label: 'Rifas', emoji: '🎟️' },
  { value: 'OTROS_INGRESOS', label: 'Otros Ingresos', emoji: '💰' },
];

export const CATEGORIAS_EGRESO: { value: CategoriaFinanzas; label: string; emoji: string }[] = [
  { value: 'MATERIALES', label: 'Materiales', emoji: '📦' },
  { value: 'ALIMENTACION', label: 'Alimentación', emoji: '🍽️' },
  { value: 'TRANSPORTE', label: 'Transporte', emoji: '🚌' },
  { value: 'ALQUILER_EQUIPOS', label: 'Alquiler de Equipos', emoji: '⛺' },
  { value: 'UNIFORMES', label: 'Uniformes', emoji: '👕' },
  { value: 'PRIMEROS_AUXILIOS', label: 'Primeros Auxilios', emoji: '🏥' },
  { value: 'PUBLICIDAD', label: 'Publicidad', emoji: '📢' },
  { value: 'EMERGENCIA', label: 'Emergencia', emoji: '🚨' },
  { value: 'SERVICIOS', label: 'Servicios', emoji: '💡' },
  { value: 'OTROS_EGRESOS', label: 'Otros Egresos', emoji: '💸' },
];

export const METODOS_PAGO: { value: MetodoPago; label: string; emoji: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo', emoji: '💵' },
  { value: 'YAPE', label: 'Yape', emoji: '📱' },
  { value: 'PLIN', label: 'Plin', emoji: '📲' },
  { value: 'TRANSFERENCIA', label: 'Transferencia', emoji: '🏦' },
  { value: 'TARJETA', label: 'Tarjeta', emoji: '💳' },
  { value: 'OTRO', label: 'Otro', emoji: '💰' },
];

export interface ConceptoFinanzas {
  id: string;
  descripcion: string;
  cantidad?: number;
  fecha: string;
  activo: boolean;
}

// ============= SERVICE CLASS =============

export class FinanzasService {
  /**
   * Catálogo de Conceptos (Finanzas)
   */
  static async listarConceptosFinanzas(soloActivos = false): Promise<ConceptoFinanzas[]> {
    const { data, error } = await supabase.rpc('api_listar_conceptos_finanzas', {
      p_solo_activos: soloActivos,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar conceptos');

    return data.conceptos || [];
  }

  static async upsertConceptoFinanzas(concepto: {
    id?: string | null;
    descripcion: string;
    cantidad?: number;
    fecha: string;
    activo: boolean;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    const { data, error } = await supabase.rpc('api_upsert_concepto_finanzas', {
      p_id: concepto.id || null,
      p_descripcion: concepto.descripcion,
      p_cantidad: concepto.cantidad ?? null,
      p_fecha: concepto.fecha,
      p_activo: concepto.activo,
    });

    if (error) throw error;
    return data;
  }

  static async eliminarConceptoFinanzas(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const { data, error } = await supabase.rpc('api_eliminar_concepto_finanzas', {
      p_id: id,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Obtiene el resumen financiero general
   */
  static async obtenerResumen(
    cuentaId?: string,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<ResumenFinanciero> {
    const { data, error } = await supabase.rpc('api_obtener_resumen_financiero', {
      p_cuenta_id: cuentaId || null,
      p_fecha_inicio: fechaInicio || null,
      p_fecha_fin: fechaFin || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener resumen');

    return data.data;
  }

  /**
   * Lista transacciones con filtros
   */
  static async listarTransacciones(filtros: {
    tipo?: TipoTransaccion;
    categoria?: CategoriaFinanzas;
    cuentaId?: string;
    fechaInicio?: string;
    fechaFin?: string;
    limite?: number;
    offset?: number;
  } = {}): Promise<{ transacciones: Transaccion[]; total: number }> {
    const { data, error } = await supabase.rpc('api_listar_transacciones', {
      p_tipo: filtros.tipo || null,
      p_categoria: filtros.categoria || null,
      p_cuenta_id: filtros.cuentaId || null,
      p_fecha_inicio: filtros.fechaInicio || null,
      p_fecha_fin: filtros.fechaFin || null,
      p_limite: filtros.limite || 50,
      p_offset: filtros.offset || 0,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar transacciones');

    return {
      transacciones: data.data,
      total: data.total,
    };
  }

  /**
   * Registra una nueva transacción (ingreso o egreso)
   */
  static async registrarTransaccion(transaccion: NuevaTransaccion): Promise<{
    transaccion_id: string;
    prestamo_id?: string;
  }> {
    const { data, error } = await supabase.rpc('api_registrar_transaccion', {
      p_datos: transaccion,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al registrar transacción');

    return {
      transaccion_id: data.transaccion_id,
      prestamo_id: data.prestamo_id,
    };
  }

  /**
   * Lista préstamos pendientes
   */
  static async listarPrestamos(estado?: EstadoPrestamo): Promise<Prestamo[]> {
    const { data, error } = await supabase.rpc('api_listar_prestamos', {
      p_estado: estado || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar préstamos');

    return data.data;
  }

  /**
   * Registra una devolución de préstamo
   */
  static async registrarDevolucion(
    prestamoId: string,
    monto: number,
    fechaDevolucion: string,
    metodoPago: MetodoPago = 'EFECTIVO',
    numeroOperacion?: string,
    notas?: string
  ): Promise<{ devolucion_id: string }> {
    const { data, error } = await supabase.rpc('api_registrar_devolucion', {
      p_prestamo_id: prestamoId,
      p_monto: monto,
      p_fecha_devolucion: fechaDevolucion,
      p_metodo_pago: metodoPago,
      p_numero_operacion: numeroOperacion || null,
      p_notas: notas || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al registrar devolución');

    return { devolucion_id: data.devolucion_id };
  }

  /**
   * Obtiene estadísticas por categoría
   */
  static async estadisticasPorCategoria(
    tipo?: TipoTransaccion,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<EstadisticaCategoria[]> {
    const { data, error } = await supabase.rpc('api_estadisticas_por_categoria', {
      p_tipo: tipo || null,
      p_fecha_inicio: fechaInicio || null,
      p_fecha_fin: fechaFin || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener estadísticas');

    return data.data;
  }

  /**
   * Sube una evidencia/voucher
   */
  static async subirEvidencia(
    file: File,
    transaccionId?: string,
    prestamoId?: string,
    devolucionId?: string,
    tipoEvidencia: string = 'VOUCHER'
  ): Promise<{ url: string; id: string }> {
    // Subir archivo a Storage
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = `evidencias/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('finanzas')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('finanzas')
      .getPublicUrl(filePath);

    // Registrar en base de datos
    const { data, error } = await supabase
      .from('evidencias_financieras')
      .insert({
        transaccion_id: transaccionId || null,
        prestamo_id: prestamoId || null,
        devolucion_id: devolucionId || null,
        tipo_evidencia: tipoEvidencia,
        nombre_archivo: file.name,
        url_archivo: urlData.publicUrl,
        mime_type: file.type,
        tamanio_bytes: file.size,
      })
      .select('id')
      .single();

    if (error) throw error;

    return { url: urlData.publicUrl, id: data.id };
  }

  /**
   * Obtiene evidencias de una transacción
   */
  static async obtenerEvidencias(transaccionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('evidencias_financieras')
      .select('*')
      .eq('transaccion_id', transaccionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ============= CRUD COMPLETO =============

  /**
   * Obtiene una transacción por ID
   */
  static async obtenerTransaccion(transaccionId: string) {
    const { data, error } = await supabase
      .rpc('api_obtener_transaccion', { p_transaccion_id: transaccionId });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener transacción');

    return data.data;
  }

  /**
   * Actualiza una transacción existente
   */
  static async actualizarTransaccion(transaccionId: string, datos: Partial<NuevaTransaccion>) {
    const { data, error } = await supabase
      .rpc('api_actualizar_transaccion', {
        p_transaccion_id: transaccionId,
        p_datos: datos
      });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar transacción');

    return data;
  }

  /**
   * Agrega o actualiza un préstamo asociado a una transacción existente
   */
  static async agregarPrestamoTransaccion(
    transaccionId: string, 
    datosPrestamo: {
      monto_cubierto: number;
      prestamista_nombre: string;
      prestamista_tipo?: string;
      fecha_vencimiento?: string;
      motivo_prestamo?: string;
    }
  ): Promise<{ prestamo_id: string | null }> {
    const { data, error } = await supabase
      .rpc('api_agregar_prestamo_transaccion', {
        p_transaccion_id: transaccionId,
        p_datos: datosPrestamo
      });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al agregar préstamo');

    return { prestamo_id: data.prestamo_id };
  }

  /**
   * Elimina una transacción y sus dependencias
   */
  static async eliminarTransaccion(transaccionId: string) {
    // Primero eliminamos las evidencias del storage
    const evidencias = await this.obtenerEvidencias(transaccionId);
    
    for (const evidencia of evidencias) {
      try {
        // Extraer el path del archivo de la URL
        const urlPath = new URL(evidencia.url_archivo).pathname;
        const storagePath = urlPath.split('/finanzas/')[1];
        if (storagePath) {
          await supabase.storage.from('finanzas').remove([storagePath]);
        }
      } catch (e) {
        console.warn('Error eliminando archivo de storage:', e);
      }
    }

    // Ahora eliminamos la transacción de la BD
    const { data, error } = await supabase
      .rpc('api_eliminar_transaccion', { p_transaccion_id: transaccionId });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar transacción');

    return data;
  }

  /**
   * Cancela un préstamo
   */
  static async cancelarPrestamo(prestamoId: string, motivo?: string) {
    const { data, error } = await supabase
      .rpc('api_cancelar_prestamo', {
        p_prestamo_id: prestamoId,
        p_motivo: motivo || null
      });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al cancelar préstamo');

    return data;
  }

  /**
   * Elimina una evidencia
   */
  static async eliminarEvidencia(evidenciaId: string) {
    const { data, error } = await supabase
      .rpc('api_eliminar_evidencia', { p_evidencia_id: evidenciaId });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar evidencia');

    // Eliminar archivo del storage
    if (data.url_archivo) {
      try {
        const urlPath = new URL(data.url_archivo).pathname;
        const storagePath = urlPath.split('/finanzas/')[1];
        if (storagePath) {
          await supabase.storage.from('finanzas').remove([storagePath]);
        }
      } catch (e) {
        console.warn('Error eliminando archivo de storage:', e);
      }
    }

    return data;
  }

  // ============= CONTABILIDAD POR PERSONA (Saldos Virtuales) =============

  /**
   * Registra un movimiento (INGRESO/EGRESO) en la cuenta virtual de una persona.
   * El saldo se calcula dinámicamente; no se almacena.
   */
  static async registrarMovimientoPersona(
    movimiento: NuevoMovimientoPersona
  ): Promise<{ movimiento_id: string; saldo_actual: number }> {
    const { data, error } = await supabase.rpc('api_registrar_movimiento_persona', {
      p_datos: movimiento,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al registrar movimiento');

    return { movimiento_id: data.movimiento_id, saldo_actual: data.saldo_actual };
  }

  /**
   * Lista los saldos virtuales por persona (sólo personas con movimientos).
   */
  static async listarSaldosPersonas(
    busqueda?: string
  ): Promise<{ saldos: SaldoPersona[]; saldoGlobal: number }> {
    const { data, error } = await supabase.rpc('api_listar_saldos_personas', {
      p_busqueda: busqueda || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener saldos');

    return { saldos: data.data || [], saldoGlobal: data.saldo_global || 0 };
  }

  /**
   * Lista los movimientos (auditoría) de una persona junto a su saldo.
   */
  static async listarMovimientosPersona(personaId: string): Promise<MovimientosPersonaDetalle> {
    const { data, error } = await supabase.rpc('api_listar_movimientos_persona', {
      p_persona_id: personaId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener movimientos');

    return { persona: data.persona, saldo: data.saldo, data: data.data || [] };
  }

  /**
   * Elimina (anula) un movimiento puntual de una persona.
   */
  static async eliminarMovimientoPersona(movimientoId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_movimiento_persona', {
      p_id: movimientoId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar movimiento');
  }
}

export default FinanzasService;
