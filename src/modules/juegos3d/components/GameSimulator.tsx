import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerformanceMonitor } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { FieldLayout, GameFrame } from '../engine/types';
import { getGame, getGameFrame } from '../engine/gameEngines';
import { applyFieldVariant, applyFrameVariant, makeRecolor } from '../engine/variants';
import { dressField } from '../engine/dressing';
import type { SceneParams } from '../lib/sceneParams';
import { Environment3D, type RenderQuality } from './three/Environment3D';
import { OverlayOptions, PersonModel } from './three/PersonModel';
import { cn } from '../lib/cn';

export type CameraMode = 'tactical' | 'follow' | 'free';

interface GameSimulatorProps {
  /** Escena paramétrica del juego: tipo de escena + objetos, variante y narración propios. */
  params: SceneParams;
  isPlaying: boolean;
  speed: number;
  /** Reloj compartido con los controles (segundos). Se muta en cada cuadro sin re-renderizar React. */
  clock: React.RefObject<number>;
  cameraMode: CameraMode;
  showFOV: boolean;
  showVectors: boolean;
  showLabels: boolean;
  /** Contenedor (para pantalla completa) y controles superpuestos a la escena. */
  containerRef?: React.RefObject<HTMLDivElement | null>;
  isFullscreen?: boolean;
  children?: React.ReactNode;
}

/** Avanza el reloj y calcula el estado del juego una vez por cuadro, antes que los competidores. */
function Playback({ frameAt, duration, isPlaying, speed, clock, frameRef }: {
  frameAt: (t: number) => GameFrame; duration: number; isPlaying: boolean; speed: number;
  clock: React.RefObject<number>; frameRef: React.RefObject<GameFrame | null>;
}) {
  useFrame((_, delta) => {
    if (isPlaying) clock.current = ((clock.current ?? 0) + Math.min(delta, 0.1) * speed) % duration;
    frameRef.current = frameAt(clock.current ?? 0);
  }, -1);
  return null;
}

/** Escena base + parámetros del juego → todo lo que necesita el render (calculado una vez por juego). */
function useParametricScene(params: SceneParams) {
  return useMemo(() => {
    const base = getGame(params.scene, params.activity);
    const appearances = base.competitors.map((c) => c.appearance);
    const recolor = makeRecolor(appearances, params.variant);
    const field = applyFieldVariant(base.field, params.variant);
    return {
      base,
      field,
      dressing: dressField(field, params.scene, params.visibleProps, params.seed),
      looks: appearances.map((a) => {
        const [teamColor, secondaryColor] = recolor(a.teamColor, a.secondaryColor);
        return { ...a, teamColor, secondaryColor };
      }),
      frameAt: (t: number) => applyFrameVariant(getGameFrame(params.scene, t, params.activity), params.variant, recolor, params.leaderHandProp),
    };
  }, [params]);
}

type LabelEls = Map<string, { box: HTMLDivElement; action: HTMLDivElement; last?: string }>;

/** Proyecta la cabeza de cada competidor a la pantalla y mueve su etiqueta HTML (sin re-renderizar React). */
function LabelProjector({ frameRef, labels }: { frameRef: React.RefObject<GameFrame | null>; labels: React.RefObject<LabelEls> }) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const frame = frameRef.current;
    if (!frame) return;
    for (const s of frame.competitors) {
      const el = labels.current?.get(s.id);
      if (!el) continue;
      v.set(s.pos.x, s.height + 0.45, s.pos.z).project(camera);
      const visible = v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2;
      el.box.style.visibility = visible ? 'visible' : 'hidden';
      if (!visible) continue;
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      el.box.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
      el.box.style.zIndex = String(Math.round((1 - v.z) * 100000));
      if (el.last !== s.actionLabel) {
        el.last = s.actionLabel;
        el.action.textContent = s.actionLabel ?? '';
        el.action.style.display = s.actionLabel ? 'block' : 'none';
      }
    }
  });
  return null;
}

