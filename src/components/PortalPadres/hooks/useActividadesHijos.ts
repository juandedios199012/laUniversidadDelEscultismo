import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { PortalPadresService, ActividadHijo } from '../../../services/portalPadresService';

export interface UseActividadesHijosResult {
  actividades: ActividadHijo[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Actividades al aire libre de un hijo (o de todos si scoutId es undefined). */
export function useActividadesHijos(scoutId?: string, enabled = true): UseActividadesHijosResult {
  const { user } = useAuth();
  const [actividades, setActividades] = useState<ActividadHijo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!user?.id || !enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchActividades = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await PortalPadresService.getActividadesHijos(scoutId);

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError);
        setActividades([]);
      } else {
        setActividades(data ?? []);
      }

      setLoading(false);
    };

    fetchActividades();

    return () => {
      cancelled = true;
    };
  }, [user?.id, scoutId, enabled, trigger]);

  const refetch = () => setTrigger(t => t + 1);

  return { actividades, loading, error, refetch };
}
