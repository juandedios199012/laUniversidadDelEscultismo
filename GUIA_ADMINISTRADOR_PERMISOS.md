# 🔐 Guía del Administrador: Sistema de Permisos
## Grupo Scout Lima 12 — Sistema de Gestión Web

---

## 📌 Resumen Ejecutivo

El sistema tiene un **único Módulo de Seguridad Unificado (v3)**, visible en el sidebar como **"Seguridad"**. Desde ahí, un Super Admin gestiona usuarios, roles, permisos, módulos y funcionalidades desde una sola interfaz —sin necesidad de tocar la base de datos— con la seguridad real garantizada por RLS (Row Level Security) en Supabase, no solo por el frontend.

Pestañas del módulo:
- **Usuarios**: invita usuarios reales (cuenta creada por Supabase Auth) y les asigna uno o más roles.
- **Roles y Permisos**: matriz rápida CRUD (Ver / Ver detalle / Crear / Editar / Eliminar / Exportar) por módulo y rol.
- **Permisos Avanzados**: matriz de grano fino (`role_permissions` × `app_permissions`), incluye permisos específicos como `scouts:imprimir:ficha` o `finanzas:aprobar:gasto`.
- **Registro de Funcionalidades**: catálogo dinámico de módulos y permisos (`app_modules` / `app_permissions`) — para dar de alta nuevas funcionalidades sin escribir SQL.
- **Auditoría**: historial de cambios de seguridad.
- **Configuración** (solo super_admin): permisos granulares del módulo Aire Libre y ajustes generales.

> Las pantallas anteriores "Seguridad (v1)" y "Seguridad V2" fueron consolidadas en este único módulo. Ya no existen como pantallas separadas.

---

## 🏗️ Arquitectura del Sistema de Permisos (v3, implementada)

```
auth.users (Supabase Auth)
        │  trigger on_auth_user_created → handle_new_user()
        ▼
profiles (id = auth.users.id, email, full_name, activo)
        │
        ▼
user_roles  ←──────────── puente MUCHOS-A-MUCHOS: un usuario puede tener varios roles
        │                 (ej. un dirigente que también es padre de familia)
        ▼
roles  ←───────────────── super_admin, jefe_grupo, coordinador, dirigente,
        │                 asistente, padre_familia, scout (con nivel_jerarquia)
        ▼
role_permissions  ←────── vincula role_id ↔ permission_id
        │
        ▼
app_permissions  ←─────── diccionario de permisos, permission_key: 'modulo:accion[:objeto]'
        │
        ▼
app_modules  ←──────────── módulos + sub-módulos usados por la UI
```

**Identidad vs. credenciales**: `auth.users` (Supabase Auth) gestiona únicamente email/contraseña/tokens — nunca se duplica la contraseña en ninguna otra tabla. `profiles` es la identidad de negocio (nombre, estado). El trigger `handle_new_user()` los sincroniza automáticamente en cada alta.

**Multi-rol real**: a diferencia de un sistema RBAC clásico de un solo rol por usuario, `user_roles` permite que un usuario tenga varios roles simultáneos. Sus permisos efectivos son la **unión** de los permisos de todos sus roles (ver función `check_user_permission` abajo).

**Función central de verificación** (usada por las políticas RLS):

```sql
CREATE OR REPLACE FUNCTION check_user_permission(required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_uid UUID := auth.uid();
BEGIN
    IF v_uid IS NULL THEN RETURN FALSE; END IF;

    -- Bypass: cualquiera de los roles del usuario tiene nivel_jerarquia >= 70
    IF EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = v_uid AND r.nivel_jerarquia >= 70 AND r.activo
    ) THEN RETURN TRUE; END IF;

    -- Unión de permisos de TODOS los roles del usuario
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN role_permissions rp ON rp.role_id = ur.role_id
        JOIN app_permissions ap ON ap.id = rp.permission_id
        WHERE ur.user_id = v_uid
          AND ap.permission_key = required_permission
          AND ap.activo = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

Esta función respalda las políticas RLS de `profiles`, `roles`, `role_permissions`, `app_permissions`, `app_modules`, `user_roles` y `audit_log`. RLS de las tablas de negocio (scouts, finanzas, inventario, etc.) queda para una fase posterior — `check_user_permission()` ya está lista para reutilizarse ahí.

**Archivos SQL que instalan este esquema** (ver sección de Archivos de Referencia):
`database/94_seguridad_v3_unificada.sql` (esquema, trigger, funciones, RLS) y `database/94b_migrar_datos_seguridad_v3.sql` (migración de datos desde el sistema anterior + limpieza).

---

## Frontend: cómo se consumen los permisos (React + Vite)

La app carga los permisos del usuario **una sola vez** al iniciar sesión (o al refrescar manualmente) mediante `PermissionsContext` (`src/contexts/PermissionsContext.tsx`), respaldado por la función SQL `api_obtener_seguridad_usuario(p_user_id)`.

```tsx
const { puedeAcceder, tienePermiso, can, esAdmin, esSuperAdmin, recargarPermisos } = usePermissions();

