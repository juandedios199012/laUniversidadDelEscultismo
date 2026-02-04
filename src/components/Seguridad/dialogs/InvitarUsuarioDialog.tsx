import { useState } from 'react';
import { X, UserPlus, Mail, User, AlertCircle, CheckCircle } from 'lucide-react';
import { UsuariosAutorizadosService, InvitarUsuarioData } from '../../../services/usuariosAutorizadosService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUsuarioCreado: () => void;
  autorizadoPor: string;
}

const ROLES = [
  { 
    value: 'dirigente', 
    label: 'Dirigente', 
    descripcion: 'Acceso básico a módulos asignados',
    color: 'bg-blue-100 text-blue-700'
  },
  { 
    value: 'grupo_admin', 
    label: 'Administrador de Grupo', 
    descripcion: 'Puede gestionar dirigentes y configuración del grupo',
    color: 'bg-purple-100 text-purple-700'
  },
  { 
    value: 'super_admin', 
    label: 'Super Administrador', 
    descripcion: 'Acceso total al sistema',
    color: 'bg-red-100 text-red-700'
  }
];

export default function InvitarUsuarioDialog({ isOpen, onClose, onUsuarioCreado, autorizadoPor }: Props) {
  const [formData, setFormData] = useState<InvitarUsuarioData>({
    email: '',
    nombre_completo: '',
    role: 'dirigente'
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(false);

    // Validaciones
    if (!formData.email.trim()) {
      setError('El correo electrónico es requerido');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('El correo electrónico no es válido');
      return;
    }

    if (!formData.nombre_completo.trim()) {
      setError('El nombre completo es requerido');
      return;
    }

    setGuardando(true);

    const resultado = await UsuariosAutorizadosService.invitarUsuario(formData, autorizadoPor);

    setGuardando(false);

    if (resultado.success) {
      setExito(true);
      setTimeout(() => {
        onUsuarioCreado();
        handleClose();
      }, 1500);
    } else {
      setError(resultado.error || 'Error al invitar usuario');
    }
  };

  const handleClose = () => {
    setFormData({ email: '', nombre_completo: '', role: 'dirigente' });
    setError(null);
    setExito(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Invitar Usuario</h2>
              <p className="text-sm text-gray-500">Agregar nuevo dirigente autorizado</p>
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

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="dirigente@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={guardando || exito}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              El usuario podrá iniciar sesión con este correo
            </p>
          </div>

          {/* Nombre Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.nombre_completo}
                onChange={e => setFormData({ ...formData, nombre_completo: e.target.value })}
                placeholder="Juan Pérez González"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={guardando || exito}
              />
            </div>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rol <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {ROLES.map(rol => (
                <label
                  key={rol.value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.role === rol.value
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${(guardando || exito) ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={rol.value}
                    checked={formData.role === rol.value}
                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                    className="mt-0.5"
                    disabled={guardando || exito}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{rol.label}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${rol.color}`}>
                        {rol.value === 'super_admin' ? 'Crítico' : rol.value === 'grupo_admin' ? 'Elevado' : 'Básico'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{rol.descripcion}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Mensaje de éxito */}
          {exito && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">¡Usuario invitado exitosamente!</span>
            </div>
          )}

          {/* Footer */}
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {guardando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Invitando...
                </>
              ) : exito ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  ¡Listo!
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Invitar Usuario
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
