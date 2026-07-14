/**
 * CuentasPersonasTab
 * Lista los saldos virtuales por persona (contabilidad individual).
 * Permite registrar movimientos y ver el historial (auditoría) de cada uno.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Wallet,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Loader2,
  Pencil,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  FinanzasService,
  SaldoPersona,
  MovimientoPersona,
} from '@/services/finanzasService';
import MovimientoPersonaDialog from '../dialogs/MovimientoPersonaDialog';

const formatMonto = (monto: number): string =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto);

interface CuentasPersonasTabProps {
  puedeCrear: boolean;
  puedeEliminar: boolean;
}

const CuentasPersonasTab: React.FC<CuentasPersonasTabProps> = ({ puedeCrear, puedeEliminar }) => {
  const [saldos, setSaldos] = useState<SaldoPersona[]>([]);
  const [saldoGlobal, setSaldoGlobal] = useState(0);
  const [gananciaNetaGlobal, setGananciaNetaGlobal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [showNuevo, setShowNuevo] = useState(false);

  // Detalle de movimientos de una persona
  const [detallePersona, setDetallePersona] = useState<SaldoPersona | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoPersona[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [movimientoAEditar, setMovimientoAEditar] = useState<MovimientoPersona | null>(null);

  const cargar = useCallback(async (texto?: string) => {
    try {
      setLoading(true);
      const { saldos: data, saldoGlobal: total, gananciaNetaGlobal: gananciaNeta } = await FinanzasService.listarSaldosPersonas(texto);
      setSaldos(data);
      setSaldoGlobal(total);
      setGananciaNetaGlobal(gananciaNeta);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar saldos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Búsqueda con debounce
  useEffect(() => {
    const t = setTimeout(() => cargar(busqueda), 300);
    return () => clearTimeout(t);
  }, [busqueda, cargar]);

  const abrirDetalle = async (persona: SaldoPersona) => {
    setDetallePersona(persona);
    setLoadingDetalle(true);
    try {
      const detalle = await FinanzasService.listarMovimientosPersona(persona.persona_id);
      setMovimientos(detalle.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar movimientos');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const eliminarMovimiento = async (id: string) => {
    if (!window.confirm('¿Eliminar este movimiento? Esta acción no se puede deshacer.')) return;
    try {
      await FinanzasService.eliminarMovimientoPersona(id);
      toast.success('Movimiento eliminado');
      if (detallePersona) await abrirDetalle(detallePersona);
      await cargar(busqueda);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleSuccess = () => {
    cargar(busqueda);
    if (detallePersona) abrirDetalle(detallePersona);
  };

  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar persona por nombre o documento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Saldo total acumulado</p>
            <p className={`text-lg font-bold ${saldoGlobal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatMonto(saldoGlobal)}
            </p>
          </div>
          <div className="text-right border-l pl-3">
            <p className="text-xs text-muted-foreground">Ganancia neta total</p>
            <p className="text-lg font-bold text-emerald-700">
              {formatMonto(gananciaNetaGlobal)}
            </p>
          </div>
          {puedeCrear && (
            <Button onClick={() => setShowNuevo(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Movimiento
            </Button>
          )}
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : saldos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {busqueda ? 'Sin resultados' : 'Aún no hay cuentas con movimientos'}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              {busqueda
                ? 'Ninguna persona coincide con la búsqueda.'
                : 'Registra el primer ingreso o egreso para empezar a llevar la contabilidad individual.'}
            </p>
            {puedeCrear && !busqueda && (
              <Button onClick={() => setShowNuevo(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Movimiento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {saldos.map((s) => (
            <button
              key={s.persona_id}
              type="button"
              onClick={() => abrirDetalle(s)}
              className="text-left rounded-xl border bg-white p-4 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {s.nombres} {s.apellidos}
                  </p>
                  {s.numero_documento && (
                    <p className="text-xs text-muted-foreground">Doc: {s.numero_documento}</p>
                  )}
                </div>
                <div className={`p-2 rounded-full ${s.saldo >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                  <Wallet className={`h-4 w-4 ${s.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">Saldo actual</p>
                <p className={`text-xl font-bold ${s.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatMonto(s.saldo)}
                </p>
                {s.ganancia_neta !== 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ganancia neta: <span className="font-medium text-emerald-700">{formatMonto(s.ganancia_neta)}</span>
                  </p>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 text-emerald-600">
                  <ArrowUpRight className="h-3 w-3" /> {formatMonto(s.total_ingresos)}
                </span>
                <span className="flex items-center gap-1 text-rose-600">
                  <ArrowDownRight className="h-3 w-3" /> {formatMonto(s.total_egresos)}
                </span>
                <Badge variant="secondary" className="ml-auto">
                  {s.movimientos_count} mov.
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Dialog: nuevo movimiento / editar movimiento */}
      <MovimientoPersonaDialog
        open={showNuevo || !!movimientoAEditar}
        onOpenChange={(o) => {
          if (!o) {
            setShowNuevo(false);
            setMovimientoAEditar(null);
          }
        }}
        onSuccess={handleSuccess}
        personaInicial={movimientoAEditar ? detallePersona : undefined}
        movimientoEditar={movimientoAEditar}
      />

      {/* Dialog: detalle/historial de una persona */}
      <Dialog open={!!detallePersona} onOpenChange={(o) => !o && setDetallePersona(null)}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detallePersona?.nombres} {detallePersona?.apellidos}
            </DialogTitle>
            <DialogDescription>
              Saldo actual:{' '}
              <span
                className={`font-semibold ${
                  (detallePersona?.saldo ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatMonto(detallePersona?.saldo ?? 0)}
              </span>
              {(detallePersona?.ganancia_neta ?? 0) !== 0 && (
                <>
                  {' · Ganancia neta: '}
                  <span className="font-semibold text-emerald-700">
                    {formatMonto(detallePersona?.ganancia_neta ?? 0)}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {loadingDetalle ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : movimientos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Sin movimientos registrados.</p>
          ) : (
            <div className="space-y-2">
              {movimientos.map((m) => {
                const meta =
                  m.cantidad != null && m.precio_unitario != null
                    ? m.cantidad * m.precio_unitario
                    : undefined;
                const acumuladoNeto =
                  m.cantidad != null && m.ganancia_unitaria != null
                    ? m.cantidad * m.ganancia_unitaria
                    : undefined;
                const completo = meta != null && m.monto >= meta;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-full ${
                          m.tipo_movimiento === 'INGRESO' ? 'bg-emerald-100' : 'bg-rose-100'
                        }`}
                      >
                        {m.tipo_movimiento === 'INGRESO' ? (
                          <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-rose-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{m.concepto}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-PE')}
                          {m.notas ? ` · ${m.notas}` : ''}
                        </p>
                        {meta != null && (
                          <p className="text-xs mt-0.5 flex items-center gap-1">
                            <span className="text-muted-foreground">
                              Bruto {formatMonto(m.monto)} / {formatMonto(meta)}
                            </span>
                            {completo ? (
                              <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                                <CheckCircle2 className="h-3 w-3" /> Completo
                              </span>
                            ) : (
                              <span className="text-gray-400 font-medium">Pendiente</span>
                            )}
                          </p>
                        )}
                        {acumuladoNeto != null && (
                          <p className="text-xs mt-0.5 text-muted-foreground">
                            Neto: <span className="font-medium text-emerald-700">{formatMonto(acumuladoNeto)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-semibold ${
                          m.tipo_movimiento === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {m.tipo_movimiento === 'INGRESO' ? '+' : '-'}
                        {formatMonto(m.monto)}
                      </span>
                      {puedeCrear && (
                        <button
                          type="button"
                          onClick={() => setMovimientoAEditar(m)}
                          className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar movimiento"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {puedeEliminar && (
                        <button
                          type="button"
                          onClick={() => eliminarMovimiento(m.id)}
                          className="p-1.5 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Eliminar movimiento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {puedeCrear && detallePersona && (
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={() => {
                setShowNuevo(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar movimiento
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CuentasPersonasTab;
