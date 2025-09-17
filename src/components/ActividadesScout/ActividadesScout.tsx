import { useState } from 'react';
import { Calendar, Users, MapPin, Save, Clock, Star, Trophy, Edit, Trash2, Plus } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';

interface Actividad {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lugar: string;
  rama: string;
  responsable: string;
  participantes: string[];
  materialesNecesarios: string[];
  estado: 'planificada' | 'en-curso' | 'finalizada' | 'cancelada';
  objetivos: string[];
  costo: number;
  observaciones: string;
}

export default function ActividadesScout() {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    lugar: '',
    rama: '',
    responsable: '',
    participantes: '',
    materialesNecesarios: '',
    objetivos: '',
    costo: '',
    observaciones: ''
  });

  const [actividades, setActividades] = useState<Actividad[]>([
    {
      id: '1',
      titulo: 'Campamento de Fin de Semana',
      descripcion: 'Campamento de dos días en la naturaleza con actividades de supervivencia y trabajo en equipo',
      tipo: 'Campamento',
      fecha: '2024-04-15',
      horaInicio: '08:00',
      horaFin: '18:00',
      lugar: 'Parque Nacional Huascarán',
      rama: 'Tropa',
      responsable: 'Carlos Mendoza',
      participantes: ['Juan Pérez', 'María García', 'Luis Torres'],
      materialesNecesarios: ['Carpas', 'Sacos de dormir', 'Cocina portátil', 'Primeros auxilios'],
      estado: 'planificada',
      objetivos: ['Fortalecer el trabajo en equipo', 'Desarrollar habilidades de supervivencia', 'Conectar con la naturaleza'],
      costo: 150,
      observaciones: 'Confirmar permisos del parque nacional'
    },
    {
      id: '2',
      titulo: 'Servicio Comunitario - Limpieza de Playa',
      descripcion: 'Actividad de servicio a la comunidad limpiando la playa local',
      tipo: 'Servicio Comunitario',
      fecha: '2024-03-25',
      horaInicio: '09:00',
      horaFin: '14:00',
      lugar: 'Playa Chorrillos',
      rama: 'Caminante',
      responsable: 'Ana Rodríguez',
      participantes: ['Carlos Silva', 'Patricia López', 'Diego Morales'],
      materialesNecesarios: ['Bolsas de basura', 'Guantes', 'Sombreros', 'Protector solar'],
      estado: 'finalizada',
      objetivos: ['Desarrollar conciencia ambiental', 'Servir a la comunidad', 'Trabajar en equipo'],
      costo: 0,
      observaciones: 'Excelente participación de los scouts'
    },
    {
      id: '3',
      titulo: 'Taller de Nudos y Amarres',
      descripcion: 'Sesión práctica de aprendizaje de nudos básicos y técnicas de amarre',
      tipo: 'Taller',
      fecha: '2024-03-30',
      horaInicio: '15:00',
      horaFin: '17:00',
      lugar: 'Local del Grupo Scout',
      rama: 'Manada',
      responsable: 'Pedro González',
      participantes: ['Sofía Vega', 'Andrés Castro', 'Lucía Herrera'],
      materialesNecesarios: ['Cuerdas', 'Palos de madera', 'Manual de nudos'],
      estado: 'en-curso',
      objetivos: ['Aprender nudos básicos', 'Desarrollar habilidades manuales', 'Preparación para campamentos'],
      costo: 25,
      observaciones: ''
    }
  ]);

  const [modoEdicion, setModoEdicion] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroRama, setFiltroRama] = useState('');

  const tiposActividad = [
    { value: 'Campamento', label: 'Campamento' },
    { value: 'Excursión', label: 'Excursión' },
    { value: 'Taller', label: 'Taller' },
    { value: 'Servicio Comunitario', label: 'Servicio Comunitario' },
    { value: 'Juego', label: 'Juego' },
    { value: 'Ceremonia', label: 'Ceremonia' },
    { value: 'Competencia', label: 'Competencia' },
    { value: 'Capacitación', label: 'Capacitación' }
  ];

  const ramas = [
    { value: 'Manada', label: 'Manada (7-10 años)' },
    { value: 'Tropa', label: 'Tropa (11-14 años)' },
    { value: 'Caminante', label: 'Caminante (15-17 años)' },
    { value: 'Clan', label: 'Clan (18-21 años)' },
    { value: 'Todas', label: 'Todas las Ramas' }
  ];

  const estados = [
    { value: 'planificada', label: 'Planificada' },
    { value: 'en-curso', label: 'En Curso' },
    { value: 'finalizada', label: 'Finalizada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const nuevaActividad: Actividad = {
      id: modoEdicion || (actividades.length + 1).toString(),
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      tipo: formData.tipo,
      fecha: formData.fecha,
      horaInicio: formData.horaInicio,
      horaFin: formData.horaFin,
      lugar: formData.lugar,
      rama: formData.rama,
      responsable: formData.responsable,
      participantes: formData.participantes.split(',').map(p => p.trim()).filter(p => p),
      materialesNecesarios: formData.materialesNecesarios.split(',').map(m => m.trim()).filter(m => m),
      estado: 'planificada',
      objetivos: formData.objetivos.split(',').map(o => o.trim()).filter(o => o),
      costo: parseFloat(formData.costo) || 0,
      observaciones: formData.observaciones
    };

    if (modoEdicion) {
      setActividades(prev => prev.map(act => 
        act.id === modoEdicion ? { ...nuevaActividad, estado: act.estado } : act
      ));
      setModoEdicion(null);
    } else {
      setActividades(prev => [nuevaActividad, ...prev]);
    }

    // Limpiar formulario
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: '',
      fecha: '',
      horaInicio: '',
      horaFin: '',
      lugar: '',
      rama: '',
      responsable: '',
      participantes: '',
      materialesNecesarios: '',
      objetivos: '',
      costo: '',
      observaciones: ''
    });
  };

  const handleEdit = (actividad: Actividad) => {
    setFormData({
      titulo: actividad.titulo,
      descripcion: actividad.descripcion,
      tipo: actividad.tipo,
      fecha: actividad.fecha,
      horaInicio: actividad.horaInicio,
      horaFin: actividad.horaFin,
      lugar: actividad.lugar,
      rama: actividad.rama,
      responsable: actividad.responsable,
      participantes: actividad.participantes.join(', '),
      materialesNecesarios: actividad.materialesNecesarios.join(', '),
      objetivos: actividad.objetivos.join(', '),
      costo: actividad.costo.toString(),
      observaciones: actividad.observaciones
    });
    setModoEdicion(actividad.id);
  };

  const handleDelete = (id: string) => {
    setActividades(prev => prev.filter(act => act.id !== id));
  };

  const handleCambiarEstado = (id: string, nuevoEstado: string) => {
    setActividades(prev => prev.map(act => 
      act.id === id ? { ...act, estado: nuevoEstado as Actividad['estado'] } : act
    ));
  };

  const getEstadoColor = (estado: string) => {
    const colores = {
      'planificada': 'bg-blue-100 text-blue-800',
      'en-curso': 'bg-yellow-100 text-yellow-800',
      'finalizada': 'bg-green-100 text-green-800',
      'cancelada': 'bg-red-100 text-red-800'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const getTipoIcon = (tipo: string) => {
    const iconos = {
      'Campamento': <MapPin className="w-4 h-4" />,
      'Excursión': <MapPin className="w-4 h-4" />,
      'Taller': <Star className="w-4 h-4" />,
      'Servicio Comunitario': <Users className="w-4 h-4" />,
      'Juego': <Trophy className="w-4 h-4" />,
      'Ceremonia': <Star className="w-4 h-4" />,
      'Competencia': <Trophy className="w-4 h-4" />,
      'Capacitación': <Star className="w-4 h-4" />
    };
    return iconos[tipo as keyof typeof iconos] || <Calendar className="w-4 h-4" />;
  };

  const actividadesFiltradas = actividades.filter(actividad => {
    const cumpleEstado = !filtroEstado || actividad.estado === filtroEstado;
    const cumpleRama = !filtroRama || actividad.rama === filtroRama || filtroRama === 'Todas';
    return cumpleEstado && cumpleRama;
  });

  const estadisticas = {
    total: actividades.length,
    planificadas: actividades.filter(a => a.estado === 'planificada').length,
    enCurso: actividades.filter(a => a.estado === 'en-curso').length,
    finalizadas: actividades.filter(a => a.estado === 'finalizada').length,
    costoTotal: actividades.reduce((sum, a) => sum + a.costo, 0)
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Actividades Scout</h1>
        <p className="text-gray-600">Planificación y gestión de actividades del grupo scout</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-800">{estadisticas.total}</div>
              <div className="text-sm text-gray-600">Total Actividades</div>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{estadisticas.planificadas}</div>
              <div className="text-sm text-gray-600">Planificadas</div>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600">{estadisticas.enCurso}</div>
              <div className="text-sm text-gray-600">En Curso</div>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{estadisticas.finalizadas}</div>
              <div className="text-sm text-gray-600">Finalizadas</div>
            </div>
            <Trophy className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">S/{estadisticas.costoTotal}</div>
              <div className="text-sm text-gray-600">Costo Total</div>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-green-600" />
          {modoEdicion ? 'Editar Actividad' : 'Nueva Actividad'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <FormField label="Título de la Actividad">
            <Input
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              placeholder="Nombre de la actividad"
            />
          </FormField>

          <FormField label="Tipo de Actividad">
            <Select
              value={formData.tipo}
              onChange={(e) => handleInputChange('tipo', e.target.value)}
              options={tiposActividad}
              placeholder="Seleccionar tipo"
            />
          </FormField>

          <FormField label="Rama">
            <Select
              value={formData.rama}
              onChange={(e) => handleInputChange('rama', e.target.value)}
              options={ramas}
              placeholder="Seleccionar rama"
            />
          </FormField>
        </div>

        <div className="mb-6">
          <FormField label="Descripción">
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              placeholder="Descripción detallada de la actividad"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <FormField label="Fecha">
            <Input
              type="date"
              value={formData.fecha}
              onChange={(e) => handleInputChange('fecha', e.target.value)}
            />
          </FormField>

          <FormField label="Hora Inicio">
            <Input
              type="time"
              value={formData.horaInicio}
              onChange={(e) => handleInputChange('horaInicio', e.target.value)}
            />
          </FormField>

          <FormField label="Hora Fin">
            <Input
              type="time"
              value={formData.horaFin}
              onChange={(e) => handleInputChange('horaFin', e.target.value)}
            />
          </FormField>

          <FormField label="Costo (S/)">
            <Input
              type="number"
              value={formData.costo}
              onChange={(e) => handleInputChange('costo', e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormField label="Lugar">
            <Input
              value={formData.lugar}
              onChange={(e) => handleInputChange('lugar', e.target.value)}
              placeholder="Ubicación de la actividad"
            />
          </FormField>

          <FormField label="Responsable">
            <Input
              value={formData.responsable}
              onChange={(e) => handleInputChange('responsable', e.target.value)}
              placeholder="Dirigente responsable"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <FormField label="Participantes">
            <Input
              value={formData.participantes}
              onChange={(e) => handleInputChange('participantes', e.target.value)}
              placeholder="Nombres separados por comas"
            />
            <small className="text-gray-500 mt-1">Separar nombres con comas</small>
          </FormField>

          <FormField label="Materiales Necesarios">
            <Input
              value={formData.materialesNecesarios}
              onChange={(e) => handleInputChange('materialesNecesarios', e.target.value)}
              placeholder="Materiales separados por comas"
            />
            <small className="text-gray-500 mt-1">Separar materiales con comas</small>
          </FormField>

          <FormField label="Objetivos">
            <Input
              value={formData.objetivos}
              onChange={(e) => handleInputChange('objetivos', e.target.value)}
              placeholder="Objetivos separados por comas"
            />
            <small className="text-gray-500 mt-1">Separar objetivos con comas</small>
          </FormField>
        </div>

        <div className="mb-6">
          <FormField label="Observaciones">
            <textarea
              value={formData.observaciones}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              placeholder="Observaciones adicionales"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </FormField>
        </div>

        <div className="flex justify-end space-x-4">
          {modoEdicion && (
            <button
              onClick={() => {
                setModoEdicion(null);
                setFormData({
                  titulo: '', descripcion: '', tipo: '', fecha: '', horaInicio: '',
                  horaFin: '', lugar: '', rama: '', responsable: '', participantes: '',
                  materialesNecesarios: '', objetivos: '', costo: '', observaciones: ''
                });
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {modoEdicion ? 'Actualizar' : 'Guardar'} Actividad
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Estado">
            <Select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              options={[{ value: '', label: 'Todos los estados' }, ...estados]}
            />
          </FormField>

          <FormField label="Rama">
            <Select
              value={filtroRama}
              onChange={(e) => setFiltroRama(e.target.value)}
              options={[{ value: '', label: 'Todas las ramas' }, ...ramas]}
            />
          </FormField>
        </div>
      </div>

      {/* Lista de Actividades */}
      <div className="space-y-6">
        {actividadesFiltradas.map(actividad => (
          <div key={actividad.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {getTipoIcon(actividad.tipo)}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{actividad.titulo}</h3>
                  <p className="text-gray-600 mb-3">{actividad.descripcion}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(actividad.fecha).toLocaleDateString('es-PE')}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {actividad.horaInicio} - {actividad.horaFin}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {actividad.lugar}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {actividad.rama}
                    </span>
                    {actividad.costo > 0 && (
                      <span className="font-medium text-green-600">
                        S/{actividad.costo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(actividad.estado)}`}>
                  {actividad.estado.charAt(0).toUpperCase() + actividad.estado.slice(1)}
                </span>
                
                <Select
                  value={actividad.estado}
                  onChange={(e) => handleCambiarEstado(actividad.id, e.target.value)}
                  options={estados}
                  className="text-sm"
                />

                <button
                  onClick={() => handleEdit(actividad)}
                  className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Editar actividad"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDelete(actividad.id)}
                  className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                  title="Eliminar actividad"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Participantes ({actividad.participantes.length})</h4>
                <div className="space-y-1">
                  {actividad.participantes.slice(0, 3).map((participante, index) => (
                    <div key={index} className="text-sm text-gray-600">• {participante}</div>
                  ))}
                  {actividad.participantes.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{actividad.participantes.length - 3} más...
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Materiales Necesarios</h4>
                <div className="space-y-1">
                  {actividad.materialesNecesarios.slice(0, 3).map((material, index) => (
                    <div key={index} className="text-sm text-gray-600">• {material}</div>
                  ))}
                  {actividad.materialesNecesarios.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{actividad.materialesNecesarios.length - 3} más...
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Objetivos</h4>
                <div className="space-y-1">
                  {actividad.objetivos.slice(0, 3).map((objetivo, index) => (
                    <div key={index} className="text-sm text-gray-600">• {objetivo}</div>
                  ))}
                  {actividad.objetivos.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{actividad.objetivos.length - 3} más...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {actividad.observaciones && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Observaciones</h4>
                <p className="text-sm text-gray-600">{actividad.observaciones}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {actividadesFiltradas.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No hay actividades registradas</h3>
          <p>Crea la primera actividad para empezar la planificación</p>
        </div>
      )}
    </div>
  );
}