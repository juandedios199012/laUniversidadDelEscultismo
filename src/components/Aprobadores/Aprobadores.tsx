import React, { useCallback, useEffect, useState } from 'react';
import { Check, Edit2, Plus, Trash2, UserCheck, X } from 'lucide-react';
import { Aprobador, AprobadoresService } from '../../services/aprobadoresService';
import { usePermissions } from '../../contexts/PermissionsContext';

interface ModalAprobadorProps {
  aprobadorEditar: Aprobador | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

const ModalAprobador: React.FC<ModalAprobadorProps> = ({ aprobadorEditar, onCerrar, onGuardado }) => {
  const [nombreCompleto, setNombreCompleto] = useState(aprobadorEditar?.nombre_completo ?? '');
  const [cargo, setCargo] = useState(aprobadorEditar?.cargo ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEdicion = !!aprobadorEditar;

  const guardar = async () => {
    if (!nombreCompleto.trim()) {
      setError('El nombre completo es obligatorio');
      return;
    }
    if (!cargo.trim()) {
      setError('El cargo es obligatorio');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await AprobadoresService.guardar({
        id: aprobadorEditar?.id ?? null,
        nombre_completo: nombreCompleto.trim(),
        cargo: cargo.trim(),
      });
      onGuardado();
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {esEdicion ? 'Editar Aprobador' : 'Nuevo Aprobador'}
          </h3>
          <button type="button" onClick={onCerrar} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          className="p-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Ej: Juan Pérez García"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cargo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ej: Comisionado Local"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </form>

        <div className="flex justify-end gap-3 p-5 border-t">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:bg-gray-300"
          >
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Aprobador'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Aprobadores: React.FC = () => {
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermissions();
  const [aprobadores, setAprobadores] = useState<Aprobador[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [aprobadorEditar, setAprobadorEditar] = useState<Aprobador | null>(null);

  const cargarAprobadores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAprobadores(await AprobadoresService.listar());
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarAprobadores();
  }, [cargarAprobadores]);

  const eliminar = async (aprobador: Aprobador) => {
    if (!window.confirm(`¿Eliminar a "${aprobador.nombre_completo}"?`)) return;

    setError(null);
    setSuccess(null);
    try {
      await AprobadoresService.eliminar(aprobador.id);
      setSuccess('Aprobador eliminado');
      setTimeout(() => setSuccess(null), 4000);
      await cargarAprobadores();
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <UserCheck className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aprobadores</h1>
          <p className="text-sm text-gray-500">
            Destinatarios del Anexo 1 (Solicitud de Aprobación de Actividad), ej. el Comisionado Local.
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

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Registro</h2>
          {puedeCrear('aprobadores') && (
            <button
              type="button"
              onClick={() => {
                setAprobadorEditar(null);
                setMostrarModal(true);
              }}
              className="flex items-center gap-1.5 text-sm px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            >
              <Plus className="h-4 w-4" />
              Nuevo Aprobador
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mr-3" />
            Cargando aprobadores...
          </div>
        ) : aprobadores.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <UserCheck className="mx-auto h-10 w-10 mb-3 opacity-30" />
            <p>No hay aprobadores aún</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="text-left py-2 px-4">Nombre Completo</th>
                <th className="text-left py-2 px-4">Cargo</th>
                <th className="text-right py-2 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {aprobadores.map((aprobador) => (
                <tr key={aprobador.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{aprobador.nombre_completo}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{aprobador.cargo}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      {puedeEditar('aprobadores') && (
                        <button
                          type="button"
                          onClick={() => {
                            setAprobadorEditar(aprobador);
                            setMostrarModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      {puedeEliminar('aprobadores') && (
                        <button
                          type="button"
                          onClick={() => eliminar(aprobador)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {mostrarModal && (
        <ModalAprobador
          aprobadorEditar={aprobadorEditar}
          onCerrar={() => setMostrarModal(false)}
          onGuardado={() => {
            setMostrarModal(false);
            cargarAprobadores();
          }}
        />
      )}
    </div>
  );
};

export default Aprobadores;
