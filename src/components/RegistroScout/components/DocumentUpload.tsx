/**
 * ================================================================
 * COMPONENTE DE UPLOAD DE DOCUMENTOS
 * Componente reutilizable para subir documentos de identidad,
 * huellas digitales y firmas
 * ================================================================
 * 
 * Principios:
 * - "Don't make me think" (Steve Krug)
 * - Lazy loading de imágenes
 * - Feedback visual inmediato
 * - Accesibilidad (ARIA labels)
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2, CheckCircle, AlertCircle, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import scoutDocumentsService, { DocumentType, EntityType, UploadResult } from '@/services/scoutDocumentsService';

// ============================================
// Tipos
// ============================================

interface DocumentUploadProps {
  /** Tipo de entidad (scout o familiar) */
  entityType: EntityType;
  /** ID de la entidad */
  entityId?: string;
  /** Tipo de documento */
  documentType: DocumentType;
  /** Label del componente */
  label: string;
  /** Descripción/ayuda */
  description?: string;
  /** Si es requerido */
  required?: boolean;
  /** Callback cuando se sube exitosamente */
  onUploadSuccess?: (url: string, storagePath: string) => void;
  /** Callback cuando se elimina */
  onDelete?: () => void;
  /** Callback de error */
  onError?: (error: string) => void;
  /** URL inicial (para modo edición) */
  initialUrl?: string;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Clase CSS adicional */
  className?: string;
  /** Modo compacto (para uso en arrays) */
  compact?: boolean;
}

interface FilePreviewProps {
  url: string;
  fileName: string;
  mimeType: string;
  onDelete?: () => void;
  disabled?: boolean;
}

// ============================================
// Constantes
// ============================================

const DOCUMENT_LABELS: Record<DocumentType, { title: string; icon: React.ElementType }> = {
  documento_identidad: { title: 'Documento de Identidad', icon: FileText },
  huella_digital: { title: 'Huella Digital', icon: FileText },
  firma: { title: 'Firma', icon: FileText },
};

const ACCEPT_FILES = '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx';
const ACCEPT_IMAGES_ONLY = '.jpg,.jpeg,.png,.gif,.webp';

// ============================================
// Componente de Vista Previa
// ============================================

