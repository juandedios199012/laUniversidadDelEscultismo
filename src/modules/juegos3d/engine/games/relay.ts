import { ArmPose, HandProp, HatType, SetPiece, Stance, Vec2 } from '../types';
import { PosKey, buildTrack, integrateSpeed, keyframePath, labelTimeline, makeArcPath, poseTimeline, scalarKeys, stanceTimeline } from '../tracks';
import { CompetitorScript, GameDefinition, appearance } from './common';

/**
 * RELEVOS — 4 equipos en columnas detrás de la línea de partida.
 * Estructura común: cada corredor sale, hace una TAREA en el destino de su carril, vuelve y entrega el
 * relevo con un toque; la columna avanza y quien llegó se va al final. La tarea viene de las reglas del
 * juego (`activity` del catálogo, p. ej. "tie_knot:cross" = atar en una cruz de palos):
 * rodear banderín, atar, colocar una pieza, lavarse las manos, memorizar y dibujar, traer un implemento,
 * saludar, inmovilizar un brazo, lanzar una cuerda, medir o imitar un animal.
 * Dos actividades tienen estructura propia: circuito perimetral en fila y rally de recolección.
 */

const TEAMS = [
  { teamName: 'Equipo Rojo', teamColor: '#DC2626', secondaryColor: '#FDE68A', speed: 3.9 },
  { teamName: 'Equipo Azul', teamColor: '#2563EB', secondaryColor: '#F8FAFC', speed: 4.2 },
  { teamName: 'Equipo Verde', teamColor: '#16A34A', secondaryColor: '#FDE047', speed: 3.7 },
  { teamName: 'Equipo Amarillo', teamColor: '#EAB308', secondaryColor: '#1E3A8A', speed: 4.0 },
];
const LANES = [-4.5, -1.5, 1.5, 4.5];
const NAMES = [
  ['Mateo', 'Lucía', 'Bruno', 'Ana'], ['Tomás', 'Sofía', 'Iker', 'Valeria'],
  ['Diego', 'Emma', 'Gael', 'Julieta'], ['Lucas', 'Mía', 'Thiago', 'Renata'],
];
const START = 1.5;
const LEGS = 2;
const START_LINE = -9;
const TURN_X = 8.05;
const slotX = (k: number) => START_LINE - 0.7 - k * 0.85;
const HATS: HatType[] = ['none', 'beret', 'none', 'four_dents'];
/** Tramos que empiezan o terminan detenidos aceleran y frenan (curva suave): el pico es ~1.4 veces el promedio. */
const STOP_TO_STOP = 1.35;

// -----------------------------------------------------------------------------
// Tareas en el destino
// -----------------------------------------------------------------------------

interface TaskSpec {
  /** Cuánto se acerca al destino (x donde se detiene). */
  stopX: number;
  duration: number;
  stance: Stance;
  pose: ArmPose;
  /** Objeto en la mano de ida (y durante la tarea). */
  carryOut?: HandProp;
  /** Objeto que trae de vuelta. */
  carryBack?: HandProp;
  /** Al volver, se arrodilla a dibujar lo memorizado antes de ir al final de la fila. */
  drawAtBase?: boolean;
  /** Corre agachado (imitando un animal). */
  crouchOut?: number;
  /** Rodea el banderín en vez de detenerse (relevo clásico). */
  roundFlag?: boolean;
  /** Lleva el pañuelo de relevo (testigo). */
  baton?: boolean;
  /** Gira 360° sobre sí mismo durante la tarea (círculo de seguridad). */
  spin?: boolean;
  labelOut: string;
  labelTask: string;
  /** Piezas del destino en cada carril. */
  pieces: (z: number) => SetPiece[];
}

const at = (x: number, z: number): Vec2 => ({ x, z });

