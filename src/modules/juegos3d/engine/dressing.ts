import { DressingItem, FieldLayout, FocalProp, MaterialKind, SceneId, VisibleProp } from './types';

/**
 * "Vestuario" de la escena: coloca en el campo los materiales visibles de cada juego.
 * No toca las coreografías: los objetos van en lugares que no estorban
 * (esquinas, costados y un almacén de materiales fuera de la cancha, junto al borde cercano).
 */

/** Materiales que se ven puestos o en la mano (no se dibujan en el suelo). */
const NOT_ON_GROUND = new Set<MaterialKind>([
  'blindfold', 'neckerchief', 'whistle', 'compass', 'pen', 'stopwatch', 'mirror', 'carabiner', 'uniform', 'soap', 'music', 'none',
]);

/** Lo que ya muestra el elemento focal del taller no se repite en el almacén. */
const COVERED_BY_FOCAL: Record<FocalProp, MaterialKind[]> = {
  ground_mosaic: ['natural', 'cards', 'paper'],
  stress_test_rig: ['staff', 'rope', 'weight', 'backpack', 'logs'],
  pioneering_tripod: ['staff', 'rope', 'stake', 'logs'],
  first_aid_stretcher: ['first_aid_kit', 'staff'],
  campfire_cooking: ['fire', 'logs', 'natural', 'food'],
  tent_assembly: ['tent', 'stake', 'hammer', 'rope'],
  cartography_table: ['map', 'paper', 'notebook', 'board'],
  seed_bomb_craft: ['natural', 'bucket', 'blanket', 'paper'],
};

/** Materiales que delimitan la cancha: van en las esquinas. */
const CORNER_KINDS = new Set<MaterialKind>(['cone', 'chalk']);
const MAX_KINDS = 5;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function focalOf(scene: SceneId): FocalProp | undefined {
  return scene.startsWith('station_') ? (scene.slice('station_'.length) as FocalProp) : undefined;
}

export function dressField(field: FieldLayout, scene: SceneId, visible: VisibleProp[], seed: number): DressingItem[] {
  const focal = focalOf(scene);
  const covered = new Set(focal ? COVERED_BY_FOCAL[focal] : []);
  const kinds = visible
    .filter((v) => !NOT_ON_GROUND.has(v.kind) && !covered.has(v.kind))
    .slice(0, MAX_KINDS);

  const r = rng(seed);
  const hw = field.width / 2, hd = field.depth / 2;
  const items: DressingItem[] = [];
  const count = (v: VisibleProp) => Math.max(1, Math.min(4, v.qty ?? 2));

  // Esquinas: conos (o marcas de tiza) delimitando la cancha
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const;
  kinds.filter((v) => CORNER_KINDS.has(v.kind)).forEach((v, i) => {
    corners.forEach(([sx, sz]) => {
      const inset = 0.6 + i * 0.7;
      items.push({ kind: v.kind, pos: { x: sx * (hw - inset), z: sz * (hd - inset) }, rotation: r() * Math.PI, count: 1 });
    });
  });

  // Banderines a los costados largos, fuera de la línea
  kinds.filter((v) => v.kind === 'flag').forEach(() => {
    [-1, 1].forEach((sz) => items.push({ kind: 'flag', pos: { x: 0, z: sz * (hd + 0.9) }, rotation: 0, count: 1 }));
  });

  // Almacén de materiales: fila ordenada fuera del borde cercano a la cámara
  const depot = kinds.filter((v) => !CORNER_KINDS.has(v.kind) && v.kind !== 'flag');
  const spacing = 1.25;
  depot.forEach((v, i) => {
    const x = (i - (depot.length - 1) / 2) * spacing + (r() - 0.5) * 0.2;
    items.push({ kind: v.kind, pos: { x, z: hd + 1.4 + (r() - 0.5) * 0.3 }, rotation: (r() - 0.5) * 0.8, count: count(v) });
  });

  return items;
}
