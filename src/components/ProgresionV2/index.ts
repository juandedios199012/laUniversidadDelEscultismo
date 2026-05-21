// Punto de entrada público del módulo ProgresionV2
export { default as ProgresionV2Module } from './ProgresionV2Module';

// UI primitivos
export { GlassCard } from './ui/GlassCard';
export { ProgressRing } from './ui/ProgressRing';
export { StageBadge } from './ui/StageBadge';

// Configuración
export * from './config/etapasConfig';

// Sub-páginas (exportadas directamente si se necesitan individualmente)
export { default as ProgresionPageV2 } from './progresion/ProgresionPageV2';
export { default as EspecialidadesPageV2 } from './especialidades/EspecialidadesPageV2';
export { default as ObjetivosPageV2 } from './objetivos/ObjetivosPageV2';
