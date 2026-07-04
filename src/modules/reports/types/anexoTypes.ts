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
  costoPorParticipante: number;
  adultoResponsable?: string;
  adultosAcompanantes?: string;
  fechaDocumento: string;
  equipamientoObligatorio?: string;
  equipamientoOpcional?: string;
  recomendaciones?: string;
}
