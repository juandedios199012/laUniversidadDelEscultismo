import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export interface Ubicacion {
  id: string;
  nombre: string;
}

// Almacenes conocidos del grupo como fallback
const UBICACIONES_DEFAULT: Ubicacion[] = [
  { id: 'casa-alberto', nombre: 'Casa de Alberto' },
  { id: 'casa-jesus', nombre: 'Casa de Jesús' },
  { id: 'almacen-principal', nombre: 'Almacén Principal' },
  { id: 'salon-reunion', nombre: 'Salón de Reuniones' },
  { id: 'otro', nombre: 'Otro' },
];

export function useUbicaciones() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarUbicaciones() {
      try {
        setLoading(true);
        setError(null);

        // Fetch distinct ubicaciones already in use from the inventario table
        const { data, error: dbError } = await supabase
          .from('inventario')
          .select('ubicacion')
          .not('ubicacion', 'is', null);

        if (dbError) throw dbError;

        // Combine DB locations with default ones (deduplicated by name)
        const dbUbicaciones: Ubicacion[] = (data || [])
          .map((row: { ubicacion: string }) => row.ubicacion?.trim())
          .filter(Boolean)
          .filter((value, index, self) => self.indexOf(value) === index)
          .map((nombre: string) => ({ id: nombre.toLowerCase().replace(/\s+/g, '-'), nombre }));

        const allNames = new Set(dbUbicaciones.map(u => u.nombre.toLowerCase()));
        const extras = UBICACIONES_DEFAULT.filter(u => !allNames.has(u.nombre.toLowerCase()));

        setUbicaciones([...dbUbicaciones, ...extras]);
      } catch (err) {
        console.warn('⚠️ No se pudo cargar ubicaciones desde BD, usando valores por defecto:', err);
        setUbicaciones(UBICACIONES_DEFAULT);
        setError(err instanceof Error ? err.message : 'Error al cargar ubicaciones');
      } finally {
        setLoading(false);
      }
    }

    cargarUbicaciones();
  }, []);

  return { ubicaciones, loading, error };
}
