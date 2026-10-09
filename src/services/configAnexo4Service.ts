import { supabase } from '@/lib/supabase';

/** Textos del Anexo 4 configurables en Aire Libre → Textos Anexo 4. */
export interface ConfigAnexo4 {
  declaraciones: string[];
  items_que_llevar: string[];
  /** Ej: "Yape / Plin al 987 654 321 — Juan Pérez (Tesorería)". Se muestra al padre al pagar. */
  instrucciones_pago: string | null;
  updated_at?: string | null;
}

export class ConfigAnexo4Service {
  static async obtener(): Promise<ConfigAnexo4> {
    const { data, error } = await supabase.rpc('api_obtener_config_anexo4');

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener los textos del Anexo 4');

    return {
      declaraciones: Array.isArray(data.declaraciones) ? data.declaraciones : [],
      items_que_llevar: Array.isArray(data.items_que_llevar) ? data.items_que_llevar : [],
      instrucciones_pago: data.instrucciones_pago ?? null,
      updated_at: data.updated_at ?? null,
    };
  }

  /** Igual que obtener(), pero sin lanzar: si falla, el PDF usa los textos por defecto. */
  static async obtenerOVacio(): Promise<ConfigAnexo4> {
    try {
      return await ConfigAnexo4Service.obtener();
    } catch (err) {
      console.warn('No se pudo cargar la configuración del Anexo 4, se usan textos por defecto:', err);
      return { declaraciones: [], items_que_llevar: [], instrucciones_pago: null };
    }
  }

  static async actualizar(config: Omit<ConfigAnexo4, 'updated_at'>): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_config_anexo4', { p_datos: config });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al guardar los textos del Anexo 4');
  }
}
