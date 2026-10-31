import { ArmPose, FieldProp, FocalProp, HandProp, HatType, Stance, Vec2 } from '../types';
import { buildTrack, keyframePath, labelTimeline, poseTimeline } from '../tracks';
import { CompetitorScript, GameDefinition, appearance } from './common';
import { CORNER_TREES, LocalKey, NAMES, TEAMS, corner, cornerZones, isStill } from './corners';

/**
 * TALLER CON ELEMENTO FOCAL — 4 rincones, uno por equipo, todos con el mismo objeto central
 * (`focal_prop` del catálogo) y posturas acordes:
 *  - de suelo (mosaico, bombas de semillas): rodilla en tierra, cuclillas o sentados, con piedras y ramitas;
 *  - de altura o tensión (prueba de carga, trípode, carpa): dos de pie sosteniendo maderos, uno en
 *    cuclillas revisando la cuerda y el líder dando instrucciones;
 *  - de mesa (cartografía): semicírculo sentado con libreta, lápiz y brújula;
 *  - de rescate (camilla): paciente en reposo y vendadores activos;
 *  - fogata: varas de pan de cazador sobre las brasas y alguien que trae leña.
 * Cada rincón se define en coordenadas locales (su eje +z mira al centro del campo).
 */

const DURATION = 20;

interface PersonSpec {
  role: 'lider' | 'jugador';
  stance?: Stance;
  poses: { t: number; pose: ArmPose }[];
  handProp?: HandProp;
  hat?: HatType;
  path: LocalKey[];
  /** Hacia dónde mira en reposo (coordenadas locales): un ángulo o un punto. */
  face?: number | Vec2;
  labels?: { t: number; label?: string }[];
}

interface Layout {
  people: PersonSpec[];
  /** Índice de la persona que sigue la cámara "Seguir acción" (en el rincón 1). */
  focus: number;
}

const at = (x: number, z: number): LocalKey[] => [{ t: 0, x, z }, { t: DURATION, x, z }];
const CENTER: Vec2 = { x: 0, z: 0 };
const working = (handProp?: HandProp): Pick<PersonSpec, 'poses' | 'handProp'> => ({ poses: [{ t: 0, pose: 'work' }], handProp });
/** Líder que da instrucciones señalando cada cierto tiempo. */
const instructing = (times: number[]): { t: number; pose: ArmPose }[] => [
  { t: 0, pose: 'swing' },
  ...times.flatMap((t) => [{ t, pose: 'tag' as const }, { t: t + 1.4, pose: 'swing' as const }]),
];

