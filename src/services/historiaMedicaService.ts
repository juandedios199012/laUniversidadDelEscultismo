/**
 * ================================================================
 * Historia Médica Service
 * ================================================================
 * Servicio para gestionar la Historia Médica de scouts
 * Usa Supabase RPC functions
 */

import { supabase } from '@/lib/supabase';

// ============= Tipos =============

export interface CondicionMedica {
  id?: string;
  nombre: string;
  tipo: 'CRONICA' | 'CONTROLADA' | 'RESUELTA' | 'EN_TRATAMIENTO';
  fecha_diagnostico?: string;
  tratamiento?: string;
  medico_tratante?: string;
  notas?: string;
  activa: boolean;
}

export interface Alergia {
  id?: string;
  nombre: string;
  tipo: 'MEDICAMENTO' | 'ALIMENTO' | 'AMBIENTAL' | 'INSECTO' | 'OTRA';
  severidad: 'LEVE' | 'MODERADA' | 'SEVERA';
  reaccion?: string;
  tratamiento_emergencia?: string;
}

export interface Medicamento {
  id?: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  via_administracion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  motivo?: string;
  prescrito_por?: string;
  activo: boolean;
}

export interface Vacuna {
  id?: string;
  nombre: string;
  fecha_aplicacion?: string;
  dosis_numero?: number;
  lote?: string;
  establecimiento?: string;
  proxima_dosis?: string;
}

export interface HistoriaMedicaCabecera {
  id?: string;
  persona_id: string;
  fecha_llenado: string;
  lugar_nacimiento?: string;
  estatura_cm?: number;
  peso_kg?: number;
  seguro_medico?: string;
  numero_poliza?: string;
  medico_cabecera?: string;
  telefono_medico?: string;
  hospital_preferencia?: string;
  observaciones_generales?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HistoriaMedicaCompleta {
  cabecera: HistoriaMedicaCabecera;
  condiciones: CondicionMedica[];
  alergias: Alergia[];
  medicamentos: Medicamento[];
  vacunas: Vacuna[];
}

export interface HistoriaMedicaStats {
  condiciones: number;
  alergias: number;
  medicamentos: number;
  vacunas: number;
}

export interface CatalogoCondicion {
  id: string;
  nombre: string;
}

export interface CatalogoAlergia {
  id: string;
  nombre: string;
}

export interface CatalogoVacuna {
  id: string;
  nombre: string;
}

// ============= Service =============

export class HistoriaMedicaService {
  /**
   * Obtiene el catálogo de condiciones médicas
   */
  static async obtenerCatalogoCondiciones(): Promise<CatalogoCondicion[]> {
    const { data, error } = await supabase.rpc('api_obtener_catalogo_condiciones');
    
    if (error) {
      console.error('Error obteniendo catálogo de condiciones:', error);
      throw error;
    }
    
    return data?.data || [];
  }

  /**
   * Obtiene el catálogo de alergias
   */
  static async obtenerCatalogoAlergias(): Promise<CatalogoAlergia[]> {
    const { data, error } = await supabase.rpc('api_obtener_catalogo_alergias');
    
    if (error) {
      console.error('Error obteniendo catálogo de alergias:', error);
      throw error;
    }
    
    return data?.data || [];
  }

  /**
   * Obtiene el catálogo de vacunas
   */
  static async obtenerCatalogoVacunas(): Promise<CatalogoVacuna[]> {
    const { data, error } = await supabase.rpc('api_obtener_catalogo_vacunas');
    
    if (error) {
      console.error('Error obteniendo catálogo de vacunas:', error);
      throw error;
    }
    
    return data?.data || [];
  }

  /**
   * Obtiene la historia médica completa de una persona
   */
  static async obtenerHistoriaMedica(personaId: string): Promise<HistoriaMedicaCompleta | null> {
    try {
      const { data, error } = await supabase
        .rpc('api_obtener_historia_medica', {
          p_persona_id: personaId
        });

      if (error) {
        console.error('Error al obtener historia médica:', error);
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.message || 'Error desconocido');
      }

      return data.data || null;
    } catch (error) {
      console.error('HistoriaMedicaService.obtenerHistoriaMedica error:', error);
      throw error;
    }
  }

