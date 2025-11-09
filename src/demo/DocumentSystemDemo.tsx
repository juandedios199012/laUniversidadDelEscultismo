// ================================================================
// 🧪 Demo: Sistema de Generación de Documentos Anexo-3
// ================================================================

import React from 'react';
import Anexo3DocumentGenerator from '../components/documents/Anexo3DocumentGenerator';
import { DocumentGenerationResponse } from '../infrastructure/factories/Anexo3DocumentFactory';

interface DocumentSystemDemoProps {
  // Props del usuario actual
  currentUser?: {
    id: string;
    name: string;
    role: 'dirigente' | 'admin' | 'secretario' | 'padre';
  };
}

export const DocumentSystemDemo: React.FC<DocumentSystemDemoProps> = ({
  currentUser = {
    id: 'user-001',
    name: 'Director Scout',
    role: 'dirigente'
  }
}) => {
  
  // ================================================================
  // 📊 Handlers
  // ================================================================

  const handleDocumentGenerated = (response: DocumentGenerationResponse): void => {
    console.log('✅ Documento generado exitosamente:', {
      filename: response.filename,
      size: `${(response.documentBuffer.length / 1024).toFixed(2)} KB`,
      generatedAt: response.generatedAt,
      template: response.templateUsed
    });

    // Aquí podrías agregar lógica adicional como:
    // - Guardar referencia en base de datos
    // - Enviar notificación al scout/familia
    // - Crear log de auditoría
    // - Actualizar estado del scout
  };

  const handleError = (error: string): void => {
    console.error('❌ Error generando documento:', error);
    
    // Aquí podrías agregar:
    // - Logging a sistema de monitoreo
    // - Notificación al administrador
    // - Fallback a template alternativo
  };

  // ================================================================
  // 🎨 Render
  // ================================================================

  return (
    <div className="document-system-demo min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="header text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📋 Sistema de Gestión Documental
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Grupo Scout Lima 12 - La Universidad del Escultismo
          </p>
          <div className="user-info bg-blue-50 border border-blue-200 rounded-lg p-3 inline-block">
            <span className="text-blue-800 font-medium">
              👤 {currentUser.name} ({currentUser.role})
            </span>
          </div>
        </div>

        {/* Architecture Overview */}
        <div className="architecture-overview bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🏗️ Arquitectura del Sistema
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            
            <div className="layer">
              <h3 className="text-lg font-semibold text-blue-600 mb-2">
                🎯 Domain Layer
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• DocumentTemplate</li>
                <li>• DocumentData</li>
                <li>• ScoutData</li>
                <li>• Result Pattern</li>
              </ul>
            </div>

            <div className="layer">
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                📋 Application Layer
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• GenerateDocumentUseCase</li>
                <li>• DocumentDataMapper</li>
                <li>• Validation Logic</li>
                <li>• Permission Checks</li>
              </ul>
            </div>

            <div className="layer">
              <h3 className="text-lg font-semibold text-purple-600 mb-2">
                🔧 Infrastructure Layer
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• DocxDocumentEngine</li>
                <li>• TemplateRepository</li>
                <li>• Anexo3DocumentFactory</li>
                <li>• React Components</li>
              </ul>
            </div>

          </div>
        </div>

        {/* Features */}
        <div className="features bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            ✨ Características Implementadas
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            
            <div className="feature-group">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                🏛️ Clean Architecture
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ Domain-Driven Design</li>
                <li>✅ SOLID Principles</li>
                <li>✅ Dependency Injection</li>
                <li>✅ Separation of Concerns</li>
                <li>✅ Repository Pattern</li>
                <li>✅ Factory Pattern</li>
              </ul>
            </div>

            <div className="feature-group">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                📄 Document Generation
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ Template-based generation</li>
                <li>✅ Word/PDF support</li>
                <li>✅ Header/Footer customization</li>
                <li>✅ Field validation</li>
                <li>✅ Permission system</li>
                <li>✅ Error handling</li>
              </ul>
            </div>

          </div>
        </div>

        {/* Document Generator */}
        <Anexo3DocumentGenerator
          scoutId="L12-2024-001"
          userRole={currentUser.role}
          userName={currentUser.name}
          onDocumentGenerated={handleDocumentGenerated}
          onError={handleError}
        />

        {/* Usage Examples */}
        <div className="examples bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            💡 Ejemplos de Uso
          </h2>
          
          <div className="example-tabs">
            <div className="tab-content space-y-4">
              
              <div className="example">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  📋 Generación Programática
                </h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-md text-sm overflow-x-auto">
                  <pre>{`// Ejemplo de uso directo del Factory
const factory = new Anexo3DocumentFactory(templateRepo, docEngine);

const request: DocumentGenerationRequest = {
  templateId: 'anexo-3-datos-personales',
  scoutId: 'L12-2024-001',
  outputFormat: 'docx',
  generatedBy: 'Sistema Scout',
  userRole: 'dirigente'
};

const result = await factory.generatePersonalDataDocument(request);

if (result.isSuccess) {
  const document = result.getValue();
  // Guardar, enviar por email, etc.
}`}</pre>
                </div>
              </div>

              <div className="example">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  🔧 Extensión del Sistema
                </h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-md text-sm overflow-x-auto">
                  <pre>{`// Agregar nuevo template
const newTemplate: DocumentTemplate = {
  id: 'anexo-4-medicos',
  name: 'Anexo-4 Información Médica',
  type: DocumentType.MEDICAL_FORM,
  // ... configuración específica
};

await templateRepository.save(newTemplate);

// Agregar nuevo engine (PDF)
class PdfDocumentEngine implements IDocumentEngine {
  async generateDocument(template, data, options) {
    // Implementación para PDF
  }
}`}</pre>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer text-center mt-8 py-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            🏕️ Sistema desarrollado con Clean Architecture y principios SOLID
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Grupo Scout Lima 12 - La Universidad del Escultismo © 2024
          </p>
        </div>

      </div>
    </div>
  );
};

export default DocumentSystemDemo;