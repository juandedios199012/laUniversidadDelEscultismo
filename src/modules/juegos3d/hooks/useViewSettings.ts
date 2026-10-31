import { useCallback, useState } from 'react';
import type { CameraMode } from '../components/GameSimulator';

export const CAMERA_MODES: CameraMode[] = ['follow', 'tactical', 'free'];

/** Preferencias de visualización: cámara y capas (nombres, visión, vectores). */
export function useViewSettings() {
  const [cameraMode, setCameraMode] = useState<CameraMode>('follow');
  const [showLabels, setShowLabels] = useState(true);
  const [showFOV, setShowFOV] = useState(false);
  const [showVectors, setShowVectors] = useState(false);

  const cycleCamera = useCallback(() => {
    setCameraMode((m) => CAMERA_MODES[(CAMERA_MODES.indexOf(m) + 1) % CAMERA_MODES.length]);
  }, []);

  return {
    cameraMode, setCameraMode, cycleCamera,
    showLabels, toggleLabels: useCallback(() => setShowLabels((v) => !v), []),
    showFOV, toggleFOV: useCallback(() => setShowFOV((v) => !v), []),
    showVectors, toggleVectors: useCallback(() => setShowVectors((v) => !v), []),
  };
}

export type ViewSettings = ReturnType<typeof useViewSettings>;