  /**
   * Guarda la historia médica completa (crea o actualiza)
   */
  static async guardarHistoriaMedica(
    personaId: string,
    data: Partial<HistoriaMedicaCompleta>
  ): Promise<{ historia_id: string }> {
    try {
      // Preparar datos para enviar
      const payload = {
        fecha_llenado: data.cabecera?.fecha_llenado || new Date().toISOString().split('T')[0],
        lugar_nacimiento: data.cabecera?.lugar_nacimiento || '',
        estatura_cm: data.cabecera?.estatura_cm?.toString() || '',
        peso_kg: data.cabecera?.peso_kg?.toString() || '',
        seguro_medico: data.cabecera?.seguro_medico || '',
        numero_poliza: data.cabecera?.numero_poliza || '',
        medico_cabecera: data.cabecera?.medico_cabecera || '',
        telefono_medico: data.cabecera?.telefono_medico || '',
        hospital_preferencia: data.cabecera?.hospital_preferencia || '',
        observaciones_generales: data.cabecera?.observaciones_generales || '',
        condiciones: data.condiciones || [],
        alergias: data.alergias || [],
        medicamentos: data.medicamentos || [],
        vacunas: data.vacunas || []
      };

      const { data: result, error } = await supabase
        .rpc('api_guardar_historia_medica', {
          p_persona_id: personaId,
          p_data: payload
        });

      if (error) {
        console.error('Error al guardar historia médica:', error);
        throw new Error(error.message);
      }

      if (!result?.success) {
        throw new Error(result?.message || 'Error al guardar');
      }

      return result.data;
    } catch (error) {
      console.error('HistoriaMedicaService.guardarHistoriaMedica error:', error);
      throw error;
    }
  }

