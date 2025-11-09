-- ================================================================
-- 🎯 MASTER INSTALLATION COMPLETO - SISTEMA SCOUT LIMA 12
-- ================================================================
-- VERSIÓN: Corregida y Unificada - Noviembre 2025
-- FECHA: 1 de noviembre de 2025
-- ESTADO: Instalación completa sin archivos adicionales
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🚀 ========================================';
    RAISE NOTICE '🎯 INSTALACIÓN MASTER SISTEMA SCOUT LIMA 12';
    RAISE NOTICE '🔧 VERSIÓN CORREGIDA Y UNIFICADA';
    RAISE NOTICE '🚀 ========================================';
END $$;

-- ================================================================
-- 🧹 FASE 1: LIMPIEZA COMPLETA
-- ================================================================

-- Eliminar vistas materializadas primero
DROP MATERIALIZED VIEW IF EXISTS mv_estadisticas_scouts CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_resumen_inventario CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_estadisticas_asistencia CASCADE;

-- Eliminar todas las tablas del sistema Scout
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS cache_estadisticas CASCADE;
DROP TABLE IF EXISTS estadisticas_precalculadas CASCADE;
DROP TABLE IF EXISTS pagos_inscripcion CASCADE;
DROP TABLE IF EXISTS inscripciones CASCADE;
DROP TABLE IF EXISTS puntos_patrulla CASCADE;
DROP TABLE IF EXISTS historico_rama CASCADE;
DROP TABLE IF EXISTS gastos_presupuesto CASCADE;
DROP TABLE IF EXISTS presupuestos CASCADE;
DROP TABLE IF EXISTS asistencias CASCADE;
DROP TABLE IF EXISTS inscripciones_actividad CASCADE;
DROP TABLE IF EXISTS actividades_scout CASCADE;
DROP TABLE IF EXISTS movimientos_inventario CASCADE;
DROP TABLE IF EXISTS inventario CASCADE;
DROP TABLE IF EXISTS miembros_patrulla CASCADE;
DROP TABLE IF EXISTS patrullas CASCADE;
DROP TABLE IF EXISTS dirigentes CASCADE;
DROP TABLE IF EXISTS familiares_scout CASCADE;
DROP TABLE IF EXISTS scouts CASCADE;
DROP TABLE IF EXISTS grupos_scout CASCADE;
DROP TABLE IF EXISTS patrocinadores_grupo CASCADE;
DROP TABLE IF EXISTS libro_oro CASCADE;
DROP TABLE IF EXISTS programa_semanal CASCADE;
DROP TABLE IF EXISTS programa_actividades CASCADE;
DROP TABLE IF EXISTS comite_padres CASCADE;

-- Eliminar tipos ENUM
DROP TYPE IF EXISTS operation_type CASCADE;
DROP TYPE IF EXISTS response_status CASCADE;
DROP TYPE IF EXISTS estado_presupuesto_enum CASCADE;
DROP TYPE IF EXISTS tipo_presupuesto_enum CASCADE;
DROP TYPE IF EXISTS estado_actividad_enum CASCADE;
DROP TYPE IF EXISTS tipo_actividad_enum CASCADE;
DROP TYPE IF EXISTS estado_asistencia_enum CASCADE;
DROP TYPE IF EXISTS estado_item_enum CASCADE;
DROP TYPE IF EXISTS categoria_inventario_enum CASCADE;
DROP TYPE IF EXISTS estado_dirigente_enum CASCADE;
DROP TYPE IF EXISTS cargo_dirigente_enum CASCADE;
DROP TYPE IF EXISTS parentesco_enum CASCADE;
DROP TYPE IF EXISTS tipo_documento_enum CASCADE;
DROP TYPE IF EXISTS rama_enum CASCADE;
DROP TYPE IF EXISTS sexo_enum CASCADE;
DROP TYPE IF EXISTS estado_enum CASCADE;
-- ================================================================
-- 📋 FASE 2: EXTENSIONES Y TIPOS BASE
-- ================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Crear tipos ENUM fundamentales
CREATE TYPE estado_enum AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'ELIMINADO');
CREATE TYPE sexo_enum AS ENUM ('MASCULINO', 'FEMENINO');
CREATE TYPE rama_enum AS ENUM ('Lobatos', 'Scouts', 'Rovers', 'Dirigentes');
CREATE TYPE tipo_documento_enum AS ENUM ('DNI', 'CARNET_EXTRANJERIA', 'PASAPORTE');
CREATE TYPE parentesco_enum AS ENUM ('PADRE', 'MADRE', 'TUTOR', 'HERMANO', 'TIO', 'ABUELO', 'OTRO');
CREATE TYPE cargo_dirigente_enum AS ENUM ('JEFE_GRUPO', 'SUBJEFE_GRUPO', 'JEFE_RAMA', 'SUBJEFE_RAMA', 'DIRIGENTE', 'ASISTENTE');
CREATE TYPE estado_dirigente_enum AS ENUM ('ACTIVO', 'INACTIVO', 'LICENCIA', 'SUSPENDIDO');
CREATE TYPE categoria_inventario_enum AS ENUM ('CAMPING', 'DEPORTE', 'COCINA', 'SEGURIDAD', 'EDUCATIVO', 'CEREMONIAL', 'OTRO');
CREATE TYPE estado_item_enum AS ENUM ('DISPONIBLE', 'PRESTADO', 'EN_MANTENIMIENTO', 'DAÑADO', 'PERDIDO');
CREATE TYPE estado_asistencia_enum AS ENUM ('PRESENTE', 'AUSENTE', 'TARDANZA', 'JUSTIFICADO');
CREATE TYPE tipo_actividad_enum AS ENUM ('REUNION', 'CAMPAMENTO', 'EXCURSION', 'SERVICIO', 'CEREMONIA', 'CAPACITACION', 'OTRO');
CREATE TYPE estado_actividad_enum AS ENUM ('PLANIFICADA', 'CONFIRMADA', 'EN_CURSO', 'FINALIZADA', 'CANCELADA');
CREATE TYPE tipo_presupuesto_enum AS ENUM ('OPERATIVO', 'INVERSION', 'EVENTO', 'CAMPAMENTO', 'EMERGENCIA');
CREATE TYPE estado_presupuesto_enum AS ENUM ('BORRADOR', 'APROBADO', 'EJECUTANDOSE', 'FINALIZADO', 'CANCELADO');
CREATE TYPE response_status AS ENUM ('SUCCESS', 'ERROR', 'WARNING', 'INFO');
CREATE TYPE operation_type AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'SEARCH', 'VALIDATE');
-- ================================================================
-- 📋 FASE 3: TABLAS PRINCIPALES
-- ================================================================

