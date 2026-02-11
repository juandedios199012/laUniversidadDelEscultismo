# Implementación de Permisos Granulares - Actividades al Aire Libre

## 📋 Resumen

Se implementó un sistema de permisos granulares para el módulo de Actividades al Aire Libre (Aire Libre), permitiendo control de acceso a nivel de:

1. **Pestañas (Tabs)**: Cada una de las 12 pestañas puede ser habilitada/deshabilitada por rol
2. **Acciones Específicas**: 9 acciones críticas como inscribir participantes, gestionar pagos, etc.

---

## 🔐 Tipos de Permisos

### Pestañas Accesibles (12)

| ID | Nombre | Descripción |
|----|--------|-------------|
| `tab_resumen` | 📋 Resumen | Vista general de la actividad |
| `tab_programa` | 📅 Programa | Horario y bloques de actividades |
| `tab_participantes` | 👥 Participantes | Lista de inscritos |
| `tab_patrullas` | 🏕️ Patrullas | Gestión de patrullas |
| `tab_subcampos` | 🚩 Sub Campos | Distribución de sub campos |
| `tab_presupuesto` | 💰 Presupuesto | Dashboard financiero |
| `tab_compras` | 🛒 Compras | Registro de gastos |
| `tab_menu` | 🍽️ Menú | Planificación de comidas |
| `tab_logistica` | 📦 Logística | Equipamiento y transporte |
| `tab_inventario` | 🎒 Inventario | Items propios y prestados |
| `tab_puntajes` | 🏆 Puntajes | Competencia entre patrullas |
| `tab_reportes` | 📊 Reportes | Documentos y exportación |

### Acciones Específicas (9)

| ID | Nombre | Descripción |
|----|--------|-------------|
| `inscribir_participantes` | Inscribir Participantes | Agregar scouts a la actividad |
| `gestionar_pagos` | Gestionar Pagos | Registrar pagos de participantes |
| `gestionar_autorizaciones` | Gestionar Autorizaciones | Cambiar estado de autorizaciones |
| `registrar_compras` | Registrar Compras | Crear registros de gastos |
| `registrar_puntajes` | Registrar Puntajes | Agregar puntos a patrullas |
| `gestionar_inventario` | Gestionar Inventario | CRUD de items inventario |
| `transferir_inventario` | Transferir Inventario | Pasar items a otra persona |
| `devolver_inventario` | Devolver Inventario | Marcar items como devueltos |
| `registrar_incidentes` | Registrar Incidentes | Reportar daños o bajas |

---

## 👥 Permisos por Rol (Defaults)

### Super Admin / Admin
- ✅ Todas las pestañas
- ✅ Todas las acciones

### Jefe de Grupo
- ✅ Todas las pestañas
- ✅ Todas las acciones

### Coordinador de Rama
- ✅ Todas las pestañas excepto Reportes
- ✅ Todas las acciones

### Dirigente
- 📋 Resumen, 📅 Programa, 👥 Participantes, 🏕️ Patrullas, 🚩 Sub Campos
- 🍽️ Menú, 🏆 Puntajes, 🎒 Inventario
- ✅ inscribir_participantes, gestionar_inventario, transferir_inventario
- ✅ devolver_inventario, registrar_puntajes

### Dirigente de Apoyo
- 📋 Resumen, 👥 Participantes, 🏕️ Patrullas, 🏆 Puntajes
- ✅ registrar_puntajes

### Tesorero
- 📋 Resumen, 💰 Presupuesto, 🛒 Compras, 👥 Participantes, 📊 Reportes
- ✅ gestionar_pagos, registrar_compras

### Secretario
- 📋 Resumen, 👥 Participantes, 📊 Reportes
- ✅ gestionar_autorizaciones

### Padre de Familia
- 📋 Resumen (solo lectura)

---

## 📁 Archivos Modificados

