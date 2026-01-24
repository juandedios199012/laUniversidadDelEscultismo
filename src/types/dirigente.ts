/**
 * Tipos para el módulo de Dirigentes
 * Basado en formato DNGI-02 - Registro Institucional para Adultos Voluntarios
 * Versión 2.1
 */

// ============================================================================
// ENUMS
// ============================================================================

export type CargoDirigente = 
  | 'JEFE_GRUPO'
  | 'SUBJEFE_GRUPO'
  | 'JEFE_RAMA'
  | 'SUBJEFE_RAMA'
  | 'DIRIGENTE'
  | 'ASISTENTE'
  | 'ASESOR'
  | 'INSTRUCTOR'
  | 'COORDINADOR'
  | 'COLABORADOR';

export type NivelFormacion = 
  | 'SIN_FORMACION'
  | 'SFH1'
  | 'INAF'
  | 'CAB'
  | 'CAF'
  | 'INSIGNIA_MADERA';

export type TipoMembresia = 
  | 'REGISTRO_ANUAL_REGULAR'
  | 'REGISTRO_ANUAL_ESPECIAL'
  | 'VOLUNTARIO_TEMPORAL';

export type EstadoDocumento = 
  | 'PENDIENTE'
  | 'VERIFICADO'
  | 'VENCIDO'
  | 'RECHAZADO';

export type EstadoDirigente = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'RETIRADO';

export type Rama = 'MANADA' | 'TROPA' | 'COMUNIDAD' | 'CLAN' | 'GRUPO';

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

export interface ContactoEmergencia {
  nombre: string;
  telefono: string;
  parentesco: string;
}

export interface DocumentoDirigente {
  id: string;
  tipo: string;
  nombre: string;
  url: string;
  estado: EstadoDocumento;
  fecha_vencimiento?: string;
}

export interface FormacionDirigente {
  id: string;
  tipo: string;
  nombre: string;
  institucion?: string;
  fecha_certificado?: string;
  numero_certificado?: string;
  archivo_url?: string;
  estado: EstadoDocumento;
}

export interface HistorialAsignacion {
  rama: Rama;
  cargo: CargoDirigente;
  grupo?: string;
  fecha_inicio: string;
  fecha_fin?: string;
}

export interface PersonaDirigente {
  id: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento?: string;
  sexo?: 'M' | 'F';
  tipo_documento?: string;
  numero_documento?: string;
  correo?: string;
  correo_institucional?: string;  // DRY - centralizado en personas
  celular?: string;
  telefono?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
  codigo_postal?: string;  // DRY - centralizado en personas
  // Datos de salud (centralizados en personas - DRY)
  religion?: string;
  grupo_sanguineo?: string;
  factor_sanguineo?: string;
  seguro_medico?: string;
  tipo_discapacidad?: string;
  carnet_conadis?: string;
  descripcion_discapacidad?: string;
}

// ============================================================================
// INTERFACE PRINCIPAL DE DIRIGENTE
// ============================================================================

export interface Dirigente {
  // Identificación
  id: string;
  codigo_credencial?: string;
  
  // Datos de salud/adicionales (almacenados en tabla dirigentes)
  religion?: string;
  grupo_sanguineo?: string;
  factor_sanguineo?: string;
  seguro_medico?: string;
  tipo_discapacidad?: string;
  carnet_conadis?: string;
  descripcion_discapacidad?: string;
  
  // Datos Institucionales
  grupo_id?: string;
  nombre_grupo?: string;
  region_scout?: string;   // Heredado de grupos_scout
  localidad_scout?: string; // Heredado de grupos_scout
  numeral_grupo?: string;   // Heredado de grupos_scout
  unidad?: string;
  cargo: CargoDirigente;
  estado: EstadoDirigente;
  
  // Datos Laborales/Educativos
  centro_estudios?: string;
  ciclo_anio_estudios?: string;
  centro_laboral?: string;
  cargo_laboral?: string;
  
