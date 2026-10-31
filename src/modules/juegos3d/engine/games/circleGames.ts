import { Vec2 } from '../types';
import { GameDefinition } from './common';
import { Activity, CENTER, P, PersonSpec, buildFieldScene, faceTo, instructing, pose, ring, route, still } from './dsl';
import { createCircleScene } from './circle';
import { createRelayScene } from './relay';

/**
 * JUEGOS EN CÍRCULO Y RONDA — campo completo; la actividad viene de las reglas.
 * Las rondas usan `team` para colorear a las personas (0–3 equipos, 4 = dirigente).
 */

const D = 20;
const LEADER: PersonSpec = { team: 4, name: 'Dirigente', role: 'lider', hat: 'four_dents', path: still(0, 0), poses: pose('swing') };
const teamOf = (i: number) => i % 4;
/** Altura de un objeto lanzado en parábola entre t0 y t1. */
const arc = (t: number, t0: number, t1: number, peak: number, base = 1.2) => {
  if (t < t0 || t > t1) return base;
  const u = (t - t0) / (t1 - t0);
  return base + 4 * peak * u * (1 - u);
};
const lerpP = (a: Vec2, b: Vec2, u: number) => P(a.x + (b.x - a.x) * u, a.z + (b.z - a.z) * u);
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));

// ---------------------------------------------------------------------------

/** Rosa de los vientos viviente: el equipo nombrado corre a su rumbo en el círculo central. */
function compassRoseStar(): Activity {
  const bases = ring(4, 6.6, Math.PI / 4);
  const calls: { team: number; at: number; spot: Vec2; label: string }[] = [
    { team: 0, at: 2, spot: P(-2.1, 2.1), label: '¡Suroeste, 225°!' },
    { team: 2, at: 8, spot: P(0, -3), label: '¡Norte, 0°!' },
    { team: 1, at: 13.5, spot: P(3, 0), label: '¡Este, 90°!' },
  ];
  const people: PersonSpec[] = [{
    ...LEADER, face: (t) => (t < 8 ? faceTo(CENTER, calls[0].spot) : t < 13.5 ? faceTo(CENTER, calls[1].spot) : faceTo(CENTER, calls[2].spot)),
    poses: instructing([2, 8, 13.5]), handProp: 'whistle',
    labels: calls.map((c) => ({ t: c.at, label: c.label })),
  }];
  bases.forEach((b, ti) => {
    const call = calls.find((c) => c.team === ti);
    for (let k = 0; k < 4; k++) {
      const home = P(b.x + (k - 1.5) * 0.7 * -Math.sin(Math.PI / 4 + ti * Math.PI / 2), b.z + (k - 1.5) * 0.7 * Math.cos(Math.PI / 4 + ti * Math.PI / 2));
      const spot = call ? P(call.spot.x + (k - 1.5) * 0.5, call.spot.z + (k - 1.5) * 0.25) : home;
      people.push({
        team: ti, role: k === 0 ? 'lider' : 'jugador', hat: k === 0 ? 'beret' : 'none',
        // Si el regreso no alcanza antes del final, el equipo se queda en su posición
        path: call
          ? call.at + 7.5 < D
            ? route([0, home.x, home.z], [call.at + 0.3, home.x, home.z], [call.at + 3.2, spot.x, spot.z], [call.at + 4.6, spot.x, spot.z], [call.at + 7.5, home.x, home.z], [D, home.x, home.z])
            : route([0, home.x, home.z], [call.at + 0.3, home.x, home.z], [call.at + 3.2, spot.x, spot.z], [D, spot.x, spot.z])
          : still(home.x, home.z),
        face: CENTER, faceWhenStill: true,
        poses: call ? [{ t: 0, pose: 'swing' }, { t: call.at + 2.4, pose: 'cheer' }, { t: call.at + 4, pose: 'swing' }] : pose('swing'),
        labels: k === 0 && call ? [{ t: call.at + 2.4, label: 'Posición exacta' }, { t: call.at + 4.5 }] : undefined,
      });
    }
  });
  return { people, focus: 1, field: { width: 18, depth: 16, circle: { center: CENTER, radius: 2.5 } } } as Activity;
}

