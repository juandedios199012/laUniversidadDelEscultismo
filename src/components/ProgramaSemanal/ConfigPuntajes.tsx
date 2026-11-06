import { useEffect, useState } from 'react';
import { Settings, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import ProgramaSemanalService from '../../services/programaSemanalService';
import {
  CONFIG_PUNTAJES_DEFAULT, calcularPuntajeAsistencia, escalaPuestos, formatPuntos,
  type ConfigPuntajesRama,
} from '../../utils/puntajes';

// Mismo catálogo que el resto de Programa Semanal
const RAMAS_VALIDAS = ['Manada', 'Tropa', 'Comunidad', 'Clan'];

interface ConfigPuntajesProps {
  /** Rama fija del dirigente (null = admin, ve todas) */
  ramaFija: string | null;
  onClose: () => void;
}

/**
 * Configuración de puntajes por rama:
 * - puntos: máximo por asistencia perfecta y puntaje del 1er puesto
 * - % tardanza: cuánto vale un miembro que llega tarde
 * La lógica vive en la BD (database/171_puntaje_asistencia_y_puestos.sql).
 */
export default function ConfigPuntajes({ ramaFija, onClose }: ConfigPuntajesProps) {
  const [configs, setConfigs] = useState<ConfigPuntajesRama[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      const existentes = await ProgramaSemanalService.obtenerConfigPuntajesTodas();
      const ramas = ramaFija ? [ramaFija] : RAMAS_VALIDAS;
      setConfigs(ramas.map(rama =>
        existentes.find(c => c.rama.toLowerCase() === rama.toLowerCase())
          ?? { rama, ...CONFIG_PUNTAJES_DEFAULT }
      ));
      setLoading(false);
    })();
  }, [ramaFija]);

  const actualizar = (rama: string, campo: 'puntos' | 'porcentaje_tardanza', valor: string) => {
    setConfigs(prev => prev.map(c => c.rama === rama ? { ...c, [campo]: Number(valor) } : c));
  };

  const guardar = async (config: ConfigPuntajesRama) => {
    setError('');
    setSuccess('');
    if (!(config.puntos > 0)) {
      setError(`${config.rama}: los puntos deben ser mayores a 0`);
      return;
    }
    if (!(config.porcentaje_tardanza >= 0 && config.porcentaje_tardanza <= 100)) {
      setError(`${config.rama}: el % de tardanza debe estar entre 0 y 100`);
      return;
    }
    setGuardando(config.rama);
    const res = await ProgramaSemanalService.actualizarConfigPuntajesRama(config);
    setGuardando(null);
    if (res.success) setSuccess(`✅ Configuración de ${config.rama} guardada`);
    else setError(res.error || 'Error al guardar');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Configuración de Puntajes</h2>
              <p className="text-blue-100">Asistencia y puestos por rama</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            configs.map(config => (
              <div key={config.rama} className="border rounded-lg p-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="font-semibold text-gray-900 w-28 pb-2">{config.rama}</div>
                  <label className="text-sm text-gray-600">
                    Puntos
                    <input
                      type="number"
                      min="1"
                      value={Number.isNaN(config.puntos) ? '' : config.puntos}
                      onChange={e => actualizar(config.rama, 'puntos', e.target.value)}
                      className="block w-28 mt-1 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="text-sm text-gray-600">
                    Tardanza (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={Number.isNaN(config.porcentaje_tardanza) ? '' : config.porcentaje_tardanza}
                      onChange={e => actualizar(config.rama, 'porcentaje_tardanza', e.target.value)}
                      className="block w-28 mt-1 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <button
                    onClick={() => guardar(config)}
                    disabled={guardando === config.rama}
                    className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{guardando === config.rama ? 'Guardando...' : 'Guardar'}</span>
                  </button>
                </div>
                {config.puntos > 0 && (
                  <div className="mt-3 text-xs text-gray-500 space-y-1">
                    <div>
                      Asistencia (patrulla de 8): todos puntuales = {formatPuntos(config.puntos)} pts ·
                      6 puntuales + 2 tarde = {formatPuntos(calcularPuntajeAsistencia(config, 6, 2, 8))} pts
                    </div>
                    <div>
                      Puestos: 4 patrullas → {escalaPuestos(config.puntos, 4).join(', ')} ·
                      6 patrullas → {escalaPuestos(config.puntos, 6).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">Cómo se calcula</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Asistencia: cada miembro vale <em>puntos ÷ miembros de la patrulla</em>. Puntual = 100 %, tardanza = el % configurado, justificado y ausente = 0.</li>
              <li>Puestos: el 1° recibe los puntos y cada puesto baja 20 %, o 10 % / 5 % si hay muchas patrullas, para que el último siempre reciba puntos.</li>
              <li>Si cambias estos valores, los programas anteriores se recalculan con los valores nuevos.</li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
          <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
