/**
 * PersonaService
 * Servicio centralizado para búsqueda de personas a través de módulos.
 *
 * Usado por PersonSearchCombobox para que Dirigentes, Comité de Padres
 * y Familiares puedan buscar si una persona ya existe antes de registrarla.
 */

import { supabase } from '../lib/supabase';

// ============================================================================
// TIPOS
// ============================================================================

export interface PersonaRol {
  tipo: 'familiar' | 'dirigente' | 'comite' | 'scout';
  /** Texto descriptivo del rol: nombre del scout, cargo, etc. */
  detalle?: string;
  cargo?: string;
  codigo?: string;
  rama?: string;
}

export interface PersonaResult {
  persona_id: string;
  nombres: string;
  apellidos: string;
  tipo_documento?: string;
  numero_documento?: string;
  celular?: string;
  correo?: string;
  sexo?: string;
  /** Relaciones como familiar */
  es_familiar_de?: Array<{
    scout_id: string;
    scout_nombre: string;
    parentesco: string;
  }>;
  /** Si la persona es dirigente */
  es_dirigente?: {
    dirigente_id: string;
    cargo: string;
    unidad?: string;
    estado: string;
  } | null;
  /** Si la persona es miembro del comité de padres */
  es_comite_padres?: {
    miembro_id: string;
    cargo: string;
    estado: string;
  } | null;
  /** Si la persona es scout */
  es_scout?: {
    scout_id: string;
    codigo?: string;
    rama: string;
    estado: string;
  } | null;
  /** Roles consolidados para mostrar en el dropdown */
  roles?: PersonaRol[];
}

// ============================================================================
// CLASE PRINCIPAL
// ============================================================================

export class PersonaService {
  /**
   * Busca una persona por tipo y número de documento.
   * Retorna null si no existe.
   */
  static async buscarPorDocumento(
    tipoDocumento: string,
    numeroDocumento: string
  ): Promise<PersonaResult | null> {
    if (!numeroDocumento?.trim()) return null;

    const { data, error } = await supabase.rpc('api_buscar_persona_por_documento', {
      p_tipo_documento: tipoDocumento || 'DNI',
      p_numero_documento: numeroDocumento.trim(),
    });

    if (error) {
      console.error('PersonaService.buscarPorDocumento error:', error);
      return null;
    }

    if (!data?.existe) return null;

    return PersonaService._normalizarResultado(data);
  }

  /**
   * Busca personas por nombre o apellido (búsqueda fuzzy ILIKE).
   * Retorna hasta 15 resultados ordenados por relevancia.
   */
  static async buscarPorNombre(texto: string): Promise<PersonaResult[]> {
    if (!texto?.trim() || texto.trim().length < 2) return [];

    const { data, error } = await supabase.rpc('api_buscar_persona_por_nombre', {
      p_texto: texto.trim(),
    });

    if (error) {
      console.error('PersonaService.buscarPorNombre error:', error);
      return [];
    }

    if (!data?.success || !Array.isArray(data.data)) return [];

    return data.data.map((item: any) => PersonaService._normalizarResultado(item));
  }

  // ============================================================================
  // HELPERS INTERNOS
  // ============================================================================

  private static _normalizarResultado(raw: any): PersonaResult {
    const roles: PersonaRol[] = [];

    if (Array.isArray(raw.es_familiar_de) && raw.es_familiar_de.length > 0) {
      raw.es_familiar_de.forEach((rel: any) => {
        roles.push({
          tipo: 'familiar',
          detalle: `Familiar de ${rel.scout_nombre} (${rel.parentesco?.toLowerCase() ?? ''})`,
        });
      });
    }

    if (raw.es_dirigente) {
      roles.push({
        tipo: 'dirigente',
        cargo: raw.es_dirigente.cargo,
        detalle: raw.es_dirigente.cargo,
      });
    }

    if (raw.es_comite_padres) {
      roles.push({
        tipo: 'comite',
        cargo: raw.es_comite_padres.cargo,
        detalle: raw.es_comite_padres.cargo,
      });
    }

    if (raw.es_scout) {
      roles.push({
        tipo: 'scout',
        codigo: raw.es_scout.codigo,
        rama: raw.es_scout.rama,
        detalle: `Scout ${raw.es_scout.rama ?? ''}${raw.es_scout.codigo ? ` (${raw.es_scout.codigo})` : ''}`,
      });
    }

    // Roles de búsqueda por nombre (formato diferente)
    if (Array.isArray(raw.roles_familiar)) {
      raw.roles_familiar.forEach((r: any) => {
        if (!roles.find((x) => x.tipo === 'familiar' && x.detalle === r.detalle)) {
          roles.push({ tipo: 'familiar', detalle: r.detalle });
        }
      });
    }
    if (raw.rol_dirigente && !roles.find((x) => x.tipo === 'dirigente')) {
      roles.push({ tipo: 'dirigente', cargo: raw.rol_dirigente.cargo, detalle: raw.rol_dirigente.cargo });
    }
    if (raw.rol_comite && !roles.find((x) => x.tipo === 'comite')) {
      roles.push({ tipo: 'comite', cargo: raw.rol_comite.cargo, detalle: raw.rol_comite.cargo });
    }
    if (raw.rol_scout && !roles.find((x) => x.tipo === 'scout')) {
      roles.push({
        tipo: 'scout',
        codigo: raw.rol_scout.codigo,
        rama: raw.rol_scout.rama,
        detalle: `Scout ${raw.rol_scout.rama ?? ''}`,
      });
    }

    // La búsqueda por nombre devuelve el rol de scout como "rol_scout" (no "es_scout").
    // Normalizamos a la misma forma que usa la búsqueda por documento.
    const esScout = raw.es_scout ?? (raw.rol_scout
      ? {
          scout_id: raw.rol_scout.scout_id,
          codigo: raw.rol_scout.codigo,
          rama: raw.rol_scout.rama,
          estado: raw.rol_scout.estado,
        }
      : null);

    return {
      persona_id:      raw.persona_id,
      nombres:         raw.nombres ?? '',
      apellidos:       raw.apellidos ?? '',
      tipo_documento:  raw.tipo_documento,
      numero_documento:raw.numero_documento,
      celular:         raw.celular,
      correo:          raw.correo,
      sexo:            raw.sexo,
      es_familiar_de:  raw.es_familiar_de ?? [],
      es_dirigente:    raw.es_dirigente ?? null,
      es_comite_padres:raw.es_comite_padres ?? null,
      es_scout:        esScout,
      roles,
    };
  }
}

export default PersonaService;
