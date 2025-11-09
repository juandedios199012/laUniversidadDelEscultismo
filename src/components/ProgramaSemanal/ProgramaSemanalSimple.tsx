import { useState } from 'react';
import { Calendar, BookOpen, Save, Plus, Target } from 'lucide-react';

export default function ProgramaSemanalSimple() {
  const [formData, setFormData] = useState({
    rama: 'Scouts',
    semanaInicio: '',
    semanaFin: '',
    temaSemanal: '',
    objetivos: '',
    lunes: '',
    martes: '',
    miercoles: '',
    jueves: '',
    viernes: '',
    sabado: '',
    domingo: '',
    materiales: '',
    responsable: ''
  });

  const ramas = [
    { value: 'Lobatos', label: 'Manada - Lobatos (7-10 años)' },
    { value: 'Scouts', label: 'Tropa - Scouts (11-14 años)' },
    { value: 'Rovers', label: 'Clan - Rovers (15-21 años)' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Programa semanal guardado correctamente (modo demo)');
    // Reset form
    setFormData({
      rama: 'Scouts',
      semanaInicio: '',
      semanaFin: '',
      temaSemanal: '',
      objetivos: '',
      lunes: '',
      martes: '',
      miercoles: '',
      jueves: '',
      viernes: '',
      sabado: '',
      domingo: '',
      materiales: '',
      responsable: ''
    });
  };

  return (
    <div className="gaming-container">
      <div className="gaming-header">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
          <Calendar className="w-10 h-10" />
          📅 Programa Semanal
        </h1>
        <p className="text-xl text-gray-300">Planificación detallada de actividades semanales por rama</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Programas Activos</h3>
              <p className="text-3xl font-bold text-white">3</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Esta Semana</h3>
              <p className="text-3xl font-bold text-white">12</p>
              <p className="text-sm text-white/70">actividades</p>
            </div>
            <Calendar className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Responsables</h3>
              <p className="text-3xl font-bold text-white">8</p>
            </div>
            <Target className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Completado</h3>
              <p className="text-3xl font-bold text-white">85%</p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Plus className="w-6 h-6 mr-3 text-blue-400" />
          Nuevo Programa Semanal
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                Semana Inicio <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.semanaInicio}
                onChange={(e) => setFormData(prev => ({ ...prev, semanaInicio: e.target.value }))}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white border-white/30 hover:border-white/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Semana Fin <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.semanaFin}
                onChange={(e) => setFormData(prev => ({ ...prev, semanaFin: e.target.value }))}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white border-white/30 hover:border-white/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Responsable
              </label>
              <input
                type="text"
                value={formData.responsable}
                onChange={(e) => setFormData(prev => ({ ...prev, responsable: e.target.value }))}
                placeholder="Nombre del dirigente"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/30 hover:border-white/50"
              />
            </div>
          </div>

          {/* Tema y Objetivos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Tema Semanal
              </label>
              <input
                type="text"
                value={formData.temaSemanal}
                onChange={(e) => setFormData(prev => ({ ...prev, temaSemanal: e.target.value }))}
                placeholder="Ej: Aventuras en la Naturaleza"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/30 hover:border-white/50"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Objetivos de la Semana
              </label>
              <textarea
                value={formData.objetivos}
                onChange={(e) => setFormData(prev => ({ ...prev, objetivos: e.target.value }))}
                placeholder="Objetivos educativos y de desarrollo..."
                rows={3}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/30 hover:border-white/50 resize-none"
              />
            </div>
          </div>

          {/* Actividades por Día */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Actividades por Día</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              {[
                { key: 'lunes', label: 'Lunes' },
                { key: 'martes', label: 'Martes' },
                { key: 'miercoles', label: 'Miércoles' },
                { key: 'jueves', label: 'Jueves' },
                { key: 'viernes', label: 'Viernes' },
                { key: 'sabado', label: 'Sábado' },
                { key: 'domingo', label: 'Domingo' }
              ].map(dia => (
                <div key={dia.key} className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">
                    {dia.label}
                  </label>
                  <textarea
                    value={formData[dia.key as keyof typeof formData] as string}
                    onChange={(e) => setFormData(prev => ({ ...prev, [dia.key]: e.target.value }))}
                    placeholder={`Actividades del ${dia.label.toLowerCase()}`}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/30 hover:border-white/50 resize-none text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Materiales Necesarios */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/90">
              Materiales Necesarios
            </label>
            <textarea
              value={formData.materiales}
              onChange={(e) => setFormData(prev => ({ ...prev, materiales: e.target.value }))}
              placeholder="Lista de materiales y recursos necesarios para las actividades..."
              rows={3}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-white/30 hover:border-white/50 resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="gaming-btn primary flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Save className="w-5 h-5" />
              Guardar Programa
            </button>
          </div>
        </form>
      </div>

      {/* Programas Recientes Demo */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Calendar className="w-6 h-6 mr-3 text-green-400" />
          Programas Recientes (Demo)
        </h2>

        <div className="space-y-4">
          {/* Programa Demo 1 */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">🏕️ Aventuras en la Naturaleza</h3>
                <p className="text-white/70">Tropa Scout • 14-20 Octubre 2025</p>
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Activo</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong className="text-white">Lunes:</strong>
                <p className="text-white/70">Preparación equipos</p>
              </div>
              <div>
                <strong className="text-white">Miércoles:</strong>
                <p className="text-white/70">Técnicas supervivencia</p>
              </div>
              <div>
                <strong className="text-white">Viernes:</strong>
                <p className="text-white/70">Construcción refugios</p>
              </div>
              <div>
                <strong className="text-white">Sábado:</strong>
                <p className="text-white/70">Campamento de día</p>
              </div>
            </div>
          </div>

          {/* Programa Demo 2 */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">🎭 Expresión y Creatividad</h3>
                <p className="text-white/70">Manada • 7-13 Octubre 2025</p>
              </div>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Completado</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong className="text-white">Martes:</strong>
                <p className="text-white/70">Teatro de títeres</p>
              </div>
              <div>
                <strong className="text-white">Jueves:</strong>
                <p className="text-white/70">Pintura y manualidades</p>
              </div>
              <div>
                <strong className="text-white">Sábado:</strong>
                <p className="text-white/70">Festival de talentos</p>
              </div>
              <div>
                <strong className="text-white">Domingo:</strong>
                <p className="text-white/70">Presentación familiar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}