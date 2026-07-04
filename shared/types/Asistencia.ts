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
  /** Hora (hh:mm:ss) en que el estado pasó a PRESENTE/TARDANZA. La calcula un trigger en BD, no se envía desde el cliente. */
  hora_marcado?: string;
  observaciones?: string;
  registrado_por?: string;
}

export interface AsistenciaLocal extends Asistencia {
  sync_status: 'pending' | 'synced' | 'error';
  created_at: string;
}
