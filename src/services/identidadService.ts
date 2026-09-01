import { supabase } from '../lib/supabase';

export interface MiIdentidadScout {
  esScout: boolean;
  personaId?: string;
  scoutId?: string;
  nombres?: string;
  apellidos?: string;
  codigoAsociado?: string;
  ramaActual?: string;
}

/**
 * Resuelve quién es, como scout, el usuario autenticado — usada para
 * restringir vistas a "solo mis datos" y para identificar
 * automáticamente al jugador en Aprender Haciendo. El backend usa
 * auth.uid() internamente, no un id que mande el cliente.
 */
export class IdentidadService {
  static async obtenerMiIdentidadScout(): Promise<MiIdentidadScout> {
    try {
      const { data, error } = await supabase.rpc('api_mi_identidad_scout');
      if (error) throw error;

      if (!data?.success || !data?.es_scout) {
        return { esScout: false };
      }

      return {
        esScout: true,
        personaId: data.persona_id,
        scoutId: data.scout_id,
        nombres: data.nombres,
        apellidos: data.apellidos,
        codigoAsociado: data.codigo_asociado,
        ramaActual: data.rama_actual,
      };
    } catch (error) {
      console.error('❌ Error al obtener identidad de scout:', error);
      return { esScout: false };
    }
  }
}

export default IdentidadService;
