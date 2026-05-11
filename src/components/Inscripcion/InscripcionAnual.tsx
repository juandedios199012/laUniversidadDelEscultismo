import React, { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle, Clock, DollarSign, Search, X, Trash2, Calendar, FileText } from 'lucide-react';
import ScoutService from '../../services/scoutService';
import InscripcionService, {
  type Inscripcion,
  type ConfiguracionPeriodo,
  type PeriodoDisponible,
  type TarifaPeriodo,
  type ChecklistItem,
  type ResumenChecklist,
  type Scout,
  type PersonaInscribible,
} from '../../services/inscripcionService';

// ================================================================
// INTERFACES LOCALES
// ================================================================

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

const normalizarTexto = (valor?: string | null) =>
  (valor ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

const esTipoRegistro = (valor: string | undefined, esperado: string) =>
  normalizarTexto(valor) === normalizarTexto(esperado);

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

const InscripcionAnual: React.FC = () => {
  
  // El período activo se determina por fecha, no por año del reloj
  const [periodoActual, setPeriodoActual] = useState('');
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [scoutsActivos, setScoutsActivos] = useState<Scout[]>([]);
  const [personasInscribibles, setPersonasInscribibles] = useState<PersonaInscribible[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Configuración de período
  const [periodosDisponibles, setPeriodosDisponibles] = useState<PeriodoDisponible[]>([]);
  const [configuracionPeriodo, setConfiguracionPeriodo] = useState<ConfiguracionPeriodo | null>(null);
  const [tarifasPeriodo, setTarifasPeriodo] = useState<TarifaPeriodo[]>([]);

  // Estados para modales
  const [mostrarModal, setMostrarModal] = useState(false);
  const [scoutsSeleccionados, setScoutsSeleccionados] = useState<Set<string>>(new Set());
  const [hermanosEnModal, setHermanosEnModal] = useState<Set<string>>(new Set());
  const [busquedaModal, setBusquedaModal] = useState('');
  const [filtroRamaModal, setFiltroRamaModal] = useState('');

  // Estados para pago
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [inscripcionSeleccionada, setInscripcionSeleccionada] = useState<Inscripcion | null>(null);
  const [montoPago, setMontoPago] = useState('');

  // Estados para checklist de documentos
  const [mostrarModalChecklist, setMostrarModalChecklist] = useState(false);
  const [inscripcionChecklist, setInscripcionChecklist] = useState<Inscripcion | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [resumenChecklist, setResumenChecklist] = useState<ResumenChecklist | null>(null);
  const [loadingChecklist, setLoadingChecklist] = useState(false);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroRama, setFiltroRama] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  // ================================================================
  // EFECTOS
  // ================================================================

  const cargarInscripciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await InscripcionService.obtenerInscripciones(periodoActual);
      if (resultado.success) {
        setInscripciones(resultado.inscripciones || []);
        if (resultado.config) setConfiguracionPeriodo(resultado.config);
      } else {
        setError(resultado.error || 'Error desconocido');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar inscripciones');
    } finally {
      setLoading(false);
    }
  }, [periodoActual]);

  useEffect(() => {
    cargarPeriodos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (periodoActual) {
      cargarInscripciones();
      cargarTarifasPeriodo(periodoActual);
    }
  }, [cargarInscripciones]);

  const cargarTarifasPeriodo = async (periodoId: string) => {
    try {
      const resultado = await InscripcionService.listarTarifasPeriodo(periodoId);
      if (resultado.success) setTarifasPeriodo(resultado.tarifas || []);
    } catch {
      setTarifasPeriodo([]);
    }
  };

  const determinarPeriodoActivo = (periodos: PeriodoDisponible[]): string => {
    const hoy = new Date();
    const vigente = periodos.find(p => {
      const apertura = new Date(p.fecha_apertura);
      const cierre = new Date(p.fecha_cierre);
      return hoy >= apertura && hoy <= cierre;
    });
    if (vigente) return vigente.periodo_id;
    if (periodos.length > 0) return periodos[0].periodo_id; // más reciente
    return new Date().getFullYear().toString();
  };

  const cargarPeriodos = async (mantenerPeriodoActual = false) => {
    try {
      const resultado = await InscripcionService.listarPeriodos();
      if (resultado.success) {
        const periodos: PeriodoDisponible[] = resultado.periodos || [];
        setPeriodosDisponibles(periodos);
        if (!mantenerPeriodoActual) {
          const activo = determinarPeriodoActivo(periodos);
          setPeriodoActual(activo);
        }
      }
    } catch {
      setPeriodoActual(new Date().getFullYear().toString());
    }
  };

  const cargarScoutsActivos = async () => {
    if (!periodoActual) return;
    setLoading(true);
    try {
      // Cargar scouts (para inscripción masiva por scout_id)
      const scouts = await ScoutService.searchScoutsWithFilters({ estado: 'ACTIVO', limite: 200 });
      setScoutsActivos((scouts || []) as Scout[]);

      // Cargar TODAS las personas inscribibles (scouts + dirigentes + comité)
      const resultado = await InscripcionService.listarPersonasInscribibles(periodoActual);
      if (resultado.success) {
        setPersonasInscribibles(resultado.personas || []);
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // INSCRIPCIÓN MASIVA
  // ================================================================

  const abrirModalInscripcion = async () => {
    await cargarScoutsActivos();
    setMostrarModal(true);
  };

  const inscribirTodos = async () => {
    await cargarScoutsActivos();

    // "Todos los activos" = scouts activos sin inscripción en el período
    const pendientes = scoutsActivos.filter(
      s => !inscripciones.some(i => i.scout_id === s.id)
    );

    if (pendientes.length === 0) {
      setError('No hay scouts pendientes para inscribir');
      return;
    }

    const tarifasConfiguradas = tarifasPeriodo.filter(t => t.configurado);
    if (tarifasConfiguradas.length === 0) {
      setError('Configure primero las tarifas del período en Configuración → Tarifas');
      return;
    }

    const confirmado = window.confirm(
      `¿Inscribir los ${pendientes.length} scouts activos? El monto se asignará automáticamente según el perfil de cada scout.`
    );
    if (!confirmado) return;

    await inscribirMasivo(pendientes.map(s => s.id));
  };

  const inscribirSeleccionados = async () => {
    if (scoutsSeleccionados.size === 0) {
      setError('Selecciona al menos una persona');
      return;
    }
    // scoutsSeleccionados guarda persona_id (campo 'id' de PersonaInscribible)
    const personaIds = Array.from(scoutsSeleccionados);
    setLoading(true);
    setError(null);
    try {
      const resultado = await InscripcionService.inscribirPersonasMasivo(personaIds, periodoActual);
      if (resultado.success) {
        setSuccess(`${resultado.total_inscritos} inscripciones registradas exitosamente`);
        setMostrarModal(false);
        setScoutsSeleccionados(new Set());
        setBusquedaModal('');
        setFiltroRamaModal('');
        await cargarInscripciones();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(resultado.error || 'Error al inscribir');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inscribirMasivo = async (scoutIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      // monto = null → el backend asigna la tarifa según el perfil de cada scout
      const resultado = await InscripcionService.inscribirMasivo(scoutIds, periodoActual, null);
      if (resultado.success) {
        setSuccess(`${resultado.total_inscritos} inscripciones registradas exitosamente`);
        await cargarInscripciones();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(resultado.error || 'Error al inscribir');
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

  const abrirChecklist = async (inscripcion: Inscripcion) => {
    setInscripcionChecklist(inscripcion);
    setMostrarModalChecklist(true);
    setLoadingChecklist(true);
    try {
      const resultado = await InscripcionService.obtenerChecklist(inscripcion.inscripcion_id);
      if (resultado.success) {
        setChecklist(resultado.checklist || []);
        setResumenChecklist(resultado.resumen ?? null);
      }
    } finally {
      setLoadingChecklist(false);
    }
  };

  const marcarDocumento = async (tipoId: string, entregado: boolean) => {
    if (!inscripcionChecklist) return;
    try {
      const resultado = await InscripcionService.marcarDocumento(
        inscripcionChecklist.inscripcion_id,
        tipoId,
        entregado
      );
      if (resultado.success) {
        setChecklist(prev => prev.map(item =>
          item.tipo_id === tipoId
            ? { ...item, entregado, fecha_entrega: entregado ? new Date().toISOString().split('T')[0] : null }
            : item
        ));
        setResumenChecklist(prev => {
          if (!prev) return prev;
          const delta = entregado ? 1 : -1;
          const item = checklist.find(i => i.tipo_id === tipoId);
          return {
            ...prev,
            entregados: prev.entregados + delta,
            req_ok: item?.requerido ? prev.req_ok + delta : prev.req_ok,
          };
        });
      }
    } catch { /* silencioso: el checklist mantiene su estado anterior */ }
  };

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
      const resultado = await InscripcionService.registrarPago(
        inscripcionSeleccionada.inscripcion_id,
        pago
      );
      if (resultado.success) {
        await cargarInscripciones();
        setSuccess(resultado.message ?? 'Pago registrado');
        setMostrarModalPago(false);
        setInscripcionSeleccionada(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(resultado.error ?? 'Error al registrar pago');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // CONFIGURACIÓN DE PERÍODO
  // ================================================================

  const crearNuevoPeriodo = async () => {
    const siguienteAnio = (parseInt(periodoActual || new Date().getFullYear().toString()) + 1).toString();
    if (periodosDisponibles.some(p => p.periodo_id === siguienteAnio)) {
      setPeriodoActual(siguienteAnio);
      return;
    }
    if (!window.confirm(`¿Crear el período ${siguienteAnio}? Podrás regresar al período actual usando el selector de año.`)) return;
    // Monto provisional; las tarifas reales se configuran en Configuración → Tarifas
    try {
      const resultado = await InscripcionService.upsertPeriodo(siguienteAnio, 1);
      if (!resultado.success) {
        setError(resultado.error || 'Error al crear período');
        return;
      }
      setSuccess(`Período ${siguienteAnio} creado. Válido hasta ${resultado.fecha_cierre}`);
      await cargarPeriodos(true);
      setPeriodoActual(siguienteAnio);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const eliminarInscripcion = async (inscripcion: Inscripcion) => {
    const nombre = `${inscripcion.scout.nombres} ${inscripcion.scout.apellidos}`;
    if (!window.confirm(`¿Eliminar la inscripción de ${nombre}? Esta acción no se puede deshacer.`)) return;

    setLoading(true);
    setError(null);

    try {
      const resultado = await InscripcionService.eliminarInscripcion(inscripcion.inscripcion_id);
      if (resultado.success) {
        await cargarInscripciones();
        setSuccess(`Inscripción de ${nombre} eliminada`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(resultado.error || 'Error al eliminar inscripción');
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

  // Para inscripción masiva de scouts (botón "Inscribir Todos")
  // Para el modal selectivo: todas las personas no inscritas (ya filtradas por la RPC)
  const personasPendientesModal = personasInscribibles;

  const scoutsPendientesFiltrados = personasPendientesModal.filter(s => {
    // Filtro unificado por rama/tipo
    if (filtroRamaModal) {
      if (filtroRamaModal === 'Dirigentes') {
        if (!esTipoRegistro(s.tipo_registro, 'Dirigente')) return false;
      } else if (filtroRamaModal === 'Comité') {
        if (!esTipoRegistro(s.tipo_registro, 'Comité')) return false;
      } else {
        // Es una rama específica (Manada, Scout, Caminante, Clan)
        if (s.rama_actual !== filtroRamaModal) return false;
      }
    }
    // Filtro de búsqueda por texto
    if (busquedaModal) {
      const q = busquedaModal.toLowerCase();
      return (
        s.nombres.toLowerCase().includes(q) ||
        s.apellidos.toLowerCase().includes(q) ||
        s.codigo_scout?.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
        {/* Header: Título + Selector de Período + Config de Monto */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Inscripción Anual</h1>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">

              {/* Selector de período */}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <select
                  value={periodoActual}
                  onChange={(e) => { setPeriodoActual(e.target.value); setConfiguracionPeriodo(null); }}
                  className="text-xl font-bold border-0 focus:ring-0 bg-transparent cursor-pointer"
                >
                  {periodosDisponibles.map(p => (
                    <option key={p.periodo_id} value={p.periodo_id}>
                      {p.periodo_id}{p.vigente ? ' (Vigente)' : ''}
                    </option>
                  ))}
                  {periodosDisponibles.length === 0 && periodoActual && (
                    <option value={periodoActual}>{periodoActual}</option>
                  )}
                </select>
                {configuracionPeriodo && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    configuracionPeriodo.vigente
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {configuracionPeriodo.vigente ? 'Vigente' : 'Cerrado'}
                  </span>
                )}
                {configuracionPeriodo && (
                  <span className="text-xs text-gray-400">
                    Válido hasta {new Date(configuracionPeriodo.fecha_cierre + 'T12:00:00').toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Crear siguiente período */}
              <button
                type="button"
                onClick={crearNuevoPeriodo}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition"
              >
                + Nuevo Período
              </button>
            </div>
          </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perfil</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado Pago</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Docs</th>
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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          inscripcion.perfil_codigo === 'hermano'   ? 'bg-purple-100 text-purple-700' :
                          inscripcion.perfil_codigo === 'dirigente' ? 'bg-blue-100 text-blue-700' :
                          inscripcion.perfil_codigo === 'comite'    ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {inscripcion.perfil_nombre ?? inscripcion.perfil_codigo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              S/ {inscripcion.monto_inscripcion.toFixed(2)}
                            </span>
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
                              : inscripcion.estado === 'VENCIDO'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {inscripcion.estado}
                        </span>
                      </td>
                      {/* Columna: Documentos */}
                      <td className="px-4 py-4 text-center">
                        {inscripcion.docs_total > 0 ? (
                          <button
                            onClick={() => abrirChecklist(inscripcion)}
                            title={`Documentos: ${inscripcion.docs_entregados}/${inscripcion.docs_total}`}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition hover:scale-105 ${
                              inscripcion.docs_requeridos > 0 && inscripcion.docs_req_ok < inscripcion.docs_requeridos
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : inscripcion.docs_entregados === inscripcion.docs_total
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            }`}
                          >
                            <FileText className="h-3 w-3" />
                            {inscripcion.docs_entregados}/{inscripcion.docs_total}
                          </button>
                        ) : (
                          <button
                            onClick={() => abrirChecklist(inscripcion)}
                            title="Sin tipos de documento configurados"
                            className="p-1.5 text-gray-300 hover:text-teal-500 hover:bg-teal-50 rounded transition"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {(inscripcion.estado === 'PENDIENTE' || inscripcion.estado === 'PARCIAL') && (
                            <button
                              onClick={() => abrirModalPago(inscripcion)}
                              className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-medium transition whitespace-nowrap"
                            >
                              Pago
                            </button>
                          )}
                          {inscripcion.estado === 'PAGADO' && (
                            <span className="text-green-600 text-sm">✓</span>
                          )}
                          <button
                            onClick={() => eliminarInscripcion(inscripcion)}
                            title="Eliminar inscripción"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {mostrarModal && (() => {
          return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Inscripción Selectiva — {periodoActual}
                  </h2>
                  <button
                    onClick={() => {
                      setMostrarModal(false);
                      setHermanosEnModal(new Set());
                      setBusquedaModal('');
                      setFiltroRamaModal('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Filtros */}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="search"
                      placeholder="Buscar por nombre o código..."
                      value={busquedaModal}
                      onChange={e => setBusquedaModal(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <select
                    value={filtroRamaModal}
                    onChange={e => setFiltroRamaModal(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">Todos</option>
                    <option value="Manada">Manada</option>
                    <option value="Scout">Tropa Scout</option>
                    <option value="Caminante">Comunidad Caminante</option>
                    <option value="Clan">Clan</option>
                    <option value="Dirigentes">Dirigentes</option>
                    <option value="Comité">Comité</option>
                  </select>
                </div>
              </div>

              {/* Tarifas informativas */}
              {tarifasPeriodo.filter(t => t.configurado).length > 0 ? (
                <div className="px-6 py-3 bg-blue-50 border-b flex flex-wrap gap-4">
                  {tarifasPeriodo.filter(t => t.configurado).map(t => (
                    <span key={t.perfil_tarifa_id} className="text-sm text-blue-700">
                      {t.nombre}: <strong>S/ {t.monto!.toFixed(2)}</strong>
                    </span>
                  ))}
                  <span className="text-xs text-blue-500 self-center">· Monto asignado automáticamente por perfil</span>
                </div>
              ) : (
                <div className="px-6 py-3 bg-yellow-50 border-b">
                  <span className="text-sm text-yellow-800">⚠ Sin tarifas configuradas — ve a Inscripción → Tarifas</span>
                </div>
              )}

              {/* Barra de selección */}
              <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {scoutsSeleccionados.size} seleccionados
                  {busquedaModal || filtroRamaModal
                    ? ` · ${scoutsPendientesFiltrados.length} de ${personasPendientesModal.length} mostrados`
                    : ` de ${personasPendientesModal.length} pendientes`}
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setScoutsSeleccionados(new Set(scoutsPendientesFiltrados.map(s => s.id)))}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Seleccionar visibles
                  </button>
                  <button
                    type="button"
                    onClick={() => setScoutsSeleccionados(new Set())}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {/* Lista */}
              <div className="overflow-y-auto flex-1 p-4">
                {scoutsPendientesFiltrados.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Users className="mx-auto h-12 w-12 mb-3 text-gray-300" />
                    <p className="font-medium text-gray-500">Sin resultados</p>
                    <p className="text-sm mt-1">Ajusta los filtros para encontrar personas</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {scoutsPendientesFiltrados.map((scout) => (
                      <label
                        key={scout.id}
                        className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition"
                      >
                        <input
                          type="checkbox"
                          checked={scoutsSeleccionados.has(scout.id)}
                          onChange={(e) => {
                            const newSet = new Set(scoutsSeleccionados);
                            if (e.target.checked) { newSet.add(scout.id); } else { newSet.delete(scout.id); }
                            setScoutsSeleccionados(newSet);
                          }}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-gray-900 truncate">
                              {scout.nombres} {scout.apellidos}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {hermanosEnModal.has(scout.id) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                  👨‍👩‍👧 Hermano
                                </span>
                              )}
                              {(scout as PersonaInscribible).tipo_registro && !esTipoRegistro((scout as PersonaInscribible).tipo_registro, 'Scout') && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  esTipoRegistro((scout as PersonaInscribible).tipo_registro, 'Dirigente')
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {(scout as PersonaInscribible).tipo_registro}
                                </span>
                              )}
                              {scout.rama_actual && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                  {scout.rama_actual}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">{scout.codigo_scout}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
                <button
                  onClick={() => { setMostrarModal(false); setHermanosEnModal(new Set()); }}
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
          );
        })()}

        {/* Modal: Checklist de Documentos */}
        {mostrarModalChecklist && inscripcionChecklist && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-5 border-b flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-teal-600" />
                    Documentos
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {inscripcionChecklist.scout.nombres} {inscripcionChecklist.scout.apellidos}
                  </p>
                </div>
                <button onClick={() => setMostrarModalChecklist(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Resumen */}
              {resumenChecklist && resumenChecklist.total > 0 && (
                <div className="px-5 py-3 bg-gray-50 border-b flex gap-4 text-sm">
                  <span className="text-gray-600">
                    <span className="font-semibold text-gray-900">{resumenChecklist.entregados}</span>/{resumenChecklist.total} entregados
                  </span>
                  {resumenChecklist.requeridos > 0 && (
                    <span className={resumenChecklist.req_ok === resumenChecklist.requeridos ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {resumenChecklist.req_ok}/{resumenChecklist.requeridos} requeridos ✓
                    </span>
                  )}
                </div>
              )}

              <div className="overflow-y-auto flex-1 p-5">
                {loadingChecklist ? (
                  <div className="text-center py-8 text-gray-400">Cargando documentos...</div>
                ) : checklist.length === 0 ? (
                  <div className="text-center py-10">
                    <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">No hay tipos de documento configurados</p>
                    <p className="text-gray-400 text-xs mt-1">Ve a Inscripción &rsaquo; Tipos de Documento para agregar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {checklist.map(item => (
                      <label
                        key={item.tipo_id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          item.entregado ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.entregado}
                          onChange={e => marcarDocumento(item.tipo_id, e.target.checked)}
                          className="mt-0.5 h-4 w-4 text-teal-600 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${
                              item.entregado ? 'text-green-800' : 'text-gray-800'
                            }`}>{item.nombre}</span>
                            {item.requerido && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">Requerido</span>
                            )}
                          </div>
                          {item.descripcion && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.descripcion}</p>
                          )}
                          {item.entregado && item.fecha_entrega && (
                            <p className="text-xs text-green-600 mt-0.5">
                              Entregado: {new Date(item.fecha_entrega + 'T12:00:00').toLocaleDateString('es-PE')}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={() => setMostrarModalChecklist(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                >
                  Cerrar
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

export default InscripcionAnual;
