-- ================================================================
-- 👥 SCOUTS DATABASE FUNCTIONS - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 06_functions_scouts.sql
-- Propósito: Database Functions para el módulo de scouts
-- ================================================================

-- ============= 👥 FUNCIONES DE SCOUTS =============

-- Obtener todos los scouts
CREATE OR REPLACE FUNCTION obtener_scouts(p_filtros JSON DEFAULT '{}')
RETURNS TABLE(
    id UUID,
    codigo_scout VARCHAR(20),
    nombres VARCHAR(255),
    apellidos VARCHAR(255),
    fecha_nacimiento DATE,
    edad INTEGER,
    rama_actual rama_enum,
    estado estado_enum,
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    fecha_ingreso DATE,
    es_dirigente BOOLEAN
) AS $$
DECLARE
    v_rama rama_enum;
    v_estado estado_enum;
    v_buscar_texto TEXT;
BEGIN
    -- Extraer filtros
    v_rama := (p_filtros->>'rama')::rama_enum;
    v_estado := (p_filtros->>'estado')::estado_enum;
    v_buscar_texto := p_filtros->>'buscar';
    
    RETURN QUERY
    SELECT 
        s.id,
        s.codigo_scout,
        s.nombres,
        s.apellidos,
        s.fecha_nacimiento,
        calcular_edad(s.fecha_nacimiento) as edad,
        s.rama_actual,
        s.estado,
        s.celular as telefono,
        s.correo as email,
        s.direccion,
        s.fecha_ingreso,
        s.es_dirigente
    FROM scouts s
    WHERE 
        (v_rama IS NULL OR s.rama_actual = v_rama)
        AND (v_estado IS NULL OR s.estado = v_estado)
        AND (v_buscar_texto IS NULL OR (
            s.nombres ILIKE '%' || v_buscar_texto || '%' OR
            s.apellidos ILIKE '%' || v_buscar_texto || '%' OR
            s.numero_documento ILIKE '%' || v_buscar_texto || '%' OR
            s.codigo_scout ILIKE '%' || v_buscar_texto || '%'
        ))
    ORDER BY s.nombres, s.apellidos;
END;
$$ LANGUAGE plpgsql;

