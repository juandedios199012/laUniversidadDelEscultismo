-- ================================================================
-- FIX: FUNCIÓN registrar_scout_completo CON PARÁMETROS CORRECTOS
-- ================================================================
-- Archivo: database/fix_registrar_scout_function.sql
-- Propósito: Crear la función con los parámetros que espera el frontend
-- ================================================================

-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS registrar_scout_completo(
    p_codigo VARCHAR,
    p_nombres VARCHAR,
    p_apellidos VARCHAR, 
    p_fecha_nacimiento DATE,
    p_sexo VARCHAR,
    p_documento_identidad VARCHAR,
    p_tipo_documento VARCHAR,
    p_telefono VARCHAR,
    p_email VARCHAR,
    p_direccion TEXT,
    p_distrito VARCHAR,
    p_rama VARCHAR,
    p_familiar_nombres VARCHAR,
    p_familiar_apellidos VARCHAR,
    p_parentesco VARCHAR,
    p_familiar_telefono VARCHAR,
    p_familiar_email VARCHAR
);

-- Crear función con parámetros correctos del frontend
CREATE OR REPLACE FUNCTION registrar_scout_completo(
    -- Parámetros obligatorios primero
    p_nombres VARCHAR(255),
    p_apellidos VARCHAR(255),
    p_fecha_nacimiento DATE,
    p_sexo sexo_enum,
    p_documento_identidad VARCHAR(20),
    -- Parámetros opcionales después (todos con DEFAULT)
    p_codigo VARCHAR DEFAULT NULL,
    p_tipo_documento tipo_documento_enum DEFAULT 'DNI',
    p_telefono VARCHAR(20) DEFAULT NULL,
    p_email VARCHAR(255) DEFAULT NULL,
    p_direccion TEXT DEFAULT NULL,
    p_distrito VARCHAR(100) DEFAULT NULL,
    p_rama rama_enum DEFAULT NULL,
    -- Datos familiares
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
    -- Validaciones básicas
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

    -- Validar que el documento no exista
    IF EXISTS (SELECT 1 FROM scouts WHERE numero_documento = p_documento_identidad) THEN
        RAISE EXCEPTION 'Ya existe un scout con el documento %', p_documento_identidad;
    END IF;
    
    -- Calcular edad
    v_edad := EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_fecha_nacimiento));
    
    -- Validar edad mínima (mínimo 5 años)
    IF v_edad < 5 THEN
        RAISE EXCEPTION 'El scout debe tener al menos 5 años de edad';
    END IF;
    
    -- Determinar rama si no se proporciona
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
    
    -- Generar código scout si no se proporciona
    IF p_codigo IS NULL THEN
        v_codigo_scout := generar_codigo_scout(v_rama_calculada);
    ELSE
        v_codigo_scout := p_codigo;
    END IF;
    
    -- Insertar el scout
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
    
    -- Insertar familiar si se proporcionan datos
    IF p_familiar_nombres IS NOT NULL AND p_familiar_apellidos IS NOT NULL THEN
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
    END IF;
    
    -- Registrar en histórico de rama
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
    
    -- Retornar resultado
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
        -- Rollback automático por PostgreSQL
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'codigo_error', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MENSAJE DE CONFIRMACIÓN
-- ================================================================
SELECT 
    '✅ FUNCIÓN registrar_scout_completo CORREGIDA' as estado,
    'Parámetros alineados con el frontend' as mensaje;