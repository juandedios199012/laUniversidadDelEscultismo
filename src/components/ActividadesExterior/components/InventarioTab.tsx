/**
 * Tab de Inventario para Actividades al Aire Libre
 * Control mínimo de items prestados y propios
 */

import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Edit, Trash2, AlertTriangle, CheckCircle,
  RotateCcw, Search, Save, ArrowRightLeft, User
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { usePermissions } from '@/contexts/PermissionsContext';
import {
  ActividadesExteriorService,
  ItemInventario,
  NuevoItemInventario,
  DashboardInventario,
  CategoriaInventario,
  TipoPropiedadInventario,
  TipoAsignacionInventario,
} from '@/services/actividadesExteriorService';

interface InventarioTabProps {
  actividadId: string;
  onRefresh?: () => void;
}

// Constantes
const CATEGORIAS: { value: CategoriaInventario; label: string; emoji: string }[] = [
  { value: 'GENERAL', label: 'General', emoji: '📦' },
  { value: 'ELECTRICO', label: 'Eléctrico', emoji: '🔌' },
  { value: 'CAMPING', label: 'Camping', emoji: '🏕️' },
  { value: 'COCINA', label: 'Cocina', emoji: '🍳' },
  { value: 'PRIMEROS_AUXILIOS', label: 'Primeros Auxilios', emoji: '🩺' },
  { value: 'HERRAMIENTAS', label: 'Herramientas', emoji: '🔧' },
  { value: 'DECORACION', label: 'Decoración', emoji: '🎨' },
  { value: 'OTRO', label: 'Otro', emoji: '📋' },
];

const TIPOS_PROPIEDAD: { value: TipoPropiedadInventario; label: string; color: string }[] = [
  { value: 'PROPIO', label: 'Propio', color: 'bg-blue-100 text-blue-800' },
  { value: 'PRESTADO', label: 'Prestado', color: 'bg-orange-100 text-orange-800' },
];

const TIPOS_ASIGNACION: { value: TipoAsignacionInventario; label: string }[] = [
  { value: 'SUBCAMPO', label: 'Sub Campo' },
  { value: 'PATRULLA', label: 'Patrulla' },
  { value: 'DIRIGENTE', label: 'Dirigente' },
  { value: 'EQUIPO', label: 'Equipo de Trabajo' },
  { value: 'SIN_ASIGNAR', label: 'Sin Asignar' },
];

const ESTADOS_ITEM = {
  DISPONIBLE: { label: 'Disponible', color: 'bg-green-100 text-green-800', emoji: '✅' },
  EN_USO: { label: 'En Uso', color: 'bg-blue-100 text-blue-800', emoji: '🔄' },
  DAÑADO: { label: 'Dañado', color: 'bg-red-100 text-red-800', emoji: '⚠️' },
  BAJA: { label: 'Baja', color: 'bg-gray-100 text-gray-800', emoji: '🗑️' },
  DEVUELTO: { label: 'Devuelto', color: 'bg-purple-100 text-purple-800', emoji: '↩️' },
};

const CONDICIONES = {
  NUEVO: { label: 'Nuevo', color: 'text-green-600' },
  BUENO: { label: 'Bueno', color: 'text-blue-600' },
  REGULAR: { label: 'Regular', color: 'text-yellow-600' },
  MALO: { label: 'Malo', color: 'text-orange-600' },
  BAJA: { label: 'Baja', color: 'text-red-600' },
};

