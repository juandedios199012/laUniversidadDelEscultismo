import { HatType, CompetitorRole } from '../types';
import { PosKey, buildTrack, keyframePath, labelTimeline, poseTimeline, scalarKeys } from '../tracks';
import { GameDefinition, CompetitorScript, appearance } from './common';

/**
 * TERRITORIO (p. ej. Asalto a la Bandera) — Águilas (izquierda, x<0) vs Lobos (derecha, x>0), 4 contra 4.
 * Jugada coreografiada de 24 s:
 *  - Sebastián (Águilas) entra en sigilo por el norte, roba la bandera Lobo y vuelve a su base.
 *  - Martina (Águilas) hace de señuelo por el sur y queda congelada por Andrés.
 *  - Gabriel (Lobos) intenta infiltrarse y Diego lo congela en campo Águila.
 *  - Sofía y Valeria intentan cortar a Sebastián, pero cruza la frontera a tiempo.
 */

const DURATION = 24;
const AGUILAS = { teamName: 'Equipo Águilas', teamColor: '#15803D', secondaryColor: '#FBBF24' };
const LOBOS = { teamName: 'Equipo Lobos', teamColor: '#B91C1C', secondaryColor: '#F8FAFC' };

const k = (t: number, x: number, z: number): PosKey => ({ t, x, z });

interface Def {
  id: string;
  name: string;
  role: CompetitorRole;
  team: typeof AGUILAS;
  hat: HatType;
  keys: PosKey[];
  poses?: { t: number; pose: 'swing' | 'tag' | 'carry' | 'frozen' }[];
  crouch?: { t: number; v: number }[];
  frozenFrom?: number;
  labels: { t: number; label?: string }[];
}

const DEFS: Def[] = [
  {
    id: 'a_seb', name: 'Sebastián', role: 'atacante', team: AGUILAS, hat: 'four_dents',
    keys: [k(0, -6, -7), k(4, -1, -9), k(8.5, 8, -9), k(11.5, 17.2, -0.7), k(12, 17.2, -0.7), k(15, 6, -6), k(16.8, -1, -5), k(21, -16.5, -1.2), k(24, -16.5, -1.2)],
    poses: [{ t: 0, pose: 'swing' }, { t: 11.4, pose: 'tag' }, { t: 11.9, pose: 'carry' }, { t: 21.1, pose: 'tag' }, { t: 21.7, pose: 'swing' }],
    crouch: [{ t: 0, v: 0.9 }, { t: 8.2, v: 0.9 }, { t: 8.9, v: 0 }],
    labels: [
      { t: 0, label: 'Sigilo por el flanco norte' }, { t: 8.5, label: '¡Carrera a la bandera!' },
      { t: 11.5, label: '¡Captura la bandera!' }, { t: 12.2, label: 'Huye con la bandera' },
      { t: 16.8, label: 'Zona segura' }, { t: 21.2, label: '¡Bandera en base! Gana Águilas' },
    ],
  },
  {
    id: 'a_mar', name: 'Martina', role: 'atacante', team: AGUILAS, hat: 'beret',
    keys: [k(0, -6, 6), k(3, -1, 8), k(6, 5, 7.5), k(8.6, 12, 4.2), k(9.1, 12.3, 4.2), k(24, 12.3, 4.2)],
    poses: [{ t: 0, pose: 'swing' }, { t: 9.1, pose: 'frozen' }],
    crouch: [{ t: 0, v: 0.7 }, { t: 6, v: 0.7 }, { t: 6.6, v: 0 }],
    frozenFrom: 9.1,
    labels: [{ t: 0, label: 'Señuelo por el sur' }, { t: 9.1, label: 'Congelada' }],
  },
  {
    id: 'a_die', name: 'Diego', role: 'lider', team: AGUILAS, hat: 'four_dents',
    keys: [k(0, -4, -3), k(3, -4, 1), k(6, -4, 0.2), k(7.6, -7.7, 1.0), k(8.4, -7.7, 1.0), k(12, -4, -2), k(16, -4, 2), k(20, -3, -3), k(24, -4, -1)],
    poses: [{ t: 0, pose: 'swing' }, { t: 7.1, pose: 'tag' }, { t: 8.0, pose: 'swing' }],
    labels: [{ t: 0, label: 'Defiende la frontera' }, { t: 6, label: 'Persigue al intruso' }, { t: 7.6, label: '¡Tocado!' }, { t: 9, label: 'Defiende la frontera' }],
  },
  {
    id: 'a_tom', name: 'Tomás', role: 'defensor', team: AGUILAS, hat: 'beret',
    keys: [k(0, -15, -2), k(6, -15, 2), k(12, -15, -2), k(18, -15.5, 2), k(24, -15, 3)],
    labels: [{ t: 0, label: 'Guarda la bandera' }],
  },
  {
    id: 'l_gab', name: 'Gabriel', role: 'atacante', team: LOBOS, hat: 'beret',
    keys: [k(0, 6, 3), k(3, 1.5, 2.5), k(5, -0.5, 2), k(6.6, -5, 1.4), k(7.6, -7, 1.8), k(24, -7, 1.8)],
    poses: [{ t: 0, pose: 'swing' }, { t: 7.7, pose: 'frozen' }],
    crouch: [{ t: 0, v: 0.8 }, { t: 5, v: 0.8 }, { t: 5.6, v: 0 }],
    frozenFrom: 7.7,
    labels: [{ t: 0, label: 'Intenta infiltrarse' }, { t: 7.7, label: 'Congelado' }],
  },
  {
    id: 'l_sof', name: 'Sofía', role: 'atacante', team: LOBOS, hat: 'four_dents',
    keys: [k(0, 5, -4), k(4, 3.5, -7), k(9, 5, -6), k(13, 8, -1), k(16.9, 0.6, -4.8), k(18, 0.9, -4.6), k(24, 4, -3)],
    poses: [{ t: 0, pose: 'swing' }, { t: 16.3, pose: 'tag' }, { t: 17.1, pose: 'swing' }],
    labels: [{ t: 0, label: 'Atacante en espera' }, { t: 13, label: 'Corta el paso' }, { t: 17, label: 'No alcanzó' }, { t: 19, label: undefined }],
  },
  {
    id: 'l_and', name: 'Andrés', role: 'lider', team: LOBOS, hat: 'four_dents',
    keys: [k(0, 9, -2), k(3, 9, 2), k(6.5, 9.5, 1.5), k(9, 13, 4.8), k(12.2, 13, 4.8), k(15.5, 7, -4.5), k(17.2, 1.2, -5.2), k(18, 1.5, -5), k(24, 8, -1)],
    poses: [{ t: 0, pose: 'swing' }, { t: 8.6, pose: 'tag' }, { t: 9.5, pose: 'swing' }, { t: 16.6, pose: 'tag' }, { t: 17.4, pose: 'swing' }],
    labels: [
      { t: 0, label: 'Vigila su campo' }, { t: 7.2, label: 'Persigue a Martina' }, { t: 9, label: '¡Tocada!' },
      { t: 12.2, label: 'Persigue al ladrón' }, { t: 17.2, label: 'Llega tarde a la frontera' }, { t: 19.5, label: undefined },
    ],
  },
  {
    id: 'l_val', name: 'Valeria', role: 'defensor', team: LOBOS, hat: 'beret',
    keys: [k(0, 16, -2), k(5, 16, 2.5), k(9, 15.5, 4), k(11.8, 15.5, 4), k(14.1, 11, -3), k(15.2, 9.5, -4), k(15.8, 9.5, -4), k(21, 15, -1), k(24, 16, 0)],
    labels: [{ t: 0, label: 'Guarda la bandera' }, { t: 11.8, label: '¡Le roban la bandera!' }, { t: 15.2, label: 'Vuelve a su base' }, { t: 21, label: 'Guarda la bandera' }],
  },
];

