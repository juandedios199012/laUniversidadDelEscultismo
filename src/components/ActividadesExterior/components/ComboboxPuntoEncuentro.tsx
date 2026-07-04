import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Loader2, MapPin, Plus } from 'lucide-react';
import type { PuntoEncuentroAireLibre } from '@/services/actividadesExteriorService';

interface ComboboxPuntoEncuentroProps {
  puntos: PuntoEncuentroAireLibre[];
  loading: boolean;
  value?: string | null; // punto_encuentro_id seleccionado
  onChange: (id: string) => void;
  onAgregarNueva: (lugar: string) => Promise<PuntoEncuentroAireLibre | null>;
  placeholder?: string;
}

export function ComboboxPuntoEncuentro({
  puntos,
  loading,
  value,
  onChange,
  onAgregarNueva,
  placeholder,
}: ComboboxPuntoEncuentroProps) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [creando, setCreando] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const seleccionado = puntos.find(p => p.id === value);
  const textoSeleccionado = seleccionado?.lugar ?? '';

  // Sincroniza el texto del input con el punto seleccionado externamente
  useEffect(() => {
    if (!open) setQuery(textoSeleccionado);
  }, [textoSeleccionado, open]);

  // Cierra el dropdown si el clic fue fuera del componente
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(textoSeleccionado);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [textoSeleccionado]);

  const queryTrimmed = query.trim();

  const opciones = queryTrimmed
    ? puntos.filter(p => p.lugar.toLowerCase().includes(queryTrimmed.toLowerCase()))
    : puntos;

  const yaExiste = puntos.some(p => p.lugar.toLowerCase() === queryTrimmed.toLowerCase());
  const mostrarOpcionAgregar = queryTrimmed.length > 0 && !yaExiste;

  const seleccionar = (punto: PuntoEncuentroAireLibre) => {
    onChange(punto.id);
    setQuery(punto.lugar);
    setOpen(false);
  };

  const handleAgregarNueva = async () => {
    if (!queryTrimmed || creando) return;
    setCreando(true);
    try {
      const nuevo = await onAgregarNueva(queryTrimmed);
      if (nuevo) {
        seleccionar(nuevo);
      }
    } finally {
      setCreando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery(textoSeleccionado);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (opciones.length === 1) {
        seleccionar(opciones[0]);
      } else if (mostrarOpcionAgregar && !creando) {
        handleAgregarNueva();
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center border rounded-md bg-white transition-colors ${
          open ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
        }`}
      >
        <MapPin className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
        <input
          id={id}
          type="text"
          autoComplete="off"
          disabled={loading}
          placeholder={loading ? 'Cargando...' : (placeholder ?? 'Buscar o escribir...')}
          value={open ? query : textoSeleccionado}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 py-2 px-2 text-sm bg-transparent focus:outline-none disabled:cursor-not-allowed disabled:text-gray-400"
        />
        {loading ? (
          <Loader2 className="w-4 h-4 text-gray-400 mr-3 animate-spin" />
        ) : (
          <ChevronDown className={`w-4 h-4 text-gray-400 mr-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </div>

      {open && !loading && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {opciones.length > 0 ? (
            opciones.map(p => (
              <button
                key={p.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); seleccionar(p); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                  p.id === value ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="flex flex-col items-start">
                  <span>{p.lugar}</span>
                  {p.referencia && <span className="text-xs text-gray-400">{p.referencia}</span>}
                </span>
                {p.id === value && <span className="ml-auto text-blue-500 text-xs">✓</span>}
              </button>
            ))
          ) : (
            !mostrarOpcionAgregar && (
              <p className="px-4 py-3 text-sm text-gray-400 text-center">
                No se encontraron puntos de encuentro
              </p>
            )
          )}

          {mostrarOpcionAgregar && (
            <>
              {opciones.length > 0 && <div className="border-t border-gray-100" />}
              <button
                type="button"
                disabled={creando}
                onMouseDown={e => { e.preventDefault(); handleAgregarNueva(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-medium transition-colors disabled:opacity-60"
              >
                {creando ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                )}
                {creando
                  ? `Guardando "${queryTrimmed}"...`
                  : `Añadir "${queryTrimmed}" como nuevo punto de encuentro`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
