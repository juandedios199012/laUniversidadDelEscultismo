import { useState, useRef, useEffect } from 'react';
import { Users, Image, Type, Bold, Italic, Palette, Save, Eye, Code } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';

export default function LibroOro() {
  const [formData, setFormData] = useState({
    patrulla: '',
    relatores: [] as string[],
    fecha: '',
    foto: null as File | null,
    contenido: ''
  });

  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [showColorPalette, setShowColorPalette] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sincronizar contenido cuando se cambia del modo código al visual
  useEffect(() => {
    if (editorMode === 'visual' && editorRef.current && formData.contenido) {
      const htmlContent = markdownToHtml(formData.contenido);
      if (editorRef.current.innerHTML !== htmlContent) {
        editorRef.current.innerHTML = htmlContent;
      }
    }
  }, [editorMode, formData.contenido]);

  // Cerrar paleta de colores al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColorPalette) {
        const target = event.target as Element;
        if (!target.closest('.color-palette-container')) {
          setShowColorPalette(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPalette]);

  // Funciones del editor visual
  const applyFormat = (format: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    document.execCommand(format, false, undefined);
    if (editorRef.current) {
      updateContentFromEditor();
    }
  };

  const updateContentFromEditor = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // Convertir HTML a texto con formato markdown para almacenamiento
      const markdownText = htmlToMarkdown(html);
      setFormData(prev => ({ ...prev, contenido: markdownText }));
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      // Actualizar el contenido sin perder la posición del cursor
      const html = editorRef.current.innerHTML;
      const markdownText = htmlToMarkdown(html);
      setFormData(prev => ({ ...prev, contenido: markdownText }));
    }
  };

  const htmlToMarkdown = (html: string): string => {
    return html
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<b>(.*?)<\/b>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<i>(.*?)<\/i>/g, '*$1*')
      .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1')
      .replace(/<li[^>]*>(.*?)<\/li>/g, '- $1')
      .replace(/<font[^>]*color[^>]*>(.*?)<\/font>/g, '$1') // Simplificar colores para markdown
      .replace(/<span[^>]*style[^>]*color[^>]*>(.*?)<\/span>/g, '$1') // Simplificar colores inline
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<div[^>]*>/g, '\n')
      .replace(/<\/div>/g, '')
      .replace(/<ul[^>]*>/g, '\n')
      .replace(/<\/ul>/g, '\n')
      .replace(/<[^>]*>/g, '') // Eliminar cualquier otro tag HTML
      .trim();
  };

  const markdownToHtml = (markdown: string): string => {
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gm, '<h3 style="color: #2563eb; font-size: 1.2em; font-weight: bold; margin: 10px 0;">$1</h3>')
      .replace(/^- (.*$)/gm, '<li style="margin-left: 20px; list-style-type: disc;">$1</li>')
      .replace(/\n/g, '<br>');
  };

  const formatBold = () => applyFormat('bold');
  const formatItalic = () => applyFormat('italic');
  
  const formatHeading = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      // Si hay texto seleccionado, aplicar formato de título
      document.execCommand('formatBlock', false, 'h3');
    } else {
      // Si no hay selección, insertar un título de ejemplo
      document.execCommand('insertHTML', false, '<h3>Título de sección</h3>');
    }
    updateContentFromEditor();
  };
  
  const insertList = () => {
    document.execCommand('insertUnorderedList', false, undefined);
    updateContentFromEditor();
  };

  const applyTextColor = (color: string) => {
    document.execCommand('foreColor', false, color);
    updateContentFromEditor();
  };

  // Colores predefinidos para la paleta
  const colorPalette = [
    '#000000', // Negro
    '#2563eb', // Azul Scout
    '#059669', // Verde Scout
    '#dc2626', // Rojo
    '#d97706', // Naranja/Dorado
    '#7c3aed', // Púrpura
    '#059669', // Verde
    '#64748b'  // Gris
  ];

  const [entries, setEntries] = useState([
    {
      id: 1,
      patrulla: 'Patrulla Fénix',
      fecha: '2024-01-15',
      relatores: ['Juan Pérez', 'María González'],
      contenido: 'Hoy fue un día increíble en nuestro campamento de verano. Aprendimos a hacer nudos marineros y construimos una torre de 3 metros usando técnicas de pionerismo. La Patrulla Águila nos ganó por 2 puntos, pero estamos orgullosos de nuestro trabajo en equipo.',
      fotos: 2
    },
    {
      id: 2,
      patrulla: 'Patrulla Águila',
      fecha: '2024-01-14',
      relatores: ['Pedro López'],
      contenido: 'Nuestro primer día de campamento estuvo lleno de aventuras. Instalamos las carpas bajo la lluvia, pero eso no impidió que mantuviéramos el ánimo en alto. Cantamos canciones alrededor de la fogata y compartimos historias scout.',
      fotos: 1
    }
  ]);

  const patrullas = [
    { value: 'fenix', label: 'Patrulla Fénix' },
    { value: 'aguila', label: 'Patrulla Águila' },
    { value: 'condor', label: 'Patrulla Cóndor' },
    { value: 'jaguar', label: 'Patrulla Jaguar' }
  ];

  const handleSave = () => {
    const newEntry = {
      id: entries.length + 1,
      ...formData,
      fotos: formData.foto ? 1 : 0
    };
    setEntries([newEntry, ...entries]);
    setFormData({
      patrulla: '',
      relatores: [] as string[],
      fecha: '',
      foto: null as File | null,
      contenido: ''
    });
  };

  return (
    <div className="gaming-container">
      <div className="gaming-header">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
          📚 Libro de Oro
        </h1>
        <p className="text-xl text-gray-300">Registro de memorias, anécdotas y experiencias de cada patrulla</p>
      </div>

      {/* Nueva Entrada */}
      <div className="gaming-card mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          ✨ Nueva Entrada
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <FormField label="Patrulla">
            <Select
              value={formData.patrulla}
              onChange={(e) => setFormData(prev => ({ ...prev, patrulla: e.target.value }))}
              options={patrullas}
              placeholder="Seleccionar patrulla"
            />
          </FormField>

          <FormField label="Fecha">
            <Input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
            />
          </FormField>

          <FormField label="Relatores">
            <Input
              value={formData.relatores.join(', ')}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                relatores: e.target.value.split(', ').filter(r => r.trim()) 
              }))}
              placeholder="Nombres separados por comas"
            />
          </FormField>
        </div>

        <FormField label="Fotografía" className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">Arrastra una imagen aquí o haz clic para seleccionar</p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="foto-upload"
              onChange={(e) => setFormData(prev => ({ ...prev, foto: e.target.files?.[0] || null }))}
            />
            <label
              htmlFor="foto-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              Seleccionar archivo
            </label>
          </div>
        </FormField>

        <FormField label="Contenido">
          <div className="border border-gray-300 rounded-lg">
            {/* Editor Toolbar */}
            <div className="border-b border-gray-200 p-3 flex items-center justify-between bg-gray-50 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <button 
                  type="button"
                  onClick={formatBold}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                  title="Negrita"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={formatItalic}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                  title="Cursiva"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <button 
                  type="button"
                  onClick={formatHeading}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                  title="Título (H3)"
                >
                  <Type className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={insertList}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                  title="Lista con viñetas"
                >
                  • List
                </button>
                <div className="relative color-palette-container">
                  <button 
                    type="button"
                    onClick={() => setShowColorPalette(!showColorPalette)}
                    className={`p-2 rounded transition-colors ${
                      showColorPalette 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                    }`}
                    title="Colores de texto"
                  >
                    <Palette className="w-4 h-4" />
                  </button>
                  
                  {/* Paleta de colores */}
                  {showColorPalette && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                      <div className="grid grid-cols-4 gap-1">
                        {colorPalette.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              applyTextColor(color);
                              setShowColorPalette(false);
                            }}
                            className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={`Aplicar color ${color}`}
                          />
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            applyTextColor('#000000');
                            setShowColorPalette(false);
                          }}
                          className="text-xs text-gray-600 hover:text-gray-800 w-full text-center"
                        >
                          Remover color
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Modo:</span>
                <button
                  type="button"
                  onClick={() => setEditorMode('visual')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    editorMode === 'visual' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  Visual
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('code')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    editorMode === 'code' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Code className="w-4 h-4 inline mr-1" />
                  Código
                </button>
              </div>
            </div>
            
            {/* Editor Visual o Código */}
            {editorMode === 'visual' ? (
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                suppressContentEditableWarning={true}
                className="w-full p-4 min-h-[200px] focus:outline-none rounded-b-lg border-none"
                style={{ 
                  minHeight: '200px',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  const target = e.target as HTMLDivElement;
                  if (target.textContent === '' && !formData.contenido) {
                    target.innerHTML = '';
                  }
                }}
                onBlur={(e) => {
                  const target = e.target as HTMLDivElement;
                  if (target.textContent === '') {
                    target.innerHTML = '<span style="color: #9ca3af;">Escribe aquí las memorias, anécdotas y experiencias de la patrulla...</span>';
                  }
                }}
              >
                {!formData.contenido && (
                  <span style={{ color: '#9ca3af' }}>
                    Escribe aquí las memorias, anécdotas y experiencias de la patrulla...
                  </span>
                )}
              </div>
            ) : (
              /* Editor de Código Markdown */
              <textarea
                ref={textareaRef}
                rows={8}
                value={formData.contenido}
                onChange={(e) => setFormData(prev => ({ ...prev, contenido: e.target.value }))}
                placeholder="Escribe aquí usando markdown: **negrita**, *cursiva*, ### títulos, - listas"
                className="w-full p-4 resize-none focus:outline-none rounded-b-lg font-mono text-sm bg-gray-50"
              />
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            <strong>💡 Modo Visual:</strong> 
            <span className="ml-1">
              Use <strong>negrita</strong>, <em>cursiva</em>, 
              <span className="mx-1">📝 títulos</span>, 
              • listas y 
              <span className="mx-1">🎨 colores</span>. 
              Modo Código muestra el markdown.
            </span>
          </p>
        </FormField>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={!formData.patrulla || !formData.fecha || !formData.contenido}
            className="gaming-btn primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Entrada</span>
          </button>
        </div>
      </div>

      {/* Entradas Existentes */}
      <div className="gaming-card">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📖 Entradas Recientes</h2>
        
        {entries.map((entry) => (
          <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{entry.patrulla}</h3>
                <span className="text-sm text-gray-600">{entry.fecha}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>Relatores: {entry.relatores.join(', ')}</span>
                </span>
                {entry.fotos > 0 && (
                  <span className="flex items-center space-x-1">
                    <Image className="w-4 h-4" />
                    <span>{entry.fotos} foto{entry.fotos > 1 ? 's' : ''}</span>
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(entry.contenido) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}