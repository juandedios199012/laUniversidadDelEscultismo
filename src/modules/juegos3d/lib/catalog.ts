import rawGames from '../data/games.json';
import { FORMATION_KINDS, MATERIAL_KINDS, type ArchetypeId, type FocalProp, type FormationKind, type MaterialKind, type SceneId, type VisibleProp } from '../engine/types';

/**
 * Catálogo de juegos exportado desde el Excel con `scripts/export_catalog_to_json.py`.
 * El texto de cada juego se muestra tal cual; este módulo solo lo tipa, valida y filtra.
 */

export const AREAS = ['Corporalidad', 'Creatividad', 'Carácter', 'Afectividad', 'Sociabilidad', 'Espiritualidad'] as const;
export type Area = (typeof AREAS)[number];

export const CATEGORIES = { A: 'Juegos Activos', T: 'Desafíos Técnicos', C: 'Clásicos' } as const;
export type Category = keyof typeof CATEGORIES;

export interface CatalogGame {
  id: string;            // p. ej. "JUE-A01"
  category: Category;
  name: string;
  source: string;
  block: string;
  week: string;
  week_number: number | null;
  area: Area;
  archetype: ArchetypeId;
  /** Solo en juegos de taller: elemento focal de la escena (o null = taller genérico por postas). */
  focal_prop: FocalProp | null;
  /** Acción concreta dentro de su escena (p. ej. "tie_knot:cross", "queen_chair"), o null. */
  activity: string | null;
  objectives: { ages_11_12: string; ages_13_15: string };
  formation: string;
  formation_detected: {
    kind: FormationKind;
    label: string;
    size: { width_m: number; depth_m: number } | { diameter_m: number } | { length_m: number } | null;
    modifiers: string[];
  };
  materials: string;
  materials_detected: { kind: MaterialKind; label: string; qty: number | null; text: string }[];
  materials_unmatched: string[];
  /** Objetos visibles en la escena: materiales + reglas (primero lo que nombran las reglas). */
  visible_props: (VisibleProp & { label: string })[];
  rules: string;
  inclusion: string;
}

const ARCHETYPES: readonly ArchetypeId[] = ['chain', 'territory', 'circle', 'relay', 'stealth', 'station'];
const FOCAL_PROPS: readonly FocalProp[] = [
  'ground_mosaic', 'stress_test_rig', 'pioneering_tripod', 'first_aid_stretcher',
  'campfire_cooking', 'tent_assembly', 'cartography_table', 'seed_bomb_craft',
];

/** Valida el JSON al cargar: si el Excel trae un valor inesperado, falla con un mensaje claro. */
function validate(games: unknown[]): CatalogGame[] {
  return games.map((g, i) => {
    const game = g as CatalogGame;
    if (!ARCHETYPES.includes(game.archetype)) throw new Error(`Juego ${game.id ?? i}: arquetipo desconocido "${game.archetype}"`);
    if (!(AREAS as readonly string[]).includes(game.area)) throw new Error(`Juego ${game.id ?? i}: área desconocida "${game.area}"`);
    if (!(game.category in CATEGORIES)) throw new Error(`Juego ${game.id ?? i}: categoría desconocida "${game.category}"`);
    if (!FORMATION_KINDS.includes(game.formation_detected?.kind)) {
      throw new Error(`Juego ${game.id ?? i}: formación detectada desconocida "${game.formation_detected?.kind}"`);
    }
    const badProp = game.visible_props?.find((p) => !MATERIAL_KINDS.includes(p.kind));
    if (!game.visible_props || badProp) {
      throw new Error(`Juego ${game.id ?? i}: material desconocido "${badProp?.kind}" (¿se regeneró data/games.json?)`);
    }
    if (game.focal_prop !== null && !FOCAL_PROPS.includes(game.focal_prop)) {
      throw new Error(`Juego ${game.id ?? i}: elemento focal desconocido "${game.focal_prop}"`);
    }
    return game;
  });
}

export const CATALOG: readonly CatalogGame[] = validate(rawGames as unknown[]);

const BY_ID = new Map(CATALOG.map((g) => [g.id, g]));

export function getCatalogGame(id: string): CatalogGame {
  return BY_ID.get(id) ?? CATALOG[0];
}

