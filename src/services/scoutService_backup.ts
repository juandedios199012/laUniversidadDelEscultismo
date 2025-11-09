import { supabase } from '../lib/supabase';
import type { 
  Scout, 
  FamiliarScout, 
  ActividadScout,
  Asistencia,
  LogroScout,
  LibroOroEntry,
  PerfilCompleto,
  Patrulla,
  MiembroPatrulla
} from '../lib/supabase';

/**
 * ======================================================================
 * 🚀 SCOUT SERVICE - CLIENTE DE MICROSERVICIO/API
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
 * 
 * Todas las funciones corresponden a endpoints equivalentes
 * en una arquitectura de microservicios.
 * ======================================================================
 */
export class ScoutService {
  
  // ============= 👥 GESTIÓN DE SCOUTS =============
  
  /**
   * 📋 Obtener todos los scouts activos
   * Endpoint: GET /api/scouts
   */
  static async getAllScouts(): Promise<Scout[]> {
    try {
      const { data, error } = await supabase
        .rpc('api_buscar_scouts', { p_filtros: { estado: 'ACTIVO' } });

      if (error) throw error;
      
      // La nueva función devuelve un objeto con estructura estándar
      if (data?.success && data?.data?.scouts) {
        return data.data.scouts;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error al obtener scouts:', error);
      throw error;
    }
  }

  /**
   * 🔍 Obtener scout por ID
   * Endpoint: GET /api/scouts/:id
   */
  static async getScoutById(id: string): Promise<Scout | null> {
    try {
      const { data, error } = await supabase
        .rpc('api_buscar_scouts', { p_filtros: { scout_id: id } });

      if (error) throw error;
      
      // La nueva función devuelve un objeto con estructura estándar
      if (data?.success && data?.data?.scouts && data.data.scouts.length > 0) {
        return data.data.scouts[0];
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error al obtener scout por ID:', error);
      throw error;
    }
  }

  /**
   * 🔎 Buscar scouts por criterios
   * Endpoint: GET /api/scouts/search?q={query}
   */
  static async searchScouts(query: string): Promise<Scout[]> {
    try {
      const { data, error } = await supabase
        .rpc('api_buscar_scouts', { p_filtros: { busqueda: query } });

      if (error) throw error;
      
      // La nueva función devuelve un objeto con estructura estándar
      if (data?.success && data?.data?.scouts) {
        return data.data.scouts;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error en búsqueda de scouts:', error);
      throw error;
    }
  }

  /**
   * 🎯 Obtener scouts por rama
   * Endpoint: GET /api/scouts/rama/{rama}
   */
  static async getScoutsByRama(rama: string): Promise<Scout[]> {
    try {
      const { data, error } = await supabase
        .rpc('api_buscar_scouts', { p_filtros: { rama: rama } });

      if (error) throw error;
      
      // La nueva función devuelve un objeto con estructura estándar
      if (data?.success && data?.data?.scouts) {
        return data.data.scouts;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error al obtener scouts por rama:', error);
      throw error;
    }
  }

  /**
   * ➕ Registrar nuevo scout
   * Endpoint: POST /api/scouts
   */
  static async registrarScout(scoutData: {
    nombres: string;
    apellidos: string;
    fecha_nacimiento: string;
    sexo: 'MASCULINO' | 'FEMENINO';
    numero_documento: string;
    tipo_documento?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    distrito?: string;
    rama: string;
    // Datos del familiar
    familiar_nombres?: string;
    familiar_apellidos?: string;
    parentesco?: string;
    familiar_telefono?: string;
    familiar_email?: string;
  }): Promise<{ success: boolean; scout_id?: string; codigo_scout?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('api_registrar_scout', {
          p_datos_scout: {
            nombres: scoutData.nombres,
            apellidos: scoutData.apellidos,
            fecha_nacimiento: scoutData.fecha_nacimiento,
            sexo: scoutData.sexo,
            numero_documento: scoutData.numero_documento,
            tipo_documento: scoutData.tipo_documento || 'DNI',
            telefono: scoutData.telefono,
            email: scoutData.email,
            direccion: scoutData.direccion,
            distrito: scoutData.distrito,
            rama: scoutData.rama
          },
          p_datos_familiar: scoutData.familiar_nombres ? {
            nombres: scoutData.familiar_nombres,
            apellidos: scoutData.familiar_apellidos,
            parentesco: scoutData.parentesco,
            telefono: scoutData.familiar_telefono,
            email: scoutData.familiar_email
          } : null
        });

      if (error) throw error;
      
      // La nueva función devuelve un objeto con estructura estándar
      if (data?.success) {
        return {
          success: true,
          scout_id: data.data?.scout_id,
          codigo_scout: data.data?.codigo_scout
        };
      }
      
      return { success: false, error: data?.message || 'Error desconocido' };
    } catch (error) {
      console.error('❌ Error al registrar scout:', error);
      throw error;
    }
  }

  /**
   * ✏️ Actualizar scout
   * Endpoint: PUT /api/scouts/{id}
   */
  static async updateScout(id: string, updates: {
    nombres?: string;
    apellidos?: string;
    sexo?: 'MASCULINO' | 'FEMENINO';
    celular?: string;
    correo?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    direccion?: string;
    centro_estudio?: string;
    ocupacion?: string;
    centro_laboral?: string;
    rama_actual?: string;
    estado?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('api_actualizar_scout', {
          p_scout_id: id,
          p_datos_scout: {
            nombres: updates.nombres,
            apellidos: updates.apellidos,
            sexo: updates.sexo,
            telefono: updates.celular,
            email: updates.correo,
            departamento: updates.departamento,
            provincia: updates.provincia,
            distrito: updates.distrito,
            direccion: updates.direccion,
            centro_estudio: updates.centro_estudio,
            ocupacion: updates.ocupacion,
            centro_laboral: updates.centro_laboral,
            rama: updates.rama_actual,
            estado: updates.estado
          }
        });

      if (error) throw error;
      
      // La nueva función devuelve un objeto con estructura estándar
      if (data?.success) {
        return { success: true };
      }
      
      return { success: false, error: data?.message || 'Error desconocido' };
    } catch (error) {
      console.error('❌ Error al actualizar scout:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Eliminar scout (eliminación lógica)
   * Endpoint: DELETE /api/scouts/{id}
   */
  static async deleteScout(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('api_eliminar_scout', { p_scout_id: id });

      if (error) throw error;
      
      // La nueva función devuelve un objeto con estructura estándar
      if (data?.success) {
        return { success: true };
      }
      
      return { success: false, error: data?.message || 'Error desconocido' };
    } catch (error) {
      console.error('❌ Error al eliminar scout:', error);
      throw error;
    }
  }

  /**
   * 🔄 Cambiar rama de scout
   * Endpoint: POST /api/scouts/{id}/cambiar-rama
   */
  static async cambiarRamaScout(
    scoutId: string, 
    nuevaRama: string, 
    motivo?: string,
    autorizadoPor?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('cambiar_rama_scout', {
          p_scout_id: scoutId,
          p_nueva_rama: nuevaRama,
          p_motivo: motivo,
          p_autorizado_por: autorizadoPor
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al cambiar rama:', error);
      throw error;
    }
  }

  /**
   * 👤 Obtener perfil completo de scout
   * Endpoint: GET /api/scouts/{id}/perfil-completo
   */
  static async getPerfilCompleto(scoutId: string): Promise<PerfilCompleto | null> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_perfil_scout_completo', {
          p_scout_id: scoutId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener perfil completo:', error);
      throw error;
    }
  }

  // ============= 👨‍👩‍👧‍👦 GESTIÓN DE FAMILIARES =============

  /**
   * 📋 Obtener familiares de un scout
   * Endpoint: GET /api/scouts/{id}/familiares
   */
  static async getFamiliaresByScout(scoutId: string): Promise<FamiliarScout[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_familiares_scout', { p_scout_id: scoutId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener familiares:', error);
      throw error;
    }
  }

  /**
   * ➕ Agregar familiar a scout
   * Endpoint: POST /api/scouts/{id}/familiares
   */
  static async addFamiliar(familiar: {
    scout_id: string;
    nombres: string;
    apellidos: string;
    parentesco: string;
    telefono?: string;
    email?: string;
    es_contacto_emergencia?: boolean;
    observaciones?: string;
  }): Promise<{ success: boolean; familiar_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('agregar_familiar_scout', {
          p_scout_id: familiar.scout_id,
          p_nombres: familiar.nombres,
          p_apellidos: familiar.apellidos,
          p_parentesco: familiar.parentesco,
          p_telefono: familiar.telefono,
          p_email: familiar.email,
          p_es_contacto_emergencia: familiar.es_contacto_emergencia || false,
          p_observaciones: familiar.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al agregar familiar:', error);
      throw error;
    }
  }

  /**
   * ✏️ Actualizar familiar
   * Endpoint: PUT /api/familiares/{id}
   */
  static async updateFamiliar(familiarId: string, updates: {
    nombres?: string;
    apellidos?: string;
    parentesco?: string;
    telefono?: string;
    email?: string;
    es_contacto_emergencia?: boolean;
    observaciones?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('actualizar_familiar_scout', {
          p_familiar_id: familiarId,
          p_datos_actualizacion: updates
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al actualizar familiar:', error);
      throw error;
    }
  }

  // ============= 📅 GESTIÓN DE ASISTENCIAS =============

  /**
   * ✅ Registrar asistencia
   * Endpoint: POST /api/asistencias
   */
  static async registrarAsistencia(
    scoutId: string,
    fecha: string,
    tipoReunion: string,
    presente: boolean,
    justificada?: boolean,
    observaciones?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_asistencia_scout', {
          p_scout_id: scoutId,
          p_fecha: fecha,
          p_tipo_reunion: tipoReunion,
          p_presente: presente,
          p_justificada: justificada || false,
          p_observaciones: observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar asistencia:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener asistencias de un scout
   * Endpoint: GET /api/scouts/{id}/asistencias
   */
  static async getAsistenciasByScout(scoutId: string, fechaInicio?: string, fechaFin?: string): Promise<Asistencia[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_asistencias_scout', {
          p_scout_id: scoutId,
          p_fecha_inicio: fechaInicio,
          p_fecha_fin: fechaFin
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener asistencias:', error);
      throw error;
    }
  }

  /**
   * 📈 Obtener estadísticas de asistencia
   * Endpoint: GET /api/asistencias/estadisticas
   */
  static async getEstadisticasAsistencia(fechaInicio: string, fechaFin: string): Promise<{
    total_reuniones: number;
    promedio_asistencia: number;
    por_rama: Record<string, { total: number; promedio: number }>;
    scouts_mayor_asistencia: Array<{ scout_id: string; nombres: string; apellidos: string; porcentaje: number }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_asistencia', {
          p_fecha_inicio: fechaInicio,
          p_fecha_fin: fechaFin
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas de asistencia:', error);
      throw error;
    }
  }

  // ============= 🎯 GESTIÓN DE ACTIVIDADES =============

  /**
   * 📋 Obtener todas las actividades
   * Endpoint: GET /api/actividades
   */
  static async getAllActividades(): Promise<ActividadScout[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_actividades_scout');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener actividades:', error);
      throw error;
    }
  }

  /**
   * 🎯 Obtener actividades por rama
   * Endpoint: GET /api/actividades/rama/{rama}
   */
  static async getActividadesByRama(rama: string): Promise<ActividadScout[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_actividades_por_rama', { p_rama: rama });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener actividades por rama:', error);
      throw error;
    }
  }

