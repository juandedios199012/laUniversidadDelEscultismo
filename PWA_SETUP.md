# 📱 PWA (Progressive Web App) - Scout Lima 12

## ✅ Configuración Completada

El sistema ahora funciona como **PWA instalable** en iPhone y Android.

---

## 🚀 Cómo Instalar en iPhone

### 1. **Abrir Safari** (IMPORTANTE: Debe ser Safari, no Chrome)
   - Ve a la URL de tu app en producción

### 2. **Instalar la App**
   - Toca el botón **Compartir** (📤)
   - Desplázate y selecciona **"Agregar a pantalla de inicio"**
   - Personaliza el nombre si quieres
   - Toca **"Agregar"**

### 3. **¡Listo!** 🎉
   - Verás el ícono en tu pantalla de inicio
   - Ábrela como cualquier app nativa
   - Funciona sin conexión (datos en caché)

---

## 📦 Archivos Agregados

```
/public/
  ├── manifest.json             # Configuración PWA
  └── pwa-icon-192.png         # Ícono 192x192 (crear)
  └── pwa-icon-512.png         # Ícono 512x512 (crear)

/vite.config.ts                # Configuración con VitePWA
/index.html                    # Meta tags iOS/PWA
```

---

## 🎨 Generar Iconos PWA

### Opción 1: Herramienta Online
1. Ve a https://realfavicongenerator.net/
2. Sube tu logo (mínimo 512x512 px)
3. Descarga el paquete generado
4. Copia `android-chrome-192x192.png` → `public/pwa-icon-192.png`
5. Copia `android-chrome-512x512.png` → `public/pwa-icon-512.png`

### Opción 2: Crear Manualmente
1. Diseña un logo cuadrado 512x512 px
2. Fondo: `#1e40af` (azul scout)
3. Logo centrado con padding
4. Exportar en 192x192 y 512x512

---

## 🔧 Características Implementadas

### ✅ Offline Support
- Service Worker con caché inteligente
- API de Supabase con estrategia `NetworkFirst`
- Assets estáticos cacheados automáticamente

### ✅ iOS Optimizado
- Meta tags específicos para iPhone
- Status bar translúcido
- Pantalla completa (standalone)
- Icono Apple Touch

### ✅ Auto-Update
- La app se actualiza automáticamente cuando hay nueva versión
- No requiere reinstalación

---

## 📝 Próximos Pasos

1. **Generar Iconos:** Crear `pwa-icon-192.png` y `pwa-icon-512.png`
2. **Deploy:** Subir a producción (Vercel/Netlify)
3. **Probar:** Instalar en iPhone desde Safari
4. **Opcional:** Agregar splash screen personalizado

---

## 🐛 Troubleshooting

### La app no se instala en iPhone
- ✅ ¿Estás usando Safari? (Chrome no soporta PWA en iOS)
- ✅ ¿La app está en HTTPS? (localhost también funciona)
- ✅ ¿Existe el archivo `manifest.json`?
- ✅ ¿Los iconos están en la carpeta `public/`?

### La app no funciona offline
- ✅ Verifica que el Service Worker esté registrado (DevTools → Application)
- ✅ Abre la app al menos una vez con conexión

### Los cambios no se reflejan
- ✅ Desinstala y reinstala la PWA
- ✅ Limpia caché del navegador

---

## 🎯 Ventajas vs App Nativa

| Característica | PWA | App Nativa |
|---------------|-----|------------|
| Instalación | Sin App Store | Requiere App Store |
| Costo | $0 | $99/año (iOS) |
| Actualizaciones | Automáticas | Revisión Apple |
| Offline | ✅ | ✅ |
| Notificaciones | Limitadas iOS | Completas |
| Desarrollo | 1 código | 2 códigos (iOS/Android) |

---

## 📚 Referencias

- [PWA iOS Guidelines](https://web.dev/learn/pwa/ios/)
- [vite-plugin-pwa Docs](https://vite-pwa-org.netlify.app/)
- [Workbox Strategies](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)
