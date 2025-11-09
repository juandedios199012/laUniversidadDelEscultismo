-- ================================================================
-- SISTEMA DE PERSISTENCIA DE DISEÑOS DE TABLA
-- Tabla para guardar diseños de documentos de manera permanente
-- ================================================================

-- 1. Crear tabla para diseños de tabla
CREATE TABLE IF NOT EXISTS table_designs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    design_data JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    category VARCHAR(50) DEFAULT 'custom',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_default_per_category UNIQUE (category, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- 2. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_table_designs_category ON table_designs(category);
CREATE INDEX IF NOT EXISTS idx_table_designs_created_by ON table_designs(created_by);
CREATE INDEX IF NOT EXISTS idx_table_designs_default ON table_designs(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_table_designs_name ON table_designs(name);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE table_designs ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de seguridad
-- Política para lectura: todos pueden ver diseños por defecto, solo creador ve los propios
CREATE POLICY "view_table_designs" ON table_designs
    FOR SELECT
    USING (
        is_default = true 
        OR created_by = auth.uid()
        OR created_by IS NULL -- Para diseños del sistema
    );

-- Política para inserción: usuarios autenticados pueden crear diseños
CREATE POLICY "create_table_designs" ON table_designs
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (created_by = auth.uid() OR created_by IS NULL)
    );

-- Política para actualización: solo el creador puede modificar
CREATE POLICY "update_table_designs" ON table_designs
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Política para eliminación: solo el creador puede eliminar
CREATE POLICY "delete_table_designs" ON table_designs
    FOR DELETE
    USING (created_by = auth.uid());

-- 5. Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_table_designs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger para auto-update timestamp
DROP TRIGGER IF EXISTS trigger_update_table_designs_timestamp ON table_designs;
CREATE TRIGGER trigger_update_table_designs_timestamp
    BEFORE UPDATE ON table_designs
    FOR EACH ROW
    EXECUTE FUNCTION update_table_designs_timestamp();

-- 7. Insertar diseños por defecto
INSERT INTO table_designs (name, description, design_data, is_default, category, created_by) VALUES
(
    'DNGI-03 Estándar',
    'Diseño estándar para formulario DNGI-03 con distribución original',
    '{
        "id": "default-dngi03",
        "name": "DNGI-03 Estándar",
        "rows": [
            {
                "id": "row-header",
                "cells": [
                    {
                        "id": "cell-apellidos-header",
                        "field": "apellidos",
                        "label": "APELLIDOS COMPLETOS",
                        "width": 200,
                        "height": 30,
                        "colspan": 2,
                        "backgroundColor": "#4a5568",
                        "textColor": "#ffffff",
                        "fontSize": 12,
                        "fontWeight": "bold",
                        "textAlign": "center"
                    },
                    {
                        "id": "cell-nombres-header",
                        "field": "nombres",
                        "label": "NOMBRES COMPLETOS",
                        "width": 200,
                        "height": 30,
                        "colspan": 2,
                        "backgroundColor": "#4a5568",
                        "textColor": "#ffffff",
                        "fontSize": 12,
                        "fontWeight": "bold",
                        "textAlign": "center"
                    }
                ]
            },
            {
                "id": "row-data",
                "cells": [
                    {
                        "id": "cell-apellidos",
                        "field": "apellidos",
                        "label": "apellidos",
                        "width": 200,
                        "height": 25,
                        "colspan": 2,
                        "backgroundColor": "#f7fafc",
                        "textColor": "#2d3748",
                        "fontSize": 10,
                        "fontWeight": "normal",
                        "textAlign": "left"
                    },
                    {
                        "id": "cell-nombres",
                        "field": "nombres",
                        "label": "nombres",
                        "width": 200,
                        "height": 25,
                        "colspan": 2,
                        "backgroundColor": "#f7fafc",
                        "textColor": "#2d3748",
                        "fontSize": 10,
                        "fontWeight": "normal",
                        "textAlign": "left"
                    }
                ]
            },
            {
                "id": "row-details",
                "cells": [
                    {
                        "id": "cell-sexo",
                        "field": "sexo",
                        "label": "SEXO",
                        "width": 100,
                        "height": 25,
                        "colspan": 1,
                        "backgroundColor": "#4a5568",
                        "textColor": "#ffffff",
                        "fontSize": 10,
                        "fontWeight": "bold",
                        "textAlign": "center"
                    },
                    {
                        "id": "cell-fecha-nacimiento",
                        "field": "fecha_nacimiento",
                        "label": "FECHA DE NACIMIENTO",
                        "width": 100,
                        "height": 25,
                        "colspan": 1,
                        "backgroundColor": "#4a5568",
                        "textColor": "#ffffff",
                        "fontSize": 10,
                        "fontWeight": "bold",
                        "textAlign": "center"
                    },
                    {
                        "id": "cell-tipo-doc",
                        "field": "tipo_documento",
                        "label": "TIPO DE DOCUMENTO",
                        "width": 100,
                        "height": 25,
                        "colspan": 1,
                        "backgroundColor": "#4a5568",
                        "textColor": "#ffffff",
                        "fontSize": 10,
                        "fontWeight": "bold",
                        "textAlign": "center"
                    },
                    {
                        "id": "cell-numero-doc",
                        "field": "numero_documento",
                        "label": "NÚMERO DE DOCUMENTO",
                        "width": 100,
                        "height": 25,
                        "colspan": 1,
                        "backgroundColor": "#4a5568",
                        "textColor": "#ffffff",
                        "fontSize": 10,
                        "fontWeight": "bold",
                        "textAlign": "center"
                    }
                ]
            }
        ]
    }',
    true,
    'dngi03',
    NULL
),
(
    'Lista Simple',
    'Diseño simple con información básica del scout',
    '{
        "id": "simple-list",
        "name": "Lista Simple",
        "rows": [
            {
                "id": "row-simple",
                "cells": [
                    {
                        "id": "cell-nombres-completos",
                        "field": "nombres",
                        "label": "NOMBRES",
                        "width": 150,
                        "height": 25,
                        "colspan": 1,
                        "backgroundColor": "#e2e8f0",
                        "textColor": "#2d3748",
                        "fontSize": 11,
                        "fontWeight": "normal",
                        "textAlign": "left"
                    },
                    {
                        "id": "cell-apellidos-completos",
                        "field": "apellidos",
                        "label": "APELLIDOS",
                        "width": 150,
                        "height": 25,
                        "colspan": 1,
                        "backgroundColor": "#e2e8f0",
                        "textColor": "#2d3748",
                        "fontSize": 11,
                        "fontWeight": "normal",
                        "textAlign": "left"
                    },
                    {
                        "id": "cell-documento",
                        "field": "numero_documento",
                        "label": "DOCUMENTO",
                        "width": 100,
                        "height": 25,
                        "colspan": 1,
                        "backgroundColor": "#e2e8f0",
                        "textColor": "#2d3748",
                        "fontSize": 11,
                        "fontWeight": "normal",
                        "textAlign": "center"
                    }
                ]
            }
        ]
    }',
    true,
    'simple',
    NULL
);

