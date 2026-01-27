/**
 * Actividades al Aire Libre Service
 * Maneja campamentos, caminatas, excursiones con programas completos
 */

import { supabase } from '@/lib/supabase';

// ============= TIPOS =============

export type TipoActividadExterior = 'CAMPAMENTO' | 'CAMINATA' | 'EXCURSION' | 'TALLER_EXTERIOR' | 'VISITA' | 'SERVICIO_COMUNITARIO';

export type EstadoActividadExterior = 'BORRADOR' | 'PLANIFICACION' | 'ABIERTA_INSCRIPCION' | 'INSCRIPCION_CERRADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA' | 'POSTERGADA';

export type TipoProgramaExterior = 'DIA' | 'NOCHE';

export type EstadoAutorizacionExterior = 'NO_ENVIADA' | 'ENVIADA' | 'RECIBIDA' | 'VENCIDA';

// ============= INTERFACES =============

export interface ActividadExteriorResumen {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoActividadExterior;
  estado: EstadoActividadExterior;
  fecha_inicio: string;
  fecha_fin: string;
  ubicacion: string;
  lugar_detalle?: string;
  costo_por_participante: number;
  max_participantes?: number;
  participantes_count: number;
  staff_count: number;
  tiene_programa: boolean;
  presupuesto_total: number;
}

export interface ActividadExteriorCompleta extends ActividadExteriorResumen {
  descripcion?: string;
  hora_concentracion?: string;
  punto_encuentro?: string;
  coordenadas_lat?: number;
  coordenadas_lng?: number;
  objetivos?: string[];
  requisitos_participacion?: string[];
  equipo_necesario?: string[];
  informacion_padres?: string;
  contacto_emergencia?: string;
  notas_internas?: string;
  programas: ProgramaActividad[];
  participantes: ParticipanteActividad[];
  staff: StaffActividad[];
  presupuesto: ItemPresupuestoActividad[];
  documentos: DocumentoActividad[];
  menu: ItemMenuActividad[];
  puntajes: PuntajeActividad[];
}

export interface NuevaActividadExterior {
  nombre: string;
  descripcion?: string;
  tipo: TipoActividadExterior;
  estado?: EstadoActividadExterior;
  fecha_inicio: string;
  fecha_fin: string;
  hora_concentracion?: string;
  punto_encuentro?: string;
  ubicacion: string;
  lugar_detalle?: string;
  coordenadas_lat?: number;
  coordenadas_lng?: number;
  costo_por_participante?: number;
  max_participantes?: number;
  objetivos?: string[];
  requisitos_participacion?: string[];
  equipo_necesario?: string[];
  informacion_padres?: string;
  contacto_emergencia?: string;
  notas_internas?: string;
}

export interface ProgramaActividad {
  id: string;
  dia_numero: number;
  fecha: string;
  tipo: TipoProgramaExterior;
  tema_del_dia?: string;
  bloques: BloqueProgramaActividad[];
}

export interface BloqueProgramaActividad {
  id?: string;
  hora_inicio: string;
  hora_fin: string;
  actividad: string;
  descripcion?: string;
  responsable_id?: string;
  materiales?: string[];
  notas?: string;
  tipo_juego?: string;
  puntaje_posible?: number;
}

export interface NuevoBloquePrograma {
  hora_inicio: string;
  hora_fin: string;
  actividad: string;
  descripcion?: string;
  responsable_id?: string;
  materiales?: string[];
  notas?: string;
  tipo_juego?: string;
  puntaje_posible?: number;
}

export interface ParticipanteActividad {
  id: string;
  scout_id: string;
  scout_nombre: string;
  scout_codigo: string;
  patrulla_id?: string;
  patrulla_nombre?: string;
  confirmado: boolean;
  autorizacion_estado: EstadoAutorizacionExterior;
  monto_pagado: number;
  pagado_completo: boolean;
  notas_medicas?: string;
}

export interface StaffActividad {
  id: string;
  dirigente_id: string;
  dirigente_nombre: string;
  rol: string;
  responsabilidades?: string[];
  confirmado: boolean;
}

