import React, { useState } from 'react';
import { Toaster } from 'sonner';
import Dashboard from './components/Dashboard/Dashboard';
import GrupoScout from './components/GrupoScout/GrupoScout';
import RegistroScout from './components/RegistroScout/RegistroScout';
import { RegistroScoutPage as RegistroScoutV2 } from './components/RegistroScout/v2';
import GestionScouts from './components/GestionScouts/GestionScouts';
import InscripcionAnualMejorada from './components/Inscripcion/InscripcionAnualMejorada';
import LibroOro from './components/LibroOro/LibroOro';
import ProgramaSemanal from './components/ProgramaSemanal/ProgramaSemanal';
import Reports from './components/Reports/Reports';
import ComitePadres from './components/ComitePadres/ComitePadres';
// Módulo de Dirigentes con nuevo diseño Glassmorphism (DNGI-02)
import DirigentesV2 from './components/DirigentesV2';
import Patrullas from './components/Patrullas/Patrullas';
import Asistencia from './components/Asistencia/Asistencia';
import ActividadesScout from './components/ActividadesScout/ActividadesScout';
import Inventario from './components/Inventario/Inventario';
import Presupuestos from './components/Presupuestos/Presupuestos';
import { FinanzasDashboard } from './components/Finanzas';
import { ActividadesExteriorDashboard } from './components/ActividadesExterior';
import Maps from './components/Maps/Maps';
import MobileApp from './components/Mobile/MobileApp';
import { ProgresionPage, AdminObjetivosPage } from './components/Progresion';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedLayout from './components/Layout/ProtectedLayout';
import { useMobileDetect } from './hooks/useMobileDetect';

function App() {
  console.log('📱 App renderizando...');
  const [activeModule, setActiveModule] = useState('dashboard');
  const { isMobile } = useMobileDetect();

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveModule} />;
      case 'registro-scout':
        return <RegistroScout />;
      case 'registro-scout-v2':
        return <RegistroScoutV2 />;
      case 'gestion-scouts':
        return <GestionScouts />;
      case 'inscripcion-anual':
        return <InscripcionAnualMejorada />;
      case 'progresion':
        return <ProgresionPage />;
      case 'admin-objetivos':
        return <AdminObjetivosPage />;
      case 'grupo-scout':
        return <GrupoScout />;
      case 'asistencia':
        return <Asistencia />;
      case 'actividades':
        return <ActividadesScout />;
      case 'mapas':
        return <Maps />;
      case 'dirigentes':
        return <DirigentesV2 />;
      case 'comite-padres':
        return <ComitePadres />;
      case 'patrullas':
        return <Patrullas />;
      case 'inventario':
        return <Inventario />;
      case 'presupuestos':
        return <Presupuestos />;
      case 'finanzas':
        return <FinanzasDashboard />;
      case 'actividades-exterior':
        return <ActividadesExteriorDashboard />;
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

  // Si es pantalla mobile (<768px), renderizar interfaz mobile
  if (isMobile) {
    return (
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <MobileApp />
      </AuthProvider>
    );
  }

  // Desktop: renderizar interfaz normal
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <ProtectedLayout activeModule={activeModule} onTabChange={setActiveModule}>
        {renderActiveModule()}
      </ProtectedLayout>
    </AuthProvider>
  );
}

export default App;