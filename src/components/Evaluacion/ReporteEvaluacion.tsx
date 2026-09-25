import React, { useMemo } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Evaluacion, EvaluacionItem, EvaluacionRespuesta, EvaluacionRespuestaItem,
} from '../../services/evaluacionService';
import { calcularSemaforo, Semaforo } from '../../utils/semaforoEvaluacion';
import { contarPalabrasFrecuentes } from '../../utils/analisisTextoLibre';

/**
 * ======================================================================
 * 📄 REPORTE DE EVALUACIÓN — imprimible / exportable a PDF
 * ======================================================================
 * No pasa por el módulo Reportes (src/modules/reports) — ese módulo es
 * un componente legacy de 3000+ líneas muy acoplado a PDFs de scouts
 * específicos; integrar ahí hubiera sido mucho más trabajo para el
 * mismo resultado. Este reporte se imprime con el diálogo nativo del
 * navegador ("Guardar como PDF") — el CSS de abajo oculta todo lo
 * demás de la página (sidebar, header) y deja solo el contenido del
 * reporte al imprimir.
 * ======================================================================
 */

function nombreRespondiente(r: EvaluacionRespuesta): string {
  if (r.scout_id) return r.scout_nombre || 'Scout';
  return `Anónimo — ${r.patrulla_autorreportada || 'sin patrulla'}`;
}

function BarraSemaforo({ valor, min, max, semaforo }: { valor: number; min: number; max: number; semaforo: Semaforo }) {
  const pct = Math.max(0, Math.min(100, ((valor - min) / (max - min || 1)) * 100));
  return (
    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: semaforo.color }} />
    </div>
  );
}

