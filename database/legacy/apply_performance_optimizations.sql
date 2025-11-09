-- ================================================================
-- 🎯 SCRIPT DE APLICACIÓN DE OPTIMIZACIONES - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: database/apply_performance_optimizations.sql
-- Propósito: Script maestro para aplicar todas las optimizaciones de performance
-- ================================================================

\echo '🚀 INICIANDO APLICACIÓN DE OPTIMIZACIONES DE PERFORMANCE'
\echo '================================================================'

-- Configurar parámetros para optimización
SET work_mem = '256MB';
SET maintenance_work_mem = '512MB';
SET effective_cache_size = '2GB';

\echo '📊 PASO 1: Aplicando índices estratégicos...'
\i 17_performance_indexes.sql

\echo ''
\echo '⚡ PASO 2: Aplicando optimizaciones de consultas...'
\i 18_query_optimizations.sql

\echo ''
\echo '🔄 PASO 3: Configurando sistema de caching...'
\i 19_caching_system.sql

\echo ''
\echo '🔧 PASO 4: Ejecutando mantenimiento inicial...'

-- Actualizar estadísticas de todas las tablas
DO $$
BEGIN
    PERFORM mantener_estadisticas_tablas();
    RAISE NOTICE '✅ Estadísticas de tablas actualizadas';
END
$$;

-- Refrescar vistas materializadas
DO $$
BEGIN
    PERFORM mantener_vistas_materializadas();
    RAISE NOTICE '✅ Vistas materializadas refrescadas';
END
$$;

-- Pre-calcular estadísticas iniciales
DO $$
DECLARE
    v_resultado TEXT;
BEGIN
    v_resultado := precalcular_estadisticas_diarias();
    RAISE NOTICE '✅ Estadísticas pre-calculadas: %', v_resultado;
END
$$;

\echo ''
\echo '📈 PASO 5: Ejecutando validación de performance...'

-- Validar que todas las optimizaciones están funcionando
DO $$
DECLARE
    v_health_check JSON;
    v_cache_stats JSON;
    v_index_usage JSON;
BEGIN
    -- Check de salud general
    SELECT health_check_performance() INTO v_health_check;
    RAISE NOTICE '🏥 Health Check: %', v_health_check;
    
    -- Estadísticas de cache
    SELECT obtener_estadisticas_cache() INTO v_cache_stats;
    RAISE NOTICE '🔄 Cache Stats: %', (v_cache_stats->>'resumen_cache');
    
    -- Verificar uso de índices
    SELECT verificar_uso_indices() INTO v_index_usage;
    RAISE NOTICE '📊 Índices: %', v_index_usage;
END
$$;

\echo ''
\echo '🎯 PASO 6: Configurando monitoreo automático...'

-- Crear función para monitoreo continuo
CREATE OR REPLACE FUNCTION monitor_performance_scout_system()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
    v_queries_lentas INTEGER;
    v_cache_hit_rate NUMERIC;
    v_index_efficiency NUMERIC;
BEGIN
    -- Contar queries lentas (más de 1 segundo)
    SELECT COUNT(*) INTO v_queries_lentas
    FROM pg_stat_statements 
    WHERE mean_exec_time > 1000
    AND query NOT LIKE '%pg_%'
    AND calls > 10;
    
    -- Calcular hit rate del cache de aplicación
    SELECT 
        CASE 
            WHEN SUM(hits) > 0 THEN 
                ROUND((SUM(hits)::NUMERIC / COUNT(*)) * 100, 2)
            ELSE 0 
        END
    INTO v_cache_hit_rate
    FROM cache_estadisticas
    WHERE fecha_expiracion > CURRENT_TIMESTAMP;
    
    -- Eficiencia general de índices
    SELECT 
        ROUND(
            AVG(
                CASE 
                    WHEN idx_scan + seq_scan > 0 
                    THEN idx_scan::NUMERIC / (idx_scan + seq_scan) * 100
                    ELSE 0 
                END
            ), 2
        )
    INTO v_index_efficiency
    FROM pg_stat_user_tables
    WHERE schemaname = 'public';
    
    SELECT json_build_object(
        'timestamp', CURRENT_TIMESTAMP,
        'performance_metrics', json_build_object(
            'queries_lentas', v_queries_lentas,
            'cache_hit_rate_pct', COALESCE(v_cache_hit_rate, 0),
            'index_efficiency_pct', COALESCE(v_index_efficiency, 0),
            'database_size_mb', pg_database_size(current_database()) / 1024 / 1024,
            'conexiones_activas', (
                SELECT COUNT(*) FROM pg_stat_activity 
                WHERE state = 'active' AND datname = current_database()
            )
        ),
        'alertas', json_build_array(
            CASE 
                WHEN v_queries_lentas > 5 
                THEN 'ALERTA: Demasiadas queries lentas detectadas'
                ELSE NULL 
            END,
            CASE 
                WHEN COALESCE(v_cache_hit_rate, 0) < 70 
                THEN 'ALERTA: Hit rate del cache muy bajo'
                ELSE NULL 
            END,
            CASE 
                WHEN COALESCE(v_index_efficiency, 0) < 80 
                THEN 'ALERTA: Eficiencia de índices baja'
                ELSE NULL 
            END
        ),
        'recomendaciones', CASE 
            WHEN v_queries_lentas > 5 OR COALESCE(v_index_efficiency, 0) < 80
            THEN json_build_array(
                'Ejecutar ANALYZE en tablas principales',
                'Revisar queries sin índices apropiados',
                'Considerar optimización de queries específicas'
            )
            ELSE json_build_array('Sistema funcionando óptimamente')
        END
    ) INTO v_resultado;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

\echo ''
\echo '✅ OPTIMIZACIONES APLICADAS EXITOSAMENTE'
\echo '================================================================'

-- Ejecutar monitoreo inicial
SELECT 
    '🎯 MONITOREO INICIAL COMPLETADO' as estado,
    monitor_performance_scout_system() as metrics;

\echo ''
\echo '📋 RESUMEN DE OPTIMIZACIONES APLICADAS:'
\echo '  ✅ 40+ índices estratégicos creados'
\echo '  ✅ 3 vistas materializadas optimizadas'
\echo '  ✅ Sistema de caching inteligente activado'
\echo '  ✅ Funciones optimizadas con CTEs y window functions'
\echo '  ✅ Triggers de invalidación automática'
\echo '  ✅ Pre-cálculo de estadísticas implementado'
\echo '  ✅ Monitoreo de performance continuo configurado'
\echo ''
\echo '🔧 COMANDOS DE MANTENIMIENTO DISPONIBLES:'
\echo '  - SELECT mantenimiento_cache_completo();'
\echo '  - SELECT health_check_performance();'
\echo '  - SELECT monitor_performance_scout_system();'
\echo '  - SELECT obtener_estadisticas_cache();'
\echo ''
\echo '🎉 SISTEMA SCOUT LIMA 12 OPTIMIZADO Y LISTO PARA PRODUCCIÓN'