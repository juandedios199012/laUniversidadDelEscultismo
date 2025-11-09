-- ================================================================
-- 📅 PROGRAMA SEMANAL DATABASE FUNCTIONS - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 13_functions_programa_semanal.sql
-- Propósito: Database Functions para el módulo de programa semanal
-- ================================================================

-- ============= 📅 FUNCIONES DE PROGRAMA SEMANAL =============

-- Crear programa semanal
CREATE OR REPLACE FUNCTION crear_programa_semanal(
    p_titulo VARCHAR(255),
    p_fecha_inicio DATE,
    p_fecha_fin DATE,
    p_rama rama_enum,
    p_tema_central VARCHAR(255),
    p_objetivos TEXT[],
    p_responsable_id UUID,
    p_descripcion TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_programa_id UUID;
BEGIN
    -- Validaciones
    IF p_fecha_fin <= p_fecha_inicio THEN
        RETURN json_build_object('success', false, 'error', 'La fecha fin debe ser posterior a la fecha inicio');
    END IF;
    
    -- Verificar que no hay solapamiento con otros programas de la misma rama
    IF EXISTS (
        SELECT 1 FROM programas_semanales 
        WHERE rama = p_rama 
        AND estado = 'ACTIVO'
        AND (
            (p_fecha_inicio BETWEEN fecha_inicio AND fecha_fin) OR
            (p_fecha_fin BETWEEN fecha_inicio AND fecha_fin) OR
            (fecha_inicio BETWEEN p_fecha_inicio AND p_fecha_fin)
        )
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Ya existe un programa activo para esta rama en el período especificado');
    END IF;
    
    -- Insertar programa
    INSERT INTO programas_semanales (
        titulo,
        fecha_inicio,
        fecha_fin,
        rama,
        tema_central,
        objetivos,
        responsable_id,
        descripcion,
        estado
    ) VALUES (
        p_titulo,
        p_fecha_inicio,
        p_fecha_fin,
        p_rama,
        p_tema_central,
        p_objetivos,
        p_responsable_id,
        p_descripcion,
        'BORRADOR'
    ) RETURNING id INTO v_programa_id;
    
    RETURN json_build_object('success', true, 'programa_id', v_programa_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener programas semanales
CREATE OR REPLACE FUNCTION obtener_programas_semanales(p_filtros JSON DEFAULT '{}')
RETURNS TABLE(
    id UUID,
    titulo VARCHAR(255),
    fecha_inicio DATE,
    fecha_fin DATE,
    rama rama_enum,
    tema_central VARCHAR(255),
    estado VARCHAR(50),
    responsable VARCHAR(255),
    total_actividades INTEGER,
    objetivos_cumplidos INTEGER,
    porcentaje_completado NUMERIC,
    evaluacion_promedio NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_rama rama_enum;
    v_estado VARCHAR(50);
    v_año INTEGER;
BEGIN
    -- Extraer filtros
    v_rama := (p_filtros->>'rama')::rama_enum;
    v_estado := p_filtros->>'estado';
    v_año := (p_filtros->>'año')::INTEGER;
    
    RETURN QUERY
    SELECT 
        ps.id,
        ps.titulo,
        ps.fecha_inicio,
        ps.fecha_fin,
        ps.rama,
        ps.tema_central,
        ps.estado,
        COALESCE(s.nombres || ' ' || s.apellidos, '') as responsable,
        COALESCE(actividades.total, 0)::INTEGER as total_actividades,
        COALESCE(ps.objetivos_cumplidos, 0)::INTEGER as objetivos_cumplidos,
        CASE 
            WHEN array_length(ps.objetivos, 1) > 0 
            THEN ROUND((ps.objetivos_cumplidos::NUMERIC / array_length(ps.objetivos, 1) * 100), 2)
            ELSE 0 
        END as porcentaje_completado,
        COALESCE(evaluaciones.promedio, 0)::NUMERIC as evaluacion_promedio,
        ps.created_at
    FROM programas_semanales ps
    LEFT JOIN scouts s ON ps.responsable_id = s.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as total
        FROM actividades_programa ap
        WHERE ap.programa_id = ps.id
    ) actividades ON true
    LEFT JOIN LATERAL (
        SELECT AVG(calificacion_global) as promedio
        FROM evaluaciones_programa ep
        WHERE ep.programa_id = ps.id
    ) evaluaciones ON true
    WHERE 
        (v_rama IS NULL OR ps.rama = v_rama)
        AND (v_estado IS NULL OR ps.estado = v_estado)
        AND (v_año IS NULL OR EXTRACT(YEAR FROM ps.fecha_inicio) = v_año)
    ORDER BY ps.fecha_inicio DESC;
END;
$$ LANGUAGE plpgsql;

-- Obtener programa específico
CREATE OR REPLACE FUNCTION obtener_programa_semanal_por_id(p_programa_id UUID)
RETURNS TABLE(
    id UUID,
    titulo VARCHAR(255),
    fecha_inicio DATE,
    fecha_fin DATE,
    rama rama_enum,
    tema_central VARCHAR(255),
    objetivos TEXT[],
    objetivos_cumplidos INTEGER,
    responsable_id UUID,
    responsable VARCHAR(255),
    descripcion TEXT,
    estado VARCHAR(50),
    observaciones TEXT,
    total_actividades INTEGER,
    actividades_completadas INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.id,
        ps.titulo,
        ps.fecha_inicio,
        ps.fecha_fin,
        ps.rama,
        ps.tema_central,
        ps.objetivos,
        ps.objetivos_cumplidos,
        ps.responsable_id,
        COALESCE(s.nombres || ' ' || s.apellidos, '') as responsable,
        ps.descripcion,
        ps.estado,
        ps.observaciones,
        COALESCE(actividades.total, 0)::INTEGER as total_actividades,
        COALESCE(actividades.completadas, 0)::INTEGER as actividades_completadas,
        ps.created_at,
        ps.updated_at
    FROM programas_semanales ps
    LEFT JOIN scouts s ON ps.responsable_id = s.id
    LEFT JOIN LATERAL (
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN estado = 'COMPLETADA' THEN 1 END) as completadas
        FROM actividades_programa ap
        WHERE ap.programa_id = ps.id
    ) actividades ON true
    WHERE ps.id = p_programa_id;
END;
$$ LANGUAGE plpgsql;

-- Actualizar programa semanal
CREATE OR REPLACE FUNCTION actualizar_programa_semanal(
    p_programa_id UUID,
    p_titulo VARCHAR(255) DEFAULT NULL,
    p_tema_central VARCHAR(255) DEFAULT NULL,
    p_objetivos TEXT[] DEFAULT NULL,
    p_objetivos_cumplidos INTEGER DEFAULT NULL,
    p_descripcion TEXT DEFAULT NULL,
    p_estado VARCHAR(50) DEFAULT NULL,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    -- Verificar que el programa existe
    IF NOT EXISTS (SELECT 1 FROM programas_semanales WHERE id = p_programa_id) THEN
        RETURN json_build_object('success', false, 'error', 'Programa semanal no encontrado');
    END IF;
    
    -- Actualizar programa
    UPDATE programas_semanales SET
        titulo = COALESCE(p_titulo, titulo),
        tema_central = COALESCE(p_tema_central, tema_central),
        objetivos = COALESCE(p_objetivos, objetivos),
        objetivos_cumplidos = COALESCE(p_objetivos_cumplidos, objetivos_cumplidos),
        descripcion = COALESCE(p_descripcion, descripcion),
        estado = COALESCE(p_estado, estado),
        observaciones = COALESCE(p_observaciones, observaciones),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_programa_id;
    
    RETURN json_build_object('success', true, 'programa_id', p_programa_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 🎯 FUNCIONES DE ACTIVIDADES DEL PROGRAMA =============

-- Agregar actividad al programa
CREATE OR REPLACE FUNCTION agregar_actividad_programa(
    p_programa_id UUID,
    p_nombre VARCHAR(255),
    p_descripcion TEXT,
    p_fecha_programada DATE,
    p_hora_inicio TIME,
    p_hora_fin TIME,
    p_tipo_actividad VARCHAR(100),
    p_responsable_actividad VARCHAR(255),
    p_materiales_necesarios TEXT[] DEFAULT '{}',
    p_objetivos_actividad TEXT[] DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
    v_actividad_id UUID;
BEGIN
    -- Verificar que el programa existe
    IF NOT EXISTS (SELECT 1 FROM programas_semanales WHERE id = p_programa_id) THEN
        RETURN json_build_object('success', false, 'error', 'Programa semanal no encontrado');
    END IF;
    
    -- Insertar actividad
    INSERT INTO actividades_programa (
        programa_id,
        nombre,
        descripcion,
        fecha_programada,
        hora_inicio,
        hora_fin,
        tipo_actividad,
        responsable_actividad,
        materiales_necesarios,
        objetivos_actividad,
        estado
    ) VALUES (
        p_programa_id,
        p_nombre,
        p_descripcion,
        p_fecha_programada,
        p_hora_inicio,
        p_hora_fin,
        p_tipo_actividad,
        p_responsable_actividad,
        p_materiales_necesarios,
        p_objetivos_actividad,
        'PROGRAMADA'
    ) RETURNING id INTO v_actividad_id;
    
    RETURN json_build_object('success', true, 'actividad_id', v_actividad_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener actividades del programa
CREATE OR REPLACE FUNCTION obtener_actividades_programa(p_programa_id UUID)
RETURNS TABLE(
    id UUID,
    nombre VARCHAR(255),
    descripcion TEXT,
    fecha_programada DATE,
    hora_inicio TIME,
    hora_fin TIME,
    tipo_actividad VARCHAR(100),
    responsable_actividad VARCHAR(255),
    materiales_necesarios TEXT[],
    objetivos_actividad TEXT[],
    estado VARCHAR(50),
    observaciones_ejecucion TEXT,
    evaluacion_actividad INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.id,
        ap.nombre,
        ap.descripcion,
        ap.fecha_programada,
        ap.hora_inicio,
        ap.hora_fin,
        ap.tipo_actividad,
        ap.responsable_actividad,
        ap.materiales_necesarios,
        ap.objetivos_actividad,
        ap.estado,
        ap.observaciones_ejecucion,
        ap.evaluacion_actividad,
        ap.created_at
    FROM actividades_programa ap
    WHERE ap.programa_id = p_programa_id
    ORDER BY ap.fecha_programada, ap.hora_inicio;
END;
$$ LANGUAGE plpgsql;

-- Marcar actividad como completada
CREATE OR REPLACE FUNCTION completar_actividad_programa(
    p_actividad_id UUID,
    p_observaciones_ejecucion TEXT DEFAULT NULL,
    p_evaluacion_actividad INTEGER DEFAULT NULL,
    p_objetivos_cumplidos BOOLEAN DEFAULT TRUE
)
RETURNS JSON AS $$
BEGIN
    -- Verificar que la actividad existe
    IF NOT EXISTS (SELECT 1 FROM actividades_programa WHERE id = p_actividad_id) THEN
        RETURN json_build_object('success', false, 'error', 'Actividad no encontrada');
    END IF;
    
    -- Validar evaluación
    IF p_evaluacion_actividad IS NOT NULL AND (p_evaluacion_actividad < 1 OR p_evaluacion_actividad > 5) THEN
        RETURN json_build_object('success', false, 'error', 'La evaluación debe estar entre 1 y 5');
    END IF;
    
    -- Actualizar actividad
    UPDATE actividades_programa SET
        estado = 'COMPLETADA',
        observaciones_ejecucion = p_observaciones_ejecucion,
        evaluacion_actividad = p_evaluacion_actividad,
        fecha_ejecucion = CURRENT_DATE,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_actividad_id;
    
    RETURN json_build_object('success', true, 'actividad_id', p_actividad_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 📊 FUNCIONES DE EVALUACIÓN =============

-- Crear evaluación del programa
CREATE OR REPLACE FUNCTION crear_evaluacion_programa(
    p_programa_id UUID,
    p_evaluador_id UUID,
    p_tipo_evaluador VARCHAR(50), -- 'DIRIGENTE', 'SCOUT', 'OBSERVADOR'
    p_calificacion_global INTEGER,
    p_aspectos_evaluados JSON, -- {aspecto: calificacion, ...}
    p_fortalezas TEXT[] DEFAULT '{}',
    p_areas_mejora TEXT[] DEFAULT '{}',
    p_comentarios TEXT DEFAULT NULL,
    p_recomendaciones TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_evaluacion_id UUID;
BEGIN
    -- Validar calificación
    IF p_calificacion_global < 1 OR p_calificacion_global > 5 THEN
        RETURN json_build_object('success', false, 'error', 'La calificación global debe estar entre 1 y 5');
    END IF;
    
    -- Verificar que el programa existe
    IF NOT EXISTS (SELECT 1 FROM programas_semanales WHERE id = p_programa_id) THEN
        RETURN json_build_object('success', false, 'error', 'Programa semanal no encontrado');
    END IF;
    
    -- Insertar evaluación
    INSERT INTO evaluaciones_programa (
        programa_id,
        evaluador_id,
        tipo_evaluador,
        calificacion_global,
        aspectos_evaluados,
        fortalezas,
        areas_mejora,
        comentarios,
        recomendaciones
    ) VALUES (
        p_programa_id,
        p_evaluador_id,
        p_tipo_evaluador,
        p_calificacion_global,
        p_aspectos_evaluados,
        p_fortalezas,
        p_areas_mejora,
        p_comentarios,
        p_recomendaciones
    ) RETURNING id INTO v_evaluacion_id;
    
    RETURN json_build_object('success', true, 'evaluacion_id', v_evaluacion_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener evaluaciones del programa
CREATE OR REPLACE FUNCTION obtener_evaluaciones_programa(p_programa_id UUID)
RETURNS TABLE(
    id UUID,
    evaluador VARCHAR(255),
    tipo_evaluador VARCHAR(50),
    calificacion_global INTEGER,
    aspectos_evaluados JSON,
    fortalezas TEXT[],
    areas_mejora TEXT[],
    comentarios TEXT,
    recomendaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ep.id,
        COALESCE(s.nombres || ' ' || s.apellidos, 'Anónimo') as evaluador,
        ep.tipo_evaluador,
        ep.calificacion_global,
        ep.aspectos_evaluados,
        ep.fortalezas,
        ep.areas_mejora,
        ep.comentarios,
        ep.recomendaciones,
        ep.created_at
    FROM evaluaciones_programa ep
    LEFT JOIN scouts s ON ep.evaluador_id = s.id
    WHERE ep.programa_id = p_programa_id
    ORDER BY ep.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============= 📈 FUNCIONES DE ESTADÍSTICAS =============

-- Obtener estadísticas de programa
CREATE OR REPLACE FUNCTION obtener_estadisticas_programa(p_programa_id UUID)
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'programa_id', p_programa_id,
        'resumen_general', json_build_object(
            'total_actividades', COUNT(ap.*),
            'actividades_completadas', COUNT(CASE WHEN ap.estado = 'COMPLETADA' THEN 1 END),
            'porcentaje_completado', 
                CASE 
                    WHEN COUNT(ap.*) > 0 
                    THEN ROUND((COUNT(CASE WHEN ap.estado = 'COMPLETADA' THEN 1 END)::NUMERIC / COUNT(ap.*) * 100), 2)
                    ELSE 0 
                END,
            'evaluacion_promedio_actividades', ROUND(AVG(ap.evaluacion_actividad), 2)
        ),
        'actividades_por_tipo', json_object_agg(ap.tipo_actividad, tipo_count),
        'cronograma_cumplimiento', (
            SELECT json_agg(semana_stats ORDER BY semana)
            FROM (
                SELECT 
                    DATE_TRUNC('week', ap2.fecha_programada) as semana,
                    COUNT(*) as actividades_programadas,
                    COUNT(CASE WHEN ap2.estado = 'COMPLETADA' THEN 1 END) as actividades_completadas,
                    ROUND(AVG(ap2.evaluacion_actividad), 2) as evaluacion_promedio_semana
                FROM actividades_programa ap2
                WHERE ap2.programa_id = p_programa_id
                GROUP BY DATE_TRUNC('week', ap2.fecha_programada)
                ORDER BY semana
            ) semana_stats
        ),
        'evaluaciones_programa', (
            SELECT json_build_object(
                'total_evaluaciones', COUNT(*),
                'calificacion_promedio', ROUND(AVG(calificacion_global), 2),
                'evaluaciones_por_tipo', json_object_agg(tipo_evaluador, tipo_eval_count),
                'aspectos_mejor_evaluados', (
                    SELECT json_object_agg(aspecto, promedio_aspecto)
                    FROM (
                        SELECT 
                            aspectos.key as aspecto,
                            ROUND(AVG((aspectos.value::TEXT)::NUMERIC), 2) as promedio_aspecto
                        FROM evaluaciones_programa ep2,
                             json_each_text(ep2.aspectos_evaluados) aspectos
                        WHERE ep2.programa_id = p_programa_id
                        GROUP BY aspectos.key
                        ORDER BY promedio_aspecto DESC
                        LIMIT 5
                    ) top_aspectos
                )
            ) FROM evaluaciones_programa ep
            CROSS JOIN LATERAL (
                SELECT tipo_evaluador, COUNT(*) as tipo_eval_count
                FROM evaluaciones_programa ep3
                WHERE ep3.programa_id = p_programa_id
                GROUP BY tipo_evaluador
            ) tipo_eval_counts
            WHERE ep.programa_id = p_programa_id
        ),
        'objetivos_cumplimiento', json_build_object(
            'objetivos_totales', array_length(ps.objetivos, 1),
            'objetivos_cumplidos', ps.objetivos_cumplidos,
            'porcentaje_objetivos', 
                CASE 
                    WHEN array_length(ps.objetivos, 1) > 0 
                    THEN ROUND((ps.objetivos_cumplidos::NUMERIC / array_length(ps.objetivos, 1) * 100), 2)
                    ELSE 0 
                END
        )
    ) INTO v_resultado
    FROM programas_semanales ps
    LEFT JOIN actividades_programa ap ON ps.id = ap.programa_id
    CROSS JOIN LATERAL (
        SELECT ap.tipo_actividad, COUNT(*) as tipo_count
        FROM actividades_programa ap2
        WHERE ap2.programa_id = p_programa_id
        GROUP BY ap2.tipo_actividad
    ) tipo_counts
    WHERE ps.id = p_programa_id
    GROUP BY ps.id, ps.objetivos, ps.objetivos_cumplidos;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- Obtener resumen de programas por rama
CREATE OR REPLACE FUNCTION obtener_resumen_programas_por_rama()
RETURNS TABLE(
    rama rama_enum,
    total_programas INTEGER,
    programas_activos INTEGER,
    programas_completados INTEGER,
    promedio_evaluacion NUMERIC,
    total_actividades INTEGER,
    porcentaje_completado_promedio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.rama,
        COUNT(*)::INTEGER as total_programas,
        COUNT(CASE WHEN ps.estado = 'ACTIVO' THEN 1 END)::INTEGER as programas_activos,
        COUNT(CASE WHEN ps.estado = 'COMPLETADO' THEN 1 END)::INTEGER as programas_completados,
        COALESCE(ROUND(AVG(evaluaciones.promedio_programa), 2), 0)::NUMERIC as promedio_evaluacion,
        COALESCE(SUM(actividades.total_actividades), 0)::INTEGER as total_actividades,
        COALESCE(ROUND(AVG(actividades.porcentaje_completado), 2), 0)::NUMERIC as porcentaje_completado_promedio
    FROM programas_semanales ps
    LEFT JOIN LATERAL (
        SELECT AVG(ep.calificacion_global) as promedio_programa
        FROM evaluaciones_programa ep
        WHERE ep.programa_id = ps.id
    ) evaluaciones ON true
    LEFT JOIN LATERAL (
        SELECT 
            COUNT(*) as total_actividades,
            CASE 
                WHEN COUNT(*) > 0 
                THEN (COUNT(CASE WHEN ap.estado = 'COMPLETADA' THEN 1 END)::NUMERIC / COUNT(*) * 100)
                ELSE 0 
            END as porcentaje_completado
        FROM actividades_programa ap
        WHERE ap.programa_id = ps.id
    ) actividades ON true
    GROUP BY ps.rama
    ORDER BY 
        CASE ps.rama 
            WHEN 'LOBATOS' THEN 1 
            WHEN 'SCOUTS' THEN 2 
            WHEN 'ROVERS' THEN 3 
            WHEN 'DIRIGENTES' THEN 4 
        END;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '📅 FUNCIONES DE PROGRAMA SEMANAL CREADAS' as estado,
    'Todas las Database Functions del módulo de programa semanal implementadas' as mensaje,
    '10 funciones de programa semanal disponibles' as resumen;