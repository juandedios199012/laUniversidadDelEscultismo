/** Tipo de escena 3D (arquetipo cinemático). Cada juego del catálogo se representa con uno. */
export type ArchetypeId = 'chain' | 'territory' | 'circle' | 'relay' | 'stealth' | 'station';

/** Elemento focal de un juego de taller: el objeto central de la escena y las posturas alrededor. */
export type FocalProp =
  | 'ground_mosaic' | 'stress_test_rig' | 'pioneering_tripod' | 'first_aid_stretcher'
  | 'campfire_cooking' | 'tent_assembly' | 'cartography_table' | 'seed_bomb_craft';

/** Escena 3D concreta: un arquetipo, o un taller con su elemento focal. */
export type SceneId = ArchetypeId | `station_${FocalProp}`;

/** Postura del cuerpo completo (piernas, cadera y tronco). */
export type Stance = 'stand' | 'kneel' | 'kneel_both' | 'sit' | 'squat' | 'lie' | 'ride' | 'prone' | 'brace' | 'one_leg' | 'carried';

/** Mezcla entre la postura de cuerpo anterior y la nueva (transición suave, como los brazos). */
export interface StanceBlend { from: Stance; to: Stance; w: number }

/** Objeto pequeño en la mano derecha. */
export type HandProp = 'compass' | 'rope' | 'bandage' | 'pencil' | 'stone' | 'twig' | 'notebook' | 'stick' | 'mallet' | 'whistle' | 'ball';

/** Coordenadas del terreno en METROS. X = ancho del campo, Z = profundidad. (0,0) es el centro. */
export interface Vec2 {
  x: number;
  z: number;
}

export type CompetitorRole = 'lider' | 'sublider' | 'jugador' | 'atacante' | 'defensor' | 'corredor';
export type HatType = 'four_dents' | 'beret' | 'none';

/** Postura de brazos. Cada una tiene ángulos objetivo en el modelo 3D y se mezclan suavemente. */
export type ArmPose = 'swing' | 'shoulders' | 'behind' | 'tag' | 'carry' | 'frozen' | 'work' | 'cheer' | 'hold' | 'measure' | 'chair' | 'pull' | 'salute' | 'crossed' | 'throw';

/** Apariencia fija de un competidor (no cambia en el tiempo). */
export interface CompetitorAppearance {
  id: string;
  name: string;
  role: CompetitorRole;
  teamName: string;
  teamColor: string;    // Color principal del pañuelo
  secondaryColor: string; // Ribete del pañuelo
  isBlindfolded: boolean;
  hatType: HatType;
  skinTone: string;
  hairColor: string;
  height: number;         // Estatura en metros (~1.45–1.70)
}

/** Estado de un competidor en un instante concreto. */
export interface CompetitorState extends CompetitorAppearance {
  pos: Vec2;
  heading: number;        // Radianes en el plano XZ: dirección = (cos h, sin h)
  speed: number;          // m/s
  gaitPhase: number;      // Fase del ciclo de marcha (radianes), proporcional a la distancia recorrida
  armPose: { from: ArmPose; to: ArmPose; w: number }; // Mezcla entre posturas (w: 0 → from, 1 → to)
  crouch: number;         // 0 = erguido, 1 = agachado (sigilo)
  frozen: boolean;        // Congelado (Asalto a la Bandera)
  stance: StanceBlend;
  handProp?: HandProp;
  /** Mochila puesta en la espalda. */
  wearsBackpack?: boolean;
  holdingChicote: boolean;
  actionLabel?: string;   // Texto corto de lo que está haciendo (para las etiquetas)
}

export interface TreeEntity {
  x: number;
  z: number;
  height: number;
  canopyRadius: number;
  foliageColor: string;
}

export interface FlagState {
  id: string;
  color: string;
  secondaryColor: string;
  /** Si `carrierId` está definido, la bandera va en la mano del competidor; si no, clavada en `pos`. */
  pos: Vec2;
  carrierId?: string;
}

