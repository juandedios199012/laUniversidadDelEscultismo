import { supabase } from '../lib/supabase';

/**
 * ======================================================================
 * 📋 EVALUACIÓN — SERVICE
 * ======================================================================
 * Módulo genérico de encuestas de escala (tipo Likert): un dirigente
 * define una evaluación (título + enunciados + escala), la activa, y
 * comparte UN link público (sin login) para que los scouts se
 * identifiquen buscando su nombre y respondan.
 *
 * Lado admin: lectura directa de tablas (mismo patrón que
 * planificacionService.ts) + RPC para las acciones sensibles.
 * Lado público: todo pasa por RPC SECURITY DEFINER (ver
 * database/150_evaluacion_modulo.sql).
 * ======================================================================
 */

export type EstadoEvaluacion = 'BORRADOR' | 'ACTIVA' | 'CERRADA';

/** Etiqueta por cada punto de la escala (no solo los extremos) — ver database/154_evaluacion_etiquetas_escala.sql. */
export interface EtiquetaEscala {
  valor: number;
  etiqueta: string;
  emoji?: string;
}

/**
 * Preset recomendado para escala 1-5 con niños ~11 años: palabra + ícono
 * en cada punto (no solo número), según el "Smileyometer" (Fun Toolkit,
 * Read & MacFarlane) — estándar citado en interacción niño-computadora
 * para escalas de valoración con niños de 8-12 años.
 */
export const PRESET_ETIQUETAS_ESCALA_1_5: EtiquetaEscala[] = [
  { valor: 1, etiqueta: 'Nunca', emoji: '😞' },
  { valor: 2, etiqueta: 'Casi nunca', emoji: '😕' },
  { valor: 3, etiqueta: 'A veces', emoji: '😐' },
  { valor: 4, etiqueta: 'Casi siempre', emoji: '🙂' },
  { valor: 5, etiqueta: 'Siempre', emoji: '😄' },
];

export interface Evaluacion {
  id: string;
  codigo_acceso: string;
  titulo: string;
  descripcion?: string;
  instrucciones?: string;
  plan_trimestral_id?: string;
  escala_min: number;
  escala_max: number;
  etiqueta_escala_min?: string;
  etiqueta_escala_max?: string;
  etiquetas_escala?: EtiquetaEscala[];
  modo_anonimo: boolean;
  estado: EstadoEvaluacion;
  created_at: string;
  updated_at: string;
}

export type TipoItemEvaluacion = 'ESCALA' | 'TEXTO_LIBRE';

export interface EvaluacionItem {
  id: string;
  evaluacion_id: string;
  orden: number;
  enunciado: string;
  etiqueta?: string;
  tipo_item: TipoItemEvaluacion;
  limite_caracteres?: number;
  longitud_minima?: number;
  placeholder?: string;
}

export interface EvaluacionRespuesta {
  id: string;
  evaluacion_id: string;
  scout_id: string | null;
  scout_nombre?: string;
  patrulla_nombre?: string;
  edad_autorreportada?: number;
  patrulla_autorreportada?: string;
  completado_en?: string;
}

export interface EvaluacionRespuestaItem {
  respuesta_id: string;
  item_id: string;
  valor_escala?: number;
  valor_texto?: string;
}

/** Payload de una respuesta a un ítem: escala si es tipo ESCALA, texto si es TEXTO_LIBRE. */
export interface RespuestaItemPayload {
  item_id: string;
  valor_escala?: number;
  valor_texto?: string;
}

export interface ItemPublico {
  id: string; orden: number; enunciado: string; etiqueta?: string;
  tipo_item: TipoItemEvaluacion; limite_caracteres?: number; longitud_minima?: number; placeholder?: string;
}

export interface ContextoEvaluacionPublica {
  success: boolean;
  message?: string;
  evaluacion?: {
    id: string; titulo: string; descripcion?: string; instrucciones?: string;
    escala_min: number; escala_max: number; etiqueta_escala_min?: string; etiqueta_escala_max?: string;
    etiquetas_escala?: EtiquetaEscala[];
    modo_anonimo: boolean;
  };
  items?: ItemPublico[];
  patrullas_disponibles?: Array<{ id: string; nombre: string }> | null;
}

interface RpcResult {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

function buildLinkPublico(codigo: string): string {
  return `${window.location.origin}/e/${codigo}`;
}

export class EvaluacionService {
  // ==================================================================
  // LADO ADMIN — lectura directa
  // ==================================================================

