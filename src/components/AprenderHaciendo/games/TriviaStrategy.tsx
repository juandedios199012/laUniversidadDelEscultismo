/**
 * TriviaStrategy — juegos de "elegir 1 de hasta 3 opciones". Unifica dos
 * modos visuales que comparten toda la lógica de pregunta/opciones/
 * retroalimentación pero difieren en contenedor y fórmula de puntaje:
 *
 * - modoVisual 'lista' (antes TriviaGame): una pregunta por pantalla, barra
 *   de progreso, puntaje = porcentaje de correctas × puntosBase.
 * - modoVisual 'torre' (antes JengaGame): torre visual de bloques, cada uno
 *   con una pregunta escondida (mismo espíritu que la actividad física real
 *   de Jenga). Responder correcto = el bloque se desliza fuera de la torre y
 *   reparte una fracción igual de `puntosBase`.
 *
 * Ambos modos comparten el mismo lenguaje visual de pregunta (pictograma
 * opcional, botón de escuchar, hasta 3 opciones grandes, retroalimentación
 * siempre positiva) factorizado en `PreguntaSeleccionable` abajo.
 */
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle2, PartyPopper, Volume2, VolumeX } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import type { GameProps, SeleccionableConfiguracion, SeleccionablePregunta } from '@/types/aprenderHaciendo';

const OPCION_COLORS = [
  'from-blue-500 to-cyan-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
];

const COLOR_ROTACION_TORRE = [
  'from-amber-500 to-orange-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
];

function dispararConfetti(particleCount = 120) {
  confetti({
    particleCount,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#a855f7', '#ec4899', '#f59e0b', '#10b981'],
  });
}

type EstadoPregunta = 'jugando' | 'incorrecto' | 'correcto';

interface PreguntaSeleccionableProps {
  pregunta: SeleccionablePregunta;
  estado: EstadoPregunta;
  onResponder: (opcionIndex: number) => void;
}

/** UI compartida por ambos modos: pictograma, texto, botón "escuchar",
 * mensaje de reintento y hasta 3 botones de opción. */
