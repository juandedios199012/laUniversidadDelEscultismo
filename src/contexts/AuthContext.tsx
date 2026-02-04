import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, AuthUser } from '../services/authService';

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
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar sesión al cargar y escuchar cambios de autenticación
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🔍 Verificando sesión existente...');
        
        // Obtener sesión directamente de Supabase sin consultas adicionales
        const { data: { session } } = await import('../lib/supabase').then(m => m.supabase.auth.getSession());
        
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
    let subscription: { unsubscribe: () => void } | null = null;
    
    import('../lib/supabase').then(({ supabase }) => {
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
      subscription = data.subscription;
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
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