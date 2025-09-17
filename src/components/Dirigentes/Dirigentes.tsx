import { useState } from 'react';
import { Shield, Save, UserPlus, Trash2, Search, Clock, Award } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';

interface DirigenteStraslado {
  id: string;
  rama: string;
  fechaIngreso: string;
  fechaSalida?: string;
  activo: boolean;
}

interface Dirigente {
  id: string;
  nombre: string;
  fechaIngresoGeneral: string;
  ramaActual: string;
  telefono: string;
  correo: string;
  historialRamas: DirigenteStraslado[];
  activo: boolean;
}

export default function Dirigentes() {
  const [formData, setFormData] = useState({
    nombre: '',
    fechaIngresoGeneral: '',
    rama: '',
    usarFechaGeneral: false,
    telefono: '',
    correo: ''
  });

  const [dirigentes, setDirigentes] = useState<Dirigente[]>([
    {
      id: '1',
      nombre: 'Carlos Mendoza Torres',
      fechaIngresoGeneral: '15-01-2020',
      ramaActual: 'Tropa',
      telefono: '987654321',
      correo: 'carlos.mendoza@email.com',
      historialRamas: [
        {
          id: '1',
          rama: 'Manada',
          fechaIngreso: '15-01-2020',
          fechaSalida: '10-03-2022',
          activo: false
        },
        {
          id: '2',
          rama: 'Tropa',
          fechaIngreso: '11-03-2022',
          activo: true
        }
      ],
      activo: true
    }
  ]);

  const ramas = [
    { value: 'Manada', label: 'Manada (7-10 años)' },
    { value: 'Tropa', label: 'Tropa (11-14 años)' },
    { value: 'Caminante', label: 'Caminante (15-17 años)' },
    { value: 'Clan', label: 'Clan (18-21 años)' }
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calcularTiempoEnRama = (fechaIngreso: string, fechaSalida?: string) => {
    const inicio = new Date(fechaIngreso.split('-').reverse().join('-'));
    const fin = fechaSalida ? new Date(fechaSalida.split('-').reverse().join('-')) : new Date();
    
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} año${years > 1 ? 's' : ''} ${months > 0 ? `${months} mes${months > 1 ? 'es' : ''}` : ''}`;
    }
    return `${months} mes${months > 1 ? 'es' : ''}`;
  };

  const handleSave = () => {
    const fechaIngresoRama = formData.usarFechaGeneral ? formData.fechaIngresoGeneral : new Date().toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');

    const nuevoDirigente: Dirigente = {
      id: (dirigentes.length + 1).toString(),
      nombre: formData.nombre,
      fechaIngresoGeneral: formData.fechaIngresoGeneral,
      ramaActual: formData.rama,
      telefono: formData.telefono,
      correo: formData.correo,
      historialRamas: [
        {
          id: '1',
          rama: formData.rama,
          fechaIngreso: fechaIngresoRama,
          activo: true
        }
      ],
      activo: true
    };

    setDirigentes(prev => [nuevoDirigente, ...prev]);
    setFormData({
      nombre: '',
      fechaIngresoGeneral: '',
      rama: '',
      usarFechaGeneral: false,
      telefono: '',
      correo: ''
    });
  };

  const handleDelete = (id: string) => {
    setDirigentes(prev => prev.filter(dirigente => dirigente.id !== id));
  };

  const handleTrasladoRama = (dirigenteId: string, nuevaRama: string) => {
    setDirigentes(prev => prev.map(dirigente => {
      if (dirigente.id === dirigenteId) {
        const historialActualizado = dirigente.historialRamas.map(historial => ({
          ...historial,
          activo: false,
          fechaSalida: historial.activo ? new Date().toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).replace(/\//g, '-') : historial.fechaSalida
        }));

        historialActualizado.push({
          id: (historialActualizado.length + 1).toString(),
          rama: nuevaRama,
          fechaIngreso: new Date().toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).replace(/\//g, '-'),
          fechaSalida: undefined,
          activo: true
        });

        return {
          ...dirigente,
          ramaActual: nuevaRama,
          historialRamas: historialActualizado
        };
      }
      return dirigente;
    }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dirigentes Scout</h1>
        <p className="text-gray-600">Administración de dirigentes y sus asignaciones por rama</p>
      </div>

      {/* Formulario de Registro */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <UserPlus className="w-5 h-5 mr-2 text-orange-600" />
          Registrar Nuevo Dirigente
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <FormField label="Dirigente Scout">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                placeholder="Buscar Boy Scout registrado"
                className="pl-10"
              />
            </div>
            <small className="text-gray-500 mt-1">
              Busca si ya está registrado como scout
            </small>
          </FormField>

          <FormField label="Fecha de Ingreso como Dirigente">
            <Input
              type="date"
              value={formData.fechaIngresoGeneral}
              onChange={(e) => handleInputChange('fechaIngresoGeneral', e.target.value)}
            />
            <small className="text-gray-500 mt-1">Formato: DD-MM-AAAA</small>
          </FormField>

          <FormField label="Rama Asignada">
            <Select
              value={formData.rama}
              onChange={(e) => handleInputChange('rama', e.target.value)}
              options={ramas}
              placeholder="Seleccionar rama"
            />
          </FormField>

          <FormField label="Teléfono">
            <Input
              value={formData.telefono}
              onChange={(e) => handleInputChange('telefono', e.target.value)}
              placeholder="987654321"
            />
          </FormField>

          <FormField label="Correo Electrónico">
            <Input
              type="email"
              value={formData.correo}
              onChange={(e) => handleInputChange('correo', e.target.value)}
              placeholder="ejemplo@correo.com"
            />
          </FormField>
        </div>

        <div className="mb-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.usarFechaGeneral}
              onChange={(e) => handleInputChange('usarFechaGeneral', e.target.checked)}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-gray-700">
              Usar la misma fecha de ingreso para esta rama específica
            </span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Registrar Dirigente
          </button>
        </div>
      </div>

      {/* Tabla de Dirigentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-orange-600" />
          Dirigentes Actuales ({dirigentes.filter(d => d.activo).length} activos)
        </h2>

        <div className="space-y-6">
          {dirigentes.map((dirigente) => (
            <div key={dirigente.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{dirigente.nombre}</h3>
                    <p className="text-sm text-gray-600">
                      Dirigente desde: {dirigente.fechaIngresoGeneral}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    {dirigente.ramaActual}
                  </span>
                  <Select
                    value=""
                    onChange={(e) => e.target.value && handleTrasladoRama(dirigente.id, e.target.value)}
                    options={[
                      { value: '', label: 'Trasladar a...' },
                      ...ramas.filter(rama => rama.value !== dirigente.ramaActual)
                    ]}
                    className="text-sm"
                  />
                  <button
                    onClick={() => handleDelete(dirigente.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Eliminar dirigente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Historial de Ramas
                </h4>
                <div className="space-y-2">
                  {dirigente.historialRamas.map((historial) => (
                    <div key={historial.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <Award className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-800">{historial.rama}</span>
                        <span className="text-sm text-gray-600">
                          {historial.fechaIngreso} {historial.fechaSalida ? `- ${historial.fechaSalida}` : '- Presente'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">
                          {calcularTiempoEnRama(historial.fechaIngreso, historial.fechaSalida)}
                        </span>
                        {historial.activo && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Actual
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Contacto: {dirigente.telefono} | {dirigente.correo}</span>
                  <span>
                    Tiempo total como dirigente: {calcularTiempoEnRama(dirigente.fechaIngresoGeneral)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {dirigentes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay dirigentes registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}