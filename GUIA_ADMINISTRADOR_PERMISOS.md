# 🔐 Guía del Administrador: Sistema de Permisos
## Grupo Scout Lima 12 — Sistema de Gestión Web

---

## 📌 Resumen Ejecutivo

El sistema tiene **dos módulos de Seguridad** visibles en el sidebar:

| Módulo | Qué hace | Cuándo usar |
|--------|----------|-------------|
| **Seguridad** (v1) | Gestiona usuarios, roles, auditoría y configuración avanzada | Para administrar usuarios, ver auditoría, invitar personas |
| **Seguridad V2** | Matriz visual para asignar/revocar permisos por rol | Para cambiar qué puede ver/hacer cada rol |

> **Ambos modifican la misma base de datos.** No son excluyentes.  
> **Recomendación:** Usa **Seguridad V2** para permisos del día a día, y **Seguridad (v1)** para gestión de usuarios.

---

## 🏗️ Arquitectura del Sistema de Permisos

```
Usuario (auth.users)
    │
    ▼
dirigentes_autorizados  ←── email + role asignado por admin
    │
    ▼
usuarios_roles  ←────────── vincula usuario_id ↔ rol_id
    │
    ▼
roles  ←─────────────────── ej: padre_familia, dirigente, jefe_grupo
    │
    ▼
rol_permisos  ←──────────── vincula rol_id ↔ permiso_id
    │
    ▼
permisos  ←──────────────── modulo + accion (ej: scouts:leer)
```

### Cómo funciona al iniciar sesión

1. El usuario inicia sesión con su email
2. El sistema busca su email en `dirigentes_autorizados`
3. Obtiene su `role` (ej: `padre_familia`, `dirigente`)
4. Carga todos los permisos de ese rol
5. El sidebar muestra solo los módulos a los que tiene acceso (`leer`)

---

## 👥 Roles del Sistema

| Rol | Nivel | Descripción |
|-----|-------|-------------|
| `super_admin` | 100 | Acceso total, sin restricciones |
| `jefe_grupo` | 90 | Administrador del grupo scout |
| `grupo_admin` | 80 | Administrador general |
| `coordinador` | 75 | Coordinador de ramas |
| `dirigente` | 70 | Dirigente de rama (acceso a la mayoría de módulos) |
| `asistente` | 50 | Asistente, acceso limitado |
| `padre_familia` | 20 | Padre/madre: solo ve Portal de Padres |
| `scout` | 10 | Scout: acceso muy limitado |

> **Regla clave:** Los roles con nivel ≥ 70 (`dirigente`, `coordinador`, `grupo_admin`, `jefe_grupo`, `super_admin`) tienen acceso **automático** a todos los módulos sin necesitar permisos individuales.

---

## 📦 Módulos del Sistema

| Módulo (clave) | Nombre visible | Descripción |
|----------------|----------------|-------------|
| `dashboard` | Dashboard | Panel principal |
| `scouts` | Scouts | Registro y gestión de scouts |
| `dirigentes` | Dirigentes | Gestión de dirigentes |
| `patrullas` | Patrullas | Gestión de patrullas |
| `asistencia` | Asistencia | Registro de asistencia |
| `actividades` | Actividades | Actividades del grupo |
| `progresion` | Progresión | Progresión scout (objetivos y etapas) |
| `inscripciones` | Inscripciones | Inscripciones anuales |
| `finanzas` | Finanzas | Gestión financiera |
| `inventario` | Inventario | Control de inventario |
| `presupuestos` | Presupuestos | Gestión de presupuestos |
| `reportes` | Reportes | Reportes y estadísticas |
| `mapas` | Mapas | Mapas de actividades |
| `libro_oro` | Libro de Oro | Registro histórico |
| `programa_semanal` | Programa Semanal | Planificación semanal |
| `comite_padres` | Comité de Padres | Gestión del comité |
| `actividades_exterior` | Actividades al Aire Libre | Campamentos y salidas |
| `seguridad` | Seguridad | Administración del sistema |
| `configuracion` | Configuración | Configuración general |
| `portal_padres` | Portal de Padres | Vista exclusiva para padres |

---

## ⚡ Acciones por Módulo

Cada módulo puede tener estas acciones asignadas por rol:

