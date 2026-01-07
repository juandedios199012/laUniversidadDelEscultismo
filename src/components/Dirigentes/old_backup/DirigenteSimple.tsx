import { useState } from 'react';
import { Shield, Users, Save, UserPlus, Award, Star } from 'lucide-react';

export default function DirigenteSimple() {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    rama: 'Scouts',
    cargo: 'Dirigente',
    formacion: 'Básico',
    telefono: '',
    correo: '',
    fechaIngreso: new Date().toISOString().split('T')[0]
  });

  const ramas = [
    { value: 'Manada', label: 'Manada (Lobatos 7-10 años)' },
    { value: 'Tropa', label: 'Tropa (Scouts 11-14 años)' },
    { value: 'Clan', label: 'Clan (Rovers 15-21 años)' },
    { value: 'Consejo', label: 'Consejo de Grupo' }
  ];

  const cargos = [
    { value: 'Jefe de Grupo', label: 'Jefe de Grupo' },
    { value: 'Jefe de Rama', label: 'Jefe de Rama' },
    { value: 'Subjefe de Rama', label: 'Subjefe de Rama' },
    { value: 'Dirigente', label: 'Dirigente' },
    { value: 'Dirigente en Formación', label: 'Dirigente en Formación' }
  ];

  const nivelesFormacion = [
    { value: 'Básico', label: 'Formación Básica' },
    { value: 'Intermedio', label: 'Formación Intermedia' },
    { value: 'Avanzado', label: 'Formación Avanzada' },
    { value: 'Insignia de Madera', label: 'Insignia de Madera' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Dirigente registrado correctamente (modo demo)');
    // Reset form
    setFormData({
      nombres: '',
      apellidos: '',
      rama: 'Scouts',
      cargo: 'Dirigente',
      formacion: 'Básico',
      telefono: '',
      correo: '',
      fechaIngreso: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="gaming-container">
      <div className="gaming-header">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
          <Shield className="w-10 h-10" />
          👨‍🏫 Gestión de Dirigentes
        </h1>
        <p className="text-xl text-gray-300">Administración de dirigentes y sus asignaciones por rama</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Dirigentes Activos</h3>
              <p className="text-3xl font-bold text-white">12</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Con Insignia de Madera</h3>
              <p className="text-3xl font-bold text-white">7</p>
            </div>
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">En Formación</h3>
              <p className="text-3xl font-bold text-white">3</p>
            </div>
            <Award className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Tiempo Promedio</h3>
              <p className="text-3xl font-bold text-white">4.2</p>
              <p className="text-sm text-white/70">años</p>
            </div>
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <UserPlus className="w-6 h-6 mr-3 text-blue-400" />
          Registrar Nuevo Dirigente
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Nombres <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.nombres}
                onChange={(e) => setFormData(prev => ({ ...prev, nombres: e.target.value }))}
                placeholder="Nombres del dirigente"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/30 hover:border-white/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Apellidos <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.apellidos}
                onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                placeholder="Apellidos del dirigente"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/30 hover:border-white/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Rama Responsable <span className="text-red-400">*</span>
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
                Cargo <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.cargo}
                onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white border-white/30 hover:border-white/50"
                required
              >
                {cargos.map(cargo => (
                  <option key={cargo.value} value={cargo.value} className="bg-gray-800 text-white">
                    {cargo.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Nivel de Formación
              </label>
              <select
                value={formData.formacion}
                onChange={(e) => setFormData(prev => ({ ...prev, formacion: e.target.value }))}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white border-white/30 hover:border-white/50"
              >
                {nivelesFormacion.map(nivel => (
                  <option key={nivel.value} value={nivel.value} className="bg-gray-800 text-white">
                    {nivel.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="987654321"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/30 hover:border-white/50"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
                placeholder="dirigente@ejemplo.com"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/30 hover:border-white/50"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Fecha de Ingreso <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.fechaIngreso}
                onChange={(e) => setFormData(prev => ({ ...prev, fechaIngreso: e.target.value }))}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white border-white/30 hover:border-white/50"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="gaming-btn primary flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Save className="w-5 h-5" />
              Registrar Dirigente
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Dirigentes Demo */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Shield className="w-6 h-6 mr-3 text-green-400" />
          Dirigentes Registrados (Demo)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-3 px-4 font-semibold text-white">Dirigente</th>
                <th className="text-left py-3 px-4 font-semibold text-white">Rama</th>
                <th className="text-left py-3 px-4 font-semibold text-white">Cargo</th>
                <th className="text-left py-3 px-4 font-semibold text-white">Formación</th>
                <th className="text-left py-3 px-4 font-semibold text-white">Contacto</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-medium text-white">María González Ruiz</div>
                  <div className="text-sm text-white/70">3 años de servicio</div>
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300">
                    Tropa Scout
                  </span>
                </td>
                <td className="py-4 px-4 text-white/80">Jefe de Rama</td>
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-white/80">Insignia de Madera</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-white/80">987654321</td>
              </tr>

              <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-medium text-white">Carlos Mendoza Silva</div>
                  <div className="text-sm text-white/70">5 años de servicio</div>
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300">
                    Manada
                  </span>
                </td>
                <td className="py-4 px-4 text-white/80">Jefe de Rama</td>
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-white/80">Insignia de Madera</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-white/80">987123456</td>
              </tr>

              <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-medium text-white">Ana Torres López</div>
                  <div className="text-sm text-white/70">2 años de servicio</div>
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300">
                    Clan Rover
                  </span>
                </td>
                <td className="py-4 px-4 text-white/80">Subjefe de Rama</td>
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <Award className="w-4 h-4 text-blue-400 mr-1" />
                    <span className="text-white/80">Formación Avanzada</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-white/80">987987987</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}