import { ArmPose, CompetitorRole, FieldLayout, FlagState, FocalProp, HandProp, HatType, PieceKind, SceneId, SetPiece, Stance, Vec2 } from '../types';
import { buildTrack, keyframePath, labelTimeline, poseTimeline, scalarKeys, stanceTimeline } from '../tracks';
import { CompetitorScript, GameDefinition, appearance } from './common';
import { CORNER_TREES, LocalKey, NAMES, TEAMS, corner, cornerZones, isStill } from './corners';

/**
 * Mini-lenguaje de coreografías: cada juego se describe con DATOS (personas, recorridos, posturas,
 * objetos fijos y móviles) y dos constructores los convierten en escenas:
 *  - buildCornerScene: la misma actividad replicada en los 4 rincones (un equipo por rincón);
 *  - buildFieldScene: una actividad en todo el campo (equipos que interactúan entre sí).
 * Coordenadas: en rincones son locales (+z mira al centro del campo); en campo completo, del campo.
 */

export type Face = number | Vec2 | ((t: number) => number | undefined);

export interface PersonSpec {
  team?: number;            // solo escenas de campo completo (en rincones, el equipo es el del rincón)
  name?: string;
  role?: CompetitorRole;
  hat?: HatType;
  blindfold?: boolean;
  path: LocalKey[] | ((t: number) => Vec2);
  /** Hacia dónde mira: ángulo fijo, punto, función; si se omite, mira hacia donde camina. */
  face?: Face;
  /** Si es true, solo usa `face` cuando está quieto (al caminar mira hacia donde va). */
  faceWhenStill?: boolean;
  poses: { t: number; pose: ArmPose }[];
  stances?: { t: number; stance: Stance }[];
  handProp?: HandProp | [number, number, HandProp][];
  crouch?: { t: number; v: number }[];
  wearsBackpack?: boolean;
  labels?: { t: number; label?: string }[];
}

export interface MovingItem { kind: PieceKind; path: LocalKey[] | ((t: number) => Vec2); height?: number | ((t: number) => number); rotation?: (t: number) => number; count?: number; to?: (t: number) => Vec2 }
export interface StaticPiece { kind: PieceKind; at: Vec2; rotation?: number; height?: number; to?: Vec2; count?: number }

export interface Activity {
  duration?: number;
  people: PersonSpec[];
  pieces?: StaticPiece[];
  items?: MovingItem[];
  /** Elemento focal del taller en cada rincón (solo escenas por rincones). */
  focal?: FocalProp;
  /** Índice de la persona que sigue la cámara (en el rincón 1, o en la lista en campo completo). */
  focus?: number;
}

// ---------------------------------------------------------------------------
// Ayudantes para escribir recorridos
// ---------------------------------------------------------------------------

export const P = (x: number, z: number): Vec2 => ({ x, z });
export const CENTER = P(0, 0);
export const still = (x: number, z: number, duration = 20): LocalKey[] => [{ t: 0, x, z }, { t: duration, x, z }];
/** Recorrido por puntos con tiempos: [[t, x, z], …]. */
export const route = (...keys: [number, number, number][]): LocalKey[] => keys.map(([t, x, z]) => ({ t, x, z }));
/** Ida y vuelta entre a y b, con pausas en los extremos. */
export const shuttle = (a: Vec2, b: Vec2, t0: number, t1: number, t2: number, t3: number, duration = 20): LocalKey[] => [
  { t: 0, ...a }, { t: t0, ...a }, { t: t1, ...b }, { t: t2, ...b }, { t: t3, ...a }, { t: duration, ...a },
];
/** Puntos en círculo. */
export const ring = (n: number, r: number, offset = 0, center: Vec2 = CENTER): Vec2[] =>
  Array.from({ length: n }, (_, i) => {
    const a = offset + (i / n) * Math.PI * 2;
    return P(center.x + Math.cos(a) * r, center.z + Math.sin(a) * r);
  });
/** Mira hacia un punto desde una posición fija. */
export const faceTo = (from: Vec2, to: Vec2) => Math.atan2(to.z - from.z, to.x - from.x);
/** Línea de tiempo de un objeto en la mano: [[desde, hasta, objeto], …]. */
export const holding = (...intervals: [number, number, HandProp][]) => intervals;
/** Líder que da instrucciones señalando en los instantes indicados. */
export const instructing = (times: number[]): { t: number; pose: ArmPose }[] => [
  { t: 0, pose: 'swing' }, ...times.flatMap((t) => [{ t, pose: 'tag' as const }, { t: t + 1.4, pose: 'swing' as const }]),
];
export const pose = (p: ArmPose) => [{ t: 0, pose: p }];

// ---------------------------------------------------------------------------
// Constructores
// ---------------------------------------------------------------------------

type ToWorld = (p: Vec2) => Vec2;

