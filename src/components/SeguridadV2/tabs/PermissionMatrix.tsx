import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermissions } from '../../../contexts/PermissionsContext';
import {
  SeguridadV2Service,
  AppModule,
  AppPermission,
  RolBasico,
  MatrizCompleta,
} from '../../../services/seguridadV2Service';
import { toast } from 'sonner';

// ================================================================
// TIPOS LOCALES
// ================================================================

interface ToggleState {
  [permisoId: string]: { [rolId: string]: boolean };
}

// ================================================================
// SUBCOMPONENTE: Toggle Switch
// ================================================================

interface SwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}

function PermSwitch({ checked, onChange, disabled, loading }: SwitchProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && !loading && onChange(!checked)}
      disabled={disabled || loading}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
        ${checked ? 'bg-green-500' : 'bg-gray-300'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${loading ? 'opacity-60 cursor-wait' : ''}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

// ================================================================
// SUBCOMPONENTE: Fila de módulo (accordion)
// ================================================================

interface ModuloRowProps {
  modulo: AppModule;
  roles: RolBasico[];
  toggleState: ToggleState;
  saving: string | null; // permisoId-rolId siendo guardado
  canEdit: boolean;
  onToggle: (permisoId: string, rolId: string, currentVal: boolean) => void;
}

function ModuloRow({ modulo, roles, toggleState, saving, canEdit, onToggle }: ModuloRowProps) {
  const [expanded, setExpanded] = useState(true);

  const permisos = modulo.permissions ?? [];

  // Calcular si TODOS los permisos del módulo están activos para un rol
  const allGrantedForRole = (rolId: string) =>
    permisos.every((p) => toggleState[p.id]?.[rolId] === true);

  // Toggle masivo para un rol en este módulo
  const handleBulkToggle = (rolId: string) => {
    const shouldGrant = !allGrantedForRole(rolId);
    permisos.forEach((p) => {
      const current = toggleState[p.id]?.[rolId] ?? false;
      if (current !== shouldGrant) {
        onToggle(p.id, rolId, current);
      }
    });
  };

  return (
    <>
      {/* Encabezado del módulo */}
      <tr
        className="bg-blue-50 cursor-pointer select-none hover:bg-blue-100 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 font-semibold text-blue-800 text-sm uppercase tracking-wide">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-blue-500 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-blue-500 shrink-0" />
            )}
            {modulo.label}
            <span className="text-xs font-normal text-blue-500">
              ({permisos.length} permisos)
            </span>
          </div>
        </td>
        {roles.map((rol) => (
          <td key={rol.id} className="px-4 py-3 text-center">
            {expanded && permisos.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (canEdit) handleBulkToggle(rol.id);
                }}
                disabled={!canEdit}
                title={
                  canEdit
                    ? allGrantedForRole(rol.id)
                      ? 'Quitar todos'
                      : 'Otorgar todos'
                    : 'Solo super_admin puede modificar'
                }
                className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                  allGrantedForRole(rol.id)
                    ? 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'
                } ${!canEdit ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {allGrantedForRole(rol.id) ? '✓ Todos' : '— Ninguno'}
              </button>
            )}
          </td>
        ))}
      </tr>

      {/* Filas de permisos individuales */}
      {expanded &&
        permisos.map((perm) => (
          <tr key={perm.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
            <td className="px-4 py-2.5 pl-10">
              <div className="flex flex-col">
                <span className="text-sm text-gray-800">{perm.name}</span>
                <span className="text-xs font-mono text-gray-400">{perm.permission_key}</span>
                {perm.descripcion && (
                  <span className="text-xs text-gray-500 italic">{perm.descripcion}</span>
                )}
              </div>
            </td>
            {roles.map((rol) => {
              const isGranted = toggleState[perm.id]?.[rol.id] ?? false;
              const isLoading = saving === `${perm.id}-${rol.id}`;
              return (
                <td key={rol.id} className="px-4 py-2.5 text-center">
                  <PermSwitch
                    checked={isGranted}
                    onChange={(val) => onToggle(perm.id, rol.id, isGranted)}
                    disabled={!canEdit}
                    loading={isLoading}
                  />
                </td>
              );
            })}
          </tr>
        ))}
    </>
  );
}

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