-- 8. Crear función para obtener diseño por defecto
CREATE OR REPLACE FUNCTION get_default_table_design(category_name VARCHAR DEFAULT 'dngi03')
RETURNS TABLE(
    design_id UUID,
    design_name VARCHAR,
    design_data JSONB,
    design_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        name,
        design_data,
        description
    FROM table_designs
    WHERE category = category_name 
      AND is_default = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 9. Crear función para guardar diseño con validación
CREATE OR REPLACE FUNCTION save_table_design(
    design_name VARCHAR,
    design_description TEXT,
    design_data JSONB,
    design_category VARCHAR DEFAULT 'custom',
    user_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    design_id UUID;
BEGIN
    -- Validar que el JSON tenga la estructura correcta
    IF NOT (design_data ? 'id' AND design_data ? 'name' AND design_data ? 'rows') THEN
        RAISE EXCEPTION 'Invalid design data structure';
    END IF;
    
    -- Insertar el diseño
    INSERT INTO table_designs (name, description, design_data, category, created_by)
    VALUES (design_name, design_description, design_data, design_category, user_id)
    RETURNING id INTO design_id;
    
    RETURN design_id;
END;
$$ LANGUAGE plpgsql;

-- Comentarios explicativos
COMMENT ON TABLE table_designs IS 'Almacena diseños de tabla personalizados para generación de documentos';
COMMENT ON COLUMN table_designs.design_data IS 'Estructura JSON del diseño de tabla con filas, celdas y estilos';
COMMENT ON COLUMN table_designs.is_default IS 'Indica si es un diseño por defecto del sistema';
COMMENT ON COLUMN table_designs.category IS 'Categoría del diseño (dngi03, simple, custom, etc.)';