/**
 * Programa Dialog - Formulario Multi-pasos para crear/editar programa
 * Incluye bloques de actividades con validación onBlur
 * Soporta modo creación y edición
 */

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Calendar,
  Clock,
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Pencil
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ActividadesExteriorService, ProgramaActividad, TipoProgramaExterior } from '@/services/actividadesExteriorService';
import { toast } from 'sonner';

// Schema de validación para bloque (incluye id opcional para edición)
const bloqueSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional(),
  tipo_bloque: z.string().optional(),
  hora_inicio: z.string().min(1, 'Requerido'),
  hora_fin: z.string().min(1, 'Requerido'),
  materiales_necesarios: z.string().optional(),
  otorga_puntaje: z.boolean(),
  puntaje_maximo: z.number().min(0),
});

const programaSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  descripcion: z.string().optional(),
  tipo: z.enum(['DIURNO', 'NOCTURNO']),
  fecha: z.string().min(1, 'Selecciona una fecha'),
  hora_inicio: z.string().min(1, 'La hora de inicio es obligatoria'),
  hora_fin: z.string().optional(),
  bloques: z.array(bloqueSchema),
});

type BloqueFormData = z.infer<typeof bloqueSchema>;
type ProgramaFormData = z.infer<typeof programaSchema>;

interface NuevoProgramaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actividadId: string;
  fechaInicio: string;
  fechaFin: string;
  onSuccess: () => void;
  // Props opcionales para modo edición
  programaEditar?: ProgramaActividad | null;
}

const TIPOS_BLOQUE = [
  { value: 'FORMACION', label: 'Formación', emoji: '📚' },
  { value: 'JUEGO', label: 'Juego', emoji: '🎮' },
  { value: 'ACTIVIDAD', label: 'Actividad', emoji: '🏃' },
  { value: 'COMIDA', label: 'Comida', emoji: '🍽️' },
  { value: 'DESCANSO', label: 'Descanso', emoji: '😴' },
  { value: 'CEREMONIA', label: 'Ceremonia', emoji: '🔥' },
  { value: 'LIBRE', label: 'Tiempo Libre', emoji: '🌟' },
];

// Mapeo de tipos de la BD a los del formulario
const mapTipoFromDB = (tipo: string): 'DIURNO' | 'NOCTURNO' => {
  if (tipo === 'DIA' || tipo === 'DIURNO') return 'DIURNO';
  if (tipo === 'NOCHE' || tipo === 'NOCTURNO') return 'NOCTURNO';
  return 'DIURNO'; // Default
};

