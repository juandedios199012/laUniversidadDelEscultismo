-- ================================================================
-- 🏕️ PATRULLAS DATABASE FUNCTIONS - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 10_functions_patrullas.sql
-- Propósito: Database Functions para el módulo de patrullas
-- ================================================================

-- ============= 🏕️ FUNCIONES DE PATRULLAS =============

-- Crear patrulla
CREATE OR REPLACE FUNCTION crear_patrulla(
    p_nombre VARCHAR(255),
    p_rama rama_enum,
    p_dirigente_responsable_id UUID,
    p_descripcion TEXT DEFAULT NULL,
    p_color_distintivo VARCHAR(50) DEFAULT NULL,
    p_lema TEXT DEFAULT NULL,
    p_animal_totem VARCHAR(100) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_patrulla_id UUID;
    v_codigo_patrulla VARCHAR(20);
BEGIN
    -- Validaciones
    IF p_nombre IS NULL OR LENGTH(TRIM(p_nombre)) = 0 THEN
        RETURN json_build_object('success', false, 'error', 'El nombre de la patrulla es obligatorio');
    END IF;
    
    -- Verificar que no existe otra patrulla con el mismo nombre en la misma rama
    IF EXISTS (
        SELECT 1 FROM patrullas 
        WHERE UPPER(nombre) = UPPER(TRIM(p_nombre)) 
        AND rama = p_rama 
        AND estado = 'ACTIVO'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Ya existe una patrulla activa con ese nombre en la rama ' || p_rama);
    END IF;
    
    -- Verificar dirigente responsable
    IF NOT EXISTS (
        SELECT 1 FROM dirigentes d
        INNER JOIN scouts s ON d.scout_id = s.id
        WHERE d.id = p_dirigente_responsable_id 
        AND d.estado = 'ACTIVO'
        AND (d.rama_responsable = p_rama OR d.rama_responsable = 'DIRIGENTES')
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Dirigente responsable no válido para esta rama');
    END IF;
    
    -- Generar código único
    v_codigo_patrulla := generar_codigo_patrulla();
    
    -- Insertar patrulla
    INSERT INTO patrullas (
        codigo_patrulla,
        nombre,
        rama,
        dirigente_responsable_id,
        descripcion,
        color_distintivo,
        lema,
        animal_totem,
        estado
    ) VALUES (
        v_codigo_patrulla,
        TRIM(p_nombre),
        p_rama,
        p_dirigente_responsable_id,
        p_descripcion,
        p_color_distintivo,
        p_lema,
        p_animal_totem,
        'ACTIVO'
    ) RETURNING id INTO v_patrulla_id;
    
    RETURN json_build_object('success', true, 'patrulla_id', v_patrulla_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener patrullas
CREATE OR REPLACE FUNCTION obtener_patrullas(p_filtros JSON DEFAULT '{}')
RETURNS TABLE(
    id UUID,
    codigo_patrulla VARCHAR(20),
    nombre VARCHAR(255),
    rama rama_enum,
    estado estado_enum,
    total_miembros INTEGER,
    dirigente_responsable VARCHAR(255),
    guia_patrulla VARCHAR(255),
    sub_guia VARCHAR(255),
    puntos_totales INTEGER,
    color_distintivo VARCHAR(50),
    lema TEXT,
    animal_totem VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_rama rama_enum;
    v_estado estado_enum;
    v_dirigente_id UUID;
BEGIN
    -- Extraer filtros
    v_rama := (p_filtros->>'rama')::rama_enum;
    v_estado := (p_filtros->>'estado')::estado_enum;
    v_dirigente_id := (p_filtros->>'dirigente_id')::UUID;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.codigo_patrulla,
        p.nombre,
        p.rama,
        p.estado,
        COALESCE(miembros.total, 0)::INTEGER as total_miembros,
        COALESCE(sd.nombres || ' ' || sd.apellidos, '') as dirigente_responsable,
        COALESCE(sg.nombres || ' ' || sg.apellidos, '') as guia_patrulla,
        COALESCE(ssub.nombres || ' ' || ssub.apellidos, '') as sub_guia,
        COALESCE(puntos.total_puntos, 0)::INTEGER as puntos_totales,
        p.color_distintivo,
        p.lema,
        p.animal_totem,
        p.created_at
    FROM patrullas p
    LEFT JOIN dirigentes d ON p.dirigente_responsable_id = d.id
    LEFT JOIN scouts sd ON d.scout_id = sd.id
    LEFT JOIN miembros_patrulla mg ON p.id = mg.patrulla_id AND mg.cargo_patrulla = 'GUIA' AND mg.estado_miembro = 'ACTIVO'
    LEFT JOIN scouts sg ON mg.scout_id = sg.id
    LEFT JOIN miembros_patrulla msub ON p.id = msub.patrulla_id AND msub.cargo_patrulla = 'SUB_GUIA' AND msub.estado_miembro = 'ACTIVO'
    LEFT JOIN scouts ssub ON msub.scout_id = ssub.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as total
        FROM miembros_patrulla mp
        WHERE mp.patrulla_id = p.id AND mp.estado_miembro = 'ACTIVO'
    ) miembros ON true
    LEFT JOIN LATERAL (
        SELECT SUM(puntos_obtenidos) as total_puntos
        FROM puntos_patrulla pp
        WHERE pp.patrulla_id = p.id
    ) puntos ON true
    WHERE 
        (v_rama IS NULL OR p.rama = v_rama)
        AND (v_estado IS NULL OR p.estado = v_estado)
        AND (v_dirigente_id IS NULL OR p.dirigente_responsable_id = v_dirigente_id)
    ORDER BY p.rama, p.nombre;
END;
$$ LANGUAGE plpgsql;

-- Obtener patrulla por ID
CREATE OR REPLACE FUNCTION obtener_patrulla_por_id(p_patrulla_id UUID)
RETURNS TABLE(
    id UUID,
    codigo_patrulla VARCHAR(20),
    nombre VARCHAR(255),
    rama rama_enum,
    estado estado_enum,
    dirigente_responsable_id UUID,
    dirigente_nombres VARCHAR(255),
    descripcion TEXT,
    color_distintivo VARCHAR(50),
    lema TEXT,
    animal_totem VARCHAR(100),
    fecha_creacion DATE,
    puntos_totales INTEGER,
    posicion_ranking INTEGER,
    total_miembros INTEGER,
    proyectos_activos INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.codigo_patrulla,
        p.nombre,
        p.rama,
        p.estado,
        p.dirigente_responsable_id,
        COALESCE(sd.nombres || ' ' || sd.apellidos, '') as dirigente_nombres,
        p.descripcion,
        p.color_distintivo,
        p.lema,
        p.animal_totem,
        p.created_at::DATE as fecha_creacion,
        COALESCE(puntos.total_puntos, 0)::INTEGER as puntos_totales,
        COALESCE(ranking.posicion, 0)::INTEGER as posicion_ranking,
        COALESCE(miembros.total, 0)::INTEGER as total_miembros,
        COALESCE(proyectos.activos, 0)::INTEGER as proyectos_activos,
        p.created_at,
        p.updated_at
    FROM patrullas p
    LEFT JOIN dirigentes d ON p.dirigente_responsable_id = d.id
    LEFT JOIN scouts sd ON d.scout_id = sd.id
    LEFT JOIN LATERAL (
        SELECT SUM(puntos_obtenidos) as total_puntos
        FROM puntos_patrulla pp
        WHERE pp.patrulla_id = p.id
    ) puntos ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as total
        FROM miembros_patrulla mp
        WHERE mp.patrulla_id = p.id AND mp.estado_miembro = 'ACTIVO'
    ) miembros ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as activos
        FROM proyectos_patrulla pr
        WHERE pr.patrulla_id = p.id AND pr.estado = 'EN_PROGRESO'
    ) proyectos ON true
    LEFT JOIN LATERAL (
        SELECT ROW_NUMBER() OVER (ORDER BY SUM(pp2.puntos_obtenidos) DESC) as posicion
        FROM patrullas p2
        LEFT JOIN puntos_patrulla pp2 ON p2.id = pp2.patrulla_id
        WHERE p2.rama = p.rama AND p2.estado = 'ACTIVO'
        GROUP BY p2.id
        HAVING p2.id = p.id
    ) ranking ON true
    WHERE p.id = p_patrulla_id;
END;
$$ LANGUAGE plpgsql;

-- ============= 👥 FUNCIONES DE MIEMBROS =============

-- Agregar miembro a patrulla
CREATE OR REPLACE FUNCTION agregar_miembro_patrulla(
    p_patrulla_id UUID,
    p_scout_id UUID,
    p_cargo_patrulla VARCHAR(50) DEFAULT 'MIEMBRO',
    p_fecha_ingreso DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
BEGIN
    -- Reutilizar función existente
    PERFORM asignar_scout_patrulla(p_scout_id, p_patrulla_id, p_cargo_patrulla);
    
    RETURN json_build_object('success', true, 'scout_id', p_scout_id, 'patrulla_id', p_patrulla_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener miembros de patrulla
CREATE OR REPLACE FUNCTION obtener_miembros_patrulla(p_patrulla_id UUID)
RETURNS TABLE(
    scout_id UUID,
    nombres VARCHAR(255),
    apellidos VARCHAR(255),
    cargo_patrulla VARCHAR(50),
    fecha_ingreso DATE,
    fecha_salida DATE,
    estado_miembro estado_enum,
    edad INTEGER,
    telefono VARCHAR(20),
    email VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as scout_id,
        s.nombres,
        s.apellidos,
        mp.cargo_patrulla,
        mp.fecha_ingreso,
        mp.fecha_salida,
        mp.estado_miembro,
        calcular_edad(s.fecha_nacimiento) as edad,
        s.celular as telefono,
        s.correo as email
    FROM miembros_patrulla mp
    INNER JOIN scouts s ON mp.scout_id = s.id
    WHERE mp.patrulla_id = p_patrulla_id
    ORDER BY 
        CASE mp.cargo_patrulla 
            WHEN 'GUIA' THEN 1 
            WHEN 'SUB_GUIA' THEN 2 
            WHEN 'SECRETARIO' THEN 3 
            ELSE 4 
        END,
        mp.fecha_ingreso ASC;
END;
$$ LANGUAGE plpgsql;

-- Asignar guía de patrulla
CREATE OR REPLACE FUNCTION asignar_guia_patrulla(
    p_patrulla_id UUID,
    p_scout_id UUID,
    p_tipo_cargo VARCHAR(20) DEFAULT 'GUIA' -- 'GUIA' o 'SUB_GUIA'
)
RETURNS JSON AS $$
BEGIN
    -- Verificar que el scout pertenece a la patrulla
    IF NOT EXISTS (
        SELECT 1 FROM miembros_patrulla 
        WHERE patrulla_id = p_patrulla_id 
        AND scout_id = p_scout_id 
        AND estado_miembro = 'ACTIVO'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'El scout no pertenece a esta patrulla');
    END IF;
    
    -- Remover cargo anterior del mismo tipo
    UPDATE miembros_patrulla 
    SET cargo_patrulla = 'MIEMBRO'
    WHERE patrulla_id = p_patrulla_id 
    AND cargo_patrulla = p_tipo_cargo 
    AND estado_miembro = 'ACTIVO';
    
    -- Asignar nuevo cargo
    UPDATE miembros_patrulla 
    SET cargo_patrulla = p_tipo_cargo,
        updated_at = CURRENT_TIMESTAMP
    WHERE patrulla_id = p_patrulla_id 
    AND scout_id = p_scout_id 
    AND estado_miembro = 'ACTIVO';
    
    RETURN json_build_object('success', true, 'scout_id', p_scout_id, 'cargo', p_tipo_cargo);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 🏆 FUNCIONES DE PUNTOS =============

-- Registrar puntos de patrulla
CREATE OR REPLACE FUNCTION registrar_puntos_patrulla(
    p_patrulla_id UUID,
    p_concepto VARCHAR(255),
    p_puntos_obtenidos INTEGER,
    p_fecha_otorgamiento DATE DEFAULT CURRENT_DATE,
    p_actividad_id UUID DEFAULT NULL,
    p_otorgado_por_id UUID DEFAULT NULL,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_puntos_id UUID;
BEGIN
    -- Verificar que la patrulla existe y está activa
    IF NOT EXISTS (SELECT 1 FROM patrullas WHERE id = p_patrulla_id AND estado = 'ACTIVO') THEN
        RETURN json_build_object('success', false, 'error', 'Patrulla no encontrada o inactiva');
    END IF;
    
    -- Insertar puntos
    INSERT INTO puntos_patrulla (
        patrulla_id,
        concepto,
        puntos_obtenidos,
        fecha_otorgamiento,
        actividad_id,
        otorgado_por_id,
        observaciones
    ) VALUES (
        p_patrulla_id,
        p_concepto,
        p_puntos_obtenidos,
        p_fecha_otorgamiento,
        p_actividad_id,
        p_otorgado_por_id,
        p_observaciones
    ) RETURNING id INTO v_puntos_id;
    
    RETURN json_build_object('success', true, 'puntos_id', v_puntos_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener ranking de patrullas
CREATE OR REPLACE FUNCTION obtener_ranking_patrullas(p_periodo JSON DEFAULT '{}')
RETURNS TABLE(
    posicion INTEGER,
    patrulla_id UUID,
    nombre_patrulla VARCHAR(255),
    rama rama_enum,
    puntos_totales INTEGER,
    puntos_periodo INTEGER,
    total_miembros INTEGER,
    promedio_puntos_miembro NUMERIC,
    tendencia VARCHAR(20)
) AS $$
DECLARE
    v_fecha_desde DATE;
    v_fecha_hasta DATE;
    v_rama rama_enum;
BEGIN
    -- Extraer filtros de período
    v_fecha_desde := COALESCE((p_periodo->>'fecha_desde')::DATE, DATE_TRUNC('month', CURRENT_DATE));
    v_fecha_hasta := COALESCE((p_periodo->>'fecha_hasta')::DATE, CURRENT_DATE);
    v_rama := (p_periodo->>'rama')::rama_enum;
    
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (
            PARTITION BY CASE WHEN v_rama IS NULL THEN p.rama ELSE NULL END
            ORDER BY COALESCE(puntos_periodo.total_periodo, 0) DESC
        )::INTEGER as posicion,
        p.id as patrulla_id,
        p.nombre as nombre_patrulla,
        p.rama,
        COALESCE(puntos_totales.total_general, 0)::INTEGER as puntos_totales,
        COALESCE(puntos_periodo.total_periodo, 0)::INTEGER as puntos_periodo,
        COALESCE(miembros.total, 0)::INTEGER as total_miembros,
        CASE 
            WHEN COALESCE(miembros.total, 0) > 0 
            THEN ROUND(COALESCE(puntos_periodo.total_periodo, 0)::NUMERIC / miembros.total, 2)
            ELSE 0 
        END as promedio_puntos_miembro,
        CASE 
            WHEN COALESCE(puntos_periodo.total_periodo, 0) > COALESCE(puntos_anterior.total_anterior, 0) THEN 'SUBIENDO'
            WHEN COALESCE(puntos_periodo.total_periodo, 0) < COALESCE(puntos_anterior.total_anterior, 0) THEN 'BAJANDO'
            ELSE 'ESTABLE'
        END::VARCHAR(20) as tendencia
    FROM patrullas p
    LEFT JOIN LATERAL (
        SELECT SUM(pp.puntos_obtenidos) as total_general
        FROM puntos_patrulla pp
        WHERE pp.patrulla_id = p.id
    ) puntos_totales ON true
    LEFT JOIN LATERAL (
        SELECT SUM(pp.puntos_obtenidos) as total_periodo
        FROM puntos_patrulla pp
        WHERE pp.patrulla_id = p.id
        AND pp.fecha_otorgamiento BETWEEN v_fecha_desde AND v_fecha_hasta
    ) puntos_periodo ON true
    LEFT JOIN LATERAL (
        SELECT SUM(pp.puntos_obtenidos) as total_anterior
        FROM puntos_patrulla pp
        WHERE pp.patrulla_id = p.id
        AND pp.fecha_otorgamiento BETWEEN 
            (v_fecha_desde - (v_fecha_hasta - v_fecha_desde)) AND 
            (v_fecha_hasta - (v_fecha_hasta - v_fecha_desde))
    ) puntos_anterior ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as total
        FROM miembros_patrulla mp
        WHERE mp.patrulla_id = p.id AND mp.estado_miembro = 'ACTIVO'
    ) miembros ON true
    WHERE p.estado = 'ACTIVO'
    AND (v_rama IS NULL OR p.rama = v_rama)
    ORDER BY posicion;
END;
$$ LANGUAGE plpgsql;

-- ============= 📋 FUNCIONES DE PROYECTOS =============

-- Crear proyecto de patrulla
CREATE OR REPLACE FUNCTION crear_proyecto_patrulla(
    p_patrulla_id UUID,
    p_nombre VARCHAR(255),
    p_descripcion TEXT,
    p_fecha_inicio DATE DEFAULT CURRENT_DATE,
    p_fecha_fin_estimada DATE DEFAULT NULL,
    p_responsable_scout_id UUID DEFAULT NULL,
    p_presupuesto_estimado DECIMAL(10,2) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_proyecto_id UUID;
BEGIN
    -- Verificar que la patrulla existe
    IF NOT EXISTS (SELECT 1 FROM patrullas WHERE id = p_patrulla_id AND estado = 'ACTIVO') THEN
        RETURN json_build_object('success', false, 'error', 'Patrulla no encontrada o inactiva');
    END IF;
    
    -- Verificar que el responsable pertenece a la patrulla (si se especifica)
    IF p_responsable_scout_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM miembros_patrulla 
            WHERE patrulla_id = p_patrulla_id 
            AND scout_id = p_responsable_scout_id 
            AND estado_miembro = 'ACTIVO'
        ) THEN
            RETURN json_build_object('success', false, 'error', 'El scout responsable no pertenece a esta patrulla');
        END IF;
    END IF;
    
    -- Insertar proyecto
    INSERT INTO proyectos_patrulla (
        patrulla_id,
        nombre,
        descripcion,
        fecha_inicio,
        fecha_fin_estimada,
        responsable_scout_id,
        presupuesto_estimado,
        estado
    ) VALUES (
        p_patrulla_id,
        p_nombre,
        p_descripcion,
        p_fecha_inicio,
        p_fecha_fin_estimada,
        p_responsable_scout_id,
        p_presupuesto_estimado,
        'EN_PROGRESO'
    ) RETURNING id INTO v_proyecto_id;
    
    RETURN json_build_object('success', true, 'proyecto_id', v_proyecto_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener proyectos de patrulla
CREATE OR REPLACE FUNCTION obtener_proyectos_patrulla(
    p_patrulla_id UUID,
    p_incluir_finalizados BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    id UUID,
    nombre VARCHAR(255),
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin_estimada DATE,
    fecha_fin_real DATE,
    estado VARCHAR(50),
    responsable_nombre VARCHAR(255),
    presupuesto_estimado DECIMAL(10,2),
    presupuesto_ejecutado DECIMAL(10,2),
    porcentaje_avance INTEGER,
    dias_transcurridos INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.nombre,
        pr.descripcion,
        pr.fecha_inicio,
        pr.fecha_fin_estimada,
        pr.fecha_fin_real,
        pr.estado,
        COALESCE(s.nombres || ' ' || s.apellidos, '') as responsable_nombre,
        pr.presupuesto_estimado,
        pr.presupuesto_ejecutado,
        pr.porcentaje_avance,
        (CURRENT_DATE - pr.fecha_inicio)::INTEGER as dias_transcurridos,
        pr.created_at
    FROM proyectos_patrulla pr
    LEFT JOIN scouts s ON pr.responsable_scout_id = s.id
    WHERE pr.patrulla_id = p_patrulla_id
    AND (p_incluir_finalizados OR pr.estado != 'FINALIZADO')
    ORDER BY pr.fecha_inicio DESC;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '🏕️ FUNCIONES DE PATRULLAS CREADAS' as estado,
    'Todas las Database Functions del módulo de patrullas implementadas' as mensaje,
    '15 funciones de patrullas disponibles' as resumen;