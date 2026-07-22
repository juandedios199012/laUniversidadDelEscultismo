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
  FamiliarReportData,
  AutorizacionApoderadoReportData,
} from '../types/reportTypes';
import { scoutDocumentsService } from '../../../services/scoutDocumentsService';

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
          seguro_medico,
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

    // Mapear todos los familiares con sus documentos
    const familiaresBase = familiaresError || !familiaresScoutData 
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
          esAutorizadoRecoger: fam.es_autorizado_recoger || false,
          esApoderado: fam.es_autorizado_recoger || false
        }));

    // Cargar URLs de documentos (DNI anverso/reverso) para cada familiar
    const familiares: FamiliarReportData[] = await Promise.all(
      familiaresBase.map(async (fam) => {
        if (!fam.id) return fam;
        
        try {
          // Obtener URLs de DNI anverso y reverso
          const dniDocs = await scoutDocumentsService.getIdentityDocumentUrls('familiar', fam.id).catch(() => null);
          
          return {
            ...fam,
            dniAnversoUrl: dniDocs?.anverso || undefined,
            dniReversoUrl: dniDocs?.reverso || undefined,
          };
        } catch (error) {
          console.warn(`Error cargando documentos para familiar ${fam.id}:`, error);
          return fam;
        }
      })
    );

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
      // Datos médicos y de salud (todos vienen de personas)
      grupoSanguineo: personaData.grupo_sanguineo || '',
      factorSanguineo: personaData.factor_sanguineo || '',
      seguroMedico: personaData.seguro_medico || '',
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
 * Obtiene datos de Historia Médica para reporte PDF/DOCX
 */
