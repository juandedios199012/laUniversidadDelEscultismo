/**
 * Servicio para obtener datos de reportes desde Supabase
 */

import { supabase } from '../../../lib/supabase';
import {
  ScoutReportData,
  AttendanceData,
  ProgressData,
  GroupSummaryData,
  ActivityHistoryData,
  ReportFilters,
  HistoriaMedicaReportData,
} from '../types/reportTypes';

/**
 * Obtiene datos de un Scout específico
 */
export async function getScoutData(scoutId: string): Promise<ScoutReportData | null> {
  try {
    // Obtener datos del scout con JOIN a personas (nueva arquitectura)
    const { data: scoutData, error: scoutError } = await supabase
      .from('scouts')
      .select(`
        *,
        persona:personas!scouts_persona_id_fkey (
          id,
          nombres,
          apellidos,
          fecha_nacimiento,
          sexo,
          tipo_documento,
          numero_documento,
          celular,
          celular_secundario,
          telefono,
          correo,
          correo_secundario,
          correo_institucional,
          departamento,
          provincia,
          distrito,
          direccion,
          religion,
          grupo_sanguineo,
          factor_sanguineo,
          tipo_discapacidad,
          carnet_conadis,
          descripcion_discapacidad
        )
      `)
      .eq('id', scoutId)
      .single();

    if (scoutError) throw scoutError;

    // Obtener TODOS los familiares del scout a través de familiares_scout y personas
    const { data: familiaresScoutData, error: familiaresError } = await supabase
      .from('familiares_scout')
      .select(`
        id,
        parentesco,
        profesion,
        centro_laboral,
        cargo,
        es_contacto_emergencia,
        es_autorizado_recoger,
        persona:personas!familiares_scout_persona_id_fkey (
          id,
          nombres,
          apellidos,
          sexo,
          tipo_documento,
          numero_documento,
          celular,
          celular_secundario,
          telefono,
          correo,
          correo_secundario,
          departamento,
          provincia,
          distrito,
          direccion
        )
      `)
      .eq('scout_id', scoutId)
      .order('es_contacto_emergencia', { ascending: false });

    // Mapear todos los familiares
    const familiares = familiaresError || !familiaresScoutData 
      ? [] 
      : familiaresScoutData.map((fam: any) => ({
          id: fam.id,
          nombres: fam.persona?.nombres || '',
          apellidos: fam.persona?.apellidos || '',
          sexo: fam.persona?.sexo || '',
          tipoDocumento: fam.persona?.tipo_documento || '',
          numeroDocumento: fam.persona?.numero_documento || '',
          parentesco: fam.parentesco || '',
          correo: fam.persona?.correo || '',
          correoSecundario: fam.persona?.correo_secundario || '',
          direccion: fam.persona?.direccion || '',
          departamento: fam.persona?.departamento || '',
          provincia: fam.persona?.provincia || '',
          distrito: fam.persona?.distrito || '',
          profesion: fam.profesion || '',
          centroLaboral: fam.centro_laboral || '',
          cargo: fam.cargo || '',
          celular: fam.persona?.celular || '',
          celularSecundario: fam.persona?.celular_secundario || '',
          telefono: fam.persona?.telefono || '',
          esContactoEmergencia: fam.es_contacto_emergencia || false,
          esAutorizadoRecoger: fam.es_autorizado_recoger || false
        }));

    // Mantener compatibilidad: usar primer familiar para campos legacy
    const primerFamiliar = familiares[0];
    const segundoFamiliar = familiares[1];

    const personaData = scoutData.persona || {};

    console.log('🔍 DEBUG getScoutData - Familiares obtenidos:', {
      total: familiares.length,
      familiares
    });

    return {
      id: scoutData.id,
      nombre: personaData.nombres || '',
      apellido: personaData.apellidos || '',
      fechaNacimiento: personaData.fecha_nacimiento || '',
      edad: calculateAge(personaData.fecha_nacimiento),
      sexo: personaData.sexo || '',
      tipoDocumento: personaData.tipo_documento || '',
      numeroDocumento: personaData.numero_documento || '',
      rama: scoutData.rama_actual || '',
      patrulla: scoutData.patrulla || '',
      numeroRegistro: personaData.numero_documento || '',
      fechaIngreso: scoutData.fecha_ingreso || '',
      direccion: personaData.direccion || '',
      departamento: personaData.departamento || '',
      provincia: personaData.provincia || '',
      distrito: personaData.distrito || '',
      centroEstudio: scoutData.centro_estudio || '',
      telefono: personaData.celular || '',
      telefonoSecundario: personaData.telefono || '',
      celular: personaData.celular || '',
      celularSecundario: personaData.celular_secundario || '',
      email: personaData.correo || '',
      correoSecundario: personaData.correo_secundario || '',
      correoInstitucional: personaData.correo_institucional || '',
      // Datos académicos
      anioEstudios: scoutData.anio_estudios || '',
      // Datos religiosos
      religion: personaData.religion || '',
      // Datos médicos y de salud
      grupoSanguineo: personaData.grupo_sanguineo || '',
      factorSanguineo: personaData.factor_sanguineo || '',
      seguroMedico: scoutData.seguro_medico || '',
      tipoDiscapacidad: personaData.tipo_discapacidad || '',
      carnetConadis: personaData.carnet_conadis || '',
      descripcionDiscapacidad: personaData.descripcion_discapacidad || '',
      // Array dinámico de familiares
      familiares: familiares,
      // Datos del familiar (LEGACY - primer familiar para compatibilidad)
      nombrePadre: primerFamiliar?.nombres || '',
      apellidoPadre: primerFamiliar?.apellidos || '',
      sexoPadre: primerFamiliar?.sexo || '',
      tipoDocumentoPadre: primerFamiliar?.tipoDocumento || '',
      numeroDocumentoPadre: primerFamiliar?.numeroDocumento || '',
      celularPadre: primerFamiliar?.celular || '',
      telefonoPadre: primerFamiliar?.telefono || '',
      correoPadre: primerFamiliar?.correo || '',
      direccionPadre: primerFamiliar?.direccion || '',
      departamentoPadre: primerFamiliar?.departamento || '',
      provinciaPadre: primerFamiliar?.provincia || '',
      distritoPadre: primerFamiliar?.distrito || '',
      parentesco: primerFamiliar?.parentesco || '',
      ocupacionPadre: primerFamiliar?.profesion || '',
      // Datos de madre (segundo familiar - LEGACY)
      nombreMadre: segundoFamiliar?.nombres || '',
      apellidoMadre: segundoFamiliar?.apellidos || '',
      contactoEmergencia: personaData.celular || primerFamiliar?.celular || '',
      observaciones: scoutData.observaciones || '',
    };
  } catch (error) {
    console.error('Error fetching scout data:', error);
    return null;
  }
}

