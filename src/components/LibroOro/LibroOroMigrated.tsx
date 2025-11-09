import { useState, useRef, useEffect } from 'react';
import { Users, Image, Type, Bold, Italic, Palette, Save, Eye, Code, BookOpen, Calendar, Hash, TrendingUp } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';
import { ScoutService } from '../../services/scoutService';
import type { Patrulla } from '../../lib/supabase';

interface FormularioEntrada {
  patrulla_id: string;
  fecha: string;
  titulo?: string;
  contenido: string;
  relatores: string[];
  fotos_urls?: string[];
}

interface EntradaLibroOro {
  id: string;
  patrulla_id: string;
  fecha: string;
  titulo?: string;
  contenido: string;
  relatores: string[];
  fotos_urls: string[];
  created_at: string;
  patrullas?: {
    nombre: string;
  };
}

export default function LibroOroMigrated() {
  const [formData, setFormData] = useState<FormularioEntrada>({
    patrulla_id: '',
    fecha: new Date().toISOString().split('T')[0],
    titulo: '',
    contenido: '',
    relatores: [],
    fotos_urls: []
  });

  const [patrullas, setPatrullas] = useState<Patrulla[]>([]);
  const [entradas, setEntradas] = useState<EntradaLibroOro[]>([]);
  const [estadisticas, setEstadisticas] = useState<{
    total_entradas: number;
    entradas_mes: number;
    por_patrulla: Record<string, number>;
    relatores_activos: number;
  }>({
    total_entradas: 0,
    entradas_mes: 0,
    por_patrulla: {},
    relatores_activos: 0
  });

  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [patrullasData, entradasData, estadisticasData] = await Promise.all([
        ScoutService.getAllPatrullas(),
        ScoutService.getEntradasLibroOro(20), // Últimas 20 entradas
        ScoutService.getEstadisticasLibroOro()
      ]);

      setPatrullas(patrullasData.filter(p => p.estado === 'activa'));
      setEntradas(entradasData);
      setEstadisticas(estadisticasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos del libro de oro');
    } finally {
      setLoading(false);
    }
  };

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
      const markdownText = htmlToMarkdown(html);
      setFormData(prev => ({ ...prev, contenido: markdownText }));
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
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
      .replace(/<font[^>]*color[^>]*>(.*?)<\/font>/g, '$1')
      .replace(/<span[^>]*style[^>]*color[^>]*>(.*?)<\/span>/g, '$1')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<div[^>]*>/g, '\n')
      .replace(/<\/div>/g, '')
      .replace(/<ul[^>]*>/g, '\n')
      .replace(/<\/ul>/g, '\n')
      .replace(/<[^>]*>/g, '')
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
      document.execCommand('formatBlock', false, 'h3');
    } else {
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

  const colorPalette = [
    '#000000', '#2563eb', '#059669', '#dc2626',
    '#d97706', '#7c3aed', '#059669', '#64748b'
  ];

  const handleSave = async () => {
    if (!formData.patrulla_id || !formData.fecha || !formData.contenido) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await ScoutService.createEntradaLibroOro({
        patrulla_id: formData.patrulla_id,
        fecha: formData.fecha,
        titulo: formData.titulo,
        contenido: formData.contenido,
        relatores: formData.relatores,
        fotos_urls: formData.fotos_urls || []
      });

      await cargarDatos();
      
      setFormData({
        patrulla_id: '',
        fecha: new Date().toISOString().split('T')[0],
        titulo: '',
        contenido: '',
        relatores: [],
        fotos_urls: []
      });

      // Limpiar editor
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    } catch (error) {
      console.error('Error al guardar entrada:', error);
      setError('Error al guardar la entrada del libro de oro');
    } finally {
      setLoading(false);
    }
  };

  const handleRelatoresChange = (value: string) => {
    const relatoresArray = value.split(',').map(r => r.trim()).filter(r => r);
    setFormData(prev => ({ ...prev, relatores: relatoresArray }));
  };

  if (loading && entradas.length === 0) {
    return (
      <div className="gaming-container">
        <div className="gaming-header">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
            <BookOpen className="w-10 h-10" />
            📚 Libro de Oro
          </h1>
        </div>
        <div className="gaming-card">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Cargando libro de oro...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gaming-container">
      <div className="gaming-header">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
          <BookOpen className="w-10 h-10" />
          📚 Libro de Oro
        </h1>
        <p className="text-xl text-gray-300">Registro de memorias, anécdotas y experiencias de cada patrulla</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Total Entradas</h3>
              <p className="text-3xl font-bold text-white">{estadisticas.total_entradas}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Este Mes</h3>
              <p className="text-3xl font-bold text-white">{estadisticas.entradas_mes}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Relatores Activos</h3>
              <p className="text-3xl font-bold text-white">{estadisticas.relatores_activos}</p>
            </div>
            <Users className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Más Activa</h3>
              <p className="text-lg font-bold text-white">
                {Object.entries(estadisticas.por_patrulla).length > 0 
                  ? Object.entries(estadisticas.por_patrulla).reduce((a, b) => a[1] > b[1] ? a : b)[0]
                  : 'N/A'
                }
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Nueva Entrada */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          ✨ Nueva Entrada
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <FormField label="Patrulla" required>
            <Select
              value={formData.patrulla_id}
              onChange={(e) => setFormData(prev => ({ ...prev, patrulla_id: e.target.value }))}
              options={[
                { value: '', label: 'Seleccionar patrulla' },
                ...patrullas.map(p => ({ value: p.id, label: p.nombre }))
              ]}
            />
          </FormField>

          <FormField label="Fecha" required>
            <Input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
            />
          </FormField>

          <FormField label="Título (Opcional)">
            <Input
              type="text"
              value={formData.titulo || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ej: Campamento de verano 2024"
            />
          </FormField>

          <div className="md:col-span-3">
            <FormField label="Relatores" required>
              <Input
                value={formData.relatores.join(', ')}
                onChange={(e) => handleRelatoresChange(e.target.value)}
                placeholder="Nombres separados por comas"
              />
            </FormField>
          </div>
        </div>

        <FormField label="Contenido" required>
          <div className="border border-white/20 rounded-lg">
            {/* Editor Toolbar */}
            <div className="border-b border-white/20 p-3 flex items-center justify-between bg-white/5 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <button 
                  type="button"
                  onClick={formatBold}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                  title="Negrita"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={formatItalic}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                  title="Cursiva"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-white/20 mx-2"></div>
                <button 
                  type="button"
                  onClick={formatHeading}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                  title="Título (H3)"
                >
                  <Type className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={insertList}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                  title="Lista con viñetas"
                >
                  <Hash className="w-4 h-4" />
                </button>
                <div className="relative color-palette-container">
                  <button 
                    type="button"
                    onClick={() => setShowColorPalette(!showColorPalette)}
                    className={`p-2 rounded transition-colors ${
                      showColorPalette 
                        ? 'bg-blue-500/20 text-blue-300' 
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                    title="Colores de texto"
                  >
                    <Palette className="w-4 h-4" />
                  </button>
                  
                  {showColorPalette && (
                    <div className="absolute top-full left-0 mt-1 bg-white/90 backdrop-blur border border-white/20 rounded-lg shadow-lg p-2 z-10">
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
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white/60">Modo:</span>
                <button
                  type="button"
                  onClick={() => setEditorMode('visual')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    editorMode === 'visual' 
                      ? 'bg-blue-500/20 text-blue-300' 
                      : 'text-white/60 hover:bg-white/10'
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
                      ? 'bg-blue-500/20 text-blue-300' 
                      : 'text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Code className="w-4 h-4 inline mr-1" />
                  Código
                </button>
              </div>
            </div>
            
            {editorMode === 'visual' ? (
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                suppressContentEditableWarning={true}
                className="w-full p-4 min-h-[200px] focus:outline-none rounded-b-lg border-none text-white bg-white/5"
                style={{ minHeight: '200px', outline: 'none' }}
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
              <textarea
                ref={textareaRef}
                rows={8}
                value={formData.contenido}
                onChange={(e) => setFormData(prev => ({ ...prev, contenido: e.target.value }))}
                placeholder="Escribe aquí usando markdown: **negrita**, *cursiva*, ### títulos, - listas"
                className="w-full p-4 resize-none focus:outline-none rounded-b-lg font-mono text-sm bg-white/5 text-white placeholder-white/50"
              />
            )}
          </div>
          <p className="text-sm text-white/60 mt-2">
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
            disabled={loading || !formData.patrulla_id || !formData.fecha || !formData.contenido}
            className="gaming-btn primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Guardando...' : 'Guardar Entrada'}</span>
          </button>
        </div>
      </div>

      {/* Entradas Existentes */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">📖 Entradas Recientes</h2>
        
        {entradas.length === 0 && !loading && (
          <div className="text-center py-8 text-white/60">
            No hay entradas registradas. ¡Crea la primera entrada del libro de oro!
          </div>
        )}

        {entradas.map((entrada) => (
          <div key={entrada.id} className="backdrop-blur-md bg-white/5 rounded-xl border border-white/10 overflow-hidden mb-6">
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">
                  {entrada.titulo || entrada.patrullas?.nombre || 'Entrada sin título'}
                </h3>
                <span className="text-sm text-white/70">
                  {new Date(entrada.fecha).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-white/70">
                <span className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>Relatores: {entrada.relatores.join(', ')}</span>
                </span>
                {entrada.patrullas && (
                  <span className="flex items-center space-x-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{entrada.patrullas.nombre}</span>
                  </span>
                )}
                {entrada.fotos_urls && entrada.fotos_urls.length > 0 && (
                  <span className="flex items-center space-x-1">
                    <Image className="w-4 h-4" />
                    <span>{entrada.fotos_urls.length} foto{entrada.fotos_urls.length > 1 ? 's' : ''}</span>
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div 
                className="text-white/90 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(entrada.contenido) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}