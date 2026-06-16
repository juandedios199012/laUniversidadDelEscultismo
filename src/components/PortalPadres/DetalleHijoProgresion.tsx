import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import ProgresionService from '../../services/progresionService';
import PortalPadresTab from '../Progresion/tabs/PortalPadresTab';
import type { V4Scout } from '../Progresion/useProgresionData';
import type { HijoInfo } from '../../services/portalPadresService';

// ─────────────────────────────────────────────────────────────
// DetalleHijoProgresion
// Carga el resumen de progresión del scout y lo muestra
// usando el mismo componente PortalPadresTab de Progresión.
// ─────────────────────────────────────────────────────────────

interface Props {
  hijo: HijoInfo;
}

const DetalleHijoProgresion: React.FC<Props> = ({ hijo }) => {
  const [scout, setScout] = useState<V4Scout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      ProgresionService.obtenerProgresoScout(hijo.scout_id),
      ProgresionService.obtenerResumenProgresion(),
    ])
      .then(([detalle, resumen]) => {
        if (cancelled) return;
        const resumenScout = resumen.find((r) => r.scout_id === hijo.scout_id);
        const patrulla = resumenScout?.patrulla_nombre ?? '';

        if (detalle) {
          const v4: V4Scout = {
            id: hijo.scout_id,
            nombre: hijo.nombre_completo,
            codigo: hijo.codigo_asociado ?? '',
            rama: hijo.rama_actual,
            patrulla,
            etapaCodigo: detalle.etapa_actual_codigo,
            etapaNombre: detalle.etapa_actual_nombre,
            progreso: detalle.progreso_general,
            objetivosCompletados: detalle.objetivos_completados,
            totalObjetivos: detalle.total_objetivos,
          };
          setScout(v4);
        } else {
          // Scout existe pero sin datos de progresión aún
          const v4: V4Scout = {
            id: hijo.scout_id,
            nombre: hijo.nombre_completo,
            codigo: hijo.codigo_asociado ?? '',
            rama: hijo.rama_actual,
            patrulla,
            etapaCodigo: '',
            etapaNombre: 'Sin etapa',
            progreso: 0,
            objetivosCompletados: 0,
            totalObjetivos: 0,
          };
          setScout(v4);
        }
      })
      .catch((err) => {
        console.error('Error cargando progresión del hijo:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [hijo.scout_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-sm text-gray-500">Cargando progresión...</span>
      </div>
    );
  }

  if (!scout) {
    return (
      <div className="py-12 text-center text-gray-400 text-sm">
        No se pudo cargar la información de progresión.
      </div>
    );
  }

  // PortalPadresTab espera un array de scouts; pasamos solo el del hijo.
  // El componente auto-selecciona el primero si no hay selección previa.
  return (
    <PortalPadresTab
      loading={false}
      scouts={[scout]}
    />
  );
};

export default DetalleHijoProgresion;
