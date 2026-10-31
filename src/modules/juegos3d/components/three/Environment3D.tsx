import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { DressingItem, FieldLayout, GameFrame, TreeEntity } from '../../engine/types';
import { mat } from './materials';
import { Props3D } from './Props3D';
import { DynamicItems, MaterialProps } from './MaterialProps';

/** 'low' en pantallas táctiles: menos briznas de pasto y sombras más livianas. */
export type RenderQuality = 'high' | 'low';

/** Generador pseudoaleatorio determinista (el parque se ve igual en cada carga). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function useGrassTexture() {
  return useMemo(() => {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d')!;
    g.fillStyle = '#4C7A2E';
    g.fillRect(0, 0, size, size);
    const r = rng(7);
    for (let i = 0; i < 14000; i++) {
      const x = r() * size, y = r() * size;
      const l = 30 + r() * 22;
      g.fillStyle = `hsla(${88 + r() * 22}, ${38 + r() * 20}%, ${l}%, ${0.25 + r() * 0.35})`;
      g.fillRect(x, y, 1 + r() * 2, 2 + r() * 5);
    }
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(${r() < 0.5 ? '110,95,50' : '40,70,25'}, ${0.08 + r() * 0.1})`;
      g.beginPath();
      g.arc(r() * size, r() * size, 10 + r() * 40, 0, Math.PI * 2);
      g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(36, 36);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

/** Briznas de pasto instanciadas con balanceo por viento en el vertex shader. */
function GrassBlades({ width, depth, density }: { width: number; depth: number; density: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const area = (width + 14) * (depth + 14);
  const count = Math.min(90000, Math.floor(area * density));

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#5E8F36', roughness: 0.95 });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
           float sway = sin(uTime * 1.7 + wp.x * 0.35 + wp.z * 0.22) * 0.5 + sin(uTime * 3.1 + wp.x * 1.3) * 0.18;
           transformed.x += sway * position.y * position.y * 4.0;`
        );
    };
    return m;
  }, [uniforms]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // Brizna: 5 vértices, ahusada hacia la punta
    const v = new Float32Array([-0.012, 0, 0, 0.012, 0, 0, -0.007, 0.05, 0.004, 0.007, 0.05, 0.004, 0, 0.11, 0.012]);
    g.setAttribute('position', new THREE.BufferAttribute(v, 3));
    // Ambas caras como triángulos propios (no DoubleSide, que invierte la normal y las oscurece)
    g.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4, 0, 2, 1, 2, 3, 1, 2, 4, 3]);
    // Normales hacia arriba: el pasto se ilumina como el suelo (sin briznas negras a contraluz)
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]), 3));
    return g;
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const r = rng(42);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const x = (r() - 0.5) * (width + 14);
      const z = (r() - 0.5) * (depth + 14);
      e.set((r() - 0.5) * 0.5, r() * Math.PI * 2, (r() - 0.5) * 0.5);
      q.setFromEuler(e);
      const s = 0.6 + r() * 0.8;
      m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s * (0.6 + r() * 0.7), s));
      mesh.setMatrixAt(i, m);
      color.setHSL(0.23 + r() * 0.06, 0.4 + r() * 0.2, 0.36 + r() * 0.14);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, width, depth]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <instancedMesh ref={ref} args={[geometry, material, count]} receiveShadow frustumCulled={false} />;
}

/** Árbol con tronco, ramas principales y copa de varias masas de follaje irregulares. */
function Tree({ tree, seed }: { tree: TreeEntity; seed: number }) {
  const blobs = useMemo(() => {
    const r = rng(seed * 97 + 13);
    const list: { pos: [number, number, number]; scale: number; color: string; geo: THREE.BufferGeometry }[] = [];
    const base = new THREE.Color(tree.foliageColor);
    for (let i = 0; i < 9; i++) {
      const a = r() * Math.PI * 2;
      const rad = r() * tree.canopyRadius * 0.6;
      const y = tree.height * 0.62 + r() * tree.canopyRadius * 0.9;
      const ico = new THREE.IcosahedronGeometry(1, 4);
      ico.deleteAttribute('normal');
      ico.deleteAttribute('uv');
      const geo = mergeVertices(ico);
      const p = geo.attributes.position as THREE.BufferAttribute;
      for (let k = 0; k < p.count; k++) {
        const x = p.getX(k), y = p.getY(k), z = p.getZ(k);
        // Ruido determinista por posición: masas de hojas irregulares sin grietas
        const n = 1 + Math.sin(x * 6 + seed) * Math.cos(y * 5 + i) * 0.1 + Math.sin(z * 11 + x * 9 + i) * 0.05;
        p.setXYZ(k, x * n, y * n * 0.85, z * n);
      }
      geo.computeVertexNormals();
      const c = base.clone().offsetHSL((r() - 0.5) * 0.03, 0, (r() - 0.3) * 0.08);
      list.push({ pos: [Math.cos(a) * rad, y, Math.sin(a) * rad], scale: tree.canopyRadius * (0.5 + r() * 0.35), color: `#${c.getHexString()}`, geo });
    }
    return list;
  }, [tree, seed]);

  const bark = mat('#4A3626', 0.95);
  const trunkH = tree.height * 0.7;
  return (
    <group position={[tree.x, 0, tree.z]}>
      <mesh position={[0, trunkH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.3, trunkH, 12]} />
        <primitive object={bark} attach="material" />
      </mesh>
      {[0.4, 2.3, 4.2].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.35, trunkH * (0.72 + i * 0.06), Math.sin(a) * 0.35]} rotation={[Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8]} castShadow>
          <cylinderGeometry args={[0.05, 0.1, 1.1, 8]} />
          <primitive object={bark} attach="material" />
        </mesh>
      ))}
      {blobs.map((b, i) => (
        <mesh key={i} geometry={b.geo} position={b.pos} scale={b.scale} material={mat(b.color, 0.9)} castShadow receiveShadow />
      ))}
    </group>
  );
}

