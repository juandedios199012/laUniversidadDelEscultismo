import { useState, useEffect } from 'react';
import { Award, TrendingUp, Star, AlertCircle, Calendar, ChevronRight, Trophy, Medal } from 'lucide-react';
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

interface RankingPatrulla {
  patrulla_id: string;
  patrulla_nombre: string;
  color_patrulla: string;
  total_puntaje: number;
  actividades_participadas: number;
  posicion?: number;
}

export default function PuntajesScreen() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [programaSeleccionado, setProgramaSeleccionado] = useState<string>('');
  const [actividadSeleccionada, setActividadSeleccionada] = useState<string>('');
  const [patrullas, setPatrullas] = useState<Patrulla[]>([]);
  const [puntajes, setPuntajes] = useState<Record<string, number>>({});
  const [ranking, setRanking] = useState<RankingPatrulla[]>([]);
  const [mostrarRanking, setMostrarRanking] = useState(false);
  const [rankingExpandido, setRankingExpandido] = useState(false); // Controla expansión de tabla
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
    
    // Cargar ranking del programa seleccionado
    cargarRankingPrograma(programaId);
  };

  const cargarRankingPrograma = async (programaId: string) => {
    console.log('🏆 Cargando ranking para programa:', programaId);
    try {
      const rankingData = await ProgramaSemanalService.obtenerTotalesPrograma(programaId);
      console.log('📊 Ranking recibido:', rankingData?.length || 0);
      
      // Asignar posiciones y ordenar por puntaje descendente
      const rankingConPosiciones = (rankingData || [])
        .sort((a, b) => b.total_puntaje - a.total_puntaje)
        .map((patrulla, index) => ({
          ...patrulla,
          posicion: index + 1
        }));
      
      setRanking(rankingConPosiciones);
      setMostrarRanking(rankingConPosiciones.length > 0);
    } catch (error) {
      console.error('❌ Error al cargar ranking:', error);
      setRanking([]);
      setMostrarRanking(false);
    }
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
      
      // Cargar puntajes existentes para esta actividad
      const puntajesExistentes = await ProgramaSemanalService.obtenerPuntajesActividad(actividadId);
      console.log('📋 Puntajes existentes:', puntajesExistentes?.length || 0);
      
      // Crear mapa de puntajes existentes
      const puntajesMap: Record<string, number> = {};
      puntajesExistentes.forEach(p => {
        puntajesMap[p.patrulla_id] = p.puntaje;
      });
      
      const patrullasFormateadas = (patrullasData || []).map(p => ({
        id: p.id,
        nombre: p.nombre,
        puntaje_actual: 0
      }));
      
      setPatrullas(patrullasFormateadas);
      setPuntajes(puntajesMap); // Establecer puntajes existentes
      setPaso(3);
      
      console.log('✅ Puntajes cargados:', puntajesMap);
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
    setRanking([]);
    setMostrarRanking(false);
    setRankingExpandido(false); // Reset expansión
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
        
        // Recargar el ranking actualizado
        if (programaSeleccionado) {
          await cargarRankingPrograma(programaSeleccionado);
        }
        
        // NO limpiar puntajes - mantener los valores guardados para que el usuario vea lo que guardó
        // Los inputs mostrarán los valores guardados (con borde verde)
        
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

                {/* Estado vacío de ranking */}
                {!mostrarRanking && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center border-2 border-dashed border-purple-300">
                    <Trophy className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                    <p className="text-purple-900 font-semibold mb-1">Sin ranking disponible</p>
                    <p className="text-sm text-purple-600">
                      Asigna puntajes a las actividades para ver el ranking
                    </p>
                  </div>
                )}

                {/* RANKING DE PATRULLAS */}
                {mostrarRanking && ranking.length > 0 && (
                  <div className="space-y-3">
                    {/* KPIs del Ranking - SIEMPRE VISIBLES Y COMPACTOS */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-2 text-white shadow-sm">
                        <Trophy className="w-4 h-4 mb-0.5 mx-auto" />
                        <div className="text-center">
                          <div className="text-lg font-bold leading-tight">{ranking[0]?.total_puntaje || 0}</div>
                          <div className="text-[10px] opacity-90">1° Lugar</div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg p-2 text-white shadow-sm">
                        <Medal className="w-4 h-4 mb-0.5 mx-auto" />
                        <div className="text-center">
                          <div className="text-lg font-bold leading-tight">{ranking[1]?.total_puntaje || 0}</div>
                          <div className="text-[10px] opacity-90">2° Lugar</div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg p-2 text-white shadow-sm">
                        <Medal className="w-4 h-4 mb-0.5 mx-auto" />
                        <div className="text-center">
                          <div className="text-lg font-bold leading-tight">{ranking[2]?.total_puntaje || 0}</div>
                          <div className="text-[10px] opacity-90">3° Lugar</div>
                        </div>
                      </div>
                    </div>

                    {/* Botón para expandir/colapsar ranking completo */}
                    <button
                      onClick={() => setRankingExpandido(!rankingExpandido)}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 rounded-lg font-medium text-sm shadow-md active:scale-98 transition-all flex items-center justify-center space-x-2"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>{rankingExpandido ? 'Ocultar' : 'Ver'} Ranking Completo</span>
                      <span className="text-lg">{rankingExpandido ? '▲' : '▼'}</span>
                    </button>

                    {/* Tabla de Ranking - COLAPSABLE */}
                    {rankingExpandido && (
                      <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-slideDown">
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 text-white">
                        <h3 className="font-bold flex items-center">
                          <Trophy className="w-5 h-5 mr-2" />
                          Ranking de Patrullas
                        </h3>
                      </div>
                      
                      <div className="divide-y">
                        {ranking.map((patrulla, index) => {
                          const isTop3 = index < 3;
                          const medallColors = [
                            'bg-yellow-100 text-yellow-800 border-yellow-300',
                            'bg-gray-100 text-gray-700 border-gray-300',
                            'bg-orange-100 text-orange-700 border-orange-300'
                          ];
                          
                          return (
                            <div
                              key={patrulla.patrulla_id}
                              className={`flex items-center p-4 transition-all ${
                                isTop3 ? 'bg-gradient-to-r from-gray-50 to-white' : 'hover:bg-gray-50'
                              }`}
                            >
                              {/* Posición */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-3 ${
                                isTop3 
                                  ? `border-2 ${medallColors[index]}` 
                                  : 'bg-gray-200 text-gray-600'
                              }`}>
                                {index + 1}
                              </div>
                              
                              {/* Info Patrulla */}
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800 flex items-center">
                                  {patrulla.patrulla_nombre}
                                  {index === 0 && <Trophy className="w-4 h-4 text-yellow-500 ml-2" />}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {patrulla.actividades_participadas} actividad{patrulla.actividades_participadas !== 1 ? 'es' : ''}
                                </div>
                              </div>
                              
                              {/* Puntaje */}
                              <div className={`text-right ${
                                isTop3 ? 'text-purple-600 font-bold' : 'text-gray-700 font-semibold'
                              }`}>
                                <div className="text-2xl">{patrulla.total_puntaje}</div>
                                <div className="text-xs text-gray-500">puntos</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                )}

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

              {patrullas.map(patrulla => {
                const puntajeActual = puntajes[patrulla.id];
                const tienePuntaje = puntajeActual !== undefined && puntajeActual > 0;
                
                return (
                  <div key={patrulla.id} className={`bg-white rounded-xl p-4 shadow border-2 transition-all ${
                    tienePuntaje ? 'border-green-400 bg-green-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Star className={`w-5 h-5 ${tienePuntaje ? 'text-green-500' : 'text-yellow-500'}`} />
                        <span className="font-semibold">{patrulla.nombre}</span>
                        {tienePuntaje && (
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                            ✓ Asignado
                          </span>
                        )}
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
                        value={puntajeActual || ''}
                        onChange={(e) => handlePuntajeChange(patrulla.id, e.target.value)}
                        placeholder="Puntos"
                        className={`flex-1 p-3 border-2 rounded-lg text-lg text-center font-semibold transition-all ${
                          tienePuntaje 
                            ? 'border-green-400 bg-white text-green-700' 
                            : 'border-gray-300 text-gray-700'
                        }`}
                      />
                      <span className="text-gray-500">pts</span>
                    </div>
                  </div>
                );
              })}

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
