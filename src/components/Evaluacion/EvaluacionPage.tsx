import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle, BarChart3, ClipboardList, Copy, Eye, EyeOff, Loader2, Plus, RefreshCw, Trash2, Undo2,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
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

// Paleta categórica fija (nunca ciclada) para series por patrulla en los
// gráficos de Analítica — mismo espíritu que la guía de dataviz del proyecto.
const PALETA_CATEGORICA = ['#7c3aed', '#059669', '#d97706', '#0284c7', '#e11d48', '#4b5563'];

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
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={ESTADO_COLOR[evaluacion.estado]}>{ESTADO_LABEL[evaluacion.estado]}</Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-gray-500">
            {evaluacion.modo_anonimo ? <><EyeOff className="w-3 h-3" /> Anónima (edad + patrulla)</> : <><Eye className="w-3 h-3" /> Identificada por nombre</>}
          </Badge>
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
        <>
          <ResultadosEvaluacion
            items={items} respuestas={respuestas} respuestaItems={respuestaItems}
            escalaMin={evaluacion.escala_min} escalaMax={evaluacion.escala_max}
            puedeEliminar={can('evaluacion:eliminar')} onRespuestaEliminada={onRefrescar}
          />
          <AnaliticaEvaluacion items={items} respuestas={respuestas} respuestaItems={respuestaItems} escalaMin={evaluacion.escala_min} escalaMax={evaluacion.escala_max} />
        </>
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
function lineaDesdeItem(i: EvaluacionItem): string {
  return i.etiqueta ? `${i.enunciado} | ${i.etiqueta}` : i.enunciado;
}

function BuilderEnunciados({ evaluacionId, items, puedeEditar, onGuardado }: {
  evaluacionId: string; items: EvaluacionItem[]; puedeEditar: boolean; onGuardado: () => void;
}) {
  const [texto, setTexto] = useState(items.map(lineaDesdeItem).join('\n'));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { setTexto(items.map(lineaDesdeItem).join('\n')); }, [items]);

  const guardar = async () => {
    const enunciados = texto.split('\n').map((l) => l.trim()).filter(Boolean).map((linea) => {
      const [enunciado, etiqueta] = linea.split('|').map((p) => p.trim());
      return { enunciado, etiqueta: etiqueta || undefined };
    });
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
          <p className="text-xs text-gray-400">
            Uno por línea, en el orden en que se van a mostrar. Opcional: agregá <code className="bg-gray-100 px-1 rounded">| categoría</code> al final de la línea para agrupar enunciados en el gráfico radar de Analítica (ej. varios enunciados con <code className="bg-gray-100 px-1 rounded">| Cohesión</code>).
          </p>
          <Textarea
            value={texto} onChange={(e) => setTexto(e.target.value)} rows={10}
            placeholder={'Toma iniciativa | Proactividad\nAporta ideas nuevas al grupo | Cohesión\nIntegrado al grupo | Cohesión'}
          />
          <Button size="sm" onClick={guardar} disabled={guardando}>{guardando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Guardar enunciados</Button>
        </>
      ) : (
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
          {items.map((i) => <li key={i.id}>{i.enunciado}{i.etiqueta && <span className="text-gray-400"> — {i.etiqueta}</span>}</li>)}
        </ol>
      )}
    </div>
  );
}

function nombreRespondiente(r: EvaluacionRespuesta): { titulo: string; subtitulo?: string } {
  if (r.scout_id) {
    return { titulo: r.scout_nombre || 'Scout', subtitulo: r.patrulla_nombre };
  }
  const edad = r.edad_autorreportada ? `${r.edad_autorreportada} años` : undefined;
  return { titulo: `Anónimo — ${r.patrulla_autorreportada || 'sin patrulla'}`, subtitulo: edad };
}