  /**
   * ➕ Crear nueva actividad
   * Endpoint: POST /api/actividades
   */
  static async createActividad(actividad: {
    nombre: string;
    descripcion?: string;
    fecha_inicio: string;
    fecha_fin: string;
    lugar?: string;
    costo?: number;
    cupos_disponibles?: number;
    rama_objetivo?: string;
    tipo_actividad?: string;
    nivel_dificultad?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; actividad_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('crear_actividad_scout', {
          p_nombre: actividad.nombre,
          p_descripcion: actividad.descripcion,
          p_fecha_inicio: actividad.fecha_inicio,
          p_fecha_fin: actividad.fecha_fin,
          p_lugar: actividad.lugar,
          p_costo: actividad.costo || 0,
          p_cupos_disponibles: actividad.cupos_disponibles,
          p_rama_objetivo: actividad.rama_objetivo,
          p_tipo_actividad: actividad.tipo_actividad,
          p_nivel_dificultad: actividad.nivel_dificultad,
          p_observaciones: actividad.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al crear actividad:', error);
      throw error;
    }
  }

  /**
   * � Obtener actividad por ID
   * Endpoint: GET /api/actividades/{id}
   */
  static async getActividadById(actividadId: string): Promise<ActividadScout | null> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_actividad_por_id', { p_actividad_id: actividadId });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('❌ Error al obtener actividad por ID:', error);
      throw error;
    }
  }

