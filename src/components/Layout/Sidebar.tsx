import React, { useState } from 'react';
import { 
  Users, Shield, Calendar, ClipboardCheck, Book, Package,
  BarChart, Home, Award, Star, Flag, Map, TrendingUp,
  Tent, Wallet, Lock, Trophy, Medal, Settings, FileText,
  ChevronDown, ChevronRight, Rocket, ShieldCheck, Heart
} from 'lucide-react';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Modulo } from '../../services/permissionsService';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  modulo?: Modulo;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  items: MenuItem[];
}

// Ítems independientes (sin grupo)
const standaloneItems: MenuItem[] = [
  { id: 'dashboard',    label: 'Dashboard',       icon: Home,  gradient: 'from-blue-500 to-cyan-500',     modulo: 'dashboard'    },
  { id: 'scouts',       label: 'Scouts',          icon: Users, gradient: 'from-green-500 to-emerald-500', modulo: 'scouts'       },
  { id: 'portal-padres', label: 'Portal de Padres', icon: Heart, gradient: 'from-pink-500 to-rose-500',   modulo: 'portal_padres' },
];

const menuGroups: MenuGroup[] = [
  {
    id: 'inscripcion',
    label: 'Inscripción',
    icon: Star,
    gradient: 'from-teal-500 to-cyan-500',
    items: [
      { id: 'inscripcion-anual',             label: 'Inscripción Anual',   icon: Star,     gradient: 'from-teal-500 to-cyan-500',  modulo: 'inscripciones' },
      { id: 'config-documentos-inscripcion', label: 'Tipos de Documento',  icon: FileText, gradient: 'from-teal-400 to-cyan-400',  modulo: 'inscripciones' },
      { id: 'config-tarifas-inscripcion',    label: 'Tarifas',             icon: Settings, gradient: 'from-teal-600 to-cyan-600',  modulo: 'inscripciones' },
    ],
  },
  {
    id: 'progresion',
    label: 'Progresión',
    icon: TrendingUp,
    gradient: 'from-amber-500 to-orange-500',
    items: [
      { id: 'progresion',      label: 'Progresión',          icon: TrendingUp, gradient: 'from-amber-500 to-orange-500',  modulo: 'progresion' },
      { id: 'especialidades',  label: 'Especialidades',       icon: Medal,      gradient: 'from-yellow-500 to-amber-500',  modulo: 'progresion' },
      { id: 'admin-objetivos', label: 'Objetivos Educativos', icon: Settings,   gradient: 'from-orange-400 to-amber-500',  modulo: 'progresion' },
      { id: 'progresion-v2',   label: '✨ Progresión V2',     icon: Trophy,     gradient: 'from-cyan-500 to-teal-500',     modulo: 'progresion' },
      { id: 'progresion-v3',   label: '🧭 Progresión V3',     icon: Map,    gradient: 'from-emerald-600 to-lime-500',  modulo: 'progresion' },
      { id: 'progresion-v4',   label: '🚀 Progresión V4',     icon: Rocket, gradient: 'from-blue-500 to-violet-500',   modulo: 'progresion' },
    ],
  },
  {
    id: 'organizacion',
    label: 'Organización',
    icon: Flag,
    gradient: 'from-purple-500 to-violet-500',
    items: [
      { id: 'grupo-scout',   label: 'Grupo Scout',   icon: Flag,   gradient: 'from-purple-500 to-violet-500', modulo: 'configuracion' },
      { id: 'dirigentes',    label: 'Dirigentes',    icon: Shield, gradient: 'from-orange-500 to-red-500',    modulo: 'dirigentes'    },
      { id: 'comite-padres', label: 'Comité Padres', icon: Users,  gradient: 'from-purple-400 to-violet-400', modulo: 'comite_padres' },
      { id: 'patrullas',     label: 'Patrullas',     icon: Award,  gradient: 'from-red-500 to-pink-500',      modulo: 'patrullas'     },
    ],
  },
  {
    id: 'actividades',
    label: 'Actividades',
    icon: Calendar,
    gradient: 'from-indigo-500 to-purple-500',
    items: [
      { id: 'programa-semanal',    label: 'Programa',    icon: Calendar,      gradient: 'from-indigo-500 to-purple-500', modulo: 'programa_semanal'    },
      { id: 'asistencia',          label: 'Asistencia',  icon: ClipboardCheck, gradient: 'from-pink-500 to-rose-500',    modulo: 'asistencia'          },
      { id: 'actividades-exterior', label: 'Aire Libre', icon: Tent,           gradient: 'from-green-600 to-teal-600',   modulo: 'actividades_exterior' },
      { id: 'mapas',               label: 'Mapas',       icon: Map,            gradient: 'from-emerald-500 to-teal-500', modulo: 'mapas'               },
    ],
  },
  {
    id: 'gestion',
    label: 'Gestión',
    icon: Wallet,
    gradient: 'from-emerald-500 to-green-600',
    items: [
      { id: 'libro-oro',  label: 'Libro de Oro', icon: Book,    gradient: 'from-yellow-500 to-orange-500', modulo: 'libro_oro'  },
      { id: 'inventario', label: 'Inventario',   icon: Package, gradient: 'from-gray-500 to-slate-500',    modulo: 'inventario' },
      { id: 'finanzas',   label: 'Finanzas',     icon: Wallet,  gradient: 'from-emerald-500 to-green-600', modulo: 'finanzas'   },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: BarChart,
    gradient: 'from-blue-600 to-indigo-600',
    items: [
      { id: 'reportes',  label: 'Reportes',  icon: BarChart, gradient: 'from-blue-600 to-indigo-600', modulo: 'reportes'  },
      { id: 'seguridad',    label: 'Seguridad',    icon: Lock,         gradient: 'from-red-600 to-rose-600',       modulo: 'seguridad' },
      { id: 'seguridad-v2', label: 'Seguridad V2', icon: ShieldCheck,  gradient: 'from-violet-600 to-purple-600',  modulo: 'seguridad' },
    ],
  },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { puedeAcceder, esAdmin, esSuperAdmin, rolPrincipal } = usePermissions();
  const esDirigente = (rolPrincipal?.nivel_jerarquia ?? 0) >= 50;

  // Grupo que contiene el tab activo — expandido por defecto
  const activeGroupId = menuGroups.find(g => g.items.some(i => i.id === activeTab))?.id ?? null;
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(activeGroupId ? [activeGroupId] : [])
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  const canSeeItem = (item: MenuItem) => {
    if (esSuperAdmin || esAdmin) return true;
    if (!item.modulo) return true;
    return puedeAcceder(item.modulo);
  };

  const canSeeGroup = (group: MenuGroup) => group.items.some(canSeeItem);

  const totalItems   = standaloneItems.length + menuGroups.reduce((acc, g) => acc + g.items.length, 0);
  const visibleItems = standaloneItems.filter(canSeeItem).length +
    menuGroups.reduce((acc, g) => acc + g.items.filter(canSeeItem).length, 0);

  const renderMenuItem = (item: MenuItem, isSubItem = false) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onTabChange(item.id)}
        className={`nav-item w-full group ${isSubItem ? 'pl-2' : ''} ${isActive ? 'active' : ''}`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
          isActive
            ? 'bg-white shadow-lg'
            : `bg-gradient-to-br ${item.gradient} opacity-80 group-hover:opacity-100 group-hover:scale-110`
        }`}>
          <Icon className={`w-4 h-4 ${isActive ? 'text-gray-700' : 'text-white'}`} />
        </div>
        <span className="font-medium text-sm">{item.label}</span>
        {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full shadow-lg animate-pulse" />}
      </button>
    );
  };

  return (
    <div className="sidebar-gaming w-64 h-screen fixed top-16 left-0 z-40">
      {/* Logo */}
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
        <div className="space-y-1">
          {/* Ítems standalone */}
          {standaloneItems.filter(canSeeItem).map(item => renderMenuItem(item))}

          {/* Grupos colapsables */}
          {menuGroups.filter(canSeeGroup).map(group => {
            const GroupIcon = group.icon;
            const isExpanded  = expandedGroups.has(group.id);
            const hasActive   = group.items.some(i => i.id === activeTab);
            const visibleGroupItems = group.items.filter(canSeeItem);

            return (
              <div key={group.id} className="mt-2">
                {/* Cabecera del grupo */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    hasActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br ${group.gradient} flex-shrink-0`}>
                    <GroupIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider flex-1 text-left">
                    {group.label}
                  </span>
                  {isExpanded
                    ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                  }
                </button>

                {/* Ítems del grupo */}
                {isExpanded && (
                  <div className="mt-1 ml-2 pl-3 border-l-2 border-gray-100 space-y-1">
                    {visibleGroupItems.map(item => renderMenuItem(item, true))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Stats — solo visibles para admins y dirigentes */}
        {(esSuperAdmin || esAdmin || esDirigente) && (
        <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
            Acceso
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Módulos Disponibles</span>
              <span className="text-xs font-bold text-blue-600">{visibleItems}/{totalItems}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(visibleItems / totalItems) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-600">Nivel</span>
              <span className="text-xs font-bold text-purple-600">
                {esSuperAdmin ? 'Super Admin' : esAdmin ? 'Admin' : 'Usuario'}
              </span>
            </div>
          </div>
        </div>
        )}

        {/* Quick Actions — solo para admins y dirigentes */}
        {(esSuperAdmin || esAdmin || esDirigente) && (
        <div className="mt-6 space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
            Acciones Rápidas
          </h4>
          {(esSuperAdmin || esAdmin || puedeAcceder('scouts')) && (
            <button
              onClick={() => onTabChange('scouts')}
              className="w-full p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              ➕ Nuevo Scout
            </button>
          )}
          {(esSuperAdmin || esAdmin || puedeAcceder('dashboard')) && (
            <button
              onClick={() => onTabChange('dashboard')}
              className="w-full p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              📊 Ver Dashboard
            </button>
          )}
        </div>
        )}
      </nav>
    </div>
  );
}