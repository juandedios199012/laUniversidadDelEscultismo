import { useState, useEffect } from 'react';
import { 
  Shield, Users, Activity, Settings, UserPlus, 
  Trash2, Edit, ChevronDown, ChevronUp, Search,
  Download, Filter, RefreshCw, Clock, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions, AccesoDenegado } from '../../contexts/PermissionsContext';
import { PermissionsService, Rol, Modulo } from '../../services/permissionsService';
import { AuditService, RegistroAuditoria, FiltrosAuditoria } from '../../services/auditService';
import AsignarRolDialog from './dialogs/AsignarRolDialog';

// ================================================================
// TIPOS LOCALES
// ================================================================

type TabId = 'roles' | 'usuarios' | 'auditoria' | 'configuracion';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  roles: Rol[];
  ultimo_acceso?: string;
}

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

export default function SeguridadDashboard() {
  const { puedeAcceder, esSuperAdmin, esAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabId>('roles');

  // Verificar permisos
  if (!puedeAcceder('seguridad') && !esAdmin) {
    return <AccesoDenegado modulo="Seguridad" />;
  }

  const tabs = [
    { id: 'roles' as TabId, label: 'Roles y Permisos', icon: Shield },
    { id: 'usuarios' as TabId, label: 'Usuarios', icon: Users },
    { id: 'auditoria' as TabId, label: 'Auditoría', icon: Activity },
    ...(esSuperAdmin ? [{ id: 'configuracion' as TabId, label: 'Configuración', icon: Settings }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            Seguridad y Permisos
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona roles, permisos y auditoría del sistema
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {activeTab === 'roles' && <TabRoles />}
        {activeTab === 'usuarios' && <TabUsuarios />}
        {activeTab === 'auditoria' && <TabAuditoria />}
        {activeTab === 'configuracion' && <TabConfiguracion />}
      </div>
    </div>
  );
}

// ================================================================
// TAB: ROLES Y PERMISOS
// ================================================================

function TabRoles() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  useEffect(() => {
    cargarRoles();
  }, []);

  const cargarRoles = async () => {
    setLoading(true);
    const data = await PermissionsService.listarRoles();
    setRoles(data);
    setLoading(false);
  };

  const MODULOS: { modulo: Modulo; label: string; icon: string }[] = [
    { modulo: 'dashboard', label: 'Dashboard', icon: '📊' },
    { modulo: 'scouts', label: 'Scouts', icon: '⚜️' },
    { modulo: 'dirigentes', label: 'Dirigentes', icon: '👥' },
    { modulo: 'patrullas', label: 'Patrullas', icon: '🏕️' },
    { modulo: 'asistencia', label: 'Asistencia', icon: '✅' },
    { modulo: 'actividades', label: 'Actividades', icon: '🎯' },
    { modulo: 'progresion', label: 'Progresión', icon: '📈' },
    { modulo: 'inscripciones', label: 'Inscripciones', icon: '📝' },
    { modulo: 'finanzas', label: 'Finanzas', icon: '💰' },
    { modulo: 'inventario', label: 'Inventario', icon: '📦' },
    { modulo: 'reportes', label: 'Reportes', icon: '📋' },
    { modulo: 'seguridad', label: 'Seguridad', icon: '🔐' },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
        <p className="text-gray-500">Cargando roles...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Roles del Sistema</h2>
        <button 
          onClick={cargarRoles}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Lista de Roles */}
      <div className="space-y-4">
        {roles.map(rol => (
          <div 
            key={rol.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Header del Rol */}
            <div 
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setExpandedRole(expandedRole === rol.id ? null : rol.id)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: rol.color }}
                >
                  {rol.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{rol.nombre}</h3>
                  <p className="text-sm text-gray-500">{rol.descripcion}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {rol.usuarios_count || 0} usuarios
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  rol.nivel_jerarquia >= 90 ? 'bg-red-100 text-red-700' :
                  rol.nivel_jerarquia >= 70 ? 'bg-purple-100 text-purple-700' :
                  rol.nivel_jerarquia >= 50 ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  Nivel {rol.nivel_jerarquia}
                </span>
                {expandedRole === rol.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Permisos del Rol (Expandible) */}
            {expandedRole === rol.id && (
              <div className="p-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Permisos por Módulo</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {MODULOS.map(({ modulo, label, icon }) => (
                    <div 
                      key={modulo}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                    >
                      <span>{icon}</span>
                      <span className="text-sm text-gray-700">{label}</span>
                    </div>
                  ))}
                </div>
                {rol.es_sistema && (
                  <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Este es un rol del sistema y no puede ser eliminado
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ================================================================
// TAB: USUARIOS
// ================================================================

function TabUsuarios() {
  const { user } = useAuth();
  const { puedeCrear, puedeEliminar } = usePermissions();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [showAsignarRol, setShowAsignarRol] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      // TODO: Implementar carga de usuarios desde auth.users o tabla personalizada
      // Por ahora dejamos el array vacío
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAsignarRol = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setShowAsignarRol(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {puedeCrear('seguridad') && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <UserPlus className="w-4 h-4" />
              Invitar Usuario
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Usuario</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Roles</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Último Acceso</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Cargando usuarios...
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hay usuarios registrados</p>
                </td>
              </tr>
            ) : (
              usuarios.filter(u => 
                u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
                u.nombre.toLowerCase().includes(busqueda.toLowerCase())
              ).map(usuario => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {usuario.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{usuario.nombre}</p>
                        <p className="text-sm text-gray-500">{usuario.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {usuario.roles.map(rol => (
                        <span 
                          key={rol.id}
                          className="px-2 py-1 text-xs rounded-full text-white"
                          style={{ backgroundColor: rol.color }}
                        >
                          {rol.nombre}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {usuario.ultimo_acceso || 'Nunca'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleAsignarRol(usuario)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar roles"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {puedeEliminar('seguridad') && usuario.id !== user?.id && (
                        <button 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog para asignar roles */}
      {showAsignarRol && usuarioSeleccionado && (
        <AsignarRolDialog
          isOpen={showAsignarRol}
          onClose={() => {
            setShowAsignarRol(false);
            setUsuarioSeleccionado(null);
          }}
          usuario={usuarioSeleccionado}
          onRolesActualizados={cargarUsuarios}
        />
      )}
    </div>
  );
}

// ================================================================
// TAB: AUDITORÍA
// ================================================================

function TabAuditoria() {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filtros, setFiltros] = useState<FiltrosAuditoria>({
    limit: 50,
    offset: 0
  });
  const [showFiltros, setShowFiltros] = useState(false);

  useEffect(() => {
    cargarAuditoria();
  }, [filtros]);

  const cargarAuditoria = async () => {
    setLoading(true);
    const resultado = await AuditService.consultar(filtros);
    setRegistros(resultado.registros);
    setTotal(resultado.total);
    setLoading(false);
  };

  const getAccionColor = (accion: string) => {
    switch (accion) {
      case 'crear': return 'bg-green-100 text-green-700';
      case 'editar': return 'bg-blue-100 text-blue-700';
      case 'eliminar': return 'bg-red-100 text-red-700';
      case 'leer': return 'bg-gray-100 text-gray-700';
      case 'exportar': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Registro de Auditoría</h2>
          <p className="text-sm text-gray-500">{total} registros encontrados</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFiltros(!showFiltros)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
              showFiltros ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button
            onClick={cargarAuditoria}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Panel de Filtros */}
      {showFiltros && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Módulo</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={filtros.modulo || ''}
                onChange={e => setFiltros({ ...filtros, modulo: e.target.value as Modulo || undefined })}
              >
                <option value="">Todos</option>
                <option value="scouts">Scouts</option>
                <option value="dirigentes">Dirigentes</option>
                <option value="asistencia">Asistencia</option>
                <option value="finanzas">Finanzas</option>
                <option value="seguridad">Seguridad</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={filtros.accion || ''}
                onChange={e => setFiltros({ ...filtros, accion: e.target.value as any || undefined })}
              >
                <option value="">Todas</option>
                <option value="crear">Crear</option>
                <option value="editar">Editar</option>
                <option value="eliminar">Eliminar</option>
                <option value="leer">Leer</option>
                <option value="exportar">Exportar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input 
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={filtros.fecha_desde || ''}
                onChange={e => setFiltros({ ...filtros, fecha_desde: e.target.value || undefined })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input 
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={filtros.fecha_hasta || ''}
                onChange={e => setFiltros({ ...filtros, fecha_hasta: e.target.value || undefined })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Auditoría */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Fecha/Hora</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Usuario</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Módulo</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Acción</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Descripción</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Dispositivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Cargando registros...
                </td>
              </tr>
            ) : registros.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hay registros de auditoría</p>
                </td>
              </tr>
            ) : (
              registros.map(registro => (
                <tr key={registro.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {registro.fecha_hora}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{registro.user_nombre}</p>
                      <p className="text-xs text-gray-500">{registro.user_rol}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 capitalize">
                    {registro.modulo}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${getAccionColor(registro.accion)}`}>
                      {registro.accion}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                    {registro.descripcion}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 capitalize">
                    {registro.dispositivo}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {total > filtros.limit! && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Mostrando {filtros.offset! + 1} - {Math.min(filtros.offset! + filtros.limit!, total)} de {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltros({ ...filtros, offset: Math.max(0, filtros.offset! - filtros.limit!) })}
              disabled={filtros.offset === 0}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setFiltros({ ...filtros, offset: filtros.offset! + filtros.limit! })}
              disabled={filtros.offset! + filtros.limit! >= total}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ================================================================
// TAB: CONFIGURACIÓN (Solo Super Admin)
// ================================================================

function TabConfiguracion() {
  const { esSuperAdmin } = usePermissions();

  if (!esSuperAdmin) {
    return <AccesoDenegado mensaje="Solo el Super Administrador puede acceder a la configuración avanzada" />;
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Configuración de Seguridad</h2>
      
      <div className="space-y-6">
        {/* Políticas de Contraseña */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Políticas de Contraseña</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
              <span className="text-sm text-gray-700">Mínimo 8 caracteres</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
              <span className="text-sm text-gray-700">Incluir mayúsculas y minúsculas</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm text-gray-700">Incluir números</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm text-gray-700">Incluir caracteres especiales</span>
            </label>
          </div>
        </div>

        {/* Retención de Auditoría */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Retención de Auditoría</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">Mantener registros por</span>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="90">90 días</option>
              <option value="180">6 meses</option>
              <option value="365" selected>1 año</option>
              <option value="730">2 años</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Los registros más antiguos se eliminarán automáticamente
          </p>
        </div>

        {/* Sesiones */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Sesiones de Usuario</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">Tiempo de expiración de sesión:</span>
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="60">1 hora</option>
                <option value="240">4 horas</option>
                <option value="480" selected>8 horas</option>
                <option value="1440">24 horas</option>
              </select>
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
              <span className="text-sm text-gray-700">Permitir múltiples sesiones simultáneas</span>
            </label>
          </div>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end mt-6">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}
