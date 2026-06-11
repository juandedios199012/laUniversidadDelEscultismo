import React, { useState } from 'react';
import { X, Package, AlertTriangle, Warehouse } from 'lucide-react';
import { useUbicaciones } from '../hooks/useUbicaciones';
import { InventarioService } from '../../../services/inventarioService';

type Categoria = 'material_scout' | 'camping' | 'ceremonial' | 'deportivo' | 'primeros_auxilios' | 'administrativo';

interface FormData {
  nombre: string;
  descripcion: string;
  categoria: Categoria;
  estadoConservacion: number;
  situacionObservaciones: string;
  ubicacionInicial: string;
  cantidadInicial: number;
  fechaIngreso: string;
  valorUnitario: number;
}

interface PopUpRegistroProps {
  onClose: () => void;
  onSave: () => void;
}

const CATEGORIAS: { value: Categoria; label: string; emoji: string }[] = [
  { value: 'material_scout', label: 'Material Scout', emoji: '🏕️' },
  { value: 'camping', label: 'Camping', emoji: '⛺' },
  { value: 'ceremonial', label: 'Ceremonial', emoji: '🎖️' },
  { value: 'deportivo', label: 'Deportivo', emoji: '⚽' },
  { value: 'primeros_auxilios', label: 'Primeros Auxilios', emoji: '🏥' },
  { value: 'administrativo', label: 'Administrativo', emoji: '📋' },
];

const ESTADO_LABELS: Record<number, { label: string; color: string }> = {
  10: { label: 'Perfecto estado', color: 'text-green-600' },
  9: { label: 'Excelente', color: 'text-green-600' },
  8: { label: 'Muy bueno', color: 'text-green-500' },
  7: { label: 'Bueno', color: 'text-lime-600' },
  6: { label: 'Aceptable', color: 'text-yellow-500' },
  5: { label: 'Regular', color: 'text-yellow-600' },
  4: { label: 'Deteriorado', color: 'text-orange-500' },
  3: { label: 'Mal estado', color: 'text-orange-600' },
  2: { label: 'Muy deteriorado', color: 'text-red-500' },
  1: { label: 'Inutilizable', color: 'text-red-600' },
};

