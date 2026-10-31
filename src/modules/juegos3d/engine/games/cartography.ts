import { GameDefinition } from './common';
import { Activity, CENTER, P, buildCornerScene, faceTo, holding, instructing, pose, ring, route, still } from './dsl';
import { createWorkshopScene } from './workshop';

/**
 * CARTOGRAFÍA, MEDICIÓN Y CONSEJO — un rincón por equipo; la actividad viene de las reglas del juego.
 * Coordenadas locales del rincón: +z mira al centro del campo.
 */

const L = { role: 'lider' as const, hat: 'four_dents' as const };
const sitRing = (n: number, r: number) => ring(n, r, Math.PI / 2);

const ACTIVITIES: Record<string, Activity> = {
  // Un representante corre a la zona neutra y elige la tarjeta del artículo que corresponde
  card_hunt: {
    focus: 1,
    pieces: [{ kind: 'cards', at: P(-0.3, -1.6) }, { kind: 'cards', at: P(0.3, -1.5) }, { kind: 'chalk', at: P(0, -1.55) }],
    people: [
      { ...L, path: still(1.6, 1.3), face: CENTER, poses: instructing([1, 10]), labels: [{ t: 0, label: 'Situación: ayudar a cruzar la pista' }, { t: 10, label: 'Nueva situación: cuidar el parque' }] },
      { path: route([0, 0, 1.6], [2, 0, 1.6], [4.2, 0, -1.1], [6.4, 0, -1.1], [8.6, 0, 1.4], [20, 0, 1.4]), face: P(0, 3), faceWhenStill: true, stances: [{ t: 0, stance: 'stand' }, { t: 4.2, stance: 'squat' }, { t: 6.2, stance: 'stand' }], poses: [{ t: 0, pose: 'swing' }, { t: 4.2, pose: 'work' }, { t: 8.6, pose: 'measure' }], handProp: holding([6.2, 12, 'notebook']), labels: [{ t: 2, label: 'Corre a la zona de tarjetas' }, { t: 4.2, label: 'Busca la ilustración' }, { t: 8.6, label: 'Explica el artículo' }, { t: 12 }] },
      { path: route([0, -0.7, 1.7], [11, -0.7, 1.7], [13, -0.2, -1.1], [15.2, -0.2, -1.1], [17.4, -0.7, 1.7], [20, -0.7, 1.7]), face: P(0, 3), faceWhenStill: true, stances: [{ t: 0, stance: 'stand' }, { t: 13, stance: 'squat' }, { t: 15, stance: 'stand' }], poses: [{ t: 0, pose: 'swing' }, { t: 13, pose: 'work' }, { t: 17.4, pose: 'measure' }], handProp: holding([15, 20, 'notebook']) },
      { path: still(0.7, 1.75), face: CENTER, poses: pose('swing') },
      { path: still(-1.4, 1.75), face: CENTER, poses: pose('swing') },
    ],
  },

  // Plano de un campamento seguro hecho con palos y piedras sobre el césped
  camp_plan: {
    pieces: [
      { kind: 'staff', at: P(0, 0), count: 3, rotation: 0.4 }, { kind: 'natural', at: P(-0.6, 0.45) }, { kind: 'natural', at: P(0.6, -0.5) },
      { kind: 'stake', at: P(0.8, 0.6), count: 2 }, { kind: 'target', at: P(-0.5, -0.6) }, { kind: 'tape', at: P(1.4, -1.4), rotation: 0.8 },
    ],
    people: [
      { ...L, path: still(-1.6, 1.4), face: CENTER, poses: instructing([3, 9, 15]), labels: [{ t: 0, label: 'Carpas en terreno alto' }, { t: 7, label: 'Cocina con viento a favor' }, { t: 13, label: 'Letrina a 50 m del agua' }] },
      { path: still(0.95, 0.25), face: CENTER, stances: [{ t: 0, stance: 'kneel' }], poses: pose('work'), handProp: 'stone' },
      { path: still(-0.95, -0.3), face: CENTER, stances: [{ t: 0, stance: 'squat' }], poses: pose('work'), handProp: 'twig' },
      { path: route([0, 1.9, -1.7], [2, 1.9, -1.7], [4.5, 0.45, -0.95], [7, 0.45, -0.95], [9.5, 1.9, -1.7], [12, 1.9, -1.7], [14.5, 0.45, -0.95], [20, 0.45, -0.95]), face: CENTER, faceWhenStill: true, stances: [{ t: 0, stance: 'stand' }, { t: 4.6, stance: 'squat' }, { t: 6.8, stance: 'stand' }, { t: 14.6, stance: 'squat' }], poses: [{ t: 0, pose: 'swing' }, { t: 4.6, pose: 'work' }, { t: 6.8, pose: 'swing' }, { t: 14.6, pose: 'work' }], handProp: 'stone' },
      { path: still(0.2, 1.3), face: CENTER, stances: [{ t: 0, stance: 'sit' }], poses: pose('measure'), handProp: 'notebook' },
    ],
  },

  // Estimar el ancho de una "zanja" con el método de la visera
  visor_estimate: {
    focus: 1,
    pieces: [
      { kind: 'rope_line', at: P(-2, -0.9), to: P(2, -0.9), height: 0.03 },
      { kind: 'rope_line', at: P(-2, -1.7), to: P(2, -1.7), height: 0.03 },
    ],
    people: [
      { ...L, path: still(-1.5, 1.4), face: CENTER, poses: instructing([2, 12]), labels: [{ t: 0, label: 'Alinear la visera con la otra orilla' }, { t: 9, label: 'Comparar con la medida real' }] },
      { path: route([0, -0.6, -0.45], [5, -0.6, -0.45], [6, -0.6, -0.45], [11, 1.5, -0.45], [20, 1.5, -0.45]), face: (t) => (t < 5 ? -Math.PI / 2 : t < 6 ? 0 : undefined), stances: [{ t: 0, stance: 'stand' }], poses: [{ t: 0, pose: 'salute' }, { t: 5.5, pose: 'swing' }], labels: [{ t: 0, label: 'Visera alineada con la orilla' }, { t: 5, label: 'Gira 90° sin mover la cabeza' }, { t: 6.2, label: 'Camina contando los pasos' }, { t: 11.5, label: '¡3,2 metros!' }] },
      { path: still(1.7, 0.6), face: P(0, -0.45), poses: pose('measure'), handProp: 'notebook' },
      { path: still(-0.2, 1.4), face: CENTER, poses: pose('swing') },
      { path: still(0.6, 1.5), face: CENTER, poses: pose('swing') },
    ],
  },

  // Mimodrama: escenificar una situación sin palabras
  mime: {
    focus: 1,
    pieces: [{ kind: 'chalk', at: P(0, 0) }],
    people: [
      { ...L, path: still(0, 1.8), face: CENTER, stances: [{ t: 0, stance: 'sit' }], poses: pose('swing'), labels: [{ t: 0, label: 'Público: adivina el artículo' }] },
      { path: route([0, -0.6, 0], [4, -0.2, -0.6], [8, 0.4, -0.2], [12, -0.3, 0.3], [16, -0.6, -0.4], [20, -0.6, 0]), face: P(0, 1.8), poses: [{ t: 0, pose: 'tag' }, { t: 4, pose: 'cheer' }, { t: 8, pose: 'carry' }, { t: 12, pose: 'frozen' }, { t: 16, pose: 'salute' }], labels: [{ t: 0, label: 'Escena sin palabras' }] },
      { path: route([0, 0.6, -0.3], [5, 0.9, 0.2], [10, 0.3, -0.7], [15, 0.8, -0.1], [20, 0.6, -0.3]), face: P(-0.6, 0), stances: [{ t: 0, stance: 'stand' }, { t: 6, stance: 'kneel' }, { t: 9, stance: 'stand' }], poses: [{ t: 0, pose: 'measure' }, { t: 6, pose: 'work' }, { t: 10, pose: 'chair' }, { t: 15, pose: 'cheer' }] },
      { path: still(0.1, -1.0), face: P(0, 1.8), stances: [{ t: 0, stance: 'squat' }, { t: 7, stance: 'stand' }], poses: [{ t: 0, pose: 'work' }, { t: 7, pose: 'tag' }, { t: 13, pose: 'cheer' }] },
      { path: still(-1.2, 1.7), face: CENTER, stances: [{ t: 0, stance: 'sit' }], poses: pose('swing') },
    ],
  },

  // Consejo de equipo: crear y ensayar el grito, el lema y la mística alrededor del banderín
  totem_council: {
    pieces: [{ kind: 'flag', at: P(0, 0) }],
    people: [0, 1, 2, 3, 4].map((i) => {
      const spot = ring(5, 0.95, Math.PI / 2)[i];
      return {
        ...(i === 0 ? L : {}),
        path: still(spot.x, spot.z),
        face: CENTER,
        poses: [{ t: 0, pose: 'swing' as const }, { t: 6, pose: 'cheer' as const }, { t: 8.5, pose: 'swing' as const }, { t: 14, pose: 'cheer' as const }, { t: 16.5, pose: 'swing' as const }],
        handProp: i === 3 ? ('notebook' as const) : undefined,
        labels: i === 0 ? [{ t: 0, label: 'Proponen el lema del equipo' }, { t: 6, label: '¡Ensayo del grito!' }, { t: 9, label: 'Código de mística' }, { t: 14, label: '¡Grito oficial!' }] : undefined,
      };
    }),
  },

  // Libro de Oro: el libro circula y cada uno escribe su anécdota o compromiso
  golden_book: {
    pieces: [{ kind: 'blanket', at: P(0, 0) }],
    items: [{ kind: 'notebook', path: sitRing(5, 0.5).map((p, i) => ({ t: i * 4, x: p.x, z: p.z })).concat([{ t: 20, ...sitRing(5, 0.5)[4] }]), height: 0.42, count: 1 }],
    people: sitRing(5, 0.95).map((spot, i) => ({
      ...(i === 0 ? L : {}),
      path: still(spot.x, spot.z),
      face: CENTER,
      stances: [{ t: 0, stance: 'sit' as const }],
      poses: [{ t: 0, pose: 'swing' as const }, { t: i * 4, pose: 'work' as const }, { t: i * 4 + 3.6, pose: 'swing' as const }],
      handProp: holding([i * 4, i * 4 + 3.6, 'pencil']),
      labels: [{ t: 0 }, { t: i * 4, label: ['Anécdota del trimestre', 'Acuerdo de equipo', 'Dibujo para el libro', 'Compromiso personal', 'Firma de todos'][i] }, { t: i * 4 + 3.8 }],
    })),
  },

  // Brújula tipo Silva: nivelar, alinear la flecha y tomar azimut a un árbol lejano
  compass_azimuth: {
    pieces: [{ kind: 'post', at: P(0.4, -2.1) }],
    people: [
      { ...L, path: still(-1.8, 1.2), face: CENTER, poses: instructing([3, 11]), labels: [{ t: 0, label: 'Nivela la brújula en la palma' }, { t: 7, label: 'Flecha roja al Norte de la caja' }, { t: 13, label: 'Azimut: 342° al árbol' }] },
      ...[-1.1, -0.35, 0.4, 1.15].map((x, i) => ({
        path: still(x, 0.9),
        face: (t: number) => faceTo(P(x, 0.9), P(0.4, -2.1)) + Math.sin(t * 0.9 + i) * 0.35 * Math.max(0, 1 - t / 14),
        poses: pose('measure'),
        handProp: 'compass' as const,
      })),
    ],
  },

  // Sortear un obstáculo con giros de 90° y recuperar el rumbo
  obstacle_90: {
    focus: 1,
    pieces: [{ kind: 'post', at: P(0, 0) }, { kind: 'stake', at: P(0, 1.9), count: 1 }, { kind: 'stake', at: P(0, -1.9), count: 1 }],
    people: [
      { ...L, path: still(-1.6, 1.4), face: CENTER, poses: instructing([2, 13]), labels: [{ t: 0, label: 'Un árbol corta el rumbo' }, { t: 13, label: '¡Rumbo recuperado!' }] },
      { path: route([0, 0, 1.8], [1.5, 0, 1.8], [4, 0, 0.9], [5, 0, 0.9], [7.5, 1.2, 0.9], [8.5, 1.2, 0.9], [11.5, 1.2, -0.9], [12.5, 1.2, -0.9], [15, 0, -0.9], [16, 0, -0.9], [18, 0, -1.8], [20, 0, -1.8]), poses: pose('measure'), handProp: 'compass', labels: [{ t: 0, label: 'Avanza con el rumbo' }, { t: 4.5, label: 'Gira 90° a la derecha' }, { t: 8, label: '5 pasos al frente' }, { t: 12, label: 'Gira 90° a la izquierda' }, { t: 16, label: 'Recupera el rumbo original' }] },
      { path: still(1.6, 1.6), face: P(0.6, 0), poses: pose('measure'), handProp: 'notebook' },
      { path: still(-0.8, 1.9), face: CENTER, poses: pose('swing') },
      { path: still(-1.6, -0.2), face: CENTER, poses: pose('swing') },
    ],
  },

  // Calibrar el doble paso caminando una distancia medida con cinta
  double_step: {
    focus: 1,
    pieces: [{ kind: 'tape_measure', at: P(-1.9, 0.25) }, { kind: 'rope_line', at: P(-1.9, 0.3), to: P(1.9, 0.3), height: 0.02 }, { kind: 'stake', at: P(1.9, 0.3), count: 1 }],
    people: [
      { ...L, path: still(0, 1.6), face: CENTER, poses: instructing([3, 13]), labels: [{ t: 0, label: 'Pista medida con cinta' }, { t: 10, label: 'Longitud de paso personal' }] },
      { path: route([0, -1.9, -0.1], [1, -1.9, -0.1], [7, 1.9, -0.1], [8, 1.9, -0.1], [14, -1.9, -0.1], [20, -1.9, -0.1]), face: P(0, 1), faceWhenStill: true, poses: pose('swing'), labels: [{ t: 1, label: 'Cuenta sus dobles pasos' }, { t: 7.2, label: '6 dobles pasos' }, { t: 8, label: 'Repite para confirmar' }] },
      { path: still(2.2, 0.9), face: P(0, 0), poses: pose('measure'), handProp: 'notebook', labels: [{ t: 0, label: 'Anota los pasos' }] },
      { path: still(-2.15, 0.7), face: P(0, 0.3), stances: [{ t: 0, stance: 'kneel' }], poses: pose('work') },
      { path: still(0.9, 1.5), face: CENTER, poses: pose('swing') },
    ],
  },

  // Medir la altura de 3 árboles por triangulación y comparar estimaciones
  tree_triangulation: {
    pieces: [{ kind: 'post', at: P(-1.5, -1.9) }, { kind: 'post', at: P(0, -2.1) }, { kind: 'post', at: P(1.5, -1.9) }],
    people: [
      { ...L, path: still(-1.9, 1.5), face: CENTER, poses: instructing([4, 14]), labels: [{ t: 0, label: 'Tres árboles, tres estimaciones' }, { t: 12, label: 'Comparar con la medida' }] },
      { path: still(-1.4, 0.6), face: P(-1.5, -1.9), poses: pose('tag'), handProp: 'stick' },
      { path: still(0, 0.8), face: P(0, -2.1), poses: pose('tag'), handProp: 'stick' },
      { path: route([0, 1.4, 0.6], [5, 1.4, 0.6], [9, 1.5, -1.4], [11, 1.5, -1.4], [15, 1.4, 0.6], [20, 1.4, 0.6]), face: P(1.5, -1.9), faceWhenStill: true, poses: [{ t: 0, pose: 'tag' }, { t: 5, pose: 'swing' }, { t: 15, pose: 'tag' }], handProp: 'stick', labels: [{ t: 5, label: 'Camina contando pasos' }, { t: 15.2 }] },
      { path: still(0.5, 1.7), face: CENTER, stances: [{ t: 0, stance: 'sit' }], poses: pose('measure'), handProp: 'notebook' },
    ],
  },

  // Estimar una distancia y comprobarla con la cinta métrica
  tape_check: {
    focus: 3,
    items: [{ kind: 'rope_line', path: still(-1.6, -0.6), to: (t) => P(-1.6 + Math.min(1, Math.max(0, (t - 8) / 4)) * 3.2, -0.6), height: 0.12 }],
    pieces: [{ kind: 'tape_measure', at: P(-1.75, -0.6) }, { kind: 'stake', at: P(1.6, -0.6), count: 1 }],
    people: [
      { ...L, path: still(0, 1.6), face: CENTER, poses: instructing([2, 15]), labels: [{ t: 0, label: 'Primero estimar a ojo' }, { t: 14, label: 'Margen de error: 40 cm' }] },
      { path: still(-1.8, -0.4), face: 0, stances: [{ t: 0, stance: 'stand' }, { t: 7.5, stance: 'kneel' }], poses: [{ t: 0, pose: 'salute' }, { t: 7.5, pose: 'work' }] },
      { path: route([0, -1.6, -0.2], [8, -1.6, -0.2], [12, 1.5, -0.2], [20, 1.5, -0.2]), face: Math.PI, faceWhenStill: true, stances: [{ t: 0, stance: 'stand' }, { t: 12, stance: 'kneel' }], poses: [{ t: 0, pose: 'swing' }, { t: 8, pose: 'work' }], labels: [{ t: 8, label: 'Tensa la cinta' }, { t: 12.2, label: '¡3,2 m reales!' }] },
      { path: still(0.8, 0.9), face: P(0, -0.6), poses: pose('measure'), handProp: 'notebook', labels: [{ t: 0, label: 'Estimación: 3,6 m' }] },
      { path: still(-0.9, 1.2), face: CENTER, poses: pose('swing') },
    ],
  },

  // Interpretar un mapa topográfico: cotas, senderos y depresiones
  topo_map: {
    focal: 'cartography_table',
    focus: 1,
    people: [
      { ...L, path: still(0.65, -1.3), face: P(0, 1), poses: instructing([3, 11]), labels: [{ t: 0, label: 'Curvas juntas = pendiente fuerte' }, { t: 9, label: 'Busquen el sendero y el agua' }] },
      { path: still(0, 0.72), face: CENTER, stances: [{ t: 0, stance: 'sit' }], poses: [{ t: 0, pose: 'tag' }, { t: 5, pose: 'measure' }, { t: 12, pose: 'tag' }], labels: [{ t: 0, label: 'Cota alta: 1240 m' }, { t: 12, label: 'Depresión con agua' }] },
      { path: still(-0.9, 0.5), face: CENTER, stances: [{ t: 0, stance: 'sit' }], poses: [{ t: 0, pose: 'measure' }, { t: 7, pose: 'tag' }, { t: 10, pose: 'measure' }], labels: [{ t: 7, label: 'Este es el sendero' }, { t: 10.5 }] },
      { path: still(0.95, 0.45), face: CENTER, stances: [{ t: 0, stance: 'sit' }], poses: pose('measure'), handProp: 'compass' },
      { path: still(-0.6, -0.9), face: CENTER, poses: pose('tag') },
    ],
  },

  // Levantar el croquis real del parque: medir el perímetro y dibujarlo
  park_sketch: {
    focal: 'cartography_table',
    focus: 2,
    people: [
      { ...L, path: still(0.65, -1.3), face: P(0, 1), poses: instructing([4, 13]), labels: [{ t: 0, label: 'Norte magnético y escala de pasos' }, { t: 12, label: 'Árboles notables y fuentes de agua' }] },
      { path: still(0, 0.72), face: CENTER, stances: [{ t: 0, stance: 'sit' }], poses: pose('work'), handProp: 'pencil', labels: [{ t: 0, label: 'Dibuja el croquis' }] },
      { path: (t) => { const a = t * 0.32; return P(Math.cos(a) * 1.9, Math.sin(a) * 1.9); }, poses: pose('measure'), handProp: 'compass', labels: [{ t: 0, label: 'Recorre el perímetro' }] },
      { path: (t) => { const a = t * 0.32 - 0.6; return P(Math.cos(a) * 1.9, Math.sin(a) * 1.9); }, poses: pose('measure'), handProp: 'notebook' },
      { path: still(-0.95, 0.45), face: CENTER, stances: [{ t: 0, stance: 'sit' }], poses: pose('measure') },
    ],
  },

  // Transmisión Morse: un emisor con silbato y receptores que anotan
  morse_signal: {
    pieces: [{ kind: 'stool', at: P(0, -1.8) }],
    people: [
      { ...L, path: still(0, -1.6), face: P(0, 1.6), poses: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].flatMap((i) => [{ t: i * 1.4, pose: 'cheer' as const }, { t: i * 1.4 + (i % 3 === 1 ? 0.9 : 0.4), pose: 'swing' as const }]), handProp: 'whistle', labels: [{ t: 0, label: '• • •   — — —   • • •' }] },
      ...[-0.9, 0, 0.9].map((x) => ({ path: still(x, 1.5), face: P(0, -1.6), stances: [{ t: 0, stance: 'sit' as const }], poses: pose('work'), handProp: 'notebook' as const })),
      { path: still(1.6, 0.6), face: P(0, -1.6), poses: pose('measure'), labels: [{ t: 0, label: 'Decodifica la palabra' }] },
    ],
  },

  // Misión secreta de servicio: regar, ordenar bancas y ayudar a vecinos
  secret_mission: {
    focus: 1,
    pieces: [{ kind: 'natural', at: P(-1.6, -1.4) }, { kind: 'natural', at: P(-0.9, -1.8) }, { kind: 'stool', at: P(1.6, -1.2) }],
    items: [
      { kind: 'bucket', path: route([0, 0.2, 1.3], [3, 0.2, 1.3], [7, -1.1, -1.1], [20, -1.1, -1.1]), height: 0.35, count: 1 },
      { kind: 'stool', path: route([0, 1.7, 1.3], [8, 1.7, 1.3], [12, 1.2, -0.6], [20, 1.2, -0.6]), height: 0.45, count: 1 },
    ],
    people: [
      { ...L, path: still(-1.8, 1.4), face: CENTER, poses: instructing([2, 13]), labels: [{ t: 0, label: 'Servicio sin que nadie lo pida' }, { t: 13, label: '¡Misión cumplida!' }] },
      { path: route([0, 0.4, 1.4], [3, 0.4, 1.4], [7, -0.9, -0.9], [20, -0.9, -0.9]), face: P(-1.6, -1.4), faceWhenStill: true, stances: [{ t: 0, stance: 'stand' }, { t: 7.2, stance: 'squat' }], poses: [{ t: 0, pose: 'carry' }, { t: 7.2, pose: 'work' }], labels: [{ t: 3, label: 'Riega el jardín' }] },
      { path: route([0, 1.9, 1.5], [8, 1.9, 1.5], [12, 1.4, -0.4], [20, 1.4, -0.4]), face: P(1.6, -1.2), faceWhenStill: true, poses: [{ t: 0, pose: 'swing' }, { t: 8, pose: 'chair' }, { t: 12, pose: 'work' }], labels: [{ t: 8, label: 'Ordena las bancas' }] },
      { path: route([0, 0, 0.5], [10, 0, 0.5], [14, 0.2, -1.5], [20, 0.2, -1.5]), face: P(0.2, -2.3), faceWhenStill: true, poses: [{ t: 0, pose: 'swing' }, { t: 14, pose: 'salute' }], labels: [{ t: 14, label: 'Saluda y orienta a un visitante' }] },
      { path: still(-1.0, 0.9), face: CENTER, poses: pose('swing') },
    ],
  },

  // Árbol de los derechos: dibujar el árbol en el papelógrafo y colgar hojas con derechos
  rights_tree: {
    pieces: [{ kind: 'easel', at: P(0, -1.4) }],
    people: [
      { ...L, path: still(1.2, -1.2), face: P(0, 1), poses: instructing([3, 12]), labels: [{ t: 0, label: 'Cada hoja, un derecho' }] },
      ...['Educación', 'Juego', 'Salud', 'Respeto'].map((right, i) => {
        const home = P(-1.2 + i * 0.8, 1.4);
        const go = 1 + i * 4.2;
        return {
          path: route([0, home.x, home.z], [go, home.x, home.z], [go + 1.8, -0.15 + i * 0.1, -0.85], [go + 3, -0.15 + i * 0.1, -0.85], [go + 4.6, home.x, home.z], [20, home.x, home.z]),
          face: P(0, -1.4), faceWhenStill: true,
          poses: [{ t: 0, pose: 'swing' as const }, { t: go + 1.8, pose: 'tag' as const }, { t: go + 3, pose: 'swing' as const }],
          handProp: holding([0, go + 3, 'notebook']),
          labels: [{ t: go + 1.6, label: `Cuelga: ${right}` }, { t: go + 3.4 }],
        };
      }),
    ],
  },

  // Consejo de la roca: el bastón de hablar pasa y solo habla quien lo tiene
  talking_stick: {
    pieces: [{ kind: 'natural', at: P(0, 0) }],
    items: [{
      kind: 'staff', count: 1, height: 0.5,
      path: sitRing(5, 0.62).map((p, i) => ({ t: i * 4, x: p.x, z: p.z })).concat([{ t: 20, ...sitRing(5, 0.62)[4] }]),
      rotation: (t) => (Math.floor(t / 4) / 5) * Math.PI * 2,
    }],
    people: sitRing(5, 1.0).map((spot, i) => ({
      ...(i === 0 ? L : {}),
      path: still(spot.x, spot.z),
      face: CENTER,
      stances: [{ t: 0, stance: 'sit' as const }],
      poses: [{ t: 0, pose: 'swing' as const }, { t: i * 4, pose: 'measure' as const }, { t: i * 4 + 3.6, pose: 'swing' as const }],
      labels: [{ t: 0 }, { t: i * 4, label: 'Habla con el bastón: cómo se sintió' }, { t: i * 4 + 3.8 }],
    })),
  },

  // Ceremonia de clausura: entrega de insignias y renovación del compromiso
  closing_ceremony: {
    pieces: [{ kind: 'flag', at: P(0, -1.9) }],
    people: [
      {
        ...L,
        path: route([0, 0, -1.3], [2, 0, -1.3], [3.5, -1.2, 0.55], [5, -1.2, 0.55], [6.5, -0.4, 0.75], [8, -0.4, 0.75], [9.5, 0.4, 0.75], [11, 0.4, 0.75], [12.5, 1.2, 0.55], [14, 1.2, 0.55], [15.5, 0, -1.3], [20, 0, -1.3]),
        face: P(0, 1.2), faceWhenStill: true,
        poses: [{ t: 0, pose: 'swing' }, { t: 3.5, pose: 'tag' }, { t: 14, pose: 'swing' }, { t: 16, pose: 'salute' }],
        handProp: holding([0, 14, 'notebook']),
        labels: [{ t: 0, label: 'Evaluación de metas en la bitácora' }, { t: 3.5, label: 'Entrega de insignias de etapa' }, { t: 16, label: 'Renovación del compromiso' }],
      },
      ...[-1.2, -0.4, 0.4, 1.2].map((x) => ({
        path: still(x, x === -1.2 || x === 1.2 ? 0.85 : 1.05),
        face: P(0, -1.3),
        poses: [{ t: 0, pose: 'swing' as const }, { t: 16, pose: 'salute' as const }],
      })),
    ],
  },
};

export function createCartographyScene(activity?: string | null): GameDefinition {
  const a = activity ? ACTIVITIES[activity] : undefined;
  return a ? buildCornerScene('station_cartography_table', a) : createWorkshopScene('cartography_table');
}

export const CARTOGRAPHY_ACTIVITIES = Object.keys(ACTIVITIES);
