# Políticas y Lineamientos de Desarrollo
## Sistema de Gestión Scout - Grupo Scout Lima 12

---

## 📐 Principios de UX/UI

### Reglas Generales de Diseño de Interfaz

#### 1. **Jerarquía Visual Clara**
- **Acción principal destacada:** Botón CTA (Call-To-Action) con color primario, tamaño mayor
- **Acciones secundarias:** Botones outline o texto
- **Información de contexto:** Texto gris, tamaño menor
- **Título prominente:** pero no compitiendo con acciones principales

#### 2. **Estados Vacíos Significativos**
❌ **EVITAR:**
```
"No hay registros"
```

✅ **IMPLEMENTAR:**
```tsx
<div className="text-center py-12">
  <IllustrationIcon className="mx-auto h-24 w-24 text-gray-400 mb-4" />
  <h3 className="text-lg font-medium mb-2">No hay inscripciones aún</h3>
  <p className="text-gray-500 mb-4">Comienza inscribiendo scouts para el período actual</p>
  <button className="btn-primary">Inscribir Scouts</button>
</div>
```

**Componentes de un buen estado vacío:**
- Ilustración/Icono relevante
- Título descriptivo
- Mensaje explicativo amigable
- Call-to-Action claro

#### 3. **KPIs y Métricas Visuales**

Siempre mostrar métricas clave en la parte superior de módulos de gestión:

```tsx
<div className="grid grid-cols-4 gap-4 mb-6">
  <MetricCard 
    title="Total Inscritos" 
    value={156} 
    icon={Users}
    color="blue"
  />
  <MetricCard 
    title="Pagados" 
    value={140} 
    icon={CheckCircle}
    color="green"
  />
  <MetricCard 
    title="Pendientes" 
    value={16} 
    icon={Clock}
    color="yellow"
  />
  <MetricCard 
    title="Recaudado" 
    value="S/ 18,720" 
    icon={DollarSign}
    color="emerald"
  />
</div>
```

#### 4. **Flujos de Trabajo Optimizados**

##### Operaciones Masivas vs Individuales

**Regla:** Si hay >10 elementos que requieren la misma acción, implementar opción masiva.

**Ejemplo: Inscripciones Anuales**

```tsx
// Botón principal: Acción masiva
<button className="btn-primary">
  Inscribir Todos los Activos ({totalActivos})
</button>

// Tabla con selección múltiple
<Table>
  <thead>
    <tr>
      <th><input type="checkbox" onChange={selectAll} /></th>
      <th>Código</th>
      <th>Nombre</th>
      <th>Rama</th>
      <th>Monto</th>
    </tr>
  </thead>
  <tbody>
    {scouts.map(scout => (
      <tr key={scout.id}>
        <td><input type="checkbox" checked={selected.includes(scout.id)} /></td>
        <td>{scout.codigo}</td>
        <td>{scout.nombre}</td>
        <td>{scout.rama}</td>
        <td>${scout.monto}</td>
      </tr>
    ))}
  </tbody>
</Table>

// Botón para seleccionados
<button className="btn-secondary" disabled={selected.length === 0}>
  Inscribir Seleccionados ({selected.length})
</button>
```

#### 5. **Filtros y Búsqueda Integrados**

No separar búsqueda de resultados. Mantener contexto visual.

```tsx
<div className="bg-white rounded-lg shadow">
  {/* Barra de filtros sticky */}
  <div className="sticky top-0 bg-white border-b p-4">
    <div className="flex gap-4">
      <select className="w-32">
        <option>Año 2026</option>
      </select>
      <select className="w-32">
        <option>Todas las ramas</option>
      </select>
      <select className="w-32">
        <option>Todos los estados</option>
      </select>
      <input 
        type="search" 
        placeholder="Buscar por nombre..." 
        className="flex-1"
      />
    </div>
  </div>
  
  {/* Resultados inmediatos debajo */}
  <div className="p-4">
    {/* Tabla o lista */}
  </div>
</div>
```

#### 6. **Feedback Visual Inmediato**

- **Carga:** Skeleton screens o spinners contextual
- **Éxito:** Toast verde con ✅ (auto-dismiss 3s)
- **Error:** Toast rojo con ❌ (persiste hasta cerrar)
- **Advertencia:** Modal de confirmación para acciones destructivas

```tsx
// Toast de éxito
<div className="bg-green-50 border-l-4 border-green-500 p-4">
  <div className="flex items-center">
    <CheckCircle className="text-green-500 mr-2" />
    <span className="text-green-800">
      {count} inscripciones registradas exitosamente
    </span>
  </div>
</div>

// Confirmación destructiva
const handleDelete = () => {
  if (window.confirm(`¿Eliminar inscripción de ${scout.nombre}?`)) {
    // Proceder
  }
}
```

#### 7. **Diseño Responsive y Accesible**

