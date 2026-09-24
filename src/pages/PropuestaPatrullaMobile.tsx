import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { Calendar, CheckCircle2, Loader2, MapPin, Plus, Tent, Trash2, Vote } from 'lucide-react';
import { ContextoToken, PlanificacionService } from '../services/planificacionService';

const MESES_LABEL = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatoFechaCorta(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00');
  return `${d.getDate()} ${MESES_LABEL[d.getMonth()]}`;
}

export default function PropuestaPatrullaMobile() {
  const { token } = useParams<{ token: string }>();
  const [contexto, setContexto] = useState<ContextoToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [fechaFormAbierta, setFechaFormAbierta] = useState<string | null>(null);
  const [formEspecialAbierto, setFormEspecialAbierto] = useState(false);

  const cargar = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await PlanificacionService.obtenerContextoToken(token);
      setContexto(data);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const sabados = useMemo(() => {
    if (!contexto?.plan) return [];
    return PlanificacionService.generarSabados(contexto.plan.fecha_inicio, contexto.plan.fecha_fin);
  }, [contexto?.plan]);

  const fechasEspeciales = useMemo(() => {
    const set = new Set<string>();
    (contexto?.propuestas || []).forEach((p) => { if (p.es_actividad_especial) set.add(p.fecha); });
    return Array.from(set).sort();
  }, [contexto?.propuestas]);

  const propuestasPorFecha = useMemo(() => {
    const mapa: Record<string, ContextoToken['propuestas']> = {};
    for (const p of contexto?.propuestas || []) {
      (mapa[p.fecha] = mapa[p.fecha] || []).push(p);
    }
    return mapa;
  }, [contexto?.propuestas]);

  const votoPropioPorFecha = useMemo(() => {
    const mapa: Record<string, string> = {};
    for (const v of contexto?.votos_propios || []) mapa[v.fecha] = v.propuesta_id;
    return mapa;
  }, [contexto?.votos_propios]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!contexto?.success || !contexto.plan || !contexto.patrulla) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <p className="text-lg font-semibold text-gray-700">Link no válido</p>
          <p className="text-sm text-gray-500 mt-1">{contexto?.message || 'Pide a tu dirigente que te comparta el link actualizado.'}</p>
        </div>
      </div>
    );
  }

  const { plan, patrulla } = contexto;
  const colorPatrulla = patrulla.color_patrulla || '#6366f1';

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <Toaster richColors position="top-center" />

      <header className="sticky top-0 z-10 text-white px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-4 shadow-sm" style={{ backgroundColor: colorPatrulla }}>
        <p className="text-xs uppercase tracking-wide opacity-80">{plan.rama} · {plan.nombre}</p>
        <h1 className="text-2xl font-extrabold">Patrulla {patrulla.nombre}</h1>
      </header>

      <main className="px-4 pt-4 space-y-4">
        {plan.estado === 'PROPUESTAS_ABIERTAS' && (
          <FaseTexto icono={<Plus className="w-5 h-5" />} texto="Proponé actividades para los sábados del trimestre. Después todas las patrullas votan." />
        )}
        {plan.estado === 'VOTACION' && (
          <FaseTexto icono={<Vote className="w-5 h-5" />} texto="Es momento de votar: elegí tu propuesta favorita para cada sábado." />
        )}
        {(plan.estado === 'VIGENTE' || plan.estado === 'CERRADO') && (
          <FaseTexto icono={<CheckCircle2 className="w-5 h-5" />} texto="¡El plan trimestral ya está definido! Este es el calendario oficial." />
        )}

        {(plan.estado === 'VIGENTE' || plan.estado === 'CERRADO') ? (
          <CalendarioVigente calendario={contexto.calendario_vigente || []} />
        ) : (
          <>
            {sabados.map((fecha) => (
              <TarjetaFecha
                key={fecha}
                fecha={fecha}
                fase={plan.estado}
                propuestas={propuestasPorFecha[fecha] || []}
                patrullaPropiaId={patrulla.id}
                votoPropio={votoPropioPorFecha[fecha]}
                formAbierto={fechaFormAbierta === fecha}
                onAbrirForm={() => setFechaFormAbierta(fechaFormAbierta === fecha ? null : fecha)}
                onCambio={cargar}
                token={token!}
              />
            ))}

            {fechasEspeciales.map((fecha) => (
              <TarjetaFecha
                key={fecha}
                fecha={fecha}
                fase={plan.estado}
                especial
                propuestas={propuestasPorFecha[fecha] || []}
                patrullaPropiaId={patrulla.id}
                votoPropio={votoPropioPorFecha[fecha]}
                formAbierto={fechaFormAbierta === fecha}
                onAbrirForm={() => setFechaFormAbierta(fechaFormAbierta === fecha ? null : fecha)}
                onCambio={cargar}
                token={token!}
              />
            ))}

            {plan.estado === 'PROPUESTAS_ABIERTAS' && (
              <button
                onClick={() => setFormEspecialAbierto(true)}
                className="w-full rounded-2xl border-2 border-dashed border-gray-300 py-4 text-gray-500 flex items-center justify-center gap-2 font-medium"
              >
                <Tent className="w-5 h-5" /> Agregar campamento u otra fecha especial
              </button>
            )}
          </>
        )}
      </main>

      {formEspecialAbierto && (
        <FormularioEspecial token={token!} onClose={() => setFormEspecialAbierto(false)} onCreado={() => { setFormEspecialAbierto(false); cargar(); }} />
      )}
    </div>
  );
}

