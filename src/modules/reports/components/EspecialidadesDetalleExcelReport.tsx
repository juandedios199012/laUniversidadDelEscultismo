/**
 * Componente para exportar reporte DETALLADO de Especialidades Scout
 * Genera un Excel con el listado de CADA especialidad asignada a cada scout,
 * incluyendo estado de fases, fechas de inicio/fin y asesor.
 */

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Award, Users, CheckCircle, Clock, List } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface DetalleEspecialidad {
  scout_id: string;
  codigo_scout: string;
  nombre_scout: string;
  rama: string;
  patrulla: string | null;
  especialidad_id: string;
  especialidad_codigo: string;
  especialidad_nombre: string;
  area_nombre: string;
  area_codigo: string;
  fase_exploracion: string;
  fase_taller: string;
  fase_desafio: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  asesor_nombre: string | null;
  notas: string | null;
  esta_completada: boolean;
}

interface ResumenScout {
  scout_id: string;
  codigo_scout: string;
  nombre: string;
  rama: string;
  patrulla: string | null;
  total_especialidades: number;
  completadas: number;
  en_progreso: number;
}

interface EspecialidadesDetalleExcelReportProps {
  filterRama?: string;
}

export const EspecialidadesDetalleExcelReport: React.FC<EspecialidadesDetalleExcelReportProps> = ({ 
  filterRama: initialRama = '' 
}) => {
  const [loading, setLoading] = useState(false);
  const [detalle, setDetalle] = useState<DetalleEspecialidad[]>([]);
  const [resumen, setResumen] = useState<ResumenScout[]>([]);
  const [filterRama, setFilterRama] = useState(initialRama);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    cargarReporte();
  }, [filterRama]);

  const cargarReporte = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase.rpc('api_reporte_especialidades_detalle', {
        p_rama: filterRama || null
      });

      if (error) {
        console.error('Error en RPC:', error);
        toast.error(`Error al cargar datos: ${error.message}`);
        return;
      }
      
      if (data?.success) {
        setDetalle(data.detalle || []);
        setResumen(data.resumen || []);
      }
    } catch (error) {
      console.error('Error cargando reporte:', error);
      toast.error('Error al cargar datos del reporte');
    } finally {
      setLoadingData(false);
    }
  };

  // Función para traducir estado de fase
  const traducirEstado = (estado: string): string => {
    const traducciones: Record<string, string> = {
      'pendiente': 'Pendiente',
      'en_progreso': 'En Progreso',
      'completada': 'Completada'
    };
    return traducciones[estado] || estado;
  };

  // Calcular totales del detalle
  const totalesDetalle = {
    asignaciones: detalle.length,
    completadas: detalle.filter(d => d.esta_completada).length,
    enProgreso: detalle.filter(d => !d.esta_completada).length,
    scoutsUnicos: new Set(detalle.map(d => d.scout_id)).size,
    especialidadesUnicas: new Set(detalle.map(d => d.especialidad_id)).size,
  };

  const exportarExcel = async () => {
    if (detalle.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    setLoading(true);
    try {
      // Crear workbook con ExcelJS
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema Scout Lima 12';
      workbook.created = new Date();

      // ========== HOJA 1: DETALLE COMPLETO ==========
      const wsDetalle = workbook.addWorksheet('Detalle Especialidades', {
        views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }]
      });

      // Definir columnas
      wsDetalle.columns = [
        { header: '#', key: 'num', width: 6 },
        { header: 'Código Scout', key: 'codigo_scout', width: 14 },
        { header: 'Nombre Scout', key: 'nombre_scout', width: 30 },
        { header: 'Rama', key: 'rama', width: 12 },
        { header: 'Patrulla', key: 'patrulla', width: 15 },
        { header: 'Especialidad', key: 'especialidad', width: 25 },
        { header: 'Área', key: 'area', width: 20 },
        { header: 'Exploración', key: 'exploracion', width: 14 },
        { header: 'Taller', key: 'taller', width: 14 },
        { header: 'Desafío', key: 'desafio', width: 14 },
        { header: 'Completada', key: 'completada', width: 12 },
        { header: 'Fecha Inicio', key: 'fecha_inicio', width: 14 },
        { header: 'Fecha Fin', key: 'fecha_fin', width: 14 },
        { header: 'Asesor', key: 'asesor', width: 25 },
        { header: 'Notas', key: 'notas', width: 30 },
      ];

      // Estilo del header
      wsDetalle.getRow(1).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4F46E5' } // Indigo
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });

      // Agregar datos de detalle
      detalle.forEach((d, index) => {
        const row = wsDetalle.addRow({
          num: index + 1,
          codigo_scout: d.codigo_scout || '-',
          nombre_scout: d.nombre_scout,
          rama: d.rama || '-',
          patrulla: d.patrulla || '-',
          especialidad: d.especialidad_nombre,
          area: d.area_nombre,
          exploracion: traducirEstado(d.fase_exploracion),
          taller: traducirEstado(d.fase_taller),
          desafio: traducirEstado(d.fase_desafio),
          completada: d.esta_completada ? '✓ Sí' : '✗ No',
          fecha_inicio: d.fecha_inicio || '-',
          fecha_fin: d.fecha_fin || '-',
          asesor: d.asesor_nombre || '-',
          notas: d.notas || '',
        });

        // Color condicional para estado completada
        const completadaCell = row.getCell('completada');
        if (d.esta_completada) {
          completadaCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' } // Verde claro
          };
          completadaCell.font = { color: { argb: 'FF065F46' }, bold: true };
        } else {
          completadaCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF3C7' } // Amarillo claro
          };
          completadaCell.font = { color: { argb: 'FF92400E' } };
        }

        // Color para estados de fases
        ['exploracion', 'taller', 'desafio'].forEach(fase => {
          const cell = row.getCell(fase);
          const estado = d[`fase_${fase}` as keyof DetalleEspecialidad] as string;
          if (estado === 'completada') {
            cell.font = { color: { argb: 'FF065F46' } };
          } else if (estado === 'en_progreso') {
            cell.font = { color: { argb: 'FFD97706' } };
          } else {
            cell.font = { color: { argb: 'FF6B7280' } };
          }
        });
      });

      // ========== HOJA 2: RESUMEN POR SCOUT ==========
      const wsResumen = workbook.addWorksheet('Resumen por Scout', {
        views: [{ state: 'frozen', ySplit: 1 }]
      });

      // Definir columnas
      wsResumen.columns = [
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
      wsResumen.getRow(1).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF059669' } // Verde
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Agregar datos
      resumen.forEach((r, index) => {
        const porcentaje = r.total_especialidades > 0
          ? Math.round((r.completadas / r.total_especialidades) * 100)
          : 0;
        
        wsResumen.addRow({
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
      const totalAsignadas = resumen.reduce((sum, r) => sum + r.total_especialidades, 0);
      const totalCompletadas = resumen.reduce((sum, r) => sum + r.completadas, 0);
      const totalEnProgreso = resumen.reduce((sum, r) => sum + r.en_progreso, 0);
      
      const totalRow = wsResumen.addRow({
        num: '',
        codigo: '',
        nombre: 'TOTALES',
        rama: '',
        patrulla: '',
        asignadas: totalAsignadas,
        completadas: totalCompletadas,
        enProgreso: totalEnProgreso,
        porcentaje: totalAsignadas > 0
          ? `${Math.round((totalCompletadas / totalAsignadas) * 100)}%`
          : '0%'
      });
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' }
      };

      // ========== HOJA 3: MATRIZ SCOUT × ESPECIALIDAD ==========
      const wsMatriz = workbook.addWorksheet('Matriz Scout-Especialidad', {
        views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }]
      });

      // Obtener lista única de especialidades y scouts
      const especialidadesUnicas = [...new Set(detalle.map(d => d.especialidad_nombre))].sort();
      const scoutsUnicos = [...new Map(detalle.map(d => [d.scout_id, { 
        id: d.scout_id, 
        codigo: d.codigo_scout, 
        nombre: d.nombre_scout,
        rama: d.rama 
      }])).values()].sort((a, b) => a.nombre.localeCompare(b.nombre));

      // Crear mapa de estado por scout-especialidad
      const estadoMap = new Map<string, string>();
      detalle.forEach(d => {
        const key = `${d.scout_id}-${d.especialidad_nombre}`;
        if (d.esta_completada) {
          estadoMap.set(key, '✓');
        } else {
          // Mostrar progreso como número de fases completadas
          const fasesCompletadas = [d.fase_exploracion, d.fase_taller, d.fase_desafio]
            .filter(f => f === 'completada').length;
          estadoMap.set(key, `${fasesCompletadas}/3`);
        }
      });

      // Configurar columnas
      wsMatriz.columns = [
        { header: '#', key: 'num', width: 5 },
        { header: 'Scout', key: 'scout', width: 30 },
        ...especialidadesUnicas.map(e => ({ header: e, key: e, width: 8 }))
      ];

      // Estilo header (vertical para nombres de especialidades)
      const headerRow = wsMatriz.getRow(1);
      headerRow.height = 120;
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colNumber <= 2 ? 'FF4F46E5' : 'FF7C3AED' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        cell.alignment = { 
          horizontal: 'center', 
          vertical: 'middle',
          textRotation: colNumber > 2 ? 90 : 0,
          wrapText: true
        };
      });

      // Agregar filas por scout
      scoutsUnicos.forEach((scout, index) => {
        const rowData: Record<string, string | number> = {
          num: index + 1,
          scout: `${scout.codigo || ''} - ${scout.nombre}`,
        };
        
        especialidadesUnicas.forEach(esp => {
          const key = `${scout.id}-${esp}`;
          rowData[esp] = estadoMap.get(key) || '';
        });

        const row = wsMatriz.addRow(rowData);
        
        // Color condicional para cada celda
        row.eachCell((cell, colNumber) => {
          if (colNumber > 2) {
            const valor = cell.value as string;
            if (valor === '✓') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD1FAE5' }
              };
              cell.font = { color: { argb: 'FF065F46' }, bold: true };
            } else if (valor && valor !== '') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFEF3C7' }
              };
              cell.font = { color: { argb: 'FF92400E' } };
            }
            cell.alignment = { horizontal: 'center' };
          }
        });
      });

      // ========== HOJA 4: ESTADÍSTICAS ==========
      const wsStats = workbook.addWorksheet('Estadísticas');
      
      wsStats.columns = [
        { header: 'Métrica', key: 'metrica', width: 40 },
        { header: 'Valor', key: 'valor', width: 20 },
      ];

      // Estilo del header
      wsStats.getRow(1).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF7C3AED' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      });

      // Agregar estadísticas
      wsStats.addRow({ metrica: 'Total de Scouts con Especialidades', valor: totalesDetalle.scoutsUnicos });
      wsStats.addRow({ metrica: 'Total de Asignaciones', valor: totalesDetalle.asignaciones });
      wsStats.addRow({ metrica: 'Especialidades Completadas', valor: totalesDetalle.completadas });
      wsStats.addRow({ metrica: 'Especialidades En Progreso', valor: totalesDetalle.enProgreso });
      wsStats.addRow({ metrica: 'Especialidades Distintas Asignadas', valor: totalesDetalle.especialidadesUnicas });
      wsStats.addRow({ 
        metrica: 'Promedio Especialidades por Scout', 
        valor: totalesDetalle.scoutsUnicos > 0 
          ? (totalesDetalle.asignaciones / totalesDetalle.scoutsUnicos).toFixed(1) 
          : '0' 
      });
      wsStats.addRow({ 
        metrica: '% Completado General', 
        valor: totalesDetalle.asignaciones > 0
          ? `${Math.round((totalesDetalle.completadas / totalesDetalle.asignaciones) * 100)}%`
          : '0%'
      });

      // Agregar leyenda
      wsStats.addRow({ metrica: '', valor: '' });
      wsStats.addRow({ metrica: '📋 LEYENDA', valor: '' });
      wsStats.addRow({ metrica: '✓ = Especialidad completada (3 fases)', valor: '' });
      wsStats.addRow({ metrica: 'X/3 = Fases completadas de 3 totales', valor: '' });

      // Generar buffer y descargar
      const buffer = await workbook.xlsx.writeBuffer();
      const fecha = new Date().toISOString().split('T')[0];
      const rama = filterRama ? `_${filterRama}` : '';
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, `reporte_especialidades_DETALLE${rama}_${fecha}.xlsx`);
      
      toast.success('Reporte detallado exportado exitosamente');
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
          Filtrar por Rama (opcional)
        </label>
        <select
          value={filterRama}
          onChange={(e) => setFilterRama(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Todas las ramas</option>
          <option value="Manada">Manada</option>
          <option value="Tropa">Tropa</option>
          <option value="Comunidad">Comunidad</option>
          <option value="Clan">Clan</option>
        </select>
      </div>

      {/* KPIs */}
      {!loadingData && detalle.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-indigo-50 rounded-lg p-3 text-center">
            <Users className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-indigo-700">{totalesDetalle.scoutsUnicos}</p>
            <p className="text-xs text-indigo-600">Scouts</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <List className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-purple-700">{totalesDetalle.asignaciones}</p>
            <p className="text-xs text-purple-600">Asignaciones</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-700">{totalesDetalle.completadas}</p>
            <p className="text-xs text-green-600">Completadas</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-700">{totalesDetalle.enProgreso}</p>
            <p className="text-xs text-amber-600">En Progreso</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <Award className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-700">{totalesDetalle.especialidadesUnicas}</p>
            <p className="text-xs text-blue-600">Especialidades</p>
          </div>
        </div>
      )}

      {/* Vista previa */}
      {loadingData ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Cargando datos...</p>
        </div>
      ) : detalle.length === 0 ? (
        <div className="text-center py-6 bg-indigo-50 rounded-lg border border-indigo-200">
          <Award className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
          <p className="text-indigo-700 font-medium">No hay asignaciones de especialidades</p>
          <p className="text-indigo-600 text-sm mt-1">
            Primero debes asignar especialidades a los scouts desde el módulo de Especialidades
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Vista previa:</strong> {detalle.length} asignaciones de {totalesDetalle.scoutsUnicos} scouts
          </p>
          <div className="max-h-48 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-2 py-1 text-left">Scout</th>
                  <th className="px-2 py-1 text-left">Especialidad</th>
                  <th className="px-2 py-1 text-center">Expl.</th>
                  <th className="px-2 py-1 text-center">Taller</th>
                  <th className="px-2 py-1 text-center">Desafío</th>
                </tr>
              </thead>
              <tbody>
                {detalle.slice(0, 10).map((d, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="px-2 py-1">{d.nombre_scout}</td>
                    <td className="px-2 py-1">{d.especialidad_nombre}</td>
                    <td className="px-2 py-1 text-center">
                      <span className={`text-xs ${d.fase_exploracion === 'completada' ? 'text-green-600' : d.fase_exploracion === 'en_progreso' ? 'text-amber-600' : 'text-gray-400'}`}>
                        {d.fase_exploracion === 'completada' ? '✓' : d.fase_exploracion === 'en_progreso' ? '◐' : '○'}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-center">
                      <span className={`text-xs ${d.fase_taller === 'completada' ? 'text-green-600' : d.fase_taller === 'en_progreso' ? 'text-amber-600' : 'text-gray-400'}`}>
                        {d.fase_taller === 'completada' ? '✓' : d.fase_taller === 'en_progreso' ? '◐' : '○'}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-center">
                      <span className={`text-xs ${d.fase_desafio === 'completada' ? 'text-green-600' : d.fase_desafio === 'en_progreso' ? 'text-amber-600' : 'text-gray-400'}`}>
                        {d.fase_desafio === 'completada' ? '✓' : d.fase_desafio === 'en_progreso' ? '◐' : '○'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {detalle.length > 10 && (
              <p className="text-xs text-gray-400 text-center mt-2">
                ...y {detalle.length - 10} asignaciones más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Descripción de contenido del Excel */}
      {detalle.length > 0 && (
        <div className="bg-indigo-50 rounded-lg p-3 text-xs text-indigo-700">
          <p className="font-medium mb-1">📊 El Excel incluirá 4 hojas:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li><strong>Detalle Especialidades:</strong> Cada asignación con fases, fechas y asesor</li>
            <li><strong>Resumen por Scout:</strong> Totales por scout (como el reporte actual)</li>
            <li><strong>Matriz Scout-Especialidad:</strong> Vista cruzada para ver qué tiene cada scout</li>
            <li><strong>Estadísticas:</strong> KPIs generales del reporte</li>
          </ul>
        </div>
      )}

      {/* Botón de exportar */}
      <button
        onClick={exportarExcel}
        disabled={loading || loadingData || detalle.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Detalle a Excel
          </>
        )}
      </button>

      {detalle.length > 0 && (
        <p className="text-xs text-gray-500">
          El archivo incluirá {detalle.length} asignaciones de {totalesDetalle.scoutsUnicos} scouts.
        </p>
      )}
    </div>
  );
};

export default EspecialidadesDetalleExcelReport;
