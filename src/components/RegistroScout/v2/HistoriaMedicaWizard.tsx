/**
 * Medical History Wizard Component
 * Multi-step form for comprehensive medical history
 * 
 * Features:
 * - 5-step wizard with Stepper navigation
 * - Auto-save to localStorage
 * - React Hook Form + Zod validation
 * - Accessible and responsive
 */

import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  Heart,
  AlertTriangle,
  Pill,
  Syringe,
  Plus,
  Trash2,
  Upload,
  Download,
  File,
  FileImage,
  Loader2,
  Eye,
  FileDown,
} from "lucide-react";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stepper, StepContent, StepActions, type Step } from "@/components/ui/stepper";
import { ToastContainer } from "@/components/ui/toast";
import { useToast } from "@/hooks/useToast";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  TextField,
  SelectField,
  DateField,
  TextareaField,
  CheckboxField,
} from "../components/FormFields";

import {
  historiaMedicaSchema,
  HistoriaMedicaData,
  defaultHistoriaMedicaValues,
  defaultCondicion,
  defaultAlergia,
  defaultMedicamento,
  defaultVacuna,
} from "../schemas/historiaMedicaSchema";

import HistoriaMedicaService, { type CatalogoCondicion, type CatalogoAlergia, type CatalogoVacuna, type DocumentoMedico } from "@/services/historiaMedicaService";
import { exportarHistoriaMedicaPDF, exportarHistoriaMedicaDOCX } from "@/modules/reports/services/historiaMedicaExportService";
import { ReportStatus } from "@/modules/reports/types/reportTypes";

// ============================================
// Types
// ============================================

interface HistoriaMedicaWizardProps {
  scoutId: string;
  personaId?: string; // ID de la persona para obtener historia médica
  scoutName: string;
  initialData?: HistoriaMedicaData | null;
  onSave: (data: HistoriaMedicaData) => Promise<{ success: boolean; message?: string }>;
  onClose: () => void;
  isOpen: boolean;
}

// ============================================
// Step Definitions
// ============================================

const WIZARD_STEPS: Step[] = [
  {
    id: "cabecera",
    title: "Datos Generales",
    description: "Información básica de salud",
  },
  {
    id: "condiciones",
    title: "Condiciones",
    description: "Condiciones médicas",
  },
  {
    id: "alergias",
    title: "Alergias",
    description: "Alergias conocidas",
  },
  {
    id: "medicamentos",
    title: "Medicamentos",
    description: "Medicación actual",
  },
  {
    id: "vacunas",
    title: "Vacunas",
    description: "Registro de vacunación",
  },
  {
    id: "documentos",
    title: "Documentos",
    description: "Archivos médicos",
  },
];

// Tipos de archivo permitidos
const TIPOS_DOCUMENTO = [
  { value: 'RECETA', label: 'Receta Médica' },
  { value: 'EXAMEN', label: 'Resultado de Examen' },
  { value: 'CERTIFICADO', label: 'Certificado Médico' },
  { value: 'INFORME', label: 'Informe Médico' },
  { value: 'OTRO', label: 'Otro Documento' },
];

const FORMATOS_PERMITIDOS = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx';

// ============================================
// Auto-save Hook
// ============================================

