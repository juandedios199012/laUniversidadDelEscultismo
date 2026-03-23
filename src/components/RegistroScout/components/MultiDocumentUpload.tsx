/**
 * ================================================================
 * COMPONENTE DE UPLOAD MÚLTIPLE DE DOCUMENTOS
 * Permite subir múltiples imágenes de documento de identidad
 * ================================================================
 * 
 * Principios:
 * - Soporta múltiples archivos del mismo tipo
 * - Vista previa en galería
 * - Eliminar archivos individuales
 * - Drag & Drop
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, FileText, Loader2, AlertCircle, Eye, Trash2, Plus } from 'lucide-react';
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
import scoutDocumentsService, { DocumentType, EntityType } from '@/services/scoutDocumentsService';

// ============================================
// Tipos
// ============================================

interface DocumentItem {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
}

interface MultiDocumentUploadProps {
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
  /** Si es requerido (al menos 1) */
  required?: boolean;
  /** Máximo de archivos permitidos */
  maxFiles?: number;
  /** Callback cuando cambian los documentos */
  onDocumentsChange?: (documents: DocumentItem[]) => void;
  /** Callback de error */
  onError?: (error: string) => void;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

// ============================================
// Constantes
// ============================================

const ACCEPT_FILES = '.jpg,.jpeg,.png,.gif,.webp,.pdf';
const MAX_FILES_DEFAULT = 5;

// ============================================
// Componente de Vista Previa Individual
// ============================================

function DocumentPreview({ 
  doc, 
  onDelete, 
  disabled 
}: { 
  doc: DocumentItem; 
  onDelete: () => void; 
  disabled: boolean;
}) {
  const isImage = doc.mimeType.startsWith('image/');
  
  return (
    <div className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border">
      {isImage ? (
        <img
          src={doc.url}
          alt={doc.fileName}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-2">
          <FileText className="w-8 h-8 text-red-500 mb-1" />
          <span className="text-xs text-gray-500 text-center truncate w-full">
            {doc.fileName}
          </span>
        </div>
      )}
      
      {/* Overlay con acciones */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
              <Eye className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{doc.fileName}</DialogTitle>
            </DialogHeader>
            <div className="relative w-full max-h-[70vh] overflow-auto">
              {isImage ? (
                <img
                  src={doc.url}
                  alt={doc.fileName}
                  className="w-full h-auto object-contain"
                />
              ) : (
                <iframe 
                  src={doc.url} 
                  className="w-full h-[60vh]"
                  title={doc.fileName}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {!disabled && (
          <Button 
            size="sm" 
            variant="destructive"
            className="h-8 w-8 p-0"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Componente Principal
// ============================================

export function MultiDocumentUpload({
  entityType,
  entityId,
  documentType,
  label,
  description,
  required = false,
  maxFiles = MAX_FILES_DEFAULT,
  onDocumentsChange,
  onError,
  disabled = false,
  className,
}: MultiDocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar documentos existentes
  useEffect(() => {
    if (entityId) {
      loadExistingDocuments();
    }
  }, [entityId]);

  const loadExistingDocuments = async () => {
    if (!entityId) return;
    
    try {
      const docs = await scoutDocumentsService.getDocuments(entityType, entityId, documentType);
      const mappedDocs: DocumentItem[] = docs.map(d => ({
        id: d.metadata.id,
        url: d.url,
        fileName: d.metadata.file_name,
        mimeType: d.metadata.mime_type,
      }));
      setDocuments(mappedDocs);
      onDocumentsChange?.(mappedDocs);
    } catch (err) {
      console.error('Error cargando documentos:', err);
    }
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (!entityId) {
      setError('Se requiere guardar primero el registro para subir documentos');
      onError?.('Se requiere guardar primero el registro');
      return;
    }

    if (documents.length >= maxFiles) {
      setError(`Máximo ${maxFiles} archivos permitidos`);
      onError?.(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await scoutDocumentsService.uploadAdditionalDocument({
        entityType,
        entityId,
        documentType,
        file,
      });

      if (result.success && result.url) {
        // Recargar todos los documentos para obtener el ID correcto
        await loadExistingDocuments();
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
  }, [entityType, entityId, documentType, documents.length, maxFiles, onDocumentsChange, onError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Subir archivos uno por uno
      Array.from(files).forEach(file => handleFileSelect(file));
    }
    // Reset input para permitir subir el mismo archivo
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => handleFileSelect(file));
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

  const handleDeleteDocument = async (docId: string) => {
    try {
      const result = await scoutDocumentsService.deleteDocumentById(docId);
      if (result.success) {
        const updatedDocs = documents.filter(d => d.id !== docId);
        setDocuments(updatedDocs);
        onDocumentsChange?.(updatedDocs);
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

  const canAddMore = documents.length < maxFiles;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              {label}
              {required && <span className="text-red-500">*</span>}
            </label>
            <span className="text-xs text-gray-500">
              {documents.length}/{maxFiles} archivos
            </span>
          </div>

          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_FILES}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || isUploading || !canAddMore}
            multiple
            aria-label={label}
          />

          {/* Galería de documentos */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {documents.map((doc) => (
              <DocumentPreview
                key={doc.id}
                doc={doc}
                onDelete={() => handleDeleteDocument(doc.id)}
                disabled={disabled}
              />
            ))}
            
            {/* Botón para agregar más */}
            {canAddMore && (
              <div
                className={cn(
                  "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors",
                  isDragging && "border-blue-500 bg-blue-50",
                  !isDragging && "border-gray-300 hover:border-blue-400 hover:bg-gray-50",
                  (disabled || isUploading || !entityId) && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !disabled && !isUploading && entityId && triggerFileInput()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                role="button"
                tabIndex={0}
                aria-label="Agregar imagen"
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Agregar</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mensaje si no hay entityId */}
          {!entityId && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Guarda el registro primero para subir documentos
            </p>
          )}

          {/* Estado vacío */}
          {documents.length === 0 && entityId && !isUploading && (
            <div 
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                isDragging && "border-blue-500 bg-blue-50",
                !isDragging && "border-gray-300 hover:border-blue-400"
              )}
              onClick={triggerFileInput}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                Arrastra imágenes aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-400">
                JPG, PNG, PDF (máx. {maxFiles} archivos)
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MultiDocumentUpload;
