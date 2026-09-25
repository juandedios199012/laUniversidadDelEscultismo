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

interface SpeechRecognitionResultLike {
  results: { 0: { 0: { transcript: string } } }[];
}

interface SpeechRecognitionLike {
  lang: string;
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

/**
 * Arranca el dictado por voz. Llama a `onResultado(texto)` cuando termina de
 * transcribir, y `onFin()` siempre al terminar (con o sin resultado), para
 * que el que llama pueda resetear su estado de "escuchando".
 */
export function iniciarDictado(onResultado: (texto: string) => void, onFin: () => void): void {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) { onFin(); return; }
  try {
    const rec = new Ctor();
    rec.lang = 'es-ES';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const texto = e.results?.[0]?.[0]?.transcript;
      if (texto) onResultado(texto);
    };
    rec.onerror = () => onFin();
    rec.onend = () => onFin();
    rec.start();
  } catch {
    onFin();
  }
}
