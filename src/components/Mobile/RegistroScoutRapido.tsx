// ============================================================================
// REGISTRO SCOUT RAPIDO - MOBILE
// ============================================================================
// Formulario multi-pasos optimizado para móviles
// Usa React Hook Form + Zod para validación
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  UserPlus, ChevronRight, ChevronLeft, CheckCircle, 
  MapPin, Phone, User, AlertCircle, Loader2, Plus, Trash2, Users, Flag, Calendar
} from 'lucide-react';
import ScoutService from '../../services/scoutService';
import LocationPickerMobile from './LocationPickerMobile';
import { UbigeoService, Departamento, Provincia, Distrito } from '../../services/ubigeoService';
import { supabase } from '../../lib/supabase';
import {
  registroScoutMobileSchema,
  RegistroScoutMobileFormData,
  defaultRegistroValues,
  RAMAS,
  CARGOS_PATRULLA,
  Familiar,
} from '../../schemas/registroScoutMobileSchema';

// ============================================================================
// TIPOS
// ============================================================================

interface RegistroScoutRapidoProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Patrulla {
  id: string;
  nombre: string;
  rama: string;
  estado: string;
}

type Paso = 1 | 2 | 3 | 4 | 5;

const TOTAL_PASOS = 5;

const PARENTESCOS = [
  { value: 'PADRE', label: 'Padre' },
  { value: 'MADRE', label: 'Madre' },
  { value: 'ABUELO', label: 'Abuelo' },
  { value: 'ABUELA', label: 'Abuela' },
  { value: 'TIO', label: 'Tío' },
  { value: 'TIA', label: 'Tía' },
  { value: 'HERMANO', label: 'Hermano' },
  { value: 'HERMANA', label: 'Hermana' },
  { value: 'TUTOR', label: 'Tutor Legal' },
  { value: 'OTRO', label: 'Otro' },
];

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
          background: #3b82f6; 
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
      className="border-2 border-dashed border-blue-300 rounded-xl overflow-hidden cursor-pointer hover:border-blue-500 transition-all active:scale-98"
    >
      {/* Mini-mapa Leaflet */}
      <div className="relative w-full h-40">
        <div ref={mapRef} className="w-full h-full" />
        {/* Badge de "Toca para editar" */}
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm z-[1000]">
          <span className="text-xs text-blue-600 font-medium">Toca para editar</span>
        </div>
      </div>
      {/* Info de ubicación */}
      <div className="p-3 bg-blue-50">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
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
          <span className="text-blue-600 text-xs">✓</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function RegistroScoutRapido({ onClose, onSuccess }: RegistroScoutRapidoProps) {
  const [paso, setPaso] = useState<Paso>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [patrullas, setPatrullas] = useState<Patrulla[]>([]);

  // Ubigeo state
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [distritos, setDistritos] = useState<Distrito[]>([]);
  const [loadingUbigeo, setLoadingUbigeo] = useState(false);
  const [selectedDepId, setSelectedDepId] = useState<number | null>(null);
  const [selectedProvId, setSelectedProvId] = useState<number | null>(null);

  // React Hook Form + Zod
  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegistroScoutMobileFormData>({
    resolver: zodResolver(registroScoutMobileSchema),
    defaultValues: defaultRegistroValues,
    mode: 'onBlur',
  });

  // useFieldArray para familiares
  const { fields: familiares, append: agregarFamiliar, remove: eliminarFamiliar } = useFieldArray({
    control,
    name: 'familiares',
  });

  // Valores observados
  const ubicacionDireccion = watch('ubicacion_direccion');
  const ramaActual = watch('rama_actual');
  const patrullaId = watch('patrulla_id');
  const departamentoForm = watch('departamento');
  const provinciaForm = watch('provincia');

  // Cargar departamentos al montar
  useEffect(() => {
    const cargar = async () => {
      const data = await UbigeoService.obtenerDepartamentos();
      setDepartamentos(data);
    };
    cargar();
  }, []);

  // Restaurar IDs de ubigeo cuando hay valores en el form y departamentos cargados
  // (Necesario para mantener la cascada después de cerrar el LocationPicker)
  useEffect(() => {
    if (departamentos.length > 0 && departamentoForm && !selectedDepId) {
      const dep = departamentos.find(d => d.nombre === departamentoForm);
      if (dep) {
        setSelectedDepId(dep.id);
      }
    }
  }, [departamentos, departamentoForm, selectedDepId]);

  // Restaurar ID de provincia cuando hay valor en form y provincias cargadas
  useEffect(() => {
    if (provincias.length > 0 && provinciaForm && !selectedProvId) {
      const prov = provincias.find(p => p.nombre === provinciaForm);
      if (prov) {
        setSelectedProvId(prov.id);
      }
    }
  }, [provincias, provinciaForm, selectedProvId]);

  // Cargar patrullas cuando cambia la rama
  useEffect(() => {
    const cargarPatrullas = async () => {
      if (!ramaActual) {
        setPatrullas([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('patrullas')
          .select('id, nombre, rama, estado')
          .eq('rama', ramaActual)
          .eq('estado', 'ACTIVO')
          .order('nombre');
        
        if (data && !error) {
          setPatrullas(data);
        }
      } catch (err) {
        console.error('Error cargando patrullas:', err);
      }
    };
    
    cargarPatrullas();
    // Limpiar patrulla seleccionada si cambia la rama
    setValue('patrulla_id', null);
    setValue('cargo_patrulla', 'MIEMBRO');
  }, [ramaActual, setValue]);

  // Cargar provincias cuando cambia departamento
  useEffect(() => {
    if (selectedDepId) {
      const cargar = async () => {
        setLoadingUbigeo(true);
        const data = await UbigeoService.obtenerProvincias(selectedDepId);
        setProvincias(data);
        setDistritos([]);
        setLoadingUbigeo(false);
      };
      cargar();
    } else {
      setProvincias([]);
      setDistritos([]);
    }
  }, [selectedDepId]);

  // Cargar distritos cuando cambia provincia
  useEffect(() => {
    if (selectedProvId) {
      const cargar = async () => {
        setLoadingUbigeo(true);
        const data = await UbigeoService.obtenerDistritos(selectedProvId);
        setDistritos(data);
        setLoadingUbigeo(false);
      };
      cargar();
    } else {
      setDistritos([]);
    }
  }, [selectedProvId]);

  // =========================================================================
  // VALIDACIÓN POR PASO
  // =========================================================================

  const validarPaso = async (): Promise<boolean> => {
    let camposAValidar: (keyof RegistroScoutMobileFormData)[] = [];

    switch (paso) {
      case 1:
        camposAValidar = ['nombres', 'apellidos', 'sexo', 'fecha_nacimiento'];
        break;
      case 2:
        camposAValidar = ['rama_actual'];
        break;
      case 3:
        // Paso 3 es opcional, no requiere validación estricta
        camposAValidar = [];
        break;
      case 4:
        // Paso 4 es opcional
        camposAValidar = [];
        break;
    }

    if (camposAValidar.length === 0) return true;
    return await trigger(camposAValidar);
  };

  // =========================================================================
  // NAVEGACIÓN
  // =========================================================================

  const handleSiguiente = async () => {
    const valido = await validarPaso();
    if (valido && paso < TOTAL_PASOS) {
      setPaso((paso + 1) as Paso);
    }
  };

  const handleAnterior = () => {
    if (paso > 1) {
      setPaso((paso - 1) as Paso);
    }
  };

  // =========================================================================
  // UBICACIÓN
  // =========================================================================

  const handleLocationSelect = (data: {
    latitud: number;
    longitud: number;
    direccion: string;
  }) => {
    // Solo actualizar coordenadas y dirección del mapa, sin afectar otros campos
    setValue('ubicacion_latitud', data.latitud, { shouldValidate: false });
    setValue('ubicacion_longitud', data.longitud, { shouldValidate: false });
    setValue('ubicacion_direccion', data.direccion, { shouldValidate: false });
    // Cerrar el picker
    setShowLocationPicker(false);
  };

  // =========================================================================
  // REGISTRO
  // =========================================================================

  const onSubmit = async (data: RegistroScoutMobileFormData) => {
    console.log('🚀 [RegistroScoutRapido] onSubmit iniciado');
    console.log('📋 Datos del formulario:', JSON.stringify(data, null, 2));
    
    setLoading(true);
    setError(null);

    try {
      const hoy = new Date().toISOString().split('T')[0];
      
      // Normalizar sexo a formato DB
      const sexoNormalizado: 'MASCULINO' | 'FEMENINO' = 
        data.sexo === 'F' || data.sexo === 'FEMENINO' ? 'FEMENINO' : 'MASCULINO';

      // Preparar familiares (filtrar vacíos)
      const familiaresValidos = (data.familiares || []).filter(f => 
        f.nombres?.trim() || f.apellidos?.trim()
      ).map(f => ({
        nombres: f.nombres?.trim() || '',
        apellidos: f.apellidos?.trim() || '',
        parentesco: f.parentesco || 'PADRE',
        celular: f.celular?.trim() || undefined,
        correo: f.correo?.trim() || undefined,
        es_contacto_emergencia: f.es_contacto_emergencia ?? true,
        es_apoderado: f.es_apoderado ?? false,
      }));

      // Usar registrarScoutConFamiliares que soporta TODOS los campos
      const datosCompletos = {
        // Datos personales
        nombres: data.nombres.trim(),
        apellidos: data.apellidos.trim(),
        sexo: sexoNormalizado,
        fecha_nacimiento: data.fecha_nacimiento,
        tipo_documento: data.tipo_documento || 'DNI',
        numero_documento: data.numero_documento?.trim() || undefined,

        // Datos scout
        rama_actual: data.rama_actual,
        fecha_ingreso: data.fecha_ingreso || hoy,

        // Contacto
        celular: data.celular || undefined,

        // Ubicación completa
        departamento: data.departamento || 'Lima',
        provincia: data.provincia || 'Lima',
        distrito: data.distrito || 'Lima',
        direccion_completa: data.direccion_completa || undefined,
        
        // Coordenadas GPS
        ubicacion_latitud: data.ubicacion_latitud || null,
        ubicacion_longitud: data.ubicacion_longitud || null,

        // Familiares (array)
        familiares: familiaresValidos,
      };

      console.log('📤 Enviando a ScoutService.registrarScoutConFamiliares:', JSON.stringify(datosCompletos, null, 2));
      const result = await ScoutService.registrarScoutConFamiliares(datosCompletos);
      console.log('📥 Respuesta de registrarScoutConFamiliares:', JSON.stringify(result, null, 2));

      // Nota: registrarScoutConFamiliares retorna { success, scout_id, codigo_scout, error }
      if (result.success && result.scout_id) {
        const scoutId = result.scout_id;
        console.log('✅ Scout creado con ID:', scoutId, 'Código:', result.codigo_scout);
        
        // Guardar patrulla si se seleccionó
        if (data.patrulla_id) {
          try {
            console.log('🎯 Asignando patrulla:', data.patrulla_id);
            await supabase
              .from('miembros_patrulla')
              .insert({
                scout_id: scoutId,
                patrulla_id: data.patrulla_id,
                cargo_patrulla: data.cargo_patrulla || 'MIEMBRO',
                fecha_ingreso: data.fecha_ingreso || hoy,
                estado_miembro: 'ACTIVO'
              });
            console.log('✅ Patrulla asignada correctamente');
          } catch (err) {
            console.error('⚠️ Error asignando patrulla:', err);
          }
        }
        
        console.log('🎉 Llamando onSuccess()...');
        onSuccess();
      } else if (result.success && !result.scout_id) {
        // Success pero sin ID - algo raro
        console.error('⚠️ result.success=true pero no hay scout_id:', result);
        setError('El scout se creó pero no se obtuvo confirmación. Por favor verifica la lista.');
        // Llamar onSuccess de todas formas para cerrar
        setTimeout(() => onSuccess(), 2000);
      } else {
        // Error explícito
        console.error('❌ Error en registrarScoutConFamiliares:', result.error);
        setError(result.error || 'Error al registrar el scout');
      }
    } catch (err) {
      console.error('❌ Error catch:', err);
      setError(err instanceof Error ? err.message : 'Error inesperado al registrar');
    } finally {
      setLoading(false);
      console.log('🏁 onSubmit finalizado');
    }
  };

  // =========================================================================
  // RENDER HELPERS
  // =========================================================================

  const renderError = (fieldName: keyof RegistroScoutMobileFormData) => {
    const error = errors[fieldName];
    if (!error) return null;
    
    return (
      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error.message as string}
      </p>
    );
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  // Location Picker fullscreen
  if (showLocationPicker) {
    return (
      <LocationPickerMobile
        onLocationSelect={handleLocationSelect}
        initialLatitud={watch('ubicacion_latitud')}
        initialLongitud={watch('ubicacion_longitud')}
        initialDireccion={watch('ubicacion_direccion')}
        onClose={() => setShowLocationPicker(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <UserPlus className="w-6 h-6" />
              <h2 className="text-lg font-bold">Registro Rápido</h2>
            </div>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white p-1"
              type="button"
            >
              ✕
            </button>
          </div>
          <div className="text-sm text-blue-100">
            Paso {paso} de {TOTAL_PASOS}
          </div>
          {/* Progress bar */}
          <div className="flex space-x-1 mt-2">
            {Array.from({ length: TOTAL_PASOS }).map((_, i) => (
              <div 
                key={i}
                className={`h-1 flex-1 rounded transition-colors ${
                  i < paso ? 'bg-white' : 'bg-white/30'
                }`} 
              />
            ))}
          </div>
        </div>

        {/* Contenido */}
        <form 
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-4"
        >
          {/* ============= PASO 1: Datos Personales ============= */}
          {paso === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Datos Personales
              </h3>

              {/* Nombres */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombres <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('nombres')}
                  type="text"
                  className={`w-full p-3 border rounded-lg transition-colors ${
                    errors.nombres ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Juan Carlos"
                  autoFocus
                />
                {renderError('nombres')}
              </div>

              {/* Apellidos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('apellidos')}
                  type="text"
                  className={`w-full p-3 border rounded-lg ${
                    errors.apellidos ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Pérez García"
                />
                {renderError('apellidos')}
              </div>

              {/* Sexo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexo <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="sexo"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => field.onChange('M')}
                        className={`p-3 rounded-lg border-2 font-medium transition-all ${
                          field.value === 'M'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        👦 Masculino
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('F')}
                        className={`p-3 rounded-lg border-2 font-medium transition-all ${
                          field.value === 'F'
                            ? 'border-pink-500 bg-pink-50 text-pink-700'
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        👧 Femenino
                      </button>
                    </div>
                  )}
                />
                {renderError('sexo')}
              </div>

              {/* Fecha de Nacimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('fecha_nacimiento')}
                  type="date"
                  className={`w-full p-3 border rounded-lg ${
                    errors.fecha_nacimiento ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  max={new Date().toISOString().split('T')[0]}
                />
                {renderError('fecha_nacimiento')}
              </div>

              {/* DNI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Documento (Opcional)
                </label>
                <input
                  {...register('numero_documento')}
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Ej: 12345678"
                  maxLength={8}
                />
              </div>
            </div>
          )}

          {/* ============= PASO 2: Datos Scout ============= */}
          {paso === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 mb-3">
                ⚜️ Datos Scout
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rama <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="rama_actual"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-3">
                      {RAMAS.map(rama => (
                        <button
                          key={rama.id}
                          type="button"
                          onClick={() => field.onChange(rama.id)}
                          className={`p-4 rounded-lg border-2 font-medium transition-all ${
                            field.value === rama.id
                              ? rama.color === 'yellow' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' :
                                rama.color === 'green' ? 'border-green-500 bg-green-50 text-green-700' :
                                rama.color === 'orange' ? 'border-orange-500 bg-orange-50 text-orange-700' :
                                'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 text-gray-700'
                          }`}
                        >
                          <span className="text-2xl block mb-1">{rama.icon}</span>
                          {rama.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
                {renderError('rama_actual')}
              </div>

              {/* Fecha de Ingreso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  Fecha de Ingreso
                </label>
                <input
                  {...register('fecha_ingreso')}
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Patrulla */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-green-600" />
                  Patrulla (Opcional)
                </label>
                <Controller
                  name="patrulla_id"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                      <option value="">Sin patrulla asignada</option>
                      {patrullas.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  )}
                />
                {patrullas.length === 0 && ramaActual && (
                  <p className="text-xs text-gray-500 mt-1">
                    No hay patrullas activas para {ramaActual}
                  </p>
                )}
              </div>

              {/* Cargo en Patrulla */}
              {patrullaId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    🎖️ Cargo en Patrulla
                  </label>
                  <Controller
                    name="cargo_patrulla"
                    control={control}
                    render={({ field }) => (
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      >
                        {CARGOS_PATRULLA.map(cargo => (
                          <option key={cargo} value={cargo}>{cargo}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              )}

              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Estado:</strong> ACTIVO (automático)
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  El scout será registrado como activo y podrá participar inmediatamente.
                </p>
              </div>
            </div>
          )}

          {/* ============= PASO 3: Contacto y Ubicación ============= */}
          {paso === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-500" />
                Contacto y Ubicación
              </h3>

              <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded mb-4">
                <p className="text-sm text-green-800">
                  <strong>Opcional:</strong> Estos datos ayudan a contactar al scout y ubicar su domicilio.
                </p>
              </div>

              {/* Celular */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📱 Celular Principal
                </label>
                <input
                  {...register('celular')}
                  type="tel"
                  className={`w-full p-3 border rounded-lg ${
                    errors.celular ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 987654321"
                  maxLength={9}
                />
                {renderError('celular')}
              </div>

              {/* Departamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🗺️ Departamento
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={watch('departamento') || ''}
                  onChange={(e) => {
                    const dep = departamentos.find(d => d.nombre === e.target.value);
                    setSelectedDepId(dep?.id || null);
                    setSelectedProvId(null);
                    setValue('departamento', e.target.value);
                    setValue('provincia', '');
                    setValue('distrito', '');
                  }}
                >
                  <option value="">Seleccionar departamento...</option>
                  {departamentos.map(d => (
                    <option key={d.id} value={d.nombre}>{d.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Provincia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🏛️ Provincia {loadingUbigeo && selectedDepId && <Loader2 className="inline w-4 h-4 animate-spin" />}
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  disabled={!selectedDepId}
                  value={watch('provincia') || ''}
                  onChange={(e) => {
                    const prov = provincias.find(p => p.nombre === e.target.value);
                    setSelectedProvId(prov?.id || null);
                    setValue('provincia', e.target.value);
                    setValue('distrito', '');
                  }}
                >
                  <option value="">{selectedDepId ? 'Seleccionar provincia...' : 'Primero seleccione departamento'}</option>
                  {provincias.map(p => (
                    <option key={p.id} value={p.nombre}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Distrito */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🏘️ Distrito {loadingUbigeo && selectedProvId && <Loader2 className="inline w-4 h-4 animate-spin" />}
                </label>
                <select
                  {...register('distrito')}
                  className="w-full p-3 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  disabled={!selectedProvId}
                >
                  <option value="">{selectedProvId ? 'Seleccionar distrito...' : 'Primero seleccione provincia'}</option>
                  {distritos.map(d => (
                    <option key={d.id} value={d.nombre}>{d.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🏠 Dirección Completa
                </label>
                <input
                  {...register('direccion_completa')}
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Ej: Av. Primavera 123, Dpto 402"
                />
              </div>

              {/* Ubicación en Mapa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 Ubicación en Mapa
                </label>
                
                {/* Vista previa de ubicación con mini-mapa Leaflet */}
                {watch('ubicacion_latitud') && watch('ubicacion_longitud') ? (
                  <MiniMapPreview
                    lat={watch('ubicacion_latitud')!}
                    lng={watch('ubicacion_longitud')!}
                    address={ubicacionDireccion}
                    onClick={() => setShowLocationPicker(true)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(true)}
                    className="w-full p-4 border-2 border-dashed border-blue-300 rounded-lg 
                               bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-blue-600 font-medium">
                      Tocar para seleccionar ubicación
                    </p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ============= PASO 4: Familiares ============= */}
          {paso === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Familiares (Opcional)
                </h3>
                <button
                  type="button"
                  onClick={() => agregarFamiliar({
                    nombres: '',
                    apellidos: '',
                    parentesco: 'PADRE',
                    celular: '',
                    correo: '',
                    es_contacto_emergencia: true,
                    es_apoderado: false,
                  })}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>

              {familiares.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-3">No hay familiares registrados</p>
                  <button
                    type="button"
                    onClick={() => agregarFamiliar({
                      nombres: '',
                      apellidos: '',
                      parentesco: 'PADRE',
                      celular: '',
                      correo: '',
                      es_contacto_emergencia: true,
                      es_apoderado: false,
                    })}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
                  >
                    Agregar Familiar
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {familiares.map((familiar, index) => (
                    <div key={familiar.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">
                          Familiar {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => eliminarFamiliar(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* Parentesco */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Parentesco
                          </label>
                          <select
                            {...register(`familiares.${index}.parentesco`)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                          >
                            {PARENTESCOS.map(p => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Nombres y Apellidos */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Nombres
                            </label>
                            <input
                              {...register(`familiares.${index}.nombres`)}
                              type="text"
                              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                              placeholder="Nombres"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Apellidos
                            </label>
                            <input
                              {...register(`familiares.${index}.apellidos`)}
                              type="text"
                              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                              placeholder="Apellidos"
                            />
                          </div>
                        </div>

                        {/* Celular y Correo */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Celular
                            </label>
                            <input
                              {...register(`familiares.${index}.celular`)}
                              type="tel"
                              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                              placeholder="987654321"
                              maxLength={9}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Correo
                            </label>
                            <input
                              {...register(`familiares.${index}.correo`)}
                              type="email"
                              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                              placeholder="correo@email.com"
                            />
                          </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              {...register(`familiares.${index}.es_contacto_emergencia`)}
                              type="checkbox"
                              className="w-4 h-4 rounded border-gray-300 text-purple-600"
                            />
                            Contacto emergencia
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              {...register(`familiares.${index}.es_apoderado`)}
                              type="checkbox"
                              className="w-4 h-4 rounded border-gray-300 text-purple-600"
                            />
                            Es apoderado
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Puedes agregar más familiares después desde la web.
                </p>
              </div>
            </div>
          )}

          {/* ============= PASO 5: Confirmación ============= */}
          {paso === 5 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">
                  Confirmar Registro
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Revisa los datos antes de registrar
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {/* Nombre */}
                <div>
                  <p className="text-xs text-gray-500">Nombre Completo</p>
                  <p className="font-semibold text-gray-800">
                    {watch('nombres')} {watch('apellidos')}
                  </p>
                </div>

                {/* Sexo y Fecha */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Sexo</p>
                    <p className="font-semibold text-gray-800">
                      {watch('sexo') === 'M' ? '👦 Masculino' : '👧 Femenino'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fecha Nac.</p>
                    <p className="font-semibold text-gray-800">
                      {watch('fecha_nacimiento') && 
                        new Date(watch('fecha_nacimiento')).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>

                {/* DNI */}
                {watch('numero_documento') && (
                  <div>
                    <p className="text-xs text-gray-500">Documento</p>
                    <p className="font-semibold text-gray-800">
                      DNI: {watch('numero_documento')}
                    </p>
                  </div>
                )}

                {/* Rama */}
                <div>
                  <p className="text-xs text-gray-500">Rama</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    watch('rama_actual') === 'Manada' ? 'bg-yellow-100 text-yellow-800' :
                    watch('rama_actual') === 'Tropa' ? 'bg-green-100 text-green-800' :
                    watch('rama_actual') === 'Comunidad' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {watch('rama_actual')}
                  </span>
                </div>

                {/* Patrulla y Cargo */}
                {watch('patrulla_id') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Patrulla</p>
                      <p className="font-semibold text-gray-800">
                        🚩 {patrullas.find(p => p.id === watch('patrulla_id'))?.nombre || 'Asignada'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cargo</p>
                      <p className="font-semibold text-gray-800">
                        🎖️ {watch('cargo_patrulla')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Contacto */}
                {(watch('celular') || watch('distrito') || watch('direccion_completa')) && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Contacto
                    </p>
                    {watch('celular') && (
                      <p className="text-sm text-gray-700">📱 {watch('celular')}</p>
                    )}
                    {watch('distrito') && (
                      <p className="text-sm text-gray-700">🏘️ {watch('distrito')}</p>
                    )}
                    {watch('direccion_completa') && (
                      <p className="text-sm text-gray-700">🏠 {watch('direccion_completa')}</p>
                    )}
                    {watch('ubicacion_direccion') && (
                      <p className="text-sm text-gray-700 line-clamp-1">
                        📍 {watch('ubicacion_direccion')}
                      </p>
                    )}
                  </div>
                )}

                {/* Familiares (nuevo sistema N familiares) */}
                {familiares.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Familiares ({familiares.length})
                    </p>
                    {familiares.map((familiar, index) => (
                      <div key={familiar.id} className="text-sm text-gray-700 mb-1">
                        👤 {watch(`familiares.${index}.nombres`)} {watch(`familiares.${index}.apellidos`)} 
                        <span className="text-gray-500"> ({watch(`familiares.${index}.parentesco`)})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Apoderado legacy (compatibilidad) */}
                {!familiares.length && (watch('familiar_nombres') || watch('familiar_apellidos')) && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs text-gray-500 mb-2">Apoderado</p>
                    <p className="font-semibold text-gray-800">
                      {watch('familiar_nombres')} {watch('familiar_apellidos')}
                    </p>
                    {watch('familiar_telefono') && (
                      <p className="text-sm text-gray-600 mt-1">
                        📱 {watch('familiar_telefono')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                <p className="text-xs text-yellow-800">
                  💡 <strong>Tip:</strong> Los datos adicionales (email, historia médica, etc.) se pueden completar después desde la web.
                </p>
              </div>

              {/* Mostrar error si existe */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Error al registrar</p>
                      <p className="text-xs text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer con botones */}
        <div className="sticky bottom-0 bg-white border-t p-4 space-y-2">
          <div className="flex space-x-2">
            {paso > 1 && (
              <button
                type="button"
                onClick={handleAnterior}
                className="flex-1 flex items-center justify-center space-x-2 py-3 border-2 
                           border-gray-300 text-gray-700 font-semibold rounded-lg 
                           active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Anterior</span>
              </button>
            )}

            {paso < TOTAL_PASOS ? (
              <button
                type="button"
                onClick={handleSiguiente}
                className="flex-1 flex items-center justify-center space-x-2 py-3 
                           bg-gradient-to-r from-blue-600 to-blue-700 text-white 
                           font-semibold rounded-lg active:scale-95 transition-transform"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 
                           text-white font-semibold rounded-lg active:scale-95 
                           transition-transform disabled:opacity-50"
              >
                {loading ? '⏳ Registrando...' : '✅ Registrar Scout'}
              </button>
            )}
          </div>

          {paso === 1 && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-gray-600 text-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
