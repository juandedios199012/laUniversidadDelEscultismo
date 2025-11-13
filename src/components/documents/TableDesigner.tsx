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
  // Configuración de bordes
  borderWidth: number;
  borderColor: string;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
  // Configuración de espaciado
  cellPadding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  cellMargin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  // Configuración de fuente
  font: {
    family: string;
    size: number;
    weight: 'normal' | 'bold' | 'lighter' | 'bolder';
    style: 'normal' | 'italic' | 'oblique';
  };
  // Configuración de tabla
  tableLayout: 'auto' | 'fixed';
  tableMargin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  // Configuración de colores por defecto
  defaultBackgroundColor: string;
  defaultTextColor: string;
  alternateRowColor?: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  // Metadatos
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
  initialDesign,
  onSave = () => {}
}) => {
  const [design, setDesign] = useState<TableDesign>(() => {
    if (initialDesign) {
      // Merge initialDesign con valores por defecto para asegurar todas las propiedades
      const defaultDesign = createDefaultDesign();
      return {
        ...defaultDesign,
        ...initialDesign,
        // Asegurar objetos anidados
        cellPadding: {
          ...defaultDesign.cellPadding,
          ...(initialDesign.cellPadding || {})
        },
        cellMargin: {
          ...defaultDesign.cellMargin,
          ...(initialDesign.cellMargin || {})
        },
        font: {
          ...defaultDesign.font,
          ...(initialDesign.font || {})
        },
        tableMargin: {
          ...defaultDesign.tableMargin,
          ...(initialDesign.tableMargin || {})
        }
      };
    }
    return createDefaultDesign();
  });
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error' | null, text: string }>({ type: null, text: '' });
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [showSavedDesigns, setShowSavedDesigns] = useState(false);
  
  const tableRef = useRef<HTMLTableElement>(null);

  // Cargar diseños guardados
  const loadSavedDesigns = useCallback(async () => {
    try {
      console.log('🔄 Iniciando carga de diseños guardados...');
      setIsLoadingDesigns(true);
      const { tableDesignService } = await import('../../services/tableDesignService');
      console.log('📦 Servicio importado exitosamente');
      const designs = await tableDesignService.getAllDesigns();
      console.log('✅ Diseños obtenidos de la base de datos:', designs);
      console.log('📊 Cantidad de diseños encontrados:', designs.length);
      setSavedDesigns(designs);
    } catch (error) {
      console.error('❌ Error cargando diseños:', error);
    } finally {
      setIsLoadingDesigns(false);
    }
  }, []);

  // Cargar un diseño específico
  const handleLoadDesign = useCallback(async (savedDesign: any) => {
    try {
      console.log('📂 Iniciando carga de diseño:', savedDesign);
      
      if (!savedDesign) {
        console.error('❌ No se proporcionó un diseño válido');
        alert('Error: Diseño no válido');
        return;
      }

      console.log('🔍 Validando design_data:', savedDesign.design_data);

      if (!savedDesign.design_data) {
        console.error('❌ El diseño no tiene datos válidos');
        alert('Error: El diseño no contiene datos válidos');
        return;
      }
      
      console.log('🎯 Creando diseño por defecto...');
      const defaultDesign = createDefaultDesign();
      console.log('✅ Diseño por defecto creado:', defaultDesign);
      
      console.log('🔄 Mezclando datos guardados con valores por defecto...');
      // Convertir el design_data del formato guardado al formato del componente
      const loadedDesign = {
        ...defaultDesign,
        // Datos básicos
        id: savedDesign.design_data.id || savedDesign.id || defaultDesign.id,
        name: savedDesign.name || defaultDesign.name,
        description: savedDesign.description || defaultDesign.description,
        // Estructura
        rows: savedDesign.design_data.rows || defaultDesign.rows,
        totalColumns: savedDesign.design_data.totalColumns || defaultDesign.totalColumns,
        // Dimensiones
        defaultCellWidth: savedDesign.design_data.defaultCellWidth || defaultDesign.defaultCellWidth,
        defaultRowHeight: savedDesign.design_data.defaultRowHeight || defaultDesign.defaultRowHeight,
        // Bordes (usar valores guardados si existen, sino usar por defecto)
        borderWidth: savedDesign.design_data.borderWidth !== undefined ? savedDesign.design_data.borderWidth : defaultDesign.borderWidth,
        borderColor: savedDesign.design_data.borderColor || defaultDesign.borderColor,
        borderStyle: savedDesign.design_data.borderStyle || defaultDesign.borderStyle,
        // Espaciado (merge con valores por defecto)
        cellPadding: {
          ...defaultDesign.cellPadding,
          ...(savedDesign.design_data.cellPadding || {})
        },
        cellMargin: {
          ...defaultDesign.cellMargin,
          ...(savedDesign.design_data.cellMargin || {})
        },
        // Fuente (merge con valores por defecto)
        font: {
          ...defaultDesign.font,
          ...(savedDesign.design_data.font || {})
        },
        // Tabla
        tableLayout: savedDesign.design_data.tableLayout || defaultDesign.tableLayout,
        tableMargin: {
          ...defaultDesign.tableMargin,
          ...(savedDesign.design_data.tableMargin || {})
        },
        // Colores
        defaultBackgroundColor: savedDesign.design_data.defaultBackgroundColor || defaultDesign.defaultBackgroundColor,
        defaultTextColor: savedDesign.design_data.defaultTextColor || defaultDesign.defaultTextColor,
        alternateRowColor: savedDesign.design_data.alternateRowColor !== undefined ? savedDesign.design_data.alternateRowColor : defaultDesign.alternateRowColor,
        headerBackgroundColor: savedDesign.design_data.headerBackgroundColor || defaultDesign.headerBackgroundColor,
        headerTextColor: savedDesign.design_data.headerTextColor || defaultDesign.headerTextColor,
        // Timestamps
        created_at: savedDesign.created_at || new Date().toISOString(),
        updated_at: savedDesign.updated_at || new Date().toISOString()
      };
      
      console.log('🎯 Diseño final procesado:', loadedDesign);
      
      console.log('📝 Aplicando diseño al estado...');
      setDesign(loadedDesign);
      
      console.log('✅ Diseño cargado exitosamente en el estado');
      alert(`Diseño "${savedDesign.name}" cargado exitosamente`);
      
    } catch (error) {
      console.error('❌ Error cargando diseño:', error);
      console.error('📋 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      alert('Error cargando diseño: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  }, []);

  // Eliminar un diseño
  const handleDeleteDesign = useCallback(async (designId: string, designName: string) => {
    try {
      const confirmDelete = confirm(`¿Estás seguro de eliminar el diseño "${designName}"?`);
      if (!confirmDelete) return;

      console.log('🗑️ Eliminando diseño:', designId);
      const { tableDesignService } = await import('../../services/tableDesignService');
      await tableDesignService.deleteDesign(designId);
      
      // Refrescar lista de diseños
      await loadSavedDesigns();
      
      console.log('✅ Diseño eliminado exitosamente');
      alert(`Diseño "${designName}" eliminado exitosamente`);
    } catch (error) {
      console.error('❌ Error eliminando diseño:', error);
      alert('Error eliminando diseño: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  }, [loadSavedDesigns]);

  // Cargar diseños al iniciar componente
  useEffect(() => {
    loadSavedDesigns();
  }, [loadSavedDesigns]);

  // Crear diseño por defecto
  function createDefaultDesign(): TableDesign {
    return {
      id: `design_${Date.now()}`,
      name: 'Nuevo Diseño DNGI-03',
      description: 'Diseño personalizado de documento DNGI-03',
      totalColumns: 4,
      defaultCellWidth: 25,
      defaultRowHeight: 40,
      borderWidth: 0.5,
      borderColor: '#000000',
      borderStyle: 'solid',
      cellPadding: {
        top: 3,
        right: 3,
        bottom: 3,
        left: 3
      },
      cellMargin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      font: {
        family: 'Calibri',
        size: 10,
        weight: 'normal',
        style: 'normal'
      },
      tableLayout: 'auto',
      tableMargin: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      },
      defaultBackgroundColor: '#ffffff',
      defaultTextColor: '#000000',
      alternateRowColor: '#f7f7f7',
      headerBackgroundColor: '#4a5568',
      headerTextColor: '#ffffff',
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
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      setSaveMessage({ type: null, text: '' });
      
      console.log('🚀 Iniciando guardado de diseño:', design);
      
      // Validar que el diseño tenga nombre
      if (!design.name.trim()) {
        setSaveMessage({ type: 'error', text: 'Por favor ingresa un nombre para el diseño' });
        return;
      }

      // Preparar datos para guardar
      const saveData = {
        name: design.name,
        description: design.description || `Diseño personalizado creado el ${new Date().toLocaleDateString()}`,
        design_data: {
          id: design.id,
          name: design.name,
          rows: design.rows,
          totalColumns: design.totalColumns,
          defaultCellWidth: design.defaultCellWidth,
          defaultRowHeight: design.defaultRowHeight,
          borderWidth: design.borderWidth,
          borderColor: design.borderColor,
          font: design.font
        },
        category: 'custom'
      };

      console.log('📝 Datos a guardar:', saveData);

      // Importar y usar el servicio
      const { tableDesignService } = await import('../../services/tableDesignService');
      const savedDesign = await tableDesignService.saveDesign(saveData);
      
      console.log('✅ Diseño guardado exitosamente:', savedDesign);
      
      // Refrescar lista de diseños guardados
      await loadSavedDesigns();
      
      // Mostrar mensaje de éxito
      setSaveMessage({ type: 'success', text: `Diseño "${design.name}" guardado exitosamente!` });
      
      // Llamar al callback si existe
      onSave(design);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setSaveMessage({ type: null, text: '' });
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error guardando diseño:', error);
      setSaveMessage({ 
        type: 'error', 
        text: `Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      });
    } finally {
      setIsSaving(false);
    }
  }, [design, onSave, setIsSaving, setSaveMessage, loadSavedDesigns]);

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
                value={design.font?.family || 'Calibri'}
                onChange={(e) => setDesign(prev => ({ 
                  ...prev, 
                  font: { ...(prev.font || { family: 'Calibri', size: 10, weight: 'normal', style: 'normal' }), family: e.target.value }
                }))}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="Calibri">Calibri</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Georgia">Georgia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tamaño fuente:</label>
              <input
                type="number"
                min="6"
                max="24"
                value={design.font?.size || 10}
                onChange={(e) => setDesign(prev => ({ 
                  ...prev, 
                  font: { ...(prev.font || { family: 'Calibri', size: 10, weight: 'normal', style: 'normal' }), size: parseInt(e.target.value) }
                }))}
                className="w-full p-2 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Peso fuente:</label>
              <select
                value={design.font?.weight || 'normal'}
                onChange={(e) => setDesign(prev => ({ 
                  ...prev, 
                  font: { ...(prev.font || { family: 'Calibri', size: 10, weight: 'normal', style: 'normal' }), weight: e.target.value as any }
                }))}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="normal">Normal</option>
                <option value="bold">Negrita</option>
                <option value="lighter">Ligero</option>
                <option value="bolder">Muy negrita</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estilo fuente:</label>
              <select
                value={design.font?.style || 'normal'}
                onChange={(e) => setDesign(prev => ({ 
                  ...prev, 
                  font: { ...(prev.font || { family: 'Calibri', size: 10, weight: 'normal', style: 'normal' }), style: e.target.value as any }
                }))}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="normal">Normal</option>
                <option value="italic">Cursiva</option>
                <option value="oblique">Oblicua</option>
              </select>
            </div>

            {/* Configuración de Bordes */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-800 mb-3">🔲 Configuración de Bordes</h4>
              
              <div>
                <label className="block text-sm font-medium mb-1">Grosor borde:</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={design.borderWidth}
                  onChange={(e) => setDesign(prev => ({ 
                    ...prev, 
                    borderWidth: parseFloat(e.target.value)
                  }))}
                  className="w-full p-2 border rounded text-sm"
                />
                <span className="text-xs text-gray-500">px (0.1 = muy fino como Word)</span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Color borde:</label>
                <input
                  type="color"
                  value={design.borderColor}
                  onChange={(e) => setDesign(prev => ({ 
                    ...prev, 
                    borderColor: e.target.value
                  }))}
                  className="w-full p-1 border rounded h-10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estilo borde:</label>
                <select
                  value={design.borderStyle}
                  onChange={(e) => setDesign(prev => ({ 
                    ...prev, 
                    borderStyle: e.target.value as any
                  }))}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="solid">Sólido</option>
                  <option value="dashed">Discontinuo</option>
                  <option value="dotted">Punteado</option>
                  <option value="none">Sin borde</option>
                </select>
              </div>
            </div>

            {/* Configuración de Espaciado */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-800 mb-3">📏 Espaciado de Celdas</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Arriba:</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={design.cellPadding?.top || 3}
                    onChange={(e) => setDesign(prev => ({ 
                      ...prev, 
                      cellPadding: { ...(prev.cellPadding || { top: 3, right: 3, bottom: 3, left: 3 }), top: parseInt(e.target.value) }
                    }))}
                    className="w-full p-1 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Abajo:</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={design.cellPadding?.bottom || 3}
                    onChange={(e) => setDesign(prev => ({ 
                      ...prev, 
                      cellPadding: { ...(prev.cellPadding || { top: 3, right: 3, bottom: 3, left: 3 }), bottom: parseInt(e.target.value) }
                    }))}
                    className="w-full p-1 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Izquierda:</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={design.cellPadding?.left || 3}
                    onChange={(e) => setDesign(prev => ({ 
                      ...prev, 
                      cellPadding: { ...(prev.cellPadding || { top: 3, right: 3, bottom: 3, left: 3 }), left: parseInt(e.target.value) }
                    }))}
                    className="w-full p-1 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Derecha:</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={design.cellPadding?.right || 3}
                    onChange={(e) => setDesign(prev => ({ 
                      ...prev, 
                      cellPadding: { ...(prev.cellPadding || { top: 3, right: 3, bottom: 3, left: 3 }), right: parseInt(e.target.value) }
                    }))}
                    className="w-full p-1 border rounded text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Configuración de Colores */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-800 mb-3">🎨 Colores por Defecto</h4>
              
              <div>
                <label className="block text-sm font-medium mb-1">Fondo celda:</label>
                <input
                  type="color"
                  value={design.defaultBackgroundColor}
                  onChange={(e) => setDesign(prev => ({ 
                    ...prev, 
                    defaultBackgroundColor: e.target.value
                  }))}
                  className="w-full p-1 border rounded h-8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Texto celda:</label>
                <input
                  type="color"
                  value={design.defaultTextColor}
                  onChange={(e) => setDesign(prev => ({ 
                    ...prev, 
                    defaultTextColor: e.target.value
                  }))}
                  className="w-full p-1 border rounded h-8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fondo encabezado:</label>
                <input
                  type="color"
                  value={design.headerBackgroundColor}
                  onChange={(e) => setDesign(prev => ({ 
                    ...prev, 
                    headerBackgroundColor: e.target.value
                  }))}
                  className="w-full p-1 border rounded h-8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Texto encabezado:</label>
                <input
                  type="color"
                  value={design.headerTextColor}
                  onChange={(e) => setDesign(prev => ({ 
                    ...prev, 
                    headerTextColor: e.target.value
                  }))}
                  className="w-full p-1 border rounded h-8"
                />
              </div>
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
                disabled={isSaving || !design.name.trim()}
                className={`px-4 py-2 rounded transition-all ${
                  isSaving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white`}
              >
                {isSaving ? '⏳ Guardando...' : '💾 Guardar Diseño'}
              </button>
            </div>
          </div>

          {/* Mensaje de estado */}
          {saveMessage.type && (
            <div className={`mb-4 p-3 rounded-lg ${
              saveMessage.type === 'success' 
                ? 'bg-green-100 border border-green-400 text-green-700' 
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              <div className="flex items-center">
                <span className="mr-2">
                  {saveMessage.type === 'success' ? '✅' : '❌'}
                </span>
                <span>{saveMessage.text}</span>
              </div>
            </div>
          )}

          {/* Diseños guardados */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-700">
                📚 Diseños Guardados ({savedDesigns.length})
              </h3>
              <button
                onClick={() => setShowSavedDesigns(!showSavedDesigns)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                {showSavedDesigns ? '🔼 Ocultar' : '🔽 Mostrar'}
              </button>
            </div>
            
            {showSavedDesigns && (
              <div className="bg-gray-50 border rounded-lg p-3 max-h-32 overflow-y-auto">
                {isLoadingDesigns ? (
                  <div className="text-center text-gray-500">
                    ⏳ Cargando diseños...
                  </div>
                ) : savedDesigns.length === 0 ? (
                  <div className="text-center text-gray-500">
                    📝 No hay diseños guardados
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {savedDesigns.map((savedDesign) => (
                      <div
                        key={savedDesign.id}
                        className="flex items-center justify-between bg-white p-2 rounded border hover:bg-blue-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{savedDesign.name}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(savedDesign.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleLoadDesign(savedDesign)}
                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                            title="Cargar diseño"
                          >
                            📂
                          </button>
                          <button
                            onClick={() => handleDeleteDesign(savedDesign.id, savedDesign.name)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            title="Eliminar diseño"
                          >
                            �️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabla editable */}
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <table 
              ref={tableRef}
              className="w-full border-collapse"
              style={{ 
                fontFamily: design.font?.family || 'Calibri',
                fontSize: `${design.font?.size || 10}px`
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