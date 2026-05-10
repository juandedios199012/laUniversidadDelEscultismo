import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GripVertical, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TipoDocumento {
  id: string;
  nombre: string;
  descripcion: string | null;
  requerido: boolean;
  activo: boolean;
  orden: number;
  total_uso: number;
}

interface FormTipo {
  nombre: string;
  descripcion: string;
  requerido: boolean;
  activo: boolean;
  orden: number;
}

const FORM_INICIAL: FormTipo = { nombre: '', descripcion: '', requerido: false, activo: true, orden: 0 };

export default function ConfigDocumentosInscripcion() {
  const [tipos, setTipos] = useState<TipoDocumento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<FormTipo>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargarTipos(); }, []);

  const cargarTipos = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.rpc('api_listar_tipos_documento_inscripcion', { p_solo_activos: false });
      if (data?.success) setTipos(data.tipos || []);
    } finally {
      setLoading(false);
    }
  };

  const abrirNuevo = () => {
    setEditandoId(null);
    setForm({ ...FORM_INICIAL, orden: tipos.filter(t => t.activo).length });
    setMostrarForm(true);
  };

  const abrirEditar = (tipo: TipoDocumento) => {
    setEditandoId(tipo.id);
    setForm({ nombre: tipo.nombre, descripcion: tipo.descripcion || '', requerido: tipo.requerido, activo: tipo.activo, orden: tipo.orden });
    setMostrarForm(true);
  };

  const cancelar = () => {
    setMostrarForm(false);
    setEditandoId(null);
    setForm(FORM_INICIAL);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return; }
    setGuardando(true);
    setError(null);
    try {
      const { data } = await supabase.rpc('api_upsert_tipo_documento_inscripcion', {
        p_id: editandoId,
        p_nombre: form.nombre.trim(),
        p_descripcion: form.descripcion.trim() || null,
        p_requerido: form.requerido,
        p_activo: form.activo,
        p_orden: form.orden,
      });
      if (!data?.success) throw new Error(data?.error || 'Error al guardar');
      setSuccess(editandoId ? 'Tipo actualizado' : 'Tipo creado');
      cancelar();
      await cargarTipos();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (tipo: TipoDocumento) => {
    const msg = tipo.total_uso > 0
      ? `"${tipo.nombre}" tiene ${tipo.total_uso} registros. Se desactivará en lugar de eliminarse. ¿Continuar?`
      : `¿Eliminar "${tipo.nombre}"?`;
    if (!window.confirm(msg)) return;
    try {
      const { data } = await supabase.rpc('api_eliminar_tipo_documento_inscripcion', { p_id: tipo.id });
      if (!data?.success) throw new Error(data?.error);
      setSuccess(data.message || 'Operación exitosa');
      await cargarTipos();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const toggleActivo = async (tipo: TipoDocumento) => {
    try {
      const { data } = await supabase.rpc('api_upsert_tipo_documento_inscripcion', {
        p_id: tipo.id,
        p_nombre: tipo.nombre,
        p_descripcion: tipo.descripcion,
        p_requerido: tipo.requerido,
        p_activo: !tipo.activo,
        p_orden: tipo.orden,
      });
      if (!data?.success) throw new Error(data?.error);
      await cargarTipos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  const tiposActivos = tipos.filter(t => t.activo);
  const tiposInactivos = tipos.filter(t => !t.activo);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-teal-600" />
            Tipos de Documento
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Define los documentos que debe entregar cada scout al inscribirse
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          Agregar tipo
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex justify-between items-start">
          <span className="text-red-800 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 ml-2">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <span className="text-green-800 text-sm">✅ {success}</span>
        </div>
      )}

      {/* Formulario inline */}
      {mostrarForm && (
        <div className="mb-6 bg-white border-2 border-teal-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">
            {editandoId ? 'Editar tipo' : 'Nuevo tipo de documento'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                placeholder="Ej: Ficha de inscripción firmada"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                type="text"
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                placeholder="Descripción opcional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
              <input
                type="number"
                value={form.orden}
                onChange={e => setForm({ ...form, orden: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                min={0}
              />
            </div>
            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requerido}
                  onChange={e => setForm({ ...form, requerido: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Requerido</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={e => setForm({ ...form, activo: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Activo</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium text-sm"
            >
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear tipo'}
            </button>
            <button
              type="button"
              onClick={cancelar}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!loading && tipos.length === 0 && (
        <div className="text-center py-16">
          <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Sin tipos de documento</h3>
          <p className="text-gray-500 mb-6">Define los documentos que se solicitarán en cada inscripción</p>
          <button
            type="button"
            onClick={abrirNuevo}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 font-medium"
          >
            Crear primer tipo
          </button>
        </div>
      )}

      {/* Lista activos */}
      {tiposActivos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Activos ({tiposActivos.length})</span>
          </div>
          <div className="divide-y divide-gray-100">
            {tiposActivos.map(tipo => (
              <div key={tipo.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">{tipo.nombre}</span>
                    {tipo.requerido && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">
                        Requerido
                      </span>
                    )}
                  </div>
                  {tipo.descripcion && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{tipo.descripcion}</p>
                  )}
                  {tipo.total_uso > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">Usado en {tipo.total_uso} inscripciones</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 w-6 text-center flex-shrink-0">{tipo.orden}</span>
                <button
                  type="button"
                  onClick={() => abrirEditar(tipo)}
                  className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleActivo(tipo)}
                  className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Desactivar"
                >
                  <ToggleRight className="h-4 w-4 text-teal-500" />
                </button>
                <button
                  type="button"
                  onClick={() => eliminar(tipo)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista inactivos */}
      {tiposInactivos.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden opacity-70">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-500">Inactivos ({tiposInactivos.length})</span>
          </div>
          <div className="divide-y divide-gray-100">
            {tiposInactivos.map(tipo => (
              <div key={tipo.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-400 line-through">{tipo.nombre}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActivo(tipo)}
                  className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                  title="Reactivar"
                >
                  <ToggleLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => eliminar(tipo)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