const LAYOUTS: Record<FocalProp, Layout> = {
  // Figura en el césped con hojas, piedras y ramitas
  ground_mosaic: {
    focus: 0,
    people: [
      {
        role: 'lider', hat: 'four_dents', poses: instructing([5, 13]),
        path: [{ t: 0, x: -1.9, z: -1.2 }, { t: 3, x: -1.9, z: -1.2 }, { t: 7, x: -1.6, z: 1.6 }, { t: 10.5, x: -1.6, z: 1.6 }, { t: 14, x: 1.9, z: -1.4 }, { t: 17, x: 1.9, z: -1.4 }, { t: DURATION, x: -1.9, z: -1.2 }],
        face: CENTER,
        labels: [{ t: 0, label: 'Traza la figura con material natural' }, { t: 7, label: 'Más hojas en el pétalo derecho' }, { t: 14, label: 'Sin arrancar plantas vivas' }],
      },
      { role: 'jugador', stance: 'kneel', ...working('stone'), hat: 'beret', path: at(1.1, 0.35), face: { x: 0.5, z: 0.35 } },
      { role: 'jugador', stance: 'kneel_both', ...working('twig'), path: at(-1.1, 0.15), face: { x: -0.5, z: 0.2 } },
      { role: 'jugador', stance: 'squat', ...working('stone'), path: at(0.25, -1.45), face: { x: 0.15, z: -0.8 } },
      {
        // Trae hojas del canasto hacia la figura
        role: 'jugador', ...working('twig'),
        path: [{ t: 0, x: 1.6, z: 1.3 }, { t: 2.5, x: 1.6, z: 1.3 }, { t: 5, x: 0.6, z: 1.25 }, { t: 9, x: 0.6, z: 1.25 }, { t: 11.5, x: 1.6, z: 1.3 }, { t: 14, x: 1.6, z: 1.3 }, { t: 16.5, x: 0.6, z: 1.25 }, { t: DURATION, x: 0.6, z: 1.25 }],
        face: { x: 0.3, z: 0.6 },
      },
    ],
  },

  // Tijera de dos leños con mochila de 15 kg colgando
  stress_test_rig: {
    focus: 0,
    people: [
      {
        role: 'lider', hat: 'four_dents', poses: instructing([3, 9, 15]), path: at(0.3, 2.2), face: CENTER,
        labels: [{ t: 0, label: 'Carga de 15 kg: ¿resiste el amarre?' }, { t: 8, label: 'Revisen que la cuerda no se deslice' }, { t: 15, label: '¡Amarre firme! Prueba superada' }],
      },
      { role: 'jugador', poses: [{ t: 0, pose: 'hold' }], hat: 'beret', path: at(-0.98, 0.32), face: { x: -0.55, z: 0 } },
      { role: 'jugador', poses: [{ t: 0, pose: 'hold' }], path: at(0.98, 0.32), face: { x: 0.55, z: 0 } },
      { role: 'jugador', stance: 'squat', ...working('rope'), path: at(0.2, 0.62), face: CENTER },
      { role: 'jugador', poses: [{ t: 0, pose: 'measure' }], handProp: 'notebook', path: at(-1.55, 1.35), face: CENTER },
    ],
  },

  // Trípode amarrado con vientos a estacas
  pioneering_tripod: {
    focus: 0,
    people: [
      {
        role: 'lider', hat: 'four_dents', poses: instructing([8.6]),
        path: [{ t: 0, x: -1.7, z: 1.3 }, { t: 3, x: -1.7, z: 1.3 }, { t: 6.5, x: 0.2, z: 1.9 }, { t: 9.6, x: 0.2, z: 1.9 }, { t: 13, x: 1.8, z: 0.3 }, { t: 16, x: 1.8, z: 0.3 }, { t: DURATION, x: -1.7, z: 1.3 }],
        face: CENTER,
        labels: [{ t: 0, label: 'Amarre de trípode' }, { t: 6.5, label: 'Azoca y tensa los vientos' }, { t: 13, label: 'Comprueba la estabilidad' }],
      },
      { role: 'jugador', poses: [{ t: 0, pose: 'hold' }], path: at(-0.98, -0.12), face: 0 },
      { role: 'jugador', poses: [{ t: 0, pose: 'hold' }], hat: 'beret', path: at(0.62, 0.92), face: CENTER },
      { role: 'jugador', stance: 'squat', ...working('rope'), path: at(0.62, -0.88), face: CENTER },
    ],
  },

  // Camilla de bordones y botiquín abierto
  first_aid_stretcher: {
    focus: 0,
    people: [
      {
        role: 'lider', hat: 'four_dents', poses: [{ t: 0, pose: 'measure' }, { t: 7, pose: 'tag' }, { t: 8.5, pose: 'measure' }],
        path: [{ t: 0, x: 1.5, z: 1.1 }, { t: 6, x: 1.5, z: 1.1 }, { t: 7.5, x: 0.9, z: 1.25 }, { t: 12, x: 0.9, z: 1.25 }, { t: 14, x: 1.5, z: 1.1 }, { t: DURATION, x: 1.5, z: 1.1 }],
        face: CENTER,
        labels: [{ t: 0, label: 'Evalúa: conciencia y respiración' }, { t: 7, label: 'Indica el vendaje' }, { t: 14, label: 'Prepara el traslado en camilla' }],
      },
      // Paciente: los pies en x=0.82 y la cabeza hacia -x (acostado sobre la camilla)
      { role: 'jugador', stance: 'lie', poses: [{ t: 0, pose: 'swing' }], path: at(0.82, 0), face: 0 },
      { role: 'jugador', stance: 'kneel_both', ...working('bandage'), hat: 'beret', path: at(0.2, 0.68), face: { x: 0.2, z: 0 } },
      { role: 'jugador', stance: 'kneel_both', ...working(), path: at(-0.4, -0.66), face: { x: -0.4, z: 0 } },
    ],
  },

  // Fogata con varas de pan de cazador
  campfire_cooking: {
    focus: 0,
    people: [
      {
        role: 'lider', hat: 'four_dents', poses: instructing([4, 12]), path: at(-1.45, -1.25), face: CENTER,
        labels: [{ t: 0, label: 'Masa enrollada en la vara' }, { t: 6, label: 'Gira la vara sobre las brasas' }, { t: 13, label: 'Fuego controlado: agua a mano' }],
      },
      { role: 'jugador', stance: 'kneel', ...working('stick'), hat: 'beret', path: at(1.05, 0.35), face: CENTER },
      { role: 'jugador', stance: 'sit', ...working('stick'), path: at(-0.95, 0.6), face: CENTER },
      { role: 'jugador', stance: 'kneel_both', ...working('stick'), path: at(0.1, -1.08), face: CENTER },
      {
        // Trae leña desde la pila hasta el fuego
        role: 'jugador', ...working('twig'),
        path: [{ t: 0, x: 1.5, z: -0.9 }, { t: 2, x: 1.5, z: -0.9 }, { t: 5, x: 0.7, z: -0.55 }, { t: 7.5, x: 0.7, z: -0.55 }, { t: 10.5, x: 1.5, z: -0.9 }, { t: 13, x: 1.5, z: -0.9 }, { t: 16, x: 0.7, z: -0.55 }, { t: DURATION, x: 0.7, z: -0.55 }],
        face: CENTER,
      },
    ],
  },

  // Carpa a dos aguas con parantes y vientos
  tent_assembly: {
    focus: 0,
    people: [
      {
        role: 'lider', hat: 'four_dents', poses: instructing([3, 10, 16]), path: at(0.2, 2.3), face: CENTER,
        labels: [{ t: 0, label: '¡Arriba los parantes!' }, { t: 7, label: 'Tensa los vientos en línea' }, { t: 14, label: 'Estacas a 45°, lejos de la lona' }],
      },
      { role: 'jugador', poses: [{ t: 0, pose: 'hold' }], hat: 'beret', path: at(-1.25, 0.28), face: { x: -1.0, z: 0 } },
      { role: 'jugador', poses: [{ t: 0, pose: 'hold' }], path: at(1.25, -0.28), face: { x: 1.0, z: 0 } },
      { role: 'jugador', stance: 'kneel', ...working('mallet'), path: at(1.3, 1.45), face: { x: 0.95, z: 1.07 } },
      { role: 'jugador', stance: 'squat', ...working('rope'), path: at(-1.25, -1.45), face: { x: -0.95, z: -1.07 } },
    ],
  },

  // Mesa de campo con mapa y brújula + papelógrafo
  cartography_table: {
    focus: 1,
    people: [
      {
        role: 'lider', hat: 'four_dents', poses: instructing([4, 12]), path: at(0.65, -1.3), face: { x: 0, z: 1 },
        labels: [{ t: 0, label: 'Consejo de equipo' }, { t: 4, label: 'Explica el croquis' }, { t: 12, label: 'Rumbo 60° al banderín' }],
      },
      { role: 'jugador', stance: 'sit', ...working('pencil'), path: at(0, 0.72), face: CENTER },
      { role: 'jugador', stance: 'sit', poses: [{ t: 0, pose: 'measure' }], handProp: 'notebook', hat: 'beret', path: at(-1.0, 0.95), face: { x: 0, z: -0.6 } },
      { role: 'jugador', stance: 'sit', poses: [{ t: 0, pose: 'measure' }], handProp: 'notebook', path: at(1.05, 0.9), face: { x: 0, z: -0.6 } },
      {
        // Mide rumbos caminando con la brújula
        role: 'jugador', poses: [{ t: 0, pose: 'measure' }], handProp: 'compass',
        path: [{ t: 0, x: 1.9, z: -0.4 }, { t: 3, x: 1.9, z: -0.4 }, { t: 7, x: 3.0, z: 0.9 }, { t: 10, x: 3.0, z: 0.9 }, { t: 14, x: 1.9, z: -0.4 }, { t: DURATION, x: 1.9, z: -0.4 }],
        face: { x: 3.5, z: 2 },
      },
    ],
  },

  // Lona con bombas de semillas, cubeta de barro y herbario
  seed_bomb_craft: {
    focus: 0,
    people: [
      {
        role: 'lider', hat: 'four_dents', poses: instructing([5, 13]), path: at(-1.35, -1.15), face: CENTER,
        labels: [{ t: 0, label: 'Arcilla + tierra + semillas' }, { t: 7, label: 'Bolitas de 3 cm, bien compactas' }, { t: 14, label: 'Secar a la sombra 24 horas' }],
      },
      { role: 'jugador', stance: 'sit', ...working('stone'), hat: 'beret', path: at(-0.35, 0.9), face: { x: -0.35, z: 0.1 } },
      { role: 'jugador', stance: 'kneel_both', ...working('stone'), path: at(-1.2, 0.1), face: { x: -0.35, z: 0.1 } },
      { role: 'jugador', stance: 'squat', ...working(), path: at(1.0, -0.6), face: { x: 0.55, z: -0.3 } },
      { role: 'jugador', stance: 'sit', ...working('twig'), path: at(0.65, 0.95), face: { x: 0.5, z: 0.35 } },
    ],
  },
};