const TASKS: Record<string, TaskSpec> = {
  round_flag: { stopX: TURN_X, duration: 0, stance: 'stand', pose: 'swing', roundFlag: true, baton: true, labelOut: '¡Corre al banderín!', labelTask: 'Vuelta al banderín', pieces: () => [] },
  animal_move: { stopX: TURN_X, duration: 0, stance: 'stand', pose: 'swing', roundFlag: true, crouchOut: 0.9, labelOut: 'Avanza imitando a su animal', labelTask: 'Vuelta y regreso corriendo', pieces: () => [] },
  'tie_knot:tree': { stopX: TURN_X - 0.55, duration: 3, stance: 'squat', pose: 'work', carryOut: 'rope', labelOut: 'Lleva su soguilla', labelTask: 'Nudo llano al árbol', pieces: (z) => [{ kind: 'post', pos: at(TURN_X, z) }] },
  'tie_knot:cross': { stopX: TURN_X - 0.6, duration: 3.2, stance: 'stand', pose: 'work', carryOut: 'rope', labelOut: 'Corre a la cruz pionera', labelTask: 'Una fase del amarre cuadrado', pieces: (z) => [{ kind: 'crossed_staffs', pos: at(TURN_X, z), rotation: Math.PI / 2 }] },
  'tie_knot:shears': { stopX: TURN_X - 0.6, duration: 3.2, stance: 'stand', pose: 'work', carryOut: 'rope', labelOut: 'Corre a la tijera', labelTask: 'Nudo de leñador y vueltas en diagonal', pieces: (z) => [{ kind: 'x_staffs', pos: at(TURN_X, z), rotation: Math.PI / 2 }] },
  'tie_knot:tripod': { stopX: TURN_X - 0.6, duration: 3.4, stance: 'kneel', pose: 'work', carryOut: 'rope', labelOut: 'Corre a los bordones', labelTask: 'Amarre de trípode', pieces: (z) => [{ kind: 'staff', pos: at(TURN_X, z), count: 3, rotation: Math.PI / 2 }] },
  'tie_knot:crossbar': { stopX: TURN_X - 0.6, duration: 3.2, stance: 'stand', pose: 'work', carryOut: 'twig', labelOut: 'Lleva una varilla', labelTask: 'Fija el travesaño con ballestrinques', pieces: (z) => [
    { kind: 'post', pos: at(TURN_X, z - 0.5) }, { kind: 'post', pos: at(TURN_X, z + 0.5) },
    { kind: 'rope_line', pos: at(TURN_X, z - 0.5), to: at(TURN_X, z + 0.5), height: 0.9 },
  ] },
  'tie_knot:stakes': { stopX: TURN_X - 0.5, duration: 3, stance: 'kneel', pose: 'work', carryOut: 'mallet', labelOut: 'Corre a las estacas', labelTask: 'Tensa un viento y clava a 45°', pieces: (z) => [{ kind: 'stake', pos: at(TURN_X, z), count: 3 }, { kind: 'rope', pos: at(TURN_X + 0.4, z + 0.3), count: 1 }] },
  'tie_knot:rope_join': { stopX: TURN_X - 0.5, duration: 3, stance: 'squat', pose: 'work', carryOut: 'rope', labelOut: 'Corre a las dos cuerdas', labelTask: 'Une con vuelta de escota', pieces: (z) => [{ kind: 'rope', pos: at(TURN_X, z), count: 2 }] },
  'tie_knot:ring': { stopX: TURN_X - 0.5, duration: 2.2, stance: 'stand', pose: 'measure', baton: true, labelOut: 'Pañuelo al cuello, sorteando conos', labelTask: 'Desata el anillo en la base', pieces: (z) => [{ kind: 'cone', pos: at(TURN_X, z) }] },
  'place_piece:pattern': { stopX: TURN_X - 0.6, duration: 2.6, stance: 'kneel', pose: 'work', carryOut: 'notebook', labelOut: 'Lleva una pieza de la figura', labelTask: 'Coloca su pieza en la figura', pieces: (z) => [{ kind: 'target', pos: at(TURN_X, z) }, { kind: 'cards', pos: at(TURN_X + 0.1, z) }] },
  'place_piece:backpack': { stopX: TURN_X - 0.55, duration: 2.8, stance: 'kneel', pose: 'work', carryOut: 'notebook', labelOut: 'Lleva un objeto del campamento', labelTask: 'Lo ubica en la zona correcta de la mochila', pieces: (z) => [{ kind: 'backpack', pos: at(TURN_X, z) }, { kind: 'camp_gear', pos: at(TURN_X + 0.5, z + 0.3) }] },
  'place_piece:sundial': { stopX: TURN_X - 0.55, duration: 2.4, stance: 'squat', pose: 'work', carryOut: 'twig', labelOut: 'Lleva una ramita', labelTask: 'La clava en la punta de la sombra', pieces: (z) => [{ kind: 'post', pos: at(TURN_X, z) }, { kind: 'natural', pos: at(TURN_X - 0.1, z + 0.45) }] },
  'place_piece:pot': { stopX: TURN_X - 0.5, duration: 2.4, stance: 'squat', pose: 'work', carryOut: 'stone', labelOut: 'Semilla en la cuchara, sin que caiga', labelTask: 'La deposita en la maceta', pieces: (z) => [{ kind: 'bucket', pos: at(TURN_X, z), count: 1 }, { kind: 'natural', pos: at(TURN_X + 0.4, z) }] },
  wash_hands: { stopX: TURN_X - 0.55, duration: 3.2, stance: 'stand', pose: 'work', labelOut: 'Corre a la mesa de intendencia', labelTask: 'Se lava las manos con jabón', pieces: (z) => [{ kind: 'table', pos: at(TURN_X, z), rotation: Math.PI / 2 }] },
  'memorize_draw:board': { stopX: TURN_X - 0.9, duration: 2.6, stance: 'stand', pose: 'measure', drawAtBase: true, labelOut: 'Corre a la pizarra', labelTask: 'Memoriza un tramo del croquis', pieces: (z) => [{ kind: 'easel', pos: at(TURN_X, z), rotation: -Math.PI / 2 }] },
  'memorize_draw:fist': { stopX: TURN_X - 0.55, duration: 2.8, stance: 'stand', pose: 'work', carryOut: 'pencil', labelOut: 'Corre a los plumones', labelTask: 'Dibuja curvas de nivel en el puño', pieces: (z) => [{ kind: 'table', pos: at(TURN_X, z), rotation: Math.PI / 2 }] },
  'memorize_draw:cipher': { stopX: TURN_X - 0.55, duration: 2.6, stance: 'squat', pose: 'measure', carryBack: 'notebook', labelOut: 'Corre al mensaje cifrado', labelTask: 'Toma un fragmento cifrado', pieces: (z) => [{ kind: 'board', pos: at(TURN_X, z) }, { kind: 'cards', pos: at(TURN_X, z) , height: 0.04 }] },
  fetch_item: { stopX: TURN_X - 0.5, duration: 1.8, stance: 'squat', pose: 'work', carryBack: 'bandage', labelOut: 'Corre a la caja de implementos', labelTask: 'Elige un implemento real', pieces: (z) => [{ kind: 'first_aid_kit', pos: at(TURN_X, z) }, { kind: 'sack', pos: at(TURN_X + 0.45, z + 0.3), count: 1 }] },
  splint: { stopX: TURN_X - 0.75, duration: 3.4, stance: 'kneel_both', pose: 'work', carryOut: 'bandage', labelOut: 'Lleva pañoleta y varillas', labelTask: 'Inmoviliza el brazo sin moverlo', pieces: (z) => [{ kind: 'staff', pos: at(TURN_X - 0.3, z + 0.5), count: 2, rotation: Math.PI / 2 }] },
  'greet:cones': { stopX: TURN_X - 0.4, duration: 1.6, stance: 'stand', pose: 'salute', baton: true, labelOut: 'Sortea los conos con la pañoleta', labelTask: 'Saludo reglamentario al dirigente', pieces: (z) => [{ kind: 'cone', pos: at(-4, z + 0.45) }, { kind: 'cone', pos: at(0, z - 0.45) }, { kind: 'cone', pos: at(4, z + 0.45) }] },
  safety_circle: { stopX: TURN_X - 0.1, duration: 2.8, stance: 'stand', pose: 'tag', spin: true, carryBack: 'stick', labelOut: 'Corre al aro del suelo', labelTask: 'Gira 360° con el brazo extendido', pieces: (z) => [{ kind: 'target', pos: at(TURN_X - 0.1, z) }] },
  greet: { stopX: TURN_X - 0.4, duration: 1.8, stance: 'stand', pose: 'salute', labelOut: 'Corre a saludar', labelTask: 'Saludo y frase en otro idioma', pieces: () => [] },
  measure: { stopX: TURN_X - 0.6, duration: 2.8, stance: 'stand', pose: 'tag', carryOut: 'stick', labelOut: 'Corre con el bordón graduado', labelTask: 'Triangulación visual del árbol', pieces: (z) => [{ kind: 'post', pos: at(TURN_X + 3.2, z) }] },
  rescue_rope: { stopX: TURN_X - 1.6, duration: 3, stance: 'brace', pose: 'pull', labelOut: 'Corre a la línea de peligro', labelTask: 'Lanza la cuerda y tira con seguridad', pieces: (z) => [
    { kind: 'rope_line', pos: at(TURN_X - 1.4, z), to: at(TURN_X + 0.6, z), height: 0.75 },
    { kind: 'tape', pos: at(TURN_X - 0.6, z), rotation: Math.PI / 2 },
  ] },
};

