/**
 * Componente: Tab de Logística
 * Gestiona los recursos transversales: mesas, toldos, carpas, equipos de cocina, etc.
 * Stack: React Hook Form + Zod + Shadcn/ui
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Trash2,
  Edit,
  Package,
  Truck,
  Tent,
  ChefHat,
  Shield,
  Lightbulb,
  Radio,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  ActividadesExteriorService,
  ItemLogistica,
  UNIDADES_MEDIDA,
  CATEGORIAS_LOGISTICA,
  TIPOS_COSTO_LOGISTICA,
  ESTADOS_LOGISTICA,
} from '@/services/actividadesExteriorService';

// Schema de validación
const logisticaSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  categoria: z.string().min(1, 'Selecciona una categoría'),
  unidad: z.string().min(1, 'Selecciona una unidad'),
  cantidad: z.number().min(0.01, 'Cantidad mínima 0.01'),
  precio_unitario: z.number().min(0, 'Precio mínimo 0'),
  tipo_costo: z.string(),
  dias_alquiler: z.number().min(1),
  descripcion: z.string().optional(),
  fuente: z.string(),
  proveedor_nombre: z.string().optional(),
  proveedor_contacto: z.string().optional(),
  fecha_necesaria: z.string().optional(),
  fecha_devolucion: z.string().optional(),
  es_critico: z.boolean(),
  notas: z.string().optional(),
});

type LogisticaFormData = z.infer<typeof logisticaSchema>;

interface LogisticaTabProps {
  actividadId: string;
  readonly?: boolean;
  onTotalChange?: (total: number) => void;
}

const LogisticaTab: React.FC<LogisticaTabProps> = ({
  actividadId,
  readonly = false,
  onTotalChange,
}) => {
  const [items, setItems] = useState<ItemLogistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [itemEditar, setItemEditar] = useState<ItemLogistica | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Form
  const form = useForm<LogisticaFormData>({
    resolver: zodResolver(logisticaSchema),
    defaultValues: {
      nombre: '',
      categoria: 'EQUIPAMIENTO',
      unidad: 'unidad',
      cantidad: 1,
      precio_unitario: 0,
      tipo_costo: 'COMPRA',
      dias_alquiler: 1,
      descripcion: '',
      fuente: 'COMPRA',
      proveedor_nombre: '',
      proveedor_contacto: '',
      fecha_necesaria: '',
      fecha_devolucion: '',
      es_critico: false,
      notas: '',
    },
    mode: 'onBlur',
  });

  // Cargar items
  const cargarItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ActividadesExteriorService.listarLogistica(actividadId);
      setItems(data);
      
      const total = data.reduce((sum, i) => sum + (i.costo_total_alquiler || i.subtotal || 0), 0);
      onTotalChange?.(total);

      // Expandir categorías con items
      const categorias = new Set(data.map(i => i.categoria));
      setExpandedCategories(categorias);
    } catch (error) {
      console.error('Error cargando logística:', error);
      toast.error('Error al cargar logística');
    } finally {
      setLoading(false);
    }
  }, [actividadId, onTotalChange]);

  useEffect(() => {
    cargarItems();
  }, [cargarItems]);

  // Abrir dialog para editar
  const handleEditar = (item: ItemLogistica) => {
    setItemEditar(item);
    form.reset({
      nombre: item.nombre,
      categoria: item.categoria,
      unidad: item.unidad,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      tipo_costo: item.tipo_costo,
      dias_alquiler: item.dias_alquiler || 1,
      descripcion: item.descripcion || '',
      fuente: item.fuente || 'COMPRA',
      proveedor_nombre: item.proveedor_nombre || '',
      proveedor_contacto: item.proveedor_contacto || '',
      fecha_necesaria: item.fecha_necesaria || '',
      fecha_devolucion: item.fecha_devolucion || '',
      es_critico: item.es_critico || false,
      notas: item.notas || '',
    });
    setShowAddDialog(true);
  };

  // Agregar o actualizar item
  const handleSubmit = async (data: LogisticaFormData) => {
    try {
      setSaving(true);
      
      const itemData = {
        nombre: data.nombre,
        categoria: data.categoria as any,
        unidad: data.unidad,
        cantidad: data.cantidad,
        precio_unitario: data.precio_unitario,
        tipo_costo: data.tipo_costo as any,
        dias_alquiler: data.dias_alquiler,
        descripcion: data.descripcion,
        fuente: data.fuente as any,
        proveedor_nombre: data.proveedor_nombre,
        proveedor_contacto: data.proveedor_contacto,
        fecha_necesaria: data.fecha_necesaria || undefined,
        fecha_devolucion: data.fecha_devolucion || undefined,
        es_critico: data.es_critico,
        notas: data.notas,
      };
      
      if (itemEditar) {
        // Actualizar
        await ActividadesExteriorService.actualizarLogistica(itemEditar.id, itemData);
        toast.success('Item actualizado');
      } else {
        // Crear nuevo
        await ActividadesExteriorService.agregarLogistica(actividadId, itemData);
        toast.success('Item de logística agregado');
      }
      
      form.reset();
      setItemEditar(null);
      setShowAddDialog(false);
      cargarItems();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Cambiar estado
  const handleCambiarEstado = async (itemId: string, nuevoEstado: string) => {
    try {
      await ActividadesExteriorService.actualizarLogistica(itemId, {
        estado: nuevoEstado as any,
      });
      toast.success('Estado actualizado');
      cargarItems();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar');
    }
  };

  // Eliminar
  const handleEliminar = async (itemId: string) => {
    if (!confirm('¿Eliminar este item de logística?')) return;
    try {
      await ActividadesExteriorService.eliminarLogistica(itemId);
      toast.success('Item eliminado');
      cargarItems();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  // Toggle categoría expandida
  const toggleCategoria = (categoria: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoria)) {
      newExpanded.delete(categoria);
    } else {
      newExpanded.add(categoria);
    }
    setExpandedCategories(newExpanded);
  };

  // Agrupar por categoría
  const itemsPorCategoria = items.reduce((acc, item) => {
    if (!acc[item.categoria]) {
      acc[item.categoria] = [];
    }
    acc[item.categoria].push(item);
    return acc;
  }, {} as Record<string, ItemLogistica[]>);

  // Calcular totales
  const totalPresupuestado = items.reduce((sum, i) => sum + (i.costo_total_alquiler || i.subtotal || 0), 0);
  const itemsCriticos = items.filter(i => i.es_critico);
  const itemsConfirmados = items.filter(i => i.estado === 'CONFIRMADO' || i.estado === 'EN_LUGAR');

  const formatMonto = (monto: number) => `S/ ${monto.toFixed(2)}`;

  // Obtener icono de categoría
  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'CARPAS': return <Tent className="h-4 w-4" />;
      case 'COCINA': return <ChefHat className="h-4 w-4" />;
      case 'TRANSPORTE': return <Truck className="h-4 w-4" />;
      case 'SEGURIDAD': return <Shield className="h-4 w-4" />;
      case 'COMUNICACION': return <Radio className="h-4 w-4" />;
      case 'ILUMINACION': return <Lightbulb className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Logística
          </CardTitle>
          <CardDescription>
            Equipamiento transversal: mesas, toldos, carpas, equipos de cocina, etc.
          </CardDescription>
        </div>
        {!readonly && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Item
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Presupuesto</p>
            <p className="text-2xl font-bold text-green-600">{formatMonto(totalPresupuestado)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Confirmados</p>
            <p className="text-2xl font-bold text-blue-600">{itemsConfirmados.length}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Críticos
            </p>
            <p className="text-2xl font-bold text-red-600">{itemsCriticos.length}</p>
          </div>
        </div>

        {/* Lista agrupada por categoría */}
        {items.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/30">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Sin equipamiento registrado</h3>
            <p className="text-muted-foreground mb-4">
              Agrega los recursos necesarios para la actividad
            </p>
            {!readonly && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primer Item
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(itemsPorCategoria).map(([categoria, itemsCat]) => {
              const categoriaInfo = CATEGORIAS_LOGISTICA.find(c => c.value === categoria);
              const totalCategoria = itemsCat.reduce((sum, i) => sum + (i.costo_total_alquiler || i.subtotal || 0), 0);
              const isExpanded = expandedCategories.has(categoria);

              return (
                <Collapsible
                  key={categoria}
                  open={isExpanded}
                  onOpenChange={() => toggleCategoria(categoria)}
                >
                  <div className="border rounded-lg overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {getCategoriaIcon(categoria)}
                          <div>
                            <h4 className="font-medium">
                              {categoriaInfo?.emoji} {categoriaInfo?.label || categoria}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {itemsCat.length} items • {formatMonto(totalCategoria)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {itemsCat.some(i => i.es_critico) && (
                            <Badge variant="destructive" className="text-xs">
                              ⚠️ Crítico
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {itemsCat.filter(i => i.estado === 'CONFIRMADO' || i.estado === 'EN_LUGAR').length}/{itemsCat.length} ✓
                          </Badge>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/20">
                            <TableHead className="w-[25%]">Item</TableHead>
                            <TableHead className="w-[12%] text-center">Tipo Costo</TableHead>
                            <TableHead className="w-[12%] text-right">Cantidad</TableHead>
                            <TableHead className="w-[12%] text-right">P. Unit.</TableHead>
                            <TableHead className="w-[12%] text-right">Total</TableHead>
                            <TableHead className="w-[15%] text-center">Estado</TableHead>
                            {!readonly && <TableHead className="w-[80px]"></TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itemsCat.map((item) => (
                            <TableRow 
                              key={item.id}
                              className={item.es_critico ? 'bg-red-50/50' : ''}
                            >
                              <TableCell>
                                <div className="flex items-start gap-2">
                                  {item.es_critico && (
                                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                  )}
                                  <div>
                                    <span className="font-medium">{item.nombre}</span>
                                    {item.proveedor_nombre && (
                                      <p className="text-xs text-muted-foreground">
                                        📍 {item.proveedor_nombre}
                                        {item.proveedor_contacto && ` • ${item.proveedor_contacto}`}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-xs">
                                  {TIPOS_COSTO_LOGISTICA.find(t => t.value === item.tipo_costo)?.label}
                                  {item.tipo_costo === 'ALQUILER' && item.dias_alquiler > 1 && (
                                    <span className="ml-1">({item.dias_alquiler}d)</span>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {item.cantidad} {UNIDADES_MEDIDA.find(u => u.value === item.unidad)?.label || item.unidad}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatMonto(item.precio_unitario)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatMonto(item.costo_total_alquiler || item.subtotal)}
                              </TableCell>
                              <TableCell className="text-center">
                                {readonly ? (
                                  <Badge 
                                    variant="outline"
                                    className={`text-${ESTADOS_LOGISTICA.find(e => e.value === item.estado)?.color}-600`}
                                  >
                                    {ESTADOS_LOGISTICA.find(e => e.value === item.estado)?.emoji}{' '}
                                    {ESTADOS_LOGISTICA.find(e => e.value === item.estado)?.label}
                                  </Badge>
                                ) : (
                                  <Select
                                    value={item.estado}
                                    onValueChange={(v) => handleCambiarEstado(item.id, v)}
                                  >
                                    <SelectTrigger className="h-8 w-[120px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ESTADOS_LOGISTICA.map((estado) => (
                                        <SelectItem key={estado.value} value={estado.value}>
                                          {estado.emoji} {estado.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </TableCell>
                              {!readonly && (
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleEditar(item)}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive"
                                      onClick={() => handleEliminar(item.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}

        {/* Total general */}
        {items.length > 0 && (
          <div className="flex justify-end">
            <div className="bg-primary/10 rounded-lg p-4 text-right">
              <p className="text-sm text-muted-foreground">Total Logística</p>
              <p className="text-2xl font-bold">{formatMonto(totalPresupuestado)}</p>
            </div>
          </div>
        )}
      </CardContent>

      {/* Dialog agregar/editar */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        if (!open) {
          form.reset();
          setItemEditar(null);
        }
        setShowAddDialog(open);
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {itemEditar ? 'Editar Item de Logística' : 'Agregar Item de Logística'}
            </DialogTitle>
            <DialogDescription>
              Equipamiento transversal para la actividad
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Nombre */}
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <Label>Nombre del Item *</Label>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Carpa iglú 4 personas, Mesa plegable..." />
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
                    <Label>Categoría *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIAS_LOGISTICA.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.emoji} {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo de costo y días alquiler */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo_costo"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Tipo de Costo</Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIPOS_COSTO_LOGISTICA.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('tipo_costo') === 'ALQUILER' && (
                  <FormField
                    control={form.control}
                    name="dias_alquiler"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Días de Alquiler</Label>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Unidad y Cantidad */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unidad"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Unidad *</Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UNIDADES_MEDIDA.map((u) => (
                            <SelectItem key={u.value} value={u.value}>
                              {u.label}
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
                  name="cantidad"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Cantidad *</Label>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Precio */}
              {(form.watch('tipo_costo') === 'COMPRA' || form.watch('tipo_costo') === 'ALQUILER') && (
                <FormField
                  control={form.control}
                  name="precio_unitario"
                  render={({ field }) => (
                    <FormItem>
                      <Label>
                        {form.watch('tipo_costo') === 'ALQUILER' ? 'Precio por día (S/)' : 'Precio Unitario (S/)'}
                      </Label>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            S/
                          </span>
                          <Input
                            type="number"
                            step="0.01"
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
              )}

              {/* Subtotal calculado */}
              {(form.watch('tipo_costo') === 'COMPRA' || form.watch('tipo_costo') === 'ALQUILER') && (
                <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="font-bold text-lg">
                    {formatMonto(
                      (form.watch('cantidad') || 0) * 
                      (form.watch('precio_unitario') || 0) * 
                      (form.watch('tipo_costo') === 'ALQUILER' ? (form.watch('dias_alquiler') || 1) : 1)
                    )}
                  </span>
                </div>
              )}

              {/* Proveedor */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="proveedor_nombre"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Proveedor/Responsable</Label>
                      <FormControl>
                        <Input {...field} placeholder="Nombre..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proveedor_contacto"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Contacto</Label>
                      <FormControl>
                        <Input {...field} placeholder="Teléfono/Email..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fecha_necesaria"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Fecha Necesaria</Label>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fecha_devolucion"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Fecha Devolución</Label>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Es crítico */}
              <FormField
                control={form.control}
                name="es_critico"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0 border rounded-lg p-3 bg-red-50/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div>
                      <Label className="font-medium cursor-pointer flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Es item crítico
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Sin este item no se puede realizar la actividad
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {/* Notas */}
              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <Label>Notas (opcional)</Label>
                    <FormControl>
                      <Textarea {...field} placeholder="Observaciones..." rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setItemEditar(null);
                    setShowAddDialog(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : itemEditar ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default LogisticaTab;
