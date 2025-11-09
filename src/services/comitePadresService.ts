import { supabase } from '../lib/supabase';

/**
 * ======================================================================
 * 👨‍👩‍👧‍👦 COMITE PADRES SERVICE - CLIENTE DE MICROSERVICIO/API
 * ======================================================================
 * 
 * Este servicio actúa como un cliente puro de microservicio/API.
 * TODA la lógica de negocio reside en el backend (Supabase Database Functions).
 * ======================================================================
 */
export class ComitePadresService {

  // ============= 👨‍👩‍👧‍👦 GESTIÓN DE MIEMBROS DEL COMITÉ =============
  
  /**
   * 👤 Registrar miembro del comité
   * Endpoint: POST /api/comite-padres/miembros
   */
  static async registrarMiembro(miembro: {
    nombres: string;
    apellidos: string;
    email: string;
    telefono?: string;
    cargo: string;
    fecha_inicio: string;
    fecha_fin?: string;
    scout_hijo_id?: string;
    experiencia_previa?: string;
    habilidades?: string[];
    disponibilidad?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; miembro_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('comite_padres')
        .insert({
          nombres: miembro.nombres,
          apellidos: miembro.apellidos,
          email: miembro.email,
          telefono: miembro.telefono,
          cargo: miembro.cargo,
          fecha_inicio: miembro.fecha_inicio,
          fecha_fin: miembro.fecha_fin,
          scout_hijo_id: miembro.scout_hijo_id,
          experiencia_previa: miembro.experiencia_previa,
          habilidades: miembro.habilidades || [],
          disponibilidad: miembro.disponibilidad,
          observaciones: miembro.observaciones,
          activo: true,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, miembro_id: data.id };
    } catch (error) {
      console.error('❌ Error al registrar miembro:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 📋 Obtener miembros del comité
   * Endpoint: GET /api/comite-padres/miembros
   */
  static async getMiembrosComite(filtros?: {
    cargo?: string;
    activos_solo?: boolean;
    año?: number;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('comite_padres')
        .select('*');

      if (filtros?.cargo) {
        query = query.eq('cargo', filtros.cargo);
      }

      if (filtros?.activos_solo !== false) {
        query = query.eq('activo', true);
      }

      if (filtros?.año) {
        const inicioAño = `${filtros.año}-01-01`;
        const finAño = `${filtros.año}-12-31`;
        query = query.gte('fecha_inicio', inicioAño).lte('fecha_inicio', finAño);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener miembros:', error);
      return [];
    }
  }

  /**
   * 🎯 Obtener miembro por ID
   * Endpoint: GET /api/comite-padres/miembros/{id}
   */
  static async getMiembroById(id: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('comite_padres')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener miembro:', error);
      return null;
    }
  }

  /**
   * ✏️ Actualizar miembro del comité
   * Endpoint: PUT /api/comite-padres/miembros/{id}
   */
  static async updateMiembro(id: string, miembro: {
    nombres?: string;
    apellidos?: string;
    email?: string;
    telefono?: string;
    cargo?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    scout_hijo_id?: string;
    experiencia_previa?: string;
    habilidades?: string[];
    disponibilidad?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (miembro.nombres) updateData.nombres = miembro.nombres;
      if (miembro.apellidos) updateData.apellidos = miembro.apellidos;
      if (miembro.email) updateData.email = miembro.email;
      if (miembro.telefono) updateData.telefono = miembro.telefono;
      if (miembro.cargo) updateData.cargo = miembro.cargo;
      if (miembro.fecha_inicio) updateData.fecha_inicio = miembro.fecha_inicio;
      if (miembro.fecha_fin) updateData.fecha_fin = miembro.fecha_fin;
      if (miembro.scout_hijo_id) updateData.scout_hijo_id = miembro.scout_hijo_id;
      if (miembro.experiencia_previa) updateData.experiencia_previa = miembro.experiencia_previa;
      if (miembro.habilidades) updateData.habilidades = miembro.habilidades;
      if (miembro.disponibilidad) updateData.disponibilidad = miembro.disponibilidad;
      if (miembro.observaciones) updateData.observaciones = miembro.observaciones;

      const { error } = await supabase
        .from('comite_padres')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al actualizar miembro:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 🗑️ Eliminar miembro del comité
   * Endpoint: DELETE /api/comite-padres/miembros/{id}
   */
  static async deleteMiembro(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('comite_padres')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al eliminar miembro:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // ============= 📅 GESTIÓN DE REUNIONES =============
  
  /**
   * 📅 Programar reunión del comité
   * Endpoint: POST /api/comite-padres/reuniones
   */
  static async programarReunion(reunion: {
    fecha: string;
    hora: string;
    lugar: string;
    tipo: 'ordinaria' | 'extraordinaria' | 'urgente';
    agenda: string[];
    convocante: string;
    observaciones?: string;
  }): Promise<{ success: boolean; reunion_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('programar_reunion_comite', {
          p_fecha: reunion.fecha,
          p_hora: reunion.hora,
          p_lugar: reunion.lugar,
          p_tipo: reunion.tipo,
          p_agenda: reunion.agenda,
          p_convocante: reunion.convocante,
          p_observaciones: reunion.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al programar reunión:', error);
      throw error;
    }
  }

  /**
   * 📋 Obtener reuniones del comité
   * Endpoint: GET /api/comite-padres/reuniones
   */
  static async getReuniones(filtros?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    tipo?: string;
  }): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_reuniones_comite', { p_filtros: filtros || {} });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener reuniones:', error);
      throw error;
    }
  }

  /**
   * ✅ Registrar asistencia a reunión
   * Endpoint: POST /api/comite-padres/asistencias
   */
  static async registrarAsistencia(asistencia: {
    reunion_id: string;
    miembro_id: string;
    estado: 'presente' | 'ausente' | 'justificado';
    observaciones?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_asistencia_comite', {
          p_reunion_id: asistencia.reunion_id,
          p_miembro_id: asistencia.miembro_id,
          p_estado: asistencia.estado,
          p_observaciones: asistencia.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar asistencia:', error);
      throw error;
    }
  }

  // ============= 📝 ACTAS Y DOCUMENTACIÓN =============
  
  /**
   * 📝 Crear acta de reunión
   * Endpoint: POST /api/comite-padres/actas
   */
  static async crearActa(acta: {
    reunion_id: string;
    secretario_id: string;
    asistentes: string[];
    agenda_tratada: string[];
    acuerdos: Array<{
      tema: string;
      acuerdo: string;
      responsable?: string;
      fecha_limite?: string;
    }>;
    proximos_pasos: string[];
    observaciones?: string;
  }): Promise<{ success: boolean; acta_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('crear_acta_reunion', {
          p_reunion_id: acta.reunion_id,
          p_secretario_id: acta.secretario_id,
          p_asistentes: acta.asistentes,
          p_agenda_tratada: acta.agenda_tratada,
          p_acuerdos: acta.acuerdos,
          p_proximos_pasos: acta.proximos_pasos,
          p_observaciones: acta.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al crear acta:', error);
      throw error;
    }
  }

  /**
   * 📄 Obtener actas de reuniones
   * Endpoint: GET /api/comite-padres/actas
   */
  static async getActas(filtros?: {
    año?: number;
    reunion_id?: string;
  }): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_actas_comite', { p_filtros: filtros || {} });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener actas:', error);
      throw error;
    }
  }

  // ============= 🎯 COMISIONES Y PROYECTOS =============
  
  /**
   * 🎯 Crear comisión de trabajo
   * Endpoint: POST /api/comite-padres/comisiones
   */
  static async crearComision(comision: {
    nombre: string;
    objetivo: string;
    coordinador_id: string;
    miembros: string[];
    fecha_inicio: string;
    fecha_fin_estimada?: string;
    presupuesto_asignado?: number;
    actividades_planificadas: string[];
  }): Promise<{ success: boolean; comision_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('crear_comision_comite', {
          p_nombre: comision.nombre,
          p_objetivo: comision.objetivo,
          p_coordinador_id: comision.coordinador_id,
          p_miembros: comision.miembros,
          p_fecha_inicio: comision.fecha_inicio,
          p_fecha_fin_estimada: comision.fecha_fin_estimada,
          p_presupuesto_asignado: comision.presupuesto_asignado,
          p_actividades_planificadas: comision.actividades_planificadas
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al crear comisión:', error);
      throw error;
    }
  }

  /**
   * 📋 Obtener comisiones activas
   * Endpoint: GET /api/comite-padres/comisiones
   */
  static async getComisiones(activas_solo: boolean = true): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_comisiones_comite', { p_activas_solo: activas_solo });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener comisiones:', error);
      throw error;
    }
  }

