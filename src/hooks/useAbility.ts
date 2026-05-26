import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SeguridadV2Service } from '../services/seguridadV2Service';
import { shouldSkipAuth } from '../config/dev';

// Cache a nivel de módulo para evitar re-fetches
const cache = new Map<string, { keys: string[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Hook de autorización para el sistema de permisos V2.
 *
 * Uso:
 *   const { can, loading } = useAbility();
 *   can('scouts:crear')          → boolean
 *   can('finanzas:exportar:pdf') → boolean
 */
export function useAbility() {
  const { user } = useAuth();
  const skipAuth = shouldSkipAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // En dev se dan todos los permisos sin consultar la BD
    if (skipAuth) {
      setPermissions(['*']); // wildcard: can() siempre devuelve true
      setLoading(false);
      return;
    }

    if (!user?.id) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    const cached = cache.get(user.id);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setPermissions(cached.keys);
      setLoading(false);
      return;
    }

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    SeguridadV2Service.obtenerPermisosUsuario(user.id).then((keys) => {
      cache.set(user.id, { keys, ts: Date.now() });
      setPermissions(keys);
      setLoading(false);
    });
  }, [user?.id, skipAuth]);

  /**
   * Invalida el caché del usuario actual y recarga los permisos.
   * Útil después de que un admin cambia los permisos del propio usuario.
   */
  const recargar = useCallback(async () => {
    if (!user?.id) return;
    cache.delete(user.id);
    fetchedRef.current = false;
    setLoading(true);
    const keys = await SeguridadV2Service.obtenerPermisosUsuario(user.id);
    cache.set(user.id, { keys, ts: Date.now() });
    setPermissions(keys);
    setLoading(false);
  }, [user?.id]);

  /**
   * Verifica si el usuario tiene un permission_key específico.
   * En modo dev (skipAuth) siempre devuelve true.
   */
  const can = useCallback(
    (key: string): boolean => {
      if (skipAuth) return true;
      if (permissions.includes('*')) return true;
      return permissions.includes(key);
    },
    [permissions, skipAuth],
  );

  return { can, loading, permissions, recargar };
}
