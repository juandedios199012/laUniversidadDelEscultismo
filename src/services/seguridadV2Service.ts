import { supabase } from '../lib/supabase';
import { shouldSkipAuth } from '../config/dev';

// ================================================================
// TIPOS
// ================================================================

export interface AppModule {
  id: string;
  name: string;
  label: string;
  parent_id: string | null;
  icon: string | null;
  orden: number;
  activo: boolean;
  permissions?: AppPermission[];
}

export interface AppPermission {
  id: string;
  module_id?: string;
  name: string;
  permission_key: string;
  descripcion: string | null;
  activo: boolean;
  /** Solo disponible en la respuesta de la matriz completa */
  roles_con_permiso?: string[];
  /** Solo disponible en la respuesta de la matriz por rol */
  tiene?: boolean;
}

export interface RolBasico {
  id: string;
  nombre: string;
  color: string;
  nivel: number;
}

export interface MatrizCompleta {
  roles: RolBasico[];
  modulos: AppModule[];
}

export interface MatrizRol {
  rol_id: string;
  rol_nombre: string;
  modulos: AppModule[];
}

export interface NuevoModulo {
  name: string;
  label: string;
  parent_id?: string | null;
  icon?: string | null;
  orden?: number;
}

export interface NuevoPermiso {
  module_id: string;
  name: string;
  permission_key: string;
  descripcion?: string;
}

// ================================================================
// SERVICIO
// ================================================================

export class SeguridadV2Service {

  // -------------------------------------------------------------------
  // Lectura
  // -------------------------------------------------------------------

  /** Obtiene todos los módulos con sus permisos */
  static async obtenerModulos(): Promise<AppModule[]> {
    const { data, error } = await supabase.rpc('api_v2_obtener_modulos');
    if (error) {
      console.error('❌ api_v2_obtener_modulos:', error);
      return [];
    }
    return (data?.data as AppModule[]) ?? [];
  }

  /**
   * Devuelve la lista de permission_keys del usuario.
   * Usada por useAbility para cargar permisos al iniciar sesión.
   */
  static async obtenerPermisosUsuario(userId: string): Promise<string[]> {
    const { data, error } = await supabase.rpc('api_v2_obtener_permisos_usuario', {
      p_user_id: userId,
    });
    if (error) {
      console.error('❌ api_v2_obtener_permisos_usuario:', error);
      return [];
    }
    return (data?.data as string[]) ?? [];
  }

  /** Matriz completa: todos los roles × todos los permisos */
  static async obtenerMatrizCompleta(): Promise<MatrizCompleta | null> {
    const { data, error } = await supabase.rpc('api_v2_obtener_matriz_completa');
    if (error) {
      console.error('❌ api_v2_obtener_matriz_completa:', error);
      return null;
    }
    return (data?.data as MatrizCompleta) ?? null;
  }

  /** Matriz de un rol específico (con flag tiene por permiso) */
  static async obtenerMatrizRol(rolId: string): Promise<MatrizRol | null> {
    const { data, error } = await supabase.rpc('api_v2_obtener_matriz_rol', {
      p_rol_id: rolId,
    });
    if (error) {
      console.error('❌ api_v2_obtener_matriz_rol:', error);
      return null;
    }
    return data?.success ? (data.data as MatrizRol) : null;
  }

  // -------------------------------------------------------------------
  // Mutaciones de permisos
  // -------------------------------------------------------------------

  /** Activa o desactiva un permiso para un rol */
  static async togglePermiso(
    adminId: string,
    rolId: string,
    permisoId: string,
    otorgar: boolean,
  ): Promise<{ success: boolean; error?: string }> {
    // En localhost con VITE_DEV_SKIP_AUTH=true: simular éxito (el mock DEV_USER
    // no existe en la BD, la RPC lo rechazaría de todas formas).
    if (shouldSkipAuth()) {
      console.log('🔓 DEV: togglePermiso simulado (localhost)');
      return { success: true };
    }
    const { data, error } = await supabase.rpc('api_v2_toggle_permiso', {
      p_admin_id:   adminId,
      p_rol_id:     rolId,
      p_permiso_id: permisoId,
      p_otorgar:    otorgar,
    });
    if (error) return { success: false, error: error.message };
    return { success: data?.success ?? false, error: data?.error };
  }

  // -------------------------------------------------------------------
  // Registro de módulos / permisos (modo desarrollador)
  // -------------------------------------------------------------------

  static async registrarModulo(
    adminId: string,
    modulo: NuevoModulo,
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    if (shouldSkipAuth()) {
      console.log('🔓 DEV: registrarModulo simulado (localhost)');
      return { success: true, id: crypto.randomUUID() };
    }
    const { data, error } = await supabase.rpc('api_v2_registrar_modulo', {
      p_admin_id:  adminId,
      p_name:      modulo.name,
      p_label:     modulo.label,
      p_parent_id: modulo.parent_id ?? null,
      p_icon:      modulo.icon ?? null,
      p_orden:     modulo.orden ?? 0,
    });
    if (error) return { success: false, error: error.message };
    return {
      success: data?.success ?? false,
      id:      data?.data?.id,
      error:   data?.error,
    };
  }

  static async registrarPermiso(
    adminId: string,
    permiso: NuevoPermiso,
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    if (shouldSkipAuth()) {
      console.log('🔓 DEV: registrarPermiso simulado (localhost)');
      return { success: true, id: crypto.randomUUID() };
    }
    const { data, error } = await supabase.rpc('api_v2_registrar_permiso', {
      p_admin_id:       adminId,
      p_module_id:      permiso.module_id,
      p_name:           permiso.name,
      p_permission_key: permiso.permission_key,
      p_descripcion:    permiso.descripcion ?? null,
    });
    if (error) return { success: false, error: error.message };
    return {
      success: data?.success ?? false,
      id:      data?.data?.id,
      error:   data?.error,
    };
  }

  static async eliminarModulo(
    adminId: string,
    moduleId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (shouldSkipAuth()) {
      console.log('🔓 DEV: eliminarModulo simulado (localhost)');
      return { success: true };
    }
    const { data, error } = await supabase.rpc('api_v2_eliminar_modulo', {
      p_admin_id:  adminId,
      p_module_id: moduleId,
    });
    if (error) return { success: false, error: error.message };
    return { success: data?.success ?? false, error: data?.error };
  }

  static async eliminarPermiso(
    adminId: string,
    permisoId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (shouldSkipAuth()) {
      console.log('🔓 DEV: eliminarPermiso simulado (localhost)');
      return { success: true };
    }
    const { data, error } = await supabase.rpc('api_v2_eliminar_permiso', {
      p_admin_id:   adminId,
      p_permiso_id: permisoId,
    });
    if (error) return { success: false, error: error.message };
    return { success: data?.success ?? false, error: data?.error };
  }
}
