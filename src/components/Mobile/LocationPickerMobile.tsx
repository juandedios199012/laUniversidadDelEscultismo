// ============================================================================
// LOCATION PICKER MOBILE
// ============================================================================
// Selector de ubicación optimizado para dispositivos móviles
// Usa Leaflet + OpenStreetMap (gratuito)
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, X, Check, Loader2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Obtener ubicación actual
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Tu dispositivo no soporta geolocalización');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Geocodificación inversa
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          setLocation({
            lat: latitude,
            lng: longitude,
            address: data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          });
        } catch {
          setLocation({
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          });
        }
        
        setLoading(false);
      },
      (err) => {
        console.error('Error geolocation:', err);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Permiso de ubicación denegado. Actívalo en configuración.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Ubicación no disponible. Intenta en un lugar abierto.');
            break;
          case err.TIMEOUT:
            setError('Tiempo de espera agotado. Intenta de nuevo.');
            break;
          default:
            setError('Error al obtener ubicación.');
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

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

    // Centro por defecto: Lima, Perú
    const center: [number, number] = location 
      ? [location.lat, location.lng] 
      : [-12.0464, -77.0428];

    const map = L.map('mobile-map').setView(center, 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

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

    let marker: any = null;

    if (location) {
      marker = L.marker([location.lat, location.lng], { icon: iconDefault }).addTo(map);
    }

    // Click en mapa para seleccionar ubicación
    map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;

      // Mover o crear marcador
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng], { icon: iconDefault }).addTo(map);
      }

      // Geocodificación inversa
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        setLocation({
          lat,
          lng,
          address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
      } catch {
        setLocation({
          lat,
          lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
      }
    });

    return () => {
      map.remove();
    };
  }, [mapLoaded, location?.lat, location?.lng]);

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

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          <h2 className="font-semibold">Seleccionar Ubicación</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border-b border-blue-100 p-3">
        <p className="text-sm text-blue-700 text-center">
          📍 Toca el mapa para marcar la ubicación o usa el botón de ubicación actual
        </p>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        <div 
          id="mobile-map" 
          className="w-full h-full"
          style={{ minHeight: '300px' }}
        />

        {/* Botón ubicación actual */}
        <button
          onClick={getCurrentLocation}
          disabled={loading}
          className="absolute bottom-20 right-4 bg-white shadow-lg rounded-full p-3 
                     active:scale-95 transition-transform z-[1000]"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          ) : (
            <Navigation className="w-6 h-6 text-blue-600" />
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-100 border border-red-300 
                          rounded-lg p-3 z-[1000]">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Dirección seleccionada */}
      {location && (
        <div className="bg-gray-50 border-t p-4">
          <p className="text-xs text-gray-500 mb-1">Dirección seleccionada:</p>
          <p className="text-sm text-gray-800 line-clamp-2">{location.address}</p>
        </div>
      )}

      {/* Footer */}
      <div className="bg-white border-t p-4 safe-area-pb">
        <button
          onClick={handleConfirm}
          disabled={!location}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white 
                     font-semibold rounded-lg flex items-center justify-center gap-2
                     disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          <Check className="w-5 h-5" />
          Confirmar Ubicación
        </button>
      </div>
    </div>
  );
};

export default LocationPickerMobile;
