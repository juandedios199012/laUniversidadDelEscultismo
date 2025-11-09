import { useState } from 'react';
import { BookOpen, Star, Save, Plus, Search, Edit, Eye, Calendar, Trophy, Award } from 'lucide-react';

export default function LibroOro() {
  const [formData, setFormData] = useState({
    titulo: '',
    fecha: '',
    patrulla: 'Lobos',
    logro: '',
    descripcion: '',
    relatores: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const patrullas = [
    { value: 'Lobos', label: 'Lobos Grises' },
    { value: 'Águilas', label: 'Águilas Doradas' },
    { value: 'Leones', label: 'Leones Valientes' },
    { value: 'Castores', label: 'Castores Trabajadores' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Logro registrado en el Libro de Oro (modo demo)');
    setFormData({
      titulo: '',
      fecha: '',
      patrulla: 'Lobos',
      logro: '',
      descripcion: '',
      relatores: ''
    });
    setShowAddForm(false);
  };

  const logrosDemo = [
    {
      id: 1,
      titulo: 'Campamento de Invierno 2024',
      fecha: '2024-07-20',
      patrulla: 'Lobos Grises',
      logro: 'Mejor Campamento del Año',
      descripcion: 'La patrulla Lobos Grises demostró excelente trabajo en equipo, liderazgo y habilidades scouts durante el campamento de invierno.',
      relatores: 'María González, Carlos Ruiz',
      reconocimiento: 'Oro'
    },
    {
      id: 2,
      titulo: 'Proyecto Comunitario Navidad',
      fecha: '2024-12-15',
      patrulla: 'Águilas Doradas',
      logro: 'Servicio a la Comunidad',
      descripcion: 'Organización exitosa de campaña navideña para niños en situación vulnerable, recolectando más de 200 juguetes.',
      relatores: 'Ana Torres, Pedro Vega',
      reconocimiento: 'Plata'
    },
    {
      id: 3,
      titulo: 'Competencia de Nudos Nacional',
      fecha: '2024-09-10',
      patrulla: 'Leones Valientes',
      logro: '1er Lugar Nacional',
      descripcion: 'Primer lugar en la competencia nacional de nudos y amarres, representando con honor al grupo scout.',
      relatores: 'Luis Morales, Carmen Silva',
      reconocimiento: 'Oro'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-amber-600 text-white p-4 md:p-6 rounded-lg mb-6 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold">Libro de Oro</h1>
                <p className="text-yellow-100 text-sm md:text-base">Registro de logros y reconocimientos scouts</p>
              </div>
            </div>
            <div className="flex justify-center md:justify-start">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-white text-yellow-600 px-6 py-3 rounded-lg hover:bg-yellow-50 font-medium flex items-center space-x-2 shadow-sm transition-colors duration-200 w-full max-w-xs md:w-auto"
              >
                <Plus className="w-5 h-5" />
                <span className="text-base font-semibold">Nuevo Logro</span>
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Logros</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">24</p>
              </div>
              <Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Este Año</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">8</p>
              </div>
              <Award className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Oro</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-600">12</p>
              </div>
              <Star className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Patrullas</p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">4</p>
              </div>
              <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
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
                  placeholder="Buscar logros en el Libro de Oro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Nuevo Logro */}
        {showAddForm && (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Plus className="w-6 h-6 mr-2 text-yellow-600" />
                Nuevo Logro
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
                    Título del Logro
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Nombre del evento o logro"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patrulla
                  </label>
                  <select
                    value={formData.patrulla}
                    onChange={(e) => setFormData(prev => ({ ...prev, patrulla: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  >
                    {patrullas.map(patrulla => (
                      <option key={patrulla.value} value={patrulla.value}>
                        {patrulla.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Logro
                  </label>
                  <input
                    type="text"
                    value={formData.logro}
                    onChange={(e) => setFormData(prev => ({ ...prev, logro: e.target.value }))}
                    placeholder="Ej: 1er Lugar, Mejor Campamento, Servicio Comunitario"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Describe el logro y las circunstancias..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relatores
                  </label>
                  <input
                    type="text"
                    value={formData.relatores}
                    onChange={(e) => setFormData(prev => ({ ...prev, relatores: e.target.value }))}
                    placeholder="Nombres de quienes relatan este logro"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
                  className="flex items-center gap-2 px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Registrar Logro
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Logros */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Trophy className="w-6 h-6 mr-2 text-green-600" />
              Logros Registrados
            </h2>
          </div>

          <div className="space-y-4 p-4 md:p-6">
            {logrosDemo.map((logro) => (
              <div key={logro.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{logro.titulo}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        logro.reconocimiento === 'Oro' ? 'bg-yellow-100 text-yellow-800' :
                        logro.reconocimiento === 'Plata' ? 'bg-gray-100 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {logro.reconocimiento}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(logro.fecha).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-1" />
                        {logro.patrulla}
                      </div>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Logro: </span>
                      <span className="text-sm text-gray-600">{logro.logro}</span>
                    </div>
                    <p className="text-gray-700 mb-3">{logro.descripcion}</p>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Relatores: </span>
                      {logro.relatores}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-800">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
