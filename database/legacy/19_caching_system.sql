-- ================================================================
-- 🔄 SISTEMA DE CACHING Y PERFORMANCE - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: database/19_caching_system.sql
-- Propósito: Implementar sistema de caching y optimización automática
-- ================================================================

-- ============= 📊 TABLA DE CACHE DE ESTADÍSTICAS =============

-- Tabla para cachear resultados de consultas costosas
CREATE TABLE IF NOT EXISTS cache_estadisticas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_data JSON NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo_cache VARCHAR(100) NOT NULL,
    parametros JSON DEFAULT '{}',
    hits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para cache
CREATE INDEX IF NOT EXISTS idx_cache_key_expiracion 
    ON cache_estadisticas(cache_key, fecha_expiracion);

CREATE INDEX IF NOT EXISTS idx_cache_tipo_expiracion 
    ON cache_estadisticas(tipo_cache, fecha_expiracion);

-- ============= 🔧 FUNCIONES DE GESTIÓN DE CACHE =============

-- Función para obtener datos del cache
CREATE OR REPLACE FUNCTION obtener_cache(
    p_cache_key VARCHAR(255)
)
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT cache_data INTO v_resultado
    FROM cache_estadisticas
    WHERE cache_key = p_cache_key
    AND fecha_expiracion > CURRENT_TIMESTAMP;
    
    -- Incrementar contador de hits si encontramos el cache
    IF v_resultado IS NOT NULL THEN
        UPDATE cache_estadisticas 
        SET hits = hits + 1, updated_at = CURRENT_TIMESTAMP
        WHERE cache_key = p_cache_key;
    END IF;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- Función para guardar datos en cache