// Chequeo clásico por módulo + acción (compatibilidad con el sistema anterior)
if (tienePermiso('scouts', 'crear')) { /* ... */ }

// Chequeo de grano fino por permission_key (nuevo, recomendado para funcionalidades específicas)
if (can('scouts:exportar:pdf')) { /* ... */ }
```

`can(permissionKey)` es el equivalente moderno del patrón `useAbility`/`Guard` de la propuesta original — vive directamente en `PermissionsContext` (no hay un hook ni un componente separado) para no duplicar el estado de permisos que ya se carga una sola vez al login.

**Registro de Funcionalidades** (pestaña "Registro de Funcionalidades" del módulo Seguridad): al crear una función nueva en React, protégela con `can('modulo:accion')`, luego regístrala en esa pestaña (crea filas en `app_modules`/`app_permissions`) para que el Super Admin pueda asignarla a un rol desde "Permisos Avanzados".

**Recargar permisos sin cerrar sesión**: `recargarPermisos()` (expuesto por `usePermissions()`) vuelve a llamar `api_obtener_seguridad_usuario` e invalida la caché local — útil después de que un Super Admin cambia los permisos de tu rol en otra pestaña.

---

## 👤 Alta de usuarios — invitación real

A diferencia del sistema anterior (que solo pre-autorizaba un email en una lista blanca y el usuario se autoregistraba), ahora el Super Admin **crea la cuenta directamente**:

1. Sidebar → **Seguridad** → pestaña **"Usuarios"** → **"Invitar Usuario"**.
2. Completa email, nombre completo, y selecciona **uno o más roles** (checkboxes).
3. Al guardar, se invoca la Edge Function `invite-user`, que:
   - Verifica que quien invita tiene el permiso `usuarios:gestionar`.
   - Crea la cuenta real en `auth.users` vía la API admin de Supabase (`inviteUserByEmail`) — dispara el correo real de invitación.
   - El trigger `handle_new_user` crea automáticamente su fila en `profiles`.
   - Asigna los roles elegidos en `user_roles`.
4. El usuario recibe el correo de Supabase y define su propia contraseña desde el link.

**Importante — despliegue de la Edge Function**: esto requiere que el proyecto tenga desplegada `supabase/functions/invite-user` con la `service_role key` como secret (`supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`). Ver el comentario al inicio de `supabase/functions/invite-user/index.ts` para los pasos exactos de `supabase login` / `link` / `deploy`.

**Usuario con doble rol** (ej. un dirigente que también es padre de familia): simplemente selecciona ambos roles al invitarlo, o edítalos después con el botón "Gestionar roles" (ícono de lápiz) en la tabla de usuarios — verá la unión de módulos de ambos roles (los de dirigente vía bypass de nivel, más "Portal de Padres").

---

## 👥 Roles del Sistema

| Rol | Nivel | Descripción |
|-----|-------|-------------|
| `super_admin` | 100 | Acceso total, sin restricciones |
| `jefe_grupo` | 90 | Administrador del grupo scout |
| `coordinador` | 75 | Coordinador de ramas |
| `dirigente` | 70 | Dirigente de rama (acceso a la mayoría de módulos) |
| `asistente` | 50 | Asistente, acceso limitado |
| `padre_familia` | 20 | Padre/madre: solo ve Portal de Padres |
| `scout` | 10 | Scout: acceso muy limitado |

> **Regla clave:** Los roles con nivel ≥ 70 (`dirigente`, `coordinador`, `jefe_grupo`, `super_admin`) tienen acceso **automático** a todos los módulos sin necesitar permisos individuales. Un usuario puede tener **varios roles a la vez** — sus permisos son la unión de todos ellos.

---

## 📦 Módulos del Sistema (`app_modules`)

| Módulo (clave) | Nombre visible |
|----------------|----------------|
| `dashboard` | Dashboard |
| `scouts` | Scouts |
| `dirigentes` | Dirigentes |
| `patrullas` | Patrullas |
| `progresion` | Progresión |
| `programa_semanal` | Programa Semanal |
| `asistencia` | Asistencia |
| `actividades_exterior` | Actividades al Aire Libre |
| `finanzas` | Finanzas |
| `inscripciones` | Inscripciones |
| `inventario` | Inventario |
| `reportes` | Reportes |
| `libro_oro` | Libro de Oro |
| `comite_padres` | Comité de Padres |
| `mapas` | Mapas |
| `portal_padres` | Portal de Padres |
| `especialidades` | Especialidades |
| `seguridad` | Seguridad |
| `configuracion` | Configuración |

Este catálogo es dinámico — se administra desde la pestaña "Registro de Funcionalidades", no está hardcodeado en la base de datos más allá del seed inicial.

---

## ⚡ Acciones por Módulo

Cada módulo tiene por defecto 6 permisos base (formato `modulo:accion`), más los que se registren específicamente:

| Acción | permission_key | Descripción |
|--------|-----------------|-------------|
| Ver módulo | `modulo:leer` | Acceder y ver el módulo (aparece en sidebar) |
| Ver detalle | `modulo:ver_detalle` | Ver registros individuales en detalle |
| Crear | `modulo:crear` | Crear nuevos registros |
| Editar | `modulo:editar` | Modificar registros existentes |
| Eliminar | `modulo:eliminar` | Borrar registros |
| Exportar | `modulo:exportar` | Exportar datos (PDF, Excel, etc.) |

Además existen permisos de grano fino con un tercer segmento (`modulo:accion:objeto`), ej: `scouts:imprimir:ficha`, `finanzas:aprobar:gasto`, `actividades_exterior:inscribir:participante`. Estos se ven y gestionan en la pestaña **"Permisos Avanzados"**, no en la matriz CRUD básica.

> **Mínimo requerido para que un módulo aparezca en el sidebar:** permiso `modulo:leer` asignado al rol.

---

## 🛠️ PASO A PASO: Cómo dar acceso a un módulo

**Escenario:** Quieres que el rol `padre_familia` pueda ver el Portal de Padres.

### Opción A — Matriz rápida (Roles y Permisos)

1. Sidebar → **Seguridad** → pestaña **"Roles y Permisos"**.
2. Haz clic en el rol `padre_familia` para expandir su matriz CRUD.
3. En la fila **"Portal Padres"**, activa la columna **"Ver Módulo"**.
4. Solo `super_admin` puede guardar cambios — clic en **"Guardar Cambios"**.

### Opción B — Matriz avanzada (Permisos Avanzados)

1. Sidebar → **Seguridad** → pestaña **"Permisos Avanzados"**.
2. Busca el módulo **"Portal de Padres"** (accordion).
3. En la fila `portal_padres:leer`, activa el switch en la columna del rol `padre_familia`.
4. El cambio se guarda de inmediato (sin botón "Guardar").

**Resultado:** la próxima vez que un usuario con rol `padre_familia` inicie sesión (o use "Recargar permisos"), verá "Portal de Padres" en el sidebar.

### Opción C — Script SQL directo en Supabase (Administrador Técnico)

```sql
-- Dar acceso de lectura a portal_padres para el rol padre_familia
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, ap.id
FROM roles r, app_permissions ap
WHERE r.nombre = 'padre_familia'
  AND ap.permission_key = 'portal_padres:leer'
