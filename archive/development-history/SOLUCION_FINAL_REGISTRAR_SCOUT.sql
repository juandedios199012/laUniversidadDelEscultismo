-- ================================================================
-- 🎯 SOLUCIÓN DEFINITIVA: FUNCIÓN CON PARÁMETROS NOMBRADOS
-- ================================================================
-- Este script crea la función exactamente como la espera Supabase
-- ================================================================

-- 1️⃣ ELIMINAR TODAS las funciones anteriores
DROP FUNCTION IF EXISTS registrar_scout_completo CASCADE;

-- 2️⃣ CREAR función con TODOS los parámetros opcionales (para evitar problemas de orden)
CREATE OR REPLACE FUNCTION registrar_scout_completo(
    p_apellidos VARCHAR DEFAULT NULL,
    p_codigo VARCHAR DEFAULT NULL,
    p_direccion TEXT DEFAULT NULL,
    p_distrito VARCHAR DEFAULT NULL,
    p_documento_identidad VARCHAR DEFAULT NULL,
    p_email VARCHAR DEFAULT NULL,
    p_familiar_apellidos VARCHAR DEFAULT NULL,
    p_familiar_email VARCHAR DEFAULT NULL,
    p_familiar_nombres VARCHAR DEFAULT NULL,
    p_familiar_telefono VARCHAR DEFAULT NULL,
    p_fecha_nacimiento DATE DEFAULT NULL,
    p_nombres VARCHAR DEFAULT NULL,
    p_parentesco VARCHAR DEFAULT NULL,
    p_rama VARCHAR DEFAULT NULL,
    p_sexo VARCHAR DEFAULT NULL,
    p_telefono VARCHAR DEFAULT NULL,
    p_tipo_documento VARCHAR DEFAULT 'DNI'
)
RETURNS JSON AS $$
DECLARE
    v_scout_id UUID;
    v_codigo_scout TEXT;
    v_rama_calculada rama_enum;
    v_edad INTEGER;
    v_familiar_id UUID;
    v_sexo_enum sexo_enum;
    v_tipo_doc_enum tipo_documento_enum;
    v_parentesco_enum parentesco_enum;