export function createWorkshopScene(focal: FocalProp): GameDefinition {
  const layout = LAYOUTS[focal];
  const competitors: CompetitorScript[] = [];
  const props: FieldProp[] = [];

  TEAMS.forEach((team, ti) => {
    const { center, theta, toWorld } = corner(ti);
    props.push({ kind: focal, pos: center, rotation: theta });

    layout.people.forEach((spec, k) => {
      const worldKeys = spec.path.map((key) => ({ t: key.t, ...toWorld(key) }));
      const path = keyframePath(worldKeys);
      // Ángulo local → mundo: heading_mundo = heading_local − θ
      const faceAt = (t: number) => {
        if (spec.face === undefined) return undefined;
        if (typeof spec.face === 'number') return spec.face - theta;
        const target = toWorld(spec.face);
        const p = path(t);
        return Math.atan2(target.z - p.z, target.x - p.x);
      };
      const moving = spec.path.length > 2;
      competitors.push({
        appearance: appearance(ti * 5 + k + 1, {
          id: `ws_${ti}_${k}`, name: NAMES[ti][k], role: spec.role, hatType: spec.hat ?? 'none', ...team,
        }),
        // Quietos: siempre mirando a su objetivo. Quien camina mira hacia donde va y al detenerse vuelve a su objetivo.
        track: buildTrack(path, DURATION, moving
          ? { face: (t) => (isStill(worldKeys, t) ? faceAt(t) : undefined), maxTurnRate: 4 }
          : { face: faceAt, maxTurnRate: 4 }),
        pose: poseTimeline(spec.poses),
        stance: spec.stance,
        handProp: spec.handProp,
        label: spec.labels ? labelTimeline(spec.labels) : undefined,
      });
    });
  });

  return {
    id: `station_${focal}`,
    duration: DURATION,
    focusId: `ws_0_${layout.focus}`,
    field: {
      width: 20,
      depth: 20,
      midline: false,
      zones: cornerZones(),
      trees: CORNER_TREES,
      props,
    },
    competitors,
    flags: () => [],
  };
}
