import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export interface Ubicacion {
  id: string;
  nombre: string;
}

export function useUbicaciones() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Llama a la función RPC que lee la tabla `ubicaciones`
      const { data, error: dbError } = await supabase.rpc('obtener_ubicaciones');
      if (dbError) throw dbError;

      setUbicaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Error al cargar ubicaciones:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar ubicaciones');
      setUbicaciones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  /**
   * Crea una nueva ubicación en la tabla `ubicaciones` y recarga la lista.
   * Retorna la ubicación creada o null si hubo error.
   */
  const agregarUbicacion = async (nombre: string): Promise<Ubicacion | null> => {
    try {
      const { data, error: dbError } = await supabase.rpc('crear_ubicacion', {
        p_nombre: nombre.trim(),
      });
      if (dbError) throw dbError;
      if (!data?.success) throw new Error(data?.error || 'Error al crear ubicación');

      const nueva: Ubicacion = { id: data.id, nombre: data.nombre };
      // Recargar lista completa para mantener orden alfabético
      await cargar();
      return nueva;
    } catch (err) {
      console.error('❌ Error al agregar ubicación:', err);
      return null;
    }
  };

  return { ubicaciones, loading, error, recargar: cargar, agregarUbicacion };
}
