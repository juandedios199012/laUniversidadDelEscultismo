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
                <p className="text-xl md:text-2xl font-bold text-gray-900">{dirigentes.filter(d => d.estado === 'activo').length}</p>
              </div>
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Formación Avanzada</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">{dirigentes.filter(d => d.nivel_formacion === 'Avanzada').length}</p>
              </div>
              <Award className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Dirigentes</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-600">{dirigentes.length}</p>
              </div>
              <Users className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">En Licencia</p>
                <p className="text-xl md:text-2xl font-bold text-orange-600">{dirigentes.filter(d => d.estado === 'licencia').length}</p>
              </div>
              <UserPlus className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar dirigentes por nombre, email, rama o cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-0 focus:ring-0 text-sm"
            />
          </div>
        </div>

        {/* Tabla de dirigentes */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Dirigentes</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dirigente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Formación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDirigentes.map((dirigente) => (
                  <tr key={dirigente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {dirigente.nombres} {dirigente.apellidos}
                      </div>
                      <div className="text-sm text-gray-500">{dirigente.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {dirigente.rama}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dirigente.cargo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(dirigente.estado)}`}>
                        {dirigente.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dirigente.nivel_formacion || 'Básica'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {dirigente.telefono && (
                          <Phone className="w-4 h-4" />
                        )}
                        <Mail className="w-4 h-4" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewDirigente(dirigente)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditDirigente(dirigente)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar dirigente"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDirigente(dirigente)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar dirigente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredDirigentes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron dirigentes que coincidan con la búsqueda.
            </div>
          )}
        </div>

        {/* ============= 🆕 MODAL AGREGAR DIRIGENTE ============= */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">Nuevo Dirigente</h2>
              
              <form onSubmit={handleCreateDirigente} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombres</label>
                    <input
                      type="text"
                      required
                      value={formData.nombres}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombres: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Apellidos</label>
                    <input
                      type="text"
                      required
                      value={formData.apellidos}
                      onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rama</label>
                    <select
                      value={formData.rama}
                      onChange={(e) => setFormData(prev => ({ ...prev, rama: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {ramas.map(rama => (
                        <option key={rama.value} value={rama.value}>
                          {rama.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cargo</label>
                    <select
                      value={formData.cargo}
                      onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {cargos.map(cargo => (
                        <option key={cargo.value} value={cargo.value}>
                          {cargo.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nivel de Formación</label>
                    <select
                      value={formData.nivel_formacion}
                      onChange={(e) => setFormData(prev => ({ ...prev, nivel_formacion: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {nivelesFormacion.map(nivel => (
                        <option key={nivel.value} value={nivel.value}>
                          {nivel.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value as 'activo' | 'inactivo' | 'licencia' }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="licencia">En Licencia</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Ingreso</label>
                  <input
                    type="date"
                    value={formData.fecha_ingreso}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_ingreso: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Registrar Dirigente</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============= ✏️ MODAL EDITAR DIRIGENTE ============= */}
        {showEditModal && selectedDirigente && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">Editar Dirigente</h2>
              
              <form onSubmit={handleUpdateDirigente} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombres</label>
                    <input
                      type="text"
                      required
                      value={formData.nombres}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombres: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Apellidos</label>
                    <input
                      type="text"
                      required
                      value={formData.apellidos}
                      onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rama</label>
                    <select
                      value={formData.rama}
                      onChange={(e) => setFormData(prev => ({ ...prev, rama: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {ramas.map(rama => (
                        <option key={rama.value} value={rama.value}>
                          {rama.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cargo</label>
                    <select
                      value={formData.cargo}
                      onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {cargos.map(cargo => (
                        <option key={cargo.value} value={cargo.value}>
                          {cargo.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nivel de Formación</label>
                    <select
                      value={formData.nivel_formacion}
                      onChange={(e) => setFormData(prev => ({ ...prev, nivel_formacion: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {nivelesFormacion.map(nivel => (
                        <option key={nivel.value} value={nivel.value}>
                          {nivel.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value as 'activo' | 'inactivo' | 'licencia' }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="licencia">En Licencia</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedDirigente(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Actualizar Dirigente</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============= 👁️ MODAL VER DIRIGENTE ============= */}
        {showViewModal && selectedDirigente && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold">Detalles del Dirigente</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedDirigente(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div><strong>Nombre Completo:</strong> {selectedDirigente.nombres} {selectedDirigente.apellidos}</div>
                <div><strong>Email:</strong> {selectedDirigente.email}</div>
                <div><strong>Teléfono:</strong> {selectedDirigente.telefono || 'No registrado'}</div>
                <div><strong>Rama:</strong> <span className="px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800">{selectedDirigente.rama}</span></div>
                <div><strong>Cargo:</strong> {selectedDirigente.cargo}</div>
                <div><strong>Estado:</strong> <span className={`px-2 py-1 rounded-full text-sm ${getEstadoColor(selectedDirigente.estado)}`}>{selectedDirigente.estado}</span></div>
                <div><strong>Nivel de Formación:</strong> {selectedDirigente.nivel_formacion || 'Básica'}</div>
                <div><strong>Fecha de Ingreso:</strong> {new Date(selectedDirigente.fecha_ingreso).toLocaleDateString()}</div>
                {selectedDirigente.especialidades && selectedDirigente.especialidades.length > 0 && (
                  <div>
                    <strong>Especialidades:</strong>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedDirigente.especialidades.map((esp, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                          {esp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============= 🚨 MENSAJE DE ERROR ============= */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-900 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}