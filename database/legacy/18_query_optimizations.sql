-- ================================================================
-- 🚀 OPTIMIZACIÓN DE CONSULTAS COMPLEJAS - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: database/18_query_optimizations.sql
-- Propósito: Optimizar Database Functions con consultas pesadas
-- ================================================================

-- ============= 📊 VISTAS MATERIALIZADAS PARA PERFORMANCE =============

-- Vista materializada para estadísticas de scouts (se actualiza periódicamente)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_estadisticas_scouts AS
SELECT 
    rama_actual,
    COUNT(*) as total_scouts,
    COUNT(CASE WHEN estado = 'ACTIVO' THEN 1 END) as scouts_activos,
    COUNT(CASE WHEN estado = 'INACTIVO' THEN 1 END) as scouts_inactivos,
    ROUND(AVG(EXTRACT(YEAR FROM AGE(fecha_nacimiento))), 1) as edad_promedio,
    MIN(fecha_ingreso) as primer_ingreso,
    MAX(fecha_ingreso) as ultimo_ingreso,
    COUNT(CASE WHEN fecha_ingreso >= CURRENT_DATE - INTERVAL '1 year' THEN 1 END) as ingresos_ultimo_año
FROM scouts
GROUP BY rama_actual;

-- Índice en la vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_estadisticas_scouts_rama 
    ON mv_estadisticas_scouts(rama_actual);

-- Vista materializada para resumen de inventario
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_resumen_inventario AS
SELECT 
    categoria,
    COUNT(*) as total_items,
    COUNT(CASE WHEN estado_item = 'DISPONIBLE' THEN 1 END) as items_disponibles,
    COUNT(CASE WHEN estado_item = 'PRESTADO' THEN 1 END) as items_prestados,
    COUNT(CASE WHEN estado_item = 'EN_MANTENIMIENTO' THEN 1 END) as items_mantenimiento,
    COUNT(CASE WHEN cantidad_disponible <= cantidad_minima THEN 1 END) as items_stock_bajo,
    SUM(valor_unitario * cantidad_disponible) as valor_total_categoria,
    SUM(cantidad_disponible) as cantidad_total,
    AVG(valor_unitario) as valor_promedio
FROM inventario
GROUP BY categoria;

-- Índice en la vista materializada de inventario
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_resumen_inventario_categoria 
    ON mv_resumen_inventario(categoria);

-- Vista materializada para estadísticas de asistencia
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_estadisticas_asistencia AS
SELECT 
    s.rama_actual,
    s.id as scout_id,
    s.nombres || ' ' || s.apellidos as scout_nombre,
    COUNT(a.*) as total_reuniones,
    COUNT(CASE WHEN a.estado_asistencia = 'PRESENTE' THEN 1 END) as asistencias,
    COUNT(CASE WHEN a.estado_asistencia != 'PRESENTE' THEN 1 END) as ausencias,
    ROUND(
        CASE 
            WHEN COUNT(a.*) > 0 
            THEN (COUNT(CASE WHEN a.estado_asistencia = 'PRESENTE' THEN 1 END)::NUMERIC / COUNT(a.*) * 100)
            ELSE 0 
        END, 2
    ) as porcentaje_asistencia,
    MAX(a.fecha) as ultima_asistencia
FROM scouts s
LEFT JOIN asistencias a ON s.id = a.scout_id 
    AND a.fecha >= CURRENT_DATE - INTERVAL '1 year'
WHERE s.estado = 'ACTIVO'
GROUP BY s.rama_actual, s.id, s.nombres, s.apellidos;

-- Índice compuesto en la vista de asistencia
CREATE INDEX IF NOT EXISTS idx_mv_estadisticas_asistencia_rama_porcentaje 
    ON mv_estadisticas_asistencia(rama_actual, porcentaje_asistencia DESC);

-- ============= ⚡ FUNCIONES OPTIMIZADAS =============

