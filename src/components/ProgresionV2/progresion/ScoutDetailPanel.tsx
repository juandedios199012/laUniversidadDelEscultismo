/**
 * ScoutDetailPanel V2 – Detalle de progresión de un scout
 * Vista de áreas de crecimiento y objetivos completados/pendientes
 */
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Circle, RefreshCw } from 'lucide-react';
import ProgresionService, {
  ProgresoCompletoScout,
  ObjetivoScout,
} from '../../../services/progresionService';
import { GlassCard } from '../ui/GlassCard';
import { ProgressRing } from '../ui/ProgressRing';
import { StageBadge } from '../ui/StageBadge';
import { AREAS_CONFIG } from '../config/etapasConfig';

interface ScoutDetailPanelProps {
  scoutId: string;
  onBack: () => void;
}

export const ScoutDetailPanelV2: React.FC<ScoutDetailPanelProps> = ({ scoutId, onBack }) => {
  const [progreso, setProgreso] = useState<ProgresoCompletoScout | null>(null);
  const [objetivos, setObjetivos] = useState<ObjetivoScout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areaActiva, setAreaActiva] = useState('');
  const [toggleObjetivoId, setToggleObjetivoId] = useState<string | null>(null);

  useEffect(() => { cargar(); }, [scoutId]);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, objs] = await Promise.all([
        ProgresionService.obtenerProgresoScout(scoutId),
        ProgresionService.obtenerObjetivosScout(scoutId),
      ]);
      setProgreso(p);
      setObjetivos(objs);
      if (p?.areas?.[0]) setAreaActiva(p.areas[0].area_codigo);
    } catch {
      setError('No se pudo cargar el detalle del scout');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleObjetivo = async (obj: ObjetivoScout) => {
    setToggleObjetivoId(obj.id);
    try {
      if (obj.completado) {
        await ProgresionService.desmarcarObjetivo(scoutId, obj.id);
      } else {
        await ProgresionService.completarObjetivo(scoutId, obj.id);
      }
      await cargar();
    } catch {
      // silently fail – UI reverts
    } finally {
      setToggleObjetivoId(null);
    }
  };

  const etapaCodigo = progreso?.etapa_actual_codigo ?? 'PISTA';

  const objetivosArea = objetivos.filter(
    (o) => !areaActiva || o.area_codigo === areaActiva,
  );

  return (
    <div className="min-h-screen bg-[#060d1a] text-white p-6 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <div>
          <h1 className="text-2xl font-black text-white">
            {progreso?.scout_nombre ?? '…'}
          </h1>
          {progreso && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <StageBadge etapaCodigo={etapaCodigo} size="sm" />
              <span className="text-white/40 text-xs">
                Desde {progreso.fecha_inicio_etapa}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={cargar}
          disabled={loading}
          className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : progreso && (
        <>
          {/* Resumen general */}
          <GlassCard className="flex items-center gap-6 flex-wrap">
            <ProgressRing
              percentage={progreso.progreso_general}
              size={110}
              strokeWidth={8}
              color="#00e5ff"
            >
              <div className="text-center">
                <div className="text-xl font-black text-cyan-400">
                  {Math.round(progreso.progreso_general)}%
                </div>
              </div>
            </ProgressRing>
            <div>
              <p className="text-3xl font-black text-white">
                {progreso.objetivos_completados}
                <span className="text-white/30 text-lg"> / {progreso.total_objetivos}</span>
              </p>
              <p className="text-white/50 text-sm mt-1">objetivos completados</p>
              <p className="text-white/30 text-xs mt-2">
                Etapa: {progreso.etapa_actual_nombre} · {progreso.grupo_objetivo_nombre ?? ''}
              </p>
            </div>
          </GlassCard>

          {/* Áreas de crecimiento */}
          <section>
            <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4">
              Áreas de Crecimiento
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {progreso.areas.map((area) => {
                const cfg = AREAS_CONFIG[area.area_codigo];
                const isActive = areaActiva === area.area_codigo;
                return (
                  <GlassCard
                    key={area.area_id}
                    hoverable
                    glowColor={isActive ? (cfg?.color ?? area.area_color) : undefined}
                    onClick={() => setAreaActiva(area.area_codigo)}
                    className={`cursor-pointer ${isActive ? 'ring-1' : ''}`}
                    style={{ borderColor: isActive ? `${cfg?.color ?? area.area_color}60` : undefined } as React.CSSProperties}
                  >
                    <div className="flex items-center gap-3">
                      <ProgressRing
                        percentage={area.porcentaje}
                        size={50}
                        strokeWidth={4}
                        color={cfg?.color ?? area.area_color}
                      >
                        <span className="text-base">{cfg?.icon ?? area.area_icono}</span>
                      </ProgressRing>
                      <div className="min-w-0">
                        <p
                          className="text-xs font-bold truncate"
                          style={{ color: cfg?.color ?? area.area_color }}
                        >
                          {area.area_nombre}
                        </p>
                        <p className="text-xs text-white/40">
                          {area.objetivos_completados}/{area.total_objetivos}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </section>

          {/* Objetivos del área seleccionada */}
          {areaActiva && (
            <section>
              <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4">
                Objetivos · {AREAS_CONFIG[areaActiva]?.nombre ?? areaActiva}
              </h2>
              <div className="space-y-3">
                {objetivosArea.length === 0 ? (
                  <GlassCard className="text-center py-8 text-white/30 text-sm">
                    No hay objetivos registrados para esta área
                  </GlassCard>
                ) : (
                  objetivosArea.map((obj) => {
                    const areaColor = AREAS_CONFIG[obj.area_codigo]?.color ?? obj.area_color;
                    const isLoading = toggleObjetivoId === obj.id;
                    return (
                      <GlassCard
                        key={obj.id}
                        hoverable
                        className="flex items-start gap-4"
                      >
                        <button
                          onClick={() => handleToggleObjetivo(obj)}
                          disabled={isLoading}
                          className="flex-shrink-0 mt-0.5 transition-opacity"
                          style={{ opacity: isLoading ? 0.5 : 1 }}
                        >
                          {obj.completado ? (
                            <CheckCircle2
                              className="w-6 h-6"
                              style={{ color: areaColor }}
                            />
                          ) : (
                            <Circle className="w-6 h-6 text-white/20" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium leading-snug ${
                              obj.completado ? 'line-through text-white/40' : 'text-white'
                            }`}
                          >
                            {obj.titulo}
                          </p>
                          <p className="text-xs text-white/30 font-mono mt-1">{obj.codigo}</p>
                          {obj.observaciones && (
                            <p className="text-xs text-white/40 mt-1 italic">
                              "{obj.observaciones}"
                            </p>
                          )}
                          {obj.fecha_completado && (
                            <p className="text-xs text-white/30 mt-1">
                              Completado: {obj.fecha_completado}
                            </p>
                          )}
                        </div>
                        {obj.completado && (
                          <span
                            className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: `${areaColor}20`,
                              color: areaColor,
                            }}
                          >
                            ✓ Logrado
                          </span>
                        )}
                      </GlassCard>
                    );
                  })
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