| Acción | Código | Descripción |
|--------|--------|-------------|
| Ver módulo | `leer` | Acceder y ver el módulo (aparece en sidebar) |
| Ver detalle | `ver_detalle` | Ver registros individuales en detalle |
| Crear | `crear` | Crear nuevos registros |
| Editar | `editar` | Modificar registros existentes |
| Eliminar | `eliminar` | Borrar registros |
| Exportar | `exportar` | Exportar datos (PDF, Excel, etc.) |
| Aprobar | `aprobar` | Aprobar solicitudes o registros |

> **Mínimo requerido para que un módulo aparezca en el sidebar:** permiso `leer` asignado al rol.

---

## 🛠️ PASO A PASO: Cómo dar acceso a un módulo

### Método A: Usando Seguridad V2 (Recomendado)

**Escenario:** Quieres que el rol `padre_familia` pueda ver el Portal de Padres.

1. Ir al **sidebar → Seguridad V2**
2. Click en la pestaña **"Matriz de Permisos"**
3. Busca la fila del módulo **`portal_padres`**
4. En la columna del rol **`padre_familia`**
5. Activa el toggle de la acción **`leer`** (cambia a verde ✅)
6. El cambio se guarda automáticamente

**Resultado:** La próxima vez que un usuario con rol `padre_familia` inicie sesión (o recargue), verá "Portal de Padres" en el sidebar.

---

### Método B: Usando Seguridad (v1) — Roles y Permisos

1. Ir al **sidebar → Seguridad**
2. Click en la pestaña **"Roles y Permisos"**
3. Busca el rol deseado (ej: `padre_familia`)
4. Click en el ícono de editar
5. Activa los checkboxes de los permisos que necesita
6. Guardar cambios

---

### Método C: Script SQL directo en Supabase (Para el Administrador Técnico)

```sql
-- Dar acceso de lectura a portal_padres para rol padre_familia
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r, permisos p
WHERE r.nombre = 'padre_familia'
  AND p.modulo = 'portal_padres'
  AND p.accion = 'leer'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;
```

---

## 👤 PASO A PASO: Cómo crear un nuevo usuario

### Para un Padre de Familia

1. Ir al **sidebar → Seguridad → pestaña "Usuarios"**
2. Click en **"Invitar Usuario"** o **"Agregar Autorizado"**
3. Ingresar el email del padre/madre
4. Seleccionar el rol: **`padre_familia`**
5. El sistema enviará un email de invitación
6. El padre debe crear su contraseña desde el link recibido
7. Después de registrarse, un admin debe **vincular sus hijos** en la base de datos

> **Nota:** El script SQL `93_add_portal_padres_permission.sql` ya asegura que el rol `padre_familia` tenga el permiso `portal_padres:leer`.

### Para un Dirigente

1. Mismos pasos, pero seleccionar rol: **`dirigente`**
2. Al tener nivel 70, automáticamente tiene acceso a todos los módulos

---

## 🔍 PASO A PASO: Verificar qué permisos tiene un usuario

### En Seguridad V2 → Matriz de Permisos

La matriz muestra una tabla completa con:
- Filas = Módulos + Acciones (ej: `scouts:leer`, `scouts:crear`)
- Columnas = Roles
- Celdas = Toggle verde (tiene permiso) o gris (no tiene)

### En la consola del navegador (para desarrollo)

```javascript
// Abre DevTools → Console en la web
// El objeto de permisos del usuario actual está en el contexto de React
// Busca en el componente App o usa React DevTools
```

### En Supabase SQL Editor

```sql
-- Ver todos los permisos de un rol específico
SELECT
    r.nombre AS rol,
    p.modulo,
    p.accion,
    p.descripcion
FROM rol_permisos rp
JOIN roles r ON rp.rol_id = r.id
JOIN permisos p ON rp.permiso_id = p.id
WHERE r.nombre = 'padre_familia'  -- ← Cambia por el rol a consultar
ORDER BY p.modulo, p.accion;
```

```sql
-- Ver a qué módulos tiene acceso un usuario por email
SELECT
    da.email,
    da.role,
    p.modulo,
    p.accion
FROM dirigentes_autorizados da
JOIN roles r ON r.nombre = da.role
JOIN rol_permisos rp ON rp.rol_id = r.id
JOIN permisos p ON p.id = rp.permiso_id
WHERE da.email = 'correo@ejemplo.com'  -- ← Cambia por el email
ORDER BY p.modulo;
```

---

## 🔄 Diferencia entre los dos módulos de Seguridad