export async function getHistoriaMedicaData(
  scoutId: string,
  _personaId: string
): Promise<HistoriaMedicaReportData | null> {
  try {
    // Fuente única: api_obtener_scout, que ya incluye datos personales,
    // contacto, familiares y el Step Salud completo (estatura, peso,
    // seguro médico, discapacidad, condiciones, alergias, medicamentos
    // y vacunas). Ya NO se usa el modal "Historia Médica"
    // (historias_medicas / api_obtener_historia_medica).
    const { data: scoutRpcData, error: scoutError } = await supabase
      .rpc('api_obtener_scout', {
        p_scout_id: scoutId
      });

    if (scoutError || !scoutRpcData?.success) {
      console.error('Error obteniendo scout via RPC:', scoutError || scoutRpcData?.errors);
      return null;
    }

    const scoutData = scoutRpcData.data;

    // Familiares del scout (ya vienen en la respuesta del RPC)
    const familiares = scoutData?.familiares || [];

    // Tomar primer familiar como contacto emergencia, segundo como alternativo
    const contactoEmergencia = familiares[0];
    const contactoAlternativo = familiares[1];

    // Firma del contacto de emergencia, si la subió en su registro de familiar
    const firmaContactoEmergencia = contactoEmergencia?.id
      ? await scoutDocumentsService.getDocumentForPdf('familiar', contactoEmergencia.id, 'firma').catch(() => null)
      : null;

    // Calcular edad
    const fechaNac = scoutData?.fecha_nacimiento ? new Date(scoutData.fecha_nacimiento) : null;
    const edad = fechaNac ? Math.floor((Date.now() - fechaNac.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

    const result: HistoriaMedicaReportData = {
      scoutId: scoutData.id || scoutId,
      codigoScout: scoutData.codigo_asociado || '',
      numeroDocumento: scoutData.numero_documento || '',
      nombreCompleto: scoutData.nombre_completo || `${scoutData.nombres || ''} ${scoutData.apellidos || ''}`.trim(),
      fechaNacimiento: scoutData.fecha_nacimiento || '',
      edad,
      sexo: scoutData.sexo,
      // Dirección solo la calle/avenida
      direccion: scoutData.direccion || '',
      // Campos separados para el PDF
      distrito: scoutData.distrito || '',
      provincia: scoutData.provincia || '',
      departamento: scoutData.departamento || '',
      rama: scoutData.rama_actual || scoutData.rama || '',
      patrulla: scoutData.patrulla || '',
      telefonoCasa: scoutData.telefono || '', // Teléfono fijo del scout

      // Contacto de emergencia (Familiar 1)
      contactoEmergencia: contactoEmergencia ? {
        nombre: contactoEmergencia.nombre_completo || `${contactoEmergencia.nombres || ''} ${contactoEmergencia.apellidos || ''}`.trim(),
        parentesco: contactoEmergencia.parentesco || '',
        celular: contactoEmergencia.celular || '',
        telefono: contactoEmergencia.telefono,
        direccion: contactoEmergencia.direccion || '',
        numeroDocumento: contactoEmergencia.numero_documento || '',
        firmaBase64: firmaContactoEmergencia || undefined,
      } : undefined,

      // Contacto alternativo (Familiar 2)
      contactoAlternativo: contactoAlternativo ? {
        nombre: contactoAlternativo.nombre_completo || `${contactoAlternativo.nombres || ''} ${contactoAlternativo.apellidos || ''}`.trim(),
        parentesco: contactoAlternativo.parentesco || '',
        celular: contactoAlternativo.celular || '',
      } : undefined,

      // Fecha impresa en el documento; se sobreescribe siempre al exportar
      // (ver options.fechaLlenado en historiaMedicaExportService)
      fechaLlenado: new Date().toISOString().split('T')[0],
      estaturaCm: scoutData.estatura_cm != null ? Number(scoutData.estatura_cm) : undefined,
      pesoKg: scoutData.peso_kg != null ? Number(scoutData.peso_kg) : undefined,

      // Seguro médico (Step Salud)
      seguroMedico: scoutData.seguro_medico,

      // Sangre (Step Salud)
      grupoSanguineo: scoutData.grupo_sanguineo,
      factorSanguineo: scoutData.factor_sanguineo,

      // Discapacidad (Step Salud)
      tipoDiscapacidad: scoutData.tipo_discapacidad,
      carnetConadis: scoutData.carnet_conadis,
      descripcionDiscapacidad: scoutData.descripcion_discapacidad,

      // Listas (Step Salud)
      condiciones: (scoutData.condiciones || []).map((c: any) => ({
        condicion: c.condicion || '',
        fechaAtencion: c.fecha_atencion,
      })),

      alergias: (scoutData.alergias || []).map((a: any) => ({
        alergia: a.alergia || '',
        mencionar: a.mencionar,
      })),

      medicamentos: (scoutData.medicamentos || []).map((m: any) => ({
        medicamento: m.medicamento || '',
        dosis: m.dosis,
        frecuencia: m.frecuencia,
        activo: m.activo ?? true,
        fechaInicioDuracion: m.fecha_inicio_duracion,
      })),

      vacunas: (scoutData.vacunas || []).map((v: any) => ({
        vacuna: v.vacuna || '',
        fechaUltimaDosis: v.fecha_ultima_dosis,
      })),
    };

    return result;
  } catch (error) {
    console.error('Error obteniendo datos de historia médica:', error);
    throw error;
  }
}

/**
 * Obtiene los datos de identificación (Scout + Apoderado Legal) para el
 * reporte "Autorización del Padre o Apoderado" (ANEXO 4).
 * Reutiliza la misma RPC que Historia Médica.
 */
export async function getAutorizacionApoderadoData(
  scoutId: string,
  _personaId: string
): Promise<AutorizacionApoderadoReportData | null> {
  try {
    const { data: scoutRpcData, error: scoutError } = await supabase
      .rpc('api_obtener_scout', { p_scout_id: scoutId });

    if (scoutError || !scoutRpcData?.success) {
      console.error('Error obteniendo scout via RPC:', scoutError || scoutRpcData?.errors);
      return null;
    }

    const scoutData = scoutRpcData.data;
    const familiares = scoutData?.familiares || [];

    // Familiar marcado como "Apoderado Legal"; si ninguno lo está, se usa
    // el primero (contacto de emergencia) como respaldo.
    const apoderadoFamiliar = familiares.find((f: any) => f.es_apoderado) || familiares[0];

    let tipo: 'PADRE' | 'MADRE' | 'APODERADO' = 'APODERADO';
    const parentesco = (apoderadoFamiliar?.parentesco || '').toUpperCase();
    if (parentesco === 'PADRE') tipo = 'PADRE';
    else if (parentesco === 'MADRE') tipo = 'MADRE';

    // Firma del apoderado, si la subió en su registro de familiar
    const firmaApoderado = apoderadoFamiliar?.id
      ? await scoutDocumentsService.getDocumentForPdf('familiar', apoderadoFamiliar.id, 'firma').catch(() => null)
      : null;

    return {
      scoutId: scoutData.id || scoutId,
      codigoScout: scoutData.codigo_asociado || '',
      numeroDocumento: scoutData.numero_documento || '',
      nombreCompleto: scoutData.nombre_completo || `${scoutData.nombres || ''} ${scoutData.apellidos || ''}`.trim(),
      sexo: scoutData.sexo,
      apoderado: apoderadoFamiliar ? {
        nombre: apoderadoFamiliar.nombre_completo || `${apoderadoFamiliar.nombres || ''} ${apoderadoFamiliar.apellidos || ''}`.trim(),
        numeroDocumento: apoderadoFamiliar.numero_documento || '',
        tipo,
        firmaBase64: firmaApoderado || undefined,
      } : null,
      // Fecha impresa en el documento; se sobreescribe siempre al exportar
      // (ver options.fechaDocumento en autorizacionApoderadoExportService)
      fechaDocumento: new Date().toISOString().split('T')[0],
    };
  } catch (error) {
    console.error('Error obteniendo datos de autorización del padre o apoderado:', error);
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
  getRankingPatrullas,
  getHistoriaMedicaData,
  getAutorizacionApoderadoData,
};
