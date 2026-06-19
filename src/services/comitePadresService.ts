import { supabase } from '../lib/supabase';

// ----------------------------------------------------------------
// Tipo para el resultado de registrar/actualizar miembro comité
// ----------------------------------------------------------------
export interface MiembroComiteInput {
  // Si se vincula una persona existente, su id (evita duplicar el documento)
  persona_id?: string;
  // Datos de persona (van a tabla personas)
  nombres: string;
  apellidos: string;
  numero_documento: string;
  tipo_documento?: 'DNI' | 'CARNET_EXTRANJERIA' | 'PASAPORTE';
  fecha_nacimiento?: string;
  sexo?: 'MASCULINO' | 'FEMENINO';
  correo?: string;
  email?: string;   // alias de correo (retrocompatibilidad)
  celular?: string;
  telefono?: string; // alias de celular (retrocompatibilidad)
  // Educación / Trabajo (van a tabla personas)
  centro_estudio?: string;
  anio_estudios?: string;
  ocupacion?: string;
  centro_laboral?: string;
  // Salud (van a tabla personas)
  grupo_sanguineo?: string;
  factor_sanguineo?: string;
  seguro_medico?: string;
  tipo_discapacidad?: string;
  carnet_conadis?: string;
  descripcion_discapacidad?: string;
  // Datos scout (van a tabla personas)
  rama?: string;
  codigo_asociado?: string;
  fecha_ingreso?: string;
  // Dirección (van a tabla personas)
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  // Datos del cargo (van a tabla comite_padres). Cargo es dinámico (catálogo).
  cargo: string;
  fecha_inicio: string;
  fecha_fin?: string;
  scout_hijo_id?: string;
  scout_hijo_nombre?: string;
  experiencia_previa?: string;
  habilidades?: string[];
  disponibilidad?: string;
  observaciones?: string;
}

