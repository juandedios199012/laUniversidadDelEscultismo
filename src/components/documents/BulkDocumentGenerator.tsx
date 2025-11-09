// ================================================================
// 🚀 Component: Generador de Documentos Masivos
// ================================================================

import React, { useState, useEffect } from 'react';
import { Download, FileText, Users, CheckSquare, Square, Loader2, Lightbulb } from 'lucide-react';
import { Scout } from '../../lib/supabase';
import ScoutService from '../../services/scoutService';
import BulkDocumentUtils from '../../utils/BulkDocumentUtils';
import FileDownloadUtils, { DownloadableDocument } from '../../utils/FileDownloadUtils';

interface BulkDocumentGeneratorProps {
  userRole: string;
  userName: string;
}

interface GenerationProgress {
  total: number;
  completed: number;
  current: string;
  isGenerating: boolean;
}

export const BulkDocumentGenerator: React.FC<BulkDocumentGeneratorProps> = ({
  userRole,
  userName
}) => {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [selectedScouts, setSelectedScouts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<GenerationProgress>({
    total: 0,
    completed: 0,
    current: '',
    isGenerating: false
  });

  useEffect(() => {
    loadScouts();
  }, []);

  const loadScouts = async () => {
    try {
      setLoading(true);
      const scoutsData = await ScoutService.getAllScouts();
      setScouts(scoutsData || []);
    } catch (error) {
      console.error('Error loading scouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleScoutSelection = (scoutId: string) => {
    const newSelection = new Set(selectedScouts);
    if (newSelection.has(scoutId)) {
      newSelection.delete(scoutId);
    } else {
      newSelection.add(scoutId);
    }
    setSelectedScouts(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedScouts.size === scouts.length) {
      setSelectedScouts(new Set());
    } else {
      setSelectedScouts(new Set(scouts.map(s => s.id)));
    }
  };

  const generateSingleDocument = async (scout: Scout): Promise<Blob> => {
    // Generar documento Word real
            const scoutName = `${scout.nombres} ${scout.apellidos}`;
    return await FileDownloadUtils.createRealWordDocument(scoutName);
  };

  const generateBulkDocuments = async () => {
    if (selectedScouts.size === 0) return;

    setProgress({
      total: selectedScouts.size,
      completed: 0,
      current: '',
      isGenerating: true
    });

    try {
      const selectedScoutsData = scouts.filter(s => selectedScouts.has(s.id));
      
      // Generar documentos y recopilar para ZIP
      const documents: DownloadableDocument[] = [];
      
      // Usar el sistema optimizado de generación masiva
      const generatedBlobs = await BulkDocumentUtils.processBulkDocuments(
        selectedScoutsData,
        async (scout) => {
          // Lógica de generación del documento DNGI-03
          return await generateSingleDocument(scout);
        },
        {
          progressCallback: (completed, currentName) => {
            setProgress(prev => ({
              ...prev,
              completed,
              current: currentName
            }));
          }
        }
      );

      // Preparar documentos para el ZIP
      selectedScoutsData.forEach((scout, index) => {
        const filename = FileDownloadUtils.generateScoutFilename(
          `${scout.nombres} ${scout.apellidos}`,
          'DNGI-03'
        );
        
        documents.push({
          filename,
          content: generatedBlobs[index],
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
      });

      // Descargar ZIP con todos los documentos
      const zipFilename = `DNGI-03_Lote_${new Date().toISOString().slice(0, 10)}.zip`;
      
      await FileDownloadUtils.downloadMultipleFilesAsZip(
        documents,
        zipFilename,
        (_, current) => {
          setProgress(prev => ({
            ...prev,
            current: `Empaquetando: ${current}`
          }));
        }
      );

      const totalDocuments = selectedScouts.size;
      
      alert(`✅ ${totalDocuments} documentos DNGI-03 generados y descargados exitosamente
      📦 Archivo: ${zipFilename}`);
      
      console.log(`🚀 Generación masiva completada: ${totalDocuments} documentos`);
      
    } catch (error) {
      console.error('Error generating bulk documents:', error);
      alert('❌ Error al generar los documentos');
    } finally {
      setProgress(prev => ({ ...prev, isGenerating: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">Cargando scouts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-blue-500" />
            Generación Masiva DNGI-03
          </h2>
          <p className="text-gray-600 mt-1">
            Genera documentos DNGI-03 para todos los scouts registrados simultáneamente
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500">
            {selectedScouts.size} de {scouts.length} seleccionados
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {selectedScouts.size > 0 && (
              `⏱️ ${BulkDocumentUtils.formatEstimatedTime(
                BulkDocumentUtils.estimateGenerationTime(selectedScouts.size)
              )}`
            )}
          </div>
          <button
            onClick={generateBulkDocuments}
            disabled={selectedScouts.size === 0 || progress.isGenerating}
            className="mt-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Generar {selectedScouts.size > 0 ? selectedScouts.size : ''} Documentos
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {progress.isGenerating && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Generando documentos...</span>
            <span className="text-sm text-gray-500">
              {progress.completed} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
          {progress.current && (
            <div className="text-sm text-gray-600 mt-2">
              Procesando: {progress.current}
            </div>
          )}
        </div>
      )}

      {/* Estadísticas y Optimizations */}
      {selectedScouts.size > 20 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <Lightbulb className="w-4 h-4 mr-2" />
            Información del Procesamiento Masivo
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="font-bold text-blue-600">
                {BulkDocumentUtils.formatEstimatedTime(
                  BulkDocumentUtils.estimateGenerationTime(selectedScouts.size)
                )}
              </div>
              <div className="text-gray-600">Tiempo estimado</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="font-bold text-green-600">
                {Math.ceil(selectedScouts.size / BulkDocumentUtils.getOptimalBatchSize(selectedScouts.size))} lotes
              </div>
              <div className="text-gray-600">Procesamiento</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="font-bold text-purple-600">
                {(selectedScouts.size * 2.5).toFixed(1)} MB
              </div>
              <div className="text-gray-600">Tamaño aprox. ZIP</div>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-blue-700">
            💡 El sistema procesará automáticamente en lotes optimizados para máximo rendimiento
          </div>
        </div>
      )}

      {/* Selection Controls */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleSelectAll}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            {selectedScouts.size === scouts.length ? (
              <CheckSquare className="w-4 h-4 mr-2" />
            ) : (
              <Square className="w-4 h-4 mr-2" />
            )}
            {selectedScouts.size === scouts.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </button>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {scouts.length} scouts disponibles
            </div>
            {scouts.length > 100 && (
              <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                ⚡ Sistema optimizado para {scouts.length} scouts
              </div>
            )}
            {scouts.length > 500 && (
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                🏗️ Modo empresarial activado
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scouts List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="max-h-96 overflow-y-auto">
          {scouts.map((scout) => (
            <div
              key={scout.id}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                selectedScouts.has(scout.id) ? 'bg-blue-50' : ''
              }`}
              onClick={() => toggleScoutSelection(scout.id)}
            >
              <div className="flex items-center">
                <div className="mr-3">
                  {selectedScouts.has(scout.id) ? (
                    <CheckSquare className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {scout.nombres} {scout.apellidos}
                  </div>
                  <div className="text-sm text-gray-500">
                    {scout.numero_documento} • {(scout as any).unidad || 'Sin unidad asignada'}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {scout.fecha_nacimiento ? 
                      new Date().getFullYear() - new Date(scout.fecha_nacimiento).getFullYear() 
                      : '?'} años
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BulkDocumentGenerator;