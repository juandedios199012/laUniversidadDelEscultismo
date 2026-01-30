/**
 * Tipos y interfaces para el módulo de reportes
 */

// Tipos de reportes disponibles
export enum ReportType {
  SCOUT_PROFILE = 'scout_profile',
  ATTENDANCE = 'attendance',
  PROGRESS = 'progress',
  GROUP_SUMMARY = 'group_summary',
  ACTIVITY_HISTORY = 'activity_history',
  DNGI03 = 'dngi03',
  // Nuevos reportes (Opción C)
  INSCRIPCIONES_ANUALES = 'inscripciones_anuales',
  RANKING_PATRULLAS = 'ranking_patrullas',
  CONTACTOS_EMERGENCIA = 'contactos_emergencia',
  DOCUMENTACION_PENDIENTE = 'documentacion_pendiente',
}

// Formatos de exportación
export enum ExportFormat {
  PDF = 'pdf',
  DOCX = 'docx',
}

// Estado del reporte
export enum ReportStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  SUCCESS = 'success',
  ERROR = 'error',
}

// Configuración de reporte
export interface ReportConfig {
  type: ReportType;
  format: ExportFormat;
  title: string;
  subtitle?: string;
  includeDate?: boolean;
  includePageNumbers?: boolean;
  orientation?: 'portrait' | 'landscape';
}

// Datos del Familiar para reportes
export interface FamiliarReportData {
  id?: string;
  nombres: string;
  apellidos: string;
  sexo?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  parentesco?: string;
  correo?: string;
  correoSecundario?: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  profesion?: string;
  centroLaboral?: string;
  cargo?: string;
  celular?: string;
  celularSecundario?: string;
  telefono?: string;
  esContactoEmergencia?: boolean;
  esAutorizadoRecoger?: boolean;
}

// Datos del Scout para reportes
export interface ScoutReportData {
  id: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  edad: number;
  sexo?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  rama: string;
  patrulla?: string;
  numeroRegistro: string;
  fechaIngreso: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  centroEstudio?: string;
  telefono?: string;
  telefonoSecundario?: string;
  celular?: string;
  celularSecundario?: string;
  email?: string;
  correoSecundario?: string;
  correoInstitucional?: string;
  // Datos académicos
  anioEstudios?: string;
  // Datos religiosos
  religion?: string;
  // Datos médicos y de salud
  grupoSanguineo?: string;
  factorSanguineo?: string;
  seguroMedico?: string;
  tipoDiscapacidad?: string;
  carnetConadis?: string;
  descripcionDiscapacidad?: string;
  // Datos adicionales (Opción B - campos disponibles en BD)
  pais?: string;
  fotoUrl?: string;
  codigoPostal?: string;
  ocupacion?: string;
  centroLaboral?: string;
  fechaUltimoPago?: string;
  codigoAsociado?: string;
  observacionesScout?: string;
  estadoScout?: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'ELIMINADO';
  // Array dinámico de familiares
  familiares?: FamiliarReportData[];
  // Datos del padre/tutor/apoderado (LEGACY - mantener para compatibilidad)
  nombrePadre?: string;
  apellidoPadre?: string;
  sexoPadre?: string;
  tipoDocumentoPadre?: string;
  numeroDocumentoPadre?: string;
  celularPadre?: string;
  telefonoPadre?: string;
  correoPadre?: string;
  direccionPadre?: string;
  departamentoPadre?: string;
  provinciaPadre?: string;
  distritoPadre?: string;
  parentesco?: string;
  ocupacionPadre?: string;
  // Datos de la madre (opcional, segundo familiar - LEGACY)
  nombreMadre?: string;
  apellidoMadre?: string;
  contactoEmergencia?: string;
  observaciones?: string;
}

// Datos de asistencia
export interface AttendanceData {
  scoutId: string;
  scoutNombre: string;
  fecha: string;
  presente: boolean;
  justificado: boolean;
  motivo?: string;
}

// Datos de progreso
export interface ProgressData {
  scoutId: string;
  scoutNombre: string;
  especialidad: string;
  nivel: string;
  fechaInicio: string;
  fechaFinalizacion?: string;
  estado: 'en_progreso' | 'completado' | 'pendiente';
  porcentaje: number;
}

// Resumen de grupo
export interface GroupSummaryData {
  grupoNombre: string;
  totalScouts: number;
  scoutsPorRama: Record<string, number>;
  asistenciaPromedio: number;
  actividadesRealizadas: number;
  periodo: {
    inicio: string;
    fin: string;
  };
}

// Historial de actividades
export interface ActivityHistoryData {
  id: string;
  fecha: string;
  nombre: string;
  tipo: string;
  descripcion: string;
  participantes: number;
  duracion: string;
  lugar: string;
}

// Metadata del reporte
export interface ReportMetadata {
  generatedAt: Date;
  generatedBy: string;
  version: string;
  organizacion: string;
  logo?: string;
}

// Opciones de filtrado
export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  rama?: string;
  patrulla?: string;
  scoutIds?: string[];
}

// Resultado de generación de reporte
export interface ReportGenerationResult {
  status: ReportStatus;
  blob?: Blob;
  fileName: string;
  error?: string;
}

// Plantilla de reporte
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  supportedFormats: ExportFormat[];
  customizable: boolean;
}

// Datos de Inscripciones Anuales (Nuevo)
export interface InscripcionAnualData {
  id: string;
  scoutId: string;
  codigoScout: string;
  nombreCompleto: string;
  rama: string;
  ano: number;
  fechaInscripcion: string;
  montoInscripcion: number;
  fechaPago?: string;
  estadoPago: string;
  documentosCompletos: boolean;
  certificadoMedico: boolean;
  autorizacionPadres: boolean;
  activo: boolean;
}

// Datos de Puntos de Patrulla (Nuevo)
export interface PuntosPatrullaData {
  patrullaId: string;
  patrullaNombre: string;
  rama: string;
  puntajes: {
    concepto: string;
    puntos: number;
    fecha: string;
    actividad?: string;
    otorgadoPor?: string;
  }[];
  totalPuntos: number;
  posicion: number;
}

// Datos de Contacto de Emergencia (Nuevo)
export interface ContactoEmergenciaData {
  scoutId: string;
  codigoScout: string;
  nombreScout: string;
  apellidoScout: string;
  rama: string;
  contactos: {
    nombre: string;
    apellido: string;
    parentesco: string;
    celular: string;
    celularSecundario?: string;
    telefono?: string;
    correo?: string;
    esPrincipal: boolean;
    autorizadoRecoger: boolean;
  }[];
  datosMedicos: {
    grupoSanguineo?: string;
    factorSanguineo?: string;
    seguroMedico?: string;
    tipoDiscapacidad?: string;
    alergias?: string;
  };
}

// Datos de Documentación Pendiente (Nuevo)
export interface DocumentacionPendienteData {
  scoutId: string;
  codigoScout: string;
  nombreCompleto: string;
  rama: string;
  ano: number;
  documentosFaltantes: string[];
  certificadoMedico: boolean;
  autorizacionPadres: boolean;
  estadoPago: string;
  fechaLimite?: string;
}