function FilePreview({ url, fileName, mimeType, onDelete, disabled }: FilePreviewProps) {
  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';
  
  return (
    <div className="relative group">
      {isImage ? (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
          <img
            src={url}
            alt={fileName}
            loading="lazy"
            className="w-full h-full object-contain"
          />
          {/* Overlay con acciones */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary">
                  <Eye className="w-4 h-4 mr-1" />
                  Ver
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{fileName}</DialogTitle>
                </DialogHeader>
                <div className="relative w-full max-h-[70vh] overflow-auto">
                  <img
                    src={url}
                    alt={fileName}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </DialogContent>
            </Dialog>
            {onDelete && !disabled && (
              <Button 
                size="sm" 
                variant="destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          {isPdf ? (
            <FileText className="w-8 h-8 text-red-500" />
          ) : (
            <FileText className="w-8 h-8 text-blue-500" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs text-gray-500">{mimeType}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open(url, '_blank')}
            >
              <Eye className="w-4 h-4" />
            </Button>
            {onDelete && !disabled && (
              <Button 
                size="sm" 
                variant="destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Componente Principal
// ============================================

export function DocumentUpload({
  entityType,
  entityId,
  documentType,
  label,
  description,
  required = false,
  onUploadSuccess,
  onDelete,
  onError,
  initialUrl,
  disabled = false,
  className,
  compact = false,
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(initialUrl || null);
  const [fileName, setFileName] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar documento existente si hay entityId
  useEffect(() => {
    if (entityId && !initialUrl) {
      loadExistingDocument();
    }
  }, [entityId]);

  const loadExistingDocument = async () => {
    if (!entityId) return;
    
    try {
      const doc = await scoutDocumentsService.getDocument(entityType, entityId, documentType);
      if (doc) {
        setUploadedUrl(doc.url);
        setFileName(doc.metadata.file_name);
        setMimeType(doc.metadata.mime_type);
      }
    } catch (err) {
      console.error('Error cargando documento:', err);
    }
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (!entityId) {
      setError('Se requiere guardar primero el registro para subir documentos');
      onError?.('Se requiere guardar primero el registro');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result: UploadResult = await scoutDocumentsService.uploadDocument({
        entityType,
        entityId,
        documentType,
        file,
      });

      if (result.success && result.url) {
        setUploadedUrl(result.url);
        setFileName(file.name);
        setMimeType(file.type);
        onUploadSuccess?.(result.url, result.storagePath || '');
      } else {
        setError(result.error || 'Error al subir el archivo');
        onError?.(result.error || 'Error al subir el archivo');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error inesperado';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsUploading(false);
    }
  }, [entityType, entityId, documentType, onUploadSuccess, onError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input para permitir subir el mismo archivo
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDelete = async () => {
    if (!entityId) return;

    try {
      const result = await scoutDocumentsService.deleteDocument(entityType, entityId, documentType);
      if (result.success) {
        setUploadedUrl(null);
        setFileName('');
        setMimeType('');
        onDelete?.();
      } else {
        setError(result.error || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error al eliminar el documento');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const acceptFiles = documentType === 'huella_digital' || documentType === 'firma' 
    ? ACCEPT_IMAGES_ONLY 
    : ACCEPT_FILES;

  // Modo compacto para usar en arrays de familiares
  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <label className="text-sm font-medium flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptFiles}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || isUploading}
          aria-label={label}
        />

        {uploadedUrl ? (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700 truncate flex-1">{fileName || 'Documento cargado'}</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => window.open(uploadedUrl, '_blank')}
              className="h-7 px-2"
            >
              <Eye className="w-3 h-3" />
            </Button>
            {!disabled && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="h-7 px-2 text-red-500 hover:text-red-700"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            disabled={disabled || isUploading || !entityId}
            className="w-full justify-start"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? 'Subiendo...' : 'Subir archivo'}
          </Button>
        )}

        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
    );
  }

  // Modo normal (card completo)
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              {documentType === 'documento_identidad' && <FileText className="w-4 h-4 text-blue-600" />}
              {documentType === 'huella_digital' && <ImageIcon className="w-4 h-4 text-purple-600" />}
              {documentType === 'firma' && <FileText className="w-4 h-4 text-green-600" />}
              {label}
              {required && <span className="text-red-500">*</span>}
            </label>
            {uploadedUrl && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Cargado
              </span>
            )}
          </div>

          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptFiles}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || isUploading}
            aria-label={label}
          />

          {/* Área de upload o preview */}
          {uploadedUrl ? (
            <FilePreview
              url={uploadedUrl}
              fileName={fileName}
              mimeType={mimeType}
              onDelete={handleDelete}
              disabled={disabled}
            />
          ) : (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                isDragging && "border-blue-500 bg-blue-50",
                !isDragging && "border-gray-300 hover:border-gray-400",
                disabled && "opacity-50 cursor-not-allowed",
                !entityId && "opacity-50"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={!disabled && entityId ? triggerFileInput : undefined}
              role="button"
              tabIndex={0}
              aria-label={`Subir ${label}`}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !disabled && entityId) {
                  triggerFileInput();
                }
              }}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-600">Subiendo archivo...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className={cn(
                    "w-8 h-8",
                    isDragging ? "text-blue-500" : "text-gray-400"
                  )} />
                  <div>
                    <span className="text-sm text-gray-600">
                      Arrastra un archivo aquí o{' '}
                      <span className="text-blue-600 font-medium">haz clic para buscar</span>
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {documentType === 'huella_digital' || documentType === 'firma'
                      ? 'JPG, PNG, GIF o WebP (máx. 10MB)'
                      : 'JPG, PNG, PDF o Word (máx. 10MB)'}
                  </span>
                  {!entityId && (
                    <span className="text-xs text-amber-600 mt-2 block">
                      ⚠️ {entityType === 'scout' 
                        ? 'Primero guarda el scout usando el botón "Guardar" al final del formulario'
                        : 'Primero guarda el familiar. Los documentos se pueden subir después de guardar el registro.'}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DocumentUpload;
