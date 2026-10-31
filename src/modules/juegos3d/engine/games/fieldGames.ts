import { Vec2 } from '../types';
import { keyframePath } from '../tracks';
import { GameDefinition } from './common';
import { Activity, CENTER, P, PersonSpec, buildCornerScene, buildFieldScene, faceTo, instructing, pose, ring, route, still } from './dsl';
import { createChainScene } from './chain';
import { createTerritoryScene } from './territory';
import { createStationScene } from './station';

/**
 * JUEGOS DE CAMPO COMPLETO (cadena, territorio y activos sin elemento focal):
 * cada juego con su coreografía, elegida por la actividad detectada en sus reglas.
 */

const D = 20;
const LEADER: PersonSpec = { team: 4, name: 'Dirigente', role: 'lider', hat: 'four_dents', path: still(0, -6.5), poses: pose('swing') };
const lerpP = (a: Vec2, b: Vec2, u: number) => P(a.x + (b.x - a.x) * u, a.z + (b.z - a.z) * u);
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const arc = (t: number, t0: number, t1: number, peak: number, base = 1.1) => {
  if (t < t0 || t > t1) return base;
  const u = (t - t0) / (t1 - t0);
  return base + 4 * peak * u * (1 - u);
};

// ---------------- Cadena ----------------

/** Cadena de baldes: botellas pasan de mano en mano hasta llenar el recipiente final. */
function bucketChain(): Activity {
  const people: PersonSpec[] = [];
  const N = 10;
  const spot = (i: number) => P(-7 + i * 1.5, i % 2 ? 0.55 : -0.55);
  for (let i = 0; i < N; i++) {
    people.push({ team: i % 2, role: i === 0 ? 'lider' : 'jugador', hat: i % 3 === 0 ? 'beret' : 'none', path: still(spot(i).x, spot(i).z), face: (t) => faceTo(spot(i), spot(Math.min(N - 1, i + 1))) + Math.sin(t * 3 + i) * 0.4, poses: pose('carry') });
  }
  people[0].labels = [{ t: 0, label: 'Línea de extinción: botellas de mano en mano' }];
  const pass = 0.9;
  const items: Activity['items'] = [0, 1, 2].map((b) => ({
    kind: 'water' as const, count: 1,
    path: (t: number) => { const s = (t - b * 4) / pass; if (s < 0) return P(-8, 1.6 + b * 0.3); const i = Math.min(N - 1, Math.floor(s)); return lerpP(spot(i), spot(Math.min(N - 1, i + 1)), clamp01(s - i)); },
    height: (t: number) => ((t - b * 4) / pass >= N - 1 ? -5 : 1.05),
  }));
  return { people, items, pieces: [{ kind: 'bucket', at: P(8.2, 0), count: 1 }, { kind: 'water', at: P(-8, 1.8), count: 4 }], focus: 0 };
}

/** Red de buenas acciones: el ovillo se lanza mientras cada uno cuenta su buena acción; la red sostiene un balón. */
function yarnWeb(): Activity {
  const N = 10;
  const spots = ring(N, 3.6, Math.PI / 2);
  const order = [0, 5, 2, 7, 4, 9, 1, 6, 3, 8];
  const per = 1.8;
  const hand = (i: number) => lerpP(spots[i], CENTER, 0.12);
  return {
    people: spots.map((s, i) => {
      const k = order.indexOf(i);
      return {
        team: i % 4, role: i === 0 ? ('lider' as const) : ('jugador' as const), hat: i % 3 === 0 ? ('beret' as const) : ('none' as const),
        path: still(s.x, s.z), face: CENTER,
        poses: [{ t: 0, pose: 'swing' as const }, { t: k * per, pose: 'throw' as const }, { t: k * per + 0.6, pose: 'hold' as const }],
        labels: [{ t: k * per, label: ['Ayudé a mi abuela', 'Recogí basura del parque', 'Expliqué una tarea', 'Cuidé a mi hermano', 'Regalé mi colación'][k % 5] }, { t: k * per + 1.6 }],
      };
    }),
    items: [
      ...order.slice(0, -1).map((from, k) => ({
        kind: 'rope_line' as const,
        path: () => hand(from),
        to: (t: number) => lerpP(hand(from), hand(order[k + 1]), clamp01((t - k * per - 0.4) / 0.6)),
        height: (t: number) => (t < k * per + 0.4 ? -5 : 1.0),
      })),
      { kind: 'ball', path: still(0, 0), height: (t: number) => (t < 17 ? -5 : 1.12) },
    ],
    focus: 0,
  };
}