// ======================================================================
// Resultados: grilla scout x enunciado (igual espíritu que la hoja en
// papel) + promedio por enunciado + señales de atención por regla simple
// (NO es IA/ML: es un umbral fijo sobre el promedio, ver AnaliticaEvaluacion).
// ======================================================================
function ResultadosEvaluacion({ items, respuestas, respuestaItems, escalaMin, escalaMax, puedeEliminar, onRespuestaEliminada }: {
  items: EvaluacionItem[]; respuestas: EvaluacionRespuesta[]; respuestaItems: EvaluacionRespuestaItem[];
  escalaMin: number; escalaMax: number; puedeEliminar: boolean; onRespuestaEliminada: () => void;
}) {
  const [eliminando, setEliminando] = useState<string | null>(null);
  const umbralAtencion = escalaMin + (escalaMax - escalaMin) * 0.4;

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

  const promedioPorRespuesta = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const [respuestaId, valores] of Object.entries(valorPorRespuestaItem)) {
      const nums = Object.values(valores);
      mapa[respuestaId] = nums.reduce((a, b) => a + b, 0) / nums.length;
    }
    return mapa;
  }, [valorPorRespuestaItem]);

  const eliminarRespuesta = async (respuestaId: string) => {
    if (!window.confirm('¿Eliminar esta respuesta? No se puede deshacer.')) return;
    setEliminando(respuestaId);
    try {
      const res = await EvaluacionService.eliminarRespuesta(respuestaId);
      if (!res.success) { toast.error(res.message || 'No se pudo eliminar la respuesta'); return; }
      toast.success('Respuesta eliminada');
      onRespuestaEliminada();
    } catch (err: any) { toast.error(err.message || 'Error al eliminar'); }
    finally { setEliminando(null); }
  };

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
              <TableHead className="sticky left-0 bg-white">Respondiente</TableHead>
              {items.map((it) => {
                const p = promedioPorItem[it.id];
                const bajo = p && (p.suma / p.cantidad) < umbralAtencion;
                return (
                  <TableHead key={it.id} className={`text-center max-w-[120px] ${bajo ? 'bg-amber-50' : ''}`} title={it.enunciado}>
                    <span className="line-clamp-3 text-xs">{it.enunciado}</span>
                    {bajo && <AlertTriangle className="w-3 h-3 text-amber-500 inline-block ml-1" />}
                  </TableHead>
                );
              })}
              {puedeEliminar && <TableHead className="w-8" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {respuestas.map((r) => {
              const { titulo, subtitulo } = nombreRespondiente(r);
              const promedio = promedioPorRespuesta[r.id];
              const requiereAtencion = typeof promedio === 'number' && promedio < umbralAtencion;
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium whitespace-nowrap sticky left-0 bg-white">
                    <span className="flex items-center gap-1.5">
                      {titulo}
                      {requiereAtencion && <Badge variant="warning" className="text-[9px] px-1.5 py-0">Atención</Badge>}
                    </span>
                    {subtitulo && <span className="block text-xs text-gray-400">{subtitulo}</span>}
                  </TableCell>
                  {items.map((it) => (
                    <TableCell key={it.id} className="text-center">
                      {valorPorRespuestaItem[r.id]?.[it.id] ?? '—'}
                    </TableCell>
                  ))}
                  {puedeEliminar && (
                    <TableCell>
                      <button onClick={() => eliminarRespuesta(r.id)} disabled={eliminando === r.id} className="text-red-400 hover:text-red-600">
                        {eliminando === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
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
              {puedeEliminar && <TableCell />}
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-gray-400 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3 text-amber-500" /> "Atención" = regla simple (no es IA): promedio por debajo de {umbralAtencion.toFixed(1)} en una escala de {escalaMin} a {escalaMax}.
      </p>
    </div>
  );
}

// ======================================================================
// Analítica: estadística descriptiva (sin ML) — promedio por enunciado,
// radar por categoría (si hay enunciados etiquetados) y comparativo por
// patrulla, con recharts (ya usado en el proyecto, ver Progresión).
// ======================================================================
function AnaliticaEvaluacion({ items, respuestas, respuestaItems, escalaMin, escalaMax }: {
  items: EvaluacionItem[]; respuestas: EvaluacionRespuesta[]; respuestaItems: EvaluacionRespuestaItem[]; escalaMin: number; escalaMax: number;
}) {
  const umbralAtencion = escalaMin + (escalaMax - escalaMin) * 0.4;

  const datosPorItem = useMemo(() => {
    const mapa: Record<string, { suma: number; cantidad: number }> = {};
    for (const ri of respuestaItems) {
      const actual = mapa[ri.item_id] || { suma: 0, cantidad: 0 };
      actual.suma += ri.valor_escala; actual.cantidad += 1;
      mapa[ri.item_id] = actual;
    }
    return items.map((it) => ({
      nombre: it.enunciado.length > 28 ? it.enunciado.slice(0, 26) + '…' : it.enunciado,
      enunciadoCompleto: it.enunciado,
      promedio: mapa[it.id] ? Number((mapa[it.id].suma / mapa[it.id].cantidad).toFixed(2)) : 0,
    }));
  }, [items, respuestaItems]);

  const datosPorEtiqueta = useMemo(() => {
    const itemsPorEtiqueta: Record<string, string[]> = {};
    for (const it of items) {
      if (!it.etiqueta) continue;
      (itemsPorEtiqueta[it.etiqueta] = itemsPorEtiqueta[it.etiqueta] || []).push(it.id);
    }
    const etiquetas = Object.keys(itemsPorEtiqueta);
    if (etiquetas.length < 3) return null; // el radar necesita al menos 3 ejes para ser legible

    const sumaPorItem: Record<string, { suma: number; cantidad: number }> = {};
    for (const ri of respuestaItems) {
      const actual = sumaPorItem[ri.item_id] || { suma: 0, cantidad: 0 };
      actual.suma += ri.valor_escala; actual.cantidad += 1;
      sumaPorItem[ri.item_id] = actual;
    }
    return etiquetas.map((etq) => {
      const itemIds = itemsPorEtiqueta[etq];
      let suma = 0, cantidad = 0;
      for (const id of itemIds) {
        if (sumaPorItem[id]) { suma += sumaPorItem[id].suma; cantidad += sumaPorItem[id].cantidad; }
      }
      return { categoria: etq, promedio: cantidad > 0 ? Number((suma / cantidad).toFixed(2)) : 0 };
    });
  }, [items, respuestaItems]);

  const datosPorPatrulla = useMemo(() => {
    const valorPorRespuesta: Record<string, number[]> = {};
    for (const ri of respuestaItems) {
      (valorPorRespuesta[ri.respuesta_id] = valorPorRespuesta[ri.respuesta_id] || []).push(ri.valor_escala);
    }
    const acumPorPatrulla: Record<string, { suma: number; cantidad: number }> = {};
    for (const r of respuestas) {
      const patrulla = r.patrulla_nombre || r.patrulla_autorreportada;
      if (!patrulla) continue;
      const valores = valorPorRespuesta[r.id] || [];
      if (valores.length === 0) continue;
      const actual = acumPorPatrulla[patrulla] || { suma: 0, cantidad: 0 };
      actual.suma += valores.reduce((a, b) => a + b, 0);
      actual.cantidad += valores.length;
      acumPorPatrulla[patrulla] = actual;
    }
    return Object.entries(acumPorPatrulla).map(([patrulla, v]) => ({ patrulla, promedio: Number((v.suma / v.cantidad).toFixed(2)) }));
  }, [respuestas, respuestaItems]);

  const itemsEnAtencion = datosPorItem.filter((d) => d.promedio > 0 && d.promedio < umbralAtencion);
  const totalRespuestas = respuestas.length;
  const promedioGeneral = datosPorItem.length > 0
    ? Number((datosPorItem.reduce((a, d) => a + d.promedio, 0) / datosPorItem.filter((d) => d.promedio > 0).length || 0).toFixed(2))
    : 0;

  if (respuestas.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-violet-600" />
        <h2 className="font-semibold text-gray-900">Analítica</h2>
        <span className="text-xs text-gray-400">— estadística descriptiva, sin IA ni servicios externos</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Respuestas" valor={String(totalRespuestas)} />
        <KpiTile label="Promedio general" valor={promedioGeneral.toFixed(1)} />
        <KpiTile label="Enunciados en atención" valor={String(itemsEnAtencion.length)} alerta={itemsEnAtencion.length > 0} />
        <KpiTile label="Escala" valor={`${escalaMin} a ${escalaMax}`} />
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Promedio por enunciado</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosPorItem} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, escalaMax]} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis type="category" dataKey="nombre" width={140} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                formatter={(value: number) => [value, 'Promedio']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.enunciadoCompleto || ''}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="promedio" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {datosPorEtiqueta && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Perfil por categoría</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={datosPorEtiqueta}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="categoria" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <PolarRadiusAxis domain={[0, escalaMax]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Radar dataKey="promedio" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {!datosPorEtiqueta && (
        <p className="text-xs text-gray-400">Agregá categoría a 3 o más enunciados (<code className="bg-gray-100 px-1 rounded">enunciado | categoría</code> en el builder) para ver acá el perfil por categoría.</p>
      )}

      {datosPorPatrulla.length > 1 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Comparativo por patrulla</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosPorPatrulla} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="patrulla" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis domain={[0, escalaMax]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar name="Promedio" dataKey="promedio" radius={[4, 4, 0, 0]}>
                  {datosPorPatrulla.map((d, idx) => <Cell key={d.patrulla} fill={PALETA_CATEGORICA[idx % PALETA_CATEGORICA.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {itemsEnAtencion.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-800 flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Posibles focos de atención (regla simple: promedio por debajo de {umbralAtencion.toFixed(1)})
          </p>
          <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
            {itemsEnAtencion.map((d) => <li key={d.enunciadoCompleto}>{d.enunciadoCompleto} — {d.promedio}</li>)}
          </ul>
          <p className="text-[10px] text-amber-600 mt-1">Esto es un umbral fijo sobre el promedio, no un modelo predictivo — usalo como punto de partida para conversar con la patrulla, no como diagnóstico.</p>
        </div>
      )}
    </div>
  );
}

function KpiTile({ label, valor, alerta }: { label: string; valor: string; alerta?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${alerta ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${alerta ? 'text-amber-700' : 'text-gray-900'}`}>{valor}</p>
    </div>
  );
}

// ======================================================================
// Modal: nueva evaluación
// ======================================================================
function ModalNuevaEvaluacion({ onClose, onCreada }: { onClose: () => void; onCreada: (id: string) => void }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [modoAnonimo, setModoAnonimo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async () => {
    if (!titulo.trim()) { toast.error('El título es obligatorio'); return; }
    setGuardando(true);
    try {
      const res = await EvaluacionService.crearEvaluacion({ titulo: titulo.trim(), descripcion: descripcion.trim() || undefined, modo_anonimo: modoAnonimo });
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

          <div>
            <Label>¿Cómo se identifica quien responde?</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setModoAnonimo(false)}
                className={`rounded-lg border p-3 text-left text-sm ${!modoAnonimo ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500' : 'border-gray-200'}`}
              >
                <span className="flex items-center gap-1 font-medium text-gray-800"><Eye className="w-4 h-4" /> Por nombre</span>
                <span className="block text-xs text-gray-500 mt-0.5">Busca su nombre en la lista de scouts. Permite hacer seguimiento individual.</span>
              </button>
              <button
                type="button"
                onClick={() => setModoAnonimo(true)}
                className={`rounded-lg border p-3 text-left text-sm ${modoAnonimo ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500' : 'border-gray-200'}`}
              >
                <span className="flex items-center gap-1 font-medium text-gray-800"><EyeOff className="w-4 h-4" /> Anónima</span>
                <span className="block text-xs text-gray-500 mt-0.5">Solo indica edad y patrulla. Mejor para temas sensibles de clima de grupo.</span>
              </button>
            </div>
            <p className="text-[11px] text-amber-600 mt-1">Esta opción queda fija una vez creada la evaluación (no se puede cambiar después).</p>
          </div>

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
