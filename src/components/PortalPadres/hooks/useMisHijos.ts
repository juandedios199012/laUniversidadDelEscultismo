import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { PortalPadresService, HijoInfo } from '../../../services/portalPadresService';

export interface UseMisHijosResult {
  hijos: HijoInfo[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMisHijos(): UseMisHijosResult {
  const { user } = useAuth();
  const [hijos, setHijos] = useState<HijoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchHijos = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await PortalPadresService.getMisHijos(user.id);

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError);
        setHijos([]);
      } else {
        setHijos(data ?? []);
      }

      setLoading(false);
    };

    fetchHijos();

    return () => {
      cancelled = true;
    };
  }, [user?.id, trigger]);

  const refetch = () => setTrigger(t => t + 1);

  return { hijos, loading, error, refetch };
}
