import { useCallback, useEffect, useState } from 'react';
import ProgresionService from '../../../services/progresionService';
import type { V4Scout } from '../../Progresion/useProgresionData';

/**
 * Hook mínimo: carga solo la lista de scouts con su progreso.
 * Se activa únicamente cuando `enabled = true` (carga diferida).
 */
export function useScoutsParaPortal(enabled: boolean) {
  const [scouts, setScouts] = useState<V4Scout[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rawScouts = await ProgresionService.obtenerResumenProgresion();
      const mapped: V4Scout[] = (rawScouts as any[]).map((s) => ({
        id: s.scout_id,
        nombre: s.scout_nombre,
        codigo: s.scout_codigo ?? '',
        rama: s.rama ?? '',
        patrulla: s.patrulla_nombre ?? 'Sin patrulla',
        etapaCodigo: s.etapa_actual_codigo ?? 'PISTA',
        etapaNombre: s.etapa_actual_nombre ?? 'Pista',
        progreso: parseFloat((s.progreso_general ?? 0).toFixed(1)),
        objetivosCompletados: s.objetivos_completados ?? 0,
        totalObjetivos: s.total_objetivos ?? 0,
      }));
      setScouts(mapped);
    } catch (e) {
      console.error('useScoutsParaPortal:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && scouts.length === 0) {
      load();
    }
  }, [enabled, load, scouts.length]);

  return { scouts, loading };
}
