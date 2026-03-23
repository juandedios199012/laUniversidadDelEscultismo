/**
 * ================================================================
 * COMPONENTE DE UPLOAD DE DOCUMENTO DE IDENTIDAD
 * Permite subir anverso (cara frontal) y reverso (cara posterior)
 * ================================================================
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, FileText, Loader2, AlertCircle, Eye, Trash2, CreditCard } from 'lucide-react';
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
import scoutDocumentsService, { EntityType, DocumentSide, DocumentMetadata } from '@/services/scoutDocumentsService';

// ============================================
// Tipos
// ============================================

interface IdentityDocumentUploadProps {
  /** Tipo de entidad (scout o familiar) */
  entityType: EntityType;
  /** ID de la entidad */
  entityId?: string;
  /** Label del componente */
  label?: string;
  /** Si es requerido */
  required?: boolean;
  /** Callback cuando cambian los documentos */
  onDocumentsChange?: (docs: { anverso?: string; reverso?: string }) => void;
  /** Callback de error */
  onError?: (error: string) => void;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

interface DocumentState {
  url: string | null;
  fileName: string;
  isUploading: boolean;
}

// ============================================
// Constantes
// ============================================

const ACCEPT_FILES = '.jpg,.jpeg,.png,.gif,.webp,.pdf';

// ============================================
// Componente de Slot de Documento
// ============================================