-- Función optimizada para obtener estadísticas generales (usando vistas materializadas)
CREATE OR REPLACE FUNCTION obtener_estadisticas_optimizadas()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    -- Refrescar vistas materializadas si es necesario
    -- (Solo si han pasado más de 1 hora desde la última actualización)
    IF (
        SELECT COALESCE(
            EXTRACT(EPOCH FROM (NOW() - last_refresh))::INTEGER > 3600,
            true
        )
        FROM pg_matviews 
        WHERE matviewname = 'mv_estadisticas_scouts'
        LIMIT 1
    ) THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_scouts;
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_resumen_inventario;
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_asistencia;
    END IF;

    -- Construir respuesta usando vistas materializadas (mucho más rápido)
    SELECT json_build_object(
        'scouts', json_build_object(
            'por_rama', (
                SELECT json_object_agg(rama_actual, json_build_object(
                    'total', total_scouts,
                    'activos', scouts_activos,
                    'inactivos', scouts_inactivos,
                    'edad_promedio', edad_promedio,
                    'ingresos_ultimo_año', ingresos_ultimo_año
                ))
                FROM mv_estadisticas_scouts
            ),
            'totales', (
                SELECT json_build_object(
                    'total_general', SUM(total_scouts),
                    'activos_general', SUM(scouts_activos),
                    'inactivos_general', SUM(scouts_inactivos)
                )
                FROM mv_estadisticas_scouts
            )
        ),
        'inventario', json_build_object(
            'por_categoria', (
                SELECT json_object_agg(categoria, json_build_object(
                    'total_items', total_items,
                    'disponibles', items_disponibles,
                    'prestados', items_prestados,
                    'mantenimiento', items_mantenimiento,
                    'stock_bajo', items_stock_bajo,
                    'valor_total', valor_total_categoria
                ))
                FROM mv_resumen_inventario
            ),
            'totales', (
                SELECT json_build_object(
                    'items_total', SUM(total_items),
                    'valor_total', SUM(valor_total_categoria),
                    'items_stock_bajo', SUM(items_stock_bajo)
                )
                FROM mv_resumen_inventario
            )
        ),
        'asistencia', json_build_object(
            'promedio_general', (
                SELECT ROUND(AVG(porcentaje_asistencia), 2)
                FROM mv_estadisticas_asistencia
            ),
            'por_rama', (
                SELECT json_object_agg(rama_actual, json_build_object(
                    'scouts_total', COUNT(*),
                    'promedio_asistencia', ROUND(AVG(porcentaje_asistencia), 2),
                    'scouts_asistencia_alta', COUNT(CASE WHEN porcentaje_asistencia >= 80 THEN 1 END),
                    'scouts_asistencia_baja', COUNT(CASE WHEN porcentaje_asistencia < 60 THEN 1 END)
                ))
                FROM mv_estadisticas_asistencia
                GROUP BY rama_actual
            )
        ),
        'ultima_actualizacion', NOW()
    ) INTO v_resultado;

    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ============= 📊 OPTIMIZACIÓN DE REPORTES COMPLEJOS =============

