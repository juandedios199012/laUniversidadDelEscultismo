/**
 * Juegos3DPage — simulador de dinámicas grupales con personas en 3D,
 * marcha y carrera realistas y controles Flipbook. Módulo con tema
 * oscuro propio, aislado dentro del contenedor `.juegos3d`.
 */
import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { AuroraBackground } from './components/layout/AuroraBackground';
import { AppHeader } from './components/layout/AppHeader';
import { CurrentGameBar } from './components/CurrentGameBar';
import { GameSelectorModal } from './components/GameSelectorModal';
import { PlaybackPanel } from './components/PlaybackPanel';
import { GameInfoPanel } from './components/GameInfoPanel';
import { SimulatorOverlay } from './components/SimulatorOverlay';
import { RuleNarration } from './components/RuleNarration';
import { usePlayback } from './hooks/usePlayback';
import { useViewSettings } from './hooks/useViewSettings';
import { useFullscreen } from './hooks/useFullscreen';

// El motor 3D (three.js) va en su propio chunk: solo se descarga al abrir el módulo
const GameSimulator = lazy(() => import('./components/GameSimulator').then((m) => ({ default: m.GameSimulator })));

function SceneLoading() {
  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] sm:aspect-[16/10]">
      <div className="flex flex-col items-center gap-3 text-sm text-white/60">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-300" />
        Cargando escena 3D…
      </div>
    </div>
  );
}

export default function Juegos3DPage() {
  const playback = usePlayback();
  const view = useViewSettings();
  const stageRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(stageRef);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const openCatalog = useCallback(() => setCatalogOpen(true), []);
  const closeCatalog = useCallback(() => setCatalogOpen(false), []);

  return (
    <div className="juegos3d relative isolate min-h-full overflow-hidden rounded-3xl">
      <AuroraBackground />
      <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <AppHeader />
        <CurrentGameBar game={playback.game} onOpenCatalog={openCatalog} />

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
            <Suspense fallback={<SceneLoading />}>
              <GameSimulator
                params={playback.params}
                isPlaying={playback.isPlaying}
                speed={playback.speed}
                clock={playback.clock}
                cameraMode={view.cameraMode}
                showFOV={view.showFOV}
                showVectors={view.showVectors}
                showLabels={view.showLabels}
                containerRef={stageRef}
                isFullscreen={fullscreen.isFullscreen}
              >
                <RuleNarration key={playback.game.id} steps={playback.params.steps} clock={playback.clock} duration={playback.duration} />
                <SimulatorOverlay
                  isPlaying={playback.isPlaying}
                  onTogglePlay={playback.togglePlay}
                  cameraMode={view.cameraMode}
                  onCycleCamera={view.cycleCamera}
                  fullscreen={fullscreen}
                />
              </GameSimulator>
            </Suspense>
            <PlaybackPanel playback={playback} view={view} />
          </div>

          <GameInfoPanel game={playback.game} />
        </div>

        <GameSelectorModal open={catalogOpen} onClose={closeCatalog} currentId={playback.game.id} onSelect={playback.selectGame} />
      </main>
    </div>
  );
}
