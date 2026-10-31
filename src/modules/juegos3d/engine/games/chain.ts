import { TreeEntity } from '../types';
import { angleDelta, buildTrack, makeArcPath, poseTimeline, sampleTrack, trapezoidProfile } from '../tracks';
import { GameDefinition, CompetitorScript, appearance } from './common';

/**
 * CADENA (p. ej. La Cuncuna Ciega) — 5 competidores en fila haciendo slalom entre 4 árboles.
 * El líder recorre una curva parametrizada por metros reales; cada compañero va 0.72 m detrás
 * (largo de brazos hasta los hombros del de adelante), por eso la fila nunca se estira ni se encoge.
 */

const TREES: TreeEntity[] = [
  { x: -6, z: 0, height: 5.2, canopyRadius: 1.7, foliageColor: '#2F5D2A' },
  { x: -2, z: 0, height: 6.0, canopyRadius: 1.9, foliageColor: '#33652C' },
  { x: 2, z: 0, height: 4.8, canopyRadius: 1.6, foliageColor: '#2B5626' },
  { x: 6, z: 0, height: 5.6, canopyRadius: 1.8, foliageColor: '#376A2F' },
];

const WAYPOINTS = [
  { x: -13, z: 0 },
  { x: -9, z: 0 },
  { x: -6, z: -2.4 }, // primer árbol por el norte
  { x: -2, z: 2.4 },  // segundo por el sur
  { x: 2, z: -2.4 },
  { x: 6, z: 2.4 },
  { x: 9, z: 0 },
  { x: 13, z: 0 },
];

const SPACING = 0.72;
const NAMES = ['Mateo', 'Lucía', 'Joaquín', 'Camila', 'Rodrigo'];

export function createChainScene(): GameDefinition {
  const path = makeArcPath(WAYPOINTS);
  const sStart = 4;
  const sEnd = path.length - 2.6;
  const startTime = 2.5;
  const profile = trapezoidProfile(sEnd - sStart, 0.9, 1.6, startTime);
  const duration = profile.endTime + 3;
  const leadS = (t: number) => sStart + profile.s(t);

  const competitors: CompetitorScript[] = NAMES.map((name, i) => {
    const isLeader = i === NAMES.length - 1;
    return {
      appearance: appearance(i, {
        id: `cuncuna_${i}`,
        name,
        role: isLeader ? 'lider' : i === 0 ? 'sublider' : 'jugador',
        teamName: 'Equipo Castores',
        teamColor: '#D97706',
        secondaryColor: '#1E3A8A',
        hatType: isLeader ? 'four_dents' : 'none',
        isBlindfolded: !isLeader,
      }),
      track: buildTrack((t) => path.at(leadS(t) - i * SPACING), duration, { initialHeading: 0 }),
      pose: poseTimeline([{ t: 0, pose: i === 0 ? 'swing' : 'shoulders' }]),
    };
  });

  // El líder de cola "lee" la curva que viene y la transmite con toques en los hombros
  const leader = competitors[0].track;
  const tail = competitors[competitors.length - 1];
  tail.label = (t) => {
    if (t < startTime - 0.5) return 'Prepara al equipo';
    if (t > profile.endTime) return '¡Meta! Quitarse las vendas';
    const turn = angleDelta(sampleTrack(leader, t).heading, sampleTrack(leader, t + 1.2).heading);
    if (turn > 0.25) return 'Toque hombro derecho →';
    if (turn < -0.25) return '← Toque hombro izquierdo';
    return 'Avanzar recto';
  };
  competitors[0].label = (t) => (t > startTime && t < profile.endTime ? 'Vendado · guiado por toques' : undefined);

  return {
    id: 'chain',
    duration,
    focusId: 'cuncuna_4',
    field: {
      width: 28,
      depth: 15,
      midline: false,
      zones: [{ label: 'PARTIDA', center: { x: -11, z: 0 }, size: { w: 4, d: 4 }, color: '#F59E0B' }],
      trees: TREES,
      finish: { x: 9.6, z0: -3, z1: 3 },
    },
    competitors,
    flags: () => [{ id: 'meta', color: '#D97706', secondaryColor: '#1E3A8A', pos: { x: 9.6, z: -3.4 } }],
  };
}
