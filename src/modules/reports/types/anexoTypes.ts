/**
 * Tipos de datos para los Anexos PDF del módulo Aire Libre (Anexo 1, 3, 4).
 * Se arman en `anexosAireLibreService.ts` a partir de
 * `ActividadExteriorCompleta` + Aprobadores + Jefe de Grupo
 * (módulo Dirigentes) — los templates solo reciben estos objetos ya listos.
 */

/** Jefe de Grupo (módulo Dirigentes) y su Grupo Scout. */
export interface JefeGrupoAnexo {
  nombre?: string;
  dni?: string;
  cargo?: string;
  firmaBase64?: string;
  /** Ej: "Grupo Scout Lima 12" */
  nombreGrupo?: string;
  /** Ej: "Lima" */
  localidad?: string;
  /** Ej: "Lima 12" */
  localidadNumeral?: string;
}

export interface Anexo1Data {
  /** Aprobador a quien va dirigida la solicitud */
  destinatario?: { nombre: string; cargo: string };
  jefeGrupo: JefeGrupoAnexo;
  nombreActividad: string;
  tipoActividad: string;
  ramas?: string;
  lugar: string;
  /** Mismo formato que el Anexo 4 (fechas y horas de la actividad) */
  fechaHora: string;
  costoPorParticipante: number;
  presupuestoReal?: number;
  adultoResponsable?: string;
  responsableSalud?: string;
  responsableSFH?: string;
  /** ISO "YYYY-MM-DD" */
  fechaDocumento: string;
}

export interface Anexo3Joven {
  nombreCompleto: string;
  dni?: string;
  edad?: number;
  codigoAsociado?: string;
  contactoEmergencia?: string;
  numeroContacto?: string;
}

export interface Anexo3Adulto {
  nombreCompleto: string;
  dni?: string;
  edad?: number;
  rol: string;
  codigoAsociado?: string;
  telefono?: string;
}

export interface Anexo3Data {
  nombreActividad: string;
  fecha: string;
  rama?: string;
  miembrosJuveniles: Anexo3Joven[];
  adultosVoluntarios: Anexo3Adulto[];
}

export interface Anexo4Data {
  nombreActividad: string;
  lugar: string;
  fechaInicio: string;
  fechaFin: string;
  horaConcentracion?: string;
  horaFin?: string;
  costoPorParticipante: number;
  presupuestoReal?: number;
  director?: string;
  dirigenteResponsable?: string;
  adultosAcompanantes?: string;
  colaborador?: string;
  adultoResponsable?: string;
  fechaDocumento: string;
  equipamientoObligatorio?: string;
  equipamientoOpcional?: string;
  recomendaciones?: string;
  /** Textos configurados (Aire Libre → Textos Anexo 4). Sin valor → textos por defecto. */
  declaraciones?: string[];
  itemsQueLlevarDefault?: string[];
}

export interface ReporteFinancieroIngreso {
  nombre: string;
  cuota: number;
  pagado: number;
}

export interface ReporteFinancieroCategoria {
  categoria: string;
  estimado: number;
  real: number;
}

export interface ReporteFinancieroItem {
  categoria: string;
  origen?: string;
  concepto: string;
  cantidad: number;
  unidad?: string;
  precioUnitario: number;
  subtotalEstimado: number;
  subtotalReal: number;
  proveedor?: string;
}

export interface ReporteFinancieroCompra {
  fecha: string;
  concepto: string;
  categoria?: string;
  proveedor?: string;
  comprobante?: string;
  monto: number;
}

export interface ReporteFinancieroData {
  nombreActividad: string;
  lugar: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  fechaDocumento: string;
  costoPorParticipante: number;
  // Resumen
  cuotasEsperadas: number;
  recaudado: number;
  totalEstimado: number;
  totalGastado: number;
  totalPendienteCompra: number;
  // Detalle
  ingresos: ReporteFinancieroIngreso[];
  categorias: ReporteFinancieroCategoria[];
  itemsComprados: ReporteFinancieroItem[];
  comprasDirectas: ReporteFinancieroCompra[];
  itemsPendientes: ReporteFinancieroItem[];
}
