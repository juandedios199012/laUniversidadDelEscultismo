import { supabase } from '../lib/supabase';
import type { Scout } from '../lib/supabase';

// ================================================================
// TIPOS
// ================================================================

export interface HijoInfo {
  scout_id: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  foto_url: string | null;
  fecha_nacimiento: string | null;
  codigo_asociado: string | null;
  rama_actual: string;
  estado: string;
  parentesco: string;
}

/** Actividad al aire libre de un hijo, con estado del Anexo 4 y del pago. */
export interface ActividadHijo {
  participante_id: string;
  scout_id: string;
  scout_nombre: string;
  scout_dni: string | null;
  scout_sexo: string | null;
  scout_codigo_asociado: string | null;
  scout_rama: string | null;
  /** Familiar que corresponde al usuario autenticado (prellena el Anexo 4). */
  apoderado_nombre: string | null;
  apoderado_dni: string | null;
  apoderado_parentesco: string | null;
  actividad_id: string;
  nombre: string;
  tipo: string;
  estado: string;
  lugar: string | null;
  punto_encuentro: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  hora_concentracion: string | null;
  hora_fin: string | null;
  costo_por_participante: number;
  fecha_limite_pago: string | null;
  equipamiento_obligatorio: string | null;
  equipamiento_opcional: string | null;
  recomendaciones: string | null;
  responsable: string | null;
  staff: { nombre: string; rol: string }[];
  vigente: boolean;
  estado_autorizacion: string | null;
  fecha_autorizacion: string | null;
  autorizacion_aceptada_at: string | null;
  autorizacion_aceptada_nombre: string | null;
  autorizacion_aceptada_dni: string | null;
  autorizacion_declaraciones: string[] | null;
  monto_a_pagar: number;
  monto_pagado: number;
  pagado_completo: boolean;
  metodo_pago: string | null;
  fecha_pago: string | null;
  comprobante_pago: string | null;
  pago_origen: string | null;
}

export type MedioPagoPadre = 'EFECTIVO' | 'YAPE' | 'PLIN';

export const ESTADOS_AUTORIZACION_OK = ['FIRMADA', 'EXONERADA'];

export function autorizacionPendiente(a: ActividadHijo): boolean {
  return !ESTADOS_AUTORIZACION_OK.includes(a.estado_autorizacion ?? 'PENDIENTE');
}

export function pagoPendiente(a: ActividadHijo): boolean {
  return !a.pagado_completo && a.monto_a_pagar - a.monto_pagado > 0;
}

/** Campos que un padre puede editar de su hijo — sin rama/patrulla/código/estado (paso "Scout", administrativo). */
export interface ActualizarHijoData {
  nombres?: string;
  apellidos?: string;
  fecha_nacimiento?: string;
  tipo_documento?: string;
  numero_documento?: string;
  sexo?: 'MASCULINO' | 'FEMENINO';
  celular?: string;
  celular_secundario?: string;
  telefono?: string;
  correo?: string;
  correo_secundario?: string;
  correo_institucional?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
  direccion_completa?: string;
  ubicacion_latitud?: number | null;
  ubicacion_longitud?: number | null;
  codigo_postal?: string;
  centro_estudio?: string;
  anio_estudios?: string;
  ocupacion?: string;
  centro_laboral?: string;
  religion?: string;
  estatura_cm?: number | null;
  peso_kg?: number | null;
  grupo_sanguineo?: string;
  factor_sanguineo?: string;
  seguro_medico?: string;
  tipo_discapacidad?: string;
  carnet_conadis?: string;
  descripcion_discapacidad?: string;
  condiciones?: Array<{ condicion?: string; fecha_atencion?: string }>;
  alergias?: Array<{ alergia?: string; mencionar?: string }>;
  medicamentos?: Array<{ medicamento?: string; dosis?: string; frecuencia?: string; activo?: boolean; fecha_inicio_duracion?: string }>;
  vacunas?: Array<{ vacuna?: string; fecha_ultima_dosis?: string }>;
  familiares?: Array<{
    id?: string;
    nombres: string;
    apellidos: string;
    sexo?: string;
    tipo_documento?: string;
    numero_documento?: string;
    parentesco: string;
    celular?: string;
    correo?: string;
    profesion?: string;
    centro_laboral?: string;
    cargo?: string;
    usar_direccion_scout?: boolean;
    direccion?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    es_contacto_emergencia?: boolean;
    es_apoderado?: boolean;
  }>;
}

// ================================================================
// SERVICIO
// ================================================================

