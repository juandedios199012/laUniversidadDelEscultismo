/**
 * Personal Data Section Component
 * First section of the scout registration form
 */

import { UseFormReturn } from "react-hook-form";
import { User } from "lucide-react";
import { ScoutFormData } from "../schemas/scoutFormSchema";
import { TextField, SelectField, DateField } from "./FormFields";
import { FormSection } from "./FormSection";
import { IdentityDocumentUpload } from "./IdentityDocumentUpload";

interface DatosPersonalesProps {
  form: UseFormReturn<ScoutFormData>;
  isOpen: boolean;
  onToggle: () => void;
  errorCount?: number;
  /** ID del scout para modo edición (permite subir documentos) */
  scoutId?: string;
}

const TIPO_DOCUMENTO_OPTIONS = [
  { value: "DNI", label: "DNI" },
  { value: "CE", label: "Carné de Extranjería" },
  { value: "PASAPORTE", label: "Pasaporte" },
];

const SEXO_OPTIONS = [
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMENINO", label: "Femenino" },
];

export function DatosPersonales({ form, isOpen, onToggle, errorCount = 0, scoutId }: DatosPersonalesProps) {
  return (
    <FormSection
      title="Datos Personales"
      icon={User}
      isOpen={isOpen}
      onToggle={onToggle}
      iconColor="text-blue-600"
      errorCount={errorCount}
    >
      <div className="space-y-4">
        {/* Nombres y Apellidos - 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            control={form.control}
            name="nombres"
            label="Nombres"
            required
            placeholder="Ingrese nombres completos"
            autoComplete="given-name"
          />
          
          <TextField
            control={form.control}
            name="apellidos"
            label="Apellidos"
            required
            placeholder="Ingrese apellidos completos"
            autoComplete="family-name"
          />
        </div>

        {/* Fecha y Sexo - 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateField
            control={form.control}
            name="fecha_nacimiento"
            label="Fecha de Nacimiento"
            required
          />
          
          <SelectField
            control={form.control}
            name="sexo"
            label="Sexo"
            required
            options={SEXO_OPTIONS}
            placeholder="Seleccione sexo"
          />
        </div>

        {/* Documento - 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            control={form.control}
            name="tipo_documento"
            label="Tipo de Documento"
            options={TIPO_DOCUMENTO_OPTIONS}
            placeholder="Seleccione tipo"
          />
          
          <TextField
            control={form.control}
            name="numero_documento"
            label="Número de Documento"
            placeholder="Ingrese número"
            maxLength={12}
          />
        </div>

        {/* Upload de Documento de Identidad - Anverso y Reverso */}
        <div className="pt-2">
          <IdentityDocumentUpload
            entityType="scout"
            entityId={scoutId}
            label="Copia del Documento de Identidad"
            disabled={!scoutId}
          />
        </div>
      </div>
    </FormSection>
  );
}
