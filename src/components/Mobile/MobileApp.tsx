import React, { useState } from 'react';
import MobileLayout from './MobileLayout';
import ScoutsScreen from './ScoutsScreen';
import AsistenciaScreen from './AsistenciaScreen';
import PuntajesScreen from './PuntajesScreen';

export default function MobileApp() {
  const [currentTab, setCurrentTab] = useState<'scouts' | 'asistencia' | 'puntajes'>('scouts');

  const renderScreen = () => {
    switch (currentTab) {
      case 'scouts':
        return <ScoutsScreen />;
      case 'asistencia':
        return <AsistenciaScreen />;
      case 'puntajes':
        return <PuntajesScreen />;
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
