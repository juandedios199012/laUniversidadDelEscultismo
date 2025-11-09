import React, { useState, useEffect } from 'react';
import { Users, Calendar, Save, Plus, Search, User, TrendingUp, Edit, Eye, Phone, Mail, Trash2, Award, Shield, UserCheck } from 'lucide-react';
import { ComitePadresEntry } from '../../lib/supabase';
import ComitePadresService from '../../services/comitePadresService';

interface ComitePadresProps {}

export default function ComitePadresComplete({}: ComitePadresProps) {
  // ============= ESTADOS =============
  const [miembros, setMiembros] = useState<ComitePadresEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCargo, setFilterCargo] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('');

  // Estados para modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMiembro, setSelectedMiembro] = useState<ComitePadresEntry | null>(null);

  // Estados para formularios
  const [createForm, setCreateForm] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    cargo: 'VOCAL' as 'PRESIDENTE' | 'SECRETARIO' | 'TESORERO' | 'VOCAL' | 'SUPLENTE',
    fecha_inicio: '',
    fecha_fin: '',
    scout_hijo_id: '',
    experiencia_previa: '',
    habilidades: [''],
    disponibilidad: '',
    observaciones: ''
  });

  const [editForm, setEditForm] = useState<typeof createForm>(createForm);

  // ============= DATOS DEMO Y CONFIGURACIÓN =============
  const cargos = [
    { value: 'PRESIDENTE', label: 'Presidente(a)', color: 'blue', icon: Shield },
    { value: 'SECRETARIO', label: 'Secretario(a)', color: 'green', icon: Edit },
    { value: 'TESORERO', label: 'Tesorero(a)', color: 'yellow', icon: Award },
    { value: 'VOCAL', label: 'Vocal', color: 'purple', icon: User },
    { value: 'SUPLENTE', label: 'Suplente', color: 'gray', icon: UserCheck }
  ];

  const estadosMiembro = [
    { value: 'ACTIVO', label: 'Activo', color: 'green' },
    { value: 'INACTIVO', label: 'Inactivo', color: 'gray' },
    { value: 'CULMINADO', label: 'Culminado', color: 'blue' }
  ];

  // ============= EFECTOS =============
  useEffect(() => {
    loadMiembros();
  }, []);

  // ============= FUNCIONES DE CARGA =============
  const loadMiembros = async () => {
    setLoading(true);
    try {
      console.log('🏛️ Cargando miembros del comité de padres desde Supabase...');
      const miembrosData = await ComitePadresService.getMiembrosComite();
      console.log('📊 Datos recibidos:', miembrosData.length, 'miembros');
      setMiembros(miembrosData);
      
    } catch (error) {
      console.error('❌ Error loading comité de padres:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.warn(`⚠️ Usando datos demo debido al error: ${errorMessage}`);
      
      // Fallback a datos demo en caso de error
      const miembrosDemo: ComitePadresEntry[] = [
        {
          id: '1',
          nombres: 'Rosa María',
          apellidos: 'Vásquez González',
          email: 'rosa.vasquez@email.com',
          telefono: '987654321',
          cargo: 'PRESIDENTE',
          fecha_inicio: '2024-03-15',
          fecha_fin: '2025-03-15',
          estado: 'ACTIVO',
          scout_hijo_id: 'scout001',
          scout_hijo_nombre: 'Carlos Vásquez',
          experiencia_previa: 'Ex tesorera del comité anterior, contadora profesional',
          habilidades: ['Liderazgo', 'Contabilidad', 'Gestión de proyectos', 'Comunicación'],
          disponibilidad: 'Fines de semana y tardes entre semana',
          observaciones: 'Muy comprometida con las actividades scouts',
          fecha_registro: '2024-03-01',
          fecha_actualizacion: '2024-12-01',
          periodo_actual: true
        },
        {
          id: '2',
          nombres: 'Carlos Eduardo',
          apellidos: 'López Morales',
          email: 'carlos.lopez@email.com',
          telefono: '987654322',
          cargo: 'SECRETARIO',
          fecha_inicio: '2024-03-15',
          fecha_fin: '2025-03-15',
          estado: 'ACTIVO',
          scout_hijo_id: 'scout002',
          scout_hijo_nombre: 'Ana López',
          experiencia_previa: 'Secretario de junta de propietarios, abogado',
          habilidades: ['Redacción', 'Organización', 'Derecho', 'Comunicación escrita'],
          disponibilidad: 'Tardes entre semana',
          observaciones: 'Excelente para documentación y actas',
          fecha_registro: '2024-03-01',
          fecha_actualizacion: '2024-11-15',
          periodo_actual: true
        },
        {
          id: '3',
          nombres: 'Patricia',
          apellidos: 'Morales Castro',
          email: 'patricia.morales@email.com',
          telefono: '987654323',
          cargo: 'TESORERO',
          fecha_inicio: '2024-03-15',
          fecha_fin: '2025-03-15',
          estado: 'ACTIVO',
          scout_hijo_id: 'scout003',
          scout_hijo_nombre: 'Diego Morales',
          experiencia_previa: 'Administradora financiera con 10 años de experiencia',
          habilidades: ['Finanzas', 'Excel avanzado', 'Presupuestos', 'Auditoría'],
          disponibilidad: 'Flexibilidad de horarios',
          observaciones: 'Mantiene excelente control financiero del grupo',
          fecha_registro: '2024-03-01',
          fecha_actualizacion: '2024-12-10',
          periodo_actual: true
        },
        {
          id: '4',
          nombres: 'Miguel Ángel',
          apellidos: 'Torres Díaz',
          email: 'miguel.torres@email.com',
          telefono: '987654324',
          cargo: 'VOCAL',
          fecha_inicio: '2024-03-15',
          fecha_fin: '2025-03-15',
          estado: 'ACTIVO',
          scout_hijo_id: 'scout004',
          scout_hijo_nombre: 'Sofía Torres',
          experiencia_previa: 'Coordinador de eventos empresariales',
          habilidades: ['Logística', 'Coordinación de eventos', 'Relaciones públicas'],
          disponibilidad: 'Fines de semana principalmente',
          observaciones: 'Especialista en organización de campamentos',
          fecha_registro: '2024-03-01',
          fecha_actualizacion: '2024-11-20',
          periodo_actual: true
        },
        {
          id: '5',
          nombres: 'Carmen Elena',
          apellidos: 'Ruiz Fernández',
          email: 'carmen.ruiz@email.com',
          telefono: '987654325',
          cargo: 'SUPLENTE',
          fecha_inicio: '2024-03-15',
          fecha_fin: '2025-03-15',
          estado: 'ACTIVO',
          scout_hijo_id: 'scout005',
          scout_hijo_nombre: 'Andrés Ruiz',
          experiencia_previa: 'Profesora de primaria, coordinadora de actividades escolares',
          habilidades: ['Educación', 'Trabajo con niños', 'Creatividad', 'Paciencia'],
          disponibilidad: 'Tardes y vacaciones escolares',
          observaciones: 'Apoyo especial en actividades educativas',
          fecha_registro: '2024-03-01',
          fecha_actualizacion: '2024-10-30',
          periodo_actual: true
        }
      ];
      setMiembros(miembrosDemo);
      
    } finally {
      setLoading(false);
    }
  };

  // ============= FUNCIONES DE MODAL =============
  const openCreateModal = () => {
    setCreateForm({
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      cargo: 'VOCAL',
      fecha_inicio: '',
      fecha_fin: '',
      scout_hijo_id: '',
      experiencia_previa: '',
      habilidades: [''],
      disponibilidad: '',
      observaciones: ''
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (miembro: ComitePadresEntry) => {
    setSelectedMiembro(miembro);
    setEditForm({
      nombres: miembro.nombres,
      apellidos: miembro.apellidos,
      email: miembro.email,
      telefono: miembro.telefono || '',
      cargo: miembro.cargo,
      fecha_inicio: miembro.fecha_inicio,
      fecha_fin: miembro.fecha_fin || '',
      scout_hijo_id: miembro.scout_hijo_id || '',
      experiencia_previa: miembro.experiencia_previa || '',
      habilidades: miembro.habilidades || [''],
      disponibilidad: miembro.disponibilidad || '',
      observaciones: miembro.observaciones || ''
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (miembro: ComitePadresEntry) => {
    setSelectedMiembro(miembro);
    setIsViewModalOpen(true);
  };

  // ============= FUNCIONES CRUD =============
  const handleCreateMiembro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ComitePadresService.registrarMiembro(createForm);
      await loadMiembros();
      setIsCreateModalOpen(false);
      alert('Miembro del comité registrado exitosamente');
    } catch (err) {
      console.error('Error creating miembro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMiembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMiembro) return;
    
    setLoading(true);
    try {
      await ComitePadresService.updateMiembro(selectedMiembro.id, editForm);
      await loadMiembros();
      setIsEditModalOpen(false);
      alert('Miembro del comité actualizado exitosamente');
    } catch (err) {
      console.error('Error updating miembro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMiembro = async (miembro: ComitePadresEntry) => {
    if (!confirm(`¿Estás seguro de eliminar a ${miembro.nombres} ${miembro.apellidos} del comité?`)) {
      return;
    }

    setLoading(true);
    try {
      await ComitePadresService.deleteMiembro(miembro.id);
      await loadMiembros();
      alert('Miembro del comité eliminado exitosamente');
    } catch (err) {
      console.error('Error deleting miembro:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============= FUNCIONES DE FORMULARIO =============
  const addHabilidad = (setForm: React.Dispatch<React.SetStateAction<typeof createForm>>) => {
    setForm(prev => ({
      ...prev,
      habilidades: [...prev.habilidades, '']
    }));
  };

  const removeHabilidad = (index: number, setForm: React.Dispatch<React.SetStateAction<typeof createForm>>) => {
    setForm(prev => ({
      ...prev,
      habilidades: prev.habilidades.filter((_, i) => i !== index)
    }));
  };

  const updateHabilidad = (index: number, value: string, setForm: React.Dispatch<React.SetStateAction<typeof createForm>>) => {
    setForm(prev => ({
      ...prev,
      habilidades: prev.habilidades.map((hab, i) => i === index ? value : hab)
    }));
  };

  // ============= FUNCIONES DE FILTRADO =============
  const filteredMiembros = miembros.filter(miembro => {
    const matchesSearch = `${miembro.nombres} ${miembro.apellidos}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         miembro.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCargo = !filterCargo || miembro.cargo === filterCargo;
    const matchesEstado = !filterEstado || miembro.estado === filterEstado;
    
    return matchesSearch && matchesCargo && matchesEstado;
  });

  // ============= FUNCIONES DE UTILIDAD =============
  const getCargoInfo = (cargo: string) => {
    return cargos.find(c => c.value === cargo) || cargos[3]; // Default a VOCAL
  };

  const getEstadoColor = (estado: string) => {
    const colors = {
      'ACTIVO': 'bg-green-100 text-green-800',
      'INACTIVO': 'bg-gray-100 text-gray-800',
      'CULMINADO': 'bg-blue-100 text-blue-800'
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCargoColor = (cargo: string) => {
    const cargoInfo = getCargoInfo(cargo);
    const colors = {
      'blue': 'bg-blue-100 text-blue-800',
      'green': 'bg-green-100 text-green-800',
      'yellow': 'bg-yellow-100 text-yellow-800',
      'purple': 'bg-purple-100 text-purple-800',
      'gray': 'bg-gray-100 text-gray-800'
    };
    return colors[cargoInfo.color as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // ============= COMPONENTE PRINCIPAL =============
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-6 rounded-xl mb-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Comité de Padres</h1>
                <p className="text-purple-100">Gestión y administración del comité de padres de familia</p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 font-medium flex items-center space-x-2 shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Miembro</span>
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Miembros Activos</p>
                <p className="text-2xl font-bold text-gray-900">{miembros.filter(m => m.estado === 'ACTIVO').length}</p>
              </div>
              <User className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cargos Ocupados</p>
                <p className="text-2xl font-bold text-green-600">{new Set(miembros.filter(m => m.estado === 'ACTIVO').map(m => m.cargo)).size}</p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Período Actual</p>
                <p className="text-2xl font-bold text-blue-600">2024-2025</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Experiencia</p>
                <p className="text-2xl font-bold text-orange-600">Alta</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
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
                placeholder="Buscar miembros..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/80"
              />
            </div>
            <select
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/80"
            >
              <option value="">Todos los cargos</option>
              {cargos.map(cargo => (
                <option key={cargo.value} value={cargo.value}>{cargo.label}</option>
              ))}
            </select>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/80"
            >
              <option value="">Todos los estados</option>
              {estadosMiembro.map(estado => (
                <option key={estado.value} value={estado.value}>{estado.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de Miembros */}
        <div className="space-y-6">
          {filteredMiembros.map((miembro) => (
            <div key={miembro.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{miembro.nombres} {miembro.apellidos}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCargoColor(miembro.cargo)}`}>
                        {getCargoInfo(miembro.cargo).label}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(miembro.estado)}`}>
                        {estadosMiembro.find(e => e.value === miembro.estado)?.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{miembro.email}</span>
                      </div>
                      {miembro.telefono && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{miembro.telefono}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Desde {new Date(miembro.fecha_inicio).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {miembro.scout_hijo_nombre && (
                      <div className="text-sm text-gray-700 mb-3">
                        <p><strong>Scout hijo/a:</strong> {miembro.scout_hijo_nombre}</p>
                      </div>
                    )}
                    {miembro.habilidades && miembro.habilidades.length > 0 && miembro.habilidades[0] && (
                      <div className="flex flex-wrap gap-2">
                        {miembro.habilidades.slice(0, 3).map((habilidad, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                            {habilidad}
                          </span>
                        ))}
                        {miembro.habilidades.length > 3 && (
                          <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs">
                            +{miembro.habilidades.length - 3} más
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => openViewModal(miembro)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(miembro)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMiembro(miembro)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredMiembros.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay miembros</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterCargo || filterEstado ? 'No se encontraron miembros con los filtros aplicados.' : 'Comienza registrando el primer miembro del comité.'}
            </p>
            <button
              onClick={openCreateModal}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Registrar Miembro
            </button>
          </div>
        )}
      </div>

      {/* Modal Crear Miembro */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Plus className="w-6 h-6 mr-2 text-purple-600" />
                  Nuevo Miembro del Comité
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateMiembro} className="p-6 space-y-6">
              {/* Información Personal */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      value={createForm.nombres}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, nombres: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      value={createForm.apellidos}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, apellidos: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={createForm.telefono}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, telefono: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Información del Cargo */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Cargo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo *
                    </label>
                    <select
                      value={createForm.cargo}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, cargo: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      {cargos.map(cargo => (
                        <option key={cargo.value} value={cargo.value}>{cargo.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      value={createForm.fecha_inicio}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Fin
                    </label>
                    <input
                      type="date"
                      value={createForm.fecha_fin}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, fecha_fin: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Scout Hijo/a
                    </label>
                    <input
                      type="text"
                      value={createForm.scout_hijo_id}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, scout_hijo_id: e.target.value }))}
                      placeholder="ID del scout hijo/a (opcional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Habilidades */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Habilidades y Competencias
                  </label>
                  <button
                    type="button"
                    onClick={() => addHabilidad(setCreateForm)}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    + Agregar Habilidad
                  </button>
                </div>
                <div className="space-y-2">
                  {createForm.habilidades.map((habilidad, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={habilidad}
                        onChange={(e) => updateHabilidad(index, e.target.value, setCreateForm)}
                        placeholder={`Habilidad ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {createForm.habilidades.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHabilidad(index, setCreateForm)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Información Adicional */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experiencia Previa
                  </label>
                  <textarea
                    value={createForm.experiencia_previa}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, experiencia_previa: e.target.value }))}
                    placeholder="Describe la experiencia previa relevante..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponibilidad
                  </label>
                  <input
                    type="text"
                    value={createForm.disponibilidad}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, disponibilidad: e.target.value }))}
                    placeholder="Ej: Fines de semana, tardes entre semana, flexible"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={createForm.observaciones}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Observaciones adicionales..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
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
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Registrando...' : 'Registrar Miembro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Miembro (Similar estructura al crear) */}
      {isEditModalOpen && selectedMiembro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Edit className="w-6 h-6 mr-2 text-purple-600" />
                  Editar: {selectedMiembro.nombres} {selectedMiembro.apellidos}
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUpdateMiembro} className="p-6 space-y-6">
              {/* Misma estructura que crear pero con editForm */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      value={editForm.nombres}
                      onChange={(e) => setEditForm(prev => ({ ...prev, nombres: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      value={editForm.apellidos}
                      onChange={(e) => setEditForm(prev => ({ ...prev, apellidos: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={editForm.telefono}
                      onChange={(e) => setEditForm(prev => ({ ...prev, telefono: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Cargo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo *
                    </label>
                    <select
                      value={editForm.cargo}
                      onChange={(e) => setEditForm(prev => ({ ...prev, cargo: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      {cargos.map(cargo => (
                        <option key={cargo.value} value={cargo.value}>{cargo.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      value={editForm.fecha_inicio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Habilidades para editar */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Habilidades y Competencias
                  </label>
                  <button
                    type="button"
                    onClick={() => addHabilidad(setEditForm)}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    + Agregar Habilidad
                  </button>
                </div>
                <div className="space-y-2">
                  {editForm.habilidades.map((habilidad, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={habilidad}
                        onChange={(e) => updateHabilidad(index, e.target.value, setEditForm)}
                        placeholder={`Habilidad ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {editForm.habilidades.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHabilidad(index, setEditForm)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experiencia Previa
                  </label>
                  <textarea
                    value={editForm.experiencia_previa}
                    onChange={(e) => setEditForm(prev => ({ ...prev, experiencia_previa: e.target.value }))}
                    placeholder="Describe la experiencia previa relevante..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponibilidad
                  </label>
                  <input
                    type="text"
                    value={editForm.disponibilidad}
                    onChange={(e) => setEditForm(prev => ({ ...prev, disponibilidad: e.target.value }))}
                    placeholder="Ej: Fines de semana, tardes entre semana, flexible"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={editForm.observaciones}
                    onChange={(e) => setEditForm(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Observaciones adicionales..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

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
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Actualizando...' : 'Actualizar Miembro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Miembro */}
      {isViewModalOpen && selectedMiembro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Eye className="w-6 h-6 mr-2 text-blue-600" />
                  {selectedMiembro.nombres} {selectedMiembro.apellidos}
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
              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Información Personal</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nombre completo:</span>
                        <span className="font-medium">{selectedMiembro.nombres} {selectedMiembro.apellidos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedMiembro.email}</span>
                      </div>
                      {selectedMiembro.telefono && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Teléfono:</span>
                          <span className="font-medium">{selectedMiembro.telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Información del Cargo</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cargo:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCargoColor(selectedMiembro.cargo)}`}>
                          {getCargoInfo(selectedMiembro.cargo).label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estado:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(selectedMiembro.estado)}`}>
                          {estadosMiembro.find(e => e.value === selectedMiembro.estado)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Período:</span>
                        <span className="font-medium">
                          {new Date(selectedMiembro.fecha_inicio).toLocaleDateString()} - 
                          {selectedMiembro.fecha_fin ? new Date(selectedMiembro.fecha_fin).toLocaleDateString() : 'Indefinido'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scout hijo/a */}
              {selectedMiembro.scout_hijo_nombre && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Scout hijo/a</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedMiembro.scout_hijo_nombre}
                  </p>
                </div>
              )}

              {/* Habilidades */}
              {selectedMiembro.habilidades && selectedMiembro.habilidades.length > 0 && selectedMiembro.habilidades[0] && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Habilidades y Competencias</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMiembro.habilidades.map((habilidad, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {habilidad}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experiencia */}
              {selectedMiembro.experiencia_previa && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Experiencia Previa</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedMiembro.experiencia_previa}
                  </p>
                </div>
              )}

              {/* Disponibilidad */}
              {selectedMiembro.disponibilidad && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Disponibilidad</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedMiembro.disponibilidad}
                  </p>
                </div>
              )}

              {/* Observaciones */}
              {selectedMiembro.observaciones && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Observaciones</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedMiembro.observaciones}
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
                    openEditModal(selectedMiembro);
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar Miembro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}