import { useState, useEffect } from 'react';
import { 
  Flag, Users, Save, Plus, Search, Edit, Eye, Trash2, 
  Award, Target, Shield
} from 'lucide-react';
import PatrullaService from '../../services/patrullaService';

// ==================== INTERFACES ====================
interface Patrulla {
  id: string;
  nombre: string;
  lema?: string;
  color_principal?: string;
  color_secundario?: string;
  rama: string;
  grito_patrulla?: string;
  animal_totem?: string;
  fecha_fundacion?: string;
  historia?: string;
  metas_anuales?: string[];
  estado?: 'activa' | 'inactiva' | 'en_formacion';
  miembros_count?: number;
  dirigente_responsable?: string;
  total_puntos?: number;
  posicion_ranking?: number;
}

interface PatrullaFormData {
  nombre: string;
  lema: string;
  color_principal: string;
  color_secundario: string;
  rama: string;
  grito_patrulla: string;
  animal_totem: string;
  fecha_fundacion: string;
  historia: string;
  metas_anuales: string[];
}

// ==================== COMPONENT ====================
export default function PatrullasNew() {
  // ============= ESTADOS =============
  const [patrullas, setPatrullas] = useState<Patrulla[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRama, setSelectedRama] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPatrulla, setSelectedPatrulla] = useState<Patrulla | null>(null);
  const [formData, setFormData] = useState<PatrullaFormData>({
    nombre: '',
    lema: '',
    color_principal: '',
    color_secundario: '',
    rama: '',
    grito_patrulla: '',
    animal_totem: '',
    fecha_fundacion: '',
    historia: '',
    metas_anuales: []
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [statistics, setStatistics] = useState({
    total_patrullas: 0,
    patrullas_activas: 0,
    total_miembros: 0,
    promedio_miembros: 0
  });

  // ============= CONFIGURACION =============
  const ramas = [
    { value: 'MANADA', label: 'Manada (Lobatos/Lobeznas)' },
    { value: 'TROPA', label: 'Tropa (Scouts)' },
    { value: 'COMUNIDAD', label: 'Comunidad (Caminantes)' },
    { value: 'CLAN', label: 'Clan (Rovers)' }
  ];

  const animales_totem = [
    'Águila', 'Lobo', 'León', 'Cóndor', 'Jaguar', 'Puma', 'Halcón', 'Oso',
    'Zorro', 'Tigre', 'Búho', 'Serpiente', 'Pantera', 'Castor', 'Delfín'
  ];

  const colores = [
    'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Morado', 'Negro', 'Blanco',
    'Rosa', 'Gris', 'Marrón', 'Turquesa', 'Dorado', 'Plateado'
  ];

  // ============= EFECTOS =============
  useEffect(() => {
    loadPatrullas();
  }, []);

  useEffect(() => {
    calculateStatistics();
  }, [patrullas]);

  // ============= FUNCIONES DE CARGA =============
  const loadPatrullas = async () => {
    try {
      setLoading(true);
      const data = await PatrullaService.getPatrullas();
      setPatrullas(data);
    } catch (error) {
      console.error('Error cargando patrullas:', error);
      // Datos demo para desarrollo
      setPatrullas([
        {
          id: '1',
          nombre: 'Águilas Doradas',
          lema: 'Vuela alto, vuela libre',
          color_principal: 'Dorado',
          color_secundario: 'Marrón',
          rama: 'TROPA',
          grito_patrulla: '¡Águilas al vuelo!',
          animal_totem: 'Águila',
          fecha_fundacion: '2024-01-15',
          historia: 'Fundada con el propósito de promover la excelencia.',
          estado: 'activa',
          miembros_count: 8,
          total_puntos: 340,
          posicion_ranking: 1
        },
        {
          id: '2',
          nombre: 'Lobos Valientes',
          lema: 'Unidos en la manada',
          color_principal: 'Gris',
          color_secundario: 'Azul',
          rama: 'MANADA',
          grito_patrulla: '¡Lobos, aullido de victoria!',
          animal_totem: 'Lobo',
          fecha_fundacion: '2024-02-10',
          estado: 'activa',
          miembros_count: 6,
          total_puntos: 280,
          posicion_ranking: 2
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = () => {
    const total = patrullas.length;
    const activas = patrullas.filter(p => p.estado === 'activa').length;
    const totalMiembros = patrullas.reduce((sum, p) => sum + (p.miembros_count || 0), 0);
    const promedio = total > 0 ? totalMiembros / total : 0;

    setStatistics({
      total_patrullas: total,
      patrullas_activas: activas,
      total_miembros: totalMiembros,
      promedio_miembros: Math.round(promedio * 10) / 10
    });
  };

  // ============= FUNCIONES CRUD =============
  const handleCreatePatrulla = async () => {
    try {
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setLoading(true);
      const result = await PatrullaService.crearPatrulla(formData);
      
      if (result.success) {
        await loadPatrullas();
        setShowCreateModal(false);
        resetForm();
        alert('✅ Patrulla creada exitosamente');
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creando patrulla:', error);
      alert('❌ Error al crear la patrulla');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPatrulla = (patrulla: Patrulla) => {
    setSelectedPatrulla(patrulla);
    setFormData({
      nombre: patrulla.nombre || '',
      lema: patrulla.lema || '',
      color_principal: patrulla.color_principal || '',
      color_secundario: patrulla.color_secundario || '',
      rama: patrulla.rama || '',
      grito_patrulla: patrulla.grito_patrulla || '',
      animal_totem: patrulla.animal_totem || '',
      fecha_fundacion: patrulla.fecha_fundacion || '',
      historia: patrulla.historia || '',
      metas_anuales: patrulla.metas_anuales || []
    });
    setShowEditModal(true);
  };

  const handleUpdatePatrulla = async () => {
    try {
      if (!selectedPatrulla) return;

      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setLoading(true);
      // Aquí iría la llamada al servicio de actualización
      // const result = await PatrullaService.updatePatrulla(selectedPatrulla.id, formData);
      
      // Demo: actualizar en estado local
      setPatrullas(prev => prev.map(p => 
        p.id === selectedPatrulla.id 
          ? { ...p, ...formData }
          : p
      ));

      setShowEditModal(false);
      resetForm();
      alert('✅ Patrulla actualizada exitosamente');
    } catch (error) {
      console.error('Error actualizando patrulla:', error);
      alert('❌ Error al actualizar la patrulla');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatrulla = async (patrulla: Patrulla) => {
    if (!window.confirm(`¿Estás seguro de eliminar la patrulla "${patrulla.nombre}"?`)) {
      return;
    }

    try {
      setLoading(true);
      // Aquí iría la llamada al servicio de eliminación
      // await PatrullaService.deletePatrulla(patrulla.id);
      
      // Demo: eliminar del estado local
      setPatrullas(prev => prev.filter(p => p.id !== patrulla.id));
      alert('✅ Patrulla eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando patrulla:', error);
      alert('❌ Error al eliminar la patrulla');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatrulla = (patrulla: Patrulla) => {
    setSelectedPatrulla(patrulla);
    setShowViewModal(true);
  };

  // ============= FUNCIONES AUXILIARES =============
  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    }
    if (!formData.rama) {
      errors.rama = 'La rama es obligatoria';
    }
    if (!formData.animal_totem) {
      errors.animal_totem = 'El animal tótem es obligatorio';
    }

    return errors;
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      lema: '',
      color_principal: '',
      color_secundario: '',
      rama: '',
      grito_patrulla: '',
      animal_totem: '',
      fecha_fundacion: '',
      historia: '',
      metas_anuales: []
    });
    setFormErrors({});
    setSelectedPatrulla(null);
  };

  const filteredPatrullas = patrullas.filter(patrulla => {
    const matchesSearch = patrulla.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patrulla.animal_totem?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRama = !selectedRama || patrulla.rama === selectedRama;
    
    return matchesSearch && matchesRama;
  });

  const getRamaColor = (rama: string) => {
    switch (rama) {
      case 'MANADA': return 'text-yellow-700 bg-yellow-100';
      case 'TROPA': return 'text-green-700 bg-green-100';
      case 'COMUNIDAD': return 'text-blue-700 bg-blue-100';
      case 'CLAN': return 'text-purple-700 bg-purple-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  // ============= RENDER =============
  if (loading && patrullas.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando patrullas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* ========== HEADER ========== */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-lg mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Flag className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold">Gestión de Patrullas</h1>
                <p className="text-orange-100">Administra las patrullas y seisenas del grupo</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-orange-600 px-6 py-3 rounded-lg hover:bg-orange-50 font-medium flex items-center space-x-2 shadow-sm transition-colors duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Patrulla</span>
            </button>
          </div>
        </div>

        {/* ========== ESTADÍSTICAS ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patrullas</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_patrullas}</p>
              </div>
              <Flag className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Patrullas Activas</p>
                <p className="text-2xl font-bold text-green-600">{statistics.patrullas_activas}</p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Miembros</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.total_miembros}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio x Patrulla</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.promedio_miembros}</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* ========== FILTROS ========== */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar patrullas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="md:w-64">
              <select
                value={selectedRama}
                onChange={(e) => setSelectedRama(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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

        {/* ========== LISTA DE PATRULLAS ========== */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Award className="w-6 h-6 mr-2 text-green-600" />
              Patrullas Registradas ({filteredPatrullas.length})
            </h2>
          </div>

          {filteredPatrullas.length === 0 ? (
            <div className="p-12 text-center">
              <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay patrullas</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedRama 
                  ? 'No se encontraron patrullas con los filtros aplicados'
                  : 'Aún no has registrado ninguna patrulla'
                }
              </p>
              {!searchQuery && !selectedRama && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Crear primera patrulla
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredPatrullas.map((patrulla) => (
                <div key={patrulla.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  {/* Header de la carta */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {patrulla.animal_totem?.charAt(0) || patrulla.nombre.charAt(0)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{patrulla.nombre}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRamaColor(patrulla.rama)}`}>
                      {patrulla.rama}
                    </span>
                  </div>
                  
                  {/* Información básica */}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {patrulla.animal_totem && (
                      <div className="flex justify-between">
                        <span className="font-medium">Animal Tótem:</span>
                        <span>{patrulla.animal_totem}</span>
                      </div>
                    )}
                    {patrulla.lema && (
                      <div className="flex justify-between">
                        <span className="font-medium">Lema:</span>
                        <span className="text-right text-xs italic">"{patrulla.lema}"</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium">Miembros:</span>
                      <span>{patrulla.miembros_count || 0}</span>
                    </div>
                    {patrulla.total_puntos && (
                      <div className="flex justify-between">
                        <span className="font-medium">Puntos:</span>
                        <span className="font-bold text-green-600">{patrulla.total_puntos}</span>
                      </div>
                    )}
                    {patrulla.color_principal && (
                      <div className="flex justify-between">
                        <span className="font-medium">Colores:</span>
                        <span>{patrulla.color_principal}{patrulla.color_secundario && ` / ${patrulla.color_secundario}`}</span>
                      </div>
                    )}
                  </div>

                  {/* Estado */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      patrulla.estado === 'activa' ? 'bg-green-100 text-green-800' :
                      patrulla.estado === 'inactiva' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {patrulla.estado === 'activa' ? 'Activa' :
                       patrulla.estado === 'inactiva' ? 'Inactiva' : 'En Formación'}
                    </span>
                    {patrulla.posicion_ranking && (
                      <span className="text-xs text-gray-500">
                        Ranking: #{patrulla.posicion_ranking}
                      </span>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleViewPatrulla(patrulla)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditPatrulla(patrulla)}
                      className="text-green-600 hover:text-green-800 p-2 rounded-md hover:bg-green-50 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePatrulla(patrulla)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========== MODAL CREAR PATRULLA ========== */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Plus className="w-6 h-6 mr-2 text-orange-600" />
                    Nueva Patrulla
                  </h2>
                  <button
                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Patrulla *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ej: Águilas Doradas"
                    />
                    {formErrors.nombre && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>
                    )}
                  </div>

                  {/* Rama */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rama *
                    </label>
                    <select
                      value={formData.rama}
                      onChange={(e) => setFormData(prev => ({ ...prev, rama: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

                  {/* Animal Tótem */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Animal Tótem *
                    </label>
                    <select
                      value={formData.animal_totem}
                      onChange={(e) => setFormData(prev => ({ ...prev, animal_totem: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar animal</option>
                      {animales_totem.map(animal => (
                        <option key={animal} value={animal}>
                          {animal}
                        </option>
                      ))}
                    </select>
                    {formErrors.animal_totem && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.animal_totem}</p>
                    )}
                  </div>

                  {/* Lema */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lema
                    </label>
                    <input
                      type="text"
                      value={formData.lema}
                      onChange={(e) => setFormData(prev => ({ ...prev, lema: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ej: Vuela alto, vuela libre"
                    />
                  </div>

                  {/* Color Principal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Principal
                    </label>
                    <select
                      value={formData.color_principal}
                      onChange={(e) => setFormData(prev => ({ ...prev, color_principal: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar color</option>
                      {colores.map(color => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Color Secundario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Secundario
                    </label>
                    <select
                      value={formData.color_secundario}
                      onChange={(e) => setFormData(prev => ({ ...prev, color_secundario: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar color</option>
                      {colores.map(color => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Grito de Patrulla */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grito de Patrulla
                  </label>
                  <input
                    type="text"
                    value={formData.grito_patrulla}
                    onChange={(e) => setFormData(prev => ({ ...prev, grito_patrulla: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ej: ¡Águilas al vuelo!"
                  />
                </div>

                {/* Fecha de Fundación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fundación
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_fundacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_fundacion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Historia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Historia de la Patrulla
                  </label>
                  <textarea
                    value={formData.historia}
                    onChange={(e) => setFormData(prev => ({ ...prev, historia: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Breve historia de cómo se formó la patrulla..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePatrulla}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Creando...' : 'Crear Patrulla'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== MODAL EDITAR PATRULLA ========== */}
        {showEditModal && selectedPatrulla && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Edit className="w-6 h-6 mr-2 text-green-600" />
                    Editar Patrulla
                  </h2>
                  <button
                    onClick={() => { setShowEditModal(false); resetForm(); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Patrulla *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ej: Águilas Doradas"
                    />
                    {formErrors.nombre && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>
                    )}
                  </div>

                  {/* Rama */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rama *
                    </label>
                    <select
                      value={formData.rama}
                      onChange={(e) => setFormData(prev => ({ ...prev, rama: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

                  {/* Animal Tótem */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Animal Tótem *
                    </label>
                    <select
                      value={formData.animal_totem}
                      onChange={(e) => setFormData(prev => ({ ...prev, animal_totem: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar animal</option>
                      {animales_totem.map(animal => (
                        <option key={animal} value={animal}>
                          {animal}
                        </option>
                      ))}
                    </select>
                    {formErrors.animal_totem && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.animal_totem}</p>
                    )}
                  </div>

                  {/* Lema */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lema
                    </label>
                    <input
                      type="text"
                      value={formData.lema}
                      onChange={(e) => setFormData(prev => ({ ...prev, lema: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ej: Vuela alto, vuela libre"
                    />
                  </div>

                  {/* Color Principal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Principal
                    </label>
                    <select
                      value={formData.color_principal}
                      onChange={(e) => setFormData(prev => ({ ...prev, color_principal: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar color</option>
                      {colores.map(color => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Color Secundario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Secundario
                    </label>
                    <select
                      value={formData.color_secundario}
                      onChange={(e) => setFormData(prev => ({ ...prev, color_secundario: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar color</option>
                      {colores.map(color => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Grito de Patrulla */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grito de Patrulla
                  </label>
                  <input
                    type="text"
                    value={formData.grito_patrulla}
                    onChange={(e) => setFormData(prev => ({ ...prev, grito_patrulla: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ej: ¡Águilas al vuelo!"
                  />
                </div>

                {/* Fecha de Fundación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fundación
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_fundacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_fundacion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Historia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Historia de la Patrulla
                  </label>
                  <textarea
                    value={formData.historia}
                    onChange={(e) => setFormData(prev => ({ ...prev, historia: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Breve historia de cómo se formó la patrulla..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={() => { setShowEditModal(false); resetForm(); }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdatePatrulla}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Actualizando...' : 'Actualizar Patrulla'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== MODAL VER PATRULLA ========== */}
        {showViewModal && selectedPatrulla && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Eye className="w-6 h-6 mr-2 text-blue-600" />
                    Detalles de la Patrulla
                  </h2>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Información básica */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {selectedPatrulla.animal_totem?.charAt(0) || selectedPatrulla.nombre.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{selectedPatrulla.nombre}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRamaColor(selectedPatrulla.rama)}`}>
                        {selectedPatrulla.rama}
                      </span>
                    </div>
                  </div>
                  
                  {selectedPatrulla.lema && (
                    <p className="text-lg italic text-gray-600 text-center border-l-4 border-orange-400 pl-4">
                      "{selectedPatrulla.lema}"
                    </p>
                  )}
                </div>

                {/* Detalles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Animal Tótem</label>
                      <p className="text-lg text-gray-900">{selectedPatrulla.animal_totem || 'No especificado'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Grito de Patrulla</label>
                      <p className="text-lg text-gray-900">{selectedPatrulla.grito_patrulla || 'No especificado'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha de Fundación</label>
                      <p className="text-lg text-gray-900">
                        {selectedPatrulla.fecha_fundacion 
                          ? new Date(selectedPatrulla.fecha_fundacion).toLocaleDateString()
                          : 'No especificada'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Colores</label>
                      <p className="text-lg text-gray-900">
                        {selectedPatrulla.color_principal || 'No especificados'}
                        {selectedPatrulla.color_secundario && ` / ${selectedPatrulla.color_secundario}`}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Miembros</label>
                      <p className="text-lg text-gray-900">{selectedPatrulla.miembros_count || 0}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado</label>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedPatrulla.estado === 'activa' ? 'bg-green-100 text-green-800' :
                        selectedPatrulla.estado === 'inactiva' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedPatrulla.estado === 'activa' ? 'Activa' :
                         selectedPatrulla.estado === 'inactiva' ? 'Inactiva' : 'En Formación'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Historia */}
                {selectedPatrulla.historia && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Historia</label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedPatrulla.historia}</p>
                    </div>
                  </div>
                )}

                {/* Estadísticas adicionales */}
                {selectedPatrulla.total_puntos && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Puntos Totales</label>
                        <p className="text-2xl font-bold text-green-600">{selectedPatrulla.total_puntos}</p>
                      </div>
                      {selectedPatrulla.posicion_ranking && (
                        <div className="text-right">
                          <label className="block text-sm font-medium text-gray-700">Posición en Ranking</label>
                          <p className="text-2xl font-bold text-blue-600">#{selectedPatrulla.posicion_ranking}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={() => handleEditPatrulla(selectedPatrulla)}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}