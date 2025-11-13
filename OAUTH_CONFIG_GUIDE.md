# 🔑 Guía Visual: Configurar Google OAuth (Scout System)

## ⭐ SUPER SIMPLE - Sigue estos pasos

### 📱 **PASO 1: Google Cloud Console**

1. **Abrir** → https://console.cloud.google.com/
2. **Crear proyecto nuevo**:
   ```
   Nombre: Scout Management System
   ```
3. **Copiar Project ID** (ejemplo: `scout-system-123456`)

### 📱 **PASO 2: Configurar Pantalla de Consentimiento**

1. **Ir a** → APIs & Services > OAuth consent screen
2. **Configurar**:
   ```
   User Type: External
   App name: Scout Management System
   User support email: [TU EMAIL]
   Developer contact: [TU EMAIL]
   ```
3. **Clic** → SAVE AND CONTINUE (en todos los pasos)

### 📱 **PASO 3: Crear Credenciales OAuth**

1. **Ir a** → APIs & Services > Credentials
2. **Clic** → CREATE CREDENTIALS > OAuth 2.0 Client IDs
3. **Configurar**:
   ```
   Application type: Web application
   Name: Scout OAuth Client
   
   Authorized JavaScript origins:
   https://tuapp.azurestaticapps.net
   http://localhost:3000
   
   Authorized redirect URIs:
   https://tuproyecto.supabase.co/auth/v1/callback
   ```

4. **COPIAR estas credenciales** (las necesitaremos):
   ```
   Client ID: 123456789-xxx.apps.googleusercontent.com
   Client secret: GOCSPX-xxxxxxxxxxxxx
   ```

### 📱 **PASO 4: Configurar en Supabase**

1. **Abrir tu proyecto Supabase** → https://app.supabase.com/
2. **Ir a** → Authentication > Providers
3. **Buscar Google** y configurar:
   ```
   Enable Google provider: ✅
   Client ID: [PEGAR desde Google]
   Client Secret: [PEGAR desde Google]
   ```
4. **SAVE**

### 📱 **PASO 5: URLs en Supabase**

1. **En Supabase** → Authentication > URL Configuration
2. **Configurar**:
   ```
   Site URL: https://tuapp.azurestaticapps.net
   
   Redirect URLs:
   https://tuapp.azurestaticapps.net/**
   http://localhost:3000/**
   ```

### 📱 **PASO 6: Variables de Entorno**

En **GitHub → Settings → Secrets and variables → Actions**:

```env
VITE_GOOGLE_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
VITE_AUTH_REDIRECT_URL=https://tuapp.azurestaticapps.net/dashboard
```

## ✅ **VERIFICAR QUE FUNCIONA**

1. **Deploy** tu app
2. **Ir a** → https://tuapp.azurestaticapps.net
3. **Probar login** con Google
4. **Deberías ver** → Pantalla de consentimiento de Google

---

## 🆘 **SI ALGO NO FUNCIONA**

### ❌ Error: "redirect_uri_mismatch"
**SOLUCIÓN**: Verificar que las URLs en Google Cloud coincidan exactamente

### ❌ Error: "invalid_client"  
**SOLUCIÓN**: Verificar Client ID en Supabase

### ❌ Error: "access_denied"
**SOLUCIÓN**: Verificar que el email esté en tabla `dirigentes_autorizados`

---

## 🎯 **URLs que necesitas conocer**

- **Google Cloud Console**: https://console.cloud.google.com/
- **Tu Supabase**: https://app.supabase.com/project/[TU-PROJECT]
- **Tu App**: https://tuapp.azurestaticapps.net

¡Listo! Con esto tendrás Google OAuth funcionando 🚀