-- ================================================================
-- 🔧 FUNCIONES DE UTILIDAD - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: DATABASE_UTILITY_FUNCTIONS.sql
-- Propósito: Funciones de soporte para validación, respuestas y paginación
-- Orden de ejecución: Después de 01_schema.sql y antes de funciones específicas
-- ================================================================

-- ================================================================
-- FUNCIÓN DE VALIDACIÓN DE ENTRADA
-- ================================================================
CREATE OR REPLACE FUNCTION validate_input(p_data JSON, p_required_fields TEXT[])
RETURNS JSON AS $$
DECLARE
    v_field TEXT;
    v_errors TEXT[] := '{}';
    v_valid BOOLEAN := true;
BEGIN
    -- Verificar que p_data no sea null
    IF p_data IS NULL THEN
        RETURN json_build_object(
            'valid', false,
            'errors', json_build_array('Datos requeridos')
        );
    END IF;
    
    -- Verificar campos requeridos
    FOREACH v_field IN ARRAY p_required_fields
    LOOP
        IF NOT (p_data ? v_field) OR LENGTH(TRIM(p_data ->> v_field)) = 0 THEN
            v_errors := array_append(v_errors, 'Campo requerido: ' || v_field);
            v_valid := false;
        END IF;
    END LOOP;
    
    RETURN json_build_object(
        'valid', v_valid,
        'errors', array_to_json(v_errors)
    );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNCIÓN DE RESPUESTA ESTÁNDAR
-- ================================================================
CREATE OR REPLACE FUNCTION create_standard_response(
    p_success BOOLEAN,
    p_message TEXT,
    p_data JSON DEFAULT NULL,
    p_errors JSON DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'success', p_success,
        'message', p_message,
        'data', COALESCE(p_data, 'null'::json),
        'errors', COALESCE(p_errors, '[]'::json),
        'timestamp', CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNCIÓN DE PAGINACIÓN
-- ================================================================
CREATE OR REPLACE FUNCTION apply_pagination(
    p_base_query TEXT,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20,
    p_order_by TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_offset INTEGER;
    v_total_count INTEGER;
    v_final_query TEXT;
    v_count_query TEXT;
BEGIN
    -- Calcular offset
    v_offset := (p_page - 1) * p_limit;
    
    -- Construir query de conteo
    v_count_query := 'SELECT COUNT(*) FROM (' || p_base_query || ') count_subquery';
    
    -- Ejecutar conteo
    EXECUTE v_count_query INTO v_total_count;
    
    -- Construir query final con ordenamiento y paginación
    v_final_query := p_base_query;
    
    IF p_order_by IS NOT NULL THEN
        v_final_query := v_final_query || ' ORDER BY ' || p_order_by;
    END IF;
    
    v_final_query := v_final_query || ' LIMIT ' || p_limit || ' OFFSET ' || v_offset;
    
    RETURN json_build_object(
        'query', v_final_query,
        'page', p_page,
        'limit', p_limit,
        'offset', v_offset,
        'total_count', v_total_count,
        'total_pages', CEIL(v_total_count::FLOAT / p_limit),
        'has_next', (v_offset + p_limit) < v_total_count,
        'has_previous', p_page > 1
    );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNCIÓN DE LOGGING DE OPERACIONES
-- ================================================================
CREATE OR REPLACE FUNCTION log_operation(
    p_table_name TEXT,
    p_operation TEXT,
    p_record_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_data JSON DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Insertar en tabla de auditoría si existe
    -- Si no existe la tabla, simplemente ignorar
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        INSERT INTO audit_log (
            table_name, operation, record_id, user_id, data, timestamp
        ) VALUES (
            p_table_name, p_operation, p_record_id, p_user_id, p_data, CURRENT_TIMESTAMP
        );
    END IF;
    
    -- Log adicional para desarrollo (opcional)
    RAISE NOTICE 'AUDIT: % % on % (ID: %)', p_operation, p_table_name, p_record_id, COALESCE(p_user_id, 'SYSTEM');
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNCIÓN PARA GENERAR CÓDIGOS ÚNICOS
-- ================================================================
CREATE OR REPLACE FUNCTION generar_codigo(p_prefix TEXT, p_table_name TEXT, p_column_name TEXT)
RETURNS TEXT AS $$
DECLARE
    v_numero INTEGER := 1;
    v_codigo TEXT;
    v_existe BOOLEAN;
    v_query TEXT;
BEGIN
    LOOP
        -- Generar código con formato: PREFIX-YYYYMMDD-NNNN
        v_codigo := p_prefix || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(v_numero::TEXT, 4, '0');
        
        -- Verificar si existe
        v_query := format('SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1)', p_table_name, p_column_name);
        EXECUTE v_query USING v_codigo INTO v_existe;
        
        -- Si no existe, retornar el código
        IF NOT v_existe THEN
            RETURN v_codigo;
        END IF;
        
        -- Incrementar número y continuar
        v_numero := v_numero + 1;
        
        -- Prevenir loop infinito (máximo 9999 por día)
        IF v_numero > 9999 THEN
            RAISE EXCEPTION 'No se puede generar código único para %', p_prefix;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- CREAR SECUENCIAS NECESARIAS
-- ================================================================
CREATE SEQUENCE IF NOT EXISTS seq_codigo_actividad START 1;

-- ================================================================
-- TABLA DE AUDITORÍA (Opcional)
-- ================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id UUID,
    user_id UUID,
    data JSON,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para la tabla de auditoría
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);

-- ================================================================
-- VERIFICACIÓN DE FUNCIONES CREADAS
-- ================================================================
DO $$ 
BEGIN
    RAISE NOTICE '🔧 ========================================';
    RAISE NOTICE '🔧 FUNCIONES DE UTILIDAD CREADAS';
    RAISE NOTICE '🔧 ========================================';
    RAISE NOTICE '✅ validate_input() - Validación de entrada';
    RAISE NOTICE '✅ create_standard_response() - Respuestas JSON estándar';
    RAISE NOTICE '✅ apply_pagination() - Sistema de paginación';
    RAISE NOTICE '✅ log_operation() - Logging de auditoría';
    RAISE NOTICE '✅ generar_codigo() - Generación de códigos únicos';
    RAISE NOTICE '✅ audit_log - Tabla de auditoría';
    RAISE NOTICE '🔧 ========================================';
    RAISE NOTICE '📋 LISTO PARA USAR CON MÓDULOS FINALES';
    RAISE NOTICE '🔧 ========================================';
END $$;