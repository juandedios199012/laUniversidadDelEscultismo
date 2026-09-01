import React, { useState } from 'react';
import { X, PackageMinus, Loader2, Check, CircleOff, Users } from 'lucide-react';
import { useSalidaMasiva } from '../hooks/useSalidaMasiva';
import type { InventarioItem } from '../../../lib/supabase';

const RAMAS_VALIDAS = ['Manada', 'Tropa', 'Comunidad', 'Clan'];

interface PopUpSalidaMasivaProps {
  item: InventarioItem;
  onClose: () => void;
  onSuccess: () => void;
}

export function PopUpSalidaMasiva({ item, onClose, onSuccess }: PopUpSalidaMasivaProps) {
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const {
    rama, setRama,
    fecha, setFecha,
    motivo, setMotivo,
    elegibles, entregados, toggle,
    cargando, guardando, error, resultado,
    stockDisponible, totalMarcados,
    cargarElegibles, guardar,
  } = useSalidaMasiva(item);

  const handleCargar = async () => {
    if (await cargarElegibles()) setPaso(2);
  };

  const handleGuardar = async () => {
    if (await guardar()) {
      setPaso(3);
      onSuccess();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="salida-masiva-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 id="salida-masiva-title" className="text-lg font-bold text-gray-900">
              Salida Masiva
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

        <div className="overflow-y-auto flex-1">

          {/* Paso 1: rama + fecha */}
          {paso === 1 && (
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl">
                <PackageMinus className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm font-semibold text-red-800">
                  {stockDisponible} disponible{stockDisponible === 1 ? '' : 's'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rama <span className="text-red-500">*</span>
                </label>
                <select
                  value={rama}
                  onChange={e => setRama(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Selecciona una rama...</option>
                  {RAMAS_VALIDAS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de entrega
                </label>
                <input
                  type="date"
                  value={fecha}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Ej: Entrega de insignia de rama"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* Paso 2: grilla de participantes, todos marcados por defecto */}
          {paso === 2 && (
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-sm font-semibold text-blue-800">
                    {totalMarcados} de {elegibles.length} marcados
                  </span>
                </div>
                {totalMarcados > stockDisponible && (
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                    Solo hay {stockDisponible} en stock
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Todos empiezan marcados como "entregado". Toca a quien NO recibió el ítem.
              </p>

              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                {elegibles.map(p => {
                  const marcado = !!entregados[p.persona_id];
                  return (
                    <button
                      key={p.persona_id}
                      type="button"
                      onClick={() => toggle(p.persona_id)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                        marcado ? 'bg-white hover:bg-green-50' : 'bg-red-50 hover:bg-red-100'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {p.nombres} {p.apellidos}
                        </p>
                        <p className="text-xs text-gray-400">{p.codigo_asociado}</p>
                      </div>
                      {marcado ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-green-600 shrink-0">
                          <Check className="w-4 h-4" /> Entregado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-500 shrink-0">
                          <CircleOff className="w-4 h-4" /> No recibió
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* Paso 3: resumen */}
          {paso === 3 && resultado && (
            <div className="px-6 py-5 space-y-3">
              <div className="flex items-center gap-2 p-4 bg-green-50 rounded-xl">
                <Check className="w-5 h-5 text-green-600 shrink-0" />
                <span className="text-sm font-semibold text-green-800">
                  {resultado.entregados} entrega{resultado.entregados === 1 ? '' : 's'} registrada{resultado.entregados === 1 ? '' : 's'}
                </span>
              </div>

              {resultado.fallidos.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm font-semibold text-amber-800 mb-2">
                    {resultado.fallidos.length} no se pudieron registrar:
                  </p>
                  <ul className="text-xs text-amber-700 space-y-1">
                    {resultado.fallidos.map(f => {
                      const persona = elegibles.find(p => p.persona_id === f.persona_id);
                      return (
                        <li key={f.persona_id}>
                          {persona ? `${persona.nombres} ${persona.apellidos}` : f.persona_id} — {f.error}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t mt-2 shrink-0">
          {paso === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCargar}
                disabled={cargando || !rama || stockDisponible < 1}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cargando ? <><Loader2 className="w-4 h-4 animate-spin" /> Cargando...</> : 'Cargar participantes'}
              </button>
            </>
          )}

          {paso === 2 && (
            <>
              <button
                type="button"
                onClick={() => setPaso(1)}
                disabled={guardando}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleGuardar}
                disabled={guardando || totalMarcados === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {guardando ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                ) : (
                  `Guardar ${totalMarcados} entrega${totalMarcados === 1 ? '' : 's'}`
                )}
              </button>
            </>
          )}

          {paso === 3 && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
