import { useState, useEffect } from 'react';
import { Shield, Save, UserPlus, Trash2, Search, Clock, Award, Users, TrendingUp, Star, BarChart } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';
import { ScoutService } from '../../services/scoutService';
import type { Scout } from '../../lib/supabase';

interface FormularioDirigente {
  scout_id: string;
  fecha_ingreso_dirigente: string;
  rama_responsable: string;
  cargo: string;
  nivel_formacion: string;
}

interface DirigenteCompleto {
  id: string;
  scout_id: string;
  codigo_dirigente: string;
  fecha_ingreso_dirigente: string;
  rama_responsable?: string;
  cargo?: string;
  nivel_formacion?: string;
  insignia_madera: boolean;
  fecha_insignia_madera?: string;
  estado_dirigente: 'activo' | 'licencia' | 'retirado';
  scouts: {
    nombres: string;
    apellidos: string;
    celular?: string;
    correo?: string;
    fecha_ingreso: string;
  };
}

export default function DirigentesMigrated() {
  const [formData, setFormData] = useState<FormularioDirigente>({
    scout_id: '',
    fecha_ingreso_dirigente: new Date().toISOString().split('T')[0],
    rama_responsable: '',
    cargo: '',
    nivel_formacion: 'Básico'
  });

  const [dirigentes, setDirigentes] = useState<DirigenteCompleto[]>([]);
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [scoutsFiltrados, setScoutsFiltrados] = useState<Scout[]>([]);
  const [busquedaScout, setBusquedaScout] = useState('');
  const [estadisticas, setEstadisticas] = useState<{
    total_dirigentes: number;
    por_rama: Record<string, number>;
    por_estado: Record<string, number>;
    con_insignia_madera: number;
    tiempo_promedio_servicio: number;
  }>({
    total_dirigentes: 0,
    por_rama: {},
    por_estado: {},
    con_insignia_madera: 0,
    tiempo_promedio_servicio: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ramas = [
    { value: 'Manada', label: 'Manada (7-10 años)' },
    { value: 'Tropa', label: 'Tropa (11-14 años)' },
    { value: 'Caminante', label: 'Caminante (15-17 años)' },
    { value: 'Clan', label: 'Clan (18-21 años)' },
    { value: 'Consejo', label: 'Consejo de Grupo' }
  ];

  const cargos = [
    { value: 'Jefe de Rama', label: 'Jefe de Rama' },
    { value: 'Subjefe de Rama', label: 'Subjefe de Rama' },
    { value: 'Dirigente', label: 'Dirigente' },
    { value: 'Dirigente en Formación', label: 'Dirigente en Formación' },
    { value: 'Jefe de Grupo', label: 'Jefe de Grupo' },
    { value: 'Subjefe de Grupo', label: 'Subjefe de Grupo' },
    { value: 'Coordinador', label: 'Coordinador' }
  ];

  const nivelesFormacion = [
    { value: 'Básico', label: 'Formación Básica' },
    { value: 'Intermedio', label: 'Formación Intermedia' },
    { value: 'Avanzado', label: 'Formación Avanzada' },
    { value: 'Especializado', label: 'Formación Especializada' }
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    // Filtrar scouts para búsqueda (excluir los que ya son dirigentes)
    if (busquedaScout.trim() === '') {
      setScoutsFiltrados([]);
    } else {
      // Obtener IDs de personas que ya son dirigentes
      const dirigentesPersonaIds = new Set(dirigentes.map(d => d.persona_id));
      const filtrados = scouts
        .filter(scout => 
          !dirigentesPersonaIds.has(scout.persona_id) && 
          `${scout.nombres} ${scout.apellidos}`.toLowerCase().includes(busquedaScout.toLowerCase())
        )
        .slice(0, 10); // Limitar a 10 resultados
      setScoutsFiltrados(filtrados);
    }
  }, [busquedaScout, scouts, dirigentes]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [dirigentesData, scoutsData, estadisticasData] = await Promise.all([
        ScoutService.getAllDirigentes(),
        ScoutService.getAllScouts(),
        ScoutService.getEstadisticasDirigentes()
      ]);

      setDirigentes(dirigentesData);
      setScouts(scoutsData);
      setEstadisticas(estadisticasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos de dirigentes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormularioDirigente, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const seleccionarScout = (scout: Scout) => {
    setFormData(prev => ({ ...prev, scout_id: scout.id }));
    setBusquedaScout(`${scout.nombres} ${scout.apellidos}`);
    setScoutsFiltrados([]);
  };

  const calcularTiempoServicio = (fechaIngreso: string, fechaSalida?: string) => {
    const inicio = new Date(fechaIngreso);
    const fin = fechaSalida ? new Date(fechaSalida) : new Date();
    
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} año${years > 1 ? 's' : ''} ${months > 0 ? `${months} mes${months > 1 ? 'es' : ''}` : ''}`;
    }
    return `${months} mes${months > 1 ? 'es' : ''}`;
  };

  const handleSave = async () => {
    if (!formData.scout_id || !formData.fecha_ingreso_dirigente || !formData.rama_responsable) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await ScoutService.registrarDirigente({
        scout_id: formData.scout_id,
        fecha_ingreso_dirigente: formData.fecha_ingreso_dirigente,
        rama_responsable: formData.rama_responsable,
        cargo: formData.cargo,
        nivel_formacion: formData.nivel_formacion
      });

      await cargarDatos();
      
      // Limpiar formulario
      setFormData({
        scout_id: '',
        fecha_ingreso_dirigente: new Date().toISOString().split('T')[0],
        rama_responsable: '',
        cargo: '',
        nivel_formacion: 'Básico'
      });
      setBusquedaScout('');
    } catch (error) {
      console.error('Error al registrar dirigente:', error);
      setError('Error al registrar el dirigente');
    } finally {
      setLoading(false);
    }
  };

  const handleTrasladoRama = async (dirigenteId: string, nuevaRama: string) => {
    try {
      setLoading(true);
      await ScoutService.trasladarDirigente(dirigenteId, nuevaRama);
      await cargarDatos();
    } catch (error) {
      console.error('Error al trasladar dirigente:', error);
      setError('Error al trasladar el dirigente');
    } finally {
      setLoading(false);
    }
  };

  const handleRetirar = async (dirigenteId: string) => {
    if (!confirm('¿Está seguro de retirar este dirigente? Esta acción cambiará su estado a retirado.')) return;

    try {
      setLoading(true);
      await ScoutService.retirarDirigente(dirigenteId, 'Retirado desde la interfaz');
      await cargarDatos();
    } catch (error) {
      console.error('Error al retirar dirigente:', error);
      setError('Error al retirar el dirigente');
    } finally {
      setLoading(false);
    }
  };

  const marcarInsigniaMadera = async (dirigenteId: string, marcar: boolean) => {
    try {
      setLoading(true);
      await ScoutService.updateDirigente(dirigenteId, {
        insignia_madera: marcar,
        fecha_insignia_madera: marcar ? new Date().toISOString() : undefined
      });
      await cargarDatos();
    } catch (error) {
      console.error('Error al actualizar insignia de madera:', error);
      setError('Error al actualizar la insignia de madera');
    } finally {
      setLoading(false);
    }
  };

  if (loading && dirigentes.length === 0) {
    return (
      <div className="gaming-container">
        <div className="gaming-header">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
            <Shield className="w-10 h-10" />
            🏅 Dirigentes Scout
          </h1>
        </div>
        <div className="gaming-card">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Cargando dirigentes...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gaming-container">
      <div className="gaming-header">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
          <Shield className="w-10 h-10" />
          🏅 Dirigentes Scout
        </h1>
        <p className="text-xl text-gray-300">Administración de dirigentes y sus asignaciones por rama</p>
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
              <h3 className="text-lg font-semibold text-white/90">Total Dirigentes</h3>
              <p className="text-3xl font-bold text-white">{estadisticas.total_dirigentes}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Insignia Madera</h3>
              <p className="text-3xl font-bold text-white">{estadisticas.con_insignia_madera}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Tiempo Promedio</h3>
              <p className="text-3xl font-bold text-white">{estadisticas.tiempo_promedio_servicio}</p>
              <p className="text-sm text-white/70">años</p>
            </div>
            <Clock className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Rama Más Grande</h3>
              <p className="text-lg font-bold text-white">
                {Object.entries(estadisticas.por_rama).length > 0 
                  ? Object.entries(estadisticas.por_rama).reduce((a, b) => a[1] > b[1] ? a : b)[0]
                  : 'N/A'
                }
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Formulario de Registro */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <UserPlus className="w-6 h-6 mr-3 text-orange-400" />
          Registrar Nuevo Dirigente
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="relative">
            <FormField label="Scout a Promover" required>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 z-10" />
                <Input
                  value={busquedaScout}
                  onChange={(e) => setBusquedaScout(e.target.value)}
                  placeholder="Buscar scout registrado"
                  className="pl-10"
                />
              </div>
              {scoutsFiltrados.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white/90 backdrop-blur border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                  {scoutsFiltrados.map((scout) => (
                    <button
                      key={scout.id}
                      onClick={() => seleccionarScout(scout)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-800">{scout.nombres} {scout.apellidos}</div>
                      <div className="text-sm text-gray-600">
                        {scout.rama_actual} - Ingreso: {new Date(scout.fecha_ingreso).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <small className="text-white/70 mt-1 block">
                Busca scouts que no sean dirigentes
              </small>
            </FormField>
          </div>

          <FormField label="Fecha de Ingreso como Dirigente" required>
            <Input
              type="date"
              value={formData.fecha_ingreso_dirigente}
              onChange={(e) => handleInputChange('fecha_ingreso_dirigente', e.target.value)}
            />
          </FormField>

          <FormField label="Rama Asignada" required>
            <Select
              value={formData.rama_responsable}
              onChange={(e) => handleInputChange('rama_responsable', e.target.value)}
              options={[
                { value: '', label: 'Seleccionar rama' },
                ...ramas
              ]}
            />
          </FormField>

          <FormField label="Cargo">
            <Select
              value={formData.cargo}
              onChange={(e) => handleInputChange('cargo', e.target.value)}
              options={[
                { value: '', label: 'Seleccionar cargo' },
                ...cargos
              ]}
            />
          </FormField>

          <FormField label="Nivel de Formación">
            <Select
              value={formData.nivel_formacion}
              onChange={(e) => handleInputChange('nivel_formacion', e.target.value)}
              options={nivelesFormacion}
            />
          </FormField>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading || !formData.scout_id || !formData.fecha_ingreso_dirigente || !formData.rama_responsable}
            className="gaming-btn primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Registrando...' : 'Registrar Dirigente'}
          </button>
        </div>
      </div>

      {/* Lista de Dirigentes */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Shield className="w-6 h-6 mr-3 text-orange-400" />
          Dirigentes Activos ({dirigentes.filter(d => d.estado_dirigente === 'activo').length})
        </h2>

        {dirigentes.length === 0 && !loading && (
          <div className="text-center py-8 text-white/60">
            <Shield className="w-12 h-12 mx-auto mb-4 text-white/30" />
            <p>No hay dirigentes registrados</p>
          </div>
        )}

        <div className="space-y-6">
          {dirigentes
            .filter(d => d.estado_dirigente === 'activo')
            .map((dirigente) => (
            <div key={dirigente.id} className="backdrop-blur-md bg-white/5 rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {dirigente.scouts.nombres} {dirigente.scouts.apellidos}
                      {dirigente.insignia_madera && (
                        <Star className="w-5 h-5 text-yellow-400 inline ml-2" />
                      )}
                    </h3>
                    <p className="text-sm text-white/70">
                      Dirigente desde: {new Date(dirigente.fecha_ingreso_dirigente).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-white/70">
                      Código: {dirigente.codigo_dirigente}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-300">
                    {dirigente.rama_responsable || 'Sin asignar'}
                  </span>
                  <Select
                    value=""
                    onChange={(e) => e.target.value && handleTrasladoRama(dirigente.id, e.target.value)}
                    options={[
                      { value: '', label: 'Trasladar a...' },
                      ...ramas.filter(rama => rama.value !== dirigente.rama_responsable)
                    ]}
                    className="text-sm min-w-[140px]"
                  />
                  <button
                    onClick={() => marcarInsigniaMadera(dirigente.id, !dirigente.insignia_madera)}
                    className={`p-2 rounded-lg transition-colors ${
                      dirigente.insignia_madera 
                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                    title={dirigente.insignia_madera ? 'Quitar Insignia de Madera' : 'Otorgar Insignia de Madera'}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRetirar(dirigente.id)}
                    className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Retirar dirigente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Información de Contacto</p>
                    <p className="text-white/90">
                      {dirigente.scouts.celular && `📱 ${dirigente.scouts.celular}`}
                      {dirigente.scouts.celular && dirigente.scouts.correo && ' | '}
                      {dirigente.scouts.correo && `📧 ${dirigente.scouts.correo}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60 mb-1">Detalles del Servicio</p>
                    <div className="flex flex-wrap gap-2">
                      {dirigente.cargo && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                          {dirigente.cargo}
                        </span>
                      )}
                      {dirigente.nivel_formacion && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                          {dirigente.nivel_formacion}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">
                        {calcularTiempoServicio(dirigente.fecha_ingreso_dirigente)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}