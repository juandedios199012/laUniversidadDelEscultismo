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

// ============= INTERFACES INGREDIENTES MENÚ =============

export type EstadoCompraIngrediente = 'PENDIENTE' | 'COTIZADO' | 'COMPRADO' | 'RECIBIDO';

export interface IngredienteMenu {
  id: string;
  menu_id: string;
  actividad_id: string;
  nombre: string;
  descripcion?: string;
  unidad: string;
  cantidad: number;
  cantidad_real?: number;
  precio_unitario: number;
  subtotal: number;
  // Campos de compra real
  cantidad_comprada?: number;
  precio_unitario_real?: number;
  subtotal_real?: number;
  diferencia?: number;
  lugar_compra?: string;
  notas_compra?: string;
  // Estado y metadata
  estado_compra: EstadoCompraIngrediente;
  proveedor?: string;
  fecha_compra?: string;
  comprado_por_id?: string;
  notas?: string;
  es_opcional: boolean;
  orden: number;
  // Vouchers asociados
  vouchers?: VoucherCompra[];
}

export interface NuevoIngredienteMenu {
  nombre: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  descripcion?: string;
  proveedor?: string;
  es_opcional?: boolean;
  notas?: string;
}

// ============= INTERFACES REGISTRO DE COMPRA =============

export interface RegistroCompraIngrediente {
  precio_unitario_real: number;
  cantidad_comprada?: number;
  lugar_compra?: string;
  proveedor?: string;
  notas_compra?: string;
}

export interface RegistroCompraMaterial {
  precio_unitario_real: number;
  cantidad_comprada?: number;
  lugar_compra?: string;
  proveedor?: string;
  notas_compra?: string;
}

export interface RegistroCompraLogistica {
  precio_unitario_real: number;
  cantidad_real?: number;
  lugar_compra?: string;
  proveedor_nombre?: string;
  notas_compra?: string;
}

// ============= INTERFACES VOUCHERS =============

export type TipoComprobante = 'BOLETA' | 'FACTURA' | 'TICKET' | 'RECIBO' | 'SIN_COMPROBANTE';
export type TipoItemVoucher = 'ingrediente' | 'material' | 'logistica';

export interface VoucherCompra {
  id: string;
  tipo_item: TipoItemVoucher;
  item_id: string;
  actividad_id: string;
  nombre_archivo: string;
  url_archivo: string;
  mime_type?: string;
  tamanio_bytes?: number;
  tipo_comprobante: TipoComprobante;
  numero_comprobante?: string;
  ruc_proveedor?: string;
  razon_social_proveedor?: string;
  fecha_emision?: string;
  monto_comprobante?: number;
  notas?: string;
  created_at: string;
}

export interface NuevoVoucher {
  tipo_item: TipoItemVoucher;
  item_id: string;
  nombre_archivo: string;
  url_archivo: string;
  mime_type?: string;
  tamanio_bytes?: number;
  tipo_comprobante?: TipoComprobante;
  numero_comprobante?: string;
  ruc_proveedor?: string;
  razon_social_proveedor?: string;
  fecha_emision?: string;
  monto_comprobante?: number;
  notas?: string;
}

// ============= INTERFACES DASHBOARD PRESUPUESTO =============

export interface DashboardPresupuesto {
  total_estimado: number;
  total_real: number;
  total_pendiente: number;
  diferencia_global: number;
  ahorro: number;
  sobrecosto: number;
  items_pendientes: number;
  items_comprados: number;
  total_items: number;
  total_vouchers: number;
  porcentaje_avance: number;
  por_categoria: DashboardPresupuestoCategoria[];
  vouchers?: VoucherCompra[];
}

export interface DashboardPresupuestoCategoria {
  categoria: string;
  total_items: number;
  items_count: number;
  items_comprados: number;
  items_pendientes: number;
  total_estimado: number;
  total_real: number;
  diferencia: number;
  vouchers: number;
  porcentaje_avance: number;
}

// ============= INTERFACES MATERIALES BLOQUE =============

