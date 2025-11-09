import { Calendar, BookOpen, Clock } from 'lucide-react';

export default function ProgramaSemanalDiagnostic() {
  return (
    <div className="gaming-container">
      <div className="gaming-header">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
          <Calendar className="w-10 h-10" />
          📅 Programa Semanal - Diagnóstico
        </h1>
        <p className="text-xl text-gray-300">Módulo de diagnóstico para programa semanal</p>
      </div>

      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <BookOpen className="w-6 h-6 mr-3 text-blue-400" />
          Estado del Módulo
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <Clock className="w-5 h-5 text-green-400" />
            <span className="text-white">Componente cargado correctamente</span>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-white">Planificación semanal lista</span>
          </div>
          
          <div className="text-white/70">
            <p>Este es un componente de diagnóstico temporal para verificar que el módulo de Programa Semanal carga correctamente.</p>
            <p className="mt-2">Si ves este mensaje, el problema no está en los imports o estructura básica del componente.</p>
          </div>
        </div>
      </div>
    </div>
  );
}