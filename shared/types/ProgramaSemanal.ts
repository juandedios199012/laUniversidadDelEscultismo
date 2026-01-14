// ==========================================
// TIPOS COMPARTIDOS - Programa Semanal
// Usados por Web y Mobile
// ==========================================

export interface ProgramaSemanal {
  id: string;
  tema_central: string;
  fecha_inicio: string;
  fecha_fin?: string;
  rama: string;
  objetivos?: string[];
  responsable_programa?: string;
}

export interface Actividad {
  id: string;
  programa_id: string;
  titulo: string;
  descripcion?: string;
  hora_inicio?: string;
  hora_fin?: string;
  competencias?: string[];
  puntaje_maximo?: number;
}