export interface ItemPresupuestoActividad {
  id: string;
  categoria: string;
  concepto: string;
  descripcion?: string;
  cantidad: number;
  precio_unitario: number;
  monto_total: number;
  proveedor?: string;
  pagado: boolean;
  monto_pagado: number;
}

export interface NuevoItemPresupuestoActividad {
  categoria: string;
  concepto: string;
  descripcion?: string;
  cantidad?: number;
  precio_unitario?: number;
  proveedor?: string;
}

export interface DocumentoActividad {
  id: string;
  tipo_documento: string;
  nombre: string;
  url_archivo?: string;
  descripcion?: string;
  fecha_vencimiento?: string;
}

export interface ItemMenuActividad {
  id: string;
  dia_numero: number;
  comida: 'DESAYUNO' | 'ALMUERZO' | 'CENA' | 'REFRIGERIO';
  descripcion: string;
  costo_estimado?: number;
  responsable_cocina?: string;
}

export interface NuevoItemMenuActividad {
  dia_numero: number;
  comida: 'DESAYUNO' | 'ALMUERZO' | 'CENA' | 'REFRIGERIO';
  descripcion: string;
  costo_estimado?: number;
  responsable_cocina?: string;
}

export interface PuntajeActividad {
  id: string;
  patrulla_id: string;
  patrulla_nombre: string;
  bloque_id?: string;
  puntaje: number;
  motivo?: string;
  juego_descripcion?: string;
}

export interface RankingPatrullaActividad {
  patrulla_id: string;
  patrulla_nombre: string;
  puntaje_total: number;
  cantidad_puntajes: number;
}

export interface ResumenActividadExterior {
  actividad_id: string;
  codigo: string;
  nombre: string;
  tipo: TipoActividadExterior;
  estado: EstadoActividadExterior;
  fecha_inicio: string;
  fecha_fin: string;
  total_participantes: number;
  participantes_confirmados: number;
  autorizaciones_pendientes: number;
  pagos_completados: number;
  total_recaudado: number;
  costo_por_participante: number;
  presupuesto_total: number;
  total_staff: number;
}

// ============= CONSTANTES =============

export const TIPOS_ACTIVIDAD_EXTERIOR: { value: TipoActividadExterior; label: string; emoji: string }[] = [
  { value: 'CAMPAMENTO', label: 'Campamento', emoji: '🏕️' },
  { value: 'CAMINATA', label: 'Caminata', emoji: '🥾' },
  { value: 'EXCURSION', label: 'Excursión', emoji: '🌄' },
  { value: 'TALLER_EXTERIOR', label: 'Taller al Aire Libre', emoji: '🌳' },
  { value: 'VISITA', label: 'Visita', emoji: '🏛️' },
  { value: 'SERVICIO_COMUNITARIO', label: 'Servicio Comunitario', emoji: '🤝' },
];

export const ESTADOS_ACTIVIDAD_EXTERIOR: { value: EstadoActividadExterior; label: string; color: string }[] = [
  { value: 'BORRADOR', label: 'Borrador', color: 'gray' },
  { value: 'PLANIFICACION', label: 'En Planificación', color: 'blue' },
  { value: 'ABIERTA_INSCRIPCION', label: 'Inscripciones Abiertas', color: 'green' },
  { value: 'INSCRIPCION_CERRADA', label: 'Inscripciones Cerradas', color: 'yellow' },
  { value: 'EN_CURSO', label: 'En Curso', color: 'purple' },
  { value: 'COMPLETADA', label: 'Completada', color: 'emerald' },
  { value: 'CANCELADA', label: 'Cancelada', color: 'red' },
  { value: 'POSTERGADA', label: 'Postergada', color: 'orange' },
];

export const CATEGORIAS_PRESUPUESTO_ACTIVIDAD = [
  { value: 'TRANSPORTE', label: 'Transporte', emoji: '🚌' },
  { value: 'ALIMENTACION', label: 'Alimentación', emoji: '🍽️' },
  { value: 'ALOJAMIENTO', label: 'Alojamiento', emoji: '🏨' },
  { value: 'MATERIALES', label: 'Materiales', emoji: '📦' },
  { value: 'ALQUILER', label: 'Alquiler', emoji: '🎪' },
  { value: 'SEGURO', label: 'Seguro', emoji: '🛡️' },
  { value: 'OTROS', label: 'Otros', emoji: '📋' },
];

