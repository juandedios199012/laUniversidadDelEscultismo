/**
 * Actividades al Aire Libre Service
 * Maneja campamentos, caminatas, excursiones con programas completos
 */

import { supabase } from '@/lib/supabase';

// ============= TIPOS =============
// Valores definidos por CHECK constraints en BD (tabla actividades_aire_libre)

// El tipo de actividad ya no es una lista fija: se administra desde el
// catálogo "tipos_actividad_aire_libre" (Configuración > Tipos de Actividad).
export type TipoActividadExterior = string;

export interface TipoActividadAireLibre {
  id: string;
  descripcion: string;
  activo: boolean;
  total_uso?: number;
}

export interface PuntoEncuentroAireLibre {
  id: string;
  lugar: string;
  referencia?: string;
  activo: boolean;
  total_uso?: number;
}

export interface TipoCostoAireLibre {
  id: string;
  descripcion: string;
  activo: boolean;
  total_uso?: number;
}

export interface CostoActividad {
  tipo_costo_id: string;
  descripcion?: string;
  monto: number;
}

export type EstadoActividadExterior = 'borrador' | 'planificacion' | 'aprobado' | 'en_curso' | 'finalizado' | 'cancelado';

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

export interface ObjetivoEspecificoActividad {
  objetivo_especifico: string;
  meta: string;
}

export interface ActividadGanttFila {
  actividad: string;
  semanas: boolean[];
}

export interface ResponsableActividad {
  persona_id: string;
  nombre: string;
  rol: string;
}

export type SeveridadRiesgo = 'BAJO' | 'MEDIO' | 'ALTO';
export type FrecuenciaRiesgo = 'A' | 'B' | 'C' | 'D' | 'E';

export interface RiesgoEvaluacion {
  actividad_accion?: string;
  lugar?: string;
  peligro?: string;
  riesgo?: string;
  consecuencia?: string;
  severidad?: SeveridadRiesgo;
  frecuencia?: FrecuenciaRiesgo;
  indice?: number;
  acciones_preventivas?: string;
}

export interface RiesgoProtocolo {
  nombre_procedimiento?: string;
  responsable_persona_id?: string;
  responsable_nombre?: string;
  forma_contacto?: string;
  pasos_a_realizar?: string;
  acciones_preventivas?: string;
  observaciones?: string;
}

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
  participantes_count: number;
  staff_count: number;
  tiene_programa: boolean;
  presupuesto_total: number;
}

export interface ActividadExteriorCompleta extends ActividadExteriorResumen {
  descripcion?: string;
  hora_concentracion?: string;
  punto_encuentro?: string;
  punto_encuentro_id?: string | null;
  punto_encuentro_lugar?: string;
  punto_encuentro_referencia?: string;
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
  participacion_asistencia?: string;
  objetivo_general?: string;
  objetivos_especificos?: ObjetivoEspecificoActividad[];
  ods_seleccionados?: number[];
  cronograma_semanas?: number;
  cronograma_actividades?: ActividadGanttFila[];
  imagen_ubicacion_url?: string;
  riesgo_evaluacion?: RiesgoEvaluacion;
  riesgo_protocolo?: RiesgoProtocolo;
  patrullas_actividad: PatrullaActividad[];
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
  punto_encuentro_id?: string | null;
  ubicacion: string;
  lugar_detalle?: string;
  coordenadas_gps?: string;
  costo_por_participante?: number;
  cupo_minimo?: number;
  equipamiento_obligatorio?: string;
  equipamiento_opcional?: string;
  recomendaciones?: string;
  participacion_asistencia?: string;
  objetivo_general?: string;
  objetivos_especificos?: ObjetivoEspecificoActividad[];
  ods_seleccionados?: number[];
  cronograma_semanas?: number;
  cronograma_actividades?: ActividadGanttFila[];
  imagen_ubicacion_url?: string;
  riesgo_evaluacion?: RiesgoEvaluacion;
  riesgo_protocolo?: RiesgoProtocolo;
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
  subcampos?: SubCampo[];
}

