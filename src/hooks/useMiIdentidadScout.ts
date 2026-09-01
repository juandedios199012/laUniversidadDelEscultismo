import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { IdentidadService, MiIdentidadScout } from '../services/identidadService';

const SIN_IDENTIDAD: MiIdentidadScout = { esScout: false };

/**
 * ¿El usuario logueado es, él mismo, un scout? Base para restringir
 * vistas a "solo mis datos" (Scouts) y para auto-identificar al
 * jugador en Aprender Haciendo.
 */
export function useMiIdentidadScout() {
  const { user } = useAuth();
  const [identidad, setIdentidad] = useState<MiIdentidadScout>(SIN_IDENTIDAD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIdentidad(SIN_IDENTIDAD);
      setLoading(false);
      return;
    }

    let vigente = true;
    setLoading(true);
    IdentidadService.obtenerMiIdentidadScout()
      .then(resultado => { if (vigente) setIdentidad(resultado); })
      .finally(() => { if (vigente) setLoading(false); });

    return () => { vigente = false; };
  }, [user?.id]);

  return { ...identidad, loading };
}
