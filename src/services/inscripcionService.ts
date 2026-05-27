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

  // ============= � PERÍODOS =============

  static async listarPeriodos(): Promise<{
    success: boolean;
    periodos?: PeriodoDisponible[];
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('api_listar_periodos_inscripcion');
    if (error) throw error;
    return data;
  }

  static async upsertPeriodo(
    periodoId: string,
    montoBase: number,
    montoHermano?: number | null,
    fechaApertura?: string | null,
    fechaCierre?: string | null,
    observaciones?: string | null
  ): Promise<{ success: boolean; fecha_cierre?: string; error?: string }> {
    const { data, error } = await supabase.rpc('api_upsert_periodo_inscripcion', {
      p_periodo_id:     periodoId,
      p_monto_base:     montoBase,
      p_monto_hermano:  montoHermano ?? null,
      p_fecha_apertura: fechaApertura ?? null,
      p_fecha_cierre:   fechaCierre ?? null,
      p_observaciones:  observaciones ?? null,
    });
    if (error) throw error;
    return data;
  }

  // ============= 📋 INSCRIPCIONES =============

  static async obtenerInscripciones(
    periodoId?: string,
    estado?: string,
    personaId?: string
  ): Promise<{ success: boolean; inscripciones?: Inscripcion[]; config?: ConfiguracionPeriodo; error?: string }> {
    const { data, error } = await supabase.rpc('api_obtener_inscripciones', {
      p_periodo_id: periodoId ?? null,
      p_estado:     estado     ?? null,
      p_persona_id: personaId  ?? null,
    });
    if (error) throw error;
    return data;
  }

  static async inscribirMasivo(
    scoutIds: string[],
    periodoId: string,
    monto?: number | null,
    perfilOverride?: string | null
  ): Promise<{ success: boolean; total_inscritos?: number; total_omitidos?: number; error?: string }> {
    const { data, error } = await supabase.rpc('api_inscribir_masivo', {
      p_scout_ids:          scoutIds,
      p_periodo_id:         periodoId,
      p_monto_inscripcion:  monto         ?? null,
      p_perfil_override:    perfilOverride ?? null,
    });
    if (error) throw error;
    return data;
  }

  /** Lista TODAS las personas inscribibles (scouts + dirigentes externos + comité) */
  static async listarPersonasInscribibles(
    periodoId: string
  ): Promise<{ success: boolean; personas?: PersonaInscribible[]; error?: string }> {
    const { data, error } = await supabase.rpc('api_listar_personas_inscribibles', {
      p_periodo_id: periodoId,
    });
    if (error) throw error;
    return data;
  }

  /** Inscribe por persona_id — soporta dirigentes externos y comité */
  static async inscribirPersonasMasivo(
    personaIds: string[],
    periodoId: string,
    perfilOverride?: string | null
  ): Promise<{ success: boolean; total_inscritos?: number; total_omitidos?: number; errores?: string[]; error?: string }> {
    const { data, error } = await supabase.rpc('api_inscribir_personas_masivo', {
      p_persona_ids:      personaIds,
      p_periodo_id:       periodoId,
      p_perfil_override:  perfilOverride ?? null,
    });
    if (error) throw error;
    return data;
  }

  static async eliminarInscripcion(
    inscripcionId: string
  ): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('api_eliminar_inscripcion', {
      p_inscripcion_id: inscripcionId,
    });
    if (error) throw error;
    return data;
  }

  static async registrarPago(
    inscripcionId: string,
    monto: number,
    observaciones?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const { data, error } = await supabase.rpc('api_registrar_pago_inscripcion', {
      p_inscripcion_id: inscripcionId,
      p_monto_pago:     monto,
      p_observaciones:  observaciones ?? null,
    });
    if (error) throw error;
    return data;
  }

  static async detectarHermanos(
    scoutIds: string[]
  ): Promise<{ success: boolean; hermanos?: string[]; error?: string }> {
    const { data, error } = await supabase.rpc('api_detectar_hermanos', {
      p_scout_ids: scoutIds,
    });
    if (error) throw error;
    return data;
  }

  // ============= 📄 DOCUMENTOS =============

  static async obtenerChecklist(
    inscripcionId: string
  ): Promise<{ success: boolean; checklist?: ChecklistItem[]; resumen?: ResumenChecklist; error?: string }> {
    const { data, error } = await supabase.rpc('api_obtener_checklist_inscripcion', {
      p_inscripcion_id: inscripcionId,
    });
    if (error) throw error;
    return data;
  }

  static async marcarDocumento(
    inscripcionId: string,
    tipoDocumentoId: string,
    entregado: boolean
  ): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('api_marcar_documento_inscripcion', {
      p_inscripcion_id:    inscripcionId,
      p_tipo_documento_id: tipoDocumentoId,
      p_entregado:         entregado,
    });
    if (error) throw error;
    return data;
  }

  // ============= 📝 GESTIÓN DE INSCRIPCIONES ANUALES (Legacy) =============
  
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

  // ============= 🏷️ PERFILES DE TARIFA =============

  static async listarPerfilesTarifa(): Promise<{
    success: boolean;
    perfiles?: PerfilTarifa[];
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('api_listar_perfiles_tarifa');
    if (error) throw error;
    return data;
  }

  static async upsertPerfilTarifa(perfil: {
    codigo: string;
    nombre: string;
    descripcion?: string;
    orden?: number;
    activo?: boolean;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    const { data, error } = await supabase.rpc('api_upsert_perfil_tarifa', {
      p_codigo:      perfil.codigo,
      p_nombre:      perfil.nombre,
      p_descripcion: perfil.descripcion ?? null,
      p_orden:       perfil.orden ?? 0,
      p_activo:      perfil.activo ?? true,
    });
    if (error) throw error;
    return data;
  }

  // ============= 💰 TARIFAS POR PERÍODO =============

  static async listarTarifasPeriodo(periodoId: string): Promise<{
    success: boolean;
    periodo_id?: string;
    tarifas?: TarifaPeriodo[];
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('api_listar_tarifas_periodo', {
      p_periodo_id: periodoId,
    });
    if (error) throw error;
    return data;
  }

  static async upsertTarifaPeriodo(
    periodoId: string,
    perfilTarifaId: string,
    monto: number
  ): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('api_upsert_tarifa_periodo', {
      p_periodo_id:       periodoId,
      p_perfil_tarifa_id: perfilTarifaId,
      p_monto:            monto,
    });
    if (error) throw error;
    return data;
  }

  static async actualizarTarifasPeriodo(periodoId: string): Promise<{
    success: boolean;
    filas_actualizadas?: number;
    message?: string;
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('api_actualizar_tarifas_periodo', {
      p_periodo_id: periodoId,
    });
    if (error) throw error;
    return data;
  }

  // ============= 🎯 SUGERENCIA DE PERFIL =============

  static async sugerirPerfilPersona(
    personaId: string,
    periodoId?: string
  ): Promise<{
    success: boolean;
    perfil_tarifa_id?: string;
    codigo?: string;
    nombre?: string;
    monto?: number | null;
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('api_sugerir_perfil_persona', {
      p_persona_id: personaId,
      p_periodo_id: periodoId ?? null,
    });
    if (error) throw error;
    return data;
  }

  // ============= 📋 TIPOS DE DOCUMENTO =============

  static async listarTiposDocumentoInscripcion(soloActivos: boolean): Promise<{
    success: boolean;
    tipos?: TipoDocumentoInscripcion[];
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('api_listar_tipos_documento_inscripcion', {
      p_solo_activos: soloActivos,
    });
    if (error) throw error;
    return data;
  }

  static async upsertTipoDocumentoInscripcion(tipo: {
    id: string | null;
    nombre: string;
    descripcion: string | null;
    requerido: boolean;
    activo: boolean;
    orden: number;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    const { data, error } = await supabase.rpc('api_upsert_tipo_documento_inscripcion', {
      p_id: tipo.id,
      p_nombre: tipo.nombre,
      p_descripcion: tipo.descripcion,
      p_requerido: tipo.requerido,
      p_activo: tipo.activo,
      p_orden: tipo.orden,
    });
    if (error) throw error;
    return data;
  }

  static async eliminarTipoDocumentoInscripcion(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('api_eliminar_tipo_documento_inscripcion', {
      p_id: id,
    });
    if (error) throw error;
    return data;
  }

  // ============= 🎯 APLICABILIDAD =============

  static async listarCatalogoAplicabilidad(): Promise<{
    success: boolean;
    criterios?: AplicabilidadCriterio[];
    operadores?: AplicabilidadOperador[];
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('api_listar_catalogo_aplicabilidad');
    if (error) throw error;
    return data;
  }

  static async listarReglasDocumentoInscripcion(tipoDocumentoId: string): Promise<{
    success: boolean;
    reglas?: DocumentoReglaGrupo[];
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('api_listar_reglas_documento_inscripcion', {
      p_tipo_documento_id: tipoDocumentoId,
    });
    if (error) throw error;
    return data;
  }

  static async crearGrupoReglaDocumentoInscripcion(grupo: {
    tipo_documento_id: string;
    nombre: string | null;
    prioridad: number;
    activo: boolean;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    const { data, error } = await supabase.rpc('api_crear_grupo_regla_documento_inscripcion', {
      p_tipo_documento_id: grupo.tipo_documento_id,
      p_nombre: grupo.nombre,
      p_prioridad: grupo.prioridad,
      p_activo: grupo.activo,
    });
    if (error) throw error;
    return data;
  }

  static async eliminarGrupoReglaDocumentoInscripcion(grupoId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('api_eliminar_grupo_regla_documento_inscripcion', {
      p_grupo_id: grupoId,
    });
    if (error) throw error;
    return data;
  }

  static async upsertCondicionReglaDocumentoInscripcion(condicion: {
    grupo_id: string;
    criterio_codigo: string;
    operador_codigo: string;
    valor_texto?: string | null;
    valor_numero_min?: number | null;
    valor_numero_max?: number | null;
    valor_json?: string[] | null;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    const { data, error } = await supabase.rpc('api_upsert_condicion_regla_documento_inscripcion', {
      p_grupo_id: condicion.grupo_id,
      p_criterio_codigo: condicion.criterio_codigo,
      p_operador_codigo: condicion.operador_codigo,
      p_valor_texto: condicion.valor_texto ?? null,
      p_valor_numero_min: condicion.valor_numero_min ?? null,
      p_valor_numero_max: condicion.valor_numero_max ?? null,
      p_valor_json: condicion.valor_json ? JSON.stringify(condicion.valor_json) : null,
    });
    if (error) throw error;
    return data;
  }

  static async eliminarCondicionReglaDocumentoInscripcion(condicionId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('api_eliminar_condicion_regla_documento_inscripcion', {
      p_condicion_id: condicionId,
    });
    if (error) throw error;
    return data;
  }
}

// ============= 📐 TIPOS EXPORTADOS =============

export interface PerfilTarifa {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  orden: number;
}

export interface TarifaPeriodo {
  perfil_tarifa_id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  monto: number | null;
  configurado: boolean;
}

export interface PeriodoDisponible {
  periodo_id: string;
  monto_base: number;
  monto_hermano: number | null;
  fecha_apertura: string;
  fecha_cierre: string;
  vigente: boolean;
  total_inscritos: number;
}

export interface ConfiguracionPeriodo {
  monto_base: number;
  monto_hermano: number | null;
  fecha_apertura: string;
  fecha_cierre: string;
  vigente: boolean;
}

export interface Scout {
  id: string;
  codigo_asociado: string;
  nombres: string;
  apellidos: string;
  rama_actual: string;
  numero_documento?: string;
  celular?: string;
  correo?: string;
  estado: string;
}

export interface PersonaInscribible {
  persona_id: string;
  scout_id: string | null;
  id: string;                    // = scout_id ?? persona_id (compatibilidad)
  nombres: string;
  apellidos: string;
  tipo_registro: 'Scout' | 'Dirigente' | 'Comité';
  rama_actual: string | null;
  codigo_asociado: string | null;
  numero_documento?: string;
}

export interface Inscripcion {
  inscripcion_id: string;
  scout_id: string;
  persona_id: string;
  periodo_id: string;
  fecha_inscripcion: string;
  monto_inscripcion: number;
  monto_pagado: number;
  perfil_tarifa_id: string;
  perfil_codigo: string;
  perfil_nombre: string;
  es_tarifa_hermano: boolean;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'VENCIDO';
  observaciones?: string;
  scout: Scout;
  created_at: string;
  docs_total: number;
  docs_entregados: number;
  docs_requeridos: number;
  docs_req_ok: number;
}

export interface ChecklistItem {
  tipo_id: string;
  nombre: string;
  descripcion: string | null;
  requerido: boolean;
  orden: number;
  entregado: boolean;
  fecha_entrega: string | null;
  observaciones: string | null;
  doc_id: string | null;
}

export interface ResumenChecklist {
  total: number;
  entregados: number;
  requeridos: number;
  req_ok: number;
}

export interface TipoDocumentoInscripcion {
  id: string;
  nombre: string;
  descripcion: string | null;
  requerido: boolean;
  activo: boolean;
  orden: number;
  total_uso?: number;
}

export interface AplicabilidadCriterio {
  codigo: string;
  nombre: string;
  tipo_dato: 'string' | 'number' | 'array_string';
  valores_posibles?: string[] | null;
}

export interface AplicabilidadOperador {
  codigo: string;
  nombre: string;
}

export interface DocumentoCondicion {
  id: string;
  criterio_codigo: string;
  criterio_nombre: string;
  operador_codigo: string;
  operador_nombre: string;
  valor_texto: string | null;
  valor_numero_min: number | null;
  valor_numero_max: number | null;
  valor_json: string[] | null;
}

export interface DocumentoReglaGrupo {
  id: string;
  nombre: string | null;
  prioridad: number;
  activo: boolean;
  condiciones: DocumentoCondicion[];
}

export default InscripcionService;