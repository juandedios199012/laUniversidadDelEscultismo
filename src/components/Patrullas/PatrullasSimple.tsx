import { useState } from 'react';
import { Award, Users, Save, UserPlus, Shield } from 'lucide-react';

export default function PatrullasSimple() {
  const [formData, setFormData] = useState({
    nombre: '',
    rama: 'Tropa',
    dirigente: '',
    lema: '',
    grito: '',
    colores: ''
  });

  const ramas = [
    { value: 'Manada', label: 'Manada (7-10 años)' },
    { value: 'Tropa', label: 'Tropa (11-14 años)' },
    { value: 'Caminantes', label: 'Caminantes (15-17 años)' },
    { value: 'Clan', label: 'Clan (18-21 años)' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Patrulla registrada correctamente (modo demo)');
    // Reset form
    setFormData({
      nombre: '',
      rama: 'Tropa',
      dirigente: '',
      lema: '',
      grito: '',
      colores: ''
    });
  };

  return (
    <div className="gaming-container">
      <div className="gaming-header">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
          <Award className="w-10 h-10" />
          🐺 Gestión de Patrullas
        </h1>
        <p className="text-xl text-gray-300">Organiza tus patrullas como un verdadero estratega</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Patrullas Activas</h3>
              <p className="text-3xl font-bold text-white">5</p>
            </div>
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Miembros Totales</h3>
              <p className="text-3xl font-bold text-white">42</p>
            </div>
            <Users className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Rama Scouts</h3>
              <p className="text-3xl font-bold text-white">3</p>
            </div>
            <Award className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Promedio x Patrulla</h3>
              <p className="text-3xl font-bold text-white">8.4</p>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <UserPlus className="w-6 h-6 mr-3 text-blue-400" />
          Nueva Patrulla
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Nombre de la Patrulla <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Lobos, Águilas, Leones"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/30 hover:border-white/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Rama <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.rama}
                onChange={(e) => setFormData(prev => ({ ...prev, rama: e.target.value }))}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white border-white/30 hover:border-white/50"
                required
              >
                {ramas.map(rama => (
                  <option key={rama.value} value={rama.value} className="bg-gray-800 text-white">
                    {rama.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Dirigente Responsable
              </label>
              <input
                type="text"
                value={formData.dirigente}
                onChange={(e) => setFormData(prev => ({ ...prev, dirigente: e.target.value }))}
                placeholder="Nombre del dirigente"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/30 hover:border-white/50"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Lema de la Patrulla
              </label>
              <input
                type="text"
                value={formData.lema}
                onChange={(e) => setFormData(prev => ({ ...prev, lema: e.target.value }))}
                placeholder="Ej: ¡Siempre listos!"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/30 hover:border-white/50"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Grito de Guerra
              </label>
              <input
                type="text"
                value={formData.grito}
                onChange={(e) => setFormData(prev => ({ ...prev, grito: e.target.value }))}
                placeholder="Ej: ¡Lobos, unidos venceremos!"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/30 hover:border-white/50"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Colores de la Patrulla
              </label>
              <input
                type="text"
                value={formData.colores}
                onChange={(e) => setFormData(prev => ({ ...prev, colores: e.target.value }))}
                placeholder="Ej: Azul y blanco"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/30 hover:border-white/50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="gaming-btn primary flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Save className="w-5 h-5" />
              Registrar Patrulla
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Patrullas Demo */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Award className="w-6 h-6 mr-3 text-green-400" />
          Patrullas Registradas (Demo)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Patrulla Demo 1 */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">🐺 Lobos Grises</h3>
              <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Activa</span>
            </div>
            <div className="space-y-2 text-white/80">
              <p><strong>Rama:</strong> Scouts</p>
              <p><strong>Miembros:</strong> 8</p>
              <p><strong>Dirigente:</strong> María González</p>
              <p><strong>Lema:</strong> "¡Siempre unidos!"</p>
            </div>
          </div>

          {/* Patrulla Demo 2 */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">🦅 Águilas Doradas</h3>
              <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Activa</span>
            </div>
            <div className="space-y-2 text-white/80">
              <p><strong>Rama:</strong> Scouts</p>
              <p><strong>Miembros:</strong> 7</p>
              <p><strong>Dirigente:</strong> Carlos Ruiz</p>
              <p><strong>Lema:</strong> "¡Alto y lejos!"</p>
            </div>
          </div>

          {/* Patrulla Demo 3 */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">🦁 Leones Valientes</h3>
              <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Activa</span>
            </div>
            <div className="space-y-2 text-white/80">
              <p><strong>Rama:</strong> Lobatos</p>
              <p><strong>Miembros:</strong> 9</p>
              <p><strong>Dirigente:</strong> Ana Torres</p>
              <p><strong>Lema:</strong> "¡Rugimos juntos!"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}