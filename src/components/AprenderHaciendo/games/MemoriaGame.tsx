/**
 * MemoriaGame — juego clásico de memoria/concentración, 100% visual
 * (pictograma con pictograma), no requiere lectura para jugarse. Se
 * cubre hasta 4-6 pares (8-12 cartas) por carga cognitiva. Voltear
 * dos cartas: si coinciden, quedan boca arriba marcadas como
 * "encontradas" + confetti puntual; si no, se muestran ~800ms y
 * vuelven a voltearse boca abajo, sin penalidad.
 */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle2, PartyPopper } from 'lucide-react';
import type { GameProps, MemoriaConfiguracion } from '@/types/aprenderHaciendo';

// Si la configuración trae menos de 4 pares se usan tal cual (nada que
// recortar); si trae más, se recorta a MAX_PARES por carga cognitiva.
const MAX_PARES = 6;

interface Carta {
  cartaId: string;
  parId: string;
  pictograma: string;
  etiqueta?: string;
}

function mezclar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export default function MemoriaGame({ configuracion, puntosBase, onComplete }: GameProps) {
  const config = configuracion as MemoriaConfiguracion;

  const cartas = useMemo(() => {
    const pares = (config?.pares || []).slice(0, MAX_PARES);
    const duplicadas: Carta[] = pares.flatMap(par => [
      { cartaId: `${par.id}-a`, parId: par.id, pictograma: par.pictograma, etiqueta: par.etiqueta },
      { cartaId: `${par.id}-b`, parId: par.id, pictograma: par.pictograma, etiqueta: par.etiqueta },
    ]);
    return mezclar(duplicadas);
  }, [config]);

  const totalPares = (config?.pares || []).slice(0, MAX_PARES).length;

  const [volteadas, setVolteadas] = useState<string[]>([]);
  const [encontrados, setEncontrados] = useState<Set<string>>(new Set());
  const [bloqueado, setBloqueado] = useState(false);
  const [inicio] = useState(() => Date.now());
  const [terminado, setTerminado] = useState(false);

  if (totalPares === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Este reto todavía no tiene pares configurados.
      </div>
    );
  }

  const handleClickCarta = (carta: Carta) => {
    if (bloqueado) return;
    if (volteadas.includes(carta.cartaId)) return;
    if (encontrados.has(carta.parId)) return;

    const nuevasVolteadas = [...volteadas, carta.cartaId];
    setVolteadas(nuevasVolteadas);

    if (nuevasVolteadas.length === 2) {
      setBloqueado(true);
      const [idA, idB] = nuevasVolteadas;
      const cartaA = cartas.find(c => c.cartaId === idA)!;
      const cartaB = cartas.find(c => c.cartaId === idB)!;

      if (cartaA.parId === cartaB.parId) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#ec4899', '#f59e0b', '#10b981'],
        });
        setTimeout(() => {
          const nuevosEncontrados = new Set(encontrados);
          nuevosEncontrados.add(cartaA.parId);
          setEncontrados(nuevosEncontrados);
          setVolteadas([]);
          setBloqueado(false);

          if (nuevosEncontrados.size === totalPares) {
            setTerminado(true);
            const tiempoSegundos = Math.max(1, Math.round((Date.now() - inicio) / 1000));
            setTimeout(() => onComplete(puntosBase, tiempoSegundos), 800);
          }
        }, 500);
      } else {
        setTimeout(() => {
          setVolteadas([]);
          setBloqueado(false);
        }, 800);
      }
    }
  };

  if (terminado) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <PartyPopper className="w-16 h-16 text-amber-500" />
        <h3 className="text-2xl font-bold text-gray-800">¡Encontraste todos los pares!</h3>
      </div>
    );
  }

  const columnas = cartas.length <= 8 ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-6';

  return (
    <div className="flex flex-col gap-6 items-center">
      <p className="text-lg font-bold text-gray-700 text-center">
        Encuentra los pares. Pares encontrados: {encontrados.size} / {totalPares}
      </p>

      <div className={`grid ${columnas} gap-3 max-w-2xl w-full`} style={{ perspective: 1000 }}>
        {cartas.map(carta => {
          const bocaArriba = volteadas.includes(carta.cartaId) || encontrados.has(carta.parId);
          const encontrada = encontrados.has(carta.parId);
          return (
            <button
              key={carta.cartaId}
              type="button"
              onClick={() => handleClickCarta(carta)}
              disabled={bocaArriba || bloqueado}
              aria-label={bocaArriba ? `Carta: ${carta.etiqueta || carta.pictograma}` : 'Carta boca abajo'}
              className="relative aspect-square min-h-[64px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-400 rounded-2xl disabled:cursor-default"
              style={{ perspective: 1000 }}
            >
              <motion.div
                className="w-full h-full relative"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: bocaArriba ? 180 : 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Reverso (boca abajo) */}
                <div
                  className="absolute inset-0 rounded-2xl shadow-md bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-3xl text-white font-bold"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  ?
                </div>
                {/* Frente (boca arriba) */}
                <div
                  className={`absolute inset-0 rounded-2xl shadow-md flex items-center justify-center text-4xl
                    ${encontrada ? 'bg-emerald-100 ring-4 ring-emerald-400' : 'bg-white border-2 border-fuchsia-200'}`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span aria-hidden="true">{carta.pictograma}</span>
                  {encontrada && (
                    <CheckCircle2 className="absolute top-1 right-1 w-5 h-5 text-emerald-600" />
                  )}
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
