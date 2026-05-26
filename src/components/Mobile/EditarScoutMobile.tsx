// ============================================================================
// EDITAR SCOUT MOBILE - Formulario Multi-pasos
// ============================================================================
// Implementa el patrón "One Thing at a Time" con 5 pasos:
// 1. Datos Personales
// 2. Datos Scout  
// 3. Datos de Contacto (Celular, Distrito, Dirección)
// 4. Ubicación (Mapa)
// 5. Confirmación
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { 
  Edit3, ChevronRight, ChevronLeft, CheckCircle, Loader2,
  User, Badge, Phone, MapPin, Check, Users, Calendar, Plus, Trash2
} from 'lucide-react';
import ScoutService from '../../services/scoutService';
import LocationPickerMobile from './LocationPickerMobile';
import { supabase } from '../../lib/supabase';

// ============================================================================
// MINI MAP PREVIEW COMPONENT (Leaflet read-only)
// ============================================================================

interface MiniMapPreviewProps {
  lat: number;
  lng: number;
  address?: string;
  onClick: () => void;
}

function MiniMapPreview({ lat, lng, address, onClick }: MiniMapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css-mini')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-mini';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS and initialize map
    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;
      
      const L = (window as any).L;
      if (!L) return;

      // Clear any existing map
      if ((mapRef.current as any)._leaflet_id) {
        (mapRef.current as any)._leaflet_id = null;
      }

      const map = L.map(mapRef.current, {
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: false,
      }).setView([lat, lng], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      // Custom marker icon
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 32px; 
          height: 32px; 
          background: #22c55e; 
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      L.marker([lat, lng], { icon: customIcon }).addTo(map);
      mapInstanceRef.current = map;
    };

    if ((window as any).L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng]);

  return (
    <div 
      onClick={onClick}
      className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-purple-500 transition-all active:scale-98"
    >
      {/* Mini-mapa Leaflet */}
      <div className="relative w-full h-40">
        <div ref={mapRef} className="w-full h-full" />
        {/* Badge de "Toca para editar" */}
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm z-[1000]">
          <span className="text-xs text-purple-600 font-medium">Toca para editar</span>
        </div>
      </div>
      {/* Info de ubicación */}
      <div className="p-3 bg-green-50">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {address && (
              <p className="text-sm text-gray-800 font-medium truncate">
                {address}
              </p>
            )}
            <p className="text-xs text-gray-500">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          </div>
          <span className="text-green-600 text-xs">✓</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TYPES
// ============================================================================

interface Familiar {
  id?: string;
  nombres: string;
  apellidos: string;
  parentesco: string;
  celular: string;
  correo: string;
  es_contacto_emergencia: boolean;
  es_apoderado: boolean;
}

interface Patrulla {
  id: string;
  nombre: string;
  rama: string;
}

interface FormData {
  // Paso 1: Datos Personales
  nombres: string;
  apellidos: string;
  sexo: 'MASCULINO' | 'FEMENINO' | '';
  fecha_nacimiento: string;
  tipo_documento: string;
  numero_documento: string;
  // Paso 2: Datos Scout
  rama_actual: string;
  fecha_ingreso: string;
  patrulla_id: string | null;
  cargo_patrulla: string;
  // Paso 3: Datos de Contacto
  celular: string;
  distrito: string;
  direccion_completa: string;
  // Paso 4: Ubicación
  ubicacion_latitud: number | null;
  ubicacion_longitud: number | null;
  // Familiares (N familiares)
  familiares: Familiar[];
}

interface Scout {
  id: string;
  codigo_asociado: string;
  nombres: string;
  apellidos: string;
  rama_actual: string;
  fecha_nacimiento?: string;
  sexo?: string;
  tipo_documento?: string;
  numero_documento?: string;
  celular?: string;
  distrito?: string;
  direccion_completa?: string;
  ubicacion_latitud?: number | null;
  ubicacion_longitud?: number | null;
  familiar_nombres?: string;
  familiar_apellidos?: string;
  familiar_telefono?: string;
  [key: string]: any;
}

interface EditarScoutMobileProps {
  scout: Scout;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================================================
// PASOS DEL FORMULARIO
// ============================================================================

const PASOS = [
  { id: 1, titulo: 'Datos Personales', icono: User, color: 'blue' },
  { id: 2, titulo: 'Datos Scout', icono: Badge, color: 'amber' },
  { id: 3, titulo: 'Contacto', icono: Phone, color: 'green' },
  { id: 4, titulo: 'Ubicación', icono: MapPin, color: 'purple' },
  { id: 5, titulo: 'Familiar', icono: Users, color: 'indigo' },
  { id: 6, titulo: 'Confirmar', icono: Check, color: 'emerald' },
] as const;

const RAMAS = ['Manada', 'Tropa', 'Comunidad', 'Clan'];

const DISTRITOS_LIMA = [
  'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos',
  'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María',
  'La Molina', 'La Victoria', 'Lima', 'Lince', 'Los Olivos', 'Lurigancho',
  'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana',
  'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra',
  'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho',
  'San Juan de Miraflores', 'San Luis', 'San Martín de Porres', 'San Miguel',
  'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco',
  'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const PARENTESCOS = ['PADRE', 'MADRE', 'TUTOR', 'HERMANO', 'ABUELO', 'TIO', 'OTRO'];
const CARGOS_PATRULLA = ['MIEMBRO', 'GUIA', 'SUBGUIA', 'INTENDENTE', 'ENFERMERO', 'TESORERO', 'SECRETARIO', 'GUARDALMACEN'];

export default function EditarScoutMobile({ scout, onClose, onSuccess }: EditarScoutMobileProps) {
  const [paso, setPaso] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [error, setError] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [patrullas, setPatrullas] = useState<Patrulla[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    nombres: '',
    apellidos: '',
    sexo: '',
    fecha_nacimiento: '',
    tipo_documento: 'DNI',
    numero_documento: '',
    rama_actual: '',
    fecha_ingreso: '',
    patrulla_id: null,
    cargo_patrulla: 'MIEMBRO',
    celular: '',
    distrito: '',
    direccion_completa: '',
    ubicacion_latitud: null,
    ubicacion_longitud: null,
    familiares: []
  });

  // ============================================================================
  // CARGAR DATOS DEL SCOUT
  // ============================================================================

  useEffect(() => {
    cargarDatosScout();
  }, [scout.id]);

  // Cargar patrullas cuando cambie la rama (igual que la web)
  useEffect(() => {
    if (formData.rama_actual) {
      cargarPatrullas(formData.rama_actual);
    }
  }, [formData.rama_actual]);

  const cargarPatrullas = async (rama?: string) => {
    try {
      console.log('📱 [EditarScoutMobile] Cargando patrullas para rama:', rama);
      
      // Mismo patrón que PatrullaSelector.tsx de la web
      let query = supabase
        .from('patrullas')
        .select('id, nombre, rama, estado')
        .eq('estado', 'ACTIVO')
        .order('nombre');
      
      if (rama) {
        query = query.eq('rama', rama);
      }
      
      const { data, error } = await query;
      
      console.log('🔍 [DEBUG] Patrullas cargadas:', data?.length, error);
      
      if (data && data.length > 0) {
        setPatrullas(data.map(p => ({ ...p, activa: p.estado === 'ACTIVO' })));
      }
      
    } catch (err: any) {
      console.error('Error cargando patrullas:', err);
    }
  };
  
  // Cargar patrulla específica por ID cuando no tenemos lista de patrullas
  const cargarPatrullaPorId = async (patrullaId: string) => {
    try {
      console.log('📱 [EditarScoutMobile] Cargando patrulla específica:', patrullaId);
      const { data, error } = await supabase
        .from('patrullas')
        .select('id, nombre, rama, activa, estado')
        .eq('id', patrullaId)
        .single();
      
      console.log('🔍 [DEBUG] Patrulla por ID:', data, error);
      
      if (data && !error) {
        // Agregar esta patrulla al array si no existe
        setPatrullas(prev => {
          if (prev.some(p => p.id === data.id)) return prev;
          return [...prev, data];
        });
        return data;
      }
      
      // Si aún falla, obtener nombre vía miembros_patrulla JOIN
      const { data: miembroData, error: miembroError } = await supabase
        .from('miembros_patrulla')
        .select(`
          patrullas (
            id,
            nombre,
            rama,
            activa,
            estado
          )
        `)
        .eq('patrulla_id', patrullaId)
        .limit(1)
        .single();
      
      console.log('🔍 [DEBUG] Patrulla vía miembro:', miembroData, miembroError);
      
      if (miembroData && (miembroData as any).patrullas) {
        const patrulla = (miembroData as any).patrullas;
        setPatrullas(prev => {
          if (prev.some(p => p.id === patrulla.id)) return prev;
          return [...prev, patrulla];
        });
        return patrulla;
      }
      
    } catch (err: any) {
      console.error('Error cargando patrulla por ID:', err);
    }
    return null;
  };

  const cargarDatosScout = async () => {
    setLoadingDatos(true);
    try {
      console.log('📱 [EditarScoutMobile] Cargando datos para scout ID:', scout.id);
      const scoutCompleto: any = await ScoutService.getScoutById(scout.id);
      console.log('📱 [EditarScoutMobile] Datos recibidos:', scoutCompleto);
      
      // Cargar familiares
      const familiares = await ScoutService.getFamiliaresByScout(scout.id);
      console.log('📱 [EditarScoutMobile] Familiares recibidos:', familiares);
      
      // Cargar patrulla del scout - CONSULTA SIMPLE SIN JOIN
      let patrullaId: string | null = null;
      let cargoPatrulla = 'MIEMBRO';
      let patrullaNombre = '';
      try {
        console.log('📱 [EditarScoutMobile] Consultando miembros_patrulla para scout:', scout.id);
        
        // Obtener membresía activa más reciente
        const { data: membresias, error: membresiaError } = await supabase
          .from('miembros_patrulla')
          .select('patrulla_id, cargo_patrulla, fecha_ingreso')
          .eq('scout_id', scout.id)
          .eq('estado_miembro', 'ACTIVO')
          .is('fecha_salida', null)
          .order('fecha_ingreso', { ascending: false });
        
        console.log('📱 [EditarScoutMobile] Membresías encontradas:', membresias, 'Error:', membresiaError);
        
        // Tomar la membresía más reciente
        const membresia = membresias && membresias.length > 0 ? membresias[0] : null;
        console.log('📱 [EditarScoutMobile] Membresía seleccionada:', membresia);
        
        if (membresia && membresia.patrulla_id) {
          patrullaId = membresia.patrulla_id;
          cargoPatrulla = membresia.cargo_patrulla || 'MIEMBRO';
          console.log('📱 [EditarScoutMobile] Cargo cargado:', cargoPatrulla);
          
          // Paso 2: Intentar obtener nombre de patrulla via JOIN desde miembros_patrulla
          const { data: patrullaViaJoin, error: joinError } = await supabase
            .from('miembros_patrulla')
            .select('patrullas!inner(id, nombre, rama, activa, estado)')
            .eq('patrulla_id', membresia.patrulla_id)
            .limit(1)
            .maybeSingle();
          
          console.log('📱 [EditarScoutMobile] Patrulla via JOIN:', patrullaViaJoin, 'Error:', joinError);
          
          if (patrullaViaJoin && (patrullaViaJoin as any).patrullas) {
            const patrullaData = (patrullaViaJoin as any).patrullas;
            patrullaNombre = patrullaData.nombre;
            setPatrullas(prev => {
              if (prev.some(p => p.id === patrullaData.id)) return prev;
              return [...prev, patrullaData];
            });
          } else {
            // Si el JOIN falla, al menos crear un objeto mínimo para el dropdown
            patrullaNombre = `Patrulla (${membresia.patrulla_id.substring(0, 8)}...)`;
            setPatrullas(prev => {
              if (prev.some(p => p.id === membresia.patrulla_id)) return prev;
              return [...prev, { id: membresia.patrulla_id, nombre: patrullaNombre, rama: '', activa: true }];
            });
          }
          
          console.log('✅ [EditarScoutMobile] Patrulla cargada:', { patrullaId, cargoPatrulla, patrullaNombre });
        } else {
          console.log('📱 [EditarScoutMobile] Scout sin patrulla asignada');
        }
      } catch (err: any) {
        console.error('❌ [EditarScoutMobile] Error cargando patrulla:', err);
      }
      
      if (scoutCompleto) {
        // Mapear familiares al formato esperado
        const familiaresMapped: Familiar[] = (familiares || []).map((f: any) => ({
          id: f.id,
          nombres: f.nombres || '',
          apellidos: f.apellidos || '',
          parentesco: f.parentesco || 'PADRE',
          celular: f.celular || f.telefono || '',
          correo: f.correo || '',
          es_contacto_emergencia: f.es_contacto_emergencia ?? true,
          es_apoderado: f.es_apoderado ?? false,
        }));
        
        // Si no hay familiares en la tabla familiares_scout, usar los campos legacy
        if (familiaresMapped.length === 0 && (scoutCompleto.familiar_nombres || scoutCompleto.familiar_apellidos)) {
          familiaresMapped.push({
            nombres: scoutCompleto.familiar_nombres || '',
            apellidos: scoutCompleto.familiar_apellidos || '',
            parentesco: scoutCompleto.familiar_parentesco || 'PADRE',
            celular: scoutCompleto.familiar_telefono || '',
            correo: scoutCompleto.familiar_correo || '',
            es_contacto_emergencia: true,
            es_apoderado: true,
          });
        }
        
        const newFormData: FormData = {
          nombres: scoutCompleto.nombres || scout.nombres || '',
          apellidos: scoutCompleto.apellidos || scout.apellidos || '',
          sexo: (scoutCompleto.sexo || scout.sexo || '') as 'MASCULINO' | 'FEMENINO' | '',
          fecha_nacimiento: scoutCompleto.fecha_nacimiento || scout.fecha_nacimiento || '',
          tipo_documento: scoutCompleto.tipo_documento || scout.tipo_documento || 'DNI',
          numero_documento: scoutCompleto.numero_documento || scout.numero_documento || '',
          rama_actual: scoutCompleto.rama_actual || scout.rama_actual || '',
          fecha_ingreso: scoutCompleto.fecha_ingreso || '',
          patrulla_id: patrullaId,
          cargo_patrulla: cargoPatrulla,
          celular: scoutCompleto.celular || scout.celular || '',
          distrito: scoutCompleto.distrito || scout.distrito || '',
          direccion_completa: scoutCompleto.direccion_completa || scoutCompleto.direccion || scout.direccion_completa || (scout as any).direccion || '',
          ubicacion_latitud: scoutCompleto.ubicacion_latitud != null 
            ? Number(scoutCompleto.ubicacion_latitud) 
            : null,
          ubicacion_longitud: scoutCompleto.ubicacion_longitud != null 
            ? Number(scoutCompleto.ubicacion_longitud) 
            : null,
          familiares: familiaresMapped,
        };
        console.log('📱 [EditarScoutMobile] Datos del formulario a establecer:', newFormData);
        console.log('📱 [EditarScoutMobile] PATRULLA_ID:', newFormData.patrulla_id, 'CARGO:', newFormData.cargo_patrulla);
        console.log('📱 [EditarScoutMobile] Total familiares:', familiaresMapped.length);
        setFormData(newFormData);
      } else {
        console.warn('📱 [EditarScoutMobile] No se recibieron datos del scout, usando datos del prop');
        setFormData(prev => ({
          ...prev,
          nombres: scout.nombres || '',
          apellidos: scout.apellidos || '',
          sexo: (scout.sexo || '') as 'MASCULINO' | 'FEMENINO' | '',
          fecha_nacimiento: scout.fecha_nacimiento || '',
          rama_actual: scout.rama_actual || '',
          celular: (scout as any).celular || '',
          distrito: (scout as any).distrito || '',
          direccion_completa: (scout as any).direccion_completa || (scout as any).direccion || '',
        }));
      }
    } catch (err) {
      console.error('Error al cargar datos del scout:', err);
      // Usar datos básicos del scout pasado como prop
      setFormData(prev => ({
        ...prev,
        nombres: scout.nombres || '',
        apellidos: scout.apellidos || '',
        rama_actual: scout.rama_actual || '',
      }));
    } finally {
      setLoadingDatos(false);
    }
  };

  // Verificar patrullas disponibles y cargar la del scout si falta
  useEffect(() => {
    const verificarPatrulla = async () => {
      console.log('🔍 [DEBUG] Verificando patrullas. Total:', patrullas.length, 'Patrulla ID scout:', formData.patrulla_id);
      
      // Si tenemos patrulla_id pero el array está vacío, intentar cargar esa patrulla específica
      if (formData.patrulla_id && patrullas.length === 0) {
        console.log('📱 [DEBUG] Patrullas vacías pero scout tiene patrulla_id, cargando...');
        await cargarPatrullaPorId(formData.patrulla_id);
        return;
      }
      
      // Si tenemos patrulla_id pero no está en el array, agregarla
      if (formData.patrulla_id && patrullas.length > 0) {
        const patrullaEncontrada = patrullas.find(p => p.id === formData.patrulla_id);
        if (!patrullaEncontrada) {
          console.log('📱 [DEBUG] Patrulla del scout no está en lista, cargando...');
          await cargarPatrullaPorId(formData.patrulla_id);
        } else {
          console.log('✅ [DEBUG] Patrulla encontrada:', patrullaEncontrada.nombre);
        }
      }
    };
    
    if (formData.patrulla_id || patrullas.length > 0) {
      verificarPatrulla();
    }
  }, [patrullas.length, formData.patrulla_id, formData.rama_actual]);

  // ============================================================================
  // VALIDACIONES POR PASO
  // ============================================================================

  const validarPaso1 = (): boolean => {
    if (!formData.nombres.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }
    if (!formData.apellidos.trim()) {
      setError('Los apellidos son obligatorios');
      return false;
    }
    if (!formData.sexo) {
      setError('Selecciona el sexo');
      return false;
    }
    if (!formData.fecha_nacimiento) {
      setError('La fecha de nacimiento es obligatoria');
      return false;
    }
    setError('');
    return true;
  };

  const validarPaso2 = (): boolean => {
    if (!formData.rama_actual) {
      setError('Selecciona la rama');
      return false;
    }
    setError('');
    return true;
  };

  const validarPaso3 = (): boolean => {
    // Paso 3 es opcional, no hay validación obligatoria
    setError('');
    return true;
  };

  const validarPaso4 = (): boolean => {
    // Paso 4 es opcional
    setError('');
    return true;
  };

  // ============================================================================
  // NAVEGACIÓN
  // ============================================================================

  const handleSiguiente = () => {
    if (paso === 1 && validarPaso1()) {
      setPaso(2);
    } else if (paso === 2 && validarPaso2()) {
      setPaso(3);
    } else if (paso === 3 && validarPaso3()) {
      setPaso(4);
    } else if (paso === 4 && validarPaso4()) {
      setPaso(5);
    } else if (paso === 5) {
      // Paso 5 (Familiar) es opcional, no requiere validación
      setError('');
      setPaso(6);
    }
  };

  const handleAnterior = () => {
    if (paso > 1) {
      setPaso((paso - 1) as 1 | 2 | 3 | 4 | 5 | 6);
    }
  };

  // ============================================================================
  // GUARDAR
  // ============================================================================

  const handleActualizar = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Obtener primer familiar para campos legacy
      const primerFamiliar = formData.familiares[0];
      
      const datosActualizados: any = {
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        sexo: formData.sexo,
        fecha_nacimiento: formData.fecha_nacimiento,
        tipo_documento: formData.tipo_documento,
        numero_documento: formData.numero_documento?.trim() || undefined,
        rama_actual: formData.rama_actual,
        fecha_ingreso: formData.fecha_ingreso || undefined,
        // Nuevos campos de contacto
        celular: formData.celular?.trim() || undefined,
        distrito: formData.distrito || undefined,
        direccion_completa: formData.direccion_completa?.trim() || undefined,
        // Ubicación
        ubicacion_latitud: formData.ubicacion_latitud,
        ubicacion_longitud: formData.ubicacion_longitud,
        // Familiares (array completo para la tabla familiares_scout)
        familiares: formData.familiares,
        // Campos legacy del primer familiar (para compatibilidad)
        familiar_nombres: primerFamiliar?.nombres || undefined,
        familiar_apellidos: primerFamiliar?.apellidos || undefined,
        familiar_parentesco: primerFamiliar?.parentesco || undefined,
        familiar_telefono: primerFamiliar?.celular || undefined,
        familiar_correo: primerFamiliar?.correo || undefined,
        familiar_es_contacto_emergencia: primerFamiliar?.es_contacto_emergencia ?? true,
        familiar_es_apoderado: primerFamiliar?.es_apoderado ?? false,
      };

      const result = await ScoutService.updateScout(scout.id, datosActualizados);
      
      if (result.success) {
        // Actualizar patrulla si hay una seleccionada
        if (formData.patrulla_id) {
          try {
            const hoy = new Date().toISOString().split('T')[0];
            console.log('📱 Guardando patrulla. Scout:', scout.id, 'Patrulla:', formData.patrulla_id, 'Cargo:', formData.cargo_patrulla);
            
            // Paso 1: Marcar TODAS las membresías activas como inactivas
            await supabase
              .from('miembros_patrulla')
              .update({ fecha_salida: hoy, estado_miembro: 'INACTIVO' })
              .eq('scout_id', scout.id)
              .eq('estado_miembro', 'ACTIVO');
            
            // Paso 2: Eliminar registro conflictivo si existe
            await supabase
              .from('miembros_patrulla')
              .delete()
              .eq('scout_id', scout.id)
              .eq('patrulla_id', formData.patrulla_id)
              .eq('fecha_ingreso', hoy);
            
            // Paso 3: Insertar nueva membresía
            const { error: insertError } = await supabase
              .from('miembros_patrulla')
              .insert({
                scout_id: scout.id,
                patrulla_id: formData.patrulla_id,
                cargo_patrulla: formData.cargo_patrulla || 'MIEMBRO',
                fecha_ingreso: hoy,
                estado_miembro: 'ACTIVO'
              });
            
            if (insertError) {
              console.error('❌ Error insertando membresía:', insertError);
            } else {
              console.log('✅ Membresía guardada correctamente');
            }
          } catch (err) {
            console.error('Error actualizando patrulla:', err);
          }
        }
        onSuccess();
      } else {
        setError(result.error || 'Error al actualizar el scout');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // MANEJAR FAMILIARES
  // ============================================================================
  
  const agregarFamiliar = () => {
    setFormData(prev => ({
      ...prev,
      familiares: [...prev.familiares, {
        nombres: '',
        apellidos: '',
        parentesco: 'PADRE',
        celular: '',
        correo: '',
        es_contacto_emergencia: false,
        es_apoderado: false,
      }]
    }));
  };
  
  const eliminarFamiliar = (index: number) => {
    setFormData(prev => ({
      ...prev,
      familiares: prev.familiares.filter((_, i) => i !== index)
    }));
  };
  
  const actualizarFamiliar = (index: number, campo: keyof Familiar, valor: any) => {
    setFormData(prev => ({
      ...prev,
      familiares: prev.familiares.map((f, i) => 
        i === index ? { ...f, [campo]: valor } : f
      )
    }));
  };

  // ============================================================================
  // MANEJAR UBICACIÓN
  // ============================================================================

  const handleLocationSelect = (data: { latitud: number; longitud: number; direccion: string }) => {
    // NOTA: El mapa es solo referencial - NO actualizamos direccion_completa
    // La dirección es un campo independiente que el usuario escribe manualmente
    setFormData(prev => ({
      ...prev,
      ubicacion_latitud: data.latitud,
      ubicacion_longitud: data.longitud,
      // direccion_completa NO se actualiza desde el mapa
    }));
    setShowLocationPicker(false);
  };

  // ============================================================================
  // RENDER: LOADING
  // ============================================================================

  if (loadingDatos) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos del scout...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: LOCATION PICKER
  // ============================================================================

  if (showLocationPicker) {
    return (
      <LocationPickerMobile
        onLocationSelect={handleLocationSelect}
        initialLatitud={formData.ubicacion_latitud || undefined}
        initialLongitud={formData.ubicacion_longitud || undefined}
        initialDireccion={formData.direccion_completa}
        onClose={() => setShowLocationPicker(false)}
      />
    );
  }

  // ============================================================================
  // RENDER: FORMULARIO
  // ============================================================================

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header con Stepper */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 rounded-t-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Edit3 className="w-6 h-6" />
              <h2 className="text-lg font-bold">Editar Scout</h2>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1">
              ✕
            </button>
          </div>
          
          <div className="text-sm text-amber-100 mb-2">
            {scout.codigo_asociado} - {PASOS[paso - 1].titulo}
          </div>
          
          {/* Stepper Visual */}
          <div className="flex space-x-1">
            {PASOS.map((p) => (
              <div 
                key={p.id}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  paso >= p.id ? 'bg-white' : 'bg-white/30'
                }`} 
              />
            ))}
          </div>
          
          {/* Iconos de pasos */}
          <div className="flex justify-between mt-2 px-1">
            {PASOS.map((p) => {
              const Icon = p.icono;
              return (
                <div 
                  key={p.id}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    paso >= p.id 
                      ? 'bg-white text-amber-600' 
                      : 'bg-white/20 text-white/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Contenido del paso actual */}
        <div className="p-4">
          {/* ================================================================ */}
          {/* PASO 1: Datos Personales */}
          {/* ================================================================ */}
          {paso === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Datos Personales
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombres <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  onBlur={() => formData.nombres.trim() === '' && setError('El nombre es obligatorio')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Juan Carlos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Pérez García"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sexo <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sexo: 'MASCULINO' })}
                    className={`p-3 rounded-lg border-2 font-medium transition-all ${
                      formData.sexo === 'MASCULINO'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    👦 Masculino
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sexo: 'FEMENINO' })}
                    className={`p-3 rounded-lg border-2 font-medium transition-all ${
                      formData.sexo === 'FEMENINO'
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    👧 Femenino
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Documento
                </label>
                <input
                  type="text"
                  value={formData.numero_documento}
                  onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 12345678"
                  maxLength={12}
                />
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* PASO 2: Datos Scout */}
          {/* ================================================================ */}
          {paso === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Badge className="w-5 h-5 text-amber-600" />
                Datos Scout
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rama <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {RAMAS.map(rama => (
                    <button
                      key={rama}
                      type="button"
                      onClick={() => setFormData({ ...formData, rama_actual: rama })}
                      className={`p-4 rounded-lg border-2 font-medium transition-all ${
                        formData.rama_actual === rama
                          ? rama === 'Manada' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' :
                            rama === 'Tropa' ? 'border-green-500 bg-green-50 text-green-700' :
                            rama === 'Comunidad' ? 'border-orange-500 bg-orange-50 text-orange-700' :
                            'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {rama === 'Manada' && '🐺 '}
                      {rama === 'Tropa' && '⚜️ '}
                      {rama === 'Comunidad' && '🧭 '}
                      {rama === 'Clan' && '🏔️ '}
                      {rama}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fecha de Ingreso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha de Ingreso
                </label>
                <input
                  type="date"
                  value={formData.fecha_ingreso}
                  onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">Fecha en que ingresó al grupo scout</p>
              </div>

              {/* Patrulla */}
              {(formData.rama_actual === 'Tropa' || formData.rama_actual === 'Comunidad') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🏴 Patrulla
                    </label>
                    <select
                      value={formData.patrulla_id || ''}
                      onChange={(e) => setFormData({ ...formData, patrulla_id: e.target.value || null })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="">Sin patrulla asignada</option>
                      {patrullas
                        .filter(p => p.rama === formData.rama_actual || p.id === formData.patrulla_id)
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))
                      }
                    </select>
                  </div>
                  
                  {formData.patrulla_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        🎖️ Cargo en Patrulla
                      </label>
                      <select
                        value={formData.cargo_patrulla}
                        onChange={(e) => setFormData({ ...formData, cargo_patrulla: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                      >
                        {CARGOS_PATRULLA.map(cargo => (
                          <option key={cargo} value={cargo}>{cargo}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
                <p className="text-sm text-amber-800">
                  <strong>Código:</strong> {scout.codigo_asociado}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  El código asociado no se puede modificar.
                </p>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* PASO 3: Datos de Contacto */}
          {/* ================================================================ */}
          {paso === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" />
                Datos de Contacto
              </h3>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-2">
                <p className="text-sm text-blue-800">
                  Estos campos son opcionales pero ayudan a mantener el contacto.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📱 Celular Principal
                </label>
                <input
                  type="tel"
                  value={formData.celular}
                  onChange={(e) => {
                    // Solo permitir números
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, celular: value });
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: 987654321"
                  maxLength={9}
                  inputMode="tel"
                />
                <p className="text-xs text-gray-500 mt-1">9 dígitos, solo números</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🏘️ Distrito
                </label>
                <select
                  value={formData.distrito}
                  onChange={(e) => setFormData({ ...formData, distrito: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="">Selecciona un distrito</option>
                  {DISTRITOS_LIMA.map(distrito => (
                    <option key={distrito} value={distrito}>
                      {distrito}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🏠 Dirección Completa
                </label>
                <textarea
                  value={formData.direccion_completa}
                  onChange={(e) => setFormData({ ...formData, direccion_completa: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Ej: Av. Los Pinos 123, Urb. Las Flores"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* PASO 4: Ubicación en Mapa */}
          {/* ================================================================ */}
          {paso === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Ubicación en Mapa
              </h3>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded mb-2">
                <p className="text-sm text-purple-800">
                  Selecciona la ubicación exacta del domicilio en el mapa.
                </p>
              </div>

              {/* Vista previa de ubicación con mini-mapa Leaflet */}
              {formData.ubicacion_latitud && formData.ubicacion_longitud ? (
                <MiniMapPreview
                  lat={formData.ubicacion_latitud}
                  lng={formData.ubicacion_longitud}
                  address={formData.direccion_completa}
                  onClick={() => setShowLocationPicker(true)}
                />
              ) : (
                <div 
                  onClick={() => setShowLocationPicker(true)}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all active:scale-98"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">Agregar ubicación</p>
                  <p className="text-sm text-gray-500">
                    Toca para abrir el mapa
                  </p>
                </div>
              )}

              {/* Botón alternativo */}
              <button
                type="button"
                onClick={() => setShowLocationPicker(true)}
                className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <MapPin className="w-5 h-5" />
                {formData.ubicacion_latitud ? 'Cambiar Ubicación' : 'Seleccionar en Mapa'}
              </button>
            </div>
          )}

          {/* ================================================================ */}
          {/* PASO 5: Datos del Familiar/Apoderado */}
          {/* ================================================================ */}
          {paso === 5 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Familiar / Apoderado
                <span className="ml-2 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">
                  {formData.familiares.length}
                </span>
              </h3>

              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded mb-2">
                <p className="text-sm text-indigo-800">
                  Agrega los datos de los familiares o apoderados del scout.
                </p>
              </div>

              {/* Lista de familiares */}
              {formData.familiares.map((familiar, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-indigo-700">
                      👤 Familiar {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => eliminarFamiliar(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={familiar.nombres}
                      onChange={(e) => actualizarFamiliar(index, 'nombres', e.target.value)}
                      className="p-2 text-sm border border-gray-300 rounded-lg"
                      placeholder="Nombres"
                    />
                    <input
                      type="text"
                      value={familiar.apellidos}
                      onChange={(e) => actualizarFamiliar(index, 'apellidos', e.target.value)}
                      className="p-2 text-sm border border-gray-300 rounded-lg"
                      placeholder="Apellidos"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={familiar.parentesco}
                      onChange={(e) => actualizarFamiliar(index, 'parentesco', e.target.value)}
                      className="p-2 text-sm border border-gray-300 rounded-lg bg-white"
                    >
                      {PARENTESCOS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={familiar.celular}
                      onChange={(e) => actualizarFamiliar(index, 'celular', e.target.value.replace(/\D/g, ''))}
                      className="p-2 text-sm border border-gray-300 rounded-lg"
                      placeholder="Celular"
                      maxLength={9}
                    />
                  </div>
                  
                  <input
                    type="email"
                    value={familiar.correo}
                    onChange={(e) => actualizarFamiliar(index, 'correo', e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                    placeholder="Correo electrónico (opcional)"
                  />
                  
                  <div className="flex gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={familiar.es_contacto_emergencia}
                        onChange={(e) => actualizarFamiliar(index, 'es_contacto_emergencia', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-gray-700">Contacto emergencia</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={familiar.es_apoderado}
                        onChange={(e) => actualizarFamiliar(index, 'es_apoderado', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-gray-700">Apoderado</span>
                    </label>
                  </div>
                </div>
              ))}
              
              {/* Botón agregar familiar */}
              <button
                type="button"
                onClick={agregarFamiliar}
                className="w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-600 font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Agregar Familiar
              </button>
            </div>
          )}

          {/* ================================================================ */}
          {/* PASO 6: Confirmación */}
          {/* ================================================================ */}
          {paso === 6 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">
                  Confirmar Cambios
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Revisa los datos antes de guardar
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {/* Datos personales */}
                <div className="border-b pb-3">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                    👤 Datos Personales
                  </p>
                  <p className="font-semibold text-gray-800">
                    {formData.nombres} {formData.apellidos}
                  </p>
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                    <span>{formData.sexo === 'MASCULINO' ? '👦' : '👧'} {formData.sexo}</span>
                    <span>🎂 {formData.fecha_nacimiento ? new Date(formData.fecha_nacimiento).toLocaleDateString('es-PE') : '-'}</span>
                  </div>
                  {formData.numero_documento && (
                    <p className="text-sm text-gray-600 mt-1">
                      🪪 {formData.tipo_documento}: {formData.numero_documento}
                    </p>
                  )}
                </div>

                {/* Rama */}
                <div className="border-b pb-3">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                    ⚜️ Rama
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    formData.rama_actual === 'Manada' ? 'bg-yellow-100 text-yellow-800' :
                    formData.rama_actual === 'Tropa' ? 'bg-green-100 text-green-800' :
                    formData.rama_actual === 'Comunidad' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {formData.rama_actual}
                  </span>
                </div>

                {/* Contacto */}
                {(formData.celular || formData.distrito || formData.direccion_completa) && (
                  <div className="border-b pb-3">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                      📞 Contacto
                    </p>
                    {formData.celular && (
                      <p className="text-sm text-gray-600">📱 {formData.celular}</p>
                    )}
                    {formData.distrito && (
                      <p className="text-sm text-gray-600">🏘️ {formData.distrito}</p>
                    )}
                    {formData.direccion_completa && (
                      <p className="text-sm text-gray-600">🏠 {formData.direccion_completa}</p>
                    )}
                  </div>
                )}

                {/* Ubicación */}
                {formData.ubicacion_latitud && formData.ubicacion_longitud && (
                  <div className="border-b pb-3">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                      📍 Ubicación (Referencia)
                    </p>
                    <p className="text-sm text-green-600">
                      ✓ Punto en mapa: ({formData.ubicacion_latitud.toFixed(4)}, {formData.ubicacion_longitud.toFixed(4)})
                    </p>
                  </div>
                )}

                {/* Familiares */}
                {formData.familiares.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                      👨‍👩‍👧 Familiares/Apoderados ({formData.familiares.length})
                    </p>
                    <div className="space-y-2">
                      {formData.familiares.map((fam, idx) => (
                        <div key={idx} className="text-sm text-gray-600 border-l-2 border-indigo-200 pl-2">
                          <p className="font-medium text-gray-700">
                            👤 {fam.nombres} {fam.apellidos}
                          </p>
                          <p className="text-xs text-gray-500">
                            {fam.parentesco} • 📱 {fam.celular || '-'}
                            {fam.es_apoderado && <span className="ml-1 text-indigo-600">• Apoderado</span>}
                            {fam.es_contacto_emergencia && <span className="ml-1 text-red-600">• Emergencia</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* FOOTER CON BOTONES */}
        {/* ================================================================ */}
        <div className="sticky bottom-0 bg-white border-t p-4 space-y-2">
          <div className="flex space-x-2">
            {paso > 1 && (
              <button
                onClick={handleAnterior}
                className="flex-1 flex items-center justify-center space-x-2 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Anterior</span>
              </button>
            )}

            {paso < 6 ? (
              <button
                onClick={handleSiguiente}
                className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg active:scale-95 transition-transform"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleActualizar}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
            )}
          </div>

          {paso === 1 && (
            <button
              onClick={onClose}
              className="w-full py-2 text-gray-600 text-sm hover:text-gray-800"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
