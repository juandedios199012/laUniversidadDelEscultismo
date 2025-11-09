// ================================================================
// 🖥️ React Component: Anexo-3 Document Generator
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

interface Anexo3GeneratorProps {
  scoutId?: string;
  userRole: string;
  userName: string;
  onDocumentGenerated?: (response: DocumentGenerationResponse) => void;
  onError?: (error: string) => void;
}

interface GenerationState {
  isLoading: boolean;
  availableTemplates: DocumentTemplate[];
  selectedTemplate: string;
  outputFormat: 'docx' | 'pdf';
  includeSignatures: boolean;
  error: string | null;
  success: string | null;
}

export const Anexo3DocumentGenerator: React.FC<Anexo3GeneratorProps> = ({
  scoutId = '',
  userRole,
  userName,
  onDocumentGenerated,
  onError
}) => {
  const [state, setState] = useState<GenerationState>({
    isLoading: false,
    availableTemplates: [],
    selectedTemplate: 'anexo-3-datos-personales',
    outputFormat: 'docx',
    includeSignatures: true,
    error: null,
    success: null
  });

  const [formData, setFormData] = useState({
    scoutId: scoutId,
    customFields: {}
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

  const generateDocument = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, success: null }));

      // Validar datos requeridos
      if (!formData.scoutId.trim()) {
        setState(prev => ({
          ...prev,
          error: 'Debe especificar el ID del scout',
          isLoading: false
        }));
        return;
      }

      // Preparar solicitud
      const request: DocumentGenerationRequest = {
        templateId: state.selectedTemplate,
        scoutId: formData.scoutId,
        outputFormat: state.outputFormat,
        includeSignatures: state.includeSignatures,
        customFields: formData.customFields,
        generatedBy: userName,
        userRole: userRole
      };

      // Validar solicitud
      const validationResult = await documentFactory.validateDocumentRequest(request);
      if (validationResult.isFailure) {
        setState(prev => ({
          ...prev,
          error: `Solicitud inválida: ${validationResult.getError()}`,
          isLoading: false
        }));
        return;
      }

      // Generar documento
      const result = await documentFactory.generatePersonalDataDocument(request);

      if (result.isSuccess) {
        const response = result.getValue();
        
        // Descargar archivo automáticamente
        downloadDocument(response);

        setState(prev => ({
          ...prev,
          success: `Documento generado exitosamente: ${response.filename}`,
          isLoading: false
        }));

        // Callback al componente padre
        if (onDocumentGenerated) {
          onDocumentGenerated(response);
        }

      } else {
        const errorMessage = result.getError();
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false
        }));

        if (onError) {
          onError(errorMessage);
        }
      }

    } catch (error) {
      const errorMessage = `Error inesperado: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));

      if (onError) {
        onError(errorMessage);
      }
    }
  };

  // ================================================================
  // 💾 Función de descarga
  // ================================================================

  const downloadDocument = (response: DocumentGenerationResponse): void => {
    try {
      // Convertir Buffer a Uint8Array para el navegador
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
    <div className="anexo3-generator bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="header mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          📄 Generador de Anexo-3
        </h2>
        <p className="text-gray-600">
          Formato de Datos Personales - Sistema Scout
        </p>
      </div>

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
      <form onSubmit={(e) => { e.preventDefault(); generateDocument(); }} className="space-y-4">
        {/* Scout ID */}
        <div className="form-group">
          <label htmlFor="scoutId" className="block text-sm font-medium text-gray-700 mb-1">
            ID del Scout *
          </label>
          <input
            type="text"
            id="scoutId"
            value={formData.scoutId}
            onChange={(e) => setFormData(prev => ({ ...prev, scoutId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingrese el ID del scout"
            required
          />
        </div>

        {/* Template Selection */}
        <div className="form-group">
          <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
            Template
          </label>
          <select
            id="template"
            value={state.selectedTemplate}
            onChange={(e) => setState(prev => ({ ...prev, selectedTemplate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {state.availableTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} (v{template.version})
              </option>
            ))}
          </select>
        </div>

        {/* Output Format */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Formato de Salida
          </label>
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

        {/* Include Signatures */}
        <div className="form-group">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={state.includeSignatures}
              onChange={(e) => setState(prev => ({ ...prev, includeSignatures: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Incluir espacios para firmas</span>
          </label>
        </div>

        {/* Actions */}
        <div className="form-actions flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => setState(prev => ({ ...prev, error: null, success: null }))}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={state.isLoading || !formData.scoutId.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {state.isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generando...
              </>
            ) : (
              <>
                <span className="mr-2">📄</span>
                Generar Documento
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Section */}
      <div className="info-section mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-2">ℹ️ Información</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• El documento se descargará automáticamente una vez generado</li>
          <li>• Formato Anexo-3 según estándares del Grupo Scout Lima 12</li>
          <li>• Incluye datos personales, información scout y contactos de emergencia</li>
          <li>• Usuario: {userName} ({userRole})</li>
        </ul>
      </div>
    </div>
  );
};

export default Anexo3DocumentGenerator;