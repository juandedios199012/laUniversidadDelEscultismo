/**
 * Configuración de Etapas Scout – colores, iconos y metadatos
 * Se usan en toda la UI v2 de Progresión
 */
export interface EtapaConfig {
  codigo: string;
  nombre: string;
  nombreCorto: string;
  icon: string;
  color: string;
  edadMin: number;
  edadMax: number;
  descripcion: string;
}

export const ETAPAS_CONFIG: Record<string, EtapaConfig> = {
  PISTA: {
    codigo: 'PISTA',
    nombre: 'Pista',
    nombreCorto: 'Pista',
    icon: '🔍',
    color: '#00e5ff',
    edadMin: 11,
    edadMax: 12,
    descripcion: 'Primera etapa de exploración. Seguir las huellas que dejan las demás personas y descubrir nuevos territorios.',
  },
  SENDA: {
    codigo: 'SENDA',
    nombre: 'Senda',
    nombreCorto: 'Senda',
    icon: '🌿',
    color: '#00e676',
    edadMin: 12,
    edadMax: 13,
    descripcion: 'Las pistas nos llevan a descubrir caminos nuevos. Un camino escarpado que encierra esperanza.',
  },
  RUMBO: {
    codigo: 'RUMBO',
    nombre: 'Rumbo',
    nombreCorto: 'Rumbo',
    icon: '⭐',
    color: '#ffd600',
    edadMin: 13,
    edadMax: 14,
    descripcion: 'Establecer un rumbo propio con identidad y propósito claro hacia el futuro.',
  },
  TRAVESIA: {
    codigo: 'TRAVESIA',
    nombre: 'Travesía',
    nombreCorto: 'Travesía',
    icon: '🏔️',
    color: '#e040fb',
    edadMin: 14,
    edadMax: 15,
    descripcion: 'La travesía es el camino completo. Explorar el mundo siendo protagonistas del propio destino.',
  },
};

export const ETAPAS_LISTA: EtapaConfig[] = Object.values(ETAPAS_CONFIG);

/**
 * Configuración de Áreas de Crecimiento Scout
 */
export interface AreaConfig {
  codigo: string;
  nombre: string;
  icon: string;
  color: string;
  descripcion: string;
}

export const AREAS_CONFIG: Record<string, AreaConfig> = {
  CORP: {
    codigo: 'CORP',
    nombre: 'Corporalidad',
    icon: '💪',
    color: '#00b0ff',
    descripcion: 'Desarrollo físico y cuidado del cuerpo como templo del espíritu',
  },
  CREA: {
    codigo: 'CREA',
    nombre: 'Creatividad',
    icon: '🎨',
    color: '#d500f9',
    descripcion: 'Expresión artística, habilidades manuales e imaginación desbordada',
  },
  CARA: {
    codigo: 'CARA',
    nombre: 'Carácter',
    icon: '🦁',
    color: '#ff6d00',
    descripcion: 'Valores, virtudes y forja del propio carácter con disciplina',
  },
  AFEC: {
    codigo: 'AFEC',
    nombre: 'Afectividad',
    icon: '❤️',
    color: '#f50057',
    descripcion: 'Inteligencia emocional, relaciones y gestión del mundo interior',
  },
  SOCI: {
    codigo: 'SOCI',
    nombre: 'Sociabilidad',
    icon: '🤝',
    color: '#00c853',
    descripcion: 'Servicio, liderazgo, trabajo en equipo y compromiso comunitario',
  },
  ESPI: {
    codigo: 'ESPI',
    nombre: 'Espiritualidad',
    icon: '✨',
    color: '#651fff',
    descripcion: 'Búsqueda de sentido, trascendencia y conexión con algo mayor',
  },
};

export const AREAS_LISTA: AreaConfig[] = Object.values(AREAS_CONFIG);