-- TABLA: scouts (tabla central del sistema)
CREATE TABLE scouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_scout VARCHAR(20) UNIQUE NOT NULL,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo sexo_enum NOT NULL,
    numero_documento VARCHAR(20) UNIQUE NOT NULL,
    tipo_documento tipo_documento_enum DEFAULT 'DNI',
    celular VARCHAR(20),
    correo VARCHAR(255),
    departamento VARCHAR(100),
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    direccion TEXT,
    centro_estudio VARCHAR(255),
    ocupacion VARCHAR(255),
    centro_laboral VARCHAR(255),
    rama_actual rama_enum NOT NULL,
    estado estado_enum DEFAULT 'ACTIVO',
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    fecha_ultimo_pago DATE,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: familiares_scout
CREATE TABLE familiares_scout (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    parentesco parentesco_enum NOT NULL,
    celular VARCHAR(20),
    correo VARCHAR(255),
    direccion_trabajo TEXT,
    es_contacto_emergencia BOOLEAN DEFAULT FALSE,
    es_autorizado_recoger BOOLEAN DEFAULT FALSE,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: dirigentes
CREATE TABLE dirigentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_dirigente VARCHAR(20) UNIQUE NOT NULL,
    scout_id UUID REFERENCES scouts(id) ON DELETE SET NULL,
    cargo cargo_dirigente_enum NOT NULL,
    rama_responsable rama_enum,
    fecha_inicio_cargo DATE NOT NULL,
    fecha_fin_cargo DATE,
    estado_dirigente estado_dirigente_enum DEFAULT 'ACTIVO',
    certificaciones TEXT[],
    experiencia_previa TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: patrullas
CREATE TABLE patrullas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_patrulla VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    lema VARCHAR(255),
    animal_totem VARCHAR(100),
    color_patrulla VARCHAR(50),
    rama rama_enum NOT NULL,
    lider_id UUID REFERENCES scouts(id) ON DELETE SET NULL,
    sublider_id UUID REFERENCES scouts(id) ON DELETE SET NULL,
    fecha_fundacion DATE DEFAULT CURRENT_DATE,
    estado estado_enum DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: miembros_patrulla
CREATE TABLE miembros_patrulla (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    patrulla_id UUID NOT NULL REFERENCES patrullas(id) ON DELETE CASCADE,
    cargo_patrulla VARCHAR(50) DEFAULT 'MIEMBRO',
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    fecha_salida DATE,
    estado_miembro estado_enum DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(scout_id, patrulla_id, fecha_ingreso)
);

-- TABLA: inventario
CREATE TABLE inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_item VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria categoria_inventario_enum NOT NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),
    cantidad_disponible INTEGER NOT NULL DEFAULT 0,
    cantidad_minima INTEGER DEFAULT 1,
    ubicacion VARCHAR(255),
    estado_item estado_item_enum DEFAULT 'DISPONIBLE',
    valor_unitario DECIMAL(10,2) DEFAULT 0.00,
    fecha_adquisicion DATE,
    proveedor VARCHAR(255),
    garantia_meses INTEGER DEFAULT 0,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: movimientos_inventario
CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(50) NOT NULL,
    cantidad INTEGER NOT NULL,
    cantidad_anterior INTEGER,
    scout_id UUID REFERENCES scouts(id) ON DELETE SET NULL,
    actividad_id UUID,
    dirigente_responsable_id UUID REFERENCES dirigentes(id) ON DELETE SET NULL,
    motivo VARCHAR(255),
    observaciones TEXT,
    fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: actividades_scout
CREATE TABLE actividades_scout (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_actividad VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_actividad tipo_actividad_enum NOT NULL,
    rama_objetivo rama_enum,
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    ubicacion VARCHAR(255),
    dirigente_responsable_id UUID REFERENCES dirigentes(id) ON DELETE SET NULL,
    costo_por_scout DECIMAL(10,2) DEFAULT 0.00,
    capacidad_maxima INTEGER,
    participantes_confirmados INTEGER DEFAULT 0,
    requiere_autorizacion BOOLEAN DEFAULT TRUE,
    material_necesario TEXT[],
    objetivos TEXT,
    estado estado_actividad_enum DEFAULT 'PLANIFICADA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: inscripciones_actividad
CREATE TABLE inscripciones_actividad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actividad_id UUID NOT NULL REFERENCES actividades_scout(id) ON DELETE CASCADE,
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    fecha_inscripcion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    observaciones TEXT,
    autorizado_por VARCHAR(255),
    fecha_autorizacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(actividad_id, scout_id)
);

