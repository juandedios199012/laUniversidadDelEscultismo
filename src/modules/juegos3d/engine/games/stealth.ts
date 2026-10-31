import { Vec2 } from '../types';
import { PosKey, buildTrack, keyframePath, labelTimeline, poseTimeline, scalarKeys } from '../tracks';
import { CompetitorScript, GameDefinition, appearance } from './common';

/**
 * SIGILO / ACECHO — Un guardián vendado en el centro protege un tesoro.
 * Seis acechadores avanzan agachados desde el borde del círculo y se congelan cuando escucha;
 * si el guardián señala a alguien, ese vuelve a la partida. Mateo llega al tesoro y escapa con él.
 */

const R_START = 9;
const DURATION = 23;
const angleOf = (i: number) => (i / 6) * Math.PI * 2 + Math.PI / 6;
const polar = (a: number, r: number): Vec2 => ({ x: Math.cos(a) * r, z: Math.sin(a) * r });

interface Stalker {
  name: string;
  radii: [number, number][]; // [t, r] — distancia al centro en el tiempo
  crouch: { t: number; v: number }[];
  discoveredAt?: number;
  labels: { t: number; label?: string }[];
}

const STALKERS: Stalker[] = [
  {
    name: 'Mateo', radii: [[0, 9], [5, 6.5], [6.5, 6.5], [12, 3.5], [13.6, 3.5], [14.8, 3.5], [17.6, 1.0], [18.2, 1.0], [21.5, 9.6], [DURATION, 9.6]],
    crouch: [{ t: 0, v: 1 }, { t: 18.0, v: 1 }, { t: 18.5, v: 0 }],
    labels: [{ t: 0, label: 'Acecha en silencio' }, { t: 18.2, label: '¡Toma el tesoro!' }, { t: 19, label: 'Escapa con el tesoro' }],
  },
  {
    name: 'Valentina', radii: [[0, 9], [5, 6.8], [6.5, 6.8], [12, 4.6], [14.8, 4.6], [17, 3.2], [DURATION, 3.2]],
    crouch: [{ t: 0, v: 1 }], labels: [{ t: 0 }],
  },
  {
    name: 'Joaquín', radii: [[0, 9], [5, 6.4], [6.5, 6.4], [8, 5.5], [8.6, 5.5], [12, 9.3], [13, 9.3], [20, 7.0], [DURATION, 7.0]],
    crouch: [{ t: 0, v: 1 }, { t: 8.1, v: 1 }, { t: 8.5, v: 0 }, { t: 13, v: 0 }, { t: 13.5, v: 1 }],
    discoveredAt: 8,
    labels: [{ t: 0 }, { t: 8, label: '¡Descubierto!' }, { t: 9, label: 'Vuelve a la partida' }, { t: 13, label: 'Acecha de nuevo' }, { t: 16 }],
  },
  {
    name: 'Camila', radii: [[0, 9], [5, 7.0], [6.5, 7.0], [12, 5.0], [14.8, 5.0], [16.5, 4.0], [DURATION, 4.0]],
    crouch: [{ t: 0, v: 1 }], labels: [{ t: 0 }],
  },
  {
    name: 'Benjamín', radii: [[0, 9], [5, 6.6], [6.5, 6.6], [12, 4.4], [14, 4.0], [14.6, 4.0], [18.5, 9.3], [DURATION, 9.3]],
    crouch: [{ t: 0, v: 1 }, { t: 14.1, v: 1 }, { t: 14.5, v: 0 }],
    discoveredAt: 14,
    labels: [{ t: 0 }, { t: 14, label: '¡Descubierto!' }, { t: 15, label: 'Vuelve a la partida' }, { t: 19 }],
  },
  {
    name: 'Martina', radii: [[0, 9], [5, 7.2], [6.5, 7.2], [12, 5.2], [14.8, 5.2], [17, 3.8], [DURATION, 3.8]],
    crouch: [{ t: 0, v: 1 }], labels: [{ t: 0 }],
  },
];

const TEAM = { teamName: 'Acechadores', teamColor: '#7C3AED', secondaryColor: '#FDE68A' };

/** Variantes del guardián vendado según las reglas del juego. */
export type StealthVariant = 'sentinel_whistle' | 'whistle_blind' | 'sleeping_pirate';