CREATE OR REPLACE FUNCTION guardar_cache(
    p_cache_key VARCHAR(255),
    p_cache_data JSON,
    p_tipo_cache VARCHAR(100),
    p_duracion_minutos INTEGER DEFAULT 60,
    p_parametros JSON DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO cache_estadisticas (
        cache_key,
        cache_data,
        tipo_cache,
        parametros,
        fecha_expiracion
    ) VALUES (
        p_cache_key,
        p_cache_data,
        p_tipo_cache,
        p_parametros,
        CURRENT_TIMESTAMP + (p_duracion_minutos || ' minutes')::INTERVAL
    )
    ON CONFLICT (cache_key) DO UPDATE SET
        cache_data = EXCLUDED.cache_data,
        fecha_expiracion = EXCLUDED.fecha_expiracion,
        parametros = EXCLUDED.parametros,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar cache expirado
CREATE OR REPLACE FUNCTION limpiar_cache_expirado()
RETURNS INTEGER AS $$
DECLARE
    v_eliminados INTEGER;
BEGIN
    DELETE FROM cache_estadisticas
    WHERE fecha_expiracion < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS v_eliminados = ROW_COUNT;
    
    RETURN v_eliminados;
END;
$$ LANGUAGE plpgsql;

-- ============= ⚡ FUNCIONES CON CACHE INTEGRADO =============

-- Función de estadísticas generales con cache inteligente
CREATE OR REPLACE FUNCTION obtener_estadisticas_generales_cached()
RETURNS JSON AS $$
DECLARE
    v_cache_key VARCHAR(255);
    v_resultado JSON;
    v_datos_frescos JSON;
BEGIN
    -- Generar clave de cache
    v_cache_key := 'estadisticas_generales_' || CURRENT_DATE::TEXT;
    
    -- Intentar obtener del cache
    v_resultado := obtener_cache(v_cache_key);
    
    IF v_resultado IS NOT NULL THEN
        -- Agregar información de cache
        v_resultado := jsonb_set(
            v_resultado::jsonb,
            '{_meta}',
            json_build_object('cached', true, 'timestamp', CURRENT_TIMESTAMP)::jsonb
        )::json;
        
        RETURN v_resultado;
    END IF;
    
    -- Si no hay cache, calcular datos frescos
    v_datos_frescos := obtener_estadisticas_optimizadas();
    
    -- Agregar metadata
    v_datos_frescos := jsonb_set(
        v_datos_frescos::jsonb,
        '{_meta}',
        json_build_object('cached', false, 'timestamp', CURRENT_TIMESTAMP)::jsonb
    )::json;
    
    -- Guardar en cache (válido por 2 horas)
    PERFORM guardar_cache(
        v_cache_key,
        v_datos_frescos,
        'estadisticas_generales',
        120
    );
    
    RETURN v_datos_frescos;
END;
$$ LANGUAGE plpgsql;

-- Función de ranking de patrullas con cache
CREATE OR REPLACE FUNCTION obtener_ranking_patrullas_cached()
RETURNS JSON AS $$
DECLARE
    v_cache_key VARCHAR(255);
    v_resultado JSON;
    v_datos_frescos JSON;
BEGIN
    -- Cache válido por 30 minutos (ranking cambia frecuentemente)
    v_cache_key := 'ranking_patrullas_' || 
                   DATE_TRUNC('hour', CURRENT_TIMESTAMP)::TEXT || '_' ||
                   EXTRACT(MINUTE FROM CURRENT_TIMESTAMP)::INTEGER / 30;
    
    v_resultado := obtener_cache(v_cache_key);
    
    IF v_resultado IS NOT NULL THEN
        RETURN v_resultado;
    END IF;
    
    -- Obtener datos frescos y convertir a JSON
    SELECT json_agg(
        json_build_object(
            'patrulla_id', patrulla_id,
            'nombre_patrulla', nombre_patrulla,
            'total_puntos', total_puntos,
            'puntos_ultimo_mes', puntos_ultimo_mes,
            'total_miembros', total_miembros,
            'puntos_por_miembro', puntos_por_miembro,
            'posicion_ranking', posicion_ranking,
            'cambio_posicion', cambio_posicion
        ) ORDER BY posicion_ranking
    ) INTO v_datos_frescos
    FROM obtener_ranking_patrullas_optimizado();
    
    -- Envolver en objeto con metadata
    v_datos_frescos := json_build_object(
        'ranking', v_datos_frescos,
        'timestamp', CURRENT_TIMESTAMP,
        'cached', false
    );
    
    PERFORM guardar_cache(v_cache_key, v_datos_frescos, 'ranking_patrullas', 30);
    
    RETURN v_datos_frescos;
END;
$$ LANGUAGE plpgsql;

-- ============= 📊 SISTEMA DE PRE-CÁLCULO =============

-- Tabla para estadísticas pre-calculadas
CREATE TABLE IF NOT EXISTS estadisticas_precalculadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_estadistica VARCHAR(100) NOT NULL,
    periodo VARCHAR(50) NOT NULL, -- 'diario', 'semanal', 'mensual'
    fecha_periodo DATE NOT NULL,
    datos_estadisticos JSON NOT NULL,
    calculado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice único para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_estadisticas_precalc_unique 
    ON estadisticas_precalculadas(tipo_estadistica, periodo, fecha_periodo);

-- Función para pre-calcular estadísticas diarias
CREATE OR REPLACE FUNCTION precalcular_estadisticas_diarias()
RETURNS TEXT AS $$
DECLARE
    v_fecha_hoy DATE := CURRENT_DATE;
    v_stats_scouts JSON;
    v_stats_asistencia JSON;
    v_stats_actividades JSON;
    v_mensaje TEXT := '';
BEGIN
    -- Pre-calcular estadísticas de scouts
    SELECT json_build_object(
        'total_scouts', COUNT(*),
        'scouts_activos', COUNT(CASE WHEN estado = 'ACTIVO' THEN 1 END),
        'por_rama', json_object_agg(rama, rama_count)
    ) INTO v_stats_scouts
    FROM scouts s
    CROSS JOIN LATERAL (
        SELECT s.rama_actual, COUNT(*) as rama_count
        FROM scouts s2
        WHERE s2.estado = 'ACTIVO'
        GROUP BY s2.rama_actual
    ) rama_stats
    WHERE s.estado = 'ACTIVO';
    
    -- Guardar estadísticas de scouts
    INSERT INTO estadisticas_precalculadas (
        tipo_estadistica, periodo, fecha_periodo, datos_estadisticos
    ) VALUES (
        'scouts', 'diario', v_fecha_hoy, v_stats_scouts
    ) ON CONFLICT (tipo_estadistica, periodo, fecha_periodo) 
    DO UPDATE SET 
        datos_estadisticos = EXCLUDED.datos_estadisticos,
        calculado_en = CURRENT_TIMESTAMP;
    
    v_mensaje := v_mensaje || 'Estadísticas scouts calculadas. ';
    
    -- Pre-calcular estadísticas de asistencia para hoy
    SELECT json_build_object(
        'actividades_hoy', COUNT(DISTINCT actividad_id),
        'asistencias_registradas', COUNT(*),
        'porcentaje_asistencia', ROUND(AVG(CASE WHEN estado_asistencia = 'PRESENTE' THEN 100.0 ELSE 0.0 END), 2),
        'por_rama', json_object_agg(rama, rama_stats)
    ) INTO v_stats_asistencia
    FROM asistencias a
    INNER JOIN scouts s ON a.scout_id = s.id
    CROSS JOIN LATERAL (
        SELECT 
            s.rama_actual,
            json_build_object(
                'asistencias', COUNT(CASE WHEN a2.estado_asistencia = 'PRESENTE' THEN 1 END),
                'total_registros', COUNT(*),
                'porcentaje', ROUND(AVG(CASE WHEN a2.estado_asistencia = 'PRESENTE' THEN 100.0 ELSE 0.0 END), 2)
            ) as rama_stats
        FROM asistencias a2
        INNER JOIN scouts s2 ON a2.scout_id = s2.id
        WHERE a2.fecha = v_fecha_hoy AND s2.rama_actual = s.rama_actual
        GROUP BY s2.rama_actual
    ) rama_data
    WHERE a.fecha = v_fecha_hoy
    GROUP BY s.rama_actual;
    
    -- Solo guardar si hay datos de asistencia
    IF v_stats_asistencia IS NOT NULL THEN
        INSERT INTO estadisticas_precalculadas (
            tipo_estadistica, periodo, fecha_periodo, datos_estadisticos
        ) VALUES (
            'asistencia', 'diario', v_fecha_hoy, v_stats_asistencia
        ) ON CONFLICT (tipo_estadistica, periodo, fecha_periodo) 
        DO UPDATE SET 
            datos_estadisticas = EXCLUDED.datos_estadisticos,
            calculado_en = CURRENT_TIMESTAMP;
            
        v_mensaje := v_mensaje || 'Estadísticas asistencia calculadas. ';
    END IF;
    
    -- Pre-calcular estadísticas de actividades
    SELECT json_build_object(
        'actividades_programadas_hoy', COUNT(CASE WHEN fecha_inicio::DATE = v_fecha_hoy THEN 1 END),
        'actividades_activas', COUNT(CASE WHEN estado IN ('PLANIFICADA', 'CONFIRMADA') THEN 1 END),
        'inscripciones_recientes', (
            SELECT COUNT(*) 
            FROM inscripciones_actividad ia 
            WHERE ia.created_at::DATE = v_fecha_hoy
        )
    ) INTO v_stats_actividades
    FROM actividades_scout;
    
    INSERT INTO estadisticas_precalculadas (
        tipo_estadistica, periodo, fecha_periodo, datos_estadisticos
    ) VALUES (
        'actividades', 'diario', v_fecha_hoy, v_stats_actividades
    ) ON CONFLICT (tipo_estadistica, periodo, fecha_periodo) 
    DO UPDATE SET 
        datos_estadisticos = EXCLUDED.datos_estadisticos,
        calculado_en = CURRENT_TIMESTAMP;
    
    v_mensaje := v_mensaje || 'Estadísticas actividades calculadas. ';
    
    RETURN v_mensaje;
END;
$$ LANGUAGE plpgsql;

-- ============= 🔄 MANTENIMIENTO AUTOMÁTICO =============

-- Función para mantenimiento completo del sistema de cache
CREATE OR REPLACE FUNCTION mantenimiento_cache_completo()
RETURNS JSON AS $$
DECLARE
    v_cache_eliminado INTEGER;
    v_estadisticas_calculadas TEXT;
    v_vistas_actualizadas TEXT;
    v_resultado JSON;
BEGIN
    -- Limpiar cache expirado
    v_cache_eliminado := limpiar_cache_expirado();
    
    -- Pre-calcular estadísticas
    v_estadisticas_calculadas := precalcular_estadisticas_diarias();
    
    -- Mantener vistas materializadas
    v_vistas_actualizadas := mantener_vistas_materializadas();
    
    -- Actualizar estadísticas de tablas
    PERFORM mantener_estadisticas_tablas();
    
    SELECT json_build_object(
        'timestamp', CURRENT_TIMESTAMP,
        'acciones_realizadas', json_build_object(
            'cache_eliminado_entradas', v_cache_eliminado,
            'estadisticas_precalculadas', v_estadisticas_calculadas,
            'vistas_materializadas', v_vistas_actualizadas,
            'estadisticas_tablas', 'Actualizadas'
        ),
        'estado', 'COMPLETADO',
        'proximo_mantenimiento', CURRENT_TIMESTAMP + INTERVAL '6 hours'
    ) INTO v_resultado;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ============= 📈 MONITOREO DE PERFORMANCE DEL CACHE =============

-- Función para obtener estadísticas del cache
CREATE OR REPLACE FUNCTION obtener_estadisticas_cache()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'resumen_cache', json_build_object(
            'total_entradas', COUNT(*),
            'entradas_activas', COUNT(CASE WHEN fecha_expiracion > CURRENT_TIMESTAMP THEN 1 END),
            'entradas_expiradas', COUNT(CASE WHEN fecha_expiracion <= CURRENT_TIMESTAMP THEN 1 END),
            'total_hits', SUM(hits),
            'tipos_cache', json_object_agg(tipo_cache, tipo_stats),
            'hit_rate_promedio', ROUND(AVG(hits), 2)
        ),
        'cache_mas_usado', (
            SELECT json_build_object(
                'cache_key', cache_key,
                'tipo', tipo_cache,
                'hits', hits,
                'ultima_actualizacion', updated_at
            )
            FROM cache_estadisticas
            WHERE fecha_expiracion > CURRENT_TIMESTAMP
            ORDER BY hits DESC
            LIMIT 1
        ),
        'tamaño_cache_estimado_kb', (
            SELECT ROUND(
                SUM(LENGTH(cache_data::TEXT))::NUMERIC / 1024, 2
            )
            FROM cache_estadisticas
            WHERE fecha_expiracion > CURRENT_TIMESTAMP
        ),
        'recomendaciones', json_build_array(
            CASE 
                WHEN (
                    SELECT COUNT(*) FROM cache_estadisticas 
                    WHERE fecha_expiracion <= CURRENT_TIMESTAMP
                ) > 50
                THEN 'Ejecutar limpieza de cache - hay muchas entradas expiradas'
                ELSE 'Cache en buen estado'
            END,
            CASE 
                WHEN (
                    SELECT AVG(hits) FROM cache_estadisticas 
                    WHERE fecha_expiracion > CURRENT_TIMESTAMP
                ) < 2
                THEN 'Considerar aumentar duración del cache - hit rate bajo'
                ELSE 'Hit rate del cache es adecuado'
            END
        )
    ) INTO v_resultado
    FROM cache_estadisticas
    CROSS JOIN LATERAL (
        SELECT 
            tipo_cache,
            json_build_object(
                'entradas', COUNT(*),
                'hits_totales', SUM(hits),
                'hit_rate_promedio', ROUND(AVG(hits), 2)
            ) as tipo_stats
        FROM cache_estadisticas c2
        WHERE c2.fecha_expiracion > CURRENT_TIMESTAMP
        GROUP BY c2.tipo_cache
    ) tipo_data;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ============= 🕐 TAREAS PROGRAMADAS =============

