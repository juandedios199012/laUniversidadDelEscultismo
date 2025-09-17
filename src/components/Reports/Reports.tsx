import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award, 
  Clock, 
  Download, 
  Filter,
  Search,
  UserCircle,
  Calendar
} from 'lucide-react';

interface Scout {
  id: number;
  nombre: string;
  foto: string;
  rama: 'manada' | 'tropa' | 'comunidad';
  edad: number;
  fechaIngreso: string;
  patrulla: string;
  especialidades: string[];
  progresion: {
    actual: string;
    completado: number;
    siguienteEtapa: string;
  };
  estadisticas: {
    actividadesParticipadas: number;
    serviciosComunitarios: number;
    campamentos: number;
  };
}

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('scouts-rama');
  const [selectedScout, setSelectedScout] = useState<Scout | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRama, setFilterRama] = useState<'todas' | 'manada' | 'tropa' | 'comunidad'>('todas');

  // Data for multiple scouts
  const scoutsData: Scout[] = [
    {
      id: 1,
      nombre: 'Carlos Mendoza',
      foto: '/api/placeholder/150/150',
      rama: 'manada',
      edad: 8,
      fechaIngreso: '2023-02-15',
      patrulla: 'Lobos Grises',
      especialidades: ['Atletismo', 'Cocina', 'Primeros Auxilios'],
      progresion: {
        actual: 'Lobo Saltarín',
        completado: 75,
        siguienteEtapa: 'Lobo Rastreador'
      },
      estadisticas: {
        actividadesParticipadas: 45,
        serviciosComunitarios: 12,
        campamentos: 8
      }
    },
    {
      id: 2,
      nombre: 'María González',
      foto: '/api/placeholder/150/150',
      rama: 'tropa',
      edad: 13,
      fechaIngreso: '2022-08-10',
      patrulla: 'Águilas Doradas',
      especialidades: ['Liderazgo', 'Comunicaciones', 'Ecología'],
      progresion: {
        actual: 'Scout de Primera Clase',
        completado: 60,
        siguienteEtapa: 'Scout Avanzado'
      },
      estadisticas: {
        actividadesParticipadas: 78,
        serviciosComunitarios: 25,
        campamentos: 15
      }
    },
    {
      id: 3,
      nombre: 'Diego Ramirez',
      foto: '/api/placeholder/150/150',
      rama: 'comunidad',
      edad: 17,
      fechaIngreso: '2020-03-22',
      patrulla: 'Cóndores Andinos',
      especialidades: ['Supervivencia', 'Montañismo', 'Fotografía'],
      progresion: {
        actual: 'Rover',
        completado: 90,
        siguienteEtapa: 'Rover Avanzado'
      },
      estadisticas: {
        actividadesParticipadas: 120,
        serviciosComunitarios: 45,
        campamentos: 28
      }
    },
    // Adding more scouts for demonstration
    ...Array.from({ length: 20 }, (_, i) => {
      const ramas: ('manada' | 'tropa' | 'comunidad')[] = ['manada', 'tropa', 'comunidad'];
      const patrullas = ['Lobos Grises', 'Águilas Doradas', 'Cóndores Andinos'];
      const especialidades = ['Atletismo', 'Cocina', 'Liderazgo', 'Montañismo', 'Ecología', 'Comunicaciones'];
      const progression = ['Lobo Saltarín', 'Scout de Primera', 'Rover'];
      const nextStage = ['Lobo Rastreador', 'Scout Avanzado', 'Rover Avanzado'];
      
      return {
        id: i + 4,
        nombre: `Scout ${i + 4}`,
        foto: '/api/placeholder/150/150',
        rama: ramas[i % 3],
        edad: 8 + (i % 12),
        fechaIngreso: `202${Math.floor(Math.random() * 4)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        patrulla: patrullas[i % 3],
        especialidades: [especialidades[Math.floor(Math.random() * especialidades.length)]],
        progresion: {
          actual: progression[i % 3],
          completado: Math.floor(Math.random() * 100),
          siguienteEtapa: nextStage[i % 3]
        },
        estadisticas: {
          actividadesParticipadas: Math.floor(Math.random() * 100) + 20,
          serviciosComunitarios: Math.floor(Math.random() * 50) + 5,
          campamentos: Math.floor(Math.random() * 30) + 3
        }
      };
    })
  ];

  // Filter scouts based on search and rama filter
  const filteredScouts = scoutsData.filter(scout => {
    const matchesSearch = scout.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scout.patrulla.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRama = filterRama === 'todas' || scout.rama === filterRama;
    return matchesSearch && matchesRama;
  });

  // Statistics by rama
  const ramaStats = {
    manada: scoutsData.filter(s => s.rama === 'manada').length,
    tropa: scoutsData.filter(s => s.rama === 'tropa').length,
    comunidad: scoutsData.filter(s => s.rama === 'comunidad').length,
    total: scoutsData.length
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
      icon: BarChart3,
      color: 'bg-green-500'
    },
    {
      id: 'patrullas-tiempo',
      title: 'Patrullas en el Tiempo',
      description: 'Cantidad de scouts por patrulla entre fechas',
      icon: Clock,
      color: 'bg-purple-500'
    },
    {
      id: 'historia-scout',
      title: 'Historia de Scout',
      description: 'Línea de tiempo y progresión individual',
      icon: Award,
      color: 'bg-orange-500'
    }
  ];

  const scoutsByRama = [
    { rama: 'Manada', scouts: 42, edad: '7-10 años', dirigentes: 6 },
    { rama: 'Tropa', scouts: 68, edad: '11-14 años', dirigentes: 9 },
    { rama: 'Caminante', scouts: 34, edad: '15-17 años', dirigentes: 5 },
    { rama: 'Clan', scouts: 12, edad: '18-21 años', dirigentes: 3 }
  ];

  const monthlyStats = [
    { month: 'Ene', nuevos: 12, activos: 156, actividades: 8 },
    { month: 'Feb', nuevos: 8, activos: 159, actividades: 6 },
    { month: 'Mar', nuevos: 15, activos: 168, actividades: 12 },
    { month: 'Abr', nuevos: 6, activos: 165, actividades: 9 },
    { month: 'May', nuevos: 11, activos: 171, actividades: 14 },
    { month: 'Jun', nuevos: 9, activos: 174, actividades: 11 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 text-center">Reportes y Estadísticas</h1>
          <p className="text-white/70 text-center">Análisis detallado de la información del grupo scout</p>
        </div>

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
                    {scoutsByRama.map((rama) => (
                      <div key={rama.rama} className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                        <div>
                          <h4 className="font-medium text-white">{rama.rama}</h4>
                          <p className="text-sm text-white/60">{rama.edad}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#4A90E2]">{rama.scouts}</p>
                          <p className="text-sm text-white/60">{rama.dirigentes} dirigentes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-4">Resumen General</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-xl border border-blue-400/20">
                    <p className="text-3xl font-bold text-white">156</p>
                    <p className="text-blue-200">Total de Scouts Activos</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-500/20 to-green-400/20 rounded-xl border border-green-400/20">
                    <p className="text-3xl font-bold text-white">23</p>
                    <p className="text-green-200">Dirigentes Activos</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-purple-500/20 to-purple-400/20 rounded-xl border border-purple-400/20">
                    <p className="text-3xl font-bold text-white">8</p>
                    <p className="text-purple-200">Patrullas Activas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'estadisticas' && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Estadísticas y Métricas</h2>
              <div className="flex space-x-2">
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4" />
                  <span>Filtros</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Tendencias Mensuales</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Mes</th>
                        <th className="text-center py-3 text-sm font-medium text-gray-600">Nuevos</th>
                        <th className="text-center py-3 text-sm font-medium text-gray-600">Activos</th>
                        <th className="text-center py-3 text-sm font-medium text-gray-600">Actividades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyStats.map((stat) => (
                        <tr key={stat.month} className="border-b border-gray-100">
                          <td className="py-3 font-medium">{stat.month}</td>
                          <td className="py-3 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              +{stat.nuevos}
                            </span>
                          </td>
                          <td className="py-3 text-center font-medium">{stat.activos}</td>
                          <td className="py-3 text-center">{stat.actividades}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Métricas Clave</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Crecimiento Mensual</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">+8.2%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Tasa de Retención</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">94.5%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">Promedio Asistencia</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-600">87.3%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-purple-500" />
                      <span className="font-medium">Actividades/Mes</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">10.2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <div className="bg-gold-500/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{ramaStats.total}</div>
                    <div className="text-yellow-200 text-sm">✨ Total</div>
                  </div>
                </div>
              </div>

              {/* Scouts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredScouts.map((scout) => (
                  <div 
                    key={scout.id}
                    className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer hover:scale-105"
                    onClick={() => setSelectedScout(scout)}
                  >
                    <div className="text-center">
                      <div className="relative mx-auto w-20 h-20 mb-3">
                        <img 
                          src={scout.foto} 
                          alt={scout.nombre}
                          className="w-full h-full rounded-full object-cover border-2 border-white/20"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${
                          scout.rama === 'manada' ? 'bg-blue-500' :
                          scout.rama === 'tropa' ? 'bg-green-500' : 'bg-purple-500'
                        } flex items-center justify-center text-xs`}>
                          {scout.rama === 'manada' ? '🐺' : scout.rama === 'tropa' ? '🦅' : '🚀'}
                        </div>
                      </div>
                      <h4 className="text-white font-semibold text-sm mb-1">{scout.nombre}</h4>
                      <p className="text-white/60 text-xs mb-2">{scout.patrulla}</p>
                      <div className="space-y-1">
                        <div className="text-xs text-[#4A90E2]">{scout.progresion.actual}</div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-[#4A90E2] to-[#50C878] h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${scout.progresion.completado}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-white/60">{scout.progresion.completado}% completado</div>
                      </div>
                      <div className="mt-2 flex justify-center gap-1">
                        <span className="text-xs bg-blue-500/20 text-blue-200 px-2 py-1 rounded">
                          {scout.estadisticas.campamentos} 🏕️
                        </span>
                        <span className="text-xs bg-green-500/20 text-green-200 px-2 py-1 rounded">
                          {scout.estadisticas.serviciosComunitarios} 🤝
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
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
                      <img 
                        src={selectedScout.foto} 
                        alt={selectedScout.nombre}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                      />
                      <div>
                        <h3 className="text-2xl font-bold text-white">{selectedScout.nombre}</h3>
                        <p className="text-white/60">{selectedScout.patrulla} • {selectedScout.edad} años</p>
                        <p className="text-[#4A90E2] text-sm">Ingreso: {selectedScout.fechaIngreso}</p>
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
                            <span className="text-white/80">{selectedScout.progresion.actual}</span>
                            <span className="text-[#4A90E2]">{selectedScout.progresion.completado}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-[#4A90E2] to-[#50C878] h-2 rounded-full"
                              style={{ width: `${selectedScout.progresion.completado}%` }}
                            ></div>
                          </div>
                          <p className="text-white/60 text-sm">Siguiente: {selectedScout.progresion.siguienteEtapa}</p>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4">
                        <h4 className="text-white font-semibold mb-2">Especialidades</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedScout.especialidades.map((esp, index) => (
                            <span key={index} className="bg-[#4A90E2]/20 text-[#4A90E2] px-3 py-1 rounded-full text-sm">
                              {esp}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white/5 rounded-xl p-4">
                        <h4 className="text-white font-semibold mb-3">Estadísticas</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-white/80 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Actividades
                            </span>
                            <span className="text-[#4A90E2] font-semibold">{selectedScout.estadisticas.actividadesParticipadas}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/80 flex items-center gap-2">
                              🤝 Servicios
                            </span>
                            <span className="text-[#50C878] font-semibold">{selectedScout.estadisticas.serviciosComunitarios}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/80 flex items-center gap-2">
                              🏕️ Campamentos
                            </span>
                            <span className="text-[#FFD700] font-semibold">{selectedScout.estadisticas.campamentos}</span>
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