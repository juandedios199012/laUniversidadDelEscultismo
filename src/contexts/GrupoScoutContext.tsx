import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// ================================================================
// CONTEXTO DE GRUPO SCOUT ACTIVO
// Maneja el grupo scout del usuario autenticado
// ================================================================

interface GrupoScout {
  id: string;
  nombre: string;
  numeral: string;
  localidad: string;
  region: string;
  codigo_grupo: string;
}

interface GrupoScoutContextType {
  grupoActivo: GrupoScout | null;
  userRole: string | null;
  loading: boolean;
  error: string | null;
  refreshGrupo: () => Promise<void>;
  hasAccess: (requiredRole?: string) => boolean;
}

const GrupoScoutContext = createContext<GrupoScoutContextType | undefined>(undefined);

interface GrupoScoutProviderProps {
  children: ReactNode;
}

export const GrupoScoutProvider: React.FC<GrupoScoutProviderProps> = ({ children }) => {
  const [grupoActivo, setGrupoActivo] = useState<GrupoScout | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserGrupo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Cargando grupo del usuario...');
      
      // Verificar si hay usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('❌ No hay usuario autenticado');
        setGrupoActivo(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      console.log('👤 Usuario autenticado:', user.email);

      // Obtener grupo del usuario con información completa
      const { data: userGrupoData, error: grupoError } = await supabase
        .from('user_grupo_scout')
        .select(`
          role,
          activo,
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

      if (grupoError) {
        if (grupoError.code === 'PGRST116') {
          // No se encontró grupo para el usuario
          console.log('⚠️ Usuario no asignado a ningún grupo scout');
          setGrupoActivo(null);
          setUserRole(null);
          setError('No tienes un grupo scout asignado. Contacta al administrador.');
        } else {
          throw grupoError;
        }
        setLoading(false);
        return;
      }

      if (!userGrupoData?.grupos_scout) {
        console.log('⚠️ Datos de grupo incompletos');
        setError('Error al cargar información del grupo scout');
        setLoading(false);
        return;
      }

      const grupo = userGrupoData.grupos_scout as unknown as GrupoScout;
      
      console.log('✅ Grupo cargado:', grupo.nombre);
      console.log('👔 Rol del usuario:', userGrupoData.role);

      setGrupoActivo(grupo);
      setUserRole(userGrupoData.role);
      
    } catch (error) {
      console.error('❌ Error al cargar grupo del usuario:', error);
      setError('Error al cargar información del grupo scout');
      setGrupoActivo(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshGrupo = async () => {
    await loadUserGrupo();
  };

  const hasAccess = (requiredRole?: string) => {
    if (!grupoActivo || !userRole) return false;
    
    // Jerarquía de roles (de menor a mayor privilegio)
    const roleHierarchy = ['colaborador', 'dirigente', 'admin', 'super_admin'];
    
    if (!requiredRole) return true; // Solo requiere estar autenticado con grupo
    
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    
    return userRoleIndex >= requiredRoleIndex;
  };

  // Cargar grupo al montar el componente
  useEffect(() => {
    loadUserGrupo();
  }, []);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, _session) => {
      console.log('🔄 Cambio de estado de auth:', event);
      
      if (event === 'SIGNED_IN') {
        await loadUserGrupo();
      } else if (event === 'SIGNED_OUT') {
        setGrupoActivo(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: GrupoScoutContextType = {
    grupoActivo,
    userRole,
    loading,
    error,
    refreshGrupo,
    hasAccess
  };

  return (
    <GrupoScoutContext.Provider value={value}>
      {children}
    </GrupoScoutContext.Provider>
  );
};

// Hook para usar el contexto
export const useGrupoScout = (): GrupoScoutContextType => {
  const context = useContext(GrupoScoutContext);
  if (!context) {
    throw new Error('useGrupoScout debe usarse dentro de GrupoScoutProvider');
  }
  return context;
};

// Hook para verificar acceso
export const useRequireGrupo = (requiredRole?: string) => {
  const { grupoActivo, userRole, loading, hasAccess } = useGrupoScout();
  
  const canAccess = hasAccess(requiredRole);
  
  return {
    grupoActivo,
    userRole,
    loading,
    canAccess,
    hasGrupo: !!grupoActivo
  };
};

// Componente para proteger rutas
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  fallback 
}) => {
  const { grupoActivo, loading, hasAccess, error } = useGrupoScout();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Error de acceso</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!grupoActivo) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-yellow-600 text-lg font-medium mb-2">Grupo Scout no asignado</div>
          <div className="text-gray-600">Contacta al administrador para que te asigne a un grupo scout</div>
        </div>
      </div>
    );
  }

  if (!hasAccess(requiredRole)) {
    return fallback || (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Acceso denegado</div>
          <div className="text-gray-600">No tienes permisos suficientes para acceder a esta sección</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default GrupoScoutProvider;