/** Hileras de árboles lejanos para dar horizonte de parque. */
function BackdropForest({ radius }: { radius: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const count = 140;
  useLayoutEffect(() => {
    const r = rng(99);
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + r() * 0.05;
      const d = radius + r() * 22;
      const s = 2.2 + r() * 2.8;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      m.compose(new THREE.Vector3(x, s * 1.6 + 1.5, z), new THREE.Quaternion(), new THREE.Vector3(s, s * 1.25, s));
      ref.current!.setMatrixAt(i, m);
      c.setHSL(0.27 + r() * 0.05, 0.35 + r() * 0.15, 0.17 + r() * 0.08);
      ref.current!.setColorAt(i, c);
      m.compose(new THREE.Vector3(x, 1.5, z), new THREE.Quaternion(), new THREE.Vector3(1, 3, 1));
      trunks.current!.setMatrixAt(i, m);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
    trunks.current!.instanceMatrix.needsUpdate = true;
  }, [radius]);
  return (
    <>
      <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow={false}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.15, 0.25, 1, 6]} />
        <meshStandardMaterial color="#3D2B1D" roughness={1} />
      </instancedMesh>
    </>
  );
}

/** Línea de tiza sobre el pasto. */
function Chalk({ from, to, width = 0.08, dashed = false }: { from: [number, number]; to: [number, number]; width?: number; dashed?: boolean }) {
  const dx = to[0] - from[0], dz = to[1] - from[1];
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  const segs = dashed ? Math.floor(len / 0.9) : 1;
  return (
    <group position={[from[0], 0.015, from[1]]} rotation={[0, -angle, 0]}>
      {Array.from({ length: segs }, (_, i) => {
        const segLen = dashed ? 0.55 : len;
        const x = dashed ? i * 0.9 + segLen / 2 : len / 2;
        return (
          <mesh key={i} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[segLen, width]} />
            <meshStandardMaterial color="#F1F1E8" roughness={1} transparent opacity={0.85} />
          </mesh>
        );
      })}
    </group>
  );
}

function FieldMarkings({ field }: { field: FieldLayout }) {
  const hw = field.width / 2, hd = field.depth / 2;
  return (
    <group>
      <Chalk from={[-hw, -hd]} to={[hw, -hd]} dashed />
      <Chalk from={[-hw, hd]} to={[hw, hd]} dashed />
      <Chalk from={[-hw, -hd]} to={[-hw, hd]} dashed />
      <Chalk from={[hw, -hd]} to={[hw, hd]} dashed />
      {field.midline && <Chalk from={[0, -hd]} to={[0, hd]} width={0.12} />}
      {field.circle && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[field.circle.center.x, 0.016, field.circle.center.z]}>
          <ringGeometry args={[field.circle.radius + 0.55, field.circle.radius + 0.62, 96]} />
          <meshStandardMaterial color="#F1F1E8" roughness={1} transparent opacity={0.6} />
        </mesh>
      )}
      {field.finish && (
        <group>
          {Array.from({ length: Math.round((field.finish.z1 - field.finish.z0) / 0.3) }, (_, i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[field.finish!.x + (i % 2) * 0.15, 0.016, field.finish!.z0 + i * 0.3 + 0.15]}>
              <planeGeometry args={[0.15, 0.3]} />
              <meshStandardMaterial color={i % 2 ? '#111111' : '#F5F5F5'} roughness={1} />
            </mesh>
          ))}
        </group>
      )}
      {field.zones.map((z) => (
        <group key={z.label}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[z.center.x, 0.012, z.center.z]}>
            <planeGeometry args={[z.size.w, z.size.d]} />
            <meshBasicMaterial color={z.color} transparent opacity={0.12} depthWrite={false} />
          </mesh>
          <Chalk from={[z.center.x - z.size.w / 2, z.center.z - z.size.d / 2]} to={[z.center.x + z.size.w / 2, z.center.z - z.size.d / 2]} />
          <Chalk from={[z.center.x - z.size.w / 2, z.center.z + z.size.d / 2]} to={[z.center.x + z.size.w / 2, z.center.z + z.size.d / 2]} />
          <Chalk from={[z.center.x - z.size.w / 2, z.center.z - z.size.d / 2]} to={[z.center.x - z.size.w / 2, z.center.z + z.size.d / 2]} />
          <Chalk from={[z.center.x + z.size.w / 2, z.center.z - z.size.d / 2]} to={[z.center.x + z.size.w / 2, z.center.z + z.size.d / 2]} />
        </group>
      ))}
    </group>
  );
}

