/**
 * 📚 Template Manager
 * Gestiona plantillas de documentos guardadas y predefinidas
 */

import React, { useState, useEffect } from 'react';
import { TableDesign } from './TableDesigner';

// Tipos
export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface TemplatePreview {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  isBuiltIn: boolean;
  created_at: string;
  usage_count: number;
}

// Plantillas predefinidas
export const BUILT_IN_TEMPLATES: TableDesign[] = [
  // Template estándar original
  {
    id: 'dngi03_standard',
    name: 'DNGI-03 Estándar',
    description: 'Formato original con distribución equilibrada',
    totalColumns: 4,
    defaultCellWidth: 25,
    defaultRowHeight: 40,
    borderWidth: 1,
    borderColor: '#000000',
    font: { family: 'Calibri', size: 10 },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    rows: [
      {
        id: 'row_1',
        cells: [
          { id: 'cell_1_1', content: 'APELLIDOS COMPLETOS', fieldKey: 'apellidos', colspan: 2, rowspan: 1, isHeader: true, backgroundColor: '#808080', textColor: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
          { id: 'cell_1_2', content: 'NOMBRES COMPLETOS', fieldKey: 'nombres', colspan: 2, rowspan: 1, isHeader: true, backgroundColor: '#808080', textColor: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' }
        ]
      },
      {
        id: 'row_2',
        cells: [
          { id: 'cell_2_1', content: '', fieldKey: 'apellidos', colspan: 2, rowspan: 1, isHeader: false, backgroundColor: '#FFFFFF', textColor: '#000000', fontSize: 10, fontWeight: 'normal', textAlign: 'left' },
          { id: 'cell_2_2', content: '', fieldKey: 'nombres', colspan: 2, rowspan: 1, isHeader: false, backgroundColor: '#FFFFFF', textColor: '#000000', fontSize: 10, fontWeight: 'normal', textAlign: 'left' }
        ]
      },
      {
        id: 'row_3',
        cells: [
          { id: 'cell_3_1', content: 'SEXO', fieldKey: 'sexo', colspan: 1, rowspan: 1, isHeader: true, backgroundColor: '#808080', textColor: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
          { id: 'cell_3_2', content: 'FECHA DE NACIMIENTO', fieldKey: 'fecha_nacimiento', colspan: 1, rowspan: 1, isHeader: true, backgroundColor: '#808080', textColor: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
          { id: 'cell_3_3', content: 'TIPO DE DOCUMENTO', fieldKey: 'tipo_documento', colspan: 1, rowspan: 1, isHeader: true, backgroundColor: '#808080', textColor: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
          { id: 'cell_3_4', content: 'NÚMERO DE DOCUMENTO', fieldKey: 'numero_documento', colspan: 1, rowspan: 1, isHeader: true, backgroundColor: '#808080', textColor: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' }
        ]
      }
    ]
  },

  // Template personalizado según requerimientos del usuario
  {
    id: 'dngi03_custom',
    name: 'DNGI-03 Personalizado',
    description: 'Apellidos sobre (Sexo+Fecha), Nombres sobre (Tipo+Número Doc)',
    totalColumns: 4,
    defaultCellWidth: 25,
    defaultRowHeight: 40,
    borderWidth: 1,
    borderColor: '#000000',
    font: { family: 'Calibri', size: 10 },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    rows: [
      {
        id: 'row_1',
        cells: [
          { id: 'cell_1_1', content: 'APELLIDOS COMPLETOS', fieldKey: 'apellidos', colspan: 2, rowspan: 1, isHeader: true, backgroundColor: '#808080', textColor: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
          { id: 'cell_1_2', content: 'NOMBRES COMPLETOS', fieldKey: 'nombres', colspan: 2, rowspan: 1, isHeader: true, backgroundColor: '#808080', textColor: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' }
        ]
      },
      {
        id: 'row_2',
        cells: [
          { id: 'cell_2_1', content: 'SEXO', fieldKey: 'sexo', colspan: 1, rowspan: 1, isHeader: true, backgroundColor: '#808080', textColor: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
          { id: 'cell_2_2', content: 'FECHA DE NACIMIENTO', fieldKey: 'fecha_nacimiento', colspan: 1, rowspan: 1, isHeader: true, backgroundColor: '#808080', textColor: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
          { id: 'cell_2_3', content: 'TIPO DE DOCUMENTO', fieldKey: 'tipo_documento', colspan: 1, rowspan: 1, isHeader: true, backgroundColor: '#808080', textColor: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
          { id: 'cell_2_4', content: 'NÚMERO DE DOCUMENTO', fieldKey: 'numero_documento', colspan: 1, rowspan: 1, isHeader: true, backgroundColor: '#808080', textColor: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' }
        ]
      },
      {
        id: 'row_3',
        cells: [
          { id: 'cell_3_1', content: '', fieldKey: 'apellidos', colspan: 2, rowspan: 1, isHeader: false, backgroundColor: '#FFFFFF', textColor: '#000000', fontSize: 10, fontWeight: 'normal', textAlign: 'left' },
          { id: 'cell_3_2', content: '', fieldKey: 'nombres', colspan: 2, rowspan: 1, isHeader: false, backgroundColor: '#FFFFFF', textColor: '#000000', fontSize: 10, fontWeight: 'normal', textAlign: 'left' }
        ]
      },
      {
        id: 'row_4',
        cells: [
          { id: 'cell_4_1', content: '', fieldKey: 'sexo', colspan: 1, rowspan: 1, isHeader: false, backgroundColor: '#FFFFFF', textColor: '#000000', fontSize: 10, fontWeight: 'normal', textAlign: 'left' },
          { id: 'cell_4_2', content: '', fieldKey: 'fecha_nacimiento', colspan: 1, rowspan: 1, isHeader: false, backgroundColor: '#FFFFFF', textColor: '#000000', fontSize: 10, fontWeight: 'normal', textAlign: 'left' },
          { id: 'cell_4_3', content: '', fieldKey: 'tipo_documento', colspan: 1, rowspan: 1, isHeader: false, backgroundColor: '#FFFFFF', textColor: '#000000', fontSize: 10, fontWeight: 'normal', textAlign: 'left' },
          { id: 'cell_4_4', content: '', fieldKey: 'numero_documento', colspan: 1, rowspan: 1, isHeader: false, backgroundColor: '#FFFFFF', textColor: '#000000', fontSize: 10, fontWeight: 'normal', textAlign: 'left' }
        ]
      }
    ]
  },

  // Template minimalista
  {
    id: 'dngi03_minimal',
    name: 'DNGI-03 Minimalista',
    description: 'Versión simplificada con campos esenciales',
    totalColumns: 2,
    defaultCellWidth: 50,
    defaultRowHeight: 40,
    borderWidth: 1,
    borderColor: '#000000',
    font: { family: 'Calibri', size: 10 },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    rows: [
      {
        id: 'row_1',
        cells: [
          { id: 'cell_1_1', content: 'DATOS PERSONALES', fieldKey: '', colspan: 2, rowspan: 1, isHeader: true, backgroundColor: '#4F46E5', textColor: '#FFFFFF', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }
        ]
      },
      {
        id: 'row_2',
        cells: [
          { id: 'cell_2_1', content: 'NOMBRES COMPLETOS', fieldKey: 'nombres', colspan: 1, rowspan: 1, isHeader: true, backgroundColor: '#808080', textColor: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
          { id: 'cell_2_2', content: 'APELLIDOS COMPLETOS', fieldKey: 'apellidos', colspan: 1, rowspan: 1, isHeader: true, backgroundColor: '#808080', textColor: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' }
        ]
      },
      {
        id: 'row_3',
        cells: [
          { id: 'cell_3_1', content: '', fieldKey: 'nombres', colspan: 1, rowspan: 1, isHeader: false, backgroundColor: '#FFFFFF', textColor: '#000000', fontSize: 10, fontWeight: 'normal', textAlign: 'left' },
          { id: 'cell_3_2', content: '', fieldKey: 'apellidos', colspan: 1, rowspan: 1, isHeader: false, backgroundColor: '#FFFFFF', textColor: '#000000', fontSize: 10, fontWeight: 'normal', textAlign: 'left' }
        ]
      }
    ]
  }
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: 'builtin', name: 'Plantillas Predefinidas', description: 'Templates oficiales del sistema', icon: '🏛️' },
  { id: 'custom', name: 'Mis Plantillas', description: 'Templates creados por el usuario', icon: '🎨' },
  { id: 'shared', name: 'Plantillas Compartidas', description: 'Templates compartidos por otros usuarios', icon: '🤝' },
  { id: 'archived', name: 'Archivadas', description: 'Templates no activos', icon: '📦' }
];

interface TemplateManagerProps {
  onSelect: (template: TableDesign) => void;
  onEdit: (template: TableDesign) => void;
  onDelete?: (templateId: string) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  onSelect,
  onEdit,
  onDelete
}) => {
  const [templates, setTemplates] = useState<TableDesign[]>(BUILT_IN_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState('builtin');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Cargar templates del localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('dngi03_custom_templates');
    if (savedTemplates) {
      try {
        const customTemplates = JSON.parse(savedTemplates);
        setTemplates([...BUILT_IN_TEMPLATES, ...customTemplates]);
      } catch (error) {
        console.error('Error loading custom templates:', error);
      }
    }
  }, []);

  // Filtrar templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'builtin' 
      ? BUILT_IN_TEMPLATES.some(bt => bt.id === template.id)
      : selectedCategory === 'custom' 
        ? !BUILT_IN_TEMPLATES.some(bt => bt.id === template.id)
        : true;
    
    return matchesSearch && matchesCategory;
  });

  // Guardar template personalizado
  const saveCustomTemplate = (template: TableDesign) => {
    const customTemplates = templates.filter(t => !BUILT_IN_TEMPLATES.some(bt => bt.id === t.id));
    customTemplates.push(template);
    localStorage.setItem('dngi03_custom_templates', JSON.stringify(customTemplates));
    setTemplates([...BUILT_IN_TEMPLATES, ...customTemplates]);
  };

  // Eliminar template
  const handleDelete = (templateId: string) => {
    if (BUILT_IN_TEMPLATES.some(bt => bt.id === templateId)) {
      alert('No se pueden eliminar plantillas predefinidas');
      return;
    }

    if (window.confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      const customTemplates = updatedTemplates.filter(t => !BUILT_IN_TEMPLATES.some(bt => bt.id === t.id));
      localStorage.setItem('dngi03_custom_templates', JSON.stringify(customTemplates));
      setTemplates(updatedTemplates);
      onDelete?.(templateId);
    }
  };

  // Duplicar template
  const duplicateTemplate = (template: TableDesign) => {
    const duplicated: TableDesign = {
      ...template,
      id: `${template.id}_copy_${Date.now()}`,
      name: `${template.name} (Copia)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    saveCustomTemplate(duplicated);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">📚 Gestor de Plantillas DNGI-03</h2>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              {viewMode === 'grid' ? '📋 Lista' : '⊞ Cuadrícula'}
            </button>
          </div>
        </div>

        {/* Búsqueda y filtros */}
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar plantillas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {TEMPLATE_CATEGORIES.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-6 overflow-auto">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                isBuiltIn={BUILT_IN_TEMPLATES.some(bt => bt.id === template.id)}
                onSelect={() => onSelect(template)}
                onEdit={() => onEdit(template)}
                onDelete={() => handleDelete(template.id)}
                onDuplicate={() => duplicateTemplate(template)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTemplates.map(template => (
              <TemplateListItem
                key={template.id}
                template={template}
                isBuiltIn={BUILT_IN_TEMPLATES.some(bt => bt.id === template.id)}
                onSelect={() => onSelect(template)}
                onEdit={() => onEdit(template)}
                onDelete={() => handleDelete(template.id)}
                onDuplicate={() => duplicateTemplate(template)}
              />
            ))}
          </div>
        )}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h3 className="text-xl text-gray-600 mb-2">No se encontraron plantillas</h3>
            <p className="text-gray-500">Intenta cambiar los filtros o crear una nueva plantilla</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de tarjeta de template
interface TemplateCardProps {
  template: TableDesign;
  isBuiltIn: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isBuiltIn,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border">
      {/* Preview */}
      <div className="p-4 border-b">
        <div className="w-full h-32 bg-gray-50 rounded border flex items-center justify-center mb-3">
          <div className="text-xs text-gray-400">
            <div className="grid grid-cols-2 gap-1">
              {template.rows.slice(0, 2).map(row => 
                row.cells.map(cell => (
                  <div 
                    key={cell.id}
                    className="w-8 h-4 border border-gray-300 text-xs flex items-center justify-center"
                    style={{ 
                      backgroundColor: cell.backgroundColor,
                      color: cell.textColor,
                      fontSize: '6px'
                    }}
                  >
                    {cell.content.substring(0, 3)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <h3 className="font-semibold text-gray-800 mb-1">{template.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{isBuiltIn ? '🏛️ Oficial' : '🎨 Personalizada'}</span>
          <span>{template.rows.length} filas</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="p-4 space-y-2">
        <button
          onClick={onSelect}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          ✅ Usar Plantilla
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
          >
            ✏️ Editar
          </button>
          
          <button
            onClick={onDuplicate}
            className="flex-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            📋 Duplicar
          </button>
          
          {!isBuiltIn && (
            <button
              onClick={onDelete}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de lista de template
const TemplateListItem: React.FC<TemplateCardProps> = ({
  template,
  isBuiltIn,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-800">{template.name}</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {isBuiltIn ? '🏛️ Oficial' : '🎨 Personalizada'}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
              {template.rows.length} filas
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{template.description}</p>
          <div className="text-xs text-gray-500">
            Creado: {new Date(template.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          <button
            onClick={onSelect}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            ✅ Usar
          </button>
          
          <button
            onClick={onEdit}
            className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
          >
            ✏️ Editar
          </button>
          
          <button
            onClick={onDuplicate}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            📋 Duplicar
          </button>
          
          {!isBuiltIn && (
            <button
              onClick={onDelete}
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;