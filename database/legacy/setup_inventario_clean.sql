-- ============================================
-- ESQUEMA DE BASE DE DATOS PARA INVENTARIO SCOUT - VERSIÓN FINAL LIMPIA
-- ============================================
-- Este script maneja automáticamente conflictos con datos existentes

-- ============================================
-- PASO 1: LIMPIEZA COMPLETA (Seguro)
-- ============================================

-- Eliminar funciones que podrían conflictuar
DROP FUNCTION IF EXISTS get_items_stock_bajo() CASCADE;
DROP FUNCTION IF EXISTS get_historial_item(UUID) CASCADE;  
DROP FUNCTION IF EXISTS registrar_movimiento_inventario(UUID, VARCHAR, INTEGER, VARCHAR, TEXT, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS verificar_inventario_setup() CASCADE;

-- Eliminar vistas
DROP VIEW IF EXISTS estadisticas_inventario CASCADE;

-- Eliminar políticas RLS existentes
DO $$
BEGIN
    -- Intentar eliminar políticas sin fallar si no existen
    DROP POLICY IF EXISTS "Permitir lectura inventario" ON inventario;
    DROP POLICY IF EXISTS "Permitir lectura movimientos" ON movimientos_inventario;
    DROP POLICY IF EXISTS "Permitir escritura inventario" ON inventario;
    DROP POLICY IF EXISTS "Permitir escritura movimientos" ON movimientos_inventario;
    DROP POLICY IF EXISTS "Acceso completo inventario" ON inventario;
    DROP POLICY IF EXISTS "Acceso completo movimientos" ON movimientos_inventario;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignorar errores si las tablas no existen aún
        NULL;
END $$;

-- ============================================
-- PASO 2: FUNCIÓN DE UTILIDAD
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASO 3: CREAR TABLAS
-- ============================================

-- Tabla de inventario
CREATE TABLE IF NOT EXISTS inventario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
        'material_scout',
        'camping', 
        'ceremonial',
        'deportivo',
        'primeros_auxilios',
        'administrativo'
    )),
    descripcion TEXT,
    cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    cantidad_minima INTEGER NOT NULL DEFAULT 1 CHECK (cantidad_minima >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible' CHECK (estado IN (
        'disponible',
        'prestado',
        'mantenimiento',
        'perdido',
        'baja'
    )),
    ubicacion VARCHAR(255),
    costo DECIMAL(10,2) DEFAULT 0 CHECK (costo >= 0),
    proveedor VARCHAR(255),
    fecha_adquisicion DATE,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN (
        'entrada',
        'salida',
        'prestamo',
        'devolucion',
        'baja',
        'ajuste'
    )),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    cantidad_anterior INTEGER NOT NULL DEFAULT 0,
    cantidad_nueva INTEGER NOT NULL DEFAULT 0,
    responsable VARCHAR(255),
    destino VARCHAR(255), -- Para préstamos: a quién se presta
    motivo TEXT,
    fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PASO 4: ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_inventario_categoria ON inventario(categoria);
