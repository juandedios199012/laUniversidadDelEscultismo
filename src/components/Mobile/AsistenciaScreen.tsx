import { useState, useEffect } from 'react';
import { ClipboardCheck, Users, CheckCircle, XCircle, Clock, Calendar, ChevronRight } from 'lucide-react';
import { AsistenciaService } from '../../services/asistenciaService';
import { ProgramaSemanalService } from '../../services/programaSemanalService';
import { formatFechaLocal } from '../../utils/dateUtils';

interface Programa {
  id: string;
  tema_central: string;
  fecha_inicio: string;
  rama: string;
}

interface Scout {
  id: string;
  codigo_asociado: string;
  nombres: string;
  apellidos: string;
  rama_actual: string;
}

type EstadoAsistencia = 'presente' | 'ausente' | 'tardanza';

export default function AsistenciaScreen() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [programaSeleccionado, setProgramaSeleccionado] = useState<string>('');
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [asistencias, setAsistencias] = useState<Record<string, EstadoAsistencia>>({});
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [paso, setPaso] = useState<1 | 2>(1); // Flujo de 2 pasos

  useEffect(() => {
    cargarProgramas();
  }, []);

  const cargarProgramas = async () => {
    console.log('📱 Cargando programas para asistencia...');
    setLoading(true);
    try {
      // Cargar programas semanales recientes (últimos 30 días)
      const fechaHace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const programasData = await ProgramaSemanalService.getProgramas({
        fecha_desde: fechaHace30Dias
      });
      
      console.log('📦 Programas recibidos:', programasData?.length || 0);
      
      const programasFormateados: Programa[] = (programasData || []).map((p: any) => ({
        id: p.id,
        tema_central: p.tema_central || 'Sin tema',
        fecha_inicio: p.fecha_inicio,
        rama: p.rama || 'N/A'
      }));
      
      console.log('📋 Programas formateados:', programasFormateados.length);
      setProgramas(programasFormateados);
    } catch (error) {
      console.error('❌ Error al cargar programas:', error);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarPrograma = async (programaId: string) => {
    console.log('📱 Programa seleccionado:', programaId);
    setProgramaSeleccionado(programaId);
    setPaso(2);
    
    // Obtener rama del programa
    const programa = programas.find(p => p.id === programaId);
    if (!programa) return;
    
    setLoading(true);
    try {
      // Cargar scouts de la rama del programa
      const data = await AsistenciaService.obtenerScoutsPorRama(programa.rama);
      console.log('📦 Scouts recibidos:', data?.length || 0);
      setScouts(data || []);
      
      // Cargar asistencias existentes para este programa
      const asistenciasExistentes = await AsistenciaService.obtenerAsistenciasPorPrograma(programaId);
      console.log('📋 Asistencias existentes:', asistenciasExistentes);
      
      // Inicializar asistencias: usar existentes si hay, o 'presente' por defecto
      const asistenciasIniciales: Record<string, EstadoAsistencia> = {};
      data?.forEach(scout => {
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
    if (!programaSeleccionado) {
      setMensaje('⚠️ Selecciona un programa');
      return;
    }

    const programa = programas.find(p => p.id === programaSeleccionado);
    if (!programa) return;

    setLoading(true);
    try {
      const registros = scouts.map(scout => ({
        scout_id: scout.id,
        programa_id: programaSeleccionado,
        fecha: programa.fecha_inicio,
        estado_asistencia: asistencias[scout.id] || 'presente'
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
        <p className="text-green-50">Registra la asistencia por programa</p>
      </div>

      {/* Indicador de Pasos */}
      <div className="flex items-center justify-center space-x-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          paso === 1 ? 'bg-green-600 text-white' : 'bg-green-200 text-green-700'
        } font-bold`}>
          1
        </div>
        <div className={`h-1 w-12 ${paso === 2 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          paso === 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
        } font-bold`}>
          2
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`p-4 rounded-lg ${
          mensaje.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {mensaje}
        </div>
      )}

      {/* PASO 1: Seleccionar Programa */}
      {paso === 1 && (
        <>
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando programas...</p>
            </div>
          )}

          {!loading && programas.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-semibold mb-2">
                No hay programas recientes
              </p>
              <p className="text-sm text-gray-500">
                Crea un programa semanal en la web primero
              </p>
            </div>
          )}

          {!loading && programas.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">
                Programas Recientes ({programas.length})
              </h3>

              {programas.map(programa => (
                <button
                  key={programa.id}
                  onClick={() => seleccionarPrograma(programa.id)}
                  className="w-full bg-white rounded-xl p-4 shadow hover:shadow-md transition-all active:scale-98 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">
                        {programa.tema_central}
                      </h4>
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <span className="flex items-center">
                          📅 {formatFechaLocal(programa.fecha_inicio)}
                        </span>
                        <span className="flex items-center">
                          🏕️ {programa.rama}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* PASO 2: Registrar Asistencias */}
      {paso === 2 && (
        <>
          {/* Información del Programa */}
          {(() => {
            const programa = programas.find(p => p.id === programaSeleccionado);
            if (!programa) return null;

            return (
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Programa seleccionado:</p>
                <p className="text-blue-900 font-semibold">{programa.tema_central}</p>
                <p className="text-sm text-blue-600 mt-1">
                  📅 {formatFechaLocal(programa.fecha_inicio)} • 🏕️ {programa.rama}
                </p>
              </div>
            );
          })()}

          {/* Botón Volver */}
          <button
            onClick={() => {
              setPaso(1);
              setProgramaSeleccionado('');
              setScouts([]);
              setAsistencias({});
            }}
            className="text-green-600 font-medium text-sm"
          >
            ← Volver a programas
          </button>

          {/* Estadísticas */}
          {scouts.length > 0 && (
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

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando scouts...</p>
            </div>
          )}

          {/* Estado vacío */}
          {!loading && scouts.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-semibold mb-2">
                No hay scouts en esta rama
              </p>
              <p className="text-sm text-gray-500">
                Verifica que haya scouts activos registrados
              </p>
            </div>
          )}

          {/* Lista de Scouts */}
          {!loading && scouts.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">
                Lista de Scouts ({scouts.length})
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
          {!loading && scouts.length > 0 && (
            <button
              onClick={guardarAsistencias}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? '⏳ Guardando...' : '💾 Guardar Asistencia'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
