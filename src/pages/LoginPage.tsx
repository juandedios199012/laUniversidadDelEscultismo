import { useState } from 'react';
import { Shield, Mail, Key, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type LoginMode = 'select' | 'google' | 'magic-link' | 'password' | 'signup';

export default function LoginPage() {
  const { signInWithGoogle, signInWithMagicLink, signInWithPassword, signUpWithPassword } = useAuth();
  
  const [mode, setMode] = useState<LoginMode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    text: string;
  } | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al iniciar sesión con Google'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await signInWithMagicLink(email);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: '📧 Revisa tu email y haz click en el enlace para acceder'
        });
      } else if (result.requiresApproval) {
        setMessage({
          type: 'warning',
          text: 'Tu email no está autorizado. Se ha enviado una solicitud de acceso para revisión.'
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Error enviando el enlace de acceso'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error inesperado enviando el enlace'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await signInWithPassword(email, password);
      
      if (!result.success) {
        setMessage({
          type: 'error',
          text: result.error || 'Error en el login'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error inesperado en el login'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await signUpWithPassword(email, password, fullName);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: '📧 Revisa tu email para confirmar la cuenta'
        });
        setMode('select');
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Error en el registro'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error inesperado en el registro'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => setMessage(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header Scout */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Scout Manager</h1>
          <p className="mt-2 text-sm text-gray-600">
            Portal para dirigentes de grupos scout
          </p>
        </div>

        {/* Mensajes */}
        {message && (
          <div className={`p-4 rounded-lg border ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
            message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
            message.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
            'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' && <CheckCircle className="h-5 w-5" />}
              {message.type === 'error' && <AlertCircle className="h-5 w-5" />}
              {message.type === 'warning' && <AlertCircle className="h-5 w-5" />}
              {message.type === 'info' && <Clock className="h-5 w-5" />}
              <span className="text-sm">{message.text}</span>
              <button 
                onClick={clearMessage}
                className="ml-auto text-xs opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="bg-white shadow-xl rounded-lg p-8 space-y-6">
          
          {/* Modo: Selección inicial */}
          {mode === 'select' && (
            <>
              <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
                ¿Eres dirigente de un grupo scout?
              </h2>
              
              <div className="space-y-4">
                {/* Google Login - OPCIÓN PRINCIPAL */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-5 h-5">
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <span>Continuar con Google</span>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Recomendado</span>
                </button>

                {/* Magic Link - OPCIÓN SECUNDARIA */}
                <button
                  onClick={() => setMode('magic-link')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <Mail className="h-5 w-5" />
                  <span>Usar mi email</span>
                </button>

                {/* Password - OPCIÓN DE FALLBACK */}
                <button
                  onClick={() => setMode('password')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <Key className="h-5 w-5" />
                  <span>Email y contraseña</span>
                </button>
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={() => setMode('signup')}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  ¿Primer acceso? Registrarse
                </button>
              </div>
            </>
          )}

          {/* Modo: Magic Link */}
          {mode === 'magic-link' && (
            <>
              <div className="text-center mb-6">
                <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800">Acceso con email</h2>
                <p className="text-sm text-gray-600 mt-2">
                  Te enviaremos un enlace seguro para acceder
                </p>
              </div>

              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de dirigente
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu.email@ejemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de acceso'}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="w-full py-2 px-4 text-gray-600 hover:text-gray-800"
                >
                  ← Volver a opciones
                </button>
              </form>
            </>
          )}

          {/* Modo: Password Login */}
          {mode === 'password' && (
            <>
              <div className="text-center mb-6">
                <Key className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800">Iniciar sesión</h2>
              </div>

              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Iniciando...' : 'Iniciar sesión'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode('magic-link')}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    ¿Olvidaste tu contraseña? Usar enlace por email
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="w-full py-2 px-4 text-gray-600 hover:text-gray-800"
                >
                  ← Volver a opciones
                </button>
              </form>
            </>
          )}

          {/* Modo: Registro */}
          {mode === 'signup' && (
            <>
              <div className="text-center mb-6">
                <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800">Registro de dirigente</h2>
                <p className="text-sm text-gray-600 mt-2">
                  Solo dirigentes autorizados pueden registrarse
                </p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email autorizado</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registrando...' : 'Registrarse'}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="w-full py-2 px-4 text-gray-600 hover:text-gray-800"
                >
                  ← Volver a opciones
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>La Universidad del Escultismo</p>
          <p>Portal exclusivo para dirigentes autorizados</p>
        </div>
      </div>
    </div>
  );
}