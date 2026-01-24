/**
 * Servicio para gestión de Dirigentes
 * Basado en formato DNGI-02 - Registro Institucional para Adultos Voluntarios
 */

import { supabase } from '../lib/supabase';
import {
  Dirigente,
  FormularioDirigente,
  EstadisticasDirigentes,
  DocumentoDirigente,
  FormacionDirigente,
} from '../types/dirigente';

// ============================================================================
// CLASE PRINCIPAL DEL SERVICIO
// ============================================================================

export class DirigenteService {
  // ==========================================================================
  // CRUD PRINCIPAL
  // ==========================================================================

  /**
   * Obtener todos los dirigentes con filtros opcionales
   */
  static async obtenerDirigentes(filtros?: {
    estado?: string;
    cargo?: string;
    rama?: string;
    nivel_formacion?: string;
  }): Promise<Dirigente[]> {
    try {
      const { data, error } = await supabase.rpc('obtener_dirigentes_completo', {
        p_filtros: filtros || {},
      });

      if (error) throw error;
      return (data as Dirigente[]) || [];
    } catch (error) {
      console.error('Error al obtener dirigentes:', error);
      throw error;
    }
  }

  /**
   * Obtener un dirigente por ID con todos sus datos relacionados
   */
  static async obtenerDirigentePorId(id: string): Promise<Dirigente | null> {
    try {
      const { data, error } = await supabase.rpc('obtener_dirigente_por_id', {
        p_dirigente_id: id,
      });

      if (error) throw error;
      return data as Dirigente;
    } catch (error) {
      console.error('Error al obtener dirigente:', error);
      throw error;
    }
  }

  /**
   * Registrar un nuevo dirigente
   */
  static async registrarDirigente(
    datos: FormularioDirigente
  ): Promise<{ success: boolean; message: string; data?: { dirigente_id: string } }> {
    try {
      const { data, error } = await supabase.rpc('registrar_dirigente_completo', {
        p_datos: datos,
      });

      if (error) throw error;
      return data as { success: boolean; message: string; data?: { dirigente_id: string } };
    } catch (error) {
      console.error('Error al registrar dirigente:', error);
      throw error;
    }
  }

