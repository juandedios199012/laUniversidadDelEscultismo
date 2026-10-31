import { ArmPose, SetPiece, Stance, Vec2 } from '../types';
import { buildTrack, keyframePath, labelTimeline, poseTimeline } from '../tracks';
import { CompetitorScript, GameDefinition, appearance } from './common';
import { CORNER_TREES, LocalKey, NAMES, TEAMS } from './corners';
import { Activity, buildCornerScene } from './dsl';
import { createWorkshopScene } from './workshop';

/**
 * PRUEBAS DE FUERZA Y CUERDAS — la mecánica concreta viene de las reglas (`activity` del catálogo):
 *  hang_load (peso colgado), hang_backpacks (colgar mochilas), queen_chair (silla de la reina),
 *  human_bridge (puente humano), drag_weight (arrastrar un peso), tightrope (reparar soga tensa),
 *  backpack_fit (ajustar una mochila), knot_together (nudo entre todos), staff_twist (pulseada con bordón),
 *  tug_cross (cinchada en cruz de 4 equipos, en todo el campo).
 * Cada mecánica es una especificación de datos (ver dsl.ts) en coordenadas locales de un rincón;
 * buildCornerScene la replica en los 4 rincones. La cinchada en cruz usa todo el campo.
 */

const DURATION = 20;

const still = (x: number, z: number): LocalKey[] => [{ t: 0, x, z }, { t: DURATION, x, z }];
const P = (x: number, z: number): Vec2 => ({ x, z });
const CENTER = P(0, 0);
/** Ida y vuelta entre dos puntos con pausas en los extremos (para tirar, cargar, cruzar). */
const shuttle = (a: Vec2, b: Vec2, t0: number, t1: number, t2: number, t3: number): LocalKey[] => [
  { t: 0, ...a }, { t: t0, ...a }, { t: t1, ...b }, { t: t2, ...b }, { t: t3, ...a }, { t: DURATION, ...a },
];
const instructing = (times: number[]): { t: number; pose: ArmPose }[] => [
  { t: 0, pose: 'swing' }, ...times.flatMap((t) => [{ t, pose: 'tag' as const }, { t: t + 1.4, pose: 'swing' as const }]),
];

