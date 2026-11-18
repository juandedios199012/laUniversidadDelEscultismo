import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Clock, FileCheck2, FileX2, Pencil, Search, Trash2, Users, X } from 'lucide-react';
import type { ConfigFormulario, RegistroInscrito } from '../types';
import { estadoArchivos, formatearTamano } from '../mockStore';

type Filtro = 'todos' | 'completos' | 'pendientes';

interface Props {
  config: ConfigFormulario;
  registros: RegistroInscrito[];
  onActualizar: (r: RegistroInscrito) => void;
  onEliminar: (id: string) => void;
}

export default function ListaInscritos({ config, registros, onActualizar, onEliminar }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [editando, setEditando] = useState<RegistroInscrito | null>(null);
  const [eliminando, setEliminando] = useState<RegistroInscrito | null>(null);

  const conEstado = useMemo(
    () => registros.map((r) => ({ r, estado: estadoArchivos(r, config.cargas) })),
    [registros, config.cargas],
  );

  const totales = {
    inscritos: registros.length,
    completos: conEstado.filter((x) => x.estado.completo).length,
    grupos: new Set(registros.map((r) => (r.valores.grupo_scout ?? '').trim().toLowerCase()).filter(Boolean)).size,
  };

  const visibles = conEstado.filter(({ r, estado }) => {
    if (filtro === 'completos' && !estado.completo) return false;
    if (filtro === 'pendientes' && estado.completo) return false;
    const q = busqueda.trim().toLowerCase();
    return !q || Object.values(r.valores).some((v) => v.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Estadistica icono={<Users className="w-5 h-5" />} color="bg-blue-50 text-blue-600" valor={totales.inscritos} texto="Patrullas inscritas" />
        <Estadistica icono={<FileCheck2 className="w-5 h-5" />} color="bg-green-50 text-green-600" valor={totales.completos} texto="Con documentos completos" />
        <Estadistica icono={<Clock className="w-5 h-5" />} color="bg-amber-50 text-amber-600" valor={totales.inscritos - totales.completos} texto={`Pendientes · ${totales.grupos} grupos`} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar patrulla, jefe o grupo…"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100" />
          </div>
          <div className="inline-flex rounded-lg bg-gray-100 p-1 text-sm">
            {(['todos', 'completos', 'pendientes'] as Filtro[]).map((f) => (
              <button key={f} onClick={() => setFiltro(f)}
                className={`rounded-md px-3 py-1.5 font-medium capitalize ${filtro === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                {config.campos.map((c) => <th key={c.id} className="px-4 py-3">{c.etiqueta}</th>)}
                <th className="px-4 py-3">Documentos</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibles.map(({ r, estado }) => (
                <tr key={r.id} className="hover:bg-gray-50/70">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">{formatearFecha(r.creadoEn)}</td>
                  {config.campos.map((c) => (
                    <td key={c.id} className="px-4 py-3 text-gray-900">{r.valores[c.id] || <span className="text-gray-300">—</span>}</td>
                  ))}
                  <td className="px-4 py-3"><EstadoDocs completos={estado.completos} total={estado.total} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button onClick={() => setEditando(r)} title="Ver / editar" className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setEliminando(r)} title="Eliminar" className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr><td colSpan={config.campos.length + 3} className="px-4 py-12 text-center text-gray-400">
                  {registros.length === 0 ? 'Aún no hay registros. Comparte el enlace público para empezar.' : 'Ningún registro coincide con la búsqueda.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editando && (
        <ModalEditar registro={editando} config={config} onCerrar={() => setEditando(null)}
          onGuardar={(r) => { onActualizar(r); setEditando(null); toast.success('Registro actualizado'); }} />
      )}

      {eliminando && (
        <Modal onCerrar={() => setEliminando(null)} ancho="max-w-md">
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
            <h3 className="text-lg font-bold text-gray-900">¿Eliminar registro?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Se eliminará la inscripción de <strong>{eliminando.valores.nombre_patrulla || 'esta patrulla'}</strong> y sus documentos. Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setEliminando(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => { onEliminar(eliminando.id); setEliminando(null); toast.success('Registro eliminado'); }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

const formatearFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function Estadistica({ icono, color, valor, texto }: { icono: React.ReactNode; color: string; valor: number; texto: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>{icono}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{valor}</p>
        <p className="text-xs text-gray-500">{texto}</p>
      </div>
    </div>
  );
}

function EstadoDocs({ completos, total }: { completos: number; total: number }) {
  const ok = completos === total;
  const pct = total ? (completos / total) * 100 : 100;
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${ok ? 'bg-green-100 text-green-700' : completos === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
        {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
        {completos}/{total}
      </span>
      <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 md:block">
        <div className={`h-full ${ok ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Modal({ children, onCerrar, ancho = 'max-w-2xl' }: { children: React.ReactNode; onCerrar: () => void; ancho?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCerrar}>
      <div className={`w-full ${ancho} max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalEditar({ registro, config, onCerrar, onGuardar }: {
  registro: RegistroInscrito; config: ConfigFormulario; onCerrar: () => void; onGuardar: (r: RegistroInscrito) => void;
}) {
  const [r, setR] = useState(registro);
  const archivoDe = (id: string) => r.archivos.find((a) => a.documentoId === id);

  return (
    <Modal onCerrar={onCerrar}>
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Registro de {registro.valores.nombre_patrulla || 'patrulla'}</h3>
          <p className="text-xs text-gray-500">Enviado el {formatearFecha(registro.creadoEn)}</p>
        </div>
        <button onClick={onCerrar} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
      </div>

      <div className="space-y-6 px-6 py-5">
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-700">Datos</h4>
          {config.campos.map((c) => (
            <label key={c.id} className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600">{c.etiqueta}</span>
              <input value={r.valores[c.id] ?? ''} onChange={(e) => setR({ ...r, valores: { ...r.valores, [c.id]: e.target.value } })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100" />
            </label>
          ))}
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold text-gray-700">Documentos cargados</h4>
          <ul className="space-y-2">
            {config.cargas.map((d) => {
              const a = archivoDe(d.id);
              return (
                <li key={d.id} className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${a ? 'border-green-200 bg-green-50/60' : 'border-gray-200 bg-gray-50'}`}>
                  {a ? <FileCheck2 className="w-5 h-5 shrink-0 text-green-600" /> : <FileX2 className="w-5 h-5 shrink-0 text-gray-300" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{d.nombre} {d.obligatorio && <span className="text-red-500">*</span>}</p>
                    <p className="truncate text-xs text-gray-500">{a ? `${a.nombreArchivo} · ${formatearTamano(a.tamanoBytes)}` : 'No cargado'}</p>
                  </div>
                  {a && (
                    <button onClick={() => setR({ ...r, archivos: r.archivos.filter((x) => x.documentoId !== d.id) })}
                      className="text-xs font-medium text-gray-400 hover:text-red-600">Quitar</button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
        <button onClick={onCerrar} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
        <button onClick={() => onGuardar(r)} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">Guardar cambios</button>
      </div>
    </Modal>
  );
}
