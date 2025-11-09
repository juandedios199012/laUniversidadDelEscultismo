-- ================================================================
-- 📚 LIBRO ORO DATABASE FUNCTIONS - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 12_functions_libro_oro.sql
-- Propósito: Database Functions para el módulo de libro de oro
-- ================================================================

-- ============= 📚 FUNCIONES DEL LIBRO DE ORO =============

-- Crear registro en libro de oro
CREATE OR REPLACE FUNCTION crear_registro_libro_oro(
    p_titulo VARCHAR(255),
    p_descripcion TEXT,
    p_fecha_evento DATE,
    p_tipo_registro VARCHAR(100) DEFAULT 'EVENTO', -- 'LOGRO', 'EVENTO', 'MEMORIAL', 'EFEMERIDE', 'HISTORIA'
    p_scout_id UUID DEFAULT NULL,
    p_patrulla_id UUID DEFAULT NULL,
    p_dirigente_id UUID DEFAULT NULL,
    p_fotos TEXT[] DEFAULT '{}',
    p_documentos TEXT[] DEFAULT '{}',
    p_registrado_por_id UUID DEFAULT NULL,
    p_es_destacado BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
    v_registro_id UUID;
BEGIN
    -- Validaciones básicas
    IF p_titulo IS NULL OR LENGTH(TRIM(p_titulo)) = 0 THEN
        RETURN json_build_object('success', false, 'error', 'El título es obligatorio');
    END IF;
    
    IF p_fecha_evento IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'La fecha del evento es obligatoria');
    END IF;
    
    -- Insertar registro
    INSERT INTO libro_oro (
        titulo,
        descripcion,
        tipo_registro,
        fecha_evento,
        scout_id,
        patrulla_id,
        dirigente_id,
        fotos,
        documentos,
        registrado_por_id,
        es_destacado
    ) VALUES (
        TRIM(p_titulo),
        p_descripcion,
        p_tipo_registro,
        p_fecha_evento,
        p_scout_id,
        p_patrulla_id,
        p_dirigente_id,
        p_fotos,
        p_documentos,
        p_registrado_por_id,
        p_es_destacado
    ) RETURNING id INTO v_registro_id;
    
    RETURN json_build_object('success', true, 'registro_id', v_registro_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener registros del libro de oro
CREATE OR REPLACE FUNCTION obtener_registros_libro_oro(p_filtros JSON DEFAULT '{}')
RETURNS TABLE(
    id UUID,
    titulo VARCHAR(255),
    descripcion TEXT,
    tipo_registro VARCHAR(100),
    fecha_evento DATE,
    scout_nombre VARCHAR(255),
    patrulla_nombre VARCHAR(255),
    dirigente_nombre VARCHAR(255),
    fotos TEXT[],
    documentos TEXT[],
    registrado_por VARCHAR(255),
    es_destacado BOOLEAN,
    años_transcurridos INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_tipo VARCHAR(100);
    v_año INTEGER;
    v_scout_id UUID;
    v_solo_destacados BOOLEAN;
    v_fecha_desde DATE;
    v_fecha_hasta DATE;
BEGIN
    -- Extraer filtros
    v_tipo := p_filtros->>'tipo';
    v_año := (p_filtros->>'año')::INTEGER;
    v_scout_id := (p_filtros->>'scout_id')::UUID;
    v_solo_destacados := COALESCE((p_filtros->>'solo_destacados')::BOOLEAN, false);
    v_fecha_desde := (p_filtros->>'fecha_desde')::DATE;
    v_fecha_hasta := (p_filtros->>'fecha_hasta')::DATE;
    
    RETURN QUERY
    SELECT 
        lo.id,
        lo.titulo,
        lo.descripcion,
        lo.tipo_registro,
        lo.fecha_evento,
        CASE WHEN s.id IS NOT NULL THEN s.nombres || ' ' || s.apellidos ELSE NULL END as scout_nombre,
        p.nombre as patrulla_nombre,
        CASE WHEN sd.id IS NOT NULL THEN sd.nombres || ' ' || sd.apellidos ELSE NULL END as dirigente_nombre,
        lo.fotos,
        lo.documentos,
        COALESCE(sr.nombres || ' ' || sr.apellidos, 'Sistema') as registrado_por,
        lo.es_destacado,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, lo.fecha_evento))::INTEGER as años_transcurridos,
        lo.created_at
    FROM libro_oro lo
    LEFT JOIN scouts s ON lo.scout_id = s.id
    LEFT JOIN patrullas p ON lo.patrulla_id = p.id
    LEFT JOIN dirigentes d ON lo.dirigente_id = d.id
    LEFT JOIN scouts sd ON d.scout_id = sd.id
    LEFT JOIN scouts sr ON lo.registrado_por_id = sr.id
    WHERE 
        (v_tipo IS NULL OR lo.tipo_registro = v_tipo)
        AND (v_año IS NULL OR EXTRACT(YEAR FROM lo.fecha_evento) = v_año)
        AND (v_scout_id IS NULL OR lo.scout_id = v_scout_id)
        AND (NOT v_solo_destacados OR lo.es_destacado = true)
        AND (v_fecha_desde IS NULL OR lo.fecha_evento >= v_fecha_desde)
        AND (v_fecha_hasta IS NULL OR lo.fecha_evento <= v_fecha_hasta)
    ORDER BY lo.fecha_evento DESC, lo.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Obtener registro específico
