/**
 * Página de ejemplo para usar el módulo de reportes
 */

import React, { useState } from 'react';
import { ReportManager } from '../modules/reports';
import { ReportPreview } from '../modules/reports/components/ReportPreview';
import { Eye, Download } from 'lucide-react';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'preview'>('preview');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header de la página */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema de Reportes
          </h1>
          <p className="text-gray-600">
            Genera y descarga reportes en PDF o Word sobre scouts, asistencia y progreso
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('preview')}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors
                ${
                  activeTab === 'preview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Eye className="w-5 h-5" />
              Vista Previa (Diseño)
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors
                ${
                  activeTab === 'generate'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Download className="w-5 h-5" />
              Generar y Descargar
            </button>
          </div>
        </div>

        {/* Contenido según tab activo */}
        {activeTab === 'preview' ? (
          <ReportPreview />
        ) : (
          <ReportManager />
        )}

        {/* Información adicional */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ℹ️ Información del Sistema
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">Tecnología:</span>
              <span>React + @react-pdf/renderer + docx.js</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">Formatos:</span>
              <span>PDF (lectura) y Word (editable)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">Datos:</span>
              <span>Integración directa con Supabase</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">Personalización:</span>
              <span>Plantillas modificables desde código</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
