// ============================================================================
// DIALOG PARA ASIGNAR ESPECIALIDAD A UN SCOUT
// ============================================================================
// Implementa formulario multi-paso siguiendo las mejores prácticas de UX
// Sistema de Gestión Scout - Grupo Scout Lima 12
// ============================================================================

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Search,
  User,
  Award,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import EspecialidadesService from '../../../services/especialidadesService';
import ScoutService from '../../../services/scoutService';
import type { 
  Especialidad, 
  AreaEspecialidad,
  AreaId 
} from '../../../types/especialidades';
import { AREA_GRADIENTS } from '../../../types/especialidades';

// ============================================================================
// SCHEMA DE VALIDACIÓN
// ============================================================================

const asignarEspecialidadSchema = z.object({
  scout_id: z.string().min(1, 'Selecciona un scout'),
  especialidad_id: z.string().min(1, 'Selecciona una especialidad'),
  asesor_nombre: z.string().optional(),
  notas: z.string().optional()
});

type AsignarEspecialidadForm = z.infer<typeof asignarEspecialidadSchema>;

// ============================================================================
// TIPOS
// ============================================================================

interface Scout {
  id: string;
  codigo_scout?: string;
  nombres: string;
  apellidos: string;
  rama_actual?: string;
  estado?: string;
}

interface AsignarEspecialidadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scoutPreseleccionado?: string;
  especialidadPreseleccionada?: Especialidad;
  onSuccess?: () => void;
}

