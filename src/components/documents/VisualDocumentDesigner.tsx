/**
 * 🎨 Visual Document Designer
 * Componente principal que integra TableDesigner, TemplateManager y Preview
 */

import React, { useState, useCallback, useEffect } from 'react';
import { TableDesigner, TableDesign } from './TableDesigner';
import { TemplateManager } from './TemplateManager';
import { DynamicDocumentAdapter } from '../../utils/DynamicDocumentAdapter';
import { DocumentFormat } from '../../utils/DocumentGenerationStrategy';
import { Scout } from '../../lib/supabase';
import ScoutService from '../../services/scoutService';

interface VisualDocumentDesignerProps {
  scouts?: Scout[];
  onClose?: () => void;
  onSave?: (design: TableDesign) => void;
  onGenerate?: (design: TableDesign, format: DocumentFormat) => void;
}

export const VisualDocumentDesigner: React.FC<VisualDocumentDesignerProps> = ({ 
  scouts: propScouts = [],
  onSave,
  onGenerate
}) => {
  const [currentView, setCurrentView] = useState<'templates' | 'designer' | 'preview'>('templates');
  const [currentDesign, setCurrentDesign] = useState<TableDesign | null>(null);
  
  // Estado para scouts reales de la base de datos
  const [scouts, setScouts] = useState<Scout[]>(propScouts);
  const [loadingScouts, setLoadingScouts] = useState(false);

  // Cargar scouts de la base de datos si no se proporcionaron
  useEffect(() => {
    if (!propScouts || propScouts.length === 0) {
      loadScoutsFromDatabase();
    }
  }, [propScouts]);

  // Auto-guardar el diseño actual cuando cambia
  useEffect(() => {
    if (currentDesign) {
      // Guardar automáticamente en localStorage con una key específica para el diseño actual
      localStorage.setItem('dngi03_current_design', JSON.stringify(currentDesign));
    }
  }, [currentDesign]);

  // Restaurar el diseño actual al cargar la página
  useEffect(() => {
    const savedCurrentDesign = localStorage.getItem('dngi03_current_design');
    if (savedCurrentDesign && !currentDesign) {
      try {
        const parsedDesign = JSON.parse(savedCurrentDesign);
        setCurrentDesign(parsedDesign);
        console.log('✅ Diseño actual restaurado desde localStorage');
      } catch (error) {
        console.error('❌ Error al restaurar diseño actual:', error);
      }
    }
  }, [currentDesign]);

  const loadScoutsFromDatabase = async () => {
    try {
      setLoadingScouts(true);
      console.log('🔍 Cargando scouts desde la base de datos...');
      
      const scoutsData = await ScoutService.getAllScouts();
      console.log('✅ Scouts cargados:', scoutsData.length);
      
      setScouts(scoutsData);
    } catch (error) {
      console.error('❌ Error al cargar scouts:', error);
      // Usar scout de ejemplo si falla la carga
      setScouts([{
        id: 'sample',
        codigo_scout: 'SC001',
        nombres: 'Juan Carlos',
        apellidos: 'García López',
        fecha_nacimiento: '2010-01-15',
        edad: 13,
        sexo: 'MASCULINO',
        celular: '987654321',
        telefono: '4567890',
        correo: 'juan@scout.org.pe',
        tipo_documento: 'DNI',
        numero_documento: '12345678',
        pais: 'Perú',
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'San Isidro',
        direccion: 'Av. Principal 123',
        centro_estudio: 'Colegio San Martín',
        ocupacion: 'Estudiante',
        centro_laboral: '',
        es_dirigente: false,
        fecha_ingreso: '2024-01-01',
        rama_actual: 'Scouts',
        estado: 'ACTIVO',
        foto_url: '',
        observaciones: 'Scout activo y participativo',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }]);
    } finally {
      setLoadingScouts(false);
    }
  };

  const documentAdapter = new DynamicDocumentAdapter();

  // Función para generar documento con diseño visual
  const handleGenerateDocument = useCallback(async (design: TableDesign, format: DocumentFormat) => {
    if (!design || scouts.length === 0) return;

    try {
      // Si hay un callback personalizado, usarlo
      if (onGenerate) {
        onGenerate(design, format);
        return;
      }

      // Usar el primer scout como muestra
      const sampleScout = scouts[0];
      const result = await documentAdapter.generateFromDesign(design, sampleScout, format);
      
      // Descargar archivo
      const blob = new Blob([result.data], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generando documento:', error);
      alert('Error al generar el documento');
    }
  }, [scouts, documentAdapter, onGenerate]);
  const [previewFormat, setPreviewFormat] = useState<'word' | 'pdf' | 'html'>('html');

  // Manejar selección de template
  const handleTemplateSelect = useCallback((template: TableDesign) => {
    setCurrentDesign(template);
    setCurrentView('designer');
  }, []);

  // Manejar edición de template
  const handleTemplateEdit = useCallback((template: TableDesign) => {
    setCurrentDesign(template);
    setCurrentView('designer');
  }, []);

  // Manejar guardado de diseño
  const handleSaveDesign = useCallback((design: TableDesign) => {
    // Actualizar el diseño actual con timestamp
    const updatedDesign = {
      ...design,
      updated_at: new Date().toISOString()
    };
    
    setCurrentDesign(updatedDesign);
    onSave?.(updatedDesign);
    
    // Guardar en localStorage para templates personalizados
    const customTemplates = JSON.parse(localStorage.getItem('dngi03_custom_templates') || '[]');
    const existingIndex = customTemplates.findIndex((t: TableDesign) => t.id === updatedDesign.id);
    
    if (existingIndex >= 0) {
      customTemplates[existingIndex] = updatedDesign;
    } else {
      customTemplates.push(updatedDesign);
    }
    
    localStorage.setItem('dngi03_custom_templates', JSON.stringify(customTemplates));
    
    // También guardar como diseño actual
    localStorage.setItem('dngi03_current_design', JSON.stringify(updatedDesign));
    
    console.log('✅ Diseño guardado y sincronizado');
    alert('Diseño guardado exitosamente!');
  }, [onSave]);

  // Generar vista previa en tiempo real
  const generatePreview = useCallback((design: TableDesign) => {
    if (!design) return '';

    // Debug: ver qué datos tenemos
    console.log('🔍 Debug generatePreview - scouts:', scouts);
    if (scouts.length > 0) {
      console.log('📊 Primer scout:', scouts[0]);
    }

    // Mapeo de field keys a nombres de header más apropiados
    const fieldLabels: Record<string, string> = {
      'apellidos': 'APELLIDOS COMPLETOS',
      'nombres': 'NOMBRES COMPLETOS', 
      'sexo': 'SEXO',
      'fecha_nacimiento': 'FECHA DE NACIMIENTO',
      'tipo_documento': 'TIPO DE DOCUMENTO',
      'numero_documento': 'NÚMERO DE DOCUMENTO',
      'celular': 'CELULAR',
      'telefono': 'TELÉFONO',
      'correo': 'CORREO ELECTRÓNICO',
      'direccion': 'DIRECCIÓN',
      'departamento': 'DEPARTAMENTO',
      'provincia': 'PROVINCIA',
      'distrito': 'DISTRITO',
      'centro_estudio': 'CENTRO DE ESTUDIOS',
      'rama_actual': 'RAMA/UNIDAD',
      'observaciones': 'OBSERVACIONES'
    };

    const renderCell = (cell: any, rowData: Record<string, any>) => {
      // Debug para ver qué datos están llegando
      if (!cell.isHeader && cell.fieldKey) {
        console.log(`🔍 Debug renderCell - fieldKey: ${cell.fieldKey}, value: ${rowData[cell.fieldKey]}, type: ${typeof rowData[cell.fieldKey]}`);
      }

      // Si es header, mostrar siempre el contenido/título apropiado
      if (cell.isHeader) {
        // Si tiene contenido personalizado, usarlo
        if (cell.content && cell.content.trim()) {
          return cell.content;
        }
        // Si tiene fieldKey, usar el label apropiado
        if (cell.fieldKey && fieldLabels[cell.fieldKey]) {
          return fieldLabels[cell.fieldKey];
        }
        // Si solo tiene fieldKey sin label conocido
        if (cell.fieldKey) {
          return cell.fieldKey.toUpperCase();
        }
        // Fallback
        return 'HEADER';
      }
      
      // Si no es header y tiene fieldKey, mostrar los datos del scout
      if (cell.fieldKey) {
        const value = rowData[cell.fieldKey];
        // Verificar si existe el valor y no es null/undefined
        if (value !== null && value !== undefined && value !== '') {
          return value;
        }
        // Si el valor está vacío pero hay fieldKey, mostrar un placeholder indicativo
        return `[${cell.fieldKey.toUpperCase()}]`;
      }
      
      // Si no es header y no tiene fieldKey, mostrar el contenido estático
      return cell.content || 'Vacío';
    };

    const scoutData = {
      apellidos: (scouts.length > 0 && scouts[0].apellidos) || 'García López',
      nombres: (scouts.length > 0 && scouts[0].nombres) || 'Juan Carlos',
      sexo: (scouts.length > 0 && scouts[0].sexo) || 'MASCULINO',
      fecha_nacimiento: (scouts.length > 0 && scouts[0].fecha_nacimiento) || '2010-01-15',
      tipo_documento: (scouts.length > 0 && scouts[0].tipo_documento) || 'DNI',
      numero_documento: (scouts.length > 0 && scouts[0].numero_documento) || '12345678',
      celular: (scouts.length > 0 && scouts[0].celular) || '987654321',
      telefono: (scouts.length > 0 && scouts[0].telefono) || '01-2345678',
      correo: (scouts.length > 0 && scouts[0].correo) || 'juan.garcia@scouts.pe',
      direccion: (scouts.length > 0 && scouts[0].direccion) || 'Av. Scout 123',
      departamento: (scouts.length > 0 && scouts[0].departamento) || 'LIMA',
      provincia: (scouts.length > 0 && scouts[0].provincia) || 'LIMA',
      distrito: (scouts.length > 0 && scouts[0].distrito) || 'SAN ISIDRO',
      centro_estudio: (scouts.length > 0 && scouts[0].centro_estudio) || 'Colegio Nacional',
      rama_actual: (scouts.length > 0 && scouts[0].rama_actual) || 'Scouts',
      observaciones: (scouts.length > 0 && scouts[0].observaciones) || 'NO APLICA'
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vista Previa - ${design.name}</title>
    <style>
        body {
            font-family: ${design.font.family}, Arial, sans-serif;
            font-size: ${design.font.size}px;
            margin: 20px;
            color: #000;
        }
        .document-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .preview-table {
            width: 100%;
            border-collapse: collapse;
            border: ${design.borderWidth}px solid ${design.borderColor};
        }
        .preview-table td {
            border: ${design.borderWidth}px solid ${design.borderColor};
            padding: 8px;
            vertical-align: top;
        }
        .preview-note {
            margin-top: 15px;
            padding: 10px;
            background-color: #f0f8ff;
            border: 1px solid #cce7ff;
            border-radius: 4px;
            font-size: 12px;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="document-title">Datos del Miembro Juvenil (menor de edad)</div>
    <table class="preview-table">
        ${design.rows.map(row => `
            <tr>
                ${row.cells.map(cell => `
                    <td 
                        colspan="${cell.colspan}" 
                        rowspan="${cell.rowspan}"
                        style="
                            background-color: ${cell.backgroundColor || '#FFFFFF'};
                            color: ${cell.textColor || '#000000'};
                            font-weight: ${cell.fontWeight || 'normal'};
                            text-align: ${cell.textAlign || 'left'};
                            font-size: ${cell.fontSize || design.font.size}px;
                        "
                    >
                        ${renderCell(cell, scoutData)}
                    </td>
                `).join('')}
            </tr>
        `).join('')}
    </table>
    
    <div class="preview-note">
        <strong>Nota:</strong> Esta vista previa muestra ${scouts.length > 0 ? 'datos reales del primer scout en la base de datos' : 'datos de muestra'}. Los headers muestran los nombres de campos, las celdas de datos muestran información ${scouts.length > 0 ? 'real del scout' : 'de ejemplo'}. Los datos de todos los scouts se insertarán al generar documentos en masa.
    </div>
</body>
</html>`;
  }, [scouts]);

  // Navegación
  const renderNavigation = () => (
    <nav className="bg-white shadow-sm border-b p-4">
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <button
            onClick={() => setCurrentView('templates')}
            className={`px-4 py-2 rounded-md ${currentView === 'templates' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            📚 Plantillas
          </button>
          
          <button
            onClick={() => setCurrentView('designer')}
            disabled={!currentDesign}
            className={`px-4 py-2 rounded-md ${currentView === 'designer' 
              ? 'bg-blue-600 text-white' 
              : currentDesign 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            🎨 Diseñador
          </button>
          
          <button
            onClick={() => setCurrentView('preview')}
            disabled={!currentDesign}
            className={`px-4 py-2 rounded-md ${currentView === 'preview' 
              ? 'bg-blue-600 text-white' 
              : currentDesign 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            👁️ Vista Previa
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {currentDesign && (
            <>
              <span className="text-sm text-gray-600">
                Diseño: <strong>{currentDesign.name}</strong>
              </span>
              
              {currentView === 'preview' && (
                <div className="flex items-center space-x-2">
                  <select
                    value={previewFormat}
                    onChange={(e) => setPreviewFormat(e.target.value as 'word' | 'pdf' | 'html')}
                    className="p-2 border rounded text-sm"
                  >
                    <option value="html">HTML</option>
                    <option value="word">Word</option>
                    <option value="pdf">PDF</option>
                  </select>
                  
                  <button
                    onClick={() => handleGenerateDocument(currentDesign, previewFormat)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    📄 Generar {previewFormat.toUpperCase()}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );

  // Renderizar contenido principal
  const renderMainContent = () => {
    switch (currentView) {
      case 'templates':
        return (
          <TemplateManager
            onSelect={handleTemplateSelect}
            onEdit={handleTemplateEdit}
            onDelete={(templateId) => {
              console.log('Template deleted:', templateId);
            }}
          />
        );

      case 'designer':
        return currentDesign ? (
          <TableDesigner
            initialDesign={currentDesign}
            onSave={handleSaveDesign}
            onChange={(updatedDesign) => {
              // Auto-guardar cambios en tiempo real
              setCurrentDesign(updatedDesign);
              localStorage.setItem('dngi03_current_design', JSON.stringify(updatedDesign));
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl text-gray-400 mb-4">🎨</div>
              <h3 className="text-xl text-gray-600 mb-2">Selecciona una plantilla</h3>
              <p className="text-gray-500">Elige una plantilla para comenzar a diseñar</p>
              <button
                onClick={() => setCurrentView('templates')}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ver Plantillas
              </button>
            </div>
          </div>
        );

      case 'preview':
        return currentDesign ? (
          <div className="h-full bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h2 className="text-lg font-semibold">Vista Previa - {currentDesign.name}</h2>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {loadingScouts ? 'Cargando datos de scouts...' : 
                       scouts.length > 0 ? `Usando datos reales (${scouts.length} scouts en base de datos)` : 
                       'Usando datos de muestra'}
                    </p>
                    {scouts.length > 0 && (
                      <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        ✅ Conectado a DB - Scout: {scouts[0].nombres} {scouts[0].apellidos}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  <iframe
                    srcDoc={generatePreview(currentDesign)}
                    className="w-full h-96 border rounded"
                    title="Vista previa del documento"
                  />
                </div>
                
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <div>Columnas: {currentDesign.totalColumns}</div>
                      <div>Filas: {currentDesign.rows.length}</div>
                      <div>Fuente: {currentDesign.font.family} {currentDesign.font.size}px</div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setCurrentView('designer')}
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                      >
                        ✏️ Editar Diseño
                      </button>
                      
                      <button
                        onClick={() => {
                          const html = generatePreview(currentDesign);
                          const newWindow = window.open('', '_blank');
                          if (newWindow) {
                            newWindow.document.write(html);
                            newWindow.document.close();
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        🔍 Abrir en Nueva Ventana
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl text-gray-400 mb-4">👁️</div>
              <h3 className="text-xl text-gray-600 mb-2">Sin diseño para previsualizar</h3>
              <p className="text-gray-500">Selecciona o crea un diseño primero</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {renderNavigation()}
      <div className="flex-1 overflow-hidden">
        {renderMainContent()}
      </div>
    </div>
  );
};

export default VisualDocumentDesigner;