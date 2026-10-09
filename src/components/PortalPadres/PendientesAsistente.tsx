/**
 * Asistente que se abre al ingresar al Portal de Padres cuando hay
 * pendientes. Recorre cada hijo/actividad en orden:
 *   1. Anexo 4 en PDF (prellenado) → botón ACEPTO
 *   2. Registro del pago (Efectivo / Yape / Plin)
 * Con 2+ hijos, cada uno tiene su propio Anexo 4; el pago puede hacerse
 * por todos los hermanos de la misma actividad en un solo paso.
 */

import React, { useMemo, useState } from 'react';
import { CheckCircle2, Loader2, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  PortalPadresService,
  ActividadHijo,
  autorizacionPendiente,
  pagoPendiente,
} from '@/services/portalPadresService';
import type { ConfigAnexo4 } from '@/services/configAnexo4Service';
import Anexo4PdfViewer from './Anexo4PdfViewer';
import PagoPadreForm from './PagoPadreForm';
import { formatFechaCorta } from './actividadFormat';

interface PendientesAsistenteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** participante_id a recorrer, en orden. */
  participanteIds: string[];
  actividades: ActividadHijo[];
  config: ConfigAnexo4;
  onRefresh: () => void;
}

type Paso = 'anexo' | 'pago';

const PendientesAsistente: React.FC<PendientesAsistenteProps> = ({
  open,
  onOpenChange,
  participanteIds,
  actividades,
  config,
  onRefresh,
}) => {
  // Marcas locales para avanzar sin esperar al refetch
  const [aceptados, setAceptados] = useState<Set<string>>(new Set());
  const [pagados, setPagados] = useState<Set<string>>(new Set());
  const [omitidos, setOmitidos] = useState<Set<string>>(new Set());
  const [aceptando, setAceptando] = useState(false);
  const [documentoListo, setDocumentoListo] = useState(false);

  const porId = useMemo(() => new Map(actividades.map((a) => [a.participante_id, a])), [actividades]);
  const items = participanteIds.map((id) => porId.get(id)).filter((a): a is ActividadHijo => !!a);

  const pasoDe = (a: ActividadHijo): Paso | null => {
    if (omitidos.has(a.participante_id)) return null;
    if (autorizacionPendiente(a) && !aceptados.has(a.participante_id)) return 'anexo';
    if (pagoPendiente(a) && !pagados.has(a.participante_id)) return 'pago';
    return null;
  };

  const indiceActual = items.findIndex((a) => pasoDe(a) !== null);
  const actual = indiceActual >= 0 ? items[indiceActual] : null;
  const paso = actual ? pasoDe(actual) : null;

  const hermanos = actual
    ? actividades.filter(
        (h) =>
          h.actividad_id === actual.actividad_id &&
          h.participante_id !== actual.participante_id &&
          h.vigente &&
          pagoPendiente(h) &&
          !pagados.has(h.participante_id),
      )
    : [];

  const marcar = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, ids: string[]) =>
    setter((prev) => new Set([...prev, ...ids]));

  const handleAceptar = async () => {
    if (!actual) return;
    setAceptando(true);
    const { success, error } = await PortalPadresService.aceptarAutorizacion(actual.participante_id);
    setAceptando(false);

    if (!success) {
      toast.error(error || 'No se pudo registrar la autorización');
      return;
    }
    toast.success(`Autorización registrada para ${actual.scout_nombre}`);
    setDocumentoListo(false);
    marcar(setAceptados, [actual.participante_id]);
    onRefresh();
  };

  const handleMasTarde = () => {
    if (!actual) return;
    setDocumentoListo(false);
    marcar(setOmitidos, [actual.participante_id]);
  };

  const cerrar = () => {
    onOpenChange(false);
    setAceptados(new Set());
    setPagados(new Set());
    setOmitidos(new Set());
    setDocumentoListo(false);
  };

  const fechas = actual
    ? actual.fecha_fin && actual.fecha_fin !== actual.fecha_inicio
      ? `${formatFechaCorta(actual.fecha_inicio)} – ${formatFechaCorta(actual.fecha_fin)}`
      : formatFechaCorta(actual.fecha_inicio)
    : '';
  const quedaronPendientes = items.filter(
    (a) => omitidos.has(a.participante_id) && (autorizacionPendiente(a) || pagoPendiente(a)),
  );

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : cerrar())}>
      <DialogContent className="max-w-2xl w-full h-[100dvh] sm:h-[92vh] p-0 gap-0 flex flex-col overflow-hidden rounded-none sm:rounded-lg">
        {actual && paso ? (
          <>
            {/* Cabecera */}
            <div className="px-4 sm:px-6 pt-4 pb-3 border-b bg-white pr-12">
              {items.length > 1 && (
                <p className="text-xs font-semibold text-gray-400 mb-1">
                  {indiceActual + 1} de {items.length}
                </p>
              )}
              <DialogTitle className="text-base sm:text-lg leading-tight">
                {actual.scout_nombre}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {actual.nombre} · {fechas}
              </DialogDescription>
              <div className="flex gap-2 mt-3">
                <PasoChip numero={1} label="Autorización" activo={paso === 'anexo'} hecho={paso === 'pago'} />
                <PasoChip numero={2} label="Pago" activo={paso === 'pago'} hecho={false} />
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto bg-gray-100 px-3 sm:px-6 py-4">
              {paso === 'anexo' ? (
                <Anexo4PdfViewer
                  key={actual.participante_id}
                  actividad={actual}
                  config={config}
                  onListo={() => setDocumentoListo(true)}
                />
              ) : (
                <div className="bg-white rounded-xl p-4 sm:p-5">
                  <PagoPadreForm
                    key={actual.participante_id}
                    actividad={actual}
                    hermanos={hermanos}
                    instruccionesPago={config.instrucciones_pago}
                    onPagado={(ids) => {
                      marcar(setPagados, ids);
                      onRefresh();
                    }}
                    accionSecundaria={{ label: 'Pagaré después', onClick: handleMasTarde }}
                  />
                </div>
              )}
            </div>

            {/* Pie: ACEPTO */}
            {paso === 'anexo' && (
              <div className="border-t bg-white px-4 sm:px-6 py-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
                <Button type="button" variant="ghost" onClick={handleMasTarde} disabled={aceptando}>
                  Más tarde
                </Button>
                <Button
                  type="button"
                  onClick={handleAceptar}
                  disabled={aceptando || !documentoListo}
                  className="h-12 sm:h-11 px-10 text-base bg-green-600 hover:bg-green-700 font-bold tracking-wider"
                >
                  {aceptando ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                  )}
                  ACEPTO
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <PartyPopper className="w-14 h-14 text-green-500 mb-4" />
            <DialogTitle className="text-xl mb-2">
              {quedaronPendientes.length === 0 ? '¡Todo listo!' : 'Listo por ahora'}
            </DialogTitle>
            <DialogDescription className="max-w-sm">
              {quedaronPendientes.length === 0
                ? 'Las autorizaciones y pagos quedaron registrados. Los dirigentes ya pueden verlos.'
                : `Quedan pendientes: ${quedaronPendientes
                    .map((a) => `${a.scout_nombre} (${a.nombre})`)
                    .join(', ')}. Te los recordaremos la próxima vez que ingreses.`}
            </DialogDescription>
            <Button type="button" className="mt-6" onClick={cerrar}>
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const PasoChip: React.FC<{ numero: number; label: string; activo: boolean; hecho: boolean }> = ({
  numero,
  label,
  activo,
  hecho,
}) => (
  <span
    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      activo
        ? 'bg-blue-600 text-white'
        : hecho
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-500'
    }`}
  >
    {hecho ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{numero}</span>}
    {label}
  </span>
);

export default PendientesAsistente;
