export interface Scout {
  id: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  edad: number;
  pais: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  celular: string;
  telefono: string;
  tipoDocumento: 'DNI' | 'Carnet de Extranjería';
  numeroDocumento: string;
  foto?: string;
  correo: string;
  centroEstudio: string;
  ocupacion: string;
  centroLaboral: string;
  esDirigente: boolean;
  fechaIngreso: string;
  activo: boolean;
}

export interface Familiar {
  id: string;
  nombres: string;
  apellidos: string;
  parentesco: 'Papa' | 'Mama' | 'Hermano' | 'Hermana' | 'Primo' | 'Prima' | 'Tío' | 'Tía' | 'Hijo' | 'Hija' | 'Abuelo' | 'Abuela';
  celular: string;
  telefono: string;
  correo: string;
  ocupacion: string;
  centroLaboral: string;
}

export interface Rama {
  tipo: 'Manada' | 'Tropa' | 'Caminante' | 'Clan';
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