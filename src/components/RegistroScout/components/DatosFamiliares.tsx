/**
 * Datos de Familiares / Apoderados
 * 
 * Componente para registrar N familiares del scout.
 * Permite agregar, editar y eliminar familiares.
 */

import { useFormContext, useFieldArray } from "react-hook-form";
import { Users, Phone, Mail, AlertCircle, Plus, Trash2, UserPlus } from "lucide-react";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Tipos de parentesco disponibles
const PARENTESCOS = [
  { value: "PADRE", label: "Padre" },
  { value: "MADRE", label: "Madre" },
  { value: "TUTOR", label: "Tutor Legal" },
  { value: "HERMANO", label: "Hermano(a)" },
  { value: "ABUELO", label: "Abuelo(a)" },
  { value: "TIO", label: "Tío(a)" },
  { value: "OTRO", label: "Otro" },
] as const;

// Valor por defecto para un nuevo familiar
const nuevoFamiliar = {
  nombres: "",
  apellidos: "",
  parentesco: "PADRE" as const,
  celular: "",
  correo: "",
  es_contacto_emergencia: true,
  es_apoderado: false,
};

export function DatosFamiliares() {
  const { control } = useFormContext();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "familiares",
  });

  const agregarFamiliar = () => {
    append(nuevoFamiliar);
  };

  return (
    <div className="space-y-6">
      {/* Título de sección */}
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Familiares / Apoderados
            </h3>
            <p className="text-sm text-gray-500">
              Registra a los padres, tutores o apoderados del scout
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          {fields.length} {fields.length === 1 ? "familiar" : "familiares"}
        </Badge>
      </div>

      {/* Información */}
      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-indigo-800">
            <p className="font-medium">Información Importante</p>
            <p className="mt-1">
              Puedes agregar múltiples familiares. Al menos uno debe ser marcado 
              como contacto de emergencia. Se recomienda registrar a ambos padres 
              o tutores legales.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Familiares */}
      <div className="space-y-4">
        {fields.length === 0 ? (
          // Estado vacío
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <UserPlus className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">
                No hay familiares registrados
              </h4>
              <p className="text-sm text-gray-500 text-center mb-4 max-w-md">
                Agrega al menos un familiar o apoderado para poder contactarlo 
                en caso de emergencia o para comunicaciones oficiales.
              </p>
              <Button type="button" onClick={agregarFamiliar} variant="default">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Familiar
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Lista de familiares
          fields.map((field, index) => (
            <Card key={field.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Familiar #{index + 1}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nombres y Apellidos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={control}
                    name={`familiares.${index}.nombres`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombres *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Ej: María Elena"
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`familiares.${index}.apellidos`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellidos *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Ej: García López"
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`familiares.${index}.parentesco`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parentesco *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PARENTESCOS.map((parentesco) => (
                              <SelectItem key={parentesco.value} value={parentesco.value}>
                                {parentesco.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name={`familiares.${index}.celular`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Celular
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Ej: 987654321"
                            maxLength={9}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`familiares.${index}.correo`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          Correo Electrónico
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            placeholder="familiar@email.com"
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-6 pt-2">
                  <FormField
                    control={control}
                    name={`familiares.${index}.es_contacto_emergencia`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Contacto de Emergencia
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`familiares.${index}.es_apoderado`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Apoderado Legal
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Botón agregar más */}
        {fields.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={agregarFamiliar}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Otro Familiar
          </Button>
        )}
      </div>
    </div>
  );
}

export default DatosFamiliares;
