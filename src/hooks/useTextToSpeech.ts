/**
 * Hook de texto-a-voz para el módulo "Aprender Haciendo".
 *
 * Usa la Web Speech API (`window.speechSynthesis`) para leer en voz
 * alta instrucciones y preguntas — pieza clave de accesibilidad para
 * scouts no lectores o con autismo/TDAH. Intenta usar una voz en
 * español (es-PE, con fallback a es-ES y luego a la voz por defecto
 * del navegador). Todas las llamadas a `window.speechSynthesis` están
 * protegidas por un chequeo de soporte del navegador — nunca revienta
 * si la API no existe (ej. algunos navegadores móviles o entornos
 * embebidos).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseTextToSpeechResult {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function elegirVoz(voces: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voces.length) return null;
  return (
    voces.find(v => v.lang?.toLowerCase() === 'es-pe') ||
    voces.find(v => v.lang?.toLowerCase() === 'es-es') ||
    voces.find(v => v.lang?.toLowerCase().startsWith('es')) ||
    voces[0]
  );
}

export function useTextToSpeech(): UseTextToSpeechResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = isSpeechSynthesisSupported();
  const vocesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!isSupported) return;

    const cargarVoces = () => {
      try {
        vocesRef.current = window.speechSynthesis.getVoices();
      } catch {
        vocesRef.current = [];
      }
    };

    cargarVoces();
    // En muchos navegadores las voces se cargan de forma asíncrona
    window.speechSynthesis.addEventListener?.('voiceschanged', cargarVoces);

    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', cargarVoces);
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.cancel();
    } catch (err) {
      console.error('Error al detener la lectura en voz alta:', err);
    }
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text?.trim()) return;

    try {
      // Evita superponer lecturas: cancela cualquier lectura en curso
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-PE';
      const voz = elegirVoz(vocesRef.current.length ? vocesRef.current : window.speechSynthesis.getVoices());
      if (voz) {
        utterance.voice = voz;
        utterance.lang = voz.lang || 'es-PE';
      }
      utterance.rate = 0.95;
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Error al leer en voz alta:', err);
      setIsSpeaking(false);
    }
  }, [isSupported]);

  useEffect(() => {
    return () => {
      if (isSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // noop
        }
      }
    };
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
}

export default useTextToSpeech;
