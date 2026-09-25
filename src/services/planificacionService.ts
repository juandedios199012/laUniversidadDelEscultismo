import { supabase } from '../lib/supabase';

/**
 * ======================================================================
 * 🗓️ PLANIFICACIÓN ANUAL (Plan Trimestral) — SERVICE
 * ======================================================================
 * Lado admin (dirigentes autenticados): lectura directa de tablas +
 * llamadas a RPC para las acciones sensibles (crear plan, avanzar fase,
 * editar el plan vigente) — ver database/145_planificacion_anual.sql.
 *
 * Lado público (link por patrulla, sin login): todo pasa por RPC
 * SECURITY DEFINER que valida el token a mano (obtenerContextoToken,
 * registrarPropuesta, eliminarPropuesta, registrarVoto).
 * ======================================================================
 */

export type EstadoPlanTrimestral = 'PROPUESTAS_ABIERTAS' | 'VOTACION' | 'VIGENTE' | 'CERRADO';
export type EstadoActividadPlan = 'CONFIRMADA' | 'MODIFICADA' | 'CANCELADA' | 'REEMPLAZADA';

export interface PlanTrimestral {
  id: string;
  nombre: string;
  rama: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoPlanTrimestral;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface PropuestaActividad {
  id: string;
  plan_id: string;
  patrulla_id: string;
  patrulla_nombre?: string;
  patrulla_color?: string;
  fecha: string;
  fecha_fin?: string;
  titulo: string;
  descripcion?: string;
  lugar_sugerido?: string;
  es_actividad_especial: boolean;
  created_at: string;
}

export interface ActividadPlan {
  id: string;
  plan_id: string;
  fecha: string;
  fecha_fin?: string;
  titulo: string;
  descripcion?: string;
  lugar?: string;
  responsable_dirigente_id?: string;
  responsable_nombre_libre?: string;
  patrulla_origen_id?: string;
  patrulla_origen_nombre?: string;
  patrulla_origen_color?: string;
  propuesta_origen_id?: string;
  estado: EstadoActividadPlan;
  version: number;
  reemplaza_a?: string;
  motivo_modificacion?: string;
  created_at: string;
  updated_at: string;
}

export interface TokenPatrulla {
  patrulla_id: string;
  patrulla_nombre: string;
  token: string;
  activo: boolean;
}

export interface ContextoToken {
  success: boolean;
  message?: string;
  plan?: { id: string; nombre: string; rama: string; fecha_inicio: string; fecha_fin: string; estado: EstadoPlanTrimestral };
  patrulla?: { id: string; nombre: string; color_patrulla?: string };
  propuestas?: Array<{
    id: string; fecha: string; fecha_fin?: string; titulo: string; descripcion?: string;
    lugar_sugerido?: string; es_actividad_especial: boolean;
    patrulla_id: string; patrulla_nombre: string; es_propia: boolean;
  }>;
  votos_propios?: Array<{ fecha: string; propuesta_id: string }>;
  calendario_vigente?: Array<{
    id: string; fecha: string; fecha_fin?: string; titulo: string; descripcion?: string;
    lugar?: string; estado: EstadoActividadPlan;
  }>;
}

interface RpcResult {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

function buildMobileLink(token: string): string {
  return `${window.location.origin}/p/${token}`;
}

export class PlanificacionService {
  // ==================================================================
  // LADO ADMIN — lectura directa
  // ==================================================================

  static async listarPlanes(rama?: string): Promise<PlanTrimestral[]> {
    let query = supabase.from('planes_trimestrales').select('*').order('fecha_inicio', { ascending: false });
    if (rama) query = query.eq('rama', rama);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async obtenerPlan(planId: string): Promise<PlanTrimestral | null> {
    // maybeSingle() en vez de single(): si el plan no existe (borrado, id
    // desincronizado, etc.) devuelve null en vez de lanzar PGRST116.
    const { data, error } = await supabase.from('planes_trimestrales').select('*').eq('id', planId).maybeSingle();
    if (error) throw error;
    return data;
  }

  static async listarPropuestas(planId: string): Promise<PropuestaActividad[]> {
    const { data, error } = await supabase
      .from('propuestas_actividad')
      .select('*, patrullas(nombre, color_patrulla)')
      .eq('plan_id', planId)
      .order('fecha', { ascending: true });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...row,
      patrulla_nombre: row.patrullas?.nombre,
      patrulla_color: row.patrullas?.color_patrulla,
    }));
  }

