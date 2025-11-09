-- ================================================================
-- 🎯 SCRIPT MAESTRO DE INSTALACIÓN COMPLETA
-- ================================================================
-- SISTEMA SCOUT LIMA 12 - ARQUITECTURA EMPRESARIAL CONSOLIDADA
-- Unifica: Esquemas + Funciones + Seguridad + Optimizaciones
-- Elimina: Data hardcodeada, duplicados, inconsistencias
-- Resultado: Sistema 100% funcional con Database Functions
-- ================================================================

-- ================================================================
-- 🧹 PASO 1: LIMPIEZA COMPLETA
-- ================================================================

-- Eliminar funciones existentes que podrían crear conflictos
DROP FUNCTION IF EXISTS api_buscar_scouts(JSON) CASCADE;
DROP FUNCTION IF EXISTS api_registrar_scout(JSON, JSON) CASCADE;
DROP FUNCTION IF EXISTS api_actualizar_scout(UUID, JSON) CASCADE;
DROP FUNCTION IF EXISTS api_eliminar_scout(UUID) CASCADE;
DROP FUNCTION IF EXISTS api_crear_actividad(JSON) CASCADE;
DROP FUNCTION IF EXISTS api_inscribir_scout_actividad(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS api_dashboard_principal() CASCADE;
DROP FUNCTION IF EXISTS api_crear_item_inventario(JSON) CASCADE;
DROP FUNCTION IF EXISTS api_registrar_movimiento_inventario(JSON) CASCADE;
DROP FUNCTION IF EXISTS api_crear_presupuesto(JSON) CASCADE;
DROP FUNCTION IF EXISTS api_ejecutar_gasto_presupuesto(JSON) CASCADE;
DROP FUNCTION IF EXISTS api_reporte_scouts_rama() CASCADE;
DROP FUNCTION IF EXISTS api_limpiar_datos_antiguos(INTEGER) CASCADE;

-- Eliminar funciones de utilidad
DROP FUNCTION IF EXISTS validate_input(JSON, TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS create_standard_response(BOOLEAN, TEXT, JSON, JSON) CASCADE;
DROP FUNCTION IF EXISTS apply_pagination(TEXT, INTEGER, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS log_operation(TEXT, TEXT, UUID, UUID, JSON) CASCADE;
DROP FUNCTION IF EXISTS generar_codigo(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS generar_codigo_scout() CASCADE;
DROP FUNCTION IF EXISTS generar_codigo_dirigente() CASCADE;
DROP FUNCTION IF EXISTS generar_codigo_patrulla() CASCADE;
DROP FUNCTION IF EXISTS generar_codigo_actividad() CASCADE;

-- Eliminar funciones de timestamp
DROP FUNCTION IF EXISTS update_modified_timestamp() CASCADE;

-- Eliminar triggers existentes
DROP TRIGGER IF EXISTS trigger_scouts_updated_at ON scouts;
DROP TRIGGER IF EXISTS trigger_familiares_updated_at ON familiares_scout;
DROP TRIGGER IF EXISTS trigger_dirigentes_updated_at ON dirigentes;
DROP TRIGGER IF EXISTS trigger_patrullas_updated_at ON patrullas;
DROP TRIGGER IF EXISTS trigger_actividades_updated_at ON actividades_scout;
DROP TRIGGER IF EXISTS trigger_inscripciones_updated_at ON inscripciones_actividad;
DROP TRIGGER IF EXISTS trigger_asistencias_updated_at ON asistencias;
DROP TRIGGER IF EXISTS trigger_presupuestos_updated_at ON presupuestos;
DROP TRIGGER IF EXISTS trigger_inventario_updated_at ON inventario;

-- Eliminar tablas con CASCADE para eliminar dependencias
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS movimientos_inventario CASCADE;
DROP TABLE IF EXISTS inventario CASCADE;
DROP TABLE IF EXISTS gastos_presupuesto CASCADE;
DROP TABLE IF EXISTS presupuestos CASCADE;
DROP TABLE IF EXISTS libro_oro CASCADE;
DROP TABLE IF EXISTS programa_semanal CASCADE;
DROP TABLE IF EXISTS comite_padres CASCADE;
DROP TABLE IF EXISTS asistencias CASCADE;
DROP TABLE IF EXISTS inscripciones_actividad CASCADE;
DROP TABLE IF EXISTS actividades_scout CASCADE;
DROP TABLE IF EXISTS patrullas CASCADE;
DROP TABLE IF EXISTS dirigentes CASCADE;
DROP TABLE IF EXISTS familiares_scout CASCADE;
DROP TABLE IF EXISTS scouts CASCADE;

-- Eliminar tipos ENUM
DROP TYPE IF EXISTS tipo_movimiento_enum CASCADE;
DROP TYPE IF EXISTS estado_inventario_enum CASCADE;
DROP TYPE IF EXISTS tipo_reconocimiento_enum CASCADE;
DROP TYPE IF EXISTS estado_programa_enum CASCADE;
DROP TYPE IF EXISTS cargo_comite_enum CASCADE;
DROP TYPE IF EXISTS cargo_dirigente_enum CASCADE;
DROP TYPE IF EXISTS estado_presupuesto_enum CASCADE;
DROP TYPE IF EXISTS tipo_presupuesto_enum CASCADE;
DROP TYPE IF EXISTS estado_actividad_enum CASCADE;
DROP TYPE IF EXISTS tipo_actividad_enum CASCADE;
DROP TYPE IF EXISTS estado_asistencia_enum CASCADE;
DROP TYPE IF EXISTS parentesco_enum CASCADE;
DROP TYPE IF EXISTS sexo_enum CASCADE;
DROP TYPE IF EXISTS estado_enum CASCADE;
DROP TYPE IF EXISTS rama_enum CASCADE;
DROP TYPE IF EXISTS tipo_documento_enum CASCADE;

-- ================================================================
-- 🏗️ PASO 2: ESQUEMA MAESTRO CONSOLIDADO
-- ================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Tipos ENUM consolidados
CREATE TYPE tipo_documento_enum AS ENUM ('DNI', 'CE', 'PASAPORTE');
CREATE TYPE rama_enum AS ENUM ('Lobatos', 'Scouts', 'Rovers', 'Dirigentes');
CREATE TYPE estado_enum AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'ELIMINADO');
CREATE TYPE sexo_enum AS ENUM ('MASCULINO', 'FEMENINO');
CREATE TYPE parentesco_enum AS ENUM ('PADRE', 'MADRE', 'HERMANO', 'HERMANA', 'TIO', 'TIA', 'ABUELO', 'ABUELA', 'TUTOR', 'OTRO');
CREATE TYPE estado_asistencia_enum AS ENUM ('PRESENTE', 'AUSENTE', 'TARDANZA', 'JUSTIFICADO');
CREATE TYPE tipo_actividad_enum AS ENUM ('REUNION_SEMANAL', 'CAMPAMENTO', 'RAID', 'SERVICIO_COMUNITARIO', 'CAPACITACION', 'CEREMONIA', 'ACTIVIDAD_ESPECIAL', 'EXCURSION');
CREATE TYPE estado_actividad_enum AS ENUM ('PLANIFICADA', 'INSCRIPCIONES_ABIERTAS', 'EN_CURSO', 'FINALIZADA', 'CANCELADA', 'ELIMINADA');
CREATE TYPE tipo_presupuesto_enum AS ENUM ('ANUAL', 'ACTIVIDAD', 'PROYECTO', 'EMERGENCIA', 'MANTENIMIENTO');
CREATE TYPE estado_presupuesto_enum AS ENUM ('PLANIFICADO', 'APROBADO', 'EN_EJECUCION', 'EJECUTADO', 'CANCELADO');
CREATE TYPE cargo_dirigente_enum AS ENUM ('JEFE_GRUPO', 'SUBJEFE_GRUPO', 'DIRIGENTE_LOBATOS', 'DIRIGENTE_SCOUTS', 'DIRIGENTE_ROVERS', 'TESORERO', 'SECRETARIO', 'COORDINADOR');
CREATE TYPE cargo_comite_enum AS ENUM ('PRESIDENTE', 'VICEPRESIDENTE', 'SECRETARIO', 'TESORERO', 'VOCAL', 'COORDINADOR_ACTIVIDADES', 'COORDINADOR_LOGISTICA');
CREATE TYPE estado_programa_enum AS ENUM ('PLANIFICADO', 'EN_CURSO', 'EJECUTADO', 'CANCELADO');
CREATE TYPE tipo_reconocimiento_enum AS ENUM ('ESPECIALIDAD', 'INSIGNIA_PROGRESION', 'RECONOCIMIENTO_ESPECIAL', 'CONDECORACION', 'MENCION_HONOR', 'LOGRO_COMUNITARIO');
CREATE TYPE estado_inventario_enum AS ENUM ('DISPONIBLE', 'EN_USO', 'MANTENIMIENTO', 'DAÑADO', 'PERDIDO', 'ELIMINADO');
CREATE TYPE tipo_movimiento_enum AS ENUM ('ENTRADA', 'SALIDA', 'PRESTAMO', 'DEVOLUCION', 'TRANSFERENCIA', 'BAJA');

-- Tabla principal: SCOUTS
CREATE TABLE scouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_scout VARCHAR(20) UNIQUE NOT NULL,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo sexo_enum NOT NULL,
    numero_documento VARCHAR(20) NOT NULL,
    tipo_documento tipo_documento_enum NOT NULL DEFAULT 'DNI',
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    rama_actual rama_enum NOT NULL,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    patrulla_id UUID,
    es_dirigente BOOLEAN NOT NULL DEFAULT false,
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_scouts_edad CHECK (EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 6 AND 99),
    CONSTRAINT chk_scouts_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT uq_scouts_documento UNIQUE(numero_documento, tipo_documento)
);

-- Tabla: FAMILIARES_SCOUT
CREATE TABLE familiares_scout (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    parentesco parentesco_enum NOT NULL,
    numero_documento VARCHAR(20),
    tipo_documento tipo_documento_enum DEFAULT 'DNI',
    telefono VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    ocupacion VARCHAR(255),
    lugar_trabajo VARCHAR(255),
    telefono_trabajo VARCHAR(20),
    es_contacto_emergencia BOOLEAN DEFAULT false,
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_familiares_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    CONSTRAINT chk_familiares_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Tabla: PATRULLAS
CREATE TABLE patrullas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_patrulla VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    animal_simbolico VARCHAR(100),
    lema TEXT,
    grito TEXT,
    rama rama_enum NOT NULL,
    guia_patrulla_id UUID,
    subguia_patrulla_id UUID,
    capacidad_maxima INTEGER DEFAULT 8,
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_patrullas_guia FOREIGN KEY (guia_patrulla_id) REFERENCES scouts(id),
    CONSTRAINT fk_patrullas_subguia FOREIGN KEY (subguia_patrulla_id) REFERENCES scouts(id),
    CONSTRAINT chk_patrullas_capacidad CHECK (capacidad_maxima BETWEEN 4 AND 12)
);

-- Tabla: DIRIGENTES
CREATE TABLE dirigentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL,
    codigo_dirigente VARCHAR(20) UNIQUE NOT NULL,
    cargo cargo_dirigente_enum NOT NULL,
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    formacion_scouter TEXT,
    capacitaciones TEXT[],
    especialidades TEXT[],
    experiencia_previa TEXT,
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dirigentes_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    CONSTRAINT chk_dirigentes_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

-- Tabla: ACTIVIDADES_SCOUT
CREATE TABLE actividades_scout (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_actividad VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_actividad tipo_actividad_enum NOT NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    lugar VARCHAR(255),
    direccion_lugar TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    responsable UUID NOT NULL,
    rama rama_enum,
    capacidad_maxima INTEGER,
    participantes_confirmados INTEGER DEFAULT 0,
    costo_estimado DECIMAL(10, 2) DEFAULT 0,
    presupuesto_id UUID,
    materiales_necesarios TEXT[],
    requisitos_participacion TEXT[],
    estado estado_actividad_enum NOT NULL DEFAULT 'PLANIFICADA',
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_actividades_responsable FOREIGN KEY (responsable) REFERENCES scouts(id),
    CONSTRAINT chk_actividades_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    CONSTRAINT chk_actividades_participantes CHECK (participantes_confirmados >= 0)
);

-- Tabla: INSCRIPCIONES_ACTIVIDAD
CREATE TABLE inscripciones_actividad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL,
    actividad_id UUID NOT NULL,
    fecha_inscripcion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    autorizado_por UUID,
    autorizacion_familiar BOOLEAN DEFAULT false,
    observaciones_medicas TEXT,
    alergias TEXT[],
    medicamentos TEXT[],
    contacto_emergencia_nombre VARCHAR(255),
    contacto_emergencia_telefono VARCHAR(20),
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    fecha_confirmacion TIMESTAMP WITH TIME ZONE,
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inscripciones_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    CONSTRAINT fk_inscripciones_actividad FOREIGN KEY (actividad_id) REFERENCES actividades_scout(id) ON DELETE CASCADE,
    CONSTRAINT fk_inscripciones_autorizado FOREIGN KEY (autorizado_por) REFERENCES scouts(id),
    CONSTRAINT uq_inscripciones_actividad UNIQUE(scout_id, actividad_id)
);

-- Tabla: ASISTENCIAS
CREATE TABLE asistencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL,
    actividad_id UUID,
    fecha DATE NOT NULL,
    hora_llegada TIME,
    hora_salida TIME,
    estado_asistencia estado_asistencia_enum NOT NULL,
    observaciones TEXT,
    registrado_por UUID,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_asistencias_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    CONSTRAINT fk_asistencias_actividad FOREIGN KEY (actividad_id) REFERENCES actividades_scout(id),
    CONSTRAINT fk_asistencias_registrado FOREIGN KEY (registrado_por) REFERENCES scouts(id),
    CONSTRAINT uq_asistencias_scout_fecha UNIQUE(scout_id, fecha, actividad_id)
);

