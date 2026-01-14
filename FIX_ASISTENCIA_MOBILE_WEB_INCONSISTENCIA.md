# FIX: Inconsistencia de Asistencias entre Web y Mobile
**Fecha:** 14 de enero de 2026  
**Problema:** El módulo móvil no recuperaba asistencias existentes de la base de datos, mostrando siempre todos los scouts como "Presente" por defecto.

---

## 📋 Resumen del Problema

### Síntoma
- **Web:** CAMILA aparecía como "Ausente"
- **Mobile:** CAMILA aparecía como "Presente"
- **Causa:** El componente móvil no consultaba asistencias existentes al cargar, inicializando todos como "presente"

### Diagnóstico
1. ✅ La versión web SÍ cargaba asistencias existentes mediante `cargarAsistenciasExistentes()`
2. ❌ La versión móvil NO tenía esta funcionalidad
3. ❌ El móvil inicializaba todo como "presente" sin consultar la BD

---

## 🔧 Cambios Implementados

### 1. **Servicio: Nueva función para obtener asistencias existentes**
**Archivo:** `src/services/asistenciaService.ts`

```typescript
/**
 * 📱 Obtener asistencias existentes por fecha y rama (Mobile)
 */
static async obtenerAsistenciasPorFechaYRama(fecha: string, rama: string): Promise<Record<string, string>> {
  // Normaliza rama a UPPERCASE (MANADA, TROPA, etc.)
  // Filtra por fecha, rama y tipo_evento = 'REUNION_REGULAR'
  // Retorna mapa: { scout_id: 'presente' | 'ausente' | 'tardanza' }
}
```

**Cambios clave:**
- ✅ Normalización de rama a UPPERCASE (`rama.toUpperCase()`)
- ✅ Filtro por `tipo_evento = 'REUNION_REGULAR'` (constraint de BD)
- ✅ Estados en lowercase para compatibilidad con componente

### 2. **Componente Móvil: Cargar asistencias al cambiar fecha/rama**
**Archivo:** `src/components/Mobile/AsistenciaScreen.tsx`

**Antes:**
```typescript
// Inicializar todas las asistencias como presentes por defecto
asistenciasIniciales[scout.id] = 'presente';
```

**Después:**
```typescript
// Cargar asistencias existentes
const asistenciasExistentes = await AsistenciaService.obtenerAsistenciasPorFechaYRama(fecha, rama);

// Si hay registro existente, usarlo; si no, marcar como 'presente'
const estadoExistente = asistenciasExistentes[scout.id];
if (estadoExistente && ['presente', 'ausente', 'tardanza'].includes(estadoExistente)) {
  asistenciasIniciales[scout.id] = estadoExistente as EstadoAsistencia;
} else {
  asistenciasIniciales[scout.id] = 'presente';
}
```

**Cambios clave:**
- ✅ Dependencia en useEffect: `[rama, fecha]` (antes solo `[rama]`)
- ✅ Llama a `obtenerAsistenciasPorFechaYRama` antes de inicializar estados
- ✅ Respeta asistencias existentes o usa 'presente' por defecto para nuevos registros

### 3. **Guardado: UPSERT correcto con constraint de BD**
**Archivo:** `src/services/asistenciaService.ts`

```typescript
// Usar upsert con el constraint correcto: (scout_id, fecha, tipo_evento)
const { data, error } = await supabase
  .from('asistencias')
  .upsert(registrosFormateados, {
    onConflict: 'scout_id,fecha,tipo_evento'
  });
```

**Cambios clave:**
- ✅ Usa constraint único: `(scout_id, fecha, tipo_evento)`
- ✅ Incluye `tipo_evento: 'REUNION_REGULAR'` en todos los registros
- ✅ Estados en UPPERCASE: `PRESENTE`, `AUSENTE`, `TARDANZA`
- ✅ Rama en UPPERCASE: `MANADA`, `TROPA`, `COMUNIDAD`, `CLAN`

---

## 🗄️ Base de Datos

### Script SQL Necesario
**Archivo:** `database/add_constraint_asistencias_mobile.sql`

**Qué hace:**
1. Verifica constraint existente: `asistencias_unica_por_fecha (scout_id, fecha, tipo_evento)`
2. Agrega columna `rama VARCHAR(20)` si no existe
3. Crea índice para búsquedas mobile: `idx_asistencias_fecha_rama (fecha, rama)`

### 📝 Instrucciones de Ejecución

#### Opción 1: Supabase Dashboard (Recomendado)
1. Ir a: https://bbvbthspmemszazhiefy.supabase.co
2. SQL Editor → New Query
3. Copiar contenido de `database/add_constraint_asistencias_mobile.sql`
4. Ejecutar (Run)

#### Opción 2: CLI
```bash
# Desde la raíz del proyecto
psql -h db.bbvbthspmemszazhiefy.supabase.co \
     -p 6543 \
     -d postgres \
     -U postgres \
     -f database/add_constraint_asistencias_mobile.sql
```

### Verificación Post-Ejecución
```sql
-- Verificar columna rama
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'asistencias' AND column_name = 'rama';

-- Verificar constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'asistencias'::regclass 
  AND conname LIKE 'asistencias_unica%';

-- Verificar índice
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'asistencias' 
  AND indexname = 'idx_asistencias_fecha_rama';
```

---

## 🧪 Pruebas de Validación

