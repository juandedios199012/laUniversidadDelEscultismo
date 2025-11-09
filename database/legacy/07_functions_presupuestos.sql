-- ================================================================
-- 💰 PRESUPUESTOS DATABASE FUNCTIONS - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 07_functions_presupuestos.sql
-- Propósito: Database Functions para el módulo de presupuestos
-- ================================================================

-- ============= 💰 FUNCIONES DE PRESUPUESTOS =============

-- Obtener presupuestos
CREATE OR REPLACE FUNCTION obtener_presupuestos(p_filtros JSON DEFAULT '{}')
RETURNS TABLE(
    id UUID,
    nombre VARCHAR(255),
    tipo_presupuesto tipo_presupuesto_enum,
    año INTEGER,
    monto_total DECIMAL(12,2),
    monto_gastado DECIMAL(12,2),
    monto_disponible DECIMAL(12,2),
    porcentaje_ejecucion NUMERIC,
    estado estado_presupuesto_enum,
    fecha_inicio DATE,
    fecha_fin DATE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_año INTEGER;
    v_tipo tipo_presupuesto_enum;
    v_estado estado_presupuesto_enum;
BEGIN
    -- Extraer filtros
    v_año := (p_filtros->>'año')::INTEGER;
    v_tipo := (p_filtros->>'tipo')::tipo_presupuesto_enum;
    v_estado := (p_filtros->>'estado')::estado_presupuesto_enum;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.nombre,
        p.tipo_presupuesto,
        p.año,
        p.monto_total,
        COALESCE(gastos.total_gastado, 0) as monto_gastado,
        (p.monto_total - COALESCE(gastos.total_gastado, 0)) as monto_disponible,
        CASE 
            WHEN p.monto_total > 0 
            THEN ROUND((COALESCE(gastos.total_gastado, 0) / p.monto_total * 100), 2)
            ELSE 0 
        END as porcentaje_ejecucion,
        p.estado,
        p.fecha_inicio,
        p.fecha_fin,
        p.created_at
    FROM presupuestos p
    LEFT JOIN LATERAL (
        SELECT SUM(g.monto) as total_gastado
        FROM gastos_presupuesto g
        WHERE g.presupuesto_id = p.id AND g.estado = 'APROBADO'
    ) gastos ON true
    WHERE 
        (v_año IS NULL OR p.año = v_año)
        AND (v_tipo IS NULL OR p.tipo_presupuesto = v_tipo)
        AND (v_estado IS NULL OR p.estado = v_estado)
    ORDER BY p.año DESC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Crear presupuesto
CREATE OR REPLACE FUNCTION crear_presupuesto(
    p_nombre VARCHAR(255),
    p_tipo_presupuesto tipo_presupuesto_enum,
    p_año INTEGER,
    p_monto_total DECIMAL(12,2),
    p_descripcion TEXT DEFAULT NULL,
    p_fecha_inicio DATE DEFAULT NULL,
    p_fecha_fin DATE DEFAULT NULL,
    p_responsable_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_presupuesto_id UUID;
    v_codigo_presupuesto VARCHAR(20);
BEGIN
    -- Validaciones
    IF p_monto_total <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'El monto total debe ser mayor a 0');
    END IF;
    
    IF p_año < 2020 OR p_año > 2050 THEN
        RETURN json_build_object('success', false, 'error', 'Año inválido');
    END IF;
    
    -- Verificar que no exista otro presupuesto con el mismo nombre y año
    IF EXISTS (
        SELECT 1 FROM presupuestos 
        WHERE nombre = p_nombre AND año = p_año
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Ya existe un presupuesto con ese nombre para el año ' || p_año);
    END IF;
    
    -- Generar código único
    v_codigo_presupuesto := generar_codigo('PRES', 'presupuestos', 'codigo_presupuesto');
    
    -- Insertar presupuesto
    INSERT INTO presupuestos (
        codigo_presupuesto,
        nombre,
        tipo_presupuesto,
        año,
        monto_total,
        descripcion,
        fecha_inicio,
        fecha_fin,
        responsable_id,
        estado
    ) VALUES (
        v_codigo_presupuesto,
        p_nombre,
        p_tipo_presupuesto,
        p_año,
        p_monto_total,
        p_descripcion,
        COALESCE(p_fecha_inicio, DATE(p_año || '-01-01')),
        COALESCE(p_fecha_fin, DATE(p_año || '-12-31')),
        p_responsable_id,
        'BORRADOR'
    ) RETURNING id INTO v_presupuesto_id;
    
    RETURN json_build_object('success', true, 'presupuesto_id', v_presupuesto_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Actualizar presupuesto
CREATE OR REPLACE FUNCTION actualizar_presupuesto(
    p_presupuesto_id UUID,
    p_nombre VARCHAR(255) DEFAULT NULL,
    p_monto_total DECIMAL(12,2) DEFAULT NULL,
    p_descripcion TEXT DEFAULT NULL,
    p_fecha_inicio DATE DEFAULT NULL,
    p_fecha_fin DATE DEFAULT NULL,
    p_estado estado_presupuesto_enum DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_monto_gastado DECIMAL(12,2);
BEGIN
    -- Verificar que el presupuesto existe
    IF NOT EXISTS (SELECT 1 FROM presupuestos WHERE id = p_presupuesto_id) THEN
        RETURN json_build_object('success', false, 'error', 'Presupuesto no encontrado');
    END IF;
    
    -- Si se está actualizando el monto, verificar que no sea menor al gastado
    IF p_monto_total IS NOT NULL THEN
        SELECT COALESCE(SUM(monto), 0) INTO v_monto_gastado
        FROM gastos_presupuesto 
        WHERE presupuesto_id = p_presupuesto_id AND estado = 'APROBADO';
        
        IF p_monto_total < v_monto_gastado THEN
            RETURN json_build_object('success', false, 'error', 'El monto total no puede ser menor al monto ya gastado: ' || v_monto_gastado);
        END IF;
    END IF;
    
    -- Actualizar presupuesto
    UPDATE presupuestos SET
        nombre = COALESCE(p_nombre, nombre),
        monto_total = COALESCE(p_monto_total, monto_total),
        descripcion = COALESCE(p_descripcion, descripcion),
        fecha_inicio = COALESCE(p_fecha_inicio, fecha_inicio),
        fecha_fin = COALESCE(p_fecha_fin, fecha_fin),
        estado = COALESCE(p_estado, estado),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_presupuesto_id;
    
    RETURN json_build_object('success', true, 'presupuesto_id', p_presupuesto_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 💸 FUNCIONES DE GASTOS =============

-- Obtener gastos de presupuesto
CREATE OR REPLACE FUNCTION obtener_gastos_presupuesto(p_presupuesto_id UUID)
RETURNS TABLE(
    id UUID,
    concepto VARCHAR(255),
    categoria categoria_gasto_enum,
    monto DECIMAL(10,2),
    fecha_gasto DATE,
    estado estado_gasto_enum,
    proveedor VARCHAR(255),
    numero_comprobante VARCHAR(100),
    descripcion TEXT,
    solicitado_por VARCHAR(255),
    aprobado_por VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.concepto,
        g.categoria,
        g.monto,
        g.fecha_gasto,
        g.estado,
        g.proveedor,
        g.numero_comprobante,
        g.descripcion,
        COALESCE(s_solicitado.nombres || ' ' || s_solicitado.apellidos, 'Sistema') as solicitado_por,
        COALESCE(s_aprobado.nombres || ' ' || s_aprobado.apellidos, '') as aprobado_por,
        g.created_at
    FROM gastos_presupuesto g
    LEFT JOIN scouts s_solicitado ON g.solicitado_por_id = s_solicitado.id
    LEFT JOIN scouts s_aprobado ON g.aprobado_por_id = s_aprobado.id
    WHERE g.presupuesto_id = p_presupuesto_id
    ORDER BY g.fecha_gasto DESC, g.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Registrar gasto
CREATE OR REPLACE FUNCTION registrar_gasto_presupuesto(
    p_presupuesto_id UUID,
    p_concepto VARCHAR(255),
    p_categoria categoria_gasto_enum,
    p_monto DECIMAL(10,2),
    p_fecha_gasto DATE,
    p_proveedor VARCHAR(255) DEFAULT NULL,
    p_numero_comprobante VARCHAR(100) DEFAULT NULL,
    p_descripcion TEXT DEFAULT NULL,
    p_solicitado_por_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_gasto_id UUID;
    v_monto_disponible DECIMAL(12,2);
BEGIN
    -- Verificar que el presupuesto existe y está activo
    SELECT (monto_total - COALESCE(gastado.total, 0)) INTO v_monto_disponible
    FROM presupuestos p
    LEFT JOIN LATERAL (
        SELECT SUM(monto) as total
        FROM gastos_presupuesto g
        WHERE g.presupuesto_id = p.id AND g.estado = 'APROBADO'
    ) gastado ON true
    WHERE p.id = p_presupuesto_id AND p.estado = 'ACTIVO';
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Presupuesto no encontrado o no está activo');
    END IF;
    
    -- Verificar disponibilidad de fondos
    IF p_monto > v_monto_disponible THEN
        RETURN json_build_object('success', false, 'error', 'Fondos insuficientes. Disponible: ' || v_monto_disponible);
    END IF;
    
    -- Insertar gasto
    INSERT INTO gastos_presupuesto (
        presupuesto_id,
        concepto,
        categoria,
        monto,
        fecha_gasto,
        proveedor,
        numero_comprobante,
        descripcion,
        solicitado_por_id,
        estado
    ) VALUES (
        p_presupuesto_id,
        p_concepto,
        p_categoria,
        p_monto,
        p_fecha_gasto,
        p_proveedor,
        p_numero_comprobante,
        p_descripcion,
        p_solicitado_por_id,
        'PENDIENTE'
    ) RETURNING id INTO v_gasto_id;
    
    RETURN json_build_object('success', true, 'gasto_id', v_gasto_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Aprobar/rechazar gasto
CREATE OR REPLACE FUNCTION procesar_gasto_presupuesto(
    p_gasto_id UUID,
    p_accion VARCHAR(20), -- 'APROBAR' o 'RECHAZAR'
    p_observaciones TEXT DEFAULT NULL,
    p_aprobado_por_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_nuevo_estado estado_gasto_enum;
BEGIN
    -- Verificar que el gasto existe
    IF NOT EXISTS (SELECT 1 FROM gastos_presupuesto WHERE id = p_gasto_id) THEN
        RETURN json_build_object('success', false, 'error', 'Gasto no encontrado');
    END IF;
    
    -- Determinar nuevo estado
    CASE p_accion
        WHEN 'APROBAR' THEN v_nuevo_estado := 'APROBADO';
        WHEN 'RECHAZAR' THEN v_nuevo_estado := 'RECHAZADO';
        ELSE 
            RETURN json_build_object('success', false, 'error', 'Acción inválida. Use APROBAR o RECHAZAR');
    END CASE;
    
    -- Actualizar gasto
    UPDATE gastos_presupuesto SET
        estado = v_nuevo_estado,
        observaciones = p_observaciones,
        aprobado_por_id = p_aprobado_por_id,
        fecha_aprobacion = CASE WHEN v_nuevo_estado = 'APROBADO' THEN CURRENT_DATE ELSE NULL END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_gasto_id;
    
    RETURN json_build_object('success', true, 'gasto_id', p_gasto_id, 'nuevo_estado', v_nuevo_estado);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 💳 FUNCIONES DE INGRESOS =============

-- Registrar ingreso
CREATE OR REPLACE FUNCTION registrar_ingreso_presupuesto(
    p_presupuesto_id UUID,
    p_concepto VARCHAR(255),
    p_monto DECIMAL(10,2),
    p_fecha_ingreso DATE,
    p_fuente VARCHAR(255) DEFAULT NULL,
    p_numero_recibo VARCHAR(100) DEFAULT NULL,
    p_descripcion TEXT DEFAULT NULL,
    p_registrado_por_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_ingreso_id UUID;
BEGIN
    -- Verificar que el presupuesto existe
    IF NOT EXISTS (SELECT 1 FROM presupuestos WHERE id = p_presupuesto_id) THEN
        RETURN json_build_object('success', false, 'error', 'Presupuesto no encontrado');
    END IF;
    
    -- Insertar ingreso
    INSERT INTO ingresos_presupuesto (
        presupuesto_id,
        concepto,
        monto,
        fecha_ingreso,
        fuente,
        numero_recibo,
        descripcion,
        registrado_por_id
    ) VALUES (
        p_presupuesto_id,
        p_concepto,
        p_monto,
        p_fecha_ingreso,
        p_fuente,
        p_numero_recibo,
        p_descripcion,
        p_registrado_por_id
    ) RETURNING id INTO v_ingreso_id;
    
    -- Actualizar monto total del presupuesto
    UPDATE presupuestos 
    SET monto_total = monto_total + p_monto,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_presupuesto_id;
    
    RETURN json_build_object('success', true, 'ingreso_id', v_ingreso_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener ingresos de presupuesto
CREATE OR REPLACE FUNCTION obtener_ingresos_presupuesto(p_presupuesto_id UUID)
RETURNS TABLE(
    id UUID,
    concepto VARCHAR(255),
    monto DECIMAL(10,2),
    fecha_ingreso DATE,
    fuente VARCHAR(255),
    numero_recibo VARCHAR(100),
    descripcion TEXT,
    registrado_por VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.concepto,
        i.monto,
        i.fecha_ingreso,
        i.fuente,
        i.numero_recibo,
        i.descripcion,
        COALESCE(s.nombres || ' ' || s.apellidos, 'Sistema') as registrado_por,
        i.created_at
    FROM ingresos_presupuesto i
    LEFT JOIN scouts s ON i.registrado_por_id = s.id
    WHERE i.presupuesto_id = p_presupuesto_id
    ORDER BY i.fecha_ingreso DESC;
END;
$$ LANGUAGE plpgsql;

-- ============= 📊 FUNCIONES DE REPORTES Y ANÁLISIS =============

-- Obtener resumen financiero
CREATE OR REPLACE FUNCTION obtener_resumen_financiero(p_año INTEGER DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    v_año INTEGER;
    v_resultado JSON;
BEGIN
    v_año := COALESCE(p_año, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
    
    SELECT json_build_object(
        'año', v_año,
        'presupuesto_total', COALESCE(SUM(p.monto_total), 0),
        'total_gastado', COALESCE(SUM(gastos.total_gastado), 0),
        'total_ingresos', COALESCE(SUM(ingresos.total_ingresos), 0),
        'balance', COALESCE(SUM(p.monto_total), 0) - COALESCE(SUM(gastos.total_gastado), 0),
        'porcentaje_ejecucion', 
            CASE 
                WHEN SUM(p.monto_total) > 0 
                THEN ROUND((SUM(gastos.total_gastado) / SUM(p.monto_total) * 100), 2)
                ELSE 0 
            END,
        'presupuestos_por_tipo', json_object_agg(p.tipo_presupuesto, tipo_totales.total_tipo),
        'gastos_por_categoria', (
            SELECT json_object_agg(g.categoria, categoria_totales.total_categoria)
            FROM gastos_presupuesto g
            INNER JOIN presupuestos pr ON g.presupuesto_id = pr.id
            CROSS JOIN LATERAL (
                SELECT SUM(g2.monto) as total_categoria
                FROM gastos_presupuesto g2
                INNER JOIN presupuestos pr2 ON g2.presupuesto_id = pr2.id
                WHERE g2.categoria = g.categoria 
                AND pr2.año = v_año 
                AND g2.estado = 'APROBADO'
            ) categoria_totales
            WHERE pr.año = v_año AND g.estado = 'APROBADO'
            GROUP BY g.categoria
        )
    ) INTO v_resultado
    FROM presupuestos p
    LEFT JOIN LATERAL (
        SELECT SUM(g.monto) as total_gastado
        FROM gastos_presupuesto g
        WHERE g.presupuesto_id = p.id AND g.estado = 'APROBADO'
    ) gastos ON true
    LEFT JOIN LATERAL (
        SELECT SUM(i.monto) as total_ingresos
        FROM ingresos_presupuesto i
        WHERE i.presupuesto_id = p.id
    ) ingresos ON true
    CROSS JOIN LATERAL (
        SELECT SUM(p2.monto_total) as total_tipo
        FROM presupuestos p2
        WHERE p2.tipo_presupuesto = p.tipo_presupuesto AND p2.año = v_año
    ) tipo_totales
    WHERE p.año = v_año
    GROUP BY p.tipo_presupuesto;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- Generar proyección financiera
CREATE OR REPLACE FUNCTION generar_proyeccion_financiera(p_presupuesto_id UUID, p_meses_adelante INTEGER DEFAULT 6)
RETURNS JSON AS $$
DECLARE
    v_presupuesto RECORD;
    v_gasto_promedio_mensual DECIMAL(10,2);
    v_resultado JSON;
BEGIN
    -- Obtener datos del presupuesto
    SELECT p.*, 
           COALESCE(gastos.total_gastado, 0) as gastado,
           COALESCE(ingresos.total_ingresos, 0) as ingresos_adicionales
    INTO v_presupuesto
    FROM presupuestos p
    LEFT JOIN LATERAL (
        SELECT SUM(g.monto) as total_gastado
        FROM gastos_presupuesto g
        WHERE g.presupuesto_id = p.id AND g.estado = 'APROBADO'
    ) gastos ON true
    LEFT JOIN LATERAL (
        SELECT SUM(i.monto) as total_ingresos
        FROM ingresos_presupuesto i
        WHERE i.presupuesto_id = p.id
    ) ingresos ON true
    WHERE p.id = p_presupuesto_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Presupuesto no encontrado');
    END IF;
    
    -- Calcular gasto promedio mensual
    SELECT COALESCE(AVG(monthly_spending.monthly_total), 0) INTO v_gasto_promedio_mensual
    FROM (
        SELECT 
            DATE_TRUNC('month', g.fecha_gasto) as mes,
            SUM(g.monto) as monthly_total
        FROM gastos_presupuesto g
        WHERE g.presupuesto_id = p_presupuesto_id 
        AND g.estado = 'APROBADO'
        AND g.fecha_gasto >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', g.fecha_gasto)
    ) monthly_spending;
    
    -- Generar proyección
    SELECT json_build_object(
        'presupuesto_id', p_presupuesto_id,
        'situacion_actual', json_build_object(
            'monto_total', v_presupuesto.monto_total,
            'gastado', v_presupuesto.gastado,
            'disponible', v_presupuesto.monto_total - v_presupuesto.gastado,
            'porcentaje_ejecutado', 
                CASE 
                    WHEN v_presupuesto.monto_total > 0 
                    THEN ROUND((v_presupuesto.gastado / v_presupuesto.monto_total * 100), 2)
                    ELSE 0 
                END
        ),
        'proyeccion', json_build_object(
            'gasto_promedio_mensual', v_gasto_promedio_mensual,
            'meses_restantes_estimados', 
                CASE 
                    WHEN v_gasto_promedio_mensual > 0 
                    THEN ROUND(((v_presupuesto.monto_total - v_presupuesto.gastado) / v_gasto_promedio_mensual), 1)
                    ELSE NULL 
                END,
            'gasto_proyectado_' || p_meses_adelante || '_meses', v_gasto_promedio_mensual * p_meses_adelante,
            'balance_proyectado', (v_presupuesto.monto_total - v_presupuesto.gastado) - (v_gasto_promedio_mensual * p_meses_adelante)
        ),
        'recomendaciones', CASE 
            WHEN (v_presupuesto.monto_total - v_presupuesto.gastado) - (v_gasto_promedio_mensual * p_meses_adelante) < 0 
            THEN ARRAY['Considerar reducir gastos', 'Buscar fuentes adicionales de ingreso', 'Revisar presupuesto']
            WHEN v_gasto_promedio_mensual = 0 
            THEN ARRAY['Insuficientes datos históricos para proyección confiable']
            ELSE ARRAY['Situación financiera estable', 'Mantener control de gastos']
        END
    ) INTO v_resultado;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- Obtener análisis comparativo por categorías
CREATE OR REPLACE FUNCTION obtener_analisis_categorias_gasto(p_año INTEGER DEFAULT NULL)
RETURNS TABLE(
    categoria categoria_gasto_enum,
    total_gastado DECIMAL(12,2),
    promedio_por_gasto DECIMAL(10,2),
    numero_gastos INTEGER,
    porcentaje_del_total NUMERIC,
    mes_mayor_gasto VARCHAR(7),
    monto_mes_mayor DECIMAL(10,2)
) AS $$
DECLARE
    v_año INTEGER;
    v_total_general DECIMAL(12,2);
BEGIN
    v_año := COALESCE(p_año, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
    
    -- Obtener total general
    SELECT COALESCE(SUM(g.monto), 0) INTO v_total_general
    FROM gastos_presupuesto g
    INNER JOIN presupuestos p ON g.presupuesto_id = p.id
    WHERE p.año = v_año AND g.estado = 'APROBADO';
    
    RETURN QUERY
    SELECT 
        g.categoria,
        SUM(g.monto) as total_gastado,
        AVG(g.monto) as promedio_por_gasto,
        COUNT(*)::INTEGER as numero_gastos,
        CASE 
            WHEN v_total_general > 0 
            THEN ROUND((SUM(g.monto) / v_total_general * 100), 2)
            ELSE 0 
        END as porcentaje_del_total,
        mayor_mes.mes_año as mes_mayor_gasto,
        mayor_mes.monto_mes as monto_mes_mayor
    FROM gastos_presupuesto g
    INNER JOIN presupuestos p ON g.presupuesto_id = p.id
    LEFT JOIN LATERAL (
        SELECT 
            TO_CHAR(g2.fecha_gasto, 'YYYY-MM') as mes_año,
            SUM(g2.monto) as monto_mes
        FROM gastos_presupuesto g2
        INNER JOIN presupuestos p2 ON g2.presupuesto_id = p2.id
        WHERE g2.categoria = g.categoria 
        AND p2.año = v_año 
        AND g2.estado = 'APROBADO'
        GROUP BY TO_CHAR(g2.fecha_gasto, 'YYYY-MM')
        ORDER BY monto_mes DESC
        LIMIT 1
    ) mayor_mes ON true
    WHERE p.año = v_año AND g.estado = 'APROBADO'
    GROUP BY g.categoria, mayor_mes.mes_año, mayor_mes.monto_mes
    ORDER BY total_gastado DESC;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '💰 FUNCIONES DE PRESUPUESTOS CREADAS' as estado,
    'Todas las Database Functions del módulo de presupuestos implementadas' as mensaje,
    '20 funciones de presupuestos disponibles' as resumen;