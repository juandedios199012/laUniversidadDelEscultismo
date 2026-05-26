/**
 * Scout Data Section Component
 */

import { UseFormReturn } from "react-hook-form";
import { Flag } from "lucide-react";
import { ScoutFormData } from "../schemas/scoutFormSchema";
import { TextField, DateField, CheckboxField, SelectField } from "./FormFields";
import { FormSection } from "./FormSection";
import PatrullaSelector from "../PatrullaSelector";
import CargoPatrullaSelector from "../CargoPatrullaSelector";
import type { CargoPatrulla } from "@/types/patrulla";

interface DatosScoutProps {
  form: UseFormReturn<ScoutFormData>;
  isOpen: boolean;
  onToggle: () => void;
  errorCount?: number;
  scoutId?: string;
}

const RAMA_OPTIONS = [
  { value: "Manada", label: "🐺 Manada (7-10 años)" },
  { value: "Tropa", label: "🦅 Tropa (11-14 años)" },
  { value: "Comunidad", label: "🏕️ Comunidad (15-17 años)" },
  { value: "Clan", label: "🥾 Clan (18-21 años)" },
  { value: "Dirigentes", label: "👨‍🏫 Dirigentes (22+ años)" },
];

export function DatosScout({ form, isOpen, onToggle, errorCount = 0, scoutId }: DatosScoutProps) {
  const ramaActual = form.watch("rama_actual");
  const patrullaId = form.watch("patrulla_id");
  const cargoPatrulla = form.watch("cargo_patrulla") as CargoPatrulla;

  return (
    <FormSection
      title="Datos Scout"
      icon={Flag}
      isOpen={isOpen}
      onToggle={onToggle}
      iconColor="text-scout-primary"
      errorCount={errorCount}
    >
      <div className="space-y-6">
        {/* Scout Info - 2 columnas */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Información Scout
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              control={form.control}
              name="rama_actual"
              label="Rama Actual"
              options={RAMA_OPTIONS}
              placeholder="Seleccione rama"
            />
            <DateField
              control={form.control}
              name="fecha_ingreso"
              label="Fecha de Ingreso al Grupo"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <TextField
              control={form.control}
              name="codigo_asociado"
              label="Código de Asociado ASP"
              placeholder="Código nacional"
            />
          </div>
        </div>

        {/* Patrol Info - Usando componentes inteligentes */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Información de Patrulla
          </h4>
          <div className="space-y-4">
            {/* Selector de Patrulla */}
            <PatrullaSelector
              ramaActual={ramaActual || ""}
              scoutId={scoutId}
              patrullaActualId={patrullaId}
              onChange={(newPatrullaId) => {
                form.setValue("patrulla_id", newPatrullaId);
                // Resetear cargo a MIEMBRO si se cambia de patrulla
                if (newPatrullaId !== patrullaId) {
                  form.setValue("cargo_patrulla", "MIEMBRO");
                }
              }}
              disabled={!ramaActual}
            />

            {/* Selector de Cargo en Patrulla - solo si hay patrulla */}
            {patrullaId && (
              <CargoPatrullaSelector
                patrullaId={patrullaId}
                cargoActual={cargoPatrulla || "MIEMBRO"}
                scoutId={scoutId}
                onChange={(cargo) => form.setValue("cargo_patrulla", cargo as any)}
              />
            )}
          </div>
        </div>
      </div>
    </FormSection>
  );
}
