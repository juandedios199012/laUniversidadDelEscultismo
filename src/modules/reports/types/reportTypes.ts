/**
 * Tipos y interfaces para el módulo de reportes
 */

// Tipos de reportes disponibles
export enum ReportType {
  SCOUT_PROFILE = 'scout_profile',
  ATTENDANCE_ADVANCED = 'attendance_advanced',
  ATTENDANCE_MATRIX = 'attendance_matrix',
  PROGRESS = 'progress',
  GROUP_SUMMARY = 'group_summary',
  ACTIVITY_HISTORY = 'activity_history',
  DNGI03 = 'dngi03',
  // Nuevos reportes (Opción C)
  RANKING_PATRULLAS = 'ranking_patrullas',
  DASHBOARD_EJECUTIVO = 'dashboard_ejecutivo',
  REPORTE_FINANCIERO = 'reporte_financiero',
  REPORTE_FINANCIERO_RAMA = 'reporte_financiero_rama',
  PERSONAS_INGRESOS = 'personas_ingresos',
  MOVIMIENTOS_POR_TIPO = 'movimientos_por_tipo',
  INGRESOS_POR_CONCEPTO = 'ingresos_por_concepto',
  ESTADO_CUENTA_PERSONA = 'estado_cuenta_persona',
  REPORTE_ACTIVIDADES = 'reporte_actividades',
  REPORTE_INVENTARIO = 'reporte_inventario',
  // Reporte Excel con todos los campos
  SCOUTS_EXCEL_COMPLETO = 'scouts_excel_completo',
  // Reporte de Especialidades (migrado desde módulo)
  ESPECIALIDADES = 'especialidades',
  // Reporte de Especialidades DETALLADO (cada especialidad por scout)
  ESPECIALIDADES_DETALLE = 'especialidades_detalle',
  // Reporte de Historia Médica
  HISTORIA_MEDICA = 'historia_medica',
  // Reportes masivos de impresión
  DNI_SCOUTS = 'dni_scouts',
  DNGI03_WORD_POR_SCOUT = 'dngi03_word_por_scout',
  DNI_SCOUT_APODERADO_POR_SCOUT = 'dni_scout_apoderado_por_scout',
  // Autorización del Padre o Apoderado (ANEXO 4, identificación por Scout)
  AUTORIZACION_PADRE_APODERADO = 'autorizacion_padre_apoderado',
}

// Formatos de exportación
export enum ExportFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  XLSX = 'xlsx',
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
  esApoderado?: boolean;
  // URLs de documento de identidad del familiar (anverso y reverso)
  dniAnversoUrl?: string;
  dniReversoUrl?: string;
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

// Datos de progreso de ETAPAS (Pista, Senda, Rumbo, Travesía)
export interface ProgressData {
  scoutId: string;
  scoutNombre: string;
  edad: number;  // Edad del scout
  etapa: string;  // Nombre de la etapa actual
  etapaCodigo: string;  // PISTA, SENDA, RUMBO, TRAVESIA
  etapaIcono?: string;
  etapaColor?: string;
  fechaInicio: string;
  fechaFinalizacion?: string;
  estado: 'en_progreso' | 'completado' | 'pendiente';
  porcentaje: number;
  areas?: ProgressAreaData[];  // Progreso por área de crecimiento
}