  // ============= 💰 GESTIÓN FINANCIERA =============
  
  /**
   * 💰 Registrar actividad de recaudación
   * Endpoint: POST /api/comite-padres/recaudaciones
   */
  static async registrarRecaudacion(recaudacion: {
    nombre_actividad: string;
    tipo: 'rifas' | 'ventas' | 'eventos' | 'donaciones' | 'cuotas';
    objetivo_financiero: number;
    fecha_inicio: string;
    fecha_fin?: string;
    responsable_id: string;
    descripcion?: string;
    estrategia?: string;
  }): Promise<{ success: boolean; recaudacion_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_actividad_recaudacion', {
          p_nombre_actividad: recaudacion.nombre_actividad,
          p_tipo: recaudacion.tipo,
          p_objetivo_financiero: recaudacion.objetivo_financiero,
          p_fecha_inicio: recaudacion.fecha_inicio,
          p_fecha_fin: recaudacion.fecha_fin,
          p_responsable_id: recaudacion.responsable_id,
          p_descripcion: recaudacion.descripcion,
          p_estrategia: recaudacion.estrategia
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar recaudación:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener resumen financiero
   * Endpoint: GET /api/comite-padres/finanzas/resumen
   */
  static async getResumenFinanciero(periodo?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<{
    ingresos_totales: number;
    gastos_aprobados: number;
    saldo_disponible: number;
    actividades_recaudacion_activas: number;
    objetivo_anual: number;
    porcentaje_cumplimiento: number;
    proyecciones: {
      ingresos_estimados: number;
      gastos_proyectados: number;
    };
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_resumen_financiero_comite', { p_periodo: periodo || {} });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener resumen financiero:', error);
      throw error;
    }
  }

