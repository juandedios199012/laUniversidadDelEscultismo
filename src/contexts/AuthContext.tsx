import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService, AuthUser } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string; requiresApproval?: boolean }>;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithPassword: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener usuario actual al cargar
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('❌ Error inicializando autenticación:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
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
    signOut,
  };

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