import { useState, useEffect } from 'react';
import { 
  BarChart, 
  TrendingUp, 
  Users, 
  Award, 
  Download,
  Search,
  UserCircle,
  Activity,
  Target
} from 'lucide-react';
import ScoutService from '../../services/scoutService';

// Interfaces para los datos de reportes
interface EstadisticasGenerales {
  total_scouts: number;
  scouts_activos: number;
  total_dirigentes: number;
  dirigentes_activos: number;
  total_patrullas: number;
  patrullas_activas: number;
  actividades_mes_actual: number;
  promedio_asistencia: number;
  tasa_retencion: number;
  crecimiento_mensual: number;
}

interface ScoutPorRama {
  rama: string;
  total_scouts: number;
  scouts_activos: number;
  edad_minima: number;
  edad_maxima: number;
  dirigentes_rama: number;
}

interface TendenciaMensual {
  mes: number;
  nombre_mes: string;
  nuevos_scouts: number;
  scouts_activos: number;
  actividades_realizadas: number;
  promedio_asistencia: number;
}

interface Scout {
  id: number;
  nombre: string;
  apellido: string;
  foto?: string;
  rama: string;
  edad: number;
  fecha_ingreso: string;
  fecha_nacimiento: string;
  activo: boolean;
  patrullas?: {
    nombre: string;
  };
  logros_scout?: Array<{
    logro_id: number;
    fecha_obtencion: string;
    logros_sistema: {
      nombre: string;
      categoria: string;
    };
  }>;
  asistencias_actividad?: Array<{
    actividad_id: number;
    presente: boolean;
  }>;
}