- Mobile-first: Usar `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Labels claros para screen readers
- Contraste mínimo 4.5:1 para texto
- Estados hover/focus visibles
- Touch targets mínimo 44x44px

#### 8. **Patrones de Navegación**

**Breadcrumbs para contexto:**
```tsx
<nav className="text-sm mb-4">
  <a href="/dashboard">Dashboard</a> / 
  <a href="/inscripciones">Inscripciones</a> / 
  <span className="text-gray-600">Año 2026</span>
</nav>
```

**Tabs para vistas relacionadas:**
```tsx
<div className="border-b mb-6">
  <nav className="flex space-x-8">
    <button className="border-b-2 border-blue-500 py-2">Inscritos</button>
    <button className="py-2 text-gray-500">Pendientes</button>
    <button className="py-2 text-gray-500">Historial</button>
  </nav>
</div>
```

### Checklist de Validación UX

Antes de considerar completa una interfaz, verificar:

- [ ] ¿Hay un estado vacío significativo?
- [ ] ¿La acción principal es obvia?
- [ ] ¿Se muestran métricas/KPIs relevantes?
- [ ] ¿Hay filtros accesibles si hay >20 items?
- [ ] ¿Existe opción masiva si hay operaciones repetitivas?
- [ ] ¿El feedback visual es claro (éxito/error/carga)?
- [ ] ¿Los estados hover/active son visibles?
- [ ] ¿Es responsive en mobile?
- [ ] ¿Los errores son descriptivos y accionables?
- [ ] ¿Se puede deshacer acciones destructivas o hay confirmación?

### Ejemplos de Mejoras Comunes

#### Antes vs Después: Módulo de Inscripciones

**❌ Antes:**
- Solo un buscador aislado
- Mensaje "No hay registros" genérico
- Sin estadísticas visibles
- Inscripción uno por uno obligatoria

**✅ Después:**
- Dashboard con KPIs (total, pagados, pendientes, recaudado)
- Estado vacío con ilustración y CTA
- Botón "Inscribir Todos los Activos"
- Tabla con checkboxes para selección múltiple
- Filtros inline (período, rama, estado)
- Badges de color para estados (🟢 Pagado, 🟡 Pendiente)

---

## 🧭 Patrón: Formularios Multi-Pasos (Stepper)

### Principio UX: "One Thing at a Time"

Dividir formularios complejos en pasos manejables mejora la tasa de completado y reduce la carga cognitiva.

### Stack Técnico
- **Gestión de Formulario:** React Hook Form
- **Validación:** Zod (Esquemas por paso y esquema global)
- **UI:** Shadcn/ui + Tailwind CSS

### Reglas de Implementación

#### 1. **Diferencia Creación vs Edición**

| Aspecto | Modo Creación | Modo Edición |
|---------|---------------|--------------|
| **Navegación** | Secuencial (Siguiente/Anterior) | Libre (clic en stepper) |
| **Stepper** | No clickeable | ✅ Clickeable |
| **Botón principal** | "Siguiente" → "Crear" | "Guardar Cambios" siempre visible |
| **Validación** | Por paso antes de avanzar | Solo campos requeridos al guardar |

#### 2. **Estructura de Componentes**

```tsx
// Estado centralizado con React Hook Form
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: { /* ... */ }
});

const [paso, setPaso] = useState(1);
const modoEdicion = !!itemEditar;

// Navegación directa (solo edición)
const irAPaso = (numeroPaso: number) => {
  if (modoEdicion && numeroPaso >= 1 && numeroPaso <= TOTAL_PASOS) {
    setPaso(numeroPaso);
  }
};

