// ============================================================================
// MÓDULO DE ESPECIALIDADES - COMPONENTE PRINCIPAL
// ============================================================================
// Sistema de Gestión Scout - Grupo Scout Lima 12
// ============================================================================

import { useState } from 'react';
import EspecialidadesDashboard from './EspecialidadesDashboard';
import CatalogoEspecialidades from './CatalogoEspecialidades';
import SeguimientoEspecialidades from './SeguimientoEspecialidades';
import AsignarEspecialidadDialog from './dialogs/AsignarEspecialidadDialog';
import type { Especialidad, AreaId } from '../../types/especialidades';

type ViewType = 'dashboard' | 'catalogo' | 'seguimiento';

interface ViewParams {
  area?: AreaId;
  especialidad?: Especialidad;
  scoutId?: string;
}

interface EspecialidadesModuleProps {
  onNavigateGlobal?: (module: string) => void;
}

export default function EspecialidadesModule({ onNavigateGlobal }: EspecialidadesModuleProps) {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [viewParams, setViewParams] = useState<ViewParams>({});
  const [dialogAsignar, setDialogAsignar] = useState(false);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState<Especialidad | null>(null);

  const handleNavigate = (view: string, params?: Record<string, unknown>) => {
    setCurrentView(view as ViewType);
    setViewParams(params || {});
  };

  const handleSelectEspecialidad = (especialidad: Especialidad) => {
    setEspecialidadSeleccionada(especialidad);
    setDialogAsignar(true);
  };

  const handleAsignarSuccess = () => {
    setDialogAsignar(false);
    setEspecialidadSeleccionada(null);
    // Si estamos en seguimiento, refrescar
    if (currentView === 'seguimiento') {
      // El componente se refrescará automáticamente
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <EspecialidadesDashboard
            onNavigate={handleNavigate}
            onNavigateGlobal={onNavigateGlobal}
          />
        );

      case 'catalogo':
        return (
          <CatalogoEspecialidades
            areaInicial={viewParams.area || null}
            onBack={() => setCurrentView('dashboard')}
            onSelectEspecialidad={handleSelectEspecialidad}
          />
        );

      case 'seguimiento':
        return (
          <SeguimientoEspecialidades
            onBack={() => setCurrentView('dashboard')}
            onAsignarClick={() => setDialogAsignar(true)}
          />
        );

      default:
        return <EspecialidadesDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-full">
      {renderView()}

      {/* Dialog para asignar especialidad */}
      <AsignarEspecialidadDialog
        open={dialogAsignar}
        onOpenChange={setDialogAsignar}
        especialidadPreseleccionada={especialidadSeleccionada || undefined}
        onSuccess={handleAsignarSuccess}
      />
    </div>
  );
}
