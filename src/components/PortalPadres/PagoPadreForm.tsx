/**
 * Registro de pago de una actividad al aire libre desde el Portal de Padres.
 * Medio de pago: Efectivo / Yape / Plin. El comprobante solo aplica a
 * Yape/Plin y es opcional (por si hay algún problema técnico al subirlo).
 * Si hay hermanos con pago pendiente en la misma actividad, se puede pagar
 * por todos en un solo paso (mismo medio y mismo comprobante).
 * El pago se registra igual que desde Aire Libre → Participantes.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Image, Info, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  PortalPadresService,
  ActividadHijo,
  MedioPagoPadre,
} from '@/services/portalPadresService';
import { formatSoles } from './actividadFormat';

const MEDIOS_PAGO: { value: MedioPagoPadre; label: string; emoji: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo', emoji: '💵' },
  { value: 'YAPE', label: 'Yape', emoji: '📱' },
  { value: 'PLIN', label: 'Plin', emoji: '📲' },
];

const pendienteDe = (a: ActividadHijo) => Math.max(a.monto_a_pagar - a.monto_pagado, 0);

interface PagoPadreFormProps {
  actividad: ActividadHijo;
  /** Hermanos inscritos en la misma actividad con pago pendiente. */
  hermanos?: ActividadHijo[];
  instruccionesPago?: string | null;
  /** Recibe los participante_id cuyo pago se registró (el actual + hermanos). */
  onPagado: (participanteIds: string[]) => void;
  /** Botón secundario (ej. "Pagaré después" en el asistente). */
  accionSecundaria?: { label: string; onClick: () => void };
}

