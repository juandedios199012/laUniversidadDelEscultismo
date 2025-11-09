import { supabase } from '../lib/supabase';

/**
 * ======================================================================
 * 👥 DIRIGENTE SERVICE - CLIENTE DE MICROSERVICIO/API
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
export class DirigenteService {

  // ============= 👥 GESTIÓN DE DIRIGENTES =============
  
  /**
   * 👥 Crear nuevo dirigente
   * Endpoint: POST /api/dirigentes
   */
  static async crearDirigente(dirigente: {
    nombres: string;
    apellidos: string;
    email: string;
    telefono?: string;
    fecha_nacimiento?: string;
    direccion?: string;
    cargo: string;
    rama: string;
    fecha_ingreso?: string;
    estado: 'activo' | 'inactivo' | 'licencia';
    experiencia_previa?: string;
    especialidades?: string[];
    nivel_formacion?: string;
    certificaciones?: string[];
    observaciones?: string;
  }): Promise<{ success: boolean; dirigente_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('crear_dirigente', {
          p_nombres: dirigente.nombres,
          p_apellidos: dirigente.apellidos,
          p_email: dirigente.email,
          p_telefono: dirigente.telefono,
          p_fecha_nacimiento: dirigente.fecha_nacimiento,
          p_direccion: dirigente.direccion,
          p_cargo: dirigente.cargo,
          p_rama: dirigente.rama,
          p_fecha_ingreso: dirigente.fecha_ingreso || new Date().toISOString(),
          p_estado: dirigente.estado,
          p_experiencia_previa: dirigente.experiencia_previa,
          p_especialidades: dirigente.especialidades || [],
          p_nivel_formacion: dirigente.nivel_formacion,
          p_certificaciones: dirigente.certificaciones || [],
          p_observaciones: dirigente.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al crear dirigente:', error);
      throw error;
    }
  }

  /**
   * 📋 Obtener todos los dirigentes
   * Endpoint: GET /api/dirigentes
   */
  static async getDirigentes(filtros?: {
    rama?: string;
    cargo?: string;
    estado?: string;
    nivel_formacion?: string;
    activos_solo?: boolean;
  }): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_dirigentes', { p_filtros: filtros || {} });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener dirigentes:', error);
      throw error;
    }
  }

  /**
   * 🎯 Obtener dirigente por ID
   * Endpoint: GET /api/dirigentes/{id}
   */
  static async getDirigenteById(id: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_dirigente_por_id', { p_dirigente_id: id });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener dirigente:', error);
      throw error;
    }
  }

  /**
   * ✏️ Actualizar dirigente
   * Endpoint: PUT /api/dirigentes/{id}
   */
  static async updateDirigente(id: string, updates: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('actualizar_dirigente', {
          p_dirigente_id: id,
          p_datos_actualizacion: updates
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al actualizar dirigente:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Eliminar dirigente
   * Endpoint: DELETE /api/dirigentes/{id}
   */
  static async deleteDirigente(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('eliminar_dirigente', { p_dirigente_id: id });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al eliminar dirigente:', error);
      throw error;
    }
  }

  // ============= 🎓 GESTIÓN DE FORMACIÓN =============
  
  /**
   * 🎓 Registrar capacitación
   * Endpoint: POST /api/dirigentes/capacitaciones
   */
  static async registrarCapacitacion(capacitacion: {
    dirigente_id: string;
    nombre_curso: string;
    institucion: string;
    fecha_inicio: string;
    fecha_fin?: string;
    horas_academicas?: number;
    certificado_obtenido: boolean;
    puntuacion?: number;
    observaciones?: string;
    documentos?: string[];
  }): Promise<{ success: boolean; capacitacion_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_capacitacion_dirigente', {
          p_dirigente_id: capacitacion.dirigente_id,
          p_nombre_curso: capacitacion.nombre_curso,
          p_institucion: capacitacion.institucion,
          p_fecha_inicio: capacitacion.fecha_inicio,
          p_fecha_fin: capacitacion.fecha_fin,
          p_horas_academicas: capacitacion.horas_academicas,
          p_certificado_obtenido: capacitacion.certificado_obtenido,
          p_puntuacion: capacitacion.puntuacion,
          p_observaciones: capacitacion.observaciones,
          p_documentos: capacitacion.documentos || []
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar capacitación:', error);
      throw error;
    }
  }

  /**
   * 📚 Obtener historial de capacitaciones
   * Endpoint: GET /api/dirigentes/{id}/capacitaciones
   */
  static async getCapacitacionesDirigente(dirigenteId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_capacitaciones_dirigente', { p_dirigente_id: dirigenteId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener capacitaciones:', error);
      throw error;
    }
  }

  /**
   * 🏆 Actualizar nivel de formación
   * Endpoint: PUT /api/dirigentes/{id}/nivel-formacion
   */
  static async actualizarNivelFormacion(dirigenteId: string, nuevoNivel: {
    nivel: string;
    fecha_obtencion: string;
    institucion?: string;
    certificado?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('actualizar_nivel_formacion_dirigente', {
          p_dirigente_id: dirigenteId,
          p_nuevo_nivel: nuevoNivel
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al actualizar nivel de formación:', error);
      throw error;
    }
  }

  // ============= 🎯 GESTIÓN DE RESPONSABILIDADES =============
  
  /**
   * 🎯 Asignar responsabilidad
   * Endpoint: POST /api/dirigentes/responsabilidades
   */
  static async asignarResponsabilidad(asignacion: {
    dirigente_id: string;
    tipo_responsabilidad: string;
    descripcion: string;
    fecha_inicio: string;
    fecha_fin?: string;
    ambito: 'grupo' | 'rama' | 'patrulla' | 'actividad' | 'evento';
    referencia_id?: string;
    prioridad?: 'alta' | 'media' | 'baja';
    observaciones?: string;
  }): Promise<{ success: boolean; responsabilidad_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('asignar_responsabilidad_dirigente', {
          p_dirigente_id: asignacion.dirigente_id,
          p_tipo_responsabilidad: asignacion.tipo_responsabilidad,
          p_descripcion: asignacion.descripcion,
          p_fecha_inicio: asignacion.fecha_inicio,
          p_fecha_fin: asignacion.fecha_fin,
          p_ambito: asignacion.ambito,
          p_referencia_id: asignacion.referencia_id,
          p_prioridad: asignacion.prioridad || 'media',
          p_observaciones: asignacion.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al asignar responsabilidad:', error);
      throw error;
    }
  }

  /**
   * 📋 Obtener responsabilidades activas
   * Endpoint: GET /api/dirigentes/{id}/responsabilidades
   */
  static async getResponsabilidadesDirigente(dirigenteId: string, soloActivas: boolean = true): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_responsabilidades_dirigente', {
          p_dirigente_id: dirigenteId,
          p_solo_activas: soloActivas
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener responsabilidades:', error);
      throw error;
    }
  }

  /**
   * ✅ Completar responsabilidad
   * Endpoint: PUT /api/dirigentes/responsabilidades/{id}/completar
   */
  static async completarResponsabilidad(responsabilidadId: string, datos: {
    fecha_completado: string;
    resultado?: 'exitoso' | 'parcial' | 'fallido';
    observaciones_finales?: string;
    documentos_evidencia?: string[];
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('completar_responsabilidad_dirigente', {
          p_responsabilidad_id: responsabilidadId,
          p_datos_completado: datos
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al completar responsabilidad:', error);
      throw error;
    }
  }

  // ============= 📊 EVALUACIONES Y DESEMPEÑO =============
  
  /**
   * 📊 Registrar evaluación de desempeño
   * Endpoint: POST /api/dirigentes/evaluaciones
   */
  static async registrarEvaluacion(evaluacion: {
    dirigente_id: string;
    evaluador_id: string;
    periodo_inicio: string;
    periodo_fin: string;
    puntuacion_liderazgo: number;
    puntuacion_conocimiento: number;
    puntuacion_compromiso: number;
    puntuacion_relaciones: number;
    puntuacion_general: number;
    fortalezas: string[];
    areas_mejora: string[];
    objetivos_proximos: string[];
    observaciones?: string;
    plan_desarrollo?: string;
  }): Promise<{ success: boolean; evaluacion_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_evaluacion_dirigente', {
          p_dirigente_id: evaluacion.dirigente_id,
          p_evaluador_id: evaluacion.evaluador_id,
          p_periodo_inicio: evaluacion.periodo_inicio,
          p_periodo_fin: evaluacion.periodo_fin,
          p_puntuaciones: {
            liderazgo: evaluacion.puntuacion_liderazgo,
            conocimiento: evaluacion.puntuacion_conocimiento,
            compromiso: evaluacion.puntuacion_compromiso,
            relaciones: evaluacion.puntuacion_relaciones,
            general: evaluacion.puntuacion_general
          },
          p_fortalezas: evaluacion.fortalezas,
          p_areas_mejora: evaluacion.areas_mejora,
          p_objetivos_proximos: evaluacion.objetivos_proximos,
          p_observaciones: evaluacion.observaciones,
          p_plan_desarrollo: evaluacion.plan_desarrollo
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar evaluación:', error);
      throw error;
    }
  }

  /**
   * 📈 Obtener historial de evaluaciones
   * Endpoint: GET /api/dirigentes/{id}/evaluaciones
   */
  static async getEvaluacionesDirigente(dirigenteId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_evaluaciones_dirigente', { p_dirigente_id: dirigenteId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener evaluaciones:', error);
      throw error;
    }
  }

  // ============= 📅 GESTIÓN DE DISPONIBILIDAD =============
  
  /**
   * 📅 Registrar disponibilidad
   * Endpoint: POST /api/dirigentes/disponibilidad
   */
  static async registrarDisponibilidad(disponibilidad: {
    dirigente_id: string;
    fecha_inicio: string;
    fecha_fin: string;
    tipo: 'disponible' | 'ocupado' | 'vacaciones' | 'licencia' | 'enfermedad';
    descripcion?: string;
    es_recurrente: boolean;
    patron_recurrencia?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; disponibilidad_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_disponibilidad_dirigente', {
          p_dirigente_id: disponibilidad.dirigente_id,
          p_fecha_inicio: disponibilidad.fecha_inicio,
          p_fecha_fin: disponibilidad.fecha_fin,
          p_tipo: disponibilidad.tipo,
          p_descripcion: disponibilidad.descripcion,
          p_es_recurrente: disponibilidad.es_recurrente,
          p_patron_recurrencia: disponibilidad.patron_recurrencia,
          p_observaciones: disponibilidad.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar disponibilidad:', error);
      throw error;
    }
  }

  /**
   * 🗓️ Obtener disponibilidad de dirigente
   * Endpoint: GET /api/dirigentes/{id}/disponibilidad
   */
  static async getDisponibilidadDirigente(dirigenteId: string, filtros?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    tipo?: string;
  }): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_disponibilidad_dirigente', {
          p_dirigente_id: dirigenteId,
          p_filtros: filtros || {}
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener disponibilidad:', error);
      throw error;
    }
  }

  /**
   * 🔍 Buscar dirigentes disponibles
   * Endpoint: GET /api/dirigentes/disponibles
   */
  static async buscarDirigentesDisponibles(criterios: {
    fecha_inicio: string;
    fecha_fin: string;
    rama?: string;
    especialidad?: string;
    nivel_minimo?: string;
    cargo?: string;
  }): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('buscar_dirigentes_disponibles', { p_criterios: criterios });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al buscar dirigentes disponibles:', error);
      throw error;
    }
  }

  // ============= 📊 REPORTES Y ESTADÍSTICAS =============
  
  /**
   * 📊 Obtener estadísticas de dirigentes
   * Endpoint: GET /api/dirigentes/estadisticas
   */
  static async getEstadisticasDirigentes(): Promise<{
    total_dirigentes: number;
    dirigentes_activos: number;
    dirigentes_en_formacion: number;
    distribucion_por_rama: Record<string, number>;
    distribucion_por_nivel: Record<string, number>;
    promedio_antiguedad: number;
    proximas_capacitaciones: number;
    evaluaciones_pendientes: number;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_dirigentes');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }

  /**
   * 🏆 Obtener dirigentes destacados
   * Endpoint: GET /api/dirigentes/destacados
   */
  static async getDirigentesDestacados(criterio: 'evaluacion' | 'capacitacion' | 'antiguedad' | 'responsabilidades'): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_dirigentes_destacados', { p_criterio: criterio });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener dirigentes destacados:', error);
      throw error;
    }
  }

  /**
   * ⚠️ Obtener alertas de dirigentes
   * Endpoint: GET /api/dirigentes/alertas
   */
  static async getAlertasDirigentes(): Promise<Array<{
    tipo: 'capacitacion_vencida' | 'evaluacion_pendiente' | 'licencia_proxima' | 'sobrecarga_responsabilidades';
    dirigente_id: string;
    dirigente_nombre: string;
    mensaje: string;
    prioridad: 'alta' | 'media' | 'baja';
    fecha_limite?: string;
    accion_recomendada: string;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_alertas_dirigentes');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener alertas:', error);
      throw error;
    }
  }

  /**
   * 🗂️ Generar reporte de dirigentes
   * Endpoint: GET /api/dirigentes/reportes
   */
  static async generarReporteDirigentes(
    tipo: 'general' | 'formacion' | 'evaluaciones' | 'responsabilidades' | 'disponibilidad',
    filtros?: {
      rama?: string;
      nivel_formacion?: string;
      fecha_desde?: string;
      fecha_hasta?: string;
      estado?: string;
    }
  ): Promise<{
    reporte_id: string;
    url_descarga?: string;
    datos: any;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_dirigentes', {
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

  /**
   * 📋 Obtener plan de desarrollo de dirigente
   * Endpoint: GET /api/dirigentes/{id}/plan-desarrollo
   */
  static async getPlanDesarrolloDirigente(dirigenteId: string): Promise<{
    dirigente_info: any;
    nivel_actual: string;
    proximo_nivel: string;
    capacitaciones_requeridas: string[];
    capacitaciones_completadas: string[];
    objetivos_pendientes: string[];
    timeline_estimado: Array<{
      hito: string;
      fecha_estimada: string;
      estado: 'pendiente' | 'en_progreso' | 'completado';
    }>;
    recomendaciones: string[];
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_plan_desarrollo_dirigente', { p_dirigente_id: dirigenteId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener plan de desarrollo:', error);
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
 * 2. 👥 Gestión completa del ciclo de vida de dirigentes
 * 3. 🎓 Sistema integrado de formación y capacitación
 * 4. 📊 Evaluaciones y seguimiento de desempeño
 * 5. 📅 Gestión de disponibilidad y asignaciones
 * 6. 🔐 Seguridad manejada por RLS policies
 * 7. 📈 Analytics y reportes automatizados
 * 
 * Características especiales:
 * - Sistema de niveles de formación progresivo
 * - Evaluaciones 360° con múltiples criterios
 * - Gestión inteligente de disponibilidad
 * - Detección automática de dirigentes destacados
 * - Alertas proactivas de gestión
 * - Planes de desarrollo personalizados
 * 
 * Próximos pasos:
 * - Implementar todas las Database Functions correspondientes
 * - Agregar integración con calendario externo
 * - Implementar sistema de mentoring
 * - Agregar gamificación para formación
 * - Integrar con plataformas de e-learning
 * ======================================================================
 */

export default DirigenteService;