/**
 * Actividades al Aire Libre Service
 * Maneja campamentos, caminatas, excursiones con programas completos
 */

import { supabase } from '@/lib/supabase';

// ============= TIPOS =============

export type TipoActividadExterior = 'CAMPAMENTO' | 'CAMINATA' | 'EXCURSION' | 'TALLER_EXTERIOR' | 'VISITA' | 'SERVICIO_COMUNITARIO';

export type EstadoActividadExterior = 'BORRADOR' | 'PLANIFICACION' | 'ABIERTA_INSCRIPCION' | 'INSCRIPCION_CERRADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA' | 'POSTERGADA';

export type TipoProgramaExterior = 'DIURNO' | 'NOCTURNO';

export type EstadoAutorizacionExterior = 'PENDIENTE' | 'ENVIADA' | 'RECIBIDA' | 'FIRMADA' | 'RECHAZADA' | 'EXONERADA';

// Interface para roles de staff (viene de BD)
export interface RolStaff {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  requiere_certificacion: boolean;
}

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
  coordenadas_gps?: string;
  cupo_minimo?: number;
  ramas_participantes?: string[];
  equipamiento_obligatorio?: string;
  equipamiento_opcional?: string;
  recomendaciones?: string;
  incluye_alimentacion?: boolean;
  incluye_transporte?: boolean;
  fecha_limite_inscripcion?: string;
  fecha_limite_pago?: string;
  notas_internas?: string;
  programas: ProgramaActividad[];
  participantes: ParticipanteActividad[];
  staff: StaffActividad[];
  presupuesto: ItemPresupuestoActividad[];
  documentos: DocumentoActividad[];
  menu: ItemMenuActividad[];
  puntajes: PuntajeActividad[];
  compras: CompraActividad[];
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
  coordenadas_gps?: string;
  costo_por_participante?: number;
  max_participantes?: number;
  cupo_minimo?: number;
  equipamiento_obligatorio?: string;
  equipamiento_opcional?: string;
  recomendaciones?: string;
}

export interface ProgramaActividad {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoProgramaExterior;
  fecha: string;
  hora_inicio?: string;
  hora_fin?: string;
  orden?: number;
  responsable_id?: string;
  bloques: BloqueProgramaActividad[];
}

export interface BloqueProgramaActividad {
  id?: string;
  nombre: string;
  descripcion?: string;
  tipo_bloque?: string;
  hora_inicio: string;
  hora_fin: string;
  responsable_id?: string;
  materiales_necesarios?: string;
  orden?: number;
  otorga_puntaje?: boolean;
  puntaje_maximo?: number;
}

export interface NuevoBloquePrograma {
  nombre: string;
  descripcion?: string;
  tipo_bloque?: string;
  hora_inicio: string;
  hora_fin: string;
  responsable_id?: string;
  materiales_necesarios?: string;
  orden?: number;
  otorga_puntaje?: boolean;
  puntaje_maximo?: number;
}

export interface ParticipanteActividad {
  id: string;
  scout_id: string;
  scout_nombre: string;
  scout_codigo: string;
  estado_inscripcion?: string;
  confirmado: boolean;
  estado_autorizacion: EstadoAutorizacionExterior;
  fecha_autorizacion?: string;
  monto_a_pagar?: number;
  monto_pagado: number;
  pagado_completo: boolean;
  restricciones_alimentarias?: string;
  observaciones?: string;
}

export interface StaffActividad {
  id: string;
  persona_id: string;
  nombre: string;
  rol: string;
  responsabilidades?: string;
  confirmado: boolean;
}

export interface ItemPresupuestoActividad {
  id: string;
  categoria: string;
  subcategoria?: string;
  concepto: string;
  descripcion?: string;
  cantidad: number;
  unidad?: string;
  precio_unitario: number;
  monto_total: number;
  monto_ejecutado?: number;
  proveedor?: string;
  orden?: number;
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
  tipo: string;
  nombre: string;
  descripcion?: string;
  url_archivo?: string;
  nombre_archivo?: string;
  estado?: string;
  version?: number;
}

