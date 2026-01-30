/**
 * Dialog para registrar pago de participante
 * Permite registrar pagos parciales o completos con voucher
 */

import React, { useState, useEffect, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Upload, X, Image } from 'lucide-react';
import { ActividadesExteriorService } from '@/services/actividadesExteriorService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ParticipantePago {
  id: string;
  scout_id: string;
  scout_nombre: string;
  scout_codigo: string;
  monto_a_pagar: number;
  monto_pagado: number;
  pagado_completo: boolean;
  metodo_pago?: string;
}

interface RegistrarPagoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participante: ParticipantePago | null;
  onSuccess: () => void;
}

const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo', emoji: '💵' },
  { value: 'TRANSFERENCIA', label: 'Transferencia', emoji: '🏦' },
  { value: 'YAPE', label: 'Yape', emoji: '📱' },
  { value: 'PLIN', label: 'Plin', emoji: '📲' },
  { value: 'TARJETA', label: 'Tarjeta', emoji: '💳' },
];

const RegistrarPagoDialog: React.FC<RegistrarPagoDialogProps> = ({
  open,
  onOpenChange,
  participante,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [notas, setNotas] = useState('');
  const [voucher, setVoucher] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);
  const [uploadingVoucher, setUploadingVoucher] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && participante) {
      // Pre-llenar con el monto pendiente
      const pendiente = (participante.monto_a_pagar || 0) - (participante.monto_pagado || 0);
      setMonto(pendiente > 0 ? pendiente.toFixed(2) : '');
      setMetodoPago('EFECTIVO');
      setNotas('');
      setVoucher(null);
      setVoucherPreview(null);
    }
  }, [open, participante]);

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten imágenes');
        return;
      }
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar 5MB');
        return;
      }
      setVoucher(file);
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setVoucherPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeVoucher = () => {
    setVoucher(null);
    setVoucherPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Subir voucher a Supabase Storage
  const uploadVoucher = async (): Promise<{ url: string; nombre: string } | null> => {
    if (!voucher || !participante) return null;
    
    setUploadingVoucher(true);
    try {
      const fileExt = voucher.name.split('.').pop();
      const fileName = `pago_${participante.id}_${Date.now()}.${fileExt}`;
      const filePath = `vouchers-pago/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('finanzas')
        .upload(filePath, voucher, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('finanzas')
        .getPublicUrl(filePath);

      return { url: publicUrl, nombre: voucher.name };
    } catch (error) {
      console.error('Error subiendo voucher:', error);
      toast.error('Error al subir el comprobante');
      return null;
    } finally {
      setUploadingVoucher(false);
    }
  };

  if (!participante) return null;

  const montoAPagar = participante.monto_a_pagar || 0;
  const montoPagado = participante.monto_pagado || 0;
  const montoPendiente = montoAPagar - montoPagado;
  const porcentajePagado = montoAPagar > 0 ? (montoPagado / montoAPagar) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    try {
      setLoading(true);
      
      // Subir voucher si existe
      let voucherData: { url: string; nombre: string } | null = null;
      if (voucher) {
        voucherData = await uploadVoucher();
      }
      
      await ActividadesExteriorService.registrarPagoParticipante(participante.id, {
        monto: montoNum,
        metodo_pago: metodoPago,
        fecha_pago: new Date().toISOString().split('T')[0],
        notas: notas || undefined,
        comprobante_pago: voucherData?.url,
        comprobante_nombre: voucherData?.nombre,
      });

      const nuevoTotal = montoPagado + montoNum;
      if (nuevoTotal >= montoAPagar) {
        toast.success(`¡Pago completo! ${participante.scout_nombre} está al día`);
      } else {
        toast.success(`Pago de S/ ${montoNum.toFixed(2)} registrado`);
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error registrando pago:', error);
      toast.error(error.message || 'Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  const handlePagoCompleto = () => {
    setMonto(montoPendiente.toFixed(2));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-bold text-green-600">S/</span>
            Registrar Pago
          </DialogTitle>
          <DialogDescription>
            {participante.scout_nombre}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Estado actual */}
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Estado del pago</span>
              {participante.pagado_completo ? (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Pagado
                </Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Pendiente
                </Badge>
              )}
            </div>
            
            <Progress value={porcentajePagado} className="h-2 mb-2" />
            
            <div className="flex justify-between text-sm">
              <span>
                Pagado: <strong className="text-green-600">S/ {montoPagado.toFixed(2)}</strong>
              </span>
              <span>
                Total: <strong>S/ {montoAPagar.toFixed(2)}</strong>
              </span>
            </div>
            
            {montoPendiente > 0 && (
              <p className="text-center text-sm mt-2 text-yellow-600 font-medium">
                Pendiente: S/ {montoPendiente.toFixed(2)}
              </p>
            )}
          </div>

          {/* Formulario de pago */}
          {!participante.pagado_completo && (
            <div className="space-y-4">
              {/* Monto */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="monto">Monto a pagar *</Label>
                  {montoPendiente > 0 && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={handlePagoCompleto}
                    >
                      Pagar todo (S/ {montoPendiente.toFixed(2)})
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    S/
                  </span>
                  <Input
                    id="monto"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Método de pago */}
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select value={metodoPago} onValueChange={setMetodoPago}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METODOS_PAGO.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        <span className="flex items-center gap-2">
                          <span>{m.emoji}</span>
                          <span>{m.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label htmlFor="notas">Notas (opcional)</Label>
                <Textarea
                  id="notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: Pago parcial, pendiente segunda cuota..."
                  rows={2}
                />
              </div>

              {/* Voucher de pago */}
              <div className="space-y-2">
                <Label>Comprobante de pago (opcional)</Label>
                
                {!voucherPreview ? (
                  <div 
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Haz clic para subir foto del voucher
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG (máx. 5MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={voucherPreview} 
                      alt="Vista previa del voucher"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={removeVoucher}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <Image className="h-3 w-3" />
                      {voucher?.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ya pagado completo */}
          {participante.pagado_completo && (
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-green-600">
                Este participante ya pagó el monto completo
              </p>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {participante.pagado_completo ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!participante.pagado_completo && (
              <Button 
                type="submit" 
                disabled={loading || uploadingVoucher}
                className="bg-green-600 hover:bg-green-700"
              >
                {uploadingVoucher ? 'Subiendo voucher...' : loading ? 'Registrando...' : 'Registrar Pago'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrarPagoDialog;