/** Escena 3D que representa al juego: su arquetipo, o el taller de su elemento focal. */
export function sceneFor(game: CatalogGame): SceneId {
  return game.archetype === 'station' && game.focal_prop ? `station_${game.focal_prop}` : game.archetype;
}

/** Reglas divididas en pasos (una oración por paso), para la ficha y la narración en pantalla. */
export function ruleSteps(game: CatalogGame): string[] {
  return game.rules
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¡¿])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Juego con el que abre la app. */
export const DEFAULT_GAME_ID = BY_ID.has('JUE-C03') ? 'JUE-C03' : CATALOG[0].id;

export interface CatalogFilter {
  query: string;
  areas: ReadonlySet<Area>;          // vacío = todas
  categories: ReadonlySet<Category>; // vacío = todas
}

/** Minúsculas y sin tildes: "circulo" encuentra "Círculo". */
export function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Campos de detalle donde también se busca (p. ej. "brújula", "yeso", "acecho", "cabuyería"). */
const DETAIL_FIELDS = [
  { key: 'rules', label: 'Reglas' },
  { key: 'materials', label: 'Materiales' },
  { key: 'formation', label: 'Formación' },
  { key: 'block', label: 'Bloque' },
] as const;
export type DetailFieldLabel = (typeof DETAIL_FIELDS)[number]['label'];

// Índices normalizados una sola vez al cargar (120 juegos: filtrar toma ~1 ms)
const INDEX = new Map(
  CATALOG.map((g) => [
    g.id,
    {
      primary: normalize(`${g.id} ${g.name} ${g.week}`),
      details: DETAIL_FIELDS.map((f) => ({ ...f, text: normalize(g[f.key]) })),
    },
  ])
);

export interface CatalogMatch {
  game: CatalogGame;
  /** Si alguna palabra solo aparece en reglas o materiales: fragmento para mostrar por qué coincide. */
  snippet?: { field: DetailFieldLabel; before: string; hit: string; after: string };
}

const SNIPPET_CONTEXT = 42;

function makeSnippet(game: CatalogGame, field: (typeof DETAIL_FIELDS)[number], normalizedText: string, term: string): CatalogMatch['snippet'] {
  const original = game[field.key];
  const at = normalizedText.indexOf(term);
  // normalize() conserva la longitud en texto NFC, así que la posición sirve en el original
  const start = Math.max(0, at - SNIPPET_CONTEXT);
  const end = Math.min(original.length, at + term.length + SNIPPET_CONTEXT);
  return {
    field: field.label,
    before: (start > 0 ? '…' : '') + original.slice(start, at),
    hit: original.slice(at, at + term.length),
    after: original.slice(at + term.length, end) + (end < original.length ? '…' : ''),
  };
}

/**
 * Busca por nombre, ID, semana, reglas, materiales, formación y bloque (todas las palabras deben aparecer en algún campo),
 * filtrando por áreas y categorías. Primero los que coinciden por nombre/ID/semana; después los que
 * coinciden solo en los demás campos, con un fragmento del texto encontrado.
 */
export function searchCatalog(filter: CatalogFilter): CatalogMatch[] {
  const terms = normalize(filter.query).split(/\s+/).filter(Boolean);
  const direct: CatalogMatch[] = [];
  const inDetails: CatalogMatch[] = [];

  for (const game of CATALOG) {
    if (filter.areas.size && !filter.areas.has(game.area)) continue;
    if (filter.categories.size && !filter.categories.has(game.category)) continue;
    const idx = INDEX.get(game.id)!;
    let snippet: CatalogMatch['snippet'];
    const allFound = terms.every((t) => {
      if (idx.primary.includes(t)) return true;
      const detail = idx.details.find((d) => d.text.includes(t));
      if (!detail) return false;
      snippet ??= makeSnippet(game, DETAIL_FIELDS.find((f) => f.key === detail.key)!, detail.text, t);
      return true;
    });
    if (!allFound) continue;
    (snippet ? inDetails : direct).push({ game, snippet });
  }
  return [...direct, ...inDetails];
}

export function filterCatalog(filter: CatalogFilter): CatalogGame[] {
  return searchCatalog(filter).map((m) => m.game);
}

export function countBy<K extends string>(games: readonly CatalogGame[], key: (g: CatalogGame) => K) {
  const counts = {} as Record<K, number>;
  for (const g of games) counts[key(g)] = (counts[key(g)] ?? 0) + 1;
  return counts;
}
