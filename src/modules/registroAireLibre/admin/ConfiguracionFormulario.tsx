import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowDown, ArrowUp, Download, Eye, Image as ImageIcon, LayoutTemplate, Paperclip, Plus, RotateCcw, Save, Trash2, Upload, Type,
} from 'lucide-react';
import type { CampoFormulario, ConfigFormulario, DocumentoCarga, DocumentoDescarga } from '../types';
import { nuevoId } from '../mockStore';
import FondoMarcaAgua from '../components/FondoMarcaAgua';
import FormularioRegistro from '../components/FormularioRegistro';

const MINIMO_DOCUMENTOS = 3;
const MAX_IMAGEN_MB = 1.5; // límite de la maqueta (localStorage)
const IMAGENES_SUGERIDAS = [
  '/images/cabecera-banner-scouts-peru.png',
  '/images/cabecera-emblema-grupo-scout-lima12.jpg',
  '/images/logo-scouts.png',
  '/images/fondo-anual.jpg',
];
const FORMATOS_DISPONIBLES = ['.pdf', '.jpg', '.png', '.docx', '.xlsx'];

interface Props {
  config: ConfigFormulario;
  onGuardar: (c: ConfigFormulario) => boolean;
  onRestablecer: () => void;
}

export default function ConfiguracionFormulario({ config, onGuardar, onRestablecer }: Props) {
  const [borrador, setBorrador] = useState<ConfigFormulario>(config);
  useEffect(() => setBorrador(config), [config]);

  const cambiado = JSON.stringify(borrador) !== JSON.stringify(config);
  const set = <K extends keyof ConfigFormulario>(k: K, v: ConfigFormulario[K]) => setBorrador((b) => ({ ...b, [k]: v }));

  const guardar = () => {
    if (borrador.campos.some((c) => !c.etiqueta.trim())) return toast.error('Todos los campos necesitan una etiqueta');
    if (borrador.descargas.length < MINIMO_DOCUMENTOS) return toast.error(`Configura al menos ${MINIMO_DOCUMENTOS} documentos para descargar`);
    if (borrador.cargas.length < MINIMO_DOCUMENTOS) return toast.error(`Configura al menos ${MINIMO_DOCUMENTOS} documentos para cargar`);
    if (borrador.cargas.some((c) => c.formatos.length === 0)) return toast.error('Cada documento a cargar necesita al menos un formato');
    if (onGuardar(borrador)) toast.success('Configuración guardada');
    else toast.error('No se pudo guardar: probablemente una imagen o archivo es demasiado grande');
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Editor */}
      <div className="space-y-5">
        <Panel titulo="Encabezado" icono={<LayoutTemplate className="w-4 h-4" />}>
          <Campo etiqueta="Título">
            <input className={inputCls} value={borrador.cabecera.titulo}
              onChange={(e) => set('cabecera', { ...borrador.cabecera, titulo: e.target.value })} />
          </Campo>
          <Campo etiqueta="Subtítulo">
            <input className={inputCls} value={borrador.cabecera.subtitulo}
              onChange={(e) => set('cabecera', { ...borrador.cabecera, subtitulo: e.target.value })} />
          </Campo>
          <Campo etiqueta="Detalle (fechas, lugar, indicaciones)">
            <textarea rows={2} className={inputCls} value={borrador.cabecera.detalle}
              onChange={(e) => set('cabecera', { ...borrador.cabecera, detalle: e.target.value })} />
          </Campo>
          <SelectorImagen etiqueta="Imagen del encabezado" valor={borrador.cabecera.imagenUrl}
            onChange={(url) => set('cabecera', { ...borrador.cabecera, imagenUrl: url })} />
        </Panel>

        <Panel titulo="Fondo / marca de agua" icono={<ImageIcon className="w-4 h-4" />}>
          <SelectorImagen etiqueta="Foto de fondo" valor={borrador.marcaAgua.imagenUrl}
            onChange={(url) => set('marcaAgua', { ...borrador.marcaAgua, imagenUrl: url })} />
          <Campo etiqueta={`Opacidad: ${borrador.marcaAgua.opacidad}%`}>
            <input type="range" min={0} max={60} value={borrador.marcaAgua.opacidad} className="w-full accent-green-600"
              onChange={(e) => set('marcaAgua', { ...borrador.marcaAgua, opacidad: Number(e.target.value) })} />
          </Campo>
        </Panel>

        <Panel titulo="Campos del formulario" icono={<Type className="w-4 h-4" />}
          accion={<BotonAgregar onClick={() => set('campos', [...borrador.campos,
            { id: `campo_${nuevoId().slice(0, 8)}`, etiqueta: 'Nuevo campo', placeholder: '', obligatorio: false, base: false }])} />}>
          <ListaOrdenable items={borrador.campos} onChange={(l) => set('campos', l)}
            puedeEliminar={(c) => !c.base}
            render={(c, upd) => <EditorCampo campo={c} onChange={upd} />} />
        </Panel>

        <Panel titulo="Documentos para descargar" icono={<Download className="w-4 h-4" />}
          minimo={{ actual: borrador.descargas.length, requerido: MINIMO_DOCUMENTOS }}
          accion={<BotonAgregar onClick={() => set('descargas', [...borrador.descargas,
            { id: nuevoId(), nombre: 'Nuevo documento', descripcion: '', archivoNombre: null, url: null }])} />}>
          <ListaOrdenable items={borrador.descargas} onChange={(l) => set('descargas', l)}
            render={(d, upd) => <EditorDescarga doc={d} onChange={upd} />} />
        </Panel>

        <Panel titulo="Documentos para cargar" icono={<Upload className="w-4 h-4" />}
          minimo={{ actual: borrador.cargas.length, requerido: MINIMO_DOCUMENTOS }}
          accion={<BotonAgregar onClick={() => set('cargas', [...borrador.cargas,
            { id: nuevoId(), nombre: 'Nuevo documento', descripcion: '', obligatorio: true, formatos: ['.pdf'], tamanoMaxMB: 5 }])} />}>
          <ListaOrdenable items={borrador.cargas} onChange={(l) => set('cargas', l)}
            render={(d, upd) => <EditorCarga doc={d} onChange={upd} />} />
        </Panel>

        <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
          <button onClick={() => { if (confirm('¿Restablecer la configuración de ejemplo?')) onRestablecer(); }}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
            <RotateCcw className="w-4 h-4" /> Restablecer
          </button>
          <div className="flex items-center gap-3">
            {cambiado && <span className="text-xs font-medium text-amber-600">Cambios sin guardar</span>}
            <button onClick={() => setBorrador(config)} disabled={!cambiado}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40">Descartar</button>
            <button onClick={guardar} disabled={!cambiado}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40">
              <Save className="w-4 h-4" /> Guardar
            </button>
          </div>
        </div>
      </div>

      {/* Vista previa */}
      <div className="xl:sticky xl:top-4 self-start">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
          <Eye className="w-4 h-4" /> Vista previa en vivo
        </div>
        <div className="h-[calc(100vh-10rem)] overflow-y-auto rounded-2xl border border-gray-200 shadow-inner">
          <FondoMarcaAgua marcaAgua={borrador.marcaAgua} fijo={false}>
            <div className="p-4"><FormularioRegistro config={borrador} vistaPrevia /></div>
          </FondoMarcaAgua>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100';

function Panel({ titulo, icono, accion, minimo, children }: {
  titulo: string; icono: React.ReactNode; accion?: React.ReactNode;
  minimo?: { actual: number; requerido: number }; children: React.ReactNode;
}) {
  const falta = minimo && minimo.actual < minimo.requerido;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-bold text-gray-900">
          <span className="w-7 h-7 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">{icono}</span>
          {titulo}
          {minimo && (
            <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${falta ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
              {minimo.actual} · mín. {minimo.requerido}
            </span>
          )}
        </h3>
        {accion}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-600">{etiqueta}</span>
      {children}
    </label>
  );
}

function BotonAgregar({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700 hover:bg-green-100">
      <Plus className="w-4 h-4" /> Agregar
    </button>
  );
}

function ListaOrdenable<T extends { id: string }>({ items, onChange, render, puedeEliminar = () => true }: {
  items: T[];
  onChange: (l: T[]) => void;
  render: (item: T, actualizar: (nuevo: T) => void) => React.ReactNode;
  puedeEliminar?: (item: T) => boolean;
}) {
  const mover = (i: number, d: -1 | 1) => {
    const l = [...items];
    [l[i], l[i + d]] = [l[i + d], l[i]];
    onChange(l);
  };
  return (
    <>
      {items.map((it, i) => (
        <div key={it.id} className="flex gap-2 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
          <div className="flex flex-col gap-1">
            <BotonIcono titulo="Subir" disabled={i === 0} onClick={() => mover(i, -1)}><ArrowUp className="w-3.5 h-3.5" /></BotonIcono>
            <BotonIcono titulo="Bajar" disabled={i === items.length - 1} onClick={() => mover(i, 1)}><ArrowDown className="w-3.5 h-3.5" /></BotonIcono>
            {puedeEliminar(it) && (
              <BotonIcono titulo="Eliminar" peligro onClick={() => onChange(items.filter((x) => x.id !== it.id))}><Trash2 className="w-3.5 h-3.5" /></BotonIcono>
            )}
          </div>
          <div className="min-w-0 flex-1">{render(it, (n) => onChange(items.map((x) => (x.id === it.id ? n : x))))}</div>
        </div>
      ))}
      {items.length === 0 && <p className="py-4 text-center text-sm text-gray-400">Sin elementos</p>}
    </>
  );
}

function BotonIcono({ children, titulo, onClick, disabled, peligro }: {
  children: React.ReactNode; titulo: string; onClick: () => void; disabled?: boolean; peligro?: boolean;
}) {
  return (
    <button type="button" title={titulo} aria-label={titulo} onClick={onClick} disabled={disabled}
      className={`rounded-md p-1 text-gray-400 hover:bg-white disabled:opacity-30 ${peligro ? 'hover:text-red-600' : 'hover:text-gray-700'}`}>
      {children}
    </button>
  );
}

function Interruptor({ activo, onChange, texto }: { activo: boolean; onChange: (v: boolean) => void; texto: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600">
      <input type="checkbox" checked={activo} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-green-600" />
      {texto}
    </label>
  );
}

function EditorCampo({ campo, onChange }: { campo: CampoFormulario; onChange: (c: CampoFormulario) => void }) {
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={inputCls} value={campo.etiqueta} placeholder="Etiqueta" onChange={(e) => onChange({ ...campo, etiqueta: e.target.value })} />
        <input className={inputCls} value={campo.placeholder} placeholder="Texto de ayuda" onChange={(e) => onChange({ ...campo, placeholder: e.target.value })} />
      </div>
      <div className="flex items-center gap-3">
        <Interruptor activo={campo.obligatorio} texto="Obligatorio" onChange={(v) => onChange({ ...campo, obligatorio: v })} />
        {campo.base && <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-500">Campo base</span>}
      </div>
    </div>
  );
}

function EditorDescarga({ doc, onChange }: { doc: DocumentoDescarga; onChange: (d: DocumentoDescarga) => void }) {
  const adjuntar = (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_IMAGEN_MB * 1_000_000) {
      toast.error(`En la maqueta los archivos deben pesar menos de ${MAX_IMAGEN_MB} MB`);
      return;
    }
    const lector = new FileReader();
    lector.onload = () => onChange({ ...doc, archivoNombre: f.name, url: String(lector.result) });
    lector.readAsDataURL(f);
  };
  return (
    <div className="space-y-2">
      <input className={inputCls} value={doc.nombre} placeholder="Nombre del documento" onChange={(e) => onChange({ ...doc, nombre: e.target.value })} />
      <input className={inputCls} value={doc.descripcion} placeholder="Descripción breve" onChange={(e) => onChange({ ...doc, descripcion: e.target.value })} />
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          <Paperclip className="w-3.5 h-3.5" /> {doc.archivoNombre ? 'Reemplazar archivo' : 'Adjuntar archivo'}
          <input type="file" className="hidden" onChange={(e) => { adjuntar(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        {doc.archivoNombre
          ? <span className="truncate text-xs text-green-700">✓ {doc.archivoNombre}</span>
          : <span className="text-xs text-amber-600">Sin archivo: el público verá “Próximamente”</span>}
      </div>
    </div>
  );
}

function EditorCarga({ doc, onChange }: { doc: DocumentoCarga; onChange: (d: DocumentoCarga) => void }) {
  const alternarFormato = (f: string) =>
    onChange({ ...doc, formatos: doc.formatos.includes(f) ? doc.formatos.filter((x) => x !== f) : [...doc.formatos, f] });
  return (
    <div className="space-y-2">
      <input className={inputCls} value={doc.nombre} placeholder="Nombre del documento" onChange={(e) => onChange({ ...doc, nombre: e.target.value })} />
      <input className={inputCls} value={doc.descripcion} placeholder="Indicaciones para el público" onChange={(e) => onChange({ ...doc, descripcion: e.target.value })} />
      <div className="flex flex-wrap items-center gap-1.5">
        {FORMATOS_DISPONIBLES.map((f) => (
          <button key={f} type="button" onClick={() => alternarFormato(f)}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${doc.formatos.includes(f) ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 bg-white text-gray-500'}`}>
            {f}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
          Máx.
          <input type="number" min={1} max={50} value={doc.tamanoMaxMB}
            onChange={(e) => onChange({ ...doc, tamanoMaxMB: Math.max(1, Number(e.target.value) || 1) })}
            className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm" />
          MB
        </label>
        <Interruptor activo={doc.obligatorio} texto="Obligatorio" onChange={(v) => onChange({ ...doc, obligatorio: v })} />
      </div>
    </div>
  );
}

function SelectorImagen({ etiqueta, valor, onChange }: { etiqueta: string; valor: string; onChange: (url: string) => void }) {
  const subir = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast.error('Selecciona una imagen');
    if (f.size > MAX_IMAGEN_MB * 1_000_000) return toast.error(`La imagen debe pesar menos de ${MAX_IMAGEN_MB} MB`);
    const lector = new FileReader();
    lector.onload = () => onChange(String(lector.result));
    lector.readAsDataURL(f);
  };
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold text-gray-600">{etiqueta}</span>
      <div className="flex flex-wrap items-center gap-2">
        {IMAGENES_SUGERIDAS.map((src) => (
          <button key={src} type="button" onClick={() => onChange(src)}
            className={`h-14 w-20 overflow-hidden rounded-lg border-2 bg-gray-50 ${valor === src ? 'border-green-600' : 'border-transparent hover:border-gray-300'}`}>
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
        {valor.startsWith('data:') && (
          <div className="h-14 w-20 overflow-hidden rounded-lg border-2 border-green-600">
            <img src={valor} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <label className="flex h-14 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-[10px] font-medium text-gray-500 hover:border-green-500 hover:text-green-700">
          <Upload className="w-4 h-4" /> Subir
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { subir(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        {valor && (
          <button type="button" onClick={() => onChange('')} className="text-xs text-gray-400 hover:text-red-600">Quitar</button>
        )}
      </div>
    </div>
  );
}
