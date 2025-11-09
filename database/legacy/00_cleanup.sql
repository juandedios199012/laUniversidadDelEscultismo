-- ================================================================
-- 🧹 SCRIPT DE LIMPIEZA COMPLETA - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 00_cleanup.sql
-- Propósito: Eliminar todos los objetos existentes para instalación limpia
-- Orden de ejecución: 1° (Primero)
-- ================================================================

-- ADVERTENCIA: Este script ELIMINA TODOS LOS DATOS
-- Solo ejecutar si quieres una instalación completamente limpia

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. ELIMINAR VISTAS
    FOR r IN (SELECT schemaname, viewname FROM pg_views WHERE schemaname = 'public') 
    LOOP
        BEGIN
            EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.viewname) || ' CASCADE';
            RAISE NOTICE 'Vista eliminada: %', r.viewname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'No se pudo eliminar vista: % - %', r.viewname, SQLERRM;
        END;
    END LOOP;

    -- 2. ELIMINAR FUNCIONES (método simplificado y robusto)
    FOR r IN (
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as function_args
        FROM pg_proc p
        LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname NOT LIKE 'pg_%'
        AND p.proname NOT IN ('unaccent', 'uuid_generate_v4', 'uuid_generate_v1', 'uuid_generate_v1mc', 'uuid_generate_v3', 'uuid_generate_v5')
        ORDER BY p.proname
    )
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 
                          r.schema_name, r.function_name, r.function_args);
            RAISE NOTICE 'Función eliminada: %(%)', r.function_name, r.function_args;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'No se pudo eliminar función: %(%s) - %', r.function_name, r.function_args, SQLERRM;
        END;
    END LOOP;

    -- 3. ELIMINAR TRIGGERS
    FOR r IN (
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
    )
    LOOP
        BEGIN
            EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON ' || quote_ident(r.event_object_table) || ' CASCADE';
            RAISE NOTICE 'Trigger eliminado: % en tabla %', r.trigger_name, r.event_object_table;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'No se pudo eliminar trigger: % - %', r.trigger_name, SQLERRM;
        END;
    END LOOP;

    -- 4. ELIMINAR TABLAS (en orden inverso de dependencias)
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        ORDER BY tablename
    )
    LOOP
        BEGIN
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            RAISE NOTICE 'Tabla eliminada: %', r.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'No se pudo eliminar tabla: % - %', r.tablename, SQLERRM;
        END;
    END LOOP;

    -- 5. ELIMINAR TIPOS PERSONALIZADOS (solo tipos enum definidos por usuario)
    FOR r IN (
        SELECT typname 
        FROM pg_type 
        WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND typtype = 'e'
        AND typname NOT LIKE 'pg_%'
        ORDER BY typname
    )
    LOOP
        BEGIN
            EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
            RAISE NOTICE 'Tipo eliminado: %', r.typname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'No se pudo eliminar tipo: % - %', r.typname, SQLERRM;
        END;
    END LOOP;

    -- 6. ELIMINAR SECUENCIAS
    FOR r IN (
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    )
    LOOP
        BEGIN
            EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
            RAISE NOTICE 'Secuencia eliminada: %', r.sequence_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'No se pudo eliminar secuencia: % - %', r.sequence_name, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE 'Limpieza completa finalizada exitosamente';
END
$$;

-- ================================================================
-- VERIFICACIÓN FINAL
-- ================================================================

-- Mostrar objetos restantes (debería estar vacío)
SELECT 
    'TABLAS' as tipo,
    COUNT(*) as cantidad
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'pg_%'

UNION ALL

SELECT 
    'FUNCIONES' as tipo,
    COUNT(*) as cantidad
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name NOT LIKE 'pg_%'

UNION ALL

SELECT 
    'VISTAS' as tipo,
    COUNT(*) as cantidad
FROM pg_views 
WHERE schemaname = 'public';

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '🧹 LIMPIEZA COMPLETA FINALIZADA' as estado,
    'Base de datos lista para instalación limpia' as mensaje,
    NOW() as timestamp_limpieza;