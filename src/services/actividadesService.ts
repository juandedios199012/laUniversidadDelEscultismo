import { supabase } from '../lib/supabase';

/**
 * ======================================================================
 * 🎯 ACTIVIDADES SCOUT SERVICE - CLIENTE DE MICROSERVICIO/API
 * ======================================================================
 * 
 * Este servicio actúa como un cliente puro de microservicio/API.
 * TODA la lógica de negocio reside en el backend (Supabase Database Functions).
 * ======================================================================
 */
export class ActividadesService {

  // ============= 🎯 GESTIÓN DE ACTIVIDADES =============
  
  /**
   * 🎯 Crear nueva actividad
   * Endpoint: POST /api/actividades
   */
  static async crearActividad(actividad: {
    nombre: string;
    descripcion: string;
    tipo: 'reunion' | 'campamento' | 'excursion' | 'servicio' | 'capacitacion' | 'ceremonia';
    fecha_inicio: string;
    fecha_fin?: string;
    lugar: string;
    rama: string;
    edad_minima?: number;
    edad_maxima?: number;
    cupo_maximo?: number;
    costo?: number;
    responsable: string;
    objetivos: string[];
    materiales_necesarios?: string[];
    requisitos_participacion?: string[];
  }): Promise<{ success: boolean; actividad_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('actividades_scout')
        .insert({
          nombre: actividad.nombre,
          descripcion: actividad.descripcion,
          tipo: actividad.tipo,
          fecha_inicio: actividad.fecha_inicio,
          fecha_fin: actividad.fecha_fin,
          lugar: actividad.lugar,
          rama: actividad.rama,
          edad_minima: actividad.edad_minima,
          edad_maxima: actividad.edad_maxima,
          cupo_maximo: actividad.cupo_maximo,
          costo: actividad.costo || 0,
          responsable: actividad.responsable,
          objetivos: actividad.objetivos,
          materiales_necesarios: actividad.materiales_necesarios || [],
          requisitos_participacion: actividad.requisitos_participacion || [],
          estado: 'programada',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, actividad_id: data.id };
    } catch (error) {
      console.error('❌ Error al crear actividad:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 📋 Obtener actividades
   * Endpoint: GET /api/actividades
   */
  static async getActividades(filtros?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    tipo?: string;
    rama?: string;
    estado?: string;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('actividades_scout')
        .select('*');

      if (filtros?.fecha_desde) {
        query = query.gte('fecha_inicio', filtros.fecha_desde);
      }

      if (filtros?.fecha_hasta) {
        query = query.lte('fecha_inicio', filtros.fecha_hasta);
      }

      if (filtros?.tipo) {
        query = query.eq('tipo', filtros.tipo);
      }

      if (filtros?.rama) {
        query = query.eq('rama', filtros.rama);
      }

      if (filtros?.estado) {
        query = query.eq('estado', filtros.estado);
      }

      const { data, error } = await query.order('fecha_inicio', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener actividades:', error);
      return [];
    }
  }

  /**
   * 🎯 Obtener actividad por ID
   * Endpoint: GET /api/actividades/{id}
   */
  static async getActividadById(id: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('actividades_scout')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener actividad:', error);
      return null;
    }
  }

  /**
   * ✏️ Actualizar actividad
   * Endpoint: PUT /api/actividades/{id}
   */
  static async updateActividad(id: string, updates: {
    nombre?: string;
    descripcion?: string;
    tipo?: 'reunion' | 'campamento' | 'excursion' | 'servicio' | 'capacitacion' | 'ceremonia';
    fecha_inicio?: string;
    fecha_fin?: string;
    lugar?: string;
    rama?: string;
    edad_minima?: number;
    edad_maxima?: number;
    cupo_maximo?: number;
    costo?: number;
    responsable?: string;
    objetivos?: string[];
    materiales_necesarios?: string[];
    requisitos_participacion?: string[];
    estado?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('actividades_scout')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al actualizar actividad:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * 🗑️ Eliminar actividad
   * Endpoint: DELETE /api/actividades/{id}
   */
  static async deleteActividad(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('actividades_scout')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error al eliminar actividad:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * ✅ Registrar participación en actividad
   * Endpoint: POST /api/actividades/participaciones
   */
  static async registrarParticipacion(participacion: {
    actividad_id: string;
    scout_id: string;
    estado: 'inscrito' | 'confirmado' | 'asistio' | 'no_asistio';
    fecha_inscripcion?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; participacion_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_participacion_actividad', {
          p_actividad_id: participacion.actividad_id,
          p_scout_id: participacion.scout_id,
          p_estado: participacion.estado,
          p_fecha_inscripcion: participacion.fecha_inscripcion || new Date().toISOString(),
          p_observaciones: participacion.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar participación:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener estadísticas de actividades
   * Endpoint: GET /api/actividades/estadisticas
   */
  static async getEstadisticasActividades(): Promise<{
    total_actividades_año: number;
    actividades_por_tipo: Record<string, number>;
    promedio_participacion: number;
    actividades_mas_populares: Array<{
      nombre: string;
      participantes: number;
      satisfaccion: number;
    }>;
    scouts_mas_activos: Array<{
      scout_id: string;
      nombre: string;
      actividades_participadas: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_actividades');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }
}

export default ActividadesService;