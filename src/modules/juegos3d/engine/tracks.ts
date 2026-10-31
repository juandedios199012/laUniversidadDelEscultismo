import { ArmPose, Stance, StanceBlend, Vec2 } from './types';

/**
 * Utilidades de trayectorias deterministas.
 *
 * Cada competidor se describe como una función posición(t). `buildTrack` la muestrea una sola vez
 * (60 Hz) y deriva lo que un cuerpo real necesita para no "patinar":
 *  - heading a partir de la velocidad (con giro máximo limitado, como un humano),
 *  - velocidad en m/s,
 *  - fase de marcha proporcional a la DISTANCIA recorrida (no al tiempo).
 * Como todo es función del tiempo, la línea de tiempo y el flipbook pueden saltar a cualquier instante.
 */

export const SAMPLE_RATE = 60;

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const smoothstep = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function angleDelta(from: number, to: number) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Longitud de un ciclo completo de marcha (2 pasos) según la velocidad, en metros. */
export function gaitCycleLength(speed: number) {
  return clamp(0.8 + 0.5 * speed, 1.1, 3.4);
}

export interface Track {
  duration: number;
  xs: Float32Array;
  zs: Float32Array;
  headings: Float32Array;
  speeds: Float32Array;
  phases: Float32Array;
}

export interface TrackSample {
  pos: Vec2;
  heading: number;
  speed: number;
  gaitPhase: number;
}

export interface BuildTrackOptions {
  /** Si devuelve un número, el competidor mira hacia ese ángulo aunque se mueva (o esté quieto). */
  face?: (t: number) => number | undefined;
  /** Heading inicial si empieza quieto. */
  initialHeading?: number;
  /** Hacia dónde mira cuando está quieto (si no se indica, conserva la última dirección). */
  idleHeading?: number;
  /** Velocidad angular máxima de giro del cuerpo (rad/s). */
  maxTurnRate?: number;
}

export function buildTrack(posFn: (t: number) => Vec2, duration: number, opts: BuildTrackOptions = {}): Track {
  const n = Math.ceil(duration * SAMPLE_RATE) + 1;
  const dt = 1 / SAMPLE_RATE;
  const xs = new Float32Array(n);
  const zs = new Float32Array(n);
  const headings = new Float32Array(n);
  const speeds = new Float32Array(n);
  const phases = new Float32Array(n);
  const maxTurn = (opts.maxTurnRate ?? 6) * dt;
  const h = 0.02;

  let heading = opts.initialHeading ?? 0;
  let phase = 0;
  let first = true;

  for (let i = 0; i < n; i++) {
    const t = Math.min(i * dt, duration);
    const p = posFn(t);
    const a = posFn(Math.max(0, t - h));
    const b = posFn(Math.min(duration, t + h));
    const span = Math.min(duration, t + h) - Math.max(0, t - h);
    const vx = (b.x - a.x) / span;
    const vz = (b.z - a.z) / span;
    const speed = Math.hypot(vx, vz);

    const forced = opts.face?.(t);
    let target = heading;
    if (forced !== undefined) target = forced;
    else if (speed > 0.15) target = Math.atan2(vz, vx);
    else if (opts.idleHeading !== undefined) target = opts.idleHeading;

    if (first) {
      heading = opts.initialHeading ?? target;
      first = false;
    } else {
      heading += clamp(angleDelta(heading, target), -maxTurn, maxTurn);
    }

    if (i > 0) {
      const ds = Math.hypot(p.x - xs[i - 1], p.z - zs[i - 1]);
      phase += (ds / gaitCycleLength(speed)) * Math.PI * 2;
    }

    xs[i] = p.x;
    zs[i] = p.z;
    headings[i] = heading;
    speeds[i] = speed;
    phases[i] = phase;
  }

  return { duration, xs, zs, headings, speeds, phases };
}

