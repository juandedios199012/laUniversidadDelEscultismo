import { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, Save, Clock, Star, Trophy, Edit, Trash2, Plus, AlertCircle, Search, Eye, X } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';
import ScoutService from '../../services/scoutService';
import type { ActividadScout } from '../../lib/supabase';

interface FormularioActividad {
  nombre: string;
  descripcion: string;
  tipo_actividad: string;
  fecha_inicio: string;
  fecha_fin: string;
  lugar: string;
  direccion_lugar: string;
  rama_objetivo: string;
  dirigente_responsable: string;
  costo: string;
  maximo_participantes: string;
  observaciones: string;
  equipamiento_necesario: string;
  estado: string;
  edad_minima: string;
  edad_maxima: string;
}

export default function ActividadesScoutNew() {
  const [actividades, setActividades] = useState<ActividadScout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para modales
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<ActividadScout | null>(null);

  const [formData, setFormData] = useState<FormularioActividad>({
    nombre: '',
    descripcion: '',
    tipo_actividad: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    lugar: '',
    direccion_lugar: '',
    rama_objetivo: '',
    dirigente_responsable: '',
    costo: '0',
    maximo_participantes: '',
    observaciones: '',
    equipamiento_necesario: '',
    estado: 'planificada',
    edad_minima: '',
    edad_maxima: ''
  });

  const [filtros, setFiltros] = useState({
    estado: '',
    rama: '',
    tipo: '',
    busqueda: ''
  });

  // Opciones para selects
  const tiposActividad = [
    { value: 'Reunión Regular', label: 'Reunión Regular' },
    { value: 'Campamento', label: 'Campamento' },
    { value: 'Excursión', label: 'Excursión' },
    { value: 'Servicio Comunitario', label: 'Servicio Comunitario' },
    { value: 'Ceremonial', label: 'Ceremonial' },
    { value: 'Capacitación', label: 'Capacitación' },
    { value: 'Competencia', label: 'Competencia' },
    { value: 'Juego Grande', label: 'Juego Grande' },
    { value: 'Otro', label: 'Otro' }
  ];

  const ramaOptions = [
    { value: '', label: 'Todas las ramas' },
    { value: 'manada', label: '🐺 Manada' },
    { value: 'tropa', label: '🦅 Tropa' },
    { value: 'caminante', label: '🥾 Caminante' },
    { value: 'clan', label: '🚀 Clan' },
    { value: 'todas', label: '🌟 Todas las Ramas' }
  ];

  const estadosActividad = [
    { value: '', label: 'Todos los estados' },
    { value: 'planificada', label: 'Planificada' },
    { value: 'confirmada', label: 'Confirmada' },
    { value: 'en_progreso', label: 'En Progreso' },
    { value: 'finalizada', label: 'Finalizada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  // Efectos
  useEffect(() => {
    cargarDatos();
  }, []);

  // Funciones de carga de datos
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const actividadesData = await ScoutService.getAllActividades();
      setActividades(actividadesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos de actividades');
    } finally {
      setLoading(false);
    }
  };

  // Funciones del formulario
  const handleInputChange = (field: keyof FormularioActividad, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFiltroChange = (field: string, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      tipo_actividad: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: new Date().toISOString().split('T')[0],
      lugar: '',
      direccion_lugar: '',
      rama_objetivo: '',
      dirigente_responsable: '',
      costo: '0',
      maximo_participantes: '',
      observaciones: '',
      equipamiento_necesario: '',
      estado: 'planificada',
      edad_minima: '',
      edad_maxima: ''
    });
    setError(null);
  };

  const validarFormulario = (): string | null => {
    if (!formData.nombre.trim()) return 'El nombre es obligatorio';
    if (!formData.descripcion.trim()) return 'La descripción es obligatoria';
    if (!formData.tipo_actividad) return 'El tipo de actividad es obligatorio';
    if (!formData.fecha_inicio) return 'La fecha de inicio es obligatoria';
    if (!formData.rama_objetivo) return 'La rama objetivo es obligatoria';
    if (!formData.dirigente_responsable.trim()) return 'El dirigente responsable es obligatorio';
    
    // Validar que la fecha de fin no sea anterior a la de inicio
    if (formData.fecha_fin < formData.fecha_inicio) {
      return 'La fecha de fin no puede ser anterior a la fecha de inicio';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const actividadData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        lugar: formData.lugar.trim(),
        costo: parseFloat(formData.costo) || 0,
        rama_objetivo: formData.rama_objetivo,
        tipo_actividad: formData.tipo_actividad,
        observaciones: formData.observaciones.trim()
      };

      await ScoutService.createActividad(actividadData);

      // Recargar actividades
      await cargarDatos();
      
      // Limpiar formulario
      limpiarFormulario();

    } catch (error: any) {
      console.error('Error al guardar actividad:', error);
      setError(error.message || 'Error al guardar la actividad');
    } finally {
      setLoading(false);
    }
  };

  // Funciones CRUD
  const handleEditActividad = (actividad: ActividadScout) => {
    setSelectedActividad(actividad);
    setFormData({
      nombre: actividad.nombre,
      descripcion: actividad.descripcion || '',
      tipo_actividad: actividad.tipo_actividad,
      fecha_inicio: actividad.fecha_inicio,
      fecha_fin: actividad.fecha_fin,
      lugar: actividad.lugar || '',
      direccion_lugar: actividad.direccion_lugar || '',
      rama_objetivo: actividad.rama_objetivo || '',
      dirigente_responsable: actividad.dirigente_responsable || '',
      costo: actividad.costo.toString(),
      maximo_participantes: actividad.maximo_participantes?.toString() || '',
      observaciones: actividad.observaciones || '',
      equipamiento_necesario: actividad.equipamiento_necesario || '',
      estado: actividad.estado,
      edad_minima: actividad.edad_minima?.toString() || '',
      edad_maxima: actividad.edad_maxima?.toString() || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateActividad = async () => {
    if (!selectedActividad) return;

    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const actividadData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        tipo_actividad: formData.tipo_actividad,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        lugar: formData.lugar.trim(),
        rama_objetivo: formData.rama_objetivo,
        dirigente_responsable: formData.dirigente_responsable.trim(),
        costo: parseFloat(formData.costo) || 0,
        maximo_participantes: formData.maximo_participantes ? parseInt(formData.maximo_participantes) : undefined,
        observaciones: formData.observaciones.trim(),
        equipamiento_necesario: formData.equipamiento_necesario.trim(),
        estado: formData.estado,
        edad_minima: formData.edad_minima ? parseInt(formData.edad_minima) : undefined,
        edad_maxima: formData.edad_maxima ? parseInt(formData.edad_maxima) : undefined
      };

      await ScoutService.updateActividad(selectedActividad.id, actividadData);
      await cargarDatos();
      
      setShowEditModal(false);
      setSelectedActividad(null);
      limpiarFormulario();

    } catch (error: any) {
      console.error('Error al actualizar actividad:', error);
      setError(error.message || 'Error al actualizar la actividad');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActividad = (actividad: ActividadScout) => {
    setSelectedActividad(actividad);
    setShowDeleteModal(true);
  };

  const confirmDeleteActividad = async () => {
    if (!selectedActividad) return;

    try {
      setLoading(true);
      await ScoutService.deleteActividad(selectedActividad.id);
      await cargarDatos();
      
      setShowDeleteModal(false);
      setSelectedActividad(null);

    } catch (error: any) {
      console.error('Error al eliminar actividad:', error);
      setError(error.message || 'Error al eliminar la actividad');
    } finally {
      setLoading(false);
    }
  };

  const handleViewActividad = (actividad: ActividadScout) => {
    setSelectedActividad(actividad);
    setShowViewModal(true);
  };

  // Funciones de utilidad
  const getEstadoColor = (estado: string) => {
    const colores = {
      'planificada': 'bg-blue-100 text-blue-800 border-blue-300',
      'confirmada': 'bg-purple-100 text-purple-800 border-purple-300',
      'en_progreso': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'finalizada': 'bg-green-100 text-green-800 border-green-300',
      'cancelada': 'bg-red-100 text-red-800 border-red-300'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getTipoIcon = (tipo: string) => {
    const iconos = {
      'Campamento': <MapPin className="w-4 h-4" />,
      'Excursión': <MapPin className="w-4 h-4" />,
      'Capacitación': <Star className="w-4 h-4" />,
      'Servicio Comunitario': <Users className="w-4 h-4" />,
      'Juego Grande': <Trophy className="w-4 h-4" />,
      'Ceremonial': <Star className="w-4 h-4" />,
      'Competencia': <Trophy className="w-4 h-4" />,
      'Reunión Regular': <Users className="w-4 h-4" />
    };
    return iconos[tipo as keyof typeof iconos] || <Calendar className="w-4 h-4" />;
  };

  const obtenerIconoRama = (rama: string): string => {
    const iconos = {
      manada: '🐺',
      tropa: '🦅',
      caminante: '🥾',
      clan: '🚀',
      todas: '🌟'
    };
    return iconos[rama as keyof typeof iconos] || '📋';
  };

  // Filtrar actividades
  const actividadesFiltradas = actividades.filter(actividad => {
    const cumpleBusqueda = !filtros.busqueda || 
      actividad.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      (actividad.descripcion && actividad.descripcion.toLowerCase().includes(filtros.busqueda.toLowerCase()));
    const cumpleEstado = !filtros.estado || actividad.estado === filtros.estado;
    const cumpleRama = !filtros.rama || actividad.rama_objetivo === filtros.rama;
    const cumpleTipo = !filtros.tipo || actividad.tipo_actividad === filtros.tipo;
    
    return cumpleBusqueda && cumpleEstado && cumpleRama && cumpleTipo;
  });

  // Calcular estadísticas
  const estadisticas = {
    total: actividades.length,
    planificadas: actividades.filter(a => a.estado === 'planificada').length,
    enProgreso: actividades.filter(a => a.estado === 'en_progreso').length,
    finalizadas: actividades.filter(a => a.estado === 'finalizada').length,
    costoTotal: actividades.reduce((sum, a) => sum + (a.costo || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4A90E2] via-[#5BA3F5] to-[#7BB3F0] p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl mb-4">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Actividades Scout</h1>
          <p className="text-blue-100 text-lg">Planificación y gestión de actividades del grupo scout</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-white">{estadisticas.total}</div>
            <div className="text-blue-100">Total Actividades</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-blue-300">{estadisticas.planificadas}</div>
            <div className="text-blue-100">Planificadas</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-yellow-300">{estadisticas.enProgreso}</div>
            <div className="text-blue-100">En Progreso</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-green-300">{estadisticas.finalizadas}</div>
            <div className="text-blue-100">Finalizadas</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-white">S/{estadisticas.costoTotal}</div>
            <div className="text-blue-100">Costo Total</div>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-xl text-red-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Plus className="w-6 h-6 mr-2" />
            Nueva Actividad
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="Nombre de la Actividad" required>
                <Input
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Nombre de la actividad"
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                />
              </FormField>

              <FormField label="Tipo de Actividad" required>
                <Select
                  value={formData.tipo_actividad}
                  onChange={(e) => handleInputChange('tipo_actividad', e.target.value)}
                  options={tiposActividad}
                  placeholder="Seleccionar tipo"
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                />
              </FormField>

              <FormField label="Rama Objetivo" required>
                <Select
                  value={formData.rama_objetivo}
                  onChange={(e) => handleInputChange('rama_objetivo', e.target.value)}
                  options={ramaOptions.filter(r => r.value !== '')}
                  placeholder="Seleccionar rama"
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                />
              </FormField>
            </div>

            {/* Descripción */}
            <FormField label="Descripción" required>
              <textarea
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                placeholder="Descripción detallada de la actividad"
                rows={3}
                className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-4 py-3 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
              />
            </FormField>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Fecha de Inicio" required>
                <Input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => handleInputChange('fecha_inicio', e.target.value)}
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                />
              </FormField>

              <FormField label="Fecha de Fin" required>
                <Input
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => handleInputChange('fecha_fin', e.target.value)}
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                />
              </FormField>
            </div>

            {/* Ubicación y responsable */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="Lugar">
                <Input
                  value={formData.lugar}
                  onChange={(e) => handleInputChange('lugar', e.target.value)}
                  placeholder="Lugar de la actividad"
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                />
              </FormField>

              <FormField label="Dirigente Responsable" required>
                <Input
                  value={formData.dirigente_responsable}
                  onChange={(e) => handleInputChange('dirigente_responsable', e.target.value)}
                  placeholder="Nombre del dirigente"
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                />
              </FormField>

              <FormField label="Costo (S/)">
                <Input
                  type="number"
                  value={formData.costo}
                  onChange={(e) => handleInputChange('costo', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                />
              </FormField>
            </div>

            {/* Detalles adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Máximo Participantes">
                <Input
                  type="number"
                  value={formData.maximo_participantes}
                  onChange={(e) => handleInputChange('maximo_participantes', e.target.value)}
                  placeholder="Sin límite"
                  min="1"
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                />
              </FormField>

              <FormField label="Equipamiento Necesario">
                <Input
                  value={formData.equipamiento_necesario}
                  onChange={(e) => handleInputChange('equipamiento_necesario', e.target.value)}
                  placeholder="Lista de equipos necesarios"
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                />
              </FormField>
            </div>

            {/* Observaciones */}
            <FormField label="Observaciones">
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                placeholder="Observaciones adicionales"
                rows={2}
                className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-4 py-3 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
              />
            </FormField>

            {/* Botones del formulario */}
            <div className="flex gap-4 pt-6 border-t border-white/20">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {loading ? 'Guardando...' : 'Crear Actividad'}
              </button>
            </div>
          </form>
        </div>

        {/* Filtros */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Filtros de Búsqueda
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label="Buscar">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-100 w-4 h-4" />
                <Input
                  value={filtros.busqueda}
                  onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                  placeholder="Buscar actividades..."
                  className="pl-10 bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                />
              </div>
            </FormField>

            <FormField label="Estado">
              <Select
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                options={estadosActividad}
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
              />
            </FormField>

            <FormField label="Rama">
              <Select
                value={filtros.rama}
                onChange={(e) => handleFiltroChange('rama', e.target.value)}
                options={ramaOptions}
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
              />
            </FormField>

            <FormField label="Tipo">
              <Select
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                options={[{ value: '', label: 'Todos los tipos' }, ...tiposActividad]}
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
              />
            </FormField>
          </div>
        </div>

        {/* Lista de Actividades */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
          <div className="bg-white/10 px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Lista de Actividades ({actividadesFiltradas.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-blue-100">Cargando actividades...</p>
            </div>
          ) : actividadesFiltradas.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-white/50" />
              <h3 className="text-lg font-medium text-white mb-2">No hay actividades</h3>
              <p className="text-blue-100">
                {actividades.length === 0 
                  ? 'Crea la primera actividad para empezar la planificación'
                  : 'No se encontraron actividades con los filtros aplicados'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {actividadesFiltradas.map((actividad) => (
                <div key={actividad.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          {getTipoIcon(actividad.tipo_actividad)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {actividad.nombre}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-blue-100">
                            <span className="flex items-center gap-1">
                              <span>{obtenerIconoRama(actividad.rama_objetivo || '')}</span>
                              {(actividad.rama_objetivo || '').toUpperCase()}
                            </span>
                            <span>•</span>
                            <span>{tiposActividad.find(t => t.value === actividad.tipo_actividad)?.label}</span>
                            {actividad.costo && actividad.costo > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-green-300 font-medium">S/ {actividad.costo}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-blue-100 mb-3">{actividad.descripcion}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-blue-100">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(actividad.fecha_inicio).toLocaleDateString('es-PE')}
                        </span>
                        
                        {actividad.fecha_fin !== actividad.fecha_inicio && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            hasta {new Date(actividad.fecha_fin).toLocaleDateString('es-PE')}
                          </span>
                        )}
                        
                        {actividad.lugar && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {actividad.lugar}
                          </span>
                        )}

                        {actividad.dirigente_responsable && (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {actividad.dirigente_responsable}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(actividad.estado)}`}>
                        {actividad.estado.toUpperCase()}
                      </span>
                      
                      <button
                        onClick={() => handleViewActividad(actividad)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg transition-colors"
                        title="Ver actividad"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleEditActividad(actividad)}
                        className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-lg transition-colors"
                        title="Editar actividad"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteActividad(actividad)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors"
                        title="Eliminar actividad"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Detalles adicionales */}
                  {(actividad.equipamiento_necesario || actividad.observaciones) && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {actividad.equipamiento_necesario && (
                          <div>
                            <h4 className="font-medium text-white mb-1">Equipamiento</h4>
                            <p className="text-blue-100">{actividad.equipamiento_necesario}</p>
                          </div>
                        )}
                        
                        {actividad.observaciones && (
                          <div>
                            <h4 className="font-medium text-white mb-1">Observaciones</h4>
                            <p className="text-blue-100">{actividad.observaciones}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Ver Actividad */}
        {showViewModal && selectedActividad && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Eye className="w-6 h-6" />
                  Detalles de Actividad
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Información General</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-blue-100 font-medium">Nombre:</span>
                        <p className="text-white">{selectedActividad.nombre}</p>
                      </div>
                      <div>
                        <span className="text-blue-100 font-medium">Tipo:</span>
                        <p className="text-white">{tiposActividad.find(t => t.value === selectedActividad.tipo_actividad)?.label}</p>
                      </div>
                      <div>
                        <span className="text-blue-100 font-medium">Estado:</span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(selectedActividad.estado)}`}>
                          {selectedActividad.estado.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-100 font-medium">Rama Objetivo:</span>
                        <p className="text-white">{obtenerIconoRama(selectedActividad.rama_objetivo || '')} {(selectedActividad.rama_objetivo || '').toUpperCase()}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Detalles</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-blue-100 font-medium">Fechas:</span>
                        <p className="text-white">
                          {new Date(selectedActividad.fecha_inicio).toLocaleDateString('es-PE')}
                          {selectedActividad.fecha_fin !== selectedActividad.fecha_inicio && 
                            ` - ${new Date(selectedActividad.fecha_fin).toLocaleDateString('es-PE')}`
                          }
                        </p>
                      </div>
                      {selectedActividad.lugar && (
                        <div>
                          <span className="text-blue-100 font-medium">Lugar:</span>
                          <p className="text-white">{selectedActividad.lugar}</p>
                        </div>
                      )}
                      {selectedActividad.dirigente_responsable && (
                        <div>
                          <span className="text-blue-100 font-medium">Responsable:</span>
                          <p className="text-white">{selectedActividad.dirigente_responsable}</p>
                        </div>
                      )}
                      {selectedActividad.costo && selectedActividad.costo > 0 && (
                        <div>
                          <span className="text-blue-100 font-medium">Costo:</span>
                          <p className="text-white">S/ {selectedActividad.costo}</p>
                        </div>
                      )}
                      {selectedActividad.maximo_participantes && (
                        <div>
                          <span className="text-blue-100 font-medium">Máximo Participantes:</span>
                          <p className="text-white">{selectedActividad.maximo_participantes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-blue-100 font-medium">Descripción:</span>
                  <p className="text-white mt-1">{selectedActividad.descripcion}</p>
                </div>

                {(selectedActividad.equipamiento_necesario || selectedActividad.observaciones) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedActividad.equipamiento_necesario && (
                      <div>
                        <span className="text-blue-100 font-medium">Equipamiento Necesario:</span>
                        <p className="text-white mt-1">{selectedActividad.equipamiento_necesario}</p>
                      </div>
                    )}
                    
                    {selectedActividad.observaciones && (
                      <div>
                        <span className="text-blue-100 font-medium">Observaciones:</span>
                        <p className="text-white mt-1">{selectedActividad.observaciones}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Actividad */}
        {showEditModal && selectedActividad && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Edit className="w-6 h-6" />
                  Editar Actividad
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedActividad(null);
                    limpiarFormulario();
                  }}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField label="Nombre de la Actividad" required>
                    <Input
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      placeholder="Nombre de la actividad"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                    />
                  </FormField>

                  <FormField label="Tipo de Actividad" required>
                    <Select
                      value={formData.tipo_actividad}
                      onChange={(e) => handleInputChange('tipo_actividad', e.target.value)}
                      options={tiposActividad}
                      placeholder="Seleccionar tipo"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                    />
                  </FormField>

                  <FormField label="Rama Objetivo" required>
                    <Select
                      value={formData.rama_objetivo}
                      onChange={(e) => handleInputChange('rama_objetivo', e.target.value)}
                      options={ramaOptions.filter(r => r.value !== '')}
                      placeholder="Seleccionar rama"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                    />
                  </FormField>
                </div>

                {/* Estado y responsable */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Estado" required>
                    <Select
                      value={formData.estado}
                      onChange={(e) => handleInputChange('estado', e.target.value)}
                      options={estadosActividad.filter(e => e.value !== '')}
                      placeholder="Seleccionar estado"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                    />
                  </FormField>

                  <FormField label="Dirigente Responsable" required>
                    <Input
                      value={formData.dirigente_responsable}
                      onChange={(e) => handleInputChange('dirigente_responsable', e.target.value)}
                      placeholder="Nombre del dirigente"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                    />
                  </FormField>
                </div>

                {/* Descripción */}
                <FormField label="Descripción" required>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    placeholder="Descripción detallada de la actividad"
                    rows={3}
                    className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-4 py-3 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                  />
                </FormField>

                {/* Fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Fecha de Inicio" required>
                    <Input
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={(e) => handleInputChange('fecha_inicio', e.target.value)}
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                    />
                  </FormField>

                  <FormField label="Fecha de Fin" required>
                    <Input
                      type="date"
                      value={formData.fecha_fin}
                      onChange={(e) => handleInputChange('fecha_fin', e.target.value)}
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                    />
                  </FormField>
                </div>

                {/* Ubicación y costo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Lugar">
                    <Input
                      value={formData.lugar}
                      onChange={(e) => handleInputChange('lugar', e.target.value)}
                      placeholder="Lugar de la actividad"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                    />
                  </FormField>

                  <FormField label="Costo (S/)">
                    <Input
                      type="number"
                      value={formData.costo}
                      onChange={(e) => handleInputChange('costo', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                    />
                  </FormField>
                </div>

                {/* Detalles adicionales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Máximo Participantes">
                    <Input
                      type="number"
                      value={formData.maximo_participantes}
                      onChange={(e) => handleInputChange('maximo_participantes', e.target.value)}
                      placeholder="Sin límite"
                      min="1"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                    />
                  </FormField>

                  <FormField label="Equipamiento Necesario">
                    <Input
                      value={formData.equipamiento_necesario}
                      onChange={(e) => handleInputChange('equipamiento_necesario', e.target.value)}
                      placeholder="Lista de equipos necesarios"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                    />
                  </FormField>
                </div>

                {/* Observaciones */}
                <FormField label="Observaciones">
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    placeholder="Observaciones adicionales"
                    rows={2}
                    className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-4 py-3 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                  />
                </FormField>

                {/* Botones */}
                <div className="flex gap-4 pt-6 border-t border-white/20">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedActividad(null);
                      limpiarFormulario();
                    }}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    onClick={handleUpdateActividad}
                    disabled={loading}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {loading ? 'Actualizando...' : 'Actualizar Actividad'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Eliminar Actividad */}
        {showDeleteModal && selectedActividad && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 max-w-md w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Eliminar Actividad</h2>
                <p className="text-blue-100 mb-6">
                  ¿Estás seguro de que deseas eliminar la actividad "<strong>{selectedActividad.nombre}</strong>"?
                  <br />
                  <span className="text-red-300 text-sm">Esta acción no se puede deshacer.</span>
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedActividad(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDeleteActividad}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {loading ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}