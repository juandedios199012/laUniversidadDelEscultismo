import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export interface PersonaRegistrada {
  id: string;
  nombre: string; // "Nombres Apellidos"
}

export function usePersonasRegistradas() {
  const [personas, setPersonas] = useState<PersonaRegistrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Llama a la función RPC que lee la tabla `personas`
      const { data, error: dbError } = await supabase.rpc('obtener_personas_sistema');
      if (dbError) throw dbError;

      setPersonas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Error al cargar personas del sistema:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar personas');
      setPersonas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return { personas, loading, error, recargar: cargar };
}
