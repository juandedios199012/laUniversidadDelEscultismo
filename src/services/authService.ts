import { supabase } from '../lib/supabase';

export type AuthProvider = 'google' | 'magic-link' | 'email-password';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  grupo_scout_id?: string;
  role?: 'dirigente' | 'grupo_admin' | 'super_admin';
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
          redirectTo: `${window.location.origin}/auth/callback`,
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

      // Verificar si es dirigente autorizado
      const isAuthorized = await this.checkAuthorizedDirector(email);
      if (!isAuthorized.authorized) {
        if (isAuthorized.requiresApproval) {
          await this.requestAccess(email);
          return { 
            success: false, 
            error: 'Tu email no está autorizado. Se ha enviado una solicitud de acceso.',
            requiresApproval: true 
          };
        }
        return { success: false, error: 'Email no autorizado para acceder al sistema' };
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            grupo_scout_id: isAuthorized.grupo_scout_id
          }
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
   * 🔑 Email + Password (FALLBACK para casos especiales)
   */
  static async signInWithPassword(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🔑 Login con email/password:', email);

      // Validar dirigente autorizado
      const isAuthorized = await this.checkAuthorizedDirector(email);
      if (!isAuthorized.authorized) {
        return { success: false, error: 'Email no autorizado para acceder al sistema' };
      }

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

      // Validar dirigente autorizado
      const isAuthorized = await this.checkAuthorizedDirector(email);
      if (!isAuthorized.authorized) {
        return { success: false, error: 'Solo dirigentes autorizados pueden registrarse' };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            grupo_scout_id: isAuthorized.grupo_scout_id
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
   * 🔍 Verificar si es dirigente autorizado
   */
  private static async checkAuthorizedDirector(email: string): Promise<{
    authorized: boolean;
    grupo_scout_id?: string;
    role?: string;
    requiresApproval?: boolean;
  }> {
    try {
      // TODO: Esta query necesita la tabla dirigentes_autorizados que crearemos
      const { data, error } = await supabase
        .from('dirigentes_autorizados')
        .select('grupo_scout_id, role, activo')
        .eq('email', email.toLowerCase())
        .eq('activo', true)
        .single();

      if (error || !data) {
        console.log('📋 Email no está en lista de dirigentes autorizados:', email);
        return { authorized: false, requiresApproval: true };
      }

      return {
        authorized: true,
        grupo_scout_id: data.grupo_scout_id,
        role: data.role
      };

    } catch (error) {
      console.error('❌ Error verificando dirigente autorizado:', error);
      return { authorized: false };
    }
  }

  /**
   * 📨 Solicitar acceso para email no autorizado
   */
  private static async requestAccess(email: string): Promise<void> {
    try {
      // TODO: Crear tabla solicitudes_acceso
      await supabase
        .from('solicitudes_acceso')
        .insert([{
          email: email.toLowerCase(),
          estado: 'pendiente',
          fecha_solicitud: new Date().toISOString()
        }]);

      console.log('✅ Solicitud de acceso creada para:', email);

    } catch (error) {
      console.error('❌ Error creando solicitud de acceso:', error);
    }
  }

  /**
   * 👤 Construir objeto AuthUser desde usuario de Supabase
   */
  private static async buildAuthUser(user: any): Promise<AuthUser> {
    // Obtener datos adicionales del dirigente
    const dirigenteData = await this.getDirigenteData(user.email);

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || dirigenteData?.nombre_completo,
      avatar_url: user.user_metadata?.avatar_url,
      grupo_scout_id: dirigenteData?.grupo_scout_id,
      role: dirigenteData?.role || 'dirigente'
    };
  }

  /**
   * 📊 Obtener datos adicionales del dirigente
   */
  private static async getDirigenteData(email: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('dirigentes_autorizados')
        .select(`
          grupo_scout_id,
          role,
          nombre_completo,
          grupos_scout (
            id,
            nombre,
            numeral,
            localidad
          )
        `)
        .eq('email', email.toLowerCase())
        .eq('activo', true)
        .single();

      if (error || !data) return null;

      return data;

    } catch (error) {
      console.error('❌ Error obteniendo datos del dirigente:', error);
      return null;
    }
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