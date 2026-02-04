/**
 * Scout Excel Data Service
 * 
 * @fileoverview
 * Servicio para obtener datos completos de scouts formateados
 * para exportación a Excel.
 * 
 * Principios:
 * - Single Responsibility: Solo obtiene y formatea datos
 * - DRY: Reutiliza lógica de reportDataService
 * - Integridad de datos: Maneja nulls y valores por defecto
 */

import { supabase } from '../../../lib/supabase';
import { ScoutExcelData, FamiliarExcelData } from './excelService';

/**
 * Obtiene todos los scouts con sus datos completos para Excel
 * Incluye familiares, patrullas y todos los campos
 */
export async function getAllScoutsForExcel(options?: {
  rama?: string;
  estado?: 'ACTIVO' | 'INACTIVO' | 'TODOS';
  incluirFamiliares?: boolean;
}): Promise<ScoutExcelData[]> {
  const { 
    rama, 
    estado = 'TODOS',
    incluirFamiliares = true 
  } = options || {};

  try {
    // Query principal de scouts con personas
    let query = supabase
      .from('scouts')
      .select(`
        id,
        codigo_scout,
        rama_actual,
        estado,
        fecha_ingreso,
        codigo_asociado,
        centro_estudio,
        anio_estudios,
        ocupacion,
        centro_laboral,
        seguro_medico,
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
          direccion_completa,
          codigo_postal,
          ubicacion_latitud,
          ubicacion_longitud,
          religion,
          grupo_sanguineo,
          factor_sanguineo,
          tipo_discapacidad,
          carnet_conadis,
          descripcion_discapacidad
        )
      `)
      .order('codigo_scout', { ascending: true });

    // Filtros
    if (rama) {
      query = query.eq('rama_actual', rama);
    }
    if (estado !== 'TODOS') {
      query = query.eq('estado', estado);
    }

    const { data: scoutsData, error: scoutsError } = await query;

    if (scoutsError) {
      console.error('Error obteniendo scouts:', scoutsError);
      throw scoutsError;
    }

    if (!scoutsData || scoutsData.length === 0) {
      return [];
    }

    // Obtener patrullas de todos los scouts de una vez
    const scoutIds = scoutsData.map(s => s.id);
    
    const { data: membresiasData } = await supabase
      .from('miembros_patrulla')
      .select(`
        scout_id,
        cargo_patrulla,
        patrulla:patrullas (
          nombre
        )
      `)
      .in('scout_id', scoutIds)
      .eq('estado_miembro', 'ACTIVO')
      .is('fecha_salida', null);

    // Crear mapa de patrullas por scout
    const patrullasMap = new Map<string, { nombre: string; cargo: string }>();
    (membresiasData || []).forEach((m: any) => {
      if (m.patrulla?.nombre) {
        patrullasMap.set(m.scout_id, {
          nombre: m.patrulla.nombre,
          cargo: m.cargo_patrulla || 'MIEMBRO',
        });
      }
    });

    // Obtener familiares si se requiere
    let familiaresMap = new Map<string, FamiliarExcelData[]>();
    
    if (incluirFamiliares) {
      const { data: familiaresData } = await supabase
        .from('familiares_scout')
        .select(`
          id,
          scout_id,
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
        .in('scout_id', scoutIds)
        .order('es_contacto_emergencia', { ascending: false });

      // Agrupar familiares por scout
      (familiaresData || []).forEach((f: any) => {
        const scoutId = f.scout_id;
        const familiar: FamiliarExcelData = {
          id: f.id,
          nombres: f.persona?.nombres || '',
          apellidos: f.persona?.apellidos || '',
          parentesco: f.parentesco || '',
          celular: f.persona?.celular || '',
          celular_secundario: f.persona?.celular_secundario || '',
          telefono: f.persona?.telefono || '',
          correo: f.persona?.correo || '',
          correo_secundario: f.persona?.correo_secundario || '',
          profesion: f.profesion || '',
          centro_laboral: f.centro_laboral || '',
          cargo: f.cargo || '',
          es_contacto_emergencia: f.es_contacto_emergencia || false,
          es_autorizado_recoger: f.es_autorizado_recoger || false,
          direccion: f.persona?.direccion || '',
          departamento: f.persona?.departamento || '',
          provincia: f.persona?.provincia || '',
          distrito: f.persona?.distrito || '',
        };

        if (!familiaresMap.has(scoutId)) {
          familiaresMap.set(scoutId, []);
        }
        familiaresMap.get(scoutId)!.push(familiar);
      });
    }

    // Mapear a formato Excel
    const scoutsExcel: ScoutExcelData[] = scoutsData.map((scout: any) => {
      const persona = scout.persona || {};
      const patrulla = patrullasMap.get(scout.id);
      const familiares = familiaresMap.get(scout.id) || [];

      return {
        // Identificación
        id: scout.id,
        codigo_scout: scout.codigo_scout || '',
        estado: scout.estado || 'ACTIVO',
        
        // Datos Personales
        nombres: persona.nombres || '',
        apellidos: persona.apellidos || '',
        fecha_nacimiento: persona.fecha_nacimiento || '',
        edad: calculateAge(persona.fecha_nacimiento),
        sexo: persona.sexo || '',
        tipo_documento: persona.tipo_documento || '',
        numero_documento: persona.numero_documento || '',
        
        // Contacto Scout
        celular: persona.celular || '',
        celular_secundario: persona.celular_secundario || '',
        telefono: persona.telefono || '',
        correo: persona.correo || '',
        correo_secundario: persona.correo_secundario || '',
        correo_institucional: persona.correo_institucional || '',
        
        // Ubicación
        direccion: persona.direccion || '',
        direccion_completa: persona.direccion_completa || '',
        departamento: persona.departamento || '',
        provincia: persona.provincia || '',
        distrito: persona.distrito || '',
        codigo_postal: persona.codigo_postal || '',
        ubicacion_latitud: persona.ubicacion_latitud || null,
        ubicacion_longitud: persona.ubicacion_longitud || null,
        
        // Scout/Academia
        rama_actual: scout.rama_actual || '',
        patrulla: patrulla?.nombre || '',
        cargo_patrulla: patrulla?.cargo || '',
        fecha_ingreso: scout.fecha_ingreso || '',
        codigo_asociado: scout.codigo_asociado || '',
        centro_estudio: scout.centro_estudio || '',
        anio_estudios: scout.anio_estudios || '',
        ocupacion: scout.ocupacion || '',
        centro_laboral: scout.centro_laboral || '',
        
        // Salud
        grupo_sanguineo: persona.grupo_sanguineo || '',
        factor_sanguineo: persona.factor_sanguineo || '',
        seguro_medico: scout.seguro_medico || '',
        tipo_discapacidad: persona.tipo_discapacidad || '',
        carnet_conadis: persona.carnet_conadis || '',
        descripcion_discapacidad: persona.descripcion_discapacidad || '',
        
        // Religión
        religion: persona.religion || '',
        
        // Familiares
        familiares: familiares,
      };
    });

    console.log(`✅ Obtenidos ${scoutsExcel.length} scouts para Excel`);
    return scoutsExcel;

  } catch (error) {
    console.error('❌ Error en getAllScoutsForExcel:', error);
    throw error;
  }
}

/**
 * Calcula la edad a partir de fecha de nacimiento
 */
function calculateAge(birthDate: string | undefined): number {
  if (!birthDate) return 0;
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return 0;
  }
}

/**
 * Obtiene estadísticas rápidas para preview
 */
export async function getScoutsExcelPreview(options?: {
  rama?: string;
  estado?: 'ACTIVO' | 'INACTIVO' | 'TODOS';
}): Promise<{
  totalScouts: number;
  totalFamiliares: number;
  scoutsPorRama: Record<string, number>;
  scoutsPorEstado: Record<string, number>;
}> {
  const { rama, estado = 'TODOS' } = options || {};

  try {
    let query = supabase
      .from('scouts')
      .select('id, rama_actual, estado', { count: 'exact' });

    if (rama) {
      query = query.eq('rama_actual', rama);
    }
    if (estado !== 'TODOS') {
      query = query.eq('estado', estado);
    }

    const { data, count } = await query;

    // Calcular distribuciones
    const scoutsPorRama: Record<string, number> = {};
    const scoutsPorEstado: Record<string, number> = {};

    (data || []).forEach((s: any) => {
      const r = s.rama_actual || 'Sin Rama';
      const e = s.estado || 'Sin Estado';
      scoutsPorRama[r] = (scoutsPorRama[r] || 0) + 1;
      scoutsPorEstado[e] = (scoutsPorEstado[e] || 0) + 1;
    });

    // Contar familiares
    const scoutIds = (data || []).map((s: any) => s.id);
    const { count: familiaresCount } = await supabase
      .from('familiares_scout')
      .select('id', { count: 'exact', head: true })
      .in('scout_id', scoutIds);

    return {
      totalScouts: count || 0,
      totalFamiliares: familiaresCount || 0,
      scoutsPorRama,
      scoutsPorEstado,
    };
  } catch (error) {
    console.error('Error en preview:', error);
    return {
      totalScouts: 0,
      totalFamiliares: 0,
      scoutsPorRama: {},
      scoutsPorEstado: {},
    };
  }
}

export default {
  getAllScoutsForExcel,
  getScoutsExcelPreview,
};
