import React from 'react';
import { Shield, Users, MapPin } from 'lucide-react';
import { useGrupoScout } from '../../contexts/GrupoScoutContext';

// ================================================================
// COMPONENTE: Header con información del grupo scout
// ================================================================

const GrupoScoutHeader: React.FC = () => {
  const { grupoActivo, userRole, loading } = useGrupoScout();

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-white/20 rounded w-48 mb-1 animate-pulse"></div>
            <div className="h-3 bg-white/20 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!grupoActivo) {
    return (
      <div className="bg-yellow-600 text-white p-3">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6" />
          <div>
            <div className="font-medium">Sin grupo asignado</div>
            <div className="text-sm opacity-90">Contacta al administrador</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Información del grupo */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">{grupoActivo.nombre}</h1>
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                  Numeral {grupoActivo.numeral}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{grupoActivo.localidad}, {grupoActivo.region}</span>
                </div>
                
                {userRole && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className="capitalize">{userRole}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="text-right">
              <div className="font-medium">Código de Grupo</div>
              <div className="opacity-90">{grupoActivo.codigo_grupo}</div>
            </div>
            
            <div className="w-px h-10 bg-white/20"></div>
            
            <div className="text-center">
              <div className="text-xs opacity-75">Sistema Multi-Grupo</div>
              <div className="text-xs">🏕️ Scout Manager</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrupoScoutHeader;