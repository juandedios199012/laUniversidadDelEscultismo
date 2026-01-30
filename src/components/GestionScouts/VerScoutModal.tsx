import React, { useState, useEffect } from 'react';
import ScoutService from '../../services/scoutService';
import type { Scout, FamiliarScout } from '../../lib/supabase';

interface VerScoutModalProps {
  scout: Scout | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VerScoutModal: React.FC<VerScoutModalProps> = ({
  scout,
  isOpen,
  onClose
}) => {
  const [familiares, setFamiliares] = useState<FamiliarScout[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('datos');

  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    return edad;
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Cargar familiares cuando se abre el modal
  useEffect(() => {
    if (scout && isOpen) {
      console.log('🔍 Cargando familiares para scout:', scout);
      
      // Si el scout ya tiene familiares (viene de api_obtener_scout), usarlos
      if (scout.familiares && Array.isArray(scout.familiares)) {
        console.log('✅ Usando familiares del scout completo:', scout.familiares);
        setFamiliares(scout.familiares);
      } else {
        // Fallback: cargar familiares por separado
        console.log('⚠️ Scout sin familiares, cargando por separado...');
        cargarFamiliares();
      }
    }
  }, [scout, isOpen]);

  const cargarFamiliares = async () => {
    if (!scout) return;
    
    try {
      setLoading(true);
      const data = await ScoutService.getFamiliaresByScout(scout.id);
      setFamiliares(data || []);
    } catch (error) {
      console.error('Error al cargar familiares:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scout && isOpen) {
      cargarFamiliares();
    }
  }, [scout, isOpen]);

  if (!isOpen || !scout) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              👁️ Perfil de Scout: {scout.nombres} {scout.apellidos}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex px-6">
            <button
              onClick={() => setActiveTab('datos')}
              className={`py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'datos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              👤 Datos Personales
            </button>
            <button
              onClick={() => setActiveTab('familiares')}
              className={`py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'familiares'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              👨‍👩‍👧‍👦 Familiares ({familiares.length})
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'historial'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Historial
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Datos Personales */}
          {activeTab === 'datos' && (
            <div className="space-y-6">
              {/* Header del Scout */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-20 w-20">
                    <div className="h-20 w-20 rounded-full bg-blue-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-800">
                        {scout.nombres.charAt(0)}{scout.apellidos.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {scout.nombres} {scout.apellidos}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        scout.rama_actual === 'Manada' ? 'bg-yellow-100 text-yellow-800' :
                        scout.rama_actual === 'Tropa' ? 'bg-green-100 text-green-800' :
                        scout.rama_actual === 'Comunidad' ? 'bg-orange-100 text-orange-800' :
                        scout.rama_actual === 'Clan' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {scout.rama_actual}
                      </span>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        scout.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' :
                        scout.estado === 'INACTIVO' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {scout.estado.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">📋 Información Básica</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Código Scout:</span>
                      <p className="font-medium">{scout.codigo_scout}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Fecha de Nacimiento:</span>
                      <p className="font-medium">{formatearFecha(scout.fecha_nacimiento)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Edad:</span>
                      <p className="font-medium">{calcularEdad(scout.fecha_nacimiento)} años</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Sexo:</span>
                      <p className="font-medium">{scout.sexo}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">📄 Documentación</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Tipo de Documento:</span>
                      <p className="font-medium">{scout.tipo_documento}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Número:</span>
                      <p className="font-medium">{scout.numero_documento}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Fecha de Ingreso:</span>
                      <p className="font-medium">{formatearFecha(scout.fecha_ingreso)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">📞 Contacto</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Celular:</span>
                      <p className="font-medium">{scout.celular || 'No registrado'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Correo:</span>
                      <p className="font-medium break-all">{scout.correo || 'No registrado'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">📍 Ubicación</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Departamento:</span>
                    <p className="font-medium">{scout.departamento || 'No registrado'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Provincia:</span>
                    <p className="font-medium">{scout.provincia || 'No registrado'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Distrito:</span>
                    <p className="font-medium">{scout.distrito || 'No registrado'}</p>
                  </div>
                  <div className="md:col-span-3">
                    <span className="text-sm text-gray-500">Dirección:</span>
                    <p className="font-medium">{scout.direccion || 'No registrada'}</p>
                  </div>
                </div>
              </div>

              {/* Datos adicionales */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">🎓 Datos Adicionales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Centro de Estudio:</span>
                    <p className="font-medium">{scout.centro_estudio || 'No registrado'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Ocupación:</span>
                    <p className="font-medium">{scout.ocupacion || 'No registrada'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-sm text-gray-500">Centro Laboral:</span>
                    <p className="font-medium">{scout.centro_laboral || 'No registrado'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Familiares */}
          {activeTab === 'familiares' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900">👨‍👩‍👧‍👦 Familiares Registrados</h4>
                {loading && <span className="text-sm text-gray-500">Cargando...</span>}
              </div>

              {familiares.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay familiares registrados</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {familiares.map((familiar) => (
                    <div key={familiar.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">
                            {familiar.nombres} {familiar.apellidos}
                          </h5>
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                            {familiar.parentesco}
                          </span>
                        </div>
                        {familiar.es_contacto_emergencia && (
                          <span className="text-red-500 text-sm">🚨</span>
                        )}
                      </div>
                      <div className="mt-3 space-y-1">
                        {familiar.celular && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="w-16">Celular:</span>
                            <span>{familiar.celular}</span>
                          </div>
                        )}
                        {familiar.correo && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="w-16">Email:</span>
                            <span className="break-all">{familiar.correo}</span>
                          </div>
                        )}
                        {familiar.ocupacion && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="w-16">Trabajo:</span>
                            <span>{familiar.ocupacion}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Historial */}
          {activeTab === 'historial' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">📊 Historial del Scout</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  🚧 Esta sección estará disponible próximamente con el historial de actividades, logros y cambios de rama.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              Creado: {formatearFecha(scout.created_at)}
              {scout.updated_at !== scout.created_at && (
                <span className="ml-3">
                  Última actualización: {formatearFecha(scout.updated_at)}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerScoutModal;