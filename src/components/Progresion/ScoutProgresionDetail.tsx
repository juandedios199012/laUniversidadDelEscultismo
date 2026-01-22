// ============================================================================
// SCOUT PROGRESION DETAIL COMPONENT
// ============================================================================
// Vista detallada del progreso de un scout específico
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, Award, Calendar, RefreshCw, AlertCircle,
  CheckCircle, Target, TrendingUp
} from 'lucide-react';
import ProgresionService, { 
  ProgresoCompletoScout, 
  ObjetivoScout,
  Etapa
} from '../../services/progresionService';
import ProgressRing from './ProgressRing';
import StageBadge from './StageBadge';
import { GrowthAreasList } from './GrowthAreasGrid';
import ObjectivesChecklist from './ObjectivesChecklist';

interface ScoutProgresionDetailProps {
  scoutId: string;
  onBack: () => void;
  onUpdate?: () => void;
}

const ScoutProgresionDetail: React.FC<ScoutProgresionDetailProps> = ({
  scoutId,
  onBack,
  onUpdate
}) => {
  // Estado
  const [progreso, setProgreso] = useState<ProgresoCompletoScout | null>(null);
  const [objetivos, setObjetivos] = useState<ObjetivoScout[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingObjetivos, setLoadingObjetivos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingObjetivo, setSavingObjetivo] = useState<string | null>(null);
  
  // Filtros
  const [areaSeleccionada, setAreaSeleccionada] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Cargar datos
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [progresoData, etapasData] = await Promise.all([
        ProgresionService.obtenerProgresoScout(scoutId),
        ProgresionService.obtenerEtapas()
      ]);
      
      setProgreso(progresoData);
      setEtapas(etapasData);
      
      // Cargar objetivos
      if (progresoData) {
        const objetivosData = await ProgresionService.obtenerObjetivosScout(
          scoutId,
          progresoData.etapa_actual_codigo
        );
        setObjetivos(objetivosData);
      }
    } catch (err) {
      console.error('Error al cargar progreso:', err);
      setError('No se pudo cargar el progreso del scout');
    } finally {
      setLoading(false);
    }
  }, [scoutId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Cargar objetivos cuando cambia el área seleccionada
  useEffect(() => {
    if (!progreso) return;
    
    const cargarObjetivosFiltrados = async () => {
      setLoadingObjetivos(true);
      try {
        const objetivosData = await ProgresionService.obtenerObjetivosScout(
          scoutId,
          progreso.etapa_actual_codigo,
          areaSeleccionada || undefined
        );
        setObjetivos(objetivosData);
      } catch (err) {
        console.error('Error al cargar objetivos:', err);
      } finally {
        setLoadingObjetivos(false);
      }
    };
    
    cargarObjetivosFiltrados();
  }, [scoutId, progreso, areaSeleccionada]);

  // Manejar toggle de objetivo
  const handleToggleObjetivo = async (objetivo: ObjetivoScout, completado: boolean) => {
    setSavingObjetivo(objetivo.id);
    
    try {
      if (completado) {
        await ProgresionService.completarObjetivo(scoutId, objetivo.id);
      } else {
        await ProgresionService.desmarcarObjetivo(scoutId, objetivo.id);
      }
      
      // Actualizar lista local
      setObjetivos(prev => prev.map(o => 
        o.id === objetivo.id 
          ? { ...o, completado, fecha_completado: completado ? new Date().toISOString() : null }
          : o
      ));
      
      // Recargar progreso general
      const progresoActualizado = await ProgresionService.obtenerProgresoScout(scoutId);
      setProgreso(progresoActualizado);
      
      onUpdate?.();
    } catch (err) {
      console.error('Error al actualizar objetivo:', err);
    } finally {
      setSavingObjetivo(null);
    }
  };

  // Asignar nueva etapa
  const handleAsignarEtapa = async (etapaCodigo: string) => {
    try {
      await ProgresionService.asignarEtapa(scoutId, etapaCodigo);
      await cargarDatos();
      setMostrarModal(false);
      onUpdate?.();
    } catch (err) {
      console.error('Error al asignar etapa:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando progreso...</p>
        </div>
      </div>
    );
  }

  if (error || !progreso) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Error al cargar</h3>
        <p className="text-gray-600 mb-4">{error || 'Scout no encontrado'}</p>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Volver
          </button>
          <button
            onClick={cargarDatos}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">
            {progreso.scout_nombre}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <StageBadge 
              codigo={progreso.etapa_actual_codigo} 
              nombre={progreso.etapa_actual_nombre}
              icono={progreso.etapa_actual_icono}
            />
            {progreso.fecha_inicio_etapa && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Desde {new Date(progreso.fecha_inicio_etapa).toLocaleDateString('es-PE')}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setMostrarModal(true)}
          className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-2"
        >
          <Award className="w-4 h-4" />
          Cambiar Etapa
        </button>
      </div>

      {/* Tarjeta de progreso general */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Anillo de progreso grande */}
          <div className="flex-shrink-0">
            <ProgressRing
              progress={progreso.progreso_general}
              size={140}
              strokeWidth={10}
              color="#ffffff"
              bgColor="rgba(255,255,255,0.2)"
            />
          </div>
          
          {/* Stats */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 text-center md:text-left">
            <div>
              <p className="text-blue-200 text-sm">Etapa Actual</p>
              <p className="text-xl font-bold flex items-center gap-2 justify-center md:justify-start">
                <span>{progreso.etapa_actual_icono}</span>
                {progreso.etapa_actual_nombre}
              </p>
            </div>
            
            <div>
              <p className="text-blue-200 text-sm">Objetivos</p>
              <p className="text-xl font-bold flex items-center gap-2 justify-center md:justify-start">
                <CheckCircle className="w-5 h-5" />
                {progreso.objetivos_completados} / {progreso.total_objetivos}
              </p>
            </div>
            
            <div>
              <p className="text-blue-200 text-sm">Áreas</p>
              <p className="text-xl font-bold flex items-center gap-2 justify-center md:justify-start">
                <Target className="w-5 h-5" />
                {progreso.areas?.length || 6} áreas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progreso por Áreas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Progreso por Áreas de Crecimiento
          </h2>
          
          {areaSeleccionada && (
            <button
              onClick={() => setAreaSeleccionada(null)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Ver todas las áreas
            </button>
          )}
        </div>
        
        <GrowthAreasList
          areas={progreso.areas || []}
          onAreaClick={(area) => setAreaSeleccionada(
            areaSeleccionada === area.area_codigo ? null : area.area_codigo
          )}
        />
      </div>

      {/* Lista de Objetivos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Objetivos Educativos
            {areaSeleccionada && (
              <span className="text-sm font-normal text-gray-500">
                - Filtrado por área
              </span>
            )}
          </h2>
          
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {objetivos.filter(o => o.completado).length} completados
            </span>
            <span>|</span>
            <span>{objetivos.filter(o => !o.completado).length} pendientes</span>
          </div>
        </div>
        
        <ObjectivesChecklist
          objetivos={objetivos}
          onToggleObjetivo={handleToggleObjetivo}
          groupByArea={!areaSeleccionada}
          showIndicadores={true}
          loading={loadingObjetivos || !!savingObjetivo}
        />
      </div>

      {/* Modal Cambiar Etapa */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Cambiar Etapa de Progresión
            </h3>
            
            <p className="text-gray-600 mb-4">
              Selecciona la nueva etapa para <strong>{progreso.scout_nombre}</strong>:
            </p>
            
            <div className="space-y-3">
              {etapas.map(etapa => (
                <button
                  key={etapa.id}
                  onClick={() => handleAsignarEtapa(etapa.codigo)}
                  disabled={etapa.codigo === progreso.etapa_actual_codigo}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all
                    ${etapa.codigo === progreso.etapa_actual_codigo
                      ? 'border-green-500 bg-green-50 cursor-default'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                    }
                  `}
                >
                  <span className="text-3xl">{etapa.icono}</span>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-800">{etapa.nombre}</p>
                    <p className="text-sm text-gray-500">{etapa.descripcion}</p>
                  </div>
                  {etapa.codigo === progreso.etapa_actual_codigo && (
                    <span className="text-green-600 text-sm font-medium">Actual</span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoutProgresionDetail;