function DocumentSlot({
  side,
  label,
  state,
  onUpload,
  onDelete,
  onView,
  disabled,
  entityId,
}: {
  side: DocumentSide;
  label: string;
  state: DocumentState;
  onUpload: (file: File) => void;
  onDelete: () => void;
  onView: () => void;
  disabled: boolean;
  entityId?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
    }
  }, [onUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const isImage = state.url && !state.fileName.toLowerCase().endsWith('.pdf');

  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <CreditCard className="w-4 h-4" />
        {label}
      </label>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_FILES}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || state.isUploading || !entityId}
      />

      {state.url ? (
        // Documento cargado
        <div className="relative group aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden border-2 border-green-300">
          {isImage ? (
            <img
              src={state.url}
              alt={label}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2">
              <FileText className="w-10 h-10 text-red-500 mb-2" />
              <span className="text-xs text-gray-500 text-center truncate w-full">
                {state.fileName}
              </span>
            </div>
          )}
          
          {/* Overlay con acciones */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" size="sm" variant="secondary" className="h-8 px-3">
                  <Eye className="w-4 h-4 mr-1" />
                  Ver
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{label} - {state.fileName}</DialogTitle>
                </DialogHeader>
                <div className="relative w-full max-h-[70vh] overflow-auto">
                  {isImage ? (
                    <img
                      src={state.url}
                      alt={label}
                      className="w-full h-auto object-contain"
                    />
                  ) : (
                    <iframe 
                      src={state.url} 
                      className="w-full h-[60vh]"
                      title={label}
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            {!disabled && (
              <Button 
                type="button"
                size="sm" 
                variant="destructive"
                className="h-8 px-3"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>

          {/* Badge de éxito */}
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            ✓ Cargado
          </div>
        </div>
      ) : (
        // Slot vacío
        <div
          className={cn(
            "aspect-[3/2] rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all",
            isDragging && "border-blue-500 bg-blue-50",
            !isDragging && "border-gray-300 hover:border-blue-400 hover:bg-gray-50",
            (disabled || state.isUploading || !entityId) && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && !state.isUploading && entityId && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          aria-label={`Subir ${label}`}
        >
          {state.isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              <span className="text-sm text-gray-500">Subiendo...</span>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600 text-center px-2">
                {entityId ? 'Clic o arrastra imagen' : 'Guarda primero el registro'}
              </span>
              <span className="text-xs text-gray-400 mt-1">JPG, PNG, PDF</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Componente Principal
// ============================================

export function IdentityDocumentUpload({
  entityType,
  entityId,
  label = "Documento de Identidad",
  required = false,
  onDocumentsChange,
  onError,
  disabled = false,
  className,
}: IdentityDocumentUploadProps) {
  const [anverso, setAnverso] = useState<DocumentState>({
    url: null,
    fileName: '',
    isUploading: false,
  });
  
  const [reverso, setReverso] = useState<DocumentState>({
    url: null,
    fileName: '',
    isUploading: false,
  });

  const [error, setError] = useState<string | null>(null);

  // Cargar documentos existentes
  useEffect(() => {
    if (entityId) {
      loadExistingDocuments();
    }
  }, [entityId]);

  const loadExistingDocuments = async () => {
    if (!entityId) return;
    
    try {
      const docs = await scoutDocumentsService.getIdentityDocuments(entityType, entityId);
      
      if (docs.anverso) {
        setAnverso({
          url: docs.anverso.url,
          fileName: docs.anverso.metadata.file_name,
          isUploading: false,
        });
      }
      
      if (docs.reverso) {
        setReverso({
          url: docs.reverso.url,
          fileName: docs.reverso.metadata.file_name,
          isUploading: false,
        });
      }

      onDocumentsChange?.({
        anverso: docs.anverso?.url,
        reverso: docs.reverso?.url,
      });
    } catch (err) {
      console.error('Error cargando documentos:', err);
    }
  };

  const handleUpload = async (side: DocumentSide, file: File) => {
    if (!entityId) {
      setError('Se requiere guardar primero el registro');
      onError?.('Se requiere guardar primero el registro');
      return;
    }

    const setState = side === 'ANVERSO' ? setAnverso : setReverso;
    setState(prev => ({ ...prev, isUploading: true }));
    setError(null);

    try {
      const result = await scoutDocumentsService.uploadIdentityDocument(
        entityType,
        entityId,
        side,
        file
      );

      if (result.success && result.url) {
        setState({
          url: result.url,
          fileName: file.name,
          isUploading: false,
        });

        // Notificar cambio
        const newDocs = {
          anverso: side === 'ANVERSO' ? result.url : anverso.url || undefined,
          reverso: side === 'REVERSO' ? result.url : reverso.url || undefined,
        };
        onDocumentsChange?.(newDocs);
      } else {
        setState(prev => ({ ...prev, isUploading: false }));
        setError(result.error || 'Error al subir');
        onError?.(result.error || 'Error al subir');
      }
    } catch (err) {
      setState(prev => ({ ...prev, isUploading: false }));
      const errorMsg = err instanceof Error ? err.message : 'Error inesperado';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handleDelete = async (side: DocumentSide) => {
    if (!entityId) return;

    const setState = side === 'ANVERSO' ? setAnverso : setReverso;
    
    try {
      const result = await scoutDocumentsService.deleteIdentityDocument(entityType, entityId, side);
      
      if (result.success) {
        setState({ url: null, fileName: '', isUploading: false });
        
        // Notificar cambio
        const newDocs = {
          anverso: side === 'ANVERSO' ? undefined : anverso.url || undefined,
          reverso: side === 'REVERSO' ? undefined : reverso.url || undefined,
        };
        onDocumentsChange?.(newDocs);
      } else {
        setError(result.error || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error al eliminar');
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              {label}
              {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2">
              {anverso.url && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  Anverso ✓
                </span>
              )}
              {reverso.url && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  Reverso ✓
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Sube imágenes o PDF del documento de identidad por ambos lados
          </p>

          {/* Slots de anverso y reverso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DocumentSlot
              side="ANVERSO"
              label="Anverso (Cara frontal)"
              state={anverso}
              onUpload={(file) => handleUpload('ANVERSO', file)}
              onDelete={() => handleDelete('ANVERSO')}
              onView={() => {}}
              disabled={disabled}
              entityId={entityId}
            />
            
            <DocumentSlot
              side="REVERSO"
              label="Reverso (Cara posterior)"
              state={reverso}
              onUpload={(file) => handleUpload('REVERSO', file)}
              onDelete={() => handleDelete('REVERSO')}
              onView={() => {}}
              disabled={disabled}
              entityId={entityId}
            />
          </div>

          {/* Mensaje si no hay entityId */}
          {!entityId && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Guarda el registro primero para subir documentos
            </p>
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

export default IdentityDocumentUpload;