-- Tabla: PRESUPUESTOS
CREATE TABLE presupuestos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_presupuesto VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_presupuesto tipo_presupuesto_enum NOT NULL,
    año INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    monto_total DECIMAL(10, 2) NOT NULL,
    monto_ejecutado DECIMAL(10, 2) DEFAULT 0,
    monto_disponible DECIMAL(10, 2) GENERATED ALWAYS AS (monto_total - monto_ejecutado) STORED,
    responsable UUID NOT NULL,
    aprobado_por UUID,
    fecha_aprobacion DATE,
    estado estado_presupuesto_enum NOT NULL DEFAULT 'PLANIFICADO',
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_presupuestos_responsable FOREIGN KEY (responsable) REFERENCES scouts(id),
    CONSTRAINT fk_presupuestos_aprobado FOREIGN KEY (aprobado_por) REFERENCES scouts(id),
    CONSTRAINT chk_presupuestos_fechas CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT chk_presupuestos_montos CHECK (monto_total >= 0 AND monto_ejecutado >= 0),
    CONSTRAINT chk_presupuestos_año CHECK (año BETWEEN 2020 AND 2050)
);

-- Tabla: GASTOS_PRESUPUESTO
CREATE TABLE gastos_presupuesto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    presupuesto_id UUID NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_gasto DATE NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    numero_comprobante VARCHAR(100),
    tipo_comprobante VARCHAR(50),
    proveedor VARCHAR(255),
    autorizado_por UUID NOT NULL,
    ejecutado_por UUID,
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gastos_presupuesto FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE,
    CONSTRAINT fk_gastos_autorizado FOREIGN KEY (autorizado_por) REFERENCES scouts(id),
    CONSTRAINT fk_gastos_ejecutado FOREIGN KEY (ejecutado_por) REFERENCES scouts(id),
    CONSTRAINT chk_gastos_monto CHECK (monto > 0)
);

