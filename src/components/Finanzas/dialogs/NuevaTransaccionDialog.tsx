/**
 * Nueva Transacción Dialog - Formulario para registrar ingresos/egresos
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Upload, 
  X, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  DollarSign,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  Banknote
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
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FinanzasService, 
  TipoTransaccion,
  CategoriaFinanzas,
  MetodoPago,
  CATEGORIAS_INGRESO,
  CATEGORIAS_EGRESO,
  METODOS_PAGO,
} from '@/services/finanzasService';

// Tipos de prestamista
const TIPOS_PRESTAMISTA = [
  { value: 'DIRIGENTE', label: 'Dirigente', emoji: '👨‍🏫' },
  { value: 'PADRE', label: 'Padre de Familia', emoji: '👨‍👩‍👧' },
  { value: 'SCOUT', label: 'Scout', emoji: '⚜️' },
  { value: 'EXTERNO', label: 'Persona Externa', emoji: '👤' },
];

// Schema de validación
const transaccionSchema = z.object({
  tipo: z.enum(['INGRESO', 'EGRESO']),
  categoria: z.string().min(1, 'Selecciona una categoría'),
  concepto: z.string().min(3, 'Mínimo 3 caracteres').max(255),
  descripcion: z.string().optional(),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  fecha_transaccion: z.string().min(1, 'Selecciona una fecha'),
  proveedor_beneficiario: z.string().optional(),
  metodo_pago: z.string().optional(),
  numero_operacion: z.string().optional(),
  notas: z.string().optional(),
  // Campos de préstamo
  tiene_prestamo: z.boolean().default(false),
  monto_cubierto: z.number().min(0).optional(),
  prestamista_nombre: z.string().optional(),
  prestamista_tipo: z.string().optional(),
  fecha_vencimiento: z.string().optional(),
  motivo_prestamo: z.string().optional(),
});

type TransaccionFormData = z.infer<typeof transaccionSchema>;

interface NuevaTransaccionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const NuevaTransaccionDialog: React.FC<NuevaTransaccionDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [guardando, setGuardando] = useState(false);
  const [tipoActivo, setTipoActivo] = useState<'INGRESO' | 'EGRESO'>('INGRESO');
  const [evidencias, setEvidencias] = useState<File[]>([]);

  const form = useForm<TransaccionFormData>({
    resolver: zodResolver(transaccionSchema),
    defaultValues: {
      tipo: 'INGRESO',
      categoria: '',
      concepto: '',
      descripcion: '',
      monto: 0,
      fecha_transaccion: new Date().toISOString().split('T')[0],
      proveedor_beneficiario: '',
      metodo_pago: 'EFECTIVO',
      numero_operacion: '',
      notas: '',
      // Campos de préstamo
      tiene_prestamo: false,
      monto_cubierto: 0,
      prestamista_nombre: '',
      prestamista_tipo: 'DIRIGENTE',
      fecha_vencimiento: '',
      motivo_prestamo: '',
    },
    mode: 'onBlur',
  });

  const categorias = tipoActivo === 'INGRESO' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
  const tienePrestamo = form.watch('tiene_prestamo');
  const montoTotal = form.watch('monto') || 0;
  const montoCubierto = form.watch('monto_cubierto') || 0;
  const montoPrestamo = tienePrestamo ? Math.max(0, montoTotal - montoCubierto) : 0;

  const handleTipoChange = (tipo: 'INGRESO' | 'EGRESO') => {
    setTipoActivo(tipo);
    form.setValue('tipo', tipo);
    form.setValue('categoria', '');
    // Reset campos de préstamo al cambiar tipo
    if (tipo === 'INGRESO') {
      form.setValue('tiene_prestamo', false);
      form.setValue('monto_cubierto', 0);
      form.setValue('prestamista_nombre', '');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEvidencias(prev => [...prev, ...files]);
  };

  const removeEvidencia = (index: number) => {
    setEvidencias(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: TransaccionFormData) => {
    try {
      setGuardando(true);
      
      // Preparar datos de la transacción
      const transaccionData: any = {
        tipo: data.tipo as TipoTransaccion,
        categoria: data.categoria as CategoriaFinanzas,
        concepto: data.concepto,
        descripcion: data.descripcion,
        monto: data.monto,
        fecha_transaccion: data.fecha_transaccion,
        proveedor_beneficiario: data.proveedor_beneficiario,
        metodo_pago: data.metodo_pago as MetodoPago,
        numero_operacion: data.numero_operacion,
        notas: data.notas,
      };

      // Si tiene préstamo, agregar datos
      if (data.tiene_prestamo && data.tipo === 'EGRESO') {
        transaccionData.monto_cubierto = data.monto_cubierto || 0;
        transaccionData.prestamista_nombre = data.prestamista_nombre;
        transaccionData.prestamista_tipo = data.prestamista_tipo;
        transaccionData.fecha_vencimiento = data.fecha_vencimiento;
        transaccionData.motivo_prestamo = data.motivo_prestamo || data.concepto;
      }

      // Registrar transacción
      const result = await FinanzasService.registrarTransaccion(transaccionData);

      // Subir evidencias si hay
      if (evidencias.length > 0 && result.transaccion_id) {
        for (const file of evidencias) {
          await FinanzasService.subirEvidencia(file, result.transaccion_id);
        }
      }

      form.reset();
      setEvidencias([]);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error guardando transacción:', error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Transacción</DialogTitle>
          <DialogDescription>
            Registra un ingreso o egreso del grupo scout
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Selector de tipo */}
            <Tabs value={tipoActivo} onValueChange={(v) => handleTipoChange(v as 'INGRESO' | 'EGRESO')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="INGRESO" className="gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Ingreso
                </TabsTrigger>
                <TabsTrigger value="EGRESO" className="gap-2">
                  <ArrowDownRight className="h-4 w-4" />
                  Egreso
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Formulario en 2 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Concepto */}
              <FormField
                control={form.control}
                name="concepto"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Concepto *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={tipoActivo === 'INGRESO' 
                          ? "Ej: Cuota mensual enero 2026" 
                          : "Ej: Compra de materiales campamento"
                        }
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Categoría */}
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((cat) => (
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

              {/* Monto */}
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

              {/* Fecha */}
              <FormField
                control={form.control}
                name="fecha_transaccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha *</FormLabel>
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

              {/* Proveedor/Beneficiario */}
              <FormField
                control={form.control}
                name="proveedor_beneficiario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {tipoActivo === 'INGRESO' ? 'Pagado por' : 'Proveedor'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={tipoActivo === 'INGRESO' 
                          ? "Nombre del padre/scout" 
                          : "Nombre del proveedor"
                        }
                        {...field}
                      />
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
                    <FormLabel>Método de pago</FormLabel>
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

              {/* Número de operación (condicional) */}
              {(form.watch('metodo_pago') === 'YAPE' || 
                form.watch('metodo_pago') === 'PLIN' || 
                form.watch('metodo_pago') === 'TRANSFERENCIA') && (
                <FormField
                  control={form.control}
                  name="numero_operacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de operación</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: 123456789"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Descripción */}
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detalles adicionales..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sección de Préstamo - Solo para EGRESOS */}
            {tipoActivo === 'EGRESO' && (
              <div className="space-y-4 border rounded-lg p-4 bg-yellow-50/50">
                <FormField
                  control={form.control}
                  name="tiene_prestamo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2 cursor-pointer">
                          <Banknote className="h-4 w-4 text-yellow-600" />
                          Este gasto fue financiado con dinero prestado
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Marca esta opción si alguien prestó dinero para cubrir total o parcialmente este gasto
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Campos de préstamo condicionales */}
                {tienePrestamo && (
                  <div className="space-y-4 pt-2">
                    <Alert className="bg-yellow-100 border-yellow-300">
                      <AlertTriangle className="h-4 w-4 text-yellow-700" />
                      <AlertDescription className="text-yellow-800">
                        Se creará un préstamo por <strong>S/ {montoPrestamo.toFixed(2)}</strong> que quedará pendiente de devolución.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Monto cubierto con fondos propios */}
                      <FormField
                        control={form.control}
                        name="monto_cubierto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monto pagado con fondos propios (S/)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="pl-10"
                                  max={montoTotal}
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Préstamo: S/ {montoPrestamo.toFixed(2)}
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Nombre del prestamista */}
                      <FormField
                        control={form.control}
                        name="prestamista_nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>¿Quién prestó el dinero? *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nombre de quien prestó"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Tipo de prestamista */}
                      <FormField
                        control={form.control}
                        name="prestamista_tipo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de prestamista</FormLabel>
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

                      {/* Fecha de vencimiento */}
                      <FormField
                        control={form.control}
                        name="fecha_vencimiento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha límite de devolución</FormLabel>
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
                            <p className="text-xs text-muted-foreground">
                              Opcional - Para recordatorio de pago
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Evidencias */}
            <div className="space-y-3">
              <Label>Evidencias / Vouchers</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                <input
                  type="file"
                  id="evidencias"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="evidencias"
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Arrastra archivos o haz clic para seleccionar
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Imágenes o PDFs (máx 5MB cada uno)
                  </span>
                </label>
              </div>

              {/* Preview de evidencias */}
              {evidencias.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {evidencias.map((file, index) => (
                    <div 
                      key={index}
                      className="relative bg-muted rounded-lg p-2 flex items-center gap-2"
                    >
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeEvidencia(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                className={tipoActivo === 'INGRESO' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {guardando ? 'Guardando...' : `Registrar ${tipoActivo === 'INGRESO' ? 'Ingreso' : 'Egreso'}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NuevaTransaccionDialog;
