import { 
  Users, 
  Shield, 
  Calendar, 
  ClipboardCheck,
  MapPin,
  Book,
  Package,
  BarChart,
  Home,
  Award,
  Star,
  Trophy,
  Flag,
  Map,
  TrendingUp,
  Tent,
  Wallet,
  Lock
} from 'lucide-react';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Modulo } from '../../services/permissionsService';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Mapeo de tabs a módulos de permisos
const menuItems: { 
  id: string; 
  label: string; 
  icon: React.ComponentType<{ className?: string }>; 
  gradient: string;
  modulo?: Modulo; // Módulo de permisos asociado
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, gradient: 'from-blue-500 to-cyan-500', modulo: 'dashboard' },
  { id: 'scouts', label: 'Scouts', icon: Users, gradient: 'from-green-500 to-emerald-500', modulo: 'scouts' },
  { id: 'inscripcion-anual', label: 'Inscripción Anual', icon: Star, gradient: 'from-teal-500 to-cyan-500', modulo: 'inscripciones' },
  { id: 'progresion', label: 'Progresión', icon: TrendingUp, gradient: 'from-amber-500 to-orange-500', modulo: 'progresion' },
  { id: 'admin-objetivos', label: '⚙️ Objetivos Educativos', icon: TrendingUp, gradient: 'from-orange-400 to-amber-500', modulo: 'progresion' },
  { id: 'grupo-scout', label: 'Grupo Scout', icon: Flag, gradient: 'from-purple-500 to-violet-500', modulo: 'configuracion' },
  { id: 'comite-padres', label: 'Comité Padres', icon: Users, gradient: 'from-purple-500 to-violet-500', modulo: 'comite_padres' },
  { id: 'dirigentes', label: 'Dirigentes', icon: Shield, gradient: 'from-orange-500 to-red-500', modulo: 'dirigentes' },
  { id: 'patrullas', label: 'Patrullas', icon: Award, gradient: 'from-red-500 to-pink-500', modulo: 'patrullas' },
  { id: 'programa-semanal', label: 'Programa', icon: Calendar, gradient: 'from-indigo-500 to-purple-500', modulo: 'programa_semanal' },
  { id: 'asistencia', label: 'Asistencia', icon: ClipboardCheck, gradient: 'from-pink-500 to-rose-500', modulo: 'asistencia' },
  { id: 'actividades', label: 'Actividades', icon: MapPin, gradient: 'from-cyan-500 to-blue-500', modulo: 'actividades' },
  { id: 'actividades-exterior', label: 'Aire Libre', icon: Tent, gradient: 'from-green-600 to-teal-600', modulo: 'actividades_exterior' },
  { id: 'mapas', label: 'Mapas', icon: Map, gradient: 'from-emerald-500 to-teal-500', modulo: 'mapas' },
  { id: 'libro-oro', label: 'Libro de Oro', icon: Book, gradient: 'from-yellow-500 to-orange-500', modulo: 'libro_oro' },
  { id: 'inventario', label: 'Inventario', icon: Package, gradient: 'from-gray-500 to-slate-500', modulo: 'inventario' },
  { id: 'finanzas', label: 'Finanzas', icon: Wallet, gradient: 'from-emerald-500 to-green-600', modulo: 'finanzas' },
  { id: 'reportes', label: 'Reportes', icon: BarChart, gradient: 'from-blue-600 to-indigo-600', modulo: 'reportes' },
  { id: 'seguridad', label: 'Seguridad', icon: Lock, gradient: 'from-red-600 to-rose-600', modulo: 'seguridad' }
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { puedeAcceder, esAdmin, esSuperAdmin } = usePermissions();

  // Filtrar menú según permisos
  const menuFiltrado = menuItems.filter(item => {
    // Super admin y admin ven todo
    if (esSuperAdmin || esAdmin) return true;
    
    // Si no tiene módulo asociado, mostrar (como dashboard)
    if (!item.modulo) return true;
    
    // Verificar si puede acceder al módulo
    return puedeAcceder(item.modulo);
  });

  // Calcular estadísticas de acceso
  const modulosActivos = menuFiltrado.length;
  const modulosTotal = menuItems.length;

  return (
    <div className="sidebar-gaming w-64 h-screen fixed top-16 left-0 z-40">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-800">Scout Manager</h1>
            <div className="flex items-center space-x-2">
              <Star className="w-3 h-3 text-yellow-500" />
              <p className="text-xs text-gray-600">Sistema Gaming</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="p-4 overflow-y-auto h-full pb-20">
        <div className="space-y-3">
          {menuFiltrado.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`nav-item w-full group animate-slide-in ${
                  isActive ? 'active' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? 'bg-white shadow-lg' 
                    : `bg-gradient-to-br ${item.gradient} opacity-80 group-hover:opacity-100 group-hover:scale-110`
                }`}>
                  <Icon className={`w-4 h-4 ${
                    isActive ? 'text-gray-700' : 'text-white'
                  }`} />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full shadow-lg animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Gaming Stats Section */}
        <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
            Acceso
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Módulos Disponibles</span>
              <span className="text-xs font-bold text-blue-600">{modulosActivos}/{modulosTotal}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(modulosActivos / modulosTotal) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-600">Nivel</span>
              <span className="text-xs font-bold text-purple-600">
                {esSuperAdmin ? 'Super Admin' : esAdmin ? 'Admin' : 'Usuario'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
            Acciones Rápidas
          </h4>
          <button className="w-full p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            ➕ Nuevo Scout
          </button>
          <button className="w-full p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            📊 Ver Dashboard
          </button>
        </div>
      </nav>
    </div>
  );
}