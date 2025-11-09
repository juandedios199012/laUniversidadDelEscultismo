-- ============================================
-- ESQUEMA DE BASE DE DATOS PARA INVENTARIO SCOUT
-- ============================================
-- Ejecutar este script en la sección SQL de Supabase
-- para crear las tablas necesarias para el inventario

-- 1. Crear tabla de inventario
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

-- 2. Crear tabla de movimientos de inventario
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

-- 3. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_inventario_categoria ON inventario(categoria);
CREATE INDEX IF NOT EXISTS idx_inventario_estado ON inventario(estado);
CREATE INDEX IF NOT EXISTS idx_inventario_nombre ON inventario(nombre);
CREATE INDEX IF NOT EXISTS idx_movimientos_item_id ON movimientos_inventario(item_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_inventario(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_inventario(tipo_movimiento);

-- 4. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Crear trigger para inventario
DROP TRIGGER IF EXISTS update_inventario_updated_at ON inventario;
CREATE TRIGGER update_inventario_updated_at
    BEFORE UPDATE ON inventario
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Insertar datos de ejemplo
INSERT INTO inventario (nombre, categoria, descripcion, cantidad, cantidad_minima, estado, ubicacion, costo) VALUES
('Carpa 4 personas', 'camping', 'Carpa impermeable para 4 personas, ideal para campamentos', 5, 2, 'disponible', 'Almacén Principal - Estante A', 150.00),
('Pañoleta Scout', 'ceremonial', 'Pañoleta oficial del grupo scout', 25, 10, 'disponible', 'Oficina - Armario', 15.00),
('Botiquín Primeros Auxilios', 'primeros_auxilios', 'Botiquín completo para emergencias', 1, 2, 'prestado', 'Con patrulla Águilas', 80.00),
('Balón de Fútbol', 'deportivo', 'Balón oficial para actividades deportivas', 3, 2, 'disponible', 'Almacén Deportivo', 45.00),
('Cuerdas dinámicas 10mm', 'material_scout', 'Cuerdas de escalada certificadas para actividades de altura', 8, 5, 'disponible', 'Almacén Secundario - Caja B3', 180.00),
('Cocina portátil a gas', 'camping', 'Cocina de dos hornillas con regulador de gas', 2, 1, 'mantenimiento', 'Taller', 85.00),
('Insignias de Ramas', 'ceremonial', 'Conjunto de insignias para diferentes ramas scout', 50, 20, 'disponible', 'Oficina - Cajón 1', 8.00),
('Kit de Supervivencia', 'material_scout', 'Kit básico de supervivencia para actividades outdoor', 4, 3, 'disponible', 'Almacén Principal - Estante B', 95.00);

-- 7. Insertar algunos movimientos de ejemplo (solo si no existen datos previos)
INSERT INTO movimientos_inventario (item_id, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, responsable, motivo) 
SELECT 
    i.id,
    'entrada',
    i.cantidad,
    0,
    i.cantidad,
    'Administrador',
    'Stock inicial'
FROM inventario i
WHERE i.cantidad > 0 
AND NOT EXISTS (
    SELECT 1 FROM movimientos_inventario m 
    WHERE m.item_id = i.id AND m.tipo_movimiento = 'entrada' AND m.motivo = 'Stock inicial'
);

-- 8. Configurar políticas de seguridad (Row Level Security)
-- IMPORTANTE: Ajustar según las necesidades de autenticación

-- Habilitar RLS en las tablas
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Permitir lectura inventario" ON inventario
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Permitir lectura movimientos" ON movimientos_inventario
    FOR SELECT TO authenticated
    USING (true);

-- Política para permitir escritura a usuarios autenticados
CREATE POLICY "Permitir escritura inventario" ON inventario
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir escritura movimientos" ON movimientos_inventario
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- 9. Crear vista para estadísticas rápidas
CREATE OR REPLACE VIEW estadisticas_inventario AS
SELECT 
    COUNT(*) as total_items,
    COUNT(*) FILTER (WHERE estado = 'disponible') as disponibles,
    COUNT(*) FILTER (WHERE estado = 'prestado') as prestados,
    COUNT(*) FILTER (WHERE estado = 'mantenimiento') as en_mantenimiento,
    COUNT(*) FILTER (WHERE cantidad <= cantidad_minima) as stock_bajo,
    SUM(costo * cantidad) as valor_total,
    COUNT(DISTINCT categoria) as categorias_activas
FROM inventario;

-- 10. Crear función para obtener items con stock bajo
CREATE OR REPLACE FUNCTION get_items_stock_bajo()
RETURNS TABLE (
    id UUID,
    nombre VARCHAR,
    categoria VARCHAR,
    cantidad INTEGER,
    cantidad_minima INTEGER,
    ubicacion VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.nombre,
        i.categoria,
        i.cantidad,
        i.cantidad_minima,
        i.ubicacion
    FROM inventario i
    WHERE i.cantidad <= i.cantidad_minima
    ORDER BY (i.cantidad::FLOAT / i.cantidad_minima) ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INSTRUCCIONES DE USO:
-- ============================================
-- 1. Copia este script completo
-- 2. Ve a tu proyecto de Supabase → SQL Editor
-- 3. Pega el script y ejecuta "Run"
-- 4. Verifica que las tablas se crearon correctamente en Database → Tables
-- 5. Las políticas RLS están configuradas para usuarios autenticados
-- 6. Modifica las variables de entorno en tu .env.local con las credenciales reales de Supabase

-- CONSULTAS DE VERIFICACIÓN:
-- SELECT * FROM inventario;
-- SELECT * FROM movimientos_inventario;
-- SELECT * FROM estadisticas_inventario;
-- SELECT * FROM get_items_stock_bajo();