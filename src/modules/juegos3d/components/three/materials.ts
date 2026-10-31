import * as THREE from 'three';

/**
 * Geometrías y materiales compartidos entre todas las personas (se crean una sola vez).
 */

const matCache = new Map<string, THREE.MeshStandardMaterial>();

export function mat(color: string, roughness = 0.85, metalness = 0, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const key = `${color}|${roughness}|${metalness}|${JSON.stringify(extra)}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
    matCache.set(key, m);
  }
  return m;
}

const geoCache = new Map<string, THREE.BufferGeometry>();
function cached<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geoCache.get(key);
  if (!g) {
    g = make();
    geoCache.set(key, g);
  }
  return g as T;
}

/** Cápsula cónica que cuelga desde y=0 hasta y=-len (radio r1 arriba, r2 abajo). */
export function limbGeo(len: number, r1: number, r2: number, radial = 14) {
  return cached(`limb|${len}|${r1}|${r2}|${radial}`, () => {
    const pts: THREE.Vector2[] = [];
    const capSteps = 6;
    for (let i = 0; i <= capSteps; i++) {
      const a = (i / capSteps) * (Math.PI / 2);
      pts.push(new THREE.Vector2(Math.sin(a) * r1 + 1e-4, Math.cos(a) * r1));
    }
    for (let i = 1; i < 6; i++) {
      const k = i / 6;
      pts.push(new THREE.Vector2(r1 + (r2 - r1) * k, -len * k));
    }
    for (let i = 0; i <= capSteps; i++) {
      const a = Math.PI / 2 + (i / capSteps) * (Math.PI / 2);
      pts.push(new THREE.Vector2(Math.sin(a) * r2 + 1e-4, -len + Math.cos(a) * r2));
    }
    // LatheGeometry espera el perfil de abajo hacia arriba para que las caras miren hacia afuera
    return new THREE.LatheGeometry(pts.reverse(), radial);
  });
}

/** Sólido de revolución a partir de un perfil [radio, altura]. */
export function latheGeo(key: string, profile: [number, number][], radial = 20) {
  return cached(`lathe|${key}|${radial}`, () =>
    new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), radial)
  );
}

export function sphereGeo(radial = 20, rings = 16) {
  return cached(`sphere|${radial}|${rings}`, () => new THREE.SphereGeometry(1, radial, rings));
}

export function boxGeo(w: number, h: number, d: number) {
  return cached(`box|${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
}

export function cylGeo(rt: number, rb: number, h: number, radial = 16, open = false) {
  return cached(`cyl|${rt}|${rb}|${h}|${radial}|${open}`, () => new THREE.CylinderGeometry(rt, rb, h, radial, 1, open));
}

export function torusGeo(r: number, tube: number, radial = 10, tubular = 28) {
  return cached(`torus|${r}|${tube}|${radial}|${tubular}`, () => new THREE.TorusGeometry(r, tube, radial, tubular));
}

/** Casco de cabello: casquete esférico. */
export function hairGeo() {
  return cached('hair', () => new THREE.SphereGeometry(1, 22, 14, 0, Math.PI * 2, 0, 1.95));
}

/** Copa del sombrero de 4 pedradas (campaign hat): pirámide de 4 caras con perfil curvo. */
export function hatCrownGeo() {
  return cached('hatCrown', () => {
    const g = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.112, 0),
        new THREE.Vector2(0.108, 0.035),
        new THREE.Vector2(0.092, 0.075),
        new THREE.Vector2(0.055, 0.115),
        new THREE.Vector2(0.001, 0.14),
      ],
      4
    );
    g.rotateY(Math.PI / 4);
    return g;
  });
}

/** Triángulo del pañuelo (cuelga por la espalda). */
export function scarfTriangleGeo(scale = 1) {
  return cached(`scarf|${scale}`, () => {
    const s = new THREE.Shape();
    s.moveTo(-0.14 * scale, 0);
    s.lineTo(0.14 * scale, 0);
    s.lineTo(0, -0.22 * scale);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  });
}

/** Chicote: pañuelo enrollado y ligeramente curva. */
export function chicoteGeo() {
  return cached('chicote', () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.04, 0),
      new THREE.Vector3(0.01, -0.12, 0.02),
      new THREE.Vector3(-0.01, -0.26, 0.05),
      new THREE.Vector3(0.02, -0.38, 0.09),
    ]);
    return new THREE.TubeGeometry(curve, 16, 0.017, 8, false);
  });
}
