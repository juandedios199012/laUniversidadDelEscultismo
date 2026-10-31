import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { GameFrame, PieceKind, SetPiece } from '../../engine/types';
import { boxGeo, cylGeo, mat, sphereGeo, torusGeo } from './materials';
import { Stretcher } from './Props3D';

/**
 * Materiales de cada juego en el campo (conos, bordones, cuerdas, baldes, balones…).
 * Piezas simples y livianas: una por tipo de material, repetida `count` veces en un grupo.
 */

const WOOD = '#8B6A43';
const WOOD_DARK = '#6B4F30';
const ROPE = '#C8A86B';

/** Repite una pieza `count` veces en fila corta. */
function Row({ count, step, children }: { count: number; step: [number, number]; children: (i: number) => React.ReactNode }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <group key={i} position={[(i - (count - 1) / 2) * step[0], 0, (i - (count - 1) / 2) * step[1]]}>{children(i)}</group>
      ))}
    </>
  );
}

const Cone = () => (
  <group>
    <mesh geometry={cylGeo(0.015, 0.11, 0.32, 14)} material={mat('#F97316', 0.6)} position={[0, 0.16, 0]} castShadow />
    <mesh geometry={cylGeo(0.055, 0.07, 0.05, 14)} material={mat('#F8FAFC', 0.5)} position={[0, 0.19, 0]} />
    <mesh geometry={boxGeo(0.26, 0.02, 0.26)} material={mat('#EA580C', 0.7)} position={[0, 0.01, 0]} castShadow />
  </group>
);

const ChalkMark = () => (
  <group position={[0, 0.016, 0]}>
    {[Math.PI / 4, -Math.PI / 4].map((a) => (
      <mesh key={a} rotation={[-Math.PI / 2, 0, a]}>
        <planeGeometry args={[0.6, 0.07]} />
        <meshStandardMaterial color="#F1F1E8" roughness={1} />
      </mesh>
    ))}
  </group>
);

