/**
 * Scout Form Wizard - Vertical Stepper Layout
 * 
 * Features:
 * - Vertical stepper navigation on the left
 * - One section visible at a time
 * - Step-by-step validation
 * - Auto-save draft to localStorage
 * - Progress indicator
 */

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePermissions } from "@/contexts/PermissionsContext";
import { 
  Save, X, ArrowLeft, ArrowRight, 
  User, Phone, GraduationCap, Church, Heart, Flag, Users 
} from "lucide-react";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToastContainer } from "@/components/ui/toast";
import { useToast } from "@/hooks/useToast";

import {
  scoutFormSchema,
  ScoutFormData,
  defaultScoutFormValues,
} from "../schemas/scoutFormSchema";
import {
  DatosPersonales,
  DatosContacto,
  DatosEducacion,
  DatosReligiosos,
  DatosSalud,
  DatosScout,
  DatosFamiliares,
} from "../components";
import { VerticalStepper, StepConfig, StepStatus } from "./VerticalStepper";

import ScoutService from "@/services/scoutService";
import { supabase } from "@/lib/supabase";
import type { Scout } from "@/lib/supabase";

// ============================================
// Constants
// ============================================

const DRAFT_KEY = "scout_form_draft_v2";

const STEPS: StepConfig[] = [
  { id: "personal", title: "Datos Personales", icon: User, description: "Información básica" },
  { id: "contacto", title: "Contacto", icon: Phone, description: "Teléfonos y dirección" },
  { id: "familiar", title: "Familiar", icon: Users, description: "Padre/Madre/Tutor" },
  { id: "educacion", title: "Educación", icon: GraduationCap, description: "Estudios y trabajo" },
  { id: "religion", title: "Religión", icon: Church, description: "Información religiosa" },
  { id: "salud", title: "Salud", icon: Heart, description: "Datos médicos" },
  { id: "scout", title: "Scout", icon: Flag, description: "Rama y código" },
];

// Fields per step for validation
// Note: "familiares" is an array managed by useFieldArray, validation happens at form level
const STEP_FIELDS: Record<string, (keyof ScoutFormData)[]> = {
  personal: ["nombres", "apellidos", "fecha_nacimiento", "sexo", "tipo_documento", "numero_documento"],
  contacto: ["celular", "correo", "direccion", "departamento", "provincia", "distrito"],
  familiar: [], // Array field - validated by schema, not individual fields
  educacion: ["centro_estudio", "anio_estudios", "ocupacion", "centro_laboral"],
  religion: ["religion"],
  salud: ["grupo_sanguineo", "factor_sanguineo", "seguro_medico", "tipo_discapacidad"],
  scout: ["rama_actual", "fecha_ingreso", "codigo_asociado"],
};

// ============================================
// Types
// ============================================

