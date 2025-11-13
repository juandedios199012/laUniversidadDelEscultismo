// ================================================================
// 🚀 Component: Generador de Documentos Masivos
// ================================================================

import React, { useState, useEffect } from 'react';
import { Download, FileText, Users, CheckSquare, Square, Loader2, Lightbulb } from 'lucide-react';
import { Scout } from '../../lib/supabase';
import ScoutService from '../../services/scoutService';
import BulkDocumentUtils from '../../utils/BulkDocumentUtils';
import FileDownloadUtils, { DownloadableDocument } from '../../utils/FileDownloadUtils';
import { BulkDynamicDocumentGenerator } from '../../utils/DynamicDocumentAdapter';
import { DocumentFormat } from '../../utils/DocumentGenerationStrategy';
import { TableDesign } from './TableDesigner';
import { tableDesignService, TableDesign as DBTableDesign } from '../../services/tableDesignService';

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

export const BulkDocumentGenerator: React.FC<BulkDocumentGeneratorProps> = () => {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [selectedScouts, setSelectedScouts] = useState<Set<string>>(new Set());
  const [availableDesigns, setAvailableDesigns] = useState<DBTableDesign[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<DBTableDesign | null>(null);
  const [documentFormat, setDocumentFormat] = useState<DocumentFormat>('html');
  const [loading, setLoading] = useState(true);
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  const [progress, setProgress] = useState<GenerationProgress>({
    total: 0,
    completed: 0,
    current: '',
    isGenerating: false
  });

  useEffect(() => {
    loadScouts();
    loadDesigns();
  }, []);

  // Cargar diseños disponibles
  const loadDesigns = async () => {
    try {
      setLoadingDesigns(true);
      const designs = await tableDesignService.getAllDesigns();
      
      // Eliminar duplicados por nombre Y categoría (más estricto)
      const uniqueDesigns = designs.filter((design, index, self) => {
        const isDuplicate = self.findIndex(d => 
          d.name === design.name && 
          d.category === design.category
        ) !== index;
        
        if (isDuplicate) {
          console.log('🗑️ Removiendo duplicado:', design.name);
        }
        return !isDuplicate;
      });
      
      console.log('📚 Total diseños obtenidos:', designs.length);
      console.log('📚 Diseños únicos después de filtro:', uniqueDesigns.length);
      console.log('📋 Diseños únicos:', uniqueDesigns.map(d => `${d.name} (${d.category})`));
      
      setAvailableDesigns(uniqueDesigns);
      
      // Seleccionar diseño por defecto si existe
      const defaultDesign = uniqueDesigns.find(d => d.is_default && d.category === 'dngi03');
      if (defaultDesign) {
        setSelectedDesign(defaultDesign);
        console.log('✅ Diseño por defecto seleccionado:', defaultDesign.name);
      } else if (uniqueDesigns.length > 0) {
        setSelectedDesign(uniqueDesigns[0]);
        console.log('✅ Primer diseño seleccionado:', uniqueDesigns[0].name);
      }
    } catch (error) {
      console.error('Error cargando diseños:', error);
    } finally {
      setLoadingDesigns(false);
    }
  };

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

  const generateBulkDocuments = async () => {
    if (selectedScouts.size === 0 || !selectedDesign) {
      alert('Por favor selecciona scouts y un diseño de plantilla');
      return;
    }

    setProgress({
      total: selectedScouts.size,
      completed: 0,
      current: '',
      isGenerating: true
    });

    try {
      const selectedScoutsData = scouts.filter(s => selectedScouts.has(s.id));
      
      // Convertir el diseño de la DB al formato del componente
      const designForGeneration: TableDesign = {
        id: selectedDesign.design_data.id || selectedDesign.id,
        name: selectedDesign.name,
        description: selectedDesign.description,
        rows: selectedDesign.design_data.rows || [],
        totalColumns: selectedDesign.design_data.totalColumns || 4,
        defaultCellWidth: selectedDesign.design_data.defaultCellWidth || 120,
        defaultRowHeight: selectedDesign.design_data.defaultRowHeight || 30,
        borderWidth: selectedDesign.design_data.borderWidth || 0.5,
        borderColor: selectedDesign.design_data.borderColor || '#000000',
        borderStyle: selectedDesign.design_data.borderStyle || 'solid',
        cellPadding: selectedDesign.design_data.cellPadding || { top: 3, right: 3, bottom: 3, left: 3 },
        cellMargin: selectedDesign.design_data.cellMargin || { top: 0, right: 0, bottom: 0, left: 0 },
        font: selectedDesign.design_data.font || {
          family: 'Arial',
          size: 12,
          weight: 'normal',
          style: 'normal'
        },
        tableLayout: selectedDesign.design_data.tableLayout || 'auto',
        tableMargin: selectedDesign.design_data.tableMargin || { top: 10, right: 10, bottom: 10, left: 10 },
        defaultBackgroundColor: selectedDesign.design_data.defaultBackgroundColor || '#ffffff',
        defaultTextColor: selectedDesign.design_data.defaultTextColor || '#000000',
        alternateRowColor: selectedDesign.design_data.alternateRowColor,
        headerBackgroundColor: selectedDesign.design_data.headerBackgroundColor || '#4a5568',
        headerTextColor: selectedDesign.design_data.headerTextColor || '#ffffff',
        created_at: selectedDesign.created_at,
        updated_at: selectedDesign.updated_at
      };

      // Usar el generador dinámico con diseño personalizado
      console.log('🎯 Generando documentos con formato:', documentFormat);
      console.log('🎨 Usando plantilla:', selectedDesign.name);
      console.log('👥 Scouts seleccionados:', selectedScoutsData.length);
      
      const bulkGenerator = new BulkDynamicDocumentGenerator();
      const { documents, errors } = await bulkGenerator.generateBulkDocuments(
        designForGeneration,
        selectedScoutsData,
        documentFormat,
        (completed, currentName) => {
          setProgress(prev => ({
            ...prev,
            completed,
            current: currentName
          }));
        }
      );

      console.log('📄 Documentos generados:', documents.length);
      console.log('❌ Errores encontrados:', errors.length);
      
      // Verificar tipos de documentos generados
      documents.forEach((doc, index) => {
        console.log(`📝 Documento ${index + 1}:`, {
          filename: doc.filename,
          mimeType: doc.mimeType,
          size: doc.document.byteLength
        });
      });

      // Preparar documentos para el ZIP
      const downloadableDocuments: DownloadableDocument[] = documents.map(doc => {
        // Crear un ArrayBuffer correcto desde el Uint8Array
        const arrayBuffer = new ArrayBuffer(doc.document.byteLength);
        const uint8View = new Uint8Array(arrayBuffer);
        uint8View.set(doc.document);
        
        return {
          filename: doc.filename,
          content: new Blob([arrayBuffer], { type: doc.mimeType }),
          mimeType: doc.mimeType
        };
      });

      // Descargar ZIP con todos los documentos
      const zipFilename = `DNGI-03_${selectedDesign.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.zip`;
      
      await FileDownloadUtils.downloadMultipleFilesAsZip(
        downloadableDocuments,
        zipFilename,
        (_, current) => {
          setProgress(prev => ({
            ...prev,
            current: `Empaquetando: ${current}`
          }));
        }
      );

      alert(`✅ ${documents.length} documentos DNGI-03 generados y descargados exitosamente
      📦 Archivo: ${zipFilename}
      🎨 Plantilla: ${selectedDesign.name}`);

      if (errors.length > 0) {
        console.warn('Errores en algunos documentos:', errors);
        alert(`Generación completada con ${errors.length} errores. Ver consola para detalles.`);
      }

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
            disabled={selectedScouts.size === 0 || progress.isGenerating || !selectedDesign}
            className="mt-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Generar {selectedScouts.size > 0 ? selectedScouts.size : ''} Documentos
          </button>
        </div>
      </div>

      {/* Template and Format Selection */}
      <div className="bg-white p-4 rounded-lg shadow border space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          🎨 Configuración de Plantilla y Formato
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Selector de Plantilla */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plantilla de Diseño
            </label>
            {loadingDesigns ? (
              <div className="flex items-center p-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Cargando plantillas...
              </div>
            ) : (
              <select
                value={selectedDesign?.id || ''}
                onChange={(e) => {
                  const design = availableDesigns.find(d => d.id === e.target.value);
                  setSelectedDesign(design || null);
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar plantilla...</option>
                {availableDesigns.map(design => (
                  <option key={design.id} value={design.id}>
                    {design.name} {design.is_default ? '(Por defecto)' : ''}
                  </option>
                ))}
              </select>
            )}
            {selectedDesign && (
              <p className="text-xs text-gray-500 mt-1">
                📝 {selectedDesign.description}
              </p>
            )}
          </div>

          {/* Selector de Formato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato de Documento
            </label>
            <select
              value={documentFormat}
              onChange={(e) => setDocumentFormat(e.target.value as DocumentFormat)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="html">📄 HTML (Recomendado)</option>
              <option value="word">📝 Word (.docx)</option>
              <option value="pdf">📋 PDF</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {documentFormat === 'html' && '🌐 Perfecto para impresión y visualización'}
              {documentFormat === 'word' && '✏️ Editable con Microsoft Word'}
              {documentFormat === 'pdf' && '🔒 Formato fijo, listo para imprimir'}
            </p>
          </div>
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