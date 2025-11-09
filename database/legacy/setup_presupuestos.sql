-- ============================================
-- ESQUEMA DE BASE DE DATOS PARA PRESUPUESTOS DE CAMPAMENTOS
-- ============================================

-- 1. Crear tabla de campamentos
CREATE TABLE IF NOT EXISTS campamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    lugar VARCHAR(255),
    estado VARCHAR(20) NOT NULL DEFAULT 'planificacion' CHECK (estado IN (
        'planificacion',
        'activo',
        'finalizado',
        'cancelado'
    )),
    responsable VARCHAR(255),
    presupuesto_estimado DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de participantes de campamento
CREATE TABLE IF NOT EXISTS participantes_campamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campamento_id UUID NOT NULL REFERENCES campamentos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    tipo_participante VARCHAR(20) NOT NULL CHECK (tipo_participante IN (
        'joven',      -- Paga 35
        'adulto'      -- Paga 45
    )),
    cargo VARCHAR(100),
    rama VARCHAR(50),
    telefono VARCHAR(20),
    email VARCHAR(255),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de gastos de campamento
CREATE TABLE IF NOT EXISTS gastos_campamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campamento_id UUID NOT NULL REFERENCES campamentos(id) ON DELETE CASCADE,
    concepto VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
        'movilidad',
        'alimentacion',
        'alojamiento',
        'materiales',
        'equipamiento',
        'servicios',
        'emergencias',
        'otros'
    )),
    monto_total DECIMAL(10,2) NOT NULL CHECK (monto_total > 0),
    descripcion TEXT,
    fecha_gasto DATE DEFAULT CURRENT_DATE,
    proveedor VARCHAR(255),
    numero_factura VARCHAR(100),
    responsable_pago VARCHAR(255),
    estado_pago VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_pago IN (
        'pendiente',
        'pagado',
        'parcial'
    )),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla de detalle de pagos por participante
CREATE TABLE IF NOT EXISTS pagos_participantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campamento_id UUID NOT NULL REFERENCES campamentos(id) ON DELETE CASCADE,
    participante_id UUID NOT NULL REFERENCES participantes_campamento(id) ON DELETE CASCADE,
    monto_pagado DECIMAL(10,2) NOT NULL CHECK (monto_pagado >= 0),
    fecha_pago DATE DEFAULT CURRENT_DATE,
    metodo_pago VARCHAR(50) DEFAULT 'efectivo' CHECK (metodo_pago IN (
        'efectivo',
        'transferencia',
        'tarjeta',
        'yape',
        'plin'
    )),
    cobrado_por VARCHAR(255),
    numero_recibo VARCHAR(100),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear tabla de ingresos adicionales