export type EstadoMaterial = 'PENDIENTE' | 'EN_INVENTARIO' | 'COTIZADO' | 'COMPRADO' | 'ASIGNADO';
export type FuenteMaterial = 'COMPRA' | 'INVENTARIO' | 'PRESTAMO' | 'DONACION';
export type CategoriaMaterial = 'MATERIAL' | 'HERRAMIENTA' | 'PAPELERIA' | 'DECORACION' | 'PREMIO' | 'TECNICO' | 'SCOUTICO' | 'DEPORTIVO';

export interface MaterialBloque {
  id: string;
  bloque_id: string;
  programa_id: string;
  actividad_id: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaMaterial;
  unidad: string;
  cantidad: number;
  cantidad_real?: number;
  precio_unitario: number;
  subtotal: number;
  estado: EstadoMaterial;
  fuente: FuenteMaterial;
  inventario_item_id?: string;
  proveedor?: string;
  fecha_compra?: string;
  comprado_por_id?: string;
  notas?: string;
  es_consumible: boolean;
  devuelto: boolean;
  orden: number;
}

export interface NuevoMaterialBloque {
  nombre: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  categoria?: CategoriaMaterial;
  descripcion?: string;
  fuente?: FuenteMaterial;
  proveedor?: string;
  es_consumible?: boolean;
  notas?: string;
}

// ============= INTERFACES LOGÍSTICA =============

export type EstadoLogistica = 'PENDIENTE' | 'CONFIRMADO' | 'EN_LUGAR' | 'DEVUELTO' | 'NO_DISPONIBLE';
export type TipoCostoLogistica = 'COMPRA' | 'ALQUILER' | 'PRESTAMO' | 'PROPIO';
export type FuenteLogistica = 'COMPRA' | 'ALQUILER' | 'INVENTARIO' | 'PRESTAMO_PADRES' | 'PRESTAMO_INST';
export type CategoriaLogistica = 'EQUIPAMIENTO' | 'CARPAS' | 'COCINA' | 'MESAS' | 'TRANSPORTE' | 'SEGURIDAD' | 'COMUNICACION' | 'ILUMINACION' | 'LIMPIEZA' | 'HERRAMIENTAS' | 'OTRO';

export interface ItemLogistica {
  id: string;
  actividad_id: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaLogistica;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  tipo_costo: TipoCostoLogistica;
  dias_alquiler: number;
  costo_total_alquiler: number;
  estado: EstadoLogistica;
  fuente: FuenteLogistica;
  proveedor_nombre?: string;
  proveedor_contacto?: string;
  responsable_id?: string;
  inventario_item_id?: string;
  fecha_necesaria?: string;
  fecha_devolucion?: string;
  es_critico: boolean;
  notas?: string;
  orden: number;
}

export interface NuevoItemLogistica {
  nombre: string;
  categoria: CategoriaLogistica;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  tipo_costo?: TipoCostoLogistica;
  dias_alquiler?: number;
  descripcion?: string;
  fuente?: FuenteLogistica;
  proveedor_nombre?: string;
  proveedor_contacto?: string;
  responsable_id?: string;
  fecha_necesaria?: string;
  fecha_devolucion?: string;
  es_critico?: boolean;
  notas?: string;
}

// ============= INTERFACE RESUMEN PRESUPUESTO =============

export interface ResumenPresupuestoCategoria {
  categoria: string;
  total_items: number;
  monto_presupuestado: number;
  monto_ejecutado: number;
  items_pendientes: number;
  items_completados: number;
  porcentaje_completado: number;
}