export default function ReportsMigrated() {
  // Estados para datos de Supabase
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null);
  const [scoutsPorRama, setScoutsPorRama] = useState<ScoutPorRama[]>([]);
  const [tendencias, setTendencias] = useState<TendenciaMensual[]>([]);
  const [scoutsProgresion, setScoutsProgresion] = useState<Scout[]>([]);

  // Estados de UI
  const [selectedReport, setSelectedReport] = useState('scouts-rama');
  const [selectedScout, setSelectedScout] = useState<Scout | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRama, setFilterRama] = useState<'todas' | 'manada' | 'tropa' | 'comunidad'>('todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadReportsData();
  }, []);

  // Función para cargar todos los datos de reportes
  const loadReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar en paralelo todas las estadísticas
      const [
        estadisticasData,
        ramasData,
        tendenciasData,
        scoutsData
      ] = await Promise.all([
        ScoutService.getEstadisticasGenerales(),
        ScoutService.getScoutsPorRama(),
        ScoutService.getTendenciasMensuales(),
        ScoutService.getScoutsConProgresion()
      ]);

      setEstadisticas(estadisticasData);
      setScoutsPorRama(ramasData || []);
      setTendencias(tendenciasData || []);
      setScoutsProgresion(scoutsData || []);

    } catch (err) {
      console.error('Error cargando reportes:', err);
      setError('Error al cargar los datos de reportes');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar scouts por búsqueda y rama
  const filteredScouts = scoutsProgresion.filter(scout => {
    const matchesSearch = scout.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scout.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scout.patrullas?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRama = filterRama === 'todas' || scout.rama === filterRama;
    return matchesSearch && matchesRama;
  });

  // Estadísticas por rama para el filtro
  const ramaStats = {
    manada: scoutsProgresion.filter(s => s.rama === 'manada').length,
    tropa: scoutsProgresion.filter(s => s.rama === 'tropa').length,
    comunidad: scoutsProgresion.filter(s => s.rama === 'comunidad').length,
    total: scoutsProgresion.length
  };

  // Calcular progresión del scout
  const calculateProgression = (scout: Scout) => {
    const totalLogros = scout.logros_scout?.length || 0;
    const asistencias = scout.asistencias_actividad || [];
    const totalAsistencias = asistencias.length;
    const presentes = asistencias.filter(a => a.presente).length;
    
    // Progreso basado en logros y asistencia
    const logrosProgreso = Math.min(totalLogros * 10, 60); // Max 60% por logros
    const asistenciaProgreso = totalAsistencias > 0 ? (presentes / totalAsistencias) * 40 : 0; // Max 40% por asistencia
    
    return Math.round(logrosProgreso + asistenciaProgreso);
  };

  // Obtener siguiente etapa según rama
  const getSiguienteEtapa = (rama: string, progreso: number) => {
    const etapas = {
      manada: ['Lobo Saltarín', 'Lobo Rastreador', 'Lobo Cazador'],
      tropa: ['Scout', 'Scout de Primera Clase', 'Scout Avanzado'],
      comunidad: ['Caminante', 'Caminante Aventurero', 'Rover']
    };
    
    const ramaEtapas = etapas[rama as keyof typeof etapas] || ['Scout'];
    const etapaIndex = Math.floor(progreso / 34); // Divide en 3 etapas
    return ramaEtapas[Math.min(etapaIndex, ramaEtapas.length - 1)];
  };

  const reports = [
    {
      id: 'scouts-rama',
      title: 'Scouts por Rama',
      description: 'Lista y estadísticas de scouts organizados por rama',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      id: 'estadisticas',
      title: 'Estadísticas Generales',
      description: 'Métricas y tendencias del grupo scout',
      icon: BarChart,
      color: 'bg-green-500'
    },
    {
      id: 'historia-scout',
      title: 'Historia de Scout',
      description: 'Línea de tiempo y progresión individual',
      icon: Award,
      color: 'bg-orange-500'
    },
    {
      id: 'tendencias',
      title: 'Tendencias Mensuales',
      description: 'Evolución del grupo a lo largo del tiempo',
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-xl">Cargando reportes y estadísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 text-center">Reportes y Estadísticas</h1>
          <p className="text-white/70 text-center">Análisis detallado de la información del grupo scout</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-200">{error}</p>
            <button 
              onClick={loadReportsData}
              className="mt-2 text-red-200 hover:text-white underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Report Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`p-6 rounded-xl border-2 transition-all text-left transform hover:scale-105 ${
                  selectedReport === report.id
                    ? 'border-[#4A90E2] bg-white/10 backdrop-blur-md shadow-lg shadow-[#4A90E2]/20'
                    : 'border-white/20 bg-white/5 backdrop-blur-sm hover:border-white/40 hover:bg-white/10'
                }`}
              >
                <div className={`w-12 h-12 ${report.color} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{report.title}</h3>
                <p className="text-sm text-white/70">{report.description}</p>
              </button>
            );
          })}
        </div>
        
        {/* Report Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
          {/* Scouts por Rama */}
          {selectedReport === 'scouts-rama' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-semibold text-white">Scouts por Rama</h2>
                <button className="flex items-center space-x-2 px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#4A90E2]/80 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Exportar PDF</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Distribución por Rama</h3>
                  <div className="space-y-4">
                    {scoutsPorRama.map((rama) => (
                      <div key={rama.rama} className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                        <div>
                          <h4 className="font-medium text-white capitalize">{rama.rama}</h4>
                          <p className="text-sm text-white/60">{rama.edad_minima}-{rama.edad_maxima} años</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#4A90E2]">{rama.scouts_activos}</p>
                          <p className="text-sm text-white/60">{rama.dirigentes_rama} dirigentes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Resumen General</h3>
                  <div className="space-y-4">
                    {estadisticas && (
                      <>
                        <div className="p-4 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-xl border border-blue-400/20">
                          <p className="text-3xl font-bold text-white">{estadisticas.scouts_activos}</p>
                          <p className="text-blue-200">Total de Scouts Activos</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-green-500/20 to-green-400/20 rounded-xl border border-green-400/20">
                          <p className="text-3xl font-bold text-white">{estadisticas.dirigentes_activos}</p>
                          <p className="text-green-200">Dirigentes Activos</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-purple-500/20 to-purple-400/20 rounded-xl border border-purple-400/20">
                          <p className="text-3xl font-bold text-white">{estadisticas.patrullas_activas}</p>
                          <p className="text-purple-200">Patrullas Activas</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Estadísticas Generales */}
          {selectedReport === 'estadisticas' && estadisticas && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-semibold text-white">Estadísticas y Métricas</h2>
                <button className="flex items-center space-x-2 px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#4A90E2]/80 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Métricas Clave */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Métricas Clave</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <span className="text-white font-medium">Crecimiento Mensual</span>
                      </div>
                      <span className="text-lg font-bold text-green-400">+{estadisticas.crecimiento_mensual}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-blue-400" />
                        <span className="text-white font-medium">Tasa de Retención</span>
                      </div>
                      <span className="text-lg font-bold text-blue-400">{estadisticas.tasa_retencion}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                      <div className="flex items-center space-x-3">
                        <Award className="w-5 h-5 text-yellow-400" />
                        <span className="text-white font-medium">Promedio Asistencia</span>
                      </div>
                      <span className="text-lg font-bold text-yellow-400">{estadisticas.promedio_asistencia}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                      <div className="flex items-center space-x-3">
                        <Activity className="w-5 h-5 text-purple-400" />
                        <span className="text-white font-medium">Actividades este Mes</span>
                      </div>
                      <span className="text-lg font-bold text-purple-400">{estadisticas.actividades_mes_actual}</span>
                    </div>
                  </div>
                </div>

                {/* Distribución Detallada */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Distribución Detallada</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Scouts Totales</span>
                        <span className="text-blue-200">{estadisticas.total_scouts}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-200/80">Activos</span>
                        <span className="text-blue-200">{estadisticas.scouts_activos}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-green-500/20 to-green-400/20 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Dirigentes Totales</span>
                        <span className="text-green-200">{estadisticas.total_dirigentes}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-200/80">Activos</span>
                        <span className="text-green-200">{estadisticas.dirigentes_activos}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-purple-500/20 to-purple-400/20 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Patrullas Totales</span>
                        <span className="text-purple-200">{estadisticas.total_patrullas}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-purple-200/80">Activas</span>
                        <span className="text-purple-200">{estadisticas.patrullas_activas}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tendencias Mensuales */}
          {selectedReport === 'tendencias' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-semibold text-white">Tendencias Mensuales</h2>
                <button className="flex items-center space-x-2 px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#4A90E2]/80 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 text-sm font-medium text-white/80">Mes</th>
                      <th className="text-center py-3 text-sm font-medium text-white/80">Nuevos Scouts</th>
                      <th className="text-center py-3 text-sm font-medium text-white/80">Scouts Activos</th>
                      <th className="text-center py-3 text-sm font-medium text-white/80">Actividades</th>
                      <th className="text-center py-3 text-sm font-medium text-white/80">Asistencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tendencias.map((tendencia) => (
                      <tr key={tendencia.mes} className="border-b border-white/10">
                        <td className="py-3 font-medium text-white">{tendencia.nombre_mes}</td>
                        <td className="py-3 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300">
                            +{tendencia.nuevos_scouts}
                          </span>
                        </td>
                        <td className="py-3 text-center font-medium text-white">{tendencia.scouts_activos}</td>
                        <td className="py-3 text-center text-white">{tendencia.actividades_realizadas}</td>
                        <td className="py-3 text-center text-[#4A90E2]">{tendencia.promedio_asistencia}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Historia de Scouts */}
          {selectedReport === 'historia-scout' && (
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <UserCircle className="h-6 w-6 text-[#4A90E2]" />
                  Historia de Scouts
                  <span className="text-sm bg-[#4A90E2]/20 px-3 py-1 rounded-full text-[#4A90E2]">
                    {filteredScouts.length} scouts
                  </span>
                </h3>

                {/* Search and Filter Bar */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre o patrulla..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/60 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      />
                    </div>
                    <select
                      value={filterRama}
                      onChange={(e) => setFilterRama(e.target.value as 'todas' | 'manada' | 'tropa' | 'comunidad')}
                      className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent min-w-[150px]"
                    >
                      <option value="todas" className="bg-slate-800">Todas las Ramas</option>
                      <option value="manada" className="bg-slate-800">🐺 Manada</option>
                      <option value="tropa" className="bg-slate-800">🦅 Tropa</option>
                      <option value="comunidad" className="bg-slate-800">🚀 Comunidad</option>
                    </select>
                  </div>

                  {/* Rama Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-500/20 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white">{ramaStats.manada}</div>
                      <div className="text-blue-200 text-sm">🐺 Manada</div>
                    </div>
                    <div className="bg-green-500/20 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white">{ramaStats.tropa}</div>
                      <div className="text-green-200 text-sm">🦅 Tropa</div>
                    </div>
                    <div className="bg-purple-500/20 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white">{ramaStats.comunidad}</div>
                      <div className="text-purple-200 text-sm">🚀 Comunidad</div>
                    </div>
                    <div className="bg-yellow-500/20 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white">{ramaStats.total}</div>
                      <div className="text-yellow-200 text-sm">✨ Total</div>
                    </div>
                  </div>
                </div>

                {/* Scouts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredScouts.map((scout) => {
                    const progreso = calculateProgression(scout);
                    const siguienteEtapa = getSiguienteEtapa(scout.rama, progreso);
                    const edad = new Date().getFullYear() - new Date(scout.fecha_nacimiento).getFullYear();
                    const campamentos = scout.logros_scout?.filter(l => l.logros_sistema.categoria === 'campamento').length || 0;
                    const servicios = scout.logros_scout?.filter(l => l.logros_sistema.categoria === 'servicio').length || 0;
                    
                    return (
                      <div 
                        key={scout.id}
                        className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer hover:scale-105"
                        onClick={() => setSelectedScout(scout)}
                      >
                        <div className="text-center">
                          <div className="relative mx-auto w-20 h-20 mb-3">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white/20">
                              {scout.nombre.charAt(0)}{scout.apellido.charAt(0)}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${
                              scout.rama === 'manada' ? 'bg-blue-500' :
                              scout.rama === 'tropa' ? 'bg-green-500' : 'bg-purple-500'
                            } flex items-center justify-center text-xs`}>
                              {scout.rama === 'manada' ? '🐺' : scout.rama === 'tropa' ? '🦅' : '🚀'}
                            </div>
                          </div>
                          <h4 className="text-white font-semibold text-sm mb-1">{scout.nombre} {scout.apellido}</h4>
                          <p className="text-white/60 text-xs mb-2">{scout.patrullas?.nombre} • {edad} años</p>
                          <div className="space-y-1">
                            <div className="text-xs text-[#4A90E2]">{siguienteEtapa}</div>
                            <div className="w-full bg-white/10 rounded-full h-1.5">
                              <div 
                                className="bg-gradient-to-r from-[#4A90E2] to-[#50C878] h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progreso}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-white/60">{progreso}% completado</div>
                          </div>
                          <div className="mt-2 flex justify-center gap-1">
                            <span className="text-xs bg-blue-500/20 text-blue-200 px-2 py-1 rounded">
                              {campamentos} 🏕️
                            </span>
                            <span className="text-xs bg-green-500/20 text-green-200 px-2 py-1 rounded">
                              {servicios} 🤝
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredScouts.length === 0 && (
                  <div className="text-center py-12">
                    <UserCircle className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 text-lg">No se encontraron scouts</p>
                    <p className="text-white/40 text-sm">Intenta ajustar los filtros de búsqueda</p>
                  </div>
                )}
              </div>

              {/* Scout Detail Modal */}
              {selectedScout && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white/20">
                          {selectedScout.nombre.charAt(0)}{selectedScout.apellido.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">{selectedScout.nombre} {selectedScout.apellido}</h3>
                          <p className="text-white/60">{selectedScout.patrullas?.nombre} • {new Date().getFullYear() - new Date(selectedScout.fecha_nacimiento).getFullYear()} años</p>
                          <p className="text-[#4A90E2] text-sm">Ingreso: {new Date(selectedScout.fecha_ingreso).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedScout(null)}
                        className="text-white/60 hover:text-white p-2"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-white/5 rounded-xl p-4">
                          <h4 className="text-white font-semibold mb-2">Progresión</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-white/80">{getSiguienteEtapa(selectedScout.rama, calculateProgression(selectedScout))}</span>
                              <span className="text-[#4A90E2]">{calculateProgression(selectedScout)}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-[#4A90E2] to-[#50C878] h-2 rounded-full"
                                style={{ width: `${calculateProgression(selectedScout)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4">
                          <h4 className="text-white font-semibold mb-2">Logros</h4>
                          <div className="space-y-1">
                            {selectedScout.logros_scout?.slice(0, 3).map((logro, index) => (
                              <div key={index} className="text-sm text-white/80">
                                • {logro.logros_sistema.nombre}
                              </div>
                            ))}
                            {(selectedScout.logros_scout?.length || 0) > 3 && (
                              <div className="text-sm text-[#4A90E2]">
                                +{(selectedScout.logros_scout?.length || 0) - 3} más...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white/5 rounded-xl p-4">
                          <h4 className="text-white font-semibold mb-3">Estadísticas</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-white/80 flex items-center gap-2">
                                <Award className="h-4 w-4" />
                                Logros Totales
                              </span>
                              <span className="text-[#4A90E2] font-semibold">{selectedScout.logros_scout?.length || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/80 flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Actividades
                              </span>
                              <span className="text-[#50C878] font-semibold">{selectedScout.asistencias_actividad?.length || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/80 flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Asistencia
                              </span>
                              <span className="text-[#FFD700] font-semibold">
                                {selectedScout.asistencias_actividad?.length ? 
                                  Math.round((selectedScout.asistencias_actividad.filter(a => a.presente).length / selectedScout.asistencias_actividad.length) * 100) 
                                  : 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}