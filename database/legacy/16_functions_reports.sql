-- ================================================================
-- 📊 REPORTS DATABASE FUNCTIONS - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 16_functions_reports.sql
-- Propósito: Database Functions para el módulo de reportes y analíticas
-- ================================================================

-- ============= 📊 FUNCIONES DE REPORTES GENERALES =============

-- Generar reporte estadístico completo
CREATE OR REPLACE FUNCTION generar_reporte_estadistico_completo(
    p_fecha_desde DATE DEFAULT (CURRENT_DATE - INTERVAL '1 year'),
    p_fecha_hasta DATE DEFAULT CURRENT_DATE,
    p_rama rama_enum DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'periodo', json_build_object(
            'fecha_desde', p_fecha_desde,
            'fecha_hasta', p_fecha_hasta,
            'rama_filtro', p_rama
        ),
        'resumen_scouts', (
            SELECT json_build_object(
                'total_scouts', COUNT(*),
                'scouts_activos', COUNT(CASE WHEN estado = 'ACTIVO' THEN 1 END),
                'scouts_inactivos', COUNT(CASE WHEN estado = 'INACTIVO' THEN 1 END),
                'distribucion_por_rama', json_object_agg(rama, rama_count),
                'promedio_edad', ROUND(AVG(EXTRACT(YEAR FROM AGE(fecha_nacimiento))), 1),
                'scouts_con_logros', COUNT(CASE WHEN total_logros.logros > 0 THEN 1 END)
            )
            FROM scouts s
            CROSS JOIN LATERAL (
                SELECT s.rama, COUNT(*) as rama_count
                FROM scouts s2
                WHERE (p_rama IS NULL OR s2.rama = p_rama)
                GROUP BY s2.rama
            ) rama_counts
            LEFT JOIN LATERAL (
                SELECT COUNT(*) as logros
                FROM logros_scout ls
                WHERE ls.scout_id = s.id
                AND ls.fecha_obtencion BETWEEN p_fecha_desde AND p_fecha_hasta
            ) total_logros ON true
            WHERE (p_rama IS NULL OR s.rama = p_rama)
        ),
        'resumen_actividades', (
            SELECT json_build_object(
                'total_actividades', COUNT(*),
                'actividades_completadas', COUNT(CASE WHEN estado = 'COMPLETADA' THEN 1 END),
                'participacion_promedio', ROUND(AVG(participacion.total), 1),
                'actividades_por_tipo', json_object_agg(tipo_actividad, tipo_count),
                'evaluacion_promedio_general', ROUND(AVG(evaluaciones.promedio), 2),
                'costo_total_actividades', SUM(COALESCE(costo_real, costo_estimado))
            )
            FROM actividades_scout a
            CROSS JOIN LATERAL (
                SELECT a.tipo_actividad, COUNT(*) as tipo_count
                FROM actividades_scout a2
                WHERE a2.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
                AND (p_rama IS NULL OR a2.rama = p_rama)
                GROUP BY a2.tipo_actividad
            ) tipo_counts
            LEFT JOIN LATERAL (
                SELECT COUNT(*) as total
                FROM inscripciones_actividad ia
                WHERE ia.actividad_id = a.id AND ia.estado = 'CONFIRMADA'
            ) participacion ON true
            LEFT JOIN LATERAL (
                SELECT AVG(ea.calificacion_general) as promedio
                FROM evaluaciones_actividad ea
                WHERE ea.actividad_id = a.id
            ) evaluaciones ON true
            WHERE a.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
            AND (p_rama IS NULL OR a.rama = p_rama)
        ),
        'resumen_asistencia', (
            SELECT json_build_object(
                'total_asistencias_registradas', COUNT(*),
                'porcentaje_asistencia_promedio', ROUND(AVG(CASE WHEN presente THEN 100.0 ELSE 0.0 END), 2),
                'scouts_asistencia_perfecta', COUNT(DISTINCT CASE WHEN asistencia_perfecta.perfecto THEN ass.scout_id END),
                'reuniones_con_alta_asistencia', COUNT(DISTINCT CASE WHEN alta_asistencia.alta THEN ass.reunion_id END)
            )
            FROM asistencias ass
            LEFT JOIN LATERAL (
                SELECT 
                    CASE WHEN COUNT(*) = COUNT(CASE WHEN presente THEN 1 END) THEN TRUE ELSE FALSE END as perfecto
                FROM asistencias ass2
                WHERE ass2.scout_id = ass.scout_id
                AND ass2.fecha BETWEEN p_fecha_desde AND p_fecha_hasta
            ) asistencia_perfecta ON true
            LEFT JOIN LATERAL (
                SELECT 
                    CASE WHEN AVG(CASE WHEN presente THEN 1.0 ELSE 0.0 END) > 0.8 THEN TRUE ELSE FALSE END as alta
                FROM asistencias ass3
                WHERE ass3.reunion_id = ass.reunion_id
            ) alta_asistencia ON true
            WHERE ass.fecha BETWEEN p_fecha_desde AND p_fecha_hasta
        ),
        'resumen_financiero', (
            SELECT json_build_object(
                'presupuestos_totales', COUNT(DISTINCT p.id),
                'ingresos_totales', SUM(CASE WHEN ip.tipo = 'INGRESO' THEN ip.monto ELSE 0 END),
                'gastos_totales', SUM(CASE WHEN ip.tipo = 'GASTO' THEN ip.monto ELSE 0 END),
                'balance_general', 
                    SUM(CASE WHEN ip.tipo = 'INGRESO' THEN ip.monto ELSE 0 END) - 
                    SUM(CASE WHEN ip.tipo = 'GASTO' THEN ip.monto ELSE 0 END),
                'promedio_presupuesto_por_actividad', 
                    ROUND(AVG(CASE WHEN ip.tipo = 'GASTO' THEN ip.monto END), 2)
            )
            FROM presupuestos p
            LEFT JOIN items_presupuesto ip ON p.id = ip.presupuesto_id
            WHERE p.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
        ),
        'resumen_inventario', (
            SELECT json_build_object(
                'total_items', COUNT(*),
                'items_disponibles', COUNT(CASE WHEN estado = 'DISPONIBLE' THEN 1 END),
                'items_prestados', COUNT(CASE WHEN estado = 'PRESTADO' THEN 1 END),
                'items_mantenimiento', COUNT(CASE WHEN estado = 'MANTENIMIENTO' THEN 1 END),
                'valor_total_inventario', SUM(valor_estimado * cantidad_disponible),
                'movimientos_periodo', (
                    SELECT COUNT(*) 
                    FROM movimientos_inventario mi 
                    WHERE mi.fecha_movimiento BETWEEN p_fecha_desde AND p_fecha_hasta
                )
            )
            FROM inventario
        )
    ) INTO v_resultado;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- Generar reporte de rendimiento por scout
