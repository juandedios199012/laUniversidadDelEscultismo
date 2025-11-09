// ================================================================
// 🖥️ React Component: DNGI-03 Document Generator
// ================================================================

import React, { useState, useEffect } from 'react';
import { DocumentTemplate } from '../../domain/entities/DocumentTemplate';
import { 
  DocumentGenerationRequest, 
  DocumentGenerationResponse,
  Anexo3DocumentFactory 
} from '../../infrastructure/factories/Anexo3DocumentFactory';
import { TemplateRepository } from '../../infrastructure/repositories/TemplateRepository';
import { DocxDocumentEngine } from '../../infrastructure/document-engines/DocxDocumentEngine';
import FileDownloadUtils from '../../utils/FileDownloadUtils';
import ScoutService from '../../services/scoutService';

interface DNGI03GeneratorProps {
  scoutId?: string;
  userRole: string;
  userName: string;
  onDocumentGenerated?: (response: DocumentGenerationResponse) => void;
  onError?: (error: string) => void;
}

interface DNGI03FormData {
  scoutIdentifier: string; // DNI o nombre del scout
  searchType: 'dni' | 'nombre';
  includeFamilyData: boolean;
  includeMedicalInfo: boolean;
  includeSignatures: boolean;
  familyMembers: {
    padre: boolean;
    madre: boolean;
    apoderado: boolean;
  };
}

interface GenerationState {
  isLoading: boolean;
  availableTemplates: DocumentTemplate[];
  selectedTemplate: string;
  outputFormat: 'docx' | 'pdf';
  error: string | null;
  success: string | null;
  progress: number;
}

