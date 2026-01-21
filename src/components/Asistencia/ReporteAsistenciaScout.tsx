import { useState, useEffect } from 'react';
import {
  ChevronLeft, Users, CheckCircle, XCircle, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ScoutAsistencia {
  id: string;
  codigo_scout: string;
  nombres: string;
  apellidos: string;
  rama_actual: string;
  total_reuniones: number;
  total_presente: number;
  total_ausente: number;
  porcentaje_asistencia: number;
}

interface ReporteAsistenciaScoutProps {
  onClose?: () => void;
}

export default function ReporteAsistenciaScout({ onClose }: ReporteAsistenciaScoutProps) {
  const [loading, setLoading] = useState(true);
  const [scouts, setScouts] = useState<ScoutAsistencia[]>([]);
  const [filtroRama, setFiltroRama] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroPorcentaje, setFiltroPorcentaje] = useState('');
  const [ordenarPor, setOrdenarPor] = useState<'nombre' | 'porcentaje'>('nombre');
  const [ordenAsc, setOrdenAsc] = useState(true);

  useEffect(() => {
    cargarScouts();
  }, []);

  const cargarScouts = async () => {
    try {
      setLoading(true);
      
      // Obtener scouts activos con sus estadísticas de asistencia
      const { data: scoutsData, error: scoutsError } = await supabase
        .from('scouts')
        .select(`
          id,
          codigo_asociado,
          rama_actual,
          personas!inner(nombres, apellidos)
        `)
        .eq('estado', 'ACTIVO')
        .order('personas(apellidos)');

      if (scoutsError) throw scoutsError;

      // Para cada scout, calcular sus estadísticas de asistencia
      const scoutsConAsistencia = await Promise.all(
        scoutsData.map(async (scout: any) => {
          const { data: asistencias } = await supabase
            .from('asistencias')
            .select('estado_asistencia, fecha')
            .eq('scout_id', scout.id);

          const total_reuniones = asistencias?.length || 0;
          const total_presente = asistencias?.filter(a => a.estado_asistencia === 'PRESENTE').length || 0;
          const total_ausente = asistencias?.filter(a => a.estado_asistencia === 'AUSENTE').length || 0;
          const porcentaje_asistencia = total_reuniones > 0 
            ? Math.round((total_presente / total_reuniones) * 100) 
            : 0;

          return {
            id: scout.id,
            codigo_scout: scout.codigo_asociado || 'S/C',
            nombres: scout.personas.nombres,
            apellidos: scout.personas.apellidos,
            rama_actual: scout.rama_actual,
            total_reuniones,
            total_presente,
            total_ausente,
            porcentaje_asistencia
          };
        })
      );

      setScouts(scoutsConAsistencia);
    } catch (error) {
      console.error('Error al cargar scouts:', error);
      alert('Error al cargar lista de scouts');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar scouts
  const scoutsFiltrados = scouts.filter(scout => {
    const matchRama = !filtroRama || scout.rama_actual === filtroRama;
    const matchBusqueda = !busqueda || 
      scout.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
      scout.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
      scout.codigo_scout.toLowerCase().includes(busqueda.toLowerCase());
    
    let matchPorcentaje = true;
    if (filtroPorcentaje === 'excelente') {
      matchPorcentaje = scout.porcentaje_asistencia >= 90;
    } else if (filtroPorcentaje === 'bueno') {
      matchPorcentaje = scout.porcentaje_asistencia >= 80 && scout.porcentaje_asistencia < 90;
    } else if (filtroPorcentaje === 'regular') {
      matchPorcentaje = scout.porcentaje_asistencia >= 60 && scout.porcentaje_asistencia < 80;
    } else if (filtroPorcentaje === 'bajo') {
      matchPorcentaje = scout.porcentaje_asistencia < 60;
    }
    
    return matchRama && matchBusqueda && matchPorcentaje;
  });

  // Ordenar scouts
  const scoutsOrdenados = [...scoutsFiltrados].sort((a, b) => {
    if (ordenarPor === 'nombre') {
      const nombreA = `${a.apellidos} ${a.nombres}`.toLowerCase();
      const nombreB = `${b.apellidos} ${b.nombres}`.toLowerCase();
      return ordenAsc ? nombreA.localeCompare(nombreB) : nombreB.localeCompare(nombreA);
    } else {
      return ordenAsc 
        ? a.porcentaje_asistencia - b.porcentaje_asistencia
        : b.porcentaje_asistencia - a.porcentaje_asistencia;
    }
  });

  const toggleOrden = (campo: 'nombre' | 'porcentaje') => {
    if (ordenarPor === campo) {
      setOrdenAsc(!ordenAsc);
    } else {
      setOrdenarPor(campo);
      setOrdenAsc(true);
    }
  };

  // Helper para colores según porcentaje
  const getColorPorcentaje = (porcentaje: number) => {
    if (porcentaje >= 80) return 'bg-green-100 text-green-800';
    if (porcentaje >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reporte de Asistencia por Scout</h1>
                <p className="text-sm text-gray-600">Vista general de todos los scouts activos</p>
              </div>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <select
              value={filtroRama}
              onChange={(e) => setFiltroRama(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las ramas</option>
              <option value="MANADA">Manada</option>
              <option value="TROPA">Tropa</option>
              <option value="COMUNIDAD">Comunidad</option>
              <option value="CLAN">Clan</option>
            </select>
            <select
              value={filtroPorcentaje}
              onChange={(e) => setFiltroPorcentaje(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los porcentajes</option>
              <option value="excelente">Excelente (≥90%)</option>
              <option value="bueno">Bueno (80-89%)</option>
              <option value="regular">Regular (60-79%)</option>
              <option value="bajo">Bajo (&lt;60%)</option>
            </select>
            <input
              type="search"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tabla de Scouts */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando scouts...</p>
          </div>
        ) : scoutsFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron scouts
            </h3>
            <p className="text-gray-600">
              Intenta cambiar los filtros de búsqueda
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => toggleOrden('nombre')}
                        className="flex items-center gap-2 hover:text-gray-700"
                      >
                        Scout
                        {ordenarPor === 'nombre' ? (
                          ordenAsc ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rama
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Reuniones
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Presentes
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ausentes
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => toggleOrden('porcentaje')}
                        className="flex items-center gap-2 hover:text-gray-700 mx-auto"
                      >
                        % Asistencia
                        {ordenarPor === 'porcentaje' ? (
                          ordenAsc ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 opacity-30" />
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scoutsOrdenados.map((scout) => (
                    <tr key={scout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {scout.apellidos}, {scout.nombres}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {scout.rama_actual}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {scout.total_reuniones}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-900">{scout.total_presente}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-gray-900">{scout.total_ausente}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getColorPorcentaje(scout.porcentaje_asistencia)}`}>
                          {scout.porcentaje_asistencia}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Mostrando <span className="font-medium text-gray-900">{scoutsFiltrados.length}</span> scouts
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
