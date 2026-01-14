// ==========================================
// TIPOS COMPARTIDOS - Asistencia
// Usados por Web y Mobile
// ==========================================

export type EstadoAsistencia = 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO';

export interface Asistencia {
  id?: string;
  scout_id: string;
  actividad_id: string;
  fecha: string;
  estado_asistencia: EstadoAsistencia;
  hora_llegada?: string;
  observaciones?: string;
  registrado_por?: string;
}

export interface AsistenciaLocal extends Asistencia {
  sync_status: 'pending' | 'synced' | 'error';
  created_at: string;
}