export interface ItemMenuActividad {
  id: string;
  dia: number;
  tipo_comida: 'DESAYUNO' | 'ALMUERZO' | 'CENA' | 'REFRIGERIO';
  nombre_plato: string;
  descripcion?: string;
  responsable_cocina?: string;
  patrulla_cocina_id?: string;
  ingredientes?: object;
  consideraciones_dieteticas?: string;
}

export interface NuevoItemMenuActividad {
  dia: number;
  tipo_comida: 'DESAYUNO' | 'ALMUERZO' | 'CENA' | 'REFRIGERIO';
  nombre_plato: string;
  descripcion?: string;
  responsable_cocina?: string;
  patrulla_cocina_id?: string;
  ingredientes?: object;
}

export interface PuntajeActividad {
  id: string;
  patrulla_id: string;
  patrulla_nombre: string;
  bloque_id?: string;
  bloque_nombre?: string;
  puntaje: number;
  observaciones?: string;
}

// ============= INTERFACES COMPRAS =============

export interface CompraActividad {
  id: string;
  concepto: string;
  descripcion?: string;
  categoria?: string;
  cantidad: number;
  precio_unitario: number;
  monto_total: number;
  proveedor?: string;
  comprobante_url?: string;
  comprobante_nombre?: string;
  tipo_comprobante?: string;
  numero_comprobante?: string;
  metodo_pago?: string;
  fecha_compra: string;
  notas?: string;
  presupuesto_item_id?: string;
  presupuesto_concepto?: string;
  created_at?: string;
}

export interface NuevaCompra {
  concepto: string;
  descripcion?: string;
  categoria?: string;
  cantidad?: number;
  precio_unitario: number;
  proveedor?: string;
  comprobante_url?: string;
  comprobante_nombre?: string;
  tipo_comprobante?: string;
  numero_comprobante?: string;
  metodo_pago?: string;
  fecha_compra?: string;
  notas?: string;
  presupuesto_item_id?: string;
}

export interface NuevoStaff {
  persona_id: string;
  rol: string;
  responsabilidades?: string;
  confirmado?: boolean;
}

export interface NuevoDocumentoActividad {
  tipo: string;
  nombre: string;
  descripcion?: string;
  url_archivo?: string;
  nombre_archivo?: string;
  mime_type?: string;
  estado?: string;
}

