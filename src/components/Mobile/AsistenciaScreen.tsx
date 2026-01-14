import { useState, useEffect } from 'react';
import { ClipboardCheck, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { AsistenciaService } from '../../services/asistenciaService';

interface Scout {
  id: string;
  codigo_asociado: string;
  nombres: string;
  apellidos: string;
  rama_actual: string;
}

type EstadoAsistencia = 'presente' | 'ausente' | 'tardanza';

export default function AsistenciaScreen() {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [rama, setRama] = useState('');
  const [asistencias, setAsistencias] = useState<Record<string, EstadoAsistencia>>({});
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const ramas = ['Manada', 'Tropa', 'Comunidad', 'Clan'];

  useEffect(() => {
    if (rama) {
      cargarScouts();
    }
  }, [rama, fecha]); // Agregar fecha como dependencia

  const cargarScouts = async () => {
    console.log('📱 Cargando scouts para rama:', rama, 'fecha:', fecha);
    setLoading(true);
    try {
      const data = await AsistenciaService.obtenerScoutsPorRama(rama);
      console.log('📦 Scouts recibidos:', data?.length || 0, data);
      setScouts(data || []);
      
      // Cargar asistencias existentes para esta fecha y rama
      const asistenciasExistentes = await AsistenciaService.obtenerAsistenciasPorFechaYRama(fecha, rama);
      console.log('📋 Asistencias existentes:', asistenciasExistentes);
      
      // Inicializar asistencias: usar existentes si hay, o 'presente' por defecto
      const asistenciasIniciales: Record<string, EstadoAsistencia> = {};
      data?.forEach(scout => {
        // Si hay registro existente, usarlo; si no, marcar como 'presente'
        const estadoExistente = asistenciasExistentes[scout.id];
        if (estadoExistente && ['presente', 'ausente', 'tardanza'].includes(estadoExistente)) {
          asistenciasIniciales[scout.id] = estadoExistente as EstadoAsistencia;
        } else {
          asistenciasIniciales[scout.id] = 'presente';
        }
      });
      
      setAsistencias(asistenciasIniciales);
      console.log('✅ Asistencias inicializadas:', asistenciasIniciales);
    } catch (error) {
      console.error('❌ Error al cargar scouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAsistencia = (scoutId: string) => {
    const estadoActual = asistencias[scoutId] || 'presente';
    let nuevoEstado: EstadoAsistencia;
    
    if (estadoActual === 'presente') nuevoEstado = 'tardanza';
    else if (estadoActual === 'tardanza') nuevoEstado = 'ausente';
    else nuevoEstado = 'presente';
    
    setAsistencias({
      ...asistencias,
      [scoutId]: nuevoEstado
    });
  };

  const guardarAsistencias = async () => {
    if (!rama) {
      setMensaje('⚠️ Selecciona una rama');
      return;
    }

    setLoading(true);
    try {
      const registros = scouts.map(scout => ({
        scout_id: scout.id,
        fecha,
        presente: asistencias[scout.id] === 'presente',
        tardanza: asistencias[scout.id] === 'tardanza',
        rama: scout.rama_actual
      }));

      const result = await AsistenciaService.registrarAsistenciaMasiva(registros);

      if (result.success) {
        setMensaje(`✅ ${result.registros_creados} asistencias guardadas`);
        setTimeout(() => setMensaje(''), 3000);
      } else {
        setMensaje(`❌ ${result.error}`);
      }
    } catch (error) {
      setMensaje('❌ Error al guardar asistencias');
    } finally {
      setLoading(false);
    }
  };

  const presentes = Object.values(asistencias).filter(a => a === 'presente').length;
  const tardanzas = Object.values(asistencias).filter(a => a === 'tardanza').length;
  const ausentes = Object.values(asistencias).filter(a => a === 'ausente').length;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center space-x-3 mb-2">
          <ClipboardCheck className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Asistencia</h2>
        </div>
        <p className="text-green-50">Registra la asistencia de scouts</p>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`p-4 rounded-lg ${
          mensaje.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {mensaje}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📅 Fecha
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🏕️ Rama
          </label>
          <select
            value={rama}
            onChange={(e) => setRama(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-lg"
          >
            <option value="">-- Selecciona rama --</option>
            {ramas.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Estadísticas */}
      {rama && scouts.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white rounded-xl p-3 shadow text-center">
            <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-xl font-bold">{scouts.length}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow text-center">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-green-600">{presentes}</div>
            <div className="text-xs text-gray-500">Presentes</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow text-center">
            <Clock className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-yellow-600">{tardanzas}</div>
            <div className="text-xs text-gray-500">Tardanzas</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow text-center">
            <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-red-600">{ausentes}</div>
            <div className="text-xs text-gray-500">Ausentes</div>
          </div>
        </div>
      )}

      {/* Lista de Scouts */}
      {rama && loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando scouts...</p>
        </div>
      )}

      {rama && !loading && scouts.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-2">
            No hay scouts en {rama}
          </p>
          <p className="text-sm text-gray-500">
            Verifica que haya scouts activos registrados en esta rama
          </p>
        </div>
      )}

      {rama && scouts.length > 0 && !loading && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700">
            Scouts - {rama}
          </h3>

          {scouts.map(scout => {
            const estado = asistencias[scout.id] || 'presente';
            
            const estilos = {
              presente: {
                bg: 'bg-green-50 border-2 border-green-500',
                iconBg: 'bg-green-500',
                icon: CheckCircle,
                text: 'text-green-700',
                label: 'Presente'
              },
              tardanza: {
                bg: 'bg-yellow-50 border-2 border-yellow-500',
                iconBg: 'bg-yellow-500',
                icon: Clock,
                text: 'text-yellow-700',
                label: 'Tardanza'
              },
              ausente: {
                bg: 'bg-red-50 border-2 border-red-500',
                iconBg: 'bg-red-500',
                icon: XCircle,
                text: 'text-red-700',
                label: 'Ausente'
              }
            };
            
            const config = estilos[estado];
            const Icon = config.icon;
            
            return (
              <button
                key={scout.id}
                onClick={() => toggleAsistencia(scout.id)}
                className={`w-full rounded-xl p-4 shadow transition-all active:scale-95 ${config.bg}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.iconBg}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-800">
                        {scout.nombres} {scout.apellidos}
                      </div>
                      <div className="text-sm text-gray-500">
                        {scout.codigo_asociado}
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${config.text}`}>
                    {config.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Botón Guardar */}
      {rama && scouts.length > 0 && (
        <button
          onClick={guardarAsistencias}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? '⏳ Guardando...' : '💾 Guardar Asistencia'}
        </button>
      )}
    </div>
  );
}