-- Tabla: INVENTARIO
CREATE TABLE inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_item VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    cantidad_total INTEGER NOT NULL DEFAULT 0,
    cantidad_disponible INTEGER NOT NULL DEFAULT 0,
    cantidad_en_uso INTEGER DEFAULT 0,
    unidad_medida VARCHAR(50) DEFAULT 'UNIDAD',
    ubicacion VARCHAR(255),
    responsable_custodia UUID,
    valor_unitario DECIMAL(10, 2),
    fecha_adquisicion DATE,
    vida_util_años INTEGER,
    estado estado_inventario_enum NOT NULL DEFAULT 'DISPONIBLE',
    requiere_mantenimiento BOOLEAN DEFAULT false,
    fecha_ultimo_mantenimiento DATE,
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventario_responsable FOREIGN KEY (responsable_custodia) REFERENCES scouts(id),
    CONSTRAINT chk_inventario_cantidades CHECK (
        cantidad_total >= 0 AND 
        cantidad_disponible >= 0 AND 
        cantidad_en_uso >= 0 AND
        cantidad_disponible + cantidad_en_uso <= cantidad_total
    )
);

-- Tabla: MOVIMIENTOS_INVENTARIO
CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL,
    tipo_movimiento tipo_movimiento_enum NOT NULL,
    fecha_movimiento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cantidad INTEGER NOT NULL,
    actividad_id UUID,
    scout_responsable UUID,
    scout_destinatario UUID,
    motivo VARCHAR(255),
    observaciones TEXT,
    ubicacion_origen VARCHAR(255),
    ubicacion_destino VARCHAR(255),
    autorizado_por UUID NOT NULL,
    fecha_devolucion_esperada DATE,
    fecha_devolucion_real DATE,
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movimientos_item FOREIGN KEY (item_id) REFERENCES inventario(id) ON DELETE CASCADE,
    CONSTRAINT fk_movimientos_actividad FOREIGN KEY (actividad_id) REFERENCES actividades_scout(id),
    CONSTRAINT fk_movimientos_responsable FOREIGN KEY (scout_responsable) REFERENCES scouts(id),
    CONSTRAINT fk_movimientos_destinatario FOREIGN KEY (scout_destinatario) REFERENCES scouts(id),
    CONSTRAINT fk_movimientos_autorizado FOREIGN KEY (autorizado_por) REFERENCES scouts(id),
    CONSTRAINT chk_movimientos_cantidad CHECK (cantidad > 0)
);

