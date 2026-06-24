import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FileText, Building2, CalendarRange, Settings2, Plus, Pencil, Trash2,
  Printer, Save, X, FileDown,
} from 'lucide-react';
import { toast } from 'sonner';
import DocumentosService, {
  type Institucion, type EventoCarta, type PlantillaCarta,
} from '../../services/documentosService';
import CartaOficialDocumento from './CartaOficialDocumento';
import { imprimirCartaPDF, descargarCartaWord } from './cartaExport';

type Tab = 'generar' | 'instituciones' | 'eventos' | 'plantilla';

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: 'generar', label: 'Generar Carta', icon: FileText },
  { id: 'instituciones', label: 'Instituciones', icon: Building2 },
  { id: 'eventos', label: 'Eventos', icon: CalendarRange },
  { id: 'plantilla', label: 'Plantilla', icon: Settings2 },
];

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

export default function GestionDocumentos() {
  const [tab, setTab] = useState<Tab>('generar');
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [eventos, setEventos] = useState<EventoCarta[]>([]);
  const [plantilla, setPlantilla] = useState<PlantillaCarta | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarTodo = async () => {
    setCargando(true);
    const [inst, evs, plt] = await Promise.all([
      DocumentosService.listarInstituciones(false),
      DocumentosService.listarEventos(),
      DocumentosService.obtenerPlantilla(),
    ]);
    setInstituciones(inst);
    setEventos(evs);
    setPlantilla(plt);
    setCargando(false);
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Documentos</h1>
          <p className="text-sm text-gray-500">Genera cartas oficiales a partir de plantillas, instituciones y eventos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {cargando ? (
        <div className="text-center py-16 text-gray-400">Cargando…</div>
      ) : (
        <>
          {tab === 'generar' && (
            <GenerarCartaTab instituciones={instituciones} eventos={eventos} plantilla={plantilla} />
          )}
          {tab === 'instituciones' && (
            <InstitucionesTab instituciones={instituciones} onChange={cargarTodo} />
          )}
          {tab === 'eventos' && <EventosTab eventos={eventos} onChange={cargarTodo} />}
          {tab === 'plantilla' && (
            <PlantillaTab plantilla={plantilla} onSaved={cargarTodo} />
          )}
        </>
      )}
    </div>
  );
}

