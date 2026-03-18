/**
 * ================================================================
 * SERVICIO DE GESTIÓN DE DOCUMENTOS PARA SCOUTS
 * Maneja upload de documentos de identidad, huellas digitales y firmas
 * Optimizado para Supabase Storage con compresión de imágenes
 * ================================================================
 */

import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

// ============================================
// Tipos e Interfaces
// ============================================

export type DocumentType = 'documento_identidad' | 'huella_digital' | 'firma';
export type EntityType = 'scout' | 'familiar';

export interface DocumentMetadata {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  document_type: DocumentType;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

export interface UploadDocumentRequest {
  entityType: EntityType;
  entityId: string;
  documentType: DocumentType;
  file: File;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  storagePath?: string;
  error?: string;
}

// ============================================
// Constantes
// ============================================

// Usar bucket existente 'finanzas' con subcarpeta para documentos de scouts
const STORAGE_BUCKET = 'finanzas';
const STORAGE_BASE_PATH = 'documentos-scouts';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const COMPRESSION_MAX_SIZE_MB = 1; // Comprimir a máximo 1MB
const COMPRESSION_MAX_WIDTH = 1920;

const ALLOWED_MIME_TYPES = [
  // Imágenes
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documentos
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Caché de URLs firmadas
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const SIGNED_URL_EXPIRATION = 3600; // 1 hora

// ============================================
// Clase del Servicio
// ============================================

class ScoutDocumentsService {
  
  /**
   * Valida el archivo antes de subirlo
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `El archivo es muy grande. Tamaño máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Permitidos: imágenes (JPG, PNG, GIF, WebP), PDF y Word`
      };
    }

    return { valid: true };
  }

  /**
   * Comprime una imagen antes de subirla
   */
  private async compressImage(file: File): Promise<File> {
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      return file; // No comprimir si no es imagen
    }

    try {
      const options = {
        maxSizeMB: COMPRESSION_MAX_SIZE_MB,
        maxWidthOrHeight: COMPRESSION_MAX_WIDTH,
        useWebWorker: true,
        fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
      };

      const compressedFile = await imageCompression(file, options);
      console.log(`📦 Imagen comprimida: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);
      return compressedFile;
    } catch (error) {
      console.warn('⚠️ Error al comprimir imagen, usando original:', error);
      return file;
    }
  }

  /**
   * Genera el path de almacenamiento
   */
  private generateStoragePath(
    entityType: EntityType,
    entityId: string,
    documentType: DocumentType,
    fileName: string
  ): string {
    const timestamp = Date.now();
    const extension = fileName.split('.').pop()?.toLowerCase() || 'file';
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    // Usar subcarpeta dentro del bucket finanzas
    return `${STORAGE_BASE_PATH}/${entityType}/${entityId}/${documentType}/${timestamp}_${sanitizedName}`;
  }

  /**
   * Sube un documento al storage
   */
  async uploadDocument(request: UploadDocumentRequest): Promise<UploadResult> {
    const { entityType, entityId, documentType, file } = request;

    // Validar archivo
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      // Comprimir si es imagen
      const fileToUpload = await this.compressImage(file);
      
      // Generar path de storage
      const storagePath = this.generateStoragePath(entityType, entityId, documentType, file.name);

      // Eliminar documento anterior si existe
      await this.deleteExistingDocument(entityType, entityId, documentType);

      // Subir archivo a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, fileToUpload, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error subiendo archivo:', uploadError);
        return { success: false, error: `Error al subir archivo: ${uploadError.message}` };
      }

      // Guardar metadata en la base de datos
      const { error: metaError } = await supabase
        .from('scout_documents')
        .upsert({
          entity_type: entityType,
          entity_id: entityId,
          document_type: documentType,
          storage_path: storagePath,
          file_name: file.name,
          file_size: fileToUpload.size,
          mime_type: fileToUpload.type,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'entity_type,entity_id,document_type'
        });

      if (metaError) {
        console.error('Error guardando metadata:', metaError);
        // Intentar eliminar el archivo subido
        await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
        return { success: false, error: `Error al guardar metadata: ${metaError.message}` };
      }

      // Obtener URL firmada
      const url = await this.getSignedUrl(storagePath);

      return { 
        success: true, 
        url,
        storagePath 
      };

    } catch (error) {
      console.error('Error en uploadDocument:', error);
      return { 
        success: false, 
        error: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      };
    }
  }

  /**
   * Elimina documento existente antes de subir uno nuevo
   */
  private async deleteExistingDocument(
    entityType: EntityType,
    entityId: string,
    documentType: DocumentType
  ): Promise<void> {
    try {
      // Buscar metadata existente
      const { data: existing } = await supabase
        .from('scout_documents')
        .select('storage_path')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('document_type', documentType)
        .maybeSingle();

      if (existing?.storage_path) {
        // Eliminar archivo del storage
        await supabase.storage.from(STORAGE_BUCKET).remove([existing.storage_path]);
        
        // Eliminar metadata
        await supabase
          .from('scout_documents')
          .delete()
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
          .eq('document_type', documentType);
          
        // Limpiar caché
        urlCache.delete(existing.storage_path);
      }
    } catch (error) {
      console.warn('Error eliminando documento existente:', error);
    }
  }

  /**
   * Obtiene una URL firmada con caché
   */
  async getSignedUrl(storagePath: string): Promise<string> {
    // Verificar caché
    const cached = urlCache.get(storagePath);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    // Generar nueva URL firmada
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRATION);

    if (error || !data?.signedUrl) {
      console.error('Error obteniendo URL firmada:', error);
      throw new Error('No se pudo obtener URL del documento');
    }

    // Guardar en caché
    urlCache.set(storagePath, {
      url: data.signedUrl,
      expiresAt: Date.now() + (SIGNED_URL_EXPIRATION * 1000) - 60000 // 1 minuto antes de expirar
    });

    return data.signedUrl;
  }

  /**
   * Obtiene un documento por tipo y entidad
   */
  async getDocument(
    entityType: EntityType,
    entityId: string,
    documentType: DocumentType
  ): Promise<{ url: string; metadata: DocumentMetadata } | null> {
    try {
      const { data, error } = await supabase
        .from('scout_documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('document_type', documentType)
        .maybeSingle();

      if (error) {
        console.warn('Error buscando documento:', error);
        return null;
      }
      
      if (!data) {
        return null;
      }

      const url = await this.getSignedUrl(data.storage_path);

      return {
        url,
        metadata: data as DocumentMetadata
      };
    } catch (error) {
      console.error('Error obteniendo documento:', error);
      return null;
    }
  }

  /**
   * Obtiene todos los documentos de una entidad
   */
  async getEntityDocuments(
    entityType: EntityType,
    entityId: string
  ): Promise<Array<{ type: DocumentType; url: string; metadata: DocumentMetadata }>> {
    try {
      const { data, error } = await supabase
        .from('scout_documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (error || !data || data.length === 0) {
        return [];
      }

      const documents = await Promise.all(
        data.map(async (doc) => {
          const url = await this.getSignedUrl(doc.storage_path);
          return {
            type: doc.document_type as DocumentType,
            url,
            metadata: doc as DocumentMetadata
          };
        })
      );

      return documents;
    } catch (error) {
      console.error('Error obteniendo documentos:', error);
      return [];
    }
  }

  /**
   * Elimina un documento
   */
  async deleteDocument(
    entityType: EntityType,
    entityId: string,
    documentType: DocumentType
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar metadata
      const { data, error } = await supabase
        .from('scout_documents')
        .select('storage_path')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('document_type', documentType)
        .maybeSingle();

      if (error) {
        console.warn('Error buscando documento a eliminar:', error);
        return { success: false, error: 'Error buscando documento' };
      }
      
      if (!data) {
        return { success: false, error: 'Documento no encontrado' };
      }

      // Eliminar del storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([data.storage_path]);

      if (storageError) {
        console.error('Error eliminando del storage:', storageError);
      }

      // Eliminar metadata
      const { error: deleteError } = await supabase
        .from('scout_documents')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('document_type', documentType);

      if (deleteError) {
        return { success: false, error: `Error al eliminar: ${deleteError.message}` };
      }

      // Limpiar caché
      urlCache.delete(data.storage_path);

      return { success: true };
    } catch (error) {
      console.error('Error en deleteDocument:', error);
      return { 
        success: false, 
        error: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      };
    }
  }

  /**
   * Obtiene URL de imagen para el PDF (base64 o URL pública)
   */
  async getDocumentForPdf(
    entityType: EntityType,
    entityId: string,
    documentType: DocumentType
  ): Promise<string | null> {
    try {
      const doc = await this.getDocument(entityType, entityId, documentType);
      if (!doc) return null;

      // Si es imagen, podemos obtener el blob y convertirlo a base64
      if (IMAGE_MIME_TYPES.includes(doc.metadata.mime_type)) {
        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .download(doc.metadata.storage_path);

        if (error || !data) {
          console.error('Error descargando imagen para PDF:', error);
          return doc.url; // Fallback a URL firmada
        }

        // Convertir blob a base64
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(doc.url);
          reader.readAsDataURL(data);
        });
      }

      return doc.url;
    } catch (error) {
      console.error('Error obteniendo documento para PDF:', error);
      return null;
    }
  }

  /**
   * Limpia la caché de URLs
   */
  clearCache(): void {
    urlCache.clear();
  }
}

// Exportar instancia singleton
export const scoutDocumentsService = new ScoutDocumentsService();
export default scoutDocumentsService;
