/**
 * Dialog para gestionar autorización de participante
 * Permite cambiar estado y adjuntar múltiples documentos firmados
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileCheck, 
  Upload, 
  X, 
  CheckCircle,
  Clock,
  Send,
  XCircle,
  Shield,
  Trash2,
  FileText,
  Image,
  ExternalLink,
  Plus,
  Loader2
} from 'lucide-react';
import { 
  ActividadesExteriorService, 
  EstadoAutorizacionExterior,
  DocumentoAutorizacionParticipante,
  TipoDocumentoAutorizacion
} from '@/services/actividadesExteriorService';
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

const TIPOS_DOCUMENTO: { value: TipoDocumentoAutorizacion; label: string }[] = [
  { value: 'AUTORIZACION', label: 'Autorización firmada' },
  { value: 'FICHA_MEDICA', label: 'Ficha médica' },
  { value: 'DNI_PADRE', label: 'DNI Padre/Apoderado' },
  { value: 'DNI_SCOUT', label: 'DNI Scout' },
  { value: 'CARNET_SEGURO', label: 'Carnet de seguro' },
  { value: 'OTRO', label: 'Otro documento' },
];

// Interface para archivo nuevo con su tipo
interface ArchivoConTipo {
  file: File;
  tipo: TipoDocumentoAutorizacion;
}

const GestionarAutorizacionDialog: React.FC<GestionarAutorizacionDialogProps> = ({
  open,
  onOpenChange,
  participante,
  actividadId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [estado, setEstado] = useState<EstadoAutorizacionExterior>('PENDIENTE');
  
  // Archivos existentes (de BD)
  const [documentosExistentes, setDocumentosExistentes] = useState<DocumentoAutorizacionParticipante[]>([]);
  const [documentosAEliminar, setDocumentosAEliminar] = useState<string[]>([]);
  
  // Nuevos archivos a subir (cada uno con su tipo)
  const [nuevosDocumentos, setNuevosDocumentos] = useState<ArchivoConTipo[]>([]);
  
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar documentos existentes
  const cargarDocumentos = useCallback(async () => {
    if (!participante) return;
    
    setLoadingDocs(true);
    try {
      const docs = await ActividadesExteriorService.listarDocumentosAutorizacion(participante.id);
      setDocumentosExistentes(docs);
    } catch (error) {
      console.error('Error cargando documentos:', error);
    } finally {
      setLoadingDocs(false);
    }
  }, [participante]);

  useEffect(() => {
    if (open && participante) {
      setEstado(participante.estado_autorizacion || 'PENDIENTE');
      setDocumentosAEliminar([]);
      setNuevosDocumentos([]);
      cargarDocumentos();
    }
  }, [open, participante, cargarDocumentos]);

  // Manejar selección de archivos (múltiples)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const archivosValidos: ArchivoConTipo[] = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error(`${file.name}: Solo se permiten imágenes o PDFs`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: El archivo no debe superar 10MB`);
        continue;
      }
      // Por defecto asignar AUTORIZACION, usuario puede cambiarlo después
      archivosValidos.push({ file, tipo: 'AUTORIZACION' });
    }
    
    if (archivosValidos.length > 0) {
      setNuevosDocumentos(prev => [...prev, ...archivosValidos]);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cambiar tipo de un archivo nuevo
  const cambiarTipoArchivo = (index: number, nuevoTipo: TipoDocumentoAutorizacion) => {
    setNuevosDocumentos(prev => 
      prev.map((item, i) => i === index ? { ...item, tipo: nuevoTipo } : item)
    );
  };

  const removeNuevoDocumento = (index: number) => {
    setNuevosDocumentos(prev => prev.filter((_, i) => i !== index));
  };

  const marcarParaEliminar = (docId: string) => {
    setDocumentosAEliminar(prev => [...prev, docId]);
  };

  const desmarcarParaEliminar = (docId: string) => {
    setDocumentosAEliminar(prev => prev.filter(id => id !== docId));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType?: string) => {
    if (mimeType?.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-red-500" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participante) return;

    try {
      setLoading(true);
      
      // 1. Eliminar documentos marcados
      for (const docId of documentosAEliminar) {
        try {
          await ActividadesExteriorService.eliminarDocumentoAutorizacion(docId);
        } catch (err) {
          console.warn('Error eliminando documento:', err);
        }
      }
      
      // 2. Subir nuevos documentos (cada uno con su tipo)
      if (nuevosDocumentos.length > 0) {
        setUploadingDocs(true);
        let subidos = 0;
        const errores: string[] = [];
        
        for (const { file, tipo } of nuevosDocumentos) {
          try {
            // Subir a storage
            const fileExt = file.name.split('.').pop();
            const fileName = `autorizacion_${participante.id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
            const filePath = `autorizaciones/${actividadId}/${fileName}`;

            const { error: uploadError } = await (await import('@/lib/supabase')).supabase.storage
              .from('finanzas')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) throw uploadError;

            // Obtener URL pública
            const { data: { publicUrl } } = (await import('@/lib/supabase')).supabase.storage
              .from('finanzas')
              .getPublicUrl(filePath);

            // Registrar en BD con el tipo específico de este archivo
            await ActividadesExteriorService.agregarDocumentoAutorizacion(participante.id, {
              nombre_archivo: file.name,
              url_archivo: publicUrl,
              mime_type: file.type,
              tamanio_bytes: file.size,
              tipo_documento: tipo,
            });

            subidos++;
          } catch (err: any) {
            errores.push(`${file.name}: ${err.message}`);
          }
        }
        setUploadingDocs(false);
        
        if (errores.length > 0) {
          toast.error(`Errores al subir: ${errores.join(', ')}`);
        }
        if (subidos > 0) {
          toast.success(`${subidos} documento(s) subido(s)`);
        }
      }
      
      // 3. Actualizar estado de autorización
      await ActividadesExteriorService.actualizarAutorizacion(
        participante.id,
        estado,
        estado === 'FIRMADA' || estado === 'RECIBIDA' 
          ? new Date().toISOString().split('T')[0] 
          : undefined
      );

      const estadoInfo = ESTADOS_AUTORIZACION.find(e => e.value === estado);
      toast.success(`Autorización actualizada: ${estadoInfo?.emoji} ${estadoInfo?.label}`);
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error actualizando autorización:', error);
      toast.error(error.message || 'Error al actualizar autorización');
    } finally {
      setLoading(false);
      setUploadingDocs(false);
    }
  };

  if (!participante) return null;

  const estadoActual = ESTADOS_AUTORIZACION.find(e => e.value === participante.estado_autorizacion) 
    || ESTADOS_AUTORIZACION[0];
  const estadoNuevo = ESTADOS_AUTORIZACION.find(e => e.value === estado);
  
  const totalDocsExistentes = documentosExistentes.filter(d => !documentosAEliminar.includes(d.id)).length;
  const totalDocs = totalDocsExistentes + nuevosDocumentos.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-600" />
            Gestionar Autorización
          </DialogTitle>
          <DialogDescription>
            {participante.scout_nombre} ({participante.scout_codigo})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto pr-2">
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

            {/* Sección de documentos (solo para RECIBIDA o FIRMADA) */}
            {(estado === 'RECIBIDA' || estado === 'FIRMADA') && (
              <div className="space-y-3 border-t pt-4">
                <Label className="flex items-center gap-2">
                  Documentos adjuntos
                  {totalDocs > 0 && <Badge variant="secondary">{totalDocs}</Badge>}
                </Label>

                {/* Documentos existentes */}
                {loadingDocs ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : documentosExistentes.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Archivos guardados:</p>
                    {documentosExistentes.map((doc) => {
                      const marcado = documentosAEliminar.includes(doc.id);
                      return (
                        <div 
                          key={doc.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border ${marcado ? 'bg-red-50 border-red-200 opacity-60' : 'bg-muted/30'}`}
                        >
                          {getFileIcon(doc.mime_type)}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${marcado ? 'line-through text-muted-foreground' : ''}`}>
                              {doc.nombre_archivo}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {TIPOS_DOCUMENTO.find(t => t.value === doc.tipo_documento)?.label || doc.tipo_documento}
                              {doc.tamanio_bytes && ` • ${formatFileSize(doc.tamanio_bytes)}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {doc.url_archivo && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => window.open(doc.url_archivo, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            {marcado ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-blue-600"
                                onClick={() => desmarcarParaEliminar(doc.id)}
                              >
                                Restaurar
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => marcarParaEliminar(doc.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {/* Nuevos documentos a subir */}
                {nuevosDocumentos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Nuevos archivos a subir:</p>
                    {nuevosDocumentos.map((item, index) => (
                      <div 
                        key={`${item.file.name}-${index}`}
                        className="flex flex-col gap-2 p-3 rounded-lg border border-green-200 bg-green-50"
                      >
                        <div className="flex items-center gap-2">
                          {getFileIcon(item.file.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{item.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(item.file.size)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeNuevoDocumento(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Selector de tipo para este archivo */}
                        <Select 
                          value={item.tipo} 
                          onValueChange={(v) => cambiarTipoArchivo(index, v as TipoDocumentoAutorizacion)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_DOCUMENTO.map(t => (
                              <SelectItem key={t.value} value={t.value} className="text-xs">
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botón para agregar más archivos */}
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                  <p className="text-sm text-muted-foreground">
                    {totalDocs === 0 ? 'Subir documentos' : 'Agregar más documentos'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG o PDF (máx. 10MB cada uno)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
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
          </div>

          <DialogFooter className="mt-4 pt-4 border-t flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || uploadingDocs}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploadingDocs ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : loading ? (
                'Guardando...'
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GestionarAutorizacionDialog;