/** Antorcha de la buena senda: la linterna pasa de mano en mano y cada uno recuerda un hito del año. */
function torchPass(): Activity {
  const N = 12;
  const spots = ring(N, 4, Math.PI / 2);
  const per = D / N;
  const hand = (i: number) => lerpP(spots[i], CENTER, 0.13);
  return {
    people: spots.map((s, i) => ({
      team: teamOf(i), role: i === 0 ? 'lider' : 'jugador', hat: i % 3 === 0 ? 'beret' : 'none',
      path: still(s.x, s.z), face: CENTER,
      poses: [{ t: 0, pose: 'behind' }, { t: i * per - 0.3, pose: 'carry' }, { t: (i + 1) * per - 0.2, pose: 'behind' }],
      labels: [{ t: 0 }, { t: i * per, label: ['Mi primera noche de campamento', 'Superé el miedo a la altura', 'Aprendí a cocinar', 'Ayudé a un compañero nuevo', 'Terminé mi especialidad', 'La caminata de 15 km'][i % 6] }, { t: (i + 1) * per }],
    })),
    items: [{ kind: 'flashlight', path: (t) => { const i = Math.min(N - 1, Math.floor(t / per)); const u = clamp01((t - i * per) / 0.6); return lerpP(hand((i + N - 1) % N), hand(i), i === 0 && t < 0.6 ? 1 : u); }, height: 1.25, rotation: (t) => t }],
    focus: 0,
  };
}

/** Toques de silbato: cada llamada provoca una reacción distinta. */
function whistleSignals(): Activity {
  const people: PersonSpec[] = [{
    ...LEADER, handProp: 'whistle', poses: [{ t: 0, pose: 'swing' }, { t: 3, pose: 'cheer' }, { t: 4, pose: 'swing' }, { t: 8, pose: 'cheer' }, { t: 9, pose: 'swing' }, { t: 13, pose: 'cheer' }, { t: 14, pose: 'swing' }, { t: 17, pose: 'cheer' }, { t: 18.2, pose: 'swing' }],
    labels: [{ t: 3, label: 'Llamada de Guías  — • —' }, { t: 8, label: 'Llamada general  — — —' }, { t: 13, label: 'Alarma  • • • •' }, { t: 17, label: 'Silencio  ——' }],
  }];
  const scatter = (ti: number, k: number) => P(Math.cos(ti * 1.6 + k * 2.2) * (4 + k), Math.sin(ti * 1.6 + k * 2.2) * (3.2 + (k % 2)));
  for (let ti = 0; ti < 4; ti++) {
    for (let k = 0; k < 4; k++) {
      const free = scatter(ti, k);
      const line = P(-3 + ti * 2 + (k % 2) * 0.6, 1.6 + Math.floor(k / 2) * 0.7);
      const guia = P(-1 + ti * 0.7, 1.1);
      const isGuide = k === 0;
      const keys: [number, number, number][] = isGuide
        ? [[0, free.x, free.z], [3.3, free.x, free.z], [5.5, guia.x, guia.z], [8.3, guia.x, guia.z], [10.5, line.x, line.z], [13, line.x, line.z], [D, line.x, line.z]]
        : [[0, free.x, free.z], [8.3, free.x, free.z], [10.8, line.x, line.z], [D, line.x, line.z]];
      people.push({
        team: ti, role: isGuide ? 'lider' : 'jugador', hat: isGuide ? 'beret' : 'none',
        path: route(...keys), face: CENTER, faceWhenStill: true,
        stances: [{ t: 0, stance: 'stand' }, { t: 13.4, stance: 'squat' }, { t: 16.5, stance: 'stand' }],
        poses: [{ t: 0, pose: 'swing' }, { t: 17.2, pose: 'frozen' }],
      });
    }
  }
  return { people, focus: 1 };
}