  /**
   * Verifica si una persona tiene historia médica registrada
   */
  static async tieneHistoriaMedica(personaId: string): Promise<{
    tiene_historia: boolean;
    stats?: HistoriaMedicaStats;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('api_tiene_historia_medica', {
          p_persona_id: personaId
        });

      if (error) {
        console.error('Error al verificar historia médica:', error);
        throw new Error(error.message);
      }

      return {
        tiene_historia: data?.tiene_historia || false,
        stats: data?.stats || undefined
      };
    } catch (error) {
      console.error('HistoriaMedicaService.tieneHistoriaMedica error:', error);
      throw error;
    }
  }

  /**
   * Obtiene alergias críticas para casos de emergencia
   */
  static async obtenerAlergiasCriticas(personaId: string): Promise<Alergia[]> {
    try {
      const { data, error } = await supabase
        .rpc('api_obtener_alergias_criticas', {
          p_persona_id: personaId
        });

      if (error) {
        console.error('Error al obtener alergias críticas:', error);
        throw new Error(error.message);
      }

      return data?.data || [];
    } catch (error) {
      console.error('HistoriaMedicaService.obtenerAlergiasCriticas error:', error);
      throw error;
    }
  }

  /**
   * Limpia el borrador guardado en localStorage
   */
  static limpiarBorrador(personaId: string): void {
    localStorage.removeItem(`historia_medica_draft_${personaId}`);
  }

  /**
   * Guarda borrador en localStorage
   */
  static guardarBorrador(personaId: string, data: Partial<HistoriaMedicaCompleta>): void {
    localStorage.setItem(
      `historia_medica_draft_${personaId}`,
      JSON.stringify({
        data,
        timestamp: Date.now()
      })
    );
  }

  /**
   * Recupera borrador de localStorage
   */
  static obtenerBorrador(personaId: string): {
    data: Partial<HistoriaMedicaCompleta>;
    timestamp: number;
  } | null {
    const stored = localStorage.getItem(`historia_medica_draft_${personaId}`);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Convierte datos del formulario al formato del servicio
   */
  static fromFormData(formData: any): Partial<HistoriaMedicaCompleta> {
    return {
      cabecera: {
        persona_id: formData.personaId || '',
        fecha_llenado: formData.fechaLlenado || new Date().toISOString().split('T')[0],
        lugar_nacimiento: formData.lugarNacimiento,
        estatura_cm: formData.estaturaCm ? parseFloat(formData.estaturaCm) : undefined,
        peso_kg: formData.pesoKg ? parseFloat(formData.pesoKg) : undefined,
        seguro_medico: formData.seguroMedico,
        numero_poliza: formData.numeroPoliza,
        medico_cabecera: formData.medicoCabecera,
        telefono_medico: formData.telefonoMedico,
        hospital_preferencia: formData.hospitalPreferencia,
        observaciones_generales: formData.observacionesGenerales
      },
      condiciones: (formData.condiciones || []).map((c: any) => ({
        nombre: c.nombre,
        tipo: c.tipo || 'CONTROLADA',
        fecha_diagnostico: c.fechaDiagnostico,
        tratamiento: c.tratamiento,
        medico_tratante: c.medicoTratante,
        notas: c.notas,
        activa: c.activa !== false
      })),
      alergias: (formData.alergias || []).map((a: any) => ({
        nombre: a.nombre,
        tipo: a.tipo || 'OTRA',
        severidad: a.severidad || 'LEVE',
        reaccion: a.reaccion,
        tratamiento_emergencia: a.tratamientoEmergencia
      })),
      medicamentos: (formData.medicamentos || []).map((m: any) => ({
        nombre: m.nombre,
        dosis: m.dosis,
        frecuencia: m.frecuencia,
        via_administracion: m.viaAdministracion,
        fecha_inicio: m.fechaInicio,
        fecha_fin: m.fechaFin,
        motivo: m.motivo,
        prescrito_por: m.prescritoPor,
        activo: m.activo !== false
      })),
      vacunas: (formData.vacunas || []).map((v: any) => ({
        nombre: v.nombre,
        fecha_aplicacion: v.fechaAplicacion,
        dosis_numero: v.dosisNumero ? parseInt(v.dosisNumero) : undefined,
        lote: v.lote,
        establecimiento: v.establecimiento,
        proxima_dosis: v.proximaDosis
      }))
    };
  }

  /**
   * Convierte datos del servicio al formato del formulario
   */
  static toFormData(data: HistoriaMedicaCompleta): any {
    return {
      personaId: data.cabecera.persona_id,
      fechaLlenado: data.cabecera.fecha_llenado,
      lugarNacimiento: data.cabecera.lugar_nacimiento || '',
      estaturaCm: data.cabecera.estatura_cm?.toString() || '',
      pesoKg: data.cabecera.peso_kg?.toString() || '',
      seguroMedico: data.cabecera.seguro_medico || '',
      numeroPoliza: data.cabecera.numero_poliza || '',
      medicoCabecera: data.cabecera.medico_cabecera || '',
      telefonoMedico: data.cabecera.telefono_medico || '',
      hospitalPreferencia: data.cabecera.hospital_preferencia || '',
      observacionesGenerales: data.cabecera.observaciones_generales || '',
      condiciones: data.condiciones.map(c => ({
        nombre: c.nombre,
        tipo: c.tipo,
        fechaDiagnostico: c.fecha_diagnostico || '',
        tratamiento: c.tratamiento || '',
        medicoTratante: c.medico_tratante || '',
        notas: c.notas || '',
        activa: c.activa
      })),
      alergias: data.alergias.map(a => ({
        nombre: a.nombre,
        tipo: a.tipo,
        severidad: a.severidad,
        reaccion: a.reaccion || '',
        tratamientoEmergencia: a.tratamiento_emergencia || ''
      })),
      medicamentos: data.medicamentos.map(m => ({
        nombre: m.nombre,
        dosis: m.dosis,
        frecuencia: m.frecuencia,
        viaAdministracion: m.via_administracion || '',
        fechaInicio: m.fecha_inicio || '',
        fechaFin: m.fecha_fin || '',
        motivo: m.motivo || '',
        prescritoPor: m.prescrito_por || '',
        activo: m.activo
      })),
      vacunas: data.vacunas.map(v => ({
        nombre: v.nombre,
        fechaAplicacion: v.fecha_aplicacion || '',
        dosisNumero: v.dosis_numero?.toString() || '',
        lote: v.lote || '',
        establecimiento: v.establecimiento || '',
        proximaDosis: v.proxima_dosis || ''
      }))
    };
  }
}

export default HistoriaMedicaService;