export interface BloqueProgramaActividad {
  id?: string;
  nombre: string;
  descripcion?: string;
  hora_inicio: string;
  hora_fin?: string;
  duracion_minutos: number;
  responsable_id?: string;
  materiales_necesarios?: string;
  observaciones?: string;
  orden?: number;
  objetivo_ids?: string[];
  // Solo categoriza el bloque para la línea de tiempo (ActividadDetalle.tsx);
  // ya no se edita desde el formulario de bloques (unificado con Actividad
  // de Programación). El puntaje ya no depende de un flag por bloque:
  // cualquier bloque puede recibir puntaje (ver registrarPuntajesMasivoBloque).
  tipo_bloque?: string;
}

export interface NuevoBloquePrograma {
  nombre: string;
  descripcion?: string;
  hora_inicio: string;
  duracion_minutos: number;
  responsable_id?: string;
  materiales_necesarios?: string;
  observaciones?: string;
  orden?: number;
  objetivo_ids?: string[];
}

export interface ParticipanteActividad {
  id: string;
  scout_id: string;
  scout_nombre: string;
  scout_codigo: string;
  dni?: string;
  edad?: number;
  codigo_asociado?: string;
  contacto_emergencia_telefono?: string;
  celular?: string;
  estado_inscripcion?: string;
  confirmado: boolean;
  estado_autorizacion: EstadoAutorizacionExterior;
  fecha_autorizacion?: string;
  monto_a_pagar?: number;
  monto_pagado: number;
  pagado_completo: boolean;
  restricciones_alimentarias?: string;
  observaciones?: string;
  patrulla_actividad_id?: string;
  patrulla_nombre?: string;
  patrulla_color?: string;
}

export interface StaffActividad {
  id: string;
  persona_id: string;
  nombre: string;
  dni?: string;
  edad?: number;
  codigo_asociado?: string;
  telefono_contacto?: string;
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
  tipo_comida: 'DESAYUNO' | 'ALMUERZO' | 'CENA' | 'ADICIONALES';
  nombre_plato: string;
  descripcion?: string;
  responsable_cocina?: string;
  patrulla_cocina_id?: string;
  ingredientes?: object;
  consideraciones_dieteticas?: string;
}

export interface NuevoItemMenuActividad {
  dia: number;
  tipo_comida: 'DESAYUNO' | 'ALMUERZO' | 'CENA' | 'ADICIONALES';
  nombre_plato: string;
  descripcion?: string;
  responsable_cocina?: string;
  patrulla_cocina_id?: string;
  ingredientes?: object;
}

export interface PuntajeActividad {
  id: string;
  patrulla_actividad_id: string;
  patrulla_nombre: string;
  subcampo_id?: string;
  bloque_id?: string;
  bloque_nombre?: string;
  puntaje: number;
  observaciones?: string;
}

// ============= INTERFACES PATRULLAS DE ACTIVIDAD =============

export interface PatrullaActividad {
  id: string;
  actividad_id?: string;
  nombre: string;
  color: string;
  icono: string;
  orden: number;
  cantidad_participantes?: number;
  puntaje_total?: number;
}

export interface NuevaPatrullaActividad {
  nombre: string;
  color?: string;
  icono?: string;
}

// ============= INTERFACES SUB CAMPOS =============

export interface SubCampo {
  id: string;
  actividad_id?: string;
  nombre: string;
  responsable_id?: string;
  responsable_nombre?: string;
  color?: string;
  icono?: string;
  orden: number;
  patrullas: PatrullaActividad[];
  cantidad_patrullas?: number;
  puntaje_total?: number;
}

export interface NuevoSubCampo {
  nombre: string;
  responsable_id?: string;
  color?: string;
  icono?: string;
  patrullas_ids?: string[];
}

// ============= INTERFACES INVENTARIO =============

export type TipoPropiedadInventario = 'PROPIO' | 'PRESTADO';
export type EstadoInventario = 'DISPONIBLE' | 'EN_USO' | 'DAÑADO' | 'BAJA' | 'DEVUELTO';
export type CondicionInventario = 'NUEVO' | 'BUENO' | 'REGULAR' | 'MALO' | 'BAJA';
export type CategoriaInventario = 'GENERAL' | 'ELECTRICO' | 'CAMPING' | 'COCINA' | 'PRIMEROS_AUXILIOS' | 'HERRAMIENTAS' | 'DECORACION' | 'OTRO';
export type TipoAsignacionInventario = 'SUBCAMPO' | 'PATRULLA' | 'DIRIGENTE' | 'EQUIPO' | 'SIN_ASIGNAR';

