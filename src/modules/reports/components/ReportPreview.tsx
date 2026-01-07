/**
 * Componente de previsualización de reportes PDF
 * Muestra el PDF en tiempo real mientras diseñas
 */

import React, { useState, useEffect } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { Eye, X, Search } from 'lucide-react';
import ScoutReportTemplate from '../templates/pdf/ScoutReportTemplate';
import AttendanceReportTemplate from '../templates/pdf/AttendanceReportTemplate';
import ProgressReportTemplate from '../templates/pdf/ProgressReportTemplate';
import DNGI03Template from '../templates/pdf/DNGI03Template';
import ScoutService from '../../../services/scoutService';
import { 
  getScoutData, 
  getAttendanceData, 
  getProgressData
} from '../services/reportDataService';
import { generateReportMetadata } from '../services/pdfService';
import { ReportType } from '../types/reportTypes';
import type { Scout } from '../../../lib/supabase';

interface ReportPreviewProps {
  className?: string;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ReportType>(ReportType.SCOUT_PROFILE);
  const [scoutId, setScoutId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingScouts, setLoadingScouts] = useState(false);

  // Cargar scouts al montar el componente
  useEffect(() => {
    loadScouts();
  }, []);

  // Buscar scouts cuando cambia la búsqueda
  useEffect(() => {
    if (searchQuery.trim()) {
      searchScouts();
    } else {
      loadScouts();
    }
  }, [searchQuery]);

  const loadScouts = async () => {
    try {
      setLoadingScouts(true);
      const data = await ScoutService.getAllScouts();
      setScouts(data || []);
    } catch (error) {
      console.error('Error cargando scouts:', error);
    } finally {
      setLoadingScouts(false);
    }
  };

  const searchScouts = async () => {
    try {
      setLoadingScouts(true);
      const data = await ScoutService.searchScouts(searchQuery);
      setScouts(data || []);
    } catch (error) {
      console.error('Error buscando scouts:', error);
    } finally {
      setLoadingScouts(false);
    }
  };

  const handleLoadPreview = async () => {
    setIsLoading(true);
    try {
      const metadata = generateReportMetadata();

      switch (selectedType) {
        case ReportType.SCOUT_PROFILE:
          if (scoutId) {
            const scoutData = await getScoutData(scoutId);
            setPreviewData({ scout: scoutData, metadata });
          }
          break;

        case ReportType.DNGI03:
          if (scoutId) {
            const scoutData = await getScoutData(scoutId);
            setPreviewData({ 
              scout: scoutData, 
              metadata,
              additionalData: {
                tipoRegistro: 'Renovación',
                fechaRegistro: new Date().toLocaleDateString('es-PE')
              }
            });
          }
          break;

        case ReportType.ATTENDANCE:
          const attendanceData = await getAttendanceData({
            dateFrom: '2024-01-01',
            dateTo: '2024-12-31',
          });
          setPreviewData({
            data: attendanceData,
            metadata,
            dateRange: { from: '2024-01-01', to: '2024-12-31' },
          });
          break;

        case ReportType.PROGRESS:
          const progressData = await getProgressData({});
          setPreviewData({ data: progressData, metadata });
          break;
      }

      setIsOpen(true);
    } catch (error) {
      console.error('Error loading preview:', error);
      alert('Error cargando vista previa');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPDFContent = () => {
    if (!previewData) {
      // Retornar un documento vacío en lugar de null
      const metadata = generateReportMetadata();
      return (
        <ScoutReportTemplate
          scout={{
            id: '',
            nombre: 'Cargando',
            apellido: '...',
            fechaNacimiento: '',
            edad: 0,
            rama: '',
            numeroRegistro: '',
            fechaIngreso: '',
          }}
          metadata={metadata}
        />
      );
    }

    switch (selectedType) {
      case ReportType.SCOUT_PROFILE:
        return (
          <ScoutReportTemplate
            scout={previewData.scout}
            metadata={previewData.metadata}
          />
        );

      case ReportType.ATTENDANCE:
        return (
          <AttendanceReportTemplate
            data={previewData.data}
            metadata={previewData.metadata}
            dateRange={previewData.dateRange}
          />
        );

      case ReportType.PROGRESS:
        return (
          <ProgressReportTemplate
            data={previewData.data}
            metadata={previewData.metadata}
          />
        );

      case ReportType.DNGI03:
        return (
          <DNGI03Template
            scout={previewData.scout}
            metadata={previewData.metadata}
            additionalData={previewData.additionalData}
          />
        );

      default:
        return (
          <ScoutReportTemplate
            scout={{
              id: '',
              nombre: 'Error',
              apellido: 'Tipo no soportado',
              fechaNacimiento: '',
              edad: 0,
              rama: '',
              numeroRegistro: '',
              fechaIngreso: '',
            }}
            metadata={previewData.metadata}
          />
        );
    }
  };

  return (
    <div className={className}>
      {/* Botón para abrir preview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Eye className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">
            Vista Previa de Reportes
          </h3>
        </div>

        <div className="space-y-4">
          {/* Selector de tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Reporte
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ReportType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={ReportType.SCOUT_PROFILE}>Perfil de Scout</option>
              <option value={ReportType.ATTENDANCE}>Asistencia</option>
              <option value={ReportType.PROGRESS}>Progreso</option>
              <option value={ReportType.DNGI03}>📄 DNGI-03 - Registro Institucional</option>
            </select>
          </div>

          {/* Campo para Scout ID si es necesario */}
          {(selectedType === ReportType.SCOUT_PROFILE || selectedType === ReportType.DNGI03) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Scout por Nombre
              </label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Busca por nombre o apellido..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona un Scout
              </label>
              <select
                value={scoutId}
                onChange={(e) => setScoutId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={loadingScouts}
              >
                <option value="">
                  {loadingScouts ? 'Cargando scouts...' : 'Selecciona un scout'}
                </option>
                {scouts.map((scout) => (
                  <option key={scout.id} value={scout.id}>
                    {scout.nombres} {scout.apellidos} - {scout.codigo_scout || scout.numero_documento}
                  </option>
                ))}
              </select>
              
              {scouts.length === 0 && !loadingScouts && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ No hay scouts registrados. Ve al módulo de Registro Scout para agregar scouts.
                </p>
              )}
            </div>
          )}

          {/* Botón de preview */}
          <button
            onClick={handleLoadPreview}
            disabled={isLoading || (selectedType === ReportType.SCOUT_PROFILE && !scoutId)}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium
              ${
                isLoading || (selectedType === ReportType.SCOUT_PROFILE && !scoutId)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            <Eye className="w-4 h-4" />
            {isLoading ? 'Cargando...' : 'Ver Vista Previa'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Usa esta vista previa mientras diseñas tus plantillas.
            Los cambios en el código se reflejan automáticamente al recargar.
          </p>
        </div>
      </div>

      {/* Modal de preview en pantalla completa */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Vista Previa del PDF
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Visor de PDF */}
            <div className="flex-1 overflow-hidden">
              <PDFViewer
                width="100%"
                height="100%"
                showToolbar={true}
                className="border-0"
              >
                {renderPDFContent()}
              </PDFViewer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPreview;
