import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChevronRight, ChevronLeft, Check, AlertCircle, Loader } from 'lucide-react';
import InscripcionService, { type PersonaInscribible, type TipoDocumentoInscripcion } from '../../services/inscripcionService';

// ================================================================
// SCHEMA ZODA
// ================================================================

const filtrosSchema = z.object({
  periodoId: z.string().min(1, 'Selecciona un período'),
  rama: z.string().optional(),
});

type FiltrosForm = z.infer<typeof filtrosSchema>;

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

interface InscripcionAnualMobileProps {
  onComplete?: () => void;
}

export default function InscripcionAnualMobile({ onComplete }: InscripcionAnualMobileProps) {
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Datos
  const [periodos, setPeriodos] = useState<{ id: string; label: string }[]>([]);
  const [personas, setPersonas] = useState<PersonaInscribible[]>([]);
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState<Map<string, { monto: number | null }>>(new Map());
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoInscripcion[]>([]);
  const [docsSeleccionados, setDocsSeleccionados] = useState<Set<string>>(new Set());
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Formularios
  const filtrosForm = useForm<FiltrosForm>({
    resolver: zodResolver(filtrosSchema),
    defaultValues: { periodoId: '', rama: '' },
  });

  // ================================================================
  // EFECTOS
  // ================================================================

  useEffect(() => {
    cargarPeriodos();
    cargarTiposDocumento();
  }, []);

  // ================================================================
  // FUNCIONES
  // ================================================================

  const cargarPeriodos = async () => {
    try {
      const resultado = await InscripcionService.listarPeriodos();
      if (resultado.success && resultado.periodos) {
        const periodosMap = resultado.periodos.map(p => ({
          id: p.periodo_id,
          label: `${p.periodo_id}${p.vigente ? ' (Vigente)' : ''}`,
        }));
        setPeriodos(periodosMap);
        if (periodosMap.length > 0) {
          filtrosForm.setValue('periodoId', periodosMap[0].id);
        }
      }
    } catch (err) {
      setError('Error al cargar períodos');
    }
  };

  const cargarTiposDocumento = async () => {
    setLoadingDocs(true);
    try {
      const resultado = await InscripcionService.listarTiposDocumentoInscripcion(true);
      if (resultado.success) {
        const tipos = (resultado.tipos || []).slice().sort((a, b) => a.orden - b.orden);
        setTiposDocumento(tipos);
      }
    } catch {
      setTiposDocumento([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const cargarPersonas = useCallback(async (periodoId: string) => {
    if (!periodoId) return;
    setLoading(true);
    setError(null);
    try {
      const resultado = await InscripcionService.listarPersonasInscribibles(periodoId);
      if (resultado.success && resultado.personas) {
        setPersonas(resultado.personas);
        setPersonasSeleccionadas(new Map());
        setDocsSeleccionados(new Set());
      } else {
        setError(resultado.error || 'Error al cargar personas');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar personas');
    } finally {
      setLoading(false);
    }
  }, []);

  const onFiltrosSubmit = async (data: FiltrosForm) => {
    setError(null);
    await cargarPersonas(data.periodoId);
    setPaso(2);
  };

  const actualizarSeleccion = (personaId: string, seleccionado: boolean) => {
    const nuevaSeleccion = new Map(personasSeleccionadas);
    if (seleccionado) {
      nuevaSeleccion.set(personaId, { monto: null });
    } else {
      nuevaSeleccion.delete(personaId);
    }
    setPersonasSeleccionadas(nuevaSeleccion);
  };

  const actualizarMonto = (personaId: string, montoTexto: string) => {
    if (personasSeleccionadas.has(personaId)) {
      const valorNormalizado = montoTexto.replace(',', '.').trim();
      const monto = valorNormalizado === '' ? null : parseFloat(valorNormalizado);
      const nuevaSeleccion = new Map(personasSeleccionadas);
      nuevaSeleccion.set(personaId, { monto: Number.isNaN(monto as number) ? null : monto });
      setPersonasSeleccionadas(nuevaSeleccion);
    }
  };

  const montosInvalidos = Array.from(personasSeleccionadas.values()).some(
    p => p.monto === null || p.monto <= 0
  );

  const totalMonto = Array.from(personasSeleccionadas.values()).reduce(
    (sum, p) => sum + (p.monto || 0),
    0
  );

  const procedeConfirmacion = () => {
    setError(null);
    if (personasSeleccionadas.size === 0) {
      setError('Selecciona al menos una persona');
      return;
    }
    if (montosInvalidos) {
      setError('Completa un monto válido mayor a 0 para cada persona seleccionada');
      return;
    }
    setPaso(3);
  };

  const confirmarInscripciones = async () => {
    const periodoId = filtrosForm.getValues('periodoId');
    const personaIds = Array.from(personasSeleccionadas.keys());

    if (personaIds.length === 0) {
      setError('No hay personas seleccionadas');
      return;
    }

    if (montosInvalidos) {
      setError('Hay montos pendientes o inválidos. Revísalos antes de confirmar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resultado = await InscripcionService.inscribirPersonasMasivo(
        personaIds,
        periodoId
      );

      if (resultado.success) {
        if (docsSeleccionados.size > 0) {
          const docsIds = Array.from(docsSeleccionados);
          const inscripcionesPeriodo = await InscripcionService.obtenerInscripciones(periodoId);
          const nuevasInscripciones = (inscripcionesPeriodo.inscripciones || []).filter(i =>
            personaIds.includes(i.persona_id)
          );

          const operacionesDocs = nuevasInscripciones.flatMap(inscripcion =>
            docsIds.map(tipoId =>
              InscripcionService.marcarDocumento(inscripcion.inscripcion_id, tipoId, true)
            )
          );

          await Promise.allSettled(operacionesDocs);
        }

        setSuccess(`✅ ${resultado.total_inscritos} inscripciones registradas exitosamente`);
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      } else {
        setError(resultado.error || 'Error al inscribir');
      }
    } catch (err: any) {
      setError(err.message || 'Error al inscribir');
    } finally {
      setLoading(false);
    }
  };

  const obtenerCategoriaPersona = (persona: PersonaInscribible): string => {
    const rama = (persona.rama_actual || '').trim();
    if (rama) return rama;

    const tipo = (persona.tipo_registro || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (tipo === 'dirigente') return 'Dirigente';
    if (tipo === 'comite') return 'Comite';

    return '';
  };

  const filtrosRamas = ['', ...new Set(personas.map(obtenerCategoriaPersona).filter(Boolean))];
  const ramaFiltro = filtrosForm.watch('rama');
  const personasFiltradas = personas.filter(
    p => !ramaFiltro || obtenerCategoriaPersona(p) === ramaFiltro
  );

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stepper Mobile-Friendly */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex justify-between items-center gap-2">
            {[1, 2, 3].map((num) => (
              <React.Fragment key={num}>
                {num > 1 && <div className={`h-0.5 flex-1 ${paso >= num ? 'bg-blue-600' : 'bg-gray-300'}`} />}
                <button
                  onClick={() => num < paso && setPaso(num)}
                  disabled={num > paso}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    paso >= num
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {paso > num ? <Check className="w-4 h-4" /> : num}
                </button>
              </React.Fragment>
            ))}
          </div>
          <div className="text-xs text-center mt-2 text-gray-600">
            {paso === 1 && 'Filtros'}
            {paso === 2 && 'Seleccionar'}
            {paso === 3 && 'Confirmar'}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Mensajes */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2 text-sm">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-green-700">{success}</div>
          </div>
        )}

        {/* PASO 1: FILTROS */}
        {paso === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">Selecciona el Período</h2>

            <form onSubmit={filtrosForm.handleSubmit(onFiltrosSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                <select
                  {...filtrosForm.register('periodoId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Selecciona --</option>
                  {periodos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {filtrosForm.formState.errors.periodoId && (
                  <p className="text-xs text-red-600 mt-1">{filtrosForm.formState.errors.periodoId.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* PASO 2: SELECCIÓN */}
        {paso === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Selecciona Inscritos</h2>
              <p className="text-xs text-gray-500 mb-4">{personasFiltradas.length} personas disponibles</p>

              {/* Filtro Rama */}
              <select
                value={ramaFiltro}
                onChange={(e) => filtrosForm.setValue('rama', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las ramas</option>
                {filtrosRamas.map(rama => (
                  <option key={rama} value={rama}>
                    {rama}
                  </option>
                ))}
              </select>
            </div>

            {/* Tabla Móvil */}
            <div className="space-y-2">
              {personasFiltradas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Sin personas disponibles</p>
                </div>
              ) : (
                personasFiltradas.map((persona) => {
                  const seleccionado = personasSeleccionadas.has(persona.id);
                  return (
                    <div
                      key={persona.id}
                      className="bg-white border border-gray-200 rounded-lg p-3 space-y-2"
                    >
                      {/* Fila 1: Checkbox + Nombre */}
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={(e) => actualizarSeleccion(persona.id, e.target.checked)}
                          className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {persona.nombres} {persona.apellidos}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                              {obtenerCategoriaPersona(persona) || persona.tipo_registro}
                            </span>
                            {persona.tipo_registro !== 'Scout' && (
                              <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                {persona.tipo_registro}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Fila 2: Monto (solo si seleccionado) */}
                      {seleccionado && (
                        <div className="ml-7 border-t pt-2">
                          <label className="text-xs font-medium text-gray-700">Monto (S/.)</label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="Ej. 120.50"
                            value={personasSeleccionadas.get(persona.id)?.monto ?? ''}
                            onChange={(e) => actualizarMonto(persona.id, e.target.value)}
                            className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Resumen Selección */}
            {personasSeleccionadas.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-sm font-medium text-blue-900">
                  {personasSeleccionadas.size} seleccionado{personasSeleccionadas.size !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Total: S/ {totalMonto.toFixed(2)}
                </p>
              </div>
            )}

            {/* Botones Navegación */}
            <div className="flex gap-2 mt-6 pt-4 border-t">
              <button
                onClick={() => setPaso(1)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </button>
              <button
                onClick={procedeConfirmacion}
                disabled={personasSeleccionadas.size === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: CONFIRMACIÓN */}
        {paso === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Confirmar Inscripciones</h2>

            {/* Resumen */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600">Inscritos</p>
                  <p className="text-lg font-bold text-blue-900">{personasSeleccionadas.size}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Monto Total</p>
                  <p className="text-lg font-bold text-blue-900">
                    S/ {totalMonto.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Selección de DOCS */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">DOCS Entregados</p>
                {tiposDocumento.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (docsSeleccionados.size === tiposDocumento.length) {
                        setDocsSeleccionados(new Set());
                      } else {
                        setDocsSeleccionados(new Set(tiposDocumento.map(t => t.id)));
                      }
                    }}
                    className="text-xs text-blue-600 font-medium"
                  >
                    {docsSeleccionados.size === tiposDocumento.length ? 'Limpiar' : 'Seleccionar todos'}
                  </button>
                )}
              </div>

              {loadingDocs ? (
                <p className="text-xs text-gray-500">Cargando documentos...</p>
              ) : tiposDocumento.length === 0 ? (
                <p className="text-xs text-gray-500">No hay tipos de documento configurados</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {tiposDocumento.map((doc) => {
                    const marcado = docsSeleccionados.has(doc.id);
                    return (
                      <label key={doc.id} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={(e) => {
                            const nuevos = new Set(docsSeleccionados);
                            if (e.target.checked) nuevos.add(doc.id);
                            else nuevos.delete(doc.id);
                            setDocsSeleccionados(nuevos);
                          }}
                          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-gray-700">
                          {doc.nombre}
                          {doc.requerido && <span className="ml-1 text-red-500">*</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="text-[11px] text-gray-500">Los DOCS seleccionados se marcarán para todos los inscritos en esta operación.</p>
            </div>

            {/* Lista Resumen */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <p className="text-xs font-medium text-gray-700">Detalle:</p>
              {personas
                .filter(p => personasSeleccionadas.has(p.id))
                .map(p => (
                  <div key={p.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-900 truncate">{p.nombres}</p>
                      <p className="text-xs text-gray-500">{obtenerCategoriaPersona(p) || p.tipo_registro}</p>
                    </div>
                    <p className="font-bold text-gray-900">S/ {(personasSeleccionadas.get(p.id)?.monto || 0).toFixed(2)}</p>
                  </div>
                ))}
            </div>

            {/* Botones Navegación */}
            <div className="flex gap-2 mt-6 pt-4 border-t">
              <button
                onClick={() => setPaso(2)}
                disabled={loading}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-50 disabled:bg-gray-100 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </button>
              <button
                onClick={confirmarInscripciones}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
