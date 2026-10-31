import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { FieldProp, FocalProp } from '../../engine/types';
import { boxGeo, cylGeo, mat, sphereGeo, torusGeo } from './materials';

/**
 * Elementos focales de los talleres (uno por juego, según `focal_prop` del catálogo).
 * Cada uno es un conjunto de piezas simples en metros, centrado en el origen del rincón.
 */

/** Generador pseudoaleatorio determinista (el mismo rincón se ve igual en cada carga). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const WOOD = '#8B6A43';
const WOOD_DARK = '#6B4F30';
const ROPE = '#C8A86B';
const UP = new THREE.Vector3(0, 1, 0);

/** Cilindro entre dos puntos (palos, cuerdas tensadas). */
function Beam({ from, to, radius, color, roughness = 0.85 }: { from: [number, number, number]; to: [number, number, number]; radius: number; color: string; roughness?: number }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()),
      length: dir.length(),
    };
  }, [from, to]);
  return <mesh geometry={cylGeo(radius, radius, 1, 10)} material={mat(color, roughness)} position={position} quaternion={quaternion} scale={[1, length, 1]} castShadow receiveShadow />;
}

function Tripod() {
  const apex: [number, number, number] = [0, 2.05, 0];
  const feet = [0, 1, 2].map((i) => {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    return [Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8] as [number, number, number];
  });
  const pegs = [0, 1, 2].map((i) => {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    return [Math.cos(a) * 2.3, 0.06, Math.sin(a) * 2.3] as [number, number, number];
  });
  return (
    <group>
      {feet.map((f, i) => (
        <Beam key={i} from={f} to={[apex[0] + f[0] * -0.08, apex[1] + 0.25, apex[2] + f[2] * -0.08]} radius={0.032} color={WOOD} />
      ))}
      {/* Amarre de trípode en el cruce */}
      <mesh geometry={torusGeo(0.07, 0.022, 8, 18)} material={mat(ROPE, 0.95)} position={[0, apex[1] - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow />
      <mesh geometry={torusGeo(0.065, 0.02, 8, 18)} material={mat(ROPE, 0.95)} position={[0, apex[1] + 0.05, 0]} rotation={[Math.PI / 2, 0, 0.3]} castShadow />
      {/* Vientos tensados a estacas */}
      {pegs.map((p, i) => (
        <group key={i}>
          <Beam from={[0, apex[1] - 0.05, 0]} to={p} radius={0.006} color={ROPE} />
          <mesh geometry={cylGeo(0.018, 0.01, 0.22, 6)} material={mat(WOOD_DARK)} position={[p[0], 0.06, p[2]]} rotation={[0, 0, 0.35]} castShadow />
        </group>
      ))}
    </group>
  );
}

function Logs() {
  return (
    <group>
      {[-0.28, 0.28].map((z) => (
        <mesh key={z} geometry={cylGeo(0.085, 0.09, 1.7, 12)} material={mat(WOOD_DARK)} position={[0, 0.09, z]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow />
      ))}
      <mesh geometry={cylGeo(0.07, 0.075, 1.3, 12)} material={mat(WOOD)} position={[0.35, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow />
      {/* Amarres cuadrados en los cruces */}
      {[-0.28, 0.28].map((z) => (
        <mesh key={z} geometry={torusGeo(0.1, 0.018, 8, 18)} material={mat(ROPE, 0.95)} position={[0.35, 0.17, z]} rotation={[0, Math.PI / 4, 0]} castShadow />
      ))}
      {/* Rollo de cuerda en el suelo */}
      <mesh geometry={torusGeo(0.16, 0.035, 10, 24)} material={mat(ROPE, 0.95)} position={[-0.55, 0.035, 0.75]} rotation={[Math.PI / 2, 0, 0]} castShadow />
    </group>
  );
}

function FirstAidKit() {
  return (
    <group>
      <mesh geometry={boxGeo(0.44, 0.15, 0.3)} material={mat('#DC2626', 0.5)} position={[0, 0.075, 0]} castShadow />
      {/* Tapa abierta con cruz blanca */}
      <group position={[0, 0.15, -0.15]} rotation={[-1.95, 0, 0]}>
        <mesh geometry={boxGeo(0.44, 0.3, 0.025)} material={mat('#DC2626', 0.5)} position={[0, 0.15, 0]} castShadow />
        <mesh geometry={boxGeo(0.06, 0.18, 0.004)} material={mat('#FFFFFF', 0.4)} position={[0, 0.15, -0.015]} />
        <mesh geometry={boxGeo(0.18, 0.06, 0.004)} material={mat('#FFFFFF', 0.4)} position={[0, 0.15, -0.015]} />
      </group>
      {/* Contenido: vendas y gasas */}
      <mesh geometry={cylGeo(0.035, 0.035, 0.08, 12)} material={mat('#F8FAFC', 0.7)} position={[-0.1, 0.17, 0.02]} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={boxGeo(0.12, 0.03, 0.09)} material={mat('#E2E8F0', 0.7)} position={[0.1, 0.16, 0.02]} />
    </group>
  );
}

export function Stretcher() {
  return (
    <group>
      {[-0.3, 0.3].map((z) => (
        <mesh key={z} geometry={cylGeo(0.025, 0.025, 2.2, 10)} material={mat(WOOD)} position={[0, 0.03, z]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow />
      ))}
      <mesh geometry={boxGeo(1.85, 0.012, 0.6)} material={mat('#4D6B3C', 0.95)} position={[0, 0.045, 0]} receiveShadow castShadow />
      {[-0.8, 0.8].map((x) => (
        <mesh key={x} geometry={cylGeo(0.018, 0.018, 0.66, 8)} material={mat(WOOD_DARK)} position={[x, 0.035, 0]} rotation={[Math.PI / 2, 0, 0]} />
      ))}
    </group>
  );
}

/** Textura de mapa/croquis dibujada una vez (papel, curvas de nivel, ruta y norte). */
function useMapTexture(kind: 'map' | 'sketch') {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 360;
    const g = c.getContext('2d')!;
    g.fillStyle = kind === 'map' ? '#EADFC2' : '#F8FAFC';
    g.fillRect(0, 0, 512, 360);
    if (kind === 'map') {
      g.strokeStyle = 'rgba(120, 90, 50, 0.45)';
      g.lineWidth = 2;
      for (let i = 1; i <= 6; i++) {
        g.beginPath();
        g.ellipse(300, 170, 40 * i, 26 * i, 0.4, 0, Math.PI * 2);
        g.stroke();
      }
      g.strokeStyle = 'rgba(60, 120, 200, 0.7)';
      g.lineWidth = 5;
      g.beginPath(); g.moveTo(0, 300); g.bezierCurveTo(150, 260, 200, 340, 512, 280); g.stroke();
    } else {
      g.strokeStyle = 'rgba(30, 41, 59, 0.75)';
      g.lineWidth = 3;
      g.strokeRect(40, 40, 432, 280);
      g.beginPath(); g.moveTo(90, 270); g.lineTo(200, 150); g.lineTo(330, 210); g.lineTo(420, 90); g.stroke();
      [[200, 150], [330, 210], [420, 90]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.stroke(); });
    }
    g.setLineDash([12, 10]);
    g.strokeStyle = '#DC2626';
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(70, 80); g.lineTo(220, 190); g.lineTo(380, 120); g.stroke();
    g.setLineDash([]);
    g.fillStyle = '#1E293B';
    g.beginPath(); g.moveTo(470, 30); g.lineTo(482, 70); g.lineTo(458, 70); g.closePath(); g.fill();
    g.font = 'bold 22px sans-serif';
    g.fillText('N', 462, 95);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [kind]);
}

function MapTable() {
  const map = useMapTexture('map');
  return (
    <group>
      <mesh geometry={boxGeo(1.1, 0.04, 0.75)} material={mat(WOOD, 0.7)} position={[0, 0.42, 0]} castShadow receiveShadow />
      {[[-0.5, -0.32], [0.5, -0.32], [-0.5, 0.32], [0.5, 0.32]].map(([x, z]) => (
        <mesh key={`${x},${z}`} geometry={cylGeo(0.025, 0.025, 0.42, 8)} material={mat(WOOD_DARK)} position={[x, 0.21, z]} castShadow />
      ))}
      <mesh position={[0, 0.442, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.95, 0.66]} />
        <meshStandardMaterial map={map} roughness={0.95} />
      </mesh>
      {/* Brújula de placa sobre el mapa */}
      <group position={[0.25, 0.447, 0.12]} rotation={[0, 0.6, 0]}>
        <mesh geometry={boxGeo(0.07, 0.006, 0.12)} material={mat('#E2E8F0', 0.3)} />
        <mesh geometry={cylGeo(0.025, 0.025, 0.012, 16)} material={mat('#111827', 0.3)} position={[0, 0.008, 0.02]} />
      </group>
    </group>
  );
}

function Easel() {
  const sketch = useMapTexture('sketch');
  return (
    <group>
      <Beam from={[-0.38, 0, 0.12]} to={[-0.06, 1.7, 0]} radius={0.022} color={WOOD} />
      <Beam from={[0.38, 0, 0.12]} to={[0.06, 1.7, 0]} radius={0.022} color={WOOD} />
      <Beam from={[0, 0, -0.55]} to={[0, 1.65, -0.02]} radius={0.02} color={WOOD_DARK} />
      <group position={[0, 1.15, 0.08]} rotation={[-0.16, 0, 0]}>
        <mesh geometry={boxGeo(0.78, 0.98, 0.02)} material={mat(WOOD_DARK, 0.8)} castShadow />
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.72, 0.92]} />
          <meshStandardMaterial map={sketch} roughness={0.95} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Mosaico en el suelo: flor de lis heráldica trazada con hojas, piedras y ramitas
// ---------------------------------------------------------------------------

/** Trazos de la figura en el plano del suelo (x, z) en metros; el lado derecho se refleja. */
const LILY_STROKES: [number, number][][] = (() => {
  const center: [number, number][] = [[0, -0.15], [0.14, 0.15], [0.16, 0.5], [0.05, 0.85], [0, 0.98], [-0.05, 0.85], [-0.16, 0.5], [-0.14, 0.15], [0, -0.15]];
  const right: [number, number][] = [[0.16, 0.12], [0.42, 0.2], [0.62, 0.42], [0.6, 0.66], [0.46, 0.72], [0.4, 0.56], [0.46, 0.42], [0.3, 0.3], [0.18, 0.28]];
  const band: [number, number][] = [[-0.38, -0.02], [0.38, -0.02], [0.38, 0.1], [-0.38, 0.1], [-0.38, -0.02]];
  const stem: [number, number][] = [[0, -0.15], [0, -0.45]];
  const foot: [number, number][] = [[0.02, -0.2], [0.2, -0.3], [0.32, -0.5], [0.22, -0.6]];
  const mirror = (pts: [number, number][]) => pts.map(([x, z]) => [-x, z] as [number, number]);
  const scale = (pts: [number, number][]) => pts.map(([x, z]) => [x * 1.25, z * 1.25 - 0.25] as [number, number]);
  return [center, right, mirror(right), band, stem, foot, mirror(foot)].map(scale);
})();

function GroundMosaic() {
  const leaves = useRef<THREE.InstancedMesh>(null);
  const stones = useRef<THREE.InstancedMesh>(null);
  const twigs = useRef<THREE.InstancedMesh>(null);

  const items = useMemo(() => {
    const r = rng(17);
    const out: { kind: 0 | 1 | 2; x: number; z: number; angle: number; s: number }[] = [];
    LILY_STROKES.forEach((stroke) => {
      const curve = new THREE.CatmullRomCurve3(stroke.map(([x, z]) => new THREE.Vector3(x, 0, z)));
      const n = Math.max(2, Math.round(curve.getLength() / 0.055));
      curve.getSpacedPoints(n).forEach((p, k) => {
        const tan = curve.getTangentAt(Math.min(1, k / n));
        const kind = (k % 5 === 0 ? 1 : k % 3 === 0 ? 2 : 0) as 0 | 1 | 2;
        out.push({ kind, x: p.x + (r() - 0.5) * 0.02, z: p.z + (r() - 0.5) * 0.02, angle: Math.atan2(tan.x, tan.z) + (r() - 0.5) * 0.6, s: 0.8 + r() * 0.5 });
      });
    });
    return out;
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    const r = rng(5);
    const counters = [0, 0, 0];
    items.forEach((it) => {
      const target = [leaves.current, stones.current, twigs.current][it.kind]!;
      const idx = counters[it.kind]++;
      q.setFromEuler(new THREE.Euler(0, it.angle, 0));
      if (it.kind === 0) {
        m.compose(new THREE.Vector3(it.x, 0.014, it.z), q, new THREE.Vector3(0.05 * it.s, 0.007, 0.085 * it.s));
        c.setHSL(0.02 + r() * 0.11, 0.85, 0.42 + r() * 0.12); // hojas secas: naranjas, ocres, rojizas
      } else if (it.kind === 1) {
        m.compose(new THREE.Vector3(it.x, 0.02, it.z), q, new THREE.Vector3(0.04 * it.s, 0.025 * it.s, 0.035 * it.s));
        c.setHSL(0.08, 0.05, 0.45 + r() * 0.2);
      } else {
        m.compose(new THREE.Vector3(it.x, 0.012, it.z), q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))), new THREE.Vector3(1, 0.12 * it.s, 1));
        c.set('#6B4F30');
      }
      target.setMatrixAt(idx, m);
      target.setColorAt(idx, c);
    });
    [leaves.current, stones.current, twigs.current].forEach((mesh, k) => {
      if (!mesh) return;
      mesh.count = counters[k];
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [items]);

  // Surco de tierra bajo la figura: hace legible el contorno desde lejos
  const traces = useMemo(
    () => LILY_STROKES.map((stroke) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stroke.map(([x, z]) => new THREE.Vector3(x, 0, z))), 48, 0.07, 5, false)),
    []
  );

  const max = items.length;
  return (
    <group>
      {traces.map((geo, i) => (
        <mesh key={i} geometry={geo} material={mat('#5B3A1E', 1)} position={[0, 0.004, 0]} scale={[1, 0.05, 1]} receiveShadow />
      ))}
      <instancedMesh ref={leaves} args={[sphereGeo(8, 6), undefined, max]} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={stones} args={[sphereGeo(6, 5), undefined, max]} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.95} flatShading />
      </instancedMesh>
      <instancedMesh ref={twigs} args={[cylGeo(0.008, 0.008, 1, 5), undefined, max]} castShadow>
        <meshStandardMaterial roughness={0.95} />
      </instancedMesh>
      {/* Canasto con material recolectado */}
      <group position={[1.35, 0, 1.05]}>
        <mesh geometry={cylGeo(0.2, 0.15, 0.2, 14, true)} material={mat('#A16207', 0.9, 0, { side: THREE.DoubleSide })} position={[0, 0.1, 0]} castShadow />
        <mesh geometry={sphereGeo(10, 8)} material={mat('#B45309', 0.9)} position={[0, 0.17, 0]} scale={[0.17, 0.05, 0.17]} />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Prueba de carga: tijera de dos leños con amarre y una mochila colgando
// ---------------------------------------------------------------------------

function useSignTexture(text: string) {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    const g = c.getContext('2d')!;
    g.fillStyle = '#E7D3A8'; g.fillRect(0, 0, 128, 64);
    g.fillStyle = '#1F2937'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 64, 34);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text]);
}

