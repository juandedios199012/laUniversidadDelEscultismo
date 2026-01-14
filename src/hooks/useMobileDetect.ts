import { useState, useEffect } from 'react';

export const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar si es mobile por tamaño de pantalla
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Detectar si está instalado como PWA
    const checkInstalled = () => {
      // iOS
      const isIOSPWA = (window.navigator as any).standalone === true;
      // Android/Desktop
      const isStandalonePWA = window.matchMedia('(display-mode: standalone)').matches;
      
      setIsInstalled(isIOSPWA || isStandalonePWA);
    };

    checkMobile();
    checkInstalled();

    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Retornar isMobile solo (no requiere instalación)
  return { isMobile, isInstalled };
};
