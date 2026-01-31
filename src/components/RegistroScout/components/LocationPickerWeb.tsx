/**
 * Location Picker Component for Web
 * Uses Leaflet/OpenStreetMap for map display
 * Allows user to select location by clicking or using geolocation
 * Shows mini-map preview when location is selected
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, X, Check, Loader2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// Types
interface LocationData {
  latitud: number;
  longitud: number;
  direccion: string;
}

interface LocationPickerWebProps {
  value?: LocationData | null;
  onChange: (location: LocationData | null) => void;
  disabled?: boolean;
}

// Lima, Peru default coordinates
const DEFAULT_LAT = -12.0464;
const DEFAULT_LNG = -77.0428;

export function LocationPickerWeb({ value, onChange, disabled }: LocationPickerWebProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [previewMapReady, setPreviewMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(value || null);
  const mapRef = useRef<HTMLDivElement>(null);
  const previewMapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const previewMapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const previewMarkerRef = useRef<any>(null);

  // Sync selectedLocation when value prop changes (e.g., when editing a scout)
  useEffect(() => {
    if (value && (value.latitud !== selectedLocation?.latitud || value.longitud !== selectedLocation?.longitud)) {
      setSelectedLocation(value);
    } else if (!value && selectedLocation) {
      setSelectedLocation(null);
    }
  }, [value?.latitud, value?.longitud, value?.direccion]);

  // Load Leaflet dynamically when dialog opens OR when value exists (for preview)
  useEffect(() => {
    const shouldLoad = isOpen || value;
    if (!shouldLoad) return;

    const loadLeaflet = async () => {
      // Check if already loaded
      if ((window as any).L) {
        setMapReady(true);
        setPreviewMapReady(true);
        return;
      }

      // Load CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        setMapReady(true);
        setPreviewMapReady(true);
      };
      document.head.appendChild(script);
    };

    loadLeaflet();
  }, [isOpen, value]);

  // Initialize map when ready
  useEffect(() => {
    if (!mapReady || !isOpen) return;

    // Small delay to ensure DOM is ready
    const initTimeout = setTimeout(() => {
      if (!mapRef.current) return;

      const L = (window as any).L;
      if (!L) return;

      // Clean up previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initial position - use value prop for initial position
      const initialLat = value?.latitud || DEFAULT_LAT;
      const initialLng = value?.longitud || DEFAULT_LNG;

      // Create map
      const map = L.map(mapRef.current).setView([initialLat, initialLng], 15);
      mapInstanceRef.current = map;

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add marker if location exists
      if (value) {
        markerRef.current = L.marker([value.latitud, value.longitud], {
          draggable: true
        }).addTo(map);

        // Handle marker drag
        markerRef.current.on('dragend', async () => {
          const pos = markerRef.current.getLatLng();
          const address = await reverseGeocode(pos.lat, pos.lng);
          setSelectedLocation({
            latitud: pos.lat,
            longitud: pos.lng,
            direccion: address
          });
        });
        
        // Also set initial selectedLocation from value
        setSelectedLocation(value);
      }

      // Handle map click
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;

        // Remove existing marker
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }

        // Add new marker
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);

        // Handle marker drag
        markerRef.current.on('dragend', async () => {
          const pos = markerRef.current.getLatLng();
          const address = await reverseGeocode(pos.lat, pos.lng);
          setSelectedLocation({
            latitud: pos.lat,
            longitud: pos.lng,
            direccion: address
          });
        });

        // Get address
        const address = await reverseGeocode(lat, lng);
        setSelectedLocation({
          latitud: lat,
          longitud: lng,
          direccion: address
        });
      });

      // Fix map size on dialog open - multiple attempts with safety checks
      const safeInvalidateSize = () => {
        try {
          if (mapInstanceRef.current && 
              mapInstanceRef.current.getContainer() && 
              mapInstanceRef.current._loaded) {
            mapInstanceRef.current.invalidateSize();
          }
        } catch (e) {
          // Ignore Leaflet timing errors
        }
      };
      
      const timer1 = setTimeout(safeInvalidateSize, 100);
      const timer2 = setTimeout(safeInvalidateSize, 300);
      const timer3 = setTimeout(safeInvalidateSize, 500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }, 50); // Initial delay for DOM

    return () => {
      clearTimeout(initTimeout);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapInstanceRef.current = null;
      }
    };
  }, [mapReady, isOpen, value]);

  // Initialize preview map when value exists
  useEffect(() => {
    if (!previewMapReady || !value || !previewMapRef.current || isOpen) return;

    const L = (window as any).L;
    if (!L) return;

    // Clean up previous instance
    if (previewMapInstanceRef.current) {
      previewMapInstanceRef.current.remove();
      previewMapInstanceRef.current = null;
    }

    // Create preview map (non-interactive)
    const map = L.map(previewMapRef.current, {
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false
    }).setView([value.latitud, value.longitud], 16);
    
    previewMapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Add marker
    previewMarkerRef.current = L.marker([value.latitud, value.longitud]).addTo(map);

    // Fix map size with safety check
    setTimeout(() => {
      try {
        if (map && map.getContainer() && map._loaded) {
          map.invalidateSize();
        }
      } catch (e) {
        // Ignore Leaflet timing errors
      }
    }, 100);

    return () => {
      if (previewMapInstanceRef.current) {
        previewMapInstanceRef.current.remove();
        previewMapInstanceRef.current = null;
      }
    };
  }, [previewMapReady, value, isOpen]);

  // Reverse geocode function
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ScoutManagementSystem/1.0'
          }
        }
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Geocoding error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Get current location
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocalización no disponible en este navegador');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const L = (window as any).L;

        // Center map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 17);

          // Update marker
          if (markerRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current);
          }
          markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(mapInstanceRef.current);

          markerRef.current.on('dragend', async () => {
            const pos = markerRef.current.getLatLng();
            const address = await reverseGeocode(pos.lat, pos.lng);
            setSelectedLocation({
              latitud: pos.lat,
              longitud: pos.lng,
              direccion: address
            });
          });
        }

        // Get address
        const address = await reverseGeocode(latitude, longitude);
        setSelectedLocation({
          latitud: latitude,
          longitud: longitude,
          direccion: address
        });

        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('No se pudo obtener la ubicación. Verifica los permisos.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Handle confirm
  const handleConfirm = () => {
    onChange(selectedLocation);
    setIsOpen(false);
  };

  // Handle clear
  const handleClear = () => {
    onChange(null);
    setSelectedLocation(null);
  };

  // Open dialog
  const handleOpen = () => {
    if (disabled) return;
    setSelectedLocation(value || null);
    setIsOpen(true);
  };

  return (
    <>
      {/* Display field */}
      <div className="space-y-2 relative z-0">
        <Label>Ubicación en Mapa</Label>
        {value ? (
          // Location selected - Show mini-map with info
          <div className="border rounded-lg overflow-hidden relative z-0">
            {/* Mini-map preview - z-index bajo para no interferir con dropdowns */}
            <div className="relative h-40 bg-muted" style={{ zIndex: 0 }}>
              <div ref={previewMapRef} className="w-full h-full" style={{ zIndex: 0 }} />
              {!previewMapReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Info bar with actions */}
            <div className="p-3 bg-card flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {value.direccion}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  📍 {value.latitud.toFixed(6)}, {value.longitud.toFixed(6)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!disabled && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleOpen}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          // No location - Show placeholder
          <div 
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              disabled ? 'bg-muted cursor-not-allowed' : 'hover:bg-accent/50'
            }`}
            onClick={handleOpen}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground py-4">
              <MapPin className="h-8 w-8" />
              <span className="text-sm font-medium">Seleccionar ubicación en el mapa</span>
              <span className="text-xs">Haz clic para abrir el mapa</span>
            </div>
          </div>
        )}
      </div>

      {/* Map Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Seleccionar Ubicación
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col gap-4">
            {/* Current selection */}
            {selectedLocation && (
              <div className="bg-accent/50 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">Ubicación seleccionada:</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {selectedLocation.direccion}
                </p>
              </div>
            )}

            {/* Map container */}
            <div className="flex-1 relative rounded-lg overflow-hidden border">
              {!mapReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <div ref={mapRef} className="w-full h-full min-h-[300px]" />
            </div>

            {/* Instructions */}
            <p className="text-sm text-muted-foreground text-center">
              Haz clic en el mapa para seleccionar la ubicación, o arrastra el marcador para ajustar
            </p>
          </div>

          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGetCurrentLocation}
              disabled={loading || !mapReady}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              Mi Ubicación
            </Button>
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedLocation}
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default LocationPickerWeb;
