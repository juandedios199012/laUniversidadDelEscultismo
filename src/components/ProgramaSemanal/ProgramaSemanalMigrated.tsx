import { useState, useEffect } from 'react';
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
  Timer,
  BookOpen,
  TrendingUp,
  BarChart
} from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';
import { AREAS_CRECIMIENTO } from '../../data/constants';
import { ScoutService } from '../../services/scoutService';
import { usePermissions } from '../../contexts/PermissionsContext';
import { supabase } from '../../lib/supabase';
import type { Scout } from '../../lib/supabase';

interface FormularioPrograma {
  rama: string;
  semana_inicio: string;
  semana_fin: string;
  tema_semanal?: string;
  objetivos?: string;
  materiales_necesarios?: string;
  responsable?: string;
  lunes?: string;
  martes?: string;
  miercoles?: string;
  jueves?: string;
  viernes?: string;
  sabado?: string;
  domingo?: string;
  estado: 'borrador' | 'publicado' | 'archivado';
}

interface ProgramaSemanal {
  id: string;
  rama: string;
  semana_inicio: string;
  semana_fin: string;
  tema_semanal?: string;
  objetivos?: string;
  materiales_necesarios?: string;
  responsable?: string;
  lunes?: string;
  martes?: string;
  miercoles?: string;
  jueves?: string;
  viernes?: string;
  sabado?: string;
  domingo?: string;
  estado: 'borrador' | 'publicado' | 'archivado';
  created_at: string;
  updated_at: string;
}

