/**
 * Contact Data Section Component
 */

import { UseFormReturn } from "react-hook-form";
import { Phone } from "lucide-react";
import { ScoutFormData } from "../schemas/scoutFormSchema";
import { TextField, PhoneField } from "./FormFields";
import { FormSection } from "./FormSection";
import { LocationPickerWeb } from "./LocationPickerWeb";
import { UbigeoSelector } from "./UbigeoSelector";

interface DatosContactoProps {
  form: UseFormReturn<ScoutFormData>;
  isOpen: boolean;
  onToggle: () => void;
  errorCount?: number;
}

export function DatosContacto({ form, isOpen, onToggle, errorCount = 0 }: DatosContactoProps) {
  // Handle location change
  const handleLocationChange = (location: { latitud: number; longitud: number; direccion: string } | null) => {
    if (location) {
      form.setValue('ubicacion_latitud', location.latitud);
      form.setValue('ubicacion_longitud', location.longitud);
      form.setValue('direccion_completa', location.direccion);
    } else {
      form.setValue('ubicacion_latitud', null);
      form.setValue('ubicacion_longitud', null);
      form.setValue('direccion_completa', '');
    }
  };

  // Get current location value - ensure proper number conversion
  const watchedLat = form.watch('ubicacion_latitud');
  const watchedLng = form.watch('ubicacion_longitud');
  const watchedDir = form.watch('direccion_completa');
  
  // Debug logging
  console.log('📍 Location values:', { watchedLat, watchedLng, watchedDir, typeofLat: typeof watchedLat, typeofLng: typeof watchedLng });
  
  // Convert to numbers explicitly (values might come as strings from DB)
  const lat = watchedLat != null ? Number(watchedLat) : null;
  const lng = watchedLng != null ? Number(watchedLng) : null;
  
  console.log('📍 Converted values:', { lat, lng, isNanLat: isNaN(lat as number), isNanLng: isNaN(lng as number) });
  
  const locationValue = (lat != null && lng != null && !isNaN(lat) && !isNaN(lng))
    ? {
        latitud: lat,
        longitud: lng,
        direccion: watchedDir || ''
      }
    : null;
    
  console.log('📍 Final locationValue:', locationValue);

  return (
    <FormSection
      title="Datos de Contacto"
      icon={Phone}
      isOpen={isOpen}
      onToggle={onToggle}
      iconColor="text-green-600"
      errorCount={errorCount}
    >
      <div className="space-y-6">
        {/* Phone Numbers - 2 columnas para mejor lectura */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Teléfonos
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PhoneField
              control={form.control}
              name="celular"
              label="Celular Principal"
            />
            <PhoneField
              control={form.control}
              name="celular_secundario"
              label="Celular Secundario"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <TextField
              control={form.control}
              name="telefono"
              label="Teléfono Fijo"
              type="tel"
              placeholder="(01) 234 5678"
            />
          </div>
        </div>

        {/* Emails - 2 columnas */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Correos Electrónicos
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              control={form.control}
              name="correo"
              label="Correo Principal"
              type="email"
              placeholder="correo@ejemplo.com"
              autoComplete="email"
            />
            <TextField
              control={form.control}
              name="correo_secundario"
              label="Correo Secundario"
              type="email"
              placeholder="otro@ejemplo.com"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <TextField
              control={form.control}
              name="correo_institucional"
              label="Correo Institucional"
              type="email"
              placeholder="correo@institucion.edu.pe"
            />
          </div>
        </div>

        {/* Address - Ubigeo Selector */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Dirección
          </h4>
          
          {/* Selector de Ubigeo (Departamento, Provincia, Distrito) */}
          <UbigeoSelector
            departamento={form.watch('departamento') || ''}
            provincia={form.watch('provincia') || ''}
            distrito={form.watch('distrito') || ''}
            onDepartamentoChange={(value) => form.setValue('departamento', value)}
            onProvinciaChange={(value) => form.setValue('provincia', value)}
            onDistritoChange={(value) => form.setValue('distrito', value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <TextField
              control={form.control}
              name="codigo_postal"
              label="Código Postal"
              placeholder="15074"
              maxLength={10}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 mt-4">
            <TextField
              control={form.control}
              name="direccion"
              label="Dirección"
              placeholder="Av. Principal 123, Dpto 456"
            />
          </div>

          {/* Location Picker - Map */}
          <div className="mt-4 pt-4 border-t">
            <LocationPickerWeb
              value={locationValue}
              onChange={handleLocationChange}
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}
