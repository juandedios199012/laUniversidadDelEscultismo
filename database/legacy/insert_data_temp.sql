-- Script temporal para insertar datos sin autenticación
-- Ejecutar en Supabase SQL Editor

-- Deshabilitar temporalmente RLS para insertar datos
ALTER TABLE inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario DISABLE ROW LEVEL SECURITY;

-- Insertar datos de ejemplo
INSERT INTO inventario (nombre, categoria, descripcion, cantidad, cantidad_minima, estado, ubicacion, costo) VALUES
('Carpa 4 personas', 'camping', 'Carpa impermeable para 4 personas, ideal para campamentos', 5, 2, 'disponible', 'Almacén Principal - Estante A', 150.00),
('Pañoleta Scout', 'ceremonial', 'Pañoleta oficial del grupo scout', 25, 10, 'disponible', 'Oficina - Armario', 15.00),
('Botiquín Primeros Auxilios', 'primeros_auxilios', 'Botiquín completo para emergencias', 1, 2, 'prestado', 'Con patrulla Águilas', 80.00),
('Balón de Fútbol', 'deportivo', 'Balón oficial para actividades deportivas', 3, 2, 'disponible', 'Almacén Deportivo', 45.00),
('Cuerdas dinámicas 10mm', 'material_scout', 'Cuerdas de escalada certificadas para actividades de altura', 8, 5, 'disponible', 'Almacén Secundario - Caja B3', 180.00),
('Cocina portátil a gas', 'camping', 'Cocina de dos hornillas con regulador de gas', 2, 1, 'mantenimiento', 'Taller', 85.00),
('Insignias de Ramas', 'ceremonial', 'Conjunto de insignias para diferentes ramas scout', 50, 20, 'disponible', 'Oficina - Cajón 1', 8.00),
('Kit de Supervivencia', 'material_scout', 'Kit básico de supervivencia para actividades outdoor', 4, 3, 'disponible', 'Almacén Principal - Estante B', 95.00);

-- Re-habilitar RLS
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;

-- Verificar que los datos se insertaron
SELECT nombre, categoria, cantidad, estado FROM inventario;