CREATE INDEX IF NOT EXISTS idx_inventario_estado ON inventario(estado);
CREATE INDEX IF NOT EXISTS idx_inventario_nombre ON inventario(nombre);
CREATE INDEX IF NOT EXISTS idx_movimientos_item_id ON movimientos_inventario(item_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_inventario(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_inventario(tipo_movimiento);

-- ============================================
-- PASO 5: TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_inventario_updated_at ON inventario;
CREATE TRIGGER update_inventario_updated_at
    BEFORE UPDATE ON inventario
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PASO 6: DATOS INICIALES (Solo si está vacío)
-- ============================================

DO $$
BEGIN
    -- Solo insertar si la tabla está completamente vacía
    IF NOT EXISTS (SELECT 1 FROM inventario LIMIT 1) THEN
        INSERT INTO inventario (nombre, categoria, descripcion, cantidad, cantidad_minima, estado, ubicacion, costo, fecha_adquisicion) VALUES
        ('Carpa 4 personas', 'camping', 'Carpa impermeable para 4 personas, ideal para campamentos', 5, 2, 'disponible', 'Almacén Principal - Estante A', 150.00, CURRENT_DATE),
        ('Pañoleta Scout', 'ceremonial', 'Pañoleta oficial del grupo scout', 25, 10, 'disponible', 'Oficina - Armario', 15.00, CURRENT_DATE),
        ('Botiquín Primeros Auxilios', 'primeros_auxilios', 'Botiquín completo para emergencias', 3, 2, 'disponible', 'Almacén Principal', 80.00, CURRENT_DATE),
        ('Balón de Fútbol', 'deportivo', 'Balón oficial para actividades deportivas', 3, 2, 'disponible', 'Almacén Deportivo', 45.00, CURRENT_DATE),
        ('Cuerdas dinámicas 10mm', 'material_scout', 'Cuerdas de escalada certificadas para actividades de altura', 8, 5, 'disponible', 'Almacén Secundario - Caja B3', 180.00, CURRENT_DATE),
        ('Cocina portátil a gas', 'camping', 'Cocina de dos hornillas con regulador de gas', 2, 1, 'disponible', 'Almacén Principal', 85.00, CURRENT_DATE),
        ('Insignias de Ramas', 'ceremonial', 'Conjunto de insignias para diferentes ramas scout', 50, 20, 'disponible', 'Oficina - Cajón 1', 8.00, CURRENT_DATE),
        ('Kit de Supervivencia', 'material_scout', 'Kit básico de supervivencia para actividades outdoor', 4, 3, 'disponible', 'Almacén Principal - Estante B', 95.00, CURRENT_DATE);
        
        RAISE NOTICE 'Datos de inventario insertados exitosamente (8 items)';
    ELSE
        RAISE NOTICE 'La tabla inventario ya contiene datos, omitiendo inserción inicial';
    END IF;
END $$;

-- ============================================
-- PASO 7: MOVIMIENTOS INICIALES
-- ============================================

DO $$
DECLARE
    item_record RECORD;
    contador INTEGER := 0;
BEGIN
    -- Crear movimientos de entrada inicial solo para items sin movimientos
    FOR item_record IN 
        SELECT i.id, i.cantidad, i.nombre
        FROM inventario i 
        WHERE i.cantidad > 0 
        AND NOT EXISTS (
            SELECT 1 FROM movimientos_inventario m 
            WHERE m.item_id = i.id
        )
    LOOP
        INSERT INTO movimientos_inventario (
            item_id, 
            tipo_movimiento, 
            cantidad, 
            cantidad_anterior, 
            cantidad_nueva, 
            responsable, 
            motivo
        ) VALUES (
            item_record.id,
            'entrada',
            item_record.cantidad,
            0,
            item_record.cantidad,
            'Sistema',
            'Stock inicial - ' || item_record.nombre
        );
        
        contador := contador + 1;
    END LOOP;
    
    IF contador > 0 THEN
        RAISE NOTICE 'Movimientos iniciales creados: % registros', contador;
    ELSE
        RAISE NOTICE 'No se crearon movimientos iniciales (ya existen o no hay items)';
    END IF;
END $$;

-- ============================================
-- PASO 8: ROW LEVEL SECURITY
-- ============================================

-- Habilitar RLS
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;

-- Crear políticas simples
CREATE POLICY "inventario_full_access" ON inventario
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "movimientos_full_access" ON movimientos_inventario
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- PASO 9: VISTAS Y FUNCIONES
-- ============================================

-- Vista de estadísticas
CREATE VIEW estadisticas_inventario AS
SELECT 
    COUNT(*) as total_items,
    COUNT(*) FILTER (WHERE estado = 'disponible') as disponibles,
    COUNT(*) FILTER (WHERE estado = 'prestado') as prestados,
    COUNT(*) FILTER (WHERE estado = 'mantenimiento') as en_mantenimiento,
    COUNT(*) FILTER (WHERE estado = 'perdido') as perdidos,
    COUNT(*) FILTER (WHERE estado = 'baja') as dados_baja,
    COUNT(*) FILTER (WHERE cantidad <= cantidad_minima) as stock_bajo,
    COALESCE(SUM(costo * cantidad), 0) as valor_total,
    COUNT(DISTINCT categoria) as categorias_activas
FROM inventario;

-- Función para items con stock bajo
CREATE FUNCTION get_items_stock_bajo()
RETURNS TABLE (
    id UUID,
    nombre VARCHAR,
    categoria VARCHAR,
    cantidad INTEGER,
    cantidad_minima INTEGER,
    ubicacion VARCHAR,
    porcentaje_stock DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.nombre,
        i.categoria,
        i.cantidad,
        i.cantidad_minima,
        i.ubicacion,
        CASE 
            WHEN i.cantidad_minima > 0 THEN 
                ROUND((i.cantidad::DECIMAL / i.cantidad_minima * 100), 2)
            ELSE 100.00
        END as porcentaje_stock
    FROM inventario i
    WHERE i.cantidad <= i.cantidad_minima
    AND i.estado IN ('disponible', 'prestado')
    ORDER BY (i.cantidad::FLOAT / NULLIF(i.cantidad_minima, 0)) ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Función para historial de item
CREATE FUNCTION get_historial_item(item_uuid UUID)
RETURNS TABLE (
    fecha TIMESTAMP WITH TIME ZONE,
    tipo VARCHAR,
    cantidad INTEGER,
    cantidad_anterior INTEGER,
    cantidad_nueva INTEGER,
    responsable VARCHAR,
    motivo TEXT,
    destino VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.fecha_movimiento,
        m.tipo_movimiento,
        m.cantidad,
        m.cantidad_anterior,
        m.cantidad_nueva,
        m.responsable,
        m.motivo,
        m.destino
    FROM movimientos_inventario m
    WHERE m.item_id = item_uuid
    ORDER BY m.fecha_movimiento DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar movimientos
CREATE FUNCTION registrar_movimiento_inventario(
    p_item_id UUID,
    p_tipo_movimiento VARCHAR,
    p_cantidad INTEGER,
    p_responsable VARCHAR,
    p_motivo TEXT DEFAULT NULL,
    p_destino VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_cantidad_actual INTEGER;
    v_nueva_cantidad INTEGER;
    v_movimiento_id UUID;
BEGIN
    -- Obtener cantidad actual
    SELECT cantidad INTO v_cantidad_actual 
    FROM inventario 
    WHERE id = p_item_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Item no encontrado'
        );
    END IF;
    
    -- Calcular nueva cantidad
    CASE p_tipo_movimiento
        WHEN 'entrada', 'devolucion' THEN
            v_nueva_cantidad := v_cantidad_actual + p_cantidad;
        WHEN 'salida', 'prestamo', 'baja' THEN
            v_nueva_cantidad := v_cantidad_actual - p_cantidad;
        WHEN 'ajuste' THEN
            v_nueva_cantidad := p_cantidad; -- Ajuste directo
        ELSE
            RETURN json_build_object(
                'success', false,
                'message', 'Tipo de movimiento no válido'
            );
    END CASE;
    
    -- Validar stock suficiente
    IF v_nueva_cantidad < 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No hay suficiente stock disponible'
        );
    END IF;
    
    -- Registrar movimiento
    INSERT INTO movimientos_inventario (
        item_id, tipo_movimiento, cantidad, cantidad_anterior, 
        cantidad_nueva, responsable, motivo, destino
    ) VALUES (
        p_item_id, p_tipo_movimiento, p_cantidad, v_cantidad_actual,
        v_nueva_cantidad, p_responsable, p_motivo, p_destino
    ) RETURNING id INTO v_movimiento_id;
    
    -- Actualizar inventario
    UPDATE inventario 
    SET cantidad = v_nueva_cantidad, updated_at = NOW()
    WHERE id = p_item_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Movimiento registrado exitosamente',
        'movimiento_id', v_movimiento_id,
        'cantidad_anterior', v_cantidad_actual,
        'cantidad_nueva', v_nueva_cantidad
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASO 10: VERIFICACIÓN FINAL
-- ============================================

CREATE FUNCTION verificar_inventario_setup()
RETURNS TEXT AS $$
DECLARE
    v_items INTEGER;
    v_movimientos INTEGER;
    v_categorias INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_items FROM inventario;
    SELECT COUNT(*) INTO v_movimientos FROM movimientos_inventario;
    SELECT COUNT(DISTINCT categoria) INTO v_categorias FROM inventario;
    
    RETURN 'INVENTARIO SCOUT - SETUP COMPLETADO' || chr(10) ||
           '=================================' || chr(10) ||
           '✅ Items en inventario: ' || v_items || chr(10) ||
           '✅ Movimientos registrados: ' || v_movimientos || chr(10) ||
           '✅ Categorías activas: ' || v_categorias || chr(10) ||
           '✅ Tablas: inventario, movimientos_inventario' || chr(10) ||
           '✅ Vista: estadisticas_inventario' || chr(10) ||
           '✅ Funciones: 3 funciones de gestión' || chr(10) ||
           '✅ RLS habilitado con políticas básicas' || chr(10) ||
           chr(10) ||
           'Sistema listo para usar! 🎯';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar verificación automática
SELECT verificar_inventario_setup() as resultado_setup;

-- ============================================
-- CONSULTAS DE PRUEBA INCLUIDAS:
-- ============================================

-- Ver todos los items
-- SELECT * FROM inventario ORDER BY categoria, nombre;

-- Ver estadísticas
-- SELECT * FROM estadisticas_inventario;

-- Ver items con stock bajo
-- SELECT * FROM get_items_stock_bajo();

-- Ejemplo de movimiento:
-- SELECT registrar_movimiento_inventario(
--     (SELECT id FROM inventario LIMIT 1),
--     'salida', 
--     1, 
--     'Juan Pérez', 
--     'Préstamo para actividad'
-- );