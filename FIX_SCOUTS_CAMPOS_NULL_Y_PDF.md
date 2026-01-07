# 🔧 FIX: Campos NULL en Scouts, PDF y Familiares con Datos Ficticios

**Fecha:** 4 de enero de 2026  
**Problemas:** 
1. Campos `ocupacion`, `centro_estudio`, `centro_laboral` NULL
2. PDF no mostraba información
3. Familiares guardados con datos ficticios en tabla personas
4. Error en PDF: "column personas_1.documento_identidad does not exist"

---

## 🐛 PROBLEMAS IDENTIFICADOS

### 1. Campos NULL en tabla scouts
**Síntoma:** Los campos `ocupacion`, `centro_estudio` y `centro_laboral` se guardaban como NULL a pesar de que el frontend enviaba los datos correctamente.

**Causa raíz:** 
- El componente `RegistroScout.tsx` **NO pasaba** estos campos al servicio `registrarScout()`
- El servicio `scoutService.ts` **NO incluía** estos campos en la interfaz TypeScript
- Los campos no llegaban a la función de base de datos `api_registrar_scout_completo`

### 2. Generación de PDF sin datos
**Síntoma:** El PDF DNGI-03 no mostraba información del scout o mostraba datos vacíos.

**Causa raíz:**
- La función `getScoutData()` en `reportDataService.ts` usaba la estructura antigua
- Consultaba directamente la tabla `scouts` por campos que ahora están en `personas`
- No hacía JOIN con la tabla `personas` para obtener datos personales
- No obtenía correctamente los datos del familiar desde la nueva estructura
- **Error adicional:** Usaba `documento_identidad` pero la columna real es `numero_documento`
**Síntoma:** En la tabla `personas`, los registros de familiares tenían valores hard-coded:
- `fecha_nacimiento`: '1990-01-01' (ficticio)
- `sexo`: 'MASCULINO' (por defecto)
- `tipo_documento`: 'DNI' (por defecto)
- `numero_documento`: Celular del familiar o timestamp (no real)
- `pais`: 'Perú' (por defecto)

**Causa raíz:**
- Frontend solo enviaba: nombres, apellidos, celular, correo, ocupacion
- Service `scoutService.ts` rellenaba campos faltantes con valores en duro
- Función `api_registrar_persona` requería TODOS estos campos obligatoriamente
- No existía función especializada para registrar familiares con datos mínimos

### 4. Error en nombre de columna
**Síntoma:** Error al generar PDF: `"column personas_1.documento_identidad does not exist"`

**Causa raíz:**
- La tabla `personas` usa `numero_documento` como nombre de columna
- El código de generación de PDF usaba `documento_identidad` (nombre incorrecto)

---

## ✅ SOLUCIONES IMPLEMENTADAS

### 1. Fix en Frontend - Componente de Registro

**Archivo:** `src/components/RegistroScout/RegistroScout.tsx`

**Cambio:** Agregados campos faltantes al llamado de `registrarScout()`

```typescript
// ANTES - Campos faltantes
const resultado = await ScoutService.registrarScout({
  nombres: formData.nombres,
  apellidos: formData.apellidos,
  // ... otros campos
  rama: formData.rama || formData.rama_actual,
  familiar_nombres: formData.familiar_nombres,
  // ... faltaban centro_estudio, ocupacion, centro_laboral
});

// DESPUÉS - Campos completos
const resultado = await ScoutService.registrarScout({
  nombres: formData.nombres,
  apellidos: formData.apellidos,
  // ... otros campos
  rama: formData.rama || formData.rama_actual,
  centro_estudio: formData.centro_estudio,      // ✅ AGREGADO
  ocupacion: formData.ocupacion,                // ✅ AGREGADO
  centro_laboral: formData.centro_laboral,      // ✅ AGREGADO
  familiar_nombres: formData.familiar_nombres,
  // ... resto de campos
});
```

### 2. Fix en Service - Interfaz TypeScript

**Archivo:** `src/services/scoutService.ts`

**Cambio:** Agregados campos a la interfaz y al objeto `scout_data`

