import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, CalendarRange, CheckCircle2, Clock3, Copy, Link2, Loader2, Plus, RefreshCw, Search, Sparkles, Target, Trash2 } from 'lucide-react';
import { usePermissions } from '../../contexts/PermissionsContext';
import {
  ActividadPlan,
  EstadoPlanTrimestral,
  PlanTrimestral,
  PlanificacionService,
  PropuestaActividad,
  TokenPatrulla,
} from '../../services/planificacionService';
import TableroPlanificacion from './TableroPlanificacion';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

// Mismas ramas que usa el módulo Patrullas (src/components/Patrullas/Patrullas.tsx) —
// `patrullas.rama` es texto libre, no el enum rama_enum de la instalación original.
const RAMAS = ['Manada', 'Tropa', 'Comunidad', 'Clan'];

const FASES: { estado: EstadoPlanTrimestral; label: string }[] = [
  { estado: 'PROPUESTAS_ABIERTAS', label: '1. Propuestas' },
  { estado: 'VOTACION', label: '2. Votación' },
  { estado: 'VIGENTE', label: '3. Plan vigente' },
  { estado: 'CERRADO', label: '4. Cerrado' },
];

function MetricCard({
  title,
  value,
  caption,
  accent,
}: {
  title: string;
  value: string | number;
  caption: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{title}</span>
        <span className={`h-2.5 w-2.5 rounded-full ${accent}`} aria-hidden="true" />
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <p className="mt-1 text-xs text-slate-500">{caption}</p>
    </div>
  );
}

function PhasePill({ estado }: { estado?: EstadoPlanTrimestral }) {
  const map: Record<EstadoPlanTrimestral, { label: string; className: string }> = {
    PROPUESTAS_ABIERTAS: { label: 'Propuestas', className: 'bg-violet-100 text-violet-700 border-violet-200' },
    VOTACION: { label: 'Votación', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    VIGENTE: { label: 'Plan vigente', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    CERRADO: { label: 'Cerrado', className: 'bg-slate-200 text-slate-700 border-slate-300' },
  };

  const phase = estado ? map[estado] : map.PROPUESTAS_ABIERTAS;

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${phase.className}`}>{phase.label}</span>;
}

function MobileAgendaList({
  actividades,
  onEditarActividad,
}: {
  actividades: ActividadPlan[];
  onEditarActividad: (actividad: ActividadPlan) => void;
}) {
  const estadoClasses: Record<string, string> = {
    CONFIRMADA: 'bg-emerald-100 text-emerald-700',
    MODIFICADA: 'bg-amber-100 text-amber-700',
    CANCELADA: 'bg-rose-100 text-rose-700',
    REEMPLAZADA: 'bg-violet-100 text-violet-700',
  };

  if (actividades.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
        No hay actividades para mostrar con los filtros actuales.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actividades.map((actividad) => (
        <button
          key={actividad.id}
          type="button"
          onClick={() => onEditarActividad(actividad)}
          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{actividad.titulo}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {new Date(actividad.fecha + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                {actividad.fecha_fin && actividad.fecha_fin !== actividad.fecha ? ` - ${new Date(actividad.fecha_fin + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}` : ''}
              </p>
            </div>
            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${estadoClasses[actividad.estado] ?? 'bg-slate-100 text-slate-600'}`}>
              {actividad.estado}
            </span>
          </div>

          <div className="mt-2 space-y-1 text-[11px] text-slate-600">
            {actividad.lugar && <p>📍 {actividad.lugar}</p>}
            {actividad.patrulla_origen_nombre && <p>👥 {actividad.patrulla_origen_nombre}</p>}
          </div>
        </button>
      ))}
    </div>
  );
}

