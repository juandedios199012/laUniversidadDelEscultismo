import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Target, 
  Plus, 
  Trash2, 
  Save,
  Users,
  Award,
  Timer
} from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';
import { AREAS_CRECIMIENTO } from '../../data/constants';

interface Actividad {
  id: string;
  horaInicial: string;
  horaFinal: string;
  duracion: string;
  nombre: string;
  responsable: string;
  desarrollo: string;
  materiales: string;
  puntajes: Record<string, number>;
}

interface ProgramaData {
  rama: string;
  fecha: string;
  responsable: string;
  objetivo: string;
  areasCrecimiento: string[];
  actividades: Actividad[];
}

export default function ProgramaSemanal() {
  const [formData, setFormData] = useState<ProgramaData>({
    rama: '',
    fecha: '',
    responsable: '',
    objetivo: '',
    areasCrecimiento: [],
    actividades: []
  });

  const [programas, setProgramas] = useState([
    {
      id: 1,
      rama: 'Tropa',
      fecha: '2024-01-20',
      responsable: 'Carlos Mendoza',
      objetivo: 'Desarrollar habilidades de campismo y trabajo en equipo',
      areasCrecimiento: ['Corporalidad', 'Sociabilidad'],
      actividades: [
        {
          id: '1',
          horaInicial: '15:00',
          horaFinal: '15:30',
          duracion: '0:30',
          nombre: 'Ceremonia de Apertura',
          responsable: 'Carlos Mendoza',
          desarrollo: 'Formación, saludo a la bandera y oración scout',
          materiales: 'Bandera, silbato',
          puntajes: { 'Fénix': 10, 'Águila': 10, 'Cóndor': 10 }
        },
        {
          id: '2',
          horaInicial: '15:30',
          horaFinal: '16:15',
          duracion: '0:45',
          nombre: 'Taller de Nudos',
          responsable: 'María González',
          desarrollo: 'Práctica de nudos básicos: llano, ballestrinque, as de guía',
          materiales: 'Cuerdas, manual de nudos',
          puntajes: { 'Fénix': 15, 'Águila': 12, 'Cóndor': 18 }
        }
      ]
    }
  ]);

  const ramas = [
    { value: 'Manada', label: 'Manada (7-10 años)' },
    { value: 'Tropa', label: 'Tropa (11-14 años)' },
    { value: 'Caminante', label: 'Caminante (15-17 años)' },
    { value: 'Clan', label: 'Clan (18-21 años)' }
  ];

  const dirigentes = [
    { value: 'carlos-mendoza', label: 'Carlos Mendoza' },
    { value: 'maria-gonzalez', label: 'María González' },
    { value: 'pedro-lopez', label: 'Pedro López' },
    { value: 'ana-torres', label: 'Ana Torres' }
  ];

  const patrullas = ['Fénix', 'Águila', 'Cóndor', 'Jaguar'];

  const calcularDuracion = (horaInicial: string, horaFinal: string): string => {
    if (!horaInicial || !horaFinal) return '';
    
    const [horaIni, minIni] = horaInicial.split(':').map(Number);
    const [horaFin, minFin] = horaFinal.split(':').map(Number);
    
    const minutosIni = horaIni * 60 + minIni;
    const minutosFin = horaFin * 60 + minFin;
    
    const diferencia = minutosFin - minutosIni;
    const horas = Math.floor(diferencia / 60);
    const minutos = diferencia % 60;
    
    return `${horas}:${minutos.toString().padStart(2, '0')}`;
  };

  const agregarActividad = () => {
    const nuevaActividad: Actividad = {
      id: Date.now().toString(),
      horaInicial: '',
      horaFinal: '',
      duracion: '',
      nombre: '',
      responsable: '',
      desarrollo: '',
      materiales: '',
      puntajes: {}
    };
    
    setFormData(prev => ({
      ...prev,
      actividades: [...prev.actividades, nuevaActividad]
    }));
  };

  const eliminarActividad = (id: string) => {
    setFormData(prev => ({
      ...prev,
      actividades: prev.actividades.filter(act => act.id !== id)
    }));
  };

  const actualizarActividad = (id: string, campo: string, valor: any) => {
    setFormData(prev => ({
      ...prev,
      actividades: prev.actividades.map(act => {
        if (act.id === id) {
          const actividadActualizada = { ...act, [campo]: valor };
          
          // Calcular duración automáticamente
          if (campo === 'horaInicial' || campo === 'horaFinal') {
            actividadActualizada.duracion = calcularDuracion(
              actividadActualizada.horaInicial,
              actividadActualizada.horaFinal
            );
          }
          
          return actividadActualizada;
        }
        return act;
      })
    }));
  };

  const actualizarPuntaje = (actividadId: string, patrulla: string, puntaje: number) => {
    setFormData(prev => ({
      ...prev,
      actividades: prev.actividades.map(act => {
        if (act.id === actividadId) {
          return {
            ...act,
            puntajes: { ...act.puntajes, [patrulla]: puntaje }
          };
        }
        return act;
      })
    }));
  };

  const handleAreasCrecimientoChange = (area: string) => {
    setFormData(prev => ({
      ...prev,
      areasCrecimiento: prev.areasCrecimiento.includes(area)
        ? prev.areasCrecimiento.filter(a => a !== area)
        : [...prev.areasCrecimiento, area]
    }));
  };

  const guardarPrograma = () => {
    const nuevoPrograma = {
      id: programas.length + 1,
      ...formData
    };
    
    setProgramas([nuevoPrograma, ...programas]);
    
    // Limpiar formulario
    setFormData({
      rama: '',
      fecha: '',
      responsable: '',
      objetivo: '',
      areasCrecimiento: [],
      actividades: []
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Programa Semanal</h1>
        <p className="text-gray-600">Planificación detallada de actividades semanales por rama</p>
      </div>

      {/* Formulario de Nuevo Programa */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Nuevo Programa Semanal</h2>
        
        {/* Datos de Cabecera */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <FormField label="Rama">
            <Select
              value={formData.rama}
              onChange={(e) => setFormData(prev => ({ ...prev, rama: e.target.value }))}
              options={ramas}
              placeholder="Seleccionar rama"
            />
          </FormField>

          <FormField label="Fecha">
            <Input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
            />
          </FormField>

          <FormField label="Responsable">
            <Select
              value={formData.responsable}
              onChange={(e) => setFormData(prev => ({ ...prev, responsable: e.target.value }))}
              options={dirigentes}
              placeholder="Seleccionar dirigente"
            />
          </FormField>

          <FormField label="Objetivo">
            <Input
              value={formData.objetivo}
              onChange={(e) => setFormData(prev => ({ ...prev, objetivo: e.target.value }))}
              placeholder="Objetivo del programa"
            />
          </FormField>
        </div>

        {/* Áreas de Crecimiento */}
        <FormField label="Áreas de Crecimiento" className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {AREAS_CRECIMIENTO.map((area) => (
              <label key={area} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.areasCrecimiento.includes(area)}
                  onChange={() => handleAreasCrecimientoChange(area)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{area}</span>
              </label>
            ))}
          </div>
        </FormField>

        {/* Actividades */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">Actividades</h3>
            <button
              onClick={agregarActividad}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Actividad</span>
            </button>
          </div>

          <div className="space-y-6">
            {formData.actividades.map((actividad, index) => (
              <div key={actividad.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-800">Actividad {index + 1}</h4>
                  <button
                    onClick={() => eliminarActividad(actividad.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <FormField label="Hora Inicial">
                    <Input
                      type="time"
                      value={actividad.horaInicial}
                      onChange={(e) => actualizarActividad(actividad.id, 'horaInicial', e.target.value)}
                    />
                  </FormField>

                  <FormField label="Hora Final">
                    <Input
                      type="time"
                      value={actividad.horaFinal}
                      onChange={(e) => actualizarActividad(actividad.id, 'horaFinal', e.target.value)}
                    />
                  </FormField>

                  <FormField label="Duración">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                      <Timer className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{actividad.duracion || '0:00'}</span>
                    </div>
                  </FormField>

                  <FormField label="Responsable">
                    <Select
                      value={actividad.responsable}
                      onChange={(e) => actualizarActividad(actividad.id, 'responsable', e.target.value)}
                      options={dirigentes}
                      placeholder="Seleccionar"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <FormField label="Nombre de la Actividad">
                    <Input
                      value={actividad.nombre}
                      onChange={(e) => actualizarActividad(actividad.id, 'nombre', e.target.value)}
                      placeholder="Ej: Taller de nudos"
                    />
                  </FormField>

                  <FormField label="Materiales">
                    <Input
                      value={actividad.materiales}
                      onChange={(e) => actualizarActividad(actividad.id, 'materiales', e.target.value)}
                      placeholder="Ej: Cuerdas, manual, silbato"
                    />
                  </FormField>
                </div>

                <FormField label="Desarrollo" className="mb-4">
                  <textarea
                    rows={3}
                    value={actividad.desarrollo}
                    onChange={(e) => actualizarActividad(actividad.id, 'desarrollo', e.target.value)}
                    placeholder="Describe cómo se desarrollará la actividad..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </FormField>

                {/* Puntajes por Patrulla */}
                <FormField label="Puntajes por Patrulla">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {patrullas.map((patrulla) => (
                      <div key={patrulla} className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 min-w-0 flex-1">
                          {patrulla}:
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          value={actividad.puntajes[patrulla] || ''}
                          onChange={(e) => actualizarPuntaje(actividad.id, patrulla, parseInt(e.target.value) || 0)}
                          className="w-16 text-center"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </FormField>
              </div>
            ))}
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end">
          <button
            onClick={guardarPrograma}
            disabled={!formData.rama || !formData.fecha || !formData.responsable}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Programa</span>
          </button>
        </div>
      </div>

      {/* Lista de Programas Existentes */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Programas Registrados</h2>
        
        {programas.map((programa) => (
          <div key={programa.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Cabecera del Programa */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Programa {programa.rama}
                    </h3>
                    <p className="text-sm text-gray-600">{programa.fecha}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Responsable</p>
                  <p className="font-medium text-gray-800">{programa.responsable}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Objetivo</p>
                  <p className="text-gray-800">{programa.objetivo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Áreas de Crecimiento</p>
                  <div className="flex flex-wrap gap-1">
                    {programa.areasCrecimiento.map((area) => (
                      <span
                        key={area}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actividades */}
            <div className="p-6">
              <h4 className="font-medium text-gray-800 mb-4">Actividades Programadas</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Horario</th>
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Actividad</th>
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Responsable</th>
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Duración</th>
                      <th className="text-center py-3 text-sm font-medium text-gray-600">Puntajes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programa.actividades.map((actividad) => (
                      <tr key={actividad.id} className="border-b border-gray-100">
                        <td className="py-3">
                          <div className="flex items-center space-x-1 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{actividad.horaInicial} - {actividad.horaFinal}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="font-medium text-gray-800">{actividad.nombre}</p>
                            <p className="text-sm text-gray-600">{actividad.desarrollo}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{actividad.responsable}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            {actividad.duracion}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex justify-center space-x-2">
                            {Object.entries(actividad.puntajes).map(([patrulla, puntaje]) => (
                              <span
                                key={patrulla}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                              >
                                {patrulla}: {puntaje}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}