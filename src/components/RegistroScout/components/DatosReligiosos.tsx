/**
 * Religious Data Section Component
 */

import { UseFormReturn } from "react-hook-form";
import { Church } from "lucide-react";
import { ScoutFormData } from "../schemas/scoutFormSchema";
import { TextField } from "./FormFields";
import { FormSection } from "./FormSection";

interface DatosReligiososProps {
  form: UseFormReturn<ScoutFormData>;
  isOpen: boolean;
  onToggle: () => void;
  errorCount?: number;
}

export function DatosReligiosos({ form, isOpen, onToggle, errorCount = 0 }: DatosReligiososProps) {
  return (
    <FormSection
      title="Datos Religiosos"
      icon={Church}
      isOpen={isOpen}
      onToggle={onToggle}
      iconColor="text-purple-600"
      errorCount={errorCount}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          control={form.control}
          name="religion"
          label="Religión"
          placeholder="Católica, Cristiana, etc."
        />
        <div className="text-sm text-muted-foreground flex items-center">
          <p>
            El Movimiento Scout respeta todas las creencias religiosas y 
            espirituales. Este dato es opcional.
          </p>
        </div>
      </div>
    </FormSection>
  );
}
