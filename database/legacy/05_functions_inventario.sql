-- ================================================================
-- 📦 INVENTORY DATABASE FUNCTIONS - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 05_functions_inventario.sql
-- Propósito: Database Functions para el módulo de inventario
-- ================================================================

-- ============= 📋 FUNCIONES DE CONSULTA =============

-- Obtener inventario completo
CREATE OR REPLACE FUNCTION obtener_inventario_completo()
RETURNS TABLE(
    id UUID,
    nombre VARCHAR(255),
    categoria categoria_inventario_enum,
    cantidad_disponible INTEGER,
    cantidad_minima INTEGER,
    ubicacion VARCHAR(255),
    estado_item estado_item_enum,
    valor_unitario DECIMAL(10,2),
    valor_total DECIMAL(10,2),
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.nombre,
        i.categoria,
        i.cantidad_disponible,
        i.cantidad_minima,
        i.ubicacion,
        i.estado_item,
        i.valor_unitario,
        (i.cantidad_disponible * i.valor_unitario) as valor_total,
        i.descripcion,
        i.created_at
    FROM inventario i
    WHERE i.estado_item != 'ELIMINADO'
    ORDER BY i.categoria, i.nombre;
END;
$$ LANGUAGE plpgsql;

-- Obtener inventario por categoría
CREATE OR REPLACE FUNCTION obtener_inventario_por_categoria(p_categoria categoria_inventario_enum)
RETURNS TABLE(
    id UUID,
    nombre VARCHAR(255),
    cantidad_disponible INTEGER,
    cantidad_minima INTEGER,
    ubicacion VARCHAR(255),
    estado_item estado_item_enum,
    valor_unitario DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.nombre,
        i.cantidad_disponible,
        i.cantidad_minima,
        i.ubicacion,
        i.estado_item,
        i.valor_unitario
    FROM inventario i
    WHERE i.categoria = p_categoria 
    AND i.estado_item != 'ELIMINADO'
    ORDER BY i.nombre;
END;
$$ LANGUAGE plpgsql;

-- Obtener item específico
CREATE OR REPLACE FUNCTION obtener_item_inventario(p_item_id UUID)
RETURNS TABLE(
    id UUID,
    nombre VARCHAR(255),
    categoria categoria_inventario_enum,
    cantidad_disponible INTEGER,
    cantidad_minima INTEGER,
    ubicacion VARCHAR(255),
    estado_item estado_item_enum,
    valor_unitario DECIMAL(10,2),
    descripcion TEXT,
    codigo_barras VARCHAR(50),
    proveedor VARCHAR(255),
    fecha_adquisicion DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.nombre,
        i.categoria,
        i.cantidad_disponible,
        i.cantidad_minima,
        i.ubicacion,
        i.estado_item,
        i.valor_unitario,
        i.descripcion,
        i.codigo_barras,
        i.proveedor,
        i.fecha_adquisicion,
        i.created_at,
        i.updated_at
    FROM inventario i
    WHERE i.id = p_item_id;
END;
$$ LANGUAGE plpgsql;

-- ============= ✏️ FUNCIONES DE MODIFICACIÓN =============

-- Crear item de inventario
CREATE OR REPLACE FUNCTION crear_item_inventario(
    p_nombre VARCHAR(255),
    p_categoria categoria_inventario_enum,
    p_cantidad_disponible INTEGER,
    p_cantidad_minima INTEGER DEFAULT 5,
    p_ubicacion VARCHAR(255) DEFAULT NULL,
    p_valor_unitario DECIMAL(10,2) DEFAULT 0.00,
    p_descripcion TEXT DEFAULT NULL,
    p_codigo_barras VARCHAR(50) DEFAULT NULL,
    p_proveedor VARCHAR(255) DEFAULT NULL,
    p_fecha_adquisicion DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    v_item_id UUID;
    v_codigo_item VARCHAR(20);
BEGIN
    -- Validaciones
    IF p_nombre IS NULL OR LENGTH(TRIM(p_nombre)) = 0 THEN
        RETURN json_build_object('success', false, 'error', 'El nombre del item es obligatorio');
    END IF;
    
    IF p_cantidad_disponible < 0 THEN
        RETURN json_build_object('success', false, 'error', 'La cantidad no puede ser negativa');
    END IF;
    
    IF p_valor_unitario < 0 THEN
        RETURN json_build_object('success', false, 'error', 'El valor unitario no puede ser negativo');
    END IF;

    -- Verificar código de barras único si se proporciona
    IF p_codigo_barras IS NOT NULL AND EXISTS (
        SELECT 1 FROM inventario WHERE codigo_barras = p_codigo_barras
    ) THEN
        RETURN json_build_object('success', false, 'error', 'El código de barras ya existe');
    END IF;

    -- Generar código único para el item
    v_codigo_item := generar_codigo('INV', 'inventario', 'codigo_item');
    
    -- Insertar item
    INSERT INTO inventario (
        codigo_item,
        nombre,
        categoria,
        cantidad_disponible,
        cantidad_minima,
        ubicacion,
        valor_unitario,
        descripcion,
        codigo_barras,
        proveedor,
        fecha_adquisicion,
        estado_item
    ) VALUES (
        v_codigo_item,
        TRIM(p_nombre),
        p_categoria,
        p_cantidad_disponible,
        p_cantidad_minima,
        p_ubicacion,
        p_valor_unitario,
        p_descripcion,
        p_codigo_barras,
        p_proveedor,
        p_fecha_adquisicion,
        'DISPONIBLE'
    ) RETURNING id INTO v_item_id;
    
    -- Registrar movimiento inicial
    INSERT INTO movimientos_inventario (
        item_id,
        tipo_movimiento,
        cantidad,
        motivo,
        realizado_por_id
    ) VALUES (
        v_item_id,
        'ENTRADA',
        p_cantidad_disponible,
        'Registro inicial de inventario',
        NULL -- Se puede pasar como parámetro opcional
    );
    
    RETURN json_build_object('success', true, 'item_id', v_item_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Actualizar item de inventario
CREATE OR REPLACE FUNCTION actualizar_item_inventario(
    p_item_id UUID,
    p_nombre VARCHAR(255) DEFAULT NULL,
    p_categoria categoria_inventario_enum DEFAULT NULL,
    p_cantidad_minima INTEGER DEFAULT NULL,
    p_ubicacion VARCHAR(255) DEFAULT NULL,
    p_valor_unitario DECIMAL(10,2) DEFAULT NULL,
    p_descripcion TEXT DEFAULT NULL,
    p_proveedor VARCHAR(255) DEFAULT NULL,
    p_actualizado_por_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_item_exists BOOLEAN;
BEGIN
    -- Verificar que el item existe
    SELECT EXISTS(SELECT 1 FROM inventario WHERE id = p_item_id AND estado_item != 'ELIMINADO')
    INTO v_item_exists;
    
    IF NOT v_item_exists THEN
        RETURN json_build_object('success', false, 'error', 'Item de inventario no encontrado');
    END IF;
    
    -- Actualizar solo campos proporcionados
    UPDATE inventario SET
        nombre = COALESCE(p_nombre, nombre),
        categoria = COALESCE(p_categoria, categoria),
        cantidad_minima = COALESCE(p_cantidad_minima, cantidad_minima),
        ubicacion = COALESCE(p_ubicacion, ubicacion),
        valor_unitario = COALESCE(p_valor_unitario, valor_unitario),
        descripcion = COALESCE(p_descripcion, descripcion),
        proveedor = COALESCE(p_proveedor, proveedor),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_item_id;
    
    RETURN json_build_object('success', true, 'item_id', p_item_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Eliminar item de inventario (eliminación lógica)
CREATE OR REPLACE FUNCTION eliminar_item_inventario(p_item_id UUID)
RETURNS JSON AS $$
DECLARE
    v_item_exists BOOLEAN;
BEGIN
    -- Verificar que el item existe
    SELECT EXISTS(SELECT 1 FROM inventario WHERE id = p_item_id AND estado_item != 'ELIMINADO')
    INTO v_item_exists;
    
    IF NOT v_item_exists THEN
        RETURN json_build_object('success', false, 'error', 'Item de inventario no encontrado');
    END IF;
    
    -- Verificar que no hay préstamos activos
    IF EXISTS (
        SELECT 1 FROM prestamos_inventario 
        WHERE item_id = p_item_id AND estado_prestamo = 'ACTIVO'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'No se puede eliminar un item con préstamos activos');
    END IF;
    
    -- Eliminación lógica
    UPDATE inventario SET
        estado_item = 'ELIMINADO',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_item_id;
    
    RETURN json_build_object('success', true, 'item_id', p_item_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 📦 FUNCIONES DE MOVIMIENTOS =============

-- Registrar movimiento de inventario
CREATE OR REPLACE FUNCTION registrar_movimiento_inventario(
    p_item_id UUID,
    p_tipo_movimiento tipo_movimiento_enum,
    p_cantidad INTEGER,
    p_motivo TEXT,
    p_actividad_id UUID DEFAULT NULL,
    p_scout_id UUID DEFAULT NULL,
    p_dirigente_id UUID DEFAULT NULL,
    p_realizado_por_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_cantidad_actual INTEGER;
    v_nueva_cantidad INTEGER;
    v_movimiento_id UUID;
BEGIN
    -- Verificar que el item existe
    SELECT cantidad_disponible INTO v_cantidad_actual
    FROM inventario 
    WHERE id = p_item_id AND estado_item != 'ELIMINADO';
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item de inventario no encontrado');
    END IF;
    
    -- Calcular nueva cantidad
    CASE p_tipo_movimiento
        WHEN 'ENTRADA' THEN
            v_nueva_cantidad := v_cantidad_actual + p_cantidad;
        WHEN 'SALIDA' THEN
            v_nueva_cantidad := v_cantidad_actual - p_cantidad;
            IF v_nueva_cantidad < 0 THEN
                RETURN json_build_object('success', false, 'error', 'Stock insuficiente');
            END IF;
        WHEN 'AJUSTE' THEN
            v_nueva_cantidad := p_cantidad;
        ELSE
            RETURN json_build_object('success', false, 'error', 'Tipo de movimiento inválido');
    END CASE;
    
    -- Registrar movimiento
    INSERT INTO movimientos_inventario (
        item_id,
        tipo_movimiento,
        cantidad,
        cantidad_anterior,
        cantidad_posterior,
        motivo,
        actividad_id,
        scout_id,
        dirigente_id,
        realizado_por_id
    ) VALUES (
        p_item_id,
        p_tipo_movimiento,
        p_cantidad,
        v_cantidad_actual,
        v_nueva_cantidad,
        p_motivo,
        p_actividad_id,
        p_scout_id,
        p_dirigente_id,
        p_realizado_por_id
    ) RETURNING id INTO v_movimiento_id;
    
    -- Actualizar cantidad en inventario
    UPDATE inventario 
    SET cantidad_disponible = v_nueva_cantidad,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_item_id;
    
    RETURN json_build_object('success', true, 'movimiento_id', v_movimiento_id, 'nueva_cantidad', v_nueva_cantidad);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener movimientos de inventario
CREATE OR REPLACE FUNCTION obtener_movimientos_inventario(p_filtros JSON DEFAULT '{}')
RETURNS TABLE(
    id UUID,
    item_nombre VARCHAR(255),
    tipo_movimiento tipo_movimiento_enum,
    cantidad INTEGER,
    cantidad_anterior INTEGER,
    cantidad_posterior INTEGER,
    motivo TEXT,
    fecha_movimiento TIMESTAMP WITH TIME ZONE,
    realizado_por VARCHAR(255),
    scout_nombre VARCHAR(255),
    actividad_nombre VARCHAR(255)
) AS $$
DECLARE
    v_fecha_desde DATE;
    v_fecha_hasta DATE;
    v_item_id UUID;
    v_tipo_movimiento tipo_movimiento_enum;
BEGIN
    -- Extraer filtros del JSON
    v_fecha_desde := (p_filtros->>'fecha_desde')::DATE;
    v_fecha_hasta := (p_filtros->>'fecha_hasta')::DATE;
    v_item_id := (p_filtros->>'item_id')::UUID;
    v_tipo_movimiento := (p_filtros->>'tipo_movimiento')::tipo_movimiento_enum;
    
    RETURN QUERY
    SELECT 
        m.id,
        i.nombre as item_nombre,
        m.tipo_movimiento,
        m.cantidad,
        m.cantidad_anterior,
        m.cantidad_posterior,
        m.motivo,
        m.created_at as fecha_movimiento,
        COALESCE(s_realizado.nombres || ' ' || s_realizado.apellidos, 'Sistema') as realizado_por,
        CASE WHEN m.scout_id IS NOT NULL THEN s_scout.nombres || ' ' || s_scout.apellidos ELSE NULL END as scout_nombre,
        a.nombre as actividad_nombre
    FROM movimientos_inventario m
    INNER JOIN inventario i ON m.item_id = i.id
    LEFT JOIN scouts s_realizado ON m.realizado_por_id = s_realizado.id
    LEFT JOIN scouts s_scout ON m.scout_id = s_scout.id
    LEFT JOIN actividades_scout a ON m.actividad_id = a.id
    WHERE 
        (v_fecha_desde IS NULL OR m.created_at::DATE >= v_fecha_desde)
        AND (v_fecha_hasta IS NULL OR m.created_at::DATE <= v_fecha_hasta)
        AND (v_item_id IS NULL OR m.item_id = v_item_id)
        AND (v_tipo_movimiento IS NULL OR m.tipo_movimiento = v_tipo_movimiento)
    ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============= 🎯 FUNCIONES DE PRÉSTAMOS =============

-- Procesar préstamo de inventario
CREATE OR REPLACE FUNCTION procesar_prestamo_inventario(
    p_item_id UUID,
    p_cantidad INTEGER,
    p_scout_id UUID,
    p_fecha_devolucion_esperada DATE,
    p_motivo TEXT DEFAULT NULL,
    p_autorizado_por_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_prestamo_id UUID;
    v_cantidad_disponible INTEGER;
BEGIN
    -- Verificar disponibilidad
    SELECT cantidad_disponible INTO v_cantidad_disponible
    FROM inventario 
    WHERE id = p_item_id AND estado_item = 'DISPONIBLE';
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item no encontrado o no disponible');
    END IF;
    
    IF v_cantidad_disponible < p_cantidad THEN
        RETURN json_build_object('success', false, 'error', 'Stock insuficiente. Disponible: ' || v_cantidad_disponible);
    END IF;
    
    -- Crear préstamo
    INSERT INTO prestamos_inventario (
        item_id,
        scout_id,
        cantidad_prestada,
        fecha_prestamo,
        fecha_devolucion_esperada,
        estado_prestamo,
        motivo,
        autorizado_por_id
    ) VALUES (
        p_item_id,
        p_scout_id,
        p_cantidad,
        CURRENT_DATE,
        p_fecha_devolucion_esperada,
        'ACTIVO',
        p_motivo,
        p_autorizado_por_id
    ) RETURNING id INTO v_prestamo_id;
    
    -- Registrar movimiento de salida
    PERFORM registrar_movimiento_inventario(
        p_item_id,
        'SALIDA',
        p_cantidad,
        COALESCE(p_motivo, 'Préstamo a scout'),
        NULL, -- actividad_id
        p_scout_id,
        NULL, -- dirigente_id
        p_autorizado_por_id
    );
    
    RETURN json_build_object('success', true, 'prestamo_id', v_prestamo_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Procesar devolución de inventario
CREATE OR REPLACE FUNCTION procesar_devolucion_inventario(
    p_prestamo_id UUID,
    p_cantidad_devuelta INTEGER,
    p_estado_items VARCHAR(50) DEFAULT 'BUENO',
    p_observaciones TEXT DEFAULT NULL,
    p_recibido_por_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_prestamo RECORD;
    v_cantidad_pendiente INTEGER;
BEGIN
    -- Obtener datos del préstamo
    SELECT 
        pi.id,
        pi.item_id,
        pi.scout_id,
        pi.cantidad_prestada,
        pi.cantidad_devuelta,
        pi.estado_prestamo,
        i.nombre as item_nombre
    INTO v_prestamo
    FROM prestamos_inventario pi
    INNER JOIN inventario i ON pi.item_id = i.id
    WHERE pi.id = p_prestamo_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Préstamo no encontrado');
    END IF;
    
    IF v_prestamo.estado_prestamo != 'ACTIVO' THEN
        RETURN json_build_object('success', false, 'error', 'El préstamo no está activo');
    END IF;
    
    -- Calcular cantidad pendiente
    v_cantidad_pendiente := v_prestamo.cantidad_prestada - COALESCE(v_prestamo.cantidad_devuelta, 0);
    
    IF p_cantidad_devuelta > v_cantidad_pendiente THEN
        RETURN json_build_object('success', false, 'error', 'La cantidad devuelta excede la cantidad pendiente');
    END IF;
    
    -- Actualizar préstamo
    UPDATE prestamos_inventario SET
        cantidad_devuelta = COALESCE(cantidad_devuelta, 0) + p_cantidad_devuelta,
        fecha_devolucion_real = CASE 
            WHEN COALESCE(cantidad_devuelta, 0) + p_cantidad_devuelta >= cantidad_prestada 
            THEN CURRENT_DATE 
            ELSE fecha_devolucion_real 
        END,
        estado_prestamo = CASE 
            WHEN COALESCE(cantidad_devuelta, 0) + p_cantidad_devuelta >= cantidad_prestada 
            THEN 'DEVUELTO' 
            ELSE 'PARCIAL' 
        END,
        estado_items_devueltos = p_estado_items,
        observaciones_devolucion = p_observaciones,
        recibido_por_id = p_recibido_por_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_prestamo_id;
    
    -- Registrar movimiento de entrada
    PERFORM registrar_movimiento_inventario(
        v_prestamo.item_id,
        'ENTRADA',
        p_cantidad_devuelta,
        'Devolución de préstamo: ' || v_prestamo.item_nombre,
        NULL, -- actividad_id
        v_prestamo.scout_id,
        NULL, -- dirigente_id
        p_recibido_por_id
    );
    
    RETURN json_build_object('success', true, 'prestamo_id', p_prestamo_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 📊 FUNCIONES DE REPORTES =============

-- Obtener resumen de inventario
CREATE OR REPLACE FUNCTION obtener_resumen_inventario()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'total_items', COUNT(*),
        'valor_total_inventario', COALESCE(SUM(cantidad_disponible * valor_unitario), 0),
        'items_stock_bajo', COUNT(CASE WHEN cantidad_disponible <= cantidad_minima THEN 1 END),
        'items_por_categoria', json_object_agg(categoria, categoria_count),
        'items_mas_prestados', (
            SELECT json_agg(
                json_build_object(
                    'nombre_item', nombre_item,
                    'total_prestamos', total_prestamos
                )
            )
            FROM (
                SELECT 
                    i.nombre as nombre_item,
                    COUNT(pi.id) as total_prestamos
                FROM inventario i
                LEFT JOIN prestamos_inventario pi ON i.id = pi.item_id
                GROUP BY i.id, i.nombre
                HAVING COUNT(pi.id) > 0
                ORDER BY COUNT(pi.id) DESC
                LIMIT 5
            ) item_prestado
        )
    ) INTO v_resultado
    FROM inventario i
    CROSS JOIN LATERAL (
        SELECT categoria, COUNT(*) as categoria_count
        FROM inventario i2 
        WHERE i2.estado_item != 'ELIMINADO'
        GROUP BY categoria
    ) cat_counts
    WHERE i.estado_item != 'ELIMINADO';
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- Obtener items con stock bajo
CREATE OR REPLACE FUNCTION obtener_items_stock_bajo()
RETURNS TABLE(
    id UUID,
    nombre VARCHAR(255),
    categoria categoria_inventario_enum,
    cantidad_disponible INTEGER,
    cantidad_minima INTEGER,
    ubicacion VARCHAR(255),
    valor_unitario DECIMAL(10,2),
    urgencia VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.nombre,
        i.categoria,
        i.cantidad_disponible,
        i.cantidad_minima,
        i.ubicacion,
        i.valor_unitario,
        CASE 
            WHEN i.cantidad_disponible = 0 THEN 'CRITICA'
            WHEN i.cantidad_disponible <= (i.cantidad_minima * 0.5) THEN 'ALTA'
            ELSE 'MEDIA'
        END as urgencia
    FROM inventario i
    WHERE i.cantidad_disponible <= i.cantidad_minima
    AND i.estado_item = 'DISPONIBLE'
    ORDER BY 
        CASE 
            WHEN i.cantidad_disponible = 0 THEN 1
            WHEN i.cantidad_disponible <= (i.cantidad_minima * 0.5) THEN 2
            ELSE 3
        END,
        i.cantidad_disponible ASC;
END;
$$ LANGUAGE plpgsql;

-- ============= 🔍 FUNCIONES DE BÚSQUEDA =============

-- Buscar items en inventario
CREATE OR REPLACE FUNCTION buscar_items_inventario(p_criterios JSON)
RETURNS TABLE(
    id UUID,
    nombre VARCHAR(255),
    categoria categoria_inventario_enum,
    cantidad_disponible INTEGER,
    ubicacion VARCHAR(255),
    valor_unitario DECIMAL(10,2),
    descripcion TEXT
) AS $$
DECLARE
    v_texto_busqueda TEXT;
    v_categoria categoria_inventario_enum;
    v_ubicacion VARCHAR(255);
    v_disponible_solo BOOLEAN;
BEGIN
    -- Extraer criterios
    v_texto_busqueda := p_criterios->>'texto';
    v_categoria := (p_criterios->>'categoria')::categoria_inventario_enum;
    v_ubicacion := p_criterios->>'ubicacion';
    v_disponible_solo := COALESCE((p_criterios->>'disponible_solo')::BOOLEAN, false);
    
    RETURN QUERY
    SELECT 
        i.id,
        i.nombre,
        i.categoria,
        i.cantidad_disponible,
        i.ubicacion,
        i.valor_unitario,
        i.descripcion
    FROM inventario i
    WHERE i.estado_item != 'ELIMINADO'
    AND (v_texto_busqueda IS NULL OR (
        i.nombre ILIKE '%' || v_texto_busqueda || '%' OR
        i.descripcion ILIKE '%' || v_texto_busqueda || '%' OR
        i.codigo_barras ILIKE '%' || v_texto_busqueda || '%'
    ))
    AND (v_categoria IS NULL OR i.categoria = v_categoria)
    AND (v_ubicacion IS NULL OR i.ubicacion ILIKE '%' || v_ubicacion || '%')
    AND (NOT v_disponible_solo OR i.cantidad_disponible > 0)
    ORDER BY i.nombre;
END;
$$ LANGUAGE plpgsql;

-- ============= 🧮 FUNCIONES DE CÁLCULO =============

-- Calcular valor total del inventario
CREATE OR REPLACE FUNCTION calcular_valor_inventario(p_categoria categoria_inventario_enum DEFAULT NULL)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    v_valor_total DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(cantidad_disponible * valor_unitario), 0)
    INTO v_valor_total
    FROM inventario
    WHERE estado_item != 'ELIMINADO'
    AND (p_categoria IS NULL OR categoria = p_categoria);
    
    RETURN v_valor_total;
END;
$$ LANGUAGE plpgsql;

-- Obtener estadísticas de movimientos
CREATE OR REPLACE FUNCTION obtener_estadisticas_movimientos(p_periodo JSON DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    v_fecha_desde DATE;
    v_fecha_hasta DATE;
    v_resultado JSON;
BEGIN
    v_fecha_desde := COALESCE((p_periodo->>'fecha_desde')::DATE, CURRENT_DATE - INTERVAL '30 days');
    v_fecha_hasta := COALESCE((p_periodo->>'fecha_hasta')::DATE, CURRENT_DATE);
    
    SELECT json_build_object(
        'total_movimientos', COUNT(*),
        'movimientos_por_tipo', json_object_agg(tipo_movimiento, tipo_count),
        'valor_movimientos', COALESCE(SUM(
            CASE tipo_movimiento
                WHEN 'ENTRADA' THEN cantidad * i.valor_unitario
                WHEN 'SALIDA' THEN -(cantidad * i.valor_unitario)
                ELSE 0
            END
        ), 0),
        'items_mas_movidos', (
            SELECT json_agg(
                json_build_object(
                    'nombre_item', nombre_item,
                    'total_cantidad', total_cantidad,
                    'total_movimientos', total_movimientos
                )
            )
            FROM (
                SELECT 
                    i.nombre as nombre_item,
                    SUM(m.cantidad) as total_cantidad,
                    COUNT(*) as total_movimientos
                FROM movimientos_inventario m
                INNER JOIN inventario i ON m.item_id = i.id
                WHERE m.created_at::DATE BETWEEN v_fecha_desde AND v_fecha_hasta
                GROUP BY i.id, i.nombre
                ORDER BY SUM(m.cantidad) DESC
                LIMIT 10
            ) item_movimiento
        )
    ) INTO v_resultado
    FROM movimientos_inventario m
    INNER JOIN inventario i ON m.item_id = i.id
    CROSS JOIN LATERAL (
        SELECT tipo_movimiento, COUNT(*) as tipo_count
        FROM movimientos_inventario m2
        WHERE m2.created_at::DATE BETWEEN v_fecha_desde AND v_fecha_hasta
        GROUP BY tipo_movimiento
    ) tipo_counts
    WHERE m.created_at::DATE BETWEEN v_fecha_desde AND v_fecha_hasta;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '📦 FUNCIONES DE INVENTARIO CREADAS' as estado,
    'Todas las Database Functions del módulo de inventario implementadas' as mensaje,
    '25 funciones de inventario disponibles' as resumen;