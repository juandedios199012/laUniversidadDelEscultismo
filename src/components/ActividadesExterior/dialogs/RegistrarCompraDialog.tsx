/**
 * Dialog para registrar Compras vinculadas al presupuesto
 * UX: Formulario multi-pasos con upload de comprobante
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  ShoppingCart, 
  Receipt, 
  X, 
  Check, 
  AlertCircle,
  Camera,
  Link
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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ActividadesExteriorService,
  ItemPresupuestoActividad,
  TIPOS_COMPROBANTE,
  CATEGORIAS_PRESUPUESTO_ACTIVIDAD,
} from '@/services/actividadesExteriorService';
import { toast } from 'sonner';

interface RegistrarCompraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actividadId: string;
  presupuesto: ItemPresupuestoActividad[];
  onSuccess: () => void;
}

const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo', emoji: '💵' },
  { value: 'TRANSFERENCIA', label: 'Transferencia', emoji: '🏦' },
  { value: 'YAPE', label: 'Yape', emoji: '📱' },
  { value: 'PLIN', label: 'Plin', emoji: '📲' },
  { value: 'TARJETA', label: 'Tarjeta', emoji: '💳' },
];

const RegistrarCompraDialog: React.FC<RegistrarCompraDialogProps> = ({
  open,
  onOpenChange,
  actividadId,
  presupuesto,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [guardando, setGuardando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Datos del formulario
  const [presupuestoItemId, setPresupuestoItemId] = useState<string>('');
  const [concepto, setConcepto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [precioUnitario, setPrecioUnitario] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0]);
  const [tipoComprobante, setTipoComprobante] = useState('BOLETA');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [notas, setNotas] = useState('');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);

  // Validación
  const [touched, setTouched] = useState({
    concepto: false,
    precioUnitario: false,
    cantidad: false,
  });
  const [errors, setErrors] = useState({
    concepto: '',
    precioUnitario: '',
    cantidad: '',
  });

  const resetForm = () => {
    setStep(1);
    setPresupuestoItemId('');
    setConcepto('');
    setDescripcion('');
    setCategoria('');
    setCantidad('1');
    setPrecioUnitario('');
    setProveedor('');
    setFechaCompra(new Date().toISOString().split('T')[0]);
    setTipoComprobante('BOLETA');
    setNumeroComprobante('');
    setMetodoPago('EFECTIVO');
    setNotas('');
    setComprobante(null);
    setComprobantePreview(null);
    setProgreso(0);
    setTouched({ concepto: false, precioUnitario: false, cantidad: false });
    setErrors({ concepto: '', precioUnitario: '', cantidad: '' });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const validateConcepto = (value: string) => {
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, concepto: 'El concepto es requerido' }));
      return false;
    }
    setErrors(prev => ({ ...prev, concepto: '' }));
    return true;
  };

  const validatePrecio = (value: string) => {
    const num = parseFloat(value);
    if (!value || isNaN(num) || num <= 0) {
      setErrors(prev => ({ ...prev, precioUnitario: 'Ingresa un precio válido' }));
      return false;
    }
    setErrors(prev => ({ ...prev, precioUnitario: '' }));
    return true;
  };

  const validateCantidad = (value: string) => {
    const num = parseFloat(value);
    if (!value || isNaN(num) || num <= 0) {
      setErrors(prev => ({ ...prev, cantidad: 'Cantidad inválida' }));
      return false;
    }
    setErrors(prev => ({ ...prev, cantidad: '' }));
    return true;
  };

  // Al seleccionar un item de presupuesto, pre-llenar datos
  const handleSelectPresupuesto = (itemId: string) => {
    setPresupuestoItemId(itemId);
    if (itemId) {
      const item = presupuesto.find(p => p.id === itemId);
      if (item) {
        setConcepto(item.concepto);
        setCategoria(item.categoria);
        setPrecioUnitario(item.precio_unitario.toString());
        setCantidad(item.cantidad.toString());
        setProveedor(item.proveedor || '');
        setDescripcion(item.descripcion || '');
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    // Solo imágenes para comprobantes
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes para comprobantes');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es muy grande. Máximo 5MB.');
      return;
    }

    setComprobante(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setComprobantePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const montoTotal = (parseFloat(cantidad) || 0) * (parseFloat(precioUnitario) || 0);

  const handleNext = () => {
    if (step === 1) {
      setTouched({ concepto: true, precioUnitario: true, cantidad: true });
      const conceptoValido = validateConcepto(concepto);
      const precioValido = validatePrecio(precioUnitario);
      const cantidadValida = validateCantidad(cantidad);
      
      if (conceptoValido && precioValido && cantidadValida) {
        setStep(2);
      }
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      setProgreso(10);

      let comprobanteUrl: string | undefined;
      let comprobanteNombre: string | undefined;

      // 1. Intentar subir comprobante si existe (no bloquea si falla)
      if (comprobante) {
        try {
          const result = await ActividadesExteriorService.subirArchivo(
            actividadId,
            comprobante,
            'comprobante'
          );
          comprobanteUrl = result.url;
          comprobanteNombre = result.nombre;
          setProgreso(50);
        } catch (uploadError: any) {
          console.warn('No se pudo subir el comprobante:', uploadError);
          toast.warning('No se pudo subir la imagen del comprobante. La compra se registrará sin él.');
          setProgreso(30);
        }
      }

      // 2. Registrar compra
      await ActividadesExteriorService.registrarCompra(actividadId, {
        presupuesto_item_id: presupuestoItemId || undefined,
        concepto,
        descripcion: descripcion || undefined,
        categoria: categoria || undefined,
        cantidad: parseFloat(cantidad),
        precio_unitario: parseFloat(precioUnitario),
        proveedor: proveedor || undefined,
        fecha_compra: fechaCompra,
        comprobante_url: comprobanteUrl,
        comprobante_nombre: comprobanteNombre,
        tipo_comprobante: tipoComprobante,
        numero_comprobante: numeroComprobante || undefined,
        metodo_pago: metodoPago,
        notas: notas || undefined,
      });
      setProgreso(100);

      toast.success(`Compra registrada: S/ ${montoTotal.toFixed(2)}`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error registrando compra:', error);
      toast.error(error.message || 'Error al registrar compra');
    } finally {
      setGuardando(false);
      setProgreso(0);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Datos de la Compra';
      case 2: return 'Comprobante';
      case 3: return 'Confirmar';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            Paso {step} de 3 • {step === 1 && 'Ingresa los datos de la compra'}
            {step === 2 && 'Sube la foto del comprobante (opcional)'}
            {step === 3 && 'Revisa y confirma los datos'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
          <div className={`flex-1 h-1 rounded ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            3
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          {/* Step 1: Datos de la compra */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Vincular a presupuesto */}
              {presupuesto.length > 0 && (
                <div className="space-y-2">
                  <Label>Vincular a ítem del presupuesto</Label>
                  <Select value={presupuestoItemId || '_none'} onValueChange={(v) => handleSelectPresupuesto(v === '_none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ítem (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Sin vincular</SelectItem>
                      {presupuesto.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex items-center gap-2">
                            <span>{item.concepto}</span>
                            <Badge variant="outline" className="text-xs">
                              S/ {item.precio_unitario}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Al vincular, se actualizará el monto ejecutado del presupuesto
                  </p>
                </div>
              )}

              <Separator />

              {/* Concepto */}
              <div className="space-y-2">
                <Label htmlFor="concepto">
                  Concepto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="concepto"
                  placeholder="Ej: Verduras para el almuerzo"
                  value={concepto}
                  onChange={(e) => {
                    setConcepto(e.target.value);
                    if (touched.concepto) validateConcepto(e.target.value);
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, concepto: true }));
                    validateConcepto(concepto);
                  }}
                  className={errors.concepto ? 'border-destructive' : ''}
                />
                {errors.concepto && touched.concepto && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.concepto}
                  </p>
                )}
              </div>

              {/* Categoría y Proveedor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger id="categoria">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_PRESUPUESTO_ACTIVIDAD.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.emoji} {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proveedor">Proveedor</Label>
                  <Input
                    id="proveedor"
                    placeholder="Ej: Mercado Central"
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                  />
                </div>
              </div>

              {/* Cantidad y Precio */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cantidad">
                    Cantidad <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cantidad"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="1"
                    value={cantidad}
                    onChange={(e) => {
                      setCantidad(e.target.value);
                      if (touched.cantidad) validateCantidad(e.target.value);
                    }}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, cantidad: true }));
                      validateCantidad(cantidad);
                    }}
                    className={errors.cantidad ? 'border-destructive' : ''}
                  />
                  {errors.cantidad && touched.cantidad && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.cantidad}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precioUnitario">
                    Precio unitario (S/) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="precioUnitario"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={precioUnitario}
                    onChange={(e) => {
                      setPrecioUnitario(e.target.value);
                      if (touched.precioUnitario) validatePrecio(e.target.value);
                    }}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, precioUnitario: true }));
                      validatePrecio(precioUnitario);
                    }}
                    className={errors.precioUnitario ? 'border-destructive' : ''}
                  />
                  {errors.precioUnitario && touched.precioUnitario && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.precioUnitario}
                    </p>
                  )}
                </div>
              </div>

              {/* Total */}
              {montoTotal > 0 && (
                <div className="p-3 bg-primary/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Monto Total:</span>
                    <span className="text-xl font-bold text-primary">
                      S/ {montoTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Fecha y método de pago */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaCompra">Fecha de compra</Label>
                  <Input
                    id="fechaCompra"
                    type="date"
                    value={fechaCompra}
                    onChange={(e) => setFechaCompra(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metodoPago">Método de pago</Label>
                  <Select value={metodoPago} onValueChange={setMetodoPago}>
                    <SelectTrigger id="metodoPago">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METODOS_PAGO.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.emoji} {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Comprobante */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Tipo y número de comprobante */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoComprobante">Tipo de comprobante</Label>
                  <Select value={tipoComprobante} onValueChange={setTipoComprobante}>
                    <SelectTrigger id="tipoComprobante">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_COMPROBANTE.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroComprobante">Número</Label>
                  <Input
                    id="numeroComprobante"
                    placeholder="Ej: 001-0001234"
                    value={numeroComprobante}
                    onChange={(e) => setNumeroComprobante(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Foto del comprobante */}
              <div className="space-y-2">
                <Label>Foto del comprobante</Label>
                
                {comprobantePreview ? (
                  <div className="relative rounded-lg overflow-hidden border">
                    <img 
                      src={comprobantePreview} 
                      alt="Comprobante"
                      className="w-full h-48 object-contain bg-muted"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setComprobante(null);
                        setComprobantePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                      ${isDragging 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                      }
                    `}
                  >
                    <Camera className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium mb-1">Sube una foto del comprobante</p>
                    <p className="text-sm text-muted-foreground">
                      Arrastra o haz clic para seleccionar
                    </p>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Opcional • Solo imágenes • Máximo 5MB
                </p>
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label htmlFor="notas">Notas adicionales</Label>
                <Textarea
                  id="notas"
                  placeholder="Observaciones sobre la compra..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirmación */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Resumen de la Compra
                </h4>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Concepto:</div>
                  <div className="font-medium">{concepto}</div>
                  
                  {categoria && (
                    <>
                      <div className="text-muted-foreground">Categoría:</div>
                      <div>{CATEGORIAS_PRESUPUESTO_ACTIVIDAD.find(c => c.value === categoria)?.label || categoria}</div>
                    </>
                  )}
                  
                  <div className="text-muted-foreground">Cantidad:</div>
                  <div>{cantidad}</div>
                  
                  <div className="text-muted-foreground">Precio unitario:</div>
                  <div>S/ {parseFloat(precioUnitario).toFixed(2)}</div>
                  
                  {proveedor && (
                    <>
                      <div className="text-muted-foreground">Proveedor:</div>
                      <div>{proveedor}</div>
                    </>
                  )}
                  
                  <div className="text-muted-foreground">Fecha:</div>
                  <div>{new Date(fechaCompra).toLocaleDateString('es-PE')}</div>
                  
                  <div className="text-muted-foreground">Pago:</div>
                  <div>{METODOS_PAGO.find(m => m.value === metodoPago)?.label}</div>
                  
                  <div className="text-muted-foreground">Comprobante:</div>
                  <div>
                    {TIPOS_COMPROBANTE.find(t => t.value === tipoComprobante)?.label}
                    {numeroComprobante && ` - ${numeroComprobante}`}
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">TOTAL:</span>
                  <span className="text-2xl font-bold text-primary">
                    S/ {montoTotal.toFixed(2)}
                  </span>
                </div>

                {presupuestoItemId && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link className="h-3 w-3" />
                    Vinculado al presupuesto
                  </div>
                )}
              </div>

              {comprobantePreview && (
                <div className="space-y-2">
                  <Label>Comprobante adjunto</Label>
                  <img 
                    src={comprobantePreview} 
                    alt="Comprobante"
                    className="w-full h-32 object-contain bg-muted rounded-lg border"
                  />
                </div>
              )}

              {/* Barra de progreso */}
              {guardando && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Guardando...</span>
                    <span>{progreso}%</span>
                  </div>
                  <Progress value={progreso} className="h-2" />
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 flex-shrink-0 border-t pt-4">
          {step > 1 && !guardando && (
            <Button variant="outline" onClick={() => setStep((step - 1) as 1 | 2)}>
              Atrás
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} disabled={guardando}>
            Cancelar
          </Button>
          {step < 3 ? (
            <Button onClick={handleNext}>
              Siguiente
            </Button>
          ) : (
            <Button onClick={handleGuardar} disabled={guardando}>
              {guardando ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Registrar Compra
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrarCompraDialog;
