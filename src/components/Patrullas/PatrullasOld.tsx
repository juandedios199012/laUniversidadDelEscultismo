import { useState } from 'react';
import { Award, Users, Save, Plus, Shield, Search, Edit, Eye, Flag } from 'lucide-react';

export default function Patrullas() {
  const [formData, setFormData] = useState({
    nombre: '',
    rama: 'Scouts',
    dirigente: '',
    lema: '',
    grito: '',
    colores: ''
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
    alert('Patrulla registrada correctamente (modo demo)');
    setFormData({
      nombre: '',
      rama: 'Scouts',
      dirigente: '',
      lema: '',
      grito: '',
      colores: ''
    });
    setShowAddForm(false);
  };

  const patrullasDemo = [
    {
      id: 1,
      nombre: 'Lobos Grises',
      emoji: '🐺',
      rama: 'Scouts',
      dirigente: 'María González',
      lema: '¡Siempre unidos!',
      grito: '¡Lobos, unidos venceremos!',
      colores: 'Gris y azul',
      miembros: 8,
      estado: 'Activa'
    },
    {
      id: 2,
      nombre: 'Águilas Doradas',
      emoji: '🦅',
      rama: 'Scouts',
      dirigente: 'Carlos Ruiz',
      lema: '¡Alto y lejos!',
      grito: '¡Águilas al vuelo!',
      colores: 'Dorado y marrón',
      miembros: 7,
      estado: 'Activa'
    },
    {
      id: 3,
      nombre: 'Leones Valientes',
      emoji: '🦁',
      rama: 'Lobatos',
      dirigente: 'Ana Torres',
      lema: '¡Rugimos juntos!',
      grito: '¡Leones, fuerza y valor!',
      colores: 'Amarillo y rojo',
      miembros: 9,
      estado: 'Activa'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 md:p-6 rounded-lg mb-6 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6 md:w-8 md:h-8" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold">Gestión de Patrullas</h1>
                <p className="text-orange-100 text-sm md:text-base">Organiza y administra las patrullas scout</p>
              </div>
            </div>
            <div className="flex justify-center md:justify-start">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-white text-orange-600 px-6 py-3 rounded-lg hover:bg-orange-50 font-medium flex items-center space-x-2 shadow-sm transition-colors duration-200 w-full max-w-xs md:w-auto"
              >
                <Plus className="w-5 h-5" />
                <span className="text-base font-semibold">Nueva Patrulla</span>
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Patrullas Activas</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">5</p>
              </div>
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Miembros Totales</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">42</p>
              </div>
              <Users className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Rama Scouts</p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">3</p>
              </div>
              <Award className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Promedio x Patrulla</p>
                <p className="text-xl md:text-2xl font-bold text-purple-600">8.4</p>
              </div>
              <Flag className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
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
                  placeholder="Buscar patrullas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Nueva Patrulla */}
        {showAddForm && (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Plus className="w-6 h-6 mr-2 text-orange-600" />
                Nueva Patrulla
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
                    Nombre de la Patrulla
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Lobos, Águilas, Leones"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    Dirigente Responsable
                  </label>
                  <input
                    type="text"
                    value={formData.dirigente}
                    onChange={(e) => setFormData(prev => ({ ...prev, dirigente: e.target.value }))}
                    placeholder="Nombre del dirigente"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lema de la Patrulla
                  </label>
                  <input
                    type="text"
                    value={formData.lema}
                    onChange={(e) => setFormData(prev => ({ ...prev, lema: e.target.value }))}
                    placeholder="Ej: ¡Siempre listos!"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grito de Guerra
                  </label>
                  <input
                    type="text"
                    value={formData.grito}
                    onChange={(e) => setFormData(prev => ({ ...prev, grito: e.target.value }))}
                    placeholder="Ej: ¡Lobos, unidos venceremos!"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colores de la Patrulla
                  </label>
                  <input
                    type="text"
                    value={formData.colores}
                    onChange={(e) => setFormData(prev => ({ ...prev, colores: e.target.value }))}
                    placeholder="Ej: Azul y blanco"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Registrar Patrulla
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Patrullas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Award className="w-6 h-6 mr-2 text-green-600" />
              Patrullas Registradas
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 md:p-6">
            {patrullasDemo.map((patrulla) => (
              <div key={patrulla.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{patrulla.emoji}</span>
                    <h3 className="text-lg font-bold text-gray-900">{patrulla.nombre}</h3>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {patrulla.estado}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Rama:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      patrulla.rama === 'Scouts' ? 'bg-blue-100 text-blue-800' :
                      patrulla.rama === 'Lobatos' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {patrulla.rama}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Miembros:</span>
                    <span>{patrulla.miembros}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Dirigente:</span>
                    <span>{patrulla.dirigente}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Lema:</span>
                    <span className="text-right text-xs italic">"{patrulla.lema}"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Colores:</span>
                    <span>{patrulla.colores}</span>
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
