import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarRange, Copy, Link2, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
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

const RAMAS = ['Lobatos', 'Scouts', 'Rovers'];

const FASES: { estado: EstadoPlanTrimestral; label: string }[] = [
  { estado: 'PROPUESTAS_ABIERTAS', label: '1. Propuestas' },
  { estado: 'VOTACION', label: '2. Votación' },
  { estado: 'VIGENTE', label: '3. Plan vigente' },
  { estado: 'CERRADO', label: '4. Cerrado' },
];

export default function PlanificacionPage() {
  const { can, puedeAcceder } = usePermissions();
  const [ramaFiltro, setRamaFiltro] = useState('Scouts');
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

  const refrescarDetalle = useCallback(() => { if (planId) cargarDetallePlan(planId); }, [planId, cargarDetallePlan]);

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

  if (!puedeAcceder('planificacion')) {
    return <div className="p-8 text-center text-gray-500">No tienes acceso a este módulo.</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-7 h-7 text-indigo-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Planificación Anual</h1>
            <p className="text-sm text-gray-500">Propuestas de patrulla → votación → plan trimestral vigente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={ramaFiltro} onValueChange={setRamaFiltro}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RAMAS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          {can('planificacion:aprobar') && (
            <Button onClick={() => setModalNuevoPlan(true)}><Plus className="w-4 h-4 mr-1" /> Nuevo plan</Button>
          )}
        </div>
      </header>

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
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setModalLinks(true)}>
                <Link2 className="w-4 h-4 mr-1" /> Links de patrullas
              </Button>
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
            </div>
          </div>

          <TableroPlanificacion
            plan={plan}
            propuestas={propuestas}
            actividades={actividades}
            conteoVotos={conteoVotos}
            onRefrescar={refrescarDetalle}
            onEditarActividad={setModalActividad}
            onCrearEnFecha={setModalNuevaActividadFecha}
          />
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
