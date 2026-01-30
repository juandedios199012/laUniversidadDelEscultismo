/**
 * Scout Registration Form Component (Refactored)
 * 
 * Uses:
 * - Shadcn/ui for accessible UI components
 * - React Hook Form for form state management
 * - Zod for validation
 * 
 * Architecture:
 * - SOLID principles: Each section is a separate component
 * - DRY: Reusable FormField components
 * - Clean Code: Clear naming and documentation
 */

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, X, ArrowLeft } from "lucide-react";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
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
} from "../components";

import ScoutService from "@/services/scoutService";
import type { Scout } from "@/lib/supabase";

// ============================================
// Types
// ============================================

interface ScoutFormProps {
  scout?: Scout | null;
  onSuccess: () => void;
  onCancel: () => void;
}

type SectionKey =
  | "datosPersonales"
  | "datosContacto"
  | "datosEducacion"
  | "datosReligiosos"
  | "datosSalud"
  | "datosScout";

// Field groupings for error counting
const SECTION_FIELDS: Record<SectionKey, string[]> = {
  datosPersonales: ["nombres", "apellidos", "fecha_nacimiento", "sexo", "tipo_documento", "numero_documento"],
  datosContacto: ["celular", "celular_secundario", "telefono", "correo", "correo_secundario", "correo_institucional", "direccion", "departamento", "provincia", "distrito", "codigo_postal"],
  datosEducacion: ["centro_estudio", "anio_estudios", "ocupacion", "centro_laboral"],
  datosReligiosos: ["religion"],
  datosSalud: ["grupo_sanguineo", "factor_sanguineo", "seguro_medico", "tipo_discapacidad", "carnet_conadis", "descripcion_discapacidad"],
  datosScout: ["rama_actual", "fecha_ingreso", "codigo_asociado", "patrulla_id", "cargo_patrulla"],
};

// ============================================
// Component
// ============================================

