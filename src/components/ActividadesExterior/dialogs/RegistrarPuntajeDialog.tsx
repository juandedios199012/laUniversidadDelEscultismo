/**
 * Registrar Puntaje Dialog - Formulario multi-pasos para asignar puntajes
 * 
 * Buenas prácticas implementadas:
 * - Multi-step form (Stepper): Una cosa a la vez
 * - React Hook Form + Zod: Validación robusta
 * - Shadcn/ui (Radix UI): Componentes accesibles
 * - Validación onBlur: Feedback inmediato
 * - Estado vacío significativo con CTA
 * - Máximo 2 columnas (lectura en F)
 * - DRY, SOLID, Clean Code
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Trophy,
  Flag,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Target,
  Award,
  Loader2
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  ActividadesExteriorService,
  BloqueProgramaActividad,
} from '@/services/actividadesExteriorService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============= TIPOS =============
interface Patrulla {
  id: string;
  nombre: string;
  color_patrulla?: string;
}

interface BloqueConPuntaje extends BloqueProgramaActividad {
  programa_nombre?: string;
}

interface RegistrarPuntajeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actividadId: string;
  bloques: BloqueConPuntaje[];
  onSuccess: () => void;
}

// ============= SCHEMA DE VALIDACIÓN =============
const puntajeSchema = z.object({
  bloque_id: z.string().min(1, 'Debes seleccionar una actividad'),
  patrulla_id: z.string().min(1, 'Debes seleccionar una patrulla'),
  puntaje: z.number()
    .min(0, 'El puntaje no puede ser negativo')
    .max(1000, 'El puntaje máximo es 1000'),
  observaciones: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

type PuntajeFormData = z.infer<typeof puntajeSchema>;

// ============= COMPONENTES AUXILIARES =============

// Estado vacío cuando no hay bloques con puntaje
const EstadoVacioBloques: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="text-center py-8 px-4">
    <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
      <Target className="h-8 w-8 text-yellow-600" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No hay actividades puntuables
    </h3>
    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
      Para registrar puntajes, primero agrega bloques de actividades 
      en el Programa con la opción "Otorga puntaje" habilitada.
    </p>
    <div className="flex justify-center gap-3">
      <Button variant="outline" onClick={onClose}>
        Cerrar
      </Button>
    </div>
  </div>
);

// Card de selección de bloque
const BloqueCard: React.FC<{
  bloque: BloqueConPuntaje;
  selected: boolean;
  onSelect: () => void;
}> = ({ bloque, selected, onSelect }) => (
  <Card 
    className={cn(
      "cursor-pointer transition-all hover:shadow-md",
      selected 
        ? "ring-2 ring-primary border-primary bg-primary/5" 
        : "hover:border-primary/50"
    )}
    onClick={onSelect}
  >
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          selected ? "bg-primary text-white" : "bg-muted"
        )}>
          <Target className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{bloque.nombre}</h4>
          {bloque.programa_nombre && (
            <p className="text-xs text-muted-foreground truncate">
              {bloque.programa_nombre}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              <Award className="h-3 w-3 mr-1" />
              Máx: {bloque.puntaje_maximo || 100} pts
            </Badge>
            {bloque.hora_inicio && (
              <span className="text-xs text-muted-foreground">
                {bloque.hora_inicio}
              </span>
            )}
          </div>
        </div>
        {selected && (
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
        )}
      </div>
    </CardContent>
  </Card>
);

// Card de selección de patrulla
const PatrullaCard: React.FC<{
  patrulla: Patrulla;
  selected: boolean;
  onSelect: () => void;
}> = ({ patrulla, selected, onSelect }) => (
  <Card 
    className={cn(
      "cursor-pointer transition-all hover:shadow-md",
      selected 
        ? "ring-2 ring-primary border-primary bg-primary/5" 
        : "hover:border-primary/50"
    )}
    onClick={onSelect}
  >
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: patrulla.color_patrulla || '#6B7280' }}
        >
          <Flag className="h-5 w-5 text-white" />
        </div>
        <span className="font-medium flex-1">{patrulla.nombre}</span>
        {selected && (
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
        )}
      </div>
    </CardContent>
  </Card>
);

// Indicador de pasos
const StepIndicator: React.FC<{ 
  currentStep: number; 
  totalSteps: number;
  steps: string[];
}> = ({ currentStep, totalSteps, steps }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between mb-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
            index + 1 === currentStep 
              ? "bg-primary text-primary-foreground" 
              : index + 1 < currentStep 
                ? "bg-green-500 text-white"
                : "bg-muted text-muted-foreground"
          )}>
            {index + 1 < currentStep ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < totalSteps - 1 && (
            <div className={cn(
              "w-12 md:w-20 h-1 mx-1",
              index + 1 < currentStep ? "bg-green-500" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
    <div className="flex justify-between">
      {steps.map((step, index) => (
        <span 
          key={index} 
          className={cn(
            "text-xs text-center flex-1",
            index + 1 === currentStep 
              ? "text-primary font-medium" 
              : "text-muted-foreground"
          )}
        >
          {step}
        </span>
      ))}
    </div>
  </div>
);

// ============= COMPONENTE PRINCIPAL =============
const RegistrarPuntajeDialog: React.FC<RegistrarPuntajeDialogProps> = ({
  open,
  onOpenChange,
  actividadId,
  bloques,
  onSuccess,
}) => {
  // Estados
  const [paso, setPaso] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [patrullas, setPatrullas] = useState<Patrulla[]>([]);
  const [loading, setLoading] = useState(true);

  // Form con React Hook Form + Zod
  const form = useForm<PuntajeFormData>({
    resolver: zodResolver(puntajeSchema),
    defaultValues: {
      bloque_id: '',
      patrulla_id: '',
      puntaje: 0,
      observaciones: '',
    },
    mode: 'onBlur',
  });

  const { watch, setValue, trigger, reset, handleSubmit, formState: { errors } } = form;
  const bloqueId = watch('bloque_id');
  const patrullaId = watch('patrulla_id');
  const puntaje = watch('puntaje');

  // Filtrar bloques que otorgan puntaje
  const bloquesConPuntaje = useMemo(() => 
    bloques.filter(b => b.otorga_puntaje),
    [bloques]
  );

  // Bloque seleccionado
  const bloqueSeleccionado = useMemo(() => 
    bloquesConPuntaje.find(b => b.id === bloqueId),
    [bloquesConPuntaje, bloqueId]
  );

  // Patrulla seleccionada
  const patrullaSeleccionada = useMemo(() => 
    patrullas.find(p => p.id === patrullaId),
    [patrullas, patrullaId]
  );

  // Cargar patrullas
  const cargarPatrullas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patrullas')
        .select('id, nombre, color_patrulla')
        .eq('estado', 'ACTIVO')
        .order('nombre');

      if (error) throw error;
      setPatrullas(data || []);
    } catch (error) {
      console.error('Error cargando patrullas:', error);
      toast.error('Error al cargar patrullas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto para cargar datos al abrir
  useEffect(() => {
    if (open) {
      cargarPatrullas();
      setPaso(1);
      reset();
    }
  }, [open, cargarPatrullas, reset]);

  // Navegación entre pasos
  const siguientePaso = async () => {
    let valid = false;
    
    if (paso === 1) {
      valid = await trigger('bloque_id');
      if (valid && bloqueId) setPaso(2);
    } else if (paso === 2) {
      valid = await trigger('patrulla_id');
      if (valid && patrullaId) setPaso(3);
    }
  };

  const pasoAnterior = () => {
    if (paso > 1) setPaso(paso - 1);
  };

  // Submit del formulario
  const onSubmit = async (data: PuntajeFormData) => {
    try {
      setGuardando(true);
      
      await ActividadesExteriorService.registrarPuntaje({
        bloque_id: data.bloque_id,
        patrulla_id: data.patrulla_id,
        puntaje: data.puntaje,
        observaciones: data.observaciones,
      });

      toast.success(
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span>+{data.puntaje} puntos para {patrullaSeleccionada?.nombre}</span>
        </div>
      );
      
      reset();
      setPaso(1);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error registrando puntaje:', error);
      toast.error('Error al registrar puntaje');
    } finally {
      setGuardando(false);
    }
  };

  // Cerrar dialog
  const handleClose = () => {
    reset();
    setPaso(1);
    onOpenChange(false);
  };

  // Pasos del stepper
  const PASOS = ['Actividad', 'Patrulla', 'Puntaje'];

  // Calcular porcentaje del puntaje
  const maxPuntaje = bloqueSeleccionado?.puntaje_maximo || 100;
  const porcentajePuntaje = Math.min((puntaje / maxPuntaje) * 100, 100);

  // Para debugging - actividadId se usa para contexto futuro
  console.log('RegistrarPuntajeDialog - actividadId:', actividadId, 'bloques:', bloques.length, 'con puntaje:', bloquesConPuntaje.length);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Registrar Puntaje
          </DialogTitle>
          <DialogDescription>
            {bloquesConPuntaje.length > 0 
              ? `Paso ${paso} de 3: ${PASOS[paso - 1]}`
              : 'Configura primero actividades con puntaje'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Si no hay bloques con puntaje, mostrar estado vacío */}
        {bloquesConPuntaje.length === 0 ? (
          <EstadoVacioBloques onClose={handleClose} />
        ) : (
          <>
            {/* Indicador de pasos */}
            <StepIndicator 
              currentStep={paso} 
              totalSteps={3} 
              steps={PASOS}
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* ========== PASO 1: Seleccionar Actividad ========== */}
              {paso === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      ¿En qué actividad se ganó el puntaje?
                    </Label>
                    <Badge variant="outline">
                      {bloquesConPuntaje.length} disponibles
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {bloquesConPuntaje.map(bloque => (
                      <BloqueCard
                        key={bloque.id}
                        bloque={bloque}
                        selected={bloqueId === bloque.id}
                        onSelect={() => setValue('bloque_id', bloque.id!)}
                      />
                    ))}
                  </div>
                  
                  {errors.bloque_id && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.bloque_id.message}
                    </p>
                  )}
                </div>
              )}

              {/* ========== PASO 2: Seleccionar Patrulla ========== */}
              {paso === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      ¿Qué patrulla ganó?
                    </Label>
                    {loading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Contexto de la actividad seleccionada */}
                  {bloqueSeleccionado && (
                    <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                      <Target className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{bloqueSeleccionado.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          Máximo: {bloqueSeleccionado.puntaje_maximo || 100} puntos
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 max-h-[280px] overflow-y-auto pr-1">
                    {patrullas.map(patrulla => (
                      <PatrullaCard
                        key={patrulla.id}
                        patrulla={patrulla}
                        selected={patrullaId === patrulla.id}
                        onSelect={() => setValue('patrulla_id', patrulla.id)}
                      />
                    ))}
                  </div>

                  {patrullas.length === 0 && !loading && (
                    <div className="text-center py-6 text-muted-foreground">
                      No hay patrullas activas registradas
                    </div>
                  )}

                  {errors.patrulla_id && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.patrulla_id.message}
                    </p>
                  )}
                </div>
              )}

              {/* ========== PASO 3: Ingresar Puntaje ========== */}
              {paso === 3 && (
                <div className="space-y-6">
                  {/* Resumen de selección */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Actividad</p>
                        <p className="text-sm font-medium">{bloqueSeleccionado?.nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: patrullaSeleccionada?.color_patrulla || '#6B7280' }}
                      />
                      <div>
                        <p className="text-xs text-muted-foreground">Patrulla</p>
                        <p className="text-sm font-medium">{patrullaSeleccionada?.nombre}</p>
                      </div>
                    </div>
                  </div>

                  {/* Input de puntaje */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="puntaje" className="text-base font-medium">
                        ¿Cuántos puntos ganó? *
                      </Label>
                      <div className="relative">
                        <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-500" />
                        <Input
                          id="puntaje"
                          type="number"
                          min={0}
                          max={maxPuntaje}
                          className="pl-10 text-2xl font-bold h-14 text-center"
                          placeholder="0"
                          {...form.register('puntaje', { valueAsNumber: true })}
                        />
                      </div>
                      
                      {/* Botones rápidos de puntaje */}
                      <div className="flex gap-2 flex-wrap justify-center">
                        {[1, 2, 3, 5, 10].filter(p => p <= maxPuntaje).map(pts => (
                          <Button
                            key={pts}
                            type="button"
                            variant={puntaje === pts ? "default" : "outline"}
                            size="sm"
                            onClick={() => setValue('puntaje', pts)}
                          >
                            +{pts}
                          </Button>
                        ))}
                        <Button
                          type="button"
                          variant={puntaje === maxPuntaje ? "default" : "outline"}
                          size="sm"
                          onClick={() => setValue('puntaje', maxPuntaje)}
                          className={puntaje === maxPuntaje ? "" : "bg-yellow-50 hover:bg-yellow-100"}
                        >
                          🏆 Máx ({maxPuntaje})
                        </Button>
                      </div>
                      
                      {/* Barra de progreso visual */}
                      <div className="space-y-1">
                        <Progress value={porcentajePuntaje} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">
                          {puntaje} de {maxPuntaje} puntos máximos ({Math.round(porcentajePuntaje)}%)
                        </p>
                      </div>
                      
                      {errors.puntaje && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.puntaje.message}
                        </p>
                      )}
                    </div>

                    {/* Observaciones (opcional) */}
                    <div className="space-y-2">
                      <Label htmlFor="observaciones">
                        Observaciones <span className="text-muted-foreground">(opcional)</span>
                      </Label>
                      <Textarea
                        id="observaciones"
                        placeholder="Ej: Excelente trabajo en equipo, completaron el desafío primero..."
                        className="resize-none"
                        rows={3}
                        {...form.register('observaciones')}
                      />
                      {form.watch('observaciones')?.length ? (
                        <p className="text-xs text-muted-foreground text-right">
                          {form.watch('observaciones')?.length || 0}/500
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {/* ========== FOOTER CON NAVEGACIÓN ========== */}
              <DialogFooter className="flex justify-between gap-2 sm:justify-between">
                <div>
                  {paso > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={pasoAnterior}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={handleClose}
                  >
                    Cancelar
                  </Button>
                  {paso < 3 ? (
                    <Button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        siguientePaso();
                      }}
                      disabled={
                        (paso === 1 && !bloqueId) ||
                        (paso === 2 && !patrullaId)
                      }
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={guardando || puntaje <= 0}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      {guardando ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Trophy className="h-4 w-4 mr-2" />
                          Registrar +{puntaje} pts
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegistrarPuntajeDialog;
