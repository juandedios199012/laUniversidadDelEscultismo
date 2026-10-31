import { useCallback, useEffect, useState } from 'react';

type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void };

/**
 * Pantalla completa para un elemento (la escena 3D). En iPhone Safari no existe para
 * elementos: `supported` queda en false y el botón se oculta (instalada como app ya ocupa toda la pantalla).
 */
export function useFullscreen<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const el = ref.current as FsElement | null;
    setSupported(!!el && (typeof el.requestFullscreen === 'function' || typeof el.webkitRequestFullscreen === 'function'));
    const doc = document as FsDocument;
    const onChange = () => setIsFullscreen((doc.fullscreenElement ?? doc.webkitFullscreenElement) === ref.current);
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, [ref]);

  const toggle = useCallback(async () => {
    const el = ref.current as FsElement | null;
    const doc = document as FsDocument;
    if (!el) return;
    try {
      if (doc.fullscreenElement ?? doc.webkitFullscreenElement) {
        await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
      } else {
        await (el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.());
      }
    } catch {
      // El navegador puede rechazarlo (p. ej. sin gesto del usuario); no es un error de la app
    }
  }, [ref]);

  return { isFullscreen, supported, toggle };
}
