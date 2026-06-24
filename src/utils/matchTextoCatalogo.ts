/**
 * Resuelve texto libre (tal cual viene pegado desde Excel) contra un
 * catálogo en memoria, para el pegado de filas de Objetivos Educativos
 * / Responsable (dirigente). Coincidencia exacta primero (normalizada:
 * minúsculas, sin tildes, sin espacios extra); si no hay exacta, busca
 * por inclusión en cualquier dirección (texto contiene al título del
 * catálogo, o viceversa).
 */

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Dada una celda que puede traer varios ítems (uno por línea o separados
 * por ";"), devuelve los ids del catálogo cuyo `texto` coincide con cada
 * ítem. Ignora ítems sin coincidencia (no rompe el pegado por un objetivo
 * mal escrito).
 */
export function resolverMultiplesContraCatalogo<T extends { id: string }>(
  celda: string | undefined,
  catalogo: T[],
  obtenerTexto: (item: T) => string,
): string[] {
  if (!celda || !celda.trim()) return [];

  const items = celda
    .split(/\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);

  const catalogoNormalizado = catalogo.map((item) => ({
    item,
    texto: normalizar(obtenerTexto(item)),
  }));

  const ids: string[] = [];
  for (const itemTexto of items) {
    const buscado = normalizar(itemTexto);
    const encontrado =
      catalogoNormalizado.find((c) => c.texto === buscado) ||
      catalogoNormalizado.find((c) => c.texto.includes(buscado) || buscado.includes(c.texto));
    if (encontrado && !ids.includes(encontrado.item.id)) {
      ids.push(encontrado.item.id);
    }
  }
  return ids;
}

/** Igual que arriba pero para un único valor (p. ej. nombre de responsable). */
export function resolverUnoContraCatalogo<T extends { id: string }>(
  texto: string | undefined,
  catalogo: T[],
  obtenerTexto: (item: T) => string,
): string | undefined {
  return resolverMultiplesContraCatalogo(texto, catalogo, obtenerTexto)[0];
}
