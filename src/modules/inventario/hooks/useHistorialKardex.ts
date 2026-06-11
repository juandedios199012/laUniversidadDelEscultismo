import { useState, useEffect } from 'react';
import { InventarioService } from '../../../services/inventarioService';
import type { MovimientoInventario } from '../../../lib/supabase';

export function useHistorialKardex(materialId: string | null) {
  const [historial, setHistorial] = useState<MovimientoInventario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!materialId) {
      setHistorial([]);
      return;
    }

    async function cargarHistorial() {
      try {
        setLoading(true);
        setError(null);
        const data = await InventarioService.getHistorialItem(materialId as string);
        setHistorial(data);
      } catch (err) {
        console.error('❌ Error al cargar el Kardex:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar historial');
        setHistorial([]);
      } finally {
        setLoading(false);
      }
    }

    cargarHistorial();
  }, [materialId]);

  return { historial, loading, error };
}
