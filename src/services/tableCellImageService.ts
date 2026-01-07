/**
 * ================================================================
 * SERVICIO DE GESTIÓN DE IMÁGENES PARA CELDAS
 * Maneja upload, fetch y delete de imágenes usando Supabase Storage
 * Optimizado para rendimiento con URLs firmadas y caché
 * ================================================================
 */

import { supabase } from '../lib/supabase';

// Interfaces
export interface CellImageMetadata {
  id: string;
  design_id: string;
  cell_id: string;
  storage_path: string;
  storage_bucket: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  display_width?: number;
  display_height?: number;
  fit_mode: 'contain' | 'cover' | 'fill' | 'scale-down';
  created_at: string;
  updated_at: string;
}

export interface UploadImageRequest {
  designId: string;
  cellId: string;
  file: File;
  displayWidth?: number;
  displayHeight?: number;
  fitMode?: 'contain' | 'cover' | 'fill' | 'scale-down';
}

export interface ImageStorageStats {
  total_images: number;
  total_size_bytes: number;
  total_size_mb: number;
  avg_size_kb: number;
  images_by_mime: Record<string, number>;
}

// Constantes
const STORAGE_BUCKET = 'table-cell-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const SIGNED_URL_EXPIRATION = 3600; // 1 hora

// Caché de URLs firmadas
const urlCache = new Map<string, { url: string; expiresAt: number }>();

class TableCellImageService {
  