export interface ItemInventario {
  id: string;
  codigo_item?: string;
  grupo?: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaInventario;
  cantidad: number;
  tipo_propiedad: TipoPropiedadInventario;
  prestado_por?: string;
  contacto_prestador?: string;
  asignado_a?: string;
  tipo_asignacion?: TipoAsignacionInventario;
  fecha_asignacion?: string;
  estado: EstadoInventario;
  condicion: CondicionInventario;
  fecha_devolucion?: string;
  devuelto: boolean;
  notas_devolucion?: string;
  observaciones?: string;
  tenedor_actual?: string;            // Quién tiene el item ahora (puede ser diferente del asignado)
  historial_tenedores?: any[];         // Historial de transferencias
  created_at: string;
}

export interface NuevoItemInventario {
  nombre: string;
  descripcion?: string;
  categoria?: CategoriaInventario;
  cantidad?: number;
  tipo_propiedad?: TipoPropiedadInventario;
  prestado_por?: string;
  contacto_prestador?: string;
  asignado_a?: string;
  tipo_asignacion?: TipoAsignacionInventario;
  observaciones?: string;
  grupo?: string;
  prefijo_codigo?: string;
}

export interface MovimientoInventario {
  id: string;
  tipo_movimiento: string;
  descripcion?: string;
  estado_anterior?: string;
  estado_nuevo?: string;
  condicion_anterior?: string;
  condicion_nueva?: string;
  registrado_por?: string;
  created_at: string;
}

