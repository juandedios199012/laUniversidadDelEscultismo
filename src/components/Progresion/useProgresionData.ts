import { useCallback, useEffect, useRef, useState } from 'react';
import ProgresionService, {
  EstadisticaEtapa,
  ResumenProgresoScout,
  ProgresoArea,
} from '../../services/progresionService';
import { supabase } from '../../lib/supabase';

// ─── Colores oficiales de áreas de crecimiento ────────────────────────────────
// Claves = codigo real en BD (areas_crecimiento.codigo)
export const AREA_COLORS: Record<string, string> = {
  CORPORALIDAD:   '#E31E24',
  CREATIVIDAD:    '#F5C800',
  CARACTER:       '#0054A6',
  AFECTIVIDAD:    '#808285',
  SOCIABILIDAD:   '#00A651',
  ESPIRITUALIDAD: '#D1D3D4',
};

export const AREA_NAMES: Record<string, string> = {
  CORPORALIDAD:   'Corporalidad',
  CREATIVIDAD:    'Creatividad',
  CARACTER:       'Carácter',
  AFECTIVIDAD:    'Afectividad',
  SOCIABILIDAD:   'Sociabilidad',
  ESPIRITUALIDAD: 'Espiritualidad',
};

export const AREA_ICONS: Record<string, string> = {
  CORPORALIDAD:   '💪',
  CREATIVIDAD:    '🎨',
  CARACTER:       '🦁',
  AFECTIVIDAD:    '❤️',
  SOCIABILIDAD:   '🤝',
  ESPIRITUALIDAD: '✨',
};

// ─── Colores de etapas ────────────────────────────────────────────────────────
export const STAGE_COLORS: Record<string, string> = {
  PISTA:    '#4f8ddb',
  SENDA:    '#27c664',
  RUMBO:    '#f59e0b',
  TRAVESIA: '#a855f7',
};

export const STAGE_ICONS: Record<string, string> = {
  PISTA:    '🔍',
  SENDA:    '🌿',
  RUMBO:    '⭐',
  TRAVESIA: '🏔️',
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface V4Scout {
  id: string;
  nombre: string;
  codigo: string;
  rama: string;
  patrulla: string;
  etapaCodigo: string;
  etapaNombre: string;
  progreso: number;
  objetivosCompletados: number;
  totalObjetivos: number;
  areas?: ProgresoArea[];
}

export interface V4StageBar {
  etapaCodigo: string;
  etapaNombre: string;
  totalScouts: number;
  promedioProgreso: number;
}

export interface V4AreaData {
  codigo: string;
  nombre: string;
  color: string;
  icon: string;
  porcentaje: number;
  completados: number;
  total: number;
}

// ─── Colores por mes para la tendencia ───────────────────────────────────────
export const TREND_MONTHS = ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];

export function useProgresionData() {
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
        ProgresionService.obtenerResumenProgresion(),
        ProgresionService.obtenerEstadisticasEtapas(),
      ]);

      const mapped: V4Scout[] = rawScouts.map((s: ResumenProgresoScout) => ({
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

      const bars: V4StageBar[] = estadis.map((e) => ({
        etapaCodigo: e.etapa_codigo,
        etapaNombre: e.etapa_nombre,
        totalScouts: e.total_scouts,
        promedioProgreso: Math.round(e.promedio_progreso ?? 0),
      }));

      const ids = mapped.map((s) => s.id);
      // Use obtenerObjetivosScout (reliable, uses etapa_id) instead of
      // obtenerProgresoScout which depends on etapa_objetivo_grupo_id (NULL → 0/0)
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
                area_id: obj.area_codigo,
                area_codigo: obj.area_codigo,
                area_nombre: obj.area_nombre,
                area_icono: obj.area_icono,
                area_color: obj.area_color,
                area_orden: 0,
                total_objetivos: 0,
                objetivos_completados: 0,
                porcentaje: 0,
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

      // Diagnóstico temporal — áreas cargadas por scout
      const totalAreasEntries = Object.keys(map).length;
      const sampleAreas = Object.values(map)[0];
      console.log('[ProgresionV4] areasMap:', totalAreasEntries, 'scouts. area_codigos BD:',
        sampleAreas?.map(a => `${a.area_codigo}(total:${a.total_objetivos}, comp:${a.objetivos_completados})`));

      // Keep all sections in sync: ignore stale responses from previous reloads.
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
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleReload = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        load();
      }, 250);
    };

    const channel = supabase
      .channel('progresion-v4-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'progreso_scout' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scout_etapa' }, scheduleReload)
      .subscribe();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [load]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const totalScouts = scouts.length;
  const totalCompletados = scouts.reduce((a, s) => a + s.objetivosCompletados, 0);
  const totalObj = scouts.reduce((a, s) => a + s.totalObjetivos, 0);
  const promedioGlobal = totalObj > 0 ? parseFloat(((totalCompletados / totalObj) * 100).toFixed(1)) : 0;
  const etapasActivas = [...new Set(scouts.map((s) => s.etapaCodigo))].length;

  // Global areas (always show all 6 areas, sum across scouts that have data)
  // Orden según areas_crecimiento.orden en BD
  const AREA_ORDER_LIST = ['CORPORALIDAD', 'CREATIVIDAD', 'CARACTER', 'AFECTIVIDAD', 'SOCIABILIDAD', 'ESPIRITUALIDAD'];
  const globalAreas: V4AreaData[] = (() => {
    const agg: Record<string, { completados: number; total: number }> = {};
    Object.values(areasMap).forEach((areas) => {
      areas.forEach((a) => {
        if (!agg[a.area_codigo]) agg[a.area_codigo] = { completados: 0, total: 0 };
        agg[a.area_codigo].completados += a.objetivos_completados;
        agg[a.area_codigo].total += a.total_objetivos;
      });
    });
    // Log para diagnóstico — muestra qué claves hay en agg vs AREA_ORDER_LIST
    console.log('[ProgresionV4] agg keys (claves BD):', Object.keys(agg), '| esperadas:', AREA_ORDER_LIST);
    // Always return all 6 canonical areas, even with 0 data
    return AREA_ORDER_LIST.map((codigo) => {
      const d = agg[codigo] ?? { completados: 0, total: 0 };
      return {
        codigo,
        nombre: AREA_NAMES[codigo] ?? codigo,
        color: AREA_COLORS[codigo] ?? '#888',
        icon: AREA_ICONS[codigo] ?? '●',
        completados: d.completados,
        total: d.total,
        porcentaje: d.total > 0 ? parseFloat(((d.completados / d.total) * 100).toFixed(1)) : 0,
      };
    });
  })();

  // Scouts enriched with areas
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
