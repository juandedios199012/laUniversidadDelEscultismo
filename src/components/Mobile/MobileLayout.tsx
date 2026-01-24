import React from 'react';
import { Home, Users, ClipboardCheck, Award, TrendingUp } from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
  currentTab: 'scouts' | 'asistencia' | 'puntajes' | 'progresion';
  onTabChange: (tab: 'scouts' | 'asistencia' | 'puntajes' | 'progresion') => void;
}

export default function MobileLayout({ children, currentTab, onTabChange }: MobileLayoutProps) {
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
              <p className="text-xs text-blue-100">Aplicación Móvil</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center h-16">
          <TabButton
            icon={Users}
            label="Scouts"
            active={currentTab === 'scouts'}
            onClick={() => onTabChange('scouts')}
          />
          <TabButton
            icon={ClipboardCheck}
            label="Asistencia"
            active={currentTab === 'asistencia'}
            onClick={() => onTabChange('asistencia')}
          />
          <TabButton
            icon={Award}
            label="Puntajes"
            active={currentTab === 'puntajes'}
            onClick={() => onTabChange('puntajes')}
          />
          <TabButton
            icon={TrendingUp}
            label="Progresión"
            active={currentTab === 'progresion'}
            onClick={() => onTabChange('progresion')}
          />
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