export default function PlanificacionPage() {
  const { can, puedeAcceder } = usePermissions();
  const [ramaFiltro, setRamaFiltro] = useState('Tropa');
  const [busqueda, setBusqueda] = useState('');
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [vistaMobile, setVistaMobile] = useState<'tablero' | 'lista'>('tablero');
  const [planes, setPlanes] = useState<PlanTrimestral[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanTrimestral | null>(null);
  const [propuestas, setPropuestas] = useState<PropuestaActividad[]>([]);
  const [actividades, setActividades] = useState<ActividadPlan[]>([]);
  const [conteoVotos, setConteoVotos] = useState<Record<string, Record<string, number>>>({});
  const [tokens, setTokens] = useState<TokenPatrulla[]>([]);
  const [loading, setLoading] = useState(false);
  const [avanzando, setAvanzando] = useState(false);

  const [modalNuevoPlan, setModalNuevoPlan] = useState(false);
  const [modalLinks, setModalLinks] = useState(false);
  const [modalActividad, setModalActividad] = useState<ActividadPlan | null>(null);
  const [modalNuevaActividadFecha, setModalNuevaActividadFecha] = useState<string | null>(null);

  const cargarPlanes = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await PlanificacionService.listarPlanes(ramaFiltro);
      setPlanes(lista);
      if (lista.length > 0 && !lista.find((p) => p.id === planId)) {
        setPlanId(lista[0].id);
      } else if (lista.length === 0) {
        setPlanId(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar los planes trimestrales');
    } finally {
      setLoading(false);
    }
  }, [ramaFiltro]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarDetallePlan = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [p, props, acts, votos, toks] = await Promise.all([
        PlanificacionService.obtenerPlan(id),
        PlanificacionService.listarPropuestas(id),
        PlanificacionService.listarActividades(id),
        PlanificacionService.listarConteoVotos(id),
        PlanificacionService.listarTokens(id),
      ]);
      if (!p) {
        // El plan seleccionado ya no existe (borrado, o quedó desincronizado
        // del filtro de rama) — limpiamos la selección en vez de mostrar un
        // tablero con datos parciales.
        toast.error('Ese plan ya no existe. Selecciona otro.');
        setPlan(null);
        setPlanId(null);
        return;
      }
      setPlan(p);
      setPropuestas(props);
      setActividades(acts);
      setConteoVotos(votos);
      setTokens(toks);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar el plan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarPlanes(); }, [cargarPlanes]);
  useEffect(() => { if (planId) cargarDetallePlan(planId); }, [planId, cargarDetallePlan]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const refrescarDetalle = useCallback(() => { if (planId) cargarDetallePlan(planId); }, [planId, cargarDetallePlan]);

  const metricas = useMemo(() => {
    const totalVotos = Object.values(conteoVotos).reduce(
      (sum, fechaConteo) => sum + Object.values(fechaConteo).reduce((acc, votos) => acc + votos, 0),
      0,
    );

    const propuestasActivas = propuestas.filter((propuesta) => {
      if (!busqueda.trim()) return true;
      const haystack = `${propuesta.titulo} ${propuesta.patrulla_nombre ?? ''} ${propuesta.descripcion ?? ''} ${propuesta.lugar_sugerido ?? ''}`.toLowerCase();
      return haystack.includes(busqueda.trim().toLowerCase());
    }).length;

    return {
      propuestas: propuestasActivas,
      actividades: actividades.filter((actividad) => actividad.estado !== 'CANCELADA').length,
      votos: totalVotos,
      pendientes: actividades.filter((actividad) => actividad.estado !== 'CANCELADA').length,
    };
  }, [actividades, busqueda, conteoVotos, propuestas]);

  const actividadesFiltradas = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return actividades.filter((actividad) => {
      if (!query) return true;
      const haystack = `${actividad.titulo} ${actividad.descripcion ?? ''} ${actividad.lugar ?? ''} ${actividad.patrulla_origen_nombre ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [actividades, busqueda]);

  const handleAvanzarFase = async (nuevoEstado: EstadoPlanTrimestral) => {
    if (!plan) return;
    setAvanzando(true);
    try {
      const res = await PlanificacionService.avanzarFase(plan.id, nuevoEstado);
      if (!res.success) { toast.error(res.message || 'No se pudo avanzar de fase'); return; }
      if (nuevoEstado === 'VIGENTE') {
        const empates = res.empates || [];
        if (empates.length > 0) {
          toast.warning(`Plan publicado con ${res.actividades_creadas || 0} actividades. Hay ${empates.length} fecha(s) empatadas: resuélvelas manualmente desde el tablero.`);
        } else {
          toast.success(`Plan vigente con ${res.actividades_creadas || 0} actividades`);
        }
      } else {
        toast.success('Fase actualizada');
      }
      refrescarDetalle();
      cargarPlanes();
    } catch (err: any) {
      toast.error(err.message || 'Error al avanzar de fase');
    } finally {
      setAvanzando(false);
    }
  };

  const handleRetrocederFase = async (nuevoEstado: EstadoPlanTrimestral) => {
    if (!plan) return;
    setAvanzando(true);
    try {
      const res = await PlanificacionService.avanzarFase(plan.id, nuevoEstado);
      if (!res.success) { toast.error(res.message || 'No se pudo retroceder de fase'); return; }
      if (typeof res.actividades_canceladas === 'number' && res.actividades_canceladas > 0) {
        toast.warning(`Se volvió a votación. Se cancelaron ${res.actividades_canceladas} actividad(es) del calendario publicado (quedan en el historial).`);
      } else {
        toast.success('Se volvió a la fase anterior');
      }
      refrescarDetalle();
      cargarPlanes();
    } catch (err: any) {
      toast.error(err.message || 'Error al retroceder de fase');
    } finally {
      setAvanzando(false);
    }
  };

  const handleEliminarPlan = async () => {
    if (!plan) return;
    if (!window.confirm(`¿Eliminar "${plan.nombre}" definitivamente? Se borran todas sus propuestas, votos y el calendario. Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    try {
      const res = await PlanificacionService.eliminarPlan(plan.id);
      if (!res.success) { toast.error(res.message || 'No se pudo eliminar el plan'); return; }
      toast.success('Plan eliminado');
      setPlan(null);
      setPlanId(null);
      cargarPlanes();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el plan');
    } finally {
      setLoading(false);
    }
  };

  if (!puedeAcceder('planificacion')) {
    return <div className="p-8 text-center text-gray-500">No tienes acceso a este módulo.</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto space-y-5">
      <header className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-900 shadow-[0_20px_45px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-4 p-5 md:p-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
              <CalendarRange className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-200/80">Panel operativo</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Planificación Anual</h1>
              <p className="mt-1 text-sm text-slate-200">Propuestas de patrulla → votación → plan trimestral vigente</p>
            </div>
          </div>

          <div className="flex w-full max-w-2xl flex-col gap-2 md:flex-row md:items-center md:justify-end">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <Input
                aria-label="Buscar actividades o propuestas"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar actividad o patrulla"
                className="h-11 border-white/10 bg-white/10 pl-9 text-white placeholder:text-slate-300 focus-visible:ring-white/40"
              />
            </div>
            <Select value={ramaFiltro} onValueChange={setRamaFiltro}>
              <SelectTrigger className="h-11 w-full min-w-[150px] border-white/10 bg-white/10 text-white placeholder:text-slate-300 focus:ring-white/40 md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RAMAS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            {can('planificacion:aprobar') && (
              <Button onClick={() => setModalNuevoPlan(true)} className="h-11 whitespace-nowrap bg-white text-slate-900 hover:bg-slate-100">
                <Plus className="w-4 h-4 mr-1" /> Nuevo plan
              </Button>
            )}
          </div>
        </div>
      </header>

      {plan ? (
        <section className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
          <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 shadow-[0_18px_35px_rgba(79,70,229,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600">Plan activo</p>
                  <h2 className="text-xl font-bold text-slate-900">{plan.nombre}</h2>
                </div>
              </div>
              <PhasePill estado={plan.estado} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Rama</p>
                <p className="mt-1 font-semibold text-slate-800">{plan.rama}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Inicio</p>
                <p className="mt-1 font-semibold text-slate-800">{new Date(plan.fecha_inicio + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Fin</p>
                <p className="mt-1 font-semibold text-slate-800">{new Date(plan.fecha_fin + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_35px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Target className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Acciones rápidas</h3>
            </div>

            <div className="mt-4 grid gap-2">
              <Button variant="outline" className="justify-start" onClick={() => setModalLinks(true)}>
                <Link2 className="w-4 h-4 mr-2" /> Links de patrullas
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => setModalNuevoPlan(true)}>
                <Plus className="w-4 h-4 mr-2" /> Nuevo plan
              </Button>
              <Button variant="ghost" className="justify-start" onClick={refrescarDetalle}>
                <RefreshCw className="w-4 h-4 mr-2" /> Actualizar tablero
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section aria-label="Resumen del plan" className="grid gap-3 md:grid-cols-4">
        <MetricCard title="Propuestas" value={metricas.propuestas} caption="Totales según el filtro actual" accent="bg-violet-500" />
        <MetricCard title="Actividades" value={metricas.actividades} caption="Confirmadas o en vigencia" accent="bg-indigo-500" />
        <MetricCard title="Votos" value={metricas.votos} caption="Votos registrados" accent="bg-emerald-500" />
        <MetricCard title="Pendientes" value={metricas.pendientes} caption="Requieren revisión" accent="bg-amber-500" />
      </section>

      {planes.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          No hay planes trimestrales para {ramaFiltro} todavía.
        </div>
      )}

      {planes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {planes.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlanId(p.id)}
              className={`px-3 py-1.5 rounded-full text-sm border ${p.id === planId ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'}`}
            >
              {p.nombre}
            </button>
          ))}
        </div>
      )}

      {isMobile && plan && (
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setVistaMobile('tablero')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${vistaMobile === 'tablero' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Tablero
            </button>
            <button
              type="button"
              onClick={() => setVistaMobile('lista')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${vistaMobile === 'lista' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Lista
            </button>
          </div>
        </div>
      )}

      {plan && (
        <>
          {/* Stepper de fases */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {FASES.map((f, idx) => {
                const activo = f.estado === plan.estado;
                const pasado = FASES.findIndex((x) => x.estado === plan.estado) > idx;
                return (
                  <div key={f.estado} className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${activo ? 'bg-indigo-600 text-white' : pasado ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                      {f.label}
                    </span>
                    {idx < FASES.length - 1 && <span className="text-gray-300">→</span>}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setModalLinks(true)}>
                <Link2 className="w-4 h-4 mr-1" /> Links de patrullas
              </Button>

              {can('planificacion:aprobar') && plan.estado === 'VOTACION' && (
                <Button size="sm" variant="ghost" disabled={avanzando} onClick={() => handleRetrocederFase('PROPUESTAS_ABIERTAS')}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Volver a propuestas
                </Button>
              )}
              {can('planificacion:aprobar') && plan.estado === 'VIGENTE' && (
                <Button size="sm" variant="ghost" disabled={avanzando} onClick={() => handleRetrocederFase('VOTACION')}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Volver a votación
                </Button>
              )}
              {can('planificacion:aprobar') && plan.estado === 'CERRADO' && (
                <Button size="sm" variant="ghost" disabled={avanzando} onClick={() => handleRetrocederFase('VIGENTE')}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Reabrir plan vigente
                </Button>
              )}

              {can('planificacion:aprobar') && plan.estado === 'PROPUESTAS_ABIERTAS' && (
                <Button size="sm" disabled={avanzando} onClick={() => handleAvanzarFase('VOTACION')}>
                  {avanzando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Abrir votación
                </Button>
              )}
              {can('planificacion:aprobar') && plan.estado === 'VOTACION' && (
                <Button size="sm" disabled={avanzando} onClick={() => handleAvanzarFase('VIGENTE')}>
                  {avanzando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Publicar plan vigente
                </Button>
              )}
              {can('planificacion:aprobar') && plan.estado === 'VIGENTE' && (
                <Button size="sm" variant="outline" disabled={avanzando} onClick={() => handleAvanzarFase('CERRADO')}>
                  {avanzando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Cerrar trimestre
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={refrescarDetalle}><RefreshCw className="w-4 h-4" /></Button>
              {can('planificacion:eliminar') && (
                <Button variant="destructive" size="sm" onClick={handleEliminarPlan}>
                  <Trash2 className="w-4 h-4 mr-1" /> Eliminar plan
                </Button>
              )}
            </div>
          </div>

          {isMobile && vistaMobile === 'lista' ? (
            <MobileAgendaList actividades={actividadesFiltradas} onEditarActividad={setModalActividad} />
          ) : (
            <TableroPlanificacion
              plan={plan}
              propuestas={propuestas}
              actividades={actividades}
              conteoVotos={conteoVotos}
              busqueda={busqueda}
              onSearchChange={setBusqueda}
              onClearSearch={() => setBusqueda('')}
              onRefrescar={refrescarDetalle}
              onEditarActividad={setModalActividad}
              onCrearEnFecha={setModalNuevaActividadFecha}
            />
          )}
        </>
      )}

      {modalNuevoPlan && (
        <ModalNuevoPlan
          ramaSugerida={ramaFiltro}
          onClose={() => setModalNuevoPlan(false)}
          onCreado={(id) => { setModalNuevoPlan(false); cargarPlanes(); setPlanId(id); }}
        />
      )}

      {modalLinks && plan && (
        <ModalLinks
          plan={plan}
          tokens={tokens}
          puedeGestionar={can('planificacion:aprobar')}
          onClose={() => setModalLinks(false)}
          onRegenerado={refrescarDetalle}
        />
      )}

      {modalActividad && (
        <ModalEditarActividad
          actividad={modalActividad}
          puedeEditar={can('planificacion:editar_final')}
          onClose={() => setModalActividad(null)}
          onGuardado={() => { setModalActividad(null); refrescarDetalle(); }}
        />
      )}

      {modalNuevaActividadFecha && plan && (
        <ModalNuevaActividad
          planId={plan.id}
          fecha={modalNuevaActividadFecha}
          onClose={() => setModalNuevaActividadFecha(null)}
          onCreada={() => { setModalNuevaActividadFecha(null); refrescarDetalle(); }}
        />
      )}
    </div>
  );
}

// ======================================================================
// Modal: nuevo plan trimestral
// ======================================================================
function ModalNuevoPlan({ ramaSugerida, onClose, onCreado }: { ramaSugerida: string; onClose: () => void; onCreado: (id: string) => void }) {
  const [nombre, setNombre] = useState('');
  const [rama, setRama] = useState(ramaSugerida);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async () => {
    if (!nombre.trim() || !fechaInicio || !fechaFin) { toast.error('Completa nombre, fecha de inicio y fecha de fin'); return; }
    if (fechaFin < fechaInicio) { toast.error('La fecha de fin no puede ser anterior a la fecha de inicio'); return; }
    setGuardando(true);
    try {
      const res = await PlanificacionService.crearPlan({ nombre: nombre.trim(), rama, fecha_inicio: fechaInicio, fecha_fin: fechaFin, observaciones: observaciones.trim() || undefined });
      if (!res.success || !res.plan_id) { toast.error(res.message || 'No se pudo crear el plan'); return; }
      if (res.advertencia) {
        toast.warning(res.advertencia);
      } else {
        toast.success(`Plan creado con ${res.tokens?.length || 0} links de patrulla generados`);
      }
      onCreado(res.plan_id);
    } catch (err: any) {
      toast.error(err.message || 'Error al crear el plan');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nuevo plan trimestral</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Plan Trimestral IV - 2026" />
          </div>
          <div>
            <Label>Rama</Label>
            <Select value={rama} onValueChange={setRama}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{RAMAS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha inicio</Label>
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div>
              <Label>Fecha fin</Label>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Observaciones (opcional)</Label>
            <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </div>
          <p className="text-xs text-gray-500">Al crear el plan se genera automáticamente un link único por cada patrulla activa de esa rama.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={guardando}>{guardando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Crear plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ======================================================================
// Modal: links de patrulla
// ======================================================================
function ModalLinks({ plan, tokens, puedeGestionar, onClose, onRegenerado }: {
  plan: PlanTrimestral; tokens: TokenPatrulla[]; puedeGestionar: boolean; onClose: () => void; onRegenerado: () => void;
}) {
  const [regenerando, setRegenerando] = useState<string | null>(null);
  const [provisionando, setProvisionando] = useState(false);

  const provisionarFaltantes = async () => {
    setProvisionando(true);
    try {
      const res = await PlanificacionService.provisionarTokensFaltantes(plan.id);
      if (!res.success) { toast.error(res.message || 'No se pudo generar los links faltantes'); return; }
      if ((res.tokens_generados || 0) === 0) {
        toast.info('No hay patrullas activas nuevas: los links ya estaban completos, o no se encontró ninguna patrulla activa para esta rama.');
      } else {
        toast.success(`${res.tokens_generados} link(s) generado(s)`);
      }
      onRegenerado();
    } catch (err: any) {
      toast.error(err.message || 'Error al generar los links faltantes');
    } finally {
      setProvisionando(false);
    }
  };

  const copiar = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copiado');
    } catch {
      toast.error('No se pudo copiar. Copia el link manualmente.');
    }
  };

  const regenerar = async (patrullaId: string) => {
    setRegenerando(patrullaId);
    try {
      const res = await PlanificacionService.regenerarTokenPatrulla(plan.id, patrullaId);
      if (!res.success) { toast.error(res.message || 'No se pudo regenerar el link'); return; }
      toast.success('Link regenerado');
      onRegenerado();
    } catch (err: any) {
      toast.error(err.message || 'Error al regenerar el link');
    } finally {
      setRegenerando(null);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Links por patrulla</DialogTitle></DialogHeader>
        <p className="text-sm text-gray-500">Cada patrulla usa su propio link desde el celular para proponer y votar, sin necesidad de iniciar sesión.</p>
        {puedeGestionar && (
          <Button variant="outline" size="sm" disabled={provisionando} onClick={provisionarFaltantes} className="self-start">
            {provisionando ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />} Generar links faltantes
          </Button>
        )}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {tokens.map((t) => {
            const link = PlanificacionService.linkMovil(t.token);
            return (
              <div key={t.patrulla_id} className="flex items-center justify-between gap-2 border border-gray-200 rounded-lg p-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{t.patrulla_nombre}</p>
                  <p className="text-xs text-gray-400 truncate">{link}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => copiar(link)}><Copy className="w-4 h-4" /></Button>
                  {puedeGestionar && (
                    <Button size="icon" variant="ghost" disabled={regenerando === t.patrulla_id} onClick={() => regenerar(t.patrulla_id)}>
                      {regenerando === t.patrulla_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {tokens.length === 0 && <p className="text-sm text-gray-400">No hay links generados para este plan.</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cerrar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ======================================================================
// Modal: editar/mover/cancelar actividad del plan vigente
// ======================================================================
function ModalEditarActividad({ actividad, puedeEditar, onClose, onGuardado }: {
  actividad: ActividadPlan; puedeEditar: boolean; onClose: () => void; onGuardado: () => void;
}) {
  const [titulo, setTitulo] = useState(actividad.titulo);
  const [descripcion, setDescripcion] = useState(actividad.descripcion || '');
  const [lugar, setLugar] = useState(actividad.lugar || '');
  const [fecha, setFecha] = useState(actividad.fecha);
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (!motivo.trim()) { toast.error('Indica el motivo del cambio (queda en el historial)'); return; }
    setGuardando(true);
    try {
      const res = await PlanificacionService.moverActividad({
        actividadId: actividad.id, nuevaFecha: fecha, nuevoTitulo: titulo, nuevaDescripcion: descripcion, nuevoLugar: lugar, motivo: motivo.trim(),
      });
      if (!res.success) { toast.error(res.message || 'No se pudo guardar'); return; }
      toast.success('Actividad actualizada');
      onGuardado();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = async () => {
    if (!motivo.trim()) { toast.error('Indica el motivo de la cancelación'); return; }
    setGuardando(true);
    try {
      const res = await PlanificacionService.eliminarActividad(actividad.id, motivo.trim());
      if (!res.success) { toast.error(res.message || 'No se pudo cancelar'); return; }
      toast.success('Actividad cancelada');
      onGuardado();
    } catch (err: any) {
      toast.error(err.message || 'Error al cancelar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{puedeEditar ? 'Editar actividad' : 'Detalle de actividad'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} disabled={!puedeEditar} /></div>
          <div><Label>Fecha</Label><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={!puedeEditar} /></div>
          <div><Label>Lugar</Label><Input value={lugar} onChange={(e) => setLugar(e.target.value)} disabled={!puedeEditar} /></div>
          <div><Label>Descripción</Label><Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} disabled={!puedeEditar} /></div>
          {actividad.patrulla_origen_nombre && <p className="text-xs text-gray-400">Propuesta original de: {actividad.patrulla_origen_nombre}</p>}
          {puedeEditar && (
            <div><Label>Motivo del cambio</Label><Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. cambio de fecha por lluvia" /></div>
          )}
        </div>
        {puedeEditar && (
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="destructive" onClick={handleCancelar} disabled={guardando}><Trash2 className="w-4 h-4 mr-1" /> Cancelar actividad</Button>
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
            <Button onClick={handleGuardar} disabled={guardando}>{guardando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Guardar cambios</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ======================================================================
// Modal: crear actividad manual en una fecha (ej. resolver empate)
// ======================================================================
function ModalNuevaActividad({ planId, fecha, onClose, onCreada }: {
  planId: string; fecha: string; onClose: () => void; onCreada: () => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [lugar, setLugar] = useState('');
  const [responsable, setResponsable] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async () => {
    if (!titulo.trim()) { toast.error('El título es obligatorio'); return; }
    setGuardando(true);
    try {
      const res = await PlanificacionService.crearActividadManual({
        plan_id: planId, fecha, titulo: titulo.trim(), descripcion: descripcion.trim() || undefined,
        lugar: lugar.trim() || undefined, responsable_nombre_libre: responsable.trim() || undefined,
      });
      if (!res.success) { toast.error(res.message || 'No se pudo crear la actividad'); return; }
      toast.success('Actividad agregada');
      onCreada();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear la actividad');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Agregar actividad · {fecha}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
          <div><Label>Lugar</Label><Input value={lugar} onChange={(e) => setLugar(e.target.value)} /></div>
          <div><Label>Responsable</Label><Input value={responsable} onChange={(e) => setResponsable(e.target.value)} /></div>
          <div><Label>Descripción</Label><Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={guardando}>{guardando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Agregar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
