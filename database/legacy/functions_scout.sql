-- ============================================
-- DATABASE FUNCTIONS PARA SISTEMA SCOUT
-- ============================================
-- Funciones de negocio para el manejo de scouts

-- 1. Función para generar código único de scout
CREATE OR REPLACE FUNCTION generar_codigo_scout()
RETURNS TEXT AS $$
DECLARE
    nuevo_codigo TEXT;
    contador INTEGER;
    ano_actual TEXT;
BEGIN
    ano_actual := EXTRACT(year FROM CURRENT_DATE)::TEXT;
    
    -- Obtener el siguiente número secuencial
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_scout FROM 'SCT-' || ano_actual || '-(\d+)') AS INTEGER)), 0) + 1
    INTO contador
    FROM scouts
    WHERE codigo_scout LIKE 'SCT-' || ano_actual || '-%';
    
    -- Formatear con ceros a la izquierda
    nuevo_codigo := 'SCT-' || ano_actual || '-' || LPAD(contador::TEXT, 3, '0');
    
    RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para registrar scout completo con validaciones
CREATE OR REPLACE FUNCTION registrar_scout_completo(
    p_nombres TEXT,
    p_apellidos TEXT,
    p_fecha_nacimiento DATE,
    p_numero_documento TEXT,
    p_tipo_documento TEXT DEFAULT 'DNI',
    p_celular TEXT DEFAULT NULL,
    p_correo TEXT DEFAULT NULL,
    p_departamento TEXT DEFAULT NULL,
    p_provincia TEXT DEFAULT NULL,
    p_distrito TEXT DEFAULT NULL,
    p_direccion TEXT DEFAULT NULL,
    p_centro_estudio TEXT DEFAULT NULL,
    p_ocupacion TEXT DEFAULT NULL,
    p_centro_laboral TEXT DEFAULT NULL,
    p_es_dirigente BOOLEAN DEFAULT false,
    p_rama_actual TEXT DEFAULT NULL,
    -- Datos del familiar
    p_familiar_nombres TEXT DEFAULT NULL,
    p_familiar_apellidos TEXT DEFAULT NULL,
    p_parentesco TEXT DEFAULT NULL,
    p_familiar_celular TEXT DEFAULT NULL,
    p_familiar_correo TEXT DEFAULT NULL,
    p_familiar_ocupacion TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_scout_id UUID;
    v_codigo_scout TEXT;
    v_edad INTEGER;
    v_rama_sugerida TEXT;
    v_familiar_id UUID;
BEGIN
    -- Validaciones básicas
    IF p_nombres IS NULL OR p_nombres = '' THEN
        RETURN json_build_object('success', false, 'error', 'El nombre es obligatorio');
    END IF;
    
    IF p_apellidos IS NULL OR p_apellidos = '' THEN
        RETURN json_build_object('success', false, 'error', 'Los apellidos son obligatorios');
    END IF;
    
    IF p_fecha_nacimiento IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'La fecha de nacimiento es obligatoria');
    END IF;
    
    IF p_fecha_nacimiento > CURRENT_DATE THEN
        RETURN json_build_object('success', false, 'error', 'La fecha de nacimiento no puede ser futura');
    END IF;
    
    -- Calcular edad
    v_edad := EXTRACT(year FROM age(p_fecha_nacimiento));
    
    -- Validar edad mínima (6 años) y máxima (25 años para scouts, sin límite para dirigentes)
    IF v_edad < 6 THEN
        RETURN json_build_object('success', false, 'error', 'Edad mínima requerida: 6 años');
    END IF;
    
    IF NOT p_es_dirigente AND v_edad > 25 THEN
        RETURN json_build_object('success', false, 'error', 'Para mayores de 25 años debe marcarse como dirigente');
    END IF;
    
    -- Validar documento único
    IF EXISTS (SELECT 1 FROM scouts WHERE numero_documento = p_numero_documento) THEN
        RETURN json_build_object('success', false, 'error', 'Ya existe un scout con este número de documento');
    END IF;
    
    -- Sugerir rama según edad si no se especifica
    IF p_rama_actual IS NULL THEN
        IF v_edad >= 6 AND v_edad <= 10 THEN
            v_rama_sugerida := 'Lobatos';
        ELSIF v_edad >= 11 AND v_edad <= 17 THEN
            v_rama_sugerida := 'Scouts';
        ELSIF v_edad >= 18 AND v_edad <= 25 THEN
            v_rama_sugerida := 'Rovers';
        ELSE
            v_rama_sugerida := 'Dirigentes';
        END IF;
    ELSE
        v_rama_sugerida := p_rama_actual;
    END IF;
    
    -- Generar código único
    v_codigo_scout := generar_codigo_scout();
    
    -- Insertar scout
    INSERT INTO scouts (
        codigo_scout, nombres, apellidos, fecha_nacimiento,
        tipo_documento, numero_documento, celular, correo,
        departamento, provincia, distrito, direccion,
        centro_estudio, ocupacion, centro_laboral,
        es_dirigente, rama_actual
    ) VALUES (
        v_codigo_scout, p_nombres, p_apellidos, p_fecha_nacimiento,
        p_tipo_documento, p_numero_documento, p_celular, p_correo,
        p_departamento, p_provincia, p_distrito, p_direccion,
        p_centro_estudio, p_ocupacion, p_centro_laboral,
        p_es_dirigente, v_rama_sugerida
    ) RETURNING id INTO v_scout_id;
    
    -- Insertar familiar si se proporcionaron datos
    IF p_familiar_nombres IS NOT NULL AND p_familiar_nombres != '' THEN
        INSERT INTO familiares_scout (
            scout_id, nombres, apellidos, parentesco,
            celular, correo, ocupacion, es_contacto_emergencia, es_responsable_legal
        ) VALUES (
            v_scout_id, p_familiar_nombres, p_familiar_apellidos, 
            COALESCE(p_parentesco, 'Padre'),
            p_familiar_celular, p_familiar_correo, p_familiar_ocupacion,
            true, true
        ) RETURNING id INTO v_familiar_id;
    END IF;
    
    -- Registrar en historial de ramas
    INSERT INTO historial_ramas (scout_id, rama_nueva, motivo)
    VALUES (v_scout_id, v_rama_sugerida, 'Ingreso inicial al grupo scout');
    
    -- Si es dirigente, crear registro en tabla dirigentes
    IF p_es_dirigente THEN
        INSERT INTO dirigentes (scout_id, codigo_dirigente, rama_responsable)
        VALUES (v_scout_id, 'DIR-' || EXTRACT(year FROM CURRENT_DATE) || '-' || LPAD((SELECT COUNT(*) + 1 FROM dirigentes)::TEXT, 3, '0'), v_rama_sugerida);
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'scout_id', v_scout_id,
        'codigo_scout', v_codigo_scout,
        'rama_asignada', v_rama_sugerida,
        'edad', v_edad,
        'familiar_id', v_familiar_id,
        'mensaje', 'Scout registrado exitosamente'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error interno: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- 3. Función para cambiar rama de scout
