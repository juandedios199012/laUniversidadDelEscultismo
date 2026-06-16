/**
 * usePersonSearch
 * Hook para búsqueda debounced de personas.
 *
 * - Si el texto parece un número de documento (solo dígitos) → busca por documento
 * - Si tiene letras → busca por nombre
 * - Debounce 350ms para evitar demasiadas peticiones
 * - Cachea resultados recientes por texto
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import PersonaService, { PersonaResult } from '../services/personaService';

const DEBOUNCE_MS = 350;
const MIN_CHARS = 2;

interface UsePersonSearchState {
  query: string;
  results: PersonaResult[];
  loading: boolean;
  error: string | null;
  personaSeleccionada: PersonaResult | null;
}

interface UsePersonSearchReturn extends UsePersonSearchState {
  setQuery: (q: string) => void;
  seleccionar: (persona: PersonaResult) => void;
  limpiar: () => void;
  /** Modo detectado: 'documento' (solo dígitos) o 'nombre' (tiene letras) */
  modo: 'documento' | 'nombre';
}

export function usePersonSearch(): UsePersonSearchReturn {
  const [state, setState] = useState<UsePersonSearchState>({
    query: '',
    results: [],
    loading: false,
    error: null,
    personaSeleccionada: null,
  });

  // Caché para evitar re-buscar el mismo término
  const cache = useRef<Map<string, PersonaResult[]>>(new Map());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQuery = useRef<string>('');

  // Detectar modo según el contenido del query
  const detectarModo = (texto: string): 'documento' | 'nombre' => {
    return /^\d+$/.test(texto.trim()) ? 'documento' : 'nombre';
  };

  const buscar = useCallback(async (texto: string) => {
    const trimmed = texto.trim();

    if (trimmed.length < MIN_CHARS) {
      setState((s) => ({ ...s, results: [], loading: false, error: null }));
      return;
    }

    // Usar caché si existe
    if (cache.current.has(trimmed)) {
      setState((s) => ({
        ...s,
        results: cache.current.get(trimmed)!,
        loading: false,
        error: null,
      }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      let resultados: PersonaResult[] = [];
      const modo = detectarModo(trimmed);

      if (modo === 'documento') {
        // Buscar primero como DNI, luego como CE si no hay resultado
        const por_dni = await PersonaService.buscarPorDocumento('DNI', trimmed);
        if (por_dni) {
          resultados = [por_dni];
        } else {
          resultados = await PersonaService.buscarPorNombre(trimmed);
        }
      } else {
        resultados = await PersonaService.buscarPorNombre(trimmed);
      }

      // Guardar en caché
      cache.current.set(trimmed, resultados);
      // Limpiar caché si crece mucho
      if (cache.current.size > 30) {
        const firstKey = cache.current.keys().next().value;
        if (firstKey !== undefined) cache.current.delete(firstKey);
      }

      // Solo actualizar si el query no cambió mientras esperábamos
      if (lastQuery.current === trimmed) {
        setState((s) => ({ ...s, results: resultados, loading: false }));
      }
    } catch {
      setState((s) => ({
        ...s,
        loading: false,
        error: 'Error al buscar persona',
        results: [],
      }));
    }
  }, []);

  const setQuery = useCallback(
    (q: string) => {
      lastQuery.current = q.trim();
      setState((s) => ({ ...s, query: q, personaSeleccionada: null }));

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (q.trim().length < MIN_CHARS) {
        setState((s) => ({ ...s, results: [], loading: false, error: null }));
        return;
      }

      setState((s) => ({ ...s, loading: true }));
      debounceTimer.current = setTimeout(() => buscar(q), DEBOUNCE_MS);
    },
    [buscar]
  );

  const seleccionar = useCallback((persona: PersonaResult) => {
    setState((s) => ({
      ...s,
      personaSeleccionada: persona,
      query: `${persona.nombres} ${persona.apellidos}`.trim(),
      results: [],
      loading: false,
    }));
  }, []);

  const limpiar = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setState({
      query: '',
      results: [],
      loading: false,
      error: null,
      personaSeleccionada: null,
    });
  }, []);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return {
    ...state,
    setQuery,
    seleccionar,
    limpiar,
    modo: detectarModo(state.query),
  };
}
