import { useState } from 'react';
import { Calendar, Users, Search, Save, Clock, CheckCircle, XCircle, TrendingUp, Filter } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';

interface RegistroAsistencia {
  id: string;
  fecha: string;
  scout: string;
  rama: string;
  estado: 'presente' | 'ausente' | 'tardanza';
  observaciones: string;
  horaLlegada?: string;
}

interface EstadisticasAsistencia {
  scout: string;
  rama: string;
  totalSesiones: number;
  presente: number;
  ausente: number;
  tardanza: number;
  porcentajeAsistencia: number;
}

export default function Asistencia() {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    scout: '',
    rama: '',
    estado: '',
    observaciones: '',
    horaLlegada: ''
  });

  const [registros, setRegistros] = useState<RegistroAsistencia[]>([
    {
      id: '1',
      fecha: '2024-03-15',
      scout: 'Juan Pérez López',
      rama: 'Tropa',
      estado: 'presente',
      observaciones: '',
      horaLlegada: '15:30'
    },
    {
      id: '2',
      fecha: '2024-03-15',
      scout: 'María González Torres',
      rama: 'Manada',
      estado: 'presente',
      observaciones: '',
      horaLlegada: '15:25'
    },
    {
      id: '3',
      fecha: '2024-03-15',
      scout: 'Carlos Mendoza Silva',
      rama: 'Caminante',
      estado: 'tardanza',
      observaciones: 'Llegó 20 minutos tarde',
      horaLlegada: '15:50'
    },
    {
      id: '4',
      fecha: '2024-03-15',
      scout: 'Ana Rodríguez Vega',
      rama: 'Manada',
      estado: 'ausente',
      observaciones: 'Enfermedad reportada por padres',
      horaLlegada: ''
    }
  ]);

  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    rama: '',
    estado: ''
  });

  const [vistaActual, setVistaActual] = useState<'registro' | 'estadisticas'>('registro');

  const ramas = [
    { value: 'Manada', label: 'Manada (7-10 años)' },
    { value: 'Tropa', label: 'Tropa (11-14 años)' },
    { value: 'Caminante', label: 'Caminante (15-17 años)' },
    { value: 'Clan', label: 'Clan (18-21 años)' }
  ];

  const estados = [
    { value: 'presente', label: 'Presente' },
    { value: 'ausente', label: 'Ausente' },
    { value: 'tardanza', label: 'Tardanza' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFiltroChange = (field: string, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const nuevoRegistro: RegistroAsistencia = {
      id: (registros.length + 1).toString(),
      fecha: formData.fecha,
      scout: formData.scout,
      rama: formData.rama,
      estado: formData.estado as 'presente' | 'ausente' | 'tardanza',
      observaciones: formData.observaciones,
      horaLlegada: formData.estado === 'ausente' ? '' : formData.horaLlegada
    };

    setRegistros(prev => [nuevoRegistro, ...prev]);
    setFormData({
      fecha: formData.fecha, // Mantener la fecha para facilitar registro múltiple
      scout: '',
      rama: formData.rama, // Mantener rama para facilitar registro múltiple
      estado: '',
      observaciones: '',
      horaLlegada: ''
    });
  };

  const getEstadoColor = (estado: string) => {
    const colores = {
      'presente': 'bg-green-100 text-green-800',
      'ausente': 'bg-red-100 text-red-800',
      'tardanza': 'bg-yellow-100 text-yellow-800'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoIcon = (estado: string) => {
    const iconos = {
      'presente': <CheckCircle className="w-4 h-4" />,
      'ausente': <XCircle className="w-4 h-4" />,
      'tardanza': <Clock className="w-4 h-4" />
    };
    return iconos[estado as keyof typeof iconos] || <Clock className="w-4 h-4" />;
  };

  const calcularEstadisticas = (): EstadisticasAsistencia[] => {
    const scouts = [...new Set(registros.map(r => r.scout))];
    
    return scouts.map(scout => {
      const registrosScout = registros.filter(r => r.scout === scout);
      const presente = registrosScout.filter(r => r.estado === 'presente').length;
      const ausente = registrosScout.filter(r => r.estado === 'ausente').length;
      const tardanza = registrosScout.filter(r => r.estado === 'tardanza').length;
      const totalSesiones = registrosScout.length;
      const porcentajeAsistencia = totalSesiones > 0 ? ((presente + tardanza) / totalSesiones) * 100 : 0;

      return {
        scout,
        rama: registrosScout[0]?.rama || '',
        totalSesiones,
        presente,
        ausente,
        tardanza,
        porcentajeAsistencia: Math.round(porcentajeAsistencia)
      };
    }).sort((a, b) => b.porcentajeAsistencia - a.porcentajeAsistencia);
  };

  const registrosFiltrados = registros.filter(registro => {
    const cumpleFecha = (!filtros.fechaInicio || registro.fecha >= filtros.fechaInicio) &&
                       (!filtros.fechaFin || registro.fecha <= filtros.fechaFin);
    const cumpleRama = !filtros.rama || registro.rama === filtros.rama;
    const cumpleEstado = !filtros.estado || registro.estado === filtros.estado;
    
    return cumpleFecha && cumpleRama && cumpleEstado;
  });

  const estadisticas = calcularEstadisticas();

  const resumenAsistencia = {
    totalRegistros: registros.length,
    presentes: registros.filter(r => r.estado === 'presente').length,
    ausentes: registros.filter(r => r.estado === 'ausente').length,
    tardanzas: registros.filter(r => r.estado === 'tardanza').length,
    porcentajeGeneral: registros.length > 0 ? 
      Math.round(((registros.filter(r => r.estado === 'presente').length + 
                   registros.filter(r => r.estado === 'tardanza').length) / registros.length) * 100) : 0
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Control de Asistencia</h1>
        <p className="text-gray-600">Registro y seguimiento de asistencia de scouts</p>
      </div>

      {/* Navegación entre vistas */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setVistaActual('registro')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              vistaActual === 'registro' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Registro de Asistencia
          </button>
          <button
            onClick={() => setVistaActual('estadisticas')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              vistaActual === 'estadisticas' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Estadísticas
          </button>
        </div>
      </div>

      {/* Resumen de Asistencia */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-800">{resumenAsistencia.totalRegistros}</div>
              <div className="text-sm text-gray-600">Total Registros</div>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{resumenAsistencia.presentes}</div>
              <div className="text-sm text-gray-600">Presentes</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600">{resumenAsistencia.ausentes}</div>
              <div className="text-sm text-gray-600">Ausentes</div>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600">{resumenAsistencia.tardanzas}</div>
              <div className="text-sm text-gray-600">Tardanzas</div>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{resumenAsistencia.porcentajeGeneral}%</div>
              <div className="text-sm text-gray-600">Asistencia General</div>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {vistaActual === 'registro' ? (
        <>
          {/* Formulario de Registro */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Registrar Asistencia
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
              <FormField label="Fecha">
                <Input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => handleInputChange('fecha', e.target.value)}
                />
              </FormField>

              <FormField label="Scout">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={formData.scout}
                    onChange={(e) => handleInputChange('scout', e.target.value)}
                    placeholder="Buscar scout"
                    className="pl-10"
                  />
                </div>
              </FormField>

              <FormField label="Rama">
                <Select
                  value={formData.rama}
                  onChange={(e) => handleInputChange('rama', e.target.value)}
                  options={ramas}
                  placeholder="Seleccionar rama"
                />
              </FormField>

              <FormField label="Estado">
                <Select
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  options={estados}
                  placeholder="Estado de asistencia"
                />
              </FormField>

              <FormField label="Hora de Llegada">
                <Input
                  type="time"
                  value={formData.horaLlegada}
                  onChange={(e) => handleInputChange('horaLlegada', e.target.value)}
                  disabled={formData.estado === 'ausente'}
                />
              </FormField>

              <FormField label="Observaciones">
                <Input
                  value={formData.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  placeholder="Observaciones opcionales"
                />
              </FormField>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Registrar Asistencia
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-gray-600" />
              Filtros
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField label="Fecha Inicio">
                <Input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                />
              </FormField>

              <FormField label="Fecha Fin">
                <Input
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                />
              </FormField>

              <FormField label="Rama">
                <Select
                  value={filtros.rama}
                  onChange={(e) => handleFiltroChange('rama', e.target.value)}
                  options={[{ value: '', label: 'Todas las ramas' }, ...ramas]}
                />
              </FormField>

              <FormField label="Estado">
                <Select
                  value={filtros.estado}
                  onChange={(e) => handleFiltroChange('estado', e.target.value)}
                  options={[{ value: '', label: 'Todos los estados' }, ...estados]}
                />
              </FormField>
            </div>
          </div>

          {/* Tabla de Registros */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">
              Registros de Asistencia ({registrosFiltrados.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Scout</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Rama</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Hora Llegada</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosFiltrados.map((registro, index) => (
                    <tr key={registro.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(registro.fecha).toLocaleDateString('es-PE')}
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-800">
                        {registro.scout}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          {registro.rama}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(registro.estado)}`}>
                          {getEstadoIcon(registro.estado)}
                          <span className="ml-2 capitalize">{registro.estado}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {registro.horaLlegada || '-'}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {registro.observaciones || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {registrosFiltrados.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No hay registros de asistencia para los filtros seleccionados</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Vista de Estadísticas */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Estadísticas por Scout
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Scout</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Rama</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Sesiones</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Presente</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ausente</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tardanza</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">% Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {estadisticas.map((stat, index) => (
                  <tr key={stat.scout} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                    <td className="py-4 px-4 font-medium text-gray-800">
                      {stat.scout}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {stat.rama}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600">
                      {stat.totalSesiones}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                        {stat.presente}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                        {stat.ausente}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                        {stat.tardanza}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full ${
                              stat.porcentajeAsistencia >= 80 ? 'bg-green-500' :
                              stat.porcentajeAsistencia >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${stat.porcentajeAsistencia}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${
                          stat.porcentajeAsistencia >= 80 ? 'text-green-600' :
                          stat.porcentajeAsistencia >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {stat.porcentajeAsistencia}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {estadisticas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay estadísticas disponibles</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}