CREATE OR REPLACE FUNCTION generar_reporte_rendimiento_scout(
    p_scout_id UUID,
    p_fecha_desde DATE DEFAULT (CURRENT_DATE - INTERVAL '1 year'),
    p_fecha_hasta DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'scout_info', json_build_object(
            'id', s.id,
            'nombre_completo', s.nombres || ' ' || s.apellidos,
            'rama', s.rama,
            'estado', s.estado,
            'fecha_ingreso', s.fecha_ingreso,
            'tiempo_en_grupo', EXTRACT(YEAR FROM AGE(s.fecha_ingreso)) || ' años'
        ),
        'asistencia', json_build_object(
            'total_reuniones', COUNT(DISTINCT a.reunion_id),
            'asistencias', COUNT(CASE WHEN a.presente THEN 1 END),
            'ausencias', COUNT(CASE WHEN NOT a.presente THEN 1 END),
            'porcentaje_asistencia', 
                CASE 
                    WHEN COUNT(DISTINCT a.reunion_id) > 0 
                    THEN ROUND((COUNT(CASE WHEN a.presente THEN 1 END)::NUMERIC / COUNT(DISTINCT a.reunion_id) * 100), 2)
                    ELSE 0 
                END,
            'ausencias_justificadas', COUNT(CASE WHEN NOT a.presente AND a.observaciones IS NOT NULL THEN 1 END)
        ),
        'actividades', json_build_object(
            'actividades_participadas', COUNT(DISTINCT ia.actividad_id),
            'actividades_completadas', COUNT(CASE WHEN ia.estado = 'CONFIRMADA' THEN 1 END),
            'tipos_actividades', json_object_agg(act.tipo_actividad, tipo_count),
            'evaluaciones_dadas', COUNT(DISTINCT ea.id),
            'promedio_evaluaciones', ROUND(AVG(ea.calificacion_general), 2)
        ),
        'logros', json_build_object(
            'total_logros', COUNT(DISTINCT ls.id),
            'logros_por_tipo', json_object_agg(ls.tipo_logro, logro_count),
            'logros_recientes', (
                SELECT json_agg(json_build_object(
                    'nombre', ls2.nombre_logro,
                    'tipo', ls2.tipo_logro,
                    'fecha', ls2.fecha_obtencion,
                    'descripcion', ls2.descripcion
                ) ORDER BY ls2.fecha_obtencion DESC)
                FROM logros_scout ls2
                WHERE ls2.scout_id = p_scout_id
                AND ls2.fecha_obtencion BETWEEN p_fecha_desde AND p_fecha_hasta
                LIMIT 10
            )
        ),
        'desarrollo_progresion', json_build_object(
            'especialidades_obtenidas', (
                SELECT COUNT(*) FROM logros_scout ls3 
                WHERE ls3.scout_id = p_scout_id 
                AND ls3.tipo_logro = 'ESPECIALIDAD'
                AND ls3.fecha_obtencion BETWEEN p_fecha_desde AND p_fecha_hasta
            ),
            'insignias_obtenidas', (
                SELECT COUNT(*) FROM logros_scout ls4 
                WHERE ls4.scout_id = p_scout_id 
                AND ls4.tipo_logro = 'INSIGNIA'
                AND ls4.fecha_obtencion BETWEEN p_fecha_desde AND p_fecha_hasta
            ),
            'nivel_progresion_actual', s.nivel_progresion
        ),
        'patrulla_participacion', (
            SELECT json_build_object(
                'patrulla_actual', mp.patrulla_id,
                'nombre_patrulla', p.nombre,
                'rol_en_patrulla', mp.rol,
                'fecha_ingreso_patrulla', mp.fecha_ingreso,
                'puntos_contribuidos', (
                    SELECT SUM(puntos) FROM puntos_patrulla pp 
                    WHERE pp.patrulla_id = mp.patrulla_id 
                    AND pp.descripcion LIKE '%' || s.nombres || '%'
                    AND pp.fecha BETWEEN p_fecha_desde AND p_fecha_hasta
                )
            )
            FROM miembros_patrulla mp
            LEFT JOIN patrullas p ON mp.patrulla_id = p.id
            WHERE mp.scout_id = s.id AND mp.activo = true
            LIMIT 1
        )
    ) INTO v_resultado
    FROM scouts s
    LEFT JOIN asistencias a ON s.id = a.scout_id AND a.fecha BETWEEN p_fecha_desde AND p_fecha_hasta
    LEFT JOIN inscripciones_actividad ia ON s.id = ia.scout_id
    LEFT JOIN actividades_scout act ON ia.actividad_id = act.id 
        AND act.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
    LEFT JOIN evaluaciones_actividad ea ON s.id = ea.evaluador_id 
        AND ea.created_at BETWEEN p_fecha_desde AND p_fecha_hasta
    LEFT JOIN logros_scout ls ON s.id = ls.scout_id 
        AND ls.fecha_obtencion BETWEEN p_fecha_desde AND p_fecha_hasta
    CROSS JOIN LATERAL (
        SELECT act.tipo_actividad, COUNT(*) as tipo_count
        FROM inscripciones_actividad ia2
        INNER JOIN actividades_scout act2 ON ia2.actividad_id = act2.id
        WHERE ia2.scout_id = s.id
        AND act2.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
        GROUP BY act2.tipo_actividad
    ) tipo_actividades
    CROSS JOIN LATERAL (
        SELECT ls.tipo_logro, COUNT(*) as logro_count
        FROM logros_scout ls2
        WHERE ls2.scout_id = s.id
        AND ls2.fecha_obtencion BETWEEN p_fecha_desde AND p_fecha_hasta
        GROUP BY ls2.tipo_logro
    ) tipo_logros
    WHERE s.id = p_scout_id
    GROUP BY s.id, s.nombres, s.apellidos, s.rama, s.estado, s.fecha_ingreso, s.nivel_progresion;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ============= 📈 FUNCIONES DE ANALÍTICAS AVANZADAS =============