export default function ReporteEvaluacion({ evaluacion, items, respuestas, respuestaItems, onVolver }: {
  evaluacion: Evaluacion; items: EvaluacionItem[]; respuestas: EvaluacionRespuesta[]; respuestaItems: EvaluacionRespuestaItem[];
  onVolver: () => void;
}) {
  const itemsEscala = useMemo(() => items.filter((i) => i.tipo_item === 'ESCALA'), [items]);
  const itemsTexto = useMemo(() => items.filter((i) => i.tipo_item === 'TEXTO_LIBRE'), [items]);

  const promedioPorItem = useMemo(() => {
    const mapa: Record<string, { suma: number; cantidad: number }> = {};
    for (const ri of respuestaItems) {
      if (ri.valor_escala === undefined) continue;
      const actual = mapa[ri.item_id] || { suma: 0, cantidad: 0 };
      actual.suma += ri.valor_escala; actual.cantidad += 1;
      mapa[ri.item_id] = actual;
    }
    return itemsEscala
      .map((it) => {
        const p = mapa[it.id];
        const promedio = p ? Number((p.suma / p.cantidad).toFixed(2)) : null;
        return { item: it, promedio, semaforo: promedio !== null ? calcularSemaforo(promedio, evaluacion.escala_min, evaluacion.escala_max) : null };
      })
      .filter((d) => d.promedio !== null)
      .sort((a, b) => (a.promedio! - b.promedio!)); // peor primero
  }, [itemsEscala, respuestaItems, evaluacion.escala_min, evaluacion.escala_max]);

  const promedioGeneral = useMemo(() => {
    if (promedioPorItem.length === 0) return null;
    return Number((promedioPorItem.reduce((a, d) => a + (d.promedio || 0), 0) / promedioPorItem.length).toFixed(2));
  }, [promedioPorItem]);
  const semaforoGeneral = promedioGeneral !== null ? calcularSemaforo(promedioGeneral, evaluacion.escala_min, evaluacion.escala_max) : null;

  const datosPorPatrulla = useMemo(() => {
    const valorPorRespuesta: Record<string, number[]> = {};
    for (const ri of respuestaItems) {
      if (ri.valor_escala === undefined) continue;
      (valorPorRespuesta[ri.respuesta_id] = valorPorRespuesta[ri.respuesta_id] || []).push(ri.valor_escala);
    }
    const acum: Record<string, { suma: number; cantidad: number }> = {};
    for (const r of respuestas) {
      const patrulla = r.patrulla_nombre || r.patrulla_autorreportada;
      if (!patrulla) continue;
      const valores = valorPorRespuesta[r.id] || [];
      if (valores.length === 0) continue;
      const actual = acum[patrulla] || { suma: 0, cantidad: 0 };
      actual.suma += valores.reduce((a, b) => a + b, 0);
      actual.cantidad += valores.length;
      acum[patrulla] = actual;
    }
    return Object.entries(acum)
      .map(([patrulla, v]) => {
        const promedio = Number((v.suma / v.cantidad).toFixed(2));
        return { patrulla, promedio, semaforo: calcularSemaforo(promedio, evaluacion.escala_min, evaluacion.escala_max) };
      })
      .sort((a, b) => a.promedio - b.promedio);
  }, [respuestas, respuestaItems, evaluacion.escala_min, evaluacion.escala_max]);

  const respuestasPorItemTexto = useMemo(() => {
    const mapa: Record<string, Array<{ texto: string; respondiente: string }>> = {};
    const respuestaPorId: Record<string, EvaluacionRespuesta> = {};
    for (const r of respuestas) respuestaPorId[r.id] = r;
    for (const ri of respuestaItems) {
      if (!ri.valor_texto) continue;
      const r = respuestaPorId[ri.respuesta_id];
      if (!r) continue;
      (mapa[ri.item_id] = mapa[ri.item_id] || []).push({ texto: ri.valor_texto, respondiente: nombreRespondiente(r) });
    }
    return mapa;
  }, [respuestas, respuestaItems]);

  const fechaGeneracion = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #reporte-evaluacion-imprimible, #reporte-evaluacion-imprimible * { visibility: visible; }
          #reporte-evaluacion-imprimible { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
          .no-imprimir { display: none !important; }
        }
      `}</style>

      <div className="no-imprimir flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onVolver}><ArrowLeft className="w-4 h-4 mr-1" /> Volver</Button>
        <Button size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Imprimir / Guardar como PDF</Button>
      </div>

      <div id="reporte-evaluacion-imprimible" className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
        <header className="border-b border-gray-200 pb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Reporte de evaluación</p>
          <h1 className="text-2xl font-bold text-gray-900">{evaluacion.titulo}</h1>
          {evaluacion.descripcion && <p className="text-sm text-gray-600 mt-1">{evaluacion.descripcion}</p>}
          <p className="text-xs text-gray-400 mt-2">Generado el {fechaGeneracion} · {respuestas.length} respuesta(s) · Escala {evaluacion.escala_min} a {evaluacion.escala_max}</p>
        </header>

        {/* Resumen ejecutivo */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">Resumen</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-[11px] text-gray-500">Respuestas</p>
              <p className="text-2xl font-bold text-gray-900">{respuestas.length}</p>
            </div>
            {semaforoGeneral && (
              <div className={`rounded-lg border p-3 ${semaforoGeneral.claseBorde} ${semaforoGeneral.claseFondo}`}>
                <p className="text-[11px] text-gray-500">Estado general</p>
                <p className={`text-2xl font-bold ${semaforoGeneral.claseTexto}`}>{semaforoGeneral.emoji} {semaforoGeneral.label}</p>
              </div>
            )}
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-[11px] text-gray-500">Promedio general</p>
              <p className="text-2xl font-bold text-gray-900">{promedioGeneral ?? '—'}</p>
            </div>
          </div>
        </section>

        {/* Semáforo por enunciado */}
        {promedioPorItem.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">Resultado por enunciado</h2>
            <p className="text-xs text-gray-400 mb-2">De menor a mayor puntaje.</p>
            <div className="space-y-2">
              {promedioPorItem.map((d) => (
                <div key={d.item.id} className="flex items-center gap-2">
                  <span className={`shrink-0 w-8 text-center text-xs font-bold px-1 py-0.5 rounded ${d.semaforo!.claseFondo} ${d.semaforo!.claseTexto}`}>{d.semaforo!.emoji}</span>
                  <span className="text-sm text-gray-700 flex-1 min-w-0">{d.item.enunciado}</span>
                  <BarraSemaforo valor={d.promedio!} min={evaluacion.escala_min} max={evaluacion.escala_max} semaforo={d.semaforo!} />
                  <span className="shrink-0 text-sm font-bold text-gray-700 w-8 text-right">{d.promedio}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Comparativo por patrulla */}
        {datosPorPatrulla.length > 1 && (
          <section>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">Comparativo por patrulla</h2>
            <div className="space-y-2">
              {datosPorPatrulla.map((d) => (
                <div key={d.patrulla} className="flex items-center gap-2">
                  <span className={`shrink-0 w-8 text-center text-xs font-bold px-1 py-0.5 rounded ${d.semaforo.claseFondo} ${d.semaforo.claseTexto}`}>{d.semaforo.emoji}</span>
                  <span className="text-sm text-gray-700 w-28 shrink-0 truncate">{d.patrulla}</span>
                  <BarraSemaforo valor={d.promedio} min={evaluacion.escala_min} max={evaluacion.escala_max} semaforo={d.semaforo} />
                  <span className="shrink-0 text-sm font-bold text-gray-700 w-8 text-right">{d.promedio}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Respuestas abiertas */}
        {itemsTexto.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">Respuestas abiertas</h2>
            <div className="space-y-4">
              {itemsTexto.map((item) => {
                const textos = respuestasPorItemTexto[item.id] || [];
                const frecuentes = contarPalabrasFrecuentes(textos.map((t) => t.texto), { top: 8 });
                return (
                  <div key={item.id}>
                    <p className="text-sm font-semibold text-gray-800">{item.enunciado}</p>
                    {textos.length === 0 ? (
                      <p className="text-xs text-gray-400 mt-1">Sin respuestas.</p>
                    ) : (
                      <>
                        {frecuentes.length >= 3 && (
                          <p className="text-xs text-violet-600 mt-1">Palabras frecuentes: {frecuentes.map((f) => f.palabra).join(', ')}</p>
                        )}
                        <ul className="mt-1 space-y-1">
                          {textos.map((t, idx) => (
                            <li key={idx} className="text-sm text-gray-600 border-l-2 border-gray-200 pl-2">
                              "{t.texto}" <span className="text-xs text-gray-400">— {t.respondiente}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <footer className="text-[10px] text-gray-400 border-t border-gray-200 pt-3">
          🟢 Bien (≥70% de la escala) · 🟡 A mejorar (40-70%) · 🔴 Atención (&lt;40%) — regla fija sobre el promedio, no un diagnóstico automático.
        </footer>
      </div>
    </div>
  );
}
