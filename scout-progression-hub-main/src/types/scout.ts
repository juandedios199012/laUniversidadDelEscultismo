// Scout progression stages
export type Stage = 'pista' | 'senda' | 'rumbo' | 'travesia';

// Growth areas based on the scout methodology
export type GrowthArea = 
  | 'corporalidad'
  | 'creatividad'
  | 'caracter'
  | 'afectividad'
  | 'sociabilidad'
  | 'espiritualidad';

export interface StageInfo {
  id: Stage;
  name: string;
  age: number;
  description: string;
  icon: string;
  color: string;
}

export interface GrowthAreaInfo {
  id: GrowthArea;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  area: GrowthArea;
  stage: Stage;
  completed: boolean;
  completedAt?: Date;
}

export interface Scout {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  patrolId: string;
  currentStage: Stage;
  birthDate: Date;
  joinDate: Date;
  objectives: Objective[];
}

export interface Patrol {
  id: string;
  name: string;
  color: string;
  scouts: Scout[];
}

export interface ScoutProgress {
  area: GrowthArea;
  completed: number;
  total: number;
  percentage: number;
}

// Stage configuration
export const STAGES: StageInfo[] = [
  {
    id: 'pista',
    name: 'Pista',
    age: 11,
    description: 'La primera etapa de exploración. Seguir las huellas que dejan las demás personas y descubrir nuevos territorios.',
    icon: '🔍',
    color: 'hsl(180, 100%, 50%)',
  },
  {
    id: 'senda',
    name: 'Senda',
    age: 12,
    description: 'Las pistas nos llevan a descubrir caminos nuevos. Un camino escarpado que encierra la esperanza de campos abiertos.',
    icon: '🛤️',
    color: 'hsl(160, 84%, 45%)',
  },
  {
    id: 'rumbo',
    name: 'Rumbo',
    age: 13,
    description: 'Encontrar la dirección correcta. Tomar decisiones más conscientes sobre el camino a seguir.',
    icon: '🧭',
    color: 'hsl(45, 100%, 55%)',
  },
  {
    id: 'travesia',
    name: 'Travesía',
    age: 14,
    description: 'El viaje completo. Integrar todos los aprendizajes y prepararse para nuevos desafíos.',
    icon: '⛰️',
    color: 'hsl(340, 82%, 55%)',
  },
];

// Growth areas configuration
export const GROWTH_AREAS: GrowthAreaInfo[] = [
  {
    id: 'corporalidad',
    name: 'Corporalidad',
    description: 'Desarrollo del cuerpo, salud física, actividades al aire libre',
    icon: '💪',
    color: 'hsl(200, 100%, 50%)',
  },
  {
    id: 'creatividad',
    name: 'Creatividad',
    description: 'Pensamiento creativo, expresión artística, innovación',
    icon: '🎨',
    color: 'hsl(280, 100%, 65%)',
  },
  {
    id: 'caracter',
    name: 'Carácter',
    description: 'Voluntad, responsabilidad, compromiso personal',
    icon: '⚡',
    color: 'hsl(25, 100%, 55%)',
  },
  {
    id: 'afectividad',
    name: 'Afectividad',
    description: 'Emociones, autoestima, relaciones interpersonales',
    icon: '❤️',
    color: 'hsl(340, 85%, 60%)',
  },
  {
    id: 'sociabilidad',
    name: 'Sociabilidad',
    description: 'Trabajo en equipo, servicio comunitario, ciudadanía',
    icon: '🤝',
    color: 'hsl(140, 70%, 45%)',
  },
  {
    id: 'espiritualidad',
    name: 'Espiritualidad',
    description: 'Valores, sentido de vida, conexión con lo trascendente',
    icon: '✨',
    color: 'hsl(260, 60%, 55%)',
  },
];
