/**
 * MovimientoPersonaDialog
 * Pop-up de gestión rápida para registrar un movimiento (INGRESO/EGRESO)
 * en la cuenta virtual de una persona. Tema claro, consistente con el módulo.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { PersonSearchCombobox } from '@/components/shared/PersonSearch/PersonSearchCombobox';
import { PersonaResult } from '@/services/personaService';
import {
  FinanzasService,
  TipoMovimientoPersona,
  ConceptoFinanzas,
} from '@/services/finanzasService';

interface MovimientoPersonaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** Persona pre-seleccionada (al registrar desde la ficha de una persona) */
  personaInicial?: PersonaResult | null;
}

const OTRO = '__OTRO__';

const MovimientoPersonaDialog: React.FC<MovimientoPersonaDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  personaInicial = null,
}) => {
  const [persona, setPersona] = useState<PersonaResult | null>(personaInicial);
  const [tipo, setTipo] = useState<TipoMovimientoPersona>('INGRESO');
  const [monto, setMonto] = useState<string>('');
  const [conceptoSel, setConceptoSel] = useState<string>('');
  const [conceptoOtro, setConceptoOtro] = useState<string>('');
  const [cantidad, setCantidad] = useState<string>('');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notas, setNotas] = useState<string>('');
  const [guardando, setGuardando] = useState(false);
  const [conceptosDisponibles, setConceptosDisponibles] = useState<ConceptoFinanzas[]>([]);

  // Reset al abrir/cerrar
  useEffect(() => {
    if (open) {
      setPersona(personaInicial);
      setTipo('INGRESO');
      setMonto('');
      setConceptoSel('');
      setConceptoOtro('');
      setCantidad('');
      setFecha(new Date().toISOString().split('T')[0]);
      setNotas('');
    }
  }, [open, personaInicial]);

  // Cargar catálogo de conceptos (activos) cada vez que se abre el diálogo
  useEffect(() => {
    if (!open) return;
    let activo = true;
    FinanzasService.listarConceptosFinanzas(true)
      .then((conceptos) => {
        if (activo) setConceptosDisponibles(conceptos);
      })
      .catch((err) => console.error('Error cargando conceptos:', err));
    return () => {
      activo = false;
    };
  }, [open]);

  const conceptoFinal = conceptoSel === OTRO ? conceptoOtro.trim() : conceptoSel;
  const montoNum = parseFloat(monto);
  const conceptoObjSel = conceptosDisponibles.find((c) => c.descripcion === conceptoSel);
  const requiereCantidad = conceptoObjSel?.requiere_cantidad ?? false;
  const cantidadNum = parseInt(cantidad, 10);

  const puedeGuardar =
    !!persona &&
    !isNaN(montoNum) &&
    montoNum > 0 &&
    conceptoFinal.length > 0 &&
    (!requiereCantidad || (!isNaN(cantidadNum) && cantidadNum > 0)) &&
    !guardando;

  const handleGuardar = async () => {
    if (!persona) {
      toast.error('Selecciona una persona');
      return;
    }
    if (isNaN(montoNum) || montoNum <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    if (!conceptoFinal) {
      toast.error('Indica el concepto del movimiento');
      return;
    }
    if (requiereCantidad && (isNaN(cantidadNum) || cantidadNum <= 0)) {
      toast.error('Este concepto requiere que indiques una cantidad válida');
      return;
    }

    try {
      setGuardando(true);
      const { saldo_actual } = await FinanzasService.registrarMovimientoPersona({
        persona_id: persona.persona_id,
        tipo_movimiento: tipo,
        concepto: conceptoFinal,
        monto: montoNum,
        cantidad: requiereCantidad ? cantidadNum : undefined,
        fecha,
        notas: notas.trim() || undefined,
      });

      toast.success(
        `${tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'} registrado. Nuevo saldo: ${new Intl.NumberFormat(
          'es-PE',
          { style: 'currency', currency: 'PEN' }
        ).format(saldo_actual)}`
      );
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar movimiento');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Registrar Movimiento
          </DialogTitle>
          <DialogDescription>
            Suma o resta saldo a la cuenta virtual de una persona.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 1. Persona */}
          <div className="space-y-1.5">
            <Label>Persona</Label>
            <PersonSearchCombobox
              onSelect={setPersona}
              personaVinculada={persona}
              onDesvincular={() => setPersona(null)}
              placeholder="Buscar por nombre o N° documento..."
            />
          </div>

          {/* 2. Tipo de transacción (biestado) */}
          <div className="space-y-1.5">
            <Label>Tipo de movimiento</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo('INGRESO')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                  tipo === 'INGRESO'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-gray-200 text-gray-500 hover:border-emerald-200'
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => setTipo('EGRESO')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                  tipo === 'EGRESO'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                    : 'border-gray-200 text-gray-500 hover:border-rose-200'
                }`}
              >
                <ArrowDownRight className="h-4 w-4" />
                Egreso
              </button>
            </div>
          </div>

          {/* 3. Monto + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mp-monto">Monto (S/)</Label>
              <Input
                id="mp-monto"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mp-fecha">Fecha</Label>
              <Input
                id="mp-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>

          {/* 4. Concepto / Categoría */}
          <div className="space-y-1.5">
            <Label>Concepto</Label>
            <Select
              value={conceptoSel}
              onValueChange={(value) => {
                setConceptoSel(value);
                setCantidad('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un concepto..." />
              </SelectTrigger>
              <SelectContent>
                {conceptosDisponibles.map((c) => (
                  <SelectItem key={c.id} value={c.descripcion}>
                    {c.descripcion}
                  </SelectItem>
                ))}
                <SelectItem value={OTRO}>✏️ Otro...</SelectItem>
              </SelectContent>
            </Select>
            {conceptoSel === OTRO && (
              <Input
                autoFocus
                placeholder="Describe el concepto"
                value={conceptoOtro}
                onChange={(e) => setConceptoOtro(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* 4b. Cantidad — solo si el concepto elegido lo requiere */}
          {requiereCantidad && (
            <div className="space-y-1.5">
              <Label htmlFor="mp-cantidad">Cantidad</Label>
              <Input
                id="mp-cantidad"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                placeholder="Ingresa la cantidad..."
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </div>
          )}

          {/* Notas opcionales */}
          <div className="space-y-1.5">
            <Label htmlFor="mp-notas">Notas / referencia (opcional)</Label>
            <Textarea
              id="mp-notas"
              rows={2}
              placeholder="Detalle adicional, n° de operación, etc."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleGuardar} disabled={!puedeGuardar}>
            {guardando ? 'Guardando...' : 'Registrar Movimiento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MovimientoPersonaDialog;