/** Acosando al tejón: parejas tiran de sus cuerdas para alcanzar su saquito sin cruzar la línea. */
function badger(): Activity {
  const people: PersonSpec[] = [];
  const pieces: Activity['pieces'] = [];
  const items: Activity['items'] = [];
  ring(4, 4.2, Math.PI / 4).forEach((c, pi) => {
    const axis = Math.PI / 4 + (pi * Math.PI) / 2 + Math.PI / 2;
    const dir = P(Math.cos(axis), Math.sin(axis));
    const sway = (t: number) => Math.sin(t * 1.4 + pi) * 0.35 + (t > 14 ? (pi % 2 ? 0.5 : -0.5) * clamp01((t - 14) / 2) : 0);
    const at = (s: number, t: number) => P(c.x + dir.x * (s + sway(t)), c.z + dir.z * (s + sway(t)));
    pieces!.push({ kind: 'sack', at: P(c.x + dir.x * 2.1, c.z + dir.z * 2.1), count: 1 }, { kind: 'sack', at: P(c.x - dir.x * 2.1, c.z - dir.z * 2.1), count: 1 });
    pieces!.push({ kind: 'rope_line', at: P(c.x - dir.z * 0.6, c.z + dir.x * 0.6), to: P(c.x + dir.z * 0.6, c.z - dir.x * 0.6), height: 0.02 });
    items!.push({ kind: 'rope_line', path: (t) => at(-0.9, t), to: (t) => at(0.9, t), height: 0.8 });
    [-1, 1].forEach((side, k) => people.push({
      team: (pi + k) % 4, hat: k ? 'beret' : 'none',
      path: (t) => at(side * 1.05, t),
      face: Math.atan2(-side * dir.z, -side * dir.x),
      stances: [{ t: 0, stance: 'brace' }], poses: pose('pull'),
      labels: pi === 0 && k === 0 ? [{ t: 0, label: 'Jala hacia su saquito' }, { t: 15, label: '¡Lo alcanzó sin soltar!' }] : undefined,
    }));
  });
  people.push({ ...LEADER, path: still(0, 0), poses: instructing([2, 14]), labels: [{ t: 0, label: 'Sin cruzar la línea divisoria' }] });
  return { people, pieces, items, focus: 0 };
}

/** Pateando el taburete: ronda de la mano girando alrededor del taburete central. */
function kickStool(): Activity {
  const N = 10;
  const radius = (t: number) => 1.9 + Math.sin(t * 0.9) * 0.45;
  const angle = (i: number, t: number) => (i / N) * Math.PI * 2 + t * 0.35 + Math.sin(t * 1.7 + i) * 0.05;
  return {
    pieces: [{ kind: 'stool', at: CENTER }],
    people: Array.from({ length: N }, (_, i) => ({
      team: teamOf(i), role: i === 0 ? ('lider' as const) : ('jugador' as const), hat: i % 4 === 0 ? ('beret' as const) : ('none' as const),
      path: (t: number) => { const a = angle(i, t); const r = radius(t) - (i === 3 && t > 11 && t < 14 ? 0.7 * Math.sin(((t - 11) / 3) * Math.PI) : 0); return P(Math.cos(a) * r, Math.sin(a) * r); },
      face: CENTER, stances: [{ t: 0, stance: 'brace' as const }, { t: 2, stance: 'stand' as const }],
      poses: pose('frozen'),
      labels: i === 3 ? [{ t: 11, label: '¡Casi toca el taburete!' }, { t: 14.5 }] : i === 0 ? [{ t: 0, label: 'Ronda de la mano, sin soltarse' }] : undefined,
    })),
    focus: 0,
  };
}

