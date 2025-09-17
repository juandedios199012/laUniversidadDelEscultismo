import { useState } from 'react';
import { Users, Calendar, Save, UserPlus, Trash2, Search } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';

interface ComitePadre {
  id: string;
  nombre: string;
  cargo: string;
  fechaEleccion: string;
  fechaCulminacion: string;
  periodo: string;
  telefono: string;
  correo: string;
}

export default function ComitePadres() {
  const [formData, setFormData] = useState({
    nombre: '',
    cargo: '',
    fechaEleccion: '',
    fechaCulminacion: '',
    telefono: '',
    correo: ''
  });

  const [comiteActual, setComiteActual] = useState<ComitePadre[]>([
    {
      id: '1',
      nombre: 'María González López',
      cargo: 'Presidente(a)',
      fechaEleccion: '15-03-2024',
      fechaCulminacion: '15-03-2025',
      periodo: '2024-2025',
      telefono: '987654321',
      correo: 'maria.gonzalez@email.com'
    },
    {
      id: '2',
      nombre: 'Carlos Mendoza Torres',
      cargo: 'Tesorero(a)',
      fechaEleccion: '15-03-2024',
      fechaCulminacion: '15-03-2025',
      periodo: '2024-2025',
      telefono: '912345678',
      correo: 'carlos.mendoza@email.com'
    }
  ]);

  const cargos = [
    { value: 'presidente', label: 'Presidente(a)' },
    { value: 'secretario', label: 'Secretario(a)' },
    { value: 'tesorero', label: 'Tesorero(a)' },
    { value: 'vocal', label: 'Vocal' }
  ];

  const calcularPeriodo = (fechaEleccion: string, fechaCulminacion: string) => {
    if (!fechaEleccion || !fechaCulminacion) return '';
    
    const anoE = fechaEleccion.split('-')[0];
    const anoC = fechaCulminacion.split('-')[0];
    
    return `${anoE}-${anoC}`;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      return newData;
    });
  };

  const handleSave = () => {
    const periodo = calcularPeriodo(formData.fechaEleccion, formData.fechaCulminacion);
    
    const nuevoMiembro: ComitePadre = {
      id: (comiteActual.length + 1).toString(),
      ...formData,
      periodo
    };

    setComiteActual(prev => [nuevoMiembro, ...prev]);
    setFormData({
      nombre: '',
      cargo: '',
      fechaEleccion: '',
      fechaCulminacion: '',
      telefono: '',
      correo: ''
    });
  };

  const handleDelete = (id: string) => {
    setComiteActual(prev => prev.filter(miembro => miembro.id !== id));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Comité de Padres</h1>
        <p className="text-gray-600">Gestión del comité de padres de familia que representa al grupo scout</p>
      </div>

      {/* Formulario de Registro */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
          Registrar Nuevo Miembro del Comité
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <FormField label="Nombre Completo">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                placeholder="Buscar familiar registrado o ingresar nuevo"
                className="pl-10"
              />
            </div>
            <small className="text-gray-500 mt-1">
              Busca si el familiar ya está registrado en el sistema
            </small>
          </FormField>

          <FormField label="Cargo">
            <Select
              value={formData.cargo}
              onChange={(e) => handleInputChange('cargo', e.target.value)}
              options={cargos}
              placeholder="Seleccionar cargo"
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

          <FormField label="Fecha de Elección">
            <Input
              type="date"
              value={formData.fechaEleccion}
              onChange={(e) => handleInputChange('fechaEleccion', e.target.value)}
            />
            <small className="text-gray-500 mt-1">Formato: DD-MM-AAAA</small>
          </FormField>

          <FormField label="Fecha de Culminación">
            <Input
              type="date"
              value={formData.fechaCulminacion}
              onChange={(e) => handleInputChange('fechaCulminacion', e.target.value)}
            />
          </FormField>
        </div>

        {formData.fechaEleccion && formData.fechaCulminacion && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">
                Período calculado: {calcularPeriodo(formData.fechaEleccion, formData.fechaCulminacion)}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Registrar Miembro
          </button>
        </div>
      </div>

      {/* Tabla de Comité Actual */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Users className="w-5 h-5 mr-2 text-green-600" />
          Comité Actual ({comiteActual.length} miembros)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Cargo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Período</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Contacto</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comiteActual.map((miembro, index) => (
                <tr key={miembro.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-800">{miembro.nombre}</div>
                      <div className="text-sm text-gray-600">{miembro.correo}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {miembro.cargo.charAt(0).toUpperCase() + miembro.cargo.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-800">{miembro.periodo}</div>
                      <div className="text-sm text-gray-600">
                        {miembro.fechaEleccion} - {miembro.fechaCulminacion}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-600">{miembro.telefono}</div>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleDelete(miembro.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Eliminar miembro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {comiteActual.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay miembros registrados en el comité</p>
          </div>
        )}
      </div>
    </div>
  );
}