CREATE OR REPLACE FUNCTION cambiar_rama_scout(
    p_scout_id UUID,
    p_nueva_rama TEXT,
    p_motivo TEXT DEFAULT NULL,
    p_autorizado_por TEXT DEFAULT 'system'
) RETURNS JSON AS $$
DECLARE
    v_scout scouts%ROWTYPE;
    v_rama_anterior TEXT;
BEGIN
    -- Obtener datos del scout
    SELECT * INTO v_scout FROM scouts WHERE id = p_scout_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Scout no encontrado');
    END IF;
    
    v_rama_anterior := v_scout.rama_actual;
    
    -- Validar que la nueva rama sea diferente
    IF v_rama_anterior = p_nueva_rama THEN
        RETURN json_build_object('success', false, 'error', 'El scout ya pertenece a esta rama');
    END IF;
    
    -- Validar rama válida
    IF p_nueva_rama NOT IN ('Lobatos', 'Scouts', 'Rovers', 'Dirigentes') THEN
        RETURN json_build_object('success', false, 'error', 'Rama no válida');
    END IF;
    
    -- Actualizar rama del scout
    UPDATE scouts 
    SET rama_actual = p_nueva_rama, updated_at = NOW()
    WHERE id = p_scout_id;
    
    -- Registrar en historial
    INSERT INTO historial_ramas (scout_id, rama_anterior, rama_nueva, motivo, autorizado_por)
    VALUES (p_scout_id, v_rama_anterior, p_nueva_rama, p_motivo, p_autorizado_por);
    
    -- Si cambió a dirigentes, crear registro en tabla dirigentes
    IF p_nueva_rama = 'Dirigentes' AND NOT EXISTS (SELECT 1 FROM dirigentes WHERE scout_id = p_scout_id) THEN
        INSERT INTO dirigentes (scout_id, codigo_dirigente, rama_responsable)
        VALUES (p_scout_id, 'DIR-' || EXTRACT(year FROM CURRENT_DATE) || '-' || LPAD((SELECT COUNT(*) + 1 FROM dirigentes)::TEXT, 3, '0'), p_nueva_rama);
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'rama_anterior', v_rama_anterior,
        'rama_nueva', p_nueva_rama,
        'mensaje', format('Rama cambiada de %s a %s exitosamente', v_rama_anterior, p_nueva_rama)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 4. Función para obtener perfil completo de scout