/** Rosa de los vientos: dos rumbos nombrados intercambian lugares y el del centro intenta ocupar uno. */
function compassRoseSwap(): Activity {
  const spots = ring(8, 4, -Math.PI / 2);
  const names = ['Norte', 'Noreste', 'Este', 'Sureste', 'Sur', 'Suroeste', 'Oeste', 'Noroeste'];
  const swaps: [number, number, number][] = [[7, 4, 3], [2, 5, 10], [0, 3, 15.5]];
  const people: PersonSpec[] = spots.map((s, i) => {
    const keys: [number, number, number][] = [[0, s.x, s.z]];
    let cur = s;
    swaps.forEach(([a, b, t]) => {
      if (i !== a && i !== b) return;
      const dest = spots[i === a ? b : a];
      keys.push([t, cur.x, cur.z], [t + 2.2, dest.x, dest.z]);
      cur = dest;
    });
    keys.push([D, cur.x, cur.z]);
    return { team: teamOf(i), hat: i % 2 ? 'beret' : 'none', path: route(...keys), face: CENTER, faceWhenStill: true, poses: pose('swing'), labels: [{ t: 0, label: names[i] }] };
  });
  people.push({
    team: 1, name: 'Centro', role: 'lider', hat: 'four_dents',
    path: route([0, 0, 0], [3.2, 0, 0], [5, 1.8, -1.8], [6.6, 0.5, -0.5], [10.2, 0.5, -0.5], [12, 1.8, 1.8], [13.6, 0, 0], [15.6, 0, 0], [17.8, 2.8, -2.8], [D, 2.8, -2.8]),
    poses: pose('swing'), labels: [{ t: 0, label: 'Dirigente: «¡Noroeste y Sur!»' }, { t: 10, label: '«¡Este y Suroeste!»' }, { t: 15.5, label: '«¡Norte y Sureste!»' }, { t: 17.5, label: '¡Ocupó un lugar!' }],
  });
  return { people, focus: 8 };
}

/** Círculos cuadrados: parejas atan las cuerdas con nudo llano y se echan hacia atrás a probarlo. */
function squareCircles(): Activity {
  const people: PersonSpec[] = [];
  const pieces: Activity['pieces'] = [];
  ring(4, 4, 0).forEach((c, pi) => {
    const axis = (pi * Math.PI) / 2 + Math.PI / 2;
    const dir = P(Math.cos(axis), Math.sin(axis));
    const gap = (t: number) => (t < 8 ? 0.55 : 0.55 + clamp01((t - 8) / 1.5) * 0.35);
    pieces!.push({ kind: 'rope_line', at: P(c.x - dir.x * 0.4, c.z - dir.z * 0.4), to: P(c.x + dir.x * 0.4, c.z + dir.z * 0.4), height: 1.05 });
    [-1, 1].forEach((side, k) => people.push({
      team: (pi + k) % 4, hat: k ? 'beret' : 'none',
      path: (t) => P(c.x + dir.x * side * gap(t), c.z + dir.z * side * gap(t)),
      face: Math.atan2(-side * dir.z, -side * dir.x),
      stances: [{ t: 0, stance: 'stand' }, { t: 8.3, stance: 'brace' }],
      poses: [{ t: 0, pose: 'work' }, { t: 8, pose: 'pull' }],
      handProp: 'rope',
      labels: pi === 0 && k === 0 ? [{ t: 0, label: 'Atan con nudo llano' }, { t: 8.3, label: 'Se echan atrás: ¿aguanta?' }] : undefined,
    }));
  });
  people.push({ ...LEADER, poses: instructing([2, 9]), labels: [{ t: 0, label: 'Nudo llano o vuelta de escota' }] });
  return { people, pieces, focus: 0 };
}

/** Pelea de gallos: a la pata coja, brazos cruzados, empujando con el hombro. */
function roosterFight(): Activity {
  const bump = (t: number) => Math.sin(t * 2.4) * 0.18 + (t > 13 ? clamp01((t - 13) / 2) * 0.9 : 0);
  const people: PersonSpec[] = [
    { team: 0, role: 'lider', hat: 'beret', path: (t) => P(-0.42 + bump(t) * 0.5, Math.sin(t * 1.1) * 0.25), face: 0, stances: [{ t: 0, stance: 'one_leg' }], poses: pose('crossed'), labels: [{ t: 0, label: 'Pata coja, brazos cruzados' }, { t: 14, label: '¡Ganó el duelo!' }] },
    { team: 2, path: (t) => P(0.42 + bump(t), Math.sin(t * 1.1) * 0.25), face: Math.PI, stances: [{ t: 0, stance: 'one_leg' }, { t: 14.5, stance: 'stand' }], poses: pose('crossed'), labels: [{ t: 14.5, label: 'Apoyó los dos pies' }] },
  ];
  ring(10, 3.4, 0.3).forEach((s, i) => people.push({ team: teamOf(i + 1), path: still(s.x, s.z), face: CENTER, poses: i % 3 === 0 ? [{ t: 0, pose: 'swing' }, { t: 14, pose: 'cheer' }] : pose('swing') }));
  return { people, focus: 0, field: { circle: { center: CENTER, radius: 1.5 } } } as Activity;
}