export function createTerritoryScene(): GameDefinition {
  const competitors: CompetitorScript[] = DEFS.map((d, i) => ({
    appearance: appearance(i, { id: d.id, name: d.name, role: d.role, hatType: d.hat, ...d.team }),
    track: buildTrack(keyframePath(d.keys), DURATION, { initialHeading: d.team === AGUILAS ? 0 : Math.PI }),
    pose: poseTimeline(d.poses ?? [{ t: 0, pose: 'swing' }]),
    crouch: d.crouch ? scalarKeys(d.crouch) : undefined,
    frozenFrom: d.frozenFrom,
    label: labelTimeline(d.labels),
  }));

  return {
    id: 'territory',
    duration: DURATION,
    focusId: 'a_seb',
    field: {
      width: 40,
      depth: 24,
      midline: true,
      zones: [
        { label: 'BASE ÁGUILAS', center: { x: -17, z: 0 }, size: { w: 5, d: 7 }, color: '#22C55E' },
        { label: 'BASE LOBOS', center: { x: 17, z: 0 }, size: { w: 5, d: 7 }, color: '#EF4444' },
      ],
      trees: [
        { x: -12, z: -10.5, height: 6, canopyRadius: 2.2, foliageColor: '#2F5D2A' },
        { x: 3, z: 10.8, height: 5.4, canopyRadius: 2.0, foliageColor: '#33652C' },
        { x: 13, z: -10.6, height: 6.4, canopyRadius: 2.3, foliageColor: '#2B5626' },
      ],
    },
    competitors,
    flags: (t) => [
      { id: 'flag_aguilas', color: AGUILAS.teamColor, secondaryColor: AGUILAS.secondaryColor, pos: { x: -18.2, z: 1.4 } },
      t < 11.8
        ? { id: 'flag_lobos', color: LOBOS.teamColor, secondaryColor: LOBOS.secondaryColor, pos: { x: 17.9, z: -0.5 } }
        : t < 21.4
          ? { id: 'flag_lobos', color: LOBOS.teamColor, secondaryColor: LOBOS.secondaryColor, pos: { x: 0, z: 0 }, carrierId: 'a_seb' }
          : { id: 'flag_lobos', color: LOBOS.teamColor, secondaryColor: LOBOS.secondaryColor, pos: { x: -17.4, z: -1.0 } },
    ],
  };
}
