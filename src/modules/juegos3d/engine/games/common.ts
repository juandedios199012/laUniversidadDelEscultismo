import { ArmPose, FieldLayout, FlagState, GameFrame, HandProp, HatType, CompetitorAppearance, CompetitorRole, SceneId, SetPiece, Stance, StanceBlend, Vec2 } from '../types';
import { Track, sampleTrack } from '../tracks';

export interface CompetitorScript {
  appearance: CompetitorAppearance;
  track: Track;
  pose: (t: number) => { from: ArmPose; to: ArmPose; w: number };
  crouch?: (t: number) => number;
  frozenFrom?: number;
  label?: (t: number) => string | undefined;
  holdingChicote?: (t: number) => boolean;
  /** Postura fija, o línea de tiempo de posturas (ver stanceTimeline). */
  stance?: Stance | ((t: number) => StanceBlend);
  handProp?: HandProp | ((t: number) => HandProp | undefined);
  wearsBackpack?: boolean;
}

export interface GameDefinition {
  id: SceneId;
  duration: number; // segundos de la secuencia animada
  focusId: string;  // protagonista que sigue la cámara "Seguir acción"
  field: FieldLayout;
  competitors: CompetitorScript[];
  flags: (t: number) => FlagState[];
  chicote?: (t: number) => { carrierId?: string; pos?: Vec2 };
  /** Objetos que se mueven (ver GameFrame.items). */
  items?: (t: number) => (SetPiece & { id: string })[];
}

export function evaluateGame(def: GameDefinition, t: number): GameFrame {
  return {
    competitors: def.competitors.map((s) => {
      const sample = sampleTrack(s.track, t);
      const frozen = s.frozenFrom !== undefined && t >= s.frozenFrom;
      return {
        ...s.appearance,
        ...sample,
        armPose: s.pose(t),
        crouch: s.crouch?.(t) ?? 0,
        frozen,
        holdingChicote: s.holdingChicote?.(t) ?? false,
        stance: typeof s.stance === 'function' ? s.stance(t) : { from: s.stance ?? 'stand', to: s.stance ?? 'stand', w: 1 },
        handProp: typeof s.handProp === 'function' ? s.handProp(t) : s.handProp,
        wearsBackpack: s.wearsBackpack,
        actionLabel: s.label?.(t),
      };
    }),
    flags: def.flags(t),
    chicote: def.chicote?.(t),
    items: def.items?.(t),
  };
}

const SKIN_TONES = ['#E8B994', '#C98E68', '#F0C8A8', '#A8704C', '#D9A27A', '#8A5A3C', '#E3AE88'];
const HAIR_COLORS = ['#2A1A10', '#1A110B', '#4A2E1A', '#120C08', '#5B3920', '#2F1D12'];

/** Apariencia con variedad determinista (tono de piel, cabello y estatura) según el índice. */
export function appearance(
  index: number,
  base: {
    id: string;
    name: string;
    role: CompetitorRole;
    teamName: string;
    teamColor: string;
    secondaryColor: string;
    hatType: HatType;
    isBlindfolded?: boolean;
  }
): CompetitorAppearance {
  return {
    isBlindfolded: false,
    ...base,
    skinTone: SKIN_TONES[(index * 3 + 1) % SKIN_TONES.length],
    hairColor: HAIR_COLORS[(index * 5 + 2) % HAIR_COLORS.length],
    height: 1.5 + ((index * 37) % 17) / 100,
  };
}