const NuevoProgramaDialog: React.FC<NuevoProgramaDialogProps> = ({
  open,
  onOpenChange,
  actividadId,
  fechaInicio,
  fechaFin,
  onSuccess,
  programaEditar,
}) => {
  const [paso, setPaso] = useState(1);
  const [guardando, setGuardando] = useState(false);
  
  const esEdicion = !!programaEditar;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors }
  } = useForm<ProgramaFormData>({
    resolver: zodResolver(programaSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      tipo: 'DIURNO',
      fecha: '',
      hora_inicio: '06:00',
      hora_fin: '22:00',
      bloques: [],
    },
    mode: 'onBlur',
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'bloques',
  });

  const tipoPrograma = watch('tipo');
  const bloquesWatch = watch('bloques');

  // Cargar datos cuando es modo edición
  useEffect(() => {
    if (open && programaEditar) {
      console.log('Cargando programa para edición:', programaEditar);
      
      // Mapear tipo del programa
      const tipoMapeado = mapTipoFromDB(programaEditar.tipo);
      
      // Cargar datos del programa
      setValue('nombre', programaEditar.nombre || '');
      setValue('descripcion', programaEditar.descripcion || '');
      setValue('tipo', tipoMapeado);
      setValue('fecha', programaEditar.fecha || '');
      setValue('hora_inicio', programaEditar.hora_inicio || '06:00');
      setValue('hora_fin', programaEditar.hora_fin || '22:00');
      
      // Cargar bloques existentes
      if (programaEditar.bloques && programaEditar.bloques.length > 0) {
        const bloquesFormateados: BloqueFormData[] = programaEditar.bloques.map(b => ({
          id: b.id || undefined,
          nombre: b.nombre || '',
          descripcion: b.descripcion || '',
          tipo_bloque: b.tipo_bloque || 'ACTIVIDAD',
          hora_inicio: b.hora_inicio || '08:00',
          hora_fin: b.hora_fin || '09:00',
          materiales_necesarios: b.materiales_necesarios || '',
          otorga_puntaje: b.otorga_puntaje || false,
          puntaje_maximo: b.puntaje_maximo || 0,
        }));
        replace(bloquesFormateados);
        console.log('Bloques cargados:', bloquesFormateados);
      }
    } else if (open && !programaEditar) {
      // Resetear para nuevo programa
      reset({
        nombre: '',
        descripcion: '',
        tipo: 'DIURNO',
        fecha: '',
        hora_inicio: '06:00',
        hora_fin: '22:00',
        bloques: [],
      });
    }
  }, [open, programaEditar, setValue, replace, reset]);

  const agregarBloque = () => {
    const ultimoBloque = fields[fields.length - 1];
    const defaultBloque: BloqueFormData = {
      nombre: '',
      descripcion: '',
      tipo_bloque: 'ACTIVIDAD',
      hora_inicio: ultimoBloque ? (bloquesWatch[fields.length - 1]?.hora_fin || '08:00') : '08:00',
      hora_fin: '',
      materiales_necesarios: '',
      otorga_puntaje: false,
      puntaje_maximo: 0,
    };
    append(defaultBloque);
  };

  const siguientePaso = async () => {
    if (paso === 1) {
      const valid = await trigger(['nombre', 'tipo', 'fecha', 'hora_inicio']);
      if (valid) {
        setPaso(2);
      }
    }
  };

  const pasoAnterior = () => {
    if (paso > 1) setPaso(paso - 1);
  };

  const onSubmit = async (data: ProgramaFormData) => {
    try {
      setGuardando(true);
      
      if (esEdicion && programaEditar) {
        // MODO EDICIÓN: Actualizar programa existente con bloques
        await ActividadesExteriorService.actualizarProgramaCompleto(programaEditar.id, {
          nombre: data.nombre,
          descripcion: data.descripcion,
          tipo: data.tipo as TipoProgramaExterior,
          fecha: data.fecha,
          hora_inicio: data.hora_inicio,
          hora_fin: data.hora_fin,
          bloques: data.bloques.map((b, index) => ({
            id: b.id, // Si tiene id, se actualiza; si no, se crea
            nombre: b.nombre,
            descripcion: b.descripcion,
            tipo_bloque: b.tipo_bloque,
            hora_inicio: b.hora_inicio,
            hora_fin: b.hora_fin,
            materiales_necesarios: b.materiales_necesarios,
            orden: index + 1,
            otorga_puntaje: b.otorga_puntaje,
            puntaje_maximo: b.puntaje_maximo,
          })),
        });
        toast.success('Programa actualizado exitosamente');
      } else {
        // MODO CREACIÓN: Crear nuevo programa
        await ActividadesExteriorService.agregarPrograma(actividadId, {
          nombre: data.nombre,
          descripcion: data.descripcion,
          tipo: data.tipo as TipoProgramaExterior,
          fecha: data.fecha,
          hora_inicio: data.hora_inicio,
          hora_fin: data.hora_fin,
          bloques: data.bloques.map((b, index) => ({
            nombre: b.nombre,
            descripcion: b.descripcion,
            tipo_bloque: b.tipo_bloque,
            hora_inicio: b.hora_inicio,
            hora_fin: b.hora_fin,
            materiales_necesarios: b.materiales_necesarios,
            orden: index + 1,
            otorga_puntaje: b.otorga_puntaje,
            puntaje_maximo: b.puntaje_maximo,
          })),
        });
        toast.success('Programa agregado exitosamente');
      }

      reset();
      setPaso(1);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error guardando programa:', error);
      toast.error(esEdicion ? 'Error al actualizar el programa' : 'Error al crear el programa');
    } finally {
      setGuardando(false);
    }
  };

  const handleClose = () => {
    reset();
    setPaso(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {esEdicion ? (
              <>
                <Pencil className="h-5 w-5" />
                Editar Programa
              </>
            ) : (
              <>
                <Calendar className="h-5 w-5" />
                Agregar Programa
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Paso {paso} de 2: {paso === 1 ? 'Información del programa' : 'Bloques de actividades'}
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex-1 h-2 rounded ${paso >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex-1 h-2 rounded ${paso >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Paso 1: Información básica */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Programa *</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={tipoPrograma === 'DIURNO' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => {
                        setValue('tipo', 'DIURNO');
                        // Solo cambiar horas si es nuevo programa
                        if (!esEdicion) {
                          setValue('hora_inicio', '06:00');
                          setValue('hora_fin', '22:00');
                        }
                      }}
                    >
                      ☀️ Diurno
                    </Button>
                    <Button
                      type="button"
                      variant={tipoPrograma === 'NOCTURNO' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => {
                        setValue('tipo', 'NOCTURNO');
                        // Solo cambiar horas si es nuevo programa
                        if (!esEdicion) {
                          setValue('hora_inicio', '19:00');
                          setValue('hora_fin', '23:59');
                        }
                      }}
                    >
                      🌙 Nocturno
                    </Button>
                  </div>
                  {errors.tipo && <p className="text-sm text-red-500">{errors.tipo.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input 
                    id="fecha"
                    type="date"
                    min={fechaInicio}
                    max={fechaFin}
                    {...register('fecha')}
                  />
                  {errors.fecha && <p className="text-sm text-red-500">{errors.fecha.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre / Tema del Día *</Label>
                <Input 
                  id="nombre"
                  placeholder="Ej: Día de la Aventura, Noche de Fogata..."
                  {...register('nombre')}
                />
                {errors.nombre && <p className="text-sm text-red-500">{errors.nombre.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea 
                  id="descripcion"
                  placeholder="Objetivos y descripción general del programa..."
                  className="resize-none"
                  rows={3}
                  {...register('descripcion')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hora_inicio">Hora de Inicio *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="hora_inicio"
                      type="time" 
                      className="pl-10" 
                      {...register('hora_inicio')} 
                    />
                  </div>
                  {errors.hora_inicio && <p className="text-sm text-red-500">{errors.hora_inicio.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora_fin">Hora de Fin</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="hora_fin"
                      type="time" 
                      className="pl-10" 
                      {...register('hora_fin')} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Bloques de actividades */}
          {paso === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Bloques de Actividades</h3>
                  <p className="text-sm text-muted-foreground">
                    Agrega las actividades hora por hora
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={agregarBloque}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Bloque
                </Button>
              </div>

              {fields.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No hay bloques de actividades. Puedes agregarlos ahora o después.
                    </p>
                    <Button type="button" variant="outline" onClick={agregarBloque}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Primer Bloque
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="relative">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                          
                          <div className="flex-1 space-y-3">
                            {/* Mostrar ID si existe (para debug en edición) */}
                            {bloquesWatch[index]?.id && (
                              <Badge variant="outline" className="text-xs">
                                ID: {bloquesWatch[index].id?.slice(0, 8)}...
                              </Badge>
                            )}
                            
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Desde</Label>
                                <Input 
                                  type="time" 
                                  {...register(`bloques.${index}.hora_inicio`)} 
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Hasta</Label>
                                <Input 
                                  type="time" 
                                  {...register(`bloques.${index}.hora_fin`)} 
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Tipo</Label>
                                <Select 
                                  value={bloquesWatch[index]?.tipo_bloque || 'ACTIVIDAD'} 
                                  onValueChange={(v) => setValue(`bloques.${index}.tipo_bloque`, v)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TIPOS_BLOQUE.map(t => (
                                      <SelectItem key={t.value} value={t.value}>
                                        {t.emoji} {t.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Input 
                                placeholder="Nombre de la actividad..."
                                {...register(`bloques.${index}.nombre`)}
                              />
                              {errors.bloques?.[index]?.nombre && (
                                <p className="text-xs text-red-500">
                                  {errors.bloques[index]?.nombre?.message}
                                </p>
                              )}
                            </div>

                            <Textarea 
                              placeholder="Descripción (opcional)..."
                              className="resize-none"
                              rows={2}
                              {...register(`bloques.${index}.descripcion`)}
                            />

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`otorga-${index}`}
                                    checked={bloquesWatch[index]?.otorga_puntaje || false}
                                    onCheckedChange={(checked) => 
                                      setValue(`bloques.${index}.otorga_puntaje`, !!checked)
                                    }
                                  />
                                  <Label 
                                    htmlFor={`otorga-${index}`}
                                    className="flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                    Otorga puntaje
                                  </Label>
                                </div>
                                
                                {bloquesWatch[index]?.otorga_puntaje && (
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm">Máx:</Label>
                                    <Input 
                                      type="number"
                                      className="w-20"
                                      {...register(`bloques.${index}.puntaje_maximo`, {
                                        valueAsNumber: true
                                      })}
                                    />
                                    <span className="text-sm text-muted-foreground">pts</span>
                                  </div>
                                )}
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {fields.length > 0 && (
                <Badge variant="outline" className="w-full justify-center py-2">
                  {fields.length} bloque(s) • 
                  {bloquesWatch.filter(b => b?.otorga_puntaje).length} con puntaje
                </Badge>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div>
              {paso > 1 && (
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
              {paso < 2 ? (
                <Button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    siguientePaso();
                  }}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={guardando}>
                  {guardando 
                    ? 'Guardando...' 
                    : esEdicion 
                      ? 'Actualizar Programa' 
                      : 'Guardar Programa'
                  }
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NuevoProgramaDialog;
