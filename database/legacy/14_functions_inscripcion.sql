-- ================================================================
-- 📝 INSCRIPCIÓN DATABASE FUNCTIONS - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 14_functions_inscripcion.sql
-- Propósito: Database Functions para el módulo de inscripción anual
-- ================================================================

-- ============= 📝 FUNCIONES DE INSCRIPCIÓN =============

-- Iniciar inscripción anual
CREATE OR REPLACE FUNCTION iniciar_inscripcion_anual(
    p_año INTEGER,
    p_fecha_inicio DATE,
    p_fecha_limite DATE,
    p_monto_inscripcion DECIMAL(10,2),
    p_monto_mensualidad DECIMAL(10,2),
    p_dirigente_responsable_id UUID,
    p_descuento_hermanos DECIMAL(5,2) DEFAULT 10.00,
    p_requisitos_generales TEXT[] DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
    v_periodo_id UUID;
BEGIN
    -- Validaciones
    IF p_fecha_limite <= p_fecha_inicio THEN
        RETURN json_build_object('success', false, 'error', 'La fecha límite debe ser posterior a la fecha de inicio');
    END IF;
    
    IF p_monto_inscripcion <= 0 OR p_monto_mensualidad <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Los montos deben ser mayores a cero');
    END IF;
    
    -- Verificar que no existe un período activo para el mismo año
    IF EXISTS (
        SELECT 1 FROM periodos_inscripcion 
        WHERE año = p_año AND estado = 'ACTIVO'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Ya existe un período de inscripción activo para este año');
    END IF;
    
    -- Crear período de inscripción
    INSERT INTO periodos_inscripcion (
        año,
        fecha_inicio,
        fecha_limite,
        monto_inscripcion,
        monto_mensualidad,
        descuento_hermanos,
        requisitos_generales,
        dirigente_responsable_id,
        estado
    ) VALUES (
        p_año,
        p_fecha_inicio,
        p_fecha_limite,
        p_monto_inscripcion,
        p_monto_mensualidad,
        p_descuento_hermanos,
        p_requisitos_generales,
        p_dirigente_responsable_id,
        'ACTIVO'
    ) RETURNING id INTO v_periodo_id;
    
    RETURN json_build_object('success', true, 'periodo_id', v_periodo_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener períodos de inscripción
CREATE OR REPLACE FUNCTION obtener_periodos_inscripcion(p_filtros JSON DEFAULT '{}')
RETURNS TABLE(
    id UUID,
    año INTEGER,
    fecha_inicio DATE,
    fecha_limite DATE,
    monto_inscripcion DECIMAL(10,2),
    monto_mensualidad DECIMAL(10,2),
    descuento_hermanos DECIMAL(5,2),
    estado VARCHAR(50),
    dirigente_responsable VARCHAR(255),
    total_inscripciones INTEGER,
    inscripciones_completas INTEGER,
    inscripciones_pendientes INTEGER,
    monto_total_recaudado DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_año INTEGER;
    v_estado VARCHAR(50);
BEGIN
    -- Extraer filtros
    v_año := (p_filtros->>'año')::INTEGER;
    v_estado := p_filtros->>'estado';
    
    RETURN QUERY
    SELECT 
        pi.id,
        pi.año,
        pi.fecha_inicio,
        pi.fecha_limite,
        pi.monto_inscripcion,
        pi.monto_mensualidad,
        pi.descuento_hermanos,
        pi.estado,
        COALESCE(s.nombres || ' ' || s.apellidos, '') as dirigente_responsable,
        COALESCE(estadisticas.total, 0)::INTEGER as total_inscripciones,
        COALESCE(estadisticas.completas, 0)::INTEGER as inscripciones_completas,
        COALESCE(estadisticas.pendientes, 0)::INTEGER as inscripciones_pendientes,
        COALESCE(estadisticas.monto_recaudado, 0)::DECIMAL(10,2) as monto_total_recaudado,
        pi.created_at
    FROM periodos_inscripcion pi
    LEFT JOIN scouts s ON pi.dirigente_responsable_id = s.id
    LEFT JOIN LATERAL (
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN i.estado = 'COMPLETA' THEN 1 END) as completas,
            COUNT(CASE WHEN i.estado IN ('INICIADA', 'DOCUMENTOS_PENDIENTES', 'PAGO_PENDIENTE') THEN 1 END) as pendientes,
            SUM(CASE WHEN i.estado = 'COMPLETA' THEN i.monto_total ELSE 0 END) as monto_recaudado
        FROM inscripciones i
        WHERE i.periodo_id = pi.id
    ) estadisticas ON true
    WHERE 
        (v_año IS NULL OR pi.año = v_año)
        AND (v_estado IS NULL OR pi.estado = v_estado)
    ORDER BY pi.año DESC, pi.fecha_inicio DESC;
END;
$$ LANGUAGE plpgsql;

-- Crear inscripción individual
CREATE OR REPLACE FUNCTION crear_inscripcion(
    p_periodo_id UUID,
    p_scout_id UUID,
    p_tipo_inscripcion VARCHAR(50), -- 'NUEVA', 'RENOVACION', 'REINGRESO'
    p_rama_solicita rama_enum,
    p_datos_contacto_emergencia JSON, -- {nombre, telefono, relacion}
    p_autorizaciones JSON, -- {fotos: boolean, actividades: boolean, transporte: boolean}
    p_observaciones_medicas TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_inscripcion_id UUID;
    v_monto_inscripcion DECIMAL(10,2);
    v_monto_mensualidad DECIMAL(10,2);
    v_descuento_aplicable DECIMAL(5,2) := 0;
    v_monto_total DECIMAL(10,2);
    v_hermanos_inscritos INTEGER;
BEGIN
    -- Verificar que el período está activo
    IF NOT EXISTS (
        SELECT 1 FROM periodos_inscripcion 
        WHERE id = p_periodo_id AND estado = 'ACTIVO'
        AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_limite
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Período de inscripción no válido o fuera de fechas');
    END IF;
    
    -- Verificar que el scout no esté ya inscrito en este período
    IF EXISTS (
        SELECT 1 FROM inscripciones 
        WHERE periodo_id = p_periodo_id AND scout_id = p_scout_id
    ) THEN
        RETURN json_build_object('success', false, 'error', 'El scout ya está inscrito en este período');
    END IF;
    
    -- Obtener información del período
    SELECT monto_inscripcion, monto_mensualidad, descuento_hermanos
    INTO v_monto_inscripcion, v_monto_mensualidad, v_descuento_aplicable
    FROM periodos_inscripcion
    WHERE id = p_periodo_id;
    
    -- Verificar descuento por hermanos
    SELECT COUNT(*)
    INTO v_hermanos_inscritos
    FROM inscripciones i
    INNER JOIN scouts s1 ON i.scout_id = s1.id
    INNER JOIN scouts s2 ON s2.id = p_scout_id
    WHERE i.periodo_id = p_periodo_id 
    AND i.estado = 'COMPLETA'
    AND s1.familia_id = s2.familia_id
    AND s1.familia_id IS NOT NULL;
    
    -- Aplicar descuento si hay hermanos inscritos
    IF v_hermanos_inscritos > 0 THEN
        v_monto_total := v_monto_inscripcion * (1 - v_descuento_aplicable / 100);
    ELSE
        v_monto_total := v_monto_inscripcion;
    END IF;
    
    -- Crear inscripción
    INSERT INTO inscripciones (
        periodo_id,
        scout_id,
        tipo_inscripcion,
        rama_solicita,
        datos_contacto_emergencia,
        autorizaciones,
        observaciones_medicas,
        monto_inscripcion,
        monto_mensualidad,
        descuento_aplicado,
        monto_total,
        estado
    ) VALUES (
        p_periodo_id,
        p_scout_id,
        p_tipo_inscripcion,
        p_rama_solicita,
        p_datos_contacto_emergencia,
        p_autorizaciones,
        p_observaciones_medicas,
        v_monto_inscripcion,
        v_monto_mensualidad,
        CASE WHEN v_hermanos_inscritos > 0 THEN v_descuento_aplicable ELSE 0 END,
        v_monto_total,
        'INICIADA'
    ) RETURNING id INTO v_inscripcion_id;
    
    RETURN json_build_object('success', true, 'inscripcion_id', v_inscripcion_id, 'monto_total', v_monto_total);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener inscripciones
CREATE OR REPLACE FUNCTION obtener_inscripciones(p_filtros JSON DEFAULT '{}')
RETURNS TABLE(
    id UUID,
    periodo_año INTEGER,
    scout_nombre VARCHAR(255),
    scout_documento VARCHAR(20),
    tipo_inscripcion VARCHAR(50),
    rama_solicita rama_enum,
    rama_actual rama_enum,
    estado VARCHAR(50),
    monto_total DECIMAL(10,2),
    descuento_aplicado DECIMAL(5,2),
    fecha_inscripcion DATE,
    fecha_aprobacion DATE,
    documentos_pendientes TEXT[],
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_periodo_id UUID;
    v_estado VARCHAR(50);
    v_rama rama_enum;
    v_año INTEGER;
BEGIN
    -- Extraer filtros
    v_periodo_id := (p_filtros->>'periodo_id')::UUID;
    v_estado := p_filtros->>'estado';
    v_rama := (p_filtros->>'rama')::rama_enum;
    v_año := (p_filtros->>'año')::INTEGER;
    
    RETURN QUERY
    SELECT 
        i.id,
        pi.año as periodo_año,
        s.nombres || ' ' || s.apellidos as scout_nombre,
        s.documento_identidad as scout_documento,
        i.tipo_inscripcion,
        i.rama_solicita,
        s.rama_actual as rama_actual,
        i.estado,
        i.monto_total,
        i.descuento_aplicado,
        i.fecha_inscripcion,
        i.fecha_aprobacion,
        i.documentos_pendientes,
        i.observaciones,
        i.created_at
    FROM inscripciones i
    INNER JOIN scouts s ON i.scout_id = s.id
    INNER JOIN periodos_inscripcion pi ON i.periodo_id = pi.id
    WHERE 
        (v_periodo_id IS NULL OR i.periodo_id = v_periodo_id)
        AND (v_estado IS NULL OR i.estado = v_estado)
        AND (v_rama IS NULL OR i.rama_solicita = v_rama)
        AND (v_año IS NULL OR pi.año = v_año)
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Actualizar estado de inscripción
CREATE OR REPLACE FUNCTION actualizar_estado_inscripcion(
    p_inscripcion_id UUID,
    p_nuevo_estado VARCHAR(50),
    p_documentos_pendientes TEXT[] DEFAULT '{}',
    p_observaciones TEXT DEFAULT NULL,
    p_dirigente_evaluador_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_estado_actual VARCHAR(50);
BEGIN
    -- Obtener estado actual
    SELECT estado INTO v_estado_actual
    FROM inscripciones
    WHERE id = p_inscripcion_id;
    
    IF v_estado_actual IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Inscripción no encontrada');
    END IF;
    
    -- Validar transición de estado
    IF v_estado_actual = 'COMPLETA' AND p_nuevo_estado != 'RECHAZADA' THEN
        RETURN json_build_object('success', false, 'error', 'No se puede cambiar el estado de una inscripción completa');
    END IF;
    
    -- Actualizar inscripción
    UPDATE inscripciones SET
        estado = p_nuevo_estado,
        documentos_pendientes = p_documentos_pendientes,
        observaciones = p_observaciones,
        dirigente_evaluador_id = p_dirigente_evaluador_id,
        fecha_aprobacion = CASE 
            WHEN p_nuevo_estado = 'COMPLETA' THEN CURRENT_DATE 
            ELSE fecha_aprobacion 
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_inscripcion_id;
    
    -- Si se aprueba, actualizar datos del scout
    IF p_nuevo_estado = 'COMPLETA' THEN
        UPDATE scouts SET
            rama_actual = (SELECT rama_solicita FROM inscripciones WHERE id = p_inscripcion_id),
            estado = 'ACTIVO'
        WHERE id = (SELECT scout_id FROM inscripciones WHERE id = p_inscripcion_id);
    END IF;
    
    RETURN json_build_object('success', true, 'inscripcion_id', p_inscripcion_id, 'nuevo_estado', p_nuevo_estado);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 💰 FUNCIONES DE PAGOS =============

-- Registrar pago de inscripción
CREATE OR REPLACE FUNCTION registrar_pago_inscripcion(
    p_inscripcion_id UUID,
    p_monto_pagado DECIMAL(10,2),
    p_metodo_pago VARCHAR(50), -- 'EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO', 'TARJETA'
    p_dirigente_receptor_id UUID,
    p_numero_operacion VARCHAR(100) DEFAULT NULL,
    p_fecha_pago DATE DEFAULT CURRENT_DATE,
    p_observaciones_pago TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_pago_id UUID;
    v_monto_total DECIMAL(10,2);
    v_monto_pagado_anterior DECIMAL(10,2);
    v_nuevo_saldo DECIMAL(10,2);
BEGIN
    -- Obtener información de la inscripción
    SELECT 
        monto_total,
        COALESCE((SELECT SUM(monto_pagado) FROM pagos_inscripcion WHERE inscripcion_id = p_inscripcion_id), 0)
    INTO v_monto_total, v_monto_pagado_anterior
    FROM inscripciones
    WHERE id = p_inscripcion_id;
    
    IF v_monto_total IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Inscripción no encontrada');
    END IF;
    
    -- Validar que el pago no exceda el monto pendiente
    IF (v_monto_pagado_anterior + p_monto_pagado) > v_monto_total THEN
        RETURN json_build_object('success', false, 'error', 'El monto pagado excede el total de la inscripción');
    END IF;
    
    -- Registrar pago
    INSERT INTO pagos_inscripcion (
        inscripcion_id,
        monto_pagado,
        metodo_pago,
        numero_operacion,
        fecha_pago,
        observaciones_pago,
        dirigente_receptor_id
    ) VALUES (
        p_inscripcion_id,
        p_monto_pagado,
        p_metodo_pago,
        p_numero_operacion,
        p_fecha_pago,
        p_observaciones_pago,
        p_dirigente_receptor_id
    ) RETURNING id INTO v_pago_id;
    
    -- Calcular nuevo saldo
    v_nuevo_saldo := v_monto_total - (v_monto_pagado_anterior + p_monto_pagado);
    
    -- Actualizar estado de inscripción si está completamente pagada
    IF v_nuevo_saldo = 0 THEN
        UPDATE inscripciones SET
            estado = CASE 
                WHEN estado = 'PAGO_PENDIENTE' THEN 'COMPLETA'
                WHEN estado = 'INICIADA' AND array_length(documentos_pendientes, 1) IS NULL OR array_length(documentos_pendientes, 1) = 0 THEN 'COMPLETA'
                ELSE estado
            END
        WHERE id = p_inscripcion_id;
    ELSE
        UPDATE inscripciones SET
            estado = CASE 
                WHEN estado = 'INICIADA' THEN 'PAGO_PENDIENTE'
                ELSE estado
            END
        WHERE id = p_inscripcion_id;
    END IF;
    
    RETURN json_build_object(
        'success', true, 
        'pago_id', v_pago_id,
        'saldo_pendiente', v_nuevo_saldo,
        'pagado_completo', v_nuevo_saldo = 0
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener historial de pagos
CREATE OR REPLACE FUNCTION obtener_pagos_inscripcion(p_inscripcion_id UUID)
RETURNS TABLE(
    id UUID,
    monto_pagado DECIMAL(10,2),
    metodo_pago VARCHAR(50),
    numero_operacion VARCHAR(100),
    fecha_pago DATE,
    observaciones_pago TEXT,
    dirigente_receptor VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.id,
        pi.monto_pagado,
        pi.metodo_pago,
        pi.numero_operacion,
        pi.fecha_pago,
        pi.observaciones_pago,
        COALESCE(s.nombres || ' ' || s.apellidos, '') as dirigente_receptor,
        pi.created_at
    FROM pagos_inscripcion pi
    LEFT JOIN scouts s ON pi.dirigente_receptor_id = s.id
    WHERE pi.inscripcion_id = p_inscripcion_id
    ORDER BY pi.fecha_pago DESC, pi.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============= 📊 FUNCIONES DE ESTADÍSTICAS =============

-- Obtener estadísticas de inscripción
CREATE OR REPLACE FUNCTION obtener_estadisticas_inscripcion(p_periodo_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
    v_where_clause TEXT := '';
BEGIN
    -- Construir filtro
    IF p_periodo_id IS NOT NULL THEN
        v_where_clause := 'WHERE i.periodo_id = $1';
    END IF;
    
    EXECUTE format('
        SELECT json_build_object(
            ''resumen_general'', json_build_object(
                ''total_inscripciones'', COUNT(*),
                ''inscripciones_completas'', COUNT(CASE WHEN i.estado = ''COMPLETA'' THEN 1 END),
                ''inscripciones_pendientes'', COUNT(CASE WHEN i.estado IN (''INICIADA'', ''DOCUMENTOS_PENDIENTES'', ''PAGO_PENDIENTE'') THEN 1 END),
                ''inscripciones_rechazadas'', COUNT(CASE WHEN i.estado = ''RECHAZADA'' THEN 1 END),
                ''porcentaje_completado'', 
                    CASE 
                        WHEN COUNT(*) > 0 
                        THEN ROUND((COUNT(CASE WHEN i.estado = ''COMPLETA'' THEN 1 END)::NUMERIC / COUNT(*) * 100), 2)
                        ELSE 0 
                    END
            ),
            ''inscripciones_por_rama'', json_object_agg(i.rama_solicita, rama_count),
            ''inscripciones_por_tipo'', json_object_agg(i.tipo_inscripcion, tipo_count),
            ''resumen_financiero'', json_build_object(
                ''monto_total_esperado'', SUM(i.monto_total),
                ''monto_recaudado'', COALESCE(SUM(pagos.monto_pagado), 0),
                ''monto_pendiente'', SUM(i.monto_total) - COALESCE(SUM(pagos.monto_pagado), 0),
                ''promedio_descuento'', ROUND(AVG(i.descuento_aplicado), 2)
            ),
            ''tendencias_temporales'', (
                SELECT json_agg(tendencia ORDER BY fecha)
                FROM (
                    SELECT 
                        DATE_TRUNC(''week'', i2.created_at) as fecha,
                        COUNT(*) as inscripciones_semana,
                        COUNT(CASE WHEN i2.estado = ''COMPLETA'' THEN 1 END) as completas_semana
                    FROM inscripciones i2
                    %s
                    GROUP BY DATE_TRUNC(''week'', i2.created_at)
                    ORDER BY fecha
                ) tendencia
            )
        )
        FROM inscripciones i
        CROSS JOIN LATERAL (
            SELECT i.rama_solicita, COUNT(*) as rama_count
            FROM inscripciones i2
            %s
            GROUP BY i2.rama_solicita
        ) rama_counts
        CROSS JOIN LATERAL (
            SELECT i.tipo_inscripcion, COUNT(*) as tipo_count
            FROM inscripciones i3
            %s
            GROUP BY i3.tipo_inscripcion
        ) tipo_counts
        LEFT JOIN LATERAL (
            SELECT SUM(pi.monto_pagado) as monto_pagado
            FROM pagos_inscripcion pi
            WHERE pi.inscripcion_id = i.id
        ) pagos ON true
        %s',
        v_where_clause, v_where_clause, v_where_clause, v_where_clause
    ) INTO v_resultado USING p_periodo_id;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- Obtener reporte de inscripciones pendientes
CREATE OR REPLACE FUNCTION obtener_inscripciones_pendientes_reporte()
RETURNS TABLE(
    inscripcion_id UUID,
    scout_nombre VARCHAR(255),
    scout_documento VARCHAR(20),
    rama_solicita rama_enum,
    estado VARCHAR(50),
    dias_pendiente INTEGER,
    documentos_faltantes TEXT[],
    monto_pendiente DECIMAL(10,2),
    contacto_emergencia JSON,
    prioridad VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id as inscripcion_id,
        s.nombres || ' ' || s.apellidos as scout_nombre,
        s.documento_identidad as scout_documento,
        i.rama_solicita,
        i.estado,
        (CURRENT_DATE - i.created_at::DATE)::INTEGER as dias_pendiente,
        i.documentos_pendientes as documentos_faltantes,
        (i.monto_total - COALESCE(pagos.monto_pagado, 0))::DECIMAL(10,2) as monto_pendiente,
        i.datos_contacto_emergencia as contacto_emergencia,
        CASE 
            WHEN (CURRENT_DATE - i.created_at::DATE) > 30 THEN 'ALTA'
            WHEN (CURRENT_DATE - i.created_at::DATE) > 15 THEN 'MEDIA'
            ELSE 'BAJA'
        END as prioridad
    FROM inscripciones i
    INNER JOIN scouts s ON i.scout_id = s.id
    LEFT JOIN LATERAL (
        SELECT SUM(pi.monto_pagado) as monto_pagado
        FROM pagos_inscripcion pi
        WHERE pi.inscripcion_id = i.id
    ) pagos ON true
    WHERE i.estado IN ('INICIADA', 'DOCUMENTOS_PENDIENTES', 'PAGO_PENDIENTE')
    ORDER BY 
        CASE 
            WHEN (CURRENT_DATE - i.created_at::DATE) > 30 THEN 1
            WHEN (CURRENT_DATE - i.created_at::DATE) > 15 THEN 2
            ELSE 3
        END,
        i.created_at;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '📝 FUNCIONES DE INSCRIPCIÓN CREADAS' as estado,
    'Todas las Database Functions del módulo de inscripción implementadas' as mensaje,
    '10 funciones de inscripción anual disponibles' as resumen;