-- Función optimizada para análisis de tendencias con CTEs
CREATE OR REPLACE FUNCTION analizar_tendencias_optimizado(
    p_periodo_meses INTEGER DEFAULT 12
)
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    -- Usar CTEs para optimizar consultas complejas
    WITH datos_base AS (
        -- Precalcular fechas para evitar repetir cálculos
        SELECT 
            CURRENT_DATE as fecha_actual,
            CURRENT_DATE - (p_periodo_meses || ' months')::INTERVAL as fecha_inicio
    ),
    scouts_por_mes AS (
        SELECT 
            DATE_TRUNC('month', s.fecha_ingreso) as mes,
            s.rama_actual,
            COUNT(*) as nuevos_scouts
        FROM scouts s, datos_base db
        WHERE s.fecha_ingreso >= db.fecha_inicio
        GROUP BY DATE_TRUNC('month', s.fecha_ingreso), s.rama_actual
    ),
    actividades_por_mes AS (
        SELECT 
            DATE_TRUNC('month', a.fecha_inicio) as mes,
            a.rama_objetivo,
            COUNT(*) as actividades_realizadas,
            COUNT(DISTINCT ia.scout_id) as scouts_participantes,
            AVG(ea.calificacion_general) as evaluacion_promedio
        FROM actividades_scout a, datos_base db
        LEFT JOIN inscripciones_actividad ia ON a.id = ia.actividad_id 
            AND ia.estado = 'ACTIVO'
        LEFT JOIN evaluaciones_actividad ea ON a.id = ea.actividad_id
        WHERE a.fecha_inicio >= db.fecha_inicio
        AND a.estado = 'FINALIZADA'
        GROUP BY DATE_TRUNC('month', a.fecha_inicio), a.rama_objetivo
    ),
    asistencia_por_mes AS (
        SELECT 
            DATE_TRUNC('month', a.fecha) as mes,
            s.rama_actual,
            COUNT(*) as total_asistencias_registradas,
            COUNT(CASE WHEN a.estado_asistencia = 'PRESENTE' THEN 1 END) as asistencias_efectivas,
            ROUND(AVG(CASE WHEN a.estado_asistencia = 'PRESENTE' THEN 100.0 ELSE 0.0 END), 2) as porcentaje_asistencia
        FROM asistencias a, datos_base db
        INNER JOIN scouts s ON a.scout_id = s.id
        WHERE a.fecha >= db.fecha_inicio
        GROUP BY DATE_TRUNC('month', a.fecha), s.rama_actual
    )
    SELECT json_build_object(
        'configuracion', json_build_object(
            'periodo_meses', p_periodo_meses,
            'fecha_inicio', (SELECT fecha_inicio FROM datos_base LIMIT 1),
            'fecha_actual', (SELECT fecha_actual FROM datos_base LIMIT 1)
        ),
        'tendencias_mensuales', json_build_object(
            'nuevos_scouts', (
                SELECT json_agg(
                    json_build_object(
                        'mes', mes,
                        'rama', rama_actual,
                        'nuevos_scouts', nuevos_scouts
                    ) ORDER BY mes, rama_actual
                )
                FROM scouts_por_mes
            ),
            'actividades', (
                SELECT json_agg(
                    json_build_object(
                        'mes', mes,
                        'rama', rama_objetivo,
                        'actividades', actividades_realizadas,
                        'participantes', scouts_participantes,
                        'evaluacion_promedio', ROUND(evaluacion_promedio, 2)
                    ) ORDER BY mes, rama_objetivo
                )
                FROM actividades_por_mes
            ),
            'asistencia', (
                SELECT json_agg(
                    json_build_object(
                        'mes', mes,
                        'rama', rama_actual,
                        'porcentaje_asistencia', porcentaje_asistencia,
                        'total_registros', total_asistencias_registradas
                    ) ORDER BY mes, rama_actual
                )
                FROM asistencia_por_mes
            )
        ),
        'indicadores_clave', json_build_object(
            'crecimiento_scouts', (
                SELECT ROUND(
                    (LAST_VALUE(nuevos_scouts) OVER (ORDER BY mes ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) -
                     FIRST_VALUE(nuevos_scouts) OVER (ORDER BY mes ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING))::NUMERIC /
                    FIRST_VALUE(nuevos_scouts) OVER (ORDER BY mes ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) * 100, 2
                )
                FROM scouts_por_mes
                ORDER BY mes DESC
                LIMIT 1
            ),
            'tendencia_actividades', (
                SELECT 
                    CASE 
                        WHEN AVG(actividades_realizadas) > LAG(AVG(actividades_realizadas)) OVER (ORDER BY mes) 
                        THEN 'CRECIENTE'
                        ELSE 'ESTABLE'
                    END
                FROM actividades_por_mes
                GROUP BY mes
                ORDER BY mes DESC
                LIMIT 1
            )
        )
    ) INTO v_resultado;

    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ============= 🔍 OPTIMIZACIÓN DE BÚSQUEDAS =============

