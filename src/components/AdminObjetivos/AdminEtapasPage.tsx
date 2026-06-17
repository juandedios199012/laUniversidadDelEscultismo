// ============================================================================
// ADMIN ETAPAS PAGE
// ============================================================================
// Página de administración de Etapas y Grupos de Objetivos por rama.
// Separado de "Objetivos Educativos" para reducir carga cognitiva.
// ============================================================================

import React, { useState } from 'react';
import {
  Layers, Plus, RefreshCw, AlertCircle,
  Edit2, Trash2, FolderOpen, Settings,
} from 'lucide-react';
import useEtapasAdmin from '../../hooks/useEtapasAdmin';
import { RAMAS, RamaCodigo, Etapa, GrupoObjetivo } from '../../services/progresionService';
import EtapaFormDialog from './EtapaFormDialog';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const AdminEtapasPage: React.FC = () => {
  // ---- Estado de rama activa -----------------------------------------------
  const [ramaActiva, setRamaActiva] = useState<RamaCodigo>('TROPA');

  // ---- Hook de datos --------------------------------------------------------
  const etapasAdmin = useEtapasAdmin(ramaActiva);

  // ---- Estado de diálogos ---------------------------------------------------
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [modoDialog, setModoDialog] = useState<'etapa' | 'grupo'>('etapa');
  const [etapaEditar, setEtapaEditar] = useState<Etapa | null>(null);
  const [grupoEditar, setGrupoEditar] = useState<GrupoObjetivo | null>(null);
  const [confirmacionEliminar, setConfirmacionEliminar] = useState<{
    tipo: 'etapa' | 'grupo';
    id: string;
    nombre: string;
  } | null>(null);

  // ---- Handlers -------------------------------------------------------------
  const abrirNuevaEtapa = () => {
    setModoDialog('etapa');
    setEtapaEditar(null);
    setGrupoEditar(null);
    setDialogAbierto(true);
  };
  const abrirNuevoGrupo = () => {
    setModoDialog('grupo');
    setEtapaEditar(null);
    setGrupoEditar(null);
    setDialogAbierto(true);
  };
  const abrirEditarEtapa = (e: Etapa) => {
    setModoDialog('etapa');
    setEtapaEditar(e);
    setGrupoEditar(null);
    setDialogAbierto(true);
  };
  const abrirEditarGrupo = (g: GrupoObjetivo) => {
    setModoDialog('grupo');
    setGrupoEditar(g);
    setEtapaEditar(null);
    setDialogAbierto(true);
  };
  const confirmarEliminar = async () => {
    if (!confirmacionEliminar) return;
    try {
      if (confirmacionEliminar.tipo === 'etapa') {
        await etapasAdmin.eliminarEtapa(confirmacionEliminar.id);
      } else {
        await etapasAdmin.eliminarGrupo(confirmacionEliminar.id);
      }
      setConfirmacionEliminar(null);
    } catch (err) {
      console.error(err);
    }
  };

  const ramaInfo = RAMAS.find(r => r.codigo === ramaActiva)!;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">

      {/* ---- HEADER ---- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Layers className="w-7 h-7 text-amber-500" />
            Etapas y Grupos
          </h1>
          <p className="text-gray-600 mt-1">
            Configura las etapas de progresión y los grupos de objetivos por rama
          </p>
        </div>
        <button
          onClick={etapasAdmin.cargarDatos}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors self-start md:self-auto"
          title="Actualizar"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Actualizar</span>
        </button>
      </div>

      {/* ---- SELECTOR DE RAMA ---- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Rama scout
        </p>
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

      {/* ---- ERROR ---- */}
      {etapasAdmin.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {etapasAdmin.error}
        </div>
      )}

      {/* ---- ETAPAS ---- */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              Etapas de {ramaInfo.icono} {ramaInfo.label}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Niveles de progresión dentro de esta rama
            </p>
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
            <p className="font-medium text-gray-600 mb-1">
              No hay etapas para {ramaInfo.label}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Crea la primera etapa de progresión
            </p>
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
              <div
                key={etapa.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="text-2xl w-10 text-center">{etapa.icono || '📍'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{etapa.nombre}</span>
                    <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                      {etapa.codigo}
                    </span>
                    {etapa.edad_tipica && (
                      <span className="text-xs text-gray-500">{etapa.edad_tipica} años</span>
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
                    onClick={() => setConfirmacionEliminar({
                      tipo: 'etapa',
                      id: etapa.id,
                      nombre: etapa.nombre,
                    })}
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

      {/* ---- GRUPOS DE OBJETIVOS ---- */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-500" />
              Grupos de Objetivos — {ramaInfo.icono} {ramaInfo.label}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Agrupaciones que contienen los objetivos educativos
            </p>
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
            <p className="font-medium text-gray-600 mb-1">
              No hay grupos para {ramaInfo.label}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Los grupos contienen los objetivos educativos
            </p>
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
              <div
                key={grupo.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{grupo.nombre}</span>
                    <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                      {grupo.codigo}
                    </span>
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
                    onClick={() => setConfirmacionEliminar({
                      tipo: 'grupo',
                      id: grupo.id,
                      nombre: grupo.nombre,
                    })}
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

      {/* ---- DIÁLOGO ---- */}
      <EtapaFormDialog
        open={dialogAbierto}
        onClose={() => {
          setDialogAbierto(false);
          setEtapaEditar(null);
          setGrupoEditar(null);
        }}
        modo={modoDialog}
        ramaActiva={ramaActiva}
        etapasDisponibles={etapasAdmin.etapas}
        etapaEditar={etapaEditar ?? undefined}
        grupoEditar={grupoEditar ?? undefined}
        guardando={etapasAdmin.guardando}
        onCrearEtapa={etapasAdmin.crearEtapa}
        onActualizarEtapa={etapasAdmin.actualizarEtapa}
        onCrearGrupo={etapasAdmin.crearGrupo}
        onActualizarGrupo={etapasAdmin.actualizarGrupo}
      />

      {/* ---- CONFIRMACIÓN ELIMINAR ---- */}
      {confirmacionEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Confirmar eliminación de{' '}
                {confirmacionEliminar.tipo === 'etapa' ? 'etapa' : 'grupo'}
              </h3>
            </div>
            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg mb-6">
              {confirmacionEliminar.nombre}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmacionEliminar(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={etapasAdmin.guardando}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {etapasAdmin.guardando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEtapasPage;