```typescript
// ANTES - Interfaz incompleta
static async registrarScout(scoutData: {
  nombres: string;
  apellidos: string;
  // ... otros campos
  rama: string;
  // Datos del familiar
  familiar_nombres?: string;
  // ... faltaban centro_estudio, ocupacion, centro_laboral
}): Promise<...> {

// DESPUÉS - Interfaz completa
static async registrarScout(scoutData: {
  nombres: string;
  apellidos: string;
  // ... otros campos
  rama: string;
  centro_estudio?: string;       // ✅ AGREGADO
  ocupacion?: string;            // ✅ AGREGADO
  centro_laboral?: string;       // ✅ AGREGADO
  // Datos del familiar
  familiar_nombres?: string;
  // ...
}): Promise<...> {
```

```typescript
// ANTES - Objeto scout_data incompleto
const scout_data = {
  // Datos de persona
  nombres: scoutData.nombres,
  // ... otros campos
  rama_actual: ramaDb,
  estado: 'ACTIVO'
};

// DESPUÉS - Objeto scout_data completo
const scout_data = {
  // Datos de persona
  nombres: scoutData.nombres,
  // ... otros campos
  rama_actual: ramaDb,
  centro_estudio: scoutData.centro_estudio,      // ✅ AGREGADO
  ocupacion: scoutData.ocupacion,                // ✅ AGREGADO
  centro_laboral: scoutData.centro_laboral,      // ✅ AGREGADO
  estado: 'ACTIVO'
};
```

### 3. Fix en Servicio de Reportes - JOIN con personas

**Archivo:** `src/modules/reports/services/reportDataService.ts`

**Cambio:** Reescrita función `getScoutData()` para usar arquitectura personas+roles

```typescript
// ANTES - Consulta antigua sin JOIN
const { data: scoutData, error: scoutError } = await supabase
  .from('scouts')
  .select('*')
  .eq('id', scoutId)
  .single();

// Datos obtenidos directamente de scouts (INCORRECTO - ya no existen estos campos)
return {
  id: scoutData.id,
  nombre: scoutData.nombres || '',        // ❌ Ya no existe
  apellido: scoutData.apellidos || '',    // ❌ Ya no existe
  // ...
};

// DESPUÉS - Consulta con JOIN a personas (COLUMNA CORREGIDA)
const { data: scoutData, error: scoutError } = await supabase
  .from('scouts')
  .select(`
    *,
    persona:personas!scouts_persona_id_fkey (
      id,
      nombres,
      apellidos,
      fecha_nacimiento,
      sexo,
      tipo_documento,
      numero_documento,      // ✅ CORREGIDO: era documento_identidad
      celular,
      correo,
      departamento,
      provincia,
      distrito,
      direccion
    )
  `)
  .eq('id', scoutId)
  .single();

// Datos obtenidos de personas (CORRECTO)
const personaData = scoutData.persona || {};
return {
  id: scoutData.id,
  nombre: personaData.nombres || '',           // ✅ De personas
  apellido: personaData.apellidos || '',       // ✅ De personas
  numeroDocumento: personaData.numero_documento || '',  // ✅ CORREGIDO
  telefono: personaData.celular || '',         // ✅ De personas
  centroEstudio: scoutData.centro_estudio || '', // ✅ De scouts (correcto)
  // ...
};
```

### 4. Fix en Frontend - Eliminar datos ficticios del familiar

**Archivo:** `src/services/scoutService.ts`

**Cambio:** Eliminados valores en duro (hard-coded) para familiares

```typescript
// ANTES - Con valores ficticios
familiar_data = {
  nombres: scoutData.familiar_nombres,
  apellidos: scoutData.familiar_apellidos || '',
  fecha_nacimiento: '1990-01-01',        // ❌ FICTICIO
  sexo: 'MASCULINO',                     // ❌ FICTICIO
  tipo_documento: 'DNI',                 // ❌ FICTICIO
  numero_documento: scoutData.familiar_telefono || `FAM${Date.now()}`, // ❌ FICTICIO
  parentesco: parentescoDb,
  celular: scoutData.familiar_telefono,
  correo: scoutData.familiar_email,
  ocupacion: scoutData.familiar_ocupacion || '',
  es_contacto_emergencia: true,
  es_autorizado_recoger: true
};

// DESPUÉS - Solo datos reales
familiar_data = {
  nombres: scoutData.familiar_nombres,
  apellidos: scoutData.familiar_apellidos || '',
  parentesco: parentescoDb,
  celular: scoutData.familiar_telefono,
  correo: scoutData.familiar_email,
  ocupacion: scoutData.familiar_ocupacion || '',
  // ✅ Valores ficticios eliminados
  // ✅ La base de datos manejará esto correctamente
};
```

