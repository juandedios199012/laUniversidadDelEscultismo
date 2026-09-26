import React, { useMemo, useState } from 'react';
import { DndContext, DragEndEvent, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { MapPin, Mic, Plus, Minus, Volume2, VolumeX, Users } from 'lucide-react';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
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
    opacity: isDragging ? 0.55 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`flex w-full items-center gap-1 rounded-md border border-black/5 px-1 py-0.5 text-left text-[9px] font-semibold shadow-sm transition hover:shadow-md active:cursor-grabbing ${item.esGanadora ? 'ring-2 ring-emerald-500' : ''}`}
      title={item.titulo}
    >
      <span className="min-w-0 flex-1 truncate">{item.titulo}</span>
      {item.esMultiDia && <span className="text-[8px] font-bold">→</span>}
    </button>
  );
}

function DayCell({ fecha, esFinde, deshabilitado, children }: { fecha: string; esFinde: boolean; deshabilitado: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: fecha, disabled: deshabilitado });

  return (
    <td
      ref={setNodeRef}
      className={`h-[92px] rounded-lg border p-1 align-top ${esFinde ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-white'} ${isOver ? 'ring-2 ring-indigo-400 ring-inset' : ''}`}
    >
      {children}
    </td>
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
  const [escalaTexto, setEscalaTexto] = useState(1);
  const [vozActiva, setVozActiva] = useState(false);
  const [dictadoActivo, setDictadoActivo] = useState(false);
  const [soportaDictado, setSoportaDictado] = useState(false);

  React.useEffect(() => {
    setSoportaDictado(typeof window !== 'undefined' && !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);
  }, []);

  const leerResumen = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Tu navegador no admite lectura por voz en esta pantalla.');
      return;
    }

    if (vozActiva) {
      window.speechSynthesis.cancel();
      setVozActiva(false);
      return;
    }

    const resumen = [
      `Calendario del plan ${plan.nombre || 'trimestral'}.`,
      `Desde ${plan.fecha_inicio} hasta ${plan.fecha_fin}.`,
      `${resultadosMostrados} elementos visibles.`
    ].join(' ');

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(resumen);
    utterance.lang = 'es-PE';
    utterance.onend = () => setVozActiva(false);
    utterance.onerror = () => setVozActiva(false);
    setVozActiva(true);
    window.speechSynthesis.speak(utterance);
  };

  const alternarDictado = () => {
    if (!soportaDictado || typeof window === 'undefined') {
      toast.error('Este navegador no admite dictado por voz.');
      return;
    }

    if (dictadoActivo) {
      setDictadoActivo(false);
      return;
    }

    const RecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new RecognitionCtor();
    recognition.lang = 'es-PE';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || '')
        .join(' ')
        .trim();

      if (transcript) {
        if (onClearSearch) {
          onClearSearch();
        }
      }
    };

    recognition.onerror = () => {
      setDictadoActivo(false);
      toast.error('No se pudo iniciar el dictado por voz.');
    };
    recognition.onend = () => setDictadoActivo(false);

    setDictadoActivo(true);
    recognition.start();
  };

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
    <TooltipProvider delayDuration={180}>
      <section
        aria-label="Calendario trimestral"
        className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#f2f6f4] shadow-[0_18px_35px_rgba(15,23,42,0.06)]"
        style={{ fontSize: `${escalaTexto}rem` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#f5f7f6] px-4 py-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1b2a35] px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-sm">
            <Badge variant="secondary" className="bg-white/10 text-white border-white/10 hover:bg-white/10">
              Calendario
            </Badge>
            {new Date(plan.fecha_inicio + 'T00:00:00').getFullYear()}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <div className="inline-flex items-center rounded-full border border-slate-300 bg-white p-1 shadow-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" aria-label="Reducir tamaño de letra" onClick={() => setEscalaTexto((prev) => Number(Math.max(0.95, Number((prev - 0.1).toFixed(1)))))} className="h-8 w-8 rounded-full hover:bg-slate-100">
                    <Minus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reducir texto</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" aria-label="Aumentar tamaño de letra" onClick={() => setEscalaTexto((prev) => Number(Math.min(1.7, Number((prev + 0.1).toFixed(1)))))} className="h-8 w-8 rounded-full hover:bg-slate-100">
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Aumentar texto</TooltipContent>
              </Tooltip>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" onClick={leerResumen} className="gap-1.5 rounded-full border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700">
                  {vozActiva ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  {vozActiva ? 'Detener' : 'Escuchar'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{vozActiva ? 'Detener lectura de voz' : 'Leer el calendario en voz alta'}</TooltipContent>
            </Tooltip>

            {soportaDictado && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={dictadoActivo ? 'success' : 'outline'}
                    onClick={alternarDictado}
                    className={`gap-1.5 rounded-full ${dictadoActivo ? '' : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700'}`}
                    aria-label={dictadoActivo ? 'Detener dictado por voz' : 'Activar dictado por voz'}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    {dictadoActivo ? 'Grabando' : 'Mic'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{dictadoActivo ? 'Detener dictado por voz' : 'Activar dictado por voz'}</TooltipContent>
              </Tooltip>
            )}

            <Badge variant="outline" className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {resultadosMostrados} visibles
            </Badge>

            {busqueda.trim() && (
              <Button type="button" variant="outline" size="sm" onClick={onClearSearch} className="rounded-full border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700">
                Limpiar
              </Button>
            )}
          </div>
        </div>

        <div className="p-4">
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3" style={{ opacity: moviendo ? 0.7 : 1 }}>
              {calendarioMensual.map((mes) => (
                <Card key={`${mes.anio}-${mes.mesIndex0}`} className="overflow-hidden border-slate-200 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                  <div className="border-b border-slate-200 bg-[#1b2a35] px-3 py-3 text-center text-base font-bold text-white">
                    {mes.label}
                  </div>

                  <CardContent className="p-2">
                    <table className="w-full border-separate border-spacing-1">
                      <thead>
                        <tr>
                          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((dia, idx) => (
                            <th key={`${mes.anio}-${mes.mesIndex0}-head-${idx}`} className={`pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${idx === 5 || idx === 6 ? 'text-[#1f5f8b]' : 'text-slate-500'}`}>
                              {dia}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {mes.semanas.map((semana, semanaIndex) => (
                          <tr key={`${mes.anio}-${mes.mesIndex0}-week-${semanaIndex}`}>
                            {semana.map((celda, index) => {
                              if (celda.esVacio) {
                                return <td key={`${mes.anio}-${mes.mesIndex0}-empty-${index}`} className="h-[92px] rounded-lg bg-slate-50/80" />;
                              }

                              const fecha = celda.fecha as string;
                              const dow = new Date(`${fecha}T00:00:00`).getDay();
                              const esFinde = dow === 0 || dow === 6;
                              const items = postItsPorFecha[fecha] || [];
                              const puedeCrearAqui = plan.estado === 'PROPUESTAS_ABIERTAS' || plan.estado === 'VIGENTE';

                              return (
                                <DayCell key={fecha} fecha={fecha} esFinde={esFinde} deshabilitado={plan.estado === 'CERRADO'}>
                                  <div className="mb-1 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500">{celda.dia}</span>
                                  </div>

                                  <div className="space-y-1">
                                    {items.slice(0, 2).map((item) => (
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

                                    {items.length > 2 && (
                                      <div className="text-[8px] font-semibold text-slate-500">+{items.length - 2} más</div>
                                    )}

                                    {items.length === 0 && puedeCrearAqui && can('planificacion:aprobar') && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Crear actividad en ${fecha}`}
                                        onClick={() => onCrearEnFecha(fecha)}
                                        className="flex h-6 w-full rounded-md border border-dashed border-slate-300 text-base text-slate-400 hover:border-indigo-300 hover:text-indigo-500"
                                        title="Agregar actividad"
                                      >
                                        +
                                      </Button>
                                    )}
                                  </div>
                                </DayCell>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DndContext>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Color = patrulla</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Arrastra la actividad a otra fecha</span>
        </div>
      </section>
    </TooltipProvider>
  );
}
