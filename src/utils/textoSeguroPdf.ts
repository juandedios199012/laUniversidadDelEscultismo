/**
 * ======================================================================
 * 🔤 SANEAR TEXTO PARA PDF (react-pdf / Helvetica)
 * ======================================================================
 * La fuente Helvetica estándar que usan los reportes PDF de este
 * proyecto no tiene glifos para emoji ni para la mayoría de símbolos
 * fuera de Latin-1 (WinAnsiEncoding). Un carácter que la fuente no
 * puede dibujar no solo desaparece: corrompe el cálculo de ancho/
 * posición de los caracteres siguientes en ese mismo bloque de texto,
 * y el resultado es texto superpuesto/ilegible.
 *
 * Esto pasa con cualquier texto que YO escriba (ya lo cuidamos), pero
 * también con texto que viene de datos reales — ej. un scout que
 * responde una pregunta de texto libre desde el celular y le pone un
 * emoji (🥹, 🫠, ✨...). Esta función se aplica a TODO texto que entra
 * a un PDF, sin importar el origen, para que ningún dato real pueda
 * romper el render.
 * ======================================================================
 */

// Rango seguro: ASCII básico + Latin-1 Supplement (cubre tildes, ñ, ¿, ¡,
// etc.) + un puñado de signos tipográficos comunes que Helvetica sí trae
// (comillas curvas, guion largo/medio, viñeta, puntos suspensivos).
const RANGO_SEGURO = /[^\x00-\x7E -ÿ‘’“”–—•…]/gu;

/**
 * Saca cualquier carácter que Helvetica no pueda dibujar (emoji,
 * pictogramas, símbolos raros) y prolija los espacios que quedan. Si el
 * texto no tiene nada raro, devuelve el mismo texto sin tocar.
 */
export function limpiarParaPdf(texto: string | undefined | null): string {
  if (!texto) return '';
  return texto
    .replace(RANGO_SEGURO, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}