  /**
   * Validar archivo antes de upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `El archivo es muy grande. Tamaño máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Validar tipo MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Comprimir imagen antes de upload (opcional)
   */
  private async compressImage(file: File, maxWidth: number = 1920): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar si es necesario
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Error comprimiendo imagen'));
              }
            },
            'image/jpeg',
            0.85
          );
        };

        img.onerror = () => reject(new Error('Error cargando imagen'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Obtener dimensiones de la imagen
   */
  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        
        img.onerror = () => reject(new Error('Error obteniendo dimensiones'));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Subir imagen a Storage y crear metadata
   */
  async uploadImage(request: UploadImageRequest): Promise<CellImageMetadata> {
    try {
      console.log('📤 Iniciando upload de imagen:', request);

      // Validar archivo
      const validation = this.validateFile(request.file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Obtener dimensiones originales
      const dimensions = await this.getImageDimensions(request.file);
      console.log('📐 Dimensiones originales:', dimensions);

      // Comprimir imagen si es JPEG/PNG y > 1MB
      let fileToUpload = request.file;
      if (
        (request.file.type === 'image/jpeg' || request.file.type === 'image/png') &&
        request.file.size > 1024 * 1024
      ) {
        console.log('🗜️ Comprimiendo imagen...');
        fileToUpload = await this.compressImage(request.file);
        console.log('✅ Imagen comprimida:', {
          original: request.file.size,
          compressed: fileToUpload.size,
          reduction: `${(((request.file.size - fileToUpload.size) / request.file.size) * 100).toFixed(1)}%`
        });
      }

      // Generar path único
      const timestamp = Date.now();
      const fileName = `${timestamp}_${request.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storagePath = `designs/${request.designId}/cells/${request.cellId}/${fileName}`;

      console.log('📁 Subiendo a Storage:', storagePath);

      // Subir a Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Error subiendo a Storage:', uploadError);
        throw uploadError;
      }

      console.log('✅ Archivo subido exitosamente:', uploadData);

      // Crear registro de metadata
      const { data: metadata, error: metadataError } = await supabase
        .from('table_cell_images')
        .insert({
          design_id: request.designId,
          cell_id: request.cellId,
          storage_path: storagePath,
          storage_bucket: STORAGE_BUCKET,
          file_name: request.file.name,
          file_size: fileToUpload.size,
          mime_type: request.file.type,
          width: dimensions.width,
          height: dimensions.height,
          display_width: request.displayWidth,
          display_height: request.displayHeight,
          fit_mode: request.fitMode || 'contain'
        })
        .select('*')
        .single();

      if (metadataError) {
        console.error('❌ Error creando metadata:', metadataError);
        // Intentar limpiar archivo subido
        await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
        throw metadataError;
      }

      console.log('✅ Metadata creada exitosamente:', metadata);
      return metadata;

    } catch (error) {
      console.error('❌ Error en uploadImage:', error);
      throw error;
    }
  }

  /**
   * Obtener URL firmada para una imagen
   */
  async getImageUrl(imageId: string, forceRefresh: boolean = false): Promise<string> {
    try {
      // Verificar caché
      if (!forceRefresh) {
        const cached = urlCache.get(imageId);
        if (cached && cached.expiresAt > Date.now()) {
          console.log('🎯 URL obtenida del caché:', imageId);
          return cached.url;
        }
      }

      // Obtener metadata
      const { data: metadata, error: metadataError } = await supabase
        .from('table_cell_images')
        .select('storage_path, storage_bucket')
        .eq('id', imageId)
        .single();

      if (metadataError || !metadata) {
        throw new Error('Imagen no encontrada');
      }

      // Generar URL firmada
      const { data: signedData, error: signedError } = await supabase.storage
        .from(metadata.storage_bucket)
        .createSignedUrl(metadata.storage_path, SIGNED_URL_EXPIRATION);

      if (signedError || !signedData) {
        throw new Error('Error generando URL firmada');
      }

      // Guardar en caché
      urlCache.set(imageId, {
        url: signedData.signedUrl,
        expiresAt: Date.now() + (SIGNED_URL_EXPIRATION - 300) * 1000 // 5 min antes de expirar
      });

      console.log('✅ URL firmada generada:', imageId);
      return signedData.signedUrl;

    } catch (error) {
      console.error('❌ Error obteniendo URL de imagen:', error);
      throw error;
    }
  }

  /**
   * Obtener metadata de una imagen
   */
  async getImageMetadata(imageId: string): Promise<CellImageMetadata | null> {
    try {
      const { data, error } = await supabase
        .from('table_cell_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (error) {
        console.error('Error obteniendo metadata:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error en getImageMetadata:', error);
      return null;
    }
  }

  /**
   * Obtener todas las imágenes de un diseño
   */
  async getDesignImages(designId: string): Promise<CellImageMetadata[]> {
    try {
      const { data, error } = await supabase
        .from('table_cell_images')
        .select('*')
        .eq('design_id', designId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo imágenes del diseño:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error en getDesignImages:', error);
      return [];
    }
  }

  /**
   * Obtener imagen de una celda específica
   */
  async getCellImage(designId: string, cellId: string): Promise<CellImageMetadata | null> {
    try {
      const { data, error } = await supabase
        .from('table_cell_images')
        .select('*')
        .eq('design_id', designId)
        .eq('cell_id', cellId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No se encontró imagen, retornar null sin error
          return null;
        }
        console.error('Error obteniendo imagen de celda:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error en getCellImage:', error);
      return null;
    }
  }

  /**
   * Actualizar metadata de imagen
   */
  async updateImageMetadata(
    imageId: string,
    updates: Partial<Pick<CellImageMetadata, 'display_width' | 'display_height' | 'fit_mode'>>
  ): Promise<CellImageMetadata> {
    try {
      const { data, error } = await supabase
        .from('table_cell_images')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', imageId)
        .select('*')
        .single();

      if (error) {
        console.error('Error actualizando metadata:', error);
        throw error;
      }

      console.log('✅ Metadata actualizada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en updateImageMetadata:', error);
      throw error;
    }
  }

  /**
   * Eliminar imagen (Storage + metadata)
   */
  async deleteImage(imageId: string): Promise<boolean> {
    try {
      console.log('🗑️ Eliminando imagen:', imageId);

      // Obtener metadata para conocer el path
      const { data: metadata, error: metadataError } = await supabase
        .from('table_cell_images')
        .select('storage_path, storage_bucket')
        .eq('id', imageId)
        .single();

      if (metadataError) {
        console.error('Error obteniendo metadata para eliminar:', metadataError);
        throw metadataError;
      }

      // Eliminar de Storage
      const { error: storageError } = await supabase.storage
        .from(metadata.storage_bucket)
        .remove([metadata.storage_path]);

      if (storageError) {
        console.warn('⚠️ Error eliminando de Storage:', storageError);
        // Continuar con eliminación de metadata
      }

      // Eliminar metadata
      const { error: deleteError } = await supabase
        .from('table_cell_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) {
        console.error('Error eliminando metadata:', deleteError);
        throw deleteError;
      }

      // Limpiar caché
      urlCache.delete(imageId);

      console.log('✅ Imagen eliminada exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error en deleteImage:', error);
      return false;
    }
  }

  /**
   * Limpiar imágenes de una celda (cuando se reemplaza)
   */
  async clearCellImages(designId: string, cellId: string): Promise<number> {
    try {
      // Obtener todas las imágenes de la celda
      const { data: images, error: fetchError } = await supabase
        .from('table_cell_images')
        .select('id')
        .eq('design_id', designId)
        .eq('cell_id', cellId);

      if (fetchError) {
        console.error('Error obteniendo imágenes de celda:', fetchError);
        throw fetchError;
      }

      if (!images || images.length === 0) {
        return 0;
      }

      // Eliminar cada imagen
      let deletedCount = 0;
      for (const img of images) {
        const success = await this.deleteImage(img.id);
        if (success) deletedCount++;
      }

      console.log(`✅ ${deletedCount} imágenes eliminadas de la celda`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error en clearCellImages:', error);
      return 0;
    }
  }

  /**
   * Obtener estadísticas de almacenamiento
   */
  async getStorageStats(): Promise<ImageStorageStats | null> {
    try {
      const { data, error } = await supabase.rpc('get_image_storage_stats');

      if (error) {
        console.error('Error obteniendo estadísticas:', error);
        throw error;
      }

      return data[0] || null;
    } catch (error) {
      console.error('❌ Error en getStorageStats:', error);
      return null;
    }
  }

  /**
   * Limpiar caché de URLs
   */
  clearUrlCache(): void {
    urlCache.clear();
    console.log('🧹 Caché de URLs limpiado');
  }

  /**
   * Limpiar imágenes huérfanas
   */
  async cleanupOrphanImages(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_orphan_images');

      if (error) {
        console.error('Error limpiando imágenes huérfanas:', error);
        throw error;
      }

      console.log(`🧹 ${data} imágenes huérfanas eliminadas`);
      return data;
    } catch (error) {
      console.error('❌ Error en cleanupOrphanImages:', error);
      return 0;
    }
  }
}

// Exportar instancia singleton
export const tableCellImageService = new TableCellImageService();
export default tableCellImageService;
