import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginWithOtpProps {
  onSuccess: () => void;
}

export default function LoginWithOtp({ onSuccess }: LoginWithOtpProps) {
  const { sendOtpCode, verifyOtpCode } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown para reenvío
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico');
      return;
    }
    setLoading(true);
    setError('');
    const result = await sendOtpCode(email);
    if (result.error) {
      setError(result.error);
    } else {
      setStep('code');
      setCountdown(60);
      // Focus en primer input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Solo números
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verificar si todos los dígitos están completos
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      handleVerifyOtp(pastedData);
    }
  };

  const handleVerifyOtp = async (token?: string) => {
    const code = token || otp.join('');
    if (code.length !== 6) {
      setError('Ingresa los 6 dígitos');
      return;
    }
    setLoading(true);
    setError('');
    const result = await verifyOtpCode(email, code);
    if (result.error) {
      setError(result.error);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } else {
      onSuccess();
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    await handleSendOtp();
  };

  return (
    <form 
      className="space-y-4" 
      onSubmit={e => e.preventDefault()}
    >
      {step === 'email' ? (
        <>
          <div>
            <label htmlFor="otp-email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input 
              id="otp-email"
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              placeholder="dirigente@ejemplo.com"
              autoComplete="email" 
              required 
              disabled={loading}
              onKeyDown={e => { if (e.key === 'Enter' && !loading) handleSendOtp(); }}
            />
          </div>

          <p className="text-sm text-gray-500">
            Te enviaremos un código de 6 dígitos a tu correo para verificar tu identidad.
          </p>

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
            onClick={handleSendOtp} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Enviar código
              </>
            )}
          </button>
        </>
      ) : (
        <>
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Revisa tu correo</h3>
            <p className="text-sm text-gray-500 mt-1">
              Enviamos un código de 6 dígitos a<br/>
              <span className="font-medium text-gray-700">{email}</span>
            </p>
          </div>

          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
                disabled={loading}
                autoFocus={index === 0}
              />
            ))}
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
            onClick={() => handleVerifyOtp()} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={loading || otp.some(d => d === '')}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verificando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verificar código
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep('email')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Cambiar correo
            </button>
          </div>

          <div className="text-center text-sm text-gray-500">
            ¿No recibiste el código?{' '}
            {countdown > 0 ? (
              <span className="text-gray-400">Reenviar en {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-blue-600 hover:underline font-medium"
                disabled={loading}
              >
                Reenviar código
              </button>
            )}
          </div>
        </>
      )}
    </form>
  );
}
