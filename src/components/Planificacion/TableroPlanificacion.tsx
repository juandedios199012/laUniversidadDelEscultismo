import React, { useMemo, useState } from 'react';
import { DndContext, DragEndEvent, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { GripVertical, MapPin, Users } from 'lucide-react';
import { usePermissions } from '../../contexts/PermissionsContext';
import {
  ActividadPlan,
  PlanTrimestral,
  PlanificacionService,
  PropuestaActividad,
} from '../../services/planificacionService';

// Paleta de respaldo cuando la patrulla no tiene color_patrulla definido.
const PALETA_RESPALDO = ['#fde68a', '#a7f3d0', '#bfdbfe', '#fbcfe8', '#fecaca', '#ddd6fe', '#bae6fd'];

function colorPorPatrulla(patrullaId: string, colorDefinido?: string): string {
  if (colorDefinido) return colorDefinido;
  let hash = 0;
  for (let i = 0; i < patrullaId.length; i++) hash = patrullaId.charCodeAt(i) + ((hash << 5) - hash);
  return PALETA_RESPALDO[Math.abs(hash) % PALETA_RESPALDO.length];
}

const MESES_LABEL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function diasEnMes(anio: number, mesIndex0: number): number {
  return new Date(anio, mesIndex0 + 1, 0).getDate();
}

function fechaISO(anio: number, mesIndex0: number, dia: number): string {
  const mm = String(mesIndex0 + 1).padStart(2, '0');
  const dd = String(dia).padStart(2, '0');
  return `${anio}-${mm}-${dd}`;
}

interface MesFila {
  anio: number;
  mesIndex0: number;
  label: string;
}

function generarMeses(fechaInicio: string, fechaFin: string): MesFila[] {
  const meses: MesFila[] = [];
  const inicio = new Date(fechaInicio + 'T00:00:00');
  const fin = new Date(fechaFin + 'T00:00:00');
  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
  while (cursor <= fin) {
    meses.push({ anio: cursor.getFullYear(), mesIndex0: cursor.getMonth(), label: MESES_LABEL[cursor.getMonth()] });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return meses;
}

interface PostItItem {
  tipo: 'propuesta' | 'actividad';
  id: string;
  titulo: string;
  lugar?: string;
  color: string;
  patrullaNombre?: string;
  esMultiDia: boolean;
  votos?: number;
  esGanadora?: boolean;
}

function PostIt({ item, onClick }: { item: PostItItem; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `${item.tipo}:${item.id}` });
  const style: React.CSSProperties = {
    backgroundColor: item.color,
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`w-full text-left rounded-md px-1.5 py-1 mb-1 text-[11px] leading-tight shadow-sm border border-black/5 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${item.esGanadora ? 'ring-2 ring-emerald-500' : ''}`}
      title={item.titulo}
    >
      <div className="flex items-start gap-0.5">
        <GripVertical className="w-3 h-3 shrink-0 opacity-40 mt-0.5" />
        <div className="min-w-0">
          <p className="font-semibold truncate">{item.titulo}{item.esMultiDia ? ' →' : ''}</p>
          {item.patrullaNombre && <p className="truncate opacity-70">{item.patrullaNombre}</p>}
          {typeof item.votos === 'number' && <p className="opacity-70">🗳️ {item.votos}</p>}
        </div>
      </div>
    </button>
  );
}