export class PortalPadresService {
  /**
   * Obtener lista de scouts (hijos) vinculados al usuario autenticado.
   * La función SQL valida que solo se devuelvan scouts cuyo familiar
   * tiene el mismo correo que el usuario autenticado (SECURITY DEFINER).
   */
  static async getMisHijos(
    userId: string
  ): Promise<{ data: HijoInfo[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc(
        'api_portal_padres_mis_hijos',
        { p_user_id: userId }
      );

      if (error) {
        console.error('❌ Error al obtener mis hijos:', error);
        return { data: null, error: error.message };
      }

      if (!data?.success) {
        return { data: null, error: data?.error || 'Error al obtener datos' };
      }

      const hijos: HijoInfo[] = Array.isArray(data.data) ? data.data : [];
      return { data: hijos, error: null };
    } catch (err) {
      console.error('❌ Error inesperado en PortalPadresService:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Error desconocido',
      };
    }
  }

  /**
   * Obtiene el registro completo de un hijo (mismo shape que usa el
   * wizard de dirigentes) para precargar el diálogo de edición completa.
   * La función SQL verifica que el scout pertenezca al usuario autenticado.
   */
  static async getHijoCompleto(scoutId: string): Promise<Scout | null> {
    try {
      const { data, error } = await supabase.rpc('api_portal_padres_obtener_hijo_completo', {
        p_scout_id: scoutId,
      });

      if (error || !data?.success) {
        console.error('❌ Error al obtener hijo completo:', error ?? data?.errors);
        return null;
      }

      return data.data ?? null;
    } catch (err) {
      console.error('❌ Error inesperado obteniendo hijo completo:', err);
      return null;
    }
  }

  /**
   * Actualiza los datos de un hijo (Personal, Contacto, Familiares,
   * Educación, Religión, Salud). Deliberadamente NO acepta rama_actual/
   * codigo_asociado/fecha_ingreso/estado — esos son administrativos
   * (paso "Scout"), y quedan fuera del tipo a propósito para que sea
   * imposible mandarlos desde este formulario. La función SQL además
   * verifica que el scout pertenezca al usuario autenticado antes de
   * guardar nada.
   */
  static async actualizarHijo(
    scoutId: string,
    updates: ActualizarHijoData,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('api_portal_padres_actualizar_hijo', {
        p_scout_id: scoutId,
        p_data: updates,
      });

      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Error al guardar los cambios' };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Aire Libre: Anexo 4 (ACEPTO) y pago
  // ──────────────────────────────────────────────────────────────

  /** Actividades de mis hijos. Sin scoutId → todos los hijos del usuario. */
  static async getActividadesHijos(
    scoutId?: string,
  ): Promise<{ data: ActividadHijo[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('api_portal_padres_actividades_hijos', {
        p_scout_id: scoutId ?? null,
      });

      if (error) return { data: null, error: error.message };
      if (!data?.success) return { data: null, error: data?.error || 'Error al obtener actividades' };

      const actividades: ActividadHijo[] = (Array.isArray(data.data) ? data.data : []).map(
        (a: ActividadHijo) => ({
          ...a,
          monto_a_pagar: Number(a.monto_a_pagar) || 0,
          monto_pagado: Number(a.monto_pagado) || 0,
          costo_por_participante: Number(a.costo_por_participante) || 0,
          staff: Array.isArray(a.staff) ? a.staff : [],
        }),
      );
      return { data: actividades, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }

  /** Botón ACEPTO del Anexo 4: marca la autorización como FIRMADA. */
  static async aceptarAutorizacion(
    participanteId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('api_portal_padres_aceptar_autorizacion', {
      p_participante_id: participanteId,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error || 'No se pudo registrar la autorización' };
    return { success: true };
  }

  /**
   * Sube el voucher de Yape/Plin a vouchers-pago/portal/{scoutId}/
   * (la policy de Storage valida que el scout sea hijo del usuario).
   */
  static async subirVoucher(
    scoutId: string,
    participanteId: string,
    file: File,
  ): Promise<{ url: string; nombre: string }> {
    const ext = file.name.split('.').pop();
    const filePath = `vouchers-pago/portal/${scoutId}/pago_${participanteId}_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('finanzas')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from('finanzas').getPublicUrl(filePath);
    return { url: publicUrl, nombre: file.name };
  }

  /** Registra el pago (misma lógica que el registro del administrador). */
  static async registrarPago(
    participanteId: string,
    pago: {
      monto: number;
      metodo_pago: MedioPagoPadre;
      comprobante_pago?: string;
      comprobante_nombre?: string;
    },
  ): Promise<{ success: boolean; pagado_completo?: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('api_portal_padres_registrar_pago', {
      p_participante_id: participanteId,
      p_datos: pago,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error || 'No se pudo registrar el pago' };
    return { success: true, pagado_completo: data.pagado_completo };
  }
}

export default PortalPadresService;