/** Balones parlantes: el balón vuela de uno a otro mientras se dice una cualidad del compañero. */
function talkingBall(): Activity {
  const N = 10;
  const spots = ring(N, 3.6, Math.PI / 2);
  const order = [0, 4, 7, 2, 8, 5, 1];
  const per = D / (order.length - 1);
  const hand = (i: number) => lerpP(spots[i], CENTER, 0.12);
  const qualities = ['siempre ayuda', 'es muy valiente', 'cocina genial', 'nunca se rinde', 'escucha a todos', 'nos hace reír'];
  return {
    people: spots.map((s, i) => {
      const throwAt = order.indexOf(i) >= 0 && order.indexOf(i) < order.length - 1 ? order.indexOf(i) * per + per - 1 : -1;
      return {
        team: teamOf(i), role: i === 0 ? ('lider' as const) : ('jugador' as const), hat: i % 3 === 0 ? ('beret' as const) : ('none' as const),
        path: still(s.x, s.z), face: CENTER,
        poses: throwAt >= 0 ? [{ t: 0, pose: 'swing' as const }, { t: throwAt - 0.5, pose: 'throw' as const }, { t: throwAt + 0.4, pose: 'swing' as const }] : pose('swing'),
        labels: throwAt >= 0 ? [{ t: throwAt - 0.8, label: `«${(['Lucía', 'Tomás', 'Mía', 'Diego', 'Emma', 'Iker'])[order.indexOf(i) % 6]}, ${qualities[order.indexOf(i) % 6]}»` }, { t: throwAt + 1.5 }] : undefined,
      };
    }),
    items: [{
      kind: 'ball',
      path: (t) => { const k = Math.min(order.length - 2, Math.floor(t / per)); const u = clamp01((t - k * per - (per - 1)) / 1); return lerpP(hand(order[k]), hand(order[k + 1]), u); },
      height: (t) => { const k = Math.min(order.length - 2, Math.floor(t / per)); return arc(t, k * per + per - 1, k * per + per, 1.6, 0.9); },
    }],
    focus: 0,
  };
}

/** Gente a gente: parejas siguen consignas y al grito cambian de pareja. */
function peopleToPeople(): Activity {
  const pairs = ring(6, 3.6, 0.2);
  const people: PersonSpec[] = [{ ...LEADER, poses: instructing([1, 6, 11.5]), labels: [{ t: 1, label: '«¡Espalda con espalda!»' }, { t: 6, label: '«¡Rodilla con rodilla!»' }, { t: 11.5, label: '«¡GENTE A GENTE!»' }] }];
  pairs.forEach((c, pi) => {
    const out = P(c.x * 1.0, c.z * 1.0);
    const tang = P(-Math.sin(Math.atan2(c.z, c.x)), Math.cos(Math.atan2(c.z, c.x)));
    const next = pairs[(pi + 1) % pairs.length];
    [-1, 1].forEach((side, k) => {
      const spot = P(out.x + tang.x * side * 0.32, out.z + tang.z * side * 0.32);
      const dest = k === 0 ? P(next.x + tang.x * -0.32, next.z + tang.z * -0.32) : spot;
      const faceAway = Math.atan2(tang.z * side, tang.x * side);
      people.push({
        team: (pi + k) % 4, hat: k ? 'beret' : 'none',
        path: route([0, spot.x, spot.z], [11.8, spot.x, spot.z], [14, dest.x, dest.z], [D, dest.x, dest.z]),
        face: (t) => (t < 6 ? faceAway : t < 11.8 ? faceAway + Math.PI : t > 14 ? faceAway + Math.PI : undefined),
        stances: [{ t: 0, stance: 'stand' }, { t: 6.3, stance: 'kneel' }, { t: 11.6, stance: 'stand' }],
        poses: [{ t: 0, pose: 'swing' }, { t: 14, pose: 'cheer' }, { t: 15.5, pose: 'swing' }],
      });
    });
  });
  return { people, focus: 1 };
}

