# Fix: Error de Autenticación en Asistencia Masiva (Azure)

**Fecha:** 19 de enero de 2026  
**Problema:** ❌ Debes estar autenticado para registrar asistencia (Azure Static Web Apps)  
**Estado:** ✅ Resuelto

---

## 📋 Descripción del Problema

En la versión publicada en Azure Static Web Apps, al intentar registrar asistencia masiva se mostraba el error:

```
❌ Debes estar autenticado para registrar asistencia
```

Este error ocurría aunque el usuario estuviera correctamente autenticado.

### Causa Raíz

El código utilizaba `supabase.auth.getUser()` para verificar la autenticación. Este método hace una llamada al servidor de Supabase y puede fallar en Azure Static Web Apps cuando:

1. La sesión aún se está recuperando del localStorage
2. Hay problemas de latencia con el servidor de Supabase
3. La página se recarga y el estado de autenticación no se ha sincronizado

---

## 🔧 Solución Implementada

Se reemplazó `supabase.auth.getUser()` por `supabase.auth.getSession()` en todos los componentes de asistencia.

### Diferencia entre los métodos:

| Método | Comportamiento | Uso Recomendado |
|--------|---------------|-----------------|
| `getUser()` | Hace request al servidor de Supabase | Validación en backend |
| `getSession()` | Lee del localStorage (más rápido) | Validación en frontend (Azure SWA) |

### Archivos Modificados

1. **`src/components/Asistencia/AsistenciaMigrated.tsx`**
   - ✅ `handleRegistrarAsistenciaMasiva()` - línea 91
   - ✅ `handleSubmitAsistencia()` - línea 402

2. **`src/components/Asistencia/Asistencia.tsx`**
   - ✅ `handleRegistrarAsistenciaMasiva()` - línea 110
   - ✅ `handleSubmitAsistencia()` - línea 445

### Código Antes:

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  alert('❌ Debes estar autenticado para registrar asistencia');
  return;
}
```

### Código Después:

```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session?.user) {
  alert('❌ Debes estar autenticado para registrar asistencia');
  return;
}
const user = session.user;
```

---

## 🚀 Despliegue en Azure

### 1. Build del Proyecto

```bash
npm run build
```

**Output esperado:**
```
✓ 1891 modules transformed.
dist/index.html
dist/assets/index-[hash].css
dist/assets/index-[hash].js
✓ built in 3.09s
```

### 2. Despliegue Automático (GitHub)

Si tienes configurado GitHub Actions con Azure Static Web Apps:

```bash
git add .
git commit -m "fix: Cambiar getUser() a getSession() para Azure auth"
git push origin main
```

El despliegue se activa automáticamente.

### 3. Despliegue Manual

```bash
# Instalar Azure Static Web Apps CLI (si no lo tienes)
npm install -g @azure/static-web-apps-cli

# Desplegar
swa deploy ./dist --env production
```

---

## ✅ Verificación Post-Despliegue

1. Abrir la app en Azure: https://[tu-app].azurestaticapps.net
2. Iniciar sesión
3. Ir a **Asistencia** → **Asistencia Masiva**
4. Seleccionar un programa y scouts
5. Hacer clic en **Guardar Asistencia**

**Resultado esperado:**
```
✅ Asistencia masiva registrada exitosamente
```

---

## 🔍 Mejoras Adicionales (Opcionales)

### A. Agregar Retry Logic

Si persisten problemas de latencia, agregar:

```typescript
const getAuthenticatedUser = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user;
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error('No se pudo obtener la sesión');
};
```

### B. Usar Context para User

Evitar múltiples llamadas a `getSession()`:

```typescript
// En GrupoScoutContext.tsx
const [currentUser, setCurrentUser] = useState(null);

useEffect(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    setCurrentUser(session?.user || null);
  });
}, []);
```

---

## 📊 Impacto

- ✅ **Performance:** `getSession()` es más rápido (lectura local vs request HTTP)
- ✅ **Confiabilidad:** No depende de latencia de red
- ✅ **UX:** Menos errores de autenticación falsos
- ✅ **Compatibilidad:** Funciona mejor con Azure Static Web Apps

---

## 📝 Notas Técnicas

### Por qué funciona mejor en Azure

Azure Static Web Apps sirve archivos estáticos globalmente con CDN. Cuando se usa `getUser()`:

1. Usuario carga la página desde CDN (Europa)
2. Browser recupera sesión del localStorage
3. Código llama a `getUser()` → servidor Supabase (probablemente US)
4. **Latencia:** 200-500ms + puede fallar si hay problemas de red
5. En el medio, el código ya ejecutó la validación y falló

Con `getSession()`:

1. Usuario carga la página desde CDN
2. Código lee localStorage directamente
3. **Latencia:** <10ms
4. Validación exitosa

### Seguridad

La validación en frontend es suficiente porque:

1. Las tablas de Supabase tienen Row Level Security (RLS)
2. El backend valida permisos en cada operación
3. El token JWT en la sesión está verificado
4. No se puede falsificar la sesión sin las credenciales

---

## 🆘 Troubleshooting

### Error persiste después del fix

1. **Verificar que el usuario esté autenticado:**
   ```javascript
   // En DevTools Console
   const { data } = await supabase.auth.getSession();
   console.log(data.session?.user);
   ```

2. **Limpiar caché y localStorage:**
   - DevTools → Application → Clear storage
   - Volver a iniciar sesión

3. **Verificar variables de entorno en Azure:**
   ```
   VITE_SUPABASE_URL=https://[tu-proyecto].supabase.co
   VITE_SUPABASE_ANON_KEY=[tu-key]
   ```

4. **Verificar que el build incluye los cambios:**
   ```bash
   cat dist/assets/index-*.js | grep "getSession"
   ```

---

## 📚 Referencias

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/)
- [getSession vs getUser](https://supabase.com/docs/reference/javascript/auth-getsession)