  /**
   * ✏️ Actualizar actividad existente
   * Endpoint: PUT /api/actividades/{id}
   */
  static async updateActividad(actividadId: string, actividad: {
    nombre?: string;
    descripcion?: string;
    tipo_actividad?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    lugar?: string;
    rama_objetivo?: string;
    dirigente_responsable?: string;
    costo?: number;
    maximo_participantes?: number;
    observaciones?: string;
    equipamiento_necesario?: string;
    estado?: string;
    edad_minima?: number;
    edad_maxima?: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('actualizar_actividad_scout', {
          p_actividad_id: actividadId,
          p_nombre: actividad.nombre,
          p_descripcion: actividad.descripcion,
          p_tipo_actividad: actividad.tipo_actividad,
          p_fecha_inicio: actividad.fecha_inicio,
          p_fecha_fin: actividad.fecha_fin,
          p_lugar: actividad.lugar,
          p_rama_objetivo: actividad.rama_objetivo,
          p_dirigente_responsable: actividad.dirigente_responsable,
          p_costo: actividad.costo,
          p_maximo_participantes: actividad.maximo_participantes,
          p_observaciones: actividad.observaciones,
          p_equipamiento_necesario: actividad.equipamiento_necesario,
          p_estado: actividad.estado,
          p_edad_minima: actividad.edad_minima,
          p_edad_maxima: actividad.edad_maxima
        });

      if (error) throw error;
      return data || { success: true };
    } catch (error) {
      console.error('❌ Error al actualizar actividad:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Eliminar actividad
   * Endpoint: DELETE /api/actividades/{id}
   */
  static async deleteActividad(actividadId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('eliminar_actividad_scout', { p_actividad_id: actividadId });

      if (error) throw error;
      return data || { success: true };
    } catch (error) {
      console.error('❌ Error al eliminar actividad:', error);
      throw error;
    }
  }

  /**
   * �📝 Inscribir scout en actividad
   * Endpoint: POST /api/actividades/{id}/inscribir
   */
  static async inscribirScoutActividad(
    actividadId: string,
    scoutId: string,
    observaciones?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('inscribir_scout_actividad', {
          p_actividad_id: actividadId,
          p_scout_id: scoutId,
          p_observaciones: observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al inscribir scout en actividad:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener participantes de actividad
   * Endpoint: GET /api/actividades/{id}/participantes
   */
  static async getParticipantesActividad(actividadId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_participantes_actividad', { p_actividad_id: actividadId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener participantes de actividad:', error);
      throw error;
    }
  }

  // ============= 🏆 GESTIÓN DE LOGROS =============

  /**
   * 🏅 Obtener logros de un scout
   * Endpoint: GET /api/scouts/{id}/logros
   */
  static async getLogrosByScout(scoutId: string): Promise<LogroScout[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_logros_scout', { p_scout_id: scoutId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener logros:', error);
      throw error;
    }
  }

    /**
   * 🎖️ Registrar nuevo logro
   * Endpoint: POST /api/logros
   */
  static async registrarLogro(logro: {
    scout_id: string;
    tipo_logro: string;
    nombre_logro: string;
    descripcion?: string;
    fecha_obtencion: string;
    evaluado_por?: string;
  }): Promise<{ success: boolean; logro_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_logro_scout', {
          p_scout_id: logro.scout_id,
          p_tipo_logro: logro.tipo_logro,
          p_nombre_logro: logro.nombre_logro,
          p_descripcion: logro.descripcion,
          p_fecha_obtencion: logro.fecha_obtencion,
          p_evaluado_por: logro.evaluado_por
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar logro:', error);
      throw error;
    }
  }

