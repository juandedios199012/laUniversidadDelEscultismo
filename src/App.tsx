import { useState } from 'react';
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

// Authentication imports
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedLayout from './components/Layout/ProtectedLayout';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeModule, setActiveModule] = useState('dashboard');

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--gaming-bg))' }}>
        <LoadingSpinner size="lg" message="Cargando aplicación..." />
      </div>
    );
  }

  // Mostrar login si no hay usuario autenticado
  if (!user) {
    return <LoginPage />;
  }

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

  // Renderizar la aplicación protegida
  return (
    <ProtectedLayout activeModule={activeModule} onTabChange={setActiveModule}>
      {renderActiveModule()}
    </ProtectedLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;