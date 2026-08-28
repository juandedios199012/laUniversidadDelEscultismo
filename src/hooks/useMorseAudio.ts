/**
 * Hook de audio Morse para el módulo "Aprender Haciendo".
 *
 * Reproduce un código Morse (string de `.`/`-` separados por espacios)
 * como beeps reales usando la Web Audio API (`AudioContext` +
 * `OscillatorNode`): punto ≈120ms, raya ≈360ms, ≈150ms de silencio
 * entre símbolos. Protegido igual que `useTextToSpeech.ts` — nunca
 * revienta si el navegador no soporta `AudioContext`.
 */
import { useCallback, useRef } from 'react';

const DURACION_PUNTO_MS = 120;
const DURACION_RAYA_MS = 360;
const SILENCIO_MS = 150;
const FRECUENCIA_HZ = 600;

type AudioContextConstructor = typeof AudioContext;

function obtenerAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext ||
    null
  );
}

interface UseMorseAudioResult {
  /** Reproduce un código Morse (ej. "... --- ...") como beeps */
  reproducir: (codigo: string) => void;
  isSupported: boolean;
}

export function useMorseAudio(): UseMorseAudioResult {
  const ctxRef = useRef<AudioContext | null>(null);
  const AudioContextCtor = obtenerAudioContextConstructor();
  const isSupported = !!AudioContextCtor;

  const obtenerContexto = useCallback((): AudioContext | null => {
    if (!AudioContextCtor) return null;
    try {
      if (!ctxRef.current || ctxRef.current.state === 'closed') {
        ctxRef.current = new AudioContextCtor();
      }
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume().catch(() => {});
      }
      return ctxRef.current;
    } catch (err) {
      console.error('Error al crear el contexto de audio para Morse:', err);
      return null;
    }
  }, [AudioContextCtor]);

  const beep = useCallback((ctx: AudioContext, inicio: number, duracionMs: number) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = FRECUENCIA_HZ;
      // Envolvente breve para evitar "clicks" al iniciar/terminar el beep
      gain.gain.setValueAtTime(0, inicio);
      gain.gain.linearRampToValueAtTime(0.35, inicio + 0.01);
      gain.gain.setValueAtTime(0.35, inicio + duracionMs / 1000 - 0.01);
      gain.gain.linearRampToValueAtTime(0, inicio + duracionMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(inicio);
      osc.stop(inicio + duracionMs / 1000);
    } catch (err) {
      console.error('Error al reproducir un beep Morse:', err);
    }
  }, []);

  const reproducir = useCallback((codigo: string) => {
    if (!codigo?.trim()) return;
    const ctx = obtenerContexto();
    if (!ctx) return;

    try {
      let cursor = ctx.currentTime + 0.05;
      const simbolos = codigo.trim().split(/\s+/);
      simbolos.forEach(simbolo => {
        const duracion = simbolo === '-' ? DURACION_RAYA_MS : DURACION_PUNTO_MS;
        beep(ctx, cursor, duracion);
        cursor += duracion / 1000 + SILENCIO_MS / 1000;
      });
    } catch (err) {
      console.error('Error al reproducir el código Morse:', err);
    }
  }, [beep, obtenerContexto]);

  return { reproducir, isSupported };
}

export default useMorseAudio;
