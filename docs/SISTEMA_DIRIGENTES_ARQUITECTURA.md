# Sistema de Gestión de Dirigentes - Arquitectura

## 📋 Resumen

Sistema completo para gestionar dirigentes scout con las siguientes características:
- ✅ Un dirigente pertenece a UNA sola rama a la vez
- ✅ Historial completo de cambios de rama
- ✅ Relación dirigente-scouts con historial
- ✅ Consultas optimizadas para reportes

---

## 🗄️ Estructura de Base de Datos

### Tabla: `dirigentes`

Almacena información principal de cada dirigente.

```sql
dirigentes
├── id (PK)
├── scout_id (FK → scouts.id) - Relación con scout
├── cargo (ENUM) - JEFE_GRUPO, JEFE_RAMA, DIRIGENTE, etc
├── numero_credencial - Credencial única
├── fecha_inicio_dirigente
├── fecha_fin_dirigente - NULL si está activo
├── especialidades (TEXT[])
├── certificaciones (TEXT[])
├── estado (ACTIVO/INACTIVO)
```

**Reglas:**
- Un scout solo puede tener UN registro de dirigente activo
- `fecha_fin_dirigente = NULL` indica dirigente activo

---

### Tabla: `asignaciones_dirigente_rama`

**Historial completo** de asignaciones de dirigentes a ramas.

```sql
asignaciones_dirigente_rama
├── id (PK)
├── dirigente_id (FK → dirigentes.id)
├── rama (ENUM) - Manada, Tropa, Caminantes, Clan
├── es_responsable_principal (BOOLEAN)
├── fecha_inicio
├── fecha_fin - NULL si está activa
├── motivo_cambio
```

**Reglas:**
- Un dirigente solo puede tener UNA asignación activa (fecha_fin = NULL)
- Constraint: `UNIQUE (dirigente_id, fecha_fin)`
- Todas las asignaciones anteriores tienen `fecha_fin` diferente de NULL

**Ejemplos de uso:**
```sql
-- Ver rama actual de un dirigente
SELECT rama 
FROM asignaciones_dirigente_rama 
WHERE dirigente_id = '...' AND fecha_fin IS NULL;

-- Ver historial completo de un dirigente
SELECT rama, fecha_inicio, fecha_fin, motivo_cambio
FROM asignaciones_dirigente_rama 
WHERE dirigente_id = '...' 
ORDER BY fecha_inicio DESC;
```

---

### Tabla: `scouts_dirigente`

Relación entre scouts y sus dirigentes responsables.

```sql
scouts_dirigente
├── id (PK)
├── scout_id (FK → scouts.id)
├── dirigente_id (FK → dirigentes.id)
├── fecha_asignacion
├── fecha_desasignacion - NULL si está activa
```

**Reglas:**
- Un scout solo puede tener UN dirigente activo a la vez
- Constraint: `UNIQUE (scout_id, fecha_desasignacion)`

---

## 🔧 Funciones SQL Principales

### 1. `cambiar_dirigente_rama()`

Cambia un dirigente de rama, manteniendo el historial.

```sql
SELECT cambiar_dirigente_rama(
    p_dirigente_id := '...',
    p_nueva_rama := 'Tropa',
    p_es_responsable := true,
    p_motivo_cambio := 'Promoción a Jefe de Tropa'
);
```

**Acciones automáticas:**
1. Cierra la asignación actual (fecha_fin = HOY)
2. Crea nueva asignación con fecha_inicio = HOY
3. Registra motivo del cambio
4. Mantiene historial completo

---

### 2. `asignar_scout_a_dirigente()`

Asigna un scout a un dirigente.

```sql
SELECT asignar_scout_a_dirigente(
    p_scout_id := '...',
    p_dirigente_id := '...'
);
```

**Acciones automáticas:**
1. Cierra asignación anterior del scout (si existe)
2. Crea nueva asignación
3. Mantiene historial

---

### 3. `obtener_rama_actual_dirigente()`

Obtiene la rama actual de un dirigente.

```sql
SELECT obtener_rama_actual_dirigente('dirigente-uuid');
-- Retorna: 'Tropa'
```

---

## 📊 Vistas para Reportes

### Vista: `v_dirigentes_activos`

Muestra todos los dirigentes activos con su información completa.

```sql
SELECT * FROM v_dirigentes_activos;
```

**Columnas:**
- dirigente_id, scout_id, codigo_scout
- nombres, apellidos, nombre_completo
- cargo, numero_credencial
- rama_actual
- es_responsable_principal
- total_scouts_a_cargo
- estado

**Ejemplo de uso:**
```sql
-- Dirigentes de una rama específica
SELECT * FROM v_dirigentes_activos WHERE rama_actual = 'Tropa';

-- Responsables principales por rama
SELECT rama_actual, nombre_completo, total_scouts_a_cargo
FROM v_dirigentes_activos 
WHERE es_responsable_principal = true;
```

