/**
 * RetoRunner — carga un `ah_reto` y despacha al componente de juego
 * correcto mediante un registro `GAME_COMPONENTS` (patrón Strategy).
 * Este es el punto de extensión de la Fase 2: agregar un tipo de
 * juego nuevo es escribir un componente nuevo + una entrada en el
 * registro, sin tocar la lógica de este archivo.
 *
 * Layout predecible (clave para usuarios del espectro autista):
 * "Volver" siempre arriba a la izquierda, título al centro, puntaje
 * base a la derecha — misma posición sin importar el tipo de juego.
 *
 * Al completar el reto: registra el intento (api_ah_registrar_intento)
 * y dispara confetti + una animación de celebración con framer-motion.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { ArrowLeft, PartyPopper, Star } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import AprenderHacienoService from '@/services/aprenderHacienoService';
import type { AhReto, AhTipoJuego, GameProps } from '@/types/aprenderHaciendo';
import TriviaStrategy from './games/TriviaStrategy';
import DragAndDropStrategy from './games/DragAndDropStrategy';
import ParserStrategy from './games/ParserStrategy';
import MemoriaGame from './games/MemoriaGame';

// Registro Strategy: tipo de juego -> componente que lo implementa.
// Varios tipos de AhTipoJuego comparten componente (ej. TRIVIA y
// JENGA_EQUIPO ambos usan TriviaStrategy, que internamente elige el modo
// visual correcto vía el prop `tipoJuego`) — agregar un tipo nuevo en el
// futuro es agregar una entrada nueva acá, apuntando a una Strategy
// existente o a un componente nuevo.
const GAME_COMPONENTS: Record<AhTipoJuego, React.ComponentType<GameProps>> = {
  TRIVIA: TriviaStrategy,
  JENGA_EQUIPO: TriviaStrategy,
  ARRASTRAR_SOLTAR: DragAndDropStrategy,
  SECUENCIA: DragAndDropStrategy,
  MORSE: ParserStrategy,
  MEMORIA: MemoriaGame,
};

interface RetoRunnerProps {
  reto: AhReto;
  scoutId?: string | null;
  patrullaId?: string | null;
  /** Siempre visible arriba a la izquierda — vuelve a la lista de retos */
  onBack: () => void;
}

export default function RetoRunner({ reto, scoutId, patrullaId, onBack }: RetoRunnerProps) {
  const [completado, setCompletado] = useState<{ puntaje: number; tiempoSegundos: number } | null>(null);
  const [registrando, setRegistrando] = useState(false);

  const GameComponent = GAME_COMPONENTS[reto.tipo_juego] || TriviaStrategy;

  const handleComplete = async (puntaje: number, tiempoSegundos: number) => {
    setCompletado({ puntaje, tiempoSegundos });

    // Celebración: confetti a pantalla completa + animación (el propio
    // juego ya puede haber disparado confetti puntual; este es el
    // festejo de cierre del reto completo)
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
    });

    setRegistrando(true);
    try {
      const resultado = await AprenderHacienoService.registrarIntento({
        retoId: reto.id,
        scoutId: scoutId ?? null,
        patrullaId: patrullaId ?? null,
        puntajeObtenido: puntaje,
        tiempoSegundos,
      });
      if (!resultado.success) {
        toast.error(resultado.message);
      }
    } catch (err) {
      console.error('Error al registrar el intento:', err);
      toast.error('No se pudo registrar el resultado del reto');
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Cabecera fija — misma posición en todos los tipos de juego */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="min-h-[44px]"
          aria-label="Volver a la lista de retos"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h2 className="text-lg font-bold text-gray-800 text-center flex-1 truncate px-2">
          {reto.titulo}
        </h2>
        <div className="flex items-center gap-1 text-amber-600 font-semibold shrink-0 min-h-[44px] px-3">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          {reto.puntos_base} pts
        </div>
      </div>

      <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-white to-fuchsia-50/40">
        <CardContent className="p-6 sm:p-8">
          {completado ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="flex flex-col items-center gap-4 py-8 text-center"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <PartyPopper className="w-20 h-20 text-amber-500" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-800">¡Reto completado!</h3>
              <p className="text-gray-600">
                Obtuviste <span className="font-bold text-fuchsia-600">{completado.puntaje}</span> puntos
                {completado.tiempoSegundos ? ` en ${completado.tiempoSegundos} segundos` : ''}.
              </p>
              <Button
                onClick={onBack}
                disabled={registrando}
                className="min-h-[44px] mt-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90"
              >
                Volver a los retos
              </Button>
            </motion.div>
          ) : (
            <GameComponent
              configuracion={reto.configuracion}
              puntosBase={reto.puntos_base}
              onComplete={handleComplete}
              tipoJuego={reto.tipo_juego}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
