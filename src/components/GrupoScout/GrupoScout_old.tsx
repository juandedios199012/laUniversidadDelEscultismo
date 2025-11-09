import { useState, useEffect } from 'react';
import { Flag, Save, Plus, Edit, Trash2, X, Building } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import type { GrupoScout, PatrocinadorGrupo } from '../../lib/supabase';
// TODO: Uncomment when database table is created
// import { GrupoScoutService } from '../../services/grupoScoutService';

interface Patrocinador {
  id: string;
  nombre: string;
  tipo: string;
  contacto: string;
}

export default function GrupoScout() {
  const [grupos, setGrupos] = useState<GrupoScout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos demo - TODO: Remover cuando esté conectado a la base de datos
  const gruposDemo: GrupoScout[] = [
    {
      id: '1',
      codigo_grupo: 'GR0001',
      nombre: 'Grupo Scout Lima 12',
      numeral: '12',
      localidad: 'Lima',
      region: 'Lima Metropolitana',
      fecha_fundacion: '1990-05-15',
      fundador: 'Carlos Alberto Mendoza',
      lugar_reunion: 'Parroquia San Juan Bosco, Av. Petit Thouars 1234',
      direccion_sede: 'Av. Petit Thouars 1234, Lima',
      telefono_contacto: '01-234-5678',
      email_contacto: 'contacto@lima12.scout.pe',
      activo: true,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    },
    {
      id: '2',
      codigo_grupo: 'GR0002',
      nombre: 'Grupo Scout Arequipa 5',
      numeral: '5',
      localidad: 'Arequipa',
      region: 'Arequipa',
      fecha_fundacion: '1985-11-20',
      fundador: 'María Elena Flores',
      lugar_reunion: 'Colegio San Agustín, Calle Ugarte 150',
      direccion_sede: 'Calle Ugarte 150, Arequipa',
      telefono_contacto: '054-567-890',
      email_contacto: 'contacto@arequipa5.scout.pe',
      activo: true,
      created_at: '2024-02-20T00:00:00Z',
      updated_at: '2024-02-20T00:00:00Z'
    }
  ];

  // ============= EFECTOS =============
  useEffect(() => {
    loadData();
  }, []);

  // ============= FUNCIONES DE CARGA =============
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Reemplazar con llamada real a la base de datos cuando esté disponible
      // const gruposData = await GrupoScoutService.getAllGrupos();
      
      console.log('🏕️ Cargando grupos scout desde datos demo...');
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGrupos(gruposDemo);
      console.log('✅ Grupos cargados:', gruposDemo.length, 'grupos');
      
    } catch (err) {
      console.error('❌ Error loading grupos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al cargar los grupos scout: ${errorMessage}`);
      
      // Fallback a datos demo en caso de error
      setGrupos(gruposDemo);
    } finally {
      setLoading(false);
    }
  };

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    numeral: '',
    localidad: '',
    region: '',
    fecha_fundacion: '',
    fundador: '',
    lugar_reunion: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editando) {
      // Actualizar grupo existente
      setGrupos(prev => prev.map(grupo => 
        grupo.id === editando 
          ? { ...grupo, ...formData }
          : grupo
      ));
      setEditando(null);
    } else {
      // Crear nuevo grupo
      const nuevoGrupo: GrupoScout = {
        id: Date.now().toString(),
        ...formData,
        fechaCreacion: new Date().toISOString().split('T')[0],
        activo: true
      };
      setGrupos(prev => [...prev, nuevoGrupo]);
    }

    // Resetear formulario
    setFormData({
      nombre: '',
      numeral: '',
      localidad: '',
      region: '',
      fechaFundacion: '',
      fundador: '',
      lugarReunion: '',
      patrocinadores: []
    });
    setMostrarFormulario(false);
  };

  const handleEdit = (grupo: GrupoScout) => {
    setFormData({
      nombre: grupo.nombre,
      numeral: grupo.numeral,
      localidad: grupo.localidad,
      region: grupo.region,
      fechaFundacion: grupo.fechaFundacion,
      fundador: grupo.fundador,
      lugarReunion: grupo.lugarReunion,
      patrocinadores: grupo.patrocinadores
    });
    setEditando(grupo.id);
    setMostrarFormulario(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este grupo scout?')) {
      setGrupos(prev => prev.filter(grupo => grupo.id !== id));
    }
  };

  const cancelarEdicion = () => {
    setFormData({
      nombre: '',
      numeral: '',
      localidad: '',
      region: '',
      fechaFundacion: '',
      fundador: '',
      lugarReunion: '',
      patrocinadores: []
    });
    setEditando(null);
    setMostrarFormulario(false);
  };

  const agregarPatrocinador = () => {
    if (nuevoPatrocinador.nombre && nuevoPatrocinador.tipo) {
      const patrocinador: Patrocinador = {
        id: Date.now().toString(),
        ...nuevoPatrocinador
      };
      setFormData(prev => ({
        ...prev,
        patrocinadores: [...prev.patrocinadores, patrocinador]
      }));
      setNuevoPatrocinador({ nombre: '', tipo: '', contacto: '' });
    }
  };

  const eliminarPatrocinador = (id: string) => {
    setFormData(prev => ({
      ...prev,
      patrocinadores: prev.patrocinadores.filter(p => p.id !== id)
    }));
  };

  // Loading State
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Cargando grupos scout...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Flag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Grupo Scout</h1>
            <p className="text-gray-600">Gestión de grupos scout registrados en el sistema</p>
          </div>
        </div>

        <button
          onClick={() => setMostrarFormulario(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nuevo Grupo Scout
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <X className="w-5 h-5" />
            <span className="font-medium">Error:</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Formulario */}
      {mostrarFormulario && (
        <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {editando ? 'Editar Grupo Scout' : 'Nuevo Grupo Scout'}
            </h2>
            <button
              onClick={cancelarEdicion}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FormField label="Nombre del Grupo Scout *">
                <Input
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Ej: Grupo Scout Lima 12"
                  required
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-600 focus:ring-purple-600"
                />
              </FormField>

              <FormField label="Numeral *">
                <Input
                  value={formData.numeral}
                  onChange={(e) => handleInputChange('numeral', e.target.value)}
                  placeholder="Ej: 12, 45, 108"
                  required
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-600 focus:ring-purple-600"
                />
              </FormField>

              <FormField label="Localidad *">
                <Input
                  value={formData.localidad}
                  onChange={(e) => handleInputChange('localidad', e.target.value)}
                  placeholder="Ej: Lima, Arequipa, Cusco"
                  required
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-600 focus:ring-purple-600"
                />
              </FormField>

              <FormField label="Región *">
                <Input
                  value={formData.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  placeholder="Ej: Lima Metropolitana, Arequipa"
                  required
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-600 focus:ring-purple-600"
                />
              </FormField>

              <FormField label="Fecha de Fundación *">
                <Input
                  type="date"
                  value={formData.fechaFundacion}
                  onChange={(e) => handleInputChange('fechaFundacion', e.target.value)}
                  required
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-600 focus:ring-purple-600"
                />
              </FormField>

              <FormField label="Fundador *">
                <Input
                  value={formData.fundador}
                  onChange={(e) => handleInputChange('fundador', e.target.value)}
                  placeholder="Nombre completo del fundador"
                  required
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-600 focus:ring-purple-600"
                />
              </FormField>
            </div>

            <div className="mb-6">
              <FormField label="Lugar de Reunión *">
                <Input
                  value={formData.lugarReunion}
                  onChange={(e) => handleInputChange('lugarReunion', e.target.value)}
                  placeholder="Dirección completa del lugar de reunión"
                  required
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-600 focus:ring-purple-600"
                />
              </FormField>
            </div>

            {/* Sección de Patrocinadores */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-600" />
                Patrocinadores
              </h4>
              
              {/* Lista de patrocinadores existentes */}
              {formData.patrocinadores.length > 0 && (
                <div className="mb-4 space-y-2">
                  {formData.patrocinadores.map((patrocinador) => (
                    <div key={patrocinador.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{patrocinador.nombre}</div>
                        <div className="text-sm text-gray-600">
                          {patrocinador.tipo} • {patrocinador.contacto}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarPatrocinador(patrocinador.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario para agregar nuevo patrocinador */}
              <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <FormField label="Nombre del Patrocinador">
                    <Input
                      value={nuevoPatrocinador.nombre}
                      onChange={(e) => setNuevoPatrocinador(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Nombre del patrocinador"
                      className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-600 focus:ring-purple-600"
                    />
                  </FormField>

                  <FormField label="Tipo">
                    <select
                      value={nuevoPatrocinador.tipo}
                      onChange={(e) => setNuevoPatrocinador(prev => ({ ...prev, tipo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-600 focus:ring-purple-600 bg-white"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="Público">Público</option>
                      <option value="Privado">Privado</option>
                      <option value="ONG">ONG</option>
                      <option value="Religioso">Religioso</option>
                    </select>
                  </FormField>

                  <FormField label="Contacto">
                    <Input
                      value={nuevoPatrocinador.contacto}
                      onChange={(e) => setNuevoPatrocinador(prev => ({ ...prev, contacto: e.target.value }))}
                      placeholder="Email o teléfono"
                      className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-600 focus:ring-purple-600"
                    />
                  </FormField>
                </div>

                <button
                  type="button"
                  onClick={agregarPatrocinador}
                  disabled={!nuevoPatrocinador.nombre || !nuevoPatrocinador.tipo}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Patrocinador
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editando ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={cancelarEdicion}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Grupos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="p-6 bg-purple-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Grupos Scout Registrados</h2>
          <p className="text-gray-600 mt-1">Total: {grupos.length} grupo(s)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grupo Scout
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fundación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fundador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patrocinadores
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grupos.map((grupo) => (
                <tr key={grupo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <Flag className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{grupo.nombre}</div>
                        <div className="text-sm text-gray-500">#{grupo.numeral}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(grupo.fechaFundacion).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {grupo.fundador}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{grupo.localidad}</div>
                    <div className="text-sm text-gray-500">{grupo.region}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {grupo.patrocinadores.slice(0, 2).map((patrocinador, index) => (
                        <span key={index} className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {patrocinador.nombre}
                        </span>
                      ))}
                      {grupo.patrocinadores.length > 2 && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          +{grupo.patrocinadores.length - 2}
                        </span>
                      )}
                      {grupo.patrocinadores.length === 0 && (
                        <span className="text-xs text-gray-400">Sin patrocinadores</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      grupo.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {grupo.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(grupo)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(grupo.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {grupos.length === 0 && (
          <div className="p-8 text-center">
            <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay grupos registrados</h3>
            <p className="text-gray-500 mb-4">Comienza creando tu primer grupo scout</p>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear Grupo Scout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}