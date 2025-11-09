// Configuración del cliente Supabase
import { createClient } from '@supabase/supabase-js';

// Variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: mostrar información en consola
console.log('🔍 Debug Supabase Config:');
console.log('- VITE_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ No encontrada');
console.log('- VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Configurada' : '❌ No encontrada');
console.log('- Environment MODE:', import.meta.env.MODE);
console.log('- All env vars:', import.meta.env);

if (!supabaseUrl || !supabaseKey) {
  const errorMsg = `❌ Configuración de Supabase incompleta:
  - URL: ${supabaseUrl ? '✅' : '❌ Faltante'}
  - Key: ${supabaseKey ? '✅' : '❌ Faltante'}
  
  Verifica las variables de entorno en Azure Static Web Apps:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY`;
  
  console.error(errorMsg);
  throw new Error('Faltan las variables de entorno de Supabase. Revisa tu archivo .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============= INTERFACES DE PRESUPUESTOS =============

export interface Campamento {
  id: string;
  nombre: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  lugar?: string;
  estado: 'planificacion' | 'activo' | 'finalizado' | 'cancelado';
  responsable?: string;
  presupuesto_estimado: number;
  created_at: string;
  updated_at: string;
}

export interface ParticipanteCampamento {
  id: string;
  campamento_id: string;
  nombre: string;
  apellido: string;
  tipo_participante: 'joven' | 'adulto';
  cargo?: string;
  rama?: string;
  telefono?: string;
  email?: string;
  observaciones?: string;
  created_at: string;
}

export interface GastoCampamento {
  id: string;
  campamento_id: string;
  concepto: string;
  categoria: 'movilidad' | 'alimentacion' | 'alojamiento' | 'materiales' | 'equipamiento' | 'servicios' | 'emergencias' | 'otros';
  monto_total: number;
  descripcion?: string;
  fecha_gasto: string;
  proveedor?: string;
  numero_factura?: string;
  responsable_pago?: string;
  estado_pago: 'pendiente' | 'pagado' | 'parcial';
  observaciones?: string;
  created_at: string;
}

export interface PagoParticipante {
  id: string;
  campamento_id: string;
  participante_id: string;
  monto_pagado: number;
  fecha_pago: string;
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta' | 'yape' | 'plin';
  cobrado_por?: string;
  numero_recibo?: string;
  observaciones?: string;
  created_at: string;
}

export interface IngresoAdicional {
  id: string;
  campamento_id: string;
  concepto: string;
  monto: number;
  descripcion?: string;
  fecha_ingreso: string;
  responsable?: string;
  tipo_ingreso: 'donacion' | 'patrocinio' | 'venta' | 'actividad_fondos' | 'subsidio' | 'otros';
  observaciones?: string;
  created_at: string;
}

export interface ReporteFinanciero {
  campamento: Campamento;
  ingresos: {
    jovenes: number;
    adultos: number;
    ingresos_participantes: number;
    ingresos_adicionales: number;
    total_esperado: number;
    tarifa_joven: number;
    tarifa_adulto: number;
  };
  gastos: {
    total_gastos: number;
    gastos_pendientes: number;
    gastos_por_categoria: Record<string, number>;
  };
  pagos_recibidos: number;
  balance_proyectado: number;
  balance_real: number;
  fecha_reporte: string;
}

// ============= INTERFACES DEL SISTEMA SCOUT =============

export interface Scout {
  id: string;
  codigo_scout: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  edad: number;
  sexo: 'MASCULINO' | 'FEMENINO';
  celular?: string;
  telefono?: string;
  correo?: string;
  tipo_documento: 'DNI' | 'CARNET_EXTRANJERIA' | 'PASAPORTE';
  numero_documento: string;
  pais: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
  centro_estudio?: string;
  ocupacion?: string;
  centro_laboral?: string;
  es_dirigente: boolean;
  fecha_ingreso: string;
  rama_actual?: 'Lobatos' | 'Scouts' | 'Rovers' | 'Dirigentes';
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'ELIMINADO';
  foto_url?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
  // Propiedad opcional para cuando se obtienen datos completos del scout
  familiares?: FamiliarScout[];
}

export interface FamiliarScout {
  id: string;
  scout_id: string;
  nombres: string;
  apellidos: string;
  parentesco: 'PADRE' | 'MADRE' | 'TUTOR' | 'ABUELO' | 'ABUELA' | 'TIO' | 'TIA' | 'HERMANO' | 'HERMANA' | 'OTRO';
  celular?: string;
  telefono?: string;
  correo?: string;
  ocupacion?: string;
  centro_laboral?: string;
  es_contacto_emergencia: boolean;
  es_responsable_legal: boolean;
  observaciones?: string;
  created_at: string;
}

export interface Dirigente {
  id: string;
  scout_id: string;
  codigo_dirigente: string;
  fecha_ingreso_dirigente: string;
  rama_responsable?: string;
  cargo?: string;
  nivel_formacion?: string;
  insignia_madera: boolean;
  fecha_insignia_madera?: string;
  cursos_completados?: string[];
  estado_dirigente: 'ACTIVO' | 'INACTIVO' | 'LICENCIA' | 'SUSPENDIDO';
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface HistorialRama {
  id: string;
  scout_id: string;
  rama_anterior?: string;
  rama_nueva: string;
  fecha_cambio: string;
  motivo?: string;
  autorizado_por?: string;
  created_at: string;
}

export interface Patrulla {
  id: string;
  nombre: string;
  rama: string;
  lema?: string;
  grito?: string;
  colores?: string;
  totem?: string;
  dirigente_id?: string;
  estado: 'activa' | 'inactiva' | 'disuelta';
  created_at: string;
  updated_at: string;
}

export interface GrupoScout {
  id: string;
  codigo_grupo: string;
  nombre: string;
  numeral: string;
  localidad: string;
  region: string;
  fecha_fundacion: string;
  fundador?: string;
  lugar_reunion?: string;
  direccion_sede?: string;
  telefono_contacto?: string;
  email_contacto?: string;
  sitio_web?: string;
  activo: boolean;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface PatrocinadorGrupo {
  id: string;
  grupo_id: string;
  nombre: string;
  tipo: 'PUBLICO' | 'PRIVADO' | 'ONG' | 'OTRO';
  contacto?: string;
  telefono?: string;
  email?: string;
  monto_aporte?: number;
  tipo_aporte?: 'MONETARIO' | 'MATERIAL' | 'SERVICIO' | 'MIXTO';
  fecha_inicio?: string;
  fecha_fin?: string;
  activo: boolean;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface LibroOroEntry {
  id: string;
  titulo: string;
  fecha: string;
  patrulla?: string;
  rama?: 'Lobatos' | 'Scouts' | 'Rovers' | 'Dirigentes';
  tipo_logro: string; // 'Campamento', 'Servicio Comunitario', 'Competencia', 'Liderazgo', 'Ceremonia', 'Proyecto Especial', 'Reconocimiento', 'Otro'
  logro: string;
  descripcion: string;
  relatores?: string;
  reconocimiento: string; // 'Oro', 'Plata', 'Bronce', 'Especial'
  participantes?: string;
  lugar?: string;
  dirigente_responsable?: string;
  evidencias?: string;
  impacto?: string;
  puntuacion?: number;
  validado_por?: string;
  fecha_validacion?: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramaSemanalEntry {
  id: string;
  codigo_programa: string;
  fecha_inicio: string;
  fecha_fin: string;
  tema_central: string;
  rama: 'MANADA' | 'TROPA' | 'COMUNIDAD' | 'CLAN';
  objetivos: string[];
  responsable_programa?: string;
  observaciones_generales?: string;
  estado: 'PLANIFICADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO';
  actividades?: ProgramaActividad[];
  created_at: string;
  updated_at: string;
}

export interface ProgramaActividad {
  id?: string;
  programa_id?: string;
  nombre: string;
  descripcion?: string;
  hora_inicio: string;
  duracion_minutos: number;
  responsable?: string;
  materiales?: string[];
  observaciones?: string;
  orden_ejecucion?: number;
  created_at?: string;
}

export interface ComitePadresEntry {
  id: string;
  nombres: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  cargo: 'PRESIDENTE' | 'SECRETARIO' | 'TESORERO' | 'VOCAL' | 'SUPLENTE';
  fecha_inicio: string;
  fecha_fin?: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'CULMINADO';
  scout_hijo_id?: string;
  scout_hijo_nombre?: string;
  experiencia_previa?: string;
  habilidades?: string[];
  disponibilidad?: string;
  observaciones?: string;
  fecha_registro?: string;
  fecha_actualizacion?: string;
  periodo_actual: boolean;
  created_at: string;
  updated_at: string;
}

// ============= INTERFACES DE INVENTARIO =============

export interface MiembroPatrulla {
  id: string;
  scout_id: string;
  patrulla_id: string;
  cargo: 'Guía' | 'Subguía' | 'Miembro';
  fecha_ingreso: string;
  fecha_salida?: string;
  activo: boolean;
  created_at: string;
}

export interface ActividadScout {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo_actividad: 'Reunión Regular' | 'Campamento' | 'Excursión' | 'Servicio Comunitario' | 'Ceremonial' | 'Capacitación' | 'Competencia' | 'Juego Grande' | 'Otro';
  fecha_inicio: string;
  fecha_fin: string;
  duracion_horas: number;
  lugar?: string;
  direccion_lugar?: string;
  latitud?: number;
  longitud?: number;
  rama_objetivo?: string;
  dirigente_responsable?: string;
  costo: number;
  maximo_participantes?: number;
  estado: 'planificada' | 'confirmada' | 'en_progreso' | 'finalizada' | 'cancelada';
  requiere_autorizacion: boolean;
  requiere_pago: boolean;
  edad_minima?: number;
  edad_maxima?: number;
  observaciones?: string;
  equipamiento_necesario?: string;
  created_at: string;
  updated_at: string;
}

export interface ParticipanteActividad {
  id: string;
  actividad_id: string;
  scout_id: string;
  estado_participacion: 'inscrito' | 'confirmado' | 'presente' | 'ausente' | 'cancelado';
  fecha_inscripcion: string;
  fecha_confirmacion?: string;
  monto_pagado: number;
  fecha_pago?: string;
  observaciones?: string;
  requiere_transporte: boolean;
  autorizacion_familiar: boolean;
  created_at: string;
}

export interface Asistencia {
  id: string;
  scout_id: string;
  actividad_id?: string;
  fecha: string;
  tipo_evento: 'Reunión Regular' | 'Actividad Especial' | 'Campamento' | 'Servicio';
  estado_asistencia: 'presente' | 'ausente' | 'tardanza' | 'justificado';
  hora_llegada?: string;
  hora_salida?: string;
  justificacion?: string;
  registrado_por?: string;
  created_at: string;
}

export interface LogroScout {
  id: string;
  scout_id: string;
  tipo_logro: 'Insignia de Especialidad' | 'Insignia de Progresión' | 'Reconocimiento' | 'Servicio Comunitario' | 'Liderazgo' | 'Campamento' | 'Otro';
  nombre_logro: string;
  descripcion?: string;
  fecha_obtencion: string;
  evaluado_por?: string;
  puntos: number;
  nivel?: 'Bronce' | 'Plata' | 'Oro' | 'Especial';
  evidencia_url?: string;
  certificado_url?: string;
  estado: 'pendiente' | 'otorgado' | 'revocado';
  created_at: string;
}

// ============= INTERFACES DE INVENTARIO =============

export interface ProgramaSemanal {
  id: string;
  semana_inicio: string;
  semana_fin: string;
  rama: string;
  lunes?: string;
  martes?: string;
  miercoles?: string;
  jueves?: string;
  viernes?: string;
  sabado?: string;
  domingo?: string;
  tema_semanal?: string;
  objetivos?: string;
  materiales_necesarios?: string;
  responsable?: string;
  estado: 'borrador' | 'publicado' | 'archivado';
  created_at: string;
  updated_at: string;
}

export interface InscripcionAnual {
  id: string;
  scout_id: string;
  codigo_asociado: string;
  ano: number;
  rama: string;
  fecha_inscripcion: string;
  monto_inscripcion: number;
  fecha_pago?: string;
  estado_pago: 'pendiente' | 'pagado' | 'parcial' | 'exonerado';
  documentos_completos: boolean;
  certificado_medico: boolean;
  autorizacion_padres: boolean;
  activo: boolean;
  created_at: string;
}

export interface PerfilCompleto {
  scout: Scout;
  familiares: FamiliarScout[];
  historial_ramas: HistorialRama[];
  logros_recientes: LogroScout[];
  asistencias_mes: {
    total_reuniones: number;
    presentes: number;
    ausentes: number;
    tardanzas: number;
    porcentaje_asistencia: number;
  };
  patrulla_actual?: {
    patrulla_id: string;
    nombre_patrulla: string;
    cargo: string;
    fecha_ingreso: string;
  };
  datos_dirigente?: Dirigente;
}

// ============= INTERFACES DE INVENTARIO =============

// Tipos de datos para TypeScript
export interface Database {
  public: {
    Tables: {
      inventario: {
        Row: InventarioItem;
        Insert: Omit<InventarioItem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<InventarioItem, 'id' | 'created_at'>>;
      };
      movimientos_inventario: {
        Row: MovimientoInventario;
        Insert: Omit<MovimientoInventario, 'id' | 'created_at'>;
        Update: Partial<Omit<MovimientoInventario, 'id' | 'created_at'>>;
      };
    };
    Enums: {
      inventario_categoria: 'material_scout' | 'camping' | 'ceremonial' | 'deportivo' | 'primeros_auxilios' | 'administrativo';
      inventario_estado: 'disponible' | 'prestado' | 'mantenimiento' | 'perdido' | 'baja';
      movimiento_tipo: 'entrada' | 'salida' | 'prestamo' | 'devolucion' | 'baja' | 'ajuste';
    };
  };
}

export interface InventarioItem {
  id: string;
  nombre: string;
  categoria: Database['public']['Enums']['inventario_categoria'];
  descripcion?: string;
  cantidad: number;
  cantidad_minima: number;
  estado: Database['public']['Enums']['inventario_estado'];
  ubicacion?: string;
  costo?: number;
  proveedor?: string;
  responsable_id?: string;
  observaciones?: string;
  imagen_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MovimientoInventario {
  id: string;
  item_id: string;
  tipo_movimiento: 'entrada' | 'salida' | 'prestamo' | 'devolucion' | 'baja' | 'ajuste';
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  responsable?: string;
  destino?: string; // Para préstamos: a quién se presta
  motivo?: string;
  fecha_movimiento: string;
  observaciones?: string;
  created_at: string;
}

// ============= INTERFACES DE INVENTARIO =============

// Configuración adicional para autenticación
export const supabaseConfig = {
  auth: {
    redirectTo: window.location.origin,
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  }
};