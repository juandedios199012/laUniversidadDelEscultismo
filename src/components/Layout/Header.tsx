import { Bell, Search, User, Award, Users, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useState } from 'react';

export default function Header() {
  const { user, signOut } = useAuth();
  const { rolPrincipal } = usePermissions();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Obtener nombre del usuario
  const nombreUsuario = user?.user_metadata?.full_name || 
                        user?.user_metadata?.name || 
                        user?.email?.split('@')[0] || 
                        'Usuario';
  
  // Obtener rol para mostrar
  const rolMostrar = rolPrincipal?.nombre?.replace('_', ' ') || 'Sin rol asignado';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="header-gaming h-16 fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Award className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Scout Manager</h1>
            <p className="text-xs text-white/80">La Universidad del Escultismo</p>
          </div>
        </div>
      </div>

      <div className="hidden md:flex items-center space-x-4 flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar scouts, patrullas, actividades..."
            className="w-full pl-10 pr-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden lg:flex items-center space-x-6 text-white/90">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">156 Scouts Activos</span>
          </div>
          <div className="w-px h-6 bg-white/20"></div>
          <div className="text-sm">
            <span className="text-white/70">Grupo Scout:</span>
            <span className="font-semibold ml-1">Lima 12</span>
          </div>
        </div>

        <button className="relative p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
        </button>

        {/* User Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 hover:bg-white/10 rounded-xl p-2 transition-colors"
          >
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">{nombreUsuario}</p>
              <p className="text-xs text-white/70 capitalize">{rolMostrar}</p>
            </div>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
              style={{ backgroundColor: rolPrincipal?.color || 'rgba(255,255,255,0.2)' }}
            >
              <User className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="p-3 bg-gray-50 border-b">
                  <p className="text-sm font-medium text-gray-900">{nombreUsuario}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full capitalize"
                    style={{ 
                      backgroundColor: rolPrincipal?.color ? `${rolPrincipal.color}20` : '#f3f4f6',
                      color: rolPrincipal?.color || '#6b7280'
                    }}
                  >
                    {rolMostrar}
                  </span>
                </div>
                <div className="p-1">
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button className="md:hidden p-2 rounded-xl bg-white/20 backdrop-blur-sm">
          <Menu className="w-5 h-5 text-white" />
        </button>
      </div>
    </header>
  );
}