export default function PermissionMatrix() {
  const { user } = useAuth();
  const { esSuperAdmin } = usePermissions();

  const [matrizData, setMatrizData] = useState<MatrizCompleta | null>(null);
  const [toggleState, setToggleState] = useState<ToggleState>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------------------
  // Carga de datos
  // ----------------------------------------------------------------
  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await SeguridadV2Service.obtenerMatrizCompleta();
      if (!data) {
        setError('No se pudieron cargar los datos de la matriz.');
        return;
      }
      setMatrizData(data);

      // Inicializar toggleState desde roles_con_permiso
      const state: ToggleState = {};
      for (const mod of data.modulos) {
        for (const perm of mod.permissions ?? []) {
          state[perm.id] = {};
          for (const rol of data.roles) {
            state[perm.id][rol.id] = (perm.roles_con_permiso ?? []).includes(rol.id);
          }
        }
      }
      setToggleState(state);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // ----------------------------------------------------------------
  // Toggle de un permiso
  // ----------------------------------------------------------------
  const handleToggle = useCallback(
    async (permisoId: string, rolId: string, currentVal: boolean) => {
      if (!user?.id || !esSuperAdmin) {
        toast.error('Solo super_admin puede modificar permisos v2');
        return;
      }

      const key = `${permisoId}-${rolId}`;
      setSaving(key);

      // Optimistic update
      setToggleState((prev) => ({
        ...prev,
        [permisoId]: { ...(prev[permisoId] ?? {}), [rolId]: !currentVal },
      }));

      const result = await SeguridadV2Service.togglePermiso(
        user.id,
        rolId,
        permisoId,
        !currentVal,
      );

      if (!result.success) {
        // Revertir si falló
        setToggleState((prev) => ({
          ...prev,
          [permisoId]: { ...(prev[permisoId] ?? {}), [rolId]: currentVal },
        }));
        toast.error(result.error ?? 'Error al cambiar el permiso');
      } else {
        toast.success(!currentVal ? 'Permiso otorgado' : 'Permiso revocado');
      }

      setSaving(null);
    },
    [user?.id, esSuperAdmin],
  );

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <p className="text-sm">Cargando matriz de permisos…</p>
      </div>
    );
  }

  if (error || !matrizData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
        <AlertTriangle className="w-8 h-8" />
        <p className="text-sm">{error ?? 'Error desconocido'}</p>
        <button
          type="button"
          onClick={cargar}
          className="mt-2 text-sm text-blue-600 underline hover:text-blue-800"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { roles, modulos } = matrizData;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Matriz de Permisos</h3>
          <p className="text-sm text-gray-500">
            Activa o desactiva permisos por rol. Los cambios se aplican de inmediato.
          </p>
        </div>
        <button
          type="button"
          onClick={cargar}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {!esSuperAdmin && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Solo <strong>super_admin</strong> puede modificar esta matriz. Estás en modo solo lectura.
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-bold text-gray-700 min-w-[260px]">
                Módulo / Funcionalidad
              </th>
              {roles.map((rol) => (
                <th key={rol.id} className="px-4 py-3 text-center font-bold text-gray-700 min-w-[120px]">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: rol.color ?? '#6b7280' }}
                    />
                    <span className="capitalize">{rol.nombre.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-400 font-normal">Nv. {rol.nivel}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modulos.length === 0 ? (
              <tr>
                <td
                  colSpan={roles.length + 1}
                  className="px-4 py-12 text-center text-gray-400"
                >
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>No hay módulos registrados aún.</p>
                  <p className="text-xs mt-1">
                    Ve a la pestaña <strong>Registro de Funcionalidades</strong> para agregar módulos.
                  </p>
                </td>
              </tr>
            ) : (
              modulos.map((mod) => (
                <ModuloRow
                  key={mod.id}
                  modulo={mod}
                  roles={roles}
                  toggleState={toggleState}
                  saving={saving}
                  canEdit={esSuperAdmin}
                  onToggle={handleToggle}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-4 rounded-full bg-green-500 flex items-center justify-end pr-0.5">
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
          <span>Permiso activo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-4 rounded-full bg-gray-300 flex items-center pl-0.5">
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
          <span>Sin permiso</span>
        </div>
        <span>•</span>
        <span>Los cambios se guardan de inmediato en la base de datos.</span>
      </div>
    </div>
  );
}