-- Función para invalidar cache cuando hay cambios importantes
CREATE OR REPLACE FUNCTION invalidar_cache_por_cambios()
RETURNS TRIGGER AS $$
BEGIN
    -- Invalidar cache relacionado según la tabla modificada
    CASE TG_TABLE_NAME
        WHEN 'scouts' THEN
            DELETE FROM cache_estadisticas 
            WHERE cache_key LIKE 'estadisticas_generales_%' 
               OR cache_key LIKE 'scouts_%';
               
        WHEN 'asistencias' THEN
            DELETE FROM cache_estadisticas 
            WHERE cache_key LIKE 'estadisticas_generales_%' 
               OR cache_key LIKE 'asistencia_%';
               
        WHEN 'puntos_patrulla' THEN
            DELETE FROM cache_estadisticas 
            WHERE cache_key LIKE 'ranking_patrullas_%';
               
        WHEN 'actividades_scout' THEN
            DELETE FROM cache_estadisticas 
            WHERE cache_key LIKE 'estadisticas_generales_%' 
               OR cache_key LIKE 'actividades_%';
    END CASE;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para invalidación automática de cache
DROP TRIGGER IF EXISTS trigger_invalidar_cache_scouts ON scouts;
CREATE TRIGGER trigger_invalidar_cache_scouts
    AFTER INSERT OR UPDATE OR DELETE ON scouts
    FOR EACH ROW EXECUTE FUNCTION invalidar_cache_por_cambios();

