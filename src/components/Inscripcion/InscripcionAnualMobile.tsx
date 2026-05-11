import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChevronRight, ChevronLeft, Check, AlertCircle, Loader } from 'lucide-react';
import InscripcionService, { type PersonaInscribible } from '../../services/inscripcionService';

// ================================================================
// SCHEMA ZODA
// ================================================================

const filtrosSchema = z.object({
  periodoId: z.string().min(1, 'Selecciona un período'),
  rama: z.string().optional(),
});

const seleccionSchema = z.object({
  personas: z.record(
    z.object({
      seleccionado: z.boolean(),
      monto: z.number().positive('El monto debe ser mayor a 0'),
    })
  ).optional().default({}),
});

type FiltrosForm = z.infer<typeof filtrosSchema>;
type SeleccionForm = z.infer<typeof seleccionSchema>;

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
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState<Map<string, { monto: number }>>(new Map());

  // Formularios
  const filtrosForm = useForm<FiltrosForm>({
    resolver: zodResolver(filtrosSchema),
    defaultValues: { periodoId: '', rama: '' },
  });

  const seleccionForm = useForm<SeleccionForm>({
    resolver: zodResolver(seleccionSchema),
    defaultValues: { personas: {} },
  });

  // ================================================================
  // EFECTOS
  // ================================================================

  useEffect(() => {
    cargarPeriodos();
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

  const cargarPersonas = useCallback(async (periodoId: string) => {
    if (!periodoId) return;
    setLoading(true);
    setError(null);
    try {
      const resultado = await InscripcionService.listarPersonasInscribibles(periodoId);
      if (resultado.success && resultado.personas) {
        setPersonas(resultado.personas);
        // Inicializar formulario de selección
        const personasMap: Record<string, any> = {};
        resultado.personas.forEach(p => {
          personasMap[p.id] = { seleccionado: false, monto: 100 }; // Monto temporal
        });
        seleccionForm.reset({ personas: personasMap });
      } else {
        setError(resultado.error || 'Error al cargar personas');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar personas');
    } finally {
      setLoading(false);
    }
  }, [filtrosForm, seleccionForm]);

  const onFiltrosSubmit = async (data: FiltrosForm) => {
    setError(null);
    await cargarPersonas(data.periodoId);
    setPaso(2);
  };

  const actualizarSeleccion = (personaId: string, seleccionado: boolean, monto?: number) => {
    const nuevaSeleccion = new Map(personasSeleccionadas);
    if (seleccionado) {
      nuevaSeleccion.set(personaId, { monto: monto || 100 });
    } else {
      nuevaSeleccion.delete(personaId);
    }
    setPersonasSeleccionadas(nuevaSeleccion);
  };

  const actualizarMonto = (personaId: string, monto: number) => {
    if (personasSeleccionadas.has(personaId)) {
      const nuevaSeleccion = new Map(personasSeleccionadas);
      nuevaSeleccion.set(personaId, { monto });
      setPersonasSeleccionadas(nuevaSeleccion);
    }
  };

  const procedeConfirmacion = () => {
    if (personasSeleccionadas.size === 0) {
      setError('Selecciona al menos una persona');
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

    setLoading(true);
    setError(null);

    try {
      const resultado = await InscripcionService.inscribirPersonasMasivo(
        personaIds,
        periodoId
      );

      if (resultado.success) {
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

  const filtrosRamas = ['', ...new Set(personas.map(p => p.rama_actual).filter(Boolean))];
  const ramaFiltro = filtrosForm.watch('rama');
  const personasFiltradas = personas.filter(
    p => !ramaFiltro || p.rama_actual === ramaFiltro
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
                  <option key={rama || 'empty'} value={rama}>
                    {rama || '(Sin rama)'}
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
                              {persona.rama_actual || persona.tipo_registro}
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
                            min="0"
                            step="0.01"
                            value={personasSeleccionadas.get(persona.id)?.monto || 100}
                            onChange={(e) => actualizarMonto(persona.id, parseFloat(e.target.value) || 0)}
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
                  Total: S/ {Array.from(personasSeleccionadas.values()).reduce((sum, p) => sum + p.monto, 0).toFixed(2)}
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
                    S/ {Array.from(personasSeleccionadas.values()).reduce((sum, p) => sum + p.monto, 0).toFixed(2)}
                  </p>
                </div>
              </div>
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
                      <p className="text-xs text-gray-500">{p.rama_actual}</p>
                    </div>
                    <p className="font-bold text-gray-900">S/ {personasSeleccionadas.get(p.id)?.monto || 0}</p>
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
