// ============================================================================
// ADMIN OBJETIVOS PAGE
// ============================================================================
// Página de administración de objetivos educativos del sistema de progresión
// Permite crear, editar y eliminar objetivos con sus indicadores
// ============================================================================

import React, { useState } from 'react';
import { 
  Target, Plus, Search, RefreshCw, AlertCircle,
  Edit2, Trash2, ChevronDown, ChevronRight, X, Settings
} from 'lucide-react';
import { useObjetivosAdmin } from '../../hooks/useObjetivosAdmin';
import { Objetivo } from '../../services/progresionService';
import ObjetivoFormDialog from './ObjetivoFormDialog';

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface KPICardProps {
  titulo: string;
  valor: number | string;
  icono: React.ReactNode;
  colorClase: string;
}

const KPICard: React.FC<KPICardProps> = ({ titulo, valor, icono, colorClase }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colorClase}`}>
        {icono}
      </div>
      <div>
        <p className="text-sm text-gray-500">{titulo}</p>
        <p className="text-2xl font-bold text-gray-800">{valor}</p>
      </div>
    </div>
  </div>
);

interface ObjetivoCardProps {
  objetivo: Objetivo;
  onEdit: (objetivo: Objetivo) => void;
  onDelete: (objetivo: Objetivo) => void;
}

const ObjetivoCard: React.FC<ObjetivoCardProps> = ({ objetivo, onEdit, onDelete }) => {
  const [expandido, setExpandido] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {objetivo.etapa_nombre}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                {objetivo.area_icono} {objetivo.area_nombre}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {objetivo.codigo}
              </span>
            </div>
            
            {/* Título */}
            <h3 className="font-medium text-gray-900 line-clamp-2">
              {objetivo.titulo}
            </h3>
          </div>
          
          {/* Botón expandir */}
          <button
            type="button"
            className="p-1 text-gray-400 hover:text-gray-600"
            aria-label={expandido ? 'Contraer' : 'Expandir'}
          >
            {expandido ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* Contenido expandido */}
      {expandido && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          {/* Descripción */}
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Descripción</p>
            <p className="text-sm text-gray-700">{objetivo.descripcion}</p>
          </div>
          
          {/* Indicadores */}
          {objetivo.indicadores && objetivo.indicadores.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 font-medium mb-2">
                Indicadores de logro ({objetivo.indicadores.length})
              </p>
              <ul className="space-y-1">
                {objetivo.indicadores.map((indicador, idx) => (
                  <li 
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <span className="text-green-500 mt-0.5">✓</span>
                    {indicador}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(objetivo); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 
                         hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(objetivo); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 
                         hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const AdminObjetivosPage: React.FC = () => {
  // Hook de gestión
  const {
    objetivosFiltrados,
    etapas,
    areas,
    estado,
    filtros,
    estadisticas,
    cargarDatos,
    crearObjetivo,
    actualizarObjetivo,
    eliminarObjetivo,
    setFiltros,
    limpiarFiltros,
  } = useObjetivosAdmin();

  // Estado del diálogo
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [objetivoEditar, setObjetivoEditar] = useState<Objetivo | null>(null);
  const [confirmacionEliminar, setConfirmacionEliminar] = useState<Objetivo | null>(null);

  // Handlers
  const handleNuevoObjetivo = () => {
    setObjetivoEditar(null);
    setDialogAbierto(true);
  };

  const handleEditarObjetivo = (objetivo: Objetivo) => {
    setObjetivoEditar(objetivo);
    setDialogAbierto(true);
  };

  const handleEliminarObjetivo = (objetivo: Objetivo) => {
    setConfirmacionEliminar(objetivo);
  };

  const confirmarEliminacion = async () => {
    if (!confirmacionEliminar) return;
    
    try {
      await eliminarObjetivo(confirmacionEliminar.id);
      setConfirmacionEliminar(null);
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  const handleGuardarObjetivo = async (datos: Parameters<typeof crearObjetivo>[0]) => {
    if (objetivoEditar) {
      await actualizarObjetivo(objetivoEditar.id, datos);
    } else {
      await crearObjetivo(datos);
    }
    setDialogAbierto(false);
    setObjetivoEditar(null);
  };

  // Renderizado de loading
  if (estado.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando objetivos educativos...</p>
        </div>
      </div>
    );
  }

  // Renderizado de error
  if (estado.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Error al cargar</h3>
        <p className="text-gray-600 mb-4">{estado.error}</p>
        <button
          onClick={cargarDatos}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-7 h-7 text-amber-500" />
            Administrar Objetivos Educativos
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona los objetivos del sistema de progresión scout
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={cargarDatos}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 
                       rounded-lg hover:bg-gray-50 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleNuevoObjetivo}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white 
                       rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Nuevo Objetivo
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          titulo="Total Objetivos"
          valor={estadisticas.total}
          icono={<Target className="w-5 h-5 text-blue-600" />}
          colorClase="bg-blue-100"
        />
        {etapas.slice(0, 3).map(etapa => (
          <KPICard
            key={etapa.codigo}
            titulo={etapa.nombre}
            valor={estadisticas.porEtapa[etapa.codigo] || 0}
            icono={<span className="text-lg">{etapa.icono}</span>}
            colorClase="bg-gray-100"
          />
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              value={filtros.busqueda}
              onChange={(e) => setFiltros(f => ({ ...f, busqueda: e.target.value }))}
              placeholder="Buscar por título, descripción o código..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filtro por etapa */}
          <div className="w-full md:w-40">
            <select
              value={filtros.etapa}
              onChange={(e) => setFiltros(f => ({ ...f, etapa: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las etapas</option>
              {etapas.map(e => (
                <option key={e.codigo} value={e.codigo}>
                  {e.icono} {e.nombre}
                </option>
              ))}
            </select>
          </div>
          
          {/* Filtro por área */}
          <div className="w-full md:w-48">
            <select
              value={filtros.area}
              onChange={(e) => setFiltros(f => ({ ...f, area: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las áreas</option>
              {areas.map(a => (
                <option key={a.codigo} value={a.codigo}>
                  {a.icono} {a.nombre}
                </option>
              ))}
            </select>
          </div>
          
          {/* Limpiar filtros */}
          {(filtros.busqueda || filtros.etapa || filtros.area) && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 
                         hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Lista de objetivos */}
      {objetivosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {filtros.busqueda || filtros.etapa || filtros.area 
              ? 'No se encontraron objetivos'
              : 'No hay objetivos educativos'}
          </h3>
          <p className="text-gray-500 mb-4">
            {filtros.busqueda || filtros.etapa || filtros.area 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza creando el primer objetivo educativo'}
          </p>
          {!filtros.busqueda && !filtros.etapa && !filtros.area && (
            <button
              onClick={handleNuevoObjetivo}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white 
                         rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Objetivo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Mostrando {objetivosFiltrados.length} de {estadisticas.total} objetivos
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            {objetivosFiltrados.map(objetivo => (
              <ObjetivoCard
                key={objetivo.id}
                objetivo={objetivo}
                onEdit={handleEditarObjetivo}
                onDelete={handleEliminarObjetivo}
              />
            ))}
          </div>
        </div>
      )}

      {/* Diálogo de formulario */}
      {dialogAbierto && (
        <ObjetivoFormDialog
          objetivo={objetivoEditar}
          etapas={etapas}
          areas={areas}
          onGuardar={handleGuardarObjetivo}
          onCerrar={() => {
            setDialogAbierto(false);
            setObjetivoEditar(null);
          }}
          guardando={estado.guardando}
        />
      )}

      {/* Diálogo de confirmación de eliminación */}
      {confirmacionEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Confirmar eliminación
              </h3>
            </div>
            
            <p className="text-gray-600 mb-2">
              ¿Estás seguro de eliminar este objetivo?
            </p>
            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg mb-6">
              <strong>{confirmacionEliminar.codigo}</strong><br />
              {confirmacionEliminar.titulo}
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmacionEliminar(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminacion}
                disabled={estado.guardando}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
                           transition-colors disabled:opacity-50"
              >
                {estado.guardando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminObjetivosPage;
