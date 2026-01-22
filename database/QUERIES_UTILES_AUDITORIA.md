# 🔍 Queries Útiles para Auditoría de Base de Datos

Colección de queries SQL para inspeccionar y auditar la estructura de la base de datos PostgreSQL/Supabase.

---

## 📊 Estructura de Tablas

### Ver todas las tablas existentes con número de columnas

```sql
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as num_columnas
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Ver columnas de una tabla específica

```sql
SELECT 
    column_name, 
    data_type,
    udt_name as tipo_completo,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'nombre_tabla'
ORDER BY ordinal_position;
```

**Ejemplo de uso:**
```sql
-- Ver estructura de tabla personas
SELECT column_name, data_type, udt_name as tipo_completo, is_nullable
FROM information_schema.columns
WHERE table_name = 'personas'
ORDER BY ordinal_position;
```

### Ver columnas de múltiples tablas clave

```sql
-- PERSONAS
SELECT 'PERSONAS' as tabla, column_name, data_type, udt_name as tipo_completo, is_nullable
FROM information_schema.columns WHERE table_name = 'personas' ORDER BY ordinal_position;

-- SCOUTS
SELECT 'SCOUTS' as tabla, column_name, data_type, udt_name as tipo_completo, is_nullable
FROM information_schema.columns WHERE table_name = 'scouts' ORDER BY ordinal_position;

-- ASISTENCIAS
SELECT 'ASISTENCIAS' as tabla, column_name, data_type, udt_name as tipo_completo, is_nullable
FROM information_schema.columns WHERE table_name = 'asistencias' ORDER BY ordinal_position;

-- FAMILIARES_SCOUT
SELECT 'FAMILIARES_SCOUT' as tabla, column_name, data_type, udt_name as tipo_completo, is_nullable
FROM information_schema.columns WHERE table_name = 'familiares_scout' ORDER BY ordinal_position;

-- PATRULLAS
SELECT 'PATRULLAS' as tabla, column_name, data_type, udt_name as tipo_completo, is_nullable
FROM information_schema.columns WHERE table_name = 'patrullas' ORDER BY ordinal_position;

-- DIRIGENTES
SELECT 'DIRIGENTES' as tabla, column_name, data_type, udt_name as tipo_completo, is_nullable
FROM information_schema.columns WHERE table_name = 'dirigentes' ORDER BY ordinal_position;
```

---

## 🏷️ ENUMs

### Ver todos los ENUMs y sus valores

```sql
SELECT 
    t.typname AS enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS valores_posibles
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
GROUP BY t.typname
ORDER BY t.typname;
```

### Ver un ENUM específico

```sql
SELECT 
    e.enumlabel AS valor
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'rama_enum'
ORDER BY e.enumsortorder;
```

---

## 🔗 Relaciones (Foreign Keys)

### Ver todas las Foreign Keys

```sql
SELECT
    tc.table_name AS tabla, 
    kcu.column_name AS columna, 
    ccu.table_name AS tabla_referenciada,
    ccu.column_name AS columna_referenciada,
    tc.constraint_name AS nombre_constraint
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;
```

### Ver Foreign Keys de una tabla específica

```sql
SELECT
    kcu.column_name AS columna, 
    ccu.table_name AS tabla_referenciada,
    ccu.column_name AS columna_referenciada
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'scouts';
```

---

## 📈 Estadísticas de Datos

### Contar registros en tablas principales

```sql
SELECT 
    'personas' as tabla, COUNT(*) as total FROM personas
UNION ALL
SELECT 'scouts', COUNT(*) FROM scouts
UNION ALL
SELECT 'asistencias', COUNT(*) FROM asistencias
UNION ALL
SELECT 'inscripciones_anuales', COUNT(*) FROM inscripciones_anuales
UNION ALL
SELECT 'patrullas', COUNT(*) FROM patrullas
UNION ALL
SELECT 'dirigentes', COUNT(*) FROM dirigentes
UNION ALL
SELECT 'familiares_scout', COUNT(*) FROM familiares_scout
ORDER BY tabla;
```

### Resumen general de datos

```sql
SELECT 
    (SELECT COUNT(*) FROM personas) as total_personas,
    (SELECT COUNT(*) FROM scouts) as total_scouts,
    (SELECT COUNT(*) FROM asistencias) as total_asistencias,
    (SELECT COUNT(*) FROM inscripciones_anuales) as total_inscripciones,
    (SELECT COUNT(*) FROM patrullas) as total_patrullas,
    (SELECT COUNT(*) FROM dirigentes) as total_dirigentes,
    (SELECT COUNT(*) FROM familiares_scout) as total_familiares;