/** Ayudantes fijos en el destino (dirigente que saluda, lesionados, compañeros caídos). */
function npcsFor(task: string): { name: string; pos: (z: number) => Vec2 | null; stance: Stance; pose: ArmPose; label: string; face: number; single?: Vec2 }[] {
  if (task === 'greet' || task === 'greet:cones') return [{ name: 'Dirigente', pos: () => null, single: at(TURN_X + 0.8, 0), stance: 'stand', pose: 'salute', label: 'Recibe el saludo', face: Math.PI }];
  if (task === 'splint') return [{ name: 'Lesionado', pos: (z) => at(TURN_X, z), stance: 'sit', pose: 'measure', label: 'Brazo lesionado', face: Math.PI }];
  if (task === 'rescue_rope') return [{ name: 'Caído', pos: (z) => at(TURN_X + 0.75, z), stance: 'sit', pose: 'pull', label: 'Se ata un As de Guía', face: Math.PI }];
  return [];
}

// -----------------------------------------------------------------------------
// Planificación de cada persona (claves de posición, postura, objeto y etiqueta)
// -----------------------------------------------------------------------------

interface Plan {
  keys: PosKey[];
  poses: { t: number; pose: ArmPose }[];
  stances: { t: number; stance: Stance }[];
  crouch: { t: number; v: number }[];
  labels: { t: number; label?: string }[];
  hand: [number, number, HandProp][];
  baton: [number, number][];
  spins: [number, number][];
}

