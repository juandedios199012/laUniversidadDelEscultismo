import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Edit2, FileText, Plus, Trash2, X } from 'lucide-react';
import InscripcionService, {
  AplicabilidadCriterio,
  AplicabilidadOperador,
  DocumentoReglaGrupo,
  TipoDocumentoInscripcion,
} from '../../services/inscripcionService';

interface ModalTipoDocumentoProps {
  tipoEditar: TipoDocumentoInscripcion | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

const ModalTipoDocumento: React.FC<ModalTipoDocumentoProps> = ({ tipoEditar, onCerrar, onGuardado }) => {
  const [nombre, setNombre] = useState(tipoEditar?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(tipoEditar?.descripcion ?? '');
  const [requerido, setRequerido] = useState(tipoEditar?.requerido ?? false);
  const [activo, setActivo] = useState(tipoEditar?.activo ?? true);
  const [orden, setOrden] = useState((tipoEditar?.orden ?? 0).toString());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEdicion = !!tipoEditar;

  const guardar = async () => {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const resultado = await InscripcionService.upsertTipoDocumentoInscripcion({
        id: tipoEditar?.id ?? null,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        requerido,
        activo,
        orden: parseInt(orden || '0', 10) || 0,
      });

      if (!resultado.success) throw new Error(resultado.error || 'No se pudo guardar');
      onGuardado();
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {esEdicion ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
          </h3>
          <button type="button" onClick={onCerrar} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          className="p-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Ficha médica"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
            <input
              type="number"
              min="0"
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="w-24 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-3 border rounded-lg">
              <input
                type="checkbox"
                checked={requerido}
                onChange={(e) => setRequerido(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700">Documento requerido</span>
            </label>

            <label className="flex items-center gap-2 p-3 border rounded-lg">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700">Activo</span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </form>

        <div className="flex justify-end gap-3 p-5 border-t">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-gray-300"
          >
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Tipo'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ConfiguracionDocumentosInscripcionProps {
  initialVista?: 'catalogo' | 'aplicabilidad';
}

const ConfiguracionDocumentosInscripcion: React.FC<ConfiguracionDocumentosInscripcionProps> = ({
  initialVista = 'catalogo',
}) => {
  const [vista, setVista] = useState<'catalogo' | 'aplicabilidad'>(initialVista);
  const [tipos, setTipos] = useState<TipoDocumentoInscripcion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [tipoEditar, setTipoEditar] = useState<TipoDocumentoInscripcion | null>(null);

  const [tipoSeleccionadoId, setTipoSeleccionadoId] = useState<string>('');
  const [reglas, setReglas] = useState<DocumentoReglaGrupo[]>([]);
  const [loadingReglas, setLoadingReglas] = useState(false);
  const [criterios, setCriterios] = useState<AplicabilidadCriterio[]>([]);
  const [operadores, setOperadores] = useState<AplicabilidadOperador[]>([]);

  const [grupoObjetivoId, setGrupoObjetivoId] = useState<string>('');
  const [criterioCodigo, setCriterioCodigo] = useState<string>('perfil');
  const [operadorCodigo, setOperadorCodigo] = useState<string>('eq');
  const [valorTexto, setValorTexto] = useState<string>('');
  const [valorLista, setValorLista] = useState<string>('');
  const [valorNumeroMin, setValorNumeroMin] = useState<string>('');
  const [valorNumeroMax, setValorNumeroMax] = useState<string>('');
  const [guardandoCondicion, setGuardandoCondicion] = useState(false);

  const cargarTipos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await InscripcionService.listarTiposDocumentoInscripcion(false);
      if (!resultado.success) throw new Error(resultado.error || 'No se pudo listar tipos');
      setTipos(resultado.tipos || []);
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTipos();
  }, [cargarTipos]);

  const cargarCatalogoAplicabilidad = useCallback(async () => {
    try {
      const resultado = await InscripcionService.listarCatalogoAplicabilidad();
      if (!resultado.success) throw new Error(resultado.error || 'No se pudo cargar catálogo');
      setCriterios(resultado.criterios || []);
      setOperadores(resultado.operadores || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar catálogo de aplicabilidad');
    }
  }, []);

  const cargarReglas = useCallback(async (tipoDocumentoId: string) => {
    if (!tipoDocumentoId) {
      setReglas([]);
      return;
    }

    setLoadingReglas(true);
    try {
      const resultado = await InscripcionService.listarReglasDocumentoInscripcion(tipoDocumentoId);
      if (!resultado.success) throw new Error(resultado.error || 'No se pudieron cargar reglas');
      setReglas(resultado.reglas || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar reglas');
    } finally {
      setLoadingReglas(false);
    }
  }, []);

  useEffect(() => {
    if (tipos.length > 0 && !tipoSeleccionadoId) {
      setTipoSeleccionadoId(tipos[0].id);
    }
  }, [tipos, tipoSeleccionadoId]);

  useEffect(() => {
    setVista(initialVista);
  }, [initialVista]);

  useEffect(() => {
    if (vista === 'aplicabilidad') {
      cargarCatalogoAplicabilidad();
    }
  }, [vista, cargarCatalogoAplicabilidad]);

  useEffect(() => {
    if (vista === 'aplicabilidad' && tipoSeleccionadoId) {
      cargarReglas(tipoSeleccionadoId);
    }
  }, [vista, tipoSeleccionadoId, cargarReglas]);

  const criterioActual = criterios.find((c) => c.codigo === criterioCodigo);

  const operadoresPermitidos = useMemo(() => {
    if (!criterioActual) return operadores;

    const porTipo: Record<string, string[]> = {
      number: ['eq', 'gte', 'lte', 'between'],
      string: ['eq', 'neq', 'in', 'not_in'],
      array_string: ['eq', 'neq', 'in', 'not_in'],
    };

    const permitidos = porTipo[criterioActual.tipo_dato] || [];
    return operadores.filter((o) => permitidos.includes(o.codigo));
  }, [criterioActual, operadores]);

  useEffect(() => {
    if (!operadoresPermitidos.some((o) => o.codigo === operadorCodigo)) {
      setOperadorCodigo(operadoresPermitidos[0]?.codigo || 'eq');
    }
  }, [operadoresPermitidos, operadorCodigo]);

  const limpiarFormularioCondicion = () => {
    setGrupoObjetivoId('');
    setCriterioCodigo('perfil');
    setOperadorCodigo('eq');
    setValorTexto('');
    setValorLista('');
    setValorNumeroMin('');
    setValorNumeroMax('');
  };

  const crearGrupo = async () => {
    if (!tipoSeleccionadoId) {
      setError('Selecciona un tipo de documento');
      return;
    }

    const nombre = window.prompt('Nombre del grupo de regla (ej: Solo dirigentes)', 'Nueva regla');
    if (nombre === null) return;

    try {
      const resultado = await InscripcionService.crearGrupoReglaDocumentoInscripcion({
        tipo_documento_id: tipoSeleccionadoId,
        nombre: nombre.trim() || null,
        prioridad: reglas.length,
        activo: true,
      });
      if (!resultado.success) throw new Error(resultado.error || 'No se pudo crear grupo');
      setSuccess('Grupo de regla creado');
      setTimeout(() => setSuccess(null), 3000);
      await cargarReglas(tipoSeleccionadoId);
    } catch (err: any) {
      setError(err.message || 'Error al crear grupo');
    }
  };

  const eliminarGrupo = async (grupoId: string) => {
    if (!window.confirm('¿Eliminar este grupo de regla y todas sus condiciones?')) return;
    try {
      const resultado = await InscripcionService.eliminarGrupoReglaDocumentoInscripcion(grupoId);
      if (!resultado.success) throw new Error(resultado.error || 'No se pudo eliminar grupo');
      setSuccess('Grupo eliminado');
      setTimeout(() => setSuccess(null), 3000);
      await cargarReglas(tipoSeleccionadoId);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar grupo');
    }
  };

  const eliminarCondicion = async (condicionId: string) => {
    if (!window.confirm('¿Eliminar esta condición?')) return;
    try {
      const resultado = await InscripcionService.eliminarCondicionReglaDocumentoInscripcion(condicionId);
      if (!resultado.success) throw new Error(resultado.error || 'No se pudo eliminar condición');
      setSuccess('Condición eliminada');
      setTimeout(() => setSuccess(null), 3000);
      await cargarReglas(tipoSeleccionadoId);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar condición');
    }
  };

  const guardarCondicion = async () => {
    if (!grupoObjetivoId) {
      setError('Selecciona el grupo de la condición');
      return;
    }

    setGuardandoCondicion(true);
    setError(null);
    try {
      const payload: {
        grupo_id: string;
        criterio_codigo: string;
        operador_codigo: string;
        valor_texto?: string | null;
        valor_numero_min?: number | null;
        valor_numero_max?: number | null;
        valor_json?: string[] | null;
      } = {
        grupo_id: grupoObjetivoId,
        criterio_codigo: criterioCodigo,
        operador_codigo: operadorCodigo,
      };

      if (criterioActual?.tipo_dato === 'number') {
        payload.valor_numero_min = valorNumeroMin.trim() !== '' ? Number(valorNumeroMin) : null;
        payload.valor_numero_max = valorNumeroMax.trim() !== '' ? Number(valorNumeroMax) : null;
      } else if (operadorCodigo === 'in' || operadorCodigo === 'not_in') {
        payload.valor_json = valorLista
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
      } else {
        payload.valor_texto = valorTexto.trim() || null;
      }

      const resultado = await InscripcionService.upsertCondicionReglaDocumentoInscripcion(payload);
      if (!resultado.success) throw new Error(resultado.error || 'No se pudo guardar condición');

      setSuccess('Condición guardada');
      setTimeout(() => setSuccess(null), 3000);
      limpiarFormularioCondicion();
      await cargarReglas(tipoSeleccionadoId);
    } catch (err: any) {
      setError(err.message || 'Error al guardar condición');
    } finally {
      setGuardandoCondicion(false);
    }
  };

  const renderCondicionValor = (condicion: any) => {
    if (condicion.valor_json && Array.isArray(condicion.valor_json)) {
      return `[${condicion.valor_json.join(', ')}]`;
    }
    if (condicion.valor_numero_min !== null || condicion.valor_numero_max !== null) {
      if (condicion.operador_codigo === 'between') {
        return `${condicion.valor_numero_min ?? '-'} .. ${condicion.valor_numero_max ?? '-'}`;
      }
      return `${condicion.valor_numero_min ?? condicion.valor_numero_max ?? '-'}`;
    }
    return condicion.valor_texto || '-';
  };

  const resumen = useMemo(() => {
    const total = tipos.length;
    const activos = tipos.filter((t) => t.activo).length;
    const requeridos = tipos.filter((t) => t.activo && t.requerido).length;
    return { total, activos, requeridos };
  }, [tipos]);

  const eliminar = async (tipo: TipoDocumentoInscripcion) => {
    if (!window.confirm(`¿Eliminar o desactivar "${tipo.nombre}"?`)) return;

    setError(null);
    setSuccess(null);
    try {
      const resultado = await InscripcionService.eliminarTipoDocumentoInscripcion(tipo.id);
      if (!resultado.success) throw new Error(resultado.error || 'No se pudo eliminar/desactivar');
      setSuccess(resultado.message || 'Operación realizada');
      setTimeout(() => setSuccess(null), 4000);
      await cargarTipos();
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Documento</h1>
          <p className="text-sm text-gray-500">
            Módulo de configuración independiente para administrar el checklist documental de inscripción.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-2 inline-flex gap-2">
        <button
          type="button"
          onClick={() => setVista('catalogo')}
          className={`px-4 py-2 text-sm rounded-lg transition ${
            vista === 'catalogo' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Catálogo
        </button>
        <button
          type="button"
          onClick={() => setVista('aplicabilidad')}
          className={`px-4 py-2 text-sm rounded-lg transition ${
            vista === 'aplicabilidad' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Aplicabilidad
        </button>
      </div>

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

      {vista === 'catalogo' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-gray-900">{resumen.total}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Activos</p>
              <p className="text-2xl font-bold text-blue-700">{resumen.activos}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Requeridos activos</p>
              <p className="text-2xl font-bold text-emerald-700">{resumen.requeridos}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Catálogo</h2>
              <button
                type="button"
                onClick={() => {
                  setTipoEditar(null);
                  setMostrarModal(true);
                }}
                className="flex items-center gap-1.5 text-sm px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <Plus className="h-4 w-4" />
                Nuevo Tipo
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3" />
                Cargando tipos...
              </div>
            ) : tipos.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="mx-auto h-10 w-10 mb-3 opacity-30" />
                <p>No hay tipos de documento aún</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    <th className="text-left py-2 px-4">Nombre</th>
                    <th className="text-center py-2 px-4">Requerido</th>
                    <th className="text-center py-2 px-4">Activo</th>
                    <th className="text-right py-2 px-4">Uso</th>
                    <th className="text-right py-2 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {[...tipos]
                    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre))
                    .map((tipo) => (
                      <tr key={tipo.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{tipo.nombre}</div>
                          <div className="text-xs text-gray-500">Orden: {tipo.orden}</div>
                          {tipo.descripcion && <div className="text-xs text-gray-400 mt-0.5">{tipo.descripcion}</div>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {tipo.requerido ? (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Sí</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">No</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {tipo.activo ? (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Activo</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Inactivo</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600">{tipo.total_uso || 0}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setTipoEditar(tipo);
                                setMostrarModal(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => eliminar(tipo)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Eliminar o desactivar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4 lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Tipo de Documento</h2>
            </div>

            <select
              className="w-full px-3 py-2 border rounded-lg text-sm"
              value={tipoSeleccionadoId}
              onChange={(e) => setTipoSeleccionadoId(e.target.value)}
            >
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>

            <div className="pt-2 border-t">
              <button
                type="button"
                onClick={crearGrupo}
                className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Nuevo Grupo (OR)
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Un documento aplica si cumple al menos un grupo.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Agregar Condición (AND)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={grupoObjetivoId}
                  onChange={(e) => setGrupoObjetivoId(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Selecciona un grupo</option>
                  {reglas.map((g) => (
                    <option key={g.grupo_id} value={g.grupo_id}>
                      {(g.nombre || 'Grupo sin nombre') + ` (prio ${g.prioridad})`}
                    </option>
                  ))}
                </select>

                <select
                  value={criterioCodigo}
                  onChange={(e) => setCriterioCodigo(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  {criterios.map((c) => (
                    <option key={c.codigo} value={c.codigo}>
                      {c.nombre}
                    </option>
                  ))}
                </select>

                <select
                  value={operadorCodigo}
                  onChange={(e) => setOperadorCodigo(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  {operadoresPermitidos.map((o) => (
                    <option key={o.codigo} value={o.codigo}>
                      {o.nombre}
                    </option>
                  ))}
                </select>

                {criterioActual?.tipo_dato === 'number' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={valorNumeroMin}
                      onChange={(e) => setValorNumeroMin(e.target.value)}
                      placeholder="Valor min"
                      className="px-3 py-2 border rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      value={valorNumeroMax}
                      onChange={(e) => setValorNumeroMax(e.target.value)}
                      placeholder="Valor max"
                      className="px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                ) : operadorCodigo === 'in' || operadorCodigo === 'not_in' ? (
                  <input
                    type="text"
                    value={valorLista}
                    onChange={(e) => setValorLista(e.target.value)}
                    placeholder="Valores separados por coma"
                    className="px-3 py-2 border rounded-lg text-sm"
                  />
                ) : (
                  <input
                    type="text"
                    value={valorTexto}
                    onChange={(e) => setValorTexto(e.target.value)}
                    placeholder="Valor"
                    className="px-3 py-2 border rounded-lg text-sm"
                  />
                )}
              </div>

              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={guardarCondicion}
                  disabled={guardandoCondicion}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300"
                >
                  {guardandoCondicion ? 'Guardando...' : 'Agregar Condición'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Reglas Configuradas</h3>
              {loadingReglas ? (
                <div className="text-sm text-gray-500">Cargando reglas...</div>
              ) : reglas.length === 0 ? (
                <div className="text-sm text-gray-500">Este documento no tiene reglas. Aplica para todos.</div>
              ) : (
                <div className="space-y-3">
                  {reglas.map((grupo) => (
                    <div key={grupo.grupo_id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900">{grupo.nombre || 'Grupo sin nombre'}</div>
                          <div className="text-xs text-gray-500">Prioridad: {grupo.prioridad}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarGrupo(grupo.grupo_id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Eliminar grupo
                        </button>
                      </div>

                      {grupo.condiciones.length === 0 ? (
                        <p className="text-xs text-gray-400">Sin condiciones: este grupo aplica siempre.</p>
                      ) : (
                        <div className="space-y-2">
                          {grupo.condiciones.map((condicion) => (
                            <div key={condicion.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                              <span className="text-gray-700">
                                {condicion.criterio_codigo} {condicion.operador_codigo} {renderCondicionValor(condicion)}
                              </span>
                              <button
                                type="button"
                                onClick={() => eliminarCondicion(condicion.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                Quitar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {mostrarModal && (
        <ModalTipoDocumento
          tipoEditar={tipoEditar}
          onCerrar={() => setMostrarModal(false)}
          onGuardado={() => {
            setMostrarModal(false);
            cargarTipos();
          }}
        />
      )}
    </div>
  );
};

export default ConfiguracionDocumentosInscripcion;
