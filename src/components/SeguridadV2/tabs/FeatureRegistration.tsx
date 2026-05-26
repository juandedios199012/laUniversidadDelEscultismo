import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  Key,
  Layers,
  Info,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermissions } from '../../../contexts/PermissionsContext';
import {
  SeguridadV2Service,
  AppModule,
  AppPermission,
} from '../../../services/seguridadV2Service';
import { toast } from 'sonner';

// ================================================================
// FORMULARIO: Nuevo módulo
// ================================================================

interface FormModulo {
  name: string;
  label: string;
  icon: string;
  orden: string;
}

const FORM_MOD_INIT: FormModulo = { name: '', label: '', icon: '', orden: '0' };

function FormNuevoModulo({
  onCreated,
  disabled,
}: {
  onCreated: () => void;
  disabled: boolean;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormModulo>(FORM_MOD_INIT);
  const [saving, setSaving] = useState(false);

  // Auto-generar name desde label
  const handleLabelChange = (label: string) => {
    const name = label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    setForm((f) => ({ ...f, label, name }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !form.label.trim()) return;
    setSaving(true);

    const result = await SeguridadV2Service.registrarModulo(user.id, {
      name:  form.name.trim(),
      label: form.label.trim(),
      icon:  form.icon.trim() || null,
      orden: parseInt(form.orden) || 0,
    });

    if (result.success) {
      toast.success(`Módulo "${form.label}" registrado`);
      setForm(FORM_MOD_INIT);
      onCreated();
    } else {
      toast.error(result.error ?? 'Error al registrar módulo');
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
        <Layers className="w-4 h-4 text-blue-500" />
        Registrar Módulo
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Nombre UI <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="ej. Inventario"
            value={form.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            disabled={disabled}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Clave interna (auto)
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            disabled={disabled}
            placeholder="inventario"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-gray-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Icono (nombre Lucide)
          </label>
          <input
            type="text"
            placeholder="Package"
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Orden</label>
          <input
            type="number"
            value={form.orden}
            onChange={(e) => setForm((f) => ({ ...f, orden: e.target.value }))}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || saving || !form.label.trim()}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        Registrar en diccionario
      </button>
    </form>
  );
}

// ================================================================
// FORMULARIO: Nuevo permiso
// ================================================================

interface FormPermiso {
  module_id: string;
  name: string;
  permission_key: string;
  descripcion: string;
}

const FORM_PERM_INIT: FormPermiso = {
  module_id: '',
  name: '',
  permission_key: '',
  descripcion: '',
};

function FormNuevoPermiso({
  modulos,
  onCreated,
  disabled,
}: {
  modulos: AppModule[];
  onCreated: () => void;
  disabled: boolean;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormPermiso>(FORM_PERM_INIT);
  const [saving, setSaving] = useState(false);

  // Auto-generar permission_key desde módulo + nombre
  const handleNameChange = (name: string) => {
    const selectedMod = modulos.find((m) => m.id === form.module_id);
    const action = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const key = selectedMod ? `${selectedMod.name}:${action}` : action;
    setForm((f) => ({ ...f, name, permission_key: key }));
  };

  const handleModuleChange = (moduleId: string) => {
    const selectedMod = modulos.find((m) => m.id === moduleId);
    const action = form.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const key = selectedMod ? `${selectedMod.name}:${action}` : action;
    setForm((f) => ({ ...f, module_id: moduleId, permission_key: key }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !form.module_id || !form.name.trim()) return;
    setSaving(true);

    const result = await SeguridadV2Service.registrarPermiso(user.id, {
      module_id:      form.module_id,
      name:           form.name.trim(),
      permission_key: form.permission_key.trim(),
      descripcion:    form.descripcion.trim() || undefined,
    });

    if (result.success) {
      toast.success(`Permiso "${form.permission_key}" registrado`);
      setForm(FORM_PERM_INIT);
      onCreated();
    } else {
      toast.error(result.error ?? 'Error al registrar permiso');
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
        <Key className="w-4 h-4 text-green-500" />
        Registrar Permiso
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Módulo <span className="text-red-500">*</span>
          </label>
          <select
            value={form.module_id}
            onChange={(e) => handleModuleChange(e.target.value)}
            disabled={disabled}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          >
            <option value="">Selecciona un módulo…</option>
            {modulos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Nombre de la función <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="ej. Exportar a Excel"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={disabled}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Permission Key <span className="text-red-500">*</span>
            <span className="ml-1 text-gray-400 font-normal">(formato: modulo:accion o modulo:accion:objeto)</span>
          </label>
          <input
            type="text"
            placeholder="scouts:exportar:excel"
            value={form.permission_key}
            onChange={(e) => setForm((f) => ({ ...f, permission_key: e.target.value }))}
            disabled={disabled}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono disabled:opacity-50"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Descripción (opcional)
          </label>
          <input
            type="text"
            placeholder="Describe qué hace este permiso"
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || saving || !form.module_id || !form.name.trim()}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        Registrar en diccionario
      </button>
    </form>
  );
}

// ================================================================
// ÁRBOL: Lista de módulos y permisos existentes
// ================================================================

function ArbolModulos({
  modulos,
  onDelete,
  canDelete,
}: {
  modulos: AppModule[];
  onDelete: (type: 'modulo' | 'permiso', id: string, label: string) => void;
  canDelete: boolean;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h4 className="font-semibold text-gray-800 text-sm">Diccionario de Funcionalidades</h4>
        <span className="text-xs text-gray-400">{modulos.length} módulos registrados</span>
      </div>

      {modulos.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-400 text-sm">
          No hay módulos registrados. Usa el formulario de arriba para agregar uno.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {modulos.map((mod) => {
            const perms = mod.permissions ?? [];
            const isOpen = expanded.has(mod.id);
            return (
              <div key={mod.id}>
                {/* Módulo row */}
                <div
                  className="flex items-center px-4 py-2.5 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors select-none"
                  onClick={() => toggle(mod.id)}
                >
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-blue-400 mr-2 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-blue-400 mr-2 shrink-0" />
                  )}
                  <span className="font-medium text-blue-800 text-sm">{mod.label}</span>
                  <span className="ml-2 text-xs text-blue-400 font-mono">({mod.name})</span>
                  <span className="ml-auto mr-3 text-xs text-blue-500">{perms.length} permisos</span>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete('modulo', mod.id, mod.label);
                      }}
                      title="Desactivar módulo"
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Permisos del módulo */}
                {isOpen && (
                  <div className="divide-y divide-gray-50">
                    {perms.length === 0 ? (
                      <div className="px-8 py-2 text-xs text-gray-400 italic">
                        Sin permisos registrados en este módulo.
                      </div>
                    ) : (
                      perms.map((perm) => (
                        <div
                          key={perm.id}
                          className="flex items-center px-8 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-700">{perm.name}</span>
                            <span className="ml-2 text-xs font-mono text-gray-400">
                              {perm.permission_key}
                            </span>
                            {perm.descripcion && (
                              <span className="ml-2 text-xs text-gray-400 italic">
                                — {perm.descripcion}
                              </span>
                            )}
                          </div>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete('permiso', perm.id, perm.permission_key)}
                              title="Desactivar permiso"
                              className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

export default function FeatureRegistration() {
  const { user } = useAuth();
  const { esSuperAdmin } = usePermissions();

  const [modulos, setModulos] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    const data = await SeguridadV2Service.obtenerModulos();
    setModulos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleDelete = async (type: 'modulo' | 'permiso', id: string, label: string) => {
    if (!user?.id) return;
    const confirmed = window.confirm(
      `¿Desactivar "${label}"?\n\nEl elemento no se eliminará pero dejará de aparecer en la matriz.`,
    );
    if (!confirmed) return;

    let result: { success: boolean; error?: string };
    if (type === 'modulo') {
      result = await SeguridadV2Service.eliminarModulo(user.id, id);
    } else {
      result = await SeguridadV2Service.eliminarPermiso(user.id, id);
    }

    if (result.success) {
      toast.success(`"${label}" desactivado`);
      cargar();
    } else {
      toast.error(result.error ?? 'Error al desactivar');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-gray-900">Registro de Funcionalidades</h3>
        <p className="text-sm text-gray-500">
          Como desarrollador, registra aquí los módulos y permisos de la aplicación.
          Una vez registrados, el super_admin puede asignarlos a roles desde la pestaña{' '}
          <strong>Matriz de Permisos</strong>.
        </p>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <strong>Flujo de trabajo:</strong>
          <ol className="mt-1 list-decimal list-inside space-y-0.5">
            <li>Desarrollas la función en React y la proteges con <code className="font-mono text-xs bg-blue-100 px-1 rounded">{'<Guard permission="modulo:accion" />'}</code></li>
            <li>Registras el <strong>módulo</strong> y el <strong>permiso</strong> en este formulario.</li>
            <li>El super_admin activa el switch en la <strong>Matriz de Permisos</strong> para el rol deseado.</li>
          </ol>
        </div>
      </div>

      {!esSuperAdmin && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Solo <strong>super_admin</strong> puede registrar o eliminar módulos y permisos.
        </div>
      )}

      {/* Formularios en paralelo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormNuevoModulo onCreated={cargar} disabled={!esSuperAdmin} />
        <FormNuevoPermiso modulos={modulos} onCreated={cargar} disabled={!esSuperAdmin} />
      </div>

      {/* Árbol de módulos/permisos existentes */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando diccionario…</span>
        </div>
      ) : (
        <ArbolModulos
          modulos={modulos}
          onDelete={handleDelete}
          canDelete={esSuperAdmin}
        />
      )}
    </div>
  );
}
