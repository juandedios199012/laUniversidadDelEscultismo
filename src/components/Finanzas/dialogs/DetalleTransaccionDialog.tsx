/**
 * Detalle Transacción Dialog - Ver y editar transacciones
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  DollarSign,
  Edit2,
  Save,
  X,
  Image as ImageIcon,
  FileText,
  User,
  CreditCard,
  Tag,
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FinanzasService, 
  Transaccion,
  CategoriaFinanzas,
  MetodoPago,
  CATEGORIAS_INGRESO,
  CATEGORIAS_EGRESO,
  METODOS_PAGO,
} from '@/services/finanzasService';
import { toast } from 'sonner';

interface DetalleTransaccionDialogProps {
  transaccion: Transaccion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface TransaccionCompleta extends Transaccion {
  evidencias?: {
    id: string;
    tipo_evidencia: string;
    nombre_archivo: string;
    url_archivo: string;
    mime_type: string;
  }[];
  prestamo?: {
    id: string;
    monto_prestado: number;
    monto_devuelto: number;
    saldo_pendiente: number;
    estado: string;
    prestamista_nombre: string;
  };
}

const DetalleTransaccionDialog: React.FC<DetalleTransaccionDialogProps> = ({
  transaccion,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [modoEdicion, setModoEdicion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [detalleCompleto, setDetalleCompleto] = useState<TransaccionCompleta | null>(null);
  
  // Campos editables
  const [formData, setFormData] = useState({
    concepto: '',
    descripcion: '',
    categoria: '',
    monto: 0,
    fecha_transaccion: '',
    proveedor_beneficiario: '',
    metodo_pago: '',
    numero_operacion: '',
    notas: '',
  });

  useEffect(() => {
    if (transaccion && open) {
      cargarDetalleCompleto();
    }
  }, [transaccion, open]);

  const cargarDetalleCompleto = async () => {
    if (!transaccion) return;
    
    try {
      setLoading(true);
      const detalle = await FinanzasService.obtenerTransaccion(transaccion.id);
      setDetalleCompleto(detalle);
      
      // Inicializar formulario
      setFormData({
        concepto: detalle.concepto || '',
        descripcion: detalle.descripcion || '',
        categoria: detalle.categoria || '',
        monto: detalle.monto || 0,
        fecha_transaccion: detalle.fecha_transaccion || '',
        proveedor_beneficiario: detalle.proveedor_beneficiario || '',
        metodo_pago: detalle.metodo_pago || 'EFECTIVO',
        numero_operacion: detalle.numero_operacion || '',
        notas: detalle.notas || '',
      });
    } catch (error) {
      console.error('Error cargando detalle:', error);
      toast.error('Error al cargar detalles de la transacción');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    if (!transaccion) return;
    
    try {
      setGuardando(true);
      await FinanzasService.actualizarTransaccion(transaccion.id, {
        concepto: formData.concepto,
        descripcion: formData.descripcion,
        categoria: formData.categoria as CategoriaFinanzas,
        monto: formData.monto,
        fecha_transaccion: formData.fecha_transaccion,
        proveedor_beneficiario: formData.proveedor_beneficiario,
        metodo_pago: formData.metodo_pago as MetodoPago,
        numero_operacion: formData.numero_operacion,
        notas: formData.notas,
      });
      
      toast.success('Transacción actualizada exitosamente');
      setModoEdicion(false);
      onSuccess();
      cargarDetalleCompleto(); // Recargar datos
    } catch (error) {
      console.error('Error actualizando transacción:', error);
      toast.error('Error al actualizar la transacción');
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrar = () => {
    setModoEdicion(false);
    onOpenChange(false);
  };

  const formatMonto = (monto: number): string => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(monto);
  };

  const esIngreso = detalleCompleto?.tipo === 'INGRESO' || detalleCompleto?.tipo === 'PRESTAMO_RECIBIDO';
  const categorias = esIngreso ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
  const categoriaActual = [...CATEGORIAS_INGRESO, ...CATEGORIAS_EGRESO].find(c => c.value === detalleCompleto?.categoria);
  const metodoPagoActual = METODOS_PAGO.find(m => m.value === detalleCompleto?.metodo_pago);

  return (
    <Dialog open={open} onOpenChange={handleCerrar}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {esIngreso ? (
                <div className="p-2 rounded-full bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-red-100">
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
              )}
              {modoEdicion ? 'Editar Transacción' : 'Detalle de Transacción'}
            </DialogTitle>
            {!modoEdicion && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setModoEdicion(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
          <DialogDescription>
            {esIngreso ? 'Ingreso' : 'Egreso'} registrado el {detalleCompleto?.fecha_transaccion}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : detalleCompleto ? (
          <div className="space-y-6">
            {/* Vista normal o edición */}
            {modoEdicion ? (
              // MODO EDICIÓN
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Concepto */}
                <div className="md:col-span-2">
                  <Label>Concepto</Label>
                  <Input
                    value={formData.concepto}
                    onChange={(e) => setFormData({...formData, concepto: e.target.value})}
                    placeholder="Concepto de la transacción"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <Label>Categoría</Label>
                  <Select 
                    value={formData.categoria} 
                    onValueChange={(v) => setFormData({...formData, categoria: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.emoji} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Monto */}
                <div>
                  <Label>Monto (S/)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.monto}
                      onChange={(e) => setFormData({...formData, monto: parseFloat(e.target.value) || 0})}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Fecha */}
                <div>
                  <Label>Fecha</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={formData.fecha_transaccion}
                      onChange={(e) => setFormData({...formData, fecha_transaccion: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Proveedor/Beneficiario */}
                <div>
                  <Label>{esIngreso ? 'Pagado por' : 'Proveedor'}</Label>
                  <Input
                    value={formData.proveedor_beneficiario}
                    onChange={(e) => setFormData({...formData, proveedor_beneficiario: e.target.value})}
                    placeholder={esIngreso ? "Nombre del pagador" : "Nombre del proveedor"}
                  />
                </div>

                {/* Método de pago */}
                <div>
                  <Label>Método de pago</Label>
                  <Select 
                    value={formData.metodo_pago} 
                    onValueChange={(v) => setFormData({...formData, metodo_pago: v})}
                  >
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

                {/* Número de operación */}
                <div>
                  <Label>Número de operación</Label>
                  <Input
                    value={formData.numero_operacion}
                    onChange={(e) => setFormData({...formData, numero_operacion: e.target.value})}
                    placeholder="Ej: 123456789"
                  />
                </div>

                {/* Descripción */}
                <div className="md:col-span-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    placeholder="Detalles adicionales..."
                    rows={2}
                  />
                </div>

                {/* Notas */}
                <div className="md:col-span-2">
                  <Label>Notas internas</Label>
                  <Textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({...formData, notas: e.target.value})}
                    placeholder="Notas adicionales..."
                    rows={2}
                  />
                </div>
              </div>
            ) : (
              // MODO VISTA
              <div className="space-y-6">
                {/* Monto grande */}
                <div className="text-center py-4 bg-muted/30 rounded-lg">
                  <p className={`text-4xl font-bold ${esIngreso ? 'text-green-600' : 'text-red-600'}`}>
                    {esIngreso ? '+' : '-'}{formatMonto(detalleCompleto.monto)}
                  </p>
                  <p className="text-lg font-medium mt-2">{detalleCompleto.concepto}</p>
                  {detalleCompleto.descripcion && (
                    <p className="text-sm text-muted-foreground mt-1">{detalleCompleto.descripcion}</p>
                  )}
                </div>

                {/* Detalles en grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha</p>
                      <p className="font-medium">{detalleCompleto.fecha_transaccion}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Categoría</p>
                      <p className="font-medium">{categoriaActual?.emoji} {categoriaActual?.label}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Método de pago</p>
                      <p className="font-medium">{metodoPagoActual?.emoji} {metodoPagoActual?.label}</p>
                    </div>
                  </div>

                  {detalleCompleto.proveedor_beneficiario && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {esIngreso ? 'Pagado por' : 'Proveedor'}
                        </p>
                        <p className="font-medium">{detalleCompleto.proveedor_beneficiario}</p>
                      </div>
                    </div>
                  )}

                  {detalleCompleto.numero_operacion && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">N° Operación</p>
                        <p className="font-medium">{detalleCompleto.numero_operacion}</p>
                      </div>
                    </div>
                  )}

                  {detalleCompleto.responsable_nombre && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Registrado por</p>
                        <p className="font-medium">{detalleCompleto.responsable_nombre}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Préstamo asociado */}
                {detalleCompleto.prestamo && (
                  <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Banknote className="h-5 w-5 text-yellow-600" />
                      <h4 className="font-semibold text-yellow-800">Préstamo Asociado</h4>
                      <Badge variant={
                        detalleCompleto.prestamo.estado === 'PAGADO' ? 'default' :
                        detalleCompleto.prestamo.estado === 'CANCELADO' ? 'secondary' :
                        'outline'
                      } className="ml-auto">
                        {detalleCompleto.prestamo.estado}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-yellow-700">Prestamista</p>
                        <p className="font-medium">{detalleCompleto.prestamo.prestamista_nombre}</p>
                      </div>
                      <div>
                        <p className="text-yellow-700">Monto Prestado</p>
                        <p className="font-medium">{formatMonto(detalleCompleto.prestamo.monto_prestado)}</p>
                      </div>
                      <div>
                        <p className="text-yellow-700">Devuelto</p>
                        <p className="font-medium">{formatMonto(detalleCompleto.prestamo.monto_devuelto)}</p>
                      </div>
                      <div>
                        <p className="text-yellow-700">Pendiente</p>
                        <p className="font-medium text-red-600">{formatMonto(detalleCompleto.prestamo.saldo_pendiente)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Evidencias */}
                {detalleCompleto.evidencias && detalleCompleto.evidencias.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Evidencias ({detalleCompleto.evidencias.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {detalleCompleto.evidencias.map((ev) => (
                        <a
                          key={ev.id}
                          href={ev.url_archivo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 border rounded-lg hover:bg-muted transition-colors"
                        >
                          {ev.mime_type?.startsWith('image/') ? (
                            <img 
                              src={ev.url_archivo} 
                              alt={ev.nombre_archivo}
                              className="w-full h-20 object-cover rounded mb-2"
                            />
                          ) : (
                            <div className="w-full h-20 bg-muted rounded mb-2 flex items-center justify-center">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <p className="text-xs truncate">{ev.nombre_archivo}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notas */}
                {detalleCompleto.notas && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Notas</p>
                    <p className="text-sm">{detalleCompleto.notas}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          {modoEdicion ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setModoEdicion(false)}
                disabled={guardando}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleGuardar}
                disabled={guardando}
              >
                <Save className="h-4 w-4 mr-2" />
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleCerrar}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DetalleTransaccionDialog;
