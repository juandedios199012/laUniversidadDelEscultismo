import { useState } from 'react';
import { X, UserPlus, CreditCard, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { SeguridadService } from '../../../services/seguridadService';
import ScoutService from '../../../services/scoutService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUsuarioCreado: () => void;
}

interface FamiliarEncontrado {
  nombres: string;
  apellidos: string;
  es_familiar_de: Array<{ scout_id: string; scout_nombre: string; parentesco: string }>;
}

function generarPassword(): string {
  // Contraseña temporal legible, el padre puede cambiarla luego.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function CrearAccesoPadreDialog({ isOpen, onClose, onUsuarioCreado }: Props) {
  const [dni, setDni] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [password, setPassword] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [familiar, setFamiliar] = useState<FamiliarEncontrado | null>(null);
  const [dniVerificado, setDniVerificado] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const buscarFamiliar = async () => {
    const value = dni.trim();
    if (value.length < 8) {
      setFamiliar(null);
      setDniVerificado(null);
      return;
    }
    setBuscando(true);
    setError(null);
    try {
      const resultado = await ScoutService.buscarPersonaPorDocumento('DNI', value);
      if (resultado.existe) {
        setFamiliar({
          nombres: resultado.nombres || '',
          apellidos: resultado.apellidos || '',
          es_familiar_de: resultado.es_familiar_de || [],
        });
        if (!nombreCompleto.trim()) {
          setNombreCompleto(`${resultado.nombres ?? ''} ${resultado.apellidos ?? ''}`.trim());
        }
      } else {
        setFamiliar(null);
      }
      setDniVerificado(value);
    } finally {
      setBuscando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (dni.trim().length < 8) {
      setError('Ingresa un DNI válido');
      return;
    }
    if (!nombreCompleto.trim()) {
      setError('El nombre completo es requerido');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setGuardando(true);
    const resultado = await SeguridadService.crearAccesoPadre(dni, nombreCompleto, password);
    setGuardando(false);

    if (resultado.success) {
      setExito(true);
      setTimeout(() => {
        onUsuarioCreado();
        handleClose();
      }, 2000);
    } else {
      setError(resultado.error || 'Error al crear el acceso');
    }
  };

  const handleClose = () => {
    setDni('');
    setNombreCompleto('');
    setPassword('');
    setFamiliar(null);
    setDniVerificado(null);
    setError(null);
    setExito(false);
    onClose();
  };

  if (!isOpen) return null;

  const dniSinVerificarONoEncontrado = dniVerificado === dni.trim() && !familiar && dni.trim().length >= 8;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Crear Acceso de Padre</h2>
              <p className="text-sm text-gray-500">Portal de Padres — inicia sesión con DNI, no con correo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* DNI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              DNI del Padre/Tutor <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={dni}
                onChange={(e) => { setDni(e.target.value.replace(/\D/g, '').slice(0, 20)); setFamiliar(null); setDniVerificado(null); }}
                onBlur={buscarFamiliar}
                placeholder="Ej: 12345678"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                disabled={guardando || exito}
              />
              {buscando && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Debe ser el mismo DNI registrado como familiar en la ficha del hijo (paso "Familiares")
            </p>
            {familiar && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                <p className="font-medium">{familiar.nombres} {familiar.apellidos}</p>
                {familiar.es_familiar_de.length > 0 && (
                  <p className="text-green-700 mt-0.5">
                    Familiar de: {familiar.es_familiar_de.map(f => f.scout_nombre).join(', ')}
                  </p>
                )}
              </div>
            )}
            {dniSinVerificarONoEncontrado && (
              <div className="mt-2 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No se encontró ningún familiar con este DNI. Regístralo primero en la ficha del scout.</span>
              </div>
            )}
          </div>

          {/* Nombre Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Juan Pérez González"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              disabled={guardando || exito}
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña temporal <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-24 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                disabled={guardando || exito}
              />
              <button
                type="button"
                onClick={() => setPassword(generarPassword())}
                disabled={guardando || exito}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
              >
                Generar
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Compártela con el padre por un medio seguro; puede cambiarla luego desde su cuenta
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {exito && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">¡Acceso creado! El padre ya puede entrar con su DNI y esta contraseña.</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || exito}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {guardando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando...
                </>
              ) : exito ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  ¡Listo!
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Crear Acceso
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
