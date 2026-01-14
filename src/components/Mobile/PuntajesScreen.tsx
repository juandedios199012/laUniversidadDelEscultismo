import { useState, useEffect } from 'react';
import { Award, TrendingUp, Star, AlertCircle, Calendar, ChevronRight } from 'lucide-react';
import { ProgramaSemanalService } from '../../services/programaSemanalService';

interface Programa {
  id: string;
  tema_central: string;
  fecha_inicio: string;
  rama: string;
  actividades: Actividad[];
}

interface Actividad {
  id: string;
  nombre: string;
  duracion_minutos?: number;
}

interface Patrulla {
  id: string;
  nombre: string;
  puntaje_actual?: number;
}

export default function PuntajesScreen() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [programaSeleccionado, setProgramaSeleccionado] = useState<string>('');
  const [actividadSeleccionada, setActividadSeleccionada] = useState<string>('');
  const [patrullas, setPatrullas] = useState<Patrulla[]>([]);
  const [puntajes, setPuntajes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [paso, setPaso] = useState<1 | 2 | 3>(1); // Flujo de 3 pasos

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    console.log('📱 Cargando programas para puntajes...');
    setLoading(true);
    try {
      // Cargar programas semanales recientes (últimos 30 días)
      const fechaHace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const programasData = await ProgramaSemanalService.getProgramas({
        fecha_desde: fechaHace30Dias
      });
      
      console.log('📦 Programas recibidos:', programasData?.length || 0);
      
      // Formatear programas con sus actividades
      const programasFormateados: Programa[] = (programasData || []).map((p: any) => ({
        id: p.id,
        tema_central: p.tema_central || 'Sin tema',
        fecha_inicio: p.fecha_inicio,
        rama: p.rama || 'N/A',
        actividades: (p.actividades || p.programa_actividades || []).map((act: any) => ({
          id: act.id,
          nombre: act.nombre || 'Sin nombre',
          duracion_minutos: act.duracion_minutos
        }))
      })).filter(p => p.actividades.length > 0); // Solo programas con actividades
      
      console.log('📋 Programas con actividades:', programasFormateados.length);
      setProgramas(programasFormateados);
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarPrograma = (programaId: string) => {
    setProgramaSeleccionado(programaId);
    setActividadSeleccionada('');
    setPatrullas([]);
    setPuntajes({});
    setPaso(2);
  };

  const seleccionarActividad = async (actividadId: string) => {
    setActividadSeleccionada(actividadId);
    
    // Encontrar el programa y la rama
    const programa = programas.find(p => p.id === programaSeleccionado);
    if (!programa) return;

    console.log('🔍 Cargando patrullas para rama:', programa.rama);
    setLoading(true);
    try {
      const patrullasData = await ProgramaSemanalService.obtenerPatrullasPorRama(programa.rama);
      console.log('📦 Patrullas recibidas:', patrullasData?.length || 0);
      
      const patrullasFormateadas = (patrullasData || []).map(p => ({
        id: p.id,
        nombre: p.nombre,
        puntaje_actual: 0
      }));
      
      setPatrullas(patrullasFormateadas);
      setPaso(3);
    } catch (error) {
      console.error('❌ Error al cargar patrullas:', error);
      setPatrullas([]);
    } finally {
      setLoading(false);
    }
  };

  const volverAProgramas = () => {
    setPaso(1);
    setProgramaSeleccionado('');
    setActividadSeleccionada('');
    setPatrullas([]);
    setPuntajes({});
  };

  const volverAActividades = () => {
    setPaso(2);
    setActividadSeleccionada('');
    setPatrullas([]);
    setPuntajes({});
  };

  const handlePuntajeChange = (patrullaId: string, valor: string) => {
    const valorNum = parseInt(valor) || 0;
    setPuntajes({ ...puntajes, [patrullaId]: valorNum });
  };

  const guardarPuntajes = async () => {
    if (!actividadSeleccionada) {
      setMensaje('⚠️ Selecciona una actividad');
      return;
    }

    const puntajesArray = Object.entries(puntajes)
      .filter(([_, puntaje]) => puntaje > 0)
      .map(([patrullaId, puntaje]) => ({
        patrulla_id: patrullaId,
        puntaje,
        observaciones: ''
      }));

    if (puntajesArray.length === 0) {
      setMensaje('⚠️ Ingresa al menos un puntaje');
      return;
    }

    setLoading(true);
    try {
      const result = await ProgramaSemanalService.registrarPuntajesMasivo({
        actividad_id: actividadSeleccionada,
        puntajes: puntajesArray
      });

      if (result.success) {
        setMensaje(`✅ ${result.puntajes_registrados} puntajes guardados`);
        setPuntajes({});
        setTimeout(() => setMensaje(''), 3000);
      } else {
        setMensaje(`❌ ${result.error}`);
      }
    } catch (error) {
      setMensaje('❌ Error al guardar puntajes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <Award className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Puntajes</h2>
          </div>
          <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
            Paso {paso}/3
          </div>
        </div>
        <p className="text-yellow-50">
          {paso === 1 && 'Selecciona un programa semanal'}
          {paso === 2 && 'Selecciona una actividad'}
          {paso === 3 && 'Asigna puntos a las patrullas'}
        </p>
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando programas...</p>
            </div>
          )}

          {!loading && programas.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-semibold mb-2">No hay programas disponibles</p>
              <p className="text-sm text-gray-500">
                Crea programas semanales desde el sistema web primero
              </p>
            </div>
          )}

          {!loading && programas.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Programas Semanales ({programas.length})
              </h3>

              {programas.map(programa => (
                <button
                  key={programa.id}
                  onClick={() => seleccionarPrograma(programa.id)}
                  className="w-full bg-white rounded-xl p-4 shadow hover:shadow-md transition-all active:scale-98 text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">
                      {programa.tema_central}
                    </h4>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      📅 {new Date(programa.fecha_inicio).toLocaleDateString('es-PE', { 
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        programa.rama === 'Manada' ? 'bg-yellow-100 text-yellow-800' :
                        programa.rama === 'Tropa' ? 'bg-green-100 text-green-800' :
                        programa.rama === 'Comunidad' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {programa.rama}
                      </span>
                      <span className="text-gray-500">
                        {programa.actividades.length} actividad{programa.actividades.length !== 1 ? 'es' : ''}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* PASO 2: Seleccionar Actividad */}
      {paso === 2 && (
        <>
          <button
            onClick={volverAProgramas}
            className="text-blue-600 font-medium flex items-center space-x-1"
          >
            <span>←</span>
            <span>Volver a programas</span>
          </button>

          {(() => {
            const programa = programas.find(p => p.id === programaSeleccionado);
            if (!programa) return null;

            return (
              <>
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Programa seleccionado:</p>
                  <p className="text-blue-900 font-semibold">{programa.tema_central}</p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">
                    Actividades ({programa.actividades.length})
                  </h3>

                  {programa.actividades.map(actividad => (
                    <button
                      key={actividad.id}
                      onClick={() => seleccionarActividad(actividad.id)}
                      className="w-full bg-white rounded-xl p-4 shadow hover:shadow-md transition-all active:scale-98 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {actividad.nombre}
                          </h4>
                          {actividad.duracion_minutos && (
                            <p className="text-sm text-gray-500 mt-1">
                              ⏱️ {actividad.duracion_minutos} minutos
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            );
          })()}
        </>
      )}

      {/* PASO 3: Asignar Puntajes */}
      {paso === 3 && (
        <>
          <button
            onClick={volverAActividades}
            className="text-blue-600 font-medium flex items-center space-x-1"
          >
            <span>←</span>
            <span>Volver a actividades</span>
          </button>

          {(() => {
            const programa = programas.find(p => p.id === programaSeleccionado);
            const actividad = programa?.actividades.find(a => a.id === actividadSeleccionada);
            if (!actividad) return null;

            return (
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Actividad seleccionada:</p>
                <p className="text-blue-900 font-semibold">{actividad.nombre}</p>
              </div>
            );
          })()}

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando patrullas...</p>
            </div>
          )}

          {!loading && patrullas.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <p className="text-gray-700 font-semibold mb-2">No hay patrullas disponibles</p>
              <p className="text-sm text-gray-500">
                Crea patrullas desde el sistema web primero
              </p>
            </div>
          )}

          {!loading && patrullas.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Asignar Puntajes
              </h3>

              {patrullas.map(patrulla => (
                <div key={patrulla.id} className="bg-white rounded-xl p-4 shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold">{patrulla.nombre}</span>
                    </div>
                    {patrulla.puntaje_actual !== undefined && (
                      <span className="text-sm text-gray-500">
                        Total: {patrulla.puntaje_actual} pts
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={puntajes[patrulla.id] || ''}
                      onChange={(e) => handlePuntajeChange(patrulla.id, e.target.value)}
                      placeholder="Puntos"
                      className="flex-1 p-3 border border-gray-300 rounded-lg text-lg text-center"
                    />
                    <span className="text-gray-500">pts</span>
                  </div>
                </div>
              ))}

              <button
                onClick={guardarPuntajes}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 mt-4"
              >
                {loading ? '⏳ Guardando...' : '💾 Guardar Puntajes'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
