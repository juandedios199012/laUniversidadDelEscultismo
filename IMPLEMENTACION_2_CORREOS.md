# Implementación: 2 Campos de Correo Diferenciados

## 📋 Resumen

Se implementan **2 campos de correo** con usos específicos según el tipo de persona:

1. **`correo`** - Correo principal (todos: scouts, dirigentes, familiares)
2. **`correo_secundario`** - Correo alternativo (**SOLO** familiares)
3. **`correo_institucional`** - Correo institucional/educativo (**SOLO** scouts y dirigentes)

También se agrega el campo **`anio_estudios`** para scouts.

## 🎯 Diferencias por Tipo de Persona

| Campo | Scout/Dirigente | Familiar |
|-------|----------------|----------|
| `correo` | ✅ Sí | ✅ Sí |
| `correo_secundario` | ❌ No | ✅ Sí |
| `correo_institucional` | ✅ Sí | ❌ No |
| Total campos de correo | **2** | **2** |
| `anio_estudios` | ✅ Sí (solo scout) | ❌ No |

## 🗄️ Scripts SQL a Ejecutar

### 1. add_correo_institucional_anio_estudios.sql
**Ubicación**: `database/add_correo_institucional_anio_estudios.sql`

**Cambios**:
- `ALTER TABLE personas ADD COLUMN correo_institucional VARCHAR(255)` (AGREGA, no renombra)
- `ALTER TABLE scouts ADD COLUMN anio_estudios VARCHAR(50)`
- Mantiene `correo_secundario` intacto

**Estado**: ⚠️ PENDIENTE DE EJECUTAR EN SUPABASE

### 2. fix_api_obtener_scout_completo_familiares.sql
**Ubicación**: `database/fix_api_obtener_scout_completo_familiares.sql`

**Cambios**:
- Actualiza `api_obtener_scout_completo`
- Scout: retorna `correo`, `correo_secundario`, `correo_institucional`, `anio_estudios`
- Familiar: retorna `correo`, `correo_secundario` (NO correo_institucional)

**Estado**: ⚠️ ACTUALIZADO - PENDIENTE DE EJECUTAR

### 3. fix_api_crud_familiares_enums.sql
**Ubicación**: `database/fix_api_crud_familiares_enums.sql`

**Cambios**:
- Actualiza `api_registrar_familiar` y `api_actualizar_familiar`
- Solo maneja `correo` y `correo_secundario` (NO correo_institucional)

**Estado**: ⚠️ ACTUALIZADO - PENDIENTE DE EJECUTAR

## 📝 Cambios en Código Frontend

### Interfaces TypeScript

**src/types/index.ts - Scout**:
```typescript
interface Scout {
  correo: string;
  correo_institucional?: string;  // ← SOLO para scout
  anio_estudios?: string;
  // NO tiene correo_secundario
}
```

**src/types/index.ts - Familiar**:
```typescript
interface Familiar {
  correo: string;
  correo_secundario?: string;  // ← SOLO para familiar
  // NO tiene correo_institucional
}
```

### UI del Formulario

**Scout (RegistroScout.tsx)**:
- ✅ Correo Electrónico Principal
- ✅ Correo Electrónico Institucional
- ❌ NO tiene Correo Secundario
- ✅ Año de Estudios

**Familiar (FamiliarModal.tsx)**:
- ✅ Correo
- ✅ Correo Secundario
- ❌ NO tiene Correo Institucional

## 🔧 Archivos Modificados

### Base de Datos (3 archivos)
- ✅ `database/add_correo_institucional_anio_estudios.sql` (NUEVO)
- ✅ `database/fix_api_obtener_scout_completo_familiares.sql` (ACTUALIZADO)
- ✅ `database/fix_api_crud_familiares_enums.sql` (ACTUALIZADO)

### Interfaces TypeScript (2 archivos)
- ✅ `src/types/index.ts`
- ✅ `src/lib/supabase.ts`

### Componentes (2 archivos)
- ✅ `src/components/RegistroScout/RegistroScout.tsx` - 3 campos de correo para scout
- ✅ `src/components/RegistroScout/FamiliarModal.tsx` - 2 campos de correo para familiar

### Servicios (1 archivo)
- ✅ `src/services/scoutService.ts`

**Total**: 8 archivos modificados (frontend), 3 archivos SQL

