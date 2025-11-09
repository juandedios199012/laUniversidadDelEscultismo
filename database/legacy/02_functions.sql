-- ================================================================
-- 🔧 DATABASE FUNCTIONS - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 02_functions.sql
-- Propósito: Crear todas las funciones de negocio del sistema
-- Orden de ejecución: 3° (Después de schema)
-- ================================================================

-- ================================================================
-- LIMPIEZA DE FUNCIONES EXISTENTES
-- ================================================================

-- Eliminar funciones que podrían haber conflictos de tipo de retorno
DROP FUNCTION IF EXISTS asignar_scout_patrulla(UUID, UUID, VARCHAR);
DROP FUNCTION IF EXISTS generar_codigo_dirigente();
DROP FUNCTION IF EXISTS generar_codigo_patrulla();

-- ================================================================
-- FUNCIONES DE GENERACIÓN DE CÓDIGOS
-- ================================================================

-- Generar código único para scouts
CREATE OR REPLACE FUNCTION generar_codigo_scout()
RETURNS TEXT AS $$
BEGIN
    RETURN generar_codigo('SCT', 'scouts', 'codigo_scout');
END;
$$ LANGUAGE plpgsql;

-- Generar código único para dirigentes
CREATE OR REPLACE FUNCTION generar_codigo_dirigente()
RETURNS TEXT AS $$
BEGIN
    RETURN generar_codigo('DIR', 'dirigentes', 'codigo_dirigente');
END;
$$ LANGUAGE plpgsql;

-- Generar código único para patrullas
CREATE OR REPLACE FUNCTION generar_codigo_patrulla()
RETURNS TEXT AS $$
BEGIN
    RETURN generar_codigo('PTR', 'patrullas', 'codigo_patrulla');
END;
$$ LANGUAGE plpgsql;

-- Generar código único para actividades
CREATE OR REPLACE FUNCTION generar_codigo_actividad()
RETURNS TEXT AS $$
BEGIN
    RETURN generar_codigo('ACT', 'actividades_scout', 'codigo_actividad');
END;
$$ LANGUAGE plpgsql;

-- Generar código único para inscripciones anuales
CREATE OR REPLACE FUNCTION generar_codigo_asociado(p_ano INTEGER)
RETURNS TEXT AS $$
DECLARE
    contador INTEGER;
    nuevo_codigo TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_asociado FROM 'ASC-\d{4}-(\d+)') AS INTEGER)), 0) + 1
    INTO contador
    FROM inscripciones_anuales
    WHERE ano = p_ano;
    
    nuevo_codigo := 'ASC-' || p_ano || '-' || LPAD(contador::TEXT, 3, '0');
    
    RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNCIONES DE CÁLCULO Y UTILIDAD
-- ================================================================

-- Calcular edad actual
CREATE OR REPLACE FUNCTION calcular_edad(fecha_nacimiento DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_nacimiento))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Determinar rama por edad
CREATE OR REPLACE FUNCTION determinar_rama_por_edad(fecha_nacimiento DATE)
RETURNS rama_enum AS $$
DECLARE
    edad INTEGER;
BEGIN
    edad := calcular_edad(fecha_nacimiento);
    
    CASE 
        WHEN edad BETWEEN 6 AND 10 THEN RETURN 'LOBATOS';
        WHEN edad BETWEEN 11 AND 14 THEN RETURN 'SCOUTS';
        WHEN edad BETWEEN 15 AND 17 THEN RETURN 'ROVERS';
        WHEN edad >= 18 THEN RETURN 'DIRIGENTES';
        ELSE RETURN NULL;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Validar email
CREATE OR REPLACE FUNCTION validar_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ================================================================
-- FUNCIONES DE NEGOCIO PRINCIPALES
-- ================================================================

