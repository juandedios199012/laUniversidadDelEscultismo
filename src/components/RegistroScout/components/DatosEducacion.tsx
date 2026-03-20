/**
 * Education Data Section Component
 */

import { UseFormReturn } from "react-hook-form";
import { GraduationCap } from "lucide-react";
import { ScoutFormData } from "../schemas/scoutFormSchema";
import { TextField, SelectField } from "./FormFields";
import { FormSection } from "./FormSection";

interface DatosEducacionProps {
  form: UseFormReturn<ScoutFormData>;
  isOpen: boolean;
  onToggle: () => void;
  errorCount?: number;
}

// El value es igual al label para guardar directamente el texto legible en BD (KISS, DRY)
const ANIO_ESTUDIOS_OPTIONS = [
  { value: "1° Primaria", label: "1° Primaria" },
  { value: "2° Primaria", label: "2° Primaria" },
  { value: "3° Primaria", label: "3° Primaria" },
  { value: "4° Primaria", label: "4° Primaria" },
  { value: "5° Primaria", label: "5° Primaria" },
  { value: "6° Primaria", label: "6° Primaria" },
  { value: "1° Secundaria", label: "1° Secundaria" },
  { value: "2° Secundaria", label: "2° Secundaria" },
  { value: "3° Secundaria", label: "3° Secundaria" },
  { value: "4° Secundaria", label: "4° Secundaria" },
  { value: "5° Secundaria", label: "5° Secundaria" },
  { value: "Universidad / Superior", label: "Universidad / Superior" },
];

export function DatosEducacion({ form, isOpen, onToggle, errorCount = 0 }: DatosEducacionProps) {
  return (
    <FormSection
      title="Datos Educativos y Laborales"
      icon={GraduationCap}
      isOpen={isOpen}
      onToggle={onToggle}
      iconColor="text-amber-600"
      errorCount={errorCount}
    >
      <div className="space-y-6">
        {/* Education */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Información Educativa
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              control={form.control}
              name="centro_estudio"
              label="Centro de Estudios"
              placeholder="Nombre del colegio o universidad"
            />
            <SelectField
              control={form.control}
              name="anio_estudios"
              label="Año de Estudios"
              options={ANIO_ESTUDIOS_OPTIONS}
              placeholder="Seleccione año"
            />
          </div>
        </div>

        {/* Work */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Información Laboral
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              control={form.control}
              name="ocupacion"
              label="Ocupación"
              placeholder="Estudiante, Profesional, etc."
            />
            <TextField
              control={form.control}
              name="centro_laboral"
              label="Centro Laboral"
              placeholder="Nombre de la empresa"
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}