export const TIPOS_COMIDA_ACTIVIDAD = [
  { value: 'DESAYUNO', label: 'Desayuno', emoji: '🍳' },
  { value: 'ALMUERZO', label: 'Almuerzo', emoji: '🍽️' },
  { value: 'CENA', label: 'Cena', emoji: '🍲' },
  { value: 'REFRIGERIO', label: 'Refrigerio', emoji: '🍎' },
];

// ============= SERVICE CLASS =============

export class ActividadesExteriorService {
  /**
   * Lista actividades con filtros
   */
  static async listarActividades(filtros: {
    tipo?: TipoActividadExterior;
    estado?: EstadoActividadExterior;
    anio?: number;
    limite?: number;
    offset?: number;
  } = {}): Promise<{ actividades: ActividadExteriorResumen[]; total: number }> {
    const { data, error } = await supabase.rpc('api_listar_actividades', {
      p_tipo: filtros.tipo || null,
      p_estado: filtros.estado || null,
      p_anio: filtros.anio || null,
      p_limite: filtros.limite || 20,
      p_offset: filtros.offset || 0,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar actividades');

    return {
      actividades: data.data,
      total: data.total,
    };
  }

  /**
   * Obtiene una actividad completa con todos sus datos
   */
  static async obtenerActividad(actividadId: string): Promise<ActividadExteriorCompleta> {
    const { data, error } = await supabase.rpc('api_obtener_actividad', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener actividad');

    return data.data;
  }

  /**
   * Crea una nueva actividad
   */
  static async crearActividad(actividad: NuevaActividadExterior): Promise<{ 
    actividad_id: string; 
    codigo: string;
  }> {
    const { data, error } = await supabase.rpc('api_crear_actividad', {
      p_datos: actividad,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al crear actividad');

    return {
      actividad_id: data.actividad_id,
      codigo: data.codigo,
    };
  }

  /**
   * Actualiza una actividad existente
   */
  static async actualizarActividad(
    actividadId: string, 
    updates: Partial<NuevaActividadExterior>
  ): Promise<void> {
    const { error } = await supabase
      .from('actividades_aire_libre')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', actividadId);

    if (error) throw error;
  }

  /**
   * Agrega un programa a la actividad
   */
  static async agregarPrograma(
    actividadId: string,
    diaNumero: number,
    fecha: string,
    tipo: TipoProgramaExterior,
    temaDelDia?: string,
    bloques: NuevoBloquePrograma[] = []
  ): Promise<{ programa_id: string }> {
    const { data, error } = await supabase.rpc('api_agregar_programa', {
      p_actividad_id: actividadId,
      p_dia_numero: diaNumero,
      p_fecha: fecha,
      p_tipo: tipo,
      p_tema_del_dia: temaDelDia || null,
      p_bloques: bloques,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al agregar programa');

    return { programa_id: data.programa_id };
  }

  /**
   * Inscribe participantes a la actividad
   */
  static async inscribirParticipantes(
    actividadId: string,
    scoutIds: string[]
  ): Promise<{ inscritos: number; ya_inscritos: number }> {
    const { data, error } = await supabase.rpc('api_inscribir_participantes', {
      p_actividad_id: actividadId,
      p_scouts_ids: scoutIds,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al inscribir participantes');

    return {
      inscritos: data.inscritos,
      ya_inscritos: data.ya_inscritos,
    };
  }

  /**
   * Registra puntaje de patrulla
   */
  static async registrarPuntaje(
    actividadId: string,
    patrullaId: string,
    puntaje: number,
    motivo?: string,
    bloqueId?: string,
    registradoPor?: string
  ): Promise<{ puntaje_id: string }> {
    const { data, error } = await supabase.rpc('api_registrar_puntaje', {
      p_actividad_id: actividadId,
      p_patrulla_id: patrullaId,
      p_bloque_id: bloqueId || null,
      p_puntaje: puntaje,
      p_motivo: motivo || null,
      p_registrado_por: registradoPor || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al registrar puntaje');

    return { puntaje_id: data.puntaje_id };
  }

  /**
   * Obtiene ranking de patrullas
   */
  static async obtenerRanking(actividadId: string): Promise<RankingPatrullaActividad[]> {
    const { data, error } = await supabase.rpc('api_ranking_patrullas_actividad', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener ranking');

    return data.data;
  }

  /**
   * Agrega ítem al presupuesto
   */
  static async agregarPresupuestoItem(
    actividadId: string,
    item: NuevoItemPresupuestoActividad
  ): Promise<{ item_id: string }> {
    const { data, error } = await supabase.rpc('api_agregar_presupuesto_item', {
      p_actividad_id: actividadId,
      p_categoria: item.categoria,
      p_concepto: item.concepto,
      p_descripcion: item.descripcion || null,
      p_cantidad: item.cantidad || 1,
      p_precio_unitario: item.precio_unitario || 0,
      p_proveedor: item.proveedor || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al agregar ítem');

    return { item_id: data.item_id };
  }

  /**
   * Actualiza estado de autorización
   */
  static async actualizarAutorizacion(
    participanteId: string,
    estado: EstadoAutorizacionExterior,
    fechaRecepcion?: string
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_autorizacion', {
      p_participante_id: participanteId,
      p_estado: estado,
      p_fecha_recepcion: fechaRecepcion || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar autorización');
  }

  /**
   * Agrega ítem al menú
   */
  static async agregarMenu(
    actividadId: string,
    item: NuevoItemMenuActividad
  ): Promise<{ menu_id: string }> {
    const { data, error } = await supabase.rpc('api_agregar_menu', {
      p_actividad_id: actividadId,
      p_dia_numero: item.dia_numero,
      p_comida: item.comida,
      p_descripcion: item.descripcion,
      p_costo_estimado: item.costo_estimado || null,
      p_responsable_cocina: item.responsable_cocina || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al agregar menú');

    return { menu_id: data.menu_id };
  }

  /**
   * Obtiene resumen ejecutivo
   */
  static async obtenerResumen(actividadId: string): Promise<ResumenActividadExterior> {
    const { data, error } = await supabase.rpc('api_resumen_actividad', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener resumen');

    return data.data;
  }

  /**
   * Sube documento de actividad
   */
  static async subirDocumento(
    actividadId: string,
    file: File,
    tipoDocumento: string,
    descripcion?: string,
    fechaVencimiento?: string
  ): Promise<{ url: string; id: string }> {
    // Subir archivo
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = `actividades/${actividadId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Obtener URL
    const { data: urlData } = supabase.storage
      .from('documentos')
      .getPublicUrl(filePath);

    // Registrar en BD
    const { data, error } = await supabase
      .from('documentos_actividad')
      .insert({
        actividad_id: actividadId,
        tipo_documento: tipoDocumento,
        nombre: file.name,
        url_archivo: urlData.publicUrl,
        descripcion: descripcion || null,
        fecha_vencimiento: fechaVencimiento || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    return { url: urlData.publicUrl, id: data.id };
  }

  /**
   * Registra pago de participante
   */
  static async registrarPago(
    participanteId: string,
    monto: number
  ): Promise<void> {
    // Obtener monto actual
    const { data: participante, error: fetchError } = await supabase
      .from('participantes_actividad')
      .select('monto_pagado, actividad_id')
      .eq('id', participanteId)
      .single();

    if (fetchError) throw fetchError;

    // Obtener costo de la actividad
    const { data: actividad, error: actError } = await supabase
      .from('actividades_aire_libre')
      .select('costo_por_participante')
      .eq('id', participante.actividad_id)
      .single();

    if (actError) throw actError;

    const nuevoMonto = (participante.monto_pagado || 0) + monto;
    const pagadoCompleto = nuevoMonto >= (actividad.costo_por_participante || 0);

    // Actualizar
    const { error } = await supabase
      .from('participantes_actividad')
      .update({
        monto_pagado: nuevoMonto,
        pagado_completo: pagadoCompleto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', participanteId);

    if (error) throw error;
  }

  /**
   * Confirma participante
   */
  static async confirmarParticipante(
    participanteId: string,
    confirmado: boolean = true
  ): Promise<void> {
    const { error } = await supabase
      .from('participantes_actividad')
      .update({
        confirmado,
        updated_at: new Date().toISOString(),
      })
      .eq('id', participanteId);

    if (error) throw error;
  }

  /**
   * Agrega staff a la actividad
   */
  static async agregarStaff(
    actividadId: string,
    dirigenteId: string,
    rol: string,
    responsabilidades?: string[]
  ): Promise<{ staff_id: string }> {
    const { data, error } = await supabase
      .from('staff_actividad')
      .insert({
        actividad_id: actividadId,
        dirigente_id: dirigenteId,
        rol,
        responsabilidades: responsabilidades || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    return { staff_id: data.id };
  }

  // ============= MÉTODOS DE ELIMINACIÓN =============

  /**
   * Elimina una actividad completa
   */
  static async eliminarActividad(actividadId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_actividad', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar actividad');
  }

  /**
   * Elimina un programa
   */
  static async eliminarPrograma(programaId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_programa', {
      p_programa_id: programaId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar programa');
  }

  /**
   * Elimina un participante de la actividad
   */
  static async eliminarParticipante(participanteId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_participante', {
      p_participante_id: participanteId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar participante');
  }

  /**
   * Elimina un ítem del presupuesto
   */
  static async eliminarPresupuestoItem(itemId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_presupuesto_item', {
      p_item_id: itemId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar ítem');
  }

  /**
   * Elimina un ítem del menú
   */
  static async eliminarMenu(menuId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_menu', {
      p_menu_id: menuId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar menú');
  }

  /**
   * Elimina un puntaje
   */
  static async eliminarPuntaje(puntajeId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_puntaje', {
      p_puntaje_id: puntajeId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar puntaje');
  }

  /**
   * Elimina un miembro del staff
   */
  static async eliminarStaff(staffId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_staff', {
      p_staff_id: staffId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar staff');
  }

  /**
   * Elimina un documento de la actividad
   */
  static async eliminarDocumento(documentoId: string): Promise<void> {
    // Obtener URL para eliminar del storage
    const { data: documento, error: fetchError } = await supabase
      .from('documentos_actividad')
      .select('url_archivo')
      .eq('id', documentoId)
      .single();

    if (fetchError) throw fetchError;

    // Eliminar de la BD
    const { error } = await supabase
      .from('documentos_actividad')
      .delete()
      .eq('id', documentoId);

    if (error) throw error;

    // Eliminar archivo del storage
    if (documento?.url_archivo) {
      try {
        const urlPath = new URL(documento.url_archivo).pathname;
        const storagePath = urlPath.split('/documentos/')[1];
        if (storagePath) {
          await supabase.storage.from('documentos').remove([storagePath]);
        }
      } catch (e) {
        console.warn('Error eliminando archivo de storage:', e);
      }
    }
  }

  // ============= MÉTODOS DE ACTUALIZACIÓN =============

  /**
   * Actualiza actividad vía RPC
   */
  static async actualizarActividadRPC(
    actividadId: string,
    datos: Partial<NuevaActividadExterior>
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_actividad', {
      p_actividad_id: actividadId,
      p_datos: datos,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar actividad');
  }

  /**
   * Actualiza un programa
   */
  static async actualizarPrograma(
    programaId: string,
    datos: {
      nombre?: string;
      tipo?: TipoProgramaExterior;
      fecha?: string;
      descripcion?: string;
    }
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_programa', {
      p_programa_id: programaId,
      p_datos: datos,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar programa');
  }

  /**
   * Actualiza un ítem del presupuesto
   */
  static async actualizarPresupuestoItem(
    itemId: string,
    datos: Partial<NuevoItemPresupuestoActividad> & { comprado?: boolean }
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_presupuesto_item', {
      p_item_id: itemId,
      p_datos: datos,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar ítem');
  }
}

export default ActividadesExteriorService;
