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
export async function getAllScoutsForMasiveDNGI03(): Promise<{
  scouts: ScoutReportData[];
  showAlert: boolean;
  alertMessage: string;
}> {
  try {
    // Obtener todos los scouts activos con sus datos
    const { data: scoutsData, error } = await supabase
      .from('scouts')
      .select(`
        id,
        codigo_scout,
        codigo_asociado,
        rama_actual,
        centro_estudio,
        anio_estudios,
        ocupacion,
        centro_laboral,
        fecha_ingreso,
        estado,
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
          direccion,
          direccion_completa,
          departamento,
          provincia,
          distrito,
          codigo_postal,
          religion,
          grupo_sanguineo,
          factor_sanguineo,
          seguro_medico,
          tipo_discapacidad,
          carnet_conadis,
          descripcion_discapacidad
        )
      `)
      .eq('estado', 'ACTIVO')
      .order('rama_actual', { ascending: true })
      .order('codigo_scout', { ascending: true });

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
    // Obtener todos los scouts activos
    let query = supabase
      .from('scouts')
      .select(`
        id,
        codigo_scout,
        rama_actual,
        persona:personas!scouts_persona_id_fkey (
          id,
          nombres,
          apellidos,
          tipo_documento,
          numero_documento
        )
      `)
      .eq('estado', 'ACTIVO');
    
    // Aplicar filtro de rama si se especifica
    if (ramaFilter && ramaFilter !== 'TODAS') {
      query = query.eq('rama_actual', ramaFilter);
    }
    
    const { data: scoutsData, error } = await query
      .order('rama_actual', { ascending: true })
      .order('codigo_scout', { ascending: true });

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
          codigoScout: scout.codigo_scout || '',
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
 * Obtiene todos los familiares con sus DNI para el reporte de DNI de familiares
 * @param ramaFilter - Filtro opcional por rama del scout asociado (ej: 'LOBATOS', 'SCOUTS', etc.)
 */
export async function getAllFamiliaresWithDni(ramaFilter?: string): Promise<{
  personas: DniPersonData[];
  showAlert: boolean;
  alertMessage: string;
}> {
  try {
    // Primero obtener los scouts activos (opcionalmente filtrados por rama)
    let scoutsQuery = supabase
      .from('scouts')
      .select('id, codigo_scout, rama_actual, persona:personas!scouts_persona_id_fkey(nombres, apellidos)')
      .eq('estado', 'ACTIVO');
    
    if (ramaFilter && ramaFilter !== 'TODAS') {
      scoutsQuery = scoutsQuery.eq('rama_actual', ramaFilter);
    }
    
    const { data: scoutsActivos, error: scoutsError } = await scoutsQuery;
    
    if (scoutsError) throw scoutsError;
    if (!scoutsActivos || scoutsActivos.length === 0) {
      return { personas: [], showAlert: false, alertMessage: '' };
    }
    
    const scoutIds = scoutsActivos.map(s => s.id);
    const scoutMap = new Map(scoutsActivos.map(s => [s.id, s]));
    
    // Ahora obtener familiares de esos scouts
    const { data: familiaresData, error } = await supabase
      .from('familiares_scout')
      .select(`
        id,
        parentesco,
        scout_id,
        persona:personas!familiares_scout_persona_id_fkey (
          id,
          nombres,
          apellidos,
          tipo_documento,
          numero_documento
        )
      `)
      .in('scout_id', scoutIds);

    if (error) throw error;
    if (!familiaresData || familiaresData.length === 0) {
      return { personas: [], showAlert: false, alertMessage: '' };
    }

    // Obtener DNI de cada familiar
    const personas: DniPersonData[] = await Promise.all(
      familiaresData.map(async (familiar: any) => {
        const personaData = familiar.persona || {};
        const scout = scoutMap.get(familiar.scout_id);
        const scoutPersona = scout?.persona as any || {};
        
        // Obtener URLs de DNI del familiar
        let dniAnversoUrl: string | undefined;
        let dniReversoUrl: string | undefined;
        
        try {
          const dniUrls = await scoutDocumentsService.getIdentityDocumentsForPdf('familiar', familiar.id);
          dniAnversoUrl = dniUrls.anverso;
          dniReversoUrl = dniUrls.reverso;
        } catch (err) {
          console.warn(`Error obteniendo DNI para familiar ${familiar.id}:`, err);
        }

        return {
          id: familiar.id,
          nombres: personaData.nombres || '',
          apellidos: personaData.apellidos || '',
          tipoDocumento: personaData.tipo_documento || '',
          numeroDocumento: personaData.numero_documento || '',
          parentesco: familiar.parentesco || '',
          scoutAsociado: `${scoutPersona.nombres || ''} ${scoutPersona.apellidos || ''}`.trim(),
          rama: scout?.rama_actual || '',
          dniAnversoUrl,
          dniReversoUrl,
        };
      })
    );

    // Calcular tamaño estimado
    const personasConDni = personas.filter(p => p.dniAnversoUrl || p.dniReversoUrl);
    const estimatedSize = personasConDni.length * 150 * 1024;
    const showAlert = estimatedSize > MAX_FILE_SIZE_BYTES;
    const alertMessage = showAlert 
      ? `El archivo puede superar los ${MAX_FILE_SIZE_KB}KB (${personasConDni.length} familiares con DNI cargado). Se generará de todas formas.`
      : '';

    return { personas, showAlert, alertMessage };
  } catch (error) {
    console.error('Error obteniendo familiares con DNI:', error);
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
 * Divide un array de personas en grupos para no superar 600KB por PDF
 * Estima ~150KB por persona con DNI cargado
 */
export function splitPersonasForPdf(personas: DniPersonData[]): DniPersonData[][] {
  const personasConDni = personas.filter(p => p.dniAnversoUrl || p.dniReversoUrl);
  const personasSinDni = personas.filter(p => !p.dniAnversoUrl && !p.dniReversoUrl);
  
  // Máximo de personas con DNI por archivo (~150KB por persona = ~4 personas por 600KB)
  const maxPersonasConDniPorArchivo = 4;
  
  const grupos: DniPersonData[][] = [];
  
  // Dividir personas con DNI
  for (let i = 0; i < personasConDni.length; i += maxPersonasConDniPorArchivo) {
    grupos.push(personasConDni.slice(i, i + maxPersonasConDniPorArchivo));
  }
  
  // Si hay personas sin DNI, agregarlas al último grupo o crear uno nuevo
  if (personasSinDni.length > 0) {
    if (grupos.length === 0) {
      grupos.push(personasSinDni);
    } else {
      // Agregar al último grupo si hay espacio, sino crear nuevo
      const ultimoGrupo = grupos[grupos.length - 1];
      const espacioDisponible = maxPersonasConDniPorArchivo - ultimoGrupo.filter(p => p.dniAnversoUrl || p.dniReversoUrl).length;
      if (espacioDisponible > 0) {
        grupos[grupos.length - 1] = [...ultimoGrupo, ...personasSinDni];
      } else {
        grupos.push(personasSinDni);
      }
    }
  }
  
  return grupos.length > 0 ? grupos : [[]];
}
