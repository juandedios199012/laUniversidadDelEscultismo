import React, { useState } from 'react';
import { X, Info, ScrollText, Package, AlertCircle } from 'lucide-react';
import { useHistorialKardex } from '../hooks/useHistorialKardex';
import type { InventarioItem } from '../../../lib/supabase';

interface DetalleMaterialProps {
  material: InventarioItem;
  onClose: () => void;
}

type Tab = 'info' | 'historial';

const TIPO_MOVIMIENTO_STYLES: Record<string, string> = {
  ENTRADA_INICIAL: 'bg-blue-100 text-blue-800',
  entrada: 'bg-green-100 text-green-800',
  salida: 'bg-red-100 text-red-800',
  prestamo: 'bg-yellow-100 text-yellow-800',
  devolucion: 'bg-teal-100 text-teal-800',
  baja: 'bg-gray-100 text-gray-800',
  ajuste: 'bg-purple-100 text-purple-800',
};

const ESTADO_COLORS: Record<string, string> = {
  disponible: 'bg-green-100 text-green-800',
  DISPONIBLE: 'bg-green-100 text-green-800',
  prestado: 'bg-yellow-100 text-yellow-800',
  PRESTADO: 'bg-yellow-100 text-yellow-800',
  mantenimiento: 'bg-blue-100 text-blue-800',
  MANTENIMIENTO: 'bg-blue-100 text-blue-800',
  perdido: 'bg-red-100 text-red-800',
  PERDIDO: 'bg-red-100 text-red-800',
  baja: 'bg-gray-100 text-gray-800',
  BAJA: 'bg-gray-100 text-gray-800',
};

function formatDate(dateString: string): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DetalleMaterial({ material, onClose }: DetalleMaterialProps) {
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const { historial, loading, error: kardexError } = useHistorialKardex(material.id);

  // The DB stores cantidad_total/cantidad_disponible; fall back to cantidad for legacy data
  const stockActual = (material as any).cantidad_disponible ?? (material as any).cantidad_total ?? material.cantidad;
  const stockTotal = (material as any).cantidad_total ?? material.cantidad;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white text-gray-800 rounded-xl max-w-3xl w-full shadow-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{material.nombre}</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                {material.categoria.replace(/_/g, ' ')}
              </span>
            </div>
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

        {/* Tabs */}
        <div role="tablist" aria-label="Secciones del material" className="flex border-b border-gray-200 px-5">
          <button
            role="tab"
            aria-selected={activeTab === 'info'}
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Info className="w-4 h-4" />
            Información General
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'historial'}
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === 'historial'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ScrollText className="w-4 h-4" />
            Trazabilidad y Kardex
            {historial.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 rounded-full">
                {historial.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">

          {/* TAB 1: Información General */}
          <div role="tabpanel" hidden={activeTab !== 'info'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Estado</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${ESTADO_COLORS[(material as any).estado_item ?? material.estado ?? ''] || 'bg-gray-100 text-gray-700'}`}>
                  {((material as any).estado_item ?? material.estado ?? '—').toLowerCase()}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Stock Calculado Total</p>
                <p className="text-lg font-bold text-green-700">
                  {stockActual}
                  {stockTotal !== stockActual && (
                    <span className="text-sm text-gray-400 font-normal"> / {stockTotal} total</span>
                  )}
                  <span className="text-sm text-gray-400 font-normal"> u.</span>
                </p>
              </div>

              {material.descripcion && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Descripción</p>
                  <p className="text-sm text-gray-700">{material.descripcion}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Ubicación</p>
                <p className="text-sm text-gray-700">{material.ubicacion || 'Sin registros'}</p>
              </div>

              {(material as any).valor_unitario != null && (material as any).valor_unitario > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Valor Unitario</p>
                  <p className="text-sm text-gray-700">
                    S/. {Number((material as any).valor_unitario).toFixed(2)}
                  </p>
                </div>
              )}

              {material.costo != null && material.costo > 0 && !(material as any).valor_unitario && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Costo</p>
                  <p className="text-sm text-gray-700">S/. {material.costo.toFixed(2)}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Último Uso Registrado</p>
                <p className="text-sm text-gray-700">
                  {historial.length > 0
                    ? formatDate(historial[0].fecha_movimiento || historial[0].created_at)
                    : 'Sin registros recientes'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Registrado</p>
                <p className="text-sm text-gray-700">{formatDate(material.created_at)}</p>
              </div>
            </div>

            {material.observaciones && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Observaciones</p>
                <p className="text-sm text-amber-900">{material.observaciones}</p>
              </div>
            )}
          </div>

          {/* TAB 2: Historial Kardex */}
          <div role="tabpanel" hidden={activeTab !== 'historial'}>
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                <ScrollText className="w-10 h-10 mx-auto text-gray-300 mb-3 animate-pulse" />
                <p className="text-sm animate-pulse">Cargando historial de movimientos...</p>
              </div>
            ) : kardexError ? (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>No se pudo cargar el historial: {kardexError}</span>
              </div>
            ) : historial.length === 0 ? (
              <div className="text-center py-12">
                <ScrollText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-base font-medium text-gray-600 mb-1">Sin movimientos registrados</h3>
                <p className="text-sm text-gray-400">
                  Los movimientos aparecerán aquí al registrar entradas, salidas o préstamos.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                      <th className="p-3 border-b whitespace-nowrap">Fecha</th>
                      <th className="p-3 border-b">Acción</th>
                      <th className="p-3 border-b">Cant.</th>
                      <th className="p-3 border-b hidden sm:table-cell">Origen</th>
                      <th className="p-3 border-b hidden sm:table-cell">Destino</th>
                      <th className="p-3 border-b hidden md:table-cell">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historial.map(mov => (
                      <tr key={mov.id} className="hover:bg-gray-50 transition">
                        <td className="p-3 whitespace-nowrap text-gray-500 text-xs">
                          {formatDateTime(mov.fecha_movimiento || mov.created_at)}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TIPO_MOVIMIENTO_STYLES[mov.tipo_movimiento] || 'bg-gray-100 text-gray-700'}`}>
                            {mov.tipo_movimiento}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-gray-800">{mov.cantidad}</td>
                        <td className="p-3 text-gray-500 hidden sm:table-cell">
                          {(mov as any).origen || '—'}
                        </td>
                        <td className="p-3 font-medium text-gray-700 hidden sm:table-cell">
                          {mov.destino || '—'}
                        </td>
                        <td
                          className="p-3 text-gray-500 max-w-xs truncate hidden md:table-cell"
                          title={mov.observaciones || mov.motivo || undefined}
                        >
                          {mov.observaciones || mov.motivo || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition font-medium text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
