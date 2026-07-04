/**
 * PersonSearchCombobox
 * Buscador de personas existentes en el sistema.
 *
 * Comportamiento:
 *  - Input siempre visible con icono 🔍
 *  - Búsqueda debounced: solo dígitos → por documento; letras → por nombre
 *  - Dropdown con resultados + badges de rol
 *  - Al seleccionar → llama a onSelect(persona) para que el padre pre-rellene su form
 *  - "No encontrado" → el usuario puede continuar ingresando manualmente
 */

import React, { useRef, useEffect, useState } from 'react';
import { Search, Loader2, X, UserCheck } from 'lucide-react';
import { usePersonSearch } from '../../../hooks/usePersonSearch';
import { PersonaResult } from '../../../services/personaService';
import { PersonRoleBadge } from './PersonRoleBadge';

interface PersonSearchComboboxProps {
  /** Callback cuando el usuario selecciona una persona */
  onSelect: (persona: PersonaResult) => void;
  /** Texto placeholder del input */
  placeholder?: string;
  /** Desactivar el componente */
  disabled?: boolean;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
  /** Persona actualmente vinculada (para mostrar badge "Vinculado") */
  personaVinculada?: PersonaResult | null;
  /** Permite desvincular la persona seleccionada */
  onDesvincular?: () => void;
}

export function PersonSearchCombobox({
  onSelect,
  placeholder = 'Buscar por nombre o N° documento...',
  disabled = false,
  className = '',
  personaVinculada,
  onDesvincular,
}: PersonSearchComboboxProps) {
  const { query, results, loading, error, setQuery, seleccionar, limpiar, modo } =
    usePersonSearch();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (persona: PersonaResult) => {
    seleccionar(persona);
    onSelect(persona);
    setOpen(false);
  };

  const handleDesvincular = () => {
    limpiar();
    onDesvincular?.();
  };

  // Si hay una persona vinculada, mostrar banner en lugar del input
  if (personaVinculada) {
    return (
      <div className={`rounded-lg border border-emerald-300 bg-emerald-50 p-3 ${className}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-800 truncate">
                {personaVinculada.nombres} {personaVinculada.apellidos}
              </p>
              {personaVinculada.numero_documento && (
                <p className="text-xs text-emerald-600">
                  {personaVinculada.tipo_documento ?? 'DOC'}: {personaVinculada.numero_documento}
                </p>
              )}
              {personaVinculada.roles && personaVinculada.roles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {personaVinculada.roles.slice(0, 3).map((rol, i) => (
                    <PersonRoleBadge key={i} tipo={rol.tipo} detalle={rol.detalle} />
                  ))}
                </div>
              )}
            </div>
          </div>
          {onDesvincular && (
            <button
              type="button"
              onClick={handleDesvincular}
              className="shrink-0 p-1 rounded text-emerald-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Quitar vinculación (ingresar datos manualmente)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-9 pr-9 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        {/* Indicador de carga / limpiar */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : query ? (
            <button
              type="button"
              onClick={() => { limpiar(); setOpen(false); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Hint de modo */}
      {query.length >= 2 && !open && (
        <p className="mt-0.5 text-xs text-gray-400">
          {modo === 'documento' ? 'Buscando por N° documento…' : 'Buscando por nombre…'}
        </p>
      )}

      {/* Dropdown de resultados */}
      {open && (results.length > 0 || error || (query.length >= 2 && !loading)) && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {error && (
            <div className="px-3 py-2 text-xs text-red-500">{error}</div>
          )}

          {results.length > 0 && (
            <ul>
              {results.map((persona) => (
                <li key={persona.persona_id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(persona)}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {persona.nombres} {persona.apellidos}
                        </p>
                        {persona.numero_documento && (
                          <p className="text-xs text-gray-500">
                            {persona.tipo_documento ?? 'DOC'}: {persona.numero_documento}
                            {persona.celular ? ` • ${persona.celular}` : ''}
                          </p>
                        )}
                      </div>
                      {persona.roles && persona.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1 shrink-0">
                          {persona.roles.slice(0, 2).map((rol, i) => (
                            <PersonRoleBadge key={i} tipo={rol.tipo} detalle={rol.detalle} />
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {results.length === 0 && !loading && query.length >= 2 && (
            <div className="px-3 py-3 text-center">
              <p className="text-sm text-gray-500">Sin resultados para "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">
                Continúa ingresando los datos manualmente
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
