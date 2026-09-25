/**
 * ======================================================================
 * 📤 EXPORTAR DATOS DE UNA EVALUACIÓN (preguntas + respuestas)
 * ======================================================================
 * Genera un archivo con TODO el contenido real (nada resumido ni
 * inventado) en JSON, CSV o Markdown, para que se pueda pegar/adjuntar
 * en una conversación con Claude (u otra IA) y pedir un análisis más
 * fino puntual — sin integrar ninguna API de IA dentro de la app
 * (decisión explícita: mantener el módulo sin costos de IA en
 * producción, ver EVALUACION_ANALITICA_ML_PLAN.md).
 * ======================================================================
 */
import { EvaluacionItem, EvaluacionRespuesta, EvaluacionRespuestaItem } from '../services/evaluacionService';

export interface PreguntaExport {
  codigo: string;
  tipo: 'ESCALA' | 'TEXTO_LIBRE';
  enunciado: string;
  categoria?: string;
}

export interface RespuestaExport {
  respondiente: string;
  patrulla?: string;
  fecha?: string;
  valores: Record<string, string | number>; // codigo de pregunta -> valor
}

export interface DatosExportEvaluacion {
  titulo: string;
  descripcion?: string;
  escalaMin: number;
  escalaMax: number;
  generadoEl: string;
  preguntas: PreguntaExport[];
  respuestas: RespuestaExport[];
}

function nombreRespondiente(r: EvaluacionRespuesta): string {
  if (r.scout_id) return r.scout_nombre || 'Scout';
  return `Anónimo${r.patrulla_autorreportada ? ` — ${r.patrulla_autorreportada}` : ''}`;
}

export function construirDatosExport(
  evaluacion: { titulo: string; descripcion?: string; escala_min: number; escala_max: number },
  items: EvaluacionItem[],
  respuestas: EvaluacionRespuesta[],
  respuestaItems: EvaluacionRespuestaItem[],
): DatosExportEvaluacion {
  const preguntas: PreguntaExport[] = items.map((it, idx) => ({
    codigo: `P${idx + 1}`,
    tipo: it.tipo_item,
    enunciado: it.enunciado,
    categoria: it.etiqueta,
  }));
  const codigoPorItemId: Record<string, string> = {};
  items.forEach((it, idx) => { codigoPorItemId[it.id] = `P${idx + 1}`; });

  const valoresPorRespuesta: Record<string, Record<string, string | number>> = {};
  for (const ri of respuestaItems) {
    const codigo = codigoPorItemId[ri.item_id];
    if (!codigo) continue;
    const valores = valoresPorRespuesta[ri.respuesta_id] || (valoresPorRespuesta[ri.respuesta_id] = {});
    if (ri.valor_texto !== undefined) valores[codigo] = ri.valor_texto;
    else if (ri.valor_escala !== undefined) valores[codigo] = ri.valor_escala;
  }

  const respuestasExport: RespuestaExport[] = respuestas.map((r) => ({
    respondiente: nombreRespondiente(r),
    patrulla: r.patrulla_nombre || r.patrulla_autorreportada,
    fecha: r.completado_en,
    valores: valoresPorRespuesta[r.id] || {},
  }));

  return {
    titulo: evaluacion.titulo,
    descripcion: evaluacion.descripcion,
    escalaMin: evaluacion.escala_min,
    escalaMax: evaluacion.escala_max,
    generadoEl: new Date().toISOString(),
    preguntas,
    respuestas: respuestasExport,
  };
}

export function aJSON(datos: DatosExportEvaluacion): string {
  return JSON.stringify(datos, null, 2);
}

function escaparCSV(valor: string | number | undefined): string {
  const texto = valor === undefined ? '' : String(valor);
  if (/[",\n]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

export function aCSV(datos: DatosExportEvaluacion): string {
  const columnas = ['respondiente', 'patrulla', 'fecha', ...datos.preguntas.map((p) => p.codigo)];
  const filas = [columnas.join(',')];

  // Fila de referencia con el enunciado completo de cada pregunta, para no perder el contexto.
  const filaEnunciados = ['ENUNCIADO', '', '', ...datos.preguntas.map((p) => p.enunciado)];
  filas.push(filaEnunciados.map(escaparCSV).join(','));

  for (const r of datos.respuestas) {
    const fila = [r.respondiente, r.patrulla || '', r.fecha || '', ...datos.preguntas.map((p) => r.valores[p.codigo])];
    filas.push(fila.map(escaparCSV).join(','));
  }
  return filas.join('\n');
}

export function aMarkdown(datos: DatosExportEvaluacion): string {
  const lineas: string[] = [];
  lineas.push(`# ${datos.titulo}`);
  if (datos.descripcion) lineas.push('', datos.descripcion);
  lineas.push('', `Generado el ${new Date(datos.generadoEl).toLocaleString('es-PE')} · Escala ${datos.escalaMin} a ${datos.escalaMax} · ${datos.respuestas.length} respuesta(s)`);

  lineas.push('', '## Preguntas', '');
  for (const p of datos.preguntas) {
    const tipoTexto = p.tipo === 'ESCALA' ? `Escala ${datos.escalaMin}-${datos.escalaMax}` : 'Texto libre';
    lineas.push(`- **${p.codigo}** (${tipoTexto}${p.categoria ? `, categoría: ${p.categoria}` : ''}): ${p.enunciado}`);
  }

  lineas.push('', '## Respuestas', '');
  for (const r of datos.respuestas) {
    const encabezado = [r.respondiente, r.patrulla, r.fecha ? new Date(r.fecha).toLocaleString('es-PE') : undefined].filter(Boolean).join(' — ');
    lineas.push(`### ${encabezado}`, '');
    for (const p of datos.preguntas) {
      const valor = r.valores[p.codigo];
      if (valor === undefined) continue;
      lineas.push(`- **${p.codigo}**: ${valor}`);
    }
    lineas.push('');
  }

  return lineas.join('\n');
}

export function nombreArchivoBase(titulo: string): string {
  return titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