  /**
   * Actualizar un dirigente existente
   */
  static async actualizarDirigente(
    id: string,
    datos: Partial<FormularioDirigente>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('actualizar_dirigente', {
        p_dirigente_id: id,
        p_datos: datos,
      });

      if (error) throw error;
      return data as { success: boolean; message: string };
    } catch (error) {
      console.error('Error al actualizar dirigente:', error);
      throw error;
    }
  }

  /**
   * Cambiar estado de un dirigente
   */
  static async cambiarEstado(
    id: string,
    nuevoEstado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'RETIRADO'
  ): Promise<{ success: boolean; message: string }> {
    return this.actualizarDirigente(id, { observaciones: `Estado cambiado a ${nuevoEstado}` } as Partial<FormularioDirigente>);
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  /**
   * Obtener estadísticas generales de dirigentes
   */
  static async obtenerEstadisticas(): Promise<EstadisticasDirigentes> {
    try {
      const { data, error } = await supabase.rpc('obtener_estadisticas_dirigentes');

      if (error) throw error;
      return data as EstadisticasDirigentes;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      // Retornar valores por defecto en caso de error
      return {
        total_dirigentes: 0,
        por_cargo: {} as EstadisticasDirigentes['por_cargo'],
        por_nivel_formacion: {} as EstadisticasDirigentes['por_nivel_formacion'],
        con_sfh1_aprobado: 0,
        con_documentos_completos: 0,
        membresias_por_vencer: 0,
      };
    }
  }

  // ==========================================================================
  // GESTIÓN DE DOCUMENTOS
  // ==========================================================================

  /**
   * Subir documento de un dirigente
   */
  static async subirDocumento(
    dirigenteId: string,
    archivo: File,
    tipoDocumento: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Generar nombre único para el archivo
      const extension = archivo.name.split('.').pop();
      const nombreArchivo = `${dirigenteId}/${tipoDocumento}_${Date.now()}.${extension}`;

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documentos-dirigentes')
        .upload(nombreArchivo, archivo, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('documentos-dirigentes')
        .getPublicUrl(nombreArchivo);

      // Registrar en base de datos
      const { error: dbError } = await supabase.from('dirigentes_documentos').upsert(
        {
          dirigente_id: dirigenteId,
          tipo_documento: tipoDocumento,
          nombre_archivo: archivo.name,
          url_archivo: urlData.publicUrl,
          mime_type: archivo.type,
          tamano_bytes: archivo.size,
          estado: 'PENDIENTE',
        },
        {
          onConflict: 'dirigente_id,tipo_documento',
        }
      );

      if (dbError) throw dbError;

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('Error al subir documento:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Obtener documentos de un dirigente
   */
  static async obtenerDocumentos(dirigenteId: string): Promise<DocumentoDirigente[]> {
    try {
      const { data, error } = await supabase
        .from('dirigentes_documentos')
        .select('*')
        .eq('dirigente_id', dirigenteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((doc) => ({
        id: doc.id,
        tipo: doc.tipo_documento,
        nombre: doc.nombre_archivo,
        url: doc.url_archivo,
        estado: doc.estado,
        fecha_vencimiento: doc.fecha_vencimiento,
      }));
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      return [];
    }
  }

  /**
   * Eliminar documento
   */
  static async eliminarDocumento(documentoId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('dirigentes_documentos')
        .delete()
        .eq('id', documentoId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      return { success: false };
    }
  }

  // ==========================================================================
  // GESTIÓN DE FORMACIONES
  // ==========================================================================

  /**
   * Registrar una formación/curso
   */
  static async registrarFormacion(
    dirigenteId: string,
    formacion: {
      tipo_curso: string;
      nombre_curso: string;
      institucion?: string;
      fecha_inicio?: string;
      fecha_fin?: string;
      fecha_certificado?: string;
      numero_certificado?: string;
      horas_duracion?: number;
    }
  ): Promise<{ success: boolean; id?: string }> {
    try {
      const { data, error } = await supabase
        .from('dirigentes_formacion')
        .insert({
          dirigente_id: dirigenteId,
          ...formacion,
          estado: 'PENDIENTE',
        })
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, id: data?.id };
    } catch (error) {
      console.error('Error al registrar formación:', error);
      return { success: false };
    }
  }

  /**
   * Obtener formaciones de un dirigente
   */
  static async obtenerFormaciones(dirigenteId: string): Promise<FormacionDirigente[]> {
    try {
      const { data, error } = await supabase
        .from('dirigentes_formacion')
        .select('*')
        .eq('dirigente_id', dirigenteId)
        .order('fecha_certificado', { ascending: false });

      if (error) throw error;
      return (data || []).map((f) => ({
        id: f.id,
        tipo: f.tipo_curso,
        nombre: f.nombre_curso,
        institucion: f.institucion,
        fecha_certificado: f.fecha_certificado,
        numero_certificado: f.numero_certificado,
        archivo_url: f.archivo_certificado_url,
        estado: f.estado,
      }));
    } catch (error) {
      console.error('Error al obtener formaciones:', error);
      return [];
    }
  }

  // ==========================================================================
  // BÚSQUEDA
  // ==========================================================================

  /**
   * Buscar dirigentes por término
   */
  static async buscarDirigentes(termino: string): Promise<Dirigente[]> {
    try {
      const terminoLower = termino.toLowerCase().trim();

      // Obtener todos los dirigentes y filtrar en cliente
      // (idealmente esto debería ser una función RPC optimizada)
      const todos = await this.obtenerDirigentes();

      return todos.filter((d) => {
        const nombreCompleto = `${d.persona.nombres} ${d.persona.apellidos}`.toLowerCase();
        const documento = d.persona.numero_documento?.toLowerCase() || '';
        const correo = d.persona.correo?.toLowerCase() || '';
        const codigo = d.codigo_credencial?.toLowerCase() || '';

        return (
          nombreCompleto.includes(terminoLower) ||
          documento.includes(terminoLower) ||
          correo.includes(terminoLower) ||
          codigo.includes(terminoLower)
        );
      });
    } catch (error) {
      console.error('Error al buscar dirigentes:', error);
      return [];
    }
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Verificar si un documento de identidad ya está registrado
   */
  static async verificarDocumentoExistente(
    numeroDocumento: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('id')
        .eq('numero_documento', numeroDocumento)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data && excludeId) {
        // Verificar si es el mismo registro
        const { data: dirigente } = await supabase
          .from('dirigentes')
          .select('id')
          .eq('persona_id', data.id)
          .single();

        return dirigente?.id !== excludeId;
      }

      return !!data;
    } catch (error) {
      console.error('Error al verificar documento:', error);
      return false;
    }
  }

  /**
   * Obtener resumen para dashboard
   */
  static async obtenerResumenDashboard(): Promise<{
    activos: number;
    nuevosEsteMes: number;
    porVencerMembresia: number;
    pendientesSFH1: number;
  }> {
    try {
      const stats = await this.obtenerEstadisticas();
      const todos = await this.obtenerDirigentes({ estado: 'ACTIVO' });

      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      const nuevosEsteMes = todos.filter((d) => {
        const fechaCreacion = new Date(d.created_at);
        return fechaCreacion >= inicioMes;
      }).length;

      const pendientesSFH1 = todos.filter((d) => !d.aprobo_sfh1).length;

      return {
        activos: stats.total_dirigentes,
        nuevosEsteMes,
        porVencerMembresia: stats.membresias_por_vencer,
        pendientesSFH1,
      };
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      return {
        activos: 0,
        nuevosEsteMes: 0,
        porVencerMembresia: 0,
        pendientesSFH1: 0,
      };
    }
  }
}

export default DirigenteService;
