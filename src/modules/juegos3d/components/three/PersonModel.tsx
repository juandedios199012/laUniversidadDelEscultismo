import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { GameFrame, CompetitorAppearance } from '../../engine/types';
import { computeBodyPose } from './gait';
import { boxGeo, chicoteGeo, cylGeo, hairGeo, hatCrownGeo, latheGeo, limbGeo, mat, scarfTriangleGeo, sphereGeo, torusGeo } from './materials';

/**
 * Persona 3D articulada: esqueleto jerárquico (pelvis → columna → cuello → cabeza, hombros → codos → manos,
 * caderas → rodillas → tobillos) vestido con el uniforme: camisa caqui, short y medias azul marino,
 * botas, cinturón, pañuelo con pasador, sombrero de 4 pedradas o boina, y venda para los juegos sensoriales.
 * Todas las medidas son en metros para una persona de 1.55 m; luego se escala a la estatura de cada uno.
 */

const BASE_HEIGHT = 1.55;

const KHAKI = '#BBA77A';
const KHAKI_DARK = '#9E8B5F';
const NAVY = '#1F2A44';
const BOOT = '#3B2717';
const SOLE = '#1A1410';
const BELT = '#3A2414';

export interface OverlayOptions {
  showFOV: boolean;
  showVectors: boolean;
}

interface Props {
  index: number;
  look: CompetitorAppearance;
  frameRef: React.RefObject<GameFrame | null>;
  timeRef: React.RefObject<number>;
  overlays: OverlayOptions;
}

type Joint =
  | 'root' | 'body' | 'pelvis' | 'spine' | 'head'
  | 'lSh' | 'lEl' | 'rSh' | 'rEl'
  | 'lHip' | 'lKnee' | 'lAnkle' | 'rHip' | 'rKnee' | 'rAnkle'
  | 'chicote' | 'flag' | 'frozen' | 'vector'
  | 'compass' | 'rope' | 'bandage' | 'pencil' | 'stone' | 'twig' | 'notebook' | 'stick' | 'mallet' | 'whistle' | 'ball' | 'backpack';

