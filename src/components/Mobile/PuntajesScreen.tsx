import { useState, useEffect } from 'react';
import { 
  Award, TrendingUp, Star, AlertCircle, Calendar, ChevronRight, Trophy, 
  Mountain, Tent, ChevronLeft, Lock, Save, ChevronDown, FileText
} from 'lucide-react';
import { ProgramaSemanalService } from '../../services/programaSemanalService';
import { ActividadesExteriorService } from '../../services/actividadesExteriorService';
import { formatFechaLocal } from '../../utils/dateUtils';
import { usePermissions } from '../../contexts/PermissionsContext';
import { CONFIG_PUNTAJES_DEFAULT, formatPuntos, puntajePorPuesto, puestosFaltantes } from '../../utils/puntajes';

// Mismo catálogo que usa Programa Semanal (web) — dirigentes.unidad es
// texto libre, se normaliza contra esto antes de filtrar.
const RAMAS_VALIDAS = ['Manada', 'Tropa', 'Comunidad', 'Clan'];

// ===== TIPOS =====

type ContextoType = 'SEMANAL' | 'AIRE_LIBRE';

interface Programa {
  id: string;
  tema_central: string;
  fecha_inicio: string;
  rama: string;
  observaciones_generales?: string;
  actividades: Actividad[];
}

interface Actividad {
  id: string;
  nombre: string;
  duracion_minutos?: number;
  desarrollo?: string;
  hora_inicio?: string;
  responsable?: string;
  materiales?: string[];
  observaciones?: string;
}

interface Patrulla {
  id: string;
  nombre: string;
  puntaje_actual?: number;
}

interface RankingPatrulla {
  patrulla_id: string;
  patrulla_nombre: string;
  color_patrulla: string;
  total_puntaje: number;
  puntaje_actividades: number;
  puntaje_asistencia: number;
  actividades_participadas: number;
  posicion?: number;
}

// Tipos Aire Libre
interface ActividadAireLibre {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin?: string;
  programas?: ProgramaAireLibre[];
  patrullas_actividad?: PatrullaActividad[];
}

interface ProgramaAireLibre {
  id: string;
  nombre: string;
  fecha: string;
  tipo: string;
  bloques: BloquePrograma[];
}

interface BloquePrograma {
  id: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
}

interface PatrullaActividad {
  id: string;
  nombre: string;
  color?: string;
  icono?: string;
  total_puntaje?: number;
}

// ===== COMPONENTE PRINCIPAL =====

