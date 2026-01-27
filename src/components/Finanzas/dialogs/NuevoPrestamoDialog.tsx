/**
 * Nuevo Préstamo Dialog - Formulario para registrar préstamos recibidos
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CreditCard,
  Calendar,
  DollarSign,
  User,
  AlertCircle
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FinanzasService, 
  MetodoPago,
  METODOS_PAGO,
} from '@/services/finanzasService';

// Schema de validación
const prestamoSchema = z.object({
  monto: z.number().positive('El monto debe ser mayor a 0'),
  concepto: z.string().min(3, 'Mínimo 3 caracteres').max(255),
  fecha_prestamo: z.string().min(1, 'Selecciona una fecha'),
  fecha_vencimiento: z.string().optional(),
  prestamista_nombre: z.string().min(2, 'Ingresa el nombre del prestamista'),
  prestamista_tipo: z.enum(['DIRIGENTE', 'PADRE', 'SCOUT', 'EXTERNO']),
  motivo: z.string().optional(),
  metodo_pago: z.string().optional(),
  numero_operacion: z.string().optional(),
  notas: z.string().optional(),
});

type PrestamoFormData = z.infer<typeof prestamoSchema>;

interface NuevoPrestamoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TIPOS_PRESTAMISTA = [
  { value: 'DIRIGENTE', label: 'Dirigente', emoji: '🎖️' },
  { value: 'PADRE', label: 'Padre de Familia', emoji: '👨‍👩‍👧' },
  { value: 'SCOUT', label: 'Scout', emoji: '⚜️' },
  { value: 'EXTERNO', label: 'Externo', emoji: '👤' },
];

const NuevoPrestamoDialog: React.FC<NuevoPrestamoDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [guardando, setGuardando] = useState(false);

  const form = useForm<PrestamoFormData>({
    resolver: zodResolver(prestamoSchema),
    defaultValues: {
      monto: 0,
      concepto: '',
      fecha_prestamo: new Date().toISOString().split('T')[0],
      fecha_vencimiento: '',
      prestamista_nombre: '',
      prestamista_tipo: 'PADRE',
      motivo: '',
      metodo_pago: 'EFECTIVO',
      numero_operacion: '',
      notas: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: PrestamoFormData) => {
    try {
      setGuardando(true);
      
      // Registrar como transacción tipo PRESTAMO_RECIBIDO
      await FinanzasService.registrarTransaccion({
        tipo: 'PRESTAMO_RECIBIDO',
        categoria: 'OTROS_INGRESOS',
        concepto: data.concepto,
        monto: data.monto,
        fecha_transaccion: data.fecha_prestamo,
        metodo_pago: data.metodo_pago as MetodoPago,
        numero_operacion: data.numero_operacion,
        notas: data.notas,
        // Datos del préstamo
        prestamista_nombre: data.prestamista_nombre,
        prestamista_tipo: data.prestamista_tipo as 'DIRIGENTE' | 'PADRE' | 'SCOUT' | 'EXTERNO',
        fecha_vencimiento: data.fecha_vencimiento || undefined,
        motivo_prestamo: data.motivo,
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error guardando préstamo:', error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Registrar Préstamo Recibido
          </DialogTitle>
          <DialogDescription>
            Registra un préstamo que el grupo ha recibido para un gasto específico
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Este préstamo generará una deuda pendiente que deberá ser pagada posteriormente.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Concepto */}
            <FormField
              control={form.control}
              name="concepto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concepto del préstamo *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Préstamo para campamento de verano"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Monto y Fecha en 2 columnas */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto (S/) *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

              <FormField
                control={form.control}
                name="fecha_prestamo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha del préstamo *</FormLabel>
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
            </div>

            {/* Prestamista */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prestamista_nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del prestamista *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Nombre completo"
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
                name="prestamista_tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de prestamista *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_PRESTAMISTA.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.emoji} {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fecha de vencimiento */}
            <FormField
              control={form.control}
              name="fecha_vencimiento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de vencimiento (opcional)</FormLabel>
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

            {/* Método de pago */}
            <FormField
              control={form.control}
              name="metodo_pago"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿Cómo recibiste el préstamo?</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {METODOS_PAGO.map((metodo) => (
                        <SelectItem key={metodo.value} value={metodo.value}>
                          {metodo.emoji} {metodo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Motivo */}
            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo del préstamo</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="¿Para qué se usará este dinero?"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notas */}
            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas adicionales</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Condiciones, acuerdos, etc."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={guardando}
              >
                {guardando ? 'Registrando...' : 'Registrar Préstamo'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NuevoPrestamoDialog;
