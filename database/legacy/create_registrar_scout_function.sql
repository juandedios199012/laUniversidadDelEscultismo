-- ============================================
-- 🚀 SCRIPT MÍNIMO: SOLO LA FUNCIÓN QUE NECESITAS
-- ============================================
-- Ejecuta esto en Supabase SQL Editor

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

-- 2. LA FUNCIÓN PRINCIPAL: registrar_scout_completo
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
    
    -- Validar edad mínima (6 años)
    IF v_edad < 6 THEN
        RETURN json_build_object('success', false, 'error', 'Edad mínima requerida: 6 años');
    END IF;
    
    -- Validar documento único
    IF EXISTS (SELECT 1 FROM scouts WHERE numero_documento = p_numero_documento) THEN
        RETURN json_build_object('success', false, 'error', 'Ya existe un scout con este número de documento');
    END IF;
    
    -- Sugerir rama según edad si no se especifica
    IF p_rama_actual IS NULL OR p_rama_actual = '' THEN
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
        es_dirigente, rama_actual, estado, fecha_ingreso
    ) VALUES (
        v_codigo_scout, p_nombres, p_apellidos, p_fecha_nacimiento,
        p_tipo_documento, p_numero_documento, p_celular, p_correo,
        p_departamento, p_provincia, p_distrito, p_direccion,
        p_centro_estudio, p_ocupacion, p_centro_laboral,
        p_es_dirigente, v_rama_sugerida, 'activo', CURRENT_DATE
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
            true, 
            CASE WHEN COALESCE(p_parentesco, 'Padre') IN ('Padre', 'Madre', 'Tutor') THEN true ELSE false END
        ) RETURNING id INTO v_familiar_id;
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

-- ============================================
-- 🧪 PRUEBA LA FUNCIÓN
-- ============================================
-- Ejecuta esto después de crear la función para probarla:

/*
SELECT registrar_scout_completo(
  'Juan Carlos',
  'Pérez López', 
  '2010-05-15',
  '12345678',
  'DNI',
  '987654321',
  'juan@email.com',
  'Lima',
  'Lima', 
  'San Borja',
  'Av. Test 123',
  'Colegio San Patricio',
  'Estudiante',
  null,
  false,
  'Scouts',
  'María',
  'López Rodríguez',
  'Madre',
  '987654320',
  'maria@email.com',
  'Doctora'
);
*/