const PagoPadreForm: React.FC<PagoPadreFormProps> = ({
  actividad,
  hermanos = [],
  instruccionesPago,
  onPagado,
  accionSecundaria,
}) => {
  const pendiente = pendienteDe(actividad);
  const [monto, setMonto] = useState(pendiente > 0 ? pendiente.toFixed(2) : '');
  const [medio, setMedio] = useState<MedioPagoPadre | null>(null);
  const [hermanosSel, setHermanosSel] = useState<Set<string>>(new Set());
  const [voucher, setVoucher] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<'idle' | 'subiendo' | 'registrando'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMonto(pendiente > 0 ? pendiente.toFixed(2) : '');
    setMedio(null);
    setHermanosSel(new Set());
    setVoucher(null);
    setVoucherPreview(null);
    setEnviando('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actividad.participante_id]);

  const requiereVoucher = medio === 'YAPE' || medio === 'PLIN';
  const porcentaje = actividad.monto_a_pagar > 0 ? (actividad.monto_pagado / actividad.monto_a_pagar) * 100 : 0;
  const ocupado = enviando !== 'idle';
  const hermanosAPagar = hermanos.filter((h) => hermanosSel.has(h.participante_id));
  // Con hermanos se paga el pendiente completo de cada uno
  const pagoMultiple = hermanosAPagar.length > 0;
  const total = pagoMultiple
    ? pendiente + hermanosAPagar.reduce((s, h) => s + pendienteDe(h), 0)
    : parseFloat(monto) || 0;

  const quitarVoucher = () => {
    setVoucher(null);
    setVoucherPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleHermano = (id: string) =>
    setHermanosSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes (captura del Yape/Plin)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB');
      return;
    }
    setVoucher(file);
    const reader = new FileReader();
    reader.onloadend = () => setVoucherPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const montoNum = pagoMultiple ? pendiente : parseFloat(monto);
    if (!medio) {
      toast.error('Selecciona el medio de pago');
      return;
    }
    if (isNaN(montoNum) || montoNum <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    if (montoNum > pendiente + 0.001) {
      toast.error(`El monto no puede superar lo pendiente (${formatSoles(pendiente)})`);
      return;
    }

    let voucherData: { url: string; nombre: string } | undefined;
    if (requiereVoucher && voucher) {
      setEnviando('subiendo');
      try {
        voucherData = await PortalPadresService.subirVoucher(actividad.scout_id, actividad.participante_id, voucher);
      } catch (err) {
        console.error('Error subiendo voucher:', err);
        // El comprobante es opcional: se quita para que pueda reintentar o registrar sin él
        quitarVoucher();
        setEnviando('idle');
        toast.error('No se pudo subir el comprobante. Puedes reintentar o registrar el pago sin él.');
        return;
      }
    }

    setEnviando('registrando');
    const pagos = [
      { a: actividad, monto: montoNum },
      ...hermanosAPagar.map((h) => ({ a: h, monto: pendienteDe(h) })),
    ];
    const errores: string[] = [];
    const pagados: string[] = [];
    for (const { a, monto: m } of pagos) {
      const { success, error } = await PortalPadresService.registrarPago(a.participante_id, {
        monto: m,
        metodo_pago: medio,
        comprobante_pago: voucherData?.url,
        comprobante_nombre: voucherData?.nombre,
      });
      if (success) pagados.push(a.participante_id);
      else errores.push(`${a.scout_nombre}: ${error}`);
    }
    setEnviando('idle');

    if (errores.length === pagos.length) {
      toast.error(errores[0] || 'No se pudo registrar el pago');
      return;
    }
    if (errores.length > 0) {
      toast.warning(`Algunos pagos no se registraron. ${errores.join(' · ')}`);
    } else {
      toast.success(
        pagos.length > 1
          ? `Pago de ${formatSoles(total)} registrado para ${pagos.length} scouts`
          : `Pago de ${formatSoles(montoNum)} registrado`,
      );
    }
    onPagado(pagados);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Estado actual */}
      <div className="bg-muted/50 rounded-lg p-4">
        <Progress value={porcentaje} className="h-2 mb-2" />
        <div className="flex justify-between text-sm">
          <span>
            Pagado: <strong className="text-green-600">{formatSoles(actividad.monto_pagado)}</strong>
          </span>
          <span>
            Total: <strong>{formatSoles(actividad.monto_a_pagar)}</strong>
          </span>
        </div>
        <p className="text-center text-sm mt-2 text-yellow-700 font-medium">Pendiente: {formatSoles(pendiente)}</p>
      </div>

      {instruccionesPago && (
        <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 whitespace-pre-line">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{instruccionesPago}</span>
        </div>
      )}

      {/* Hermanos en la misma actividad */}
      {hermanos.length > 0 && (
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-sm font-medium">¿Pagar también por tus otros hijos en esta actividad?</p>
          {hermanos.map((h) => (
            <label key={h.participante_id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 accent-green-600"
                checked={hermanosSel.has(h.participante_id)}
                onChange={() => toggleHermano(h.participante_id)}
                disabled={ocupado}
              />
              <span className="flex-1">{h.scout_nombre}</span>
              <span className="font-semibold">{formatSoles(pendienteDe(h))}</span>
            </label>
          ))}
        </div>
      )}

      {/* Medio de pago */}
      <div className="space-y-2">
        <Label>Medio de pago *</Label>
        <div className="grid grid-cols-3 gap-2">
          {MEDIOS_PAGO.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => {
                setMedio(m.value);
                if (m.value === 'EFECTIVO') quitarVoucher();
              }}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                medio === m.value
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Monto */}
      <div className="space-y-2">
        <Label htmlFor="monto-padre">{pagoMultiple ? 'Monto total' : 'Monto *'}</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">S/</span>
          <Input
            id="monto-padre"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            max={pagoMultiple ? undefined : pendiente.toFixed(2)}
            value={pagoMultiple ? total.toFixed(2) : monto}
            onChange={(e) => setMonto(e.target.value)}
            disabled={pagoMultiple}
            className="pl-10"
            required
          />
        </div>
      </div>

      {/* Comprobante (solo Yape / Plin, opcional) */}
      {requiereVoucher && (
        <div className="space-y-2">
          <Label>Comprobante de pago (opcional)</Label>
          {!voucherPreview ? (
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Sube la captura del {medio === 'YAPE' ? 'Yape' : 'Plin'}</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG (máx. 5MB)</p>
            </div>
          ) : (
            <div className="relative">
              <img src={voucherPreview} alt="Vista previa del comprobante" className="w-full h-40 object-contain bg-gray-50 rounded-lg border" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={quitarVoucher}
                disabled={ocupado}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1 max-w-[90%] truncate">
                <Image className="h-3 w-3 shrink-0" />
                {voucher?.name}
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <p className="text-xs text-muted-foreground">
            Si tienes algún problema para subirlo, puedes registrar el pago igual y enviar la captura a tu dirigente.
          </p>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        {accionSecundaria && (
          <Button type="button" variant="outline" onClick={accionSecundaria.onClick} disabled={ocupado}>
            {accionSecundaria.label}
          </Button>
        )}
        <Button type="submit" disabled={ocupado || !medio} className="bg-green-600 hover:bg-green-700">
          {ocupado && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {enviando === 'subiendo'
            ? 'Subiendo comprobante...'
            : enviando === 'registrando'
              ? 'Registrando...'
              : `Registrar pago${total > 0 ? ` · ${formatSoles(total)}` : ''}`}
        </Button>
      </div>
    </form>
  );
};

export default PagoPadreForm;
