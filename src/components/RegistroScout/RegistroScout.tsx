import { useState, useEffect } from 'react';
import { 
  UserCheck, Save, FileText, 
  User, Heart, Users, Flag, ChevronDown, ChevronUp, Plus,
  AlertCircle, Search, Edit, Eye, Phone, Mail
} from 'lucide-react';
import ScoutService from '../../services/scoutService';
import type { Scout } from '../../lib/supabase';

interface FormularioScout {
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo: 'MASCULINO' | 'FEMENINO' | '';
  numero_documento: string;
  tipo_documento: string;
  celular: string;
  correo: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  centro_estudio: string;
  ocupacion: string;
  centro_laboral: string;
  es_dirigente: boolean;
  rama_actual: string;
  rama: string;
  // Datos del familiar
  familiar_nombres: string;
  familiar_apellidos: string;
  parentesco: string;
  familiar_celular: string;
  familiar_correo: string;
  familiar_ocupacion: string;
}

export default function RegistroScout() {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [scoutSeleccionado, setScoutSeleccionado] = useState<Scout | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [estadisticas, setEstadisticas] = useState<any>(null);

  const [formData, setFormData] = useState<FormularioScout>({
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    sexo: '',
    numero_documento: '',
    tipo_documento: 'DNI',
    celular: '',
    correo: '',
    departamento: '',
    provincia: '',
    distrito: '',
    direccion: '',
    centro_estudio: '',
    ocupacion: '',
    centro_laboral: '',
    es_dirigente: false,
    rama_actual: '',
    rama: '',
    familiar_nombres: '',
    familiar_apellidos: '',
    parentesco: '',
    familiar_celular: '',
    familiar_correo: '',
    familiar_ocupacion: ''
  });

  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    datosPersonales: true,
    datosContacto: false,
    datosEducacion: false,
    datosFamiliar: false,
    datosScout: false
  });

  // Opciones para selects
  const tipoDocumentoOptions = [
    { value: 'DNI', label: 'DNI' },
    { value: 'CE', label: 'Carné de Extranjería' },
    { value: 'PASAPORTE', label: 'Pasaporte' }
  ];

  const parentescoOptions = [
    { value: 'padre', label: 'Padre' },
    { value: 'madre', label: 'Madre' },
    { value: 'tutor', label: 'Tutor/a' },
    { value: 'hermano', label: 'Hermano/a' },
    { value: 'abuelo', label: 'Abuelo/a' },
    { value: 'tio', label: 'Tío/a' },
    { value: 'otro', label: 'Otro' }
  ];

  const ramaOptions = [
    { value: 'Lobatos', label: '🐺 Lobatos (6-10 años)' },
    { value: 'Scouts', label: '🦅 Scouts (11-14 años)' },
    { value: 'Rovers', label: '🥾 Rovers (15-17 años)' },
    { value: 'Dirigentes', label: '�‍🏫 Dirigentes (18+ años)' }
  ];

  // Efectos
  useEffect(() => {
    cargarScouts();
  }, []);

  useEffect(() => {
    // Cargar estadísticas después de que se carguen los scouts
    if (scouts.length >= 0) {
      cargarEstadisticas();
    }
  }, [scouts.length]);

  useEffect(() => {
    if (busqueda.trim()) {
      buscarScouts(busqueda);
    } else {
      cargarScouts();
    }
  }, [busqueda]);

  // Funciones de carga de datos
  const cargarScouts = async () => {
    try {
      setLoading(true);
      const data = await ScoutService.getAllScouts();
      setScouts(data);
    } catch (error) {
      console.error('Error al cargar scouts:', error);
      setError('Error al cargar la lista de scouts');
    } finally {
      setLoading(false);
    }
  };

  const buscarScouts = async (query: string) => {
    try {
      setLoading(true);
      const data = await ScoutService.searchScouts(query);
      setScouts(data);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setError('Error al buscar scouts');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      console.log('📊 Cargando estadísticas del dashboard...');
      
      // Primero intentar limpiar cache expirado
      try {
        await ScoutService.limpiarCacheDashboard();
      } catch (error) {
        console.log('⚠️ No se pudo limpiar cache, continuando...');
      }
      
      const data = await ScoutService.getEstadisticasGrupo();
      console.log('📊 Estadísticas recibidas:', data);
      
      // Si los datos vienen del cache pero parecen desactualizados, usar contador manual
      if (data && data.scouts && scouts.length > 0 && data.scouts.total !== scouts.length) {
        console.log('🔄 Datos del cache desactualizados, usando conteo manual');
        const estadisticasActualizadas = {
          ...data,
          scouts: {
            ...data.scouts,
            total: scouts.length,
            activos: scouts.filter(s => s.estado === 'ACTIVO').length
          }
        };
        setEstadisticas(estadisticasActualizadas);
      } else {
        setEstadisticas(data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      
      // Fallback: calcular estadísticas localmente si hay scouts cargados
      if (scouts.length > 0) {
        console.log('📊 Calculando estadísticas localmente...');
        const estadisticasLocal = {
          scouts: {
            total: scouts.length,
            activos: scouts.filter(s => s.estado === 'ACTIVO').length,
            por_rama: scouts.reduce((acc, scout) => {
              const rama = scout.rama_actual || 'Sin rama';
              acc[rama] = (acc[rama] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          },
          actividades: { planificadas: 0, en_curso: 0, este_mes: 0 },
          inventario: { items_disponibles: 0, stock_bajo: 0, valor_total: 0 }
        };
        setEstadisticas(estadisticasLocal);
      }
    }
  };

  // Funciones del formulario
  const toggleSeccion = (seccion: keyof typeof seccionesAbiertas) => {
    setSeccionesAbiertas(prev => ({
      ...prev,
      [seccion]: !prev[seccion]
    }));
  };

  const handleInputChange = (field: keyof FormularioScout, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const limpiarFormulario = () => {
    setFormData({
      nombres: '',
      apellidos: '',
      fecha_nacimiento: '',
      sexo: '',
      numero_documento: '',
      tipo_documento: 'DNI',
      celular: '',
      correo: '',
      departamento: '',
      provincia: '',
      distrito: '',
      direccion: '',
      centro_estudio: '',
      ocupacion: '',
      centro_laboral: '',
      es_dirigente: false,
      rama_actual: '',
      rama: '',
      familiar_nombres: '',
      familiar_apellidos: '',
      parentesco: '',
      familiar_celular: '',
      familiar_correo: '',
      familiar_ocupacion: ''
    });
    setModoEdicion(false);
    setScoutSeleccionado(null);
    setError(null);
  };

  const validarFormulario = (): string | null => {
    if (!formData.nombres.trim()) return 'Los nombres son obligatorios';
    if (!formData.apellidos.trim()) return 'Los apellidos son obligatorios';
    if (!formData.fecha_nacimiento) return 'La fecha de nacimiento es obligatoria';
    if (!formData.sexo) return 'El sexo es obligatorio';
    if (!formData.numero_documento.trim()) return 'El número de documento es obligatorio';
    if (formData.numero_documento.trim().length < 8) return 'El número de documento debe tener al menos 8 caracteres';
    if (!formData.rama_actual.trim()) return 'La rama es obligatoria';
    
    // Validar edad mínima (5 años mínimo según backend)
    const fechaNac = new Date(formData.fecha_nacimiento);
    const hoy = new Date();
    const edad = hoy.getFullYear() - fechaNac.getFullYear();
    if (edad < 5) return 'La edad mínima para registro es 5 años';

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

      if (modoEdicion && scoutSeleccionado) {
        // Actualizar scout existente 
        await ScoutService.updateScout(scoutSeleccionado.id, {
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          fecha_nacimiento: formData.fecha_nacimiento,
          numero_documento: formData.numero_documento,
          tipo_documento: formData.tipo_documento as any,
          celular: formData.celular,
          correo: formData.correo,
          departamento: formData.departamento,
          provincia: formData.provincia,
          distrito: formData.distrito,
          direccion: formData.direccion,
          centro_estudio: formData.centro_estudio,
          ocupacion: formData.ocupacion,
          centro_laboral: formData.centro_laboral,
          es_dirigente: formData.es_dirigente,
          rama_actual: formData.rama_actual as any
        });
      } else {
        // Registrar nuevo scout
        const resultado = await ScoutService.registrarScout({
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          fecha_nacimiento: formData.fecha_nacimiento,
          sexo: formData.sexo as 'MASCULINO' | 'FEMENINO',
          numero_documento: formData.numero_documento,
          tipo_documento: formData.tipo_documento,
          telefono: formData.celular,
          email: formData.correo,
          direccion: formData.direccion,
          distrito: formData.distrito,
          rama: formData.rama || formData.rama_actual,
          familiar_nombres: formData.familiar_nombres,
          familiar_apellidos: formData.familiar_apellidos,
          parentesco: formData.parentesco,
          familiar_telefono: formData.familiar_celular,
          familiar_email: formData.familiar_correo
        });
        
        if (!resultado.success) {
          throw new Error(resultado.error || 'Error al registrar scout');
        }
      }

      // Recargar datos
      await cargarScouts();
      await cargarEstadisticas();
      
      // Limpiar formulario
      limpiarFormulario();
      setMostrarFormulario(false);
      
    } catch (error: any) {
      console.error('Error al guardar scout:', error);
      setError(error.message || 'Error al guardar el scout');
    } finally {
      setLoading(false);
    }
  };

  const editarScout = (scout: Scout) => {
    setFormData({
      nombres: scout.nombres,
      apellidos: scout.apellidos,
      fecha_nacimiento: scout.fecha_nacimiento,
      sexo: (scout.sexo as 'MASCULINO' | 'FEMENINO') || '',
      numero_documento: scout.numero_documento,
      tipo_documento: scout.tipo_documento || 'DNI',
      celular: scout.celular || '',
      correo: scout.correo || '',
      departamento: scout.departamento || '',
      provincia: scout.provincia || '',
      distrito: scout.distrito || '',
      direccion: scout.direccion || '',
      centro_estudio: scout.centro_estudio || '',
      ocupacion: scout.ocupacion || '',
      centro_laboral: scout.centro_laboral || '',
      es_dirigente: scout.es_dirigente,
      rama_actual: scout.rama_actual || '',
      rama: scout.rama_actual || '',
      familiar_nombres: '',
      familiar_apellidos: '',
      parentesco: '',
      familiar_celular: '',
      familiar_correo: '',
      familiar_ocupacion: ''
    });
    setScoutSeleccionado(scout);
    setModoEdicion(true);
    setMostrarFormulario(true);
  };

  const calcularEdad = (fechaNacimiento: string): number => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  };

  const obtenerColorRama = (rama: string): string => {
    const colores = {
      Lobatos: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Scouts: 'bg-green-100 text-green-800 border-green-300',
      Rovers: 'bg-blue-100 text-blue-800 border-blue-300',
      Dirigentes: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colores[rama as keyof typeof colores] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const obtenerIconoRama = (rama: string): string => {
    const iconos = {
      Lobatos: '🐺',
      Scouts: '🦅',
      Rovers: '🥾',
      Dirigentes: '�‍🏫'
    };
    return iconos[rama as keyof typeof iconos] || '👤';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 md:p-6 rounded-lg mb-6 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-3">
              <UserCheck className="w-6 h-6 md:w-8 md:h-8" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold">Registro de Scouts</h1>
                <p className="text-blue-100 text-sm md:text-base">Gestiona el registro y datos de los scouts del grupo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Total Scouts</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">
                    {estadisticas.scouts?.total || 0}
                  </p>
                </div>
                <UserCheck className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Dirigentes</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">
                    {estadisticas.scouts?.dirigentes || 0}
                  </p>
                </div>
                <Users className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Nuevos este año</p>
                  <p className="text-xl md:text-2xl font-bold text-purple-600">
                    {estadisticas.scouts?.nuevos_año || 0}
                  </p>
                </div>
                <Plus className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Asistencia promedio</p>
                  <p className="text-xl md:text-2xl font-bold text-orange-600">
                    {estadisticas.asistencia_promedio ? Math.round(estadisticas.asistencia_promedio) : 0}%
                  </p>
                </div>
                <Flag className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        {/* Botón para refrescar estadísticas */}
        <div className="flex justify-end mb-4">
          <button
            onClick={async () => {
              try {
                await ScoutService.limpiarCacheDashboard();
                await cargarEstadisticas();
              } catch (error) {
                console.error('Error al refrescar:', error);
              }
            }}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            title="Refrescar estadísticas"
          >
            🔄 Actualizar Estadísticas
          </button>
        </div>

        {/* Controles principales */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido o código scout..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Botón nuevo scout */}
            <button
              onClick={() => {
                limpiarFormulario();
                setMostrarFormulario(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-sm transition-colors duration-200 w-full max-w-xs md:w-auto"
            >
              <Plus className="w-5 h-5" />
              <span className="text-base font-semibold">Nuevo Scout</span>
            </button>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Formulario de registro/edición */}
        {mostrarFormulario && (
          <div className="mb-6 bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <User className="w-6 h-6 mr-2 text-blue-600" />
                {modoEdicion ? 'Editar Scout' : 'Nuevo Scout'}
              </h2>
              <button
                onClick={() => {
                  limpiarFormulario();
                  setMostrarFormulario(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Datos Personales */}
              <div className="bg-gray-50 rounded-lg p-6">
                <button
                  type="button"
                  onClick={() => toggleSeccion('datosPersonales')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Datos Personales
                  </h3>
                  {seccionesAbiertas.datosPersonales ? 
                    <ChevronUp className="w-5 h-5 text-gray-600" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  }
                </button>

                {seccionesAbiertas.datosPersonales && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombres *
                      </label>
                      <input
                        type="text"
                        value={formData.nombres}
                        onChange={(e) => handleInputChange('nombres', e.target.value)}
                        placeholder="Nombres completos"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        value={formData.apellidos}
                        onChange={(e) => handleInputChange('apellidos', e.target.value)}
                        placeholder="Apellidos completos"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Nacimiento *
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_nacimiento}
                        onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sexo *
                      </label>
                      <select
                        value={formData.sexo}
                        onChange={(e) => handleInputChange('sexo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Seleccionar sexo</option>
                        <option value="MASCULINO">Masculino</option>
                        <option value="FEMENINO">Femenino</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Documento
                      </label>
                      <select
                        value={formData.tipo_documento}
                        onChange={(e) => handleInputChange('tipo_documento', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {tipoDocumentoOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Documento *
                      </label>
                      <input
                        type="text"
                        value={formData.numero_documento}
                        onChange={(e) => handleInputChange('numero_documento', e.target.value)}
                        placeholder="Número de documento"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Datos de Contacto */}
              <div className="bg-gray-50 rounded-lg p-6">
                <button
                  type="button"
                  onClick={() => toggleSeccion('datosContacto')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    Datos de Contacto
                  </h3>
                  {seccionesAbiertas.datosContacto ? 
                    <ChevronUp className="w-5 h-5 text-gray-600" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  }
                </button>

                {seccionesAbiertas.datosContacto && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Celular
                      </label>
                      <input
                        type="tel"
                        value={formData.celular}
                        onChange={(e) => handleInputChange('celular', e.target.value)}
                        placeholder="Número de celular"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        value={formData.correo}
                        onChange={(e) => handleInputChange('correo', e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Departamento
                      </label>
                      <input
                        type="text"
                        value={formData.departamento}
                        onChange={(e) => handleInputChange('departamento', e.target.value)}
                        placeholder="Departamento"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Provincia
                      </label>
                      <input
                        type="text"
                        value={formData.provincia}
                        onChange={(e) => handleInputChange('provincia', e.target.value)}
                        placeholder="Provincia"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Distrito
                      </label>
                      <input
                        type="text"
                        value={formData.distrito}
                        onChange={(e) => handleInputChange('distrito', e.target.value)}
                        placeholder="Distrito"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={formData.direccion}
                        onChange={(e) => handleInputChange('direccion', e.target.value)}
                        placeholder="Dirección completa"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Datos de Educación/Trabajo */}
              <div className="bg-gray-50 rounded-lg p-6">
                <button
                  type="button"
                  onClick={() => toggleSeccion('datosEducacion')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Educación y Trabajo
                  </h3>
                  {seccionesAbiertas.datosEducacion ? 
                    <ChevronUp className="w-5 h-5 text-gray-600" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  }
                </button>

                {seccionesAbiertas.datosEducacion && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Centro de Estudios
                      </label>
                      <input
                        type="text"
                        value={formData.centro_estudio}
                        onChange={(e) => handleInputChange('centro_estudio', e.target.value)}
                        placeholder="Colegio, universidad, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ocupación
                      </label>
                      <input
                        type="text"
                        value={formData.ocupacion}
                        onChange={(e) => handleInputChange('ocupacion', e.target.value)}
                        placeholder="Estudiante, profesional, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Centro Laboral
                      </label>
                      <input
                        type="text"
                        value={formData.centro_laboral}
                        onChange={(e) => handleInputChange('centro_laboral', e.target.value)}
                        placeholder="Lugar de trabajo"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Datos del Familiar */}
              <div className="bg-gray-50 rounded-lg p-6">
                <button
                  type="button"
                  onClick={() => toggleSeccion('datosFamiliar')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-600" />
                    Datos del Familiar Responsable
                  </h3>
                  {seccionesAbiertas.datosFamiliar ? 
                    <ChevronUp className="w-5 h-5 text-gray-600" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  }
                </button>

                {seccionesAbiertas.datosFamiliar && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombres del Familiar
                      </label>
                      <input
                        type="text"
                        value={formData.familiar_nombres}
                        onChange={(e) => handleInputChange('familiar_nombres', e.target.value)}
                        placeholder="Nombres del familiar"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellidos del Familiar
                      </label>
                      <input
                        type="text"
                        value={formData.familiar_apellidos}
                        onChange={(e) => handleInputChange('familiar_apellidos', e.target.value)}
                        placeholder="Apellidos del familiar"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parentesco
                      </label>
                      <select
                        value={formData.parentesco}
                        onChange={(e) => handleInputChange('parentesco', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar parentesco</option>
                        {parentescoOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Celular del Familiar
                      </label>
                      <input
                        type="tel"
                        value={formData.familiar_celular}
                        onChange={(e) => handleInputChange('familiar_celular', e.target.value)}
                        placeholder="Celular del familiar"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correo del Familiar
                      </label>
                      <input
                        type="email"
                        value={formData.familiar_correo}
                        onChange={(e) => handleInputChange('familiar_correo', e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ocupación del Familiar
                      </label>
                      <input
                        type="text"
                        value={formData.familiar_ocupacion}
                        onChange={(e) => handleInputChange('familiar_ocupacion', e.target.value)}
                        placeholder="Ocupación del familiar"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Datos Scout */}
              <div className="bg-gray-50 rounded-lg p-6">
                <button
                  type="button"
                  onClick={() => toggleSeccion('datosScout')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-orange-600" />
                    Datos Scout
                  </h3>
                  {seccionesAbiertas.datosScout ? 
                    <ChevronUp className="w-5 h-5 text-gray-600" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  }
                </button>

                {seccionesAbiertas.datosScout && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rama *
                      </label>
                      <select
                        value={formData.rama_actual}
                        onChange={(e) => {
                          handleInputChange('rama_actual', e.target.value);
                          handleInputChange('rama', e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Seleccionar rama</option>
                        {ramaOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ¿Es Dirigente?
                      </label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.es_dirigente}
                          onChange={(e) => handleInputChange('es_dirigente', e.target.checked)}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Sí, es dirigente</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones del formulario */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormulario();
                    setMostrarFormulario(false);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {loading ? 'Guardando...' : (modoEdicion ? 'Actualizar Scout' : 'Registrar Scout')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de scouts */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-600" />
              Lista de Scouts ({scouts.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Cargando scouts...</p>
            </div>
          ) : scouts.length === 0 ? (
            <div className="p-8 text-center">
              <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay scouts registrados</h3>
              <p className="text-gray-600">
                {busqueda ? 'No se encontraron scouts con ese criterio de búsqueda' : 'Registra el primer scout para empezar'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {scouts.map((scout) => (
                <div key={scout.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">{obtenerIconoRama(scout.rama_actual || '')}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {scout.nombres} {scout.apellidos}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Código: {scout.codigo_scout}</span>
                            <span>•</span>
                            <span>Edad: {calcularEdad(scout.fecha_nacimiento)} años</span>
                            {scout.es_dirigente && (
                              <>
                                <span>•</span>
                                <span className="text-orange-600 font-medium">DIRIGENTE</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full border text-xs font-medium ${obtenerColorRama(scout.rama_actual || '')}`}>
                          {(scout.rama_actual || '').toUpperCase()}
                        </span>
                        
                        {scout.celular && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {scout.celular}
                          </span>
                        )}
                        
                        {scout.correo && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {scout.correo}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => editarScout(scout)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar scout"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          // TODO: Implementar vista de perfil completo
                          console.log('Ver perfil:', scout.id);
                        }}
                        className="text-green-600 hover:text-green-800"
                        title="Ver perfil completo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
