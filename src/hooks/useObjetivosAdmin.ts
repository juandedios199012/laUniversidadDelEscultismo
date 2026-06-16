// ============================================================================
// HOOK: useObjetivosAdmin
// ============================================================================
// Hook personalizado para gestionar objetivos educativos (CRUD)
// Soporta multi-rama: Manada | Tropa | Comunidad | Clan
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import ProgresionService, { 
  Objetivo, 
  GrupoObjetivo,
  Etapa, 
  AreaCrecimiento,
  RamaCodigo,
} from '../services/progresionService';
import type { ObjetivoEducativoFormData } from '../schemas/objetivoEducativoSchema';

// ============================================================================
// TIPOS
// ============================================================================

export interface FiltrosObjetivos {
  busqueda: string;
  grupo: string;
  area: string;
}

export interface EstadoCarga {
  loading: boolean;
  error: string | null;
  guardando: boolean;
}

export interface UseObjetivosAdminReturn {
  // Datos
  objetivos: Objetivo[];
  objetivosFiltrados: Objetivo[];
  grupos: GrupoObjetivo[];          // grupos de la rama activa
  etapas: Etapa[];                  // etapas de la rama activa
  areas: AreaCrecimiento[];
  
  // Rama activa
  ramaActiva: RamaCodigo;
  setRamaActiva: (rama: RamaCodigo) => void;

  // Estado
  estado: EstadoCarga;
  filtros: FiltrosObjetivos;
  
  // Estadísticas
  estadisticas: {
    total: number;
    porGrupo: Record<string, number>;
    porArea: Record<string, number>;
  };
  
  // Acciones
  cargarDatos: () => Promise<void>;
  crearObjetivo: (datos: ObjetivoEducativoFormData) => Promise<{ id: string; codigo: string }>;
  actualizarObjetivo: (id: string, datos: Partial<ObjetivoEducativoFormData>) => Promise<void>;
  eliminarObjetivo: (id: string) => Promise<void>;
  