const SmallFlag = () => (
  <group>
    <mesh geometry={cylGeo(0.015, 0.018, 1.3, 8)} material={mat(WOOD, 0.8)} position={[0, 0.65, 0]} castShadow />
    <mesh position={[0.18, 1.12, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
      <coneGeometry args={[0.14, 0.36, 3]} />
      <meshStandardMaterial color="#FACC15" roughness={0.8} side={THREE.DoubleSide} />
    </mesh>
  </group>
);

const UP = new THREE.Vector3(0, 1, 0);

const MATERIAL_RENDER: Partial<Record<PieceKind, (count: number) => React.ReactNode>> = {
  cone: () => <Cone />,
  chalk: () => <ChalkMark />,
  flag: () => <SmallFlag />,
  staff: (n) => <Row count={n} step={[0, 0.12]}>{() => <mesh geometry={cylGeo(0.022, 0.022, 1.45, 8)} material={mat(WOOD)} position={[0, 0.024, 0]} rotation={[0, 0, Math.PI / 2]} castShadow />}</Row>,
  rope: (n) => <Row count={Math.min(n, 3)} step={[0.42, 0]}>{() => <mesh geometry={torusGeo(0.15, 0.03, 8, 20)} material={mat(ROPE, 0.95)} position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow />}</Row>,
  stake: (n) => <Row count={Math.max(n, 3)} step={[0.07, 0]}>{() => <mesh geometry={cylGeo(0.018, 0.008, 0.35, 6)} material={mat(WOOD_DARK)} position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow />}</Row>,
  ball: () => <mesh geometry={sphereGeo(16, 12)} material={mat('#F8FAFC', 0.5)} position={[0, 0.11, 0]} scale={0.11} castShadow />,
  bucket: (n) => <Row count={Math.min(n, 2)} step={[0.45, 0]}>{() => (
    <group>
      <mesh geometry={cylGeo(0.16, 0.13, 0.28, 16, true)} material={mat('#64748B', 0.5, 0.3, { side: THREE.DoubleSide })} position={[0, 0.14, 0]} castShadow />
      <mesh geometry={cylGeo(0.15, 0.15, 0.01, 16)} material={mat('#38BDF8', 0.2)} position={[0, 0.2, 0]} />
    </group>
  )}</Row>,
  water: (n) => <Row count={Math.min(n, 4)} step={[0.2, 0]}>{() => <mesh geometry={cylGeo(0.06, 0.07, 0.3, 12)} material={mat('#7DD3FC', 0.15, 0, { transparent: true, opacity: 0.75 })} position={[0, 0.15, 0]} castShadow />}</Row>,
  weight: () => (
    <group position={[0, 0.09, 0]}>
      <mesh geometry={cylGeo(0.018, 0.018, 0.45, 8)} material={mat('#475569', 0.4, 0.6)} rotation={[0, 0, Math.PI / 2]} />
      {[-0.17, 0.17].map((x) => <mesh key={x} geometry={cylGeo(0.09, 0.09, 0.06, 16)} material={mat('#111827', 0.5)} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow />)}
    </group>
  ),
  backpack: (n) => <Row count={Math.min(n, 2)} step={[0.45, 0]}>{() => (
    <group position={[0, 0.22, 0]}>
      <mesh geometry={boxGeo(0.32, 0.44, 0.2)} material={mat('#1E3A8A', 0.85)} castShadow />
      <mesh geometry={boxGeo(0.33, 0.15, 0.21)} material={mat('#172554', 0.85)} position={[0, 0.16, 0]} />
    </group>
  )}</Row>,
  sack: (n) => <Row count={Math.min(n, 3)} step={[0.4, 0]}>{() => <mesh geometry={sphereGeo(12, 10)} material={mat('#A8A29E', 0.95)} position={[0, 0.17, 0]} scale={[0.17, 0.2, 0.15]} castShadow />}</Row>,
  blanket: () => <mesh geometry={boxGeo(1.4, 0.012, 1.0)} material={mat('#B91C1C', 0.95)} position={[0, 0.008, 0]} receiveShadow />,
  board: () => (
    <group position={[0, 0.02, 0]}>
      <mesh geometry={boxGeo(0.6, 0.03, 0.6)} material={mat('#D6B98C', 0.8)} castShadow />
      {[-0.15, 0, 0.15].map((x) => <mesh key={x} geometry={boxGeo(0.01, 0.005, 0.55)} material={mat('#78350F', 0.8)} position={[x, 0.018, 0]} />)}
    </group>
  ),
  cards: () => <mesh geometry={boxGeo(0.14, 0.04, 0.2)} material={mat('#F8FAFC', 0.7)} position={[0, 0.02, 0]} castShadow />,
  paper: () => <mesh geometry={boxGeo(0.7, 0.006, 0.5)} material={mat('#F8FAFC', 0.85)} position={[0, 0.006, 0]} receiveShadow />,
  notebook: (n) => <Row count={Math.min(n, 3)} step={[0.3, 0]}>{() => (
    <group position={[0, 0.01, 0]}>
      <mesh geometry={boxGeo(0.22, 0.012, 0.3)} material={mat('#78350F', 0.7)} castShadow />
      <mesh geometry={boxGeo(0.2, 0.004, 0.27)} material={mat('#F8FAFC', 0.8)} position={[0, 0.008, 0]} />
    </group>
  )}</Row>,
  map: (n) => <Row count={Math.min(n, 2)} step={[0.6, 0]}>{() => (
    <group position={[0, 0.006, 0]}>
      <mesh geometry={boxGeo(0.5, 0.006, 0.36)} material={mat('#EADFC2', 0.9)} receiveShadow />
      <mesh geometry={boxGeo(0.4, 0.004, 0.02)} material={mat('#3B82F6', 0.7)} position={[0, 0.005, 0.05]} rotation={[0, 0.3, 0]} />
    </group>
  )}</Row>,
  tent: () => <mesh geometry={cylGeo(0.13, 0.13, 0.6, 14)} material={mat('#3F6212', 0.9)} position={[0, 0.13, 0]} rotation={[0, 0, Math.PI / 2]} castShadow />,
  hammer: () => (
    <group position={[0, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
      <mesh geometry={cylGeo(0.015, 0.018, 0.38, 6)} material={mat(WOOD, 0.8)} castShadow />
      <mesh geometry={cylGeo(0.045, 0.045, 0.13, 10)} material={mat('#5B4630', 0.8)} position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow />
    </group>
  ),
  blade: () => (
    <group>
      <mesh geometry={cylGeo(0.16, 0.18, 0.32, 12)} material={mat(WOOD_DARK)} position={[0, 0.16, 0]} castShadow />
      <mesh geometry={cylGeo(0.015, 0.018, 0.42, 6)} material={mat(WOOD, 0.8)} position={[0.05, 0.42, 0]} rotation={[0, 0, -0.5]} castShadow />
      <mesh geometry={boxGeo(0.12, 0.08, 0.015)} material={mat('#9CA3AF', 0.3, 0.8)} position={[-0.02, 0.33, 0]} />
    </group>
  ),
  fire: () => (
    <group>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return <mesh key={i} geometry={cylGeo(0.012, 0.015, 0.34, 6)} material={mat(WOOD_DARK)} position={[Math.cos(a) * 0.06, 0.14, Math.sin(a) * 0.06]} rotation={[Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]} castShadow />;
      })}
    </group>
  ),
  logs: (n) => <Row count={Math.min(Math.max(n, 2), 3)} step={[0, 0.17]}>{() => <mesh geometry={cylGeo(0.07, 0.075, 0.9, 10)} material={mat(WOOD_DARK)} position={[0, 0.075, 0]} rotation={[0, 0, Math.PI / 2]} castShadow />}</Row>,
  natural: () => (
    <group>
      {Array.from({ length: 9 }, (_, i) => {
        const a = i * 2.4;
        return <mesh key={i} geometry={sphereGeo(8, 6)} material={mat(['#B45309', '#A16207', '#78716C'][i % 3], 0.9)} position={[Math.cos(a) * 0.12 * (1 + (i % 3)), 0.025, Math.sin(a) * 0.1 * (1 + (i % 3))]} scale={[0.06, 0.02, 0.08]} castShadow />;
      })}
      <mesh geometry={cylGeo(0.01, 0.01, 0.5, 5)} material={mat(WOOD_DARK)} position={[0.05, 0.02, 0]} rotation={[0, 0.6, Math.PI / 2]} />
    </group>
  ),
  first_aid_kit: () => (
    <group position={[0, 0.08, 0]}>
      <mesh geometry={boxGeo(0.4, 0.16, 0.28)} material={mat('#DC2626', 0.5)} castShadow />
      <mesh geometry={boxGeo(0.05, 0.005, 0.16)} material={mat('#FFFFFF', 0.4)} position={[0, 0.082, 0]} />
      <mesh geometry={boxGeo(0.16, 0.005, 0.05)} material={mat('#FFFFFF', 0.4)} position={[0, 0.082, 0]} />
    </group>
  ),
  tape: () => (
    <group>
      {[-0.7, 0.7].map((x) => <mesh key={x} geometry={cylGeo(0.02, 0.015, 0.7, 6)} material={mat(WOOD_DARK)} position={[x, 0.35, 0]} castShadow />)}
      <mesh geometry={boxGeo(1.4, 0.06, 0.004)} material={mat('#EF4444', 0.6)} position={[0, 0.6, 0]} />
      {[-0.45, 0, 0.45].map((x) => <mesh key={x} geometry={boxGeo(0.14, 0.061, 0.005)} material={mat('#F8FAFC', 0.6)} position={[x, 0.6, 0]} />)}
    </group>
  ),
  tape_measure: () => (
    <group>
      <mesh geometry={cylGeo(0.07, 0.07, 0.05, 16)} material={mat('#FACC15', 0.5)} position={[0, 0.035, 0]} castShadow />
      <mesh geometry={boxGeo(1.6, 0.003, 0.025)} material={mat('#FDE047', 0.6)} position={[0.85, 0.004, 0]} />
    </group>
  ),
  stool: () => (
    <group>
      <mesh geometry={cylGeo(0.17, 0.17, 0.04, 14)} material={mat(WOOD, 0.7)} position={[0, 0.42, 0]} castShadow />
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return <mesh key={i} geometry={cylGeo(0.018, 0.018, 0.42, 6)} material={mat(WOOD_DARK)} position={[Math.cos(a) * 0.11, 0.21, Math.sin(a) * 0.11]} castShadow />;
      })}
    </group>
  ),
  food: () => (
    <group>
      <mesh geometry={sphereGeo(14, 10)} material={mat('#E7E5E4', 0.4)} position={[0, 0.06, 0]} scale={[0.17, 0.08, 0.17]} castShadow />
      <mesh geometry={sphereGeo(10, 8)} material={mat('#E7C99A', 0.85)} position={[0, 0.11, 0]} scale={[0.1, 0.05, 0.1]} />
    </group>
  ),
  camp_gear: () => (
    <group>
      <mesh geometry={cylGeo(0.09, 0.09, 0.6, 14)} material={mat('#0E7490', 0.8)} position={[0, 0.09, 0]} rotation={[0, 0, Math.PI / 2]} castShadow />
      <mesh geometry={sphereGeo(10, 8)} material={mat('#57534E', 0.9)} position={[0, 0.14, 0.32]} scale={[0.2, 0.14, 0.15]} castShadow />
    </group>
  ),
  flashlight: () => <mesh geometry={cylGeo(0.025, 0.035, 0.22, 10)} material={mat('#111827', 0.4, 0.4)} position={[0, 0.03, 0]} rotation={[0, 0, Math.PI / 2]} castShadow />,
};