export interface ResumenPresupuestoConsolidado {
  total_presupuestado: number;
  total_ejecutado: number;
  saldo_disponible: number;
  porcentaje_ejecutado: number;
  por_categoria: ResumenPresupuestoCategoria[];
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

// ============= INTERFACES DOCUMENTOS AUTORIZACIÓN PARTICIPANTE =============

export type TipoDocumentoAutorizacion = 'AUTORIZACION' | 'FICHA_MEDICA' | 'DNI_PADRE' | 'DNI_SCOUT' | 'CARNET_SEGURO' | 'OTRO';

export interface DocumentoAutorizacionParticipante {
  id: string;
  participante_id: string;
  nombre_archivo: string;
  url_archivo: string;
  mime_type?: string;
  tamanio_bytes?: number;
  tipo_documento: TipoDocumentoAutorizacion;
  descripcion?: string;
  created_at: string;
}

export interface NuevoDocumentoAutorizacion {
  nombre_archivo: string;
  url_archivo: string;
  mime_type?: string;
  tamanio_bytes?: number;
  tipo_documento?: TipoDocumentoAutorizacion;
  descripcion?: string;
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

// ============= CONSTANTES INGREDIENTES Y MATERIALES =============

export const UNIDADES_MEDIDA = [
  // Cantidad
  { value: 'unidad', label: 'Unidad', categoria: 'CANTIDAD' },
  { value: 'docena', label: 'Docena', categoria: 'CANTIDAD' },
  { value: 'paquete', label: 'Paquete', categoria: 'CANTIDAD' },
  { value: 'caja', label: 'Caja', categoria: 'CANTIDAD' },
  { value: 'bolsa', label: 'Bolsa', categoria: 'CANTIDAD' },
  { value: 'rollo', label: 'Rollo', categoria: 'CANTIDAD' },
  { value: 'par', label: 'Par', categoria: 'CANTIDAD' },
  // Peso
  { value: 'kg', label: 'Kilogramo', categoria: 'PESO' },
  { value: 'g', label: 'Gramo', categoria: 'PESO' },
  { value: 'lb', label: 'Libra', categoria: 'PESO' },
  // Volumen
  { value: 'litro', label: 'Litro', categoria: 'VOLUMEN' },
  { value: 'ml', label: 'Mililitro', categoria: 'VOLUMEN' },
  { value: 'galon', label: 'Galón', categoria: 'VOLUMEN' },
  { value: 'taza', label: 'Taza', categoria: 'VOLUMEN' },
  // Longitud
  { value: 'metro', label: 'Metro', categoria: 'LONGITUD' },
  { value: 'cm', label: 'Centímetro', categoria: 'LONGITUD' },
];

export const ESTADOS_COMPRA_INGREDIENTE = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'yellow', emoji: '⏳' },
  { value: 'COTIZADO', label: 'Cotizado', color: 'blue', emoji: '📋' },
  { value: 'COMPRADO', label: 'Comprado', color: 'green', emoji: '✅' },
  { value: 'RECIBIDO', label: 'Recibido', color: 'emerald', emoji: '📦' },
];

export const CATEGORIAS_MATERIAL = [
  { value: 'MATERIAL', label: 'Material General', emoji: '📦' },
  { value: 'HERRAMIENTA', label: 'Herramientas', emoji: '🔧' },
  { value: 'PAPELERIA', label: 'Papelería', emoji: '📝' },
  { value: 'DECORACION', label: 'Decoración', emoji: '🎨' },
  { value: 'PREMIO', label: 'Premios', emoji: '🏆' },
  { value: 'TECNICO', label: 'Equipo Técnico', emoji: '⚙️' },
  { value: 'SCOUTICO', label: 'Material Scout', emoji: '🧭' },
  { value: 'DEPORTIVO', label: 'Material Deportivo', emoji: '⚽' },
];

export const ESTADOS_MATERIAL = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'yellow' },
  { value: 'EN_INVENTARIO', label: 'En Inventario', color: 'blue' },
  { value: 'COTIZADO', label: 'Cotizado', color: 'purple' },
  { value: 'COMPRADO', label: 'Comprado', color: 'green' },
  { value: 'ASIGNADO', label: 'Asignado', color: 'emerald' },
];