const MECHANICS: Record<string, Activity> = {
  // Colgar mochilas de la tijera para que no toquen el suelo
  hang_backpacks: {
    focal: 'stress_test_rig',
    people: [
      { role: 'lider', hat: 'four_dents', path: still(0.3, 2.2), face: CENTER, poses: instructing([4, 12]), labels: [{ t: 0, label: 'Mochilas fuera del suelo' }, { t: 10, label: 'Revisen que el amarre no ceda' }] },
      { path: still(-0.98, 0.32), face: P(-0.55, 0), poses: [{ t: 0, pose: 'hold' }] },
      { path: still(0.98, 0.32), face: P(0.55, 0), poses: [{ t: 0, pose: 'hold' }] },
      { path: [{ t: 0, x: -1.8, z: 1.6 }, { t: 2, x: -1.8, z: 1.6 }, { t: 6, x: -0.3, z: 0.45 }, { t: 9, x: -0.3, z: 0.45 }, { t: 12, x: -1.8, z: 1.6 }, { t: DURATION, x: -1.8, z: 1.6 }], face: CENTER, faceWhenStill: true, poses: [{ t: 0, pose: 'carry' }, { t: 6, pose: 'hold' }, { t: 9, pose: 'swing' }] },
      { path: [{ t: 0, x: 1.8, z: 1.6 }, { t: 9, x: 1.8, z: 1.6 }, { t: 13, x: 0.3, z: 0.45 }, { t: 16, x: 0.3, z: 0.45 }, { t: DURATION, x: 1.8, z: 1.6 }], face: CENTER, faceWhenStill: true, poses: [{ t: 0, pose: 'carry' }, { t: 13, pose: 'hold' }, { t: 16, pose: 'swing' }] },
    ],
    items: [
      { kind: 'backpack', path: [{ t: 0, x: -1.7, z: 1.4 }, { t: 2, x: -1.7, z: 1.4 }, { t: 6, x: -0.2, z: 0.15 }, { t: DURATION, x: -0.2, z: 0.15 }], height: 0.7 },
      { kind: 'backpack', path: [{ t: 0, x: 1.7, z: 1.4 }, { t: 9, x: 1.7, z: 1.4 }, { t: 13, x: 0.2, z: 0.15 }, { t: DURATION, x: 0.2, z: 0.15 }], height: 0.7 },
    ],
  },

  // Silla de cuatro manos: dos cargan a un compañero sentado sorteando conos
  queen_chair: {
    pieces: [{ kind: 'cone', at: P(-0.9, -0.3) }, { kind: 'cone', at: P(0.9, 0.6) }, { kind: 'cone', at: P(-0.9, 1.5) }],
    people: [
      { path: shuttle(P(-0.32, -1.8), P(-0.32, 1.8), 3, 10, 12, 19), poses: [{ t: 0, pose: 'chair' }] },
      { path: shuttle(P(0.32, -1.8), P(0.32, 1.8), 3, 10, 12, 19), poses: [{ t: 0, pose: 'chair' }] },
      { path: shuttle(P(0, -1.75), P(0, 1.85), 3, 10, 12, 19), stances: [{ t: 0, stance: 'ride' }], poses: [{ t: 0, pose: 'frozen' }], hat: 'beret', labels: [{ t: 0, label: 'Va sentado en la silla' }] },
      { role: 'lider', hat: 'four_dents', path: shuttle(P(1.4, -1.6), P(1.4, 1.6), 3, 10, 12, 19), poses: instructing([5, 14]), labels: [{ t: 0, label: 'Muñecas entrelazadas' }, { t: 6, label: 'Paso seguro, sin correr' }] },
      { path: still(-1.6, 2.3), face: CENTER, poses: [{ t: 0, pose: 'swing' }], labels: [{ t: 0, label: 'Espera su turno' }] },
    ],
  },

  // Dos filas con brazos entrelazados y un compañero que cruza por encima
  human_bridge: {
    people: [
      { role: 'lider', hat: 'four_dents', path: still(-0.42, -0.6), face: 0, poses: [{ t: 0, pose: 'shoulders' }], labels: [{ t: 0, label: 'Cantan el lema de solidaridad' }] },
      { path: still(0.42, -0.6), face: Math.PI, poses: [{ t: 0, pose: 'shoulders' }] },
      { path: still(-0.42, 0.45), face: 0, poses: [{ t: 0, pose: 'shoulders' }] },
      { path: still(0.42, 0.45), face: Math.PI, poses: [{ t: 0, pose: 'shoulders' }] },
      {
        hat: 'beret',
        path: [{ t: 0, x: 0, z: -2.1 }, { t: 2.5, x: 0, z: -2.1 }, { t: 4, x: 0, z: -1.5 }, { t: 13, x: 0, z: 1.2 }, { t: 14.5, x: 0, z: 2.0 }, { t: DURATION, x: 0, z: 2.0 }],
        face: Math.PI / 2,
        stances: [{ t: 0, stance: 'stand' }, { t: 3.6, stance: 'prone' }, { t: 13.6, stance: 'stand' }],
        poses: [{ t: 0, pose: 'swing' }, { t: 3.6, pose: 'frozen' }, { t: 13.6, pose: 'cheer' }],
        labels: [{ t: 0, label: 'Se prepara para cruzar' }, { t: 4, label: 'Cruza sobre los brazos' }, { t: 14, label: '¡Lo sostuvo la comunidad!' }],
      },
    ],
  },

  // Arrastrar un peso con la cuerda mojada (prueba de tracción)
  drag_weight: {
    pieces: [{ kind: 'bucket', at: P(1.4, -1.4), count: 1 }, { kind: 'rope_line', at: P(0, -1.7), to: P(0, 2.4), height: 0.45 }],
    items: [{ kind: 'water', path: [{ t: 0, x: 0, z: -1.8 }, { t: 3, x: 0, z: -1.8 }, { t: 15, x: 0, z: -0.2 }, { t: DURATION, x: 0, z: -0.2 }], count: 1 }],
    people: [
      ...[0.3, 0.95, 1.6].map((z, i) => ({
        path: [{ t: 0, x: 0.12 * (i % 2 ? 1 : -1), z }, { t: 3, x: 0.12 * (i % 2 ? 1 : -1), z }, { t: 15, x: 0.12 * (i % 2 ? 1 : -1), z: z + 1.6 }, { t: DURATION, x: 0.12 * (i % 2 ? 1 : -1), z: z + 1.6 }],
        face: -Math.PI / 2, stances: [{ t: 0, stance: 'brace' as Stance }], poses: [{ t: 0, pose: 'pull' as ArmPose }],
      })),
      { role: 'lider', hat: 'four_dents', path: still(1.3, 0.4), face: P(0, -1), poses: instructing([4, 11]), labels: [{ t: 0, label: 'Cuerda mojada: ¿aguanta el nudo pescador?' }, { t: 9, label: '¡Tiren parejo!' }] },
      { path: still(-1.3, -1.2), face: P(0, -1.6), stances: [{ t: 0, stance: 'squat' }], poses: [{ t: 0, pose: 'work' }], handProp: 'rope', labels: [{ t: 0, label: 'Revisa el nudo' }] },
    ],
  },

  // Soga tensa entre dos postes: reforzar el tramo dañado con nudo Margarita
  tightrope: {
    pieces: [
      { kind: 'post', at: P(-1.8, 0) }, { kind: 'post', at: P(1.8, 0) },
      { kind: 'rope_line', at: P(-1.8, 0), to: P(1.8, 0), height: 1.0 },
    ],
    people: [
      { path: still(-0.25, 0.42), face: P(-0.25, 0), poses: [{ t: 0, pose: 'work' }], handProp: 'rope' },
      { path: still(0.35, 0.42), face: P(0.35, 0), poses: [{ t: 0, pose: 'work' }] },
      { path: still(-2.15, 0.35), face: P(-1.8, 0), poses: [{ t: 0, pose: 'hold' }] },
      { path: still(2.3, 0), face: Math.PI, stances: [{ t: 0, stance: 'brace' }], poses: [{ t: 0, pose: 'pull' }], labels: [{ t: 0, label: 'Mantiene la tensión' }] },
      { role: 'lider', hat: 'four_dents', path: still(0, 1.7), face: CENTER, poses: instructing([3, 11]), labels: [{ t: 0, label: 'Nudo Margarita en el tramo gastado' }, { t: 10, label: 'Línea de seguridad reforzada' }] },
    ],
  },

  // Ajustar cinturón lumbar y correas de la mochila de un compañero
  backpack_fit: {
    people: [
      { path: still(0, 0.2), face: Math.PI / 2, poses: [{ t: 0, pose: 'swing' }], wearsBackpack: true, hat: 'beret', labels: [{ t: 0, label: 'Lleva la mochila cargada' }] },
      { path: still(0, -0.45), face: Math.PI / 2, poses: [{ t: 0, pose: 'work' }], labels: [{ t: 0, label: 'Ajusta correas y cinturón' }] },
      { path: still(-1.1, 0.9), face: CENTER, poses: [{ t: 0, pose: 'measure' }], handProp: 'notebook' },
      { path: still(1.1, 0.9), face: CENTER, poses: [{ t: 0, pose: 'swing' }] },
      { role: 'lider', hat: 'four_dents', path: still(0.9, -1.2), face: CENTER, poses: instructing([4, 12]), labels: [{ t: 0, label: 'El peso debe caer en la cadera' }, { t: 11, label: 'Correas firmes, sin apretar' }] },
    ],
  },

  // Un nudo llano entre todos, cada uno con una sola mano
  knot_together: {
    items: [{ kind: 'rope', path: still(0, 0), height: 0.95, rotation: (t) => t * 0.6, count: 1 }],
    people: [0, 1, 2, 3, 4].map((i) => {
      const a = (i / 5) * Math.PI * 2;
      return {
        role: i === 0 ? ('lider' as const) : undefined,
        hat: i === 0 ? ('four_dents' as const) : undefined,
        path: still(Math.cos(a) * 0.62, Math.sin(a) * 0.62),
        face: CENTER,
        poses: [{ t: 0, pose: 'tag' as ArmPose }],
        labels: i === 0 ? [{ t: 0, label: 'Una mano cada uno' }, { t: 9, label: 'Nudo llano entre todos' }] : undefined,
      };
    }),
  },

  // Pulseada con bordón: dos frente a frente tratan de girar la vara o desequilibrar al otro
  staff_twist: {
    items: [{ kind: 'staff', path: [{ t: 0, x: 0, z: 0 }, { t: 4, x: 0.25, z: 0 }, { t: 7, x: -0.2, z: 0 }, { t: 11, x: 0.3, z: 0 }, { t: 15, x: -0.3, z: 0 }, { t: DURATION, x: 0, z: 0 }], height: 0.95, rotation: (t) => Math.PI / 2 + Math.sin(t * 1.3) * 0.45, count: 1 }],
    people: [
      { path: [{ t: 0, x: -0.55, z: 0 }, { t: 4, x: -0.3, z: 0 }, { t: 7, x: -0.75, z: 0 }, { t: 11, x: -0.25, z: 0 }, { t: 15, x: -0.85, z: 0 }, { t: DURATION, x: -0.55, z: 0 }], face: 0, stances: [{ t: 0, stance: 'brace' }], poses: [{ t: 0, pose: 'pull' }] },
      { path: [{ t: 0, x: 0.55, z: 0 }, { t: 4, x: 0.8, z: 0 }, { t: 7, x: 0.35, z: 0 }, { t: 11, x: 0.85, z: 0 }, { t: 15, x: 0.25, z: 0 }, { t: DURATION, x: 0.55, z: 0 }], face: Math.PI, stances: [{ t: 0, stance: 'brace' }], poses: [{ t: 0, pose: 'pull' }], hat: 'beret' },
      { role: 'lider', hat: 'four_dents', path: still(0, 1.3), face: CENTER, poses: instructing([3, 12]), labels: [{ t: 0, label: 'Juez: ¿quién pierde el equilibrio?' }, { t: 12, label: 'Juego limpio, sin soltar de golpe' }] },
      { path: still(-1.3, 1.5), face: CENTER, poses: [{ t: 0, pose: 'swing' }] },
      { path: still(1.3, 1.5), face: CENTER, poses: [{ t: 0, pose: 'swing' }] },
    ],
  },
};

