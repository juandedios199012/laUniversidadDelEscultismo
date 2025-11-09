-- ============================================
-- DATABASE FUNCTIONS PARA INVENTARIO (BUENAS PRÁCTICAS)
-- ============================================
-- Migrar la lógica de negocio del frontend a la base de datos

-- 1. Función para cambiar estado de inventario con validaciones completas
CREATE OR REPLACE FUNCTION cambiar_estado_inventario(
    p_item_id UUID,
    p_nuevo_estado TEXT,
    p_cantidad INTEGER DEFAULT 1,
    p_destinatario TEXT DEFAULT NULL,
    p_observaciones TEXT DEFAULT NULL,
    p_responsable TEXT DEFAULT 'system'
) RETURNS JSON AS $$
DECLARE
    v_item inventario%ROWTYPE;
    v_estado_anterior TEXT;
    v_movimiento_id UUID;
    v_tipo_movimiento TEXT;
    v_nueva_cantidad INTEGER;
BEGIN
    -- 1. Verificar que el item existe y obtener datos actuales
    SELECT * INTO v_item FROM inventario WHERE id = p_item_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item no encontrado');
    END IF;
    
    v_estado_anterior := v_item.estado;
    
    -- 2. Validar transición de estado
    IF v_estado_anterior = p_nuevo_estado THEN
        RETURN json_build_object('success', false, 'error', 'El item ya se encuentra en este estado');
    END IF;
    
    -- 3. Validar disponibilidad para préstamos
    IF p_nuevo_estado = 'prestado' THEN
        IF v_item.cantidad < p_cantidad THEN
            RETURN json_build_object('success', false, 'error', 'Stock insuficiente para préstamo');
        END IF;
        IF p_destinatario IS NULL OR trim(p_destinatario) = '' THEN
            RETURN json_build_object('success', false, 'error', 'Destinatario requerido para préstamos');
        END IF;
        v_tipo_movimiento := 'prestamo';
        v_nueva_cantidad := v_item.cantidad - p_cantidad;
    ELSIF p_nuevo_estado = 'disponible' AND v_estado_anterior = 'prestado' THEN
        v_tipo_movimiento := 'devolucion';
        v_nueva_cantidad := v_item.cantidad + p_cantidad;
    ELSIF p_nuevo_estado = 'mantenimiento' THEN
        v_tipo_movimiento := 'salida';
        v_nueva_cantidad := v_item.cantidad - p_cantidad;
    ELSIF p_nuevo_estado = 'baja' THEN
        v_tipo_movimiento := 'baja';
        v_nueva_cantidad := v_item.cantidad - p_cantidad;
    ELSIF p_nuevo_estado = 'perdido' THEN
        v_tipo_movimiento := 'salida';
        v_nueva_cantidad := v_item.cantidad - p_cantidad;
    ELSE
        v_nueva_cantidad := v_item.cantidad;
        v_tipo_movimiento := 'ajuste';
    END IF;
    
    -- Asegurar que la cantidad no sea negativa
    v_nueva_cantidad := GREATEST(0, v_nueva_cantidad);
    
    -- 4. Registrar movimiento
    INSERT INTO movimientos_inventario (
        item_id,
        tipo_movimiento,
        cantidad,
        cantidad_anterior,
        cantidad_nueva,
        responsable,
        destino,
        motivo,
        observaciones
    ) VALUES (
        p_item_id,
        v_tipo_movimiento,
        p_cantidad,
        v_item.cantidad,
        v_nueva_cantidad,
        p_responsable,
        p_destinatario,
        format('Cambio de estado: %s → %s', v_estado_anterior, p_nuevo_estado),
        p_observaciones
    ) RETURNING id INTO v_movimiento_id;
    
    -- 5. Actualizar item
    UPDATE inventario 
    SET 
        estado = p_nuevo_estado,
        cantidad = v_nueva_cantidad,
        updated_at = NOW()
    WHERE id = p_item_id;
    
    -- 6. Retornar resultado exitoso
    RETURN json_build_object(
        'success', true,
        'movimiento_id', v_movimiento_id,
        'estado_anterior', v_estado_anterior,
        'estado_nuevo', p_nuevo_estado,
        'cantidad_anterior', v_item.cantidad,
        'cantidad_nueva', v_nueva_cantidad,
        'mensaje', format('Estado cambiado de %s a %s exitosamente', v_estado_anterior, p_nuevo_estado)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', format('Error interno: %s', SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- 2. Función para registrar entrada de inventario
CREATE OR REPLACE FUNCTION registrar_entrada_inventario(
    p_item_id UUID,
    p_cantidad INTEGER,
    p_motivo TEXT DEFAULT 'Entrada de inventario',
    p_responsable TEXT DEFAULT 'system',
    p_observaciones TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_item inventario%ROWTYPE;
    v_nueva_cantidad INTEGER;
    v_movimiento_id UUID;
BEGIN
    -- Verificar item
    SELECT * INTO v_item FROM inventario WHERE id = p_item_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item no encontrado');
    END IF;
    
    IF p_cantidad <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'La cantidad debe ser mayor a cero');
    END IF;
    
    v_nueva_cantidad := v_item.cantidad + p_cantidad;
    
    -- Registrar movimiento
    INSERT INTO movimientos_inventario (
        item_id,
        tipo_movimiento,
        cantidad,
        cantidad_anterior,
        cantidad_nueva,
        responsable,
        motivo,
        observaciones
    ) VALUES (
        p_item_id,
        'entrada',
        p_cantidad,
        v_item.cantidad,
        v_nueva_cantidad,
        p_responsable,
        p_motivo,
        p_observaciones
    ) RETURNING id INTO v_movimiento_id;
    
    -- Actualizar inventario
    UPDATE inventario 
    SET 
        cantidad = v_nueva_cantidad,
        estado = CASE 
            WHEN estado = 'agotado' AND v_nueva_cantidad > 0 THEN 'disponible'
            ELSE estado 
        END,
        updated_at = NOW()
    WHERE id = p_item_id;
    
    RETURN json_build_object(
        'success', true,
        'movimiento_id', v_movimiento_id,
        'cantidad_anterior', v_item.cantidad,
        'cantidad_nueva', v_nueva_cantidad
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 3. Función para registrar salida de inventario
CREATE OR REPLACE FUNCTION registrar_salida_inventario(
    p_item_id UUID,
    p_cantidad INTEGER,
    p_motivo TEXT DEFAULT 'Salida de inventario',
    p_responsable TEXT DEFAULT 'system',
    p_observaciones TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_item inventario%ROWTYPE;
    v_nueva_cantidad INTEGER;
    v_movimiento_id UUID;
BEGIN
    -- Verificar item
    SELECT * INTO v_item FROM inventario WHERE id = p_item_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item no encontrado');
    END IF;
    
    IF p_cantidad <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'La cantidad debe ser mayor a cero');
    END IF;
    
    IF v_item.cantidad < p_cantidad THEN
        RETURN json_build_object('success', false, 'error', 'Stock insuficiente');
    END IF;
    
    v_nueva_cantidad := v_item.cantidad - p_cantidad;
    
    -- Registrar movimiento
    INSERT INTO movimientos_inventario (
        item_id,
        tipo_movimiento,
        cantidad,
        cantidad_anterior,
        cantidad_nueva,
        responsable,
        motivo,
        observaciones
    ) VALUES (
        p_item_id,
        'salida',
        p_cantidad,
        v_item.cantidad,
        v_nueva_cantidad,
        p_responsable,
        p_motivo,
        p_observaciones
    ) RETURNING id INTO v_movimiento_id;
    
    -- Actualizar inventario
    UPDATE inventario 
    SET 
        cantidad = v_nueva_cantidad,
        estado = CASE 
            WHEN v_nueva_cantidad = 0 THEN 'agotado'
            ELSE estado 
        END,
        updated_at = NOW()
    WHERE id = p_item_id;
    
    RETURN json_build_object(
        'success', true,
        'movimiento_id', v_movimiento_id,
        'cantidad_anterior', v_item.cantidad,
        'cantidad_nueva', v_nueva_cantidad
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 4. Función para obtener reporte de inventario
CREATE OR REPLACE FUNCTION generar_reporte_inventario(
    p_categoria TEXT DEFAULT NULL,
    p_estado TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_total_items INTEGER := 0;
    v_valor_total DECIMAL(10,2) := 0;
    v_items_bajo_stock INTEGER := 0;
    v_items_por_categoria JSON;
    v_items_por_estado JSON;
    v_items_criticos JSON;
BEGIN
    -- Total de items
    SELECT COUNT(*), COALESCE(SUM(cantidad * COALESCE(costo, 0)), 0)
    INTO v_total_items, v_valor_total
    FROM inventario
    WHERE (p_categoria IS NULL OR categoria = p_categoria)
    AND (p_estado IS NULL OR estado = p_estado);
    
    -- Items bajo stock
    SELECT COUNT(*)
    INTO v_items_bajo_stock
    FROM inventario
    WHERE cantidad <= cantidad_minima
    AND (p_categoria IS NULL OR categoria = p_categoria)
    AND (p_estado IS NULL OR estado = p_estado);
    
    -- Distribución por categoría
    SELECT json_object_agg(categoria, total)
    INTO v_items_por_categoria
    FROM (
        SELECT categoria, COUNT(*) as total
        FROM inventario
        WHERE (p_categoria IS NULL OR categoria = p_categoria)
        AND (p_estado IS NULL OR estado = p_estado)
        GROUP BY categoria
    ) t;
    
    -- Distribución por estado
    SELECT json_object_agg(estado, total)
    INTO v_items_por_estado
    FROM (
        SELECT estado, COUNT(*) as total
        FROM inventario
        WHERE (p_categoria IS NULL OR categoria = p_categoria)
        AND (p_estado IS NULL OR estado = p_estado)
        GROUP BY estado
    ) t;
    
    -- Items críticos (bajo stock)
    SELECT json_agg(row_to_json(t))
    INTO v_items_criticos
    FROM (
        SELECT id, nombre, categoria, cantidad, cantidad_minima, ubicacion
        FROM inventario
        WHERE cantidad <= cantidad_minima
        AND (p_categoria IS NULL OR categoria = p_categoria)
        AND (p_estado IS NULL OR estado = p_estado)
        ORDER BY (cantidad::float / NULLIF(cantidad_minima, 0)) ASC
        LIMIT 10
    ) t;
    
    RETURN json_build_object(
        'resumen', json_build_object(
            'total_items', v_total_items,
            'valor_total', v_valor_total,
            'items_bajo_stock', v_items_bajo_stock,
            'porcentaje_bajo_stock', 
                CASE WHEN v_total_items > 0 
                     THEN ROUND((v_items_bajo_stock::float / v_total_items) * 100, 2)
                     ELSE 0 
                END
        ),
        'distribucion_categoria', COALESCE(v_items_por_categoria, '{}'::json),
        'distribucion_estado', COALESCE(v_items_por_estado, '{}'::json),
        'items_criticos', COALESCE(v_items_criticos, '[]'::json),
        'fecha_reporte', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- 5. Función para obtener historial detallado de un item
CREATE OR REPLACE FUNCTION obtener_historial_item(p_item_id UUID)
RETURNS JSON AS $$
DECLARE
    v_item inventario%ROWTYPE;
    v_movimientos JSON;
    v_stats JSON;
BEGIN
    -- Obtener datos del item
    SELECT * INTO v_item FROM inventario WHERE id = p_item_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Item no encontrado');
    END IF;
    
    -- Obtener movimientos
    SELECT json_agg(
        json_build_object(
            'id', id,
            'tipo_movimiento', tipo_movimiento,
            'cantidad', cantidad,
            'cantidad_anterior', cantidad_anterior,
            'cantidad_nueva', cantidad_nueva,
            'responsable', responsable,
            'destino', destino,
            'motivo', motivo,
            'observaciones', observaciones,
            'fecha_movimiento', fecha_movimiento,
            'created_at', created_at
        ) ORDER BY fecha_movimiento DESC
    )
    INTO v_movimientos
    FROM movimientos_inventario
    WHERE item_id = p_item_id;
    
    -- Estadísticas del item
    SELECT json_build_object(
        'total_movimientos', COUNT(*),
        'total_entradas', SUM(CASE WHEN tipo_movimiento IN ('entrada', 'devolucion') THEN cantidad ELSE 0 END),
        'total_salidas', SUM(CASE WHEN tipo_movimiento IN ('salida', 'prestamo', 'baja') THEN cantidad ELSE 0 END),
        'ultimo_movimiento', MAX(fecha_movimiento)
    )
    INTO v_stats
    FROM movimientos_inventario
    WHERE item_id = p_item_id;
    
    RETURN json_build_object(
        'item', row_to_json(v_item),
        'movimientos', COALESCE(v_movimientos, '[]'::json),
        'estadisticas', COALESCE(v_stats, '{}'::json)
    );
END;
$$ LANGUAGE plpgsql;