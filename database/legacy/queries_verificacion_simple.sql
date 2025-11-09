-- ================================================================
-- 🔍 QUERIES DE VERIFICACIÓN RÁPIDA - SISTEMA SCOUT
-- ================================================================
-- Usa estas queries simples PRIMERO para verificar qué tablas existen

-- ❓ VERIFICAR QUÉ TABLAS EXISTEN
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%scout%' OR table_name IN ('patrullas', 'inventario', 'presupuestos', 'comite_padres')
ORDER BY table_name;

-- ❓ VERIFICAR COLUMNAS DE LA TABLA SCOUTS
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'scouts'
ORDER BY ordinal_position;

-- ❓ VERIFICAR COLUMNAS DE OTRAS TABLAS PRINCIPALES
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('familiares_scout', 'patrullas', 'dirigentes', 'inventario')
ORDER BY table_name, ordinal_position;

-- ================================================================
-- ✅ QUERIES BÁSICAS SEGURAS (sin campos problemáticos)
-- ================================================================

-- 1️⃣ SCOUTS - VERSION BÁSICA
SELECT 
    id,
    nombres,
    apellidos,
    fecha_nacimiento,
    rama_actual,
    estado,
    created_at
FROM scouts 
ORDER BY created_at DESC
LIMIT 10;

-- 2️⃣ CONTAR REGISTROS POR TABLA
SELECT 'scouts' as tabla, COUNT(*) as registros FROM scouts WHERE EXISTS (SELECT 1 FROM scouts LIMIT 1)
UNION ALL
SELECT 'familiares_scout' as tabla, COUNT(*) as registros FROM familiares_scout WHERE EXISTS (SELECT 1 FROM familiares_scout LIMIT 1)
UNION ALL
SELECT 'patrullas' as tabla, COUNT(*) as registros FROM patrullas WHERE EXISTS (SELECT 1 FROM patrullas LIMIT 1)
UNION ALL
SELECT 'dirigentes' as tabla, COUNT(*) as registros FROM dirigentes WHERE EXISTS (SELECT 1 FROM dirigentes LIMIT 1)
UNION ALL
SELECT 'inventario' as tabla, COUNT(*) as registros FROM inventario WHERE EXISTS (SELECT 1 FROM inventario LIMIT 1);

-- 3️⃣ VERIFICAR SI HAY DATOS DE PRUEBA
SELECT 
    nombres || ' ' || apellidos as nombre_completo,
    rama_actual,
    estado
FROM scouts 
WHERE estado = 'activo'
LIMIT 5;