-- Función optimizada para búsquedas de texto usando índices GIN
CREATE OR REPLACE FUNCTION buscar_scouts_optimizado(
    p_termino_busqueda TEXT,
    p_limite INTEGER DEFAULT 50
)
RETURNS TABLE(
    scout_id UUID,
    nombre_completo TEXT,
    documento_identidad VARCHAR(20),
    rama rama_enum,
    estado VARCHAR(50),
    similarity_score REAL
) AS $$
BEGIN
    -- Usar índice GIN para búsquedas de texto eficientes
    RETURN QUERY
    SELECT 
        s.id as scout_id,
        (s.nombres || ' ' || s.apellidos)::TEXT as nombre_completo,
        s.numero_documento,
        s.rama_actual,
        s.estado,
        similarity(s.nombres || ' ' || s.apellidos, p_termino_busqueda) as similarity_score
    FROM scouts s
    WHERE 
        -- Búsqueda por similitud (índice GIN)
        (s.nombres || ' ' || s.apellidos) % p_termino_busqueda
        OR
        -- Búsqueda exacta en documento
        s.numero_documento ILIKE '%' || p_termino_busqueda || '%'
    ORDER BY 
        similarity(s.nombres || ' ' || s.apellidos, p_termino_busqueda) DESC,
        s.nombres
    LIMIT p_limite;
END;
$$ LANGUAGE plpgsql;

-- ============= 📦 OPTIMIZACIÓN DE INVENTARIO =============

