import React from 'react';
import { MapIcon, Maximize2, Minimize2, Pause, Play, Rotate3d, Video } from 'lucide-react';
import { GradientButton } from './ui/GradientButton';
import type { CameraMode } from './GameSimulator';

const CAMERA_ICON: Record<CameraMode, React.ElementType> = { follow: Video, tactical: MapIcon, free: Rotate3d };
const CAMERA_NAME: Record<CameraMode, string> = { follow: 'Seguir acción', tactical: 'Vista táctica', free: 'Cámara libre' };

interface SimulatorOverlayProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  cameraMode: CameraMode;
  onCycleCamera: () => void;
  fullscreen: { supported: boolean; isFullscreen: boolean; toggle: () => void };
}

/** Botones flotantes sobre la escena 3D: al alcance del pulgar en móvil y visibles en pantalla completa. */
export function SimulatorOverlay({ isPlaying, onTogglePlay, cameraMode, onCycleCamera, fullscreen }: SimulatorOverlayProps) {
  const glass = 'bg-black/40 backdrop-blur-md';
  return (
    <div className="absolute bottom-3 right-3 flex items-center gap-2 pb-[env(safe-area-inset-bottom)]">
      <GradientButton
        iconOnly
        size="sm"
        className={glass}
        icon={CAMERA_ICON[cameraMode]}
        aria-label={`Cámara: ${CAMERA_NAME[cameraMode]} (cambiar)`}
        title={`${CAMERA_NAME[cameraMode]} · tocar para cambiar`}
        onClick={onCycleCamera}
      />
      <GradientButton iconOnly size="sm" className={glass} icon={isPlaying ? Pause : Play} aria-label={isPlaying ? 'Pausar' : 'Reproducir'} onClick={onTogglePlay} />
      {fullscreen.supported && (
        <GradientButton
          iconOnly
          size="sm"
          className={glass}
          icon={fullscreen.isFullscreen ? Minimize2 : Maximize2}
          aria-label={fullscreen.isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          onClick={fullscreen.toggle}
        />
      )}
    </div>
  );
}
