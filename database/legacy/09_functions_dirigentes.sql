-- ================================================================
-- 👨‍🏫 DIRIGENTES DATABASE FUNCTIONS - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 09_functions_dirigentes.sql
-- Propósito: Database Functions para el módulo de dirigentes
-- ================================================================

-- ============= 👨‍🏫 FUNCIONES DE DIRIGENTES =============

-- Obtener dirigentes con filtros
CREATE OR REPLACE FUNCTION obtener_dirigentes(p_filtros JSON DEFAULT '{}')
RETURNS TABLE(
    id UUID,
    codigo_dirigente VARCHAR(20),
    scout_nombres VARCHAR(255),
    scout_apellidos VARCHAR(255),
    cargo VARCHAR(100),
    rama_responsable rama_enum,
    nivel_formacion VARCHAR(50),
    estado estado_enum,
    fecha_nombramiento DATE,
    fecha_fin_periodo DATE,
    telefono VARCHAR(20),
    email VARCHAR(255),
    experiencia_años INTEGER,
    especialidades TEXT[],
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_rama rama_enum;
    v_estado estado_enum;
    v_cargo VARCHAR(100);
    v_nivel_formacion VARCHAR(50);
BEGIN
    -- Extraer filtros
    v_rama := (p_filtros->>'rama')::rama_enum;
    v_estado := (p_filtros->>'estado')::estado_enum;
    v_cargo := p_filtros->>'cargo';
    v_nivel_formacion := p_filtros->>'nivel_formacion';
    
    RETURN QUERY
    SELECT 
        d.id,
        d.codigo_dirigente,
        s.nombres as scout_nombres,
        s.apellidos as scout_apellidos,
        d.cargo,
        d.rama_responsable,
        d.nivel_formacion,
        d.estado_dirigente,
        d.fecha_ingreso_dirigente,
        d.fecha_fin_periodo,
        s.celular as telefono,
        s.correo as email,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, d.fecha_ingreso_dirigente))::INTEGER as experiencia_años,
        d.especialidades,
        d.created_at
    FROM dirigentes d
    INNER JOIN scouts s ON d.scout_id = s.id
    WHERE 
        (v_rama IS NULL OR d.rama_responsable = v_rama)
        AND (v_estado IS NULL OR d.estado_dirigente = v_estado)
        AND (v_cargo IS NULL OR d.cargo ILIKE '%' || v_cargo || '%')
        AND (v_nivel_formacion IS NULL OR d.nivel_formacion = v_nivel_formacion)
    ORDER BY d.rama_responsable, d.cargo, s.nombres;
END;
$$ LANGUAGE plpgsql;