-- Registrar scout completo
CREATE OR REPLACE FUNCTION registrar_scout_completo(
    -- Datos del scout
    p_nombres VARCHAR(255),
    p_apellidos VARCHAR(255),
    p_fecha_nacimiento DATE,
    p_numero_documento VARCHAR(20),
    p_tipo_documento tipo_documento_enum DEFAULT 'DNI',
    p_celular VARCHAR(20) DEFAULT NULL,
    p_correo VARCHAR(255) DEFAULT NULL,
    p_departamento VARCHAR(100) DEFAULT NULL,
    p_provincia VARCHAR(100) DEFAULT NULL,
    p_distrito VARCHAR(100) DEFAULT NULL,
    p_direccion TEXT DEFAULT NULL,
    p_centro_estudio VARCHAR(255) DEFAULT NULL,
    p_ocupacion VARCHAR(255) DEFAULT NULL,
    p_centro_laboral VARCHAR(255) DEFAULT NULL,
    p_es_dirigente BOOLEAN DEFAULT FALSE,
    p_rama_actual rama_enum DEFAULT NULL,
    -- Datos del familiar
    p_familiar_nombres VARCHAR(255) DEFAULT NULL,
    p_familiar_apellidos VARCHAR(255) DEFAULT NULL,
    p_parentesco parentesco_enum DEFAULT NULL,
    p_familiar_celular VARCHAR(20) DEFAULT NULL,
    p_familiar_correo VARCHAR(255) DEFAULT NULL,
    p_familiar_ocupacion VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_scout_id UUID;
    v_codigo_scout TEXT;
    v_rama_calculada rama_enum;
    v_edad INTEGER;
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
    
    IF p_numero_documento IS NULL OR LENGTH(TRIM(p_numero_documento)) = 0 THEN
        RAISE EXCEPTION 'El número de documento es obligatorio';
    END IF;
    
    -- Validar edad mínima
    v_edad := calcular_edad(p_fecha_nacimiento);
    IF v_edad < 6 THEN
        RAISE EXCEPTION 'La edad mínima para registro es 6 años';
    END IF;
    
    -- Validar email si se proporciona
    IF NOT validar_email(p_correo) THEN
        RAISE EXCEPTION 'Formato de correo electrónico inválido';
    END IF;
    
    IF NOT validar_email(p_familiar_correo) THEN
        RAISE EXCEPTION 'Formato de correo del familiar inválido';
    END IF;
    
    -- Verificar documento único
    IF EXISTS (SELECT 1 FROM scouts WHERE numero_documento = p_numero_documento) THEN
        RAISE EXCEPTION 'Ya existe un scout con el número de documento: %', p_numero_documento;
    END IF;
    
    -- Determinar rama si no se especifica
    IF p_rama_actual IS NULL THEN
        v_rama_calculada := determinar_rama_por_edad(p_fecha_nacimiento);
    ELSE
        v_rama_calculada := p_rama_actual;
    END IF;
    
    -- Generar código único
    v_codigo_scout := generar_codigo_scout();
    
    -- Insertar scout
    INSERT INTO scouts (
        codigo_scout,
        nombres,
        apellidos,
        fecha_nacimiento,
        tipo_documento,
        numero_documento,
        celular,
        correo,
        departamento,
        provincia,
        distrito,
        direccion,
        centro_estudio,
        ocupacion,
        centro_laboral,
        es_dirigente,
        rama_actual
    ) VALUES (
        v_codigo_scout,
        TRIM(p_nombres),
        TRIM(p_apellidos),
        p_fecha_nacimiento,
        p_tipo_documento,
        TRIM(p_numero_documento),
        p_celular,
        p_correo,
        p_departamento,
        p_provincia,
        p_distrito,
        p_direccion,
        p_centro_estudio,
        p_ocupacion,
        p_centro_laboral,
        p_es_dirigente,
        v_rama_calculada
    ) RETURNING id INTO v_scout_id;
    
    -- Insertar familiar si se proporciona información
    IF p_familiar_nombres IS NOT NULL AND LENGTH(TRIM(p_familiar_nombres)) > 0 THEN
        INSERT INTO familiares_scout (
            scout_id,
            nombres,
            apellidos,
            parentesco,
            celular,
            correo,
            ocupacion
        ) VALUES (
            v_scout_id,
            TRIM(p_familiar_nombres),
            COALESCE(TRIM(p_familiar_apellidos), ''),
            COALESCE(p_parentesco, 'OTRO'),
            p_familiar_celular,
            p_familiar_correo,
            p_familiar_ocupacion
        );
    END IF;
    
    -- Si es dirigente, crear registro en tabla dirigentes
    IF p_es_dirigente THEN
        INSERT INTO dirigentes (
            scout_id,
            codigo_dirigente,
            rama_responsable
        ) VALUES (
            v_scout_id,
            generar_codigo_dirigente(),
            v_rama_calculada
        );
    END IF;
    
    RETURN v_scout_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al registrar scout: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNCIONES DE CAMBIO DE RAMA
-- ================================================================

-- Cambiar rama de scout
CREATE OR REPLACE FUNCTION cambiar_rama_scout(
    p_scout_id UUID,
    p_nueva_rama rama_enum,
    p_motivo TEXT DEFAULT NULL,
    p_autorizado_por_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_rama_anterior rama_enum;
    v_scout_existe BOOLEAN;
BEGIN
    -- Verificar que el scout existe
    SELECT rama_actual INTO v_rama_anterior
    FROM scouts 
    WHERE id = p_scout_id AND estado = 'ACTIVO';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Scout no encontrado o inactivo';
    END IF;
    
    -- Verificar que la rama es diferente
    IF v_rama_anterior = p_nueva_rama THEN
        RAISE EXCEPTION 'El scout ya pertenece a la rama %', p_nueva_rama;
    END IF;
    
    -- Actualizar rama del scout
    UPDATE scouts 
    SET rama_actual = p_nueva_rama,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_scout_id;
    
    -- Registrar en historial (si existe la tabla)
    INSERT INTO historial_cambios (
        tabla_afectada,
        registro_id,
        tipo_cambio,
        campos_modificados,
        valores_anteriores,
        valores_nuevos,
        modificado_por_id,
        motivo
    ) VALUES (
        'scouts',
        p_scout_id,
        'UPDATE',
        ARRAY['rama_actual'],
        jsonb_build_object('rama_actual', v_rama_anterior),
        jsonb_build_object('rama_actual', p_nueva_rama),
        p_autorizado_por_id,
        COALESCE(p_motivo, 'Cambio de rama automático')
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al cambiar rama: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNCIONES DE PATRULLAS
-- ================================================================

-- Asignar scout a patrulla
CREATE OR REPLACE FUNCTION asignar_scout_patrulla(
    p_scout_id UUID,
    p_patrulla_id UUID,
    p_cargo_patrulla VARCHAR(50) DEFAULT 'MIEMBRO'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_rama_scout rama_enum;
    v_rama_patrulla rama_enum;
BEGIN
    -- Verificar que el scout existe y obtener su rama
    SELECT rama_actual INTO v_rama_scout
    FROM scouts 
    WHERE id = p_scout_id AND estado = 'ACTIVO';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Scout no encontrado o inactivo';
    END IF;
    
    -- Verificar que la patrulla existe y obtener su rama
    SELECT rama INTO v_rama_patrulla
    FROM patrullas 
    WHERE id = p_patrulla_id AND estado = 'ACTIVO';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Patrulla no encontrada o inactiva';
    END IF;
    
    -- Verificar que las ramas coinciden
    IF v_rama_scout != v_rama_patrulla THEN
        RAISE EXCEPTION 'La rama del scout (%) no coincide con la rama de la patrulla (%)', 
                       v_rama_scout, v_rama_patrulla;
    END IF;
    
    -- Verificar que el scout no esté activo en otra patrulla
    IF EXISTS (
        SELECT 1 FROM miembros_patrulla 
        WHERE scout_id = p_scout_id 
        AND estado_miembro = 'ACTIVO'
        AND patrulla_id != p_patrulla_id
    ) THEN
        RAISE EXCEPTION 'El scout ya pertenece activamente a otra patrulla';
    END IF;
    
    -- Desactivar membresía actual en la misma patrulla si existe
    UPDATE miembros_patrulla 
    SET estado_miembro = 'INACTIVO', 
        fecha_salida = CURRENT_DATE
    WHERE scout_id = p_scout_id 
    AND patrulla_id = p_patrulla_id
    AND estado_miembro = 'ACTIVO';
    
    -- Insertar nueva membresía
    INSERT INTO miembros_patrulla (
        scout_id,
        patrulla_id,
        cargo_patrulla,
        estado_miembro
    ) VALUES (
        p_scout_id,
        p_patrulla_id,
        p_cargo_patrulla,
        'ACTIVO'
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al asignar scout a patrulla: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNCIONES DE ACTIVIDADES
-- ================================================================

-- Inscribir scout en actividad
CREATE OR REPLACE FUNCTION inscribir_scout_actividad(
    p_scout_id UUID,
    p_actividad_id UUID,
    p_requiere_transporte BOOLEAN DEFAULT FALSE,
    p_autorizacion_familiar BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
DECLARE
    v_actividad_record RECORD;
    v_scout_edad INTEGER;
    v_total_participantes INTEGER;
BEGIN
    -- Obtener datos de la actividad
    SELECT fecha_inicio, fecha_fin, estado, maximo_participantes, 
           edad_minima, edad_maxima, requiere_autorizacion, rama_objetivo
    INTO v_actividad_record
    FROM actividades_scout 
    WHERE id = p_actividad_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Actividad no encontrada';
    END IF;
    
    -- Verificar estado de la actividad
    IF v_actividad_record.estado NOT IN ('PLANIFICADA', 'CONFIRMADA') THEN
        RAISE EXCEPTION 'No se puede inscribir en una actividad con estado: %', v_actividad_record.estado;
    END IF;
    
    -- Verificar que la actividad no haya comenzado
    IF v_actividad_record.fecha_inicio <= CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'No se puede inscribir en una actividad que ya comenzó';
    END IF;
    
    -- Obtener edad del scout y verificar restricciones
    SELECT calcular_edad(fecha_nacimiento) INTO v_scout_edad
    FROM scouts 
    WHERE id = p_scout_id AND estado = 'ACTIVO';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Scout no encontrado o inactivo';
    END IF;
    
    -- Verificar restricciones de edad
    IF v_actividad_record.edad_minima IS NOT NULL AND v_scout_edad < v_actividad_record.edad_minima THEN
        RAISE EXCEPTION 'El scout no cumple la edad mínima requerida: % años', v_actividad_record.edad_minima;
    END IF;
    
    IF v_actividad_record.edad_maxima IS NOT NULL AND v_scout_edad > v_actividad_record.edad_maxima THEN
        RAISE EXCEPTION 'El scout excede la edad máxima permitida: % años', v_actividad_record.edad_maxima;
    END IF;
    
    -- Verificar cupo máximo
    IF v_actividad_record.maximo_participantes IS NOT NULL THEN
        SELECT COUNT(*) INTO v_total_participantes
        FROM participantes_actividad 
        WHERE actividad_id = p_actividad_id 
        AND estado_participacion IN ('INSCRITO', 'CONFIRMADO');
        
        IF v_total_participantes >= v_actividad_record.maximo_participantes THEN
            RAISE EXCEPTION 'La actividad ha alcanzado el cupo máximo de participantes';
        END IF;
    END IF;
    
    -- Verificar que no esté ya inscrito
    IF EXISTS (
        SELECT 1 FROM participantes_actividad 
        WHERE scout_id = p_scout_id AND actividad_id = p_actividad_id
        AND estado_participacion != 'CANCELADO'
    ) THEN
        RAISE EXCEPTION 'El scout ya está inscrito en esta actividad';
    END IF;
    
    -- Insertar inscripción
    INSERT INTO participantes_actividad (
        actividad_id,
        scout_id,
        estado_participacion,
        requiere_transporte,
        autorizacion_familiar
    ) VALUES (
        p_actividad_id,
        p_scout_id,
        CASE 
            WHEN v_actividad_record.requiere_autorizacion THEN 'INSCRITO'
            ELSE 'CONFIRMADO'
        END,
        p_requiere_transporte,
        p_autorizacion_familiar
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al inscribir scout en actividad: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNCIONES DE ASISTENCIA
-- ================================================================

-- Registrar asistencia
CREATE OR REPLACE FUNCTION registrar_asistencia(
    p_scout_id UUID,
    p_fecha DATE,
    p_estado_asistencia VARCHAR(20),
    p_actividad_id UUID DEFAULT NULL,
    p_tipo_evento VARCHAR(50) DEFAULT 'REUNION_REGULAR',
    p_hora_llegada TIME DEFAULT NULL,
    p_hora_salida TIME DEFAULT NULL,
    p_justificacion TEXT DEFAULT NULL,
    p_registrado_por_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validaciones básicas
    IF p_scout_id IS NULL THEN
        RAISE EXCEPTION 'ID del scout es obligatorio';
    END IF;
    
    IF p_fecha IS NULL THEN
        RAISE EXCEPTION 'Fecha es obligatoria';
    END IF;
    
    IF p_estado_asistencia NOT IN ('PRESENTE', 'AUSENTE', 'TARDANZA', 'JUSTIFICADO') THEN
        RAISE EXCEPTION 'Estado de asistencia inválido: %', p_estado_asistencia;
    END IF;
    
    -- Verificar que el scout existe
    IF NOT EXISTS (SELECT 1 FROM scouts WHERE id = p_scout_id AND estado = 'ACTIVO') THEN
        RAISE EXCEPTION 'Scout no encontrado o inactivo';
    END IF;
    
    -- Insertar o actualizar asistencia
    INSERT INTO asistencias (
        scout_id,
        actividad_id,
        fecha,
        tipo_evento,
        estado_asistencia,
        hora_llegada,
        hora_salida,
        justificacion,
        registrado_por_id
    ) VALUES (
        p_scout_id,
        p_actividad_id,
        p_fecha,
        p_tipo_evento,
        p_estado_asistencia,
        p_hora_llegada,
        p_hora_salida,
        p_justificacion,
        p_registrado_por_id
    )
    ON CONFLICT (scout_id, fecha, tipo_evento) 
    DO UPDATE SET 
        estado_asistencia = p_estado_asistencia,
        hora_llegada = p_hora_llegada,
        hora_salida = p_hora_salida,
        justificacion = p_justificacion,
        registrado_por_id = p_registrado_por_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al registrar asistencia: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNCIONES DE ESTADÍSTICAS
-- ================================================================

-- Obtener estadísticas del grupo
CREATE OR REPLACE FUNCTION obtener_estadisticas_grupo()
RETURNS TABLE(
    total_scouts BIGINT,
    total_dirigentes BIGINT,
    scouts_nuevos_ultimo_año BIGINT,
    asistencia_promedio_mes NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM scouts WHERE estado = 'ACTIVO')::BIGINT,
        (SELECT COUNT(*) FROM scouts WHERE es_dirigente = TRUE AND estado = 'ACTIVO')::BIGINT,
        (SELECT COUNT(*) FROM scouts 
         WHERE fecha_ingreso >= CURRENT_DATE - INTERVAL '1 year' 
         AND estado = 'ACTIVO')::BIGINT,
        (SELECT COALESCE(
            AVG(CASE WHEN estado_asistencia = 'PRESENTE' THEN 100.0 ELSE 0.0 END), 
            0
        ) FROM asistencias 
         WHERE fecha >= CURRENT_DATE - INTERVAL '1 month')::NUMERIC;
END;
$$ LANGUAGE plpgsql;

-- Obtener estadísticas por rama
CREATE OR REPLACE FUNCTION obtener_estadisticas_por_rama()
RETURNS TABLE(
    rama rama_enum,
    total_scouts BIGINT,
    scouts_activos BIGINT,
    dirigentes_count BIGINT,
    patrullas_activas BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.rama_actual as rama,
        COUNT(*)::BIGINT as total_scouts,
        COUNT(CASE WHEN s.estado = 'ACTIVO' THEN 1 END)::BIGINT as scouts_activos,
        COUNT(CASE WHEN s.es_dirigente THEN 1 END)::BIGINT as dirigentes_count,
        COALESCE(p.patrullas_activas, 0)::BIGINT as patrullas_activas
    FROM scouts s
    LEFT JOIN (
        SELECT rama, COUNT(*) as patrullas_activas
        FROM patrullas 
        WHERE estado = 'ACTIVO'
        GROUP BY rama
    ) p ON s.rama_actual = p.rama
    WHERE s.rama_actual IS NOT NULL
    GROUP BY s.rama_actual, p.patrullas_activas
    ORDER BY 
        CASE s.rama_actual 
            WHEN 'LOBATOS' THEN 1 
            WHEN 'SCOUTS' THEN 2 
            WHEN 'ROVERS' THEN 3 
            WHEN 'DIRIGENTES' THEN 4 
            ELSE 5 
        END;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNCIONES DE MANTENIMIENTO
-- ================================================================

-- Limpiar datos obsoletos
CREATE OR REPLACE FUNCTION limpiar_datos_obsoletos()
RETURNS TEXT AS $$
DECLARE
    registros_eliminados INTEGER := 0;
    resultado TEXT;
BEGIN
    -- Eliminar asistencias muy antiguas (más de 3 años)
    DELETE FROM asistencias 
    WHERE fecha < CURRENT_DATE - INTERVAL '3 years';
    GET DIAGNOSTICS registros_eliminados = ROW_COUNT;
    
    resultado := 'Asistencias antiguas eliminadas: ' || registros_eliminados;
    
    -- Eliminar historial muy antiguo (más de 2 años)
    DELETE FROM historial_cambios 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '2 years';
    GET DIAGNOSTICS registros_eliminados = ROW_COUNT;
    
    resultado := resultado || ' | Historial antiguo eliminado: ' || registros_eliminados;
    
    -- Actualizar estadísticas de tablas
    ANALYZE scouts, familiares_scout, dirigentes, patrullas, actividades_scout;
    
    resultado := resultado || ' | Estadísticas actualizadas';
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNCIONES DE VALIDACIÓN
-- ================================================================

-- Validar integridad de datos
CREATE OR REPLACE FUNCTION validar_integridad_datos()
RETURNS TABLE(
    tabla VARCHAR(50),
    problema VARCHAR(200),
    cantidad BIGINT
) AS $$
BEGIN
    -- Scouts sin código
    RETURN QUERY
    SELECT 'scouts'::VARCHAR(50), 'Scouts sin código scout'::VARCHAR(200), 
           COUNT(*)::BIGINT
    FROM scouts WHERE codigo_scout IS NULL OR codigo_scout = '';
    
    -- Scouts con edad inconsistente
    RETURN QUERY
    SELECT 'scouts'::VARCHAR(50), 'Scouts con rama inconsistente para su edad'::VARCHAR(200),
           COUNT(*)::BIGINT
    FROM scouts 
    WHERE rama_actual != determinar_rama_por_edad(fecha_nacimiento)
    AND determinar_rama_por_edad(fecha_nacimiento) IS NOT NULL;
    
    -- Dirigentes sin scout asociado
    RETURN QUERY
    SELECT 'dirigentes'::VARCHAR(50), 'Dirigentes sin scout asociado válido'::VARCHAR(200),
           COUNT(*)::BIGINT
    FROM dirigentes d
    LEFT JOIN scouts s ON d.scout_id = s.id
    WHERE s.id IS NULL OR s.es_dirigente = FALSE;
    
    -- Patrullas sin dirigente
    RETURN QUERY
    SELECT 'patrullas'::VARCHAR(50), 'Patrullas activas sin dirigente responsable'::VARCHAR(200),
           COUNT(*)::BIGINT
    FROM patrullas 
    WHERE estado = 'ACTIVO' AND dirigente_responsable_id IS NULL;
    
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '🔧 FUNCIONES CREADAS EXITOSAMENTE' as estado,
    'Todas las funciones de negocio han sido implementadas' as mensaje,
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_schema = 'public' AND routine_type = 'FUNCTION')::TEXT || ' funciones disponibles' as resumen,
    NOW() as timestamp_creacion;