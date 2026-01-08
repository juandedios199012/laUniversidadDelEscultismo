# 🔐 Guía de Autenticación y Acceso
## Sistema de Gestión Scout - Grupo Scout Lima 12

---

## 📋 Índice
- [Configuración de Supabase](#configuración-de-supabase)
- [Modos de Acceso](#modos-de-acceso)
- [Cambiar entre Modos](#cambiar-entre-modos)
- [Recomendaciones para Producción](#recomendaciones-para-producción)
- [Usuarios y Permisos](#usuarios-y-permisos)

---

## 🔧 Configuración de Supabase

### ¿Qué es el archivo `.env.local`?

El archivo `.env.local` contiene las **credenciales de tu proyecto Supabase**:

```env
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ¿Qué son estas credenciales?

| Variable | Descripción | ¿Es un usuario? |
|----------|-------------|-----------------|
| `VITE_SUPABASE_URL` | Dirección de tu base de datos Supabase | ❌ No, es una URL |
| `VITE_SUPABASE_ANON_KEY` | Clave pública para conectarse al proyecto | ❌ No, es como una API key |

**Importante:**
- ✅ **SÍ se usan en producción** - Son necesarias para que la web se conecte a la base de datos
- ✅ **Son públicas** - Pueden estar en el código del frontend
- ✅ **Son seguras** - Supabase tiene seguridad adicional con RLS (Row Level Security)

### ¿Cómo obtener estas credenciales?

1. Ve a tu proyecto en [https://supabase.com](https://supabase.com)
2. Settings → API
3. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public** key → `VITE_SUPABASE_ANON_KEY`

---

## 🚪 Modos de Acceso

La aplicación puede funcionar en **dos modos**:

### 🔓 Modo Actual: Sin Autenticación (Desarrollo)

**Estado:** Cualquier persona que tenga la URL puede acceder directamente

```typescript
// src/App.tsx - Estado Actual
function AppContent() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner message="Cargando aplicación..." />;
  }

  // ✅ ACCESO DIRECTO - Sin validar usuario
  // Se carga directamente el dashboard

  const renderActiveModule = () => {
    // ...módulos
  }
}
```

**Características:**
- ✅ Acceso inmediato sin login
- ✅ Útil para desarrollo y pruebas
- ❌ No hay control de quién accede
- ❌ No se registra quién hace cambios
- ❌ **NO recomendado para producción**

### 🔒 Modo Producción: Con Autenticación

**Estado:** Solo usuarios autorizados pueden acceder después de iniciar sesión

```typescript
// src/App.tsx - Con Autenticación Habilitada
function AppContent() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner message="Verificando credenciales..." />;
  }

  // 🔒 VALIDAR USUARIO - Mostrar login si no está autenticado
  if (!user) {
    return <LoginPage />;
  }

  // Usuario autenticado, mostrar aplicación
  const renderActiveModule = () => {
    // ...módulos
  }
}
```

**Características:**
- ✅ Solo usuarios autorizados acceden
- ✅ Pantalla de login profesional
- ✅ Registro de auditoría (quién hizo qué)
- ✅ Diferentes métodos de login:
  - 🔵 Google OAuth (Gmail)
  - 📧 Magic Link (link por email)
  - 🔑 Email + Contraseña
- ✅ **Recomendado para producción**

---

## 🔄 Cambiar entre Modos

### Activar Autenticación (Modo Producción)

**Archivo:** `src/App.tsx`

1. Busca estas líneas (aproximadamente línea 28-32):

```typescript
// ACCESO DIRECTO: No requerir autenticación
// Las funciones RPC tienen SECURITY DEFINER, funcionan sin usuario autenticado
```

2. Descomenta estas 3 líneas debajo:

```typescript
// Mostrar login si no hay usuario autenticado
if (!user) {
  return <LoginPage />;
}
```

**Resultado:** La aplicación pedirá login antes de permitir acceso.

### Desactivar Autenticación (Modo Desarrollo)

Simplemente comenta las mismas 3 líneas:

```typescript
// if (!user) {
//   return <LoginPage />;
// }
```

**Resultado:** Acceso directo sin login.

---

## 🚀 Recomendaciones para Producción

### ✅ Checklist Pre-Producción

Antes de publicar la aplicación, asegúrate de:

- [ ] **Habilitar autenticación** - Descomentar validación `if (!user)`
- [ ] **Registrar usuarios autorizados** - Agregar emails de dirigentes
- [ ] **Configurar Google OAuth** (opcional pero recomendado)
- [ ] **Verificar RLS Policies** - Seguridad a nivel de base de datos
- [ ] **SSL/HTTPS configurado** - Supabase lo provee automáticamente
- [ ] **Revisar logs de errores** - Consola del navegador

### 🔐 Niveles de Seguridad

La aplicación tiene **3 capas de seguridad**:

```
┌─────────────────────────────────────────┐
│  1. Frontend - Validar usuario         │
│     if (!user) return <LoginPage />     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  2. Supabase Auth - Sesión válida      │
│     JWT token, refresh automático       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  3. RLS Policies - Permisos por tabla  │
│     SECURITY DEFINER en funciones RPC   │
└─────────────────────────────────────────┘
```

### ⚠️ Sin Autenticación (Estado Actual)

```
┌─────────────────────────────────────────┐
│  ❌ Frontend - Sin validación           │
│     Acceso directo                      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  ⚠️ Supabase - Usa ANON_KEY            │
│     Cliente anónimo                     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  ⚠️ RLS Policies - SECURITY DEFINER    │
│     Funciones ejecutan como owner       │
└─────────────────────────────────────────┘
```

**Riesgo:** Cualquiera con la URL puede acceder y modificar datos.

---

## 👥 Usuarios y Permisos

### Tipos de Usuarios

| Rol | Permisos | ¿Quién? |
|-----|----------|---------|
| `super_admin` | Acceso total, gestión de usuarios | Jefe de Grupo |
| `grupo_admin` | Gestión del grupo scout | Dirigentes principales |
| `dirigente` | Consulta y edición limitada | Dirigentes de rama |

### Registrar Nuevos Usuarios

**Opción 1: Desde la Aplicación (si tienes permisos)**

1. Ir a configuración/usuarios
2. Agregar email del dirigente
3. Asignar rol apropiado
4. Enviar invitación

**Opción 2: Directamente en Supabase (admin)**

1. Ve a Authentication → Users en Supabase
2. "Add user" → Email del dirigente
3. Enviar invitación o crear contraseña temporal

**Opción 3: Por Código SQL**

```sql
-- Insertar en tabla de usuarios autorizados
INSERT INTO authorized_users (email, role, approved, grupo_scout_id)
VALUES 
  ('dirigente@grupolima12.com', 'dirigente', true, 'tu-grupo-id'),
  ('jefe@grupolima12.com', 'super_admin', true, 'tu-grupo-id');
```

### Autorizar Emails para Login

Los emails deben estar en la tabla `authorized_users` para poder iniciar sesión:

```sql
-- Ver usuarios autorizados
SELECT email, role, approved, created_at 
FROM authorized_users 
WHERE approved = true;
```

---

## 🔍 Debugging

### Problema: "Cargando scouts..." infinito

**Causa:** Las funciones RPC no están respondiendo

**Solución:**
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca mensajes de error relacionados con Supabase
4. Verifica que las credenciales en `.env.local` sean correctas
5. Confirma que las funciones RPC existen en Supabase:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name LIKE 'api_%';
   ```

### Problema: "Error al cargar scouts"

**Causa posible:** 
- Funciones RPC no creadas en la base de datos
- RLS Policies bloqueando acceso

**Solución:**
1. Ejecuta los scripts de la carpeta `database/` en orden
2. Verifica que las funciones tengan `SECURITY DEFINER`
3. Revisa logs en Supabase → SQL Editor

### Logs Útiles

La aplicación tiene logs detallados en consola:

```
🔍 Llamando a api_buscar_scouts...
📦 Respuesta completa: {...}
✅ Scouts obtenidos: 25
```

---

## 📚 Referencias

- [Documentación Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [SECURITY DEFINER Functions](https://supabase.com/docs/guides/database/functions)

---

## 📝 Notas Finales

### ¿Por qué funciona sin autenticación?

Las funciones RPC tienen el modificador `SECURITY DEFINER`, lo que significa:

```sql
CREATE OR REPLACE FUNCTION api_buscar_scouts(p_filtros JSON)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- ← Esta línea permite ejecución sin usuario
```

La función se ejecuta con los permisos del **dueño de la función** (el usuario que la creó), no del usuario que la llama. Por eso funciona incluso sin login.

### Transición Desarrollo → Producción

1. **Desarrollo:** Sin autenticación (acceso rápido para probar)
2. **Staging:** Con autenticación + usuarios de prueba
3. **Producción:** Con autenticación + solo usuarios reales

---

**Fecha de última actualización:** 8 de enero de 2026