  // ============= 📖 GESTIÓN DEL LIBRO DE ORO =============

  /**
   * 📋 Obtener todas las entradas del Libro de Oro
   * Endpoint: GET /api/libro-oro
   */
  static async getAllLibroOro(): Promise<LibroOroEntry[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_libro_oro_entries');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener entradas del Libro de Oro:', error);
      throw error;
    }
  }

  /**
   * 🔍 Obtener entrada del Libro de Oro por ID
   * Endpoint: GET /api/libro-oro/{id}
   */
  static async getLibroOroById(entryId: string): Promise<LibroOroEntry | null> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_libro_oro_por_id', { p_entry_id: entryId });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('❌ Error al obtener entrada del Libro de Oro por ID:', error);
      throw error;
    }
  }

  /**
   * ➕ Crear nueva entrada en el Libro de Oro
   * Endpoint: POST /api/libro-oro
   */
  static async createLibroOroEntry(entry: {
    titulo: string;
    fecha: string;
    patrulla?: string;
    rama?: string;
    tipo_logro: string;
    logro: string;
    descripcion: string;
    relatores?: string;
    reconocimiento: string;
    participantes?: string;
    lugar?: string;
    dirigente_responsable?: string;
    evidencias?: string;
    impacto?: string;
  }): Promise<{ success: boolean; entry_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('crear_libro_oro_entry', {
          p_titulo: entry.titulo,
          p_fecha: entry.fecha,
          p_patrulla: entry.patrulla,
          p_rama: entry.rama,
          p_tipo_logro: entry.tipo_logro,
          p_logro: entry.logro,
          p_descripcion: entry.descripcion,
          p_relatores: entry.relatores,
          p_reconocimiento: entry.reconocimiento,
          p_participantes: entry.participantes,
          p_lugar: entry.lugar,
          p_dirigente_responsable: entry.dirigente_responsable,
          p_evidencias: entry.evidencias,
          p_impacto: entry.impacto
        });

      if (error) throw error;
      return data || { success: true };
    } catch (error) {
      console.error('❌ Error al crear entrada del Libro de Oro:', error);
      throw error;
    }
  }

  /**
   * ✏️ Actualizar entrada del Libro de Oro
   * Endpoint: PUT /api/libro-oro/{id}
   */
  static async updateLibroOroEntry(entryId: string, entry: {
    titulo?: string;
    fecha?: string;
    patrulla?: string;
    rama?: string;
    tipo_logro?: string;
    logro?: string;
    descripcion?: string;
    relatores?: string;
    reconocimiento?: string;
    participantes?: string;
    lugar?: string;
    dirigente_responsable?: string;
    evidencias?: string;
    impacto?: string;
    estado?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('actualizar_libro_oro_entry', {
          p_entry_id: entryId,
          p_titulo: entry.titulo,
          p_fecha: entry.fecha,
          p_patrulla: entry.patrulla,
          p_rama: entry.rama,
          p_tipo_logro: entry.tipo_logro,
          p_logro: entry.logro,
          p_descripcion: entry.descripcion,
          p_relatores: entry.relatores,
          p_reconocimiento: entry.reconocimiento,
          p_participantes: entry.participantes,
          p_lugar: entry.lugar,
          p_dirigente_responsable: entry.dirigente_responsable,
          p_evidencias: entry.evidencias,
          p_impacto: entry.impacto,
          p_estado: entry.estado
        });

      if (error) throw error;
      return data || { success: true };
    } catch (error) {
      console.error('❌ Error al actualizar entrada del Libro de Oro:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Eliminar entrada del Libro de Oro
   * Endpoint: DELETE /api/libro-oro/{id}
   */
  static async deleteLibroOroEntry(entryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('eliminar_libro_oro_entry', { p_entry_id: entryId });

      if (error) throw error;
      return data || { success: true };
    } catch (error) {
      console.error('❌ Error al eliminar entrada del Libro de Oro:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener estadísticas del Libro de Oro
   * Endpoint: GET /api/libro-oro/estadisticas
   */
  static async getLibroOroEstadisticas(): Promise<{
    total: number;
    este_ano: number;
    por_reconocimiento: Record<string, number>;
    por_tipo: Record<string, number>;
    por_patrulla: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_libro_oro');

      if (error) throw error;
      return data || {
        total: 0,
        este_ano: 0,
        por_reconocimiento: {},
        por_tipo: {},
        por_patrulla: {}
      };
    } catch (error) {
      console.error('❌ Error al obtener estadísticas del Libro de Oro:', error);
      throw error;
    }
  }

  /**
   * 📈 Obtener estadísticas de logros
   * Endpoint: GET /api/logros/estadisticas
   */
  static async getEstadisticasLogros(): Promise<{
    total_logros: number;
    por_tipo: Record<string, number>;
    por_rama: Record<string, number>;
    scouts_mas_logros: Array<{ scout_id: string; nombres: string; apellidos: string; total_logros: number }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_logros');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas de logros:', error);
      throw error;
    }
  }

  // ============= 🔥 GESTIÓN DE PATRULLAS =============

  /**
   * 📋 Obtener todas las patrullas
   * Endpoint: GET /api/patrullas
   */
  static async getAllPatrullas(): Promise<Patrulla[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_patrullas_activas');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener patrullas:', error);
      throw error;
    }
  }

  /**
   * 🎯 Obtener patrullas por rama
   * Endpoint: GET /api/patrullas/rama/{rama}
   */
  static async getPatrullasByRama(rama: string): Promise<Patrulla[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_patrullas_por_rama', { p_rama: rama });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener patrullas por rama:', error);
      throw error;
    }
  }

  /**
   * ➕ Crear nueva patrulla
   * Endpoint: POST /api/patrullas
   */
  static async createPatrulla(patrulla: {
    nombre: string;
    simbolo?: string;
    color_patrulla?: string;
    grito_patrulla?: string;
    lema?: string;
    rama: string;
    observaciones?: string;
  }): Promise<{ success: boolean; patrulla_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('crear_patrulla', {
          p_nombre: patrulla.nombre,
          p_simbolo: patrulla.simbolo,
          p_color_patrulla: patrulla.color_patrulla,
          p_grito_patrulla: patrulla.grito_patrulla,
          p_lema: patrulla.lema,
          p_rama: patrulla.rama,
          p_observaciones: patrulla.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al crear patrulla:', error);
      throw error;
    }
  }

  /**
   * 👥 Asignar scout a patrulla
   * Endpoint: POST /api/patrullas/{id}/asignar-scout
   */
  static async asignarScoutPatrulla(
    patrullaId: string,
    scoutId: string,
    cargoPatrulla?: string,
    observaciones?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('asignar_scout_patrulla', {
          p_patrulla_id: patrullaId,
          p_scout_id: scoutId,
          p_cargo_patrulla: cargoPatrulla,
          p_observaciones: observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al asignar scout a patrulla:', error);
      throw error;
    }
  }

  /**
   * 👥 Obtener miembros de patrulla
   * Endpoint: GET /api/patrullas/{id}/miembros
   */
  static async getMiembrosPatrulla(patrullaId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_miembros_patrulla', { p_patrulla_id: patrullaId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener miembros de patrulla:', error);
      throw error;
    }
  }

  // ============= 👨‍💼 GESTIÓN DE DIRIGENTES =============

  /**
   * 📋 Obtener todos los dirigentes activos
   * Endpoint: GET /api/dirigentes
   */
  static async getAllDirigentes(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_dirigentes_activos');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener dirigentes:', error);
      throw error;
    }
  }

  /**
   * 🎯 Obtener dirigentes por rama
   * Endpoint: GET /api/dirigentes/rama/{rama}
   */
  static async getDirigentesByRama(rama: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_dirigentes_por_rama', { p_rama: rama });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener dirigentes por rama:', error);
      throw error;
    }
  }

  /**
   * ➕ Promover scout a dirigente
   * Endpoint: POST /api/dirigentes/promover
   */
  static async promoverDirigente(datos: {
    scout_id: string;
    cargo?: string;
    especialidad?: string;
    fecha_nombramiento: string;
    observaciones?: string;
  }): Promise<{ success: boolean; dirigente_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('promover_scout_dirigente', {
          p_scout_id: datos.scout_id,
          p_cargo: datos.cargo,
          p_especialidad: datos.especialidad,
          p_fecha_nombramiento: datos.fecha_nombramiento,
          p_observaciones: datos.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al promover dirigente:', error);
      throw error;
    }
  }

  // ============= 👨‍👩‍👧‍👦 GESTIÓN DE COMITÉ DE PADRES =============

  /**
   * 📋 Obtener comité de padres activo
   * Endpoint: GET /api/comite-padres
   */
  static async getComitePadres(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_comite_padres_activo');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener comité de padres:', error);
      throw error;
    }
  }

  /**
   * ➕ Agregar miembro al comité
   * Endpoint: POST /api/comite-padres
   */
  static async agregarMiembroComite(miembro: {
    familiar_id: string;
    cargo: string;
    fecha_nombramiento: string;
    fecha_fin_periodo: string;
    observaciones?: string;
  }): Promise<{ success: boolean; miembro_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('agregar_miembro_comite', {
          p_familiar_id: miembro.familiar_id,
          p_cargo: miembro.cargo,
          p_fecha_nombramiento: miembro.fecha_nombramiento,
          p_fecha_fin_periodo: miembro.fecha_fin_periodo,
          p_observaciones: miembro.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al agregar miembro al comité:', error);
      throw error;
    }
  }

  // ============= 📝 GESTIÓN DE PROGRAMA SEMANAL =============

  /**
   * 📋 Obtener programas semanales
   * Endpoint: GET /api/programa-semanal
   */
  static async getProgramasSemanales(rama?: string, limite?: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_programas_semanales', {
          p_rama: rama,
          p_limite: limite
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener programas semanales:', error);
      throw error;
    }
  }

  /**
   * ➕ Crear programa semanal
   * Endpoint: POST /api/programa-semanal
   */
  static async createProgramaSemanal(programa: {
    fecha_reunion: string;
    hora_inicio: string;
    hora_fin: string;
    tema_principal?: string;
    objetivos?: string;
    actividades_planificadas?: string;
    materiales_necesarios?: string;
    rama: string;
    responsable_id?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; programa_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('crear_programa_semanal', {
          p_fecha_reunion: programa.fecha_reunion,
          p_hora_inicio: programa.hora_inicio,
          p_hora_fin: programa.hora_fin,
          p_tema_principal: programa.tema_principal,
          p_objetivos: programa.objetivos,
          p_actividades_planificadas: programa.actividades_planificadas,
          p_materiales_necesarios: programa.materiales_necesarios,
          p_rama: programa.rama,
          p_responsable_id: programa.responsable_id,
          p_observaciones: programa.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al crear programa semanal:', error);
      throw error;
    }
  }

  // ============= 💰 GESTIÓN DE INSCRIPCIONES ANUALES =============

  /**
   * 📋 Obtener inscripciones por año
   * Endpoint: GET /api/inscripciones/{año}
   */
  static async getInscripcionesByAño(año: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_inscripciones_por_año', { p_año: año });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener inscripciones:', error);
      throw error;
    }
  }

  /**
   * ➕ Registrar inscripción anual
   * Endpoint: POST /api/inscripciones
   */
  static async registrarInscripcion(inscripcion: {
    scout_id: string;
    año_inscripcion: number;
    monto_pagado: number;
    fecha_pago?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; inscripcion_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_inscripcion_anual', {
          p_scout_id: inscripcion.scout_id,
          p_año_inscripcion: inscripcion.año_inscripcion,
          p_monto_pagado: inscripcion.monto_pagado,
          p_fecha_pago: inscripcion.fecha_pago,
          p_observaciones: inscripcion.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar inscripción:', error);
      throw error;
    }
  }

  // ============= 📊 ESTADÍSTICAS Y REPORTES CENTRALIZADOS =============

  /**
   * 📈 Obtener estadísticas generales del grupo
   * Endpoint: GET /api/estadisticas/generales
   */
  static async getEstadisticasGenerales(): Promise<{
    total_scouts: number;
    scouts_por_rama: Record<string, number>;
    scouts_nuevos_mes: number;
    total_dirigentes: number;
    asistencia_promedio: number;
    actividades_mes: number;
    logros_mes: number;
    fecha_reporte: string;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_scouts_generales');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas generales:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener estadísticas del grupo (alias para compatibilidad)
   * Endpoint: GET /api/estadisticas/grupo
   */
  static async getEstadisticasGrupo(): Promise<{
    total_scouts: number;
    scouts_por_rama: Record<string, number>;
    scouts_nuevos_mes: number;
    total_dirigentes: number;
    asistencia_promedio: number;
    actividades_mes: number;
    logros_mes: number;
    fecha_reporte: string;
  }> {
    // Reutiliza la función de estadísticas generales
    return this.getEstadisticasGenerales();
  }

  /**
   * 🎯 Obtener distribución por rama
   * Endpoint: GET /api/estadisticas/ramas
   */
  static async getDistribucionPorRama(): Promise<Array<{
    rama: string;
    total_scouts: number;
    porcentaje: number;
    edad_promedio: number;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_distribucion_por_rama');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener distribución por rama:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener métricas de actividades
   * Endpoint: GET /api/estadisticas/actividades
   */
  static async getMetricasActividades(): Promise<{
    total_actividades: number;
    actividades_completadas: number;
    promedio_participacion: number;
    actividades_por_tipo: Record<string, number>;
    proximas_actividades: number;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_metricas_actividades');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener métricas de actividades:', error);
      throw error;
    }
  }

  /**
   * 🏆 Obtener ranking de scouts por logros
   * Endpoint: GET /api/estadisticas/ranking-logros
   */
  static async getRankingLogros(limite?: number): Promise<Array<{
    scout_id: string;
    nombres: string;
    apellidos: string;
    rama: string;
    total_logros: number;
    ultimo_logro: string;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_ranking_logros', { p_limite: limite || 10 });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener ranking de logros:', error);
      throw error;
    }
  }

  /**
   * 📅 Obtener tendencias mensuales
   * Endpoint: GET /api/estadisticas/tendencias/{año}
   */
  static async getTendenciasMensuales(año?: number): Promise<Array<{
    mes: number;
    año: number;
    nuevos_scouts: number;
    actividades_realizadas: number;
    logros_otorgados: number;
    promedio_asistencia: number;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_tendencias_mensuales', { 
          p_año: año || new Date().getFullYear() 
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener tendencias mensuales:', error);
      throw error;
    }
  }

  /**
   * 🔍 Búsqueda avanzada de scouts
   * Endpoint: GET /api/scouts/busqueda-avanzada
   */
  static async busquedaAvanzadaScouts(criterios: {
    texto?: string;
    rama?: string;
    edad_min?: number;
    edad_max?: number;
    estado?: string;
    tiene_logros?: boolean;
    patrulla_id?: string;
  }): Promise<Scout[]> {
    try {
      const { data, error } = await supabase
        .rpc('busqueda_avanzada_scouts', {
          p_criterios: criterios
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error en búsqueda avanzada:', error);
      throw error;
    }
  }

  // ============= 🔧 FUNCIONES DE UTILIDAD =============

  /**
   * ✅ Verificar estado del sistema
   * Endpoint: GET /api/sistema/health-check
   */
  static async verificarEstadoSistema(): Promise<{
    database_connected: boolean;
    functions_available: boolean;
    total_tables: number;
    last_backup: string | null;
    system_version: string;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('verificar_estado_sistema');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al verificar estado del sistema:', error);
      throw error;
    }
  }

  /**
   * 🧹 Limpiar datos antiguos
   * Endpoint: POST /api/sistema/limpiar-datos
   */
  static async limpiarDatosAntiguos(días: number = 365): Promise<{
    success: boolean;
    registros_eliminados: number;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('limpiar_datos_antiguos', { p_dias_antiguedad: días });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al limpiar datos:', error);
      throw error;
    }
  }

  /**
   * 📊 Generar reporte completo
   * Endpoint: GET /api/reportes/completo
   */
  static async generarReporteCompleto(parametros: {
    fecha_inicio: string;
    fecha_fin: string;
    incluir_scouts?: boolean;
    incluir_actividades?: boolean;
    incluir_asistencias?: boolean;
    incluir_logros?: boolean;
    formato?: 'json' | 'csv';
  }): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_completo', {
          p_parametros: parametros
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar reporte:', error);
      throw error;
    }
  }
}

