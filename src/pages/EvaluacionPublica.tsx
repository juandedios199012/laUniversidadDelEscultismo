import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { CheckCircle2, ClipboardList, Loader2, Pencil, Search, User } from 'lucide-react';
import { ContextoEvaluacionPublica, EvaluacionService } from '../services/evaluacionService';

export default function EvaluacionPublica() {
  const { codigo } = useParams<{ codigo: string }>();
  const [contexto, setContexto] = useState<ContextoEvaluacionPublica | null>(null);
  const [cargando, setCargando] = useState(true);

  const [scoutId, setScoutId] = useState<string | null>(null);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!codigo) return;
    EvaluacionService.obtenerEvaluacionPublica(codigo)
      .then(setContexto)
      .catch((err) => toast.error(err.message || 'No se pudo cargar la evaluación'))
      .finally(() => setCargando(false));
  }, [codigo]);

  const identificarme = async (id: string, nombre: string) => {
    if (!codigo) return;
    try {
      const res = await EvaluacionService.iniciarRespuesta(codigo, id);
      if (!res.success) { toast.error(res.message || 'No se pudo continuar'); return; }
      const previas: Record<string, number> = {};
      for (const p of res.respuestas_previas || []) previas[p.item_id] = p.valor_escala;
      setScoutId(id);
      setNombreCompleto(nombre);
      setRespuestas(previas);
      setEnviado(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al identificarte');
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!contexto?.success || !contexto.evaluacion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <p className="text-lg font-semibold text-gray-700">No disponible</p>
          <p className="text-sm text-gray-500 mt-1">{contexto?.message || 'Este link no es válido.'}</p>
        </div>
      </div>
    );
  }

  const { evaluacion, items = [] } = contexto;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <Toaster richColors position="top-center" />
      <header className="sticky top-0 z-10 bg-violet-600 text-white px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-4 shadow-sm">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          <p className="text-xs uppercase tracking-wide opacity-80">Evaluación</p>
        </div>
        <h1 className="text-2xl font-extrabold">{evaluacion.titulo}</h1>
        {evaluacion.descripcion && <p className="text-sm opacity-90 mt-1">{evaluacion.descripcion}</p>}
      </header>

      <main className="px-4 pt-4">
        {!scoutId ? (
          <BuscadorScout codigo={codigo!} onIdentificado={identificarme} />
        ) : enviado ? (
          <Confirmacion nombre={nombreCompleto} onEditar={() => setEnviado(false)} />
        ) : (
          <FormularioEscala
            codigo={codigo!}
            scoutId={scoutId}
            nombreCompleto={nombreCompleto}
            items={items}
            escalaMin={evaluacion.escala_min}
            escalaMax={evaluacion.escala_max}
            etiquetaMin={evaluacion.etiqueta_escala_min}
            etiquetaMax={evaluacion.etiqueta_escala_max}
            instrucciones={evaluacion.instrucciones}
            respuestasIniciales={respuestas}
            onEnviado={() => setEnviado(true)}
          />
        )}
      </main>
    </div>
  );
}

