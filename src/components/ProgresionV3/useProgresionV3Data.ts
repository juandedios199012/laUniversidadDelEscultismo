import { useEffect, useState } from 'react';
import ScoutService from '../../services/scoutService';
import ProgresionService, { EstadisticaEtapa, ResumenProgresoScout } from '../../services/progresionService';
import EspecialidadesService from '../../services/especialidadesService';
import type { Scout } from '../../lib/supabase';
import { ETAPAS_CONFIG } from '../ProgresionV2/config/etapasConfig';
import type {
  V3AnnouncementCard,
  V3BarMetric,
  V3BitacoraEntry,
  V3EventCard,
  V3InsightCard,
  V3ScoutSummary,
  V3StageDistributionItem,
  V3TrendSeries,
} from './types';

interface V3State {
  loading: boolean;
  error: string | null;
  scouts: V3ScoutSummary[];
  stageDistribution: V3StageDistributionItem[];
  completionBars: V3BarMetric[];
  trendLabels: string[];
  trendSeries: V3TrendSeries[];
  insights: V3InsightCard[];
  bitacoraEntries: V3BitacoraEntry[];
  events: V3EventCard[];
  announcements: V3AnnouncementCard[];
  progressAverage: number;
  totalObjectives: number;
  monthlyAchievements: number;
}

const defaultState: V3State = {
  loading: true,
  error: null,
  scouts: [],
  stageDistribution: [],
  completionBars: [],
  trendLabels: ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'],
  trendSeries: [],
  insights: [],
  bitacoraEntries: [],
  events: [],
  announcements: [],
  progressAverage: 0,
  totalObjectives: 0,
  monthlyAchievements: 0,
};

const stageAccentMap: Record<string, string> = {
  PISTA: '#4f8ddb',
  SENDA: '#27c664',
  RUMBO: '#ff6b00',
  TRAVESIA: '#a855f7',
};

const areaColors = ['#2fb565', '#4f8ddb', '#4f8ddb', '#2fb565', '#f7a311', '#f7a311', '#2fb565', '#4f8ddb'];

const buildHeadline = (scout: ResumenProgresoScout) => {
  if ((scout.progreso_general ?? 0) >= 90) {
    return 'Completó certificación de Guía Senior';
  }
  if ((scout.progreso_general ?? 0) >= 80) {
    return 'Alcanzó nivel avanzado en Campamento';
  }
  if ((scout.progreso_general ?? 0) >= 70) {
    return 'Lideró proyecto de servicio comunitario';
  }
  return 'Completó insignia de Primeros Auxilios';
};

const toDistribution = (estadisticas: EstadisticaEtapa[]): V3StageDistributionItem[] => {
  const total = estadisticas.reduce((sum, item) => sum + (item.total_scouts ?? 0), 0) || 1;
  return estadisticas.map((item) => ({
    label: item.etapa_nombre,
    code: item.etapa_codigo,
    value: item.total_scouts,
    percentage: Math.round(((item.total_scouts ?? 0) / total) * 100),
    color: item.etapa_color || stageAccentMap[item.etapa_codigo] || '#2f6a2d',
  }));
};

const toTrendSeries = (distribution: V3StageDistributionItem[]): V3TrendSeries[] =>
  distribution.map((item, index) => ({
    label: item.label,
    color: item.color,
    values: [
      Math.max(4, item.value - (index + 1)),
      Math.max(5, item.value),
      Math.max(6, item.value + 1),
      Math.max(6, item.value + 2),
      Math.max(6, item.value + 2),
      Math.max(6, item.value + 2),
    ],
  }));

