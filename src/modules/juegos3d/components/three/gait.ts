import { ArmPose, CompetitorState, Stance } from '../../engine/types';
import { gaitCycleLength, lerp, smoothstep } from '../../engine/tracks';

/**
 * Cinemática procedural del cuerpo: convierte velocidad + fase de marcha + postura
 * en ángulos de articulaciones. El modelo mira hacia +Z; su lado izquierdo está en +X.
 * Convenciones: cadera/hombro rotation.x negativa = hacia adelante; rodilla positiva = flexión.
 */

export const THIGH = 0.37;
export const SHIN = 0.36;
export const ANKLE_H = 0.07;

interface ArmTarget { shX: number; shZ: number; shY: number; elbow: number; swing: number; work?: number }
interface PoseTarget { l: ArmTarget; r: ArmTarget }

const arm = (shX: number, shZ: number, shY: number, elbow: number, swing: number): ArmTarget => ({ shX, shZ, shY, elbow, swing });

const POSES: Record<ArmPose, PoseTarget> = {
  swing: { l: arm(0, 0.07, 0, -0.2, 1), r: arm(0, -0.07, 0, -0.2, 1) },
  shoulders: { l: arm(-1.32, -0.2, 0, -0.18, 0.06), r: arm(-1.32, 0.2, 0, -0.18, 0.06) },
  behind: { l: arm(0.5, -0.1, -1.3, -1.4, 0), r: arm(0.5, 0.1, 1.3, -1.4, 0) },
  tag: { l: arm(0.2, 0.12, 0, -0.35, 0.4), r: arm(-1.5, 0.05, 0, -0.08, 0) },
  carry: { l: arm(0, 0.07, 0, -0.2, 1), r: arm(-0.55, -0.12, 0, -1.25, 0.15) },
  frozen: { l: arm(-0.3, 1.15, 0, -0.55, 0), r: arm(-0.3, -1.15, 0, -0.55, 0) },
  // Manos al frente a la altura de la cintura, moviéndose (amarrar, construir, ordenar)
  work: { l: { ...arm(-0.45, -0.12, 0, -1.25, 0), work: 1 }, r: { ...arm(-0.45, 0.12, 0, -1.25, 0), work: 1 } },
  // Celebración: brazos arriba saludando
  cheer: { l: { ...arm(-0.2, 2.55, 0, -0.35, 0), work: 1.4 }, r: { ...arm(-0.2, -2.55, 0, -0.35, 0), work: 1.4 } },
  // Sostener un parante vertical frente al cuerpo (una mano más arriba)
  hold: { l: arm(-1.05, -0.3, 0, -0.95, 0), r: arm(-1.55, 0.3, 0, -0.45, 0) },
  // Brújula a la altura del pecho, leyendo el rumbo
  measure: { l: { ...arm(-0.5, -0.28, 0, -1.7, 0), work: 0.25 }, r: { ...arm(-0.55, 0.28, 0, -1.65, 0), work: 0.25 } },
  // Silla de la reina: manos juntas al frente y abajo, muñecas entrelazadas con el compañero
  chair: { l: arm(-0.55, -0.42, 0, -1.25, 0), r: arm(-0.55, 0.42, 0, -1.25, 0) },
  // Tirar de una cuerda: ambos brazos estirados al frente, bajos
  pull: { l: { ...arm(-1.0, -0.12, 0, -0.25, 0), work: 0.35 }, r: { ...arm(-0.85, 0.12, 0, -0.35, 0), work: 0.35 } },
  // Brazos cruzados sobre el pecho
  crossed: { l: arm(-0.75, -0.55, 0.4, -1.95, 0), r: arm(-0.8, 0.55, -0.4, -1.95, 0) },
  // Lanzar: brazo derecho arriba y atrás
  throw: { l: arm(-0.6, 0.1, 0, -0.4, 0), r: { ...arm(-2.4, -0.15, 0, -0.9, 0), work: 0.5 } },
  // Saludo con la mano en alto
  salute: { l: arm(0, 0.07, 0, -0.2, 0), r: { ...arm(-2.6, -0.3, 0, -0.5, 0), work: 0.6 } },
};

interface StanceShape {
  legL: LegAngles;
  legR: LegAngles;
  pelvisY: number;
  lean: number;
  headDown: number;
  bodyPitch: number; // rotación de todo el cuerpo (acostado = -π/2)
  bodyLift: number;
}

const leg = (hipX: number, hipZ: number, knee: number, ankle: number): LegAngles => ({ hipX, hipZ, knee, ankle });

