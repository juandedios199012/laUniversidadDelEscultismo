import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ArrowLeft, ArrowRight, Save, User, Phone, GraduationCap, Church, Heart, Users, Loader2, AlertCircle } from "lucide-react";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import {
  scoutFormSchema,
  ScoutFormData,
  defaultScoutFormValues,
} from "@/components/RegistroScout/schemas/scoutFormSchema";
import {
  DatosPersonales,
  DatosContacto,
  DatosEducacion,
  DatosReligiosos,
  DatosSalud,
  DatosFamiliares,
} from "@/components/RegistroScout/components";
import { VerticalStepper, StepConfig, StepStatus } from "@/components/RegistroScout/v2/VerticalStepper";
import { mapScoutToFormData } from "@/components/RegistroScout/v2/ScoutFormWizard";

import PortalPadresService, { ActualizarHijoData } from "@/services/portalPadresService";

// Mismos pasos que el wizard de dirigentes, MENOS "Scout" (rama/patrulla/
// código/estado) — eso sigue siendo exclusivo de dirigentes/admins.
const STEPS: StepConfig[] = [
  { id: "personal", title: "Datos Personales", icon: User, description: "Información básica" },
  { id: "contacto", title: "Contacto", icon: Phone, description: "Teléfonos y dirección" },
  { id: "familiar", title: "Familiar", icon: Users, description: "Padre/Madre/Tutor" },
  { id: "educacion", title: "Educación", icon: GraduationCap, description: "Estudios y trabajo" },
  { id: "religion", title: "Religión", icon: Church, description: "Información religiosa" },
  { id: "salud", title: "Salud", icon: Heart, description: "Datos médicos" },
];

interface Props {
  scoutId: string;
  scoutNombre: string;
  open: boolean;
  onClose: () => void;
  onGuardado?: () => void;
}