const last = (p: Plan) => p.keys[p.keys.length - 1];
const goTo = (p: Plan, t: number, x: number, z: number) => p.keys.push({ t, x, z });
const hold = (p: Plan, t: number) => {
  if (t > last(p).t) goTo(p, t, last(p).x, last(p).z);
};

function newPlan(x: number, z: number): Plan {
  return { keys: [{ t: 0, x, z }], poses: [{ t: 0, pose: 'swing' }], stances: [{ t: 0, stance: 'stand' }], crouch: [{ t: 0, v: 0 }], labels: [{ t: 0 }], hand: [], baton: [], spins: [] };
}

function toScript(p: Plan, look: CompetitorScript['appearance'], duration: number): CompetitorScript {
  hold(p, duration);
  // Giro sobre sí mismo (círculo de seguridad): la dirección recorre 360° durante el intervalo
  const face = p.spins.length
    ? (t: number) => {
        const s = p.spins.find(([a, b]) => t >= a && t < b);
        return s ? ((t - s[0]) / (s[1] - s[0])) * Math.PI * 2 : undefined;
      }
    : undefined;
  return {
    appearance: look,
    track: buildTrack(keyframePath(p.keys), duration, { initialHeading: 0, idleHeading: 0, maxTurnRate: 8, face }),
    pose: poseTimeline(p.poses),
    stance: stanceTimeline(p.stances),
    crouch: p.crouch.length > 1 ? scalarKeys(p.crouch) : undefined,
    label: labelTimeline(p.labels),
    handProp: (t) => p.hand.find(([a, b]) => t >= a && t < b)?.[2],
    holdingChicote: (t) => p.baton.some(([a, b]) => t >= a && t < b),
  };
}

