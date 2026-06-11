import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Plus, Loader2, MapPin } from 'lucide-react';
import type { Ubicacion } from '../hooks/useUbicaciones';

interface ComboboxUbicacionesProps {
  ubicaciones: Ubicacion[];
  loading: boolean;
  value: string;
  onChange: (nombre: string) => void;
  onAgregarNueva: (nombre: string) => Promise<Ubicacion | null>;
  required?: boolean;
}

export function ComboboxUbicaciones({
  ubicaciones,
  loading,
  value,
  onChange,
  onAgregarNueva,
  required = false,
}: ComboboxUbicacionesProps) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [creando, setCreando] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincroniza el texto del input con el valor seleccionado externamente
  useEffect(() => {
    if (!open) setQuery(value);
  }, [value, open]);

  // Cierra el dropdown si el clic fue fuera del componente
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Si cerró sin seleccionar, restaura el valor previo
        setQuery(value);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [value]);

  const queryTrimmed = query.trim();

  // Filtra las opciones según lo que el usuario escribe
  const opciones = queryTrimmed
    ? ubicaciones.filter(u =>
        u.nombre.toLowerCase().includes(queryTrimmed.toLowerCase())
      )
    : ubicaciones;

  // ¿El texto escrito coincide exactamente con una opción existente?
  const yaExiste = ubicaciones.some(
    u => u.nombre.toLowerCase() === queryTrimmed.toLowerCase()
  );

  // Muestra la opción "Añadir X" si el texto no está vacío y no existe ya
  const mostrarOpcionAgregar = queryTrimmed.length > 0 && !yaExiste;

  const seleccionar = (nombre: string) => {
    onChange(nombre);
    setQuery(nombre);
    setOpen(false);
  };

  const handleAgregarNueva = async () => {
    if (!queryTrimmed || creando) return;
    setCreando(true);
    try {
      const nueva = await onAgregarNueva(queryTrimmed);
      if (nueva) {
        seleccionar(nueva.nombre);
      }
    } finally {
      setCreando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery(value);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      // Si hay una sola opción filtrada, seleccionarla
      if (opciones.length === 1) {
        seleccionar(opciones[0].nombre);
      } else if (mostrarOpcionAgregar && !creando) {
        handleAgregarNueva();
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input visible */}
      <div
        className={`flex items-center border rounded-md bg-white transition-colors ${
          open ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
        }`}
      >
        <MapPin className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          required={required}
          disabled={loading}
          placeholder={loading ? 'Cargando almacenes...' : 'Buscar o escribir almacén...'}
          value={open ? query : value}
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
          <ChevronDown
            className={`w-4 h-4 text-gray-400 mr-3 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </div>

      {/* Dropdown */}
      {open && !loading && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">

          {/* Opciones filtradas */}
          {opciones.length > 0 ? (
            opciones.map(u => (
              <button
                key={u.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); seleccionar(u.nombre); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                  u.nombre === value ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {u.nombre}
                {u.nombre === value && (
                  <span className="ml-auto text-blue-500 text-xs">✓</span>
                )}
              </button>
            ))
          ) : (
            !mostrarOpcionAgregar && (
              <p className="px-4 py-3 text-sm text-gray-400 text-center">
                No se encontraron almacenes
              </p>
            )
          )}

          {/* Opción "Añadir nueva ubicación" */}
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
                  : `Añadir "${queryTrimmed}" como nueva ubicación`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