/** Banderín de equipo clavado: bordón de madera y tela que ondea. */
function PlantedFlag({ flagId, frameRef }: { flagId: string; frameRef: React.RefObject<GameFrame | null> }) {
  const group = useRef<THREE.Group>(null);
  const cloth = useRef<THREE.Mesh>(null);
  const meta = useRef<{ color: string; secondary: string } | null>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(0.75, 0.48, 14, 8).translate(0.375, 0, 0), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo]);
  const texture = useMemo(() => {
    const f = frameRef.current?.flags.find((x) => x.id === flagId);
    meta.current = f ? { color: f.color, secondary: f.secondaryColor } : { color: '#B91C1C', secondary: '#fff' };
    const c = document.createElement('canvas');
    c.width = 96; c.height = 64;
    const g = c.getContext('2d')!;
    g.fillStyle = meta.current.color; g.fillRect(0, 0, 96, 64);
    g.fillStyle = meta.current.secondary;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(96, 32); g.lineTo(0, 64); g.lineTo(0, 50); g.lineTo(64, 32); g.lineTo(0, 14); g.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [flagId, frameRef]);

  useFrame((state) => {
    const f = frameRef.current?.flags.find((x) => x.id === flagId);
    if (!group.current) return;
    group.current.visible = !!f && !f.carrierId;
    if (!f || f.carrierId) return;
    group.current.position.set(f.pos.x, 0, f.pos.z);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      pos.setZ(i, Math.sin(x * 7 - t * 5) * 0.06 * x + Math.sin(x * 3 - t * 2.3) * 0.03 * x);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <group ref={group}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.028, 1.8, 10]} />
        <meshStandardMaterial color="#6B4426" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.83, 0]}>
        <coneGeometry args={[0.03, 0.09, 8]} />
        <meshStandardMaterial color="#D9DDE3" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh ref={cloth} geometry={geo} position={[0.02, 1.52, 0]} castShadow>
        <meshStandardMaterial map={texture} side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
    </group>
  );
}

export function Environment3D({ field, frameRef, flagIds, quality = 'high', dressing = [], sunAngle = 0 }: {
  field: FieldLayout; frameRef: React.RefObject<GameFrame | null>; flagIds: string[]; quality?: RenderQuality;
  /** Materiales del juego colocados en el campo (motor paramétrico). */
  dressing?: DressingItem[];
  /** Azimut del sol: cada juego tiene su propia luz y sombras. */
  sunAngle?: number;
}) {
  const grass = useGrassTexture();
  const itemIds = useMemo(() => (frameRef.current?.items ?? []).map((it) => it.id), [frameRef]);
  const shadowExtent = Math.max(field.width, field.depth) * 0.75;
  const sun = useMemo(() => new THREE.Vector3(30, 42, 18).applyAxisAngle(new THREE.Vector3(0, 1, 0), sunAngle), [sunAngle]);

  return (
    <>
      <Sky sunPosition={sun} turbidity={6} rayleigh={1.2} mieCoefficient={0.004} mieDirectionalG={0.85} />
      <fog attach="fog" args={['#C9D9E6', 45, 130]} />
      <hemisphereLight args={['#D6E8FF', '#3E5A26', 0.75]} />
      <directionalLight
        position={sun}
        intensity={2.6}
        color="#FFF3DE"
        castShadow
        shadow-mapSize={quality === 'low' ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-camera-near={1}
        shadow-camera-far={140}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[260, 260]} />
        <meshStandardMaterial map={grass} roughness={1} color="#C8D8B0" />
      </mesh>
      <GrassBlades width={field.width} depth={field.depth} density={quality === 'low' ? 12 : 30} />
      <FieldMarkings field={field} />
      {field.props && <Props3D props={field.props} />}
      <MaterialProps items={dressing} />
      {field.setPieces && <MaterialProps items={field.setPieces} />}
      {itemIds.length > 0 && <DynamicItems frameRef={frameRef} ids={itemIds} />}
      {field.trees.map((t, i) => (
        <Tree key={`${t.x},${t.z}`} tree={t} seed={i + 1} />
      ))}
      <BackdropForest radius={Math.max(field.width, field.depth) * 0.9 + 18} />
      {flagIds.map((id) => (
        <PlantedFlag key={id} flagId={id} frameRef={frameRef} />
      ))}
    </>
  );
}