-- Función optimizada para movimientos de inventario con window functions
CREATE OR REPLACE FUNCTION obtener_historial_inventario_optimizado(
    p_item_id UUID,
    p_limite INTEGER DEFAULT 100
)
RETURNS TABLE(
    movimiento_id UUID,
    tipo_movimiento VARCHAR(50),
    cantidad INTEGER,
    fecha_movimiento TIMESTAMP WITH TIME ZONE,
    usuario_responsable VARCHAR(255),
    observaciones TEXT,
    stock_acumulado BIGINT,
    dias_desde_anterior INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH movimientos_con_stock AS (
        SELECT 
            mi.id as movimiento_id,
            mi.tipo_movimiento,
            mi.cantidad,
            mi.created_at as fecha_movimiento,
            COALESCE(d.nombres || ' ' || d.apellidos, 'Sistema') as usuario_responsable,
            mi.motivo as observaciones,
            -- Calcular stock acumulado usando window function
            SUM(
                CASE 
                    WHEN mi.tipo_movimiento IN ('ENTRADA', 'DEVOLUCION') THEN mi.cantidad
                    WHEN mi.tipo_movimiento IN ('SALIDA', 'PERDIDA', 'DAÑO') THEN -mi.cantidad
                    WHEN mi.tipo_movimiento = 'AJUSTE' THEN 
                        CASE WHEN mi.cantidad > mi.cantidad_anterior THEN (mi.cantidad - mi.cantidad_anterior)
                             ELSE -(mi.cantidad_anterior - mi.cantidad) END
                    ELSE 0
                END
            ) OVER (
                ORDER BY mi.created_at, mi.id 
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) as stock_acumulado,
            -- Calcular días desde el movimiento anterior
            EXTRACT(DAY FROM (
                mi.created_at - 
                LAG(mi.created_at) OVER (ORDER BY mi.created_at)
            ))::INTEGER as dias_desde_anterior
        FROM movimientos_inventario mi
        LEFT JOIN dirigentes d ON mi.realizado_por_id = d.id
        WHERE mi.item_id = p_item_id
        ORDER BY mi.created_at DESC, mi.id DESC
        LIMIT p_limite
    )
    SELECT * FROM movimientos_con_stock;
END;
$$ LANGUAGE plpgsql;

-- ============= 🏆 OPTIMIZACIÓN DE RANKINGS =============

-- Función optimizada para ranking de patrullas con window functions
CREATE OR REPLACE FUNCTION obtener_ranking_patrullas_optimizado()
RETURNS TABLE(
    patrulla_id UUID,
    nombre_patrulla VARCHAR(100),
    total_puntos BIGINT,
    puntos_ultimo_mes BIGINT,
    total_miembros BIGINT,
    puntos_por_miembro NUMERIC,
    posicion_ranking INTEGER,
    cambio_posicion INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH puntos_actuales AS (
        SELECT 
            p.id,
            p.nombre,
            COALESCE(SUM(pp.puntos_obtenidos), 0) as total_puntos,
            COALESCE(SUM(CASE 
                WHEN pp.fecha_otorgamiento >= CURRENT_DATE - INTERVAL '1 month' 
                THEN pp.puntos_obtenidos ELSE 0 
            END), 0) as puntos_ultimo_mes
        FROM patrullas p
        LEFT JOIN puntos_patrulla pp ON p.id = pp.patrulla_id
        WHERE p.estado = 'ACTIVO'
        GROUP BY p.id, p.nombre
    ),
    miembros_count AS (
        SELECT 
            mp.patrulla_id,
            COUNT(*) as total_miembros
        FROM miembros_patrulla mp
        WHERE mp.estado_miembro = 'ACTIVO'
        GROUP BY mp.patrulla_id
    ),
    puntos_mes_anterior AS (
        SELECT 
            p.id,
            COALESCE(SUM(pp.puntos_obtenidos), 0) as puntos_mes_anterior
        FROM patrullas p
        LEFT JOIN puntos_patrulla pp ON p.id = pp.patrulla_id
            AND pp.fecha_otorgamiento < CURRENT_DATE - INTERVAL '1 month'
            AND pp.fecha_otorgamiento >= CURRENT_DATE - INTERVAL '2 months'
        WHERE p.estado = 'ACTIVO'
        GROUP BY p.id
    ),
    ranking_actual AS (
        SELECT 
            pa.id as patrulla_id,
            pa.nombre as nombre_patrulla,
            pa.total_puntos,
            pa.puntos_ultimo_mes,
            COALESCE(mc.total_miembros, 0) as total_miembros,
            CASE 
                WHEN COALESCE(mc.total_miembros, 0) > 0 
                THEN ROUND(pa.total_puntos::NUMERIC / mc.total_miembros, 2)
                ELSE 0 
            END as puntos_por_miembro,
            ROW_NUMBER() OVER (ORDER BY pa.total_puntos DESC) as posicion_actual
        FROM puntos_actuales pa
        LEFT JOIN miembros_count mc ON pa.id = mc.patrulla_id
    ),
    ranking_anterior AS (
        SELECT 
            p.id,
            ROW_NUMBER() OVER (ORDER BY COALESCE(pma.puntos_mes_anterior, 0) DESC) as posicion_anterior
        FROM patrullas p
        LEFT JOIN puntos_mes_anterior pma ON p.id = pma.id
        WHERE p.estado = 'ACTIVO'
    )
    SELECT 
        ra.patrulla_id,
        ra.nombre_patrulla,
        ra.total_puntos,
        ra.puntos_ultimo_mes,
        ra.total_miembros,
        ra.puntos_por_miembro,
        ra.posicion_actual::INTEGER as posicion_ranking,
        (COALESCE(rant.posicion_anterior, ra.posicion_actual) - ra.posicion_actual)::INTEGER as cambio_posicion
    FROM ranking_actual ra
    LEFT JOIN ranking_anterior rant ON ra.patrulla_id = rant.id
    ORDER BY ra.posicion_actual;
END;
$$ LANGUAGE plpgsql;

-- ============= 🔄 MANTENIMIENTO AUTOMATIZADO =============

-- Función para refrescar vistas materializadas de forma inteligente
CREATE OR REPLACE FUNCTION mantener_vistas_materializadas()
RETURNS TEXT AS $$
DECLARE
    v_mensaje TEXT := '';
    v_count INTEGER;
BEGIN
    -- Verificar si hay cambios significativos antes de refrescar
    
    -- Refrescar estadísticas de scouts si hay cambios recientes
    SELECT COUNT(*) INTO v_count 
    FROM scouts 
    WHERE updated_at > NOW() - INTERVAL '1 hour';
    
    IF v_count > 0 THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_scouts;
        v_mensaje := v_mensaje || 'Estadísticas de scouts actualizadas. ';
    END IF;
    
    -- Refrescar inventario si hay movimientos recientes
    SELECT COUNT(*) INTO v_count 
    FROM movimientos_inventario 
    WHERE created_at > NOW() - INTERVAL '1 hour';
    
    IF v_count > 0 THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_resumen_inventario;
        v_mensaje := v_mensaje || 'Resumen de inventario actualizado. ';
    END IF;
    
    -- Refrescar asistencia si hay registros recientes
    SELECT COUNT(*) INTO v_count 
    FROM asistencias 
    WHERE created_at > NOW() - INTERVAL '1 hour';
    
    IF v_count > 0 THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_asistencia;
        v_mensaje := v_mensaje || 'Estadísticas de asistencia actualizadas. ';
    END IF;
    
    IF LENGTH(v_mensaje) = 0 THEN
        v_mensaje := 'No se requirieron actualizaciones.';
    END IF;
    
    RETURN v_mensaje;
END;
$$ LANGUAGE plpgsql;

-- ============= 📊 FUNCIÓN DE HEALTH CHECK DE PERFORMANCE =============

CREATE OR REPLACE FUNCTION health_check_performance()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
    v_slow_queries INTEGER;
    v_index_usage NUMERIC;
    v_cache_hit_ratio NUMERIC;
BEGIN
    -- Verificar consultas lentas
    SELECT COUNT(*) INTO v_slow_queries
    FROM pg_stat_activity 
    WHERE state = 'active' 
    AND query_start < NOW() - INTERVAL '5 seconds'
    AND query NOT LIKE '%pg_stat%';
    
    -- Calcular ratio de uso de índices
    SELECT 
        ROUND(
            100.0 * SUM(idx_scan) / NULLIF(SUM(seq_scan + idx_scan), 0), 2
        ) INTO v_index_usage
    FROM pg_stat_user_tables;
    
    -- Calcular cache hit ratio
    SELECT 
        ROUND(
            100.0 * SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0), 2
        ) INTO v_cache_hit_ratio
    FROM pg_statio_user_tables;
    
    SELECT json_build_object(
        'timestamp', NOW(),
        'performance_metrics', json_build_object(
            'consultas_activas_lentas', v_slow_queries,
            'uso_indices_porcentaje', COALESCE(v_index_usage, 0),
            'cache_hit_ratio_porcentaje', COALESCE(v_cache_hit_ratio, 0),
            'conexiones_activas', (
                SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'
            ),
            'tamaño_base_datos_mb', (
                SELECT ROUND(pg_database_size(current_database())::NUMERIC / 1024 / 1024, 2)
            )
        ),
        'recomendaciones', json_build_array(
            CASE 
                WHEN COALESCE(v_index_usage, 0) < 95 
                THEN 'Considerar agregar más índices - uso actual: ' || COALESCE(v_index_usage, 0) || '%'
                ELSE 'Uso de índices óptimo'
            END,
            CASE 
                WHEN COALESCE(v_cache_hit_ratio, 0) < 99 
                THEN 'Considerar aumentar shared_buffers - cache hit ratio: ' || COALESCE(v_cache_hit_ratio, 0) || '%'
                ELSE 'Cache hit ratio óptimo'
            END,
            CASE 
                WHEN v_slow_queries > 5 
                THEN 'Hay ' || v_slow_queries || ' consultas lentas activas - revisar'
                ELSE 'No hay consultas lentas detectadas'
            END
        ),
        'status', 
            CASE 
                WHEN COALESCE(v_index_usage, 0) >= 95 
                 AND COALESCE(v_cache_hit_ratio, 0) >= 99 
                 AND v_slow_queries <= 2
                THEN 'OPTIMO'
                WHEN COALESCE(v_index_usage, 0) >= 90 
                 AND COALESCE(v_cache_hit_ratio, 0) >= 95
                THEN 'BUENO'
                ELSE 'REQUIERE_ATENCION'
            END
    ) INTO v_resultado;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '🚀 OPTIMIZACIONES DE CONSULTAS IMPLEMENTADAS' as estado,
    'Vistas materializadas, CTEs optimizados y funciones de performance creadas' as mensaje,
    'Performance mejorado significativamente' as resumen;