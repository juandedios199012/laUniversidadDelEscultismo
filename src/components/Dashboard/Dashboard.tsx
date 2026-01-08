import { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Award, 
  Calendar, 
  Clock,
  MapPin,
  Book
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const quickActions = [
  { title: 'Nuevo Scout', description: 'Registrar un nuevo miembro', icon: Users, action: 'registro-scout' },
  { title: 'Programa Semanal', description: 'Crear programa de actividades', icon: Calendar, action: 'programa-semanal' },
  { title: 'Tomar Asistencia', description: 'Registrar asistencia del día', icon: Clock, action: 'asistencia' },
  { title: 'Libro de Oro', description: 'Agregar nueva entrada', icon: Book, action: 'libro-oro' }
];

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

interface DashboardStats {
  scoutsActivos: number;
  dirigentes: number;
  patrullas: number;
  actividades: number;
  tendenciaScouts: number;
  tendenciaDirigentes: number;
  tendenciaPatrullas: number;
  tendenciaActividades: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  time: string;
  created_at: string;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    scoutsActivos: 0,
    dirigentes: 0,
    patrullas: 0,
    actividades: 0,
    tendenciaScouts: 0,
    tendenciaDirigentes: 0,
    tendenciaPatrullas: 0,
    tendenciaActividades: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  const cargarDatosDashboard = async () => {
    try {
      setLoading(true);

      // Obtener scouts activos
      const { data: scoutsData, error: scoutsError } = await supabase
        .from('scouts')
        .select('id, created_at, es_dirigente')
        .eq('estado', 'ACTIVO');

      if (scoutsError) {
        console.error('Error obteniendo scouts:', scoutsError);
        throw scoutsError;
      }

      // Separar scouts y dirigentes
      const scouts = scoutsData?.filter(s => !s.es_dirigente) || [];
      const dirigentes = scoutsData?.filter(s => s.es_dirigente) || [];

      // Calcular tendencias (últimos 30 días)
      const hace30dias = new Date();
      hace30dias.setDate(hace30dias.getDate() - 30);

      const scoutsRecientes = scouts.filter(s => 
        new Date(s.created_at) >= hace30dias
      ).length;

      const dirigentesRecientes = dirigentes.filter(d => 
        new Date(d.created_at) >= hace30dias
      ).length;

      // Obtener patrullas
      const { data: patrullasData, error: patrullasError } = await supabase
        .from('patrullas')
        .select('id, created_at')
        .eq('estado', 'ACTIVO');

      if (patrullasError) {
        console.error('Error obteniendo patrullas:', patrullasError);
      }

      const patrullasRecientes = patrullasData?.filter(p => 
        new Date(p.created_at) >= hace30dias
      ).length || 0;

      // Obtener actividades del programa semanal
      const { data: actividadesData, error: actividadesError } = await supabase
        .from('programa_semanal')
        .select('id, created_at');

      if (actividadesError) {
        console.error('Error obteniendo actividades:', actividadesError);
      }

      const actividadesRecientes = actividadesData?.filter(a => 
        new Date(a.created_at) >= hace30dias
      ).length || 0;

      // Actualizar stats
      setStats({
        scoutsActivos: scouts.length,
        dirigentes: dirigentes.length,
        patrullas: patrullasData?.length || 0,
        actividades: actividadesData?.length || 0,
        tendenciaScouts: scoutsRecientes,
        tendenciaDirigentes: dirigentesRecientes,
        tendenciaPatrullas: patrullasRecientes,
        tendenciaActividades: actividadesRecientes
      });

      // Cargar actividad reciente
      await cargarActividadReciente();

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarActividadReciente = async () => {
    try {
      const actividades: RecentActivity[] = [];

      // Últimos scouts registrados (últimos 2)
      // Scouts solo tiene referencia a personas, no campos directos
      const { data: scoutsRecientes, error: scoutsError } = await supabase
        .from('scouts')
        .select('id, created_at, codigo_scout')
        .order('created_at', { ascending: false })
        .limit(2);

      if (scoutsError) {
        console.error('Error obteniendo scouts recientes:', scoutsError);
      }

      scoutsRecientes?.forEach(scout => {
        actividades.push({
          id: `scout-${scout.id}`,
          type: 'scout',
          message: `Scout ${scout.codigo_scout} se registró en el sistema`,
          time: calcularTiempoTranscurrido(scout.created_at),
          created_at: scout.created_at
        });
      });

      // Últimas actividades programadas
      const { data: programasRecientes, error: programasError } = await supabase
        .from('programa_semanal')
        .select('id, created_at, tema_central')
        .order('created_at', { ascending: false })
        .limit(2);

      if (programasError) {
        console.error('Error obteniendo programas recientes:', programasError);
      }

      programasRecientes?.forEach(programa => {
        actividades.push({
          id: `programa-${programa.id}`,
          type: 'program',
          message: `Programa "${programa.tema_central}" programado`,
          time: calcularTiempoTranscurrido(programa.created_at),
          created_at: programa.created_at
        });
      });

      // Últimas asistencias registradas
      const { data: asistenciasRecientes, error: asistenciasError } = await supabase
        .from('asistencias')
        .select('id, created_at, estado_asistencia, fecha')
        .order('created_at', { ascending: false })
        .limit(1);

      if (asistenciasError) {
        console.error('Error obteniendo asistencias recientes:', asistenciasError);
      }

      if (asistenciasRecientes && asistenciasRecientes.length > 0) {
        const fecha = asistenciasRecientes[0].fecha;
        
        // Contar asistencias de esa fecha
        const { data: asistenciasDia, error: asistenciasDiaError } = await supabase
          .from('asistencias')
          .select('estado_asistencia')
          .eq('fecha', fecha);

        if (asistenciasDiaError) {
          console.error('Error obteniendo asistencias del día:', asistenciasDiaError);
        }

        if (asistenciasDia && asistenciasDia.length > 0) {
          const presentes = asistenciasDia.filter(a => a.estado_asistencia === 'PRESENTE').length;
          const porcentaje = Math.round((presentes / asistenciasDia.length) * 100);

          actividades.push({
            id: `asistencia-${fecha}`,
            type: 'attendance',
            message: `Asistencia registrada - ${porcentaje}% presente`,
            time: calcularTiempoTranscurrido(asistenciasRecientes[0].created_at),
            created_at: asistenciasRecientes[0].created_at
          });
        }
      }

      // Ordenar por fecha y tomar los últimos 4
      actividades.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRecentActivity(actividades.slice(0, 4));

    } catch (error) {
      console.error('Error cargando actividad reciente:', error);
    }
  };

  const calcularTiempoTranscurrido = (fecha: string): string => {
    const ahora = new Date();
    const entonces = new Date(fecha);
    const diffMs = ahora.getTime() - entonces.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutos`;
    if (diffHours < 24) return `${diffHours} horas`;
    if (diffDays === 1) return '1 día';
    return `${diffDays} días`;
  };

  const statsConfig = [
    { 
      label: 'Scouts Activos', 
      value: stats.scoutsActivos, 
      icon: Users, 
      color: 'bg-blue-500', 
      trend: stats.tendenciaScouts 
    },
    { 
      label: 'Dirigentes', 
      value: stats.dirigentes, 
      icon: UserCheck, 
      color: 'bg-green-500', 
      trend: stats.tendenciaDirigentes 
    },
    { 
      label: 'Patrullas', 
      value: stats.patrullas, 
      icon: Award, 
      color: 'bg-purple-500', 
      trend: stats.tendenciaPatrullas 
    },
    { 
      label: 'Actividades', 
      value: stats.actividades, 
      icon: MapPin, 
      color: 'bg-orange-500', 
      trend: stats.tendenciaActividades 
    }
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 animate-bounce-in">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">🏕️ Bienvenido al Scout Manager</h1>
        <p className="text-lg text-gray-600">Gestiona tu grupo scout de manera épica y divertida</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsConfig.map((stat, index) => {
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
                  {stat.trend > 0 && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      ↗️ +{stat.trend} este mes
                    </p>
                  )}
                  {stat.trend === 0 && (
                    <p className="text-sm text-gray-500 font-medium mt-1">
                      → {stat.trend} este mes
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
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No hay actividad reciente</p>
                <p className="text-gray-400 text-xs mt-2">Las actividades aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">Hace {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}