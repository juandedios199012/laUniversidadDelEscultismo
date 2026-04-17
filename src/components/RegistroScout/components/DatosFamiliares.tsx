/**
 * Datos de Familiares / Apoderados
 * 
 * Componente para registrar N familiares del scout.
 * Permite agregar, editar y eliminar familiares.
 * Incluye upload del documento de identidad (anverso y reverso).
 * 
 * MEJORA: Detecta automáticamente si el DNI ya existe (caso hermanos)
 * y ofrece vincular la persona existente en lugar de crear duplicados.
 */

import React, { useState, useCallback } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Users, Phone, Mail, AlertCircle, Plus, Trash2, UserPlus, FileText, Briefcase, MapPin, Home, Loader2, CheckCircle2, Link2 } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IdentityDocumentUpload } from "./IdentityDocumentUpload";
import { UbigeoSelector } from "./UbigeoSelector";
import ScoutService from "@/services/scoutService";

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

// Tipos de documento (debe coincidir con enum tipo_documento_enum en BD)
const TIPOS_DOCUMENTO = [
  { value: "DNI", label: "DNI" },
  { value: "CARNET_EXTRANJERIA", label: "Carné de Extranjería" },
  { value: "PASAPORTE", label: "Pasaporte" },
] as const;

// Sexo
const SEXOS = [
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMENINO", label: "Femenino" },
] as const;

// Valor por defecto para un nuevo familiar
const nuevoFamiliar = {
  nombres: "",
  apellidos: "",
  sexo: "" as const,
  tipo_documento: "DNI" as const,
  numero_documento: "",
  parentesco: "PADRE" as const,
  celular: "",
  correo: "",
  profesion: "",
  centro_laboral: "",
  cargo: "",
  usar_direccion_scout: true,
  direccion: "",
  departamento: "",
  provincia: "",
  distrito: "",
  es_contacto_emergencia: true,
  es_apoderado: false,
};

interface DatosFamiliaresProps {
  /** IDs de familiares existentes (para modo edición con uploads) */
  familiarIds?: string[];
}

// Tipo para información de persona existente encontrada
interface PersonaExistenteInfo {
  persona_id: string;
  nombres: string;
  apellidos: string;
  celular?: string;
  correo?: string;
  sexo?: string;
  es_familiar_de?: Array<{
    scout_id: string;
    scout_nombre: string;
    parentesco: string;
  }>;
}

