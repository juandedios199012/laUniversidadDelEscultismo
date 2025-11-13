import { supabase } from '../lib/supabase';

// ================================================================
// SERVICIO: Gestión de Usuario-Grupo Scout
// Maneja las relaciones entre usuarios y grupos scout
// ================================================================

export interface UserGrupoAssignment {
  id: string;
  user_id: string;
  grupo_scout_id: string;
  role: string;
  activo: boolean;
  fecha_asignacion: string;
  created_at: string;
  updated_at: string;
}

export interface GrupoScoutBasic {
  id: string;
  nombre: string;
  numeral: string;
  localidad: string;
  region: string;
  codigo_grupo: string;
}

export interface CreateUserGrupoRequest {
  user_id: string;
  grupo_scout_id: string;
  role?: 'dirigente' | 'admin' | 'colaborador';
}

export class UserGrupoScoutService {
  
  /**
   * 👥 Asignar usuario a grupo scout
   */
  static async asignarUsuarioAGrupo(request: CreateUserGrupoRequest): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('👥 Asignando usuario a grupo scout...', request);

      // Verificar si el usuario ya tiene un grupo asignado
      const { data: existingAssignment } = await supabase
        .from('user_grupo_scout')
        .select('id, grupo_scout_id')
        .eq('user_id', request.user_id)
        .eq('activo', true)
        .single();

      if (existingAssignment) {
        return { 
          success: false, 
          error: 'El usuario ya tiene un grupo scout asignado. Un usuario solo puede pertenecer a un grupo.' 
        };
      }

      // Crear la asignación
      const { error } = await supabase
        .from('user_grupo_scout')
        .insert([{
          user_id: request.user_id,
          grupo_scout_id: request.grupo_scout_id,
          role: request.role || 'dirigente',
          activo: true
        }]);

      if (error) throw error;

      console.log('✅ Usuario asignado a grupo scout exitosamente');
      return { success: true };

    } catch (error) {
      console.error('❌ Error al asignar usuario a grupo:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * 🔄 Cambiar usuario de grupo (remover del actual y asignar al nuevo)
   */
  static async cambiarUsuarioDeGrupo(userId: string, newGrupoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Cambiando usuario de grupo...', { userId, newGrupoId });

      // Desactivar asignación actual
      const { error: deactivateError } = await supabase
        .from('user_grupo_scout')
        .update({ activo: false })
        .eq('user_id', userId)
        .eq('activo', true);

      if (deactivateError) throw deactivateError;

      // Crear nueva asignación
      const { error: assignError } = await supabase
        .from('user_grupo_scout')
        .insert([{
          user_id: userId,
          grupo_scout_id: newGrupoId,
          role: 'dirigente', // Rol por defecto
          activo: true
        }]);

      if (assignError) throw assignError;

      console.log('✅ Usuario cambiado de grupo exitosamente');
      return { success: true };

    } catch (error) {
      console.error('❌ Error al cambiar usuario de grupo:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * ❌ Remover usuario de grupo scout
   */
  static async removerUsuarioDeGrupo(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('❌ Removiendo usuario de grupo scout...', userId);

      const { error } = await supabase
        .from('user_grupo_scout')
        .update({ activo: false })
        .eq('user_id', userId)
        .eq('activo', true);

      if (error) throw error;

      console.log('✅ Usuario removido de grupo scout exitosamente');
      return { success: true };

    } catch (error) {
      console.error('❌ Error al remover usuario de grupo:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * 📋 Obtener grupo del usuario actual
   */
  static async getGrupoDelUsuarioActual(): Promise<{ grupo: GrupoScoutBasic | null; role: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { grupo: null, role: null };
      }

      const { data, error } = await supabase
        .from('user_grupo_scout')
        .select(`
          role,
          grupos_scout (
            id,
            nombre,
            numeral,
            localidad,
            region,
            codigo_grupo
          )
        `)
        .eq('user_id', user.id)
        .eq('activo', true)
        .single();

      if (error || !data) {
        return { grupo: null, role: null };
      }

      return { 
        grupo: data.grupos_scout as unknown as GrupoScoutBasic, 
        role: data.role 
      };

    } catch (error) {
      console.error('❌ Error al obtener grupo del usuario:', error);
      return { grupo: null, role: null };
    }
  }

  /**
   * 👥 Obtener usuarios de un grupo scout
   */
  static async getUsuariosDeGrupo(grupoScoutId: string): Promise<UserGrupoAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('user_grupo_scout')
        .select('*')
        .eq('grupo_scout_id', grupoScoutId)
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Error al obtener usuarios del grupo:', error);
      return [];
    }
  }

  /**
   * 🔄 Actualizar rol de usuario en grupo
   */
  static async actualizarRolUsuario(userId: string, newRole: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Actualizando rol de usuario...', { userId, newRole });

      const { error } = await supabase
        .from('user_grupo_scout')
        .update({ role: newRole })
        .eq('user_id', userId)
        .eq('activo', true);

      if (error) throw error;

      console.log('✅ Rol de usuario actualizado exitosamente');
      return { success: true };

    } catch (error) {
      console.error('❌ Error al actualizar rol de usuario:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * 📊 Obtener estadísticas de asignaciones
   */
  static async getEstadisticasAsignaciones(): Promise<{
    totalUsuariosAsignados: number;
    totalGruposConUsuarios: number;
    usuariosSinGrupo: number;
  }> {
    try {
      // Total usuarios asignados
      const { count: usuariosAsignados } = await supabase
        .from('user_grupo_scout')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);

      // Total grupos con usuarios
      const { data: gruposConUsuarios } = await supabase
        .from('user_grupo_scout')
        .select('grupo_scout_id')
        .eq('activo', true);

      const uniqueGrupos = new Set(gruposConUsuarios?.map(item => item.grupo_scout_id) || []);

      return {
        totalUsuariosAsignados: usuariosAsignados || 0,
        totalGruposConUsuarios: uniqueGrupos.size,
        usuariosSinGrupo: 0 // TODO: Calcular usuarios registrados sin grupo
      };

    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      return {
        totalUsuariosAsignados: 0,
        totalGruposConUsuarios: 0,
        usuariosSinGrupo: 0
      };
    }
  }

  /**
   * 🔍 Verificar si usuario tiene acceso a un grupo específico
   */
  static async verificarAccesoAGrupo(grupoScoutId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_grupo_scout')
        .select('id')
        .eq('user_id', user.id)
        .eq('grupo_scout_id', grupoScoutId)
        .eq('activo', true)
        .single();

      return !error && !!data;

    } catch (error) {
      console.error('❌ Error al verificar acceso a grupo:', error);
      return false;
    }
  }
}

export default UserGrupoScoutService;