/** Posturas estáticas de cuerpo completo, con la rodilla, el pie o la cadera apoyados en el suelo. */
const STANCES: Record<Exclude<Stance, 'stand'>, StanceShape> = {
  // Rodilla derecha en tierra, pie izquierdo plano adelante
  kneel: { legL: leg(1.62, 0.06, 1.62, 0), legR: leg(-0.15, -0.06, 1.6, -0.4), pelvisY: 0.416, lean: 0.3, headDown: 0.35, bodyPitch: 0, bodyLift: 0 },
  // Arrodillado sobre ambas rodillas, inclinado hacia adelante (atender a alguien en el suelo)
  kneel_both: { legL: leg(0.25, 0.1, 1.85, -0.4), legR: leg(0.25, -0.1, 1.85, -0.4), pelvisY: 0.41, lean: 0.45, headDown: 0.4, bodyPitch: 0, bodyLift: 0 },
  // En cuclillas, pies planos, inclinado a revisar algo bajo (cuerda, peso, materiales)
  squat: { legL: leg(1.9, 0.18, 2.6, -0.7), legR: leg(1.9, -0.18, 2.6, -0.7), pelvisY: 0.23, lean: 0.5, headDown: 0.3, bodyPitch: 0, bodyLift: 0 },
  // Sentado en el suelo con piernas cruzadas
  sit: { legL: leg(1.45, 0.75, 2.4, 0), legR: leg(1.45, -0.75, 2.4, 0), pelvisY: 0.14, lean: 0.12, headDown: 0.2, bodyPitch: 0, bodyLift: 0 },
  // Acostado boca arriba (paciente)
  lie: { legL: leg(0, 0.04, 0.05, 0), legR: leg(0, -0.04, 0.05, 0), pelvisY: 0.8, lean: 0, headDown: 0, bodyPitch: -Math.PI / 2, bodyLift: 0.13 },
  // Sentado en el aire sobre los brazos de otros (silla de la reina): piernas colgando
  ride: { legL: leg(1.45, 0.12, 1.45, 0), legR: leg(1.45, -0.12, 1.45, 0), pelvisY: 0.14, lean: 0.05, headDown: 0, bodyPitch: 0, bodyLift: 0.62 },
  // Boca abajo, elevado (cruzando sobre los brazos de un puente humano)
  prone: { legL: leg(0, 0.05, 0.1, 0.3), legR: leg(0, -0.05, 0.1, 0.3), pelvisY: 0.8, lean: 0, headDown: -0.5, bodyPitch: Math.PI / 2, bodyLift: 1.15 },
  // A la pata coja (pierna izquierda recogida)
  one_leg: { legL: leg(0.5, 0.05, 1.6, -0.3), legR: leg(0, -0.04, 0.05, 0), pelvisY: 0.8, lean: 0.12, headDown: 0, bodyPitch: 0, bodyLift: 0 },
  // Acostado boca arriba, levantado (llevado en camilla)
  carried: { legL: leg(0, 0.04, 0.05, 0), legR: leg(0, -0.04, 0.05, 0), pelvisY: 0.8, lean: 0, headDown: 0, bodyPitch: -Math.PI / 2, bodyLift: 0.78 },
  // Afirmado tirando de una cuerda: piernas separadas, cadera baja, tronco hacia atrás
  brace: { legL: leg(0.45, 0.1, 0.55, 0), legR: leg(-0.3, -0.1, 0.2, 0), pelvisY: 0.74, lean: -0.3, headDown: 0.15, bodyPitch: 0, bodyLift: 0 },
};

function mixLeg(a: LegAngles, b: LegAngles, w: number): LegAngles {
  return { hipX: lerp(a.hipX, b.hipX, w), hipZ: lerp(a.hipZ, b.hipZ, w), knee: lerp(a.knee, b.knee, w), ankle: lerp(a.ankle, b.ankle, w) };
}

/** Mezcla dos poses de cuerpo completas (piernas, cadera, tronco); los brazos ya vienen mezclados. */
function mixPose(a: BodyPose, b: BodyPose, w: number): BodyPose {
  if (w >= 1) return b;
  if (w <= 0) return a;
  return {
    ...b,
    pelvisY: lerp(a.pelvisY, b.pelvisY, w),
    pelvisSway: lerp(a.pelvisSway, b.pelvisSway, w),
    pelvisYaw: lerp(a.pelvisYaw, b.pelvisYaw, w),
    spineLean: lerp(a.spineLean, b.spineLean, w),
    spineTwist: lerp(a.spineTwist, b.spineTwist, w),
    spineRoll: lerp(a.spineRoll, b.spineRoll, w),
    headPitch: lerp(a.headPitch, b.headPitch, w),
    bodyPitch: lerp(a.bodyPitch, b.bodyPitch, w),
    bodyLift: lerp(a.bodyLift, b.bodyLift, w),
    legL: mixLeg(a.legL, b.legL, w),
    legR: mixLeg(a.legR, b.legR, w),
  };
}

export interface LegAngles { hipX: number; hipZ: number; knee: number; ankle: number }
export interface ArmAngles { shX: number; shZ: number; shY: number; elbow: number }

export interface BodyPose {
  pelvisY: number;
  pelvisSway: number;
  pelvisYaw: number;
  spineLean: number;
  spineTwist: number;
  spineRoll: number;
  headPitch: number;
  breath: number;
  bodyPitch: number;
  bodyLift: number;
  legL: LegAngles;
  legR: LegAngles;
  armL: ArmAngles;
  armR: ArmAngles;
}

