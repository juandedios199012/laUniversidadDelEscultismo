// ============================================================================
// ADMIN OBJETIVOS PAGE
// ============================================================================
// Página de administración de objetivos educativos y etapas por rama
// ============================================================================

import React, { useState } from 'react';
import {
  Target, Plus, Search, RefreshCw, AlertCircle,
  Edit2, Trash2, ChevronDown, ChevronRight, X, Settings,
  Layers, FolderOpen,
} from 'lucide-react';
import { useObjetivosAdmin } from '../../hooks/useObjetivosAdmin';
import useEtapasAdmin from '../../hooks/useEtapasAdmin';
import { Objetivo, RAMAS, RamaCodigo, Etapa, GrupoObjetivo } from '../../services/progresionService';
import ObjetivoFormDialog from './ObjetivoFormDialog';
import EtapaFormDialog from './EtapaFormDialog';

// ============================================================================
// COMPONENTES AUXILIARES: KPI, ObjetivoCard
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
      <div className={`p-2 rounded-lg ${colorClase}`}>{icono}</div>
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
      <div className="p-4 cursor-pointer" onClick={() => setExpandido(!expandido)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {objetivo.grupo_nombre || objetivo.etapa_nombre}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                {objetivo.area_icono} {objetivo.area_nombre}
              </span>
              <span className="text-xs text-gray-400 font-mono">{objetivo.codigo}</span>
            </div>
            <h3 className="font-medium text-gray-900 line-clamp-2">{objetivo.titulo}</h3>
          </div>
          <button type="button" className="p-1 text-gray-400 hover:text-gray-600">
            {expandido ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {expandido && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          {objetivo.indicadores && objetivo.indicadores.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 font-medium mb-2">
                Indicadores de logro ({objetivo.indicadores.length})
              </p>
              <ul className="space-y-1">
                {objetivo.indicadores.map((indicador, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {indicador}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(objetivo); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Editar
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(objetivo); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Eliminar
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
  // ---- Hooks ----------------------------------------------------------------
  const {
    objetivosFiltrados,
    grupos,
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
    ramaActiva,
    setRamaActiva,
  } = useObjetivosAdmin();

  const etapasAdmin = useEtapasAdmin(ramaActiva);

  // ---- Tabs -----------------------------------------------------------------
  const [tabActiva, setTabActiva] = useState<'objetivos' | 'etapas'>('objetivos');

  // ---- Estado dialogo objetivos ---------------------------------------------
  const [dialogObjetivoAbierto, setDialogObjetivoAbierto] = useState(false);
  const [objetivoEditar, setObjetivoEditar] = useState<Objetivo | null>(null);
  const [confirmacionEliminarObj, setConfirmacionEliminarObj] = useState<Objetivo | null>(null);

  // ---- Estado dialogo etapas/grupos -----------------------------------------
  const [dialogEtapaAbierto, setDialogEtapaAbierto] = useState(false);
  const [modoDialog, setModoDialog] = useState<'etapa' | 'grupo'>('etapa');
  const [etapaEditar, setEtapaEditar] = useState<Etapa | null>(null);
  const [grupoEditar, setGrupoEditar] = useState<GrupoObjetivo | null>(null);
  const [confirmacionEliminarEtapa, setConfirmacionEliminarEtapa] = useState<{ tipo: 'etapa' | 'grupo'; id: string; nombre: string } | null>(null);

  // ---- Handlers objetivos ---------------------------------------------------
  const handleNuevoObjetivo = () => { setObjetivoEditar(null); setDialogObjetivoAbierto(true); };
  const handleEditarObjetivo = (o: Objetivo) => { setObjetivoEditar(o); setDialogObjetivoAbierto(true); };
  const handleGuardarObjetivo = async (datos: Parameters<typeof crearObjetivo>[0]) => {
    if (objetivoEditar) await actualizarObjetivo(objetivoEditar.id, datos);
    else await crearObjetivo(datos);
    setDialogObjetivoAbierto(false);
    setObjetivoEditar(null);
  };
  const confirmarEliminacionObj = async () => {
    if (!confirmacionEliminarObj) return;
    try { await eliminarObjetivo(confirmacionEliminarObj.id); setConfirmacionEliminarObj(null); }
    catch (err) { console.error(err); }
  };

  // ---- Handlers etapas/grupos -----------------------------------------------
  const abrirNuevaEtapa = () => { setModoDialog('etapa'); setEtapaEditar(null); setGrupoEditar(null); setDialogEtapaAbierto(true); };
  const abrirNuevoGrupo = () => { setModoDialog('grupo'); setEtapaEditar(null); setGrupoEditar(null); setDialogEtapaAbierto(true); };
  const abrirEditarEtapa = (e: Etapa) => { setModoDialog('etapa'); setEtapaEditar(e); setGrupoEditar(null); setDialogEtapaAbierto(true); };
  const abrirEditarGrupo = (g: GrupoObjetivo) => { setModoDialog('grupo'); setGrupoEditar(g); setEtapaEditar(null); setDialogEtapaAbierto(true); };

  const confirmarEliminarEtapaGrupo = async () => {
    if (!confirmacionEliminarEtapa) return;
    try {
      if (confirmacionEliminarEtapa.tipo === 'etapa') await etapasAdmin.eliminarEtapa(confirmacionEliminarEtapa.id);
      else await etapasAdmin.eliminarGrupo(confirmacionEliminarEtapa.id);
      setConfirmacionEliminarEtapa(null);
    } catch (err) { console.error(err); }
  };

  // ---- Rama info helper -----------------------------------------------------
  const ramaInfo = RAMAS.find(r => r.codigo === ramaActiva)!;

  // ---- Loading / Error states -----------------------------------------------
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

  if (estado.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Error al cargar</h3>
        <p className="text-gray-600 mb-4">{estado.error}</p>
        <button onClick={cargarDatos} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Reintentar
        </button>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">

      {/* ---- HEADER ---- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-7 h-7 text-amber-500" />
            Objetivos Educativos
          </h1>
          <p className="text-gray-600 mt-1">Gestiona objetivos, etapas y grupos del sistema de progresión scout</p>
        </div>
        <button
          onClick={cargarDatos}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors self-start md:self-auto"
          title="Actualizar"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Actualizar</span>
        </button>
      </div>

      {/* ---- SELECTOR DE RAMA ---- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Rama scout</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {RAMAS.map(rama => (
            <button
              key={rama.codigo}
              type="button"
              onClick={() => setRamaActiva(rama.codigo as RamaCodigo)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all
                ${ramaActiva === rama.codigo
                  ? `bg-gradient-to-r ${rama.color} text-white shadow-md scale-[1.02]`
                  : `${rama.bg} ${rama.text} hover:scale-[1.01] hover:shadow-sm`
                }
              `}
            >
              <span className="text-lg">{rama.icono}</span>
              <span>{rama.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ---- TABS PRINCIPALES ---- */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0">
          <button
            type="button"
            onClick={() => setTabActiva('objetivos')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tabActiva === 'objetivos'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Target className="w-4 h-4" />
            Objetivos Educativos
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('etapas')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tabActiva === 'etapas'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            Etapas por Rama
          </button>
        </nav>
      </div>

      {/* ======================================================================
          TAB: OBJETIVOS EDUCATIVOS
          ====================================================================== */}
      {tabActiva === 'objetivos' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KPICard
              titulo={`Objetivos ${ramaInfo.label}`}
              valor={estadisticas.total}
              icono={<Target className="w-5 h-5 text-blue-600" />}
              colorClase="bg-blue-100"
            />
            {grupos.map(grupo => (
              <KPICard
                key={grupo.codigo}
                titulo={grupo.nombre}
                valor={estadisticas.porGrupo[grupo.codigo] || 0}
                icono={<FolderOpen className="w-5 h-5 text-gray-600" />}
                colorClase="bg-gray-100"
              />
            ))}
          </div>

          {/* Acciones */}
          <div className="flex justify-end">
            <button
              onClick={handleNuevoObjetivo}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Nuevo Objetivo
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros(f => ({ ...f, busqueda: e.target.value }))}
                  placeholder="Buscar por título o código..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="w-full md:w-52">
                <select
                  value={filtros.grupo}
                  onChange={(e) => setFiltros(f => ({ ...f, grupo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los grupos</option>
                  {grupos.map(g => (
                    <option key={g.codigo} value={g.codigo}>{g.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-48">
                <select
                  value={filtros.area}
                  onChange={(e) => setFiltros(f => ({ ...f, area: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las áreas</option>
                  {areas.map(a => (
                    <option key={a.codigo} value={a.codigo}>{a.icono} {a.nombre}</option>
                  ))}
                </select>
              </div>
              {(filtros.busqueda || filtros.grupo || filtros.area) && (
                <button
                  onClick={limpiarFiltros}
                  className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" /> Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          {objetivosFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {filtros.busqueda || filtros.grupo || filtros.area
                  ? 'No se encontraron objetivos'
                  : `No hay objetivos para ${ramaInfo.label}`}
              </h3>
              <p className="text-gray-500 mb-4">
                {filtros.busqueda || filtros.grupo || filtros.area
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : `Crea el primer objetivo educativo para ${ramaInfo.label}`}
              </p>
              {!filtros.busqueda && !filtros.grupo && !filtros.area && (
                <button
                  onClick={handleNuevoObjetivo}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" /> Crear Objetivo
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
                    onDelete={(o) => setConfirmacionEliminarObj(o)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================
          TAB: ETAPAS POR RAMA
          ====================================================================== */}
      {tabActiva === 'etapas' && (
        <div className="space-y-8">

          {etapasAdmin.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {etapasAdmin.error}
            </div>
          )}

          {/* ---- Etapas ---- */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-500" />
                  Etapas de {ramaInfo.icono} {ramaInfo.label}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Niveles de progresión dentro de esta rama</p>
              </div>
              <button
                onClick={abrirNuevaEtapa}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Nueva Etapa
              </button>
            </div>

            {etapasAdmin.loading ? (
              <div className="p-8 text-center text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Cargando etapas...
              </div>
            ) : etapasAdmin.etapas.length === 0 ? (
              <div className="p-10 text-center">
                <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-600 mb-1">No hay etapas para {ramaInfo.label}</p>
                <p className="text-sm text-gray-400 mb-4">Crea la primera etapa de progresión</p>
                <button
                  onClick={abrirNuevaEtapa}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Crear Etapa
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {etapasAdmin.etapas.map(etapa => (
                  <div key={etapa.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="text-2xl w-10 text-center">{etapa.icono || '📍'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{etapa.nombre}</span>
                        <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{etapa.codigo}</span>
                        {etapa.edad_tipica && (
                          <span className="text-xs text-gray-500">~{etapa.edad_tipica} años</span>
                        )}
                      </div>
                      {etapa.descripcion && (
                        <p className="text-sm text-gray-500 truncate">{etapa.descripcion}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-center">#{etapa.orden}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEditarEtapa(etapa)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmacionEliminarEtapa({ tipo: 'etapa', id: etapa.id, nombre: etapa.nombre })}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ---- Grupos de Objetivos ---- */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-blue-500" />
                  Grupos de Objetivos — {ramaInfo.icono} {ramaInfo.label}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Agrupaciones que contienen los objetivos educativos</p>
              </div>
              <button
                onClick={abrirNuevoGrupo}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Nuevo Grupo
              </button>
            </div>

            {etapasAdmin.loading ? (
              <div className="p-8 text-center text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Cargando grupos...
              </div>
            ) : etapasAdmin.grupos.length === 0 ? (
              <div className="p-10 text-center">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-600 mb-1">No hay grupos para {ramaInfo.label}</p>
                <p className="text-sm text-gray-400 mb-4">Los grupos contienen los objetivos educativos</p>
                <button
                  onClick={abrirNuevoGrupo}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Crear Grupo
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {etapasAdmin.grupos.map(grupo => (
                  <div key={grupo.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{grupo.nombre}</span>
                        <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{grupo.codigo}</span>
                      </div>
                      {grupo.descripcion && (
                        <p className="text-sm text-gray-500 truncate">{grupo.descripcion}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-center">#{grupo.orden}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEditarGrupo(grupo)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmacionEliminarEtapa({ tipo: 'grupo', id: grupo.id, nombre: grupo.nombre })}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ======================================================================
          DIÁLOGOS
          ====================================================================== */}

      {/* Diálogo de objetivo */}
      {dialogObjetivoAbierto && (
        <ObjetivoFormDialog
          objetivo={objetivoEditar}
          grupos={grupos}
          areas={areas}
          onGuardar={handleGuardarObjetivo}
          onCerrar={() => { setDialogObjetivoAbierto(false); setObjetivoEditar(null); }}
          guardando={estado.guardando}
        />
      )}

      {/* Diálogo de etapa/grupo */}
      <EtapaFormDialog
        open={dialogEtapaAbierto}
        onClose={() => { setDialogEtapaAbierto(false); setEtapaEditar(null); setGrupoEditar(null); }}
        modo={modoDialog}
        ramaActiva={ramaActiva}
        etapaEditar={etapaEditar ?? undefined}
        grupoEditar={grupoEditar ?? undefined}
        guardando={etapasAdmin.guardando}
        onCrearEtapa={etapasAdmin.crearEtapa}
        onActualizarEtapa={etapasAdmin.actualizarEtapa}
        onCrearGrupo={etapasAdmin.crearGrupo}
        onActualizarGrupo={etapasAdmin.actualizarGrupo}
      />

      {/* Confirmación eliminar objetivo */}
      {confirmacionEliminarObj && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Confirmar eliminación</h3>
            </div>
            <p className="text-gray-600 mb-2">¿Estás seguro de eliminar este objetivo?</p>
            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg mb-6">
              <strong>{confirmacionEliminarObj.codigo}</strong><br />
              {confirmacionEliminarObj.titulo}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmacionEliminarObj(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
              <button onClick={confirmarEliminacionObj} disabled={estado.guardando} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                {estado.guardando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación eliminar etapa/grupo */}
      {confirmacionEliminarEtapa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Confirmar eliminación de {confirmacionEliminarEtapa.tipo === 'etapa' ? 'etapa' : 'grupo'}
              </h3>
            </div>
            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg mb-6">
              {confirmacionEliminarEtapa.nombre}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmacionEliminarEtapa(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
              <button onClick={confirmarEliminarEtapaGrupo} disabled={etapasAdmin.guardando} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                {etapasAdmin.guardando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminObjetivosPage;


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
                {objetivo.grupo_nombre || objetivo.etapa_nombre}
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
    grupos,
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard
          titulo="Total Objetivos"
          valor={estadisticas.total}
          icono={<Target className="w-5 h-5 text-blue-600" />}
          colorClase="bg-blue-100"
        />
        {grupos.map(grupo => (
          <KPICard
            key={grupo.codigo}
            titulo={grupo.nombre}
            valor={estadisticas.porGrupo[grupo.codigo] || 0}
            icono={<Target className="w-5 h-5 text-gray-600" />}
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
          
          {/* Filtro por grupo */}
          <div className="w-full md:w-52">
            <select
              value={filtros.grupo}
              onChange={(e) => setFiltros(f => ({ ...f, grupo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los grupos</option>
              {grupos.map(g => (
                <option key={g.codigo} value={g.codigo}>
                  {g.nombre}
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
          {(filtros.busqueda || filtros.grupo || filtros.area) && (
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
            {filtros.busqueda || filtros.grupo || filtros.area 
              ? 'No se encontraron objetivos'
              : 'No hay objetivos educativos'}
          </h3>
          <p className="text-gray-500 mb-4">
            {filtros.busqueda || filtros.grupo || filtros.area 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza creando el primer objetivo educativo'}
          </p>
          {!filtros.busqueda && !filtros.grupo && !filtros.area && (
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
          grupos={grupos}
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
