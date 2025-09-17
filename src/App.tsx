import { useState } from 'react';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import RegistroScout from './components/Scout/RegistroScout';
import LibroOro from './components/LibroOro/LibroOro';
import ProgramaSemanal from './components/ProgramaSemanal/ProgramaSemanal';
import Reports from './components/Reports/Reports';
import ComitePadres from './components/ComitePadres/ComitePadres';
import Dirigentes from './components/Dirigentes/Dirigentes';
import Patrullas from './components/Patrullas/Patrullas';
import InscripcionAnual from './components/Inscripcion/InscripcionAnual';
import Asistencia from './components/Asistencia/Asistencia';
import ActividadesScout from './components/ActividadesScout/ActividadesScout';
import Inventario from './components/Inventario/Inventario';

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveModule} />;
      case 'registro':
        return <RegistroScout />;
      case 'inscripcion':
        return <InscripcionAnual />;
      case 'asistencia':
        return <Asistencia />;
      case 'actividades':
        return <ActividadesScout />;
      case 'dirigentes':
        return <Dirigentes />;
      case 'comite-padres':
        return <ComitePadres />;
      case 'patrullas':
        return <Patrullas />;
      case 'inventario':
        return <Inventario />;
      case 'libro-oro':
        return <LibroOro />;
      case 'programa-semanal':
        return <ProgramaSemanal />;
      case 'reportes':
        return <Reports />;
      default:
        return <Dashboard onNavigate={setActiveModule} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--gaming-bg))' }}>
      <Header />
      <div className="flex pt-16">
        <Sidebar activeTab={activeModule} onTabChange={setActiveModule} />
        <main className="flex-1 ml-64 p-6">
          <div className="animate-slide-in">
            {renderActiveModule()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;