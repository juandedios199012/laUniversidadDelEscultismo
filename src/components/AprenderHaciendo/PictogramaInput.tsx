/**
 * PictogramaInput — campo reutilizable para los formularios de
 * autoría del módulo "Aprender Haciendo" (`PasoFormDialog`,
 * `RetoFormDialog`). Mantiene el camino rápido de siempre (escribir un
 * emoji a mano) y agrega la posibilidad de subir una imagen real, que
 * reemplaza el valor del campo por la URL pública devuelta por
 * `AprenderHacienoService.subirPictograma`.
 */
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AprenderHacienoService from '@/services/aprenderHacienoService';
import PictogramaValor from './PictogramaValor';

interface PictogramaInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function PictogramaInput({ value, onChange, label }: PictogramaInputProps) {
  const [subiendo, setSubiendo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Limpiar el input para poder volver a elegir el mismo archivo si hace falta
    e.target.value = '';
    if (!file) return;

    setSubiendo(true);
    try {
      const resultado = await AprenderHacienoService.subirPictograma(file);
      if (!resultado.success || !resultado.url) {
        toast.error(resultado.error || 'No se pudo subir la imagen');
        return;
      }
      onChange(resultado.url);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label>{label}</Label>}

      {value && (
        <div className="flex items-center gap-3">
          <PictogramaValor valor={value} tamano="md" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="min-h-[44px] px-2 text-sm text-gray-500 hover:text-red-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500 rounded"
          >
            ✕ Quitar
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Emoji, ej: ⛺ (u sube una imagen)"
          className="min-h-[44px]"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={subiendo}
          className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm shrink-0
            bg-white text-fuchsia-700 border-2 border-fuchsia-200 hover:bg-fuchsia-50 transition-all disabled:opacity-60
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500"
        >
          {subiendo && <Loader2 className="w-4 h-4 animate-spin" />}
          {subiendo ? 'Subiendo...' : '📷 Subir imagen'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
