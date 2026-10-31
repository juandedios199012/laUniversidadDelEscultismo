import { Vec2 } from '../types';
import { buildTrack, clamp, labelTimeline, lerp, poseTimeline, smoothstep } from '../tracks';
import { GameDefinition, CompetitorScript, appearance } from './common';

/**
 * CÍRCULO (p. ej. El Chicote) — 10 competidores en círculo mirando al centro con las manos atrás.
 * Nicolás trota por fuera, deja el chicote en las manos de Lucas y escapa a toda velocidad;
 * Lucas se da vuelta y lo persigue. Nicolás completa la vuelta y ocupa el lugar vacío,
 * y Lucas pasa a ser el nuevo corredor.
 */

const N = 10;
const R_IN = 4;
const R_OUT = 5.1;
const CHASER = 6;
const slotAngle = (i: number) => (i / N) * Math.PI * 2;
const polar = (a: number, r: number): Vec2 => ({ x: Math.cos(a) * r, z: Math.sin(a) * r });

/** Simulación determinista de una carrera por el perímetro: devuelve la distancia recorrida s(t). */
function simulateRun(opts: {
  duration: number;
  startAt: number;
  targetSpeed: (t: number, s: number) => number;
  stopAt?: number; // distancia donde frena hasta detenerse
  brake?: number;  // m/s²
}) {
  const dt = 1 / 240;
  const n = Math.ceil(opts.duration / dt) + 1;
  const table = new Float64Array(n);
  let s = 0, v = 0, stopTime = opts.duration;
  for (let i = 1; i < n; i++) {
    const t = i * dt;
    if (t >= opts.startAt) {
      let target = opts.targetSpeed(t, s);
      if (opts.stopAt !== undefined) {
        const remaining = opts.stopAt - s;
        const brakeV = Math.sqrt(Math.max(0, 2 * (opts.brake ?? 6) * remaining));
        target = Math.min(target, brakeV);
        if (remaining <= 0.002 && stopTime === opts.duration) stopTime = t;
      }
      v += (target - v) * Math.min(1, dt * 3.5);
      if (opts.stopAt !== undefined) v = Math.min(v, Math.sqrt(Math.max(0, 2 * (opts.brake ?? 6) * (opts.stopAt - s))));
      s += v * dt;
    }
    table[i] = s;
  }
  const at = (t: number) => {
    const f = clamp(t, 0, opts.duration) / dt;
    const i = Math.min(Math.floor(f), n - 2);
    return lerp(table[i], table[i + 1], f - i);
  };
  const timeAt = (target: number) => {
    for (let i = 1; i < n; i++) if (table[i] >= target) return i * dt;
    return opts.duration;
  };
  return { at, timeAt, stopTime };
}

