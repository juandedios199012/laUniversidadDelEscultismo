/**
 * ================================================================
 * SERVICIO DE DOCUMENTOS DE IDENTIDAD POR PERSONA (GENÉRICO)
 * Maneja anverso/reverso del documento de identidad asociados a
 * `personas.id`, reutilizable por dirigentes, comité y scouts.
 * Usa la tabla `documentos_identidad` y el bucket de Storage 'finanzas'.
 * ================================================================
 */

import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';
import type { DocumentSide, UploadResult, DocumentMetadata } from './scoutDocumentsService';

// ============================================
// Constantes
// ============================================

const STORAGE_BUCKET = 'finanzas';
const STORAGE_BASE_PATH = 'documentos-identidad';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const COMPRESSION_MAX_SIZE_MB = 1;
const COMPRESSION_MAX_WIDTH = 1920;

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const urlCache = new Map<string, { url: string; expiresAt: number }>();
const SIGNED_URL_EXPIRATION = 3600; // 1 hora

// ============================================
// Servicio
// ============================================

class PersonaDocumentsService {
  private validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `El archivo es muy grande. Tamaño máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no permitido. Permitidos: imágenes (JPG, PNG, GIF, WebP) y PDF',
      };
    }
    return { valid: true };
  }

  private async compressImage(file: File): Promise<File> {
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      return file;
    }
    try {
      const options = {
        maxSizeMB: COMPRESSION_MAX_SIZE_MB,
        maxWidthOrHeight: COMPRESSION_MAX_WIDTH,
        useWebWorker: true,
        fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
      };
      return await imageCompression(file, options);
    } catch (error) {
      console.warn('⚠️ Error al comprimir imagen, usando original:', error);
      return file;
    }
  }

  private async getSignedUrl(storagePath: string): Promise<string> {
    const cached = urlCache.get(storagePath);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRATION);

    if (error || !data?.signedUrl) {
      console.error('Error obteniendo URL firmada:', error);
      throw new Error('No se pudo obtener URL del documento');
    }
    urlCache.set(storagePath, {
      url: data.signedUrl,
      expiresAt: Date.now() + SIGNED_URL_EXPIRATION * 1000 - 60000,
    });
    return data.signedUrl;
  }

  private async deleteBySide(personaId: string, side: DocumentSide): Promise<void> {
    try {
      const { data } = await supabase
        .from('documentos_identidad')
        .select('storage_path')
        .eq('persona_id', personaId)
        .eq('document_side', side)
        .maybeSingle();

      if (data?.storage_path) {
        await supabase.storage.from(STORAGE_BUCKET).remove([data.storage_path]);
        await supabase
          .from('documentos_identidad')
          .delete()
          .eq('persona_id', personaId)
          .eq('document_side', side);
        urlCache.delete(data.storage_path);
      }
    } catch (error) {
      console.warn('Error eliminando documento existente:', error);
    }
  }

  /**
   * Sube una imagen del documento de identidad (anverso o reverso) para una persona.
   * Firma compatible con IdentityDocumentUpload (entityType se ignora).
   */
  async uploadIdentityDocument(
    _entityType: string,
    personaId: string,
    side: DocumentSide,
    file: File
  ): Promise<UploadResult> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      const fileToUpload = await this.compressImage(file);
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${STORAGE_BASE_PATH}/${personaId}/${side.toLowerCase()}_${timestamp}_${sanitizedName}`;

      await this.deleteBySide(personaId, side);

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, fileToUpload, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        console.error('Error subiendo archivo:', uploadError);
        return { success: false, error: `Error al subir archivo: ${uploadError.message}` };
      }

      const { error: metaError } = await supabase.from('documentos_identidad').insert({
        persona_id: personaId,
        document_side: side,
        storage_path: storagePath,
        file_name: file.name,
        file_size: fileToUpload.size,
        mime_type: fileToUpload.type,
        updated_at: new Date().toISOString(),
      });

      if (metaError) {
        console.error('Error guardando metadata:', metaError);
        await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
        return { success: false, error: `Error al guardar metadata: ${metaError.message}` };
      }

      const url = await this.getSignedUrl(storagePath);
      return { success: true, url, storagePath };
    } catch (error) {
      console.error('Error en uploadIdentityDocument (persona):', error);
      return {
        success: false,
        error: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      };
    }
  }

  /**
   * Obtiene anverso/reverso de una persona.
   * Firma compatible con IdentityDocumentUpload (entityType se ignora).
   */
  async getIdentityDocuments(
    _entityType: string,
    personaId: string
  ): Promise<{
    anverso?: { url: string; metadata: DocumentMetadata };
    reverso?: { url: string; metadata: DocumentMetadata };
  }> {
    try {
      const { data, error } = await supabase
        .from('documentos_identidad')
        .select('*')
        .eq('persona_id', personaId);

      if (error || !data || data.length === 0) {
        return {};
      }

      const result: {
        anverso?: { url: string; metadata: DocumentMetadata };
        reverso?: { url: string; metadata: DocumentMetadata };
      } = {};

      for (const doc of data) {
        const url = await this.getSignedUrl(doc.storage_path);
        const item = { url, metadata: doc as unknown as DocumentMetadata };
        if (doc.document_side === 'ANVERSO') {
          result.anverso = item;
        } else if (doc.document_side === 'REVERSO') {
          result.reverso = item;
        }
      }
      return result;
    } catch (error) {
      console.error('Error obteniendo documentos de identidad (persona):', error);
      return {};
    }
  }

  /**
   * Elimina anverso o reverso de una persona.
   * Firma compatible con IdentityDocumentUpload (entityType se ignora).
   */
  async deleteIdentityDocument(
    _entityType: string,
    personaId: string,
    side: DocumentSide
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.deleteBySide(personaId, side);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Error al eliminar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      };
    }
  }
}

export const personaDocumentsService = new PersonaDocumentsService();
export default personaDocumentsService;