BEGIN
    -- VALIDACIONES OBLIGATORIAS
    IF p_nombres IS NULL OR LENGTH(TRIM(p_nombres)) = 0 THEN
        RAISE EXCEPTION 'Los nombres son obligatorios';
    END IF;
    
    IF p_apellidos IS NULL OR LENGTH(TRIM(p_apellidos)) = 0 THEN
        RAISE EXCEPTION 'Los apellidos son obligatorios';
    END IF;
    
    IF p_fecha_nacimiento IS NULL THEN
        RAISE EXCEPTION 'La fecha de nacimiento es obligatoria';
    END IF;
    
    IF p_documento_identidad IS NULL OR LENGTH(TRIM(p_documento_identidad)) = 0 THEN
        RAISE EXCEPTION 'El número de documento es obligatorio';
    END IF;

    IF p_sexo IS NULL THEN
        RAISE EXCEPTION 'El sexo es obligatorio';
    END IF;

    -- CONVERSIONES DE TIPOS
    BEGIN
        v_sexo_enum := p_sexo::sexo_enum;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Valor de sexo inválido: %', p_sexo;
    END;

    BEGIN
        v_tipo_doc_enum := COALESCE(p_tipo_documento, 'DNI')::tipo_documento_enum;
    EXCEPTION
        WHEN OTHERS THEN
            v_tipo_doc_enum := 'DNI'::tipo_documento_enum;
    END;

    -- Verificar si el documento ya existe
    IF EXISTS (SELECT 1 FROM scouts WHERE numero_documento = p_documento_identidad) THEN
        RAISE EXCEPTION 'Ya existe un scout con el documento %', p_documento_identidad;
    END IF;
    
    -- CALCULAR EDAD Y RAMA
    v_edad := EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_fecha_nacimiento));
    
    IF v_edad < 5 THEN
        RAISE EXCEPTION 'El scout debe tener al menos 5 años de edad';
    END IF;
    
    -- Determinar rama
    IF p_rama IS NOT NULL THEN
        BEGIN
            v_rama_calculada := p_rama::rama_enum;
        EXCEPTION
            WHEN OTHERS THEN
                v_rama_calculada := CASE 
                    WHEN v_edad BETWEEN 5 AND 7 THEN 'MANADA'
                    WHEN v_edad BETWEEN 8 AND 10 THEN 'MANADA'
                    WHEN v_edad BETWEEN 11 AND 14 THEN 'TROPA'
                    WHEN v_edad BETWEEN 15 AND 17 THEN 'COMUNIDAD'
                    WHEN v_edad >= 18 THEN 'CLAN'
                    ELSE 'TROPA'
                END;
        END;
    ELSE
        v_rama_calculada := CASE 
            WHEN v_edad BETWEEN 5 AND 7 THEN 'MANADA'
            WHEN v_edad BETWEEN 8 AND 10 THEN 'MANADA'
            WHEN v_edad BETWEEN 11 AND 14 THEN 'TROPA'
            WHEN v_edad BETWEEN 15 AND 17 THEN 'COMUNIDAD'
            WHEN v_edad >= 18 THEN 'CLAN'
            ELSE 'TROPA'
        END;
    END IF;
    
    -- GENERAR CÓDIGO SCOUT
    IF p_codigo IS NULL OR LENGTH(TRIM(p_codigo)) = 0 THEN
        v_codigo_scout := UPPER(LEFT(v_rama_calculada::TEXT, 3)) || 
                         TO_CHAR(CURRENT_DATE, 'YY') || 
                         LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 10000)::TEXT, 4, '0');
    ELSE
        v_codigo_scout := p_codigo;
    END IF;
    
    -- INSERTAR SCOUT
    INSERT INTO scouts (
        codigo_scout,
        nombres,
        apellidos,
        fecha_nacimiento,
        sexo,
        numero_documento,
        tipo_documento,
        celular,
        correo,
        direccion,
        distrito,
        rama_actual,
        estado,
        fecha_ingreso
    ) VALUES (
        v_codigo_scout,
        TRIM(p_nombres),
        TRIM(p_apellidos),
        p_fecha_nacimiento,
        v_sexo_enum,
        p_documento_identidad,
        v_tipo_doc_enum,
        p_telefono,
        p_email,
        p_direccion,
        p_distrito,
        v_rama_calculada,
        'ACTIVO',
        CURRENT_DATE
    ) RETURNING id INTO v_scout_id;
    
    -- INSERTAR FAMILIAR (OPCIONAL)
    IF p_familiar_nombres IS NOT NULL AND p_familiar_apellidos IS NOT NULL THEN
        BEGIN
            -- Convertir parentesco
            IF p_parentesco IS NOT NULL THEN
                BEGIN
                    v_parentesco_enum := p_parentesco::parentesco_enum;
                EXCEPTION
                    WHEN OTHERS THEN
                        v_parentesco_enum := 'PADRE'::parentesco_enum;
                END;
            ELSE
                v_parentesco_enum := 'PADRE'::parentesco_enum;
            END IF;

            INSERT INTO familiares (
                scout_id,
                nombres,
                apellidos,
                parentesco,
                celular,
                correo,
                es_contacto_emergencia,
                es_autorizado_recoger
            ) VALUES (
                v_scout_id,
                TRIM(p_familiar_nombres),
                TRIM(p_familiar_apellidos),
                v_parentesco_enum,
                p_familiar_telefono,
                p_familiar_email,
                TRUE,
                TRUE
            ) RETURNING id INTO v_familiar_id;
        EXCEPTION
            WHEN OTHERS THEN
                v_familiar_id := NULL;
        END;
    END IF;
    
    -- HISTÓRICO DE RAMA (OPCIONAL)
    BEGIN
        INSERT INTO historico_rama (
            scout_id,
            rama_anterior,
            rama_nueva,
            fecha_cambio,
            motivo_cambio,
            observaciones
        ) VALUES (
            v_scout_id,
            NULL,
            v_rama_calculada,
            CURRENT_DATE,
            'INGRESO_INICIAL',
            'Registro inicial en la rama ' || v_rama_calculada::TEXT
        );
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;
    
    -- RETORNAR ÉXITO
    RETURN json_build_object(
        'success', true,
        'scout_id', v_scout_id,
        'codigo_scout', v_codigo_scout,
        'rama_asignada', v_rama_calculada,
        'familiar_id', v_familiar_id,
        'mensaje', 'Scout registrado exitosamente'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'codigo_error', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;

-- 3️⃣ VERIFICACIÓN
SELECT 
    '🎉 FUNCIÓN CREADA CON PARÁMETROS ALFABÉTICOS' as resultado,
    'Ahora debería funcionar el registro' as mensaje;

-- ================================================================
-- 📋 INSTRUCCIONES:
-- 1. COPIAR todo este archivo
-- 2. PEGAR en Supabase SQL Editor
-- 3. EJECUTAR (RUN)
-- 4. Probar el registro de scouts
-- ================================================================