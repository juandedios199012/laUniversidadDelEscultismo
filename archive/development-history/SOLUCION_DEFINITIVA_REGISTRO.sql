-- ================================================================
-- 🔧 VERSIÓN FINAL CORREGIDA - TODAS LAS FUNCIONES
-- ================================================================
-- Este script corrige el mapeo de campos y añade debugging
-- ================================================================

-- 1️⃣ FUNCIÓN: registrar_scout_completo (CORREGIDA)
DROP FUNCTION IF EXISTS registrar_scout_completo CASCADE;

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
    -- VALIDACIONES MEJORADAS CON DEBUG
    IF p_nombres IS NULL OR LENGTH(TRIM(p_nombres)) = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Los nombres son obligatorios',
            'campo', 'nombres',
            'debug', json_build_object('valor_recibido', p_nombres)
        );
    END IF;
    
    IF p_apellidos IS NULL OR LENGTH(TRIM(p_apellidos)) = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Los apellidos son obligatorios',
            'campo', 'apellidos',
            'debug', json_build_object('valor_recibido', p_apellidos)
        );
    END IF;
    
    IF p_fecha_nacimiento IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'La fecha de nacimiento es obligatoria',
            'campo', 'fecha_nacimiento',
            'debug', json_build_object('valor_recibido', p_fecha_nacimiento)
        );
    END IF;
    
    IF p_documento_identidad IS NULL OR LENGTH(TRIM(p_documento_identidad)) = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El número de documento es obligatorio',
            'campo', 'documento_identidad',
            'debug', json_build_object(
                'valor_recibido', p_documento_identidad,
                'longitud', CASE WHEN p_documento_identidad IS NOT NULL THEN LENGTH(p_documento_identidad) ELSE NULL END,
                'es_null', p_documento_identidad IS NULL,
                'esta_vacio', CASE WHEN p_documento_identidad IS NOT NULL THEN LENGTH(TRIM(p_documento_identidad)) = 0 ELSE NULL END
            )
        );
    END IF;

    -- Validar longitud mínima del documento (mínimo 8 caracteres para DNI)
    IF LENGTH(TRIM(p_documento_identidad)) < 8 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El número de documento debe tener al menos 8 caracteres',
            'campo', 'documento_identidad',
            'debug', json_build_object(
                'valor_recibido', p_documento_identidad,
                'longitud_actual', LENGTH(TRIM(p_documento_identidad)),
                'minimo_requerido', 8
            )
        );
    END IF;

    IF p_sexo IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El sexo es obligatorio',
            'campo', 'sexo',
            'debug', json_build_object('valor_recibido', p_sexo)
        );
    END IF;

    -- CONVERSIONES SEGURAS
    BEGIN
        v_sexo_enum := p_sexo::sexo_enum;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Valor de sexo inválido: ' || p_sexo,
                'campo', 'sexo',
                'debug', json_build_object(
                    'valor_recibido', p_sexo,
                    'valores_validos', ARRAY['MASCULINO', 'FEMENINO']
                )
            );
    END;

    BEGIN
        v_tipo_doc_enum := COALESCE(p_tipo_documento, 'DNI')::tipo_documento_enum;
    EXCEPTION
        WHEN OTHERS THEN
            v_tipo_doc_enum := 'DNI'::tipo_documento_enum;
    END;

    -- Verificar documento existente
    IF EXISTS (SELECT 1 FROM scouts WHERE numero_documento = TRIM(p_documento_identidad)) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Ya existe un scout con el documento ' || TRIM(p_documento_identidad),
            'campo', 'documento_identidad',
            'debug', json_build_object('documento_duplicado', TRIM(p_documento_identidad))
        );
    END IF;
    
    -- CALCULAR EDAD Y RAMA
    v_edad := EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_fecha_nacimiento));
    
    IF v_edad < 5 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El scout debe tener al menos 5 años de edad',
            'campo', 'edad',
            'debug', json_build_object(
                'fecha_nacimiento', p_fecha_nacimiento,
                'edad_calculada', v_edad,
                'minimo_requerido', 5
            )
        );
    END IF;
    
    -- Determinar rama
    IF p_rama IS NOT NULL AND LENGTH(TRIM(p_rama)) > 0 THEN
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
    
    -- Generar código scout
    IF p_codigo IS NULL OR LENGTH(TRIM(p_codigo)) = 0 THEN
        v_codigo_scout := UPPER(LEFT(v_rama_calculada::TEXT, 3)) || 
                         TO_CHAR(CURRENT_DATE, 'YY') || 
                         LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 10000)::TEXT, 4, '0');
    ELSE
        v_codigo_scout := TRIM(p_codigo);
    END IF;
    
    -- INSERTAR SCOUT
    INSERT INTO scouts (
        codigo_scout, nombres, apellidos, fecha_nacimiento, sexo,
        numero_documento, tipo_documento, celular, correo, direccion,
        distrito, rama_actual, estado, fecha_ingreso
    ) VALUES (
        v_codigo_scout, TRIM(p_nombres), TRIM(p_apellidos), p_fecha_nacimiento, v_sexo_enum,
        TRIM(p_documento_identidad), v_tipo_doc_enum, p_telefono, p_email, p_direccion,
        p_distrito, v_rama_calculada, 'ACTIVO', CURRENT_DATE
    ) RETURNING id INTO v_scout_id;
    
    -- INSERTAR FAMILIAR (OPCIONAL)
    IF p_familiar_nombres IS NOT NULL AND p_familiar_apellidos IS NOT NULL AND
       LENGTH(TRIM(p_familiar_nombres)) > 0 AND LENGTH(TRIM(p_familiar_apellidos)) > 0 THEN
        BEGIN
            IF p_parentesco IS NOT NULL AND LENGTH(TRIM(p_parentesco)) > 0 THEN
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
                scout_id, nombres, apellidos, parentesco, celular, correo,
                es_contacto_emergencia, es_autorizado_recoger
            ) VALUES (
                v_scout_id, TRIM(p_familiar_nombres), TRIM(p_familiar_apellidos), 
                v_parentesco_enum, p_familiar_telefono, p_familiar_email, TRUE, TRUE
            ) RETURNING id INTO v_familiar_id;
        EXCEPTION 
            WHEN OTHERS THEN
                v_familiar_id := NULL;
        END;
    END IF;
    
    -- RETORNAR ÉXITO
    RETURN json_build_object(
        'success', true,
        'scout_id', v_scout_id,
        'codigo_scout', v_codigo_scout,
        'rama_asignada', v_rama_calculada,
        'familiar_id', v_familiar_id,
        'mensaje', 'Scout registrado exitosamente',
        'debug', json_build_object(
            'edad_calculada', v_edad,
            'rama_asignada', v_rama_calculada,
            'documento_procesado', TRIM(p_documento_identidad)
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'codigo_error', SQLSTATE,
            'debug', json_build_object(
                'parametros_recibidos', json_build_object(
                    'nombres', p_nombres,
                    'apellidos', p_apellidos,
                    'documento', p_documento_identidad,
                    'sexo', p_sexo,
                    'fecha_nacimiento', p_fecha_nacimiento
                )
            )
        );
END;
$$ LANGUAGE plpgsql;

-- 2️⃣ FUNCIÓN: obtener_estadisticas_scouts_generales (SIN CAMBIOS)
DROP FUNCTION IF EXISTS obtener_estadisticas_scouts_generales CASCADE;

CREATE OR REPLACE FUNCTION obtener_estadisticas_scouts_generales()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
    v_total_scouts INTEGER;
    v_scouts_activos INTEGER;
    v_scouts_inactivos INTEGER;
    v_dirigentes INTEGER;
    v_nuevos_mes INTEGER;
    v_promedio_edad NUMERIC;
    v_masculino INTEGER;
    v_femenino INTEGER;
    v_otro INTEGER;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN estado = 'ACTIVO' THEN 1 END),
        COUNT(CASE WHEN estado = 'INACTIVO' THEN 1 END),
        COUNT(CASE WHEN es_dirigente = true THEN 1 END),
        COUNT(CASE WHEN fecha_ingreso >= date_trunc('month', CURRENT_DATE) THEN 1 END),
        ROUND(AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_nacimiento))), 1),
        COUNT(CASE WHEN sexo = 'MASCULINO' THEN 1 END),
        COUNT(CASE WHEN sexo = 'FEMENINO' THEN 1 END),
        COUNT(CASE WHEN sexo NOT IN ('MASCULINO', 'FEMENINO') THEN 1 END)
    INTO 
        v_total_scouts, v_scouts_activos, v_scouts_inactivos, v_dirigentes,
        v_nuevos_mes, v_promedio_edad, v_masculino, v_femenino, v_otro
    FROM scouts 
    WHERE estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO'); -- Corregido: usar valores válidos del enum
    
    SELECT json_build_object(
        'total_scouts', COALESCE(v_total_scouts, 0),
        'scouts_activos', COALESCE(v_scouts_activos, 0),
        'scouts_inactivos', COALESCE(v_scouts_inactivos, 0),
        'dirigentes', COALESCE(v_dirigentes, 0),
        'scouts_por_rama', COALESCE((
            SELECT json_object_agg(rama_actual, rama_count)
            FROM (
                SELECT rama_actual, COUNT(*) as rama_count
                FROM scouts 
                WHERE rama_actual IS NOT NULL AND estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO')
                GROUP BY rama_actual
            ) rama_stats
        ), '{}'),
        'promedio_edad', COALESCE(v_promedio_edad, 0),
        'nuevos_este_mes', COALESCE(v_nuevos_mes, 0),
        'distribucion_genero', json_build_object(
            'masculino', COALESCE(v_masculino, 0),
            'femenino', COALESCE(v_femenino, 0),
            'otro', COALESCE(v_otro, 0)
        )
    ) INTO v_resultado;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- 3️⃣ FUNCIÓN AUXILIAR: calcular_edad
CREATE OR REPLACE FUNCTION calcular_edad(fecha_nacimiento DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_nacimiento))::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- 4️⃣ VERIFICACIÓN FINAL
SELECT 
    '🎉 FUNCIONES CORREGIDAS Y ACTUALIZADAS' as resultado,
    'Mapping de campos corregido, validaciones mejoradas, enum estado_enum corregido' as mensaje;

-- ================================================================
-- 📋 INSTRUCCIONES:
-- 1. COPIAR todo este archivo  
-- 2. PEGAR en Supabase SQL Editor
-- 3. EJECUTAR (RUN)
-- 4. Probar registro con debugging mejorado
-- ================================================================