/**
 * Dialog para subir Documentos a la actividad
 * UX: Upload con drag & drop, preview y selección de tipo
 */

import React, { useState, useRef, useCallback } from 'react';
import { FileUp, X, Check, AlertCircle, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  ActividadesExteriorService,
  TIPOS_DOCUMENTO_ACTIVIDAD,
} from '@/services/actividadesExteriorService';
import { toast } from 'sonner';

interface SubirDocumentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actividadId: string;
  onSuccess: () => void;
}

const SubirDocumentoDialog: React.FC<SubirDocumentoDialogProps> = ({
  open,
  onOpenChange,
  actividadId,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [guardando, setGuardando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Datos del formulario
  const [archivo, setArchivo] = useState<File | null>(null);
  const [tipo, setTipo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Validación onBlur
  const [touched, setTouched] = useState({ tipo: false, nombre: false });
  const [errors, setErrors] = useState({ tipo: '', nombre: '' });

  const resetForm = () => {
    setStep(1);
    setArchivo(null);
    setTipo('');
    setNombre('');
    setDescripcion('');
    setProgreso(0);
    setTouched({ tipo: false, nombre: false });
    setErrors({ tipo: '', nombre: '' });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const validateTipo = (value: string) => {
    if (!value) {
      setErrors(prev => ({ ...prev, tipo: 'Selecciona un tipo' }));
      return false;
    }
    setErrors(prev => ({ ...prev, tipo: '' }));
    return true;
  };

  const validateNombre = (value: string) => {
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, nombre: 'El nombre es requerido' }));
      return false;
    }
    setErrors(prev => ({ ...prev, nombre: '' }));
    return true;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es muy grande. Máximo 10MB.');
      return;
    }

    setArchivo(file);
    setNombre(file.name.split('.').slice(0, -1).join('.') || file.name);
    setStep(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return '🖼️';
    }
    if (['pdf'].includes(ext || '')) {
      return '📄';
    }
    if (['doc', 'docx'].includes(ext || '')) {
      return '📝';
    }
    if (['xls', 'xlsx'].includes(ext || '')) {
      return '📊';
    }
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleGuardar = async () => {
    setTouched({ tipo: true, nombre: true });
    
    const tipoValido = validateTipo(tipo);
    const nombreValido = validateNombre(nombre);
    
    if (!archivo || !tipoValido || !nombreValido) {
      return;
    }

    try {
      setGuardando(true);
      setProgreso(10);

      // 1. Subir archivo
      const { url, nombre: nombreArchivo } = await ActividadesExteriorService.subirArchivo(
        actividadId,
        archivo,
        'documento'
      );
      setProgreso(60);

      // 2. Registrar en BD
      await ActividadesExteriorService.agregarDocumento(actividadId, {
        tipo,
        nombre,
        descripcion: descripcion || undefined,
        url_archivo: url,
        nombre_archivo: nombreArchivo,
        mime_type: archivo.type,
      });
      setProgreso(100);

      toast.success('Documento subido exitosamente');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error subiendo documento:', error);
      toast.error(error.message || 'Error al subir documento');
    } finally {
      setGuardando(false);
      setProgreso(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            {step === 1 ? 'Subir Documento' : 'Detalles del Documento'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? 'Arrastra un archivo o haz clic para seleccionar'
              : 'Completa la información del documento'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            {/* Zona de drop */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-1">
                {isDragging ? 'Suelta el archivo aquí' : 'Arrastra y suelta un archivo'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, Word, Excel, Imágenes • Máximo 10MB
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleInputChange}
            />
          </div>
        )}

        {step === 2 && archivo && (
          <div className="space-y-4">
            {/* Preview del archivo */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl">{getFileIcon(archivo.name)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{archivo.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(archivo.size)}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setArchivo(null);
                  setStep(1);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tipo de documento */}
            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo de documento <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={tipo} 
                onValueChange={(v) => {
                  setTipo(v);
                  if (touched.tipo) validateTipo(v);
                }}
              >
                <SelectTrigger 
                  id="tipo"
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, tipo: true }));
                    validateTipo(tipo);
                  }}
                  className={errors.tipo ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DOCUMENTO_ACTIVIDAD.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.emoji} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tipo && touched.tipo && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.tipo}
                </p>
              )}
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre del documento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre"
                placeholder="Ej: Autorización de padres"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (touched.nombre) validateNombre(e.target.value);
                }}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, nombre: true }));
                  validateNombre(nombre);
                }}
                className={errors.nombre ? 'border-destructive' : ''}
              />
              {errors.nombre && touched.nombre && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Breve descripción del documento..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
              />
            </div>

            {/* Barra de progreso */}
            {guardando && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subiendo...</span>
                  <span>{progreso}%</span>
                </div>
                <Progress value={progreso} className="h-2" />
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 2 && !guardando && (
            <Button variant="outline" onClick={() => setStep(1)}>
              Atrás
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} disabled={guardando}>
            Cancelar
          </Button>
          {step === 2 && (
            <Button onClick={handleGuardar} disabled={guardando || !tipo || !nombre.trim()}>
              {guardando ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Subir Documento
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubirDocumentoDialog;