/** Nudo humano: manos cruzadas al centro y desenredarse sin soltarse (por equipo, en rincones). */
function humanKnotPatrol(): Activity {
  const r = (t: number) => 0.42 + clamp01((t - 5) / 12) * 0.62;
  return {
    people: [0, 1, 2, 3, 4].map((i) => ({
      role: i === 0 ? ('lider' as const) : ('jugador' as const), hat: i === 0 ? ('four_dents' as const) : ('none' as const),
      blindfold: false,
      path: (t: number) => { const a = (i / 5) * Math.PI * 2 + Math.sin(t * 0.6 + i * 2) * clamp01((t - 4) / 3) * (1 - clamp01((t - 16) / 2)) * 0.9; return P(Math.cos(a) * r(t), Math.sin(a) * r(t)); },
      face: CENTER,
      stances: [{ t: 0, stance: 'stand' as const }, { t: 8 + i, stance: 'squat' as const }, { t: 9.5 + i, stance: 'stand' as const }],
      poses: [{ t: 0, pose: 'tag' as const }, { t: 17, pose: 'frozen' as const }],
      labels: i === 0 ? [{ t: 0, label: 'Ojos cerrados: tomar dos manos' }, { t: 5, label: 'Desenredarse sin soltarse' }, { t: 17, label: '¡Un círculo!' }] : undefined,
    })),
  };
}

/** Nudo humano de toda la tropa (10 personas) en el centro del campo. */
function humanKnotTroop(): Activity {
  const N = 10;
  const r = (t: number) => 0.7 + clamp01((t - 4) / 13) * 1.9;
  return {
    people: Array.from({ length: N }, (_, i) => ({
      team: i % 4, role: i === 0 ? ('lider' as const) : ('jugador' as const), hat: i % 4 === 0 ? ('beret' as const) : ('none' as const),
      path: (t: number) => { const a = (i / N) * Math.PI * 2 + Math.sin(t * 0.5 + i * 1.7) * clamp01((t - 3) / 3) * (1 - clamp01((t - 16) / 2)) * 0.6; return P(Math.cos(a) * r(t), Math.sin(a) * r(t)); },
      face: CENTER,
      stances: [{ t: 0, stance: 'stand' as const }, { t: 6 + (i % 5) * 1.6, stance: 'squat' as const }, { t: 7.4 + (i % 5) * 1.6, stance: 'stand' as const }],
      poses: [{ t: 0, pose: 'tag' as const }, { t: 17, pose: 'frozen' as const }],
      labels: i === 0 ? [{ t: 0, label: 'Manos cruzadas al centro' }, { t: 6, label: 'Girar y pasar por debajo' }, { t: 17, label: '¡Círculo desenredado!' }] : undefined,
    })),
    focus: 0,
  };
}

/** Barcas humanas: sentados tomando los tobillos del de atrás, avanzan remando al unísono. */
function humanBoats(): Activity {
  const people: PersonSpec[] = [];
  [-4.5, -1.5, 1.5, 4.5].forEach((z, ti) => {
    const pace = 0.32 + ti * 0.03;
    const s = (t: number) => -7 + Math.max(0, t - 1.5) * pace + Math.sin(t * 4.2) * 0.06;
    for (let k = 0; k < 5; k++) {
      people.push({
        team: ti, role: k === 0 ? 'lider' : 'jugador', hat: k === 0 ? 'beret' : 'none',
        path: (t) => P(s(t) - k * 0.75, z), face: 0,
        stances: [{ t: 0, stance: 'sit' }], poses: pose(k === 0 ? 'cheer' : 'behind'),
        labels: k === 0 && ti === 1 ? [{ t: 0, label: '¡Remar a la vez: uno, dos!' }] : undefined,
      });
    }
  });
  return { people, focus: 5, pieces: [{ kind: 'rope_line', at: P(1.5, -6), to: P(1.5, 6), height: 0.02 }] };
}

// ---------------- Territorio ----------------

