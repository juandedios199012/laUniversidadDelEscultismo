/**
 * Página de diseño de PDFs - Vista previa en tiempo real
 * Usa esta página para diseñar y ver tus plantillas de PDF
 */

import React from 'react';
import { ReportPreview } from '../modules/reports/components/ReportPreview';
import { Palette, Info } from 'lucide-react';

const PDFDesignerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Palette className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Diseñador de PDFs
            </h1>
          </div>
          <p className="text-gray-600">
            Vista previa en tiempo real de tus plantillas de reportes PDF
          </p>
        </div>

        {/* Info box */}
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-purple-900">
              <p className="font-semibold mb-2">💡 Cómo usar este diseñador:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Selecciona el tipo de reporte que quieres diseñar</li>
                <li>Carga datos de prueba o de Supabase</li>
                <li>Haz clic en "Ver Vista Previa"</li>
                <li>Edita el código de la plantilla en: <code className="bg-purple-100 px-1 rounded">src/modules/reports/templates/pdf/</code></li>
                <li>Guarda el archivo y recarga la vista previa para ver los cambios</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Componente de preview */}
        <ReportPreview />

        {/* Tips adicionales */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              Editar Estilos
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Los estilos reutilizables están en:
            </p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded block mb-3">
              src/modules/reports/styles/pdfStyles.ts
            </code>
            <p className="text-sm text-gray-600">
              Cambia colores, fuentes y espaciados desde ahí para que se apliquen a todos los reportes.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">📄</span>
              Crear Nueva Plantilla
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Para crear un nuevo tipo de reporte:
            </p>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>Copia una plantilla existente en templates/pdf/</li>
              <li>Modifica el diseño según necesites</li>
              <li>Agrégala al ReportPreview para verla aquí</li>
            </ol>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Hot Reload
            </h3>
            <p className="text-sm text-gray-600">
              Vite recarga automáticamente cuando guardas cambios. Solo necesitas hacer clic en "Ver Vista Previa" de nuevo para ver la versión actualizada.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">📚</span>
              Documentación
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Lee las guías completas:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• DESIGN_GUIDE.md - Cómo diseñar PDFs</li>
              <li>• README.md - Documentación completa</li>
              <li>• USAGE_EXAMPLES.tsx - 8 ejemplos de uso</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFDesignerPage;