  static async listarActividades(planId: string, incluirHistorial = false): Promise<ActividadPlan[]> {
    let query = supabase
      .from('actividades_plan')
      .select('*, patrullas(nombre, color_patrulla)')
      .eq('plan_id', planId)
      .order('fecha', { ascending: true });
    if (!incluirHistorial) {
      query = query.in('estado', ['CONFIRMADA', 'MODIFICADA', 'CANCELADA']);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...row,
      patrulla_origen_nombre: row.patrullas?.nombre,
      patrulla_origen_color: row.patrullas?.color_patrulla,
    }));
  }

  static async listarConteoVotos(planId: string): Promise<Record<string, Record<string, number>>> {
    // devuelve { [fecha]: { [propuesta_id]: cantidad_de_votos } }
    const { data, error } = await supabase
      .from('votos_propuesta')
      .select('fecha, propuesta_id')
      .eq('plan_id', planId);
    if (error) throw error;
    const conteo: Record<string, Record<string, number>> = {};
    for (const voto of data || []) {
      conteo[voto.fecha] = conteo[voto.fecha] || {};
      conteo[voto.fecha][voto.propuesta_id] = (conteo[voto.fecha][voto.propuesta_id] || 0) + 1;
    }
    return conteo;
  }

  static async listarTokens(planId: string): Promise<TokenPatrulla[]> {
    const { data, error } = await supabase
      .from('tokens_patrulla_planificacion')
      .select('patrulla_id, token, activo, patrullas(nombre)')
      .eq('plan_id', planId);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      patrulla_id: row.patrulla_id,
      patrulla_nombre: row.patrullas?.nombre || 'Patrulla',
      token: row.token,
      activo: row.activo,
    }));
  }

  static linkMovil(token: string): string {
    return buildMobileLink(token);
  }

  // ==================================================================
  // LADO ADMIN — acciones sensibles (RPC + permiso server-side)
  // ==================================================================

  static async crearPlan(datos: {
    nombre: string; rama: string; fecha_inicio: string; fecha_fin: string; observaciones?: string;
  }): Promise<{ success: boolean; message?: string; plan_id?: string; tokens?: TokenPatrulla[]; advertencia?: string }> {
    const { data, error } = await supabase.rpc('crear_plan_trimestral', { p_datos: datos });
    if (error) throw error;
    return data as RpcResult;
  }

  /** Genera los tokens que falten (patrullas activadas después de crear el plan, o no encontradas por un bug ya corregido). */
  static async provisionarTokensFaltantes(planId: string): Promise<{ success: boolean; message?: string; tokens_generados?: number }> {
    const { data, error } = await supabase.rpc('provisionar_tokens_faltantes', { p_plan_id: planId });
    if (error) throw error;
    return data as RpcResult;
  }

  static async regenerarTokenPatrulla(planId: string, patrullaId: string): Promise<{ success: boolean; message?: string; token?: string }> {
    const { data, error } = await supabase.rpc('regenerar_token_patrulla', { p_plan_id: planId, p_patrulla_id: patrullaId });
    if (error) throw error;
    return data as RpcResult;
  }

  static async avanzarFase(planId: string, nuevoEstado: EstadoPlanTrimestral): Promise<RpcResult & { actividades_creadas?: number; actividades_canceladas?: number; empates?: Array<{ fecha: string; propuestas_empatadas: number }> }> {
    const { data, error } = await supabase.rpc('avanzar_fase_plan', { p_plan_id: planId, p_nuevo_estado: nuevoEstado });
    if (error) throw error;
    return data as RpcResult;
  }

  static async moverActividad(params: {
    actividadId: string; nuevaFecha?: string; nuevaFechaFin?: string;
    nuevoTitulo?: string; nuevaDescripcion?: string; nuevoLugar?: string; motivo: string;
  }): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('mover_actividad_plan', {
      p_actividad_id: params.actividadId,
      p_nueva_fecha: params.nuevaFecha || null,
      p_nueva_fecha_fin: params.nuevaFechaFin || null,
      p_nuevo_titulo: params.nuevoTitulo || null,
      p_nueva_descripcion: params.nuevaDescripcion || null,
      p_nuevo_lugar: params.nuevoLugar || null,
      p_motivo: params.motivo,
    });
    if (error) throw error;
    return data as RpcResult;
  }

  static async crearActividadManual(datos: {
    plan_id: string; fecha: string; fecha_fin?: string; titulo: string; descripcion?: string;
    lugar?: string; responsable_nombre_libre?: string; patrulla_origen_id?: string; propuesta_origen_id?: string;
  }): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('crear_actividad_plan_manual', { p_datos: datos });
    if (error) throw error;
    return data as RpcResult;
  }

  static async eliminarActividad(actividadId: string, motivo: string): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('eliminar_actividad_plan', { p_actividad_id: actividadId, p_motivo: motivo });
    if (error) throw error;
    return data as RpcResult;
  }

  /** Elimina el plan completo (propuestas, votos y actividades cascadean). Gateado server-side por planificacion:eliminar. */
  static async eliminarPlan(planId: string): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('eliminar_plan_trimestral', { p_plan_id: planId });
    if (error) throw error;
    return data as RpcResult;
  }

  /** Mover la fecha de una propuesta (fase de propuestas/votación) — update directo, gateado en la UI por can('planificacion:aprobar'). */
  static async moverPropuestaFecha(propuestaId: string, nuevaFecha: string): Promise<void> {
    const { error } = await supabase.from('propuestas_actividad').update({ fecha: nuevaFecha }).eq('id', propuestaId);
    if (error) throw error;
  }

  // ==================================================================
  // LADO PÚBLICO — link móvil por patrulla, sin login
  // ==================================================================

  static async obtenerContextoToken(token: string): Promise<ContextoToken> {
    const { data, error } = await supabase.rpc('obtener_contexto_token', { p_token: token });
    if (error) throw error;
    return data as ContextoToken;
  }

  static async registrarPropuesta(token: string, datos: {
    fecha: string; fecha_fin?: string; titulo: string; descripcion?: string; lugar?: string; es_especial?: boolean;
  }): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('registrar_propuesta', {
      p_token: token,
      p_fecha: datos.fecha,
      p_fecha_fin: datos.fecha_fin || null,
      p_titulo: datos.titulo,
      p_descripcion: datos.descripcion || null,
      p_lugar: datos.lugar || null,
      p_es_especial: datos.es_especial || false,
    });
    if (error) throw error;
    return data as RpcResult;
  }

  static async eliminarPropuesta(token: string, propuestaId: string): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('eliminar_propuesta', { p_token: token, p_propuesta_id: propuestaId });
    if (error) throw error;
    return data as RpcResult;
  }

  static async registrarVoto(token: string, fecha: string, propuestaId: string): Promise<RpcResult> {
    const { data, error } = await supabase.rpc('registrar_voto', { p_token: token, p_fecha: fecha, p_propuesta_id: propuestaId });
    if (error) throw error;
    return data as RpcResult;
  }

  // ==================================================================
  // Utilidad compartida: sábados entre dos fechas (slots del trimestre)
  // ==================================================================

  static generarSabados(fechaInicio: string, fechaFin: string): string[] {
    const sabados: string[] = [];
    const inicio = new Date(fechaInicio + 'T00:00:00');
    const fin = new Date(fechaFin + 'T00:00:00');
    const cursor = new Date(inicio);
    // 6 = sábado en getDay()
    const offset = (6 - cursor.getDay() + 7) % 7;
    cursor.setDate(cursor.getDate() + offset);
    while (cursor <= fin) {
      sabados.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 7);
    }
    return sabados;
  }
}