export interface FieldZone {
  label: string;
  center: Vec2;
  size: { w: number; d: number };
  color: string;
}

/** Elemento focal ubicado en el campo (se dibuja en 3D en Props3D). */
export interface FieldProp {
  kind: FocalProp;
  pos: Vec2;
  rotation?: number; // radianes alrededor del eje vertical
}

export interface FieldLayout {
  width: number;          // m (eje X)
  depth: number;          // m (eje Z)
  midline: boolean;       // Línea central (campos divididos)
  circle?: { center: Vec2; radius: number };
  zones: FieldZone[];
  trees: TreeEntity[];
  finish?: { x: number; z0: number; z1: number }; // Línea de meta
  props?: FieldProp[];
  /** Piezas fijas que define la propia coreografía (postes, mesas, pizarras, cuerdas tendidas…). */
  setPieces?: SetPiece[];
}

export interface GameFrame {
  competitors: CompetitorState[];
  /** Objetos que se mueven en la escena (peso arrastrado, bordón, piezas que se colocan…). */
  items?: (SetPiece & { id: string })[];
  flags: FlagState[];
  /** Pañuelo-chicote suelto en el suelo o en mano de alguien (por id). */
  chicote?: { carrierId?: string; pos?: Vec2 };
}

// -----------------------------------------------------------------------------
// Parámetros por juego (motor paramétrico): cada juego del catálogo varía su escena
// -----------------------------------------------------------------------------

/** Tipos de material detectados en el Excel (deben coincidir con scripts/catalog_detection.py). */
export const MATERIAL_KINDS = [
  'tape_measure', 'tape', 'first_aid_kit', 'blindfold', 'neckerchief', 'rope', 'stake', 'staff', 'cone', 'chalk',
  'whistle', 'ball', 'compass', 'map', 'notebook', 'board', 'cards', 'paper', 'pen', 'weight', 'water', 'bucket',
  'backpack', 'flag', 'tent', 'hammer', 'blade', 'fire', 'logs', 'natural', 'food', 'camp_gear', 'stool', 'music',
  'soap', 'sack', 'blanket', 'stopwatch', 'flashlight', 'mirror', 'carabiner', 'uniform', 'none',
] as const;
export type MaterialKind = (typeof MATERIAL_KINDS)[number];

export const FORMATION_KINDS = [
  'horseshoe', 'star', 'cross', 'circle', 'pairs', 'columns', 'rows', 'lines', 'corner', 'scattered', 'open_field', 'unknown',
] as const;
export type FormationKind = (typeof FORMATION_KINDS)[number];

/** Objeto visible del juego: primero los que nombran sus reglas, después el kit de materiales. */
export interface VisibleProp {
  kind: MaterialKind;
  qty: number | null;
  source: 'rules' | 'materials' | 'both';
}

/** Variación visual determinista por juego (a partir de su ID). */
export interface SceneVariant {
  mirror: boolean;      // escena reflejada (izquierda ↔ derecha)
  paletteOffset: number; // rotación de la paleta de colores de equipo
  sunAngle: number;     // azimut del sol (radianes)
}

/** Piezas de escena que no son materiales del Excel (las usan las coreografías). */
export type ScenePieceKind = 'post' | 'table' | 'easel' | 'rope_line' | 'crossed_staffs' | 'x_staffs' | 'target' | 'litter' | 'stretcher' | 'chest' | 'tripod_goal' | 'sand' | 'footprints';
export type PieceKind = MaterialKind | ScenePieceKind;

/** Objeto colocado en la escena (material del juego o pieza de la coreografía). */
export interface SetPiece {
  kind: PieceKind;
  pos: Vec2;
  rotation?: number;
  count?: number;  // cuántas unidades dibujar (1–4)
  height?: number; // altura sobre el suelo (objetos levantados o colgando)
  to?: Vec2;       // extremo final (cuerda tendida entre dos puntos)
}

/** Objeto de material colocado en el campo por el motor paramétrico. */
export type DressingItem = SetPiece & { kind: MaterialKind; rotation: number; count: number };
