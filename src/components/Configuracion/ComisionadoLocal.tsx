import React, { useEffect, useState } from 'react';
import { Check, User, X } from 'lucide-react';
import { ComisionadoLocalService } from '../../services/comisionadoLocalService';

const ComisionadoLocal: React.FC = () => {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    ComisionadoLocalService.obtener()
      .then((nombre) => setNombreCompleto(nombre || ''))
      .catch((err) => setError(err.message || 'Error inesperado'))
      .finally(() => setLoading(false));
  }, []);

  const guardar = async () => {
    if (!nombreCompleto.trim()) {
      setError('El nombre completo es obligatorio');
      return;
    }

    setGuardando(true);
    setError(null);
    setSuccess(null);
    try {
      await ComisionadoLocalService.actualizar(nombreCompleto.trim());
      setSuccess('Comisionado Local actualizado correctamente');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <User className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comisionado Local</h1>
          <p className="text-sm text-gray-500">
            Nombre que aparece en el Anexo 1 (Solicitud de Aprobación de Actividad).
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-center justify-between">
          <span className="text-red-800 text-sm">{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-800 text-sm">{success}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            disabled={loading}
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            placeholder={loading ? 'Cargando...' : 'Ej: Juan Pérez García'}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || loading}
            className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:bg-gray-300"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComisionadoLocal;
