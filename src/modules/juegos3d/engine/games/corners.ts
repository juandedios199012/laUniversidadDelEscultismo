import { Vec2 } from '../types';

/**
 * Geometría compartida de las escenas "por rincones" (talleres y pruebas de carga):
 * 4 rincones, uno por equipo, cada uno con su eje local +z mirando al centro del campo.
 */

export const CORNER_R = 6.2;

export const TEAMS = [
  { teamName: 'Equipo Halcones', teamColor: '#B45309', secondaryColor: '#FDE68A' },
  { teamName: 'Equipo Pumas', teamColor: '#1D4ED8', secondaryColor: '#F8FAFC' },
  { teamName: 'Equipo Cóndores', teamColor: '#15803D', secondaryColor: '#FDE047' },
  { teamName: 'Equipo Zorros', teamColor: '#B91C1C', secondaryColor: '#F8FAFC' },
];

export const NAMES = [
  ['Rodrigo', 'Paula', 'Simón', 'Elena', 'Ignacio'], ['Nicolás', 'Isabel', 'Martín', 'Abril', 'Tadeo'],
  ['Felipe', 'Antonia', 'León', 'Clara', 'Vicente'], ['Gabriel', 'Josefa', 'Facundo', 'Olivia', 'Agustín'],
];

export const ZONE_COLORS = ['#F59E0B', '#06B6D4', '#EC4899', '#84CC16'];

export interface LocalKey { t: number; x: number; z: number }

/** Rincón i: centro, orientación θ y conversión de coordenadas locales a coordenadas del campo. */
export function corner(i: number) {
  const a = Math.PI / 4 + (i * Math.PI) / 2;
  const center = { x: Math.cos(a) * CORNER_R, z: Math.sin(a) * CORNER_R };
  // rotY tal que el eje local +z quede mirando al centro: (sin θ, cos θ) = dirección al centro
  const theta = Math.atan2(-center.x, -center.z);
  const toWorld = (p: Vec2): Vec2 => ({
    x: center.x + p.x * Math.cos(theta) + p.z * Math.sin(theta),
    z: center.z - p.x * Math.sin(theta) + p.z * Math.cos(theta),
  });
  return { center, theta, toWorld };
}

/** true si en el instante t el camino está en una pausa (dos claves consecutivas en el mismo lugar). */
export function isStill(keys: LocalKey[], t: number) {
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t >= a.t && t <= b.t) return Math.hypot(a.x - b.x, a.z - b.z) < 1e-3;
  }
  return true;
}

export const cornerZones = () =>
  TEAMS.map((_, i) => ({ label: `RINCÓN ${i + 1}`, center: corner(i).center, size: { w: 4.6, d: 4.6 }, color: ZONE_COLORS[i] }));

export const CORNER_TREES = [
  { x: 0, z: -10.2, height: 6, canopyRadius: 2.2, foliageColor: '#2F5D2A' },
  { x: -10.4, z: 0.5, height: 5.2, canopyRadius: 1.9, foliageColor: '#33652C' },
];
