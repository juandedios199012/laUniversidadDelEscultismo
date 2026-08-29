/**
 * DragAndDropStrategy — juegos que usan @dnd-kit para arrastrar. Unifica
 * dos modos que comparten el setup de sensores (puntero + teclado, 100%
 * operable sin mouse) pero tienen lógica de render/validación totalmente
 * distinta, así que se mantienen como dos ramas internas separadas:
 *
 * - modo 'emparejar' (antes ArrastrarSoltarGame): arrastrar fichas
 *   pictograma sobre zonas de destino etiquetadas — emparejamiento sin
 *   orden, se valida por pertenencia de conjunto (par id === zona id).
 * - modo 'ordenar' (antes SecuenciaGame): arrastrar una lista mezclada a
 *   su orden correcto usando @dnd-kit/sortable — se valida por igualdad
 *   exacta de orden del array.
 */
import { useState } from 'react';
import {
  DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import { CheckCircle2, GripVertical, PartyPopper, Volume2, VolumeX } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import PictogramaValor from '@/components/AprenderHaciendo/PictogramaValor';
import type { DragAndDropConfiguracion, GameProps } from '@/types/aprenderHaciendo';

const MAX_PARES_VISIBLES = 4;

/** Setup de sensores compartido por ambas ramas — puntero + teclado, para
 * que ambas queden 100% operables sin mouse. */
function useDndAccessibleSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
}

// ------------------------------------------------------------------
// modo 'emparejar' — antes ArrastrarSoltarGame
// ------------------------------------------------------------------

function DraggableChip({ id, pictograma, deshabilitado }: { id: string; pictograma: string; deshabilitado: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled: deshabilitado });

  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      disabled={deshabilitado}
      aria-label={`Ficha para arrastrar, pictograma ${pictograma}`}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        transition: isDragging ? 'none' : 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        touchAction: 'none',
      }}
      className={`min-w-[64px] min-h-[64px] w-16 h-16 sm:w-20 sm:h-20 rounded-3xl shadow-lg flex items-center justify-center
        bg-gradient-to-br from-fuchsia-500 to-purple-600
        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-400
        ${deshabilitado ? 'opacity-40 cursor-default' : 'cursor-grab active:cursor-grabbing hover:scale-105'}
        ${isDragging ? 'z-20 scale-110 shadow-2xl' : 'z-10'}
      `}
    >
      <PictogramaValor valor={pictograma} tamano="md" />
    </button>
  );
}

