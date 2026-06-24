/**
 * Registrar Puntaje Dialog — registro de puntaje por patrulla para UN bloque.
 *
 * Mismo flujo simple que PuntajesActividad.tsx (Programación): tabla de
 * patrulla + puntaje (0-100) + observaciones, guardado masivo de una vez.
 * Ya no hay paso de "elegir bloque" (se abre directo desde el bloque) ni
 * tope configurable por bloque.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Trophy, AlertCircle, Loader2 } from 'lucide-react';
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
import { ActividadesExteriorService, PatrullaActividad } from '@/services/actividadesExteriorService';
import { toast } from 'sonner';

interface PuntajePatrulla {
  patrulla_actividad_id: string;
  puntaje: number;
  observaciones: string;
}

interface RegistrarPuntajeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actividadId: string;
  bloqueId: string;
  bloqueNombre: string;
  onSuccess: () => void;
}

const RegistrarPuntajeDialog: React.FC<RegistrarPuntajeDialogProps> = ({
  open,
  onOpenChange,
  actividadId,
  bloqueId,
  bloqueNombre,
  onSuccess,
}) => {
  const [patrullas, setPatrullas] = useState<PatrullaActividad[]>([]);
  const [puntajes, setPuntajes] = useState<Map<string, PuntajePatrulla>>(new Map());
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [patrullasData, puntajesData] = await Promise.all([
        ActividadesExteriorService.listarPatrullasActividad(actividadId),
        ActividadesExteriorService.obtenerPuntajesBloque(bloqueId),
      ]);
      setPatrullas(patrullasData);

      const mapa = new Map<string, PuntajePatrulla>();
      patrullasData.forEach((p) => {
        const existente = puntajesData.find((pu) => pu.patrulla_actividad_id === p.id);
        mapa.set(p.id, {
          patrulla_actividad_id: p.id,
          puntaje: existente?.puntaje || 0,
          observaciones: existente?.observaciones || '',
        });
      });
      setPuntajes(mapa);
    } catch (error) {
      console.error('Error cargando patrullas/puntajes:', error);
      toast.error('Error al cargar patrullas y puntajes');
    } finally {
      setLoading(false);
    }
  }, [actividadId, bloqueId]);

  useEffect(() => {
    if (open) cargarDatos();
  }, [open, cargarDatos]);

  const actualizarPuntaje = (patrullaId: string, campo: 'puntaje' | 'observaciones', valor: string) => {
    setPuntajes((prev) => {
      const nuevo = new Map(prev);
      const actual = nuevo.get(patrullaId) || { patrulla_actividad_id: patrullaId, puntaje: 0, observaciones: '' };
      nuevo.set(patrullaId, {
        ...actual,
        [campo]: campo === 'puntaje' ? (parseInt(valor, 10) || 0) : valor,
      });
      return nuevo;
    });
  };

  const total = Array.from(puntajes.values()).reduce((sum, p) => sum + p.puntaje, 0);

  const guardar = async () => {
    setGuardando(true);
    try {
      const resultado = await ActividadesExteriorService.registrarPuntajesMasivoBloque(
        bloqueId,
        Array.from(puntajes.values()),
      );
      toast.success(`${resultado.puntajes_registrados} puntaje(s) guardado(s)`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error registrando puntajes:', error);
      toast.error('Error al registrar puntajes');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Puntajes por Patrulla
          </DialogTitle>
          <DialogDescription>{bloqueNombre}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : patrullas.length === 0 ? (
          <div className="text-center py-8 px-4">
            <AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="font-medium">No hay patrullas en esta actividad</p>
            <p className="text-sm text-muted-foreground">
              Crea patrullas para esta actividad desde la pestaña "Patrullas".
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Patrulla</th>
                    <th className="px-4 py-2 text-left font-medium w-28">Puntaje</th>
                    <th className="px-4 py-2 text-left font-medium">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {patrullas.map((patrulla) => {
                    const puntaje = puntajes.get(patrulla.id);
                    return (
                      <tr key={patrulla.id}>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                              style={{ backgroundColor: patrulla.color || '#6B7280' }}
                            >
                              {patrulla.icono || patrulla.nombre.charAt(0)}
                            </span>
                            <span className="font-medium">{patrulla.nombre}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={puntaje?.puntaje || 0}
                            onChange={(e) => actualizarPuntaje(patrulla.id, 'puntaje', e.target.value)}
                            className="text-center font-semibold"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={puntaje?.observaciones || ''}
                            onChange={(e) => actualizarPuntaje(patrulla.id, 'observaciones', e.target.value)}
                            placeholder="Opcional..."
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/30">
                  <tr>
                    <td className="px-4 py-2 font-bold">TOTAL</td>
                    <td className="px-4 py-2 font-bold text-center">{total}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={guardar} disabled={guardando || patrullas.length === 0}>
            {guardando ? 'Guardando...' : 'Guardar Puntajes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrarPuntajeDialog;
