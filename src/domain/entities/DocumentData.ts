// ================================================================
// 📊 Main Document Data Interface
// ================================================================

export interface DocumentData {
  scout: ScoutData;
  family?: {
    padre?: FamiliarDocumentData;
    madre?: FamiliarDocumentData;
    apoderado?: FamiliarDocumentData;
    familiares?: FamiliarDocumentData[];
  };
  group?: GroupDocumentData;
  activity?: ActivityDocumentData;
  generatedAt: Date;
  generatedBy: string;
  version: string;
  metadata: DocumentGenerationMetadata;
}

// ================================================================
// 📊 Document Generation Metadata
// ================================================================

// ================================================================
// 👤 Scout Personal Data
// ================================================================

export interface ScoutData {
  // Datos personales básicos
  nombres: string;
  apellidos: string;
  fechaNacimiento: Date;
  edad: number;
  sexo: string;
  tipoDocumento: string;
  numeroDocumento: string;
  celular?: string;
  correo?: string;
  correoInstitucional?: string;
  correoPersonal?: string;
  telefonoDomicilio?: string;
  religion?: string;

  // Dirección
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
  codigoPostal?: string;

  // Información educativa/laboral
  centroEstudio?: string;
  centroEstudios?: string;
  anoEstudios?: string;
  ocupacion?: string;
  centroLaboral?: string;

  // Información Scout específica
  codigoScout: string;
  ramaActual: string;
  estado: string;
  fechaIngreso: Date;
  tiempoEnMovimiento?: string;
  region?: string;
  localidad?: string;
  numeral?: string;
  unidad?: string;
  patrulla?: {
    nombre: string;
    cargo?: string;
  };

  // Información médica
  medico?: {
    grupoSanguineo?: string;
    factorSanguineo?: string;
    seguroMedico?: string;
    tipoDiscapacidad?: string;
    carneConadis?: string;
    discapacidadDetalle?: string;
  };

  // Contacto de emergencia
  contactoEmergencia: {
    nombre: string;
    parentesco: string;
    celular: string;
    celularAlternativo?: string;
    direccion?: string;
  };

  // Observaciones
  observaciones?: string;
}

export interface FamiliarDocumentData {
  nombres: string;
  apellidos: string;
  parentesco: 'PADRE' | 'MADRE' | 'TUTOR' | 'HERMANO' | 'TIO' | 'ABUELO' | 'OTRO';
  sexo: string;
  tipoDocumento: string;
  numeroDocumento: string;
  correo1?: string;
  correo2?: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  profesion?: string;
  centroLaboral?: string;
  cargo?: string;
  celular1?: string;
  celular2?: string;
  telefonoDomicilio?: string;
  esContactoEmergencia: boolean;
  esAutorizadoRecoger: boolean;
  esApoderado?: boolean;
  firma?: string; // base64 de imagen de firma
  huellaDigital?: string; // base64 de imagen de huella
}

export interface ContactoEmergenciaData {
  nombre: string;
  parentesco: string;
  celular: string;
  celularAlternativo?: string;
  direccion?: string;
}

export interface InformacionMedicaData {
  tipoSangre?: string;
  alergias?: string[];
  medicamentos?: string[];
  condicionesMedicas?: string[];
  contactoMedicoEmergencia?: {
    nombre: string;
    telefono: string;
    especialidad?: string;
  };
  seguroMedico?: {
    compania: string;
    numeroPoliza: string;
    vigencia: Date;
  };
}

export interface PatrullaInfo {
  id: string;
  nombre: string;
  animalTotem: string;
  color: string;
  cargo: string;
}

export interface GroupDocumentData {
  id: string;
  codigoGrupo: string;
  nombre: string;
  numero: string;
  numeral: string;
  localidad: string;
  region: string;
  fechaFundacion: Date;
  fundador?: string;
  lugarReunion: string;
  direccionSede: string;
  telefonoContacto?: string;
  emailContacto?: string;
  sitioWeb?: string;
  dirigentes: DirigenteDocumentData[];
  estadisticas: EstadisticasGrupo;
}

export interface DirigenteDocumentData {
  id: string;
  nombres: string;
  apellidos: string;
  cargo: 'JEFE_GRUPO' | 'SUBJEFE_GRUPO' | 'JEFE_RAMA' | 'SUBJEFE_RAMA' | 'DIRIGENTE' | 'ASISTENTE';
  ramaResponsable?: 'Manada' | 'Tropa' | 'Caminantes' | 'Clan' | 'Dirigentes';
  fechaInicioCargo: Date;
  estado: 'ACTIVO' | 'INACTIVO' | 'LICENCIA' | 'SUSPENDIDO';
  certificaciones: string[];
  contacto?: {
    celular?: string;
    correo?: string;
  };
}

export interface EstadisticasGrupo {
  totalScouts: number;
  scoutsPorRama: {
    Lobatos: number;
    Scouts: number;
    Rovers: number;
    Dirigentes: number;
  };
  totalDirigentes: number;
  fechaUltimaActualizacion: Date;
}

export interface ActivityDocumentData {
  id: string;
  nombre: string;
  tipo: 'REUNION' | 'CAMPAMENTO' | 'EXCURSION' | 'SERVICIO' | 'CEREMONIA' | 'CAPACITACION' | 'OTRO';
  fechaInicio: Date;
  fechaFin?: Date;
  ubicacion: string;
  participantes: ParticipanteActividad[];
  responsable: DirigenteDocumentData;
}

export interface ParticipanteActividad {
  scoutId: string;
  nombres: string;
  apellidos: string;
  rama: string;
  asistencia: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO';
  observaciones?: string;
}

export interface DocumentGenerationMetadata {
  templateId: string;
  templateVersion: string;
  generatedAt: Date;
  generatedBy: string;
  purpose: string;
  validUntil?: Date;
  documentNumber?: string;
  documentType?: string;
  scoutId?: string;
  customFields?: Record<string, any>;
}

// ================================================================
// 🎯 Data Transformation Types
// ================================================================

export interface DocumentDataMapper {
  mapScoutData(scout: any): ScoutData;
  mapGroupData(group: any): GroupDocumentData;
  mapActivityData(activity: any): ActivityDocumentData;
  mapCustomData(data: any, mapping: FieldMapping[]): Record<string, any>;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: (value: any) => any;
  format?: string;
  defaultValue?: any;
}