export default function ProgramaSemanalMigrated() {
  // Permisos
  const { puedeCrear } = usePermissions();
  
  const [formData, setFormData] = useState<FormularioPrograma>({
    rama: '',
    semana_inicio: '',
    semana_fin: '',
    tema_semanal: '',
    objetivos: '',
    materiales_necesarios: '',
    responsable: '',
    lunes: '',
    martes: '',
    miercoles: '',
    jueves: '',
    viernes: '',
    sabado: '',
    domingo: '',
    estado: 'borrador'
  });

  const [programas, setProgramas] = useState<ProgramaSemanal[]>([]);
  const [dirigentes, setDirigentes] = useState<Scout[]>([]);
  const [estadisticas, setEstadisticas] = useState<{
    total_programas: number;
    por_rama: Record<string, number>;
    por_estado: Record<string, number>;
    programas_mes: number;
  }>({
    total_programas: 0,
    por_rama: {},
    por_estado: {},
    programas_mes: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ramas = [
    { value: 'Manada', label: 'Manada (7-10 años)' },
    { value: 'Tropa', label: 'Tropa (11-14 años)' },
    { value: 'Caminante', label: 'Caminante (15-17 años)' },
    { value: 'Clan', label: 'Clan (18-21 años)' }
  ];

  const diasSemana = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    // Auto-calcular fin de semana cuando cambie el inicio
    if (formData.semana_inicio) {
      const fechaInicio = new Date(formData.semana_inicio);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaInicio.getDate() + 6);
      
      setFormData(prev => ({
        ...prev,
        semana_fin: fechaFin.toISOString().split('T')[0]
      }));
    }
  }, [formData.semana_inicio]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [programasData, scoutsData, estadisticasData, dirigentesData] = await Promise.all([
        ScoutService.getProgramasSemanales(10), // Últimos 10 programas
        ScoutService.getAllScouts(),
        ScoutService.getEstadisticasProgramas(),
        supabase.from('dirigentes').select(`
          id,
          persona_id,
          cargo,
          personas!inner(nombres, apellidos)
        `).eq('estado', 'ACTIVO')
      ]);

      setProgramas(programasData);
      // Formatear dirigentes desde tabla dirigentes
      const dirigentesFormateados = (dirigentesData.data || []).map((d: any) => ({
        id: d.persona_id,
        nombres: d.personas.nombres,
        apellidos: d.personas.apellidos,
        cargo: d.cargo
      }));
      setDirigentes(dirigentesFormateados as any);
      setEstadisticas(estadisticasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos de programas semanales');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormularioPrograma, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const guardarPrograma = async () => {
    // Verificar permiso
    if (!puedeCrear('programa_semanal')) {
      setError('No tienes permiso para crear programas semanales');
      return;
    }
    
    if (!formData.rama || !formData.semana_inicio || !formData.objetivos) {
      setError('Por favor complete los campos obligatorios: Rama, Fecha de inicio y Objetivos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await ScoutService.createProgramaSemanal({
        rama: formData.rama,
        semana_inicio: formData.semana_inicio,
        semana_fin: formData.semana_fin,
        tema_semanal: formData.tema_semanal,
        objetivos: formData.objetivos,
        materiales_necesarios: formData.materiales_necesarios,
        responsable: formData.responsable,
        lunes: formData.lunes,
        martes: formData.martes,
        miercoles: formData.miercoles,
        jueves: formData.jueves,
        viernes: formData.viernes,
        sabado: formData.sabado,
        domingo: formData.domingo,
        estado: formData.estado
      });

      await cargarDatos();
      
      // Limpiar formulario
      setFormData({
        rama: '',
        semana_inicio: '',
        semana_fin: '',
        tema_semanal: '',
        objetivos: '',
        materiales_necesarios: '',
        responsable: '',
        lunes: '',
        martes: '',
        miercoles: '',
        jueves: '',
        viernes: '',
        sabado: '',
        domingo: '',
        estado: 'borrador'
      });
    } catch (error) {
      console.error('Error al guardar programa:', error);
      setError('Error al guardar el programa semanal');
    } finally {
      setLoading(false);
    }
  };

  const eliminarPrograma = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este programa semanal?')) return;

    try {
      setLoading(true);
      await ScoutService.deleteProgramaSemanal(id);
      await cargarDatos();
    } catch (error) {
      console.error('Error al eliminar programa:', error);
      setError('Error al eliminar el programa semanal');
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (id: string, nuevoEstado: 'borrador' | 'publicado' | 'archivado') => {
    try {
      setLoading(true);
      await ScoutService.updateProgramaSemanal(id, { estado: nuevoEstado });
      await cargarDatos();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      setError('Error al cambiar el estado del programa');
    } finally {
      setLoading(false);
    }
  };

  if (loading && programas.length === 0) {
    return (
      <div className="gaming-container">
        <div className="gaming-header">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
            <Calendar className="w-10 h-10" />
            📅 Programa Semanal
          </h1>
        </div>
        <div className="gaming-card">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Cargando programas semanales...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gaming-container">
      <div className="gaming-header">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
          <Calendar className="w-10 h-10" />
          📅 Programa Semanal
        </h1>
        <p className="text-xl text-gray-300">Planificación detallada de actividades semanales por rama</p>
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
              <h3 className="text-lg font-semibold text-white/90">Total Programas</h3>
              <p className="text-3xl font-bold text-white">{estadisticas.total_programas}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Este Mes</h3>
              <p className="text-3xl font-bold text-white">{estadisticas.programas_mes}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Publicados</h3>
              <p className="text-3xl font-bold text-white">{estadisticas.por_estado.publicado || 0}</p>
            </div>
            <Award className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Rama más Activa</h3>
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

      {/* Formulario de Nuevo Programa */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Nuevo Programa Semanal</h2>
        
        {/* Datos de Cabecera */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          <FormField label="Fecha de Inicio" required>
            <Input
              type="date"
              value={formData.semana_inicio}
              onChange={(e) => handleInputChange('semana_inicio', e.target.value)}
            />
          </FormField>

          <FormField label="Fecha de Fin">
            <Input
              type="date"
              value={formData.semana_fin}
              onChange={(e) => handleInputChange('semana_fin', e.target.value)}
              disabled
              className="bg-white/5"
            />
          </FormField>

          <FormField label="Estado">
            <Select
              value={formData.estado}
              onChange={(e) => handleInputChange('estado', e.target.value as 'borrador' | 'publicado' | 'archivado')}
              options={[
                { value: 'borrador', label: 'Borrador' },
                { value: 'publicado', label: 'Publicado' },
                { value: 'archivado', label: 'Archivado' }
              ]}
            />
          </FormField>

          <FormField label="Responsable">
            <Select
              value={formData.responsable || ''}
              onChange={(e) => handleInputChange('responsable', e.target.value)}
              options={[
                { value: '', label: 'Seleccionar dirigente' },
                ...dirigentes.map(d => ({
                  value: `${d.nombres} ${d.apellidos}`,
                  label: `${d.nombres} ${d.apellidos}`
                }))
              ]}
            />
          </FormField>

          <FormField label="Tema Semanal">
            <Input
              value={formData.tema_semanal || ''}
              onChange={(e) => handleInputChange('tema_semanal', e.target.value)}
              placeholder="Ej: Campismo y Aventura"
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Objetivos" required>
              <Input
                value={formData.objetivos || ''}
                onChange={(e) => handleInputChange('objetivos', e.target.value)}
                placeholder="Objetivos del programa semanal"
              />
            </FormField>
          </div>

          <div className="md:col-span-4">
            <FormField label="Materiales Necesarios">
              <textarea
                rows={3}
                value={formData.materiales_necesarios || ''}
                onChange={(e) => handleInputChange('materiales_necesarios', e.target.value)}
                placeholder="Lista de materiales necesarios para las actividades..."
                className="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white/5 text-white placeholder-white/50"
              />
            </FormField>
          </div>
        </div>

        {/* Actividades por Día */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Actividades por Día</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {diasSemana.map((dia) => (
              <FormField key={dia.key} label={dia.label}>
                <textarea
                  rows={4}
                  value={formData[dia.key as keyof FormularioPrograma] || ''}
                  onChange={(e) => handleInputChange(dia.key as keyof FormularioPrograma, e.target.value)}
                  placeholder={`Actividades para ${dia.label.toLowerCase()}...`}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white/5 text-white placeholder-white/50"
                />
              </FormField>
            ))}
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end">
          <button
            onClick={guardarPrograma}
            disabled={loading || !formData.rama || !formData.semana_inicio || !formData.objetivos}
            className="gaming-btn primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Guardando...' : 'Guardar Programa'}</span>
          </button>
        </div>
      </div>

      {/* Lista de Programas Existentes */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Programas Registrados</h2>
        
        {programas.length === 0 && !loading && (
          <div className="text-center py-8 text-white/60">
            No hay programas registrados. ¡Crea el primer programa semanal!
          </div>
        )}

        <div className="space-y-6">
          {programas.map((programa) => (
            <div key={programa.id} className="backdrop-blur-md bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              {/* Cabecera del Programa */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Programa {programa.rama}
                        {programa.tema_semanal && ` - ${programa.tema_semanal}`}
                      </h3>
                      <p className="text-sm text-white/70">
                        {new Date(programa.semana_inicio).toLocaleDateString()} - {new Date(programa.semana_fin).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      programa.estado === 'publicado' ? 'bg-green-500/20 text-green-300' :
                      programa.estado === 'borrador' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {programa.estado}
                    </span>
                    {programa.estado === 'borrador' && (
                      <button
                        onClick={() => cambiarEstado(programa.id, 'publicado')}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700"
                      >
                        Publicar
                      </button>
                    )}
                    {programa.estado === 'publicado' && (
                      <button
                        onClick={() => cambiarEstado(programa.id, 'archivado')}
                        className="px-3 py-1 bg-gray-600 text-white rounded-lg text-xs hover:bg-gray-700"
                      >
                        Archivar
                      </button>
                    )}
                    <button
                      onClick={() => eliminarPrograma(programa.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Objetivos</p>
                    <p className="text-white/90">{programa.objetivos}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60 mb-1">Responsable</p>
                    <p className="text-white/90">{programa.responsable || 'No asignado'}</p>
                  </div>
                </div>

                {programa.materiales_necesarios && (
                  <div className="mt-4">
                    <p className="text-sm text-white/60 mb-1">Materiales Necesarios</p>
                    <p className="text-white/90">{programa.materiales_necesarios}</p>
                  </div>
                )}
              </div>

              {/* Actividades por Día */}
              <div className="p-6">
                <h4 className="font-semibold text-white mb-4">Actividades Semanales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {diasSemana.map((dia) => {
                    const actividades = programa[dia.key as keyof ProgramaSemanal] as string;
                    if (!actividades) return null;

                    return (
                      <div key={dia.key} className="backdrop-blur-md bg-white/5 rounded-lg p-4">
                        <h5 className="font-medium text-white mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          {dia.label}
                        </h5>
                        <p className="text-sm text-white/80 leading-relaxed">{actividades}</p>
                      </div>
                    );
                  })}
                </div>

                {!diasSemana.some(dia => programa[dia.key as keyof ProgramaSemanal]) && (
                  <div className="text-center py-4 text-white/60">
                    No hay actividades programadas para esta semana
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}