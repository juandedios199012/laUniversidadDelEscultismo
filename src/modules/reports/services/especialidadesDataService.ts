/**
 * Servicio para obtener datos de especialidades para reportes PDF/DOCX
 */

import { supabase } from '../../../lib/supabase';
import { EspecialidadesReportData, EspecialidadesScoutData } from '../types/reportTypes';

/**
 * Obtiene datos completos de especialidades para el reporte PDF
 */
export async function getEspecialidadesReportData(
  filtroRama?: string
): Promise<EspecialidadesReportData> {
  // Obtener datos básicos del reporte
  const { data: reporteBasico, error: errorBasico } = await supabase.rpc(
    'api_reporte_especialidades_rama',
    { p_rama: filtroRama || null }
  );

  if (errorBasico) throw errorBasico;

  const reporte = reporteBasico?.reporte || [];

  // Obtener todos los progresos con scout y especialidad
  const { data: progresosData, error: progresosError } = await supabase
    .from('progresos_especialidad')
    .select(`
      id,
      scout_id,
      especialidad_id,
      estado,
      fase_exploracion_completada,
      fase_taller_completada,
      fase_desafio_completada,
      fecha_inicio,
      fecha_completado,
      scouts (
        id,
        codigo_asociado,
        rama_actual,
        patrulla_id,
        persona:personas!scouts_persona_id_fkey (
          nombres,
          apellidos
        )
      ),
      especialidades (
        id,
        nombre,
        areas_especialidad (nombre, color)
      )
    `);

  if (progresosError) {
    console.error('Error obteniendo progresos:', progresosError);
  }

  const progresos = progresosData || [];

  // Calcular estadísticas del dashboard
  const totalScouts = reporte.length;
  const totalAsignaciones = reporte.reduce((sum: number, r: any) => sum + r.total_especialidades, 0);
  const especialidadesCompletadas = reporte.reduce((sum: number, r: any) => sum + r.completadas, 0);
  const especialidadesEnProgreso = reporte.reduce((sum: number, r: any) => sum + r.en_progreso, 0);
  const tasaCompletado = totalAsignaciones > 0 
    ? (especialidadesCompletadas / totalAsignaciones) * 100 
    : 0;
  const promedioEspecialidadesPorScout = totalScouts > 0 
    ? totalAsignaciones / totalScouts 
    : 0;

  // Calcular por rama
  const ramaCounts: Record<string, { scouts: number; especialidades: number; completadas: number }> = {};
  reporte.forEach((r: any) => {
    const rama = r.rama || 'Sin rama';
    if (!ramaCounts[rama]) {
      ramaCounts[rama] = { scouts: 0, especialidades: 0, completadas: 0 };
    }
    ramaCounts[rama].scouts += 1;
    ramaCounts[rama].especialidades += r.total_especialidades;
    ramaCounts[rama].completadas += r.completadas;
  });

  const porRama = Object.entries(ramaCounts).map(([rama, stats]) => ({
    rama,
    scouts: stats.scouts,
    especialidades: stats.especialidades,
    completadas: stats.completadas,
    porcentaje: stats.especialidades > 0 
      ? (stats.completadas / stats.especialidades) * 100 
      : 0,
  }));

  // Calcular por área
  const areaStats: Record<string, { total: number; completadas: number; color: string }> = {};
  
  progresos.forEach((p: any) => {
    const areaNombre = p.especialidades?.areas_especialidad?.nombre || 'Otras';
    const areaColor = p.especialidades?.areas_especialidad?.color || '#6B7280';
    
    if (!areaStats[areaNombre]) {
      areaStats[areaNombre] = { total: 0, completadas: 0, color: areaColor };
    }
    areaStats[areaNombre].total += 1;
    if (p.estado === 'completada') {
      areaStats[areaNombre].completadas += 1;
    }
  });

  const porArea = Object.entries(areaStats).map(([area, stats]) => ({
    area,
    color: stats.color,
    total: stats.total,
    completadas: stats.completadas,
    porcentaje: stats.total > 0 ? (stats.completadas / stats.total) * 100 : 0,
  }));

  // Top especialidades más populares
  const especialidadCounts: Record<string, { nombre: string; area: string; asignaciones: number; completadas: number }> = {};
  
  progresos.forEach((p: any) => {
    const espId = p.especialidad_id;
    const espNombre = p.especialidades?.nombre || 'Desconocida';
    const areaNombre = p.especialidades?.areas_especialidad?.nombre || 'Otras';
    
    if (!especialidadCounts[espId]) {
      especialidadCounts[espId] = { nombre: espNombre, area: areaNombre, asignaciones: 0, completadas: 0 };
    }
    especialidadCounts[espId].asignaciones += 1;
    if (p.estado === 'completada') {
      especialidadCounts[espId].completadas += 1;
    }
  });

  const topEspecialidades = Object.values(especialidadCounts)
    .sort((a, b) => b.asignaciones - a.asignaciones)
    .slice(0, 10);

  // Scouts destacados (más especialidades completadas)
  const scoutsDestacados = reporte
    .filter((r: any) => r.completadas > 0)
    .sort((a: any, b: any) => b.completadas - a.completadas)
    .slice(0, 9)
    .map((r: any) => ({
      nombre: r.nombre,
      rama: r.rama || 'Sin rama',
      especialidadesCompletadas: r.completadas,
    }));

  // Construir detalle por scout
  const scoutsData: EspecialidadesScoutData[] = reporte.map((r: any) => {
    // Filtrar progresos de este scout
    const scoutProgresos = progresos.filter((p: any) => p.scout_id === r.scout_id);
    
    return {
      scoutId: r.scout_id,
      codigoScout: r.codigo_scout || '-',
      nombreCompleto: r.nombre,
      rama: r.rama || 'Sin rama',
      patrulla: r.patrulla || undefined,
      especialidades: scoutProgresos.map((p: any) => ({
        id: p.id,
        scoutId: p.scout_id,
        especialidadId: p.especialidad_id,
        especialidadNombre: p.especialidades?.nombre || 'Desconocida',
        especialidadArea: p.especialidades?.areas_especialidad?.nombre || 'Otras',
        areaColor: p.especialidades?.areas_especialidad?.color || '#6B7280',
        estado: p.estado,
        fechaInicio: p.fecha_inicio,
        fechaCompletado: p.fecha_completado,
        porcentajeAvance: calcularPorcentajeAvance(p),
        fasesCompletadas: {
          exploracion: p.fase_exploracion_completada || false,
          taller: p.fase_taller_completada || false,
          desafio: p.fase_desafio_completada || false,
        },
      })),
      resumen: {
        total: r.total_especialidades,
        completadas: r.completadas,
        enProgreso: r.en_progreso,
        porcentajeGeneral: r.total_especialidades > 0 
          ? (r.completadas / r.total_especialidades) * 100 
          : 0,
      },
    };
  });

  return {
    filtroRama,
    fechaGeneracion: new Date(),
    dashboard: {
      totalScouts,
      totalAsignaciones,
      especialidadesCompletadas,
      especialidadesEnProgreso,
      promedioEspecialidadesPorScout,
      tasaCompletado,
      porRama,
      porArea,
      topEspecialidades,
      scoutsDestacados,
    },
    scouts: scoutsData,
  };
}

/**
 * Calcula el porcentaje de avance de una especialidad
 */
function calcularPorcentajeAvance(progreso: any): number {
  let completadas = 0;
  if (progreso.fase_exploracion_completada) completadas++;
  if (progreso.fase_taller_completada) completadas++;
  if (progreso.fase_desafio_completada) completadas++;
  return Math.round((completadas / 3) * 100);
}