export default function PuntajesScreen() {
  // Permisos
  const { puedeEditar, puedeCrear, esAdmin, miRama } = usePermissions();
  const puedeRegistrarPuntajes = puedeEditar('programa_semanal') || puedeCrear('programa_semanal');
  const puedeRegistrarAireLibre = puedeEditar('actividades_exterior') || puedeCrear('actividades_exterior');

  // Estado común
  const [contexto, setContexto] = useState<ContextoType>('SEMANAL');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Estado Programa Semanal
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [programaSeleccionado, setProgramaSeleccionado] = useState<string>('');
  const [actividadSeleccionada, setActividadSeleccionada] = useState<string>('');
  const [patrullas, setPatrullas] = useState<Patrulla[]>([]);
  const [puntajes, setPuntajes] = useState<Record<string, number>>({});
  // Modo por puesto (por defecto): la BD calcula los puntos con la escala de la rama
  const [modoManual, setModoManual] = useState(false);
  const [puestos, setPuestos] = useState<Record<string, number>>({});
  const [bonificaciones, setBonificaciones] = useState<Record<string, number>>({});
  const [puntosRama, setPuntosRama] = useState(CONFIG_PUNTAJES_DEFAULT.puntos);
  const [ranking, setRanking] = useState<RankingPatrulla[]>([]);
  const [mostrarRanking, setMostrarRanking] = useState(false);
  const [rankingExpandido, setRankingExpandido] = useState(false);
  const [pasoSemanal, setPasoSemanal] = useState<1 | 2 | 3>(1);
  const [detalleExpandido, setDetalleExpandido] = useState(false);

  // Estado Aire Libre
  const [actividadesAireLibre, setActividadesAireLibre] = useState<ActividadAireLibre[]>([]);
  const [actividadALSeleccionada, setActividadALSeleccionada] = useState<ActividadAireLibre | null>(null);
  const [programaALSeleccionado, setProgramaALSeleccionado] = useState<ProgramaAireLibre | null>(null);
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState<BloquePrograma | null>(null);
  const [patrullasActividad, setPatrullasActividad] = useState<PatrullaActividad[]>([]);
  const [puntajesAL, setPuntajesAL] = useState<Record<string, number>>({});
  const [rankingAL, setRankingAL] = useState<PatrullaActividad[]>([]);
  const [rankingALExpandido, setRankingALExpandido] = useState(false);
  const [pasoAL, setPasoAL] = useState<1 | 2 | 3 | 4>(1);

  // Rama del dirigente logueado (PermissionsContext) — null para
  // admins/coordinadores, que ven todos los programas igual que hoy.
  const miRamaFija = !esAdmin && miRama
    ? RAMAS_VALIDAS.find(r => r.toLowerCase() === miRama.trim().toLowerCase()) ?? null
    : null;

  useEffect(() => {
    if (contexto === 'SEMANAL') {
      cargarProgramasSemanales();
    } else {
      cargarActividadesAireLibre();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contexto, miRamaFija]);

  // ===== PROGRAMA SEMANAL =====

  const cargarProgramasSemanales = async () => {
    console.log('📱 Cargando programas semanales...');
    setLoading(true);
    try {
      const programasData = await ProgramaSemanalService.getProgramas(
        miRamaFija ? { rama: miRamaFija } : {}
      );
      
      const programasFormateados: Programa[] = (programasData || []).map((p: any) => ({
        id: p.id,
        tema_central: p.tema_central || 'Sin tema',
        fecha_inicio: p.fecha_inicio,
        rama: p.rama || 'N/A',
        observaciones_generales: p.observaciones_generales || '',
        actividades: (p.actividades || p.programa_actividades || []).map((act: any) => ({
          id: act.id,
          nombre: act.nombre || 'Sin nombre',
          duracion_minutos: act.duracion_minutos,
          desarrollo: act.desarrollo || act.descripcion || '',
          hora_inicio: act.hora_inicio || '',
          responsable: act.responsable || '',
          materiales: Array.isArray(act.materiales)
            ? act.materiales.filter((m: any) => typeof m === 'string' && m.trim())
            : [],
          observaciones: act.observaciones || ''
        }))
      })).filter(p => p.actividades.length > 0);
      
      setProgramas(programasFormateados);
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarPrograma = (programaId: string) => {
    setProgramaSeleccionado(programaId);
    setActividadSeleccionada('');
    setPatrullas([]);
    setPuntajes({});
    setPuestos({});
    setBonificaciones({});
    setPasoSemanal(2);
    cargarRankingPrograma(programaId);
    const programa = programas.find(p => p.id === programaId);
    if (programa) {
      ProgramaSemanalService.obtenerConfigPuntajesRama(programa.rama)
        .then(cfg => setPuntosRama(cfg.puntos));
    }
  };

  const cargarRankingPrograma = async (programaId: string) => {
    try {
      const rankingData = await ProgramaSemanalService.obtenerTotalesPrograma(programaId);
      const rankingConPosiciones = (rankingData || [])
        .sort((a, b) => b.total_puntaje - a.total_puntaje)
        .map((patrulla, index) => ({ ...patrulla, posicion: index + 1 }));
      
      setRanking(rankingConPosiciones);
      setMostrarRanking(rankingConPosiciones.length > 0);
    } catch (error) {
      console.error('❌ Error ranking:', error);
      setRanking([]);
      setMostrarRanking(false);
    }
  };

  const seleccionarActividadSemanal = async (actividadId: string) => {
    setActividadSeleccionada(actividadId);
    setDetalleExpandido(false);
    const programa = programas.find(p => p.id === programaSeleccionado);
    if (!programa) return;

    setLoading(true);
    try {
      const patrullasData = await ProgramaSemanalService.obtenerPatrullasPorRama(programa.rama);
      const puntajesExistentes = await ProgramaSemanalService.obtenerPuntajesActividad(actividadId);
      
      const puntajesMap: Record<string, number> = {};
      const puestosMap: Record<string, number> = {};
      const bonifMap: Record<string, number> = {};
      puntajesExistentes.forEach(p => {
        puntajesMap[p.patrulla_id] = p.puntaje;
        if (p.puesto) puestosMap[p.patrulla_id] = p.puesto;
        if (p.bonificacion) bonifMap[p.patrulla_id] = p.bonificacion;
      });
      // Puntajes antiguos cargados a mano (sin puesto) se abren en modo manual
      const hayManuales = puntajesExistentes.some(p => !p.puesto && p.puntaje > 0);
      setModoManual(hayManuales);
      setPuestos(puestosMap);
      setBonificaciones(bonifMap);
      
      setPatrullas((patrullasData || []).map(p => ({
        id: p.id,
        nombre: p.nombre,
        puntaje_actual: 0
      })));
      setPuntajes(puntajesMap);
      setPasoSemanal(3);
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const guardarPuntajesSemanal = async () => {
    if (!puedeRegistrarPuntajes) {
      setMensaje('🔒 No tienes permisos para registrar puntajes');
      return;
    }

    if (!actividadSeleccionada) {
      setMensaje('⚠️ Selecciona una actividad');
      return;
    }

    let puntajesArray: Array<{ patrulla_id: string; puntaje?: number; puesto?: number; bonificacion?: number; observaciones?: string }>;

    if (modoManual) {
      puntajesArray = Object.entries(puntajes)
        .filter(([_, puntaje]) => puntaje > 0)
        .map(([patrullaId, puntaje]) => ({ patrulla_id: patrullaId, puntaje, observaciones: '' }));
      if (puntajesArray.length === 0) {
        setMensaje('⚠️ Ingresa al menos un puntaje');
        return;
      }
    } else {
      if (faltantes.length > 0) {
        setMensaje(`⚠️ Falta asignar el ${faltantes.join('°, ')}° puesto`);
        return;
      }
      puntajesArray = Object.entries(puestos).map(([patrullaId, puesto]) => ({
        patrulla_id: patrullaId,
        puesto,
        bonificacion: bonificaciones[patrullaId] || 0,
        observaciones: ''
      }));
      if (puntajesArray.length === 0) {
        setMensaje('⚠️ Asigna el puesto de al menos una patrulla');
        return;
      }
    }

    setLoading(true);
    try {
      const result = await ProgramaSemanalService.registrarPuntajesMasivo({
        actividad_id: actividadSeleccionada,
        puntajes: puntajesArray,
        // Lo que se desmarcó en pantalla se quita de la actividad
        reemplazar: true
      });

      if (result.success) {
        setMensaje(`✅ ${result.puntajes_registrados} puntajes guardados`);
        if (programaSeleccionado) {
          await cargarRankingPrograma(programaSeleccionado);
        }
        setTimeout(() => setMensaje(''), 3000);
      } else {
        setMensaje(`❌ ${result.error}`);
      }
    } catch (error) {
      setMensaje('❌ Error al guardar puntajes');
    } finally {
      setLoading(false);
    }
  };

  const volverAProgramas = () => {
    setPasoSemanal(1);
    setProgramaSeleccionado('');
    setActividadSeleccionada('');
    setPatrullas([]);
    setPuntajes({});
    setRanking([]);
    setMostrarRanking(false);
    setRankingExpandido(false);
  };

  const volverAActividades = () => {
    setPasoSemanal(2);
    setActividadSeleccionada('');
    setPatrullas([]);
    setPuntajes({});
    setPuestos({});
    setBonificaciones({});
  };

  const handlePuntajeChange = (patrullaId: string, valor: string) => {
    const valorNum = parseInt(valor) || 0;
    setPuntajes({ ...puntajes, [patrullaId]: valorNum });
  };

  // Tocar el puesto ya elegido lo desmarca. Empates: varias patrullas con el mismo puesto.
  const togglePuesto = (patrullaId: string, puesto: number) => {
    const nuevos = { ...puestos };
    if (nuevos[patrullaId] === puesto) delete nuevos[patrullaId];
    else nuevos[patrullaId] = puesto;
    setPuestos(nuevos);
  };

  const handleBonificacionChange = (patrullaId: string, valor: string) => {
    setBonificaciones({ ...bonificaciones, [patrullaId]: parseInt(valor) || 0 });
  };

  // La escala se arma con las patrullas que tienen puesto (igual que la BD)
  const patrullasConPuesto = Object.keys(puestos).length;
  // Puestos consecutivos: 1°, 1°, 2° es válido; 1°, 1°, 3° no (el empate no salta puestos)
  const faltantes = puestosFaltantes(Object.values(puestos));
  const puntosDePuesto = (puesto: number) => puntajePorPuesto(puntosRama, patrullasConPuesto, puesto);

  // ===== AIRE LIBRE =====

  const cargarActividadesAireLibre = async () => {
    console.log('🏕️ Cargando actividades Aire Libre...');
    setLoading(true);
    try {
      const { actividades } = await ActividadesExteriorService.listarActividades({
        estado: 'en_curso',
        limite: 50
      });
      
      // Cargar detalles completos de cada actividad
      const actividadesConDetalles: ActividadAireLibre[] = [];
      for (const act of actividades) {
        try {
          const detalle = await ActividadesExteriorService.obtenerActividad(act.id);
          actividadesConDetalles.push({
            id: act.id,
            codigo: act.codigo,
            nombre: act.nombre,
            tipo: act.tipo,
            estado: act.estado,
            fecha_inicio: act.fecha_inicio,
            fecha_fin: act.fecha_fin,
            // Leídos de la BD: programas y bloques siempre traen id (en el servicio es opcional por la creación)
            programas: (detalle.programas || []) as ProgramaAireLibre[],
            patrullas_actividad: detalle.patrullas_actividad || []
          });
        } catch (e) {
          console.warn('Error cargando detalle:', act.id);
        }
      }
      
      setActividadesAireLibre(actividadesConDetalles);
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarActividadAL = async (actividad: ActividadAireLibre) => {
    setActividadALSeleccionada(actividad);
    setPatrullasActividad(actividad.patrullas_actividad || []);
    
    // Cargar ranking
    try {
      const rankingData = await ActividadesExteriorService.rankingPatrullasActividad(actividad.id);
      setRankingAL(rankingData);
    } catch (e) {
      console.warn('Error cargando ranking AL');
    }
    
    setPasoAL(2);
  };

  const seleccionarProgramaAL = (programa: ProgramaAireLibre) => {
    setProgramaALSeleccionado(programa);
    setBloqueSeleccionado(null);
    setPasoAL(3);
  };

  const seleccionarBloqueAL = async (bloque: BloquePrograma) => {
    setBloqueSeleccionado(bloque);
    setPuntajesAL({});
    setPasoAL(4);
    
    // Cargar puntajes existentes para este bloque
    try {
      const puntajesExistentes = await ActividadesExteriorService.obtenerPuntajesBloqueMapa(bloque.id);
      if (Object.keys(puntajesExistentes).length > 0) {
        setPuntajesAL(puntajesExistentes);
      }
    } catch (error) {
      console.warn('Error cargando puntajes existentes:', error);
    }
  };

  const handlePuntajeALChange = (patrullaId: string, valor: string) => {
    const valorNum = parseInt(valor) || 0;
    setPuntajesAL({ ...puntajesAL, [patrullaId]: valorNum });
  };

  const guardarPuntajesAL = async () => {
    if (!puedeRegistrarAireLibre) {
      setMensaje('🔒 No tienes permisos para registrar puntajes');
      return;
    }

    if (!bloqueSeleccionado) {
      setMensaje('⚠️ Selecciona un bloque');
      return;
    }

    const puntajesConValor = Object.entries(puntajesAL).filter(([_, v]) => v > 0);
    if (puntajesConValor.length === 0) {
      setMensaje('⚠️ Ingresa al menos un puntaje');
      return;
    }

    setLoading(true);
    let guardados = 0;
    let errores = 0;

    for (const [patrullaId, puntaje] of puntajesConValor) {
      try {
        await ActividadesExteriorService.registrarPuntaje({
          bloque_id: bloqueSeleccionado.id,
          patrulla_id: patrullaId,
          puntaje
        });
        guardados++;
      } catch (e) {
        console.error('Error guardando puntaje:', e);
        errores++;
      }
    }

    if (errores === 0) {
      setMensaje(`✅ ${guardados} puntajes guardados`);
      // Recargar ranking
      if (actividadALSeleccionada) {
        const rankingData = await ActividadesExteriorService.rankingPatrullasActividad(actividadALSeleccionada.id);
        setRankingAL(rankingData);
      }
    } else {
      setMensaje(`⚠️ ${guardados} guardados, ${errores} errores`);
    }

    setTimeout(() => setMensaje(''), 3000);
    setLoading(false);
  };

  const volverAActividadesAL = () => {
    setPasoAL(1);
    setActividadALSeleccionada(null);
    setProgramaALSeleccionado(null);
    setBloqueSeleccionado(null);
    setPuntajesAL({});
    setRankingAL([]);
  };

  const volverAProgramasAL = () => {
    setPasoAL(2);
    setProgramaALSeleccionado(null);
    setBloqueSeleccionado(null);
    setPuntajesAL({});
  };

  const volverABloquesAL = () => {
    setPasoAL(3);
    setBloqueSeleccionado(null);
    setPuntajesAL({});
  };

  const tipoEmojis: Record<string, string> = {
    'CAMPAMENTO': '🏕️',
    'EXCURSION': '🥾',
    'CAMINATA': '🚶',
    'SALIDA': '🌄',
    'SERVICIO': '🤝'
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header con selector de contexto */}
      <div className="bg-linear-to-r from-yellow-400 to-orange-500 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Award className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Puntajes</h2>
          </div>
        </div>
        
        {/* Selector de contexto */}
        <div className="flex bg-white/20 rounded-lg p-1 mb-3">
          <button
            onClick={() => { setContexto('SEMANAL'); setPasoSemanal(1); }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              contexto === 'SEMANAL' 
                ? 'bg-white text-yellow-600 shadow-sm' 
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Semanal
          </button>
          <button
            onClick={() => { setContexto('AIRE_LIBRE'); setPasoAL(1); }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              contexto === 'AIRE_LIBRE' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            <Tent className="w-4 h-4" />
            Aire Libre
          </button>
        </div>

        <p className="text-yellow-50 text-sm">
          {contexto === 'SEMANAL' && (
            <>
              {pasoSemanal === 1 && '1️⃣ Selecciona un programa semanal'}
              {pasoSemanal === 2 && '2️⃣ Selecciona una actividad'}
              {pasoSemanal === 3 && '3️⃣ Asigna puntos a las patrullas'}
            </>
          )}
          {contexto === 'AIRE_LIBRE' && (
            <>
              {pasoAL === 1 && '1️⃣ Selecciona una actividad'}
              {pasoAL === 2 && '2️⃣ Selecciona un día/programa'}
              {pasoAL === 3 && '3️⃣ Selecciona un bloque'}
              {pasoAL === 4 && '4️⃣ Asigna puntos a las patrullas'}
            </>
          )}
        </p>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          mensaje.includes('✅') ? 'bg-green-50 text-green-800' : 
          mensaje.includes('🔒') ? 'bg-yellow-50 text-yellow-800' :
          'bg-red-50 text-red-800'
        }`}>
          {mensaje.includes('🔒') && <Lock className="w-4 h-4" />}
          {mensaje}
        </div>
      )}

      {/* ========== PROGRAMA SEMANAL ========== */}
      {contexto === 'SEMANAL' && (
        <>
          {/* PASO 1: Lista de Programas */}
          {pasoSemanal === 1 && (
            <>
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando programas...</p>
                </div>
              )}

              {!loading && programas.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-semibold mb-2">No hay programas disponibles</p>
                  <p className="text-sm text-gray-500">
                    Crea programas semanales desde el sistema web
                  </p>
                </div>
              )}

              {!loading && programas.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Programas Semanales ({programas.length})
                  </h3>

                  {programas.map(programa => (
                    <button
                      key={programa.id}
                      onClick={() => seleccionarPrograma(programa.id)}
                      className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all active:scale-98 text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{programa.tema_central}</h4>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">📅 {formatFechaLocal(programa.fecha_inicio)}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            programa.rama === 'Manada' ? 'bg-yellow-100 text-yellow-800' :
                            programa.rama === 'Tropa' ? 'bg-green-100 text-green-800' :
                            programa.rama === 'Comunidad' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {programa.rama}
                          </span>
                          <span className="text-gray-500">{programa.actividades.length} act.</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* PASO 2: Actividades del Programa */}
          {pasoSemanal === 2 && (
            <>
              <button onClick={volverAProgramas} className="text-blue-600 font-medium flex items-center space-x-1">
                <ChevronLeft className="w-4 h-4" />
                <span>Volver a programas</span>
              </button>

              {(() => {
                const programa = programas.find(p => p.id === programaSeleccionado);
                if (!programa) return null;

                return (
                  <>
                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium">Programa:</p>
                      <p className="text-blue-900 font-semibold">{programa.tema_central}</p>
                      <p className="text-sm text-blue-600 mt-1">📅 {formatFechaLocal(programa.fecha_inicio)} • 🏕️ {programa.rama}</p>
                      {programa.observaciones_generales && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <p className="text-sm text-blue-600 font-medium">Observaciones generales:</p>
                          <p className="text-sm text-blue-900 whitespace-pre-line wrap-break-word">{programa.observaciones_generales}</p>
                        </div>
                      )}
                    </div>

                    {/* Ranking compacto */}
                    {mostrarRanking && ranking.length > 0 && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {ranking.slice(0, 3).map((p, i) => (
                            <div key={p.patrulla_id} className={`rounded-lg p-2 text-white shadow-xs ${
                              i === 0 ? 'bg-linear-to-br from-yellow-400 to-yellow-500' :
                              i === 1 ? 'bg-linear-to-br from-gray-300 to-gray-400' :
                              'bg-linear-to-br from-orange-400 to-orange-500'
                            }`}>
                              <div className="text-center">
                                <div className="text-lg font-bold">{formatPuntos(p.total_puntaje)}</div>
                                <div className="text-[10px] opacity-90">{i + 1}° Lugar</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => setRankingExpandido(!rankingExpandido)}
                          className="w-full bg-linear-to-r from-purple-600 to-purple-700 text-white py-2.5 rounded-lg font-medium text-sm shadow-md flex items-center justify-center space-x-2"
                        >
                          <Trophy className="w-4 h-4" />
                          <span>{rankingExpandido ? 'Ocultar' : 'Ver'} Ranking</span>
                          <span>{rankingExpandido ? '▲' : '▼'}</span>
                        </button>

                        {rankingExpandido && (
                          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="divide-y">
                              {ranking.map((patrulla, index) => (
                                <div key={patrulla.patrulla_id} className="flex items-center p-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${
                                    index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-800">{patrulla.patrulla_nombre}</div>
                                    <div className="text-xs text-gray-500">
                                      {patrulla.actividades_participadas} act.: {formatPuntos(patrulla.puntaje_actividades)}
                                      {' · '}asistencia: {formatPuntos(patrulla.puntaje_asistencia)}
                                    </div>
                                  </div>
                                  <div className="text-xl font-bold text-purple-600">{formatPuntos(patrulla.total_puntaje)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-700">Actividades ({programa.actividades.length})</h3>
                      {programa.actividades.map(actividad => (
                        <button
                          key={actividad.id}
                          onClick={() => seleccionarActividadSemanal(actividad.id)}
                          className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-800">{actividad.nombre}</h4>
                              {actividad.duracion_minutos && (
                                <p className="text-sm text-gray-500 mt-1">⏱️ {actividad.duracion_minutos} min</p>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {/* PASO 3: Asignar Puntajes */}
          {pasoSemanal === 3 && (
            <>
              <button onClick={volverAActividades} className="text-blue-600 font-medium flex items-center space-x-1">
                <ChevronLeft className="w-4 h-4" />
                <span>Volver a actividades</span>
              </button>

              {/* Detalle de la actividad (definido en Programa Semanal web).
                  Colapsado por defecto para no empujar la lista de patrullas. */}
              {(() => {
                const act = programas
                  .find(p => p.id === programaSeleccionado)
                  ?.actividades.find(a => a.id === actividadSeleccionada);
                if (!act) return null;
                const tieneDetalle = !!(act.desarrollo || act.materiales?.length || act.observaciones || act.responsable);
                return (
                  <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
                    <button
                      onClick={() => tieneDetalle && setDetalleExpandido(!detalleExpandido)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" /> Actividad
                          </p>
                          <h4 className="font-semibold text-gray-800">{act.nombre}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {act.hora_inicio && <>🕐 {act.hora_inicio.slice(0, 5)} </>}
                            {act.duracion_minutos ? <>⏱️ {act.duracion_minutos} min</> : null}
                          </p>
                        </div>
                        {tieneDetalle && (
                          <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${detalleExpandido ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                      {act.desarrollo && !detalleExpandido && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2 whitespace-pre-line">{act.desarrollo}</p>
                      )}
                      {tieneDetalle && !detalleExpandido && (
                        <p className="text-xs text-blue-600 font-medium mt-1">Ver desarrollo completo</p>
                      )}
                    </button>
                    {detalleExpandido && (
                      <div className="border-t border-gray-100">
                      {/* Altura máxima con scroll interno: un desarrollo largo no
                          empuja la sección de puntajes fuera de la pantalla. */}
                      <div className="px-4 pt-3 pb-2 space-y-3 text-sm max-h-[40vh] overflow-y-auto overscroll-contain">
                        {act.desarrollo && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Desarrollo</p>
                            <p className="text-gray-700 whitespace-pre-line">{act.desarrollo}</p>
                          </div>
                        )}
                        {act.responsable && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Responsable</p>
                            <p className="text-gray-700">{act.responsable}</p>
                          </div>
                        )}
                        {act.materiales && act.materiales.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Materiales</p>
                            <ul className="list-disc list-inside text-gray-700">
                              {act.materiales.map((m, i) => <li key={i}>{m}</li>)}
                            </ul>
                          </div>
                        )}
                        {act.observaciones && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Observaciones</p>
                            <p className="text-gray-700 whitespace-pre-line">{act.observaciones}</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setDetalleExpandido(false)}
                        className="w-full px-4 py-2 text-xs text-blue-600 font-medium border-t border-gray-100 flex items-center justify-center gap-1"
                      >
                        <ChevronDown className="w-3.5 h-3.5 rotate-180" /> Ocultar detalle
                      </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando...</p>
                </div>
              ) : patrullas.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-semibold mb-2">No hay patrullas</p>
                  <p className="text-sm text-gray-500">Crea patrullas desde el sistema web</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Asignar Puntajes
                      {!puedeRegistrarPuntajes && (
                        <Lock className="w-4 h-4 ml-2 text-yellow-600" />
                      )}
                    </h3>
                    <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
                      <button
                        onClick={() => setModoManual(false)}
                        className={`px-3 py-1.5 rounded-md ${!modoManual ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500'}`}
                      >
                        Por puesto
                      </button>
                      <button
                        onClick={() => setModoManual(true)}
                        className={`px-3 py-1.5 rounded-md ${modoManual ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500'}`}
                      >
                        Manual
                      </button>
                    </div>
                  </div>

                  {!modoManual && (
                    <p className="text-xs text-gray-500">
                      Toca el puesto de cada patrulla. En un empate, elige el mismo puesto para ambas.
                      {patrullasConPuesto > 0 && (
                        <> Escala: {Array.from({ length: patrullasConPuesto }, (_, i) => puntosDePuesto(i + 1)).join(', ')}</>
                      )}
                    </p>
                  )}
                  {!modoManual && faltantes.length > 0 && (
                    <p className="text-xs text-red-600">
                      Falta el {faltantes.join('°, ')}° puesto: después de un empate sigue el puesto siguiente (1°, 1°, 2°).
                    </p>
                  )}

                  {patrullas.map(patrulla => {
                    if (modoManual) {
                      const puntajeActual = puntajes[patrulla.id];
                      const tienePuntaje = puntajeActual !== undefined && puntajeActual > 0;
                      return (
                        <div key={patrulla.id} className={`bg-white rounded-xl p-4 shadow border-2 transition-all ${
                          tienePuntaje ? 'border-green-400 bg-green-50' : 'border-gray-200'
                        }`}>
                          <div className="flex items-center space-x-2 mb-3">
                            <Star className={`w-5 h-5 ${tienePuntaje ? 'text-green-500' : 'text-yellow-500'}`} />
                            <span className="font-semibold">{patrulla.nombre}</span>
                            {tienePuntaje && (
                              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">✓</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              value={puntajeActual || ''}
                              onChange={(e) => handlePuntajeChange(patrulla.id, e.target.value)}
                              disabled={!puedeRegistrarPuntajes}
                              placeholder="Puntos"
                              className={`flex-1 p-3 border-2 rounded-lg text-lg text-center font-semibold transition-all ${
                                !puedeRegistrarPuntajes ? 'bg-gray-100 cursor-not-allowed' :
                                tienePuntaje ? 'border-green-400 bg-white text-green-700' : 'border-gray-300 text-gray-700'
                              }`}
                            />
                            <span className="text-gray-500">pts</span>
                          </div>
                        </div>
                      );
                    }

                    const puesto = puestos[patrulla.id];
                    const bonif = bonificaciones[patrulla.id] || 0;
                    const base = puesto ? puntosDePuesto(puesto) : 0;
                    return (
                      <div key={patrulla.id} className={`bg-white rounded-xl p-4 shadow border-2 transition-all ${
                        puesto ? 'border-green-400 bg-green-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Star className={`w-5 h-5 ${puesto ? 'text-green-500' : 'text-yellow-500'}`} />
                            <span className="font-semibold">{patrulla.nombre}</span>
                          </div>
                          {puesto && (
                            <span className="text-lg font-bold text-green-700">
                              {base + bonif} pts
                              {bonif !== 0 && (
                                <span className="block text-[10px] font-normal text-gray-500 text-right">
                                  {base} {bonif > 0 ? '+' : '−'} {Math.abs(bonif)}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {patrullas.map((_, i) => {
                            const n = i + 1;
                            const activo = puesto === n;
                            return (
                              <button
                                key={n}
                                onClick={() => togglePuesto(patrulla.id, n)}
                                disabled={!puedeRegistrarPuntajes}
                                className={`w-11 h-11 rounded-full font-bold text-sm border-2 transition-all disabled:opacity-50 ${
                                  activo
                                    ? n === 1 ? 'bg-yellow-400 border-yellow-500 text-white'
                                      : n === 2 ? 'bg-gray-400 border-gray-500 text-white'
                                      : n === 3 ? 'bg-orange-400 border-orange-500 text-white'
                                      : 'bg-blue-500 border-blue-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-600'
                                }`}
                              >
                                {n}°
                              </button>
                            );
                          })}
                        </div>
                        {puesto && (
                          <div className="flex items-center space-x-2 mt-3">
                            <span className="text-sm text-gray-600">Extra</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={bonif || ''}
                              onChange={(e) => handleBonificacionChange(patrulla.id, e.target.value)}
                              disabled={!puedeRegistrarPuntajes}
                              placeholder="0"
                              className="w-24 p-2 border-2 border-gray-300 rounded-lg text-center font-semibold"
                            />
                            <span className="text-xs text-gray-400">pts adicionales (o negativos)</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={guardarPuntajesSemanal}
                    disabled={loading || !puedeRegistrarPuntajes}
                    className="w-full bg-linear-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>⏳ Guardando...</>
                    ) : !puedeRegistrarPuntajes ? (
                      <><Lock className="w-5 h-5" /> Sin permisos</>
                    ) : (
                      <><Save className="w-5 h-5" /> Guardar Puntajes</>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ========== AIRE LIBRE ========== */}
      {contexto === 'AIRE_LIBRE' && (
        <>
          {/* PASO 1: Lista de Actividades */}
          {pasoAL === 1 && (
            <>
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando actividades...</p>
                </div>
              )}

              {!loading && actividadesAireLibre.length === 0 && (
                <div className="text-center py-12">
                  <Mountain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-semibold mb-2">No hay actividades en progreso</p>
                  <p className="text-sm text-gray-500">
                    Inicia una actividad desde el sistema web
                  </p>
                </div>
              )}

              {!loading && actividadesAireLibre.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700 flex items-center">
                    <Tent className="w-5 h-5 mr-2" />
                    Actividades en Progreso ({actividadesAireLibre.length})
                  </h3>

                  {actividadesAireLibre.map(actividad => (
                    <button
                      key={actividad.id}
                      onClick={() => seleccionarActividadAL(actividad)}
                      className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all active:scale-98 text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{tipoEmojis[actividad.tipo] || '🏕️'}</span>
                          <h4 className="font-semibold text-gray-800">{actividad.nombre}</h4>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">📅 {formatFechaLocal(actividad.fecha_inicio)}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            {actividad.patrullas_actividad?.length || 0} patrullas
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {actividad.programas?.length || 0} días
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* PASO 2: Programas/Días de la Actividad */}
          {pasoAL === 2 && actividadALSeleccionada && (
            <>
              <button onClick={volverAActividadesAL} className="text-blue-600 font-medium flex items-center space-x-1">
                <ChevronLeft className="w-4 h-4" />
                <span>Volver a actividades</span>
              </button>

              <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
                <p className="text-sm text-orange-600 font-medium">Actividad:</p>
                <p className="text-orange-900 font-semibold">{actividadALSeleccionada.nombre}</p>
                <p className="text-sm text-orange-600 mt-1">
                  {tipoEmojis[actividadALSeleccionada.tipo] || '🏕️'} {actividadALSeleccionada.tipo} • 📅 {formatFechaLocal(actividadALSeleccionada.fecha_inicio)}
                </p>
              </div>

              {/* Ranking Aire Libre */}
              {rankingAL.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {rankingAL.slice(0, 3).map((p, i) => (
                      <div key={p.id} className={`rounded-lg p-2 text-white shadow-xs ${
                        i === 0 ? 'bg-linear-to-br from-yellow-400 to-yellow-500' :
                        i === 1 ? 'bg-linear-to-br from-gray-300 to-gray-400' :
                        'bg-linear-to-br from-orange-400 to-orange-500'
                      }`}>
                        <div className="text-center">
                          <div className="text-lg font-bold">{p.total_puntaje || 0}</div>
                          <div className="text-[10px] opacity-90 truncate">{p.nombre}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setRankingALExpandido(!rankingALExpandido)}
                    className="w-full bg-linear-to-r from-orange-600 to-orange-700 text-white py-2.5 rounded-lg font-medium text-sm shadow-md flex items-center justify-center space-x-2"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>{rankingALExpandido ? 'Ocultar' : 'Ver'} Ranking</span>
                  </button>

                  {rankingALExpandido && (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className="divide-y">
                        {rankingAL.map((patrulla, index) => (
                          <div key={patrulla.id} className="flex items-center p-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${
                              index < 3 ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-lg">{patrulla.icono || '🏕️'}</span>
                              <span className="font-semibold text-gray-800">{patrulla.nombre}</span>
                            </div>
                            <div className="text-xl font-bold text-orange-600">{patrulla.total_puntaje || 0}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Programas/Días */}
              {(!actividadALSeleccionada.programas || actividadALSeleccionada.programas.length === 0) ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-700 font-semibold">Sin programas</p>
                  <p className="text-sm text-gray-500">Crea programas desde el sistema web</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Programas/Días ({actividadALSeleccionada.programas.length})</h3>
                  {actividadALSeleccionada.programas.map(programa => (
                    <button
                      key={programa.id}
                      onClick={() => seleccionarProgramaAL(programa)}
                      className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800">{programa.nombre}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            📅 {formatFechaLocal(programa.fecha)} • {programa.tipo === 'DIURNO' ? '☀️' : '🌙'} {programa.tipo}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {programa.bloques?.length || 0} bloque(s)
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* PASO 3: Bloques del Programa */}
          {pasoAL === 3 && programaALSeleccionado && (
            <>
              <button onClick={volverAProgramasAL} className="text-blue-600 font-medium flex items-center space-x-1">
                <ChevronLeft className="w-4 h-4" />
                <span>Volver a programas</span>
              </button>

              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Programa:</p>
                <p className="text-blue-900 font-semibold">{programaALSeleccionado.nombre}</p>
                <p className="text-sm text-blue-600 mt-1">📅 {formatFechaLocal(programaALSeleccionado.fecha)}</p>
              </div>

              {!programaALSeleccionado.bloques || programaALSeleccionado.bloques.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <p className="text-gray-700 font-semibold">Sin bloques de actividades</p>
                  <p className="text-sm text-gray-500">Agrega bloques desde el sistema web</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">
                    Bloques ({programaALSeleccionado.bloques.length})
                  </h3>
                  {programaALSeleccionado.bloques.map(bloque => (
                      <button
                        key={bloque.id}
                        onClick={() => seleccionarBloqueAL(bloque)}
                        className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-800">{bloque.nombre}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              ⏰ {bloque.hora_inicio} - {bloque.hora_fin}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </>
          )}

          {/* PASO 4: Asignar Puntajes Aire Libre */}
          {pasoAL === 4 && bloqueSeleccionado && (
            <>
              <button onClick={volverABloquesAL} className="text-blue-600 font-medium flex items-center space-x-1">
                <ChevronLeft className="w-4 h-4" />
                <span>Volver a bloques</span>
              </button>

              <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium">Bloque:</p>
                <p className="text-purple-900 font-semibold">{bloqueSeleccionado.nombre}</p>
                <p className="text-sm text-purple-600 mt-1">
                  ⏰ {bloqueSeleccionado.hora_inicio} - {bloqueSeleccionado.hora_fin}
                </p>
              </div>

              {patrullasActividad.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <p className="text-gray-700 font-semibold">Sin patrullas</p>
                  <p className="text-sm text-gray-500">Crea patrullas para esta actividad desde el sistema web</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Asignar Puntajes
                    {!puedeRegistrarAireLibre && <Lock className="w-4 h-4 ml-2 text-yellow-600" />}
                  </h3>

                  {patrullasActividad.map(patrulla => {
                    const puntajeActual = puntajesAL[patrulla.id];
                    const tienePuntaje = puntajeActual !== undefined && puntajeActual > 0;
                    
                    return (
                      <div key={patrulla.id} className={`bg-white rounded-xl p-4 shadow border-2 transition-all ${
                        tienePuntaje ? 'border-green-400 bg-green-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">{patrulla.icono || '🏕️'}</span>
                            <span className="font-semibold">{patrulla.nombre}</span>
                            {tienePuntaje && (
                              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">✓</span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            Total: {patrulla.total_puntaje || 0} pts
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max={100}
                            value={puntajeActual || ''}
                            onChange={(e) => handlePuntajeALChange(patrulla.id, e.target.value)}
                            disabled={!puedeRegistrarAireLibre}
                            placeholder="Puntos"
                            className={`flex-1 p-3 border-2 rounded-lg text-lg text-center font-semibold transition-all ${
                              !puedeRegistrarAireLibre ? 'bg-gray-100 cursor-not-allowed' :
                              tienePuntaje ? 'border-green-400 bg-white text-green-700' : 'border-gray-300 text-gray-700'
                            }`}
                          />
                          <span className="text-gray-500">pts</span>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={guardarPuntajesAL}
                    disabled={loading || !puedeRegistrarAireLibre}
                    className="w-full bg-linear-to-r from-orange-600 to-orange-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>⏳ Guardando...</>
                    ) : !puedeRegistrarAireLibre ? (
                      <><Lock className="w-5 h-5" /> Sin permisos</>
                    ) : (
                      <><Save className="w-5 h-5" /> Guardar Puntajes</>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
