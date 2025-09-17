import { 
  Users, 
  UserCheck, 
  Award, 
  Calendar, 
  Clock,
  MapPin,
  Book
} from 'lucide-react';

const stats = [
  { label: 'Scouts Activos', value: '156', icon: Users, color: 'bg-blue-500', trend: '+12' },
  { label: 'Dirigentes', value: '23', icon: UserCheck, color: 'bg-green-500', trend: '+3' },
  { label: 'Patrullas', value: '8', icon: Award, color: 'bg-purple-500', trend: '0' },
  { label: 'Actividades', value: '42', icon: MapPin, color: 'bg-orange-500', trend: '+15' }
];

const quickActions = [
  { title: 'Nuevo Scout', description: 'Registrar un nuevo miembro', icon: Users, action: 'registro-scout' },
  { title: 'Programa Semanal', description: 'Crear programa de actividades', icon: Calendar, action: 'programa-semanal' },
  { title: 'Tomar Asistencia', description: 'Registrar asistencia del día', icon: Clock, action: 'asistencia' },
  { title: 'Libro de Oro', description: 'Agregar nueva entrada', icon: Book, action: 'libro-oro' }
];

const recentActivity = [
  { type: 'scout', message: 'Juan Pérez se registró en Tropa Halcones', time: '2 horas' },
  { type: 'program', message: 'Programa "Campismo Básico" programado', time: '4 horas' },
  { type: 'achievement', message: 'Patrulla Fénix completó actividad de nudos', time: '1 día' },
  { type: 'attendance', message: 'Asistencia registrada - 89% presente', time: '2 días' }
];

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 animate-bounce-in">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">🏕️ Bienvenido al Scout Manager</h1>
        <p className="text-lg text-gray-600">Gestiona tu grupo scout de manera épica y divertida</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colors = ['blue', 'green', 'gold', 'red'];
          return (
            <div 
              key={index} 
              className={`stats-card ${colors[index % colors.length]} animate-slide-in hover:scale-105`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  {stat.trend && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      ↗️ {stat.trend} este mes
                    </p>
                  )}
                </div>
                <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => onNavigate(action.action)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all text-left group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Actividad Reciente</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">Hace {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}