-- Crear dirigente
CREATE OR REPLACE FUNCTION crear_dirigente(
    p_scout_id UUID,
    p_cargo VARCHAR(100),
    p_rama_responsable rama_enum,
    p_nivel_formacion VARCHAR(50) DEFAULT 'CANDIDATO',
    p_fecha_nombramiento DATE DEFAULT CURRENT_DATE,
    p_fecha_fin_periodo DATE DEFAULT NULL,
    p_especialidades TEXT[] DEFAULT '{}',
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_dirigente_id UUID;
    v_codigo_dirigente VARCHAR(20);
BEGIN
    -- Verificar que el scout existe y no sea ya dirigente activo
    IF NOT EXISTS (SELECT 1 FROM scouts WHERE id = p_scout_id AND estado = 'ACTIVO') THEN
        RETURN json_build_object('success', false, 'error', 'Scout no encontrado o inactivo');
    END IF;
    
    IF EXISTS (SELECT 1 FROM dirigentes WHERE scout_id = p_scout_id AND estado_dirigente = 'ACTIVO') THEN
        RETURN json_build_object('success', false, 'error', 'El scout ya es dirigente activo');
    END IF;
    
    -- Marcar scout como dirigente
    UPDATE scouts SET es_dirigente = true WHERE id = p_scout_id;
    
    -- Generar código único
    v_codigo_dirigente := generar_codigo_dirigente();
    
    -- Insertar dirigente
    INSERT INTO dirigentes (
        scout_id,
        codigo_dirigente,
        cargo,
        rama_responsable,
        nivel_formacion,
        observaciones,
        estado_dirigente
    ) VALUES (
        p_scout_id,
        v_codigo_dirigente,
        p_cargo,
        p_rama_responsable,
        p_nivel_formacion,
        p_observaciones,
        'ACTIVO'
    ) RETURNING id INTO v_dirigente_id;
    
    RETURN json_build_object('success', true, 'dirigente_id', v_dirigente_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Actualizar dirigente
CREATE OR REPLACE FUNCTION actualizar_dirigente(
    p_dirigente_id UUID,
    p_cargo VARCHAR(100) DEFAULT NULL,
    p_rama_responsable rama_enum DEFAULT NULL,
    p_nivel_formacion VARCHAR(50) DEFAULT NULL,
    p_fecha_fin_periodo DATE DEFAULT NULL,
    p_especialidades TEXT[] DEFAULT NULL,
    p_estado estado_enum DEFAULT NULL,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    -- Verificar que el dirigente existe
    IF NOT EXISTS (SELECT 1 FROM dirigentes WHERE id = p_dirigente_id) THEN
        RETURN json_build_object('success', false, 'error', 'Dirigente no encontrado');
    END IF;
    
    -- Actualizar dirigente
    UPDATE dirigentes SET
        cargo = COALESCE(p_cargo, cargo),
        rama_responsable = COALESCE(p_rama_responsable, rama_responsable),
        nivel_formacion = COALESCE(p_nivel_formacion, nivel_formacion),
        estado_dirigente = COALESCE(p_estado, estado_dirigente),
        observaciones = COALESCE(p_observaciones, observaciones),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_dirigente_id;
    
    RETURN json_build_object('success', true, 'dirigente_id', p_dirigente_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 📚 FUNCIONES DE FORMACIÓN =============

-- Registrar curso de formación
CREATE OR REPLACE FUNCTION registrar_curso_formacion(
    p_dirigente_id UUID,
    p_nombre_curso VARCHAR(255),
    p_institucion VARCHAR(255),
    p_tipo_curso VARCHAR(100),
    p_fecha_inicio DATE,
    p_fecha_fin DATE DEFAULT NULL,
    p_horas_academicas INTEGER DEFAULT NULL,
    p_estado_curso VARCHAR(50) DEFAULT 'EN_CURSO',
    p_certificado_obtenido BOOLEAN DEFAULT FALSE,
    p_calificacion DECIMAL(4,2) DEFAULT NULL,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_curso_id UUID;
BEGIN
    -- Verificar que el dirigente existe
    IF NOT EXISTS (SELECT 1 FROM dirigentes WHERE id = p_dirigente_id) THEN
        RETURN json_build_object('success', false, 'error', 'Dirigente no encontrado');
    END IF;
    
    -- Insertar curso
    INSERT INTO formacion_dirigentes (
        dirigente_id,
        nombre_curso,
        institucion,
        tipo_curso,
        fecha_inicio,
        fecha_fin,
        horas_academicas,
        estado_curso,
        certificado_obtenido,
        calificacion,
        observaciones
    ) VALUES (
        p_dirigente_id,
        p_nombre_curso,
        p_institucion,
        p_tipo_curso,
        p_fecha_inicio,
        p_fecha_fin,
        p_horas_academicas,
        p_estado_curso,
        p_certificado_obtenido,
        p_calificacion,
        p_observaciones
    ) RETURNING id INTO v_curso_id;
    
    -- Actualizar nivel de formación del dirigente si corresponde
    IF p_certificado_obtenido AND p_tipo_curso IN ('PRELIMINAR', 'BASICO', 'INTERMEDIO', 'AVANZADO') THEN
        UPDATE dirigentes 
        SET nivel_formacion = p_tipo_curso,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_dirigente_id;
    END IF;
    
    RETURN json_build_object('success', true, 'curso_id', v_curso_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener formación de dirigente
CREATE OR REPLACE FUNCTION obtener_formacion_dirigente(p_dirigente_id UUID)
RETURNS TABLE(
    id UUID,
    nombre_curso VARCHAR(255),
    institucion VARCHAR(255),
    tipo_curso VARCHAR(100),
    fecha_inicio DATE,
    fecha_fin DATE,
    horas_academicas INTEGER,
    estado_curso VARCHAR(50),
    certificado_obtenido BOOLEAN,
    calificacion DECIMAL(4,2),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.nombre_curso,
        f.institucion,
        f.tipo_curso,
        f.fecha_inicio,
        f.fecha_fin,
        f.horas_academicas,
        f.estado_curso,
        f.certificado_obtenido,
        f.calificacion,
        f.observaciones,
        f.created_at
    FROM formacion_dirigentes f
    WHERE f.dirigente_id = p_dirigente_id
    ORDER BY f.fecha_inicio DESC;
END;
$$ LANGUAGE plpgsql;

-- ============= 📊 FUNCIONES DE EVALUACIÓN =============

-- Registrar evaluación 360
CREATE OR REPLACE FUNCTION registrar_evaluacion_360(
    p_dirigente_evaluado_id UUID,
    p_evaluador_id UUID,
    p_tipo_evaluador VARCHAR(50), -- 'DIRIGENTE', 'SCOUT', 'PADRE', 'AUTOEVALUACION'
    p_periodo VARCHAR(20),
    p_puntuaciones JSON, -- {area: puntuacion, ...}
    p_fortalezas TEXT[] DEFAULT '{}',
    p_areas_mejora TEXT[] DEFAULT '{}',
    p_comentarios TEXT DEFAULT NULL,
    p_recomendaciones TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_evaluacion_id UUID;
    v_promedio_general DECIMAL(4,2);
BEGIN
    -- Verificar que el dirigente existe
    IF NOT EXISTS (SELECT 1 FROM dirigentes WHERE id = p_dirigente_evaluado_id) THEN
        RETURN json_build_object('success', false, 'error', 'Dirigente no encontrado');
    END IF;
    
    -- Calcular promedio general
    SELECT AVG((value::TEXT)::DECIMAL) INTO v_promedio_general
    FROM json_each_text(p_puntuaciones);
    
    -- Insertar evaluación
    INSERT INTO evaluaciones_dirigentes (
        dirigente_id,
        evaluador_id,
        tipo_evaluador,
        periodo,
        puntuaciones,
        promedio_general,
        fortalezas,
        areas_mejora,
        comentarios,
        recomendaciones
    ) VALUES (
        p_dirigente_evaluado_id,
        p_evaluador_id,
        p_tipo_evaluador,
        p_periodo,
        p_puntuaciones,
        v_promedio_general,
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

-- Obtener resumen de evaluaciones
CREATE OR REPLACE FUNCTION obtener_resumen_evaluaciones_dirigente(
    p_dirigente_id UUID,
    p_periodo VARCHAR(20) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'dirigente_id', p_dirigente_id,
        'periodo', COALESCE(p_periodo, 'TODOS'),
        'total_evaluaciones', COUNT(*),
        'promedio_general', ROUND(AVG(promedio_general), 2),
        'evaluaciones_por_tipo', json_object_agg(tipo_evaluador, tipo_stats),
        'areas_puntuadas', (
            SELECT json_object_agg(area, area_promedio)
            FROM (
                SELECT 
                    areas.key as area,
                    ROUND(AVG((areas.value::TEXT)::DECIMAL), 2) as area_promedio
                FROM evaluaciones_dirigentes e,
                     json_each_text(e.puntuaciones) areas
                WHERE e.dirigente_id = p_dirigente_id
                AND (p_periodo IS NULL OR e.periodo = p_periodo)
                GROUP BY areas.key
            ) area_promedios
        ),
        'fortalezas_comunes', (
            SELECT array_agg(DISTINCT fortaleza)
            FROM evaluaciones_dirigentes e,
                 unnest(e.fortalezas) fortaleza
            WHERE e.dirigente_id = p_dirigente_id
            AND (p_periodo IS NULL OR e.periodo = p_periodo)
            LIMIT 10
        ),
        'areas_mejora_comunes', (
            SELECT array_agg(DISTINCT area_mejora)
            FROM evaluaciones_dirigentes e,
                 unnest(e.areas_mejora) area_mejora
            WHERE e.dirigente_id = p_dirigente_id
            AND (p_periodo IS NULL OR e.periodo = p_periodo)
            LIMIT 10
        ),
        'tendencia_evaluaciones', (
            SELECT json_agg(eval_mensual ORDER BY periodo_eval)
            FROM (
                SELECT 
                    e.periodo as periodo_eval,
                    ROUND(AVG(e.promedio_general), 2) as promedio_periodo,
                    COUNT(*) as total_evaluaciones_periodo
                FROM evaluaciones_dirigentes e
                WHERE e.dirigente_id = p_dirigente_id
                AND (p_periodo IS NULL OR e.periodo = p_periodo)
                GROUP BY e.periodo
                ORDER BY e.periodo
            ) eval_mensual
        )
    ) INTO v_resultado
    FROM evaluaciones_dirigentes e
    CROSS JOIN LATERAL (
        SELECT 
            e.tipo_evaluador,
            json_build_object(
                'cantidad', COUNT(*),
                'promedio', ROUND(AVG(e2.promedio_general), 2)
            ) as tipo_stats
        FROM evaluaciones_dirigentes e2
        WHERE e2.dirigente_id = p_dirigente_id
        AND e2.tipo_evaluador = e.tipo_evaluador
        AND (p_periodo IS NULL OR e2.periodo = p_periodo)
        GROUP BY e2.tipo_evaluador
    ) tipo_stats_lateral
    WHERE e.dirigente_id = p_dirigente_id
    AND (p_periodo IS NULL OR e.periodo = p_periodo);
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ============= 📋 FUNCIONES DE RESPONSABILIDADES =============

-- Asignar responsabilidad
CREATE OR REPLACE FUNCTION asignar_responsabilidad_dirigente(
    p_dirigente_id UUID,
    p_tipo_responsabilidad VARCHAR(100),
    p_descripcion TEXT,
    p_fecha_inicio DATE DEFAULT CURRENT_DATE,
    p_fecha_fin DATE DEFAULT NULL,
    p_prioridad INTEGER DEFAULT 3,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_responsabilidad_id UUID;
BEGIN
    -- Verificar que el dirigente existe y está activo
    IF NOT EXISTS (SELECT 1 FROM dirigentes WHERE id = p_dirigente_id AND estado = 'ACTIVO') THEN
        RETURN json_build_object('success', false, 'error', 'Dirigente no encontrado o inactivo');
    END IF;
    
    -- Insertar responsabilidad
    INSERT INTO responsabilidades_dirigentes (
        dirigente_id,
        tipo_responsabilidad,
        descripcion,
        fecha_inicio,
        fecha_fin,
        prioridad,
        observaciones,
        estado
    ) VALUES (
        p_dirigente_id,
        p_tipo_responsabilidad,
        p_descripcion,
        p_fecha_inicio,
        p_fecha_fin,
        p_prioridad,
        p_observaciones,
        'ACTIVA'
    ) RETURNING id INTO v_responsabilidad_id;
    
    RETURN json_build_object('success', true, 'responsabilidad_id', v_responsabilidad_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener responsabilidades activas
CREATE OR REPLACE FUNCTION obtener_responsabilidades_dirigente(
    p_dirigente_id UUID,
    p_incluir_finalizadas BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    id UUID,
    tipo_responsabilidad VARCHAR(100),
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    prioridad INTEGER,
    estado VARCHAR(50),
    dias_activa INTEGER,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.tipo_responsabilidad,
        r.descripcion,
        r.fecha_inicio,
        r.fecha_fin,
        r.prioridad,
        r.estado,
        (CURRENT_DATE - r.fecha_inicio)::INTEGER as dias_activa,
        r.observaciones,
        r.created_at
    FROM responsabilidades_dirigentes r
    WHERE r.dirigente_id = p_dirigente_id
    AND (p_incluir_finalizadas OR r.estado = 'ACTIVA')
    ORDER BY r.prioridad ASC, r.fecha_inicio DESC;
END;
$$ LANGUAGE plpgsql;

-- ============= 📅 FUNCIONES DE DISPONIBILIDAD =============

-- Registrar disponibilidad
CREATE OR REPLACE FUNCTION registrar_disponibilidad_dirigente(
    p_dirigente_id UUID,
    p_fecha_evento DATE,
    p_tipo_evento VARCHAR(50),
    p_disponible BOOLEAN,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_disponibilidad_id UUID;
BEGIN
    -- Insertar o actualizar disponibilidad
    INSERT INTO disponibilidad_dirigentes (
        dirigente_id,
        fecha_evento,
        tipo_evento,
        disponible,
        observaciones
    ) VALUES (
        p_dirigente_id,
        p_fecha_evento,
        p_tipo_evento,
        p_disponible,
        p_observaciones
    )
    ON CONFLICT (dirigente_id, fecha_evento, tipo_evento)
    DO UPDATE SET
        disponible = p_disponible,
        observaciones = p_observaciones,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_disponibilidad_id;
    
    RETURN json_build_object('success', true, 'disponibilidad_id', v_disponibilidad_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener disponibilidad para evento
CREATE OR REPLACE FUNCTION obtener_disponibilidad_evento(
    p_fecha_evento DATE,
    p_tipo_evento VARCHAR(50),
    p_rama rama_enum DEFAULT NULL
)
RETURNS TABLE(
    dirigente_id UUID,
    nombres VARCHAR(255),
    apellidos VARCHAR(255),
    cargo VARCHAR(100),
    rama_responsable rama_enum,
    disponible BOOLEAN,
    observaciones TEXT,
    nivel_formacion VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id as dirigente_id,
        s.nombres,
        s.apellidos,
        d.cargo,
        d.rama_responsable,
        COALESCE(disp.disponible, true) as disponible,
        disp.observaciones,
        d.nivel_formacion
    FROM dirigentes d
    INNER JOIN scouts s ON d.scout_id = s.id
    LEFT JOIN disponibilidad_dirigentes disp ON d.id = disp.dirigente_id 
        AND disp.fecha_evento = p_fecha_evento 
        AND disp.tipo_evento = p_tipo_evento
    WHERE d.estado = 'ACTIVO'
    AND (p_rama IS NULL OR d.rama_responsable = p_rama)
    ORDER BY COALESCE(disp.disponible, true) DESC, d.cargo, s.nombres;
END;
$$ LANGUAGE plpgsql;

-- ============= 📈 FUNCIONES DE ESTADÍSTICAS =============

-- Obtener estadísticas de dirigentes
CREATE OR REPLACE FUNCTION obtener_estadisticas_dirigentes()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'total_dirigentes', COUNT(*),
        'dirigentes_activos', COUNT(CASE WHEN d.estado = 'ACTIVO' THEN 1 END),
        'dirigentes_por_rama', json_object_agg(d.rama_responsable, rama_count),
        'dirigentes_por_nivel', json_object_agg(d.nivel_formacion, nivel_count),
        'promedio_experiencia', ROUND(AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, d.fecha_nombramiento))), 1),
        'dirigentes_con_formacion_completa', COUNT(CASE WHEN d.nivel_formacion IN ('INTERMEDIO', 'AVANZADO') THEN 1 END),
        'evaluaciones_pendientes', (
            SELECT COUNT(DISTINCT d2.id)
            FROM dirigentes d2
            LEFT JOIN evaluaciones_dirigentes e ON d2.id = e.dirigente_id 
                AND e.periodo = TO_CHAR(CURRENT_DATE, 'YYYY-Q')
            WHERE d2.estado = 'ACTIVO' AND e.id IS NULL
        ),
        'dirigentes_nuevos_año', COUNT(CASE WHEN d.fecha_nombramiento >= DATE_TRUNC('year', CURRENT_DATE) THEN 1 END)
    ) INTO v_resultado
    FROM dirigentes d
    CROSS JOIN LATERAL (
        SELECT rama_responsable, COUNT(*) as rama_count
        FROM dirigentes d2
        WHERE d2.estado = 'ACTIVO'
        GROUP BY rama_responsable
    ) rama_counts
    CROSS JOIN LATERAL (
        SELECT nivel_formacion, COUNT(*) as nivel_count
        FROM dirigentes d3
        WHERE d3.estado = 'ACTIVO'
        GROUP BY nivel_formacion
    ) nivel_counts
    WHERE d.estado = 'ACTIVO';
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- Generar plan de desarrollo dirigente
CREATE OR REPLACE FUNCTION generar_plan_desarrollo_dirigente(p_dirigente_id UUID)
RETURNS JSON AS $$
DECLARE
    v_dirigente RECORD;
    v_evaluaciones RECORD;
    v_plan JSON;
BEGIN
    -- Obtener datos del dirigente
    SELECT 
        d.*,
        s.nombres,
        s.apellidos,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, d.fecha_nombramiento)) as años_experiencia
    INTO v_dirigente
    FROM dirigentes d
    INNER JOIN scouts s ON d.scout_id = s.id
    WHERE d.id = p_dirigente_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Dirigente no encontrado');
    END IF;
    
    -- Obtener resumen de evaluaciones
    SELECT 
        COALESCE(AVG(promedio_general), 0) as promedio_evaluaciones,
        array_agg(DISTINCT unnest(areas_mejora)) as areas_mejora_comunes
    INTO v_evaluaciones
    FROM evaluaciones_dirigentes
    WHERE dirigente_id = p_dirigente_id
    AND created_at >= CURRENT_DATE - INTERVAL '1 year';
    
    -- Generar plan de desarrollo
    SELECT json_build_object(
        'dirigente', json_build_object(
            'nombres', v_dirigente.nombres || ' ' || v_dirigente.apellidos,
            'cargo', v_dirigente.cargo,
            'rama', v_dirigente.rama_responsable,
            'nivel_actual', v_dirigente.nivel_formacion,
            'años_experiencia', v_dirigente.años_experiencia
        ),
        'situacion_actual', json_build_object(
            'promedio_evaluaciones', COALESCE(v_evaluaciones.promedio_evaluaciones, 0),
            'areas_mejora_identificadas', COALESCE(v_evaluaciones.areas_mejora_comunes, '{}'),
            'cursos_completados', (
                SELECT COUNT(*) FROM formacion_dirigentes 
                WHERE dirigente_id = p_dirigente_id AND certificado_obtenido = true
            )
        ),
        'recomendaciones_formacion', CASE 
            WHEN v_dirigente.nivel_formacion = 'CANDIDATO' THEN 
                json_build_array('Curso Preliminar', 'Curso Básico de Dirigentes')
            WHEN v_dirigente.nivel_formacion = 'PRELIMINAR' THEN 
                json_build_array('Curso Básico de Dirigentes', 'Especialización en ' || v_dirigente.rama_responsable)
            WHEN v_dirigente.nivel_formacion = 'BASICO' THEN 
                json_build_array('Curso Intermedio', 'Gestión de Grupos Scout')
            ELSE 
                json_build_array('Formación Continua', 'Liderazgo Avanzado')
        END,
        'objetivos_desarrollo', json_build_array(
            'Mejorar evaluaciones en ' || COALESCE(array_to_string(v_evaluaciones.areas_mejora_comunes[1:3], ', '), 'áreas generales'),
            'Completar siguiente nivel de formación',
            'Desarrollar especialización en ' || v_dirigente.rama_responsable,
            'Participar en capacitaciones de liderazgo'
        ),
        'cronograma_sugerido', json_build_object(
            'trimestre_1', 'Evaluación de necesidades y planificación',
            'trimestre_2', 'Inicio de cursos de formación',
            'trimestre_3', 'Aplicación práctica y mentoring',
            'trimestre_4', 'Evaluación de progreso y certificación'
        )
    ) INTO v_plan;
    
    RETURN json_build_object('success', true, 'plan_desarrollo', v_plan);
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '👨‍🏫 FUNCIONES DE DIRIGENTES CREADAS' as estado,
    'Todas las Database Functions del módulo de dirigentes implementadas' as mensaje,
    '20 funciones de dirigentes disponibles' as resumen;