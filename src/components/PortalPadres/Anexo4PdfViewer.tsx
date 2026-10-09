/**
 * Muestra el PDF del Anexo 4 en pantalla. Cada página se dibuja en un
 * <canvas> con pdf.js: un <iframe> con el PDF no se ve en Android y en
 * iPhone solo muestra la primera página.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import type { ActividadHijo } from '@/services/portalPadresService';
import type { ConfigAnexo4 } from '@/services/configAnexo4Service';

interface Anexo4PdfViewerProps {
  actividad: ActividadHijo;
  config: ConfigAnexo4;
  /** Avisa cuando el documento ya se puede leer (PDF o texto de respaldo). */
  onListo?: () => void;
}

async function renderizarPaginas(blob: Blob, contenedor: HTMLDivElement, cancelado: () => boolean) {
  const pdfjs = await import('pdfjs-dist');
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
  const ancho = contenedor.parentElement?.clientWidth || 600;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  contenedor.replaceChildren();
  for (let n = 1; n <= doc.numPages; n++) {
    if (cancelado()) return;
    const pagina = await doc.getPage(n);
    const escala = ancho / pagina.getViewport({ scale: 1 }).width;
    const viewport = pagina.getViewport({ scale: escala * dpr });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = '100%';
    canvas.className = 'bg-white shadow-sm border border-gray-200 rounded mb-3';
    contenedor.appendChild(canvas);

    await pagina.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
  }
}

const Anexo4PdfViewer: React.FC<Anexo4PdfViewerProps> = ({ actividad, config, onListo }) => {
  const paginasRef = useRef<HTMLDivElement>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');

  // Se regenera si cambia la actividad o su aceptación (sello digital)
  useEffect(() => {
    let cancelado = false;
    setEstado('cargando');

    (async () => {
      try {
        const { generarAnexo4Padre } = await import('./anexo4PdfPadre');
        const pdfBlob = await generarAnexo4Padre(actividad, config);
        if (cancelado) return;
        setBlob(pdfBlob);
        if (paginasRef.current) {
          await renderizarPaginas(pdfBlob, paginasRef.current, () => cancelado);
        }
        if (!cancelado) {
          setEstado('listo');
          onListo?.();
        }
      } catch (err) {
        console.error('Error mostrando el Anexo 4:', err);
        if (!cancelado) {
          setEstado('error');
          onListo?.();
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [actividad.participante_id, actividad.autorizacion_aceptada_at, config]);

  const descargar = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Anexo4_${actividad.scout_nombre.replace(/\s+/g, '_')}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div>
      {estado === 'cargando' && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 text-sm">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          Preparando el Anexo 4...
        </div>
      )}
      {estado === 'error' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            No se pudo mostrar el PDF. Este es el texto que estás autorizando:
          </div>
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-700">
            <p className="mb-2">
              Autorizo la participación de <strong>{actividad.scout_nombre}</strong> en <strong>{actividad.nombre}</strong>
              {actividad.lugar ? ` (${actividad.lugar})` : ''}. Asimismo, declaro:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              {(actividad.autorizacion_declaraciones?.length ? actividad.autorizacion_declaraciones : config.declaraciones).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
      <div ref={paginasRef} className={estado === 'listo' ? '' : 'hidden'} />
      {estado === 'listo' && blob && (
        <button
          type="button"
          onClick={descargar}
          className="flex items-center gap-1.5 mx-auto text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <Download className="w-4 h-4" />
          Descargar PDF
        </button>
      )}
    </div>
  );
};

export default Anexo4PdfViewer;