export function createStealthScene(variant?: StealthVariant): GameDefinition {
  // Pitador: quien es descubierto queda eliminado y sale del círculo (no vuelve a intentarlo)
  const stalkers = variant === 'whistle_blind'
    ? STALKERS.map((s) => (s.discoveredAt === undefined ? s : {
        ...s,
        radii: [...s.radii.filter(([t]) => t <= s.discoveredAt! + 0.6), [s.discoveredAt + 4.5, 11.5], [DURATION, 11.5]] as [number, number][],
        crouch: [{ t: 0, v: 1 }, { t: s.discoveredAt + 0.1, v: 1 }, { t: s.discoveredAt + 0.5, v: 0 }],
        labels: [{ t: 0 }, { t: s.discoveredAt, label: '¡Eliminado!' }, { t: s.discoveredAt + 1, label: 'Sale del juego' }],
      }))
    : STALKERS;
  const paths = stalkers.map((s, i) => keyframePath(s.radii.map(([t, r]) => {
    const p = polar(angleOf(i), r);
    return { t, x: p.x, z: p.z } as PosKey;
  })));

  // El guardián señala hacia quien escuchó; si no, gira la cabeza lentamente escuchando
  const pointing = stalkers.flatMap((s, i) => (s.discoveredAt !== undefined ? [{ i, t: s.discoveredAt }] : []));
  const guardianFace = (t: number) => {
    const p = pointing.find(({ t: td }) => t >= td - 0.5 && t < td + 1.2);
    if (p) {
      const pos = paths[p.i](p.t);
      return Math.atan2(pos.z, pos.x);
    }
    return Math.sin(t * 0.45) * 1.4 + 0.3;
  };

  const competitors: CompetitorScript[] = stalkers.map((s, i) => ({
    appearance: appearance(i + 2, { id: `stalker_${i}`, name: s.name, role: i === 0 ? 'atacante' : 'jugador', hatType: i % 2 ? 'beret' : 'none', ...TEAM }),
    track: buildTrack(paths[i], DURATION, { initialHeading: angleOf(i) + Math.PI, idleHeading: angleOf(i) + Math.PI }),
    pose: poseTimeline(i === 0 ? [{ t: 0, pose: 'swing' }, { t: 17.8, pose: 'tag' }, { t: 18.4, pose: 'carry' }] : [{ t: 0, pose: 'swing' }]),
    crouch: scalarKeys(s.crouch),
    label: labelTimeline(s.labels),
  }));

  competitors.push({
    appearance: appearance(9, {
      id: 'guardian', name: 'Tomás', role: 'lider', hatType: 'none', isBlindfolded: true,
      teamName: 'Guardián', teamColor: '#DC2626', secondaryColor: '#F8FAFC',
    }),
    track: buildTrack(() => ({ x: 0, z: 0 }), DURATION, { face: guardianFace, maxTurnRate: 4 }),
    stance: variant === 'sleeping_pirate' ? 'sit' : undefined,
    handProp: variant === 'sentinel_whistle' || variant === 'whistle_blind' ? 'whistle' : undefined,
    pose: poseTimeline([
      { t: 0, pose: 'swing' },
      ...pointing.flatMap(({ t }) => [{ t: t - 0.3, pose: 'tag' as const }, { t: t + 1.0, pose: 'swing' as const }]),
    ]),
    label: labelTimeline([
      { t: 0, label: variant === 'sleeping_pirate' ? 'Pirata dormido: custodia el cofre' : variant ? 'Vendado, con silbato' : 'Vendado: escucha' },
      ...pointing.flatMap(({ t }) => [{ t, label: '¡Te oí!' }, { t: t + 1.4, label: variant === 'sleeping_pirate' ? 'Pirata dormido: custodia el cofre' : 'Vendado: escucha' }]),
      { t: 18.2, label: '¡Le robaron el tesoro!' },
    ]),
  });

  return {
    id: 'stealth',
    duration: DURATION,
    focusId: 'stalker_0',
    field: {
      width: 22,
      depth: 22,
      midline: false,
      circle: { center: { x: 0, z: 0 }, radius: R_START },
      zones: [],
      // Vigilante sobre hojas secas: pasos ruidosos alrededor del círculo
      setPieces: variant === 'sentinel_whistle'
        ? Array.from({ length: 10 }, (_, i) => ({ kind: 'natural' as const, pos: { x: Math.cos(i * 0.63) * 5.5, z: Math.sin(i * 0.63) * 5.5 } }))
        : undefined,
      trees: [
        { x: -10.5, z: 8.5, height: 6.2, canopyRadius: 2.3, foliageColor: '#2F5D2A' },
        { x: 10.8, z: -8, height: 5.4, canopyRadius: 2.0, foliageColor: '#2B5626' },
      ],
    },
    competitors,
    // Pirata: cofre del tesoro (se mueve con quien lo roba) en vez de banderín
    items: variant === 'sleeping_pirate'
      ? (t) => [{ id: 'chest', kind: 'chest' as const, pos: t < 18.2 ? { x: 0.75, z: 0.35 } : paths[0](t), height: t < 18.2 ? 0 : 0.55 }]
      : undefined,
    flags: (t) => variant === 'sleeping_pirate' ? [] : [
      t < 18.2
        ? { id: 'treasure', color: '#F59E0B', secondaryColor: '#7C3AED', pos: { x: 0.75, z: 0.35 } }
        : { id: 'treasure', color: '#F59E0B', secondaryColor: '#7C3AED', pos: { x: 0, z: 0 }, carrierId: 'stalker_0' },
    ],
  };
}
