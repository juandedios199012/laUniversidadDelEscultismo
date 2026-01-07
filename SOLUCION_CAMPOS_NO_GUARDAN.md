# Solución Completa: Campos No Guardan en Base de Datos

**Fecha**: 5 de enero de 2026  
**Problema**: Los campos correo_institucional, correo_secundario, celular_secundario y anio_estudios no se estaban guardando ni mostrando correctamente.

## 📋 Problemas Identificados

### 1. **anio_estudios NO se guardaba**
- ❌ La función `api_registrar_scout_completo` NO incluía el campo en el INSERT INTO scouts
- ❌ La función `api_actualizar_scout_completo` NO incluía el campo en el UPDATE de scouts
- ✅ El campo sí existía en la tabla scouts
- ✅ El formulario sí lo enviaba

### 2. **correo_institucional NO se guardaba**
- ❌ La función `api_actualizar_scout_completo` actualizaba `correo_secundario` en lugar de `correo_institucional` para scouts
- ✅ Las columnas existen en personas
- ✅ El formulario sí lo enviaba

### 3. **celular_secundario NO se veía en UI**
- ❌ Faltaba el campo "Celular 2" en la sección "Datos de Contacto"
- ✅ El campo existía en formData
- ✅ Se enviaba correctamente al backend

### 4. **anio_estudios NO cargaba al editar**
- ✅ La función `api_obtener_scout_completo` ya lo incluía
- ✅ El formulario ya lo esperaba
- El problema era que nunca se guardaba inicialmente

## 🔧 Soluciones Implementadas

### Paso 1: Actualizar `api_registrar_scout_completo`

**Archivo**: `database/fix_api_registrar_scout_completo_anio_estudios.sql`

**Cambios**:
```sql
-- ANTES (líneas 39-57):
INSERT INTO scouts (
    id,
    persona_id,
    codigo_scout,
    fecha_ingreso,
    rama_actual,
    centro_estudio,
    ocupacion,
    centro_laboral,
    estado
)

-- DESPUÉS:
INSERT INTO scouts (
    id,
    persona_id,
    codigo_scout,
    fecha_ingreso,
    rama_actual,
    centro_estudio,
    anio_estudios,  -- ✅ AGREGADO
    ocupacion,
    centro_laboral,
    estado
)
VALUES (
    ...
    NULLIF(TRIM(p_scout_data->>'anio_estudios'), ''),  -- ✅ VALOR
    ...
)
```

### Paso 2: Actualizar `api_actualizar_scout_completo`

**Archivo**: `database/fix_api_actualizar_scout_completo_final.sql`

**Cambios**:

#### En UPDATE de personas (líneas 36-63):
```sql
-- ANTES:
correo_secundario = COALESCE(p_scout_data->>'correo_secundario', correo_secundario),

-- DESPUÉS:
-- ✅ CORRECCIÓN: Scouts usan correo_institucional, NO correo_secundario
correo_institucional = COALESCE(p_scout_data->>'correo_institucional', correo_institucional),
```

#### En UPDATE de scouts (líneas 67-75):
```sql
-- ANTES:
UPDATE scouts SET
    rama_actual = COALESCE((p_scout_data->>'rama_actual')::rama_enum, rama_actual),
    centro_estudio = COALESCE(p_scout_data->>'centro_estudio', centro_estudio),
    ocupacion = COALESCE(p_scout_data->>'ocupacion', ocupacion),
    ...

-- DESPUÉS:
UPDATE scouts SET
    rama_actual = COALESCE((p_scout_data->>'rama_actual')::rama_enum, rama_actual),
    centro_estudio = COALESCE(p_scout_data->>'centro_estudio', centro_estudio),
    anio_estudios = COALESCE(p_scout_data->>'anio_estudios', anio_estudios),  -- ✅ AGREGADO
    ocupacion = COALESCE(p_scout_data->>'ocupacion', ocupacion),
    ...
```

### Paso 3: Agregar Celular 2 en UI

**Archivo**: `src/components/RegistroScout/RegistroScout.tsx`

**Cambios en "Datos de Contacto"** (líneas 994-1040):

```tsx
// ANTES: Solo tenía Celular Principal y Teléfono Fijo

// DESPUÉS: Agregado campo Celular 2
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Celular 2
  </label>
  <input
    type="tel"
    value={formData.celular_secundario}
    onChange={(e) => handleInputChange('celular_secundario', e.target.value)}
    placeholder="Número de celular secundario"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
</div>
```

También se corrigió el label:
- ❌ "Correo Electrónico Secundario" 
- ✅ "Correo Electrónico Institucional"

## 📝 Instrucciones de Ejecución

### 1. Ejecutar scripts SQL en Supabase

En **SQL Editor de Supabase**, ejecutar en este orden:

```sql
-- Script 1: Actualizar función de registro
-- Ejecutar: database/fix_api_registrar_scout_completo_anio_estudios.sql
```

