// ============================================================================
// SEGUIMIENTO DE ESPECIALIDADES
// ============================================================================
// Sistema de Gestión Scout - Grupo Scout Lima 12
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronUp,
  Upload,
  Trash2,
  Video,
  X,
  Search,
  User,
  Check,
  Pencil,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import EspecialidadesService from '../../services/especialidadesService';
import ScoutService from '../../services/scoutService';
import type { 
  FaseId,
  FaseEstado,
  ProgresoEspecialidad
} from '../../types/especialidades';
import { 
  FASE_LABELS, 
  ESTADO_COLORS, 
  AREA_GRADIENTS,
  AreaId
} from '../../types/especialidades';

// Colores por rama para badges
const RAMA_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'MANADA': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  'TROPA': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  'COMUNIDAD': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  'CLAN': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
};

interface SeguimientoEspecialidadesProps {
  onBack?: () => void;
  onAsignarClick?: () => void;
}

interface Scout {
  id: string;
  codigo_scout?: string;
  nombres: string;
  apellidos: string;
  rama_actual?: string;
  estado?: string;
}

export default function SeguimientoEspecialidades({ 
  onBack,
  onAsignarClick 
}: SeguimientoEspecialidadesProps) {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [selectedScout, setSelectedScout] = useState<string>('');
  const [progresos, setProgresos] = useState<ProgresoEspecialidad[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingScouts, setLoadingScouts] = useState(true);
  const [stats, setStats] = useState({ total: 0, completadas: 0, en_progreso: 0 });
  
  // Estado para el selector mejorado
  const [scoutSearchOpen, setScoutSearchOpen] = useState(false);
  const [scoutSearchQuery, setScoutSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setScoutSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    cargarScouts();
  }, []);

  useEffect(() => {
    if (selectedScout) {
      cargarProgresosScout();
    } else {
      setProgresos([]);
      setStats({ total: 0, completadas: 0, en_progreso: 0 });
    }
  }, [selectedScout]);

  const cargarScouts = async () => {
    try {
      setLoadingScouts(true);
      const data = await ScoutService.getAllScouts();
      // Filtrar solo scouts activos
      const activos = data.filter(s => s.estado === 'ACTIVO');
      setScouts(activos);
    } catch (error) {
      console.error('Error cargando scouts:', error);
      toast.error('Error al cargar scouts');
    } finally {
      setLoadingScouts(false);
    }
  };

  const cargarProgresosScout = async () => {
    if (!selectedScout) return;
    
    try {
      setLoading(true);
      const response = await EspecialidadesService.obtenerEspecialidadesScout(selectedScout);
      setProgresos(response.especialidades);
      setStats({
        total: response.total,
        completadas: response.completadas,
        en_progreso: response.en_progreso
      });
    } catch (error) {
      console.error('Error cargando progresos:', error);
      toast.error('Error al cargar especialidades del scout');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFase = async (progresoId: string, fase: FaseId, estadoActual: FaseEstado) => {
    const nuevoEstado = EspecialidadesService.getSiguienteEstadoFase(estadoActual);
    
    try {
      const result = await EspecialidadesService.actualizarFaseEspecialidad({
        progreso_id: progresoId,
        fase,
        nuevo_estado: nuevoEstado
      });

      if (result.especialidad_completada) {
        toast.success('🎉 ¡Especialidad completada!');
      }

      // Recargar datos
      cargarProgresosScout();
    } catch (error) {
      console.error('Error actualizando fase:', error);
      toast.error('Error al actualizar fase');
    }
  };

  const handleEliminarProgreso = async (progresoId: string) => {
    if (!confirm('¿Eliminar esta especialidad del scout? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await EspecialidadesService.eliminarEspecialidadScout(progresoId);
      toast.success('Especialidad eliminada');
      cargarProgresosScout();
    } catch (error) {
      console.error('Error eliminando progreso:', error);
      toast.error('Error al eliminar especialidad');
    }
  };

  const scoutSeleccionado = scouts.find(s => s.id === selectedScout);
  
  // Filtrar scouts por búsqueda
  const scoutsFiltrados = scouts.filter(s => {
    if (!scoutSearchQuery) return true;
    const query = scoutSearchQuery.toLowerCase();
    return (
      s.nombres.toLowerCase().includes(query) ||
      s.apellidos.toLowerCase().includes(query) ||
      (s.codigo_scout?.toLowerCase().includes(query) ?? false) ||
      (s.rama_actual?.toLowerCase().includes(query) ?? false)
    );
  });
  
  // Obtener iniciales para avatar
  const getInitials = (nombres: string, apellidos: string) => {
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
  };
  
  // Obtener color de rama
  const getRamaColor = (rama?: string) => {
    return RAMA_COLORS[rama || ''] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              📊 Seguimiento de Especialidades
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Gestiona el progreso de las especialidades asignadas
            </p>
          </div>
        </div>
        
        {onAsignarClick && (
          <button
            onClick={onAsignarClick}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Asignar Especialidad
          </button>
        )}
      </div>

      {/* Selector de Scout Mejorado */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Seleccionar Scout
        </label>
        
        <div className="relative" ref={dropdownRef}>
          {/* Botón del selector */}
          <button
            type="button"
            onClick={() => setScoutSearchOpen(!scoutSearchOpen)}
            disabled={loadingScouts}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 border rounded-xl transition-all ${
              scoutSearchOpen 
                ? 'border-blue-500 ring-2 ring-blue-200 bg-white' 
                : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
            } ${loadingScouts ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
          >
            {loadingScouts ? (
              <span className="text-gray-500 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                Cargando scouts...
              </span>
            ) : scoutSeleccionado ? (
              <div className="flex items-center gap-3">
                {/* Avatar con iniciales */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  getRamaColor(scoutSeleccionado.rama_actual).bg
                } ${getRamaColor(scoutSeleccionado.rama_actual).text}`}>
                  {getInitials(scoutSeleccionado.nombres, scoutSeleccionado.apellidos)}
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    {scoutSeleccionado.nombres} {scoutSeleccionado.apellidos}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {scoutSeleccionado.codigo_scout && (
                      <span className="text-xs text-gray-500">{scoutSeleccionado.codigo_scout}</span>
                    )}
                    {scoutSeleccionado.rama_actual && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        getRamaColor(scoutSeleccionado.rama_actual).bg
                      } ${getRamaColor(scoutSeleccionado.rama_actual).text}`}>
                        {scoutSeleccionado.rama_actual}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-gray-500 flex items-center gap-2">
                <User className="w-5 h-5" />
                Seleccionar un scout...
              </span>
            )}
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${scoutSearchOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown */}
          {scoutSearchOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Campo de búsqueda */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, código o rama..."
                    value={scoutSearchQuery}
                    onChange={(e) => setScoutSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    autoFocus
                  />
                </div>
              </div>
              
              {/* Lista de scouts */}
              <div className="max-h-72 overflow-y-auto">
                {scoutsFiltrados.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <User className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No se encontraron scouts</p>
                  </div>
                ) : (
                  scoutsFiltrados.map((scout) => {
                    const isSelected = scout.id === selectedScout;
                    const ramaColor = getRamaColor(scout.rama_actual);
                    
                    return (
                      <button
                        key={scout.id}
                        onClick={() => {
                          setSelectedScout(scout.id);
                          setScoutSearchOpen(false);
                          setScoutSearchQuery('');
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          ramaColor.bg
                        } ${ramaColor.text}`}>
                          {getInitials(scout.nombres, scout.apellidos)}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 text-left min-w-0">
                          <p className={`font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                            {scout.nombres} {scout.apellidos}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {scout.codigo_scout && (
                              <span className="text-xs text-gray-500">{scout.codigo_scout}</span>
                            )}
                            {scout.rama_actual && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${ramaColor.bg} ${ramaColor.text}`}>
                                {scout.rama_actual}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Check si está seleccionado */}
                        {isSelected && (
                          <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              
              {/* Footer con conteo */}
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500">
                  {scoutsFiltrados.length} de {scouts.length} scouts
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats del scout seleccionado */}
      {selectedScout && scoutSeleccionado && (
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold">
                {scoutSeleccionado.nombres} {scoutSeleccionado.apellidos}
              </h2>
              <p className="text-blue-100">
                {scoutSeleccionado.rama_actual} • Código: {scoutSeleccionado.codigo_scout}
              </p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-sm text-blue-100">Asignadas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.completadas}</div>
                <div className="text-sm text-blue-100">Completadas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.en_progreso}</div>
                <div className="text-sm text-blue-100">En Progreso</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de progresos */}
      {!selectedScout ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-6xl mb-4">👆</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Selecciona un Scout
          </h3>
          <p className="text-gray-500">
            Elige un scout para ver y gestionar sus especialidades
          </p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : progresos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No hay especialidades asignadas
          </h3>
          <p className="text-gray-500 mb-4">
            Este scout aún no tiene especialidades asignadas
          </p>
          {onAsignarClick && (
            <button
              onClick={onAsignarClick}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium"
            >
              Asignar Primera Especialidad
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {progresos.map((progreso) => (
            <ProgresoCard
              key={progreso.progreso_id}
              progreso={progreso}
              isExpanded={expanded === progreso.progreso_id}
              onToggle={() => setExpanded(
                expanded === progreso.progreso_id ? null : progreso.progreso_id
              )}
              onToggleFase={handleToggleFase}
              onEliminar={() => handleEliminarProgreso(progreso.progreso_id)}
              onRecargar={cargarProgresosScout}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CARD DE PROGRESO
// ============================================================================

interface ProgresoCardProps {
  progreso: ProgresoEspecialidad;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleFase: (progresoId: string, fase: FaseId, estadoActual: FaseEstado) => void;
  onEliminar: () => void;
  onRecargar: () => void;
}

function ProgresoCard({ 
  progreso, 
  isExpanded, 
  onToggle, 
  onToggleFase,
  onEliminar,
  onRecargar
}: ProgresoCardProps) {
  // Estado para edición de fechas
  const [editandoFechas, setEditandoFechas] = useState(false);
  const [fechasEdit, setFechasEdit] = useState({ fecha_inicio: '', fecha_fin: '' });
  const [guardandoFechas, setGuardandoFechas] = useState(false);
  
  // Estado para menú de fase
  const [faseMenuAbierto, setFaseMenuAbierto] = useState<string | null>(null);
  const [completandoTodo, setCompletandoTodo] = useState(false);

  const areaGradient = AREA_GRADIENTS[progreso.area.codigo as AreaId] || 'from-gray-500 to-gray-600';
  const porcentaje = EspecialidadesService.calcularPorcentajeProgreso({
    exploracion: progreso.fase_exploracion,
    taller: progreso.fase_taller,
    desafio: progreso.fase_desafio
  });
  
  // Completar todas las fases de una vez
  const completarTodo = async () => {
    try {
      setCompletandoTodo(true);
      const fases: FaseId[] = ['exploracion', 'taller', 'desafio'];
      
      for (const fase of fases) {
        const estadoActual = progreso[`fase_${fase}`] as FaseEstado;
        if (estadoActual !== 'completada') {
          // Llamar hasta que esté completada
          if (estadoActual === 'pendiente') {
            await onToggleFaseDirecto(progreso.progreso_id, fase, 'en_progreso');
          }
          await onToggleFaseDirecto(progreso.progreso_id, fase, 'completada');
        }
      }
      
      toast.success('🎉 ¡Especialidad completada!');
      onRecargar();
    } catch (error) {
      console.error('Error completando fases:', error);
      toast.error('Error al completar fases');
    } finally {
      setCompletandoTodo(false);
    }
  };
  
  // Cambiar fase a un estado específico
  const onToggleFaseDirecto = async (progresoId: string, fase: FaseId, nuevoEstado: FaseEstado) => {
    const { data, error } = await supabase.rpc('api_actualizar_fase_especialidad', {
      p_progreso_id: progresoId,
      p_fase: fase,
      p_nuevo_estado: nuevoEstado
    });
    
    if (error) throw error;
    return data;
  };
  
  // Manejar cambio de estado desde el menú
  const handleCambiarEstado = async (fase: FaseId, nuevoEstado: FaseEstado) => {
    try {
      const result = await onToggleFaseDirecto(progreso.progreso_id, fase, nuevoEstado);
      
      if (result?.especialidad_completada) {
        toast.success('🎉 ¡Especialidad completada!');
      }
      
      setFaseMenuAbierto(null);
      onRecargar();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      toast.error('Error al cambiar estado');
    }
  };

  // Iniciar edición de fechas
  const iniciarEdicionFechas = () => {
    setEditandoFechas(true);
    setFechasEdit({
      fecha_inicio: progreso.fecha_inicio || '',
      fecha_fin: progreso.fecha_fin || ''
    });
  };

  // Cancelar edición
  const cancelarEdicionFechas = () => {
    setEditandoFechas(false);
    setFechasEdit({ fecha_inicio: '', fecha_fin: '' });
  };

  // Guardar fechas editadas
  const guardarFechas = async () => {
    if (!fechasEdit.fecha_inicio) {
      toast.error('La fecha de inicio es requerida');
      return;
    }

    try {
      setGuardandoFechas(true);
      await EspecialidadesService.actualizarProgresoEspecialidad({
        progreso_id: progreso.progreso_id,
        fecha_inicio: fechasEdit.fecha_inicio,
        fecha_fin: fechasEdit.fecha_fin || undefined
      });
      toast.success('Fechas actualizadas');
      setEditandoFechas(false);
      onRecargar();
    } catch (error) {
      console.error('Error guardando fechas:', error);
      toast.error('Error al guardar fechas');
    } finally {
      setGuardandoFechas(false);
    }
  };

  const handleSubirEvidencia = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      try {
        for (const file of Array.from(files)) {
          // Subir archivo
          const url = await EspecialidadesService.subirArchivoEvidencia(file, progreso.progreso_id);
          
          // Registrar evidencia
          await EspecialidadesService.agregarEvidencia({
            progreso_id: progreso.progreso_id,
            tipo: file.type.startsWith('video') ? 'video' : 'imagen',
            url,
            nombre_archivo: file.name,
            fase: 'general'
          });
        }
        
        toast.success('Evidencias subidas correctamente');
        onRecargar();
      } catch (error) {
        console.error('Error subiendo evidencia:', error);
        toast.error('Error al subir evidencia');
      }
    };

    input.click();
  };

  const handleEliminarEvidencia = async (evidenciaId: string) => {
    try {
      await EspecialidadesService.eliminarEvidencia(evidenciaId);
      toast.success('Evidencia eliminada');
      onRecargar();
    } catch (error) {
      console.error('Error eliminando evidencia:', error);
      toast.error('Error al eliminar evidencia');
    }
  };

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-shadow hover:shadow-lg ${
      progreso.completada ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
    }`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${areaGradient} flex items-center justify-center text-xl shadow-lg shrink-0`}>
          {progreso.area.icono}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800">{progreso.especialidad.nombre}</h3>
          <p className="text-sm text-gray-500">{progreso.area.nombre}</p>
        </div>

        {/* Indicadores de fase */}
        <div className="flex items-center gap-2 shrink-0">
          {(['exploracion', 'taller', 'desafio'] as const).map((fase) => (
            <span
              key={fase}
              className={`w-3 h-3 rounded-full ${
                progreso[`fase_${fase}`] === 'completada'
                  ? 'bg-green-500'
                  : progreso[`fase_${fase}`] === 'en_progreso'
                  ? 'bg-amber-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Badge completada */}
        {progreso.completada && (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium shrink-0">
            ✓ Completada
          </span>
        )}

        <div className="shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Contenido expandido */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4 animate-fade-in">
          {/* Barra de progreso */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Progreso General</span>
              <span className="font-medium text-gray-800">{porcentaje}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  porcentaje === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>

          {/* Fases */}
          <div className="space-y-3">
            {/* Header con botón Completar Todo */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Fases de la Especialidad</span>
              {porcentaje < 100 && (
                <button
                  onClick={completarTodo}
                  disabled={completandoTodo}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {completandoTodo ? 'Completando...' : 'Completar Todo'}
                </button>
              )}
            </div>
            
            {/* Grid de fases con selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['exploracion', 'taller', 'desafio'] as const).map((fase) => {
                const estado = progreso[`fase_${fase}`] as FaseEstado;
                const menuAbierto = faseMenuAbierto === fase;
                
                return (
                  <div key={fase} className="relative">
                    <button
                      onClick={() => setFaseMenuAbierto(menuAbierto ? null : fase)}
                      className={`w-full p-4 rounded-xl text-center transition-all hover:scale-[1.02] ${ESTADO_COLORS[estado]}`}
                    >
                      <div className="font-medium">{FASE_LABELS[fase]}</div>
                      <div className="text-xs mt-1 capitalize flex items-center justify-center gap-1">
                        {estado === 'completada' && <Check className="w-3 h-3" />}
                        {estado.replace('_', ' ')}
                      </div>
                      <div className="text-xs mt-2 opacity-70 flex items-center justify-center gap-1">
                        <ChevronDown className="w-3 h-3" />
                        Click para cambiar
                      </div>
                    </button>
                    
                    {/* Menú desplegable */}
                    {menuAbierto && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                        {(['pendiente', 'en_progreso', 'completada'] as const).map((opcion) => (
                          <button
                            key={opcion}
                            onClick={() => handleCambiarEstado(fase, opcion)}
                            className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 ${
                              estado === opcion ? 'bg-gray-100 font-medium' : ''
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${
                              opcion === 'completada' ? 'bg-green-500' :
                              opcion === 'en_progreso' ? 'bg-amber-500' : 'bg-gray-300'
                            }`} />
                            <span className="capitalize">{opcion.replace('_', ' ')}</span>
                            {estado === opcion && <Check className="w-3 h-3 ml-auto text-green-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contenido de las Fases (Viñetas) */}
          {(progreso.especialidad.exploracion || progreso.especialidad.taller || progreso.especialidad.desafio) && (
            <FasesContenido progreso={progreso} />
          )}

          {/* Info adicional */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Asesor:</span>
              <p className="font-medium text-gray-800">{progreso.asesor_nombre || 'No asignado'}</p>
            </div>
            
            {/* Fechas - con edición inline */}
            {editandoFechas ? (
              <>
                <div>
                  <span className="text-gray-500">Inicio:</span>
                  <input
                    type="date"
                    value={fechasEdit.fecha_inicio}
                    onChange={(e) => setFechasEdit(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                    className="w-full mt-1 px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <span className="text-gray-500">Completada:</span>
                  <input
                    type="date"
                    value={fechasEdit.fecha_fin}
                    onChange={(e) => setFechasEdit(prev => ({ ...prev, fecha_fin: e.target.value }))}
                    className="w-full mt-1 px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={guardarFechas}
                    disabled={guardandoFechas}
                    className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" />
                    {guardandoFechas ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={cancelarEdicionFechas}
                    className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="group/fecha">
                  <span className="text-gray-500">Inicio:</span>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800">{progreso.fecha_inicio}</p>
                    <button
                      onClick={iniciarEdicionFechas}
                      className="opacity-0 group-hover/fecha:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                      title="Editar fechas"
                    >
                      <Pencil className="w-3 h-3 text-gray-400 hover:text-blue-500" />
                    </button>
                  </div>
                </div>
                {progreso.fecha_fin && (
                  <div>
                    <span className="text-gray-500">Completada:</span>
                    <p className="font-medium text-green-600">{progreso.fecha_fin}</p>
                  </div>
                )}
              </>
            )}
            
            {progreso.notas && (
              <div className="col-span-2">
                <span className="text-gray-500">Notas:</span>
                <p className="font-medium text-gray-800">{progreso.notas}</p>
              </div>
            )}
          </div>

          {/* Evidencias */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-800">
                📸 Evidencias ({progreso.evidencias.length})
              </h4>
              <button
                onClick={handleSubirEvidencia}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >
                <Upload className="w-4 h-4" />
                Subir
              </button>
            </div>
            
            {progreso.evidencias.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay evidencias aún
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {progreso.evidencias.map((ev) => (
                  <div key={ev.id} className="relative group">
                    {ev.tipo === 'imagen' ? (
                      <img
                        src={ev.url}
                        alt={ev.descripcion || 'Evidencia'}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Video className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <button
                      onClick={() => handleEliminarEvidencia(ev.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              onClick={onEliminar}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Asignación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTE DE CONTENIDO DE FASES (VIÑETAS)
// ============================================================================

/**
 * Parsea el texto de una fase en viñetas individuales.
 * El separador es " • " (punto medio con espacios)
 */
function parsearVinetas(texto: string | undefined): string[] {
  if (!texto || texto.trim() === '') return [];
  
  // Separar por el bullet point
  const vinetas = texto.split(' • ').map(v => v.trim()).filter(v => v.length > 0);
  
  // Si no hay separador, devolver el texto completo como una sola viñeta
  return vinetas.length > 0 ? vinetas : [texto];
}

interface FasesContenidoProps {
  progreso: ProgresoEspecialidad;
}

function FasesContenido({ progreso }: FasesContenidoProps) {
  const [faseExpandida, setFaseExpandida] = useState<FaseId | null>(null);
  
  const fases: { id: FaseId; titulo: string; icono: string; color: string; contenido?: string; estado: string }[] = [
    { 
      id: 'exploracion', 
      titulo: 'Exploración', 
      icono: '🔍', 
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      contenido: progreso.especialidad.exploracion,
      estado: progreso.fase_exploracion
    },
    { 
      id: 'taller', 
      titulo: 'Taller', 
      icono: '🔧', 
      color: 'bg-amber-50 border-amber-200 text-amber-800',
      contenido: progreso.especialidad.taller,
      estado: progreso.fase_taller
    },
    { 
      id: 'desafio', 
      titulo: 'Desafío', 
      icono: '🎯', 
      color: 'bg-green-50 border-green-200 text-green-800',
      contenido: progreso.especialidad.desafio,
      estado: progreso.fase_desafio
    }
  ];
  
  return (
    <div className="border-t border-gray-100 pt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">📋 Requisitos por Fase</h4>
      <div className="space-y-2">
        {fases.map((fase) => {
          const vinetas = parsearVinetas(fase.contenido);
          const estaExpandida = faseExpandida === fase.id;
          const completada = fase.estado === 'completada';
          
          if (vinetas.length === 0) return null;
          
          return (
            <div key={fase.id} className={`rounded-lg border overflow-hidden ${fase.color}`}>
              <button
                onClick={() => setFaseExpandida(estaExpandida ? null : fase.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>{fase.icono}</span>
                  <span className="font-medium">{fase.titulo}</span>
                  <span className="text-xs opacity-70">({vinetas.length} requisitos)</span>
                  {completada && (
                    <span className="flex items-center gap-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Completada
                    </span>
                  )}
                </div>
                {estaExpandida ? (
                  <ChevronUp className="w-4 h-4 opacity-60" />
                ) : (
                  <ChevronDown className="w-4 h-4 opacity-60" />
                )}
              </button>
              
              {estaExpandida && (
                <div className="px-4 pb-4 bg-white/50">
                  <ul className="space-y-2">
                    {vinetas.map((vineta, index) => (
                      <li 
                        key={index} 
                        className={`flex items-start gap-2 text-sm ${
                          completada ? 'text-gray-500' : 'text-gray-700'
                        }`}
                      >
                        <span className={`mt-0.5 shrink-0 ${completada ? 'text-green-500' : 'text-gray-400'}`}>
                          {completada ? '✓' : '•'}
                        </span>
                        <span className={completada ? 'line-through' : ''}>{vineta}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
