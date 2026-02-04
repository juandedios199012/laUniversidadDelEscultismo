/**
 * Dialog para Registrar Compra de Item (Ingrediente/Material/Logística)
 * Captura precio real, cantidad real y voucher opcional
 * Stack: React Hook Form + Zod + Shadcn/ui
 */

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Badge } from '@/components/ui/badge';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import {
  ShoppingCart,
  Package,
  FileText,
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Receipt,
  Store,
  FileImage,
} from 'lucide-react';
import {
  ActividadesExteriorService,
  TipoComprobante,
  TipoItemVoucher,
} from '@/services/actividadesExteriorService';
import { toast } from 'sonner';

// Schema de validación
const compraSchema = z.object({
  // Datos de la compra
  precio_unitario_real: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  cantidad_comprada: z.number().min(0.001, 'La cantidad debe ser mayor a 0').optional(),
  lugar_compra: z.string().optional(),
  proveedor: z.string().optional(),
  notas_compra: z.string().optional(),
  
  // Datos del voucher (opcional)
  adjuntar_voucher: z.boolean(),
  tipo_comprobante: z.string().optional(),
  numero_comprobante: z.string().optional(),
  ruc_proveedor: z.string().optional(),
  razon_social: z.string().optional(),
  fecha_emision: z.string().optional(),
  monto_comprobante: z.number().optional(),
});

type CompraFormData = z.infer<typeof compraSchema>;

// Tipos de comprobante
const TIPOS_COMPROBANTE: { value: TipoComprobante; label: string; icon: React.ReactNode }[] = [
  { value: 'BOLETA', label: 'Boleta de Venta', icon: <Receipt className="h-4 w-4" /> },
  { value: 'FACTURA', label: 'Factura', icon: <FileText className="h-4 w-4" /> },
  { value: 'TICKET', label: 'Ticket', icon: <Receipt className="h-4 w-4" /> },
  { value: 'RECIBO', label: 'Recibo', icon: <FileText className="h-4 w-4" /> },
  { value: 'SIN_COMPROBANTE', label: 'Sin Comprobante', icon: <X className="h-4 w-4" /> },
];

interface ItemParaComprar {
  id: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  proveedor?: string;
}

interface RegistrarCompraItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemParaComprar | null;
  tipoItem: TipoItemVoucher;
  actividadId: string;
  onSuccess: () => void;
}

