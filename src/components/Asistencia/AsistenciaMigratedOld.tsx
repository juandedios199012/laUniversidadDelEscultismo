import { useState, useEffect } from 'react';
import { Calendar, Users, Search, Save, Clock, CheckCircle, XCircle, TrendingUp, Filter, AlertCircle } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';
import ScoutService from '../../services/scoutService';
import type { Scout, Asistencia } from '../../lib/supabase';

interface FormularioAsistencia {
  scout_id: string;
  fecha: string;
  estado_asistencia: 'presente' | 'ausente' | 'tardanza' | 'justificado';
  actividad_id?: string;
  tipo_evento: string;
  hora_llegada: string;
  justificacion: string;
}

interface EstadisticaScout {
  scout: Scout;
  totalRegistros: number;
  presente: number;
  ausente: number;
  tardanza: number;
  justificado: number;
  porcentajeAsistencia: number;
}

export default function AsistenciaMigrated() {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vistaActual, setVistaActual] = useState<'registro' | 'estadisticas'>('registro');

  const [formData, setFormData] = useState<FormularioAsistencia>({
    scout_id: '',
    fecha: new Date().toISOString().split('T')[0],
    estado_asistencia: 'presente',
    tipo_evento: 'reunion_semanal',
    hora_llegada: new Date().toTimeString().slice(0, 5),
    justificacion: ''
  });

  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    rama: '',
    estado: '',
    scout: ''
  });

  // Opciones para selects
  const estadosAsistencia = [
    { value: 'presente', label: 'Presente' },
    { value: 'ausente', label: 'Ausente' },
    { value: 'tardanza', label: 'Tardanza' },
    { value: 'justificado', label: 'Justificado' }
  ];

  const tiposEvento = [
    { value: 'reunion_semanal', label: 'Reunión Semanal' },
    { value: 'campamento', label: 'Campamento' },
    { value: 'actividad_especial', label: 'Actividad Especial' },
    { value: 'ceremonia', label: 'Ceremonia' },
    { value: 'capacitacion', label: 'Capacitación' }
  ];

  const ramaOptions = [
    { value: '', label: 'Todas las ramas' },
    { value: 'manada', label: '🐺 Manada' },
    { value: 'tropa', label: '🦅 Tropa' },
    { value: 'caminante', label: '🥾 Caminante' },
    { value: 'clan', label: '🚀 Clan' }
  ];

  // Efectos
  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (filtros.fechaInicio || filtros.fechaFin) {
      filtrarAsistencias();
    }
  }, [filtros]);

  // Funciones de carga de datos
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [scoutsData] = await Promise.all([
        ScoutService.getAllScouts()
      ]);
      setScouts(scoutsData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const filtrarAsistencias = async () => {
    if (!filtros.fechaInicio && !filtros.fechaFin) return;

    try {
      setLoading(true);
      // Cargar asistencias de todos los scouts si hay filtros de fecha
      const asistenciasPromises = scouts.map(scout => 
        ScoutService.getAsistenciasByScout(scout.id, filtros.fechaInicio, filtros.fechaFin)
      );
      
      const todasAsistencias = await Promise.all(asistenciasPromises);
      const asistenciasPlanas = todasAsistencias.flat();
      setAsistencias(asistenciasPlanas);
    } catch (error) {
      console.error('Error al filtrar asistencias:', error);
      setError('Error al cargar las asistencias');
    } finally {
      setLoading(false);
    }
  };

  // Funciones del formulario
  const handleInputChange = (field: keyof FormularioAsistencia, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar hora de llegada si el estado es ausente
    if (field === 'estado_asistencia' && value === 'ausente') {
      setFormData(prev => ({ ...prev, hora_llegada: '' }));
    }
  };

  const handleFiltroChange = (field: string, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
  };

  const validarFormulario = (): string | null => {
    if (!formData.scout_id) return 'Debe seleccionar un scout';
    if (!formData.fecha) return 'Debe seleccionar una fecha';
    if (!formData.estado_asistencia) return 'Debe seleccionar un estado de asistencia';
    if (formData.estado_asistencia === 'justificado' && !formData.justificacion.trim()) {
      return 'Debe proporcionar una justificación';
    }
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

      const resultado = await ScoutService.registrarAsistencia(
        formData.scout_id,
        formData.fecha,
        formData.estado_asistencia,
        undefined, // actividad_id (opcional)
        formData.tipo_evento,
        formData.hora_llegada || undefined,
        formData.justificacion || undefined,
        'Sistema' // registrado_por (podría ser el usuario actual)
      );

      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al registrar asistencia');
      }

      // Recargar asistencias si hay filtros activos
      if (filtros.fechaInicio || filtros.fechaFin) {
        await filtrarAsistencias();
      }

      // Limpiar formulario parcialmente
      setFormData(prev => ({
        ...prev,
        scout_id: '',
        estado_asistencia: 'presente',
        hora_llegada: new Date().toTimeString().slice(0, 5),
        justificacion: ''
      }));

    } catch (error: any) {
      console.error('Error al registrar asistencia:', error);
      setError(error.message || 'Error al registrar la asistencia');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de utilidad
  const getEstadoColor = (estado: string) => {
    const colores = {
      'presente': 'bg-green-100 text-green-800 border-green-300',
      'ausente': 'bg-red-100 text-red-800 border-red-300',
      'tardanza': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'justificado': 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getEstadoIcon = (estado: string) => {
    const iconos = {
      'presente': <CheckCircle className="w-4 h-4" />,
      'ausente': <XCircle className="w-4 h-4" />,
      'tardanza': <Clock className="w-4 h-4" />,
      'justificado': <Calendar className="w-4 h-4" />
    };
    return iconos[estado as keyof typeof iconos] || <Clock className="w-4 h-4" />;
  };

  const calcularEstadisticas = (): EstadisticaScout[] => {
    const estadisticasPorScout = scouts.map(scout => {
      const asistenciasScout = asistencias.filter(a => a.scout_id === scout.id);
      const presente = asistenciasScout.filter(a => a.estado_asistencia === 'presente').length;
      const ausente = asistenciasScout.filter(a => a.estado_asistencia === 'ausente').length;
      const tardanza = asistenciasScout.filter(a => a.estado_asistencia === 'tardanza').length;
      const justificado = asistenciasScout.filter(a => a.estado_asistencia === 'justificado').length;
      const totalRegistros = asistenciasScout.length;
      
      // Calcular porcentaje de asistencia (presente + tardanza + justificado)
      const asistenciaEfectiva = presente + tardanza + justificado;
      const porcentajeAsistencia = totalRegistros > 0 ? Math.round((asistenciaEfectiva / totalRegistros) * 100) : 0;

      return {
        scout,
        totalRegistros,
        presente,
        ausente,
        tardanza,
        justificado,
        porcentajeAsistencia
      };
    })
    .filter(stat => stat.totalRegistros > 0) // Solo scouts con registros
    .sort((a, b) => b.porcentajeAsistencia - a.porcentajeAsistencia);

    return estadisticasPorScout;
  };

  // Filtrar scouts para el selector
  const scoutsFiltrados = scouts.filter(scout => {
    if (!filtros.rama) return true;
    return scout.rama_actual === filtros.rama;
  });

  // Filtrar asistencias para la tabla
  const asistenciasFiltradas = asistencias.filter(asistencia => {
    const scout = scouts.find(s => s.id === asistencia.scout_id);
    if (!scout) return false;

    const cumpleScout = !filtros.scout || scout.nombres.toLowerCase().includes(filtros.scout.toLowerCase()) || 
                        scout.apellidos.toLowerCase().includes(filtros.scout.toLowerCase());
    const cumpleRama = !filtros.rama || scout.rama_actual === filtros.rama;
    const cumpleEstado = !filtros.estado || asistencia.estado_asistencia === filtros.estado;
    
    return cumpleScout && cumpleRama && cumpleEstado;
  });

  const estadisticas = calcularEstadisticas();

  // Calcular resumen general
  const resumenAsistencia = {
    totalRegistros: asistencias.length,
    presente: asistencias.filter(a => a.estado_asistencia === 'presente').length,
    ausente: asistencias.filter(a => a.estado_asistencia === 'ausente').length,
    tardanza: asistencias.filter(a => a.estado_asistencia === 'tardanza').length,
    justificado: asistencias.filter(a => a.estado_asistencia === 'justificado').length
  };

  const porcentajeGeneral = resumenAsistencia.totalRegistros > 0 ? 
    Math.round(((resumenAsistencia.presente + resumenAsistencia.tardanza + resumenAsistencia.justificado) / resumenAsistencia.totalRegistros) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4A90E2] via-[#5BA3F5] to-[#7BB3F0] p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl mb-4">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Control de Asistencia</h1>
          <p className="text-blue-100 text-lg">Registro y seguimiento de asistencia de scouts</p>
        </div>

        {/* Navegación entre vistas */}
        <div className="mb-8 flex justify-center">
          <div className="flex space-x-1 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20">
            <button
              onClick={() => setVistaActual('registro')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                vistaActual === 'registro' 
                  ? 'bg-white text-blue-600 shadow-lg' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Registro de Asistencia
            </button>
            <button
              onClick={() => setVistaActual('estadisticas')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                vistaActual === 'estadisticas' 
                  ? 'bg-white text-blue-600 shadow-lg' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Estadísticas
            </button>
          </div>
        </div>

        {/* Resumen de Asistencia */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-white">{resumenAsistencia.totalRegistros}</div>
            <div className="text-blue-100">Total Registros</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-green-300">{resumenAsistencia.presente}</div>
            <div className="text-blue-100">Presentes</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-red-300">{resumenAsistencia.ausente}</div>
            <div className="text-blue-100">Ausentes</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-yellow-300">{resumenAsistencia.tardanza}</div>
            <div className="text-blue-100">Tardanzas</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-blue-300">{resumenAsistencia.justificado}</div>
            <div className="text-blue-100">Justificados</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-white">{porcentajeGeneral}%</div>
            <div className="text-blue-100">Asistencia General</div>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-xl text-red-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {vistaActual === 'registro' ? (
          <>
            {/* Formulario de Registro */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-8">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Save className="w-6 h-6 mr-2" />
                Registrar Asistencia
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField label="Fecha" required>
                    <Input
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => handleInputChange('fecha', e.target.value)}
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                    />
                  </FormField>

                  <FormField label="Scout" required>
                    <Select
                      value={formData.scout_id}
                      onChange={(e) => handleInputChange('scout_id', e.target.value)}
                      options={scoutsFiltrados.map(scout => ({
                        value: scout.id,
                        label: `${scout.nombres} ${scout.apellidos} (${scout.rama_actual})`
                      }))}
                      placeholder="Seleccionar scout"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                    />
                  </FormField>

                  <FormField label="Tipo de Evento">
                    <Select
                      value={formData.tipo_evento}
                      onChange={(e) => handleInputChange('tipo_evento', e.target.value)}
                      options={tiposEvento}
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                    />
                  </FormField>

                  <FormField label="Estado de Asistencia" required>
                    <Select
                      value={formData.estado_asistencia}
                      onChange={(e) => handleInputChange('estado_asistencia', e.target.value)}
                      options={estadosAsistencia}
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                    />
                  </FormField>

                  <FormField label="Hora de Llegada">
                    <Input
                      type="time"
                      value={formData.hora_llegada}
                      onChange={(e) => handleInputChange('hora_llegada', e.target.value)}
                      disabled={formData.estado_asistencia === 'ausente'}
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100 disabled:opacity-50"
                    />
                  </FormField>

                  <FormField label="Justificación">
                    <Input
                      value={formData.justificacion}
                      onChange={(e) => handleInputChange('justificacion', e.target.value)}
                      placeholder="Observaciones o justificación"
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                    />
                  </FormField>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {loading ? 'Registrando...' : 'Registrar Asistencia'}
                  </button>
                </div>
              </form>
            </div>

            {/* Filtros */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filtros de Búsqueda
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <FormField label="Fecha Inicio">
                  <Input
                    type="date"
                    value={filtros.fechaInicio}
                    onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                  />
                </FormField>

                <FormField label="Fecha Fin">
                  <Input
                    type="date"
                    value={filtros.fechaFin}
                    onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                  />
                </FormField>

                <FormField label="Rama">
                  <Select
                    value={filtros.rama}
                    onChange={(e) => handleFiltroChange('rama', e.target.value)}
                    options={ramaOptions}
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                  />
                </FormField>

                <FormField label="Estado">
                  <Select
                    value={filtros.estado}
                    onChange={(e) => handleFiltroChange('estado', e.target.value)}
                    options={[{ value: '', label: 'Todos los estados' }, ...estadosAsistencia]}
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white"
                  />
                </FormField>

                <FormField label="Buscar Scout">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-100 w-4 h-4" />
                    <Input
                      value={filtros.scout}
                      onChange={(e) => handleFiltroChange('scout', e.target.value)}
                      placeholder="Nombre del scout"
                      className="pl-10 bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-100"
                    />
                  </div>
                </FormField>
              </div>
            </div>

            {/* Tabla de Asistencias */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
              <div className="bg-white/10 px-6 py-4 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Registros de Asistencia ({asistenciasFiltradas.length})
                </h3>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-blue-100">Cargando asistencias...</p>
                </div>
              ) : asistenciasFiltradas.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-white/50" />
                  <h3 className="text-lg font-medium text-white mb-2">No hay registros</h3>
                  <p className="text-blue-100">
                    {asistencias.length === 0 
                      ? 'Selecciona un rango de fechas para ver los registros de asistencia'
                      : 'No se encontraron registros con los filtros aplicados'
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-white">Fecha</th>
                        <th className="text-left py-3 px-4 font-semibold text-white">Scout</th>
                        <th className="text-left py-3 px-4 font-semibold text-white">Rama</th>
                        <th className="text-left py-3 px-4 font-semibold text-white">Tipo</th>
                        <th className="text-left py-3 px-4 font-semibold text-white">Estado</th>
                        <th className="text-left py-3 px-4 font-semibold text-white">Hora</th>
                        <th className="text-left py-3 px-4 font-semibold text-white">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {asistenciasFiltradas.map((asistencia, index) => {
                        const scout = scouts.find(s => s.id === asistencia.scout_id);
                        return (
                          <tr key={asistencia.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4 text-blue-100">
                              {new Date(asistencia.fecha).toLocaleDateString('es-PE')}
                            </td>
                            <td className="py-4 px-4 text-white font-medium">
                              {scout ? `${scout.nombres} ${scout.apellidos}` : 'Scout no encontrado'}
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2 py-1 bg-white/20 text-blue-100 rounded-full text-xs font-medium">
                                {scout?.rama_actual?.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-blue-100 text-sm">
                              {tiposEvento.find(t => t.value === asistencia.tipo_evento)?.label || asistencia.tipo_evento}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(asistencia.estado_asistencia)}`}>
                                {getEstadoIcon(asistencia.estado_asistencia)}
                                <span className="ml-2 capitalize">{asistencia.estado_asistencia}</span>
                              </span>
                            </td>
                            <td className="py-4 px-4 text-blue-100">
                              {asistencia.hora_llegada || '-'}
                            </td>
                            <td className="py-4 px-4 text-blue-100">
                              {asistencia.justificacion || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Vista de Estadísticas */
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
            <div className="bg-white/10 px-6 py-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Estadísticas por Scout
              </h3>
            </div>

            {estadisticas.length === 0 ? (
              <div className="p-8 text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-white/50" />
                <h3 className="text-lg font-medium text-white mb-2">No hay estadísticas</h3>
                <p className="text-blue-100">Selecciona un rango de fechas para ver las estadísticas de asistencia</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-white">Scout</th>
                      <th className="text-left py-3 px-4 font-semibold text-white">Rama</th>
                      <th className="text-center py-3 px-4 font-semibold text-white">Registros</th>
                      <th className="text-center py-3 px-4 font-semibold text-white">Presente</th>
                      <th className="text-center py-3 px-4 font-semibold text-white">Ausente</th>
                      <th className="text-center py-3 px-4 font-semibold text-white">Tardanza</th>
                      <th className="text-center py-3 px-4 font-semibold text-white">Justificado</th>
                      <th className="text-center py-3 px-4 font-semibold text-white">% Asistencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {estadisticas.map((stat, index) => (
                      <tr key={stat.scout.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 text-white font-medium">
                          {stat.scout.nombres} {stat.scout.apellidos}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 bg-white/20 text-blue-100 rounded-full text-xs font-medium">
                            {stat.scout.rama_actual?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-blue-100">
                          {stat.totalRegistros}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-300 text-sm font-medium">
                            {stat.presente}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 text-red-300 text-sm font-medium">
                            {stat.ausente}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-300 text-sm font-medium">
                            {stat.tardanza}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium">
                            {stat.justificado}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-white/20 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    stat.porcentajeAsistencia >= 80 ? 'bg-green-400' :
                                    stat.porcentajeAsistencia >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                                  }`}
                                  style={{ width: `${stat.porcentajeAsistencia}%` }}
                                ></div>
                              </div>
                              <span className={`text-sm font-medium ${
                                stat.porcentajeAsistencia >= 80 ? 'text-green-300' :
                                stat.porcentajeAsistencia >= 60 ? 'text-yellow-300' : 'text-red-300'
                              }`}>
                                {stat.porcentajeAsistencia}%
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}