export const FUENTES_MATERIAL = [
  { value: 'COMPRA', label: 'Compra', emoji: '🛒' },
  { value: 'INVENTARIO', label: 'Inventario', emoji: '📦' },
  { value: 'PRESTAMO', label: 'Préstamo', emoji: '🤝' },
  { value: 'DONACION', label: 'Donación', emoji: '🎁' },
];

export const CATEGORIAS_LOGISTICA = [
  { value: 'EQUIPAMIENTO', label: 'Equipamiento General', emoji: '📦', color: 'blue' },
  { value: 'CARPAS', label: 'Carpas y Refugio', emoji: '⛺', color: 'green' },
  { value: 'COCINA', label: 'Equipos de Cocina', emoji: '👨‍🍳', color: 'orange' },
  { value: 'MESAS', label: 'Mesas y Mobiliario', emoji: '🪑', color: 'purple' },
  { value: 'TRANSPORTE', label: 'Transporte', emoji: '🚌', color: 'slate' },
  { value: 'SEGURIDAD', label: 'Seguridad y Primeros Auxilios', emoji: '🛡️', color: 'red' },
  { value: 'COMUNICACION', label: 'Comunicación', emoji: '📻', color: 'cyan' },
  { value: 'ILUMINACION', label: 'Iluminación', emoji: '💡', color: 'yellow' },
  { value: 'LIMPIEZA', label: 'Limpieza e Higiene', emoji: '🧹', color: 'emerald' },
  { value: 'HERRAMIENTAS', label: 'Herramientas', emoji: '🔧', color: 'zinc' },
  { value: 'OTRO', label: 'Otros', emoji: '📋', color: 'gray' },
];

export const TIPOS_COSTO_LOGISTICA = [
  { value: 'COMPRA', label: 'Compra' },
  { value: 'ALQUILER', label: 'Alquiler' },
  { value: 'PRESTAMO', label: 'Préstamo (sin costo)' },
  { value: 'PROPIO', label: 'Propio (inventario)' },
];

