import { useState, useEffect } from 'react';
import { X, UserPlus, CreditCard, Mail, Lock, AlertCircle, CheckCircle, Loader2, Check } from 'lucide-react';
import { SeguridadService } from '../../../services/seguridadService';
import { PermissionsService, Rol } from '../../../services/permissionsService';
import ScoutService from '../../../services/scoutService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUsuarioCreado: () => void;
}

type TipoIdentificador = 'dni' | 'email';

interface PersonaEncontrada {
  nombres: string;
  apellidos: string;
  es_familiar_de: Array<{ scout_id: string; scout_nombre: string; parentesco: string }>;
}

function generarPassword(): string {
  // Contraseña temporal legible, el usuario puede cambiarla luego.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const getNivelInfo = (nivel: number) => {
  if (nivel >= 90) return { badge: 'Crítico', color: 'bg-red-100 text-red-700' };
  if (nivel >= 70) return { badge: 'Elevado', color: 'bg-purple-100 text-purple-700' };
  if (nivel >= 50) return { badge: 'Medio', color: 'bg-blue-100 text-blue-700' };
  if (nivel >= 30) return { badge: 'Básico', color: 'bg-green-100 text-green-700' };
  return { badge: 'Limitado', color: 'bg-gray-100 text-gray-700' };
};