// ----------------------------------------------------------------
// Cargo del catálogo del comité
// ----------------------------------------------------------------
export interface CargoComite {
  id: string;
  nombre: string;
  descripcion?: string | null;
  orden: number;
  activo: boolean;
}

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
   * Crea el registro en personas + comite_padres (transacción única en backend).
   */
  static async registrarMiembro(miembro: MiembroComiteInput): Promise<{ success: boolean; miembro_id?: string; comite_id?: string; error?: string }> {
    try {
      const datos_persona = {
        persona_id:       miembro.persona_id || '',
        nombres:          miembro.nombres,
        apellidos:        miembro.apellidos,
        numero_documento: miembro.numero_documento,
        tipo_documento:   miembro.tipo_documento || 'DNI',
        fecha_nacimiento: miembro.fecha_nacimiento || '',
        sexo:             miembro.sexo || 'MASCULINO',
        correo:           miembro.correo || miembro.email || '',
        celular:          miembro.celular || miembro.telefono || '',
        // educación / trabajo
        centro_estudio:   miembro.centro_estudio || '',
        anio_estudios:    miembro.anio_estudios || '',
        ocupacion:        miembro.ocupacion || '',
        centro_laboral:   miembro.centro_laboral || '',
        // salud
        grupo_sanguineo:  miembro.grupo_sanguineo || '',
        factor_sanguineo: miembro.factor_sanguineo || '',
        seguro_medico:    miembro.seguro_medico || '',
        tipo_discapacidad: miembro.tipo_discapacidad || '',
        carnet_conadis:   miembro.carnet_conadis || '',
        descripcion_discapacidad: miembro.descripcion_discapacidad || '',
        // scout
        rama:             miembro.rama || '',
        codigo_asociado:  miembro.codigo_asociado || '',
        fecha_ingreso:    miembro.fecha_ingreso || '',
        // dirección
        direccion:        miembro.direccion || '',
        departamento:     miembro.departamento || '',
        provincia:        miembro.provincia || '',
        distrito:         miembro.distrito || '',
      };
      const datos_comite = {
        cargo:             miembro.cargo,
        fecha_inicio:      miembro.fecha_inicio,
        fecha_fin:         miembro.fecha_fin || '',
        scout_hijo_id:     miembro.scout_hijo_id || '',
        scout_hijo_nombre: miembro.scout_hijo_nombre || '',
        experiencia_previa:miembro.experiencia_previa || '',
        habilidades:       miembro.habilidades || [],
        disponibilidad:    miembro.disponibilidad || '',
        observaciones:     miembro.observaciones || '',
      };

      const { data, error } = await supabase.rpc('api_registrar_miembro_comite', {
        p_datos_persona: datos_persona,
        p_datos_comite:  datos_comite,
      });

      if (error) throw error;
      const result = data as { success: boolean; comite_id?: string; persona_id?: string; error?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return { success: true, comite_id: result.comite_id, miembro_id: result.comite_id };
    } catch (err) {
      console.error('❌ Error al registrar miembro comité:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }

  /**
   * 📋 Obtener miembros del comité
   * Datos personales vienen de tabla personas (fuente de verdad).
   */
  static async getMiembrosComite(filtros?: {
    cargo?: string;
    activos_solo?: boolean;
  }): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('api_listar_comite_padres', {
        p_activos_solo: filtros?.activos_solo !== false,
        p_cargo:        filtros?.cargo || null,
      });

      if (error) throw error;
      const result = data as { success: boolean; miembros?: any[]; error?: string };
      return result?.miembros || [];
    } catch (err) {
      console.error('❌ Error al obtener miembros comité:', err);
      return [];
    }
  }

  /**
   * 🎯 Obtener miembro por ID
   * Filtra el listado completo por id (evita crear un RPC extra).
   */
  static async getMiembroById(id: string): Promise<any | null> {
    try {
      const todos = await ComitePadresService.getMiembrosComite({ activos_solo: false });
      return todos.find((m: any) => m.id === id) || null;
    } catch (err) {
      console.error('❌ Error al obtener miembro comité:', err);
      return null;
    }
  }

  /**
   * ✏️ Actualizar miembro del comité
   * Actualiza datos en personas + comite_padres (transacción en backend).
   */
  static async updateMiembro(id: string, miembro: Partial<MiembroComiteInput>): Promise<{ success: boolean; error?: string }> {
    try {
      const datos_persona = {
        nombres:          miembro.nombres,
        apellidos:        miembro.apellidos,
        numero_documento: miembro.numero_documento,
        fecha_nacimiento: miembro.fecha_nacimiento,
        sexo:             miembro.sexo,
        correo:           miembro.correo || miembro.email,
        celular:          miembro.celular || miembro.telefono,
        // educación / trabajo
        centro_estudio:   miembro.centro_estudio,
        anio_estudios:    miembro.anio_estudios,
        ocupacion:        miembro.ocupacion,
        centro_laboral:   miembro.centro_laboral,
        // salud
        grupo_sanguineo:  miembro.grupo_sanguineo,
        factor_sanguineo: miembro.factor_sanguineo,
        seguro_medico:    miembro.seguro_medico,
        tipo_discapacidad: miembro.tipo_discapacidad,
        carnet_conadis:   miembro.carnet_conadis,
        descripcion_discapacidad: miembro.descripcion_discapacidad,
        // scout
        rama:             miembro.rama,
        codigo_asociado:  miembro.codigo_asociado,
        fecha_ingreso:    miembro.fecha_ingreso,
        // dirección
        direccion:        miembro.direccion,
        departamento:     miembro.departamento,
        provincia:        miembro.provincia,
        distrito:         miembro.distrito,
      };
      const datos_comite = {
        cargo:             miembro.cargo,
        fecha_inicio:      miembro.fecha_inicio,
        fecha_fin:         miembro.fecha_fin,
        scout_hijo_id:     miembro.scout_hijo_id,
        scout_hijo_nombre: miembro.scout_hijo_nombre,
        experiencia_previa:miembro.experiencia_previa,
        habilidades:       miembro.habilidades,
        disponibilidad:    miembro.disponibilidad,
        observaciones:     miembro.observaciones,
      };

      const { data, error } = await supabase.rpc('api_actualizar_miembro_comite', {
        p_comite_id:     id,
        p_datos_persona: datos_persona,
        p_datos_comite:  datos_comite,
      });

      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return { success: true };
    } catch (err) {
      console.error('❌ Error al actualizar miembro comité:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }

  /**
   * 🗑️ Desactivar miembro del comité (soft delete)
   * La persona en la tabla personas persiste.
   */
  static async deleteMiembro(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('api_eliminar_miembro_comite', {
        p_comite_id: id,
      });

      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return { success: true };
    } catch (err) {
      console.error('❌ Error al eliminar miembro comité:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }

  // ============= 🏷️ CATÁLOGO DE CARGOS DEL COMITÉ =============

  /**
   * 📋 Listar cargos del catálogo del comité.
   */
  static async listarCargos(soloActivos: boolean = false): Promise<CargoComite[]> {
    try {
      const { data, error } = await supabase.rpc('api_listar_cargos_comite', {
        p_solo_activos: soloActivos,
      });
      if (error) throw error;
      const result = data as { success: boolean; data?: CargoComite[]; error?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return result.data || [];
    } catch (err) {
      console.error('❌ Error al listar cargos del comité:', err);
      return [];
    }
  }

  /**
   * ➕ Crear un cargo del comité.
   */
  static async crearCargo(cargo: { nombre: string; descripcion?: string; orden?: number; activo?: boolean }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('api_crear_cargo_comite', {
        p_datos: {
          nombre: cargo.nombre,
          descripcion: cargo.descripcion || '',
          orden: cargo.orden ?? 0,
          activo: cargo.activo ?? true,
        },
      });
      if (error) throw error;
      const result = data as { success: boolean; id?: string; error?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return { success: true, id: result.id };
    } catch (err) {
      console.error('❌ Error al crear cargo del comité:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }

  /**
   * ✏️ Actualizar un cargo del comité.
   */
  static async actualizarCargo(id: string, cargo: { nombre?: string; descripcion?: string; orden?: number; activo?: boolean }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('api_actualizar_cargo_comite', {
        p_id: id,
        p_datos: cargo,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return { success: true };
    } catch (err) {
      console.error('❌ Error al actualizar cargo del comité:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }

  /**
   * 🗑️ Eliminar un cargo del comité.
   */
  static async eliminarCargo(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('api_eliminar_cargo_comite', {
        p_id: id,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return { success: true };
    } catch (err) {
      console.error('❌ Error al eliminar cargo del comité:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
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