export const ESTADOS_LOGISTICA = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'yellow', emoji: '⏳' },
  { value: 'CONFIRMADO', label: 'Confirmado', color: 'green', emoji: '✅' },
  { value: 'EN_LUGAR', label: 'En Lugar', color: 'blue', emoji: '📍' },
  { value: 'DEVUELTO', label: 'Devuelto', color: 'emerald', emoji: '↩️' },
  { value: 'NO_DISPONIBLE', label: 'No Disponible', color: 'red', emoji: '❌' },
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

  /**
   * Actualiza el monto a pagar de un participante
   */
  static async actualizarMontoParticipante(
    participanteId: string,
    montoAPagar: number
  ): Promise<void> {
    const { error } = await supabase
      .from('participantes_actividad')
      .update({ 
        monto_a_pagar: montoAPagar,
        updated_at: new Date().toISOString()
      })
      .eq('id', participanteId);

    if (error) throw error;
  }

  /**
   * Actualiza datos generales de un participante (sin montos)
   */
  static async actualizarParticipante(
    participanteId: string,
    datos: {
      restricciones_alimentarias?: string;
      observaciones?: string;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('participantes_actividad')
      .update({
        ...datos,
        updated_at: new Date().toISOString()
      })
      .eq('id', participanteId);

    if (error) throw error;
  }

  /**
   * Corrige los montos de un participante (monto_a_pagar y monto_pagado)
   * Usa función RPC para evitar conflictos con columna generada pagado_completo
   */
  static async corregirMontosParticipante(
    participanteId: string,
    montoAPagar: number,
    montoPagado: number
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_corregir_monto_participante', {
      p_participante_id: participanteId,
      p_monto_a_pagar: montoAPagar,
      p_monto_pagado: montoPagado
    });

    if (error) throw error;
    if (data && !data.success) {
      throw new Error(data.error || 'Error al corregir montos');
    }
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

  // ============= CRUD DOCUMENTOS AUTORIZACIÓN PARTICIPANTE =============

  /**
   * Lista documentos de autorización de un participante
   */
  static async listarDocumentosAutorizacion(
    participanteId: string
  ): Promise<DocumentoAutorizacionParticipante[]> {
    const { data, error } = await supabase.rpc('api_listar_documentos_autorizacion', {
      p_participante_id: participanteId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar documentos');

    return data.data || [];
  }

  /**
   * Agrega un documento de autorización a un participante
   */
  static async agregarDocumentoAutorizacion(
    participanteId: string,
    documento: NuevoDocumentoAutorizacion
  ): Promise<{ id: string }> {
    const { data, error } = await supabase.rpc('api_agregar_documento_autorizacion', {
      p_participante_id: participanteId,
      p_nombre_archivo: documento.nombre_archivo,
      p_url_archivo: documento.url_archivo,
      p_mime_type: documento.mime_type || null,
      p_tamanio_bytes: documento.tamanio_bytes || null,
      p_tipo_documento: documento.tipo_documento || 'AUTORIZACION',
      p_descripcion: documento.descripcion || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al agregar documento');

    return { id: data.id };
  }

  /**
   * Elimina un documento de autorización
   */
  static async eliminarDocumentoAutorizacion(documentoId: string): Promise<{ url_archivo?: string }> {
    const { data, error } = await supabase.rpc('api_eliminar_documento_autorizacion', {
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

    return { url_archivo: data.url_archivo };
  }

  /**
   * Sube múltiples archivos de autorización para un participante
   */
  static async subirDocumentosAutorizacion(
    participanteId: string,
    actividadId: string,
    files: File[],
    tipoDocumento: TipoDocumentoAutorizacion = 'AUTORIZACION'
  ): Promise<{ subidos: number; errores: string[] }> {
    const resultados = { subidos: 0, errores: [] as string[] };

    for (const file of files) {
      try {
        // Subir a storage
        const fileExt = file.name.split('.').pop();
        const fileName = `autorizacion_${participanteId}_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `autorizaciones/${actividadId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('finanzas')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('finanzas')
          .getPublicUrl(filePath);

        // Registrar en BD
        await this.agregarDocumentoAutorizacion(participanteId, {
          nombre_archivo: file.name,
          url_archivo: publicUrl,
          mime_type: file.type,
          tamanio_bytes: file.size,
          tipo_documento: tipoDocumento,
        });

        resultados.subidos++;
      } catch (err: any) {
        resultados.errores.push(`${file.name}: ${err.message}`);
      }
    }

    return resultados;
  }

  /**
   * Cuenta documentos de un participante
   */
  static async contarDocumentosAutorizacion(
    participanteId: string
  ): Promise<{ total: number; por_tipo: Record<string, number> }> {
    const { data, error } = await supabase.rpc('api_contar_documentos_autorizacion', {
      p_participante_id: participanteId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al contar documentos');

    return {
      total: data.total || 0,
      por_tipo: data.por_tipo || {},
    };
  }

  // ============= CRUD INGREDIENTES MENÚ =============

  /**
   * Listar ingredientes de un plato del menú
   */
  static async listarIngredientesMenu(menuId: string): Promise<IngredienteMenu[]> {
    const { data, error } = await supabase.rpc('api_listar_ingredientes_menu', {
      p_menu_id: menuId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar ingredientes');

    return data.data || [];
  }

  /**
   * Agregar ingrediente a un plato
   */
  static async agregarIngredienteMenu(
    menuId: string,
    ingrediente: NuevoIngredienteMenu
  ): Promise<{ id: string }> {
    const { data, error } = await supabase.rpc('api_agregar_ingrediente_menu', {
      p_menu_id: menuId,
      p_nombre: ingrediente.nombre,
      p_unidad: ingrediente.unidad,
      p_cantidad: ingrediente.cantidad,
      p_precio_unitario: ingrediente.precio_unitario,
      p_descripcion: ingrediente.descripcion || null,
      p_proveedor: ingrediente.proveedor || null,
      p_es_opcional: ingrediente.es_opcional || false,
      p_notas: ingrediente.notas || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al agregar ingrediente');

    return { id: data.id };
  }

  /**
   * Actualizar ingrediente
   */
  static async actualizarIngredienteMenu(
    ingredienteId: string,
    datos: Partial<NuevoIngredienteMenu> & { estado_compra?: EstadoCompraIngrediente }
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_ingrediente_menu', {
      p_id: ingredienteId,
      p_nombre: datos.nombre || null,
      p_unidad: datos.unidad || null,
      p_cantidad: datos.cantidad || null,
      p_precio_unitario: datos.precio_unitario || null,
      p_descripcion: datos.descripcion || null,
      p_proveedor: datos.proveedor || null,
      p_estado_compra: datos.estado_compra || null,
      p_es_opcional: datos.es_opcional ?? null,
      p_notas: datos.notas || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar ingrediente');
  }

  /**
   * Eliminar ingrediente
   */
  static async eliminarIngredienteMenu(ingredienteId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_ingrediente_menu', {
      p_id: ingredienteId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar ingrediente');
  }

  // ============= CRUD MATERIALES BLOQUE =============

  /**
   * Listar materiales de un bloque
   */
  static async listarMaterialesBloque(bloqueId: string): Promise<MaterialBloque[]> {
    const { data, error } = await supabase.rpc('api_listar_materiales_bloque', {
      p_bloque_id: bloqueId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar materiales');

    return data.data || [];
  }

  /**
   * Agregar material a un bloque
   */
  static async agregarMaterialBloque(
    bloqueId: string,
    material: NuevoMaterialBloque
  ): Promise<{ id: string }> {
    const { data, error } = await supabase.rpc('api_agregar_material_bloque', {
      p_bloque_id: bloqueId,
      p_nombre: material.nombre,
      p_unidad: material.unidad,
      p_cantidad: material.cantidad,
      p_precio_unitario: material.precio_unitario,
      p_categoria: material.categoria || 'MATERIAL',
      p_descripcion: material.descripcion || null,
      p_fuente: material.fuente || 'COMPRA',
      p_proveedor: material.proveedor || null,
      p_es_consumible: material.es_consumible ?? true,
      p_notas: material.notas || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al agregar material');

    return { id: data.id };
  }

  /**
   * Actualizar material
   */
  static async actualizarMaterialBloque(
    materialId: string,
    datos: Partial<NuevoMaterialBloque> & { estado?: EstadoMaterial }
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_material_bloque', {
      p_id: materialId,
      p_nombre: datos.nombre || null,
      p_unidad: datos.unidad || null,
      p_cantidad: datos.cantidad || null,
      p_precio_unitario: datos.precio_unitario || null,
      p_categoria: datos.categoria || null,
      p_descripcion: datos.descripcion || null,
      p_estado: datos.estado || null,
      p_fuente: datos.fuente || null,
      p_proveedor: datos.proveedor || null,
      p_notas: datos.notas || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar material');
  }

  /**
   * Eliminar material
   */
  static async eliminarMaterialBloque(materialId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_material_bloque', {
      p_id: materialId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar material');
  }

  // ============= CRUD LOGÍSTICA =============

  /**
   * Listar items de logística de una actividad
   */
  static async listarLogistica(actividadId: string): Promise<ItemLogistica[]> {
    const { data, error } = await supabase.rpc('api_listar_logistica', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar logística');

    return data.data || [];
  }

  /**
   * Agregar item de logística
   */
  static async agregarLogistica(
    actividadId: string,
    item: NuevoItemLogistica
  ): Promise<{ id: string }> {
    const { data, error } = await supabase.rpc('api_agregar_logistica', {
      p_actividad_id: actividadId,
      p_nombre: item.nombre,
      p_categoria: item.categoria,
      p_unidad: item.unidad,
      p_cantidad: item.cantidad,
      p_precio_unitario: item.precio_unitario,
      p_tipo_costo: item.tipo_costo || 'COMPRA',
      p_dias_alquiler: item.dias_alquiler || 1,
      p_descripcion: item.descripcion || null,
      p_fuente: item.fuente || 'COMPRA',
      p_proveedor_nombre: item.proveedor_nombre || null,
      p_proveedor_contacto: item.proveedor_contacto || null,
      p_responsable_id: item.responsable_id || null,
      p_fecha_necesaria: item.fecha_necesaria || null,
      p_fecha_devolucion: item.fecha_devolucion || null,
      p_es_critico: item.es_critico || false,
      p_notas: item.notas || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al agregar logística');

    return { id: data.id };
  }

  /**
   * Actualizar item de logística
   */
  static async actualizarLogistica(
    itemId: string,
    datos: Partial<NuevoItemLogistica> & { estado?: EstadoLogistica }
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_logistica', {
      p_id: itemId,
      p_nombre: datos.nombre || null,
      p_categoria: datos.categoria || null,
      p_unidad: datos.unidad || null,
      p_cantidad: datos.cantidad || null,
      p_precio_unitario: datos.precio_unitario || null,
      p_tipo_costo: datos.tipo_costo || null,
      p_dias_alquiler: datos.dias_alquiler || null,
      p_descripcion: datos.descripcion || null,
      p_estado: datos.estado || null,
      p_fuente: datos.fuente || null,
      p_proveedor_nombre: datos.proveedor_nombre || null,
      p_proveedor_contacto: datos.proveedor_contacto || null,
      p_responsable_id: datos.responsable_id || null,
      p_fecha_necesaria: datos.fecha_necesaria || null,
      p_fecha_devolucion: datos.fecha_devolucion || null,
      p_es_critico: datos.es_critico ?? null,
      p_notas: datos.notas || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar logística');
  }

  /**
   * Eliminar item de logística
   */
  static async eliminarLogistica(itemId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_logistica', {
      p_id: itemId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar logística');
  }

  // ============= RESUMEN PRESUPUESTO CONSOLIDADO =============

  /**
   * Obtener resumen consolidado del presupuesto
   */
  static async obtenerResumenPresupuestoConsolidado(
    actividadId: string
  ): Promise<ResumenPresupuestoConsolidado> {
    const { data, error } = await supabase.rpc('api_obtener_resumen_presupuesto', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener resumen');

    return data.data;
  }

  // ============= REGISTRO DE COMPRAS =============

  /**
   * Registrar compra de ingrediente con precio real
   */
  static async registrarCompraIngrediente(
    ingredienteId: string,
    compra: RegistroCompraIngrediente
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_registrar_compra_ingrediente', {
      p_ingrediente_id: ingredienteId,
      p_precio_unitario_real: compra.precio_unitario_real,
      p_cantidad_comprada: compra.cantidad_comprada || null,
      p_lugar_compra: compra.lugar_compra || null,
      p_proveedor: compra.proveedor || null,
      p_notas_compra: compra.notas_compra || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al registrar compra');
  }

  /**
   * Registrar compra de material con precio real
   */
  static async registrarCompraMaterial(
    materialId: string,
    compra: RegistroCompraMaterial
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_registrar_compra_material', {
      p_material_id: materialId,
      p_precio_unitario_real: compra.precio_unitario_real,
      p_cantidad_comprada: compra.cantidad_comprada || null,
      p_lugar_compra: compra.lugar_compra || null,
      p_proveedor: compra.proveedor || null,
      p_notas_compra: compra.notas_compra || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al registrar compra');
  }

  /**
   * Registrar compra/confirmación de logística con precio real
   */
  static async registrarCompraLogistica(
    logisticaId: string,
    compra: RegistroCompraLogistica
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_registrar_compra_logistica', {
      p_logistica_id: logisticaId,
      p_precio_unitario_real: compra.precio_unitario_real,
      p_cantidad_real: compra.cantidad_real || null,
      p_lugar_compra: compra.lugar_compra || null,
      p_proveedor_nombre: compra.proveedor_nombre || null,
      p_notas_compra: compra.notas_compra || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al registrar compra');
  }

  // ============= VOUCHERS =============

  /**
   * Subir voucher/comprobante de compra (OPCIONAL)
   */
  static async subirVoucher(
    actividadId: string,
    voucher: NuevoVoucher,
    archivo?: File
  ): Promise<{ id: string; url?: string }> {
    let urlArchivo = voucher.url_archivo;
    let nombreArchivo = voucher.nombre_archivo;

    // Si hay archivo, subirlo a Storage
    if (archivo) {
      const ext = archivo.name.split('.').pop();
      const fileName = `vouchers/${actividadId}/${voucher.tipo_item}_${voucher.item_id}_${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('finanzas')
        .upload(fileName, archivo);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('finanzas')
        .getPublicUrl(fileName);

      urlArchivo = publicUrl.publicUrl;
      nombreArchivo = archivo.name;
    }

    const { data, error } = await supabase.rpc('api_subir_voucher', {
      p_tipo_item: voucher.tipo_item,
      p_item_id: voucher.item_id,
      p_actividad_id: actividadId,
      p_nombre_archivo: nombreArchivo,
      p_url_archivo: urlArchivo,
      p_mime_type: archivo?.type || voucher.mime_type || null,
      p_tamanio_bytes: archivo?.size || voucher.tamanio_bytes || null,
      p_tipo_comprobante: voucher.tipo_comprobante || 'BOLETA',
      p_numero_comprobante: voucher.numero_comprobante || null,
      p_ruc_proveedor: voucher.ruc_proveedor || null,
      p_razon_social_proveedor: voucher.razon_social_proveedor || null,
      p_fecha_emision: voucher.fecha_emision || null,
      p_monto_comprobante: voucher.monto_comprobante || null,
      p_notas: voucher.notas || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al subir voucher');

    return { id: data.id, url: urlArchivo };
  }

  /**
   * Listar vouchers de un item
   */
  static async listarVouchersItem(
    tipoItem: TipoItemVoucher,
    itemId: string
  ): Promise<VoucherCompra[]> {
    const { data, error } = await supabase.rpc('api_listar_vouchers_item', {
      p_tipo_item: tipoItem,
      p_item_id: itemId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar vouchers');

    return data.data || [];
  }

  /**
   * Eliminar voucher (BD primero, luego storage)
   * Patrón: Elimina de BD (fuente de verdad) y luego limpia storage
   * Si falla limpieza de storage, se loguea pero no falla la operación
   */
  static async eliminarVoucher(voucherId: string): Promise<void> {
    // 1. Eliminar de BD y obtener URL para limpieza
    const { data, error } = await supabase.rpc('api_eliminar_voucher', {
      p_id: voucherId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar voucher');

    // 2. Limpiar archivo del storage (best-effort)
    const urlArchivo = data.url_archivo;
    if (urlArchivo) {
      try {
        // Extraer path del storage desde la URL pública
        // URL format: https://xxx.supabase.co/storage/v1/object/public/finanzas/vouchers/...
        const urlPath = new URL(urlArchivo).pathname;
        const storagePath = urlPath.split('/finanzas/')[1];
        
        if (storagePath) {
          const { error: storageError } = await supabase.storage
            .from('finanzas')
            .remove([storagePath]);
          
          if (storageError) {
            // Log pero no fallar - el registro ya fue eliminado
            console.warn('Error eliminando archivo de storage (archivo huérfano):', storageError);
          }
        }
      } catch (e) {
        // Log pero no fallar - la operación principal (BD) fue exitosa
        console.warn('Error parseando URL para limpieza de storage:', e);
      }
    }
  }

  // ============= DASHBOARD PRESUPUESTO =============

  /**
   * Obtener dashboard de presupuesto (estimado vs real)
   */
  static async obtenerDashboardPresupuesto(
    actividadId: string
  ): Promise<DashboardPresupuesto> {
    const { data, error } = await supabase.rpc('api_obtener_dashboard_presupuesto', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener dashboard');

    return data.data;
  }
}

export default ActividadesExteriorService;