export function sampleTrack(track: Track, t: number): TrackSample {
  const f = clamp(t, 0, track.duration) * SAMPLE_RATE;
  const i = Math.min(Math.floor(f), track.xs.length - 2);
  const k = f - i;
  return {
    pos: { x: lerp(track.xs[i], track.xs[i + 1], k), z: lerp(track.zs[i], track.zs[i + 1], k) },
    heading: track.headings[i] + angleDelta(track.headings[i], track.headings[i + 1]) * k,
    speed: lerp(track.speeds[i], track.speeds[i + 1], k),
    gaitPhase: lerp(track.phases[i], track.phases[i + 1], k),
  };
}

// -----------------------------------------------------------------------------
// Curvas parametrizadas por longitud de arco (velocidad constante real sobre la curva)
// -----------------------------------------------------------------------------

export interface ArcPath {
  length: number;
  at: (s: number) => Vec2;
}

/** Spline Catmull-Rom por los puntos, re-parametrizada por metros recorridos. */
export function makeArcPath(points: Vec2[], samplesPerSegment = 120): ArcPath {
  const pts: Vec2[] = [];
  const segs = points.length - 1;
  for (let s = 0; s < segs; s++) {
    const p0 = points[Math.max(0, s - 1)];
    const p1 = points[s];
    const p2 = points[s + 1];
    const p3 = points[Math.min(segs, s + 2)];
    for (let j = 0; j < samplesPerSegment; j++) {
      const t = j / samplesPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const cr = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      pts.push({ x: cr(p0.x, p1.x, p2.x, p3.x), z: cr(p0.z, p1.z, p2.z, p3.z) });
    }
  }
  pts.push(points[points.length - 1]);

  const cum = new Float64Array(pts.length);
  for (let i = 1; i < pts.length; i++) {
    cum[i] = cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
  }
  const length = cum[cum.length - 1];

  const at = (s: number): Vec2 => {
    // Fuera de la curva se extrapola en línea recta con la tangente del extremo
    if (s <= 0) {
      const dx = pts[1].x - pts[0].x, dz = pts[1].z - pts[0].z, d = Math.hypot(dx, dz);
      return { x: pts[0].x + (dx / d) * s, z: pts[0].z + (dz / d) * s };
    }
    if (s >= length) {
      const a = pts[pts.length - 2], b = pts[pts.length - 1];
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
      return { x: b.x + (dx / d) * (s - length), z: b.z + (dz / d) * (s - length) };
    }
    let lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < s) lo = mid; else hi = mid;
    }
    const k = (s - cum[lo]) / (cum[hi] - cum[lo] || 1);
    return { x: lerp(pts[lo].x, pts[hi].x, k), z: lerp(pts[lo].z, pts[hi].z, k) };
  };

  return { length, at };
}

/** Perfil de velocidad trapezoidal: arranca, mantiene crucero y frena. Devuelve distancia s(t). */
export function trapezoidProfile(distance: number, cruise: number, rampTime: number, startTime: number) {
  const accel = cruise / rampTime;
  const rampDist = 0.5 * accel * rampTime * rampTime;
  const cruiseTime = Math.max(0, (distance - 2 * rampDist) / cruise);
  const endTime = startTime + 2 * rampTime + cruiseTime;
  const s = (t: number) => {
    const u = t - startTime;
    if (u <= 0) return 0;
    if (u < rampTime) return 0.5 * accel * u * u;
    if (u < rampTime + cruiseTime) return rampDist + cruise * (u - rampTime);
    if (u < 2 * rampTime + cruiseTime) {
      const r = u - rampTime - cruiseTime;
      return rampDist + cruise * cruiseTime + cruise * r - 0.5 * accel * r * r;
    }
    return distance;
  };
  return { s, endTime };
}

/** Integra un perfil de velocidad v(t) y devuelve s(t) tabulado (para recorridos circulares). */
export function integrateSpeed(v: (t: number) => number, duration: number) {
  const step = 1 / 240;
  const n = Math.ceil(duration / step) + 1;
  const table = new Float64Array(n);
  for (let i = 1; i < n; i++) table[i] = table[i - 1] + v((i - 0.5) * step) * step;
  const s = (t: number) => {
    const f = clamp(t, 0, duration) / step;
    const i = Math.min(Math.floor(f), n - 2);
    return lerp(table[i], table[i + 1], f - i);
  };
  /** Primer instante en que la distancia alcanza `target`. */
  const timeAt = (target: number) => {
    for (let i = 1; i < n; i++) if (table[i] >= target) return i * step;
    return duration;
  };
  return { s, timeAt };
}