const InventarioTab: React.FC<InventarioTabProps> = ({
  actividadId,
  onRefresh,
}) => {
  const { puedeCrear, puedeEditar, puedeEliminar, tienePermisoAireLibre } = usePermissions();
  
  const [items, setItems] = useState<ItemInventario[]>([]);
  const [dashboard, setDashboard] = useState<DashboardInventario | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  
  // Dialogs
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showIncidenteDialog, setShowIncidenteDialog] = useState(false);
  const [showEliminarDialog, setShowEliminarDialog] = useState(false);
  const [itemEditar, setItemEditar] = useState<ItemInventario | null>(null);
  const [itemIncidente, setItemIncidente] = useState<ItemInventario | null>(null);
  const [itemEliminar, setItemEliminar] = useState<ItemInventario | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Form state
  const [formData, setFormData] = useState<NuevoItemInventario>({
    nombre: '',
    descripcion: '',
    categoria: 'GENERAL',
    cantidad: 1,
    tipo_propiedad: 'PROPIO',
    prestado_por: '',
    contacto_prestador: '',
    asignado_a: '',
    tipo_asignacion: 'SIN_ASIGNAR',
    observaciones: '',
    grupo: '',
    prefijo_codigo: '',
  });
  const [crearItemsIndividuales, setCrearItemsIndividuales] = useState(false);

  // Transfer state
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [itemTransferir, setItemTransferir] = useState<ItemInventario | null>(null);
  const [nuevoTenedor, setNuevoTenedor] = useState('');

  // Incidente state
  const [incidenteTipo, setIncidenteTipo] = useState<'DAÑO' | 'BAJA'>('DAÑO');
  const [incidenteDescripcion, setIncidenteDescripcion] = useState('');

  // Devolución state
  const [showDevolucionDialog, setShowDevolucionDialog] = useState(false);
  const [itemDevolucion, setItemDevolucion] = useState<ItemInventario | null>(null);
  const [devolucionCondicion, setDevolucionCondicion] = useState<string>('BUENO');
  const [devolucionNotas, setDevolucionNotas] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [actividadId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [itemsData, dashboardData] = await Promise.all([
        ActividadesExteriorService.listarInventario(actividadId),
        ActividadesExteriorService.dashboardInventario(actividadId),
      ]);
      setItems(itemsData);
      setDashboard(dashboardData);
    } catch (error) {
      console.error('Error cargando inventario:', error);
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoItem = () => {
    setItemEditar(null);
    setFormData({
      nombre: '',
      descripcion: '',
      categoria: 'GENERAL',
      cantidad: 1,
      tipo_propiedad: 'PROPIO',
      prestado_por: '',
      contacto_prestador: '',
      asignado_a: '',
      tipo_asignacion: 'SIN_ASIGNAR',
      observaciones: '',
      grupo: '',
      prefijo_codigo: '',
    });
    setCrearItemsIndividuales(false);
    setShowFormDialog(true);
  };

  const handleEditarItem = (item: ItemInventario) => {
    setItemEditar(item);
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      categoria: item.categoria,
      cantidad: item.cantidad || 1, // Cargar cantidad real del item
      tipo_propiedad: item.tipo_propiedad,
      prestado_por: item.prestado_por || '',
      contacto_prestador: item.contacto_prestador || '',
      asignado_a: item.asignado_a || '',
      tipo_asignacion: item.tipo_asignacion || 'SIN_ASIGNAR',
      observaciones: item.observaciones || '',
      grupo: item.grupo || '',
      prefijo_codigo: '', // No aplica en edición
    });
    setShowFormDialog(true);
  };

  const handleGuardar = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    // Si es PRESTADO, requerir el prestador
    if (formData.tipo_propiedad === 'PRESTADO' && !formData.prestado_por?.trim()) {
      toast.error('Debes indicar quién presta el item');
      return;
    }

    setGuardando(true);
    try {
      if (itemEditar) {
        await ActividadesExteriorService.actualizarItemInventario(itemEditar.id, formData);
        toast.success('Item actualizado');
      } else {
        // Si NO quiere items individuales, crear 1 solo registro con la cantidad
        const cantidadReal = formData.cantidad || 1;
        const dataToSend = {
          ...formData,
          cantidad: crearItemsIndividuales ? cantidadReal : 1,
          // Solo usar prefijo si realmente quiere items individuales
          prefijo_codigo: crearItemsIndividuales ? formData.prefijo_codigo : '',
        };
        // Si es consolidado, guardar la cantidad real en el campo cantidad
        if (!crearItemsIndividuales && cantidadReal > 1) {
          dataToSend.cantidad = cantidadReal;
        }
        
        const result = await ActividadesExteriorService.agregarItemInventario(
          actividadId, 
          dataToSend,
          crearItemsIndividuales // Nuevo parámetro: si crear múltiples registros
        );
        
        if (crearItemsIndividuales && result.cantidad_creada && result.cantidad_creada > 1) {
          toast.success(`${result.cantidad_creada} items individuales creados`);
        } else {
          toast.success(`Item agregado (cantidad: ${formData.cantidad})`);
        }
      }
      setShowFormDialog(false);
      cargarDatos();
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleIncidente = (item: ItemInventario) => {
    setItemIncidente(item);
    setIncidenteTipo('DAÑO');
    setIncidenteDescripcion('');
    setShowIncidenteDialog(true);
  };

  const handleGuardarIncidente = async () => {
    if (!incidenteDescripcion.trim()) {
      toast.error('La descripción es requerida');
      return;
    }

    setGuardando(true);
    try {
      await ActividadesExteriorService.registrarIncidenteInventario(
        itemIncidente!.id,
        incidenteTipo,
        incidenteDescripcion
      );
      toast.success(incidenteTipo === 'DAÑO' ? 'Daño registrado' : 'Item dado de baja');
      setShowIncidenteDialog(false);
      cargarDatos();
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar');
    } finally {
      setGuardando(false);
    }
  };

  const handleDevolver = (item: ItemInventario) => {
    setItemDevolucion(item);
    setDevolucionCondicion(item.condicion || 'BUENO');
    setDevolucionNotas('');
    setShowDevolucionDialog(true);
  };

  const handleConfirmarDevolucion = async () => {
    if (!itemDevolucion) return;
    
    setGuardando(true);
    try {
      // Usamos la nueva API que acepta notas y condición directamente
      await ActividadesExteriorService.marcarDevueltoInventario(
        itemDevolucion.id,
        undefined, // fecha (usa hoy por defecto)
        devolucionNotas || undefined,
        devolucionCondicion
      );
      toast.success(`"${itemDevolucion.codigo_item || itemDevolucion.nombre}" devuelto a ${itemDevolucion.prestado_por}`);
      setShowDevolucionDialog(false);
      setItemDevolucion(null);
      cargarDatos();
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar devolución');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!itemEliminar) return;
    
    try {
      await ActividadesExteriorService.eliminarItemInventario(itemEliminar.id);
      toast.success('Item eliminado');
      setShowEliminarDialog(false);
      setItemEliminar(null);
      cargarDatos();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  // Transferir item a otra persona
  const handleTransferir = (item: ItemInventario) => {
    setItemTransferir(item);
    setNuevoTenedor('');
    setShowTransferDialog(true);
  };

  const handleConfirmarTransferencia = async () => {
    if (!itemTransferir || !nuevoTenedor.trim()) {
      toast.error('Indica a quién transferir');
      return;
    }
    
    setGuardando(true);
    try {
      const result = await ActividadesExteriorService.transferirItemInventario(
        itemTransferir.id,
        nuevoTenedor.trim()
      );
      toast.success(
        `"${itemTransferir.nombre}" transferido: ${result.tenedor_anterior || itemTransferir.prestado_por || 'Inventario'} → ${result.tenedor_nuevo}`
      );
      setShowTransferDialog(false);
      setItemTransferir(null);
      cargarDatos();
    } catch (error: any) {
      toast.error(error.message || 'Error al transferir');
    } finally {
      setGuardando(false);
    }
  };

  // Filtrar items
  const itemsFiltrados = items.filter(item => {
    if (filtroCategoria !== 'todos' && item.categoria !== filtroCategoria) return false;
    if (filtroTipo !== 'todos' && item.tipo_propiedad !== filtroTipo) return false;
    if (filtroEstado !== 'todos' && item.estado !== filtroEstado) return false;
    if (busqueda && !item.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const getCategoriaInfo = (cat: string) => CATEGORIAS.find(c => c.value === cat) || CATEGORIAS[0];
  const getEstadoInfo = (estado: string) => ESTADOS_ITEM[estado as keyof typeof ESTADOS_ITEM] || ESTADOS_ITEM.DISPONIBLE;
  const getCondicionInfo = (cond: string) => CONDICIONES[cond as keyof typeof CONDICIONES] || CONDICIONES.BUENO;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dashboard.total_items}</p>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dashboard.pendientes_devolucion}</p>
                  <p className="text-sm text-muted-foreground">Por Devolver</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dashboard.prestados}</p>
                  <p className="text-sm text-muted-foreground">Prestados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dashboard.dañados}</p>
                  <p className="text-sm text-muted-foreground">Dañados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros y Acciones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventario
            </CardTitle>
            <CardDescription>{itemsFiltrados.length} items</CardDescription>
          </div>
          {puedeCrear('actividades_exterior') && (
            <Button onClick={handleNuevoItem}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Item
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Barra de filtros */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar item..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {CATEGORIAS.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {TIPOS_PROPIEDAD.map(tipo => (
                  <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {Object.entries(ESTADOS_ITEM).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.emoji} {val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Items */}
          {itemsFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin items en inventario</h3>
              <p className="text-muted-foreground mb-4">
                Agrega equipos, materiales prestados o propios
              </p>
              {puedeCrear('actividades_exterior') && (
                <Button onClick={handleNuevoItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Item
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Código</th>
                    <th className="text-left py-3 px-2 font-medium">Item</th>
                    <th className="text-center py-3 px-2 font-medium">Tipo</th>
                    <th className="text-left py-3 px-2 font-medium">Dueño/Asignado</th>
                    <th className="text-center py-3 px-2 font-medium">Estado</th>
                    <th className="py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {itemsFiltrados.map(item => {
                    const catInfo = getCategoriaInfo(item.categoria);
                    const estadoInfo = getEstadoInfo(item.estado);
                    const condInfo = getCondicionInfo(item.condicion);
                    
                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">
                          {item.codigo_item ? (
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                              {item.codigo_item}
                            </code>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {catInfo.emoji} {item.nombre}
                            </p>
                            {item.descripcion && (
                              <p className="text-xs text-muted-foreground">{item.descripcion}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge className={TIPOS_PROPIEDAD.find(t => t.value === item.tipo_propiedad)?.color}>
                            {item.tipo_propiedad}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <div className="text-sm space-y-1">
                            {/* Dueño original (si es prestado) */}
                            {item.tipo_propiedad === 'PRESTADO' && item.prestado_por && (
                              <div className="flex items-center gap-1 text-orange-700">
                                <span className="font-medium">🏠 {item.prestado_por}</span>
                                {item.contacto_prestador && (
                                  <span className="text-xs text-muted-foreground">({item.contacto_prestador})</span>
                                )}
                              </div>
                            )}
                            {/* Quién lo tiene actualmente */}
                            {item.tenedor_actual && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <User className="h-3 w-3" />
                                <span>Tiene: {item.tenedor_actual}</span>
                              </div>
                            )}
                            {/* Cadena de transferencias */}
                            {item.historial_tenedores && item.historial_tenedores.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                ({item.historial_tenedores.length} transferencias)
                              </div>
                            )}
                            {/* Asignado a (si no tiene tenedor) */}
                            {!item.tenedor_actual && item.asignado_a && (
                              <div className="text-muted-foreground">
                                → {item.asignado_a}
                              </div>
                            )}
                            {!item.prestado_por && !item.asignado_a && !item.tenedor_actual && (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge className={estadoInfo.color}>
                              {estadoInfo.emoji} {estadoInfo.label}
                            </Badge>
                            <span className={`text-xs ${condInfo.color}`}>
                              {condInfo.label}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1">
                            {/* Devolver (solo para prestados no devueltos) */}
                            {item.tipo_propiedad === 'PRESTADO' && !item.devuelto && tienePermisoAireLibre('devolver_inventario') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-purple-600"
                                onClick={() => handleDevolver(item)}
                                title="Marcar como devuelto"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Transferir (pasar a otra persona) */}
                            {!item.devuelto && item.estado !== 'BAJA' && tienePermisoAireLibre('transferir_inventario') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-600"
                                onClick={() => handleTransferir(item)}
                                title="Transferir a otra persona"
                              >
                                <ArrowRightLeft className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Registrar incidente */}
                            {item.estado !== 'BAJA' && item.estado !== 'DEVUELTO' && tienePermisoAireLibre('registrar_incidentes') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-orange-600"
                                onClick={() => handleIncidente(item)}
                                title="Registrar daño o baja"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Editar */}
                            {puedeEditar('actividades_exterior') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditarItem(item)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Eliminar */}
                            {puedeEliminar('actividades_exterior') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => {
                                  setItemEliminar(item);
                                  setShowEliminarDialog(true);
                                }}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Formulario */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {itemEditar ? 'Editar Item' : 'Nuevo Item de Inventario'}
            </DialogTitle>
            <DialogDescription>
              Registra equipos, materiales prestados o propios
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Toldo 4x4m"
              />
            </div>

            {/* Categoría y Cantidad */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(v) => setFormData({ ...formData, categoria: v as CategoriaInventario })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.emoji} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidad">
                  Cantidad
                  {itemEditar && <span className="text-xs text-muted-foreground ml-1">(unidades)</span>}
                </Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="1"
                  max="500"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            {/* Checkbox para items individuales (solo creación y cantidad > 1) */}
            {!itemEditar && (formData.cantidad || 1) > 1 && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="crearIndividuales"
                    checked={crearItemsIndividuales}
                    onCheckedChange={(checked) => setCrearItemsIndividuales(!!checked)}
                  />
                  <div className="space-y-1">
                    <label 
                      htmlFor="crearIndividuales" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      Crear {formData.cantidad} registros individuales
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {crearItemsIndividuales 
                        ? `Se crearán ${formData.cantidad} registros separados. Útil para tracking individual (cada item tiene su dueño y devolución).`
                        : `Se creará 1 solo registro con cantidad=${formData.cantidad}. Más simple para items iguales.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Prefijo de código (solo si quiere items individuales) */}
            {!itemEditar && crearItemsIndividuales && (formData.cantidad || 1) > 1 && (
              <div className="space-y-2">
                <Label htmlFor="prefijo_codigo">
                  Prefijo para códigos 
                  <span className="text-xs text-muted-foreground ml-1">(Ej: EXT → EXT-001, EXT-002...)</span>
                </Label>
                <Input
                  id="prefijo_codigo"
                  value={formData.prefijo_codigo || ''}
                  onChange={(e) => setFormData({ ...formData, prefijo_codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) })}
                  placeholder="EXT, CARPA, OLLA, etc."
                  maxLength={6}
                />
                {formData.prefijo_codigo && (
                  <p className="text-xs text-muted-foreground">
                    Se crearán: {formData.prefijo_codigo}-001, {formData.prefijo_codigo}-002... hasta {formData.prefijo_codigo}-{String(formData.cantidad || 1).padStart(3, '0')}
                  </p>
                )}
              </div>
            )}

            {/* Tipo de propiedad */}
            <div className="space-y-2">
              <Label>Tipo de Propiedad</Label>
              <Select
                value={formData.tipo_propiedad}
                onValueChange={(v) => setFormData({ ...formData, tipo_propiedad: v as TipoPropiedadInventario })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PROPIEDAD.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prestado por (condicional) */}
            {formData.tipo_propiedad === 'PRESTADO' && (
              <div className="space-y-4 p-3 border rounded-lg bg-orange-50/50">
                <div className="flex items-center gap-2 text-sm text-orange-700 font-medium">
                  <RotateCcw className="h-4 w-4" />
                  Información del Préstamo
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prestado_por">Dueño del item *</Label>
                    <Input
                      id="prestado_por"
                      value={formData.prestado_por}
                      onChange={(e) => setFormData({ ...formData, prestado_por: e.target.value })}
                      placeholder="Nombre de quien presta"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contacto_prestador">Teléfono/Contacto</Label>
                    <Input
                      id="contacto_prestador"
                      value={formData.contacto_prestador || ''}
                      onChange={(e) => setFormData({ ...formData, contacto_prestador: e.target.value })}
                      placeholder="987654321"
                    />
                  </div>
                </div>
                <p className="text-xs text-orange-600">
                  💡 Cada item prestado debe devolverse individualmente a su dueño
                </p>
              </div>
            )}

            {/* Asignación */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Asignación</Label>
                <Select
                  value={formData.tipo_asignacion}
                  onValueChange={(v) => setFormData({ ...formData, tipo_asignacion: v as TipoAsignacionInventario })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_ASIGNACION.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asignado_a">Asignado a</Label>
                <Input
                  id="asignado_a"
                  value={formData.asignado_a}
                  onChange={(e) => setFormData({ ...formData, asignado_a: e.target.value })}
                  placeholder="Ej: Patrulla Águilas"
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Detalles adicionales..."
                rows={2}
              />
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas internas..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={guardando}>
              {guardando ? 'Guardando...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {itemEditar ? 'Guardar Cambios' : 'Agregar Item'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Incidente */}
      <Dialog open={showIncidenteDialog} onOpenChange={setShowIncidenteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Registrar Incidente
            </DialogTitle>
            <DialogDescription>
              {itemIncidente?.nombre}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Incidente</Label>
              <Select
                value={incidenteTipo}
                onValueChange={(v) => setIncidenteTipo(v as 'DAÑO' | 'BAJA')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAÑO">⚠️ Daño (reparable)</SelectItem>
                  <SelectItem value="BAJA">🗑️ Baja (irreparable)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="incidente_desc">Descripción del incidente *</Label>
              <Textarea
                id="incidente_desc"
                value={incidenteDescripcion}
                onChange={(e) => setIncidenteDescripcion(e.target.value)}
                placeholder="Describe qué sucedió..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIncidenteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleGuardarIncidente} 
              disabled={guardando}
              variant={incidenteTipo === 'BAJA' ? 'destructive' : 'default'}
            >
              {guardando ? 'Guardando...' : 'Registrar Incidente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar Eliminar */}
      <AlertDialog open={showEliminarDialog} onOpenChange={setShowEliminarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar item?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{itemEliminar?.nombre}" del inventario. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEliminar} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Devolución */}
      <Dialog open={showDevolucionDialog} onOpenChange={setShowDevolucionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-purple-500" />
              Registrar Devolución
            </DialogTitle>
            <DialogDescription>
              Devolver a {itemDevolucion?.prestado_por}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 text-purple-700 mb-2">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Item a devolver</span>
              </div>
              <div className="text-sm space-y-1 text-purple-600">
                {itemDevolucion?.codigo_item && (
                  <p><strong>Código:</strong> <code className="bg-white px-1 rounded">{itemDevolucion.codigo_item}</code></p>
                )}
                <p><strong>Item:</strong> {itemDevolucion?.nombre}</p>
                <p><strong>Dueño:</strong> {itemDevolucion?.prestado_por} {itemDevolucion?.contacto_prestador && `(${itemDevolucion.contacto_prestador})`}</p>
                <p><strong>Condición actual:</strong> {itemDevolucion?.condicion}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>¿En qué condición se devuelve?</Label>
              <Select
                value={devolucionCondicion}
                onValueChange={setDevolucionCondicion}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NUEVO">✨ Nuevo - Sin uso aparente</SelectItem>
                  <SelectItem value="BUENO">✅ Bueno - Estado normal</SelectItem>
                  <SelectItem value="REGULAR">⚠️ Regular - Con desgaste</SelectItem>
                  <SelectItem value="MALO">❌ Malo - Dañado pero funcional</SelectItem>
                  <SelectItem value="BAJA">🗑️ Baja - No funciona / irreparable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(devolucionCondicion === 'MALO' || devolucionCondicion === 'BAJA') && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-700">
                  ⚠️ Se registrará que el item fue devuelto en mal estado. 
                  {devolucionCondicion === 'BAJA' && ' El item quedará marcado como dado de baja.'}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="devolucion_notas">Notas de devolución (opcional)</Label>
              <Textarea
                id="devolucion_notas"
                value={devolucionNotas}
                onChange={(e) => setDevolucionNotas(e.target.value)}
                placeholder="Observaciones sobre el estado del item..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDevolucionDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmarDevolucion} 
              disabled={guardando}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {guardando ? 'Procesando...' : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Confirmar Devolución
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Transferencia */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-500" />
              Transferir Item
            </DialogTitle>
            <DialogDescription>
              Pasar el item a otra persona (préstamo en cadena)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Package className="h-4 w-4" />
                <span className="font-medium">Item a transferir</span>
              </div>
              <div className="text-sm space-y-1 text-blue-600">
                {itemTransferir?.codigo_item && (
                  <p><strong>Código:</strong> <code className="bg-white px-1 rounded">{itemTransferir.codigo_item}</code></p>
                )}
                <p><strong>Item:</strong> {itemTransferir?.nombre}</p>
                {itemTransferir?.prestado_por && (
                  <p><strong>Dueño original:</strong> {itemTransferir.prestado_por}</p>
                )}
                <p><strong>Tiene actualmente:</strong> {itemTransferir?.tenedor_actual || itemTransferir?.asignado_a || itemTransferir?.prestado_por || 'Sin asignar'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nuevo_tenedor">
                <User className="inline h-4 w-4 mr-1" />
                ¿A quién se lo pasas? *
              </Label>
              <Input
                id="nuevo_tenedor"
                value={nuevoTenedor}
                onChange={(e) => setNuevoTenedor(e.target.value)}
                placeholder="Nombre de quien recibirá el item..."
              />
              <p className="text-xs text-muted-foreground">
                El dueño original sigue siendo {itemTransferir?.prestado_por || 'el grupo'}. 
                Esta transferencia queda registrada en el historial.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmarTransferencia} 
              disabled={guardando || !nuevoTenedor.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {guardando ? 'Procesando...' : (
                <>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Transferir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventarioTab;
