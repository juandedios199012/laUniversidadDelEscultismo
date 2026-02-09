import React from 'react';
import { Home, Users, ClipboardCheck, Award, TrendingUp, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';

interface MobileLayoutProps {
  children: React.ReactNode;
  currentTab: 'scouts' | 'asistencia' | 'puntajes' | 'progresion';
  onTabChange: (tab: 'scouts' | 'asistencia' | 'puntajes' | 'progresion') => void;
}

export default function MobileLayout({ children, currentTab, onTabChange }: MobileLayoutProps) {
  const { user, signOut } = useAuth();
  const { puedeAcceder, rolPrincipal, loading: loadingPermisos } = usePermissions();

  const handleLogout = async () => {
    if (confirm('¿Cerrar sesión?')) {
      await signOut();
    }
  };

  // Determinar qué tabs puede ver el usuario
  const tabs = [
    { id: 'scouts' as const, icon: Users, label: 'Scouts', modulo: 'scouts' as const },
    { id: 'asistencia' as const, icon: ClipboardCheck, label: 'Asistencia', modulo: 'asistencia' as const },
    { id: 'puntajes' as const, icon: Award, label: 'Puntajes', modulo: 'programa_semanal' as const },
    { id: 'progresion' as const, icon: TrendingUp, label: 'Progresión', modulo: 'progresion' as const },
  ];

  // Filtrar tabs según permisos (si está cargando, mostrar todos)
  const tabsVisibles = loadingPermisos 
    ? tabs 
    : tabs.filter(tab => puedeAcceder(tab.modulo));

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              🏕️
            </div>
            <div>
              <h1 className="text-lg font-bold">Scout Lima 12</h1>
              <div className="flex items-center gap-1 text-xs text-blue-100">
                <Shield className="w-3 h-3" />
                <span>{rolPrincipal?.nombre_display || 'Usuario'}</span>
              </div>
            </div>
          </div>
          
          {/* Botón logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center h-16">
          {tabsVisibles.map(tab => (
            <TabButton
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              active={currentTab === tab.id}
              onClick={() => onTabChange(tab.id)}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

interface TabButtonProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ icon: Icon, label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
        active
          ? 'text-blue-600'
          : 'text-gray-500'
      }`}
    >
      <Icon className={`w-6 h-6 mb-1 ${active ? 'stroke-2' : 'stroke-1.5'}`} />
      <span className={`text-xs ${active ? 'font-semibold' : 'font-normal'}`}>
        {label}
      </span>
    </button>
  );
}
