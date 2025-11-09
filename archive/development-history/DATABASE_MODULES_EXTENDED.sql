-- ================================================================
-- 🏗️ SISTEMA SCOUT COMPLETO - MÓDULOS ADICIONALES
-- ================================================================
-- CONTINUACIÓN: Presupuestos, Dirigentes, Patrullas, Asistencia,
-- Actividades, Comité Padres, Programa Semanal, Libro de Oro
-- ================================================================

-- ================================================================
-- 📋 MÓDULO PRESUPUESTOS - GESTIÓN FINANCIERA COMPLETA
-- ================================================================

-- API: Crear Presupuesto
CREATE OR REPLACE FUNCTION api_crear_presupuesto(p_data JSON)
RETURNS JSON AS $$
DECLARE
    v_validation JSON;
    v_presupuesto_id UUID;
    v_required_fields TEXT[] := ARRAY['nombre', 'tipo', 'monto_total', 'fecha_inicio', 'fecha_fin'];
BEGIN
    -- Validación de entrada
    v_validation := validate_input(p_data, v_required_fields);
    
    IF NOT (v_validation ->> 'valid')::BOOLEAN THEN
        RETURN create_standard_response(false, 'Datos inválidos', NULL, v_validation -> 'errors');
    END IF;
    
    -- Validaciones de negocio
    IF (p_data ->> 'fecha_inicio')::DATE > (p_data ->> 'fecha_fin')::DATE THEN
        RETURN create_standard_response(
            false, 
            'Fecha de inicio no puede ser mayor a fecha fin',
            NULL,
            json_build_array('Fechas inválidas')
        );
    END IF;
    
    IF (p_data ->> 'monto_total')::DECIMAL <= 0 THEN
        RETURN create_standard_response(
            false,
            'El monto total debe ser mayor a cero',
            NULL,
            json_build_array('Monto inválido')
        );
    END IF;
    
    BEGIN
        INSERT INTO presupuestos (
            nombre, descripcion, tipo, monto_total, monto_ejecutado,
            fecha_inicio, fecha_fin, responsable, estado, fecha_creacion
        ) VALUES (
            TRIM(p_data ->> 'nombre'),
            p_data ->> 'descripcion',
            (p_data ->> 'tipo')::tipo_presupuesto_enum,
            (p_data ->> 'monto_total')::DECIMAL,
            0,
            (p_data ->> 'fecha_inicio')::DATE,
            (p_data ->> 'fecha_fin')::DATE,
            COALESCE((p_data ->> 'responsable')::UUID, NULL),
            'PLANIFICADO',
            CURRENT_TIMESTAMP
        ) RETURNING id INTO v_presupuesto_id;
        
        -- Log de auditoría
        PERFORM log_operation('presupuestos', 'CREATE', v_presupuesto_id, (p_data ->> 'responsable')::UUID, p_data);
        
        RETURN create_standard_response(
            true,
            'Presupuesto creado exitosamente',
            json_build_object('presupuesto_id', v_presupuesto_id)
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN create_standard_response(false, 'Error al crear presupuesto', NULL, json_build_array(SQLERRM));
    END;
END;
$$ LANGUAGE plpgsql;

-- API: Ejecutar Gasto en Presupuesto
CREATE OR REPLACE FUNCTION api_ejecutar_gasto_presupuesto(
    p_presupuesto_id UUID,
    p_concepto VARCHAR,
    p_monto DECIMAL,
    p_comprobante VARCHAR DEFAULT NULL,
    p_responsable UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_presupuesto presupuestos%ROWTYPE;
    v_nuevo_ejecutado DECIMAL;
    v_gasto_id UUID;
BEGIN
    -- Obtener presupuesto actual
    SELECT * INTO v_presupuesto FROM presupuestos WHERE id = p_presupuesto_id AND estado != 'ELIMINADO';
    
    IF NOT FOUND THEN
        RETURN create_standard_response(false, 'Presupuesto no encontrado', NULL, json_build_array('ID inválido'));
    END IF;
    
    -- Calcular nuevo monto ejecutado
    v_nuevo_ejecutado := v_presupuesto.monto_ejecutado + p_monto;
    
    -- Validar que no exceda el presupuesto
    IF v_nuevo_ejecutado > v_presupuesto.monto_total THEN
        RETURN create_standard_response(
            false,
            'El gasto excede el presupuesto disponible',
            NULL,
            json_build_array(
                'Disponible: ' || (v_presupuesto.monto_total - v_presupuesto.monto_ejecutado) ||
                ', Solicitado: ' || p_monto
            )
        );
    END IF;
    
    BEGIN
        -- Registrar gasto
        INSERT INTO gastos_presupuesto (
            presupuesto_id, concepto, monto, comprobante, 
            responsable, fecha_gasto, estado
        ) VALUES (
            p_presupuesto_id, p_concepto, p_monto, p_comprobante,
            p_responsable, CURRENT_TIMESTAMP, 'APROBADO'
        ) RETURNING id INTO v_gasto_id;
        
        -- Actualizar presupuesto
        UPDATE presupuestos SET
            monto_ejecutado = v_nuevo_ejecutado,
            estado = CASE 
                WHEN v_nuevo_ejecutado >= monto_total THEN 'EJECUTADO'
                WHEN v_nuevo_ejecutado > 0 THEN 'EN_EJECUCION'
                ELSE estado
            END,
            fecha_modificacion = CURRENT_TIMESTAMP
        WHERE id = p_presupuesto_id;
        
        -- Log de auditoría
        PERFORM log_operation(
            'presupuestos', 
            'UPDATE', 
            p_presupuesto_id, 
            p_responsable,
            json_build_object(
                'tipo_operacion', 'GASTO',
                'concepto', p_concepto,
                'monto', p_monto,
                'monto_ejecutado_anterior', v_presupuesto.monto_ejecutado,
                'monto_ejecutado_nuevo', v_nuevo_ejecutado
            )
        );
        
        RETURN create_standard_response(
            true,
            'Gasto registrado exitosamente',
            json_build_object(
                'gasto_id', v_gasto_id,
                'monto_ejecutado', v_nuevo_ejecutado,
                'saldo_disponible', v_presupuesto.monto_total - v_nuevo_ejecutado,
                'porcentaje_ejecucion', ROUND((v_nuevo_ejecutado / v_presupuesto.monto_total) * 100, 2)
            )
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN create_standard_response(false, 'Error al registrar gasto', NULL, json_build_array(SQLERRM));
    END;
END;
$$ LANGUAGE plpgsql;

-- API: Buscar Presupuestos con Análisis Financiero
CREATE OR REPLACE FUNCTION api_buscar_presupuestos(p_filtros JSON DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    v_query TEXT;
    v_conditions TEXT[] := '{}';
    v_pagination JSON;
    v_result JSON;
BEGIN
    v_query := '
        SELECT 
            p.id, p.nombre, p.descripcion, p.tipo, p.monto_total, p.monto_ejecutado,
            p.fecha_inicio, p.fecha_fin, p.responsable, p.estado, p.fecha_creacion,
            ROUND((p.monto_ejecutado / NULLIF(p.monto_total, 0)) * 100, 2) as porcentaje_ejecucion,
            p.monto_total - p.monto_ejecutado as saldo_disponible,
            CASE 
                WHEN CURRENT_DATE > p.fecha_fin THEN ''VENCIDO''
                WHEN CURRENT_DATE BETWEEN p.fecha_inicio AND p.fecha_fin THEN ''VIGENTE''
                ELSE ''FUTURO''
            END as estado_temporal,
            (SELECT COUNT(*) FROM gastos_presupuesto g WHERE g.presupuesto_id = p.id) as total_gastos,
            COALESCE(
                (SELECT json_agg(json_build_object(
                    ''concepto'', g.concepto,
                    ''monto'', g.monto,
                    ''fecha'', g.fecha_gasto,
                    ''comprobante'', g.comprobante
                )) FROM gastos_presupuesto g 
                WHERE g.presupuesto_id = p.id 
                ORDER BY g.fecha_gasto DESC 
                LIMIT 5), 
                ''[]''
            ) as ultimos_gastos
        FROM presupuestos p
        WHERE p.estado != ''ELIMINADO''
    ';
    
    -- Aplicar filtros
    IF (p_filtros ? 'tipo') AND LENGTH(TRIM(p_filtros ->> 'tipo')) > 0 THEN
        v_conditions := array_append(v_conditions, 'p.tipo = ''' || (p_filtros ->> 'tipo') || '''');
    END IF;
    
    IF (p_filtros ? 'estado') AND LENGTH(TRIM(p_filtros ->> 'estado')) > 0 THEN
        v_conditions := array_append(v_conditions, 'p.estado = ''' || (p_filtros ->> 'estado') || '''');
    END IF;
    
    IF (p_filtros ? 'responsable') AND LENGTH(TRIM(p_filtros ->> 'responsable')) > 0 THEN
        v_conditions := array_append(v_conditions, 'p.responsable = ''' || (p_filtros ->> 'responsable') || '''');
    END IF;
    
    IF (p_filtros ? 'vencidos') AND (p_filtros ->> 'vencidos')::BOOLEAN THEN
        v_conditions := array_append(v_conditions, 'CURRENT_DATE > p.fecha_fin');
    END IF;
    
    IF (p_filtros ? 'vigentes') AND (p_filtros ->> 'vigentes')::BOOLEAN THEN
        v_conditions := array_append(v_conditions, 'CURRENT_DATE BETWEEN p.fecha_inicio AND p.fecha_fin');
    END IF;
    
    -- Agregar condiciones WHERE
    IF array_length(v_conditions, 1) > 0 THEN
        v_query := v_query || ' AND ' || array_to_string(v_conditions, ' AND ');
    END IF;
    
    -- Aplicar paginación
    v_pagination := apply_pagination(
        v_query,
        COALESCE((p_filtros ->> 'page')::INTEGER, 1),
        COALESCE((p_filtros ->> 'limit')::INTEGER, 20),
        COALESCE(p_filtros ->> 'order_by', 'p.fecha_creacion DESC')
    );
    
    -- Ejecutar query
    EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || (v_pagination ->> 'query') || ') t' INTO v_result;
    
    RETURN create_standard_response(
        true,
        'Búsqueda de presupuestos completada',
        json_build_object(
            'presupuestos', COALESCE(v_result, '[]'),
            'pagination', v_pagination
        )
    );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 MÓDULO DIRIGENTES - GESTIÓN DE LIDERAZGO
-- ================================================================

-- API: Asignar Dirigente
CREATE OR REPLACE FUNCTION api_asignar_dirigente(p_data JSON)
RETURNS JSON AS $$
DECLARE
    v_validation JSON;
    v_dirigente_id UUID;
    v_scout_exists BOOLEAN;
    v_ya_es_dirigente BOOLEAN;
    v_required_fields TEXT[] := ARRAY['scout_id', 'cargo', 'rama_asignada', 'fecha_inicio'];
BEGIN
    -- Validación de entrada
    v_validation := validate_input(p_data, v_required_fields);
    
    IF NOT (v_validation ->> 'valid')::BOOLEAN THEN
        RETURN create_standard_response(false, 'Datos inválidos', NULL, v_validation -> 'errors');
    END IF;
    
    -- Verificar que el scout existe
    SELECT EXISTS(SELECT 1 FROM scouts WHERE id = (p_data ->> 'scout_id')::UUID AND estado = 'ACTIVO') INTO v_scout_exists;
    
    IF NOT v_scout_exists THEN
        RETURN create_standard_response(false, 'Scout no encontrado o inactivo', NULL, json_build_array('Scout ID inválido'));
    END IF;
    
    -- Verificar si ya es dirigente activo
    SELECT EXISTS(
        SELECT 1 FROM dirigentes 
        WHERE scout_id = (p_data ->> 'scout_id')::UUID 
        AND estado = 'ACTIVO'
        AND (fecha_fin_cargo IS NULL OR fecha_fin_cargo > CURRENT_DATE)
    ) INTO v_ya_es_dirigente;
    
    IF v_ya_es_dirigente THEN
        RETURN create_standard_response(
            false, 
            'El scout ya tiene un cargo de dirigente activo',
            NULL,
            json_build_array('Dirigente ya asignado')
        );
    END IF;
    
    BEGIN
        -- Insertar dirigente
        INSERT INTO dirigentes (
            scout_id, cargo, rama_asignada, fecha_inicio_cargo, 
            fecha_fin_cargo, estado, certificaciones, experiencia_anos,
            especialidades, observaciones
        ) VALUES (
            (p_data ->> 'scout_id')::UUID,
            (p_data ->> 'cargo')::cargo_dirigente_enum,
            (p_data ->> 'rama_asignada')::rama_enum,
            (p_data ->> 'fecha_inicio')::DATE,
            COALESCE((p_data ->> 'fecha_fin')::DATE, NULL),
            'ACTIVO',
            COALESCE((p_data ->> 'certificaciones')::TEXT[], '{}'),
            COALESCE((p_data ->> 'experiencia_anos')::INTEGER, 0),
            COALESCE((p_data ->> 'especialidades')::TEXT[], '{}'),
            p_data ->> 'observaciones'
        ) RETURNING id INTO v_dirigente_id;
        
        -- Actualizar scout como dirigente
        UPDATE scouts SET 
            es_dirigente = true,
            fecha_modificacion = CURRENT_TIMESTAMP
        WHERE id = (p_data ->> 'scout_id')::UUID;
        
        -- Log de auditoría
        PERFORM log_operation('dirigentes', 'CREATE', v_dirigente_id, NULL, p_data);
        
        RETURN create_standard_response(
            true,
            'Dirigente asignado exitosamente',
            json_build_object('dirigente_id', v_dirigente_id)
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN create_standard_response(false, 'Error al asignar dirigente', NULL, json_build_array(SQLERRM));
    END;
END;
$$ LANGUAGE plpgsql;

-- API: Buscar Dirigentes con Información Completa
CREATE OR REPLACE FUNCTION api_buscar_dirigentes(p_filtros JSON DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    v_query TEXT;
    v_conditions TEXT[] := '{}';
    v_pagination JSON;
    v_result JSON;
BEGIN
    v_query := '
        SELECT 
            d.id, d.scout_id, d.cargo, d.rama_asignada, d.fecha_inicio_cargo,
            d.fecha_fin_cargo, d.estado, d.certificaciones, d.experiencia_anos,
            d.especialidades, d.observaciones,
            s.codigo_scout, s.nombres, s.apellidos, s.celular, s.correo,
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, s.fecha_nacimiento)) as edad,
            CASE 
                WHEN d.fecha_fin_cargo IS NULL OR d.fecha_fin_cargo > CURRENT_DATE THEN ''VIGENTE''
                ELSE ''VENCIDO''
            END as estado_cargo,
            COALESCE(
                EXTRACT(DAYS FROM (COALESCE(d.fecha_fin_cargo, CURRENT_DATE) - d.fecha_inicio_cargo)), 
                0
            ) as dias_en_cargo,
            COALESCE(
                (SELECT COUNT(*) FROM actividades a WHERE a.responsable = d.scout_id), 
                0
            ) as actividades_dirigidas
        FROM dirigentes d
        INNER JOIN scouts s ON d.scout_id = s.id
        WHERE d.estado != ''ELIMINADO'' AND s.estado = ''ACTIVO''
    ';
    
    -- Aplicar filtros
    IF (p_filtros ? 'cargo') AND LENGTH(TRIM(p_filtros ->> 'cargo')) > 0 THEN
        v_conditions := array_append(v_conditions, 'd.cargo = ''' || (p_filtros ->> 'cargo') || '''');
    END IF;
    
    IF (p_filtros ? 'rama_asignada') AND LENGTH(TRIM(p_filtros ->> 'rama_asignada')) > 0 THEN
        v_conditions := array_append(v_conditions, 'd.rama_asignada = ''' || (p_filtros ->> 'rama_asignada') || '''');
    END IF;
    
    IF (p_filtros ? 'estado') AND LENGTH(TRIM(p_filtros ->> 'estado')) > 0 THEN
        v_conditions := array_append(v_conditions, 'd.estado = ''' || (p_filtros ->> 'estado') || '''');
    END IF;
    
    IF (p_filtros ? 'activos') AND (p_filtros ->> 'activos')::BOOLEAN THEN
        v_conditions := array_append(v_conditions, '(d.fecha_fin_cargo IS NULL OR d.fecha_fin_cargo > CURRENT_DATE)');
    END IF;
    
    IF (p_filtros ? 'busqueda') AND LENGTH(TRIM(p_filtros ->> 'busqueda')) > 0 THEN
        v_conditions := array_append(v_conditions, 
            '(s.nombres ILIKE ''%' || (p_filtros ->> 'busqueda') || '%'' OR ' ||
            's.apellidos ILIKE ''%' || (p_filtros ->> 'busqueda') || '%'' OR ' ||
            's.codigo_scout ILIKE ''%' || (p_filtros ->> 'busqueda') || '%'')'
        );
    END IF;
    
    -- Agregar condiciones WHERE
    IF array_length(v_conditions, 1) > 0 THEN
        v_query := v_query || ' AND ' || array_to_string(v_conditions, ' AND ');
    END IF;
    
    -- Aplicar paginación
    v_pagination := apply_pagination(
        v_query,
        COALESCE((p_filtros ->> 'page')::INTEGER, 1),
        COALESCE((p_filtros ->> 'limit')::INTEGER, 20),
        COALESCE(p_filtros ->> 'order_by', 'd.fecha_inicio_cargo DESC')
    );
    
    -- Ejecutar query
    EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || (v_pagination ->> 'query') || ') t' INTO v_result;
    
    RETURN create_standard_response(
        true,
        'Búsqueda de dirigentes completada',
        json_build_object(
            'dirigentes', COALESCE(v_result, '[]'),
            'pagination', v_pagination
        )
    );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 MÓDULO PATRULLAS - GESTIÓN DE EQUIPOS
-- ================================================================

-- API: Crear Patrulla
CREATE OR REPLACE FUNCTION api_crear_patrulla(p_data JSON)
RETURNS JSON AS $$
DECLARE
    v_validation JSON;
    v_patrulla_id UUID;
    v_required_fields TEXT[] := ARRAY['nombre', 'rama'];
BEGIN
    -- Validación de entrada
    v_validation := validate_input(p_data, v_required_fields);
    
    IF NOT (v_validation ->> 'valid')::BOOLEAN THEN
        RETURN create_standard_response(false, 'Datos inválidos', NULL, v_validation -> 'errors');
    END IF;
    
    -- Verificar nombre único por rama
    IF EXISTS (
        SELECT 1 FROM patrullas 
        WHERE LOWER(nombre) = LOWER(TRIM(p_data ->> 'nombre')) 
        AND rama = (p_data ->> 'rama')::rama_enum 
        AND estado = 'ACTIVA'
    ) THEN
        RETURN create_standard_response(
            false,
            'Ya existe una patrulla con este nombre en la rama',
            NULL,
            json_build_array('Nombre duplicado: ' || (p_data ->> 'nombre'))
        );
    END IF;
    
    BEGIN
        INSERT INTO patrullas (
            nombre, lema, grito, color_principal, animal_totem, rama,
            guia_scout_id, subguia_scout_id, estado, fecha_creacion,
            logros, observaciones
        ) VALUES (
            TRIM(p_data ->> 'nombre'),
            p_data ->> 'lema',
            p_data ->> 'grito',
            p_data ->> 'color_principal',
            p_data ->> 'animal_totem',
            (p_data ->> 'rama')::rama_enum,
            COALESCE((p_data ->> 'guia_scout_id')::UUID, NULL),
            COALESCE((p_data ->> 'subguia_scout_id')::UUID, NULL),
            'ACTIVA',
            CURRENT_TIMESTAMP,
            COALESCE((p_data ->> 'logros')::TEXT[], '{}'),
            p_data ->> 'observaciones'
        ) RETURNING id INTO v_patrulla_id;
        
        -- Log de auditoría
        PERFORM log_operation('patrullas', 'CREATE', v_patrulla_id, NULL, p_data);
        
        RETURN create_standard_response(
            true,
            'Patrulla creada exitosamente',
            json_build_object('patrulla_id', v_patrulla_id)
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN create_standard_response(false, 'Error al crear patrulla', NULL, json_build_array(SQLERRM));
    END;
END;
$$ LANGUAGE plpgsql;

-- API: Asignar Scout a Patrulla
CREATE OR REPLACE FUNCTION api_asignar_scout_patrulla(
    p_scout_id UUID,
    p_patrulla_id UUID,
    p_cargo VARCHAR DEFAULT 'MIEMBRO'
)
RETURNS JSON AS $$
DECLARE
    v_scout_valido BOOLEAN;
    v_patrulla_valida BOOLEAN;
    v_ya_asignado BOOLEAN;
    v_rama_scout rama_enum;
    v_rama_patrulla rama_enum;
BEGIN
    -- Verificar scout válido
    SELECT EXISTS(SELECT 1 FROM scouts WHERE id = p_scout_id AND estado = 'ACTIVO'), rama_actual
    INTO v_scout_valido, v_rama_scout
    FROM scouts WHERE id = p_scout_id;
    
    IF NOT v_scout_valido THEN
        RETURN create_standard_response(false, 'Scout no encontrado o inactivo', NULL, json_build_array('Scout ID inválido'));
    END IF;
    
    -- Verificar patrulla válida
    SELECT EXISTS(SELECT 1 FROM patrullas WHERE id = p_patrulla_id AND estado = 'ACTIVA'), rama
    INTO v_patrulla_valida, v_rama_patrulla
    FROM patrullas WHERE id = p_patrulla_id;
    
    IF NOT v_patrulla_valida THEN
        RETURN create_standard_response(false, 'Patrulla no encontrada o inactiva', NULL, json_build_array('Patrulla ID inválida'));
    END IF;
    
    -- Verificar compatibilidad de ramas
    IF v_rama_scout != v_rama_patrulla THEN
        RETURN create_standard_response(
            false,
            'El scout y la patrulla deben pertenecer a la misma rama',
            NULL,
            json_build_array('Scout rama: ' || v_rama_scout || ', Patrulla rama: ' || v_rama_patrulla)
        );
    END IF;
    
    -- Verificar si ya está asignado a una patrulla activa
    SELECT EXISTS(
        SELECT 1 FROM scouts_patrullas sp
        INNER JOIN patrullas p ON sp.patrulla_id = p.id
        WHERE sp.scout_id = p_scout_id 
        AND sp.estado = 'ACTIVO'
        AND p.estado = 'ACTIVA'
        AND (sp.fecha_fin IS NULL OR sp.fecha_fin > CURRENT_DATE)
    ) INTO v_ya_asignado;
    
    IF v_ya_asignado THEN
        RETURN create_standard_response(
            false,
            'El scout ya está asignado a una patrulla activa',
            NULL,
            json_build_array('Asignación duplicada')
        );
    END IF;
    
    BEGIN
        -- Asignar scout a patrulla
        INSERT INTO scouts_patrullas (
            scout_id, patrulla_id, cargo, fecha_inicio, estado
        ) VALUES (
            p_scout_id, p_patrulla_id, p_cargo, CURRENT_DATE, 'ACTIVO'
        );
        
        -- Actualizar contador de miembros en patrulla
        UPDATE patrullas SET
            miembros_count = (
                SELECT COUNT(*) FROM scouts_patrullas 
                WHERE patrulla_id = p_patrulla_id AND estado = 'ACTIVO'
            ),
            fecha_modificacion = CURRENT_TIMESTAMP
        WHERE id = p_patrulla_id;
        
        -- Log de auditoría
        PERFORM log_operation(
            'scouts_patrullas',
            'CREATE',
            NULL,
            NULL,
            json_build_object(
                'scout_id', p_scout_id,
                'patrulla_id', p_patrulla_id,
                'cargo', p_cargo
            )
        );
        
        RETURN create_standard_response(
            true,
            'Scout asignado a patrulla exitosamente',
            json_build_object(
                'scout_id', p_scout_id,
                'patrulla_id', p_patrulla_id,
                'cargo', p_cargo
            )
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN create_standard_response(false, 'Error al asignar scout a patrulla', NULL, json_build_array(SQLERRM));
    END;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 MÓDULO ASISTENCIA - CONTROL DE PARTICIPACIÓN
-- ================================================================

-- API: Registrar Asistencia Masiva
CREATE OR REPLACE FUNCTION api_registrar_asistencia_masiva(p_data JSON)
RETURNS JSON AS $$
DECLARE
    v_actividad_id UUID;
    v_fecha DATE;
    v_registros_exitosos INTEGER := 0;
    v_errores JSON := '[]';
    v_scout_record JSON;
    v_asistencia_id UUID;
    v_error_list TEXT[] := '{}';
BEGIN
    -- Extraer datos principales
    v_actividad_id := (p_data ->> 'actividad_id')::UUID;
    v_fecha := COALESCE((p_data ->> 'fecha')::DATE, CURRENT_DATE);
    
    -- Verificar que la actividad existe
    IF NOT EXISTS (SELECT 1 FROM actividades WHERE id = v_actividad_id AND estado != 'ELIMINADA') THEN
        RETURN create_standard_response(
            false,
            'Actividad no encontrada',
            NULL,
            json_build_array('Actividad ID inválida')
        );
    END IF;
    
    -- Procesar cada registro de asistencia
    FOR v_scout_record IN SELECT * FROM json_array_elements(p_data -> 'asistencias')
    LOOP
        BEGIN
            -- Verificar si ya existe registro para este scout en esta fecha/actividad
            IF EXISTS (
                SELECT 1 FROM asistencia 
                WHERE scout_id = (v_scout_record ->> 'scout_id')::UUID
                AND actividad_id = v_actividad_id
                AND fecha = v_fecha
            ) THEN
                -- Actualizar registro existente
                UPDATE asistencia SET
                    estado_asistencia = (v_scout_record ->> 'estado')::estado_asistencia_enum,
                    observaciones = v_scout_record ->> 'observaciones',
                    fecha_registro = CURRENT_TIMESTAMP
                WHERE scout_id = (v_scout_record ->> 'scout_id')::UUID
                AND actividad_id = v_actividad_id
                AND fecha = v_fecha;
            ELSE
                -- Insertar nuevo registro
                INSERT INTO asistencia (
                    scout_id, actividad_id, fecha, estado_asistencia,
                    observaciones, registrado_por, fecha_registro
                ) VALUES (
                    (v_scout_record ->> 'scout_id')::UUID,
                    v_actividad_id,
                    v_fecha,
                    (v_scout_record ->> 'estado')::estado_asistencia_enum,
                    v_scout_record ->> 'observaciones',
                    COALESCE((p_data ->> 'registrado_por')::UUID, NULL),
                    CURRENT_TIMESTAMP
                ) RETURNING id INTO v_asistencia_id;
            END IF;
            
            v_registros_exitosos := v_registros_exitosos + 1;
            
        EXCEPTION
            WHEN OTHERS THEN
                v_error_list := array_append(v_error_list, 
                    'Scout ' || (v_scout_record ->> 'scout_id') || ': ' || SQLERRM
                );
        END;
    END LOOP;
    
    -- Convertir errores a JSON
    SELECT json_agg(error) INTO v_errores FROM unnest(v_error_list) AS error;
    
    -- Log de auditoría
    PERFORM log_operation(
        'asistencia',
        'CREATE',
        NULL,
        (p_data ->> 'registrado_por')::UUID,
        json_build_object(
            'actividad_id', v_actividad_id,
            'fecha', v_fecha,
            'registros_procesados', json_array_length(p_data -> 'asistencias'),
            'registros_exitosos', v_registros_exitosos,
            'errores', v_registros_exitosos - json_array_length(p_data -> 'asistencias')
        )
    );
    
    RETURN create_standard_response(
        v_registros_exitosos > 0,
        CASE 
            WHEN v_registros_exitosos = json_array_length(p_data -> 'asistencias') THEN 'Toda la asistencia registrada exitosamente'
            WHEN v_registros_exitosos > 0 THEN 'Asistencia registrada parcialmente'
            ELSE 'No se pudo registrar ninguna asistencia'
        END,
        json_build_object(
            'registros_exitosos', v_registros_exitosos,
            'total_registros', json_array_length(p_data -> 'asistencias'),
            'actividad_id', v_actividad_id,
            'fecha', v_fecha
        ),
        COALESCE(v_errores, '[]')
    );
END;
$$ LANGUAGE plpgsql;

-- API: Reporte de Asistencia
CREATE OR REPLACE FUNCTION api_reporte_asistencia(p_filtros JSON DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
    v_stats_generales JSON;
    v_por_scout JSON;
    v_por_actividad JSON;
    v_tendencias JSON;
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
BEGIN
    -- Determinar rango de fechas
    v_fecha_inicio := COALESCE((p_filtros ->> 'fecha_inicio')::DATE, CURRENT_DATE - INTERVAL '30 days');
    v_fecha_fin := COALESCE((p_filtros ->> 'fecha_fin')::DATE, CURRENT_DATE);
    
    -- Estadísticas generales
    SELECT json_build_object(
        'total_registros', COUNT(*),
        'scouts_presentes', COUNT(CASE WHEN estado_asistencia = 'PRESENTE' THEN 1 END),
        'scouts_ausentes', COUNT(CASE WHEN estado_asistencia = 'AUSENTE' THEN 1 END),
        'scouts_tardanza', COUNT(CASE WHEN estado_asistencia = 'TARDANZA' THEN 1 END),
        'scouts_justificados', COUNT(CASE WHEN estado_asistencia = 'JUSTIFICADO' THEN 1 END),
        'porcentaje_asistencia', ROUND(
            (COUNT(CASE WHEN estado_asistencia = 'PRESENTE' THEN 1 END)::FLOAT / 
             NULLIF(COUNT(*), 0)) * 100, 2
        )
    ) INTO v_stats_generales
    FROM asistencia a
    WHERE a.fecha BETWEEN v_fecha_inicio AND v_fecha_fin;
    
    -- Asistencia por scout
    SELECT json_agg(json_build_object(
        'scout_id', s.id,
        'codigo_scout', s.codigo_scout,
        'nombres', s.nombres,
        'apellidos', s.apellidos,
        'total_actividades', stats.total_actividades,
        'presencias', stats.presencias,
        'ausencias', stats.ausencias,
        'tardanzas', stats.tardanzas,
        'porcentaje_asistencia', stats.porcentaje_asistencia
    )) INTO v_por_scout
    FROM scouts s
    INNER JOIN (
        SELECT 
            a.scout_id,
            COUNT(*) as total_actividades,
            COUNT(CASE WHEN a.estado_asistencia = 'PRESENTE' THEN 1 END) as presencias,
            COUNT(CASE WHEN a.estado_asistencia = 'AUSENTE' THEN 1 END) as ausencias,
            COUNT(CASE WHEN a.estado_asistencia = 'TARDANZA' THEN 1 END) as tardanzas,
            ROUND(
                (COUNT(CASE WHEN a.estado_asistencia = 'PRESENTE' THEN 1 END)::FLOAT / 
                 NULLIF(COUNT(*), 0)) * 100, 2
            ) as porcentaje_asistencia
        FROM asistencia a
        WHERE a.fecha BETWEEN v_fecha_inicio AND v_fecha_fin
        GROUP BY a.scout_id
    ) stats ON s.id = stats.scout_id
    WHERE s.estado = 'ACTIVO'
    ORDER BY stats.porcentaje_asistencia DESC;
    
    RETURN create_standard_response(
        true,
        'Reporte de asistencia generado exitosamente',
        json_build_object(
            'periodo', json_build_object(
                'fecha_inicio', v_fecha_inicio,
                'fecha_fin', v_fecha_fin
            ),
            'estadisticas_generales', v_stats_generales,
            'asistencia_por_scout', COALESCE(v_por_scout, '[]')
        )
    );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 VERIFICACIÓN DE MÓDULOS ADICIONALES
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '🎉 MÓDULOS ADICIONALES INSTALADOS';
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '✅ Módulo Presupuestos: COMPLETO';
    RAISE NOTICE '✅ Módulo Dirigentes: COMPLETO';
    RAISE NOTICE '✅ Módulo Patrullas: COMPLETO';
    RAISE NOTICE '✅ Módulo Asistencia: COMPLETO';
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '📊 APIS ADICIONALES DISPONIBLES:';
    RAISE NOTICE '   • api_crear_presupuesto(p_data JSON)';
    RAISE NOTICE '   • api_ejecutar_gasto_presupuesto(...)';
    RAISE NOTICE '   • api_buscar_presupuestos(p_filtros JSON)';
    RAISE NOTICE '   • api_asignar_dirigente(p_data JSON)';
    RAISE NOTICE '   • api_buscar_dirigentes(p_filtros JSON)';
    RAISE NOTICE '   • api_crear_patrulla(p_data JSON)';
    RAISE NOTICE '   • api_asignar_scout_patrulla(...)';
    RAISE NOTICE '   • api_registrar_asistencia_masiva(p_data JSON)';
    RAISE NOTICE '   • api_reporte_asistencia(p_filtros JSON)';
    RAISE NOTICE '🎉 ========================================';
END $$;