// -----------------------------------------------------------------------------
// Fotogramas clave (posición, escalares, posturas)
// -----------------------------------------------------------------------------

export interface PosKey { t: number; x: number; z: number }

/** Interpolación Hermite en el tiempo; las pausas (dos claves en el mismo lugar) son quietud real. */
export function keyframePath(keys: PosKey[]): (t: number) => Vec2 {
  const n = keys.length;
  // Los tiempos deben ir en orden: si no, la persona "salta" por el campo
  for (let i = 1; i < n; i++) {
    if (keys[i].t < keys[i - 1].t) {
      throw new Error(`Coreografía inválida: la clave ${i} (t=${keys[i].t}) es anterior a la clave ${i - 1} (t=${keys[i - 1].t})`);
    }
  }
  const tangents = keys.map((k, i) => {
    if (i === 0 || i === n - 1) return { x: 0, z: 0 };
    const prev = keys[i - 1], next = keys[i + 1];
    const still = (a: PosKey, b: PosKey) => Math.hypot(a.x - b.x, a.z - b.z) < 1e-3;
    if (still(prev, k) || still(k, next)) return { x: 0, z: 0 };
    const dt = next.t - prev.t;
    return { x: (next.x - prev.x) / dt, z: (next.z - prev.z) / dt };
  });

  return (t: number) => {
    if (t <= keys[0].t) return { x: keys[0].x, z: keys[0].z };
    if (t >= keys[n - 1].t) return { x: keys[n - 1].x, z: keys[n - 1].z };
    let i = 0;
    while (i < n - 2 && t > keys[i + 1].t) i++;
    const a = keys[i], b = keys[i + 1];
    const d = b.t - a.t;
    const u = (t - a.t) / d;
    const u2 = u * u, u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
    return {
      x: h00 * a.x + h10 * d * tangents[i].x + h01 * b.x + h11 * d * tangents[i + 1].x,
      z: h00 * a.z + h10 * d * tangents[i].z + h01 * b.z + h11 * d * tangents[i + 1].z,
    };
  };
}

export function scalarKeys(keys: { t: number; v: number }[]) {
  return (t: number) => {
    if (t <= keys[0].t) return keys[0].v;
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t <= b.t) return lerp(a.v, b.v, smoothstep((t - a.t) / (b.t - a.t)));
    }
    return keys[keys.length - 1].v;
  };
}

/** Línea de tiempo de estados discretos con transición suave entre el anterior y el nuevo. */
function blendTimeline<T>(keys: { t: number; value: T }[], blend: number) {
  return (t: number): { from: T; to: T; w: number } => {
    let i = 0;
    while (i < keys.length - 1 && t >= keys[i + 1].t) i++;
    const cur = keys[i];
    const prev = keys[Math.max(0, i - 1)];
    if (i === 0 || t < cur.t) return { from: cur.value, to: cur.value, w: 1 };
    return { from: prev.value, to: cur.value, w: smoothstep((t - cur.t) / blend) };
  };
}

export function poseTimeline(keys: { t: number; pose: ArmPose }[], blend = 0.35) {
  return blendTimeline(keys.map((k) => ({ t: k.t, value: k.pose })), blend);
}

/** Postura de cuerpo en el tiempo (p. ej. corre de pie, se arrodilla en el destino, se levanta). */
export function stanceTimeline(keys: { t: number; stance: Stance }[], blend = 0.45): (t: number) => StanceBlend {
  return blendTimeline(keys.map((k) => ({ t: k.t, value: k.stance })), blend);
}

/** Etiquetas por intervalos: [{t, label}] — la etiqueta vale hasta la siguiente clave. */
export function labelTimeline(keys: { t: number; label?: string }[]) {
  return (t: number) => {
    let label: string | undefined;
    for (const k of keys) if (t >= k.t) label = k.label;
    return label;
  };
}
