/**
 * Servicio para gestión de Colaboradores
 * Clon independiente del servicio de Dirigentes: usa RPCs, tablas y bucket
 * de Storage propios ('documentos-colaboradores'), sin relación con los
 * registros del módulo de Dirigentes.
 */

import { supabase } from '../lib/supabase';
import {
  Colaborador,
  FormularioColaborador,
  EstadisticasColaboradores,
  DocumentoColaborador,
  FormacionColaborador,
} from '../types/colaborador';

// ============================================================================
// CLASE PRINCIPAL DEL SERVICIO
// ============================================================================

export class ColaboradorService {
  // ==========================================================================
  // CRUD PRINCIPAL
  // ==========================================================================

  /**
   * Obtener todos los colaboradores con filtros opcionales
   */
  static async obtenerColaboradores(filtros?: {
    estado?: string;
    cargo?: string;
    rama?: string;
    nivel_formacion?: string;
  }): Promise<Colaborador[]> {
    try {
      const { data, error } = await supabase.rpc('obtener_colaboradores', {
        p_filtros: filtros || {},
      });

      if (error) throw error;
      return (data as Colaborador[]) || [];
    } catch (error) {
      console.error('Error al obtener colaboradores:', error);
      throw error;
    }
  }

  /**
   * Obtener un colaborador por ID con todos sus datos relacionados
   */
  static async obtenerColaboradorPorId(id: string): Promise<Colaborador | null> {
    try {
      const { data, error } = await supabase.rpc('obtener_colaborador_por_id', {
        p_colaborador_id: id,
      });

      if (error) throw error;
      return data as Colaborador;
    } catch (error) {
      console.error('Error al obtener colaborador:', error);
      throw error;
    }
  }

  /**
   * Registrar un nuevo colaborador
   */
  static async registrarColaborador(
    datos: FormularioColaborador
  ): Promise<{ success: boolean; message: string; data?: { colaborador_id: string } }> {
    try {
      const { data, error } = await supabase.rpc('registrar_colaborador', {
        p_datos: datos,
      });

      if (error) throw error;
      return data as { success: boolean; message: string; data?: { colaborador_id: string } };
    } catch (error) {
      console.error('Error al registrar colaborador:', error);
      throw error;
    }
  }

  /**
   * Actualizar un colaborador existente
   */
  static async actualizarColaborador(
    id: string,
    datos: Partial<FormularioColaborador>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('actualizar_colaborador', {
        p_colaborador_id: id,
        p_datos: datos,
      });

      if (error) throw error;
      return data as { success: boolean; message: string };
    } catch (error) {
      console.error('Error al actualizar colaborador:', error);
      throw error;
    }
  }

  /**
   * Cambiar estado de un colaborador
   */
  static async cambiarEstado(
    id: string,
    nuevoEstado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'RETIRADO'
  ): Promise<{ success: boolean; message: string }> {
    return this.actualizarColaborador(id, { observaciones: `Estado cambiado a ${nuevoEstado}` } as Partial<FormularioColaborador>);
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  /**
   * Obtener estadísticas generales de colaboradores
   */
  static async obtenerEstadisticas(): Promise<EstadisticasColaboradores> {
    try {
      const { data, error } = await supabase.rpc('obtener_estadisticas_colaboradores');

      if (error) throw error;
      return data as EstadisticasColaboradores;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      // Retornar valores por defecto en caso de error
      return {
        total_colaboradores: 0,
        por_cargo: {} as EstadisticasColaboradores['por_cargo'],
        por_nivel_formacion: {} as EstadisticasColaboradores['por_nivel_formacion'],
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
   * Subir documento de un colaborador
   */
  static async subirDocumento(
    colaboradorId: string,
    archivo: File,
    tipoDocumento: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Generar nombre único para el archivo
      const extension = archivo.name.split('.').pop();
      const nombreArchivo = `${colaboradorId}/${tipoDocumento}_${Date.now()}.${extension}`;

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documentos-colaboradores')
        .upload(nombreArchivo, archivo, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('documentos-colaboradores')
        .getPublicUrl(nombreArchivo);

      // Registrar en base de datos
      const { error: dbError } = await supabase.from('colaboradores_documentos').upsert(
        {
          colaborador_id: colaboradorId,
          tipo_documento: tipoDocumento,
          nombre_archivo: archivo.name,
          url_archivo: urlData.publicUrl,
          mime_type: archivo.type,
          tamano_bytes: archivo.size,
          estado: 'PENDIENTE',
        },
        {
          onConflict: 'colaborador_id,tipo_documento',
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
   * Obtener documentos de un colaborador
   */
  static async obtenerDocumentos(colaboradorId: string): Promise<DocumentoColaborador[]> {
    try {
      const { data, error } = await supabase
        .from('colaboradores_documentos')
        .select('*')
        .eq('colaborador_id', colaboradorId)
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
        .from('colaboradores_documentos')
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
    colaboradorId: string,
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
        .from('colaboradores_formacion')
        .insert({
          colaborador_id: colaboradorId,
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
   * Obtener formaciones de un colaborador
   */
  static async obtenerFormaciones(colaboradorId: string): Promise<FormacionColaborador[]> {
    try {
      const { data, error } = await supabase
        .from('colaboradores_formacion')
        .select('*')
        .eq('colaborador_id', colaboradorId)
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
   * Buscar colaboradores por término
   */
  static async buscarColaboradores(termino: string): Promise<Colaborador[]> {
    try {
      const terminoLower = termino.toLowerCase().trim();

      // Obtener todos los colaboradores y filtrar en cliente
      // (idealmente esto debería ser una función RPC optimizada)
      const todos = await this.obtenerColaboradores();

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
      console.error('Error al buscar colaboradores:', error);
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
        const { data: colaborador } = await supabase
          .from('colaboradores')
          .select('id')
          .eq('persona_id', data.id)
          .single();

        return colaborador?.id !== excludeId;
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
      const todos = await this.obtenerColaboradores({ estado: 'ACTIVO' });

      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      const nuevosEsteMes = todos.filter((d) => {
        const fechaCreacion = new Date(d.created_at);
        return fechaCreacion >= inicioMes;
      }).length;

      const pendientesSFH1 = todos.filter((d) => !d.aprobo_sfh1).length;

      return {
        activos: stats.total_colaboradores,
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

export default ColaboradorService;
