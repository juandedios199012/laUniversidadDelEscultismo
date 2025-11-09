-- ================================================================
-- 🧪 VERIFICACIÓN COMPLETA DEL SISTEMA UNIFICADO
-- ================================================================
-- PROPÓSITO: Verificar que los archivos MASTER estén instalados correctamente
-- INCLUYE: Test de funciones, enums, APIs y sistema completo
-- VERSIÓN: Sistema Unificado Master
-- ================================================================

-- Mensaje inicial
DO $$ 
BEGIN
    RAISE NOTICE '🧪 ========================================';
    RAISE NOTICE '🔍 VERIFICACIÓN SISTEMA MASTER UNIFICADO';
    RAISE NOTICE '🧪 ========================================';
    RAISE NOTICE '⚡ Verificando instalación completa...';
END $$;

-- ================================================================
-- 📋 FASE 1: VERIFICACIÓN DE ESTRUCTURA BASE
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🏗️ Verificando estructura de tablas...';
END $$;

-- Verificar que existen las tablas principales
DO $$
DECLARE
    v_tabla_faltante TEXT;
    v_tablas_esperadas TEXT[] := ARRAY[
        'scouts', 'familiares_scout', 'dirigentes', 'patrullas',
        'inventario', 'movimientos_inventario', 'actividades_scout',
        'asistencias', 'cache_estadisticas', 'audit_log'
    ];
    v_tabla TEXT;
BEGIN
    FOREACH v_tabla IN ARRAY v_tablas_esperadas
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = v_tabla
        ) THEN
            RAISE EXCEPTION 'Tabla faltante: %', v_tabla;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Todas las tablas principales existen';
END $$;

-- ================================================================
-- 📋 FASE 2: VERIFICACIÓN DE ENUMS UNIFICADOS
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🔄 Verificando enums unificados...';
END $$;

-- Test de todos los valores de enum
DO $$
DECLARE
    v_rama_test rama_enum;
    v_sexo_test sexo_enum;
    v_tipo_doc_test tipo_documento_enum;
    v_parentesco_test parentesco_enum;
    v_estado_test estado_enum;
BEGIN
    -- Test rama_enum (valores unificados)
    v_rama_test := 'Lobatos'::rama_enum;
    v_rama_test := 'Scouts'::rama_enum;
    v_rama_test := 'Rovers'::rama_enum;
    v_rama_test := 'Dirigentes'::rama_enum;
    
    -- Test sexo_enum
    v_sexo_test := 'MASCULINO'::sexo_enum;
    v_sexo_test := 'FEMENINO'::sexo_enum;
    
    -- Test tipo_documento_enum
    v_tipo_doc_test := 'DNI'::tipo_documento_enum;
    v_tipo_doc_test := 'CARNET_EXTRANJERIA'::tipo_documento_enum;
    v_tipo_doc_test := 'PASAPORTE'::tipo_documento_enum;
    
    -- Test parentesco_enum
    v_parentesco_test := 'PADRE'::parentesco_enum;
    v_parentesco_test := 'MADRE'::parentesco_enum;
    v_parentesco_test := 'TUTOR'::parentesco_enum;
    v_parentesco_test := 'HERMANO'::parentesco_enum;
    v_parentesco_test := 'TIO'::parentesco_enum;
    v_parentesco_test := 'ABUELO'::parentesco_enum;
    v_parentesco_test := 'OTRO'::parentesco_enum;
    
    -- Test estado_enum
    v_estado_test := 'ACTIVO'::estado_enum;
    v_estado_test := 'INACTIVO'::estado_enum;
    
    RAISE NOTICE '✅ Todos los enums funcionan correctamente';
END $$;

-- ================================================================
-- 📋 FASE 3: VERIFICACIÓN DE FUNCIONES BÁSICAS
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🔧 Verificando funciones básicas instaladas...';
END $$;

