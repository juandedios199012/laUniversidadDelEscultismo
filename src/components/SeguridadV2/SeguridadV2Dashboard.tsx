import { useState } from 'react';
import { Shield, Grid3X3, Layers, ShieldCheck } from 'lucide-react';
import { usePermissions, AccesoDenegado } from '../../contexts/PermissionsContext';
import PermissionMatrix from './tabs/PermissionMatrix';
import FeatureRegistration from './tabs/FeatureRegistration';

// ================================================================
// TIPOS LOCALES
// ================================================================

type TabId = 'matriz' | 'registro';

interface Tab {
  id: TabId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

export default function SeguridadV2Dashboard() {
  const { esSuperAdmin, esAdmin, puedeAcceder } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabId>('matriz');

  // Solo super_admin y admins con permiso de seguridad pueden acceder
  if (!esSuperAdmin && !esAdmin && !puedeAcceder('seguridad')) {
    return <AccesoDenegado modulo="Seguridad V2" />;
  }

  const tabs: Tab[] = [
    {
      id: 'matriz',
      label: 'Matriz de Permisos',
      description: 'Asignar/revocar permisos por rol',
      icon: Grid3X3,
    },
    {
      id: 'registro',
      label: 'Registro de Funcionalidades',
      description: 'Diccionario de módulos y permisos',
      icon: Layers,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Seguridad V2</h1>
            <p className="text-sm text-gray-500">
              Sistema de permisos fine-grained por módulo · Formato{' '}
              <code className="text-xs bg-gray-100 px-1 rounded font-mono">
                modulo:accion[:objeto]
              </code>
            </p>
          </div>

          {esSuperAdmin && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-full font-medium">
              <Shield className="w-3.5 h-3.5" />
              super_admin
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 -mb-px" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all
                    border-b-2 whitespace-nowrap
                    ${isActive
                      ? 'border-violet-600 text-violet-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-transparent">
          {activeTab === 'matriz' && <PermissionMatrix />}
          {activeTab === 'registro' && <FeatureRegistration />}
        </div>
      </div>
    </div>
  );
}
