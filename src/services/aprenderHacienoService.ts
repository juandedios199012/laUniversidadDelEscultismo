/**
 * Servicio para el módulo "Aprender Haciendo"
 * Sigue el mismo patrón que `colaboradorService.ts`: clase con métodos
 * estáticos, uno por RPC, sin lógica de negocio en el cliente.
 */

import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';
import {
  AhModulo,
  AhModuloDetalle,
  AhRankingPatrulla,
  AhRankingScout,
  FormularioModulo,
  FormularioPaso,
  FormularioReto,
} from '../types/aprenderHaciendo';

interface RpcResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==========================================================================
// PICTOGRAMAS (Storage)
// ==========================================================================

// Reutiliza el bucket compartido 'finanzas' (ya usado por evidencias
// financieras, documentos de identidad y documentos de scouts en todo
// el proyecto) en vez de crear un bucket nuevo — evita un paso manual
// en el Dashboard de Supabase. Carpeta propia y sin colisión con las
// ya existentes (documentos-scouts/, evidencias/, documentos-identidad/).
// El bucket ya es público (getPublicUrl funciona hoy para 'evidencias/'
// en finanzasService.ts) y no necesita una política RLS de storage.objects
// nueva — solo la carpeta 'documentos-scouts/' tiene una política propia
// por ser datos de menores accesibles desde el Portal de Padres; el resto
// de carpetas (incluida esta) no la necesita.
const PICTOGRAMA_BUCKET = 'finanzas';
const PICTOGRAMA_MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB (antes de comprimir)
const PICTOGRAMA_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Efectos de sonido de un paso ("Cuentos Sensoriales" VAK) — mismo bucket
// compartido, carpeta propia. Sin compresión (browser-image-compression
// es solo para imágenes) — son clips cortos, tope de tamaño más chico.
const EFECTO_SONIDO_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const EFECTO_SONIDO_MIME_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];

export class AprenderHacienoService {
  // ==========================================================================
  // MÓDULOS
  // ==========================================================================

  /**
   * Listar módulos activos, opcionalmente filtrados por categoría y rama
   */
  static async listarModulos(filtros?: { categoria?: string; rama?: string }): Promise<AhModulo[]> {
    try {
      const { data, error } = await supabase.rpc('api_ah_listar_modulos', {
        p_categoria: filtros?.categoria || null,
        p_rama: filtros?.rama || null,
      });

      if (error) throw error;
      const result = data as RpcResult<AhModulo[]>;
      if (!result.success) throw new Error(result.error || 'Error al listar módulos');
      return result.data || [];
    } catch (error) {
      console.error('Error al listar módulos de Aprender Haciendo:', error);
      throw error;
    }
  }

  /**
   * Obtener el detalle de un módulo (pasos + retos)
   */
  static async obtenerModuloDetalle(moduloId: string): Promise<AhModuloDetalle> {
    try {
      const { data, error } = await supabase.rpc('api_ah_obtener_modulo_detalle', {
        p_modulo_id: moduloId,
      });

      if (error) throw error;
      const result = data as RpcResult<AhModuloDetalle>;
      if (!result.success || !result.data) throw new Error(result.error || 'Módulo no encontrado');
      return result.data;
    } catch (error) {
      console.error('Error al obtener detalle del módulo:', error);
      throw error;
    }
  }

  /**
   * Crear o actualizar un módulo
   */
  static async guardarModulo(datos: FormularioModulo): Promise<{ success: boolean; message: string; id?: string }> {
    try {
      const { data, error } = await supabase.rpc('api_ah_upsert_modulo', {
        p_id: datos.id || null,
        p_titulo: datos.titulo,
        p_slug: datos.slug,
        p_categoria: datos.categoria,
        p_descripcion: datos.descripcion || null,
        p_nivel_dificultad: datos.nivel_dificultad,
        p_rama_objetivo: datos.rama_objetivo || null,
        p_portada_url: datos.portada_url || null,
        p_color_inicio: datos.color_gradiente_inicio || null,
        p_color_fin: datos.color_gradiente_fin || null,
        p_icono: datos.icono || null,
        p_orden: datos.orden ?? 0,
      });

      if (error) throw error;
      const result = data as RpcResult<{ id: string }>;
      if (!result.success) {
        return { success: false, message: result.error || 'Error al guardar el módulo' };
      }
      return { success: true, message: 'Módulo guardado exitosamente', id: result.data?.id };
    } catch (error) {
      console.error('Error al guardar módulo:', error);
      throw error;
    }
  }

