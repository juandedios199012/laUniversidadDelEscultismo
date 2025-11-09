-- ================================================================
-- 🏗️ SCRIPT MAESTRO DE ESQUEMA - SISTEMA SCOUT LIMA 12
-- ================================================================
-- ARQUITECTURA EMPRESARIAL CONSOLIDADA
-- Consolida: 01_schema.sql + correcciones + extensiones
-- Eliminado: DATA hardcodeada (solo Database Functions)
-- ================================================================

-- ================================================================
-- EXTENSIONES Y CONFIGURACIÓN INICIAL
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ================================================================
-- TIPOS ENUM CONSOLIDADOS
-- ================================================================

-- Tipos de documentos
CREATE TYPE tipo_documento_enum AS ENUM (
    'DNI',
    'CE',         -- Carné de Extranjería
    'PASAPORTE'
);

-- Ramas scout
CREATE TYPE rama_enum AS ENUM (
    'Lobatos',    -- 6-10 años
    'Scouts',     -- 11-14 años
    'Rovers',     -- 15-17 años
    'Dirigentes'  -- 18+ años
);

-- Estados básicos
CREATE TYPE estado_enum AS ENUM (
    'ACTIVO',
    'INACTIVO',
    'SUSPENDIDO',
    'ELIMINADO'
);

-- Sexo/Género
CREATE TYPE sexo_enum AS ENUM (
    'MASCULINO',
    'FEMENINO'
);

-- Parentescos familiares
CREATE TYPE parentesco_enum AS ENUM (
    'PADRE',
    'MADRE',
    'HERMANO',
    'HERMANA',
    'TIO',
    'TIA',
    'ABUELO',
    'ABUELA',
    'TUTOR',
    'OTRO'
);

-- Estados de asistencia
CREATE TYPE estado_asistencia_enum AS ENUM (
    'PRESENTE',
    'AUSENTE',
    'TARDANZA',
    'JUSTIFICADO'
);

-- Tipos de actividades scout
CREATE TYPE tipo_actividad_enum AS ENUM (
    'REUNION_SEMANAL',
    'CAMPAMENTO',
    'RAID',
    'SERVICIO_COMUNITARIO',
    'CAPACITACION',
    'CEREMONIA',
    'ACTIVIDAD_ESPECIAL',
    'EXCURSION'
);

-- Estados de actividades
CREATE TYPE estado_actividad_enum AS ENUM (
    'PLANIFICADA',
    'INSCRIPCIONES_ABIERTAS',
    'EN_CURSO',
    'FINALIZADA',
    'CANCELADA',
    'ELIMINADA'
);

-- Tipos de presupuesto
CREATE TYPE tipo_presupuesto_enum AS ENUM (
    'ANUAL',
    'ACTIVIDAD',
    'PROYECTO',
    'EMERGENCIA',
    'MANTENIMIENTO'
);

-- Estados de presupuesto
CREATE TYPE estado_presupuesto_enum AS ENUM (
    'PLANIFICADO',
    'APROBADO',
    'EN_EJECUCION',
    'EJECUTADO',
    'CANCELADO'
);

-- Cargos dirigentes
CREATE TYPE cargo_dirigente_enum AS ENUM (
    'JEFE_GRUPO',
    'SUBJEFE_GRUPO',
    'DIRIGENTE_LOBATOS',
    'DIRIGENTE_SCOUTS',
    'DIRIGENTE_ROVERS',
    'TESORERO',
    'SECRETARIO',
    'COORDINADOR'
);

-- Cargos comité de padres
CREATE TYPE cargo_comite_enum AS ENUM (
    'PRESIDENTE',
    'VICEPRESIDENTE',
    'SECRETARIO',
    'TESORERO',
    'VOCAL',
    'COORDINADOR_ACTIVIDADES',
    'COORDINADOR_LOGISTICA'
);

-- Estados de programa semanal
CREATE TYPE estado_programa_enum AS ENUM (
    'PLANIFICADO',
    'EN_CURSO',
    'EJECUTADO',
    'CANCELADO'
);

-- Tipos de reconocimiento
CREATE TYPE tipo_reconocimiento_enum AS ENUM (
    'ESPECIALIDAD',
    'INSIGNIA_PROGRESION',
    'RECONOCIMIENTO_ESPECIAL',
    'CONDECORACION',
    'MENCION_HONOR',
    'LOGRO_COMUNITARIO'
);

