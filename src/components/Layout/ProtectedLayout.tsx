import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../Layout/Header';
import Sidebar from '../Layout/Sidebar';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  activeModule: string;
  onTabChange: (tab: string) => void;
}

export default function ProtectedLayout({ children, activeModule, onTabChange }: ProtectedLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--gaming-bg))' }}>
      <Header />
      
      {/* Info del usuario - Solo si hay usuario autenticado */}
      {user && (
        <div className="bg-white border-b border-gray-200 px-6 py-2 mt-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.role === 'super_admin' ? 'Super Administrador' :
                     user.role === 'grupo_admin' ? 'Admin de Grupo' :
                     'Dirigente'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <span>Grupo Scout: </span>
              <span className="font-medium">
                {user.grupo_scout_id || 'Lima 12'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex pt-16">
        <Sidebar activeTab={activeModule} onTabChange={onTabChange} />
        <main className="flex-1 ml-64 p-6">
          <div className="animate-slide-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}