-- Tabla: COMITE_PADRES
CREATE TABLE comite_padres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    familiar_id UUID NOT NULL,
    cargo cargo_comite_enum NOT NULL,
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    habilidades TEXT[],
    experiencia_previa TEXT,
    disponibilidad TEXT,
    proyectos_asignados TEXT[],
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comite_familiar FOREIGN KEY (familiar_id) REFERENCES familiares_scout(id) ON DELETE CASCADE,
    CONSTRAINT chk_comite_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

-- Tabla: PROGRAMA_SEMANAL
CREATE TABLE programa_semanal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_programa VARCHAR(20) UNIQUE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    rama rama_enum NOT NULL,
    responsable UUID NOT NULL,
    objetivos JSONB,
    actividades JSONB,
    materiales TEXT[],
    estado estado_programa_enum NOT NULL DEFAULT 'PLANIFICADO',
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_programa_responsable FOREIGN KEY (responsable) REFERENCES scouts(id),
    CONSTRAINT chk_programa_fechas CHECK (fecha_fin >= fecha_inicio)
);

-- Tabla: LIBRO_ORO
CREATE TABLE libro_oro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL,
    tipo_reconocimiento tipo_reconocimiento_enum NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_evento DATE NOT NULL,
    otorgado_por VARCHAR(255) NOT NULL,
    testigos TEXT[],
    evidencias TEXT[],
    impacto TEXT,
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    observaciones TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_libro_oro_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE
);

