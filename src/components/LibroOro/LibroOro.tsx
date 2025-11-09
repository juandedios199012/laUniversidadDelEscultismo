import { useState, useEffect } from 'react';
import { BookOpen, Star, Save, Plus, Search, Edit, Eye, Calendar, Trophy, Award, X, Trash2, AlertCircle, MapPin, Users } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';
import { supabase } from '../../lib/supabase';
import type { LibroOroEntry } from '../../lib/supabase';

interface FormularioLibroOro {
  titulo: string;
  fecha: string;
  patrulla: string;
  rama: string;
  tipo_logro: string;
  logro: string;
  descripcion: string;
  relatores: string;
  reconocimiento: string;
  participantes: string;
  lugar: string;
  dirigente_responsable: string;
  evidencias: string;
  impacto: string;
}

export default function LibroOroComplete() {
  const [entries, setEntries] = useState<LibroOroEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para modales
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LibroOroEntry | null>(null);

  const [formData, setFormData] = useState<FormularioLibroOro>({
    titulo: '',
    fecha: new Date().toISOString().split('T')[0],
    patrulla: '',
    rama: '',
    tipo_logro: '',
    logro: '',
    descripcion: '',
    relatores: '',
    reconocimiento: 'Oro',
    participantes: '',
    lugar: '',
    dirigente_responsable: '',
    evidencias: '',
    impacto: ''
  });

  const [filtros, setFiltros] = useState({
    reconocimiento: '',
    tipo: '',
    patrulla: '',
    busqueda: ''
  });

  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    este_ano: 0,
    por_reconocimiento: {} as Record<string, number>,
    por_tipo: {} as Record<string, number>,
    por_patrulla: {} as Record<string, number>
  });

  // Opciones para selects
  const patrullas = [
    { value: '', label: 'Todas las patrullas' },
    { value: 'Lobos', label: 'Lobos Grises' },
    { value: 'Águilas', label: 'Águilas Doradas' },
    { value: 'Leones', label: 'Leones Valientes' },
    { value: 'Castores', label: 'Castores Trabajadores' },
    { value: 'Cóndores', label: 'Cóndores Majestuosos' },
    { value: 'Pumas', label: 'Pumas Ágiles' }
  ];

  const ramas = [
    { value: '', label: 'Todas las ramas' },
    { value: 'manada', label: '🐺 Manada' },
    { value: 'tropa', label: '🦅 Tropa' },
    { value: 'caminante', label: '🥾 Caminante' },
    { value: 'clan', label: '🚀 Clan' },
    { value: 'grupo', label: '🌟 Grupo Scout' }
  ];

  const tiposLogro = [
    { value: 'Campamento', label: 'Campamento' },
    { value: 'Servicio Comunitario', label: 'Servicio Comunitario' },
    { value: 'Competencia', label: 'Competencia' },
    { value: 'Liderazgo', label: 'Liderazgo' },
    { value: 'Ceremonia', label: 'Ceremonia' },
    { value: 'Proyecto Especial', label: 'Proyecto Especial' },
    { value: 'Reconocimiento', label: 'Reconocimiento' },
    { value: 'Otro', label: 'Otro' }
  ];

  const reconocimientos = [
    { value: '', label: 'Todos los reconocimientos' },
    { value: 'Oro', label: 'Oro' },
    { value: 'Plata', label: 'Plata' },
    { value: 'Bronce', label: 'Bronce' },
    { value: 'Especial', label: 'Especial' }
  ];

  // Efectos
  useEffect(() => {
    cargarDatos();
  }, []);

  // Funciones de carga de datos
  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Obtener registros directamente de la tabla libro_oro
      const { data: entriesData, error: entriesError } = await supabase
        .from('libro_oro')
        .select('*')
        .order('fecha', { ascending: false });

      if (entriesError) throw entriesError;

      setEntries(entriesData || []);
      
      // Calcular estadísticas básicas desde los datos
      const total = entriesData?.length || 0;
      const currentYear = new Date().getFullYear();
      const este_ano = entriesData?.filter(entry => 
        new Date(entry.fecha).getFullYear() === currentYear
      ).length || 0;

      // Agrupar por tipo de logro
      const por_tipo = entriesData?.reduce((acc, entry) => {
        acc[entry.tipo_logro] = (acc[entry.tipo_logro] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Agrupar por reconocimiento
      const por_reconocimiento = entriesData?.reduce((acc, entry) => {
        acc[entry.reconocimiento] = (acc[entry.reconocimiento] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Agrupar por patrulla
      const por_patrulla = entriesData?.reduce((acc, entry) => {
        if (entry.patrulla) {
          acc[entry.patrulla] = (acc[entry.patrulla] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};
      
      const estadisticasAdaptadas = {
        total,
        este_ano,
        por_reconocimiento,
        por_tipo,
        por_patrulla
      };
      
      setEstadisticas(estadisticasAdaptadas);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos del Libro de Oro');
    } finally {
      setLoading(false);
    }
  };

  // Funciones del formulario
  const handleInputChange = (field: keyof FormularioLibroOro, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFiltroChange = (field: string, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
  };

  const limpiarFormulario = () => {
    setFormData({
      titulo: '',
      fecha: new Date().toISOString().split('T')[0],
      patrulla: '',
      rama: '',
      tipo_logro: '',
      logro: '',
      descripcion: '',
      relatores: '',
      reconocimiento: 'Oro',
      participantes: '',
      lugar: '',
      dirigente_responsable: '',
      evidencias: '',
      impacto: ''
    });
    setError(null);
  };

  const validarFormulario = (): string | null => {
    if (!formData.titulo.trim()) return 'El título es obligatorio';
    if (!formData.fecha) return 'La fecha es obligatoria';
    if (!formData.tipo_logro) return 'El tipo de logro es obligatorio';
    if (!formData.logro.trim()) return 'El logro es obligatorio';
    if (!formData.descripcion.trim()) return 'La descripción es obligatoria';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const entryData = {
        titulo: formData.titulo.trim(),
        fecha: formData.fecha,
        patrulla: formData.patrulla || undefined,
        rama: formData.rama || undefined,
        tipo_logro: formData.tipo_logro,
        logro: formData.logro.trim(),
        descripcion: formData.descripcion.trim(),
        relatores: formData.relatores.trim() || undefined,
        reconocimiento: formData.reconocimiento,
        participantes: formData.participantes.trim() || undefined,
        lugar: formData.lugar.trim() || undefined,
        dirigente_responsable: formData.dirigente_responsable.trim() || undefined,
        evidencias: formData.evidencias.trim() || undefined,
        impacto: formData.impacto.trim() || undefined
      };

      const { error } = await supabase
        .from('libro_oro')
        .insert([entryData]);

      if (error) throw error;

      // Recargar datos
      await cargarDatos();
      
      // Limpiar formulario y cerrar
      limpiarFormulario();
      setShowAddForm(false);

    } catch (error: any) {
      console.error('Error al guardar entrada:', error);
      setError(error.message || 'Error al guardar la entrada en el Libro de Oro');
    } finally {
      setLoading(false);
    }
  };

  // Funciones CRUD
  const handleCreateEntry = () => {
    limpiarFormulario();
    setShowAddForm(true);
  };

  const handleEditEntry = (entry: LibroOroEntry) => {
    setSelectedEntry(entry);
    setFormData({
      titulo: entry.titulo,
      fecha: entry.fecha,
      patrulla: entry.patrulla || '',
      rama: entry.rama || '',
      tipo_logro: entry.tipo_logro,
      logro: entry.logro,
      descripcion: entry.descripcion,
      relatores: entry.relatores || '',
      reconocimiento: entry.reconocimiento,
      participantes: entry.participantes || '',
      lugar: entry.lugar || '',
      dirigente_responsable: entry.dirigente_responsable || '',
      evidencias: entry.evidencias || '',
      impacto: entry.impacto || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateEntry = async () => {
    if (!selectedEntry) return;

    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const entryData = {
        titulo: formData.titulo.trim(),
        fecha: formData.fecha,
        patrulla: formData.patrulla || undefined,
        rama: formData.rama || undefined,
        tipo_logro: formData.tipo_logro,
        logro: formData.logro.trim(),
        descripcion: formData.descripcion.trim(),
        relatores: formData.relatores.trim() || undefined,
        reconocimiento: formData.reconocimiento,
        participantes: formData.participantes.trim() || undefined,
        lugar: formData.lugar.trim() || undefined,
        dirigente_responsable: formData.dirigente_responsable.trim() || undefined,
        evidencias: formData.evidencias.trim() || undefined,
        impacto: formData.impacto.trim() || undefined
      };

      const { error } = await supabase
        .from('libro_oro')
        .update(entryData)
        .eq('id', selectedEntry.id);

      if (error) throw error;

      await cargarDatos();
      
      setShowEditModal(false);
      setSelectedEntry(null);
      limpiarFormulario();

    } catch (error: any) {
      console.error('Error al actualizar entrada:', error);
      setError(error.message || 'Error al actualizar la entrada');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = (entry: LibroOroEntry) => {
    setSelectedEntry(entry);
    setShowDeleteModal(true);
  };

  const confirmDeleteEntry = async () => {
    if (!selectedEntry) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('libro_oro')
        .delete()
        .eq('id', selectedEntry.id);

      if (error) throw error;

      await cargarDatos();
      
      setShowDeleteModal(false);
      setSelectedEntry(null);

    } catch (error: any) {
      console.error('Error al eliminar entrada:', error);
      setError(error.message || 'Error al eliminar la entrada');
    } finally {
      setLoading(false);
    }
  };

  const handleViewEntry = (entry: LibroOroEntry) => {
    setSelectedEntry(entry);
    setShowViewModal(true);
  };

  // Funciones de utilidad
  const getReconocimientoColor = (reconocimiento: string) => {
    const colores = {
      'Oro': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Plata': 'bg-gray-100 text-gray-800 border-gray-300',
      'Bronce': 'bg-orange-100 text-orange-800 border-orange-300',
      'Especial': 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colores[reconocimiento as keyof typeof colores] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getTipoIcon = (tipo: string) => {
    const iconos = {
      'Campamento': <MapPin className="w-4 h-4" />,
      'Servicio Comunitario': <Users className="w-4 h-4" />,
      'Competencia': <Trophy className="w-4 h-4" />,
      'Liderazgo': <Award className="w-4 h-4" />,
      'Ceremonia': <Star className="w-4 h-4" />,
      'Proyecto Especial': <Star className="w-4 h-4" />,
      'Reconocimiento': <Award className="w-4 h-4" />
    };
    return iconos[tipo as keyof typeof iconos] || <BookOpen className="w-4 h-4" />;
  };

  const obtenerIconoRama = (rama: string): string => {
    const iconos = {
      manada: '🐺',
      tropa: '🦅',
      caminante: '🥾',
      clan: '🚀',
      grupo: '🌟'
    };
    return iconos[rama as keyof typeof iconos] || '📋';
  };

  // Filtrar entradas
  const entriesFiltradas = entries.filter(entry => {
    const cumpleBusqueda = !filtros.busqueda || 
      entry.titulo.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      entry.descripcion.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      entry.logro.toLowerCase().includes(filtros.busqueda.toLowerCase());
    const cumpleReconocimiento = !filtros.reconocimiento || entry.reconocimiento === filtros.reconocimiento;
    const cumpleTipo = !filtros.tipo || entry.tipo_logro === filtros.tipo;
    const cumplePatrulla = !filtros.patrulla || entry.patrulla === filtros.patrulla;
    
    return cumpleBusqueda && cumpleReconocimiento && cumpleTipo && cumplePatrulla;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D4AF37] via-[#F7DC6F] to-[#F8C471] p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Libro de Oro</h1>
          <p className="text-yellow-100 text-lg">Registro histórico de logros y reconocimientos scouts</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-white">{estadisticas.total}</div>
            <div className="text-yellow-100">Total Logros</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-green-300">{estadisticas.este_ano}</div>
            <div className="text-yellow-100">Este Año</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-yellow-300">{estadisticas.por_reconocimiento?.Oro || 0}</div>
            <div className="text-yellow-100">Oro</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-gray-300">{estadisticas.por_reconocimiento?.Plata || 0}</div>
            <div className="text-yellow-100">Plata</div>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-xl text-red-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Botón crear y filtros */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <button
              onClick={handleCreateEntry}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nuevo Logro
            </button>
          </div>

          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Filtros de Búsqueda
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label="Buscar">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-100 w-4 h-4" />
                <Input
                  value={filtros.busqueda}
                  onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                  placeholder="Buscar logros..."
                  className="pl-10 bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-yellow-100"
                />
              </div>
            </FormField>

            <FormField label="Reconocimiento">
              <Select
                value={filtros.reconocimiento}
                onChange={(e) => handleFiltroChange('reconocimiento', e.target.value)}
                options={reconocimientos}
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
              />
            </FormField>

            <FormField label="Tipo">
              <Select
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                options={[{ value: '', label: 'Todos los tipos' }, ...tiposLogro]}
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
              />
            </FormField>

            <FormField label="Patrulla">
              <Select
                value={filtros.patrulla}
                onChange={(e) => handleFiltroChange('patrulla', e.target.value)}
                options={patrullas}
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
              />
            </FormField>
          </div>
        </div>

        {/* Formulario de Nueva Entrada */}
        {showAddForm && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Plus className="w-6 h-6 mr-2" />
                Nuevo Logro
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  limpiarFormulario();
                }}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField label="Título del Logro" required>
                  <Input
                    value={formData.titulo}
                    onChange={(e) => handleInputChange('titulo', e.target.value)}
                    placeholder="Nombre del evento o logro"
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-yellow-100"
                  />
                </FormField>

                <FormField label="Fecha" required>
                  <Input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => handleInputChange('fecha', e.target.value)}
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                  />
                </FormField>

                <FormField label="Reconocimiento" required>
                  <Select
                    value={formData.reconocimiento}
                    onChange={(e) => handleInputChange('reconocimiento', e.target.value)}
                    options={reconocimientos.filter(r => r.value !== '')}
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                  />
                </FormField>
              </div>

              {/* Organización */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField label="Patrulla">
                  <Select
                    value={formData.patrulla}
                    onChange={(e) => handleInputChange('patrulla', e.target.value)}
                    options={patrullas}
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                  />
                </FormField>

                <FormField label="Rama">
                  <Select
                    value={formData.rama}
                    onChange={(e) => handleInputChange('rama', e.target.value)}
                    options={ramas}
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                  />
                </FormField>

                <FormField label="Tipo de Logro" required>
                  <Select
                    value={formData.tipo_logro}
                    onChange={(e) => handleInputChange('tipo_logro', e.target.value)}
                    options={tiposLogro}
                    placeholder="Seleccionar tipo"
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                  />
                </FormField>
              </div>

              {/* Logro y descripción */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Logro Específico" required>
                  <Input
                    value={formData.logro}
                    onChange={(e) => handleInputChange('logro', e.target.value)}
                    placeholder="Ej: 1er Lugar, Mejor Campamento, Servicio Destacado"
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-yellow-100"
                  />
                </FormField>

                <FormField label="Lugar">
                  <Input
                    value={formData.lugar}
                    onChange={(e) => handleInputChange('lugar', e.target.value)}
                    placeholder="Lugar donde se realizó"
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-yellow-100"
                  />
                </FormField>
              </div>

              <FormField label="Descripción" required>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  placeholder="Describe el logro y las circunstancias..."
                  rows={4}
                  className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-4 py-3 text-white placeholder-yellow-100 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                />
              </FormField>

              {/* Información adicional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Participantes">
                  <Input
                    value={formData.participantes}
                    onChange={(e) => handleInputChange('participantes', e.target.value)}
                    placeholder="Nombres de los participantes"
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-yellow-100"
                  />
                </FormField>

                <FormField label="Dirigente Responsable">
                  <Input
                    value={formData.dirigente_responsable}
                    onChange={(e) => handleInputChange('dirigente_responsable', e.target.value)}
                    placeholder="Dirigente a cargo"
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-yellow-100"
                  />
                </FormField>
              </div>

              <FormField label="Relatores">
                <Input
                  value={formData.relatores}
                  onChange={(e) => handleInputChange('relatores', e.target.value)}
                  placeholder="Nombres de quienes relatan este logro"
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-yellow-100"
                />
              </FormField>

              {/* Campos adicionales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Evidencias">
                  <textarea
                    value={formData.evidencias}
                    onChange={(e) => handleInputChange('evidencias', e.target.value)}
                    placeholder="Fotos, documentos, enlaces a evidencias"
                    rows={3}
                    className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-4 py-3 text-white placeholder-yellow-100 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                  />
                </FormField>

                <FormField label="Impacto">
                  <textarea
                    value={formData.impacto}
                    onChange={(e) => handleInputChange('impacto', e.target.value)}
                    placeholder="Impacto en la comunidad o el grupo scout"
                    rows={3}
                    className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-4 py-3 text-white placeholder-yellow-100 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                  />
                </FormField>
              </div>

              <div className="flex gap-4 pt-6 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    limpiarFormulario();
                  }}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {loading ? 'Guardando...' : 'Registrar Logro'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Logros */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
          <div className="bg-white/10 px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Logros Registrados ({entriesFiltradas.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-yellow-100">Cargando logros...</p>
            </div>
          ) : entriesFiltradas.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-white/50" />
              <h3 className="text-lg font-medium text-white mb-2">No hay logros registrados</h3>
              <p className="text-yellow-100">
                {entries.length === 0 
                  ? 'Registra el primer logro para comenzar el Libro de Oro'
                  : 'No se encontraron logros con los filtros aplicados'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {entriesFiltradas.map((entry) => (
                <div key={entry.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          {getTipoIcon(entry.tipo_logro)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {entry.titulo}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-yellow-100">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(entry.fecha).toLocaleDateString('es-PE')}
                            </span>
                            {entry.patrulla && (
                              <>
                                <span>•</span>
                                <span>{entry.patrulla}</span>
                              </>
                            )}
                            {entry.rama && (
                              <>
                                <span>•</span>
                                <span>{obtenerIconoRama(entry.rama)} {entry.rama.toUpperCase()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-sm font-medium text-white">Logro: </span>
                        <span className="text-sm text-yellow-100">{entry.logro}</span>
                      </div>
                      
                      <p className="text-yellow-100 mb-3">{entry.descripcion}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-yellow-100">
                        <span className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          {entry.tipo_logro}
                        </span>
                        
                        {entry.lugar && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {entry.lugar}
                          </span>
                        )}

                        {entry.dirigente_responsable && (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {entry.dirigente_responsable}
                          </span>
                        )}
                      </div>

                      {entry.relatores && (
                        <div className="mt-3 text-sm text-yellow-100">
                          <span className="font-medium">Relatores: </span>
                          {entry.relatores}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getReconocimientoColor(entry.reconocimiento)}`}>
                        {entry.reconocimiento}
                      </span>
                      
                      <button
                        onClick={() => handleViewEntry(entry)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg transition-colors"
                        title="Ver logro"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-lg transition-colors"
                        title="Editar logro"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteEntry(entry)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors"
                        title="Eliminar logro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Ver Logro */}
        {showViewModal && selectedEntry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Eye className="w-6 h-6" />
                  Detalles del Logro
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Información General</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-yellow-100 font-medium">Título:</span>
                        <p className="text-white">{selectedEntry.titulo}</p>
                      </div>
                      <div>
                        <span className="text-yellow-100 font-medium">Fecha:</span>
                        <p className="text-white">{new Date(selectedEntry.fecha).toLocaleDateString('es-PE')}</p>
                      </div>
                      <div>
                        <span className="text-yellow-100 font-medium">Reconocimiento:</span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium border ${getReconocimientoColor(selectedEntry.reconocimiento)}`}>
                          {selectedEntry.reconocimiento}
                        </span>
                      </div>
                      <div>
                        <span className="text-yellow-100 font-medium">Tipo:</span>
                        <p className="text-white">{selectedEntry.tipo_logro}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Organización</h3>
                    <div className="space-y-3">
                      {selectedEntry.patrulla && (
                        <div>
                          <span className="text-yellow-100 font-medium">Patrulla:</span>
                          <p className="text-white">{selectedEntry.patrulla}</p>
                        </div>
                      )}
                      {selectedEntry.rama && (
                        <div>
                          <span className="text-yellow-100 font-medium">Rama:</span>
                          <p className="text-white">{obtenerIconoRama(selectedEntry.rama)} {selectedEntry.rama.toUpperCase()}</p>
                        </div>
                      )}
                      {selectedEntry.lugar && (
                        <div>
                          <span className="text-yellow-100 font-medium">Lugar:</span>
                          <p className="text-white">{selectedEntry.lugar}</p>
                        </div>
                      )}
                      {selectedEntry.dirigente_responsable && (
                        <div>
                          <span className="text-yellow-100 font-medium">Dirigente Responsable:</span>
                          <p className="text-white">{selectedEntry.dirigente_responsable}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-yellow-100 font-medium">Logro:</span>
                  <p className="text-white mt-1">{selectedEntry.logro}</p>
                </div>

                <div>
                  <span className="text-yellow-100 font-medium">Descripción:</span>
                  <p className="text-white mt-1">{selectedEntry.descripcion}</p>
                </div>

                {(selectedEntry.participantes || selectedEntry.relatores || selectedEntry.evidencias || selectedEntry.impacto) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedEntry.participantes && (
                      <div>
                        <span className="text-yellow-100 font-medium">Participantes:</span>
                        <p className="text-white mt-1">{selectedEntry.participantes}</p>
                      </div>
                    )}
                    
                    {selectedEntry.relatores && (
                      <div>
                        <span className="text-yellow-100 font-medium">Relatores:</span>
                        <p className="text-white mt-1">{selectedEntry.relatores}</p>
                      </div>
                    )}
                    
                    {selectedEntry.evidencias && (
                      <div>
                        <span className="text-yellow-100 font-medium">Evidencias:</span>
                        <p className="text-white mt-1">{selectedEntry.evidencias}</p>
                      </div>
                    )}
                    
                    {selectedEntry.impacto && (
                      <div>
                        <span className="text-yellow-100 font-medium">Impacto:</span>
                        <p className="text-white mt-1">{selectedEntry.impacto}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Logro */}
        {showEditModal && selectedEntry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Edit className="w-6 h-6" />
                  Editar Logro
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEntry(null);
                    limpiarFormulario();
                  }}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField label="Título del Logro" required>
                    <Input
                      value={formData.titulo}
                      onChange={(e) => handleInputChange('titulo', e.target.value)}
                      placeholder="Nombre del evento o logro"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-yellow-100"
                    />
                  </FormField>

                  <FormField label="Fecha" required>
                    <Input
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => handleInputChange('fecha', e.target.value)}
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                    />
                  </FormField>

                  <FormField label="Reconocimiento" required>
                    <Select
                      value={formData.reconocimiento}
                      onChange={(e) => handleInputChange('reconocimiento', e.target.value)}
                      options={reconocimientos.filter(r => r.value !== '')}
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                    />
                  </FormField>
                </div>

                {/* Resto del formulario igual que el de crear pero con los valores del selectedEntry */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField label="Patrulla">
                    <Select
                      value={formData.patrulla}
                      onChange={(e) => handleInputChange('patrulla', e.target.value)}
                      options={patrullas}
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                    />
                  </FormField>

                  <FormField label="Rama">
                    <Select
                      value={formData.rama}
                      onChange={(e) => handleInputChange('rama', e.target.value)}
                      options={ramas}
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                    />
                  </FormField>

                  <FormField label="Tipo de Logro" required>
                    <Select
                      value={formData.tipo_logro}
                      onChange={(e) => handleInputChange('tipo_logro', e.target.value)}
                      options={tiposLogro}
                      placeholder="Seleccionar tipo"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Logro Específico" required>
                    <Input
                      value={formData.logro}
                      onChange={(e) => handleInputChange('logro', e.target.value)}
                      placeholder="Ej: 1er Lugar, Mejor Campamento, Servicio Destacado"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-yellow-100"
                    />
                  </FormField>

                  <FormField label="Lugar">
                    <Input
                      value={formData.lugar}
                      onChange={(e) => handleInputChange('lugar', e.target.value)}
                      placeholder="Lugar donde se realizó"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-yellow-100"
                    />
                  </FormField>
                </div>

                <FormField label="Descripción" required>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    placeholder="Describe el logro y las circunstancias..."
                    rows={4}
                    className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-4 py-3 text-white placeholder-yellow-100 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                  />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Participantes">
                    <Input
                      value={formData.participantes}
                      onChange={(e) => handleInputChange('participantes', e.target.value)}
                      placeholder="Nombres de los participantes"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-yellow-100"
                    />
                  </FormField>

                  <FormField label="Dirigente Responsable">
                    <Input
                      value={formData.dirigente_responsable}
                      onChange={(e) => handleInputChange('dirigente_responsable', e.target.value)}
                      placeholder="Dirigente a cargo"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-yellow-100"
                    />
                  </FormField>
                </div>

                <FormField label="Relatores">
                  <Input
                    value={formData.relatores}
                    onChange={(e) => handleInputChange('relatores', e.target.value)}
                    placeholder="Nombres de quienes relatan este logro"
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-yellow-100"
                  />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Evidencias">
                    <textarea
                      value={formData.evidencias}
                      onChange={(e) => handleInputChange('evidencias', e.target.value)}
                      placeholder="Fotos, documentos, enlaces a evidencias"
                      rows={3}
                      className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-4 py-3 text-white placeholder-yellow-100 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                    />
                  </FormField>

                  <FormField label="Impacto">
                    <textarea
                      value={formData.impacto}
                      onChange={(e) => handleInputChange('impacto', e.target.value)}
                      placeholder="Impacto en la comunidad o el grupo scout"
                      rows={3}
                      className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-4 py-3 text-white placeholder-yellow-100 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                    />
                  </FormField>
                </div>

                <div className="flex gap-4 pt-6 border-t border-white/20">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedEntry(null);
                      limpiarFormulario();
                    }}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    onClick={handleUpdateEntry}
                    disabled={loading}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {loading ? 'Actualizando...' : 'Actualizar Logro'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Eliminar Logro */}
        {showDeleteModal && selectedEntry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 max-w-md w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Eliminar Logro</h2>
                <p className="text-yellow-100 mb-6">
                  ¿Estás seguro de que deseas eliminar el logro "<strong>{selectedEntry.titulo}</strong>"?
                  <br />
                  <span className="text-red-300 text-sm">Esta acción no se puede deshacer.</span>
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedEntry(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDeleteEntry}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {loading ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}