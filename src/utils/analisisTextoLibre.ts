/**
 * ======================================================================
 * 📝 ANÁLISIS DE TEXTO LIBRE — SIN ML
 * ======================================================================
 * Conteo de frecuencia de palabras sobre respuestas abiertas: es
 * aritmética simple (normalizar, tokenizar, contar), no un modelo.
 * No hay análisis de sentimiento ni topic modeling acá a propósito —
 * ver EVALUACION_ANALITICA_ML_PLAN.md §7 si algún día se necesita NLP
 * real (recomendado: notebook externo, no dentro de la app).
 * ======================================================================
 */

// Stopwords en español (artículos, preposiciones, pronombres comunes) —
// se filtran para que el conteo muestre palabras con contenido real.
const STOPWORDS_ES = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'se', 'del', 'las', 'un', 'por', 'con',
  'no', 'una', 'su', 'para', 'es', 'al', 'lo', 'como', 'mas', 'más', 'pero', 'sus', 'le',
  'ya', 'o', 'fue', 'ha', 'si', 'sí', 'porque', 'esta', 'está', 'entre', 'cuando', 'muy',
  'sin', 'sobre', 'tambien', 'también', 'me', 'hasta', 'donde', 'quien', 'desde', 'todo',
  'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante',
  'ellos', 'e', 'esto', 'mi', 'antes', 'algunos', 'que', 'unos', 'yo', 'otro', 'otras',
  'otra', 'el', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual',
  'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros', 'mis', 'tu', 'tus',
  'te', 'ti', 'fueron', 'era', 'eran', 'somos', 'son', 'soy', 'eres', 'esa', 'ese',
  'aqui', 'aquí', 'alli', 'allí', 'ahi', 'ahí', 'nos', 'les', 'les', 'un', 'una', 'unos',
  'unas', 'este', 'esta', 'estos', 'estas', 'ese', 'esos', 'esas', 'aquel', 'aquella',
]);

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, ''); // saca tildes
}

export interface PalabraFrecuente {
  palabra: string;
  frecuencia: number;
}

/**
 * Cuenta la frecuencia de palabras en un conjunto de respuestas de texto
 * libre. Puro cálculo sobre strings ya cargados — no llama a ningún
 * servicio externo.
 */
export function contarPalabrasFrecuentes(textos: string[], opciones?: { top?: number; longitudMinima?: number }): PalabraFrecuente[] {
  const top = opciones?.top ?? 20;
  const longitudMinima = opciones?.longitudMinima ?? 3;

  const conteo = new Map<string, number>();
  for (const texto of textos) {
    if (!texto) continue;
    const normalizado = normalizar(texto);
    const palabras = normalizado.match(/[a-záéíóúñ]+/gi) || [];
    for (const palabraRaw of palabras) {
      const palabra = palabraRaw.toLowerCase();
      if (palabra.length < longitudMinima) continue;
      if (STOPWORDS_ES.has(palabra)) continue;
      conteo.set(palabra, (conteo.get(palabra) || 0) + 1);
    }
  }

  return Array.from(conteo.entries())
    .map(([palabra, frecuencia]) => ({ palabra, frecuencia }))
    .sort((a, b) => b.frecuencia - a.frecuencia)
    .slice(0, top);
}