  // ============= 📊 COMUNICACIÓN Y EVENTOS =============
  
  /**
   * 📢 Programar comunicación
   * Endpoint: POST /api/comite-padres/comunicaciones
   */
  static async programarComunicacion(comunicacion: {
    tipo: 'circular' | 'invitacion' | 'urgente' | 'informativo';
    asunto: string;
    mensaje: string;
    destinatarios: 'todos' | 'miembros_comite' | 'padres_familia' | 'dirigentes';
    fecha_envio?: string;
    canal: 'email' | 'whatsapp' | 'ambos';
    archivos_adjuntos?: string[];
    requiere_confirmacion: boolean;
  }): Promise<{ success: boolean; comunicacion_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('programar_comunicacion_comite', {
          p_tipo: comunicacion.tipo,
          p_asunto: comunicacion.asunto,
          p_mensaje: comunicacion.mensaje,
          p_destinatarios: comunicacion.destinatarios,
          p_fecha_envio: comunicacion.fecha_envio || new Date().toISOString(),
          p_canal: comunicacion.canal,
          p_archivos_adjuntos: comunicacion.archivos_adjuntos || [],
          p_requiere_confirmacion: comunicacion.requiere_confirmacion
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al programar comunicación:', error);
      throw error;
    }
  }

  /**
   * 🎉 Organizar evento familiar
   * Endpoint: POST /api/comite-padres/eventos
   */
  static async organizarEvento(evento: {
    nombre: string;
    descripcion: string;
    fecha: string;
    hora_inicio: string;
    hora_fin?: string;
    lugar: string;
    tipo: 'reunion_padres' | 'actividad_familiar' | 'fundraising' | 'celebracion';
    cupo_maximo?: number;
    costo_por_familia?: number;
    responsable_organizacion: string;
    comisiones_apoyo?: string[];
    requisitos_participacion?: string[];
  }): Promise<{ success: boolean; evento_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('organizar_evento_comite', {
          p_nombre: evento.nombre,
          p_descripcion: evento.descripcion,
          p_fecha: evento.fecha,
          p_hora_inicio: evento.hora_inicio,
          p_hora_fin: evento.hora_fin,
          p_lugar: evento.lugar,
          p_tipo: evento.tipo,
          p_cupo_maximo: evento.cupo_maximo,
          p_costo_por_familia: evento.costo_por_familia,
          p_responsable_organizacion: evento.responsable_organizacion,
          p_comisiones_apoyo: evento.comisiones_apoyo || [],
          p_requisitos_participacion: evento.requisitos_participacion || []
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al organizar evento:', error);
      throw error;
    }
  }

  // ============= 📊 REPORTES Y ESTADÍSTICAS =============
  
  /**
   * 📊 Obtener estadísticas del comité
   * Endpoint: GET /api/comite-padres/estadisticas
   */
  static async getEstadisticasComite(): Promise<{
    miembros_activos: number;
    reuniones_realizadas_año: number;
    promedio_asistencia: number;
    comisiones_activas: number;
    eventos_organizados: number;
    monto_recaudado_año: number;
    familias_participantes: number;
    nivel_satisfaccion: number;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_comite');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }

  /**
   * 🗂️ Generar reporte anual
   * Endpoint: GET /api/comite-padres/reporte-anual
   */
  static async generarReporteAnual(año: number): Promise<{
    reporte_id: string;
    datos: any;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_anual_comite', { p_año: año });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar reporte anual:', error);
      throw error;
    }
  }

  /**
   * ⚠️ Obtener alertas y recordatorios
   * Endpoint: GET /api/comite-padres/alertas
   */
  static async getAlertas(): Promise<Array<{
    tipo: 'reunion_pendiente' | 'pago_vencido' | 'baja_asistencia' | 'meta_no_cumplida';
    mensaje: string;
    prioridad: 'alta' | 'media' | 'baja';
    fecha_limite?: string;
    accion_recomendada: string;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_alertas_comite');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener alertas:', error);
      throw error;
    }
  }
}

/**
 * ======================================================================
 * 📝 NOTAS DE IMPLEMENTACIÓN
 * ======================================================================
 * 
 * Sistema integral de gestión del comité de padres con:
 * - Gestión completa de miembros y cargos
 * - Sistema de reuniones y actas formales
 * - Comisiones de trabajo especializadas
 * - Gestión financiera y recaudación
 * - Comunicación masiva automatizada
 * - Organización de eventos familiares
 * - Reportes de gestión y transparencia
 * ======================================================================
 */

export default ComitePadresService;