// ================================================================
// TAB: Generar carta
// ================================================================
function GenerarCartaTab({
  instituciones,
  eventos,
  plantilla,
}: {
  instituciones: Institucion[];
  eventos: EventoCarta[];
  plantilla: PlantillaCarta | null;
}) {
  const [institucionId, setInstitucionId] = useState('');
  const [eventoId, setEventoId] = useState('');
  const [numeroCarta, setNumeroCarta] = useState('001');
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const cartaRef = useRef<HTMLDivElement>(null);
  const [exportando, setExportando] = useState(false);

  const institucion = useMemo(
    () => instituciones.find((i) => i.id === institucionId) || null,
    [instituciones, institucionId]
  );
  const evento = useMemo(() => eventos.find((e) => e.id === eventoId) || null, [eventos, eventoId]);

  const cartaData = { plantilla, institucion, evento, numeroCarta, anio };

  const handlePDF = () => {
    if (!institucion || !evento) {
      toast.error('Selecciona una institución y un evento');
      return;
    }
    imprimirCartaPDF(cartaRef.current);
  };

  const handleWord = async () => {
    if (!institucion || !evento) {
      toast.error('Selecciona una institución y un evento');
      return;
    }
    try {
      setExportando(true);
      await descargarCartaWord(cartaData);
      toast.success('Documento Word generado');
    } catch (e) {
      toast.error('No se pudo generar el Word');
      console.error(e);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      {/* Panel de control */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-fit space-y-4">
        <h2 className="font-semibold text-gray-700">Datos de la carta</h2>

        <div>
          <label className={labelCls}>Institución destinataria</label>
          <select className={inputCls} value={institucionId} onChange={(e) => setInstitucionId(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {instituciones.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre_institucion}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Evento / actividad</label>
          <select className={inputCls} value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {eventos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.titulo || e.dinamico_actividad}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>N° de carta</label>
            <input className={inputCls} value={numeroCarta} onChange={(e) => setNumeroCarta(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Año</label>
            <input className={inputCls} value={anio} onChange={(e) => setAnio(e.target.value)} />
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handlePDF}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" /> Descargar / Imprimir PDF
          </button>
          <button
            type="button"
            onClick={handleWord}
            disabled={exportando}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <FileDown className="w-4 h-4" /> {exportando ? 'Generando…' : 'Descargar Word'}
          </button>
        </div>

        {(!institucion || !evento) && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
            Selecciona institución y evento para habilitar la descarga.
          </p>
        )}
      </div>

      {/* Vista previa */}
      <div className="bg-gray-100 rounded-xl p-4 overflow-auto">
        <div className="origin-top scale-[0.78] md:scale-90 lg:scale-100 transition-transform">
          <div className="shadow-xl">
            <CartaOficialDocumento ref={cartaRef} {...cartaData} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// TAB: Instituciones (CRUD)
// ================================================================
const institucionVacia: Institucion = {
  nombre_institucion: '',
  direccion: '',
  encargado_nombre: '',
  encargado_cargo: '',
  telefono: '',
  activo: true,
};

function InstitucionesTab({
  instituciones,
  onChange,
}: {
  instituciones: Institucion[];
  onChange: () => void;
}) {
  const [form, setForm] = useState<Institucion | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!form) return;
    if (!form.nombre_institucion.trim()) {
      toast.error('El nombre de la institución es obligatorio');
      return;
    }
    setGuardando(true);
    const res = await DocumentosService.guardarInstitucion(form);
    setGuardando(false);
    if (res.success) {
      toast.success('Institución guardada');
      setForm(null);
      onChange();
    } else {
      toast.error(res.error);
    }
  };

  const eliminar = async (inst: Institucion) => {
    if (!inst.id) return;
    if (!window.confirm(`¿Eliminar "${inst.nombre_institucion}"?`)) return;
    const res = await DocumentosService.eliminarInstitucion(inst.id);
    if (res.success) {
      toast.success('Institución eliminada');
      onChange();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-700">Directorio de instituciones</h2>
        <button
          type="button"
          onClick={() => setForm({ ...institucionVacia })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nueva institución
        </button>
      </div>

      {form && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className={labelCls}>Nombre de la institución *</label>
              <input
                className={inputCls}
                value={form.nombre_institucion}
                onChange={(e) => setForm({ ...form, nombre_institucion: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Dirección</label>
              <input
                className={inputCls}
                value={form.direccion || ''}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Encargado (nombre)</label>
              <input
                className={inputCls}
                value={form.encargado_nombre || ''}
                onChange={(e) => setForm({ ...form, encargado_nombre: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Tratamiento / cargo</label>
              <input
                className={inputCls}
                placeholder="Señor(a), Director, etc."
                value={form.encargado_cargo || ''}
                onChange={(e) => setForm({ ...form, encargado_cargo: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input
                className={inputCls}
                value={form.telefono || ''}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setForm(null)}
              className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm"
            >
              <Save className="w-4 h-4" /> {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {instituciones.length === 0 ? (
        <EmptyState icon={Building2} titulo="Sin instituciones" mensaje="Agrega la primera institución del directorio." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {instituciones.map((inst) => (
            <div key={inst.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{inst.nombre_institucion}</h3>
                  {inst.direccion && <p className="text-xs text-gray-500 mt-0.5">{inst.direccion}</p>}
                  {inst.encargado_nombre && (
                    <p className="text-xs text-gray-600 mt-1">
                      {inst.encargado_cargo || 'Encargado'}: {inst.encargado_nombre}
                    </p>
                  )}
                  {inst.telefono && <p className="text-xs text-gray-400 mt-0.5">Tel: {inst.telefono}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => setForm(inst)} title="Editar" className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => eliminar(inst)} title="Eliminar" className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ================================================================
// TAB: Eventos (CRUD)
// ================================================================
const eventoVacio: EventoCarta = {
  titulo: '',
  dinamico_actividad: '',
  dinamico_dias: '',
  dinamico_horas: '',
  dinamico_partida: '',
  dinamico_jovenes: '',
  dinamico_adultos: '',
};

function EventosTab({ eventos, onChange }: { eventos: EventoCarta[]; onChange: () => void }) {
  const [form, setForm] = useState<EventoCarta | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!form) return;
    if (!form.dinamico_actividad.trim()) {
      toast.error('La actividad es obligatoria');
      return;
    }
    setGuardando(true);
    const res = await DocumentosService.guardarEvento(form);
    setGuardando(false);
    if (res.success) {
      toast.success('Evento guardado');
      setForm(null);
      onChange();
    } else {
      toast.error(res.error);
    }
  };

  const eliminar = async (ev: EventoCarta) => {
    if (!ev.id) return;
    if (!window.confirm(`¿Eliminar "${ev.titulo || ev.dinamico_actividad}"?`)) return;
    const res = await DocumentosService.eliminarEvento(ev.id);
    if (res.success) {
      toast.success('Evento eliminado');
      onChange();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-700">Eventos / actividades</h2>
        <button
          type="button"
          onClick={() => setForm({ ...eventoVacio })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nuevo evento
        </button>
      </div>

      {form && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className={labelCls}>Título interno (para identificarlo)</label>
              <input
                className={inputCls}
                placeholder="Ej. Paseo Cielos Blancos - Junio"
                value={form.titulo || ''}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Actividad *</label>
              <input
                className={inputCls}
                placeholder="Actividad recreativa de integración"
                value={form.dinamico_actividad}
                onChange={(e) => setForm({ ...form, dinamico_actividad: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Día(s)</label>
              <input className={inputCls} value={form.dinamico_dias || ''} onChange={(e) => setForm({ ...form, dinamico_dias: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Hora(s)</label>
              <input className={inputCls} value={form.dinamico_horas || ''} onChange={(e) => setForm({ ...form, dinamico_horas: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Punto de llegada y partida</label>
              <input className={inputCls} value={form.dinamico_partida || ''} onChange={(e) => setForm({ ...form, dinamico_partida: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Cantidad de jóvenes</label>
              <input className={inputCls} value={form.dinamico_jovenes || ''} onChange={(e) => setForm({ ...form, dinamico_jovenes: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Cantidad de adultos</label>
              <input className={inputCls} value={form.dinamico_adultos || ''} onChange={(e) => setForm({ ...form, dinamico_adultos: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setForm(null)} className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button type="button" onClick={guardar} disabled={guardando} className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm">
              <Save className="w-4 h-4" /> {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {eventos.length === 0 ? (
        <EmptyState icon={CalendarRange} titulo="Sin eventos" mensaje="Crea el primer evento con sus datos dinámicos." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {eventos.map((ev) => (
            <div key={ev.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{ev.titulo || ev.dinamico_actividad}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{ev.dinamico_actividad}</p>
                  <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                    {ev.dinamico_dias && <p>Día: {ev.dinamico_dias}</p>}
                    {ev.dinamico_horas && <p>Hora: {ev.dinamico_horas}</p>}
                    {ev.dinamico_jovenes && <p>Jóvenes: {ev.dinamico_jovenes} · Adultos: {ev.dinamico_adultos || '—'}</p>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => setForm(ev)} title="Editar" className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => eliminar(ev)} title="Eliminar" className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ================================================================
// TAB: Plantilla (registro único editable)
// ================================================================
function PlantillaTab({ plantilla, onSaved }: { plantilla: PlantillaCarta | null; onSaved: () => void }) {
  const [form, setForm] = useState<PlantillaCarta>(plantilla || {});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setForm(plantilla || {});
  }, [plantilla]);

  const set = (k: keyof PlantillaCarta, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async () => {
    setGuardando(true);
    const res = await DocumentosService.guardarPlantilla(form);
    setGuardando(false);
    if (res.success) {
      toast.success('Plantilla guardada');
      onSaved();
    } else {
      toast.error(res.error);
    }
  };

  const areaCls = `${inputCls} min-h-[90px] resize-y`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 max-w-3xl">
      <h2 className="font-semibold text-gray-700">Textos y firma de la plantilla</h2>

      <div>
        <label className={labelCls}>Párrafo de presentación</label>
        <textarea className={areaCls} value={form.parrafo_presentacion || ''} onChange={(e) => set('parrafo_presentacion', e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Párrafo de responsabilidad</label>
        <textarea className={areaCls} value={form.parrafo_responsabilidad || ''} onChange={(e) => set('parrafo_responsabilidad', e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Párrafo de despedida</label>
        <textarea className={areaCls} value={form.parrafo_despedida || ''} onChange={(e) => set('parrafo_despedida', e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Frase de cierre</label>
        <input className={inputCls} value={form.frase_cierre || ''} onChange={(e) => set('frase_cierre', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
        <div>
          <label className={labelCls}>URL del banner (cabecera izquierda)</label>
          <input className={inputCls} placeholder="https://… banner SCOUTS Perú" value={form.logo_url || ''} onChange={(e) => set('logo_url', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>URL del emblema (cabecera derecha)</label>
          <input className={inputCls} placeholder="https://… emblema del grupo" value={form.emblema_url || ''} onChange={(e) => set('emblema_url', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Prefijo de carta</label>
          <input className={inputCls} placeholder="ASL12" value={form.carta_prefijo || ''} onChange={(e) => set('carta_prefijo', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>URL imagen de firma</label>
          <input className={inputCls} value={form.firma_url_imagen || ''} onChange={(e) => set('firma_url_imagen', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Firma — nombre</label>
          <input className={inputCls} value={form.firma_nombre || ''} onChange={(e) => set('firma_nombre', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Firma — cargo</label>
          <input className={inputCls} value={form.firma_cargo || ''} onChange={(e) => set('firma_cargo', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Firma — registro</label>
          <input className={inputCls} value={form.firma_registro || ''} onChange={(e) => set('firma_registro', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Instagram</label>
          <input className={inputCls} value={form.instagram || ''} onChange={(e) => set('instagram', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Facebook</label>
          <input className={inputCls} value={form.facebook || ''} onChange={(e) => set('facebook', e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="button" onClick={guardar} disabled={guardando} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
          <Save className="w-4 h-4" /> {guardando ? 'Guardando…' : 'Guardar plantilla'}
        </button>
      </div>
    </div>
  );
}

// ================================================================
// Estado vacío reutilizable
// ================================================================
function EmptyState({ icon: Icon, titulo, mensaje }: { icon: typeof FileText; titulo: string; mensaje: string }) {
  return (
    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
      <Icon className="mx-auto h-14 w-14 text-gray-300 mb-3" />
      <h3 className="text-base font-medium text-gray-700 mb-1">{titulo}</h3>
      <p className="text-sm text-gray-400">{mensaje}</p>
    </div>
  );
}
