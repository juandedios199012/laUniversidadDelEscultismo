import { useState } from 'react';
import { UserCheck, Search, Save, Calendar, Award, Trash2, FileText } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';

interface Inscripcion {
  id: string;
  scout: string;
  codigoAsociado: string;
  rama: string;
  ano: string;
  fechaInscripcion: string;
  activo: boolean;
}

export default function InscripcionAnual() {
  const [formData, setFormData] = useState({
    scout: '',
    codigoAsociado: '',
    rama: '',
    ano: new Date().getFullYear().toString()
  });

  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([
    {
      id: '1',
      scout: 'Juan Pérez López',
      codigoAsociado: 'ASC-2024-001',
      rama: 'Tropa',
      ano: '2024',
      fechaInscripcion: '15-03-2024',
      activo: true
    },
    {
      id: '2',
      scout: 'María González Torres',
      codigoAsociado: 'ASC-2024-002',
      rama: 'Manada',
      ano: '2024',
      fechaInscripcion: '20-03-2024',
      activo: true
    },
    {
      id: '3',
      scout: 'Carlos Mendoza Silva',
      codigoAsociado: 'ASC-2024-003',
      rama: 'Caminante',
      ano: '2024',
      fechaInscripcion: '25-03-2024',
      activo: true
    }
  ]);

  const ramas = [
    { value: 'Manada', label: 'Manada (7-10 años)' },
    { value: 'Tropa', label: 'Tropa (11-14 años)' },
    { value: 'Caminante', label: 'Caminante (15-17 años)' },
    { value: 'Clan', label: 'Clan (18-21 años)' }
  ];

  const anos = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return { value: year.toString(), label: year.toString() };
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generarCodigoAsociado = (_rama: string, ano: string) => {
    const prefijo = 'ASC';
    const numeroConsecutivo = inscripciones.filter(i => i.ano === ano).length + 1;
    return `${prefijo}-${ano}-${numeroConsecutivo.toString().padStart(3, '0')}`;
  };

  const handleSave = () => {
    const codigoGenerado = formData.codigoAsociado || generarCodigoAsociado(formData.rama, formData.ano);
    
    const nuevaInscripcion: Inscripcion = {
      id: (inscripciones.length + 1).toString(),
      scout: formData.scout,
      codigoAsociado: codigoGenerado,
      rama: formData.rama,
      ano: formData.ano,
      fechaInscripcion: new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-'),
      activo: true
    };

    setInscripciones(prev => [nuevaInscripcion, ...prev]);
    setFormData({
      scout: '',
      codigoAsociado: '',
      rama: '',
      ano: new Date().getFullYear().toString()
    });
  };

  const handleDelete = (id: string) => {
    setInscripciones(prev => prev.filter(inscripcion => inscripcion.id !== id));
  };

  const handleToggleActivo = (id: string) => {
    setInscripciones(prev => prev.map(inscripcion => 
      inscripcion.id === id 
        ? { ...inscripcion, activo: !inscripcion.activo }
        : inscripcion
    ));
  };

  const getColorRama = (rama: string) => {
    const colores = {
      'Manada': 'bg-green-100 text-green-800',
      'Tropa': 'bg-blue-100 text-blue-800',
      'Caminante': 'bg-orange-100 text-orange-800',
      'Clan': 'bg-purple-100 text-purple-800'
    };
    return colores[rama as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const inscripcionesPorAno = inscripciones.reduce((acc, inscripcion) => {
    if (!acc[inscripcion.ano]) {
      acc[inscripcion.ano] = [];
    }
    acc[inscripcion.ano].push(inscripcion);
    return acc;
  }, {} as Record<string, Inscripcion[]>);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Inscripción Anual</h1>
        <p className="text-gray-600">Registro de inscripciones anuales de scouts con código asociado</p>
      </div>

      {/* Formulario de Registro */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <UserCheck className="w-5 h-5 mr-2 text-teal-600" />
          Nueva Inscripción Anual
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <FormField label="Scout">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={formData.scout}
                onChange={(e) => handleInputChange('scout', e.target.value)}
                placeholder="Buscar scout registrado"
                className="pl-10"
              />
            </div>
            <small className="text-gray-500 mt-1">
              Busca el scout en el sistema
            </small>
          </FormField>

          <FormField label="Rama">
            <Select
              value={formData.rama}
              onChange={(e) => handleInputChange('rama', e.target.value)}
              options={ramas}
              placeholder="Seleccionar rama"
            />
          </FormField>

          <FormField label="Año de Inscripción">
            <Select
              value={formData.ano}
              onChange={(e) => handleInputChange('ano', e.target.value)}
              options={anos}
            />
          </FormField>

          <FormField label="Código Asociado">
            <Input
              value={formData.codigoAsociado}
              onChange={(e) => handleInputChange('codigoAsociado', e.target.value)}
              placeholder="Se genera automáticamente"
            />
            <small className="text-gray-500 mt-1">
              Opcional - Se genera automáticamente si está vacío
            </small>
          </FormField>
        </div>

        {formData.rama && formData.ano && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-teal-600 mr-2" />
              <span className="text-teal-800 font-medium">
                Código sugerido: {generarCodigoAsociado(formData.rama, formData.ano)}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Registrar Inscripción
          </button>
        </div>
      </div>

      {/* Inscripciones por Año */}
      <div className="space-y-6">
        {Object.keys(inscripcionesPorAno)
          .sort((a, b) => parseInt(b) - parseInt(a))
          .map(ano => (
            <div key={ano} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-teal-600" />
                  Inscripciones {ano}
                </h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Total: {inscripcionesPorAno[ano].length} inscripciones
                  </span>
                  <span className="text-sm text-gray-600">
                    Activas: {inscripcionesPorAno[ano].filter(i => i.activo).length}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Scout</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Código Asociado</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Rama</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha Inscripción</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inscripcionesPorAno[ano].map((inscripcion, index) => (
                      <tr key={inscripcion.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-teal-50 transition-colors`}>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                              <Award className="w-4 h-4 text-teal-600" />
                            </div>
                            <span className="font-medium text-gray-800">{inscripcion.scout}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {inscripcion.codigoAsociado}
                          </code>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getColorRama(inscripcion.rama)}`}>
                            {inscripcion.rama}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {inscripcion.fechaInscripcion}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleActivo(inscripcion.id)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              inscripcion.activo 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {inscripcion.activo ? 'Activa' : 'Inactiva'}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleDelete(inscripcion.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Eliminar inscripción"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {inscripcionesPorAno[ano].length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay inscripciones para el año {ano}</p>
                </div>
              )}
            </div>
          ))}
      </div>

      {inscripciones.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
          <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No hay inscripciones registradas</h3>
          <p>Registra la primera inscripción anual para empezar</p>
        </div>
      )}

      {/* Estadísticas */}
      {inscripciones.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas de Inscripciones</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">{inscripciones.length}</div>
              <div className="text-sm text-gray-600">Total Inscripciones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {inscripciones.filter(i => i.activo).length}
              </div>
              <div className="text-sm text-gray-600">Activas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {inscripciones.filter(i => i.ano === new Date().getFullYear().toString()).length}
              </div>
              <div className="text-sm text-gray-600">Año Actual</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(inscripcionesPorAno).length}
              </div>
              <div className="text-sm text-gray-600">Años Registrados</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}