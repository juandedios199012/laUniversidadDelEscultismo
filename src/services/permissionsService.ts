import { supabase } from '../lib/supabase';

// ================================================================
// TIPOS
// ================================================================

export type Modulo = 
  | 'dashboard' | 'scouts' | 'dirigentes' | 'patrullas' 
  | 'asistencia' | 'actividades' | 'progresion' | 'inscripciones'
  | 'finanzas' | 'inventario' | 'presupuestos' | 'reportes'
  | 'mapas' | 'libro_oro' | 'programa_semanal' | 'comite_padres'
  | 'actividades_exterior' | 'seguridad' | 'configuracion';

export type Accion = 'crear' | 'leer' | 'editar' | 'eliminar' | 'exportar' | 'aprobar';

export type Rama = 'MANADA' | 'TROPA' | 'COMUNIDAD' | 'CLAN';

export interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  nivel_jerarquia: number;
  es_sistema: boolean;
  color: string;
  icono: string;
  activo: boolean;
  usuarios_count?: number;
}

export interface Permiso {
  modulo: Modulo;
  accion: Accion;
  rol: string;
  rama?: Rama;
  condiciones?: Record<string, unknown>;
}

export interface UsuarioSeguridad {
  user_id: string;
  roles: Rol[];
  rol_principal: Rol | null;
  permisos: Permiso[];
  modulos_accesibles: Modulo[];
}

export interface AsignacionRol {
  user_id: string;
  rol_nombre: string;
  rama?: Rama;
  notas?: string;
}

// ================================================================
// SERVICIO DE PERMISOS
// ================================================================

export class PermissionsService {
  
  // Cache local de permisos del usuario actual
  private static permisosCache: Map<string, UsuarioSeguridad> = new Map();
  private static cacheTimeout = 5 * 60 * 1000; // 5 minutos
  private static lastCacheTime: Map<string, number> = new Map();

  /**
   * Obtener todos los datos de seguridad del usuario
   */
  static async obtenerSeguridadUsuario(userId: string): Promise<UsuarioSeguridad | null> {
    try {
      // Verificar cache
      const cached = this.permisosCache.get(userId);
      const lastTime = this.lastCacheTime.get(userId) || 0;
      
      if (cached && (Date.now() - lastTime) < this.cacheTimeout) {
        return cached;
      }

      const { data, error } = await supabase
        .rpc('api_obtener_seguridad_usuario', { p_user_id: userId });

      if (error) {
        console.error('❌ Error obteniendo seguridad:', error);
        return null;
      }

      if (data?.success && data?.data) {
        const seguridad = data.data as UsuarioSeguridad;
        // Guardar en cache
        this.permisosCache.set(userId, seguridad);
        this.lastCacheTime.set(userId, Date.now());
        return seguridad;
      }

      return null;
    } catch (error) {
      console.error('❌ Error en obtenerSeguridadUsuario:', error);
      return null;
    }
  }

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  static async tienePermiso(userId: string, modulo: Modulo, accion: Accion): Promise<boolean> {
    try {
      const seguridad = await this.obtenerSeguridadUsuario(userId);
      
      if (!seguridad) return false;

      return seguridad.permisos.some(
        p => p.modulo === modulo && p.accion === accion
      );
    } catch (error) {
      console.error('❌ Error verificando permiso:', error);
      return false;
    }
  }

  /**
   * Verificar si el usuario puede acceder a un módulo (tiene al menos permiso de lectura)
   */
  static async puedeAccederModulo(userId: string, modulo: Modulo): Promise<boolean> {
    return this.tienePermiso(userId, modulo, 'leer');
  }

  /**
   * Obtener los módulos accesibles para el usuario
   */
  static async obtenerModulosAccesibles(userId: string): Promise<Modulo[]> {
    try {
      const seguridad = await this.obtenerSeguridadUsuario(userId);
      return seguridad?.modulos_accesibles || [];
    } catch (error) {
      console.error('❌ Error obteniendo módulos:', error);
      return [];
    }
  }

  /**
   * Obtener el rol principal del usuario
   */
  static async obtenerRolPrincipal(userId: string): Promise<Rol | null> {
    try {
      const seguridad = await this.obtenerSeguridadUsuario(userId);
      return seguridad?.rol_principal || null;
    } catch (error) {
      console.error('❌ Error obteniendo rol principal:', error);
      return null;
    }
  }

  /**
   * Listar todos los roles disponibles (para admin)
   */
  static async listarRoles(): Promise<Rol[]> {
    try {
      const { data, error } = await supabase.rpc('api_listar_roles');

      if (error) {
        console.error('❌ Error listando roles:', error);
        return [];
      }

      return data?.data || [];
    } catch (error) {
      console.error('❌ Error en listarRoles:', error);
      return [];
    }
  }

  /**
   * Asignar un rol a un usuario
   */
  static async asignarRol(
    adminId: string, 
    asignacion: AsignacionRol
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('api_asignar_rol', {
        p_admin_id: adminId,
        p_user_id: asignacion.user_id,
        p_rol_nombre: asignacion.rol_nombre,
        p_rama: asignacion.rama || null,
        p_notas: asignacion.notas || null
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Invalidar cache del usuario afectado
      this.permisosCache.delete(asignacion.user_id);

      return { success: data?.success || false, error: data?.error };
    } catch (error) {
      return { success: false, error: 'Error al asignar rol' };
    }
  }

  /**
   * Revocar un rol de un usuario
   */
  static async revocarRol(
    adminId: string,
    userId: string,
    rolNombre: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('api_revocar_rol', {
        p_admin_id: adminId,
        p_user_id: userId,
        p_rol_nombre: rolNombre
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Invalidar cache
      this.permisosCache.delete(userId);

      return { success: data?.success || false, error: data?.error };
    } catch (error) {
      return { success: false, error: 'Error al revocar rol' };
    }
  }

  /**
   * Limpiar cache de permisos
   */
  static limpiarCache(userId?: string): void {
    if (userId) {
      this.permisosCache.delete(userId);
      this.lastCacheTime.delete(userId);
    } else {
      this.permisosCache.clear();
      this.lastCacheTime.clear();
    }
  }

  /**
   * Obtener permisos agrupados por módulo (para UI)
   */
  static async obtenerPermisosAgrupados(userId: string): Promise<Record<Modulo, Accion[]>> {
    try {
      const seguridad = await this.obtenerSeguridadUsuario(userId);
      
      if (!seguridad) return {} as Record<Modulo, Accion[]>;

      const agrupados: Record<string, Accion[]> = {};
      
      for (const permiso of seguridad.permisos) {
        if (!agrupados[permiso.modulo]) {
          agrupados[permiso.modulo] = [];
        }
        if (!agrupados[permiso.modulo].includes(permiso.accion)) {
          agrupados[permiso.modulo].push(permiso.accion);
        }
      }

      return agrupados as Record<Modulo, Accion[]>;
    } catch (error) {
      console.error('❌ Error obteniendo permisos agrupados:', error);
      return {} as Record<Modulo, Accion[]>;
    }
  }
}

export default PermissionsService;
