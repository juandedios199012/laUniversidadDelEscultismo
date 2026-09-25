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
  estado: EstadoEvaluacion;
  created_at: string;
  updated_at: string;
}

export interface EvaluacionItem {
  id: string;
  evaluacion_id: string;
  orden: number;
  enunciado: string;
}

export interface EvaluacionRespuesta {
  id: string;
  evaluacion_id: string;
  scout_id: string;
  scout_nombre?: string;
  patrulla_nombre?: string;
  completado_en?: string;
}

export interface EvaluacionRespuestaItem {
  respuesta_id: string;
  item_id: string;
  valor_escala: number;
}

export interface ContextoEvaluacionPublica {
  success: boolean;
  message?: string;
  evaluacion?: {
    id: string; titulo: string; descripcion?: string; instrucciones?: string;
    escala_min: number; escala_max: number; etiqueta_escala_min?: string; etiqueta_escala_max?: string;
  };
  items?: Array<{ id: string; orden: number; enunciado: string }>;
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

  static async listarItems(evaluacionId: string): Promise<EvaluacionItem[]> {
    const { data, error } = await supabase.from('evaluacion_items').select('*').eq('evaluacion_id', evaluacionId).order('orden', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async listarRespuestas(evaluacionId: string): Promise<EvaluacionRespuesta[]> {
    const { data: respuestas, error } = await supabase
      .from('evaluacion_respuestas')
      .select('id, evaluacion_id, scout_id, completado_en')
      .eq('evaluacion_id', evaluacionId);
    if (error) throw error;
    if (!respuestas || respuestas.length === 0) return [];

    const scoutIds = respuestas.map((r) => r.scout_id);

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

    const nombrePorScout: Record<string, string> = {};
    for (const s of (scoutsRows || []) as any[]) {
      if (s.personas) nombrePorScout[s.id] = `${s.personas.nombres} ${s.personas.apellidos}`;
    }
    const patrullaPorScout: Record<string, string> = {};
    for (const m of (miembrosRows || []) as any[]) {
      if (m.patrullas?.nombre) patrullaPorScout[m.scout_id] = m.patrullas.nombre;
    }

    return respuestas.map((r) => ({
      id: r.id,
      evaluacion_id: r.evaluacion_id,
      scout_id: r.scout_id,
      scout_nombre: nombrePorScout[r.scout_id],
      patrulla_nombre: patrullaPorScout[r.scout_id],
      completado_en: r.completado_en,
    }));
  }

  static async listarRespuestaItems(evaluacionId: string): Promise<EvaluacionRespuestaItem[]> {
    const { data, error } = await supabase
      .from('evaluacion_respuesta_items')
      .select('respuesta_id, item_id, valor_escala, evaluacion_respuestas!inner(evaluacion_id)')
      .eq('evaluacion_respuestas.evaluacion_id', evaluacionId);
    if (error) throw error;
    return (data || []).map((row: any) => ({ respuesta_id: row.respuesta_id, item_id: row.item_id, valor_escala: row.valor_escala }));
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
  }): Promise<RpcResult & { evaluacion_id?: string }> {
    const { data, error } = await supabase.rpc('crear_evaluacion', { p_datos: datos });
    if (error) throw error;
    return data as RpcResult;
  }

  static async actualizarEvaluacion(evaluacionId: string, datos: {
    titulo: string; descripcion?: string; instrucciones?: string; plan_trimestral_id?: string;
    escala_min?: number; escala_max?: number; etiqueta_escala_min?: string; etiqueta_escala_max?: string;
  }): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('actualizar_evaluacion', { p_evaluacion_id: evaluacionId, p_datos: datos });
    if (error) throw error;
    return data as RpcResult;
  }

  static async guardarItems(evaluacionId: string, items: Array<{ enunciado: string }>): Promise<RpcResult & { cantidad_items?: number }> {
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
    success: boolean; message?: string; nombre_completo?: string; respuestas_previas?: Array<{ item_id: string; valor_escala: number }>;
  }> {
    const { data, error } = await supabase.rpc('iniciar_respuesta_evaluacion', { p_codigo: codigo, p_scout_id: scoutId });
    if (error) throw error;
    return data as any;
  }

  static async enviarRespuesta(codigo: string, scoutId: string, respuestas: Array<{ item_id: string; valor_escala: number }>): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('enviar_respuesta_evaluacion', { p_codigo: codigo, p_scout_id: scoutId, p_respuestas: respuestas });
    if (error) throw error;
    return data as RpcResult;
  }
}