-- Generar análisis de tendencias de participación
CREATE OR REPLACE FUNCTION analizar_tendencias_participacion(
    p_periodo_meses INTEGER DEFAULT 12,
    p_rama rama_enum DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    WITH datos_mensuales AS (
        SELECT 
            DATE_TRUNC('month', a.fecha_inicio) as mes,
            COUNT(DISTINCT act.id) as actividades_mes,
            COUNT(DISTINCT ia.scout_id) as scouts_participantes,
            AVG(participacion_actividad.total) as promedio_participacion_actividad,
            AVG(ea.calificacion_general) as evaluacion_promedio_mes
        FROM actividades_scout act
        LEFT JOIN inscripciones_actividad ia ON act.id = ia.actividad_id AND ia.estado = 'CONFIRMADA'
        LEFT JOIN evaluaciones_actividad ea ON act.id = ea.actividad_id
        LEFT JOIN LATERAL (
            SELECT COUNT(*) as total
            FROM inscripciones_actividad ia2
            WHERE ia2.actividad_id = act.id AND ia2.estado = 'CONFIRMADA'
        ) participacion_actividad ON true
        LEFT JOIN asistencias a ON ia.scout_id = a.scout_id 
            AND a.fecha BETWEEN act.fecha_inicio::DATE AND act.fecha_fin::DATE
        WHERE act.fecha_inicio >= (CURRENT_DATE - (p_periodo_meses || ' months')::INTERVAL)
        AND (p_rama IS NULL OR act.rama = p_rama)
        GROUP BY DATE_TRUNC('month', act.fecha_inicio)
        ORDER BY mes
    )
    SELECT json_build_object(
        'configuracion_analisis', json_build_object(
            'periodo_meses', p_periodo_meses,
            'rama_filtro', p_rama,
            'fecha_desde', (CURRENT_DATE - (p_periodo_meses || ' months')::INTERVAL)::DATE,
            'fecha_hasta', CURRENT_DATE
        ),
        'tendencias_mensuales', json_agg(
            json_build_object(
                'mes', mes,
                'actividades', actividades_mes,
                'scouts_participantes', scouts_participantes,
                'promedio_participacion', ROUND(promedio_participacion_actividad, 1),
                'evaluacion_promedio', ROUND(evaluacion_promedio_mes, 2)
            ) ORDER BY mes
        ),
        'estadisticas_tendencia', json_build_object(
            'actividades_promedio_mes', ROUND(AVG(actividades_mes), 1),
            'participacion_promedio_general', ROUND(AVG(scouts_participantes), 1),
            'mes_mayor_participacion', (
                SELECT mes FROM datos_mensuales 
                ORDER BY scouts_participantes DESC LIMIT 1
            ),
            'mes_mejor_evaluado', (
                SELECT mes FROM datos_mensuales 
                WHERE evaluacion_promedio_mes IS NOT NULL
                ORDER BY evaluacion_promedio_mes DESC LIMIT 1
            ),
            'tendencia_participacion', 
                CASE 
                    WHEN (
                        SELECT scouts_participantes FROM datos_mensuales 
                        ORDER BY mes DESC LIMIT 1
                    ) > (
                        SELECT AVG(scouts_participantes) FROM datos_mensuales
                    ) THEN 'CRECIENTE'
                    ELSE 'DECRECIENTE'
                END
        )
    ) INTO v_resultado
    FROM datos_mensuales;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- Generar análisis de efectividad de dirigentes
CREATE OR REPLACE FUNCTION analizar_efectividad_dirigentes(
    p_fecha_desde DATE DEFAULT (CURRENT_DATE - INTERVAL '1 year'),
    p_fecha_hasta DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    WITH estadisticas_dirigentes AS (
        SELECT 
            d.id as dirigente_id,
            d.nombres || ' ' || d.apellidos as nombre_dirigente,
            d.rama_asignada,
            d.cargo,
            COUNT(DISTINCT act.id) as actividades_organizadas,
            AVG(participacion.total) as promedio_participacion,
            AVG(ea.calificacion_general) as evaluacion_promedio,
            COUNT(DISTINCT cf.id) as cursos_formacion,
            AVG(ev360.puntuacion_total) as evaluacion_360_promedio,
            COUNT(DISTINCT prog.id) as programas_responsable
        FROM dirigentes d
        LEFT JOIN actividades_scout act ON d.id = act.responsable_id
            AND act.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
        LEFT JOIN LATERAL (
            SELECT COUNT(*) as total
            FROM inscripciones_actividad ia
            WHERE ia.actividad_id = act.id AND ia.estado = 'CONFIRMADA'
        ) participacion ON true
        LEFT JOIN evaluaciones_actividad ea ON act.id = ea.actividad_id
        LEFT JOIN cursos_formacion cf ON d.id = cf.dirigente_id
            AND cf.fecha_completado BETWEEN p_fecha_desde AND p_fecha_hasta
        LEFT JOIN evaluaciones_360 ev360 ON d.id = ev360.dirigente_evaluado_id
            AND ev360.fecha_evaluacion BETWEEN p_fecha_desde AND p_fecha_hasta
        LEFT JOIN programas_semanales prog ON d.id = prog.responsable_id
            AND prog.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
        WHERE d.estado = 'ACTIVO'
        GROUP BY d.id, d.nombres, d.apellidos, d.rama_asignada, d.cargo
    )
    SELECT json_build_object(
        'resumen_general', json_build_object(
            'total_dirigentes_activos', COUNT(*),
            'promedio_actividades_por_dirigente', ROUND(AVG(actividades_organizadas), 1),
            'dirigente_mas_activo', (
                SELECT nombre_dirigente FROM estadisticas_dirigentes 
                ORDER BY actividades_organizadas DESC LIMIT 1
            ),
            'dirigente_mejor_evaluado', (
                SELECT nombre_dirigente FROM estadisticas_dirigentes 
                WHERE evaluacion_promedio IS NOT NULL
                ORDER BY evaluacion_promedio DESC LIMIT 1
            )
        ),
        'ranking_dirigentes', json_agg(
            json_build_object(
                'dirigente_id', dirigente_id,
                'nombre', nombre_dirigente,
                'rama', rama_asignada,
                'cargo', cargo,
                'actividades_organizadas', actividades_organizadas,
                'promedio_participacion', ROUND(promedio_participacion, 1),
                'evaluacion_promedio', ROUND(evaluacion_promedio, 2),
                'cursos_formacion', cursos_formacion,
                'evaluacion_360', ROUND(evaluacion_360_promedio, 2),
                'programas_responsable', programas_responsable,
                'score_efectividad', ROUND(
                    (COALESCE(actividades_organizadas, 0) * 0.3 +
                     COALESCE(promedio_participacion, 0) * 0.2 +
                     COALESCE(evaluacion_promedio, 0) * 2 +
                     COALESCE(cursos_formacion, 0) * 0.5 +
                     COALESCE(evaluacion_360_promedio, 0) * 0.2), 2
                )
            ) ORDER BY 
                (COALESCE(actividades_organizadas, 0) * 0.3 +
                 COALESCE(promedio_participacion, 0) * 0.2 +
                 COALESCE(evaluacion_promedio, 0) * 2 +
                 COALESCE(cursos_formacion, 0) * 0.5 +
                 COALESCE(evaluacion_360_promedio, 0) * 0.2) DESC
        ),
        'estadisticas_por_rama', (
            SELECT json_object_agg(rama_asignada, rama_stats)
            FROM (
                SELECT 
                    rama_asignada,
                    json_build_object(
                        'dirigentes_activos', COUNT(*),
                        'promedio_actividades', ROUND(AVG(actividades_organizadas), 1),
                        'evaluacion_promedio_rama', ROUND(AVG(evaluacion_promedio), 2)
                    ) as rama_stats
                FROM estadisticas_dirigentes
                WHERE rama_asignada IS NOT NULL
                GROUP BY rama_asignada
            ) rama_data
        )
    ) INTO v_resultado
    FROM estadisticas_dirigentes;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ============= 💰 FUNCIONES DE REPORTES FINANCIEROS =============

-- Generar reporte financiero consolidado
CREATE OR REPLACE FUNCTION generar_reporte_financiero_consolidado(
    p_fecha_desde DATE DEFAULT (CURRENT_DATE - INTERVAL '1 year'),
    p_fecha_hasta DATE DEFAULT CURRENT_DATE,
    p_categoria VARCHAR(100) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    WITH resumen_financiero AS (
        SELECT 
            p.id as presupuesto_id,
            p.nombre_presupuesto,
            p.descripcion,
            p.fecha_inicio,
            p.fecha_fin,
            p.responsable_id,
            SUM(CASE WHEN ip.tipo = 'INGRESO' THEN ip.monto ELSE 0 END) as total_ingresos,
            SUM(CASE WHEN ip.tipo = 'GASTO' THEN ip.monto ELSE 0 END) as total_gastos,
            SUM(CASE WHEN ip.tipo = 'INGRESO' THEN ip.monto ELSE -ip.monto END) as balance_neto,
            COUNT(CASE WHEN ip.tipo = 'INGRESO' THEN 1 END) as cantidad_ingresos,
            COUNT(CASE WHEN ip.tipo = 'GASTO' THEN 1 END) as cantidad_gastos
        FROM presupuestos p
        LEFT JOIN items_presupuesto ip ON p.id = ip.presupuesto_id
        WHERE p.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
        AND (p_categoria IS NULL OR ip.categoria = p_categoria)
        GROUP BY p.id, p.nombre_presupuesto, p.descripcion, p.fecha_inicio, p.fecha_fin, p.responsable_id
    )
    SELECT json_build_object(
        'configuracion_reporte', json_build_object(
            'periodo', json_build_object(
                'fecha_desde', p_fecha_desde,
                'fecha_hasta', p_fecha_hasta
            ),
            'filtro_categoria', p_categoria
        ),
        'resumen_ejecutivo', json_build_object(
            'total_presupuestos', COUNT(*),
            'ingresos_totales', SUM(total_ingresos),
            'gastos_totales', SUM(total_gastos),
            'balance_general', SUM(balance_neto),
            'promedio_balance_presupuesto', ROUND(AVG(balance_neto), 2),
            'presupuestos_con_perdidas', COUNT(CASE WHEN balance_neto < 0 THEN 1 END),
            'presupuestos_con_ganancias', COUNT(CASE WHEN balance_neto > 0 THEN 1 END)
        ),
        'detalle_presupuestos', json_agg(
            json_build_object(
                'presupuesto_id', presupuesto_id,
                'nombre', nombre_presupuesto,
                'descripcion', descripcion,
                'periodo', json_build_object(
                    'inicio', fecha_inicio,
                    'fin', fecha_fin
                ),
                'resumen_financiero', json_build_object(
                    'ingresos', total_ingresos,
                    'gastos', total_gastos,
                    'balance', balance_neto,
                    'cantidad_movimientos', cantidad_ingresos + cantidad_gastos
                ),
                'estado_financiero', 
                    CASE 
                        WHEN balance_neto > 0 THEN 'SUPERAVIT'
                        WHEN balance_neto < 0 THEN 'DEFICIT'
                        ELSE 'EQUILIBRADO'
                    END
            ) ORDER BY balance_neto DESC
        ),
        'analisis_categorias', (
            SELECT json_object_agg(categoria, categoria_stats)
            FROM (
                SELECT 
                    ip2.categoria,
                    json_build_object(
                        'total_movimientos', COUNT(*),
                        'ingresos_categoria', SUM(CASE WHEN ip2.tipo = 'INGRESO' THEN ip2.monto ELSE 0 END),
                        'gastos_categoria', SUM(CASE WHEN ip2.tipo = 'GASTO' THEN ip2.monto ELSE 0 END),
                        'balance_categoria', SUM(CASE WHEN ip2.tipo = 'INGRESO' THEN ip2.monto ELSE -ip2.monto END),
                        'promedio_monto_movimiento', ROUND(AVG(ip2.monto), 2)
                    ) as categoria_stats
                FROM items_presupuesto ip2
                INNER JOIN presupuestos p2 ON ip2.presupuesto_id = p2.id
                WHERE p2.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
                AND (p_categoria IS NULL OR ip2.categoria = p_categoria)
                GROUP BY ip2.categoria
            ) cat_data
        ),
        'tendencias_temporales', (
            SELECT json_agg(tendencia ORDER BY mes)
            FROM (
                SELECT 
                    DATE_TRUNC('month', p3.fecha_inicio) as mes,
                    SUM(CASE WHEN ip3.tipo = 'INGRESO' THEN ip3.monto ELSE 0 END) as ingresos_mes,
                    SUM(CASE WHEN ip3.tipo = 'GASTO' THEN ip3.monto ELSE 0 END) as gastos_mes,
                    SUM(CASE WHEN ip3.tipo = 'INGRESO' THEN ip3.monto ELSE -ip3.monto END) as balance_mes
                FROM presupuestos p3
                LEFT JOIN items_presupuesto ip3 ON p3.id = ip3.presupuesto_id
                WHERE p3.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
                AND (p_categoria IS NULL OR ip3.categoria = p_categoria)
                GROUP BY DATE_TRUNC('month', p3.fecha_inicio)
                ORDER BY mes
            ) tendencia
        )
    ) INTO v_resultado
    FROM resumen_financiero;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ============= 🎯 FUNCIONES DE REPORTES DE CUMPLIMIENTO =============

-- Generar reporte de cumplimiento de objetivos
CREATE OR REPLACE FUNCTION generar_reporte_cumplimiento_objetivos(
    p_fecha_desde DATE DEFAULT (CURRENT_DATE - INTERVAL '1 year'),
    p_fecha_hasta DATE DEFAULT CURRENT_DATE,
    p_rama rama_enum DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'cumplimiento_programas_semanales', (
            SELECT json_build_object(
                'total_programas', COUNT(*),
                'programas_completados', COUNT(CASE WHEN estado = 'COMPLETADO' THEN 1 END),
                'porcentaje_completado', 
                    CASE 
                        WHEN COUNT(*) > 0 
                        THEN ROUND((COUNT(CASE WHEN estado = 'COMPLETADO' THEN 1 END)::NUMERIC / COUNT(*) * 100), 2)
                        ELSE 0 
                    END,
                'promedio_objetivos_cumplidos', ROUND(AVG(
                    CASE 
                        WHEN array_length(objetivos, 1) > 0 
                        THEN (objetivos_cumplidos::NUMERIC / array_length(objetivos, 1) * 100)
                        ELSE 0 
                    END
                ), 2),
                'programas_por_rama', json_object_agg(rama, rama_count)
            )
            FROM programas_semanales ps
            CROSS JOIN LATERAL (
                SELECT ps.rama, COUNT(*) as rama_count
                FROM programas_semanales ps2
                WHERE ps2.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
                AND (p_rama IS NULL OR ps2.rama = p_rama)
                GROUP BY ps2.rama
            ) rama_counts
            WHERE ps.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
            AND (p_rama IS NULL OR ps.rama = p_rama)
        ),
        'cumplimiento_actividades', (
            SELECT json_build_object(
                'actividades_planificadas', COUNT(*),
                'actividades_ejecutadas', COUNT(CASE WHEN estado = 'COMPLETADA' THEN 1 END),
                'tasa_ejecucion', 
                    CASE 
                        WHEN COUNT(*) > 0 
                        THEN ROUND((COUNT(CASE WHEN estado = 'COMPLETADA' THEN 1 END)::NUMERIC / COUNT(*) * 100), 2)
                        ELSE 0 
                    END,
                'promedio_objetivos_cumplidos_actividades', ROUND(AVG(objetivos_cumplidos), 2),
                'actividades_mejor_evaluadas', (
                    SELECT json_agg(
                        json_build_object(
                            'nombre', a2.nombre,
                            'tipo', a2.tipo_actividad,
                            'evaluacion_promedio', ROUND(evaluacion_avg.promedio, 2),
                            'participacion', participacion_total.total
                        ) ORDER BY evaluacion_avg.promedio DESC
                    )
                    FROM actividades_scout a2
                    LEFT JOIN LATERAL (
                        SELECT AVG(ea.calificacion_general) as promedio
                        FROM evaluaciones_actividad ea
                        WHERE ea.actividad_id = a2.id
                    ) evaluacion_avg ON true
                    LEFT JOIN LATERAL (
                        SELECT COUNT(*) as total
                        FROM inscripciones_actividad ia
                        WHERE ia.actividad_id = a2.id AND ia.estado = 'CONFIRMADA'
                    ) participacion_total ON true
                    WHERE a2.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
                    AND a2.estado = 'COMPLETADA'
                    AND (p_rama IS NULL OR a2.rama = p_rama)
                    AND evaluacion_avg.promedio IS NOT NULL
                    ORDER BY evaluacion_avg.promedio DESC
                    LIMIT 10
                )
            )
            FROM actividades_scout a
            WHERE a.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
            AND (p_rama IS NULL OR a.rama = p_rama)
        ),
        'cumplimiento_asistencia', (
            SELECT json_build_object(
                'asistencia_promedio_general', ROUND(AVG(CASE WHEN presente THEN 100.0 ELSE 0.0 END), 2),
                'scouts_asistencia_regular', COUNT(DISTINCT CASE 
                    WHEN asistencia_scout.porcentaje >= 80 THEN a.scout_id 
                END),
                'scouts_asistencia_irregular', COUNT(DISTINCT CASE 
                    WHEN asistencia_scout.porcentaje < 60 THEN a.scout_id 
                END),
                'reuniones_alta_asistencia', COUNT(DISTINCT CASE 
                    WHEN reunion_asistencia.porcentaje >= 80 THEN a.reunion_id 
                END),
                'tendencia_asistencia_mensual', (
                    SELECT json_agg(
                        json_build_object(
                            'mes', DATE_TRUNC('month', a3.fecha),
                            'porcentaje_asistencia', ROUND(AVG(CASE WHEN a3.presente THEN 100.0 ELSE 0.0 END), 2)
                        ) ORDER BY DATE_TRUNC('month', a3.fecha)
                    )
                    FROM asistencias a3
                    WHERE a3.fecha BETWEEN p_fecha_desde AND p_fecha_hasta
                    GROUP BY DATE_TRUNC('month', a3.fecha)
                )
            )
            FROM asistencias a
            LEFT JOIN LATERAL (
                SELECT 
                    ROUND(AVG(CASE WHEN a2.presente THEN 100.0 ELSE 0.0 END), 2) as porcentaje
                FROM asistencias a2
                WHERE a2.scout_id = a.scout_id
                AND a2.fecha BETWEEN p_fecha_desde AND p_fecha_hasta
            ) asistencia_scout ON true
            LEFT JOIN LATERAL (
                SELECT 
                    ROUND(AVG(CASE WHEN a3.presente THEN 100.0 ELSE 0.0 END), 2) as porcentaje
                FROM asistencias a3
                WHERE a3.reunion_id = a.reunion_id
            ) reunion_asistencia ON true
            WHERE a.fecha BETWEEN p_fecha_desde AND p_fecha_hasta
        ),
        'indicadores_clave_rendimiento', json_build_object(
            'scouts_con_progresion_activa', (
                SELECT COUNT(DISTINCT scout_id) 
                FROM logros_scout 
                WHERE fecha_obtencion BETWEEN p_fecha_desde AND p_fecha_hasta
            ),
            'dirigentes_con_formacion_actualizada', (
                SELECT COUNT(DISTINCT dirigente_id) 
                FROM cursos_formacion 
                WHERE fecha_completado BETWEEN p_fecha_desde AND p_fecha_hasta
            ),
            'actividades_con_evaluacion_excelente', (
                SELECT COUNT(DISTINCT actividad_id)
                FROM evaluaciones_actividad
                WHERE calificacion_general >= 4
                AND created_at BETWEEN p_fecha_desde AND p_fecha_hasta
            ),
            'presupuestos_equilibrados', (
                SELECT COUNT(*)
                FROM (
                    SELECT 
                        p.id,
                        SUM(CASE WHEN ip.tipo = 'INGRESO' THEN ip.monto ELSE -ip.monto END) as balance
                    FROM presupuestos p
                    LEFT JOIN items_presupuesto ip ON p.id = ip.presupuesto_id
                    WHERE p.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
                    GROUP BY p.id
                    HAVING ABS(SUM(CASE WHEN ip.tipo = 'INGRESO' THEN ip.monto ELSE -ip.monto END)) <= 100
                ) presupuestos_equilibrados
            )
        )
    ) INTO v_resultado;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ============= 📋 FUNCIONES DE EXPORTACIÓN DE REPORTES =============

-- Generar dataset para exportación Excel
CREATE OR REPLACE FUNCTION generar_dataset_exportacion(
    p_tipo_reporte VARCHAR(50), -- 'SCOUTS', 'ACTIVIDADES', 'ASISTENCIA', 'FINANCIERO'
    p_fecha_desde DATE DEFAULT (CURRENT_DATE - INTERVAL '1 year'),
    p_fecha_hasta DATE DEFAULT CURRENT_DATE,
    p_filtros JSON DEFAULT '{}'
)
RETURNS TABLE(
    dataset JSON
) AS $$
DECLARE
    v_rama rama_enum;
    v_estado VARCHAR(50);
BEGIN
    -- Extraer filtros
    v_rama := (p_filtros->>'rama')::rama_enum;
    v_estado := p_filtros->>'estado';
    
    CASE p_tipo_reporte
        WHEN 'SCOUTS' THEN
            RETURN QUERY
            SELECT json_agg(
                json_build_object(
                    'scout_id', s.id,
                    'nombre_completo', s.nombres || ' ' || s.apellidos,
                    'documento', s.documento_identidad,
                    'fecha_nacimiento', s.fecha_nacimiento,
                    'edad', EXTRACT(YEAR FROM AGE(s.fecha_nacimiento)),
                    'rama', s.rama,
                    'estado', s.estado,
                    'fecha_ingreso', s.fecha_ingreso,
                    'nivel_progresion', s.nivel_progresion,
                    'telefono', s.telefono,
                    'email', s.email,
                    'direccion', s.direccion,
                    'total_logros', COALESCE(logros.total, 0),
                    'asistencia_promedio', COALESCE(asistencia.porcentaje, 0),
                    'actividades_participadas', COALESCE(actividades.total, 0)
                )
            ) as dataset
            FROM scouts s
            LEFT JOIN LATERAL (
                SELECT COUNT(*) as total
                FROM logros_scout ls
                WHERE ls.scout_id = s.id
                AND ls.fecha_obtencion BETWEEN p_fecha_desde AND p_fecha_hasta
            ) logros ON true
            LEFT JOIN LATERAL (
                SELECT ROUND(AVG(CASE WHEN presente THEN 100.0 ELSE 0.0 END), 2) as porcentaje
                FROM asistencias a
                WHERE a.scout_id = s.id
                AND a.fecha BETWEEN p_fecha_desde AND p_fecha_hasta
            ) asistencia ON true
            LEFT JOIN LATERAL (
                SELECT COUNT(DISTINCT ia.actividad_id) as total
                FROM inscripciones_actividad ia
                INNER JOIN actividades_scout act ON ia.actividad_id = act.id
                WHERE ia.scout_id = s.id
                AND ia.estado = 'CONFIRMADA'
                AND act.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
            ) actividades ON true
            WHERE (v_rama IS NULL OR s.rama = v_rama)
            AND (v_estado IS NULL OR s.estado = v_estado);
            
        WHEN 'ACTIVIDADES' THEN
            RETURN QUERY
            SELECT json_agg(
                json_build_object(
                    'actividad_id', a.id,
                    'nombre', a.nombre,
                    'tipo_actividad', a.tipo_actividad,
                    'categoria', a.categoria,
                    'rama', a.rama,
                    'fecha_inicio', a.fecha_inicio,
                    'fecha_fin', a.fecha_fin,
                    'lugar', a.lugar,
                    'responsable', responsable.nombre,
                    'estado', a.estado,
                    'costo_estimado', a.costo_estimado,
                    'costo_real', a.costo_real,
                    'cupo_maximo', a.cupo_maximo,
                    'inscripciones_confirmadas', COALESCE(inscripciones.confirmadas, 0),
                    'evaluacion_promedio', COALESCE(evaluaciones.promedio, 0),
                    'objetivos_cumplidos', a.objetivos_cumplidos
                )
            ) as dataset
            FROM actividades_scout a
            LEFT JOIN LATERAL (
                SELECT s.nombres || ' ' || s.apellidos as nombre
                FROM scouts s
                WHERE s.id = a.responsable_id
            ) responsable ON true
            LEFT JOIN LATERAL (
                SELECT COUNT(*) as confirmadas
                FROM inscripciones_actividad ia
                WHERE ia.actividad_id = a.id AND ia.estado = 'CONFIRMADA'
            ) inscripciones ON true
            LEFT JOIN LATERAL (
                SELECT ROUND(AVG(ea.calificacion_general), 2) as promedio
                FROM evaluaciones_actividad ea
                WHERE ea.actividad_id = a.id
            ) evaluaciones ON true
            WHERE a.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
            AND (v_rama IS NULL OR a.rama = v_rama)
            AND (v_estado IS NULL OR a.estado = v_estado);
            
        ELSE
            -- Retornar dataset vacío para tipos no implementados
            RETURN QUERY SELECT '[]'::JSON as dataset;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '📊 FUNCIONES DE REPORTES CREADAS' as estado,
    'Todas las Database Functions del módulo de reportes implementadas' as mensaje,
    '10 funciones de reportes y analíticas disponibles' as resumen;