function look(ti: number, k: number) {
  const team = TEAMS[ti];
  return appearance(ti * 4 + k, {
    id: `relay_${ti}_${k}`, name: NAMES[ti][k], role: k === 3 ? 'lider' : 'jugador', hatType: HATS[k],
    teamName: team.teamName, teamColor: team.teamColor, secondaryColor: team.secondaryColor,
  });
}

const FIELD = (extra: Partial<GameDefinition['field']> = {}): GameDefinition['field'] => ({
  width: 26,
  depth: 14,
  midline: false,
  zones: [],
  trees: [
    { x: -4, z: -9.5, height: 5.6, canopyRadius: 2.0, foliageColor: '#2F5D2A' },
    { x: 6, z: 9.6, height: 6.2, canopyRadius: 2.2, foliageColor: '#33652C' },
  ],
  finish: { x: START_LINE, z0: -6.2, z1: 6.2 },
  ...extra,
});

// -----------------------------------------------------------------------------
// Relevo con tarea en el destino
// -----------------------------------------------------------------------------

function createLaneRelay(taskId: string): GameDefinition {
  const task = TASKS[taskId] ?? TASKS[taskId.split(':')[0]] ?? TASKS.round_flag;
  const plans: Plan[][] = TEAMS.map((_, ti) => [0, 1, 2, 3].map((k) => newPlan(slotX(k), LANES[ti])));
  const finishTimes: number[] = [];

  TEAMS.forEach((team, ti) => {
    const z = LANES[ti];
    const v = task.crouchOut ? team.speed * 0.55 : team.speed;
    const people = plans[ti];
    const queue = [0, 1, 2, 3];
    let t = START;
    let returning: number | undefined;

    for (let leg = 0; leg < LEGS; leg++) {
      const r = queue.shift()!;
      queue.forEach((pid, k) => {
        if (pid === returning) return;
        hold(people[pid], t + 0.2);
        goTo(people[pid], t + 1.1, slotX(k), z);
      });

      const p = people[r];
      hold(p, t);
      let tEnd: number;
      const outDist = task.stopX - slotX(0);
      if (task.roundFlag) {
        const out = (TURN_X - 0.45 - slotX(0)) / v;
        goTo(p, t + out, TURN_X - 0.45, z - 0.55);
        goTo(p, t + out + 0.3, TURN_X + 0.55, z - 0.35);
        goTo(p, t + out + 0.55, TURN_X + 0.7, z + 0.3);
        goTo(p, t + out + 0.85, TURN_X - 0.45, z + 0.55);
        tEnd = t + out + 0.85 + (TURN_X - 0.45 - (START_LINE - 0.15)) / team.speed;
        if (task.crouchOut) p.crouch.push({ t, v: 0 }, { t: t + 0.3, v: task.crouchOut }, { t: t + out + 0.4, v: task.crouchOut }, { t: t + out + 0.9, v: 0 });
        p.labels.push({ t, label: task.labelOut }, { t: t + out, label: task.labelTask });
      } else {
        const tArrive = t + (outDist / v) * STOP_TO_STOP;
        const tDone = tArrive + task.duration;
        goTo(p, tArrive, task.stopX, z);
        goTo(p, tDone, task.stopX, z);
        tEnd = tDone + ((task.stopX - (START_LINE - 0.15)) / team.speed) * STOP_TO_STOP;
        p.stances.push({ t: tArrive - 0.1, stance: task.stance }, { t: tDone - 0.35, stance: 'stand' });
        p.poses.push({ t: tArrive, pose: task.pose }, { t: tDone - 0.2, pose: 'swing' });
        if (task.carryOut) p.hand.push([t, tDone, task.carryOut]);
        if (task.spin) p.spins.push([tArrive + 0.3, tDone - 0.4]);
        if (task.carryBack) p.hand.push([tDone - 0.4, tEnd + 0.4, task.carryBack]);
        p.labels.push({ t, label: task.labelOut }, { t: tArrive, label: task.labelTask }, { t: tDone, label: 'Vuelve a su columna' });
      }
      goTo(p, tEnd, START_LINE - 0.15, z + 0.2);
      if (task.baton) p.baton.push([t, tEnd]);
      p.poses.push({ t: tEnd - 0.35, pose: 'tag' }, { t: tEnd + 0.3, pose: 'swing' });
      p.labels.push({ t: tEnd - 0.6, label: 'Entrega el relevo' }, { t: tEnd + 0.8 });

      // Vuelta al final de la columna (dibujando antes lo memorizado, si corresponde)
      const target = leg < LEGS - 1 ? queue.length - 1 : queue.length;
      let tWalk = tEnd + 0.5;
      goTo(p, tWalk, START_LINE - 0.4, z + 0.75);
      if (task.drawAtBase) {
        p.stances.push({ t: tWalk, stance: 'kneel' }, { t: tWalk + 1.8, stance: 'stand' });
        p.poses.push({ t: tWalk, pose: 'work' }, { t: tWalk + 1.8, pose: 'swing' });
        p.hand.push([tWalk, tWalk + 1.8, 'pencil']);
        p.labels.push({ t: tWalk, label: 'Dibuja su tramo en la hoja' }, { t: tWalk + 1.9 });
        tWalk += 2;
        goTo(p, tWalk, START_LINE - 0.4, z + 0.75);
      }
      const tBack = tWalk + (START_LINE - 0.4 - slotX(target)) / 1.5;
      goTo(p, tBack, slotX(target), z + 0.75);
      goTo(p, tBack + 0.6, slotX(target), z);
      queue.push(r);
      returning = r;
      t = tEnd;
    }
    finishTimes[ti] = t;
  });

  const ranking = [...finishTimes.keys()].sort((a, b) => finishTimes[a] - finishTimes[b]);
  const duration = Math.max(...finishTimes) + 4.5;
  const competitors: CompetitorScript[] = [];
  TEAMS.forEach((_, ti) => {
    const place = ranking.indexOf(ti) + 1;
    plans[ti].forEach((p, k) => {
      p.poses.push({ t: finishTimes[ti] + 2.4, pose: 'cheer' });
      if (k === 3) p.labels.push({ t: finishTimes[ti] + 2.4, label: place === 1 ? '¡Primer lugar!' : `${place}° lugar` });
      competitors.push(toScript(p, look(ti, k), duration));
    });
  });

  // Ayudantes fijos del destino
  npcsFor(taskId.split(':')[0]).forEach((npc, ni) => {
    const spots = npc.single ? [npc.single] : LANES.map((z) => npc.pos(z)!).filter(Boolean);
    spots.forEach((pos, si) => {
      const id = `relay_npc_${ni}_${si}`;
      competitors.push({
        appearance: appearance(20 + si, { id, name: npc.name, role: 'jugador', hatType: npc.single ? 'four_dents' : 'none', teamName: 'Ayudantes', teamColor: '#64748B', secondaryColor: '#F8FAFC' }),
        track: buildTrack(() => pos, duration, { face: () => npc.face }),
        pose: poseTimeline([{ t: 0, pose: npc.pose }]),
        stance: npc.stance,
        label: labelTimeline([{ t: 0, label: npc.label }]),
      });
    });
  });

  return {
    id: 'relay',
    duration,
    focusId: 'relay_1_0',
    field: FIELD({ setPieces: LANES.flatMap((z) => task.pieces(z)) }),
    competitors,
    flags: () => (task.roundFlag
      ? TEAMS.map((team, ti) => ({ id: `turn_${ti}`, color: team.teamColor, secondaryColor: team.secondaryColor, pos: { x: TURN_X, z: LANES[ti] } }))
      : []),
  };
}