export interface DashboardInventario {
  total_items: number;
  prestados: number;
  devueltos: number;
  pendientes_devolucion: number;
  dañados: number;
  por_categoria: { categoria: string; cantidad: number }[];
  por_estado: { estado: string; cantidad: number }[];
  por_grupo: { grupo: string; cantidad: number; pendientes: number }[];
  por_prestador: { prestador: string; total_prestados: number; devueltos: number; pendientes: number }[];
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

// El catálogo de tipos ahora es dinámico (ver listarTiposActividadAireLibre).
// Este mapa solo aporta un emoji "bonito" para los tipos históricos conocidos;
// cualquier tipo nuevo creado desde el catálogo usa el emoji por defecto.
const EMOJI_TIPO_ACTIVIDAD_DEFAULT = '🏕️';
const EMOJI_POR_TIPO_ACTIVIDAD: Record<string, string> = {
  campamento: '🏕️',
  paseo: '🥾',
  excursion: '🌄',
  expedicion: '🏔️',
  acantonamiento: '🏠',
};

export function getEmojiTipoActividad(tipo?: string | null): string {
  if (!tipo) return EMOJI_TIPO_ACTIVIDAD_DEFAULT;
  const normalizado = tipo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  return EMOJI_POR_TIPO_ACTIVIDAD[normalizado] || EMOJI_TIPO_ACTIVIDAD_DEFAULT;
}

export const ESTADOS_ACTIVIDAD_EXTERIOR: { value: EstadoActividadExterior; label: string; color: string }[] = [
  { value: 'borrador', label: 'Borrador', color: 'gray' },
  { value: 'planificacion', label: 'En Planificación', color: 'blue' },
  { value: 'aprobado', label: 'Aprobado', color: 'green' },
  { value: 'en_curso', label: 'En Curso', color: 'purple' },
  { value: 'finalizado', label: 'Finalizado', color: 'emerald' },
  { value: 'cancelado', label: 'Cancelado', color: 'red' },
];

// Catálogo fijo de los 17 Objetivos de Desarrollo Sostenible (ONU).
// Contenido inmutable, no se administra desde la UI — usado en el paso
// "ODS" del wizard de Aire Libre (selección múltiple por actividad).
export const CATALOGO_ODS: { numero: number; nombre: string }[] = [
  { numero: 1, nombre: 'Fin de la Pobreza' },
  { numero: 2, nombre: 'Hambre Cero' },
  { numero: 3, nombre: 'Salud y Bienestar' },
  { numero: 4, nombre: 'Educación de Calidad' },
  { numero: 5, nombre: 'Igualdad de Género' },
  { numero: 6, nombre: 'Agua Limpia y Saneamiento' },
  { numero: 7, nombre: 'Energía Asequible y No Contaminante' },
  { numero: 8, nombre: 'Trabajo Decente y Crecimiento Económico' },
  { numero: 9, nombre: 'Industria, Innovación e Infraestructura' },
  { numero: 10, nombre: 'Reducción de las Desigualdades' },
  { numero: 11, nombre: 'Ciudades y Comunidades Sostenibles' },
  { numero: 12, nombre: 'Producción y Consumo Responsables' },
  { numero: 13, nombre: 'Acción por el Clima' },
  { numero: 14, nombre: 'Vida Submarina' },
  { numero: 15, nombre: 'Vida de Ecosistemas Terrestres' },
  { numero: 16, nombre: 'Paz, Justicia e Instituciones Sólidas' },
  { numero: 17, nombre: 'Alianzas para Lograr los Objetivos' },
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
  { value: 'ADICIONALES', label: 'Adicionales', emoji: '🍎' },
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
   * Catálogo de Tipos de Actividad (Aire Libre)
   */
  static async listarTiposActividadAireLibre(soloActivos = false): Promise<TipoActividadAireLibre[]> {
    const { data, error } = await supabase.rpc('api_listar_tipos_actividad_aire_libre', {
      p_solo_activos: soloActivos,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar tipos de actividad');

    return data.tipos || [];
  }

  static async upsertTipoActividadAireLibre(tipo: {
    id?: string | null;
    descripcion: string;
    activo: boolean;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    const { data, error } = await supabase.rpc('api_upsert_tipo_actividad_aire_libre', {
      p_id: tipo.id || null,
      p_descripcion: tipo.descripcion,
      p_activo: tipo.activo,
    });

    if (error) throw error;
    return data;
  }

  static async eliminarTipoActividadAireLibre(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const { data, error } = await supabase.rpc('api_eliminar_tipo_actividad_aire_libre', {
      p_id: id,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Catálogo de Puntos de Encuentro (Aire Libre)
   */
  static async listarPuntosEncuentroAireLibre(soloActivos = false): Promise<PuntoEncuentroAireLibre[]> {
    const { data, error } = await supabase.rpc('api_listar_puntos_encuentro_aire_libre', {
      p_solo_activos: soloActivos,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar puntos de encuentro');

    return data.puntos || [];
  }

  static async upsertPuntoEncuentroAireLibre(punto: {
    id?: string | null;
    lugar: string;
    referencia?: string;
    activo: boolean;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    const { data, error } = await supabase.rpc('api_upsert_punto_encuentro_aire_libre', {
      p_id: punto.id || null,
      p_lugar: punto.lugar,
      p_referencia: punto.referencia || null,
      p_activo: punto.activo,
    });

    if (error) throw error;
    return data;
  }

  static async eliminarPuntoEncuentroAireLibre(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const { data, error } = await supabase.rpc('api_eliminar_punto_encuentro_aire_libre', {
      p_id: id,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Catálogo de Tipos de Costo (Aire Libre)
   */
  static async listarTiposCostoAireLibre(soloActivos = false): Promise<TipoCostoAireLibre[]> {
    const { data, error } = await supabase.rpc('api_listar_tipos_costo_aire_libre', {
      p_solo_activos: soloActivos,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar tipos de costo');

    return data.tipos || [];
  }

  static async upsertTipoCostoAireLibre(tipo: {
    id?: string | null;
    descripcion: string;
    activo: boolean;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    const { data, error } = await supabase.rpc('api_upsert_tipo_costo_aire_libre', {
      p_id: tipo.id || null,
      p_descripcion: tipo.descripcion,
      p_activo: tipo.activo,
    });

    if (error) throw error;
    return data;
  }

  static async eliminarTipoCostoAireLibre(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const { data, error } = await supabase.rpc('api_eliminar_tipo_costo_aire_libre', {
      p_id: id,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Guarda (reemplaza) el detalle de costos de una actividad y recalcula
   * costo_por_participante como la suma de los ítems.
   */
  static async guardarCostosActividad(
    actividadId: string,
    costos: { tipo_costo_id: string; monto: number }[]
  ): Promise<{ costo_por_participante: number }> {
    const { data, error } = await supabase.rpc('api_guardar_costos_actividad', {
      p_actividad_id: actividadId,
      p_costos: costos,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al guardar los costos de la actividad');

    return { costo_por_participante: data.costo_por_participante };
  }

  /**
   * Obtiene el detalle de costos de una actividad (para precargar edición)
   */
  static async obtenerCostosActividad(actividadId: string): Promise<CostoActividad[]> {
    const { data, error } = await supabase.rpc('api_obtener_costos_actividad', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener los costos de la actividad');

    return data.data || [];
  }

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

    // Mapear campos de BD a campos del frontend
    const rawData = data.data;
    return {
      ...rawData,
      // Mapeo BD -> Frontend
      ubicacion: rawData.lugar || rawData.ubicacion || '',
      lugar_detalle: rawData.direccion || rawData.lugar_detalle || '',
    };
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
      punto_encuentro_id: updates.punto_encuentro_id,
      lugar: updates.ubicacion, // ubicacion -> lugar
      direccion: updates.lugar_detalle, // lugar_detalle -> direccion
      costo_por_participante: updates.costo_por_participante,
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
   * Registra puntaje de patrulla de actividad (flujo limpio - solo patrullas_actividad)
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
    const { data, error } = await supabase.rpc('api_registrar_puntaje_patrulla_actividad', {
      p_bloque_id: params.bloque_id,
      p_patrulla_actividad_id: params.patrulla_id,
      p_puntaje: params.puntaje,
      p_observaciones: params.observaciones || null,
      p_subcampo_id: null,
      p_registrado_por: params.registrado_por || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al registrar puntaje');

    return { puntaje_id: data.id };
  }

  /**
   * Registra el puntaje de todas las patrullas para UN bloque en una sola
   * llamada (mismo patrón que ProgramaSemanalService.registrarPuntajesMasivo).
   */
  static async registrarPuntajesMasivoBloque(
    bloqueId: string,
    puntajes: Array<{ patrulla_actividad_id: string; puntaje: number; observaciones?: string }>,
    registradoPor?: string
  ): Promise<{ puntajes_registrados: number }> {
    const { data, error } = await supabase.rpc('api_registrar_puntajes_masivo_bloque', {
      p_bloque_id: bloqueId,
      p_puntajes: puntajes,
      p_registrado_por: registradoPor || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al registrar puntajes');

    return { puntajes_registrados: data.puntajes_registrados };
  }

  /**
   * Puntajes ya registrados para un bloque (para precargar el formulario).
   */
  static async obtenerPuntajesBloque(bloqueId: string): Promise<Array<{
    id: string;
    patrulla_actividad_id: string;
    patrulla_nombre: string;
    color_patrulla?: string;
    puntaje: number;
    observaciones?: string;
  }>> {
    const { data, error } = await supabase.rpc('api_obtener_puntajes_bloque', {
      p_bloque_id: bloqueId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener puntajes');

    return data.data || [];
  }

  /**
   * Obtiene los puntajes de un bloque como mapa { patrulla_actividad_id: puntaje }
   * Usar cuando se necesite acceso directo por ID sin iterar el array.
   */
  static async obtenerPuntajesBloqueMapa(
    bloqueId: string
  ): Promise<Record<string, number>> {
    const { data, error } = await supabase.rpc('api_obtener_puntajes_bloque', {
      p_bloque_id: bloqueId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener puntajes');

    const puntajes: Array<{ patrulla_actividad_id?: string; puntaje?: number }> = data.data || [];
    const resultado: Record<string, number> = {};
    for (const p of puntajes) {
      if (p.patrulla_actividad_id) {
        resultado[p.patrulla_actividad_id] = p.puntaje ?? 0;
      }
    }
    return resultado;
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
    tipo: 'documento' | 'comprobante' | 'imagen' = 'documento'
  ): Promise<{ url: string; nombre: string }> {
    const CARPETAS_POR_TIPO: Record<string, string> = {
      documento: 'documentos',
      comprobante: 'comprobantes',
      imagen: 'imagenes',
    };
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${timestamp}_${safeName}`;
    const filePath = `actividades/${actividadId}/${CARPETAS_POR_TIPO[tipo]}/${fileName}`;

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

  // ============= PATRULLAS POR ACTIVIDAD =============

  /**
   * Listar patrullas de una actividad
   */
  static async listarPatrullasActividad(
    actividadId: string
  ): Promise<PatrullaActividad[]> {
    const { data, error } = await supabase.rpc('api_listar_patrullas_actividad', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar patrullas');

    return data.patrullas || [];
  }

  /**
   * Crear nueva patrulla para la actividad
   */
  static async crearPatrullaActividad(
    actividadId: string,
    patrulla: NuevaPatrullaActividad
  ): Promise<{ id: string }> {
    const { data, error } = await supabase.rpc('api_crear_patrulla_actividad', {
      p_actividad_id: actividadId,
      p_nombre: patrulla.nombre,
      p_color: patrulla.color || '#3B82F6',
      p_icono: patrulla.icono || '🏕️',
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al crear patrulla');

    return { id: data.patrulla_id };
  }

  /**
   * Actualizar patrulla de actividad
   */
  static async actualizarPatrullaActividad(
    patrullaId: string,
    updates: Partial<NuevaPatrullaActividad>
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_patrulla_actividad', {
      p_patrulla_id: patrullaId,
      p_nombre: updates.nombre,
      p_color: updates.color,
      p_icono: updates.icono,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar patrulla');
  }

  /**
   * Eliminar patrulla de actividad
   */
  static async eliminarPatrullaActividad(patrullaId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_patrulla_actividad', {
      p_patrulla_id: patrullaId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar patrulla');
  }

  /**
   * Importar patrullas del sistema a la actividad
   */
  static async importarPatrullasSistema(actividadId: string): Promise<{ cantidad: number }> {
    const { data, error } = await supabase.rpc('api_importar_patrullas_sistema', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al importar patrullas');

    return { cantidad: data.cantidad_importadas || 0 };
  }

  /**
   * Asignar participante a una patrulla
   */
  static async asignarParticipantePatrulla(
    participanteId: string,
    patrullaId: string | null
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_asignar_participante_patrulla', {
      p_participante_id: participanteId,
      p_patrulla_id: patrullaId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al asignar patrulla');
  }

  /**
   * Obtener ranking de patrullas (con filtro opcional por subcampo)
   */
  static async rankingPatrullasActividad(
    actividadId: string,
    subcampoId?: string
  ): Promise<PatrullaActividad[]> {
    const { data, error } = await supabase.rpc('api_ranking_patrullas_actividad', {
      p_actividad_id: actividadId,
      p_subcampo_id: subcampoId || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener ranking');

    return data.ranking || [];
  }

  // ============= SUB CAMPOS =============

  /**
   * Listar subcampos de una actividad
   */
  static async listarSubcampos(actividadId: string): Promise<SubCampo[]> {
    const { data, error } = await supabase.rpc('api_listar_subcampos_actividad', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar subcampos');

    return data.data || [];
  }

  /**
   * Crear nuevo subcampo en una actividad
   */
  static async crearSubcampo(
    actividadId: string,
    subcampo: NuevoSubCampo
  ): Promise<{ id: string }> {
    const { data, error } = await supabase.rpc('api_crear_subcampo_actividad', {
      p_actividad_id: actividadId,
      p_nombre: subcampo.nombre,
      p_responsable_id: subcampo.responsable_id || null,
      p_color: subcampo.color || '#3B82F6',
      p_icono: subcampo.icono || '🚩',
      p_patrullas_ids: subcampo.patrullas_ids || [],
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al crear subcampo');

    return { id: data.id };
  }

  /**
   * Actualizar subcampo
   */
  static async actualizarSubcampo(
    subcampoId: string,
    updates: Partial<NuevoSubCampo>
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_subcampo_actividad', {
      p_subcampo_id: subcampoId,
      p_nombre: updates.nombre,
      p_responsable_id: updates.responsable_id,
      p_color: updates.color,
      p_icono: updates.icono,
      p_patrullas_ids: updates.patrullas_ids,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar subcampo');
  }

  /**
   * Eliminar subcampo
   */
  static async eliminarSubcampo(subcampoId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_subcampo_actividad', {
      p_subcampo_id: subcampoId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar subcampo');
  }

  /**
   * Obtener ranking por sub campo
   */
  static async rankingPorSubcampo(
    actividadId: string,
    subcampoId?: string
  ): Promise<any[]> {
    const { data, error } = await supabase.rpc('api_ranking_por_subcampo', {
      p_actividad_id: actividadId,
      p_subcampo_id: subcampoId || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener ranking');

    return data.data || [];
  }

  // ============= INVENTARIO =============

  /**
   * Listar inventario de una actividad
   */
  static async listarInventario(actividadId: string): Promise<ItemInventario[]> {
    const { data, error } = await supabase.rpc('api_listar_inventario_actividad', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al listar inventario');

    return data.items || [];
  }

  /**
   * Agregar item(s) al inventario
   * Si crearIndividuales=true y cantidad > 1, crea múltiples items individuales
   * Si crearIndividuales=false, crea 1 solo registro con la cantidad indicada
   */
  static async agregarItemInventario(
    actividadId: string,
    item: NuevoItemInventario,
    crearIndividuales: boolean = true
  ): Promise<{ item_id: string; item_ids?: string[]; cantidad_creada?: number }> {
    // Si NO quiere items individuales, crear 1 solo con cantidad
    const cantidadACrear = crearIndividuales ? (item.cantidad || 1) : 1;
    const cantidadDelItem = crearIndividuales ? 1 : (item.cantidad || 1);
    
    const { data, error } = await supabase.rpc('api_agregar_item_inventario', {
      p_actividad_id: actividadId,
      p_nombre: item.nombre,
      p_descripcion: item.descripcion || null,
      p_categoria: item.categoria || 'GENERAL',
      p_cantidad: cantidadACrear,
      p_cantidad_item: cantidadDelItem, // Nueva: cantidad real del item
      p_tipo_propiedad: item.tipo_propiedad || 'PROPIO',
      p_prestado_por: item.prestado_por || null,
      p_contacto_prestador: item.contacto_prestador || null,
      p_asignado_a: item.asignado_a || null,
      p_tipo_asignacion: item.tipo_asignacion || null,
      p_observaciones: item.observaciones || null,
      p_grupo: item.grupo || null,
      p_prefijo_codigo: crearIndividuales ? (item.prefijo_codigo || null) : null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al agregar item');

    return { 
      item_id: data.item_id,
      item_ids: data.item_ids,
      cantidad_creada: data.cantidad_creada
    };
  }

  /**
   * Actualizar item del inventario
   */
  static async actualizarItemInventario(
    itemId: string,
    updates: Partial<NuevoItemInventario> & { 
      estado?: string; 
      condicion?: string;
      codigo_item?: string;
      fecha_asignacion?: string;
    }
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_actualizar_item_inventario', {
      p_item_id: itemId,
      p_codigo_item: updates.codigo_item,
      p_grupo: updates.grupo,
      p_nombre: updates.nombre,
      p_descripcion: updates.descripcion,
      p_categoria: updates.categoria,
      p_cantidad: updates.cantidad,
      p_tipo_propiedad: updates.tipo_propiedad,
      p_prestado_por: updates.prestado_por,
      p_contacto_prestador: updates.contacto_prestador,
      p_asignado_a: updates.asignado_a,
      p_tipo_asignacion: updates.tipo_asignacion,
      p_fecha_asignacion: updates.fecha_asignacion,
      p_estado: updates.estado,
      p_condicion: updates.condicion,
      p_observaciones: updates.observaciones,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar item');
  }

  /**
   * Registrar daño o baja de item
   */
  static async registrarIncidenteInventario(
    itemId: string,
    tipo: 'DAÑO' | 'BAJA',
    descripcion: string,
    nuevaCondicion?: string
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_registrar_incidente_inventario', {
      p_item_id: itemId,
      p_tipo: tipo,
      p_descripcion: descripcion,
      p_nueva_condicion: nuevaCondicion || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al registrar incidente');
  }

  /**
   * Marcar item como devuelto al propietario
   */
  static async marcarDevueltoInventario(
    itemId: string,
    fechaDevolucion?: string,
    notasDevolucion?: string,
    condicionDevolucion?: string
  ): Promise<void> {
    const { data, error } = await supabase.rpc('api_marcar_devuelto_inventario', {
      p_item_id: itemId,
      p_notas_devolucion: notasDevolucion || null,
      p_condicion_devolucion: condicionDevolucion || null,
      p_fecha_devolucion: fechaDevolucion || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al marcar como devuelto');
  }

  /**
   * Transferir item a otro tenedor (préstamo en cadena: A→B→C)
   * El dueño original (prestado_por) no cambia, solo cambia quién lo tiene ahora
   */
  static async transferirItemInventario(
    itemId: string,
    nuevoTenedor: string,
    notas?: string
  ): Promise<{ tenedor_anterior: string; tenedor_nuevo: string; historial: any[] }> {
    const { data, error } = await supabase.rpc('api_transferir_item_inventario', {
      p_item_id: itemId,
      p_nuevo_tenedor: nuevoTenedor,
      p_notas: notas || null,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al transferir item');
    
    return {
      tenedor_anterior: data.tenedor_anterior,
      tenedor_nuevo: data.tenedor_nuevo,
      historial: data.historial || [],
    };
  }

  /**
   * Eliminar item del inventario
   */
  static async eliminarItemInventario(itemId: string): Promise<void> {
    const { data, error } = await supabase.rpc('api_eliminar_item_inventario', {
      p_item_id: itemId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar item');
  }

  /**
   * Obtener historial de movimientos de un item
   */
  static async historialItemInventario(itemId: string): Promise<MovimientoInventario[]> {
    const { data, error } = await supabase.rpc('api_historial_item_inventario', {
      p_item_id: itemId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener historial');

    return data.movimientos || [];
  }

  /**
   * Dashboard de inventario
   */
  static async dashboardInventario(actividadId: string): Promise<DashboardInventario> {
    const { data, error } = await supabase.rpc('api_dashboard_inventario_actividad', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener dashboard');

    return {
      total_items: data.total_items,
      prestados: data.prestados,
      devueltos: data.devueltos || 0,
      pendientes_devolucion: data.pendientes_devolucion,
      dañados: data.dañados,
      por_categoria: data.por_categoria || [],
      por_estado: data.por_estado || [],
      por_grupo: data.por_grupo || [],
      por_prestador: data.por_prestador || [],
    };
  }

  /**
   * Reporte consolidado de INGRESOS (agrupado por producto)
   */
  static async reporteInventarioIngresos(actividadId: string): Promise<{
    data: {
      producto: string;
      categoria: string;
      tipo_propiedad: string;
      prestado_por: string | null;
      contacto: string | null;
      cantidad_ingresada: number;
      cantidad_devuelta: number;
      cantidad_pendiente: number;
      cantidad_dañada: number;
    }[];
    resumen: {
      total_productos: number;
      total_items: number;
      total_prestados: number;
      total_propios: number;
      pendientes_devolucion: number;
    };
  }> {
    const { data, error } = await supabase.rpc('api_reporte_inventario_ingresos', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener reporte');

    return {
      data: data.data || [],
      resumen: data.resumen || {},
    };
  }

  /**
   * Reporte consolidado de SALIDAS/DEVOLUCIONES (agrupado por producto y prestador)
   */
  static async reporteInventarioSalidas(actividadId: string): Promise<{
    data: {
      producto: string;
      prestado_por: string;
      contacto: string | null;
      cantidad_prestada: number;
      cantidad_devuelta: number;
      cantidad_pendiente: number;
      en_buen_estado: number;
      dañados: number;
      estado_general: string;
    }[];
    resumen: {
      total_prestadores: number;
      total_items_prestados: number;
      total_devueltos: number;
      total_pendientes: number;
      porcentaje_devuelto: number;
    };
  }> {
    const { data, error } = await supabase.rpc('api_reporte_inventario_salidas', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener reporte');

    return {
      data: data.data || [],
      resumen: data.resumen || {},
    };
  }

  /**
   * Reporte por PRESTADOR (qué devolverle a cada persona)
   */
  static async reportePorPrestador(actividadId: string): Promise<{
    prestador: string;
    contacto: string | null;
    items: { producto: string; cantidad: number; devueltos: number; condicion: string }[];
    total_items: number;
    devueltos: number;
    pendientes: number;
    estado: string;
  }[]> {
    const { data, error } = await supabase.rpc('api_reporte_por_prestador', {
      p_actividad_id: actividadId,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error al obtener reporte');

    return data.prestadores || [];
  }
}

export default ActividadesExteriorService;