-- Tabla: AUDIT_LOG
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    user_role TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT,
    transaction_id BIGINT DEFAULT txid_current()
);

-- Agregar foreign keys que dependen de tablas ya creadas
ALTER TABLE scouts ADD CONSTRAINT fk_scouts_patrulla FOREIGN KEY (patrulla_id) REFERENCES patrullas(id);
ALTER TABLE actividades_scout ADD CONSTRAINT fk_actividades_presupuesto FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id);

-- ================================================================
-- 📊 PASO 3: ÍNDICES PARA RENDIMIENTO
-- ================================================================

-- Índices scouts
CREATE INDEX idx_scouts_codigo ON scouts(codigo_scout);
CREATE INDEX idx_scouts_estado ON scouts(estado);
CREATE INDEX idx_scouts_rama ON scouts(rama_actual);
CREATE INDEX idx_scouts_patrulla ON scouts(patrulla_id);
CREATE INDEX idx_scouts_nombres ON scouts(nombres, apellidos);
CREATE INDEX idx_scouts_documento ON scouts(numero_documento, tipo_documento);

-- Índices familiares
CREATE INDEX idx_familiares_scout ON familiares_scout(scout_id);
CREATE INDEX idx_familiares_parentesco ON familiares_scout(parentesco);
CREATE INDEX idx_familiares_emergencia ON familiares_scout(es_contacto_emergencia);