ON CONFLICT (role_id, permission_id) DO NOTHING;
```

---

## 🔍 PASO A PASO: Verificar qué permisos tiene un usuario

### En la pestaña "Permisos Avanzados"

La matriz muestra: filas = módulos + permisos (`app_permissions`), columnas = roles, celdas = switch verde (tiene) / gris (no tiene).

### En Supabase SQL Editor

```sql
-- Ver todos los permisos efectivos de un rol específico
SELECT r.nombre AS rol, ap.permission_key, ap.descripcion
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN app_permissions ap ON ap.id = rp.permission_id
WHERE r.nombre = 'padre_familia'  -- ← Cambia por el rol a consultar
ORDER BY ap.permission_key;
```

```sql
-- Ver a qué roles y módulos tiene acceso un usuario por email (unión de TODOS sus roles)
SELECT
    p.email,
    r.nombre AS rol,
    r.nivel_jerarquia,
    ap.permission_key
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
JOIN roles r ON r.id = ur.role_id
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN app_permissions ap ON ap.id = rp.permission_id
WHERE p.email = 'correo@ejemplo.com'  -- ← Cambia por el email
ORDER BY r.nivel_jerarquia DESC, ap.permission_key;
```

---

## ⚠️ Casos Comunes y Soluciones

### "Un padre no ve el Portal de Padres"

**Causa:** El rol `padre_familia` no tiene `portal_padres:leer`.

**Solución:** Seguridad → Permisos Avanzados → fila `portal_padres:leer` → columna `padre_familia` → activar.

---

### "Un dirigente no puede acceder a un módulo"

**Causa A:** El rol es `asistente` (nivel 50) y no tiene el permiso explícito.
**Solución A:** Seguridad → Permisos Avanzados → activar `modulo:leer` para el rol `asistente`.

**Causa B:** El rol fue asignado incorrectamente.
**Solución B:** Seguridad → Usuarios → botón "Gestionar roles" del usuario → corregir sus roles.

---

### "Cambié un permiso pero el usuario no lo ve"

**Causa:** Los permisos se cargan una sola vez al iniciar sesión y quedan en caché en memoria (5 min).

**Solución:** El usuario debe cerrar sesión y volver a iniciar sesión, o usar "Recargar permisos" si la pantalla lo ofrece.

---

### "Aparece el módulo en el sidebar pero dice 'Acceso Denegado'"

**Causa:** Tiene `leer` pero la pantalla interna verifica otro permiso específico (ej. `ver_detalle` o un `permission_key` de grano fino).

**Solución:** Activa también ese permiso específico para el mismo rol en "Permisos Avanzados".

---

## 📋 Permisos Mínimos por Rol (Configuración Recomendada)

### Rol: `padre_familia`
```
portal_padres: leer, ver_detalle, exportar
```

### Rol: `asistente`
```
dashboard: leer
scouts: leer, ver_detalle
asistencia: leer, crear, editar
progresion: leer, ver_detalle
programa_semanal: leer
```

### Roles `dirigente`, `coordinador`, `jefe_grupo`, `super_admin` (nivel ≥ 70)
No necesitan permisos individuales — el nivel 70+ da bypass completo en `check_user_permission()`.

---

## 🔑 Roles y Niveles: Regla de Bypass

```
nivel_jerarquia >= 70  →  Acceso total a TODOS los módulos
                          Sin necesidad de permisos individuales