// -----------------------------------------------------------------------------
// Circuito perimetral en fila (marcha rítmica: alterna trote y marcha)
// -----------------------------------------------------------------------------

function createCircuit(): GameDefinition {
  const duration = 26;
  const hw = 11, hd = 5.8, r = 1.6;
  // Rectángulo de esquinas redondeadas recorrido en sentido antihorario
  const loop: Vec2[] = [];
  const corners = [[hw - r, hd - r, 0], [-(hw - r), hd - r, Math.PI / 2], [-(hw - r), -(hd - r), Math.PI], [hw - r, -(hd - r), 1.5 * Math.PI]];
  corners.forEach(([cx, cz, a0]) => {
    for (let i = 0; i <= 6; i++) {
      const a = a0 + (i / 6) * (Math.PI / 2);
      loop.push({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r });
    }
  });
  loop.push(loop[0]);
  const path = makeArcPath(loop, 30);
  // 20 pasos de trote (≈ 2.6 m/s) y 20 de marcha (≈ 1.5 m/s), alternando cada ~6 s
  const speed = (t: number) => (t < 1 ? t * 1.5 : Math.floor((t - 1) / 6) % 2 === 0 ? 2.6 : 1.5);
  const travel = integrateSpeed(speed, duration);
  const phaseLabel = (t: number) => (Math.floor((t - 1) / 6) % 2 === 0 ? '20 pasos de trote' : '20 pasos de marcha enérgica');

  const competitors: CompetitorScript[] = [];
  TEAMS.forEach((_, ti) => {
    const offset = (ti / TEAMS.length) * path.length;
    [0, 1, 2, 3].forEach((k) => {
      const at = (t: number) => {
        let s = (offset + travel.s(t) - k * 0.9) % path.length;
        if (s < 0) s += path.length;
        return path.at(s);
      };
      competitors.push({
        appearance: look(ti, k),
        track: buildTrack(at, duration, { maxTurnRate: 8 }),
        pose: poseTimeline([{ t: 0, pose: 'swing' }]),
        label: k === 0 ? (t) => (t < 1 ? 'Patrulla unida en fila' : phaseLabel(t)) : undefined,
      });
    });
  });
  return { id: 'relay', duration, focusId: 'relay_1_0', field: FIELD({ finish: undefined }), competitors, flags: () => [] };
}

