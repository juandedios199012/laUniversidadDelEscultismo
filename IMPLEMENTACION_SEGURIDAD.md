# 🔐 Sistema de Seguridad y Auditoría

## Resumen

Sistema completo de **Control de Acceso Basado en Roles (RBAC)** y **Auditoría** para la aplicación del Grupo Scout Lima 12, diseñado para web y mobile.

---

## 📦 Componentes del Sistema

### 1. Base de Datos (`database/60_security_rbac_audit.sql`)

#### Tablas principales:

| Tabla | Descripción |
|-------|-------------|
| `roles` | Definición de roles del sistema |
| `permisos` | Permisos por módulo y acción |
| `rol_permisos` | Relación N:N roles-permisos |
| `usuario_roles` | Asignación de roles a usuarios |
| `audit_log` | Registro de auditoría |

#### Roles predefinidos:

| Rol | Nivel | Descripción |
|-----|-------|-------------|
| `super_admin` | 100 | Acceso total al sistema |
| `jefe_grupo` | 90 | Jefe de Grupo Scout |
| `coordinador` | 70 | Coordinador de Rama |
| `dirigente` | 50 | Dirigente activo |
| `asistente` | 30 | Asistente de dirigente |
| `padre_familia` | 20 | Padre/Apoderado |
| `scout` | 10 | Scout (solo lectura) |

#### Funciones RPC:

```sql
-- Obtener datos de seguridad del usuario
api_obtener_seguridad_usuario(p_user_id UUID)

-- Verificar permiso específico
tiene_permiso(p_user_id UUID, p_modulo TEXT, p_accion TEXT)

-- Asignar rol a usuario
api_asignar_rol(p_admin_id UUID, p_user_id UUID, p_rol_nombre TEXT)

-- Revocar rol de usuario
api_revocar_rol(p_admin_id UUID, p_user_id UUID, p_rol_nombre TEXT)

-- Registrar auditoría
registrar_auditoria(...)

-- Consultar auditoría
consultar_auditoria(p_filtros JSON)
```

---

### 2. Servicios Frontend

#### PermissionsService (`src/services/permissionsService.ts`)

```typescript
// Obtener permisos del usuario (con cache de 5 min)
await PermissionsService.obtenerSeguridadUsuario(userId);

// Verificar permiso específico
await PermissionsService.tienePermiso(userId, 'scouts', 'editar');

// Verificar acceso a módulo
await PermissionsService.puedeAccederModulo(userId, 'finanzas');

// Listar roles disponibles
await PermissionsService.listarRoles();

// Asignar rol
await PermissionsService.asignarRol(adminId, { user_id, rol_nombre });

// Revocar rol
await PermissionsService.revocarRol(adminId, userId, rolNombre);
```

#### AuditService (`src/services/auditService.ts`)

```typescript
// Registrar acción manual
await AuditService.registrar(userId, {
  modulo: 'scouts',
  accion: 'editar',
  tabla: 'scouts',
  registroId: scoutId,
  descripcion: 'Editó datos del scout Juan Pérez',
  datosAnteriores: { nombre: 'Juan' },
  datosNuevos: { nombre: 'Juan Carlos' }
});

// Helpers para operaciones comunes
await AuditService.registrarCreacion(userId, 'scouts', scoutId, { ...datos });
await AuditService.registrarEdicion(userId, 'scouts', scoutId, datosAntes, datosNuevos);
await AuditService.registrarEliminacion(userId, 'scouts', scoutId, datosEliminados);
await AuditService.registrarExportacion(userId, 'reportes', 'Exportó lista de asistencia');

// Consultar auditoría
const { registros, total } = await AuditService.consultar({
  modulo: 'scouts',
  accion: 'editar',
  fecha_desde: '2026-01-01',
  limit: 50
});
```

---

### 3. React Context (`src/contexts/PermissionsContext.tsx`)

#### Provider

```tsx
// En App.tsx o main.tsx
import { PermissionsProvider } from './contexts/PermissionsContext';

<AuthProvider>
  <PermissionsProvider>
    <App />
  </PermissionsProvider>
</AuthProvider>
```