interface ScoutFormWizardProps {
  scout?: Scout | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// ============================================
// Component
// ============================================

export function ScoutFormWizard({ scout, onSuccess, onCancel }: ScoutFormWizardProps) {
  // Permisos
  const { puedeCrear, puedeEditar } = usePermissions();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({});
  const [loading, setLoading] = useState(false);
  const { toasts, removeToast, success, error, info } = useToast();
  const isEditing = !!scout;

  // Initialize form with explicit type
  const form = useForm({
    resolver: zodResolver(scoutFormSchema) as any,
    defaultValues: scout ? mapScoutToFormData(scout) : loadDraft() || defaultScoutFormValues,
    mode: "onBlur" as const,
  });

  // Reset form when scout data changes (important for loading full scout data with location)
  useEffect(() => {
    if (scout) {
      const formData = mapScoutToFormData(scout);
      console.log('🔄 Resetting form with scout data:', {
        ubicacion_latitud: formData.ubicacion_latitud,
        ubicacion_longitud: formData.ubicacion_longitud,
        direccion_completa: formData.direccion_completa
      });
      form.reset(formData);
    }
  }, [scout?.id, (scout as any)?.ubicacion_latitud, (scout as any)?.ubicacion_longitud]);

  // Auto-save draft
  useEffect(() => {
    if (!isEditing) {
      const subscription = form.watch((data) => {
        saveDraft(data as ScoutFormData);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, isEditing]);

  // Initialize step statuses
  useEffect(() => {
    const initialStatuses: Record<string, StepStatus> = {};
    STEPS.forEach((step, index) => {
      initialStatuses[step.id] = index === 0 ? "current" : "pending";
    });
    setStepStatuses(initialStatuses);
  }, []);

  // Cargar patrulla y cargo actual del scout al editar
  // Se ejecuta cada vez que se abre el formulario de edición (usando scout como dependencia completa)
  useEffect(() => {
    const cargarPatrullaScout = async () => {
      if (!scout?.id) return;

      console.log('🔄 [ScoutFormWizard] Cargando patrulla para scout:', scout.id);
      
      try {
        const { data: membresia, error: membresiaError } = await supabase
          .from('miembros_patrulla')
          .select('patrulla_id, cargo_patrulla')
          .eq('scout_id', scout.id)
          .eq('estado_miembro', 'ACTIVO')
          .is('fecha_salida', null)
          .maybeSingle();

        if (membresiaError) {
          console.error('Error cargando patrulla:', membresiaError);
          return;
        }

        if (membresia) {
          console.log('✅ Patrulla cargada en Wizard:', membresia);
          form.setValue('patrulla_id', membresia.patrulla_id);
          form.setValue('cargo_patrulla', membresia.cargo_patrulla || 'MIEMBRO');
        } else {
          console.log('Scout sin patrulla asignada, limpiando campos');
          form.setValue('patrulla_id', null);
          form.setValue('cargo_patrulla', 'MIEMBRO');
        }
      } catch (err) {
        console.error('Error inesperado cargando patrulla:', err);
      }
    };

    cargarPatrullaScout();
  // Agregar scout completo como dependencia para forzar recarga cuando se abre edición
  }, [scout, form]);

  // Cargar familiares del scout al editar
  useEffect(() => {
    const cargarFamiliaresScout = async () => {
      if (!scout?.id) return;

      // Si el scout ya trae familiares, no cargar de nuevo
      const scoutAny = scout as any;
      if (scoutAny.familiares && scoutAny.familiares.length > 0) {
        console.log('👨‍👩‍👧‍👦 Familiares ya incluidos en scout, no es necesario cargar:', scoutAny.familiares.length);
        return;
      }

      try {
        console.log('👨‍👩‍👧‍👦 Cargando familiares desde API para scout:', scout.id);
        const familiares = await ScoutService.getFamiliaresByScout(scout.id);
        
        console.log('📦 Familiares recibidos del API:', familiares);
        
        // Primero intentar cargar del array familiares (tabla familiares_scout)
        if (familiares && familiares.length > 0) {
          // Mapear los familiares al formato del formulario
          const familiaresMapped = familiares.map((f: any) => ({
            id: f.id || f.persona_id,
            nombres: f.nombres || '',
            apellidos: f.apellidos || '',
            parentesco: f.parentesco || 'PADRE',
            celular: f.celular || f.telefono || '',
            correo: f.correo || '',
            es_contacto_emergencia: f.es_contacto_emergencia ?? true,
            es_apoderado: f.es_apoderado ?? false,
          }));
          
          console.log('✅ Familiares mapeados para formulario:', familiaresMapped.length, familiaresMapped);
          
          // Usar replace en lugar de setValue para forzar actualización de useFieldArray
          form.setValue('familiares', familiaresMapped, { 
            shouldValidate: false,
            shouldDirty: false,
            shouldTouch: false 
          });
          
          // Forzar re-render después de un tick
          setTimeout(() => {
            form.setValue('familiares', [...familiaresMapped]);
          }, 100);
        } 
        // Si no hay familiares en el array, intentar leer campos familiar_* del scout
        else {
          const scoutData = scout as any;
          if (scoutData.familiar_nombres) {
            console.log('✅ Familiar principal encontrado en campos familiar_*');
            const familiarPrincipal = {
              id: 'principal',
              nombres: scoutData.familiar_nombres || '',
              apellidos: scoutData.familiar_apellidos || '',
              parentesco: scoutData.familiar_parentesco || 'PADRE',
              celular: scoutData.familiar_telefono || '',
              correo: scoutData.familiar_correo || '',
              es_contacto_emergencia: scoutData.familiar_es_contacto_emergencia ?? true,
              es_apoderado: scoutData.familiar_es_apoderado ?? true,
            };
            form.setValue('familiares', [familiarPrincipal]);
          } else {
            console.log('Scout sin familiares registrados');
          }
        }
      } catch (err) {
        console.error('Error cargando familiares:', err);
      }
    };

    cargarFamiliaresScout();
  }, [scout?.id, form]);

  // Count completed steps
  const completedSteps = Object.values(stepStatuses).filter(s => s === "completed").length;

  // Validate current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const stepId = STEPS[currentStep].id;
    const fields = STEP_FIELDS[stepId];
    
    const result = await form.trigger(fields);
    
    setStepStatuses(prev => ({
      ...prev,
      [stepId]: result ? "completed" : "error"
    }));
    
    return result;
  }, [currentStep, form]);

  // Navigate to step
  const goToStep = useCallback((stepIndex: number) => {
    // Update current step status
    const currentStepId = STEPS[currentStep].id;
    const currentStepStatus = stepStatuses[currentStepId];
    
    // Only mark as pending if it was current and not completed
    if (currentStepStatus === "current") {
      setStepStatuses(prev => ({
        ...prev,
        [currentStepId]: "pending"
      }));
    }
    
    // Set new current step
    setCurrentStep(stepIndex);
    const newStepId = STEPS[stepIndex].id;
    
    setStepStatuses(prev => ({
      ...prev,
      [newStepId]: prev[newStepId] === "completed" ? "completed" : "current"
    }));
  }, [currentStep, stepStatuses]);

  // Next step
  const handleNext = useCallback(async () => {
    const isValid = await validateCurrentStep();
    
    if (isValid && currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      const nextStepId = STEPS[nextStep].id;
      setStepStatuses(prev => ({
        ...prev,
        [nextStepId]: "current"
      }));
    } else if (!isValid) {
      error("Por favor, complete los campos requeridos");
    }
  }, [currentStep, validateCurrentStep, error]);

  // Previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  // Submit form
  const onSubmit = async (data: ScoutFormData) => {
    // Verificar permisos
    if (isEditing && !puedeEditar('scouts')) {
      error('No tienes permiso para editar scouts');
      return;
    }
    if (!isEditing && !puedeCrear('scouts')) {
      error('No tienes permiso para crear scouts');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEditing && scout) {
        // Extraer el primer familiar para campos legacy (compatible con campos planos)
        const familiarPrincipal = data.familiares?.[0];
        
        const result = await ScoutService.updateScout(scout.id, {
          nombres: data.nombres,
          apellidos: data.apellidos,
          fecha_nacimiento: data.fecha_nacimiento,
          sexo: data.sexo as 'MASCULINO' | 'FEMENINO',
          tipo_documento: data.tipo_documento,
          numero_documento: data.numero_documento || '',
          celular: data.celular,
          celular_secundario: data.celular_secundario,
          telefono: data.telefono,
          correo: data.correo,
          correo_secundario: data.correo_secundario,
          correo_institucional: data.correo_institucional,
          departamento: data.departamento,
          provincia: data.provincia,
          distrito: data.distrito,
          direccion: data.direccion,
          direccion_completa: data.direccion_completa,
          ubicacion_latitud: data.ubicacion_latitud,
          ubicacion_longitud: data.ubicacion_longitud,
          codigo_postal: data.codigo_postal,
          centro_estudio: data.centro_estudio,
          anio_estudios: data.anio_estudios,
          ocupacion: data.ocupacion,
          centro_laboral: data.centro_laboral,
          religion: data.religion,
          grupo_sanguineo: data.grupo_sanguineo,
          factor_sanguineo: data.factor_sanguineo,
          seguro_medico: data.seguro_medico,
          tipo_discapacidad: data.tipo_discapacidad,
          carnet_conadis: data.carnet_conadis,
          descripcion_discapacidad: data.descripcion_discapacidad,
          rama_actual: data.rama_actual,
          codigo_asociado: data.codigo_asociado,
          fecha_ingreso: data.fecha_ingreso,
          // Campos legacy del Familiar/Apoderado principal (primer familiar)
          familiar_nombres: familiarPrincipal?.nombres,
          familiar_apellidos: familiarPrincipal?.apellidos,
          familiar_parentesco: familiarPrincipal?.parentesco,
          familiar_telefono: familiarPrincipal?.celular,
          familiar_correo: familiarPrincipal?.correo,
          familiar_es_contacto_emergencia: familiarPrincipal?.es_contacto_emergencia,
          familiar_es_apoderado: familiarPrincipal?.es_apoderado,
          // Array completo de familiares para tabla familiares_scout
          familiares: data.familiares?.map(f => ({
            id: f.id,
            nombres: f.nombres,
            apellidos: f.apellidos,
            parentesco: f.parentesco,
            celular: f.celular,
            correo: f.correo,
            es_contacto_emergencia: f.es_contacto_emergencia,
            es_apoderado: f.es_apoderado,
          })),
        });

        if (result.success) {
          // ✅ Guardar patrulla en miembros_patrulla (tabla separada)
          if (data.patrulla_id) {
            try {
              const hoy = new Date().toISOString().split('T')[0];
              console.log('🔄 Guardando patrulla. Scout:', scout.id, 'Patrulla:', data.patrulla_id, 'Cargo:', data.cargo_patrulla, 'Fecha:', hoy);
              
              // Paso 1: Marcar TODAS las membresías activas de este scout como inactivas
              const { error: updateError } = await supabase
                .from('miembros_patrulla')
                .update({ 
                  fecha_salida: hoy, 
                  estado_miembro: 'INACTIVO' 
                })
                .eq('scout_id', scout.id)
                .eq('estado_miembro', 'ACTIVO');
              
              console.log('1️⃣ Update membresías activas:', updateError ? updateError : 'OK');
              
              // Paso 2: Eliminar registro conflictivo si existe (para evitar duplicate key)
              const { error: deleteError, count: deleteCount } = await supabase
                .from('miembros_patrulla')
                .delete()
                .eq('scout_id', scout.id)
                .eq('patrulla_id', data.patrulla_id)
                .eq('fecha_ingreso', hoy);
              
              console.log('2️⃣ Delete conflictivo:', deleteError ? deleteError : 'OK', 'Count:', deleteCount);
              
              // Paso 3: Insertar nueva membresía
              const { error: insertError } = await supabase
                .from('miembros_patrulla')
                .insert({
                  scout_id: scout.id,
                  patrulla_id: data.patrulla_id,
                  cargo_patrulla: data.cargo_patrulla || 'MIEMBRO',
                  fecha_ingreso: hoy,
                  estado_miembro: 'ACTIVO',
                  fecha_salida: null
                });
              
              console.log('3️⃣ Insert nuevo:', insertError ? insertError : 'OK');
              
              if (insertError) {
                console.error('⚠️ Error insertando membresía:', insertError);
              } else {
                console.log('✅ Membresía de patrulla guardada correctamente');
              }
            } catch (err) {
              console.error('⚠️ Error guardando patrulla:', err);
              // No fallar el guardado completo por error de patrulla
            }
          }
          
          clearDraft();
          success(`Scout ${data.nombres} ${data.apellidos} actualizado exitosamente`);
          onSuccess();
        } else {
          error(result.error || "Error al actualizar scout");
        }
      } else {
        const result = await ScoutService.registrarScoutConFamiliares({
          // Datos del scout
          nombres: data.nombres,
          apellidos: data.apellidos,
          fecha_nacimiento: data.fecha_nacimiento,
          sexo: data.sexo as 'MASCULINO' | 'FEMENINO',
          tipo_documento: data.tipo_documento,
          numero_documento: data.numero_documento || '',
          celular: data.celular,
          correo: data.correo,
          direccion: data.direccion,
          distrito: data.distrito,
          departamento: data.departamento,
          provincia: data.provincia,
          direccion_completa: data.direccion_completa,
          codigo_postal: data.codigo_postal,
          ubicacion_latitud: data.ubicacion_latitud,
          ubicacion_longitud: data.ubicacion_longitud,
          centro_estudio: data.centro_estudio,
          anio_estudios: data.anio_estudios,
          ocupacion: data.ocupacion,
          centro_laboral: data.centro_laboral,
          religion: data.religion,
          grupo_sanguineo: data.grupo_sanguineo,
          factor_sanguineo: data.factor_sanguineo,
          seguro_medico: data.seguro_medico,
          tipo_discapacidad: data.tipo_discapacidad,
          carnet_conadis: data.carnet_conadis,
          descripcion_discapacidad: data.descripcion_discapacidad,
          rama_actual: data.rama_actual || 'Manada',
          codigo_asociado: data.codigo_asociado,
          fecha_ingreso: data.fecha_ingreso,
          // Array de familiares
          familiares: data.familiares || [],
        });

        if (result.success) {
          clearDraft();
          success(`Scout ${data.nombres} ${data.apellidos} registrado exitosamente`);
          form.reset(defaultScoutFormValues);
          onSuccess();
        } else {
          error(result.error || "Error al registrar scout");
        }
      }
    } catch (err) {
      console.error("Error en formulario:", err);
      error("Error inesperado al guardar");
    } finally {
      setLoading(false);
    }
  };

  // Handle save draft manually
  const handleSaveDraft = useCallback(() => {
    const data = form.getValues();
    saveDraft(data);
    info("Borrador guardado");
  }, [form, info]);

  // Render current step content
  const renderStepContent = () => {
    const stepId = STEPS[currentStep].id;
    
    // All sections receive isOpen=true since we show one at a time
    switch (stepId) {
      case "personal":
        return <DatosPersonales form={form as any} isOpen={true} onToggle={() => {}} />;
      case "contacto":
        return <DatosContacto form={form as any} isOpen={true} onToggle={() => {}} />;
      case "familiar":
        return <DatosFamiliares />;
      case "educacion":
        return <DatosEducacion form={form as any} isOpen={true} onToggle={() => {}} />;
      case "religion":
        return <DatosReligiosos form={form as any} isOpen={true} onToggle={() => {}} />;
      case "salud":
        return <DatosSalud form={form as any} isOpen={true} onToggle={() => {}} />;
      case "scout":
        return <DatosScout form={form as any} isOpen={true} onToggle={() => {}} scoutId={scout?.id} />;
      default:
        return null;
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] bg-background rounded-lg border overflow-hidden">
      {/* Vertical Stepper */}
      <VerticalStepper
        steps={STEPS}
        currentStep={currentStep}
        stepStatuses={stepStatuses}
        onStepClick={goToStep}
        completedSteps={completedSteps}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">
                {isEditing ? "Editar Scout" : "Nuevo Scout"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Paso {currentStep + 1} de {STEPS.length}: {STEPS[currentStep].title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Borrador
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form id="scout-wizard-form" className="max-w-3xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {(() => {
                      const Icon = STEPS[currentStep].icon;
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()}
                    {STEPS[currentStep].title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderStepContent()}
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-card">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="flex items-center gap-2">
            {isLastStep ? (
              <Button
                onClick={form.handleSubmit(
                  onSubmit as any,
                  (errors) => {
                    console.error("❌ Errores de validación:", errors);
                    // Mostrar los campos con error
                    const errorFields = Object.keys(errors);
                    if (errorFields.length > 0) {
                      error(`Revisa los campos: ${errorFields.join(", ")}`);
                      // Navegar al primer paso con error
                      for (let i = 0; i < STEPS.length; i++) {
                        const stepFields = STEP_FIELDS[STEPS[i].id];
                        if (stepFields.some(f => errorFields.includes(f))) {
                          setCurrentStep(i);
                          break;
                        }
                      }
                    }
                  }
                )}
                disabled={loading}
                className="min-w-[140px]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Guardando...
                  </span>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? "Guardar Cambios" : "Registrar Scout"}
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function mapScoutToFormData(scout: Scout): ScoutFormData {
  // Mapear familiares si existen en el objeto scout
  const scoutAny = scout as any;
  const familiaresFromScout = scoutAny.familiares?.map((f: any) => ({
    id: f.id || f.persona_id || '',
    nombres: f.nombres || '',
    apellidos: f.apellidos || '',
    parentesco: f.parentesco || 'PADRE',
    celular: f.celular || f.telefono || '',
    correo: f.correo || '',
    es_contacto_emergencia: f.es_contacto_emergencia ?? true,
    es_apoderado: f.es_apoderado ?? false,
  })) || [];

  return {
    nombres: scout.nombres || "",
    apellidos: scout.apellidos || "",
    fecha_nacimiento: scout.fecha_nacimiento || "",
    sexo: (scout.sexo as "MASCULINO" | "FEMENINO" | "") || "",
    tipo_documento: (scout.tipo_documento as "DNI" | "CE" | "PASAPORTE") || "DNI",
    numero_documento: scout.numero_documento || "",
    celular: scout.celular || "",
    celular_secundario: scout.celular_secundario || "",
    telefono: scout.telefono || "",
    correo: scout.correo || "",
    correo_secundario: scout.correo_secundario || "",
    correo_institucional: scout.correo_institucional || "",
    departamento: scout.departamento || "",
    provincia: scout.provincia || "",
    distrito: scout.distrito || "",
    direccion: scout.direccion || "",
    direccion_completa: (scout as any).direccion_completa || "",
    codigo_postal: scout.codigo_postal || "",
    ubicacion_latitud: (scout as any).ubicacion_latitud != null ? Number((scout as any).ubicacion_latitud) : null,
    ubicacion_longitud: (scout as any).ubicacion_longitud != null ? Number((scout as any).ubicacion_longitud) : null,
    centro_estudio: scout.centro_estudio || "",
    anio_estudios: scout.anio_estudios?.toString() || "",
    ocupacion: scout.ocupacion || "",
    centro_laboral: scout.centro_laboral || "",
    religion: scout.religion || "",
    grupo_sanguineo: (scout.grupo_sanguineo as "A" | "B" | "AB" | "O" | "") || "",
    factor_sanguineo: (scout.factor_sanguineo as "+" | "-" | "") || "",
    seguro_medico: scout.seguro_medico || "",
    tipo_discapacidad: scout.tipo_discapacidad || "",
    carnet_conadis: scout.carnet_conadis || "",
    descripcion_discapacidad: scout.descripcion_discapacidad || "",
    rama_actual: scout.rama_actual || "",
    rama: scout.rama_actual || "",
    codigo_asociado: scout.codigo_asociado || "",
    fecha_ingreso: scout.fecha_ingreso || new Date().toISOString().split("T")[0],
    patrulla_id: null,
    cargo_patrulla: "MIEMBRO",
    // Familiares - incluir los que vienen del scout (si API los incluye) o cargar dinámicamente
    familiares: familiaresFromScout,
  };
}

function saveDraft(data: ScoutFormData): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Could not save draft:", e);
  }
}

function loadDraft(): ScoutFormData | null {
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    return draft ? JSON.parse(draft) : null;
  } catch (e) {
    console.warn("Could not load draft:", e);
    return null;
  }
}

function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {
    console.warn("Could not clear draft:", e);
  }
}
