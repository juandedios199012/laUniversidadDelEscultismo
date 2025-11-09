/**
 * 🎨 Visual Table Designer
 * Permite crear y editar estructuras de tabla mediante drag & drop
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

// Tipos para el diseñador de tablas
export interface TableCell {
  id: string;
  content: string;
  fieldKey?: string;
  colspan: number;
  rowspan: number;
  isHeader: boolean;
  width?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
}

export interface TableRow {
  id: string;
  cells: TableCell[];
  height?: number;
}

export interface TableDesign {
  id: string;
  name: string;
  description: string;
  rows: TableRow[];
  totalColumns: number;
  defaultCellWidth: number;
  defaultRowHeight: number;
  borderWidth: number;
  borderColor: string;
  font: {
    family: string;
    size: number;
  };
  created_at: string;
  updated_at: string;
}

// Campos disponibles del Scout
export const SCOUT_FIELDS = [
  { key: 'apellidos', label: 'Apellidos Completos', type: 'text' },
  { key: 'nombres', label: 'Nombres Completos', type: 'text' },
  { key: 'sexo', label: 'Sexo', type: 'text' },
  { key: 'fecha_nacimiento', label: 'Fecha de Nacimiento', type: 'date' },
  { key: 'tipo_documento', label: 'Tipo de Documento', type: 'select' },
  { key: 'numero_documento', label: 'Número de Documento', type: 'text' },
  { key: 'celular', label: 'Celular', type: 'phone' },
  { key: 'telefono', label: 'Teléfono', type: 'phone' },
  { key: 'correo', label: 'Correo Electrónico', type: 'email' },
  { key: 'direccion', label: 'Dirección', type: 'text' },
  { key: 'departamento', label: 'Departamento', type: 'text' },
  { key: 'provincia', label: 'Provincia', type: 'text' },
  { key: 'distrito', label: 'Distrito', type: 'text' },
  { key: 'centro_estudio', label: 'Centro de Estudios', type: 'text' },
  { key: 'rama_actual', label: 'Rama/Unidad', type: 'select' },
  { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
];

// Componente principal del diseñador
interface TableDesignerProps {
  onSave: (design: TableDesign) => void;
  onChange?: (design: TableDesign) => void; // Nuevo: notificar cambios en tiempo real
  initialDesign?: TableDesign;
  mode?: 'create' | 'edit';
}

export const TableDesigner: React.FC<TableDesignerProps> = ({
  onSave,
  onChange,
  initialDesign
}) => {
  const [design, setDesign] = useState<TableDesign>(
    initialDesign || createDefaultDesign()
  );
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  
  const tableRef = useRef<HTMLTableElement>(null);

  // Notificar cambios del diseño en tiempo real
  useEffect(() => {
    if (onChange) {
      onChange(design);
    }
  }, [design, onChange]);

  // Crear diseño por defecto
  function createDefaultDesign(): TableDesign {
    return {
      id: `design_${Date.now()}`,
      name: 'Nuevo Diseño DNGI-03',
      description: 'Diseño personalizado de documento DNGI-03',
      totalColumns: 4,
      defaultCellWidth: 25,
      defaultRowHeight: 40,
      borderWidth: 1,
      borderColor: '#000000',
      font: {
        family: 'Calibri',
        size: 10
      },
      rows: [
        {
          id: 'row_1',
          cells: [
            createCell('cell_1_1', 'APELLIDOS COMPLETOS', true, 2),
            createCell('cell_1_2', 'NOMBRES COMPLETOS', true, 2),
          ]
        },
        {
          id: 'row_2',
          cells: [
            createCell('cell_2_1', '', false, 2, 'apellidos'),
            createCell('cell_2_2', '', false, 2, 'nombres'),
          ]
        },
        {
          id: 'row_3',
          cells: [
            createCell('cell_3_1', 'SEXO', true),
            createCell('cell_3_2', 'FECHA DE NACIMIENTO', true),
            createCell('cell_3_3', 'TIPO DE DOCUMENTO', true),
            createCell('cell_3_4', 'NÚMERO DE DOCUMENTO', true),
          ]
        },
        {
          id: 'row_4',
          cells: [
            createCell('cell_4_1', '', false, 1, 'sexo'),
            createCell('cell_4_2', '', false, 1, 'fecha_nacimiento'),
            createCell('cell_4_3', '', false, 1, 'tipo_documento'),
            createCell('cell_4_4', '', false, 1, 'numero_documento'),
          ]
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  function createCell(
    id: string, 
    content: string, 
    isHeader: boolean = false, 
    colspan: number = 1,
    fieldKey?: string
  ): TableCell {
    return {
      id,
      content,
      fieldKey,
      colspan,
      rowspan: 1,
      isHeader,
      backgroundColor: isHeader ? '#808080' : '#FFFFFF',
      textColor: isHeader ? '#FFFFFF' : '#000000',
      fontSize: 10,
      fontWeight: isHeader ? 'bold' : 'normal',
      textAlign: isHeader ? 'center' : 'left'
    };
  }

  // Manejar cambios en celdas
  const updateCell = useCallback((rowId: string, cellId: string, updates: Partial<TableCell>) => {
    setDesign(prev => ({
      ...prev,
      rows: prev.rows.map(row => 
        row.id === rowId 
          ? {
              ...row,
              cells: row.cells.map(cell =>
                cell.id === cellId ? { ...cell, ...updates } : cell
              )
            }
          : row
      ),
      updated_at: new Date().toISOString()
    }));
  }, []);

  // Agregar nueva fila
  const addRow = useCallback(() => {
    const newRowId = `row_${Date.now()}`;
    const newCells = Array.from({ length: design.totalColumns }, (_, index) => 
      createCell(`cell_${newRowId}_${index + 1}`, '', false, 1, undefined)
    );

    setDesign(prev => ({
      ...prev,
      rows: [...prev.rows, { id: newRowId, cells: newCells }],
      updated_at: new Date().toISOString()
    }));
  }, [design.totalColumns]);

  // Eliminar fila
  const removeRow = useCallback((rowId: string) => {
    setDesign(prev => ({
      ...prev,
      rows: prev.rows.filter(row => row.id !== rowId),
      updated_at: new Date().toISOString()
    }));
  }, []);

  // Manejar drop de campos
  const handleFieldDrop = useCallback((cellId: string, fieldKey: string) => {
    // Buscar la fila y celda correcta
    const targetRow = design.rows.find(row => 
      row.cells.some(cell => cell.id === cellId)
    );
    
    if (targetRow) {
      const field = SCOUT_FIELDS.find(f => f.key === fieldKey);
      
      if (field) {
        updateCell(targetRow.id, cellId, {
          fieldKey: field.key,
          content: field.label
        });
      }
    }
  }, [design.rows, updateCell]);

  // Agregar nueva columna
  const addColumn = useCallback(() => {
    setDesign(prev => ({
      ...prev,
      totalColumns: prev.totalColumns + 1,
      rows: prev.rows.map(row => ({
        ...row,
        cells: [
          ...row.cells,
          createCell(`cell_${row.id}_${prev.totalColumns + 1}`, '', false, 1, undefined)
        ]
      })),
      updated_at: new Date().toISOString()
    }));
  }, []);

  // Eliminar columna
  const removeColumn = useCallback(() => {
    if (design.totalColumns <= 1) return;
    
    setDesign(prev => ({
      ...prev,
      totalColumns: prev.totalColumns - 1,
      rows: prev.rows.map(row => ({
        ...row,
        cells: row.cells.slice(0, -1)
      })),
      updated_at: new Date().toISOString()
    }));
  }, [design.totalColumns]);

  // Guardar diseño
  const handleSave = useCallback(() => {
    onSave(design);
  }, [design, onSave]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Panel izquierdo: Campos disponibles */}
      <div className="w-1/4 bg-white shadow-lg p-4 overflow-y-auto">
        <h3 className="text-lg font-bold mb-2 text-blue-800">📋 Campos Disponibles</h3>
        <p className="text-xs text-gray-600 mb-4 bg-blue-50 p-2 rounded">
          🎯 <strong>Cómo usar:</strong> Arrastra estos campos a las celdas vacías para conectarlos con datos reales de la base de datos.
        </p>
        
        <div className="space-y-2">
          {SCOUT_FIELDS.map(field => (
            <div
              key={field.key}
              draggable
              onDragStart={(e) => {
                setDraggedField(field.key);
                e.dataTransfer.setData('text/plain', field.key);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onDragEnd={() => {
                setDraggedField(null);
                setDragOverCell(null);
              }}
              className={`p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-move hover:bg-blue-100 transition-all duration-200 ${
                draggedField === field.key ? 'opacity-50 scale-95' : ''
              }`}
            >
              <div className="font-medium text-blue-800">{field.label}</div>
              <div className="text-xs text-blue-600">{field.key}</div>
              <div className="text-xs text-gray-500 mt-1">↗️ Arrastra a una celda</div>
            </div>
          ))}
        </div>

        {/* Configuración global */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-bold mb-3">⚙️ Configuración</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del diseño:</label>
              <input
                type="text"
                value={design.name}
                onChange={(e) => setDesign(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border rounded text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Columnas totales:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={design.totalColumns}
                onChange={(e) => setDesign(prev => ({ ...prev, totalColumns: parseInt(e.target.value) }))}
                className="w-full p-2 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fuente:</label>
              <select
                value={design.font.family}
                onChange={(e) => setDesign(prev => ({ 
                  ...prev, 
                  font: { ...prev.font, family: e.target.value }
                }))}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="Calibri">Calibri</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tamaño fuente:</label>
              <input
                type="number"
                min="8"
                max="16"
                value={design.font.size}
                onChange={(e) => setDesign(prev => ({ 
                  ...prev, 
                  font: { ...prev.font, size: parseInt(e.target.value) }
                }))}
                className="w-full p-2 border rounded text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Panel central: Editor de tabla */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">🎨 Diseñador de Tabla DNGI-03</h2>
              <p className="text-sm text-gray-600 mt-1">
                📋 Arrastra campos desde la izquierda → 🎯 Haz clic en celdas para seleccionar → ⚙️ Configura propiedades a la derecha
              </p>
            </div>
            
            <div className="space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {showPreview ? '✏️ Editar' : '👁️ Vista Previa'}
              </button>
              
              <button
                onClick={addRow}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                ➕ Agregar Fila
              </button>
              
              <button
                onClick={addColumn}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                title="Agregar Columna"
              >
                ➕ Col
              </button>
              
              <button
                onClick={removeColumn}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                title="Eliminar Columna"
                disabled={design.totalColumns <= 1}
              >
                ➖ Col
              </button>
              
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                💾 Guardar Diseño
              </button>
            </div>
          </div>

          {/* Tabla editable */}
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <table 
              ref={tableRef}
              className="w-full border-collapse"
              style={{ 
                fontFamily: design.font.family,
                fontSize: `${design.font.size}px`
              }}
            >
              <tbody>
                {design.rows.map((row) => (
                  <tr key={row.id}>
                    {row.cells.map((cell) => (
                      <td
                        key={cell.id}
                        colSpan={cell.colspan}
                        rowSpan={cell.rowspan}
                        className={`border border-gray-400 p-2 min-h-[40px] relative cursor-pointer transition-all duration-200 ${
                          selectedCell === cell.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        } ${
                          dragOverCell === cell.id ? 'bg-green-100 border-green-400' : ''
                        }`}
                        style={{
                          backgroundColor: dragOverCell === cell.id ? '#dcfce7' : cell.backgroundColor,
                          color: cell.textColor,
                          fontWeight: cell.fontWeight,
                          textAlign: cell.textAlign,
                          fontSize: cell.fontSize ? `${cell.fontSize}px` : undefined,
                          width: `${(cell.colspan / design.totalColumns) * 100}%`
                        }}
                        onClick={() => setSelectedCell(cell.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverCell(cell.id);
                        }}
                        onDragLeave={() => {
                          setDragOverCell(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverCell(null);
                          if (draggedField) {
                            handleFieldDrop(cell.id, draggedField);
                            setDraggedField(null);
                          }
                        }}
                      >
                        <div className="min-h-[20px] relative">
                          {cell.content || cell.fieldKey || 'Vacío'}
                        </div>
                        
                        {/* Indicador de campo asignado */}
                        {cell.fieldKey && (
                          <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 rounded opacity-75 hover:opacity-100" title={`Campo: ${SCOUT_FIELDS.find(f => f.key === cell.fieldKey)?.label}`}>
                            �
                          </div>
                        )}
                      </td>
                    ))}
                    
                    {/* Botón eliminar fila */}
                    <td className="border-0 p-2">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar fila"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Panel derecho: Propiedades de celda */}
      <div className="w-1/4 bg-white shadow-lg p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">🔧 Propiedades</h3>
          {selectedCell && (
            <button
              onClick={() => setSelectedCell(null)}
              className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              title="Limpiar selección"
            >
              ✕
            </button>
          )}
        </div>
        
        {selectedCell ? (
          <CellPropertiesPanel
            cell={design.rows.find(row => 
              row.cells.some(cell => cell.id === selectedCell)
            )?.cells.find(cell => cell.id === selectedCell)}
            onUpdate={(updates) => {
              // Encontrar la fila que contiene la celda seleccionada
              const targetRow = design.rows.find(row => 
                row.cells.some(cell => cell.id === selectedCell)
              );
              if (targetRow) {
                updateCell(targetRow.id, selectedCell, updates);
              }
            }}
          />
        ) : (
          <div className="text-gray-500 text-center py-8">
            Selecciona una celda para editar sus propiedades
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para editar propiedades de celda
interface CellPropertiesPanelProps {
  cell?: TableCell;
  onUpdate: (updates: Partial<TableCell>) => void;
}

const CellPropertiesPanel: React.FC<CellPropertiesPanelProps> = ({ cell, onUpdate }) => {
  if (!cell) return null;

  return (
    <div className="space-y-4">
      {/* Información de la celda */}
      <div className="bg-gray-50 p-3 rounded border">
        <div className="text-xs text-gray-600 mb-1">Información de celda:</div>
        <div className="text-xs font-mono text-gray-800">ID: {cell.id}</div>
        <div className="text-xs text-gray-600">Posición: {cell.colspan}×{cell.rowspan}</div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Contenido:</label>
        <input
          type="text"
          value={cell.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="w-full p-2 border rounded text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Campo asignado:</label>
        <select
          value={cell.fieldKey || ''}
          onChange={(e) => onUpdate({ fieldKey: e.target.value || undefined })}
          className="w-full p-2 border rounded text-sm"
        >
          <option value="">Sin campo</option>
          {SCOUT_FIELDS.map(field => (
            <option key={field.key} value={field.key}>
              {field.label}
            </option>
          ))}
        </select>
        {cell.fieldKey && (
          <div className="mt-1 text-xs text-green-600 bg-green-50 p-1 rounded">
            ✅ Conectado a BD: {SCOUT_FIELDS.find(f => f.key === cell.fieldKey)?.label}
          </div>
        )}
        <div className="mt-1 text-xs text-gray-500">
          💡 Tip: También puedes arrastrar campos desde la izquierda
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Colspan:</label>
          <input
            type="number"
            min="1"
            max="10"
            value={cell.colspan}
            onChange={(e) => onUpdate({ colspan: parseInt(e.target.value) })}
            className="w-full p-2 border rounded text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Rowspan:</label>
          <input
            type="number"
            min="1"
            max="10"
            value={cell.rowspan}
            onChange={(e) => onUpdate({ rowspan: parseInt(e.target.value) })}
            className="w-full p-2 border rounded text-sm"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={cell.isHeader}
            onChange={(e) => onUpdate({ 
              isHeader: e.target.checked,
              backgroundColor: e.target.checked ? '#808080' : '#FFFFFF',
              textColor: e.target.checked ? '#FFFFFF' : '#000000',
              fontWeight: e.target.checked ? 'bold' : 'normal'
            })}
          />
          <span className="text-sm">Es header</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Color de fondo:</label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={cell.backgroundColor || '#FFFFFF'}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
            className="w-12 h-10 border rounded cursor-pointer"
          />
          <input
            type="text"
            value={cell.backgroundColor || '#FFFFFF'}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
            className="flex-1 p-2 border rounded text-sm font-mono"
            placeholder="#FFFFFF"
          />
        </div>
        
        {/* Colores predefinidos */}
        <div className="mt-2">
          <div className="text-xs text-gray-600 mb-1">Colores rápidos:</div>
          <div className="grid grid-cols-6 gap-1">
            {[
              { color: '#FFFFFF', name: 'Blanco' },
              { color: '#808080', name: 'Gris' },
              { color: '#000000', name: 'Negro' },
              { color: '#FF0000', name: 'Rojo' },
              { color: '#00FF00', name: 'Verde' },
              { color: '#0000FF', name: 'Azul' },
              { color: '#FFFF00', name: 'Amarillo' },
              { color: '#FFA500', name: 'Naranja' },
              { color: '#800080', name: 'Morado' },
              { color: '#FFC0CB', name: 'Rosa' },
              { color: '#A52A2A', name: 'Marrón' },
              { color: '#C0C0C0', name: 'Plateado' }
            ].map(({ color, name }) => (
              <button
                key={color}
                onClick={() => onUpdate({ backgroundColor: color })}
                className="w-6 h-6 border border-gray-300 rounded cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={`${name} (${color})`}
              />
            ))}
          </div>
        </div>
        
        <div 
          className="mt-2 h-8 rounded border flex items-center justify-center text-xs font-medium"
          style={{ 
            backgroundColor: cell.backgroundColor || '#FFFFFF',
            color: cell.textColor || '#000000'
          }}
        >
          Vista previa: {cell.backgroundColor || '#FFFFFF'}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Color de texto:</label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={cell.textColor || '#000000'}
            onChange={(e) => onUpdate({ textColor: e.target.value })}
            className="w-12 h-10 border rounded cursor-pointer"
          />
          <input
            type="text"
            value={cell.textColor || '#000000'}
            onChange={(e) => onUpdate({ textColor: e.target.value })}
            className="flex-1 p-2 border rounded text-sm font-mono"
            placeholder="#000000"
          />
        </div>
        
        {/* Colores de texto comunes */}
        <div className="mt-2">
          <div className="text-xs text-gray-600 mb-1">Colores de texto:</div>
          <div className="grid grid-cols-4 gap-1">
            {[
              { color: '#000000', name: 'Negro' },
              { color: '#FFFFFF', name: 'Blanco' },
              { color: '#808080', name: 'Gris' },
              { color: '#FF0000', name: 'Rojo' }
            ].map(({ color, name }) => (
              <button
                key={color}
                onClick={() => onUpdate({ textColor: color })}
                className="h-6 border border-gray-300 rounded cursor-pointer hover:scale-105 transition-transform text-xs font-medium"
                style={{ backgroundColor: color, color: color === '#000000' ? '#FFFFFF' : '#000000' }}
                title={`${name} (${color})`}
              >
                A
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Alineación:</label>
        <select
          value={cell.textAlign}
          onChange={(e) => onUpdate({ textAlign: e.target.value as 'left' | 'center' | 'right' })}
          className="w-full p-2 border rounded text-sm"
        >
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
          <option value="right">Derecha</option>
        </select>
      </div>
    </div>
  );
};

export default TableDesigner;