## 📋 Orden de Ejecución

### Paso 1: Base de Datos (CRÍTICO)
```sql
-- Ejecutar en Supabase SQL Editor en este orden:

-- 1. Agregar nuevas columnas
\i database/add_correo_institucional_anio_estudios.sql

-- 2. Actualizar función obtener scout
\i database/fix_api_obtener_scout_completo_familiares.sql

-- 3. Actualizar funciones CRUD de familiares
\i database/fix_api_crud_familiares_enums.sql
```

### Paso 2: Verificación
```sql
-- Verificar que las 3 columnas de correo existan
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'personas' 
AND column_name LIKE '%correo%'
ORDER BY column_name;

-- Debe mostrar:
-- correo
-- correo_institucional  
-- correo_secundario

-- Verificar anio_estudios
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'scouts' 
AND column_name = 'anio_estudios';
```

## 🧪 Testing

### 1. Registro Nuevo Scout
- ✅ Debe mostrar 2 campos de correo (principal + institucional)
- ❌ NO debe mostrar "Correo Secundario"
- ✅ Campo "Año de Estudios" debe aparecer
- ✅ Todos los campos deben guardarse correctamente

### 2. Edición de Scout
- ✅ Debe cargar `correo` y `correo_institucional`
- ❌ NO debe cargar `correo_secundario`
- ✅ Debe cargar `anio_estudios` si existe
- ✅ Actualización debe persistir todos los valores

### 3. Registro de Familiar
- ✅ Debe mostrar 2 campos de correo (principal + secundario)
- ❌ NO debe aparecer "Correo Institucional"
- ✅ Datos deben guardarse correctamente

### 4. Edición de Familiar
- ✅ Debe cargar `correo` y `correo_secundario`
- ❌ NO debe intentar cargar `correo_institucional`
- ✅ Actualización debe funcionar sin errores

## 💾 Estructura de Datos

### Tabla `personas`
```sql
CREATE TABLE personas (
  id UUID PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  correo VARCHAR(255),              -- ✅ Para todos
  correo_secundario VARCHAR(255),   -- ✅ Para todos
  correo_institucional VARCHAR(255), -- ✅ Solo scouts/dirigentes
  -- ... otros campos
);
```

### Tabla `scouts`
```sql
CREATE TABLE scouts (
  id UUID PRIMARY KEY,
  persona_id UUID REFERENCES personas(id),
  anio_estudios VARCHAR(50),  -- ✅ Nuevo campo
  -- ... otros campos
);
```

## 🎯 Uso en PDF

El PDF (DNGI-03) usa los siguientes campos:

**Para Scout**:
- Correo principal → `correo`
- Correo institucional → `correo_institucional`
- Año de estudios → `anio_estudios`

**Para Familiares**:
- CORREO ELECTRÓNICO 1 → `correo`
- CORREO ELECTRÓNICO 2 → `correo_secundario`

## ⚠️Separación clara**: 
   - Scout: `correo` + `correo_institucional`
   - Familiar: `correo` + `correo_secundario`

2. **Validación**: Todos los campos de correo son opcionales

3. **Familiar NO tiene correo_institucional**: 
   - Frontend no muestra el campo
   - Backend no lo procesa para familiares
   - SQL no lo inserta/actualiza para familiares

4. **Scout NO tiene correo_secundario**:
   - Frontend no muestra el campo
   - Backend no lo procesa para scouts
   - Usa `correo_institucional` en su lugar
   - Todos son opcionales
   - Útil para separar correo personal, alternativo e institucional

## ✅ Checklist Final

- [x] Script SQL para agregar columnas
- [x] Actualizar función api_obtener_scout_completo
- [x] Actualizar funciones CRUD de familiares
- [x] Interfaces TypeScript actualizadas
- [x] Formulario de scout con 3 correos
- [x] Formulario de familiar con 2 correos
- [x] Servicios actualizados
- [ ] Scripts SQL ejecutados en Supabase
- [ ] Testing de registro scout
- [ ] Testing de edición scout
- [ ] Testing de registro familiar
- [ ] Testing de edición familiar

---

**Fecha**: 4 de enero de 2026
**Implementado por**: GitHub Copilot (Claude Sonnet 4.5)
**Objetivo**: 3 campos de correo diferenciados por tipo de persona
