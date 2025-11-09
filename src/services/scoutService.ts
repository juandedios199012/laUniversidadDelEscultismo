import { supabase } from '../lib/supabase';
import type { Scout, FamiliarScout } from '../lib/supabase';

/**
 * 🎯 Scout Service - Gestión completa del sistema Scout
 * 
 * Esta clase maneja todas las operaciones CRUD para:
 * - Gestión de scouts (registro, actualización, búsqueda)
 * - Gestión de inventario y movimientos
 * - Control de asistencia
 * - Gestión de actividades e inscripciones
 * - Administración de dirigentes y patrullas
 * - Sistema de reportes y estadísticas
 * 
 * Implementa la arquitectura de microservicios usando Database Functions
 * como API endpoints con respuestas JSON estandarizadas.
 */
class ScoutService {

  // Helper: map frontend-friendly values to database enum tokens
  private static mapRamaToDb(rama?: string): string | null {
    if (!rama) return null;
    const r = rama.trim().toLowerCase();
    if (['manada', 'lobatos', 'lobato', 'lobata'].includes(r)) return 'Lobatos';
    if (['tropa', 'scouts', 'scout'].includes(r)) return 'Scouts';
    if (['comunidad', 'rovers', 'rover'].includes(r)) return 'Rovers';
    if (['dirigente', 'dirigentes', 'dirigencia'].includes(r)) return 'Dirigentes';
    // default to Scouts to avoid enum errors
    return 'Scouts';
  }

  private static mapParentescoToDb(parentesco?: string): string | null {
    if (!parentesco) return null;
    const p = parentesco.trim().toLowerCase();
    if (['padre', 'papa', 'papá'].includes(p)) return 'PADRE';
    if (['madre', 'mama', 'mamá'].includes(p)) return 'MADRE';
    if (['tutor', 'tutora'].includes(p)) return 'TUTOR';
    if (['hermano', 'hermana'].includes(p)) return 'HERMANO';
    if (['tio', 'tío'].includes(p)) return 'TIO';
    if (['abuelo', 'abuela'].includes(p)) return 'ABUELO';
    return 'OTRO';
  }

  private static mapTipoDocumentoToDb(tipo?: string): string {
    if (!tipo) return 'DNI';
    const t = tipo.trim().toLowerCase();
    if (t.includes('dni')) return 'DNI';
    if (t.includes('carnet') || t.includes('extranjer')) return 'CARNET_EXTRANJERIA';
    if (t.includes('pasaporte')) return 'PASAPORTE';
    return 'DNI';
  }

  
  /**
   * 📋 Obtener todos los scouts activos
   * Endpoint: GET /api/scouts
   */
  static async getAllScouts(): Promise<Scout[]> {
    try {
      console.log('🔍 Llamando a api_buscar_scouts...');
      
      // Primero probemos sin filtros para ver si trae todos los scouts
      const { data, error } = await supabase
        .rpc('api_buscar_scouts', { p_filtros: {} });

      console.log('📊 Respuesta completa de api_buscar_scouts:', { data, error });

      if (error) {
        console.error('❌ Error en la llamada:', error);
        throw error;
      }
      
      // La función devuelve un objeto con estructura estándar
      if (data?.success && data?.data) {
        console.log('✅ Datos obtenidos exitosamente:', data.data);
        console.log('✅ Cantidad de scouts:', Array.isArray(data.data) ? data.data.length : 'No es array');
        // Los scouts están directamente en data.data, no en data.data.scouts
        return Array.isArray(data.data) ? data.data : [];
      }
      
      console.log('⚠️ No se encontraron datos en la respuesta');
      console.log('⚠️ Estructura de data:', data);
      return [];
    } catch (error) {
      console.error('❌ Error al obtener scouts:', error);
      throw error;
    }
  }

  /**
   * 🔍 Obtener scout por ID
   * Usa la función api_obtener_scout para obtener datos completos del scout
   */
  static async getScoutById(id: string): Promise<Scout | null> {
    try {
      console.log('🔍 Obteniendo scout por ID:', id);
      
      // Usar la función api_obtener_scout para obtener datos completos
      const { data, error } = await supabase.rpc('api_obtener_scout', {
        p_scout_id: id
      });
      
      if (error) {
        console.error('❌ Error al obtener scout por ID:', error);
        return null;
      }
      
      console.log('✅ Respuesta de api_obtener_scout:', data);
      
      if (!data?.success) {
        console.error('❌ Error en la respuesta:', data?.errors);
        return null;
      }
      
      const scoutData = data.data;
      if (!scoutData) {
        console.log('ℹ️ Scout no encontrado');
        return null;
      }
      
      console.log('✅ Scout encontrado:', scoutData);
      return scoutData;
    } catch (error) {
      console.error('❌ Error al obtener scout por ID:', error);
      return null;
    }
  }

