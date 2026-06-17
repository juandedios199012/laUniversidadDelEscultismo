// ============================================================================
// HOOK: useEtapasAdmin
// ============================================================================
// Gestiona el CRUD de Etapas y Grupos de Objetivos por rama
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import ProgresionService, {
  Etapa,
  GrupoObjetivo,
  RamaCodigo,
} from '../services/progresionService';

// ============================================================================
// TIPOS
// ============================================================================

export interface EtapaFormData {
  nombre: string;
  descripcion?: string;
  edad_tipica?: number;
  orden?: number;
  icono?: string;
  color?: string;
  requisitos_avance?: string;
}

export interface GrupoFormData {
  nombre: string;
  codigo?: string;
  descripcion?: string;
  orden?: number;
  etapas_aplicables?: string[];
}

export interface UseEtapasAdminReturn {
  etapas: Etapa[];
  grupos: GrupoObjetivo[];

  loading: boolean;
  guardando: boolean;
  error: string | null;

  ramaActiva: RamaCodigo;

  cargarDatos: () => Promise<void>;

  crearEtapa: (datos: EtapaFormData) => Promise<void>;
  actualizarEtapa: (id: string, datos: EtapaFormData) => Promise<void>;
  eliminarEtapa: (id: string) => Promise<void>;

  crearGrupo: (datos: GrupoFormData) => Promise<void>;
  actualizarGrupo: (id: string, datos: GrupoFormData) => Promise<void>;
  eliminarGrupo: (id: string) => Promise<void>;

  limpiarError: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useEtapasAdmin(ramaActiva: RamaCodigo): UseEtapasAdminReturn {
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [grupos, setGrupos] = useState<GrupoObjetivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limpiarError = useCallback(() => setError(null), []);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [etapasData, gruposData] = await Promise.all([
        ProgresionService.obtenerEtapas(ramaActiva),
        ProgresionService.obtenerGruposObjetivo(ramaActiva),
      ]);
      setEtapas(etapasData);
      setGrupos(gruposData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [ramaActiva]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // --------------------------------------------------------------------------
  // CRUD ETAPAS
  // --------------------------------------------------------------------------

  const crearEtapa = useCallback(async (datos: EtapaFormData) => {
    setGuardando(true);
    setError(null);
    try {
      await ProgresionService.crearEtapa({ rama: ramaActiva, ...datos });
      await cargarDatos();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear etapa';
      setError(msg);
      throw err;
    } finally {
      setGuardando(false);
    }
  }, [ramaActiva, cargarDatos]);

  const actualizarEtapa = useCallback(async (id: string, datos: EtapaFormData) => {
    setGuardando(true);
    setError(null);
    try {
      await ProgresionService.actualizarEtapa(id, datos);
      setEtapas(prev => prev.map(e =>
        e.id === id ? { ...e, ...datos } : e
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar etapa';
      setError(msg);
      throw err;
    } finally {
      setGuardando(false);
    }
  }, []);

  const eliminarEtapa = useCallback(async (id: string) => {
    setGuardando(true);
    setError(null);
    try {
      await ProgresionService.eliminarEtapa(id);
      setEtapas(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar etapa';
      setError(msg);
      throw err;
    } finally {
      setGuardando(false);
    }
  }, []);

  // --------------------------------------------------------------------------
  // CRUD GRUPOS
  // --------------------------------------------------------------------------

  const crearGrupo = useCallback(async (datos: GrupoFormData) => {
    setGuardando(true);
    setError(null);
    try {
      await ProgresionService.crearGrupoObjetivo({ rama: ramaActiva, ...datos });
      await cargarDatos();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear grupo';
      setError(msg);
      throw err;
    } finally {
      setGuardando(false);
    }
  }, [ramaActiva, cargarDatos]);

  const actualizarGrupo = useCallback(async (id: string, datos: GrupoFormData) => {
    setGuardando(true);
    setError(null);
    try {
      await ProgresionService.actualizarGrupoObjetivo(id, datos);
      setGrupos(prev => prev.map(g =>
        g.id === id ? { ...g, ...datos } : g
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar grupo';
      setError(msg);
      throw err;
    } finally {
      setGuardando(false);
    }
  }, []);

  const eliminarGrupo = useCallback(async (id: string) => {
    setGuardando(true);
    setError(null);
    try {
      await ProgresionService.eliminarGrupoObjetivo(id);
      setGrupos(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar grupo';
      setError(msg);
      throw err;
    } finally {
      setGuardando(false);
    }
  }, []);

  return {
    etapas,
    grupos,
    loading,
    guardando,
    error,
    ramaActiva,
    cargarDatos,
    crearEtapa,
    actualizarEtapa,
    eliminarEtapa,
    crearGrupo,
    actualizarGrupo,
    eliminarGrupo,
    limpiarError,
  };
}

export default useEtapasAdmin;
