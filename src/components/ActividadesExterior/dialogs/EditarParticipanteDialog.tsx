/**
 * Dialog para editar datos de un participante
 * Permite modificar monto a pagar, observaciones, etc.
 */

import React, { useState, useEffect } from 'react';
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
import { Edit, User } from 'lucide-react';
import { ActividadesExteriorService } from '@/services/actividadesExteriorService';
import { toast } from 'sonner';

interface ParticipanteEditar {
  id: string;
  scout_id: string;
  scout_nombre: string;
  scout_codigo: string;
  monto_a_pagar?: number;
  monto_pagado: number;
  restricciones_alimentarias?: string;
  observaciones?: string;
}

interface EditarParticipanteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participante: ParticipanteEditar | null;
  costoDefault?: number;
  onSuccess: () => void;
}

const EditarParticipanteDialog: React.FC<EditarParticipanteDialogProps> = ({
  open,
  onOpenChange,
  participante,
  costoDefault = 0,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [montoAPagar, setMontoAPagar] = useState('');
  const [montoPagado, setMontoPagado] = useState('');
  const [restricciones, setRestricciones] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (open && participante) {
      setMontoAPagar(
        (participante.monto_a_pagar ?? costoDefault).toString()
      );
      setMontoPagado((participante.monto_pagado || 0).toString());
      setRestricciones(participante.restricciones_alimentarias || '');
      setObservaciones(participante.observaciones || '');
    }
  }, [open, participante, costoDefault]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participante) return;

    const monto = parseFloat(montoAPagar);
    const pagado = parseFloat(montoPagado);
    
    if (isNaN(monto) || monto < 0) {
      toast.error('Ingresa un monto a pagar válido');
      return;
    }
    
    if (isNaN(pagado) || pagado < 0) {
      toast.error('Ingresa un monto pagado válido');
      return;
    }

    try {
      setLoading(true);

      // Actualizar montos usando la función RPC
      await ActividadesExteriorService.corregirMontosParticipante(
        participante.id,
        monto,
        pagado
      );
      
      // Actualizar otros datos si cambiaron
      if (restricciones.trim() !== (participante.restricciones_alimentarias || '') ||
          observaciones.trim() !== (participante.observaciones || '')) {
        await ActividadesExteriorService.actualizarParticipante(participante.id, {
          restricciones_alimentarias: restricciones.trim() || undefined,
          observaciones: observaciones.trim() || undefined,
        });
      }

      toast.success('Datos del participante actualizados');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error actualizando participante:', error);
      toast.error(error.message || 'Error al actualizar datos');
    } finally {
      setLoading(false);
    }
  };

  if (!participante) return null;

  const montoPagadoNum = parseFloat(montoPagado) || 0;
  const montoIngresado = parseFloat(montoAPagar) || 0;
  const diferencia = montoIngresado - montoPagadoNum;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            Editar Participante
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {participante.scout_nombre} ({participante.scout_codigo})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monto a pagar */}
          <div className="space-y-2">
            <Label htmlFor="monto" className="flex items-center gap-2">
              <span className="font-bold">S/</span>
              Monto a pagar
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                S/
              </span>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0"
                value={montoAPagar}
                onChange={(e) => setMontoAPagar(e.target.value)}
                className="pl-10"
                placeholder="0.00"
              />
            </div>
            
          </div>

          {/* Monto ya pagado (editable) */}
          <div className="space-y-2">
            <Label htmlFor="montoPagado" className="flex items-center gap-2">
              <span className="font-bold">S/</span>
              Monto ya pagado
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                S/
              </span>
              <Input
                id="montoPagado"
                type="number"
                step="0.01"
                min="0"
                value={montoPagado}
                onChange={(e) => setMontoPagado(e.target.value)}
                className="pl-10"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Resumen calculado */}
          {montoIngresado > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pendiente:</span>
                <span className={`font-medium ${diferencia > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  S/ {diferencia.toFixed(2)}
                  {diferencia <= 0 && ' ✓'}
                </span>
              </div>
            </div>
          )}

          {/* Restricciones alimentarias */}
          <div className="space-y-2">
            <Label htmlFor="restricciones">Restricciones alimentarias</Label>
            <Input
              id="restricciones"
              value={restricciones}
              onChange={(e) => setRestricciones(e.target.value)}
              placeholder="Ej: Vegetariano, alergia a maní..."
            />
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales sobre el participante..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditarParticipanteDialog;
