import { useState } from 'react';
import { Users, Calendar, Save, Plus, Search, User, TrendingUp, Edit, Eye, Phone, Mail } from 'lucide-react';

export default function ComitePadres() {
  const [formData, setFormData] = useState({
    nombre: '',
    cargo: 'vocal',
    telefono: '',
    correo: '',
    fechaEleccion: '',
    fechaCulminacion: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cargos = [
    { value: 'presidente', label: 'Presidente(a)' },
    { value: 'secretario', label: 'Secretario(a)' },
    { value: 'tesorero', label: 'Tesorero(a)' },
    { value: 'vocal', label: 'Vocal' },
    { value: 'suplente', label: 'Suplente' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Miembro del comité registrado correctamente (modo demo)');
    setFormData({
      nombre: '',
      cargo: 'vocal',
      telefono: '',
      correo: '',
      fechaEleccion: '',
      fechaCulminacion: ''
    });
    setShowAddForm(false);
  };

  const comiteDemo = [
    {
      id: 1,
      nombre: 'Rosa María Vásquez',
      cargo: 'Presidente',
      telefono: '987654321',
      correo: 'rosa.vasquez@email.com',
      fechaEleccion: '2024-03-15',
      fechaCulminacion: '2025-03-15',
      estado: 'Activo'
    },
    {
      id: 2,
      nombre: 'Carlos Eduardo López',
      cargo: 'Secretario',
      telefono: '987654322',
      correo: 'carlos.lopez@email.com',
      fechaEleccion: '2024-03-15',
      fechaCulminacion: '2025-03-15',
      estado: 'Activo'
    },
    {
      id: 3,
      nombre: 'Patricia Morales Castro',
      cargo: 'Tesorera',
      telefono: '987654323',
      correo: 'patricia.morales@email.com',
      fechaEleccion: '2024-03-15',
      fechaCulminacion: '2025-03-15',
      estado: 'Activo'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 md:p-6 rounded-lg mb-6 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 md:w-8 md:h-8" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold">Comité de Padres</h1>
                <p className="text-purple-100 text-sm md:text-base">Gestión del comité de padres de familia</p>
              </div>
            </div>
            <div className="flex justify-center md:justify-start">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 font-medium flex items-center space-x-2 shadow-sm transition-colors duration-200 w-full max-w-xs md:w-auto"
              >
                <Plus className="w-5 h-5" />
                <span className="text-base font-semibold">Nuevo Miembro</span>
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Miembros Activos</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">5</p>
              </div>
              <User className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Períodos</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">3</p>
              </div>
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Período Actual</p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">2024-2025</p>
              </div>
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Cargos Ocupados</p>
                <p className="text-xl md:text-2xl font-bold text-orange-600">5</p>
              </div>
              <Users className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
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
                  placeholder="Buscar miembros del comité..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Nuevo Miembro */}
        {showAddForm && (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Plus className="w-6 h-6 mr-2 text-purple-600" />
                Nuevo Miembro del Comité
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
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre completo del miembro"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo
                  </label>
                  <select
                    value={formData.cargo}
                    onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="Número de teléfono"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Elección
                  </label>
                  <input
                    type="date"
                    value={formData.fechaEleccion}
                    onChange={(e) => setFormData(prev => ({ ...prev, fechaEleccion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Culminación
                  </label>
                  <input
                    type="date"
                    value={formData.fechaCulminacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, fechaCulminacion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Registrar Miembro
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Miembros del Comité */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Users className="w-6 h-6 mr-2 text-green-600" />
              Comité Actual
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Nombre Completo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Cargo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Período</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Contacto</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comiteDemo.map((miembro) => (
                  <tr key={miembro.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {miembro.nombre}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        miembro.cargo === 'Presidente' ? 'bg-blue-100 text-blue-800' :
                        miembro.cargo === 'Secretario' ? 'bg-green-100 text-green-800' :
                        miembro.cargo === 'Tesorera' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {miembro.cargo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      <div className="text-sm">
                        2024-2025
                      </div>
                      <div className="text-xs text-gray-500">
                        Mar 2024 - Mar 2025
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-700">
                        <div className="flex items-center mb-1">
                          <Mail className="w-3 h-3 mr-1" />
                          {miembro.correo}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {miembro.telefono}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {miembro.estado}
                      </span>
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