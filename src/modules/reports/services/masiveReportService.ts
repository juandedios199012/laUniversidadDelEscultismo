/**
 * Servicio para reportes masivos de impresión
 * - DNGI-03 de todos los scouts (sin DNI)
 * - DNI de todos los scouts
 * - DNI de todos los familiares
 */

import { supabase } from '../../../lib/supabase';
import { ScoutReportData, FamiliarReportData } from '../types/reportTypes';
import scoutDocumentsService from '../../../services/scoutDocumentsService';
import { DniPersonData } from '../templates/pdf/DniCollectionTemplate';

// Constantes
const MAX_FILE_SIZE_KB = 600;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_KB * 1024;

export interface DniScoutApoderadoPair {
  scoutId: string;
  scout: DniPersonData;
  apoderado: DniPersonData;
}

/**
 * Calcula la edad a partir de la fecha de nacimiento
 */
const calculateAge = (birthDate: string | null | undefined): number => {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/**
 * Obtiene todos los scouts activos con sus datos completos para DNGI-03 masivo
 */
export async function getAllScoutsForMasiveDNGI03(ramaFilter?: string, scoutId?: string): Promise<{
  scouts: ScoutReportData[];
  showAlert: boolean;
  alertMessage: string;
}> {
  try {
    // Obtener todos los scouts activos con sus datos (vía RPC)
    const { data: scoutsData, error } = await supabase.rpc(
      'api_listar_scouts_para_reportes',
      {
        p_rama: (ramaFilter && ramaFilter !== 'TODAS') ? ramaFilter : null,
        p_estado: 'ACTIVO',
        p_scout_id: scoutId || null
      }
    );

    if (error) throw error;
    if (!scoutsData || scoutsData.length === 0) {
      return { scouts: [], showAlert: false, alertMessage: '' };
    }

    // Procesar cada scout con sus familiares
    const scouts: ScoutReportData[] = await Promise.all(
      scoutsData.map(async (scoutData: any) => {
        const personaData = scoutData.persona || {};
        
        // Obtener familiares del scout
        const { data: familiaresData } = await supabase
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
              direccion,
              departamento,
              provincia,
              distrito
            )
          `)
          .eq('scout_id', scoutData.id);

        const familiares: FamiliarReportData[] = (familiaresData || []).map((fam: any) => ({
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
          esApoderado: fam.es_autorizado_recoger || false,
        }));

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
          numeroRegistro: personaData.numero_documento || '',
          fechaIngreso: scoutData.fecha_ingreso || '',
          direccion: personaData.direccion || '',
          departamento: personaData.departamento || '',
          provincia: personaData.provincia || '',
          distrito: personaData.distrito || '',
          centroEstudio: scoutData.centro_estudio || '',
          celular: personaData.celular || '',
          celularSecundario: personaData.celular_secundario || '',
          telefonoSecundario: personaData.telefono || '',
          email: personaData.correo || '',
          correoSecundario: personaData.correo_secundario || '',
          correoInstitucional: personaData.correo_institucional || '',
          anioEstudios: scoutData.anio_estudios || '',
          religion: personaData.religion || '',
          grupoSanguineo: personaData.grupo_sanguineo || '',
          factorSanguineo: personaData.factor_sanguineo || '',
          seguroMedico: personaData.seguro_medico || '',
          tipoDiscapacidad: personaData.tipo_discapacidad || '',
          carnetConadis: personaData.carnet_conadis || '',
          descripcionDiscapacidad: personaData.descripcion_discapacidad || '',
          familiares,
        };
      })
    );

    // Estimar tamaño del PDF (aproximadamente 20KB por scout con 3 páginas)
    const estimatedSize = scouts.length * 20 * 1024;
    const showAlert = estimatedSize > MAX_FILE_SIZE_BYTES;
    const alertMessage = showAlert 
      ? `El archivo puede superar los ${MAX_FILE_SIZE_KB}KB (estimado: ${Math.round(estimatedSize / 1024)}KB). Se generará de todas formas pero puede tardar más en cargar.`
      : '';

    return { scouts, showAlert, alertMessage };
  } catch (error) {
    console.error('Error obteniendo scouts para DNGI-03 masivo:', error);
    throw error;
  }
}

/**
 * Obtiene todos los scouts con sus DNI para el reporte de DNI de scouts
 * @param ramaFilter - Filtro opcional por rama (ej: 'LOBATOS', 'SCOUTS', etc.)
 */
export async function getAllScoutsWithDni(ramaFilter?: string): Promise<{
  personas: DniPersonData[];
  showAlert: boolean;
  alertMessage: string;
}> {
  try {
    // Obtener scouts activos con datos de persona (vía RPC)
    const { data: scoutsData, error } = await supabase.rpc(
      'api_listar_scouts_para_reportes',
      {
        p_rama: (ramaFilter && ramaFilter !== 'TODAS') ? ramaFilter : null,
        p_estado: 'ACTIVO'
      }
    );

    if (error) throw error;
    if (!scoutsData || scoutsData.length === 0) {
      return { personas: [], showAlert: false, alertMessage: '' };
    }

    // Obtener DNI de cada scout
    const personas: DniPersonData[] = await Promise.all(
      scoutsData.map(async (scout: any) => {
        const personaData = scout.persona || {};
        
        // Obtener URLs de DNI
        let dniAnversoUrl: string | undefined;
        let dniReversoUrl: string | undefined;
        
        try {
          const dniUrls = await scoutDocumentsService.getIdentityDocumentsForPdf('scout', scout.id);
          dniAnversoUrl = dniUrls.anverso;
          dniReversoUrl = dniUrls.reverso;
        } catch (err) {
          console.warn(`Error obteniendo DNI para scout ${scout.id}:`, err);
        }

        return {
          id: scout.id,
          nombres: personaData.nombres || '',
          apellidos: personaData.apellidos || '',
          tipoDocumento: personaData.tipo_documento || '',
          numeroDocumento: personaData.numero_documento || '',
          rama: scout.rama_actual || '',
          codigoScout: personaData.codigo_asociado || '',
          dniAnversoUrl,
          dniReversoUrl,
        };
      })
    );

    // Calcular tamaño estimado (las imágenes pueden ser grandes)
    const personasConDni = personas.filter(p => p.dniAnversoUrl || p.dniReversoUrl);
    const estimatedSize = personasConDni.length * 150 * 1024; // ~150KB por persona con 2 imágenes
    const showAlert = estimatedSize > MAX_FILE_SIZE_BYTES;
    const alertMessage = showAlert 
      ? `El archivo puede superar los ${MAX_FILE_SIZE_KB}KB (${personasConDni.length} personas con DNI cargado). Se generará de todas formas.`
      : '';

    return { personas, showAlert, alertMessage };
  } catch (error) {
    console.error('Error obteniendo scouts con DNI:', error);
    throw error;
  }
}

/**
 * Genera metadata común para los reportes
 */
export function generateMasiveReportMetadata(): { organizacion: string; fechaGeneracion: string } {
  return {
    organizacion: 'Grupo Scout Lima 12',
    fechaGeneracion: new Date().toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
  };
}

/**
 * Obtiene las ramas disponibles para filtrar
 */
export async function getAvailableRamas(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('scouts')
      .select('rama_actual')
      .eq('estado', 'ACTIVO')
      .not('rama_actual', 'is', null);
    
    if (error) throw error;
    
    const ramas = [...new Set((data || []).map(s => s.rama_actual).filter(Boolean))];
    return ramas.sort();
  } catch (error) {
    console.error('Error obteniendo ramas:', error);
    return [];
  }
}

/**
 * Obtiene pares Scout + Apoderado con DNI para exportación individual.
 * El scout va siempre primero y el familiar debe estar marcado como apoderado.
 */
export async function getScoutsWithApoderadoDni(ramaFilter?: string, scoutId?: string): Promise<{
  pares: DniScoutApoderadoPair[];
  scoutsSinApoderado: number;
}> {
  try {
    // Obtener scouts activos para pares DNI (vía RPC)
    const { data: scoutsData, error: scoutsError } = await supabase.rpc(
      'api_listar_scouts_para_reportes',
      {
        p_rama: (ramaFilter && ramaFilter !== 'TODAS') ? ramaFilter : null,
        p_estado: 'ACTIVO',
        p_scout_id: scoutId || null
      }
    );

    if (scoutsError) throw scoutsError;
    if (!scoutsData || scoutsData.length === 0) {
      return { pares: [], scoutsSinApoderado: 0 };
    }

    const scoutIds = scoutsData.map((s: any) => s.id);
    const { data: familiaresData, error: familiaresError } = await supabase
      .from('familiares_scout')
      .select(`
        id,
        scout_id,
        parentesco,
        es_autorizado_recoger,
        persona:personas!familiares_scout_persona_id_fkey (
          nombres,
          apellidos,
          tipo_documento,
          numero_documento
        )
      `)
      .in('scout_id', scoutIds);

    if (familiaresError) throw familiaresError;

    const familiaresPorScout = new Map<string, any[]>();
    (familiaresData || []).forEach((fam: any) => {
      const current = familiaresPorScout.get(fam.scout_id) || [];
      current.push(fam);
      familiaresPorScout.set(fam.scout_id, current);
    });

    const pares: DniScoutApoderadoPair[] = [];
    let scoutsSinApoderado = 0;

    for (const scout of scoutsData) {
      const personaScout: any = scout.persona || {};
      const familiaresScout = familiaresPorScout.get(scout.id) || [];
      const apoderado = familiaresScout.find((fam: any) => fam.es_autorizado_recoger || false);

      if (!apoderado) {
        scoutsSinApoderado++;
        continue;
      }

      const personaApoderado: any = apoderado.persona || {};

      let scoutDniAnversoUrl: string | undefined;
      let scoutDniReversoUrl: string | undefined;
      let apoderadoDniAnversoUrl: string | undefined;
      let apoderadoDniReversoUrl: string | undefined;

      try {
        const scoutDni = await scoutDocumentsService.getIdentityDocumentsForPdf('scout', scout.id);
        scoutDniAnversoUrl = scoutDni.anverso;
        scoutDniReversoUrl = scoutDni.reverso;
      } catch (err) {
        console.warn(`Error obteniendo DNI del scout ${scout.id}:`, err);
      }

      try {
        const apoderadoDni = await scoutDocumentsService.getIdentityDocumentsForPdf('familiar', apoderado.id);
        apoderadoDniAnversoUrl = apoderadoDni.anverso;
        apoderadoDniReversoUrl = apoderadoDni.reverso;
      } catch (err) {
        console.warn(`Error obteniendo DNI del apoderado ${apoderado.id}:`, err);
      }

      pares.push({
        scoutId: scout.id,
        scout: {
          id: scout.id,
          nombres: personaScout.nombres || '',
          apellidos: personaScout.apellidos || '',
          tipoDocumento: personaScout.tipo_documento || '',
          numeroDocumento: personaScout.numero_documento || '',
          rama: scout.rama_actual || '',
          codigoScout: personaScout.codigo_asociado || '',
          parentesco: 'SCOUT',
          dniAnversoUrl: scoutDniAnversoUrl,
          dniReversoUrl: scoutDniReversoUrl,
        },
        apoderado: {
          id: apoderado.id,
          nombres: personaApoderado.nombres || '',
          apellidos: personaApoderado.apellidos || '',
          tipoDocumento: personaApoderado.tipo_documento || '',
          numeroDocumento: personaApoderado.numero_documento || '',
          parentesco: apoderado.parentesco || 'APODERADO',
          scoutAsociado: `${personaScout.nombres || ''} ${personaScout.apellidos || ''}`.trim(),
          rama: scout.rama_actual || '',
          esApoderado: true,
          dniAnversoUrl: apoderadoDniAnversoUrl,
          dniReversoUrl: apoderadoDniReversoUrl,
        },
      });
    }

    return { pares, scoutsSinApoderado };
  } catch (error) {
    console.error('Error obteniendo pares scout/apoderado con DNI:', error);
    throw error;
  }
}
