import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, AuthUser } from '../services/authService';
import { supabase } from '../lib/supabase';
import { shouldSkipAuth, DEV_USER } from '../config/dev';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string; requiresApproval?: boolean }>;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithPassword: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  sendOtpCode: (email: string) => Promise<{ success: boolean; error?: string; requiresApproval?: boolean }>;
  verifyOtpCode: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  console.log('🔐 AuthProvider inicializando...');
  
  // Si estamos en modo dev sin auth, usar usuario mock inmediatamente
  const skipAuth = shouldSkipAuth();
  const [user, setUser] = useState<AuthUser | null>(skipAuth ? DEV_USER : null);
  const [loading, setLoading] = useState(!skipAuth);

  // Log de modo desarrollo
  if (skipAuth) {
    console.log('🔓 DEV: Autenticación saltada en localhost, usando usuario mock');
  }

  // Verificar sesión al cargar y escuchar cambios de autenticación
  useEffect(() => {
    // Si saltamos auth, no hacer nada
    if (skipAuth) return;
    
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🔍 Verificando sesión existente...');
        
        // Detectar si venimos de un magic link o OAuth callback
        // El hash contiene el token cuando se redirige desde email/OAuth
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        // También verificar query params (algunos proveedores usan esto)
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');
        
        if (accessToken && refreshToken) {
          console.log('🔑 Detectado token de magic link en URL, estableciendo sesión...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('❌ Error estableciendo sesión desde magic link:', error);
          } else if (data.session?.user) {
            console.log('✅ Sesión establecida desde magic link');
            // Limpiar el hash del URL sin recargar la página
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else if (code) {
          console.log('🔑 Detectado código OAuth en URL, intercambiando...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('❌ Error intercambiando código OAuth:', error);
          } else {
            console.log('✅ Sesión establecida desde código OAuth');
            // Limpiar el query param del URL sin recargar la página
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
        
        // Obtener sesión directamente de Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          const authUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email,
            avatar_url: session.user.user_metadata?.avatar_url,
          };
          setUser(authUser);
          console.log('✅ Usuario actual:', authUser.email);
        } else {
          console.log('✅ No hay sesión activa');
        }
      } catch (error) {
        console.error('❌ Error verificando sesión:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Escuchar cambios de autenticación (login/logout)
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'Logged out');
        if (session?.user) {
          const authUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email,
            avatar_url: session.user.user_metadata?.avatar_url,
          };
          setUser(authUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const result = await AuthService.signInWithGoogle();
    if (!result.success && result.error) {
      throw new Error(result.error);
    }
  };

  const signInWithMagicLink = async (email: string) => {
    return await AuthService.signInWithMagicLink(email);
  };

  const signInWithPassword = async (email: string, password: string) => {
    const result = await AuthService.signInWithPassword(email, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return { success: result.success, error: result.error };
  };

  const signUpWithPassword = async (email: string, password: string, fullName: string) => {
    const result = await AuthService.signUpWithPassword(email, password, fullName);
    return { success: result.success, error: result.error };
  };

  const sendOtpCode = async (email: string) => {
    const result = await AuthService.sendOtpCode(email);
    return { success: result.success, error: result.error, requiresApproval: result.requiresApproval };
  };

  const verifyOtpCode = async (email: string, token: string) => {
    const result = await AuthService.verifyOtpCode(email, token);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return { success: result.success, error: result.error };
  };

  const signOut = async () => {
    const result = await AuthService.signOut();
    if (result.success) {
      setUser(null);
    } else if (result.error) {
      throw new Error(result.error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signInWithMagicLink,
    signInWithPassword,
    signUpWithPassword,
    sendOtpCode,
    verifyOtpCode,
    signOut,
  };

  console.log('✅ AuthProvider renderizando children con valores:', { user, loading });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}