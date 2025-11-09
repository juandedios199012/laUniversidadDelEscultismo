-- ================================================================
-- 🎯 MASTER FUNCTIONS COMPLETO - SISTEMA SCOUT LIMA 12
-- ================================================================
-- ARQUITECTURA: Todas las Database Functions consolidadas
-- INCLUYE: APIs + Utilidades + Optimizaciones + Caching + Reportes
-- VERSIÓN: Enterprise-level con funciones de todos los módulos
-- PREREQUISITO: MASTER_INSTALLATION_COMPLETO.sql ejecutado exitosamente
-- ================================================================

-- ================================================================
-- 🧹 FASE 1: LIMPIEZA DE FUNCIONES EXISTENTES
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🚀 ========================================';
    RAISE NOTICE '🎯 INSTALANDO MASTER FUNCTIONS SISTEMA SCOUT';
    RAISE NOTICE '🚀 ========================================';
    RAISE NOTICE '🧹 Limpiando funciones anteriores...';
END $$;

-- Eliminar todas las funciones existentes para instalación limpia
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Eliminar solo funciones del usuario, no del sistema
    FOR r IN (
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
        AND routine_name NOT LIKE 'pg_%'
        AND routine_name NOT LIKE 'gin_%'
        AND routine_name NOT LIKE 'gist_%'
        AND routine_name NOT LIKE 'btree_%'
        AND routine_name NOT LIKE 'hash_%'
        AND routine_name NOT IN ('update_modified_timestamp', 'validar_email', 'calcular_edad')
    )
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.routine_name || ' CASCADE';
    END LOOP;
    
    RAISE NOTICE '🧹 Funciones de usuario eliminadas correctamente';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Advertencia al limpiar funciones: %', SQLERRM;
END $$;

-- ================================================================
-- 📋 FASE 2: FUNCIONES UTILITARIAS CENTRALES
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '⚙️ Instalando funciones utilitarias base...';
END $$;

