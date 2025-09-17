import { useState } from 'react';
import { Award, Users, Save, UserPlus, Trash2, Shield, Star } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';

interface Miembro {
  id: string;
  nombre: string;
  apellido: string;
  cargo: string;
  fechaIngreso: string;
}

interface Patrulla {
  id: string;
  nombre: string;
  rama: string;
  dirigente: string;
  miembros: Miembro[];
  fechaFormacion: string;
  estado: string;
}

export default function Patrullas() {
  const [formData, setFormData] = useState({
    nombre: '',
    rama: '',
    dirigente: '',
    fechaFormacion: '',
    estado: 'activa'
  });

  const [patrullas, setPatrullas] = useState<Patrulla[]>([
    {
      id: '1',
      nombre: 'Patrulla Halcones',
      rama: 'Tropa',
      dirigente: 'Carlos Mendoza',
      miembros: [
        { id: '1', nombre: 'Juan', apellido: 'Pérez', cargo: 'Guía', fechaIngreso: '2024-01-15' },
        { id: '2', nombre: 'María', apellido: 'González', cargo: 'Subguía', fechaIngreso: '2024-01-20' }
      ],
      fechaFormacion: '2024-01-10',
      estado: 'activa'
    }
  ]);

  const [miembroTemp, setMiembroTemp] = useState({
    nombre: '',
    apellido: '',
    cargo: '',
    fechaIngreso: ''
  });

  const [patrullaSeleccionada, setPatrullaSeleccionada] = useState<string>('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const ramas = [
    { value: 'Manada', label: 'Manada (Seisenas)' },
    { value: 'Tropa', label: 'Tropa (Patrullas)' },
    { value: 'Caminante', label: 'Caminante (Equipos)' },
    { value: 'Clan', label: 'Clan (Equipos)' }
  ];

  const cargosPatrulla = {
    'Manada': [
      { value: 'seisenero', label: 'Seisenero' },
      { value: 'seisenera', label: 'Seisenera' },
      { value: 'lobato', label: 'Lobato' },
      { value: 'lobata', label: 'Lobata' }
    ],
    'Tropa': [
      { value: 'guia', label: 'Guía' },
      { value: 'subguia', label: 'Subguía' },
      { value: 'tesorero', label: 'Tesorero' },
      { value: 'intendente', label: 'Intendente' },
      { value: 'primer_scout', label: 'Primer Scout' },
      { value: 'segundo_scout', label: 'Segundo Scout' }
    ],
    'Caminante': [
      { value: 'coordinador', label: 'Coordinador' },
      { value: 'secretario', label: 'Secretario' },
      { value: 'caminante', label: 'Caminante' }
    ],
    'Clan': [
      { value: 'presidente', label: 'Presidente' },
      { value: 'tesorero', label: 'Tesorero' },
      { value: 'secretario', label: 'Secretario' },
      { value: 'rover', label: 'Rover' }
    ]
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const nuevaPatrulla: Patrulla = {
      id: (patrullas.length + 1).toString(),
      nombre: formData.nombre,
      rama: formData.rama,
      dirigente: formData.dirigente,
      fechaFormacion: formData.fechaFormacion,
      estado: formData.estado,
      miembros: []
    };

    setPatrullas([...patrullas, nuevaPatrulla]);
    setFormData({
      nombre: '',
      rama: '',
      dirigente: '',
      fechaFormacion: '',
      estado: 'activa'
    });
    setMostrarFormulario(false);
  };

  const agregarMiembro = () => {
    if (!patrullaSeleccionada || !miembroTemp.nombre || !miembroTemp.apellido || !miembroTemp.cargo) {
      alert('Por favor complete todos los campos del miembro');
      return;
    }

    const nuevoMiembro: Miembro = {
      id: Date.now().toString(),
      ...miembroTemp
    };

    setPatrullas(prev => prev.map(patrulla => 
      patrulla.id === patrullaSeleccionada 
        ? { ...patrulla, miembros: [...patrulla.miembros, nuevoMiembro] }
        : patrulla
    ));

    setMiembroTemp({
      nombre: '',
      apellido: '',
      cargo: '',
      fechaIngreso: ''
    });
  };

  const eliminarMiembro = (patrullaId: string, miembroId: string) => {
    setPatrullas(prev => prev.map(patrulla => 
      patrulla.id === patrullaId 
        ? { ...patrulla, miembros: patrulla.miembros.filter(m => m.id !== miembroId) }
        : patrulla
    ));
  };

  const eliminarPatrulla = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta patrulla?')) {
      setPatrullas(prev => prev.filter(p => p.id !== id));
    }
  };

  const patrullaActual = patrullas.find(p => p.id === patrullaSeleccionada);

  return (
    <div className="gaming-container">
      <div className="gaming-header">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
          <Award className="w-10 h-10" />
          🏆 Gestión de Patrullas
        </h1>
        <p className="text-xl text-gray-300">Organiza tus patrullas como un verdadero estratega</p>
      </div>

      {/* Botón para mostrar formulario */}
      <div className="mb-6">
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="gaming-btn primary flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          {mostrarFormulario ? 'Cancelar' : 'Nueva Patrulla'}
        </button>
      </div>

      {/* Formulario de nueva patrulla */}
      {mostrarFormulario && (
        <div className="gaming-card mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Nueva Patrulla/Seisena
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Nombre de la Patrulla/Seisena" required>
              <Input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                placeholder="Ej: Patrulla Halcones"
              />
            </FormField>

            <FormField label="Rama" required>
              <Select
                value={formData.rama}
                onChange={(e) => handleInputChange('rama', e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar rama' },
                  ...ramas
                ]}
              />
            </FormField>

            <FormField label="Dirigente Responsable" required>
              <Input
                type="text"
                value={formData.dirigente}
                onChange={(e) => handleInputChange('dirigente', e.target.value)}
                placeholder="Nombre del dirigente"
              />
            </FormField>

            <FormField label="Fecha de Formación" required>
              <Input
                type="date"
                value={formData.fechaFormacion}
                onChange={(e) => handleInputChange('fechaFormacion', e.target.value)}
              />
            </FormField>

            <FormField label="Estado">
              <Select
                value={formData.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                options={[
                  { value: 'activa', label: 'Activa' },
                  { value: 'inactiva', label: 'Inactiva' },
                  { value: 'en_formacion', label: 'En Formación' }
                ]}
              />
            </FormField>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSave}
              className="gaming-btn primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar Patrulla
            </button>
            <button
              onClick={() => setMostrarFormulario(false)}
              className="gaming-btn secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de patrullas */}
      <div className="gaming-card mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Patrullas Registradas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patrullas.map((patrulla) => (
            <div key={patrulla.id} className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Star className="w-5 h-5 text-gold-500" />
                  {patrulla.nombre}
                </h3>
                <button
                  onClick={() => eliminarPatrulla(patrulla.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Rama:</span> {patrulla.rama}</p>
                <p><span className="font-semibold">Dirigente:</span> {patrulla.dirigente}</p>
                <p><span className="font-semibold">Miembros:</span> {patrulla.miembros.length}</p>
                <p><span className="font-semibold">Estado:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    patrulla.estado === 'activa' ? 'bg-green-100 text-green-800' :
                    patrulla.estado === 'inactiva' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {patrulla.estado}
                  </span>
                </p>
              </div>

              <button
                onClick={() => setPatrullaSeleccionada(patrulla.id)}
                className="mt-4 w-full gaming-btn primary-small"
              >
                Gestionar Miembros
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Gestión de miembros */}
      {patrullaSeleccionada && patrullaActual && (
        <div className="gaming-card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Miembros de {patrullaActual.nombre}
          </h2>

          {/* Formulario para agregar miembro */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Agregar Nuevo Miembro</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField label="Nombre">
                <Input
                  type="text"
                  value={miembroTemp.nombre}
                  onChange={(e) => setMiembroTemp(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre"
                />
              </FormField>

              <FormField label="Apellido">
                <Input
                  type="text"
                  value={miembroTemp.apellido}
                  onChange={(e) => setMiembroTemp(prev => ({ ...prev, apellido: e.target.value }))}
                  placeholder="Apellido"
                />
              </FormField>

              <FormField label="Cargo">
                <Select
                  value={miembroTemp.cargo}
                  onChange={(e) => setMiembroTemp(prev => ({ ...prev, cargo: e.target.value }))}
                  options={[
                    { value: '', label: 'Seleccionar cargo' },
                    ...(cargosPatrulla[patrullaActual.rama as keyof typeof cargosPatrulla] || [])
                  ]}
                />
              </FormField>

              <FormField label="Fecha de Ingreso">
                <Input
                  type="date"
                  value={miembroTemp.fechaIngreso}
                  onChange={(e) => setMiembroTemp(prev => ({ ...prev, fechaIngreso: e.target.value }))}
                />
              </FormField>
            </div>

            <button
              onClick={agregarMiembro}
              className="mt-4 gaming-btn primary flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Agregar Miembro
            </button>
          </div>

          {/* Lista de miembros */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">Nombre</th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">Apellido</th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">Cargo</th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">Fecha Ingreso</th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-800">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {patrullaActual.miembros.map((miembro) => (
                  <tr key={miembro.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3">{miembro.nombre}</td>
                    <td className="border border-gray-200 px-4 py-3">{miembro.apellido}</td>
                    <td className="border border-gray-200 px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {miembro.cargo}
                      </span>
                    </td>
                    <td className="border border-gray-200 px-4 py-3">{miembro.fechaIngreso}</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">
                      <button
                        onClick={() => eliminarMiembro(patrullaActual.id, miembro.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {patrullaActual.miembros.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay miembros registrados en esta patrulla
              </div>
            )}
          </div>

          <button
            onClick={() => setPatrullaSeleccionada('')}
            className="mt-6 gaming-btn secondary"
          >
            Cerrar Gestión de Miembros
          </button>
        </div>
      )}
    </div>
  );
}