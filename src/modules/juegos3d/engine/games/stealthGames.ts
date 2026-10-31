import { FlagState, Vec2 } from '../types';
import { keyframePath } from '../tracks';
import { GameDefinition } from './common';
import { Activity, CENTER, P, PersonSpec, buildCornerScene, buildFieldScene, faceTo, holding, instructing, pose, ring, route, still } from './dsl';
import { StealthVariant, createStealthScene } from './stealth';
import { TEAMS } from './corners';

/**
 * SIGILO, RASTREO Y OBSERVACIÓN — la actividad viene de las reglas.
 * Las variantes del guardián vendado (vigilante con silbato, pitador, pirata dormido) usan la escena base.
 */

const D = 20;
const LEADER: PersonSpec = { team: 4, name: 'Dirigente', role: 'lider', hat: 'four_dents', path: still(0, -6.5), poses: pose('swing') };
const lerpP = (a: Vec2, b: Vec2, u: number) => P(a.x + (b.x - a.x) * u, a.z + (b.z - a.z) * u);

/** Defensa del banderín silencioso: dos equipos defienden 4 banderines, dos atacan en sigilo. */
function flagDefense(): Activity & { flags: (t: number) => FlagState[] } {
  const flagSpots = ring(4, 0.6, Math.PI / 4);
  const people: PersonSpec[] = [];
  // Defensores (equipos 0 y 1) patrullan alrededor del centro
  [0, 1].forEach((ti) => [0, 1, 2].forEach((k) => {
    const phase = ti * Math.PI + (k * Math.PI * 2) / 3;
    people.push({
      team: ti, role: k === 0 ? 'lider' : 'jugador', hat: k === 0 ? 'beret' : 'none',
      path: (t) => { const a = phase + t * 0.25 * (ti ? -1 : 1); const r = 2.6 + Math.sin(t * 0.7 + k) * 0.4; return P(Math.cos(a) * r, Math.sin(a) * r); },
      poses: k === 1 && ti === 0 ? [{ t: 0, pose: 'swing' }, { t: 9.6, pose: 'tag' }, { t: 10.6, pose: 'swing' }] : pose('swing'),
      labels: k === 0 ? [{ t: 0, label: 'Defiende con la pañoleta a la cintura' }] : undefined,
    });
  }));
  // Atacantes (equipos 2 y 3) se acercan agachados desde las esquinas
  const corners = [P(-9, -7), P(9, -7), P(-9, 7), P(9, 7)];
  corners.forEach((c, i) => {
    const ti = 2 + (i % 2);
    const winner = i === 3;
    const caught = i === 0;
    const near = lerpP(c, CENTER, 0.62);
    const keys: [number, number, number][] = caught
      ? [[0, c.x, c.z], [3, c.x, c.z], [9.8, near.x, near.z], [10.4, near.x, near.z], [14, c.x, c.z], [D, c.x, c.z]]
      : winner
        ? [[0, c.x, c.z], [2, c.x, c.z], [11, near.x, near.z], [13.2, flagSpots[3].x * 1.6, flagSpots[3].z * 1.6], [13.8, flagSpots[3].x * 1.6, flagSpots[3].z * 1.6], [17.5, c.x, c.z], [D, c.x, c.z]]
        : [[0, c.x, c.z], [4, c.x, c.z], [14, near.x, near.z], [D, near.x, near.z]];
    people.push({
      team: ti, hat: i % 2 ? 'beret' : 'none',
      path: route(...keys), face: CENTER, faceWhenStill: true,
      crouch: winner ? [{ t: 0, v: 1 }, { t: 11, v: 1 }, { t: 11.5, v: 0 }] : [{ t: 0, v: 1 }],
      poses: winner ? [{ t: 0, pose: 'swing' }, { t: 13.2, pose: 'tag' }, { t: 13.8, pose: 'carry' }] : caught ? [{ t: 0, pose: 'swing' }, { t: 10.2, pose: 'frozen' }, { t: 11, pose: 'swing' }] : pose('swing'),
      labels: winner ? [{ t: 0, label: 'Ataca en sigilo' }, { t: 13.2, label: '¡Toma un banderín!' }] : caught ? [{ t: 10, label: '¡Le quitaron la pañoleta!' }, { t: 12 }] : undefined,
    });
  });
  const winnerIndex = people.length - 1;
  return {
    people,
    focus: winnerIndex,
    flags: (t) => flagSpots.map((s, i) => {
      const team = TEAMS[i];
      return i === 3 && t > 13.6
        ? { id: `flag_${i}`, color: team.teamColor, secondaryColor: team.secondaryColor, pos: s, carrierId: `fs_${winnerIndex}` }
        : { id: `flag_${i}`, color: team.teamColor, secondaryColor: team.secondaryColor, pos: s };
    }),
  };
}