-- FUNCIÓN CENTRAL: Respuesta estándar para todas las operaciones
CREATE OR REPLACE FUNCTION create_standard_response(
    p_success BOOLEAN,
    p_message TEXT,
    p_data JSON DEFAULT NULL,
    p_errors JSON DEFAULT NULL,
    p_metadata JSON DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'success', p_success,
        'message', p_message,
        'data', p_data,
        'errors', p_errors,
        'metadata', p_metadata,
        'timestamp', CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- FUNCIÓN: Validador universal de datos (Compatible con PostgreSQL)
CREATE OR REPLACE FUNCTION validate_input(
    p_data JSON,
    p_required_fields TEXT[],
    p_field_types JSON DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
    v_field TEXT;
    v_valid BOOLEAN := true;
    v_error_list TEXT[] := '{}';
    v_field_value TEXT;
BEGIN
    -- Verificar campos requeridos usando json_extract_path_text
    FOREACH v_field IN ARRAY p_required_fields
    LOOP
        v_field_value := json_extract_path_text(p_data, v_field);
        
        IF v_field_value IS NULL OR LENGTH(TRIM(v_field_value)) = 0 THEN
            v_valid := false;
            v_error_list := array_append(v_error_list, 'Campo requerido: ' || v_field);
        END IF;
    END LOOP;
    
    RETURN json_build_object(
        'valid', v_valid,
        'errors', array_to_json(v_error_list)
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- FUNCIÓN: Auditoría automática
CREATE OR REPLACE FUNCTION log_operation(
    p_table_name TEXT,
    p_operation TEXT,
    p_record_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_details JSON DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_log (
        table_name, operation, record_id, user_id, data_after
    ) VALUES (
        p_table_name, p_operation, p_record_id, p_user_id, p_details
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log silencioso - no fallar la operación principal
        NULL;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Paginación estándar
CREATE OR REPLACE FUNCTION apply_pagination(
    p_query TEXT,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20,
    p_order_by TEXT DEFAULT 'created_at DESC'
)
RETURNS JSON AS $$
DECLARE
    v_offset INTEGER;
    v_total_count INTEGER;
    v_final_query TEXT;
    v_count_query TEXT;
    v_result JSON;
BEGIN
    -- Calcular offset
    v_offset := (p_page - 1) * p_limit;
    
    -- Construir query con paginación
    v_final_query := p_query;
    IF p_order_by IS NOT NULL THEN
        v_final_query := v_final_query || ' ORDER BY ' || p_order_by;
    END IF;
    v_final_query := v_final_query || ' LIMIT ' || p_limit || ' OFFSET ' || v_offset;
    
    RETURN json_build_object(
        'page', p_page,
        'limit', p_limit,
        'offset', v_offset,
        'query', v_final_query
    );
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Generar códigos únicos
CREATE OR REPLACE FUNCTION generar_codigo(p_prefix TEXT, p_table_name TEXT, p_column_name TEXT)
RETURNS TEXT AS $$
DECLARE
    v_numero INTEGER := 1;
    v_codigo TEXT;
    v_existe BOOLEAN;
    v_query TEXT;
BEGIN
    LOOP
        v_codigo := p_prefix || LPAD(v_numero::TEXT, 4, '0');
        
        v_query := 'SELECT EXISTS(SELECT 1 FROM ' || p_table_name || 
                   ' WHERE ' || p_column_name || ' = $1)';
        EXECUTE v_query INTO v_existe USING v_codigo;
        
        IF NOT v_existe THEN
            EXIT;
        END IF;
        
        v_numero := v_numero + 1;
        
        IF v_numero > 9999 THEN
            RAISE EXCEPTION 'No se puede generar código único para %', p_prefix;
        END IF;
    END LOOP;
    
    RETURN v_codigo;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 FASE 3: MÓDULO SCOUTS - GESTIÓN COMPLETA
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '👥 Instalando módulo Scouts...';
END $$;

-- API: Registrar Scout Completo - VERSIÓN UNIFICADA CON ENUM MAPPING
CREATE OR REPLACE FUNCTION api_registrar_scout(p_data JSON)
RETURNS JSON AS $$
DECLARE
    v_validation JSON;
    v_scout_id UUID;
    v_codigo_scout TEXT;
    v_rama_calculada rama_enum;
    v_edad INTEGER;
    v_familiar_id UUID;
    v_documento_identidad TEXT;
    v_required_fields TEXT[] := ARRAY['nombres', 'apellidos', 'fecha_nacimiento', 'sexo'];
    v_rama_input TEXT;
    v_sexo_input TEXT;
    v_tipo_doc_input TEXT;
    v_parentesco_input TEXT;
BEGIN
    -- STEP 1: Validación de entrada con campos flexibles
    v_validation := validate_input(p_data, v_required_fields);
    
    IF NOT (v_validation ->> 'valid')::BOOLEAN THEN
        RETURN create_standard_response(false, 'Datos inválidos', NULL, v_validation -> 'errors');
    END IF;
    
    -- STEP 1.5: Validar documento (acepta ambos nombres de campo)
    v_documento_identidad := TRIM(COALESCE(p_data ->> 'documento_identidad', p_data ->> 'numero_documento'));
    
    IF v_documento_identidad IS NULL OR LENGTH(v_documento_identidad) = 0 THEN
        RETURN create_standard_response(
            false, 
            'Documento de identidad es requerido',
            NULL,
            json_build_array('Campo documento_identidad o numero_documento requerido')
        );
    END IF;
    
    -- STEP 2: Verificar documento único
    IF EXISTS (SELECT 1 FROM scouts WHERE numero_documento = v_documento_identidad) THEN
        RETURN create_standard_response(
            false, 
            'Ya existe un scout con este documento de identidad',
            NULL,
            json_build_array('Documento de identidad duplicado')
        );
    END IF;
    
    -- STEP 3: Calcular edad y rama
    v_edad := EXTRACT(YEAR FROM AGE(CURRENT_DATE, (p_data ->> 'fecha_nacimiento')::DATE));
    
    IF v_edad < 5 THEN
        RETURN create_standard_response(
            false,
            'La edad mínima para ingresar es 5 años',
            NULL,
            json_build_array('Edad insuficiente')
        );
    END IF;
    
    -- STEP 3.1: MAPEO DE ENUMS - Frontend a Database (Compatible con PostgreSQL)
    -- Mapear rama (frontend puede usar nombres diferentes)
    v_rama_input := COALESCE(p_data ->> 'rama', '');
    v_rama_calculada := CASE 
        WHEN v_rama_input ILIKE 'lobatos' OR v_rama_input ILIKE 'lobato' THEN 'Lobatos'::rama_enum
        WHEN v_rama_input ILIKE 'scouts' OR v_rama_input ILIKE 'scout' THEN 'Scouts'::rama_enum
        WHEN v_rama_input ILIKE 'rovers' OR v_rama_input ILIKE 'rover' THEN 'Rovers'::rama_enum
        WHEN v_rama_input ILIKE 'dirigentes' OR v_rama_input ILIKE 'dirigente' THEN 'Dirigentes'::rama_enum
        ELSE 
            CASE 
                WHEN v_edad BETWEEN 5 AND 10 THEN 'Lobatos'::rama_enum
                WHEN v_edad BETWEEN 11 AND 14 THEN 'Scouts'::rama_enum
                WHEN v_edad BETWEEN 15 AND 17 THEN 'Rovers'::rama_enum
                ELSE 'Dirigentes'::rama_enum
            END
    END;
    
    -- STEP 3.2: MAPEO DE SEXO
    v_sexo_input := UPPER(TRIM(p_data ->> 'sexo'));
    
    -- STEP 3.3: MAPEO DE TIPO DOCUMENTO
    v_tipo_doc_input := UPPER(TRIM(COALESCE(p_data ->> 'tipo_documento', 'DNI')));
    
    -- STEP 4: Generar código scout
    v_codigo_scout := generar_codigo('SC', 'scouts', 'codigo_scout');
    
    -- STEP 5: Insertar scout con ENUM MAPPING SEGURO y MAPEO CORRECTO DE CAMPOS
    INSERT INTO scouts (
        codigo_scout, nombres, apellidos, fecha_nacimiento, sexo,
        numero_documento, tipo_documento, celular, correo,
        departamento, provincia, distrito, direccion,
        centro_estudio, ocupacion, centro_laboral, 
        rama_actual, estado, fecha_ingreso
    ) VALUES (
        v_codigo_scout,
        TRIM(p_data ->> 'nombres'),
        TRIM(p_data ->> 'apellidos'),
        (p_data ->> 'fecha_nacimiento')::DATE,
        CASE 
            WHEN v_sexo_input IN ('MASCULINO', 'HOMBRE', 'M', 'MALE') THEN 'MASCULINO'::sexo_enum
            WHEN v_sexo_input IN ('FEMENINO', 'MUJER', 'F', 'FEMALE') THEN 'FEMENINO'::sexo_enum
            ELSE 'MASCULINO'::sexo_enum -- Default seguro
        END,
        -- MAPEO CORREGIDO: acepta tanto 'documento_identidad' como 'numero_documento'
        TRIM(COALESCE(p_data ->> 'documento_identidad', p_data ->> 'numero_documento')),
        CASE 
            WHEN v_tipo_doc_input IN ('DNI', 'DOCUMENTO_NACIONAL_IDENTIDAD') THEN 'DNI'::tipo_documento_enum
            WHEN v_tipo_doc_input IN ('CARNET_EXTRANJERIA', 'CE', 'EXTRANJERIA') THEN 'CARNET_EXTRANJERIA'::tipo_documento_enum
            WHEN v_tipo_doc_input IN ('PASAPORTE', 'PASSPORT') THEN 'PASAPORTE'::tipo_documento_enum
            ELSE 'DNI'::tipo_documento_enum -- Default seguro
        END,
        -- MAPEO CORREGIDO: campos opcionales con NULLIF para evitar strings vacíos
        NULLIF(TRIM(COALESCE(p_data ->> 'telefono', p_data ->> 'celular')), ''),
        NULLIF(TRIM(COALESCE(p_data ->> 'email', p_data ->> 'correo')), ''),
        NULLIF(TRIM(p_data ->> 'departamento'), ''),
        NULLIF(TRIM(p_data ->> 'provincia'), ''),
        NULLIF(TRIM(p_data ->> 'distrito'), ''),
        NULLIF(TRIM(p_data ->> 'direccion'), ''),
        NULLIF(TRIM(p_data ->> 'centro_estudio'), ''),
        -- CAMPOS AGREGADOS: ocupacion y centro_laboral
        NULLIF(TRIM(p_data ->> 'ocupacion'), ''),
        NULLIF(TRIM(p_data ->> 'centro_laboral'), ''),
        -- NOTA: fecha_ultimo_pago y observaciones se manejan en funciones específicas
        v_rama_calculada,
        'ACTIVO'::estado_enum,
        CURRENT_DATE
    ) RETURNING id INTO v_scout_id;
    
    -- STEP 6: Insertar familiar con ENUM MAPPING si se proporciona (Compatible)
    IF (p_data ->> 'familiar_nombres') IS NOT NULL AND LENGTH(TRIM(p_data ->> 'familiar_nombres')) > 0 
       AND (p_data ->> 'familiar_apellidos') IS NOT NULL AND LENGTH(TRIM(p_data ->> 'familiar_apellidos')) > 0 THEN
        
        -- Mapear parentesco
        v_parentesco_input := UPPER(TRIM(COALESCE(p_data ->> 'parentesco', 'PADRE')));
        
        INSERT INTO familiares_scout (
            scout_id, nombres, apellidos, parentesco,
            celular, correo, es_contacto_emergencia, es_autorizado_recoger
        ) VALUES (
            v_scout_id,
            TRIM(p_data ->> 'familiar_nombres'),
            TRIM(p_data ->> 'familiar_apellidos'),
            CASE 
                WHEN v_parentesco_input IN ('PADRE', 'PAPA', 'PAPÁ', 'DAD') THEN 'PADRE'::parentesco_enum
                WHEN v_parentesco_input IN ('MADRE', 'MAMA', 'MAMÁ', 'MOM') THEN 'MADRE'::parentesco_enum
                WHEN v_parentesco_input IN ('TUTOR', 'GUARDIAN', 'APODERADO') THEN 'TUTOR'::parentesco_enum
                WHEN v_parentesco_input IN ('HERMANO', 'HERMANA', 'BROTHER', 'SISTER') THEN 'HERMANO'::parentesco_enum
                WHEN v_parentesco_input IN ('TIO', 'TIA', 'TÍO', 'TÍA', 'UNCLE', 'AUNT') THEN 'TIO'::parentesco_enum
                WHEN v_parentesco_input IN ('ABUELO', 'ABUELA', 'GRANDFATHER', 'GRANDMOTHER') THEN 'ABUELO'::parentesco_enum
                ELSE 'OTRO'::parentesco_enum
            END,
            COALESCE(p_data ->> 'familiar_telefono', p_data ->> 'familiar_celular'),
            COALESCE(p_data ->> 'familiar_email', p_data ->> 'familiar_correo'),
            true,
            true
        ) RETURNING id INTO v_familiar_id;
    END IF;
    
    -- STEP 7: Registrar en histórico de rama
    INSERT INTO historico_rama (
        scout_id, rama_anterior, rama_nueva, fecha_cambio, motivo
    ) VALUES (
        v_scout_id, NULL, v_rama_calculada, CURRENT_DATE, 'Ingreso inicial'
    );
    
    -- STEP 8: Log de auditoría
    PERFORM log_operation('scouts', 'CREATE', v_scout_id, NULL, 
        json_build_object(
            'codigo_scout', v_codigo_scout, 
            'rama', v_rama_calculada,
            'enum_mapping_applied', true,
            'input_data_mapped', json_build_object(
                'rama_input', v_rama_input,
                'sexo_input', v_sexo_input,
                'tipo_doc_input', v_tipo_doc_input,
                'parentesco_input', v_parentesco_input
            )
        )
    );
    
    -- STEP 9: Retornar éxito con información de mapeo
    RETURN create_standard_response(
        true,
        'Scout registrado exitosamente con mapeo automático de enums',
        json_build_object(
            'scout_id', v_scout_id,
            'codigo_scout', v_codigo_scout,
            'rama_asignada', v_rama_calculada,
            'edad_calculada', v_edad,
            'familiar_registrado', v_familiar_id IS NOT NULL,
            'enum_mapping_applied', true,
            'system_version', 'MASTER_FUNCTIONS_UNIFICADO'
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error interno al registrar scout',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- API: Buscar Scouts con filtros avanzados
CREATE OR REPLACE FUNCTION api_buscar_scouts(p_filtros JSON DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_rama_filtro TEXT;
    v_estado_filtro TEXT;
    v_texto_busqueda TEXT;
    v_limite INTEGER;
BEGIN
    -- Extraer filtros
    v_rama_filtro := NULLIF(TRIM(p_filtros ->> 'rama'), '');
    v_estado_filtro := NULLIF(TRIM(p_filtros ->> 'estado'), '');
    v_texto_busqueda := NULLIF(TRIM(p_filtros ->> 'buscar_texto'), '');
    v_limite := COALESCE((p_filtros ->> 'limite')::INTEGER, 100);
    
    -- Query directa sin problemas de GROUP BY - ORDER BY movido dentro de json_agg
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', s.id,
            'codigo_scout', s.codigo_scout,
            'nombres', s.nombres,
            'apellidos', s.apellidos,
            'nombre_completo', s.nombres || ' ' || s.apellidos,
            'fecha_nacimiento', s.fecha_nacimiento,
            'edad', EXTRACT(YEAR FROM AGE(s.fecha_nacimiento)),
            'sexo', s.sexo,
            'numero_documento', s.numero_documento,
            'tipo_documento', s.tipo_documento,
            'celular', s.celular,
            'correo', s.correo,
            'telefono', s.celular,
            'email', s.correo,
            'direccion', s.direccion,
            'rama_actual', s.rama_actual,
            'rama', s.rama_actual,
            'estado', s.estado,
            'fecha_ingreso', s.fecha_ingreso,
            'departamento', s.departamento,
            'provincia', s.provincia,
            'distrito', s.distrito,
            'centro_estudio', s.centro_estudio,
            'ocupacion', s.ocupacion,
            'centro_laboral', s.centro_laboral,
            'created_at', s.created_at,
            'updated_at', s.updated_at,
            'es_dirigente', EXISTS(
                SELECT 1 FROM dirigentes d 
                WHERE d.scout_id = s.id 
                AND d.estado_dirigente = 'ACTIVO'
            )
        ) ORDER BY s.apellidos, s.nombres
    ), '[]'::json) INTO v_result
    FROM scouts s
    WHERE 1=1
    AND (v_rama_filtro IS NULL OR s.rama_actual::text = v_rama_filtro)
    AND (v_estado_filtro IS NULL OR s.estado::text = v_estado_filtro)
    AND (v_texto_busqueda IS NULL OR (
        s.nombres ILIKE '%' || v_texto_busqueda || '%' OR 
        s.apellidos ILIKE '%' || v_texto_busqueda || '%' OR 
        s.numero_documento ILIKE '%' || v_texto_busqueda || '%'
    ))
    LIMIT v_limite;
    
    RETURN create_standard_response(
        true,
        'Búsqueda completada exitosamente',
        v_result
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error en la búsqueda de scouts',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- API: Actualizar Scout
CREATE OR REPLACE FUNCTION api_actualizar_scout(p_scout_id UUID, p_data JSON)
RETURNS JSON AS $$
DECLARE
    v_scout_exists BOOLEAN;
    v_old_data JSON;
    v_changes JSON := '{}';
BEGIN
    -- Verificar que el scout existe
    SELECT EXISTS(SELECT 1 FROM scouts WHERE id = p_scout_id) INTO v_scout_exists;
    
    IF NOT v_scout_exists THEN
        RETURN create_standard_response(
            false,
            'Scout no encontrado',
            NULL,
            json_build_array('ID de scout inválido')
        );
    END IF;
    
    -- Obtener datos actuales para auditoría
    SELECT to_json(s.*) INTO v_old_data FROM scouts s WHERE id = p_scout_id;
    
    -- Actualizar campos proporcionados
    UPDATE scouts SET
        nombres = COALESCE(TRIM(p_data ->> 'nombres'), nombres),
        apellidos = COALESCE(TRIM(p_data ->> 'apellidos'), apellidos),
        celular = COALESCE(p_data ->> 'telefono', celular),
        correo = COALESCE(p_data ->> 'email', correo),
        direccion = COALESCE(p_data ->> 'direccion', direccion),
        distrito = COALESCE(p_data ->> 'distrito', distrito),
        provincia = COALESCE(p_data ->> 'provincia', provincia),
        departamento = COALESCE(p_data ->> 'departamento', departamento),
        centro_estudio = COALESCE(p_data ->> 'centro_estudio', centro_estudio),
        ocupacion = COALESCE(p_data ->> 'ocupacion', ocupacion),
        centro_laboral = COALESCE(p_data ->> 'centro_laboral', centro_laboral),
        rama_actual = COALESCE((p_data ->> 'rama')::rama_enum, rama_actual),
        estado = COALESCE((p_data ->> 'estado')::estado_enum, estado),
        observaciones = COALESCE(p_data ->> 'observaciones', observaciones),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_scout_id;
    
    -- Log de auditoría
    PERFORM log_operation('scouts', 'UPDATE', p_scout_id, NULL, p_data);
    
    RETURN create_standard_response(
        true,
        'Scout actualizado exitosamente',
        json_build_object('scout_id', p_scout_id, 'cambios_aplicados', p_data)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error al actualizar scout',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- API: Eliminar Scout (cambio de estado a INACTIVO)
CREATE OR REPLACE FUNCTION api_eliminar_scout(p_scout_id UUID)
RETURNS JSON AS $$
DECLARE
    v_scout_exists BOOLEAN;
    v_scout_data JSON;
BEGIN
    -- Verificar que el scout existe
    SELECT EXISTS(SELECT 1 FROM scouts WHERE id = p_scout_id) INTO v_scout_exists;
    
    IF NOT v_scout_exists THEN
        RETURN create_standard_response(
            false,
            'Scout no encontrado',
            NULL,
            json_build_array('ID de scout inválido')
        );
    END IF;
    
    -- Obtener datos del scout para auditoría
    SELECT to_json(s.*) INTO v_scout_data FROM scouts s WHERE id = p_scout_id;
    
    -- Cambiar estado a INACTIVO en lugar de eliminar físicamente
    UPDATE scouts 
    SET estado = 'INACTIVO'::estado_enum,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_scout_id;
    
    -- Registrar en auditoría
    PERFORM log_operation('scouts', 'DELETE_LOGICAL', p_scout_id, NULL, 
        json_build_object(
            'accion', 'cambio_estado_inactivo',
            'datos_scout', v_scout_data
        )
    );
    
    RETURN create_standard_response(
        true,
        'Scout eliminado exitosamente (estado cambiado a INACTIVO)',
        json_build_object(
            'scout_id', p_scout_id,
            'nuevo_estado', 'INACTIVO',
            'eliminacion_logica', true
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error al eliminar scout',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- API: Obtener Scout por ID
CREATE OR REPLACE FUNCTION api_obtener_scout(p_scout_id UUID)
RETURNS JSON AS $$
DECLARE
    v_scout_data JSON;
    v_familiares JSON;
BEGIN
    -- Verificar que el scout existe
    IF NOT EXISTS(SELECT 1 FROM scouts WHERE id = p_scout_id) THEN
        RETURN create_standard_response(
            false,
            'Scout no encontrado',
            NULL,
            json_build_array('ID de scout inválido')
        );
    END IF;
    
    -- Obtener datos del scout
    SELECT json_build_object(
        'id', s.id,
        'codigo_scout', s.codigo_scout,
        'nombres', s.nombres,
        'apellidos', s.apellidos,
        'nombre_completo', s.nombres || ' ' || s.apellidos,
        'fecha_nacimiento', s.fecha_nacimiento,
        'edad', EXTRACT(YEAR FROM AGE(s.fecha_nacimiento)),
        'sexo', s.sexo,
        'numero_documento', s.numero_documento,
        'tipo_documento', s.tipo_documento,
        'celular', s.celular,
        'correo', s.correo,
        'departamento', s.departamento,
        'provincia', s.provincia,
        'distrito', s.distrito,
        'direccion', s.direccion,
        'centro_estudio', s.centro_estudio,
        'ocupacion', s.ocupacion,
        'centro_laboral', s.centro_laboral,
        'rama_actual', s.rama_actual,
        'estado', s.estado,
        'fecha_ingreso', s.fecha_ingreso,
        'fecha_ultimo_pago', s.fecha_ultimo_pago,
        'observaciones', s.observaciones,
        'created_at', s.created_at,
        'updated_at', s.updated_at
    ) INTO v_scout_data
    FROM scouts s
    WHERE s.id = p_scout_id;
    
    -- Obtener familiares del scout
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', f.id,
            'nombres', f.nombres,
            'apellidos', f.apellidos,
            'parentesco', f.parentesco,
            'celular', f.celular,
            'correo', f.correo,
            'es_contacto_emergencia', f.es_contacto_emergencia,
            'es_autorizado_recoger', f.es_autorizado_recoger
        )
    ), '[]'::json) INTO v_familiares
    FROM familiares_scout f
    WHERE f.scout_id = p_scout_id;
    
    -- Agregar familiares a los datos del scout
    v_scout_data := jsonb_set(v_scout_data::jsonb, '{familiares}', v_familiares::jsonb)::json;
    
    RETURN create_standard_response(
        true,
        'Scout obtenido exitosamente',
        v_scout_data
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error al obtener scout',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 FUNCIONES ESPECÍFICAS PARA CAMPOS ESPECIALES
-- ================================================================

-- API: Registrar Pago y actualizar fecha_ultimo_pago automáticamente
CREATE OR REPLACE FUNCTION api_registrar_pago_scout(
    p_scout_id UUID,
    p_inscripcion_id UUID,
    p_monto_pagado DECIMAL,
    p_metodo_pago TEXT DEFAULT 'EFECTIVO',
    p_comprobante_numero TEXT DEFAULT NULL,
    p_recibido_por UUID DEFAULT NULL,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_pago_id UUID;
    v_fecha_pago DATE := CURRENT_DATE;
BEGIN
    -- Verificar que el scout existe
    IF NOT EXISTS (SELECT 1 FROM scouts WHERE id = p_scout_id) THEN
        RETURN create_standard_response(
            false,
            'Scout no encontrado',
            NULL,
            json_build_array('Scout ID inválido')
        );
    END IF;
    
    -- Registrar el pago
    INSERT INTO pagos_inscripcion (
        inscripcion_id, monto_pagado, fecha_pago, metodo_pago,
        comprobante_numero, recibido_por, observaciones
    ) VALUES (
        p_inscripcion_id, p_monto_pagado, v_fecha_pago, p_metodo_pago,
        p_comprobante_numero, p_recibido_por, p_observaciones
    ) RETURNING id INTO v_pago_id;
    
    -- ACTUALIZAR AUTOMÁTICAMENTE fecha_ultimo_pago en la tabla scouts
    UPDATE scouts 
    SET fecha_ultimo_pago = v_fecha_pago,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_scout_id;
    
    -- Log de auditoría
    PERFORM log_operation('pagos_inscripcion', 'CREATE', v_pago_id, NULL,
        json_build_object(
            'scout_id', p_scout_id,
            'monto', p_monto_pagado,
            'fecha_pago', v_fecha_pago,
            'fecha_ultimo_pago_actualizada', true
        )
    );
    
    RETURN create_standard_response(
        true,
        'Pago registrado exitosamente y fecha actualizada',
        json_build_object(
            'pago_id', v_pago_id,
            'fecha_pago', v_fecha_pago,
            'scout_fecha_ultimo_pago_actualizada', true
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error al registrar pago',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- API: Agregar observaciones a un scout específico
CREATE OR REPLACE FUNCTION api_agregar_observaciones_scout(
    p_scout_id UUID,
    p_observaciones TEXT,
    p_append BOOLEAN DEFAULT true  -- true: agregar, false: reemplazar
)
RETURNS JSON AS $$
DECLARE
    v_observaciones_actuales TEXT;
    v_observaciones_nuevas TEXT;
BEGIN
    -- Verificar que el scout existe
    IF NOT EXISTS (SELECT 1 FROM scouts WHERE id = p_scout_id) THEN
        RETURN create_standard_response(
            false,
            'Scout no encontrado',
            NULL,
            json_build_array('Scout ID inválido')
        );
    END IF;
    
    -- Obtener observaciones actuales si se va a agregar
    IF p_append THEN
        SELECT COALESCE(observaciones, '') INTO v_observaciones_actuales 
        FROM scouts WHERE id = p_scout_id;
        
        -- Concatenar nuevas observaciones
        v_observaciones_nuevas := CASE 
            WHEN LENGTH(TRIM(v_observaciones_actuales)) > 0 
            THEN v_observaciones_actuales || ' | ' || TRIM(p_observaciones)
            ELSE TRIM(p_observaciones)
        END;
    ELSE
        v_observaciones_nuevas := TRIM(p_observaciones);
    END IF;
    
    -- Actualizar observaciones
    UPDATE scouts 
    SET observaciones = NULLIF(v_observaciones_nuevas, ''),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_scout_id;
    
    -- Log de auditoría
    PERFORM log_operation('scouts', 'UPDATE_OBSERVACIONES', p_scout_id, NULL,
        json_build_object(
            'observaciones_anteriores', v_observaciones_actuales,
            'observaciones_nuevas', v_observaciones_nuevas,
            'operacion', CASE WHEN p_append THEN 'APPEND' ELSE 'REPLACE' END
        )
    );
    
    RETURN create_standard_response(
        true,
        'Observaciones actualizadas exitosamente',
        json_build_object(
            'scout_id', p_scout_id,
            'observaciones_finales', v_observaciones_nuevas,
            'operacion_realizada', CASE WHEN p_append THEN 'agregado' ELSE 'reemplazado' END
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error al actualizar observaciones',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 FASE 4: MÓDULO INVENTARIO
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '📦 Instalando módulo Inventario...';
END $$;

-- API: Crear Item de Inventario
CREATE OR REPLACE FUNCTION api_crear_inventario_item(p_data JSON)
RETURNS JSON AS $$
DECLARE
    v_validation JSON;
    v_item_id UUID;
    v_codigo_item TEXT;
    v_required_fields TEXT[] := ARRAY['nombre', 'categoria'];
BEGIN
    v_validation := validate_input(p_data, v_required_fields);
    
    IF NOT (v_validation ->> 'valid')::BOOLEAN THEN
        RETURN create_standard_response(false, 'Datos inválidos', NULL, v_validation -> 'errors');
    END IF;
    
    -- Generar código único
    v_codigo_item := generar_codigo('INV', 'inventario', 'codigo_item');
    
    INSERT INTO inventario (
        codigo_item, nombre, descripcion, categoria, marca, modelo,
        cantidad_disponible, cantidad_minima, ubicacion, valor_unitario,
        fecha_adquisicion, proveedor, estado_item
    ) VALUES (
        v_codigo_item,
        TRIM(p_data ->> 'nombre'),
        p_data ->> 'descripcion',
        (p_data ->> 'categoria')::categoria_inventario_enum,
        p_data ->> 'marca',
        p_data ->> 'modelo',
        COALESCE((p_data ->> 'cantidad_inicial')::INTEGER, 0),
        COALESCE((p_data ->> 'cantidad_minima')::INTEGER, 1),
        p_data ->> 'ubicacion',
        COALESCE((p_data ->> 'valor_unitario')::DECIMAL, 0.00),
        COALESCE((p_data ->> 'fecha_adquisicion')::DATE, CURRENT_DATE),
        p_data ->> 'proveedor',
        'DISPONIBLE'::estado_item_enum
    ) RETURNING id INTO v_item_id;
    
    -- Registrar movimiento inicial si hay cantidad
    IF COALESCE((p_data ->> 'cantidad_inicial')::INTEGER, 0) > 0 THEN
        INSERT INTO movimientos_inventario (
            item_id, tipo_movimiento, cantidad, motivo
        ) VALUES (
            v_item_id, 'ENTRADA', (p_data ->> 'cantidad_inicial')::INTEGER, 'Ingreso inicial'
        );
    END IF;
    
    PERFORM log_operation('inventario', 'CREATE', v_item_id, NULL, p_data);
    
    RETURN create_standard_response(
        true,
        'Item de inventario creado exitosamente',
        json_build_object(
            'item_id', v_item_id,
            'codigo_item', v_codigo_item
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error al crear item de inventario',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- API: Registrar Movimiento de Inventario
CREATE OR REPLACE FUNCTION api_registrar_movimiento_inventario(p_data JSON)
RETURNS JSON AS $$
DECLARE
    v_validation JSON;
    v_movimiento_id UUID;
    v_item_actual inventario%ROWTYPE;
    v_nueva_cantidad INTEGER;
    v_required_fields TEXT[] := ARRAY['item_id', 'tipo_movimiento', 'cantidad'];
BEGIN
    v_validation := validate_input(p_data, v_required_fields);
    
    IF NOT (v_validation ->> 'valid')::BOOLEAN THEN
        RETURN create_standard_response(false, 'Datos inválidos', NULL, v_validation -> 'errors');
    END IF;
    
    -- Obtener item actual
    SELECT * INTO v_item_actual FROM inventario WHERE id = (p_data ->> 'item_id')::UUID;
    
    IF NOT FOUND THEN
        RETURN create_standard_response(
            false,
            'Item de inventario no encontrado',
            NULL,
            json_build_array('ID de item inválido')
        );
    END IF;
    
    -- Calcular nueva cantidad según tipo de movimiento
    CASE p_data ->> 'tipo_movimiento'
        WHEN 'ENTRADA', 'DEVOLUCION' THEN
            v_nueva_cantidad := v_item_actual.cantidad_disponible + (p_data ->> 'cantidad')::INTEGER;
        WHEN 'SALIDA', 'PERDIDA', 'DAÑO' THEN
            v_nueva_cantidad := v_item_actual.cantidad_disponible - (p_data ->> 'cantidad')::INTEGER;
            IF v_nueva_cantidad < 0 THEN
                RETURN create_standard_response(
                    false,
                    'Cantidad insuficiente en inventario',
                    NULL,
                    json_build_array('Stock insuficiente')
                );
            END IF;
        ELSE
            v_nueva_cantidad := v_item_actual.cantidad_disponible;
    END CASE;
    
    -- Registrar movimiento
    INSERT INTO movimientos_inventario (
        item_id, tipo_movimiento, cantidad, cantidad_anterior,
        scout_id, actividad_id, dirigente_responsable_id, motivo, observaciones
    ) VALUES (
        (p_data ->> 'item_id')::UUID,
        p_data ->> 'tipo_movimiento',
        (p_data ->> 'cantidad')::INTEGER,
        v_item_actual.cantidad_disponible,
        (p_data ->> 'scout_id')::UUID,
        (p_data ->> 'actividad_id')::UUID,
        (p_data ->> 'dirigente_id')::UUID,
        p_data ->> 'motivo',
        p_data ->> 'observaciones'
    ) RETURNING id INTO v_movimiento_id;
    
    -- Actualizar cantidad en inventario
    UPDATE inventario 
    SET cantidad_disponible = v_nueva_cantidad,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = (p_data ->> 'item_id')::UUID;
    
    PERFORM log_operation('movimientos_inventario', 'CREATE', v_movimiento_id, NULL, p_data);
    
    RETURN create_standard_response(
        true,
        'Movimiento registrado exitosamente',
        json_build_object(
            'movimiento_id', v_movimiento_id,
            'cantidad_anterior', v_item_actual.cantidad_disponible,
            'cantidad_nueva', v_nueva_cantidad
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error al registrar movimiento',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 FASE 5: MÓDULO ACTIVIDADES
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🎯 Instalando módulo Actividades...';
END $$;

-- API: Crear Actividad
CREATE OR REPLACE FUNCTION api_crear_actividad(p_data JSON)
RETURNS JSON AS $$
DECLARE
    v_validation JSON;
    v_actividad_id UUID;
    v_codigo_actividad TEXT;
    v_required_fields TEXT[] := ARRAY['nombre', 'tipo_actividad', 'fecha_inicio', 'dirigente_responsable_id'];
BEGIN
    v_validation := validate_input(p_data, v_required_fields);
    
    IF NOT (v_validation ->> 'valid')::BOOLEAN THEN
        RETURN create_standard_response(false, 'Datos inválidos', NULL, v_validation -> 'errors');
    END IF;
    
    -- Validar que el dirigente existe
    IF NOT EXISTS (SELECT 1 FROM dirigentes WHERE id = (p_data ->> 'dirigente_responsable_id')::UUID AND estado_dirigente = 'ACTIVO') THEN
        RETURN create_standard_response(
            false,
            'Dirigente responsable no encontrado o inactivo',
            NULL,
            json_build_array('Dirigente inválido')
        );
    END IF;
    
    v_codigo_actividad := generar_codigo('ACT', 'actividades_scout', 'codigo_actividad');
    
    INSERT INTO actividades_scout (
        codigo_actividad, nombre, descripcion, tipo_actividad, rama_objetivo,
        fecha_inicio, fecha_fin, ubicacion, dirigente_responsable_id,
        costo_por_scout, capacidad_maxima, requiere_autorizacion,
        material_necesario, objetivos, estado
    ) VALUES (
        v_codigo_actividad,
        TRIM(p_data ->> 'nombre'),
        p_data ->> 'descripcion',
        (p_data ->> 'tipo_actividad')::tipo_actividad_enum,
        (p_data ->> 'rama_objetivo')::rama_enum,
        (p_data ->> 'fecha_inicio')::TIMESTAMP WITH TIME ZONE,
        (p_data ->> 'fecha_fin')::TIMESTAMP WITH TIME ZONE,
        p_data ->> 'ubicacion',
        (p_data ->> 'dirigente_responsable_id')::UUID,
        COALESCE((p_data ->> 'costo_por_scout')::DECIMAL, 0.00),
        (p_data ->> 'capacidad_maxima')::INTEGER,
        COALESCE((p_data ->> 'requiere_autorizacion')::BOOLEAN, true),
        CASE WHEN json_extract_path_text(p_data, 'material_necesario') IS NOT NULL THEN 
            string_to_array(p_data ->> 'material_necesario', ',') 
            ELSE NULL END,
        p_data ->> 'objetivos',
        'PLANIFICADA'::estado_actividad_enum
    ) RETURNING id INTO v_actividad_id;
    
    PERFORM log_operation('actividades_scout', 'CREATE', v_actividad_id, NULL, p_data);
    
    RETURN create_standard_response(
        true,
        'Actividad creada exitosamente',
        json_build_object(
            'actividad_id', v_actividad_id,
            'codigo_actividad', v_codigo_actividad
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error al crear actividad',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- API: Inscribir Scout a Actividad
CREATE OR REPLACE FUNCTION api_inscribir_scout_actividad(
    p_scout_id UUID,
    p_actividad_id UUID,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_actividad actividades_scout%ROWTYPE;
    v_scout_valido BOOLEAN;
    v_ya_inscrito BOOLEAN;
    v_inscripcion_id UUID;
BEGIN
    -- Verificar scout válido
    SELECT EXISTS(SELECT 1 FROM scouts WHERE id = p_scout_id AND estado = 'ACTIVO') INTO v_scout_valido;
    
    IF NOT v_scout_valido THEN
        RETURN create_standard_response(false, 'Scout no encontrado o inactivo', NULL, json_build_array('Scout ID inválido'));
    END IF;
    
    -- Obtener actividad
    SELECT * INTO v_actividad FROM actividades_scout WHERE id = p_actividad_id;
    
    IF NOT FOUND THEN
        RETURN create_standard_response(false, 'Actividad no encontrada', NULL, json_build_array('Actividad ID inválida'));
    END IF;
    
    -- Verificar capacidad
    IF v_actividad.capacidad_maxima IS NOT NULL AND v_actividad.participantes_confirmados >= v_actividad.capacidad_maxima THEN
        RETURN create_standard_response(
            false,
            'Actividad llena - capacidad máxima alcanzada',
            NULL,
            json_build_array('Sin cupos disponibles')
        );
    END IF;
    
    -- Verificar si ya está inscrito
    SELECT EXISTS(
        SELECT 1 FROM inscripciones_actividad 
        WHERE scout_id = p_scout_id AND actividad_id = p_actividad_id
        AND estado != 'CANCELADO'
    ) INTO v_ya_inscrito;
    
    IF v_ya_inscrito THEN
        RETURN create_standard_response(
            false,
            'Scout ya está inscrito en esta actividad',
            NULL,
            json_build_array('Inscripción duplicada')
        );
    END IF;
    
    -- Crear inscripción
    INSERT INTO inscripciones_actividad (
        actividad_id, scout_id, observaciones, estado
    ) VALUES (
        p_actividad_id, p_scout_id, p_observaciones, 'PENDIENTE'
    ) RETURNING id INTO v_inscripcion_id;
    
    -- Actualizar contador de participantes
    UPDATE actividades_scout 
    SET participantes_confirmados = participantes_confirmados + 1
    WHERE id = p_actividad_id;
    
    PERFORM log_operation('inscripciones_actividad', 'CREATE', v_inscripcion_id, NULL,
        json_build_object('scout_id', p_scout_id, 'actividad_id', p_actividad_id)
    );
    
    RETURN create_standard_response(
        true,
        'Scout inscrito exitosamente',
        json_build_object('inscripcion_id', v_inscripcion_id)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error al inscribir scout',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 FASE 6: SISTEMA DE CACHING Y OPTIMIZACIÓN
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🔄 Instalando sistema de caching...';
END $$;

-- FUNCIÓN: Obtener datos del cache
CREATE OR REPLACE FUNCTION obtener_cache(p_cache_key VARCHAR(255))
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT cache_data INTO v_resultado
    FROM cache_estadisticas
    WHERE cache_key = p_cache_key
    AND fecha_expiracion > CURRENT_TIMESTAMP;
    
    -- Incrementar contador de hits
    IF v_resultado IS NOT NULL THEN
        UPDATE cache_estadisticas 
        SET hits = hits + 1, updated_at = CURRENT_TIMESTAMP
        WHERE cache_key = p_cache_key;
    END IF;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Guardar datos en cache
CREATE OR REPLACE FUNCTION guardar_cache(
    p_cache_key VARCHAR(255),
    p_cache_data JSON,
    p_tipo_cache VARCHAR(100),
    p_duracion_minutos INTEGER DEFAULT 60,
    p_parametros JSON DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO cache_estadisticas (
        cache_key, cache_data, tipo_cache, parametros, fecha_expiracion
    ) VALUES (
        p_cache_key, p_cache_data, p_tipo_cache, p_parametros,
        CURRENT_TIMESTAMP + (p_duracion_minutos || ' minutes')::INTERVAL
    )
    ON CONFLICT (cache_key) DO UPDATE SET
        cache_data = EXCLUDED.cache_data,
        fecha_expiracion = EXCLUDED.fecha_expiracion,
        parametros = EXCLUDED.parametros,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Limpiar cache expirado
CREATE OR REPLACE FUNCTION limpiar_cache_expirado()
RETURNS INTEGER AS $$
DECLARE
    v_eliminados INTEGER;
BEGIN
    DELETE FROM cache_estadisticas
    WHERE fecha_expiracion < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS v_eliminados = ROW_COUNT;
    
    RETURN v_eliminados;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 FASE 7: DASHBOARD Y REPORTES
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '📊 Instalando sistema de dashboard...';
END $$;

-- API: Dashboard Principal
CREATE OR REPLACE FUNCTION api_dashboard_principal()
RETURNS JSON AS $$
DECLARE
    v_cache_key VARCHAR(255);
    v_resultado JSON;
    v_scouts_stats JSON;
    v_actividades_stats JSON;
    v_inventario_stats JSON;
    v_alertas JSON;
BEGIN
    v_cache_key := 'dashboard_principal_' || CURRENT_DATE::TEXT;
    
    -- Intentar obtener del cache
    v_resultado := obtener_cache(v_cache_key);
    
    IF v_resultado IS NOT NULL THEN
        RETURN create_standard_response(true, 'Dashboard obtenido desde cache', v_resultado);
    END IF;
    
    -- Calcular estadísticas de scouts simplificadas
    WITH scouts_por_rama AS (
        SELECT 
            rama_actual,
            COUNT(*) as cantidad
        FROM scouts 
        WHERE estado = 'ACTIVO'
        GROUP BY rama_actual
    ),
    scouts_totales AS (
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN estado = 'ACTIVO' THEN 1 END) as activos
        FROM scouts
    )
    SELECT json_build_object(
        'total', st.total,
        'activos', st.activos,
        'por_rama', COALESCE(json_object_agg(spr.rama_actual, spr.cantidad), '{}'::json)
    ) INTO v_scouts_stats
    FROM scouts_totales st
    LEFT JOIN scouts_por_rama spr ON true
    GROUP BY st.total, st.activos;
    
    -- Si no hay datos de scouts, usar estructura vacía
    IF v_scouts_stats IS NULL THEN
        v_scouts_stats := json_build_object(
            'total', 0,
            'activos', 0,
            'por_rama', '{}'::json
        );
    END IF;
    
    -- Calcular estadísticas de actividades
    SELECT json_build_object(
        'planificadas', (
            SELECT COUNT(*) FROM actividades_scout 
            WHERE estado = 'PLANIFICADA' AND fecha_inicio > CURRENT_TIMESTAMP
        ),
        'en_curso', (
            SELECT COUNT(*) FROM actividades_scout 
            WHERE estado = 'EN_CURSO'
        ),
        'este_mes', (
            SELECT COUNT(*) FROM actividades_scout 
            WHERE DATE_TRUNC('month', fecha_inicio) = DATE_TRUNC('month', CURRENT_DATE)
        )
    ) INTO v_actividades_stats;
    
    -- Calcular estadísticas de inventario
    SELECT json_build_object(
        'items_disponibles', (
            SELECT COUNT(*) FROM inventario WHERE estado_item = 'DISPONIBLE'
        ),
        'stock_bajo', (
            SELECT COUNT(*) FROM inventario 
            WHERE cantidad_disponible <= cantidad_minima AND estado_item = 'DISPONIBLE'
        ),
        'valor_total', (
            SELECT COALESCE(SUM(valor_unitario * cantidad_disponible), 0) 
            FROM inventario WHERE estado_item = 'DISPONIBLE'
        )
    ) INTO v_inventario_stats;
    
    -- Generar alertas
    SELECT json_build_array(
        CASE WHEN EXISTS(
            SELECT 1 FROM inventario 
            WHERE cantidad_disponible <= cantidad_minima AND estado_item = 'DISPONIBLE'
        ) THEN 'Items con stock bajo detectados' ELSE NULL END
    ) INTO v_alertas;
    
    -- Construir resultado final
    SELECT json_build_object(
        'scouts', v_scouts_stats,
        'actividades', v_actividades_stats,
        'inventario', v_inventario_stats,
        'alertas', v_alertas,
        'timestamp', CURRENT_TIMESTAMP
    ) INTO v_resultado;
    
    -- Guardar en cache por 2 horas
    PERFORM guardar_cache(v_cache_key, v_resultado, 'dashboard_principal', 120);
    
    RETURN create_standard_response(true, 'Dashboard generado exitosamente', v_resultado);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error al generar dashboard',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- API: Obtener Estadísticas Generales
CREATE OR REPLACE FUNCTION api_obtener_estadisticas_generales()
RETURNS JSON AS $$
DECLARE
    v_cache_key VARCHAR(255);
    v_resultado JSON;
BEGIN
    v_cache_key := 'estadisticas_generales_' || CURRENT_DATE::TEXT;
    
    v_resultado := obtener_cache(v_cache_key);
    
    IF v_resultado IS NOT NULL THEN
        RETURN create_standard_response(true, 'Estadísticas obtenidas desde cache', v_resultado);
    END IF;
    
    -- Refrescar vistas materializadas si es necesario
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_scouts;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_resumen_inventario;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_asistencia;
    
    -- Obtener estadísticas desde vistas materializadas
    SELECT json_build_object(
        'scouts_por_rama', (
            SELECT json_object_agg(rama_actual, json_build_object(
                'total', total_scouts,
                'activos', scouts_activos,
                'inactivos', scouts_inactivos,
                'edad_promedio', edad_promedio
            ))
            FROM mv_estadisticas_scouts
        ),
        'inventario_por_categoria', (
            SELECT json_object_agg(categoria, json_build_object(
                'total_items', total_items,
                'disponibles', items_disponibles,
                'valor_total', valor_total_categoria
            ))
            FROM mv_resumen_inventario
        ),
        'asistencia_promedio', (
            SELECT ROUND(AVG(porcentaje_asistencia), 2)
            FROM mv_estadisticas_asistencia
        ),
        'ultima_actualizacion', CURRENT_TIMESTAMP
    ) INTO v_resultado;
    
    PERFORM guardar_cache(v_cache_key, v_resultado, 'estadisticas_generales', 240);
    
    RETURN create_standard_response(true, 'Estadísticas generales obtenidas', v_resultado);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error al obtener estadísticas',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 FASE 9: FUNCIONES DE MAPEO Y NORMALIZACIÓN UNIFICADAS
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🔄 Instalando funciones de mapeo y normalización...';
END $$;

-- FUNCIÓN: Mapear valores de rama del frontend a la base de datos
CREATE OR REPLACE FUNCTION mapear_rama_a_enum(p_rama_input TEXT)
RETURNS rama_enum AS $$
BEGIN
    RETURN CASE 
        WHEN UPPER(TRIM(p_rama_input)) IN ('LOBATOS', 'LOBATO', 'MANADA') THEN 'Lobatos'::rama_enum
        WHEN UPPER(TRIM(p_rama_input)) IN ('SCOUTS', 'SCOUT', 'TROPA') THEN 'Scouts'::rama_enum
        WHEN UPPER(TRIM(p_rama_input)) IN ('ROVERS', 'ROVER', 'CLAN') THEN 'Rovers'::rama_enum
        WHEN UPPER(TRIM(p_rama_input)) IN ('DIRIGENTES', 'DIRIGENTE', 'ADULTOS') THEN 'Dirigentes'::rama_enum
        ELSE 'Scouts'::rama_enum -- Default seguro
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- FUNCIÓN: Mapear sexo del frontend a la base de datos
CREATE OR REPLACE FUNCTION mapear_sexo_a_enum(p_sexo_input TEXT)
RETURNS sexo_enum AS $$
BEGIN
    RETURN CASE 
        WHEN UPPER(TRIM(p_sexo_input)) IN ('MASCULINO', 'HOMBRE', 'M', 'MALE', 'H') THEN 'MASCULINO'::sexo_enum
        WHEN UPPER(TRIM(p_sexo_input)) IN ('FEMENINO', 'MUJER', 'F', 'FEMALE', 'MUJER') THEN 'FEMENINO'::sexo_enum
        ELSE 'MASCULINO'::sexo_enum -- Default seguro
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- FUNCIÓN: Mapear tipo de documento del frontend a la base de datos
CREATE OR REPLACE FUNCTION mapear_tipo_documento_a_enum(p_tipo_doc_input TEXT)
RETURNS tipo_documento_enum AS $$
BEGIN
    RETURN CASE 
        WHEN UPPER(TRIM(p_tipo_doc_input)) IN ('DNI', 'DOCUMENTO_NACIONAL_IDENTIDAD', 'DOCUMENTO NACIONAL DE IDENTIDAD') THEN 'DNI'::tipo_documento_enum
        WHEN UPPER(TRIM(p_tipo_doc_input)) IN ('CARNET_EXTRANJERIA', 'CE', 'EXTRANJERIA', 'CARNET DE EXTRANJERIA') THEN 'CARNET_EXTRANJERIA'::tipo_documento_enum
        WHEN UPPER(TRIM(p_tipo_doc_input)) IN ('PASAPORTE', 'PASSPORT') THEN 'PASAPORTE'::tipo_documento_enum
        ELSE 'DNI'::tipo_documento_enum -- Default seguro
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- FUNCIÓN: Mapear parentesco del frontend a la base de datos
CREATE OR REPLACE FUNCTION mapear_parentesco_a_enum(p_parentesco_input TEXT)
RETURNS parentesco_enum AS $$
BEGIN
    RETURN CASE 
        WHEN UPPER(TRIM(p_parentesco_input)) IN ('PADRE', 'PAPA', 'PAPÁ', 'DAD', 'FATHER') THEN 'PADRE'::parentesco_enum
        WHEN UPPER(TRIM(p_parentesco_input)) IN ('MADRE', 'MAMA', 'MAMÁ', 'MOM', 'MOTHER') THEN 'MADRE'::parentesco_enum
        WHEN UPPER(TRIM(p_parentesco_input)) IN ('TUTOR', 'GUARDIAN', 'APODERADO', 'TUTOR LEGAL') THEN 'TUTOR'::parentesco_enum
        WHEN UPPER(TRIM(p_parentesco_input)) IN ('HERMANO', 'HERMANA', 'BROTHER', 'SISTER', 'SIBLING') THEN 'HERMANO'::parentesco_enum
        WHEN UPPER(TRIM(p_parentesco_input)) IN ('TIO', 'TIA', 'TÍO', 'TÍA', 'UNCLE', 'AUNT') THEN 'TIO'::parentesco_enum
        WHEN UPPER(TRIM(p_parentesco_input)) IN ('ABUELO', 'ABUELA', 'GRANDFATHER', 'GRANDMOTHER', 'GRANDPARENT') THEN 'ABUELO'::parentesco_enum
        ELSE 'OTRO'::parentesco_enum
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- FUNCIÓN: Normalizar y validar datos de entrada completos
CREATE OR REPLACE FUNCTION normalizar_datos_scout(p_data JSON)
RETURNS JSON AS $$
DECLARE
    v_normalized JSON;
BEGIN
    -- Normalizar todos los campos principales con mapeo automático
    SELECT json_build_object(
        'nombres', TRIM(p_data ->> 'nombres'),
        'apellidos', TRIM(p_data ->> 'apellidos'),
        'fecha_nacimiento', (p_data ->> 'fecha_nacimiento')::DATE,
        'sexo_normalizado', mapear_sexo_a_enum(p_data ->> 'sexo'),
        -- MAPEO CORREGIDO: acepta ambos nombres de campo
        'documento_identidad', TRIM(COALESCE(p_data ->> 'documento_identidad', p_data ->> 'numero_documento')),
        'numero_documento', TRIM(COALESCE(p_data ->> 'documento_identidad', p_data ->> 'numero_documento')),
        'tipo_documento_normalizado', mapear_tipo_documento_a_enum(COALESCE(p_data ->> 'tipo_documento', 'DNI')),
        'rama_normalizada', CASE 
            WHEN json_extract_path_text(p_data, 'rama') IS NOT NULL AND LENGTH(TRIM(p_data ->> 'rama')) > 0 
            THEN mapear_rama_a_enum(p_data ->> 'rama')
            ELSE NULL 
        END,
        'parentesco_normalizado', CASE 
            WHEN json_extract_path_text(p_data, 'parentesco') IS NOT NULL AND LENGTH(TRIM(p_data ->> 'parentesco')) > 0 
            THEN mapear_parentesco_a_enum(p_data ->> 'parentesco')
            ELSE 'PADRE'::parentesco_enum 
        END,
        -- Campos opcionales normalizados con NULLIF para evitar strings vacíos
        'telefono', NULLIF(TRIM(p_data ->> 'telefono'), ''),
        'email', NULLIF(TRIM(p_data ->> 'email'), ''),
        'departamento', NULLIF(TRIM(p_data ->> 'departamento'), ''),
        'provincia', NULLIF(TRIM(p_data ->> 'provincia'), ''),
        'distrito', NULLIF(TRIM(p_data ->> 'distrito'), ''),
        'direccion', NULLIF(TRIM(p_data ->> 'direccion'), ''),
        'centro_estudio', NULLIF(TRIM(p_data ->> 'centro_estudio'), ''),
        -- CAMPOS LABORALES AGREGADOS
        'ocupacion', NULLIF(TRIM(p_data ->> 'ocupacion'), ''),
        'centro_laboral', NULLIF(TRIM(p_data ->> 'centro_laboral'), ''),
        -- NOTA: fecha_ultimo_pago y observaciones se manejan en funciones específicas
        -- Datos familiares normalizados
        'familiar_nombres', NULLIF(TRIM(p_data ->> 'familiar_nombres'), ''),
        'familiar_apellidos', NULLIF(TRIM(p_data ->> 'familiar_apellidos'), ''),
        'familiar_telefono', NULLIF(TRIM(p_data ->> 'familiar_telefono'), ''),
        'familiar_email', NULLIF(TRIM(p_data ->> 'familiar_email'), ''),
        -- Metadatos de normalización
        'normalizado_en', CURRENT_TIMESTAMP,
        'version_normalizacion', 'MASTER_FUNCTIONS_UNIFICADO_V1.1_FIXED_MAPPING'
    ) INTO v_normalized;
    
    RETURN v_normalized;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: API mejorada para registrar scout con normalización automática
CREATE OR REPLACE FUNCTION api_registrar_scout_normalizado(p_data JSON)
RETURNS JSON AS $$
DECLARE
    v_data_normalized JSON;
    v_resultado JSON;
BEGIN
    -- Paso 1: Normalizar datos de entrada
    v_data_normalized := normalizar_datos_scout(p_data);
    
    -- Paso 2: Llamar a la función principal con datos normalizados
    v_resultado := api_registrar_scout(v_data_normalized);
    
    -- Paso 3: Agregar información de normalización al resultado
    IF (v_resultado ->> 'success')::BOOLEAN THEN
        v_resultado := jsonb_set(
            v_resultado::jsonb, 
            '{data,normalization_applied}', 
            'true'::jsonb
        )::json;
        
        v_resultado := jsonb_set(
            v_resultado::jsonb, 
            '{data,original_input_processed}', 
            'true'::jsonb
        )::json;
    END IF;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 FASE 10: FUNCIONES DE VERIFICACIÓN Y DIAGNÓSTICO
-- ================================================================

-- FUNCIÓN: Verificar integridad de enums del sistema
CREATE OR REPLACE FUNCTION verificar_integridad_enums()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
    v_errores TEXT[] := ARRAY[]::TEXT[];
    v_rama_test rama_enum;
    v_sexo_test sexo_enum;
    v_tipo_doc_test tipo_documento_enum;
    v_parentesco_test parentesco_enum;
BEGIN
    -- Probar todos los valores de enum
    BEGIN
        v_rama_test := 'Lobatos'::rama_enum;
        v_rama_test := 'Scouts'::rama_enum;
        v_rama_test := 'Rovers'::rama_enum;
        v_rama_test := 'Dirigentes'::rama_enum;
    EXCEPTION
        WHEN OTHERS THEN
            v_errores := array_append(v_errores, 'Error en rama_enum: ' || SQLERRM);
    END;
    
    BEGIN
        v_sexo_test := 'MASCULINO'::sexo_enum;
        v_sexo_test := 'FEMENINO'::sexo_enum;
    EXCEPTION
        WHEN OTHERS THEN
            v_errores := array_append(v_errores, 'Error en sexo_enum: ' || SQLERRM);
    END;
    
    BEGIN
        v_tipo_doc_test := 'DNI'::tipo_documento_enum;
        v_tipo_doc_test := 'CARNET_EXTRANJERIA'::tipo_documento_enum;
        v_tipo_doc_test := 'PASAPORTE'::tipo_documento_enum;
    EXCEPTION
        WHEN OTHERS THEN
            v_errores := array_append(v_errores, 'Error en tipo_documento_enum: ' || SQLERRM);
    END;
    
    BEGIN
        v_parentesco_test := 'PADRE'::parentesco_enum;
        v_parentesco_test := 'MADRE'::parentesco_enum;
        v_parentesco_test := 'TUTOR'::parentesco_enum;
        v_parentesco_test := 'HERMANO'::parentesco_enum;
        v_parentesco_test := 'TIO'::parentesco_enum;
        v_parentesco_test := 'ABUELO'::parentesco_enum;
        v_parentesco_test := 'OTRO'::parentesco_enum;
    EXCEPTION
        WHEN OTHERS THEN
            v_errores := array_append(v_errores, 'Error en parentesco_enum: ' || SQLERRM);
    END;
    
    -- Construir resultado
    SELECT json_build_object(
        'integridad_correcta', array_length(v_errores, 1) IS NULL OR array_length(v_errores, 1) = 0,
        'errores_encontrados', COALESCE(array_length(v_errores, 1), 0),
        'detalles_errores', CASE 
            WHEN array_length(v_errores, 1) > 0 THEN array_to_json(v_errores)
            ELSE NULL 
        END,
        'tipos_enum_verificados', json_build_array('rama_enum', 'sexo_enum', 'tipo_documento_enum', 'parentesco_enum'),
        'verificado_en', CURRENT_TIMESTAMP,
        'version_sistema', 'MASTER_FUNCTIONS_UNIFICADO'
    ) INTO v_resultado;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Mantenimiento general del sistema
CREATE OR REPLACE FUNCTION api_mantenimiento_sistema()
RETURNS JSON AS $$
DECLARE
    v_cache_eliminado INTEGER;
    v_resultado JSON;
BEGIN
    -- Limpiar cache expirado
    v_cache_eliminado := limpiar_cache_expirado();
    
    -- Actualizar estadísticas de tablas
    ANALYZE scouts;
    ANALYZE inventario;
    ANALYZE actividades_scout;
    ANALYZE asistencias;
    
    -- Refrescar vistas materializadas
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_scouts;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_resumen_inventario;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_asistencia;
    
    SELECT json_build_object(
        'cache_eliminado_entradas', v_cache_eliminado,
        'vistas_actualizadas', 3,
        'estadisticas_actualizadas', 4,
        'timestamp', CURRENT_TIMESTAMP,
        'estado', 'COMPLETADO'
    ) INTO v_resultado;
    
    RETURN create_standard_response(true, 'Mantenimiento completado exitosamente', v_resultado);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error durante mantenimiento',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Health Check del sistema
CREATE OR REPLACE FUNCTION api_health_check()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
    v_conexiones_activas INTEGER;
    v_tamaño_db NUMERIC;
BEGIN
    -- Obtener métricas del sistema
    SELECT COUNT(*) INTO v_conexiones_activas FROM pg_stat_activity WHERE state = 'active';
    SELECT ROUND(pg_database_size(current_database())::NUMERIC / 1024 / 1024, 2) INTO v_tamaño_db;
    
    SELECT json_build_object(
        'estado', 'SALUDABLE',
        'timestamp', CURRENT_TIMESTAMP,
        'metricas', json_build_object(
            'conexiones_activas', v_conexiones_activas,
            'tamaño_bd_mb', v_tamaño_db,
            'total_scouts', (SELECT COUNT(*) FROM scouts WHERE estado = 'ACTIVO'),
            'total_actividades', (SELECT COUNT(*) FROM actividades_scout),
            'items_inventario', (SELECT COUNT(*) FROM inventario),
            'cache_entradas', (SELECT COUNT(*) FROM cache_estadisticas WHERE fecha_expiracion > CURRENT_TIMESTAMP)
        ),
        'version_schema', '1.0.0',
        'ultima_actualizacion', (
            SELECT MAX(updated_at) FROM scouts
        )
    ) INTO v_resultado;
    
    RETURN create_standard_response(true, 'Sistema funcionando correctamente', v_resultado);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error en health check',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 MENSAJE FINAL DE INSTALACIÓN
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '✅ MASTER FUNCTIONS UNIFICADO COMPLETADO';
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '🚀 APIS: 25+ funciones principales instaladas';
    RAISE NOTICE '🔧 UTILIDADES: Validación, cache, logging';
    RAISE NOTICE '📊 REPORTES: Dashboard y estadísticas';
    RAISE NOTICE '🔄 MANTENIMIENTO: Health check y limpieza';
    RAISE NOTICE '⚡ PERFORMANCE: Cache inteligente y optimización';
    RAISE NOTICE '� ENUM MAPPING: Sistema automático de normalización';
    RAISE NOTICE '🛡️ COMPATIBILIDAD: Frontend-Backend unificada';
    RAISE NOTICE '🧪 FUNCIONES ADICIONALES: Mapeo y verificación de integridad';
    RAISE NOTICE '📋 SISTEMA LISTO PARA PRODUCCIÓN CON ENUM SAFETY';
    RAISE NOTICE '🎉 ========================================';
END $$;

-- Verificación final con diagnóstico de enums
SELECT 
    '🎯 MASTER FUNCTIONS UNIFICADO COMPLETADO' as resultado,
    'Todas las funciones con mapeo automático de enums instaladas' as mensaje,
    'Sistema con compatibilidad total frontend-backend implementada' as estado;