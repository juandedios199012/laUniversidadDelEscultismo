import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';

console.log('🚀 main.tsx ejecutándose...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ No se encontró el elemento root');
} else {
  console.log('✅ Elemento root encontrado, montando React...');
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('✅ React montado exitosamente');
  } catch (error) {
    console.error('❌ Error al montar App:', error);
    rootElement.innerHTML = `
      <div style="padding: 40px; color: red; background: #fff;">
        <h1>Error al cargar la aplicación</h1>
        <pre>${error}</pre>
      </div>
    `;
  }
}

// Registrar Service Worker para funcionalidad PWA offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration.scope);
        
        // Verificar actualizaciones cada 1 hora
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch((error) => {
        console.log('❌ Error al registrar Service Worker:', error);
      });
  });
}