/** Mensajero ciego y guía mudo: el mudo guía con toques en los hombros por un circuito con obstáculos. */
function blindMutePairs(): Activity {
  const people: PersonSpec[] = [];
  const pieces: Activity['pieces'] = [];
  [-4.5, -1.5, 1.5, 4.5].forEach((z, ti) => {
    const way = keyframePath([
      { t: 0, x: -8, z }, { t: 2, x: -8, z }, { t: 6, x: -4, z: z + 0.8 }, { t: 10, x: 0, z: z - 0.8 },
      { t: 14, x: 4, z: z + 0.8 }, { t: 17, x: 7, z }, { t: D, x: 7, z },
    ]);
    pieces!.push({ kind: 'cone', at: P(-4, z - 0.4) }, { kind: 'cone', at: P(0, z + 0.4) }, { kind: 'cone', at: P(4, z - 0.4) }, { kind: 'stool', at: P(8, z) }, { kind: 'notebook', at: P(8, z), height: 0.45, count: 1 });
    people.push({ team: ti, blindfold: true, path: (t) => way(t), poses: [{ t: 0, pose: 'swing' }, { t: 17, pose: 'tag' }], handProp: holding([0, 17.5, 'notebook']), labels: ti === 1 ? [{ t: 0, label: 'Vendado: lleva el mensaje' }, { t: 17, label: 'Lo deja en el Libro de Oro' }] : undefined });
    people.push({ team: ti, role: 'lider', hat: 'beret', path: (t) => way(Math.max(0, t - 0.7)), poses: pose('shoulders'), labels: ti === 1 ? [{ t: 0, label: 'Mudo: guía con toques' }] : undefined });
  });
  return { people, pieces, focus: 2, field: { width: 20, depth: 14 } } as Activity;
}

/** Rastro del explorador: cada equipo sigue 5 señales naturales hasta su banderín oculto. */
function trailSigns(): Activity & { flags: (t: number) => FlagState[] } {
  const people: PersonSpec[] = [];
  const pieces: Activity['pieces'] = [];
  const flags: FlagState[] = [];
  ring(4, 1.5, Math.PI / 4).forEach((start, ti) => {
    const out = Math.PI / 4 + (ti * Math.PI) / 2;
    const signs = [1, 2, 3, 4, 5].map((k) => P(Math.cos(out + Math.sin(k) * 0.35) * (1.5 + k * 1.35), Math.sin(out + Math.sin(k) * 0.35) * (1.5 + k * 1.35)));
    signs.forEach((s) => pieces!.push({ kind: 'natural', at: s }));
    const end = P(Math.cos(out) * 9.2, Math.sin(out) * 9.2);
    flags.push({ id: `hidden_${ti}`, color: TEAMS[ti].teamColor, secondaryColor: TEAMS[ti].secondaryColor, pos: end });
    for (let k = 0; k < 4; k++) {
      const lag = k * 0.8;
      const keys = [{ t: 0, ...start }, ...signs.flatMap((s, i) => [{ t: 1.5 + i * 3.4 + lag, ...s }, { t: 2.7 + i * 3.4 + lag, ...s }]), { t: 19 + lag * 0.2, ...lerpP(end, start, 0.08) }, { t: D, ...lerpP(end, start, 0.08) }];
      people.push({
        team: ti, role: k === 0 ? 'lider' : 'jugador', hat: k === 0 ? 'beret' : 'none',
        path: (t) => keyframePath(keys)(t),
        stances: k === 0 ? signs.flatMap((_, i) => [{ t: 1.6 + i * 3.4, stance: 'squat' as const }, { t: 2.6 + i * 3.4, stance: 'stand' as const }]) : undefined,
        poses: k === 0 ? [{ t: 0, pose: 'swing' }, { t: 1.6, pose: 'tag' }] : pose('swing'),
        labels: k === 0 ? [{ t: 1.6, label: 'Flecha de ramas: por aquí' }, { t: 5, label: 'Tres piedras: ¡peligro!' }, { t: 8.4, label: 'Cruz: camino cortado' }, { t: 15, label: 'Banderín a la vista' }] : undefined,
      });
    }
  });
  return { people, pieces, focus: 0, flags: () => flags };
}

