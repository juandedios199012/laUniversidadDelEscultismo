/**
 * Nuevo Menu Dialog - Agregar comidas al menú
 * Con tipos de comida y día
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Utensils
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
  TIPOS_COMIDA_ACTIVIDAD,
} from '@/services/actividadesExteriorService';
import { toast } from 'sonner';

// Schema de validación
const menuSchema = z.object({
  dia: z.number().min(1, 'Selecciona un día'),
  tipo_comida: z.enum(['DESAYUNO', 'ALMUERZO', 'CENA', 'ADICIONALES']),
  nombre_plato: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional(),
  responsable_cocina: z.string().optional(),
});

type MenuFormData = z.infer<typeof menuSchema>;

interface NuevoMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actividadId: string;
  diasActividad: number; // Número de días de la actividad
  onSuccess: () => void;
}

const NuevoMenuDialog: React.FC<NuevoMenuDialogProps> = ({
  open,
  onOpenChange,
  actividadId,
  diasActividad,
  onSuccess,
}) => {
  const [guardando, setGuardando] = useState(false);

  const form = useForm<MenuFormData>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      dia: 1,
      tipo_comida: 'ALMUERZO',
      nombre_plato: '',
      descripcion: '',
      responsable_cocina: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: MenuFormData) => {
    try {
      setGuardando(true);
      
      await ActividadesExteriorService.agregarMenu(actividadId, {
        dia: data.dia,
        tipo_comida: data.tipo_comida,
        nombre_plato: data.nombre_plato,
        descripcion: data.descripcion,
        responsable_cocina: data.responsable_cocina,
      });

      toast.success('Comida agregada al menú');
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error agregando menú:', error);
      toast.error('Error al agregar comida');
    } finally {
      setGuardando(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  // Generar opciones de días
  const diasOpciones = Array.from({ length: Math.max(diasActividad, 1) }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Agregar Comida al Menú
          </DialogTitle>
          <DialogDescription>
            Planifica las comidas para cada día de la actividad
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Día *</FormLabel>
                    <Select 
                      value={field.value?.toString()} 
                      onValueChange={(v) => field.onChange(parseInt(v))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona día" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {diasOpciones.map(dia => (
                          <SelectItem key={dia} value={dia.toString()}>
                            Día {dia}
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
                name="tipo_comida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Comida *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_COMIDA_ACTIVIDAD.map(tipo => (
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

            <FormField
              control={form.control}
              name="nombre_plato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Plato / Comida *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Arroz con pollo, Sandwich de jamón..."
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
                  <FormLabel>Descripción / Ingredientes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ingredientes principales, porciones, consideraciones..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsable_cocina"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsable de Cocina</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Patrulla o persona responsable"
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
                {guardando ? 'Guardando...' : 'Agregar Comida'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NuevoMenuDialog;
