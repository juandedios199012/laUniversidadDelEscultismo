// ================================================================
// 🖥️ Generador de Documentos DNGI-03 con Múltiples Formatos
// ================================================================

import React, { useState, useEffect } from 'react';
import ScoutService from '../../services/scoutService';
import { Scout } from '../../lib/supabase';
import { 
  DocumentGenerationStrategyFactory,
  DocumentFormat
} from '../../utils/DocumentGenerationStrategy';
import { HTMLTemplateGenerator } from '../../utils/HTMLTemplateGenerator';
import { DNGI03TemplateConfig } from '../../config/TemplateConfig';

interface DNGI03GeneratorProps {
  userRole: string;
  userName: string;
}

const DNGI03Generator: React.FC<DNGI03GeneratorProps> = ({ userRole, userName }) => {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [selectedScout, setSelectedScout] = useState<Scout | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'dni' | 'nombre'>('dni');
  const [documentFormat, setDocumentFormat] = useState<DocumentFormat>('html');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const config = new DNGI03TemplateConfig();

  // Cargar scouts al iniciar
  useEffect(() => {
    loadScouts();
  }, []);

  const loadScouts = async () => {
    try {
      setIsLoading(true);
      const scoutsData = await ScoutService.getAllScouts();
      setScouts(scoutsData);
    } catch (error) {
      console.error('Error cargando scouts:', error);
      setMessage('Error al cargar la lista de scouts');
    } finally {
      setIsLoading(false);
    }
  };

  const searchScouts = async () => {
    if (!searchTerm.trim()) {
      setMessage('Por favor ingrese un término de búsqueda');
      return;
    }

    try {
      setIsLoading(true);
      let results: Scout[] = [];

      if (searchType === 'dni') {
        // Buscar por número de documento
        results = scouts.filter(scout => 
          scout.numero_documento && scout.numero_documento.includes(searchTerm.trim())
        );
      } else {
        // Buscar por nombre
        const searchLower = searchTerm.toLowerCase().trim();
        results = scouts.filter(scout => 
          scout.nombres?.toLowerCase().includes(searchLower) ||
          scout.apellidos?.toLowerCase().includes(searchLower) ||
          `${scout.nombres} ${scout.apellidos}`.toLowerCase().includes(searchLower)
        );
      }

      if (results.length === 0) {
        setMessage(`No se encontraron scouts con ${searchType}: "${searchTerm}"`);
        setSelectedScout(null);
      } else if (results.length === 1) {
        setSelectedScout(results[0]);
        setMessage(`Scout encontrado: ${results[0].nombres} ${results[0].apellidos}`);
      } else {
        setMessage(`Se encontraron ${results.length} scouts. Seleccione uno:`);
        setSelectedScout(null);
      }

    } catch (error) {
      console.error('Error en búsqueda:', error);
      setMessage('Error al buscar scouts');
      setSelectedScout(null);
    } finally {
      setIsLoading(false);
    }
  };

  const previewDocument = () => {
    if (!selectedScout) {
      setMessage('Debe seleccionar un scout primero');
      return;
    }

    try {
      const scoutData = HTMLTemplateGenerator.convertScoutToHTMLData(selectedScout);
      const htmlContent = HTMLTemplateGenerator.generateHTML(scoutData);
      
      // Abrir en nueva ventana
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      }
      
      setMessage('✅ Vista previa abierta en nueva ventana');
    } catch (error) {
      console.error('Error generando vista previa:', error);
      setMessage('❌ Error al generar la vista previa');
    }
  };

    const generateDocument = async () => {
    if (!selectedScout) {
      setMessage('Por favor seleccione un scout primero');
      return;
    }

    try {
      setIsGenerating(true);
      setMessage('Generando documento...');

      // Crear estrategia según el formato seleccionado
      const strategy = DocumentGenerationStrategyFactory.createStrategy(documentFormat, config);
      
      // Crear generador con la estrategia
      const generator = new (await import('../../utils/DocumentGenerationStrategy')).DocumentGenerator(strategy, config);
      
      // Generar documento
      const result = await generator.generateDocument(selectedScout);
      
      // Crear blob y descargar
      const arrayBuffer = new ArrayBuffer(result.data.length);
      const view = new Uint8Array(arrayBuffer);
      view.set(result.data);
      const blob = new Blob([arrayBuffer], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage(`✅ Documento ${result.format} generado exitosamente: ${result.filename}`);
    } catch (error) {
      console.error('Error generando documento:', error);
      setMessage(`❌ Error al generar documento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredScouts = scouts.filter(scout => {
    if (!searchTerm.trim()) return false;
    
    const searchLower = searchTerm.toLowerCase().trim();
    if (searchType === 'dni') {
      return scout.numero_documento && scout.numero_documento.includes(searchTerm.trim());
    } else {
      return scout.nombres?.toLowerCase().includes(searchLower) ||
             scout.apellidos?.toLowerCase().includes(searchLower) ||
             `${scout.nombres} ${scout.apellidos}`.toLowerCase().includes(searchLower);
    }
  });

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-800 mb-2">
            📋 Generador DNGI-03
          </h2>
          <p className="text-gray-600">
            Formato de Registro Institucional para Miembros Juveniles
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Usuario: {userName}</p>
          <p className="text-sm text-gray-500">Rol: {userRole}</p>
        </div>
      </div>

      {/* Sección de Búsqueda */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">🔍 Buscar Scout</h3>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Tipo de búsqueda:</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'dni' | 'nombre')}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="dni">Buscar por DNI</option>
              <option value="nombre">Buscar por Nombre</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Formato de documento:</label>
            <select
              value={documentFormat}
              onChange={(e) => setDocumentFormat(e.target.value as DocumentFormat)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="html">HTML (.html) - Diseño Perfecto</option>
              <option value="word">Word (.docx) - Calibri 10pt</option>
              <option value="pdf">PDF (.pdf) - Archivo Portable</option>
            </select>
          </div>
        </div>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              {searchType === 'dni' ? 'DNI:' : 'Nombre:'}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchType === 'dni' ? 'Ingrese DNI...' : 'Ingrese nombre...'}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && searchScouts()}
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={searchScouts}
              disabled={isLoading || !searchTerm.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '🔄' : '🔍'} Buscar
            </button>
          </div>
        </div>

        {/* Resultados de búsqueda */}
        {searchTerm.trim() && filteredScouts.length > 1 && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Seleccionar Scout:</label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
              {filteredScouts.map(scout => (
                <div
                  key={scout.id}
                  onClick={() => setSelectedScout(scout)}
                  className={`p-3 cursor-pointer hover:bg-blue-50 border-b ${
                    selectedScout?.id === scout.id ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="font-medium">{scout.nombres} {scout.apellidos}</div>
                  <div className="text-sm text-gray-600">Documento: {scout.numero_documento}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scout Seleccionado */}
      {selectedScout && (
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3 text-green-800">✅ Scout Seleccionado</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Nombres:</strong> {selectedScout.nombres}</p>
              <p><strong>Apellidos:</strong> {selectedScout.apellidos}</p>
            </div>
            <div>
              <p><strong>Documento:</strong> {selectedScout.numero_documento}</p>
              <p><strong>Fecha Nacimiento:</strong> {selectedScout.fecha_nacimiento}</p>
            </div>
          </div>
        </div>
      )}

      {/* Botones de Generación */}
      <div className="text-center mb-6 space-y-3">
        {/* Vista previa (solo para HTML) */}
        {documentFormat === 'html' && selectedScout && (
          <div>
            <button
              onClick={previewDocument}
              disabled={!selectedScout}
              className="px-6 py-2 bg-blue-600 text-white text-md font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mr-4"
            >
              👁️ Vista Previa HTML
            </button>
          </div>
        )}
        
        {/* Generación del documento */}
        <div>
          <button
            onClick={generateDocument}
            disabled={!selectedScout || isGenerating}
            className="px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generando Documento...
              </>
            ) : (
              <>
                📄 Generar DNGI-03 ({documentFormat.toUpperCase()})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {message && (
        <div className={`p-4 rounded-md text-center ${
          message.includes('✅') ? 'bg-green-100 text-green-800' :
          message.includes('❌') ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {message}
        </div>
      )}

      {/* Información del documento */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">ℹ️ Sobre el Documento DNGI-03</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h5 className="font-semibold text-gray-800 mb-1">📄 Formato Word (.docx)</h5>
            <ul className="space-y-1">
              <li>• Generado programáticamente con librería docx</li>
              <li>• Compatible con Microsoft Word y LibreOffice</li>
              <li>• Tablas con sombreado gris en encabezados</li>
              <li>• Estructura oficial del DNGI-03</li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-gray-800 mb-1">🎨 Formato HTML (.html)</h5>
            <ul className="space-y-1">
              <li>• Diseño perfecto con CSS personalizado</li>
              <li>• Control total de la distribución de columnas</li>
              <li>• Optimizado para impresión</li>
              <li>• Abre en cualquier navegador web</li>
            </ul>
          </div>
        </div>
        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
          <p className="text-sm text-blue-700">
            <strong>💡 Recomendación:</strong> Usa formato HTML para mejor precisión visual, 
            o Word si necesitas editar el documento posteriormente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DNGI03Generator;