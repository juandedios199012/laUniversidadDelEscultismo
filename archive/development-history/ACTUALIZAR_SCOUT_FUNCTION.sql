-- ================================================================
-- 🔧 ACTUALIZACIÓN FUNCIÓN ACTUALIZAR_SCOUT CON CAMPO SEXO
-- ================================================================
-- Este script actualiza la función actualizar_scout para incluir el campo sexo
-- ================================================================

-- Actualizar función actualizar_scout
DROP FUNCTION IF EXISTS actualizar_scout CASCADE;

CREATE OR REPLACE FUNCTION actualizar_scout(
    p_scout_id UUID,
    p_nombres VARCHAR(255) DEFAULT NULL,
    p_apellidos VARCHAR(255) DEFAULT NULL,
    p_sexo sexo_enum DEFAULT NULL,
    p_celular VARCHAR(20) DEFAULT NULL,
    p_correo VARCHAR(255) DEFAULT NULL,
    p_departamento VARCHAR(100) DEFAULT NULL,
    p_provincia VARCHAR(100) DEFAULT NULL,
    p_distrito VARCHAR(100) DEFAULT NULL,
    p_direccion TEXT DEFAULT NULL,
    p_centro_estudio VARCHAR(255) DEFAULT NULL,
    p_ocupacion VARCHAR(255) DEFAULT NULL,
    p_centro_laboral VARCHAR(255) DEFAULT NULL,
    p_rama_actual rama_enum DEFAULT NULL,
    p_estado estado_enum DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    -- Verificar que el scout existe
    IF NOT EXISTS (SELECT 1 FROM scouts WHERE id = p_scout_id) THEN
        RETURN json_build_object('success', false, 'error', 'Scout no encontrado');
    END IF;
    
    -- Validar email si se proporciona
    IF p_correo IS NOT NULL AND NOT validar_email(p_correo) THEN
        RETURN json_build_object('success', false, 'error', 'Formato de email inválido');
    END IF;
    
    -- Actualizar scout
    UPDATE scouts SET
        nombres = COALESCE(p_nombres, nombres),
        apellidos = COALESCE(p_apellidos, apellidos),
        sexo = COALESCE(p_sexo, sexo),
        celular = COALESCE(p_celular, celular),
        correo = COALESCE(p_correo, correo),
        departamento = COALESCE(p_departamento, departamento),
        provincia = COALESCE(p_provincia, provincia),
        distrito = COALESCE(p_distrito, distrito),
        direccion = COALESCE(p_direccion, direccion),
        centro_estudio = COALESCE(p_centro_estudio, centro_estudio),
        ocupacion = COALESCE(p_ocupacion, ocupacion),
        centro_laboral = COALESCE(p_centro_laboral, centro_laboral),
        rama_actual = COALESCE(p_rama_actual, rama_actual),
        estado = COALESCE(p_estado, estado),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_scout_id;
    
    RETURN json_build_object('success', true, 'scout_id', p_scout_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Verificar que existe la función validar_email
CREATE OR REPLACE FUNCTION validar_email(p_email VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Verificación final
SELECT 
    '✅ FUNCIÓN ACTUALIZAR_SCOUT ACTUALIZADA' as estado,
    'Campo sexo agregado a la función actualizar_scout' as mensaje;

-- ================================================================
-- 📋 INSTRUCCIONES:
-- 1. COPIAR todo este archivo  
-- 2. PEGAR en Supabase SQL Editor
-- 3. EJECUTAR (RUN)
-- ================================================================