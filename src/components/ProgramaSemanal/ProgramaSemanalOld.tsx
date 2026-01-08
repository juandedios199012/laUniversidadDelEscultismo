import { useState } from 'react';
import { Calendar, Clock, Users, Save, Plus, MapPin, Target, Search, Edit, Eye } from 'lucide-react';

export default function ProgramaSemanal() {
  const [formData, setFormData] = useState({
    fecha: '',
    horaInicio: '',
    horaFin: '',
    actividad: '',
    rama: 'Scouts',
    lugar: '',
    responsable: '',
    objetivos: '',
    materiales: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const ramas = [
    { value: 'Manada', label: 'Manada (7-10 años)' },
    { value: 'Tropa', label: 'Tropa (11-14 años)' },
    { value: 'Caminantes', label: 'Caminantes (15-17 años)' },
    { value: 'Clan', label: 'Clan (18-21 años)' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Actividad programada correctamente (modo demo)');
    setFormData({
      fecha: '',
      horaInicio: '',
      horaFin: '',
      actividad: '',
      rama: 'Scouts',
      lugar: '',
      responsable: '',
      objetivos: '',
      materiales: ''
    });
    setShowAddForm(false);
  };

  const actividadesDemo = [
    {
      id: 1,
      fecha: '2024-12-21',
      horaInicio: '09:00',
      horaFin: '12:00',
      actividad: 'Juego de Pistas "Tesoro Scout"',
      rama: 'Scouts',
      lugar: 'Bosque de Piedras Blancas',
      responsable: 'Carlos Ruiz',
      estado: 'Programado'
    },
    {
      id: 2,
      fecha: '2024-12-22',
      horaInicio: '15:00',
      horaFin: '17:00',
      actividad: 'Taller de Nudos y Amarres',
      rama: 'Scouts',
      lugar: 'Local Scout',
      responsable: 'María González',
      estado: 'En Curso'
    },
    {
      id: 3,
      fecha: '2024-12-28',
      horaInicio: '08:00',
      horaFin: '18:00',
      actividad: 'Campamento de Fin de Año',
      rama: 'Todas',
      lugar: 'Cieneguilla',
      responsable: 'Ana Torres',
      estado: 'Próximo'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 md:p-6 rounded-lg mb-6 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6 md:w-8 md:h-8" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold">Programa Semanal</h1>
                <p className="text-green-100 text-sm md:text-base">Planifica y organiza las actividades scouts</p>
              </div>
            </div>
            <div className="flex justify-center md:justify-start">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 font-medium flex items-center space-x-2 shadow-sm transition-colors duration-200 w-full max-w-xs md:w-auto"
              >
                <Plus className="w-5 h-5" />
                <span className="text-base font-semibold">Nueva Actividad</span>
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Esta Semana</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">8</p>
              </div>
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Horas Totales</p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">16h</p>
              </div>
              <Clock className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Participantes</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-600">42</p>
              </div>
              <Users className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Lugares</p>
                <p className="text-xl md:text-2xl font-bold text-purple-600">5</p>
              </div>
              <MapPin className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
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
                  placeholder="Buscar actividades..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Nueva Actividad */}
        {showAddForm && (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Plus className="w-6 h-6 mr-2 text-green-600" />
                Nueva Actividad
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaInicio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Fin
                  </label>
                  <input
                    type="time"
                    value={formData.horaFin}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaFin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Actividad
                  </label>
                  <input
                    type="text"
                    value={formData.actividad}
                    onChange={(e) => setFormData(prev => ({ ...prev, actividad: e.target.value }))}
                    placeholder="Ej: Juego de pistas, Campamento, Taller de nudos"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rama
                  </label>
                  <select
                    value={formData.rama}
                    onChange={(e) => setFormData(prev => ({ ...prev, rama: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    {ramas.map(rama => (
                      <option key={rama.value} value={rama.value}>
                        {rama.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lugar
                  </label>
                  <input
                    type="text"
                    value={formData.lugar}
                    onChange={(e) => setFormData(prev => ({ ...prev, lugar: e.target.value }))}
                    placeholder="Ej: Local scout, Parque, Bosque de Piedras"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsable
                  </label>
                  <input
                    type="text"
                    value={formData.responsable}
                    onChange={(e) => setFormData(prev => ({ ...prev, responsable: e.target.value }))}
                    placeholder="Dirigente responsable"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objetivos
                  </label>
                  <textarea
                    value={formData.objetivos}
                    onChange={(e) => setFormData(prev => ({ ...prev, objetivos: e.target.value }))}
                    placeholder="Objetivos educativos de la actividad..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Materiales
                  </label>
                  <textarea
                    value={formData.materiales}
                    onChange={(e) => setFormData(prev => ({ ...prev, materiales: e.target.value }))}
                    placeholder="Lista de materiales necesarios..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Programar Actividad
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Actividades */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-green-600" />
              Programa de la Semana
            </h2>
          </div>

          <div className="space-y-4 p-4 md:p-6">
            {actividadesDemo.map((actividad) => (
              <div key={actividad.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      actividad.estado === 'Programado' ? 'bg-blue-100' :
                      actividad.estado === 'En Curso' ? 'bg-green-100' :
                      'bg-orange-100'
                    }`}>
                      <Target className={`w-6 h-6 ${
                        actividad.estado === 'Programado' ? 'text-blue-600' :
                        actividad.estado === 'En Curso' ? 'text-green-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{actividad.actividad}</h3>
                      <p className="text-gray-600">{new Date(actividad.fecha).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    actividad.estado === 'Programado' ? 'bg-blue-100 text-blue-800' :
                    actividad.estado === 'En Curso' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {actividad.estado}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-600 text-sm mb-4">
                  <div>
                    <strong className="text-gray-900">Hora:</strong> {actividad.horaInicio} - {actividad.horaFin}
                  </div>
                  <div>
                    <strong className="text-gray-900">Rama:</strong> 
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                      actividad.rama === 'Scouts' ? 'bg-blue-100 text-blue-800' :
                      actividad.rama === 'Lobatos' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {actividad.rama}
                    </span>
                  </div>
                  <div>
                    <strong className="text-gray-900">Lugar:</strong> {actividad.lugar}
                  </div>
                  <div>
                    <strong className="text-gray-900">Responsable:</strong> {actividad.responsable}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button className="text-blue-600 hover:text-blue-800">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-800">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}