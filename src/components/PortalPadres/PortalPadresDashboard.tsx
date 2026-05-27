import React, { useState } from 'react';
import { Heart, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useMisHijos } from './hooks/useMisHijos';
import { HijoInfo } from '../../services/portalPadresService';
import MisHijosGrid from './MisHijosGrid';
import DetalleHijo from './DetalleHijo';

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────

const PortalPadresDashboard: React.FC = () => {
  const { puedeAcceder } = usePermissions();
  const { hijos, loading, error, refetch } = useMisHijos();
  const [hijoSeleccionado, setHijoSeleccionado] = useState<HijoInfo | null>(null);

  // ── Guardia de acceso ──────────────────────────────────────
  if (!puedeAcceder('portal_padres')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">Acceso Restringido</h3>
        <p className="text-gray-500 text-sm max-w-sm">
          No tienes permiso para ver el Portal de Padres. Contacta al administrador del sistema.
        </p>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader />
        <div className="mt-8 flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-1">Error al cargar los datos</h3>
          <p className="text-gray-500 text-sm mb-4 max-w-sm">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Sin hijos vinculados ───────────────────────────────────
  if (hijos.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader />
        <div className="mt-8 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-blue-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No hay scouts vinculados</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Tu cuenta aún no tiene scouts asociados. Comunícate con los dirigentes del grupo
            para que vinculen a tu hijo/a.
          </p>
        </div>
      </div>
    );
  }

  // ── Vista de detalle ───────────────────────────────────────
  const hijoAMostrar = hijoSeleccionado ?? (hijos.length === 1 ? hijos[0] : null);

  if (hijoAMostrar) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader count={hijos.length} />
        <div className="mt-8">
          <DetalleHijo
            hijo={hijoAMostrar}
            onVolver={hijos.length > 1 ? () => setHijoSeleccionado(null) : undefined}
          />
        </div>
      </div>
    );
  }

  // ── Grid de hijos (múltiples) ──────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader count={hijos.length} />
      <div className="mt-8">
        <MisHijosGrid hijos={hijos} onSeleccionar={setHijoSeleccionado} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Sub-componente header de página
// ─────────────────────────────────────────────────────────────

const PageHeader: React.FC<{ count?: number }> = ({ count }) => (
  <div className="flex items-start justify-between">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
        <Heart className="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 className="text-2xl font-black text-gray-800">Portal de Padres</h1>
        <p className="text-sm text-gray-500">
          {count !== undefined
            ? `${count} scout${count !== 1 ? 's' : ''} vinculado${count !== 1 ? 's' : ''}`
            : 'Información de tus scouts'}
        </p>
      </div>
    </div>
  </div>
);

export default PortalPadresDashboard;
