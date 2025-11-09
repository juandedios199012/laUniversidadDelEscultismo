import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import L from 'leaflet';

// Fix para los iconos de Leaflet - más robusto
try {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
} catch (error) {
  console.warn('Error configurando iconos de Leaflet:', error);
}

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialPosition?: [number, number];
  height?: string;
  showCurrentLocation?: boolean;
}

// Componente para capturar clics en el mapa
function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<LatLng | null>(null);

  const map = useMapEvents({
    click(e) {
      try {
        setPosition(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      } catch (error) {
        console.error('Error al seleccionar ubicación:', error);
      }
    },
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const newPosition = new LatLng(latitude, longitude);
            setPosition(newPosition);
            map.setView(newPosition, 13);
            onLocationSelect(latitude, longitude);
          } catch (error) {
            console.error('Error al obtener ubicación actual:', error);
          }
        },
        (error) => {
          console.warn('No se pudo obtener la ubicación actual:', error);
        },
        {
          timeout: 5000,
          maximumAge: 60000,
          enableHighAccuracy: false
        }
      );
    }
  }, [map, onLocationSelect]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>📍 Ubicación seleccionada</Popup>
    </Marker>
  );
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialPosition = [-12.0464, -77.0428], // Lima, Perú por defecto
  height = '300px',
  showCurrentLocation = true,
}) => {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dar tiempo para que Leaflet se inicialice
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleLocationSelect = async (lat: number, lng: number) => {
    try {
      setSelectedPosition([lat, lng]);
      
      // Geocodificación inversa usando Nominatim (gratuito)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      const address = data.display_name || '';
      onLocationSelect(lat, lng, address);
    } catch (error) {
      console.error('Error al obtener dirección:', error);
      onLocationSelect(lat, lng);
    }
  };

  if (isLoading) {
    return (
      <div 
        className="w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center" 
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="w-full" style={{ height }}>
        <MapContainer
          center={initialPosition}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {showCurrentLocation && (
            <LocationMarker onLocationSelect={handleLocationSelect} />
          )}
          
          {selectedPosition && (
            <Marker position={selectedPosition}>
              <Popup>📍 Ubicación confirmada</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    );
  } catch (error) {
    console.error('Error renderizando mapa:', error);
    return (
      <div 
        className="w-full bg-yellow-50 border-2 border-yellow-200 rounded-lg flex items-center justify-center" 
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-yellow-800">No se pudo cargar el mapa. Verifique su conexión a internet.</p>
        </div>
      </div>
    );
  }
};

export default LocationPicker;