  /**
   * 🔎 Buscar scouts por criterios
   * Endpoint: GET /api/scouts/search?q={query}
   */
  static async searchScouts(query: string): Promise<Scout[]> {
    try {
      // Usar consulta directa con búsqueda de texto
      const { data, error } = await supabase
        .from('scouts')
        .select('*')
        .or(`nombres.ilike.%${query}%,apellidos.ilike.%${query}%,numero_documento.ilike.%${query}%`)
        .order('fecha_ingreso', { ascending: false });

      if (error) {
        console.error('❌ Error en búsqueda de scouts:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Error en búsqueda de scouts:', error);
      return [];
    }
  }

  /**
   * 🔍 Buscar scouts con filtros avanzados
   * Usa la función api_buscar_scouts de la base de datos
   */
  static async searchScoutsWithFilters(filtros: {
    buscar_texto?: string;
    rama?: string;
    estado?: string;
    limite?: number;
  }): Promise<Scout[]> {
    try {
      console.log('🔍 Buscando scouts con filtros:', filtros);
      
      const { data, error } = await supabase.rpc('api_buscar_scouts', {
        p_filtros: {
          buscar_texto: filtros.buscar_texto || null,
          rama: filtros.rama || null,
          estado: filtros.estado || null,
          limite: filtros.limite || 100
        }
      });
      
      if (error) {
        console.error('❌ Error al buscar scouts con filtros:', error);
        return [];
      }
      
      console.log('✅ Respuesta de api_buscar_scouts:', data);
      
      if (!data?.success) {
        console.error('❌ Error en la respuesta:', data?.errors);
        return [];
      }
      
      const scouts = data.data;
      console.log('✅ Scouts encontrados:', scouts?.length || 0);
      
      return scouts || [];
    } catch (error) {
      console.error('❌ Error al buscar scouts con filtros:', error);
      return [];
    }
  }

  /**
   * 🎯 Obtener scouts por rama
   * Endpoint: GET /api/scouts/rama/{rama}
   */
  static async getScoutsByRama(rama: string): Promise<Scout[]> {
    try {
      // Usar consulta directa filtrando por rama
      const { data, error } = await supabase
        .from('scouts')
        .select('*')
        .or(`rama.eq.${rama},rama_actual.eq.${rama},seccion.eq.${rama}`)
        .order('fecha_ingreso', { ascending: false });

      if (error) {
        console.error('❌ Error al obtener scouts por rama:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener scouts por rama:', error);
      return [];
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
    let ramaDb: string | null = null;
    let tipoDocDb: string = 'DNI';

    try {
      // Map frontend values to DB enum tokens and payload keys
      const ramaDb = ScoutService.mapRamaToDb(scoutData.rama);
      const tipoDocDb = ScoutService.mapTipoDocumentoToDb(scoutData.tipo_documento);
      const datosFamiliar = scoutData.familiar_nombres ? {
        nombres: scoutData.familiar_nombres,
        apellidos: scoutData.familiar_apellidos,
        parentesco: ScoutService.mapParentescoToDb(scoutData.parentesco),
        telefono: scoutData.familiar_telefono,
        email: scoutData.familiar_email
      } : null;

      // Intentar primero con la función de la base de datos
      const { data, error } = await supabase
        .rpc('api_registrar_scout', {
          p_data: {
            nombres: scoutData.nombres,
            apellidos: scoutData.apellidos,
            fecha_nacimiento: scoutData.fecha_nacimiento,
            sexo: scoutData.sexo,
            documento_identidad: scoutData.numero_documento,
            tipo_documento: tipoDocDb,
            telefono: scoutData.telefono,
            email: scoutData.email,
            direccion: scoutData.direccion,
            distrito: scoutData.distrito,
            rama: ramaDb,
            // Datos del familiar si existen
            familiar_nombres: scoutData.familiar_nombres,
            familiar_apellidos: scoutData.familiar_apellidos,
            parentesco: datosFamiliar?.parentesco,
            familiar_telefono: scoutData.familiar_telefono,
            familiar_email: scoutData.familiar_email
          }
        });

      if (error) {
        console.warn('🔄 Función api_registrar_scout no disponible, usando inserción directa:', error);
        
        // Fallback: inserción directa en la tabla scouts
        const scoutId = crypto.randomUUID();
        const codigoScout = `SCT${Date.now().toString().slice(-6)}`;
        
        const { error: insertError } = await supabase
          .from('scouts')
          .insert({
            id: scoutId,
            nombres: scoutData.nombres,
            apellidos: scoutData.apellidos,
            fecha_nacimiento: scoutData.fecha_nacimiento,
            sexo: scoutData.sexo,
            numero_documento: scoutData.numero_documento,
            tipo_documento: tipoDocDb,
            celular: scoutData.telefono || '',
            correo: scoutData.email || '',
            direccion: scoutData.direccion || '',
            distrito: scoutData.distrito || '',
            rama_actual: ramaDb,
            codigo_scout: codigoScout,
            estado: 'ACTIVO',
            fecha_ingreso: new Date().toISOString().split('T')[0]
          })
          .select();
          
        if (insertError) throw insertError;
        
        return {
          success: true,
          scout_id: scoutId,
          codigo_scout: codigoScout
        };
      }
      
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
      
      // Último intento con inserción directa
      try {
        const scoutId = crypto.randomUUID();
        const codigoScout = `SCT${Date.now().toString().slice(-6)}`;
        
        const { error: insertError } = await supabase
          .from('scouts')
          .insert({
            id: scoutId,
            nombres: scoutData.nombres,
            apellidos: scoutData.apellidos,
            fecha_nacimiento: scoutData.fecha_nacimiento,
            sexo: scoutData.sexo,
            numero_documento: scoutData.numero_documento,
            tipo_documento: tipoDocDb,
            celular: scoutData.telefono || '',
            correo: scoutData.email || '',
            direccion: scoutData.direccion || '',
            distrito: scoutData.distrito || '',
            rama_actual: ramaDb,
            codigo_scout: codigoScout,
            estado: 'ACTIVO',
            fecha_ingreso: new Date().toISOString().split('T')[0]
          })
          .select();
          
        if (insertError) throw insertError;
        
        return {
          success: true,
          scout_id: scoutId,
          codigo_scout: codigoScout
        };
      } catch (fallbackError) {
        console.error('❌ Error en inserción de respaldo:', fallbackError);
        return { 
          success: false, 
          error: `Error al registrar scout: ${String(fallbackError)}` 
        };
      }
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
          p_data: {
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

  // 📊 Métodos de estadísticas y reportes
  static async getEstadisticasGenerales() {
    try {
      const { data, error } = await supabase
        .rpc('api_dashboard_principal');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }

  static async limpiarCacheDashboard() {
    try {
      // Llamar a la función de mantenimiento para limpiar cache
      const { data, error } = await supabase
        .rpc('api_mantenimiento_sistema');

      if (error) throw error;
      console.log('✅ Cache limpiado exitosamente');
      return data;
    } catch (error) {
      console.error('❌ Error al limpiar cache:', error);
      throw error;
    }
  }

  static async getEstadisticasGrupo() {
    try {
      const { data, error } = await supabase
        .rpc('api_dashboard_principal');

      if (error) throw error;
      
      // Si la función devuelve datos con estructura estándar
      if (data?.success && data?.data) {
        return data.data;
      }
      
      // Si devuelve datos directamente
      return data || {
        totalScouts: 0,
        scoutsPorRama: {},
        actividades: 0,
        asistenciaPromedio: 0
      };
    } catch (error) {
      console.error('❌ Error al obtener estadísticas del grupo:', error);
      throw error;
    }
  }

  /**
   * 👨‍👩‍👧‍👦 Obtener familiares de un scout
   */
  static async getFamiliaresByScout(scoutId: string): Promise<FamiliarScout[]> {
    try {
      console.log('👨‍👩‍👧‍👦 Obteniendo familiares para scout:', scoutId);
      
      const { data, error } = await supabase
        .from('familiares_scout')
        .select('*')
        .eq('scout_id', scoutId);
      
      if (error) {
        console.error('❌ Error al obtener familiares:', error);
        return [];
      }
      
      console.log('✅ Familiares obtenidos:', data);
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener familiares del scout:', error);
      return [];
    }
  }
}

export default ScoutService;