CREATE OR REPLACE FUNCTION obtener_perfil_scout(p_scout_id UUID)
RETURNS JSON AS $$
DECLARE
    v_scout scouts%ROWTYPE;
    v_familiares JSON;
    v_historial_ramas JSON;
    v_logros JSON;
    v_asistencias_mes JSON;
    v_patrulla JSON;
    v_dirigente JSON;
BEGIN
    -- Obtener datos básicos del scout
    SELECT * INTO v_scout FROM scouts WHERE id = p_scout_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Scout no encontrado');
    END IF;
    
    -- Obtener familiares
    SELECT json_agg(
        json_build_object(
            'id', id,
            'nombres', nombres,
            'apellidos', apellidos,
            'parentesco', parentesco,
            'celular', celular,
            'correo', correo,
            'es_contacto_emergencia', es_contacto_emergencia,
            'es_responsable_legal', es_responsable_legal
        )
    )
    INTO v_familiares
    FROM familiares_scout
    WHERE scout_id = p_scout_id;
    
    -- Obtener historial de ramas
    SELECT json_agg(
        json_build_object(
            'rama_anterior', rama_anterior,
            'rama_nueva', rama_nueva,
            'fecha_cambio', fecha_cambio,
            'motivo', motivo,
            'autorizado_por', autorizado_por
        ) ORDER BY fecha_cambio DESC
    )
    INTO v_historial_ramas
    FROM historial_ramas
    WHERE scout_id = p_scout_id;
    
    -- Obtener logros del último año
    SELECT json_agg(
        json_build_object(
            'tipo_logro', tipo_logro,
            'nombre_logro', nombre_logro,
            'fecha_obtencion', fecha_obtencion,
            'puntos', puntos,
            'nivel', nivel
        ) ORDER BY fecha_obtencion DESC
    )
    INTO v_logros
    FROM logros_scout
    WHERE scout_id = p_scout_id 
    AND fecha_obtencion >= CURRENT_DATE - INTERVAL '1 year';
    
    -- Obtener asistencias del mes actual
    SELECT json_build_object(
        'total_reuniones', COUNT(*),
        'presentes', COUNT(*) FILTER (WHERE estado_asistencia = 'presente'),
        'ausentes', COUNT(*) FILTER (WHERE estado_asistencia = 'ausente'),
        'tardanzas', COUNT(*) FILTER (WHERE estado_asistencia = 'tardanza'),
        'porcentaje_asistencia', 
            CASE WHEN COUNT(*) > 0 
                 THEN ROUND((COUNT(*) FILTER (WHERE estado_asistencia = 'presente')::DECIMAL / COUNT(*)) * 100, 2)
                 ELSE 0 
            END
    )
    INTO v_asistencias_mes
    FROM asistencias
    WHERE scout_id = p_scout_id
    AND fecha >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- Obtener información de patrulla actual
    SELECT json_build_object(
        'patrulla_id', p.id,
        'nombre_patrulla', p.nombre,
        'cargo', mp.cargo,
        'fecha_ingreso', mp.fecha_ingreso
    )
    INTO v_patrulla
    FROM miembros_patrulla mp
    JOIN patrullas p ON mp.patrulla_id = p.id
    WHERE mp.scout_id = p_scout_id AND mp.activo = true;
    
    -- Si es dirigente, obtener información adicional
    IF v_scout.es_dirigente THEN
        SELECT json_build_object(
            'codigo_dirigente', codigo_dirigente,
            'rama_responsable', rama_responsable,
            'cargo', cargo,
            'nivel_formacion', nivel_formacion,
            'insignia_madera', insignia_madera,
            'fecha_insignia_madera', fecha_insignia_madera
        )
        INTO v_dirigente
        FROM dirigentes
        WHERE scout_id = p_scout_id;
    END IF;
    
    RETURN json_build_object(
        'scout', row_to_json(v_scout),
        'familiares', COALESCE(v_familiares, '[]'::json),
        'historial_ramas', COALESCE(v_historial_ramas, '[]'::json),
        'logros_recientes', COALESCE(v_logros, '[]'::json),
        'asistencias_mes', COALESCE(v_asistencias_mes, '{}'::json),
        'patrulla_actual', v_patrulla,
        'datos_dirigente', v_dirigente
    );
