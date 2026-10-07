/**
 * Tipos de datos para los Anexos PDF del módulo Aire Libre (Anexo 1, 3, 4).
 * Se arman en `anexosAireLibreService.ts` a partir de
 * `ActividadExteriorCompleta` + identidad del grupo (plantilla de carta,
 * Comisionado Local) — los templates solo reciben estos objetos ya listos.
 */

export interface FirmanteGrupo {
  nombre?: string;
  cargo?: string;
  dni?: string;
}

export interface Anexo1Data {
  nombreActividad: string;
  tipoActividad: string;
  ramas?: string;
  lugar: string;
  fechaInicio: string;
  fechaFin: string;
  horaConcentracion?: string;
  costoPorParticipante: number;
  presupuestoReal?: number;
  adultoResponsable?: string;
  responsableSalud?: string;
  responsableSFH?: string;
  jefeGrupo: FirmanteGrupo;
  comisionadoLocal?: string;
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
