import { useState, useEffect } from 'react';
import { 
  Calendar, Users, CheckCircle, Clock, AlertCircle, 
  Search, Filter, Download, CheckSquare, Square, MinusSquare
} from 'lucide-react';
import AsistenciaService from '../../services/asistenciaService';
import ScoutService from '../../services/scoutService';
import { supabase } from '../../lib/supabase';

// ==================== INTERFACES ====================
interface ProgramaSemanal {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  tema_central?: string;
  rama: string;
  responsable_programa?: string;
  estado: string;
}

interface Scout {
  id: string;
  nombres: string;
  apellidos: string;
  rama_actual: string;
  codigo_scout: string;
  estado: string;
}

interface AsistenciaRegistro {
  scout_id: string;
  estado: 'presente' | 'ausente' | 'tardanza' | 'justificado';
}

// ==================== COMPONENT ====================
export default function AsistenciaOptimizada() {
  // ============= ESTADOS =============
  const [programas, setProgramas] = useState<ProgramaSemanal[]>([]);
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [asistenciasRegistradas, setAsistenciasRegistradas] = useState<Map<string, string>>(new Map());
  const [programaSeleccionado, setProgramaSeleccionado] = useState<ProgramaSemanal | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  // Filtros
  const [ramaFiltro, setRamaFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  
  // Selección masiva
  const [seleccionMasiva, setSeleccionMasiva] = useState<Map<string, 'presente' | 'ausente' | 'tardanza' | 'justificado'>>(new Map());

  // ============= CONFIGURACIÓN =============
  const ramas = [
    { value: 'MANADA', label: 'Manada', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'TROPA', label: 'Tropa', color: 'bg-green-100 text-green-800' },
    { value: 'COMUNIDAD', label: 'Comunidad', color: 'bg-blue-100 text-blue-800' },
    { value: 'CLAN', label: 'Clan', color: 'bg-red-100 text-red-800' }
  ];

  const estadosAsistencia = [
    { value: 'presente', label: 'Presente', icon: CheckCircle, color: 'bg-green-500 hover:bg-green-600' },
    { value: 'ausente', label: 'Ausente', icon: AlertCircle, color: 'bg-red-500 hover:bg-red-600' },
    { value: 'tardanza', label: 'Tardanza', icon: Clock, color: 'bg-yellow-500 hover:bg-yellow-600' },
    { value: 'justificado', label: 'Justificado', icon: CheckCircle, color: 'bg-blue-500 hover:bg-blue-600' }
  ];

  // ============= EFECTOS =============
  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (programaSeleccionado) {
      cargarAsistenciasExistentes();
    }
  }, [programaSeleccionado]);

  // ============= FUNCIONES DE CARGA =============
  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar programas semanales recientes
      const { data: programasData, error: programasError } = await supabase
        .from('programa_semanal')
        .select('*')
        .order('fecha_inicio', { ascending: false })
        .limit(20);

      if (programasError) throw programasError;
      setProgramas(programasData || []);

      // Cargar scouts activos
      const scoutsData = await ScoutService.getScouts();
      setScouts(scoutsData.filter(s => s.estado === 'activo'));

    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarAsistenciasExistentes = async () => {
    if (!programaSeleccionado) return;

    try {
      const { data, error } = await supabase
        .from('asistencias')
        .select('scout_id, estado_asistencia')
        .eq('actividad_id', programaSeleccionado.id);

      if (error) throw error;

      const mapaAsistencias = new Map<string, string>();
      data?.forEach(a => {
        mapaAsistencias.set(a.scout_id, a.estado_asistencia);
      });
      setAsistenciasRegistradas(mapaAsistencias);

    } catch (error) {
      console.error('Error al cargar asistencias:', error);
    }
  };

  // ============= FUNCIONES DE SELECCIÓN =============
  const handleSeleccionScout = (scoutId: string, estado: 'presente' | 'ausente' | 'tardanza' | 'justificado') => {
    const nuevaSeleccion = new Map(seleccionMasiva);
    nuevaSeleccion.set(scoutId, estado);
    setSeleccionMasiva(nuevaSeleccion);
  };

  const handleSeleccionarTodos = (estado: 'presente' | 'ausente' | 'tardanza' | 'justificado') => {
    const nuevaSeleccion = new Map<string, typeof estado>();
    scoutsFiltrados.forEach(scout => {
      nuevaSeleccion.set(scout.id, estado);
    });
    setSeleccionMasiva(nuevaSeleccion);
  };

  const handleLimpiarSeleccion = () => {
    setSeleccionMasiva(new Map());
  };

  // ============= FUNCIÓN DE GUARDADO =============
  const handleGuardarAsistencias = async () => {
    if (!programaSeleccionado || seleccionMasiva.size === 0) {
      alert('⚠️ Selecciona al menos un scout');
      return;
    }

    try {
      setGuardando(true);

      const registros = Array.from(seleccionMasiva.entries()).map(([scout_id, estado]) => ({
        actividad_id: programaSeleccionado.id,
        scout_id,
        estado_asistencia: estado,
        fecha: new Date().toISOString().split('T')[0],
        registrado_por: 'Sistema'
      }));

      const { error } = await supabase
        .from('asistencias')
        .upsert(registros, { 
          onConflict: 'actividad_id,scout_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      // Recargar asistencias
      await cargarAsistenciasExistentes();
      
      // Limpiar selección
      setSeleccionMasiva(new Map());

      alert(`✅ ${registros.length} asistencias registradas exitosamente`);

    } catch (error: any) {
      console.error('Error al guardar asistencias:', error);
      alert(`❌ Error al guardar: ${error.message}`);
    } finally {
      setGuardando(false);
    }
  };

  // ============= FILTRADO =============
  const scoutsFiltrados = scouts.filter(scout => {
    const matchRama = !ramaFiltro || scout.rama_actual === ramaFiltro;
    const matchBusqueda = !busqueda || 
      `${scout.nombres} ${scout.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      scout.codigo_scout.toLowerCase().includes(busqueda.toLowerCase());
    const matchPrograma = !programaSeleccionado || scout.rama_actual === programaSeleccionado.rama;
    
    return matchRama && matchBusqueda && matchPrograma;
  });

  // ============= ESTADÍSTICAS =============
  const calcularEstadisticas = () => {
    const total = scoutsFiltrados.length;
    const registrados = scoutsFiltrados.filter(s => 
      asistenciasRegistradas.has(s.id) || seleccionMasiva.has(s.id)
    ).length;
    const pendientes = total - registrados;
    const porcentaje = total > 0 ? Math.round((registrados / total) * 100) : 0;

    return { total, registrados, pendientes, porcentaje };
  };

  const stats = calcularEstadisticas();

  // ============= RENDER =============
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando módulo de asistencia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ============= HEADER ============= */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Control de Asistencia</h1>
              <p className="text-blue-100">Registro rápido y eficiente de asistencias</p>
            </div>
            <Calendar className="w-16 h-16 opacity-20" />
          </div>
        </div>

        {/* ============= KPIs ============= */}
        {programaSeleccionado && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Scouts</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Users className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Registrados</p>
                  <p className="text-3xl font-bold text-green-600">{stats.registrados}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendientes}</p>
                </div>
                <Clock className="w-10 h-10 text-orange-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completado</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.porcentaje}%</p>
                </div>
                <BarChart3 className="w-10 h-10 text-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* ============= SELECTOR DE PROGRAMA ============= */}
        {!programaSeleccionado ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Selecciona un Programa Semanal
            </h2>

            {programas.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay programas disponibles</h3>
                <p className="text-gray-500">Crea un programa semanal para comenzar a registrar asistencias</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programas.map(programa => {
                  const ramaInfo = ramas.find(r => r.value === programa.rama);
                  return (
                    <div 
                      key={programa.id}
                      onClick={() => setProgramaSeleccionado(programa)}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {programa.tema_central || 'Programa Semanal'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(programa.fecha_inicio).toLocaleDateString()} - {new Date(programa.fecha_fin).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${ramaInfo?.color}`}>
                          {ramaInfo?.label}
                        </span>
                      </div>
                      {programa.responsable_programa && (
                        <p className="text-sm text-gray-500">Responsable: {programa.responsable_programa}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ============= PROGRAMA SELECCIONADO ============= */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Programa Seleccionado</p>
                  <h3 className="text-lg font-bold text-blue-900">{programaSeleccionado.tema_central || 'Programa Semanal'}</h3>
                  <p className="text-sm text-blue-700">
                    {ramas.find(r => r.value === programaSeleccionado.rama)?.label} • 
                    {new Date(programaSeleccionado.fecha_inicio).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setProgramaSeleccionado(null);
                    setSeleccionMasiva(new Map());
                  }}
                  className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  Cambiar Programa
                </button>
              </div>
            </div>

            {/* ============= ACCIONES MASIVAS ============= */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
              
              <div className="flex flex-wrap gap-3 mb-4">
                {estadosAsistencia.map(estado => {
                  const Icon = estado.icon;
                  return (
                    <button
                      key={estado.value}
                      onClick={() => handleSeleccionarTodos(estado.value as any)}
                      className={`flex items-center gap-2 px-4 py-2 ${estado.color} text-white rounded-lg transition-colors font-medium`}
                    >
                      <Icon className="w-4 h-4" />
                      Todos {estado.label}
                    </button>
                  );
                })}
                <button
                  onClick={handleLimpiarSeleccion}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Limpiar Selección
                </button>
              </div>

              {/* Botón Guardar */}
              {seleccionMasiva.size > 0 && (
                <div className="flex items-center justify-between bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {seleccionMasiva.size} scout(s) seleccionado(s)
                    </p>
                    <p className="text-xs text-blue-700">
                      Haz clic en guardar para registrar las asistencias
                    </p>
                  </div>
                  <button
                    onClick={handleGuardarAsistencias}
                    disabled={guardando}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {guardando ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Guardar Asistencias
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* ============= FILTROS Y BÚSQUEDA ============= */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o código..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ============= LISTA DE SCOUTS ============= */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Scouts ({scoutsFiltrados.length})
                </h2>
              </div>

              {scoutsFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron scouts</h3>
                  <p className="text-gray-500">Ajusta los filtros de búsqueda</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scout
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado Actual
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones Rápidas
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {scoutsFiltrados.map(scout => {
                        const estadoActual = seleccionMasiva.get(scout.id) || asistenciasRegistradas.get(scout.id);
                        const esNuevaSeleccion = seleccionMasiva.has(scout.id);
                        
                        return (
                          <tr 
                            key={scout.id} 
                            className={`hover:bg-gray-50 transition-colors ${esNuevaSeleccion ? 'bg-blue-50' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-bold text-sm">
                                    {scout.nombres.charAt(0)}{scout.apellidos.charAt(0)}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {scout.nombres} {scout.apellidos}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {ramas.find(r => r.value === scout.rama_actual)?.label}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {scout.codigo_scout}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {estadoActual ? (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  estadoActual === 'presente' ? 'bg-green-100 text-green-800' :
                                  estadoActual === 'ausente' ? 'bg-red-100 text-red-800' :
                                  estadoActual === 'tardanza' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {estadosAsistencia.find(e => e.value === estadoActual)?.label}
                                  {esNuevaSeleccion && ' (nuevo)'}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">Sin registrar</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                {estadosAsistencia.map(estado => {
                                  const Icon = estado.icon;
                                  const isSelected = seleccionMasiva.get(scout.id) === estado.value;
                                  return (
                                    <button
                                      key={estado.value}
                                      onClick={() => handleSeleccionScout(scout.id, estado.value as any)}
                                      className={`p-2 rounded-lg transition-all ${
                                        isSelected 
                                          ? estado.color.replace('hover:', '') + ' text-white scale-110 shadow-lg'
                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                      }`}
                                      title={estado.label}
                                    >
                                      <Icon className="w-4 h-4" />
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
