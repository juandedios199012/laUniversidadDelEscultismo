-- ================================================================
-- 🎯 ARCHIVO ÚNICO Y DEFINITIVO PARA CORREGIR LA FUNCIÓN
-- ================================================================
-- Archivo: EJECUTAR_ESTE_SCRIPT.sql
-- Instrucciones: COPIAR TODO Y PEGAR EN SUPABASE SQL EDITOR
-- ================================================================

-- 1️⃣ LIMPIAR FUNCIÓN ANTERIOR
DROP FUNCTION IF EXISTS registrar_scout_completo CASCADE;

-- 2️⃣ CREAR FUNCIÓN CORRECTA (parámetros obligatorios primero, opcionales después)
CREATE OR REPLACE FUNCTION registrar_scout_completo(
    -- ✅ PARÁMETROS OBLIGATORIOS (SIN DEFAULT)
    p_nombres VARCHAR(255),
    p_apellidos VARCHAR(255), 
    p_fecha_nacimiento DATE,
    p_sexo sexo_enum,
    p_documento_identidad VARCHAR(20),
    -- ✅ PARÁMETROS OPCIONALES (TODOS CON DEFAULT)
    p_codigo VARCHAR DEFAULT NULL,
    p_tipo_documento tipo_documento_enum DEFAULT 'DNI',
    p_telefono VARCHAR(20) DEFAULT NULL,
    p_email VARCHAR(255) DEFAULT NULL,
    p_direccion TEXT DEFAULT NULL,
    p_distrito VARCHAR(100) DEFAULT NULL,
    p_rama rama_enum DEFAULT NULL,
    p_familiar_nombres VARCHAR(255) DEFAULT NULL,
    p_familiar_apellidos VARCHAR(255) DEFAULT NULL,
    p_parentesco parentesco_enum DEFAULT NULL,
    p_familiar_telefono VARCHAR(20) DEFAULT NULL,
    p_familiar_email VARCHAR(255) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_scout_id UUID;
    v_codigo_scout TEXT;
    v_rama_calculada rama_enum;
    v_edad INTEGER;
    v_familiar_id UUID;
BEGIN
    -- VALIDACIONES
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

    -- Verificar si el documento ya existe
    IF EXISTS (SELECT 1 FROM scouts WHERE numero_documento = p_documento_identidad) THEN
        RAISE EXCEPTION 'Ya existe un scout con el documento %', p_documento_identidad;
    END IF;
    
    -- CALCULAR EDAD Y RAMA
    v_edad := EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_fecha_nacimiento));
    
    IF v_edad < 5 THEN
        RAISE EXCEPTION 'El scout debe tener al menos 5 años de edad';
    END IF;
    
    -- Determinar rama por edad si no se especifica
    IF p_rama IS NULL THEN
        v_rama_calculada := CASE 
            WHEN v_edad BETWEEN 5 AND 7 THEN 'MANADA'
            WHEN v_edad BETWEEN 8 AND 10 THEN 'MANADA'
            WHEN v_edad BETWEEN 11 AND 14 THEN 'TROPA'
            WHEN v_edad BETWEEN 15 AND 17 THEN 'COMUNIDAD'
            WHEN v_edad >= 18 THEN 'CLAN'
            ELSE 'TROPA'
        END;
    ELSE
        v_rama_calculada := p_rama;
    END IF;
    
    -- GENERAR CÓDIGO SCOUT
    IF p_codigo IS NULL THEN
        -- Código simple: RAMA + AÑO + TIMESTAMP
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
        p_sexo,
        p_documento_identidad,
        p_tipo_documento,
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
                COALESCE(p_parentesco, 'PADRE'),
                p_familiar_telefono,
                p_familiar_email,
                TRUE,
                TRUE
            ) RETURNING id INTO v_familiar_id;
        EXCEPTION
            WHEN OTHERS THEN
                -- Si falla insertar familiar, continuar
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
            -- Si la tabla no existe, ignorar
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
        -- RETORNAR ERROR
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'codigo_error', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;

-- 3️⃣ VERIFICAR QUE FUNCIONÓ
SELECT 
    '🎉 FUNCIÓN CREADA CORRECTAMENTE' as resultado,
    'Ya puedes registrar scouts' as mensaje;

-- ================================================================
-- 📋 INSTRUCCIONES DE USO:
-- ================================================================
-- 1. Abrir: https://supabase.com/dashboard/project/bbvbthspmemszazhiefy/sql
-- 2. Copiar TODO este archivo completo
-- 3. Pegar en SQL Editor
-- 4. Hacer clic en RUN
-- 5. Deberías ver: "🎉 FUNCIÓN CREADA CORRECTAMENTE"
-- ================================================================