/** Bulldog inglés: la tropa cruza de lado a lado; los tocados se vuelven bulldogs. */
function bulldog(): Activity {
  const N = 10;
  const caught1 = [2, 7];
  const caught2 = [4, 9, 0];
  const people: PersonSpec[] = [{
    team: 1, name: 'Bulldog', role: 'lider', hat: 'four_dents',
    path: route([0, 0, 0], [2.5, 0, 0], [4, -0.6, -2.4], [5, -0.6, -2.4], [9, 0, 0], [12, 0, 0], [13.5, 0.8, 1.6], [D, 0.8, 1.6]),
    poses: [{ t: 0, pose: 'frozen' }, { t: 3.6, pose: 'tag' }, { t: 5, pose: 'frozen' }, { t: 13.2, pose: 'tag' }, { t: 14, pose: 'frozen' }],
    labels: [{ t: 0, label: 'Bulldog en el centro' }, { t: 9, label: 'Ahora son 3 bulldogs' }],
  }];
  for (let i = 0; i < N; i++) {
    const z = -4 + i * 0.9;
    const c1 = caught1.includes(i), c2 = caught2.includes(i);
    const keys: [number, number, number][] = [[0, -8, z], [2, -8, z]];
    if (c1) keys.push([4, -0.8, z * 0.6], [5, -0.8, z * 0.6], [9, (i - 4) * 0.5, -1 + (i % 3)], [D, (i - 4) * 0.5, -1 + (i % 3)]);
    else {
      keys.push([6.6, 8, z], [11, 8, z]);
      if (c2) keys.push([13.6, 1, z * 0.5], [D, 1, z * 0.5]);
      else keys.push([15.6, -8, z], [D, -8, z]);
    }
    people.push({
      team: i % 4, hat: i % 3 === 0 ? 'beret' : 'none', path: route(...keys), face: (t) => (t < 2 || (t > 5.6 && t < 11) ? (t < 2 ? 0 : Math.PI) : undefined),
      poses: c1 ? [{ t: 0, pose: 'swing' }, { t: 4.2, pose: 'frozen' }] : c2 ? [{ t: 0, pose: 'swing' }, { t: 13.6, pose: 'frozen' }] : pose('swing'),
      labels: c1 ? [{ t: 4.2, label: '¡Tocado! Ahora es bulldog' }, { t: 7 }] : undefined,
    });
  }
  return { people, focus: 0, field: { width: 20, depth: 12, midline: false } } as Activity;
}

/** Cribol: pases rápidos sin caminar con el balón, punto al embocar en el trípode. */
function cribol(): Activity {
  const A = [P(-6, -2.5), P(-3, 2), P(-0.5, -1.5), P(2.5, 1.5)];
  const B = [P(-4, 0.5), P(0, 2.6), P(1.5, -2.4), P(5, -0.5)];
  const passes = [A[0], A[1], A[2], A[3], P(7.6, 0)];
  const per = 3.2;
  const people: PersonSpec[] = [
    ...A.map((p, i) => ({ team: 0, role: i === 0 ? ('lider' as const) : ('jugador' as const), hat: i === 0 ? ('beret' as const) : ('none' as const), path: (t: number) => P(p.x + Math.sin(t * 0.7 + i) * 0.25, p.z + Math.cos(t * 0.6 + i) * 0.25), face: 0, poses: [{ t: 0, pose: 'swing' as const }, { t: i * per + per - 0.8, pose: 'throw' as const }, { t: i * per + per, pose: 'swing' as const }], labels: i === 0 ? [{ t: 0, label: 'Sin caminar con el balón' }] : i === 3 ? [{ t: 12, label: '¡Embocó en el trípode!' }] : undefined })),
    ...B.map((p, i) => ({ team: 1, hat: i === 0 ? ('beret' as const) : ('none' as const), path: (t: number) => { const ball = passes[Math.min(4, Math.floor(t / per) + 1)]; return lerpP(p, ball, 0.18 + Math.sin(t + i) * 0.05); }, face: Math.PI, poses: pose('frozen' as const) })),
    { ...LEADER, name: 'Árbitro', path: still(0, -4.5), poses: instructing([12.4]), labels: [{ t: 0, label: 'Arbitraje por consenso' }] },
  ];
  return {
    people,
    pieces: [{ kind: 'tripod_goal', at: P(8, 0) }, { kind: 'tripod_goal', at: P(-8, 0) }],
    items: [{ kind: 'ball', path: (t) => { const k = Math.min(3, Math.floor(t / per)); return lerpP(passes[k], passes[k + 1], clamp01((t - k * per - (per - 0.8)) / 0.8)); }, height: (t) => { const k = Math.min(3, Math.floor(t / per)); return arc(t, k * per + per - 0.8, k * per + per, k === 3 ? 1.2 : 0.8, 1.05); } }],
    focus: 0,
  };
}

/** Conquista del círculo: manos a la espalda, fintas y hombro para sacar a los rivales. */
function circleConquest(): Activity {
  const N = 8;
  const out = [3, 6];
  return {
    people: Array.from({ length: N }, (_, i) => {
      const base = (i / N) * Math.PI * 2;
      const pushed = out.indexOf(i);
      return {
        team: i % 4, role: i === 0 ? ('lider' as const) : ('jugador' as const), hat: i % 3 === 0 ? ('beret' as const) : ('none' as const),
        path: (t: number) => {
          const a = base + t * 0.25 * (i % 2 ? 1 : -1) + Math.sin(t * 1.3 + i) * 0.4;
          const leave = pushed >= 0 ? clamp01((t - (8 + pushed * 5)) / 1.2) : 0;
          const r = 1.4 + Math.sin(t * 0.9 + i * 1.7) * 0.7 + leave * 2.8;
          return P(Math.cos(a) * r, Math.sin(a) * r);
        },
        poses: pose('behind' as const),
        labels: pushed >= 0 ? [{ t: 8 + pushed * 5, label: '¡Pisó fuera del límite!' }, { t: 11 + pushed * 5 }] : i === 0 ? [{ t: 0, label: 'Hombro y fintas, manos atrás' }] : undefined,
      };
    }),
    focus: 0,
    field: { width: 16, depth: 16, circle: { center: CENTER, radius: 4.4 } },
  } as Activity;
}

