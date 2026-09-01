import React, { useState } from 'react';
import { X, PackageMinus, Loader2, User } from 'lucide-react';
import { usePersonasRegistradas, PersonaRegistrada } from '../hooks/usePersonasRegistradas';
import { ComboboxUbicaciones } from './ComboboxUbicaciones';
import { InventarioService } from '../../../services/inventarioService';
import type { InventarioItem } from '../../../lib/supabase';

interface PopUpSalidaProps {
  item: InventarioItem;
  onClose: () => void;
  onSuccess: () => void;
}

export function PopUpSalida({ item, onClose, onSuccess }: PopUpSalidaProps) {
  const { personas, loading: loadingPersonas } = usePersonasRegistradas();

  const [destinoNombre, setDestinoNombre] = useState('');
  const [destinoPersona, setDestinoPersona] = useState<PersonaRegistrada | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [responsableNombre, setResponsableNombre] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stockDisponible = item.cantidad_disponible ?? 0;

  const handleSeleccionarDestino = (persona: PersonaRegistrada) => {
    setDestinoPersona(persona);
  };

  const handleCambiarTextoDestino = (nombre: string) => {
    setDestinoNombre(nombre);
    if (destinoPersona && nombre !== destinoPersona.nombre) {
      setDestinoPersona(null);
    }
  };

  const handleRegistrarSalida = async () => {
    if (!destinoPersona) {
      setError('Selecciona a quién se le entrega, de la lista.');
      return;
    }
    if (cantidad < 1 || cantidad > stockDisponible) {
      setError(`La cantidad debe estar entre 1 y ${stockDisponible} (stock disponible).`);
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const result = await InventarioService.registrarSalida({
        item_id: item.id,
        persona_id: destinoPersona.id,
        cantidad,
        motivo: motivo.trim() || undefined,
        responsable: responsableNombre.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error ?? 'Error al registrar la salida.');
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="salida-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 id="salida-title" className="text-lg font-bold text-gray-900">
              Registrar Salida
            </h2>
            <p className="text-sm text-gray-500 truncate max-w-[18rem]">{item.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Stock disponible */}
        <div className="flex items-center gap-2 mx-6 mt-5 p-3 bg-red-50 rounded-xl">
          <PackageMinus className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-sm font-semibold text-red-800">
            {stockDisponible} disponible{stockDisponible === 1 ? '' : 's'}
          </span>
        </div>

        {/* Formulario */}
        <div className="px-6 pt-4 pb-2 space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entregar a <span className="text-red-500">*</span>
            </label>
            <ComboboxUbicaciones
              ubicaciones={personas}
              loading={loadingPersonas}
              value={destinoNombre}
              onChange={handleCambiarTextoDestino}
              onSelectItem={handleSeleccionarDestino}
              placeholder="Buscar scout, dirigente o comité..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                min={1}
                max={stockDisponible}
                value={cantidad}
                onChange={e => setCantidad(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="inline w-3.5 h-3.5 mr-1 text-gray-400" />
                Responsable
              </label>
              <ComboboxUbicaciones
                ubicaciones={personas}
                loading={loadingPersonas}
                value={responsableNombre}
                onChange={setResponsableNombre}
                placeholder="Quién registra..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo (opcional)
            </label>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              rows={2}
              placeholder="Ej: Entrega de insignia de rama"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleRegistrarSalida}
            disabled={guardando || !destinoPersona || stockDisponible < 1}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {guardando ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
            ) : (
              <><PackageMinus className="w-4 h-4" /> Confirmar salida</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