export interface DirigentDisponible {
  id: string;
  nombre: string;
  es_dirigente: boolean;
  cargo?: string;
  ya_asignado: boolean;
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

// Roles de staff - FALLBACK (preferir obtenerRolesStaff() desde BD)
export const ROLES_STAFF_ACTIVIDAD = [
  { value: 'JEFE_CAMPAMENTO', label: 'Jefe de Campamento', emoji: '👑' },
  { value: 'SUBJEFE_CAMPAMENTO', label: 'Subjefe de Campamento', emoji: '🎖️' },
  { value: 'DIRIGENTE', label: 'Dirigente', emoji: '⭐' },
  { value: 'APOYO', label: 'Apoyo', emoji: '🤝' },
  { value: 'COCINERO', label: 'Cocinero/a', emoji: '👨‍🍳' },
  { value: 'ENFERMERO', label: 'Enfermero/a', emoji: '🩺' },
  { value: 'TRANSPORTE', label: 'Transporte', emoji: '🚌' },
  { value: 'SEGURIDAD', label: 'Seguridad', emoji: '🛡️' },
  { value: 'TESORERO', label: 'Tesorero/a', emoji: '💰' },
  { value: 'FOTOGRAFO', label: 'Fotógrafo/a', emoji: '📸' },
  { value: 'LOGISTICA', label: 'Logística', emoji: '📦' },
];

export const TIPOS_DOCUMENTO_ACTIVIDAD = [
  { value: 'AUTORIZACION', label: 'Autorización', emoji: '📋' },
  { value: 'COMUNICADO', label: 'Comunicado', emoji: '📢' },
  { value: 'PROGRAMA', label: 'Programa', emoji: '📅' },
  { value: 'LISTA_EQUIPAJE', label: 'Lista de Equipaje', emoji: '🎒' },
  { value: 'MENU', label: 'Menú', emoji: '🍽️' },
  { value: 'PRESUPUESTO', label: 'Presupuesto', emoji: '💰' },
  { value: 'EVALUACION', label: 'Evaluación', emoji: '📝' },
  { value: 'FOTO', label: 'Foto', emoji: '📷' },
  { value: 'OTRO', label: 'Otro', emoji: '📎' },
];

export const TIPOS_COMPROBANTE = [
  { value: 'BOLETA', label: 'Boleta' },
  { value: 'FACTURA', label: 'Factura' },
  { value: 'RECIBO', label: 'Recibo' },
  { value: 'TICKET', label: 'Ticket' },
  { value: 'SIN_COMPROBANTE', label: 'Sin Comprobante' },
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
    // Mapear campos del formulario a la BD
    const dbUpdates: Record<string, any> = {
      nombre: updates.nombre,
      descripcion: updates.descripcion,
      tipo: updates.tipo,
      estado: updates.estado,
      fecha_inicio: updates.fecha_inicio,
      fecha_fin: updates.fecha_fin,
      hora_concentracion: updates.hora_concentracion,
      punto_encuentro: updates.punto_encuentro,
      lugar: updates.ubicacion, // ubicacion -> lugar
      direccion: updates.lugar_detalle, // lugar_detalle -> direccion
      costo_por_participante: updates.costo_por_participante,
      cupo_maximo: updates.max_participantes, // max_participantes -> cupo_maximo
      equipamiento_obligatorio: updates.equipamiento_obligatorio,
      equipamiento_opcional: updates.equipamiento_opcional,
      recomendaciones: updates.recomendaciones,
      updated_at: new Date().toISOString(),
    };

    // Remover campos undefined
    Object.keys(dbUpdates).forEach(key => {
      if (dbUpdates[key] === undefined) {
        delete dbUpdates[key];
      }
    });

    const { error } = await supabase
      .from('actividades_aire_libre')
      .update(dbUpdates)
      .eq('id', actividadId);

    if (error) throw error;
  }