/** Pies quietos: la pelota al aire, todos escapan, se congelan y el llamado da 3 saltos para tocar a alguien. */
function freezeBall(): Activity {
  const people: PersonSpec[] = [];
  const outs = ring(9, 4.2, 0.4);
  outs.forEach((o, i) => {
    const near = lerpP(CENTER, o, 0.18);
    const target = i === 4;
    people.push({
      team: teamOf(i), hat: i % 3 === 0 ? 'beret' : 'none',
      path: route([0, near.x, near.z], [2.2, near.x, near.z], [5.2, o.x, o.z], [D, o.x, o.z]),
      face: CENTER, faceWhenStill: true,
      poses: [{ t: 0, pose: 'swing' }, { t: 5.4, pose: 'frozen' }, ...(target ? [{ t: 11.4, pose: 'cheer' as const }] : [])],
      labels: target ? [{ t: 11.4, label: '¡Tocado!' }] : undefined,
    });
  });
  const hit = outs[4];
  const hop = (n: number) => lerpP(P(0, 0.4), hit, n * 0.17);
  people.push({
    team: 1, role: 'lider', hat: 'four_dents', name: 'Llamado',
    path: route([0, 0, 0.4], [4.6, 0, 0.4], [6.2, hop(1).x, hop(1).z], [7.2, hop(1).x, hop(1).z], [8.2, hop(2).x, hop(2).z], [8.8, hop(2).x, hop(2).z], [9.8, hop(3).x, hop(3).z], [D, hop(3).x, hop(3).z]),
    face: faceTo(P(0, 0.4), hit),
    poses: [{ t: 0, pose: 'cheer' }, { t: 5, pose: 'swing' }, { t: 10.2, pose: 'throw' }, { t: 11, pose: 'swing' }],
    labels: [{ t: 0, label: '«¡Número 7!»' }, { t: 4.8, label: '«¡PIES QUIETOS!»' }, { t: 6, label: 'Tres saltos' }, { t: 10.2, label: 'Lanza la pelota' }],
  });
  return {
    people,
    items: [{
      kind: 'ball',
      path: (t) => (t < 10.6 ? P(0, 0.4) : lerpP(hop(3), hit, clamp01((t - 10.6) / 0.8))),
      height: (t) => (t < 4.6 ? arc(t, 0.5, 4.6, 3.5, 1.2) : t < 10.6 ? 1.1 : arc(t, 10.6, 11.4, 0.4, 1.1)),
    }],
    focus: people.length - 1,
  };
}

const ACTIVITIES: Record<string, () => Activity & { field?: object }> = {
  compass_rose_star: compassRoseStar,
  torch_pass: torchPass,
  whistle_signals: whistleSignals,
  badger,
  kick_stool: kickStool,
  compass_rose_swap: compassRoseSwap,
  square_circles: squareCircles,
  rooster_fight: roosterFight,
  talking_ball: talkingBall,
  people_to_people: peopleToPeople,
  freeze_ball: freezeBall,
};

export function createCircleGamesScene(activity?: string | null): GameDefinition {
  if (activity === 'relay_greet_cones') return { ...createRelayScene('greet:cones'), id: 'circle' };
  if (activity === 'relay_safety_circle') return { ...createRelayScene('safety_circle'), id: 'circle' };
  const make = activity ? ACTIVITIES[activity] : undefined;
  return make ? buildFieldScene('circle', make() as Parameters<typeof buildFieldScene>[1]) : createCircleScene();
}

export const CIRCLE_ACTIVITIES = [...Object.keys(ACTIVITIES), 'relay_greet_cones', 'relay_safety_circle'];
