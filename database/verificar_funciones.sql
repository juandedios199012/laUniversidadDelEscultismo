-- ======================================================
-- 🔍 VERIFICACIÓN DE FUNCIONES DE BASE DE DATOS
-- ======================================================
-- Ejecuta este script en Supabase SQL Editor para verificar
-- que todas las funciones estén correctamente instaladas

-- 1️⃣ Verificar que la función api_registrar_scout existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'api_registrar_scout'
    ) THEN
        RAISE NOTICE '✅ Función api_registrar_scout ENCONTRADA';
    ELSE
        RAISE NOTICE '❌ Función api_registrar_scout NO ENCONTRADA';
    END IF;
END $$;

-- 2️⃣ Listar todas las funciones API disponibles
SELECT 
    routine_name as "Función",
    routine_type as "Tipo",
    data_type as "Retorna"
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE 'api_%'
ORDER BY routine_name;

-- 3️⃣ Verificar estructura de la tabla scouts
SELECT 
    column_name as "Campo",
    data_type as "Tipo",
    is_nullable as "Nulo"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'scouts'
ORDER BY ordinal_position;

-- 4️⃣ Verificar enums existentes
SELECT 
    t.typname as "Enum",
    e.enumlabel as "Valores"
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN ('rama_enum', 'sexo_enum', 'tipo_documento_enum', 'estado_enum', 'parentesco_enum')
ORDER BY t.typname, e.enumsortorder;

-- 5️⃣ Probar la función api_registrar_scout con datos de prueba
SELECT api_registrar_scout('{
  "nombres": "Test",
  "apellidos": "Usuario",
  "fecha_nacimiento": "2010-05-15",
  "documento_identidad": "99999999",
  "sexo": "MASCULINO",
  "rama": "Scouts"
}'::json) as resultado_prueba;

-- 6️⃣ Verificar si existen scouts de prueba y eliminarlos
DELETE FROM scouts WHERE numero_documento = '99999999';

RAISE NOTICE '🎯 Verificación completada';