import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginWithPasswordProps {
  onSuccess: () => void;
  onSwitchToRegister?: () => void;
}

export default function LoginWithPassword({ onSuccess, onSwitchToRegister }: LoginWithPasswordProps) {
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    const result = await signInWithPassword(email, password);
    if (result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <form 
      className="space-y-4" 
      onSubmit={e => e.preventDefault()} 
      onKeyDown={e => { if (e.key === 'Enter' && !loading) handleLogin(); }}
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Correo electrónico
        </label>
        <input 
          id="email"
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
          placeholder="dirigente@ejemplo.com"
          autoComplete="email" 
          required 
          disabled={loading}
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña
        </label>
        <input 
          id="password"
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
          placeholder="••••••••"
          autoComplete="current-password" 
          required 
          disabled={loading}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <button 
        type="button" 
        onClick={handleLogin} 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        disabled={loading}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Ingresando...
          </>
        ) : 'Ingresar'}
      </button>

      {onSwitchToRegister && (
        <p className="text-center text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <button 
            type="button" 
            onClick={onSwitchToRegister}
            className="text-blue-600 hover:underline font-medium"
          >
            Regístrate aquí
          </button>
        </p>
      )}
    </form>
  );
}
