import { HatType, Vec2 } from '../types';
import { buildTrack, keyframePath, labelTimeline, poseTimeline } from '../tracks';
import { CompetitorScript, GameDefinition, appearance } from './common';

/**
 * TALLER POR POSTAS — 4 equipos trabajan con las manos en 4 postas (amarres, construcción, orden de materiales).
 * Al toque de rotación cada equipo camina a la posta siguiente (sentido horario) y vuelve a trabajar.
 */

const DURATION = 26;
const WORK_END = 9;
const ARRIVE = 16.8;
const STATION_R = 6.5;
const STATIONS: Vec2[] = [0, 1, 2, 3].map((i) => {
  const a = Math.PI / 4 + (i * Math.PI) / 2;
  return { x: Math.cos(a) * STATION_R, z: Math.sin(a) * STATION_R };
});
const STATION_COLORS = ['#F59E0B', '#06B6D4', '#EC4899', '#84CC16'];

const TEAMS = [
  { teamName: 'Equipo Halcones', teamColor: '#B45309', secondaryColor: '#FDE68A' },
  { teamName: 'Equipo Pumas', teamColor: '#1D4ED8', secondaryColor: '#F8FAFC' },
  { teamName: 'Equipo Cóndores', teamColor: '#15803D', secondaryColor: '#FDE047' },
  { teamName: 'Equipo Zorros', teamColor: '#B91C1C', secondaryColor: '#F8FAFC' },
];
const NAMES = [
  ['Rodrigo', 'Paula', 'Simón', 'Elena'], ['Nicolás', 'Isabel', 'Martín', 'Abril'],
  ['Felipe', 'Antonia', 'León', 'Clara'], ['Gabriel', 'Josefa', 'Facundo', 'Olivia'],
];

/** Lugar de trabajo de la persona k alrededor de la posta (en círculo, mirando al centro). */
function workSpot(station: Vec2, k: number, teamIndex: number): Vec2 {
  const a = (k / 4) * Math.PI * 2 + teamIndex * 0.4;
  return { x: station.x + Math.cos(a) * 1.05, z: station.z + Math.sin(a) * 1.05 };
}

export function createStationScene(): GameDefinition {
  const competitors: CompetitorScript[] = [];

  TEAMS.forEach((team, ti) => {
    const from = STATIONS[ti];
    const to = STATIONS[(ti + 1) % 4];
    for (let k = 0; k < 4; k++) {
      const a = workSpot(from, k, ti);
      const b = workSpot(to, k, ti);
      // Salen hacia afuera de la posta y caminan en grupo a la siguiente
      const mid = { x: (from.x + to.x) / 2 * 1.15, z: (from.z + to.z) / 2 * 1.15 };
      const start = WORK_END + 0.4 + k * 0.15;
      const path = keyframePath([
        { t: 0, x: a.x, z: a.z }, { t: start, x: a.x, z: a.z },
        { t: (start + ARRIVE) / 2, x: mid.x + (k - 1.5) * 0.5, z: mid.z + (k - 1.5) * 0.5 },
        { t: ARRIVE + k * 0.12, x: b.x, z: b.z }, { t: DURATION, x: b.x, z: b.z },
      ]);
      const facing = (t: number) => {
        if (t < start) return Math.atan2(from.z - a.z, from.x - a.x);
        if (t > ARRIVE + k * 0.12 + 0.3) return Math.atan2(to.z - b.z, to.x - b.x);
        return undefined;
      };
      const isLeader = k === 0;
      const hat: HatType = isLeader ? 'four_dents' : k === 2 ? 'beret' : 'none';
      competitors.push({
        appearance: appearance(ti * 4 + k + 3, {
          id: `station_${ti}_${k}`, name: NAMES[ti][k], role: isLeader ? 'lider' : 'jugador', hatType: hat, ...team,
        }),
        track: buildTrack(path, DURATION, { face: facing, maxTurnRate: 5 }),
        pose: poseTimeline([{ t: 0, pose: 'work' }, { t: start - 0.2, pose: 'swing' }, { t: ARRIVE + 0.5, pose: 'work' }], 0.5),
        label: isLeader
          ? labelTimeline([
              { t: 0, label: `Trabajo en la posta ${ti + 1}` },
              { t: WORK_END, label: `Rotación a la posta ${((ti + 1) % 4) + 1}` },
              { t: ARRIVE + 0.5, label: `Trabajo en la posta ${((ti + 1) % 4) + 1}` },
            ])
          : undefined,
      });
    }
  });

  return {
    id: 'station',
    duration: DURATION,
    focusId: 'station_0_0',
    field: {
      width: 20,
      depth: 20,
      midline: false,
      zones: STATIONS.map((s, i) => ({ label: `POSTA ${i + 1}`, center: s, size: { w: 3.4, d: 3.4 }, color: STATION_COLORS[i] })),
      trees: [
        { x: 0, z: -9.5, height: 6, canopyRadius: 2.2, foliageColor: '#2F5D2A' },
        { x: -9.8, z: 1, height: 5.2, canopyRadius: 1.9, foliageColor: '#33652C' },
      ],
    },
    competitors,
    flags: () => STATIONS.map((s, i) => ({
      id: `station_flag_${i}`, color: STATION_COLORS[i], secondaryColor: '#FFFFFF', pos: { x: s.x, z: s.z },
    })),
  };
}
