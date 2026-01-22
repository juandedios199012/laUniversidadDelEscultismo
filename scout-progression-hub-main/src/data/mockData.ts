import { Scout, Patrol, Objective, Stage, GrowthArea } from '@/types/scout';

// Sample objectives based on the PDF content
const createObjectives = (scoutId: string): Objective[] => {
  const objectives: Omit<Objective, 'id'>[] = [
    // Corporalidad objectives
    { title: 'Participo en actividades que ayudan a mantener mi cuerpo fuerte y sano', description: 'Realizar excursiones y actividades físicas con la patrulla', area: 'corporalidad', stage: 'pista', completed: true, completedAt: new Date('2024-03-15') },
    { title: 'Me doy cuenta de los cambios que se están produciendo en mi cuerpo', description: 'Comprender y aceptar los cambios físicos de la adolescencia', area: 'corporalidad', stage: 'pista', completed: true, completedAt: new Date('2024-04-20') },
    { title: 'Trato de evitar situaciones que puedan dañar mi salud', description: 'Identificar y prevenir riesgos para la salud', area: 'corporalidad', stage: 'pista', completed: false },
    { title: 'Sé lo que puedo y no puedo hacer con mi cuerpo', description: 'Conocer las capacidades y limitaciones físicas propias', area: 'corporalidad', stage: 'senda', completed: false },
    { title: 'Trato de no ser agresivo en juegos y actividades', description: 'Practicar el juego limpio y respetuoso', area: 'corporalidad', stage: 'senda', completed: false },
    { title: 'Me preocupo por mi aspecto personal y porque mi cuerpo esté limpio', description: 'Mantener hábitos de higiene personal', area: 'corporalidad', stage: 'senda', completed: true, completedAt: new Date('2024-05-10') },
    
    // Creatividad objectives
    { title: 'Sé preparar comidas sencillas al aire libre', description: 'Cocina rústica y preparación de alimentos en campamento', area: 'creatividad', stage: 'pista', completed: true, completedAt: new Date('2024-06-05') },
    { title: 'Conozco y utilizo diferentes nudos y amarres', description: 'Técnicas scouts básicas de nudos', area: 'creatividad', stage: 'pista', completed: false },
    { title: 'Sé orientarme usando un mapa y brújula', description: 'Habilidades de orientación y navegación', area: 'creatividad', stage: 'senda', completed: false },
    { title: 'Puedo construir estructuras sencillas en campamento', description: 'Construcciones de campamento', area: 'creatividad', stage: 'senda', completed: false },
    
    // Carácter objectives
    { title: 'Cumplo con mis responsabilidades en la patrulla', description: 'Ser responsable con las tareas asignadas', area: 'caracter', stage: 'pista', completed: true, completedAt: new Date('2024-02-28') },
    { title: 'Reconozco mis errores y trato de enmendarlos', description: 'Desarrollo de la honestidad y autocrítica', area: 'caracter', stage: 'pista', completed: false },
    { title: 'Me esfuerzo por mejorar cada día', description: 'Compromiso con el crecimiento personal', area: 'caracter', stage: 'senda', completed: false },
    
    // Afectividad objectives
    { title: 'Expreso mis emociones de manera adecuada', description: 'Inteligencia emocional y expresión de sentimientos', area: 'afectividad', stage: 'pista', completed: true, completedAt: new Date('2024-04-12') },
    { title: 'Respeto a mis compañeros y compañeras', description: 'Relaciones respetuosas con los demás', area: 'afectividad', stage: 'pista', completed: true, completedAt: new Date('2024-03-20') },
    { title: 'Puedo hablar de mis sentimientos con personas de confianza', description: 'Comunicación emocional abierta', area: 'afectividad', stage: 'senda', completed: false },
    
    // Sociabilidad objectives
    { title: 'Participo activamente en mi patrulla', description: 'Trabajo en equipo y participación grupal', area: 'sociabilidad', stage: 'pista', completed: true, completedAt: new Date('2024-01-15') },
    { title: 'Ayudo a ordenar y limpiar los espacios que uso', description: 'Responsabilidad con el entorno compartido', area: 'sociabilidad', stage: 'pista', completed: true, completedAt: new Date('2024-02-10') },
    { title: 'Colaboro en proyectos de servicio comunitario', description: 'Servicio a la comunidad', area: 'sociabilidad', stage: 'senda', completed: false },
    
    // Espiritualidad objectives
    { title: 'Reflexiono sobre mis acciones y sus consecuencias', description: 'Desarrollo de la consciencia moral', area: 'espiritualidad', stage: 'pista', completed: false },
    { title: 'Aprecio la naturaleza y cuido el medio ambiente', description: 'Conexión con la naturaleza', area: 'espiritualidad', stage: 'pista', completed: true, completedAt: new Date('2024-05-01') },
    { title: 'Busco el sentido de las cosas que hago', description: 'Reflexión sobre el propósito de las acciones', area: 'espiritualidad', stage: 'senda', completed: false },
  ];

  return objectives.map((obj, index) => ({
    ...obj,
    id: `${scoutId}-obj-${index}`,
  }));
};

// Create mock scouts
const createMockScouts = (patrolId: string, patrolPrefix: string): Scout[] => {
  const scoutNames = [
    { name: 'María García', stage: 'senda' as Stage },
    { name: 'Carlos López', stage: 'pista' as Stage },
    { name: 'Ana Martínez', stage: 'senda' as Stage },
    { name: 'Luis Rodríguez', stage: 'rumbo' as Stage },
    { name: 'Sofia Hernández', stage: 'pista' as Stage },
    { name: 'Diego Torres', stage: 'senda' as Stage },
  ];

  return scoutNames.map((scout, index) => {
    const id = `${patrolPrefix}-scout-${index + 1}`;
    return {
      id,
      name: scout.name,
      patrolId,
      currentStage: scout.stage,
      birthDate: new Date(2012 - index, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      joinDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      objectives: createObjectives(id),
    };
  });
};

// Mock patrols data
export const mockPatrols: Patrol[] = [
  {
    id: 'patrol-1',
    name: 'Patrulla Águilas',
    color: 'hsl(180, 100%, 50%)',
    scouts: createMockScouts('patrol-1', 'aguilas'),
  },
  {
    id: 'patrol-2',
    name: 'Patrulla Lobos',
    color: 'hsl(160, 84%, 45%)',
    scouts: createMockScouts('patrol-2', 'lobos'),
  },
  {
    id: 'patrol-3',
    name: 'Patrulla Panteras',
    color: 'hsl(45, 100%, 55%)',
    scouts: createMockScouts('patrol-3', 'panteras'),
  },
];

// Helper function to calculate progress
export const calculateProgress = (objectives: Objective[], area?: GrowthArea) => {
  const filtered = area 
    ? objectives.filter(obj => obj.area === area)
    : objectives;
  
  const completed = filtered.filter(obj => obj.completed).length;
  const total = filtered.length;
  
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
};

// Get all scouts
export const getAllScouts = (): Scout[] => {
  return mockPatrols.flatMap(patrol => patrol.scouts);
};

// Get scout by ID
export const getScoutById = (id: string): Scout | undefined => {
  return getAllScouts().find(scout => scout.id === id);
};

// Get patrol by ID
export const getPatrolById = (id: string): Patrol | undefined => {
  return mockPatrols.find(patrol => patrol.id === id);
};
