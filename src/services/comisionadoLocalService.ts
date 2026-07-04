import { supabase } from '@/lib/supabase';

export class ComisionadoLocalService {
  static async obtener(): Promise<string | null> {
    const { data, error } = await supabase.rpc('api_obtener_comisionado_local');

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener el Comisionado Local');

    return data.nombre_completo || null;
  }

  static async actualizar(nombreCompleto: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_comisionado_local', {
      p_nombre_completo: nombreCompleto,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar el Comisionado Local');
  }
}
