import { CompetitorAppearance, FieldLayout, GameFrame, HandProp, SceneVariant, VisibleProp } from './types';

/**
 * Variación determinista por juego. Dos juegos con la misma escena base se ven distintos
 * (espejo, colores de equipo, luz del sol), pero un mismo juego se ve siempre igual.
 * Todo son funciones puras sobre los datos de la escena: el motor de coreografías no cambia.
 */

/** Hash FNV-1a de 32 bits (estable entre cargas y navegadores). */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Paleta de pares de colores de equipo (principal, ribete). */
const TEAM_PALETTE: [string, string][] = [
  ['#B91C1C', '#F8FAFC'], ['#1D4ED8', '#FDE68A'], ['#15803D', '#FDE047'], ['#B45309', '#FDE68A'],
  ['#7C3AED', '#F8FAFC'], ['#0E7490', '#FDE68A'], ['#BE185D', '#F8FAFC'], ['#4D7C0F', '#F8FAFC'],
];

/**
 * Variante del juego número `index` dentro de su misma escena base. Usar el índice (y no un hash)
 * garantiza que dos juegos de la misma escena nunca reciban la misma combinación:
 * 8 paletas × 2 orientaciones = 16 combinaciones distintas, y el sol (ángulo áureo) desempata más allá.
 */
export function variantFor(index: number): SceneVariant {
  return {
    paletteOffset: index % TEAM_PALETTE.length,
    mirror: Math.floor(index / TEAM_PALETTE.length) % 2 === 1,
    sunAngle: ((index * 137.508) % 360) * (Math.PI / 180),
  };
}

/** Recolorea equipos: cada color de equipo distinto de la escena recibe un par de la paleta rotada. */
export function makeRecolor(appearances: CompetitorAppearance[], variant: SceneVariant) {
  const teamColors = [...new Set(appearances.map((a) => a.teamColor))].sort();
  const map = new Map(teamColors.map((c, i) => [c, TEAM_PALETTE[(i + variant.paletteOffset) % TEAM_PALETTE.length]]));
  return (color: string, secondary: string): [string, string] => map.get(color) ?? [color, secondary];
}

/** Objeto en la mano del líder según lo que usa el juego (en orden de prioridad). */
const LEADER_PROP_PRIORITY: [VisibleProp['kind'], HandProp][] = [
  ['whistle', 'whistle'], ['compass', 'compass'], ['ball', 'ball'], ['notebook', 'notebook'], ['cards', 'notebook'],
];

export function leaderHandPropFor(visible: VisibleProp[]): HandProp | undefined {
  const kinds = new Set(visible.map((v) => v.kind));
  return LEADER_PROP_PRIORITY.find(([k]) => kinds.has(k))?.[1];
}

const mx = (x: number, mirror: boolean) => (mirror ? -x : x);

/** Refleja el campo (zonas, árboles, meta, círculo y objetos) si la variante lo pide. */
export function applyFieldVariant(field: FieldLayout, variant: SceneVariant): FieldLayout {
  if (!variant.mirror) return field;
  const m = variant.mirror;
  return {
    ...field,
    zones: field.zones.map((z) => ({ ...z, center: { x: mx(z.center.x, m), z: z.center.z } })),
    trees: field.trees.map((t) => ({ ...t, x: mx(t.x, m) })),
    finish: field.finish && { ...field.finish, x: mx(field.finish.x, m) },
    circle: field.circle && { ...field.circle, center: { x: mx(field.circle.center.x, m), z: field.circle.center.z } },
    props: field.props?.map((p) => ({ ...p, pos: { x: mx(p.pos.x, m), z: p.pos.z }, rotation: -(p.rotation ?? 0) })),
    setPieces: field.setPieces?.map((p) => ({
      ...p, pos: { x: mx(p.pos.x, m), z: p.pos.z }, rotation: -(p.rotation ?? 0), to: p.to && { x: mx(p.to.x, m), z: p.to.z },
    })),
  };
}

/**
 * Aplica la variante a un cuadro: espejo de posiciones y direcciones, colores de equipo
 * y objeto en la mano de los líderes que no llevan otro.
 */
export function applyFrameVariant(
  frame: GameFrame,
  variant: SceneVariant,
  recolor: (c: string, s: string) => [string, string],
  leaderProp?: HandProp
): GameFrame {
  const m = variant.mirror;
  return {
    competitors: frame.competitors.map((c) => {
      const [teamColor, secondaryColor] = recolor(c.teamColor, c.secondaryColor);
      return {
        ...c,
        teamColor,
        secondaryColor,
        pos: { x: mx(c.pos.x, m), z: c.pos.z },
        // Dirección (cos h, sin h) reflejada en x → (−cos h, sin h) = ángulo π − h
        heading: m ? Math.PI - c.heading : c.heading,
        handProp: c.handProp ?? (c.role === 'lider' && !c.holdingChicote ? leaderProp : undefined),
      };
    }),
    flags: frame.flags.map((f) => {
      const [color, secondaryColor] = recolor(f.color, f.secondaryColor);
      return { ...f, color, secondaryColor, pos: { x: mx(f.pos.x, m), z: f.pos.z } };
    }),
    items: frame.items?.map((it) => ({
      ...it, pos: { x: mx(it.pos.x, m), z: it.pos.z }, rotation: m ? -(it.rotation ?? 0) : it.rotation, to: it.to && { x: mx(it.to.x, m), z: it.to.z },
    })),
    chicote: frame.chicote && { ...frame.chicote, pos: frame.chicote.pos && { x: mx(frame.chicote.pos.x, m), z: frame.chicote.pos.z } },
  };
}