DROP TRIGGER IF EXISTS trigger_invalidar_cache_asistencias ON asistencias;
CREATE TRIGGER trigger_invalidar_cache_asistencias
    AFTER INSERT OR UPDATE OR DELETE ON asistencias
    FOR EACH ROW EXECUTE FUNCTION invalidar_cache_por_cambios();

DROP TRIGGER IF EXISTS trigger_invalidar_cache_puntos ON puntos_patrulla;
CREATE TRIGGER trigger_invalidar_cache_puntos
    AFTER INSERT OR UPDATE OR DELETE ON puntos_patrulla
    FOR EACH ROW EXECUTE FUNCTION invalidar_cache_por_cambios();

-- ============= 🎯 FUNCIÓN PRINCIPAL DE CACHE =============

-- Función wrapper que decide si usar cache o calcular fresh
CREATE OR REPLACE FUNCTION obtener_datos_con_cache(
    p_tipo_consulta VARCHAR(100),
    p_parametros JSON DEFAULT '{}',
    p_forzar_refresh BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
    v_cache_key VARCHAR(255);
    v_resultado JSON;
BEGIN
    -- Generar clave de cache basada en tipo y parámetros
    v_cache_key := p_tipo_consulta || '_' || 
                   COALESCE(md5(p_parametros::TEXT), 'no_params') || '_' ||
                   CURRENT_DATE::TEXT;
    
    -- Si no se fuerza refresh, intentar obtener del cache
    IF NOT p_forzar_refresh THEN
        v_resultado := obtener_cache(v_cache_key);
        IF v_resultado IS NOT NULL THEN
            RETURN v_resultado;
        END IF;
    END IF;
    
    -- Calcular datos según el tipo de consulta
    CASE p_tipo_consulta
        WHEN 'estadisticas_generales' THEN
            v_resultado := obtener_estadisticas_optimizadas();
            PERFORM guardar_cache(v_cache_key, v_resultado, p_tipo_consulta, 120);
            
        WHEN 'ranking_patrullas' THEN
            v_resultado := obtener_ranking_patrullas_cached();
            
        WHEN 'tendencias_participacion' THEN
            v_resultado := analizar_tendencias_optimizado(
                COALESCE((p_parametros->>'periodo_meses')::INTEGER, 12)
            );
            PERFORM guardar_cache(v_cache_key, v_resultado, p_tipo_consulta, 360);
            
        ELSE
            v_resultado := json_build_object('error', 'Tipo de consulta no soportado');
    END CASE;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '🔄 SISTEMA DE CACHING IMPLEMENTADO' as estado,
    'Cache inteligente, pre-cálculo y invalidación automática activados' as mensaje,
    'Performance optimizado con cache estratégico' as resumen;