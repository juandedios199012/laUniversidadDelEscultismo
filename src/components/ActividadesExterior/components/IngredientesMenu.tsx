/**
 * Componente: Ingredientes del Menú
 * Gestiona la lista de ingredientes de cada plato con presupuesto integrado
 * Stack: React Hook Form + Zod + Shadcn/ui
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Trash2,
  Package,
  Check,
  X,
  Loader2,
  ShoppingCart,
  Edit2,
  Receipt,
  TrendingUp,
  TrendingDown,
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
  TableFooter,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ActividadesExteriorService,
  IngredienteMenu,
  UNIDADES_MEDIDA,
  ESTADOS_COMPRA_INGREDIENTE,
} from '@/services/actividadesExteriorService';
import RegistrarCompraItemDialog from '../dialogs/RegistrarCompraItemDialog';

// Schema de validación para nuevo ingrediente
const ingredienteSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  unidad: z.string().min(1, 'Selecciona una unidad'),
  cantidad: z.number().min(0.001, 'Cantidad mínima 0.001'),
  precio_unitario: z.number().min(0, 'Precio mínimo 0'),
  descripcion: z.string().optional(),
  proveedor: z.string().optional(),
  es_opcional: z.boolean(),
  notas: z.string().optional(),
});

type IngredienteFormData = z.infer<typeof ingredienteSchema>;

interface IngredientesMenuProps {
  menuId: string;
  menuNombre: string;
  actividadId: string;
  readonly?: boolean;
  onTotalChange?: (total: number, totalReal?: number) => void;
}

const IngredientesMenu: React.FC<IngredientesMenuProps> = ({
  menuId,
  menuNombre,
  actividadId,
  readonly = false,
  onTotalChange,
}) => {
  const [ingredientes, setIngredientes] = useState<IngredienteMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<IngredienteFormData>>({});
  
  // Estado para el modal de registro de compra
  const [showCompraDialog, setShowCompraDialog] = useState(false);
  const [ingredienteParaCompra, setIngredienteParaCompra] = useState<IngredienteMenu | null>(null);

  // Form para agregar nuevo ingrediente
  const form = useForm<IngredienteFormData>({
    resolver: zodResolver(ingredienteSchema),
    defaultValues: {
      nombre: '',
      unidad: 'unidad',
      cantidad: 1,
      precio_unitario: 0,
      descripcion: '',
      proveedor: '',
      es_opcional: false,
      notas: '',
    },
    mode: 'onBlur',
  });

  // Cargar ingredientes
  const cargarIngredientes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ActividadesExteriorService.listarIngredientesMenu(menuId);
      setIngredientes(data);
      
      // Notificar total (estimado y real)
      const total = data.reduce((sum, i) => sum + (i.subtotal || 0), 0);
      const totalReal = data.reduce((sum, i) => sum + (i.subtotal_real || i.subtotal || 0), 0);
      onTotalChange?.(total, totalReal);
    } catch (error) {
      console.error('Error cargando ingredientes:', error);
      toast.error('Error al cargar ingredientes');
    } finally {
      setLoading(false);
    }
  }, [menuId, onTotalChange]);

  useEffect(() => {
    cargarIngredientes();
  }, [cargarIngredientes]);

  // Agregar ingrediente
  const handleAgregar = async (data: IngredienteFormData) => {
    try {
      setSaving(true);
      await ActividadesExteriorService.agregarIngredienteMenu(menuId, {
        nombre: data.nombre,
        unidad: data.unidad,
        cantidad: data.cantidad,
        precio_unitario: data.precio_unitario,
        descripcion: data.descripcion,
        proveedor: data.proveedor,
        es_opcional: data.es_opcional,
        notas: data.notas,
      });
      toast.success('Ingrediente agregado');
      form.reset();
      setShowAddDialog(false);
      cargarIngredientes();
    } catch (error: any) {
      toast.error(error.message || 'Error al agregar');
    } finally {
      setSaving(false);
    }
  };

  // Iniciar edición inline
  const handleStartEdit = (ingrediente: IngredienteMenu) => {
    setEditingId(ingrediente.id);
    setEditingData({
      nombre: ingrediente.nombre,
      unidad: ingrediente.unidad,
      cantidad: ingrediente.cantidad,
      precio_unitario: ingrediente.precio_unitario,
    });
  };

  // Guardar edición
  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      setSaving(true);
      await ActividadesExteriorService.actualizarIngredienteMenu(editingId, editingData);
      toast.success('Ingrediente actualizado');
      setEditingId(null);
      setEditingData({});
      cargarIngredientes();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  // Cambiar estado de compra
  const handleCambiarEstado = async (ingrediente: IngredienteMenu, nuevoEstado: string) => {
    // Si cambia a COMPRADO, abrir modal de registro de compra
    if (nuevoEstado === 'COMPRADO') {
      setIngredienteParaCompra(ingrediente);
      setShowCompraDialog(true);
      return;
    }
    
    // Para otros estados, actualizar directamente
    try {
      await ActividadesExteriorService.actualizarIngredienteMenu(ingrediente.id, {
        estado_compra: nuevoEstado as any,
      });
      toast.success('Estado actualizado');
      cargarIngredientes();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar');
    }
  };
  
  // Callback cuando se registra una compra exitosamente
  const handleCompraSuccess = () => {
    cargarIngredientes();
    setIngredienteParaCompra(null);
  };

  // Eliminar ingrediente
  const handleEliminar = async (ingredienteId: string) => {
    if (!confirm('¿Eliminar este ingrediente?')) return;
    try {
      await ActividadesExteriorService.eliminarIngredienteMenu(ingredienteId);
      toast.success('Ingrediente eliminado');
      cargarIngredientes();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  // Calcular totales
  const totalPresupuestado = ingredientes.reduce((sum, i) => sum + (i.subtotal || 0), 0);
  const totalReal = ingredientes.reduce((sum, i) => sum + (i.subtotal_real || 0), 0);
  const totalDiferencia = ingredientes.reduce((sum, i) => sum + (i.diferencia || 0), 0);
  const totalPendientes = ingredientes.filter(i => i.estado_compra === 'PENDIENTE').length;
  const totalComprados = ingredientes.filter(i => i.estado_compra === 'COMPRADO' || i.estado_compra === 'RECIBIDO').length;

  const formatMonto = (monto: number) => `S/ ${monto.toFixed(2)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con métricas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-medium flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-500" />
            Ingredientes: {menuNombre}
          </h4>
          <p className="text-sm text-muted-foreground">
            {ingredientes.length} ingredientes • {formatMonto(totalPresupuestado)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Badges de estado */}
          {totalPendientes > 0 && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
              ⏳ {totalPendientes} pendientes
            </Badge>
          )}
          {totalComprados > 0 && (
            <Badge variant="outline" className="text-green-600 border-green-300">
              ✅ {totalComprados} comprados
            </Badge>
          )}
          
          {!readonly && (
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          )}
        </div>
      </div>

      {/* Tabla de ingredientes */}
      {ingredientes.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay ingredientes registrados
          </p>
          {!readonly && (
            <Button variant="link" size="sm" onClick={() => setShowAddDialog(true)}>
              Agregar primer ingrediente
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[25%]">Ingrediente</TableHead>
                <TableHead className="w-[10%] text-center">Unidad</TableHead>
                <TableHead className="w-[10%] text-right">Cantidad</TableHead>
                <TableHead className="w-[12%] text-right">P. Unit.</TableHead>
                <TableHead className="w-[12%] text-right">Subtotal</TableHead>
                <TableHead className="w-[12%] text-right">P. Real</TableHead>
                <TableHead className="w-[10%] text-center">Estado</TableHead>
                {!readonly && <TableHead className="w-[80px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredientes.map((ingrediente) => (
                <TableRow 
                  key={ingrediente.id}
                  className={ingrediente.es_opcional ? 'opacity-70' : ''}
                >
                  <TableCell>
                    {editingId === ingrediente.id ? (
                      <Input
                        value={editingData.nombre || ''}
                        onChange={(e) => setEditingData({ ...editingData, nombre: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <div>
                        <span className={ingrediente.es_opcional ? 'italic' : ''}>
                          {ingrediente.nombre}
                        </span>
                        {ingrediente.es_opcional && (
                          <Badge variant="secondary" className="ml-2 text-xs">Opcional</Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {editingId === ingrediente.id ? (
                      <Select
                        value={editingData.unidad || 'unidad'}
                        onValueChange={(v) => setEditingData({ ...editingData, unidad: v })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIDADES_MEDIDA.map((u) => (
                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground">
                        {UNIDADES_MEDIDA.find(u => u.value === ingrediente.unidad)?.label || ingrediente.unidad}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === ingrediente.id ? (
                      <Input
                        type="number"
                        step="0.001"
                        value={editingData.cantidad || 0}
                        onChange={(e) => setEditingData({ ...editingData, cantidad: parseFloat(e.target.value) || 0 })}
                        className="h-8 w-20 text-right"
                      />
                    ) : (
                      ingrediente.cantidad
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === ingrediente.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editingData.precio_unitario || 0}
                        onChange={(e) => setEditingData({ ...editingData, precio_unitario: parseFloat(e.target.value) || 0 })}
                        className="h-8 w-24 text-right"
                      />
                    ) : (
                      formatMonto(ingrediente.precio_unitario)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMonto(
                      editingId === ingrediente.id
                        ? (editingData.cantidad || 0) * (editingData.precio_unitario || 0)
                        : ingrediente.subtotal
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {ingrediente.subtotal_real ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-end">
                              <span className="font-medium">
                                {formatMonto(ingrediente.subtotal_real)}
                              </span>
                              {ingrediente.diferencia !== 0 && ingrediente.diferencia !== undefined && (
                                <span className={`text-xs flex items-center gap-0.5 ${
                                  ingrediente.diferencia > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {ingrediente.diferencia > 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3" />
                                  )}
                                  {ingrediente.diferencia > 0 ? '+' : ''}{ingrediente.diferencia.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Comprado: {ingrediente.cantidad_comprada} {ingrediente.unidad}</p>
                            <p>@ {formatMonto(ingrediente.precio_unitario_real || 0)} c/u</p>
                            {ingrediente.lugar_compra && <p>📍 {ingrediente.lugar_compra}</p>}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {readonly ? (
                      <Badge 
                        variant="outline"
                        className={`text-${ESTADOS_COMPRA_INGREDIENTE.find(e => e.value === ingrediente.estado_compra)?.color}-600`}
                      >
                        {ESTADOS_COMPRA_INGREDIENTE.find(e => e.value === ingrediente.estado_compra)?.emoji}{' '}
                        {ESTADOS_COMPRA_INGREDIENTE.find(e => e.value === ingrediente.estado_compra)?.label}
                      </Badge>
                    ) : (
                      <Select
                        value={ingrediente.estado_compra}
                        onValueChange={(v) => handleCambiarEstado(ingrediente, v)}
                      >
                        <SelectTrigger className="h-8 w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_COMPRA_INGREDIENTE.map((estado) => (
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
                      <div className="flex items-center gap-1">
                        {editingId === ingrediente.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600"
                              onClick={handleSaveEdit}
                              disabled={saving}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleStartEdit(ingrediente)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleEliminar(ingrediente.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">
                  Total Ingredientes:
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {formatMonto(totalPresupuestado)}
                </TableCell>
                <TableCell className="text-right">
                  {totalReal > 0 && (
                    <div className="flex flex-col items-end">
                      <span className="font-bold">{formatMonto(totalReal)}</span>
                      {totalDiferencia !== 0 && (
                        <span className={`text-xs ${totalDiferencia > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {totalDiferencia > 0 ? '+' : ''}{totalDiferencia.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell colSpan={readonly ? 1 : 2}></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

      {/* Dialog para agregar ingrediente */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              Agregar Ingrediente
            </DialogTitle>
            <DialogDescription>
              Para: {menuNombre}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAgregar)} className="space-y-4">
              {/* Nombre */}
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <Label>Ingrediente *</Label>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Arroz, Aceite, Sal..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                            <SelectValue placeholder="Seleccionar..." />
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
                          step="0.001"
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
              <FormField
                control={form.control}
                name="precio_unitario"
                render={({ field }) => (
                  <FormItem>
                    <Label>Precio Unitario (S/)</Label>
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

              {/* Subtotal calculado */}
              <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal:</span>
                <span className="font-bold text-lg">
                  {formatMonto((form.watch('cantidad') || 0) * (form.watch('precio_unitario') || 0))}
                </span>
              </div>

              {/* Proveedor */}
              <FormField
                control={form.control}
                name="proveedor"
                render={({ field }) => (
                  <FormItem>
                    <Label>Proveedor (opcional)</Label>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Mercado, Metro, Wong..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Es opcional */}
              <FormField
                control={form.control}
                name="es_opcional"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <Label className="font-normal cursor-pointer">
                      Es ingrediente opcional
                    </Label>
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
                      <Textarea
                        {...field}
                        placeholder="Observaciones adicionales..."
                        rows={2}
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
                  onClick={() => {
                    form.reset();
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

      {/* Dialog para registrar compra */}
      <RegistrarCompraItemDialog
        open={showCompraDialog}
        onOpenChange={(open) => {
          setShowCompraDialog(open);
          if (!open) setIngredienteParaCompra(null);
        }}
        item={ingredienteParaCompra ? {
          id: ingredienteParaCompra.id,
          nombre: ingredienteParaCompra.nombre,
          unidad: ingredienteParaCompra.unidad,
          cantidad: ingredienteParaCompra.cantidad,
          precio_unitario: ingredienteParaCompra.precio_unitario,
          subtotal: ingredienteParaCompra.subtotal,
          proveedor: ingredienteParaCompra.proveedor,
        } : null}
        tipoItem="ingrediente"
        actividadId={actividadId}
        onSuccess={handleCompraSuccess}
      />
    </div>
  );
};

export default IngredientesMenu;
