/**
 * ParserStrategy — "decodificar un código a su significado". Hoy sólo
 * implementa 'morse' (antes MorseGame): el código se ve como una fila de
 * glifos grandes (círculos = punto, barras redondeadas = raya) y se puede
 * escuchar como beeps reales vía `useMorseAudio`. Selección múltiple de 3
 * opciones (no texto libre), mismo patrón de retroalimentación siempre
 * positiva que TriviaStrategy.
 *
 * El discriminador `config.codificacion` queda abierto para un futuro
 * 'semaforo' (posiciones de banderas) o 'pistas' (pictogramas de huellas
 * de animal) — se agregarían como un `case` más en el switch de abajo, sin
 * crear un componente Strategy nuevo. No hay todavía ningún reto de esos
 * tipos en la app, así que sólo se deja la estructura extensible, sin
 * código especulativo para encodings que no existen.
 */
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle2, PartyPopper, Play } from 'lucide-react';
import { useMorseAudio } from '@/hooks/useMorseAudio';
import type { GameProps, ParserConfiguracion, ParserReto } from '@/types/aprenderHaciendo';

const OPCION_COLORS = [
  'from-blue-500 to-cyan-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
];

function GlifosMorse({ codigo }: { codigo: string }) {
  const simbolos = codigo.trim().split(/\s+/).filter(Boolean);
  return (
    <div className="flex flex-wrap items-center justify-center gap-3" aria-hidden="true">
      {simbolos.map((simbolo, i) => (
        simbolo === '-' ? (
          <div key={i} className="w-14 h-8 sm:w-16 sm:h-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-md" />
        ) : (
          <div key={i} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-md" />
        )
      ))}
    </div>
  );
}

function MorseDecoder({ retos, puntosBase, onComplete }: {
  retos: ParserReto[];
  puntosBase: number;
  onComplete: (puntaje: number, tiempoSegundos: number) => void;
}) {
  const totalRetos = retos.length;

  const [indice, setIndice] = useState(0);
  const [correctas, setCorrectas] = useState(0);
  const [estado, setEstado] = useState<'jugando' | 'incorrecto' | 'correcto'>('jugando');
  const [inicio] = useState(() => Date.now());
  const [terminado, setTerminado] = useState(false);

  const { reproducir, isSupported } = useMorseAudio();

  const retoActual = retos[indice];

  if (totalRetos === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Este reto todavía no tiene códigos configurados.
      </div>
    );
  }

  const dispararConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#f59e0b', '#10b981'],
    });
  };

  const handleResponder = (opcion: string) => {
    if (estado !== 'jugando') return;

    if (opcion === retoActual.respuestaCorrecta) {
      setEstado('correcto');
      setCorrectas(c => c + 1);
      dispararConfetti();

      const esUltimo = indice + 1 >= totalRetos;
      setTimeout(() => {
        if (esUltimo) {
          setTerminado(true);
          const tiempoSegundos = Math.max(1, Math.round((Date.now() - inicio) / 1000));
          const nuevasCorrectas = correctas + 1;
          const puntaje = Math.round((nuevasCorrectas / totalRetos) * puntosBase);
          onComplete(puntaje, tiempoSegundos);
        } else {
          setIndice(i => i + 1);
          setEstado('jugando');
        }
      }, 1200);
    } else {
      setEstado('incorrecto');
      setTimeout(() => setEstado('jugando'), 900);
    }
  };

  if (terminado) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-12 text-center"
      >
        <PartyPopper className="w-16 h-16 text-amber-500" />
        <h3 className="text-2xl font-bold text-gray-800">¡Muy bien hecho!</h3>
        <p className="text-gray-600">
          Decodificaste correctamente {correctas} de {totalRetos} códigos.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-fuchsia-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-fuchsia-500 rounded-full transition-all"
            style={{ width: `${(indice / totalRetos) * 100}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-gray-500 shrink-0">
          {indice + 1} / {totalRetos}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={indice}
          initial={{ opacity: 0, x: 30 }}
          animate={{
            opacity: 1,
            x: estado === 'incorrecto' ? [0, -10, 10, -8, 8, 0] : 0,
          }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: estado === 'incorrecto' ? 0.5 : 0.3 }}
          className="flex flex-col items-center gap-5 text-center"
        >
          <GlifosMorse codigo={retoActual.codigo} />

          {retoActual.pista && (
            <p className="text-sm text-gray-500 italic">Pista: {retoActual.pista}</p>
          )}

          {isSupported && (
            <button
              type="button"
              onClick={() => reproducir(retoActual.codigo)}
              className="min-h-[48px] px-6 inline-flex items-center gap-2 rounded-full font-bold text-white text-base shadow-md
                bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90 transition-transform hover:scale-105 active:scale-95
                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-400"
            >
              <Play className="w-5 h-5" />
              Reproducir sonido
            </button>
          )}

          {estado === 'incorrecto' && (
            <p className="text-amber-600 font-semibold" role="status">
              ¡Casi! Intenta de nuevo 💪
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-2">
            {retoActual.opciones.slice(0, 3).map((opcion, i) => (
              <button
                key={i}
                type="button"
                disabled={estado === 'correcto'}
                onClick={() => handleResponder(opcion)}
                className={`min-h-[64px] px-4 py-3 rounded-2xl font-bold text-white text-base shadow-md
                  bg-gradient-to-br ${OPCION_COLORS[i % OPCION_COLORS.length]}
                  transition-transform hover:scale-105 active:scale-95 disabled:opacity-60
                  focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-400
                  ${estado === 'correcto' && opcion === retoActual.respuestaCorrecta ? 'ring-4 ring-green-400' : ''}`}
              >
                <span className="flex items-center justify-center gap-2">
                  {estado === 'correcto' && opcion === retoActual.respuestaCorrecta && (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  {opcion}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function ParserStrategy({ configuracion, puntosBase, onComplete }: GameProps) {
  const config = configuracion as ParserConfiguracion;
  const retos = useMemo(() => config?.retos?.slice(0, 50) || [], [config]);

  switch (config?.codificacion) {
    case 'morse':
      return <MorseDecoder retos={retos} puntosBase={puntosBase} onComplete={onComplete} />;
    default:
      return (
        <div className="text-center py-12 text-gray-500">
          Tipo de codificación no reconocido.
        </div>
      );
  }
}
