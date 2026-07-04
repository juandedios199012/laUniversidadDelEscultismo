/**
 * MovimientoPersonaDialog
 * Pop-up de gestión rápida para registrar o editar un movimiento
 * (INGRESO/EGRESO) en la cuenta virtual de una persona. Tema claro,
 * consistente con el módulo.
 *
 * Cuando el concepto elegido "Requiere Cantidad" y tiene Precio Unitario
 * en el catálogo, cantidad × precio_unitario arma una "meta" de venta;
 * el campo Monto representa lo acumulado cobrado hasta ahora. Por eso
 * este mismo diálogo también sirve para EDITAR un movimiento ya
 * registrado (sumar cobros posteriores de la misma venta) en vez de
 * obligar a crear uno nuevo cada vez.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { PersonSearchCombobox } from '@/components/shared/PersonSearch/PersonSearchCombobox';
import { PersonaResult } from '@/services/personaService';
import {
  FinanzasService,
  TipoMovimientoPersona,
  ConceptoFinanzas,
  MovimientoPersona,
} from '@/services/finanzasService';

interface MovimientoPersonaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** Persona pre-seleccionada (al registrar desde la ficha de una persona, o titular del movimiento en edición) */
  personaInicial?: PersonaResult | null;
  /** Si viene con valor, el diálogo edita este movimiento en vez de crear uno nuevo */
  movimientoEditar?: MovimientoPersona | null;
}

const OTRO = '__OTRO__';

const formatMonto = (monto: number): string =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto);

const MovimientoPersonaDialog: React.FC<MovimientoPersonaDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  personaInicial = null,
  movimientoEditar = null,
}) => {
  const esEdicion = !!movimientoEditar;

  const [persona, setPersona] = useState<PersonaResult | null>(personaInicial);
  const [tipo, setTipo] = useState<TipoMovimientoPersona>('INGRESO');
  const [monto, setMonto] = useState<string>('');
  const [conceptoSel, setConceptoSel] = useState<string>('');
  const [conceptoOtro, setConceptoOtro] = useState<string>('');
  const [cantidad, setCantidad] = useState<string>('');
  const [precioUnitarioSnapshot, setPrecioUnitarioSnapshot] = useState<number | undefined>(undefined);
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [guardando, setGuardando] = useState(false);
  const [conceptosDisponibles, setConceptosDisponibles] = useState<ConceptoFinanzas[]>([]);

  // Reset / precarga al abrir
  useEffect(() => {
    if (!open) return;
    setPersona(personaInicial);

    if (movimientoEditar) {
      setTipo(movimientoEditar.tipo_movimiento);
      setMonto(movimientoEditar.monto.toString());
      setConceptoOtro(movimientoEditar.concepto);
      setConceptoSel(movimientoEditar.concepto);
      setCantidad(movimientoEditar.cantidad?.toString() ?? '');
      setPrecioUnitarioSnapshot(movimientoEditar.precio_unitario);
      setFecha(movimientoEditar.fecha);
    } else {
      setTipo('INGRESO');
      setMonto('');
      setConceptoSel('');
      setConceptoOtro('');
      setCantidad('');
      setPrecioUnitarioSnapshot(undefined);
      setFecha(new Date().toISOString().split('T')[0]);
    }
  }, [open, personaInicial, movimientoEditar]);

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
  const requiereCantidad = esEdicion
    ? movimientoEditar!.cantidad != null
    : (conceptoObjSel?.requiere_cantidad ?? false);
  const cantidadNum = parseInt(cantidad, 10);

  // Precio unitario: en edición se usa el snapshot ya guardado en el
  // movimiento (no el del catálogo, que pudo haber cambiado desde entonces).
  const precioUnitario = esEdicion ? precioUnitarioSnapshot : conceptoObjSel?.precio_unitario;
  const meta = requiereCantidad && precioUnitario && !isNaN(cantidadNum) ? cantidadNum * precioUnitario : undefined;
  const acumulado = !isNaN(montoNum) ? montoNum : 0;
  const completo = meta != null && acumulado >= meta;

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

      if (esEdicion) {
        const { saldo_actual } = await FinanzasService.actualizarMovimientoPersona(movimientoEditar!.id, {
          monto: montoNum,
          cantidad: requiereCantidad ? cantidadNum : undefined,
          precio_unitario: requiereCantidad ? precioUnitarioSnapshot : undefined,
          fecha,
        });
        toast.success(`Movimiento actualizado. Nuevo saldo: ${formatMonto(saldo_actual)}`);
      } else {
        const { saldo_actual } = await FinanzasService.registrarMovimientoPersona({
          persona_id: persona.persona_id,
          tipo_movimiento: tipo,
          concepto: conceptoFinal,
          monto: montoNum,
          cantidad: requiereCantidad ? cantidadNum : undefined,
          precio_unitario: requiereCantidad ? conceptoObjSel?.precio_unitario : undefined,
          fecha,
        });
        toast.success(`${tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'} registrado. Nuevo saldo: ${formatMonto(saldo_actual)}`);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el movimiento');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? 'Editar Movimiento' : 'Registrar Movimiento'}
          </DialogTitle>
          <DialogDescription>
            {esEdicion
              ? 'Actualiza el monto acumulado u otros datos de este movimiento.'
              : 'Suma o resta saldo a la cuenta virtual de una persona.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 1. Persona */}
          <div className="space-y-1.5">
            <Label>Persona</Label>
            {esEdicion ? (
              <p className="text-sm font-medium px-3 py-2 rounded-lg border bg-muted/40">
                {persona ? `${persona.nombres} ${persona.apellidos}` : '—'}
              </p>
            ) : (
              <PersonSearchCombobox
                onSelect={setPersona}
                personaVinculada={persona}
                onDesvincular={() => setPersona(null)}
                placeholder="Buscar por nombre o N° documento..."
              />
            )}
          </div>

          {/* 2. Tipo de transacción (biestado, fijo en edición) */}
          <div className="space-y-1.5">
            <Label>Tipo de movimiento</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={esEdicion}
                onClick={() => setTipo('INGRESO')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
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
                disabled={esEdicion}
                onClick={() => setTipo('EGRESO')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
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

          {/* 4. Concepto — fijo en edición */}
          <div className="space-y-1.5">
            <Label>Concepto</Label>
            {esEdicion ? (
              <p className="text-sm font-medium px-3 py-2 rounded-lg border bg-muted/40">{conceptoFinal}</p>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* 4b. Cantidad — solo si el concepto lo requiere */}
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
              {meta != null && (
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-muted-foreground">
                    Meta: <span className="font-medium text-foreground">{formatMonto(meta)}</span> · Acumulado {formatMonto(acumulado)}
                  </span>
                  {completo ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completo
                    </span>
                  ) : (
                    <span className="text-gray-400 font-medium">Pendiente</span>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Si sigues cobrando este mismo concepto, edita este movimiento para sumar el nuevo monto — no crees uno nuevo.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleGuardar} disabled={!puedeGuardar}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Registrar Movimiento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MovimientoPersonaDialog;
