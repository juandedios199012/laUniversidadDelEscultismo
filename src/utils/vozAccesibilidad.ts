/**
 * ======================================================================
 * 🔊 ACCESIBILIDAD DE VOZ — lectura en voz alta (TTS) y dictado (STT)
 * ======================================================================
 * Wrappers sobre las Web Speech APIs nativas del navegador — sin
 * librerías externas, sin costo, sin backend. Pensado para el "modo
 * paso a paso" del formulario público de Evaluación (scouts que no
 * leen/escriben todavía, o con TEA que se benefician de menos carga
 * cognitiva por pantalla).
 *
 * Compatibilidad real: SpeechSynthesis (TTS) funciona en Chrome, Edge,
 * Safari y Firefox. SpeechRecognition (STT) NO tiene soporte en
 * Firefox y es solo con prefijo `webkit` en Chrome/Safari — por eso
 * todo acá se feature-detecta antes de usarse; si no está disponible,
 * el que llama debe ofrecer el campo de texto normal como alternativa
 * (nunca bloquear la respuesta a que el navegador soporte esto).
 * ======================================================================
 */

// ---- Texto a voz (TTS) ----

export function ttsDisponible(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Busca una voz en español, preferentemente "natural"/Google, para sonar menos robótica. */
export function vozPreferidaEs(): SpeechSynthesisVoice | null {
  if (!ttsDisponible()) return null;
  const voces = window.speechSynthesis.getVoices();
  return (
    voces.find((v) => v.lang.toLowerCase().startsWith('es') && /natural|google/i.test(v.name)) ||
    voces.find((v) => v.lang.toLowerCase().startsWith('es')) ||
    null
  );
}

/** Lee un texto en voz alta con tono pausado y amigable. Cancela cualquier lectura previa en curso. */
export function hablarTexto(texto: string): void {
  if (!ttsDisponible() || !texto?.trim()) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9; // pausado
    utterance.pitch = 1.1; // tono amigable
    const voz = vozPreferidaEs();
    if (voz) utterance.voice = voz;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Si falla (navegador raro, permisos, etc.) simplemente no lee en voz alta — no es crítico.
  }
}

export function detenerVoz(): void {
  if (ttsDisponible()) window.speechSynthesis.cancel();
}

// ---- Voz a texto (STT / dictado) ----
//
// Ojo: esto SOLO transcribe — el audio en sí nunca se guarda en ningún
// archivo ni llega a nuestra base de datos. Lo único que se guarda es el
// texto que el navegador reconoce, igual que si el scout lo hubiera
// tecleado. Mientras transcribe, el navegador (Chrome/Safari) manda el
// audio al servicio de voz del fabricante para procesarlo en tiempo real
// — eso es infraestructura del navegador, no nuestra, y no queda ningún
// registro de eso acá tampoco.

interface SpeechRecognitionResultLike {
  resultIndex: number;
  results: { length: number; [index: number]: { isFinal: boolean; 0: { transcript: string } } };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionResultLike) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function reconocimientoVozDisponible(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export interface ControlDictado {
  /** Corta el dictado a mano (ej. cuando el scout vuelve a tocar el botón del micrófono). */
  detener: () => void;
}

/**
 * Arranca el dictado por voz en modo CONTINUO + con resultados EN VIVO
 * (`interimResults`): el texto va apareciendo casi al instante mientras la
 * persona habla —no espera a que termine la frase— y se va afinando a
 * medida que el motor de voz entiende mejor lo que dijo. Sin esto, la caja
 * de texto se queda "muda" varios segundos hasta detectar una pausa, lo
 * cual no tiene sentido como feedback visual si quien está mirando no lee.
 *
 * `onResultado(fragmento, esFinal)` se llama:
 *  - con `esFinal=false` mientras la frase todavía se está reconociendo
 *    (fragmento "en vivo", puede cambiar/corregirse en la próxima llamada
 *    — quien llama debe REEMPLAZAR el interino anterior, no acumularlo);
 *  - con `esFinal=true` una vez que esa frase quedó fija (ahí sí hay que
 *    sumarla al texto acumulado en forma definitiva).
 *
 * `onFin` se llama una sola vez al terminar de escuchar (por `detener()`,
 * error, o corte del navegador), para resetear el estado visual.
 *
 * Devuelve `null` si el navegador no soporta reconocimiento de voz.
 *
 * Nota de latencia real: esto NO es instantáneo tipo "carácter por
 * carácter local" — Chrome/Safari mandan el audio a su servicio de voz en
 * la nube para reconocerlo, así que hace falta conexión a internet y hay
 * uno o dos décimas de segundo de ida y vuelta (normalmente imperceptible,
 * pero puede notarse con mala señal — en un campamento sin datos, esto
 * directamente no va a andar, y el campo de texto normal sigue siendo la
 * alternativa).
 */
export function iniciarDictado(onResultado: (fragmento: string, esFinal: boolean) => void, onFin: () => void): ControlDictado | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) { onFin(); return null; }
  try {
    const rec = new Ctor();
    rec.lang = 'es-ES';
    rec.continuous = true; // no cortar en la primera pausa
    rec.interimResults = true; // mostrar en vivo, no solo al final de cada frase
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let interino = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const resultado = e.results[i];
        if (resultado.isFinal) onResultado(resultado[0].transcript.trim(), true);
        else interino += resultado[0].transcript;
      }
      if (interino.trim()) onResultado(interino.trim(), false);
    };
    rec.onerror = () => onFin();
    rec.onend = () => onFin();
    rec.start();
    return { detener: () => rec.stop() };
  } catch {
    onFin();
    return null;
  }
}