END;
$$ LANGUAGE plpgsql;

-- 5. Función para registrar asistencia
CREATE OR REPLACE FUNCTION registrar_asistencia(
    p_scout_id UUID,
    p_fecha DATE,
    p_estado_asistencia TEXT,
    p_actividad_id UUID DEFAULT NULL,
    p_tipo_evento TEXT DEFAULT 'Reunión Regular',
    p_hora_llegada TIME DEFAULT NULL,
    p_justificacion TEXT DEFAULT NULL,
    p_registrado_por UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_asistencia_id UUID;
BEGIN
    -- Validar que el scout existe
    IF NOT EXISTS (SELECT 1 FROM scouts WHERE id = p_scout_id) THEN
        RETURN json_build_object('success', false, 'error', 'Scout no encontrado');
    END IF;
    
    -- Validar estado de asistencia
    IF p_estado_asistencia NOT IN ('presente', 'ausente', 'tardanza', 'justificado') THEN
        RETURN json_build_object('success', false, 'error', 'Estado de asistencia no válido');
    END IF;
    
    -- Insertar o actualizar asistencia
    INSERT INTO asistencias (
        scout_id, fecha, actividad_id, tipo_evento, estado_asistencia,
        hora_llegada, justificacion, registrado_por
    ) VALUES (
        p_scout_id, p_fecha, p_actividad_id, p_tipo_evento, p_estado_asistencia,
        p_hora_llegada, p_justificacion, p_registrado_por
    )
    ON CONFLICT (scout_id, fecha, tipo_evento)
    DO UPDATE SET
        estado_asistencia = EXCLUDED.estado_asistencia,
        hora_llegada = EXCLUDED.hora_llegada,
        justificacion = EXCLUDED.justificacion,
        registrado_por = EXCLUDED.registrado_por
    RETURNING id INTO v_asistencia_id;
    
    RETURN json_build_object(
        'success', true,
        'asistencia_id', v_asistencia_id,
        'mensaje', 'Asistencia registrada exitosamente'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 6. Función para obtener estadísticas del grupo
CREATE OR REPLACE FUNCTION obtener_estadisticas_grupo()
RETURNS JSON AS $$
DECLARE
    v_total_scouts INTEGER;
    v_scouts_por_rama JSON;
    v_scouts_activos INTEGER;
    v_dirigentes INTEGER;
    v_asistencia_promedio DECIMAL;
    v_actividades_mes INTEGER;
    v_logros_mes INTEGER;
BEGIN
    -- Total de scouts
    SELECT COUNT(*) INTO v_total_scouts FROM scouts WHERE estado = 'activo';
    
    -- Scouts por rama
    SELECT json_object_agg(rama_actual, total)
    INTO v_scouts_por_rama
    FROM (
        SELECT rama_actual, COUNT(*) as total
        FROM scouts
        WHERE estado = 'activo'
        GROUP BY rama_actual
    ) t;
    
    -- Scouts activos
    SELECT COUNT(*) INTO v_scouts_activos 
    FROM scouts 
    WHERE estado = 'activo' AND fecha_ingreso >= CURRENT_DATE - INTERVAL '1 year';
    
    -- Total dirigentes
    SELECT COUNT(*) INTO v_dirigentes FROM dirigentes WHERE estado_dirigente = 'activo';
    
    -- Asistencia promedio del mes
    SELECT COALESCE(AVG(
        CASE WHEN estado_asistencia = 'presente' THEN 1.0 ELSE 0.0 END
    ) * 100, 0)
    INTO v_asistencia_promedio
    FROM asistencias
    WHERE fecha >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- Actividades del mes
    SELECT COUNT(*) INTO v_actividades_mes
    FROM actividades_scout
    WHERE fecha_inicio >= DATE_TRUNC('month', CURRENT_DATE)
    AND fecha_inicio < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
    
    -- Logros otorgados este mes
    SELECT COUNT(*) INTO v_logros_mes
    FROM logros_scout
    WHERE fecha_obtencion >= DATE_TRUNC('month', CURRENT_DATE);
    
    RETURN json_build_object(
        'total_scouts', v_total_scouts,
        'scouts_por_rama', COALESCE(v_scouts_por_rama, '{}'::json),
        'scouts_nuevos_ultimo_año', v_scouts_activos,
        'total_dirigentes', v_dirigentes,
        'asistencia_promedio_mes', ROUND(v_asistencia_promedio, 2),
        'actividades_este_mes', v_actividades_mes,
        'logros_otorgados_mes', v_logros_mes,
        'fecha_reporte', CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;
-- ==================== FUNCIONES DE REPORTES Y ESTADÍSTICAS ====================

-- Función para obtener estadísticas generales del grupo scout
CREATE OR REPLACE FUNCTION get_estadisticas_generales()
RETURNS TABLE (
  total_scouts INTEGER,
  scouts_activos INTEGER,
  total_dirigentes INTEGER,
  dirigentes_activos INTEGER,
  total_patrullas INTEGER,
  patrullas_activas INTEGER,
  actividades_mes_actual INTEGER,
  promedio_asistencia DECIMAL,
  tasa_retencion DECIMAL,
  crecimiento_mensual DECIMAL
) AS $$
DECLARE
  mes_actual DATE := DATE_TRUNC('month', CURRENT_DATE);
  mes_anterior DATE := mes_actual - INTERVAL '1 month';
BEGIN
  RETURN QUERY
  WITH estadisticas_basicas AS (
    SELECT 
      COUNT(*)::INTEGER as total_scouts,
      COUNT(CASE WHEN activo = true THEN 1 END)::INTEGER as scouts_activos
    FROM scouts_grupo
  ),
  estadisticas_dirigentes AS (
    SELECT 
      COUNT(*)::INTEGER as total_dirigentes,
      COUNT(CASE WHEN activo = true THEN 1 END)::INTEGER as dirigentes_activos
    FROM dirigentes
  ),
  estadisticas_patrullas AS (
    SELECT 
      COUNT(*)::INTEGER as total_patrullas,
      COUNT(CASE WHEN activa = true THEN 1 END)::INTEGER as patrullas_activas
    FROM patrullas
  ),
  actividades_mes AS (
    SELECT COUNT(*)::INTEGER as actividades_mes_actual
    FROM actividades_scout 
    WHERE fecha >= mes_actual
  ),
  asistencia_promedio AS (
    SELECT 
      ROUND(
        CASE 
          WHEN COUNT(*) > 0 THEN 
            (COUNT(CASE WHEN presente = true THEN 1 END)::DECIMAL / COUNT(*) * 100)
          ELSE 0 
        END, 2
      ) as promedio_asistencia
    FROM asistencias_actividad aa
    JOIN actividades_scout a ON aa.actividad_id = a.id
    WHERE a.fecha >= mes_actual - INTERVAL '3 months'
  ),
  crecimiento AS (
    SELECT 
      CASE 
        WHEN scouts_mes_anterior > 0 THEN
          ROUND(((scouts_mes_actual - scouts_mes_anterior)::DECIMAL / scouts_mes_anterior * 100), 2)
        ELSE 0
      END as crecimiento_mensual
    FROM (
      SELECT 
        COUNT(CASE WHEN fecha_ingreso >= mes_actual THEN 1 END) as scouts_mes_actual,
        COUNT(CASE WHEN fecha_ingreso >= mes_anterior AND fecha_ingreso < mes_actual THEN 1 END) as scouts_mes_anterior
      FROM scouts_grupo
      WHERE activo = true
    ) sub
  )
  SELECT 
    eb.total_scouts,
    eb.scouts_activos,
    ed.total_dirigentes,
    ed.dirigentes_activos,
    ep.total_patrullas,
    ep.patrullas_activas,
    am.actividades_mes_actual,
    ap.promedio_asistencia,
    95.5::DECIMAL as tasa_retencion, -- Calculado manualmente por ahora
    c.crecimiento_mensual
  FROM estadisticas_basicas eb,
       estadisticas_dirigentes ed,
       estadisticas_patrullas ep,
       actividades_mes am,
       asistencia_promedio ap,
       crecimiento c;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener distribución de scouts por rama
CREATE OR REPLACE FUNCTION get_scouts_por_rama()
RETURNS TABLE (
  rama TEXT,
  total_scouts INTEGER,
  scouts_activos INTEGER,
  edad_minima INTEGER,
  edad_maxima INTEGER,
  dirigentes_rama INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.rama,
    COUNT(*)::INTEGER as total_scouts,
    COUNT(CASE WHEN s.activo = true THEN 1 END)::INTEGER as scouts_activos,
    MIN(EXTRACT(year FROM age(s.fecha_nacimiento)))::INTEGER as edad_minima,
    MAX(EXTRACT(year FROM age(s.fecha_nacimiento)))::INTEGER as edad_maxima,
    COALESCE(d.dirigentes_count, 0)::INTEGER as dirigentes_rama
  FROM scouts_grupo s
  LEFT JOIN (
    SELECT rama, COUNT(*) as dirigentes_count 
    FROM dirigentes 
    WHERE activo = true 
    GROUP BY rama
  ) d ON s.rama = d.rama
  WHERE s.rama IS NOT NULL
  GROUP BY s.rama, d.dirigentes_count
  ORDER BY 
    CASE s.rama 
      WHEN 'Lobatos' THEN 1 
      WHEN 'Scouts' THEN 2 
      WHEN 'Rovers' THEN 3 
      WHEN 'Dirigentes' THEN 4 
      ELSE 5 
    END;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener tendencias mensuales
CREATE OR REPLACE FUNCTION get_tendencias_mensuales(año_param INTEGER)
RETURNS TABLE (
  mes INTEGER,
  nombre_mes TEXT,
  nuevos_scouts INTEGER,
  scouts_activos INTEGER,
  actividades_realizadas INTEGER,
  promedio_asistencia DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH meses AS (
    SELECT 
      generate_series(1, 12) as mes_num,
      CASE generate_series(1, 12)
        WHEN 1 THEN 'Enero'
        WHEN 2 THEN 'Febrero' 
        WHEN 3 THEN 'Marzo'
        WHEN 4 THEN 'Abril'
        WHEN 5 THEN 'Mayo'
        WHEN 6 THEN 'Junio'
        WHEN 7 THEN 'Julio'
        WHEN 8 THEN 'Agosto'
        WHEN 9 THEN 'Septiembre'
        WHEN 10 THEN 'Octubre'
        WHEN 11 THEN 'Noviembre'
        WHEN 12 THEN 'Diciembre'
      END as nombre_mes
  ),
  nuevos_por_mes AS (
    SELECT 
      EXTRACT(month FROM fecha_ingreso) as mes,
      COUNT(*) as nuevos
    FROM scouts_grupo 
    WHERE EXTRACT(year FROM fecha_ingreso) = año_param
    GROUP BY EXTRACT(month FROM fecha_ingreso)
  ),
  activos_por_mes AS (
    SELECT 
      m.mes_num as mes,
      COUNT(s.id) as activos
    FROM meses m
    LEFT JOIN scouts_grupo s ON s.fecha_ingreso <= make_date(año_param, m.mes_num, 28)
      AND s.activo = true
    GROUP BY m.mes_num
  ),
  actividades_por_mes AS (
    SELECT 
      EXTRACT(month FROM fecha) as mes,
      COUNT(*) as actividades
    FROM actividades_scout
    WHERE EXTRACT(year FROM fecha) = año_param
    GROUP BY EXTRACT(month FROM fecha)
  )
  SELECT 
    m.mes_num,
    m.nombre_mes,
    COALESCE(n.nuevos, 0)::INTEGER,
    COALESCE(a.activos, 0)::INTEGER,
    COALESCE(ac.actividades, 0)::INTEGER,
    85.5::DECIMAL -- Promedio fijo por ahora
  FROM meses m
  LEFT JOIN nuevos_por_mes n ON m.mes_num = n.mes
  LEFT JOIN activos_por_mes a ON m.mes_num = a.mes
  LEFT JOIN actividades_por_mes ac ON m.mes_num = ac.mes
  ORDER BY m.mes_num;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de asistencia
CREATE OR REPLACE FUNCTION get_estadisticas_asistencia(fecha_inicio DATE, fecha_fin DATE)
RETURNS TABLE (
  total_actividades INTEGER,
  total_asistencias INTEGER,
  promedio_asistencia DECIMAL,
  asistencia_por_rama JSON
) AS $$
BEGIN
  RETURN QUERY
  WITH estadisticas_generales AS (
    SELECT 
      COUNT(DISTINCT a.id)::INTEGER as total_actividades,
      COUNT(aa.*)::INTEGER as total_asistencias,
      ROUND(
        CASE 
          WHEN COUNT(aa.*) > 0 THEN 
            (COUNT(CASE WHEN aa.presente = true THEN 1 END)::DECIMAL / COUNT(aa.*) * 100)
          ELSE 0 
        END, 2
      ) as promedio_asistencia
    FROM actividades_scout a
    LEFT JOIN asistencias_actividad aa ON a.id = aa.actividad_id
    WHERE a.fecha BETWEEN fecha_inicio AND fecha_fin
  ),
  asistencia_rama AS (
    SELECT 
      s.rama,
      COUNT(aa.*)::INTEGER as total,
      COUNT(CASE WHEN aa.presente = true THEN 1 END)::INTEGER as presentes
    FROM actividades_scout a
    JOIN asistencias_actividad aa ON a.id = aa.actividad_id
    JOIN scouts_grupo s ON aa.scout_id = s.id
    WHERE a.fecha BETWEEN fecha_inicio AND fecha_fin
    GROUP BY s.rama
  )
  SELECT 
    eg.total_actividades,
    eg.total_asistencias,
    eg.promedio_asistencia,
    (
      SELECT json_object_agg(rama, json_build_object('total', total, 'presentes', presentes, 'porcentaje', ROUND(presentes::DECIMAL/total*100, 2)))
      FROM asistencia_rama
    ) as asistencia_por_rama
  FROM estadisticas_generales eg;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener métricas de actividades
CREATE OR REPLACE FUNCTION get_metricas_actividades()
RETURNS TABLE (
  total_actividades INTEGER,
  actividades_mes_actual INTEGER,
  promedio_participantes DECIMAL,
  tipo_actividad_popular TEXT,
  actividades_por_tipo JSON
) AS $$
DECLARE
  mes_actual DATE := DATE_TRUNC('month', CURRENT_DATE);
BEGIN
  RETURN QUERY
  WITH actividades_stats AS (
    SELECT 
      COUNT(*)::INTEGER as total_actividades,
      COUNT(CASE WHEN fecha >= mes_actual THEN 1 END)::INTEGER as actividades_mes_actual,
      ROUND(AVG(participantes_esperados), 1) as promedio_participantes
    FROM actividades_scout
  ),
  tipo_popular AS (
    SELECT tipo_actividad
    FROM actividades_scout 
    GROUP BY tipo_actividad 
    ORDER BY COUNT(*) DESC 
    LIMIT 1
  ),
  actividades_tipo AS (
    SELECT 
      tipo_actividad,
      COUNT(*) as cantidad
    FROM actividades_scout
    GROUP BY tipo_actividad
  )
  SELECT 
    ast.total_actividades,
    ast.actividades_mes_actual,
    ast.promedio_participantes,
    tp.tipo_actividad,
    (
      SELECT json_object_agg(tipo_actividad, cantidad)
      FROM actividades_tipo
    ) as actividades_por_tipo
  FROM actividades_stats ast,
       tipo_popular tp;
END;
$$ LANGUAGE plpgsql;