/** Cazadores de huellas: cada equipo analiza dirección, velocidad y peso en un arenero. */
function footprintAnalysis(): Activity {
  const pieces: Activity['pieces'] = [{ kind: 'sand', at: CENTER }, { kind: 'footprints', at: P(0, -0.25), rotation: 0.3 }, { kind: 'footprints', at: P(0.1, 0.25), rotation: -0.5 }];
  const people: PersonSpec[] = [{ ...LEADER, path: still(0, -2.6), face: CENTER, poses: instructing([3, 12]), labels: [{ t: 0, label: '¿Hacia dónde iba? ¿Corría?' }] }];
  ring(4, 3.4, Math.PI / 2).forEach((base, ti) => {
    for (let k = 0; k < 3; k++) {
      const spot = lerpP(base, CENTER, 0.0);
      const side = P(spot.x + (k - 1) * 0.7 * Math.cos(ti * Math.PI / 2), spot.z + (k - 1) * 0.7 * Math.sin(ti * Math.PI / 2));
      const turn = 1 + ti * 4;
      const close = lerpP(side, CENTER, 0.55);
      people.push({
        team: ti, role: k === 0 ? 'lider' : 'jugador', hat: k === 0 ? 'beret' : 'none',
        path: k === 0 ? route([0, side.x, side.z], [turn, side.x, side.z], [turn + 1.2, close.x, close.z], [turn + 4.4, close.x, close.z], [turn + 5.6, side.x, side.z], [D, side.x, side.z]) : still(side.x, side.z),
        face: CENTER, faceWhenStill: true,
        stances: k === 0 ? [{ t: 0, stance: 'stand' }, { t: turn + 1.2, stance: 'squat' }, { t: turn + 4.2, stance: 'stand' }] : undefined,
        poses: k === 0 ? [{ t: 0, pose: 'swing' }, { t: turn + 1.2, pose: 'tag' }, { t: turn + 4.4, pose: 'swing' }] : k === 2 ? pose('measure') : pose('swing'),
        handProp: k === 2 ? 'notebook' : undefined,
        labels: k === 0 ? [{ t: turn + 1.2, label: ['Corría: pisada de punta', 'Perro grande, iba al norte', 'Ave: tres dedos', 'Caminando, cargaba peso'][ti] }, { t: turn + 4.6 }] : undefined,
      });
    }
  });
  return { people, pieces, focus: 1 };
}

/** Triángulo ciego: 10 pasos a 60°, 10 a 180° y 10 a 300° para volver a la estaca. */
function blindTriangle(): Activity {
  const people: PersonSpec[] = [];
  const pieces: Activity['pieces'] = [];
  const legs = [60, 180, 300].map((deg) => (deg * Math.PI) / 180);
  const L = 3.2;
  ring(4, 5.4, Math.PI / 4).forEach((stake, ti) => {
    pieces!.push({ kind: 'stake', at: stake, count: 1 });
    const corners = [stake];
    legs.forEach((a) => {
      const prev = corners[corners.length - 1];
      corners.push(P(prev.x + Math.sin(a) * L, prev.z - Math.cos(a) * L));
    });
    for (let k = 0; k < 3; k++) {
      const lag = k * 0.7;
      const keys = [{ t: 0, ...stake }, { t: 1.5 + lag, ...stake }, ...corners.slice(1).flatMap((c, i) => [{ t: 5.5 + i * 4.6 + lag, ...c }, { t: 6.3 + i * 4.6 + lag, ...c }]), { t: D, ...corners[3] }];
      people.push({
        team: ti, role: k === 0 ? 'lider' : 'jugador', hat: k === 0 ? 'beret' : 'none',
        path: (t) => keyframePath(keys)(t),
        poses: pose(k === 0 ? 'measure' : 'swing'),
        handProp: k === 0 ? 'compass' : undefined,
        labels: k === 0 ? [{ t: 1.5, label: '10 pasos a 60°' }, { t: 6.3, label: '10 pasos a 180°' }, { t: 10.9, label: '10 pasos a 300°' }, { t: 15.5, label: '¡De vuelta en la estaca!' }] : undefined,
      });
    }
  });
  return { people, pieces, focus: 0 };
}

/** Kim: observar objetos sobre una manta, cubrirlos, listarlos y luego reconocer por tacto. */
function kimGame(): Activity {
  // Objetos pequeños sobre la manta (se cubren a los 7 s)
  const objects: Activity['pieces'] = [
    { kind: 'blanket', at: CENTER },
    { kind: 'cards', at: P(-0.3, -0.2), height: 0.01 }, { kind: 'flashlight', at: P(0.25, 0.2), height: 0.01 },
    { kind: 'rope', at: P(0.3, -0.25), height: 0.01, count: 1 }, { kind: 'natural', at: P(-0.25, 0.25), height: 0.01 },
  ];
  const people: PersonSpec[] = [0, 1, 2, 3, 4].map((i) => {
    const spot = ring(5, 0.95, Math.PI / 2)[i];
    return {
      role: i === 0 ? 'lider' : 'jugador', hat: i === 0 ? 'four_dents' : 'none',
      path: still(spot.x, spot.z), face: CENTER,
      stances: [{ t: 0, stance: 'kneel' }],
      poses: i === 0 ? [{ t: 0, pose: 'tag' }, { t: 7, pose: 'work' }, { t: 9, pose: 'swing' }] : [{ t: 0, pose: 'measure' }, { t: 8, pose: 'work' }, { t: 14 + i * 1.2, pose: 'tag' }, { t: 15 + i * 1.2, pose: 'work' }],
      handProp: i === 0 ? holding([13, D, 'notebook']) : holding([8, D, 'pencil']),
      labels: i === 0 ? [{ t: 0, label: '1 minuto para observar' }, { t: 7, label: 'Cubre los objetos' }, { t: 9, label: 'Listar en equipo' }, { t: 14, label: 'Kim tacto: bolsa opaca' }] : undefined,
    };
  });
  return {
    people, pieces: objects,
    items: [
      { kind: 'blanket', path: route([0, 0, -1.6], [7, 0, -1.6], [8, 0, 0], [D, 0, 0]), height: (t) => (t < 7 ? -5 : 0.06) },
      { kind: 'sack', path: ring(5, 0.55, Math.PI / 2).map((p, i) => ({ t: 14 + i * 1.2, x: p.x, z: p.z })).concat([{ t: D, ...ring(5, 0.55, Math.PI / 2)[4] }]), height: (t) => (t < 13.8 ? -5 : 0.45), count: 1 },
    ],
  };
}

