import { useState, useEffect } from 'react';
import { X, Shield, Check, AlertCircle, Loader2 } from 'lucide-react';
import { PermissionsService, Rol, AsignacionRol } from '../../../services/permissionsService';
import { AuditService } from '../../../services/auditService';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { toast } from 'sonner';

// ================================================================
// TIPOS
// ================================================================

interface AsignarRolDialogProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: {
    id: string;
    email: string;
    nombre: string;
    roles: Rol[];
  };
  onRolesActualizados: () => void;
}

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

export default function AsignarRolDialog({
  isOpen,
  onClose,
  usuario,
  onRolesActualizados
}: AsignarRolDialogProps) {
  const { user } = useAuth();
  const { seguridad } = usePermissions();
  const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);
  const [rolesSeleccionados, setRolesSeleccionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Cargar roles disponibles y roles actuales del usuario
  useEffect(() => {
    if (isOpen && usuario) {
      cargarRoles();
      setRolesSeleccionados(usuario.roles.map(r => r.id));
    }
  }, [isOpen, usuario]);

  const cargarRoles = async () => {
    setLoading(true);
    try {
      const roles = await PermissionsService.listarRoles();
      // Filtrar roles que el usuario actual puede asignar
      const miNivel = seguridad?.roles[0]?.nivel_jerarquia || 0;
      const rolesFiltrados = roles.filter(r => r.nivel_jerarquia < miNivel || miNivel >= 100);
      setRolesDisponibles(rolesFiltrados);
    } catch (error) {
      toast.error('Error al cargar roles');
    } finally {
      setLoading(false);
    }
  };

  const toggleRol = (rolId: string) => {
    setRolesSeleccionados(prev => 
      prev.includes(rolId) 
        ? prev.filter(id => id !== rolId)
        : [...prev, rolId]
    );
  };

  const handleGuardar = async () => {
    if (!user?.id) {
      toast.error('No se pudo identificar al administrador');
      return;
    }

    setGuardando(true);
    try {
      // Obtener roles a agregar y roles a quitar
      const rolesActualesIds = usuario.roles.map(r => r.id);
      const rolesAgregar = rolesSeleccionados.filter(id => !rolesActualesIds.includes(id));
      const rolesQuitar = rolesActualesIds.filter(id => !rolesSeleccionados.includes(id));

      // Asignar nuevos roles
      for (const rolId of rolesAgregar) {
        const rol = rolesDisponibles.find(r => r.id === rolId);
        const asignacion: AsignacionRol = {
          user_id: usuario.id,
          rol_nombre: rol?.nombre || ''
        };
        await PermissionsService.asignarRol(user.id, asignacion);
        await AuditService.registrar(user.id, {
          modulo: 'seguridad',
          accion: 'crear',
          tabla: 'usuario_roles',
          registroId: usuario.id,
          descripcion: `Rol "${rol?.nombre}" asignado a ${usuario.nombre}`,
          datosNuevos: { rol_id: rolId, usuario_id: usuario.id }
        });
      }

      // Quitar roles
      for (const rolId of rolesQuitar) {
        const rol = rolesDisponibles.find(r => r.id === rolId);
        await PermissionsService.revocarRol(user.id, usuario.id, rol?.nombre || '');
        await AuditService.registrar(user.id, {
          modulo: 'seguridad',
          accion: 'eliminar',
          tabla: 'usuario_roles',
          registroId: usuario.id,
          descripcion: `Rol "${rol?.nombre}" revocado de ${usuario.nombre}`,
          datosAnteriores: { rol_id: rolId, usuario_id: usuario.id }
        });
      }

      toast.success('Roles actualizados correctamente');
      onRolesActualizados();
      onClose();
    } catch (error) {
      console.error('Error al guardar roles:', error);
      toast.error('Error al actualizar roles');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Asignar Roles</h2>
                <p className="text-sm text-gray-500">{usuario.nombre}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Selecciona los roles que deseas asignar a este usuario:
                </p>

                <div className="space-y-2">
                  {rolesDisponibles.map(rol => {
                    const isSelected = rolesSeleccionados.includes(rol.id);

                    return (
                      <label
                        key={rol.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRol(rol.id)}
                          className="sr-only"
                        />
                        <div 
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-blue-500' : 'border border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: rol.color }}
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{rol.nombre}</span>
                          <p className="text-xs text-gray-500">{rol.descripcion}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          rol.nivel_jerarquia >= 90 ? 'bg-red-100 text-red-700' :
                          rol.nivel_jerarquia >= 70 ? 'bg-purple-100 text-purple-700' :
                          rol.nivel_jerarquia >= 50 ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          Nivel {rol.nivel_jerarquia}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {rolesDisponibles.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      No hay roles disponibles para asignar
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
