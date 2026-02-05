/**
 * Transacciones Tab - Lista y filtros de transacciones
 */

import React, { useState, useEffect } from 'react';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  MoreVertical,
  Eye,
  Trash2,
  Image,
  AlertCircle,
  Edit2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { 
  FinanzasService, 
  Transaccion, 
  TipoTransaccion,
  CategoriaFinanzas,
  CATEGORIAS_INGRESO,
  CATEGORIAS_EGRESO,
  METODOS_PAGO,
} from '@/services/finanzasService';
import DetalleTransaccionDialog from '../dialogs/DetalleTransaccionDialog';
import { toast } from 'sonner';

interface TransaccionesTabProps {
  onRefresh: () => void;
}

const TransaccionesTab: React.FC<TransaccionesTabProps> = ({ onRefresh }) => {
  // Permisos
  const { puedeEditar, puedeEliminar } = usePermissions();
  
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limite = 20;

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<TipoTransaccion | 'TODOS'>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaFinanzas | 'TODOS'>('TODOS');
  const [busqueda, setBusqueda] = useState('');

  // Estado para eliminar
  const [transaccionAEliminar, setTransaccionAEliminar] = useState<Transaccion | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Estado para ver/editar detalles
  const [transaccionSeleccionada, setTransaccionSeleccionada] = useState<Transaccion | null>(null);
  const [showDetalle, setShowDetalle] = useState(false);

  useEffect(() => {
    cargarTransacciones();
  }, [filtroTipo, filtroCategoria, page]);

  const cargarTransacciones = async () => {
    try {
      setLoading(true);
      const { transacciones: data, total: totalCount } = await FinanzasService.listarTransacciones({
        tipo: filtroTipo === 'TODOS' ? undefined : filtroTipo,
        categoria: filtroCategoria === 'TODOS' ? undefined : filtroCategoria,
        limite,
        offset: page * limite,
      });
      setTransacciones(data);
      setTotal(totalCount);
    } catch (error) {
      console.error('Error cargando transacciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (!transaccionAEliminar) return;
    
    // Verificar permiso
    if (!puedeEliminar('finanzas')) {
      toast.error('No tienes permiso para eliminar transacciones');
      setTransaccionAEliminar(null);
      return;
    }

    try {
      setEliminando(true);
      await FinanzasService.eliminarTransaccion(transaccionAEliminar.id);
      toast.success('Transacción eliminada exitosamente');
      setTransaccionAEliminar(null);
      cargarTransacciones();
      onRefresh(); // Refrescar dashboard
    } catch (error) {
      console.error('Error eliminando transacción:', error);
      toast.error('Error al eliminar la transacción');
    } finally {
      setEliminando(false);
    }
  };

  const formatMonto = (monto: number): string => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(monto);
  };

  const todasCategorias = [...CATEGORIAS_INGRESO, ...CATEGORIAS_EGRESO];
  const categoriasDisponibles = filtroTipo === 'INGRESO' || filtroTipo === 'PRESTAMO_RECIBIDO'
    ? CATEGORIAS_INGRESO
    : filtroTipo === 'EGRESO' || filtroTipo === 'PRESTAMO_DEVUELTO'
    ? CATEGORIAS_EGRESO
    : todasCategorias;

  const transaccionesFiltradas = busqueda
    ? transacciones.filter(t => 
        t.concepto.toLowerCase().includes(busqueda.toLowerCase()) ||
        t.proveedor_beneficiario?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : transacciones;

  const totalPages = Math.ceil(total / limite);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Historial de Transacciones</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por concepto o beneficiario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select 
            value={filtroTipo} 
            onValueChange={(v) => {
              setFiltroTipo(v as TipoTransaccion | 'TODOS');
              setFiltroCategoria('TODOS');
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los tipos</SelectItem>
              <SelectItem value="INGRESO">Ingresos</SelectItem>
              <SelectItem value="EGRESO">Egresos</SelectItem>
              <SelectItem value="PRESTAMO_RECIBIDO">Préstamos Recibidos</SelectItem>
              <SelectItem value="PRESTAMO_DEVUELTO">Devoluciones</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={filtroCategoria} 
            onValueChange={(v) => {
              setFiltroCategoria(v as CategoriaFinanzas | 'TODOS');
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todas las categorías</SelectItem>
              {categoriasDisponibles.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : transaccionesFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron transacciones</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Beneficiario</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaccionesFiltradas.map((trans) => {
                    const esIngreso = trans.tipo === 'INGRESO' || trans.tipo === 'PRESTAMO_RECIBIDO';
                    const categoria = todasCategorias.find(c => c.value === trans.categoria);
                    const metodoPago = METODOS_PAGO.find(m => m.value === trans.metodo_pago);
                    
                    return (
                      <TableRow key={trans.id}>
                        <TableCell className="whitespace-nowrap">
                          {trans.fecha_transaccion}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-full ${
                              esIngreso ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {esIngreso ? (
                                <ArrowUpRight className="h-3 w-3 text-green-600" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{trans.concepto}</p>
                              {trans.descripcion && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {trans.descripcion}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {categoria?.emoji} {categoria?.label || trans.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {trans.proveedor_beneficiario || '-'}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${
                          esIngreso ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {esIngreso ? '+' : '-'}{formatMonto(trans.monto)}
                        </TableCell>
                        <TableCell>
                          {metodoPago && (
                            <span className="text-sm text-muted-foreground">
                              {metodoPago.emoji} {metodoPago.label}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setTransaccionSeleccionada(trans);
                                  setShowDetalle(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                              {puedeEditar('finanzas') && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setTransaccionSeleccionada(trans);
                                    setShowDetalle(true);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {trans.evidencias_count && trans.evidencias_count > 0 && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setTransaccionSeleccionada(trans);
                                    setShowDetalle(true);
                                  }}
                                >
                                  <Image className="h-4 w-4 mr-2" />
                                  Ver evidencias ({trans.evidencias_count})
                                </DropdownMenuItem>
                              )}
                              {puedeEliminar('finanzas') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => setTransaccionAEliminar(trans)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Mostrando {page * limite + 1} - {Math.min((page + 1) * limite, total)} de {total}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Anterior
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={!!transaccionAEliminar} onOpenChange={() => setTransaccionAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirmar eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar la transacción{' '}
              <strong>"{transaccionAEliminar?.concepto}"</strong> por{' '}
              <strong>{transaccionAEliminar ? formatMonto(transaccionAEliminar.monto) : ''}</strong>?
              <br /><br />
              Esta acción no se puede deshacer. También se eliminarán las evidencias y préstamos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEliminar}
              disabled={eliminando}
              className="bg-red-600 hover:bg-red-700"
            >
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de ver/editar transacción */}
      <DetalleTransaccionDialog
        transaccion={transaccionSeleccionada}
        open={showDetalle}
        onOpenChange={(open) => {
          setShowDetalle(open);
          if (!open) setTransaccionSeleccionada(null);
        }}
        onSuccess={() => {
          cargarTransacciones();
          onRefresh();
        }}
      />
    </Card>
  );
};

export default TransaccionesTab;
