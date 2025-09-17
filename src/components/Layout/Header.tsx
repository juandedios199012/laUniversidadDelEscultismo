import { Bell, Search, User, Award, Users, Menu } from 'lucide-react';

export default function Header() {
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

        <div className="flex items-center space-x-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-white">Admin Scout</p>
            <p className="text-xs text-white/70">Dirigente Principal</p>
          </div>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <User className="w-5 h-5 text-white" />
          </div>
          <button className="md:hidden p-2 rounded-xl bg-white/20 backdrop-blur-sm">
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
}