const RegistrarCompraItemDialog: React.FC<RegistrarCompraItemDialogProps> = ({
  open,
  onOpenChange,
  item,
  tipoItem,
  actividadId,
  onSuccess,
}) => {
  const [saving, setSaving] = useState(false);
  const [archivoVoucher, setArchivoVoucher] = useState<File | null>(null);
  const [previewVoucher, setPreviewVoucher] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CompraFormData>({
    resolver: zodResolver(compraSchema),
    defaultValues: {
      precio_unitario_real: item?.precio_unitario || 0,
      cantidad_comprada: item?.cantidad || 1,
      lugar_compra: '',
      proveedor: item?.proveedor || '',
      notas_compra: '',
      adjuntar_voucher: false,
      tipo_comprobante: 'BOLETA',
      numero_comprobante: '',
      ruc_proveedor: '',
      razon_social: '',
      fecha_emision: new Date().toISOString().split('T')[0],
      monto_comprobante: 0,
    },
    mode: 'onBlur',
  });

  // Reset form cuando cambia el item
  React.useEffect(() => {
    if (item && open) {
      form.reset({
        precio_unitario_real: item.precio_unitario,
        cantidad_comprada: item.cantidad,
        lugar_compra: '',
        proveedor: item.proveedor || '',
        notas_compra: '',
        adjuntar_voucher: false,
        tipo_comprobante: 'BOLETA',
        numero_comprobante: '',
        ruc_proveedor: '',
        razon_social: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        monto_comprobante: 0,
      });
      setArchivoVoucher(null);
      setPreviewVoucher(null);
    }
  }, [item, open, form]);

  const watchAdjuntarVoucher = form.watch('adjuntar_voucher');
  const watchPrecioReal = form.watch('precio_unitario_real');
  const watchCantidadReal = form.watch('cantidad_comprada');

  // Calcular subtotales
  const subtotalEstimado = item ? item.cantidad * item.precio_unitario : 0;
  const subtotalReal = (watchCantidadReal || item?.cantidad || 0) * (watchPrecioReal || 0);
  const diferencia = subtotalReal - subtotalEstimado;

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo (imagen o PDF)
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Solo se permiten imágenes o PDFs');
      return;
    }

    // Validar tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar 10MB');
      return;
    }

    setArchivoVoucher(file);

    // Preview para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreviewVoucher(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewVoucher(null);
    }
  };

  const handleRemoveFile = () => {
    setArchivoVoucher(null);
    setPreviewVoucher(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (data: CompraFormData) => {
    if (!item) return;

    try {
      setSaving(true);

      // 1. Registrar la compra según el tipo de item
      const compraData = {
        precio_unitario_real: data.precio_unitario_real,
        cantidad_comprada: data.cantidad_comprada,
        lugar_compra: data.lugar_compra,
        proveedor: data.proveedor,
        notas_compra: data.notas_compra,
      };

      if (tipoItem === 'ingrediente') {
        await ActividadesExteriorService.registrarCompraIngrediente(item.id, compraData);
      } else if (tipoItem === 'material') {
        await ActividadesExteriorService.registrarCompraMaterial(item.id, compraData);
      } else if (tipoItem === 'logistica') {
        await ActividadesExteriorService.registrarCompraLogistica(item.id, {
          ...compraData,
          cantidad_real: data.cantidad_comprada,
          proveedor_nombre: data.proveedor,
        });
      }

      // 2. Subir voucher si se adjuntó (OPCIONAL)
      if (data.adjuntar_voucher && archivoVoucher) {
        await ActividadesExteriorService.subirVoucher(
          actividadId,
          {
            tipo_item: tipoItem,
            item_id: item.id,
            nombre_archivo: archivoVoucher.name,
            url_archivo: '', // Se genera al subir
            tipo_comprobante: data.tipo_comprobante as TipoComprobante,
            numero_comprobante: data.numero_comprobante,
            ruc_proveedor: data.ruc_proveedor,
            razon_social_proveedor: data.razon_social,
            fecha_emision: data.fecha_emision,
            monto_comprobante: data.monto_comprobante,
          },
          archivoVoucher
        );
      }

      toast.success('✅ Compra registrada exitosamente');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error registrando compra:', error);
      toast.error(error.message || 'Error al registrar compra');
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  const getTipoItemLabel = () => {
    switch (tipoItem) {
      case 'ingrediente': return 'Ingrediente';
      case 'material': return 'Material';
      case 'logistica': return 'Logística';
      default: return 'Item';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-green-600" />
            Registrar Compra
          </DialogTitle>
          <DialogDescription>
            Registra el precio real de compra de este {getTipoItemLabel().toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        {/* Resumen del item */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold">{item.nombre}</h4>
              <p className="text-sm text-muted-foreground">
                {item.cantidad} {item.unidad}
              </p>
            </div>
            <Badge variant="outline">{getTipoItemLabel()}</Badge>
          </div>
          
          {/* Comparación Estimado vs Real */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Estimado</p>
              <p className="font-medium">S/ {subtotalEstimado.toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Real</p>
              <p className={`font-bold ${diferencia > 0 ? 'text-red-600' : diferencia < 0 ? 'text-green-600' : ''}`}>
                S/ {subtotalReal.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Indicador de diferencia */}
          {diferencia !== 0 && (
            <div className={`flex items-center justify-center gap-2 py-1 px-2 rounded text-sm ${
              diferencia > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {diferencia > 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Sobrecosto: S/ {diferencia.toFixed(2)}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Ahorro: S/ {Math.abs(diferencia).toFixed(2)}
                </>
              )}
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Precio real y cantidad */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="precio_unitario_real"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Unitario Real *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">S/</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
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
                name="cantidad_comprada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad Comprada</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder={item.cantidad.toString()}
                          className="pl-9"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Estimado: {item.cantidad} {item.unidad}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lugar de compra y proveedor */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lugar_compra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lugar de Compra</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Ej: Mercado Central"
                          className="pl-9"
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
                name="proveedor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del vendedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notas */}
            <FormField
              control={form.control}
              name="notas_compra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas de la Compra</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones adicionales..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Voucher (OPCIONAL) */}
            <FormField
              control={form.control}
              name="adjuntar_voucher"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="font-medium">
                      Adjuntar Comprobante
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Opcional: sube boleta, factura o ticket
                    </FormDescription>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Campos de voucher (condicional) */}
            {watchAdjuntarVoucher && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                {/* Upload de archivo */}
                <div className="space-y-2">
                  <Label>Archivo del Comprobante</Label>
                  {!archivoVoucher ? (
                    <div
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Clic para subir imagen o PDF
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Máx 10MB
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-background relative">
                      {previewVoucher ? (
                        <img
                          src={previewVoucher}
                          alt="Preview"
                          className="h-16 w-16 object-cover rounded"
                        />
                      ) : (
                        <FileImage className="h-12 w-12 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {archivoVoucher.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(archivoVoucher.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="relative z-50 hover:bg-destructive/10 shrink-0"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Tipo de comprobante */}
                <FormField
                  control={form.control}
                  name="tipo_comprobante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Comprobante</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIPOS_COMPROBANTE.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              <span className="flex items-center gap-2">
                                {tipo.icon}
                                {tipo.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Número de comprobante */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="numero_comprobante"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>N° Comprobante</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: B001-00123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monto_comprobante"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto Total</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  'Registrando...'
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Registrar Compra
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrarCompraItemDialog;
