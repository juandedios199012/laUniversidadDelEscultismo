// ============================================================================
// PROGRESIÓN PAGE
// ============================================================================
// Página principal del módulo de Progresión Scout
// Muestra dashboard con estadísticas y lista de scouts con su progreso
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Award, Users, TrendingUp, Search, Filter,
  ChevronRight, RefreshCw, AlertCircle
} from 'lucide-react';
import ProgresionService, { 
  Etapa, 
  EstadisticaEtapa, 
  ResumenProgresoScout 
} from '../../services/progresionService';
import ProgressRing from './ProgressRing';
import StageBadge from './StageBadge';
import ScoutProgresionDetail from './ScoutProgresionDetail';

const ProgresionPage: React.FC = () => {
  // Estado
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticaEtapa[]>([]);
  const [scouts, setScouts] = useState<ResumenProgresoScout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEtapa, setFiltroEtapa] = useState<string>('');
  const [filtroRama, setFiltroRama] = useState<string>('');
  
  // Modal detalle
  const [scoutSeleccionado, setScoutSeleccionado] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [etapasData, estadisticasData, scoutsData] = await Promise.all([
        ProgresionService.obtenerEtapas(),
        ProgresionService.obtenerEstadisticasEtapas(),
        ProgresionService.obtenerResumenProgresion()
      ]);
      
      setEtapas(etapasData);
      setEstadisticas(estadisticasData);
      setScouts(scoutsData);
    } catch (err) {
      console.error('Error al cargar datos de progresión:', err);
      setError('No se pudieron cargar los datos de progresión');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar scouts
  const scoutsFiltrados = scouts.filter(scout => {
    const matchBusqueda = !busqueda || 
      scout.scout_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      scout.scout_codigo?.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchEtapa = !filtroEtapa || scout.etapa_actual_codigo === filtroEtapa;
    const matchRama = !filtroRama || scout.rama === filtroRama;
    
    return matchBusqueda && matchEtapa && matchRama;
  });

  // Ramas únicas para filtro
  const ramasUnicas = [...new Set(scouts.map(s => s.rama).filter(Boolean))];

  // Calcular totales
  const totalScouts = scouts.length;
  const promedioGeneral = scouts.length > 0 
    ? Math.round(scouts.reduce((acc, s) => acc + (s.progreso_general || 0), 0) / scouts.length)
    : 0;

  // Obtener color del progreso
  const getProgresoColor = (progreso: number): string => {
    if (progreso >= 80) return '#22c55e';  // green-500
    if (progreso >= 50) return '#eab308';  // yellow-500
    if (progreso >= 25) return '#f97316';  // orange-500
    return '#ef4444';                       // red-500
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando progresión...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Error al cargar</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={cargarDatos}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Si hay un scout seleccionado, mostrar su detalle
  if (scoutSeleccionado) {
    return (
      <ScoutProgresionDetail
        scoutId={scoutSeleccionado}
        onBack={() => setScoutSeleccionado(null)}
        onUpdate={cargarDatos}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Award className="w-7 h-7 text-amber-500" />
            Progresión Scout
          </h1>
          <p className="text-gray-600 mt-1">
            Sistema de seguimiento de objetivos educativos
          </p>
        </div>
        
        <button
          onClick={cargarDatos}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg
                     hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Scouts</p>
              <p className="text-2xl font-bold text-gray-800">{totalScouts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Promedio General</p>
              <p className="text-2xl font-bold text-gray-800">{promedioGeneral}%</p>
            </div>
          </div>
        </div>
        
        {estadisticas.slice(0, 2).map(est => (
          <div key={est.etapa_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: est.etapa_color + '20' }}
              >
                <span className="text-xl">{est.etapa_icono}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">{est.etapa_nombre}</p>
                <p className="text-2xl font-bold text-gray-800">{est.total_scouts}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Distribución por Etapas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Etapas</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {estadisticas.map(est => (
            <div key={est.etapa_id} className="text-center">
              <ProgressRing
                progress={est.promedio_progreso || 0}
                size={100}
                strokeWidth={8}
                color={est.etapa_color || '#6b7280'}
                label={`${est.total_scouts} scouts`}
              />
              <div className="mt-3">
                <StageBadge 
                  codigo={est.etapa_codigo} 
                  nombre={est.etapa_nombre}
                  icono={est.etapa_icono}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filtro Etapa */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filtroEtapa}
              onChange={(e) => setFiltroEtapa(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las etapas</option>
              {etapas.map(e => (
                <option key={e.id} value={e.codigo}>{e.icono} {e.nombre}</option>
              ))}
            </select>
          </div>
          
          {/* Filtro Rama */}
          <select
            value={filtroRama}
            onChange={(e) => setFiltroRama(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las ramas</option>
            {ramasUnicas.map(rama => (
              <option key={rama} value={rama}>{rama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Scouts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Scouts ({scoutsFiltrados.length})
          </h2>
        </div>
        
        {scoutsFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500">No se encontraron scouts con los filtros aplicados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {scoutsFiltrados.map(scout => (
              <div
                key={scout.scout_id}
                onClick={() => setScoutSeleccionado(scout.scout_id)}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {/* Progreso circular */}
                <ProgressRing
                  progress={scout.progreso_general || 0}
                  size={56}
                  strokeWidth={4}
                  color={getProgresoColor(scout.progreso_general || 0)}
                  showPercentage={false}
                />
                
                {/* Info del scout */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800 truncate">
                      {scout.scout_nombre}
                    </p>
                    <StageBadge 
                      codigo={scout.etapa_actual_codigo || 'PISTA'} 
                      nombre={scout.etapa_actual_nombre || 'Pista'}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    {scout.scout_codigo && <span>{scout.scout_codigo}</span>}
                    {scout.rama && <span>• {scout.rama}</span>}
                    {scout.patrulla_nombre && <span>• {scout.patrulla_nombre}</span>}
                  </div>
                </div>
                
                {/* Progreso */}
                <div className="text-right">
                  <p 
                    className="text-lg font-bold"
                    style={{ color: getProgresoColor(scout.progreso_general || 0) }}
                  >
                    {Math.round(scout.progreso_general || 0)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {scout.objetivos_completados}/{scout.total_objetivos}
                  </p>
                </div>
                
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgresionPage;