export default function EditarHijoWizardDialog({ scoutId, scoutNombre, open, onClose, onGuardado }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(scoutFormSchema) as any,
    defaultValues: defaultScoutFormValues,
    mode: "onBlur" as const,
  });

  // Cargar los datos completos del hijo cada vez que se abre el diálogo
  useEffect(() => {
    if (!open) return;

    let activo = true;
    setCargando(true);
    setError(null);
    setCurrentStep(0);

    PortalPadresService.getHijoCompleto(scoutId).then((scout) => {
      if (!activo) return;
      if (!scout) {
        setError("No se pudo cargar la información del scout.");
        setCargando(false);
        return;
      }
      form.reset(mapScoutToFormData(scout));
      setCargando(false);
    });

    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scoutId]);

  useEffect(() => {
    const initial: Record<string, StepStatus> = {};
    STEPS.forEach((step, index) => {
      initial[step.id] = index === 0 ? "current" : "pending";
    });
    setStepStatuses(initial);
  }, []);

  const goToStep = useCallback((index: number) => {
    setCurrentStep(index);
    setStepStatuses((prev) => {
      const next = { ...prev };
      STEPS.forEach((step, i) => {
        next[step.id] = i === index ? "current" : (prev[step.id] === "completed" ? "completed" : "pending");
      });
      return next;
    });
  }, []);

  const marcarCompletadoYAvanzar = () => {
    setStepStatuses((prev) => ({ ...prev, [STEPS[currentStep].id]: "completed" }));
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1);
    }
  };

  const handleSubmit = async (data: ScoutFormData) => {
    setGuardando(true);
    setError(null);

    const updates: ActualizarHijoData = {
      nombres: data.nombres,
      apellidos: data.apellidos,
      fecha_nacimiento: data.fecha_nacimiento,
      tipo_documento: data.tipo_documento,
      numero_documento: data.numero_documento || "",
      sexo: data.sexo as "MASCULINO" | "FEMENINO",
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
      estatura_cm: data.estatura_cm,
      peso_kg: data.peso_kg,
      grupo_sanguineo: data.grupo_sanguineo,
      factor_sanguineo: data.factor_sanguineo,
      seguro_medico: data.seguro_medico,
      tipo_discapacidad: data.tipo_discapacidad,
      carnet_conadis: data.carnet_conadis,
      descripcion_discapacidad: data.descripcion_discapacidad,
      condiciones: data.condiciones,
      alergias: data.alergias,
      medicamentos: data.medicamentos,
      vacunas: data.vacunas,
      familiares: data.familiares?.map((f) => ({
        id: f.id,
        nombres: f.nombres,
        apellidos: f.apellidos,
        sexo: f.sexo,
        tipo_documento: f.tipo_documento,
        numero_documento: f.numero_documento,
        parentesco: f.parentesco,
        celular: f.celular,
        correo: f.correo,
        profesion: f.profesion,
        centro_laboral: f.centro_laboral,
        cargo: f.cargo,
        usar_direccion_scout: f.usar_direccion_scout,
        direccion: f.usar_direccion_scout ? "" : f.direccion,
        departamento: f.usar_direccion_scout ? "" : f.departamento,
        provincia: f.usar_direccion_scout ? "" : f.provincia,
        distrito: f.usar_direccion_scout ? "" : f.distrito,
        es_contacto_emergencia: f.es_contacto_emergencia,
        es_apoderado: f.es_apoderado,
      })),
    };

    const resultado = await PortalPadresService.actualizarHijo(scoutId, updates);
    setGuardando(false);

    if (resultado.success) {
      onGuardado?.();
      onClose();
    } else {
      setError(resultado.error || "No se pudo guardar los cambios");
    }
  };

  if (!open) return null;

  const renderStepContent = () => {
    const stepId = STEPS[currentStep].id;
    switch (stepId) {
      case "personal":
        return <DatosPersonales form={form as any} isOpen={true} onToggle={() => {}} scoutId={scoutId} />;
      case "contacto":
        return <DatosContacto form={form as any} isOpen={true} onToggle={() => {}} />;
      case "familiar": {
        const familiares = form.getValues("familiares") || [];
        const familiarIds = familiares.map((f: any) => f?.id).filter(Boolean);
        return <DatosFamiliares familiarIds={familiarIds} />;
      }
      case "educacion":
        return <DatosEducacion form={form as any} isOpen={true} onToggle={() => {}} />;
      case "religion":
        return <DatosReligiosos form={form as any} isOpen={true} onToggle={() => {}} />;
      case "salud":
        return <DatosSalud form={form as any} isOpen={true} onToggle={() => {}} />;
      default:
        return null;
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;
  const completedSteps = Object.values(stepStatuses).filter((s) => s === "completed").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-5xl h-[88vh] overflow-hidden flex">
        {cargando ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando información...
          </div>
        ) : error && !form.formState.isDirty ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="text-gray-700">{error}</p>
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </div>
        ) : (
          <>
            <VerticalStepper
              steps={STEPS}
              currentStep={currentStep}
              stepStatuses={stepStatuses}
              onStepClick={goToStep}
              completedSteps={completedSteps}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-card shrink-0">
                <div>
                  <h2 className="text-lg font-semibold">Editar información de {scoutNombre}</h2>
                  <p className="text-sm text-muted-foreground">
                    Paso {currentStep + 1} de {STEPS.length}: {STEPS[currentStep].title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido del paso */}
              <div className="flex-1 overflow-y-auto p-6">
                <Form {...form}>
                  <form id="portal-padres-editar-hijo-form" className="max-w-3xl mx-auto">
                    {renderStepContent()}
                  </form>
                </Form>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="mx-6 mb-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 shrink-0">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Navegación */}
              <div className="flex items-center justify-between px-6 py-4 border-t bg-card shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goToStep(currentStep - 1)}
                  disabled={isFirstStep || guardando}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>

                {isLastStep ? (
                  <Button
                    type="button"
                    onClick={form.handleSubmit(handleSubmit)}
                    disabled={guardando}
                  >
                    {guardando ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar cambios
                      </>
                    )}
                  </Button>
                ) : (
                  <Button type="button" onClick={marcarCompletadoYAvanzar}>
                    Siguiente
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