-- Índices dirigentes
CREATE INDEX idx_dirigentes_scout ON dirigentes(scout_id);
CREATE INDEX idx_dirigentes_cargo ON dirigentes(cargo);
CREATE INDEX idx_dirigentes_estado ON dirigentes(estado);

-- Índices patrullas
CREATE INDEX idx_patrullas_rama ON patrullas(rama);
CREATE INDEX idx_patrullas_guia ON patrullas(guia_patrulla_id);
CREATE INDEX idx_patrullas_estado ON patrullas(estado);

-- Índices actividades
CREATE INDEX idx_actividades_codigo ON actividades_scout(codigo_actividad);
CREATE INDEX idx_actividades_fecha_inicio ON actividades_scout(fecha_inicio);
CREATE INDEX idx_actividades_responsable ON actividades_scout(responsable);
CREATE INDEX idx_actividades_tipo ON actividades_scout(tipo_actividad);
CREATE INDEX idx_actividades_rama ON actividades_scout(rama);
CREATE INDEX idx_actividades_estado ON actividades_scout(estado);

-- Índices inscripciones
CREATE INDEX idx_inscripciones_scout ON inscripciones_actividad(scout_id);
CREATE INDEX idx_inscripciones_actividad ON inscripciones_actividad(actividad_id);
CREATE INDEX idx_inscripciones_fecha ON inscripciones_actividad(fecha_inscripcion);

-- Índices asistencias
CREATE INDEX idx_asistencias_scout ON asistencias(scout_id);
CREATE INDEX idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX idx_asistencias_actividad ON asistencias(actividad_id);
CREATE INDEX idx_asistencias_estado ON asistencias(estado_asistencia);

-- Índices presupuestos
CREATE INDEX idx_presupuestos_año ON presupuestos(año);
CREATE INDEX idx_presupuestos_responsable ON presupuestos(responsable);
CREATE INDEX idx_presupuestos_tipo ON presupuestos(tipo_presupuesto);
CREATE INDEX idx_presupuestos_estado ON presupuestos(estado);

