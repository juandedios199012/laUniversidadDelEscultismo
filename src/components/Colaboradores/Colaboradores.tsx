/**
 * Vista principal de Colaboradores con diseño Glassmorphism
 * Incluye lista, filtros, búsqueda y acciones rápidas
 *
 * Clon independiente del módulo de Dirigentes: mismos datos/UI, pero
 * tabla y RPCs 100% separadas (personas distintas, sin relación con los
 * registros de la tabla `dirigentes`).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermissions } from '../../contexts/PermissionsContext';
import {
  GlassCard,
  MetricCard,
  Badge,
  Button,
  SelectField,
  Avatar,
  EmptyState,
  Skeleton,
  ProgressRing,
} from '../ui/GlassUI';
import {
  Colaborador,
  EstadisticasColaboradores,
  CARGOS_LABELS,
  NIVELES_FORMACION_LABELS,
  RAMAS_LABELS,
  CargoColaborador,
  NivelFormacion,
} from '../../types/colaborador';
import ColaboradorService from '../../services/colaboradorService';
import MembresiaService, { MapaMembresias } from '../../services/membresiaService';
import MembresiaBadge from '../shared/MembresiaBadge';
import FormularioColaboradorComponent from './FormularioColaborador';
import GestionDocumentos from './GestionDocumentos';
import { descargarPDFColaborador, descargarWordColaborador } from './generarPDFColaborador';

// ============================================================================
// ICONOS SVG
// ============================================================================

const Icons = {
  Users: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  UserPlus: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
  Award: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  Shield: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  AlertTriangle: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  FileText: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Search: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Filter: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Download: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Eye: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Edit: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  MoreVertical: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  ),
  CheckCircle: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  XCircle: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

// ============================================================================
// TIPOS
// ============================================================================

type Vista = 'lista' | 'formulario' | 'detalle' | 'documentos';

interface FiltrosState {
  busqueda: string;
  cargo: string;
  nivel_formacion: string;
  rama: string;
  estado: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const Colaboradores: React.FC = () => {
  // Permisos
  const { puedeCrear, puedeEditar, puedeEliminar, puedeExportar } = usePermissions();

  // Estados
  const [vista, setVista] = useState<Vista>('lista');
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasColaboradores | null>(null);
  const [loading, setLoading] = useState(true);
  const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState<Colaborador | null>(null);
  const [membresias, setMembresias] = useState<MapaMembresias>({});
  const [filtros, setFiltros] = useState<FiltrosState>({
    busqueda: '',
    cargo: '',
    nivel_formacion: '',
    rama: '',
    estado: 'ACTIVO',
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarMenuExportar, setMostrarMenuExportar] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [menuExportarIndividual, setMenuExportarIndividual] = useState<string | null>(null);

  // ==========================================================================
  // EFECTOS
  // ==========================================================================

  useEffect(() => {
    cargarDatos();
  }, []);

  // ==========================================================================
  // FUNCIONES
  // ==========================================================================

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [colaboradoresData, statsData, membresiasData] = await Promise.all([
        ColaboradorService.obtenerColaboradores({ estado: 'ACTIVO' }),
        ColaboradorService.obtenerEstadisticas(),
        MembresiaService.listarEstadoColaboradores(),
      ]);
      setColaboradores(colaboradoresData);
      setEstadisticas(statsData);
      setMembresias(membresiasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoColaborador = () => {
    if (!puedeCrear('colaboradores')) {
      alert('No tienes permiso para crear colaboradores');
      return;
    }
    setColaboradorSeleccionado(null);
    setVista('formulario');
  };

  const handleEditarColaborador = (colaborador: Colaborador) => {
    if (!puedeEditar('colaboradores')) {
      alert('No tienes permiso para editar colaboradores');
      return;
    }
    setColaboradorSeleccionado(colaborador);
    setVista('formulario');
  };

  const handleVerDocumentos = (colaborador: Colaborador) => {
    setColaboradorSeleccionado(colaborador);
    setVista('documentos');
  };

  const handleFormularioSuccess = () => {
    cargarDatos();
    setVista('lista');
  };

  const handleCancelarFormulario = () => {
    setVista('lista');
    setColaboradorSeleccionado(null);
  };

  // ==========================================================================
  // FUNCIONES DE EXPORTACIÓN
  // ==========================================================================

  const handleExportarCSV = () => {
    setExportando(true);
    try {
      // Crear cabeceras
      const headers = [
        'Código',
        'Apellidos',
        'Nombres',
        'Documento',
        'Correo',
        'Celular',
        'Cargo',
        'Unidad',
        'Nivel Formación',
        'SFH1 Aprobado',
        'Estado',
      ];

      // Crear filas de datos
      const rows = colaboradoresFiltrados.map((d) => [
        d.codigo_credencial || '',
        d.persona.apellidos || '',
        d.persona.nombres || '',
        `${d.persona.tipo_documento || 'DNI'} ${d.persona.numero_documento || ''}`,
        d.persona.correo || '',
        d.persona.celular || '',
        CARGOS_LABELS[d.cargo as CargoColaborador] || d.cargo,
        d.unidad || '',
        NIVELES_FORMACION_LABELS[d.nivel_formacion as NivelFormacion] || '',
        d.aprobo_sfh1 ? 'Sí' : 'No',
        d.estado || '',
      ]);

      // Convertir a CSV
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      // Descargar
      const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Colaboradores_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      alert('Error al exportar CSV');
    } finally {
      setExportando(false);
      setMostrarMenuExportar(false);
    }
  };

  const handleExportarTodosPDF = async () => {
    if (colaboradoresFiltrados.length === 0) {
      alert('No hay colaboradores para exportar');
      return;
    }

    setExportando(true);
    try {
      for (const colaborador of colaboradoresFiltrados) {
        await descargarPDFColaborador(colaborador);
        // Pequeña pausa para no saturar el navegador
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      alert(`Se descargaron ${colaboradoresFiltrados.length} PDF(s) exitosamente`);
    } catch (error) {
      console.error('Error al exportar PDFs:', error);
      alert('Error al exportar algunos PDFs');
    } finally {
      setExportando(false);
      setMostrarMenuExportar(false);
    }
  };

  const handleExportarPDFIndividual = async (colaborador: Colaborador) => {
    setExportando(true);
    try {
      await descargarPDFColaborador(colaborador);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar PDF');
    } finally {
      setExportando(false);
    }
  };

  const handleExportarWordIndividual = async (colaborador: Colaborador) => {
    setExportando(true);
    try {
      await descargarWordColaborador(colaborador);
    } catch (error) {
      console.error('Error al generar Word:', error);
      alert('Error al generar Word');
    } finally {
      setExportando(false);
    }
  };

  // Filtrar colaboradores
  const colaboradoresFiltrados = useMemo(() => {
    return colaboradores.filter((d) => {
      // Búsqueda por texto
      if (filtros.busqueda) {
        const termino = filtros.busqueda.toLowerCase();
        const nombreCompleto = `${d.persona.nombres} ${d.persona.apellidos}`.toLowerCase();
        const documento = d.persona.numero_documento?.toLowerCase() || '';
        const correo = d.persona.correo?.toLowerCase() || '';
        if (!nombreCompleto.includes(termino) && !documento.includes(termino) && !correo.includes(termino)) {
          return false;
        }
      }
      // Filtro por cargo
      if (filtros.cargo && d.cargo !== filtros.cargo) return false;
      // Filtro por nivel de formación
      if (filtros.nivel_formacion && d.nivel_formacion !== filtros.nivel_formacion) return false;
      // Filtro por rama
      if (filtros.rama && d.unidad !== filtros.rama) return false;
      // Filtro por estado
      if (filtros.estado && d.estado !== filtros.estado) return false;

      return true;
    });
  }, [colaboradores, filtros]);

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const renderEstadoBadge = (estado: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      ACTIVO: 'success',
      INACTIVO: 'default',
      SUSPENDIDO: 'warning',
      RETIRADO: 'danger',
    };
    return <Badge variant={variants[estado] || 'default'}>{estado}</Badge>;
  };

  const renderFormacionBadge = (nivel: NivelFormacion) => {
    const colors: Record<NivelFormacion, string> = {
      SIN_FORMACION: 'bg-slate-100 text-slate-600',
      SFH1: 'bg-cyan-100 text-cyan-700',
      INAF: 'bg-blue-100 text-blue-700',
      CAB: 'bg-purple-100 text-purple-700',
      CAF: 'bg-indigo-100 text-indigo-700',
      INSIGNIA_MADERA: 'bg-amber-100 text-amber-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[nivel]}`}>
        {NIVELES_FORMACION_LABELS[nivel]}
      </span>
    );
  };

  // ==========================================================================
  // RENDERIZADO CONDICIONAL POR VISTA
  // ==========================================================================

  if (vista === 'formulario') {
    return (
      <FormularioColaboradorComponent
        colaboradorId={colaboradorSeleccionado?.id}
        onSuccess={handleFormularioSuccess}
        onCancel={handleCancelarFormulario}
      />
    );
  }

  if (vista === 'documentos' && colaboradorSeleccionado) {
    return (
      <GestionDocumentos
        colaborador={colaboradorSeleccionado}
        onBack={() => setVista('lista')}
      />
    );
  }

  // ==========================================================================
  // RENDER PRINCIPAL (LISTA)
  // ==========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                Gestión de Colaboradores
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Adultos Voluntarios - Registro de Colaboradores
              </p>
            </div>

            <div className="flex gap-3">
              {/* Menú de Exportación */}
              <div className="relative">
                <Button
                  variant="outline"
                  icon={Icons.Download}
                  onClick={() => setMostrarMenuExportar(!mostrarMenuExportar)}
                  disabled={exportando}
                >
                  {exportando ? 'Exportando...' : 'Exportar'}
                </Button>

                <AnimatePresence>
                  {mostrarMenuExportar && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
                    >
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Exportar Lista
                        </div>
                        <button
                          onClick={handleExportarCSV}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                          <div className="text-left">
                            <span className="block font-medium">Exportar a CSV</span>
                            <span className="text-xs text-slate-500">Excel compatible</span>
                          </div>
                        </button>

                        <button
                          onClick={handleExportarTodosPDF}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <path d="M10 12h4M10 16h4M8 12h.01M8 16h.01" />
                          </svg>
                          <div className="text-left">
                            <span className="block font-medium">Descargar todos en PDF</span>
                            <span className="text-xs text-slate-500">{colaboradoresFiltrados.length} fichas de colaborador</span>
                          </div>
                        </button>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700 p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Individual (seleccionar en lista)
                        </div>
                        <div className="px-3 py-2 text-xs text-slate-400 flex items-center gap-2">
                          {Icons.FileText}
                          <span>Usa el botón en cada fila para PDF/Word individual</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Overlay para cerrar el menú */}
                {mostrarMenuExportar && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMostrarMenuExportar(false)}
                  />
                )}
              </div>

              <Button
                variant="primary"
                icon={Icons.UserPlus}
                onClick={handleNuevoColaborador}
              >
                Nuevo Colaborador
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Métricas */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <MetricCard
              title="Total Activos"
              value={estadisticas?.total_colaboradores || 0}
              icon={Icons.Users}
              color="blue"
              subtitle="Colaboradores registrados"
            />
            <MetricCard
              title="Con SFH1 Aprobado"
              value={estadisticas?.con_sfh1_aprobado || 0}
              icon={Icons.Shield}
              color="green"
              subtitle="Safe from Harm 1"
            />
            <MetricCard
              title="Documentos Completos"
              value={estadisticas?.con_documentos_completos || 0}
              icon={Icons.FileText}
              color="cyan"
              subtitle="Verificados"
            />
            <MetricCard
              title="Membresías por Vencer"
              value={estadisticas?.membresias_por_vencer || 0}
              icon={Icons.AlertTriangle}
              color="yellow"
              subtitle="Próximos 30 días"
            />
          </motion.div>
        )}

        {/* Barra de búsqueda y filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <GlassCard padding="md">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {Icons.Search}
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, documento o correo..."
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Toggle filtros */}
              <Button
                variant="secondary"
                icon={Icons.Filter}
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
              >
                Filtros
                {(filtros.cargo || filtros.nivel_formacion || filtros.rama) && (
                  <Badge variant="info" size="sm" className="ml-2">
                    Activos
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filtros expandibles */}
            <AnimatePresence>
              {mostrarFiltros && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                    <SelectField
                      label="Cargo"
                      value={filtros.cargo}
                      onChange={(e) => setFiltros(prev => ({ ...prev, cargo: e.target.value }))}
                      options={Object.entries(CARGOS_LABELS).map(([value, label]) => ({
                        value,
                        label,
                      }))}
                    />
                    <SelectField
                      label="Nivel de Formación"
                      value={filtros.nivel_formacion}
                      onChange={(e) => setFiltros(prev => ({ ...prev, nivel_formacion: e.target.value }))}
                      options={Object.entries(NIVELES_FORMACION_LABELS).map(([value, label]) => ({
                        value,
                        label,
                      }))}
                    />
                    <SelectField
                      label="Rama / Unidad"
                      value={filtros.rama}
                      onChange={(e) => setFiltros(prev => ({ ...prev, rama: e.target.value }))}
                      options={Object.entries(RAMAS_LABELS).map(([value, label]) => ({
                        value,
                        label,
                      }))}
                    />
                    <SelectField
                      label="Estado"
                      value={filtros.estado}
                      onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                      options={[
                        { value: 'ACTIVO', label: 'Activo' },
                        { value: 'INACTIVO', label: 'Inactivo' },
                        { value: 'SUSPENDIDO', label: 'Suspendido' },
                        { value: 'RETIRADO', label: 'Retirado' },
                      ]}
                    />
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFiltros({
                        busqueda: '',
                        cargo: '',
                        nivel_formacion: '',
                        rama: '',
                        estado: 'ACTIVO',
                      })}
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>

        {/* Resultados y contador */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Mostrando <span className="font-semibold text-slate-700 dark:text-slate-200">{colaboradoresFiltrados.length}</span> de{' '}
            <span className="font-semibold">{colaboradores.length}</span> colaboradores
          </p>
        </div>

        {/* Lista de colaboradores */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : colaboradoresFiltrados.length === 0 ? (
          <EmptyState
            icon={Icons.Users}
            title="No hay colaboradores que mostrar"
            description={
              filtros.busqueda || filtros.cargo || filtros.nivel_formacion || filtros.rama
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza registrando un nuevo colaborador'
            }
            action={
              !filtros.busqueda && !filtros.cargo
                ? { label: 'Registrar Colaborador', onClick: handleNuevoColaborador }
                : undefined
            }
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            {colaboradoresFiltrados.map((colaborador, index) => (
              <motion.div
                key={colaborador.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard hoverable glowColor="primary" padding="none">
                  <div className="flex items-center p-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0 mr-4">
                      <Avatar
                        name={`${colaborador.persona.nombres} ${colaborador.persona.apellidos}`}
                        size="lg"
                      />
                    </div>

                    {/* Información principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {colaborador.persona.apellidos}, {colaborador.persona.nombres}
                        </h3>
                        {renderEstadoBadge(colaborador.estado)}
                        <MembresiaBadge estado={membresias[colaborador.id]?.estado} />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-4">{Icons.Award}</span>
                          {CARGOS_LABELS[colaborador.cargo as CargoColaborador]}
                        </span>
                        {colaborador.unidad && (
                          <span>
                            {RAMAS_LABELS[colaborador.unidad as keyof typeof RAMAS_LABELS] || colaborador.unidad}
                          </span>
                        )}
                        {colaborador.persona.correo && (
                          <span className="truncate">{colaborador.persona.correo}</span>
                        )}
                      </div>
                    </div>

                    {/* Indicadores */}
                    <div className="hidden lg:flex items-center gap-4 mx-4">
                      {/* Formación */}
                      <div className="text-center">
                        {renderFormacionBadge(colaborador.nivel_formacion)}
                      </div>

                      {/* SFH1 */}
                      <div className="flex items-center gap-1" title={colaborador.aprobo_sfh1 ? 'SFH1 Aprobado' : 'Pendiente SFH1'}>
                        {colaborador.aprobo_sfh1 ? (
                          <span className="text-emerald-500">{Icons.CheckCircle}</span>
                        ) : (
                          <span className="text-amber-500">{Icons.XCircle}</span>
                        )}
                        <span className="text-xs text-slate-500">SFH1</span>
                      </div>

                      {/* Documentos */}
                      <div className="text-center" title="Documentos">
                        <ProgressRing
                          progress={
                            colaborador.total_documentos
                              ? ((colaborador.documentos_verificados || 0) / colaborador.total_documentos) * 100
                              : 0
                          }
                          size={40}
                          strokeWidth={4}
                          color="#06b6d4"
                        >
                          <span className="text-xs font-medium">
                            {colaborador.documentos_verificados || 0}/{colaborador.total_documentos || 0}
                          </span>
                        </ProgressRing>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1">
                      {/* Botones de exportación directos - Sin menú dropdown */}
                      <button
                        onClick={() => handleExportarPDFIndividual(colaborador)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 transition-colors"
                        title="Descargar PDF"
                      >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <path d="M12 18v-6M9 15l3 3 3-3" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleExportarWordIndividual(colaborador)}
                        className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-500 hover:text-blue-600 transition-colors"
                        title="Descargar Word editable"
                      >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <path d="M9 13h6M9 17h6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleVerDocumentos(colaborador)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-cyan-500 transition-colors"
                        title="Ver documentos"
                      >
                        {Icons.FileText}
                      </button>
                      <button
                        onClick={() => handleEditarColaborador(colaborador)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-cyan-500 transition-colors"
                        title="Editar"
                      >
                        {Icons.Edit}
                      </button>
                    </div>
                  </div>

                  {/* Barra móvil con indicadores */}
                  <div className="lg:hidden flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      {renderFormacionBadge(colaborador.nivel_formacion)}
                      <div className="flex items-center gap-1">
                        {colaborador.aprobo_sfh1 ? (
                          <span className="text-emerald-500">{Icons.CheckCircle}</span>
                        ) : (
                          <span className="text-amber-500">{Icons.XCircle}</span>
                        )}
                        <span className="text-xs text-slate-500">SFH1</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">
                      {colaborador.documentos_verificados || 0}/{colaborador.total_documentos || 0} docs
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Colaboradores;