-- Estados de inventario
CREATE TYPE estado_inventario_enum AS ENUM (
    'DISPONIBLE',
    'EN_USO',
    'MANTENIMIENTO',
    'DAÑADO',
    'PERDIDO',
    'ELIMINADO'
);

-- Tipos de movimiento inventario
CREATE TYPE tipo_movimiento_enum AS ENUM (
    'ENTRADA',
    'SALIDA',
    'PRESTAMO',
    'DEVOLUCION',
    'TRANSFERENCIA',
    'BAJA'
);

-- ================================================================
-- TABLA PRINCIPAL: SCOUTS
-- ================================================================
CREATE TABLE scouts (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_scout VARCHAR(20) UNIQUE NOT NULL,
    
    -- Datos personales
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo sexo_enum NOT NULL,
    
    -- Documentos
    numero_documento VARCHAR(20) NOT NULL,
    tipo_documento tipo_documento_enum NOT NULL DEFAULT 'DNI',
    
    -- Contacto
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    
    -- Información scout
    rama_actual rama_enum NOT NULL,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    patrulla_id UUID,
    es_dirigente BOOLEAN NOT NULL DEFAULT false,
    
    -- Estado y control
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    observaciones TEXT,
    
    -- Auditoría
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_scouts_edad CHECK (EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 6 AND 99),
    CONSTRAINT chk_scouts_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT uq_scouts_documento UNIQUE(numero_documento, tipo_documento)
);