function legAngles(p: number, A: number, bias: number, walk: number, run: number, crouch: number, stand: number): LegAngles {
  const thigh = A * Math.sin(p) + bias;
  const kneeWalk = 0.07 + 0.72 * Math.pow(Math.max(0, Math.cos(p + Math.PI / 4)), 1.5);
  const kneeRun = 0.4 + 1.55 * Math.pow(Math.max(0, Math.cos(p + Math.PI / 3)), 1.2);
  const knee = lerp(0.04, lerp(kneeWalk, kneeRun, run), walk) + crouch * 1.05;
  const hipX = thigh * walk + crouch * 0.6;
  // Pie casi paralelo al suelo + empuje de punta al despegar
  const ankle = hipX - knee + 0.3 * walk * Math.max(0, -Math.sin(p)) * (1 - crouch);
  return { hipX, hipZ: stand, knee, ankle };
}

export function computeBodyPose(s: CompetitorState, time: number): BodyPose {
  const v = s.frozen ? 0 : s.speed;
  const walk = smoothstep(v / 0.55);
  const run = smoothstep((v - 2.0) / 1.6);
  const crouch = s.crouch * walk;

  const step = gaitCycleLength(v) / 2;
  // El paso real incluye el pie y la rotación de pelvis: las piernas abren algo menos que la geometría pura
  const walkA = 0.8 * Math.asin(Math.min(0.9, step / (2 * (THIGH + SHIN))));
  const A = lerp(walkA, 0.62, run) * (1 - crouch * 0.3);
  const bias = run * 0.18;
  // Desfase propio de cada competidor para que una fila no marche como robots sincronizados
  const pL = s.gaitPhase + s.height * 23;
  const pR = pL + Math.PI;

  const stance = s.frozen ? 0.1 : 0.03;
  const legL = legAngles(pL, A, bias, walk, run, crouch, stance);
  const legR = legAngles(pR, A, bias, walk, run, crouch, -stance);

  // La pierna de apoyo define la altura de la pelvis (sin pies flotando ni hundidos)
  const extent = (l: LegAngles) => THIGH * Math.cos(l.hipX) + SHIN * Math.cos(l.hipX - l.knee);
  const support = Math.max(extent(legL), extent(legR));
  const flight = run * 0.06 * Math.max(0, Math.sin(2 * pL));
  const pelvisY = support + ANKLE_H + flight;

  const breath = Math.sin(time * 1.6 + s.height * 40) * (1 - walk);

  // Brazos: mezcla entre la postura anterior y la nueva + braceo opuesto a las piernas
  const from = POSES[s.armPose.from];
  const to = POSES[s.armPose.to];
  const w = s.armPose.w;
  const armSwingA = lerp(0.3, 0.95, run) * walk;
  const elbowGait = lerp(-0.1, -1.35, run) * walk;
  const blendArm = (a: ArmTarget, b: ArmTarget, side: 1 | -1): ArmAngles => {
    const swing = lerp(a.swing, b.swing, w);
    const legPhase = side === 1 ? pR : pL; // brazo izquierdo acompaña a la pierna derecha
    const work = lerp(a.work ?? 0, b.work ?? 0, w);
    const handMotion = Math.sin(time * 5.2 + side * 1.4 + s.height * 30);
    return {
      shX: lerp(a.shX, b.shX, w) - armSwingA * swing * Math.sin(legPhase) - crouch * 0.35 * swing + work * 0.08 * handMotion,
      shZ: lerp(a.shZ, b.shZ, w) + side * run * 0.1 * swing,
      shY: lerp(a.shY, b.shY, w),
      elbow: lerp(a.elbow, b.elbow, w) + elbowGait * swing - crouch * 0.5 * swing + work * 0.22 * handMotion,
    };
  };

  const lean = lerp(0.03, 0.3, run) * walk + crouch * 0.55 + (s.isBlindfolded ? -0.04 : 0);
  const armL = blendArm(from.l, to.l, 1);
  const armR = blendArm(from.r, to.r, -1);

  const standing: BodyPose = {
    pelvisY,
    pelvisSway: 0.018 * Math.sin(pL) * walk * (1 - run),
    pelvisYaw: 0.1 * Math.sin(pL) * walk,
    spineLean: lean + breath * 0.01,
    spineTwist: -0.14 * Math.sin(pL) * walk,
    spineRoll: 0.03 * Math.sin(pL) * walk * (1 - run),
    headPitch: -lean * 0.65 + (s.isBlindfolded ? 0.08 : 0),
    breath,
    bodyPitch: 0,
    bodyLift: 0,
    legL,
    legR,
    armL,
    armR,
  };

  const shape = (st: Stance): BodyPose => {
    if (st === 'stand') return standing;
    const sh = STANCES[st];
    return {
      pelvisY: sh.pelvisY, pelvisSway: 0, pelvisYaw: 0,
      spineLean: sh.lean + breath * 0.01, spineTwist: 0, spineRoll: 0,
      headPitch: sh.headDown, breath, bodyPitch: sh.bodyPitch, bodyLift: sh.bodyLift,
      legL: sh.legL, legR: sh.legR, armL, armR,
    };
  };
  const st = s.stance;
  return st.from === st.to ? shape(st.to) : mixPose(shape(st.from), shape(st.to), st.w);
}

