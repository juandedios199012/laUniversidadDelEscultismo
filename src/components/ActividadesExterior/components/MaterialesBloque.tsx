/**
 * Componente: Materiales del Bloque de Programa
 * Gestiona los materiales necesarios para cada actividad del programa
 * Stack: React Hook Form + Zod + Shadcn/ui
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Trash2,
  Wrench,
  Package,
  Check,
  X,
  Loader2,
  Edit2,
  Archive,
  ShoppingBag,
  Gift,
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ActividadesExteriorService,
  MaterialBloque,
  UNIDADES_MEDIDA,
  CATEGORIAS_MATERIAL,
  ESTADOS_MATERIAL,
  FUENTES_MATERIAL,
  CategoriaMaterial,
  FuenteMaterial,
  EstadoMaterial,
} from '@/services/actividadesExteriorService';

// Schema de validación
const materialSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  categoria: z.string().min(1, 'Selecciona una categoría'),
  unidad: z.string().min(1, 'Selecciona una unidad'),
  cantidad: z.number().min(0.01, 'Cantidad mínima 0.01'),
  precio_unitario: z.number().min(0, 'Precio mínimo 0'),
  fuente: z.string(),
  descripcion: z.string().optional(),
  proveedor: z.string().optional(),
  es_consumible: z.boolean(),
  notas: z.string().optional(),
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface MaterialesBloqueProps {
  bloqueId: string;
  bloqueNombre: string;
  readonly?: boolean;
  onTotalChange?: (total: number) => void;
}

const MaterialesBloque: React.FC<MaterialesBloqueProps> = ({
  bloqueId,
  bloqueNombre,
  readonly = false,
  onTotalChange,
}) => {
  const [materiales, setMateriales] = useState<MaterialBloque[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<MaterialFormData>>({});

  // Form para agregar material
  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      nombre: '',
      categoria: 'MATERIAL',
      unidad: 'unidad',
      cantidad: 1,
      precio_unitario: 0,
      fuente: 'COMPRA',
      descripcion: '',
      proveedor: '',
      es_consumible: true,
      notas: '',
    },
    mode: 'onBlur',
  });

  // Cargar materiales
  const cargarMateriales = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ActividadesExteriorService.listarMaterialesBloque(bloqueId);
      setMateriales(data);
      
      const total = data.reduce((sum, m) => sum + (m.subtotal || 0), 0);
      onTotalChange?.(total);
    } catch (error) {
      console.error('Error cargando materiales:', error);
      toast.error('Error al cargar materiales');
    } finally {
      setLoading(false);
    }
  }, [bloqueId, onTotalChange]);

  useEffect(() => {
    cargarMateriales();
  }, [cargarMateriales]);

  // Agregar material
  const handleAgregar = async (data: MaterialFormData) => {
    try {
      setSaving(true);
      await ActividadesExteriorService.agregarMaterialBloque(bloqueId, {
        nombre: data.nombre,
        categoria: data.categoria as any,
        unidad: data.unidad,
        cantidad: data.cantidad,
        precio_unitario: data.precio_unitario,
        fuente: data.fuente as any,
        descripcion: data.descripcion,
        proveedor: data.proveedor,
        es_consumible: data.es_consumible,
        notas: data.notas,
      });
      toast.success('Material agregado');
      form.reset();
      setShowAddDialog(false);
      cargarMateriales();
    } catch (error: any) {
      toast.error(error.message || 'Error al agregar');
    } finally {
      setSaving(false);
    }
  };

  // Edición inline
  const handleStartEdit = (material: MaterialBloque) => {
    setEditingId(material.id);
    setEditingData({
      nombre: material.nombre,
      unidad: material.unidad,
      cantidad: material.cantidad,
      precio_unitario: material.precio_unitario,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      setSaving(true);
      await ActividadesExteriorService.actualizarMaterialBloque(editingId, {
        nombre: editingData.nombre,
        categoria: editingData.categoria as CategoriaMaterial,
        unidad: editingData.unidad,
        cantidad: editingData.cantidad,
        precio_unitario: editingData.precio_unitario,
        fuente: editingData.fuente as FuenteMaterial,
        descripcion: editingData.descripcion,
        proveedor: editingData.proveedor,
        es_consumible: editingData.es_consumible,
        notas: editingData.notas,
      });
      toast.success('Material actualizado');
      setEditingId(null);
      setEditingData({});
      cargarMateriales();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  // Cambiar estado
  const handleCambiarEstado = async (materialId: string, nuevoEstado: string) => {
    try {
      await ActividadesExteriorService.actualizarMaterialBloque(materialId, {
        estado: nuevoEstado as EstadoMaterial,
      });
      toast.success('Estado actualizado');
      cargarMateriales();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar');
    }
  };

  // Eliminar
  const handleEliminar = async (materialId: string) => {
    if (!confirm('¿Eliminar este material?')) return;
    try {
      await ActividadesExteriorService.eliminarMaterialBloque(materialId);
      toast.success('Material eliminado');
      cargarMateriales();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  // Calcular totales
  const totalPresupuestado = materiales.reduce((sum, m) => sum + (m.subtotal || 0), 0);

  const formatMonto = (monto: number) => `S/ ${monto.toFixed(2)}`;

  // Icono de fuente
  const getFuenteIcon = (fuente: string) => {
    switch (fuente) {
      case 'INVENTARIO': return <Archive className="h-3.5 w-3.5" />;
      case 'PRESTAMO': return <Package className="h-3.5 w-3.5" />;
      case 'DONACION': return <Gift className="h-3.5 w-3.5" />;
      default: return <ShoppingBag className="h-3.5 w-3.5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-medium flex items-center gap-2">
            <Wrench className="h-4 w-4 text-blue-500" />
            Materiales: {bloqueNombre}
          </h4>
          <p className="text-sm text-muted-foreground">
            {materiales.length} materiales • {formatMonto(totalPresupuestado)}
          </p>
        </div>

        {!readonly && (
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar Material
          </Button>
        )}
      </div>

      {/* Lista de materiales */}
      {materiales.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <Wrench className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay materiales registrados para este bloque
          </p>
          {!readonly && (
            <Button variant="link" size="sm" onClick={() => setShowAddDialog(true)}>
              Agregar primer material
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[25%]">Material</TableHead>
                <TableHead className="w-[12%] text-center">Categoría</TableHead>
                <TableHead className="w-[10%] text-center">Fuente</TableHead>
                <TableHead className="w-[12%] text-right">Cantidad</TableHead>
                <TableHead className="w-[13%] text-right">P. Unit.</TableHead>
                <TableHead className="w-[13%] text-right">Subtotal</TableHead>
                <TableHead className="w-[10%] text-center">Estado</TableHead>
                {!readonly && <TableHead className="w-[80px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {materiales.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    {editingId === material.id ? (
                      <Input
                        value={editingData.nombre || ''}
                        onChange={(e) => setEditingData({ ...editingData, nombre: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <div>
                        <span>{material.nombre}</span>
                        {!material.es_consumible && (
                          <Badge variant="secondary" className="ml-2 text-xs">Reutilizable</Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {CATEGORIAS_MATERIAL.find(c => c.value === material.categoria)?.emoji}{' '}
                      {CATEGORIAS_MATERIAL.find(c => c.value === material.categoria)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      {getFuenteIcon(material.fuente)}
                      <span>{FUENTES_MATERIAL.find(f => f.value === material.fuente)?.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === material.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editingData.cantidad || 0}
                        onChange={(e) => setEditingData({ ...editingData, cantidad: parseFloat(e.target.value) || 0 })}
                        className="h-8 w-20 text-right"
                      />
                    ) : (
                      <span>
                        {material.cantidad} {UNIDADES_MEDIDA.find(u => u.value === material.unidad)?.label || material.unidad}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === material.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editingData.precio_unitario || 0}
                        onChange={(e) => setEditingData({ ...editingData, precio_unitario: parseFloat(e.target.value) || 0 })}
                        className="h-8 w-24 text-right"
                      />
                    ) : (
                      formatMonto(material.precio_unitario)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMonto(
                      editingId === material.id
                        ? (editingData.cantidad || 0) * (editingData.precio_unitario || 0)
                        : material.subtotal
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {readonly ? (
                      <Badge 
                        variant="outline"
                        className={`text-${ESTADOS_MATERIAL.find(e => e.value === material.estado)?.color}-600`}
                      >
                        {ESTADOS_MATERIAL.find(e => e.value === material.estado)?.label}
                      </Badge>
                    ) : (
                      <Select
                        value={material.estado}
                        onValueChange={(v) => handleCambiarEstado(material.id, v)}
                      >
                        <SelectTrigger className="h-8 w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_MATERIAL.map((estado) => (
                            <SelectItem key={estado.value} value={estado.value}>
                              {estado.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  {!readonly && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {editingId === material.id ? (
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
                              className="h-7 w-7"
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
                              onClick={() => handleStartEdit(material)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleEliminar(material.id)}
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
                <TableCell colSpan={5} className="text-right font-medium">
                  Total Materiales:
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {formatMonto(totalPresupuestado)}
                </TableCell>
                <TableCell colSpan={readonly ? 1 : 2}></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

      {/* Dialog agregar material */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-500" />
              Agregar Material
            </DialogTitle>
            <DialogDescription>
              Para el bloque: {bloqueNombre}
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
                    <Label>Material *</Label>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Cuerda, Cartulina, Marcadores..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Categoría y Fuente */}
              <div className="grid grid-cols-2 gap-4">
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
                          {CATEGORIAS_MATERIAL.map((c) => (
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

                <FormField
                  control={form.control}
                  name="fuente"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Fuente</Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FUENTES_MATERIAL.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.emoji} {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

              {/* Precio (solo si fuente es COMPRA) */}
              {form.watch('fuente') === 'COMPRA' && (
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
              )}

              {/* Subtotal calculado */}
              {form.watch('fuente') === 'COMPRA' && (
                <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal:</span>
                  <span className="font-bold text-lg">
                    {formatMonto((form.watch('cantidad') || 0) * (form.watch('precio_unitario') || 0))}
                  </span>
                </div>
              )}

              {/* Es consumible */}
              <FormField
                control={form.control}
                name="es_consumible"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <Label className="font-normal cursor-pointer">
                      Es material consumible (se gasta)
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
    </div>
  );
};

export default MaterialesBloque;