-- Verificar funciones utilitarias centrales
DO $$
BEGIN
    -- Test create_standard_response
    PERFORM create_standard_response(true, 'Test message', '{"test": true}'::json);
    
    -- Test validate_input
    PERFORM validate_input('{"test": "value"}'::json, ARRAY['test']);
    
    -- Test generar_codigo
    PERFORM generar_codigo('TEST', 'scouts', 'codigo_scout');
    
    RAISE NOTICE '✅ Funciones utilitarias funcionan correctamente';
END $$;

-- ================================================================
-- 📋 FASE 4: VERIFICACIÓN DE FUNCIONES DE MAPEO UNIFICADAS
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🔄 Verificando funciones de mapeo automático...';
END $$;

-- Test funciones de mapeo
DO $$
DECLARE
    v_result_rama rama_enum;
    v_result_sexo sexo_enum;
    v_result_doc tipo_documento_enum;
    v_result_parentesco parentesco_enum;
BEGIN
    -- Test mapeo de rama
    v_result_rama := mapear_rama_a_enum('lobatos');
    IF v_result_rama != 'Lobatos'::rama_enum THEN
        RAISE EXCEPTION 'Error en mapeo de rama: %', v_result_rama;
    END IF;
    
    -- Test mapeo de sexo
    v_result_sexo := mapear_sexo_a_enum('masculino');
    IF v_result_sexo != 'MASCULINO'::sexo_enum THEN
        RAISE EXCEPTION 'Error en mapeo de sexo: %', v_result_sexo;
    END IF;
    
    -- Test mapeo de documento
    v_result_doc := mapear_tipo_documento_a_enum('dni');
    IF v_result_doc != 'DNI'::tipo_documento_enum THEN
        RAISE EXCEPTION 'Error en mapeo de documento: %', v_result_doc;
    END IF;
    
    -- Test mapeo de parentesco
    v_result_parentesco := mapear_parentesco_a_enum('padre');
    IF v_result_parentesco != 'PADRE'::parentesco_enum THEN
        RAISE EXCEPTION 'Error en mapeo de parentesco: %', v_result_parentesco;
    END IF;
    
    RAISE NOTICE '✅ Funciones de mapeo automático funcionan correctamente';
END $$;

-- ================================================================
-- 📋 FASE 5: TEST DE API PRINCIPAL UNIFICADA
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🚀 Probando API principal con mapeo automático...';
END $$;

-- Test de api_registrar_scout con valores de frontend típicos (PostgreSQL Compatible)
DO $$
DECLARE
    v_resultado JSON;
    v_datos_test JSON;
BEGIN
    -- Datos de prueba con valores típicos del frontend
    v_datos_test := '{
        "nombres": "Juan Carlos",
        "apellidos": "Test Usuario",
        "fecha_nacimiento": "2010-05-15",
        "documento_identidad": "99999999",
        "sexo": "masculino",
        "tipo_documento": "dni",
        "telefono": "999888777",
        "email": "test@scout.com",
        "departamento": "Lima",
        "provincia": "Lima",
        "distrito": "Miraflores",
        "direccion": "Av. Test 123",
        "centro_estudio": "Colegio Test",
        "rama": "scouts",
        "familiar_nombres": "Maria",
        "familiar_apellidos": "Test Familiar",
        "parentesco": "madre",
        "familiar_telefono": "888777666",
        "familiar_email": "madre@test.com"
    }'::JSON;
    
    -- Llamar a la función
    v_resultado := api_registrar_scout(v_datos_test);
    
    -- Verificar resultado
    IF NOT (v_resultado ->> 'success')::BOOLEAN THEN
        RAISE NOTICE '❌ Error en registro de scout: %', v_resultado ->> 'message';
        RAISE NOTICE '❌ Detalles: %', v_resultado ->> 'errors';
        RAISE EXCEPTION 'Test falló: %', v_resultado ->> 'message';
    END IF;
    
    RAISE NOTICE '✅ API registrar scout funciona con mapeo automático';
    RAISE NOTICE '📊 Resultado: %', v_resultado ->> 'message';
    
    -- Limpiar datos de prueba
    DELETE FROM scouts WHERE numero_documento = '99999999';
    
END $$;

-- ================================================================
-- 📋 FASE 6: TEST DE FUNCIONES ESPECIALIZADAS
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🔍 Verificando funciones especializadas...';
END $$;

