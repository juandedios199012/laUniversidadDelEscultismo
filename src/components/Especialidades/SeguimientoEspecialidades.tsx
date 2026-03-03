// ============================================================================
// SEGUIMIENTO DE ESPECIALIDADES
// ============================================================================
// Sistema de Gestión Scout - Grupo Scout Lima 12
// ============================================================================

import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronUp,
  Upload,
  Trash2,
  Video,
  X
} from 'lucide-react';
import { toast } from 'sonner';
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

      {/* Selector de Scout */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Scout
        </label>
        <select
          value={selectedScout}
          onChange={(e) => setSelectedScout(e.target.value)}
          className="w-full md:w-96 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          disabled={loadingScouts}
        >
          <option value="">
            {loadingScouts ? 'Cargando scouts...' : '-- Seleccionar un scout --'}
          </option>
          {scouts.map((scout) => (
            <option key={scout.id} value={scout.id}>
              {scout.nombres} {scout.apellidos} - {scout.rama_actual}
            </option>
          ))}
        </select>
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
  const areaGradient = AREA_GRADIENTS[progreso.area.codigo as AreaId] || 'from-gray-500 to-gray-600';
  const porcentaje = EspecialidadesService.calcularPorcentajeProgreso({
    exploracion: progreso.fase_exploracion,
    taller: progreso.fase_taller,
    desafio: progreso.fase_desafio
  });

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['exploracion', 'taller', 'desafio'] as const).map((fase) => {
              const estado = progreso[`fase_${fase}`] as FaseEstado;
              return (
                <button
                  key={fase}
                  onClick={() => onToggleFase(progreso.progreso_id, fase, estado)}
                  className={`p-4 rounded-xl text-center transition-all hover:scale-[1.02] ${ESTADO_COLORS[estado]}`}
                >
                  <div className="font-medium">{FASE_LABELS[fase]}</div>
                  <div className="text-xs mt-1 capitalize">
                    {estado.replace('_', ' ')}
                  </div>
                  <div className="text-xs mt-2 opacity-70">
                    Click para cambiar estado
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info adicional */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Asesor:</span>
              <p className="font-medium text-gray-800">{progreso.asesor_nombre || 'No asignado'}</p>
            </div>
            <div>
              <span className="text-gray-500">Inicio:</span>
              <p className="font-medium text-gray-800">{progreso.fecha_inicio}</p>
            </div>
            {progreso.fecha_fin && (
              <div>
                <span className="text-gray-500">Completada:</span>
                <p className="font-medium text-green-600">{progreso.fecha_fin}</p>
              </div>
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