  // Formación Scout
  nivel_formacion: NivelFormacion;
  especialidades?: string[];
  fecha_sfh1?: string;
  fecha_inaf?: string;
  fecha_cab?: string;
  fecha_caf?: string;
  fecha_insignia_madera?: string;
  aprobo_sfh1: boolean;
  
  // Membresía
  tipo_membresia: TipoMembresia;
  fecha_inicio_membresia: string;
  fecha_fin_membresia?: string;
  
  // Declaraciones
  acepta_politica_proteccion: boolean;
  acepta_codigo_conducta: boolean;
  autoriza_cuenta_institucional: boolean;
  autoriza_uso_imagen: boolean;
  
  // Antecedentes
  declara_sin_antecedentes_policiales: boolean;
  declara_sin_antecedentes_judiciales: boolean;
  declara_sin_antecedentes_penales: boolean;
  detalle_antecedentes?: string;
  
  // Observaciones
  observaciones?: string;
  
  // Auditoría
  created_at: string;
  
  // Relaciones
  persona: PersonaDirigente;
  contacto_emergencia?: ContactoEmergencia;
  documentos?: DocumentoDirigente[];
  formaciones?: FormacionDirigente[];
  historial?: HistorialAsignacion[];
  
  // Campos calculados para lista
  total_documentos?: number;
  documentos_verificados?: number;
  total_formaciones?: number;
}

// ============================================================================
// INTERFACE PARA FORMULARIO
// ============================================================================

export interface FormularioDirigente {
  // Datos Personales
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo: 'M' | 'F' | '';
  tipo_documento: string;
  numero_documento: string;
  
  // Contacto
  correo: string;
  correo_institucional: string;  // Agregado - DRY con personas
  celular: string;
  telefono: string;
  
  // Ubicación
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  codigo_postal: string;  // Agregado - DRY con personas
  
  // Datos Adicionales (almacenados en personas - DRY)
  religion: string;
  grupo_sanguineo: string;
  factor_sanguineo: string;
  seguro_medico: string;
  tipo_discapacidad: string;
  carnet_conadis: string;
  descripcion_discapacidad: string;
  
  // Datos Institucionales
  codigo_credencial: string;
  grupo_id: string;  // ID del grupo scout (FK)
  unidad: string;
  cargo: CargoDirigente | '';
  
  // Datos Laborales/Educativos
  centro_estudios: string;
  ciclo_anio_estudios: string;
  centro_laboral: string;
  cargo_laboral: string;
  
  // Formación
  nivel_formacion: NivelFormacion | '';
  fecha_sfh1: string;
  aprobo_sfh1: boolean;
  
  // Membresía
  tipo_membresia: TipoMembresia | '';
  fecha_inicio_membresia: string;
  
  // Declaraciones
  acepta_politica_proteccion: boolean;
  acepta_codigo_conducta: boolean;
  autoriza_cuenta_institucional: boolean;
  autoriza_uso_imagen: boolean;
  
  // Antecedentes
  declara_sin_antecedentes_policiales: boolean;
  declara_sin_antecedentes_judiciales: boolean;
  declara_sin_antecedentes_penales: boolean;
  detalle_antecedentes: string;
  
  // Contacto Emergencia
  contacto_emergencia_nombre: string;
  contacto_emergencia_telefono: string;
  contacto_emergencia_parentesco: string;
  
  // Observaciones
  observaciones: string;
}

// ============================================================================
// INTERFACE PARA ESTADÍSTICAS
// ============================================================================

