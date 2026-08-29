/**
 * PictogramCard — bloque de accesibilidad reutilizado en todo el módulo
 * "Aprender Haciendo": una imagen/ícono grande + una etiqueta + un botón
 * "🔊 Escuchar" en la misma posición siempre (abajo, centrado), para que
 * la lectura en voz alta sea predecible en cualquier pantalla — clave
 * para scouts no lectores o con autismo/TDAH.
 */
import {
  Anchor, Award, Backpack, Book, Compass, Flag, Flame, Footprints,
  HeartPulse, Map, Medal, Mountain, Puzzle, Radio, Sparkles,
  Star, Tent, Trophy, Utensils, Volume2, VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { esImagenPictograma } from './PictogramaValor';

// Mapa de nombres de ícono (guardados como TEXT en `ah_modulos.icono`,
// ej. "Sparkles") a su componente lucide-react. No existe un ícono de
// "nudo" en lucide-react 0.344.0, así que la categoría NUDOS cae en un
// ícono equivalente (Anchor).
export const AH_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Compass, Flag, Flame, Tent, Utensils, HeartPulse, Radio,
  Map, Footprints, Mountain, Backpack, Trophy, Medal, Award, Star,
  Book, Puzzle, Anchor,
};

export function resolverIcono(nombre?: string | null): React.ComponentType<{ className?: string }> {
  if (!nombre) return Sparkles;
  return AH_ICON_MAP[nombre] || Sparkles;
}

interface PictogramCardProps {
  /** Texto visible (título corto) */
  label: string;
  /** Texto que se lee en voz alta al presionar "Escuchar" (por defecto, `label`) */
  textoVoz?: string;
  /** URL de una imagen/pictograma; si no hay, se usa un ícono */
  imagenUrl?: string | null;
  /** Nombre de ícono lucide-react (ver AH_ICON_MAP) usado si no hay `imagenUrl` */
  iconoNombre?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Gradiente de fondo del bloque de ícono (Tailwind), estilo Canva */
  gradiente?: string;
  children?: React.ReactNode;
}

const SIZE_CLASSES: Record<NonNullable<PictogramCardProps['size']>, { box: string; icon: string; text: string; emoji: string }> = {
  sm: { box: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-sm', emoji: 'text-3xl' },
  md: { box: 'w-24 h-24', icon: 'w-12 h-12', text: 'text-lg', emoji: 'text-5xl' },
  lg: { box: 'w-40 h-40', icon: 'w-20 h-20', text: 'text-2xl', emoji: 'text-7xl' },
};

export default function PictogramCard({
  label,
  textoVoz,
  imagenUrl,
  iconoNombre,
  size = 'md',
  className,
  gradiente = 'from-fuchsia-500 to-purple-600',
  children,
}: PictogramCardProps) {
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();
  const Icono = resolverIcono(iconoNombre);
  const sizes = SIZE_CLASSES[size];

  const handleSpeak = (e: React.MouseEvent) => {
    // Este componente a veces queda anidado dentro de un contenedor que
    // también responde a click (ej. la tarjeta de paso en ModuloDetalle,
    // que avanza al tocarla en cualquier parte) — el botón de audio nunca
    // debe disparar esa acción externa.
    e.stopPropagation();
    if (isSpeaking) {
      stop();
    } else {
      speak(textoVoz || label);
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-3 text-center', className)}>
      <div
        className={cn(
          sizes.box,
          'rounded-3xl flex items-center justify-center shadow-lg bg-gradient-to-br overflow-hidden shrink-0',
          gradiente
        )}
      >
        {esImagenPictograma(imagenUrl) ? (
          <img src={imagenUrl as string} alt={label} className="w-full h-full object-cover" />
        ) : imagenUrl ? (
          <span className={cn(sizes.emoji, 'leading-none')} aria-hidden="true">{imagenUrl}</span>
        ) : (
          <Icono className={cn(sizes.icon, 'text-white')} />
        )}
      </div>

      <p className={cn(sizes.text, 'font-bold text-gray-800 leading-snug')}>{label}</p>

      {children}

      {isSupported && (
        <button
          type="button"
          onClick={handleSpeak}
          aria-pressed={isSpeaking}
          aria-label={isSpeaking ? 'Detener lectura en voz alta' : `Escuchar: ${textoVoz || label}`}
          className={cn(
            'min-h-[44px] px-5 inline-flex items-center gap-2 rounded-full font-semibold text-sm transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500',
            isSpeaking
              ? 'bg-fuchsia-600 text-white shadow-md scale-105'
              : 'bg-white text-fuchsia-700 border-2 border-fuchsia-200 hover:bg-fuchsia-50 hover:scale-105'
          )}
        >
          {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          {isSpeaking ? 'Detener' : '🔊 Escuchar'}
        </button>
      )}
    </div>
  );
}