### Caso de Prueba 1: Cargar Asistencias Existentes
**Pasos:**
1. Registrar asistencia en web para "Tropa" el 10/01/2026
   - CAMILA: Ausente
   - BIELKA: Presente
2. Abrir móvil
3. Seleccionar fecha: 10/01/2026
4. Seleccionar rama: Tropa

**Resultado Esperado:**
- ✅ CAMILA debe aparecer como "Ausente" (rojo)
- ✅ BIELKA debe aparecer como "Presente" (verde)

### Caso de Prueba 2: Nueva Fecha Sin Registros
**Pasos:**
1. En móvil, seleccionar fecha: 15/01/2026 (sin registros previos)
2. Seleccionar rama: Tropa

**Resultado Esperado:**
- ✅ Todos los scouts aparecen como "Presente" (comportamiento por defecto correcto)

### Caso de Prueba 3: Actualizar Asistencia Existente
**Pasos:**
1. En móvil, cargar asistencias del 10/01/2026, Tropa
2. Cambiar CAMILA de "Ausente" a "Presente"
3. Guardar
4. Recargar (cambiar rama y volver)

**Resultado Esperado:**
- ✅ CAMILA ahora aparece como "Presente"
- ✅ UPSERT funcionó correctamente

---

## 📊 Estructura de Datos

### Tabla: asistencias
```sql
CREATE TABLE asistencias (
    id UUID PRIMARY KEY,
    scout_id UUID NOT NULL,
    fecha DATE NOT NULL,
    tipo_evento VARCHAR(50) DEFAULT 'REUNION_REGULAR',
    estado_asistencia VARCHAR(20) NOT NULL, -- PRESENTE, AUSENTE, TARDANZA
    rama VARCHAR(20),                       -- MANADA, TROPA, COMUNIDAD, CLAN
    registrado_por VARCHAR(50),             -- 'mobile_app' | 'web_app'
    
    CONSTRAINT asistencias_unica_por_fecha 
        UNIQUE (scout_id, fecha, tipo_evento)
);
```

### Mapeo de Estados

| Base de Datos | Frontend (TS) | Display      |
|---------------|---------------|--------------|
| `PRESENTE`    | `'presente'`  | Verde ✅      |
| `AUSENTE`     | `'ausente'`   | Rojo ❌       |
| `TARDANZA`    | `'tardanza'`  | Amarillo ⏱️  |

### Mapeo de Ramas

| Selector Mobile | Base de Datos | Web          |
|-----------------|---------------|--------------|
| `'Manada'`      | `'MANADA'`    | `'MANADA'`   |
| `'Tropa'`       | `'TROPA'`     | `'TROPA'`    |
| `'Comunidad'`   | `'COMUNIDAD'` | `'COMUNIDAD'`|
| `'Clan'`        | `'CLAN'`      | `'CLAN'`     |

---

## ✅ Checklist de Implementación

- [x] **Frontend - Service:** Agregar `obtenerAsistenciasPorFechaYRama()`
- [x] **Frontend - Service:** Normalizar rama a UPPERCASE en queries
- [x] **Frontend - Service:** Usar constraint correcto en UPSERT
- [x] **Frontend - Component:** Agregar `fecha` como dependencia de useEffect
- [x] **Frontend - Component:** Cargar asistencias existentes antes de inicializar
- [x] **Backend - SQL:** Script para agregar columna `rama`
- [x] **Backend - SQL:** Crear índice `idx_asistencias_fecha_rama`
- [ ] **Backend - SQL:** Ejecutar script en Supabase ⚠️ **PENDIENTE**
- [ ] **Testing:** Validar Caso de Prueba 1
- [ ] **Testing:** Validar Caso de Prueba 2
- [ ] **Testing:** Validar Caso de Prueba 3

---

## 🎯 Próximos Pasos

1. **EJECUTAR** el script SQL `database/add_constraint_asistencias_mobile.sql`
2. **PROBAR** en móvil con fecha 10/01/2026 que se carguen asistencias existentes
3. **VALIDAR** que cambios en móvil actualicen correctamente registros existentes
4. **VERIFICAR** consistencia entre web y mobile

---

## 📚 Archivos Modificados

```
src/services/asistenciaService.ts
├─ obtenerAsistenciasPorFechaYRama()  [NUEVA]
└─ registrarAsistenciaMasiva()        [MODIFICADA - upsert correcto]

src/components/Mobile/AsistenciaScreen.tsx
└─ cargarScouts()                     [MODIFICADA - carga asistencias]

database/add_constraint_asistencias_mobile.sql  [NUEVO]
```

---

## 🔍 Notas Técnicas

### ¿Por qué tipo_evento = 'REUNION_REGULAR'?
- El constraint único de BD requiere `(scout_id, fecha, tipo_evento)`
- Mobile solo registra reuniones regulares (no campamentos, eventos especiales)
- Esto permite múltiples tipos de asistencia en la misma fecha si es necesario

### ¿Por qué normalizar rama a UPPERCASE?
- Consistencia con el enum de BD: `rama_enum`
- La web ya usa UPPERCASE
- Mobile usa "Title Case" solo en UI, pero debe guardar UPPERCASE

### ¿Por qué usar Record<string, string> en lugar de Map?
- TypeScript Record es más simple para serialización JSON
- Compatible con logging y debugging
- Suficiente para mapeo scout_id → estado

---

**Estado:** ✅ Código implementado | ⚠️ SQL pendiente de ejecución