  static async listarEvaluaciones(): Promise<Evaluacion[]> {
    const { data, error } = await supabase.from('evaluaciones').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async obtenerEvaluacion(evaluacionId: string): Promise<Evaluacion | null> {
    const { data, error } = await supabase.from('evaluaciones').select('*').eq('id', evaluacionId).maybeSingle();
    if (error) throw error;
    return data;
  }

  /**
   * Nombres de pila de dirigentes (para detectar menciones en respuestas
   * de texto libre — ver src/utils/analisisTextoLibre.ts). Sin filtrar por
   * estado a propósito: la convención de valores de "activo" no es
   * consistente entre tablas en este proyecto (ver database/149_*.sql),
   * y acá el costo de traer de más es bajo — es solo para buscar
   * coincidencias de texto, no una lista operativa.
   */
  static async listarNombresDirigentes(): Promise<string[]> {
    const { data, error } = await supabase
      .from('dirigentes')
      .select('persona_id, personas(nombres)');
    if (error) throw error;
    const nombres = (data || [])
      .map((row: any) => row.personas?.nombres as string | undefined)
      .filter((n): n is string => !!n?.trim());
    return Array.from(new Set(nombres));
  }

  static async listarItems(evaluacionId: string): Promise<EvaluacionItem[]> {
    const { data, error } = await supabase.from('evaluacion_items').select('*').eq('evaluacion_id', evaluacionId).order('orden', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async listarRespuestas(evaluacionId: string): Promise<EvaluacionRespuesta[]> {
    const { data: respuestas, error } = await supabase
      .from('evaluacion_respuestas')
      .select('id, evaluacion_id, scout_id, edad_autorreportada, patrulla_autorreportada, completado_en')
      .eq('evaluacion_id', evaluacionId);
    if (error) throw error;
    if (!respuestas || respuestas.length === 0) return [];

    // Solo hay scout_id que resolver en evaluaciones con nombre (no
    // anónimas) — en modo anónimo scout_id es null y ya viene
    // patrulla_autorreportada/edad_autorreportada directo en la fila.
    const scoutIds = respuestas.map((r) => r.scout_id).filter((id): id is string => !!id);

    const nombrePorScout: Record<string, string> = {};
    const patrullaPorScout: Record<string, string> = {};
    if (scoutIds.length > 0) {
      // Consultas separadas y simples (en vez de un embed anidado de 3-4
      // niveles vía scouts->personas + scouts->miembros_patrulla->patrullas,
      // más frágil frente a cómo PostgREST resuelve relaciones inversas) —
      // se combinan acá mismo en JS.
      const [{ data: scoutsRows, error: errScouts }, { data: miembrosRows, error: errMiembros }] = await Promise.all([
        supabase.from('scouts').select('id, persona_id, personas(nombres, apellidos)').in('id', scoutIds),
        supabase.from('miembros_patrulla').select('scout_id, estado_miembro, patrullas(nombre)').in('scout_id', scoutIds).eq('estado_miembro', 'ACTIVO'),
      ]);
      if (errScouts) throw errScouts;
      if (errMiembros) throw errMiembros;

      for (const s of (scoutsRows || []) as any[]) {
        if (s.personas) nombrePorScout[s.id] = `${s.personas.nombres} ${s.personas.apellidos}`;
      }
      for (const m of (miembrosRows || []) as any[]) {
        if (m.patrullas?.nombre) patrullaPorScout[m.scout_id] = m.patrullas.nombre;
      }
    }

    return respuestas.map((r) => ({
      id: r.id,
      evaluacion_id: r.evaluacion_id,
      scout_id: r.scout_id,
      scout_nombre: r.scout_id ? nombrePorScout[r.scout_id] : undefined,
      patrulla_nombre: r.scout_id ? patrullaPorScout[r.scout_id] : undefined,
      edad_autorreportada: r.edad_autorreportada ?? undefined,
      patrulla_autorreportada: r.patrulla_autorreportada ?? undefined,
      completado_en: r.completado_en,
    }));
  }

  static async listarRespuestaItems(evaluacionId: string): Promise<EvaluacionRespuestaItem[]> {
    const { data, error } = await supabase
      .from('evaluacion_respuesta_items')
      .select('respuesta_id, item_id, valor_escala, valor_texto, evaluacion_respuestas!inner(evaluacion_id)')
      .eq('evaluacion_respuestas.evaluacion_id', evaluacionId);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      respuesta_id: row.respuesta_id, item_id: row.item_id,
      valor_escala: row.valor_escala ?? undefined, valor_texto: row.valor_texto ?? undefined,
    }));
  }

  static linkPublico(codigoAcceso: string): string {
    return buildLinkPublico(codigoAcceso);
  }

  // ==================================================================
  // LADO ADMIN — acciones sensibles (RPC + permiso server-side)
  // ==================================================================