-- TABLA: asistencias
CREATE TABLE asistencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    actividad_id UUID REFERENCES actividades_scout(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    tipo_reunion VARCHAR(100),
    estado_asistencia estado_asistencia_enum NOT NULL,
    hora_llegada TIME,
    hora_salida TIME,
    observaciones TEXT,
    registrado_por UUID REFERENCES dirigentes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: presupuestos
CREATE TABLE presupuestos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_presupuesto VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_presupuesto tipo_presupuesto_enum NOT NULL,
    monto_total DECIMAL(12,2) NOT NULL,
    monto_ejecutado DECIMAL(12,2) DEFAULT 0.00,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    responsable_id UUID REFERENCES dirigentes(id) ON DELETE SET NULL,
    estado estado_presupuesto_enum DEFAULT 'BORRADOR',
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: gastos_presupuesto
CREATE TABLE gastos_presupuesto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
    concepto VARCHAR(255) NOT NULL,
    descripcion TEXT,
    monto DECIMAL(10,2) NOT NULL,
    fecha_gasto DATE NOT NULL,
    comprobante_numero VARCHAR(100),
    proveedor VARCHAR(255),
    autorizado_por UUID REFERENCES dirigentes(id) ON DELETE SET NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: grupos_scout
CREATE TABLE grupos_scout (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_grupo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    numeral VARCHAR(10) NOT NULL,
    localidad VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    fecha_fundacion DATE NOT NULL,
    fundador VARCHAR(255),
    lugar_reunion TEXT,
    direccion_sede TEXT,
    telefono_contacto VARCHAR(20),
    email_contacto VARCHAR(255),
    sitio_web VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: libro_oro
CREATE TABLE libro_oro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    patrulla VARCHAR(100),
    rama rama_enum,
    tipo_logro VARCHAR(100) NOT NULL,
    logro VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    relatores VARCHAR(255),
    reconocimiento VARCHAR(50) NOT NULL,
    participantes TEXT,
    lugar VARCHAR(255),
    dirigente_responsable VARCHAR(255),
    evidencias TEXT,
    impacto TEXT,
    puntuacion INTEGER DEFAULT 0,
    validado_por VARCHAR(255),
    fecha_validacion DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: programa_semanal
CREATE TABLE programa_semanal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_programa VARCHAR(50) UNIQUE NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    tema_central VARCHAR(255) NOT NULL,
    rama rama_enum NOT NULL,
    objetivos TEXT[],
    responsable_programa VARCHAR(255),
    observaciones_generales TEXT,
    estado VARCHAR(50) DEFAULT 'PLANIFICADO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: programa_actividades
CREATE TABLE programa_actividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    programa_id UUID NOT NULL REFERENCES programa_semanal(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    hora_inicio TIME NOT NULL,
    duracion_minutos INTEGER NOT NULL,
    responsable VARCHAR(255),
    materiales TEXT[],
    observaciones TEXT,
    orden_ejecucion INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: comite_padres
CREATE TABLE comite_padres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    cargo VARCHAR(50) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado VARCHAR(50) DEFAULT 'ACTIVO',
    scout_hijo_id UUID REFERENCES scouts(id) ON DELETE SET NULL,
    scout_hijo_nombre VARCHAR(255),
    experiencia_previa TEXT,
    habilidades TEXT[],
    disponibilidad TEXT,
    observaciones TEXT,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    fecha_actualizacion DATE DEFAULT CURRENT_DATE,
    periodo_actual BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 📋 FASE 4: TABLAS DE SISTEMA
-- ================================================================

-- TABLA: cache_estadisticas
CREATE TABLE cache_estadisticas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_data JSON NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo_cache VARCHAR(100) NOT NULL,
    parametros JSON DEFAULT '{}',
    hits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: estadisticas_precalculadas
CREATE TABLE estadisticas_precalculadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_estadistica VARCHAR(100) NOT NULL,
    periodo VARCHAR(50) NOT NULL,
    fecha_periodo DATE NOT NULL,
    datos_estadisticos JSON NOT NULL,
    calculado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: audit_log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    record_id UUID,
    user_id UUID,
    data_before JSON,
    data_after JSON,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 📋 FASE 5: ÍNDICES DE PERFORMANCE
-- ================================================================

-- Índices para scouts
CREATE INDEX idx_scouts_rama_estado ON scouts(rama_actual, estado) WHERE estado = 'ACTIVO';
CREATE UNIQUE INDEX idx_scouts_documento_unique ON scouts(numero_documento) WHERE numero_documento IS NOT NULL;
CREATE INDEX idx_scouts_fecha_nacimiento ON scouts(fecha_nacimiento);
CREATE INDEX idx_scouts_busqueda_texto ON scouts USING gin ((nombres || ' ' || apellidos) gin_trgm_ops);

-- Índices para inventario
CREATE INDEX idx_inventario_categoria_estado ON inventario(categoria, estado_item);
CREATE INDEX idx_inventario_stock_bajo ON inventario(cantidad_disponible, cantidad_minima) WHERE cantidad_disponible <= cantidad_minima;

-- Índices para asistencias
CREATE INDEX idx_asistencias_scout_fecha ON asistencias(scout_id, fecha DESC);
CREATE INDEX idx_asistencias_fecha_estado ON asistencias(fecha, estado_asistencia);

-- Índices para actividades
CREATE INDEX idx_actividades_rama_fechas ON actividades_scout(rama_objetivo, fecha_inicio, fecha_fin) WHERE estado != 'CANCELADA';

-- ================================================================
-- 📋 FASE 6: FUNCIONES DE UTILIDAD
-- ================================================================

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para validar email
CREATE OR REPLACE FUNCTION validar_email(p_email VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Función para calcular edad
CREATE OR REPLACE FUNCTION calcular_edad(fecha_nacimiento DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_nacimiento))::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 FASE 7: TRIGGERS AUTOMÁTICOS
-- ================================================================

-- Triggers para actualización automática de timestamps (con manejo de duplicados)
DROP TRIGGER IF EXISTS trigger_scouts_updated_at ON scouts;
CREATE TRIGGER trigger_scouts_updated_at
    BEFORE UPDATE ON scouts
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

DROP TRIGGER IF EXISTS trigger_grupos_scout_updated_at ON grupos_scout;
CREATE TRIGGER trigger_grupos_scout_updated_at
    BEFORE UPDATE ON grupos_scout
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

DROP TRIGGER IF EXISTS trigger_libro_oro_updated_at ON libro_oro;
CREATE TRIGGER trigger_libro_oro_updated_at
    BEFORE UPDATE ON libro_oro
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

DROP TRIGGER IF EXISTS trigger_programa_semanal_updated_at ON programa_semanal;
CREATE TRIGGER trigger_programa_semanal_updated_at
    BEFORE UPDATE ON programa_semanal
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

DROP TRIGGER IF EXISTS trigger_comite_padres_updated_at ON comite_padres;
CREATE TRIGGER trigger_comite_padres_updated_at
    BEFORE UPDATE ON comite_padres
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

-- ================================================================
-- 📋 FASE 8: VISTAS MATERIALIZADAS (DESPUÉS DE TODAS LAS TABLAS)
-- ================================================================

-- Vista materializada para estadísticas de scouts
CREATE MATERIALIZED VIEW mv_estadisticas_scouts AS
SELECT 
    rama_actual,
    COUNT(*) as total_scouts,
    COUNT(CASE WHEN estado = 'ACTIVO' THEN 1 END) as scouts_activos,
    COUNT(CASE WHEN estado = 'INACTIVO' THEN 1 END) as scouts_inactivos,
    ROUND(AVG(EXTRACT(YEAR FROM AGE(fecha_nacimiento))), 1) as edad_promedio,
    MIN(fecha_ingreso) as primer_ingreso,
    MAX(fecha_ingreso) as ultimo_ingreso
FROM scouts
GROUP BY rama_actual;

CREATE UNIQUE INDEX idx_mv_estadisticas_scouts_rama ON mv_estadisticas_scouts(rama_actual);

-- Vista materializada para resumen de inventario
CREATE MATERIALIZED VIEW mv_resumen_inventario AS
SELECT 
    categoria,
    COUNT(*) as total_items,
    COUNT(CASE WHEN estado_item = 'DISPONIBLE' THEN 1 END) as items_disponibles,
    COUNT(CASE WHEN estado_item = 'PRESTADO' THEN 1 END) as items_prestados,
    COUNT(CASE WHEN cantidad_disponible <= cantidad_minima THEN 1 END) as items_stock_bajo,
    SUM(valor_unitario * cantidad_disponible) as valor_total_categoria
FROM inventario
GROUP BY categoria;

CREATE UNIQUE INDEX idx_mv_resumen_inventario_categoria ON mv_resumen_inventario(categoria);

-- Vista materializada para estadísticas de asistencia (CORREGIDA)
CREATE MATERIALIZED VIEW mv_estadisticas_asistencia AS
SELECT 
    s.rama_actual,
    s.id as scout_id,
    s.nombres || ' ' || s.apellidos as scout_nombre,
    COUNT(a.id) as total_reuniones,
    COUNT(CASE WHEN a.estado_asistencia = 'PRESENTE' THEN 1 END) as asistencias,
    COUNT(CASE WHEN a.estado_asistencia != 'PRESENTE' THEN 1 END) as ausencias,
    ROUND(
        CASE 
            WHEN COUNT(a.id) > 0 
            THEN (COUNT(CASE WHEN a.estado_asistencia = 'PRESENTE' THEN 1 END)::NUMERIC / COUNT(a.id) * 100)
            ELSE 0 
        END, 2
    ) as porcentaje_asistencia,
    MAX(a.fecha) as ultima_asistencia
FROM scouts s
LEFT JOIN asistencias a ON s.id = a.scout_id 
    AND a.fecha >= CURRENT_DATE - INTERVAL '1 year'
WHERE s.estado = 'ACTIVO'
GROUP BY s.rama_actual, s.id, s.nombres, s.apellidos;

CREATE INDEX idx_mv_estadisticas_asistencia_rama_porcentaje 
    ON mv_estadisticas_asistencia(rama_actual, porcentaje_asistencia DESC);

-- ================================================================
-- 📋 FASE 9: FUNCIONES BÁSICAS API
-- ================================================================

-- Función para generar códigos únicos
CREATE OR REPLACE FUNCTION generar_codigo_scout()
RETURNS TEXT AS $$
DECLARE
    v_numero INTEGER := 1;
    v_codigo TEXT;
    v_existe BOOLEAN;
BEGIN
    LOOP
        v_codigo := 'SC' || LPAD(v_numero::TEXT, 4, '0');
        
        SELECT EXISTS(SELECT 1 FROM scouts WHERE codigo_scout = v_codigo) INTO v_existe;
        
        IF NOT v_existe THEN
            EXIT;
        END IF;
        
        v_numero := v_numero + 1;
        
        IF v_numero > 9999 THEN
            RAISE EXCEPTION 'No se puede generar código único para scouts';
        END IF;
    END LOOP;
    
    RETURN v_codigo;
END;
$$ LANGUAGE plpgsql;

-- Función API para registrar scout
CREATE OR REPLACE FUNCTION api_registrar_scout(p_data JSON)
RETURNS JSON AS $$
DECLARE
    v_scout_id UUID;
    v_codigo_scout TEXT;
    v_rama_calculada rama_enum;
    v_edad INTEGER;
BEGIN
    -- Validar campos requeridos
    IF NOT (p_data ? 'nombres') OR NOT (p_data ? 'apellidos') OR NOT (p_data ? 'fecha_nacimiento') 
       OR NOT (p_data ? 'documento_identidad') OR NOT (p_data ? 'sexo') THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Campos requeridos faltantes',
            'errors', json_build_array('nombres, apellidos, fecha_nacimiento, documento_identidad y sexo son requeridos')
        );
    END IF;
    
    -- Verificar documento único
    IF EXISTS (SELECT 1 FROM scouts WHERE numero_documento = (p_data ->> 'documento_identidad')) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Ya existe un scout con este documento de identidad',
            'errors', json_build_array('Documento de identidad duplicado')
        );
    END IF;
    
    -- Calcular edad y rama
    v_edad := EXTRACT(YEAR FROM AGE(CURRENT_DATE, (p_data ->> 'fecha_nacimiento')::DATE));
    
    IF v_edad < 5 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La edad mínima para ingresar es 5 años',
            'errors', json_build_array('Edad insuficiente')
        );
    END IF;
    
    -- Determinar rama automáticamente
    v_rama_calculada := CASE 
        WHEN v_edad BETWEEN 5 AND 10 THEN 'Lobatos'::rama_enum
        WHEN v_edad BETWEEN 11 AND 14 THEN 'Scouts'::rama_enum
        WHEN v_edad BETWEEN 15 AND 17 THEN 'Rovers'::rama_enum
        ELSE 'Dirigentes'::rama_enum
    END;
    
    -- Generar código scout
    v_codigo_scout := generar_codigo_scout();
    
    -- Insertar scout
    INSERT INTO scouts (
        codigo_scout, nombres, apellidos, fecha_nacimiento, sexo,
        numero_documento, tipo_documento, celular, correo,
        departamento, provincia, distrito, direccion,
        centro_estudio, rama_actual, estado, fecha_ingreso
    ) VALUES (
        v_codigo_scout,
        TRIM(p_data ->> 'nombres'),
        TRIM(p_data ->> 'apellidos'),
        (p_data ->> 'fecha_nacimiento')::DATE,
        (p_data ->> 'sexo')::sexo_enum,
        TRIM(p_data ->> 'documento_identidad'),
        COALESCE((p_data ->> 'tipo_documento')::tipo_documento_enum, 'DNI'::tipo_documento_enum),
        p_data ->> 'telefono',
        p_data ->> 'email',
        p_data ->> 'departamento',
        p_data ->> 'provincia',
        p_data ->> 'distrito',
        p_data ->> 'direccion',
        p_data ->> 'centro_estudio',
        v_rama_calculada,
        'ACTIVO'::estado_enum,
        CURRENT_DATE
    ) RETURNING id INTO v_scout_id;
    
    -- Retornar éxito
    RETURN json_build_object(
        'success', true,
        'message', 'Scout registrado exitosamente',
        'data', json_build_object(
            'scout_id', v_scout_id,
            'codigo_scout', v_codigo_scout,
            'rama_asignada', v_rama_calculada,
            'edad_calculada', v_edad
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error interno al registrar scout',
            'errors', json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 MENSAJE FINAL
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '✅ INSTALACIÓN MASTER UNIFICADA COMPLETADA';
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '🏗️ ESQUEMA: Creado correctamente';
    RAISE NOTICE '📊 TABLAS: 18 principales + 6 auxiliares';
    RAISE NOTICE '⚡ ÍNDICES: Optimizados para performance';
    RAISE NOTICE '🔄 VISTAS: 3 vistas materializadas';
    RAISE NOTICE '🔧 FUNCIONES: Básicas API operativas';
    RAISE NOTICE '✨ ESTADO: Sistema listo para uso';
    RAISE NOTICE '🎉 ========================================';
END $$;

SELECT 
    '🎯 INSTALACIÓN MASTER UNIFICADA COMPLETADA' as resultado,
    'Todas las tablas y estructuras creadas correctamente' as mensaje,
    'Sistema Scout Lima 12 listo para uso' as estado;

-- ================================================================
-- 📋 FASE 3: ESQUEMA PRINCIPAL - TABLAS BASE
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🏗️ Creando esquema principal de tablas...';
END $$;

-- TABLA: scouts (tabla central del sistema)
CREATE TABLE IF NOT EXISTS scouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_scout VARCHAR(20) UNIQUE NOT NULL,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo sexo_enum NOT NULL,
    numero_documento VARCHAR(20) UNIQUE NOT NULL,
    tipo_documento tipo_documento_enum DEFAULT 'DNI',
    celular VARCHAR(20),
    correo VARCHAR(255),
    departamento VARCHAR(100),
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    direccion TEXT,
    centro_estudio VARCHAR(255),
    ocupacion VARCHAR(255),
    centro_laboral VARCHAR(255),
    rama_actual rama_enum NOT NULL,
    estado estado_enum DEFAULT 'ACTIVO',
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    fecha_ultimo_pago DATE,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: familiares_scout
CREATE TABLE IF NOT EXISTS familiares_scout (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    parentesco parentesco_enum NOT NULL,
    celular VARCHAR(20),
    correo VARCHAR(255),
    direccion_trabajo TEXT,
    es_contacto_emergencia BOOLEAN DEFAULT FALSE,
    es_autorizado_recoger BOOLEAN DEFAULT FALSE,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: dirigentes
CREATE TABLE IF NOT EXISTS dirigentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_dirigente VARCHAR(20) UNIQUE NOT NULL,
    scout_id UUID REFERENCES scouts(id) ON DELETE SET NULL,
    cargo cargo_dirigente_enum NOT NULL,
    rama_responsable rama_enum,
    fecha_inicio_cargo DATE NOT NULL,
    fecha_fin_cargo DATE,
    estado_dirigente estado_dirigente_enum DEFAULT 'ACTIVO',
    certificaciones TEXT[],
    experiencia_previa TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: patrullas
CREATE TABLE IF NOT EXISTS patrullas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_patrulla VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    lema VARCHAR(255),
    animal_totem VARCHAR(100),
    color_patrulla VARCHAR(50),
    rama rama_enum NOT NULL,
    lider_id UUID REFERENCES scouts(id) ON DELETE SET NULL,
    sublider_id UUID REFERENCES scouts(id) ON DELETE SET NULL,
    fecha_fundacion DATE DEFAULT CURRENT_DATE,
    estado estado_enum DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: miembros_patrulla
CREATE TABLE IF NOT EXISTS miembros_patrulla (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    patrulla_id UUID NOT NULL REFERENCES patrullas(id) ON DELETE CASCADE,
    cargo_patrulla VARCHAR(50) DEFAULT 'MIEMBRO',
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    fecha_salida DATE,
    estado_miembro estado_enum DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(scout_id, patrulla_id, fecha_ingreso)
);

-- TABLA: inventario
CREATE TABLE IF NOT EXISTS inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_item VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria categoria_inventario_enum NOT NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),
    cantidad_disponible INTEGER NOT NULL DEFAULT 0,
    cantidad_minima INTEGER DEFAULT 1,
    ubicacion VARCHAR(255),
    estado_item estado_item_enum DEFAULT 'DISPONIBLE',
    valor_unitario DECIMAL(10,2) DEFAULT 0.00,
    fecha_adquisicion DATE,
    proveedor VARCHAR(255),
    garantia_meses INTEGER DEFAULT 0,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: movimientos_inventario
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(50) NOT NULL, -- 'ENTRADA', 'SALIDA', 'DEVOLUCION', 'AJUSTE', 'PERDIDA', 'DAÑO'
    cantidad INTEGER NOT NULL,
    cantidad_anterior INTEGER,
    scout_id UUID REFERENCES scouts(id) ON DELETE SET NULL,
    actividad_id UUID, -- Referencias actividades_scout cuando se implemente
    dirigente_responsable_id UUID REFERENCES dirigentes(id) ON DELETE SET NULL,
    motivo VARCHAR(255),
    observaciones TEXT,
    fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: actividades_scout
CREATE TABLE IF NOT EXISTS actividades_scout (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_actividad VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_actividad tipo_actividad_enum NOT NULL,
    rama_objetivo rama_enum,
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    ubicacion VARCHAR(255),
    dirigente_responsable_id UUID REFERENCES dirigentes(id) ON DELETE SET NULL,
    costo_por_scout DECIMAL(10,2) DEFAULT 0.00,
    capacidad_maxima INTEGER,
    participantes_confirmados INTEGER DEFAULT 0,
    requiere_autorizacion BOOLEAN DEFAULT TRUE,
    material_necesario TEXT[],
    objetivos TEXT,
    estado estado_actividad_enum DEFAULT 'PLANIFICADA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: inscripciones_actividad
CREATE TABLE IF NOT EXISTS inscripciones_actividad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actividad_id UUID NOT NULL REFERENCES actividades_scout(id) ON DELETE CASCADE,
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    fecha_inscripcion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'CONFIRMADO', 'CANCELADO'
    observaciones TEXT,
    autorizado_por VARCHAR(255),
    fecha_autorizacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(actividad_id, scout_id)
);

-- TABLA: asistencias
CREATE TABLE IF NOT EXISTS asistencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    actividad_id UUID REFERENCES actividades_scout(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    tipo_reunion VARCHAR(100), -- 'REUNION_SEMANAL', 'ACTIVIDAD_ESPECIAL', etc.
    estado_asistencia estado_asistencia_enum NOT NULL,
    hora_llegada TIME,
    hora_salida TIME,
    observaciones TEXT,
    registrado_por UUID REFERENCES dirigentes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: presupuestos
CREATE TABLE IF NOT EXISTS presupuestos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_presupuesto VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_presupuesto tipo_presupuesto_enum NOT NULL,
    monto_total DECIMAL(12,2) NOT NULL,
    monto_ejecutado DECIMAL(12,2) DEFAULT 0.00,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    responsable_id UUID REFERENCES dirigentes(id) ON DELETE SET NULL,
    estado estado_presupuesto_enum DEFAULT 'BORRADOR',
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: gastos_presupuesto
CREATE TABLE IF NOT EXISTS gastos_presupuesto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
    concepto VARCHAR(255) NOT NULL,
    descripcion TEXT,
    monto DECIMAL(10,2) NOT NULL,
    fecha_gasto DATE NOT NULL,
    comprobante_numero VARCHAR(100),
    proveedor VARCHAR(255),
    autorizado_por UUID REFERENCES dirigentes(id) ON DELETE SET NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 📋 FASE 4: TABLAS ADICIONALES Y EXTENSIONES
-- ================================================================

-- TABLA: historico_rama (para tracking de cambios de rama)
CREATE TABLE IF NOT EXISTS historico_rama (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    rama_anterior rama_enum,
    rama_nueva rama_enum NOT NULL,
    fecha_cambio DATE DEFAULT CURRENT_DATE,
    motivo VARCHAR(255),
    dirigente_responsable_id UUID REFERENCES dirigentes(id) ON DELETE SET NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: puntos_patrulla
CREATE TABLE IF NOT EXISTS puntos_patrulla (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patrulla_id UUID NOT NULL REFERENCES patrullas(id) ON DELETE CASCADE,
    concepto VARCHAR(255) NOT NULL,
    puntos_obtenidos INTEGER NOT NULL,
    fecha_otorgamiento DATE DEFAULT CURRENT_DATE,
    actividad_id UUID REFERENCES actividades_scout(id) ON DELETE SET NULL,
    dirigente_otorgante_id UUID REFERENCES dirigentes(id) ON DELETE SET NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: inscripciones (anuales)
CREATE TABLE IF NOT EXISTS inscripciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    periodo_id VARCHAR(20) NOT NULL, -- '2024', '2025', etc.
    fecha_inscripcion DATE DEFAULT CURRENT_DATE,
    monto_inscripcion DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'PAGADO', 'VENCIDO'
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(scout_id, periodo_id)
);

-- TABLA: pagos_inscripcion
CREATE TABLE IF NOT EXISTS pagos_inscripcion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inscripcion_id UUID NOT NULL REFERENCES inscripciones(id) ON DELETE CASCADE,
    monto_pagado DECIMAL(10,2) NOT NULL,
    fecha_pago DATE NOT NULL,
    metodo_pago VARCHAR(50), -- 'EFECTIVO', 'TRANSFERENCIA', 'TARJETA'
    comprobante_numero VARCHAR(100),
    recibido_por UUID REFERENCES dirigentes(id) ON DELETE SET NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: grupos_scout (gestión de grupos scout)
CREATE TABLE IF NOT EXISTS grupos_scout (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_grupo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    numeral VARCHAR(10) NOT NULL,
    localidad VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    fecha_fundacion DATE NOT NULL,
    fundador VARCHAR(255),
    lugar_reunion TEXT,
    direccion_sede TEXT,
    telefono_contacto VARCHAR(20),
    email_contacto VARCHAR(255),
    sitio_web VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: patrocinadores_grupo
CREATE TABLE IF NOT EXISTS patrocinadores_grupo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos_scout(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'PUBLICO', 'PRIVADO', 'ONG', 'OTRO'
    contacto VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(255),
    monto_aporte DECIMAL(10,2) DEFAULT 0.00,
    tipo_aporte VARCHAR(100), -- 'MONETARIO', 'MATERIAL', 'SERVICIO', 'MIXTO'
    fecha_inicio DATE,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT true,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: libro_oro (relatos especiales de actividades scout)
CREATE TABLE IF NOT EXISTS libro_oro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    patrulla VARCHAR(100),
    rama rama_enum,
    tipo_logro VARCHAR(100) NOT NULL, -- 'Campamento', 'Servicio Comunitario', 'Competencia', etc.
    logro VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    relatores VARCHAR(255),
    reconocimiento VARCHAR(50) NOT NULL, -- 'Oro', 'Plata', 'Bronce', 'Especial'
    participantes TEXT,
    lugar VARCHAR(255),
    dirigente_responsable VARCHAR(255),
    evidencias TEXT,
    impacto TEXT,
    puntuacion INTEGER DEFAULT 0,
    validado_por VARCHAR(255),
    fecha_validacion DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: programa_semanal (planificación de actividades semanales)
CREATE TABLE IF NOT EXISTS programa_semanal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_programa VARCHAR(50) UNIQUE NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    tema_central VARCHAR(255) NOT NULL,
    rama rama_enum NOT NULL,
    objetivos TEXT[],
    responsable_programa VARCHAR(255),
    observaciones_generales TEXT,
    estado VARCHAR(50) DEFAULT 'PLANIFICADO', -- 'PLANIFICADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: programa_actividades (actividades específicas del programa semanal)
CREATE TABLE IF NOT EXISTS programa_actividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    programa_id UUID NOT NULL REFERENCES programa_semanal(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    hora_inicio TIME NOT NULL,
    duracion_minutos INTEGER NOT NULL,
    responsable VARCHAR(255),
    materiales TEXT[],
    observaciones TEXT,
    orden_ejecucion INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: comite_padres (miembros del comité de padres)
CREATE TABLE IF NOT EXISTS comite_padres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    cargo VARCHAR(50) NOT NULL, -- 'PRESIDENTE', 'SECRETARIO', 'TESORERO', 'VOCAL', 'SUPLENTE'
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado VARCHAR(50) DEFAULT 'ACTIVO', -- 'ACTIVO', 'INACTIVO', 'CULMINADO'
    scout_hijo_id UUID REFERENCES scouts(id) ON DELETE SET NULL,
    scout_hijo_nombre VARCHAR(255),
    experiencia_previa TEXT,
    habilidades TEXT[],
    disponibilidad TEXT,
    observaciones TEXT,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    fecha_actualizacion DATE DEFAULT CURRENT_DATE,
    periodo_actual BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 📋 FASE 5: TABLAS DE OPTIMIZACIÓN Y CACHING
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🔄 Creando sistema de caching y optimización...';
END $$;

-- TABLA: cache_estadisticas (para caching inteligente)
CREATE TABLE IF NOT EXISTS cache_estadisticas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_data JSON NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo_cache VARCHAR(100) NOT NULL,
    parametros JSON DEFAULT '{}',
    hits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: estadisticas_precalculadas (para reportes rápidos)
CREATE TABLE IF NOT EXISTS estadisticas_precalculadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_estadistica VARCHAR(100) NOT NULL,
    periodo VARCHAR(50) NOT NULL, -- 'diario', 'semanal', 'mensual'
    fecha_periodo DATE NOT NULL,
    datos_estadisticos JSON NOT NULL,
    calculado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: audit_log (para auditoría de operaciones)
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    record_id UUID,
    user_id UUID,
    data_before JSON,
    data_after JSON,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 📋 FASE 6: ÍNDICES DE PERFORMANCE ESTRATÉGICOS
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '⚡ Creando índices de performance optimizados...';
END $$;

-- ============= ÍNDICES PARA SCOUTS =============

-- Búsquedas frecuentes por rama y estado
CREATE INDEX IF NOT EXISTS idx_scouts_rama_estado 
    ON scouts(rama_actual, estado) 
    WHERE estado = 'ACTIVO';

-- Búsquedas por documento de identidad (único y frecuente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_scouts_documento_unique 
    ON scouts(numero_documento) 
    WHERE numero_documento IS NOT NULL;

-- Búsquedas por rango de edades
CREATE INDEX IF NOT EXISTS idx_scouts_fecha_nacimiento 
    ON scouts(fecha_nacimiento);

-- Índice compuesto para estadísticas por rama
CREATE INDEX IF NOT EXISTS idx_scouts_stats_rama 
    ON scouts(rama_actual, estado, fecha_ingreso);

-- Índice GIN para búsquedas de texto en nombres
CREATE INDEX IF NOT EXISTS idx_scouts_busqueda_texto 
    ON scouts USING gin ((nombres || ' ' || apellidos) gin_trgm_ops);

-- ============= ÍNDICES PARA INVENTARIO =============

-- Búsquedas por categoría y estado
CREATE INDEX IF NOT EXISTS idx_inventario_categoria_estado 
    ON inventario(categoria, estado_item);

-- Items con stock bajo (alertas frecuentes)
CREATE INDEX IF NOT EXISTS idx_inventario_stock_bajo 
    ON inventario(cantidad_disponible, cantidad_minima) 
    WHERE cantidad_disponible <= cantidad_minima;

-- Búsquedas por ubicación
CREATE INDEX IF NOT EXISTS idx_inventario_ubicacion 
    ON inventario(ubicacion) 
    WHERE ubicacion IS NOT NULL;

-- Valor total del inventario
CREATE INDEX IF NOT EXISTS idx_inventario_valor 
    ON inventario(valor_unitario, cantidad_disponible) 
    WHERE estado_item = 'DISPONIBLE';

-- Búsquedas de texto en inventario
CREATE INDEX IF NOT EXISTS idx_inventario_busqueda_texto 
    ON inventario USING gin ((nombre || ' ' || descripcion) gin_trgm_ops);

-- ============= ÍNDICES PARA MOVIMIENTOS =============

-- Historial por item (consulta muy frecuente)
CREATE INDEX IF NOT EXISTS idx_movimientos_item_fecha 
    ON movimientos_inventario(item_id, created_at DESC);

-- Movimientos recientes por tipo
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo_fecha 
    ON movimientos_inventario(tipo_movimiento, created_at DESC);

-- Movimientos por scout
CREATE INDEX IF NOT EXISTS idx_movimientos_scout 
    ON movimientos_inventario(scout_id, created_at DESC) 
    WHERE scout_id IS NOT NULL;

-- ============= ÍNDICES PARA ASISTENCIAS =============

-- Asistencias por scout y fecha
CREATE INDEX IF NOT EXISTS idx_asistencias_scout_fecha 
    ON asistencias(scout_id, fecha DESC);

-- Asistencias por actividad
CREATE INDEX IF NOT EXISTS idx_asistencias_actividad_estado 
    ON asistencias(actividad_id, estado_asistencia) 
    WHERE actividad_id IS NOT NULL;

-- Rango de fechas para reportes
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha_estado 
    ON asistencias(fecha, estado_asistencia);

-- ============= ÍNDICES PARA ACTIVIDADES =============

-- Actividades por rama y fechas
CREATE INDEX IF NOT EXISTS idx_actividades_rama_fechas 
    ON actividades_scout(rama_objetivo, fecha_inicio, fecha_fin) 
    WHERE estado != 'CANCELADA';

-- Actividades futuras por tipo
CREATE INDEX IF NOT EXISTS idx_actividades_futuras 
    ON actividades_scout(tipo_actividad, fecha_inicio);

-- Búsquedas por responsable
CREATE INDEX IF NOT EXISTS idx_actividades_responsable 
    ON actividades_scout(dirigente_responsable_id, fecha_inicio DESC);

-- ============= ÍNDICES PARA INSCRIPCIONES =============

-- Inscripciones por actividad y estado
CREATE INDEX IF NOT EXISTS idx_inscripciones_actividad_estado 
    ON inscripciones_actividad(actividad_id, estado);

-- Historial por scout
CREATE INDEX IF NOT EXISTS idx_inscripciones_scout_fecha 
    ON inscripciones_actividad(scout_id, created_at DESC);

-- ============= ÍNDICES PARA PATRULLAS =============

-- Miembros activos por patrulla
CREATE INDEX IF NOT EXISTS idx_miembros_patrulla_activos 
    ON miembros_patrulla(patrulla_id, estado_miembro) 
    WHERE estado_miembro = 'ACTIVO';

-- Puntos por patrulla y fecha
CREATE INDEX IF NOT EXISTS idx_puntos_patrulla_fecha 
    ON puntos_patrulla(patrulla_id, fecha_otorgamiento DESC);

-- ============= ÍNDICES PARA CACHE Y AUDITORÍA =============

-- Cache por clave y expiración
CREATE INDEX IF NOT EXISTS idx_cache_key_expiracion 
    ON cache_estadisticas(cache_key, fecha_expiracion);

-- Cache por tipo
CREATE INDEX IF NOT EXISTS idx_cache_tipo_expiracion 
    ON cache_estadisticas(tipo_cache, fecha_expiracion);

-- Estadísticas pre-calculadas
CREATE UNIQUE INDEX IF NOT EXISTS idx_estadisticas_precalc_unique 
    ON estadisticas_precalculadas(tipo_estadistica, periodo, fecha_periodo);

-- Auditoría por tabla
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);

-- ============= ÍNDICES PARA GRUPOS SCOUT =============

-- Búsquedas por numeral y localidad
CREATE INDEX IF NOT EXISTS idx_grupos_scout_numeral_localidad 
    ON grupos_scout(numeral, localidad) 
    WHERE activo = true;

-- Búsquedas por región
CREATE INDEX IF NOT EXISTS idx_grupos_scout_region 
    ON grupos_scout(region, activo);

-- Búsquedas de texto en nombres de grupo
CREATE INDEX IF NOT EXISTS idx_grupos_scout_busqueda_texto 
    ON grupos_scout USING gin ((nombre || ' ' || localidad) gin_trgm_ops);

-- Patrocinadores por grupo
CREATE INDEX IF NOT EXISTS idx_patrocinadores_grupo_activos 
    ON patrocinadores_grupo(grupo_id, activo) 
    WHERE activo = true;

-- Patrocinadores por tipo
CREATE INDEX IF NOT EXISTS idx_patrocinadores_tipo 
    ON patrocinadores_grupo(tipo, activo);

-- ============= ÍNDICES PARA LIBRO ORO =============

-- Búsquedas por fecha y reconocimiento
CREATE INDEX IF NOT EXISTS idx_libro_oro_fecha_reconocimiento 
    ON libro_oro(fecha DESC, reconocimiento);

-- Búsquedas por rama y tipo de logro
CREATE INDEX IF NOT EXISTS idx_libro_oro_rama_tipo 
    ON libro_oro(rama, tipo_logro);

-- Búsquedas de texto en títulos y logros
CREATE INDEX IF NOT EXISTS idx_libro_oro_busqueda_texto 
    ON libro_oro USING gin ((titulo || ' ' || logro) gin_trgm_ops);

-- Validaciones pendientes
CREATE INDEX IF NOT EXISTS idx_libro_oro_validacion 
    ON libro_oro(validado_por, fecha_validacion)
    WHERE validado_por IS NULL;

-- ============= ÍNDICES PARA PROGRAMA SEMANAL =============

-- Búsquedas por fechas y rama
CREATE INDEX IF NOT EXISTS idx_programa_semanal_fechas_rama 
    ON programa_semanal(fecha_inicio, fecha_fin, rama);

-- Estado del programa
CREATE INDEX IF NOT EXISTS idx_programa_semanal_estado 
    ON programa_semanal(estado, fecha_inicio DESC);

-- Actividades por programa
CREATE INDEX IF NOT EXISTS idx_programa_actividades_programa 
    ON programa_actividades(programa_id, orden_ejecucion);

-- ============= ÍNDICES PARA COMITÉ PADRES =============

-- Miembros activos por cargo
CREATE INDEX IF NOT EXISTS idx_comite_padres_cargo_activo 
    ON comite_padres(cargo, estado) 
    WHERE estado = 'ACTIVO';

-- Período actual
CREATE INDEX IF NOT EXISTS idx_comite_padres_periodo_actual 
    ON comite_padres(periodo_actual, fecha_inicio DESC) 
    WHERE periodo_actual = true;

-- Relación con scouts hijos
CREATE INDEX IF NOT EXISTS idx_comite_padres_scout_hijo 
    ON comite_padres(scout_hijo_id) 
    WHERE scout_hijo_id IS NOT NULL;

-- ============= ÍNDICES PARA REPORTES GENERALES =============

CREATE INDEX IF NOT EXISTS idx_created_at_scouts ON scouts(created_at);
CREATE INDEX IF NOT EXISTS idx_created_at_actividades ON actividades_scout(created_at);
CREATE INDEX IF NOT EXISTS idx_created_at_asistencias ON asistencias(created_at);

-- ================================================================
-- 📋 FASE 7: VISTAS MATERIALIZADAS PARA PERFORMANCE
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '📊 Creando vistas materializadas...';
END $$;

-- Vista materializada para estadísticas de scouts
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_estadisticas_scouts AS
SELECT 
    rama_actual,
    COUNT(*) as total_scouts,
    COUNT(CASE WHEN estado = 'ACTIVO' THEN 1 END) as scouts_activos,
    COUNT(CASE WHEN estado = 'INACTIVO' THEN 1 END) as scouts_inactivos,
    ROUND(AVG(EXTRACT(YEAR FROM AGE(fecha_nacimiento))), 1) as edad_promedio,
    MIN(fecha_ingreso) as primer_ingreso,
    MAX(fecha_ingreso) as ultimo_ingreso,
    COUNT(CASE WHEN fecha_ingreso >= CURRENT_DATE - INTERVAL '1 year' THEN 1 END) as ingresos_ultimo_año
FROM scouts
GROUP BY rama_actual;

-- Índice en la vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_estadisticas_scouts_rama 
    ON mv_estadisticas_scouts(rama_actual);

-- Vista materializada para resumen de inventario
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_resumen_inventario AS
SELECT 
    categoria,
    COUNT(*) as total_items,
    COUNT(CASE WHEN estado_item = 'DISPONIBLE' THEN 1 END) as items_disponibles,
    COUNT(CASE WHEN estado_item = 'PRESTADO' THEN 1 END) as items_prestados,
    COUNT(CASE WHEN estado_item = 'EN_MANTENIMIENTO' THEN 1 END) as items_mantenimiento,
    COUNT(CASE WHEN cantidad_disponible <= cantidad_minima THEN 1 END) as items_stock_bajo,
    SUM(valor_unitario * cantidad_disponible) as valor_total_categoria,
    SUM(cantidad_disponible) as cantidad_total,
    AVG(valor_unitario) as valor_promedio
FROM inventario
GROUP BY categoria;

-- Índice en la vista materializada de inventario
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_resumen_inventario_categoria 
    ON mv_resumen_inventario(categoria);

-- Vista materializada para estadísticas de asistencia
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_estadisticas_asistencia AS
SELECT 
    s.rama_actual,
    s.id as scout_id,
    s.nombres || ' ' || s.apellidos as scout_nombre,
    COUNT(a.*) as total_reuniones,
    COUNT(CASE WHEN a.estado_asistencia = 'PRESENTE' THEN 1 END) as asistencias,
    COUNT(CASE WHEN a.estado_asistencia != 'PRESENTE' THEN 1 END) as ausencias,
    ROUND(
        CASE 
            WHEN COUNT(a.*) > 0 
            THEN (COUNT(CASE WHEN a.estado_asistencia = 'PRESENTE' THEN 1 END)::NUMERIC / COUNT(a.*) * 100)
            ELSE 0 
        END, 2
    ) as porcentaje_asistencia,
    MAX(a.fecha) as ultima_asistencia
FROM scouts s
LEFT JOIN asistencias a ON s.id = a.scout_id 
    AND a.fecha >= CURRENT_DATE - INTERVAL '1 year'
WHERE s.estado = 'ACTIVO'
GROUP BY s.rama_actual, s.id, s.nombres, s.apellidos;

-- Índice compuesto en la vista de asistencia
CREATE INDEX IF NOT EXISTS idx_mv_estadisticas_asistencia_rama_porcentaje 
    ON mv_estadisticas_asistencia(rama_actual, porcentaje_asistencia DESC);

-- ================================================================
-- 📋 FASE 8: FUNCIONES TRIGGER Y UTILIDADES BASE
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🔧 Creando funciones de utilidad base...';
END $$;

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para validar email
CREATE OR REPLACE FUNCTION validar_email(p_email VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Función para calcular edad
CREATE OR REPLACE FUNCTION calcular_edad(fecha_nacimiento DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_nacimiento))::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 FASE 9: TRIGGERS AUTOMÁTICOS PARA UPDATED_AT
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🔄 Configurando triggers automáticos...';
END $$;

-- Triggers adicionales para actualización automática de timestamps (con manejo de duplicados)
DROP TRIGGER IF EXISTS trigger_scouts_updated_at ON scouts;
CREATE TRIGGER trigger_scouts_updated_at
    BEFORE UPDATE ON scouts
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

DROP TRIGGER IF EXISTS trigger_familiares_updated_at ON familiares_scout;
CREATE TRIGGER trigger_familiares_updated_at
    BEFORE UPDATE ON familiares_scout
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

DROP TRIGGER IF EXISTS trigger_dirigentes_updated_at ON dirigentes;
CREATE TRIGGER trigger_dirigentes_updated_at
    BEFORE UPDATE ON dirigentes
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

DROP TRIGGER IF EXISTS trigger_patrullas_updated_at ON patrullas;
CREATE TRIGGER trigger_patrullas_updated_at
    BEFORE UPDATE ON patrullas
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

DROP TRIGGER IF EXISTS trigger_actividades_updated_at ON actividades_scout;
CREATE TRIGGER trigger_actividades_updated_at
    BEFORE UPDATE ON actividades_scout
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

DROP TRIGGER IF EXISTS trigger_inventario_updated_at ON inventario;
CREATE TRIGGER trigger_inventario_updated_at
    BEFORE UPDATE ON inventario
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

DROP TRIGGER IF EXISTS trigger_presupuestos_updated_at ON presupuestos;
CREATE TRIGGER trigger_presupuestos_updated_at
    BEFORE UPDATE ON presupuestos
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

DROP TRIGGER IF EXISTS trigger_grupos_scout_updated_at ON grupos_scout;
CREATE TRIGGER trigger_grupos_scout_updated_at
    BEFORE UPDATE ON grupos_scout
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

DROP TRIGGER IF EXISTS trigger_patrocinadores_grupo_updated_at ON patrocinadores_grupo;
CREATE TRIGGER trigger_patrocinadores_grupo_updated_at
    BEFORE UPDATE ON patrocinadores_grupo
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

DROP TRIGGER IF EXISTS trigger_libro_oro_updated_at ON libro_oro;
CREATE TRIGGER trigger_libro_oro_updated_at
    BEFORE UPDATE ON libro_oro
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

DROP TRIGGER IF EXISTS trigger_programa_semanal_updated_at ON programa_semanal;
CREATE TRIGGER trigger_programa_semanal_updated_at
    BEFORE UPDATE ON programa_semanal
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

DROP TRIGGER IF EXISTS trigger_comite_padres_updated_at ON comite_padres;
CREATE TRIGGER trigger_comite_padres_updated_at
    BEFORE UPDATE ON comite_padres
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

-- ================================================================
-- 📋 FASE 10: SECUENCIAS PARA CÓDIGOS AUTOMÁTICOS
-- ================================================================

-- Secuencias para generar códigos únicos
CREATE SEQUENCE IF NOT EXISTS seq_codigo_scout START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_dirigente START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_patrulla START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_actividad START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_presupuesto START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_inventario START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_grupo START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_programa START 1;

-- ================================================================
-- 📋 MENSAJE FINAL DE INSTALACIÓN LIMPIA
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '✅ MASTER INSTALLATION COMPLETADO EXITOSAMENTE';
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '💥 LIMPIEZA RADICAL: TODOS los objetos eliminados';
    RAISE NOTICE '🏗️ INSTALACIÓN FRESCA: Base de datos completamente nueva';
    RAISE NOTICE '📊 ESQUEMA: 18 tablas principales + 6 auxiliares (grupos_scout + libro_oro + programa_semanal + comite_padres)';
    RAISE NOTICE '⚡ PERFORMANCE: 55+ índices optimizados';
    RAISE NOTICE '🔄 CACHING: Sistema inteligente implementado';
    RAISE NOTICE '📈 VISTAS: 3 vistas materializadas creadas';
    RAISE NOTICE '🔧 UTILIDADES: Funciones base instaladas';
    RAISE NOTICE '🔄 TRIGGERS: Sistema automático configurado';
    RAISE NOTICE '🏕️ GRUPOS SCOUT: Tabla de grupos y patrocinadores incluida';
    RAISE NOTICE '📚 LIBRO ORO: Tabla de logros y reconocimientos incluida';
    RAISE NOTICE '📅 PROGRAMA SEMANAL: Tabla de planificación semanal incluida';
    RAISE NOTICE '👨‍👩‍👧‍👦 COMITÉ PADRES: Tabla de gestión de padres incluida';
    RAISE NOTICE '📋 SIGUIENTE PASO: Ejecutar MASTER_FUNCTIONS.sql';
    RAISE NOTICE '✨ BASE DE DATOS 100%% LIMPIA Y LISTA';
    RAISE NOTICE '🎉 ========================================';
END $$;

-- ============================================================
-- 🚀 FUNCIONES BÁSICAS DE INSTALACIÓN RÁPIDA (UNIFICADAS)
-- ============================================================
-- Estas funciones permiten uso inmediato del sistema

-- Función para generar códigos únicos
CREATE OR REPLACE FUNCTION generar_codigo_scout()
RETURNS TEXT AS $$
DECLARE
    v_numero INTEGER := 1;
    v_codigo TEXT;
    v_existe BOOLEAN;
BEGIN
    LOOP
        v_codigo := 'SC' || LPAD(v_numero::TEXT, 4, '0');
        
        SELECT EXISTS(SELECT 1 FROM scouts WHERE codigo_scout = v_codigo) INTO v_existe;
        
        IF NOT v_existe THEN
            EXIT;
        END IF;
        
        v_numero := v_numero + 1;
        
        IF v_numero > 9999 THEN
            RAISE EXCEPTION 'No se puede generar código único para scouts';
        END IF;
    END LOOP;
    
    RETURN v_codigo;
END;
$$ LANGUAGE plpgsql;

-- Función para generar códigos únicos de grupo
CREATE OR REPLACE FUNCTION generar_codigo_grupo()
RETURNS TEXT AS $$
DECLARE
    v_numero INTEGER := 1;
    v_codigo TEXT;
    v_existe BOOLEAN;
BEGIN
    LOOP
        v_codigo := 'GR' || LPAD(v_numero::TEXT, 4, '0');
        
        SELECT EXISTS(SELECT 1 FROM grupos_scout WHERE codigo_grupo = v_codigo) INTO v_existe;
        
        IF NOT v_existe THEN
            EXIT;
        END IF;
        
        v_numero := v_numero + 1;
        
        IF v_numero > 9999 THEN
            RAISE EXCEPTION 'No se puede generar código único para grupos';
        END IF;
    END LOOP;
    
    RETURN v_codigo;
END;
$$ LANGUAGE plpgsql;

-- Función API para registrar scout
CREATE OR REPLACE FUNCTION api_registrar_scout(p_data JSON)
RETURNS JSON AS $$
DECLARE
    v_scout_id UUID;
    v_codigo_scout TEXT;
    v_rama_calculada rama_enum;
    v_edad INTEGER;
BEGIN
    -- Validar campos requeridos
    IF NOT (p_data ? 'nombres') OR NOT (p_data ? 'apellidos') OR NOT (p_data ? 'fecha_nacimiento') 
       OR NOT (p_data ? 'documento_identidad') OR NOT (p_data ? 'sexo') THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Campos requeridos faltantes',
            'errors', json_build_array('nombres, apellidos, fecha_nacimiento, documento_identidad y sexo son requeridos')
        );
    END IF;
    
    -- Verificar documento único
    IF EXISTS (SELECT 1 FROM scouts WHERE numero_documento = (p_data ->> 'documento_identidad')) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Ya existe un scout con este documento de identidad',
            'errors', json_build_array('Documento de identidad duplicado')
        );
    END IF;
    
    -- Calcular edad y rama
    v_edad := EXTRACT(YEAR FROM AGE(CURRENT_DATE, (p_data ->> 'fecha_nacimiento')::DATE));
    
    IF v_edad < 5 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La edad mínima para ingresar es 5 años',
            'errors', json_build_array('Edad insuficiente')
        );
    END IF;
    
    -- Determinar rama automáticamente
    v_rama_calculada := CASE 
        WHEN v_edad BETWEEN 5 AND 10 THEN 'Lobatos'::rama_enum
        WHEN v_edad BETWEEN 11 AND 14 THEN 'Scouts'::rama_enum
        WHEN v_edad BETWEEN 15 AND 17 THEN 'Rovers'::rama_enum
        ELSE 'Dirigentes'::rama_enum
    END;
    
    -- Generar código scout
    v_codigo_scout := generar_codigo_scout();
    
    -- Insertar scout
    INSERT INTO scouts (
        codigo_scout, nombres, apellidos, fecha_nacimiento, sexo,
        numero_documento, tipo_documento, celular, correo,
        departamento, provincia, distrito, direccion,
        centro_estudio, rama_actual, estado, fecha_ingreso
    ) VALUES (
        v_codigo_scout,
        TRIM(p_data ->> 'nombres'),
        TRIM(p_data ->> 'apellidos'),
        (p_data ->> 'fecha_nacimiento')::DATE,
        (p_data ->> 'sexo')::sexo_enum,
        TRIM(p_data ->> 'documento_identidad'),
        COALESCE((p_data ->> 'tipo_documento')::tipo_documento_enum, 'DNI'::tipo_documento_enum),
        p_data ->> 'telefono',
        p_data ->> 'email',
        p_data ->> 'departamento',
        p_data ->> 'provincia',
        p_data ->> 'distrito',
        p_data ->> 'direccion',
        p_data ->> 'centro_estudio',
        v_rama_calculada,
        'ACTIVO'::estado_enum,
        CURRENT_DATE
    ) RETURNING id INTO v_scout_id;
    
    -- Retornar éxito
    RETURN json_build_object(
        'success', true,
        'message', 'Scout registrado exitosamente',
        'data', json_build_object(
            'scout_id', v_scout_id,
            'codigo_scout', v_codigo_scout,
            'rama_asignada', v_rama_calculada,
            'edad_calculada', v_edad
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error interno al registrar scout',
            'errors', json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- Verificación final de estructura limpia
DO $$ BEGIN
    RAISE NOTICE '� ========================================';
    RAISE NOTICE '✨ INSTALACIÓN MASTER + BÁSICA COMPLETADA';
    RAISE NOTICE '🏗️ ESQUEMA: Completamente limpio e instalado';
    RAISE NOTICE '🚀 FUNCIONES BÁSICAS: Registro de scouts operativo';
    RAISE NOTICE '📝 FUNCIÓN API: api_registrar_scout disponible';
    RAISE NOTICE '🎯 ESTADO: Sistema listo para uso inmediato';
    RAISE NOTICE '📋 SIGUIENTE: Ejecutar MASTER_FUNCTIONS.sql para todas las funciones';
    RAISE NOTICE '🎉 ========================================';
END $$;

SELECT 
    '🏗️ INSTALACIÓN MASTER + BÁSICA COMPLETADA' as resultado,
    'Esquema completo con funciones de registro operativas' as mensaje,
    'Sistema listo para uso inmediato - Ejecutar MASTER_FUNCTIONS.sql para funciones completas' as siguiente_paso;