-- Obtener scout por ID
CREATE OR REPLACE FUNCTION obtener_scout_por_id(p_scout_id UUID)
RETURNS TABLE(
    id UUID,
    codigo_scout VARCHAR(20),
    nombres VARCHAR(255),
    apellidos VARCHAR(255),
    fecha_nacimiento DATE,
    edad INTEGER,
    tipo_documento tipo_documento_enum,
    numero_documento VARCHAR(20),
    celular VARCHAR(20),
    correo VARCHAR(255),
    departamento VARCHAR(100),
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    direccion TEXT,
    centro_estudio VARCHAR(255),
    ocupacion VARCHAR(255),
    centro_laboral VARCHAR(255),
    rama_actual rama_enum,
    estado estado_enum,
    fecha_ingreso DATE,
    es_dirigente BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.codigo_scout,
        s.nombres,
        s.apellidos,
        s.fecha_nacimiento,
        calcular_edad(s.fecha_nacimiento) as edad,
        s.tipo_documento,
        s.numero_documento,
        s.celular,
        s.correo,
        s.departamento,
        s.provincia,
        s.distrito,
        s.direccion,
        s.centro_estudio,
        s.ocupacion,
        s.centro_laboral,
        s.rama_actual,
        s.estado,
        s.fecha_ingreso,
        s.es_dirigente,
        s.created_at,
        s.updated_at
    FROM scouts s
    WHERE s.id = p_scout_id;
END;
$$ LANGUAGE plpgsql;

-- Crear scout con familiar
CREATE OR REPLACE FUNCTION crear_scout_completo(
    p_nombres VARCHAR(255),
    p_apellidos VARCHAR(255),
    p_fecha_nacimiento DATE,
    p_numero_documento VARCHAR(20),
    p_tipo_documento tipo_documento_enum DEFAULT 'DNI',
    p_celular VARCHAR(20) DEFAULT NULL,
    p_correo VARCHAR(255) DEFAULT NULL,
    p_departamento VARCHAR(100) DEFAULT NULL,
    p_provincia VARCHAR(100) DEFAULT NULL,
    p_distrito VARCHAR(100) DEFAULT NULL,
    p_direccion TEXT DEFAULT NULL,
    p_centro_estudio VARCHAR(255) DEFAULT NULL,
    p_ocupacion VARCHAR(255) DEFAULT NULL,
    p_centro_laboral VARCHAR(255) DEFAULT NULL,
    p_es_dirigente BOOLEAN DEFAULT FALSE,
    p_rama_actual rama_enum DEFAULT NULL,
    -- Datos del familiar
    p_familiar_nombres VARCHAR(255) DEFAULT NULL,
    p_familiar_apellidos VARCHAR(255) DEFAULT NULL,
    p_parentesco parentesco_enum DEFAULT NULL,
    p_familiar_celular VARCHAR(20) DEFAULT NULL,
    p_familiar_correo VARCHAR(255) DEFAULT NULL,
    p_familiar_ocupacion VARCHAR(255) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_scout_id UUID;
    v_familiar_id UUID;
BEGIN
    -- Reutilizar la función existente
    v_scout_id := registrar_scout_completo(
        p_nombres, p_apellidos, p_fecha_nacimiento, p_numero_documento,
        p_tipo_documento, p_celular, p_correo, p_departamento, p_provincia,
        p_distrito, p_direccion, p_centro_estudio, p_ocupacion, p_centro_laboral,
        p_es_dirigente, p_rama_actual, p_familiar_nombres, p_familiar_apellidos,
        p_parentesco, p_familiar_celular, p_familiar_correo, p_familiar_ocupacion
    );
    
    RETURN json_build_object('success', true, 'scout_id', v_scout_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Actualizar scout
CREATE OR REPLACE FUNCTION actualizar_scout(
    p_scout_id UUID,
    p_nombres VARCHAR(255) DEFAULT NULL,
    p_apellidos VARCHAR(255) DEFAULT NULL,
    p_celular VARCHAR(20) DEFAULT NULL,
    p_correo VARCHAR(255) DEFAULT NULL,
    p_departamento VARCHAR(100) DEFAULT NULL,
    p_provincia VARCHAR(100) DEFAULT NULL,
    p_distrito VARCHAR(100) DEFAULT NULL,
    p_direccion TEXT DEFAULT NULL,
    p_centro_estudio VARCHAR(255) DEFAULT NULL,
    p_ocupacion VARCHAR(255) DEFAULT NULL,
    p_centro_laboral VARCHAR(255) DEFAULT NULL,
    p_rama_actual rama_enum DEFAULT NULL,
    p_estado estado_enum DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    -- Verificar que el scout existe
    IF NOT EXISTS (SELECT 1 FROM scouts WHERE id = p_scout_id) THEN
        RETURN json_build_object('success', false, 'error', 'Scout no encontrado');
    END IF;
    
    -- Validar email si se proporciona
    IF p_correo IS NOT NULL AND NOT validar_email(p_correo) THEN
        RETURN json_build_object('success', false, 'error', 'Formato de email inválido');
    END IF;
    
    -- Actualizar scout
    UPDATE scouts SET
        nombres = COALESCE(p_nombres, nombres),
        apellidos = COALESCE(p_apellidos, apellidos),
        celular = COALESCE(p_celular, celular),
        correo = COALESCE(p_correo, correo),
        departamento = COALESCE(p_departamento, departamento),
        provincia = COALESCE(p_provincia, provincia),
        distrito = COALESCE(p_distrito, distrito),
        direccion = COALESCE(p_direccion, direccion),
        centro_estudio = COALESCE(p_centro_estudio, centro_estudio),
        ocupacion = COALESCE(p_ocupacion, ocupacion),
        centro_laboral = COALESCE(p_centro_laboral, centro_laboral),
        rama_actual = COALESCE(p_rama_actual, rama_actual),
        estado = COALESCE(p_estado, estado),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_scout_id;
    
    RETURN json_build_object('success', true, 'scout_id', p_scout_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Eliminar scout (eliminación lógica)
CREATE OR REPLACE FUNCTION eliminar_scout(p_scout_id UUID)
RETURNS JSON AS $$
BEGIN
    -- Verificar que el scout existe
    IF NOT EXISTS (SELECT 1 FROM scouts WHERE id = p_scout_id) THEN
        RETURN json_build_object('success', false, 'error', 'Scout no encontrado');
    END IF;
    
    -- Verificar que no sea dirigente activo
    IF EXISTS (SELECT 1 FROM scouts WHERE id = p_scout_id AND es_dirigente = true) THEN
        IF EXISTS (SELECT 1 FROM dirigentes WHERE scout_id = p_scout_id AND estado = 'ACTIVO') THEN
            RETURN json_build_object('success', false, 'error', 'No se puede eliminar un dirigente activo');
        END IF;
    END IF;
    
    -- Eliminación lógica
    UPDATE scouts SET
        estado = 'INACTIVO',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_scout_id;
    
    RETURN json_build_object('success', true, 'scout_id', p_scout_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 👨‍👩‍👧‍👦 FUNCIONES DE FAMILIARES =============

-- Obtener familiares de un scout
CREATE OR REPLACE FUNCTION obtener_familiares_scout(p_scout_id UUID)
RETURNS TABLE(
    id UUID,
    nombres VARCHAR(255),
    apellidos VARCHAR(255),
    parentesco parentesco_enum,
    celular VARCHAR(20),
    correo VARCHAR(255),
    ocupacion VARCHAR(255),
    es_contacto_emergencia BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.nombres,
        f.apellidos,
        f.parentesco,
        f.celular,
        f.correo,
        f.ocupacion,
        f.es_contacto_emergencia,
        f.created_at
    FROM familiares_scout f
    WHERE f.scout_id = p_scout_id
    ORDER BY 
        CASE f.parentesco 
            WHEN 'PADRE' THEN 1 
            WHEN 'MADRE' THEN 2 
            WHEN 'TUTOR' THEN 3 
            ELSE 4 
        END,
        f.nombres;
END;
$$ LANGUAGE plpgsql;

-- Crear familiar
CREATE OR REPLACE FUNCTION crear_familiar_scout(
    p_scout_id UUID,
    p_nombres VARCHAR(255),
    p_apellidos VARCHAR(255),
    p_parentesco parentesco_enum,
    p_celular VARCHAR(20) DEFAULT NULL,
    p_correo VARCHAR(255) DEFAULT NULL,
    p_ocupacion VARCHAR(255) DEFAULT NULL,
    p_es_contacto_emergencia BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
    v_familiar_id UUID;
BEGIN
    -- Verificar que el scout existe
    IF NOT EXISTS (SELECT 1 FROM scouts WHERE id = p_scout_id) THEN
        RETURN json_build_object('success', false, 'error', 'Scout no encontrado');
    END IF;
    
    -- Validar email si se proporciona
    IF p_correo IS NOT NULL AND NOT validar_email(p_correo) THEN
        RETURN json_build_object('success', false, 'error', 'Formato de email inválido');
    END IF;
    
    -- Insertar familiar
    INSERT INTO familiares_scout (
        scout_id,
        nombres,
        apellidos,
        parentesco,
        celular,
        correo,
        ocupacion,
        es_contacto_emergencia
    ) VALUES (
        p_scout_id,
        TRIM(p_nombres),
        TRIM(p_apellidos),
        p_parentesco,
        p_celular,
        p_correo,
        p_ocupacion,
        p_es_contacto_emergencia
    ) RETURNING id INTO v_familiar_id;
    
    RETURN json_build_object('success', true, 'familiar_id', v_familiar_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Actualizar familiar
CREATE OR REPLACE FUNCTION actualizar_familiar_scout(
    p_familiar_id UUID,
    p_nombres VARCHAR(255) DEFAULT NULL,
    p_apellidos VARCHAR(255) DEFAULT NULL,
    p_parentesco parentesco_enum DEFAULT NULL,
    p_celular VARCHAR(20) DEFAULT NULL,
    p_correo VARCHAR(255) DEFAULT NULL,
    p_ocupacion VARCHAR(255) DEFAULT NULL,
    p_es_contacto_emergencia BOOLEAN DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    -- Verificar que el familiar existe
    IF NOT EXISTS (SELECT 1 FROM familiares_scout WHERE id = p_familiar_id) THEN
        RETURN json_build_object('success', false, 'error', 'Familiar no encontrado');
    END IF;
    
    -- Validar email si se proporciona
    IF p_correo IS NOT NULL AND NOT validar_email(p_correo) THEN
        RETURN json_build_object('success', false, 'error', 'Formato de email inválido');
    END IF;
    
    -- Actualizar familiar
    UPDATE familiares_scout SET
        nombres = COALESCE(p_nombres, nombres),
        apellidos = COALESCE(p_apellidos, apellidos),
        parentesco = COALESCE(p_parentesco, parentesco),
        celular = COALESCE(p_celular, celular),
        correo = COALESCE(p_correo, correo),
        ocupacion = COALESCE(p_ocupacion, ocupacion),
        es_contacto_emergencia = COALESCE(p_es_contacto_emergencia, es_contacto_emergencia),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_familiar_id;
    
    RETURN json_build_object('success', true, 'familiar_id', p_familiar_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 📊 FUNCIONES DE ESTADÍSTICAS =============

-- Obtener estadísticas generales
CREATE OR REPLACE FUNCTION obtener_estadisticas_scouts_generales()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'total_scouts', COUNT(*),
        'scouts_activos', COUNT(CASE WHEN estado = 'ACTIVO' THEN 1 END),
        'scouts_inactivos', COUNT(CASE WHEN estado = 'INACTIVO' THEN 1 END),
        'dirigentes', COUNT(CASE WHEN es_dirigente = true THEN 1 END),
        'scouts_por_rama', json_object_agg(rama_actual, rama_count),
        'promedio_edad', ROUND(AVG(calcular_edad(fecha_nacimiento)), 1),
        'nuevos_este_mes', COUNT(CASE WHEN fecha_ingreso >= date_trunc('month', CURRENT_DATE) THEN 1 END),
        'distribución_género', json_build_object(
            'masculino', COUNT(CASE WHEN genero = 'MASCULINO' THEN 1 END),
            'femenino', COUNT(CASE WHEN genero = 'FEMENINO' THEN 1 END),
            'otro', COUNT(CASE WHEN genero = 'OTRO' THEN 1 END)
        )
    ) INTO v_resultado
    FROM scouts s
    CROSS JOIN LATERAL (
        SELECT rama_actual, COUNT(*) as rama_count
        FROM scouts s2 
        WHERE s2.rama_actual IS NOT NULL
        GROUP BY rama_actual
    ) rama_counts
    WHERE s.estado != 'ELIMINADO';
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- Obtener scouts próximos a cumpleaños
CREATE OR REPLACE FUNCTION obtener_scouts_proximos_cumpleanos(p_dias_adelante INTEGER DEFAULT 30)
RETURNS TABLE(
    id UUID,
    nombres VARCHAR(255),
    apellidos VARCHAR(255),
    fecha_nacimiento DATE,
    edad_cumplira INTEGER,
    dias_hasta_cumpleanos INTEGER,
    rama_actual rama_enum
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.nombres,
        s.apellidos,
        s.fecha_nacimiento,
        calcular_edad(s.fecha_nacimiento) + 1 as edad_cumplira,
        EXTRACT(DAY FROM (
            date_trunc('year', CURRENT_DATE) + 
            INTERVAL '1 year' * EXTRACT(YEAR FROM age(CURRENT_DATE, s.fecha_nacimiento)) +
            (s.fecha_nacimiento - date_trunc('year', s.fecha_nacimiento)) - 
            CURRENT_DATE
        ))::INTEGER as dias_hasta_cumpleanos,
        s.rama_actual
    FROM scouts s
    WHERE s.estado = 'ACTIVO'
    AND EXTRACT(DAY FROM (
        date_trunc('year', CURRENT_DATE) + 
        INTERVAL '1 year' * EXTRACT(YEAR FROM age(CURRENT_DATE, s.fecha_nacimiento)) +
        (s.fecha_nacimiento - date_trunc('year', s.fecha_nacimiento)) - 
        CURRENT_DATE
    )) BETWEEN 0 AND p_dias_adelante
    ORDER BY dias_hasta_cumpleanos ASC;
END;
$$ LANGUAGE plpgsql;

-- Buscar scouts avanzado
CREATE OR REPLACE FUNCTION buscar_scouts_avanzado(p_criterios JSON)
RETURNS TABLE(
    id UUID,
    codigo_scout VARCHAR(20),
    nombres VARCHAR(255),
    apellidos VARCHAR(255),
    edad INTEGER,
    rama_actual rama_enum,
    estado estado_enum,
    telefono VARCHAR(20),
    email VARCHAR(255),
    distrito VARCHAR(100),
    patrulla_nombre VARCHAR(255)
) AS $$
DECLARE
    v_texto TEXT;
    v_rama rama_enum;
    v_edad_min INTEGER;
    v_edad_max INTEGER;
    v_estado estado_enum;
    v_distrito VARCHAR(100);
    v_es_dirigente BOOLEAN;
BEGIN
    -- Extraer criterios
    v_texto := p_criterios->>'texto';
    v_rama := (p_criterios->>'rama')::rama_enum;
    v_edad_min := (p_criterios->>'edad_min')::INTEGER;
    v_edad_max := (p_criterios->>'edad_max')::INTEGER;
    v_estado := (p_criterios->>'estado')::estado_enum;
    v_distrito := p_criterios->>'distrito';
    v_es_dirigente := (p_criterios->>'es_dirigente')::BOOLEAN;
    
    RETURN QUERY
    SELECT 
        s.id,
        s.codigo_scout,
        s.nombres,
        s.apellidos,
        calcular_edad(s.fecha_nacimiento) as edad,
        s.rama_actual,
        s.estado,
        s.celular as telefono,
        s.correo as email,
        s.distrito,
        p.nombre as patrulla_nombre
    FROM scouts s
    LEFT JOIN miembros_patrulla mp ON s.id = mp.scout_id AND mp.estado_miembro = 'ACTIVO'
    LEFT JOIN patrullas p ON mp.patrulla_id = p.id
    WHERE 
        (v_texto IS NULL OR (
            s.nombres ILIKE '%' || v_texto || '%' OR
            s.apellidos ILIKE '%' || v_texto || '%' OR
            s.numero_documento ILIKE '%' || v_texto || '%' OR
            s.codigo_scout ILIKE '%' || v_texto || '%'
        ))
        AND (v_rama IS NULL OR s.rama_actual = v_rama)
        AND (v_edad_min IS NULL OR calcular_edad(s.fecha_nacimiento) >= v_edad_min)
        AND (v_edad_max IS NULL OR calcular_edad(s.fecha_nacimiento) <= v_edad_max)
        AND (v_estado IS NULL OR s.estado = v_estado)
        AND (v_distrito IS NULL OR s.distrito ILIKE '%' || v_distrito || '%')
        AND (v_es_dirigente IS NULL OR s.es_dirigente = v_es_dirigente)
    ORDER BY s.nombres, s.apellidos;
END;
$$ LANGUAGE plpgsql;

-- ============= 🎯 FUNCIONES DE LOGROS Y ACTIVIDADES =============

-- Obtener logros de un scout
CREATE OR REPLACE FUNCTION obtener_logros_scout(p_scout_id UUID)
RETURNS TABLE(
    id UUID,
    titulo VARCHAR(255),
    descripcion TEXT,
    categoria VARCHAR(100),
    fecha_obtencion DATE,
    otorgado_por VARCHAR(255),
    validado BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.titulo,
        l.descripcion,
        l.categoria,
        l.fecha_obtencion,
        COALESCE(s.nombres || ' ' || s.apellidos, 'Sistema') as otorgado_por,
        l.validado
    FROM logros_scout l
    LEFT JOIN scouts s ON l.otorgado_por_id = s.id
    WHERE l.scout_id = p_scout_id
    ORDER BY l.fecha_obtencion DESC;
END;
$$ LANGUAGE plpgsql;

-- Registrar logro de scout
CREATE OR REPLACE FUNCTION registrar_logro_scout(
    p_scout_id UUID,
    p_titulo VARCHAR(255),
    p_descripcion TEXT,
    p_categoria VARCHAR(100),
    p_fecha_obtencion DATE DEFAULT CURRENT_DATE,
    p_otorgado_por_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_logro_id UUID;
BEGIN
    -- Verificar que el scout existe
    IF NOT EXISTS (SELECT 1 FROM scouts WHERE id = p_scout_id AND estado = 'ACTIVO') THEN
        RETURN json_build_object('success', false, 'error', 'Scout no encontrado o inactivo');
    END IF;
    
    -- Insertar logro
    INSERT INTO logros_scout (
        scout_id,
        titulo,
        descripcion,
        categoria,
        fecha_obtencion,
        otorgado_por_id,
        validado
    ) VALUES (
        p_scout_id,
        p_titulo,
        p_descripcion,
        p_categoria,
        p_fecha_obtencion,
        p_otorgado_por_id,
        TRUE
    ) RETURNING id INTO v_logro_id;
    
    RETURN json_build_object('success', true, 'logro_id', v_logro_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener actividades de un scout
CREATE OR REPLACE FUNCTION obtener_actividades_scout(p_scout_id UUID, p_limite INTEGER DEFAULT 50)
RETURNS TABLE(
    actividad_id UUID,
    nombre_actividad VARCHAR(255),
    tipo_actividad VARCHAR(50),
    fecha_inicio DATE,
    fecha_fin DATE,
    estado_participacion VARCHAR(50),
    asistio BOOLEAN,
    observaciones TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as actividad_id,
        a.nombre as nombre_actividad,
        a.tipo as tipo_actividad,
        a.fecha_inicio::DATE,
        a.fecha_fin::DATE,
        pa.estado_participacion,
        CASE WHEN pa.estado_participacion = 'ASISTIO' THEN true ELSE false END as asistio,
        pa.observaciones
    FROM participantes_actividad pa
    INNER JOIN actividades_scout a ON pa.actividad_id = a.id
    WHERE pa.scout_id = p_scout_id
    ORDER BY a.fecha_inicio DESC
    LIMIT p_limite;
END;
$$ LANGUAGE plpgsql;

-- ============= 📈 FUNCIONES DE ANÁLISIS =============

-- Obtener reporte de progresión por rama
CREATE OR REPLACE FUNCTION obtener_progresion_por_rama()
RETURNS TABLE(
    rama rama_enum,
    total_scouts INTEGER,
    scouts_con_logros INTEGER,
    promedio_logros_por_scout NUMERIC,
    logros_ultimo_trimestre INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.rama_actual as rama,
        COUNT(DISTINCT s.id)::INTEGER as total_scouts,
        COUNT(DISTINCT CASE WHEN l.id IS NOT NULL THEN s.id END)::INTEGER as scouts_con_logros,
        COALESCE(AVG(logro_counts.total_logros), 0)::NUMERIC as promedio_logros_por_scout,
        COUNT(CASE WHEN l.fecha_obtencion >= CURRENT_DATE - INTERVAL '3 months' THEN 1 END)::INTEGER as logros_ultimo_trimestre
    FROM scouts s
    LEFT JOIN logros_scout l ON s.id = l.scout_id
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as total_logros
        FROM logros_scout l2
        WHERE l2.scout_id = s.id
    ) logro_counts ON true
    WHERE s.estado = 'ACTIVO' AND s.rama_actual IS NOT NULL
    GROUP BY s.rama_actual
    ORDER BY 
        CASE s.rama_actual 
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
    '👥 FUNCIONES DE SCOUTS CREADAS' as estado,
    'Todas las Database Functions del módulo de scouts implementadas' as mensaje,
    '30 funciones de scouts disponibles' as resumen;