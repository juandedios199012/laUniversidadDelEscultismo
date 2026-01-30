/**
 * Nuevo Item Presupuesto Dialog - Agregar gastos al presupuesto
 * Con categorías predefinidas y cálculo automático
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  DollarSign,
  Package,
  Calculator
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
  CATEGORIAS_PRESUPUESTO_ACTIVIDAD,
} from '@/services/actividadesExteriorService';
import { toast } from 'sonner';

// Schema de validación
const presupuestoSchema = z.object({
  categoria: z.string().min(1, 'Selecciona una categoría'),
  concepto: z.string().min(3, 'Mínimo 3 caracteres'),
  descripcion: z.string().optional(),
  cantidad: z.number().min(1, 'Mínimo 1'),
  precio_unitario: z.number().min(0, 'Debe ser positivo'),
  proveedor: z.string().optional(),
});

type PresupuestoFormData = z.infer<typeof presupuestoSchema>;

interface NuevoPresupuestoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actividadId: string;
  onSuccess: () => void;
}

const NuevoPresupuestoDialog: React.FC<NuevoPresupuestoDialogProps> = ({
  open,
  onOpenChange,
  actividadId,
  onSuccess,
}) => {
  const [guardando, setGuardando] = useState(false);

  const form = useForm<PresupuestoFormData>({
    resolver: zodResolver(presupuestoSchema),
    defaultValues: {
      categoria: '',
      concepto: '',
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      proveedor: '',
    },
    mode: 'onBlur',
  });

  const cantidad = form.watch('cantidad');
  const precioUnitario = form.watch('precio_unitario');
  const total = (cantidad || 0) * (precioUnitario || 0);

  const onSubmit = async (data: PresupuestoFormData) => {
    try {
      setGuardando(true);
      
      await ActividadesExteriorService.agregarPresupuestoItem(actividadId, {
        categoria: data.categoria,
        concepto: data.concepto,
        descripcion: data.descripcion,
        cantidad: data.cantidad,
        precio_unitario: data.precio_unitario,
        proveedor: data.proveedor,
      });

      toast.success('Item agregado al presupuesto');
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error agregando item:', error);
      toast.error('Error al agregar item');
    } finally {
      setGuardando(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg font-bold">S/</span>
            Agregar Item al Presupuesto
          </DialogTitle>
          <DialogDescription>
            Agrega un nuevo gasto o costo al presupuesto de la actividad
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIAS_PRESUPUESTO_ACTIVIDAD.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.emoji} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="concepto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concepto *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Bus de ida y vuelta, Carpas, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalles adicionales..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cantidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number"
                          min="1"
                          className="pl-10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="precio_unitario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Unitario (S/) *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground font-medium">S/</span>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
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
            </div>

            {/* Total calculado */}
            <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total:</span>
              </div>
              <span className="text-xl font-bold">
                S/ {total.toFixed(2)}
              </span>
            </div>

            <FormField
              control={form.control}
              name="proveedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nombre del proveedor (opcional)"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Agregar Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NuevoPresupuestoDialog;
