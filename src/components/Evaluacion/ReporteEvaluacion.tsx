import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import {
  Evaluacion, EvaluacionItem, EvaluacionRespuesta, EvaluacionRespuestaItem, EvaluacionService,
} from '../../services/evaluacionService';
import { calcularSemaforo, Semaforo } from '../../utils/semaforoEvaluacion';
import { analizarMencionesPersonas, clasificarSentimiento, contarPalabrasFrecuentes } from '../../utils/analisisTextoLibre';
import { generateAndDownloadPDF, generateReportMetadata } from '../../modules/reports/services/pdfService';
import EvaluacionReportTemplate, { EvaluacionReportData } from '../../modules/reports/templates/pdf/EvaluacionReportTemplate';

/**
 * ======================================================================
 * 📄 REPORTE DE EVALUACIÓN
 * ======================================================================
 * Dos salidas:
 *  1. Vista rápida en pantalla / impresión del navegador (abajo) — útil
 *     para chusmear los números sin salir de la app.
 *  2. "Descargar PDF" (botón principal) — PDF real generado con
 *     @react-pdf/renderer (misma librería que usan los reportes de
 *     Asistencia/Finanzas), con resumen ejecutivo primero y el detalle
 *     completo al final. No pasa por el módulo Reportes
 *     (src/modules/reports/components/ReportManager.tsx) — ese archivo
 *     es un componente legacy de 3000+ líneas muy acoplado a PDFs de
 *     scouts específicos; se reutiliza su infraestructura de PDF
 *     (pdfService.ts, pdfStyles.ts) sin tocar ese archivo.
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
  const [nombresDirigentes, setNombresDirigentes] = useState<string[]>([]);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  useEffect(() => {
    EvaluacionService.listarNombresDirigentes().then(setNombresDirigentes).catch(() => setNombresDirigentes([]));
  }, []);

  const itemsEscala = useMemo(() => items.filter((i) => i.tipo_item === 'ESCALA'), [items]);
  const itemsTexto = useMemo(() => items.filter((i) => i.tipo_item === 'TEXTO_LIBRE'), [items]);

  const promedioPorItemMap = useMemo(() => {
    const mapa: Record<string, { suma: number; cantidad: number }> = {};
    for (const ri of respuestaItems) {
      if (ri.valor_escala === undefined) continue;
      const actual = mapa[ri.item_id] || { suma: 0, cantidad: 0 };
      actual.suma += ri.valor_escala; actual.cantidad += 1;
      mapa[ri.item_id] = actual;
    }
    return mapa;
  }, [respuestaItems]);

  // Códigos (P1, P2...) según el orden REAL del enunciado en la evaluación
  // — mismo criterio que Analítica en pantalla, para que "P3" signifique
  // lo mismo en todos lados aunque las listas se muestren ordenadas.
  const promedioPorItem = useMemo(() => {
    return itemsEscala
      .map((it, idx) => {
        const p = promedioPorItemMap[it.id];
        const promedio = p ? Number((p.suma / p.cantidad).toFixed(2)) : null;
        return {
          item: it, codigo: `P${idx + 1}`, promedio,
          semaforo: promedio !== null ? calcularSemaforo(promedio, evaluacion.escala_min, evaluacion.escala_max) : null,
        };
      })
      .filter((d) => d.promedio !== null)
      .sort((a, b) => (a.promedio! - b.promedio!)); // peor primero
  }, [itemsEscala, promedioPorItemMap, evaluacion.escala_min, evaluacion.escala_max]);

  const promedioGeneral = useMemo(() => {
    if (promedioPorItem.length === 0) return null;
    return Number((promedioPorItem.reduce((a, d) => a + (d.promedio || 0), 0) / promedioPorItem.length).toFixed(2));
  }, [promedioPorItem]);
  const semaforoGeneral = promedioGeneral !== null ? calcularSemaforo(promedioGeneral, evaluacion.escala_min, evaluacion.escala_max) : null;

  // Categorías (etiqueta de cada enunciado) — mismo agrupamiento que el
  // radar de Analítica, acá como ranking ordenado mejor -> peor.
  const datosPorCategoria = useMemo(() => {
    const itemsPorEtiqueta: Record<string, string[]> = {};
    for (const it of itemsEscala) {
      if (!it.etiqueta) continue;
      (itemsPorEtiqueta[it.etiqueta] = itemsPorEtiqueta[it.etiqueta] || []).push(it.id);
    }
    return Object.entries(itemsPorEtiqueta)
      .map(([etiqueta, itemIds]) => {
        let suma = 0, cantidad = 0;
        for (const id of itemIds) {
          const p = promedioPorItemMap[id];
          if (p) { suma += p.suma; cantidad += p.cantidad; }
        }
        const promedio = cantidad > 0 ? Number((suma / cantidad).toFixed(2)) : null;
        return { etiqueta, promedio, semaforo: promedio !== null ? calcularSemaforo(promedio, evaluacion.escala_min, evaluacion.escala_max) : null };
      })
      .filter((d) => d.promedio !== null)
      .sort((a, b) => b.promedio! - a.promedio!); // mejor primero
  }, [itemsEscala, promedioPorItemMap, evaluacion.escala_min, evaluacion.escala_max]);

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

  const respuestaPorId = useMemo(() => {
    const mapa: Record<string, EvaluacionRespuesta> = {};
    for (const r of respuestas) mapa[r.id] = r;
    return mapa;
  }, [respuestas]);

  const respuestasPorItemTexto = useMemo(() => {
    const mapa: Record<string, Array<{ texto: string; respondiente: string }>> = {};
    for (const ri of respuestaItems) {
      if (!ri.valor_texto) continue;
      const r = respuestaPorId[ri.respuesta_id];
      if (!r) continue;
      (mapa[ri.item_id] = mapa[ri.item_id] || []).push({ texto: ri.valor_texto, respondiente: nombreRespondiente(r) });
    }
    return mapa;
  }, [respuestaItems, respuestaPorId]);

  const todosLosTextos = useMemo(() => respuestaItems.map((ri) => ri.valor_texto).filter((t): t is string => !!t), [respuestaItems]);

  // Sentimiento agregado (por palabras clave, no IA) sobre todas las
  // respuestas de texto libre.
  const sentimiento = useMemo(() => {
    let positivas = 0, negativas = 0, neutras = 0;
    for (const texto of todosLosTextos) {
      const { sentimiento: s } = clasificarSentimiento(texto);
      if (s === 'positivo') positivas++;
      else if (s === 'negativo') negativas++;
      else neutras++;
    }
    return { positivas, negativas, neutras, total: todosLosTextos.length };
  }, [todosLosTextos]);

  const palabrasFrecuentes = useMemo(() => contarPalabrasFrecuentes(todosLosTextos, { top: 20 }), [todosLosTextos]);
  const mencionesJefes = useMemo(() => analizarMencionesPersonas(todosLosTextos, nombresDirigentes), [todosLosTextos, nombresDirigentes]);

  // Conclusiones ejecutivas en lenguaje simple — auto-generadas a partir
  // de las reglas de arriba, no de un modelo.
  const conclusiones = useMemo(() => {
    const bullets: string[] = [];
    if (semaforoGeneral && promedioGeneral !== null) {
      bullets.push(`El estado general de esta evaluación es "${semaforoGeneral.label}" ${semaforoGeneral.emoji}, con un promedio de ${promedioGeneral} sobre una escala de ${evaluacion.escala_min} a ${evaluacion.escala_max}.`);
    }
    if (datosPorCategoria.length > 0) {
      const mejor = datosPorCategoria[0];
      const peor = datosPorCategoria[datosPorCategoria.length - 1];
      if (mejor.etiqueta !== peor.etiqueta) {
        bullets.push(`La categoría mejor calificada fue "${mejor.etiqueta}" (${mejor.promedio}); la que más necesita atención fue "${peor.etiqueta}" (${peor.promedio}).`);
      }
    }
    if (promedioPorItem.length > 0) {
      const peorItem = promedioPorItem[0];
      if (peorItem.semaforo?.nivel === 'atencion') {
        bullets.push(`El enunciado con menor puntaje fue "${peorItem.item.enunciado}" (${peorItem.promedio}) — vale la pena conversarlo con el equipo.`);
      }
    }
    if (sentimiento.total > 0) {
      const pctPos = Math.round((sentimiento.positivas / sentimiento.total) * 100);
      const pctNeg = Math.round((sentimiento.negativas / sentimiento.total) * 100);
      bullets.push(`De los comentarios escritos, ${pctPos}% tuvo un tono positivo y ${pctNeg}% negativo (según palabras clave).`);
    }
    const jefePositivo = [...mencionesJefes].sort((a, b) => b.positivas - a.positivas).find((m) => m.positivas > 0);
    if (jefePositivo) bullets.push(`${jefePositivo.nombre} fue el dirigente mencionado de forma más positiva en los comentarios (${jefePositivo.positivas} mención(es) positiva(s)).`);
    const jefeNegativo = [...mencionesJefes].sort((a, b) => b.negativas - a.negativas).find((m) => m.negativas > 0);
    if (jefeNegativo) bullets.push(`${jefeNegativo.nombre} tuvo la mayor cantidad de menciones a mejorar (${jefeNegativo.negativas}) — conviene revisar el contexto en el detalle.`);
    if (datosPorPatrulla.length > 1) {
      const mejorPatrulla = datosPorPatrulla[datosPorPatrulla.length - 1];
      const peorPatrulla = datosPorPatrulla[0];
      bullets.push(`Entre patrullas, "${mejorPatrulla.patrulla}" tuvo el mejor promedio (${mejorPatrulla.promedio}) y "${peorPatrulla.patrulla}" el que más necesita apoyo (${peorPatrulla.promedio}).`);
    }
    if (bullets.length === 0) bullets.push('Todavía no hay suficientes datos para generar conclusiones automáticas.');
    return bullets;
  }, [semaforoGeneral, promedioGeneral, evaluacion.escala_min, evaluacion.escala_max, datosPorCategoria, promedioPorItem, sentimiento, mencionesJefes, datosPorPatrulla]);

  const fechaGeneracion = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleDescargarPdf = async () => {
    setGenerandoPdf(true);
    try {
      const data: EvaluacionReportData = {
        titulo: evaluacion.titulo,
        descripcion: evaluacion.descripcion,
        escalaMin: evaluacion.escala_min,
        escalaMax: evaluacion.escala_max,
        totalRespuestas: respuestas.length,
        promedioGeneral,
        colorSemaforoGeneral: semaforoGeneral?.color || '#6b7280',
        emojiSemaforoGeneral: semaforoGeneral?.emoji || '—',
        labelSemaforoGeneral: semaforoGeneral?.label || 'Sin datos',
        categorias: datosPorCategoria.map((d) => ({ etiqueta: d.etiqueta, promedio: d.promedio!, colorSemaforo: d.semaforo!.color, emojiSemaforo: d.semaforo!.emoji })),
        enunciados: promedioPorItem.map((d) => ({ codigo: d.codigo, etiqueta: d.item.enunciado, promedio: d.promedio!, colorSemaforo: d.semaforo!.color, emojiSemaforo: d.semaforo!.emoji })),
        patrullas: datosPorPatrulla.map((d) => ({ etiqueta: d.patrulla, promedio: d.promedio, colorSemaforo: d.semaforo.color, emojiSemaforo: d.semaforo.emoji })),
        sentimiento,
        palabrasFrecuentes,
        mencionesJefes,
        conclusiones,
        respuestasAbiertas: itemsTexto.map((it) => ({ enunciado: it.enunciado, respuestas: respuestasPorItemTexto[it.id] || [] })),
      };
      const metadata = generateReportMetadata();
      const nombreArchivo = `evaluacion_${evaluacion.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
      const resultado = await generateAndDownloadPDF(<EvaluacionReportTemplate data={data} metadata={metadata} />, nombreArchivo);
      if (resultado.status !== 'success') { toast.error(resultado.error || 'No se pudo generar el PDF'); return; }
      toast.success('PDF descargado');
    } catch (err: any) {
      toast.error(err.message || 'Error al generar el PDF');
    } finally {
      setGenerandoPdf(false);
    }
  };

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

      <div className="no-imprimir flex items-center justify-between mb-4 flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={onVolver}><ArrowLeft className="w-4 h-4 mr-1" /> Volver</Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Vista rápida (imprimir)</Button>
          <Button size="sm" onClick={handleDescargarPdf} disabled={generandoPdf}>
            {generandoPdf ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />} Descargar PDF
          </Button>
        </div>
      </div>

      <div id="reporte-evaluacion-imprimible" className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
        <header className="border-b border-gray-200 pb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Vista rápida en pantalla — el PDF descargable tiene resumen ejecutivo y análisis de comentarios</p>
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
