/**
 * Health Data Section Component
 */

import { useEffect, useState } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Heart, AlertTriangle, Pill, Syringe, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ScoutFormData,
  defaultSaludCondicion,
  defaultSaludAlergia,
  defaultSaludMedicamento,
  defaultSaludVacuna,
} from "../schemas/scoutFormSchema";
import { TextField, SelectField, TextareaField, CheckboxField } from "./FormFields";
import { FormSection } from "./FormSection";
import HistoriaMedicaService, {
  type CatalogoCondicion,
  type CatalogoAlergia,
  type CatalogoVacuna,
} from "@/services/historiaMedicaService";

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

  const condicionesArray = useFieldArray({ control: form.control, name: "condiciones" });
  const alergiasArray = useFieldArray({ control: form.control, name: "alergias" });
  const medicamentosArray = useFieldArray({ control: form.control, name: "medicamentos" });
  const vacunasArray = useFieldArray({ control: form.control, name: "vacunas" });

  const [catalogoCondiciones, setCatalogoCondiciones] = useState<CatalogoCondicion[]>([]);
  const [catalogoAlergias, setCatalogoAlergias] = useState<CatalogoAlergia[]>([]);
  const [catalogoVacunas, setCatalogoVacunas] = useState<CatalogoVacuna[]>([]);

  useEffect(() => {
    Promise.all([
      HistoriaMedicaService.obtenerCatalogoCondiciones(),
      HistoriaMedicaService.obtenerCatalogoAlergias(),
      HistoriaMedicaService.obtenerCatalogoVacunas(),
    ])
      .then(([condiciones, alergias, vacunas]) => {
        setCatalogoCondiciones(condiciones);
        setCatalogoAlergias(alergias);
        setCatalogoVacunas(vacunas);
      })
      .catch((err) => console.error("Error cargando catálogos de salud:", err));
  }, []);

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
        {/* Datos Físicos */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Datos Físicos
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              control={form.control}
              name="estatura_cm"
              label="Estatura (m)"
              type="number"
              placeholder="1.70"
              step="0.01"
            />
            <TextField
              control={form.control}
              name="peso_kg"
              label="Peso (kg)"
              type="number"
              placeholder="65"
              step="0.1"
            />
          </div>
        </div>

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

        {/* Condiciones Médicas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              Condiciones Médicas
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => condicionesArray.append(defaultSaludCondicion)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
          {condicionesArray.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay condiciones médicas registradas</p>
          ) : (
            <div className="space-y-4">
              {condicionesArray.fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-destructive"
                    onClick={() => condicionesArray.remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      control={form.control}
                      name={`condiciones.${index}.condicion`}
                      label="Condición"
                      placeholder="Seleccione una condición"
                      options={catalogoCondiciones.map((c) => ({ value: c.nombre, label: c.nombre }))}
                    />
                    <TextField
                      control={form.control}
                      name={`condiciones.${index}.fecha_atencion`}
                      label="Fecha de Atención"
                      placeholder="Ej: 15/03/2024"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alergias */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Alergias
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => alergiasArray.append(defaultSaludAlergia)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
          {alergiasArray.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay alergias registradas</p>
          ) : (
            <div className="space-y-4">
              {alergiasArray.fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-destructive"
                    onClick={() => alergiasArray.remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      control={form.control}
                      name={`alergias.${index}.alergia`}
                      label="Alergia"
                      placeholder="Seleccione una alergia"
                      options={catalogoAlergias.map((a) => ({ value: a.nombre, label: a.nombre }))}
                    />
                    <TextField
                      control={form.control}
                      name={`alergias.${index}.mencionar`}
                      label="Mencionar"
                      placeholder="Detalles adicionales..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medicamentos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Pill className="h-4 w-4 text-blue-500" />
              Medicamentos
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => medicamentosArray.append(defaultSaludMedicamento)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
          {medicamentosArray.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay medicamentos registrados</p>
          ) : (
            <div className="space-y-4">
              {medicamentosArray.fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-destructive"
                    onClick={() => medicamentosArray.remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextField
                      control={form.control}
                      name={`medicamentos.${index}.medicamento`}
                      label="Medicamento"
                      placeholder="Nombre del medicamento"
                    />
                    <TextField
                      control={form.control}
                      name={`medicamentos.${index}.dosis`}
                      label="Dosis"
                      placeholder="Ej: 500mg"
                    />
                    <TextField
                      control={form.control}
                      name={`medicamentos.${index}.frecuencia`}
                      label="Frecuencia"
                      placeholder="Ej: Cada 8 horas"
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <TextField
                      control={form.control}
                      name={`medicamentos.${index}.fecha_inicio_duracion`}
                      label="Fecha de Inicio y Duración"
                      placeholder="Ej: Desde 01/2024, por 3 meses"
                    />
                    <CheckboxField
                      control={form.control}
                      name={`medicamentos.${index}.activo`}
                      label="Medicamento activo"
                      description="¿Está tomando actualmente este medicamento?"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vacunas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Syringe className="h-4 w-4 text-green-500" />
              Vacunas
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => vacunasArray.append(defaultSaludVacuna)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
          {vacunasArray.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay vacunas registradas</p>
          ) : (
            <div className="space-y-4">
              {vacunasArray.fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-destructive"
                    onClick={() => vacunasArray.remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      control={form.control}
                      name={`vacunas.${index}.vacuna`}
                      label="Vacuna"
                      placeholder="Seleccione una vacuna"
                      options={catalogoVacunas.map((v) => ({ value: v.nombre, label: v.nombre }))}
                    />
                    <TextField
                      control={form.control}
                      name={`vacunas.${index}.fecha_ultima_dosis`}
                      label="Fecha Última Dosis"
                      placeholder="Ej: 15/03/2024"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FormSection>
  );
}
