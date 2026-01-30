// ============================================================================
// OBJETIVO FORM DIALOG - STEPPER MULTI-PASOS
// ============================================================================
// Formulario multi-pasos para crear/editar objetivos educativos
// Implementa el patrón "One Thing at a Time" con validación por paso
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  X, ChevronLeft, ChevronRight, Check, Plus, Trash2,
  Layers, FileText, ListChecks, AlertCircle
} from 'lucide-react';
import { Objetivo, Etapa, AreaCrecimiento } from '../../services/progresionService';
import { 
  objetivoEducativoSchema, 
  ObjetivoEducativoFormData,
  defaultObjetivoValues
} from '../../schemas/objetivoEducativoSchema';

// ============================================================================
// TIPOS Y CONSTANTES
// ============================================================================

interface ObjetivoFormDialogProps {
  objetivo: Objetivo | null;
  etapas: Etapa[];
  areas: AreaCrecimiento[];
  onGuardar: (datos: ObjetivoEducativoFormData) => Promise<void>;
  onCerrar: () => void;
  guardando: boolean;
}

interface PasoConfig {
  id: number;
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
}

const PASOS: PasoConfig[] = [
  {
    id: 1,
    titulo: 'Clasificación',
    descripcion: 'Etapa y área de crecimiento',
    icono: <Layers className="w-5 h-5" />,
  },
  {
    id: 2,
    titulo: 'Contenido',
    descripcion: 'Título y descripción',
    icono: <FileText className="w-5 h-5" />,
  },
  {
    id: 3,
    titulo: 'Indicadores',
    descripcion: 'Indicadores de logro',
    icono: <ListChecks className="w-5 h-5" />,
  },
];

// ============================================================================
// COMPONENTE STEPPER
// ============================================================================