export default function CrearUsuarioClaveDialog({ isOpen, onClose, onUsuarioCreado }: Props) {
  const [tipo, setTipo] = useState<TipoIdentificador>('dni');
  const [identificador, setIdentificador] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [rolesSeleccionados, setRolesSeleccionados] = useState<string[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [personaEncontrada, setPersonaEncontrada] = useState<PersonaEncontrada | null>(null);
  const [dniVerificado, setDniVerificado] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarRoles();
    }
  }, [isOpen]);

  const cargarRoles = async () => {
    setLoadingRoles(true);
    const data = await PermissionsService.listarRoles();
    setRoles(data);
    setLoadingRoles(false);
  };

  const toggleRol = (rolId: string) => {
    setRolesSeleccionados((prev) =>
      prev.includes(rolId) ? prev.filter((id) => id !== rolId) : [...prev, rolId],
    );
  };

  const buscarPorDni = async () => {
    const value = identificador.trim();
    if (tipo !== 'dni' || value.length < 8) {
      setPersonaEncontrada(null);
      setDniVerificado(null);
      return;
    }
    setBuscando(true);
    setError(null);
    try {
      const resultado = await ScoutService.buscarPersonaPorDocumento('DNI', value);
      if (resultado.existe) {
        setPersonaEncontrada({
          nombres: resultado.nombres || '',
          apellidos: resultado.apellidos || '',
          es_familiar_de: resultado.es_familiar_de || [],
        });
        if (!nombreCompleto.trim()) {
          setNombreCompleto(`${resultado.nombres ?? ''} ${resultado.apellidos ?? ''}`.trim());
        }
      } else {
        setPersonaEncontrada(null);
      }
      setDniVerificado(value);
    } finally {
      setBuscando(false);
    }
  };

  const cambiarTipo = (nuevoTipo: TipoIdentificador) => {
    setTipo(nuevoTipo);
    setIdentificador('');
    setPersonaEncontrada(null);
    setDniVerificado(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(false);

    const value = identificador.trim();
    if (tipo === 'dni' && value.length < 8) {
      setError('Ingresa un DNI válido');
      return;
    }
    if (tipo === 'email' && !value.includes('@')) {
      setError('El correo electrónico no es válido');
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
    if (rolesSeleccionados.length === 0) {
      setError('Selecciona al menos un rol');
      return;
    }

    setGuardando(true);
    const resultado = await SeguridadService.crearUsuarioConClave(tipo, value, nombreCompleto, password, rolesSeleccionados);
    setGuardando(false);

    if (resultado.success) {
      setExito(true);
      setTimeout(() => {
        onUsuarioCreado();
        handleClose();
      }, 2000);
    } else {
      setError(resultado.error || 'Error al crear el usuario');
    }
  };

  const handleClose = () => {
    setTipo('dni');
    setIdentificador('');
    setNombreCompleto('');
    setPassword('');
    setRolesSeleccionados([]);
    setPersonaEncontrada(null);
    setDniVerificado(null);
    setError(null);
    setExito(false);
    onClose();
  };

  if (!isOpen) return null;

  const dniNoEncontrado = tipo === 'dni' && dniVerificado === identificador.trim() && !personaEncontrada && identificador.trim().length >= 8;

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
              <h2 className="text-lg font-semibold text-gray-900">Crear Usuario</h2>
              <p className="text-sm text-gray-500">Tú defines la clave — no se envía ningún correo</p>
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
          {/* Tipo de acceso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              El usuario entrará con...
            </label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => cambiarTipo('dni')}
                disabled={guardando || exito}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  tipo === 'dni' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Su DNI
              </button>
              <button
                type="button"
                onClick={() => cambiarTipo('email')}
                disabled={guardando || exito}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  tipo === 'email' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail className="w-4 h-4" />
                Su correo
              </button>
            </div>
          </div>

          {/* Identificador (DNI o correo) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {tipo === 'dni' ? 'DNI' : 'Correo electrónico'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {tipo === 'dni' ? (
                <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              ) : (
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              )}
              <input
                type={tipo === 'email' ? 'email' : 'text'}
                value={identificador}
                onChange={(e) => {
                  const value = tipo === 'dni' ? e.target.value.replace(/\D/g, '').slice(0, 20) : e.target.value;
                  setIdentificador(value);
                  setPersonaEncontrada(null);
                  setDniVerificado(null);
                }}
                onBlur={tipo === 'dni' ? buscarPorDni : undefined}
                placeholder={tipo === 'dni' ? 'Ej: 12345678' : 'nombre@correo.com'}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                disabled={guardando || exito}
              />
              {tipo === 'dni' && buscando && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
            {tipo === 'dni' && (
              <p className="mt-1 text-xs text-gray-500">
                Si va a ser Padre/Tutor, debe ser el mismo DNI registrado en la ficha del hijo (paso "Familiares")
              </p>
            )}
            {personaEncontrada && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                <p className="font-medium">{personaEncontrada.nombres} {personaEncontrada.apellidos}</p>
                {personaEncontrada.es_familiar_de.length > 0 && (
                  <p className="text-green-700 mt-0.5">
                    Familiar de: {personaEncontrada.es_familiar_de.map(f => f.scout_nombre).join(', ')}
                  </p>
                )}
              </div>
            )}
            {dniNoEncontrado && (
              <div className="mt-2 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No se encontró a nadie con este DNI en el sistema. Si es un familiar, regístralo primero en la ficha del scout.</span>
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
              Compártela por un medio seguro; el usuario puede cambiarla luego desde su cuenta
            </p>
          </div>

          {/* Roles (multi-selección) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Roles <span className="text-red-500">*</span>
              <span className="ml-1 text-gray-400 font-normal">(puedes elegir más de uno)</span>
            </label>
            {loadingRoles ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Cargando roles...
              </div>
            ) : roles.length === 0 ? (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                <p>No hay roles disponibles.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {roles.map((rol) => {
                  const nivelInfo = getNivelInfo(rol.nivel_jerarquia);
                  const isSelected = rolesSeleccionados.includes(rol.id);
                  return (
                    <label
                      key={rol.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      } ${(guardando || exito) ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRol(rol.id)}
                        className="sr-only"
                        disabled={guardando || exito}
                      />
                      <div
                        className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-green-500' : 'border border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ backgroundColor: rol.color }}
                      >
                        {rol.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{rol.nombre.replace(/_/g, ' ')}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${nivelInfo.color}`}>
                            {nivelInfo.badge}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{rol.descripcion}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
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
              <span className="text-sm">¡Usuario creado! Ya puede entrar con {tipo === 'dni' ? 'su DNI' : 'su correo'} y esta contraseña.</span>
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
                  Crear Usuario
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