export interface EstadisticasDirigentes {
  total_dirigentes: number;
  por_cargo: Record<CargoDirigente, number>;
  por_nivel_formacion: Record<NivelFormacion, number>;
  con_sfh1_aprobado: number;
  con_documentos_completos: number;
  membresias_por_vencer: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const CARGOS_LABELS: Record<CargoDirigente, string> = {
  JEFE_GRUPO: 'Jefe de Grupo',
  SUBJEFE_GRUPO: 'Subjefe de Grupo',
  JEFE_RAMA: 'Jefe de Rama',
  SUBJEFE_RAMA: 'Subjefe de Rama',
  DIRIGENTE: 'Dirigente',
  ASISTENTE: 'Asistente',
  ASESOR: 'Asesor',
  INSTRUCTOR: 'Instructor',
  COORDINADOR: 'Coordinador',
  COLABORADOR: 'Colaborador',
};

export const NIVELES_FORMACION_LABELS: Record<NivelFormacion, string> = {
  SIN_FORMACION: 'Sin Formación',
  SFH1: 'Safe from Harm 1',
  INAF: 'INAF',
  CAB: 'Curso Avanzado Básico',
  CAF: 'Curso Avanzado de Formación',
  INSIGNIA_MADERA: 'Insignia de Madera',
};

export const TIPOS_MEMBRESIA_LABELS: Record<TipoMembresia, string> = {
  REGISTRO_ANUAL_REGULAR: 'Registro Anual Regular',
  REGISTRO_ANUAL_ESPECIAL: 'Registro Anual Especial',
  VOLUNTARIO_TEMPORAL: 'Voluntario Temporal',
};

export const ESTADOS_DOCUMENTO_LABELS: Record<EstadoDocumento, string> = {
  PENDIENTE: 'Pendiente',
  VERIFICADO: 'Verificado',
  VENCIDO: 'Vencido',
  RECHAZADO: 'Rechazado',
};

export const RAMAS_LABELS: Record<Rama, string> = {
  MANADA: 'Manada',
  TROPA: 'Tropa',
  COMUNIDAD: 'Comunidad',
  CLAN: 'Clan',
  GRUPO: 'Grupo (General)',
};

export const TIPOS_DOCUMENTO = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CE', label: 'Carnet de Extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
];

export const GRUPOS_SANGUINEOS = ['A', 'B', 'AB', 'O'];
export const FACTORES_RH = ['+', '-'];

export const TIPOS_DOCUMENTO_ADJUNTO = [
  { value: 'DNI_ANVERSO', label: 'DNI (Anverso)' },
  { value: 'DNI_REVERSO', label: 'DNI (Reverso)' },
  { value: 'CERTIFICADO_SFH1', label: 'Certificado Safe from Harm 1' },
  { value: 'CERTIFICADO_ANTECEDENTES', label: 'Certificado de Antecedentes' },
  { value: 'FOTO_CARNET', label: 'Foto Carné' },
  { value: 'OTRO', label: 'Otro Documento' },
];

// ============================================================================
// VALORES INICIALES FORMULARIO
// ============================================================================

export const FORMULARIO_INICIAL: FormularioDirigente = {
  nombres: '',
  apellidos: '',
  fecha_nacimiento: '',
  sexo: '',
  tipo_documento: 'DNI',
  numero_documento: '',
  correo: '',
  correo_institucional: '',
  celular: '',
  telefono: '',
  departamento: '',
  provincia: '',
  distrito: '',
  direccion: '',
  codigo_postal: '',
  religion: '',
  grupo_sanguineo: '',
  factor_sanguineo: '',
  seguro_medico: '',
  tipo_discapacidad: '',
  carnet_conadis: '',
  descripcion_discapacidad: '',
  codigo_credencial: '',
  grupo_id: '',  // Se selecciona del dropdown
  unidad: '',
  cargo: '',
  centro_estudios: '',
  ciclo_anio_estudios: '',
  centro_laboral: '',
  cargo_laboral: '',
  nivel_formacion: '',
  fecha_sfh1: '',
  aprobo_sfh1: false,
  tipo_membresia: 'REGISTRO_ANUAL_REGULAR',
  fecha_inicio_membresia: new Date().toISOString().split('T')[0],
  acepta_politica_proteccion: false,
  acepta_codigo_conducta: false,
  autoriza_cuenta_institucional: false,
  autoriza_uso_imagen: false,
  declara_sin_antecedentes_policiales: false,
  declara_sin_antecedentes_judiciales: false,
  declara_sin_antecedentes_penales: false,
  detalle_antecedentes: '',
  contacto_emergencia_nombre: '',
  contacto_emergencia_telefono: '',
  contacto_emergencia_parentesco: '',
  observaciones: '',
};
