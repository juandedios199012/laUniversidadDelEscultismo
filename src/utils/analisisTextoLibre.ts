/**
 * ======================================================================
 * 📝 ANÁLISIS DE TEXTO LIBRE — SIN ML
 * ======================================================================
 * Todo acá es aritmética/conteo sobre texto ya cargado (normalizar,
 * tokenizar, contar, buscar coincidencias contra listas fijas de
 * palabras) — nada de esto es un modelo entrenado ni llama a un
 * servicio externo. El "análisis de sentimiento" es clasificación por
 * palabras clave (léxico positivo/negativo curado a mano) — un método
 * real y usado en la práctica (se llama "lexicon-based sentiment
 * analysis"), pero mucho más simple y menos preciso que un modelo de
 * IA: no entiende sarcasmo, doble negación compleja, ni contexto. Se
 * etiqueta como tal en cada lugar donde se muestra.
 *
 * No hay topic modeling/LDA acá a propósito — ver
 * EVALUACION_ANALITICA_ML_PLAN.md §7 si algún día se necesita NLP real
 * (recomendado: notebook externo, no dentro de la app).
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

// ======================================================================
// Sentimiento por palabras clave (léxico curado a mano, sin IA)
// ======================================================================

// Formas ya sin tilde (comparamos contra texto normalizado). Curado para
// contexto scout/juvenil — no es un diccionario exhaustivo.
const PALABRAS_POSITIVAS = new Set([
  'bueno', 'buena', 'buenos', 'buenas', 'genial', 'geniales', 'divertido', 'divertida',
  'divertidos', 'divertidas', 'divertidisimo', 'divertidisima', 'excelente', 'excelentes',
  'increible', 'increibles', 'feliz', 'felices', 'alegre', 'alegres', 'gracias', 'aprendi',
  'aprendimos', 'disfrute', 'disfrutamos', 'disfrutar', 'encanta', 'encanto', 'encantador',
  'encantadora', 'chevere', 'bacan', 'lindo', 'linda', 'lindos', 'lindas', 'super',
  'estupendo', 'estupenda', 'fantastico', 'fantastica', 'maravilloso', 'maravillosa',
  'perfecto', 'perfecta', 'mejor', 'favorito', 'favorita', 'amable', 'cariñoso', 'carinoso',
  'cariñosa', 'carinosa', 'paciente', 'comprensivo', 'comprensiva', 'entretenido',
  'entretenida', 'interesante', 'motivador', 'motivadora', 'inspirador', 'inspiradora',
  'positivo', 'positiva', 'bien', 'bonito', 'bonita', 'agradable', 'util', 'utiles',
  'recomendable', 'satisfecho', 'satisfecha', 'contento', 'contenta', 'orgulloso',
  'orgullosa', 'quiero', 'adoro', 'sobresaliente', 'confio', 'confianza',
]);

const PALABRAS_NEGATIVAS = new Set([
  'malo', 'mala', 'malos', 'malas', 'aburrido', 'aburrida', 'aburridos', 'aburridas',
  'feo', 'fea', 'feos', 'feas', 'triste', 'tristes', 'odio', 'odie', 'terrible',
  'terribles', 'pesimo', 'pesima', 'horrible', 'horribles', 'dificil', 'dificiles',
  'confuso', 'confusa', 'lento', 'lenta', 'lentos', 'lentas', 'injusto', 'injusta',
  'enojado', 'enojada', 'enojo', 'molesto', 'molesta', 'decepcionado', 'decepcionada',
  'decepcion', 'frustrado', 'frustrada', 'cansado', 'cansada', 'desorden',
  'desorganizado', 'desorganizada', 'impuntual', 'grosero', 'grosera', 'estricto',
  'estricta', 'castigo', 'castigos', 'regaño', 'regano', 'miedo', 'nervioso', 'nerviosa',
  'incomodo', 'incomoda', 'peor', 'nunca', 'jamas', 'gritar', 'grita', 'gritos',
]);

// Frases cortas que invierten o refuerzan el sentido — se buscan como
// substring sobre el texto ya normalizado (sin tildes, minúsculas).
const FRASES_NEGATIVAS = ['no me gusto', 'no me gusta', 'no quiero', 'no aprendi', 'no fue bueno'];
const FRASES_POSITIVAS = ['me encanto', 'me encanta', 'me gusto mucho', 'lo mejor'];

export type Sentimiento = 'positivo' | 'negativo' | 'neutro';

export interface ResultadoSentimiento {
  sentimiento: Sentimiento;
  puntaje: number; // positivo - negativo (con frases contando doble)
}

/**
 * Clasifica un texto como positivo/negativo/neutro contando coincidencias
 * contra las listas de arriba. Es una heurística simple, no un modelo —
 * no detecta sarcasmo ni negaciones complejas ("no estuvo tan mal" puede
 * salir mal clasificado). Usar como punto de partida, no como verdad.
 */
export function clasificarSentimiento(texto: string): ResultadoSentimiento {
  if (!texto?.trim()) return { sentimiento: 'neutro', puntaje: 0 };
  const normalizado = normalizar(texto);
  let puntaje = 0;

  for (const frase of FRASES_POSITIVAS) if (normalizado.includes(frase)) puntaje += 2;
  for (const frase of FRASES_NEGATIVAS) if (normalizado.includes(frase)) puntaje -= 2;

  const palabras = normalizado.match(/[a-z]+/g) || [];
  for (const palabra of palabras) {
    if (PALABRAS_POSITIVAS.has(palabra)) puntaje += 1;
    if (PALABRAS_NEGATIVAS.has(palabra)) puntaje -= 1;
  }

  const sentimiento: Sentimiento = puntaje > 0 ? 'positivo' : puntaje < 0 ? 'negativo' : 'neutro';
  return { sentimiento, puntaje };
}

export interface MencionPersona {
  nombre: string;
  menciones: number;
  positivas: number;
  negativas: number;
  neutras: number;
}

/**
 * Busca menciones de nombres conocidos (ej. dirigentes) dentro de un
 * conjunto de respuestas de texto libre, y clasifica el sentimiento de
 * la respuesta completa donde aparece cada mención (aproximación simple:
 * no aísla la oración exacta, usa toda la respuesta como contexto).
 * Compara por nombre de pila, como palabra completa, sin distinguir
 * mayúsculas/tildes.
 */
export function analizarMencionesPersonas(textos: string[], nombres: string[]): MencionPersona[] {
  const nombresUnicos = Array.from(new Set(nombres.map((n) => n.trim()).filter(Boolean)));
  if (nombresUnicos.length === 0) return [];

  const resultado: Record<string, MencionPersona> = {};
  for (const nombre of nombresUnicos) {
    resultado[nombre] = { nombre, menciones: 0, positivas: 0, negativas: 0, neutras: 0 };
  }

  for (const texto of textos) {
    if (!texto?.trim()) continue;
    const normalizado = normalizar(texto);
    const { sentimiento } = clasificarSentimiento(texto);
    for (const nombre of nombresUnicos) {
      const nombreNormalizado = normalizar(nombre);
      const patron = new RegExp(`\\b${nombreNormalizado}\\b`, 'i');
      if (!patron.test(normalizado)) continue;
      const entrada = resultado[nombre];
      entrada.menciones += 1;
      if (sentimiento === 'positivo') entrada.positivas += 1;
      else if (sentimiento === 'negativo') entrada.negativas += 1;
      else entrada.neutras += 1;
    }
  }

  return Object.values(resultado)
    .filter((m) => m.menciones > 0)
    .sort((a, b) => b.menciones - a.menciones);
}
