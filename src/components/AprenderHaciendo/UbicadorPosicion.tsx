/**
 * UbicadorPosicion — selector de posición para el modo "Rompecabezas de
 * partes con significado" (`RetoFormDialog`, tipo_juego = 'ROMPECABEZAS').
 * Muestra la imagen base y deja al admin hacer click/tap sobre ella para
 * ubicar la zona de destino de UNA pieza como un porcentaje (x%, y%) del
 * tamaño renderizado de la imagen — coordenadas que luego se guardan en
 * `pares[].posicion` y que en gameplay (`DragAndDropStrategy.tsx`,
 * `ZonaEspacial`) se usan para posicionar el marcador `absolute` sobre la
 * misma imagen.
 *
 * Herramienta de autoría (uso admin/dirigente con puntero), no de
 * gameplay: no requiere operabilidad completa por teclado como sí la
 * requieren los componentes de juego.
 */
import { motion } from 'framer-motion';

interface Posicion { x: number; y: number }

interface UbicadorPosicionProps {
  imagenUrl: string;
  posicion?: Posicion;
  /** Posiciones de las demás piezas ya ubicadas, para ver el layout completo mientras se ubica la actual. */
  marcadoresExistentes?: (Posicion & { etiqueta?: string })[];
  onChange: (posicion: Posicion) => void;
}

export default function UbicadorPosicion({ imagenUrl, posicion, marcadoresExistentes, onChange }: UbicadorPosicionProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onChange({
      x: Math.min(100, Math.max(0, Math.round(x))),
      y: Math.min(100, Math.max(0, Math.round(y))),
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-gray-600 text-center">
        Toca la imagen en el lugar donde debe ir esta pieza.
      </p>
      <div
        className="relative max-w-sm mx-auto w-full cursor-crosshair select-none"
        onClick={handleClick}
        role="button"
        aria-label="Hacer click en la imagen para ubicar la pieza"
      >
        <img
          src={imagenUrl}
          alt="Imagen base del rompecabezas"
          className="w-full h-auto rounded-2xl shadow-md pointer-events-none"
          draggable={false}
        />

        {marcadoresExistentes?.map((m, i) => (
          <div
            key={i}
            title={m.etiqueta}
            style={{ left: `${m.x}%`, top: `${m.y}%`, transform: 'translate(-50%, -50%)' }}
            className="absolute w-3 h-3 rounded-full bg-gray-400 border border-white shadow"
          />
        ))}

        {posicion && (
          <motion.div
            style={{ left: `${posicion.x}%`, top: `${posicion.y}%`, transform: 'translate(-50%, -50%)' }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-7 h-7 rounded-full bg-fuchsia-500 border-2 border-white shadow-lg ring-4 ring-fuchsia-300/60"
          />
        )}
      </div>
      {posicion && (
        <p className="text-xs text-gray-500 text-center">
          Posición actual: {posicion.x}%, {posicion.y}%
        </p>
      )}
    </div>
  );
}
