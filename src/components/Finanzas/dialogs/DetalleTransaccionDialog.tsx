/**
 * Detalle Transacción Dialog - Ver y editar transacciones
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Edit2,
  Save,
  X,
  Image as ImageIcon,
  FileText,
  User,
  CreditCard,
  Tag,
  Banknote,
  Upload,
  Trash2,
  AlertTriangle
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

// Tipos de prestamista
const TIPOS_PRESTAMISTA = [
  { value: 'DIRIGENTE', label: 'Dirigente', emoji: '👨‍🏫' },
  { value: 'PADRE', label: 'Padre de Familia', emoji: '👨‍👩‍👧' },
  { value: 'SCOUT', label: 'Scout', emoji: '⚜️' },
  { value: 'EXTERNO', label: 'Persona Externa', emoji: '👤' },
];

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
  
  // Estado para nuevas evidencias
  const [nuevasEvidencias, setNuevasEvidencias] = useState<File[]>([]);
  const [evidenciasAEliminar, setEvidenciasAEliminar] = useState<string[]>([]);
  
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
    // Campos de préstamo
    tiene_prestamo: false,
    monto_cubierto: 0,
    prestamista_nombre: '',
    prestamista_tipo: 'DIRIGENTE',
    fecha_vencimiento: '',
  });

  useEffect(() => {
    if (transaccion && open) {
      cargarDetalleCompleto();
      // Reset estados al abrir
      setNuevasEvidencias([]);
      setEvidenciasAEliminar([]);
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
        // Campos de préstamo
        tiene_prestamo: !!detalle.prestamo,
        monto_cubierto: detalle.prestamo ? detalle.monto - detalle.prestamo.monto_prestado : 0,
        prestamista_nombre: detalle.prestamo?.prestamista_nombre || '',
        prestamista_tipo: 'DIRIGENTE',
        fecha_vencimiento: '',
      });
    } catch (error) {
      console.error('Error cargando detalle:', error);
      toast.error('Error al cargar detalles de la transacción');
    } finally {
      setLoading(false);
    }
  };

  // Manejo de evidencias
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNuevasEvidencias(prev => [...prev, ...files]);
  };

  const removeNuevaEvidencia = (index: number) => {
    setNuevasEvidencias(prev => prev.filter((_, i) => i !== index));
  };

  const marcarEvidenciaParaEliminar = (evidenciaId: string) => {
    setEvidenciasAEliminar(prev => [...prev, evidenciaId]);
  };

  const desmarcarEvidenciaParaEliminar = (evidenciaId: string) => {
    setEvidenciasAEliminar(prev => prev.filter(id => id !== evidenciaId));
  };

  // Cálculo del monto del préstamo
  const montoPrestamo = formData.tiene_prestamo ? Math.max(0, formData.monto - formData.monto_cubierto) : 0;

  const handleGuardar = async () => {
    if (!transaccion) return;
    
    try {
      setGuardando(true);
      
      // Actualizar transacción básica
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
      
      // Eliminar evidencias marcadas
      for (const evidenciaId of evidenciasAEliminar) {
        try {
          await FinanzasService.eliminarEvidencia(evidenciaId);
        } catch (err) {
          console.error('Error eliminando evidencia:', err);
        }
      }
      
      // Subir nuevas evidencias
      for (const file of nuevasEvidencias) {
        try {
          await FinanzasService.subirEvidencia(file, transaccion.id);
        } catch (err) {
          console.error('Error subiendo evidencia:', err);
        }
      }
      
      // Manejar préstamo (solo para egresos)
      const esEgreso = detalleCompleto?.tipo === 'EGRESO';
      if (esEgreso && formData.tiene_prestamo && formData.prestamista_nombre) {
        try {
          await FinanzasService.agregarPrestamoTransaccion(transaccion.id, {
            monto_cubierto: formData.monto_cubierto,
            prestamista_nombre: formData.prestamista_nombre,
            prestamista_tipo: formData.prestamista_tipo,
            fecha_vencimiento: formData.fecha_vencimiento || undefined,
          });
        } catch (err) {
          console.error('Error guardando préstamo:', err);
          toast.error('Error al guardar el préstamo');
        }
      } else if (esEgreso && !formData.tiene_prestamo && detalleCompleto?.prestamo) {
        // Si desactivó el préstamo, eliminarlo poniendo monto_cubierto = monto total
        try {
          await FinanzasService.agregarPrestamoTransaccion(transaccion.id, {
            monto_cubierto: formData.monto, // Monto total = no hay préstamo
            prestamista_nombre: detalleCompleto.prestamo.prestamista_nombre || '',
            prestamista_tipo: 'DIRIGENTE',
          });
        } catch (err) {
          console.error('Error eliminando préstamo:', err);
        }
      }
      
      toast.success('Transacción actualizada exitosamente');
      setModoEdicion(false);
      setNuevasEvidencias([]);
      setEvidenciasAEliminar([]);
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
                  <span className="text-green-600 font-bold">S/</span>
                </div>
              ) : (
                <div className="p-2 rounded-full bg-red-100">
                  <span className="text-red-600 font-bold">S/</span>
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
              <>
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
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground font-medium">S/</span>
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

              {/* Sección de Préstamo - Solo para EGRESOS */}
              {!esIngreso && (
                <div className="space-y-4 border rounded-lg p-4 bg-yellow-50/50">
                  <div className="flex flex-row items-start space-x-3">
                    <Checkbox
                      checked={formData.tiene_prestamo}
                      onCheckedChange={(checked) => setFormData({...formData, tiene_prestamo: !!checked})}
                    />
                    <div className="space-y-1 leading-none">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                        <Banknote className="h-4 w-4 text-yellow-600" />
                        Este gasto fue financiado con dinero prestado
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Marca esta opción si alguien prestó dinero para cubrir total o parcialmente este gasto
                      </p>
                    </div>
                  </div>

                  {/* Campos de préstamo condicionales */}
                  {formData.tiene_prestamo && (
                    <div className="space-y-4 pt-2">
                      <Alert className="bg-yellow-100 border-yellow-300">
                        <AlertTriangle className="h-4 w-4 text-yellow-700" />
                        <AlertDescription className="text-yellow-800">
                          Se creará un préstamo por <strong>S/ {montoPrestamo.toFixed(2)}</strong> que quedará pendiente de devolución.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Monto cubierto con fondos propios */}
                        <div>
                          <Label>Monto pagado con fondos propios (S/)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground font-medium">S/</span>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-10"
                              max={formData.monto}
                              value={formData.monto_cubierto}
                              onChange={(e) => setFormData({...formData, monto_cubierto: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Préstamo: S/ {montoPrestamo.toFixed(2)}
                          </p>
                        </div>

                        {/* Nombre del prestamista */}
                        <div>
                          <Label>¿Quién prestó el dinero? *</Label>
                          <Input 
                            placeholder="Nombre de quien prestó"
                            value={formData.prestamista_nombre}
                            onChange={(e) => setFormData({...formData, prestamista_nombre: e.target.value})}
                          />
                        </div>

                        {/* Tipo de prestamista */}
                        <div>
                          <Label>Tipo de prestamista</Label>
                          <Select 
                            value={formData.prestamista_tipo}
                            onValueChange={(v) => setFormData({...formData, prestamista_tipo: v})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIPOS_PRESTAMISTA.map((tipo) => (
                                <SelectItem key={tipo.value} value={tipo.value}>
                                  {tipo.emoji} {tipo.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Fecha límite de devolución */}
                        <div>
                          <Label>Fecha límite de devolución</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="date"
                              className="pl-10"
                              value={formData.fecha_vencimiento}
                              onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Opcional - Para recordatorio de pago
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Gestión de Evidencias */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Evidencias / Vouchers
                </Label>
                
                {/* Evidencias existentes */}
                {detalleCompleto?.evidencias && detalleCompleto.evidencias.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Evidencias actuales:</p>
                    <div className="flex flex-wrap gap-2">
                      {detalleCompleto.evidencias.map((ev) => (
                        <div 
                          key={ev.id}
                          className={`relative bg-muted rounded-lg p-2 flex items-center gap-2 ${
                            evidenciasAEliminar.includes(ev.id) ? 'opacity-50 line-through' : ''
                          }`}
                        >
                          {ev.mime_type?.startsWith('image/') ? (
                            <ImageIcon className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          <span className="text-sm truncate max-w-[120px]">{ev.nombre_archivo}</span>
                          {evidenciasAEliminar.includes(ev.id) ? (
                            <button
                              type="button"
                              onClick={() => desmarcarEvidenciaParaEliminar(ev.id)}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Restaurar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => marcarEvidenciaParaEliminar(ev.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subir nuevas evidencias */}
                <div className="border-2 border-dashed rounded-lg p-4">
                  <input
                    type="file"
                    id="nuevas-evidencias"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="nuevas-evidencias"
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

                {/* Preview de nuevas evidencias */}
                {nuevasEvidencias.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Nuevas evidencias a agregar:</p>
                    <div className="flex flex-wrap gap-2">
                      {nuevasEvidencias.map((file, index) => (
                        <div 
                          key={index}
                          className="relative bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2"
                        >
                          {file.type.startsWith('image/') ? (
                            <ImageIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-green-600" />
                          )}
                          <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeNuevaEvidencia(index)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              </>
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