function PreguntaSeleccionable({ pregunta, estado, onResponder }: PreguntaSeleccionableProps) {
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();

  return (
    <>
      {pregunta.pictograma && (
        <div className="text-6xl mb-1" aria-hidden="true">{pregunta.pictograma}</div>
      )}

      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 max-w-xl">
        {pregunta.texto}
      </h3>

      {isSupported && (
        <button
          type="button"
          onClick={() => (isSpeaking ? stop() : speak(pregunta.texto))}
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
        {pregunta.opciones.slice(0, 3).map((opcion, i) => (
          <button
            key={i}
            type="button"
            disabled={estado === 'correcto'}
            onClick={() => onResponder(i)}
            className={`min-h-[64px] px-4 py-3 rounded-2xl font-bold text-white text-base shadow-md
              bg-gradient-to-br ${OPCION_COLORS[i % OPCION_COLORS.length]}
              transition-transform hover:scale-105 active:scale-95 disabled:opacity-60
              focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-400
              ${estado === 'correcto' && i === pregunta.respuestaCorrecta ? 'ring-4 ring-green-400' : ''}`}
          >
            <span className="flex items-center justify-center gap-2">
              {estado === 'correcto' && i === pregunta.respuestaCorrecta && (
                <CheckCircle2 className="w-5 h-5" />
              )}
              {opcion}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

/** modoVisual 'lista' — antes TriviaGame: una pregunta por pantalla,
 * barra de progreso, puntaje = porcentaje de correctas × puntosBase. */
function TriviaLista({ preguntas, puntosBase, onComplete }: {
  preguntas: SeleccionablePregunta[];
  puntosBase: number;
  onComplete: (puntaje: number, tiempoSegundos: number) => void;
}) {
  const totalPreguntas = preguntas.length;

  const [indice, setIndice] = useState(0);
  const [correctas, setCorrectas] = useState(0);
  const [estado, setEstado] = useState<EstadoPregunta>('jugando');
  const [inicio] = useState(() => Date.now());
  const [terminado, setTerminado] = useState(false);

  const preguntaActual = preguntas[indice];

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
          <PreguntaSeleccionable pregunta={preguntaActual} estado={estado} onResponder={handleResponder} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** modoVisual 'torre' — antes JengaGame: torre visual de bloques, cada uno
 * con una pregunta escondida; responder correcto reparte una fracción
 * igual de `puntosBase` y desliza el bloque fuera de la torre. */
function TriviaTorre({ preguntas, puntosBase, onComplete }: {
  preguntas: SeleccionablePregunta[];
  puntosBase: number;
  onComplete: (puntaje: number, tiempoSegundos: number) => void;
}) {
  // Los bloques necesitan un id estable; si la config no trae `id` por
  // pregunta (ej. viene de un TRIVIA reutilizado como torre) se deriva del
  // índice.
  const bloques = useMemo(
    () => preguntas.map((pregunta, i) => ({ id: pregunta.id || `bloque-${i}`, pregunta })),
    [preguntas]
  );

  const [respondidos, setRespondidos] = useState<Set<string>>(new Set());
  const [saliendo, setSaliendo] = useState<Set<string>>(new Set());
  const [bloqueActivo, setBloqueActivo] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoPregunta>('jugando');
  const [puntajeAcumulado, setPuntajeAcumulado] = useState(0);
  const [inicio] = useState(() => Date.now());
  const [terminado, setTerminado] = useState(false);

  const { stop } = useTextToSpeech();

  const bloqueEnPregunta = bloques.find(b => b.id === bloqueActivo) || null;
  const puntosPorBloque = Math.round(puntosBase / bloques.length);

  const abrirBloque = (id: string) => {
    if (respondidos.has(id)) return;
    setBloqueActivo(id);
    setEstado('jugando');
  };

  const handleResponder = (opcionIndex: number) => {
    if (!bloqueEnPregunta || estado !== 'jugando') return;

    if (opcionIndex === bloqueEnPregunta.pregunta.respuestaCorrecta) {
      setEstado('correcto');
      dispararConfetti(90);

      setTimeout(() => {
        const nuevoPuntaje = puntajeAcumulado + puntosPorBloque;
        setPuntajeAcumulado(nuevoPuntaje);

        const nuevosSaliendo = new Set(saliendo);
        nuevosSaliendo.add(bloqueEnPregunta.id);
        setSaliendo(nuevosSaliendo);

        setTimeout(() => {
          const nuevosRespondidos = new Set(respondidos);
          nuevosRespondidos.add(bloqueEnPregunta.id);
          setRespondidos(nuevosRespondidos);
          setBloqueActivo(null);
          stop();

          if (nuevosRespondidos.size === bloques.length) {
            setTerminado(true);
            const tiempoSegundos = Math.max(1, Math.round((Date.now() - inicio) / 1000));
            setTimeout(() => onComplete(nuevoPuntaje, tiempoSegundos), 600);
          }
        }, 400);
      }, 900);
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
        <h3 className="text-2xl font-bold text-gray-800">¡Torre completada!</h3>
        <p className="text-gray-600">Todos los bloques respondidos correctamente.</p>
      </motion.div>
    );
  }

  if (bloqueEnPregunta) {
    return (
      <motion.div
        key={bloqueEnPregunta.id}
        initial={{ opacity: 0, x: 30 }}
        animate={{
          opacity: 1,
          x: estado === 'incorrecto' ? [0, -10, 10, -8, 8, 0] : 0,
        }}
        transition={{ duration: estado === 'incorrecto' ? 0.5 : 0.3 }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <PreguntaSeleccionable pregunta={bloqueEnPregunta.pregunta} estado={estado} onResponder={handleResponder} />

        <button
          type="button"
          onClick={() => { setBloqueActivo(null); stop(); }}
          className="text-sm text-gray-400 hover:text-gray-600 underline mt-2"
        >
          Volver a la torre
        </button>
      </motion.div>
    );
  }

  const bloquesEnTorre = bloques.filter(b => !respondidos.has(b.id));

  return (
    <div className="flex flex-col gap-6 items-center">
      <p className="text-lg font-bold text-gray-700 text-center">
        Toca un bloque para responder su pregunta. Bloques respondidos: {respondidos.size} / {bloques.length}
      </p>

      <div className="flex flex-col items-center gap-2 w-full max-w-sm">
        <AnimatePresence initial={false}>
          {bloquesEnTorre.map((bloque, i) => (
            <motion.button
              key={bloque.id}
              type="button"
              layout
              initial={{ opacity: 1 }}
              animate={{ opacity: saliendo.has(bloque.id) ? 0 : 1, x: saliendo.has(bloque.id) ? 200 : 0 }}
              exit={{ opacity: 0, x: 200 }}
              transition={{ duration: 0.4 }}
              onClick={() => abrirBloque(bloque.id)}
              aria-label={`Bloque ${i + 1}, todavía sin responder`}
              className={`w-full min-h-[52px] rounded-2xl shadow-md flex items-center justify-center text-white font-bold text-lg
                bg-gradient-to-r ${bloque.pregunta.color || COLOR_ROTACION_TORRE[i % COLOR_ROTACION_TORRE.length]}
                transition-transform hover:scale-[1.02] active:scale-95
                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-400`}
            >
              ?
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TriviaStrategy({ configuracion, puntosBase, onComplete, tipoJuego }: GameProps) {
  const config = configuracion as SeleccionableConfiguracion;
  const preguntas = useMemo(() => config?.preguntas?.slice(0, 50) || [], [config]);

  const modo = config?.modoVisual ?? (tipoJuego === 'JENGA_EQUIPO' ? 'torre' : 'lista');

  if (preguntas.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Este reto todavía no tiene preguntas configuradas.
      </div>
    );
  }

  return modo === 'torre'
    ? <TriviaTorre preguntas={preguntas} puntosBase={puntosBase} onComplete={onComplete} />
    : <TriviaLista preguntas={preguntas} puntosBase={puntosBase} onComplete={onComplete} />;
}