const PASOS = [
  { id: 1, titulo: 'Scout', icono: User },
  { id: 2, titulo: 'Especialidad', icono: Award },
  { id: 3, titulo: 'Detalles', icono: FileText }
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AsignarEspecialidadDialog({
  open,
  onOpenChange,
  scoutPreseleccionado,
  especialidadPreseleccionada,
  onSuccess
}: AsignarEspecialidadDialogProps) {
  const [paso, setPaso] = useState(1);
  const [guardando, setGuardando] = useState(false);
  
  // Datos para selectores
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [areas, setAreas] = useState<AreaEspecialidad[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Filtros
  const [busquedaScout, setBusquedaScout] = useState('');
  const [busquedaEspecialidad, setBusquedaEspecialidad] = useState('');
  const [areaSeleccionada, setAreaSeleccionada] = useState<AreaId | null>(null);

  // Form
  const form = useForm<AsignarEspecialidadForm>({
    resolver: zodResolver(asignarEspecialidadSchema),
    defaultValues: {
      scout_id: scoutPreseleccionado || '',
      especialidad_id: especialidadPreseleccionada?.id || '',
      asesor_nombre: '',
      notas: ''
    }
  });

  const scoutId = form.watch('scout_id');
  const especialidadId = form.watch('especialidad_id');

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      cargarDatos();
    }
  }, [open]);

  // Preselecciones
  useEffect(() => {
    if (scoutPreseleccionado) {
      form.setValue('scout_id', scoutPreseleccionado);
      if (!especialidadPreseleccionada) setPaso(2);
    }
    if (especialidadPreseleccionada) {
      form.setValue('especialidad_id', especialidadPreseleccionada.id);
      if (scoutPreseleccionado) setPaso(3);
      else if (!scoutPreseleccionado) setPaso(1);
    }
  }, [scoutPreseleccionado, especialidadPreseleccionada, form]);

  const cargarDatos = async () => {
    try {
      setLoadingData(true);
      const [allScouts, areasData, especialidadesData] = await Promise.all([
        ScoutService.getAllScouts(),
        EspecialidadesService.obtenerAreasEspecialidad(),
        EspecialidadesService.obtenerEspecialidades()
      ]);
      // Filtrar solo scouts activos
      const scoutsActivos = allScouts.filter(s => s.estado === 'ACTIVO');
      setScouts(scoutsActivos);
      setAreas(areasData);
      setEspecialidades(especialidadesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      // Ir al paso con error
      const errors = form.formState.errors;
      if (errors.scout_id) setPaso(1);
      else if (errors.especialidad_id) setPaso(2);
      return;
    }

    setGuardando(true);
    try {
      const data = form.getValues();
      await EspecialidadesService.asignarEspecialidadScout({
        scout_id: data.scout_id,
        especialidad_id: data.especialidad_id,
        asesor_nombre: data.asesor_nombre || undefined,
        notas: data.notas || undefined
      });

      toast.success('¡Especialidad asignada correctamente!');
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error asignando especialidad:', error);
      toast.error(error instanceof Error ? error.message : 'Error al asignar especialidad');
    } finally {
      setGuardando(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setPaso(1);
    setBusquedaScout('');
    setBusquedaEspecialidad('');
    setAreaSeleccionada(null);
    onOpenChange(false);
  };

  // Determinar si un paso está completo (para saltar pasos preseleccionados)
  const pasoScoutCompleto = !!scoutId || !!scoutPreseleccionado;
  const pasoEspecialidadCompleto = !!especialidadId || !!especialidadPreseleccionada;

  const siguientePaso = async () => {
    // Validar paso actual
    if (paso === 1 && !scoutId) {
      toast.error('Selecciona un scout');
      return;
    }
    if (paso === 2 && !especialidadId) {
      toast.error('Selecciona una especialidad');
      return;
    }
    
    // Saltar paso 2 si la especialidad ya está preseleccionada
    if (paso === 1 && especialidadPreseleccionada) {
      setPaso(3);
      return;
    }
    
    // Saltar paso 1 si el scout ya está preseleccionado
    if (paso === 2 && scoutPreseleccionado) {
      setPaso(3);
      return;
    }
    
    if (paso < 3) {
      setPaso(paso + 1);
    }
  };

  const anteriorPaso = () => {
    // Saltar paso 2 si la especialidad está preseleccionada
    if (paso === 3 && especialidadPreseleccionada) {
      setPaso(1);
      return;
    }
    // Saltar paso 1 si el scout está preseleccionado
    if (paso === 3 && scoutPreseleccionado) {
      setPaso(2);
      return;
    }
    if (paso > 1) {
      setPaso(paso - 1);
    }
  };

  // Filtrar scouts
  const scoutsFiltrados = scouts.filter(s => 
    !busquedaScout || 
    `${s.nombres} ${s.apellidos}`.toLowerCase().includes(busquedaScout.toLowerCase()) ||
    (s.codigo_scout?.toLowerCase().includes(busquedaScout.toLowerCase()) ?? false)
  );

  // Filtrar especialidades
  const especialidadesFiltradas = especialidades.filter(e => {
    const matchArea = !areaSeleccionada || e.area.codigo === areaSeleccionada;
    const matchBusqueda = !busquedaEspecialidad || 
      e.nombre.toLowerCase().includes(busquedaEspecialidad.toLowerCase());
    return matchArea && matchBusqueda;
  });

  // Obtener datos seleccionados
  const scoutSeleccionado = scouts.find(s => s.id === scoutId);
  const especialidadSeleccionada = especialidades.find(e => e.id === especialidadId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            🎯 Asignar Especialidad
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between py-4 border-b">
          {PASOS.map((p, index) => {
            const Icon = p.icono;
            const isActive = paso === p.id;
            // Un paso está completo si ya pasamos por él O si está preseleccionado
            const isCompleted = 
              paso > p.id || 
              (p.id === 1 && pasoScoutCompleto && paso !== 1) ||
              (p.id === 2 && pasoEspecialidadCompleto && paso !== 2);
            
            return (
              <div key={p.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-lg'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                    {p.titulo}
                  </span>
                </div>
                {index < PASOS.length - 1 && (
                  <div className={`w-16 md:w-24 h-1 mx-2 rounded ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Contenido del paso */}
        <div className="flex-1 overflow-y-auto py-4">
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* PASO 1: Selección de Scout */}
              {paso === 1 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Banner de especialidad preseleccionada */}
                  {especialidadPreseleccionada && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${AREA_GRADIENTS[especialidadPreseleccionada.area.codigo as AreaId]}`}>
                          {especialidadPreseleccionada.area.icono}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Especialidad seleccionada</p>
                          <p className="font-semibold text-gray-800">{especialidadPreseleccionada.nombre}</p>
                        </div>
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600">
                    {especialidadPreseleccionada 
                      ? 'Selecciona el scout que trabajará en esta especialidad:'
                      : 'Busca y selecciona el scout:'}
                  </p>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar scout por nombre o código..."
                      value={busquedaScout}
                      onChange={(e) => setBusquedaScout(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {scoutsFiltrados.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">No se encontraron scouts</p>
                    ) : (
                      scoutsFiltrados.map((scout) => (
                        <button
                          key={scout.id}
                          type="button"
                          onClick={() => form.setValue('scout_id', scout.id)}
                          className={`w-full p-4 rounded-xl border text-left transition-all ${
                            scoutId === scout.id
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              scoutId === scout.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {scout.nombres[0]}{scout.apellidos[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {scout.nombres} {scout.apellidos}
                              </p>
                              <p className="text-sm text-gray-500">
                                {scout.rama_actual} • {scout.codigo_scout}
                              </p>
                            </div>
                            {scoutId === scout.id && (
                              <Check className="ml-auto w-5 h-5 text-blue-500" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* PASO 2: Selección de Especialidad */}
              {paso === 2 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Banner de scout preseleccionado */}
                  {scoutPreseleccionado && scoutSeleccionado && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-blue-500 text-white">
                          {scoutSeleccionado.nombres[0]}{scoutSeleccionado.apellidos[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Scout seleccionado</p>
                          <p className="font-semibold text-gray-800">{scoutSeleccionado.nombres} {scoutSeleccionado.apellidos}</p>
                        </div>
                        <Check className="w-5 h-5 text-blue-500" />
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600">
                    {scoutPreseleccionado 
                      ? 'Selecciona la especialidad a asignar:'
                      : 'Filtra y busca la especialidad:'}
                  </p>
                  
                  {/* Filtro por área */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAreaSeleccionada(null)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        !areaSeleccionada
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Todas
                    </button>
                    {areas.map((area) => (
                      <button
                        key={area.codigo}
                        type="button"
                        onClick={() => setAreaSeleccionada(area.codigo)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          areaSeleccionada === area.codigo
                            ? `bg-gradient-to-r ${AREA_GRADIENTS[area.codigo]} text-white`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {area.icono} <span className="hidden sm:inline">{area.nombre.split(',')[0]}</span>
                      </button>
                    ))}
                  </div>

                  {/* Búsqueda */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar especialidad..."
                      value={busquedaEspecialidad}
                      onChange={(e) => setBusquedaEspecialidad(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  {/* Lista de especialidades */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {especialidadesFiltradas.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">No se encontraron especialidades</p>
                    ) : (
                      especialidadesFiltradas.map((esp) => (
                        <button
                          key={esp.id}
                          type="button"
                          onClick={() => form.setValue('especialidad_id', esp.id)}
                          className={`w-full p-4 rounded-xl border text-left transition-all ${
                            especialidadId === esp.id
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${AREA_GRADIENTS[esp.area.codigo as AreaId]}`}>
                              {esp.area.icono}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800">{esp.nombre}</p>
                              <p className="text-sm text-gray-500 truncate">{esp.descripcion}</p>
                            </div>
                            {especialidadId === esp.id && (
                              <Check className="w-5 h-5 text-blue-500 shrink-0" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* PASO 3: Detalles adicionales */}
              {paso === 3 && (
                <div className="space-y-6 animate-fade-in">
                  {/* Resumen de selección */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h3 className="font-medium text-gray-700">Resumen de Asignación</h3>
                    
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <User className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Scout</p>
                        <p className="font-medium">
                          {scoutSeleccionado 
                            ? `${scoutSeleccionado.nombres} ${scoutSeleccionado.apellidos}`
                            : 'No seleccionado'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <Award className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500">Especialidad</p>
                        <p className="font-medium">
                          {especialidadSeleccionada?.nombre || 'No seleccionada'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Campos adicionales */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Asesor (Opcional)
                      </label>
                      <input
                        type="text"
                        {...form.register('asesor_nombre')}
                        placeholder="Nombre del asesor de la especialidad"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas (Opcional)
                      </label>
                      <textarea
                        {...form.register('notas')}
                        placeholder="Observaciones o notas adicionales..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer con navegación */}
        <div className="flex justify-between items-center pt-4 border-t">
          {/* Botón Anterior - Solo si no estamos en paso 1 y el paso anterior no está preseleccionado */}
          {(paso > 1 && !(paso === 2 && scoutPreseleccionado) && !(paso === 3 && especialidadPreseleccionada && !scoutPreseleccionado)) ? (
            <button
              type="button"
              onClick={anteriorPaso}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
              {paso === 3 && especialidadPreseleccionada ? 'Cambiar Scout' : 'Anterior'}
            </button>
          ) : (
            <div />
          )}

          {paso < 3 ? (
            <button
              type="button"
              onClick={siguientePaso}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {/* Texto contextual según preselección */}
              {paso === 1 && especialidadPreseleccionada
                ? 'Continuar a Detalles'
                : paso === 2 && scoutPreseleccionado
                ? 'Continuar a Detalles'
                : 'Siguiente'}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={guardando}
              className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Asignar Especialidad
                </>
              )}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
