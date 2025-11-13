# 🔐 Configuración de Google OAuth en Supabase

## Guía paso a paso para habilitar autenticación con Google

### 1. Configuración en Google Cloud Console

#### Crear un nuevo proyecto (si no tienes uno)
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el **Project ID**

#### Habilitar Google+ API
1. En el menú lateral, ve a **APIs & Services > Library**
2. Busca "Google+ API" y habilítala
3. También habilita "Gmail API" (opcional, para perfiles completos)

#### Configurar OAuth 2.0
1. Ve a **APIs & Services > Credentials**
2. Clic en **Create Credentials > OAuth 2.0 Client IDs**
3. Si es tu primera vez, configura la pantalla de consentimiento:
   - Tipo: Externo
   - Nombre de la aplicación: "Sistema Grupo Scout"
   - Email de soporte: tu email
   - Dominio autorizado: tu dominio de Azure Static Web App
4. Crear credenciales OAuth:
   - Tipo de aplicación: **Web application**
   - Nombre: "Scout System Auth"
   - URIs de origen autorizados:
     ```
     https://tuapp.azurestaticapps.net
     http://localhost:3000 (para desarrollo)
     ```
   - URIs de redirección autorizados:
     ```
     https://tuproyecto.supabase.co/auth/v1/callback
     ```

#### Obtener credenciales
- **Client ID**: Algo como `123456789-abc.apps.googleusercontent.com`
- **Client Secret**: String alfanumérico

### 2. Configuración en Supabase Dashboard

#### Acceder a la configuración de autenticación
1. Ve a tu proyecto de Supabase
2. En el menú lateral: **Authentication > Providers**
3. Busca **Google** en la lista

#### Configurar Google OAuth
```json
{
  "enabled": true,
  "client_id": "TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
  "client_secret": "TU_GOOGLE_CLIENT_SECRET"
}
```

#### Configurar URLs de redirección
En **Authentication > URL Configuration**:
- **Site URL**: `https://tuapp.azurestaticapps.net`
- **Redirect URLs** (separadas por comas):
  ```
  https://tuapp.azurestaticapps.net/**,
  http://localhost:3000/**
  ```

### 3. Variables de entorno para tu aplicación

Actualiza tus GitHub Secrets con:

```env
# Supabase (ya existentes)
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key

# Google OAuth (nuevas)
VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
VITE_GOOGLE_OAUTH_REDIRECT_URL=https://tuproyecto.supabase.co/auth/v1/callback

# URLs de la aplicación
VITE_APP_URL=https://tuapp.azurestaticapps.net
VITE_AUTH_REDIRECT_URL=https://tuapp.azurestaticapps.net/dashboard
```

### 4. Configuración de Magic Links

#### Templates de email personalizados
En **Authentication > Email Templates**:

**Confirm signup:**
```html
<h2>¡Bienvenido al Sistema Scout!</h2>
<p>Hola {{ .Name }},</p>
<p>Gracias por registrarte en el Sistema de Gestión Scout.</p>
<p>Confirma tu cuenta haciendo clic en el siguiente enlace:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar cuenta</a></p>
<p>Si no solicitaste esta cuenta, puedes ignorar este email.</p>
<p>Saludos,<br>Equipo Scout</p>
```

**Magic Link:**
```html
<h2>Acceso al Sistema Scout</h2>
<p>Hola,</p>
<p>Solicitas acceso al Sistema de Gestión Scout.</p>
<p>Haz clic en el siguiente enlace para ingresar:</p>
<p><a href="{{ .ActionLink }}">Ingresar al Sistema</a></p>
<p>Este enlace expira en 1 hora.</p>
<p>Si no solicitaste este acceso, puedes ignorar este email.</p>
<p>Saludos,<br>Equipo Scout</p>
```

### 5. Testing de la configuración

#### Verificar Google OAuth
1. Abre tu aplicación
2. Intenta login con Google
3. Deberías ser redirigido a Google OAuth
4. Después del login exitoso, revisa la tabla `auth.users`

#### Verificar Magic Links
1. Intenta login con email
2. Revisa tu bandeja de entrada
3. El link debe redirigir correctamente

### 6. Configuración de seguridad adicional

#### Row Level Security (RLS)
Las políticas ya están configuradas en el script SQL, pero verifica:

```sql
-- Verificar que RLS esté habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('dirigentes_autorizados', 'solicitudes_acceso');
```

#### Rate limiting
En **Authentication > Rate Limits**:
- **Maximum emails per hour**: 100
- **Maximum password resets**: 10
- **Maximum signups per hour**: 50

### 7. Script de verificación

Ejecuta este SQL para verificar la configuración:

```sql
-- Verificar usuarios autenticados
SELECT 
    au.email,
    da.nombre_completo,
    da.role,
    gs.nombre as grupo_scout
FROM auth.users au
LEFT JOIN dirigentes_autorizados da ON au.email = da.email
LEFT JOIN grupos_scout gs ON da.grupo_scout_id = gs.id
WHERE da.activo = true;

-- Verificar solicitudes pendientes
SELECT * FROM solicitudes_acceso WHERE estado = 'pendiente';
```

### 8. URLs importantes para bookmarks

- **Supabase Dashboard**: https://app.supabase.com/project/[PROJECT_REF]
- **Google Cloud Console**: https://console.cloud.google.com/
- **Tu aplicación**: https://tuapp.azurestaticapps.net
- **Supabase Auth**: https://tuproyecto.supabase.co/auth/v1/

### 9. Troubleshooting común

#### Error: "Invalid client_id"
- Verifica que el Client ID en Supabase coincida con Google Cloud
- Asegúrate de que el dominio esté autorizado

#### Error: "Redirect URI mismatch"
- Verifica que las URLs de redirección coincidan exactamente
- Incluye el protocolo (https://)

#### Magic Links no llegan
- Verifica la configuración de SMTP en Supabase
- Revisa la carpeta de spam
- Verifica que el email template esté configurado

#### Usuario autenticado pero sin acceso
- Verifica que el email esté en la tabla `dirigentes_autorizados`
- Verifica que `activo = true`
- Revisa las políticas RLS

### 10. Próximos pasos después de la configuración

1. **Crear dirigentes autorizados**:
   ```sql
   INSERT INTO dirigentes_autorizados (email, nombre_completo, grupo_scout_id, role)
   VALUES ('tu-email@gmail.com', 'Tu Nombre', 'grupo_id', 'super_admin');
   ```

2. **Testear el flujo completo**
3. **Configurar notificaciones para solicitudes de acceso**
4. **Documentar el proceso para otros dirigentes**

¡Una vez completada esta configuración, tu sistema de autenticación multi-tenant estará funcionando! 🎉