// Piezas de escena de las coreografías (no vienen del Excel)
Object.assign(MATERIAL_RENDER, {
  post: () => (
    <group>
      <mesh geometry={cylGeo(0.05, 0.06, 1.4, 10)} material={mat(WOOD_DARK)} position={[0, 0.7, 0]} castShadow />
      {[0.55, 0.62, 0.69].map((y) => <mesh key={y} geometry={torusGeo(0.065, 0.014, 6, 14)} material={mat(ROPE, 0.95)} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} />)}
    </group>
  ),
  table: () => (
    <group>
      <mesh geometry={boxGeo(1.0, 0.05, 0.6)} material={mat(WOOD, 0.7)} position={[0, 0.74, 0]} castShadow receiveShadow />
      {[[-0.44, -0.24], [0.44, -0.24], [-0.44, 0.24], [0.44, 0.24]].map(([x, z]) => <mesh key={`${x},${z}`} geometry={cylGeo(0.025, 0.025, 0.72, 8)} material={mat(WOOD_DARK)} position={[x, 0.36, z]} castShadow />)}
      <mesh geometry={cylGeo(0.14, 0.12, 0.12, 16, true)} material={mat('#94A3B8', 0.4, 0.4, { side: THREE.DoubleSide })} position={[-0.2, 0.83, 0]} />
      <mesh geometry={cylGeo(0.13, 0.13, 0.01, 16)} material={mat('#38BDF8', 0.2)} position={[-0.2, 0.86, 0]} />
      <mesh geometry={boxGeo(0.09, 0.04, 0.06)} material={mat('#FDE68A', 0.6)} position={[0.25, 0.79, 0.05]} />
    </group>
  ),
  easel: () => (
    <group>
      {[-0.3, 0.3].map((x) => <mesh key={x} geometry={cylGeo(0.02, 0.02, 1.5, 6)} material={mat(WOOD)} position={[x, 0.75, 0]} rotation={[0.12, 0, 0]} castShadow />)}
      <mesh geometry={boxGeo(0.8, 0.6, 0.02)} material={mat('#1F2937', 0.8)} position={[0, 1.15, 0.05]} rotation={[-0.12, 0, 0]} castShadow />
      <mesh geometry={boxGeo(0.7, 0.5, 0.005)} material={mat('#F8FAFC', 0.8)} position={[0, 1.15, 0.065]} rotation={[-0.12, 0, 0]} />
      {[[-0.15, 1.2, 0.3], [0.12, 1.08, -0.4]].map(([x, y, r]) => <mesh key={x} geometry={boxGeo(0.3, 0.012, 0.004)} material={mat('#DC2626', 0.6)} position={[x, y, 0.07]} rotation={[-0.12, 0, r]} />)}
    </group>
  ),
  crossed_staffs: () => (
    <group position={[0, 0.85, 0]}>
      <mesh geometry={cylGeo(0.035, 0.035, 1.7, 8)} material={mat(WOOD)} castShadow />
      <mesh geometry={cylGeo(0.035, 0.035, 1.4, 8)} material={mat(WOOD)} rotation={[0, 0, Math.PI / 2]} position={[0, 0.25, 0.04]} castShadow />
      <mesh geometry={torusGeo(0.07, 0.018, 8, 14)} material={mat(ROPE, 0.95)} position={[0, 0.25, 0.02]} rotation={[0, 0, Math.PI / 4]} />
    </group>
  ),
  x_staffs: () => (
    <group position={[0, 0.8, 0]}>
      {[0.55, -0.55].map((r) => <mesh key={r} geometry={cylGeo(0.035, 0.035, 1.9, 8)} material={mat(WOOD)} rotation={[0, 0, r]} castShadow />)}
      <mesh geometry={torusGeo(0.075, 0.018, 8, 14)} material={mat(ROPE, 0.95)} rotation={[0, 0, Math.PI / 4]} />
    </group>
  ),
  target: () => (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
      <ringGeometry args={[0.42, 0.5, 32]} />
      <meshStandardMaterial color="#F1F1E8" roughness={1} />
    </mesh>
  ),
  stretcher: () => <Stretcher />,
  chest: () => (
    <group position={[0, 0.17, 0]}>
      <mesh geometry={boxGeo(0.55, 0.3, 0.36)} material={mat('#7C4A1E', 0.7)} castShadow />
      <mesh geometry={cylGeo(0.18, 0.18, 0.55, 14, false)} material={mat('#8B5A2B', 0.7)} position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1]} castShadow />
      <mesh geometry={boxGeo(0.57, 0.04, 0.38)} material={mat('#D4A72C', 0.3, 0.8)} position={[0, 0.02, 0]} />
    </group>
  ),
  tripod_goal: () => (
    <group>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return <mesh key={i} geometry={cylGeo(0.025, 0.025, 1.9, 8)} material={mat(WOOD)} position={[Math.cos(a) * 0.32, 0.9, Math.sin(a) * 0.32]} rotation={[Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]} castShadow />;
      })}
      <mesh geometry={torusGeo(0.22, 0.02, 8, 20)} material={mat('#F59E0B', 0.5)} position={[0, 1.45, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  ),
  sand: () => <mesh geometry={boxGeo(1.6, 0.02, 1.1)} material={mat('#C2A878', 1)} position={[0, 0.01, 0]} receiveShadow />,
  footprints: () => (
    <group position={[0, 0.025, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} geometry={sphereGeo(8, 6)} material={mat('#6B5132', 1)} position={[-0.5 + i * 0.32, 0, (i % 2 ? 0.1 : -0.1)]} scale={[0.07, 0.006, 0.12]} />
      ))}
    </group>
  ),
  litter: () => (
    <group>
      {Array.from({ length: 6 }, (_, i) => {
        const a = i * 2.1;
        return <mesh key={i} geometry={boxGeo(0.12, 0.03, 0.08)} material={mat(['#F8FAFC', '#3B82F6', '#EF4444'][i % 3], 0.6)} position={[Math.cos(a) * (0.3 + i * 0.25), 0.015, Math.sin(a) * (0.3 + i * 0.2)]} rotation={[0, a, 0]} castShadow />;
      })}
    </group>
  ),
} satisfies Partial<Record<PieceKind, (count: number) => React.ReactNode>>);

