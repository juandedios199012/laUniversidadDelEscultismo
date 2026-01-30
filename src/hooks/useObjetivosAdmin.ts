// ============================================================================
// HOOK: useObjetivosAdmin
// ============================================================================
// Hook personalizado para gestionar objetivos educativos (CRUD)
// Separa la lógica de negocio de la UI
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import ProgresionService, { 
  Objetivo, 
  Etapa, 
  AreaCrecimiento 
} from '../services/progresionService';
import type { ObjetivoEducativoFormData } from '../schemas/objetivoEducativoSchema';

// ============================================================================
// TIPOS
// ============================================================================

export interface FiltrosObjetivos {
  busqueda: string;
  etapa: string;
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
  etapas: Etapa[];
  areas: AreaCrecimiento[];
  
  // Estado
  estado: EstadoCarga;
  filtros: FiltrosObjetivos;
  
  // Estadísticas
  estadisticas: {
    total: number;
    porEtapa: Record<string, number>;
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
  // Estado de datos
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [areas, setAreas] = useState<AreaCrecimiento[]>([]);
  
  // Estado de carga
  const [estado, setEstado] = useState<EstadoCarga>({
    loading: true,
    error: null,
    guardando: false,
  });
  
  // Filtros
  const [filtros, setFiltros] = useState<FiltrosObjetivos>({
    busqueda: '',
    etapa: '',
    area: '',
  });

  // ==========================================================================
  // CARGA INICIAL
  // ==========================================================================

  const cargarDatos = useCallback(async () => {
    setEstado(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [objetivosData, etapasData, areasData] = await Promise.all([
        ProgresionService.obtenerObjetivosAdmin(),
        ProgresionService.obtenerEtapas(),
        ProgresionService.obtenerAreas(),
      ]);
      
      setObjetivos(objetivosData);
      setEtapas(etapasData);
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
  // FILTRADO
  // ==========================================================================

  const objetivosFiltrados = useMemo(() => {
    return objetivos.filter(obj => {
      // Filtro por búsqueda (título, descripción, código)
      const matchBusqueda = !filtros.busqueda || 
        obj.titulo.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        obj.descripcion.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        obj.codigo.toLowerCase().includes(filtros.busqueda.toLowerCase());
      
      // Filtro por etapa
      const matchEtapa = !filtros.etapa || obj.etapa_codigo === filtros.etapa;
      
      // Filtro por área
      const matchArea = !filtros.area || obj.area_codigo === filtros.area;
      
      return matchBusqueda && matchEtapa && matchArea;
    });
  }, [objetivos, filtros]);

  const limpiarFiltros = useCallback(() => {
    setFiltros({ busqueda: '', etapa: '', area: '' });
  }, []);

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  const estadisticas = useMemo(() => {
    const porEtapa: Record<string, number> = {};
    const porArea: Record<string, number> = {};
    
    objetivos.forEach(obj => {
      porEtapa[obj.etapa_codigo] = (porEtapa[obj.etapa_codigo] || 0) + 1;
      porArea[obj.area_codigo] = (porArea[obj.area_codigo] || 0) + 1;
    });
    
    return {
      total: objetivos.length,
      porEtapa,
      porArea,
    };
  }, [objetivos]);

  // ==========================================================================
  // ACCIONES CRUD
  // ==========================================================================

  const crearObjetivo = useCallback(async (datos: ObjetivoEducativoFormData) => {
    setEstado(prev => ({ ...prev, guardando: true }));
    
    try {
      const resultado = await ProgresionService.crearObjetivo({
        etapa_id: datos.etapa_id,
        area_id: datos.area_id,
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        indicadores: datos.indicadores.filter(i => i.trim() !== ''),
      });
      
      // Recargar objetivos para obtener el nuevo con toda la info
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
      
      // Actualizar en el estado local sin recargar todo
      setObjetivos(prev => prev.map(obj => {
        if (obj.id === id) {
          return {
            ...obj,
            ...datos,
            indicadores: datos.indicadores?.filter(i => i.trim() !== '') || obj.indicadores,
          };
        }
        return obj;
      }));
    } finally {
      setEstado(prev => ({ ...prev, guardando: false }));
    }
  }, []);

  const eliminarObjetivo = useCallback(async (id: string) => {
    setEstado(prev => ({ ...prev, guardando: true }));
    
    try {
      await ProgresionService.eliminarObjetivo(id);
      
      // Remover del estado local
      setObjetivos(prev => prev.filter(obj => obj.id !== id));
    } finally {
      setEstado(prev => ({ ...prev, guardando: false }));
    }
  }, []);

  // ==========================================================================
  // RETORNO
  // ==========================================================================

  return {
    // Datos
    objetivos,
    objetivosFiltrados,
    etapas,
    areas,
    
    // Estado
    estado,
    filtros,
    
    // Estadísticas
    estadisticas,
    
    // Acciones
    cargarDatos,
    crearObjetivo,
    actualizarObjetivo,
    eliminarObjetivo,
    
    // Filtros
    setFiltros,
    limpiarFiltros,
  };
}

export default useObjetivosAdmin;