#### Hook principal: `usePermissions()`

```tsx
const { 
  // Datos
  seguridad,           // Objeto completo de seguridad
  rolPrincipal,        // Rol con mayor jerarquía
  modulosAccesibles,   // Lista de módulos con acceso
  
  // Verificadores
  tienePermiso,        // (modulo, accion) => boolean
  puedeAcceder,        // (modulo) => boolean
  puedeCrear,          // (modulo) => boolean
  puedeEditar,         // (modulo) => boolean
  puedeEliminar,       // (modulo) => boolean
  puedeExportar,       // (modulo) => boolean
  
  // Estados especiales
  esAdmin,             // Tiene rol de nivel >= 70
  esSuperAdmin,        // Tiene rol de nivel >= 100
  
  // Estado
  loading,             // Cargando permisos
  recargarPermisos     // Forzar recarga
} = usePermissions();
```

#### Hooks de conveniencia

```tsx
// Verificar permiso específico
const puedeEditarScouts = useHasPermission('scouts', 'editar');

// Verificar acceso a módulo
const accesoFinanzas = useCanAccess('finanzas');
```

#### Componente wrapper

```tsx
// Proteger sección completa
<RequirePermission modulo="finanzas" accion="leer">
  <ModuloFinanzas />
</RequirePermission>

// Mostrar fallback personalizado
<RequirePermission 
  modulo="seguridad" 
  accion="editar"
  fallback={<p>No tienes permisos para editar</p>}
>
  <FormularioEdicion />
</RequirePermission>
```

---

### 4. Componentes UI (`src/components/Seguridad/`)

#### SeguridadDashboard

Panel administrativo con 4 tabs:

1. **Roles y Permisos** - Ver roles del sistema y sus permisos
2. **Usuarios** - Gestionar roles de usuarios
3. **Auditoría** - Consultar logs de actividad
4. **Configuración** - Ajustes avanzados (solo Super Admin)

#### Uso

```tsx
import { SeguridadDashboard } from './components/Seguridad';

// En el router o navegación
<Route path="/seguridad" element={<SeguridadDashboard />} />
```

---

## 🎯 Patrones de Uso

### Proteger un módulo completo

```tsx
// En el componente del módulo
function ModuloFinanzas() {
  const { puedeAcceder, loading } = usePermissions();
  
  if (loading) return <Loading />;
  
  if (!puedeAcceder('finanzas')) {
    return <AccesoDenegado modulo="Finanzas" />;
  }
  
  return <ContenidoFinanzas />;
}
```

### Mostrar/ocultar botones según permisos

```tsx
function ListaScouts() {
  const { puedeCrear, puedeEliminar } = usePermissions();
  
  return (
    <div>
      {puedeCrear('scouts') && (
        <Button onClick={handleNuevoScout}>
          <Plus /> Nuevo Scout
        </Button>
      )}
      
      {scouts.map(scout => (
        <tr key={scout.id}>
          <td>{scout.nombre}</td>
          <td>
            <Button onClick={() => handleEditar(scout)}>Editar</Button>
            {puedeEliminar('scouts') && (
              <Button variant="danger" onClick={() => handleEliminar(scout)}>
                Eliminar
              </Button>
            )}
          </td>
        </tr>
      ))}
    </div>
  );
}
```

### Auditar operaciones CRUD

```tsx
// En el servicio o componente
async function crearScout(datos: ScoutData) {
  const { data, error } = await supabase
    .from('scouts')
    .insert(datos)
    .select()
    .single();
  
  if (data) {
    // Registrar en auditoría
    await AuditService.registrarCreacion(
      user.id,
      'scouts',
      data.id,
      datos,
      `Scout ${datos.nombre} registrado`
    );
  }
  
  return { data, error };
}

async function editarScout(id: string, datosAnteriores: any, datosNuevos: any) {
  const { data, error } = await supabase
    .from('scouts')
    .update(datosNuevos)
    .eq('id', id)
    .select()
    .single();
  
  if (data) {
    await AuditService.registrarEdicion(
      user.id,
      'scouts',
      id,
      datosAnteriores,
      datosNuevos,
      `Scout ${datosNuevos.nombre} actualizado`
    );
  }
  
  return { data, error };
}
```

