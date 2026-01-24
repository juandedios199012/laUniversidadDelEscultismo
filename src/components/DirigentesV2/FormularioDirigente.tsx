/**
 * Formulario de Registro de Dirigentes
 * Basado en formato DNGI-02 - Registro Institucional para Adultos Voluntarios
 * 
 * Diseño: Glassmorphism con secciones colapsables
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CollapsibleSection,
  InputField,
  SelectField,
  CheckboxField,
  TextAreaField,
  Button,
  Badge,
  Toast,
} from '../ui/GlassUI';
import {
  FormularioDirigente,
  FORMULARIO_INICIAL,
  CARGOS_LABELS,
  NIVELES_FORMACION_LABELS,
  TIPOS_MEMBRESIA_LABELS,
  TIPOS_DOCUMENTO,
  GRUPOS_SANGUINEOS,
  FACTORES_RH,
  RAMAS_LABELS,
  CargoDirigente,
  NivelFormacion,
  TipoMembresia,
} from '../../types/dirigente';
import DirigenteService from '../../services/dirigenteServiceV2';
import { supabase } from '../../lib/supabase';

// ============================================================================
// ICONOS SVG
// ============================================================================

const Icons = {
  User: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Building: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="22" x2="9" y2="2" />
      <line x1="15" y1="22" x2="15" y2="2" />
    </svg>
  ),
  MapPin: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Heart: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Briefcase: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Award: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  Shield: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Phone: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Save: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  ArrowLeft: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
};

// ============================================================================
// INTERFACES
// ============================================================================

interface FormularioDirigenteProps {
  dirigenteId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface GrupoScoutOption {
  id: string;
  nombre: string;
  numeral: string;
  localidad: string;
  region: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const FormularioDirigenteComponent: React.FC<FormularioDirigenteProps> = ({
  dirigenteId,
  onSuccess,
  onCancel,
}) => {
  // Estados
  const [formData, setFormData] = useState<FormularioDirigente>(FORMULARIO_INICIAL);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastState>({ show: false, type: 'info', message: '' });
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [grupos, setGrupos] = useState<GrupoScoutOption[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(false);

  const isEditing = !!dirigenteId;

  // ==========================================================================
  // EFECTOS
  // ==========================================================================

  // Cargar datos si estamos editando
  useEffect(() => {
    if (dirigenteId) {
      cargarDatosDirigente(dirigenteId);
    }
  }, [dirigenteId]);

  // Cargar lista de grupos scout
  useEffect(() => {
    cargarGrupos();
  }, []);

  // Calcular porcentaje de completitud
  useEffect(() => {
    calcularCompletitud();
  }, [formData]);

  // ==========================================================================
  // FUNCIONES
  // ==========================================================================

  const cargarDatosDirigente = async (id: string) => {
    setLoadingData(true);
    try {
      const dirigente = await DirigenteService.obtenerDirigentePorId(id);
      if (dirigente) {
        setFormData({
          nombres: dirigente.persona.nombres,
          apellidos: dirigente.persona.apellidos,
          fecha_nacimiento: dirigente.persona.fecha_nacimiento || '',
          sexo: dirigente.persona.sexo || '',
          tipo_documento: dirigente.persona.tipo_documento || 'DNI',
          numero_documento: dirigente.persona.numero_documento || '',
          correo: dirigente.persona.correo || '',
          correo_institucional: dirigente.persona.correo_institucional || '',
          celular: dirigente.persona.celular || '',
          telefono: dirigente.persona.telefono || '',
          departamento: dirigente.persona.departamento || '',
          provincia: dirigente.persona.provincia || '',
          distrito: dirigente.persona.distrito || '',
          direccion: dirigente.persona.direccion || '',
          codigo_postal: dirigente.persona.codigo_postal || '',
          // Datos de salud (ahora vienen de persona - DRY)
          religion: dirigente.persona.religion || '',
          grupo_sanguineo: dirigente.persona.grupo_sanguineo || '',
          factor_sanguineo: dirigente.persona.factor_sanguineo || '',
          seguro_medico: dirigente.persona.seguro_medico || '',
          tipo_discapacidad: dirigente.persona.tipo_discapacidad || '',
          carnet_conadis: dirigente.persona.carnet_conadis || '',
          descripcion_discapacidad: dirigente.persona.descripcion_discapacidad || '',
          codigo_credencial: dirigente.codigo_credencial || '',
          grupo_id: dirigente.grupo_id || '',
          unidad: dirigente.unidad || '',
          cargo: dirigente.cargo || '',
          centro_estudios: dirigente.centro_estudios || '',
          ciclo_anio_estudios: dirigente.ciclo_anio_estudios || '',
          centro_laboral: dirigente.centro_laboral || '',
          cargo_laboral: dirigente.cargo_laboral || '',
          nivel_formacion: dirigente.nivel_formacion || '',
          fecha_sfh1: dirigente.fecha_sfh1 || '',
          aprobo_sfh1: dirigente.aprobo_sfh1 || false,
          tipo_membresia: dirigente.tipo_membresia || 'REGISTRO_ANUAL_REGULAR',
          fecha_inicio_membresia: dirigente.fecha_inicio_membresia || '',
          acepta_politica_proteccion: dirigente.acepta_politica_proteccion || false,
          acepta_codigo_conducta: dirigente.acepta_codigo_conducta || false,
          autoriza_cuenta_institucional: dirigente.autoriza_cuenta_institucional || false,
          autoriza_uso_imagen: dirigente.autoriza_uso_imagen || false,
          declara_sin_antecedentes_policiales: dirigente.declara_sin_antecedentes_policiales || false,
          declara_sin_antecedentes_judiciales: dirigente.declara_sin_antecedentes_judiciales || false,
          declara_sin_antecedentes_penales: dirigente.declara_sin_antecedentes_penales || false,
          detalle_antecedentes: dirigente.detalle_antecedentes || '',
          contacto_emergencia_nombre: dirigente.contacto_emergencia?.nombre || '',
          contacto_emergencia_telefono: dirigente.contacto_emergencia?.telefono || '',
          contacto_emergencia_parentesco: dirigente.contacto_emergencia?.parentesco || '',
          observaciones: dirigente.observaciones || '',
        });
      }
    } catch (error) {
      showToast('error', 'Error al cargar datos del dirigente');
    } finally {
      setLoadingData(false);
    }
  };

  const cargarGrupos = async () => {
    setLoadingGrupos(true);
    try {
      const { data, error } = await supabase
        .from('grupos_scout')
        .select('id, nombre, numeral, localidad, region')
        .order('numeral', { ascending: true });
      
      if (error) throw error;
      setGrupos(data || []);
    } catch (error) {
      console.error('Error al cargar grupos:', error);
      showToast('error', 'Error al cargar la lista de grupos scout');
    } finally {
      setLoadingGrupos(false);
    }
  };

  const calcularCompletitud = () => {
    const camposRequeridos = [
      'nombres',
      'apellidos',
      'numero_documento',
      'cargo',
      'celular',
      'correo',
    ];

    const camposOpcionales = [
      'fecha_nacimiento',
      'sexo',
      'departamento',
      'direccion',
      'grupo_sanguineo',
      'contacto_emergencia_nombre',
      'contacto_emergencia_telefono',
      'nivel_formacion',
      'centro_estudios',
      'centro_laboral',
    ];

    const todosLosCampos = [...camposRequeridos, ...camposOpcionales];
    const camposLlenos = todosLosCampos.filter((campo) => {
      const valor = formData[campo as keyof FormularioDirigente];
      return valor !== '' && valor !== null && valor !== undefined;
    });

    setCompletionPercentage(Math.round((camposLlenos.length / todosLosCampos.length) * 100));
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombres.trim()) newErrors.nombres = 'Los nombres son obligatorios';
    if (!formData.apellidos.trim()) newErrors.apellidos = 'Los apellidos son obligatorios';
    if (!formData.numero_documento.trim()) newErrors.numero_documento = 'El documento es obligatorio';
    if (!formData.cargo) newErrors.cargo = 'El cargo es obligatorio';
    if (!formData.celular.trim()) newErrors.celular = 'El celular es obligatorio';

    // Validar email si se proporciona
    if (formData.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      newErrors.correo = 'El correo no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      showToast('error', 'Por favor, corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isEditing && dirigenteId) {
        result = await DirigenteService.actualizarDirigente(dirigenteId, formData);
      } else {
        result = await DirigenteService.registrarDirigente(formData);
      }

      if (result.success) {
        showToast('success', isEditing ? 'Dirigente actualizado exitosamente' : 'Dirigente registrado exitosamente');
        setTimeout(() => onSuccess?.(), 1500);
      } else {
        showToast('error', result.message || 'Error al guardar');
      }
    } catch (error) {
      showToast('error', 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof FormularioDirigente,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ show: true, type, message });
    if (type !== 'error') {
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Cargando datos del dirigente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <div className="fixed top-4 right-4 z-50">
            <Toast
              type={toast.type}
              message={toast.message}
              onClose={() => setToast((prev) => ({ ...prev, show: false }))}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={onCancel} icon={Icons.ArrowLeft}>
            Volver
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              {isEditing ? 'Editar Dirigente' : 'Nuevo Dirigente'}
            </h1>
            <p className="text-slate-500 mt-1">
              Formato DNGI-02 - Registro Institucional para Adultos Voluntarios
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-slate-500">Completitud</p>
              <p className="text-2xl font-bold text-cyan-500">{completionPercentage}%</p>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={176}
                  initial={{ strokeDashoffset: 176 }}
                  animate={{ strokeDashoffset: 176 - (176 * completionPercentage) / 100 }}
                  transition={{ duration: 0.5 }}
                />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        {/* SECCIÓN 1: DATOS PERSONALES */}
        <CollapsibleSection
          title="Datos Personales"
          icon={Icons.User}
          defaultOpen={true}
          badge={formData.nombres && formData.apellidos ? '✓' : ''}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField
              label="Apellidos Completos"
              value={formData.apellidos}
              onChange={(e) => handleChange('apellidos', e.target.value)}
              error={errors.apellidos}
              required
              placeholder="Ej: García López"
            />
            <InputField
              label="Nombres Completos"
              value={formData.nombres}
              onChange={(e) => handleChange('nombres', e.target.value)}
              error={errors.nombres}
              required
              placeholder="Ej: Juan Carlos"
            />
            <SelectField
              label="Sexo"
              value={formData.sexo}
              onChange={(e) => handleChange('sexo', e.target.value)}
              options={[
                { value: 'M', label: 'Masculino' },
                { value: 'F', label: 'Femenino' },
              ]}
            />
            <InputField
              label="Fecha de Nacimiento"
              type="date"
              value={formData.fecha_nacimiento}
              onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
            />
            <SelectField
              label="Tipo de Documento"
              value={formData.tipo_documento}
              onChange={(e) => handleChange('tipo_documento', e.target.value)}
              options={TIPOS_DOCUMENTO}
            />
            <InputField
              label="Número de Documento"
              value={formData.numero_documento}
              onChange={(e) => handleChange('numero_documento', e.target.value)}
              error={errors.numero_documento}
              required
              placeholder="Ej: 12345678"
            />
            <InputField
              label="Religión"
              value={formData.religion}
              onChange={(e) => handleChange('religion', e.target.value)}
              placeholder="Ej: Católica"
            />
          </div>
        </CollapsibleSection>

        {/* SECCIÓN 2: CONTACTO */}
        <CollapsibleSection
          title="Información de Contacto"
          icon={Icons.Phone}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Correo Personal"
              type="email"
              value={formData.correo}
              onChange={(e) => handleChange('correo', e.target.value)}
              error={errors.correo}
              placeholder="correo@ejemplo.com"
            />
            <InputField
              label="Correo Institucional"
              type="email"
              value={formData.correo_institucional}
              onChange={(e) => handleChange('correo_institucional', e.target.value)}
              placeholder="scout@asociacion.org"
            />
            <InputField
              label="Celular"
              value={formData.celular}
              onChange={(e) => handleChange('celular', e.target.value)}
              error={errors.celular}
              required
              placeholder="999 999 999"
            />
            <InputField
              label="Teléfono Fijo"
              value={formData.telefono}
              onChange={(e) => handleChange('telefono', e.target.value)}
              placeholder="01 999 9999"
            />
          </div>
        </CollapsibleSection>

        {/* SECCIÓN 3: UBICACIÓN */}
        <CollapsibleSection
          title="Domicilio"
          icon={Icons.MapPin}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <InputField
              label="Departamento"
              value={formData.departamento}
              onChange={(e) => handleChange('departamento', e.target.value)}
              placeholder="Ej: Lima"
            />
            <InputField
              label="Provincia"
              value={formData.provincia}
              onChange={(e) => handleChange('provincia', e.target.value)}
              placeholder="Ej: Lima"
            />
            <InputField
              label="Distrito"
              value={formData.distrito}
              onChange={(e) => handleChange('distrito', e.target.value)}
              placeholder="Ej: Miraflores"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <InputField
                label="Dirección"
                value={formData.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
                placeholder="Av. Principal 123"
              />
            </div>
            <InputField
              label="Código Postal"
              value={formData.codigo_postal}
              onChange={(e) => handleChange('codigo_postal', e.target.value)}
              placeholder="15000"
            />
          </div>
        </CollapsibleSection>

        {/* SECCIÓN 4: DATOS INSTITUCIONALES */}
        <CollapsibleSection
          title="Datos Institucionales Scout"
          icon={Icons.Building}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Selector de Grupo Scout */}
            <div className="lg:col-span-2">
              <SelectField
                label="Grupo Scout"
                value={formData.grupo_id}
                onChange={(e) => handleChange('grupo_id', e.target.value)}
                options={grupos.map((grupo) => ({
                  value: grupo.id,
                  label: `Grupo ${grupo.numeral} - ${grupo.nombre} (${grupo.localidad}, ${grupo.region})`,
                }))}
                disabled={loadingGrupos}
              />
              {loadingGrupos && (
                <p className="text-xs text-gray-400 mt-1">Cargando grupos...</p>
              )}
              {/* Mostrar datos heredados del grupo seleccionado */}
              {formData.grupo_id && grupos.length > 0 && (
                <div className="mt-2 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  {(() => {
                    const grupoSeleccionado = grupos.find(g => g.id === formData.grupo_id);
                    if (!grupoSeleccionado) return null;
                    return (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Región:</span>
                          <span className="ml-1 text-white">{grupoSeleccionado.region}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Localidad:</span>
                          <span className="ml-1 text-white">{grupoSeleccionado.localidad}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Numeral:</span>
                          <span className="ml-1 text-white">{grupoSeleccionado.numeral}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <SelectField
              label="Unidad / Rama"
              value={formData.unidad}
              onChange={(e) => handleChange('unidad', e.target.value)}
              options={Object.entries(RAMAS_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <SelectField
              label="Cargo"
              value={formData.cargo}
              onChange={(e) => handleChange('cargo', e.target.value as CargoDirigente)}
              error={errors.cargo}
              required
              options={Object.entries(CARGOS_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <InputField
              label="Código Credencial"
              value={formData.codigo_credencial}
              onChange={(e) => handleChange('codigo_credencial', e.target.value)}
              placeholder="ASP-2026-XXXX"
            />
          </div>
        </CollapsibleSection>

        {/* SECCIÓN 5: SALUD */}
        <CollapsibleSection
          title="Información de Salud"
          icon={Icons.Heart}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <SelectField
              label="Grupo Sanguíneo"
              value={formData.grupo_sanguineo}
              onChange={(e) => handleChange('grupo_sanguineo', e.target.value)}
              options={GRUPOS_SANGUINEOS.map((g) => ({ value: g, label: g }))}
            />
            <SelectField
              label="Factor RH"
              value={formData.factor_sanguineo}
              onChange={(e) => handleChange('factor_sanguineo', e.target.value)}
              options={FACTORES_RH.map((f) => ({ value: f, label: f }))}
            />
            <div className="md:col-span-2">
              <InputField
                label="Seguro Médico"
                value={formData.seguro_medico}
                onChange={(e) => handleChange('seguro_medico', e.target.value)}
                placeholder="Nombre de la aseguradora"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <h4 className="font-medium text-slate-600 dark:text-slate-300 mb-3">
              Información sobre discapacidad (si aplica)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Tipo de Discapacidad"
                value={formData.tipo_discapacidad}
                onChange={(e) => handleChange('tipo_discapacidad', e.target.value)}
                placeholder="Visual, auditiva, física, etc."
              />
              <InputField
                label="Carné CONADIS"
                value={formData.carnet_conadis}
                onChange={(e) => handleChange('carnet_conadis', e.target.value)}
                placeholder="Número de carné (si tiene)"
              />
            </div>
            <div className="mt-4">
              <TextAreaField
                label="Descripción de necesidades especiales"
                value={formData.descripcion_discapacidad}
                onChange={(e) => handleChange('descripcion_discapacidad', e.target.value)}
                placeholder="Describe cualquier necesidad o consideración especial..."
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* SECCIÓN 6: EDUCACIÓN Y TRABAJO */}
        <CollapsibleSection
          title="Educación y Trabajo"
          icon={Icons.Briefcase}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
                📚 Estudios
              </h4>
              <div className="space-y-4">
                <InputField
                  label="Centro de Estudios"
                  value={formData.centro_estudios}
                  onChange={(e) => handleChange('centro_estudios', e.target.value)}
                  placeholder="Universidad, instituto, etc."
                />
                <InputField
                  label="Ciclo / Año"
                  value={formData.ciclo_anio_estudios}
                  onChange={(e) => handleChange('ciclo_anio_estudios', e.target.value)}
                  placeholder="Ej: 5to ciclo, Egresado"
                />
              </div>
            </div>
            <div>
              <h4 className="font-medium text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
                💼 Trabajo
              </h4>
              <div className="space-y-4">
                <InputField
                  label="Centro Laboral"
                  value={formData.centro_laboral}
                  onChange={(e) => handleChange('centro_laboral', e.target.value)}
                  placeholder="Nombre de la empresa"
                />
                <InputField
                  label="Cargo"
                  value={formData.cargo_laboral}
                  onChange={(e) => handleChange('cargo_laboral', e.target.value)}
                  placeholder="Puesto de trabajo"
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* SECCIÓN 7: FORMACIÓN SCOUT */}
        <CollapsibleSection
          title="Formación Scout"
          icon={Icons.Award}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <SelectField
              label="Nivel de Formación"
              value={formData.nivel_formacion}
              onChange={(e) => handleChange('nivel_formacion', e.target.value as NivelFormacion)}
              options={Object.entries(NIVELES_FORMACION_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <InputField
              label="Fecha Curso SFH1"
              type="date"
              value={formData.fecha_sfh1}
              onChange={(e) => handleChange('fecha_sfh1', e.target.value)}
            />
            <SelectField
              label="Tipo de Membresía"
              value={formData.tipo_membresia}
              onChange={(e) => handleChange('tipo_membresia', e.target.value as TipoMembresia)}
              options={Object.entries(TIPOS_MEMBRESIA_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>

          <div className="mt-4 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
            <CheckboxField
              label="Ha aprobado el curso Safe from Harm 1 (SFH1)"
              description="Certificación obligatoria para todos los adultos voluntarios"
              checked={formData.aprobo_sfh1}
              onChange={(checked) => handleChange('aprobo_sfh1', checked)}
            />
          </div>
        </CollapsibleSection>

        {/* SECCIÓN 8: DECLARACIONES JURADAS */}
        <CollapsibleSection
          title="Declaraciones Juradas"
          icon={Icons.Shield}
        >
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
                Políticas y Códigos
              </h4>
              <div className="space-y-3">
                <CheckboxField
                  label="Acepto la Política de Protección de la Niñez y Juventud"
                  description="He leído, comprendido y acepto cumplir la política institucional"
                  checked={formData.acepta_politica_proteccion}
                  onChange={(checked) => handleChange('acepta_politica_proteccion', checked)}
                  required
                />
                <CheckboxField
                  label="Acepto el Código de Conducta para Adultos"
                  description="Me comprometo a seguir las normas establecidas"
                  checked={formData.acepta_codigo_conducta}
                  onChange={(checked) => handleChange('acepta_codigo_conducta', checked)}
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-3">
                Autorizaciones
              </h4>
              <div className="space-y-3">
                <CheckboxField
                  label="Autorizo la creación de una cuenta institucional"
                  description="Cuenta de correo @grupolima12.scout.pe o similar"
                  checked={formData.autoriza_cuenta_institucional}
                  onChange={(checked) => handleChange('autoriza_cuenta_institucional', checked)}
                />
                <CheckboxField
                  label="Autorizo el uso de mi imagen"
                  description="Para fines institucionales, publicaciones y redes sociales"
                  checked={formData.autoriza_uso_imagen}
                  onChange={(checked) => handleChange('autoriza_uso_imagen', checked)}
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-3">
                Declaración de Antecedentes
              </h4>
              <div className="space-y-3">
                <CheckboxField
                  label="Declaro no tener antecedentes policiales"
                  checked={formData.declara_sin_antecedentes_policiales}
                  onChange={(checked) => handleChange('declara_sin_antecedentes_policiales', checked)}
                  required
                />
                <CheckboxField
                  label="Declaro no tener antecedentes judiciales"
                  checked={formData.declara_sin_antecedentes_judiciales}
                  onChange={(checked) => handleChange('declara_sin_antecedentes_judiciales', checked)}
                  required
                />
                <CheckboxField
                  label="Declaro no tener antecedentes penales"
                  checked={formData.declara_sin_antecedentes_penales}
                  onChange={(checked) => handleChange('declara_sin_antecedentes_penales', checked)}
                  required
                />
              </div>

              {(!formData.declara_sin_antecedentes_policiales ||
                !formData.declara_sin_antecedentes_judiciales ||
                !formData.declara_sin_antecedentes_penales) && (
                <div className="mt-4">
                  <TextAreaField
                    label="Explique su situación (si corresponde)"
                    value={formData.detalle_antecedentes}
                    onChange={(e) => handleChange('detalle_antecedentes', e.target.value)}
                    placeholder="Proporcione detalles sobre su situación..."
                  />
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* SECCIÓN 9: CONTACTO DE EMERGENCIA */}
        <CollapsibleSection
          title="Contacto de Emergencia"
          icon={Icons.Phone}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              label="Nombre Completo"
              value={formData.contacto_emergencia_nombre}
              onChange={(e) => handleChange('contacto_emergencia_nombre', e.target.value)}
              placeholder="Nombre del contacto"
            />
            <InputField
              label="Teléfono"
              value={formData.contacto_emergencia_telefono}
              onChange={(e) => handleChange('contacto_emergencia_telefono', e.target.value)}
              placeholder="999 999 999"
            />
            <InputField
              label="Parentesco"
              value={formData.contacto_emergencia_parentesco}
              onChange={(e) => handleChange('contacto_emergencia_parentesco', e.target.value)}
              placeholder="Ej: Esposa, Padre, Hermano"
            />
          </div>
        </CollapsibleSection>

        {/* SECCIÓN 10: OBSERVACIONES */}
        <CollapsibleSection
          title="Observaciones Adicionales"
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          }
        >
          <TextAreaField
            label="Observaciones"
            value={formData.observaciones}
            onChange={(e) => handleChange('observaciones', e.target.value)}
            placeholder="Cualquier información adicional relevante..."
            rows={4}
          />
        </CollapsibleSection>

        {/* BOTONES DE ACCIÓN */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky bottom-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-700 mt-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge
                variant={completionPercentage >= 80 ? 'success' : completionPercentage >= 50 ? 'warning' : 'info'}
                size="lg"
              >
                {completionPercentage}% completado
              </Badge>
              {Object.keys(errors).length > 0 && (
                <Badge variant="danger" size="lg">
                  {Object.keys(errors).length} errores
                </Badge>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                icon={Icons.Save}
              >
                {isEditing ? 'Guardar Cambios' : 'Registrar Dirigente'}
              </Button>
            </div>
          </div>
        </motion.div>
      </form>
    </div>
  );
};

export default FormularioDirigenteComponent;
