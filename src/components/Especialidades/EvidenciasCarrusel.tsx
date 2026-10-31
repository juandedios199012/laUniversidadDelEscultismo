// ============================================================================
// CARRUSEL DE EVIDENCIAS
// ============================================================================
// Visor de imágenes/videos de una especialidad: slide principal, miniaturas,
// navegación con flechas, teclado y swipe, y vista a pantalla completa.
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Trash2, Maximize2, FileText, Video } from 'lucide-react';
import type { EvidenciaEspecialidad } from '../../types/especialidades';

interface EvidenciasCarruselProps {
  evidencias: EvidenciaEspecialidad[];
  onEliminar: (evidenciaId: string) => void;
}

const SWIPE_MIN_PX = 40;

export default function EvidenciasCarrusel({ evidencias, onEliminar }: EvidenciasCarruselProps) {
  const [indice, setIndice] = useState(0);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const miniaturasRef = useRef<HTMLDivElement>(null);

  const total = evidencias.length;
  const actual = evidencias[Math.min(indice, total - 1)];

  // Si se elimina la última evidencia, retroceder al índice válido
  useEffect(() => {
    if (indice > total - 1) setIndice(Math.max(total - 1, 0));
  }, [total, indice]);

  // Mantener visible la miniatura activa
  useEffect(() => {
    const thumb = miniaturasRef.current?.children[indice] as HTMLElement | undefined;
    thumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [indice]);

  const anterior = useCallback(() => setIndice(i => (i - 1 + total) % total), [total]);
  const siguiente = useCallback(() => setIndice(i => (i + 1) % total), [total]);

  // Teclado en pantalla completa: flechas y Escape
  useEffect(() => {
    if (!pantallaCompleta) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') anterior();
      else if (e.key === 'ArrowRight') siguiente();
      else if (e.key === 'Escape') setPantallaCompleta(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pantallaCompleta, anterior, siguiente]);

  if (!actual) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_MIN_PX || total < 2) return;
    if (dx > 0) anterior();
    else siguiente();
  };

  const eliminarActual = () => {
    if (!confirm('¿Eliminar esta evidencia? Esta acción no se puede deshacer.')) return;
    onEliminar(actual.id);
  };

  const renderMedia = (ev: EvidenciaEspecialidad, grande: boolean) => {
    if (ev.tipo === 'imagen') {
      return (
        <img
          src={ev.url}
          alt={ev.descripcion || ev.nombre_archivo || 'Evidencia'}
          className={`max-w-full object-contain select-none ${grande ? 'max-h-[85vh]' : 'max-h-full'}`}
          draggable={false}
        />
      );
    }
    if (ev.tipo === 'video') {
      return (
        <video
          key={ev.id}
          src={ev.url}
          controls
          className={`max-w-full ${grande ? 'max-h-[85vh]' : 'max-h-full'}`}
        />
      );
    }
    return (
      <a
        href={ev.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-2 text-gray-200 hover:text-white"
      >
        <FileText className="w-12 h-12" />
        <span className="text-sm underline">{ev.nombre_archivo || 'Abrir archivo'}</span>
      </a>
    );
  };

  const flechas = (oscuro: boolean) =>
    total > 1 && (
      <>
        <button
          type="button"
          onClick={anterior}
          aria-label="Anterior"
          className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full shadow transition-colors ${
            oscuro ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/80 text-gray-800 hover:bg-white'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={siguiente}
          aria-label="Siguiente"
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full shadow transition-colors ${
            oscuro ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/80 text-gray-800 hover:bg-white'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </>
    );

  return (
    <div className="space-y-2">
      {/* Slide principal */}
      <div
        className="relative h-64 md:h-80 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {actual.tipo === 'imagen' ? (
          <button
            type="button"
            onClick={() => setPantallaCompleta(true)}
            className="h-full w-full flex items-center justify-center cursor-zoom-in"
            aria-label="Ver en pantalla completa"
          >
            {renderMedia(actual, false)}
          </button>
        ) : (
          renderMedia(actual, false)
        )}

        {flechas(false)}

        {/* Barra superior: contador y acciones */}
        <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
          <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-xs">
            {indice + 1} / {total}
          </span>
          <div className="flex gap-1 pointer-events-auto">
            {actual.tipo === 'imagen' && (
              <button
                type="button"
                onClick={() => setPantallaCompleta(true)}
                aria-label="Pantalla completa"
                className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={eliminarActual}
              aria-label="Eliminar evidencia"
              className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {(actual.descripcion || actual.nombre_archivo) && (
          <div className="absolute bottom-0 inset-x-0 px-3 py-1.5 bg-linear-to-t from-black/70 to-transparent text-white text-xs truncate pointer-events-none">
            {actual.descripcion || actual.nombre_archivo}
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {total > 1 && (
        <div ref={miniaturasRef} className="flex gap-2 overflow-x-auto pb-1">
          {evidencias.map((ev, i) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Ver evidencia ${i + 1}`}
              className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                i === indice ? 'border-blue-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {ev.tipo === 'imagen' ? (
                <img src={ev.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  {ev.tipo === 'video'
                    ? <Video className="w-6 h-6 text-gray-400" />
                    : <FileText className="w-6 h-6 text-gray-400" />}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Pantalla completa */}
      {pantallaCompleta && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setPantallaCompleta(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            {renderMedia(actual, true)}
            {flechas(true)}
            <span className="absolute top-4 left-4 px-2 py-0.5 rounded-full bg-white/10 text-white text-sm">
              {indice + 1} / {total}
            </span>
            <button
              type="button"
              onClick={() => setPantallaCompleta(false)}
              aria-label="Cerrar"
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
