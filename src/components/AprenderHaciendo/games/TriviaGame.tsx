/**
 * TriviaGame — único juego con lógica completa en la Fase 1 (valida
 * de punta a punta el motor "enchufable" de RetoRunner). Una pregunta
 * por pantalla (máximo 3 opciones, carga cognitiva baja), botones de
 * respuesta grandes (>=44px), retroalimentación siempre positiva:
 * correcto = confetti + avanza; incorrecto = animación de "shake"
 * suave + "¡Intenta de nuevo!" + reintento inmediato sin penalidad.
 */
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle2, PartyPopper, Volume2, VolumeX } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import type { GameProps, TriviaConfiguracion } from '@/types/aprenderHaciendo';

const OPCION_COLORS = [
  'from-blue-500 to-cyan-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
];

export default function TriviaGame({ configuracion, puntosBase, onComplete }: GameProps) {
  const config = configuracion as TriviaConfiguracion;
  const preguntas = useMemo(() => config?.preguntas?.slice(0, 50) || [], [config]);
  const totalPreguntas = preguntas.length;

  const [indice, setIndice] = useState(0);
  const [correctas, setCorrectas] = useState(0);
  const [estado, setEstado] = useState<'jugando' | 'incorrecto' | 'correcto'>('jugando');
  const [inicio] = useState(() => Date.now());
  const [terminado, setTerminado] = useState(false);

  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();

  const preguntaActual = preguntas[indice];

  if (totalPreguntas === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Este reto todavía no tiene preguntas configuradas.
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

  const handleSpeak = () => {
    if (!preguntaActual) return;
    if (isSpeaking) {
      stop();
    } else {
      speak(preguntaActual.texto);
    }
  };

  const handleResponder = (opcionIndex: number) => {
    if (estado !== 'jugando') return;

    if (opcionIndex === preguntaActual.respuestaCorrecta) {
      setEstado('correcto');
      setCorrectas(c => c + 1);
      dispararConfetti();

      const esUltima = indice + 1 >= totalPreguntas;
      setTimeout(() => {
        if (esUltima) {
          setTerminado(true);
          const tiempoSegundos = Math.max(1, Math.round((Date.now() - inicio) / 1000));
          const nuevasCorrectas = correctas + 1;
          const puntaje = Math.round((nuevasCorrectas / totalPreguntas) * puntosBase);
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
          Respondiste correctamente {correctas} de {totalPreguntas} preguntas.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progreso — siempre en la misma posición (arriba) */}
      <div className="flex items-center gap-3">
        <Progress value={((indice) / totalPreguntas) * 100} className="flex-1" />
        <span className="text-sm font-semibold text-gray-500 shrink-0">
          {indice + 1} / {totalPreguntas}
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
          className="flex flex-col items-center gap-4 text-center"
        >
          {preguntaActual.pictograma && (
            <div className="text-6xl mb-1" aria-hidden="true">{preguntaActual.pictograma}</div>
          )}

          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 max-w-xl">
            {preguntaActual.texto}
          </h3>

          {isSupported && (
            <button
              type="button"
              onClick={handleSpeak}
              className="min-h-[44px] px-5 inline-flex items-center gap-2 rounded-full font-semibold text-sm bg-white text-fuchsia-700 border-2 border-fuchsia-200 hover:bg-fuchsia-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500"
            >
              {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              {isSpeaking ? 'Detener' : '🔊 Escuchar pregunta'}
            </button>
          )}

          {estado === 'incorrecto' && (
            <p className="text-amber-600 font-semibold" role="status">
              ¡Casi! Intenta de nuevo 💪
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-2">
            {preguntaActual.opciones.slice(0, 3).map((opcion, i) => (
              <button
                key={i}
                type="button"
                disabled={estado === 'correcto'}
                onClick={() => handleResponder(i)}
                className={`min-h-[64px] px-4 py-3 rounded-2xl font-bold text-white text-base shadow-md
                  bg-gradient-to-br ${OPCION_COLORS[i % OPCION_COLORS.length]}
                  transition-transform hover:scale-105 active:scale-95 disabled:opacity-60
                  focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-400
                  ${estado === 'correcto' && i === preguntaActual.respuestaCorrecta ? 'ring-4 ring-green-400' : ''}`}
              >
                <span className="flex items-center justify-center gap-2">
                  {estado === 'correcto' && i === preguntaActual.respuestaCorrecta && (
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
