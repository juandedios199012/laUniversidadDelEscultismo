export interface Scout {
  id: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  edad: number;
  sexo: 'MASCULINO' | 'FEMENINO';
  pais: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  codigo_postal?: string;
  celular: string;
  celular_secundario?: string;
  telefono?: string;
  correo: string;
  correo_secundario?: string;
  correo_institucional?: string;
  tipo_documento: 'DNI' | 'CARNET_EXTRANJERIA' | 'PASAPORTE';
  numero_documento: string;
  foto?: string;
  centro_estudio: string;
  anio_estudios?: string;
  ocupacion: string;
  centro_laboral: string;
  religion?: string;
  grupo_sanguineo?: 'A' | 'B' | 'AB' | 'O';
  factor_sanguineo?: 'POSITIVO' | 'NEGATIVO';
  seguro_medico?: string;
  tipo_discapacidad?: string;
  carnet_conadis?: string;
  descripcion_discapacidad?: string;
  fecha_ingreso?: string;
  activo: boolean;
  codigo_scout?: string;
  codigo_asociado?: string;
  rama_actual?: 'Manada' | 'Tropa' | 'Caminantes' | 'Clan' | 'Dirigentes';
  estado?: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'ELIMINADO';
}

export interface Familiar {
  id?: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento?: string;
  edad?: number;
  sexo?: 'MASCULINO' | 'FEMENINO';
  tipo_documento?: 'DNI' | 'CARNET_EXTRANJERIA' | 'PASAPORTE';
  numero_documento?: string;
  parentesco: 'PADRE' | 'MADRE' | 'TUTOR' | 'HERMANO' | 'TIO' | 'ABUELO' | 'OTRO';
  celular: string;
  celular_secundario?: string;
  telefono?: string;
  correo: string;
  correo_secundario?: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  ocupacion?: string;
  profesion?: string;
  centro_laboral?: string;
  cargo?: string;
  es_contacto_emergencia: boolean;
  es_autorizado_recoger: boolean;
  observaciones?: string;
}

export interface Rama {
  tipo: 'Lobatos' | 'Scouts' | 'Rovers' | 'Dirigentes';
  detalles?: {
    seisena?: string;
    patrulla?: string;
    nombramiento?: string;
    cargo?: string;
  };
  dirigente: string;
  fechaIngreso: string;
}

export interface ComitePadres {
  id: string;
  familiar: string;
  cargo: 'Presidente(a)' | 'Secretario(a)' | 'Tesorero(a)';
  fechaEleccion: string;
  fechaCulminacion: string;
  periodo: string;
}

export interface Patrulla {
  id: string;
  nombre: string;
  fechaFundacion: string;
  dirigentes: string[];
  scouts: string[];
}

export interface ProgramaSemanal {
  id: string;
  rama: string;
  fecha: string;
  responsable: string;
  objetivo: string;
  areasCrecimiento: string[];
  actividades: Actividad[];
}

export interface Actividad {
  id: string;
  horaInicial: string;
  horaFinal: string;
  duracion: string;
  nombre: string;
  responsable: string;
  desarrollo: string;
  materiales: string;
  puntajes: Record<string, number>;
}

export interface InventarioItem {
  id: string;
  activo: string;
  fechaInventario: string;
  dirigenteScout: string;
  rama?: string;
  esDelGrupo: boolean;
}