---

### Vista: `v_historial_dirigente_ramas`

Historial completo de todas las asignaciones.

```sql
SELECT * FROM v_historial_dirigente_ramas;
```

**Columnas:**
- nombre_dirigente, cargo
- rama, fecha_inicio, fecha_fin
- motivo_cambio
- estado_asignacion (ACTIVA/FINALIZADA)
- dias_en_rama

**Ejemplos de uso:**
```sql
-- Historial de un dirigente específico
SELECT * FROM v_historial_dirigente_ramas 
WHERE dirigente_id = '...';

-- Dirigentes que han estado en múltiples ramas
SELECT nombre_dirigente, COUNT(DISTINCT rama) as ramas_diferentes
FROM v_historial_dirigente_ramas
GROUP BY nombre_dirigente, dirigente_id
HAVING COUNT(DISTINCT rama) > 1;
```

---

## 📈 Consultas Comunes

### 1. ¿Cuántos scouts tiene cada dirigente?

```sql
SELECT 
    d.nombre_completo as dirigente,
    d.rama_actual,
    d.total_scouts_a_cargo
FROM v_dirigentes_activos d
ORDER BY d.total_scouts_a_cargo DESC;
```

### 2. ¿Qué dirigente lidera cada rama?

```sql
SELECT 
    rama_actual,
    nombre_completo as responsable,
    cargo,
    total_scouts_a_cargo
FROM v_dirigentes_activos
WHERE es_responsable_principal = true
ORDER BY rama_actual;
```

### 3. Historial de cambios de un dirigente

```sql
SELECT 
    rama,
    fecha_inicio,
    fecha_fin,
    dias_en_rama,
    motivo_cambio
FROM v_historial_dirigente_ramas
WHERE dirigente_id = 'uuid-del-dirigente'
ORDER BY fecha_inicio DESC;
```

### 4. Dirigentes que volvieron a una rama anterior

```sql
WITH ramas_por_dirigente AS (
    SELECT 
        dirigente_id,
        rama,
        fecha_inicio,
        ROW_NUMBER() OVER (PARTITION BY dirigente_id, rama ORDER BY fecha_inicio) as vez
    FROM asignaciones_dirigente_rama
)
SELECT DISTINCT
    h.nombre_dirigente,
    h.rama,
    COUNT(*) as veces_en_rama
FROM ramas_por_dirigente r
JOIN v_historial_dirigente_ramas h ON r.dirigente_id = h.dirigente_id AND r.rama = h.rama
WHERE r.vez > 1
GROUP BY h.nombre_dirigente, h.rama
ORDER BY veces_en_rama DESC;
```

### 5. Scouts sin dirigente asignado

```sql
SELECT 
    s.codigo_scout,
    s.nombres,
    s.apellidos,
    s.rama_actual
FROM scouts s
WHERE s.estado = 'ACTIVO'
  AND s.es_dirigente = false
  AND NOT EXISTS (
      SELECT 1 FROM scouts_dirigente sd 
      WHERE sd.scout_id = s.id AND sd.fecha_desasignacion IS NULL
  );
```

---

## 🚀 Orden de Ejecución

1. **Ejecutar:** `sistema_dirigentes_completo.sql`
   - Crea tablas, funciones y vistas

2. **Ejecutar:** `add_es_dirigente_column.sql`
   - Agrega columna es_dirigente a scouts (si no existe)

3. **Ejecutar:** `migracion_dirigentes.sql`
   - Migra datos existentes al nuevo sistema

4. **Verificar:**
   ```sql
   SELECT * FROM v_dirigentes_activos;
   SELECT * FROM v_historial_dirigente_ramas;
   ```

---

## 📝 Próximos Pasos en el Frontend

1. **Módulo Dirigentes:**
   - Listado de dirigentes activos
   - Formulario para crear/editar dirigente
   - Cambiar dirigente de rama
   - Ver historial de asignaciones

2. **Asignación Scouts-Dirigente:**
   - Asignar múltiples scouts a un dirigente
   - Ver scouts por dirigente
   - Cambiar dirigente de un scout

3. **Reportes:**
   - Scouts por dirigente
   - Historial de cambios
   - Dirigentes por rama
   - Estadísticas de asignaciones

---

## 🔐 Reglas de Negocio Implementadas

✅ Un dirigente solo puede estar en UNA rama a la vez
✅ Historial completo de cambios de rama
✅ Un dirigente puede volver a rama anterior
✅ Un scout solo tiene un dirigente activo a la vez
✅ Integridad referencial con cascada
✅ Constraints para asegurar unicidad de asignaciones activas
✅ Vistas optimizadas para consultas comunes
