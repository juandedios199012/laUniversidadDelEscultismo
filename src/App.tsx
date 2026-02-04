import React, { useState } from 'react';
import { Toaster } from 'sonner';
import Dashboard from './components/Dashboard/Dashboard';
import GrupoScout from './components/GrupoScout/GrupoScout';
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
import { FinanzasDashboard } from './components/Finanzas';
import { ActividadesExteriorDashboard } from './components/ActividadesExterior';
import Maps from './components/Maps/Maps';
import MobileApp from './components/Mobile/MobileApp';
import SeguridadDashboard from './components/Seguridad/SeguridadDashboard';
import { ProgresionPage, AdminObjetivosPage } from './components/Progresion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PermissionsProvider } from './contexts/PermissionsContext';
import ProtectedLayout from './components/Layout/ProtectedLayout';
import LoginScreen from './components/Auth/LoginScreen';
import { useMobileDetect } from './hooks/useMobileDetect';

// Componente interno que usa el contexto de Auth
function AppContent() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const { isMobile } = useMobileDetect();
  const { user, loading } = useAuth();

  // Mostrar loading mientras verifica sesión
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar Login
  if (!user) {
    return <LoginScreen />;
  }

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveModule} />;
      case 'registro-scout':
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
      case 'seguridad':
        return <SeguridadDashboard />;
      default:
        return <Dashboard onNavigate={setActiveModule} />;
    }
  };

  // Si es pantalla mobile (<768px), renderizar interfaz mobile
  if (isMobile) {
    return <MobileApp />;
  }

  // Desktop: renderizar interfaz normal
  return (
    <ProtectedLayout activeModule={activeModule} onTabChange={setActiveModule}>
      {renderActiveModule()}
    </ProtectedLayout>
  );
}

function App() {
  console.log('📱 App renderizando...');

  return (
    <AuthProvider>
      <PermissionsProvider>
        <Toaster richColors position="top-right" />
        <AppContent />
      </PermissionsProvider>
    </AuthProvider>
  );
}

export default App;