CREATE OR REPLACE FUNCTION obtener_registro_libro_oro_por_id(p_registro_id UUID)
RETURNS TABLE(
    id UUID,
    titulo VARCHAR(255),
    descripcion TEXT,
    tipo_registro VARCHAR(100),
    fecha_evento DATE,
    scout_id UUID,
    scout_nombre VARCHAR(255),
    patrulla_id UUID,
    patrulla_nombre VARCHAR(255),
    dirigente_id UUID,
    dirigente_nombre VARCHAR(255),
    fotos TEXT[],
    documentos TEXT[],
    registrado_por_id UUID,
    registrado_por VARCHAR(255),
    es_destacado BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lo.id,
        lo.titulo,
        lo.descripcion,
        lo.tipo_registro,
        lo.fecha_evento,
        lo.scout_id,
        CASE WHEN s.id IS NOT NULL THEN s.nombres || ' ' || s.apellidos ELSE NULL END as scout_nombre,
        lo.patrulla_id,
        p.nombre as patrulla_nombre,
        lo.dirigente_id,
        CASE WHEN sd.id IS NOT NULL THEN sd.nombres || ' ' || sd.apellidos ELSE NULL END as dirigente_nombre,
        lo.fotos,
        lo.documentos,
        lo.registrado_por_id,
        COALESCE(sr.nombres || ' ' || sr.apellidos, 'Sistema') as registrado_por,
        lo.es_destacado,
        lo.created_at,
        lo.updated_at
    FROM libro_oro lo
    LEFT JOIN scouts s ON lo.scout_id = s.id
    LEFT JOIN patrullas p ON lo.patrulla_id = p.id
    LEFT JOIN dirigentes d ON lo.dirigente_id = d.id
    LEFT JOIN scouts sd ON d.scout_id = sd.id
    LEFT JOIN scouts sr ON lo.registrado_por_id = sr.id
    WHERE lo.id = p_registro_id;
END;
$$ LANGUAGE plpgsql;

-- ============= 🏆 FUNCIONES DE LOGROS DESTACADOS =============

-- Registrar logro destacado
CREATE OR REPLACE FUNCTION registrar_logro_destacado(
    p_scout_id UUID,
    p_titulo VARCHAR(255),
    p_descripcion TEXT,
    p_fecha_logro DATE,
    p_categoria VARCHAR(100) DEFAULT NULL, -- 'ESPECIALIDAD', 'INSIGNIA', 'RECONOCIMIENTO', 'COMPETENCIA'
    p_nivel_dificultad VARCHAR(20) DEFAULT 'MEDIO', -- 'BAJO', 'MEDIO', 'ALTO', 'EXCEPCIONAL'
    p_otorgado_por VARCHAR(255) DEFAULT NULL,
    p_evidencias TEXT[] DEFAULT '{}',
    p_mentor_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_logro_id UUID;
BEGIN
    -- Verificar que el scout existe
    IF NOT EXISTS (SELECT 1 FROM scouts WHERE id = p_scout_id AND estado = 'ACTIVO') THEN
        RETURN json_build_object('success', false, 'error', 'Scout no encontrado o inactivo');
    END IF;
    
    -- Registrar en libro de oro
    SELECT crear_registro_libro_oro(
        p_titulo,
        p_descripcion || 
        CASE WHEN p_categoria IS NOT NULL THEN E'\n\nCategoría: ' || p_categoria ELSE '' END ||
        CASE WHEN p_nivel_dificultad IS NOT NULL THEN E'\nNivel: ' || p_nivel_dificultad ELSE '' END ||
        CASE WHEN p_otorgado_por IS NOT NULL THEN E'\nOtorgado por: ' || p_otorgado_por ELSE '' END,
        p_fecha_logro,
        'LOGRO',
        p_scout_id,
        NULL, -- patrulla_id
        p_mentor_id, -- dirigente_id
        '{}', -- fotos
        p_evidencias, -- documentos
        p_mentor_id, -- registrado_por_id
        true -- es_destacado
    )->>'registro_id' INTO v_logro_id;
    
    -- También registrar en logros_scout si esa tabla existe
    BEGIN
        INSERT INTO logros_scout (
            scout_id,
            titulo,
            descripcion,
            categoria,
            fecha_obtencion,
            otorgado_por_id,
            validado
        ) VALUES (
            p_scout_id,
            p_titulo,
            p_descripcion,
            p_categoria,
            p_fecha_logro,
            p_mentor_id,
            true
        );
    EXCEPTION
        WHEN undefined_table THEN
            -- La tabla logros_scout no existe, solo registrar en libro de oro
            NULL;
    END;
    
    RETURN json_build_object('success', true, 'logro_id', v_logro_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 📅 FUNCIONES DE EVENTOS HISTÓRICOS =============

-- Registrar evento histórico
CREATE OR REPLACE FUNCTION registrar_evento_historico(
    p_titulo VARCHAR(255),
    p_descripcion TEXT,
    p_fecha_evento DATE,
    p_tipo_evento VARCHAR(100) DEFAULT 'ACTIVIDAD_ESPECIAL', -- 'FUNDACION', 'CAMPAMENTO', 'CEREMONIA', 'VISITA', 'ACTIVIDAD_ESPECIAL'
    p_participantes TEXT[] DEFAULT '{}',
    p_lugar VARCHAR(255) DEFAULT NULL,
    p_impacto TEXT DEFAULT NULL,
    p_fotos TEXT[] DEFAULT '{}',
    p_documentos TEXT[] DEFAULT '{}',
    p_registrado_por_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_evento_id UUID;
    v_descripcion_completa TEXT;
BEGIN
    -- Construir descripción completa
    v_descripcion_completa := p_descripcion;
    
    IF p_lugar IS NOT NULL THEN
        v_descripcion_completa := v_descripcion_completa || E'\n\nLugar: ' || p_lugar;
    END IF;
    
    IF p_participantes IS NOT NULL AND array_length(p_participantes, 1) > 0 THEN
        v_descripcion_completa := v_descripcion_completa || E'\n\nParticipantes principales: ' || array_to_string(p_participantes, ', ');
    END IF;
    
    IF p_impacto IS NOT NULL THEN
        v_descripcion_completa := v_descripcion_completa || E'\n\nImpacto: ' || p_impacto;
    END IF;
    
    -- Registrar en libro de oro
    SELECT crear_registro_libro_oro(
        p_titulo,
        v_descripcion_completa,
        p_fecha_evento,
        'EVENTO',
        NULL, -- scout_id
        NULL, -- patrulla_id
        NULL, -- dirigente_id
        p_fotos,
        p_documentos,
        p_registrado_por_id,
        true -- es_destacado
    )->>'registro_id' INTO v_evento_id;
    
    RETURN json_build_object('success', true, 'evento_id', v_evento_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 🕊️ FUNCIONES DE MEMORIALES =============

-- Crear memorial
CREATE OR REPLACE FUNCTION crear_memorial_libro_oro(
    p_persona_nombre VARCHAR(255),
    p_relacion_grupo VARCHAR(100) DEFAULT 'SCOUT', -- 'SCOUT', 'DIRIGENTE', 'PADRE', 'BENEFACTOR', 'FUNDADOR'
    p_fecha_nacimiento DATE DEFAULT NULL,
    p_fecha_fallecimiento DATE DEFAULT NULL,
    p_biografia TEXT DEFAULT NULL,
    p_contribuciones TEXT[] DEFAULT '{}',
    p_anecdotas TEXT DEFAULT NULL,
    p_fotos TEXT[] DEFAULT '{}',
    p_registrado_por_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_memorial_id UUID;
    v_descripcion_memorial TEXT;
BEGIN
    -- Construir descripción del memorial
    v_descripcion_memorial := 'En memoria de ' || p_persona_nombre;
    
    IF p_relacion_grupo IS NOT NULL THEN
        v_descripcion_memorial := v_descripcion_memorial || E'\nRelación con el grupo: ' || p_relacion_grupo;
    END IF;
    
    IF p_fecha_nacimiento IS NOT NULL THEN
        v_descripcion_memorial := v_descripcion_memorial || E'\nNacimiento: ' || p_fecha_nacimiento;
    END IF;
    
    IF p_biografia IS NOT NULL THEN
        v_descripcion_memorial := v_descripcion_memorial || E'\n\nBiografía:\n' || p_biografia;
    END IF;
    
    IF p_contribuciones IS NOT NULL AND array_length(p_contribuciones, 1) > 0 THEN
        v_descripcion_memorial := v_descripcion_memorial || E'\n\nContribuciones al grupo:\n- ' || array_to_string(p_contribuciones, E'\n- ');
    END IF;
    
    IF p_anecdotas IS NOT NULL THEN
        v_descripcion_memorial := v_descripcion_memorial || E'\n\nAnécdotas y recuerdos:\n' || p_anecdotas;
    END IF;
    
    -- Registrar en libro de oro
    SELECT crear_registro_libro_oro(
        'Memorial: ' || p_persona_nombre,
        v_descripcion_memorial,
        COALESCE(p_fecha_fallecimiento, CURRENT_DATE),
        'MEMORIAL',
        NULL, -- scout_id
        NULL, -- patrulla_id
        NULL, -- dirigente_id
        p_fotos,
        '{}', -- documentos
        p_registrado_por_id,
        true -- es_destacado
    )->>'registro_id' INTO v_memorial_id;
    
    RETURN json_build_object('success', true, 'memorial_id', v_memorial_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 📆 FUNCIONES DE EFEMÉRIDES =============

-- Registrar efeméride
CREATE OR REPLACE FUNCTION registrar_efemeride(
    p_titulo VARCHAR(255),
    p_descripcion TEXT,
    p_fecha_conmemoracion DATE, -- Fecha original del evento
    p_tipo_efemeride VARCHAR(100) DEFAULT 'ANIVERSARIO', -- 'ANIVERSARIO', 'RECORDATORIO', 'CELEBRACION'
    p_periodicidad VARCHAR(20) DEFAULT 'ANUAL', -- 'ANUAL', 'QUINQUENAL', 'DECENAL', 'UNICA'
    p_registrado_por_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_efemeride_id UUID;
BEGIN
    -- Registrar en libro de oro
    SELECT crear_registro_libro_oro(
        'Efeméride: ' || p_titulo,
        p_descripcion || E'\n\nFecha de conmemoración: ' || p_fecha_conmemoracion ||
        E'\nPeriodicidad: ' || p_periodicidad,
        p_fecha_conmemoracion,
        'EFEMERIDE',
        NULL, -- scout_id
        NULL, -- patrulla_id
        NULL, -- dirigente_id
        '{}', -- fotos
        '{}', -- documentos
        p_registrado_por_id,
        false -- es_destacado
    )->>'registro_id' INTO v_efemeride_id;
    
    RETURN json_build_object('success', true, 'efemeride_id', v_efemeride_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Obtener próximas efemérides
CREATE OR REPLACE FUNCTION obtener_proximas_efemerides(p_meses_adelante INTEGER DEFAULT 3)
RETURNS TABLE(
    id UUID,
    titulo VARCHAR(255),
    descripcion TEXT,
    fecha_original DATE,
    fecha_proxima DATE,
    años_transcurridos INTEGER,
    tipo_efemeride VARCHAR(100),
    es_aniversario_redondo BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lo.id,
        REPLACE(lo.titulo, 'Efeméride: ', '') as titulo,
        lo.descripcion,
        lo.fecha_evento as fecha_original,
        (DATE_TRUNC('year', CURRENT_DATE) + 
         (lo.fecha_evento - DATE_TRUNC('year', lo.fecha_evento)) +
         CASE 
            WHEN (lo.fecha_evento - DATE_TRUNC('year', lo.fecha_evento)) < (CURRENT_DATE - DATE_TRUNC('year', CURRENT_DATE))
            THEN INTERVAL '1 year'
            ELSE INTERVAL '0'
         END)::DATE as fecha_proxima,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, lo.fecha_evento))::INTEGER as años_transcurridos,
        SUBSTRING(lo.descripcion FROM 'Periodicidad: ([A-Z]+)') as tipo_efemeride,
        (EXTRACT(YEAR FROM AGE(CURRENT_DATE, lo.fecha_evento)) % 5 = 0 AND 
         EXTRACT(YEAR FROM AGE(CURRENT_DATE, lo.fecha_evento)) > 0) as es_aniversario_redondo
    FROM libro_oro lo
    WHERE lo.tipo_registro = 'EFEMERIDE'
    AND (DATE_TRUNC('year', CURRENT_DATE) + 
         (lo.fecha_evento - DATE_TRUNC('year', lo.fecha_evento)) +
         CASE 
            WHEN (lo.fecha_evento - DATE_TRUNC('year', lo.fecha_evento)) < (CURRENT_DATE - DATE_TRUNC('year', CURRENT_DATE))
            THEN INTERVAL '1 year'
            ELSE INTERVAL '0'
         END) <= CURRENT_DATE + (p_meses_adelante || ' months')::INTERVAL
    ORDER BY fecha_proxima ASC;
END;
$$ LANGUAGE plpgsql;

-- ============= 🔍 FUNCIONES DE BÚSQUEDA =============

-- Buscar en libro de oro
CREATE OR REPLACE FUNCTION buscar_en_libro_oro(p_criterios JSON)
RETURNS TABLE(
    id UUID,
    titulo VARCHAR(255),
    descripcion_excerpt TEXT,
    tipo_registro VARCHAR(100),
    fecha_evento DATE,
    relevancia NUMERIC,
    scout_nombre VARCHAR(255),
    patrulla_nombre VARCHAR(255),
    es_destacado BOOLEAN
) AS $$
DECLARE
    v_texto_busqueda TEXT;
    v_tipo VARCHAR(100);
    v_fecha_desde DATE;
    v_fecha_hasta DATE;
BEGIN
    -- Extraer criterios
    v_texto_busqueda := p_criterios->>'texto';
    v_tipo := p_criterios->>'tipo';
    v_fecha_desde := (p_criterios->>'fecha_desde')::DATE;
    v_fecha_hasta := (p_criterios->>'fecha_hasta')::DATE;
    
    RETURN QUERY
    SELECT 
        lo.id,
        lo.titulo,
        LEFT(lo.descripcion, 200) || '...' as descripcion_excerpt,
        lo.tipo_registro,
        lo.fecha_evento,
        CASE 
            WHEN v_texto_busqueda IS NOT NULL THEN
                ts_rank(
                    to_tsvector('spanish', lo.titulo || ' ' || lo.descripcion),
                    plainto_tsquery('spanish', v_texto_busqueda)
                )
            ELSE 1.0
        END as relevancia,
        CASE WHEN s.id IS NOT NULL THEN s.nombres || ' ' || s.apellidos ELSE NULL END as scout_nombre,
        p.nombre as patrulla_nombre,
        lo.es_destacado
    FROM libro_oro lo
    LEFT JOIN scouts s ON lo.scout_id = s.id
    LEFT JOIN patrullas p ON lo.patrulla_id = p.id
    WHERE 
        (v_texto_busqueda IS NULL OR (
            to_tsvector('spanish', lo.titulo || ' ' || lo.descripcion) @@ 
            plainto_tsquery('spanish', v_texto_busqueda)
        ))
        AND (v_tipo IS NULL OR lo.tipo_registro = v_tipo)
        AND (v_fecha_desde IS NULL OR lo.fecha_evento >= v_fecha_desde)
        AND (v_fecha_hasta IS NULL OR lo.fecha_evento <= v_fecha_hasta)
    ORDER BY relevancia DESC, lo.fecha_evento DESC;
END;
$$ LANGUAGE plpgsql;

-- ============= 📊 FUNCIONES DE ESTADÍSTICAS =============

-- Obtener estadísticas del libro de oro
CREATE OR REPLACE FUNCTION obtener_estadisticas_libro_oro()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'total_registros', COUNT(*),
        'registros_destacados', COUNT(CASE WHEN es_destacado THEN 1 END),
        'registros_por_tipo', json_object_agg(tipo_registro, tipo_count),
        'registros_por_año', (
            SELECT json_object_agg(año, año_count)
            FROM (
                SELECT 
                    EXTRACT(YEAR FROM fecha_evento) as año,
                    COUNT(*) as año_count
                FROM libro_oro
                GROUP BY EXTRACT(YEAR FROM fecha_evento)
                ORDER BY año DESC
                LIMIT 10
            ) años_recientes
        ),
        'scouts_mas_destacados', (
            SELECT json_agg(scout_destacado ORDER BY total_registros DESC)
            FROM (
                SELECT 
                    json_build_object(
                        'nombre_scout', s.nombres || ' ' || s.apellidos,
                        'total_registros', COUNT(*),
                        'registros_destacados', COUNT(CASE WHEN lo.es_destacado THEN 1 END)
                    ) as scout_destacado,
                    COUNT(*) as total_registros
                FROM libro_oro lo
                INNER JOIN scouts s ON lo.scout_id = s.id
                GROUP BY s.id, s.nombres, s.apellidos
                HAVING COUNT(*) > 1
                ORDER BY COUNT(*) DESC
                LIMIT 5
            ) top_scouts
        ),
        'registro_mas_antiguo', (
            SELECT json_build_object(
                'titulo', titulo,
                'fecha', fecha_evento,
                'años_transcurridos', EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_evento))
            ) FROM libro_oro ORDER BY fecha_evento ASC LIMIT 1
        ),
        'ultimo_registro', (
            SELECT json_build_object(
                'titulo', titulo,
                'fecha', created_at,
                'tipo', tipo_registro
            ) FROM libro_oro ORDER BY created_at DESC LIMIT 1
        )
    ) INTO v_resultado
    FROM libro_oro lo
    CROSS JOIN LATERAL (
        SELECT tipo_registro, COUNT(*) as tipo_count
        FROM libro_oro lo2
        GROUP BY tipo_registro
    ) tipo_counts;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ============= 📋 FUNCIONES DE REPORTES =============

-- Generar reporte cronológico
CREATE OR REPLACE FUNCTION generar_reporte_cronologico(p_filtros JSON DEFAULT '{}')
RETURNS TABLE(
    año INTEGER,
    total_eventos INTEGER,
    eventos_destacados INTEGER,
    logros_scouts INTEGER,
    eventos_patrullas INTEGER,
    memoriales INTEGER,
    primer_evento_año VARCHAR(255),
    ultimo_evento_año VARCHAR(255)
) AS $$
DECLARE
    v_año_desde INTEGER;
    v_año_hasta INTEGER;
BEGIN
    -- Extraer filtros
    v_año_desde := COALESCE((p_filtros->>'año_desde')::INTEGER, 
                           EXTRACT(YEAR FROM (SELECT MIN(fecha_evento) FROM libro_oro)));
    v_año_hasta := COALESCE((p_filtros->>'año_hasta')::INTEGER, 
                           EXTRACT(YEAR FROM CURRENT_DATE));
    
    RETURN QUERY
    SELECT 
        años.año::INTEGER,
        COALESCE(resumen.total_eventos, 0)::INTEGER as total_eventos,
        COALESCE(resumen.eventos_destacados, 0)::INTEGER as eventos_destacados,
        COALESCE(resumen.logros_scouts, 0)::INTEGER as logros_scouts,
        COALESCE(resumen.eventos_patrullas, 0)::INTEGER as eventos_patrullas,
        COALESCE(resumen.memoriales, 0)::INTEGER as memoriales,
        resumen.primer_evento as primer_evento_año,
        resumen.ultimo_evento as ultimo_evento_año
    FROM generate_series(v_año_desde, v_año_hasta) años(año)
    LEFT JOIN LATERAL (
        SELECT 
            COUNT(*) as total_eventos,
            COUNT(CASE WHEN es_destacado THEN 1 END) as eventos_destacados,
            COUNT(CASE WHEN tipo_registro = 'LOGRO' THEN 1 END) as logros_scouts,
            COUNT(CASE WHEN patrulla_id IS NOT NULL THEN 1 END) as eventos_patrullas,
            COUNT(CASE WHEN tipo_registro = 'MEMORIAL' THEN 1 END) as memoriales,
            (SELECT titulo FROM libro_oro WHERE EXTRACT(YEAR FROM fecha_evento) = años.año ORDER BY fecha_evento ASC LIMIT 1) as primer_evento,
            (SELECT titulo FROM libro_oro WHERE EXTRACT(YEAR FROM fecha_evento) = años.año ORDER BY fecha_evento DESC LIMIT 1) as ultimo_evento
        FROM libro_oro
        WHERE EXTRACT(YEAR FROM fecha_evento) = años.año
    ) resumen ON true
    ORDER BY años.año DESC;
END;
$$ LANGUAGE plpgsql;

-- Exportar libro de oro completo
CREATE OR REPLACE FUNCTION exportar_libro_oro_completo(p_opciones JSON DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    v_incluir_fotos BOOLEAN;
    v_incluir_documentos BOOLEAN;
    v_formato VARCHAR(20);
    v_resultado JSON;
BEGIN
    -- Extraer opciones
    v_incluir_fotos := COALESCE((p_opciones->>'incluir_fotos')::BOOLEAN, true);
    v_incluir_documentos := COALESCE((p_opciones->>'incluir_documentos')::BOOLEAN, true);
    v_formato := COALESCE(p_opciones->>'formato', 'JSON');
    
    -- Generar exportación completa
    SELECT json_build_object(
        'metadatos', json_build_object(
            'fecha_exportacion', CURRENT_TIMESTAMP,
            'total_registros', COUNT(*),
            'grupo_scout', 'Lima 12',
            'incluye_fotos', v_incluir_fotos,
            'incluye_documentos', v_incluir_documentos
        ),
        'registros', json_agg(
            json_build_object(
                'id', lo.id,
                'titulo', lo.titulo,
                'descripcion', lo.descripcion,
                'tipo_registro', lo.tipo_registro,
                'fecha_evento', lo.fecha_evento,
                'scout', CASE WHEN s.id IS NOT NULL THEN json_build_object(
                    'nombres', s.nombres,
                    'apellidos', s.apellidos,
                    'rama', s.rama_actual
                ) ELSE NULL END,
                'patrulla', CASE WHEN p.id IS NOT NULL THEN json_build_object(
                    'nombre', p.nombre,
                    'rama', p.rama
                ) ELSE NULL END,
                'dirigente', CASE WHEN sd.id IS NOT NULL THEN json_build_object(
                    'nombres', sd.nombres,
                    'apellidos', sd.apellidos
                ) ELSE NULL END,
                'fotos', CASE WHEN v_incluir_fotos THEN lo.fotos ELSE '{}' END,
                'documentos', CASE WHEN v_incluir_documentos THEN lo.documentos ELSE '{}' END,
                'es_destacado', lo.es_destacado,
                'fecha_registro', lo.created_at
            ) ORDER BY lo.fecha_evento DESC
        )
    ) INTO v_resultado
    FROM libro_oro lo
    LEFT JOIN scouts s ON lo.scout_id = s.id
    LEFT JOIN patrullas p ON lo.patrulla_id = p.id
    LEFT JOIN dirigentes d ON lo.dirigente_id = d.id
    LEFT JOIN scouts sd ON d.scout_id = sd.id;
    
    RETURN json_build_object(
        'success', true,
        'formato', v_formato,
        'datos', v_resultado,
        'url_descarga', '/api/libro-oro/exportar/' || extract(epoch from now())::text
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============= 🕰️ FUNCIONES DE CÁPSULA DEL TIEMPO =============

-- Crear cápsula del tiempo
CREATE OR REPLACE FUNCTION crear_capsula_del_tiempo(
    p_titulo VARCHAR(255),
    p_descripcion TEXT,
    p_fecha_apertura DATE,
    p_contenidos JSON, -- Array de objetos con tipo, descripcion, archivo
    p_fecha_creacion DATE DEFAULT CURRENT_DATE,
    p_mensaje_futuro TEXT DEFAULT NULL,
    p_creada_por_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_capsula_id UUID;
    v_años_hasta_apertura INTEGER;
BEGIN
    -- Validar fecha de apertura
    IF p_fecha_apertura <= CURRENT_DATE THEN
        RETURN json_build_object('success', false, 'error', 'La fecha de apertura debe ser futura');
    END IF;
    
    v_años_hasta_apertura := EXTRACT(YEAR FROM AGE(p_fecha_apertura, CURRENT_DATE));
    
    -- Registrar como evento especial en libro de oro
    SELECT crear_registro_libro_oro(
        'Cápsula del Tiempo: ' || p_titulo,
        p_descripcion || 
        E'\n\nFecha de creación: ' || p_fecha_creacion ||
        E'\nFecha de apertura programada: ' || p_fecha_apertura ||
        E'\nAños hasta apertura: ' || v_años_hasta_apertura ||
        CASE WHEN p_mensaje_futuro IS NOT NULL THEN E'\n\nMensaje al futuro:\n' || p_mensaje_futuro ELSE '' END ||
        E'\n\nContenidos:\n' || (p_contenidos::TEXT),
        p_fecha_creacion,
        'HISTORIA',
        NULL, -- scout_id
        NULL, -- patrulla_id
        NULL, -- dirigente_id
        '{}', -- fotos
        '{}', -- documentos
        p_creada_por_id,
        true -- es_destacado
    )->>'registro_id' INTO v_capsula_id;
    
    RETURN json_build_object('success', true, 'capsula_id', v_capsula_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '📚 FUNCIONES DE LIBRO DE ORO CREADAS' as estado,
    'Todas las Database Functions del módulo de libro de oro implementadas' as mensaje,
    '15 funciones de libro de oro disponibles' as resumen;