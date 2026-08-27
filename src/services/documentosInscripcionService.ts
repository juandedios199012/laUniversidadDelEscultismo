import { supabase } from '../lib/supabase';

/**
 * ======================================================================
 * 📋 DOCUMENTOS INSCRIPCION SERVICE - CLIENTE DE MICROSERVICIO/API
 * ======================================================================
 *
 * Cliente puro para el catálogo de "Tipos de Documento" y su motor de
 * reglas de aplicabilidad (usado en Configuración). Toda la lógica de
 * negocio reside en el backend (Supabase Database Functions).
 * ======================================================================
 */
export class DocumentosInscripcionService {

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

export default DocumentosInscripcionService;