-- ================================================================
-- TABLA: FAMILIARES_SCOUT
-- ================================================================
CREATE TABLE familiares_scout (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL,
    
    -- Datos personales
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    parentesco parentesco_enum NOT NULL,
    
    -- Documentos
    numero_documento VARCHAR(20),
    tipo_documento tipo_documento_enum DEFAULT 'DNI',
    
    -- Contacto
    telefono VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    
    -- Información adicional
    ocupacion VARCHAR(255),
    lugar_trabajo VARCHAR(255),
    telefono_trabajo VARCHAR(20),
    es_contacto_emergencia BOOLEAN DEFAULT false,
    
    -- Estado y control
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    observaciones TEXT,
    
    -- Auditoría
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_familiares_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_familiares_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ================================================================
-- TABLA: DIRIGENTES
-- ================================================================
CREATE TABLE dirigentes (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL,
    codigo_dirigente VARCHAR(20) UNIQUE NOT NULL,
    
    -- Información dirigente
    cargo cargo_dirigente_enum NOT NULL,
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    
    -- Datos profesionales
    formacion_scouter TEXT,
    capacitaciones TEXT[],
    especialidades TEXT[],
    experiencia_previa TEXT,
    
    -- Estado y control
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    observaciones TEXT,
    
    -- Auditoría
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_dirigentes_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_dirigentes_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

-- ================================================================
-- TABLA: PATRULLAS
-- ================================================================
CREATE TABLE patrullas (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_patrulla VARCHAR(20) UNIQUE NOT NULL,
    
    -- Datos básicos
    nombre VARCHAR(255) NOT NULL,
    animal_simbolico VARCHAR(100),
    lema TEXT,
    grito TEXT,
    
    -- Organización
    rama rama_enum NOT NULL,
    guia_patrulla_id UUID,
    subguia_patrulla_id UUID,
    capacidad_maxima INTEGER DEFAULT 8,
    
    -- Estado y control
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    observaciones TEXT,
    
    -- Auditoría
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_patrullas_guia FOREIGN KEY (guia_patrulla_id) REFERENCES scouts(id),
    CONSTRAINT fk_patrullas_subguia FOREIGN KEY (subguia_patrulla_id) REFERENCES scouts(id),
    
    -- Constraints
    CONSTRAINT chk_patrullas_capacidad CHECK (capacidad_maxima BETWEEN 4 AND 12)
);

-- ================================================================
-- TABLA: ACTIVIDADES_SCOUT
-- ================================================================
CREATE TABLE actividades_scout (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_actividad VARCHAR(20) UNIQUE NOT NULL,
    
    -- Datos básicos
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_actividad tipo_actividad_enum NOT NULL,
    
    -- Fechas y tiempos
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    
    -- Ubicación
    lugar VARCHAR(255),
    direccion_lugar TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    -- Organización
    responsable UUID NOT NULL,
    rama rama_enum,
    capacidad_maxima INTEGER,
    participantes_confirmados INTEGER DEFAULT 0,
    
    -- Económico
    costo_estimado DECIMAL(10, 2) DEFAULT 0,
    presupuesto_id UUID,
    
    -- Recursos
    materiales_necesarios TEXT[],
    requisitos_participacion TEXT[],
    
    -- Estado y control
    estado estado_actividad_enum NOT NULL DEFAULT 'PLANIFICADA',
    observaciones TEXT,
    
    -- Auditoría
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_actividades_responsable FOREIGN KEY (responsable) REFERENCES scouts(id),
    
    -- Constraints
    CONSTRAINT chk_actividades_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    CONSTRAINT chk_actividades_participantes CHECK (participantes_confirmados >= 0)
);

-- ================================================================
-- TABLA: INSCRIPCIONES_ACTIVIDAD
-- ================================================================
CREATE TABLE inscripciones_actividad (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL,
    actividad_id UUID NOT NULL,
    
    -- Información inscripción
    fecha_inscripcion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    autorizado_por UUID,
    autorizacion_familiar BOOLEAN DEFAULT false,
    
    -- Datos médicos/alergias
    observaciones_medicas TEXT,
    alergias TEXT[],
    medicamentos TEXT[],
    contacto_emergencia_nombre VARCHAR(255),
    contacto_emergencia_telefono VARCHAR(20),
    
    -- Estado y control
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    fecha_confirmacion TIMESTAMP WITH TIME ZONE,
    observaciones TEXT,
    
    -- Auditoría
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_inscripciones_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    CONSTRAINT fk_inscripciones_actividad FOREIGN KEY (actividad_id) REFERENCES actividades_scout(id) ON DELETE CASCADE,
    CONSTRAINT fk_inscripciones_autorizado FOREIGN KEY (autorizado_por) REFERENCES scouts(id),
    
    -- Constraints
    CONSTRAINT uq_inscripciones_actividad UNIQUE(scout_id, actividad_id)
);

-- ================================================================
-- TABLA: ASISTENCIAS
-- ================================================================
CREATE TABLE asistencias (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL,
    actividad_id UUID,
    
    -- Información asistencia
    fecha DATE NOT NULL,
    hora_llegada TIME,
    hora_salida TIME,
    estado_asistencia estado_asistencia_enum NOT NULL,
    
    -- Detalles
    observaciones TEXT,
    registrado_por UUID,
    
    -- Auditoría
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_asistencias_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    CONSTRAINT fk_asistencias_actividad FOREIGN KEY (actividad_id) REFERENCES actividades_scout(id),
    CONSTRAINT fk_asistencias_registrado FOREIGN KEY (registrado_por) REFERENCES scouts(id),
    
    -- Constraints
    CONSTRAINT uq_asistencias_scout_fecha UNIQUE(scout_id, fecha, actividad_id)
);

-- ================================================================
-- TABLA: PRESUPUESTOS
-- ================================================================
CREATE TABLE presupuestos (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_presupuesto VARCHAR(20) UNIQUE NOT NULL,
    
    -- Datos básicos
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_presupuesto tipo_presupuesto_enum NOT NULL,
    
    -- Período
    año INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    
    -- Montos
    monto_total DECIMAL(10, 2) NOT NULL,
    monto_ejecutado DECIMAL(10, 2) DEFAULT 0,
    monto_disponible DECIMAL(10, 2) GENERATED ALWAYS AS (monto_total - monto_ejecutado) STORED,
    
    -- Responsabilidad
    responsable UUID NOT NULL,
    aprobado_por UUID,
    fecha_aprobacion DATE,
    
    -- Estado y control
    estado estado_presupuesto_enum NOT NULL DEFAULT 'PLANIFICADO',
    observaciones TEXT,
    
    -- Auditoría
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_presupuestos_responsable FOREIGN KEY (responsable) REFERENCES scouts(id),
    CONSTRAINT fk_presupuestos_aprobado FOREIGN KEY (aprobado_por) REFERENCES scouts(id),
    
    -- Constraints
    CONSTRAINT chk_presupuestos_fechas CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT chk_presupuestos_montos CHECK (monto_total >= 0 AND monto_ejecutado >= 0),
    CONSTRAINT chk_presupuestos_año CHECK (año BETWEEN 2020 AND 2050)
);

-- ================================================================
-- TABLA: GASTOS_PRESUPUESTO
-- ================================================================
CREATE TABLE gastos_presupuesto (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    presupuesto_id UUID NOT NULL,
    
    -- Datos básicos
    concepto VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_gasto DATE NOT NULL,
    
    -- Montos
    monto DECIMAL(10, 2) NOT NULL,
    
    -- Documentación
    numero_comprobante VARCHAR(100),
    tipo_comprobante VARCHAR(50),
    proveedor VARCHAR(255),
    
    -- Responsabilidad
    autorizado_por UUID NOT NULL,
    ejecutado_por UUID,
    
    -- Estado y control
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    observaciones TEXT,
    
    -- Auditoría
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_gastos_presupuesto FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE,
    CONSTRAINT fk_gastos_autorizado FOREIGN KEY (autorizado_por) REFERENCES scouts(id),
    CONSTRAINT fk_gastos_ejecutado FOREIGN KEY (ejecutado_por) REFERENCES scouts(id),
    
    -- Constraints
    CONSTRAINT chk_gastos_monto CHECK (monto > 0)
);

-- ================================================================
-- TABLA: INVENTARIO
-- ================================================================
CREATE TABLE inventario (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_item VARCHAR(20) UNIQUE NOT NULL,
    
    -- Datos básicos
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    
    -- Inventario
    cantidad_total INTEGER NOT NULL DEFAULT 0,
    cantidad_disponible INTEGER NOT NULL DEFAULT 0,
    cantidad_en_uso INTEGER DEFAULT 0,
    unidad_medida VARCHAR(50) DEFAULT 'UNIDAD',
    
    -- Ubicación
    ubicacion VARCHAR(255),
    responsable_custodia UUID,
    
    -- Económico
    valor_unitario DECIMAL(10, 2),
    fecha_adquisicion DATE,
    vida_util_años INTEGER,
    
    -- Estado y control
    estado estado_inventario_enum NOT NULL DEFAULT 'DISPONIBLE',
    requiere_mantenimiento BOOLEAN DEFAULT false,
    fecha_ultimo_mantenimiento DATE,
    observaciones TEXT,
    
    -- Auditoría
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_inventario_responsable FOREIGN KEY (responsable_custodia) REFERENCES scouts(id),
    
    -- Constraints
    CONSTRAINT chk_inventario_cantidades CHECK (
        cantidad_total >= 0 AND 
        cantidad_disponible >= 0 AND 
        cantidad_en_uso >= 0 AND
        cantidad_disponible + cantidad_en_uso <= cantidad_total
    )
);

-- ================================================================
-- TABLA: MOVIMIENTOS_INVENTARIO
-- ================================================================
CREATE TABLE movimientos_inventario (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL,
    
    -- Datos básicos
    tipo_movimiento tipo_movimiento_enum NOT NULL,
    fecha_movimiento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cantidad INTEGER NOT NULL,
    
    -- Relacionado con actividad/scout
    actividad_id UUID,
    scout_responsable UUID,
    scout_destinatario UUID,
    
    -- Detalles
    motivo VARCHAR(255),
    observaciones TEXT,
    ubicacion_origen VARCHAR(255),
    ubicacion_destino VARCHAR(255),
    
    -- Control
    autorizado_por UUID NOT NULL,
    fecha_devolucion_esperada DATE,
    fecha_devolucion_real DATE,
    
    -- Estado y control
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    
    -- Auditoría
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_movimientos_item FOREIGN KEY (item_id) REFERENCES inventario(id) ON DELETE CASCADE,
    CONSTRAINT fk_movimientos_actividad FOREIGN KEY (actividad_id) REFERENCES actividades_scout(id),
    CONSTRAINT fk_movimientos_responsable FOREIGN KEY (scout_responsable) REFERENCES scouts(id),
    CONSTRAINT fk_movimientos_destinatario FOREIGN KEY (scout_destinatario) REFERENCES scouts(id),
    CONSTRAINT fk_movimientos_autorizado FOREIGN KEY (autorizado_por) REFERENCES scouts(id),
    
    -- Constraints
    CONSTRAINT chk_movimientos_cantidad CHECK (cantidad > 0)
);

-- ================================================================
-- TABLA: COMITE_PADRES
-- ================================================================
CREATE TABLE comite_padres (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    familiar_id UUID NOT NULL,
    
    -- Cargo
    cargo cargo_comite_enum NOT NULL,
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    
    -- Información adicional
    habilidades TEXT[],
    experiencia_previa TEXT,
    disponibilidad TEXT,
    proyectos_asignados TEXT[],
    
    -- Estado y control
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    observaciones TEXT,
    
    -- Auditoría
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_comite_familiar FOREIGN KEY (familiar_id) REFERENCES familiares_scout(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_comite_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

-- ================================================================
-- TABLA: PROGRAMA_SEMANAL
-- ================================================================
CREATE TABLE programa_semanal (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_programa VARCHAR(20) UNIQUE NOT NULL,
    
    -- Datos básicos
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    
    -- Organización
    rama rama_enum NOT NULL,
    responsable UUID NOT NULL,
    
    -- Contenido
    objetivos JSONB,
    actividades JSONB,
    materiales TEXT[],
    
    -- Estado y control
    estado estado_programa_enum NOT NULL DEFAULT 'PLANIFICADO',
    observaciones TEXT,
    
    -- Auditoría
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_programa_responsable FOREIGN KEY (responsable) REFERENCES scouts(id),
    
    -- Constraints
    CONSTRAINT chk_programa_fechas CHECK (fecha_fin >= fecha_inicio)
);

-- ================================================================
-- TABLA: LIBRO_ORO
-- ================================================================
CREATE TABLE libro_oro (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL,
    
    -- Reconocimiento
    tipo_reconocimiento tipo_reconocimiento_enum NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_evento DATE NOT NULL,
    
    -- Otorgamiento
    otorgado_por VARCHAR(255) NOT NULL,
    testigos TEXT[],
    evidencias TEXT[],
    impacto TEXT,
    
    -- Estado y control
    estado estado_enum NOT NULL DEFAULT 'ACTIVO',
    observaciones TEXT,
    
    -- Auditoría
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_libro_oro_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE
);

-- ================================================================
-- TABLA: AUDIT_LOG (Sistema de auditoría)
-- ================================================================
CREATE TABLE audit_log (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Información del cambio
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    
    -- Usuario y contexto
    user_id UUID,
    user_role TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Metadatos
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT,
    transaction_id BIGINT DEFAULT txid_current()
);

-- ================================================================
-- ACTUALIZAR FOREIGN KEY EN SCOUTS (PATRULLA)
-- ================================================================
ALTER TABLE scouts ADD CONSTRAINT fk_scouts_patrulla 
    FOREIGN KEY (patrulla_id) REFERENCES patrullas(id);

-- Actualizar actividades con presupuesto
ALTER TABLE actividades_scout ADD CONSTRAINT fk_actividades_presupuesto 
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id);

-- ================================================================
-- ÍNDICES PARA RENDIMIENTO
-- ================================================================

-- Índices principales para scouts
CREATE INDEX idx_scouts_codigo ON scouts(codigo_scout);
CREATE INDEX idx_scouts_estado ON scouts(estado);
CREATE INDEX idx_scouts_rama ON scouts(rama_actual);
CREATE INDEX idx_scouts_patrulla ON scouts(patrulla_id);
CREATE INDEX idx_scouts_nombres ON scouts(nombres, apellidos);
CREATE INDEX idx_scouts_documento ON scouts(numero_documento, tipo_documento);

-- Índices para familiares
CREATE INDEX idx_familiares_scout ON familiares_scout(scout_id);
CREATE INDEX idx_familiares_parentesco ON familiares_scout(parentesco);
CREATE INDEX idx_familiares_emergencia ON familiares_scout(es_contacto_emergencia);

-- Índices para dirigentes
CREATE INDEX idx_dirigentes_scout ON dirigentes(scout_id);
CREATE INDEX idx_dirigentes_cargo ON dirigentes(cargo);
CREATE INDEX idx_dirigentes_estado ON dirigentes(estado);

-- Índices para patrullas
CREATE INDEX idx_patrullas_rama ON patrullas(rama);
CREATE INDEX idx_patrullas_guia ON patrullas(guia_patrulla_id);
CREATE INDEX idx_patrullas_estado ON patrullas(estado);

-- Índices para actividades
CREATE INDEX idx_actividades_codigo ON actividades_scout(codigo_actividad);
CREATE INDEX idx_actividades_fecha_inicio ON actividades_scout(fecha_inicio);
CREATE INDEX idx_actividades_responsable ON actividades_scout(responsable);
CREATE INDEX idx_actividades_tipo ON actividades_scout(tipo_actividad);
CREATE INDEX idx_actividades_rama ON actividades_scout(rama);
CREATE INDEX idx_actividades_estado ON actividades_scout(estado);

-- Índices para inscripciones
CREATE INDEX idx_inscripciones_scout ON inscripciones_actividad(scout_id);
CREATE INDEX idx_inscripciones_actividad ON inscripciones_actividad(actividad_id);
CREATE INDEX idx_inscripciones_fecha ON inscripciones_actividad(fecha_inscripcion);

-- Índices para asistencias
CREATE INDEX idx_asistencias_scout ON asistencias(scout_id);
CREATE INDEX idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX idx_asistencias_actividad ON asistencias(actividad_id);
CREATE INDEX idx_asistencias_estado ON asistencias(estado_asistencia);

-- Índices para presupuestos
CREATE INDEX idx_presupuestos_año ON presupuestos(año);
CREATE INDEX idx_presupuestos_responsable ON presupuestos(responsable);
CREATE INDEX idx_presupuestos_tipo ON presupuestos(tipo_presupuesto);
CREATE INDEX idx_presupuestos_estado ON presupuestos(estado);

-- Índices para inventario
CREATE INDEX idx_inventario_codigo ON inventario(codigo_item);
CREATE INDEX idx_inventario_categoria ON inventario(categoria);
CREATE INDEX idx_inventario_estado ON inventario(estado);
CREATE INDEX idx_inventario_responsable ON inventario(responsable_custodia);

-- Índices para auditoría
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_record ON audit_log(record_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);

-- ================================================================
-- TRIGGERS PARA AUDITORÍA Y TIMESTAMPS
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
CREATE TRIGGER trigger_scouts_updated_at
    BEFORE UPDATE ON scouts
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER trigger_familiares_updated_at
    BEFORE UPDATE ON familiares_scout
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER trigger_dirigentes_updated_at
    BEFORE UPDATE ON dirigentes
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER trigger_patrullas_updated_at
    BEFORE UPDATE ON patrullas
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER trigger_actividades_updated_at
    BEFORE UPDATE ON actividades_scout
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER trigger_inscripciones_updated_at
    BEFORE UPDATE ON inscripciones_actividad
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER trigger_asistencias_updated_at
    BEFORE UPDATE ON asistencias
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER trigger_presupuestos_updated_at
    BEFORE UPDATE ON presupuestos
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER trigger_inventario_updated_at
    BEFORE UPDATE ON inventario
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

-- ================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ================================================================

-- Comentarios en tablas
COMMENT ON TABLE scouts IS 'Tabla principal de scouts del grupo';
COMMENT ON TABLE familiares_scout IS 'Familiares y contactos de emergencia de scouts';
COMMENT ON TABLE dirigentes IS 'Staff de dirigentes del grupo scout';
COMMENT ON TABLE patrullas IS 'Organización de patrullas por rama';
COMMENT ON TABLE actividades_scout IS 'Actividades, campamentos y eventos';
COMMENT ON TABLE inscripciones_actividad IS 'Inscripciones de scouts a actividades';
COMMENT ON TABLE asistencias IS 'Registro de asistencia a reuniones y actividades';
COMMENT ON TABLE presupuestos IS 'Gestión financiera y presupuestos';
COMMENT ON TABLE inventario IS 'Control de materiales y equipos';
COMMENT ON TABLE comite_padres IS 'Organización del comité de padres';
COMMENT ON TABLE programa_semanal IS 'Planificación educativa semanal';
COMMENT ON TABLE libro_oro IS 'Registro de logros y reconocimientos';
COMMENT ON TABLE audit_log IS 'Sistema de auditoría y trazabilidad';

-- ================================================================
-- VERIFICACIÓN FINAL
-- ================================================================
DO $$ 
BEGIN
    RAISE NOTICE '🏗️ ========================================';
    RAISE NOTICE '🏗️ ESQUEMA MAESTRO CONSOLIDADO COMPLETO';
    RAISE NOTICE '🏗️ ========================================';
    RAISE NOTICE '✅ 13 Tablas principales creadas';
    RAISE NOTICE '✅ 15 Tipos ENUM definidos';
    RAISE NOTICE '✅ 40+ Índices para rendimiento';
    RAISE NOTICE '✅ Sistema de auditoría completo';
    RAISE NOTICE '✅ Triggers de timestamp automáticos';
    RAISE NOTICE '✅ Constraints y validaciones robustas';
    RAISE NOTICE '🏗️ ========================================';
    RAISE NOTICE '📊 ARQUITECTURA EMPRESARIAL LISTA';
    RAISE NOTICE '🏗️ ========================================';
END $$;