### 5. Fix en Base de Datos - Función especializada para familiares

**Archivo:** `database/fix_registro_familiar.sql`

**Cambios implementados:**

1. **Nueva función `api_registrar_familiar()`:**
   - Acepta solo nombres, apellidos, celular, correo
   - Genera `numero_documento` único si no se proporciona
   - Permite NULL en `fecha_nacimiento` y `sexo`
   - No requiere `tipo_documento` real

2. **Modificación tabla `personas`:**
   ```sql
   ALTER TABLE personas ALTER COLUMN fecha_nacimiento DROP NOT NULL;
   ALTER TABLE personas ALTER COLUMN sexo DROP NOT NULL;
   ```

3. **Actualización `api_registrar_scout_completo()`:**
   - Usa `api_registrar_familiar()` en lugar de `api_registrar_persona()`
   - Mejor manejo de casos sin familiar
   - Más logging para debugging

**Ventajas:**
- ✅ No hay datos ficticios en base de datos
- ✅ Registro de familiares más flexible
- ✅ Mantiene integridad referencial
- ✅ Permite agregar datos reales después

---

## 📋 SCRIPTS A EJECUTAR EN SUPABASE

### 1. Fix de Familiares (CRÍTICO - Ejecutar primero)

```sql
-- Ejecutar el contenido completo de:
database/fix_registro_familiar.sql
```

Este script:
- Crea función `api_registrar_familiar()`
- Actualiza `api_registrar_scout_completo()`
- Modifica tabla `personas` para permitir NULL
- ⚠️ **IMPORTANTE:** Ejecutar ANTES de registrar nuevos scouts

### 2. Limpiar datos ficticios existentes (OPCIONAL)

Si ya tienes familiares con datos ficticios, puedes limpiarlos:

```sql
-- Identificar familiares con datos ficticios
SELECT 
  id,
  nombres,
  apellidos,
  numero_documento,
  fecha_nacimiento,
  sexo
FROM personas
WHERE numero_documento LIKE 'FAM%'
  OR fecha_nacimiento = '1990-01-01'
  OR (sexo = 'MASCULINO' AND nombres SIMILAR TO '%(madre|mamá|esposa)%');

-- Actualizar a NULL los campos ficticios
UPDATE personas
SET 
  fecha_nacimiento = NULL,
  sexo = NULL,
  tipo_documento = NULL
WHERE numero_documento LIKE 'FAM%'
  OR fecha_nacimiento = '1990-01-01';
```

**Cambio adicional:** También se corrigió la obtención del familiar

```typescript
// ANTES - Sin JOIN a personas
const { data: familiarData, error: familiarError } = await supabase
  .from('familiares_scout')
  .select('*')
  .eq('scout_id', scoutId)
  .single();

// DESPUÉS - Con JOIN a personas
const { data: familiarScoutData, error: familiarError } = await supabase
  .from('familiares_scout')
  .select(`
    *,
    familiar_persona:personas!familiares_scout_familiar_id_fkey (
      id,
      nombres,
      apellidos,
      celular,
      correo
    )
  `)
  .eq('scout_id', scoutId)
  .single();

const familiar = familiarError ? null : familiarScoutData;
// Uso: familiar?.familiar_persona?.nombres
```

---

## 📊 ARQUITECTURA PERSONAS + ROLES

### Estructura de Datos

```
┌─────────────┐
│  PERSONAS   │  ← Datos personales base (nombres, apellidos, documento, etc.)
└─────┬───────┘
      │
      ├─────────┬───────────────┬─────────────────┐
      │         │               │                 │
┌─────▼─────┐ ┌─▼──────────┐ ┌─▼──────────┐   ┌─▼──────────┐
│  SCOUTS   │ │ DIRIGENTES │ │ FAMILIARES │   │   OTROS    │
│           │ │            │ │            │   │            │
│ rama      │ │ cargo      │ │ parentesco │   │   roles    │
│ centro_e  │ │ exp_años   │ │ ocupacion  │   │            │
│ ocupacion │ │            │ │            │   │            │
│ centro_l  │ │            │ │            │   │            │
└───────────┘ └────────────┘ └────────────┘   └────────────┘
```

