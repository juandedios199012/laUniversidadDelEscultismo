import React, { useEffect, useState } from 'react';
import { X, Save, Loader2, Phone, Mail, MapPin, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import ScoutService from '../../services/scoutService';

// ─────────────────────────────────────────────────────────────
// EditarPerfilHijoDialog
//
// Responsive: bottom-sheet en móvil, modal centrado en escritorio.
// Campos limitados al contacto y estudios del scout (no datos
// administrativos como código, rama, etapa, etc.).
//
// Requiere permiso: portal_padres:editar:perfil_hijo
// ─────────────────────────────────────────────────────────────

interface Props {
  scoutId: string;
  scoutNombre: string;
  open: boolean;
  onClose: () => void;
  onGuardado?: () => void;
}

interface FormData {
  celular: string;
  celular_secundario: string;
  telefono: string;
  correo: string;
  correo_secundario: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  codigo_postal: string;
  centro_estudio: string;
  anio_estudios: string;
}

const EMPTY: FormData = {
  celular: '',
  celular_secundario: '',
  telefono: '',
  correo: '',
  correo_secundario: '',
  direccion: '',
  departamento: '',
  provincia: '',
  distrito: '',
  codigo_postal: '',
  centro_estudio: '',
  anio_estudios: '',
};

const EditarPerfilHijoDialog: React.FC<Props> = ({
  scoutId,
  scoutNombre,
  open,
  onClose,
  onGuardado,
}) => {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Cargar datos actuales cuando se abre el diálogo
  useEffect(() => {
    if (!open) return;
    setCargando(true);
    ScoutService.getScoutById(scoutId)
      .then((scout) => {
        if (!scout) return;
        setForm({
          celular: scout.celular ?? '',
          celular_secundario: scout.celular_secundario ?? '',
          telefono: scout.telefono ?? '',
          correo: scout.correo ?? '',
          correo_secundario: scout.correo_secundario ?? '',
          direccion: scout.direccion ?? '',
          departamento: scout.departamento ?? '',
          provincia: scout.provincia ?? '',
          distrito: scout.distrito ?? '',
          codigo_postal: scout.codigo_postal ?? '',
          centro_estudio: scout.centro_estudio ?? '',
          anio_estudios: scout.anio_estudios ?? '',
        });
      })
      .catch(() => toast.error('No se pudo cargar los datos del scout'))
      .finally(() => setCargando(false));
  }, [open, scoutId]);

  if (!open) return null;

  const set =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const result = await ScoutService.updateScout(scoutId, {
        celular: form.celular || undefined,
        celular_secundario: form.celular_secundario || undefined,
        telefono: form.telefono || undefined,
        correo: form.correo || undefined,
        correo_secundario: form.correo_secundario || undefined,
        direccion: form.direccion || undefined,
        departamento: form.departamento || undefined,
        provincia: form.provincia || undefined,
        distrito: form.distrito || undefined,
        codigo_postal: form.codigo_postal || undefined,
        centro_estudio: form.centro_estudio || undefined,
        anio_estudios: form.anio_estudios || undefined,
      });

      if (result.success) {
        toast.success('Datos actualizados correctamente');
        onGuardado?.();
        onClose();
      } else {
        toast.error(result.error ?? 'Error al guardar los datos');
      }
    } catch {
      toast.error('Error inesperado al guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    /* Overlay — clic fuera cierra el diálogo */
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      {/* Panel — bottom-sheet en móvil, modal en escritorio */}
      <div
        className="w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (sólo mobile) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Editar Datos de Contacto</h2>
            <p className="text-sm text-gray-500 truncate max-w-xs">{scoutNombre}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cargando ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-3 text-sm text-gray-400">Cargando datos...</span>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Teléfonos */}
              <section>
                <SectionHeader icon={<Phone className="w-4 h-4 text-blue-500" />} title="Teléfonos" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field
                    label="Celular"
                    value={form.celular}
                    onChange={set('celular')}
                    placeholder="+51 999 000 000"
                  />
                  <Field
                    label="Celular alternativo"
                    value={form.celular_secundario}
                    onChange={set('celular_secundario')}
                    placeholder="+51 999 000 000"
                  />
                  <Field
                    label="Teléfono fijo"
                    value={form.telefono}
                    onChange={set('telefono')}
                    placeholder="01 234 5678"
                  />
                </div>
              </section>

              {/* Correos */}
              <section>
                <SectionHeader icon={<Mail className="w-4 h-4 text-blue-500" />} title="Correos Electrónicos" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field
                    label="Correo principal"
                    value={form.correo}
                    onChange={set('correo')}
                    placeholder="correo@ejemplo.com"
                    type="email"
                  />
                  <Field
                    label="Correo alternativo"
                    value={form.correo_secundario}
                    onChange={set('correo_secundario')}
                    placeholder="correo@ejemplo.com"
                    type="email"
                  />
                </div>
              </section>

              {/* Dirección */}
              <section>
                <SectionHeader icon={<MapPin className="w-4 h-4 text-blue-500" />} title="Dirección" />
                <div className="space-y-3">
                  <Field
                    label="Dirección"
                    value={form.direccion}
                    onChange={set('direccion')}
                    placeholder="Av. Los Scouts 123"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Field
                      label="Departamento"
                      value={form.departamento}
                      onChange={set('departamento')}
                      placeholder="Lima"
                    />
                    <Field
                      label="Provincia"
                      value={form.provincia}
                      onChange={set('provincia')}
                      placeholder="Lima"
                    />
                    <Field
                      label="Distrito"
                      value={form.distrito}
                      onChange={set('distrito')}
                      placeholder="San Isidro"
                    />
                  </div>
                  <div className="md:w-1/3">
                    <Field
                      label="Código Postal"
                      value={form.codigo_postal}
                      onChange={set('codigo_postal')}
                      placeholder="15000"
                    />
                  </div>
                </div>
              </section>

              {/* Estudios */}
              <section>
                <SectionHeader icon={<BookOpen className="w-4 h-4 text-blue-500" />} title="Centro de Estudios" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field
                    label="Institución educativa"
                    value={form.centro_estudio}
                    onChange={set('centro_estudio')}
                    placeholder="I.E. San José"
                  />
                  <Field
                    label="Año / Grado"
                    value={form.anio_estudios}
                    onChange={set('anio_estudios')}
                    placeholder="4.° Secundaria"
                  />
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando || cargando}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {guardando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition"
      />
    </div>
  );
}

export default EditarPerfilHijoDialog;