// -----------------------------------------------------------------------------
// Rally de recolección por sectores (recoger y clasificar en 3 bolsas)
// -----------------------------------------------------------------------------

function createCollect(): GameDefinition {
  const duration = 24;
  const sectors = [at(-6, -3.5), at(6, -3.5), at(-6, 3.5), at(6, 3.5)];
  const litter: SetPiece[] = sectors.flatMap((c, i) => [0, 1].map((j) => ({ kind: 'litter' as const, pos: at(c.x + (j ? 1.8 : -1.6), c.z + (j ? -0.8 : 1.0)), rotation: i + j })));
  const bags: SetPiece[] = sectors.map((c) => ({ kind: 'sack', pos: at(c.x, c.z + (c.z > 0 ? 2.4 : -2.4)), count: 3 }));

  const competitors: CompetitorScript[] = [];
  TEAMS.forEach((_, ti) => {
    const c = sectors[ti];
    [0, 1, 2, 3].forEach((k) => {
      const p = newPlan(c.x + (k - 1.5) * 0.8, c.z + (c.z > 0 ? 2 : -2));
      let t = 0.5 + k * 0.3;
      for (let stop = 0; stop < 4; stop++) {
        const a = k * 1.7 + stop * 2.3 + ti;
        const x = c.x + Math.cos(a) * (1.2 + (stop % 2)), z = c.z + Math.sin(a) * 1.4;
        hold(p, t);
        t += 1.6;
        goTo(p, t, x, z);
        p.stances.push({ t, stance: 'squat' }, { t: t + 1.6, stance: 'stand' });
        p.poses.push({ t, pose: 'work' }, { t: t + 1.6, pose: 'swing' });
        t += 2.2;
        goTo(p, t, x, z);
      }
      p.hand.push([0, duration, 'twig']);
      if (k === 3) p.labels.push({ t: 1, label: 'Plástico y latas' }, { t: 8, label: 'Papel y cartón' }, { t: 15, label: 'No reciclable' });
      competitors.push(toScript(p, look(ti, k), duration));
    });
  });
  return { id: 'relay', duration, focusId: 'relay_1_3', field: FIELD({ finish: undefined, setPieces: [...litter, ...bags] }), competitors, flags: () => [] };
}

export function createRelayScene(activity?: string): GameDefinition {
  const task = activity ?? 'round_flag';
  if (task === 'circuit') return createCircuit();
  if (task === 'collect') return createCollect();
  return createLaneRelay(task);
}