export function PersonModel({ index, look, frameRef, timeRef, overlays }: Props) {
  const j = useRef<Partial<Record<Joint, THREE.Object3D>>>({});
  const bind = (name: Joint) => (o: THREE.Object3D | null) => {
    if (o) j.current[name] = o;
  };

  const skin = mat(look.skinTone, 0.62);
  const hair = mat(look.hairColor, 0.75);
  const khaki = mat(KHAKI, 0.92);
  const khakiDark = mat(KHAKI_DARK, 0.92);
  const navy = mat(NAVY, 0.9);
  const teamMat = mat(look.teamColor, 0.8, 0, { side: THREE.DoubleSide });
  const team2 = mat(look.secondaryColor, 0.8, 0, { side: THREE.DoubleSide });
  const leather = mat(BOOT, 0.55);
  const scale = look.height / BASE_HEIGHT;

  const flagTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 40;
    const g = c.getContext('2d')!;
    g.fillStyle = '#B91C1C'; g.fillRect(0, 0, 64, 40);
    g.fillStyle = '#F8FAFC'; g.fillRect(0, 16, 64, 8);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useFrame(() => {
    const frame = frameRef.current;
    const s = frame?.competitors[index];
    const J = j.current;
    if (!s || !J.root) return;

    J.root.position.set(s.pos.x, 0, s.pos.z);
    J.root.rotation.y = Math.PI / 2 - s.heading;

    const p = computeBodyPose(s, timeRef.current ?? 0);
    J.pelvis!.position.set(p.pelvisSway, p.pelvisY + 0.04, 0);
    J.pelvis!.rotation.y = p.pelvisYaw;
    J.spine!.rotation.set(p.spineLean, p.spineTwist, p.spineRoll);
    J.spine!.scale.set(1 + p.breath * 0.008, 1, 1 + p.breath * 0.012);
    J.head!.rotation.x = p.headPitch;

    J.lHip!.rotation.set(-p.legL.hipX, 0, p.legL.hipZ);
    J.lKnee!.rotation.x = p.legL.knee;
    J.lAnkle!.rotation.x = p.legL.ankle;
    J.rHip!.rotation.set(-p.legR.hipX, 0, p.legR.hipZ);
    J.rKnee!.rotation.x = p.legR.knee;
    J.rAnkle!.rotation.x = p.legR.ankle;

    J.lSh!.rotation.set(p.armL.shX, p.armL.shY, p.armL.shZ);
    J.lEl!.rotation.x = p.armL.elbow;
    J.rSh!.rotation.set(p.armR.shX, p.armR.shY, p.armR.shZ);
    J.rEl!.rotation.x = p.armR.elbow;

    // Postura de cuerpo completo (p. ej. acostado): gira y eleva todo el cuerpo
    J.body!.rotation.x = p.bodyPitch;
    J.body!.position.y = p.bodyLift;

    J.chicote!.visible = s.holdingChicote;
    J.compass!.visible = s.handProp === 'compass';
    J.rope!.visible = s.handProp === 'rope';
    J.bandage!.visible = s.handProp === 'bandage';
    J.pencil!.visible = s.handProp === 'pencil';
    J.stone!.visible = s.handProp === 'stone';
    J.twig!.visible = s.handProp === 'twig';
    J.notebook!.visible = s.handProp === 'notebook';
    J.stick!.visible = s.handProp === 'stick';
    J.mallet!.visible = s.handProp === 'mallet';
    J.whistle!.visible = s.handProp === 'whistle';
    J.backpack!.visible = !!s.wearsBackpack;
    J.ball!.visible = s.handProp === 'ball';
    J.flag!.visible = !!frame!.flags.some((f) => f.carrierId === s.id);
    J.frozen!.visible = s.frozen;
    J.vector!.visible = overlays.showVectors && s.speed > 0.2;
    J.vector!.scale.set(1, 1, Math.max(0.01, s.speed * 0.45));
  });

  const renderArm = (side: 1 | -1) => {
    const L = side === 1;
    return (
      <group key={side} ref={bind(L ? 'lSh' : 'rSh')} position={[0.185 * side, 0.345, -0.005]}>
        <mesh geometry={limbGeo(0.15, 0.06, 0.054)} material={khaki} castShadow />
        {L && <mesh geometry={boxGeo(0.004, 0.05, 0.045)} material={teamMat} position={[0.058, -0.06, 0]} />}
        <mesh geometry={limbGeo(0.27, 0.043, 0.034)} material={skin} castShadow />
        <group ref={bind(L ? 'lEl' : 'rEl')} position={[0, -0.27, 0]}>
          <mesh geometry={limbGeo(0.23, 0.035, 0.027)} material={skin} castShadow />
          <group position={[0, -0.235, 0]}>
            <mesh geometry={sphereGeo(12, 10)} material={skin} position={[0, -0.04, 0.004]} scale={[0.026, 0.05, 0.021]} castShadow />
            <mesh geometry={sphereGeo(8, 6)} material={skin} position={[-0.022 * side, -0.02, 0.016]} scale={[0.01, 0.024, 0.01]} rotation={[0.4, 0, 0.4 * side]} />
            {!L && (
              <>
                {/* Objetos de mano (brújula, cuerda, venda, lápiz) */}
                <group ref={bind('compass')} position={[0.01, -0.07, 0.03]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
                  <mesh geometry={boxGeo(0.06, 0.004, 0.1)} material={mat('#E2E8F0', 0.4)} />
                  <mesh geometry={cylGeo(0.022, 0.022, 0.01, 16)} material={mat('#111827', 0.3)} position={[0, 0.006, 0.02]} />
                  <mesh geometry={boxGeo(0.004, 0.012, 0.03)} material={mat('#DC2626', 0.5)} position={[0, 0.012, 0.02]} />
                </group>
                <group ref={bind('rope')} position={[0, -0.08, 0.02]} visible={false}>
                  <mesh geometry={torusGeo(0.05, 0.014, 8, 20)} material={mat('#C8A86B', 0.9)} castShadow />
                </group>
                <group ref={bind('bandage')} position={[0, -0.08, 0.02]} rotation={[0, 0, Math.PI / 2]} visible={false}>
                  <mesh geometry={cylGeo(0.028, 0.028, 0.06, 14)} material={mat('#F8FAFC', 0.7)} castShadow />
                </group>
                <group ref={bind('pencil')} position={[0, -0.07, 0.03]} rotation={[0.6, 0, 0]} visible={false}>
                  <mesh geometry={cylGeo(0.005, 0.005, 0.14, 6)} material={mat('#F59E0B', 0.5)} />
                </group>
                <group ref={bind('whistle')} position={[0, -0.07, 0.03]} rotation={[0, 0, Math.PI / 2]} visible={false}>
                  <mesh geometry={cylGeo(0.012, 0.012, 0.05, 10)} material={mat('#CBD5E1', 0.25, 0.9)} />
                  <mesh geometry={torusGeo(0.008, 0.002, 6, 10)} material={mat('#CBD5E1', 0.25, 0.9)} position={[0, -0.03, 0]} />
                </group>
                <group ref={bind('ball')} position={[0, -0.1, 0.06]} visible={false}>
                  <mesh geometry={sphereGeo(14, 10)} material={mat('#F8FAFC', 0.5)} scale={0.105} castShadow />
                </group>
                <group ref={bind('stone')} position={[0, -0.075, 0.025]} visible={false}>
                  <mesh geometry={sphereGeo(8, 6)} material={mat('#8A8F98', 0.9)} scale={[0.035, 0.026, 0.03]} castShadow />
                </group>
                <group ref={bind('twig')} position={[0, -0.07, 0.03]} rotation={[0.9, 0, 0.2]} visible={false}>
                  <mesh geometry={cylGeo(0.006, 0.008, 0.26, 6)} material={mat('#6B4F30', 0.9)} castShadow />
                  <mesh geometry={sphereGeo(8, 6)} material={mat('#A16207', 0.8)} position={[0, 0.12, 0.015]} scale={[0.03, 0.006, 0.045]} />
                </group>
                <group ref={bind('notebook')} position={[0, -0.075, 0.035]} rotation={[1.2, 0, 0]} visible={false}>
                  <mesh geometry={boxGeo(0.11, 0.015, 0.15)} material={mat('#78350F', 0.7)} castShadow />
                  <mesh geometry={boxGeo(0.1, 0.004, 0.14)} material={mat('#F8FAFC', 0.8)} position={[0, 0.009, 0]} />
                </group>
                {/* Vara larga (p. ej. pan de cazador) apuntando hacia adelante, con la masa en la punta */}
                <group ref={bind('stick')} position={[0, -0.06, 0.02]} rotation={[Math.PI / 2 + 0.25, 0, 0]} visible={false}>
                  <mesh geometry={cylGeo(0.008, 0.01, 0.9, 6)} material={mat('#6B4F30', 0.9)} position={[0, 0.42, 0]} castShadow />
                  <mesh geometry={sphereGeo(10, 8)} material={mat('#E7C99A', 0.85)} position={[0, 0.8, 0]} scale={[0.028, 0.08, 0.028]} castShadow />
                </group>
                <group ref={bind('mallet')} position={[0, -0.07, 0.02]} rotation={[1.0, 0, 0]} visible={false}>
                  <mesh geometry={cylGeo(0.01, 0.012, 0.28, 6)} material={mat('#8B6A43', 0.8)} position={[0, 0.1, 0]} castShadow />
                  <mesh geometry={cylGeo(0.035, 0.035, 0.1, 10)} material={mat('#5B4630', 0.8)} position={[0, 0.24, 0]} rotation={[0, 0, Math.PI / 2]} castShadow />
                </group>
                <group ref={bind('chicote')} position={[0, -0.05, 0.01]} visible={false}>
                  <mesh geometry={chicoteGeo()} material={mat('#DC2626', 0.8)} castShadow />
                </group>
                <group ref={bind('flag')} position={[0, -0.05, 0.01]} rotation={[1.75, 0, 0]} visible={false}>
                  <mesh geometry={cylGeo(0.012, 0.012, 1.5, 8)} material={mat('#6B4426', 0.7)} position={[0, 0.45, 0]} castShadow />
                  <mesh position={[0, 1.02, 0.25]} rotation={[0, Math.PI / 2, 0]} castShadow>
                    <planeGeometry args={[0.5, 0.32]} />
                    <meshStandardMaterial map={flagTexture} side={THREE.DoubleSide} roughness={0.9} />
                  </mesh>
                </group>
              </>
            )}
          </group>
        </group>
      </group>
    );
  };

  const renderLeg = (side: 1 | -1) => {
    const L = side === 1;
    return (
      <group key={side} ref={bind(L ? 'lHip' : 'rHip')} position={[0.085 * side, -0.04, 0]}>
        <mesh geometry={limbGeo(0.19, 0.092, 0.083)} material={navy} castShadow />
        <mesh geometry={limbGeo(0.37, 0.07, 0.05)} material={skin} castShadow />
        <group ref={bind(L ? 'lKnee' : 'rKnee')} position={[0, -0.37, 0]}>
          <mesh geometry={limbGeo(0.36, 0.05, 0.035)} material={skin} castShadow />
          <group position={[0, -0.13, 0]}>
            <mesh geometry={limbGeo(0.21, 0.053, 0.041)} material={navy} castShadow />
            {/* Jarreteras (ligas) con el color del equipo */}
            <mesh geometry={boxGeo(0.012, 0.06, 0.016)} material={teamMat} position={[0.048 * side, -0.05, 0.012]} />
          </group>
          <group ref={bind(L ? 'lAnkle' : 'rAnkle')} position={[0, -0.36, 0]}>
            <mesh geometry={cylGeo(0.05, 0.056, 0.09, 12)} material={leather} position={[0, -0.005, 0]} castShadow />
            <RoundedBox args={[0.098, 0.08, 0.245]} radius={0.03} smoothness={3} position={[0, -0.035, 0.045]} material={leather} castShadow />
            <mesh geometry={boxGeo(0.104, 0.018, 0.252)} material={mat(SOLE, 0.9)} position={[0, -0.07, 0.045]} castShadow />
          </group>
        </group>
      </group>
    );
  };

  return (
    <group ref={bind('root')}>
      {/* Capas tácticas en el suelo */}
      {overlays.showFOV && !look.isBlindfolded && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} renderOrder={1}>
          <circleGeometry args={[4, 28, -Math.PI / 2 - Math.PI / 4, Math.PI / 2]} />
          <meshBasicMaterial color="#FACC15" transparent opacity={0.16} depthWrite={false} />
        </mesh>
      )}
      {overlays.showFOV && look.isBlindfolded && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.42, 0.5, 32]} />
          <meshBasicMaterial color="#DC2626" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      )}
      <group ref={bind('vector')} position={[0, 0.05, 0]}>
        <mesh position={[0, 0, 0.5]}>
          <boxGeometry args={[0.06, 0.01, 1]} />
          <meshBasicMaterial color="#38BDF8" />
        </mesh>
      </group>
      <mesh ref={bind('frozen')} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} visible={false}>
        <ringGeometry args={[0.45, 0.62, 40]} />
        <meshBasicMaterial color="#7DD3FC" transparent opacity={0.8} depthWrite={false} />
      </mesh>

      <group ref={bind('body')} scale={scale}>
        <group ref={bind('pelvis')} position={[0, 0.84, 0]}>
          {/* Short azul marino y cinturón con hebilla */}
          <mesh
            geometry={latheGeo('pelvis', [[0.001, -0.1], [0.11, -0.095], [0.15, -0.04], [0.152, 0.04], [0.145, 0.085], [0.001, 0.085]])}
            material={navy}
            scale={[1, 1, 0.72]}
            castShadow
          />
          <mesh geometry={cylGeo(0.151, 0.153, 0.035, 24, true)} material={mat(BELT, 0.5)} position={[0, 0.07, 0]} scale={[1, 1, 0.73]} />
          <mesh geometry={boxGeo(0.045, 0.034, 0.012)} material={mat('#C9A227', 0.3, 0.8)} position={[0, 0.07, 0.11]} />

          <group ref={bind('spine')} position={[0, 0.075, 0]}>
            {/* Camisa caqui */}
            <mesh
              geometry={latheGeo('torso', [[0.001, 0], [0.142, 0], [0.146, 0.08], [0.158, 0.19], [0.172, 0.27], [0.165, 0.33], [0.13, 0.385], [0.065, 0.41], [0.001, 0.414]], 24)}
              material={khaki}
              scale={[1, 1, 0.66]}
              castShadow
            />
            {/* Mochila puesta (solo si la coreografía lo pide) */}
            <group ref={bind('backpack')} position={[0, 0.22, -0.2]} visible={false}>
              <mesh geometry={boxGeo(0.3, 0.42, 0.18)} material={mat('#1E3A8A', 0.85)} castShadow />
              <mesh geometry={boxGeo(0.31, 0.14, 0.19)} material={mat('#172554', 0.85)} position={[0, 0.15, 0]} />
              <mesh geometry={boxGeo(0.32, 0.05, 0.2)} material={mat('#0F172A', 0.6)} position={[0, -0.25, 0.04]} />
            </group>
            {/* Bolsillos con tapa, botones y presillas */}
            {[1, -1].map((sd) => (
              <group key={sd} position={[0.072 * sd, 0.245, 0.104]} rotation={[-0.12, 0.28 * sd, 0]}>
                <mesh geometry={boxGeo(0.068, 0.075, 0.008)} material={khakiDark} />
                <mesh geometry={boxGeo(0.072, 0.022, 0.01)} material={khaki} position={[0, 0.03, 0.003]} />
              </group>
            ))}
            {[0.06, 0.13, 0.2].map((y) => (
              <mesh key={y} geometry={sphereGeo(8, 6)} material={khakiDark} position={[0, y, 0.098 + y * 0.03]} scale={0.007} />
            ))}
            {[1, -1].map((sd) => (
              <mesh key={sd} geometry={boxGeo(0.04, 0.008, 0.11)} material={khakiDark} position={[0.14 * sd, 0.37, 0]} rotation={[0, 0, -0.45 * sd]} />
            ))}

            {/* Pañuelo: rollo al cuello, triángulo en la espalda con ribete, puntas por delante y pasador */}
            <mesh geometry={torusGeo(0.078, 0.02, 10, 24)} material={teamMat} position={[0, 0.405, -0.005]} rotation={[Math.PI / 2 - 0.15, 0, 0]} scale={[1, 0.85, 1]} castShadow />
            <mesh geometry={scarfTriangleGeo(0.86)} material={team2} position={[0, 0.4, -0.1]} rotation={[0.28, Math.PI, 0]} />
            <mesh geometry={scarfTriangleGeo(0.8)} material={teamMat} position={[0, 0.396, -0.104]} rotation={[0.28, Math.PI, 0]} castShadow />
            {[1, -1].map((sd) => (
              <mesh key={sd} geometry={boxGeo(0.03, 0.13, 0.012)} material={teamMat} position={[0.032 * sd, 0.34, 0.1]} rotation={[-0.2, 0, -0.38 * sd]} />
            ))}
            <mesh geometry={torusGeo(0.016, 0.008, 8, 14)} material={mat('#6B3E1F', 0.6)} position={[0, 0.285, 0.113]} />
            {[1, -1].map((sd) => (
              <mesh key={sd} geometry={boxGeo(0.024, 0.1, 0.01)} material={teamMat} position={[0.011 * sd, 0.225, 0.112]} rotation={[-0.08, 0, 0.12 * sd]} />
            ))}

            {/* Cuello y cabeza */}
            <mesh geometry={cylGeo(0.042, 0.047, 0.1, 12)} material={skin} position={[0, 0.435, 0.005]} castShadow />
            <group ref={bind('head')} position={[0, 0.47, 0.01]}>
              <mesh geometry={sphereGeo(24, 18)} material={skin} position={[0, 0.06, 0]} scale={[0.094, 0.115, 0.106]} castShadow />
              <mesh geometry={sphereGeo(16, 12)} material={skin} position={[0, 0.018, 0.022]} scale={[0.074, 0.065, 0.08]} />
              <mesh geometry={hairGeo()} material={hair} position={[0, 0.067, -0.006]} rotation={[-0.5, 0, 0]} scale={[0.099, 0.119, 0.111]} castShadow />
              {[1, -1].map((sd) => (
                <mesh key={sd} geometry={sphereGeo(10, 8)} material={skin} position={[0.093 * sd, 0.055, -0.005]} scale={[0.014, 0.027, 0.018]} />
              ))}
              <mesh geometry={sphereGeo(10, 8)} material={skin} position={[0, 0.045, 0.104]} scale={[0.014, 0.02, 0.017]} />
              <mesh geometry={boxGeo(0.032, 0.005, 0.006)} material={mat('#8A4A3A', 0.6)} position={[0, 0.012, 0.098]} />
              {!look.isBlindfolded &&
                [1, -1].map((sd) => (
                  <group key={sd} position={[0.034 * sd, 0.07, 0.088]}>
                    <mesh geometry={sphereGeo(10, 8)} material={mat('#F4F1EA', 0.3)} scale={[0.013, 0.01, 0.008]} />
                    <mesh geometry={sphereGeo(8, 6)} material={mat('#2B1A10', 0.2)} position={[0, 0, 0.006]} scale={0.0065} />
                    <mesh geometry={boxGeo(0.03, 0.006, 0.006)} material={hair} position={[0, 0.02, 0.006]} rotation={[0, 0, -0.1 * sd]} />
                  </group>
                ))}
              {look.isBlindfolded && (
                <group position={[0, 0.07, 0]}>
                  <mesh geometry={cylGeo(0.098, 0.098, 0.042, 24, true)} material={mat('#C81E1E', 0.85, 0, { side: THREE.DoubleSide })} scale={[1, 1, 1.13]} castShadow />
                  <mesh geometry={boxGeo(0.03, 0.08, 0.008)} material={mat('#A51616', 0.85)} position={[0.015, -0.04, -0.115]} rotation={[0.25, 0, 0.3]} />
                  <mesh geometry={boxGeo(0.03, 0.07, 0.008)} material={mat('#A51616', 0.85)} position={[-0.015, -0.035, -0.113]} rotation={[0.25, 0, -0.35]} />
                </group>
              )}
              {look.hatType === 'four_dents' && (
                <group position={[0, 0.135, -0.004]} rotation={[-0.06, 0, 0]}>
                  <mesh geometry={cylGeo(0.19, 0.19, 0.01, 36)} material={mat('#8E7A4E', 0.95)} castShadow />
                  <mesh geometry={hatCrownGeo()} material={mat('#8A7548', 0.95, 0, { flatShading: true })} position={[0, 0.004, 0]} castShadow />
                  <mesh geometry={cylGeo(0.111, 0.113, 0.026, 4, true)} material={mat('#4A3218', 0.6)} position={[0, 0.017, 0]} rotation={[0, Math.PI / 4, 0]} />
                </group>
              )}
              {look.hatType === 'beret' && (
                <group position={[0.012, 0.13, -0.008]} rotation={[-0.15, 0, 0.25]}>
                  <mesh geometry={sphereGeo(24, 12)} material={mat('#1E2B4F', 0.95)} scale={[0.118, 0.045, 0.124]} castShadow />
                  <mesh geometry={cylGeo(0.016, 0.016, 0.006, 12)} material={mat('#D4A72C', 0.3, 0.8)} position={[-0.075, 0.0, 0.07]} rotation={[1.2, 0, 0.6]} />
                </group>
              )}
            </group>

            {renderArm(1)}
            {renderArm(-1)}
          </group>

          {renderLeg(1)}
          {renderLeg(-1)}
        </group>
      </group>
    </group>
  );
}