// Validación inteligente al guardar
const guardar = async () => {
  const camposRequeridos = ['campo1', 'campo2', 'campo3'];
  const isValid = await form.trigger(camposRequeridos);
  
  if (!isValid) {
    // Navegar al paso con el primer error
    const errors = form.formState.errors;
    if (errors.campo1) setPaso(1);
    else if (errors.campo2) setPaso(2);
    // ...
    return;
  }
  
  // Proceder con guardado
  const data = form.getValues();
  await guardarEnBackend(data);
};
```

#### 3. **Stepper Interactivo**

```tsx
{/* Stepper - clickeable en modo edición */}
<div className="flex items-center justify-between">
  {PASOS.map((p, index) => {
    const isClickable = modoEdicion;
    
    return (
      <div 
        className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : ''}`}
        onClick={() => isClickable && irAPaso(p.id)}
      >
        <div className={`w-10 h-10 rounded-full ... ${
          isClickable ? 'hover:scale-105 hover:shadow-md transition-transform' : ''
        }`}>
          {/* Icono del paso */}
        </div>
        <span>{p.title}</span>
      </div>
    );
  })}
</div>
```

#### 4. **Footer Dinámico**

```tsx
<DialogFooter>
  {modoEdicion ? (
    // Modo edición: Guardar siempre visible
    <Button onClick={guardar} disabled={guardando}>
      {guardando ? 'Guardando...' : 'Guardar Cambios'}
    </Button>
  ) : (
    // Modo creación: navegación secuencial
    paso < TOTAL_PASOS ? (
      <Button onClick={siguientePaso}>
        Siguiente <ChevronRight />
      </Button>
    ) : (
      <Button onClick={guardar} disabled={guardando}>
        {guardando ? 'Creando...' : 'Crear Item'}
      </Button>
    )
  )}
</DialogFooter>
```

#### 5. **Prevenir Submit Accidental**

```tsx
<form 
  onSubmit={(e) => e.preventDefault()} 
  onKeyDown={(e) => {
    if (e.key === 'Enter') e.preventDefault();
  }}
>
  {/* Contenido del formulario */}
</form>

// Botones siempre type="button", nunca type="submit"
<Button type="button" onClick={guardar}>Guardar</Button>
```

### Checklist para Formularios Multi-Pasos

- [ ] ¿El stepper es clickeable en modo edición?
- [ ] ¿El botón "Guardar" está siempre visible en modo edición?
- [ ] ¿Se validan solo campos requeridos al guardar?
- [ ] ¿Se navega automáticamente al paso con error?
- [ ] ¿Se previene submit con Enter?
- [ ] ¿Todos los botones son `type="button"`?
- [ ] ¿El estado del form se mantiene al navegar entre pasos?

### Ejemplo de Implementación

**Archivo:** `src/components/ActividadesExterior/dialogs/NuevaActividadDialog.tsx`

Este componente implementa el patrón completo con:
- 4 pasos (Básicos, Fechas, Logística, Equipamiento)
- Stepper clickeable en modo edición
- Botón "Guardar Cambios" persistente
- Validación inteligente con navegación a paso con error

---

## � Patrón: Diálogos de Detalle con Modo Edición

### Principio UX: Paridad Creación/Edición

Todas las opciones disponibles al **crear** un registro deben estar disponibles al **editar**.

### Reglas de Implementación

#### 1. **Paridad de Campos**

| Al Crear | Al Editar |
|----------|-----------|
| Campos básicos | ✅ Campos básicos |
| Checkbox de opciones especiales | ✅ Checkbox de opciones especiales |
| Subida de archivos | ✅ Gestión de archivos (ver + eliminar + agregar) |
| Campos condicionales | ✅ Campos condicionales |

#### 2. **Gestión de Archivos/Evidencias**

```tsx
// Estados necesarios
const [nuevasEvidencias, setNuevasEvidencias] = useState<File[]>([]);
const [evidenciasAEliminar, setEvidenciasAEliminar] = useState<string[]>([]);

// UI para evidencias existentes
{detalleCompleto?.evidencias?.map((ev) => (
  <div className={evidenciasAEliminar.includes(ev.id) ? 'opacity-50 line-through' : ''}>
    <span>{ev.nombre_archivo}</span>
    {evidenciasAEliminar.includes(ev.id) ? (
      <button onClick={() => desmarcarParaEliminar(ev.id)}>Restaurar</button>
    ) : (
      <button onClick={() => marcarParaEliminar(ev.id)}><Trash2 /></button>
    )}
  </div>
))}

// UI para subir nuevas
<input type="file" multiple onChange={handleFileChange} />

// Al guardar
for (const id of evidenciasAEliminar) {
  await Service.eliminarEvidencia(id);
}
for (const file of nuevasEvidencias) {
  await Service.subirEvidencia(file, registroId);
}
```

#### 3. **Campos Condicionales (ej: Préstamo en Egresos)**

```tsx
// Mostrar checkbox solo si aplica (ej: solo para EGRESOS)
{!esIngreso && (
  <div className="border rounded-lg p-4 bg-yellow-50/50">
    <div className="flex items-center gap-3">
      <Checkbox
        checked={formData.tiene_prestamo}
        onCheckedChange={(checked) => setFormData({...formData, tiene_prestamo: !!checked})}
      />
      <label>Este gasto fue financiado con dinero prestado</label>
    </div>
    
    {formData.tiene_prestamo && (
      <div className="grid grid-cols-2 gap-4 mt-4">
        {/* Campos adicionales del préstamo */}
      </div>
    )}
  </div>
)}
```

### Checklist para Diálogos de Detalle/Edición

- [ ] ¿Todos los campos de creación están en edición?
- [ ] ¿Los checkboxes especiales (préstamo, etc.) aparecen en edición?
- [ ] ¿Se pueden eliminar archivos existentes?
- [ ] ¿Se pueden agregar nuevos archivos?
- [ ] ¿Los archivos marcados para eliminar se muestran diferente (tachados)?
- [ ] ¿Hay opción de "Restaurar" para desmarcar eliminación?
- [ ] ¿Los campos condicionales funcionan igual que en creación?

### Ejemplo de Implementación

**Archivo:** `src/components/Finanzas/dialogs/DetalleTransaccionDialog.tsx`

Este componente implementa:
- Modo vista y modo edición toggle
- Checkbox de préstamo (solo visible para egresos)
- Gestión completa de evidencias:
  - Ver existentes con preview
  - Marcar para eliminar (con opción restaurar)
  - Agregar nuevas con preview
- Campos de préstamo condicionales

---

## �📋 Procedimiento: Agregar Nuevos Campos al Formulario de Scouts

Cuando se necesite agregar un nuevo campo al formulario de registro/edición de scouts, seguir estos pasos en orden:

### 1. Frontend - Interface TypeScript
**Archivo:** `src/components/RegistroScout/RegistroScout.tsx`

- Agregar el campo a la interface `FormularioScout`:
  ```typescript
  interface FormularioScout {
    // ... campos existentes
    nuevo_campo: string;  // Ajustar tipo según necesidad
  }
  ```

### 2. Frontend - Estado Inicial
**Archivo:** `src/components/RegistroScout/RegistroScout.tsx`

- Agregar valor inicial en `formData`:
  ```typescript
  const [formData, setFormData] = useState<FormularioScout>({
    // ... valores existentes
    nuevo_campo: '',
  });
  ```

### 3. Frontend - Función de Limpieza
**Archivo:** `src/components/RegistroScout/RegistroScout.tsx`

- Agregar en `limpiarFormulario()`:
  ```typescript
  const limpiarFormulario = () => {
    setFormData({
      // ... otros campos
      nuevo_campo: '',
    });
  };
  ```

### 4. Frontend - Carga de Datos
**Archivo:** `src/components/RegistroScout/RegistroScout.tsx`

- Agregar en `cargarDatosScout()`:
  ```typescript
  setFormData({
    // ... otros campos
    nuevo_campo: scout.nuevo_campo || '',
  });
  ```

### 5. Frontend - Validación (Opcional)
**Archivo:** `src/components/RegistroScout/RegistroScout.tsx`

- Si el campo es obligatorio, agregar en `validarFormulario()`:
  ```typescript
  if (!formData.nuevo_campo.trim()) {
    setError('El nuevo campo es obligatorio');
    return false;
  }
  ```

### 6. Frontend - Input en JSX
**Archivo:** `src/components/RegistroScout/RegistroScout.tsx`

- Agregar input en la sección correspondiente:
  ```tsx
  <div className="md:col-span-1">
    <label className="block text-sm font-medium mb-1">
      Nuevo Campo {/* Agregar * si es requerido */}
    </label>
    <input
      type="text"
      value={formData.nuevo_campo}
      onChange={(e) => setFormData({...formData, nuevo_campo: e.target.value})}
      className="w-full px-4 py-2 border rounded-lg"
      required={false}  // true si es obligatorio
    />
  </div>
  ```

### 7. Frontend - ScoutService Types
**Archivo:** `src/services/scoutService.ts`

- Agregar en el tipo de `updateScout`:
  ```typescript
  static async updateScout(id: string, updates: {
    // ... campos existentes
    nuevo_campo?: string;
  })
  ```

### 8. Frontend - ScoutService scout_data
**Archivo:** `src/services/scoutService.ts`

- Agregar en el objeto `scout_data`:
  ```typescript
  const scout_data = {
    // ... campos existentes
    nuevo_campo: updates.nuevo_campo,
  };
  ```

### 9. Frontend - Llamada a updateScout
**Archivo:** `src/components/RegistroScout/RegistroScout.tsx`

- Incluir en el objeto pasado a `ScoutService.updateScout()`:
  ```typescript
  await ScoutService.updateScout(scoutSeleccionado.id, {
    // ... campos existentes
    nuevo_campo: formData.nuevo_campo,
  });
  ```

### 10. Base de Datos - Migration (ALTER TABLE)
**Crear archivo:** `database/add_[nombre_campo].sql`

```sql
-- Determinar si el campo va en tabla 'personas' o 'scouts'
ALTER TABLE personas  -- o scouts según corresponda
ADD COLUMN IF NOT EXISTS nuevo_campo VARCHAR(255);  -- Ajustar tipo

COMMENT ON COLUMN personas.nuevo_campo IS 'Descripción del campo';

-- Verificación
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'personas' AND column_name = 'nuevo_campo';
```

### 11. Base de Datos - api_registrar_scout_completo
**Archivo:** `database/update_api_registrar_scout_completo.sql`

- Agregar en INSERT de personas o scouts según corresponda:
  ```sql
  INSERT INTO personas (
      -- ... columnas existentes
      nuevo_campo
  ) VALUES (
      -- ... valores existentes
      NULLIF(TRIM(p_datos->>'nuevo_campo'), '')  -- Para campos opcionales
  );
  ```

### 12. Base de Datos - api_actualizar_scout_completo
**Archivo:** `database/fix_api_actualizar_scout_completo_final.sql`

- Agregar en UPDATE de personas o scouts:
  ```sql
  UPDATE personas SET
      -- ... campos existentes
      nuevo_campo = NULLIF(TRIM(p_scout_data->>'nuevo_campo'), ''),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = v_persona_scout_id;
  ```

### 13. Base de Datos - api_obtener_scout_completo
**Archivo:** `database/fix_api_obtener_scout_completo_con_todos_campos.sql`

- Agregar en json_build_object:
  ```sql
  SELECT json_build_object(
      -- ... campos existentes
      'nuevo_campo', p.nuevo_campo,  -- o s.nuevo_campo si está en scouts
      -- ...
  ) INTO v_scout_data
  ```

### 14. Ejecución de Scripts SQL
Ejecutar en este orden:
1. Migration (ALTER TABLE)
2. `update_api_registrar_scout_completo.sql`
3. `fix_api_actualizar_scout_completo_final.sql`
4. `fix_api_obtener_scout_completo_con_todos_campos.sql`

### 15. Reiniciar Servidor Frontend
```bash
pkill -f vite && npm run dev
```

---

## 🔑 Reglas Importantes

### Campos Opcionales
- **Frontend:** No incluir en validación, no agregar asterisco (*) en label
- **Backend:** Usar `NULLIF(TRIM())` para convertir strings vacíos en NULL
- **SQL:** Permitir NULL en la columna

### Campos Requeridos
- **Frontend:** Agregar validación, asterisco en label, `required` en input
- **Backend:** Validar antes de INSERT
- **SQL:** `NOT NULL` en la columna

### Manejo de Fechas
- **Backend:** Usar patrón CASE para evitar errores con strings vacíos:
  ```sql
  fecha_campo = CASE 
      WHEN p_datos->>'fecha_campo' IS NOT NULL AND TRIM(p_datos->>'fecha_campo') != '' 
      THEN (p_datos->>'fecha_campo')::DATE 
      ELSE fecha_campo 
  END
  ```

### Ubicación de Campos
- **Datos personales del scout → tabla `personas`**
  - nombres, apellidos, fecha_nacimiento, fecha_ingreso, documento, contacto, dirección, etc.
- **Datos específicos de scout → tabla `scouts`**
  - rama_actual, centro_estudio, codigo_asociado, es_dirigente, estado, etc.

### Preservación de Valores en UPDATE
- **Campos que no deben cambiar automáticamente:** Usar CASE o preservar valor existente
- **Campos que pueden actualizarse:** Usar COALESCE o NULLIF según necesidad

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 18.3.1 + TypeScript + Vite 5.4.21
- **Backend:** Supabase PostgreSQL con RPC Functions
- **Validación:** Cliente (TypeScript) + Servidor (PL/pgSQL)
- **Gestión de Estado:** React Hooks (useState)

---

## 📝 Convenciones de Código

### TypeScript
- Interfaces en PascalCase: `FormularioScout`
- Variables en camelCase: `formData`, `scoutSeleccionado`
- Constantes en UPPER_SNAKE_CASE (si aplica)

### SQL
- Tablas en minúsculas: `personas`, `scouts`
- Funciones con prefijo `api_`: `api_registrar_scout_completo`
- Parámetros con prefijo `p_`: `p_scout_data`
- Variables con prefijo `v_`: `v_persona_id`

### Archivos SQL
- Descriptivos: `add_[campo].sql`, `fix_[problema].sql`
- Fecha en comentarios: `-- Fecha: 7 de enero de 2026`
- Descripción clara del propósito

---

## 🗄️ Lineamientos para Scripts SQL en Supabase

### Regla Principal: NO usar tipos ENUM de PostgreSQL

Los tipos ENUM de PostgreSQL causan problemas de compatibilidad en Supabase, especialmente:
- Errores `column "nombre_columna" does not exist` al usar ENUMs en funciones
- Problemas con `json_agg()`, `json_build_object()` y casting implícito
- Conflictos al comparar ENUMs con strings en cláusulas WHERE

#### ❌ EVITAR: Tipos ENUM

```sql
-- NO HACER ESTO
CREATE TYPE modulo_sistema AS ENUM ('dashboard', 'scouts', 'finanzas');
CREATE TYPE accion_tipo AS ENUM ('crear', 'leer', 'editar', 'eliminar');

CREATE TABLE permisos (
    id UUID PRIMARY KEY,
    modulo modulo_sistema NOT NULL,  -- ❌ Causa errores
    accion accion_tipo NOT NULL      -- ❌ Causa errores
);

-- Esto FALLARÁ en funciones:
SELECT json_agg(json_build_object('modulo', p.modulo)) FROM permisos p;
-- Error: column "modulo" does not exist
```

#### ✅ USAR: VARCHAR con CHECK Constraints

```sql
-- HACER ESTO EN SU LUGAR
CREATE TABLE permisos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(20) NOT NULL,
    CONSTRAINT chk_modulo CHECK (modulo IN (
        'dashboard', 'scouts', 'dirigentes', 'finanzas', 'reportes'
    )),
    CONSTRAINT chk_accion CHECK (accion IN (
        'crear', 'leer', 'editar', 'eliminar', 'exportar'
    ))
);

-- Esto FUNCIONA correctamente:
SELECT json_agg(json_build_object('modulo', p.modulo)) FROM permisos p;
```

### Estructura Recomendada de Scripts SQL

```sql
-- ================================================================
-- 🔐 NOMBRE DEL MÓDULO
-- Sistema de Gestión Scout - Grupo Scout Lima 12
-- Fecha: [fecha actual]
-- ================================================================
-- Descripción breve de qué hace este script
-- ================================================================

-- ================================================================
-- INSTRUCCIONES DE INSTALACIÓN
-- ================================================================
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Copiar y pegar este script completo
-- 3. Ejecutar (Ctrl+Enter o Cmd+Enter)
-- 4. Verificar resultado al final
-- ================================================================

-- ================================================================
-- PARTE 1: LIMPIEZA PREVIA (Incluir siempre)
-- ================================================================
DROP TABLE IF EXISTS mi_tabla CASCADE;
DROP TYPE IF EXISTS mi_enum CASCADE;  -- Limpiar ENUMs viejos

-- ================================================================
-- PARTE 2: CREACIÓN DE TABLAS
-- ================================================================
CREATE TABLE IF NOT EXISTS mi_tabla (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Usar VARCHAR en lugar de ENUM
    estado VARCHAR(20) NOT NULL,
    CONSTRAINT chk_estado CHECK (estado IN ('activo', 'inactivo', 'pendiente'))
);

-- ================================================================
-- PARTE N: FUNCIONES (Evitar ENUMs en parámetros)
-- ================================================================
CREATE OR REPLACE FUNCTION mi_funcion(
    p_estado VARCHAR(20)  -- ✅ VARCHAR, no ENUM
)
RETURNS JSON AS $$
BEGIN
    -- Lógica aquí
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- VERIFICACIÓN FINAL (Incluir siempre)
-- ================================================================
SELECT '✅ Script ejecutado correctamente' as resultado;
SELECT 'Registros creados: ' || COUNT(*)::TEXT FROM mi_tabla;
```

### Checklist para Scripts SQL

Antes de ejecutar un script en Supabase:

- [ ] ¿Usa VARCHAR con CHECK en lugar de ENUM?
- [ ] ¿Incluye DROP TABLE/TYPE IF EXISTS para limpieza?
- [ ] ¿Las funciones usan VARCHAR en parámetros, no ENUMs?
- [ ] ¿Incluye instrucciones de instalación al inicio?
- [ ] ¿Tiene verificación al final para confirmar éxito?
- [ ] ¿Usa `ON CONFLICT DO NOTHING` para INSERTs idempotentes?
- [ ] ¿Los índices usan `IF NOT EXISTS`?

### Migración de ENUM a VARCHAR

Si ya tienes tablas con ENUMs y necesitas migrar:

```sql
-- 1. Crear nueva columna VARCHAR
ALTER TABLE mi_tabla ADD COLUMN estado_nuevo VARCHAR(20);

-- 2. Copiar datos convertidos
UPDATE mi_tabla SET estado_nuevo = estado::TEXT;

-- 3. Eliminar columna vieja
ALTER TABLE mi_tabla DROP COLUMN estado;

-- 4. Renombrar nueva columna
ALTER TABLE mi_tabla RENAME COLUMN estado_nuevo TO estado;

-- 5. Agregar constraint
ALTER TABLE mi_tabla ADD CONSTRAINT chk_estado 
    CHECK (estado IN ('activo', 'inactivo', 'pendiente'));

-- 6. Eliminar el ENUM
DROP TYPE IF EXISTS estado_enum CASCADE;
```

---

## ⚠️ Errores Comunes a Evitar

1. **Olvidar incluir campo en `updateScout` del frontend**
   - Síntoma: Campo no se actualiza aunque esté en BD
   
2. **No usar NULLIF para campos opcionales**
   - Síntoma: Error "duplicate key" o constraints violados

3. **Cast directo de fecha sin validar string vacío**
   - Síntoma: `invalid input syntax for type date: ""`

4. **No reiniciar servidor después de cambios en TypeScript**
   - Síntoma: Cambios no se reflejan en navegador

5. **DEFAULT CURRENT_DATE en columnas que deben ser editables**
   - Síntoma: Fecha siempre vuelve a hoy al consultar

6. **Olvidar DROP DEFAULT después de agregar columna con DEFAULT**
   - Síntoma: Valor por defecto sobrescribe valores explícitos

7. **Inconsistencia de tildes entre capas (Frontend/Backend/BD)**
   - Síntoma: Datos no coinciden, búsquedas fallan, matching incorrecto
   - Causa: "Otra condición" en BD pero "Otra condicion" en Frontend

---

## 🔤 Convención de Tildes y Caracteres Especiales

### Regla Principal: Consistencia Total

Todos los textos con tildes deben ser **idénticos** en las tres capas:

| Capa | Ubicación | Ejemplo |
|------|-----------|---------|
| **Base de Datos** | Catálogos, seed data | `'Otra condición no mencionada en la presente lista'` |
| **Backend** | Funciones SQL, validaciones | `'Otra condición no mencionada en la presente lista'` |
| **Frontend** | Labels, constantes, comparaciones | `'Otra condición no mencionada en la presente lista'` |

### Checklist de Verificación

Antes de agregar texto con caracteres especiales:

- [ ] ¿El texto es idéntico en BD (catálogo/seed)?
- [ ] ¿El texto es idéntico en funciones SQL?
- [ ] ¿El texto es idéntico en constantes del Frontend?
- [ ] ¿Las comparaciones usan el texto exacto o `.includes()` con substring seguro?

### Estrategia de Matching Seguro

Si hay riesgo de inconsistencia, usar matching flexible:

```typescript
// ✅ SEGURO: Buscar substring sin tilde problemática
const otraCondicion = data.condiciones.find(c => 
  c.nombre?.toLowerCase().includes('otra condici')  // 'condici' cubre con/sin tilde
);

// ✅ ALTERNATIVA: Normalizar quitando tildes para comparar
const normalizar = (texto: string) => (texto || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .trim();
```

### Ejemplos de Textos con Tildes (Referencia)

| Texto en BD | Substring seguro para matching |
|-------------|-------------------------------|
| `Otra condición no mencionada...` | `'otra condici'` |
| `Hipertensión Arterial` | `'hipertension'` o `'hipertensi'` |
| `Lesión traumática` | `'lesion'` o `'traumatic'` |
| `Psicológico o psiquiátrico` | `'psicolog'` o `'psiquiat'` |

---

## 📚 Referencias Rápidas

### Archivos Clave
- Formulario principal: `src/components/RegistroScout/RegistroScout.tsx`
- Servicio API: `src/services/scoutService.ts`
- Función registro: `database/update_api_registrar_scout_completo.sql`
- Función actualización: `database/fix_api_actualizar_scout_completo_final.sql`
- Función obtener: `database/fix_api_obtener_scout_completo_con_todos_campos.sql`

### Comandos Útiles
```bash
# Reiniciar servidor
pkill -f vite && npm run dev

# Liberar puerto 3000
lsof -ti:3000 | xargs kill -9

# Ejecutar script SQL (ejemplo)
psql -U postgres -h [host] -p 6543 -d postgres -f database/script.sql
```

## Traking de Desarrollo de la web con GitHub Copilot
----  Se requiere saber el tiempo del desarrollo de la web  ----Ademas, cuantos prompts se enviaron a GitHub Copilot para completar el desarrollo de la web. Hora de inicio de cada prompt y hora de finalizacion de cada prompt.  ----  Se requiere saber el tiempo total que se utilizo GitHub Copilot para completar el desarrollo de la web.  ----  Se requiere saber cuantos archivos se crearon, cuantos archivos se modificaron y cuantos archivos se eliminaron durante el desarrollo de la web.  ----  Se requiere un resumen detallado de las funcionalidades implementadas en la web. Para saber
cuando tiempo demora la web, en horas, minutos y segundos.  ----  Se requiere un resumen detallado de las funcionalidades implementadas en la web. Para saber.Incluso los errores que se encontraron y como se solucionaron.  ----  Se requiere un resumen detallado de las funcionalidades implementadas en la web. Para saber cuales fueron los archivos creados, modificados y eliminados durante el desarrollo de la web.

---

## 🔄 Procedimiento Completo: Agregar Campo a Entidades (v2 - React Hook Form + Zod)

Este procedimiento aplica al sistema de formularios v2 que usa **React Hook Form + Zod**, particularmente para entidades anidadas como `familiares`.

### Principio Fundamental

Un campo necesita estar presente en **5 lugares del frontend** y **2 funciones SQL**:

| Capa | Archivo | Qué hacer |
|------|---------|-----------|
| **1. Schema** | `schemas/scoutSchema.ts` | Agregar campo al schema Zod |
| **2. UI** | `components/.../DatosFamiliares.tsx` | Agregar input/control |
| **3. Types** | `services/scoutService.ts` | Agregar al tipo TypeScript |
| **4. Submit** | `ScoutFormWizard.tsx` → `onSubmit` | Incluir en objeto enviado |
| **5. Load** | `ScoutFormWizard.tsx` → `mapScoutToFormData` | **CRÍTICO:** Mapear al cargar |
| **6. SQL Save** | `api_actualizar_scout` | Incluir en UPDATE/INSERT |
| **7. SQL Get** | `api_obtener_scout` | Incluir en json_build_object |

### Paso a Paso Detallado

#### 1. Schema Zod
**Archivo:** `src/schemas/scoutSchema.ts`

```typescript
// En el schema de la entidad (ej: familiarSchema)
export const familiarSchema = z.object({
  // ... campos existentes
  numero_documento: z.string().optional(),  // Nuevo campo
});
```

#### 2. Componente UI
**Archivo:** `src/components/RegistroScout/v2/steps/DatosFamiliares.tsx`

```tsx
<FormField
  control={control}
  name={`familiares.${index}.numero_documento`}
  render={({ field }) => (
    <FormItem>
      <FormLabel>Número de Documento</FormLabel>
      <FormControl>
        <Input placeholder="DNI" {...field} />
      </FormControl>
    </FormItem>
  )}
/>
```

#### 3. Types en Service
**Archivo:** `src/services/scoutService.ts`

```typescript
familiares?: Array<{
  // ... campos existentes
  numero_documento?: string;  // Nuevo campo
}>;
```

#### 4. Submit (Enviar al Backend)
**Archivo:** `src/components/RegistroScout/v2/ScoutFormWizard.tsx`

En la función `onSubmit`, asegurar que el campo se incluye:

```typescript
familiares: data.familiares?.map(f => ({
  // ... campos existentes
  numero_documento: f.numero_documento || '',  // Incluir nuevo campo
})) || []
```

#### 5. Load (Mapear al Cargar) ⚠️ CRÍTICO
**Archivo:** `src/components/RegistroScout/v2/ScoutFormWizard.tsx`

En la función `mapScoutToFormData`:

```typescript
const familiaresFromScout = scoutAny.familiares?.map((f: any) => ({
  // ... campos existentes
  numero_documento: f.numero_documento || '',  // ⚠️ SIN ESTO NO SE MUESTRA AL EDITAR
})) || [];
```

> **⚠️ Este paso es el más olvidado.** Sin él, el campo se guarda pero NO se muestra cuando se edita el registro.

#### 6. SQL - Función de Guardar
**Archivo:** `database/fix_api_actualizar_scout.sql` o similar

```sql
-- En el UPDATE de la tabla correspondiente (ej: personas para familiares)
UPDATE personas SET
    -- ... campos existentes
    numero_documento = NULLIF(TRIM(v_familiar->>'numero_documento'), ''),
    updated_at = CURRENT_TIMESTAMP
WHERE id = v_persona_id;
```

#### 7. SQL - Función de Obtener
**Archivo:** `database/fix_api_obtener_scout_personas.sql`

```sql
SELECT json_agg(
    json_build_object(
        -- ... campos existentes
        'numero_documento', pf.numero_documento,  -- Agregar aquí
        -- ...
    )
) INTO v_familiar_data
FROM familiares_scout fs
INNER JOIN personas pf ON fs.persona_id = pf.id;
```

### Checklist de Validación

Antes de dar por terminado un nuevo campo:

- [ ] ✅ Schema Zod actualizado
- [ ] ✅ Input en componente UI
- [ ] ✅ Tipo en scoutService.ts
- [ ] ✅ Incluido en onSubmit
- [ ] ✅ **Mapeado en mapScoutToFormData** (más olvidado)
- [ ] ✅ SQL de guardar actualizado y ejecutado
- [ ] ✅ SQL de obtener actualizado y ejecutado
- [ ] 🧪 Probar: Crear registro con el campo
- [ ] 🧪 Probar: Editar registro y verificar que el campo se muestra
- [ ] 🧪 Probar: Editar, modificar el campo y guardar

### Errores Comunes

| Error | Síntoma | Solución |
|-------|---------|----------|
| Falta en `mapScoutToFormData` | Campo se guarda pero no aparece al editar | Agregar mapeo del campo |
| Falta en SQL de obtener | Campo vacío siempre al cargar | Agregar a json_build_object |
| Falta en SQL de guardar | Campo no persiste | Agregar a UPDATE/INSERT |
| Columna no existe en BD | Error SQL "column X does not exist" | Ejecutar ALTER TABLE primero |
| Nombre de columna incorrecto | Error SQL | Verificar nombre exacto en BD (ej: `profesion` vs `ocupacion`) |

### Ejemplo Real: Campo `numero_documento` en Familiares

**Archivos modificados:**
1. `src/schemas/scoutSchema.ts` - familiarSchema
2. `src/components/RegistroScout/v2/steps/DatosFamiliares.tsx` - Input
3. `src/services/scoutService.ts` - Tipo familiares
4. `src/components/RegistroScout/v2/ScoutFormWizard.tsx` - onSubmit + mapScoutToFormData
5. `database/53_fix_api_actualizar_scout_familiares.sql` - UPDATE personas
6. `database/fix_api_obtener_scout_personas.sql` - json_build_object

**Tiempo estimado:** 15-30 minutos si se siguen todos los pasos.