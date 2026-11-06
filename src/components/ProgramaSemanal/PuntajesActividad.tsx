import { useState, useEffect } from 'react';
import { Trophy, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import ProgramaSemanalService from '../../services/programaSemanalService';
import {
  CONFIG_PUNTAJES_DEFAULT, escalaPuestos, puntajePorPuesto, puestosFaltantes,
} from '../../utils/puntajes';

interface Patrulla {
  id: string;
  nombre: string;
  color_patrulla: string;
  animal_totem: string;
}

interface PuntajePatrulla {
  patrulla_id: string;
  /** Modo manual */
  puntaje: number;
  /** Modo por puesto (undefined = sin puesto) */
  puesto?: number;
  bonificacion: number;
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
  // Por puesto (por defecto): la BD calcula los puntos con la escala de la rama
  const [modoManual, setModoManual] = useState(false);
  const [puntosRama, setPuntosRama] = useState(CONFIG_PUNTAJES_DEFAULT.puntos);

  useEffect(() => {
    cargarDatos();
  }, [actividadId, rama]);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      // Cargar patrullas activas de la rama
      const patrullasData = await ProgramaSemanalService.obtenerPatrullasPorRama(rama);
      setPatrullas(patrullasData);

      // Cargar puntajes existentes y configuración de la rama
      const [puntajesData, config] = await Promise.all([
        ProgramaSemanalService.obtenerPuntajesActividad(actividadId),
        ProgramaSemanalService.obtenerConfigPuntajesRama(rama),
      ]);
      setPuntosRama(config.puntos);
      // Puntajes antiguos cargados a mano (sin puesto) se abren en modo manual
      setModoManual(puntajesData.some(p => !p.puesto && p.puntaje > 0));
      
      // Crear mapa de puntajes
      const puntajesMap = new Map<string, PuntajePatrulla>();
      patrullasData.forEach(patrulla => {
        const puntajeExistente = puntajesData.find(p => p.patrulla_id === patrulla.id);
        puntajesMap.set(patrulla.id, {
          patrulla_id: patrulla.id,
          puntaje: puntajeExistente?.puntaje || 0,
          puesto: puntajeExistente?.puesto || undefined,
          bonificacion: puntajeExistente?.bonificacion || 0,
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

  const actualizarPuntaje = (
    patrullaId: string,
    campo: 'puntaje' | 'puesto' | 'bonificacion' | 'observaciones',
    valor: string
  ) => {
    setPuntajes(prev => {
      const newMap = new Map(prev);
      const puntajeActual = newMap.get(patrullaId) || {
        patrulla_id: patrullaId,
        puntaje: 0,
        bonificacion: 0,
        observaciones: ''
      };

      let nuevoValor: string | number | undefined = valor;
      if (campo === 'puesto') nuevoValor = parseInt(valor) || undefined;
      else if (campo !== 'observaciones') nuevoValor = parseInt(valor) || 0;

      newMap.set(patrullaId, { ...puntajeActual, [campo]: nuevoValor });
      return newMap;
    });
  };

  // La escala se arma con las patrullas que tienen puesto (igual que la BD)
  const conPuesto = Array.from(puntajes.values()).filter(p => p.puesto);
  const faltantes = puestosFaltantes(conPuesto.map(p => p.puesto!));
  const totalPatrulla = (p?: PuntajePatrulla) => {
    if (!p) return 0;
    if (modoManual) return p.puntaje;
    return p.puesto ? puntajePorPuesto(puntosRama, conPuesto.length, p.puesto) + p.bonificacion : 0;
  };

  const guardarPuntajes = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let puntajesArray;
      if (modoManual) {
        puntajesArray = Array.from(puntajes.values())
          .filter(p => p.puntaje > 0 || p.observaciones.trim())
          .map(p => ({ patrulla_id: p.patrulla_id, puntaje: p.puntaje, observaciones: p.observaciones }));
      } else {
        if (faltantes.length > 0) {
          setError(`Falta asignar el ${faltantes.join('°, ')}° puesto: después de un empate sigue el puesto siguiente (1°, 1°, 2°)`);
          return;
        }
        puntajesArray = conPuesto.map(p => ({
          patrulla_id: p.patrulla_id,
          puesto: p.puesto,
          bonificacion: p.bonificacion,
          observaciones: p.observaciones
        }));
      }

      const resultado = await ProgramaSemanalService.registrarPuntajesMasivo({
        actividad_id: actividadId,
        puntajes: puntajesArray,
        registrado_por: 'Sistema', // TODO: Obtener usuario actual
        // Las patrullas sin puesto/puntaje se quitan de la actividad
        reemplazar: true
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
    return Array.from(puntajes.values()).reduce((sum, p) => sum + totalPatrulla(p), 0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white p-6">
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
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex bg-gray-100 rounded-lg p-1 text-sm font-medium">
                  <button
                    onClick={() => setModoManual(false)}
                    className={`px-4 py-1.5 rounded-md ${!modoManual ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500'}`}
                  >
                    Por puesto
                  </button>
                  <button
                    onClick={() => setModoManual(true)}
                    className={`px-4 py-1.5 rounded-md ${modoManual ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500'}`}
                  >
                    Manual
                  </button>
                </div>
                {!modoManual && conPuesto.length > 0 && (
                  <span className="text-sm text-gray-500">
                    Escala ({conPuesto.length} patrullas): {escalaPuestos(puntosRama, conPuesto.length).join(', ')}
                  </span>
                )}
              </div>
              {!modoManual && faltantes.length > 0 && (
                <p className="text-sm text-red-600">
                  Falta el {faltantes.join('°, ')}° puesto: después de un empate sigue el puesto siguiente (1°, 1°, 2°).
                </p>
              )}

              {/* Tabla de puntajes */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patrulla
                      </th>
                      {modoManual ? (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Puntaje
                        </th>
                      ) : (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Puesto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                            Extra
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                            Pts
                          </th>
                        </>
                      )}
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
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs"
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
                          {modoManual ? (
                            <td className="px-6 py-4">
                              <input
                                type="number"
                                min="0"
                                value={puntaje?.puntaje || 0}
                                onChange={(e) => actualizarPuntaje(patrulla.id, 'puntaje', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-semibold"
                              />
                            </td>
                          ) : (
                            <>
                              <td className="px-4 py-4">
                                <select
                                  value={puntaje?.puesto ?? ''}
                                  onChange={(e) => actualizarPuntaje(patrulla.id, 'puesto', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
                                >
                                  <option value="">—</option>
                                  {patrullas.map((_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}° puesto</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-4">
                                <input
                                  type="number"
                                  value={puntaje?.bonificacion || ''}
                                  onChange={(e) => actualizarPuntaje(patrulla.id, 'bonificacion', e.target.value)}
                                  disabled={!puntaje?.puesto}
                                  placeholder="0"
                                  title="Puntos adicionales (o negativos)"
                                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-center disabled:bg-gray-100"
                                />
                              </td>
                              <td className="px-4 py-4 text-center text-lg font-bold text-blue-700">
                                {puntaje?.puesto ? totalPatrulla(puntaje) : '—'}
                              </td>
                            </>
                          )}
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
                      {!modoManual && <td colSpan={2}></td>}
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
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Consejos para asignar puntajes:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li><strong>Por puesto:</strong> elige el puesto de cada patrulla y los puntos salen de la escala de la rama. En un empate usa el mismo puesto para ambas.</li>
                      <li><strong>Extra:</strong> puntos adicionales (o negativos) sobre el puesto.</li>
                      <li><strong>Manual:</strong> escribe el puntaje directamente, para actividades que no se juegan por puestos.</li>
                      <li>Los puntos de asistencia se suman solos al ranking.</li>
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
