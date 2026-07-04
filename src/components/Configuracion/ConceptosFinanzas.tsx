import React, { useCallback, useEffect, useState } from 'react';
import { Check, Edit2, Plus, Trash2, Wallet, X } from 'lucide-react';
import { ConceptoFinanzas, FinanzasService } from '../../services/finanzasService';

interface ModalConceptoProps {
  conceptoEditar: ConceptoFinanzas | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

const ModalConcepto: React.FC<ModalConceptoProps> = ({ conceptoEditar, onCerrar, onGuardado }) => {
  const [descripcion, setDescripcion] = useState(conceptoEditar?.descripcion ?? '');
  const [cantidad, setCantidad] = useState(conceptoEditar?.cantidad?.toString() ?? '');
  const [fecha, setFecha] = useState(conceptoEditar?.fecha ?? new Date().toISOString().split('T')[0]);
  const [activo, setActivo] = useState(conceptoEditar?.activo ?? true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEdicion = !!conceptoEditar;

  const guardar = async () => {
    if (!descripcion.trim()) {
      setError('La descripción es obligatoria');
      return;
    }
    if (!fecha) {
      setError('La fecha es obligatoria');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const resultado = await FinanzasService.upsertConceptoFinanzas({
        id: conceptoEditar?.id ?? null,
        descripcion: descripcion.trim(),
        cantidad: cantidad.trim() ? parseInt(cantidad, 10) : undefined,
        fecha,
        activo,
      });

      if (!resultado.success) throw new Error(resultado.error || 'No se pudo guardar');
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
            {esEdicion ? 'Editar Concepto' : 'Nuevo Concepto'}
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
              Descripción <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Cuota ordinaria, Sobrante de viaje..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 p-3 border rounded-lg">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-gray-700">Activo (visible como sugerencia al registrar movimientos)</span>
          </label>

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
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Concepto'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ConceptosFinanzas: React.FC = () => {
  const [conceptos, setConceptos] = useState<ConceptoFinanzas[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [conceptoEditar, setConceptoEditar] = useState<ConceptoFinanzas | null>(null);

  const cargarConceptos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await FinanzasService.listarConceptosFinanzas(false);
      setConceptos(data);
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarConceptos();
  }, [cargarConceptos]);

  const eliminar = async (concepto: ConceptoFinanzas) => {
    if (!window.confirm(`¿Eliminar "${concepto.descripcion}"?`)) return;

    setError(null);
    setSuccess(null);
    try {
      const resultado = await FinanzasService.eliminarConceptoFinanzas(concepto.id);
      if (!resultado.success) throw new Error(resultado.error || 'No se pudo eliminar');
      setSuccess(resultado.message || 'Concepto eliminado');
      setTimeout(() => setSuccess(null), 4000);
      await cargarConceptos();
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <Wallet className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conceptos</h1>
          <p className="text-sm text-gray-500">
            Administra los conceptos usados como sugerencia al registrar movimientos en Finanzas &gt; Cuenta por Persona.
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
          <h2 className="font-semibold text-gray-900">Catálogo</h2>
          <button
            type="button"
            onClick={() => {
              setConceptoEditar(null);
              setMostrarModal(true);
            }}
            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
          >
            <Plus className="h-4 w-4" />
            Nuevo Concepto
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mr-3" />
            Cargando conceptos...
          </div>
        ) : conceptos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Wallet className="mx-auto h-10 w-10 mb-3 opacity-30" />
            <p>No hay conceptos aún</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="text-left py-2 px-4">Descripción</th>
                <th className="text-right py-2 px-4">Cantidad</th>
                <th className="text-left py-2 px-4">Fecha</th>
                <th className="text-center py-2 px-4">Activo</th>
                <th className="text-right py-2 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {conceptos.map((concepto) => (
                <tr key={concepto.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{concepto.descripcion}</td>
                  <td className="py-3 px-4 text-right text-sm text-gray-600">{concepto.cantidad ?? '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{concepto.fecha}</td>
                  <td className="py-3 px-4 text-center">
                    {concepto.activo ? (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Activo</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Inactivo</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setConceptoEditar(concepto);
                          setMostrarModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminar(concepto)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {mostrarModal && (
        <ModalConcepto
          conceptoEditar={conceptoEditar}
          onCerrar={() => setMostrarModal(false)}
          onGuardado={() => {
            setMostrarModal(false);
            cargarConceptos();
          }}
        />
      )}
    </div>
  );
};

export default ConceptosFinanzas;
