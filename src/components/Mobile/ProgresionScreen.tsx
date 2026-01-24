// ============================================================================
// PROGRESION SCREEN - Mobile
// ============================================================================
// Pantalla de progresión scout optimizada para móvil
// ============================================================================

import { useState, useEffect } from 'react';
import { 
  Award, Search, TrendingUp, ChevronRight, RefreshCw, 
  AlertCircle, Star, Target, CheckCircle
} from 'lucide-react';
import ProgresionService, { 
  Etapa
} from '../../services/progresionService';

interface ScoutProgreso {
  scout_id: string;
  scout_nombre: string;
  scout_codigo?: string;
  rama?: string;
  etapa_actual_nombre?: string;
  etapa_actual_codigo?: string;
  progreso_general: number;
  objetivos_logrados?: number;
  total_objetivos?: number;
}

export default function ProgresionScreen() {
  const [scouts, setScouts] = useState<ScoutProgreso[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroRama, setFiltroRama] = useState('');
  
  // Scout seleccionado para ver detalle
  const [scoutSeleccionado, setScoutSeleccionado] = useState<ScoutProgreso | null>(null);

  const ramas = ['Todas', 'Manada', 'Tropa', 'Comunidad', 'Clan'];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [etapasData, scoutsData] = await Promise.all([
        ProgresionService.obtenerEtapas(),
        ProgresionService.obtenerResumenProgresion()
      ]);
      
      setEtapas(etapasData);
      setScouts(scoutsData);
    } catch (err) {
      console.error('Error al cargar datos de progresión:', err);
      setError('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar scouts
  const scoutsFiltrados = scouts.filter(scout => {
    const matchBusqueda = !busqueda || 
      scout.scout_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      scout.scout_codigo?.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchRama = !filtroRama || filtroRama === 'Todas' || scout.rama === filtroRama;
    
    return matchBusqueda && matchRama;
  });

  // Estadísticas rápidas
  const totalScouts = scouts.length;
  const promedioGeneral = scouts.length > 0 
    ? Math.round(scouts.reduce((acc, s) => acc + (s.progreso_general || 0), 0) / scouts.length)
    : 0;
  const scoutsConProgreso = scouts.filter(s => s.progreso_general > 50).length;

  const getProgresoColor = (progreso: number): string => {
    if (progreso >= 80) return 'text-green-600 bg-green-100';
    if (progreso >= 50) return 'text-yellow-600 bg-yellow-100';
    if (progreso >= 25) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressBarColor = (progreso: number): string => {
    if (progreso >= 80) return 'bg-green-500';
    if (progreso >= 50) return 'bg-yellow-500';
    if (progreso >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRamaBadgeColor = (rama?: string) => {
    const colores: Record<string, string> = {
      'Manada': 'bg-yellow-100 text-yellow-800',
      'Tropa': 'bg-green-100 text-green-800',
      'Comunidad': 'bg-blue-100 text-blue-800',
      'Clan': 'bg-red-100 text-red-800'
    };
    return colores[rama || ''] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-10 h-10 animate-spin text-amber-600 mb-4" />
        <p className="text-gray-600">Cargando progresión...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Error al cargar</h3>
        <p className="text-gray-600 mb-4 text-center">{error}</p>
        <button
          onClick={cargarDatos}
          className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold active:scale-95 transition-transform"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center space-x-3 mb-2">
          <Award className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Progresión</h2>
        </div>
        <p className="text-amber-50">Seguimiento de objetivos educativos</p>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <div className="text-2xl font-bold text-blue-600">{totalScouts}</div>
          <div className="text-xs text-gray-500">Scouts</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <div className="text-2xl font-bold text-amber-600">{promedioGeneral}%</div>
          <div className="text-xs text-gray-500">Promedio</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <div className="text-2xl font-bold text-green-600">{scoutsConProgreso}</div>
          <div className="text-xs text-gray-500">&gt;50%</div>
        </div>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="bg-white rounded-xl p-4 shadow">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar scout..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
          />
        </div>

        <select
          value={filtroRama}
          onChange={(e) => setFiltroRama(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        >
          {ramas.map(r => (
            <option key={r} value={r === 'Todas' ? '' : r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Estado Vacío */}
      {scoutsFiltrados.length === 0 && (
        <div className="bg-white rounded-xl p-8 shadow text-center">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-12 h-12 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No se encontraron scouts
          </h3>
          <p className="text-gray-500 text-sm">
            Intenta cambiar los filtros de búsqueda
          </p>
        </div>
      )}

      {/* Lista de Scouts con Progreso */}
      {scoutsFiltrados.length > 0 && (
        <div className="space-y-3">
          {scoutsFiltrados.map(scout => (
            <button
              key={scout.scout_id}
              onClick={() => setScoutSeleccionado(scout)}
              className="w-full bg-white rounded-xl p-4 shadow active:scale-[0.98] transition-transform text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    {scout.scout_nombre}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    {scout.rama && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRamaBadgeColor(scout.rama)}`}>
                        {scout.rama}
                      </span>
                    )}
                    {scout.etapa_actual_nombre && (
                      <span className="text-xs text-gray-500">
                        {scout.etapa_actual_nombre}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${getProgresoColor(scout.progreso_general)}`}>
                  {scout.progreso_general}%
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressBarColor(scout.progreso_general)} transition-all duration-300`}
                  style={{ width: `${scout.progreso_general}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {scout.objetivos_logrados}/{scout.total_objetivos} objetivos
                </span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal Detalle Scout */}
      {scoutSeleccionado && (
        <ScoutDetalleModal 
          scout={scoutSeleccionado} 
          etapas={etapas}
          onClose={() => setScoutSeleccionado(null)}
          onRefresh={cargarDatos}
        />
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTE: Modal de Detalle del Scout
// ============================================================================

interface ScoutDetalleModalProps {
  scout: ScoutProgreso;
  etapas: Etapa[];
  onClose: () => void;
  onRefresh: () => void;
}

function ScoutDetalleModal({ scout, onClose }: ScoutDetalleModalProps) {
  const [detalleProgreso, setDetalleProgreso] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDetalle();
  }, [scout.scout_id]);

  const cargarDetalle = async () => {
    setLoading(true);
    try {
      const detalle = await ProgresionService.obtenerProgresoScout(scout.scout_id);
      setDetalleProgreso(detalle);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgresoColor = (progreso: number): string => {
    if (progreso >= 80) return 'text-green-600';
    if (progreso >= 50) return 'text-yellow-600';
    if (progreso >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-end z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 pt-4 pb-3">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {scout.scout_nombre}
              </h2>
              <p className="text-sm text-gray-500">
                {scout.scout_codigo} • {scout.rama}
              </p>
            </div>
            <div className={`text-3xl font-bold ${getProgresoColor(scout.progreso_general)}`}>
              {scout.progreso_general}%
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-4" />
              <p className="text-gray-500">Cargando detalle...</p>
            </div>
          ) : (
            <>
              {/* Resumen de Progreso */}
              <div className="bg-amber-50 rounded-xl p-4">
                <h3 className="font-semibold text-amber-800 mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Resumen de Progreso
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {scout.objetivos_logrados}
                    </div>
                    <div className="text-xs text-gray-500">Objetivos Logrados</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {scout.total_objetivos}
                    </div>
                    <div className="text-xs text-gray-500">Total Objetivos</div>
                  </div>
                </div>
              </div>

              {/* Etapa Actual */}
              {scout.etapa_actual_nombre && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Etapa Actual
                  </h3>
                  <p className="text-blue-700 text-lg font-medium">
                    {scout.etapa_actual_nombre}
                  </p>
                </div>
              )}

              {/* Áreas de Crecimiento */}
              {detalleProgreso?.areas && detalleProgreso.areas.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Áreas de Crecimiento
                  </h3>
                  
                  <div className="space-y-3">
                    {detalleProgreso.areas.map((area: any) => (
                      <div key={area.area_id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-700">{area.area_nombre}</span>
                          <span className={`text-sm font-bold ${getProgresoColor(area.progreso || 0)}`}>
                            {area.progreso || 0}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              (area.progreso || 0) >= 80 ? 'bg-green-500' :
                              (area.progreso || 0) >= 50 ? 'bg-yellow-500' :
                              (area.progreso || 0) >= 25 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${area.progreso || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {area.objetivos_logrados || 0}/{area.total_objetivos || 0} objetivos
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensaje si no hay detalle */}
              {(!detalleProgreso || !detalleProgreso.areas || detalleProgreso.areas.length === 0) && (
                <div className="text-center py-6 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay datos de progresión detallados disponibles.</p>
                  <p className="text-sm mt-1">Los objetivos se pueden registrar desde la versión web.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
