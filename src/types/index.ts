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
  celular: string;
  telefono: string;
  tipo_documento: 'DNI' | 'CARNET_EXTRANJERIA' | 'PASAPORTE';
  numero_documento: string;
  foto?: string;
  correo: string;
  centro_estudio: string;
  ocupacion: string;
  centro_laboral: string;
  es_dirigente: boolean;
  fecha_ingreso: string;
  activo: boolean;
  codigo_scout?: string;
  rama_actual?: 'Lobatos' | 'Scouts' | 'Rovers' | 'Dirigentes';
  estado?: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'ELIMINADO';
}

export interface Familiar {
  id: string;
  nombres: string;
  apellidos: string;
  parentesco: 'PADRE' | 'MADRE' | 'TUTOR' | 'HERMANO' | 'TIO' | 'ABUELO' | 'OTRO';
  celular: string;
  telefono: string;
  correo: string;
  ocupacion: string;
  centroLaboral: string;
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