export const DNGI03DocumentGenerator: React.FC<DNGI03GeneratorProps> = ({
  scoutId = '',
  userRole,
  userName,
  onDocumentGenerated,
  onError
}) => {
  const [state, setState] = useState<GenerationState>({
    isLoading: false,
    availableTemplates: [],
    selectedTemplate: 'dngi-03-registro-institucional',
    outputFormat: 'docx',
    error: null,
    success: null,
    progress: 0
  });

  const [formData, setFormData] = useState<DNGI03FormData>({
    scoutIdentifier: scoutId || '',
    searchType: 'dni',
    includeFamilyData: true,
    includeMedicalInfo: true,
    includeSignatures: true,
    familyMembers: {
      padre: true,
      madre: true,
      apoderado: true
    }
  });

  // Inicializar servicios
  const templateRepository = new TemplateRepository();
  const documentEngine = new DocxDocumentEngine();
  const documentFactory = new Anexo3DocumentFactory(templateRepository, documentEngine);

  // ================================================================
  // 🚀 Effects
  // ================================================================

  useEffect(() => {
    loadAvailableTemplates();
  }, [userRole]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, scoutId }));
  }, [scoutId]);

  // ================================================================
  // 📊 Funciones de carga de datos
  // ================================================================

  const loadAvailableTemplates = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await documentFactory.getAvailableTemplates(userRole);
      
      if (result.isSuccess) {
        const templates = result.getValue();
        setState(prev => ({
          ...prev,
          availableTemplates: templates,
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: `Error cargando templates: ${result.getError()}`,
          isLoading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Error inesperado: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false
      }));
    }
  };

  // ================================================================
  // 📄 Función principal de generación
  // ================================================================

  const generateDocument = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, progress: 10 }));

      // Validar entrada
      if (!formData.scoutIdentifier.trim()) {
        setState(prev => ({ 
          ...prev, 
          error: 'Por favor ingresa el DNI o nombre del scout',
          isLoading: false 
        }));
        return;
      }

      setState(prev => ({ ...prev, progress: 30 }));

      // Buscar scout por DNI o nombre
      let scout;
      try {
        const allScouts = await ScoutService.getAllScouts();
        
        if (formData.searchType === 'dni') {
          scout = allScouts?.find(s => s.numero_documento === formData.scoutIdentifier);
        } else {
          scout = allScouts?.find(s => 
            `${s.nombres} ${s.apellidos}`.toLowerCase().includes(formData.scoutIdentifier.toLowerCase())
          );
        }
      } catch (searchError) {
        setState(prev => ({ 
          ...prev, 
          error: `Error al buscar scout: ${searchError instanceof Error ? searchError.message : 'Error desconocido'}`,
          isLoading: false 
        }));
        return;
      }

      if (!scout) {
        setState(prev => ({ 
          ...prev, 
          error: `No se encontró ningún scout con ${formData.searchType === 'dni' ? 'DNI' : 'nombre'}: "${formData.scoutIdentifier}"`,
          isLoading: false 
        }));
        return;
      }

      setState(prev => ({ ...prev, progress: 60 }));

      // Generar documento real
      const scoutName = `${scout.nombres} ${scout.apellidos}`;
      const documentBlob = await FileDownloadUtils.createRealWordDocument(scoutName);

      setState(prev => ({ ...prev, progress: 90 }));

      // Descargar archivo
      const filename = FileDownloadUtils.generateScoutFilename(scoutName, 'DNGI-03');
      FileDownloadUtils.downloadSingleFile(filename, documentBlob);

      setState(prev => ({ 
        ...prev, 
        progress: 100,
        isLoading: false,
        success: `Documento DNGI-03 generado y descargado exitosamente: ${filename}`,
        error: null
      }));

      if (onDocumentGenerated) {
        onDocumentGenerated({
          success: true,
          filename,
          document: documentBlob,
          metadata: {
            scoutName,
            generatedAt: new Date(),
            templateUsed: 'DNGI-03'
          }
        });
      }

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: `Error al generar documento: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        isLoading: false,
        progress: 0
      }));

      if (onError) {
        onError(error instanceof Error ? error.message : 'Error desconocido');
      }
    }
  };

  // ================================================================
  // 💾 Función de descarga
  // ================================================================

  const downloadDocument = (response: DocumentGenerationResponse): void => {
    try {
      const uint8Array = new Uint8Array(response.documentBuffer);
      const blob = new Blob([uint8Array], { type: response.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = response.filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando documento:', error);
      setState(prev => ({
        ...prev,
        error: 'Error descargando el documento generado'
      }));
    }
  };

  // ================================================================
  // 🎨 Render
  // ================================================================

  return (
    <div className="dngi03-generator bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="header mb-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mr-4">
            <span className="text-white text-2xl font-bold">📋</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Generador de Documento DNGI-03
            </h2>
            <p className="text-gray-600">
              Formato de Registro Institucional para Miembros Juveniles
            </p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            📄 <strong>Documento Oficial:</strong> Scouts del Perú - Versión 2.1
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {state.progress > 0 && (
        <div className="progress-container mb-6">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${state.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1 text-center">
            Generando documento... {state.progress}%
          </p>
        </div>
      )}

      {/* Alertas */}
      {state.error && (
        <div className="alert alert-error bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            <span>{state.error}</span>
          </div>
        </div>
      )}

      {state.success && (
        <div className="alert alert-success bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <span className="mr-2">✅</span>
            <span>{state.success}</span>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={(e) => { e.preventDefault(); generateDocument(); }} className="space-y-6">
        
        {/* Información del Scout */}
        <div className="form-section bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            👤 Información del Scout
          </h3>
          <div className="form-group">
            <label htmlFor="searchType" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar por *
            </label>
            <select
              id="searchType"
              value={formData.searchType}
              onChange={(e) => setFormData(prev => ({ ...prev, searchType: e.target.value as 'dni' | 'nombre' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dni">DNI</option>
              <option value="nombre">Nombre Completo</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="scoutIdentifier" className="block text-sm font-medium text-gray-700 mb-1">
              {formData.searchType === 'dni' ? 'DNI del Scout' : 'Nombre Completo del Scout'} *
            </label>
            <input
              type="text"
              id="scoutIdentifier"
              value={formData.scoutIdentifier}
              onChange={(e) => setFormData(prev => ({ ...prev, scoutIdentifier: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={formData.searchType === 'dni' ? 'Ej: 12345678' : 'Ej: Juan Pérez García'}
              required
            />
          </div>
        </div>

        {/* Configuración del Documento */}
        <div className="form-section bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            ⚙️ Configuración del Documento
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Secciones a incluir */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-600">Secciones a incluir:</h4>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includeFamilyData}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeFamilyData: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">👨‍👩‍👧‍👦 Datos de Familia</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includeMedicalInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeMedicalInfo: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">🏥 Información Médica</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includeSignatures}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeSignatures: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">✍️ Espacios para Firmas y Huellas</span>
              </label>
            </div>

            {/* Miembros de familia */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-600">Familiares a incluir:</h4>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.familyMembers.padre}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    familyMembers: { ...prev.familyMembers, padre: e.target.checked }
                  }))}
                  className="mr-2"
                  disabled={!formData.includeFamilyData}
                />
                <span className="text-sm text-gray-700">👨 Padre</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.familyMembers.madre}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    familyMembers: { ...prev.familyMembers, madre: e.target.checked }
                  }))}
                  className="mr-2"
                  disabled={!formData.includeFamilyData}
                />
                <span className="text-sm text-gray-700">👩 Madre</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.familyMembers.apoderado}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    familyMembers: { ...prev.familyMembers, apoderado: e.target.checked }
                  }))}
                  className="mr-2"
                  disabled={!formData.includeFamilyData}
                />
                <span className="text-sm text-gray-700">👤 Apoderado/Tutor</span>
              </label>
            </div>
          </div>
        </div>

        {/* Formato de Salida */}
        <div className="form-section bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            📄 Formato de Salida
          </h3>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="outputFormat"
                value="docx"
                checked={state.outputFormat === 'docx'}
                onChange={(e) => setState(prev => ({ ...prev, outputFormat: e.target.value as 'docx' | 'pdf' }))}
                className="mr-2"
              />
              <span>📄 Word (.docx)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="outputFormat"
                value="pdf"
                checked={state.outputFormat === 'pdf'}
                onChange={(e) => setState(prev => ({ ...prev, outputFormat: e.target.value as 'docx' | 'pdf' }))}
                className="mr-2"
              />
              <span>📋 PDF</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => setState(prev => ({ ...prev, error: null, success: null }))}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Limpiar Mensajes
          </button>
          <button
            type="submit"
            disabled={state.isLoading || !formData.scoutIdentifier.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {state.isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generando Formulario...
              </>
            ) : (
              <>
                <span className="mr-2">📋</span>
                Generar Documento DNGI-03
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Section */}
      <div className="info-section mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-700 mb-2">📋 Sobre el Documento DNGI-03</h3>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• <strong>Documento oficial</strong> de Scouts del Perú para registro institucional</li>
          <li>• <strong>4 páginas</strong> incluyendo datos del scout, familia, información médica</li>
          <li>• <strong>Firmas y huellas digitales</strong> requeridas para validación</li>
          <li>• <strong>Cumple estándares</strong> institucionales de la Asociación de Scouts del Perú</li>
          <li>• <strong>Usuario actual:</strong> {userName} ({userRole})</li>
        </ul>
      </div>
    </div>
  );
};

export default DNGI03DocumentGenerator;