export function DatosFamiliares({ familiarIds = [] }: DatosFamiliaresProps) {
  const { control, watch, setValue, getValues } = useFormContext();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "familiares",
  });

  // Estado para rastrear personas existentes por índice de familiar
  const [personasExistentes, setPersonasExistentes] = useState<Record<number, PersonaExistenteInfo | null>>({});
  // Estado para indicar qué campos están verificando
  const [verificando, setVerificando] = useState<Record<number, boolean>>({});
  // Estado para guardar documentos originales (para comparar en edición)
  const [documentosOriginales, setDocumentosOriginales] = useState<Record<number, string>>({});

  // Guardar documentos originales al cargar
  React.useEffect(() => {
    const familiares = getValues('familiares') || [];
    const originales: Record<number, string> = {};
    familiares.forEach((f: any, index: number) => {
      if (f.id && f.numero_documento) {
        originales[index] = f.numero_documento;
      }
    });
    setDocumentosOriginales(originales);
  }, [fields.length]); // Re-ejecutar cuando cambie la cantidad de familiares

  /**
   * Verifica si ya existe una persona con el documento ingresado
   * Se ejecuta onBlur del campo numero_documento
   * 
   * OPTIMIZACIÓN: Solo busca si el documento tiene longitud válida (8+ chars para DNI)
   * Esto evita búsquedas innecesarias mientras el usuario está escribiendo.
   */
  const verificarDocumento = useCallback(async (index: number) => {
    const tipoDoc = getValues(`familiares.${index}.tipo_documento`) || 'DNI';
    const numDoc = getValues(`familiares.${index}.numero_documento`)?.trim();
    
    // No verificar si no hay número de documento
    if (!numDoc) {
      setPersonasExistentes(prev => ({ ...prev, [index]: null }));
      return;
    }
    
    // Solo buscar si el documento tiene longitud válida
    // DNI: 8 dígitos, CE: 9-12 caracteres, Pasaporte: variable
    const longitudMinima = tipoDoc === 'DNI' ? 8 : 6;
    if (numDoc.length < longitudMinima) {
      setPersonasExistentes(prev => ({ ...prev, [index]: null }));
      return;
    }
    
    // Si es modo edición (tiene ID), verificar solo si cambió el documento
    const familiarId = getValues(`familiares.${index}.id`);
    const docOriginal = documentosOriginales[index];
    
    if (familiarId && docOriginal === numDoc) {
      // El documento no cambió, no verificar
      setPersonasExistentes(prev => ({ ...prev, [index]: null }));
      return;
    }
    
    setVerificando(prev => ({ ...prev, [index]: true }));
    
    try {
      const resultado = await ScoutService.buscarPersonaPorDocumento(tipoDoc, numDoc);
      
      if (resultado.existe && resultado.persona_id) {
        // En modo edición, verificar que no sea la misma persona
        // (persona_id del familiar actual)
        const personaActualId = getValues(`familiares.${index}._persona_id`);
        if (personaActualId && resultado.persona_id === personaActualId) {
          // Es la misma persona, no mostrar alerta
          setPersonasExistentes(prev => ({ ...prev, [index]: null }));
          return;
        }
        
        setPersonasExistentes(prev => ({
          ...prev,
          [index]: {
            persona_id: resultado.persona_id!,
            nombres: resultado.nombres || '',
            apellidos: resultado.apellidos || '',
            celular: resultado.celular,
            correo: resultado.correo,
            sexo: resultado.sexo,
            es_familiar_de: resultado.es_familiar_de || []
          }
        }));
      } else {
        setPersonasExistentes(prev => ({ ...prev, [index]: null }));
      }
    } catch (error) {
      console.error('Error verificando documento:', error);
      setPersonasExistentes(prev => ({ ...prev, [index]: null }));
    } finally {
      setVerificando(prev => ({ ...prev, [index]: false }));
    }
  }, [getValues]);

  /**
   * Vincula un familiar con una persona existente
   * Copia los datos básicos de la persona al formulario
   * y guarda _vincular_persona_id para que el backend reasigne el vínculo
   */
  const vincularPersonaExistente = useCallback((index: number, persona: PersonaExistenteInfo) => {
    // Copiar datos de la persona al formulario
    setValue(`familiares.${index}.nombres`, persona.nombres);
    setValue(`familiares.${index}.apellidos`, persona.apellidos);
    if (persona.celular) setValue(`familiares.${index}.celular`, persona.celular);
    if (persona.correo) setValue(`familiares.${index}.correo`, persona.correo);
    if (persona.sexo) setValue(`familiares.${index}.sexo`, persona.sexo);
    
    // CRÍTICO: Guardar _vincular_persona_id para que el backend reasigne
    // el vínculo familiares_scout a la persona existente
    setValue(`familiares.${index}._vincular_persona_id`, persona.persona_id);
    
    // También guardar como referencia informativa
    setValue(`familiares.${index}._persona_existente_id`, persona.persona_id);
    
    // Limpiar la alerta
    setPersonasExistentes(prev => ({ ...prev, [index]: null }));
  }, [setValue]);

  /**
   * Ignora la persona existente y continúa con datos nuevos
   * (El backend igual la reutilizará por el DNI)
   */
  const ignorarPersonaExistente = useCallback((index: number) => {
    setPersonasExistentes(prev => ({ ...prev, [index]: null }));
  }, []);

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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    name={`familiares.${index}.sexo`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sexo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SEXOS.map((sexo) => (
                              <SelectItem key={sexo.value} value={sexo.value}>
                                {sexo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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

                {/* Documento de Identidad */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name={`familiares.${index}.tipo_documento`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Re-verificar documento si ya hay uno ingresado
                            const numDoc = watch(`familiares.${index}.numero_documento`);
                            if (numDoc) {
                              verificarDocumento(index);
                            }
                          }}
                          value={field.value || "DNI"}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Tipo..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIPOS_DOCUMENTO.map((tipo) => (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                {tipo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`familiares.${index}.numero_documento`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nº Documento</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field} 
                              placeholder="Ej: 12345678"
                              className={`bg-white pr-10 ${personasExistentes[index] ? 'border-amber-400' : ''}`}
                              maxLength={20}
                              onBlur={() => {
                                field.onBlur();
                                verificarDocumento(index);
                              }}
                            />
                            {/* Indicador de verificación */}
                            {verificando[index] && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Alert: Persona existente encontrada */}
                {personasExistentes[index] && (
                  <Alert className="border-amber-400 bg-amber-50">
                    <Link2 className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">
                      Este documento ya está registrado
                    </AlertTitle>
                    <AlertDescription className="text-amber-700">
                      <div className="space-y-3">
                        <p>
                          <strong>{personasExistentes[index]!.nombres} {personasExistentes[index]!.apellidos}</strong>
                          {personasExistentes[index]!.celular && ` • ${personasExistentes[index]!.celular}`}
                        </p>
                        
                        {/* Mostrar de qué scouts es familiar */}
                        {personasExistentes[index]!.es_familiar_de && 
                         personasExistentes[index]!.es_familiar_de!.length > 0 && (
                          <div className="text-sm bg-white/60 rounded p-2">
                            <p className="font-medium mb-1">Ya es familiar de:</p>
                            <ul className="list-disc list-inside">
                              {personasExistentes[index]!.es_familiar_de!.map((rel, i) => (
                                <li key={i}>
                                  {rel.scout_nombre} ({rel.parentesco.toLowerCase()})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            onClick={() => vincularPersonaExistente(index, personasExistentes[index]!)}
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Usar datos existentes
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => ignorarPersonaExistente(index)}
                          >
                            Continuar con mis datos
                          </Button>
                        </div>
                        
                        <p className="text-xs text-amber-600 italic">
                          Nota: Los datos se vincularán automáticamente al guardar.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

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

                {/* Datos Laborales */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Briefcase className="w-4 h-4" />
                    <span>Datos Laborales</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={control}
                      name={`familiares.${index}.profesion`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profesión / Ocupación</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Ej: Ingeniero, Docente, Contador"
                              className="bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`familiares.${index}.centro_laboral`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Centro Laboral</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Ej: Ministerio de Salud"
                              className="bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`familiares.${index}.cargo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Ej: Gerente, Coordinador"
                              className="bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Dirección del Familiar */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4" />
                    <span>Dirección</span>
                  </div>

                  {/* Checkbox usar misma dirección del scout */}
                  <FormField
                    control={control}
                    name={`familiares.${index}.usar_direccion_scout`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer flex items-center gap-2">
                          <Home className="w-4 h-4 text-blue-600" />
                          Usar la misma dirección del Scout
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {/* Mostrar campos de dirección solo si NO usa la del scout */}
                  {!watch(`familiares.${index}.usar_direccion_scout`) && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                      <UbigeoSelector
                        departamento={watch(`familiares.${index}.departamento`) || ""}
                        provincia={watch(`familiares.${index}.provincia`) || ""}
                        distrito={watch(`familiares.${index}.distrito`) || ""}
                        onDepartamentoChange={(value) => setValue(`familiares.${index}.departamento`, value)}
                        onProvinciaChange={(value) => setValue(`familiares.${index}.provincia`, value)}
                        onDistritoChange={(value) => setValue(`familiares.${index}.distrito`, value)}
                      />

                      <FormField
                        control={control}
                        name={`familiares.${index}.direccion`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección Completa</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Ej: Av. Principal 123, Edificio San José, Dpto 401"
                                className="bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
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

                {/* Sección de Documentos - Solo visible si el familiar ha sido guardado */}
                {familiarIds[index] && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        <span>Copia del Documento de Identidad</span>
                      </div>
                      
                      {/* Upload de Anverso y Reverso del DNI */}
                      <IdentityDocumentUpload
                        entityType="familiar"
                        entityId={familiarIds[index]}
                        label="Documento de Identidad del Familiar"
                      />
                    </div>
                  </>
                )}

                {/* Mensaje si el familiar es nuevo */}
                {!familiarIds[index] && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      Guarda el registro para poder subir la copia del documento de identidad.
                    </p>
                  </div>
                )}
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
