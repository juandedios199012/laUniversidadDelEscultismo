-- ================================================================
-- 🎯 ACTIVIDADES SCOUT DATABASE FUNCTIONS - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 15_functions_actividades.sql
-- Propósito: Database Functions para el módulo de actividades scout
-- ================================================================

-- ============= 🎯 FUNCIONES DE ACTIVIDADES SCOUT =============

-- Crear actividad scout
CREATE OR REPLACE FUNCTION crear_actividad_scout(
    p_nombre VARCHAR(255),
    p_descripcion TEXT,
    p_tipo_actividad VARCHAR(100), -- 'REUNION', 'CAMPAMENTO', 'EXCURSION', 'SERVICIO', 'JUEGO', 'CEREMONIA'
    p_categoria VARCHAR(100), -- 'FORMATIVA', 'RECREATIVA', 'SERVICIO_COMUNITARIO', 'AVENTURA', 'TRADICIONAL'
    p_rama rama_enum,
    p_fecha_inicio TIMESTAMP WITH TIME ZONE,
    p_fecha_fin TIMESTAMP WITH TIME ZONE,
    p_lugar VARCHAR(255),
    p_responsable_id UUID,
    p_direccion TEXT DEFAULT NULL,
    p_coordenadas JSON DEFAULT NULL, -- {latitud: number, longitud: number}
    p_objetivos_educativos TEXT[] DEFAULT '{}',
    p_materiales_necesarios TEXT[] DEFAULT '{}',
    p_costo_estimado DECIMAL(10,2) DEFAULT 0,
    p_cupo_maximo INTEGER DEFAULT NULL,
    p_edad_minima INTEGER DEFAULT NULL,
    p_edad_maxima INTEGER DEFAULT NULL,
    p_requisitos_participacion TEXT[] DEFAULT '{}',
    p_autorizacion_especial BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
    v_actividad_id UUID;
BEGIN
    -- Validaciones
    IF p_fecha_fin <= p_fecha_inicio THEN
        RETURN json_build_object('success', false, 'error', 'La fecha fin debe ser posterior a la fecha inicio');
    END IF;
    
    IF p_costo_estimado < 0 THEN
        RETURN json_build_object('success', false, 'error', 'El costo estimado no puede ser negativo');
    END IF;
    
    IF p_cupo_maximo IS NOT NULL AND p_cupo_maximo <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'El cupo máximo debe ser mayor a cero');
    END IF;
    
    -- Insertar actividad
    INSERT INTO actividades_scout (
        nombre,
        descripcion,
        tipo_actividad,
        categoria,
        rama,
        fecha_inicio,
        fecha_fin,
        lugar,
        direccion,
        coordenadas,
        responsable_id,
        objetivos_educativos,
        materiales_necesarios,
        costo_estimado,
        cupo_maximo,
        edad_minima,
        edad_maxima,
        requisitos_participacion,
        autorizacion_especial,
        estado
    ) VALUES (
        p_nombre,
        p_descripcion,
        p_tipo_actividad,
        p_categoria,
        p_rama,
        p_fecha_inicio,
        p_fecha_fin,
        p_lugar,
        p_direccion,
        p_coordenadas,
        p_responsable_id,
        p_objetivos_educativos,
        p_materiales_necesarios,
        p_costo_estimado,
        p_cupo_maximo,
        p_edad_minima,
        p_edad_maxima,
        p_requisitos_participacion,
        p_autorizacion_especial,
        'PLANIFICADA'
    ) RETURNING id INTO v_actividad_id;
    
    RETURN json_build_object('success', true, 'actividad_id', v_actividad_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener actividades scout
CREATE OR REPLACE FUNCTION obtener_actividades_scout(p_filtros JSON DEFAULT '{}')
RETURNS TABLE(
    id UUID,
    nombre VARCHAR(255),
    descripcion TEXT,
    tipo_actividad VARCHAR(100),
    categoria VARCHAR(100),
    rama rama_enum,
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    lugar VARCHAR(255),
    responsable VARCHAR(255),
    costo_estimado DECIMAL(10,2),
    cupo_maximo INTEGER,
    inscripciones_actuales INTEGER,
    estado VARCHAR(50),
    evaluacion_promedio NUMERIC,
    objetivos_cumplidos INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_rama rama_enum;
    v_tipo VARCHAR(100);
    v_categoria VARCHAR(100);
    v_estado VARCHAR(50);
    v_fecha_desde DATE;
    v_fecha_hasta DATE;
    v_responsable_id UUID;
BEGIN
    -- Extraer filtros
    v_rama := (p_filtros->>'rama')::rama_enum;
    v_tipo := p_filtros->>'tipo_actividad';
    v_categoria := p_filtros->>'categoria';
    v_estado := p_filtros->>'estado';
    v_fecha_desde := (p_filtros->>'fecha_desde')::DATE;
    v_fecha_hasta := (p_filtros->>'fecha_hasta')::DATE;
    v_responsable_id := (p_filtros->>'responsable_id')::UUID;
    
    RETURN QUERY
    SELECT 
        a.id,
        a.nombre,
        a.descripcion,
        a.tipo_actividad,
        a.categoria,
        a.rama,
        a.fecha_inicio,
        a.fecha_fin,
        a.lugar,
        COALESCE(s.nombres || ' ' || s.apellidos, '') as responsable,
        a.costo_estimado,
        a.cupo_maximo,
        COALESCE(inscripciones.total, 0)::INTEGER as inscripciones_actuales,
        a.estado,
        COALESCE(evaluaciones.promedio, 0)::NUMERIC as evaluacion_promedio,
        COALESCE(a.objetivos_cumplidos, 0)::INTEGER as objetivos_cumplidos,
        a.created_at
    FROM actividades_scout a
    LEFT JOIN scouts s ON a.responsable_id = s.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as total
        FROM inscripciones_actividad ia
        WHERE ia.actividad_id = a.id AND ia.estado != 'CANCELADA'
    ) inscripciones ON true
    LEFT JOIN LATERAL (
        SELECT AVG(calificacion_general) as promedio
        FROM evaluaciones_actividad ea
        WHERE ea.actividad_id = a.id
    ) evaluaciones ON true
    WHERE 
        (v_rama IS NULL OR a.rama = v_rama)
        AND (v_tipo IS NULL OR a.tipo_actividad = v_tipo)
        AND (v_categoria IS NULL OR a.categoria = v_categoria)
        AND (v_estado IS NULL OR a.estado = v_estado)
        AND (v_fecha_desde IS NULL OR a.fecha_inicio::DATE >= v_fecha_desde)
        AND (v_fecha_hasta IS NULL OR a.fecha_inicio::DATE <= v_fecha_hasta)
        AND (v_responsable_id IS NULL OR a.responsable_id = v_responsable_id)
    ORDER BY a.fecha_inicio;
END;
$$ LANGUAGE plpgsql;

-- Obtener actividad específica
CREATE OR REPLACE FUNCTION obtener_actividad_scout_por_id(p_actividad_id UUID)
RETURNS TABLE(
    id UUID,
    nombre VARCHAR(255),
    descripcion TEXT,
    tipo_actividad VARCHAR(100),
    categoria VARCHAR(100),
    rama rama_enum,
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    lugar VARCHAR(255),
    direccion TEXT,
    coordenadas JSON,
    responsable_id UUID,
    responsable VARCHAR(255),
    objetivos_educativos TEXT[],
    materiales_necesarios TEXT[],
    costo_estimado DECIMAL(10,2),
    cupo_maximo INTEGER,
    edad_minima INTEGER,
    edad_maxima INTEGER,
    requisitos_participacion TEXT[],
    autorizacion_especial BOOLEAN,
    estado VARCHAR(50),
    observaciones TEXT,
    objetivos_cumplidos INTEGER,
    inscripciones_confirmadas INTEGER,
    costo_real DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.nombre,
        a.descripcion,
        a.tipo_actividad,
        a.categoria,
        a.rama,
        a.fecha_inicio,
        a.fecha_fin,
        a.lugar,
        a.direccion,
        a.coordenadas,
        a.responsable_id,
        COALESCE(s.nombres || ' ' || s.apellidos, '') as responsable,
        a.objetivos_educativos,
        a.materiales_necesarios,
        a.costo_estimado,
        a.cupo_maximo,
        a.edad_minima,
        a.edad_maxima,
        a.requisitos_participacion,
        a.autorizacion_especial,
        a.estado,
        a.observaciones,
        a.objetivos_cumplidos,
        COALESCE(inscripciones.confirmadas, 0)::INTEGER as inscripciones_confirmadas,
        a.costo_real,
        a.created_at,
        a.updated_at
    FROM actividades_scout a
    LEFT JOIN scouts s ON a.responsable_id = s.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as confirmadas
        FROM inscripciones_actividad ia
        WHERE ia.actividad_id = a.id AND ia.estado = 'CONFIRMADA'
    ) inscripciones ON true
    WHERE a.id = p_actividad_id;
END;
$$ LANGUAGE plpgsql;

-- Actualizar actividad scout
CREATE OR REPLACE FUNCTION actualizar_actividad_scout(
    p_actividad_id UUID,
    p_nombre VARCHAR(255) DEFAULT NULL,
    p_descripcion TEXT DEFAULT NULL,
    p_fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_fecha_fin TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_lugar VARCHAR(255) DEFAULT NULL,
    p_direccion TEXT DEFAULT NULL,
    p_costo_estimado DECIMAL(10,2) DEFAULT NULL,
    p_costo_real DECIMAL(10,2) DEFAULT NULL,
    p_cupo_maximo INTEGER DEFAULT NULL,
    p_estado VARCHAR(50) DEFAULT NULL,
    p_observaciones TEXT DEFAULT NULL,
    p_objetivos_cumplidos INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    -- Verificar que la actividad existe
    IF NOT EXISTS (SELECT 1 FROM actividades_scout WHERE id = p_actividad_id) THEN
        RETURN json_build_object('success', false, 'error', 'Actividad no encontrada');
    END IF;
    
    -- Validaciones
    IF p_fecha_inicio IS NOT NULL AND p_fecha_fin IS NOT NULL AND p_fecha_fin <= p_fecha_inicio THEN
        RETURN json_build_object('success', false, 'error', 'La fecha fin debe ser posterior a la fecha inicio');
    END IF;
    
    -- Actualizar actividad
    UPDATE actividades_scout SET
        nombre = COALESCE(p_nombre, nombre),
        descripcion = COALESCE(p_descripcion, descripcion),
        fecha_inicio = COALESCE(p_fecha_inicio, fecha_inicio),
        fecha_fin = COALESCE(p_fecha_fin, fecha_fin),
        lugar = COALESCE(p_lugar, lugar),
        direccion = COALESCE(p_direccion, direccion),
        costo_estimado = COALESCE(p_costo_estimado, costo_estimado),
        costo_real = COALESCE(p_costo_real, costo_real),
        cupo_maximo = COALESCE(p_cupo_maximo, cupo_maximo),
        estado = COALESCE(p_estado, estado),
        observaciones = COALESCE(p_observaciones, observaciones),
        objetivos_cumplidos = COALESCE(p_objetivos_cumplidos, objetivos_cumplidos),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_actividad_id;
    
    RETURN json_build_object('success', true, 'actividad_id', p_actividad_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 📝 FUNCIONES DE INSCRIPCIONES A ACTIVIDADES =============

-- Inscribir scout a actividad
CREATE OR REPLACE FUNCTION inscribir_scout_actividad(
    p_actividad_id UUID,
    p_scout_id UUID,
    p_acompañante_autorizado VARCHAR(255) DEFAULT NULL,
    p_telefono_emergencia VARCHAR(20) DEFAULT NULL,
    p_observaciones_medicas TEXT DEFAULT NULL,
    p_autorizacion_padres BOOLEAN DEFAULT TRUE
)
RETURNS JSON AS $$
DECLARE
    v_inscripcion_id UUID;
    v_cupo_disponible INTEGER;
    v_inscripciones_actuales INTEGER;
    v_cupo_maximo INTEGER;
    v_edad_scout INTEGER;
    v_edad_minima INTEGER;
    v_edad_maxima INTEGER;
    v_estado_actividad VARCHAR(50);
BEGIN
    -- Verificar estado de la actividad
    SELECT estado, cupo_maximo, edad_minima, edad_maxima
    INTO v_estado_actividad, v_cupo_maximo, v_edad_minima, v_edad_maxima
    FROM actividades_scout
    WHERE id = p_actividad_id;
    
    IF v_estado_actividad IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Actividad no encontrada');
    END IF;
    
    IF v_estado_actividad NOT IN ('PLANIFICADA', 'ABIERTA_INSCRIPCIONES') THEN
        RETURN json_build_object('success', false, 'error', 'La actividad no está disponible para inscripciones');
    END IF;
    
    -- Verificar que el scout no esté ya inscrito
    IF EXISTS (
        SELECT 1 FROM inscripciones_actividad 
        WHERE actividad_id = p_actividad_id AND scout_id = p_scout_id AND estado != 'CANCELADA'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'El scout ya está inscrito en esta actividad');
    END IF;
    
    -- Verificar cupo disponible
    SELECT COUNT(*) INTO v_inscripciones_actuales
    FROM inscripciones_actividad
    WHERE actividad_id = p_actividad_id AND estado != 'CANCELADA';
    
    IF v_cupo_maximo IS NOT NULL AND v_inscripciones_actuales >= v_cupo_maximo THEN
        RETURN json_build_object('success', false, 'error', 'No hay cupo disponible para esta actividad');
    END IF;
    
    -- Verificar edad del scout
    SELECT EXTRACT(YEAR FROM AGE(fecha_nacimiento)) INTO v_edad_scout
    FROM scouts WHERE id = p_scout_id;
    
    IF v_edad_minima IS NOT NULL AND v_edad_scout < v_edad_minima THEN
        RETURN json_build_object('success', false, 'error', 'El scout no cumple con la edad mínima requerida');
    END IF;
    
    IF v_edad_maxima IS NOT NULL AND v_edad_scout > v_edad_maxima THEN
        RETURN json_build_object('success', false, 'error', 'El scout excede la edad máxima permitida');
    END IF;
    
    -- Crear inscripción
    INSERT INTO inscripciones_actividad (
        actividad_id,
        scout_id,
        acompañante_autorizado,
        telefono_emergencia,
        observaciones_medicas,
        autorizacion_padres,
        estado
    ) VALUES (
        p_actividad_id,
        p_scout_id,
        p_acompañante_autorizado,
        p_telefono_emergencia,
        p_observaciones_medicas,
        p_autorizacion_padres,
        'PENDIENTE'
    ) RETURNING id INTO v_inscripcion_id;
    
    RETURN json_build_object('success', true, 'inscripcion_id', v_inscripcion_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener inscripciones de actividad
CREATE OR REPLACE FUNCTION obtener_inscripciones_actividad(p_actividad_id UUID)
RETURNS TABLE(
    id UUID,
    scout_nombre VARCHAR(255),
    scout_documento VARCHAR(20),
    scout_rama rama_enum,
    scout_edad INTEGER,
    estado VARCHAR(50),
    acompañante_autorizado VARCHAR(255),
    telefono_emergencia VARCHAR(20),
    observaciones_medicas TEXT,
    autorizacion_padres BOOLEAN,
    fecha_inscripcion DATE,
    fecha_confirmacion DATE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ia.id,
        s.nombres || ' ' || s.apellidos as scout_nombre,
        s.documento_identidad as scout_documento,
        s.rama as scout_rama,
        EXTRACT(YEAR FROM AGE(s.fecha_nacimiento))::INTEGER as scout_edad,
        ia.estado,
        ia.acompañante_autorizado,
        ia.telefono_emergencia,
        ia.observaciones_medicas,
        ia.autorizacion_padres,
        ia.fecha_inscripcion,
        ia.fecha_confirmacion,
        ia.created_at
    FROM inscripciones_actividad ia
    INNER JOIN scouts s ON ia.scout_id = s.id
    WHERE ia.actividad_id = p_actividad_id
    ORDER BY ia.created_at;
END;
$$ LANGUAGE plpgsql;

-- Confirmar inscripción a actividad
CREATE OR REPLACE FUNCTION confirmar_inscripcion_actividad(
    p_inscripcion_id UUID,
    p_dirigente_confirmador_id UUID,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    -- Verificar que la inscripción existe y está pendiente
    IF NOT EXISTS (
        SELECT 1 FROM inscripciones_actividad 
        WHERE id = p_inscripcion_id AND estado = 'PENDIENTE'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Inscripción no encontrada o ya procesada');
    END IF;
    
    -- Confirmar inscripción
    UPDATE inscripciones_actividad SET
        estado = 'CONFIRMADA',
        fecha_confirmacion = CURRENT_DATE,
        dirigente_confirmador_id = p_dirigente_confirmador_id,
        observaciones_confirmacion = p_observaciones,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_inscripcion_id;
    
    RETURN json_build_object('success', true, 'inscripcion_id', p_inscripcion_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= ⭐ FUNCIONES DE EVALUACIÓN =============

-- Crear evaluación de actividad
CREATE OR REPLACE FUNCTION crear_evaluacion_actividad(
    p_actividad_id UUID,
    p_evaluador_id UUID,
    p_tipo_evaluador VARCHAR(50), -- 'SCOUT', 'DIRIGENTE', 'PADRE'
    p_calificacion_general INTEGER,
    p_aspectos_evaluados JSON, -- {organización: 5, diversión: 4, aprendizaje: 5, ...}
    p_comentarios TEXT DEFAULT NULL,
    p_sugerencias TEXT DEFAULT NULL,
    p_recomendaria BOOLEAN DEFAULT TRUE
)
RETURNS JSON AS $$
DECLARE
    v_evaluacion_id UUID;
BEGIN
    -- Validar calificación
    IF p_calificacion_general < 1 OR p_calificacion_general > 5 THEN
        RETURN json_build_object('success', false, 'error', 'La calificación general debe estar entre 1 y 5');
    END IF;
    
    -- Verificar que la actividad existe
    IF NOT EXISTS (SELECT 1 FROM actividades_scout WHERE id = p_actividad_id) THEN
        RETURN json_build_object('success', false, 'error', 'Actividad no encontrada');
    END IF;
    
    -- Verificar que el evaluador participó en la actividad (para scouts)
    IF p_tipo_evaluador = 'SCOUT' THEN
        IF NOT EXISTS (
            SELECT 1 FROM inscripciones_actividad 
            WHERE actividad_id = p_actividad_id AND scout_id = p_evaluador_id AND estado = 'CONFIRMADA'
        ) THEN
            RETURN json_build_object('success', false, 'error', 'Solo los scouts que participaron pueden evaluar la actividad');
        END IF;
    END IF;
    
    -- Insertar evaluación
    INSERT INTO evaluaciones_actividad (
        actividad_id,
        evaluador_id,
        tipo_evaluador,
        calificacion_general,
        aspectos_evaluados,
        comentarios,
        sugerencias,
        recomendaria
    ) VALUES (
        p_actividad_id,
        p_evaluador_id,
        p_tipo_evaluador,
        p_calificacion_general,
        p_aspectos_evaluados,
        p_comentarios,
        p_sugerencias,
        p_recomendaria
    ) RETURNING id INTO v_evaluacion_id;
    
    RETURN json_build_object('success', true, 'evaluacion_id', v_evaluacion_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener evaluaciones de actividad
CREATE OR REPLACE FUNCTION obtener_evaluaciones_actividad(p_actividad_id UUID)
RETURNS TABLE(
    id UUID,
    evaluador VARCHAR(255),
    tipo_evaluador VARCHAR(50),
    calificacion_general INTEGER,
    aspectos_evaluados JSON,
    comentarios TEXT,
    sugerencias TEXT,
    recomendaria BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.id,
        COALESCE(s.nombres || ' ' || s.apellidos, 'Evaluador Anónimo') as evaluador,
        ea.tipo_evaluador,
        ea.calificacion_general,
        ea.aspectos_evaluados,
        ea.comentarios,
        ea.sugerencias,
        ea.recomendaria,
        ea.created_at
    FROM evaluaciones_actividad ea
    LEFT JOIN scouts s ON ea.evaluador_id = s.id
    WHERE ea.actividad_id = p_actividad_id
    ORDER BY ea.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============= 📊 FUNCIONES DE ESTADÍSTICAS =============

-- Obtener estadísticas de actividades
CREATE OR REPLACE FUNCTION obtener_estadisticas_actividades(p_filtros JSON DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
    v_rama rama_enum;
    v_año INTEGER;
    v_where_clause TEXT := 'WHERE 1=1';
BEGIN
    -- Construir filtros
    v_rama := (p_filtros->>'rama')::rama_enum;
    v_año := (p_filtros->>'año')::INTEGER;
    
    IF v_rama IS NOT NULL THEN
        v_where_clause := v_where_clause || format(' AND a.rama = ''%s''', v_rama);
    END IF;
    
    IF v_año IS NOT NULL THEN
        v_where_clause := v_where_clause || format(' AND EXTRACT(YEAR FROM a.fecha_inicio) = %s', v_año);
    END IF;
    
    EXECUTE format('
        SELECT json_build_object(
            ''resumen_general'', json_build_object(
                ''total_actividades'', COUNT(*),
                ''actividades_completadas'', COUNT(CASE WHEN a.estado = ''COMPLETADA'' THEN 1 END),
                ''actividades_programadas'', COUNT(CASE WHEN a.estado IN (''PLANIFICADA'', ''ABIERTA_INSCRIPCIONES'') THEN 1 END),
                ''actividades_canceladas'', COUNT(CASE WHEN a.estado = ''CANCELADA'' THEN 1 END),
                ''promedio_participacion'', ROUND(AVG(participacion.total), 2),
                ''evaluacion_promedio'', ROUND(AVG(evaluaciones.promedio), 2)
            ),
            ''actividades_por_tipo'', json_object_agg(a.tipo_actividad, tipo_count),
            ''actividades_por_rama'', json_object_agg(a.rama, rama_count),
            ''tendencias_mensuales'', (
                SELECT json_agg(tendencia ORDER BY mes)
                FROM (
                    SELECT 
                        TO_CHAR(a2.fecha_inicio, ''YYYY-MM'') as mes,
                        COUNT(*) as actividades_mes,
                        AVG(participacion2.total) as promedio_participacion_mes
                    FROM actividades_scout a2
                    LEFT JOIN LATERAL (
                        SELECT COUNT(*) as total
                        FROM inscripciones_actividad ia2
                        WHERE ia2.actividad_id = a2.id AND ia2.estado = ''CONFIRMADA''
                    ) participacion2 ON true
                    %s
                    GROUP BY TO_CHAR(a2.fecha_inicio, ''YYYY-MM'')
                    ORDER BY mes
                ) tendencia
            ),
            ''top_actividades_evaluadas'', (
                SELECT json_agg(top_act ORDER BY evaluacion_promedio DESC)
                FROM (
                    SELECT 
                        a3.nombre,
                        a3.tipo_actividad,
                        ROUND(AVG(ea.calificacion_general), 2) as evaluacion_promedio,
                        COUNT(ea.*) as total_evaluaciones
                    FROM actividades_scout a3
                    INNER JOIN evaluaciones_actividad ea ON a3.id = ea.actividad_id
                    %s
                    GROUP BY a3.id, a3.nombre, a3.tipo_actividad
                    HAVING COUNT(ea.*) >= 3
                    ORDER BY evaluacion_promedio DESC
                    LIMIT 10
                ) top_act
            )
        )
        FROM actividades_scout a
        CROSS JOIN LATERAL (
            SELECT a.tipo_actividad, COUNT(*) as tipo_count
            FROM actividades_scout a2
            %s
            GROUP BY a2.tipo_actividad
        ) tipo_counts
        CROSS JOIN LATERAL (
            SELECT a.rama, COUNT(*) as rama_count
            FROM actividades_scout a3
            %s
            GROUP BY a3.rama
        ) rama_counts
        LEFT JOIN LATERAL (
            SELECT COUNT(*) as total
            FROM inscripciones_actividad ia
            WHERE ia.actividad_id = a.id AND ia.estado = ''CONFIRMADA''
        ) participacion ON true
        LEFT JOIN LATERAL (
            SELECT AVG(ea.calificacion_general) as promedio
            FROM evaluaciones_actividad ea
            WHERE ea.actividad_id = a.id
        ) evaluaciones ON true
        %s',
        v_where_clause, v_where_clause, v_where_clause, v_where_clause, v_where_clause
    ) INTO v_resultado;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- Obtener calendario de actividades
CREATE OR REPLACE FUNCTION obtener_calendario_actividades(
    p_fecha_desde DATE DEFAULT CURRENT_DATE,
    p_fecha_hasta DATE DEFAULT (CURRENT_DATE + INTERVAL '3 months'),
    p_rama rama_enum DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    nombre VARCHAR(255),
    tipo_actividad VARCHAR(100),
    rama rama_enum,
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    lugar VARCHAR(255),
    responsable VARCHAR(255),
    estado VARCHAR(50),
    inscripciones_actuales INTEGER,
    cupo_maximo INTEGER,
    costo_estimado DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.nombre,
        a.tipo_actividad,
        a.rama,
        a.fecha_inicio,
        a.fecha_fin,
        a.lugar,
        COALESCE(s.nombres || ' ' || s.apellidos, '') as responsable,
        a.estado,
        COALESCE(inscripciones.total, 0)::INTEGER as inscripciones_actuales,
        a.cupo_maximo,
        a.costo_estimado
    FROM actividades_scout a
    LEFT JOIN scouts s ON a.responsable_id = s.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as total
        FROM inscripciones_actividad ia
        WHERE ia.actividad_id = a.id AND ia.estado != 'CANCELADA'
    ) inscripciones ON true
    WHERE 
        a.fecha_inicio::DATE BETWEEN p_fecha_desde AND p_fecha_hasta
        AND (p_rama IS NULL OR a.rama = p_rama)
        AND a.estado != 'CANCELADA'
    ORDER BY a.fecha_inicio;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '🎯 FUNCIONES DE ACTIVIDADES SCOUT CREADAS' as estado,
    'Todas las Database Functions del módulo de actividades implementadas' as mensaje,
    '12 funciones de actividades scout disponibles' as resumen;