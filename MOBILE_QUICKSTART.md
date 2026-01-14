# 🚀 Guía de Inicio - Aplicativo Móvil

## ✅ Setup Completado

La estructura del proyecto móvil ya está lista:

```
✅ mobile/           - Proyecto React Native
✅ shared/types/     - Tipos TypeScript compartidos
✅ Supabase client   - Configurado
✅ App base iOS      - Lista para probar
```

---

## 📱 Probar Ahora en tu iPhone

### **1. Instala Expo Go**
- Abre **App Store** en tu iPhone
- Busca **"Expo Go"**
- Instala (gratis)

### **2. Copia credenciales de Supabase**
```bash
# En la raíz del proyecto
cp .env mobile/.env

# O crea mobile/.env manualmente con:
EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_key
```

### **3. Inicia la app**
```bash
cd mobile
npm start
```

Verás algo como:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (iOS)
```

### **4. Escanea el QR**
- Abre **Expo Go** en tu iPhone
- Toca **"Scan QR Code"**
- Apunta al QR de tu terminal
- **¡La app se cargará!** 🎉

---

## 📂 Archivos Creados

### **Compartidos (Web + Mobile)**
- `shared/types/Scout.ts` - Interface Scout
- `shared/types/Asistencia.ts` - Interface Asistencia
- `shared/types/Puntaje.ts` - Interface Puntaje
- `shared/types/ProgramaSemanal.ts` - Interface Programa
- `shared/api/supabaseConfig.ts` - Config Supabase

### **Móvil**
- `mobile/App.tsx` - Pantalla principal con UI bonita
- `mobile/src/lib/supabase.ts` - Cliente Supabase
- `mobile/app.json` - Config Expo (iOS)
- `mobile/README.md` - Documentación completa

### **Configuración**
- `.gitignore` - Actualizado para móvil
- `mobile/.env.example` - Template de variables

---

## 🎯 Próximos Pasos

### **Ahora:**
1. ✅ Prueba que la app cargue en tu iPhone
2. ✅ Verifica que ves la pantalla con los 3 botones

### **Esta semana:**
- [ ] Implementar pantalla de Asistencia
- [ ] Lista de scouts con swipe
- [ ] Sincronización con Supabase

### **Próxima semana:**
- [ ] Implementar Puntajes
- [ ] Implementar Lista de Scouts
- [ ] Testing completo

---

## 💡 Comandos Rápidos

```bash
# Terminal 1: Web
npm run dev

# Terminal 2: Mobile
cd mobile && npm start

# Reiniciar mobile (si hay errores)
cd mobile && npm start --clear
```

---

## 🐛 Si algo no funciona

### **App no carga en iPhone:**
- Verifica que estés en la misma red WiFi
- Reinicia: `npm start --clear`
- Usa tunnel: `npm start --tunnel`

### **"Cannot find module":**
```bash
cd mobile
rm -rf node_modules
npm install
```

### **Variables de entorno no funcionan:**
- Asegúrate de que `mobile/.env` existe
- Reinicia el servidor: `npm start --clear`

---

**¡Todo listo para empezar a desarrollar!** 🏕️

Lee `mobile/README.md` para más detalles.