function DropZone({ id, etiqueta, resuelto }: { id: string; etiqueta: string; resuelto: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: resuelto });
  // Botón de audio propio de la zona: sin esto, un scout que no lee no
  // tiene forma de saber a qué zona corresponde arrastrar cada ficha —
  // solo podía escuchar la instrucción general, no las etiquetas.
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[64px] w-full rounded-2xl border-2 border-dashed flex items-center justify-between gap-2 px-3 py-2 font-bold text-center transition-colors
        ${resuelto
          ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
          : isOver
            ? 'bg-fuchsia-50 border-fuchsia-400 text-fuchsia-700 scale-[1.02]'
            : 'bg-white border-gray-300 text-gray-600'}
      `}
    >
      <span className="flex-1 flex items-center justify-center gap-2">
        {resuelto && <CheckCircle2 className="w-5 h-5 shrink-0" />}
        {etiqueta}
      </span>

      {!resuelto && isSupported && (
        <button
          type="button"
          onClick={() => (isSpeaking ? stop() : speak(etiqueta))}
          aria-label={isSpeaking ? 'Detener lectura' : `Escuchar: ${etiqueta}`}
          className="min-h-[44px] min-w-[44px] shrink-0 rounded-full flex items-center justify-center text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500"
        >
          {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
}

/** Zona de destino del layout espacial (rompecabezas): igual mecánica y
 * mismo lenguaje visual/accesible que `DropZone` (botón de audio propio,
 * relleno verde al resolverse) pero como un marcador circular
 * posicionado en `posicion.x`/`posicion.y` (%) sobre la imagen base, en
 * vez de una fila en una lista. */
function ZonaEspacial({ id, etiqueta, resuelto, posicion }: {
  id: string; etiqueta: string; resuelto: boolean; posicion: { x: number; y: number };
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: resuelto });
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();

  return (
    <div
      ref={setNodeRef}
      style={{ left: `${posicion.x}%`, top: `${posicion.y}%`, transform: 'translate(-50%, -50%)' }}
      className={`absolute w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center transition-colors
        ${resuelto
          ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
          : isOver
            ? 'bg-fuchsia-50 border-fuchsia-400 text-fuchsia-700 scale-110'
            : 'bg-white/90 border-gray-300 text-gray-600'}
      `}
    >
      {resuelto ? (
        <CheckCircle2 className="w-6 h-6" />
      ) : isSupported ? (
        <button
          type="button"
          onClick={() => (isSpeaking ? stop() : speak(etiqueta))}
          aria-label={isSpeaking ? 'Detener lectura' : `Escuchar: ${etiqueta}`}
          className="min-h-[44px] min-w-[44px] w-full h-full rounded-full flex items-center justify-center text-fuchsia-700 hover:bg-fuchsia-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500"
        >
          {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      ) : null}
    </div>
  );
}

function EmparejarDragAndDrop({ config, puntosBase, onComplete }: {
  config: DragAndDropConfiguracion;
  puntosBase: number;
  onComplete: (puntaje: number, tiempoSegundos: number) => void;
}) {
  // Rompecabezas de partes con significado: cuando hay imagen base y
  // TODOS los pares traen una posición, las zonas se ubican espacialmente
  // sobre la imagen en vez de en la lista genérica. Ausente en cualquier
  // reto ARRASTRAR_SOLTAR ya existente -> el render de lista de siempre
  // queda 100% igual.
  //
  // El tope MAX_PARES_VISIBLES existe para bajar la carga cognitiva en el
  // emparejamiento genérico (chips sin relación entre sí), pero un
  // rompecabezas espacial es una figura completa con significado propio
  // (ej. la Flor de Lis: pétalo central, pétalos laterales, estrellas,
  // aguja) — cortarla a 4 piezas la dejaría incompleta y sin sentido. Por
  // eso el rompecabezas usa TODAS las piezas que el admin ubicó, sin tope.
  const paresConfigurados = config?.pares || [];
  const esRompecabezasEspacial = Boolean(config.imagenBaseUrl)
    && paresConfigurados.length > 0
    && paresConfigurados.every(p => p.posicion);

  const [pares] = useState(() => (
    esRompecabezasEspacial ? paresConfigurados : paresConfigurados.slice(0, MAX_PARES_VISIBLES)
  ));
  // Las zonas se muestran en un orden distinto al de las fichas para que
  // el emparejamiento no sea trivial por posición.
  const [zonas] = useState(() => {
    const copia = [...pares];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  });

  const [inicio] = useState(() => Date.now());
  const [resueltos, setResueltos] = useState<Set<string>>(new Set());
  const [terminado, setTerminado] = useState(false);

  const { speak, isSupported } = useTextToSpeech();
  const sensors = useDndAccessibleSensors();

  if (pares.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Este reto todavía no tiene pares configurados.
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) {
      const nuevos = new Set(resueltos);
      nuevos.add(String(active.id));
      setResueltos(nuevos);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#f59e0b', '#10b981'],
      });

      if (nuevos.size === pares.length) {
        setTerminado(true);
        const tiempoSegundos = Math.max(1, Math.round((Date.now() - inicio) / 1000));
        setTimeout(() => onComplete(puntosBase, tiempoSegundos), 700);
      }
    }
  };

  if (terminado) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500" />
        <h3 className="text-2xl font-bold text-gray-800">¡Todos los pares emparejados!</h3>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 max-w-xl mx-auto">
            {config.instruccion}
          </h3>
          {isSupported && (
            <button
              type="button"
              onClick={() => speak(config.instruccion)}
              className="mt-3 min-h-[44px] px-5 inline-flex items-center gap-2 rounded-full font-semibold text-sm bg-white text-fuchsia-700 border-2 border-fuchsia-200 hover:bg-fuchsia-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500"
            >
              🔊 Escuchar instrucción
            </button>
          )}
        </div>

        {esRompecabezasEspacial ? (
          <>
            <div className="relative max-w-md mx-auto w-full">
              <img
                src={config.imagenBaseUrl}
                alt="Imagen base del rompecabezas"
                className="w-full h-auto rounded-2xl shadow-lg"
              />
              {zonas.map(par => (
                <ZonaEspacial
                  key={par.id}
                  id={par.id}
                  etiqueta={par.etiqueta}
                  resuelto={resueltos.has(par.id)}
                  posicion={par.posicion!}
                />
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {pares.map(par => (
                <DraggableChip key={par.id} id={par.id} pictograma={par.pictograma} deshabilitado={resueltos.has(par.id)} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Layout de lista de siempre — orden y JSX intactos para no
                alterar en absoluto el render de cualquier ARRASTRAR_SOLTAR
                ya autorado (sin imagenBaseUrl/posicion). */}
            <div className="flex flex-wrap justify-center gap-4">
              {pares.map(par => (
                <DraggableChip key={par.id} id={par.id} pictograma={par.pictograma} deshabilitado={resueltos.has(par.id)} />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto w-full">
              {zonas.map(par => (
                <DropZone key={par.id} id={par.id} etiqueta={par.etiqueta} resuelto={resueltos.has(par.id)} />
              ))}
            </div>
          </>
        )}
      </div>
    </DndContext>
  );
}

// ------------------------------------------------------------------
// modo 'ordenar' — antes SecuenciaGame
// ------------------------------------------------------------------

interface PasoOrdenable { id: string; texto: string; pictograma?: string }

function mezclar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function TarjetaPaso({ paso, posicion, fueraDeLugar }: { paso: PasoOrdenable; posicion: number; fueraDeLugar: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: paso.id });
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-2xl border-2 bg-white shadow-md px-3 py-3 min-h-[64px]
        ${isDragging ? 'z-20 shadow-xl opacity-90' : 'z-10'}
        ${fueraDeLugar ? 'ring-4 ring-amber-400 border-amber-300' : 'border-gray-200'}
      `}
    >
      <span className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm">
        {posicion}
      </span>

      <PictogramaValor valor={paso.pictograma} tamano="sm" />

      <span className="flex-1 font-semibold text-gray-800 text-left">{paso.texto}</span>

      {isSupported && (
        <button
          type="button"
          onClick={() => (isSpeaking ? stop() : speak(paso.texto))}
          aria-label={isSpeaking ? 'Detener lectura' : `Escuchar: ${paso.texto}`}
          className="min-h-[44px] min-w-[44px] shrink-0 rounded-full flex items-center justify-center text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500"
        >
          {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}

      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Arrastrar para reordenar: ${paso.texto}`}
        className="min-h-[44px] min-w-[44px] shrink-0 rounded-xl flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-gray-200 cursor-grab active:cursor-grabbing touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500"
      >
        <GripVertical className="w-5 h-5" />
      </button>
    </div>
  );
}

function OrdenarDragAndDrop({ config, puntosBase, onComplete }: {
  config: DragAndDropConfiguracion;
  puntosBase: number;
  onComplete: (puntaje: number, tiempoSegundos: number) => void;
}) {
  const pasosCorrectos = config?.pasos || [];

  const [orden, setOrden] = useState<PasoOrdenable[]>(() => mezclar(pasosCorrectos));
  const [inicio] = useState(() => Date.now());
  const [fuerLugar, setFueraLugar] = useState<Set<string>>(new Set());
  const [terminado, setTerminado] = useState(false);

  const { speak, isSupported } = useTextToSpeech();
  const sensors = useDndAccessibleSensors();

  if (pasosCorrectos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Este reto todavía no tiene pasos configurados.
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrden(items => {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
    setFueraLugar(new Set());
  };

  const handleVerificar = () => {
    const incorrectos = new Set<string>();
    orden.forEach((paso, i) => {
      if (paso.id !== pasosCorrectos[i]?.id) incorrectos.add(paso.id);
    });

    if (incorrectos.size === 0) {
      setTerminado(true);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#a855f7', '#ec4899', '#f59e0b', '#10b981'],
      });
      const tiempoSegundos = Math.max(1, Math.round((Date.now() - inicio) / 1000));
      setTimeout(() => onComplete(puntosBase, tiempoSegundos), 900);
    } else {
      setFueraLugar(incorrectos);
    }
  };

  if (terminado) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <PartyPopper className="w-16 h-16 text-amber-500" />
        <h3 className="text-2xl font-bold text-gray-800">¡Orden correcto!</h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 max-w-xl mx-auto">
          {config.instruccion}
        </h3>
        {isSupported && (
          <button
            type="button"
            onClick={() => speak(config.instruccion)}
            className="mt-3 min-h-[44px] px-5 inline-flex items-center gap-2 rounded-full font-semibold text-sm bg-white text-fuchsia-700 border-2 border-fuchsia-200 hover:bg-fuchsia-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500"
          >
            🔊 Escuchar instrucción
          </button>
        )}
      </div>

      {fuerLugar.size > 0 && (
        <p className="text-amber-600 font-semibold text-center" role="status">
          Algunas tarjetas todavía no están en el orden correcto. ¡Intenta de nuevo! 💪
        </p>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={orden.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3 max-w-xl mx-auto w-full">
            {orden.map((paso, i) => (
              <TarjetaPaso key={paso.id} paso={paso} posicion={i + 1} fueraDeLugar={fuerLugar.has(paso.id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={handleVerificar}
        className="self-center min-h-[48px] px-8 inline-flex items-center gap-2 rounded-2xl font-bold text-white text-base shadow-md
          bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90 transition-transform hover:scale-105 active:scale-95
          focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-400"
      >
        <CheckCircle2 className="w-5 h-5" />
        Verificar orden
      </button>
    </div>
  );
}

export default function DragAndDropStrategy({ configuracion, puntosBase, onComplete, tipoJuego }: GameProps) {
  const config = configuracion as DragAndDropConfiguracion;
  const modo = config?.modo ?? (tipoJuego === 'SECUENCIA' ? 'ordenar' : 'emparejar');

  return modo === 'ordenar'
    ? <OrdenarDragAndDrop config={config} puntosBase={puntosBase} onComplete={onComplete} />
    : <EmparejarDragAndDrop config={config} puntosBase={puntosBase} onComplete={onComplete} />;
}
