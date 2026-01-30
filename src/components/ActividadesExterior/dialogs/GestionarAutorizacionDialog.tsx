/**
 * Dialog para gestionar autorización de participante
 * Permite cambiar estado y adjuntar documento firmado
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileCheck, 
  Upload, 
  X, 
  CheckCircle,
  Clock,
  Send,
  XCircle,
  Shield
} from 'lucide-react';
import { 
  ActividadesExteriorService, 
  EstadoAutorizacionExterior 
} from '@/services/actividadesExteriorService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ParticipanteAutorizacion {
  id: string;
  scout_id: string;
  scout_nombre: string;
  scout_codigo: string;
  estado_autorizacion: EstadoAutorizacionExterior;
  fecha_autorizacion?: string;
}

interface GestionarAutorizacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participante: ParticipanteAutorizacion | null;
  actividadId: string;
  onSuccess: () => void;
}

const ESTADOS_AUTORIZACION: { 
  value: EstadoAutorizacionExterior; 
  label: string; 
  emoji: string;
  color: string;
  description: string;
}[] = [
  { value: 'PENDIENTE', label: 'Pendiente', emoji: '⏳', color: 'bg-yellow-100 text-yellow-700', description: 'Aún no se ha enviado la autorización' },
  { value: 'ENVIADA', label: 'Enviada', emoji: '📤', color: 'bg-blue-100 text-blue-700', description: 'Autorización enviada, pendiente de firma' },
  { value: 'RECIBIDA', label: 'Recibida', emoji: '📥', color: 'bg-purple-100 text-purple-700', description: 'Documento recibido, pendiente de verificar' },
  { value: 'FIRMADA', label: 'Firmada', emoji: '✅', color: 'bg-green-100 text-green-700', description: 'Autorización firmada y válida' },
  { value: 'RECHAZADA', label: 'Rechazada', emoji: '❌', color: 'bg-red-100 text-red-700', description: 'Autorización rechazada o inválida' },
  { value: 'EXONERADA', label: 'Exonerada', emoji: '🛡️', color: 'bg-gray-100 text-gray-700', description: 'Scout mayor de edad o caso especial' },
];

const GestionarAutorizacionDialog: React.FC<GestionarAutorizacionDialogProps> = ({
  open,
  onOpenChange,
  participante,
  actividadId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [estado, setEstado] = useState<EstadoAutorizacionExterior>('PENDIENTE');
  const [documento, setDocumento] = useState<File | null>(null);
  const [documentoPreview, setDocumentoPreview] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && participante) {
      setEstado(participante.estado_autorizacion || 'PENDIENTE');
      setDocumento(null);
      setDocumentoPreview(null);
    }
  }, [open, participante]);

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo (imagen o PDF)
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error('Solo se permiten imágenes o PDFs');
        return;
      }
      // Validar tamaño (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no debe superar 10MB');
        return;
      }
      setDocumento(file);
      // Crear preview si es imagen
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocumentoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setDocumentoPreview(null);
      }
    }
  };

  const removeDocumento = () => {
    setDocumento(null);
    setDocumentoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Subir documento a Supabase Storage
  const uploadDocumento = async (): Promise<string | null> => {
    if (!documento || !participante) return null;
    
    setUploadingDoc(true);
    try {
      const fileExt = documento.name.split('.').pop();
      const fileName = `autorizacion_${participante.id}_${Date.now()}.${fileExt}`;
      const filePath = `autorizaciones/${actividadId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('finanzas')
        .upload(filePath, documento, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('finanzas')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error subiendo documento:', error);
      toast.error('Error al subir el documento');
      return null;
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participante) return;

    try {
      setLoading(true);
      
      // Subir documento si existe
      let documentoUrl: string | null = null;
      if (documento) {
        documentoUrl = await uploadDocumento();
      }
      
      // Actualizar estado
      await ActividadesExteriorService.actualizarAutorizacion(
        participante.id,
        estado,
        estado === 'FIRMADA' || estado === 'RECIBIDA' 
          ? new Date().toISOString().split('T')[0] 
          : undefined
      );

      // Si hay documento, guardarlo como documento de la actividad
      if (documentoUrl) {
        try {
          await ActividadesExteriorService.agregarDocumento(actividadId, {
            tipo: 'AUTORIZACION',
            nombre: `Autorización - ${participante.scout_nombre}`,
            descripcion: `Autorización firmada de ${participante.scout_nombre} (${participante.scout_codigo})`,
            url_archivo: documentoUrl,
            nombre_archivo: documento!.name,
          });
        } catch (docError) {
          console.warn('No se pudo guardar referencia del documento:', docError);
        }
      }

      const estadoInfo = ESTADOS_AUTORIZACION.find(e => e.value === estado);
      toast.success(`Autorización actualizada: ${estadoInfo?.emoji} ${estadoInfo?.label}`);
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error actualizando autorización:', error);
      toast.error(error.message || 'Error al actualizar autorización');
    } finally {
      setLoading(false);
    }
  };

  if (!participante) return null;

  const estadoActual = ESTADOS_AUTORIZACION.find(e => e.value === participante.estado_autorizacion) 
    || ESTADOS_AUTORIZACION[0];
  const estadoNuevo = ESTADOS_AUTORIZACION.find(e => e.value === estado);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-600" />
            Gestionar Autorización
          </DialogTitle>
          <DialogDescription>
            {participante.scout_nombre} ({participante.scout_codigo})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Estado actual */}
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado actual</span>
              <Badge className={estadoActual.color}>
                {estadoActual.emoji} {estadoActual.label}
              </Badge>
            </div>
            {participante.fecha_autorizacion && (
              <p className="text-xs text-muted-foreground mt-2">
                Fecha: {new Date(participante.fecha_autorizacion).toLocaleDateString('es-PE')}
              </p>
            )}
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            {/* Nuevo estado */}
            <div className="space-y-2">
              <Label>Nuevo estado de autorización</Label>
              <Select value={estado} onValueChange={(v) => setEstado(v as EstadoAutorizacionExterior)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {ESTADOS_AUTORIZACION.map(e => (
                    <SelectItem key={e.value} value={e.value}>
                      <span className="flex items-center gap-2">
                        <span>{e.emoji}</span>
                        <span>{e.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {estadoNuevo && (
                <p className="text-xs text-muted-foreground">
                  {estadoNuevo.description}
                </p>
              )}
            </div>

            {/* Subir documento (solo para RECIBIDA o FIRMADA) */}
            {(estado === 'RECIBIDA' || estado === 'FIRMADA') && (
              <div className="space-y-2">
                <Label>Documento firmado (opcional)</Label>
                
                {!documento ? (
                  <div 
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Subir autorización escaneada o foto
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG o PDF (máx. 10MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative border rounded-lg p-3">
                    {documentoPreview ? (
                      <img 
                        src={documentoPreview} 
                        alt="Vista previa"
                        className="w-full h-32 object-cover rounded"
                      />
                    ) : (
                      <div className="flex items-center gap-3 py-2">
                        <FileCheck className="h-8 w-8 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{documento.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(documento.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={removeDocumento}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Iconos de flujo visual */}
            <div className="flex items-center justify-center gap-2 py-2">
              <div className={`p-2 rounded-full ${estado === 'PENDIENTE' ? 'bg-yellow-100' : 'bg-muted'}`}>
                <Clock className={`h-4 w-4 ${estado === 'PENDIENTE' ? 'text-yellow-600' : 'text-muted-foreground'}`} />
              </div>
              <div className="w-4 h-0.5 bg-muted" />
              <div className={`p-2 rounded-full ${estado === 'ENVIADA' ? 'bg-blue-100' : 'bg-muted'}`}>
                <Send className={`h-4 w-4 ${estado === 'ENVIADA' ? 'text-blue-600' : 'text-muted-foreground'}`} />
              </div>
              <div className="w-4 h-0.5 bg-muted" />
              <div className={`p-2 rounded-full ${estado === 'FIRMADA' ? 'bg-green-100' : estado === 'RECHAZADA' ? 'bg-red-100' : 'bg-muted'}`}>
                {estado === 'RECHAZADA' ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : estado === 'EXONERADA' ? (
                  <Shield className="h-4 w-4 text-gray-600" />
                ) : (
                  <CheckCircle className={`h-4 w-4 ${estado === 'FIRMADA' ? 'text-green-600' : 'text-muted-foreground'}`} />
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || uploadingDoc}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploadingDoc ? 'Subiendo...' : loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GestionarAutorizacionDialog;