function DayCell({ fecha, esFinde, deshabilitado, compact, children }: { fecha: string; esFinde: boolean; deshabilitado: boolean; compact?: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: fecha, disabled: deshabilitado });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[${compact ? '76px' : '64px'}] border border-slate-200 bg-white p-1 align-top ${esFinde ? 'bg-amber-50/60' : 'bg-white'} ${isOver ? 'ring-2 ring-indigo-400 ring-inset' : ''}`}
    >
      {children}
    </div>
  );
}

interface TableroPlanificacionProps {
  plan: PlanTrimestral;
  propuestas: PropuestaActividad[];
  actividades: ActividadPlan[];
  conteoVotos: Record<string, Record<string, number>>;
  busqueda?: string;
  onClearSearch?: () => void;
  onRefrescar: () => void;
  onEditarActividad: (actividad: ActividadPlan) => void;
  onCrearEnFecha: (fecha: string) => void;
}

function coincideBusqueda(texto: string | undefined, busqueda: string): boolean {
  if (!busqueda.trim()) return true;
  return (texto || '').toLowerCase().includes(busqueda.trim().toLowerCase());
}

export default function TableroPlanificacion({
  plan,
  propuestas,
  actividades,
  conteoVotos,
  busqueda = '',
  onClearSearch,
  onRefrescar,
  onEditarActividad,
  onCrearEnFecha,
}: TableroPlanificacionProps) {
  const { can } = usePermissions();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [moviendo, setMoviendo] = useState(false);

  const meses = useMemo(() => generarMeses(plan.fecha_inicio, plan.fecha_fin), [plan.fecha_inicio, plan.fecha_fin]);

  const calendarioMensual = useMemo(() => {
    return meses.map((mes) => {
      const totalDias = diasEnMes(mes.anio, mes.mesIndex0);
      const primerDia = new Date(mes.anio, mes.mesIndex0, 1);
      const huecoInicial = primerDia.getDay();
      const celdas: Array<{ fecha?: string; dia?: number; esVacio: boolean }> = [];

      for (let i = 0; i < huecoInicial; i += 1) celdas.push({ esVacio: true });
      for (let dia = 1; dia <= totalDias; dia += 1) {
        celdas.push({ fecha: fechaISO(mes.anio, mes.mesIndex0, dia), dia, esVacio: false });
      }

      while (celdas.length % 7 !== 0) celdas.push({ esVacio: true });

      return {
        ...mes,
        celdas,
        semanas: Array.from({ length: Math.ceil(celdas.length / 7) }, (_, idx) => celdas.slice(idx * 7, idx * 7 + 7)),
      };
    });
  }, [meses]);

  const actividadesFiltradas = useMemo(
    () => actividades.filter(
      (actividad) =>
        !actividad.estado || actividad.estado !== 'CANCELADA' || !busqueda.trim() ||
        coincideBusqueda(actividad.titulo, busqueda) ||
        coincideBusqueda(actividad.descripcion, busqueda) ||
        coincideBusqueda(actividad.lugar, busqueda) ||
        coincideBusqueda(actividad.patrulla_origen_nombre, busqueda),
    ),
    [actividades, busqueda],
  );

  const propuestasFiltradas = useMemo(
    () => propuestas.filter(
      (propuesta) =>
        coincideBusqueda(propuesta.titulo, busqueda) ||
        coincideBusqueda(propuesta.descripcion, busqueda) ||
        coincideBusqueda(propuesta.lugar_sugerido, busqueda) ||
        coincideBusqueda(propuesta.patrulla_nombre, busqueda),
    ),
    [busqueda, propuestas],
  );

  // Post-its por fecha (clave = YYYY-MM-DD)
  const postItsPorFecha = useMemo(() => {
    const mapa: Record<string, PostItItem[]> = {};
    if (plan.estado === 'VIGENTE' || plan.estado === 'CERRADO') {
      for (const act of actividadesFiltradas) {
        if (act.estado === 'CANCELADA') continue;
        (mapa[act.fecha] = mapa[act.fecha] || []).push({
          tipo: 'actividad',
          id: act.id,
          titulo: act.titulo,
          lugar: act.lugar,
          color: colorPorPatrulla(act.patrulla_origen_id || act.id, act.patrulla_origen_color),
          patrullaNombre: act.patrulla_origen_nombre,
          esMultiDia: !!act.fecha_fin && act.fecha_fin !== act.fecha,
        });
      }
    } else {
      const gananciaPorFecha: Record<string, string> = {};
      if (plan.estado === 'VOTACION') {
        for (const [fecha, conteo] of Object.entries(conteoVotos)) {
          let mejorId = '';
          let mejorVotos = -1;
          let empatados = 0;
          for (const [pid, votos] of Object.entries(conteo)) {
            if (votos > mejorVotos) { mejorVotos = votos; mejorId = pid; empatados = 1; }
            else if (votos === mejorVotos) { empatados += 1; }
          }
          gananciaPorFecha[fecha] = empatados === 1 ? mejorId : '';
        }
      }
      for (const prop of propuestasFiltradas) {
        (mapa[prop.fecha] = mapa[prop.fecha] || []).push({
          tipo: 'propuesta',
          id: prop.id,
          titulo: prop.titulo,
          lugar: prop.lugar_sugerido,
          color: colorPorPatrulla(prop.patrulla_id, prop.patrulla_color),
          patrullaNombre: prop.patrulla_nombre,
          esMultiDia: !!prop.fecha_fin && prop.fecha_fin !== prop.fecha,
          votos: conteoVotos[prop.fecha]?.[prop.id] || 0,
          esGanadora: plan.estado === 'VOTACION' && gananciaPorFecha[prop.fecha] === prop.id && (conteoVotos[prop.fecha]?.[prop.id] || 0) > 0,
        });
      }
    }
    return mapa;
  }, [actividadesFiltradas, busqueda, conteoVotos, plan.estado, propuestasFiltradas]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const [tipo, id] = String(active.id).split(':');
    const nuevaFecha = String(over.id);
    setMoviendo(true);
    try {
      if (tipo === 'actividad') {
        if (!can('planificacion:editar_final')) {
          toast.error('No tienes permiso para mover actividades del plan vigente');
          return;
        }
        const res = await PlanificacionService.moverActividad({ actividadId: id, nuevaFecha, motivo: 'Movida desde el tablero' });
        if (!res.success) { toast.error(res.message || 'No se pudo mover la actividad'); return; }
        toast.success('Actividad movida');
      } else {
        if (!can('planificacion:aprobar')) {
          toast.error('No tienes permiso para reordenar propuestas');
          return;
        }
        await PlanificacionService.moverPropuestaFecha(id, nuevaFecha);
        toast.success('Propuesta movida');
      }
      onRefrescar();
    } catch (err: any) {
      toast.error(err.message || 'Error al mover el post-it');
    } finally {
      setMoviendo(false);
    }
  };

  const resultadosMostrados = Object.values(postItsPorFecha).reduce((total, items) => total + items.length, 0);

  return (
    <section aria-label="Calendario trimestral" className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#f3f3f1] shadow-[0_18px_35px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-slate-200 bg-[#f3f3f1] px-4 py-3">
        <div className="inline-flex items-center rounded-full bg-[#2d2f35] px-4 py-2 text-lg font-bold text-white shadow-sm">
          Calendario {new Date(plan.fecha_inicio + 'T00:00:00').getFullYear()}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{resultadosMostrados} elementos visibles</span>
          {busqueda.trim() && (
            <button
              type="button"
              onClick={onClearSearch}
              className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              aria-label="Limpiar búsqueda"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="min-w-[1180px] p-3" style={{ opacity: moviendo ? 0.7 : 1 }}>
            <div className="grid grid-cols-[160px_1fr] rounded-t-2xl overflow-hidden border border-slate-200 bg-white">
              <div className="bg-[#2d2f35] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">Meses</div>
              <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
                  <div key={dia} className="border-l border-slate-200 bg-[#f4f4f3] py-2.5">{dia}</div>
                ))}
              </div>
            </div>

            {calendarioMensual.map((mes) => (
              <div key={`${mes.anio}-${mes.mesIndex0}`} className="grid grid-cols-[160px_1fr] border-b border-slate-200 bg-white last:rounded-b-2xl">
                <div className="flex min-h-[220px] items-start justify-center bg-[#2d2f35] px-3 py-4 text-left text-2xl font-bold text-white">
                  <span className="mt-1 leading-none">{mes.label}</span>
                </div>

                <div className="grid grid-cols-7 gap-0">
                  {mes.semanas.flat().map((celda, index) => {
                    if (celda.esVacio) {
                      return <div key={`${mes.anio}-${mes.mesIndex0}-empty-${index}`} className="min-h-[84px] border-l border-slate-200 bg-slate-50/50" />;
                    }

                    const fecha = celda.fecha as string;
                    const dow = new Date(`${fecha}T00:00:00`).getDay();
                    const esFinde = dow === 0 || dow === 6;
                    const items = postItsPorFecha[fecha] || [];
                    const puedeCrearAqui = plan.estado === 'PROPUESTAS_ABIERTAS' || plan.estado === 'VIGENTE';

                    return (
                      <DayCell key={fecha} fecha={fecha} esFinde={esFinde} deshabilitado={plan.estado === 'CERRADO'} compact>
                        <div className="flex items-center justify-between px-1 pb-1">
                          <span className="text-[10px] font-semibold text-slate-500">{celda.dia}</span>
                        </div>

                        <div className="space-y-1">
                          {items.map((item) => (
                            <PostIt
                              key={`${item.tipo}-${item.id}`}
                              item={item}
                              onClick={() => {
                                if (item.tipo === 'actividad') {
                                  const act = actividades.find((a) => a.id === item.id);
                                  if (act) onEditarActividad(act);
                                }
                              }}
                            />
                          ))}
                          {items.length === 0 && puedeCrearAqui && can('planificacion:aprobar') && (
                            <button
                              type="button"
                              aria-label={`Crear actividad en ${fecha}`}
                              onClick={() => onCrearEnFecha(fecha)}
                              className="flex h-8 w-full items-center justify-center rounded-md border border-dashed border-slate-300 text-lg text-slate-300 transition hover:border-indigo-300 hover:text-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                              title="Agregar actividad"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </DayCell>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DndContext>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Color = patrulla</span>
        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Arrastra un post-it a otro día para moverlo</span>
      </div>
    </section>
  );
}
