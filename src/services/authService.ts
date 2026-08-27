import { supabase } from '../lib/supabase';

export type AuthProvider = 'google' | 'magic-link' | 'email-password';

/**
 * Devuelve la URL de redirección para auth callbacks.
 * Usa VITE_APP_URL cuando está configurado (recomendado en producción y cuando
 * los magic links deben apuntar a una URL pública, no a localhost).
 * Fallback a window.location.origin para desarrollo local.
 */
function getRedirectUrl(): string {
  const appUrl = import.meta.env.VITE_APP_URL;
  const base = appUrl ? appUrl.replace(/\/$/, '') : window.location.origin;
  return `${base}/auth/callback`;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
  requiresApproval?: boolean;
}

/**
 * 🔐 SERVICIO DE AUTENTICACIÓN PARA DIRIGENTES SCOUT
 * 
 * Maneja autenticación multi-provider optimizada para dirigentes:
 * 1. Google OAuth (principal)
 * 2. Magic Links (secundaria) 
 * 3. Email/Password (fallback)
 */
export class AuthService {

  /**
   * 🔵 Login con Google (OPCIÓN PRINCIPAL para dirigentes)
   */
  static async signInWithGoogle(): Promise<AuthResponse> {
    try {
      console.log('🔵 Iniciando login con Google...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('❌ Error en Google OAuth:', error);
        return { success: false, error: error.message };
      }

      // El redirect manejará el resto
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error inesperado en Google login:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido en Google login' 
      };
    }
  }

  /**
   * 📧 Magic Link (OPCIÓN SECUNDARIA para emails no-Gmail)
   */
  static async signInWithMagicLink(email: string): Promise<AuthResponse> {
    try {
      console.log('📧 Enviando Magic Link a:', email);

      // Validar email format
      if (!this.isValidEmail(email)) {
        return { success: false, error: 'Email no válido' };
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getRedirectUrl()
        }
      });

      if (error) {
        console.error('❌ Error enviando Magic Link:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Magic Link enviado exitosamente');
      return { success: true };

    } catch (error) {
      console.error('❌ Error inesperado en Magic Link:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error enviando magic link' 
      };
    }
  }

  /**
   * 🔢 Enviar código OTP por correo (6 dígitos)
   */
  static async sendOtpCode(email: string): Promise<AuthResponse> {
    try {
      console.log('🔢 Enviando código OTP a:', email);

      if (!this.isValidEmail(email)) {
        return { success: false, error: 'Email no válido' };
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          // NO incluir emailRedirectTo para que envíe código OTP en lugar de magic link
        }
      });

      if (error) {
        console.error('❌ Error enviando código OTP:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Código OTP enviado exitosamente');
      return { success: true };

    } catch (error) {
      console.error('❌ Error inesperado en OTP:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error enviando código OTP' 
      };
    }
  }

  /**
   * ✅ Verificar código OTP
   */
  static async verifyOtpCode(email: string, token: string): Promise<AuthResponse> {
    try {
      console.log('✅ Verificando código OTP para:', email);

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (error) {
        console.error('❌ Error verificando OTP:', error);
        return { success: false, error: 'Código incorrecto o expirado' };
      }

      if (!data.user) {
        return { success: false, error: 'No se pudo verificar el código' };
      }

      const authUser = await this.buildAuthUser(data.user);
      console.log('✅ Verificación OTP exitosa:', authUser.email);
      
      return { success: true, user: authUser };

    } catch (error) {
      console.error('❌ Error inesperado verificando OTP:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error verificando código' 
      };
    }
  }

  /**
   * 🔑 Email + Password (FALLBACK para casos especiales)
   */
  static async signInWithPassword(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🔑 Login con email/password:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Error en login:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'No se pudo autenticar al usuario' };
      }

      const authUser = await this.buildAuthUser(data.user);
      console.log('✅ Login exitoso:', authUser.email);
      
      return { success: true, user: authUser };

    } catch (error) {
      console.error('❌ Error inesperado en password login:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error en autenticación' 
      };
    }
  }

  /**
   * 📝 Registro con email/password (solo dirigentes autorizados)
   */
  static async signUpWithPassword(email: string, password: string, fullName: string): Promise<AuthResponse> {
    try {
      console.log('📝 Registro de nuevo dirigente:', email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getRedirectUrl(),
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        console.error('❌ Error en registro:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Registro exitoso - Verificar email');
      return { success: true };

    } catch (error) {
      console.error('❌ Error inesperado en registro:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error en registro' 
      };
    }
  }

  /**
   * 🚪 Logout
   */
  static async signOut(): Promise<AuthResponse> {
    try {
      console.log('🚪 Cerrando sesión...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Error cerrando sesión:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Sesión cerrada exitosamente');
      return { success: true };

    } catch (error) {
      console.error('❌ Error inesperado en logout:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error cerrando sesión' 
      };
    }
  }

  /**
   * 👤 Obtener usuario actual
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      return await this.buildAuthUser(user);

    } catch (error) {
      console.error('❌ Error obteniendo usuario actual:', error);
      return null;
    }
  }

  /**
   * 👤 Construir objeto AuthUser desde usuario de Supabase
   *
   * La identidad de negocio (nombre, roles) vive en profiles/user_roles,
   * gestionada por PermissionsContext — este método solo mapea los datos
   * ya presentes en la sesión de Supabase Auth, sin roundtrips extra.
   */
  private static async buildAuthUser(user: any): Promise<AuthUser> {
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name,
      avatar_url: user.user_metadata?.avatar_url
    };
  }

  /**
   * ✅ Validar formato de email
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 📞 Escuchar cambios de autenticación
   */
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (session?.user) {
        const authUser = await this.buildAuthUser(session.user);
        callback(authUser);
      } else {
        callback(null);
      }
    });
  }
}