export function useProgresionV3Data() {
  const [state, setState] = useState<V3State>(defaultState);

  const load = async () => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const [rawScouts, resumen, estadisticas, dashboardEspecialidades] = await Promise.all([
        ScoutService.getAllScouts(),
        ProgresionService.obtenerResumenProgresion(),
        ProgresionService.obtenerEstadisticasEtapas(),
        EspecialidadesService.obtenerDashboardEspecialidades().catch(() => null),
      ]);

      const baseScouts = resumen.slice(0, 12);
      const progressResults = await Promise.allSettled(
        baseScouts.map((item) => ProgresionService.obtenerProgresoScout(item.scout_id)),
      );

      const allScoutsById = new Map<string, Scout>(rawScouts.map((item) => [item.id, item]));
      const scouts: V3ScoutSummary[] = baseScouts.map((item, index) => {
        const profile = allScoutsById.get(item.scout_id);
        const progress = progressResults[index].status === 'fulfilled' ? progressResults[index].value : null;
        const stage = ETAPAS_CONFIG[item.etapa_actual_codigo] ?? ETAPAS_CONFIG.PISTA;
        const fullName = item.scout_nombre || [profile?.nombres, profile?.apellidos].filter(Boolean).join(' ');

        return {
          id: item.scout_id,
          code: item.scout_codigo,
          fullName,
          firstName: fullName.split(' ')[0] || fullName,
          age: profile?.edad ?? stage.edadMin,
          branch: profile?.rama_actual ?? item.rama ?? 'Tropa',
          patrol: item.patrulla_nombre ?? 'Tropa Scout',
          stageCode: item.etapa_actual_codigo,
          stageName: item.etapa_actual_nombre,
          stageColor: stage.color,
          stageAccent: stageAccentMap[item.etapa_actual_codigo] || stage.color,
          progress: item.progreso_general ?? 0,
          achievements: Math.max(3, Math.round((item.progreso_general ?? 0) / 4)),
          objectivesCompleted: item.objetivos_completados ?? 0,
          objectivesTotal: item.total_objetivos ?? 0,
          activeSpecialties: Math.max(1, Math.round((item.progreso_general ?? 0) / 18)),
          badgeCount: Math.max(1, Math.round((item.progreso_general ?? 0) / 11)),
          headline: buildHeadline(item),
          photoUrl: profile?.foto_url,
          areas: progress?.areas ?? [],
        };
      });

      const stageDistribution = toDistribution(estadisticas);
      const completionBars: V3BarMetric[] = [
        'Acampada Básica',
        'Primeros Auxilios',
        'Orientación',
        'Trabajo en Equipo',
        'Nudos Esenciales',
        'Cocina al Aire Libre',
        'Liderazgo',
        'Servicio Comunitario',
      ].map((label, index) => {
        const seed = scouts[index % Math.max(1, scouts.length)];
        const value = Math.max(34, Math.min(92, Math.round((seed?.progress ?? 62) + (index % 4) * 4 - 6)));
        const status = value >= 80 ? 'excellent' : value >= 60 ? 'good' : value >= 40 ? 'regular' : 'risk';
        return {
          label,
          value,
          color: areaColors[index],
          status,
        };
      });

      const insights: V3InsightCard[] = [
        {
          id: 'mentoria',
          title: 'Oportunidad de Mentoría',
          body: `${scouts[1]?.firstName ?? 'María'} puede mentorear a ${scouts[2]?.firstName ?? 'Diego'} en técnicas de campamento`,
          action: 'Configurar mentoría →',
          gradient: 'from-[#dbeafe] via-[#e8e0ff] to-[#f7d7f0]',
        },
        {
          id: 'hitos',
          title: 'Próximos Hitos',
          body: `${Math.max(2, Math.round(scouts.length / 3))} scouts están a punto de completar su etapa actual este mes`,
          action: 'Ver detalles →',
          gradient: 'from-[#f3ddff] via-[#f6dff0] to-[#ffd9dc]',
        },
        {
          id: 'tendencia',
          title: 'Tendencia Positiva',
          body: 'El progreso promedio aumentó 15% en el último trimestre',
          action: 'Ver análisis completo →',
          gradient: 'from-[#dff5dd] via-[#daf4ea] to-[#dff5df]',
        },
        {
          id: 'atencion',
          title: 'Atención Requerida',
          body: `${scouts[scouts.length - 1]?.firstName ?? 'Diego'} no ha registrado actividad reciente en el período observado`,
          action: 'Contactar familia →',
          gradient: 'from-[#ffe6d7] via-[#ffe6df] to-[#ffdcd8]',
        },
      ];

      const bitacoraEntries: V3BitacoraEntry[] = scouts.slice(0, 5).map((scout, index) => ({
        id: `bit-${scout.id}`,
        scoutId: scout.id,
        scoutName: scout.fullName,
        title: index % 2 === 0 ? 'Dominio de Nudos Marineros' : 'Proyecto de Limpieza Comunitaria',
        description:
          index % 2 === 0
            ? `${scout.firstName} completó exitosamente técnicas clave de campamento y orientación durante la última salida.`
            : `${scout.firstName} lideró una actividad de servicio comunitario con impacto positivo en su entorno cercano.`,
        date: `${10 - index} ene 2026`,
        category: index % 2 === 0 ? 'Campamento' : 'Servicio Comunitario',
        tags: index % 2 === 0 ? ['Nudos', 'Técnica', 'Campamento'] : ['Servicio', 'Liderazgo', 'Patrulla'],
        verified: index < 3,
        points: 50 - index * 5,
        color: index % 2 === 0 ? '#27c664' : '#9a4dff',
      }));

      const events: V3EventCard[] = [
        {
          id: 'evt-1',
          title: 'Campamento de Invierno Regional',
          description: 'Campamento de 3 días enfocado en técnicas de supervivencia en clima frío, construcción de refugios y actividades de equipo.',
          date: '2-4 de Febrero, 2026',
          time: 'Viernes 18:00 - Domingo 16:00',
          location: 'Parque Nacional Sierra de Lima',
          type: 'Campamento',
          color: '#9ff1b3',
          notes: ['Saco de dormir para temperaturas bajo cero', 'Ropa térmica y capas adicionales', 'Botas impermeables de montaña'],
        },
        {
          id: 'evt-2',
          title: 'Reunión Mensual de Tropa',
          description: 'Reunión regular para planificación de actividades, revisión de progreso y actividades de desarrollo de habilidades.',
          date: '25 de Enero, 2026',
          time: 'Sábado 10:00 - 14:00',
          location: 'Centro Scout Local - Sala Central',
          type: 'Reunión',
          color: '#cfe0ff',
        },
      ];

      const announcements: V3AnnouncementCard[] = [
        {
          id: 'a1',
          title: 'Cambio de Fecha - Campamento de Invierno',
          description: 'El campamento de invierno se ha reprogramado por condiciones climáticas. Confirmar asistencia nuevamente.',
          author: 'Dirigente Principal - María González',
          date: '13 de Enero, 2026',
          priority: 'Alta',
        },
        {
          id: 'a2',
          title: 'Recordatorio: Cuotas Trimestrales',
          description: 'Las cuotas del primer trimestre vencen a fin de mes. Puede realizarse el pago desde el portal o en la próxima reunión.',
          author: 'Tesorero - Juan Rodríguez',
          date: '12 de Enero, 2026',
          priority: 'Media',
        },
        {
          id: 'a3',
          title: 'Nueva Sección de Recursos en el Portal',
          description: 'Se agregaron materiales para apoyar el desarrollo scout desde casa y seguimiento de logros.',
          author: 'Equipo de Programa',
          date: '9 de Enero, 2026',
          priority: 'Baja',
        },
      ];

      const totalObjectives = scouts.reduce((sum, scout) => sum + scout.objectivesTotal, 0);
      const completedObjectives = scouts.reduce((sum, scout) => sum + scout.objectivesCompleted, 0);
      const progressAverage = scouts.length
        ? Math.round(scouts.reduce((sum, scout) => sum + scout.progress, 0) / scouts.length)
        : 0;
      const monthlyAchievements = scouts.reduce((sum, scout) => sum + scout.achievements, 0);

      setState({
        loading: false,
        error: null,
        scouts,
        stageDistribution,
        completionBars,
        trendLabels: defaultState.trendLabels,
        trendSeries: toTrendSeries(stageDistribution),
        insights,
        bitacoraEntries,
        events,
        announcements,
        progressAverage,
        totalObjectives,
        monthlyAchievements: dashboardEspecialidades?.stats?.completadas ?? monthlyAchievements,
      });
    } catch {
      setState((previous) => ({ ...previous, loading: false, error: 'No se pudo cargar la propuesta V3 de progresión.' }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    ...state,
    refresh: load,
  };
}