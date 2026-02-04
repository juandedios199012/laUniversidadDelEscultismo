import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { PermissionsService, Modulo, Accion, Rol, UsuarioSeguridad } from '../services/permissionsService';
import { useAuth } from './AuthContext';

// ================================================================
// TIPOS
// ================================================================

interface PermissionsContextType {
  // Estado
  seguridad: UsuarioSeguridad | null;
  loading: boolean;
  error: string | null;
  
  // Verificaciones rápidas
  tienePermiso: (modulo: Modulo, accion: Accion) => boolean;
  puedeAcceder: (modulo: Modulo) => boolean;
  puedeCrear: (modulo: Modulo) => boolean;
  puedeEditar: (modulo: Modulo) => boolean;
  puedeEliminar: (modulo: Modulo) => boolean;
  puedeExportar: (modulo: Modulo) => boolean;
  
  // Datos
  rolPrincipal: Rol | null;
  modulosAccesibles: Modulo[];
  esAdmin: boolean;
  esSuperAdmin: boolean;
  
  // Acciones
  recargarPermisos: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// ================================================================
// PROVIDER
// ================================================================

interface PermissionsProviderProps {
  children: ReactNode;
}

export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const { user } = useAuth();
  const [seguridad, setSeguridad] = useState<UsuarioSeguridad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar permisos cuando cambia el usuario
  useEffect(() => {
    const cargarPermisos = async () => {
      if (!user?.id) {
        setSeguridad(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const datos = await PermissionsService.obtenerSeguridadUsuario(user.id);
        setSeguridad(datos);
      } catch (err) {
        console.error('Error cargando permisos:', err);
        setError('No se pudieron cargar los permisos');
      } finally {
        setLoading(false);
      }
    };

    cargarPermisos();
  }, [user?.id]);

  // Recargar permisos manualmente
  const recargarPermisos = useCallback(async () => {
    if (!user?.id) return;
    
    PermissionsService.limpiarCache(user.id);
    setLoading(true);
    
    try {
      const datos = await PermissionsService.obtenerSeguridadUsuario(user.id);
      setSeguridad(datos);
      setError(null);
    } catch (err) {
      setError('Error recargando permisos');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Verificar si tiene un permiso específico
  const tienePermiso = useCallback((modulo: Modulo, accion: Accion): boolean => {
    if (!seguridad?.permisos) return false;
    return seguridad.permisos.some(p => p.modulo === modulo && p.accion === accion);
  }, [seguridad?.permisos]);

  // Helpers para acciones comunes
  const puedeAcceder = useCallback((modulo: Modulo) => tienePermiso(modulo, 'leer'), [tienePermiso]);
  const puedeCrear = useCallback((modulo: Modulo) => tienePermiso(modulo, 'crear'), [tienePermiso]);
  const puedeEditar = useCallback((modulo: Modulo) => tienePermiso(modulo, 'editar'), [tienePermiso]);
  const puedeEliminar = useCallback((modulo: Modulo) => tienePermiso(modulo, 'eliminar'), [tienePermiso]);
  const puedeExportar = useCallback((modulo: Modulo) => tienePermiso(modulo, 'exportar'), [tienePermiso]);

  // Datos derivados
  const rolPrincipal = seguridad?.rol_principal || null;
  const modulosAccesibles = seguridad?.modulos_accesibles || [];
  const esAdmin = rolPrincipal?.nivel_jerarquia ? rolPrincipal.nivel_jerarquia >= 70 : false;
  const esSuperAdmin = rolPrincipal?.nombre === 'super_admin';

  const value: PermissionsContextType = {
    seguridad,
    loading,
    error,
    tienePermiso,
    puedeAcceder,
    puedeCrear,
    puedeEditar,
    puedeEliminar,
    puedeExportar,
    rolPrincipal,
    modulosAccesibles,
    esAdmin,
    esSuperAdmin,
    recargarPermisos,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

// ================================================================
// HOOK
// ================================================================

export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions debe ser usado dentro de un PermissionsProvider');
  }
  return context;
}

// ================================================================
// HOOK SIMPLIFICADO PARA VERIFICAR UN PERMISO
// ================================================================

export function useHasPermission(modulo: Modulo, accion: Accion): boolean {
  const { tienePermiso, loading } = usePermissions();
  
  if (loading) return false;
  return tienePermiso(modulo, accion);
}

// ================================================================
// HOOK PARA VERIFICAR ACCESO A MÓDULO
// ================================================================

export function useCanAccess(modulo: Modulo): { canAccess: boolean; loading: boolean } {
  const { puedeAcceder, loading } = usePermissions();
  
  return {
    canAccess: loading ? false : puedeAcceder(modulo),
    loading
  };
}

// ================================================================
// COMPONENTE WRAPPER PARA PROTEGER CONTENIDO
// ================================================================

interface RequirePermissionProps {
  children: ReactNode;
  modulo: Modulo;
  accion?: Accion;
  fallback?: ReactNode;
}

export function RequirePermission({ 
  children, 
  modulo, 
  accion = 'leer',
  fallback = null 
}: RequirePermissionProps) {
  const { tienePermiso, loading } = usePermissions();
  
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded p-4">
        Verificando permisos...
      </div>
    );
  }
  
  if (!tienePermiso(modulo, accion)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// ================================================================
// COMPONENTE PARA MOSTRAR MENSAJE DE ACCESO DENEGADO
// ================================================================

interface AccesoDenegadoProps {
  modulo?: string;
  mensaje?: string;
}

export function AccesoDenegado({ modulo, mensaje }: AccesoDenegadoProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
      <p className="text-gray-600 max-w-md">
        {mensaje || `No tienes permisos para acceder ${modulo ? `al módulo de ${modulo}` : 'a esta sección'}.`}
      </p>
      <p className="text-sm text-gray-500 mt-4">
        Contacta al administrador si crees que deberías tener acceso.
      </p>
    </div>
  );
}

export default PermissionsProvider;
