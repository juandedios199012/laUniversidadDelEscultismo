import React, { useEffect, useState } from 'react';
import { Compass, Eye, Gauge, MapIcon, Pause, Play, Rotate3d, RotateCcw, SkipBack, SkipForward, Tag, Video } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { GradientButton } from './ui/GradientButton';
import { SegmentedControl } from './ui/SegmentedControl';
import { ToggleChip } from './ui/ToggleChip';
import type { Playback } from '../hooks/usePlayback';
import type { ViewSettings } from '../hooks/useViewSettings';
import type { CameraMode } from './GameSimulator';

const SPEEDS = [0.25, 0.5, 1, 1.5, 2].map((s) => ({ value: s, label: `${s}x` }));
const CAMERAS: { value: CameraMode; label: string; icon: React.ElementType }[] = [
  { value: 'follow', label: 'Seguir acción', icon: Video },
  { value: 'tactical', label: 'Vista táctica', icon: MapIcon },
  { value: 'free', label: 'Cámara libre', icon: Rotate3d },
];

/** Controles de reproducción (flipbook), cámara y capas visuales. */
export function PlaybackPanel({ playback, view }: { playback: Playback; view: ViewSettings }) {
  const { isPlaying, togglePlay, stepFrame, restart, speed, setSpeed } = playback;

  return (
    <GlassCard className="min-w-0">
      <div className="flex flex-col gap-4">
      <Timeline playback={playback} />

      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between">
        <div className="flex items-center gap-2">
          <GradientButton iconOnly icon={RotateCcw} aria-label="Reiniciar" title="Reiniciar (0 s)" onClick={restart} />
          <GradientButton iconOnly icon={SkipBack} aria-label="Cuadro anterior" title="Cuadro anterior (1/25 s)" onClick={() => stepFrame(-1)} />
          <GradientButton variant="primary" size="lg" icon={isPlaying ? Pause : Play} onClick={togglePlay} className="min-w-[8.5rem]">
            {isPlaying ? 'Pausar' : 'Reproducir'}
          </GradientButton>
          <GradientButton iconOnly icon={SkipForward} aria-label="Cuadro siguiente" title="Cuadro siguiente (1/25 s)" onClick={() => stepFrame(1)} />
        </div>
        <div className="flex min-w-0 max-w-full items-center gap-2">
          <Gauge size={16} className="text-white/40" aria-hidden />
          <SegmentedControl ariaLabel="Velocidad" options={SPEEDS} value={speed} onChange={setSpeed} />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl ariaLabel="Cámara" options={CAMERAS} value={view.cameraMode} onChange={view.setCameraMode} compactOnMobile />
        <div className="scrollbar-none -mx-1 flex min-w-0 gap-2 overflow-x-auto px-1">
          <ToggleChip pressed={view.showLabels} onToggle={view.toggleLabels} icon={Tag} label="Nombres" accent="cyan" />
          <ToggleChip pressed={view.showFOV} onToggle={view.toggleFOV} icon={Eye} label="Visión" accent="amber" title="Conos de visión / ceguera" />
          <ToggleChip pressed={view.showVectors} onToggle={view.toggleVectors} icon={Compass} label="Vectores" accent="lime" title="Vectores de velocidad" />
        </div>
      </div>
      </div>
    </GlassCard>
  );
}

/** Línea de tiempo: lee el reloj del simulador ~20 veces por segundo sin re-renderizar la escena 3D. */
function Timeline({ playback }: { playback: Playback }) {
  const { clock, duration, seek } = playback;
  const [time, setTime] = useState(clock.current ?? 0);

  useEffect(() => {
    const id = setInterval(() => setTime(clock.current ?? 0), 50);
    return () => clearInterval(id);
  }, [clock]);

  const value = Math.min(time, duration);
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 text-right font-mono text-xs tabular-nums text-cyan-200">{value.toFixed(2)}s</span>
      <input
        type="range"
        aria-label="Línea de tiempo"
        min={0}
        max={duration}
        step={0.01}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          seek(v);
          setTime(v);
        }}
        className="timeline-range w-full"
        style={{ '--progress': `${(value / duration) * 100}%` } as React.CSSProperties}
      />
      <span className="w-14 font-mono text-xs tabular-nums text-white/40">{duration.toFixed(2)}s</span>
    </div>
  );
}