### 1. `src/services/permissionsService.ts`
- Agregado tipo `SubAccionAireLibre`
- Agregado `AIRE_LIBRE_TABS_CONFIG` (configuración de pestañas)
- Agregado `AIRE_LIBRE_ACCIONES_CONFIG` (configuración de acciones)
- Agregado `PERMISOS_AIRE_LIBRE_POR_ROL` (defaults por rol)
- Actualizado `UsuarioSeguridad` interface con `permisos_aire_libre?`

### 2. `src/contexts/PermissionsContext.tsx`
- Agregado `tienePermisoAireLibre(subAccion)` - método para verificar permisos
- Agregado `permisosAireLibre` - array de permisos del usuario actual
- Lógica: permisos explícitos → defaults por rol → admin fallback

### 3. `src/components/ActividadesExterior/ActividadDetalle.tsx`
- Pestañas condicionadas por `tienePermisoAireLibre('tab_xxx')`
- Botón "Inscribir Scouts" condicionado por `tienePermisoAireLibre('inscribir_participantes')`
- Botón "Pagar" condicionado por `tienePermisoAireLibre('gestionar_pagos')`
- Badge de autorización condicionado por `tienePermisoAireLibre('gestionar_autorizaciones')`
- Botón "Agregar Puntaje" condicionado por `tienePermisoAireLibre('registrar_puntajes')`
- Botón "Registrar Compra" condicionado por `tienePermisoAireLibre('registrar_compras')`

### 4. `src/components/ActividadesExterior/components/InventarioTab.tsx`
- Botón "Devolver" condicionado por `tienePermisoAireLibre('devolver_inventario')`
- Botón "Transferir" condicionado por `tienePermisoAireLibre('transferir_inventario')`
- Botón "Registrar Incidente" condicionado por `tienePermisoAireLibre('registrar_incidentes')`

### 5. `src/components/Seguridad/SeguridadDashboard.tsx`
- Nueva sección en TabConfiguracion para visualizar/editar permisos de Aire Libre
- UI interactiva con checkboxes por pestaña y acción
- Selector de rol para ver configuración por defecto

---

## 🔧 Uso en Código

```tsx
import { usePermissions } from '@/contexts/PermissionsContext';

function MiComponente() {
  const { tienePermisoAireLibre } = usePermissions();

  // Verificar acceso a pestaña
  if (!tienePermisoAireLibre('tab_inventario')) {
    return <div>No tienes acceso a esta sección</div>;
  }

  // Verificar acción específica
  return (
    <div>
      {tienePermisoAireLibre('transferir_inventario') && (
        <Button onClick={handleTransferir}>Transferir</Button>
      )}
    </div>
  );
}
```

---

## 📝 Notas de Implementación

1. **Prioridad de Permisos**: 
   - Primero se verifican permisos explícitos (`seguridad.permisos_aire_libre`)
   - Si no hay, se usan defaults por rol (`PERMISOS_AIRE_LIBRE_POR_ROL`)
   - Super admin siempre tiene acceso total

2. **Sin Pestañas Visibles**: Si un usuario no tiene permisos para ninguna pestaña, se mostrará el tabs vacío. Considerar agregar mensaje de acceso denegado.

3. **Base de Datos**: Los permisos por ahora son basados en el rol (defaults en código). Para persistir permisos personalizados por usuario, se requiere:
   - Tabla `permisos_aire_libre_usuario`
   - Función RPC para cargar/guardar
   - Actualizar `PermissionsService.obtenerSeguridadUsuario`

---

## 🚀 Próximos Pasos (Opcionales)

1. [ ] Crear tabla en BD para permisos personalizados
2. [ ] Agregar UI para asignar permisos a usuarios individuales
3. [ ] Agregar auditoría de cambios de permisos
4. [ ] Implementar herencia de permisos (rol base + excepciones)
5. [ ] Notificación cuando se intenta acceder sin permiso

---

*Fecha de implementación: $(date)*