function FaseTexto({ icono, texto }: { icono: React.ReactNode; texto: string }) {
  return (
    <div className="flex items-start gap-2 bg-white rounded-xl border border-gray-200 p-3 text-sm text-gray-600">
      <span className="text-indigo-500 mt-0.5">{icono}</span>
      <p>{texto}</p>
    </div>
  );
}

function CalendarioVigente({ calendario }: { calendario: NonNullable<ContextoToken['calendario_vigente']> }) {
  if (calendario.length === 0) {
    return <p className="text-center text-gray-400 py-10">Todavía no hay actividades confirmadas.</p>;
  }
  return (
    <div className="space-y-2">
      {calendario.map((a) => (
        <div key={a.id} className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-indigo-600">{formatoFechaCorta(a.fecha)}{a.fecha_fin && a.fecha_fin !== a.fecha ? ` → ${formatoFechaCorta(a.fecha_fin)}` : ''}</p>
          <p className="font-bold text-gray-900">{a.titulo}</p>
          {a.lugar && <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {a.lugar}</p>}
          {a.descripcion && <p className="text-sm text-gray-500 mt-1">{a.descripcion}</p>}
        </div>
      ))}
    </div>
  );
}

interface TarjetaFechaProps {
  fecha: string;
  especial?: boolean;
  fase: 'PROPUESTAS_ABIERTAS' | 'VOTACION' | 'VIGENTE' | 'CERRADO';
  propuestas: NonNullable<ContextoToken['propuestas']>;
  patrullaPropiaId: string;
  votoPropio?: string;
  formAbierto: boolean;
  onAbrirForm: () => void;
  onCambio: () => void;
  token: string;
}

