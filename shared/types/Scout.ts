// ==========================================
// TIPOS COMPARTIDOS - Scout
// Usados por Web y Mobile
// ==========================================

export interface Scout {
  id: string;
  codigo_scout: string;
  nombres: string;
  apellidos: string;
  rama_actual: string;
  patrulla?: string;
  estado: 'activo' | 'inactivo' | 'baja';
  foto_url?: string;
}

export interface ScoutDetalle extends Scout {
  fecha_nacimiento?: string;
  fecha_ingreso?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
}