/** Cinchada en cruz: 4 equipos tiran de los extremos de una cruz de cuerdas para embocar la pesa en su recipiente. */
function createTugCross(): GameDefinition {
  const duration = 20;
  const ARMS = [0, Math.PI / 2, Math.PI, 1.5 * Math.PI];
  // La pesa del centro se mueve según qué equipo va ganando
  const weightPath = keyframePath([
    { t: 0, x: 0, z: 0 }, { t: 3, x: 0, z: 0 }, { t: 7, x: 0.7, z: -0.3 }, { t: 10, x: 0.2, z: 0.6 },
    { t: 14, x: 1.4, z: 1.2 }, { t: 16, x: 1.6, z: 1.6 }, { t: duration, x: 1.6, z: 1.6 },
  ]);
  const competitors: CompetitorScript[] = [];
  TEAMS.forEach((team, ti) => {
    const a = ARMS[ti];
    const dir = { x: Math.cos(a), z: Math.sin(a) };
    [0, 1, 2, 3].forEach((k) => {
      const base = 4.4 + k * 0.85;
      const side = (k % 2 ? 1 : -1) * 0.18;
      const at = (t: number) => {
        const w = weightPath(t);
        // El equipo retrocede cuando la pesa se acerca a su lado y avanza cuando se aleja
        const pull = (w.x * dir.x + w.z * dir.z) * 0.6 + Math.sin(t * 2.1 + ti) * 0.08;
        const d = base + pull;
        return { x: dir.x * d - dir.z * side, z: dir.z * d + dir.x * side };
      };
      competitors.push({
        appearance: appearance(ti * 4 + k + 2, {
          id: `tug_${ti}_${k}`, name: NAMES[ti][k], role: k === 3 ? 'lider' : 'jugador', hatType: k === 3 ? 'four_dents' : k === 1 ? 'beret' : 'none', ...team,
        }),
        track: buildTrack(at, duration, { face: () => a + Math.PI, maxTurnRate: 6 }),
        pose: poseTimeline([{ t: 0, pose: 'pull' }]),
        stance: 'brace',
        label: k === 3 ? labelTimeline([{ t: 0, label: 'Tracción coordinada' }, { t: 14, label: ti === 0 ? '¡Embocamos la pesa!' : 'Casi…' }]) : undefined,
      });
    });
  });
  const buckets: SetPiece[] = [0, 1, 2, 3].map((i) => {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    return { kind: 'bucket', pos: { x: Math.cos(a) * 2.3, z: Math.sin(a) * 2.3 }, count: 1 };
  });
  return {
    id: 'station_stress_test_rig',
    duration,
    focusId: 'tug_0_3',
    field: {
      width: 20, depth: 20, midline: false, zones: [], trees: CORNER_TREES,
      setPieces: [
        { kind: 'rope_line', pos: { x: -8, z: 0 }, to: { x: 8, z: 0 }, height: 0.85 },
        { kind: 'rope_line', pos: { x: 0, z: -8 }, to: { x: 0, z: 8 }, height: 0.85 },
        ...buckets,
      ],
    },
    competitors,
    flags: () => [],
    items: (t) => [{ id: 'tug_weight', kind: 'weight', pos: weightPath(t), height: 0.55, rotation: t * 0.3 }],
  };
}

export function createRigScene(activity?: string): GameDefinition {
  if (!activity || activity === 'hang_load') return createWorkshopScene('stress_test_rig');
  if (activity === 'tug_cross') return createTugCross();
  return buildCornerScene('station_stress_test_rig', MECHANICS[activity] ?? MECHANICS.hang_backpacks);
}
