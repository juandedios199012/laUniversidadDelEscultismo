import { useEffect, useState } from 'react';
import ProgresionService, {
  EstadisticaEtapa,
  ResumenProgresoScout,
  ProgresoArea,
} from '../../services/progresionService';
import ScoutService from '../../services/scoutService';

// ─── Colores oficiales de áreas de crecimiento ────────────────────────────────
export const AREA_COLORS: Record<string, string> = {
  CORP: '#E31E24',  // Corporalidad – Rojo
  CREA: '#F5C800',  // Creatividad – Amarillo
  CARA: '#0054A6',  // Carácter – Azul
  AFEC: '#808285',  // Afectividad – Gris/Plateado
  SOCI: '#00A651',  // Sociabilidad – Verde
  ESPI: '#D1D3D4',  // Espiritualidad – Blanco/Gris claro
};

export const AREA_NAMES: Record<string, string> = {
  CORP: 'Corporalidad',
  CREA: 'Creatividad',
  CARA: 'Carácter',
  AFEC: 'Afectividad',
  SOCI: 'Sociabilidad',
  ESPI: 'Espiritualidad',
};

export const AREA_ICONS: Record<string, string> = {
  CORP: '💪',
  CREA: '🎨',
  CARA: '🦁',
  AFEC: '❤️',
  SOCI: '🤝',
  ESPI: '✨',
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

export function useProgresionV4Data() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scouts, setScouts] = useState<V4Scout[]>([]);
  const [stageBars, setStageBars] = useState<V4StageBar[]>([]);
  const [areasMap, setAreasMap] = useState<Record<string, ProgresoArea[]>>({});
  const [estadisticas, setEstadisticas] = useState<EstadisticaEtapa[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rawScouts, estadis] = await Promise.all([
        ProgresionService.obtenerResumenProgresion(),
        ProgresionService.obtenerEstadisticasEtapas(),
      ]);

      setEstadisticas(estadis);

      const mapped: V4Scout[] = rawScouts.map((s: ResumenProgresoScout) => ({
        id: s.scout_id,
        nombre: s.scout_nombre,
        codigo: s.scout_codigo ?? '',
        rama: s.rama ?? '',
        patrulla: s.patrulla_nombre ?? 'Sin patrulla',
        etapaCodigo: s.etapa_actual_codigo ?? 'PISTA',
        etapaNombre: s.etapa_actual_nombre ?? 'Pista',
        progreso: Math.round(s.progreso_general ?? 0),
        objetivosCompletados: s.objetivos_completados ?? 0,
        totalObjetivos: s.total_objetivos ?? 0,
      }));
      setScouts(mapped);

      // Build stage bars
      const bars: V4StageBar[] = estadis.map((e) => ({
        etapaCodigo: e.etapa_codigo,
        etapaNombre: e.etapa_nombre,
        totalScouts: e.total_scouts,
        promedioProgreso: Math.round(e.promedio_progreso ?? 0),
      }));
      setStageBars(bars);

      // Load areas for all scouts in parallel (batches of 6)
      const ids = mapped.map((s) => s.id);
      const results = await Promise.allSettled(
        ids.map((id) => ProgresionService.obtenerProgresoScout(id)),
      );
      const map: Record<string, ProgresoArea[]> = {};
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled' && r.value) {
          map[ids[idx]] = r.value.areas ?? [];
        }
      });
      setAreasMap(map);
    } catch (e) {
      setError('No se pudo cargar la información de progresión');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const totalScouts = scouts.length;
  const totalCompletados = scouts.reduce((a, s) => a + s.objetivosCompletados, 0);
  const totalObj = scouts.reduce((a, s) => a + s.totalObjetivos, 0);
  const promedioGlobal = totalObj > 0 ? Math.round((totalCompletados / totalObj) * 100) : 0;
  const etapasActivas = [...new Set(scouts.map((s) => s.etapaCodigo))].length;

  // Global areas (always show all 6 areas, sum across scouts that have data)
  const AREA_ORDER_LIST = ['CORP', 'CREA', 'CARA', 'AFEC', 'SOCI', 'ESPI'];
  const globalAreas: V4AreaData[] = (() => {
    const agg: Record<string, { completados: number; total: number }> = {};
    Object.values(areasMap).forEach((areas) => {
      areas.forEach((a) => {
        if (!agg[a.area_codigo]) agg[a.area_codigo] = { completados: 0, total: 0 };
        agg[a.area_codigo].completados += a.objetivos_completados;
        agg[a.area_codigo].total += a.total_objetivos;
      });
    });
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
        porcentaje: d.total > 0 ? Math.round((d.completados / d.total) * 100) : 0,
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
