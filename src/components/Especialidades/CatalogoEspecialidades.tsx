// ============================================================================
// CATÁLOGO DE ESPECIALIDADES
// ============================================================================
// Sistema de Gestión Scout - Grupo Scout Lima 12
// ============================================================================

import { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft,
  Filter,
  Clock,
  Target
} from 'lucide-react';
import EspecialidadesService from '../../services/especialidadesService';
import type { 
  Especialidad, 
  AreaEspecialidad,
  AreaId 
} from '../../types/especialidades';
import { AREA_COLORS, AREA_GRADIENTS } from '../../types/especialidades';

interface CatalogoEspecialidadesProps {
  areaInicial?: AreaId | null;
  onBack?: () => void;
  onSelectEspecialidad?: (especialidad: Especialidad) => void;
}

export default function CatalogoEspecialidades({ 
  areaInicial, 
  onBack,
  onSelectEspecialidad 
}: CatalogoEspecialidadesProps) {
  const [areas, setAreas] = useState<AreaEspecialidad[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [selectedArea, setSelectedArea] = useState<AreaId | null>(areaInicial || null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarEspecialidades();
  }, [selectedArea, search]);

  const cargarDatos = async () => {
    try {
      const areasData = await EspecialidadesService.obtenerAreasEspecialidad();
      setAreas(areasData);
    } catch (error) {
      console.error('Error cargando áreas:', error);
    }
  };

  const cargarEspecialidades = async () => {
    try {
      setLoading(true);
      const data = await EspecialidadesService.obtenerEspecialidades(
        selectedArea,
        search || null
      );
      setEspecialidades(data);
    } catch (error) {
      console.error('Error cargando especialidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAreaClick = (areaId: AreaId) => {
    setSelectedArea(selectedArea === areaId ? null : areaId);
    setExpanded(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            📚 Catálogo de Especialidades
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Explora las {especialidades.length} especialidades disponibles
          </p>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar especialidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>

          {/* Filtros de área */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedArea(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !selectedArea 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4 inline mr-1" />
              Todas
            </button>
            {areas.map((area) => (
              <button
                key={area.codigo}
                onClick={() => handleAreaClick(area.codigo)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedArea === area.codigo
                    ? `bg-gradient-to-r ${AREA_GRADIENTS[area.codigo]} text-white shadow-lg ring-2 ring-offset-2 ring-blue-300`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{area.icono}</span>
                <span className="hidden sm:inline">{area.nombre.split(',')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? 'Cargando...' : `${especialidades.length} especialidades encontradas`}
        </p>
        {selectedArea && (
          <button
            onClick={() => setSelectedArea(null)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Limpiar filtro
          </button>
        )}
      </div>

      {/* Lista de especialidades */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : especialidades.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No se encontraron especialidades
          </h3>
          <p className="text-gray-500">
            Intenta con otros términos de búsqueda o cambia el filtro de área
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {especialidades.map((esp) => (
            <EspecialidadCard
              key={esp.id}
              especialidad={esp}
              isExpanded={expanded === esp.id}
              onToggle={() => setExpanded(expanded === esp.id ? null : esp.id)}
              onSelect={() => onSelectEspecialidad?.(esp)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CARD DE ESPECIALIDAD
// ============================================================================

interface EspecialidadCardProps {
  especialidad: Especialidad;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect?: () => void;
}

function EspecialidadCard({ especialidad, isExpanded, onToggle, onSelect }: EspecialidadCardProps) {
  const areaColor = AREA_COLORS[especialidad.area.codigo as AreaId] || 'bg-gray-100 text-gray-700';
  const areaGradient = AREA_GRADIENTS[especialidad.area.codigo as AreaId] || 'from-gray-500 to-gray-600';

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header clickeable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Icono del área */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${areaGradient} flex items-center justify-center text-xl shadow-lg shrink-0`}>
          {especialidad.area.icono}
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 text-lg">
            {especialidad.nombre}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {especialidad.descripcion}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${areaColor}`}>
              {especialidad.area.nombre.split(',')[0]}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              ~{especialidad.tiempo_estimado_dias} días
            </span>
          </div>
        </div>

        {/* Toggle icon */}
        <div className="shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Contenido expandido */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4 animate-fade-in">
          {/* Fases */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FaseCard
              fase="exploracion"
              titulo="🔍 Exploración"
              descripcion={especialidad.exploracion}
              color="bg-blue-50 border-blue-200"
            />
            <FaseCard
              fase="taller"
              titulo="🔧 Taller"
              descripcion={especialidad.taller}
              color="bg-amber-50 border-amber-200"
            />
            <FaseCard
              fase="desafio"
              titulo="🎯 Desafío"
              descripcion={especialidad.desafio}
              color="bg-green-50 border-green-200"
            />
          </div>

          {/* Acción */}
          {onSelect && (
            <div className="flex justify-end pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                <Target className="w-4 h-4" />
                Asignar a Scout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface FaseCardProps {
  fase: string;
  titulo: string;
  descripcion: string;
  color: string;
}

/**
 * Parsea el texto de una fase en viñetas individuales.
 * El separador es " • " (punto medio con espacios)
 */
function parsearVinetas(texto: string): string[] {
  if (!texto || texto.trim() === '') return [];
  
  // Separar por el bullet point
  const vinetas = texto.split(' • ').map(v => v.trim()).filter(v => v.length > 0);
  
  // Si no hay separador, devolver el texto completo como una sola viñeta
  return vinetas.length > 0 ? vinetas : [texto];
}

function FaseCard({ titulo, descripcion, color }: FaseCardProps) {
  const vinetas = parsearVinetas(descripcion);
  
  return (
    <div className={`p-4 rounded-xl border ${color}`}>
      <h4 className="font-semibold text-gray-800 mb-3">{titulo}</h4>
      {vinetas.length === 1 ? (
        <p className="text-sm text-gray-600">{vinetas[0]}</p>
      ) : (
        <ul className="space-y-2">
          {vinetas.map((vineta, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-gray-400 mt-0.5 shrink-0">•</span>
              <span>{vineta}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