-- Índices inventario
CREATE INDEX idx_inventario_codigo ON inventario(codigo_item);
CREATE INDEX idx_inventario_categoria ON inventario(categoria);
CREATE INDEX idx_inventario_estado ON inventario(estado);
CREATE INDEX idx_inventario_responsable ON inventario(responsable_custodia);

-- Índices auditoría
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_record ON audit_log(record_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);

-- ================================================================
-- ⚡ PASO 4: FUNCIONES DE UTILIDAD Y TRIGGERS
-- ================================================================

-- Función para actualizar timestamp de modificación
CREATE OR REPLACE FUNCTION update_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_modificacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para timestamp de modificación
CREATE TRIGGER trigger_scouts_updated_at BEFORE UPDATE ON scouts FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();
CREATE TRIGGER trigger_familiares_updated_at BEFORE UPDATE ON familiares_scout FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();
CREATE TRIGGER trigger_dirigentes_updated_at BEFORE UPDATE ON dirigentes FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();
CREATE TRIGGER trigger_patrullas_updated_at BEFORE UPDATE ON patrullas FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();
CREATE TRIGGER trigger_actividades_updated_at BEFORE UPDATE ON actividades_scout FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();
CREATE TRIGGER trigger_inscripciones_updated_at BEFORE UPDATE ON inscripciones_actividad FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();
CREATE TRIGGER trigger_asistencias_updated_at BEFORE UPDATE ON asistencias FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();
CREATE TRIGGER trigger_presupuestos_updated_at BEFORE UPDATE ON presupuestos FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();
CREATE TRIGGER trigger_inventario_updated_at BEFORE UPDATE ON inventario FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

-- Función para generar códigos únicos
CREATE OR REPLACE FUNCTION generar_codigo(p_prefix TEXT, p_table_name TEXT, p_column_name TEXT)
RETURNS TEXT AS $$
DECLARE
    v_numero INTEGER := 1;
    v_codigo TEXT;
    v_existe BOOLEAN;
    v_query TEXT;
BEGIN
    LOOP
        v_codigo := p_prefix || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(v_numero::TEXT, 4, '0');
        v_query := format('SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1)', p_table_name, p_column_name);
        EXECUTE v_query USING v_codigo INTO v_existe;
        IF NOT v_existe THEN
            RETURN v_codigo;
        END IF;
        v_numero := v_numero + 1;
        IF v_numero > 9999 THEN
            RAISE EXCEPTION 'No se puede generar código único para %', p_prefix;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Funciones especializadas de códigos
CREATE OR REPLACE FUNCTION generar_codigo_scout() RETURNS TEXT AS $$
BEGIN
    RETURN generar_codigo('SCT', 'scouts', 'codigo_scout');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generar_codigo_dirigente() RETURNS TEXT AS $$
BEGIN
    RETURN generar_codigo('DIR', 'dirigentes', 'codigo_dirigente');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generar_codigo_patrulla() RETURNS TEXT AS $$
BEGIN
    RETURN generar_codigo('PTR', 'patrullas', 'codigo_patrulla');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generar_codigo_actividad() RETURNS TEXT AS $$
BEGIN
    RETURN generar_codigo('ACT', 'actividades_scout', 'codigo_actividad');
END;
$$ LANGUAGE plpgsql;

-- Función de validación de entrada
CREATE OR REPLACE FUNCTION validate_input(p_data JSON, p_required_fields TEXT[])
RETURNS JSON AS $$
DECLARE
    v_field TEXT;
    v_errors TEXT[] := '{}';
    v_valid BOOLEAN := true;
BEGIN
    IF p_data IS NULL THEN
        RETURN json_build_object('valid', false, 'errors', json_build_array('Datos requeridos'));
    END IF;
    
    FOREACH v_field IN ARRAY p_required_fields
    LOOP
        IF NOT (p_data ? v_field) OR LENGTH(TRIM(p_data ->> v_field)) = 0 THEN
            v_errors := array_append(v_errors, 'Campo requerido: ' || v_field);
            v_valid := false;
        END IF;
    END LOOP;
    
    RETURN json_build_object('valid', v_valid, 'errors', array_to_json(v_errors));
