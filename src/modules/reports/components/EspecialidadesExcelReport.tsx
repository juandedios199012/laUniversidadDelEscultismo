/**
 * Componente para exportar reporte de Especialidades Scout
 * Genera un Excel con estadísticas de especialidades por scout y rama
 */

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Award, Users, CheckCircle, Clock } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface ReporteEspecialidad {
  scout_id: string;
  codigo_scout: string;
  nombre: string;
  rama: string;
  patrulla: string | null;
  total_especialidades: number;
  completadas: number;
  en_progreso: number;
}

interface EspecialidadesExcelReportProps {
  filterRama?: string;
}

export const EspecialidadesExcelReport: React.FC<EspecialidadesExcelReportProps> = ({ 
  filterRama: initialRama = '' 
}) => {
  const [loading, setLoading] = useState(false);
  const [reporte, setReporte] = useState<ReporteEspecialidad[]>([]);
  const [filterRama, setFilterRama] = useState(initialRama);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    cargarReporte();
  }, [filterRama]);

  const cargarReporte = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase.rpc('api_reporte_especialidades_rama', {
        p_rama: filterRama || null
      });

      if (error) throw error;
      
      if (data?.success) {
        setReporte(data.reporte || []);
      }
    } catch (error) {
      console.error('Error cargando reporte:', error);
      toast.error('Error al cargar datos del reporte');
    } finally {
      setLoadingData(false);
    }
  };

  // Calcular totales
  const totales = reporte.reduce(
    (acc, r) => ({
      scouts: acc.scouts + 1,
      asignaciones: acc.asignaciones + r.total_especialidades,
      completadas: acc.completadas + r.completadas,
      enProgreso: acc.enProgreso + r.en_progreso
    }),
    { scouts: 0, asignaciones: 0, completadas: 0, enProgreso: 0 }
  );

  const exportarExcel = async () => {
    if (reporte.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    setLoading(true);
    try {
      // Crear workbook con ExcelJS
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema Scout Lima 12';
      workbook.created = new Date();

      // ========== HOJA 1: Especialidades ==========
      const wsEspecialidades = workbook.addWorksheet('Especialidades', {
        views: [{ state: 'frozen', ySplit: 1 }]
      });

      // Definir columnas
      wsEspecialidades.columns = [
        { header: '#', key: 'num', width: 6 },
        { header: 'Código', key: 'codigo', width: 14 },
        { header: 'Nombre Completo', key: 'nombre', width: 35 },
        { header: 'Rama', key: 'rama', width: 12 },
        { header: 'Patrulla', key: 'patrulla', width: 15 },
        { header: 'Asignadas', key: 'asignadas', width: 12 },
        { header: 'Completadas', key: 'completadas', width: 14 },
        { header: 'En Progreso', key: 'enProgreso', width: 14 },
        { header: '% Completado', key: 'porcentaje', width: 14 },
      ];

      // Estilo del header
      wsEspecialidades.getRow(1).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4F46E5' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Agregar datos
      reporte.forEach((r, index) => {
        const porcentaje = r.total_especialidades > 0
          ? Math.round((r.completadas / r.total_especialidades) * 100)
          : 0;
        
        wsEspecialidades.addRow({
          num: index + 1,
          codigo: r.codigo_scout || '-',
          nombre: r.nombre,
          rama: r.rama || '-',
          patrulla: r.patrulla || '-',
          asignadas: r.total_especialidades,
          completadas: r.completadas,
          enProgreso: r.en_progreso,
          porcentaje: `${porcentaje}%`
        });
      });

      // Fila de totales
      const totalRow = wsEspecialidades.addRow({
        num: '',
        codigo: '',
        nombre: 'TOTALES',
        rama: '',
        patrulla: '',
        asignadas: totales.asignaciones,
        completadas: totales.completadas,
        enProgreso: totales.enProgreso,
        porcentaje: totales.asignaciones > 0
          ? `${Math.round((totales.completadas / totales.asignaciones) * 100)}%`
          : '0%'
      });
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' }
      };

      // ========== HOJA 2: Resumen ==========
      const wsResumen = workbook.addWorksheet('Resumen');
      
      wsResumen.columns = [
        { header: 'Métrica', key: 'metrica', width: 35 },
        { header: 'Valor', key: 'valor', width: 20 },
      ];

      // Estilo del header
      wsResumen.getRow(1).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF059669' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      });

      // Agregar datos de resumen
      wsResumen.addRow({ metrica: 'Total de Scouts', valor: totales.scouts });
      wsResumen.addRow({ metrica: 'Total de Asignaciones', valor: totales.asignaciones });
      wsResumen.addRow({ metrica: 'Especialidades Completadas', valor: totales.completadas });
      wsResumen.addRow({ metrica: 'Especialidades En Progreso', valor: totales.enProgreso });
      wsResumen.addRow({ 
        metrica: 'Promedio por Scout', 
        valor: totales.scouts > 0 
          ? (totales.asignaciones / totales.scouts).toFixed(1) 
          : '0' 
      });
      wsResumen.addRow({ 
        metrica: '% Completado General', 
        valor: totales.asignaciones > 0
          ? `${Math.round((totales.completadas / totales.asignaciones) * 100)}%`
          : '0%'
      });

      // Generar buffer y descargar
      const buffer = await workbook.xlsx.writeBuffer();
      const fecha = new Date().toISOString().split('T')[0];
      const rama = filterRama ? `_${filterRama}` : '';
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, `reporte_especialidades${rama}_${fecha}.xlsx`);
      
      toast.success('Reporte exportado exitosamente');
    } catch (error) {
      console.error('Error exportando:', error);
      toast.error('Error al exportar reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtro de rama */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtrar por Rama
        </label>
        <select
          value={filterRama}
          onChange={(e) => setFilterRama(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        >
          <option value="">Todas las ramas</option>
          <option value="MANADA">Manada</option>
          <option value="TROPA">Tropa</option>
          <option value="COMUNIDAD">Comunidad</option>
          <option value="CLAN">Clan</option>
        </select>
      </div>

      {/* KPIs */}
      {!loadingData && reporte.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-700">{totales.scouts}</p>
            <p className="text-xs text-blue-600">Scouts</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <Award className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-purple-700">{totales.asignaciones}</p>
            <p className="text-xs text-purple-600">Asignaciones</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-700">{totales.completadas}</p>
            <p className="text-xs text-green-600">Completadas</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-700">{totales.enProgreso}</p>
            <p className="text-xs text-amber-600">En Progreso</p>
          </div>
        </div>
      )}

      {/* Vista previa */}
      {loadingData ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Cargando datos...</p>
        </div>
      ) : reporte.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No hay datos de especialidades</p>
          <p className="text-gray-400 text-sm">Intenta con otra rama o verifica las asignaciones</p>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Vista previa:</strong> {reporte.length} scouts con especialidades
          </p>
          <div className="max-h-48 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-2 py-1 text-left">Scout</th>
                  <th className="px-2 py-1 text-center">Asignadas</th>
                  <th className="px-2 py-1 text-center">Completadas</th>
                  <th className="px-2 py-1 text-center">En Progreso</th>
                </tr>
              </thead>
              <tbody>
                {reporte.slice(0, 10).map((r, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="px-2 py-1">{r.nombre}</td>
                    <td className="px-2 py-1 text-center">{r.total_especialidades}</td>
                    <td className="px-2 py-1 text-center text-green-600">{r.completadas}</td>
                    <td className="px-2 py-1 text-center text-amber-600">{r.en_progreso}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reporte.length > 10 && (
              <p className="text-xs text-gray-400 text-center mt-2">
                ...y {reporte.length - 10} scouts más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Botón de exportar */}
      <button
        onClick={exportarExcel}
        disabled={loading || loadingData || reporte.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-5 h-5" />
            Exportar a Excel
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        El archivo incluirá todos los scouts con sus especialidades asignadas, completadas y en progreso.
      </p>
    </div>
  );
};

export default EspecialidadesExcelReport;