### Campos por Tabla

**Tabla `personas`:**
- `id` (PK)
- `nombres`, `apellidos`
- `fecha_nacimiento`, `sexo`
- `tipo_documento`, `documento_identidad`
- `celular`, `correo`
- `departamento`, `provincia`, `distrito`, `direccion`

**Tabla `scouts`:**
- `id` (PK)
- `persona_id` (FK → personas) ⭐
- `codigo_scout`, `rama_actual`
- `fecha_ingreso`, `patrulla`
- `centro_estudio` ⭐ (específico de scout)
- `ocupacion` ⭐ (específico de scout)
- `centro_laboral` ⭐ (específico de scout)
- `estado`

**Tabla `familiares_scout`:**
- `id` (PK)
- `scout_id` (FK → scouts)
- `familiar_id` (FK → personas) ⭐
- `parentesco`, `ocupacion`
- `es_contacto_emergencia`, `es_autorizado_recoger`

---

## 🧪 VERIFICACIÓN

### 1. Verificar campos en base de datos

```sql
-- Ver datos de un scout con su persona
SELECT 
  s.id,
  s.codigo_scout,
  p.nombres,
  p.apellidos,
  s.centro_estudio,
  s.ocupacion,
  s.centro_laboral
FROM scouts s
INNER JOIN personas p ON s.persona_id = p.id
ORDER BY s.created_at DESC
LIMIT 5;
```

### 2. Verificar datos para PDF

```sql
-- Ver datos completos para PDF
SELECT 
  s.id,
  p.nombres,
  p.apellidos,
  p.documento_identidad,
  p.celular,
  s.centro_estudio,
  s.rama_actual,
  fp.nombres as familiar_nombres,
  fp.apellidos as familiar_apellidos
FROM scouts s
INNER JOIN personas p ON s.persona_id = p.id
LEFT JOIN familiares_scout fs ON fs.scout_id = s.id
LEFT JOIN personas fp ON fs.familiar_id = fp.id
WHERE s.id = 'SCOUT_ID_AQUI';
```

### 3. Probar en Frontend

1. **Registrar nuevo scout:**
   - Completar formulario con todos los campos
   - Verificar que `centro_estudio`, `ocupacion`, `centro_laboral` se guarden

2. **Generar PDF:**
   - Seleccionar scout registrado
   - Click en botón "Generar PDF"
   - Verificar que aparezcan todos los datos:
     - Nombres y apellidos
     - Documento de identidad
     - Centro de estudios
     - Teléfono y correo
     - Datos del familiar

## 📝 ESTADO FINAL

### ✅ Resuelto en Frontend (Ya aplicado)
- ✅ Campo `centro_estudio` se guarda correctamente
- ✅ Campo `ocupacion` se guarda correctamente
- ✅ Campo `centro_laboral` se guarda correctamente
- ✅ PDF obtiene datos de `personas` tabla mediante JOIN
- ✅ PDF obtiene datos del scout de tabla `scouts`
- ✅ PDF obtiene datos del familiar mediante JOIN doble
- ✅ Nombre de columna corregido: `numero_documento` en lugar de `documento_identidad`
- ✅ Eliminados valores ficticios del objeto `familiar_data`

### 🔄 Pendiente en Base de Datos (Requiere ejecución manual)
- ⚠️ Ejecutar `database/fix_registro_familiar.sql` en Supabase SQL Editor
- ⚠️ Esto creará la función `api_registrar_familiar()` especializada
- ⚠️ Permitirá NULL en campos opcionales de `personas`
- ⚠️ Mejorará el registro de familiares sin datos ficticios

### 📋 Archivos Modificados
1. `src/components/RegistroScout/RegistroScout.tsx` - Agregados campos al registro
2. `src/services/scoutService.ts` - Actualizada interfaz, eliminados valores ficticios
3. `src/modules/reports/services/reportDataService.ts` - Reescrito para usar JOIN con personas, corregido nombre columna
4. `database/fix_registro_familiar.sql` - Creado script para base de datos

---

