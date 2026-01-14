// ==========================================
// TIPOS COMPARTIDOS - Puntajes
// Usados por Web y Mobile
// ==========================================

export interface Puntaje {
  id?: string;
  patrulla_id: string;
  actividad_id: string;
  competencia: string;
  puntaje: number;
  observaciones?: string;
  registrado_por?: string;
  fecha: string;
}

export interface PuntajeLocal extends Puntaje {
  sync_status: 'pending' | 'synced' | 'error';
  created_at: string;
}

export interface Patrulla {
  id: string;
  nombre: string;
  rama: string;
  color?: string;
  emblema?: string;
}
