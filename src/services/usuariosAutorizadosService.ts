import { supabase } from '../lib/supabase';

// ================================================================
// TIPOS
// ================================================================

export interface UsuarioAutorizado {
  id: string;
  email: string;
  nombre_completo: string;
  grupo_scout_id: string;
  role: 'dirigente' | 'grupo_admin' | 'super_admin';
  activo: boolean;
  autorizado_por?: string;
  fecha_autorizacion: string;
  ultimo_acceso?: string;
  created_at: string;
  // Datos relacionados
  grupo_scout?: {
    id: string;
    nombre: string;
    numeral: string;
  };
}

export interface SolicitudAcceso {
  id: string;
  email: string;
  nombre_solicitante?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fecha_solicitud: string;
  fecha_respuesta?: string;
  respondido_por?: string;
  notas?: string;
}

export interface InvitarUsuarioData {
  email: string;
  nombre_completo: string;
  role: 'dirigente' | 'grupo_admin' | 'super_admin';
  grupo_scout_id?: string;
}

// ================================================================
// SERVICIO DE USUARIOS AUTORIZADOS
// ================================================================

export class UsuariosAutorizadosService {

  /**
   * Listar todos los usuarios autorizados
   */
  static async listarUsuarios(): Promise<UsuarioAutorizado[]> {
    try {
      const { data, error } = await supabase
        .from('dirigentes_autorizados')
        .select(`
          *,
          grupo_scout:grupos_scout (
            id,
            nombre,
            numeral
          )
        `)
        .order('nombre_completo', { ascending: true });

      if (error) {
        console.error('❌ Error listando usuarios autorizados:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error en listarUsuarios:', error);
      return [];
    }
  }

  /**
   * Invitar (agregar) un nuevo usuario autorizado
   */
  static async invitarUsuario(datos: InvitarUsuarioData, autorizadoPor: string): Promise<{
    success: boolean;
    error?: string;
    data?: UsuarioAutorizado;
  }> {
    try {
      // Verificar que el email no exista ya
      const { data: existente } = await supabase
        .from('dirigentes_autorizados')
        .select('id, email')
        .eq('email', datos.email.toLowerCase())
        .single();

      if (existente) {
        return { success: false, error: 'Este email ya está registrado como usuario autorizado' };
      }

      // Obtener grupo_scout_id si no se proporcionó
      let grupoId = datos.grupo_scout_id;
      if (!grupoId) {
        const { data: grupo } = await supabase
          .from('grupos_scout')
          .select('id')
          .limit(1)
          .single();
        grupoId = grupo?.id;
      }

      // Insertar nuevo usuario autorizado
      const { data, error } = await supabase
        .from('dirigentes_autorizados')
        .insert([{
          email: datos.email.toLowerCase().trim(),
          nombre_completo: datos.nombre_completo.trim(),
          role: datos.role,
          grupo_scout_id: grupoId,
          activo: true,
          autorizado_por: autorizadoPor || null,  // UUID del usuario que autoriza
          fecha_autorizacion: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error invitando usuario:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error en invitarUsuario:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  /**
   * Actualizar rol de un usuario
   */
  static async actualizarRol(usuarioId: string, nuevoRol: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('dirigentes_autorizados')
        .update({ role: nuevoRol })
        .eq('id', usuarioId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Activar/Desactivar usuario
   */
  static async toggleActivo(usuarioId: string, activo: boolean): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('dirigentes_autorizados')
        .update({ activo })
        .eq('id', usuarioId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Eliminar usuario autorizado
   */
  static async eliminarUsuario(usuarioId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('dirigentes_autorizados')
        .delete()
        .eq('id', usuarioId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ================================================================
  // SOLICITUDES DE ACCESO
  // ================================================================

  /**
   * Listar solicitudes de acceso pendientes
   */
  static async listarSolicitudesPendientes(): Promise<SolicitudAcceso[]> {
    try {
      const { data, error } = await supabase
        .from('solicitudes_acceso')
        .select('*')
        .eq('estado', 'pendiente')
        .order('fecha_solicitud', { ascending: false });

      if (error) {
        console.error('❌ Error listando solicitudes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error en listarSolicitudesPendientes:', error);
      return [];
    }
  }

  /**
   * Aprobar solicitud de acceso
   */
  static async aprobarSolicitud(
    solicitudId: string, 
    rol: string,
    aprobadoPor: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Obtener datos de la solicitud
      const { data: solicitud, error: fetchError } = await supabase
        .from('solicitudes_acceso')
        .select('*')
        .eq('id', solicitudId)
        .single();

      if (fetchError || !solicitud) {
        return { success: false, error: 'Solicitud no encontrada' };
      }

      // Agregar a usuarios autorizados
      const resultadoInvitar = await this.invitarUsuario({
        email: solicitud.email,
        nombre_completo: solicitud.nombre_solicitante || solicitud.email.split('@')[0],
        role: rol as 'dirigente' | 'grupo_admin' | 'super_admin'
      }, aprobadoPor);

      if (!resultadoInvitar.success) {
        return { success: false, error: resultadoInvitar.error };
      }

      // Actualizar estado de solicitud
      await supabase
        .from('solicitudes_acceso')
        .update({
          estado: 'aprobada',
          fecha_respuesta: new Date().toISOString(),
          respondido_por: aprobadoPor
        })
        .eq('id', solicitudId);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Rechazar solicitud de acceso
   */
  static async rechazarSolicitud(
    solicitudId: string, 
    rechazadoPor: string,
    notas?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('solicitudes_acceso')
        .update({
          estado: 'rechazada',
          fecha_respuesta: new Date().toISOString(),
          respondido_por: rechazadoPor,
          notas
        })
        .eq('id', solicitudId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
