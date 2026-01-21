import { supabase } from '../lib/supabase';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import AttendanceByScoutTemplate from '../modules/reports/templates/pdf/AttendanceByScoutTemplate';

interface ReporteAsistenciaResponse {
  scout: {
    id: string;
    nombres: string;
    apellidos: string;
    codigo_scout: string;
    rama_actual: string;
    foto_url?: string;
  };
  asistencias: Array<{
    fecha: string;
    titulo: string;
    estado: 'presente' | 'ausente' | 'tardanza' | 'justificado';
    tipo_actividad?: string;
  }>;
  estadisticas: {
    total_reuniones: number;
    total_presente: number;
    total_ausente: number;
    total_tardanza: number;
    total_justificado: number;
    porcentaje_asistencia: number;
    racha_actual: number;
    tendencia: 'mejorando' | 'estable' | 'empeorando';
  };
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
}

class ReporteAsistenciaService {
  /**
   * Obtener reporte completo de asistencia de un scout
   */
  static async obtenerReporte(
    scoutId: string,
    fechaInicio: string,
    fechaFin: string
  ): Promise<{ data: ReporteAsistenciaResponse | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('api_obtener_reporte_asistencia_scout', {
        p_scout_id: scoutId,
        p_fecha_inicio: fechaInicio,
        p_fecha_fin: fechaFin
      });

      if (error) {
        console.error('❌ Error al obtener reporte:', error);
        return { data: null, error: error.message };
      }

      if (!data?.success) {
        return { data: null, error: data?.message || 'Error al generar reporte' };
      }

      return { data: data.data as ReporteAsistenciaResponse, error: null };
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * Obtener lista de scouts activos para selector
   */
  static async obtenerScoutsActivos(): Promise<{
    data: Array<{
      id: string;
      nombres: string;
      apellidos: string;
      codigo_scout: string;
      rama_actual: string;
    }> | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('scouts')
        .select(`
          id,
          codigo_asociado,
          rama_actual,
          personas!inner(nombres, apellidos)
        `)
        .eq('estado', 'ACTIVO')
        .order('personas(apellidos)', { ascending: true });

      if (error) {
        console.error('❌ Error al obtener scouts:', error);
        return { data: null, error: error.message };
      }

      const scouts = data.map((scout: any) => ({
        id: scout.id,
        nombres: scout.personas.nombres,
        apellidos: scout.personas.apellidos,
        codigo_scout: scout.codigo_asociado || 'S/C',
        rama_actual: scout.rama_actual
      }));

      return { data: scouts, error: null };
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * Generar y descargar PDF del reporte
   */
  static async generarPDF(
    scout: ReporteAsistenciaResponse['scout'],
    estadisticas: ReporteAsistenciaResponse['estadisticas'],
    asistencias: ReporteAsistenciaResponse['asistencias'],
    periodo: ReporteAsistenciaResponse['periodo']
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Generar el PDF usando la plantilla
      const blob = await pdf(
        React.createElement(AttendanceByScoutTemplate, {
          scout,
          asistencias,
          estadisticas,
          periodo,
          generatedAt: new Date().toISOString()
        })
      ).toBlob();

      // Crear URL temporal para descargar
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Reporte_Asistencia_${scout.nombres}_${scout.apellidos}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al generar PDF' 
      };
    }
  }
}

export default ReporteAsistenciaService;