interface StepperProps {
  pasoActual: number;
  modoEdicion: boolean;
  onIrAPaso: (paso: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ pasoActual, modoEdicion, onIrAPaso }) => (
  <div className="flex items-center justify-between mb-8">
    {PASOS.map((paso, index) => {
      const isActivo = paso.id === pasoActual;
      const isCompletado = paso.id < pasoActual;
      const isClickeable = modoEdicion;

      return (
        <React.Fragment key={paso.id}>
          {/* Conector */}
          {index > 0 && (
            <div className={`flex-1 h-1 mx-2 rounded ${
              isCompletado ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
          
          {/* Paso */}
          <button
            type="button"
            onClick={() => isClickeable && onIrAPaso(paso.id)}
            disabled={!isClickeable}
            className={`flex flex-col items-center ${
              isClickeable ? 'cursor-pointer' : 'cursor-default'
            } ${isClickeable ? 'hover:scale-105 transition-transform' : ''}`}
          >
            {/* Círculo del paso */}
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all
              ${isActivo 
                ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                : isCompletado 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-400'
              }
            `}>
              {isCompletado ? (
                <Check className="w-5 h-5" />
              ) : (
                paso.icono
              )}
            </div>
            
            {/* Texto */}
            <span className={`text-sm font-medium ${
              isActivo ? 'text-blue-600' : isCompletado ? 'text-green-600' : 'text-gray-400'
            }`}>
              {paso.titulo}
            </span>
            <span className="text-xs text-gray-400 hidden md:block">
              {paso.descripcion}
            </span>
          </button>
        </React.Fragment>
      );
    })}
  </div>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const ObjetivoFormDialog: React.FC<ObjetivoFormDialogProps> = ({
  objetivo,
  etapas,
  areas,
  onGuardar,
  onCerrar,
  guardando,
}) => {
  const modoEdicion = !!objetivo;
  const [pasoActual, setPasoActual] = useState(1);
  const [errorPaso, setErrorPaso] = useState<string | null>(null);

  // Form setup con React Hook Form + Zod
  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<ObjetivoEducativoFormData>({
    resolver: zodResolver(objetivoEducativoSchema),
    defaultValues: objetivo ? {
      etapa_id: objetivo.etapa_id,
      area_id: objetivo.area_id,
      titulo: objetivo.titulo,
      descripcion: objetivo.descripcion,
      indicadores: objetivo.indicadores.length > 0 ? objetivo.indicadores : [''],
    } : defaultObjetivoValues,
    mode: 'onBlur',
  });

  // Field array para indicadores
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'indicadores' as never,
  });

  // Inicializar indicadores si están vacíos
  useEffect(() => {
    if (fields.length === 0) {
      append('');
    }
  }, [fields.length, append]);

  // Valores actuales
  const etapaSeleccionada = watch('etapa_id');
  const areaSeleccionada = watch('area_id');

  // Obtener info de etapa/área seleccionadas
  const etapaInfo = etapas.find(e => e.id === etapaSeleccionada);
  const areaInfo = areas.find(a => a.id === areaSeleccionada);

  // Navegación entre pasos
  const irAPaso = (paso: number) => {
    if (paso >= 1 && paso <= PASOS.length) {
      setErrorPaso(null);
      setPasoActual(paso);
    }
  };

  const siguientePaso = async () => {
    setErrorPaso(null);
    
    // Validar paso actual
    let camposAValidar: (keyof ObjetivoEducativoFormData)[] = [];
    
    switch (pasoActual) {
      case 1:
        camposAValidar = ['etapa_id', 'area_id'];
        break;
      case 2:
        camposAValidar = ['titulo', 'descripcion'];
        break;
      case 3:
        camposAValidar = ['indicadores'];
        break;
    }
    
    const valido = await trigger(camposAValidar);
    
    if (!valido) {
      setErrorPaso('Por favor corrige los errores antes de continuar');
      return;
    }
    
    if (pasoActual < PASOS.length) {
      setPasoActual(prev => prev + 1);
    }
  };

  const pasoAnterior = () => {
    if (pasoActual > 1) {
      setErrorPaso(null);
      setPasoActual(prev => prev - 1);
    }
  };

  // Guardar
  const onSubmit = async (data: ObjetivoEducativoFormData) => {
    // Filtrar indicadores vacíos
    const datosLimpios = {
      ...data,
      indicadores: data.indicadores.filter(i => i.trim() !== ''),
    };
    
    if (datosLimpios.indicadores.length === 0) {
      setErrorPaso('Debes agregar al menos un indicador de logro');
      return;
    }
    
    await onGuardar(datosLimpios);
  };

  // Handler para guardar en modo edición
  const handleGuardar = async () => {
    // Validar todos los campos requeridos
    const valido = await trigger();
    
    if (!valido) {
      // Navegar al paso con el primer error
      if (errors.etapa_id || errors.area_id) {
        setPasoActual(1);
      } else if (errors.titulo || errors.descripcion) {
        setPasoActual(2);
      } else if (errors.indicadores) {
        setPasoActual(3);
      }
      setErrorPaso('Por favor corrige los errores en el formulario');
      return;
    }
    
    handleSubmit(onSubmit)();
  };

  // Prevenir submit con Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {modoEdicion ? 'Editar Objetivo Educativo' : 'Nuevo Objetivo Educativo'}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-6">
          <Stepper 
            pasoActual={pasoActual} 
            modoEdicion={modoEdicion}
            onIrAPaso={irAPaso}
          />
        </div>

        {/* Contenido del paso */}
        <form 
          onSubmit={(e) => e.preventDefault()}
          className="flex-1 overflow-y-auto px-6 py-4"
        >
          {/* Paso 1: Clasificación */}
          {pasoActual === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  Selecciona la clasificación
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Indica a qué etapa y área de crecimiento pertenece este objetivo
                </p>
              </div>

              {/* Etapa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etapa de Progresión <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {etapas.map(etapa => (
                    <label
                      key={etapa.id}
                      className={`
                        relative flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer
                        transition-all hover:shadow-md
                        ${etapaSeleccionada === etapa.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        {...register('etapa_id')}
                        value={etapa.id}
                        className="sr-only"
                      />
                      <span className="text-2xl">{etapa.icono}</span>
                      <div>
                        <p className="font-medium text-gray-800">{etapa.nombre}</p>
                        <p className="text-xs text-gray-500">Edad típica: {etapa.edad_tipica} años</p>
                      </div>
                      {etapaSeleccionada === etapa.id && (
                        <Check className="absolute top-2 right-2 w-5 h-5 text-blue-500" />
                      )}
                    </label>
                  ))}
                </div>
                {errors.etapa_id && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.etapa_id.message}
                  </p>
                )}
              </div>

              {/* Área */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área de Crecimiento <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {areas.map(area => (
                    <label
                      key={area.id}
                      className={`
                        relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer
                        transition-all hover:shadow-md text-center
                        ${areaSeleccionada === area.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        {...register('area_id')}
                        value={area.id}
                        className="sr-only"
                      />
                      <span className="text-2xl">{area.icono}</span>
                      <p className="font-medium text-gray-800 text-sm">{area.nombre}</p>
                      {areaSeleccionada === area.id && (
                        <Check className="absolute top-2 right-2 w-4 h-4 text-blue-500" />
                      )}
                    </label>
                  ))}
                </div>
                {errors.area_id && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.area_id.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Paso 2: Contenido */}
          {pasoActual === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  Define el contenido del objetivo
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Escribe un título claro y una descripción detallada
                </p>
                
                {/* Preview de clasificación */}
                {etapaInfo && areaInfo && (
                  <div className="flex gap-2 mb-4">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {etapaInfo.icono} {etapaInfo.nombre}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      {areaInfo.icono} {areaInfo.nombre}
                    </span>
                  </div>
                )}
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Objetivo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('titulo')}
                  placeholder="Ej: Participo en actividades que ayudan a mantener mi cuerpo fuerte y sano"
                  className={`
                    w-full px-4 py-3 border rounded-lg transition-colors
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.titulo ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                  `}
                />
                {errors.titulo && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.titulo.message}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('descripcion')}
                  rows={4}
                  placeholder="Describe en detalle qué se espera que el scout logre con este objetivo..."
                  className={`
                    w-full px-4 py-3 border rounded-lg transition-colors resize-none
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.descripcion ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                  `}
                />
                {errors.descripcion && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.descripcion.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Paso 3: Indicadores */}
          {pasoActual === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  Indicadores de logro
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Agrega indicadores observables que permitan evaluar si el objetivo fue alcanzado
                </p>
              </div>

              {/* Lista de indicadores */}
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <div className="flex-1">
                      <Controller
                        name={`indicadores.${index}`}
                        control={control}
                        render={({ field: inputField }) => (
                          <input
                            {...inputField}
                            type="text"
                            placeholder={`Indicador ${index + 1}: Ej: Participa en al menos 3 excursiones por período`}
                            className={`
                              w-full px-4 py-3 border rounded-lg transition-colors
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent
                              ${errors.indicadores?.[index] ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                            `}
                          />
                        )}
                      />
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar indicador"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Botón agregar indicador */}
              {fields.length < 10 && (
                <button
                  type="button"
                  onClick={() => append('')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 
                             font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Agregar otro indicador
                </button>
              )}

              {errors.indicadores && !Array.isArray(errors.indicadores) && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.indicadores.message}
                </p>
              )}
            </div>
          )}

          {/* Error general del paso */}
          {errorPaso && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{errorPaso}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          {/* Botón anterior */}
          {pasoActual > 1 && !modoEdicion ? (
            <button
              type="button"
              onClick={pasoAnterior}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 
                         hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Anterior
            </button>
          ) : (
            <div /> // Espaciador
          )}

          {/* Botones de acción */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>

            {modoEdicion ? (
              // Modo edición: Guardar siempre visible
              <button
                type="button"
                onClick={handleGuardar}
                disabled={guardando}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white 
                           rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50
                           font-medium"
              >
                {guardando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
            ) : pasoActual < PASOS.length ? (
              // Modo creación: Siguiente
              <button
                type="button"
                onClick={siguientePaso}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white 
                           rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              // Modo creación: Crear (último paso)
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={guardando}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white 
                           rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50
                           font-medium"
              >
                {guardando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Crear Objetivo
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObjetivoFormDialog;