function useAutoSave(
  scoutId: string,
  data: HistoriaMedicaData,
  isDirty: boolean
) {
  const STORAGE_KEY = `historia_medica_draft_${scoutId}`;

  // Save to localStorage on changes
  useEffect(() => {
    if (isDirty) {
      const timer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data, isDirty, STORAGE_KEY]);

  // Load from localStorage
  const loadDraft = useCallback((): HistoriaMedicaData | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [STORAGE_KEY]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, [STORAGE_KEY]);

  return { loadDraft, clearDraft };
}

// ============================================
// Component
// ============================================

export function HistoriaMedicaWizard({
  scoutId,
  personaId,
  scoutName,
  initialData,
  onSave,
  onClose,
  isOpen,
}: HistoriaMedicaWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catalogoCondiciones, setCatalogoCondiciones] = useState<CatalogoCondicion[]>([]);
  const [catalogoAlergias, setCatalogoAlergias] = useState<CatalogoAlergia[]>([]);
  const [catalogoVacunas, setCatalogoVacunas] = useState<CatalogoVacuna[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoMedico[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [nuevoDocTipo, setNuevoDocTipo] = useState<string>('OTRO');
  const [nuevoDocDescripcion, setNuevoDocDescripcion] = useState<string>('');
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingDOCX, setExportingDOCX] = useState(false);
  const { toasts, removeToast, success, error } = useToast();

  // Load catalogs and documents on mount
  useEffect(() => {
    if (isOpen) {
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
        .catch(err => console.error("Error loading catalogs:", err));
      
      // Cargar documentos existentes
      HistoriaMedicaService.obtenerDocumentos(scoutId)
        .then(setDocumentos)
        .catch(err => console.error("Error loading documents:", err));
    }
  }, [isOpen, scoutId]);

  // Initialize form - using type assertion for resolver compatibility
  const form = useForm<HistoriaMedicaData>({
    resolver: zodResolver(historiaMedicaSchema) as any,
    defaultValues: initialData || defaultHistoriaMedicaValues,
    mode: "onBlur",
  });

  const { control, watch, formState, handleSubmit, reset } = form;
  const formData = watch();

  // Field arrays for dynamic sections
  const condicionesArray = useFieldArray({ control, name: "condiciones" });
  const alergiasArray = useFieldArray({ control, name: "alergias" });
  const medicamentosArray = useFieldArray({ control, name: "medicamentos" });
  const vacunasArray = useFieldArray({ control, name: "vacunas" });

  // Auto-save functionality
  const { loadDraft, clearDraft } = useAutoSave(
    scoutId,
    formData,
    formState.isDirty
  );

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (isOpen && initialData) {
      reset(initialData);
      setCurrentStep(0); // Reset to first step
    }
  }, [isOpen, initialData, reset]);

  // Load draft on mount (only if no initialData)
  useEffect(() => {
    if (isOpen && !initialData) {
      const draft = loadDraft();
      if (draft) {
        reset(draft);
      } else {
        // Reset to defaults if no draft and no initialData
        reset(defaultHistoriaMedicaValues);
      }
      setCurrentStep(0);
    }
  }, [isOpen, initialData, loadDraft, reset]);

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Document handlers
  const handleSubirDocumento = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      error('El archivo no puede superar los 10MB');
      return;
    }

    setUploadingDoc(true);
    try {
      const nuevoDoc = await HistoriaMedicaService.subirDocumento(
        scoutId,
        file,
        nuevoDocDescripcion || undefined,
        nuevoDocTipo as 'RECETA' | 'EXAMEN' | 'CERTIFICADO' | 'INFORME' | 'OTRO'
      );
      setDocumentos(prev => [nuevoDoc, ...prev]);
      setNuevoDocDescripcion('');
      setNuevoDocTipo('OTRO');
      success('Documento subido exitosamente');
    } catch (err) {
      console.error('Error subiendo documento:', err);
      error('Error al subir el documento');
    } finally {
      setUploadingDoc(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleEliminarDocumento = async (docId: string) => {
    if (!confirm('¿Está seguro de eliminar este documento?')) return;

    setDeletingDocId(docId);
    try {
      await HistoriaMedicaService.eliminarDocumento(docId);
      setDocumentos(prev => prev.filter(d => d.id !== docId));
      success('Documento eliminado');
    } catch (err) {
      console.error('Error eliminando documento:', err);
      error('Error al eliminar el documento');
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleDescargarDocumento = async (doc: DocumentoMedico) => {
    setDownloadingDocId(doc.id);
    try {
      await HistoriaMedicaService.descargarDocumento(doc.url_archivo, doc.nombre_archivo);
    } catch (err) {
      console.error('Error descargando documento:', err);
      error('Error al descargar el documento');
    } finally {
      setDownloadingDocId(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return FileImage;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleStepClick = (stepIndex: number) => {
    // Only allow clicking on completed or current steps
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  // Submit handler
  const onSubmitForm = async (data: HistoriaMedicaData) => {
    setIsSubmitting(true);
    try {
      const result = await onSave(data);
      if (result.success) {
        success("Historia médica guardada exitosamente");
        clearDraft();
        onClose();
      } else {
        error(result.message || "Error al guardar historia médica");
      }
    } catch (err) {
      console.error("Error saving medical history:", err);
      error("Error inesperado al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Error handler for form validation
  const onFormError = (errors: any) => {
    console.error("Errores de validación:", errors);
    const errorMessages: string[] = [];
    
    if (errors.fecha_llenado) errorMessages.push("Fecha de llenado requerida");
    if (errors.condiciones) errorMessages.push("Error en condiciones médicas");
    if (errors.alergias) errorMessages.push("Error en alergias");
    if (errors.medicamentos) errorMessages.push("Error en medicamentos");
    if (errors.vacunas) errorMessages.push("Error en vacunas");
    
    if (errorMessages.length > 0) {
      error(`Errores: ${errorMessages.join(", ")}`);
    } else {
      error("Por favor complete los campos requeridos");
    }
  };

  // Manual submit that bypasses strict validation
  const handleManualSubmit = async () => {
    const data = form.getValues();
    
    // Solo validar fecha_llenado como requerido
    if (!data.fecha_llenado) {
      error("La fecha de llenado es requerida");
      setCurrentStep(0); // Ir al primer paso
      return;
    }
    
    await onSubmitForm(data);
  };

  // Exportar a PDF
  const handleExportPDF = async () => {
    if (!personaId) {
      error("No se puede exportar: falta ID de persona");
      return;
    }
    
    setExportingPDF(true);
    try {
      const result = await exportarHistoriaMedicaPDF(scoutId, personaId, {
        organizacion: 'Grupo Scout Lima 12',
      });
      
      if (result.status === ReportStatus.SUCCESS) {
        success("PDF generado exitosamente");
      } else {
        error(result.error || "Error al generar PDF");
      }
    } catch (err) {
      console.error("Error exportando PDF:", err);
      error("Error al exportar PDF");
    } finally {
      setExportingPDF(false);
    }
  };

  // Exportar a Word (DOCX)
  const handleExportDOCX = async () => {
    if (!personaId) {
      error("No se puede exportar: falta ID de persona");
      return;
    }
    
    setExportingDOCX(true);
    try {
      const result = await exportarHistoriaMedicaDOCX(scoutId, personaId, {
        organizacion: 'Grupo Scout Lima 12',
      });
      
      if (result.status === ReportStatus.SUCCESS) {
        success("Documento Word generado exitosamente");
      } else {
        error(result.error || "Error al generar Word");
      }
    } catch (err) {
      console.error("Error exportando DOCX:", err);
      error("Error al exportar Word");
    } finally {
      setExportingDOCX(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Historia Médica - {scoutName}
          </DialogTitle>
          <DialogDescription>
            Complete la información médica en cada sección. Los datos se guardan automáticamente.
          </DialogDescription>
        </DialogHeader>

        {/* Botones de Exportar */}
        {personaId && (
          <div className="flex items-center gap-2 py-2 border-b">
            <span className="text-sm text-muted-foreground mr-2">Exportar:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={exportingPDF || exportingDOCX}
            >
              {exportingPDF ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-1" />
              )}
              PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportDOCX}
              disabled={exportingPDF || exportingDOCX}
            >
              {exportingDOCX ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-1" />
              )}
              Word
            </Button>
          </div>
        )}

        {/* Stepper */}
        <div className="py-4">
          <Stepper
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            allowNavigation={true}
          />
        </div>

        <Separator />

        {/* Form */}
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmitForm)}>
            {/* Step 1: Datos Generales */}
            <StepContent step={0} currentStep={currentStep}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Información General de Salud
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DateField
                      control={control}
                      name="fecha_llenado"
                      label="Fecha de Llenado"
                      required
                    />
                    <TextField
                      control={control}
                      name="lugar_nacimiento"
                      label="Lugar de Nacimiento"
                      placeholder="Ciudad, País"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      control={control}
                      name="estatura_cm"
                      label="Estatura (cm)"
                      type="number"
                      placeholder="170"
                    />
                    <TextField
                      control={control}
                      name="peso_kg"
                      label="Peso (kg)"
                      type="number"
                      placeholder="65"
                    />
                  </div>

                  <Separator />

                  <h4 className="font-medium">Seguro y Atención Médica</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      control={control}
                      name="seguro_medico"
                      label="Seguro Médico"
                      placeholder="EsSalud, Rímac, etc."
                    />
                    <TextField
                      control={control}
                      name="numero_poliza"
                      label="Número de Póliza"
                      placeholder="123456789"
                    />
                    <TextField
                      control={control}
                      name="medico_cabecera"
                      label="Médico de Cabecera"
                      placeholder="Dr. Juan Pérez"
                    />
                    <TextField
                      control={control}
                      name="telefono_medico"
                      label="Teléfono del Médico"
                      placeholder="999 999 999"
                    />
                  </div>

                  <TextField
                    control={control}
                    name="hospital_preferencia"
                    label="Hospital de Preferencia"
                    placeholder="Clínica San Pablo, Hospital Rebagliati, etc."
                  />

                  <TextareaField
                    control={control}
                    name="observaciones_generales"
                    label="Observaciones Generales"
                    placeholder="Cualquier información adicional importante sobre la salud..."
                    rows={3}
                  />
                </CardContent>
              </Card>
            </StepContent>

            {/* Step 2: Condiciones Médicas */}
            <StepContent step={1} currentStep={currentStep}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Condiciones Médicas
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => condicionesArray.append(defaultCondicion)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {condicionesArray.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No hay condiciones médicas registradas</p>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => condicionesArray.append(defaultCondicion)}
                      >
                        Agregar primera condición
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {condicionesArray.fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="p-4 border rounded-lg relative"
                        >
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
                              control={control}
                              name={`condiciones.${index}.condicion_id`}
                              label="Condición Médica"
                              required
                              placeholder="Seleccione una condición"
                              options={catalogoCondiciones.map(c => ({
                                value: c.id,
                                label: c.nombre
                              }))}
                            />
                            <DateField
                              control={control}
                              name={`condiciones.${index}.fecha_atencion`}
                              label="Fecha de Atención"
                            />
                          </div>
                          <div className="mt-4">
                            <TextareaField
                              control={control}
                              name={`condiciones.${index}.tratamiento`}
                              label="Tratamiento"
                              placeholder="Describa el tratamiento actual..."
                              rows={2}
                            />
                          </div>
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextareaField
                              control={control}
                              name={`condiciones.${index}.notas`}
                              label="Notas adicionales"
                              placeholder="Observaciones..."
                              rows={2}
                            />
                            <div className="flex items-end pb-2">
                              <CheckboxField
                                control={control}
                                name={`condiciones.${index}.activa`}
                                label="Condición activa"
                                description="Marque si la condición está actualmente presente"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </StepContent>

            {/* Step 3: Alergias */}
            <StepContent step={2} currentStep={currentStep}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Alergias
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => alergiasArray.append(defaultAlergia)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {alergiasArray.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No hay alergias registradas</p>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => alergiasArray.append(defaultAlergia)}
                      >
                        Agregar primera alergia
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {alergiasArray.fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="p-4 border rounded-lg relative"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-destructive"
                            onClick={() => alergiasArray.remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <SelectField
                              control={control}
                              name={`alergias.${index}.alergia_id`}
                              label="Alergia"
                              required
                              placeholder="Seleccione una alergia"
                              options={catalogoAlergias.map(a => ({
                                value: a.id,
                                label: a.nombre
                              }))}
                            />
                            <div className="flex items-center pb-2">
                              <CheckboxField
                                control={control}
                                name={`alergias.${index}.aplica`}
                                label="¿Aplica?"
                                description="Marque SI si tiene esta alergia"
                              />
                            </div>
                            <TextField
                              control={control}
                              name={`alergias.${index}.mencionar`}
                              label="Mencionar"
                              placeholder="Detalles adicionales..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </StepContent>

            {/* Step 4: Medicamentos */}
            <StepContent step={3} currentStep={currentStep}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Pill className="h-5 w-5 text-blue-500" />
                      Medicamentos Actuales
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => medicamentosArray.append(defaultMedicamento)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {medicamentosArray.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Pill className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No hay medicamentos registrados</p>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => medicamentosArray.append(defaultMedicamento)}
                      >
                        Agregar primer medicamento
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {medicamentosArray.fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="p-4 border rounded-lg relative"
                        >
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
                              control={control}
                              name={`medicamentos.${index}.nombre`}
                              label="Medicamento"
                              required
                              placeholder="Nombre del medicamento"
                            />
                            <TextField
                              control={control}
                              name={`medicamentos.${index}.dosis`}
                              label="Dosis"
                              required
                              placeholder="Ej: 500mg"
                            />
                            <TextField
                              control={control}
                              name={`medicamentos.${index}.frecuencia`}
                              label="Frecuencia"
                              required
                              placeholder="Ej: Cada 8 horas"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <TextField
                              control={control}
                              name={`medicamentos.${index}.motivo`}
                              label="Motivo"
                              placeholder="¿Para qué condición?"
                            />
                            <TextField
                              control={control}
                              name={`medicamentos.${index}.prescrito_por`}
                              label="Prescrito por"
                              placeholder="Nombre del médico"
                            />
                          </div>
                          <div className="mt-4">
                            <CheckboxField
                              control={control}
                              name={`medicamentos.${index}.activo`}
                              label="Medicamento activo"
                              description="¿Está tomando actualmente este medicamento?"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </StepContent>

            {/* Step 5: Vacunas */}
            <StepContent step={4} currentStep={currentStep}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Syringe className="h-5 w-5 text-green-500" />
                      Registro de Vacunas
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => vacunasArray.append(defaultVacuna)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {vacunasArray.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Syringe className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No hay vacunas registradas</p>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => vacunasArray.append(defaultVacuna)}
                      >
                        Agregar primera vacuna
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {vacunasArray.fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="p-4 border rounded-lg relative"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-destructive"
                            onClick={() => vacunasArray.remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <SelectField
                              control={control}
                              name={`vacunas.${index}.vacuna_id`}
                              label="Vacuna"
                              required
                              placeholder="Seleccione una vacuna"
                              options={catalogoVacunas.map(v => ({
                                value: v.id,
                                label: v.nombre
                              }))}
                            />
                            <div className="flex items-center pb-2">
                              <CheckboxField
                                control={control}
                                name={`vacunas.${index}.aplica`}
                                label="¿Aplica?"
                                description="Marque SI si tiene esta vacuna"
                              />
                            </div>
                            <DateField
                              control={control}
                              name={`vacunas.${index}.fecha`}
                              label="Fecha"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </StepContent>

            {/* Step 6: Documentos */}
            <StepContent step={5} currentStep={currentStep}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-500" />
                    Documentos Médicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Formulario para subir nuevo documento */}
                  <div className="p-4 border-2 border-dashed rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-4">Subir nuevo documento</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium">Tipo de documento</label>
                        <select 
                          className="mt-1 w-full p-2 border rounded-md"
                          value={nuevoDocTipo}
                          onChange={(e) => setNuevoDocTipo(e.target.value)}
                        >
                          {TIPOS_DOCUMENTO.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Descripción (opcional)</label>
                        <input 
                          type="text"
                          className="mt-1 w-full p-2 border rounded-md"
                          placeholder="Ej: Certificado vacuna COVID"
                          value={nuevoDocDescripcion}
                          onChange={(e) => setNuevoDocDescripcion(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex-1">
                        <input
                          type="file"
                          className="hidden"
                          accept={FORMATOS_PERMITIDOS}
                          onChange={handleSubirDocumento}
                          disabled={uploadingDoc}
                        />
                        <div className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${uploadingDoc ? 'opacity-50' : ''}`}>
                          {uploadingDoc ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Upload className="h-5 w-5" />
                          )}
                          <span className="font-medium">
                            {uploadingDoc ? 'Subiendo...' : 'Seleccionar archivo'}
                          </span>
                        </div>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Formatos: PDF, imágenes (JPG, PNG), Word, Excel. Máximo 10MB
                    </p>
                  </div>

                  {/* Lista de documentos existentes */}
                  <div>
                    <h4 className="font-medium mb-3">Documentos guardados ({documentos.length})</h4>
                    {documentos.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No hay documentos guardados</p>
                        <p className="text-sm">Suba certificados, recetas o resultados de exámenes</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {documentos.map((doc) => {
                          const IconComponent = getFileIcon(doc.mime_type);
                          const isDeleting = deletingDocId === doc.id;
                          const isDownloading = downloadingDocId === doc.id;
                          
                          return (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <IconComponent className="h-8 w-8 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{doc.nombre_archivo}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{TIPOS_DOCUMENTO.find(t => t.value === doc.tipo_documento)?.label || 'Otro'}</span>
                                    <span>•</span>
                                    <span>{formatFileSize(doc.tamanio_bytes)}</span>
                                    {doc.descripcion && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate">{doc.descripcion}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => window.open(doc.url_archivo, '_blank')}
                                  title="Ver documento"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDescargarDocumento(doc)}
                                  disabled={isDownloading}
                                  title="Descargar"
                                >
                                  {isDownloading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEliminarDocumento(doc.id)}
                                  disabled={isDeleting}
                                  className="text-destructive hover:text-destructive"
                                  title="Eliminar"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </StepContent>

            {/* Navigation Actions */}
            <StepActions
              currentStep={currentStep}
              totalSteps={WIZARD_STEPS.length}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSubmit={handleManualSubmit}
              isSubmitting={isSubmitting}
              submitLabel="Guardar Historia Médica"
            />
          </form>
        </Form>
      </DialogContent>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </Dialog>
  );
}