// ---------------- Activos sin elemento focal ----------------

/** Barcos en la niebla: filas vendadas guiadas al muelle por el sonido de su timonel. */
function fogBoats(): Activity {
  const people: PersonSpec[] = [];
  const docks = [P(8, -4), P(8, 0), P(8, 4)];
  docks.forEach((dock, ti) => {
    const start = P(-8, (ti - 1) * 4.5);
    const mid = P(-1, start.z + (ti - 1) * -2.2);
    people.push({ team: ti, name: 'Timonel', role: 'lider', hat: 'four_dents', path: still(dock.x + 0.8, dock.z), face: Math.PI, poses: [0, 3, 6, 9, 12, 15].flatMap((t) => [{ t: t + ti * 0.6, pose: 'cheer' as const }, { t: t + ti * 0.6 + 0.8, pose: 'swing' as const }]), handProp: 'whistle', labels: [{ t: 0, label: ['¡Uuu-uh!', '¡Kraa-kraa!', '¡Fiu-fiu!'][ti] }] });
    for (let k = 0; k < 3; k++) {
      const lead = keyframePath([{ t: 0, ...start }, { t: 2, ...start }, { t: 9, ...mid }, { t: 17, ...P(dock.x - 0.5, dock.z) }, { t: D, ...P(dock.x - 0.5, dock.z) }]);
      people.push({
        team: ti, blindfold: true, hat: k === 2 ? 'beret' : 'none',
        // Cada barco de la fila sigue al de adelante con un pequeño retraso
        path: (t) => lead(Math.max(0, t - k * 0.6)),
        poses: pose(k === 0 ? 'tag' : 'shoulders'),
        labels: k === 0 && ti === 1 ? [{ t: 2, label: 'Barco vendado: sigue el sonido' }, { t: 17, label: '¡Atracó sin chocar!' }] : undefined,
      });
    }
  });
  return { people, pieces: docks.map((d) => ({ kind: 'post' as const, at: P(d.x + 0.3, d.z) })), focus: 4 };
}

/** Atrapando la cola: serpientes agarradas por la cintura; la cabeza intenta quitar la cola de otra. */
function tailSnakes(): Activity {
  const people: PersonSpec[] = [];
  const heads = [
    (t: number) => P(Math.cos(t * 0.45) * 5, Math.sin(t * 0.9) * 3),
    (t: number) => P(Math.cos(t * 0.45 + 2.1) * 5, Math.sin(t * 0.9 + 4.2) * 3),
    (t: number) => P(Math.cos(t * 0.45 + 4.2) * 5, Math.sin(t * 0.9 + 2.1) * 3),
  ];
  heads.forEach((head, ti) => {
    for (let k = 0; k < 4; k++) {
      people.push({
        team: ti, role: k === 0 ? 'lider' : 'jugador', hat: k === 0 ? 'beret' : 'none',
        path: (t) => head(Math.max(0, t - k * 0.55)),
        poses: pose(k === 0 ? 'tag' : 'shoulders'),
        labels: k === 0 ? [{ t: 0, label: 'Cabeza: busca la cola rival' }] : k === 3 ? [{ t: 0, label: 'Cola: pañoleta en el bolsillo' }] : undefined,
      });
    }
  });
  return { people, focus: 0 };
}

const FIELD: Record<string, () => Activity> = {
  bucket_chain: bucketChain,
  yarn_web: yarnWeb,
  human_knot_troop: humanKnotTroop,
  human_boats: humanBoats,
  bulldog,
  cribol,
  circle_conquest: circleConquest,
  fog_boats: fogBoats,
  tail_snakes: tailSnakes,
};

export function createFieldGamesScene(scene: 'chain' | 'territory' | 'station', activity?: string | null): GameDefinition {
  if (activity === 'human_knot') return buildCornerScene(scene, humanKnotPatrol());
  const make = activity ? FIELD[activity] : undefined;
  if (make) return buildFieldScene(scene, make() as Parameters<typeof buildFieldScene>[1]);
  return scene === 'chain' ? createChainScene() : scene === 'territory' ? createTerritoryScene() : createStationScene();
}

export const FIELD_ACTIVITIES = [...Object.keys(FIELD), 'human_knot'];