export function ScoutForm({ scout, onSuccess, onCancel }: ScoutFormProps) {
  const [loading, setLoading] = useState(false);
  const { toasts, removeToast, success, error } = useToast();
  const isEditing = !!scout;

  // Section visibility state
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    datosPersonales: true,
    datosContacto: false,
    datosEducacion: false,
    datosReligiosos: false,
    datosSalud: false,
    datosScout: false,
  });

  // Initialize form with React Hook Form + Zod
  const form = useForm<ScoutFormData>({
    resolver: zodResolver(scoutFormSchema),
    defaultValues: scout
      ? mapScoutToFormData(scout)
      : defaultScoutFormValues,
    mode: "onBlur", // Validate on blur for better UX
  });

  // Cargar patrulla y cargo actual del scout al editar
  useEffect(() => {
    const cargarPatrullaScout = async () => {
      if (!scout?.id) return;

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
          console.log('Patrulla cargada:', membresia);
          form.setValue('patrulla_id', membresia.patrulla_id);
          form.setValue('cargo_patrulla', membresia.cargo_patrulla || 'MIEMBRO');
        }
      } catch (err) {
        console.error('Error inesperado cargando patrulla:', err);
      }
    };

    cargarPatrullaScout();
  }, [scout?.id, form]);

  // Toggle section visibility
  const toggleSection = useCallback((section: SectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // Count errors per section
  const getErrorCount = useCallback((section: SectionKey): number => {
    const errors = form.formState.errors;
    const fields = SECTION_FIELDS[section];
    return fields.filter(field => field in errors).length;
  }, [form.formState.errors]);

  // Form submission handler
  const onSubmit = async (data: ScoutFormData) => {
    setLoading(true);
    
    try {
      if (isEditing && scout) {
        // Update existing scout
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
        });

        if (result.success) {
          success(`Scout ${data.nombres} ${data.apellidos} actualizado exitosamente`);
          onSuccess();
        } else {
          error(result.error || "Error al actualizar scout");
        }
      } else {
        // Create new scout
        // Adaptar datos al formato esperado por registrarScout
        const result = await ScoutService.registrarScout({
          nombres: data.nombres,
          apellidos: data.apellidos,
          fecha_nacimiento: data.fecha_nacimiento,
          sexo: data.sexo as 'MASCULINO' | 'FEMENINO',
          tipo_documento: data.tipo_documento,
          numero_documento: data.numero_documento || '',
          telefono: data.celular, // mapear celular -> telefono
          email: data.correo, // mapear correo -> email
          direccion: data.direccion,
          distrito: data.distrito,
          rama: data.rama_actual || 'MANADA',
          fecha_ingreso: data.fecha_ingreso,
        });

        if (result.success) {
          success(`Scout ${data.nombres} ${data.apellidos} registrado exitosamente`);
          form.reset(defaultScoutFormValues);
          onSuccess();
        } else {
          error(result.error || "Error al registrar scout");
        }
      }
    } catch (err) {
      console.error("Error en formulario:", err);
      error("Error inesperado al guardar. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Handle form errors
  const onError = (errors: Record<string, unknown>) => {
    console.error("Validation errors:", errors);
    
    // Open sections with errors
    const sectionsWithErrors: SectionKey[] = [];
    const errorKeys = Object.keys(errors);
    
    const personalFields = ["nombres", "apellidos", "fecha_nacimiento", "sexo", "tipo_documento", "numero_documento"];
    const contactFields = ["celular", "correo", "direccion", "departamento", "provincia", "distrito"];
    const educationFields = ["centro_estudio", "anio_estudios", "ocupacion", "centro_laboral"];
    const religiousFields = ["religion"];
    const healthFields = ["grupo_sanguineo", "factor_sanguineo", "seguro_medico", "tipo_discapacidad"];
    const scoutFields = ["rama_actual", "fecha_ingreso", "codigo_asociado"];

    if (errorKeys.some((k) => personalFields.includes(k))) sectionsWithErrors.push("datosPersonales");
    if (errorKeys.some((k) => contactFields.includes(k))) sectionsWithErrors.push("datosContacto");
    if (errorKeys.some((k) => educationFields.includes(k))) sectionsWithErrors.push("datosEducacion");
    if (errorKeys.some((k) => religiousFields.includes(k))) sectionsWithErrors.push("datosReligiosos");
    if (errorKeys.some((k) => healthFields.includes(k))) sectionsWithErrors.push("datosSalud");
    if (errorKeys.some((k) => scoutFields.includes(k))) sectionsWithErrors.push("datosScout");

    if (sectionsWithErrors.length > 0) {
      setOpenSections((prev) => {
        const updated = { ...prev };
        sectionsWithErrors.forEach((s) => (updated[s] = true));
        return updated;
      });
    }

    error("Por favor, corrija los errores en el formulario");
  };

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle>
                {isEditing ? "Editar Scout" : "Nuevo Scout"}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onCancel} disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="submit"
                form="scout-form"
                loading={loading}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? "Guardar Cambios" : "Registrar Scout"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Form {...form}>
            <form
              id="scout-form"
              onSubmit={form.handleSubmit(onSubmit, onError)}
              className="space-y-4"
            >
              <DatosPersonales
                form={form}
                isOpen={openSections.datosPersonales}
                onToggle={() => toggleSection("datosPersonales")}
                errorCount={getErrorCount("datosPersonales")}
              />

              <DatosContacto
                form={form}
                isOpen={openSections.datosContacto}
                onToggle={() => toggleSection("datosContacto")}
                errorCount={getErrorCount("datosContacto")}
              />

              <DatosEducacion
                form={form}
                isOpen={openSections.datosEducacion}
                onToggle={() => toggleSection("datosEducacion")}
                errorCount={getErrorCount("datosEducacion")}
              />

              <DatosReligiosos
                form={form}
                isOpen={openSections.datosReligiosos}
                onToggle={() => toggleSection("datosReligiosos")}
                errorCount={getErrorCount("datosReligiosos")}
              />

              <DatosSalud
                form={form}
                isOpen={openSections.datosSalud}
                onToggle={() => toggleSection("datosSalud")}
                errorCount={getErrorCount("datosSalud")}
              />

              <DatosScout
                form={form}
                isOpen={openSections.datosScout}
                onToggle={() => toggleSection("datosScout")}
                errorCount={getErrorCount("datosScout")}
                scoutId={scout?.id}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

// ============================================
// Helper Functions
// ============================================

/**
 * Maps a Scout object to form data
 */
function mapScoutToFormData(scout: Scout): ScoutFormData {
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
    codigo_postal: scout.codigo_postal || "",
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
  };
}
