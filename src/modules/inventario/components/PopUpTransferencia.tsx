import React, { useState } from 'react';
import { X, ArrowRight, Loader2, MapPin, User, Calendar, MessageSquare } from 'lucide-react';
import { usePersonasRegistradas } from '../hooks/usePersonasRegistradas';
import { ComboboxUbicaciones } from './ComboboxUbicaciones';
import { InventarioService } from '../../../services/inventarioService';
import type { InventarioItem } from '../../../lib/supabase';

interface PopUpTransferenciaProps {
  item: InventarioItem;
  onClose: () => void;
  onSuccess: () => void;
}

export function PopUpTransferencia({ item, onClose, onSuccess }: PopUpTransferenciaProps) {
  const { personas, loading: loadingPersonas } = usePersonasRegistradas();

  const [destinoNombre, setDestinoNombre] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [responsableNombre, setResponsableNombre] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ubicación actual del item
  const ubicacionActual = (item as any).ubicacion ?? '—';

  const handleTransferir = async () => {
    if (!destinoNombre.trim()) {
      setError('Selecciona el destino del material.');
      return;
    }
    if (destinoNombre.trim() === ubicacionActual) {
      setError('El material ya se encuentra con esa persona.');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const motivo = notas.trim() || `Traslado el ${fecha}`;
      const result = await InventarioService.transferirMaterial({
        item_id:         item.id,
        ubicacion_nueva: destinoNombre.trim(),
        responsable:     responsableNombre.trim() || undefined,
        motivo,
      });

      if (!result.success) {
        setError(result.error ?? 'Error al transferir el material.');
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
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 id="transfer-title" className="text-lg font-bold text-gray-900">
              Mover Material
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

        {/* Ruta visual: origen → destino */}
        <div className="flex items-center gap-3 mx-6 mt-5 p-3 bg-blue-50 rounded-xl">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-500 uppercase tracking-wide mb-0.5">Origen</p>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-sm font-semibold text-blue-800 truncate">
                {ubicacionActual}
              </span>
            </div>
          </div>

          <ArrowRight className="w-5 h-5 text-blue-400 shrink-0" />

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-green-500 uppercase tracking-wide mb-0.5">Destino</p>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-green-400 shrink-0" />
              <span className="text-sm font-semibold text-green-800 truncate">
                {destinoNombre || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="px-6 pt-4 pb-2 space-y-4">

          {/* Destino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nuevo custodio / ubicación <span className="text-red-500">*</span>
            </label>
            <ComboboxUbicaciones
              ubicaciones={personas}
              loading={loadingPersonas}
              value={destinoNombre}
              onChange={setDestinoNombre}
              placeholder="Buscar scout, dirigente o comité..."
            />
          </div>

          {/* Fecha y Responsable en grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline w-3.5 h-3.5 mr-1 text-gray-400" />
                Fecha del traslado
              </label>
              <input
                type="date"
                value={fecha}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setFecha(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="inline w-3.5 h-3.5 mr-1 text-gray-400" />
                Responsable del traslado
              </label>
              <ComboboxUbicaciones
                ubicaciones={personas}
                loading={loadingPersonas}
                value={responsableNombre}
                onChange={setResponsableNombre}
                placeholder="Buscar persona..."
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MessageSquare className="inline w-3.5 h-3.5 mr-1 text-gray-400" />
              Notas / Situación
              <span className="text-gray-400 font-normal ml-1">(opcional)</span>
            </label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
              placeholder="Ej: Estado: 9/10, listo para el campamento"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Error inline */}
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
            onClick={handleTransferir}
            disabled={guardando || !destinoNombre.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {guardando ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Moviendo...</>
            ) : (
              <><ArrowRight className="w-4 h-4" /> Confirmar traslado</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
