/**
 * Préstamos Tab - Gestión de préstamos y devoluciones
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  User,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  FinanzasService, 
  Prestamo, 
  EstadoPrestamo,
  MetodoPago,
  METODOS_PAGO 
} from '@/services/finanzasService';
import { toast } from 'sonner';

interface PrestamosTabProps {
  onRefresh: () => void;
}

const PrestamosTab: React.FC<PrestamosTabProps> = ({ onRefresh }) => {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<EstadoPrestamo | 'TODOS'>('TODOS');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Dialog de devolución
  const [showDevolucion, setShowDevolucion] = useState(false);
  const [prestamoActivo, setPrestamoActivo] = useState<Prestamo | null>(null);
  const [montoDevolucion, setMontoDevolucion] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [registrandoDevolucion, setRegistrandoDevolucion] = useState(false);

  // Dialog de cancelación
  const [prestamoACancelar, setPrestamoACancelar] = useState<Prestamo | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    cargarPrestamos();
  }, [filtroEstado]);

  const cargarPrestamos = async () => {
    try {
      setLoading(true);
      const data = await FinanzasService.listarPrestamos(
        filtroEstado === 'TODOS' ? undefined : filtroEstado
      );
      setPrestamos(data);
    } catch (error) {
      console.error('Error cargando préstamos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonto = (monto: number): string => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(monto);
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const abrirDevolucion = (prestamo: Prestamo) => {
    setPrestamoActivo(prestamo);
    setMontoDevolucion(prestamo.saldo_pendiente.toString());
    setMetodoPago('EFECTIVO');
    setNumeroOperacion('');
    setShowDevolucion(true);
  };

  const registrarDevolucion = async () => {
    if (!prestamoActivo) return;
    
    try {
      setRegistrandoDevolucion(true);
      await FinanzasService.registrarDevolucion(
        prestamoActivo.id,
        parseFloat(montoDevolucion),
        new Date().toISOString().split('T')[0],
        metodoPago,
        numeroOperacion || undefined
      );
      toast.success('Pago registrado exitosamente');
      setShowDevolucion(false);
      cargarPrestamos();
      onRefresh();
    } catch (error) {
      console.error('Error registrando devolución:', error);
      toast.error('Error al registrar el pago');
    } finally {
      setRegistrandoDevolucion(false);
    }
  };

  const cancelarPrestamo = async () => {
    if (!prestamoACancelar) return;
    
    try {
      setCancelando(true);
      await FinanzasService.cancelarPrestamo(prestamoACancelar.id, motivoCancelacion || undefined);
      toast.success('Préstamo cancelado exitosamente');
      setPrestamoACancelar(null);
      setMotivoCancelacion('');
      cargarPrestamos();
      onRefresh();
    } catch (error) {
      console.error('Error cancelando préstamo:', error);
      toast.error('Error al cancelar el préstamo');
    } finally {
      setCancelando(false);
    }
  };

  const getEstadoBadge = (estado: EstadoPrestamo) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge variant="destructive">Pendiente</Badge>;
      case 'PARCIAL':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Parcial</Badge>;
      case 'PAGADO':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Pagado</Badge>;
      case 'CANCELADO':
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getDiasRestantes = (fechaVencimiento: string | undefined) => {
    if (!fechaVencimiento) return null;
    const vencimiento = new Date(fechaVencimiento);
    const hoy = new Date();
    const dias = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return dias;
  };

  const prestamosPendientes = prestamos.filter(p => p.estado === 'PENDIENTE' || p.estado === 'PARCIAL');
  // const prestamosCompletados = prestamos.filter(p => p.estado === 'PAGADO' || p.estado === 'CANCELADO');

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Adeudado</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatMonto(prestamosPendientes.reduce((sum, p) => sum + p.saldo_pendiente, 0))}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <CreditCard className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Préstamos Activos</p>
                <p className="text-2xl font-bold">{prestamosPendientes.length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Préstamos Pagados</p>
                <p className="text-2xl font-bold text-green-600">
                  {prestamos.filter(p => p.estado === 'PAGADO').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button 
          variant={filtroEstado === 'TODOS' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFiltroEstado('TODOS')}
        >
          Todos ({prestamos.length})
        </Button>
        <Button 
          variant={filtroEstado === 'PENDIENTE' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFiltroEstado('PENDIENTE')}
        >
          Pendientes
        </Button>
        <Button 
          variant={filtroEstado === 'PARCIAL' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFiltroEstado('PARCIAL')}
        >
          Parciales
        </Button>
        <Button 
          variant={filtroEstado === 'PAGADO' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFiltroEstado('PAGADO')}
        >
          Pagados
        </Button>
      </div>

      {/* Lista de préstamos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : prestamos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin Préstamos</h3>
            <p className="text-muted-foreground">
              No hay préstamos registrados {filtroEstado !== 'TODOS' && `con estado "${filtroEstado}"`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prestamos.map((prestamo) => {
            const porcentajePagado = (prestamo.monto_devuelto / prestamo.monto_prestado) * 100;
            const diasRestantes = getDiasRestantes(prestamo.fecha_vencimiento);
            const isExpanded = expandedIds.has(prestamo.id);
            const estaVencido = diasRestantes !== null && diasRestantes < 0;
            const proximoVencer = diasRestantes !== null && diasRestantes <= 7 && diasRestantes >= 0;
            
            return (
              <Collapsible 
                key={prestamo.id} 
                open={isExpanded} 
                onOpenChange={() => toggleExpanded(prestamo.id)}
              >
                <Card className={`${
                  estaVencido ? 'border-red-300 bg-red-50/50' : 
                  proximoVencer ? 'border-yellow-300 bg-yellow-50/50' : ''
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">
                            {prestamo.prestamista_nombre}
                          </CardTitle>
                          {getEstadoBadge(prestamo.estado)}
                        </div>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {prestamo.prestamista_tipo}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {prestamo.fecha_prestamo}
                          </span>
                        </CardDescription>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Barra de progreso */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          Pagado: {formatMonto(prestamo.monto_devuelto)}
                        </span>
                        <span className="font-medium">
                          {formatMonto(prestamo.monto_prestado)}
                        </span>
                      </div>
                      <Progress value={porcentajePagado} className="h-2" />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {porcentajePagado.toFixed(0)}% completado
                        </span>
                        <span className="text-xs font-medium text-red-600">
                          Pendiente: {formatMonto(prestamo.saldo_pendiente)}
                        </span>
                      </div>
                    </div>

                    {/* Alerta de vencimiento */}
                    {estaVencido && (
                      <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-700">
                          Este préstamo está vencido hace {Math.abs(diasRestantes!)} días
                        </span>
                      </div>
                    )}

                    {proximoVencer && (
                      <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-700">
                          Vence en {diasRestantes} día(s)
                        </span>
                      </div>
                    )}

                    {/* Botón de pago rápido */}
                    {(prestamo.estado === 'PENDIENTE' || prestamo.estado === 'PARCIAL') && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => abrirDevolucion(prestamo)}
                          className="flex-1"
                        >
                          <span className="font-bold mr-1">S/</span>
                          Registrar Pago
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setPrestamoACancelar(prestamo)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Detalles expandidos */}
                    <CollapsibleContent className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Motivo</p>
                          <p className="font-medium">{prestamo.motivo || 'No especificado'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fecha de vencimiento</p>
                          <p className="font-medium">
                            {prestamo.fecha_vencimiento || 'Sin fecha límite'}
                          </p>
                        </div>
                        {prestamo.transaccion_concepto && (
                          <div className="col-span-2">
                            <p className="text-muted-foreground">Concepto de transacción</p>
                            <p className="font-medium">{prestamo.transaccion_concepto}</p>
                          </div>
                        )}
                        {prestamo.fecha_devolucion_completa && (
                          <div>
                            <p className="text-muted-foreground">Fecha de pago completo</p>
                            <p className="font-medium text-green-600">
                              {prestamo.fecha_devolucion_completa}
                            </p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Dialog de devolución */}
      <Dialog open={showDevolucion} onOpenChange={setShowDevolucion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago de Préstamo</DialogTitle>
            <DialogDescription>
              Préstamo de {prestamoActivo?.prestamista_nombre}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Monto total:</span>
                <span className="font-medium">{formatMonto(prestamoActivo?.monto_prestado || 0)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Ya pagado:</span>
                <span className="font-medium text-green-600">
                  {formatMonto(prestamoActivo?.monto_devuelto || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span>Pendiente:</span>
                <span className="text-red-600">
                  {formatMonto(prestamoActivo?.saldo_pendiente || 0)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto">Monto a pagar</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                value={montoDevolucion}
                onChange={(e) => setMontoDevolucion(e.target.value)}
                placeholder="0.00"
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setMontoDevolucion((prestamoActivo?.saldo_pendiente || 0).toString())}
                >
                  Pagar todo
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setMontoDevolucion(((prestamoActivo?.saldo_pendiente || 0) / 2).toFixed(2))}
                >
                  Pagar 50%
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select value={metodoPago} onValueChange={(v) => setMetodoPago(v as MetodoPago)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((metodo) => (
                    <SelectItem key={metodo.value} value={metodo.value}>
                      {metodo.emoji} {metodo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(metodoPago === 'YAPE' || metodoPago === 'PLIN' || metodoPago === 'TRANSFERENCIA') && (
              <div className="space-y-2">
                <Label htmlFor="operacion">Número de operación</Label>
                <Input
                  id="operacion"
                  value={numeroOperacion}
                  onChange={(e) => setNumeroOperacion(e.target.value)}
                  placeholder="Ej: 123456789"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDevolucion(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={registrarDevolucion}
              disabled={registrandoDevolucion || !montoDevolucion || parseFloat(montoDevolucion) <= 0}
            >
              {registrandoDevolucion ? 'Registrando...' : 'Registrar Pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de cancelación de préstamo */}
      <AlertDialog open={!!prestamoACancelar} onOpenChange={() => setPrestamoACancelar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Cancelar Préstamo
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cancelar el préstamo de{' '}
              <strong>{prestamoACancelar?.prestamista_nombre}</strong> por{' '}
              <strong>{formatMonto(prestamoACancelar?.monto_prestado || 0)}</strong>?
              <br /><br />
              Esta acción marcará el préstamo como cancelado (no eliminado).
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Label htmlFor="motivo">Motivo de cancelación (opcional)</Label>
            <Textarea
              id="motivo"
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              placeholder="Ej: Préstamo perdonado, error de registro, etc."
              className="mt-2"
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelando}>Volver</AlertDialogCancel>
            <AlertDialogAction 
              onClick={cancelarPrestamo}
              disabled={cancelando}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelando ? 'Cancelando...' : 'Cancelar Préstamo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PrestamosTab;
