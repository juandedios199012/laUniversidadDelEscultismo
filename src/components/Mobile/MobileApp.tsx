import React, { useState, useEffect } from 'react';
import MobileLayout from './MobileLayout';
import ScoutsScreen from './ScoutsScreen';
import AsistenciaScreen from './AsistenciaScreen';
import PuntajesScreen from './PuntajesScreen';
import ProgresionScreen from './ProgresionScreen';
import SalidaScreen from './SalidaScreen';
import PortalPadresPage from '../PortalPadres/PortalPadresPage';
import { usePermissions } from '@/contexts/PermissionsContext';

export default function MobileApp() {
  const [currentTab, setCurrentTab] = useState<'scouts' | 'asistencia' | 'puntajes' | 'progresion' | 'salida' | 'portal-padres'>('scouts');
  const { puedeAcceder, loading: loadingPermisos } = usePermissions();

  // Redirigir a portal-padres si el usuario no tiene acceso al módulo scouts
  useEffect(() => {
    if (loadingPermisos) return;
    if (!puedeAcceder('scouts') && puedeAcceder('portal_padres')) {
      setCurrentTab('portal-padres');
    }
  }, [loadingPermisos]);

  const renderScreen = () => {
    switch (currentTab) {
      case 'scouts':
        return <ScoutsScreen />;
      case 'asistencia':
        return <AsistenciaScreen />;
      case 'puntajes':
        return <PuntajesScreen />;
      case 'progresion':
        return <ProgresionScreen />;
      case 'salida':
        return <SalidaScreen />;
      case 'portal-padres':
        return <PortalPadresPage />;
      default:
        return <ScoutsScreen />;
    }
  };

  return (
    <MobileLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderScreen()}
    </MobileLayout>
  );
}
