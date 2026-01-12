import React, { useState, useEffect } from 'react';
import { Trophy, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import ProgramaSemanalService from '../../services/programaSemanalService';

interface Patrulla {
  id: string;
  nombre: string;
  color_patrulla: string;
  animal_totem: string;
}

interface PuntajePatrulla {
  patrulla_id: string;
  puntaje: number;
  observaciones: string;
}

interface PuntajesActividadProps {
  actividadId: string;
  actividadNombre: string;
  rama: string;
  onClose: () => void;
  onSave: () => void;
}

export default function PuntajesActividad({
  actividadId,
  actividadNombre,
  rama,
  onClose,
  onSave
}: PuntajesActividadProps) {
  const [patrullas, setPatrullas] = useState<Patrulla[]>([]);
  const [puntajes, setPuntajes] = useState<Map<string, PuntajePatrulla>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [actividadId, rama]);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      // Cargar patrullas activas de la rama
      const patrullasData = await ProgramaSemanalService.obtenerPatrullasActivas(rama);
      setPatrullas(patrullasData);

      // Cargar puntajes existentes
      const puntajesData = await ProgramaSemanalService.obtenerPuntajesActividad(actividadId);
      
      // Crear mapa de puntajes
      const puntajesMap = new Map<string, PuntajePatrulla>();
      patrullasData.forEach(patrulla => {
        const puntajeExistente = puntajesData.find(p => p.patrulla_id === patrulla.id);
        puntajesMap.set(patrulla.id, {
          patrulla_id: patrulla.id,
          puntaje: puntajeExistente?.puntaje || 0,
          observaciones: puntajeExistente?.observaciones || ''
        });
      });

      setPuntajes(puntajesMap);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos de patrullas y puntajes');
    } finally {
      setLoading(false);
    }
  };

  const actualizarPuntaje = (patrullaId: string, campo: 'puntaje' | 'observaciones', valor: any) => {
    setPuntajes(prev => {
      const newMap = new Map(prev);
      const puntajeActual = newMap.get(patrullaId) || {
        patrulla_id: patrullaId,
        puntaje: 0,
        observaciones: ''
      };
      
      newMap.set(patrullaId, {
        ...puntajeActual,
        [campo]: campo === 'puntaje' ? parseInt(valor) || 0 : valor
      });
      
      return newMap;
    });
  };

  const guardarPuntajes = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const puntajesArray = Array.from(puntajes.values());
      
      const resultado = await ProgramaSemanalService.registrarPuntajesMasivo({
        actividad_id: actividadId,
        puntajes: puntajesArray,
        registrado_por: 'Sistema' // TODO: Obtener usuario actual
      });

      if (resultado.success) {
        setSuccess(`✅ ${resultado.puntajes_registrados} puntajes guardados correctamente`);
        setTimeout(() => {
          onSave();
          onClose();
        }, 1500);
      } else {
        setError(resultado.error || 'Error al guardar puntajes');
      }
    } catch (err) {
      console.error('Error al guardar puntajes:', err);
      setError('Error al guardar puntajes');
    } finally {
      setSaving(false);
    }
  };

  const calcularTotal = () => {
    return Array.from(puntajes.values()).reduce((sum, p) => sum + p.puntaje, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Puntajes por Patrulla</h2>
                <p className="text-blue-100">{actividadNombre}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : patrullas.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay patrullas activas en esta rama</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tabla de puntajes */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patrulla
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Puntaje
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Observaciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patrullas.map((patrulla) => {
                      const puntaje = puntajes.get(patrulla.id);
                      return (
                        <tr key={patrulla.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                style={{ backgroundColor: patrulla.color_patrulla || '#6B7280' }}
                              >
                                {patrulla.nombre.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{patrulla.nombre}</div>
                                {patrulla.animal_totem && (
                                  <div className="text-sm text-gray-500">{patrulla.animal_totem}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={puntaje?.puntaje || 0}
                              onChange={(e) => actualizarPuntaje(patrulla.id, 'puntaje', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-semibold"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={puntaje?.observaciones || ''}
                              onChange={(e) => actualizarPuntaje(patrulla.id, 'observaciones', e.target.value)}
                              placeholder="Opcional..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td className="px-6 py-4 font-bold text-gray-900">TOTAL</td>
                      <td className="px-6 py-4">
                        <div className="text-center text-2xl font-bold text-blue-600">
                          {calcularTotal()}
                        </div>
                      </td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Consejos para asignar puntajes:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Asigna puntajes del 0 al 100 según el desempeño</li>
                      <li>Agrega observaciones específicas para cada patrulla</li>
                      <li>Los puntajes se actualizarán automáticamente en el ranking</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={guardarPuntajes}
            disabled={saving || patrullas.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Guardando...' : 'Guardar Puntajes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
