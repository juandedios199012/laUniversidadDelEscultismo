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

export type Accion = 'crear' | 'leer' | 'ver_detalle' | 'editar' | 'eliminar' | 'exportar' | 'aprobar';

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

  // ================================================================
  // GESTIÓN DE PERMISOS POR ROL
  // ================================================================

  /**
   * Obtener matriz de permisos de un rol
   */
  static async obtenerMatrizPermisosRol(rolId: string): Promise<MatrizPermisoRol | null> {
    try {
      const { data, error } = await supabase.rpc('api_obtener_matriz_permisos_rol', {
        p_rol_id: rolId
      });

      if (error) {
        console.error('❌ Error obteniendo matriz de permisos:', error);
        return null;
      }

      if (data?.success && data?.data) {
        return data.data as MatrizPermisoRol;
      }

      return null;
    } catch (error) {
      console.error('❌ Error en obtenerMatrizPermisosRol:', error);
      return null;
    }
  }

  /**
   * Agregar un permiso a un rol
   */
  static async agregarPermisoRol(
    adminId: string,
    rolId: string,
    modulo: Modulo,
    accion: Accion
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('api_agregar_permiso_rol', {
        p_admin_id: adminId,
        p_rol_id: rolId,
        p_modulo: modulo,
        p_accion: accion
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Limpiar cache de todos los usuarios (los permisos cambiaron)
      this.limpiarCache();

      return { success: data?.success || false, error: data?.error };
    } catch (error) {
      return { success: false, error: 'Error al agregar permiso' };
    }
  }

  /**
   * Quitar un permiso de un rol
   */
  static async quitarPermisoRol(
    adminId: string,
    rolId: string,
    modulo: Modulo,
    accion: Accion
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('api_quitar_permiso_rol', {
        p_admin_id: adminId,
        p_rol_id: rolId,
        p_modulo: modulo,
        p_accion: accion
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Limpiar cache de todos los usuarios
      this.limpiarCache();

      return { success: data?.success || false, error: data?.error };
    } catch (error) {
      return { success: false, error: 'Error al quitar permiso' };
    }
  }

  /**
   * Actualizar múltiples permisos de un rol
   */
  static async actualizarPermisosRol(
    adminId: string,
    rolId: string,
    permisos: { modulo: Modulo; accion: Accion; tiene: boolean }[]
  ): Promise<{ success: boolean; error?: string; agregados?: number; eliminados?: number }> {
    try {
      const { data, error } = await supabase.rpc('api_actualizar_permisos_rol', {
        p_admin_id: adminId,
        p_rol_id: rolId,
        p_permisos: permisos
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Limpiar cache de todos los usuarios
      this.limpiarCache();

      return { 
        success: data?.success || false, 
        error: data?.error,
        agregados: data?.data?.agregados,
        eliminados: data?.data?.eliminados
      };
    } catch (error) {
      return { success: false, error: 'Error al actualizar permisos' };
    }
  }

  /**
   * Sincronizar rol desde dirigentes_autorizados a usuario_roles
   * Se usa cuando un usuario inicia sesión por primera vez y no tiene roles asignados
   */
  static async sincronizarRolDesdeAutorizado(userId: string, email: string): Promise<{ 
    success: boolean; 
    rolAsignado?: string; 
    error?: string 
  }> {
    try {
      console.log('🔄 Sincronizando rol para usuario:', email);
      
      // 1. Buscar el usuario en dirigentes_autorizados
      const { data: autorizado, error: errorBuscar } = await supabase
        .from('dirigentes_autorizados')
        .select('role, nombre_completo')
        .eq('email', email.toLowerCase())
        .eq('activo', true)
        .single();

      if (errorBuscar || !autorizado) {
        console.log('⚠️ Usuario no encontrado en dirigentes_autorizados');
        return { success: false, error: 'Usuario no autorizado' };
      }

      const rolNombre = autorizado.role;
      console.log('📋 Rol encontrado en dirigentes_autorizados:', rolNombre);

      // 2. Buscar el rol en la tabla roles
      const { data: rol, error: errorRol } = await supabase
        .from('roles')
        .select('id')
        .eq('nombre', rolNombre)
        .single();

      if (errorRol || !rol) {
        // Intentar mapear roles legacy
        const rolMapping: Record<string, string> = {
          'grupo_admin': 'jefe_grupo',
          'admin': 'jefe_grupo'
        };
        const rolMapeado = rolMapping[rolNombre] || 'dirigente';
        
        const { data: rolAlt, error: errorRolAlt } = await supabase
          .from('roles')
          .select('id')
          .eq('nombre', rolMapeado)
          .single();
          
        if (errorRolAlt || !rolAlt) {
          console.error('❌ Rol no encontrado:', rolNombre, 'ni alternativo:', rolMapeado);
          return { success: false, error: 'Rol no encontrado en el sistema' };
        }
        
        // Usar rol alternativo
        const { error: errorInsert } = await supabase
          .from('usuario_roles')
          .insert({
            user_id: userId,
            rol_id: rolAlt.id,
            activo: true,
            notas: `Rol sincronizado automáticamente desde dirigentes_autorizados (${rolNombre} → ${rolMapeado})`
          });

        if (errorInsert) {
          // Puede que ya exista
          if (errorInsert.code !== '23505') {
            console.error('❌ Error insertando rol:', errorInsert);
            return { success: false, error: errorInsert.message };
          }
        }

        console.log('✅ Rol alternativo asignado:', rolMapeado);
        return { success: true, rolAsignado: rolMapeado };
      }

      // 3. Insertar en usuario_roles
      const { error: errorInsert } = await supabase
        .from('usuario_roles')
        .insert({
          user_id: userId,
          rol_id: rol.id,
          activo: true,
          notas: 'Rol sincronizado automáticamente desde dirigentes_autorizados'
        });

      if (errorInsert) {
        // Código 23505 = duplicate key (ya existe)
        if (errorInsert.code === '23505') {
          console.log('ℹ️ El rol ya estaba asignado');
          return { success: true, rolAsignado: rolNombre };
        }
        console.error('❌ Error insertando rol:', errorInsert);
        return { success: false, error: errorInsert.message };
      }

      // 4. Invalidar cache
      this.permisosCache.delete(userId);
      this.lastCacheTime.delete(userId);

      console.log('✅ Rol sincronizado correctamente:', rolNombre);
      return { success: true, rolAsignado: rolNombre };
    } catch (error: any) {
      console.error('❌ Error en sincronizarRolDesdeAutorizado:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }
}

// ================================================================
// TIPOS ADICIONALES
// ================================================================

export interface PermisoAccion {
  tiene: boolean;
  permiso_id: string | null;
}

export interface ModuloPermisos {
  modulo: Modulo;
  acciones: {
    leer: PermisoAccion;
    ver_detalle: PermisoAccion;
    crear: PermisoAccion;
    editar: PermisoAccion;
    eliminar: PermisoAccion;
    exportar: PermisoAccion;
  };
}

export interface MatrizPermisoRol {
  rol_id: string;
  rol_nombre: string;
  matriz: ModuloPermisos[];
}

export default PermissionsService;
