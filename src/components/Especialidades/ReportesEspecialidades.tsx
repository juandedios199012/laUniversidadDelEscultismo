// ============================================================================
// REPORTES DE ESPECIALIDADES
// ============================================================================
// Sistema de Gestión Scout - Grupo Scout Lima 12
// ============================================================================

import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import EspecialidadesService from '../../services/especialidadesService';
import type { ReporteScoutEspecialidades } from '../../types/especialidades';

// TODO: Agregar jspdf y xlsx si se necesitan exports
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import * as XLSX from 'xlsx';

interface ReportesEspecialidadesProps {
  onBack?: () => void;
}

const RAMAS = [
  { id: '', nombre: 'Todas las Ramas' },
  { id: 'MANADA', nombre: 'Manada' },
  { id: 'TROPA', nombre: 'Tropa' },
  { id: 'COMUNIDAD', nombre: 'Comunidad' },
  { id: 'CLAN', nombre: 'Clan' }
];

export default function ReportesEspecialidades({ onBack }: ReportesEspecialidadesProps) {
  const [reporte, setReporte] = useState<ReporteScoutEspecialidades[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRama, setFilterRama] = useState('');

  useEffect(() => {
    cargarReporte();
  }, [filterRama]);

  const cargarReporte = async () => {
    try {
      setLoading(true);
      const data = await EspecialidadesService.obtenerReporteEspecialidadesRama(
        filterRama || null
      );
      setReporte(data);
    } catch (error) {
      console.error('Error cargando reporte:', error);
      toast.error('Error al cargar reporte');
    } finally {
      setLoading(false);
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

  const exportarPDF = () => {
    toast.info('Exportación PDF en desarrollo');
    // TODO: Implementar exportación PDF
  };

  const exportarExcel = () => {
    toast.info('Exportación Excel en desarrollo');
    // TODO: Implementar exportación Excel
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              📊 Reportes de Especialidades
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Estadísticas y resumen del progreso en especialidades
            </p>
          </div>
        </div>

        {/* Botones de exportación */}
        <div className="flex gap-2">
          <button
            onClick={exportarPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={exportarExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Filtro por rama */}
      <div className="flex flex-wrap gap-2">
        {RAMAS.map((rama) => (
          <button
            key={rama.id}
            onClick={() => setFilterRama(rama.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterRama === rama.id
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {rama.nombre}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{totales.scouts}</div>
          <div className="text-sm text-gray-500">Scouts</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">{totales.asignaciones}</div>
          <div className="text-sm text-gray-500">Asignaciones</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{totales.completadas}</div>
          <div className="text-sm text-gray-500">Completadas</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-amber-600">{totales.enProgreso}</div>
          <div className="text-sm text-gray-500">En Progreso</div>
        </div>
      </div>

      {/* Tabla de reporte */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      ) : reporte.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No hay datos para mostrar
          </h3>
          <p className="text-gray-500">
            No se encontraron scouts con especialidades asignadas
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-4 font-semibold text-gray-700">Scout</th>
                  <th className="text-left p-4 font-semibold text-gray-700 hidden sm:table-cell">Rama</th>
                  <th className="text-left p-4 font-semibold text-gray-700 hidden md:table-cell">Patrulla</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Total</th>
                  <th className="text-center p-4 font-semibold text-gray-700">✓</th>
                  <th className="text-center p-4 font-semibold text-gray-700">⏳</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Progreso</th>
                </tr>
              </thead>
              <tbody>
                {reporte.map((r) => {
                  const porcentaje = r.total_especialidades > 0 
                    ? Math.round((r.completadas / r.total_especialidades) * 100)
                    : 0;
                  
                  return (
                    <tr key={r.scout_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-800">{r.nombre}</p>
                          <p className="text-xs text-gray-500">{r.codigo_scout}</p>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRamaBadgeColor(r.rama)}`}>
                          {r.rama}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 hidden md:table-cell">
                        {r.patrulla || '-'}
                      </td>
                      <td className="p-4 text-center font-medium">{r.total_especialidades}</td>
                      <td className="p-4 text-center text-green-600 font-semibold">{r.completadas}</td>
                      <td className="p-4 text-center text-amber-600">{r.en_progreso}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                            <div 
                              className={`h-2 rounded-full ${porcentaje === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-10">{porcentaje}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resumen por Rama */}
      {!loading && reporte.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Resumen por Rama</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['MANADA', 'TROPA', 'COMUNIDAD', 'CLAN'].map((rama) => {
              const scoutsRama = reporte.filter(r => r.rama === rama);
              const totalRama = scoutsRama.reduce((sum, r) => sum + r.total_especialidades, 0);
              const completadasRama = scoutsRama.reduce((sum, r) => sum + r.completadas, 0);
              
              return (
                <div key={rama} className="bg-gray-50 rounded-lg p-4 text-center">
                  <h4 className="font-medium text-gray-700 mb-2">{rama}</h4>
                  <div className="text-2xl font-bold text-gray-800">{scoutsRama.length}</div>
                  <p className="text-xs text-gray-500">scouts</p>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="text-sm text-green-600 font-medium">{completadasRama}</span>
                    <span className="text-sm text-gray-400"> / {totalRama}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getRamaBadgeColor(rama: string): string {
  const colors: Record<string, string> = {
    'MANADA': 'bg-yellow-100 text-yellow-700',
    'TROPA': 'bg-green-100 text-green-700',
    'COMUNIDAD': 'bg-blue-100 text-blue-700',
    'CLAN': 'bg-red-100 text-red-700'
  };
  return colors[rama] || 'bg-gray-100 text-gray-700';
}
