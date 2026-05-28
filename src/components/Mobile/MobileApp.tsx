import React, { useState } from 'react';
import MobileLayout from './MobileLayout';
import ScoutsScreen from './ScoutsScreen';
import AsistenciaScreen from './AsistenciaScreen';
import PuntajesScreen from './PuntajesScreen';
import ProgresionScreen from './ProgresionScreen';
import InscripcionAnualMobile from '../Inscripcion/InscripcionAnualMobile';
import PortalPadresPage from '../PortalPadres/PortalPadresPage';

export default function MobileApp() {
  const [currentTab, setCurrentTab] = useState<'scouts' | 'asistencia' | 'puntajes' | 'progresion' | 'inscripcion-anual' | 'portal-padres'>('scouts');

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
      case 'inscripcion-anual':
        return <InscripcionAnualMobile onComplete={() => setCurrentTab('scouts')} />;
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
