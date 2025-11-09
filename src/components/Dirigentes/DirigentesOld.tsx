import { useState, useEffect } from 'react';
import { Shield, Users, Save, UserPlus, Award, Plus, Search, Edit, Eye, Phone, Mail, Trash2 } from 'lucide-react';
import DirigenteService from '../../services/dirigenteService';

interface Dirigente {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  cargo: string;
  rama: string;
  estado: 'activo' | 'inactivo' | 'licencia';
  fecha_ingreso: string;
  nivel_formacion?: string;
  especialidades?: string[];
}

export default function Dirigentes() {
  const [dirigentes, setDirigentes] = useState<Dirigente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para modales
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDirigente, setSelectedDirigente] = useState<Dirigente | null>(null);

  // Estado para formularios
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    rama: 'TROPA',
    cargo: 'Dirigente',
    nivel_formacion: 'Básica',
    estado: 'activo' as 'activo' | 'inactivo' | 'licencia',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    especialidades: [] as string[],
    observaciones: ''
  });

  // Datos de configuración
  const ramas = [
    { value: 'MANADA', label: 'Manada (7-10 años)' },
    { value: 'TROPA', label: 'Tropa (11-14 años)' },
    { value: 'COMUNIDAD', label: 'Comunidad (15-17 años)' },
    { value: 'CLAN', label: 'Clan (18+ años)' }
  ];

  const cargos = [
    { value: 'Dirigente', label: 'Dirigente' },
    { value: 'Jefe de Grupo', label: 'Jefe de Grupo' },
    { value: 'Subjefe de Grupo', label: 'Subjefe de Grupo' },
    { value: 'Coordinador', label: 'Coordinador' },
    { value: 'Asistente', label: 'Asistente' },
    { value: 'Especialista', label: 'Especialista' }
  ];

  const nivelesFormacion = [
    { value: 'Básica', label: 'Formación Básica' },
    { value: 'Intermedia', label: 'Formación Intermedia' },
    { value: 'Avanzada', label: 'Formación Avanzada' },
    { value: 'Especializada', label: 'Formación Especializada' }
  ];

  // Cargar datos iniciales
  useEffect(() => {
    loadDirigentes();
  }, []);

  const loadDirigentes = async () => {
    try {
      setLoading(true);
      const data = await DirigenteService.getDirigentes();
      setDirigentes(data);
    } catch (err) {
      setError('Error al cargar dirigentes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ============= 🆕 CREAR DIRIGENTE =============
  const handleCreateDirigente = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const resultado = await DirigenteService.crearDirigente({
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        email: formData.email,
        telefono: formData.telefono,
        cargo: formData.cargo,
        rama: formData.rama,
        fecha_ingreso: formData.fecha_ingreso,
        estado: formData.estado,
        nivel_formacion: formData.nivel_formacion,
        especialidades: formData.especialidades,
        observaciones: formData.observaciones
      });

      if (resultado.success) {
        await loadDirigentes();
        setShowAddForm(false);
        resetForm();
      } else {
        setError(resultado.error || 'Error al crear dirigente');
      }
    } catch (err) {
      setError('Error al crear dirigente');
      console.error(err);
    }
  };

  // ============= ✏️ EDITAR DIRIGENTE =============
  const handleEditDirigente = (dirigente: Dirigente) => {
    setSelectedDirigente(dirigente);
    setFormData({
      nombres: dirigente.nombres,
      apellidos: dirigente.apellidos,
      email: dirigente.email,
      telefono: dirigente.telefono || '',
      rama: dirigente.rama,
      cargo: dirigente.cargo,
      nivel_formacion: dirigente.nivel_formacion || 'Básica',
      estado: dirigente.estado,
      fecha_ingreso: dirigente.fecha_ingreso,
      especialidades: dirigente.especialidades || [],
      observaciones: ''
    });
    setShowEditModal(true);
  };

  const handleUpdateDirigente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDirigente) return;

    try {
      const resultado = await DirigenteService.updateDirigente(selectedDirigente.id, {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        email: formData.email,
        telefono: formData.telefono,
        cargo: formData.cargo,
        rama: formData.rama,
        estado: formData.estado,
        nivel_formacion: formData.nivel_formacion,
        especialidades: formData.especialidades,
        observaciones: formData.observaciones
      });

      if (resultado.success) {
        await loadDirigentes();
        setShowEditModal(false);
        setSelectedDirigente(null);
        resetForm();
      } else {
        setError(resultado.error || 'Error al actualizar dirigente');
      }
    } catch (err) {
      setError('Error al actualizar dirigente');
      console.error(err);
    }
  };

  // ============= 🗑️ ELIMINAR DIRIGENTE =============
  const handleDeleteDirigente = async (dirigente: Dirigente) => {
    if (window.confirm(`¿Estás seguro de eliminar a "${dirigente.nombres} ${dirigente.apellidos}"? Esta acción no se puede deshacer.`)) {
      try {
        const resultado = await DirigenteService.deleteDirigente(dirigente.id);
        
        if (resultado.success) {
          await loadDirigentes();
        } else {
          setError(resultado.error || 'Error al eliminar dirigente');
        }
      } catch (err) {
        setError('Error al eliminar dirigente');
        console.error(err);
      }
    }
  };

  // ============= 👁️ VER DETALLES =============
  const handleViewDirigente = (dirigente: Dirigente) => {
    setSelectedDirigente(dirigente);
    setShowViewModal(true);
  };

  // ============= 🔧 UTILIDADES =============
  const resetForm = () => {
    setFormData({
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      rama: 'TROPA',
      cargo: 'Dirigente',
      nivel_formacion: 'Básica',
      estado: 'activo',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      especialidades: [],
      observaciones: ''
    });
  };

  const getEstadoColor = (estado: string) => {
    const colors = {
      'activo': 'bg-green-100 text-green-800',
      'inactivo': 'bg-red-100 text-red-800',
      'licencia': 'bg-yellow-100 text-yellow-800'
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredDirigentes = dirigentes.filter(dirigente =>
    `${dirigente.nombres} ${dirigente.apellidos} ${dirigente.email} ${dirigente.rama} ${dirigente.cargo}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 md:p-6 rounded-lg mb-6 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 md:w-8 md:h-8" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold">Administración de Dirigentes</h1>
                <p className="text-blue-100 text-sm md:text-base">Gestión de dirigentes y sus asignaciones por rama</p>
              </div>
            </div>
            <div className="flex justify-center md:justify-start">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 font-medium flex items-center space-x-2 shadow-sm transition-colors duration-200 w-full max-w-xs md:w-auto"
              >
                <Plus className="w-5 h-5" />
                <span className="text-base font-semibold">Nuevo Dirigente</span>
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Dirigentes Activos</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">12</p>
              </div>
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Formación Avanzada</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">5</p>
              </div>
              <Award className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Ramas Cubiertas</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-600">3</p>
              </div>
              <Users className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Nuevos este Año</p>
                <p className="text-xl md:text-2xl font-bold text-purple-600">4</p>
              </div>
              <UserPlus className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar dirigentes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Nuevo Dirigente */}
        {showAddForm && (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <UserPlus className="w-6 h-6 mr-2 text-blue-600" />
                Nuevo Dirigente
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombres
                  </label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombres: e.target.value }))}
                    placeholder="Nombres completos"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                    placeholder="Apellidos completos"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rama Responsable
                  </label>
                  <select
                    value={formData.rama}
                    onChange={(e) => setFormData(prev => ({ ...prev, rama: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {ramas.map(rama => (
                      <option key={rama.value} value={rama.value}>
                        {rama.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo
                  </label>
                  <select
                    value={formData.cargo}
                    onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {cargos.map(cargo => (
                      <option key={cargo.value} value={cargo.value}>
                        {cargo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de Formación
                  </label>
                  <select
                    value={formData.formacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, formacion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {formaciones.map(formacion => (
                      <option key={formacion.value} value={formacion.value}>
                        {formacion.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="Número de teléfono"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.correo}
                    onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Ingreso
                  </label>
                  <input
                    type="date"
                    value={formData.fechaIngreso}
                    onChange={(e) => setFormData(prev => ({ ...prev, fechaIngreso: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Registrar Dirigente
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Dirigentes */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Shield className="w-6 h-6 mr-2 text-green-600" />
              Dirigentes Registrados
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Nombre Completo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Rama</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Cargo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Formación</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Contacto</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dirigentesDemo.map((dirigente) => (
                  <tr key={dirigente.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {dirigente.nombres} {dirigente.apellidos}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dirigente.rama === 'Scouts' ? 'bg-blue-100 text-blue-800' :
                        dirigente.rama === 'Lobatos' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {dirigente.rama}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{dirigente.cargo}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dirigente.formacion === 'Avanzada' ? 'bg-green-100 text-green-800' :
                        dirigente.formacion === 'Intermedia' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {dirigente.formacion}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-700">
                        <div className="flex items-center mb-1">
                          <Mail className="w-3 h-3 mr-1" />
                          {dirigente.correo}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {dirigente.telefono}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-800">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
