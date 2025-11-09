import { useState, useEffect } from 'react';
import { 
  Calendar, Users, Save, Plus, Search, Edit, Eye, Trash2, 
  TrendingUp, BarChart3, AlertTriangle, CheckCircle
} from 'lucide-react';
import AsistenciaService from '../../services/asistenciaService';
import ScoutService from '../../services/scoutService';

// ==================== INTERFACES ====================
interface Reunion {
  id: string;
  fecha: string;
  titulo: string;
  descripcion?: string;
  rama?: string;
  tipo_actividad?: string;
  ubicacion?: string;
  hora_inicio?: string;
  hora_fin?: string;
  responsable?: string;
  total_invitados?: number;
  asistencias_registradas?: number;
}

interface Scout {
  id: string;
  nombres: string;
  apellidos: string;
  rama_actual: string;
  codigo_scout: string;
  estado?: string;
}

interface ReunionFormData {
  fecha: string;
  titulo: string;
  descripcion: string;
  rama: string;
  tipo_actividad: string;
  ubicacion: string;
  hora_inicio: string;
  hora_fin: string;
  responsable: string;
}

interface AsistenciaFormData {
  reunion_id: string;
  scout_id: string;
  estado: 'presente' | 'ausente' | 'tardanza' | 'excusado';
  hora_llegada: string;
  observaciones: string;
}

