import React, { useEffect, useState } from 'react';
import { Award, Calendar, CheckCircle2, Circle, Download, Trophy, Users } from 'lucide-react';
import ProgresionService, { type ObjetivoScout, type ProgresoCompletoScout } from '../../../services/progresionService';
import { ProgressRing } from '../../ProgresionV2/ui/ProgressRing';
import { CardSkeleton } from '../V4Components';
import { STAGE_COLORS, AREA_COLORS, AREA_ICONS, type V4Scout } from '../useProgresionV4Data';

type SubTab = 'resumen' | 'logros' | 'eventos';

interface V4PortalPadresTabProps {
  loading: boolean;
  scouts: V4Scout[];
}

const V4PortalPadresTab: React.FC<V4PortalPadresTabProps> = ({ loading, scouts }) => {
  const [selectedScoutId, setSelectedScoutId] = useState<string>('');
  const [subTab, setSubTab] = useState<SubTab>('resumen');
  const [detalle, setDetalle] = useState<ProgresoCompletoScout | null>(null);
  const [objetivos, setObjetivos] = useState<ObjetivoScout[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const scout = selectedScoutId
    ? scouts.find((s) => s.id === selectedScoutId)
    : scouts[0];

  useEffect(() => {
    if (!selectedScoutId && scouts.length > 0) {
      setSelectedScoutId(scouts[0].id);
    }
  }, [scouts]);

  useEffect(() => {
    if (!scout) return;
    setLoadingDetalle(true);
    Promise.all([
      ProgresionService.obtenerProgresoScout(scout.id),
      ProgresionService.obtenerObjetivosScout(scout.id),
    ]).then(([d, o]) => {
      setDetalle(d);
      setObjetivos(o);
    }).catch(console.error)
      .finally(() => setLoadingDetalle(false));
  }, [scout?.id]);

  const etapaColor = scout ? (STAGE_COLORS[scout.etapaCodigo] ?? '#888') : '#888';
  const objetivosCompletados = objetivos.filter((o) => o.completado);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-800">Portal de Padres</h2>
          <p className="mt-1 text-sm text-gray-500">Seguimiento completo del desarrollo scout de su hijo/a</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition hover:bg-gray-50">
          <Download className="h-4 w-4" />
          Exportar Informe
        </button>
      </div>

      {/* Scout selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Seleccionar Scout:</span>
        <div className="flex flex-wrap gap-2">
          {scouts.slice(0, 8).map((s) => {
            const color = STAGE_COLORS[s.etapaCodigo] ?? '#888';
            const isActive = s.id === (scout?.id ?? '');
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedScoutId(s.id)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  isActive ? 'text-white shadow' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
                style={isActive ? { background: color, borderColor: color } : undefined}
              >
                {s.nombre.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton className="h-40" />
          <CardSkeleton className="h-40" />
        </div>
      ) : !scout ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-gray-400">No hay scouts disponibles</p>
        </div>
      ) : (
        <>
          {/* Scout profile card */}
          <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:flex-nowrap">
            <div className="relative shrink-0">
              <ProgressRing percentage={scout.progreso} size={120} strokeWidth={8} color={etapaColor}>
                <div className="text-center">
                  <span className="block text-xl font-black" style={{ color: etapaColor }}>
                    {scout.progreso}%
                  </span>
                  <span className="text-xs text-gray-400">progreso</span>
                </div>
              </ProgressRing>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-black text-gray-800">{scout.nombre}</h3>
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ background: etapaColor }}
                >
                  {scout.etapaNombre}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{scout.patrulla} · {scout.rama}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Objetivos', value: `${scout.objetivosCompletados}/${scout.totalObjetivos}` },
                  { label: 'Progreso', value: `${scout.progreso}%` },
                  { label: 'Código', value: scout.codigo || '—' },
                  { label: 'Patrulla', value: scout.patrulla },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="mt-1 font-black text-gray-800 truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-2 rounded-xl border border-gray-100 bg-white p-1 shadow-sm w-fit">
            {([
              { id: 'resumen', label: 'Resumen', icon: <Users className="h-4 w-4" /> },
              { id: 'logros', label: 'Logros', icon: <Trophy className="h-4 w-4" /> },
              { id: 'eventos', label: 'Próximos Eventos', icon: <Calendar className="h-4 w-4" /> },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  subTab === tab.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Resumen */}
          {subTab === 'resumen' && (
            <div className="grid gap-6 xl:grid-cols-2">
              {/* Progreso general */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h4 className="text-base font-black text-gray-800">Progreso de Etapa</h4>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold text-gray-600">
                    <span>Progreso General</span>
                    <span style={{ color: etapaColor }}>{scout.progreso}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${scout.progreso}%`, background: etapaColor }}
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs text-gray-400">Objetivos Completados</p>
                    <p className="mt-1 text-2xl font-black text-gray-800">
                      {scout.objetivosCompletados}
                      <span className="text-sm font-normal text-gray-400">/{scout.totalObjetivos}</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs text-gray-400">Etapa Actual</p>
                    <p className="mt-1 text-2xl font-black" style={{ color: etapaColor }}>
                      {scout.etapaNombre}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">Avanzando correctamente</p>
                    <p className="mt-0.5 text-xs text-green-600">
                      {scout.nombre.split(' ')[0]} está progresando en su etapa {scout.etapaNombre}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Áreas de crecimiento */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h4 className="text-base font-black text-gray-800">Áreas de Crecimiento</h4>
                <div className="mt-4 space-y-3">
                  {loadingDetalle ? (
                    [...Array(6)].map((_, i) => <CardSkeleton key={i} className="h-8" />)
                  ) : detalle && detalle.areas.length > 0 ? (
                    detalle.areas.map((area) => {
                      const color = AREA_COLORS[area.area_codigo] ?? area.area_color;
                      const icon = AREA_ICONS[area.area_codigo] ?? area.area_icono;
                      return (
                        <div key={area.area_id} className="flex items-center gap-3">
                          <span className="text-lg w-6 text-center">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="font-semibold text-gray-700">{area.area_nombre}</span>
                              <span style={{ color }}>{area.porcentaje}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                              <div className="h-full rounded-full" style={{ width: `${area.porcentaje}%`, background: color }} />
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 w-12 text-right">
                            {area.objetivos_completados}/{area.total_objetivos}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
                      <Circle className="h-5 w-5 text-gray-300 shrink-0" />
                      <p className="text-sm text-gray-400">
                        Sin datos de áreas — el scout no tiene objetivos asignados en la BD
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Logros */}
          {subTab === 'logros' && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-base font-black text-gray-800">Objetivos Completados</h4>
                <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                  {objetivosCompletados.length} logrados
                </span>
              </div>
              {loadingDetalle ? (
                <div className="mt-4 space-y-3">
                  {[...Array(3)].map((_, i) => <CardSkeleton key={i} className="h-16" />)}
                </div>
              ) : objetivosCompletados.length === 0 ? (
                <div className="mt-6 py-8 text-center">
                  <Trophy className="mx-auto h-10 w-10 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">Aún no hay objetivos completados</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {objetivosCompletados.map((obj) => {
                    const areaColor = AREA_COLORS[obj.area_codigo] ?? '#888';
                    const areaIcon = AREA_ICONS[obj.area_codigo] ?? '●';
                    return (
                      <div key={obj.id} className="flex items-start gap-4 rounded-xl border border-green-100 bg-green-50 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800">{obj.titulo}</p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {areaIcon} {obj.area_nombre}
                            {obj.fecha_completado && ` · ${new Date(obj.fecha_completado).toLocaleDateString('es-PE')}`}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                          style={{ background: `${areaColor}18`, color: areaColor }}>
                          {obj.etapa_nombre}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Eventos */}
          {subTab === 'eventos' && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h4 className="text-base font-black text-gray-800">Próximos Eventos</h4>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  ⚠ Datos de ejemplo — integrar con módulo de Actividades
                </span>
              </div>
              <div className="space-y-4">
                {[
                  { title: 'Reunión Semanal de Tropa', date: 'Sábado', time: '9:00 AM', lugar: 'Sede del Grupo Scout', tipo: 'Regular', color: '#27c664' },
                  { title: 'Evaluación de Objetivos', date: 'Próximo sábado', time: '8:00 AM', lugar: 'Sede del Grupo Scout', tipo: 'Evaluación', color: '#4f8ddb' },
                  { title: 'Campamento Mensual', date: 'Fin de mes', time: 'Todo el día', lugar: 'Parque natural', tipo: 'Campamento', color: '#f59e0b' },
                ].map((evento, i) => (
                  <div key={i} className="flex items-start gap-4 rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ background: evento.color }}
                    >
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{evento.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{evento.date} · {evento.time}</p>
                      <p className="text-xs text-gray-400">{evento.lugar}</p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ background: `${evento.color}18`, color: evento.color }}
                    >
                      {evento.tipo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default V4PortalPadresTab;