-- Test verificar_integridad_enums
DO $$
DECLARE
    v_integridad JSON;
BEGIN
    v_integridad := verificar_integridad_enums();
    
    IF NOT (v_integridad ->> 'integridad_correcta')::BOOLEAN THEN
        RAISE EXCEPTION 'Problemas de integridad: %', v_integridad ->> 'detalles_errores';
    END IF;
    
    RAISE NOTICE '✅ Integridad de enums verificada correctamente';
END $$;

-- Test normalizar_datos_scout
DO $$
DECLARE
    v_datos_originales JSON;
    v_datos_normalizados JSON;
BEGIN
    v_datos_originales := '{"nombres": "  juan  ", "sexo": "masculino", "rama": "scouts"}'::JSON;
    v_datos_normalizados := normalizar_datos_scout(v_datos_originales);
    
    IF v_datos_normalizados ->> 'nombres' != 'juan' THEN
        RAISE EXCEPTION 'Error en normalización de nombres';
    END IF;
    
    RAISE NOTICE '✅ Normalización de datos funciona correctamente';
END $$;

-- ================================================================
-- 📋 FASE 7: VERIFICACIÓN DE SISTEMA DE CACHING
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🔄 Verificando sistema de caching...';
END $$;

-- Test del sistema de cache
DO $$
DECLARE
    v_cache_guardado BOOLEAN;
    v_cache_obtenido JSON;
BEGIN
    -- Guardar en cache
    v_cache_guardado := guardar_cache('test_key', '{"test": "data"}'::JSON, 'test_type', 5);
    
    IF NOT v_cache_guardado THEN
        RAISE EXCEPTION 'Error al guardar en cache';
    END IF;
    
    -- Obtener del cache
    v_cache_obtenido := obtener_cache('test_key');
    
    IF v_cache_obtenido IS NULL THEN
        RAISE EXCEPTION 'Error al obtener del cache';
    END IF;
    
    RAISE NOTICE '✅ Sistema de caching funciona correctamente';
    
    -- Limpiar cache de prueba
    DELETE FROM cache_estadisticas WHERE cache_key = 'test_key';
    
END $$;

-- ================================================================
-- 📋 FASE 8: HEALTH CHECK COMPLETO
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🏥 Ejecutando health check completo del sistema...';
END $$;

-- Test api_health_check
DO $$
DECLARE
    v_health JSON;
BEGIN
    v_health := api_health_check();
    
    IF NOT (v_health ->> 'success')::BOOLEAN THEN
        RAISE EXCEPTION 'Health check falló: %', v_health ->> 'message';
    END IF;
    
    RAISE NOTICE '✅ Health check del sistema exitoso';
    RAISE NOTICE '📊 Estado: %', v_health -> 'data' ->> 'estado';
END $$;

-- ================================================================
-- 📋 RESUMEN FINAL DE VERIFICACIÓN
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '✅ VERIFICACIÓN COMPLETA EXITOSA';
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '🏗️ ESTRUCTURA: Todas las tablas existen';
    RAISE NOTICE '🔄 ENUMS: Todos los valores funcionan correctamente';
    RAISE NOTICE '🔧 FUNCIONES: Funciones básicas operativas';
    RAISE NOTICE '🚀 APIS: api_registrar_scout con mapeo automático';
    RAISE NOTICE '🔄 MAPEO: Funciones de normalización operativas';
    RAISE NOTICE '💾 CACHE: Sistema de caching funcional';
    RAISE NOTICE '🏥 HEALTH: Sistema saludable y operativo';
    RAISE NOTICE '🎯 ESTADO: SISTEMA MASTER UNIFICADO COMPLETAMENTE FUNCIONAL';
    RAISE NOTICE '🎉 ========================================';
END $$;

-- Query final de confirmación
SELECT 
    '🎯 SISTEMA MASTER UNIFICADO VERIFICADO' as estado,
    'Todas las funciones y enums operativos con mapeo automático' as resultado,
    'Sistema listo para uso en producción' as conclusion,
    CURRENT_TIMESTAMP as verificado_en;