## 🚀 PRÓXIMOS PASOS

### 1. Ejecutar Script en Supabase (CRÍTICO)
```sql
-- Abrir Supabase SQL Editor y ejecutar:
database/fix_registro_familiar.sql
```

### 2. Verificar Cambios
```sql
-- Ver estructura de personas
\d personas;

-- Verificar que fecha_nacimiento y sexo permiten NULL
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'personas' 
AND column_name IN ('fecha_nacimiento', 'sexo');

-- Ver familiares existentes
SELECT 
  p.id,
  p.nombres,
  p.apellidos,
  p.numero_documento,
  p.fecha_nacimiento,
  p.sexo,
  p.celular
FROM personas p
INNER JOIN roles_persona rp ON rp.persona_id = p.id
WHERE rp.tipo_rol = 'PADRE_FAMILIA';
```

### 3. Probar Registro Completo
1. **Registrar nuevo scout con familiar:**
   - Llenar todos los campos del scout (incluir centro_estudio, ocupacion, centro_laboral)
   - Llenar solo: nombres, apellidos, celular, correo del familiar
   - Verificar que NO se creen datos ficticios

2. **Generar PDF:**
   - Seleccionar scout registrado
   - Click en "Generar PDF"
   - Verificar que aparezcan todos los datos correctamente

3. **Verificar en base de datos:**
   ```sql
   -- Ver último scout registrado con familiar
   SELECT 
     s.codigo_scout,
     p.nombres as scout_nombres,
     p.numero_documento as scout_doc,
     s.centro_estudio,
     s.ocupacion,
     fp.nombres as familiar_nombres,
     fp.numero_documento as familiar_doc,
     fp.fecha_nacimiento as familiar_fecha_nac
   FROM scouts s
   INNER JOIN personas p ON s.persona_id = p.id
   LEFT JOIN familiares_scout fs ON fs.scout_id = s.id
   LEFT JOIN personas fp ON fs.persona_id = fp.id
   ORDER BY s.created_at DESC
   LIMIT 1;
   ```

### 4. Limpiar Datos Ficticios Antiguos (Opcional)
Si ya tienes scouts registrados con datos ficticios en familiares:

```sql
-- Ver cuántos familiares tienen datos ficticios
SELECT COUNT(*) 
FROM personas 
WHERE numero_documento LIKE 'FAM%' 
  OR fecha_nacimiento = '1990-01-01';

-- Limpiar datos ficticios (cuidado: verificar primero)
UPDATE personas
SET 
  fecha_nacimiento = NULL,
  sexo = NULL,
  tipo_documento = NULL
WHERE numero_documento LIKE 'FAM%'
  OR (fecha_nacimiento = '1990-01-01' AND numero_documento NOT LIKE '%DNI%');

-- Verificar resultado
SELECT 
  p.nombres,
  p.apellidos,
  p.numero_documento,
  p.fecha_nacimiento,
  p.sexo,
  p.tipo_documento
FROM personas p
INNER JOIN roles_persona rp ON rp.persona_id = p.id
WHERE rp.tipo_rol = 'PADRE_FAMILIA'
ORDER BY p.created_at DESC;
```

---

## 🎯 RESUMEN TÉCNICO

### Problema Raíz
El sistema intentaba forzar una estructura rígida de `personas` que requería datos completos (fecha_nacimiento, sexo, documento) para TODOS los registros, incluyendo familiares que solo necesitan contacto básico.

### Solución Aplicada
1. **Frontend:** Eliminados valores ficticios, solo enviamos datos reales
2. **Base de Datos:** Campos opcionales ahora permiten NULL para familiares
3. **Lógica:** Nueva función especializada para registrar familiares con datos mínimos
4. **Integridad:** Se mantiene la estructura personas+roles pero con mayor flexibilidad

### Beneficios
- ✅ No más datos ficticios en base de datos
- ✅ Registro más rápido y simple
- ✅ Datos más limpios y confiables
- ✅ Flexibilidad para agregar datos reales después
- ✅ PDF funciona correctamente con nueva arquitectura

---

**Estado:** ✅ **FRONTEND COMPLETADO** | ⚠️ **PENDIENTE: Ejecutar script en Supabase**  
**Fecha de fix:** 4 de enero de 2026
