import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ClipboardList, Copy, Loader2, Plus, RefreshCw, Trash2, Undo2 } from 'lucide-react';
import { usePermissions } from '../../contexts/PermissionsContext';
import {
  Evaluacion,
  EvaluacionItem,
  EvaluacionRespuesta,
  EvaluacionRespuestaItem,
  EvaluacionService,
  EstadoEvaluacion,
} from '../../services/evaluacionService';
import { PlanTrimestral, PlanificacionService } from '../../services/planificacionService';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

const ESTADO_LABEL: Record<EstadoEvaluacion, string> = {
  BORRADOR: 'Borrador',
  ACTIVA: 'Activa',
  CERRADA: 'Cerrada',
};

const ESTADO_COLOR: Record<EstadoEvaluacion, string> = {
  BORRADOR: 'bg-gray-100 text-gray-600',
  ACTIVA: 'bg-emerald-100 text-emerald-700',
  CERRADA: 'bg-red-100 text-red-600',
};

export default function EvaluacionPage() {
  const { can, puedeAcceder } = usePermissions();
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [evaluacionId, setEvaluacionId] = useState<string | null>(null);
  const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(null);
  const [items, setItems] = useState<EvaluacionItem[]>([]);
  const [respuestas, setRespuestas] = useState<EvaluacionRespuesta[]>([]);
  const [respuestaItems, setRespuestaItems] = useState<EvaluacionRespuestaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalNueva, setModalNueva] = useState(false);

  const cargarLista = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await EvaluacionService.listarEvaluaciones();
      setEvaluaciones(lista);
      if (lista.length > 0 && !evaluacionId) setEvaluacionId(lista[0].id);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar las evaluaciones');
    } finally {
      setLoading(false);
    }
  }, [evaluacionId]);

  const cargarDetalle = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [ev, its, resp, respItems] = await Promise.all([
        EvaluacionService.obtenerEvaluacion(id),
        EvaluacionService.listarItems(id),
        EvaluacionService.listarRespuestas(id),
        EvaluacionService.listarRespuestaItems(id),
      ]);
      if (!ev) {
        toast.error('Esa evaluación ya no existe. Selecciona otra.');
        setEvaluacion(null);
        setEvaluacionId(null);
        return;
      }
      setEvaluacion(ev);
      setItems(its);
      setRespuestas(resp);
      setRespuestaItems(respItems);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar la evaluación');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarLista(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (evaluacionId) cargarDetalle(evaluacionId); }, [evaluacionId, cargarDetalle]);

  const refrescar = useCallback(() => { if (evaluacionId) cargarDetalle(evaluacionId); }, [evaluacionId, cargarDetalle]);

  if (!puedeAcceder('evaluacion')) {
    return <div className="p-8 text-center text-gray-500">No tienes acceso a este módulo.</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-violet-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Evaluación</h1>
            <p className="text-sm text-gray-500">Encuestas de escala — crea las tuyas, cada scout responde desde un link</p>
          </div>
        </div>
        {can('evaluacion:crear') && (
          <Button onClick={() => setModalNueva(true)}><Plus className="w-4 h-4 mr-1" /> Nueva evaluación</Button>
        )}
      </header>

      {evaluaciones.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          Todavía no creaste ninguna evaluación.
        </div>
      )}

      {evaluaciones.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {evaluaciones.map((e) => (
            <button
              key={e.id}
              onClick={() => setEvaluacionId(e.id)}
              className={`px-3 py-1.5 rounded-full text-sm border flex items-center gap-1.5 ${e.id === evaluacionId ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-300 hover:border-violet-300'}`}
            >
              {e.titulo}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${e.id === evaluacionId ? 'bg-white/20' : ESTADO_COLOR[e.estado]}`}>{ESTADO_LABEL[e.estado]}</span>
            </button>
          ))}
        </div>
      )}

      {evaluacion && (
        <DetalleEvaluacion
          evaluacion={evaluacion}
          items={items}
          respuestas={respuestas}
          respuestaItems={respuestaItems}
          onRefrescar={() => { refrescar(); cargarLista(); }}
          onEliminada={() => { setEvaluacion(null); setEvaluacionId(null); cargarLista(); }}
        />
      )}

      {modalNueva && (
        <ModalNuevaEvaluacion
          onClose={() => setModalNueva(false)}
          onCreada={(id) => { setModalNueva(false); cargarLista(); setEvaluacionId(id); }}
        />
      )}
    </div>
  );
}

// ======================================================================
// Detalle de una evaluación: config + builder de enunciados + resultados
// ======================================================================
function DetalleEvaluacion({ evaluacion, items, respuestas, respuestaItems, onRefrescar, onEliminada }: {
  evaluacion: Evaluacion; items: EvaluacionItem[]; respuestas: EvaluacionRespuesta[]; respuestaItems: EvaluacionRespuestaItem[];
  onRefrescar: () => void; onEliminada: () => void;
}) {
  const { can } = usePermissions();
  const [accionando, setAccionando] = useState(false);
  const puedeEditarEnunciados = evaluacion.estado === 'BORRADOR' && respuestas.length === 0;

  const link = EvaluacionService.linkPublico(evaluacion.codigo_acceso);

  const copiarLink = async () => {
    try { await navigator.clipboard.writeText(link); toast.success('Link copiado'); }
    catch { toast.error('No se pudo copiar. Copia el link manualmente.'); }
  };

  const handleActivar = async () => {
    setAccionando(true);
    try {
      const res = await EvaluacionService.activar(evaluacion.id);
      if (!res.success) { toast.error(res.message || 'No se pudo activar'); return; }
      toast.success('Evaluación activada — ya se puede compartir el link');
      onRefrescar();
    } catch (err: any) { toast.error(err.message || 'Error al activar'); }
    finally { setAccionando(false); }
  };

  const handleCerrar = async () => {
    setAccionando(true);
    try {
      const res = await EvaluacionService.cerrar(evaluacion.id);
      if (!res.success) { toast.error(res.message || 'No se pudo cerrar'); return; }
      toast.success('Evaluación cerrada');
      onRefrescar();
    } catch (err: any) { toast.error(err.message || 'Error al cerrar'); }
    finally { setAccionando(false); }
  };

  const handleReabrir = async () => {
    setAccionando(true);
    try {
      const res = await EvaluacionService.reabrir(evaluacion.id);
      if (!res.success) { toast.error(res.message || 'No se pudo reabrir'); return; }
      toast.success('Evaluación reabierta');
      onRefrescar();
    } catch (err: any) { toast.error(err.message || 'Error al reabrir'); }
    finally { setAccionando(false); }
  };

  const handleEliminar = async () => {
    if (!window.confirm(`¿Eliminar "${evaluacion.titulo}" definitivamente? Se borran sus enunciados y todas las respuestas recibidas. Esta acción no se puede deshacer.`)) return;
    setAccionando(true);
    try {
      const res = await EvaluacionService.eliminar(evaluacion.id);
      if (!res.success) { toast.error(res.message || 'No se pudo eliminar'); return; }
      toast.success('Evaluación eliminada');
      onEliminada();
    } catch (err: any) { toast.error(err.message || 'Error al eliminar'); }
    finally { setAccionando(false); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className={ESTADO_COLOR[evaluacion.estado]}>{ESTADO_LABEL[evaluacion.estado]}</Badge>
          <span className="text-sm text-gray-500">{respuestas.length} respuesta(s)</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(evaluacion.estado === 'ACTIVA' || evaluacion.estado === 'CERRADA') && (
            <Button variant="outline" size="sm" onClick={copiarLink}><Copy className="w-4 h-4 mr-1" /> Copiar link</Button>
          )}
          {can('evaluacion:aprobar') && evaluacion.estado === 'BORRADOR' && (
            <Button size="sm" disabled={accionando} onClick={handleActivar}>
              {accionando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Activar
            </Button>
          )}
          {can('evaluacion:aprobar') && evaluacion.estado === 'ACTIVA' && (
            <Button size="sm" variant="outline" disabled={accionando} onClick={handleCerrar}>
              {accionando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Cerrar
            </Button>
          )}
          {can('evaluacion:aprobar') && evaluacion.estado === 'CERRADA' && (
            <Button size="sm" variant="ghost" disabled={accionando} onClick={handleReabrir}>
              <Undo2 className="w-4 h-4 mr-1" /> Reabrir
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onRefrescar}><RefreshCw className="w-4 h-4" /></Button>
          {can('evaluacion:eliminar') && (
            <Button variant="destructive" size="sm" disabled={accionando} onClick={handleEliminar}>
              <Trash2 className="w-4 h-4 mr-1" /> Eliminar
            </Button>
          )}
        </div>
      </div>

      {(evaluacion.estado === 'ACTIVA' || evaluacion.estado === 'CERRADA') && (
        <p className="text-xs text-gray-400 break-all">{link}</p>
      )}

      <ConfigEvaluacion evaluacion={evaluacion} puedeEditar={can('evaluacion:editar') && evaluacion.estado !== 'CERRADA'} onGuardado={onRefrescar} />

      <BuilderEnunciados evaluacionId={evaluacion.id} items={items} puedeEditar={can('evaluacion:editar') && puedeEditarEnunciados} onGuardado={onRefrescar} />

      {!puedeEditarEnunciados && evaluacion.estado !== 'BORRADOR' && (
        <ResultadosEvaluacion items={items} respuestas={respuestas} respuestaItems={respuestaItems} escalaMin={evaluacion.escala_min} escalaMax={evaluacion.escala_max} />
      )}
    </div>
  );
}

// ======================================================================
// Config: título, descripción, instrucciones, escala, plan vinculado
// ======================================================================
function ConfigEvaluacion({ evaluacion, puedeEditar, onGuardado }: { evaluacion: Evaluacion; puedeEditar: boolean; onGuardado: () => void }) {
  const [titulo, setTitulo] = useState(evaluacion.titulo);
  const [descripcion, setDescripcion] = useState(evaluacion.descripcion || '');
  const [instrucciones, setInstrucciones] = useState(evaluacion.instrucciones || '');
  const [escalaMin, setEscalaMin] = useState(String(evaluacion.escala_min));
  const [escalaMax, setEscalaMax] = useState(String(evaluacion.escala_max));
  const [etiquetaMin, setEtiquetaMin] = useState(evaluacion.etiqueta_escala_min || '');
  const [etiquetaMax, setEtiquetaMax] = useState(evaluacion.etiqueta_escala_max || '');
  const [planId, setPlanId] = useState(evaluacion.plan_trimestral_id || '');
  const [planes, setPlanes] = useState<PlanTrimestral[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { PlanificacionService.listarPlanes().then(setPlanes).catch(() => {}); }, []);

  const guardar = async () => {
    if (!titulo.trim()) { toast.error('El título es obligatorio'); return; }
    const min = parseInt(escalaMin, 10);
    const max = parseInt(escalaMax, 10);
    if (isNaN(min) || isNaN(max) || max <= min) { toast.error('La escala máxima debe ser mayor que la mínima'); return; }
    setGuardando(true);
    try {
      const res = await EvaluacionService.actualizarEvaluacion(evaluacion.id, {
        titulo: titulo.trim(), descripcion: descripcion.trim() || undefined, instrucciones: instrucciones.trim() || undefined,
        plan_trimestral_id: planId || undefined, escala_min: min, escala_max: max,
        etiqueta_escala_min: etiquetaMin.trim() || undefined, etiqueta_escala_max: etiquetaMax.trim() || undefined,
      });
      if (!res.success) { toast.error(res.message || 'No se pudo guardar'); return; }
      toast.success('Guardado');
      onGuardado();
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
    finally { setGuardando(false); }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <h2 className="font-semibold text-gray-900">Configuración</h2>
      <div>
        <Label>Título</Label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} disabled={!puedeEditar} />
      </div>
      <div>
        <Label>Descripción (opcional)</Label>
        <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} disabled={!puedeEditar} />
      </div>
      <div>
        <Label>Instrucciones para el scout (opcional)</Label>
        <Textarea value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} disabled={!puedeEditar} rows={2} placeholder="Ej. Marca del 1 al 5 según qué tan de acuerdo estás con cada frase." />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><Label>Escala mín.</Label><Input type="number" value={escalaMin} onChange={(e) => setEscalaMin(e.target.value)} disabled={!puedeEditar} /></div>
        <div><Label>Escala máx.</Label><Input type="number" value={escalaMax} onChange={(e) => setEscalaMax(e.target.value)} disabled={!puedeEditar} /></div>
        <div><Label>Etiqueta mín. (opcional)</Label><Input value={etiquetaMin} onChange={(e) => setEtiquetaMin(e.target.value)} disabled={!puedeEditar} placeholder="Nunca" /></div>
        <div><Label>Etiqueta máx. (opcional)</Label><Input value={etiquetaMax} onChange={(e) => setEtiquetaMax(e.target.value)} disabled={!puedeEditar} placeholder="Siempre" /></div>
      </div>
      <div>
        <Label>Vincular a un plan trimestral (opcional)</Label>
        <Select value={planId || '__none__'} onValueChange={(v) => setPlanId(v === '__none__' ? '' : v)} disabled={!puedeEditar}>
          <SelectTrigger><SelectValue placeholder="Sin vincular" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Sin vincular</SelectItem>
            {planes.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {puedeEditar && (
        <Button size="sm" onClick={guardar} disabled={guardando}>{guardando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Guardar configuración</Button>
      )}
    </div>
  );
}

// ======================================================================
// Builder: lista de enunciados, uno por línea
// ======================================================================
function BuilderEnunciados({ evaluacionId, items, puedeEditar, onGuardado }: {
  evaluacionId: string; items: EvaluacionItem[]; puedeEditar: boolean; onGuardado: () => void;
}) {
  const [texto, setTexto] = useState(items.map((i) => i.enunciado).join('\n'));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { setTexto(items.map((i) => i.enunciado).join('\n')); }, [items]);

  const guardar = async () => {
    const enunciados = texto.split('\n').map((l) => l.trim()).filter(Boolean).map((enunciado) => ({ enunciado }));
    if (enunciados.length === 0) { toast.error('Agrega al menos un enunciado'); return; }
    setGuardando(true);
    try {
      const res = await EvaluacionService.guardarItems(evaluacionId, enunciados);
      if (!res.success) { toast.error(res.message || 'No se pudo guardar'); return; }
      toast.success(`${res.cantidad_items || enunciados.length} enunciado(s) guardado(s)`);
      onGuardado();
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
    finally { setGuardando(false); }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
      <h2 className="font-semibold text-gray-900">Enunciados</h2>
      {!puedeEditar && (
        <p className="text-xs text-amber-600">
          {items.length === 0 ? 'No se pueden editar enunciados en este estado.' : 'Ya hay respuestas registradas (o la evaluación no está en borrador): los enunciados quedan fijos para no perder datos.'}
        </p>
      )}
      {puedeEditar ? (
        <>
          <p className="text-xs text-gray-400">Uno por línea — se mostrarán en este mismo orden.</p>
          <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={10} placeholder={'Toma iniciativa\nAporta ideas nuevas al grupo\nIntegrado al grupo'} />
          <Button size="sm" onClick={guardar} disabled={guardando}>{guardando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Guardar enunciados</Button>
        </>
      ) : (
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
          {items.map((i) => <li key={i.id}>{i.enunciado}</li>)}
        </ol>
      )}
    </div>
  );
}

// ======================================================================
// Resultados: grilla scout x enunciado (igual espíritu que la hoja en
// papel) + promedio por enunciado.
// ======================================================================
function ResultadosEvaluacion({ items, respuestas, respuestaItems, escalaMin, escalaMax }: {
  items: EvaluacionItem[]; respuestas: EvaluacionRespuesta[]; respuestaItems: EvaluacionRespuestaItem[]; escalaMin: number; escalaMax: number;
}) {
  const valorPorRespuestaItem = useMemo(() => {
    const mapa: Record<string, Record<string, number>> = {};
    for (const ri of respuestaItems) {
      (mapa[ri.respuesta_id] = mapa[ri.respuesta_id] || {})[ri.item_id] = ri.valor_escala;
    }
    return mapa;
  }, [respuestaItems]);

  const promedioPorItem = useMemo(() => {
    const mapa: Record<string, { suma: number; cantidad: number }> = {};
    for (const ri of respuestaItems) {
      const actual = mapa[ri.item_id] || { suma: 0, cantidad: 0 };
      actual.suma += ri.valor_escala;
      actual.cantidad += 1;
      mapa[ri.item_id] = actual;
    }
    return mapa;
  }, [respuestaItems]);

  if (respuestas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">
        Todavía no llegó ninguna respuesta.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <h2 className="font-semibold text-gray-900">Resultados</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-white">Scout</TableHead>
              {items.map((it) => (
                <TableHead key={it.id} className="text-center max-w-[120px]" title={it.enunciado}>
                  <span className="line-clamp-3 text-xs">{it.enunciado}</span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {respuestas.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium whitespace-nowrap sticky left-0 bg-white">
                  {r.scout_nombre || 'Scout'}
                  {r.patrulla_nombre && <span className="block text-xs text-gray-400">{r.patrulla_nombre}</span>}
                </TableCell>
                {items.map((it) => (
                  <TableCell key={it.id} className="text-center">
                    {valorPorRespuestaItem[r.id]?.[it.id] ?? '—'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow className="bg-gray-50 font-semibold">
              <TableCell className="sticky left-0 bg-gray-50">Promedio</TableCell>
              {items.map((it) => {
                const p = promedioPorItem[it.id];
                return (
                  <TableCell key={it.id} className="text-center">
                    {p ? (p.suma / p.cantidad).toFixed(1) : '—'}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-gray-400">Escala usada: {escalaMin} a {escalaMax}.</p>
    </div>
  );
}

// ======================================================================
// Modal: nueva evaluación
// ======================================================================
function ModalNuevaEvaluacion({ onClose, onCreada }: { onClose: () => void; onCreada: (id: string) => void }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async () => {
    if (!titulo.trim()) { toast.error('El título es obligatorio'); return; }
    setGuardando(true);
    try {
      const res = await EvaluacionService.crearEvaluacion({ titulo: titulo.trim(), descripcion: descripcion.trim() || undefined });
      if (!res.success || !res.evaluacion_id) { toast.error(res.message || 'No se pudo crear la evaluación'); return; }
      toast.success('Evaluación creada — agregá los enunciados y activala cuando esté lista');
      onCreada(res.evaluacion_id);
    } catch (err: any) { toast.error(err.message || 'Error al crear la evaluación'); }
    finally { setGuardando(false); }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nueva evaluación</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Evaluación de trabajo en patrulla — III trimestre" /></div>
          <div><Label>Descripción (opcional)</Label><Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></div>
          <p className="text-xs text-gray-500">Después de crearla vas a poder agregar los enunciados, configurar la escala (por defecto 1 a 5) y vincularla a un plan trimestral si querés.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={guardando}>{guardando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