/** Cuerda tendida entre dos puntos a cierta altura. */
function RopeLine({ from, to, height }: { from: SetPiece['pos']; to: SetPiece['pos']; height: number }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(from.x, height, from.z);
    const b = new THREE.Vector3(to.x, height, to.z);
    const dir = b.clone().sub(a);
    return { position: a.clone().add(b).multiplyScalar(0.5), quaternion: new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()), length: dir.length() };
  }, [from, to, height]);
  return <mesh geometry={cylGeo(0.012, 0.012, 1, 6)} material={mat(ROPE, 0.95)} position={position} quaternion={quaternion} scale={[1, length, 1]} castShadow />;
}

/** Dibuja una pieza (material o pieza de escena) en su lugar. */
function Piece({ piece }: { piece: SetPiece }) {
  if (piece.kind === 'rope_line' && piece.to) return <RopeLine from={piece.pos} to={piece.to} height={piece.height ?? 1} />;
  const render = MATERIAL_RENDER[piece.kind];
  if (!render) return null;
  return (
    <group position={[piece.pos.x, piece.height ?? 0, piece.pos.z]} rotation={[0, piece.rotation ?? 0, 0]}>
      {render(piece.count ?? 1)}
    </group>
  );
}

/** Piezas fijas: materiales del juego (motor paramétrico) y piezas de la coreografía. */
export function MaterialProps({ items }: { items: SetPiece[] }) {
  return (
    <>
      {items.map((it, i) => (
        <Piece key={`${it.kind}-${i}`} piece={it} />
      ))}
    </>
  );
}