function TarjetaFecha({ fecha, especial, fase, propuestas, patrullaPropiaId, votoPropio, formAbierto, onAbrirForm, onCambio, token }: TarjetaFechaProps) {
  const [votando, setVotando] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const votar = async (propuestaId: string) => {
    setVotando(propuestaId);
    try {
      const res = await PlanificacionService.registrarVoto(token, fecha, propuestaId);
      if (!res.success) { toast.error(res.message || 'No se pudo registrar el voto'); return; }
      toast.success('¡Voto registrado!');
      onCambio();
    } catch (err: any) {
      toast.error(err.message || 'Error al votar');
    } finally {
      setVotando(null);
    }
  };

  const eliminar = async (propuestaId: string) => {
    setEliminando(propuestaId);
    try {
      const res = await PlanificacionService.eliminarPropuesta(token, propuestaId);
      if (!res.success) { toast.error(res.message || 'No se pudo eliminar'); return; }
      onCambio();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="font-bold text-gray-900">{formatoFechaCorta(fecha)}</span>
          {especial && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Especial</span>}
        </div>
        {fase === 'PROPUESTAS_ABIERTAS' && (
          <button onClick={onAbrirForm} className="text-indigo-600 text-sm font-semibold flex items-center gap-1">
            <Plus className="w-4 h-4" /> Proponer
          </button>
        )}
      </div>

      {propuestas.length === 0 && !formAbierto && (
        <p className="px-4 pb-3 text-sm text-gray-400">Todavía nadie propuso nada para este día.</p>
      )}

      <div className="px-4 pb-3 space-y-2">
        {propuestas.map((p) => {
          const esPropia = p.patrulla_id === patrullaPropiaId;
          const yaVotadaPorMi = votoPropio === p.id;
          return (
            <div key={p.id} className={`rounded-xl p-3 border ${esPropia ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{p.titulo}</p>
                  <p className="text-xs text-gray-500">{p.patrulla_nombre}{esPropia ? ' (tu patrulla)' : ''}</p>
                  {p.lugar_sugerido && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {p.lugar_sugerido}</p>}
                  {p.descripcion && <p className="text-xs text-gray-500 mt-1">{p.descripcion}</p>}
                </div>
                {fase === 'PROPUESTAS_ABIERTAS' && esPropia && (
                  <button onClick={() => eliminar(p.id)} disabled={eliminando === p.id} className="text-red-400 shrink-0">
                    {eliminando === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {fase === 'VOTACION' && (
                <button
                  onClick={() => votar(p.id)}
                  disabled={votando === p.id}
                  className={`mt-2 w-full rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-1 ${yaVotadaPorMi ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
                >
                  {votando === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : yaVotadaPorMi ? <CheckCircle2 className="w-4 h-4" /> : <Vote className="w-4 h-4" />}
                  {yaVotadaPorMi ? 'Tu voto' : 'Votar por esta'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {formAbierto && fase === 'PROPUESTAS_ABIERTAS' && (
        <FormularioPropuesta fecha={fecha} token={token} onClose={onAbrirForm} onCreada={onCambio} />
      )}
    </div>
  );
}

function FormularioPropuesta({ fecha, token, onClose, onCreada }: { fecha: string; token: string; onClose: () => void; onCreada: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [lugar, setLugar] = useState('');
  const [guardando, setGuardando] = useState(false);

  const enviar = async () => {
    if (!titulo.trim()) { toast.error('Ponele un nombre a la actividad'); return; }
    setGuardando(true);
    try {
      const res = await PlanificacionService.registrarPropuesta(token, { fecha, titulo, descripcion, lugar });
      if (!res.success) { toast.error(res.message || 'No se pudo guardar'); return; }
      toast.success('¡Propuesta enviada!');
      setTitulo(''); setDescripcion(''); setLugar('');
      onCreada();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-2">
      <input className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base" placeholder="¿Qué quieren hacer? (ej. Juegos en el parque)" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      <input className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base" placeholder="Lugar (opcional)" value={lugar} onChange={(e) => setLugar(e.target.value)} />
      <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base" placeholder="Descripción (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 rounded-lg py-2.5 border border-gray-300 text-gray-600 font-medium">Cancelar</button>
        <button onClick={enviar} disabled={guardando} className="flex-1 rounded-lg py-2.5 bg-indigo-600 text-white font-bold flex items-center justify-center gap-1">
          {guardando && <Loader2 className="w-4 h-4 animate-spin" />} Enviar
        </button>
      </div>
    </div>
  );
}

function FormularioEspecial({ token, onClose, onCreado }: { token: string; onClose: () => void; onCreado: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [lugar, setLugar] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [guardando, setGuardando] = useState(false);

  const enviar = async () => {
    if (!titulo.trim() || !fechaInicio) { toast.error('Completa el nombre y la fecha'); return; }
    setGuardando(true);
    try {
      const res = await PlanificacionService.registrarPropuesta(token, {
        fecha: fechaInicio, fecha_fin: fechaFin || undefined, titulo, descripcion, lugar, es_especial: true,
      });
      if (!res.success) { toast.error(res.message || 'No se pudo guardar'); return; }
      toast.success('¡Propuesta especial enviada!');
      onCreado();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-20">
      <div className="bg-white w-full rounded-t-2xl p-4 space-y-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <h2 className="font-bold text-lg flex items-center gap-2"><Tent className="w-5 h-5 text-amber-600" /> Fecha especial</h2>
        <p className="text-sm text-gray-500">Para campamentos, salidas u otra actividad que no sea un sábado normal.</p>
        <input className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base" placeholder="Nombre (ej. Campamento de verano)" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base" placeholder="Fecha fin (opcional)" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        </div>
        <input className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base" placeholder="Lugar (opcional)" value={lugar} onChange={(e) => setLugar(e.target.value)} />
        <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base" placeholder="Descripción (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 rounded-lg py-2.5 border border-gray-300 text-gray-600 font-medium">Cancelar</button>
          <button onClick={enviar} disabled={guardando} className="flex-1 rounded-lg py-2.5 bg-amber-600 text-white font-bold flex items-center justify-center gap-1">
            {guardando && <Loader2 className="w-4 h-4 animate-spin" />} Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
