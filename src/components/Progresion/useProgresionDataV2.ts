import { useCallback, useEffect, useRef, useState } from 'react';
import ProgresionService, {
  EstadisticaEtapa,
  ResumenProgresoScout,
  ProgresoArea,
  RamaCodigo,
} from '../../services/progresionService';
import { supabase } from '../../lib/supabase';
import {
  V4Scout,
  V4StageBar,
  V4AreaData,
  AREA_COLORS,
  AREA_NAMES,
  AREA_ICONS,
} from './useProgresionData';

// Re-export constants from v1 so v2 consumers can import them from either hook.
export { AREA_COLORS, AREA_NAMES, AREA_ICONS, STAGE_COLORS, STAGE_ICONS, TREND_MONTHS } from './useProgresionData';
export type { V4Scout, V4StageBar, V4AreaData } from './useProgresionData';

const AREA_ORDER_LIST = ['CORPORALIDAD', 'CREATIVIDAD', 'CARACTER', 'AFECTIVIDAD', 'SOCIABILIDAD', 'ESPIRITUALIDAD'];

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useProgresionDataV2(rama: RamaCodigo) {
  const requestIdRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scouts, setScouts] = useState<V4Scout[]>([]);
  const [stageBars, setStageBars] = useState<V4StageBar[]>([]);
  const [areasMap, setAreasMap] = useState<Record<string, ProgresoArea[]>>({});
  const [estadisticas, setEstadisticas] = useState<EstadisticaEtapa[]>([]);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [rawScouts, estadis] = await Promise.all([
        ProgresionService.obtenerResumenProgresionV2(rama),
        ProgresionService.obtenerEstadisticasEtapasV2(rama),
      ]);

      const mapped: V4Scout[] = rawScouts.map((s: ResumenProgresoScout & { scout_codigo?: string }) => ({
        id:                    s.scout_id,
        nombre:                s.scout_nombre,
        codigo:                s.scout_codigo ?? '',
        rama:                  s.rama ?? '',
        patrulla:              s.patrulla_nombre ?? 'Sin patrulla',
        etapaCodigo:           s.etapa_actual_codigo ?? 'PISTA',
        etapaNombre:           s.etapa_actual_nombre ?? 'Pista',
        progreso:              parseFloat((s.progreso_general ?? 0).toFixed(1)),
        objetivosCompletados:  s.objetivos_completados ?? 0,
        totalObjetivos:        s.total_objetivos ?? 0,
      }));

      const bars: V4StageBar[] = estadis.map((e) => ({
        etapaCodigo:      e.etapa_codigo,
        etapaNombre:      e.etapa_nombre,
        totalScouts:      e.total_scouts,
        promedioProgreso: Math.round(e.promedio_progreso ?? 0),
      }));

      // Cargar áreas por scout
      const ids = mapped.map((s) => s.id);
      const results = await Promise.allSettled(
        ids.map((id) => ProgresionService.obtenerObjetivosScout(id)),
      );
      const map: Record<string, ProgresoArea[]> = {};
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled' && r.value.length > 0) {
          const objs = r.value;
          const areaMap = new Map<string, ProgresoArea>();
          objs.forEach((obj) => {
            if (!areaMap.has(obj.area_codigo)) {
              areaMap.set(obj.area_codigo, {
                area_id:               obj.area_codigo,
                area_codigo:           obj.area_codigo,
                area_nombre:           obj.area_nombre,
                area_icono:            obj.area_icono,
                area_color:            obj.area_color,
                area_orden:            0,
                total_objetivos:       0,
                objetivos_completados: 0,
                porcentaje:            0,
              });
            }
            const a = areaMap.get(obj.area_codigo)!;
            a.total_objetivos++;
            if (obj.completado) a.objetivos_completados++;
            a.porcentaje = a.total_objetivos > 0
              ? parseFloat(((a.objetivos_completados / a.total_objetivos) * 100).toFixed(1))
              : 0;
          });
          map[ids[idx]] = Array.from(areaMap.values());
        }
      });

      if (requestId !== requestIdRef.current) return;

      setEstadisticas(estadis);
      setScouts(mapped);
      setStageBars(bars);
      setAreasMap(map);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError('No se pudo cargar la información de progresión');
      console.error(e);
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, [rama]);

  // Reload cuando cambia la rama
  useEffect(() => { load(); }, [load]);

  // Realtime subscriptions
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleReload = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => { load(); }, 250);
    };

    const channel = supabase
      .channel(`progresion-v5-realtime-${rama}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'progreso_scout' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scout_etapa' }, scheduleReload)
      .subscribe();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [load, rama]);

  // ── Derived (same logic as useProgresionData) ─────────────────────────────
  const totalScouts     = scouts.length;
  const totalCompletados = scouts.reduce((a, s) => a + s.objetivosCompletados, 0);
  const totalObj         = scouts.reduce((a, s) => a + s.totalObjetivos, 0);
  const promedioGlobal   = totalObj > 0 ? parseFloat(((totalCompletados / totalObj) * 100).toFixed(1)) : 0;
  const etapasActivas    = [...new Set(scouts.map((s) => s.etapaCodigo))].length;

  const globalAreas: V4AreaData[] = (() => {
    const agg: Record<string, { completados: number; total: number }> = {};
    Object.values(areasMap).forEach((areas) => {
      areas.forEach((a) => {
        if (!agg[a.area_codigo]) agg[a.area_codigo] = { completados: 0, total: 0 };
        agg[a.area_codigo].completados += a.objetivos_completados;
        agg[a.area_codigo].total       += a.total_objetivos;
      });
    });
    return AREA_ORDER_LIST.map((codigo) => {
      const d = agg[codigo] ?? { completados: 0, total: 0 };
      return {
        codigo,
        nombre:      AREA_NAMES[codigo]  ?? codigo,
        color:       AREA_COLORS[codigo] ?? '#888',
        icon:        AREA_ICONS[codigo]  ?? '●',
        completados: d.completados,
        total:       d.total,
        porcentaje:  d.total > 0 ? parseFloat(((d.completados / d.total) * 100).toFixed(1)) : 0,
      };
    });
  })();

  const scoutsWithAreas: V4Scout[] = scouts.map((s) => ({
    ...s,
    areas: areasMap[s.id],
  }));

  return {
    loading,
    error,
    scouts: scoutsWithAreas,
    stageBars,
    estadisticas,
    globalAreas,
    totalScouts,
    promedioGlobal,
    totalCompletados,
    totalObj,
    etapasActivas,
    reload: load,
  };
}

export default useProgresionDataV2;
