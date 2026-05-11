import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Plus, Check, X, Edit2, Tag, DollarSign, RefreshCw, ChevronDown } from 'lucide-react';
import InscripcionService, { PerfilTarifa, TarifaPeriodo, PeriodoDisponible } from '../../services/inscripcionService';

// ================================================================
// SUBCOMPONENTE: Fila de tarifa editable
// ================================================================

interface FilaTarifaProps {
  tarifa: TarifaPeriodo;
  periodoId: string;
  onGuardado: () => void;
}

const FilaTarifa: React.FC<FilaTarifaProps> = ({ tarifa, periodoId, onGuardado }) => {
  const [editando, setEditando] = useState(false);
  const [valorInput, setValorInput] = useState(tarifa.monto?.toString() ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    const monto = parseFloat(valorInput);
    if (isNaN(monto) || monto <= 0) {
      setError('Ingresa un monto mayor a 0');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const resultado = await InscripcionService.upsertTarifaPeriodo(
        periodoId,
        tarifa.perfil_tarifa_id,
        monto
      );
      if (!resultado.success) throw new Error(resultado.error);
      setEditando(false);
      onGuardado();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const cancelar = () => {
    setValorInput(tarifa.monto?.toString() ?? '');
    setError(null);
    setEditando(false);
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {tarifa.codigo}
          </span>
          <span className="font-medium text-gray-900">{tarifa.nombre}</span>
        </div>
        {tarifa.descripcion && (
          <p className="text-xs text-gray-400 mt-0.5 ml-0">{tarifa.descripcion}</p>
        )}
      </td>
      <td className="py-3 px-4 text-right w-48">
        {editando ? (
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm text-gray-500">S/</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={valorInput}
              onChange={(e) => setValorInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') cancelar(); }}
              className="w-28 px-2 py-1 border-2 border-blue-400 rounded text-right font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="p-1.5 text-white bg-green-600 hover:bg-green-700 rounded disabled:bg-gray-300"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={cancelar}
              className="p-1.5 text-gray-500 hover:text-gray-700 border border-gray-300 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3">
            {tarifa.configurado && tarifa.monto !== null ? (
              <span className="text-lg font-bold text-gray-900">
                S/ {tarifa.monto.toFixed(2)}
              </span>
            ) : (
              <span className="text-sm text-gray-400 italic">Sin configurar</span>
            )}
            <button
              type="button"
              onClick={() => { setValorInput(tarifa.monto?.toString() ?? ''); setEditando(true); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
              title="Editar monto"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
        )}
        {error && <p className="text-red-500 text-xs mt-1 text-right">{error}</p>}
      </td>
    </tr>
  );
};

// ================================================================
// SUBCOMPONENTE: Modal para agregar/editar perfil
// ================================================================

interface ModalPerfilProps {
  perfilEditar: PerfilTarifa | null;
  onGuardado: () => void;
  onCerrar: () => void;
}

const ModalPerfil: React.FC<ModalPerfilProps> = ({ perfilEditar, onGuardado, onCerrar }) => {
  const [codigo, setCodigo] = useState(perfilEditar?.codigo ?? '');
  const [nombre, setNombre] = useState(perfilEditar?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(perfilEditar?.descripcion ?? '');
  const [orden, setOrden] = useState(perfilEditar?.orden?.toString() ?? '0');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEdicion = !!perfilEditar;

  const guardar = async () => {
    if (!codigo.trim() || !nombre.trim()) {
      setError('Código y nombre son obligatorios');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const resultado = await InscripcionService.upsertPerfilTarifa({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        orden: parseInt(orden) || 0,
        activo: true,
      });
      if (!resultado.success) throw new Error(resultado.error);
      onGuardado();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {esEdicion ? 'Editar Perfil' : 'Nuevo Perfil de Tarifa'}
          </h3>
          <button type="button" onClick={onCerrar} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          className="p-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              disabled={esEdicion}
              placeholder="ej: dirigente"
              className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Solo minúsculas, números y guion bajo. No se puede cambiar después.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre para mostrar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej: Jefatura / Dirigente"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción opcional"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orden en lista</label>
            <input
              type="number"
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              min="0"
              className="w-24 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </form>

        <div className="flex justify-end gap-3 p-5 border-t">
          <button type="button" onClick={onCerrar} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-gray-300"
          >
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Perfil'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

const ConfiguracionTarifasInscripcion: React.FC = () => {
  const [periodos, setPeriodos] = useState<PeriodoDisponible[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
  const [tarifas, setTarifas] = useState<TarifaPeriodo[]>([]);
  const [perfiles, setPerfiles] = useState<PerfilTarifa[]>([]);
  const [loading, setLoading] = useState(false);
  const [aplicandoTarifas, setAplicandoTarifas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mostrarModalPerfil, setMostrarModalPerfil] = useState(false);
  const [perfilEditar, setPerfilEditar] = useState<PerfilTarifa | null>(null);

  // ----------------------------------------------------------------
  // CARGA DE DATOS
  // ----------------------------------------------------------------

  const cargarPeriodos = useCallback(async () => {
    try {
      const resultado = await InscripcionService.listarPeriodos();
      if (resultado.success) {
        const lista: PeriodoDisponible[] = resultado.periodos || [];
        setPeriodos(lista);
        if (!periodoSeleccionado && lista.length > 0) {
          const vigente = lista.find((p) => p.vigente) ?? lista[0];
          setPeriodoSeleccionado(vigente.periodo_id);
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [periodoSeleccionado]);

  const cargarTarifas = useCallback(async () => {
    if (!periodoSeleccionado) return;
    setLoading(true);
    setError(null);
    try {
      const resultado = await InscripcionService.listarTarifasPeriodo(periodoSeleccionado);
      if (resultado.success) {
        setTarifas(resultado.tarifas ?? []);
      } else {
        setError(resultado.error ?? 'Error al cargar tarifas');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [periodoSeleccionado]);

  const cargarPerfiles = useCallback(async () => {
    try {
      const resultado = await InscripcionService.listarPerfilesTarifa();
      if (resultado.success) setPerfiles(resultado.perfiles ?? []);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargarPeriodos();
    cargarPerfiles();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    cargarTarifas();
  }, [cargarTarifas]);

  // ----------------------------------------------------------------
  // APLICAR TARIFAS A INSCRIPCIONES EXISTENTES
  // ----------------------------------------------------------------

  const aplicarTarifas = async () => {
    if (!window.confirm(
      `¿Aplicar las nuevas tarifas a todas las inscripciones PENDIENTES/PARCIALES del período ${periodoSeleccionado}?\n` +
      'Las inscripciones ya PAGADAS no serán modificadas.'
    )) return;

    setAplicandoTarifas(true);
    setError(null);
    try {
      const resultado = await InscripcionService.actualizarTarifasPeriodo(periodoSeleccionado);
      if (resultado.success) {
        setSuccess(`${resultado.filas_actualizadas} inscripciones actualizadas con las nuevas tarifas`);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(resultado.error ?? 'Error al aplicar tarifas');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAplicandoTarifas(false);
    }
  };

  // ----------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------

  const periodoInfo = periodos.find((p) => p.periodo_id === periodoSeleccionado);
  const tarifasConfiguradas = tarifas.filter((t) => t.configurado).length;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Settings className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarifas de Inscripción</h1>
          <p className="text-sm text-gray-500">
            Configura los montos por perfil y período. Los cambios no afectan inscripciones pasadas automáticamente.
          </p>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-center justify-between">
          <span className="text-red-800 text-sm">{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-800 text-sm">{success}</span>
        </div>
      )}

      {/* Selector de período */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-lg font-bold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              {periodos.map((p) => (
                <option key={p.periodo_id} value={p.periodo_id}>
                  {p.periodo_id}{p.vigente ? ' (Vigente)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {periodoInfo && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              periodoInfo.vigente ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {periodoInfo.vigente ? 'Vigente' : 'Cerrado'}
            </span>
          )}
          <span className="text-sm text-gray-400 ml-auto">
            {tarifasConfiguradas} de {tarifas.length} perfiles configurados
          </span>
        </div>
      </div>

      {/* Tabla de tarifas */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Montos por Perfil</h2>
          </div>
          <button
            type="button"
            onClick={aplicarTarifas}
            disabled={aplicandoTarifas || tarifasConfiguradas === 0}
            className="flex items-center gap-2 text-sm px-3 py-2 border border-orange-300 text-orange-700 hover:bg-orange-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Aplica los montos configurados a inscripciones pendientes del período"
          >
            <RefreshCw className={`h-4 w-4 ${aplicandoTarifas ? 'animate-spin' : ''}`} />
            {aplicandoTarifas ? 'Aplicando...' : 'Aplicar a Inscritos'}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3" />
            Cargando tarifas...
          </div>
        ) : tarifas.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <DollarSign className="mx-auto h-10 w-10 mb-3 opacity-30" />
            <p>No hay perfiles activos. Crea uno abajo.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="text-left py-2 px-4">Perfil</th>
                <th className="text-right py-2 px-4">Monto (S/)</th>
              </tr>
            </thead>
            <tbody>
              {tarifas.map((tarifa) => (
                <FilaTarifa
                  key={tarifa.perfil_tarifa_id}
                  tarifa={tarifa}
                  periodoId={periodoSeleccionado}
                  onGuardado={cargarTarifas}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Gestión de perfiles */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Perfiles de Tarifa</h2>
          </div>
          <button
            type="button"
            onClick={() => { setPerfilEditar(null); setMostrarModalPerfil(true); }}
            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Plus className="h-4 w-4" />
            Nuevo Perfil
          </button>
        </div>

        {perfiles.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Tag className="mx-auto h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No hay perfiles creados aún</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {perfiles.map((perfil) => (
              <li key={perfil.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 text-gray-700">
                    {perfil.codigo}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{perfil.nombre}</p>
                    {perfil.descripcion && (
                      <p className="text-xs text-gray-400">{perfil.descripcion}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setPerfilEditar(perfil); setMostrarModalPerfil(true); }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                  title="Editar perfil"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal de perfil */}
      {mostrarModalPerfil && (
        <ModalPerfil
          perfilEditar={perfilEditar}
          onGuardado={() => {
            setMostrarModalPerfil(false);
            cargarPerfiles();
            cargarTarifas();
          }}
          onCerrar={() => setMostrarModalPerfil(false)}
        />
      )}
    </div>
  );
};

export default ConfiguracionTarifasInscripcion;
