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

      {/* Espaciador que empuja el contenido por debajo del Header fijo */}
      <div className="pt-16">
  

        <div className="flex">
          <Sidebar activeTab={activeModule} onTabChange={onTabChange} />
          <main className="flex-1 ml-64 p-6">
            <div className="animate-slide-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}