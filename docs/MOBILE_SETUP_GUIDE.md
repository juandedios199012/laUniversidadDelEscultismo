# 📱 Scout Mobile - Setup Rápido para Testing

## 🚀 **Opción 1: Expo Go (Desarrollo Rápido)**

### **Paso 1: Preparar el entorno**
```bash
# En tu Mac
npm install -g @expo/cli
cd /Users/juandediosbaudazio/Documents/source/GrupoScoutLima12/
mkdir scout-mobile
cd scout-mobile

# Crear proyecto Expo
npx create-expo-app . --template blank-typescript
```

### **Paso 2: Instalar dependencias Scout**
```bash
# Supabase para conectar a tu BD
npm install @supabase/supabase-js

# UI components
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# Componentes UI
npm install react-native-elements react-native-vector-icons
npx expo install expo-camera expo-barcode-scanner expo-location

# Estado y forms
npm install zustand react-hook-form
```

### **Paso 3: Copiar configuración existente**
```bash
# Copiar tu configuración de Supabase
cp ../laUniversidadDelEscultismo/src/lib/supabase.ts ./lib/
cp ../laUniversidadDelEscultismo/src/services/scoutService.ts ./services/
cp ../laUniversidadDelEscultismo/.env.local ./.env
```

### **Paso 4: Ejecutar y probar**
```bash
# Iniciar servidor de desarrollo
expo start

# En tu celular:
# iOS: Descargar "Expo Go" desde App Store
# Android: Descargar "Expo Go" desde Play Store
# Escanear QR code que aparece en terminal
```

---

## 📦 **Opción 2: Build APK Independiente (EAS Build)**

### **Paso 1: Configurar EAS**
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login (crear cuenta gratuita en expo.dev)
eas login

# Configurar builds
eas build:configure
```

### **Paso 2: Configurar app.json**
```json
{
  "expo": {
    "name": "Scout Lima 12",
    "slug": "scout-lima12",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.scoutlima12.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.scoutlima12.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

### **Paso 3: Build y distribución**
```bash
# Build APK para Android (GRATIS)
eas build --platform android --profile preview

# El build se hace en la nube (no necesitas Android Studio)
# Al terminar recibes link de descarga del APK
# Compartes el link y cualquiera instala la app
```

---

## 🌐 **Opción 3: PWA (Más Simple para Probar)**

### **Modificar tu proyecto web actual**
```bash
cd /Users/juandediosbaudazio/Documents/source/GrupoScoutLima12/laUniversidadDelEscultismo
```

### **Paso 1: Agregar PWA config**
```json
// public/manifest.json
{
  "name": "Scout Lima 12",
  "short_name": "Scout L12",
  "description": "Sistema de gestión Scout Lima 12",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png", 
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### **Paso 2: Registrar Service Worker**
```typescript
// src/main.tsx - agregar al final
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
```

### **Paso 3: Crear Service Worker básico**
```javascript
// public/sw.js
const CACHE_NAME = 'scout-lima12-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

### **Paso 4: Desplegar y probar**
```bash
# Build producción
npm run build

# Usar ngrok para URL pública temporal
npm install -g ngrok
npx serve -s build -l 3000
# En otra terminal:
ngrok http 3000

# Compartir URL de ngrok
# En móvil: Chrome → Menú → "Instalar app"
```

---

## 🎯 **Mi Recomendación para Ti**

### **Para EMPEZAR RÁPIDO (esta semana):**
1. ✅ **PWA** - Modifica tu proyecto actual web
2. ✅ **ngrok** para compartir URL temporalmente  
3. ✅ Prueba en móviles reales
4. ✅ **Cero configuración** compleja

### **Para APP NATIVA (próximo mes):**
1. ✅ **Expo Go** para desarrollo
2. ✅ **EAS Build** para APK independientes
3. ✅ Distribución por **enlaces directos**
4. ✅ **No App Store** necesario

---

## 📲 **Distribución Sin App Store**

### **Opciones de Distribución Directa:**

#### **Android (más fácil):**
- ✅ **APK directo** - cualquiera puede instalar
- ✅ **Google Drive/Dropbox** links
- ✅ **WhatsApp** - enviar APK directamente
- ✅ **QR Code** - link de descarga

#### **iOS (requiere configuración):**
- ✅ **TestFlight** (gratuito, hasta 100 testers)
- ✅ **Ad-hoc distribution** (hasta 100 devices)
- ✅ **PWA** (funciona como app nativa)

#### **Multiplataforma:**
- ✅ **PWA** - funciona en ambos
- ✅ **Expo Go** - escanear QR
- ✅ **Netlify/Vercel** - deploy automático

---

## ⚡ **Quick Start Hoy Mismo**

¿Quieres empezar **ahora**? Te sugiero:

1. **Opción Súper Rápida (30 minutos):**
   - Hacer tu web actual **responsive mobile**
   - Agregar **PWA manifest**
   - Deploy en **Netlify** 
   - ¡Ya tienes "app" instalable!

2. **Opción Nativa (2-3 horas):**
   - Crear proyecto **Expo**
   - Copiar **ScoutService.ts**
   - Hacer pantalla básica **Programa/Libro Oro**
   - Probar con **Expo Go**

¿Con cuál empezamos? ¿PWA rápida o Expo nativo?