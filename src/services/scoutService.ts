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
    if (['manada', 'lobatos', 'lobato', 'lobata'].includes(r)) return 'Manada';
    if (['tropa', 'scouts', 'scout'].includes(r)) return 'Tropa';
    if (['caminantes', 'caminante'].includes(r)) return 'Caminantes';
    if (['comunidad', 'rovers', 'rover', 'clan'].includes(r)) return 'Clan';
    if (['dirigente', 'dirigentes', 'dirigencia'].includes(r)) return 'Dirigentes';
    // default to Tropa to avoid enum errors
    return 'Tropa';
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
      
      const { data, error } = await supabase
        .rpc('api_buscar_scouts', { p_filtros: {} });

      if (error) {
        console.error('❌ Error en la llamada RPC:', error);
        console.error('❌ Detalles del error:', JSON.stringify(error, null, 2));
        return [];
      }
      
      console.log('📦 Respuesta completa:', data);
      
      // La función devuelve un objeto con estructura estándar
      if (data?.success && data?.data) {
        console.log('✅ Scouts obtenidos:', data.data.length);
        return Array.isArray(data.data) ? data.data : [];
      }
      
      // Si data es directamente un array
      if (Array.isArray(data)) {
        console.log('✅ Scouts obtenidos (array directo):', data.length);
        return data;
      }
      
      console.log('⚠️ No se encontraron datos en la respuesta');
      return [];
    } catch (error) {
      console.error('❌ Error al obtener scouts:', error);
      return [];
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
      console.log('🔍 Buscando scouts con query:', query);
      
      const { data, error } = await supabase
        .rpc('api_buscar_scouts', { 
          p_filtros: { buscar_texto: query } 
        });

      if (error) {
        console.error('❌ Error en búsqueda de scouts:', error);
        return [];
      }
      
      if (data?.success && data?.data) {
        console.log('✅ Scouts encontrados:', data.data.length);
        return Array.isArray(data.data) ? data.data : [];
      }

      return [];
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
      console.log('🎯 Obteniendo scouts por rama:', rama);
      
      const { data, error } = await supabase.rpc('api_buscar_scouts', {
        p_filtros: { rama_actual: rama }
      });

      if (error) {
        console.error('❌ Error al obtener scouts por rama:', error);
        return [];
      }
      
      console.log('✅ Scouts obtenidos:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener scouts por rama:', error);
      return [];
    }
  }

  /**
   * ➕ Registrar nuevo scout (alias de createScout para compatibilidad)
   * Endpoint: POST /api/scouts
   */
  static async createScout(scoutData: {
    nombres: string;
    apellidos: string;
    fecha_nacimiento: string;
    sexo?: 'M' | 'F' | 'MASCULINO' | 'FEMENINO';
    numero_documento?: string;
    tipo_documento?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    distrito?: string;
    departamento?: string;
    provincia?: string;
    rama_actual: string;
    estado?: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'ELIMINADO';
    es_dirigente?: boolean;
    fecha_ingreso?: string;
    // Datos del familiar (opcionales)
    familiar_nombres?: string;
    familiar_apellidos?: string;
    parentesco?: string;
    familiar_telefono?: string;
    familiar_email?: string;
  }): Promise<{ success: boolean; scout_id?: string; codigo_scout?: string; error?: string }> {
    // Normalizar sexo a formato DB
    let sexoNormalizado: 'MASCULINO' | 'FEMENINO' = 'MASCULINO';
    if (scoutData.sexo === 'F' || scoutData.sexo === 'FEMENINO') {
      sexoNormalizado = 'FEMENINO';
    }

    // Llamar a registrarScout con formato normalizado
    return this.registrarScout({
      ...scoutData,
      sexo: sexoNormalizado,
      numero_documento: scoutData.numero_documento || '',
      rama: scoutData.rama_actual
    });
  }

  /**
   * ➕ Registrar nuevo scout (método legacy)
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
    fecha_ingreso?: string;
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

      // Preparar datos para la función
      const scoutDataJson = {
        nombres: scoutData.nombres,
        apellidos: scoutData.apellidos,
        fecha_nacimiento: scoutData.fecha_nacimiento,
        sexo: scoutData.sexo,
        numero_documento: scoutData.numero_documento || null,
        tipo_documento: tipoDocDb,
        celular: scoutData.telefono,
        correo: scoutData.email,
        direccion: scoutData.direccion,
        distrito: scoutData.distrito,
        departamento: scoutData.direccion,
        provincia: scoutData.direccion,
        rama_actual: ramaDb,
        fecha_ingreso: scoutData.fecha_ingreso || null,
        pais: 'Perú'
      };

      const familiarDataJson = datosFamiliar ? {
        nombres: datosFamiliar.nombres,
        apellidos: datosFamiliar.apellidos,
        parentesco: datosFamiliar.parentesco,
        celular: datosFamiliar.telefono,
        correo: datosFamiliar.email
      } : null;

      // Registrar scout (persona + scout + rol)
      const { data, error } = await supabase
        .rpc('api_registrar_scout_completo', {
          p_scout_data: scoutDataJson,
          p_familiar_data: familiarDataJson
        });

      if (error) {
        console.error('❌ Error al registrar scout:', error);
        return {
          success: false,
          error: error.message || 'Error al registrar scout'
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al registrar scout'
      };
    }
  }

  /**
   * ✏️ Actualizar scout
   * Endpoint: PUT /api/scouts/{id}
   */
  static async updateScout(id: string, updates: {
    nombres?: string;
    apellidos?: string;
    fecha_nacimiento?: string;
    fecha_ingreso?: string;
    tipo_documento?: string;
    numero_documento?: string;
    sexo?: 'MASCULINO' | 'FEMENINO';
    celular?: string;
    celular_secundario?: string;
    telefono?: string;
    correo?: string;
    correo_secundario?: string;
    correo_institucional?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    direccion?: string;
    codigo_postal?: string;
    centro_estudio?: string;
    anio_estudios?: string;
    ocupacion?: string;
    centro_laboral?: string;
    rama_actual?: string;
    codigo_asociado?: string;
    religion?: string;
    grupo_sanguineo?: string;
    factor_sanguineo?: string;
    seguro_medico?: string;
    tipo_discapacidad?: string;
    carnet_conadis?: string;
    descripcion_discapacidad?: string;
    es_dirigente?: boolean;
    estado?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('api_actualizar_scout', {
          p_scout_id: id,
          p_data: {
            nombres: updates.nombres,
            apellidos: updates.apellidos,
            fecha_nacimiento: updates.fecha_nacimiento,
            fecha_ingreso: updates.fecha_ingreso,
            tipo_documento: updates.tipo_documento,
            numero_documento: updates.numero_documento,
            celular: updates.celular,
            celular_secundario: updates.celular_secundario,
            telefono: updates.telefono,
            correo: updates.correo,
            correo_secundario: updates.correo_secundario,
            correo_institucional: updates.correo_institucional,
            departamento: updates.departamento,
            provincia: updates.provincia,
            distrito: updates.distrito,
            direccion: updates.direccion,
            codigo_postal: updates.codigo_postal,
            centro_estudio: updates.centro_estudio,
            anio_estudios: updates.anio_estudios,
            ocupacion: updates.ocupacion,
            centro_laboral: updates.centro_laboral,
            rama_actual: updates.rama_actual,
            codigo_asociado: updates.codigo_asociado,
            religion: updates.religion,
            grupo_sanguineo: updates.grupo_sanguineo,
            factor_sanguineo: updates.factor_sanguineo,
            seguro_medico: updates.seguro_medico,
            tipo_discapacidad: updates.tipo_discapacidad,
            carnet_conadis: updates.carnet_conadis,
            descripcion_discapacidad: updates.descripcion_discapacidad,
            es_dirigente: updates.es_dirigente,
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
   * 🗑️ Eliminar scout (eliminación física)
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
   * 🔄 Desactivar scout (cambiar estado a INACTIVO)
   * Endpoint: PUT /api/scouts/{id}/desactivar
   */
  static async desactivarScout(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('api_desactivar_scout', { p_scout_id: id });

      if (error) throw error;
      
      if (data?.success) {
        return { success: true };
      }
      
      return { success: false, error: data?.message || 'Error desconocido' };
    } catch (error) {
      console.error('❌ Error al desactivar scout:', error);
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
      
      // Usar api_obtener_scout que ya retorna los familiares
      const { data, error } = await supabase.rpc('api_obtener_scout', {
        p_scout_id: scoutId
      });
      
      if (error) {
        console.error('❌ Error al obtener scout con familiares:', error);
        return [];
      }
      
      const familiares = data?.familiares || [];
      console.log('✅ Familiares obtenidos:', familiares.length);
      return familiares;
    } catch (error) {
      console.error('❌ Error al obtener familiares del scout:', error);
      return [];
    }
  }

  /**
   * 👨‍👩‍👧‍👦 CRUD de Familiares
   */
  
  /**
   * Crear un familiar para un scout
   */
  static async createFamiliar(scoutId: string, familiarData: any) {
    try {
      console.log('📝 Creando familiar para scout:', scoutId);
      
      const { data, error } = await supabase.rpc('api_registrar_familiar', {
        p_scout_id: scoutId,
        p_familiar_data: familiarData
      });

      if (error) {
        console.error('❌ Error al crear familiar:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Familiar creado:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error al crear familiar:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar un familiar existente
   */
  static async updateFamiliar(familiarId: string, updates: any) {
    try {
      console.log('✏️ Actualizando familiar:', familiarId);
      
      const { data, error } = await supabase.rpc('api_actualizar_familiar', {
        p_familiar_id: familiarId,
        p_familiar_data: updates
      });

      if (error) {
        console.error('❌ Error al actualizar familiar:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Familiar actualizado:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error al actualizar familiar:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Eliminar un familiar
   */
  static async deleteFamiliar(familiarId: string) {
    try {
      console.log('🗑️ Eliminando familiar:', familiarId);
      
      const { data, error } = await supabase.rpc('api_eliminar_familiar', {
        p_familiar_id: familiarId
      });

      if (error) {
        console.error('❌ Error al eliminar familiar:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Familiar eliminado');
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error al eliminar familiar:', error);
      return { success: false, error: error.message };
    }
  }
}

export default ScoutService;