### Seguridad (v1) — El "Centro de Control"

**Pestañas:**
- **Roles y Permisos**: Ver y editar qué puede hacer cada rol (matriz básica)
- **Usuarios**: Lista de usuarios autorizados, asignar/cambiar roles, invitar nuevos
- **Auditoría**: Historial completo de acciones realizadas en el sistema
- **Configuración**: Ajustes avanzados (solo super_admin)

**Úsalo para:**
- Invitar nuevos usuarios al sistema
- Cambiar el rol de un usuario
- Ver quién hizo qué y cuándo (auditoría)
- Configuración avanzada del sistema

---

### Seguridad V2 — La "Matriz Visual"

**Pestañas:**
- **Matriz de Permisos**: Tabla visual con toggles para asignar/revocar permisos
- **Registro de Funcionalidades**: Catálogo de módulos y permisos disponibles

**Úsalo para:**
- Dar/quitar permisos específicos a roles
- Ver de un vistazo qué puede hacer cada rol
- Agregar nuevos módulos/permisos al catálogo

**Formato del catálogo:** `modulo:accion` (ej: `portal_padres:leer`) o `modulo:accion:objeto` (ej: `actividades_exterior:tab_presupuesto`)

---

## ⚠️ Casos Comunes y Soluciones

### "Un padre no ve el Portal de Padres"

**Causa:** El rol `padre_familia` no tiene `portal_padres:leer`

**Solución:**
1. Seguridad V2 → Matriz de Permisos → fila `portal_padres` → columna `padre_familia` → activar `leer`
2. O ejecutar el script `database/93_add_portal_padres_permission.sql`

---

### "Un dirigente no puede acceder a un módulo"

**Causa A:** El rol es `asistente` (nivel 50) y no tiene el permiso explícito  
**Solución A:** Ir a Seguridad V2 y activar `modulo:leer` para el rol `asistente`

**Causa B:** El rol fue asignado incorrectamente  
**Solución B:** Ir a Seguridad (v1) → Usuarios → cambiar rol del usuario

---

### "Cambié un permiso pero el usuario no lo ve"

**Causa:** Los permisos se cachean en la sesión

**Solución:** El usuario debe cerrar sesión y volver a iniciar sesión. O en la página, si hay un botón "Recargar permisos", usarlo.

---

### "Aparece el módulo en el sidebar pero dice 'Acceso Denegado'"

**Causa:** Tiene `leer` pero la pantalla interna verifica otro permiso específico (ej: `ver_detalle`)

**Solución:** Activar también `ver_detalle` para el mismo módulo y rol en la Matriz de Permisos.

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

### Rol: `dirigente` (nivel 70 → acceso automático a todo)
No necesita permisos individuales. El nivel 70+ da bypass completo.

### Rol: `coordinador` (nivel 75 → acceso automático a todo)
No necesita permisos individuales.

---

## 🔑 Roles y Niveles: Regla de Bypass

```
nivel_jerarquia >= 70  →  Acceso total a TODOS los módulos
                          Sin necesidad de permisos individuales
                          
nivel_jerarquia < 70   →  Requiere permiso explícito por módulo y acción
```

Los roles con bypass automático son:
- `dirigente` (70)
- `coordinador` (75)  
- `grupo_admin` (80)
- `jefe_grupo` (90)
- `super_admin` (100)

Los roles que requieren permisos manuales:
- `asistente` (50)
- `padre_familia` (20)
- `scout` (10)

---

## 🗃️ Archivos SQL de Referencia

| Archivo | Propósito |
|---------|-----------|
| `database/03_seguridad_roles_permisos.sql` | Creación inicial de tablas y roles |
| `database/93_add_portal_padres_permission.sql` | Agrega permisos de portal_padres |
| `database/api_obtener_seguridad_usuario.sql` | Función que carga permisos al login |

---

## 📞 Flujo Completo: Alta de un Padre de Familia

```
1. Padre contacta al grupo y da su email
       │
       ▼
2. Admin va a: Seguridad (v1) → Usuarios → "Agregar"
   - Email: correo del padre
   - Rol: padre_familia
       │
       ▼
3. Sistema envía email de invitación al padre
       │
       ▼
4. Padre hace clic en el link y crea su contraseña
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

*Última actualización: Mayo 2026 — Sistema de Gestión Scout Grupo Lima 12*
