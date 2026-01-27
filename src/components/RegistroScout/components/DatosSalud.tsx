/**
 * Health Data Section Component
 */

import { UseFormReturn } from "react-hook-form";
import { Heart } from "lucide-react";
import { ScoutFormData } from "../schemas/scoutFormSchema";
import { TextField, SelectField, TextareaField } from "./FormFields";
import { FormSection } from "./FormSection";

interface DatosSaludProps {
  form: UseFormReturn<ScoutFormData>;
  isOpen: boolean;
  onToggle: () => void;
  errorCount?: number;
}

const GRUPO_SANGUINEO_OPTIONS = [
  { value: "NONE", label: "No especificado" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "AB", label: "AB" },
  { value: "O", label: "O" },
];

const FACTOR_SANGUINEO_OPTIONS = [
  { value: "NONE", label: "No especificado" },
  { value: "+", label: "Positivo (+)" },
  { value: "-", label: "Negativo (-)" },
];

const DISCAPACIDAD_OPTIONS = [
  { value: "NONE", label: "Ninguna" },
  { value: "FISICA", label: "Física" },
  { value: "VISUAL", label: "Visual" },
  { value: "AUDITIVA", label: "Auditiva" },
  { value: "INTELECTUAL", label: "Intelectual" },
  { value: "PSICOSOCIAL", label: "Psicosocial" },
  { value: "MULTIPLE", label: "Múltiple" },
];

export function DatosSalud({ form, isOpen, onToggle, errorCount = 0 }: DatosSaludProps) {
  const tipoDiscapacidad = form.watch("tipo_discapacidad");
  
  return (
    <FormSection
      title="Datos de Salud"
      icon={Heart}
      isOpen={isOpen}
      onToggle={onToggle}
      iconColor="text-red-600"
      errorCount={errorCount}
    >
      <div className="space-y-6">
        {/* Blood Type - 2 columnas */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Información Sanguínea
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              control={form.control}
              name="grupo_sanguineo"
              label="Grupo Sanguíneo"
              options={GRUPO_SANGUINEO_OPTIONS}
              placeholder="Seleccione"
            />
            <SelectField
              control={form.control}
              name="factor_sanguineo"
              label="Factor RH"
              options={FACTOR_SANGUINEO_OPTIONS}
              placeholder="Seleccione"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <TextField
              control={form.control}
              name="seguro_medico"
              label="Seguro Médico"
              placeholder="EsSalud, Rímac, etc."
            />
          </div>
        </div>

        {/* Disability */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Información de Discapacidad (Opcional)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              control={form.control}
              name="tipo_discapacidad"
              label="Tipo de Discapacidad"
              options={DISCAPACIDAD_OPTIONS}
              placeholder="Seleccione si aplica"
            />
            {tipoDiscapacidad && tipoDiscapacidad !== "" && (
              <TextField
                control={form.control}
                name="carnet_conadis"
                label="Carnet CONADIS"
                placeholder="Número de carnet"
              />
            )}
          </div>
          {tipoDiscapacidad && tipoDiscapacidad !== "" && (
            <div className="mt-4">
              <TextareaField
                control={form.control}
                name="descripcion_discapacidad"
                label="Descripción de la Discapacidad"
                placeholder="Describa brevemente las consideraciones especiales que debemos tener en cuenta..."
                rows={3}
              />
            </div>
          )}
        </div>
      </div>
    </FormSection>
  );
}
