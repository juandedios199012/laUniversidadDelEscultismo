import type { HandProp, SceneId, SceneVariant, VisibleProp } from '../engine/types';
import { hashSeed, leaderHandPropFor, variantFor } from '../engine/variants';
import { CATALOG, type CatalogGame, ruleSteps, sceneFor } from './catalog';

/**
 * Parámetros de la escena 3D de un juego del catálogo (motor paramétrico).
 * La coreografía base la da su tipo de escena; todo lo demás sale de sus propios datos:
 *  - objetos visibles (materiales + reglas, primero lo que nombran las reglas),
 *  - objeto en la mano del líder (silbato, brújula, balón, libreta),
 *  - variante sin repetir dentro de su escena (espejo, colores de equipo, luz del sol),
 *  - pasos de las reglas para la narración en pantalla.
 */
export interface SceneParams {
  gameId: string;
  scene: SceneId;
  /** Acción concreta dentro de la escena (elige la coreografía), o null. */
  activity: string | null;
  seed: number;
  variant: SceneVariant;
  visibleProps: VisibleProp[];
  leaderHandProp?: HandProp;
  steps: string[];
}

/** Posición de cada juego dentro de los juegos que comparten su escena base (orden del catálogo). */
const INDEX_IN_SCENE: Map<string, number> = (() => {
  const counters = new Map<SceneId, number>();
  const index = new Map<string, number>();
  for (const g of CATALOG) {
    const scene = sceneFor(g);
    const i = counters.get(scene) ?? 0;
    index.set(g.id, i);
    counters.set(scene, i + 1);
  }
  return index;
})();

export function sceneParamsFor(game: CatalogGame): SceneParams {
  const seed = hashSeed(game.id);
  return {
    gameId: game.id,
    scene: sceneFor(game),
    activity: game.activity,
    seed,
    variant: variantFor(INDEX_IN_SCENE.get(game.id) ?? 0),
    visibleProps: game.visible_props,
    leaderHandProp: leaderHandPropFor(game.visible_props),
    steps: ruleSteps(game),
  };
}