  static async crearEvaluacion(datos: {
    titulo: string; descripcion?: string; instrucciones?: string; plan_trimestral_id?: string;
    escala_min?: number; escala_max?: number; etiqueta_escala_min?: string; etiqueta_escala_max?: string;
    etiquetas_escala?: EtiquetaEscala[]; modo_anonimo?: boolean;
  }): Promise<RpcResult & { evaluacion_id?: string }> {
    const { data, error } = await supabase.rpc('crear_evaluacion', { p_datos: datos });
    if (error) throw error;
    return data as RpcResult;
  }

  static async actualizarEvaluacion(evaluacionId: string, datos: {
    titulo: string; descripcion?: string; instrucciones?: string; plan_trimestral_id?: string;
    escala_min?: number; escala_max?: number; etiqueta_escala_min?: string; etiqueta_escala_max?: string;
    etiquetas_escala?: EtiquetaEscala[];
  }): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('actualizar_evaluacion', { p_evaluacion_id: evaluacionId, p_datos: datos });
    if (error) throw error;
    return data as RpcResult;
  }

  static async guardarItems(evaluacionId: string, items: Array<{
    enunciado: string; etiqueta?: string; tipo_item?: TipoItemEvaluacion;
    limite_caracteres?: number; longitud_minima?: number; placeholder?: string;
  }>): Promise<RpcResult & { cantidad_items?: number }> {
    const { data, error } = await supabase.rpc('guardar_items_evaluacion', { p_evaluacion_id: evaluacionId, p_items: items });
    if (error) throw error;
    return data as RpcResult;
  }

  static async activar(evaluacionId: string): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('activar_evaluacion', { p_evaluacion_id: evaluacionId });
    if (error) throw error;
    return data as RpcResult;
  }

  static async cerrar(evaluacionId: string): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('cerrar_evaluacion', { p_evaluacion_id: evaluacionId });
    if (error) throw error;
    return data as RpcResult;
  }

  static async reabrir(evaluacionId: string): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('reabrir_evaluacion', { p_evaluacion_id: evaluacionId });
    if (error) throw error;
    return data as RpcResult;
  }

  static async eliminar(evaluacionId: string): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('eliminar_evaluacion', { p_evaluacion_id: evaluacionId });
    if (error) throw error;
    return data as RpcResult;
  }

  /** Elimina una respuesta puntual (ej. duplicada o cargada por error) sin borrar el resto de la evaluación. */
  static async eliminarRespuesta(respuestaId: string): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('eliminar_respuesta_evaluacion', { p_respuesta_id: respuestaId });
    if (error) throw error;
    return data as RpcResult;
  }

  // ==================================================================
  // LADO PÚBLICO — link único, sin login, identificación por nombre
  // ==================================================================

  static async obtenerEvaluacionPublica(codigo: string): Promise<ContextoEvaluacionPublica> {
    const { data, error } = await supabase.rpc('obtener_evaluacion_publica', { p_codigo: codigo });
    if (error) throw error;
    return data as ContextoEvaluacionPublica;
  }

  static async buscarScouts(codigo: string, busqueda: string): Promise<{ success: boolean; message?: string; resultados: Array<{ scout_id: string; nombre_completo: string; patrulla_nombre?: string }> }> {
    const { data, error } = await supabase.rpc('buscar_scouts_evaluacion', { p_codigo: codigo, p_busqueda: busqueda });
    if (error) throw error;
    return data as any;
  }

  static async iniciarRespuesta(codigo: string, scoutId: string): Promise<{
    success: boolean; message?: string; nombre_completo?: string; respuestas_previas?: RespuestaItemPayload[];
  }> {
    const { data, error } = await supabase.rpc('iniciar_respuesta_evaluacion', { p_codigo: codigo, p_scout_id: scoutId });
    if (error) throw error;
    return data as any;
  }

  static async enviarRespuesta(codigo: string, scoutId: string, respuestas: RespuestaItemPayload[]): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('enviar_respuesta_evaluacion', { p_codigo: codigo, p_scout_id: scoutId, p_respuestas: respuestas });
    if (error) throw error;
    return data as RpcResult;
  }

  /** Flujo anónimo (evaluacion.modo_anonimo = true): edad + patrulla autoreportadas en vez de buscar el nombre. */
  static async enviarRespuestaAnonima(codigo: string, edad: number | undefined, patrullaNombre: string, respuestas: RespuestaItemPayload[]): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('enviar_respuesta_anonima', {
      p_codigo: codigo, p_edad: edad ?? null, p_patrulla_nombre: patrullaNombre, p_respuestas: respuestas,
    });
    if (error) throw error;
    return data as RpcResult;
  }
}
