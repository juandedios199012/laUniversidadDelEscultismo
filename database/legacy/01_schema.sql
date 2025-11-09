-- ================================================================
-- 🏗️ ESQUEMA DE BASE DE DATOS - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 01_schema.sql
-- Propósito: Crear todas las tablas, índices y constraints del sistema
-- Orden de ejecución: 2° (Después de cleanup)
-- ================================================================

-- ================================================================
-- EXTENSIONES Y CONFIGURACIÓN INICIAL
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ================================================================
-- TIPOS ENUM PERSONALIZADOS
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
    'SUSPENDIDO'
);

-- Sexo/Género
CREATE TYPE sexo_enum AS ENUM (
    'MASCULINO',
    'FEMENINO'
);

-- Parentescos familiares
CREATE TYPE parentesco_enum AS ENUM (
    'padre',
    'madre',
    'hermano',
    'hermana',
    'abuelo',
    'abuela',
    'tio',
    'tia',
    'primo',
    'prima',
    'tutor',
    'otro'
);

-- Estados de actividades
CREATE TYPE estado_actividad_enum AS ENUM (
    'PLANIFICADA',
    'CONFIRMADA',
    'EN_PROGRESO',
    'FINALIZADA',
    'CANCELADA'
);

-- Tipos de actividades
CREATE TYPE tipo_actividad_enum AS ENUM (
    'REUNION_REGULAR',
    'CAMPAMENTO',
    'EXCURSION',
    'SERVICIO_COMUNITARIO',
    'CEREMONIAL',
    'CAPACITACION',
    'COMPETENCIA',
    'JUEGO_GRANDE',
    'OTRO'
);

-- ================================================================
-- TIPOS DE INVENTARIO
-- ================================================================

-- Categorías de inventario
CREATE TYPE categoria_inventario_enum AS ENUM (
    'EQUIPOS_CAMPAMENTO',        -- Carpas, sleeping bags, etc.
    'MATERIAL_DEPORTIVO',        -- Pelotas, raquetas, etc.
    'HERRAMIENTAS',             -- Martillos, sierras, etc.
    'MATERIAL_EDUCATIVO',       -- Libros, juegos educativos, etc.
    'UNIFORMES_DISTINTIVOS',    -- Uniformes, insignias, etc.
    'COCINA_ALIMENTACION',      -- Ollas, platos, etc.
    'PRIMEROS_AUXILIOS',        -- Botiquín, medicamentos, etc.
    'MATERIAL_ARTISTICO',       -- Pinturas, pinceles, etc.
    'MOBILIARIO',               -- Mesas, sillas, etc.
    'ELECTRONICA',              -- Radios, linternas, etc.
    'LIMPIEZA_MANTENIMIENTO',   -- Escobas, detergentes, etc.
    'OFICINA_ADMINISTRACION',   -- Papelería, archivadores, etc.
    'OTROS'                     -- Otros items no categorizados
);

-- Estados de items de inventario
CREATE TYPE estado_item_enum AS ENUM (
    'DISPONIBLE',
    'PRESTADO',
    'EN_MANTENIMIENTO',
    'DAÑADO',
    'PERDIDO',
    'ELIMINADO'
);

-- Tipos de movimientos de inventario
CREATE TYPE tipo_movimiento_enum AS ENUM (
    'ENTRADA',                  -- Ingreso de nuevo stock
    'SALIDA',                   -- Salida por préstamo o uso
    'AJUSTE',                   -- Ajuste de inventario
    'DEVOLUCION',               -- Devolución de préstamo
    'PERDIDA',                  -- Pérdida de item
    'DAÑO',                     -- Daño de item
    'MANTENIMIENTO'             -- Envío a mantenimiento
);

-- Estados de préstamos
CREATE TYPE estado_prestamo_enum AS ENUM (
    'ACTIVO',
    'DEVUELTO',
    'PARCIAL',
    'VENCIDO',
    'PERDIDO'
);

-- ================================================================
-- TIPOS DE PRESUPUESTOS
-- ================================================================

-- Tipos de presupuesto
CREATE TYPE tipo_presupuesto_enum AS ENUM (
    'ANUAL',
    'CAMPAMENTO',
    'ACTIVIDAD',
    'PROYECTOS',
    'MANTENIMIENTO',
    'EMERGENCIA',
    'OTRO'
);

-- Estados de presupuesto
CREATE TYPE estado_presupuesto_enum AS ENUM (
    'BORRADOR',
    'ACTIVO',
    'CERRADO',
    'SUSPENDIDO'
);

-- Categorías de gastos
CREATE TYPE categoria_gasto_enum AS ENUM (
    'ALIMENTACION',
    'TRANSPORTE',
    'MATERIAL_DIDACTICO',
    'EQUIPAMIENTO',
    'SERVICIOS',
    'MANTENIMIENTO',
    'CAPACITACION',
    'CEREMONIAL',
    'EMERGENCIAS',
    'ADMINISTRACION',
    'OTROS'
);

-- Estados de gastos
CREATE TYPE estado_gasto_enum AS ENUM (
    'PENDIENTE',
    'APROBADO',
    'RECHAZADO',
    'PAGADO'
);

-- Estados generales para inscripciones
CREATE TYPE estado_general_enum AS ENUM (
    'PENDIENTE',
    'APROBADO',
    'RECHAZADO',
    'COMPLETADO'
);

-- Tipos de usuario para evaluaciones
CREATE TYPE tipo_usuario_enum AS ENUM (
    'SCOUT',
    'DIRIGENTE',
    'PADRE',
    'FAMILIAR'
);

-- ================================================================
-- FUNCIONES UTILITARIAS
-- ================================================================

-- Función para actualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para generar códigos únicos
CREATE OR REPLACE FUNCTION generar_codigo(prefijo TEXT, tabla TEXT, columna TEXT)
RETURNS TEXT AS $$
DECLARE
    nuevo_codigo TEXT;
    contador INTEGER := 1;
    sql_query TEXT;
    existe BOOLEAN;
