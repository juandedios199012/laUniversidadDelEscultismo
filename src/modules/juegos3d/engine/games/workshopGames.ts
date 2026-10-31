import { ArmPose, FocalProp, Stance, Vec2 } from '../types';
import { GameDefinition } from './common';
import { Activity, CENTER, P, PersonSpec, buildCornerScene, holding, instructing, pose, ring, route, still } from './dsl';
import { createWorkshopScene } from './workshop';

/**
 * TALLERES POR RINCONES (trípode, manualidades, fogata, mosaico, primeros auxilios, carpa):
 * cada juego con su actividad concreta, detectada de las reglas. Coordenadas locales del rincón.
 */

const D = 20;
const L = { role: 'lider' as const, hat: 'four_dents' as const };
/** Persona quieta trabajando en una postura. */
const worker = (x: number, z: number, stance: Stance, face: Vec2 | number = CENTER, extra: Partial<PersonSpec> = {}): PersonSpec => ({
  path: still(x, z), face, stances: [{ t: 0, stance }], poses: pose('work'), ...extra,
});
const leader = (x: number, z: number, labels: string[], times = [3, 11]): PersonSpec => ({
  ...L, path: still(x, z), face: CENTER, poses: instructing(times), labels: labels.map((label, i) => ({ t: i * (D / labels.length), label })),
});
/** Ir y volver repetidamente entre dos puntos (traer material), agachándose en el origen. */
const fetcher = (from: Vec2, to: Vec2, period: number, offset = 0, carry: PersonSpec['handProp'] = 'twig'): PersonSpec => {
  const keys: [number, number, number][] = [[0, to.x, to.z]];
  const stances: { t: number; stance: Stance }[] = [{ t: 0, stance: 'stand' }];
  for (let t = offset; t < D - period; t += period) {
    keys.push([t + 0.2, to.x, to.z], [t + period * 0.35, from.x, from.z], [t + period * 0.55, from.x, from.z], [t + period * 0.9, to.x, to.z]);
    stances.push({ t: t + period * 0.36, stance: 'squat' }, { t: t + period * 0.54, stance: 'stand' });
  }
  keys.push([D, to.x, to.z]);
  return { path: route(...keys), stances, poses: pose('swing'), handProp: carry };
};
const ringPiece = (r: number, n: number): Activity['pieces'] =>
  ring(n, r).map((p, i, all) => ({ kind: 'rope_line' as const, at: p, to: all[(i + 1) % n], height: 0.06 }));
const cycle = (poses: ArmPose[], every: number, start = 0) => poses.map((p, i) => ({ t: start + i * every, pose: p }));