nivel_jerarquia < 70   →  Requiere permiso explícito por módulo y acción
                          (unión de todos los roles que tenga el usuario)
```

Los roles con bypass automático son: `dirigente` (70), `coordinador` (75), `jefe_grupo` (90), `super_admin` (100).
Los roles que requieren permisos manuales son: `asistente` (50), `padre_familia` (20), `scout` (10).

---

## 🗃️ Archivos SQL de Referencia

| Archivo | Propósito |
|---------|-----------|
| `database/94_seguridad_v3_unificada.sql` | Esquema actual: `profiles`, `user_roles`, `role_permissions`, trigger `handle_new_user`, función `check_user_permission`, y todas las funciones RPC del módulo, con RLS. |
| `database/94b_migrar_datos_seguridad_v3.sql` | Migración de datos desde el sistema anterior (whitelist + tablas v1/v2) y limpieza final. |
| `supabase/functions/invite-user/index.ts` | Edge Function que crea la cuenta real del usuario invitado. |
| `database/77_permisos_aire_libre.sql` | Permisos granulares del módulo Actividades al Aire Libre (pestaña Tabs/acciones), independiente de este módulo. |

Los scripts SQL anteriores (`60_security_rbac_audit*.sql`, `85_seguridad_v2_schema.sql`, `02_authentication_system.sql`, `03_usuarios_autorizados.sql`, `03c_disable_rls.sql`) quedaron **superados** por `94_seguridad_v3_unificada.sql` — no deben volver a ejecutarse.

---

## 📞 Flujo Completo: Alta de un Padre de Familia

```
1. Padre contacta al grupo y da su email
       │
       ▼
2. Admin va a: Seguridad → Usuarios → "Invitar Usuario"
   - Email, nombre completo
   - Rol: padre_familia
       │
       ▼
3. Supabase envía el correo real de invitación al padre
       │
       ▼
4. Padre hace clic en el link y define su propia contraseña
   (el trigger handle_new_user ya creó su fila en profiles)
       │
       ▼
5. Admin vincula al hijo en la BD:
   - Tabla: familiares_scout
   - Busca al scout (hijo) por nombre/código
   - Agrega el email del padre como familiar
       │
       ▼
6. Padre inicia sesión → ve "Portal de Padres" en el sidebar
       │
       ▼
7. Padre hace clic en su hijo → ve Información Básica + Progresión
```

---

*Última actualización: Módulo de Seguridad Unificado v3 — Sistema de Gestión Scout Grupo Lima 12*