function StressTestRig() {
  const load = useRef<THREE.Group>(null);
  const sign = useSignTexture('15 kg');
  const cross: [number, number, number] = [0, 1.575, 0];
  useFrame((state) => {
    if (load.current) load.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.7) * 0.07;
  });
  return (
    <group>
      <Beam from={[-0.75, 0, 0]} to={[0.32, 2.25, 0]} radius={0.045} color={WOOD} />
      <Beam from={[0.75, 0, 0]} to={[-0.32, 2.25, 0]} radius={0.045} color={WOOD} />
      {/* Amarre cuadrado en el cruce */}
      <mesh geometry={torusGeo(0.08, 0.022, 8, 18)} material={mat(ROPE, 0.95)} position={cross} rotation={[0, 0, Math.PI / 4]} castShadow />
      <mesh geometry={torusGeo(0.08, 0.022, 8, 18)} material={mat(ROPE, 0.95)} position={cross} rotation={[0, 0, -Math.PI / 4]} castShadow />
      {/* Peso suspendido: cuerda + mochila, se balancea */}
      <group ref={load} position={cross}>
        <mesh geometry={cylGeo(0.008, 0.008, 0.85, 6)} material={mat(ROPE, 0.95)} position={[0, -0.425, 0]} />
        <group position={[0, -1.08, 0]}>
          <mesh geometry={boxGeo(0.34, 0.44, 0.22)} material={mat('#1E3A8A', 0.85)} castShadow />
          <mesh geometry={boxGeo(0.35, 0.16, 0.23)} material={mat('#172554', 0.85)} position={[0, 0.16, 0.005]} />
          <mesh geometry={boxGeo(0.22, 0.14, 0.04)} material={mat('#1D4ED8', 0.85)} position={[0, -0.06, 0.13]} />
        </group>
      </group>
      {/* Estacas que fijan las patas y cartel de carga */}
      {[-0.75, 0.75].map((x) => (
        <mesh key={x} geometry={cylGeo(0.02, 0.012, 0.25, 6)} material={mat(WOOD_DARK)} position={[x * 1.15, 0.08, 0.12]} castShadow />
      ))}
      <group position={[1.1, 0, 0.6]} rotation={[0, -0.5, 0]}>
        <mesh geometry={cylGeo(0.015, 0.015, 0.6, 6)} material={mat(WOOD_DARK)} position={[0, 0.3, 0]} castShadow />
        <mesh position={[0, 0.6, 0.012]}>
          <planeGeometry args={[0.32, 0.16]} />
          <meshStandardMaterial map={sign} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Fogata: anillo de piedras, leños en cono, llamas animadas y leña apilada
// ---------------------------------------------------------------------------

function Campfire() {
  const flames = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    flames.current?.children.forEach((f, i) => {
      const k = 1 + Math.sin(t * (7 + i * 2.3) + i) * 0.18 + Math.sin(t * 13 + i * 4) * 0.08;
      f.scale.set(1, k, 1);
    });
  });
  const stones = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
  const sticks = Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2);
  return (
    <group>
      {stones.map((a, i) => (
        <mesh key={i} geometry={sphereGeo(7, 5)} material={mat('#78716C', 0.95, 0, { flatShading: true })} position={[Math.cos(a) * 0.5, 0.06, Math.sin(a) * 0.5]} scale={[0.11, 0.08, 0.09]} castShadow />
      ))}
      {sticks.map((a, i) => (
        <Beam key={i} from={[Math.cos(a) * 0.3, 0.02, Math.sin(a) * 0.3]} to={[0, 0.55, 0]} radius={0.022} color={i % 2 ? WOOD_DARK : '#3F2D1C'} />
      ))}
      <mesh geometry={sphereGeo(10, 8)} position={[0, 0.05, 0]} scale={[0.25, 0.05, 0.25]}>
        <meshBasicMaterial color="#F97316" />
      </mesh>
      <group ref={flames} position={[0, 0.06, 0]}>
        {[[0, 0, 0.17, 0.55, '#FB923C'], [0.06, 0.04, 0.11, 0.42, '#FACC15'], [-0.07, -0.03, 0.1, 0.38, '#F97316']].map(([x, z, r, h, color], i) => (
          <mesh key={i} position={[x as number, 0, z as number]}>
            <coneGeometry args={[r as number, h as number, 10, 1, true]} />
            <meshBasicMaterial color={color as string} transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        ))}
      </group>
      {/* Leña apilada */}
      <group position={[1.2, 0, -0.7]} rotation={[0, 0.4, 0]}>
        {[[0, 0.07], [0.15, 0.07], [0.075, 0.2]].map(([z, y], i) => (
          <mesh key={i} geometry={cylGeo(0.065, 0.07, 0.9, 10)} material={mat(WOOD_DARK)} position={[0, y, z]} rotation={[0, 0, Math.PI / 2]} castShadow />
        ))}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Carpa: parantes, cumbrera, lonas a dos aguas y vientos a estacas
// ---------------------------------------------------------------------------

function Tent() {
  const H = 1.3, HALF = 1.0, BASE = 0.95;
  const slant = Math.hypot(H, BASE);
  const tilt = Math.atan2(BASE, H);
  return (
    <group>
      {[-HALF, HALF].map((x) => (
        <mesh key={x} geometry={cylGeo(0.022, 0.022, H + 0.12, 8)} material={mat(WOOD)} position={[x, (H + 0.12) / 2, 0]} castShadow />
      ))}
      <Beam from={[-HALF, H, 0]} to={[HALF, H, 0]} radius={0.007} color={ROPE} />
      {[1, -1].map((side) => (
        <mesh key={side} geometry={boxGeo(HALF * 2 + 0.1, slant, 0.012)} material={mat('#C2410C', 0.9)} position={[0, H / 2, (side * BASE) / 2]} rotation={[-side * tilt, 0, 0]} castShadow receiveShadow />
      ))}
      {/* Vientos desde los parantes y estacas en las esquinas */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <Beam from={[sx * HALF, H + 0.08, 0]} to={[sx * (HALF + 1.0), 0.04, 0]} radius={0.005} color={ROPE} />
          <mesh geometry={cylGeo(0.016, 0.01, 0.2, 6)} material={mat(WOOD_DARK)} position={[sx * (HALF + 1.0), 0.06, 0]} rotation={[0, 0, sx * 0.4]} castShadow />
          {[-1, 1].map((sz) => (
            <mesh key={sz} geometry={cylGeo(0.014, 0.01, 0.18, 6)} material={mat(WOOD_DARK)} position={[sx * HALF * 0.95, 0.05, sz * (BASE + 0.12)]} castShadow />
          ))}
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Manualidades y siembra: lona, cubeta de barro, bombas de semillas y herbario
// ---------------------------------------------------------------------------

function SeedBombCraft() {
  const balls = useRef<THREE.InstancedMesh>(null);
  const COUNT = 24;
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    const r = rng(11);
    for (let i = 0; i < COUNT; i++) {
      const x = -0.25 + (i % 6) * 0.1, z = -0.15 + Math.floor(i / 6) * 0.1;
      m.makeTranslation(x, 0.075, z);
      m.scale(new THREE.Vector3(0.035, 0.032, 0.035));
      balls.current!.setMatrixAt(i, m);
      c.setHSL(0.07, 0.45, 0.22 + r() * 0.1);
      balls.current!.setColorAt(i, c);
    }
    balls.current!.instanceMatrix.needsUpdate = true;
    if (balls.current!.instanceColor) balls.current!.instanceColor.needsUpdate = true;
  }, []);
  return (
    <group>
      <mesh geometry={boxGeo(2.0, 0.01, 1.3)} material={mat('#3F6212', 0.95)} position={[0, 0.006, 0]} receiveShadow />
      {/* Tabla con las bombas de semillas secándose */}
      <group position={[-0.35, 0, 0.1]}>
        <mesh geometry={boxGeo(0.7, 0.04, 0.45)} material={mat(WOOD, 0.8)} position={[0, 0.03, 0]} castShadow receiveShadow />
        <instancedMesh ref={balls} args={[sphereGeo(10, 8), undefined, COUNT]} castShadow>
          <meshStandardMaterial roughness={0.95} />
        </instancedMesh>
      </group>
      {/* Cubeta con barro y semillas */}
      <group position={[0.55, 0, -0.3]}>
        <mesh geometry={cylGeo(0.2, 0.16, 0.3, 16, true)} material={mat('#64748B', 0.6, 0.2, { side: THREE.DoubleSide })} position={[0, 0.15, 0]} castShadow />
        <mesh geometry={cylGeo(0.19, 0.19, 0.01, 16)} material={mat('#4A3222', 0.95)} position={[0, 0.25, 0]} />
      </group>
      {/* Hojas de herbario prensadas */}
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0.45 + i * 0.05, 0.015 + i * 0.004, 0.35 - i * 0.03]} rotation={[0, 0.2 * i, 0]}>
          <mesh geometry={boxGeo(0.32, 0.004, 0.42)} material={mat('#F8FAFC', 0.85)} receiveShadow />
          <mesh geometry={sphereGeo(8, 6)} material={mat(['#4D7C0F', '#65A30D', '#15803D'][i], 0.8)} position={[0, 0.004, 0]} scale={[0.07, 0.003, 0.13]} rotation={[0, 0.4 * i, 0]} />
        </group>
      ))}
    </group>
  );
}

