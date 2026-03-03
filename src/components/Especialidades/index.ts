// ============================================================================
// MÓDULO DE ESPECIALIDADES - BARREL EXPORT
// ============================================================================
// Sistema de Gestión Scout - Grupo Scout Lima 12
// ============================================================================

// Componente principal del módulo
export { default as EspecialidadesModule } from './EspecialidadesModule';

// Componentes individuales
export { default as EspecialidadesDashboard } from './EspecialidadesDashboard';
export { default as CatalogoEspecialidades } from './CatalogoEspecialidades';
export { default as SeguimientoEspecialidades } from './SeguimientoEspecialidades';
export { default as ReportesEspecialidades } from './ReportesEspecialidades';

// Dialogs
export { default as AsignarEspecialidadDialog } from './dialogs/AsignarEspecialidadDialog';

// Re-export tipos
export type {
  AreaEspecialidad,
  Especialidad,
  EspecialidadDetalle,
  ProgresoEspecialidad,
  DashboardEspecialidades,
  ReporteScoutEspecialidades,
  FaseId,
  FaseEstado,
  AreaId
} from '../../types/especialidades';

// Re-export constantes
export {
  FASE_LABELS,
  ESTADO_LABELS,
  ESTADO_COLORS,
  AREA_COLORS,
  AREA_GRADIENTS
} from '../../types/especialidades';