```

---

## 🔒 Row Level Security (RLS)

### Ver estado de RLS en tablas

```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Ver políticas RLS de una tabla

```sql
SELECT 
    tablename,
    policyname AS nombre_politica,
    permissive AS es_permisiva,
    roles,
    cmd AS operacion,
    qual AS condicion_where
FROM pg_policies
WHERE tablename = 'personas'
ORDER BY policyname;
```

### Ver todas las políticas RLS

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS operacion
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

---

## 🔍 Funciones y Stored Procedures

### Ver todas las funciones personalizadas

```sql
SELECT 
    routine_name AS nombre_funcion,
    routine_type AS tipo,
    data_type AS tipo_retorno
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'api_%'
ORDER BY routine_name;
```

### Ver definición completa de una función

```sql
SELECT pg_get_functiondef('api_buscar_scouts'::regproc);
```

### Ver parámetros de una función

```sql
SELECT 
    p.parameter_name,
    p.data_type,
    p.parameter_mode
FROM information_schema.parameters p
WHERE p.specific_name = (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_name = 'api_buscar_scouts'
)
ORDER BY p.ordinal_position;
```

---

## 🗂️ Índices

### Ver todos los índices de una tabla

```sql
SELECT
    indexname AS nombre_indice,
    indexdef AS definicion
FROM pg_indexes
WHERE tablename = 'personas'
ORDER BY indexname;
```

### Ver tamaño de tablas e índices

```sql
SELECT
    schemaname AS esquema,
    tablename AS tabla,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS tamaño_total,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS tamaño_tabla,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS tamaño_indices
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## ✅ Validaciones

### Verificar si una columna existe en una tabla

```sql
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'personas' 
    AND column_name = 'fecha_ingreso'
) as columna_existe;
```

### Verificar si una tabla existe

```sql
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'familiares_scout'
    AND table_schema = 'public'
) as tabla_existe;
```

### Verificar campos NULL en una columna

```sql
SELECT 
    COUNT(*) as total_registros,
    COUNT(fecha_ingreso) as registros_con_fecha,
    COUNT(*) - COUNT(fecha_ingreso) as registros_null
FROM personas;
```

---

## 🔧 Uso Común: Auditoría Completa para Reportes

```sql
-- ================================================================
-- AUDITORÍA COMPLETA DEL MODELO DE DATOS
-- Ejecutar para validar soporte de módulos de reportes
-- ================================================================

-- 1. Tablas existentes con número de columnas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as num_columnas
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Estructura de tablas clave
SELECT 'PERSONAS' as tabla, column_name, data_type, udt_name as tipo, is_nullable
FROM information_schema.columns WHERE table_name = 'personas' ORDER BY ordinal_position;

SELECT 'SCOUTS' as tabla, column_name, data_type, udt_name as tipo, is_nullable
FROM information_schema.columns WHERE table_name = 'scouts' ORDER BY ordinal_position;

SELECT 'ASISTENCIAS' as tabla, column_name, data_type, udt_name as tipo, is_nullable
FROM information_schema.columns WHERE table_name = 'asistencias' ORDER BY ordinal_position;

-- 3. ENUMs disponibles
SELECT 
    t.typname AS enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS valores
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
GROUP BY t.typname
ORDER BY t.typname;

-- 4. Foreign Keys
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- 5. Resumen de datos
SELECT 
    (SELECT COUNT(*) FROM personas) as personas,
    (SELECT COUNT(*) FROM scouts) as scouts,
    (SELECT COUNT(*) FROM asistencias) as asistencias,
    (SELECT COUNT(*) FROM inscripciones_anuales) as inscripciones,
    (SELECT COUNT(*) FROM patrullas) as patrullas,
    (SELECT COUNT(*) FROM dirigentes) as dirigentes;
```

---

## 💡 Tips de Uso

1. **Exportar resultados**: En Supabase SQL Editor puedes copiar los resultados como CSV
2. **Guardar queries frecuentes**: Guarda en snippets las queries que uses más
3. **Combinar queries**: Ejecuta múltiples SELECT separados por `;` para ver todo de una vez
4. **Performance**: Evita `SELECT *` en tablas grandes, siempre limita columnas específicas

---

## 📚 Referencias

- [PostgreSQL Information Schema](https://www.postgresql.org/docs/current/information-schema.html)
- [Supabase Database Introspection](https://supabase.com/docs/guides/database)
- [PostgreSQL System Catalogs](https://www.postgresql.org/docs/current/catalogs.html)

---

**Última actualización:** 21 de enero de 2026
