/**
 * Nueva Actividad Dialog - Formulario para crear actividades al aire libre
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Tent,
  MapPin,
  Calendar,
  Clock,
  Users,
  // DollarSign removido - usando S/ directamente
  FileText,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  ActividadesExteriorService, 
  TipoActividadExterior,
  EstadoActividadExterior,
  TIPOS_ACTIVIDAD_EXTERIOR,
  ESTADOS_ACTIVIDAD_EXTERIOR,
} from '@/services/actividadesExteriorService';

// Schema de validación
const actividadSchema = z.object({
  // Paso 1: Info básica
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(255),
  tipo: z.enum(['CAMPAMENTO', 'CAMINATA', 'EXCURSION', 'TALLER_EXTERIOR', 'VISITA', 'SERVICIO_COMUNITARIO']),
  estado: z.enum(['BORRADOR', 'PLANIFICACION', 'ABIERTA_INSCRIPCION', 'INSCRIPCION_CERRADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'POSTERGADA']).optional(),
  descripcion: z.string().optional(),
  
  // Paso 2: Fechas y lugar
  fecha_inicio: z.string().min(1, 'Selecciona fecha de inicio'),
  fecha_fin: z.string().min(1, 'Selecciona fecha de fin'),
  hora_concentracion: z.string().optional(),
  punto_encuentro: z.string().optional(),
  ubicacion: z.string().min(3, 'Ingresa la ubicación'),
  lugar_detalle: z.string().optional(),
  
  // Paso 3: Participantes y costo
  max_participantes: z.number().optional(),
  costo_por_participante: z.number().min(0),
  
  // Paso 4: Información adicional
  equipamiento_obligatorio: z.string().optional(),
  equipamiento_opcional: z.string().optional(),
  recomendaciones: z.string().optional(),
});

type ActividadFormData = z.infer<typeof actividadSchema>;

interface ActividadEditar {
  id: string;
  nombre: string;
  tipo: string;
  estado?: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_concentracion?: string;
  punto_encuentro?: string;
  ubicacion: string;
  lugar_detalle?: string;
  max_participantes?: number;
  costo_por_participante: number;
  equipamiento_obligatorio?: string;
  equipamiento_opcional?: string;
  recomendaciones?: string;
}

interface NuevaActividadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (actividadId: string) => void;
  actividadEditar?: ActividadEditar | null; // Para modo edición
}

const PASOS = [
  { id: 1, title: 'Información', icon: FileText },
  { id: 2, title: 'Lugar y Fecha', icon: MapPin },
  { id: 3, title: 'Participantes', icon: Users },
  { id: 4, title: 'Detalles', icon: Tent },
];

const NuevaActividadDialog: React.FC<NuevaActividadDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  actividadEditar,
}) => {
  const [paso, setPaso] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const modoEdicion = !!actividadEditar;

  const form = useForm<ActividadFormData>({
    resolver: zodResolver(actividadSchema),
    defaultValues: {
      nombre: '',
      tipo: 'CAMPAMENTO',
      descripcion: '',
      fecha_inicio: '',
      fecha_fin: '',
      hora_concentracion: '',
      punto_encuentro: '',
      ubicacion: '',
      lugar_detalle: '',
      max_participantes: undefined,
      costo_por_participante: 0,
      equipamiento_obligatorio: '',
      equipamiento_opcional: '',
      recomendaciones: '',
    },
    mode: 'onBlur',
  });

  // Cargar datos en modo edición
  React.useEffect(() => {
    if (open && actividadEditar) {
      form.reset({
        nombre: actividadEditar.nombre,
        tipo: actividadEditar.tipo as any,
        estado: actividadEditar.estado as any,
        descripcion: actividadEditar.descripcion || '',
        fecha_inicio: actividadEditar.fecha_inicio,
        fecha_fin: actividadEditar.fecha_fin,
        hora_concentracion: actividadEditar.hora_concentracion || '',
        punto_encuentro: actividadEditar.punto_encuentro || '',
        ubicacion: actividadEditar.ubicacion,
        lugar_detalle: actividadEditar.lugar_detalle || '',
        max_participantes: actividadEditar.max_participantes,
        costo_por_participante: actividadEditar.costo_por_participante || 0,
        equipamiento_obligatorio: actividadEditar.equipamiento_obligatorio || '',
        equipamiento_opcional: actividadEditar.equipamiento_opcional || '',
        recomendaciones: actividadEditar.recomendaciones || '',
      });
    } else if (open && !actividadEditar) {
      form.reset({
        nombre: '',
        tipo: 'CAMPAMENTO',
        estado: undefined,
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        hora_concentracion: '',
        punto_encuentro: '',
        ubicacion: '',
        lugar_detalle: '',
        max_participantes: undefined,
        costo_por_participante: 0,
        equipamiento_obligatorio: '',
        equipamiento_opcional: '',
        recomendaciones: '',
      });
    }
  }, [open, actividadEditar, form]);

  const validarPasoActual = async (): Promise<boolean> => {
    let camposValidar: (keyof ActividadFormData)[] = [];
    
    switch (paso) {
      case 1:
        camposValidar = ['nombre', 'tipo'];
        break;
      case 2:
        camposValidar = ['fecha_inicio', 'fecha_fin', 'ubicacion'];
        break;
      case 3:
        camposValidar = ['costo_por_participante'];
        break;
      case 4:
        // No hay campos obligatorios en el último paso
        return true;
    }
    
    const result = await form.trigger(camposValidar);
    return result;
  };

  const siguientePaso = async () => {
    const valido = await validarPasoActual();
    if (valido && paso < 4) {
      // Usar setTimeout para evitar que el cambio de paso dispare un re-render que cause submit
      setTimeout(() => setPaso(paso + 1), 0);
    }
  };

  const pasoAnterior = () => {
    if (paso > 1) {
      setPaso(paso - 1);
    }
  };

  // Navegación directa a un paso específico (solo en modo edición)
  const irAPaso = (numeroPaso: number) => {
    if (modoEdicion && numeroPaso >= 1 && numeroPaso <= 4) {
      setPaso(numeroPaso);
    }
  };

  // Función de submit manual - solo se llama explícitamente desde el botón
  const guardarActividad = async () => {
    // En modo edición, validar solo los campos dirty o campos requeridos mínimos
    const camposRequeridos: (keyof ActividadFormData)[] = ['nombre', 'tipo', 'fecha_inicio', 'fecha_fin', 'ubicacion'];
    const isValid = await form.trigger(camposRequeridos);
    if (!isValid) {
      // Si hay error, ir al paso que tiene el primer error
      const errors = form.formState.errors;
      if (errors.nombre || errors.tipo) {
        setPaso(1);
      } else if (errors.fecha_inicio || errors.fecha_fin || errors.ubicacion) {
        setPaso(2);
      } else if (errors.costo_por_participante) {
        setPaso(3);
      }
      return;
    }
    
    const data = form.getValues();
    
    try {
      setGuardando(true);
      
      const actividadData = {
        nombre: data.nombre,
        tipo: data.tipo as TipoActividadExterior,
        estado: data.estado as EstadoActividadExterior,
        descripcion: data.descripcion,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        hora_concentracion: data.hora_concentracion,
        punto_encuentro: data.punto_encuentro,
        ubicacion: data.ubicacion,
        lugar_detalle: data.lugar_detalle,
        max_participantes: data.max_participantes,
        costo_por_participante: data.costo_por_participante,
        equipamiento_obligatorio: data.equipamiento_obligatorio,
        equipamiento_opcional: data.equipamiento_opcional,
        recomendaciones: data.recomendaciones,
      };

      if (modoEdicion && actividadEditar) {
        // Modo edición: actualizar
        await ActividadesExteriorService.actualizarActividad(actividadEditar.id, actividadData);
        form.reset();
        setPaso(1);
        onOpenChange(false);
        onSuccess(actividadEditar.id);
      } else {
        // Modo creación
        const result = await ActividadesExteriorService.crearActividad(actividadData);
        form.reset();
        setPaso(1);
        onOpenChange(false);
        onSuccess(result.actividad_id);
      }
    } catch (error) {
      console.error(modoEdicion ? 'Error actualizando actividad:' : 'Error creando actividad:', error);
    } finally {
      setGuardando(false);
    }
  };

  // onSubmit del form - no hacer nada, solo prevenir submit automático
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleClose = () => {
    form.reset();
    setPaso(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tent className="h-5 w-5" />
            {modoEdicion ? 'Editar Actividad' : 'Nueva Actividad al Aire Libre'}
          </DialogTitle>
          <DialogDescription>
            {modoEdicion 
              ? 'Modifica los datos de la actividad' 
              : 'Crea un campamento, caminata, excursión u otra actividad al aire libre'}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper - clickeable en modo edición */}
        <div className="flex items-center justify-between mb-6 py-4">
          {PASOS.map((p, index) => {
            const Icon = p.icon;
            const isActive = paso === p.id;
            const isCompleted = paso > p.id;
            const isClickable = modoEdicion; // En modo edición, todos los pasos son clickeables
            
            return (
              <React.Fragment key={p.id}>
                <div 
                  className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : ''}`}
                  onClick={() => isClickable && irAPaso(p.id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-gray-300 text-gray-400'
                  } ${isClickable ? 'hover:scale-105 hover:shadow-md transition-transform' : ''}`}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                    {p.title}
                  </span>
                </div>
                {index < PASOS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    paso > p.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <Form {...form}>
          <form 
            onSubmit={onSubmit} 
            className="space-y-6"
            onKeyDown={(e) => {
              // Prevenir submit con Enter siempre
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          >
            {/* Paso 1: Información básica */}
            {paso === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Actividad *</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {TIPOS_ACTIVIDAD_EXTERIOR.map(tipo => (
                          <button
                            key={tipo.value}
                            type="button"
                            onClick={() => field.onChange(tipo.value)}
                            className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors ${
                              field.value === tipo.value 
                                ? 'border-primary bg-primary/5' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className="text-2xl">{tipo.emoji}</span>
                            <span className="text-xs font-medium">{tipo.label}</span>
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Actividad *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Campamento de Verano 2026"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Selector de estado - solo visible en modo edición */}
                {modoEdicion && (
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado de la Actividad</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ESTADOS_ACTIVIDAD_EXTERIOR.map(estado => (
                              <SelectItem key={estado.value} value={estado.value}>
                                <span className={`inline-flex items-center gap-2`}>
                                  <span className={`w-2 h-2 rounded-full bg-${estado.color}-500`}></span>
                                  {estado.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe brevemente la actividad..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Paso 2: Lugar y Fecha */}
            {paso === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fecha_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="date"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fecha_fin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Fin *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="date"
                              className="pl-10"
                              min={form.watch('fecha_inicio')}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hora_concentracion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Concentración</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="time"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="punto_encuentro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Punto de Encuentro</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: Local del grupo"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ubicacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación / Destino *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Ej: Cieneguilla, Lima"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lugar_detalle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detalle del Lugar</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Campamento Las Lomas, Km 35"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Paso 3: Participantes y Costo */}
            {paso === 3 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="max_participantes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cupo Máximo de Participantes</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number"
                            placeholder="Sin límite"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ''}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costo_por_participante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo por Participante (S/) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground font-medium">S/</span>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Sugerencias de precios anteriores</h4>
                  <div className="flex gap-2 flex-wrap">
                    {[50, 80, 100, 150, 200].map(precio => (
                      <Button
                        key={precio}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => form.setValue('costo_por_participante', precio)}
                      >
                        S/ {precio}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Paso 4: Información adicional */}
            {paso === 4 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="equipamiento_obligatorio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipamiento Obligatorio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ej: Mochila de campamento, sleeping bag, carpa personal..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="equipamiento_opcional"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipamiento Opcional</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ej: Linterna extra, cámara fotográfica..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recomendaciones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recomendaciones para Participantes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Información importante, restricciones, consejos para padres..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter className="flex justify-between">
              <div>
                {paso > 1 && !modoEdicion && (
                  <Button type="button" variant="outline" onClick={pasoAnterior}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={handleClose}>
                  Cancelar
                </Button>
                {modoEdicion ? (
                  // En modo edición: Guardar Cambios siempre visible
                  <Button type="button" onClick={guardarActividad} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                ) : (
                  // En modo creación: navegación secuencial
                  paso < 4 ? (
                    <Button type="button" onClick={siguientePaso}>
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button type="button" onClick={guardarActividad} disabled={guardando}>
                      {guardando ? 'Creando...' : 'Crear Actividad'}
                    </Button>
                  )
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NuevaActividadDialog;
