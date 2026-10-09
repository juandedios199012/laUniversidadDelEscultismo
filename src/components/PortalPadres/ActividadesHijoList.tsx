import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, FileSignature, FileText, MapPin, Tent } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ActividadHijo,
  autorizacionPendiente,
  pagoPendiente,
} from '../../services/portalPadresService';
import type { ConfigAnexo4 } from '../../services/configAnexo4Service';
import Anexo4PdfViewer from './Anexo4PdfViewer';
import { formatFechaCorta, formatSoles, MEDIO_PAGO_LABEL } from './actividadFormat';

interface ActividadesHijoListProps {
  actividades: ActividadHijo[];
  config: ConfigAnexo4;
  /** Abre el asistente (Anexo 4 → ACEPTO → pago) para esta inscripción. */
  onCompletar: (participanteId: string) => void;
  emptyMessage?: string;
}

const ActividadesHijoList: React.FC<ActividadesHijoListProps> = ({
  actividades,
  config,
  onCompletar,
  emptyMessage = 'No hay actividades al aire libre registradas.',
}) => {
  const [anexoDe, setAnexoDe] = useState<ActividadHijo | null>(null);

  if (actividades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-gray-100">
        <Tent className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {actividades.map((a) => (
          <ActividadCard
            key={a.participante_id}
            actividad={a}
            onCompletar={() => onCompletar(a.participante_id)}
            onVerAnexo={() => setAnexoDe(a)}
          />
        ))}
      </div>

      {/* Anexo 4 ya aceptado: solo lectura / descarga */}
      <Dialog open={!!anexoDe} onOpenChange={(o) => !o && setAnexoDe(null)}>
        <DialogContent className="max-w-2xl w-full h-[100dvh] sm:h-[92vh] p-0 gap-0 flex flex-col overflow-hidden rounded-none sm:rounded-lg">
          <DialogHeader className="px-4 sm:px-6 py-4 border-b pr-12 text-left">
            <DialogTitle>Anexo 4 · {anexoDe?.scout_nombre}</DialogTitle>
            <DialogDescription>{anexoDe?.nombre}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-gray-100 px-3 sm:px-6 py-4">
            {anexoDe && <Anexo4PdfViewer actividad={anexoDe} config={config} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Tarjeta de actividad
// ─────────────────────────────────────────────────────────────

interface ActividadCardProps {
  actividad: ActividadHijo;
  onCompletar: () => void;
  onVerAnexo: () => void;
}

const ActividadCard: React.FC<ActividadCardProps> = ({ actividad: a, onCompletar, onVerAnexo }) => {
  const fechas = a.fecha_fin && a.fecha_fin !== a.fecha_inicio
    ? `${formatFechaCorta(a.fecha_inicio)} – ${formatFechaCorta(a.fecha_fin)}`
    : formatFechaCorta(a.fecha_inicio);
  const faltaAutorizacion = autorizacionPendiente(a);
  const faltaPago = pagoPendiente(a);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Cabecera */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-gray-800">{a.nombre}</h3>
          {!a.vigente && (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
              Finalizada
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {fechas}
          </span>
          {a.lugar && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {a.lugar}
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {/* Anexo 4 */}
        <div className="px-5 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Autorización (Anexo 4)</p>
            {faltaAutorizacion ? (
              <p className="text-sm font-semibold text-amber-600 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Pendiente
              </p>
            ) : (
              <p className="text-sm font-semibold text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {a.estado_autorizacion === 'EXONERADA' ? 'Exonerada' : 'Aceptada'}
                {a.autorizacion_aceptada_at && (
                  <span className="font-normal text-gray-500">· {formatFechaCorta(a.autorizacion_aceptada_at)}</span>
                )}
              </p>
            )}
          </div>
          {faltaAutorizacion && a.vigente ? (
            <button
              type="button"
              onClick={onCompletar}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <FileSignature className="w-4 h-4" />
              Leer y aceptar
            </button>
          ) : a.autorizacion_aceptada_at ? (
            <button
              type="button"
              onClick={onVerAnexo}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Ver Anexo 4
            </button>
          ) : null}
        </div>

        {/* Pago */}
        <div className="px-5 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-400">
              Pago · {formatSoles(a.monto_a_pagar)}
              {a.fecha_limite_pago && faltaPago && ` · vence ${formatFechaCorta(a.fecha_limite_pago)}`}
            </p>
            {a.pagado_completo ? (
              <p className="text-sm font-semibold text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Pagado
                {a.metodo_pago && (
                  <span className="font-normal text-gray-500">· {MEDIO_PAGO_LABEL[a.metodo_pago] ?? a.metodo_pago}</span>
                )}
              </p>
            ) : faltaPago ? (
              <p className="text-sm font-semibold text-amber-600">
                {a.monto_pagado > 0
                  ? `Pagado ${formatSoles(a.monto_pagado)} · falta ${formatSoles(a.monto_a_pagar - a.monto_pagado)}`
                  : 'Pendiente'}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Sin costo</p>
            )}
          </div>
          {faltaPago && a.vigente && (
            <button
              type="button"
              onClick={onCompletar}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              <span className="font-bold">S/</span>
              {faltaAutorizacion ? 'Pagar' : 'Registrar pago'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActividadesHijoList;