BEGIN
    LOOP
        nuevo_codigo := prefijo || '-' || LPAD(contador::TEXT, 4, '0');
        
        sql_query := format('SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1)', tabla, columna);
        EXECUTE sql_query INTO existe USING nuevo_codigo;
        
        IF NOT existe THEN
            RETURN nuevo_codigo;
        END IF;
        
        contador := contador + 1;
        
        -- Evitar bucles infinitos
        IF contador > 9999 THEN
            RAISE EXCEPTION 'No se puede generar código único para %', prefijo;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- TABLA 1: SCOUTS (Tabla principal)
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
    
    -- Documentación
    tipo_documento tipo_documento_enum NOT NULL DEFAULT 'DNI',
    numero_documento VARCHAR(20) UNIQUE NOT NULL,
    
    -- Contacto
    celular VARCHAR(20),
    telefono VARCHAR(20),
    correo VARCHAR(255),
    
    -- Ubicación
    pais VARCHAR(100) DEFAULT 'Perú',
    departamento VARCHAR(100),
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    direccion TEXT,
    
    -- Datos académicos/laborales
    centro_estudio VARCHAR(255),
    ocupacion VARCHAR(255),
    centro_laboral VARCHAR(255),
    
    -- Datos scout
    es_dirigente BOOLEAN DEFAULT FALSE,
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    rama_actual rama_enum,
    estado estado_enum DEFAULT 'ACTIVO',
    
    -- Metadatos
    foto_url TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT scouts_fecha_nacimiento_valida CHECK (fecha_nacimiento <= CURRENT_DATE),
    CONSTRAINT scouts_fecha_ingreso_valida CHECK (fecha_ingreso <= CURRENT_DATE),
    CONSTRAINT scouts_email_formato CHECK (correo IS NULL OR correo ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ================================================================
-- TABLA 2: FAMILIARES_SCOUT
-- ================================================================
CREATE TABLE familiares_scout (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL,
    
    -- Datos del familiar
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    parentesco parentesco_enum NOT NULL,
    
    -- Contacto
    celular VARCHAR(20),
    telefono VARCHAR(20),
    correo VARCHAR(255),
    
    -- Datos adicionales
    ocupacion VARCHAR(255),
    centro_laboral VARCHAR(255),
    es_contacto_emergencia BOOLEAN DEFAULT TRUE,
    es_responsable_legal BOOLEAN DEFAULT FALSE,
    
    -- Metadatos
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_familiares_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT familiares_email_formato CHECK (correo IS NULL OR correo ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ================================================================
-- TABLA 3: DIRIGENTES
-- ================================================================
CREATE TABLE dirigentes (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL UNIQUE,
    codigo_dirigente VARCHAR(20) UNIQUE NOT NULL,
    
    -- Datos específicos del dirigente
    fecha_ingreso_dirigente DATE DEFAULT CURRENT_DATE,
    rama_responsable rama_enum,
    cargo VARCHAR(100),
    nivel_formacion VARCHAR(50),
    
    -- Certificaciones
    insignia_madera BOOLEAN DEFAULT FALSE,
    fecha_insignia_madera DATE,
    cursos_completados TEXT[],
    
    -- Estado
    estado_dirigente estado_enum DEFAULT 'ACTIVO',
    
    -- Metadatos
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_dirigentes_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT dirigentes_fecha_ingreso_valida CHECK (fecha_ingreso_dirigente <= CURRENT_DATE),
    CONSTRAINT dirigentes_fecha_insignia_valida CHECK (fecha_insignia_madera IS NULL OR fecha_insignia_madera <= CURRENT_DATE)
);

-- Tabla de formación de dirigentes
CREATE TABLE formacion_dirigentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dirigente_id UUID NOT NULL,
    nombre_curso VARCHAR(255) NOT NULL,
    institucion VARCHAR(255) NOT NULL,
    tipo_curso VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    horas_academicas INTEGER,
    estado_curso VARCHAR(50) DEFAULT 'EN_CURSO',
    certificado_obtenido BOOLEAN DEFAULT FALSE,
    calificacion DECIMAL(4,2),
    observaciones TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_formacion_dirigente FOREIGN KEY (dirigente_id) REFERENCES dirigentes(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_formacion_calificacion CHECK (calificacion IS NULL OR (calificacion >= 0 AND calificacion <= 20)),
    CONSTRAINT chk_formacion_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

-- Tabla de evaluaciones de dirigentes
CREATE TABLE evaluaciones_dirigentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dirigente_id UUID NOT NULL,
    evaluador_id UUID,
    tipo_evaluador VARCHAR(50) NOT NULL,
    periodo VARCHAR(20) NOT NULL,
    puntuaciones JSON NOT NULL,
    promedio_general DECIMAL(4,2),
    fortalezas TEXT[] DEFAULT '{}',
    areas_mejora TEXT[] DEFAULT '{}',
    comentarios TEXT,
    recomendaciones TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_evaluacion_dirigente FOREIGN KEY (dirigente_id) REFERENCES dirigentes(id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluacion_evaluador FOREIGN KEY (evaluador_id) REFERENCES scouts(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_evaluacion_promedio CHECK (promedio_general IS NULL OR (promedio_general >= 0 AND promedio_general <= 10)),
    CONSTRAINT chk_evaluacion_tipo CHECK (tipo_evaluador IN ('DIRIGENTE', 'SCOUT', 'PADRE', 'AUTOEVALUACION'))
);

-- Tabla de responsabilidades de dirigentes
CREATE TABLE responsabilidades_dirigentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dirigente_id UUID NOT NULL,
    tipo_responsabilidad VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    prioridad INTEGER DEFAULT 3,
    estado VARCHAR(50) DEFAULT 'ACTIVA',
    observaciones TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_responsabilidad_dirigente FOREIGN KEY (dirigente_id) REFERENCES dirigentes(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_responsabilidad_prioridad CHECK (prioridad >= 1 AND prioridad <= 5),
    CONSTRAINT chk_responsabilidad_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    CONSTRAINT chk_responsabilidad_estado CHECK (estado IN ('ACTIVA', 'COMPLETADA', 'SUSPENDIDA', 'CANCELADA'))
);

-- Tabla de disponibilidad de dirigentes
CREATE TABLE disponibilidad_dirigentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dirigente_id UUID NOT NULL,
    fecha_evento DATE NOT NULL,
    tipo_evento VARCHAR(50) NOT NULL,
    disponible BOOLEAN NOT NULL,
    observaciones TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_disponibilidad_dirigente FOREIGN KEY (dirigente_id) REFERENCES dirigentes(id) ON DELETE CASCADE,
    
    -- Unique constraint
    CONSTRAINT uq_disponibilidad_dirigente_fecha_tipo UNIQUE (dirigente_id, fecha_evento, tipo_evento)
);

-- ================================================================
-- TABLA 4: PATRULLAS
-- ================================================================
CREATE TABLE patrullas (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_patrulla VARCHAR(20) UNIQUE NOT NULL,
    
    -- Datos básicos
    nombre VARCHAR(100) NOT NULL,
    rama rama_enum NOT NULL,
    
    -- Identidad de patrulla
    lema TEXT,
    grito TEXT,
    colores VARCHAR(100),
    totem VARCHAR(100),
    fecha_fundacion DATE DEFAULT CURRENT_DATE,
    
    -- Organización
    dirigente_responsable_id UUID,
    
    -- Estado
    estado estado_enum DEFAULT 'ACTIVO',
    
    -- Metadatos
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_patrullas_dirigente FOREIGN KEY (dirigente_responsable_id) REFERENCES dirigentes(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT patrullas_fecha_fundacion_valida CHECK (fecha_fundacion <= CURRENT_DATE)
);

-- ================================================================
-- TABLA 5: MIEMBROS_PATRULLA
-- ================================================================
CREATE TABLE miembros_patrulla (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL,
    patrulla_id UUID NOT NULL,
    
    -- Rol en la patrulla
    cargo_patrulla VARCHAR(50) DEFAULT 'MIEMBRO',
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    fecha_salida DATE,
    
    -- Estado
    estado_miembro estado_enum DEFAULT 'ACTIVO',
    
    -- Metadatos
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_miembros_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    CONSTRAINT fk_miembros_patrulla FOREIGN KEY (patrulla_id) REFERENCES patrullas(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT miembros_fechas_validas CHECK (fecha_ingreso <= COALESCE(fecha_salida, CURRENT_DATE)),
    CONSTRAINT miembros_un_activo_por_scout UNIQUE (scout_id, estado_miembro) DEFERRABLE INITIALLY DEFERRED
);

-- ================================================================
-- TABLA 5A: ACTIVIDADES_SCOUT
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
    fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Ubicación
    lugar VARCHAR(255),
    direccion_lugar TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    -- Organización
    rama_objetivo rama_enum,
    dirigente_responsable_id UUID,
    costo DECIMAL(10,2) DEFAULT 0,
    maximo_participantes INTEGER,
    
    -- Estado
    estado estado_actividad_enum DEFAULT 'PLANIFICADA',
    
    -- Requisitos
    requiere_autorizacion BOOLEAN DEFAULT FALSE,
    requiere_pago BOOLEAN DEFAULT FALSE,
    edad_minima INTEGER,
    edad_maxima INTEGER,
    
    -- Metadatos
    equipamiento_necesario TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_actividades_dirigente FOREIGN KEY (dirigente_responsable_id) REFERENCES dirigentes(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT actividades_fechas_validas CHECK (fecha_inicio < fecha_fin),
    CONSTRAINT actividades_edades_validas CHECK (edad_minima IS NULL OR edad_maxima IS NULL OR edad_minima <= edad_maxima),
    CONSTRAINT actividades_participantes_positivos CHECK (maximo_participantes IS NULL OR maximo_participantes > 0)
);

-- ================================================================
-- TABLA 5B: PUNTOS_PATRULLA
-- ================================================================
CREATE TABLE puntos_patrulla (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Datos básicos
    patrulla_id UUID NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    puntos_obtenidos INTEGER NOT NULL,
    
    -- Fechas
    fecha_otorgamiento DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Referencias
    actividad_id UUID,
    otorgado_por_id UUID,
    
    -- Observaciones
    observaciones TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_puntos_patrulla FOREIGN KEY (patrulla_id) REFERENCES patrullas(id) ON DELETE CASCADE,
    CONSTRAINT fk_puntos_actividad FOREIGN KEY (actividad_id) REFERENCES actividades_scout(id) ON DELETE SET NULL,
    CONSTRAINT fk_puntos_otorgado_por FOREIGN KEY (otorgado_por_id) REFERENCES dirigentes(id) ON DELETE SET NULL
);

-- ================================================================
-- TABLA 5C: PROYECTOS_PATRULLA
-- ================================================================
CREATE TABLE proyectos_patrulla (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Datos básicos
    patrulla_id UUID NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    
    -- Fechas
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin_estimada DATE,
    fecha_fin_real DATE,
    
    -- Responsabilidad
    responsable_scout_id UUID,
    
    -- Presupuesto
    presupuesto_estimado DECIMAL(10,2),
    presupuesto_ejecutado DECIMAL(10,2) DEFAULT 0,
    
    -- Control
    estado VARCHAR(50) DEFAULT 'EN_PROGRESO',
    porcentaje_avance INTEGER DEFAULT 0,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_proyectos_patrulla FOREIGN KEY (patrulla_id) REFERENCES patrullas(id) ON DELETE CASCADE,
    CONSTRAINT fk_proyectos_responsable FOREIGN KEY (responsable_scout_id) REFERENCES scouts(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT proyectos_fechas_validas CHECK (fecha_inicio <= COALESCE(fecha_fin_estimada, fecha_inicio + INTERVAL '1 year')),
    CONSTRAINT proyectos_avance_valido CHECK (porcentaje_avance >= 0 AND porcentaje_avance <= 100),
    CONSTRAINT proyectos_presupuesto_valido CHECK (presupuesto_ejecutado >= 0 AND presupuesto_ejecutado <= COALESCE(presupuesto_estimado * 1.2, presupuesto_ejecutado))
);

-- ================================================================
-- TABLA 6: PARTICIPANTES_ACTIVIDAD
-- ================================================================
CREATE TABLE participantes_actividad (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actividad_id UUID NOT NULL,
    scout_id UUID NOT NULL,
    
    -- Estado de participación
    estado_participacion VARCHAR(20) DEFAULT 'INSCRITO' CHECK (estado_participacion IN ('INSCRITO', 'CONFIRMADO', 'PRESENTE', 'AUSENTE', 'CANCELADO')),
    
    -- Fechas
    fecha_inscripcion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmacion TIMESTAMP WITH TIME ZONE,
    
    -- Pagos
    monto_pagado DECIMAL(10,2) DEFAULT 0,
    fecha_pago TIMESTAMP WITH TIME ZONE,
    
    -- Requisitos
    requiere_transporte BOOLEAN DEFAULT FALSE,
    autorizacion_familiar BOOLEAN DEFAULT FALSE,
    
    -- Metadatos
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_participantes_actividad FOREIGN KEY (actividad_id) REFERENCES actividades_scout(id) ON DELETE CASCADE,
    CONSTRAINT fk_participantes_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT participantes_unico_por_actividad UNIQUE (actividad_id, scout_id),
    CONSTRAINT participantes_monto_positivo CHECK (monto_pagado >= 0)
);

-- ================================================================
-- TABLA 6A: INSCRIPCIONES_ACTIVIDAD (Inscripciones específicas a actividades)
-- ================================================================
CREATE TABLE inscripciones_actividad (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actividad_id UUID NOT NULL,
    scout_id UUID NOT NULL,
    
    -- Información específica de la inscripción
    acompanante_autorizado VARCHAR(255),
    telefono_emergencia VARCHAR(20),
    observaciones_medicas TEXT,
    autorizacion_padres BOOLEAN DEFAULT FALSE,
    
    -- Estado de la inscripción
    estado estado_enum DEFAULT 'ACTIVO',
    fecha_inscripcion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_inscripciones_actividad FOREIGN KEY (actividad_id) REFERENCES actividades_scout(id) ON DELETE CASCADE,
    CONSTRAINT fk_inscripciones_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT inscripciones_actividad_unica UNIQUE(actividad_id, scout_id)
);

-- ================================================================
-- TABLA 6B: EVALUACIONES_ACTIVIDAD (Evaluaciones de actividades)
-- ================================================================
CREATE TABLE evaluaciones_actividad (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actividad_id UUID NOT NULL,
    evaluador_id UUID NOT NULL,
    
    -- Información de la evaluación
    tipo_evaluador VARCHAR(50) DEFAULT 'SCOUT' CHECK (tipo_evaluador IN ('SCOUT', 'DIRIGENTE', 'PADRE')),
    calificacion_general INTEGER CHECK (calificacion_general >= 1 AND calificacion_general <= 5),
    aspectos_evaluados JSONB DEFAULT '{}',
    comentarios TEXT,
    sugerencias TEXT,
    recomendaria BOOLEAN DEFAULT TRUE,
    
    -- Fechas
    fecha_evaluacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_evaluaciones_actividad FOREIGN KEY (actividad_id) REFERENCES actividades_scout(id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluaciones_evaluador FOREIGN KEY (evaluador_id) REFERENCES scouts(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT evaluaciones_actividad_unica UNIQUE(actividad_id, evaluador_id)
);

-- ================================================================
-- TABLA 7: ASISTENCIAS
-- ================================================================
CREATE TABLE asistencias (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL,
    actividad_id UUID,
    
    -- Datos de asistencia
    fecha DATE NOT NULL,
    tipo_evento VARCHAR(50) DEFAULT 'REUNION_REGULAR',
    estado_asistencia VARCHAR(20) NOT NULL CHECK (estado_asistencia IN ('PRESENTE', 'AUSENTE', 'TARDANZA', 'JUSTIFICADO')),
    
    -- Horarios
    hora_llegada TIME,
    hora_salida TIME,
    
    -- Detalles
    justificacion TEXT,
    registrado_por_id UUID,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_asistencias_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    CONSTRAINT fk_asistencias_actividad FOREIGN KEY (actividad_id) REFERENCES actividades_scout(id) ON DELETE SET NULL,
    CONSTRAINT fk_asistencias_registrado_por FOREIGN KEY (registrado_por_id) REFERENCES dirigentes(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT asistencias_unica_por_fecha UNIQUE (scout_id, fecha, tipo_evento),
    CONSTRAINT asistencias_horas_validas CHECK (hora_llegada IS NULL OR hora_salida IS NULL OR hora_llegada <= hora_salida)
);

-- ================================================================
-- TABLA 8: LOGROS_SCOUT (Libro de Oro)
-- ================================================================
CREATE TABLE logros_scout (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL,
    
    -- Datos del logro
    tipo_logro VARCHAR(50) NOT NULL CHECK (tipo_logro IN ('INSIGNIA_ESPECIALIDAD', 'INSIGNIA_PROGRESION', 'RECONOCIMIENTO', 'SERVICIO_COMUNITARIO', 'LIDERAZGO', 'CAMPAMENTO', 'OTRO')),
    nombre_logro VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_obtencion DATE DEFAULT CURRENT_DATE,
    
    -- Evaluación
    evaluado_por_id UUID,
    puntos INTEGER DEFAULT 0,
    nivel VARCHAR(20) CHECK (nivel IN ('BRONCE', 'PLATA', 'ORO', 'ESPECIAL')),
    
    -- Evidencia
    evidencia_url TEXT,
    certificado_url TEXT,
    
    -- Estado
    estado VARCHAR(20) DEFAULT 'OTORGADO' CHECK (estado IN ('PENDIENTE', 'OTORGADO', 'REVOCADO')),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_logros_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    CONSTRAINT fk_logros_evaluado_por FOREIGN KEY (evaluado_por_id) REFERENCES dirigentes(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT logros_fecha_obtencion_valida CHECK (fecha_obtencion <= CURRENT_DATE),
    CONSTRAINT logros_puntos_positivos CHECK (puntos >= 0)
);

-- ================================================================
-- TABLA 8A: LIBRO_ORO (Registro histórico del grupo)
-- ================================================================
CREATE TABLE libro_oro (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Datos básicos del registro
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_registro VARCHAR(100) NOT NULL CHECK (tipo_registro IN ('LOGRO', 'EVENTO', 'MEMORIAL', 'EFEMERIDE', 'HISTORIA')),
    fecha_evento DATE NOT NULL,
    
    -- Referencias opcionales
    scout_id UUID,
    patrulla_id UUID,
    dirigente_id UUID,
    
    -- Archivos y documentos
    fotos TEXT[] DEFAULT '{}',
    documentos TEXT[] DEFAULT '{}',
    
    -- Metadatos
    registrado_por_id UUID,
    es_destacado BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_libro_oro_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE SET NULL,
    CONSTRAINT fk_libro_oro_patrulla FOREIGN KEY (patrulla_id) REFERENCES patrullas(id) ON DELETE SET NULL,
    CONSTRAINT fk_libro_oro_dirigente FOREIGN KEY (dirigente_id) REFERENCES dirigentes(id) ON DELETE SET NULL,
    CONSTRAINT fk_libro_oro_registrado_por FOREIGN KEY (registrado_por_id) REFERENCES scouts(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT libro_oro_fecha_evento_valida CHECK (fecha_evento <= CURRENT_DATE + INTERVAL '1 year')
);

-- ================================================================
-- TABLA 9: PROGRAMA_SEMANAL
-- ================================================================
CREATE TABLE programa_semanal (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Periodo
    semana_inicio DATE NOT NULL,
    semana_fin DATE NOT NULL,
    rama rama_enum NOT NULL,
    
    -- Actividades por día
    lunes TEXT,
    martes TEXT,
    miercoles TEXT,
    jueves TEXT,
    viernes TEXT,
    sabado TEXT,
    domingo TEXT,
    
    -- Metadatos del programa
    tema_semanal VARCHAR(255),
    objetivos TEXT,
    materiales_necesarios TEXT,
    responsable_id UUID,
    
    -- Estado
    estado VARCHAR(20) DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'PUBLICADO', 'ARCHIVADO')),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_programa_responsable FOREIGN KEY (responsable_id) REFERENCES dirigentes(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT programa_semana_valida CHECK (semana_inicio <= semana_fin),
    CONSTRAINT programa_unico_por_semana UNIQUE (semana_inicio, rama)
);

-- ================================================================
-- TABLA 10: INSCRIPCIONES_ANUALES
-- ================================================================
CREATE TABLE inscripciones_anuales (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scout_id UUID NOT NULL,
    codigo_asociado VARCHAR(20) UNIQUE NOT NULL,
    
    -- Datos de inscripción
    ano INTEGER NOT NULL,
    rama rama_enum NOT NULL,
    fecha_inscripcion DATE DEFAULT CURRENT_DATE,
    
    -- Pagos
    monto_inscripcion DECIMAL(10,2) DEFAULT 0,
    fecha_pago DATE,
    estado_pago VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado_pago IN ('PENDIENTE', 'PAGADO', 'PARCIAL', 'EXONERADO')),
    
    -- Documentación
    documentos_completos BOOLEAN DEFAULT FALSE,
    certificado_medico BOOLEAN DEFAULT FALSE,
    autorizacion_padres BOOLEAN DEFAULT FALSE,
    
    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_inscripciones_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT inscripciones_ano_valido CHECK (ano >= 2020 AND ano <= 2050),
    CONSTRAINT inscripciones_una_por_ano UNIQUE (scout_id, ano),
    CONSTRAINT inscripciones_monto_positivo CHECK (monto_inscripcion >= 0)
);

-- ================================================================
-- TABLA 10A: INSCRIPCIONES (Proceso de inscripción anual)
-- ================================================================
CREATE TABLE inscripciones (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    periodo_id UUID NOT NULL,
    scout_id UUID NOT NULL,
    
    -- Datos básicos
    tipo_inscripcion VARCHAR(50) DEFAULT 'NUEVA' CHECK (tipo_inscripcion IN ('NUEVA', 'RENOVACION', 'REINGRESO')),
    rama_solicita rama_enum NOT NULL,
    rama_actual rama_enum,
    
    -- Datos de contacto
    datos_contacto_emergencia JSON,
    autorizaciones JSON,
    observaciones_medicas TEXT,
    
    -- Montos
    monto_inscripcion DECIMAL(10,2) DEFAULT 0,
    monto_mensualidad DECIMAL(10,2) DEFAULT 0,
    descuento_aplicado DECIMAL(5,2) DEFAULT 0,
    monto_total DECIMAL(10,2) DEFAULT 0,
    
    -- Control de proceso
    estado VARCHAR(50) DEFAULT 'INICIADA' CHECK (estado IN ('INICIADA', 'DOCUMENTOS_PENDIENTES', 'REVISION', 'APROBADA', 'RECHAZADA', 'COMPLETADA')),
    fecha_presentacion DATE,
    fecha_aprobacion DATE,
    aprobado_por_id UUID,
    
    -- Observaciones
    observaciones TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_inscripciones_periodo FOREIGN KEY (periodo_id) REFERENCES programa_semanal(id) ON DELETE CASCADE,
    CONSTRAINT fk_inscripciones_scout_proceso FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    CONSTRAINT fk_inscripciones_aprobado_por FOREIGN KEY (aprobado_por_id) REFERENCES dirigentes(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT inscripciones_montos_positivos CHECK (monto_inscripcion >= 0 AND monto_mensualidad >= 0 AND monto_total >= 0),
    CONSTRAINT inscripciones_descuento_valido CHECK (descuento_aplicado >= 0 AND descuento_aplicado <= 100),
    CONSTRAINT inscripciones_fechas_logicas CHECK (fecha_aprobacion IS NULL OR fecha_aprobacion >= fecha_presentacion)
);

-- ================================================================
-- TABLA 10B: PERIODOS_INSCRIPCION (Períodos de inscripción anual)
-- ================================================================
CREATE TABLE periodos_inscripcion (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Datos básicos del período
    año INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_limite DATE NOT NULL,
    
    -- Montos y descuentos
    monto_inscripcion DECIMAL(10,2) NOT NULL,
    monto_mensualidad DECIMAL(10,2) NOT NULL,
    descuento_hermanos DECIMAL(5,2) DEFAULT 0,
    
    -- Requisitos y responsabilidad
    requisitos_generales TEXT[],
    dirigente_responsable_id UUID NOT NULL,
    
    -- Estado del período
    estado VARCHAR(50) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'CERRADO', 'SUSPENDIDO')),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_periodos_dirigente FOREIGN KEY (dirigente_responsable_id) REFERENCES dirigentes(id) ON DELETE RESTRICT,
    
    -- Constraints
    CONSTRAINT periodos_fechas_validas CHECK (fecha_inicio < fecha_limite),
    CONSTRAINT periodos_año_valido CHECK (año >= 2020 AND año <= 2050),
    CONSTRAINT periodos_montos_positivos CHECK (monto_inscripcion > 0 AND monto_mensualidad > 0),
    CONSTRAINT periodos_descuento_valido CHECK (descuento_hermanos >= 0 AND descuento_hermanos <= 50),
    CONSTRAINT periodos_un_activo_por_año UNIQUE (año, estado) DEFERRABLE INITIALLY DEFERRED
);

-- ================================================================
-- TABLA 10C: PAGOS_INSCRIPCION (Pagos de inscripciones)
-- ================================================================
CREATE TABLE pagos_inscripcion (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inscripcion_id UUID NOT NULL,
    
    -- Datos del pago
    monto_pagado DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO', 'TARJETA', 'CHEQUE', 'OTRO')),
    numero_operacion VARCHAR(100),
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Información adicional
    observaciones_pago TEXT,
    dirigente_receptor_id UUID NOT NULL,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_pagos_inscripcion FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_pagos_dirigente_receptor FOREIGN KEY (dirigente_receptor_id) REFERENCES dirigentes(id) ON DELETE RESTRICT,
    
    -- Constraints
    CONSTRAINT pagos_monto_positivo CHECK (monto_pagado > 0),
    CONSTRAINT pagos_fecha_valida CHECK (fecha_pago <= CURRENT_DATE + INTERVAL '1 day')
);

-- ================================================================
-- TABLA 11: COMITE_PADRES
-- ================================================================
CREATE TABLE comite_padres (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    familiar_id UUID,
    
    -- Datos básicos
    nombre VARCHAR(255) NOT NULL,
    cargo VARCHAR(100) NOT NULL CHECK (cargo IN ('PRESIDENTE', 'SECRETARIO', 'TESORERO', 'VOCAL', 'SUPLENTE')),
    
    -- Periodo
    periodo VARCHAR(20) NOT NULL,
    fecha_eleccion DATE NOT NULL,
    fecha_culminacion DATE NOT NULL,
    
    -- Contacto
    telefono VARCHAR(20),
    correo VARCHAR(255),
    
    -- Estado
    estado estado_enum DEFAULT 'ACTIVO',
    
    -- Metadatos
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_comite_familiar FOREIGN KEY (familiar_id) REFERENCES familiares_scout(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT comite_fechas_validas CHECK (fecha_eleccion <= fecha_culminacion),
    CONSTRAINT comite_email_formato CHECK (correo IS NULL OR correo ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT comite_cargo_unico_periodo UNIQUE (cargo, periodo, estado)
);

-- ================================================================
-- TABLA 12: HISTORIAL_CAMBIOS
-- ================================================================
CREATE TABLE historial_cambios (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Registro del cambio
    tabla_afectada VARCHAR(100) NOT NULL,
    registro_id UUID NOT NULL,
    tipo_cambio VARCHAR(20) NOT NULL CHECK (tipo_cambio IN ('INSERT', 'UPDATE', 'DELETE')),
    
    -- Datos del cambio
    campos_modificados TEXT[],
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    
    -- Auditoría
    modificado_por_id UUID,
    motivo TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_historial_modificado_por FOREIGN KEY (modificado_por_id) REFERENCES dirigentes(id) ON DELETE SET NULL
);

-- ================================================================
-- TABLAS DE INVENTARIO
-- ================================================================

-- Tabla principal de inventario
CREATE TABLE inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_item VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria categoria_inventario_enum NOT NULL,
    
    -- Stock y control
    cantidad_disponible INTEGER NOT NULL DEFAULT 0,
    cantidad_minima INTEGER NOT NULL DEFAULT 5,
    ubicacion VARCHAR(255),
    estado_item estado_item_enum NOT NULL DEFAULT 'DISPONIBLE',
    
    -- Información comercial
    valor_unitario DECIMAL(10,2) DEFAULT 0.00,
    codigo_barras VARCHAR(50) UNIQUE,
    proveedor VARCHAR(255),
    fecha_adquisicion DATE,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_inventario_cantidad_positiva CHECK (cantidad_disponible >= 0),
    CONSTRAINT chk_inventario_cantidad_minima CHECK (cantidad_minima >= 0),
    CONSTRAINT chk_inventario_valor_unitario CHECK (valor_unitario >= 0)
);

-- Tabla de movimientos de inventario
CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL,
    tipo_movimiento tipo_movimiento_enum NOT NULL,
    cantidad INTEGER NOT NULL,
    cantidad_anterior INTEGER,
    cantidad_posterior INTEGER,
    motivo TEXT NOT NULL,
    
    -- Referencias opcionales
    actividad_id UUID,
    scout_id UUID,
    dirigente_id UUID,
    realizado_por_id UUID,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_movimientos_item FOREIGN KEY (item_id) REFERENCES inventario(id) ON DELETE CASCADE,
    CONSTRAINT fk_movimientos_actividad FOREIGN KEY (actividad_id) REFERENCES actividades_scout(id) ON DELETE SET NULL,
    CONSTRAINT fk_movimientos_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE SET NULL,
    CONSTRAINT fk_movimientos_dirigente FOREIGN KEY (dirigente_id) REFERENCES dirigentes(id) ON DELETE SET NULL,
    CONSTRAINT fk_movimientos_realizado_por FOREIGN KEY (realizado_por_id) REFERENCES dirigentes(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_movimientos_cantidad_positiva CHECK (cantidad > 0)
);

-- Tabla de préstamos de inventario
CREATE TABLE prestamos_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL,
    scout_id UUID NOT NULL,
    
    -- Información del préstamo
    cantidad_prestada INTEGER NOT NULL,
    cantidad_devuelta INTEGER DEFAULT 0,
    fecha_prestamo DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_devolucion_esperada DATE NOT NULL,
    fecha_devolucion_real DATE,
    
    -- Estado y control
    estado_prestamo estado_prestamo_enum NOT NULL DEFAULT 'ACTIVO',
    motivo TEXT,
    observaciones_prestamo TEXT,
    estado_items_devueltos VARCHAR(50),
    observaciones_devolucion TEXT,
    
    -- Responsables
    autorizado_por_id UUID,
    recibido_por_id UUID,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_prestamos_item FOREIGN KEY (item_id) REFERENCES inventario(id) ON DELETE CASCADE,
    CONSTRAINT fk_prestamos_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
    CONSTRAINT fk_prestamos_autorizado FOREIGN KEY (autorizado_por_id) REFERENCES dirigentes(id) ON DELETE SET NULL,
    CONSTRAINT fk_prestamos_recibido FOREIGN KEY (recibido_por_id) REFERENCES dirigentes(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_prestamos_cantidad_prestada CHECK (cantidad_prestada > 0),
    CONSTRAINT chk_prestamos_cantidad_devuelta CHECK (cantidad_devuelta >= 0),
    CONSTRAINT chk_prestamos_devolucion_no_excede CHECK (cantidad_devuelta <= cantidad_prestada),
    CONSTRAINT chk_prestamos_fecha_devolucion CHECK (fecha_devolucion_esperada >= fecha_prestamo)
);

-- ================================================================
-- TABLAS DE PRESUPUESTOS
-- ================================================================

-- Tabla de presupuestos
CREATE TABLE presupuestos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_presupuesto VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo_presupuesto tipo_presupuesto_enum NOT NULL,
    año INTEGER NOT NULL,
    monto_total DECIMAL(12,2) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    responsable_id UUID,
    estado estado_presupuesto_enum DEFAULT 'BORRADOR',
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_presupuestos_responsable FOREIGN KEY (responsable_id) REFERENCES dirigentes(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_presupuestos_monto_positivo CHECK (monto_total > 0),
    CONSTRAINT chk_presupuestos_año_valido CHECK (año >= 2020 AND año <= 2050),
    CONSTRAINT chk_presupuestos_fechas CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT uq_presupuestos_nombre_año UNIQUE (nombre, año)
);

-- Tabla de gastos de presupuesto
CREATE TABLE gastos_presupuesto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presupuesto_id UUID NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    categoria categoria_gasto_enum NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_gasto DATE NOT NULL,
    proveedor VARCHAR(255),
    numero_comprobante VARCHAR(100),
    descripcion TEXT,
    observaciones TEXT,
    solicitado_por_id UUID,
    aprobado_por_id UUID,
    fecha_aprobacion DATE,
    estado estado_gasto_enum DEFAULT 'PENDIENTE',
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_gastos_presupuesto FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE,
    CONSTRAINT fk_gastos_solicitado_por FOREIGN KEY (solicitado_por_id) REFERENCES scouts(id) ON DELETE SET NULL,
    CONSTRAINT fk_gastos_aprobado_por FOREIGN KEY (aprobado_por_id) REFERENCES dirigentes(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_gastos_monto_positivo CHECK (monto > 0),
    CONSTRAINT chk_gastos_fecha_aprobacion CHECK (
        (estado = 'APROBADO' AND fecha_aprobacion IS NOT NULL) OR 
        (estado != 'APROBADO' AND fecha_aprobacion IS NULL)
    )
);

-- Tabla de ingresos de presupuesto
CREATE TABLE ingresos_presupuesto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presupuesto_id UUID NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    fuente VARCHAR(255),
    numero_recibo VARCHAR(100),
    descripcion TEXT,
    registrado_por_id UUID,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_ingresos_presupuesto FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE,
    CONSTRAINT fk_ingresos_registrado_por FOREIGN KEY (registrado_por_id) REFERENCES scouts(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_ingresos_monto_positivo CHECK (monto > 0)
);

-- Tabla de notificaciones pendientes
CREATE TABLE notificaciones_pendientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_evento DATE NOT NULL,
    tipo_evento VARCHAR(50) NOT NULL,
    mensaje TEXT NOT NULL,
    rama_objetivo rama_enum,
    scouts_objetivo JSON,
    familiares_objetivo JSON,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    enviado_en TIMESTAMP WITH TIME ZONE,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_notificaciones_estado CHECK (estado IN ('PENDIENTE', 'ENVIADO', 'ERROR', 'CANCELADO'))
);

-- ================================================================
-- ÍNDICES OPTIMIZADOS
-- ================================================================

-- Índices principales para scouts
CREATE INDEX idx_scouts_codigo ON scouts(codigo_scout);
CREATE INDEX idx_scouts_documento ON scouts(numero_documento);
CREATE INDEX idx_scouts_nombres ON scouts(nombres, apellidos);
CREATE INDEX idx_scouts_rama_estado ON scouts(rama_actual, estado);
CREATE INDEX idx_scouts_fecha_nacimiento ON scouts(fecha_nacimiento);
CREATE INDEX idx_scouts_fecha_ingreso ON scouts(fecha_ingreso);

-- Índices para familiares
CREATE INDEX idx_familiares_scout_id ON familiares_scout(scout_id);
CREATE INDEX idx_familiares_nombres ON familiares_scout(nombres, apellidos);
CREATE INDEX idx_familiares_contacto_emergencia ON familiares_scout(es_contacto_emergencia) WHERE es_contacto_emergencia = TRUE;

-- Índices para dirigentes
CREATE INDEX idx_dirigentes_scout_id ON dirigentes(scout_id);
CREATE INDEX idx_dirigentes_codigo ON dirigentes(codigo_dirigente);
CREATE INDEX idx_dirigentes_rama_estado ON dirigentes(rama_responsable, estado_dirigente);

-- Índices para patrullas
CREATE INDEX idx_patrullas_codigo ON patrullas(codigo_patrulla);
CREATE INDEX idx_patrullas_rama_estado ON patrullas(rama, estado);
CREATE INDEX idx_patrullas_dirigente ON patrullas(dirigente_responsable_id);

-- Índices para miembros de patrulla
CREATE INDEX idx_miembros_scout_patrulla ON miembros_patrulla(scout_id, patrulla_id);
CREATE INDEX idx_miembros_estado ON miembros_patrulla(estado_miembro);
CREATE INDEX idx_miembros_fecha_ingreso ON miembros_patrulla(fecha_ingreso);

-- Índices para actividades
CREATE INDEX idx_actividades_codigo ON actividades_scout(codigo_actividad);
CREATE INDEX idx_actividades_fechas ON actividades_scout(fecha_inicio, fecha_fin);
CREATE INDEX idx_actividades_rama_estado ON actividades_scout(rama_objetivo, estado);
CREATE INDEX idx_actividades_dirigente ON actividades_scout(dirigente_responsable_id);

-- Índices para participantes
CREATE INDEX idx_participantes_actividad ON participantes_actividad(actividad_id);
CREATE INDEX idx_participantes_scout ON participantes_actividad(scout_id);
CREATE INDEX idx_participantes_estado ON participantes_actividad(estado_participacion);

-- Índices para inscripciones_actividad
CREATE INDEX idx_inscripciones_actividad_actividad ON inscripciones_actividad(actividad_id);
CREATE INDEX idx_inscripciones_actividad_scout ON inscripciones_actividad(scout_id);
CREATE INDEX idx_inscripciones_actividad_estado ON inscripciones_actividad(estado);
CREATE INDEX idx_inscripciones_actividad_fecha ON inscripciones_actividad(fecha_inscripcion);

-- Índices para evaluaciones_actividad
CREATE INDEX idx_evaluaciones_actividad_actividad ON evaluaciones_actividad(actividad_id);
CREATE INDEX idx_evaluaciones_actividad_evaluador ON evaluaciones_actividad(evaluador_id);
CREATE INDEX idx_evaluaciones_actividad_tipo ON evaluaciones_actividad(tipo_evaluador);
CREATE INDEX idx_evaluaciones_actividad_calificacion ON evaluaciones_actividad(calificacion_general);
CREATE INDEX idx_evaluaciones_actividad_fecha ON evaluaciones_actividad(fecha_evaluacion);

-- Índices para asistencias
CREATE INDEX idx_asistencias_scout_fecha ON asistencias(scout_id, fecha);
CREATE INDEX idx_asistencias_actividad ON asistencias(actividad_id);
CREATE INDEX idx_asistencias_estado ON asistencias(estado_asistencia);

-- Índices para logros
CREATE INDEX idx_logros_scout ON logros_scout(scout_id);
CREATE INDEX idx_logros_tipo_estado ON logros_scout(tipo_logro, estado);
CREATE INDEX idx_logros_fecha ON logros_scout(fecha_obtencion);

-- Índices para programa semanal
CREATE INDEX idx_programa_semana_rama ON programa_semanal(semana_inicio, rama);
CREATE INDEX idx_programa_responsable ON programa_semanal(responsable_id);

-- Índices para inscripciones
CREATE INDEX idx_inscripciones_scout_ano ON inscripciones_anuales(scout_id, ano);
CREATE INDEX idx_inscripciones_codigo ON inscripciones_anuales(codigo_asociado);
CREATE INDEX idx_inscripciones_estado_pago ON inscripciones_anuales(estado_pago);

-- Índices para comité de padres
CREATE INDEX idx_comite_periodo_cargo ON comite_padres(periodo, cargo);
CREATE INDEX idx_comite_familiar ON comite_padres(familiar_id);

-- Índices para historial
CREATE INDEX idx_historial_tabla_registro ON historial_cambios(tabla_afectada, registro_id);
CREATE INDEX idx_historial_fecha ON historial_cambios(created_at);
CREATE INDEX idx_historial_modificado_por ON historial_cambios(modificado_por_id);

-- Índices para inventario
CREATE INDEX idx_inventario_codigo ON inventario(codigo_item);
CREATE INDEX idx_inventario_nombre ON inventario(nombre);
CREATE INDEX idx_inventario_categoria ON inventario(categoria);
CREATE INDEX idx_inventario_estado ON inventario(estado_item);
CREATE INDEX idx_inventario_ubicacion ON inventario(ubicacion);
CREATE INDEX idx_inventario_stock_bajo ON inventario(cantidad_disponible, cantidad_minima) WHERE cantidad_disponible <= cantidad_minima;
CREATE INDEX idx_inventario_codigo_barras ON inventario(codigo_barras) WHERE codigo_barras IS NOT NULL;

-- Índices para movimientos de inventario
CREATE INDEX idx_movimientos_item_fecha ON movimientos_inventario(item_id, created_at);
CREATE INDEX idx_movimientos_tipo ON movimientos_inventario(tipo_movimiento);
CREATE INDEX idx_movimientos_scout ON movimientos_inventario(scout_id) WHERE scout_id IS NOT NULL;
CREATE INDEX idx_movimientos_actividad ON movimientos_inventario(actividad_id) WHERE actividad_id IS NOT NULL;
CREATE INDEX idx_movimientos_realizado_por ON movimientos_inventario(realizado_por_id) WHERE realizado_por_id IS NOT NULL;

-- Índices para préstamos
CREATE INDEX idx_prestamos_item ON prestamos_inventario(item_id);
CREATE INDEX idx_prestamos_scout ON prestamos_inventario(scout_id);
CREATE INDEX idx_prestamos_estado ON prestamos_inventario(estado_prestamo);
CREATE INDEX idx_prestamos_fechas ON prestamos_inventario(fecha_prestamo, fecha_devolucion_esperada);
CREATE INDEX idx_prestamos_activos ON prestamos_inventario(estado_prestamo, fecha_devolucion_esperada) WHERE estado_prestamo = 'ACTIVO';
-- NOTA: Índice para préstamos vencidos se debe crear dinámicamente en consultas o con función IMMUTABLE personalizada

-- Índices para presupuestos
CREATE INDEX idx_presupuestos_codigo ON presupuestos(codigo_presupuesto);
CREATE INDEX idx_presupuestos_nombre ON presupuestos(nombre);
CREATE INDEX idx_presupuestos_ano_tipo ON presupuestos(año, tipo_presupuesto);
CREATE INDEX idx_presupuestos_estado ON presupuestos(estado);
CREATE INDEX idx_presupuestos_responsable ON presupuestos(responsable_id);
CREATE INDEX idx_presupuestos_fechas ON presupuestos(fecha_inicio, fecha_fin);

-- Índices para gastos de presupuesto
CREATE INDEX idx_gastos_presupuesto ON gastos_presupuesto(presupuesto_id);
CREATE INDEX idx_gastos_fecha ON gastos_presupuesto(fecha_gasto);
CREATE INDEX idx_gastos_categoria ON gastos_presupuesto(categoria);
CREATE INDEX idx_gastos_estado ON gastos_presupuesto(estado);
CREATE INDEX idx_gastos_solicitado_por ON gastos_presupuesto(solicitado_por_id);
CREATE INDEX idx_gastos_aprobado_por ON gastos_presupuesto(aprobado_por_id);
CREATE INDEX idx_gastos_presupuesto_fecha ON gastos_presupuesto(presupuesto_id, fecha_gasto);

-- Índices para ingresos de presupuesto
CREATE INDEX idx_ingresos_presupuesto ON ingresos_presupuesto(presupuesto_id);
CREATE INDEX idx_ingresos_fecha ON ingresos_presupuesto(fecha_ingreso);
CREATE INDEX idx_ingresos_registrado_por ON ingresos_presupuesto(registrado_por_id);
CREATE INDEX idx_ingresos_presupuesto_fecha ON ingresos_presupuesto(presupuesto_id, fecha_ingreso);

-- Índices para notificaciones pendientes
CREATE INDEX idx_notificaciones_fecha_evento ON notificaciones_pendientes(fecha_evento);
CREATE INDEX idx_notificaciones_tipo_evento ON notificaciones_pendientes(tipo_evento);
CREATE INDEX idx_notificaciones_estado ON notificaciones_pendientes(estado);
CREATE INDEX idx_notificaciones_rama ON notificaciones_pendientes(rama_objetivo);
CREATE INDEX idx_notificaciones_pendientes ON notificaciones_pendientes(estado, fecha_evento) WHERE estado = 'PENDIENTE';

-- Índices para puntos_patrulla
CREATE INDEX idx_puntos_patrulla_id ON puntos_patrulla(patrulla_id);
CREATE INDEX idx_puntos_fecha ON puntos_patrulla(fecha_otorgamiento);
CREATE INDEX idx_puntos_actividad ON puntos_patrulla(actividad_id) WHERE actividad_id IS NOT NULL;
CREATE INDEX idx_puntos_otorgado_por ON puntos_patrulla(otorgado_por_id) WHERE otorgado_por_id IS NOT NULL;

-- Índices para proyectos_patrulla
CREATE INDEX idx_proyectos_patrulla_id ON proyectos_patrulla(patrulla_id);
CREATE INDEX idx_proyectos_estado ON proyectos_patrulla(estado);
CREATE INDEX idx_proyectos_responsable ON proyectos_patrulla(responsable_scout_id) WHERE responsable_scout_id IS NOT NULL;
CREATE INDEX idx_proyectos_fechas ON proyectos_patrulla(fecha_inicio, fecha_fin_estimada);

-- Índices para libro_oro
CREATE INDEX idx_libro_oro_tipo ON libro_oro(tipo_registro);
CREATE INDEX idx_libro_oro_fecha ON libro_oro(fecha_evento);
CREATE INDEX idx_libro_oro_scout ON libro_oro(scout_id) WHERE scout_id IS NOT NULL;
CREATE INDEX idx_libro_oro_patrulla ON libro_oro(patrulla_id) WHERE patrulla_id IS NOT NULL;
CREATE INDEX idx_libro_oro_dirigente ON libro_oro(dirigente_id) WHERE dirigente_id IS NOT NULL;
CREATE INDEX idx_libro_oro_destacado ON libro_oro(es_destacado) WHERE es_destacado = TRUE;
CREATE INDEX idx_libro_oro_busqueda ON libro_oro USING gin(to_tsvector('spanish', titulo || ' ' || descripcion));

-- Índices para inscripciones
CREATE INDEX idx_inscripciones_periodo ON inscripciones(periodo_id);
CREATE INDEX idx_inscripciones_scout ON inscripciones(scout_id);
CREATE INDEX idx_inscripciones_estado ON inscripciones(estado);
CREATE INDEX idx_inscripciones_rama ON inscripciones(rama_solicita);
CREATE INDEX idx_inscripciones_fecha_presentacion ON inscripciones(fecha_presentacion) WHERE fecha_presentacion IS NOT NULL;

-- Índices para periodos_inscripcion
CREATE INDEX idx_periodos_año ON periodos_inscripcion(año);
CREATE INDEX idx_periodos_estado ON periodos_inscripcion(estado);
CREATE INDEX idx_periodos_fechas ON periodos_inscripcion(fecha_inicio, fecha_limite);
CREATE INDEX idx_periodos_dirigente ON periodos_inscripcion(dirigente_responsable_id);
CREATE INDEX idx_periodos_activos ON periodos_inscripcion(año, estado) WHERE estado = 'ACTIVO';

-- Índices para pagos_inscripcion
CREATE INDEX idx_pagos_inscripcion_id ON pagos_inscripcion(inscripcion_id);
CREATE INDEX idx_pagos_fecha ON pagos_inscripcion(fecha_pago);
CREATE INDEX idx_pagos_metodo ON pagos_inscripcion(metodo_pago);
CREATE INDEX idx_pagos_dirigente_receptor ON pagos_inscripcion(dirigente_receptor_id);
CREATE INDEX idx_pagos_inscripcion_fecha ON pagos_inscripcion(inscripcion_id, fecha_pago);

-- ================================================================
-- TRIGGERS PARA UPDATED_AT
-- ================================================================

CREATE TRIGGER trigger_scouts_updated_at
    BEFORE UPDATE ON scouts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_dirigentes_updated_at
    BEFORE UPDATE ON dirigentes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_patrullas_updated_at
    BEFORE UPDATE ON patrullas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_actividades_updated_at
    BEFORE UPDATE ON actividades_scout
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_inscripciones_actividad_updated_at
    BEFORE UPDATE ON inscripciones_actividad
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_evaluaciones_actividad_updated_at
    BEFORE UPDATE ON evaluaciones_actividad
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_programa_updated_at
    BEFORE UPDATE ON programa_semanal
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_comite_updated_at
    BEFORE UPDATE ON comite_padres
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_inventario_updated_at
    BEFORE UPDATE ON inventario
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_prestamos_updated_at
    BEFORE UPDATE ON prestamos_inventario
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_presupuestos_updated_at
    BEFORE UPDATE ON presupuestos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_gastos_presupuesto_updated_at
    BEFORE UPDATE ON gastos_presupuesto
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_ingresos_presupuesto_updated_at
    BEFORE UPDATE ON ingresos_presupuesto
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_notificaciones_updated_at
    BEFORE UPDATE ON notificaciones_pendientes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_puntos_patrulla_updated_at
    BEFORE UPDATE ON puntos_patrulla
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_proyectos_patrulla_updated_at
    BEFORE UPDATE ON proyectos_patrulla
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_libro_oro_updated_at
    BEFORE UPDATE ON libro_oro
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_inscripciones_updated_at
    BEFORE UPDATE ON inscripciones
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_periodos_inscripcion_updated_at
    BEFORE UPDATE ON periodos_inscripcion
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_pagos_inscripcion_updated_at
    BEFORE UPDATE ON pagos_inscripcion
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

-- ================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ================================================================

COMMENT ON TABLE scouts IS 'Tabla principal con información de todos los scouts del grupo';
COMMENT ON TABLE familiares_scout IS 'Contactos familiares y responsables de cada scout';
COMMENT ON TABLE dirigentes IS 'Información específica de dirigentes scout';
COMMENT ON TABLE patrullas IS 'Organización de patrullas por rama';
COMMENT ON TABLE miembros_patrulla IS 'Membresía de scouts en patrullas';
COMMENT ON TABLE actividades_scout IS 'Calendario y gestión de actividades';
COMMENT ON TABLE participantes_actividad IS 'Inscripciones y participación en actividades';
COMMENT ON TABLE inscripciones_actividad IS 'Inscripciones específicas a actividades con datos adicionales';
COMMENT ON TABLE evaluaciones_actividad IS 'Evaluaciones y feedback de actividades realizadas';
COMMENT ON TABLE asistencias IS 'Registro de asistencia a reuniones y actividades';
COMMENT ON TABLE logros_scout IS 'Libro de oro - logros y reconocimientos';
COMMENT ON TABLE programa_semanal IS 'Planificación semanal por rama';
COMMENT ON TABLE inscripciones_anuales IS 'Gestión de inscripciones anuales';
COMMENT ON TABLE comite_padres IS 'Organización del comité de padres de familia';
COMMENT ON TABLE historial_cambios IS 'Auditoría de cambios en el sistema';
COMMENT ON TABLE inventario IS 'Gestión del inventario de equipos y materiales del grupo';
COMMENT ON TABLE movimientos_inventario IS 'Registro de movimientos de entrada, salida y ajustes de inventario';
COMMENT ON TABLE prestamos_inventario IS 'Control de préstamos de equipos a scouts y dirigentes';
COMMENT ON TABLE presupuestos IS 'Gestión de presupuestos anuales y por actividades del grupo scout';
COMMENT ON TABLE gastos_presupuesto IS 'Registro de gastos asociados a cada presupuesto';
COMMENT ON TABLE ingresos_presupuesto IS 'Registro de ingresos adicionales a los presupuestos';
COMMENT ON TABLE notificaciones_pendientes IS 'Sistema de notificaciones para eventos y asistencia';
COMMENT ON TABLE inscripciones_actividad IS 'Inscripciones específicas de scouts a actividades con datos de autorización';
COMMENT ON TABLE evaluaciones_actividad IS 'Evaluaciones y comentarios de scouts sobre actividades realizadas';

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '🏗️ ESQUEMA CREADO EXITOSAMENTE' as estado,
    'Todas las tablas, índices y constraints han sido creados' as mensaje,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public')::TEXT || ' tablas creadas' as resumen,
    NOW() as timestamp_creacion;