  /**
   * Eliminar (desactivar) un módulo
   */
  static async eliminarModulo(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('api_ah_eliminar_modulo', { p_id: id });

      if (error) throw error;
      const result = data as RpcResult<{ id: string }>;
      if (!result.success) {
        return { success: false, message: result.error || 'Error al eliminar el módulo' };
      }
      return { success: true, message: 'Módulo eliminado exitosamente' };
    } catch (error) {
      console.error('Error al eliminar módulo:', error);
      throw error;
    }
  }

  // ==========================================================================
  // PASOS
  // ==========================================================================

  static async guardarPaso(datos: FormularioPaso): Promise<{ success: boolean; message: string; id?: string }> {
    try {
      const { data, error } = await supabase.rpc('api_ah_upsert_paso', {
        p_id: datos.id || null,
        p_modulo_id: datos.modulo_id,
        p_numero_paso: datos.numero_paso,
        p_titulo: datos.titulo,
        p_instruccion_texto: datos.instruccion_texto,
        p_pictograma_url: datos.pictograma_url || null,
        p_tipo_media: datos.tipo_media || 'NINGUNO',
        p_media_url: datos.media_url || null,
        p_materiales_requeridos: datos.materiales_requeridos || [],
        p_efecto_sonido_url: datos.efecto_sonido_url || null,
      });

      if (error) throw error;
      const result = data as RpcResult<{ id: string }>;
      if (!result.success) {
        return { success: false, message: result.error || 'Error al guardar el paso' };
      }
      return { success: true, message: 'Paso guardado exitosamente', id: result.data?.id };
    } catch (error) {
      console.error('Error al guardar paso:', error);
      throw error;
    }
  }

  // ==========================================================================
  // RETOS
  // ==========================================================================

  static async guardarReto(datos: FormularioReto): Promise<{ success: boolean; message: string; id?: string }> {
    try {
      const { data, error } = await supabase.rpc('api_ah_upsert_reto', {
        p_id: datos.id || null,
        p_modulo_id: datos.modulo_id || null,
        p_tipo_juego: datos.tipo_juego,
        p_titulo: datos.titulo,
        p_configuracion: datos.configuracion || {},
        p_puntos_base: datos.puntos_base ?? 10,
        p_tiempo_limite_segundos: datos.tiempo_limite_segundos || null,
        p_orden: datos.orden ?? 0,
      });

      if (error) throw error;
      const result = data as RpcResult<{ id: string }>;
      if (!result.success) {
        return { success: false, message: result.error || 'Error al guardar el reto' };
      }
      return { success: true, message: 'Reto guardado exitosamente', id: result.data?.id };
    } catch (error) {
      console.error('Error al guardar reto:', error);
      throw error;
    }
  }

  // ==========================================================================
  // INTENTOS Y PROGRESO
  // ==========================================================================

  /**
   * Registrar el resultado de un intento de juego
   */
  static async registrarIntento(datos: {
    retoId: string;
    scoutId?: string | null;
    patrullaId?: string | null;
    puntajeObtenido: number;
    tiempoSegundos?: number | null;
  }): Promise<{ success: boolean; message: string; id?: string }> {
    try {
      const { data, error } = await supabase.rpc('api_ah_registrar_intento', {
        p_reto_id: datos.retoId,
        p_scout_id: datos.scoutId || null,
        p_patrulla_id: datos.patrullaId || null,
        p_puntaje_obtenido: datos.puntajeObtenido,
        p_tiempo_segundos: datos.tiempoSegundos || null,
      });

      if (error) throw error;
      const result = data as RpcResult<{ id: string }>;
      if (!result.success) {
        return { success: false, message: result.error || 'Error al registrar el intento' };
      }
      return { success: true, message: 'Intento registrado', id: result.data?.id };
    } catch (error) {
      console.error('Error al registrar intento:', error);
      throw error;
    }
  }

  /**
   * Actualizar el progreso de un scout en un módulo
   */
  static async actualizarProgreso(datos: {
    scoutId: string;
    moduloId: string;
    pasoActual: number;
    completado: boolean;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('api_ah_actualizar_progreso', {
        p_scout_id: datos.scoutId,
        p_modulo_id: datos.moduloId,
        p_paso_actual: datos.pasoActual,
        p_completado: datos.completado,
      });

      if (error) throw error;
      const result = data as RpcResult<{ id: string }>;
      if (!result.success) {
        return { success: false, message: result.error || 'Error al actualizar el progreso' };
      }
      return { success: true, message: 'Progreso actualizado' };
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
      throw error;
    }
  }

  // ==========================================================================
  // RANKING
  // ==========================================================================

  static async obtenerRankingPatrullas(rama?: string): Promise<AhRankingPatrulla[]> {
    try {
      const { data, error } = await supabase.rpc('api_ah_ranking_patrullas', {
        p_rama: rama || null,
      });

      if (error) throw error;
      const result = data as RpcResult<AhRankingPatrulla[]>;
      if (!result.success) throw new Error(result.error || 'Error al obtener el ranking');
      return result.data || [];
    } catch (error) {
      console.error('Error al obtener ranking de patrullas:', error);
      throw error;
    }
  }

  static async obtenerRankingScouts(rama?: string): Promise<AhRankingScout[]> {
    try {
      const { data, error } = await supabase.rpc('api_ah_ranking_scouts', {
        p_rama: rama || null,
      });

      if (error) throw error;
      const result = data as RpcResult<AhRankingScout[]>;
      if (!result.success) throw new Error(result.error || 'Error al obtener el ranking');
      return result.data || [];
    } catch (error) {
      console.error('Error al obtener ranking de scouts:', error);
      throw error;
    }
  }

  // ==========================================================================
  // PICTOGRAMAS (Storage)
  // ==========================================================================

  /**
   * Sube una imagen para usar como pictograma (juegos y pasos del módulo).
   * Comprime la imagen del lado del cliente antes de subirla (los
   * pictogramas son pequeños, tipo ícono) y sube al bucket público
   * `aprender-haciendo`, siguiendo el mismo patrón que
   * `colaboradorService.subirDocumento` (URL pública, sin firmas).
   */
  static async subirPictograma(archivo: File): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!PICTOGRAMA_IMAGE_MIME_TYPES.includes(archivo.type)) {
      return {
        success: false,
        error: 'Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, GIF, WebP)',
      };
    }
    if (archivo.size > PICTOGRAMA_MAX_FILE_SIZE) {
      return {
        success: false,
        error: `La imagen es muy grande. Tamaño máximo: ${PICTOGRAMA_MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    let archivoASubir: File = archivo;
    try {
      archivoASubir = await imageCompression(archivo, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 512,
        useWebWorker: true,
      });
    } catch (error) {
      console.warn('⚠️ Error al comprimir el pictograma, se usará la imagen original:', error);
    }

    try {
      const nombreSanitizado = archivo.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const ruta = `pictogramas-aprender-haciendo/${Date.now()}_${nombreSanitizado}`;

      const { error: uploadError } = await supabase.storage
        .from(PICTOGRAMA_BUCKET)
        .upload(ruta, archivoASubir, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(PICTOGRAMA_BUCKET).getPublicUrl(ruta);

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('Error al subir pictograma:', error);
      return {
        success: false,
        error: `Error al subir la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      };
    }
  }

  /**
   * Sube un efecto de sonido para un paso (relincho, cañón, morse, etc.).
   * Mismo bucket/patrón que `subirPictograma`, sin compresión (es audio,
   * no imagen) y con su propio tope de tamaño y tipos MIME permitidos.
   */
  static async subirEfectoSonido(archivo: File): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!EFECTO_SONIDO_MIME_TYPES.includes(archivo.type)) {
      return {
        success: false,
        error: 'Tipo de archivo no permitido. Solo se aceptan audios (MP3, WAV, OGG, WebM)',
      };
    }
    if (archivo.size > EFECTO_SONIDO_MAX_FILE_SIZE) {
      return {
        success: false,
        error: `El audio es muy grande. Tamaño máximo: ${EFECTO_SONIDO_MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    try {
      const nombreSanitizado = archivo.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const ruta = `efectos-sonido-aprender-haciendo/${Date.now()}_${nombreSanitizado}`;

      const { error: uploadError } = await supabase.storage
        .from(PICTOGRAMA_BUCKET)
        .upload(ruta, archivo, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(PICTOGRAMA_BUCKET).getPublicUrl(ruta);

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('Error al subir efecto de sonido:', error);
      return {
        success: false,
        error: `Error al subir el audio: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      };
    }
  }
}

export default AprenderHacienoService;