```sql
-- Script 2: Actualizar función de actualización
-- Ejecutar: database/fix_api_actualizar_scout_completo_final.sql
```

### 2. Verificar en Supabase

Después de ejecutar los scripts, verificar:

```sql
-- Verificar función de registro
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'api_registrar_scout_completo';

-- Verificar función de actualización
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'api_actualizar_scout_completo';
```

### 3. Rebuild del Frontend

Los cambios en el frontend (UI) ya están aplicados. Solo necesitas:

```bash
# No es necesario reinstalar, solo reload de VS Code
# O recargar el navegador si el servidor está corriendo
```

## ✅ Validación de la Solución

### Prueba de Registro de Nuevo Scout

1. Ir a "Registro Scout"
2. Llenar formulario con:
   - Celular 1: 987654321
   - **Celular 2: 912345678** (debe aparecer en UI)
   - Correo: scout@ejemplo.com
   - **Correo Institucional: scout@colegio.edu.pe** (debe aparecer)
   - Centro de Estudio: Colegio San José
   - **Año de Estudios: 3ro Secundaria** (debe aparecer)
3. Guardar

### Verificar en Base de Datos

```sql
-- Ver datos del scout recién creado
SELECT 
    p.nombres,
    p.apellidos,
    p.celular,
    p.celular_secundario,  -- ✅ Debe tener valor
    p.correo,
    p.correo_institucional,  -- ✅ Debe tener valor
    s.centro_estudio,
    s.anio_estudios  -- ✅ Debe tener valor
FROM scouts s
JOIN personas p ON s.persona_id = p.id
ORDER BY s.created_at DESC
LIMIT 1;
```

### Prueba de Edición de Scout

1. Editar un scout existente
2. Verificar que se carguen todos los campos:
   - ✅ Celular 2 visible y editable
   - ✅ Correo Institucional visible y editable
   - ✅ Año de Estudios visible y editable
3. Modificar valores y guardar
4. Verificar que los cambios se guarden en la base de datos

## 🎯 Resumen de Archivos Modificados

### Scripts SQL Nuevos
1. ✅ `database/fix_api_registrar_scout_completo_anio_estudios.sql`
2. ✅ `database/fix_api_actualizar_scout_completo_final.sql`

### Frontend Actualizado
1. ✅ `src/components/RegistroScout/RegistroScout.tsx` (agregado Celular 2, corregido label)

## 🔍 Diferencias Clave

### Arquitectura de Emails (IMPORTANTE)

| Entidad | Campo 1 | Campo 2 |
|---------|---------|---------|
| **Scout** | `correo` | `correo_institucional` |
| **Familiar** | `correo` | `correo_secundario` |

**NO confundir**: 
- ❌ Scout con `correo_secundario` 
- ✅ Scout con `correo_institucional`

### Campos de la Tabla `scouts`

```sql
-- Campos relevantes en scouts:
- centro_estudio VARCHAR(200)
- anio_estudios VARCHAR(50)  -- ✅ Ahora se guarda correctamente
- ocupacion VARCHAR(100)
- centro_laboral VARCHAR(200)
```

### Campos de la Tabla `personas`

```sql
-- Campos relevantes en personas:
- celular VARCHAR(20)
- celular_secundario VARCHAR(20)  -- ✅ Ahora se usa correctamente
- telefono VARCHAR(20)
- correo VARCHAR(100)
- correo_secundario VARCHAR(100)    -- Solo para FAMILIARES
- correo_institucional VARCHAR(100) -- Solo para SCOUTS
```

## 🚀 Estado Final

- ✅ **anio_estudios**: Se guarda en CREATE y UPDATE
- ✅ **correo_institucional**: Se guarda correctamente para scouts
- ✅ **celular_secundario**: Visible en UI y se guarda
- ✅ **Función de registro**: Actualizada con anio_estudios
- ✅ **Función de actualización**: Actualizada con anio_estudios y correo_institucional
- ✅ **UI**: Muestra todos los campos necesarios con labels correctos
- ✅ **Cache**: Invalidación incluida en ambas funciones

## 📌 Notas Importantes

1. **Los scripts SQL deben ejecutarse AMBOS** - uno corrige CREATE, otro corrige UPDATE
2. **El frontend ya está corregido** - solo necesita reload del navegador
3. **Las columnas ya existen** - solo se corrigieron las funciones que no las usaban
4. **Cache invalidation** - ambas funciones invalidan cache del dashboard

## 🔗 Archivos Relacionados

- Script de creación de columnas: `database/add_columnas_correo_personas.sql` (ya ejecutado)
- Script de api_registrar_persona: `database/fix_api_registrar_persona.sql` (ya ejecutado)
- Service layer: `src/services/scoutService.ts` (no requiere cambios)
- Tipos TypeScript: `src/types/index.ts` (ya correctos)