/** Mide los FPS reales y los escribe en el indicador (2 veces por segundo, sin re-renderizar React). */
function FpsMeter({ target }: { target: React.RefObject<HTMLSpanElement | null> }) {
  const acc = useRef({ frames: 0, time: 0 });
  useFrame((_, delta) => {
    acc.current.frames++;
    acc.current.time += delta;
    if (acc.current.time >= 0.5) {
      if (target.current) target.current.textContent = `${Math.round(acc.current.frames / acc.current.time)} FPS`;
      acc.current = { frames: 0, time: 0 };
    }
  });
  return null;
}

function tacticalPreset(field: FieldLayout) {
  // Distancia para que entren el ancho del campo y su fondo (con el almacén de materiales del borde)
  // dentro del campo de visión (42° vertical; ~54° horizontal en pantallas 4:3, el caso más angosto).
  const width = field.width + 3;
  const depth = field.depth + 4;
  const dist = Math.max(0.95 * width, 1.25 * depth);
  return new THREE.Vector3(0, dist * 0.62, dist * 0.78);
}

function CameraRig({ mode, field, focusId, frameRef }: {
  mode: CameraMode; field: FieldLayout; focusId: string; frameRef: React.RefObject<GameFrame | null>;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const target = useRef(new THREE.Vector3()); // punto al que mira la cámara (compartido entre modos)
  const { camera } = useThree();
  const preset = useMemo(() => tacticalPreset(field), [field]);
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const settle = useRef(0);
  const followPos = useMemo(() => new THREE.Vector3(), []);
  const followTarget = useMemo(() => new THREE.Vector3(), []);
  const snap = useRef(true); // primer cuadro tras montar (o cambiar de juego): ubicar la cámara sin transición

  useEffect(() => {
    settle.current = 1.5; // al cambiar de juego, encuadrar el campo también en modo libre
  }, [field]);

  useFrame((_, dt) => {
    const t = target.current;
    if (mode === 'free' && controls.current && settle.current <= 0) {
      t.copy(controls.current.target); // el usuario manda; recordamos dónde quedó mirando
      return;
    }
    if (mode === 'follow') {
      // Cámara de acompañamiento: detrás y al costado del protagonista, a la altura de una persona
      const s = frameRef.current?.competitors.find((x) => x.id === focusId);
      if (s) {
        const fx = Math.cos(s.heading), fz = Math.sin(s.heading);
        followPos.set(s.pos.x - fx * 4.2 - fz * 2.6, 2.1, s.pos.z - fz * 4.2 + fx * 2.6);
        followTarget.set(s.pos.x + fx * 1.5, 0.9, s.pos.z + fz * 1.5);
        const k = snap.current ? 1 : 1 - Math.exp(-dt * 2.2);
        camera.position.lerp(followPos, k);
        t.lerp(followTarget, k);
        camera.lookAt(t);
        snap.current = false;
      }
      return;
    }
    if (mode === 'tactical' || settle.current > 0) {
      const k = snap.current ? 1 : 1 - Math.exp(-dt * 3.5);
      snap.current = false;
      camera.position.lerp(preset, k);
      t.lerp(origin, k);
      camera.lookAt(t);
      controls.current?.target.copy(t);
      settle.current -= dt;
    }
  });

  // OrbitControls solo existe en modo libre: así en los otros modos el dedo puede desplazar la página en móvil
  if (mode !== 'free') return null;
  return (
    <OrbitControls
      ref={controls}
      target={target.current.toArray()}
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={1.47}
      minDistance={1.5}
      maxDistance={90}
    />
  );
}

function Scene({ params, isPlaying, speed, clock, cameraMode, overlays, labels, quality, fpsRef }: Pick<GameSimulatorProps, 'params' | 'isPlaying' | 'speed' | 'clock' | 'cameraMode'> & {
  overlays: OverlayOptions; labels: React.RefObject<LabelEls>; quality: RenderQuality; fpsRef: React.RefObject<HTMLSpanElement | null>;
}) {
  const { base, field, dressing, looks, frameAt } = useParametricScene(params);
  const frameRef = useRef<GameFrame | null>(frameAt(clock.current ?? 0));
  const flagIds = useMemo(() => frameAt(0).flags.map((f) => f.id), [frameAt]);

  return (
    <>
      <Playback frameAt={frameAt} duration={base.duration} isPlaying={isPlaying} speed={speed} clock={clock} frameRef={frameRef} />
      <Environment3D field={field} frameRef={frameRef} flagIds={flagIds} quality={quality} dressing={dressing} sunAngle={params.variant.sunAngle} />
      {looks.map((look, i) => (
        <PersonModel key={look.id} index={i} look={look} frameRef={frameRef} timeRef={clock} overlays={overlays} />
      ))}
      <CameraRig mode={cameraMode} field={field} focusId={base.focusId} frameRef={frameRef} />
      <LabelProjector frameRef={frameRef} labels={labels} />
      <FpsMeter target={fpsRef} />
    </>
  );
}

export const GameSimulator: React.FC<GameSimulatorProps> = React.memo(function GameSimulator({
  params, isPlaying, speed, clock, cameraMode, showFOV, showVectors, showLabels, containerRef, isFullscreen, children,
}) {
  const overlays = useMemo(() => ({ showFOV, showVectors }), [showFOV, showVectors]);
  const labels = useRef<LabelEls>(new Map());
  const fpsRef = useRef<HTMLSpanElement>(null);
  const competitors = getGame(params.scene, params.activity).competitors;
  const initialCamera = useMemo(() => tacticalPreset(getGame(params.scene, params.activity).field), []); // eslint-disable-line react-hooks/exhaustive-deps
  // Pantallas táctiles (móviles/tablets): menos pasto y sombras más livianas
  const quality = useMemo<RenderQuality>(() => (window.matchMedia('(pointer: coarse)').matches ? 'low' : 'high'), []);
  const [dpr, setDpr] = useState(quality === 'low' ? 1.25 : 1.75);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden bg-ink-950',
        isFullscreen
          ? 'h-full'
          : 'aspect-[4/3] max-h-[72vh] rounded-3xl border border-white/10 shadow-[0_20px_60px_-20px_rgba(139,92,246,0.45)] sm:aspect-[16/10]'
      )}
    >
      <Canvas
        shadows="percentage"
        dpr={dpr}
        camera={{ fov: 42, near: 0.1, far: 400, position: initialCamera.toArray() }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05, powerPreference: 'high-performance' }}
      >
        {/* Baja la resolución si el dispositivo no sostiene la fluidez y la recupera cuando puede */}
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(quality === 'low' ? 1.5 : 2)} />
        {/* Una escena por juego: al cambiar de juego se reconstruye con sus propios parámetros */}
        <Scene key={params.gameId} params={params} isPlaying={isPlaying} speed={speed} clock={clock} cameraMode={cameraMode} overlays={overlays} labels={labels} quality={quality} fpsRef={fpsRef} />
      </Canvas>

      {/* Etiquetas de nombre y acción (las posiciona LabelProjector en cada cuadro) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ display: showLabels ? 'block' : 'none' }}>
        {competitors.map(({ appearance: a }) => (
          <div
            key={a.id}
            ref={(box) => {
              const action = box?.lastElementChild as HTMLDivElement | null;
              if (box && action) labels.current.set(a.id, { box, action });
              else labels.current.delete(a.id);
            }}
            className={cn(
              'absolute left-0 top-0 select-none whitespace-nowrap rounded-lg border px-2 py-0.5 text-center text-[11px] leading-tight text-white backdrop-blur-md',
              a.role === 'lider'
                ? 'border-white/30 bg-gradient-to-r from-amber-500/85 to-pink-500/85 shadow-[0_0_16px_-4px_rgba(236,72,153,0.8)]'
                : 'border-white/15 bg-black/45'
            )}
            style={{ visibility: 'hidden' }}
          >
            <div className="font-semibold">{a.role === 'lider' ? `★ ${a.name} · Líder` : a.name}</div>
            <div className="text-[10px] font-medium text-white/80" style={{ display: 'none' }} />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[10px] text-lime-300 backdrop-blur-md">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-400" />
        <span>3D</span>
        <span ref={fpsRef} className="tabular-nums">— FPS</span>
      </div>
      {cameraMode === 'free' && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] text-white/75 backdrop-blur-md">
          Arrastra para girar · Pellizca o rueda para acercar · Dos dedos para mover
        </div>
      )}
      {children}
    </div>
  );
});
