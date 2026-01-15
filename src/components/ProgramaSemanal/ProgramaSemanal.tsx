import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Save, Plus, Target, Search, Edit, Eye, Trash2, CheckCircle, User, Trophy } from 'lucide-react';
import { ProgramaSemanalEntry, ProgramaActividad } from '../../lib/supabase';
import ProgramaSemanalService from '../../services/programaSemanalService';
import PuntajesActividad from './PuntajesActividad';
import RankingPatrullas from './RankingPatrullas';
import { formatFechaLocal } from '../../utils/dateUtils';

interface ProgramaSemanalProps {}

export default function ProgramaSemanalComplete({}: ProgramaSemanalProps) {
  // ============= ESTADOS =============
  const [programas, setProgramas] = useState<ProgramaSemanalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRama, setFilterRama] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('');

  // Estados para modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPrograma, setSelectedPrograma] = useState<ProgramaSemanalEntry | null>(null);
  
  // Estados para puntajes
  const [isPuntajesModalOpen, setIsPuntajesModalOpen] = useState(false);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<{ id: string; nombre: string; rama: string } | null>(null);

  // Estados para formularios
  const [createForm, setCreateForm] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    tema_central: '',
    rama: 'Tropa' as 'Manada' | 'Tropa' | 'Comunidad' | 'Clan',
    objetivos: [''],
    actividades: [{ nombre: '', desarrollo: '', hora_inicio: '09:00', duracion_minutos: 60, responsable: '', materiales: [''], observaciones: '' }] as ProgramaActividad[],
    responsable_programa: '',
    observaciones_generales: ''
  });

  const [editForm, setEditForm] = useState<typeof createForm>(createForm);

  // ============= DATOS DEMO Y CONFIGURACIÓN =============
  const ramas = [
    { value: 'Manada', label: 'Manada (7-10 años)', color: 'yellow' },
    { value: 'Tropa', label: 'Tropa (11-14 años)', color: 'green' },
    { value: 'Comunidad', label: 'Comunidad (15-17 años)', color: 'blue' },
    { value: 'Clan', label: 'Clan (18-21 años)', color: 'purple' }
  ];

  const estadosPrograma = [
    { value: 'PLANIFICADO', label: 'Planificado', color: 'blue' },
    { value: 'EN_CURSO', label: 'En Curso', color: 'yellow' },
    { value: 'COMPLETADO', label: 'Completado', color: 'green' },
    { value: 'CANCELADO', label: 'Cancelado', color: 'red' }
  ];

  // ============= EFECTOS =============
  useEffect(() => {
    loadProgramas();
  }, []);

  // ============= FUNCIONES DE CARGA =============
  const loadProgramas = async () => {
    setLoading(true);
    try {
      console.log('📅 Cargando programas semanales desde Supabase...');
      const programasData = await ProgramaSemanalService.getProgramas();
      // Normalizar actividades: siempre array
      const programasNormalizados = (programasData || []).map(p => ({
        ...p,
        actividades: Array.isArray(p.programa_actividades)
          ? p.programa_actividades
          : (Array.isArray(p.actividades) ? p.actividades : []),
      }));
      console.log('📊 Datos recibidos:', programasNormalizados.length, 'programas');
      setProgramas(programasNormalizados);
    } catch (error) {
      console.error('❌ Error loading programas semanales:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.warn(`⚠️ Usando datos demo debido al error: ${errorMessage}`);
      // Fallback a datos demo en caso de error
      const programasDemo: ProgramaSemanalEntry[] = [
        // ...demo data unchanged...
      ];
      setProgramas(programasDemo);
    } finally {
      setLoading(false);
    }
  };

  // ============= FUNCIONES DE MODAL =============
  const openCreateModal = () => {
    setCreateForm({
      fecha_inicio: '',
      fecha_fin: '',
      tema_central: '',
      rama: 'Tropa',
      objetivos: [''],
      actividades: [{ nombre: '', desarrollo: '', hora_inicio: '09:00', duracion_minutos: 60, responsable: '', materiales: [''], observaciones: '' }],
      responsable_programa: '',
      observaciones_generales: ''
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (programa: ProgramaSemanalEntry) => {
    setSelectedPrograma(programa);
    setEditForm({
      fecha_inicio: programa.fecha_inicio,
      fecha_fin: programa.fecha_fin,
      tema_central: programa.tema_central,
      rama: programa.rama || 'Tropa',
      objetivos: Array.isArray(programa.objetivos) ? programa.objetivos : [''],
      actividades: Array.isArray(programa.actividades) ? programa.actividades.map(a => ({
        ...a,
        desarrollo: a.desarrollo || a.descripcion || '',
        nombre: a.nombre || '',
        hora_inicio: a.hora_inicio || '',
        duracion_minutos: a.duracion_minutos || 0,
        responsable: a.responsable || '',
        materiales: Array.isArray(a.materiales) ? a.materiales : [''],
        observaciones: a.observaciones || ''
      })) : [{ nombre: '', desarrollo: '', hora_inicio: '09:00', duracion_minutos: 60, responsable: '', materiales: [''], observaciones: '' }],
      responsable_programa: programa.responsable_programa || '',
      observaciones_generales: programa.observaciones_generales || ''
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (programa: ProgramaSemanalEntry) => {
    setSelectedPrograma(programa);
    setIsViewModalOpen(true);
  };

  // ============= FUNCIONES CRUD =============
  const handleCreatePrograma = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Normalizar actividades para tipado estricto
      const actividadesNormalizadas = (createForm.actividades || []).map(a => ({
        ...a,
        desarrollo: a.desarrollo || '',
        nombre: a.nombre || '',
        hora_inicio: a.hora_inicio || '',
        duracion_minutos: a.duracion_minutos || 0,
        responsable: a.responsable || '',
        materiales: Array.isArray(a.materiales) ? a.materiales : [''],
        observaciones: a.observaciones || ''
      }));
      await ProgramaSemanalService.crearPrograma({
        ...createForm,
        actividades: actividadesNormalizadas
      });
      await loadProgramas();
      setIsCreateModalOpen(false);
      alert('Programa semanal creado exitosamente');
    } catch (err) {
      console.error('Error creating programa:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrograma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrograma) return;
    
    setLoading(true);
    try {
      // Normalizar actividades para tipado estricto
      const actividadesNormalizadas = (editForm.actividades || []).map(a => ({
        ...a,
        desarrollo: a.desarrollo || '',
        nombre: a.nombre || '',
        hora_inicio: a.hora_inicio || '',
        duracion_minutos: a.duracion_minutos || 0,
        responsable: a.responsable || '',
        materiales: Array.isArray(a.materiales) ? a.materiales : [''],
        observaciones: a.observaciones || ''
      }));
      // Normalizar rama para coincidir con el enum de la BD
      const normalizarRama = (rama: string) => {
        if (!rama) return '';
        return rama.charAt(0).toUpperCase() + rama.slice(1).toLowerCase();
      };
      await ProgramaSemanalService.updatePrograma(selectedPrograma.id, {
        ...editForm,
        rama: normalizarRama(editForm.rama),
        actividades: actividadesNormalizadas
      });
      await loadProgramas();
      setIsEditModalOpen(false);
      alert('Programa semanal actualizado exitosamente');
    } catch (err) {
      console.error('Error updating programa:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrograma = async (programa: ProgramaSemanalEntry) => {
    if (!confirm(`¿Estás seguro de eliminar el programa "${programa.tema_central}"?`)) {
      return;
    }
    // ... lógica de borrado aquí ...
  };

  const removeObjetivo = (index: number, setForm: React.Dispatch<React.SetStateAction<typeof createForm>>) => {
    setForm(prev => ({
      ...prev,
      objetivos: prev.objetivos.filter((_, i) => i !== index)
    }));
  };

  const updateObjetivo = (index: number, value: string, setForm: React.Dispatch<React.SetStateAction<typeof createForm>>) => {
    setForm(prev => ({
      ...prev,
      objetivos: prev.objetivos.map((obj, i) => i === index ? value : obj)
    }));
  };

  const addActividad = (setForm: React.Dispatch<React.SetStateAction<typeof createForm>>) => {
    setForm(prev => ({
      ...prev,
      actividades: [...prev.actividades, { nombre: '', desarrollo: '', hora_inicio: '09:00', duracion_minutos: 60, responsable: '', materiales: [''], observaciones: '' }]
    }));
  };

  const removeActividad = (index: number, setForm: React.Dispatch<React.SetStateAction<typeof createForm>>) => {
    setForm(prev => ({
      ...prev,
      actividades: prev.actividades.filter((_, i) => i !== index)
    }));
  };

  const updateActividad = (index: number, field: keyof ProgramaActividad, value: any, setForm: React.Dispatch<React.SetStateAction<typeof createForm>>) => {
    setForm(prev => ({
      ...prev,
      actividades: prev.actividades.map((act, i) => i === index ? { ...act, [field]: value } : act)
    }));
  };

  // ============= FUNCIONES DE FILTRADO =============
  const filteredProgramas = programas.filter(programa => {
    const matchesSearch = (programa.tema_central || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
               (programa.responsable_programa || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRama = !filterRama || programa.rama === filterRama;
    const matchesEstado = !filterEstado || programa.estado === filterEstado;
    
    return matchesSearch && matchesRama && matchesEstado;
  });

  // ============= FUNCIONES DE UTILIDAD =============
  const getEstadoColor = (estado: string) => {
    const colors = {
      'PLANIFICADO': 'bg-blue-100 text-blue-800',
      'EN_CURSO': 'bg-yellow-100 text-yellow-800',
      'COMPLETADO': 'bg-green-100 text-green-800',
      'CANCELADO': 'bg-red-100 text-red-800'
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRamaColor = (rama: string) => {
    const colors = {
      'MANADA': 'bg-yellow-100 text-yellow-800',
      'TROPA': 'bg-green-100 text-green-800',
      'COMUNIDAD': 'bg-blue-100 text-blue-800',
      'CLAN': 'bg-purple-100 text-purple-800'
    };
    return colors[rama as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  // ============= COMPONENTE PRINCIPAL =============
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white p-6 rounded-xl mb-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Programa Semanal</h1>
                <p className="text-green-100">Planificación y gestión de actividades scouts semanales</p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 font-medium flex items-center space-x-2 shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Programa</span>
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Programas Activos</p>
                <p className="text-2xl font-bold text-gray-900">{programas.filter(p => p.estado === 'PLANIFICADO' || p.estado === 'EN_CURSO').length}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                <p className="text-2xl font-bold text-blue-600">{programas.filter(p => p.estado === 'EN_CURSO').length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-green-600">{programas.filter(p => p.estado === 'COMPLETADO').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Actividades</p>
                <p className="text-2xl font-bold text-purple-600">{programas.reduce((acc, p) => acc + (Array.isArray(p.actividades) ? p.actividades.length : 0), 0)}</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar programas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/80"
              />
            </div>
            <select
              value={filterRama}
              onChange={(e) => setFilterRama(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/80"
            >
              <option value="">Todas las ramas</option>
              {ramas.map(rama => (
                <option key={rama.value} value={rama.value}>{rama.label}</option>
              ))}
            </select>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/80"
            >
              <option value="">Todos los estados</option>
              {estadosPrograma.map(estado => (
                <option key={estado.value} value={estado.value}>{estado.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de Programas */}
        <div className="space-y-6">
          {filteredProgramas.map((programa) => (
            <div key={programa.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{programa.tema_central}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(programa.estado)}`}>
                        {estadosPrograma.find(e => e.value === programa.estado)?.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{
                          programa.fecha_inicio && programa.fecha_fin
                            ? `${formatFechaLocal(programa.fecha_inicio)} - ${formatFechaLocal(programa.fecha_fin)}`
                            : ''
                        }</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRamaColor(programa.rama)}`}>
                          {ramas.find(r => r.value === programa.rama)?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{programa.responsable_programa}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span>{(programa.actividades || []).length} actividades</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p><strong>Objetivos:</strong> {programa.objetivos.slice(0, 2).join(', ')}
                        {programa.objetivos.length > 2 && ` y ${programa.objetivos.length - 2} más...`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => openViewModal(programa)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(programa)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePrograma(programa)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Preview de actividades */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Actividades Principales:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(programa.actividades || []).slice(0, 2).map((actividad, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900">{actividad.nombre}</h5>
                          <span className="text-xs text-gray-500">{formatDuration(actividad.duracion_minutos)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1"><strong>Desarrollo:</strong> {actividad.desarrollo}</p>
                        {actividad.materiales && actividad.materiales.length > 0 && actividad.materiales[0] && (
                          <p className="text-sm text-gray-600 mt-1"><strong>Materiales:</strong> {actividad.materiales.join(', ')}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>🕒 {actividad.hora_inicio}</span>
                          {actividad.responsable && <span>👤 {actividad.responsable}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {(programa.actividades || []).length > 2 && (
                    <p className="text-sm text-gray-500 mt-2">Y {(programa.actividades || []).length - 2} actividades más...</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredProgramas.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay programas</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterRama || filterEstado ? 'No se encontraron programas con los filtros aplicados.' : 'Comienza creando tu primer programa semanal.'}
            </p>
            <button
              onClick={openCreateModal}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Crear Programa
            </button>
          </div>
        )}
      </div>

      {/* Modal Crear Programa */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Plus className="w-6 h-6 mr-2 text-green-600" />
                  Nuevo Programa Semanal
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreatePrograma} className="p-6 space-y-6">
              {/* Información Básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={createForm.fecha_inicio}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin *
                  </label>
                  <input
                    type="date"
                    value={createForm.fecha_fin}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, fecha_fin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tema Central *
                  </label>
                  <input
                    type="text"
                    value={createForm.tema_central}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, tema_central: e.target.value }))}
                    placeholder="Ej: Aventura Navideña Scout"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rama *
                  </label>
                  <select
                    value={createForm.rama}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, rama: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    {ramas.map(rama => (
                      <option key={rama.value} value={rama.value}>{rama.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsable del Programa *
                  </label>
                  <input
                    type="text"
                    value={createForm.responsable_programa}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, responsable_programa: e.target.value }))}
                    placeholder="Nombre del dirigente responsable"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Objetivos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Objetivos del Programa *
                  </label>
                  <button
                    type="button"
                    onClick={() => addObjetivo(setCreateForm)}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    + Agregar Objetivo
                  </button>
                </div>
                <div className="space-y-2">
                  {createForm.objetivos.map((objetivo, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={objetivo}
                        onChange={(e) => updateObjetivo(index, e.target.value, setCreateForm)}
                        placeholder={`Objetivo ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                      {createForm.objetivos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeObjetivo(index, setCreateForm)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actividades */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Actividades *
                  </label>
                  <button
                    type="button"
                    onClick={() => addActividad(setCreateForm)}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    + Agregar Actividad
                  </button>
                </div>
                <div className="space-y-4">
                  {createForm.actividades.map((actividad, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Actividad {index + 1}</h4>
                        {createForm.actividades.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeActividad(index, setCreateForm)}
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                          <input
                            type="text"
                            value={actividad.nombre}
                            onChange={(e) => updateActividad(index, 'nombre', e.target.value, setCreateForm)}
                            placeholder="Nombre de la actividad"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Hora de Inicio</label>
                          <input
                            type="time"
                            value={actividad.hora_inicio}
                            onChange={(e) => updateActividad(index, 'hora_inicio', e.target.value, setCreateForm)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Duración (minutos)</label>
                          <input
                            type="number"
                            value={actividad.duracion_minutos}
                            onChange={(e) => updateActividad(index, 'duracion_minutos', parseInt(e.target.value) || 60, setCreateForm)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Responsable</label>
                          <input
                            type="text"
                            value={actividad.responsable}
                            onChange={(e) => updateActividad(index, 'responsable', e.target.value, setCreateForm)}
                            placeholder="Dirigente responsable"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Desarrollo *</label>
                          <textarea
                            value={actividad.desarrollo}
                            onChange={(e) => updateActividad(index, 'desarrollo', e.target.value, setCreateForm)}
                            placeholder="Describa el desarrollo de la actividad"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Materiales</label>
                          <input
                            type="text"
                            value={actividad.materiales ? actividad.materiales.join(', ') : ''}
                            onChange={(e) => updateActividad(index, 'materiales', e.target.value.split(',').map(m => m.trim()), setCreateForm)}
                            placeholder="Lista de materiales separados por coma"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones Generales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones Generales
                </label>
                <textarea
                  value={createForm.observaciones_generales}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, observaciones_generales: e.target.value }))}
                  placeholder="Notas adicionales sobre el programa..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Creando...' : 'Crear Programa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Programa (Similar al crear, reutilizando lógica) */}
      {isEditModalOpen && selectedPrograma && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Edit className="w-6 h-6 mr-2 text-green-600" />
                  Editar Programa: {selectedPrograma.tema_central}
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUpdatePrograma} className="p-6 space-y-6">
              {/* Formulario idéntico al crear pero usando editForm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={editForm.fecha_inicio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin *
                  </label>
                  <input
                    type="date"
                    value={editForm.fecha_fin}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fecha_fin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tema Central *
                  </label>
                  <input
                    type="text"
                    value={editForm.tema_central}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tema_central: e.target.value }))}
                    placeholder="Ej: Aventura Navideña Scout"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rama *
                  </label>
                  <select
                    value={editForm.rama}
                    onChange={(e) => setEditForm(prev => ({ ...prev, rama: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    {ramas.map(rama => (
                      <option key={rama.value} value={rama.value}>{rama.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsable del Programa *
                  </label>
                  <input
                    type="text"
                    value={editForm.responsable_programa}
                    onChange={(e) => setEditForm(prev => ({ ...prev, responsable_programa: e.target.value }))}
                    placeholder="Nombre del dirigente responsable"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Objetivos para editar */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Objetivos del Programa *
                  </label>
                  <button
                    type="button"
                    onClick={() => addObjetivo(setEditForm)}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    + Agregar Objetivo
                  </button>
                </div>
                <div className="space-y-2">
                  {editForm.objetivos.map((objetivo, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={objetivo}
                        onChange={(e) => updateObjetivo(index, e.target.value, setEditForm)}
                        placeholder={`Objetivo ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                      {editForm.objetivos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeObjetivo(index, setEditForm)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actividades para editar */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Actividades *
                  </label>
                  <button
                    type="button"
                    onClick={() => addActividad(setEditForm)}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    + Agregar Actividad
                  </button>
                </div>
                <div className="space-y-4">
                  {editForm.actividades.map((actividad, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Actividad {index + 1}</h4>
                        {editForm.actividades.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeActividad(index, setEditForm)}
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Fragmento para agrupar los elementos hijos */}
                        <React.Fragment>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                            <input
                              type="text"
                              value={actividad.nombre}
                              onChange={(e) => updateActividad(index, 'nombre', e.target.value, setEditForm)}
                              placeholder="Nombre de la actividad"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Hora de Inicio</label>
                            <input
                              type="time"
                              value={actividad.hora_inicio}
                              onChange={(e) => updateActividad(index, 'hora_inicio', e.target.value, setEditForm)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Duración (minutos)</label>
                            <input
                              type="number"
                              value={actividad.duracion_minutos}
                              onChange={(e) => updateActividad(index, 'duracion_minutos', parseInt(e.target.value) || 60, setEditForm)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Responsable</label>
                            <input
                              type="text"
                              value={actividad.responsable || ''}
                              onChange={(e) => updateActividad(index, 'responsable', e.target.value, setEditForm)}
                              placeholder="Dirigente responsable"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Desarrollo *</label>
                            <textarea
                              value={actividad.desarrollo}
                              onChange={(e) => updateActividad(index, 'desarrollo', e.target.value, setEditForm)}
                              placeholder="Describa el desarrollo de la actividad"
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Materiales</label>
                            <input
                              type="text"
                              value={actividad.materiales ? actividad.materiales.join(', ') : ''}
                              onChange={(e) => updateActividad(index, 'materiales', e.target.value.split(',').map(m => m.trim()), setEditForm)}
                              placeholder="Lista de materiales separados por coma"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </React.Fragment>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones Generales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones Generales
                </label>
                <textarea
                  value={editForm.observaciones_generales}
                  onChange={(e) => setEditForm(prev => ({ ...prev, observaciones_generales: e.target.value }))}
                  placeholder="Notas adicionales sobre el programa..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Actualizando...' : 'Actualizar Programa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Programa */}
      {isViewModalOpen && selectedPrograma && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Eye className="w-6 h-6 mr-2 text-blue-600" />
                  {selectedPrograma.tema_central}
                </h2>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Información del Programa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Información General</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Periodo:</span>
                        <span className="font-medium">{formatFechaLocal(selectedPrograma.fecha_inicio)} - {formatFechaLocal(selectedPrograma.fecha_fin)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rama:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRamaColor(selectedPrograma.rama)}`}>
                          {ramas.find(r => r.value === selectedPrograma.rama)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estado:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(selectedPrograma.estado)}`}>
                          {estadosPrograma.find(e => e.value === selectedPrograma.estado)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Responsable:</span>
                        <span className="font-medium">{selectedPrograma.responsable_programa}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Objetivos</h3>
                    <ul className="space-y-1">
                      {selectedPrograma.objetivos.map((objetivo, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          {objetivo}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actividades */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Actividades Programadas</h3>
                  <button
                    onClick={() => {
                      setSelectedPrograma(selectedPrograma);
                      setIsRankingModalOpen(true);
                    }}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2 font-medium shadow-sm"
                  >
                    <Trophy className="w-5 h-5" />
                    <span>Ver Ranking</span>
                  </button>
                </div>
                <div className="space-y-4">
                  {(selectedPrograma?.actividades || []).map((actividad, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{actividad.nombre}</h4>
                          <p className="text-sm text-gray-600 mt-1"><strong>Desarrollo:</strong> {actividad.desarrollo}</p>
                          {actividad.materiales && actividad.materiales.length > 0 && actividad.materiales[0] && (
                            <p className="text-sm text-gray-600 mt-1"><strong>Materiales:</strong> {actividad.materiales.join(', ')}</p>
                          )}
                        </div>
                        <div className="ml-4 flex items-start space-x-2">
                          <div className="text-right text-sm text-gray-500">
                            <div>🕒 {actividad.hora_inicio}</div>
                            <div>⏱️ {formatDuration(actividad.duracion_minutos)}</div>
                          </div>
                          {(actividad as any).id && (
                            <button
                              onClick={() => {
                                setSelectedActividad({
                                  id: (actividad as any).id,
                                  nombre: actividad.nombre,
                                  rama: selectedPrograma.rama
                                });
                                setIsPuntajesModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium flex items-center space-x-1"
                              title="Asignar puntajes"
                            >
                              <Trophy className="w-4 h-4" />
                              <span>Puntajes</span>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {actividad.responsable && (
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Responsable:</strong> {actividad.responsable}
                        </div>
                      )}
                      
                      {actividad.materiales && actividad.materiales.length > 0 && actividad.materiales[0] && (
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Materiales:</strong> {actividad.materiales.join(', ')}
                        </div>
                      )}
                      
                      {actividad.observaciones && (
                        <div className="text-sm text-gray-600">
                          <strong>Observaciones:</strong> {actividad.observaciones}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones Generales */}
              {selectedPrograma.observaciones_generales && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Observaciones Generales</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedPrograma.observaciones_generales}
                  </p>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedPrograma);
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar Programa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Puntajes de Actividad */}
      {isPuntajesModalOpen && selectedActividad && (
        <PuntajesActividad
          actividadId={selectedActividad.id}
          actividadNombre={selectedActividad.nombre}
          rama={selectedActividad.rama}
          onClose={() => {
            setIsPuntajesModalOpen(false);
            setSelectedActividad(null);
          }}
          onSave={() => {
            // Recargar datos si es necesario
            loadProgramas();
          }}
        />
      )}

      {/* Modal de Ranking de Patrullas */}
      {isRankingModalOpen && selectedPrograma && (
        <RankingPatrullas
          programaId={selectedPrograma.id}
          programaTema={selectedPrograma.tema_central}
          onClose={() => {
            setIsRankingModalOpen(false);
          }}
        />
      )}
    </div>
  );
}