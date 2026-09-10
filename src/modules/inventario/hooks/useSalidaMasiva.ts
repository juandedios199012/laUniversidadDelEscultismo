import { useState, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { InventarioService } from '../../../services/inventarioService';
import type { InventarioItem } from '../../../lib/supabase';

export interface ParticipanteElegible {
  persona_id: string;
  codigo_asociado: string;
  nombres: string;
  apellidos: string;
}

export interface EntregaFallida {
  persona_id: string;
  error: string;
}

/**
 * Lógica de la metodología "todos reciben, marca las excepciones":
 * carga los participantes elegibles de una rama/fecha, arrancan
 * todos marcados como entregados, y solo se destocan las excepciones.
 * Usada tanto por el modal web (PopUpSalidaMasiva) como por la
 * pantalla mobile (SalidaScreen) — una sola implementación.
 *
 * La primera vez que se carga un ítem nadie tiene una salida
 * registrada todavía, así que el default "todos entregados" es
 * correcto. De ahí en adelante se consulta movimientos_inventario
 * para saber quién ya tiene una salida registrada y no volver a
 * ofrecerlos como pendientes (evita duplicar la entrega/el descuento
 * de stock si se reabre el formulario).
 */
export function useSalidaMasiva(item: InventarioItem) {
  const [rama, setRama] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState('');
  const [responsableNombre, setResponsableNombre] = useState('');

  const [elegibles, setElegibles] = useState<ParticipanteElegible[]>([]);
  const [entregados, setEntregados] = useState<Record<string, boolean>>({});
  const [yaRegistrados, setYaRegistrados] = useState<Set<string>>(new Set());

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ entregados: number; fallidos: EntregaFallida[] } | null>(null);

  const stockDisponible = item.cantidad_disponible ?? 0;
  const totalMarcados = useMemo(
    () => Object.values(entregados).filter(Boolean).length,
    [entregados]
  );
  // Entregas nuevas a registrar: marcadas y sin una salida previa ya
  // guardada en la base de datos (esas no vuelven a descontar stock).
  const totalNuevas = useMemo(
    () => Object.entries(entregados).filter(
      ([personaId, marcado]) => marcado && !yaRegistrados.has(personaId)
    ).length,
    [entregados, yaRegistrados]
  );

  const cargarElegibles = async () => {
    if (!rama) {
      setError('Selecciona la rama.');
      return false;
    }
    setCargando(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('obtener_scouts_elegibles_fecha', {
        p_fecha: fecha,
        p_rama: rama,
      });
      if (rpcError) throw rpcError;

      const lista: ParticipanteElegible[] = (data || []).map((s: any) => ({
        persona_id: s.persona_id,
        codigo_asociado: s.codigo_asociado,
        nombres: s.nombres,
        apellidos: s.apellidos,
      }));

      if (lista.length === 0) {
        setError('No hay participantes elegibles para esa rama y fecha.');
        return false;
      }

      const registrados = await InventarioService.getPersonasConSalidaRegistrada(item.id);

      const inicial: Record<string, boolean> = {};
      lista.forEach(p => { inicial[p.persona_id] = true; });

      setElegibles(lista);
      setEntregados(inicial);
      setYaRegistrados(registrados);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar participantes');
      return false;
    } finally {
      setCargando(false);
    }
  };

  const toggle = (personaId: string) => {
    // Quien ya tiene una salida registrada no se puede "desentregar"
    // desde esta pantalla: el check solo refleja ese estado real.
    if (yaRegistrados.has(personaId)) return;
    setEntregados(prev => ({ ...prev, [personaId]: !prev[personaId] }));
  };

  // Atajo para cuando se entrega a casi todos (dejar el default y
  // marcar excepciones) o a casi nadie (desmarcar todos y elegir a
  // los pocos que sí reciben). Quienes ya están registrados no se
  // ven afectados: su check siempre refleja la base de datos.
  const marcarTodos = (valor: boolean) => {
    setEntregados(prev => {
      const siguiente = { ...prev };
      elegibles.forEach(p => {
        if (!yaRegistrados.has(p.persona_id)) siguiente[p.persona_id] = valor;
      });
      return siguiente;
    });
  };

  const guardar = async () => {
    const personasAEntregar = Object.entries(entregados)
      .filter(([personaId, marcado]) => marcado && !yaRegistrados.has(personaId))
      .map(([personaId]) => personaId);

    if (personasAEntregar.length === 0) {
      setError(
        yaRegistrados.size > 0
          ? 'Todas las personas marcadas ya tenían esta entrega registrada.'
          : 'No marcaste a nadie para entregar.'
      );
      return false;
    }

    setGuardando(true);
    setError(null);

    try {
      const result = await InventarioService.registrarSalidaMasiva({
        item_id: item.id,
        personas: personasAEntregar,
        motivo: motivo.trim() || undefined,
        responsable: responsableNombre.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error ?? 'Error al registrar la salida masiva.');
        return false;
      }

      setResultado({ entregados: result.entregados ?? 0, fallidos: result.fallidos ?? [] });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  return {
    rama, setRama,
    fecha, setFecha,
    motivo, setMotivo,
    responsableNombre, setResponsableNombre,
    elegibles,
    entregados,
    yaRegistrados,
    toggle,
    marcarTodos,
    cargando,
    guardando,
    error,
    resultado,
    stockDisponible,
    totalMarcados,
    totalNuevas,
    cargarElegibles,
    guardar,
  };
}
