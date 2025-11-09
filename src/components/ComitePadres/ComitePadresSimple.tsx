import { useState } from 'react';
import { Users, Calendar, Save, UserPlus, Search, User, TrendingUp } from 'lucide-react';

export default function ComitePadresSimple() {
  const [formData, setFormData] = useState({
    nombre: '',
    cargo: 'vocal',
    telefono: '',
    correo: '',
    fechaEleccion: '',
    fechaCulminacion: ''
  });

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
    // Reset form
    setFormData({
      nombre: '',
      cargo: 'vocal',
      telefono: '',
      correo: '',
      fechaEleccion: '',
      fechaCulminacion: ''
    });
  };

  return (
    <div className="gaming-container">
      <div className="gaming-header">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
          <Users className="w-10 h-10" />
          👨‍👩‍👧‍👦 Comité de Padres
        </h1>
        <p className="text-xl text-gray-300">Gestión del comité de padres de familia que representa al grupo scout</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Miembros Activos</h3>
              <p className="text-3xl font-bold text-white">5</p>
            </div>
            <User className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Períodos</h3>
              <p className="text-3xl font-bold text-white">3</p>
            </div>
            <Calendar className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Período Actual</h3>
              <p className="text-lg font-bold text-white">2024-2025</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Cargos Ocupados</h3>
              <p className="text-3xl font-bold text-white">5</p>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Formulario de Registro */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <UserPlus className="w-6 h-6 mr-3 text-blue-400" />
          Registrar Nuevo Miembro del Comité
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-lg font-bold text-white">
                Nombre Completo <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5 z-10" />
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Buscar familiar registrado o ingresar nuevo"
                  className="w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/40 hover:border-white/60 font-medium text-lg"
                  required
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}
                />
              </div>
              <small className="text-white/80 mt-1 block text-sm">
                Busque si el familiar ya está registrado en el sistema
              </small>
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-bold text-white">
                Cargo <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.cargo}
                onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                className="w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white/20 backdrop-blur-sm text-white border-white/40 hover:border-white/60 font-medium text-lg"
                required
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600'
                }}
              >
                {cargos.map(cargo => (
                  <option key={cargo.value} value={cargo.value} className="bg-gray-800 text-white text-lg">
                    {cargo.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-bold text-white">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="987654321"
                className="w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/40 hover:border-white/60 font-medium text-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600'
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-bold text-white">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
                placeholder="ejemplo@correo.com"
                className="w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/40 hover:border-white/60 font-medium text-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600'
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-bold text-white">
                Fecha de Elección <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.fechaEleccion}
                onChange={(e) => setFormData(prev => ({ ...prev, fechaEleccion: e.target.value }))}
                className="w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white/20 backdrop-blur-sm text-white border-white/40 hover:border-white/60 font-medium text-lg"
                required
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600'
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-bold text-white">
                Fecha de Culminación <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.fechaCulminacion}
                onChange={(e) => setFormData(prev => ({ ...prev, fechaCulminacion: e.target.value }))}
                className="w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white/20 backdrop-blur-sm text-white border-white/40 hover:border-white/60 font-medium text-lg"
                required
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600'
                }}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="gaming-btn primary flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg"
            >
              <Save className="w-6 h-6" />
              Registrar Miembro
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Comité Actual */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Users className="w-6 h-6 mr-3 text-green-400" />
          Comité Actual (Demo)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-4 px-4 font-bold text-white text-lg">Nombre</th>
                <th className="text-left py-4 px-4 font-bold text-white text-lg">Cargo</th>
                <th className="text-left py-4 px-4 font-bold text-white text-lg">Período</th>
                <th className="text-left py-4 px-4 font-bold text-white text-lg">Contacto</th>
                <th className="text-left py-4 px-4 font-bold text-white text-lg">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="py-5 px-4">
                  <div className="font-bold text-white text-lg">María Elena González</div>
                  <div className="text-white/80 text-sm">maria.gonzalez@email.com</div>
                </td>
                <td className="py-5 px-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    Presidenta
                  </span>
                </td>
                <td className="py-5 px-4">
                  <div className="font-bold text-white">2024-2025</div>
                  <div className="text-white/70 text-sm">Mar 2024 - Mar 2025</div>
                </td>
                <td className="py-5 px-4 text-white/90 font-medium">📱 987654321</td>
                <td className="py-5 px-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-500/30 text-green-200">
                    Activa
                  </span>
                </td>
              </tr>

              <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="py-5 px-4">
                  <div className="font-bold text-white text-lg">Carlos Mendoza Silva</div>
                  <div className="text-white/80 text-sm">carlos.mendoza@email.com</div>
                </td>
                <td className="py-5 px-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-green-500/30 text-green-200 border border-green-400/30">
                    Secretario
                  </span>
                </td>
                <td className="py-5 px-4">
                  <div className="font-bold text-white">2024-2025</div>
                  <div className="text-white/70 text-sm">Mar 2024 - Mar 2025</div>
                </td>
                <td className="py-5 px-4 text-white/90 font-medium">📱 987123456</td>
                <td className="py-5 px-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-500/30 text-green-200">
                    Activo
                  </span>
                </td>
              </tr>

              <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="py-5 px-4">
                  <div className="font-bold text-white text-lg">Ana Torres López</div>
                  <div className="text-white/80 text-sm">ana.torres@email.com</div>
                </td>
                <td className="py-5 px-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-yellow-500/30 text-yellow-200 border border-yellow-400/30">
                    Tesorera
                  </span>
                </td>
                <td className="py-5 px-4">
                  <div className="font-bold text-white">2024-2025</div>
                  <div className="text-white/70 text-sm">Mar 2024 - Mar 2025</div>
                </td>
                <td className="py-5 px-4 text-white/90 font-medium">📱 987987987</td>
                <td className="py-5 px-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-500/30 text-green-200">
                    Activa
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}