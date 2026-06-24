/**
 * Programa Dialog - Formulario Multi-pasos para crear/editar programa
 * Incluye bloques de actividades con validación onBlur
 * Soporta modo creación y edición
 *
 * Los campos de cada bloque son los mismos que "Actividad" en el módulo
 * de Programación (nombre, descripción, hora_inicio + duración,
 * responsable, materiales, observaciones, Objetivos Educativos), para
 * que ambos formularios se mantengan en paridad.
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
  Pencil,
  Users
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
import {
  ActividadesExteriorService,
  ProgramaActividad,
  TipoProgramaExterior,
  DirigentDisponible,
} from '@/services/actividadesExteriorService';
import { toast } from 'sonner';
import { usePasteRows } from '@/hooks/usePasteRows';
import { bloqueProgramaSheet } from '@/lib/import/configs/bloqueProgramaAireLibreSheet';
import { recalcularHorarioSecuencial } from '@/utils/horarioSecuencial';
import SelectorObjetivosEducativos from '@/components/shared/SelectorObjetivosEducativos';
import ProgresionService from '@/services/progresionService';
import { resolverMultiplesContraCatalogo, resolverUnoContraCatalogo } from '@/utils/matchTextoCatalogo';

// Schema de validación para bloque (mismos campos que Actividad de Programación)
const bloqueSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional(),
  hora_inicio: z.string().min(1, 'Requerido'),
  duracion_minutos: z.number().min(1, 'Debe ser mayor a 0'),
  responsable_id: z.string().optional(),
  materiales_necesarios: z.string().optional(),
  observaciones: z.string().optional(),
  objetivo_ids: z.array(z.string()).optional().default([]),
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

// Mapeo de tipos de la BD a los del formulario
const mapTipoFromDB = (tipo: string): 'DIURNO' | 'NOCTURNO' => {
  if (tipo === 'DIA' || tipo === 'DIURNO') return 'DIURNO';
  if (tipo === 'NOCHE' || tipo === 'NOCTURNO') return 'NOCTURNO';
  return 'DIURNO'; // Default
};

const bloqueVacio = (horaInicio: string): BloqueFormData => ({
  nombre: '',
  descripcion: '',
  hora_inicio: horaInicio,
  duracion_minutos: 30,
  responsable_id: '',
  materiales_necesarios: '',
  observaciones: '',
  objetivo_ids: [],
});

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
  const [dirigentes, setDirigentes] = useState<DirigentDisponible[]>([]);

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

  const { fields, replace, update } = useFieldArray({
    control,
    name: 'bloques',
  });

  const tipoPrograma = watch('tipo');
  const bloquesWatch = watch('bloques');

  // Dirigentes disponibles para asignar como responsable de un bloque
  useEffect(() => {
    if (!open) return;
    ActividadesExteriorService.listarDirigentesDisponibles(actividadId)
      .then(setDirigentes)
      .catch((err) => console.error('Error cargando dirigentes:', err));
  }, [open, actividadId]);

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
          hora_inicio: b.hora_inicio || '08:00',
          duracion_minutos: b.duracion_minutos || 30,
          responsable_id: b.responsable_id || '',
          materiales_necesarios: b.materiales_necesarios || '',
          observaciones: b.observaciones || '',
          objetivo_ids: b.objetivo_ids || [],
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

  // Recalcula hora_inicio en cadena: el primer bloque ancla la secuencia
  // (su propia hora si la tiene, si no la hora de inicio del programa);
  // los siguientes se calculan a partir de la duración del anterior.
  const recalcularBloques = (bloques: BloqueFormData[]): BloqueFormData[] => {
    const ancla = bloques[0]?.hora_inicio || watch('hora_inicio') || '08:00';
    return recalcularHorarioSecuencial(bloques, ancla);
  };

  const agregarBloque = () => {
    replace(recalcularBloques([...bloquesWatch, bloqueVacio('08:00')]));
  };

  const removerBloque = (index: number) => {
    replace(recalcularBloques(bloquesWatch.filter((_, i) => i !== index)));
  };

  // IMPORTANTE: usa update() fila por fila, nunca replace() aquí. replace()
  // reemplaza el arreglo completo y React desmonta/remonta TODAS las
  // tarjetas (incluido el <SelectorObjetivosEducativos> de cada una, que
  // vuelve a pedir su catálogo al montarse) en cada tecla que se escribe en
  // un input — con varios bloques eso dispara decenas de llamadas a la vez
  // y cuelga la página. update() solo toca la fila indicada.
  const actualizarBloqueLocal = (index: number, cambios: Partial<BloqueFormData>) => {
    const actualizados = bloquesWatch.map((b, i) => (i === index ? { ...b, ...cambios } : b));
    const requiereRecalculo = 'hora_inicio' in cambios || 'duracion_minutos' in cambios;
    const finales = requiereRecalculo ? recalcularBloques(actualizados) : actualizados;
    finales.forEach((bloque, i) => {
      if (JSON.stringify(bloque) !== JSON.stringify(bloquesWatch[i])) {
        update(i, bloque);
      }
    });
  };

  type BloquePegado = {
    nombre: string;
    descripcion: string;
    hora_inicio: string;
    duracion_minutos?: number;
    responsable_nombre: string;
    materiales_necesarios: string;
    observaciones: string;
    objetivos_texto: string;
  };

  // "responsable_nombre" y "objetivos_texto" llegan como texto libre del
  // Excel del usuario; se resuelven contra los catálogos (dirigentes ya
  // cargados, objetivos educativos) antes de crear los bloques.
  const aplicarBloquesPegados = async (bloquesPegados: BloquePegado[]) => {
    const necesitaObjetivos = bloquesPegados.some((b) => b.objetivos_texto);
    const objetivos = necesitaObjetivos ? await ProgresionService.obtenerObjetivos().catch(() => []) : [];

    const nuevos = bloquesPegados.map((b) => ({
      ...bloqueVacio(b.hora_inicio || '08:00'),
      nombre: b.nombre,
      descripcion: b.descripcion,
      duracion_minutos: b.duracion_minutos || 30,
      materiales_necesarios: b.materiales_necesarios,
      observaciones: b.observaciones,
      objetivo_ids: resolverMultiplesContraCatalogo(b.objetivos_texto, objetivos, (o) => o.titulo),
      responsable_id: resolverUnoContraCatalogo(b.responsable_nombre, dirigentes, (d) => d.nombre) || '',
    }));

    const soloUnoVacio = fields.length === 1 && !bloquesWatch[0]?.nombre;
    const base = soloUnoVacio ? [] : bloquesWatch;
    replace(recalcularBloques([...base, ...nuevos]));
  };

  // Pegar bloques copiados desde Excel (ver hook usePasteRows)
  const { handlePaste: handlePasteBloques } = usePasteRows<BloquePegado>(
    bloqueProgramaSheet,
    (bloquesPegados) => {
      aplicarBloquesPegados(bloquesPegados);
    },
  );

  const onPasteBloques = (event: React.ClipboardEvent) => {
    const resultado = handlePasteBloques(event);
    if (!resultado) return;
    if (resultado.rowsAdded > 0) {
      toast.success(`${resultado.rowsAdded} bloque(s) agregado(s) desde Excel`);
    }
    if (resultado.errorMessages.length > 0) {
      toast.error(`${resultado.errorMessages.length} fila(s) no se pudieron agregar`, {
        description: resultado.errorMessages.slice(0, 3).join(' · '),
      });
    }
  };

  // Zona de pegado dedicada: garantiza un campo enfocable para Ctrl+V aunque
  // todavía no haya bloques creados (el estado vacío no tiene ningún input).
  const [zonaPegado, setZonaPegado] = useState('');
  const onPasteZonaPegado = (event: React.ClipboardEvent) => {
    onPasteBloques(event);
    setTimeout(() => setZonaPegado(''), 0);
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
            hora_inicio: b.hora_inicio,
            duracion_minutos: b.duracion_minutos,
            responsable_id: b.responsable_id || undefined,
            materiales_necesarios: b.materiales_necesarios,
            observaciones: b.observaciones,
            orden: index + 1,
            objetivo_ids: b.objetivo_ids,
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
            hora_inicio: b.hora_inicio,
            duracion_minutos: b.duracion_minutos,
            responsable_id: b.responsable_id || undefined,
            materiales_necesarios: b.materiales_necesarios,
            observaciones: b.observaciones,
            orden: index + 1,
            objetivo_ids: b.objetivo_ids,
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

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          onKeyDown={(e) => {
            // Evita que Enter (p. ej. al confirmar la hora en un input
            // type="time") envíe el formulario y cierre el diálogo.
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
        >
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
            <div className="space-y-4" onPaste={onPasteBloques}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Bloques de Actividades</h3>
                  <p className="text-sm text-muted-foreground">
                    Mismos campos que "Agregar Actividad" en Programación.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={agregarBloque}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Bloque
                </Button>
              </div>

              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  Pegar desde Excel
                </Label>
                <Textarea
                  value={zonaPegado}
                  onChange={(e) => setZonaPegado(e.target.value)}
                  onPaste={onPasteZonaPegado}
                  placeholder='Pega aquí filas copiadas desde Excel (con o sin fila de encabezados: actividad/nombre, hora, duracion, responsable, desarrollo/descripcion, materiales, áreas de desarrollo, objetivos educativos). Se crea un bloque por cada fila.'
                  className="resize-none text-xs"
                  rows={2}
                />
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

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Hora de Inicio</Label>
                                <Input
                                  type="time"
                                  disabled={index > 0}
                                  value={bloquesWatch[index]?.hora_inicio || ''}
                                  onChange={(e) => actualizarBloqueLocal(index, { hora_inicio: e.target.value })}
                                />
                                {index > 0 && (
                                  <p className="text-[11px] text-gray-500">Se calcula según el bloque anterior.</p>
                                )}
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Duración (minutos)</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={bloquesWatch[index]?.duracion_minutos ?? ''}
                                  onChange={(e) => actualizarBloqueLocal(index, {
                                    duracion_minutos: e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                                  })}
                                />
                                {errors.bloques?.[index]?.duracion_minutos && (
                                  <p className="text-xs text-red-500">
                                    {errors.bloques[index]?.duracion_minutos?.message}
                                  </p>
                                )}
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

                            <div className="space-y-1">
                              <Label className="text-xs flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" /> Responsable
                              </Label>
                              <Select
                                value={bloquesWatch[index]?.responsable_id || ''}
                                onValueChange={(v) => setValue(`bloques.${index}.responsable_id`, v)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un dirigente" />
                                </SelectTrigger>
                                <SelectContent>
                                  {dirigentes.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                      {d.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Materiales</Label>
                              <Input
                                placeholder="Lista de materiales"
                                {...register(`bloques.${index}.materiales_necesarios`)}
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Observaciones</Label>
                              <Textarea
                                placeholder="Información adicional del bloque..."
                                className="resize-none"
                                rows={2}
                                {...register(`bloques.${index}.observaciones`)}
                              />
                            </div>

                            <SelectorObjetivosEducativos
                              objetivoIds={bloquesWatch[index]?.objetivo_ids || []}
                              onChange={(ids) => setValue(`bloques.${index}.objetivo_ids`, ids)}
                            />

                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removerBloque(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar Bloque
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
                  {fields.length} bloque(s)
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
