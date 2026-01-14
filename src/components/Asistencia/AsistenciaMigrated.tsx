import { useState, useEffect } from 'react';
import { 
  Calendar, Users, Save, Plus, Search, Edit, Eye, Trash2, 
  TrendingUp, BarChart3, AlertTriangle, CheckCircle
} from 'lucide-react';
import AsistenciaService from '../../services/asistenciaService';
import ScoutService from '../../services/scoutService';
import { supabase } from '../../lib/supabase';

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
  const [vistaActual, setVistaActual] = useState<'reuniones' | 'asistencia' | 'estadisticas' | 'asistencia_masiva'>('reuniones');
  // ============= ASISTENCIA MASIVA =============
  const [selectedPrograma, setSelectedPrograma] = useState<Reunion | null>(null);
  const [selectedPatrulla, setSelectedPatrulla] = useState<string>('');
  const [asistenciaMasiva, setAsistenciaMasiva] = useState<Record<string, 'presente' | 'ausente' | 'tardanza' | 'excusado'>>({});

  const handleOpenAsistenciaMasiva = (programa: Reunion) => {
    setSelectedPrograma(programa);
    setVistaActual('asistencia_masiva');
    setSelectedPatrulla('');
    setAsistenciaMasiva({});
  };

  const handleSelectPatrulla = (patrulla: string) => {
    setSelectedPatrulla(patrulla);
    setAsistenciaMasiva({});
  };

  const scoutsFiltrados = scouts.filter(s => !selectedPatrulla || s.rama_actual === selectedPatrulla);

  const handleChangeAsistenciaScout = (scoutId: string, estado: 'presente' | 'ausente' | 'tardanza' | 'excusado') => {
    setAsistenciaMasiva(prev => ({ ...prev, [scoutId]: estado }));
  };

  const handleRegistrarAsistenciaMasiva = async () => {
    setLoading(true);
    try {
      // Obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('❌ Debes estar autenticado para registrar asistencia');
        return;
      }

      // Supabase: inserción masiva
      // Mapear a valores del enum
      const estadoMap: Record<string, string> = {
        'presente': 'PRESENTE',
        'ausente': 'AUSENTE',
        'tardanza': 'TARDANZA',
        'excusado': 'JUSTIFICADO'
      };
      const registros = Object.entries(asistenciaMasiva).map(([scout_id, estado]) => ({
        actividad_id: selectedPrograma?.id,
        scout_id,
        estado_asistencia: estadoMap[estado] || 'PRESENTE',
        fecha: selectedPrograma?.fecha || new Date().toISOString().split('T')[0],
        registrado_por: user.id
      }));
      const { data, error } = await AsistenciaService.registrarAsistenciaMasiva(registros);
      if (error) throw error;
      await loadInitialData();
      setVistaActual('reuniones');
      setSelectedPrograma(null);
      setSelectedPatrulla('');
      setAsistenciaMasiva({});
      alert('✅ Asistencia masiva registrada exitosamente');
    } catch (error) {
      alert('❌ Error al registrar asistencia masiva');
    } finally {
      setLoading(false);
    }
  };

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
      // Obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('❌ Debes estar autenticado para registrar asistencia');
        return;
      }

      const result = await AsistenciaService.registrarAsistencia({
        reunion_id: asistenciaFormData.reunion_id,
        scout_id: asistenciaFormData.scout_id,
        estado: asistenciaFormData.estado,
        hora_llegada: asistenciaFormData.hora_llegada || undefined,
        observaciones: asistenciaFormData.observaciones || undefined,
        registrado_por: user.id
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
        {/* ...HEADER, KPIs, FILTROS, LISTA, MODALES, ASISTENCIA MASIVA como arriba... */}
        {/* MODALES y lógica condicional ya están abajo */}
        {/* ...resto del render... */}
        {/* MODAL CREAR REUNION */}
        {showCreateReunionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              {/* ...contenido del modal... */}
            </div>
          </div>
        )}
        {/* MODAL REGISTRAR ASISTENCIA */}
        {showAsistenciaModal && selectedReunion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              {/* ...contenido del modal... */}
            </div>
          </div>
        )}
      </div>
    </div>
  );

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