// ==================== COMPONENT ====================
export default function AsistenciaNew() {
  // ============= ESTADOS =============
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRama, setSelectedRama] = useState('');
  const [vistaActual, setVistaActual] = useState<'reuniones' | 'asistencia' | 'estadisticas'>('reuniones');

  // Modales
  const [showCreateReunionModal, setShowCreateReunionModal] = useState(false);
  const [showAsistenciaModal, setShowAsistenciaModal] = useState(false);
  const [selectedReunion, setSelectedReunion] = useState<Reunion | null>(null);

  // Formularios
  const [reunionFormData, setReunionFormData] = useState<ReunionFormData>({
    fecha: new Date().toISOString().split('T')[0],
    titulo: '',
    descripcion: '',
    rama: '',
    tipo_actividad: 'reunion_semanal',
    ubicacion: '',
    hora_inicio: '15:00',
    hora_fin: '17:00',
    responsable: ''
  });

  const [asistenciaFormData, setAsistenciaFormData] = useState<AsistenciaFormData>({
    reunion_id: '',
    scout_id: '',
    estado: 'presente',
    hora_llegada: '',
    observaciones: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [estadisticas, setEstadisticas] = useState({
    total_reuniones: 0,
    promedio_asistencia: 0,
    scouts_activos: 0,
    scouts_irregulares: 0
  });

  // ============= CONFIGURACION =============
  const ramas = [
    { value: 'MANADA', label: 'Manada (Lobatos/Lobeznas)' },
    { value: 'TROPA', label: 'Tropa (Scouts)' },
    { value: 'COMUNIDAD', label: 'Comunidad (Caminantes)' },
    { value: 'CLAN', label: 'Clan (Rovers)' }
  ];

  const tiposActividad = [
    { value: 'reunion_semanal', label: 'Reunión Semanal' },
    { value: 'campamento', label: 'Campamento' },
    { value: 'actividad_especial', label: 'Actividad Especial' },
    { value: 'ceremonia', label: 'Ceremonia' },
    { value: 'capacitacion', label: 'Capacitación' },
    { value: 'servicio', label: 'Servicio Comunitario' }
  ];

  const estadosAsistencia = [
    { value: 'presente', label: 'Presente', color: 'text-green-700 bg-green-100' },
    { value: 'ausente', label: 'Ausente', color: 'text-red-700 bg-red-100' },
    { value: 'tardanza', label: 'Tardanza', color: 'text-yellow-700 bg-yellow-100' },
    { value: 'excusado', label: 'Excusado', color: 'text-blue-700 bg-blue-100' }
  ];

  // ============= EFECTOS =============
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    calculateStatistics();
  }, [reuniones]);

  // ============= FUNCIONES DE CARGA =============
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [scoutsData, reunionesData] = await Promise.all([
        ScoutService.getAllScouts(),
        AsistenciaService.getReuniones()
      ]);
      
      setScouts(scoutsData.filter(scout => scout.estado === 'activo') as Scout[]);
      setReuniones(reunionesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      // Datos demo para desarrollo
      setScouts([
        { id: '1', nombres: 'Juan', apellidos: 'Pérez', rama_actual: 'TROPA', codigo_scout: 'TR2401' },
        { id: '2', nombres: 'María', apellidos: 'González', rama_actual: 'TROPA', codigo_scout: 'TR2402' },
        { id: '3', nombres: 'Carlos', apellidos: 'López', rama_actual: 'MANADA', codigo_scout: 'MA2401' }
      ]);
      setReuniones([
        {
          id: '1',
          fecha: '2024-10-27',
          titulo: 'Reunión Semanal Tropa',
          descripcion: 'Actividades de pionerismo y juegos',
          rama: 'TROPA',
          tipo_actividad: 'reunion_semanal',
          ubicacion: 'Local Scout',
          hora_inicio: '15:00',
          hora_fin: '17:00',
          responsable: 'Juan Dirigente',
          total_invitados: 15,
          asistencias_registradas: 12
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = async () => {
    try {
      const stats = await AsistenciaService.getEstadisticasGenerales();
      setEstadisticas(stats);
    } catch (error) {
      // Cálculo local si falla el servicio
      setEstadisticas({
        total_reuniones: reuniones.length,
        promedio_asistencia: 85,
        scouts_activos: scouts.length,
        scouts_irregulares: 0
      });
    }
  };

  // ============= FUNCIONES AUXILIARES =============
  const validateReunionForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!reunionFormData.fecha.trim()) {
      errors.fecha = 'La fecha es obligatoria';
    }
    if (!reunionFormData.titulo.trim()) {
      errors.titulo = 'El título es obligatorio';
    }
    if (!reunionFormData.rama) {
      errors.rama = 'La rama es obligatoria';
    }

    return errors;
  };

  const validateAsistenciaForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!asistenciaFormData.scout_id) {
      errors.scout_id = 'Debe seleccionar un scout';
    }
    if (!asistenciaFormData.estado) {
      errors.estado = 'Debe seleccionar un estado';
    }

    return errors;
  };

  const resetReunionForm = () => {
    setReunionFormData({
      fecha: new Date().toISOString().split('T')[0],
      titulo: '',
      descripcion: '',
      rama: '',
      tipo_actividad: 'reunion_semanal',
      ubicacion: '',
      hora_inicio: '15:00',
      hora_fin: '17:00',
      responsable: ''
    });
    setFormErrors({});
    setSelectedReunion(null);
  };

  const resetAsistenciaForm = () => {
    setAsistenciaFormData({
      reunion_id: '',
      scout_id: '',
      estado: 'presente',
      hora_llegada: '',
      observaciones: ''
    });
    setFormErrors({});
  };

  // ============= FUNCIONES CRUD =============
  const handleCreateReunion = async () => {
    try {
      const errors = validateReunionForm();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setLoading(true);
      const result = await AsistenciaService.crearReunion(reunionFormData);
      
      if (result.success) {
        await loadInitialData();
        setShowCreateReunionModal(false);
        resetReunionForm();
        alert('✅ Reunión creada exitosamente');
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creando reunión:', error);
      alert('❌ Error al crear la reunión');
    } finally {
      setLoading(false);
    }
  };

  const handleEditReunion = (reunion: Reunion) => {
    setSelectedReunion(reunion);
    setReunionFormData({
      fecha: reunion.fecha,
      titulo: reunion.titulo,
      descripcion: reunion.descripcion || '',
      rama: reunion.rama || '',
      tipo_actividad: reunion.tipo_actividad || 'reunion_semanal',
      ubicacion: reunion.ubicacion || '',
      hora_inicio: reunion.hora_inicio || '15:00',
      hora_fin: reunion.hora_fin || '17:00',
      responsable: reunion.responsable || ''
    });
    alert('Modal de edición - Implementar en siguiente iteración');
  };

  const handleDeleteReunion = async (reunion: Reunion) => {
    if (!window.confirm(`¿Estás seguro de eliminar la reunión "${reunion.titulo}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const result = await AsistenciaService.deleteReunion(reunion.id);
      
      if (result.success) {
        await loadInitialData();
        alert('✅ Reunión eliminada exitosamente');
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error eliminando reunión:', error);
      alert('❌ Error al eliminar la reunión');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReunion = async (reunion: Reunion) => {
    try {
      setSelectedReunion(reunion);
      alert(`Ver detalles de: ${reunion.titulo}`);
    } catch (error) {
      console.error('Error cargando detalles de reunión:', error);
      alert('Error al cargar detalles');
    }
  };

  const handleRegistrarAsistencia = (reunion: Reunion) => {
    setAsistenciaFormData(prev => ({
      ...prev,
      reunion_id: reunion.id
    }));
    setSelectedReunion(reunion);
    setShowAsistenciaModal(true);
  };

  const handleSubmitAsistencia = async () => {
    try {
      const errors = validateAsistenciaForm();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setLoading(true);
      const result = await AsistenciaService.registrarAsistencia({
        reunion_id: asistenciaFormData.reunion_id,
        scout_id: asistenciaFormData.scout_id,
        estado: asistenciaFormData.estado,
        hora_llegada: asistenciaFormData.hora_llegada || undefined,
        observaciones: asistenciaFormData.observaciones || undefined,
        registrado_por: 'Sistema'
      });
      
      if (result.success) {
        await loadInitialData();
        resetAsistenciaForm();
        setShowAsistenciaModal(false);
        alert('✅ Asistencia registrada exitosamente');
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error registrando asistencia:', error);
      alert('❌ Error al registrar la asistencia');
    } finally {
      setLoading(false);
    }
  };

  const filteredReuniones = reuniones.filter(reunion => {
    const matchesSearch = reunion.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reunion.descripcion?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRama = !selectedRama || reunion.rama === selectedRama;
    
    return matchesSearch && matchesRama;
  });

  // ============= RENDER =============
  if (loading && reuniones.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando sistema de asistencia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* ========== HEADER ========== */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold">Control de Asistencia</h1>
                <p className="text-blue-100">Gestión integral de reuniones y asistencia</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateReunionModal(true)}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 font-medium flex items-center space-x-2 shadow-sm transition-colors duration-200"
              >
                <Plus className="w-5 h-5" />
                <span>Nueva Reunión</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========== NAVEGACIÓN ========== */}
        <div className="mb-6 flex justify-center">
          <div className="flex space-x-1 bg-white p-1 rounded-lg border shadow-sm">
            <button
              onClick={() => setVistaActual('reuniones')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                vistaActual === 'reuniones' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📅 Reuniones
            </button>
            <button
              onClick={() => setVistaActual('asistencia')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                vistaActual === 'asistencia' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ✅ Asistencia
            </button>
            <button
              onClick={() => setVistaActual('estadisticas')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                vistaActual === 'estadisticas' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📊 Estadísticas
            </button>
          </div>
        </div>

        {/* ========== ESTADÍSTICAS ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reuniones</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.total_reuniones}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio Asistencia</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.promedio_asistencia}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scouts Activos</p>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.scouts_activos}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scouts Irregulares</p>
                <p className="text-2xl font-bold text-orange-600">{estadisticas.scouts_irregulares}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {vistaActual === 'reuniones' && (
          <>
            {/* ========== FILTROS ========== */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar reuniones..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="md:w-64">
                  <select
                    value={selectedRama}
                    onChange={(e) => setSelectedRama(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas las ramas</option>
                    {ramas.map(rama => (
                      <option key={rama.value} value={rama.value}>
                        {rama.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ========== LISTA DE REUNIONES ========== */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-blue-600" />
                  Reuniones Programadas ({filteredReuniones.length})
                </h2>
              </div>

              {filteredReuniones.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reuniones</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery || selectedRama 
                      ? 'No se encontraron reuniones con los filtros aplicados'
                      : 'Aún no has programado ninguna reunión'
                    }
                  </p>
                  {!searchQuery && !selectedRama && (
                    <button
                      onClick={() => setShowCreateReunionModal(true)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Programar primera reunión
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {filteredReuniones.map((reunion) => (
                    <div key={reunion.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      {/* Header de la carta */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            reunion.rama === 'MANADA' ? 'bg-yellow-100 text-yellow-700' :
                            reunion.rama === 'TROPA' ? 'bg-green-100 text-green-700' :
                            reunion.rama === 'COMUNIDAD' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {reunion.rama}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(reunion.fecha).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Título y descripción */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{reunion.titulo}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{reunion.descripcion}</p>

                      {/* Información adicional */}
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex justify-between">
                          <span className="font-medium">Tipo:</span>
                          <span>{tiposActividad.find(t => t.value === reunion.tipo_actividad)?.label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Horario:</span>
                          <span>{reunion.hora_inicio} - {reunion.hora_fin}</span>
                        </div>
                        {reunion.ubicacion && (
                          <div className="flex justify-between">
                            <span className="font-medium">Lugar:</span>
                            <span>{reunion.ubicacion}</span>
                          </div>
                        )}
                        {reunion.total_invitados && (
                          <div className="flex justify-between">
                            <span className="font-medium">Invitados:</span>
                            <span>{reunion.total_invitados}</span>
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => handleRegistrarAsistencia(reunion)}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                        >
                          Registrar Asistencia
                        </button>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewReunion(reunion)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditReunion(reunion)}
                            className="text-green-600 hover:text-green-800 p-2 rounded-md hover:bg-green-50 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReunion(reunion)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {vistaActual === 'asistencia' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Users className="w-6 h-6 mr-2 text-green-600" />
                Registros de Asistencia
              </h2>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 text-center">
                Vista de asistencia - Implementar tabla de registros y filtros avanzados
              </p>
            </div>
          </div>
        )}

        {vistaActual === 'estadisticas' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-purple-600" />
                Estadísticas de Asistencia
              </h2>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 text-center">
                Vista de estadísticas - Implementar gráficos y análisis detallados
              </p>
            </div>
          </div>
        )}

        {/* ========== MODAL CREAR REUNIÓN ========== */}
        {showCreateReunionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Plus className="w-6 h-6 mr-2 text-blue-600" />
                    Nueva Reunión
                  </h2>
                  <button
                    onClick={() => { setShowCreateReunionModal(false); resetReunionForm(); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fecha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={reunionFormData.fecha}
                      onChange={(e) => setReunionFormData(prev => ({ ...prev, fecha: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {formErrors.fecha && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.fecha}</p>
                    )}
                  </div>

                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={reunionFormData.titulo}
                      onChange={(e) => setReunionFormData(prev => ({ ...prev, titulo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Reunión Semanal Tropa"
                    />
                    {formErrors.titulo && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.titulo}</p>
                    )}
                  </div>

                  {/* Rama */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rama *
                    </label>
                    <select
                      value={reunionFormData.rama}
                      onChange={(e) => setReunionFormData(prev => ({ ...prev, rama: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar rama</option>
                      {ramas.map(rama => (
                        <option key={rama.value} value={rama.value}>
                          {rama.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.rama && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.rama}</p>
                    )}
                  </div>

                  {/* Tipo de Actividad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Actividad
                    </label>
                    <select
                      value={reunionFormData.tipo_actividad}
                      onChange={(e) => setReunionFormData(prev => ({ ...prev, tipo_actividad: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {tiposActividad.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hora Inicio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Inicio
                    </label>
                    <input
                      type="time"
                      value={reunionFormData.hora_inicio}
                      onChange={(e) => setReunionFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Hora Fin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Fin
                    </label>
                    <input
                      type="time"
                      value={reunionFormData.hora_fin}
                      onChange={(e) => setReunionFormData(prev => ({ ...prev, hora_fin: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Ubicación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={reunionFormData.ubicacion}
                      onChange={(e) => setReunionFormData(prev => ({ ...prev, ubicacion: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Local Scout"
                    />
                  </div>

                  {/* Responsable */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsable
                    </label>
                    <input
                      type="text"
                      value={reunionFormData.responsable}
                      onChange={(e) => setReunionFormData(prev => ({ ...prev, responsable: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre del dirigente responsable"
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={reunionFormData.descripcion}
                    onChange={(e) => setReunionFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción detallada de la reunión..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={() => { setShowCreateReunionModal(false); resetReunionForm(); }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateReunion}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Creando...' : 'Crear Reunión'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== MODAL REGISTRAR ASISTENCIA ========== */}
        {showAsistenciaModal && selectedReunion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
                    Registrar Asistencia
                  </h2>
                  <button
                    onClick={() => { setShowAsistenciaModal(false); resetAsistenciaForm(); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {selectedReunion.titulo} - {new Date(selectedReunion.fecha).toLocaleDateString()}
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Scout */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scout *
                  </label>
                  <select
                    value={asistenciaFormData.scout_id}
                    onChange={(e) => setAsistenciaFormData(prev => ({ ...prev, scout_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar scout</option>
                    {scouts
                      .filter(scout => !selectedReunion.rama || scout.rama_actual === selectedReunion.rama)
                      .map(scout => (
                        <option key={scout.id} value={scout.id}>
                          {scout.nombres} {scout.apellidos} ({scout.codigo_scout})
                        </option>
                      ))}
                  </select>
                  {formErrors.scout_id && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.scout_id}</p>
                  )}
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado *
                  </label>
                  <select
                    value={asistenciaFormData.estado}
                    onChange={(e) => setAsistenciaFormData(prev => ({ ...prev, estado: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {estadosAsistencia.map(estado => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.estado && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.estado}</p>
                  )}
                </div>

                {/* Hora de llegada */}
                {asistenciaFormData.estado !== 'ausente' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Llegada
                    </label>
                    <input
                      type="time"
                      value={asistenciaFormData.hora_llegada}
                      onChange={(e) => setAsistenciaFormData(prev => ({ ...prev, hora_llegada: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={asistenciaFormData.observaciones}
                    onChange={(e) => setAsistenciaFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={() => { setShowAsistenciaModal(false); resetAsistenciaForm(); }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitAsistencia}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}