/**
 * ======================================================================
 * 🎯 RESUMEN DE LA ARQUITECTURA MICROSERVICIO/API
 * ======================================================================
 * 
 * ✅ COMPLETADO:
 * - 👥 Gestión de Scouts (CRUD + búsquedas)
 * - 👨‍👩‍👧‍👦 Gestión de Familiares
 * - 📅 Gestión de Asistencias
 * - 🎯 Gestión de Actividades
 * - 🏆 Gestión de Logros
 * - 🔥 Gestión de Patrullas
 * - 👨‍💼 Gestión de Dirigentes
 * - 👨‍👩‍👧‍👦 Comité de Padres
 * - 📝 Programa Semanal
 * - 💰 Inscripciones Anuales
 * - 📊 Estadísticas y Reportes
 * - 🔧 Utilidades del Sistema
 * 
 * 🚀 CARACTERÍSTICAS:
 * - Todas las operaciones usan Database Functions
 * - Manejo consistente de errores
 * - Tipado fuerte TypeScript
 * - Documentación tipo API REST
 * - Sin lógica de negocio en frontend
 * - Respuestas estandarizadas
 * 
 * 🔗 EQUIVALENCIA API REST:
 * Cada método corresponde a un endpoint REST equivalente,
 * facilitando migración futura a microservicios independientes.
 * ======================================================================
 */

export default ScoutService;