/** Cada elemento focal con sus piezas (algunas combinan objetos: camilla + botiquín, mesa + papelógrafo). */
const RENDER: Record<FocalProp, () => React.ReactElement> = {
  ground_mosaic: GroundMosaic,
  stress_test_rig: StressTestRig,
  pioneering_tripod: () => (
    <>
      <Tripod />
      <group position={[1.9, 0, -1.3]} rotation={[0, 0.5, 0]}><Logs /></group>
    </>
  ),
  first_aid_stretcher: () => (
    <>
      <Stretcher />
      <group position={[0.35, 0, 0.95]} rotation={[0, Math.PI, 0]}><FirstAidKit /></group>
    </>
  ),
  campfire_cooking: Campfire,
  tent_assembly: Tent,
  cartography_table: () => (
    <>
      <MapTable />
      <group position={[-0.2, 0, -1.35]}><Easel /></group>
    </>
  ),
  seed_bomb_craft: SeedBombCraft,
};

export function Props3D({ props }: { props: FieldProp[] }) {
  return (
    <>
      {props.map((p, i) => {
        const Item = RENDER[p.kind];
        return (
          <group key={`${p.kind}-${i}`} position={[p.pos.x, 0, p.pos.z]} rotation={[0, p.rotation ?? 0, 0]}>
            <Item />
          </group>
        );
      })}
    </>
  );
}