/**
 * Obtiene datos de asistencia
 */
/**
 * Obtiene datos de asistencia para reportes
 */
export async function getAttendanceData(
  filters: ReportFilters
): Promise<AttendanceData[]> {
  try {
    const { data, error } = await supabase.rpc('api_obtener_reporte_asistencia', {
      p_fecha_desde: filters.dateFrom || null,
      p_fecha_hasta: filters.dateTo || null,
      p_scout_ids: filters.scoutIds && filters.scoutIds.length > 0 ? filters.scoutIds : null,
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    throw error;
  }
}

/**
 * Obtiene datos de progreso de especialidades
 */
export async function getProgressData(
  filters: ReportFilters
): Promise<ProgressData[]> {
  try {
    const { data, error } = await supabase.rpc('api_obtener_reporte_progreso', {
      p_scout_ids: filters.scoutIds && filters.scoutIds.length > 0 ? filters.scoutIds : null,
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching progress data:', error);
    throw error;
  }
}

/**
 * Obtiene resumen del grupo
 */
export async function getGroupSummary(
  filters: ReportFilters
): Promise<GroupSummaryData | null> {
  try {
    // Total de scouts
    const { count: totalScouts } = await supabase
      .from('scouts')
      .select('*', { count: 'exact', head: true });

    // Scouts por rama
    const { data: scoutsByRama } = await supabase
      .from('scouts')
      .select('rama');

    const scoutsPorRama: Record<string, number> = {};
    scoutsByRama?.forEach((scout: any) => {
      const rama = scout.rama || 'Sin rama';
      scoutsPorRama[rama] = (scoutsPorRama[rama] || 0) + 1;
    });

    // Asistencia promedio
    const { data: attendanceData } = await supabase
      .from('asistencias')
      .select('presente')
      .gte('fecha', filters.dateFrom || '2024-01-01')
      .lte('fecha', filters.dateTo || new Date().toISOString());

    const asistenciaPromedio = attendanceData
      ? (attendanceData.filter((a: any) => a.presente).length / attendanceData.length) * 100
      : 0;

    // Actividades realizadas
    const { count: actividadesRealizadas } = await supabase
      .from('actividades')
      .select('*', { count: 'exact', head: true })
      .gte('fecha', filters.dateFrom || '2024-01-01')
      .lte('fecha', filters.dateTo || new Date().toISOString());

    return {
      grupoNombre: 'Grupo Scout Lima 12',
      totalScouts: totalScouts || 0,
      scoutsPorRama,
      asistenciaPromedio: Math.round(asistenciaPromedio),
      actividadesRealizadas: actividadesRealizadas || 0,
      periodo: {
        inicio: filters.dateFrom || '2024-01-01',
        fin: filters.dateTo || new Date().toISOString().split('T')[0],
      },
    };
  } catch (error) {
    console.error('Error fetching group summary:', error);
    return null;
  }
}

/**
 * Obtiene historial de actividades
 */
export async function getActivityHistory(
  filters: ReportFilters
): Promise<ActivityHistoryData[]> {
  try {
    let query = supabase
      .from('actividades')
      .select('*')
      .order('fecha', { ascending: false });

    if (filters.dateFrom) {
      query = query.gte('fecha', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('fecha', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      fecha: item.fecha,
      nombre: item.nombre,
      tipo: item.tipo,
      descripcion: item.descripcion || '',
      participantes: item.participantes || 0,
      duracion: item.duracion || '',
      lugar: item.lugar || '',
    }));
  } catch (error) {
    console.error('Error fetching activity history:', error);
    return [];
  }
}

/**
 * Calcula la edad a partir de la fecha de nacimiento
 */
function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Obtiene múltiples scouts para reportes masivos
 */
export async function getMultipleScoutsData(
  scoutIds: string[]
): Promise<ScoutReportData[]> {
  try {
    const { data, error } = await supabase
      .from('scouts')
      .select('*')
      .in('id', scoutIds);

    if (error) throw error;

    return data.map((scout: any) => ({
      id: scout.id,
      nombre: scout.nombre || '',
      apellido: scout.apellido || '',
      fechaNacimiento: scout.fecha_nacimiento || '',
      edad: calculateAge(scout.fecha_nacimiento),
      rama: scout.rama || '',
      patrulla: scout.patrulla || '',
      numeroRegistro: scout.numero_registro || '',
      fechaIngreso: scout.fecha_ingreso || '',
      direccion: scout.direccion || '',
      telefono: scout.telefono || '',
      email: scout.email || '',
      nombrePadre: scout.nombre_padre || '',
      nombreMadre: scout.nombre_madre || '',
      contactoEmergencia: scout.contacto_emergencia || '',
      observaciones: scout.observaciones || '',
    }));
  } catch (error) {
    console.error('Error fetching multiple scouts data:', error);
    return [];
  }
}

/**
 * Obtiene datos de inscripciones anuales
 */
export async function getInscripcionesAnuales(
  ano?: number,
  rama?: string
): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc('api_obtener_reporte_inscripciones_anuales', {
      p_ano: ano || new Date().getFullYear(),
      p_rama: rama || null,
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching inscripciones anuales:', error);
    throw error;
  }
}

/**
 * Obtiene ranking de patrullas con sus puntos
 */
export async function getRankingPatrullas(
  rama?: string,
  fechaInicio?: string,
  fechaFin?: string
): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc('api_obtener_reporte_ranking_patrullas', {
      p_rama: rama || null,
      p_fecha_desde: fechaInicio || null,
      p_fecha_hasta: fechaFin || null,
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching ranking patrullas:', error);
    throw error;
  }
}

/**
 * Obtiene contactos de emergencia de scouts
 */
export async function getContactosEmergencia(rama?: string): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc('api_obtener_reporte_contactos_emergencia', {
      p_rama: rama || null,
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching contactos emergencia:', error);
    throw error;
  }
}

/**
 * Obtiene documentación pendiente de scouts
 */
export async function getDocumentacionPendiente(ano?: number): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc('api_obtener_reporte_documentacion_pendiente', {
      p_ano: ano || new Date().getFullYear(),
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching documentacion pendiente:', error);
    throw error;
  }
}

/**
 * Obtiene datos de Historia Médica para reporte PDF/DOCX
 */
export async function getHistoriaMedicaData(
  scoutId: string,
  personaId: string
): Promise<HistoriaMedicaReportData | null> {
  try {
    // 1. Obtener datos del scout
    const { data: scoutData, error: scoutError } = await supabase
      .from('scouts')
      .select(`
        id,
        codigo_scout,
        rama_actual,
        persona:personas!scouts_persona_id_fkey (
          id,
          nombres,
          apellidos,
          fecha_nacimiento,
          sexo,
          direccion,
          departamento,
          provincia,
          distrito,
          grupo_sanguineo,
          factor_sanguineo
        )
      `)
      .eq('id', scoutId)
      .single();

    if (scoutError || !scoutData) {
      console.error('Error obteniendo scout:', scoutError);
      return null;
    }

    // Obtener patrulla por separado via miembros_patrulla
    let patrullaNombre = '';
    const { data: miembroPatrulla } = await supabase
      .from('miembros_patrulla')
      .select('patrulla:patrullas(nombre)')
      .eq('scout_id', scoutId)
      .eq('estado_miembro', 'ACTIVO')
      .single();
    
    if (miembroPatrulla?.patrulla) {
      patrullaNombre = (miembroPatrulla.patrulla as any).nombre || '';
    }

    const persona = scoutData.persona as any;

    // 2. Obtener historia médica cabecera
    const { data: historiaData, error: historiaError } = await supabase
      .from('historias_medicas')
      .select('*')
      .eq('persona_id', personaId)
      .single();

    // 3. Obtener condiciones médicas
    const { data: condiciones } = await supabase
      .from('historia_condiciones')
      .select('*')
      .eq('historia_id', historiaData?.id || '')
      .order('nombre');

    // 4. Obtener alergias
    const { data: alergias } = await supabase
      .from('historia_alergias')
      .select('*')
      .eq('historia_id', historiaData?.id || '')
      .order('nombre');

    // 5. Obtener medicamentos
    const { data: medicamentos } = await supabase
      .from('historia_medicamentos')
      .select('*')
      .eq('historia_id', historiaData?.id || '')
      .order('nombre');

    // 6. Obtener vacunas
    const { data: vacunas } = await supabase
      .from('historia_vacunas')
      .select('*')
      .eq('historia_id', historiaData?.id || '')
      .order('nombre');

    // 7. Obtener contacto de emergencia
    const { data: contactoData } = await supabase
      .from('familiares')
      .select(`
        persona:personas!familiares_persona_familiar_id_fkey (
          nombres,
          apellidos,
          celular,
          telefono
        ),
        parentesco,
        es_contacto_emergencia
      `)
      .eq('persona_scout_id', personaId)
      .eq('es_contacto_emergencia', true)
      .limit(1)
      .single();

    // Calcular edad
    const fechaNac = persona?.fecha_nacimiento ? new Date(persona.fecha_nacimiento) : null;
    const edad = fechaNac ? Math.floor((Date.now() - fechaNac.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

    const result: HistoriaMedicaReportData = {
      scoutId: scoutData.id,
      codigoScout: scoutData.codigo_scout || '',
      nombreCompleto: `${persona?.nombres || ''} ${persona?.apellidos || ''}`.trim(),
      fechaNacimiento: persona?.fecha_nacimiento || '',
      edad,
      sexo: persona?.sexo,
      direccion: [persona?.direccion, persona?.distrito, persona?.provincia, persona?.departamento]
        .filter(Boolean).join(', '),
      rama: scoutData.rama_actual || '',
      patrulla: patrullaNombre,
      
      // Contacto de emergencia
      contactoEmergencia: contactoData ? {
        nombre: `${(contactoData.persona as any)?.nombres || ''} ${(contactoData.persona as any)?.apellidos || ''}`.trim(),
        parentesco: contactoData.parentesco || '',
        celular: (contactoData.persona as any)?.celular || '',
        telefono: (contactoData.persona as any)?.telefono,
      } : undefined,
      
      // Cabecera
      fechaLlenado: historiaData?.fecha_llenado || new Date().toISOString().split('T')[0],
      lugarNacimiento: historiaData?.lugar_nacimiento,
      estaturaCm: historiaData?.estatura_cm,
      pesoKg: historiaData?.peso_kg,
      
      // Seguro
      seguroMedico: historiaData?.seguro_medico,
      numeroPoliza: historiaData?.numero_poliza,
      medicoCabecera: historiaData?.medico_cabecera,
      telefonoMedico: historiaData?.telefono_medico,
      hospitalPreferencia: historiaData?.hospital_preferencia,
      
      // Sangre
      grupoSanguineo: persona?.grupo_sanguineo,
      factorSanguineo: persona?.factor_sanguineo,
      
      observacionesGenerales: historiaData?.observaciones_generales,
      
      // Listas
      condiciones: (condiciones || []).map(c => ({
        nombre: c.nombre,
        tipo: c.tipo || 'CONTROLADA',
        fechaDiagnostico: c.fecha_diagnostico,
        tratamiento: c.tratamiento,
        medicoTratante: c.medico_tratante,
        notas: c.notas,
        activa: c.activa ?? true,
      })),
      
      alergias: (alergias || []).map(a => ({
        nombre: a.nombre,
        tipo: a.tipo || 'OTRA',
        severidad: a.severidad || 'LEVE',
        reaccion: a.reaccion,
        tratamientoEmergencia: a.tratamiento_emergencia,
      })),
      
      medicamentos: (medicamentos || []).map(m => ({
        nombre: m.nombre,
        dosis: m.dosis,
        frecuencia: m.frecuencia,
        viaAdministracion: m.via_administracion,
        fechaInicio: m.fecha_inicio,
        fechaFin: m.fecha_fin,
        motivo: m.motivo,
        prescritoPor: m.prescrito_por,
        activo: m.activo ?? true,
      })),
      
      vacunas: (vacunas || []).map(v => ({
        nombre: v.nombre,
        fechaAplicacion: v.fecha_aplicacion,
        dosisNumero: v.dosis_numero,
        lote: v.lote,
        establecimiento: v.establecimiento,
        proximaDosis: v.proxima_dosis,
      })),
    };

    return result;
  } catch (error) {
    console.error('Error obteniendo datos de historia médica:', error);
    throw error;
  }
}

export default {
  getScoutData,
  getAttendanceData,
  getProgressData,
  getGroupSummary,
  getActivityHistory,
  getMultipleScoutsData,
  // Nuevos servicios
  getInscripcionesAnuales,
  getRankingPatrullas,
  getContactosEmergencia,
  getDocumentacionPendiente,
  getHistoriaMedicaData,
};
