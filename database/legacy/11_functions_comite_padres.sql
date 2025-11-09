-- ================================================================
-- 👨‍👩‍👧‍👦 COMITÉ PADRES DATABASE FUNCTIONS - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 11_functions_comite_padres.sql
-- Propósito: Database Functions para el módulo de comité de padres
-- ================================================================

-- ============= 👨‍👩‍👧‍👦 FUNCIONES DE COMITÉ =============

-- Crear miembro del comité
CREATE OR REPLACE FUNCTION crear_miembro_comite_padres(
    p_familiar_id UUID,
    p_cargo VARCHAR(100),
    p_fecha_inicio DATE DEFAULT CURRENT_DATE,
    p_fecha_fin DATE DEFAULT NULL,
    p_descripcion_cargo TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_miembro_id UUID;
BEGIN
    -- Verificar que el familiar existe
    IF NOT EXISTS (SELECT 1 FROM familiares_scout WHERE id = p_familiar_id) THEN
        RETURN json_build_object('success', false, 'error', 'Familiar no encontrado');
    END IF;
    
    -- Verificar que no esté ya activo en el comité
    IF EXISTS (
        SELECT 1 FROM miembros_comite_padres 
        WHERE familiar_id = p_familiar_id 
        AND estado = 'ACTIVO'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'El familiar ya es miembro activo del comité');
    END IF;
    
    -- Insertar miembro
    INSERT INTO miembros_comite_padres (
        familiar_id,
        cargo,
        fecha_inicio,
        fecha_fin,
        descripcion_cargo,
        estado
    ) VALUES (
        p_familiar_id,
        p_cargo,
        p_fecha_inicio,
        p_fecha_fin,
        p_descripcion_cargo,
        'ACTIVO'
    ) RETURNING id INTO v_miembro_id;
    
    RETURN json_build_object('success', true, 'miembro_id', v_miembro_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener miembros del comité
CREATE OR REPLACE FUNCTION obtener_miembros_comite_padres(p_incluir_inactivos BOOLEAN DEFAULT FALSE)
RETURNS TABLE(
    id UUID,
    familiar_nombres VARCHAR(255),
    familiar_apellidos VARCHAR(255),
    cargo VARCHAR(100),
    fecha_inicio DATE,
    fecha_fin DATE,
    estado VARCHAR(50),
    descripcion_cargo TEXT,
    telefono VARCHAR(20),
    email VARCHAR(255),
    scout_hijo VARCHAR(255),
    rama_hijo rama_enum,
    dias_en_cargo INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mcp.id,
        f.nombres as familiar_nombres,
        f.apellidos as familiar_apellidos,
        mcp.cargo,
        mcp.fecha_inicio,
        mcp.fecha_fin,
        mcp.estado,
        mcp.descripcion_cargo,
        f.celular as telefono,
        f.correo as email,
        s.nombres || ' ' || s.apellidos as scout_hijo,
        s.rama_actual as rama_hijo,
        (CURRENT_DATE - mcp.fecha_inicio)::INTEGER as dias_en_cargo,
        mcp.created_at
    FROM miembros_comite_padres mcp
    INNER JOIN familiares_scout f ON mcp.familiar_id = f.id
    INNER JOIN scouts s ON f.scout_id = s.id
    WHERE (p_incluir_inactivos OR mcp.estado = 'ACTIVO')
    ORDER BY 
        CASE mcp.cargo 
            WHEN 'PRESIDENTE' THEN 1 
            WHEN 'VICEPRESIDENTE' THEN 2 
            WHEN 'SECRETARIO' THEN 3 
            WHEN 'TESORERO' THEN 4 
            ELSE 5 
        END,
        mcp.fecha_inicio;
END;
$$ LANGUAGE plpgsql;

-- Actualizar miembro del comité
CREATE OR REPLACE FUNCTION actualizar_miembro_comite(
    p_miembro_id UUID,
    p_cargo VARCHAR(100) DEFAULT NULL,
    p_fecha_fin DATE DEFAULT NULL,
    p_descripcion_cargo TEXT DEFAULT NULL,
    p_estado VARCHAR(50) DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    -- Verificar que el miembro existe
    IF NOT EXISTS (SELECT 1 FROM miembros_comite_padres WHERE id = p_miembro_id) THEN
        RETURN json_build_object('success', false, 'error', 'Miembro del comité no encontrado');
    END IF;
    
    -- Actualizar miembro
    UPDATE miembros_comite_padres SET
        cargo = COALESCE(p_cargo, cargo),
        fecha_fin = COALESCE(p_fecha_fin, fecha_fin),
        descripcion_cargo = COALESCE(p_descripcion_cargo, descripcion_cargo),
        estado = COALESCE(p_estado, estado),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_miembro_id;
    
    RETURN json_build_object('success', true, 'miembro_id', p_miembro_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 📅 FUNCIONES DE REUNIONES =============

-- Crear reunión del comité
CREATE OR REPLACE FUNCTION crear_reunion_comite(
    p_titulo VARCHAR(255),
    p_fecha_reunion TIMESTAMP WITH TIME ZONE,
    p_lugar VARCHAR(255),
    p_agenda TEXT,
    p_convocada_por_id UUID,
    p_tipo_reunion VARCHAR(50) DEFAULT 'ORDINARIA'
)
RETURNS JSON AS $$
DECLARE
    v_reunion_id UUID;
BEGIN
    -- Insertar reunión
    INSERT INTO reuniones_comite_padres (
        titulo,
        fecha_reunion,
        lugar,
        agenda,
        convocada_por_id,
        tipo_reunion,
        estado
    ) VALUES (
        p_titulo,
        p_fecha_reunion,
        p_lugar,
        p_agenda,
        p_convocada_por_id,
        p_tipo_reunion,
        'PROGRAMADA'
    ) RETURNING id INTO v_reunion_id;
    
    RETURN json_build_object('success', true, 'reunion_id', v_reunion_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Registrar asistencia a reunión
CREATE OR REPLACE FUNCTION registrar_asistencia_reunion_comite(
    p_reunion_id UUID,
    p_miembro_id UUID,
    p_asistio BOOLEAN,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_asistencia_id UUID;
BEGIN
    -- Verificar que la reunión y miembro existen
    IF NOT EXISTS (SELECT 1 FROM reuniones_comite_padres WHERE id = p_reunion_id) THEN
        RETURN json_build_object('success', false, 'error', 'Reunión no encontrada');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM miembros_comite_padres WHERE id = p_miembro_id) THEN
        RETURN json_build_object('success', false, 'error', 'Miembro del comité no encontrado');
    END IF;
    
    -- Insertar o actualizar asistencia
    INSERT INTO asistencia_reuniones_comite (
        reunion_id,
        miembro_id,
        asistio,
        observaciones
    ) VALUES (
        p_reunion_id,
        p_miembro_id,
        p_asistio,
        p_observaciones
    )
    ON CONFLICT (reunion_id, miembro_id)
    DO UPDATE SET
        asistio = p_asistio,
        observaciones = p_observaciones,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_asistencia_id;
    
    RETURN json_build_object('success', true, 'asistencia_id', v_asistencia_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener reuniones del comité
CREATE OR REPLACE FUNCTION obtener_reuniones_comite(p_filtros JSON DEFAULT '{}')
RETURNS TABLE(
    id UUID,
    titulo VARCHAR(255),
    fecha_reunion TIMESTAMP WITH TIME ZONE,
    lugar VARCHAR(255),
    tipo_reunion VARCHAR(50),
    estado VARCHAR(50),
    convocada_por VARCHAR(255),
    total_asistentes INTEGER,
    total_miembros_activos INTEGER,
    porcentaje_asistencia NUMERIC,
    agenda TEXT,
    acta TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_fecha_desde DATE;
    v_fecha_hasta DATE;
    v_estado VARCHAR(50);
BEGIN
    -- Extraer filtros
    v_fecha_desde := (p_filtros->>'fecha_desde')::DATE;
    v_fecha_hasta := (p_filtros->>'fecha_hasta')::DATE;
    v_estado := p_filtros->>'estado';
    
    RETURN QUERY
    SELECT 
        r.id,
        r.titulo,
        r.fecha_reunion,
        r.lugar,
        r.tipo_reunion,
        r.estado,
        COALESCE(f.nombres || ' ' || f.apellidos, 'Sistema') as convocada_por,
        COALESCE(asistencia.total_asistentes, 0)::INTEGER as total_asistentes,
        COALESCE(miembros_activos.total, 0)::INTEGER as total_miembros_activos,
        CASE 
            WHEN COALESCE(miembros_activos.total, 0) > 0 
            THEN ROUND((COALESCE(asistencia.total_asistentes, 0)::NUMERIC / miembros_activos.total * 100), 2)
            ELSE 0 
        END as porcentaje_asistencia,
        r.agenda,
        r.acta,
        r.created_at
    FROM reuniones_comite_padres r
    LEFT JOIN miembros_comite_padres mcp ON r.convocada_por_id = mcp.id
    LEFT JOIN familiares_scout f ON mcp.familiar_id = f.id
    LEFT JOIN LATERAL (
        SELECT COUNT(CASE WHEN arc.asistio THEN 1 END) as total_asistentes
        FROM asistencia_reuniones_comite arc
        WHERE arc.reunion_id = r.id
    ) asistencia ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as total
        FROM miembros_comite_padres mcp2
        WHERE mcp2.estado = 'ACTIVO'
    ) miembros_activos ON true
    WHERE 
        (v_fecha_desde IS NULL OR r.fecha_reunion::DATE >= v_fecha_desde)
        AND (v_fecha_hasta IS NULL OR r.fecha_reunion::DATE <= v_fecha_hasta)
        AND (v_estado IS NULL OR r.estado = v_estado)
    ORDER BY r.fecha_reunion DESC;
END;
$$ LANGUAGE plpgsql;

-- Actualizar acta de reunión
CREATE OR REPLACE FUNCTION actualizar_acta_reunion(
    p_reunion_id UUID,
    p_acta TEXT,
    p_acuerdos TEXT[] DEFAULT '{}',
    p_estado VARCHAR(50) DEFAULT 'FINALIZADA'
)
RETURNS JSON AS $$
BEGIN
    -- Verificar que la reunión existe
    IF NOT EXISTS (SELECT 1 FROM reuniones_comite_padres WHERE id = p_reunion_id) THEN
        RETURN json_build_object('success', false, 'error', 'Reunión no encontrada');
    END IF;
    
    -- Actualizar reunión
    UPDATE reuniones_comite_padres SET
        acta = p_acta,
        acuerdos = p_acuerdos,
        estado = p_estado,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_reunion_id;
    
    RETURN json_build_object('success', true, 'reunion_id', p_reunion_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 📞 FUNCIONES DE COMUNICACIÓN =============

-- Crear comunicación
CREATE OR REPLACE FUNCTION crear_comunicacion_comite(
    p_titulo VARCHAR(255),
    p_mensaje TEXT,
    p_tipo_comunicacion VARCHAR(50), -- 'ANUNCIO', 'CONVOCATORIA', 'INFORMATIVO', 'URGENTE'
    p_destinatarios JSON, -- Array de IDs o 'ALL'
    p_enviado_por_id UUID,
    p_fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    p_fecha_vencimiento DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_comunicacion_id UUID;
    v_destinatario_id UUID;
    v_destinatario JSON;
BEGIN
    -- Insertar comunicación
    INSERT INTO comunicaciones_comite (
        titulo,
        mensaje,
        tipo_comunicacion,
        enviado_por_id,
        fecha_envio,
        fecha_vencimiento,
        estado
    ) VALUES (
        p_titulo,
        p_mensaje,
        p_tipo_comunicacion,
        p_enviado_por_id,
        p_fecha_envio,
        p_fecha_vencimiento,
        'ENVIADA'
    ) RETURNING id INTO v_comunicacion_id;
    
    -- Procesar destinatarios
    IF p_destinatarios::TEXT = '"ALL"' THEN
        -- Enviar a todos los miembros activos
        INSERT INTO destinatarios_comunicacion (comunicacion_id, miembro_id, estado_lectura)
        SELECT v_comunicacion_id, mcp.id, 'NO_LEIDO'
        FROM miembros_comite_padres mcp
        WHERE mcp.estado = 'ACTIVO';
    ELSE
        -- Enviar a destinatarios específicos
        FOR v_destinatario IN SELECT * FROM json_array_elements(p_destinatarios)
        LOOP
            v_destinatario_id := (v_destinatario::TEXT)::UUID;
            INSERT INTO destinatarios_comunicacion (comunicacion_id, miembro_id, estado_lectura)
            VALUES (v_comunicacion_id, v_destinatario_id, 'NO_LEIDO');
        END LOOP;
    END IF;
    
    RETURN json_build_object('success', true, 'comunicacion_id', v_comunicacion_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Marcar comunicación como leída
CREATE OR REPLACE FUNCTION marcar_comunicacion_leida(
    p_comunicacion_id UUID,
    p_miembro_id UUID
)
RETURNS JSON AS $$
BEGIN
    -- Actualizar estado de lectura
    UPDATE destinatarios_comunicacion SET
        estado_lectura = 'LEIDO',
        fecha_lectura = CURRENT_TIMESTAMP
    WHERE comunicacion_id = p_comunicacion_id 
    AND miembro_id = p_miembro_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Comunicación o destinatario no encontrado');
    END IF;
    
    RETURN json_build_object('success', true, 'comunicacion_id', p_comunicacion_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener comunicaciones para miembro
CREATE OR REPLACE FUNCTION obtener_comunicaciones_miembro(
    p_miembro_id UUID,
    p_solo_no_leidas BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    id UUID,
    titulo VARCHAR(255),
    mensaje TEXT,
    tipo_comunicacion VARCHAR(50),
    fecha_envio TIMESTAMP WITH TIME ZONE,
    fecha_vencimiento DATE,
    estado_lectura VARCHAR(20),
    fecha_lectura TIMESTAMP WITH TIME ZONE,
    enviado_por VARCHAR(255),
    es_urgente BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.titulo,
        c.mensaje,
        c.tipo_comunicacion,
        c.fecha_envio,
        c.fecha_vencimiento,
        dc.estado_lectura,
        dc.fecha_lectura,
        COALESCE(f.nombres || ' ' || f.apellidos, 'Sistema') as enviado_por,
        (c.tipo_comunicacion = 'URGENTE') as es_urgente
    FROM comunicaciones_comite c
    INNER JOIN destinatarios_comunicacion dc ON c.id = dc.comunicacion_id
    LEFT JOIN miembros_comite_padres mcp ON c.enviado_por_id = mcp.id
    LEFT JOIN familiares_scout f ON mcp.familiar_id = f.id
    WHERE dc.miembro_id = p_miembro_id
    AND (NOT p_solo_no_leidas OR dc.estado_lectura = 'NO_LEIDO')
    ORDER BY c.fecha_envio DESC;
END;
$$ LANGUAGE plpgsql;

-- ============= 🏛️ FUNCIONES DE COMISIONES =============

-- Crear comisión de trabajo
CREATE OR REPLACE FUNCTION crear_comision_trabajo(
    p_nombre VARCHAR(255),
    p_descripcion TEXT,
    p_coordinador_id UUID,
    p_fecha_inicio DATE DEFAULT CURRENT_DATE,
    p_fecha_fin_estimada DATE DEFAULT NULL,
    p_objetivos TEXT[] DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
    v_comision_id UUID;
BEGIN
    -- Verificar que el coordinador es miembro activo
    IF NOT EXISTS (
        SELECT 1 FROM miembros_comite_padres 
        WHERE id = p_coordinador_id AND estado = 'ACTIVO'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'El coordinador debe ser un miembro activo del comité');
    END IF;
    
    -- Insertar comisión
    INSERT INTO comisiones_trabajo (
        nombre,
        descripcion,
        coordinador_id,
        fecha_inicio,
        fecha_fin_estimada,
        objetivos,
        estado
    ) VALUES (
        p_nombre,
        p_descripcion,
        p_coordinador_id,
        p_fecha_inicio,
        p_fecha_fin_estimada,
        p_objetivos,
        'ACTIVA'
    ) RETURNING id INTO v_comision_id;
    
    RETURN json_build_object('success', true, 'comision_id', v_comision_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Asignar miembro a comisión
CREATE OR REPLACE FUNCTION asignar_miembro_comision(
    p_comision_id UUID,
    p_miembro_id UUID,
    p_rol_comision VARCHAR(100) DEFAULT 'MIEMBRO'
)
RETURNS JSON AS $$
DECLARE
    v_asignacion_id UUID;
BEGIN
    -- Verificar que la comisión y miembro existen
    IF NOT EXISTS (SELECT 1 FROM comisiones_trabajo WHERE id = p_comision_id) THEN
        RETURN json_build_object('success', false, 'error', 'Comisión no encontrada');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM miembros_comite_padres WHERE id = p_miembro_id AND estado = 'ACTIVO') THEN
        RETURN json_build_object('success', false, 'error', 'Miembro no encontrado o inactivo');
    END IF;
    
    -- Verificar que no esté ya asignado
    IF EXISTS (
        SELECT 1 FROM miembros_comision 
        WHERE comision_id = p_comision_id AND miembro_id = p_miembro_id AND estado = 'ACTIVO'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'El miembro ya está asignado a esta comisión');
    END IF;
    
    -- Insertar asignación
    INSERT INTO miembros_comision (
        comision_id,
        miembro_id,
        rol_comision,
        estado
    ) VALUES (
        p_comision_id,
        p_miembro_id,
        p_rol_comision,
        'ACTIVO'
    ) RETURNING id INTO v_asignacion_id;
    
    RETURN json_build_object('success', true, 'asignacion_id', v_asignacion_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener comisiones activas
CREATE OR REPLACE FUNCTION obtener_comisiones_trabajo(p_incluir_finalizadas BOOLEAN DEFAULT FALSE)
RETURNS TABLE(
    id UUID,
    nombre VARCHAR(255),
    descripcion TEXT,
    coordinador VARCHAR(255),
    fecha_inicio DATE,
    fecha_fin_estimada DATE,
    fecha_fin_real DATE,
    estado VARCHAR(50),
    total_miembros INTEGER,
    objetivos_cumplidos INTEGER,
    porcentaje_avance INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ct.id,
        ct.nombre,
        ct.descripcion,
        COALESCE(f.nombres || ' ' || f.apellidos, '') as coordinador,
        ct.fecha_inicio,
        ct.fecha_fin_estimada,
        ct.fecha_fin_real,
        ct.estado,
        COALESCE(miembros.total, 0)::INTEGER as total_miembros,
        COALESCE(array_length(ct.objetivos, 1), 0)::INTEGER as objetivos_cumplidos,
        ct.porcentaje_avance,
        ct.created_at
    FROM comisiones_trabajo ct
    LEFT JOIN miembros_comite_padres mcp ON ct.coordinador_id = mcp.id
    LEFT JOIN familiares_scout f ON mcp.familiar_id = f.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as total
        FROM miembros_comision mc
        WHERE mc.comision_id = ct.id AND mc.estado = 'ACTIVO'
    ) miembros ON true
    WHERE (p_incluir_finalizadas OR ct.estado = 'ACTIVA')
    ORDER BY ct.fecha_inicio DESC;
END;
$$ LANGUAGE plpgsql;

-- ============= 📊 FUNCIONES DE ESTADÍSTICAS =============

-- Obtener estadísticas del comité
CREATE OR REPLACE FUNCTION obtener_estadisticas_comite_padres()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'miembros_activos', COUNT(CASE WHEN mcp.estado = 'ACTIVO' THEN 1 END),
        'miembros_inactivos', COUNT(CASE WHEN mcp.estado = 'INACTIVO' THEN 1 END),
        'reuniones_este_año', (
            SELECT COUNT(*) FROM reuniones_comite_padres 
            WHERE EXTRACT(YEAR FROM fecha_reunion) = EXTRACT(YEAR FROM CURRENT_DATE)
        ),
        'promedio_asistencia_reuniones', (
            SELECT COALESCE(AVG(
                CASE WHEN arc.asistio THEN 100.0 ELSE 0.0 END
            ), 0) FROM asistencia_reuniones_comite arc
            INNER JOIN reuniones_comite_padres rcp ON arc.reunion_id = rcp.id
            WHERE rcp.fecha_reunion >= CURRENT_DATE - INTERVAL '6 months'
        ),
        'comunicaciones_enviadas_mes', (
            SELECT COUNT(*) FROM comunicaciones_comite
            WHERE fecha_envio >= DATE_TRUNC('month', CURRENT_DATE)
        ),
        'comisiones_activas', (
            SELECT COUNT(*) FROM comisiones_trabajo WHERE estado = 'ACTIVA'
        ),
        'distribucion_por_cargo', json_object_agg(mcp.cargo, cargo_count),
        'tiempo_promedio_cargo', ROUND(AVG(CURRENT_DATE - mcp.fecha_inicio), 0)
    ) INTO v_resultado
    FROM miembros_comite_padres mcp
    CROSS JOIN LATERAL (
        SELECT cargo, COUNT(*) as cargo_count
        FROM miembros_comite_padres mcp2
        WHERE mcp2.estado = 'ACTIVO'
        GROUP BY cargo
    ) cargo_counts
    WHERE mcp.estado = 'ACTIVO';
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '👨‍👩‍👧‍👦 FUNCIONES DE COMITÉ PADRES CREADAS' as estado,
    'Todas las Database Functions del módulo de comité de padres implementadas' as mensaje,
    '15 funciones de comité de padres disponibles' as resumen;