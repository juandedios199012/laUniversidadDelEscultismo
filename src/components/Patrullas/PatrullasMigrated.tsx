import { useState, useEffect } from 'react';
import { Award, Users, Save, UserPlus, Trash2, Shield, Star, TrendingUp, BarChart } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';
import { ScoutService } from '../../services/scoutService';
import type { Patrulla, MiembroPatrulla, Scout } from '../../lib/supabase';

interface FormularioPatrulla {
  nombre: string;
  rama: string;
  dirigente_id: string;
  lema?: string;
  grito?: string;
  colores?: string;
  totem?: string;
  estado: 'activa' | 'inactiva' | 'disuelta';
}

interface FormularioMiembro {
  scout_id: string;
  cargo: 'Guía' | 'Subguía' | 'Miembro';
  fecha_ingreso: string;
}

interface MiembroPatrullaConScout extends MiembroPatrulla {
  scouts?: {
    nombres: string;
    apellidos: string;
    fecha_nacimiento: string;
    rama_actual: string;
  };
}

export default function PatrullasMigrated() {
  const [formData, setFormData] = useState<FormularioPatrulla>({
    nombre: '',
    rama: '',
    dirigente_id: '',
    lema: '',
    grito: '',
    colores: '',
    totem: '',
    estado: 'activa'
  });

  const [patrullas, setPatrullas] = useState<Patrulla[]>([]);
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [dirigentes, setDirigentes] = useState<Scout[]>([]);
  const [miembrosPatrulla, setMiembrosPatrulla] = useState<Record<string, MiembroPatrullaConScout[]>>({});
  const [estadisticas, setEstadisticas] = useState<{
    total_patrullas: number;
    por_rama: Record<string, number>;
    por_estado: Record<string, number>;
    promedio_miembros: number;
  }>({
    total_patrullas: 0,
    por_rama: {},
    por_estado: {},
    promedio_miembros: 0
  });

  const [miembroTemp, setMiembroTemp] = useState<FormularioMiembro>({
    scout_id: '',
    cargo: 'Miembro',
    fecha_ingreso: new Date().toISOString().split('T')[0]
  });

  const [patrullaSeleccionada, setPatrullaSeleccionada] = useState<string>('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ramas = [
    { value: 'Manada', label: 'Manada (Seisenas)' },
    { value: 'Tropa', label: 'Tropa (Patrullas)' },
    { value: 'Caminante', label: 'Caminante (Equipos)' },
    { value: 'Clan', label: 'Clan (Equipos)' }
  ];

  const cargosPatrulla = {
    'Manada': [
      { value: 'Guía', label: 'Seisenero/a' },
      { value: 'Miembro', label: 'Lobato/a' }
    ],
    'Tropa': [
      { value: 'Guía', label: 'Guía' },
      { value: 'Subguía', label: 'Subguía' },
      { value: 'Miembro', label: 'Miembro' }
    ],
    'Caminante': [
      { value: 'Guía', label: 'Coordinador' },
      { value: 'Subguía', label: 'Secretario' },
      { value: 'Miembro', label: 'Caminante' }
    ],
    'Clan': [
      { value: 'Guía', label: 'Presidente' },
      { value: 'Subguía', label: 'Tesorero' },
      { value: 'Miembro', label: 'Rover' }
    ]
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [patrullasData, scoutsData, estadisticasData] = await Promise.all([
        ScoutService.getAllPatrullas(),
        ScoutService.getAllScouts(),
        ScoutService.getEstadisticasPatrullas()
      ]);

      setPatrullas(patrullasData);
      setScouts(scoutsData);
      setDirigentes(scoutsData.filter(s => s.es_dirigente));
      setEstadisticas(estadisticasData);

      // Cargar miembros para cada patrulla
      const miembrosData: Record<string, MiembroPatrullaConScout[]> = {};
      for (const patrulla of patrullasData) {
        const miembros = await ScoutService.getMiembrosPatrulla(patrulla.id);
        miembrosData[patrulla.id] = miembros;
      }
      setMiembrosPatrulla(miembrosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos de patrullas');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormularioPatrulla, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.rama) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const nuevaPatrulla = await ScoutService.createPatrulla({
        nombre: formData.nombre,
        rama: formData.rama,
        dirigente_id: formData.dirigente_id || undefined,
        lema: formData.lema || undefined,
        grito: formData.grito || undefined,
        colores: formData.colores || undefined,
        totem: formData.totem || undefined,
        estado: formData.estado
      });

      await cargarDatos();
      
      setFormData({
        nombre: '',
        rama: '',
        dirigente_id: '',
        lema: '',
        grito: '',
        colores: '',
        totem: '',
        estado: 'activa'
      });
      setMostrarFormulario(false);
    } catch (error) {
      console.error('Error al guardar patrulla:', error);
      setError('Error al guardar la patrulla');
    } finally {
      setLoading(false);
    }
  };

  const agregarMiembro = async () => {
    if (!patrullaSeleccionada || !miembroTemp.scout_id) {
      setError('Por favor seleccione un scout para agregar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await ScoutService.addMiembroPatrulla({
        scout_id: miembroTemp.scout_id,
        patrulla_id: patrullaSeleccionada,
        cargo: miembroTemp.cargo,
        fecha_ingreso: miembroTemp.fecha_ingreso,
        activo: true
      });

      // Recargar miembros de la patrulla
      const miembros = await ScoutService.getMiembrosPatrulla(patrullaSeleccionada);
      setMiembrosPatrulla(prev => ({
        ...prev,
        [patrullaSeleccionada]: miembros
      }));

      setMiembroTemp({
        scout_id: '',
        cargo: 'Miembro',
        fecha_ingreso: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error al agregar miembro:', error);
      setError('Error al agregar miembro a la patrulla');
    } finally {
      setLoading(false);
    }
  };

  const eliminarMiembro = async (miembroId: string) => {
    if (!confirm('¿Está seguro de remover este miembro de la patrulla?')) return;

    try {
      setLoading(true);
      setError(null);

      await ScoutService.removeMiembroPatrulla(miembroId);

      // Recargar miembros de la patrulla
      const miembros = await ScoutService.getMiembrosPatrulla(patrullaSeleccionada);
      setMiembrosPatrulla(prev => ({
        ...prev,
        [patrullaSeleccionada]: miembros
      }));
    } catch (error) {
      console.error('Error al remover miembro:', error);
      setError('Error al remover miembro de la patrulla');
    } finally {
      setLoading(false);
    }
  };

  const eliminarPatrulla = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta patrulla? Esta acción no se puede deshacer.')) return;

    try {
      setLoading(true);
      setError(null);

      await ScoutService.deletePatrulla(id);
      await cargarDatos();
    } catch (error) {
      console.error('Error al eliminar patrulla:', error);
      setError('Error al eliminar la patrulla');
    } finally {
      setLoading(false);
    }
  };

  const patrullaActual = patrullas.find(p => p.id === patrullaSeleccionada);
  const miembrosActuales = miembrosPatrulla[patrullaSeleccionada] || [];

  // Filtrar scouts que no están ya en la patrulla seleccionada
  const scoutsDisponibles = scouts.filter(scout => 
    !miembrosActuales.some(miembro => miembro.scout_id === scout.id)
  );

  if (loading && patrullas.length === 0) {
    return (
      <div className="gaming-container">
        <div className="gaming-header">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
            <Award className="w-10 h-10" />
            🏆 Gestión de Patrullas
          </h1>
        </div>
        <div className="gaming-card">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Cargando patrullas...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gaming-container">
      <div className="gaming-header">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
          <Award className="w-10 h-10" />
          🏆 Gestión de Patrullas
        </h1>
        <p className="text-xl text-gray-300">Organiza tus patrullas como un verdadero estratega</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Total Patrullas</h3>
              <p className="text-3xl font-bold text-white">{estadisticas.total_patrullas}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Promedio Miembros</h3>
              <p className="text-3xl font-bold text-white">{estadisticas.promedio_miembros}</p>
            </div>
            <Users className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Más Activa</h3>
              <p className="text-lg font-bold text-white">
                {Object.entries(estadisticas.por_rama).length > 0 
                  ? Object.entries(estadisticas.por_rama).reduce((a, b) => a[1] > b[1] ? a : b)[0]
                  : 'N/A'
                }
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Activas</h3>
              <p className="text-3xl font-bold text-white">{estadisticas.por_estado.activa || 0}</p>
            </div>
            <BarChart className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Botón para mostrar formulario */}
      <div className="mb-6">
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          disabled={loading}
          className="gaming-btn primary flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          {mostrarFormulario ? 'Cancelar' : 'Nueva Patrulla'}
        </button>
      </div>

      {/* Formulario de nueva patrulla */}
      {mostrarFormulario && (
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
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

            <FormField label="Dirigente Responsable">
              <Select
                value={formData.dirigente_id}
                onChange={(e) => handleInputChange('dirigente_id', e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar dirigente' },
                  ...dirigentes.map(d => ({
                    value: d.id,
                    label: `${d.nombres} ${d.apellidos}`
                  }))
                ]}
              />
            </FormField>

            <FormField label="Estado">
              <Select
                value={formData.estado}
                onChange={(e) => handleInputChange('estado', e.target.value as 'activa' | 'inactiva' | 'disuelta')}
                options={[
                  { value: 'activa', label: 'Activa' },
                  { value: 'inactiva', label: 'Inactiva' },
                  { value: 'disuelta', label: 'Disuelta' }
                ]}
              />
            </FormField>

            <FormField label="Lema (Opcional)">
              <Input
                type="text"
                value={formData.lema || ''}
                onChange={(e) => handleInputChange('lema', e.target.value)}
                placeholder="Ej: Siempre listos"
              />
            </FormField>

            <FormField label="Grito de Patrulla (Opcional)">
              <Input
                type="text"
                value={formData.grito || ''}
                onChange={(e) => handleInputChange('grito', e.target.value)}
                placeholder="Ej: ¡Halcones al ataque!"
              />
            </FormField>

            <FormField label="Colores (Opcional)">
              <Input
                type="text"
                value={formData.colores || ''}
                onChange={(e) => handleInputChange('colores', e.target.value)}
                placeholder="Ej: Azul y blanco"
              />
            </FormField>

            <FormField label="Totem (Opcional)">
              <Input
                type="text"
                value={formData.totem || ''}
                onChange={(e) => handleInputChange('totem', e.target.value)}
                placeholder="Ej: Halcón peregrino"
              />
            </FormField>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="gaming-btn primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Guardar Patrulla'}
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
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Patrullas Registradas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patrullas.map((patrulla) => (
            <div key={patrulla.id} className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6 hover:bg-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  {patrulla.nombre}
                </h3>
                <button
                  onClick={() => eliminarPatrulla(patrulla.id)}
                  disabled={loading}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2 text-sm text-white/80">
                <p><span className="font-semibold">Rama:</span> {patrulla.rama}</p>
                <p><span className="font-semibold">Miembros:</span> {miembrosPatrulla[patrulla.id]?.length || 0}</p>
                {patrulla.lema && <p><span className="font-semibold">Lema:</span> {patrulla.lema}</p>}
                <p><span className="font-semibold">Estado:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    patrulla.estado === 'activa' ? 'bg-green-500/20 text-green-300' :
                    patrulla.estado === 'inactiva' ? 'bg-red-500/20 text-red-300' :
                    'bg-yellow-500/20 text-yellow-300'
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

        {patrullas.length === 0 && !loading && (
          <div className="text-center py-8 text-white/60">
            No hay patrullas registradas. ¡Crea la primera patrulla!
          </div>
        )}
      </div>

      {/* Gestión de miembros */}
      {patrullaSeleccionada && patrullaActual && (
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Miembros de {patrullaActual.nombre}
          </h2>

          {/* Formulario para agregar miembro */}
          <div className="backdrop-blur-md bg-white/5 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Agregar Nuevo Miembro</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Scout">
                <Select
                  value={miembroTemp.scout_id}
                  onChange={(e) => setMiembroTemp(prev => ({ ...prev, scout_id: e.target.value }))}
                  options={[
                    { value: '', label: 'Seleccionar scout' },
                    ...scoutsDisponibles.map(scout => ({
                      value: scout.id,
                      label: `${scout.nombres} ${scout.apellidos}`
                    }))
                  ]}
                />
              </FormField>

              <FormField label="Cargo">
                <Select
                  value={miembroTemp.cargo}
                  onChange={(e) => setMiembroTemp(prev => ({ ...prev, cargo: e.target.value as 'Guía' | 'Subguía' | 'Miembro' }))}
                  options={cargosPatrulla[patrullaActual.rama as keyof typeof cargosPatrulla] || []}
                />
              </FormField>

              <FormField label="Fecha de Ingreso">
                <Input
                  type="date"
                  value={miembroTemp.fecha_ingreso}
                  onChange={(e) => setMiembroTemp(prev => ({ ...prev, fecha_ingreso: e.target.value }))}
                />
              </FormField>
            </div>

            <button
              onClick={agregarMiembro}
              disabled={loading}
              className="mt-4 gaming-btn primary flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Agregando...' : 'Agregar Miembro'}
            </button>
          </div>

          {/* Lista de miembros */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="px-4 py-3 text-left font-semibold text-white">Nombre</th>
                  <th className="px-4 py-3 text-left font-semibold text-white">Cargo</th>
                  <th className="px-4 py-3 text-left font-semibold text-white">Fecha Ingreso</th>
                  <th className="px-4 py-3 text-center font-semibold text-white">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {miembrosActuales.map((miembro) => (
                  <tr key={miembro.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="px-4 py-3 text-white">
                      {miembro.scouts ? `${miembro.scouts.nombres} ${miembro.scouts.apellidos}` : 'Scout no encontrado'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                        {miembro.cargo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/80">
                      {new Date(miembro.fecha_ingreso).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => eliminarMiembro(miembro.id)}
                        disabled={loading}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {miembrosActuales.length === 0 && (
              <div className="text-center py-8 text-white/60">
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