function personScript(spec: PersonSpec, id: string, look: Parameters<typeof appearance>[1], index: number, duration: number, toWorld: ToWorld, theta: number): CompetitorScript {
  const keys = typeof spec.path === 'function' ? null : spec.path.map((k) => ({ t: k.t, ...toWorld(k) }));
  const path = keys ? keyframePath(keys) : (t: number) => toWorld((spec.path as (t: number) => Vec2)(t));
  const faceAt = (t: number): number | undefined => {
    const f = spec.face;
    if (f === undefined) return undefined;
    if (typeof f === 'number') return f - theta;
    if (typeof f === 'function') {
      const v = f(t);
      return v === undefined ? undefined : v - theta;
    }
    const target = toWorld(f);
    const p = path(t);
    return Math.atan2(target.z - p.z, target.x - p.x);
  };
  const moves = !keys || keys.length > 2;
  const face = spec.face === undefined
    ? undefined
    : spec.faceWhenStill && keys
      ? (t: number) => (isStill(keys, t) ? faceAt(t) : undefined)
      : faceAt;
  const hp = spec.handProp;
  return {
    appearance: appearance(index, { ...look, id, isBlindfolded: spec.blindfold ?? false }),
    track: buildTrack(path, duration, { face, maxTurnRate: moves ? 6 : 4 }),
    pose: poseTimeline(spec.poses),
    stance: spec.stances ? stanceTimeline(spec.stances) : undefined,
    crouch: spec.crouch ? scalarKeys(spec.crouch) : undefined,
    handProp: Array.isArray(hp) ? (t) => hp.find(([a, b]) => t >= a && t < b)?.[2] : hp,
    wearsBackpack: spec.wearsBackpack,
    label: spec.labels ? labelTimeline(spec.labels) : undefined,
  };
}

function itemFn(it: MovingItem, id: string, toWorld: ToWorld, theta: number) {
  const path = typeof it.path === 'function' ? (t: number) => toWorld((it.path as (t: number) => Vec2)(t)) : keyframePath(it.path.map((k) => ({ t: k.t, ...toWorld(k) })));
  return (t: number) => ({
    id, kind: it.kind, count: it.count,
    pos: path(t),
    height: typeof it.height === 'function' ? it.height(t) : it.height,
    rotation: (it.rotation?.(t) ?? 0) + theta,
    to: it.to && toWorld(it.to(t)),
  });
}

/** La misma actividad en los 4 rincones (un equipo por rincón). */
export function buildCornerScene(id: SceneId, a: Activity): GameDefinition {
  const duration = a.duration ?? 20;
  const competitors: CompetitorScript[] = [];
  const setPieces: SetPiece[] = [];
  const items: ReturnType<typeof itemFn>[] = [];
  TEAMS.forEach((team, ti) => {
    const { theta, toWorld } = corner(ti);
    a.pieces?.forEach((p) => setPieces.push({ kind: p.kind, pos: toWorld(p.at), rotation: (p.rotation ?? 0) + theta, height: p.height, to: p.to && toWorld(p.to), count: p.count }));
    a.items?.forEach((it, ii) => items.push(itemFn(it, `c${ti}_item_${ii}`, toWorld, theta)));
    a.people.forEach((spec, k) => {
      competitors.push(personScript(spec, `ws_${ti}_${k}`, {
        id: '', name: spec.name ?? NAMES[ti][k % 5], role: spec.role ?? 'jugador', hatType: spec.hat ?? 'none', ...team,
      }, ti * 5 + k + 1, duration, toWorld, theta));
    });
  });
  return {
    id,
    duration,
    focusId: `ws_0_${a.focus ?? 0}`,
    field: {
      width: 20, depth: 20, midline: false, zones: cornerZones(), trees: CORNER_TREES, setPieces,
      props: a.focal ? TEAMS.map((_, i) => ({ kind: a.focal!, pos: corner(i).center, rotation: corner(i).theta })) : undefined,
    },
    competitors,
    flags: () => [],
    items: items.length ? (t) => items.map((f) => f(t)) : undefined,
  };
}

/** Una actividad en todo el campo (los equipos se indican en cada persona con `team`). */
export function buildFieldScene(id: SceneId, a: Activity & { field?: Partial<FieldLayout>; flags?: (t: number) => FlagState[] }): GameDefinition {
  const duration = a.duration ?? 20;
  const identity: ToWorld = (p) => p;
  const counters = [0, 0, 0, 0, 0];
  const competitors = a.people.map((spec, k) => {
    const ti = spec.team ?? 0;
    const team = ti >= 4 ? { teamName: 'Dirigentes', teamColor: '#64748B', secondaryColor: '#F8FAFC' } : TEAMS[ti];
    const name = spec.name ?? NAMES[Math.min(ti, 3)][counters[ti]++ % 5];
    return personScript(spec, `fs_${k}`, { id: '', name, role: spec.role ?? 'jugador', hatType: spec.hat ?? 'none', ...team }, k + 1, duration, identity, 0);
  });
  const items = (a.items ?? []).map((it, ii) => itemFn(it, `f_item_${ii}`, identity, 0));
  return {
    id,
    duration,
    focusId: `fs_${a.focus ?? 0}`,
    field: {
      width: 20, depth: 16, midline: false, zones: [], trees: CORNER_TREES,
      setPieces: a.pieces?.map((p) => ({ kind: p.kind, pos: p.at, rotation: p.rotation, height: p.height, to: p.to, count: p.count })),
      ...a.field,
    },
    competitors,
    flags: a.flags ?? (() => []),
    items: items.length ? (t) => items.map((f) => f(t)) : undefined,
  };
}