CREATE TABLE IF NOT EXISTS ingresos_adicionales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campamento_id UUID NOT NULL REFERENCES campamentos(id) ON DELETE CASCADE,
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    descripcion TEXT,
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    responsable VARCHAR(255),
    tipo_ingreso VARCHAR(50) DEFAULT 'donacion' CHECK (tipo_ingreso IN (
        'donacion',
        'patrocinio',
        'venta',
        'actividad_fondos',
        'subsidio',
        'otros'
    )),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_campamentos_fecha ON campamentos(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_campamentos_estado ON campamentos(estado);
CREATE INDEX IF NOT EXISTS idx_participantes_campamento ON participantes_campamento(campamento_id);
CREATE INDEX IF NOT EXISTS idx_participantes_tipo ON participantes_campamento(tipo_participante);
CREATE INDEX IF NOT EXISTS idx_gastos_campamento ON gastos_campamento(campamento_id);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos_campamento(categoria);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos_campamento(fecha_gasto);
CREATE INDEX IF NOT EXISTS idx_pagos_campamento ON pagos_participantes(campamento_id);
CREATE INDEX IF NOT EXISTS idx_pagos_participante ON pagos_participantes(participante_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_campamento ON ingresos_adicionales(campamento_id);

-- 7. Crear trigger para updated_at en campamentos
CREATE TRIGGER update_campamentos_updated_at
    BEFORE UPDATE ON campamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. ============= FUNCIONES DE NEGOCIO =============

-- Función para calcular tarifa por participante
CREATE OR REPLACE FUNCTION calcular_tarifa_participante(tipo_participante TEXT)
RETURNS DECIMAL AS $$
BEGIN
    CASE tipo_participante
        WHEN 'joven' THEN RETURN 35.00;
        WHEN 'adulto' THEN RETURN 45.00;
        ELSE RETURN 0.00;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular ingresos esperados de un campamento
CREATE OR REPLACE FUNCTION calcular_ingresos_esperados(p_campamento_id UUID)
RETURNS JSON AS $$
DECLARE
    v_jovenes INTEGER := 0;
    v_adultos INTEGER := 0;
    v_ingresos_participantes DECIMAL(10,2) := 0;
    v_ingresos_adicionales DECIMAL(10,2) := 0;
    v_total_esperado DECIMAL(10,2) := 0;
BEGIN
    -- Contar participantes por tipo
    SELECT 
        COUNT(CASE WHEN tipo_participante = 'joven' THEN 1 END),
        COUNT(CASE WHEN tipo_participante = 'adulto' THEN 1 END)
    INTO v_jovenes, v_adultos
    FROM participantes_campamento 
    WHERE campamento_id = p_campamento_id;
    
    -- Calcular ingresos por participantes
    v_ingresos_participantes := (v_jovenes * 35.00) + (v_adultos * 45.00);
    
    -- Sumar ingresos adicionales
    SELECT COALESCE(SUM(monto), 0)
    INTO v_ingresos_adicionales
    FROM ingresos_adicionales
    WHERE campamento_id = p_campamento_id;
    
    v_total_esperado := v_ingresos_participantes + v_ingresos_adicionales;
    
    RETURN json_build_object(
        'jovenes', v_jovenes,
        'adultos', v_adultos,
        'ingresos_participantes', v_ingresos_participantes,
        'ingresos_adicionales', v_ingresos_adicionales,
        'total_esperado', v_total_esperado,
        'tarifa_joven', 35.00,
        'tarifa_adulto', 45.00
    );
END;
$$ LANGUAGE plpgsql;

-- Función para calcular gastos totales de un campamento
CREATE OR REPLACE FUNCTION calcular_gastos_campamento(p_campamento_id UUID)
RETURNS JSON AS $$
DECLARE
    v_total_gastos DECIMAL(10,2) := 0;
    v_gastos_por_categoria JSON;
    v_gastos_pendientes DECIMAL(10,2) := 0;
BEGIN
    -- Total de gastos
    SELECT COALESCE(SUM(monto_total), 0)
    INTO v_total_gastos
    FROM gastos_campamento
    WHERE campamento_id = p_campamento_id;
    
    -- Gastos pendientes de pago
    SELECT COALESCE(SUM(monto_total), 0)
    INTO v_gastos_pendientes
    FROM gastos_campamento
    WHERE campamento_id = p_campamento_id 
    AND estado_pago IN ('pendiente', 'parcial');
    
    -- Gastos por categoría
    SELECT json_object_agg(categoria, total_categoria)
    INTO v_gastos_por_categoria
    FROM (
        SELECT categoria, SUM(monto_total) as total_categoria
        FROM gastos_campamento
        WHERE campamento_id = p_campamento_id
        GROUP BY categoria
    ) t;
    
    RETURN json_build_object(
        'total_gastos', v_total_gastos,
        'gastos_pendientes', v_gastos_pendientes,
        'gastos_por_categoria', COALESCE(v_gastos_por_categoria, '{}'::json)
    );
END;
$$ LANGUAGE plpgsql;

-- Función para generar reporte financiero completo
CREATE OR REPLACE FUNCTION generar_reporte_financiero(p_campamento_id UUID)
RETURNS JSON AS $$
DECLARE
    v_campamento campamentos%ROWTYPE;
    v_ingresos JSON;
    v_gastos JSON;
    v_balance DECIMAL(10,2);
    v_pagos_recibidos DECIMAL(10,2) := 0;
BEGIN
    -- Obtener datos del campamento
    SELECT * INTO v_campamento FROM campamentos WHERE id = p_campamento_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Campamento no encontrado');
    END IF;
    
    -- Calcular ingresos
    SELECT calcular_ingresos_esperados(p_campamento_id) INTO v_ingresos;
    
    -- Calcular gastos
    SELECT calcular_gastos_campamento(p_campamento_id) INTO v_gastos;
    
    -- Calcular pagos realmente recibidos
    SELECT COALESCE(SUM(monto_pagado), 0)
    INTO v_pagos_recibidos
    FROM pagos_participantes
    WHERE campamento_id = p_campamento_id;
    
    -- Balance final
    v_balance := (v_ingresos->>'total_esperado')::DECIMAL - (v_gastos->>'total_gastos')::DECIMAL;
    
    RETURN json_build_object(
        'campamento', row_to_json(v_campamento),
        'ingresos', v_ingresos,
        'gastos', v_gastos,
        'pagos_recibidos', v_pagos_recibidos,
        'balance_proyectado', v_balance,
        'balance_real', v_pagos_recibidos - (v_gastos->>'total_gastos')::DECIMAL,
        'fecha_reporte', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Función para registrar gasto con validaciones
CREATE OR REPLACE FUNCTION registrar_gasto_campamento(
    p_campamento_id UUID,
    p_concepto TEXT,
    p_categoria TEXT,
    p_monto DECIMAL,
    p_descripcion TEXT DEFAULT NULL,
    p_proveedor TEXT DEFAULT NULL,
    p_responsable TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_gasto_id UUID;
    v_nuevo_total DECIMAL;
BEGIN
    -- Validar que el campamento existe
    IF NOT EXISTS (SELECT 1 FROM campamentos WHERE id = p_campamento_id) THEN
        RETURN json_build_object('success', false, 'error', 'Campamento no encontrado');
    END IF;
    
    -- Insertar gasto
    INSERT INTO gastos_campamento (
        campamento_id, concepto, categoria, monto_total, 
        descripcion, proveedor, responsable_pago
    ) VALUES (
        p_campamento_id, p_concepto, p_categoria, p_monto,
        p_descripcion, p_proveedor, p_responsable
    ) RETURNING id INTO v_gasto_id;
    
    -- Calcular nuevo total de gastos
    SELECT SUM(monto_total) INTO v_nuevo_total
    FROM gastos_campamento 
    WHERE campamento_id = p_campamento_id;
    
    RETURN json_build_object(
        'success', true,
        'gasto_id', v_gasto_id,
        'nuevo_total_gastos', v_nuevo_total
    );
END;
$$ LANGUAGE plpgsql;

-- 9. Insertar datos de ejemplo
INSERT INTO campamentos (nombre, descripcion, fecha_inicio, fecha_fin, lugar, responsable, presupuesto_estimado) VALUES
('Campamento de Verano 2025', 'Campamento anual de verano para todas las ramas', '2025-01-15', '2025-01-20', 'Lunahuaná', 'Juan Pérez', 2500.00),
('Campamento de Invierno 2025', 'Campamento de invierno especializado en supervivencia', '2025-07-15', '2025-07-18', 'Huacachina', 'María González', 1800.00);

-- Insertar participantes de ejemplo para el primer campamento
DO $$
DECLARE
    v_campamento_id UUID;
BEGIN
    SELECT id INTO v_campamento_id FROM campamentos WHERE nombre = 'Campamento de Verano 2025';
    
    -- Jóvenes participantes (29 según tu ejemplo)
    INSERT INTO participantes_campamento (campamento_id, nombre, apellido, tipo_participante, cargo, rama) VALUES
    (v_campamento_id, 'Kimmy', 'Silva', 'joven', 'Clan', 'Rovers'),
    (v_campamento_id, 'Ian', 'Liñan', 'joven', 'Lobato', 'Lobatos'),
    (v_campamento_id, 'Valeria', 'Mamani', 'joven', 'Lobato', 'Lobatos'),
    (v_campamento_id, 'Evelyn', 'Neyra', 'joven', 'Padre - Manada', 'Lobatos'),
    (v_campamento_id, 'Daniela', 'Sandoval', 'joven', 'Padre - Manada', 'Lobatos'),
    (v_campamento_id, 'Cesar', 'Moreno', 'joven', 'Jefatura', 'Scouts');
    
    -- Adultos participantes
    INSERT INTO participantes_campamento (campamento_id, nombre, apellido, tipo_participante, cargo, rama) VALUES
    (v_campamento_id, 'Fredy', 'Silva', 'adulto', 'Jefatura', 'Coordinación'),
    (v_campamento_id, 'Juan', 'Pérez', 'adulto', 'Jefatura', 'Coordinación'),
    (v_campamento_id, 'Ivan', 'Rodriguez', 'adulto', 'Dirigente', 'Scouts');
END $$;

-- Insertar gastos de ejemplo
DO $$
DECLARE
    v_campamento_id UUID;
BEGIN
    SELECT id INTO v_campamento_id FROM campamentos WHERE nombre = 'Campamento de Verano 2025';
    
    INSERT INTO gastos_campamento (campamento_id, concepto, categoria, monto_total, descripcion, estado_pago) VALUES
    (v_campamento_id, 'Movilidad - Bus', 'movilidad', 950.00, 'Transporte de ida y vuelta para participantes', 'pagado'),
    (v_campamento_id, 'Entradas', 'servicios', 1610.00, 'Entradas al lugar del campamento', 'pendiente'),
    (v_campamento_id, 'Paños y Otros', 'materiales', 16.30, 'Materiales diversos para actividades', 'pagado'),
    (v_campamento_id, 'Bolsas', 'materiales', 4.00, 'Bolsas para residuos y materiales', 'pagado');
END $$;