  /**
   * Agrega un programa a la actividad
   */
  static async agregarPrograma(
    actividadId: string,
    programa: {
      nombre: string;
      descripcion?: string;
      tipo: TipoProgramaExterior;
      fecha: string;
      hora_inicio?: string;
      hora_fin?: string;
      bloques?: NuevoBloquePrograma[];
    }
  ): Promise<{ programa_id: string }> {
    const { data, error } = await supabase.rpc('api_agregar_programa', {
      p_actividad_id: actividadId,
      p_nombre: programa.nombre,
      p_fecha: programa.fecha,
      p_tipo: programa.tipo,
      p_hora_inicio: programa.hora_inicio || null,
      p_hora_fin: programa.hora_fin || null,
      p_descripcion: programa.descripcion || null,
      p_orden: 1,
      p_bloques: programa.bloques || [],
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
    params: {
      bloque_id: string;
      patrulla_id: string;
      puntaje: number;
      observaciones?: string;
      registrado_por?: string;
    }
  ): Promise<{ puntaje_id: string }> {
    const { data, error } = await supabase.rpc('api_registrar_puntaje', {
      p_bloque_id: params.bloque_id,
      p_patrulla_id: params.patrulla_id,
      p_puntaje: params.puntaje,
      p_observaciones: params.observaciones || null,
      p_registrado_por: params.registrado_por || null,
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
    fechaAutorizacion?: string
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_autorizacion', {
      p_participante_id: participanteId,
      p_estado: estado,
      p_fecha_autorizacion: fechaAutorizacion || null,
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
      p_dia: item.dia,
      p_tipo_comida: item.tipo_comida,
      p_nombre_plato: item.nombre_plato,
      p_descripcion: item.descripcion || null,
      p_responsable_cocina: item.responsable_cocina || null,
      p_patrulla_cocina_id: item.patrulla_cocina_id || null,
      p_ingredientes: item.ingredientes || null,
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
      .from('finanzas')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Obtener URL
    const { data: urlData } = supabase.storage
      .from('finanzas')
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
   * Agrega staff a la actividad (usando RPC)
   */
  static async agregarStaff(
    actividadId: string,
    datos: NuevoStaff
  ): Promise<{ staff_id: string }> {
    const { data, error } = await supabase.rpc('api_agregar_staff', {
      p_actividad_id: actividadId,
      p_persona_id: datos.persona_id,
      p_rol: datos.rol,
      p_responsabilidades: datos.responsabilidades || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al agregar staff');

    return { staff_id: data.id };
  }

  /**
   * Actualiza staff existente
   */
  static async actualizarStaff(
    staffId: string,
    datos: Partial<NuevoStaff>
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_staff', {
      p_staff_id: staffId,
      p_datos: datos,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar staff');
  }

  /**
   * Obtiene los roles de staff desde el catálogo en BD
   * Preferir este método sobre la constante ROLES_STAFF_ACTIVIDAD
   */
  static async obtenerRolesStaff(): Promise<RolStaff[]> {
    const { data, error } = await supabase.rpc('api_obtener_roles_staff');

    if (error) {
      console.warn('Error obteniendo roles desde BD, usando fallback:', error);
      // Fallback a constante local
      return ROLES_STAFF_ACTIVIDAD.map(r => ({
        id: r.value,
        codigo: r.value,
        nombre: r.label,
        icono: r.emoji,
        requiere_certificacion: r.value === 'ENFERMERO',
      }));
    }

    if (!data?.success || !data.data?.length) {
      // Fallback a constante local
      return ROLES_STAFF_ACTIVIDAD.map(r => ({
        id: r.value,
        codigo: r.value,
        nombre: r.label,
        icono: r.emoji,
        requiere_certificacion: r.value === 'ENFERMERO',
      }));
    }

    return data.data;
  }

  /**
   * Lista dirigentes disponibles para agregar al staff
   */
  static async listarDirigentesDisponibles(actividadId: string): Promise<DirigentDisponible[]> {
    const { data, error } = await supabase.rpc('api_listar_dirigentes_disponibles', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar dirigentes');

    return data.data || [];
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
        const storagePath = urlPath.split('/finanzas/')[1];
        if (storagePath) {
          await supabase.storage.from('finanzas').remove([storagePath]);
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

  // ============= CRUD BLOQUES =============

  /**
   * Agrega un bloque a un programa existente
   */
  static async agregarBloque(
    programaId: string,
    bloque: NuevoBloquePrograma
  ): Promise<string> {
    const { data, error } = await supabase.rpc('api_agregar_bloque', {
      p_programa_id: programaId,
      p_bloque: bloque,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al agregar bloque');
    return data.bloque_id;
  }

  /**
   * Actualiza un bloque existente
   */
  static async actualizarBloque(
    bloqueId: string,
    datos: Partial<NuevoBloquePrograma>
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_bloque', {
      p_bloque_id: bloqueId,
      p_datos: datos,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar bloque');
  }

  /**
   * Elimina un bloque
   */
  static async eliminarBloque(bloqueId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_bloque', {
      p_bloque_id: bloqueId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar bloque');
  }

  /**
   * Actualiza un programa completo con todos sus bloques
   * Sincroniza bloques: agrega nuevos, actualiza existentes, elimina los que no vienen
   */
  static async actualizarProgramaCompleto(
    programaId: string,
    datos: {
      nombre?: string;
      tipo?: TipoProgramaExterior;
      fecha?: string;
      hora_inicio?: string;
      hora_fin?: string;
      descripcion?: string;
      bloques?: Array<NuevoBloquePrograma & { id?: string }>;
    }
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_programa_completo', {
      p_programa_id: programaId,
      p_datos: datos,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar programa');
  }

  // ============= CRUD STAFF (RPC) =============

  /**
   * Lista staff de una actividad
   */
  static async listarStaff(actividadId: string): Promise<StaffActividad[]> {
    const { data, error } = await supabase.rpc('api_listar_staff', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar staff');

    return data.data || [];
  }

  // ============= CRUD DOCUMENTOS (RPC) =============

  /**
   * Agrega un documento a la actividad
   */
  static async agregarDocumento(
    actividadId: string,
    documento: NuevoDocumentoActividad
  ): Promise<{ documento_id: string }> {
    const { data, error } = await supabase.rpc('api_agregar_documento', {
      p_actividad_id: actividadId,
      p_datos: documento,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al agregar documento');

    return { documento_id: data.id };
  }

  /**
   * Lista documentos de una actividad
   */
  static async listarDocumentos(actividadId: string): Promise<DocumentoActividad[]> {
    const { data, error } = await supabase.rpc('api_listar_documentos', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar documentos');

    return data.data || [];
  }

  /**
   * Elimina un documento de la actividad (usando RPC)
   */
  static async eliminarDocumentoRPC(documentoId: string): Promise<{ comprobante_url?: string }> {
    const { data, error } = await supabase.rpc('api_eliminar_documento', {
      p_documento_id: documentoId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar documento');

    // Eliminar archivo del storage si existe
    if (data.url_archivo) {
      try {
        const urlPath = new URL(data.url_archivo).pathname;
        const storagePath = urlPath.split('/finanzas/')[1];
        if (storagePath) {
          await supabase.storage.from('finanzas').remove([storagePath]);
        }
      } catch (e) {
        console.warn('Error eliminando archivo de storage:', e);
      }
    }

    return { comprobante_url: data.url_archivo };
  }

  // ============= CRUD COMPRAS =============

  /**
   * Registra una compra vinculada a la actividad
   */
  static async registrarCompra(
    actividadId: string,
    compra: NuevaCompra
  ): Promise<{ compra_id: string; monto: number }> {
    const { data, error } = await supabase.rpc('api_registrar_compra', {
      p_actividad_id: actividadId,
      p_datos: compra,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al registrar compra');

    return { compra_id: data.id, monto: data.monto };
  }

  /**
   * Lista compras de una actividad con totales
   */
  static async listarCompras(actividadId: string): Promise<{
    compras: CompraActividad[];
    totales: { total_compras: number; cantidad_compras: number };
  }> {
    const { data, error } = await supabase.rpc('api_listar_compras', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar compras');

    return {
      compras: data.data || [],
      totales: data.totales || { total_compras: 0, cantidad_compras: 0 },
    };
  }

  /**
   * Actualiza una compra existente
   */
  static async actualizarCompra(
    compraId: string,
    datos: Partial<NuevaCompra>
  ): Promise<{ monto: number }> {
    const { data, error } = await supabase.rpc('api_actualizar_compra', {
      p_compra_id: compraId,
      p_datos: datos,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar compra');

    return { monto: data.monto };
  }

  /**
   * Elimina una compra
   */
  static async eliminarCompra(compraId: string): Promise<{ comprobante_url?: string }> {
    const { data, error } = await supabase.rpc('api_eliminar_compra', {
      p_compra_id: compraId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar compra');

    // Eliminar comprobante del storage si existe
    if (data.comprobante_url) {
      try {
        const urlPath = new URL(data.comprobante_url).pathname;
        const storagePath = urlPath.split('/finanzas/')[1];
        if (storagePath) {
          await supabase.storage.from('finanzas').remove([storagePath]);
        }
      } catch (e) {
        console.warn('Error eliminando comprobante de storage:', e);
      }
    }

    return { comprobante_url: data.comprobante_url };
  }

  /**
   * Sube un archivo (documento o comprobante) al storage
   */
  static async subirArchivo(
    actividadId: string,
    file: File,
    tipo: 'documento' | 'comprobante' = 'documento'
  ): Promise<{ url: string; nombre: string }> {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${timestamp}_${safeName}`;
    const filePath = `actividades/${actividadId}/${tipo}s/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('finanzas')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('finanzas')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      nombre: file.name,
    };
  }

  // ============= PAGOS DE PARTICIPANTES =============

  /**
   * Registra un pago para un participante
   */
  static async registrarPagoParticipante(
    participanteId: string,
    pago: {
      monto: number;
      metodo_pago?: string;
      fecha_pago?: string;
      comprobante_pago?: string;
      comprobante_nombre?: string;
      notas?: string;
    }
  ): Promise<{ monto_pagado: number; pagado_completo: boolean }> {
    const { data, error } = await supabase.rpc('api_registrar_pago_participante', {
      p_participante_id: participanteId,
      p_datos: pago,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al registrar pago');

    return { monto_pagado: data.monto_pagado, pagado_completo: data.pagado_completo };
  }

  /**
   * Actualiza datos de pago de un participante
   */
  static async actualizarPagoParticipante(
    participanteId: string,
    pago: {
      monto_pagado?: number;
      pagado_completo?: boolean;
      metodo_pago?: string;
      fecha_pago?: string;
      notas?: string;
    }
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_pago_participante', {
      p_participante_id: participanteId,
      p_datos: pago,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar pago');
  }

  // ============= CRUD PRESUPUESTO =============

  /**
   * Agrega un item al presupuesto
   */
  static async agregarPresupuesto(
    actividadId: string,
    item: {
      categoria: string;
      subcategoria?: string;
      concepto: string;
      descripcion?: string;
      cantidad: number;
      unidad: string;
      precio_unitario: number;
      proveedor?: string;
    }
  ): Promise<{ id: string }> {
    const { data, error } = await supabase.rpc('api_agregar_presupuesto', {
      p_actividad_id: actividadId,
      p_datos: item,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al agregar presupuesto');

    return { id: data.id };
  }

  /**
   * Actualiza un item del presupuesto
   */
  static async actualizarPresupuesto(
    itemId: string,
    datos: {
      categoria?: string;
      concepto?: string;
      descripcion?: string;
      cantidad?: number;
      unidad?: string;
      precio_unitario?: number;
      proveedor?: string;
    }
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_presupuesto', {
      p_item_id: itemId,
      p_datos: datos,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar presupuesto');
  }

  /**
   * Elimina un item del presupuesto
   */
  static async eliminarPresupuesto(itemId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_presupuesto', {
      p_item_id: itemId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar presupuesto');
  }

  // ============= CRUD MENÚ (actualización) =============

  /**
   * Actualiza un plato del menú
   */
  static async actualizarMenu(
    menuId: string,
    datos: {
      dia?: number;
      tipo_comida?: string;
      nombre_plato?: string;
      descripcion?: string;
      ingredientes?: string[];
      responsable_cocina?: string;
      consideraciones_dieteticas?: string;
    }
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_menu', {
      p_menu_id: menuId,
      p_datos: datos,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar menú');
  }

  // ============= CRUD PUNTAJES (actualización) =============

  /**
   * Actualiza un puntaje existente
   */
  static async actualizarPuntaje(
    puntajeId: string,
    datos: {
      puntaje?: number;
      observaciones?: string;
    }
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_puntaje', {
      p_puntaje_id: puntajeId,
      p_datos: datos,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar puntaje');
  }

  /**
   * Obtiene ranking de puntajes de la actividad
   */
  static async obtenerRankingActividad(actividadId: string): Promise<{
    patrulla_id: string;
    patrulla_nombre: string;
    total_puntaje: number;
    bloques_evaluados: number;
  }[]> {
    const { data, error } = await supabase.rpc('api_obtener_ranking_actividad', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener ranking');

    return data.data || [];
  }
}

export default ActividadesExteriorService;
