/**
 * PictogramaValor — render compartido para cualquier campo "pictograma"
 * del módulo "Aprender Haciendo" (juegos y pasos). Un pictograma puede
 * hoy ser un emoji (texto corto) o la URL pública de una imagen subida
 * por el admin (ver `AprenderHacienoService.subirPictograma`); este
 * componente decide cuál es cuál y renderiza cada caso de forma
 * consistente en toda la app, siempre dentro de una caja de tamaño fijo
 * para que una imagen subida de cualquier tamaño se achique sin romper
 * el layout de la tarjeta/ficha/caja que la contiene.
 */
import { cn } from '@/lib/utils';

/** true si `valor` parece una URL de imagen (http(s):// o data:image/...),
 * false para emoji/texto plano o valores vacíos. */
export function esImagenPictograma(valor?: string | null): boolean {
  if (!valor) return false;
  return /^(https?:\/\/|data:image\/)/i.test(valor.trim());
}

type TamanoPictograma = 'sm' | 'md' | 'lg' | 'xl';

interface PictogramaValorProps {
  valor?: string | null;
  tamano?: TamanoPictograma;
  alt?: string;
  className?: string;
}

const BOX_CLASSES: Record<TamanoPictograma, string> = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-40 h-40',
};

const TEXT_CLASSES: Record<TamanoPictograma, string> = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-6xl',
  xl: 'text-8xl',
};

export default function PictogramaValor({ valor, tamano = 'md', alt, className }: PictogramaValorProps) {
  if (!valor) return null;

  if (esImagenPictograma(valor)) {
    return (
      <div
        className={cn(
          BOX_CLASSES[tamano],
          'rounded-2xl overflow-hidden shrink-0 bg-white shadow-sm',
          className
        )}
      >
        <img
          src={valor}
          alt={alt || 'Pictograma'}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={cn(TEXT_CLASSES[tamano], 'leading-none', className)} aria-hidden="true">
      {valor}
    </div>
  );
}