---

## 📝 Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| `dashboard` | Panel principal |
| `scouts` | Gestión de scouts |
| `dirigentes` | Gestión de dirigentes |
| `patrullas` | Gestión de patrullas |
| `asistencia` | Control de asistencia |
| `actividades` | Actividades y eventos |
| `progresion` | Progresión scout |
| `inscripciones` | Inscripciones anuales |
| `finanzas` | Tesorería y pagos |
| `inventario` | Control de equipamiento |
| `presupuestos` | Presupuestos |
| `reportes` | Reportes y exportaciones |
| `mapas` | Ubicaciones |
| `libro_oro` | Libro de oro |
| `programa_semanal` | Planificación semanal |
| `comite_padres` | Comité de padres |
| `actividades_exterior` | Actividades al aire libre |
| `seguridad` | Administración de seguridad |
| `configuracion` | Configuración del sistema |

---

## 🔧 Acciones Disponibles

| Acción | Descripción |
|--------|-------------|
| `crear` | Crear nuevos registros |
| `leer` | Ver/consultar información |
| `editar` | Modificar registros existentes |
| `eliminar` | Eliminar registros |
| `exportar` | Exportar datos (Excel, PDF) |
| `aprobar` | Aprobar solicitudes/procesos |

---

## 🚀 Instalación

### 1. Ejecutar migraciones SQL

```bash
# Ejecutar en Supabase SQL Editor o psql
database/60_security_rbac_audit.sql
```

### 2. Agregar Provider en la aplicación

```tsx
// src/main.tsx o src/App.tsx
import { PermissionsProvider } from './contexts/PermissionsContext';

function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <Router>
          <Routes>
            {/* ... */}
          </Routes>
        </Router>
      </PermissionsProvider>
    </AuthProvider>
  );
}
```

### 3. Asignar rol inicial al primer admin

```sql
-- En Supabase SQL Editor
INSERT INTO public.usuario_roles (user_id, rol_id)
SELECT 
  'UUID-DEL-USUARIO-ADMIN',
  r.id
FROM public.roles r
WHERE r.nombre = 'super_admin';
```

---

## ⚡ Rendimiento

- **Cache local**: Permisos se cachean 5 minutos en el frontend
- **Índices**: La tabla audit_log tiene índices en user_id, modulo, created_at
- **Particionamiento**: Considerar partición por fecha para audit_log si supera 1M registros
- **RLS**: Row Level Security habilitado en todas las tablas

---

## 📱 Compatibilidad Mobile

El servicio `AuditService` detecta automáticamente el dispositivo:

```typescript
// Se detecta automáticamente
dispositivo: 'web' | 'mobile' | 'api'
```

Los hooks y servicios funcionan igual en React Native (mobile).

---

## 🛡️ Buenas Prácticas

1. **Siempre verificar permisos** antes de mostrar acciones en UI
2. **Auditar operaciones críticas** (crear, editar, eliminar)
3. **No confiar solo en UI** - validar también en backend con RLS
4. **Usar roles del sistema** - no crear roles innecesarios
5. **Revisar auditoría regularmente** - detectar accesos sospechosos
6. **Limpiar cache** después de cambios de rol: `PermissionsService.limpiarCache(userId)`

---

## 📄 Archivos Creados

```
database/
  └── 60_security_rbac_audit.sql     # Schema completo

src/
  ├── services/
  │   ├── permissionsService.ts      # Servicio de permisos
  │   └── auditService.ts            # Servicio de auditoría
  │
  ├── contexts/
  │   └── PermissionsContext.tsx     # React Context + hooks
  │
  └── components/
      └── Seguridad/
          ├── index.ts               # Exports
          ├── SeguridadDashboard.tsx # Panel admin
          └── dialogs/
              └── AsignarRolDialog.tsx # Diálogo asignar roles
```

---

**Fecha de implementación:** Enero 2026  
**Versión:** 1.0.0