/** Trazado de pistas: un equipo deja señales con material caído y el otro las sigue. */
function trailLaying(): Activity {
  const signs = [P(-6, 3), P(-3, 1.5), P(0, 3.2), P(3, 1.2), P(6, 3)];
  const people: PersonSpec[] = [];
  // Águilas (equipo 0) trazan la pista
  for (let k = 0; k < 3; k++) {
    const keys: [number, number, number][] = [[0, -8, 5 + k * 0.6]];
    signs.forEach((s, i) => keys.push([1.5 + i * 2 + k * 0.4, s.x, s.z + 0.5], [2.5 + i * 2 + k * 0.4, s.x, s.z + 0.5]));
    keys.push([D, 8, 5 + k * 0.6]);
    people.push({
      team: 0, role: k === 0 ? 'lider' : 'jugador', hat: k === 0 ? 'beret' : 'none', path: route(...keys),
      stances: k === 0 ? signs.flatMap((_, i) => [{ t: 1.6 + i * 2, stance: 'squat' as const }, { t: 2.4 + i * 2, stance: 'stand' as const }]) : undefined,
      poses: k === 0 ? pose('work') : pose('swing'), handProp: k === 0 ? 'stone' : undefined,
      labels: k === 0 ? [{ t: 0, label: 'Águilas trazan la pista' }, { t: 1.5, label: 'Solo material caído' }] : undefined,
    });
  }
  // Lobos (equipo 1) esperan y luego la siguen
  for (let k = 0; k < 3; k++) {
    const keys: [number, number, number][] = [[0, -8, -4 + k * 0.6], [9.5, -8, -4 + k * 0.6]];
    signs.forEach((s, i) => keys.push([12 + i * 1.5 + k * 0.4, s.x, s.z - 0.4]));
    keys.push([D, 7.5, 2.4 - k * 0.5]);
    people.push({
      team: 1, role: k === 0 ? 'lider' : 'jugador', hat: k === 0 ? 'beret' : 'none', path: route(...keys),
      face: (t) => (t < 10 ? faceTo(P(-8, -4), P(-6, 3)) : undefined),
      poses: pose('swing'),
      labels: k === 0 ? [{ t: 0, label: 'Lobos esperan sin mirar' }, { t: 10.5, label: 'Siguen la pista de Águilas' }] : undefined,
    });
  }
  return { people, pieces: signs.map((s) => ({ kind: 'natural' as const, at: s })), items: undefined, focus: 0 };
}

const FIELD: Record<string, () => Activity & { flags?: (t: number) => FlagState[]; field?: object }> = {
  flag_defense: flagDefense,
  blind_mute_pairs: blindMutePairs,
  trail_signs: trailSigns,
  footprint_analysis: footprintAnalysis,
  blind_triangle: blindTriangle,
  trail_laying: trailLaying,
};

const GUARDIAN: Record<string, StealthVariant> = {
  sentinel_whistle: 'sentinel_whistle',
  whistle_blind: 'whistle_blind',
  sleeping_pirate: 'sleeping_pirate',
};

export function createStealthGamesScene(activity?: string | null): GameDefinition {
  if (!activity) return createStealthScene();
  if (GUARDIAN[activity]) return createStealthScene(GUARDIAN[activity]);
  if (activity === 'kim_game') return buildCornerScene('stealth', kimGame());
  const make = FIELD[activity];
  return make ? buildFieldScene('stealth', make() as Parameters<typeof buildFieldScene>[1]) : createStealthScene();
}

export const STEALTH_ACTIVITIES = [...Object.keys(FIELD), ...Object.keys(GUARDIAN), 'kim_game'];
