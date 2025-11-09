import { useState } from 'react';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import GrupoScout from './components/GrupoScout/GrupoScout';
import RegistroScout from './components/RegistroScout/RegistroScout';
import GestionScouts from './components/GestionScouts/GestionScouts';
import InscripcionAnual from './components/Inscripcion/InscripcionAnual';
import LibroOro from './components/LibroOro/LibroOro';
import ProgramaSemanal from './components/ProgramaSemanal/ProgramaSemanal';
import Reports from './components/Reports/Reports';
import ComitePadres from './components/ComitePadres/ComitePadres';
import Dirigentes from './components/Dirigentes/Dirigentes';
import Patrullas from './components/Patrullas/Patrullas';
import Asistencia from './components/Asistencia/Asistencia';
import ActividadesScout from './components/ActividadesScout/ActividadesScout';
import Inventario from './components/Inventario/Inventario';
import Presupuestos from './components/Presupuestos/Presupuestos';
import Maps from './components/Maps/Maps';
import DNGI03DocumentGenerator from './components/documents/DNGI03DocumentGenerator';
import BulkDocumentGenerator from './components/documents/BulkDocumentGenerator';
import VisualDocumentDesignerDemo from './pages/VisualDocumentDesignerDemo';

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveModule} />;
      case 'registro-scout':
        return <RegistroScout />;
      case 'gestion-scouts':
        return <GestionScouts />;
      case 'inscripcion-anual':
        return <InscripcionAnual />;
      case 'documentos-dngi03':
        return <DNGI03DocumentGenerator userRole="dirigente" userName="Admin" />;
      case 'documentos-masivos':
        return <BulkDocumentGenerator userRole="dirigente" userName="Admin" />;
      case 'editor-visual':
        return <VisualDocumentDesignerDemo />;
      case 'grupo-scout':
        return <GrupoScout />;
      case 'asistencia':
        return <Asistencia />;
      case 'actividades':
        return <ActividadesScout />;
      case 'mapas':
        return <Maps />;
      case 'dirigentes':
        return <Dirigentes />;
      case 'comite-padres':
        return <ComitePadres />;
      case 'patrullas':
        return <Patrullas />;
      case 'inventario':
        return <Inventario />;
      case 'presupuestos':
        return <Presupuestos />;
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