const ACTIVITIES: Record<string, Activity> = {
  // ---------------- Trípode y pionerismo ----------------
  axe_area: {
    focus: 1,
    pieces: [{ kind: 'logs', at: CENTER, count: 1 }, { kind: 'blade', at: P(0.2, 0.1) }, ...(ringPiece(1.5, 10) ?? [])],
    people: [
      leader(-2.1, 1.6, ['Área de hachero: 3 m de radio', 'Nadie entra mientras se corta']),
      { path: (t) => { const a = Math.PI / 2 + Math.min(t, 16) * 0.39; return P(Math.cos(a) * 1.55, Math.sin(a) * 1.55); }, stances: [{ t: 0, stance: 'squat' }], poses: pose('work'), handProp: 'rope', labels: [{ t: 0, label: 'Tiende la cuerda perimétrica' }] },
      { path: still(1.9, 1.9), face: CENTER, poses: pose('frozen'), labels: [{ t: 0, label: 'Espera fuera del área' }] },
      { path: still(-0.4, 2.1), face: CENTER, poses: pose('swing') },
      { path: still(2.2, -0.8), face: CENTER, poses: pose('swing') },
    ],
  },
  semaphore_tower: {
    focus: 1,
    people: [
      leader(1.8, 1.6, ['Ángulos de reloj = letras', 'La base anota cada letra']),
      { name: 'Emisor', path: still(0, -1.9), face: P(0, 2), poses: cycle(['cheer', 'frozen', 'tag', 'salute', 'cheer', 'frozen', 'tag', 'salute', 'frozen', 'cheer'], 2), labels: [{ t: 0, label: 'Letra «S»' }, { t: 4, label: 'Letra «E»' }, { t: 8, label: 'Letra «Ñ»' }, { t: 12, label: 'Letra «A»' }, { t: 16, label: 'Letra «L»' }] },
      { name: 'Receptor', path: still(0, 0.4), face: P(0, -1.9), poses: cycle(['frozen', 'cheer', 'salute', 'tag', 'frozen', 'cheer', 'salute', 'tag', 'cheer', 'frozen'], 2, 0.6) },
      worker(-0.8, 1.7, 'sit', P(0, -1.9), { poses: pose('work'), handProp: 'pencil' }),
      worker(0.6, 1.8, 'sit', P(0, -1.9), { poses: pose('measure'), handProp: 'notebook' }),
    ],
  },
  mast_anchor: {
    pieces: [
      { kind: 'post', at: CENTER },
      ...ring(3, 1.8, Math.PI / 2).flatMap((s) => [{ kind: 'stake' as const, at: s, count: 1 }, { kind: 'rope_line' as const, at: P(0, 0), to: s, height: 0.9 }]),
    ],
    people: [
      leader(-2.1, -1.2, ['Ballestrinque al mástil', 'Tensa los vientos parejos']),
      { path: still(0.35, 0.2), face: CENTER, poses: pose('hold'), labels: [{ t: 0, label: 'Sostiene el mástil' }] },
      ...ring(3, 2.05, Math.PI / 2).map((s) => worker(s.x, s.z, 'kneel', CENTER, { handProp: 'rope' })),
    ],
  },
  water_tripod: {
    focal: 'pioneering_tripod',
    items: [{ kind: 'bucket', path: (t) => P(Math.sin(t * 1.3) * 0.06, Math.cos(t * 1.1) * 0.05), height: 1.05, count: 1 }],
    people: [
      leader(0.3, 2.1, ['Olla colgada del trípode', '¡Sin derramar una gota!']),
      ...ring(3, 0.95, Math.PI / 6).map((s, i) => ({ path: still(s.x, s.z), face: CENTER, poses: pose('hold' as ArmPose), labels: i === 0 ? [{ t: 0, label: 'Sostiene una pata' }] : undefined })),
      { path: still(-1.8, 1.2), face: CENTER, poses: pose('measure'), handProp: 'notebook' },
    ],
  },
  washstand: {
    focal: 'pioneering_tripod',
    items: [{ kind: 'water', path: still(0, 0), height: 1.05, count: 1 }],
    pieces: [{ kind: 'staff', at: P(1.3, -0.9), count: 3, height: 0.35, rotation: 0.6 }, { kind: 'bucket', at: P(0, 0.1), count: 1 }],
    people: [
      leader(-1.9, 1.4, ['Botella invertida para lavarse', 'Zapatero elevado del suelo']),
      { path: still(0, 0.55), face: CENTER, poses: pose('work'), labels: [{ t: 0, label: 'Se lava las manos' }] },
      { path: route([0, 1.8, 1.6], [4, 1.8, 1.6], [7, 0.45, 0.4], [10, 0.45, 0.4], [13, 1.8, 1.6], [D, 1.8, 1.6]), face: CENTER, faceWhenStill: true, poses: [{ t: 0, pose: 'carry' }, { t: 7, pose: 'hold' }, { t: 10, pose: 'swing' }], labels: [{ t: 4, label: 'Rellena la botella' }] },
      worker(1.5, -1.3, 'kneel', P(1.3, -0.9), { handProp: 'rope' }),
    ],
  },
  latrine: {
    pieces: [{ kind: 'sand', at: P(0, -0.3) }, { kind: 'post', at: P(1.1, -1.3) }, { kind: 'tape', at: P(-0.2, -1.6) }],
    people: [
      leader(-1.9, 1.5, ['Trinchera individual', 'Cubrir con tierra y señalizar']),
      worker(-0.4, 0.4, 'squat', P(-0.2, -0.3), { handProp: 'mallet' }),
      worker(0.5, 0.45, 'kneel', P(0.2, -0.3), { handProp: 'mallet' }),
      { path: route([0, 2, 0.8], [5, 2, 0.8], [8, 1.4, -1], [D, 1.4, -1]), face: P(1.1, -1.3), faceWhenStill: true, poses: [{ t: 0, pose: 'carry' }, { t: 8, pose: 'hold' }], labels: [{ t: 8, label: 'Bordón de privacidad' }] },
    ],
  },
  trash_tripod: {
    focal: 'pioneering_tripod',
    items: [{ kind: 'sack', path: still(0, 0), height: 0.75, count: 1 }],
    people: [
      leader(-1.9, 1.5, ['Basurero de trípode con bolsa', 'Para todas las reuniones']),
      worker(0.75, 0.55, 'squat', CENTER, { handProp: 'rope', labels: [{ t: 0, label: 'Amarra la bolsa' }] }),
      ...ring(2, 1, Math.PI).map((s) => ({ path: still(s.x, s.z), face: CENTER, poses: pose('hold' as ArmPose) })),
      { path: route([0, 2.1, 1.8], [8, 2.1, 1.8], [11, 0.4, 0.6], [12.5, 0.4, 0.6], [15, 2.1, 1.8], [D, 2.1, 1.8]), face: CENTER, faceWhenStill: true, poses: [{ t: 0, pose: 'swing' }, { t: 11, pose: 'tag' }, { t: 12.5, pose: 'swing' }], handProp: holding([0, 11.5, 'twig']), labels: [{ t: 11, label: 'Primera basura al tacho' }] },
    ],
  },

  // ---------------- Manualidades y servicio ----------------
  banner_care: {
    pieces: [{ kind: 'flag', at: P(0, -0.4) }],
    people: [
      leader(-1.8, 1.3, ['Colores y cintas de mérito', 'Muescas en el bordón']),
      { path: still(0.55, 0.05), face: P(0, -0.4), poses: [{ t: 0, pose: 'tag' }, { t: 6, pose: 'measure' }, { t: 12, pose: 'tag' }], labels: [{ t: 0, label: 'Revisa las cintas' }] },
      worker(-0.6, 0.6, 'sit', P(-0.6, 0), { handProp: 'stick', labels: [{ t: 0, label: 'Talla muescas en el bordón' }] }),
      worker(0.6, 1.2, 'sit', P(0, -0.4), { poses: pose('measure'), handProp: 'notebook' }),
      { path: still(-0.4, -1.4), face: P(0, -0.4), poses: pose('tag') },
    ],
  },
  tool_demo: {
    pieces: [{ kind: 'crossed_staffs', at: P(0, -0.7) }, { kind: 'logs', at: P(0, -0.7), height: 0.85, count: 1 }],
    people: [
      leader(-1.9, 1.3, ['Transporte con funda', 'Entregar con el mango primero']),
      { path: still(0, -0.15), face: P(0, -0.7), poses: pose('work'), handProp: 'stick', labels: [{ t: 0, label: 'Corta con la sierra de arco' }] },
      { path: still(-0.7, 1.1), face: P(0.7, 1.1), poses: [{ t: 0, pose: 'swing' }, { t: 4, pose: 'tag' }, { t: 6, pose: 'swing' }, { t: 12, pose: 'tag' }, { t: 14, pose: 'swing' }], handProp: holding([0, 5, 'mallet'], [13, D, 'mallet']), labels: [{ t: 4, label: 'Entrega con el mango primero' }] },
      { path: still(0.7, 1.1), face: P(-0.7, 1.1), poses: [{ t: 0, pose: 'swing' }, { t: 4.6, pose: 'tag' }, { t: 6, pose: 'swing' }, { t: 12, pose: 'tag' }, { t: 13, pose: 'swing' }], handProp: holding([5, 13, 'mallet']) },
      { path: still(1.6, -0.4), face: P(0, -0.7), poses: pose('swing') },
    ],
  },
  park_cleanup: {
    pieces: [{ kind: 'litter', at: P(0, -0.6) }, { kind: 'sack', at: P(1.6, 1.4), count: 2 }, { kind: 'natural', at: P(-1, -1.2) }],
    people: [
      leader(-1.9, 1.5, ['Retirar piedras peligrosas', 'Jardineras limpias']),
      fetcher(P(-0.8, -1.1), P(1.4, 1.2), 6, 0, 'stone'),
      fetcher(P(0.4, -0.9), P(1.6, 1.0), 7, 1.5, 'stone'),
      worker(-0.3, 0.2, 'squat', P(0, -0.6), { handProp: 'twig', labels: [{ t: 0, label: 'Limpia la jardinera' }] }),
      { path: route([0, 0.8, 0.3], [5, -0.6, 0.9], [10, 0.6, -0.2], [15, -0.4, -0.6], [D, 0.8, 0.3]), poses: pose('hold'), handProp: 'stick' },
    ],
  },
  herbarium: {
    pieces: [{ kind: 'paper', at: P(0, 0), height: 0.02 }, { kind: 'paper', at: P(0.05, 0.02), height: 0.04 }, { kind: 'board', at: P(-0.6, 0.2) }, { kind: 'natural', at: P(0.7, -0.4) }],
    items: [{ kind: 'notebook', path: still(0, 0), height: (t) => (t < 12 ? 0.3 : 0.06), count: 1 }],
    people: [
      leader(-1.8, 1.4, ['Hojas entre papel periódico', 'Prensar para el Libro de Oro'], [3, 12]),
      worker(0.6, 0.6, 'sit', CENTER, { handProp: 'twig', labels: [{ t: 0, label: 'Acomoda una hoja' }] }),
      worker(-0.6, 0.65, 'sit', CENTER, { handProp: 'twig' }),
      worker(0, -0.7, 'kneel', CENTER, { poses: [{ t: 0, pose: 'swing' }, { t: 11, pose: 'work' }], labels: [{ t: 11, label: 'Pone peso encima' }] }),
      worker(0.9, -0.5, 'squat', P(0.7, -0.4), { handProp: 'twig' }),
    ],
  },
  tradition_fair: {
    pieces: [{ kind: 'flag', at: P(0, -1.8) }],
    people: [
      leader(1.9, 1.5, ['Danza tradicional de otro país', '¡Aplausos para el equipo!']),
      ...[0, 1, 2].map((i) => ({
        path: (t: number) => { const a = (i / 3) * Math.PI * 2 + t * 0.8; return P(Math.cos(a) * 0.8, Math.sin(a) * 0.8 - 0.3); },
        poses: cycle(['cheer', 'frozen', 'salute', 'cheer', 'frozen', 'salute', 'cheer', 'frozen', 'salute', 'cheer'], 2, i * 0.3),
        labels: i === 0 ? [{ t: 0, label: 'Danza de la cosecha' }] : undefined,
      })),
      worker(-1.5, 1.6, 'sit', CENTER, { poses: cycle(['swing', 'cheer', 'swing', 'cheer', 'swing', 'cheer'], 3.3) }),
    ],
  },
  wali_board: {
    pieces: [{ kind: 'board', at: CENTER }, { kind: 'natural', at: P(0.3, 0), height: 0.03 }],
    people: [
      leader(1.8, 1.4, ['Estrategia de semillas', 'Turno por turno, concentración']),
      worker(0, -0.55, 'kneel', CENTER, { poses: [{ t: 0, pose: 'work' }, { t: 5, pose: 'measure' }, { t: 10, pose: 'work' }, { t: 15, pose: 'measure' }], handProp: 'stone', labels: [{ t: 0, label: 'Jugador 1: siembra' }, { t: 5 }] }),
      worker(0, 0.55, 'kneel', CENTER, { poses: [{ t: 0, pose: 'measure' }, { t: 5, pose: 'work' }, { t: 10, pose: 'measure' }, { t: 15, pose: 'work' }], handProp: 'stone', labels: [{ t: 5, label: 'Jugador 2: captura' }, { t: 10 }] }),
      worker(-0.9, 0.9, 'sit', CENTER, { poses: pose('swing') }),
      worker(0.9, 0.9, 'sit', CENTER, { poses: pose('swing') }),
    ],
  },

  // ---------------- Fogata ----------------
  kindling_sort: {
    pieces: [
      { kind: 'natural', at: P(-0.8, 0.2) }, { kind: 'staff', at: P(0, 0.2), count: 2 }, { kind: 'logs', at: P(0.8, 0.2), count: 2 },
      { kind: 'natural', at: P(-1.6, -1.6) }, { kind: 'natural', at: P(1.4, -1.8) }, { kind: 'natural', at: P(0, -2.1) },
    ],
    people: [
      leader(-2, 1.6, ['Yesca: grosor de fideo', 'Medianas: grosor de lápiz', 'Troncos: grosor de muñeca']),
      fetcher(P(-1.5, -1.5), P(-0.8, 0.6), 5.5, 0),
      fetcher(P(0, -2), P(0, 0.65), 6.2, 1),
      fetcher(P(1.4, -1.7), P(0.8, 0.6), 7, 0.5, 'stick'),
      worker(0, 1.2, 'kneel', P(0, 0.2), { labels: [{ t: 0, label: 'Clasifica por grosor' }] }),
    ],
  },
  mirror_mime: {
    focus: 1,
    people: [
      leader(1.9, -1.4, ['Espejo mágico: imitar al unísono'], [5]),
      { name: 'Representante', path: still(0, -0.9), face: P(0, 1), poses: cycle(['cheer', 'tag', 'chair', 'frozen', 'salute', 'carry', 'cheer', 'crossed', 'tag', 'frozen'], 2), labels: [{ t: 0, label: 'Gestos de personajes de campamento' }] },
      ...[-1.0, -0.35, 0.35, 1.0].map((x) => ({ path: still(x, 0.9), face: P(x, -1), poses: cycle(['cheer', 'tag', 'chair', 'frozen', 'salute', 'carry', 'cheer', 'crossed', 'tag', 'frozen'], 2, 0.35) })),
    ].slice(0, 5),
  },
  fire_build: {
    pieces: [{ kind: 'fire', at: CENTER }, { kind: 'natural', at: P(0.7, 0.5) }, { kind: 'logs', at: P(-0.9, 0.6), count: 2 }],
    people: [
      leader(-1.8, 1.6, ['Pirámide con entrada de aire', 'Tiro de oxígeno abajo']),
      worker(0.55, 0.35, 'kneel', CENTER, { handProp: 'twig', labels: [{ t: 0, label: 'Arma la pirámide' }] }),
      worker(-0.55, 0.35, 'kneel_both', CENTER, { handProp: 'twig' }),
      worker(0, -0.65, 'squat', CENTER, { poses: [{ t: 0, pose: 'measure' }, { t: 8, pose: 'tag' }], labels: [{ t: 8, label: 'Revisa la entrada de aire' }] }),
      fetcher(P(-0.9, 0.6), P(-0.6, -0.6), 6.5, 1.5, 'stick'),
    ],
  },
  skit: {
    focal: 'campfire_cooking',
    people: [
      { ...L, path: still(0, 1.9), face: CENTER, stances: [{ t: 0, stance: 'sit' }], poses: [{ t: 0, pose: 'swing' }, { t: 17, pose: 'cheer' }], labels: [{ t: 0, label: 'Público del skit' }] },
      { path: route([0, -1.1, -1.1], [4, -0.3, -1.4], [8, 0.8, -1.1], [12, 0.2, -1.5], [16, -0.9, -1.2], [D, -0.9, -1.2]), face: P(0, 1.9), poses: cycle(['tag', 'cheer', 'frozen', 'carry', 'salute', 'cheer', 'tag', 'frozen', 'cheer', 'salute'], 2), labels: [{ t: 0, label: 'Escena: la carpa que se voló' }] },
      { path: route([0, 1.1, -1.2], [5, 0.4, -1.6], [9, -0.7, -1.4], [13, 0.9, -1.3], [D, 1.1, -1.2]), face: P(0, 1.9), stances: [{ t: 0, stance: 'stand' }, { t: 9, stance: 'kneel' }, { t: 12, stance: 'stand' }], poses: cycle(['frozen', 'chair', 'cheer', 'tag', 'carry', 'cheer', 'frozen', 'salute', 'tag', 'cheer'], 2, 1) },
      worker(-1.2, 1.6, 'sit', CENTER, { poses: [{ t: 0, pose: 'swing' }, { t: 17, pose: 'cheer' }] }),
      worker(1.2, 1.6, 'sit', CENTER, { poses: [{ t: 0, pose: 'swing' }, { t: 17, pose: 'cheer' }] }),
    ],
  },

  // ---------------- Suelo: observación y figuras ----------------
  park_detective: {
    pieces: [{ kind: 'natural', at: P(-1.2, -1.2) }, { kind: 'natural', at: P(1.3, 0.8) }],
    people: [
      leader(-2, 1.7, ['Inspección del rincón vecino', '¡Cero rastros: Guardianes de la Tierra!']),
      ...[0, 1, 2].map((i) => {
        const pts = ring(5, 1.5, i * 1.2);
        const keys: [number, number, number][] = [];
        pts.forEach((p, k) => keys.push([k * 4 + i * 0.4, p.x, p.z], [k * 4 + 2 + i * 0.4, p.x, p.z]));
        keys.push([D, pts[0].x, pts[0].z]);
        return {
          path: route(...keys), stances: pts.flatMap((_, k) => [{ t: k * 4 + i * 0.4 + 0.1, stance: 'squat' as const }, { t: k * 4 + 1.9 + i * 0.4, stance: 'stand' as const }]),
          poses: pose('work' as ArmPose), labels: i === 0 ? [{ t: 0, label: 'Busca cáscaras, papeles, ramas' }] : undefined,
        };
      }),
      worker(1.8, 1.7, 'stand', CENTER, { poses: pose('measure'), handProp: 'notebook' }),
    ],
  },
  leaf_hunt: {
    pieces: [{ kind: 'table', at: P(0, 1.1), rotation: 0 }, { kind: 'natural', at: P(-1.7, -1.9) }, { kind: 'natural', at: P(1.6, -1.8) }, { kind: 'natural', at: P(0, -2.2) }],
    people: [
      leader(-2, 1.9, ['Solo hojas caídas', 'Lisas, aserradas o lobuladas']),
      fetcher(P(-1.6, -1.8), P(-0.4, 0.65), 6, 0),
      fetcher(P(1.5, -1.7), P(0.4, 0.65), 6.6, 1.2),
      fetcher(P(0, -2.1), P(0, 0.6), 7.3, 0.6),
      { path: still(0.3, 1.65), face: P(0, 1.1), poses: pose('work'), labels: [{ t: 0, label: 'Clasifica por bordes' }] },
    ],
  },
  footprint_cast: {
    pieces: [{ kind: 'sand', at: P(0, -0.2) }, { kind: 'footprints', at: P(0, -0.2) }, { kind: 'bucket', at: P(1, -0.8), count: 1 }, { kind: 'tape_measure', at: P(-0.8, 0.3) }],
    people: [
      leader(-1.9, 1.5, ['Largo y ancho de la huella', 'Dibujo a escala en la libreta']),
      worker(0.4, 0.45, 'kneel', P(0, -0.2), { handProp: 'pencil', labels: [{ t: 0, label: 'Calca la huella' }] }),
      worker(-0.5, 0.45, 'kneel_both', P(0, -0.2), { poses: pose('measure'), labels: [{ t: 0, label: 'Mide: 24 × 9 cm' }] }),
      worker(1.3, -0.4, 'squat', P(1, -0.8), { labels: [{ t: 0, label: 'Prepara el yeso' }] }),
      worker(0, 1.4, 'sit', P(0, -0.2), { poses: pose('measure'), handProp: 'notebook' }),
    ],
  },
  constellation: {
    pieces: [P(0, -1.2), P(0, 0.4), P(-0.6, -0.5), P(0.7, -0.3), P(0.25, -0.1)].map((s) => ({ kind: 'natural' as const, at: s })),
    people: [
      { ...L, path: still(-1.9, 1.3), face: CENTER, poses: [{ t: 0, pose: 'swing' }, { t: 4, pose: 'cheer' }, { t: 6, pose: 'swing' }, { t: 13, pose: 'cheer' }, { t: 15, pose: 'swing' }], labels: [{ t: 0, label: 'La Cruz del Sur señala el sur' }, { t: 12, label: 'Prolonga el brazo largo 4,5 veces' }] },
      worker(0.5, -1.4, 'squat', P(0, -1.2), { handProp: 'stone' }),
      worker(-0.9, -0.3, 'kneel', P(-0.6, -0.5), { handProp: 'stone' }),
      worker(1.0, 0.1, 'squat', P(0.7, -0.3), { handProp: 'stone' }),
      fetcher(P(1.8, -1.9), P(0.3, 0.7), 6, 0.5, 'stone'),
    ],
  },

  // ---------------- Primeros auxilios ----------------
  woggle_sling: {
    people: [
      leader(-1.9, 1.5, ['Pasador de 3 vueltas', 'La pañoleta como cabestrillo']),
      worker(-0.6, 0.6, 'sit', CENTER, { handProp: 'rope', labels: [{ t: 0, label: 'Teje el pasador' }] }),
      worker(0.6, 0.65, 'sit', CENTER, { handProp: 'rope' }),
      { path: still(0, -0.7), face: P(0, 1), poses: pose('measure'), labels: [{ t: 0, label: 'Brazo en cabestrillo' }] },
      { path: still(0.45, -1.1), face: P(0, -0.7), poses: pose('work'), handProp: 'bandage', labels: [{ t: 0, label: 'Ata el cabestrillo' }] },
    ],
  },
  kit_inventory: {
    pieces: [{ kind: 'blanket', at: CENTER }, { kind: 'first_aid_kit', at: P(0, -0.2) }, { kind: 'cards', at: P(0.4, 0.25), height: 0.01 }, { kind: 'cards', at: P(-0.4, 0.3), height: 0.01 }],
    people: [
      leader(-1.9, 1.4, ['Inventario de insumos mínimos', 'Rótulos y fechas de caducidad']),
      worker(0.7, 0.5, 'sit', CENTER, { handProp: 'pencil', labels: [{ t: 0, label: 'Rotula con dibujos' }] }),
      worker(-0.7, 0.5, 'sit', CENTER, { poses: pose('measure'), handProp: 'notebook', labels: [{ t: 0, label: 'Lista: gasas, vendas, guantes' }] }),
      worker(0, -0.9, 'kneel', CENTER, { handProp: 'bandage' }),
      worker(0.95, -0.6, 'sit', CENTER, {}),
    ],
  },
  cold_ground: {
    pieces: [{ kind: 'fire', at: CENTER }, { kind: 'sand', at: CENTER }],
    people: [
      leader(-1.9, 1.5, ['Remover cenizas', 'Mano a 5 cm: ¿está frío?'], [3, 14]),
      worker(0.55, 0.35, 'squat', CENTER, { handProp: 'stick', labels: [{ t: 0, label: 'Remueve las cenizas' }] }),
      { path: route([0, 1.7, -1.4], [3, 1.7, -1.4], [6, 0.5, -0.5], [10, 0.5, -0.5], [13, 1.7, -1.4], [D, 1.7, -1.4]), face: CENTER, faceWhenStill: true, stances: [{ t: 0, stance: 'stand' }, { t: 6.2, stance: 'squat' }, { t: 9.8, stance: 'stand' }], poses: [{ t: 0, pose: 'carry' }, { t: 6.2, pose: 'work' }, { t: 10, pose: 'swing' }], labels: [{ t: 6.2, label: 'Rocía agua' }] },
      worker(-0.6, 0.2, 'kneel', CENTER, { poses: [{ t: 0, pose: 'swing' }, { t: 13, pose: 'tag' }], labels: [{ t: 13, label: 'Palma a 5 cm: ¡tierra fría!' }] }),
    ],
  },
  stretcher_build: {
    items: [{ kind: 'stretcher', path: route([0, 0, 0], [10, 0, 0], [16, 0, 2.0], [D, 0, 2.0]), height: (t) => (t < 10 ? 0 : 0.62), rotation: () => Math.PI / 2 }],
    people: [
      leader(-1.9, -1.4, ['Camisas al revés y bordones por las mangas', 'Traslado de prueba']),
      { path: route([0, 0.55, -0.8], [10, 0.55, -0.9], [16, 0.32, 1.1], [D, 0.32, 1.1]), face: P(0, 3), faceWhenStill: true, stances: [{ t: 0, stance: 'kneel' }, { t: 9.5, stance: 'stand' }], poses: [{ t: 0, pose: 'work' }, { t: 10, pose: 'chair' }], labels: [{ t: 0, label: 'Pasa el bordón por las mangas' }, { t: 10, label: '¡A la cuenta de tres, arriba!' }] },
      { path: route([0, -0.55, 0.8], [10, -0.3, 0.95], [16, -0.32, 2.9], [D, -0.32, 2.9]), face: P(0, 3), faceWhenStill: true, stances: [{ t: 0, stance: 'kneel' }, { t: 9.5, stance: 'stand' }], poses: [{ t: 0, pose: 'work' }, { t: 10, pose: 'chair' }] },
      { path: route([0, 1.4, 0.5], [9, 1.4, 0.5], [10, 0, -0.75], [16, 0, 1.25], [D, 0, 1.25]), face: Math.PI / 2, stances: [{ t: 0, stance: 'stand' }, { t: 9.8, stance: 'carried' }], poses: [{ t: 0, pose: 'swing' }], labels: [{ t: 0, label: 'Compañero liviano' }] },
      worker(-1.4, 0.6, 'kneel', CENTER, { poses: [{ t: 0, pose: 'work' }, { t: 10, pose: 'swing' }] }),
    ],
  },

  // ---------------- Carpa y herramientas ----------------
  knife_safety: {
    pieces: [{ kind: 'stake', at: P(0.2, -0.3), count: 4 }, { kind: 'logs', at: P(-1.2, -0.9), count: 1 }],
    people: [
      leader(1.9, 1.5, ['Cortaplumas cerrada para entregar', 'Tallar siempre hacia afuera']),
      worker(-0.5, 0.2, 'sit', P(-0.5, 1), { handProp: 'twig', labels: [{ t: 0, label: 'Talla la punta hacia afuera' }] }),
      worker(0.7, 0.3, 'sit', P(0.7, 1), { handProp: 'twig' }),
      { path: still(-0.5, -1.4), face: P(0.5, -1.4), poses: [{ t: 0, pose: 'swing' }, { t: 5, pose: 'tag' }, { t: 7, pose: 'swing' }], handProp: holding([0, 6, 'mallet']), labels: [{ t: 5, label: 'Entrega cerrada, mango primero' }] },
      { path: still(0.5, -1.4), face: P(-0.5, -1.4), poses: [{ t: 0, pose: 'swing' }, { t: 5.6, pose: 'tag' }, { t: 7, pose: 'swing' }], handProp: holding([6, D, 'mallet']) },
    ],
  },
};

/** Elemento focal por defecto de cada escena de taller (cuando el juego no tiene actividad propia). */
const DEFAULT_FOCAL: Partial<Record<string, FocalProp>> = {
  station_pioneering_tripod: 'pioneering_tripod',
  station_seed_bomb_craft: 'seed_bomb_craft',
  station_campfire_cooking: 'campfire_cooking',
  station_ground_mosaic: 'ground_mosaic',
  station_first_aid_stretcher: 'first_aid_stretcher',
  station_tent_assembly: 'tent_assembly',
};

export function createWorkshopGamesScene(scene: string, activity?: string | null): GameDefinition {
  const a = activity ? ACTIVITIES[activity] : undefined;
  if (a) return buildCornerScene(scene as Parameters<typeof buildCornerScene>[0], a);
  return createWorkshopScene(DEFAULT_FOCAL[scene] ?? 'cartography_table');
}

export const WORKSHOP_ACTIVITIES = Object.keys(ACTIVITIES);
