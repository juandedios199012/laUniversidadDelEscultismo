// ============================================================================
// LOCATION PICKER MOBILE - V2 con Geolocalización Mejorada
// ============================================================================
// Selector de ubicación optimizado para dispositivos móviles
// Usa Leaflet + OpenStreetMap (gratuito)
// Incluye: GPS con alta precisión, feedback visual, marcador diferenciado
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, X, Check, Loader2, Crosshair, AlertCircle } from 'lucide-react';

interface LocationPickerMobileProps {
  onLocationSelect: (data: {
    latitud: number;
    longitud: number;
    direccion: string;
  }) => void;
  initialLatitud?: number;
  initialLongitud?: number;
  initialDireccion?: string;
  onClose: () => void;
}

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

type GeoStatus = 'idle' | 'locating' | 'success' | 'error';

const LocationPickerMobile: React.FC<LocationPickerMobileProps> = ({
  onLocationSelect,
  initialLatitud,
  initialLongitud,
  initialDireccion,
  onClose,
}) => {
  const [location, setLocation] = useState<LocationData | null>(
    initialLatitud && initialLongitud
      ? { lat: initialLatitud, lng: initialLongitud, address: initialDireccion || '' }
      : null
  );
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Referencias para el mapa y marcadores
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const myLocationMarkerRef = useRef<any>(null);
  const myLocationCircleRef = useRef<any>(null);

  // Geocodificación inversa (obtener dirección desde coordenadas)
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  // Obtener ubicación actual con feedback mejorado
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Tu dispositivo no soporta geolocalización');
      setGeoStatus('error');
      return;
    }

    // Verificar si estamos en HTTPS (requerido para geolocalización)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setError('La geolocalización requiere conexión segura (HTTPS)');
      setGeoStatus('error');
      return;
    }

    setGeoStatus('locating');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const L = (window as any).L;
        
        // Obtener dirección
        const address = await reverseGeocode(latitude, longitude);
        
        // Actualizar ubicación seleccionada
        setLocation({ lat: latitude, lng: longitude, address });
        setGeoStatus('success');

        // Actualizar mapa si está disponible
        if (mapRef.current && L) {
          // Animar vuelo suave a la ubicación
          mapRef.current.flyTo([latitude, longitude], 17, {
            duration: 1.5,
            easeLinearity: 0.25
          });

          // Crear icono personalizado para "Mi Ubicación" (punto azul estilo Google Maps)
          const myLocationIcon = L.divIcon({
            className: 'my-location-marker',
            html: `
              <div style="
                width: 20px;
                height: 20px;
                background: #4285F4;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(66, 133, 244, 0.5);
              "></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          // Limpiar marcadores anteriores de "mi ubicación"
          if (myLocationMarkerRef.current) {
            mapRef.current.removeLayer(myLocationMarkerRef.current);
          }
          if (myLocationCircleRef.current) {
            mapRef.current.removeLayer(myLocationCircleRef.current);
          }

          // Agregar círculo de precisión
          myLocationCircleRef.current = L.circle([latitude, longitude], {
            color: '#4285F4',
            fillColor: '#4285F4',
            fillOpacity: 0.15,
            radius: accuracy,
            weight: 1
          }).addTo(mapRef.current);

          // Agregar marcador de ubicación actual
          myLocationMarkerRef.current = L.marker([latitude, longitude], { 
            icon: myLocationIcon,
            zIndexOffset: 1000
          }).addTo(mapRef.current);

          // Actualizar o crear marcador de selección
          const iconDefault = L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            markerRef.current = L.marker([latitude, longitude], { icon: iconDefault }).addTo(mapRef.current);
          }
        }

        // Auto-limpiar estado de éxito después de 2 segundos
        setTimeout(() => {
          setGeoStatus('idle');
        }, 2000);
      },
      (err) => {
        console.error('Error geolocation:', err);
        setGeoStatus('error');
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Permiso denegado. Ve a Configuración del navegador > Permisos > Ubicación y permite el acceso.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Ubicación no disponible. Verifica que el GPS esté activado e intenta en un lugar abierto.');
            break;
          case err.TIMEOUT:
            setError('Tiempo de espera agotado. El GPS tardó demasiado. Intenta de nuevo.');
            break;
          default:
            setError('Error al obtener ubicación. Intenta de nuevo.');
        }
      },
      {
        enableHighAccuracy: true, // Usar GPS real (no triangulación de antenas)
        timeout: 15000, // 15 segundos de timeout
        maximumAge: 0, // No usar cache, siempre ubicación fresca
      }
    );
  }, [reverseGeocode]);

  // Cargar mapa con Leaflet (lazy load)
  useEffect(() => {
    // Agregar CSS de Leaflet si no existe
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Cargar script de Leaflet si no existe
    if (!(window as any).L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Inicializar mapa cuando Leaflet esté cargado
  useEffect(() => {
    if (!mapLoaded) return;
    
    const L = (window as any).L;
    if (!L) return;

    const container = document.getElementById('mobile-map');
    if (!container) return;

    // Limpiar mapa anterior si existe
    if ((container as any)._leaflet_id) {
      (container as any)._leaflet_id = null;
      container.innerHTML = '';
    }

    // Centro por defecto: Lima, Perú (o ubicación inicial si existe)
    const center: [number, number] = location 
      ? [location.lat, location.lng] 
      : [-12.0464, -77.0428];

    const map = L.map('mobile-map', {
      zoomControl: false // Quitamos control de zoom default para mejor UX móvil
    }).setView(center, 15);

    // Agregar control de zoom en la izquierda
    L.control.zoom({ position: 'topleft' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    // Guardar referencia del mapa
    mapRef.current = map;

    // Fix para iconos de Leaflet
    const iconDefault = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Crear marcador inicial si hay ubicación
    if (location) {
      markerRef.current = L.marker([location.lat, location.lng], { icon: iconDefault }).addTo(map);
    }

    // Click en mapa para seleccionar ubicación
    map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;

      // Mover o crear marcador
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: iconDefault }).addTo(map);
      }

      // Geocodificación inversa
      const address = await reverseGeocode(lat, lng);
      setLocation({ lat, lng, address });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      myLocationMarkerRef.current = null;
      myLocationCircleRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded]); // Solo inicializar cuando carga el mapa, no cuando cambia location

  const handleConfirm = () => {
    if (location) {
      onLocationSelect({
        latitud: location.lat,
        longitud: location.lng,
        direccion: location.address,
      });
      onClose();
    }
  };

  // Renderizar botón de ubicación con estados
  const renderLocationButton = () => {
    const baseClasses = "absolute bottom-24 right-4 shadow-lg rounded-full p-3.5 transition-all z-[1000] active:scale-95";
    
    switch (geoStatus) {
      case 'locating':
        return (
          <button
            disabled
            className={`${baseClasses} bg-blue-500`}
            aria-label="Localizando..."
          >
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </button>
        );
      case 'success':
        return (
          <button
            disabled
            className={`${baseClasses} bg-green-500`}
            aria-label="Ubicación encontrada"
          >
            <Check className="w-6 h-6 text-white" />
          </button>
        );
      case 'error':
        return (
          <button
            onClick={getCurrentLocation}
            className={`${baseClasses} bg-red-500 hover:bg-red-600`}
            aria-label="Error - Reintentar ubicación"
          >
            <AlertCircle className="w-6 h-6 text-white" />
          </button>
        );
      default:
        return (
          <button
            onClick={getCurrentLocation}
            className={`${baseClasses} bg-white hover:bg-gray-50`}
            aria-label="Obtener mi ubicación"
          >
            <Crosshair className="w-6 h-6 text-blue-600" />
          </button>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between safe-area-pt">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          <h2 className="font-semibold">Seleccionar Ubicación</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Instrucciones / Estado de geolocalización */}
      <div className={`border-b p-3 transition-colors ${
        geoStatus === 'locating' ? 'bg-blue-100 border-blue-200' :
        geoStatus === 'success' ? 'bg-green-100 border-green-200' :
        geoStatus === 'error' ? 'bg-red-100 border-red-200' :
        'bg-blue-50 border-blue-100'
      }`}>
        <p className={`text-sm text-center ${
          geoStatus === 'locating' ? 'text-blue-700' :
          geoStatus === 'success' ? 'text-green-700' :
          geoStatus === 'error' ? 'text-red-700' :
          'text-blue-700'
        }`}>
          {geoStatus === 'locating' && (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Localizando tu ubicación...
            </span>
          )}
          {geoStatus === 'success' && '✅ ¡Ubicación encontrada!'}
          {geoStatus === 'error' && '❌ No se pudo obtener la ubicación'}
          {geoStatus === 'idle' && '📍 Toca el mapa para marcar o usa el botón de ubicación'}
        </p>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        <div 
          id="mobile-map" 
          className="w-full h-full"
          style={{ minHeight: '300px' }}
        />

        {/* Botón Mi Ubicación (estilo Google Maps) */}
        {renderLocationButton()}

        {/* Error detallado */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-300 
                          rounded-lg p-3 z-[1000] shadow-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700 font-medium">Error de ubicación</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-xs text-red-500 underline mt-2"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dirección seleccionada */}
      {location && (
        <div className="bg-gray-50 border-t p-4">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1">Ubicación seleccionada:</p>
              <p className="text-sm text-gray-800 line-clamp-2">{location.address}</p>
              <p className="text-xs text-gray-400 mt-1">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-white border-t p-4 safe-area-pb">
        <button
          onClick={handleConfirm}
          disabled={!location}
          className="w-full py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white 
                     font-semibold rounded-xl flex items-center justify-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-[0.98] transition-transform shadow-lg"
        >
          <Check className="w-5 h-5" />
          Confirmar Ubicación
        </button>
      </div>
    </div>
  );
};

export default LocationPickerMobile;
