/**
 * Contact Data Section Component
 */

import { UseFormReturn } from "react-hook-form";
import { Phone } from "lucide-react";
import { ScoutFormData } from "../schemas/scoutFormSchema";
import { TextField, PhoneField } from "./FormFields";
import { FormSection } from "./FormSection";

interface DatosContactoProps {
  form: UseFormReturn<ScoutFormData>;
  isOpen: boolean;
  onToggle: () => void;
  errorCount?: number;
}

export function DatosContacto({ form, isOpen, onToggle, errorCount = 0 }: DatosContactoProps) {
  return (
    <FormSection
      title="Datos de Contacto"
      icon={Phone}
      isOpen={isOpen}
      onToggle={onToggle}
      iconColor="text-green-600"
      errorCount={errorCount}
    >
      <div className="space-y-6">
        {/* Phone Numbers - 2 columnas para mejor lectura */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Teléfonos
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PhoneField
              control={form.control}
              name="celular"
              label="Celular Principal"
            />
            <PhoneField
              control={form.control}
              name="celular_secundario"
              label="Celular Secundario"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <TextField
              control={form.control}
              name="telefono"
              label="Teléfono Fijo"
              type="tel"
              placeholder="(01) 234 5678"
            />
          </div>
        </div>

        {/* Emails - 2 columnas */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Correos Electrónicos
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              control={form.control}
              name="correo"
              label="Correo Principal"
              type="email"
              placeholder="correo@ejemplo.com"
              autoComplete="email"
            />
            <TextField
              control={form.control}
              name="correo_secundario"
              label="Correo Secundario"
              type="email"
              placeholder="otro@ejemplo.com"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <TextField
              control={form.control}
              name="correo_institucional"
              label="Correo Institucional"
              type="email"
              placeholder="correo@institucion.edu.pe"
            />
          </div>
        </div>

        {/* Address - 2 columnas */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Dirección
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              control={form.control}
              name="departamento"
              label="Departamento"
              placeholder="Lima"
            />
            <TextField
              control={form.control}
              name="provincia"
              label="Provincia"
              placeholder="Lima"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <TextField
              control={form.control}
              name="distrito"
              label="Distrito"
              placeholder="Miraflores"
            />
            <TextField
              control={form.control}
              name="codigo_postal"
              label="Código Postal"
              placeholder="15074"
              maxLength={10}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 mt-4">
            <TextField
              control={form.control}
              name="direccion"
              label="Dirección Completa"
              placeholder="Av. Principal 123, Dpto 456"
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}
