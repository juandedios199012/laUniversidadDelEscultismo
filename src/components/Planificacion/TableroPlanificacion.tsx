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

function DayCell({ fecha, esFinde, deshabilitado, children }: { fecha: string; esFinde: boolean; deshabilitado: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: fecha, disabled: deshabilitado });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[64px] border border-gray-200 p-1 align-top ${esFinde ? 'bg-amber-50' : 'bg-white'} ${isOver ? 'ring-2 ring-indigo-400 ring-inset' : ''}`}
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
  onRefrescar: () => void;
  onEditarActividad: (actividad: ActividadPlan) => void;
  onCrearEnFecha: (fecha: string) => void;
}

export default function TableroPlanificacion({
  plan, propuestas, actividades, conteoVotos, onRefrescar, onEditarActividad, onCrearEnFecha,
}: TableroPlanificacionProps) {
  const { can } = usePermissions();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [moviendo, setMoviendo] = useState(false);

  const meses = useMemo(() => generarMeses(plan.fecha_inicio, plan.fecha_fin), [plan.fecha_inicio, plan.fecha_fin]);
  const maxDias = 31;

  // Post-its por fecha (clave = YYYY-MM-DD)
  const postItsPorFecha = useMemo(() => {
    const mapa: Record<string, PostItItem[]> = {};
    if (plan.estado === 'VIGENTE' || plan.estado === 'CERRADO') {
      for (const act of actividades) {
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
      // Solo se marca "ganadora" cuando hay un máximo único (sin empate) — un
      // empate real lo resuelve la RPC avanzar_fase_plan, no esta vista previa.
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
      for (const prop of propuestas) {
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
  }, [propuestas, actividades, conteoVotos, plan.estado]);

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

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="min-w-[1400px]" style={{ opacity: moviendo ? 0.7 : 1 }}>
            {/* Encabezado de días (1..31) */}
            <div className="grid" style={{ gridTemplateColumns: `140px repeat(${maxDias}, minmax(42px, 1fr))` }}>
              <div className="bg-gray-900 text-white text-xs font-semibold flex items-center px-3 py-2 sticky left-0 z-10">
                {plan.rama} · {plan.nombre}
              </div>
              {Array.from({ length: maxDias }, (_, i) => (
                <div key={i} className="text-center text-[10px] text-gray-400 py-2 border-b border-gray-200">{i + 1}</div>
              ))}
            </div>

            {meses.map((mes) => {
              const totalDias = diasEnMes(mes.anio, mes.mesIndex0);
              return (
                <div key={`${mes.anio}-${mes.mesIndex0}`} className="grid" style={{ gridTemplateColumns: `140px repeat(${maxDias}, minmax(42px, 1fr))` }}>
                  <div className="bg-gray-900 text-white text-sm font-bold flex items-center px-3 sticky left-0 z-10">
                    {mes.label} {mes.anio}
                  </div>
                  {Array.from({ length: maxDias }, (_, idx) => {
                    const dia = idx + 1;
                    if (dia > totalDias) {
                      return <div key={dia} className="bg-gray-50" />;
                    }
                    const fecha = fechaISO(mes.anio, mes.mesIndex0, dia);
                    const dow = new Date(mes.anio, mes.mesIndex0, dia).getDay(); // 0 domingo, 6 sábado
                    const esFinde = dow === 0 || dow === 6;
                    const items = postItsPorFecha[fecha] || [];
                    const puedeCrearAqui = plan.estado === 'PROPUESTAS_ABIERTAS' || plan.estado === 'VIGENTE';
                    return (
                      <DayCell key={fecha} fecha={fecha} esFinde={esFinde} deshabilitado={plan.estado === 'CERRADO'}>
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
                            onClick={() => onCrearEnFecha(fecha)}
                            className="w-full h-full min-h-[36px] text-gray-300 hover:text-gray-500 text-lg"
                            title="Agregar actividad"
                          >
                            +
                          </button>
                        )}
                      </DayCell>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </DndContext>
      </div>

      <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Color = patrulla</span>
        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Arrastra un post-it a otro día para moverlo</span>
      </div>
    </div>
  );
}