// Datos de progreso por área de crecimiento
export interface ProgressAreaData {
  area: string;
  icono?: string;
  completados: number;
  total: number;
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
  year?: number;
  monthFrom?: string;
  monthTo?: string;
  categoria?: string;
  estado?: string;
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

// Datos de Especialidades (Dashboard para Dirigentes y Padres)
export interface EspecialidadProgresoData {
  id: string;
  scoutId: string;
  especialidadId: string;
  especialidadNombre: string;
  especialidadArea: string;
  areaColor: string;
  estado: 'exploracion' | 'taller' | 'desafio' | 'completada';
  fechaInicio: string;
  fechaCompletado?: string;
  porcentajeAvance: number;
  fasesCompletadas: {
    exploracion: boolean;
    taller: boolean;
    desafio: boolean;
  };
}

export interface EspecialidadesScoutData {
  scoutId: string;
  codigoScout: string;
  nombreCompleto: string;
  rama: string;
  patrulla?: string;
  fotoUrl?: string;
  especialidades: EspecialidadProgresoData[];
  resumen: {
    total: number;
    completadas: number;
    enProgreso: number;
    porcentajeGeneral: number;
  };
}

// ============= HISTORIA MÉDICA REPORT DATA =============
// Fuente: Step Salud del módulo Scout (personas / salud_*), NO el modal
// "Historia Médica" (historias_medicas / historia_*), que ya no se usa.

// Condición médica para reporte
export interface CondicionMedicaReportData {
  condicion: string;
  /** Texto libre, no fecha estricta (Step Salud) */
  fechaAtencion?: string;
}

// Alergia para reporte
export interface AlergiaReportData {
  alergia: string;
  mencionar?: string;
}

// Medicamento para reporte
export interface MedicamentoReportData {
  medicamento: string;
  dosis?: string;
  frecuencia?: string;
  activo: boolean;
  /** Texto libre, no fecha estricta (Step Salud) */
  fechaInicioDuracion?: string;
}

// Vacuna para reporte
export interface VacunaReportData {
  vacuna: string;
  /** Texto libre, no fecha estricta (Step Salud) */
  fechaUltimaDosis?: string;
}

// Datos completos de Historia Médica para reportes
export interface HistoriaMedicaReportData {
  // Datos del Scout
  scoutId: string;
  codigoScout: string;
  numeroDocumento?: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  edad: number;
  sexo?: string;
  direccion?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string; // Región
  rama: string;
  patrulla?: string;
  telefonoCasa?: string; // Teléfono fijo del scout (step Contacto)
  
  // Contacto de emergencia (Familiar 1)
  contactoEmergencia?: {
    nombre: string;
    parentesco: string;
    celular: string;
    telefono?: string;
    direccion?: string;
    numeroDocumento?: string;
  };
  
  // Contacto alternativo (Familiar 2)
  contactoAlternativo?: {
    nombre: string;
    parentesco: string;
    celular: string;
  };
  
  // Fecha impresa en el documento (editable al exportar, no viene de BD)
  fechaLlenado: string;
  estaturaCm?: number;
  pesoKg?: number;

  // Seguro médico (Step Salud)
  seguroMedico?: string;

  // Datos de sangre (Step Salud)
  grupoSanguineo?: string;
  factorSanguineo?: string;

  // Discapacidad (Step Salud)
  tipoDiscapacidad?: string;
  carnetConadis?: string;
  descripcionDiscapacidad?: string;
  
  // Listas
  condiciones: CondicionMedicaReportData[];
  alergias: AlergiaReportData[];
  medicamentos: MedicamentoReportData[];
  vacunas: VacunaReportData[];
}

// ============= AUTORIZACIÓN DEL PADRE O APODERADO (ANEXO 4) =============
// Fuente: api_obtener_scout (misma RPC que Historia Médica). Solo se
// autocompletan los datos de identificación (scout + apoderado legal) y la
// fecha del documento; la tabla de datos de la actividad queda en blanco
// para llenarla a mano en cada actividad.

export interface AutorizacionApoderadoReportData {
  scoutId: string;
  codigoScout: string;
  numeroDocumento?: string; // DNI del niño/a/joven
  nombreCompleto: string;
  sexo?: string;

  // Familiar marcado como "Apoderado Legal" en el módulo Scout (o el
  // primer familiar/contacto de emergencia si ninguno está marcado)
  apoderado: {
    nombre: string;
    numeroDocumento?: string;
    tipo: 'PADRE' | 'MADRE' | 'APODERADO';
  } | null;

  // Fecha impresa en el documento (seleccionada al exportar, no viene de BD)
  fechaDocumento: string;
}

export interface EspecialidadesReportData {
  filtroRama?: string;
  fechaGeneracion: Date;
  periodo?: { inicio: string; fin: string };
  // Dashboard global
  dashboard: {
    totalScouts: number;
    totalAsignaciones: number;
    especialidadesCompletadas: number;
    especialidadesEnProgreso: number;
    promedioEspecialidadesPorScout: number;
    tasaCompletado: number;
    // Por rama
    porRama: {
      rama: string;
      scouts: number;
      especialidades: number;
      completadas: number;
      porcentaje: number;
    }[];
    // Por área
    porArea: {
      area: string;
      color: string;
      total: number;
      completadas: number;
      porcentaje: number;
    }[];
    // Top especialidades más populares
    topEspecialidades: {
      nombre: string;
      area: string;
      asignaciones: number;
      completadas: number;
    }[];
    // Scouts destacados
    scoutsDestacados: {
      nombre: string;
      rama: string;
      especialidadesCompletadas: number;
    }[];
  };
  // Detalle por scout
  scouts: EspecialidadesScoutData[];
}