export function PopUpRegistro({ onClose, onSave }: PopUpRegistroProps) {
  const { ubicaciones, loading: loadingUbicaciones, error: errorUbicaciones } = useUbicaciones();

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    categoria: 'camping',
    estadoConservacion: 10,
    situacionObservaciones: '',
    ubicacionInicial: '',
    cantidadInicial: 1,
    fechaIngreso: new Date().toISOString().split('T')[0],
    valorUnitario: 0,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiereObservacion = formData.estadoConservacion < 7;
  const estadoInfo = ESTADO_LABELS[formData.estadoConservacion] || ESTADO_LABELS[5];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' || name === 'estadoConservacion' || name === 'cantidadInicial' || name === 'valorUnitario'
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      setError('El nombre del artículo es obligatorio.');
      return;
    }
    if (!formData.ubicacionInicial) {
      setError('Debes seleccionar un almacén de destino.');
      return;
    }
    if (requiereObservacion && !formData.situacionObservaciones.trim()) {
      setError('Describe el problema del artículo (puntuación < 7).');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await InventarioService.createItem({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        categoria: formData.categoria,
        cantidad: formData.cantidadInicial,
        ubicacion: formData.ubicacionInicial,
        costo: formData.valorUnitario,
        situacion_observaciones:
          formData.situacionObservaciones.trim() ||
          `Estado de conservación: ${formData.estadoConservacion}/10`,
        fecha_ingreso: formData.fechaIngreso,
      });

      if (!result.success) {
        throw new Error(result.error || 'Error al registrar el material');
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('❌ Error al guardar item:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-registro-title"
    >
      <form
        onSubmit={handleSubmit}
        onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
        className="bg-white text-gray-800 rounded-xl max-w-lg w-full shadow-2xl max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h2 id="popup-registro-title" className="text-lg font-bold text-gray-900">
              Registrar Nuevo Material
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Error general */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* DATOS BÁSICOS */}
          <fieldset className="border border-gray-200 p-4 rounded-lg">
            <legend className="text-xs font-semibold px-2 text-gray-500 uppercase tracking-wide">
              Información General
            </legend>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1" htmlFor="nombre">
                Nombre del Artículo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                required
                value={formData.nombre}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Carpa de 4 personas"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1" htmlFor="categoria">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                id="categoria"
                name="categoria"
                required
                value={formData.categoria}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIAS.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="descripcion">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={2}
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Marca, color, características especiales..."
              />
            </div>
          </fieldset>

          {/* ESTADO DE CONSERVACIÓN */}
          <fieldset className="border border-gray-200 p-4 rounded-lg bg-slate-50">
            <legend className="text-xs font-semibold px-2 text-gray-500 uppercase tracking-wide">
              Estado Físico
            </legend>

            <div className="mb-2">
              <label className="block text-sm font-medium mb-2" htmlFor="estadoConservacion">
                Puntuación:{' '}
                <span className={`font-bold ${estadoInfo.color}`}>
                  {formData.estadoConservacion}/10 — {estadoInfo.label}
                </span>
              </label>
              <input
                type="range"
                id="estadoConservacion"
                name="estadoConservacion"
                min="1"
                max="10"
                value={formData.estadoConservacion}
                onChange={handleChange}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Inutilizable</span>
                <span>Perfecto estado</span>
              </div>
            </div>

            {requiereObservacion && (
              <div className="mt-3">
                <label
                  className="block text-sm font-medium text-amber-800 mb-1"
                  htmlFor="situacionObservaciones"
                >
                  ¿Cuál es el problema? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="situacionObservaciones"
                  name="situacionObservaciones"
                  required={requiereObservacion}
                  rows={2}
                  value={formData.situacionObservaciones}
                  onChange={handleChange}
                  className="w-full border border-amber-300 p-2 rounded-md text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Ej: Varilla rota, tela desgastada en la entrada..."
                />
              </div>
            )}
          </fieldset>

          {/* INVENTARIO INICIAL (KARDEX) */}
          <fieldset className="border border-gray-200 p-4 rounded-lg">
            <legend className="text-xs font-semibold px-2 text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Warehouse className="w-3 h-3" /> Balance Inicial (Kardex)
            </legend>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="cantidadInicial">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="cantidadInicial"
                  name="cantidadInicial"
                  min="1"
                  required
                  value={formData.cantidadInicial}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="fechaIngreso">
                  Fecha de Ingreso
                </label>
                <input
                  type="date"
                  id="fechaIngreso"
                  name="fechaIngreso"
                  value={formData.fechaIngreso}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1" htmlFor="ubicacionInicial">
                Almacenado en <span className="text-red-500">*</span>
              </label>
              {loadingUbicaciones ? (
                <p className="text-sm text-gray-400 animate-pulse py-2">Cargando lugares...</p>
              ) : errorUbicaciones ? (
                <select
                  id="ubicacionInicial"
                  name="ubicacionInicial"
                  required
                  value={formData.ubicacionInicial}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccione Almacén --</option>
                  <option value="Casa de Alberto">Casa de Alberto</option>
                  <option value="Casa de Jesús">Casa de Jesús</option>
                  <option value="Almacén Principal">Almacén Principal</option>
                  <option value="Otro">Otro</option>
                </select>
              ) : (
                <select
                  id="ubicacionInicial"
                  name="ubicacionInicial"
                  required
                  value={formData.ubicacionInicial}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccione Almacén --</option>
                  {ubicaciones.map(loc => (
                    <option key={loc.id} value={loc.nombre}>
                      {loc.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="valorUnitario">
                Valor Unitario (S/.)
              </label>
              <input
                type="number"
                id="valorUnitario"
                name="valorUnitario"
                min="0"
                step="0.01"
                value={formData.valorUnitario}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando...
              </>
            ) : (
              'Guardar e Iniciar Kardex'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
