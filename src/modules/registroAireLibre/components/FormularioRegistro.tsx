import { useRef, useState } from 'react';
import {
  AlertCircle, CheckCircle2, Download, FileText, FileUp, Loader2, Send, Trash2, Upload, Users,
} from 'lucide-react';
import type { ArchivoSubido, ConfigFormulario, DocumentoCarga } from '../types';
import { formatearTamano } from '../mockStore';

interface Props {
  config: ConfigFormulario;
  /** En vista previa (admin) los botones no envían ni descargan. */
  vistaPrevia?: boolean;
  onEnviar?: (valores: Record<string, string>, archivos: ArchivoSubido[]) => Promise<void> | void;
}

/**
 * Formulario público de registro. Se usa tal cual en la página pública
 * y dentro del panel del administrador como vista previa en vivo.
 */
export default function FormularioRegistro({ config, vistaPrevia = false, onEnviar }: Props) {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [archivos, setArchivos] = useState<Record<string, File>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const { cabecera, campos, descargas, cargas } = config;

  const validar = () => {
    const e: Record<string, string> = {};
    for (const c of campos) {
      if (c.obligatorio && !valores[c.id]?.trim()) e[c.id] = 'Este campo es obligatorio';
    }
    for (const d of cargas) {
      if (d.obligatorio && !archivos[d.id]) e[d.id] = 'Debes adjuntar este documento';
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (vistaPrevia || !validar()) return;
    setEnviando(true);
    try {
      await onEnviar?.(
        Object.fromEntries(Object.entries(valores).map(([k, v]) => [k, v.trim()])),
        Object.entries(archivos).map(([documentoId, f]) => ({ documentoId, nombreArchivo: f.name, tamanoBytes: f.size })),
      );
      setEnviado(true);
    } finally {
      setEnviando(false);
    }
  };

  const reiniciar = () => {
    setValores({}); setArchivos({}); setErrores({}); setEnviado(false);
  };

  if (enviado) {
    return (
      <Tarjeta>
        <Cabecera cabecera={cabecera} />
        <div className="px-6 py-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">¡Registro enviado!</h2>
          <p className="mt-2 text-gray-600">
            La patrulla <strong>{valores.nombre_patrulla || ''}</strong> quedó inscrita. Los dirigentes revisarán los documentos.
          </p>
          <button onClick={reiniciar} className="mt-6 rounded-lg border border-green-600 px-5 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-50">
            Registrar otra patrulla
          </button>
        </div>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta>
      <Cabecera cabecera={cabecera} />

      <form onSubmit={enviar} noValidate className="px-5 sm:px-8 py-6 space-y-8">
        {/* 1. Datos */}
        <Seccion numero={1} titulo="Datos de la patrulla" icono={<Users className="w-4 h-4" />}>
          <div className="space-y-4">
            {campos.map((c) => (
              <div key={c.id}>
                <label htmlFor={`campo-${c.id}`} className="block text-sm font-semibold text-gray-700 mb-1">
                  {c.etiqueta} {c.obligatorio && <span className="text-red-500">*</span>}
                </label>
                <input
                  id={`campo-${c.id}`}
                  type="text"
                  value={valores[c.id] ?? ''}
                  placeholder={c.placeholder}
                  onChange={(e) => {
                    setValores((v) => ({ ...v, [c.id]: e.target.value }));
                    if (errores[c.id]) setErrores(({ [c.id]: _, ...resto }) => resto);
                  }}
                  aria-invalid={!!errores[c.id]}
                  className={`w-full rounded-lg border bg-white/90 px-3.5 py-2.5 text-base outline-none transition focus:ring-2 ${
                    errores[c.id] ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:border-green-600 focus:ring-green-100'
                  }`}
                />
                {errores[c.id] && <MensajeError texto={errores[c.id]} />}
              </div>
            ))}
          </div>
        </Seccion>

        {/* 2. Descargas */}
        {descargas.length > 0 && (
          <Seccion numero={2} titulo="Documentos para descargar" icono={<Download className="w-4 h-4" />}
            ayuda="Descárgalos, complétalos y súbelos en el siguiente paso.">
            <ul className="grid gap-3 sm:grid-cols-2">
              {descargas.map((d) => {
                const disponible = !!d.url;
                return (
                  <li key={d.id} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white/90 p-3.5">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-900">{d.nombre}</p>
                      {d.descripcion && <p className="text-xs text-gray-500 mt-0.5">{d.descripcion}</p>}
                      {disponible && !vistaPrevia ? (
                        <a href={d.url!} download={d.archivoNombre ?? undefined}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:underline">
                          <Download className="w-3.5 h-3.5" /> Descargar
                        </a>
                      ) : (
                        <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                          <Download className="w-3.5 h-3.5" /> {disponible ? 'Descargar' : 'Próximamente'}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Seccion>
        )}

        {/* 3. Cargas */}
        {cargas.length > 0 && (
          <Seccion numero={descargas.length > 0 ? 3 : 2} titulo="Documentos para cargar" icono={<Upload className="w-4 h-4" />}>
            <div className="space-y-3">
              {cargas.map((d) => (
                <ZonaCarga
                  key={d.id}
                  doc={d}
                  archivo={archivos[d.id]}
                  error={errores[d.id]}
                  deshabilitado={vistaPrevia}
                  onArchivo={(f, err) => {
                    setArchivos(({ [d.id]: _, ...resto }) => (f ? { ...resto, [d.id]: f } : resto));
                    setErrores(({ [d.id]: _, ...resto }) => (err ? { ...resto, [d.id]: err } : resto));
                  }}
                />
              ))}
            </div>
          </Seccion>
        )}

        <div className="pt-2">
          {Object.keys(errores).length > 0 && (
            <p className="mb-3 text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Revisa los campos marcados antes de enviar.
            </p>
          )}
          <button
            type="submit"
            disabled={enviando || vistaPrevia}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-green-600 to-teal-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-green-600/20 transition hover:brightness-110 disabled:opacity-60"
          >
            {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {enviando ? 'Enviando…' : 'Enviar registro'}
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">
            Los campos con <span className="text-red-500">*</span> son obligatorios.
          </p>
        </div>
      </form>
    </Tarjeta>
  );
}

// ---------------------------------------------------------------------------

function Tarjeta({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-2xl mx-auto overflow-hidden rounded-2xl border border-white/60 bg-white/85 shadow-2xl backdrop-blur-md">
      {children}
    </div>
  );
}

function Cabecera({ cabecera }: { cabecera: ConfigFormulario['cabecera'] }) {
  return (
    <header>
      {cabecera.imagenUrl && (
        <div className="bg-white border-b border-gray-100 flex items-center justify-center px-4 py-3">
          <img src={cabecera.imagenUrl} alt="" className="max-h-24 w-auto object-contain" />
        </div>
      )}
      <div className="bg-linear-to-r from-green-700 to-teal-700 px-5 sm:px-8 py-5 text-white">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{cabecera.titulo || 'Sin título'}</h1>
        {cabecera.subtitulo && <p className="mt-1 text-green-50 font-medium">{cabecera.subtitulo}</p>}
        {cabecera.detalle && <p className="mt-2 text-sm text-green-100/90">{cabecera.detalle}</p>}
      </div>
    </header>
  );
}

function Seccion({ numero, titulo, icono, ayuda, children }: {
  numero: number; titulo: string; icono: React.ReactNode; ayuda?: string; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center">{numero}</span>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">{titulo} <span className="text-green-600">{icono}</span></h2>
      </div>
      {ayuda && <p className="-mt-1 mb-3 text-sm text-gray-500">{ayuda}</p>}
      {children}
    </section>
  );
}

function MensajeError({ texto }: { texto: string }) {
  return <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{texto}</p>;
}

function ZonaCarga({ doc, archivo, error, deshabilitado, onArchivo }: {
  doc: DocumentoCarga;
  archivo?: File;
  error?: string;
  deshabilitado: boolean;
  onArchivo: (f: File | null, error?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const elegir = (f: File | undefined) => {
    if (!f) return;
    const ext = '.' + (f.name.split('.').pop() ?? '').toLowerCase();
    if (doc.formatos.length && !doc.formatos.includes(ext)) {
      onArchivo(null, `Formato no permitido. Usa: ${doc.formatos.join(', ')}`);
      return;
    }
    if (f.size > doc.tamanoMaxMB * 1_000_000) {
      onArchivo(null, `El archivo supera ${doc.tamanoMaxMB} MB`);
      return;
    }
    onArchivo(f);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <p className="text-sm font-semibold text-gray-700">
          {doc.nombre} {doc.obligatorio && <span className="text-red-500">*</span>}
        </p>
        <p className="text-[11px] text-gray-400 shrink-0">{doc.formatos.join(' ')} · máx {doc.tamanoMaxMB} MB</p>
      </div>
      {doc.descripcion && <p className="text-xs text-gray-500 mb-2">{doc.descripcion}</p>}

      {archivo ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-300 bg-green-50/90 px-3.5 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{archivo.name}</p>
            <p className="text-xs text-gray-500">{formatearTamano(archivo.size)}</p>
          </div>
          <button type="button" onClick={() => onArchivo(null)} className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:text-red-600" aria-label="Quitar archivo">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={deshabilitado}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => { e.preventDefault(); setArrastrando(false); elegir(e.dataTransfer.files[0]); }}
          className={`w-full flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
            error ? 'border-red-300 bg-red-50/70'
              : arrastrando ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-white/70 hover:border-green-500 hover:bg-green-50/60'
          }`}
        >
          <FileUp className={`w-6 h-6 ${error ? 'text-red-400' : 'text-green-600'}`} />
          <span className="text-sm font-medium text-gray-700">Toca para elegir o arrastra el archivo aquí</span>
        </button>
      )}
      {error && <MensajeError texto={error} />}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={doc.formatos.join(',')}
        onChange={(e) => { elegir(e.target.files?.[0]); e.target.value = ''; }}
      />
    </div>
  );
}
