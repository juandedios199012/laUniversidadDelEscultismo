import { supabase } from '../lib/supabase';

export interface ScoutPendienteMembresia {
  scout_id: string;
  nombres: string;
  apellidos: string;
  codigo_asociado: string | null;
  rama_actual: string;
  /** 'PENDING' = nunca pagó este período; 'EXPIRED' = pagó un período anterior pero no el vigente. */
  estado: 'PENDING' | 'EXPIRED';
  expiration_date: string | null;
}

export type EstadoMembresia = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'EXEMPT';

export interface InfoMembresia {
  estado: EstadoMembresia;
  expiration_date: string | null;
  period_year: number;
}

/** Mapa {id_del_registro (dirigente/colaborador/miembro de comité): info de su membresía}. */
export type MapaMembresias = Record<string, InfoMembresia>;

export type TipoRolMembresia = 'dirigente' | 'colaborador' | 'comite_padres';

export class MembresiaService {
  /** Estado de membresía del período vigente para cada dirigente registrado. */
  static async listarEstadoDirigentes(): Promise<MapaMembresias> {
    return this.obtenerMapa('api_dirigentes_estado_membresia');
  }

  /** Estado de membresía del período vigente para cada colaborador registrado. */
  static async listarEstadoColaboradores(): Promise<MapaMembresias> {
    return this.obtenerMapa('api_colaboradores_estado_membresia');
  }

  /** Estado de membresía del período vigente para cada miembro del Comité de Padres. */
  static async listarEstadoComitePadres(): Promise<MapaMembresias> {
    return this.obtenerMapa('api_comite_padres_estado_membresia');
  }

  private static async obtenerMapa(rpcName: string): Promise<MapaMembresias> {
    const { data, error } = await supabase.rpc(rpcName);
    if (error) {
      console.error(`❌ Error en ${rpcName}:`, error);
      return {};
    }
    if (!data?.success) {
      console.error(`❌ ${rpcName}:`, data?.error);
      return {};
    }
    return (data.data as MapaMembresias) || {};
  }

  /** Exonera a un dirigente/colaborador/miembro de comité de pagar la membresía del período vigente. */
  static async exonerarRol(
    roleId: string,
    tipo: TipoRolMembresia,
    motivo?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('api_exonerar_membresia_rol', {
      p_role_id: roleId,
      p_role_type: tipo,
      p_motivo: motivo || null,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error || 'Error al exonerar' };
    return { success: true };
  }

  /**
   * Scouts activos cuya membresía anual (31 marzo - 31 marzo) del
   * período vigente no está al día — para la pestaña "En Proceso" del
   * módulo Juvenil. Excluye a los exonerados.
   */
  static async listarPendientesJuvenil(): Promise<{
    periodYear: number;
    data: ScoutPendienteMembresia[];
    error: string | null;
  }> {
    const { data, error } = await supabase.rpc('api_juvenil_pendientes_membresia');

    if (error) {
      console.error('❌ Error obteniendo pendientes de membresía:', error);
      return { periodYear: 0, data: [], error: error.message };
    }
    if (!data?.success) {
      return { periodYear: 0, data: [], error: data?.error || 'Error al obtener datos' };
    }

    return { periodYear: data.period_year, data: data.data || [], error: null };
  }

  /** Exonera a un scout de pagar la membresía del período vigente (becados, casos especiales). */
  static async exonerarScout(scoutId: string, motivo?: string): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('api_exonerar_membresia_scout', {
      p_scout_id: scoutId,
      p_motivo: motivo || null,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error || 'Error al exonerar' };
    return { success: true };
  }
}

export default MembresiaService;