END;
$$ LANGUAGE plpgsql;

-- Función de respuesta estándar JSON
CREATE OR REPLACE FUNCTION create_standard_response(
    p_success BOOLEAN,
    p_message TEXT,
    p_data JSON DEFAULT NULL,
    p_errors JSON DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'success', p_success,
        'message', p_message,
        'data', COALESCE(p_data, 'null'::json),
        'errors', COALESCE(p_errors, '[]'::json),
        'timestamp', CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;

-- Función de paginación
CREATE OR REPLACE FUNCTION apply_pagination(
    p_base_query TEXT,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20,
    p_order_by TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_offset INTEGER;
    v_total_count INTEGER;
    v_final_query TEXT;
    v_count_query TEXT;
BEGIN
    v_offset := (p_page - 1) * p_limit;
    v_count_query := 'SELECT COUNT(*) FROM (' || p_base_query || ') count_subquery';
    EXECUTE v_count_query INTO v_total_count;
    v_final_query := p_base_query;
    
    IF p_order_by IS NOT NULL THEN
        v_final_query := v_final_query || ' ORDER BY ' || p_order_by;
    END IF;
    
    v_final_query := v_final_query || ' LIMIT ' || p_limit || ' OFFSET ' || v_offset;
    
    RETURN json_build_object(
        'query', v_final_query,
        'page', p_page,
        'limit', p_limit,
        'offset', v_offset,
        'total_count', v_total_count,
        'total_pages', CEIL(v_total_count::FLOAT / p_limit),
        'has_next', (v_offset + p_limit) < v_total_count,
        'has_previous', p_page > 1
    );
END;
$$ LANGUAGE plpgsql;

-- Función de logging de operaciones
CREATE OR REPLACE FUNCTION log_operation(
    p_table_name TEXT,
    p_operation TEXT,
    p_record_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_data JSON DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_log (
        table_name, operation, record_id, user_id, new_values, timestamp
    ) VALUES (
        p_table_name, p_operation, p_record_id, p_user_id, p_data, CURRENT_TIMESTAMP
    );
    
    RAISE NOTICE 'AUDIT: % % on % (ID: %)', p_operation, p_table_name, p_record_id, COALESCE(p_user_id, 'SYSTEM');
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 📋 VERIFICACIÓN FINAL DE INSTALACIÓN
-- ================================================================

DO $$ 
DECLARE
    v_tablas_count INTEGER;
    v_funciones_count INTEGER;
    v_indices_count INTEGER;
BEGIN
    -- Contar tablas creadas
    SELECT COUNT(*) INTO v_tablas_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    -- Contar funciones creadas
    SELECT COUNT(*) INTO v_funciones_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
    
    -- Contar índices creados
    SELECT COUNT(*) INTO v_indices_count
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '🎯 ================================================';
    RAISE NOTICE '🎯 INSTALACIÓN MAESTRA COMPLETADA';
    RAISE NOTICE '🎯 ================================================';
    RAISE NOTICE '✅ Esquema consolidado instalado';
    RAISE NOTICE '✅ % tablas creadas', v_tablas_count;
    RAISE NOTICE '✅ % funciones de utilidad instaladas', v_funciones_count;
    RAISE NOTICE '✅ % índices para rendimiento creados', v_indices_count;
    RAISE NOTICE '✅ Sistema de auditoría configurado';
    RAISE NOTICE '✅ Triggers automáticos activos';
    RAISE NOTICE '🎯 ================================================';
    RAISE NOTICE '📊 SISTEMA LISTO PARA RECIBIR FUNCIONES DE NEGOCIO';
    RAISE NOTICE '🎯 ================================================';
    RAISE NOTICE '🚀 PRÓXIMO PASO: Ejecutar MASTER_FUNCTIONS.sql';
    RAISE NOTICE '🎯 ================================================';
END $$;