function BuscadorScout({ codigo, onIdentificado }: { codigo: string; onIdentificado: (scoutId: string, nombre: string) => void }) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Array<{ scout_id: string; nombre_completo: string; patrulla_nombre?: string }>>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (busqueda.trim().length < 2) { setResultados([]); return; }
    const timeout = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await EvaluacionService.buscarScouts(codigo, busqueda.trim());
        if (!res.success) { toast.error(res.message || 'No se pudo buscar'); return; }
        setResultados(res.resultados);
      } catch (err: any) {
        toast.error(err.message || 'Error al buscar');
      } finally {
        setBuscando(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [busqueda, codigo]);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-sm text-gray-600 mb-2">Buscá tu nombre para identificarte y empezar:</p>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-3 text-base"
            placeholder="Escribí tu nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {buscando && <p className="text-center text-sm text-gray-400 py-4">Buscando...</p>}

      {!buscando && busqueda.trim().length >= 2 && resultados.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-4">No encontramos a nadie con ese nombre.</p>
      )}

      <div className="space-y-2">
        {resultados.map((r) => (
          <button
            key={r.scout_id}
            onClick={() => onIdentificado(r.scout_id, r.nombre_completo)}
            className="w-full bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 text-left hover:border-violet-300"
          >
            <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{r.nombre_completo}</p>
              {r.patrulla_nombre && <p className="text-xs text-gray-400">{r.patrulla_nombre}</p>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function FormularioEscala({ codigo, scoutId, nombreCompleto, items, escalaMin, escalaMax, etiquetaMin, etiquetaMax, instrucciones, respuestasIniciales, onEnviado }: {
  codigo: string; scoutId: string; nombreCompleto: string;
  items: Array<{ id: string; orden: number; enunciado: string }>;
  escalaMin: number; escalaMax: number; etiquetaMin?: string; etiquetaMax?: string; instrucciones?: string;
  respuestasIniciales: Record<string, number>;
  onEnviado: () => void;
}) {
  const [respuestas, setRespuestas] = useState<Record<string, number>>(respuestasIniciales);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { setRespuestas(respuestasIniciales); }, [respuestasIniciales]);

  const opciones = useMemo(() => {
    const arr: number[] = [];
    for (let v = escalaMin; v <= escalaMax; v++) arr.push(v);
    return arr;
  }, [escalaMin, escalaMax]);

  const faltantes = items.length - Object.keys(respuestas).filter((id) => items.some((it) => it.id === id)).length;

  const enviar = async () => {
    if (faltantes > 0) { toast.error(`Te falta responder ${faltantes} punto(s)`); return; }
    setEnviando(true);
    try {
      const payload = items.map((it) => ({ item_id: it.id, valor_escala: respuestas[it.id] }));
      const res = await EvaluacionService.enviarRespuesta(codigo, scoutId, payload);
      if (!res.success) { toast.error(res.message || 'No se pudo enviar'); return; }
      toast.success('¡Enviado!');
      onEnviado();
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Respondiendo como</p>
        <p className="font-bold text-gray-900">{nombreCompleto}</p>
        {instrucciones && <p className="text-sm text-gray-600 mt-2">{instrucciones}</p>}
      </div>

      {items.map((item) => (
        <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="font-medium text-gray-900 mb-3">{item.enunciado}</p>
          <div className="flex items-center justify-between gap-1">
            {etiquetaMin && <span className="text-[10px] text-gray-400 shrink-0 w-12">{etiquetaMin}</span>}
            <div className="flex-1 flex items-center justify-center gap-2">
              {opciones.map((valor) => {
                const seleccionado = respuestas[item.id] === valor;
                return (
                  <button
                    key={valor}
                    onClick={() => setRespuestas((prev) => ({ ...prev, [item.id]: valor }))}
                    className={`w-10 h-10 rounded-full font-bold text-sm border-2 shrink-0 ${seleccionado ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-300 text-gray-500'}`}
                  >
                    {valor}
                  </button>
                );
              })}
            </div>
            {etiquetaMax && <span className="text-[10px] text-gray-400 shrink-0 w-12 text-right">{etiquetaMax}</span>}
          </div>
        </div>
      ))}

      <button
        onClick={enviar}
        disabled={enviando}
        className="w-full rounded-xl py-3.5 bg-violet-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {enviando && <Loader2 className="w-4 h-4 animate-spin" />} Enviar mis respuestas
      </button>
      {faltantes > 0 && <p className="text-center text-xs text-gray-400">Te falta responder {faltantes} punto(s)</p>}
    </div>
  );
}

function Confirmacion({ nombre, onEditar }: { nombre: string; onEditar: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3">
      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
      <p className="font-bold text-lg text-gray-900">¡Gracias, {nombre.split(' ')[0]}!</p>
      <p className="text-sm text-gray-500">Tu evaluación quedó registrada.</p>
      <button onClick={onEditar} className="inline-flex items-center gap-1 text-violet-600 text-sm font-medium mt-2">
        <Pencil className="w-3.5 h-3.5" /> Corregir mis respuestas
      </button>
    </div>
  );
}