/** Piezas que se mueven: se crean una vez y su posición se actualiza en cada cuadro. */
export function DynamicItems({ frameRef, ids }: { frameRef: React.RefObject<GameFrame | null>; ids: string[] }) {
  const groups = useRef(new Map<string, THREE.Object3D>());
  const initial = useMemo(() => new Map((frameRef.current?.items ?? []).map((it) => [it.id, it])), [frameRef]);
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    for (const it of frameRef.current?.items ?? []) {
      const g = groups.current.get(it.id);
      if (!g) continue;
      if (it.kind === 'rope_line' && it.to) {
        // Cuerda móvil entre dos puntos (p. ej. la red de lana que se va tejiendo)
        a.set(it.pos.x, it.height ?? 1, it.pos.z);
        b.set(it.to.x, it.height ?? 1, it.to.z);
        const len = a.distanceTo(b);
        g.visible = len > 0.01 && (it.height ?? 1) > -1;
        g.position.copy(a).add(b).multiplyScalar(0.5);
        g.quaternion.setFromUnitVectors(UP, b.sub(a).normalize());
        g.scale.set(1, Math.max(len, 0.001), 1);
        continue;
      }
      g.visible = (it.height ?? 0) > -1;
      g.position.set(it.pos.x, it.height ?? 0, it.pos.z);
      g.rotation.y = it.rotation ?? 0;
    }
  });
  return (
    <>
      {ids.map((id) => {
        const it = initial.get(id);
        if (!it) return null;
        const bind = (g: THREE.Object3D | null) => { if (g) groups.current.set(id, g); else groups.current.delete(id); };
        if (it.kind === 'rope_line') {
          return <mesh key={id} ref={bind} geometry={cylGeo(0.01, 0.01, 1, 6)} material={mat('#F59E0B', 0.9)} castShadow />;
        }
        const render = MATERIAL_RENDER[it.kind];
        return (
          <group key={id} ref={bind}>
            {render?.(it.count ?? 1)}
          </group>
        );
      })}
    </>
  );
}