export function createCircleScene(): GameDefinition {
  const duration = 17;
  const runnerStartAngle = slotAngle(0) + 0.32;
  const chaserAngle = slotAngle(CHASER);
  const arcDrop = (chaserAngle - runnerStartAngle) * R_OUT;
  const arcSeat = arcDrop + Math.PI * 2 * R_OUT;

  // 1) Corredor: trota hasta el elegido, acelera al soltar el chicote y frena en el hueco
  const runner = simulateRun({
    duration,
    startAt: 0.6,
    targetSpeed: (_t, s) => (s < arcDrop ? 2.6 : 5.0),
    stopAt: arcSeat,
    brake: 5,
  });
  const tDrop = runner.timeAt(arcDrop);
  const tSeat = runner.stopTime;

  const runnerPos = (t: number) => {
    const s = runner.at(t);
    const toSeat = arcSeat - s;
    const r = lerp(R_IN, R_OUT, smoothstep(toSeat / 2.4));
    return polar(runnerStartAngle + s / R_OUT, r);
  };

  // 2) Perseguidor: reacciona 0.5 s después, sale del círculo y corre detrás
  const tReact = tDrop + 0.5;
  const chaser = simulateRun({
    duration,
    startAt: tReact,
    targetSpeed: (t) => (t < tSeat ? 4.6 : 2.6),
  });
  const chaserPos = (t: number) => {
    const s = chaser.at(t);
    const r = lerp(R_IN, R_OUT, smoothstep(s / 1.4));
    return polar(chaserAngle + s / R_OUT, r);
  };

  const team = { teamName: 'Grupo', teamColor: '#1D4ED8', secondaryColor: '#F59E0B' };
  const names = ['Ignacio', 'Valentina', 'Emilio', 'Renata', 'Bruno', 'Isabela', 'Lucas', 'Antonella', 'Felipe', 'Daniela'];

  const competitors: CompetitorScript[] = names.map((name, i) => {
    const a = slotAngle(i);
    const faceCenter = a + Math.PI;
    if (i === CHASER) {
      return {
        appearance: appearance(i, { id: `circle_${i}`, name, role: 'jugador', hatType: 'beret', ...team }),
        track: buildTrack(chaserPos, duration, {
          initialHeading: faceCenter,
          face: (t) => (t < tDrop + 0.2 ? faceCenter : t < tReact + 0.3 ? a + Math.PI / 2 : undefined),
          maxTurnRate: 7,
        }),
        pose: poseTimeline([{ t: 0, pose: 'behind' }, { t: tDrop + 0.35, pose: 'swing' }]),
        holdingChicote: (t) => t >= tDrop,
        label: labelTimeline([
          { t: 0 }, { t: tDrop, label: '¡Recibe el chicote!' }, { t: tReact, label: 'Persigue al corredor' }, { t: tSeat, label: 'Nuevo corredor' },
        ]),
      };
    }
    return {
      appearance: appearance(i, { id: `circle_${i}`, name, role: i === 0 ? 'lider' : 'jugador', hatType: i % 3 === 0 ? 'four_dents' : 'beret', ...team }),
      track: buildTrack(() => polar(a, R_IN), duration, { initialHeading: faceCenter, face: () => faceCenter }),
      pose: poseTimeline([{ t: 0, pose: 'behind' }]),
    };
  });

  competitors.push({
    appearance: appearance(11, { id: 'chicote_runner', name: 'Nicolás', role: 'corredor', hatType: 'four_dents', teamName: 'Grupo', teamColor: '#DC2626', secondaryColor: '#F8FAFC' }),
    track: buildTrack(runnerPos, duration, {
      initialHeading: runnerStartAngle + Math.PI / 2,
      face: (t) => (t > tSeat ? chaserAngle + Math.PI : undefined),
    }),
    pose: poseTimeline([
      { t: 0, pose: 'swing' }, { t: tDrop - 0.35, pose: 'tag' }, { t: tDrop + 0.2, pose: 'swing' }, { t: tSeat + 0.1, pose: 'behind' },
    ]),
    holdingChicote: (t) => t < tDrop,
    label: labelTimeline([
      { t: 0, label: 'Trota con el chicote' }, { t: tDrop - 0.8, label: 'Lo deja en silencio' },
      { t: tDrop + 0.3, label: '¡Huye por fuera!' }, { t: tSeat - 0.6, label: '¡Ocupa el lugar vacío!' },
    ]),
  });

  return {
    id: 'circle',
    duration,
    focusId: 'chicote_runner',
    field: {
      width: 16,
      depth: 16,
      midline: false,
      circle: { center: { x: 0, z: 0 }, radius: R_IN },
      zones: [],
      trees: [
        { x: -9.5, z: -6.5, height: 6, canopyRadius: 2.2, foliageColor: '#2F5D2A' },
        { x: 9.8, z: 6.2, height: 5.2, canopyRadius: 1.9, foliageColor: '#33652C' },
      ],
    },
    competitors,
    flags: () => [],
    chicote: (t) => ({ carrierId: t < tDrop ? 'chicote_runner' : `circle_${CHASER}` }),
  };
}
