import { supabase } from '@/lib/supabase';

/** Autoridad externa al grupo (ej. Comisionado Local) a quien se dirige el Anexo 1. */
export interface Aprobador {
  id: string;
  nombre_completo: string;
  cargo: string;
}

export class AprobadoresService {
  static async listar(): Promise<Aprobador[]> {
    const { data, error } = await supabase.rpc('api_listar_aprobadores');

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener los Aprobadores');

    return Array.isArray(data.data) ? data.data : [];
  }

  /** Sin id → crea; con id → actualiza. */
  static async guardar(responsable: { id?: string | null; nombre_completo: string; cargo: string }): Promise<void> {
    const { data, error } = await supabase.rpc('api_guardar_aprobador', {
      p_id: responsable.id ?? null,
      p_nombre_completo: responsable.nombre_completo,
      p_cargo: responsable.cargo,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al guardar el Aprobador');
  }

  static async eliminar(id: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_aprobador', { p_id: id });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar el Aprobador');
  }
}
