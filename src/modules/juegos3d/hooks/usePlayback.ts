import { useCallback, useMemo, useRef, useState } from 'react';
import { getGame } from '../engine/gameEngines';
import { DEFAULT_GAME_ID, getCatalogGame } from '../lib/catalog';
import { sceneParamsFor } from '../lib/sceneParams';

/** Un cuadro de flipbook = 1/25 s. */
const FLIPBOOK_STEP = 1 / 25;

/**
 * Juego activo del catálogo y reproducción de su escena 3D (según su arquetipo o variante de taller):
 * reloj, play/pausa y velocidad. El reloj es un ref que avanza el simulador en cada cuadro,
 * sin re-renderizar React.
 */
export function usePlayback(initialGameId: string = DEFAULT_GAME_ID) {
  const [gameId, setGameId] = useState(initialGameId);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const clock = useRef(0);
  const game = getCatalogGame(gameId);
  // Escena paramétrica del juego (estable mientras no cambie el juego)
  const params = useMemo(() => sceneParamsFor(game), [game]);
  const duration = getGame(params.scene, params.activity).duration;

  const selectGame = useCallback((id: string) => {
    clock.current = 0;
    setGameId(id);
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);

  const stepFrame = useCallback((direction: -1 | 1) => {
    setIsPlaying(false);
    clock.current = Math.max(0, Math.min(duration, clock.current + direction * FLIPBOOK_STEP));
  }, [duration]);

  const restart = useCallback(() => {
    clock.current = 0;
  }, []);

  const seek = useCallback((seconds: number) => {
    clock.current = seconds;
  }, []);

  return { game, params, selectGame, clock, duration, isPlaying, togglePlay, speed, setSpeed, stepFrame, restart, seek };
}

export type Playback = ReturnType<typeof usePlayback>;
