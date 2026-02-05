import { useState, useEffect } from 'react';
import { Users, Calendar, Save, UserPlus, Trash2, Search, Clock, TrendingUp, User, BarChart } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';
import { ScoutService } from '../../services/scoutService';
import { usePermissions } from '../../contexts/PermissionsContext';

interface FormularioComite {
  nombre: string;
  cargo: 'presidente' | 'secretario' | 'tesorero' | 'vocal' | 'suplente';
  periodo: string;
  fecha_eleccion: string;
  fecha_culminacion: string;
  telefono: string;
  correo: string;
  familiar_id?: string;
}

interface MiembroComite {
  id: string;
  nombre: string;
  cargo: string;
  periodo: string;
  fecha_eleccion: string;
  fecha_culminacion: string;
  telefono?: string;
  correo?: string;
  estado: 'activo' | 'culminado' | 'renunciado';
  familiar_id?: string;
  familiares_scout?: {
    nombres: string;
    apellidos: string;
    scouts: {
      nombres: string;
      apellidos: string;
    };
  };
}

export default function ComitePadresMigrated() {
  // Permisos
  const { puedeCrear, puedeEliminar } = usePermissions();
  
  const [formData, setFormData] = useState<FormularioComite>({
    nombre: '',
    cargo: 'vocal',
    periodo: '',
    fecha_eleccion: '',
    fecha_culminacion: '',
    telefono: '',
    correo: ''
  });

  const [comiteActual, setComiteActual] = useState<MiembroComite[]>([]);
  const [familiaresSugeridos, setFamiliaresSugeridos] = useState<any[]>([]);
  const [busquedaFamiliar, setBusquedaFamiliar] = useState('');
  const [estadisticas, setEstadisticas] = useState<{
    miembros_activos: number;
    por_cargo: Record<string, number>;
    periodos_registrados: number;
    periodo_actual: string | null;
  }>({
    miembros_activos: 0,
    por_cargo: {},
    periodos_registrados: 0,
    periodo_actual: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargos = [
    { value: 'presidente', label: 'Presidente(a)' },
    { value: 'secretario', label: 'Secretario(a)' },
    { value: 'tesorero', label: 'Tesorero(a)' },
    { value: 'vocal', label: 'Vocal' },
    { value: 'suplente', label: 'Suplente' }
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    // Auto-calcular período cuando cambien las fechas
    if (formData.fecha_eleccion && formData.fecha_culminacion) {
      const periodo = calcularPeriodo(formData.fecha_eleccion, formData.fecha_culminacion);
      if (periodo !== formData.periodo) {
        setFormData(prev => ({ ...prev, periodo }));
      }
    }
  }, [formData.fecha_eleccion, formData.fecha_culminacion]);

  useEffect(() => {
    // Buscar familiares cuando se escriba en el campo de búsqueda
    if (busquedaFamiliar.trim().length >= 3) {
      buscarFamiliares(busquedaFamiliar);
    } else {
      setFamiliaresSugeridos([]);
    }
  }, [busquedaFamiliar]);

  const calcularPeriodo = (fechaEleccion: string, fechaCulminacion: string): string => {
    if (!fechaEleccion || !fechaCulminacion) return '';
    
    const fechaE = new Date(fechaEleccion);
    const fechaC = new Date(fechaCulminacion);
    
    return `${fechaE.getFullYear()}-${fechaC.getFullYear()}`;
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [comiteData, estadisticasData] = await Promise.all([
        ScoutService.getComitePadres(),
        ScoutService.getEstadisticasComite()
      ]);

      setComiteActual(comiteData);
      setEstadisticas(estadisticasData);
      
      // Establecer período por defecto si hay un período actual
      if (estadisticasData.periodo_actual && !formData.periodo) {
        setFormData(prev => ({ ...prev, periodo: estadisticasData.periodo_actual || '' }));
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos del comité de padres');
    } finally {
      setLoading(false);
    }
  };

  const buscarFamiliares = async (busqueda: string) => {
    try {
      const familiares = await ScoutService.buscarFamiliares(busqueda);
      setFamiliaresSugeridos(familiares);
    } catch (error) {
      console.error('Error al buscar familiares:', error);
    }
  };

  const seleccionarFamiliar = (familiar: any) => {
    setFormData(prev => ({
      ...prev,
      nombre: `${familiar.nombres} ${familiar.apellidos}`,
      telefono: familiar.celular || familiar.telefono || '',
      correo: familiar.correo || '',
      familiar_id: familiar.id
    }));
    setBusquedaFamiliar(`${familiar.nombres} ${familiar.apellidos}`);
    setFamiliaresSugeridos([]);
  };

  const handleInputChange = (field: keyof FormularioComite, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Si cambia el nombre manualmente, limpiar familiar_id
    if (field === 'nombre') {
      setBusquedaFamiliar(value);
      setFormData(prev => ({ ...prev, familiar_id: undefined }));
    }
  };

  const handleSave = async () => {
    // Verificar permiso
    if (!puedeCrear('comite_padres')) {
      setError('No tienes permiso para registrar miembros del comité');
      return;
    }
    
    if (!formData.nombre || !formData.cargo || !formData.fecha_eleccion || !formData.fecha_culminacion) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await ScoutService.registrarMiembroComite({
        nombre: formData.nombre,
        cargo: formData.cargo,
        periodo: formData.periodo,
        fecha_eleccion: formData.fecha_eleccion,
        fecha_culminacion: formData.fecha_culminacion,
        telefono: formData.telefono,
        correo: formData.correo,
        familiar_id: formData.familiar_id
      });

      await cargarDatos();
      
      // Limpiar formulario manteniendo el período
      const periodoActual = formData.periodo;
      setFormData({
        nombre: '',
        cargo: 'vocal',
        periodo: periodoActual,
        fecha_eleccion: '',
        fecha_culminacion: '',
        telefono: '',
        correo: ''
      });
      setBusquedaFamiliar('');
    } catch (error) {
      console.error('Error al registrar miembro:', error);
      setError('Error al registrar el miembro del comité');
    } finally {
      setLoading(false);
    }
  };

  const handleRemover = async (id: string) => {
    // Verificar permiso
    if (!puedeEliminar('comite_padres')) {
      alert('No tienes permiso para remover miembros del comité');
      return;
    }
    
    if (!confirm('¿Está seguro de remover este miembro del comité?')) return;

    try {
      setLoading(true);
      await ScoutService.removerMiembroComite(id, 'Removido desde la interfaz');
      await cargarDatos();
    } catch (error) {
      console.error('Error al remover miembro:', error);
      setError('Error al remover el miembro del comité');
    } finally {
      setLoading(false);
    }
  };

  const diasRestantes = (fechaCulminacion: string): number => {
    const fecha = new Date(fechaCulminacion);
    const hoy = new Date();
    const diffTime = fecha.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading && comiteActual.length === 0) {
    return (
      <div className="gaming-container">
        <div className="gaming-header">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
            <Users className="w-10 h-10" />
            👨‍👩‍👧‍👦 Comité de Padres
          </h1>
        </div>
        <div className="gaming-card">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Cargando comité de padres...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gaming-container">
      <div className="gaming-header">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
          <Users className="w-10 h-10" />
          👨‍👩‍👧‍👦 Comité de Padres
        </h1>
        <p className="text-xl text-gray-300">Gestión del comité de padres de familia que representa al grupo scout</p>
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
              <h3 className="text-lg font-semibold text-white/90">Miembros Activos</h3>
              <p className="text-3xl font-bold text-white">{estadisticas.miembros_activos}</p>
            </div>
            <User className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Períodos</h3>
              <p className="text-3xl font-bold text-white">{estadisticas.periodos_registrados}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Período Actual</h3>
              <p className="text-lg font-bold text-white">{estadisticas.periodo_actual || 'N/A'}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Cargos Ocupados</h3>
              <p className="text-3xl font-bold text-white">{Object.keys(estadisticas.por_cargo).length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Formulario de Registro */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <UserPlus className="w-6 h-6 mr-3 text-blue-400" />
          Registrar Nuevo Miembro del Comité
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="relative">
            <FormField label="Nombre Completo" required>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 z-10" />
                <Input
                  value={busquedaFamiliar}
                  onChange={(e) => {
                    setBusquedaFamiliar(e.target.value);
                    handleInputChange('nombre', e.target.value);
                  }}
                  placeholder="Buscar familiar registrado o ingresar nuevo"
                  className="pl-10"
                />
              </div>
              {familiaresSugeridos.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white/90 backdrop-blur border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                  {familiaresSugeridos.map((familiar) => (
                    <button
                      key={familiar.id}
                      onClick={() => seleccionarFamiliar(familiar)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-800">{familiar.nombres} {familiar.apellidos}</div>
                      <div className="text-sm text-gray-600">
                        {familiar.parentesco} de {familiar.scouts?.nombres} {familiar.scouts?.apellidos}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <small className="text-white/70 mt-1 block">
                Busque si el familiar ya está registrado en el sistema
              </small>
            </FormField>
          </div>

          <FormField label="Cargo" required>
            <Select
              value={formData.cargo}
              onChange={(e) => handleInputChange('cargo', e.target.value as FormularioComite['cargo'])}
              options={cargos}
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

          <FormField label="Fecha de Elección" required>
            <Input
              type="date"
              value={formData.fecha_eleccion}
              onChange={(e) => handleInputChange('fecha_eleccion', e.target.value)}
            />
          </FormField>

          <FormField label="Fecha de Culminación" required>
            <Input
              type="date"
              value={formData.fecha_culminacion}
              onChange={(e) => handleInputChange('fecha_culminacion', e.target.value)}
            />
          </FormField>
        </div>

        {formData.periodo && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-blue-300 font-medium">
                Período calculado: {formData.periodo}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading || !formData.nombre || !formData.cargo || !formData.fecha_eleccion || !formData.fecha_culminacion}
            className="gaming-btn primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Registrando...' : 'Registrar Miembro'}
          </button>
        </div>
      </div>

      {/* Tabla de Comité Actual */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Users className="w-6 h-6 mr-3 text-green-400" />
          Comité Actual ({comiteActual.length} miembros)
        </h2>

        {comiteActual.length === 0 && !loading && (
          <div className="text-center py-8 text-white/60">
            <Users className="w-12 h-12 mx-auto mb-4 text-white/30" />
            <p>No hay miembros registrados en el comité</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-3 px-4 font-semibold text-white">Nombre</th>
                <th className="text-left py-3 px-4 font-semibold text-white">Cargo</th>
                <th className="text-left py-3 px-4 font-semibold text-white">Período</th>
                <th className="text-left py-3 px-4 font-semibold text-white">Contacto</th>
                <th className="text-left py-3 px-4 font-semibold text-white">Estado</th>
                <th className="text-left py-3 px-4 font-semibold text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comiteActual.map((miembro, index) => (
                <tr key={miembro.id} className={`border-b border-white/10 hover:bg-white/5 transition-colors`}>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-white">{miembro.nombre}</div>
                      <div className="text-sm text-white/70">{miembro.correo}</div>
                      {miembro.familiares_scout && (
                        <div className="text-xs text-white/60">
                          Familiar de: {miembro.familiares_scout.scouts?.nombres} {miembro.familiares_scout.scouts?.apellidos}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300">
                      {miembro.cargo.charAt(0).toUpperCase() + miembro.cargo.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-white">{miembro.periodo}</div>
                      <div className="text-sm text-white/70">
                        {new Date(miembro.fecha_eleccion).toLocaleDateString()} - {new Date(miembro.fecha_culminacion).toLocaleDateString()}
                      </div>
                      {diasRestantes(miembro.fecha_culminacion) > 0 && (
                        <div className="text-xs text-yellow-400">
                          {diasRestantes(miembro.fecha_culminacion)} días restantes
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-white/80">
                      {miembro.telefono && <div>📱 {miembro.telefono}</div>}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      miembro.estado === 'activo' ? 'bg-green-500/20 text-green-300' :
                      miembro.estado === 'culminado' ? 'bg-gray-500/20 text-gray-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {miembro.estado}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleRemover(miembro.id)}
                      className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Remover miembro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}