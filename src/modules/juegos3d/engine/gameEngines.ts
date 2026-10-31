import { FocalProp, GameFrame, SceneId } from './types';
import { GameDefinition, evaluateGame } from './games/common';
import { createRelayScene } from './games/relay';
import { createRigScene } from './games/rig';
import { createCartographyScene } from './games/cartography';
import { createCircleGamesScene } from './games/circleGames';
import { createStealthGamesScene } from './games/stealthGames';
import { createWorkshopGamesScene } from './games/workshopGames';
import { createFieldGamesScene } from './games/fieldGames';

const FOCAL_PROPS: FocalProp[] = [
  'ground_mosaic', 'stress_test_rig', 'pioneering_tripod', 'first_aid_stretcher',
  'campfire_cooking', 'tent_assembly', 'cartography_table', 'seed_bomb_craft',
];

/** Constructor de cada escena; `activity` (del catálogo) elige la coreografía concreta del juego. */
const FACTORIES = {
  chain: (activity?: string) => createFieldGamesScene('chain', activity),
  territory: (activity?: string) => createFieldGamesScene('territory', activity),
  circle: (activity?: string) => createCircleGamesScene(activity),
  relay: (activity?: string) => createRelayScene(activity),
  stealth: (activity?: string) => createStealthGamesScene(activity),
  station: (activity?: string) => createFieldGamesScene('station', activity),
  ...Object.fromEntries(FOCAL_PROPS.map((f) => [`station_${f}`, (activity?: string) => createWorkshopGamesScene(`station_${f}`, activity)])),
  station_cartography_table: (activity?: string) => createCartographyScene(activity),
  station_stress_test_rig: (activity?: string) => createRigScene(activity),
} as Record<SceneId, (activity?: string) => GameDefinition>;

const cache = new Map<string, GameDefinition>();

/** Escena 3D (trayectorias precalculadas una sola vez por escena + actividad). */
export function getGame(id: SceneId, activity?: string | null): GameDefinition {
  const key = activity ? `${id}#${activity}` : id;
  let def = cache.get(key);
  if (!def) {
    def = FACTORIES[id](activity ?? undefined);
    cache.set(key, def);
  }
  return def;
}

/** Estado completo de la escena en el segundo `t`. */
export function getGameFrame(id: SceneId, t: number, activity?: string | null): GameFrame {
  return evaluateGame(getGame(id, activity), t);
}