  // Filtros
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosObjetivos>>;
  limpiarFiltros: () => void;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useObjetivosAdmin(): UseObjetivosAdminReturn {
  // Rama activa — por defecto Tropa para retrocompatibilidad
  const [ramaActiva, setRamaActivaInternal] = useState<RamaCodigo>('TROPA');

  // Estado de datos (todos, sin filtrar por rama — filtramos en useMemo)
  const [todosObjetivos, setTodosObjetivos] = useState<Objetivo[]>([]);
  const [todosGrupos, setTodosGrupos] = useState<GrupoObjetivo[]>([]);
  const [todasEtapas, setTodasEtapas] = useState<Etapa[]>([]);
  const [areas, setAreas] = useState<AreaCrecimiento[]>([]);
  
  const [estado, setEstado] = useState<EstadoCarga>({
    loading: true,
    error: null,
    guardando: false,
  });
  
  const [filtros, setFiltros] = useState<FiltrosObjetivos>({
    busqueda: '',
    grupo: '',
    area: '',
  });

  // ==========================================================================
  // CARGA INICIAL (carga TODO de una vez — filtrado es client-side)
  // ==========================================================================

  const cargarDatos = useCallback(async () => {
    setEstado(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [objetivosData, gruposData, etapasData, areasData] = await Promise.all([
        ProgresionService.obtenerObjetivosAdmin(),   // sin rama = todos
        ProgresionService.obtenerGruposObjetivo(),   // sin rama = todos
        ProgresionService.obtenerEtapas(),           // sin rama = todas
        ProgresionService.obtenerAreas(),
      ]);
      
      setTodosObjetivos(objetivosData);
      setTodosGrupos(gruposData);
      setTodasEtapas(etapasData);
      setAreas(areasData);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar datos';
      setEstado(prev => ({ ...prev, error: mensaje }));
    } finally {
      setEstado(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ==========================================================================
  // CAMBIO DE RAMA — resetea filtros de grupo/área
  // ==========================================================================

  const setRamaActiva = useCallback((rama: RamaCodigo) => {
    setRamaActivaInternal(rama);
    setFiltros(prev => ({ ...prev, grupo: '', area: '' }));
  }, []);

  // ==========================================================================
  // DERIVADOS POR RAMA ACTIVA
  // ==========================================================================

  const objetivos = useMemo(
    () => todosObjetivos.filter(o => o.grupo_rama === ramaActiva),
    [todosObjetivos, ramaActiva]
  );

  const grupos = useMemo(
    () => todosGrupos.filter(g => g.rama === ramaActiva),
    [todosGrupos, ramaActiva]
  );

  const etapas = useMemo(
    () => todasEtapas.filter(e => e.rama === ramaActiva),
    [todasEtapas, ramaActiva]
  );

  // ==========================================================================
  // FILTRADO SECUNDARIO (búsqueda, grupo, área)
  // ==========================================================================

  const objetivosFiltrados = useMemo(() => {
    return objetivos.filter(obj => {
      const matchBusqueda = !filtros.busqueda || 
        obj.titulo.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        obj.codigo.toLowerCase().includes(filtros.busqueda.toLowerCase());
      
      const matchGrupo = !filtros.grupo || obj.grupo_codigo === filtros.grupo;
      const matchArea  = !filtros.area  || obj.area_codigo  === filtros.area;
      
      return matchBusqueda && matchGrupo && matchArea;
    });
  }, [objetivos, filtros]);

  const limpiarFiltros = useCallback(() => {
    setFiltros({ busqueda: '', grupo: '', area: '' });
  }, []);

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  const estadisticas = useMemo(() => {
    const porGrupo: Record<string, number> = {};
    const porArea: Record<string, number> = {};
    
    objetivos.forEach(obj => {
      if (obj.grupo_codigo) {
        porGrupo[obj.grupo_codigo] = (porGrupo[obj.grupo_codigo] || 0) + 1;
      }
      porArea[obj.area_codigo] = (porArea[obj.area_codigo] || 0) + 1;
    });
    
    return { total: objetivos.length, porGrupo, porArea };
  }, [objetivos]);

  // ==========================================================================
  // ACCIONES CRUD
  // ==========================================================================

  const crearObjetivo = useCallback(async (datos: ObjetivoEducativoFormData) => {
    setEstado(prev => ({ ...prev, guardando: true }));
    try {
      const resultado = await ProgresionService.crearObjetivo({
        etapa_objetivo_grupo_id: datos.etapa_objetivo_grupo_id,
        area_id: datos.area_id,
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        indicadores: datos.indicadores.filter(i => i.trim() !== ''),
      });
      await cargarDatos();
      return resultado;
    } finally {
      setEstado(prev => ({ ...prev, guardando: false }));
    }
  }, [cargarDatos]);

  const actualizarObjetivo = useCallback(async (
    id: string, 
    datos: Partial<ObjetivoEducativoFormData>
  ) => {
    setEstado(prev => ({ ...prev, guardando: true }));
    try {
      await ProgresionService.actualizarObjetivo(id, {
        ...datos,
        indicadores: datos.indicadores?.filter(i => i.trim() !== ''),
      });
      setTodosObjetivos(prev => prev.map(obj => {
        if (obj.id !== id) return obj;
        return {
          ...obj,
          ...datos,
          indicadores: datos.indicadores?.filter(i => i.trim() !== '') || obj.indicadores,
        };
      }));
    } finally {
      setEstado(prev => ({ ...prev, guardando: false }));
    }
  }, []);

  const eliminarObjetivo = useCallback(async (id: string) => {
    setEstado(prev => ({ ...prev, guardando: true }));
    try {
      await ProgresionService.eliminarObjetivo(id);
      setTodosObjetivos(prev => prev.filter(obj => obj.id !== id));
    } finally {
      setEstado(prev => ({ ...prev, guardando: false }));
    }
  }, []);

  // ==========================================================================
  // RETORNO
  // ==========================================================================

  return {
    objetivos,
    objetivosFiltrados,
    grupos,
    etapas,
    areas,
    ramaActiva,
    setRamaActiva,
    estado,
    filtros,
    estadisticas,
    cargarDatos,
    crearObjetivo,
    actualizarObjetivo,
    eliminarObjetivo,
    setFiltros,
    limpiarFiltros,
  };
}

export default useObjetivosAdmin;
