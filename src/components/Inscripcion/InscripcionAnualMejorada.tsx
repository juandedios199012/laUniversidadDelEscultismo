import React, { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle, Clock, DollarSign, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ScoutService from '../../services/scoutService';

// ================================================================
// INTERFACES
// ================================================================

interface Scout {
  id: string;
  codigo_scout: string;
  nombres: string;
  apellidos: string;
  rama_actual: string;
  numero_documento?: string;
  celular?: string;
  correo?: string;
  estado: string;
}

interface Inscripcion {
  inscripcion_id: string;
  scout_id: string;
  periodo_id: string;
  fecha_inscripcion: string;
  monto_inscripcion: number;
  monto_pagado: number;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'VENCIDO';
  observaciones?: string;
  scout: Scout;
  created_at: string;
}

interface Estadisticas {
  total_inscritos: number;
  total_recaudado: number;
  pendientes: number;
  pagados: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.FC<{ className?: string }>;
  color: 'blue' | 'green' | 'yellow' | 'emerald';
}

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

const InscripcionAnualMejorada: React.FC = () => {
  console.log('🚀 RENDER InscripcionAnualMejorada -', new Date().toISOString());
  
  const [periodoActual] = useState(new Date().getFullYear().toString());
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [scoutsActivos, setScoutsActivos] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para modales
  const [mostrarModal, setMostrarModal] = useState(false);
  const [scoutsSeleccionados, setScoutsSeleccionados] = useState<Set<string>>(new Set());
  const [montoInscripcion, setMontoInscripcion] = useState('120.00');

  // Estados para pago
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [inscripcionSeleccionada, setInscripcionSeleccionada] = useState<Inscripcion | null>(null);
  const [montoPago, setMontoPago] = useState('');

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroRama, setFiltroRama] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  // ================================================================
  // EFECTOS
  // ================================================================

  const cargarInscripciones = useCallback(async () => {
    console.log('⏰ INICIANDO cargarInscripciones -', new Date().toLocaleTimeString());
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Llamando a api_obtener_inscripciones con periodo:', periodoActual);
      const inicio = performance.now();
      
      const { data, error: rpcError } = await supabase.rpc('api_obtener_inscripciones', {
        p_periodo_id: periodoActual
      });
      
      const fin = performance.now();
      console.log(`⏱️ RPC tardó: ${(fin - inicio).toFixed(2)}ms`);
      console.log('📊 Respuesta RPC:', { data, error: rpcError });

      if (rpcError) {
        console.error('❌ Error RPC:', rpcError);
        throw rpcError;
      }

      if (data?.success) {
        console.log('✅ Inscripciones recibidas:', data.inscripciones?.length || 0);
        setInscripciones(data.inscripciones || []);
      } else {
        console.error('❌ Respuesta sin éxito:', data);
        setError(data?.error || 'Error desconocido');
      }
    } catch (err: any) {
      console.error('❌ Error al cargar inscripciones:', err);
      setError(err.message || 'Error al cargar inscripciones');
    } finally {
      console.log('✅ FINALIZANDO cargarInscripciones - setLoading(false)');
      setLoading(false);
    }
  }, [periodoActual]);

  useEffect(() => {
    console.log('🔧 useEffect EJECUTADO');
    cargarInscripciones();
  }, [cargarInscripciones]);

  const cargarDatos = async () => {
    await cargarInscripciones();
  };

  const cargarScoutsActivos = async () => {
    setLoading(true);
    try {
      const scouts = await ScoutService.searchScoutsWithFilters({
        estado: 'ACTIVO',
        limite: 200
      });
      setScoutsActivos(scouts || []);
    } catch (err: any) {
      console.error('Error al cargar scouts:', err);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // INSCRIPCIÓN MASIVA
  // ================================================================

  const abrirModalInscripcion = async () => {
    // Cargar scouts solo cuando se abre el modal
    await cargarScoutsActivos();
    setMostrarModal(true);
  };

  const inscribirTodos = async () => {
    // Cargar scouts solo cuando se ejecuta la acción
    await cargarScoutsActivos();
    
    const scoutsPendientes = scoutsActivos.filter(
      s => !inscripciones.some(i => i.scout_id === s.id)
    );

    if (scoutsPendientes.length === 0) {
      setError('No hay scouts pendientes para inscribir');
      return;
    }

    const confirmado = window.confirm(
      `¿Inscribir todos los ${scoutsPendientes.length} scouts activos por S/ ${montoInscripcion}?`
    );

    if (!confirmado) return;

    await inscribirMasivo(scoutsPendientes.map(s => s.id));
  };

  const inscribirSeleccionados = async () => {
    if (scoutsSeleccionados.size === 0) {
      setError('Selecciona al menos un scout');
      return;
    }

    await inscribirMasivo(Array.from(scoutsSeleccionados));
    setMostrarModal(false);
    setScoutsSeleccionados(new Set());
  };

  const inscribirMasivo = async (scoutIds: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('api_inscribir_masivo', {
        p_scout_ids: scoutIds,
        p_periodo_id: periodoActual,
        p_monto_inscripcion: parseFloat(montoInscripcion)
      });

      if (rpcError) throw rpcError;

      if (data?.success) {
        setSuccess(`${data.total_inscritos} inscripciones registradas exitosamente`);
        await cargarInscripciones();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data?.error || 'Error al inscribir');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // REGISTRO DE PAGOS
  // ================================================================

  const abrirModalPago = (inscripcion: Inscripcion) => {
    setInscripcionSeleccionada(inscripcion);
    const montoPendiente = inscripcion.monto_inscripcion - inscripcion.monto_pagado;
    setMontoPago(montoPendiente.toFixed(2));
    setMostrarModalPago(true);
  };

  const registrarPago = async () => {
    if (!inscripcionSeleccionada) return;

    const pago = parseFloat(montoPago);
    if (isNaN(pago) || pago <= 0) {
      setError('Ingrese un monto válido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('api_registrar_pago_inscripcion', {
        p_inscripcion_id: inscripcionSeleccionada.inscripcion_id,
        p_monto_pago: pago
      });

      if (rpcError) throw rpcError;

      if (data.success) {
        await cargarInscripciones();
        setSuccess(data.message);
        setMostrarModalPago(false);
        setInscripcionSeleccionada(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // CÁLCULOS Y FILTROS
  // ================================================================

  const estadisticas: Estadisticas = {
    total_inscritos: inscripciones.length,
    total_recaudado: inscripciones.reduce((sum, i) => sum + (i.monto_pagado || 0), 0),
    pendientes: inscripciones.filter(i => i.estado === 'PENDIENTE' || i.estado === 'PARCIAL').length,
    pagados: inscripciones.filter(i => i.estado === 'PAGADO').length
  };

  const scoutsInscritos = new Set(inscripciones.map(i => i.scout_id));
  const scoutsPendientes = scoutsActivos.filter(s => !scoutsInscritos.has(s.id));
  const totalScoutsPendientes = scoutsPendientes.length;

  const inscripcionesFiltradas = inscripciones.filter(i => {
    if (filtroEstado && i.estado !== filtroEstado) return false;
    if (filtroRama && i.scout.rama_actual !== filtroRama) return false;
    if (filtroBusqueda) {
      const busqueda = filtroBusqueda.toLowerCase();
      return (
        i.scout.nombres.toLowerCase().includes(busqueda) ||
        i.scout.apellidos.toLowerCase().includes(busqueda) ||
        i.scout.codigo_scout.toLowerCase().includes(busqueda)
      );
    }
    return true;
  });

  // ================================================================
  // COMPONENTE METRIC CARD
  // ================================================================

  const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      emerald: 'bg-emerald-50 text-emerald-600'
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    );
  };

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Inscripción Anual {periodoActual}
          </h1>
          <p className="text-gray-600">
            Gestión de inscripciones y seguimiento de pagos
          </p>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-blue-700">Cargando datos...</span>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Inscritos"
            value={estadisticas.total_inscritos}
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Pagados"
            value={estadisticas.pagados}
            icon={CheckCircle}
            color="green"
          />
          <MetricCard
            title="Pendientes"
            value={estadisticas.pendientes}
            icon={Clock}
            color="yellow"
          />
          <MetricCard
            title="Recaudado"
            value={`S/ ${estadisticas.total_recaudado.toFixed(2)}`}
            icon={DollarSign}
            color="emerald"
          />
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center">
              <X className="text-red-500 mr-2" />
              <span className="text-red-800">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-center">
              <CheckCircle className="text-green-500 mr-2" />
              <span className="text-green-800">{success}</span>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={inscribirTodos}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          >
            <Users className="h-5 w-5" />
            Inscribir Todos los Activos
          </button>

          <button
            onClick={abrirModalInscripcion}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
          >
            Inscripción Selectiva
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="PARCIAL">Parcial</option>
              <option value="PAGADO">Pagados</option>
            </select>

            <select
              value={filtroRama}
              onChange={(e) => setFiltroRama(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Todas las ramas</option>
              <option value="MANADA">Manada</option>
              <option value="TROPA">Tropa</option>
              <option value="COMUNIDAD">Comunidad</option>
              <option value="CLAN">Clan</option>
            </select>

            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Tabla de Inscripciones */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {inscripcionesFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-24 w-24 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-gray-700">No hay inscripciones aún</h3>
              <p className="text-gray-500 mb-4">Comienza inscribiendo scouts para el período {periodoActual}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scout</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inscripcionesFiltradas.map((inscripcion) => (
                    <tr key={inscripcion.inscripcion_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {inscripcion.scout.codigo_scout}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {inscripcion.scout.nombres} {inscripcion.scout.apellidos}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {inscripcion.scout.rama_actual}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            Total: S/ {inscripcion.monto_inscripcion.toFixed(2)}
                          </div>
                          {inscripcion.monto_pagado > 0 && (
                            <>
                              <div className="text-green-600">
                                Pagado: S/ {inscripcion.monto_pagado.toFixed(2)}
                              </div>
                              {inscripcion.monto_pagado < inscripcion.monto_inscripcion && (
                                <div className="text-red-600">
                                  Debe: S/ {(inscripcion.monto_inscripcion - inscripcion.monto_pagado).toFixed(2)}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            inscripcion.estado === 'PAGADO'
                              ? 'bg-green-100 text-green-800'
                              : inscripcion.estado === 'PARCIAL'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {inscripcion.estado === 'PAGADO' && '🟢 '}
                          {inscripcion.estado === 'PARCIAL' && '🔵 '}
                          {inscripcion.estado === 'PENDIENTE' && '🟡 '}
                          {inscripcion.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(inscripcion.estado === 'PENDIENTE' || inscripcion.estado === 'PARCIAL') && (
                          <button
                            onClick={() => abrirModalPago(inscripcion)}
                            className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-medium transition"
                          >
                            Registrar Pago
                          </button>
                        )}
                        {inscripcion.estado === 'PAGADO' && (
                          <span className="text-green-600 text-sm">✓ Completo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Inscripción Selectiva */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Inscripción Selectiva - {periodoActual}
                  </h2>
                  <button
                    onClick={() => setMostrarModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <label className="block text-sm font-bold text-amber-900 mb-2">
                    💰 Monto de Inscripción Anual
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={montoInscripcion}
                    onChange={(e) => setMontoInscripcion(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg text-lg font-semibold"
                  />
                </div>

                <div className="mb-4 flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <span className="font-medium text-gray-700">
                    {scoutsSeleccionados.size} scouts seleccionados
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={() => setScoutsSeleccionados(new Set(scoutsPendientes.map(s => s.id)))}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Seleccionar Todos
                    </button>
                    <button
                      onClick={() => setScoutsSeleccionados(new Set())}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Deseleccionar Todos
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {scoutsPendientes.map((scout) => (
                    <label
                      key={scout.id}
                      className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer border"
                    >
                      <input
                        type="checkbox"
                        checked={scoutsSeleccionados.has(scout.id)}
                        onChange={(e) => {
                          const newSet = new Set(scoutsSeleccionados);
                          if (e.target.checked) {
                            newSet.add(scout.id);
                          } else {
                            newSet.delete(scout.id);
                          }
                          setScoutsSeleccionados(newSet);
                        }}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            {scout.nombres} {scout.apellidos}
                          </span>
                          <span className="text-sm text-gray-500">{scout.rama_actual}</span>
                        </div>
                        <span className="text-sm text-gray-500">{scout.codigo_scout}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
                <button
                  onClick={() => setMostrarModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={inscribirSeleccionados}
                  disabled={scoutsSeleccionados.size === 0 || loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Inscribir Seleccionados ({scoutsSeleccionados.size})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Registrar Pago */}
        {mostrarModalPago && inscripcionSeleccionada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Registrar Pago</h2>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Scout:</p>
                  <p className="font-medium text-gray-900">
                    {inscripcionSeleccionada.scout.nombres} {inscripcionSeleccionada.scout.apellidos}
                  </p>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded">
                  <div>
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="font-semibold">S/ {inscripcionSeleccionada.monto_inscripcion.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Pagado</p>
                    <p className="font-semibold text-green-600">S/ {inscripcionSeleccionada.monto_pagado.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Saldo</p>
                    <p className="font-semibold text-red-600">
                      S/ {(inscripcionSeleccionada.monto_inscripcion - inscripcionSeleccionada.monto_pagado).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto a Pagar
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-lg font-semibold"
                  />
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
                <button
                  onClick={() => setMostrarModalPago(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={registrarPago}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                >
                  Registrar Pago
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InscripcionAnualMejorada;
