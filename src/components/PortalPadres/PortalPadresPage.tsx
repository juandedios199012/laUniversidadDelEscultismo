import React, { useState } from 'react';
import { Eye, Heart } from 'lucide-react';
import { usePermissions } from '../../contexts/PermissionsContext';
import PortalPadresDashboard from './PortalPadresDashboard';
import V4PortalPadresTab from '../ProgresionV4/tabs/V4PortalPadresTab';
import { useScoutsParaPortal } from './hooks/useScoutsParaPortal';

type TabId = 'mi-familia' | 'consultar-scout';

// ─────────────────────────────────────────────────────────────
// Página principal del Portal Padres
// Combina:
//   • "Mi Familia"      → vista para padres (sus propios hijos)
//   • "Consultar Scout" → vista para dirigentes (cualquier scout)
// ─────────────────────────────────────────────────────────────

const PortalPadresPage: React.FC = () => {
  const { esAdmin, esSuperAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabId>('mi-familia');

  // Solo admins y superadmins pueden consultar cualquier scout de la BD.
  // Los padres (portal_padres) solo ven sus propios hijos en "Mi Familia".
  const puedeConsultar = esAdmin || esSuperAdmin;

  // Carga diferida: solo carga scouts cuando se abre la pestaña de consulta
  const { scouts, loading } = useScoutsParaPortal(
    activeTab === 'consultar-scout' && puedeConsultar,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tabs (solo visibles si el usuario puede ver la vista de dirigente) */}
      {puedeConsultar && (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-6">
            <nav className="flex gap-1 py-1">
              <TabButton
                id="mi-familia"
                active={activeTab === 'mi-familia'}
                onClick={() => setActiveTab('mi-familia')}
                icon={<Heart className="w-4 h-4" />}
                label="Mi Familia"
              />
              <TabButton
                id="consultar-scout"
                active={activeTab === 'consultar-scout'}
                onClick={() => setActiveTab('consultar-scout')}
                icon={<Eye className="w-4 h-4" />}
                label="Consultar Scout"
              />
            </nav>
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className={puedeConsultar ? 'px-6 py-8 max-w-7xl mx-auto' : 'px-4 py-4'}>
        {activeTab === 'mi-familia' && <PortalPadresDashboard />}

        {activeTab === 'consultar-scout' && puedeConsultar && (
          <V4PortalPadresTab loading={loading} scouts={scouts} />
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Sub-componente botón de pestaña
// ─────────────────────────────────────────────────────────────

interface TabButtonProps {
  id: TabId;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg transition-all ${
      active
        ? 'bg-blue-600 text-white shadow'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default PortalPadresPage;
