-- ============================================
-- ESQUEMA DE BASE DE DATOS PARA SISTEMA SCOUT COMPLETO - VERSIÓN FINAL
-- ============================================
-- Ejecutar este script en Supabase para crear todas las tablas del sistema

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Tabla principal de scouts
CREATE TABLE IF NOT EXISTS scouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_scout VARCHAR(20) UNIQUE, -- Código único generado automáticamente
    
    -- Datos Personales
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    
    -- Contacto
    celular VARCHAR(20),
    telefono VARCHAR(20),
    correo VARCHAR(255),
    
    -- Documentación
    tipo_documento VARCHAR(30) DEFAULT 'DNI' CHECK (tipo_documento IN ('DNI', 'Carnet de Extranjería', 'Pasaporte')),
    numero_documento VARCHAR(20) UNIQUE,
    
    -- Ubicación
    pais VARCHAR(100) DEFAULT 'Perú',
    departamento VARCHAR(100),
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    direccion TEXT,
    
    -- Datos Académicos/Laborales
    centro_estudio VARCHAR(255),
    ocupacion VARCHAR(255),
    centro_laboral VARCHAR(255),
    
    -- Datos Scout
    es_dirigente BOOLEAN DEFAULT false,
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    rama_actual VARCHAR(50) CHECK (rama_actual IN ('Lobatos', 'Scouts', 'Rovers', 'Dirigentes')),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido', 'retirado')),
    
    -- Metadatos
    foto_url TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de familiares/contactos de emergencia
CREATE TABLE IF NOT EXISTS familiares_scout (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    
    -- Datos del familiar
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    parentesco VARCHAR(50) NOT NULL CHECK (parentesco IN (
        'Padre', 'Madre', 'Tutor', 'Abuelo', 'Abuela', 
        'Tío', 'Tía', 'Hermano', 'Hermana', 'Otro'
    )),
    
    -- Contacto
    celular VARCHAR(20),
    telefono VARCHAR(20),
    correo VARCHAR(255),
    
    -- Datos adicionales
    ocupacion VARCHAR(255),
    centro_laboral VARCHAR(255),
    es_contacto_emergencia BOOLEAN DEFAULT true,
    es_responsable_legal BOOLEAN DEFAULT false,
    
    -- Metadatos
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de dirigentes (extensión de scouts)
CREATE TABLE IF NOT EXISTS dirigentes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    
    -- Datos específicos de dirigente
    codigo_dirigente VARCHAR(20) UNIQUE,
    fecha_ingreso_dirigente DATE DEFAULT CURRENT_DATE,
    rama_responsable VARCHAR(50),
    cargo VARCHAR(100), -- Jefe de Grupo, Jefe de Rama, Subjefe, etc.
    nivel_formacion VARCHAR(50), -- Preliminar, Intermedio, Avanzado
    
    -- Certificaciones
    insignia_madera BOOLEAN DEFAULT false,
    fecha_insignia_madera DATE,
    cursos_completados TEXT[], -- Array de cursos
    
    -- Estado
    estado_dirigente VARCHAR(20) DEFAULT 'activo' CHECK (estado_dirigente IN ('activo', 'licencia', 'retirado')),
    
    -- Metadatos
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de historial de cambios de rama
CREATE TABLE IF NOT EXISTS historial_ramas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    
    rama_anterior VARCHAR(50),
    rama_nueva VARCHAR(50) NOT NULL,
    fecha_cambio DATE DEFAULT CURRENT_DATE,
    motivo TEXT,
    autorizado_por VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de patrullas
CREATE TABLE IF NOT EXISTS patrullas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rama VARCHAR(50) NOT NULL,
    lema TEXT,
    grito TEXT,
    colores VARCHAR(100),
    totem VARCHAR(100),
    
    -- Dirigente responsable
    dirigente_id UUID REFERENCES dirigentes(id),
    
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva', 'disuelta')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabla de membresía en patrullas
CREATE TABLE IF NOT EXISTS miembros_patrulla (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    patrulla_id UUID NOT NULL REFERENCES patrullas(id) ON DELETE CASCADE,
    
    cargo VARCHAR(50) DEFAULT 'Miembro' CHECK (cargo IN ('Guía', 'Subguía', 'Miembro')),
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    fecha_salida DATE,
    activo BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(scout_id, patrulla_id, activo) -- Un scout solo puede estar activo en una patrulla
);

-- 7. Tabla de actividades scout
CREATE TABLE IF NOT EXISTS actividades_scout (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_actividad VARCHAR(50) NOT NULL CHECK (tipo_actividad IN (
        'Reunión Regular', 'Campamento', 'Excursión', 'Servicio Comunitario',
        'Ceremonial', 'Capacitación', 'Competencia', 'Juego Grande', 'Otro'
    )),
    
    -- Fechas y duración
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Ubicación
    lugar VARCHAR(255),
    direccion_lugar TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    -- Organización
    rama_objetivo VARCHAR(50),
    dirigente_responsable UUID REFERENCES dirigentes(id),
    costo DECIMAL(10,2) DEFAULT 0,
    maximo_participantes INTEGER,
    participantes_esperados INTEGER DEFAULT 0,
    
    -- Estado
    estado VARCHAR(20) DEFAULT 'planificada' CHECK (estado IN (
        'planificada', 'confirmada', 'en_progreso', 'finalizada', 'cancelada'
    )),
    
    -- Requisitos
    requiere_autorizacion BOOLEAN DEFAULT false,
    requiere_pago BOOLEAN DEFAULT false,
    edad_minima INTEGER,
    edad_maxima INTEGER,
    
    -- Metadatos
    observaciones TEXT,
    equipamiento_necesario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabla de participantes en actividades
CREATE TABLE IF NOT EXISTS participantes_actividad (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actividad_id UUID NOT NULL REFERENCES actividades_scout(id) ON DELETE CASCADE,
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    
    -- Estado de participación
    estado_participacion VARCHAR(20) DEFAULT 'inscrito' CHECK (estado_participacion IN (
        'inscrito', 'confirmado', 'presente', 'ausente', 'cancelado'
    )),
    
    -- Fechas
    fecha_inscripcion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_confirmacion TIMESTAMP WITH TIME ZONE,
    
    -- Pagos
    monto_pagado DECIMAL(10,2) DEFAULT 0,
    fecha_pago TIMESTAMP WITH TIME ZONE,
    
    -- Observaciones
    observaciones TEXT,
    requiere_transporte BOOLEAN DEFAULT false,
    autorizacion_familiar BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(actividad_id, scout_id) -- Un scout no puede inscribirse dos veces a la misma actividad
);

-- 9. Tabla de asistencias
CREATE TABLE IF NOT EXISTS asistencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    actividad_id UUID REFERENCES actividades_scout(id) ON DELETE SET NULL,
    
    fecha DATE NOT NULL,
    tipo_evento VARCHAR(50) DEFAULT 'Reunión Regular' CHECK (tipo_evento IN (
        'Reunión Regular', 'Actividad Especial', 'Campamento', 'Servicio'
    )),
    
    estado_asistencia VARCHAR(20) NOT NULL CHECK (estado_asistencia IN (
        'presente', 'ausente', 'tardanza', 'justificado'
    )),
    
    hora_llegada TIME,
    hora_salida TIME,
    justificacion TEXT,
    
    registrado_por UUID REFERENCES dirigentes(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(scout_id, fecha, tipo_evento) -- No duplicar asistencias del mismo día y tipo
);

-- 10. Tabla de logros y reconocimientos (Libro de Oro)
CREATE TABLE IF NOT EXISTS logros_scout (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    
    tipo_logro VARCHAR(50) NOT NULL CHECK (tipo_logro IN (
        'Insignia de Especialidad', 'Insignia de Progresión', 'Reconocimiento',
        'Servicio Comunitario', 'Liderazgo', 'Campamento', 'Otro'
    )),
    
    nombre_logro VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_obtencion DATE DEFAULT CURRENT_DATE,
    
    -- Evaluación
    evaluado_por UUID REFERENCES dirigentes(id),
    puntos INTEGER DEFAULT 0,
    nivel VARCHAR(20) CHECK (nivel IN ('Bronce', 'Plata', 'Oro', 'Especial')),
    
    -- Evidencia
    evidencia_url TEXT,
    certificado_url TEXT,
    
    -- Estado
    estado VARCHAR(20) DEFAULT 'otorgado' CHECK (estado IN ('pendiente', 'otorgado', 'revocado')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Tabla de programa semanal
CREATE TABLE IF NOT EXISTS programa_semanal (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    semana_inicio DATE NOT NULL,
    semana_fin DATE NOT NULL,
    rama VARCHAR(50) NOT NULL,
    
    -- Actividades planificadas
    lunes TEXT,
    martes TEXT,
    miercoles TEXT,
    jueves TEXT,
    viernes TEXT,
    sabado TEXT,
    domingo TEXT,
    
    -- Metadatos
    tema_semanal VARCHAR(255),
    objetivos TEXT,
    materiales_necesarios TEXT,
    responsable UUID REFERENCES dirigentes(id),
    
    estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicado', 'archivado')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(semana_inicio, rama) -- No duplicar programas para la misma semana y rama
);

-- 12. Tabla de inscripciones anuales
CREATE TABLE IF NOT EXISTS inscripciones_anuales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scout_id UUID NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    
    codigo_asociado VARCHAR(20) UNIQUE NOT NULL, -- ASC-2024-001
    ano INTEGER NOT NULL,
    rama VARCHAR(50) NOT NULL,
    
    fecha_inscripcion DATE DEFAULT CURRENT_DATE,
    monto_inscripcion DECIMAL(10,2) DEFAULT 0,
    fecha_pago DATE,
    estado_pago VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_pago IN (
        'pendiente', 'pagado', 'parcial', 'exonerado'
    )),
    
    -- Documentación requerida
    documentos_completos BOOLEAN DEFAULT false,
    certificado_medico BOOLEAN DEFAULT false,
    autorizacion_padres BOOLEAN DEFAULT false,
    
    activo BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(scout_id, ano) -- Un scout solo puede tener una inscripción por año
);

-- 13. Tabla de Libro de Oro (Memorias y experiencias)
CREATE TABLE IF NOT EXISTS libro_oro (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patrulla_id UUID REFERENCES patrullas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    titulo VARCHAR(255),
    contenido TEXT NOT NULL,
    relatores TEXT[] NOT NULL, -- Array de nombres de relatores
    fotos_urls TEXT[], -- Array de URLs de fotos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Tabla de Comité de Padres
CREATE TABLE IF NOT EXISTS comite_padres (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    familiar_id UUID REFERENCES familiares_scout(id) ON DELETE SET NULL, -- Opcional: vinculado a familiar
    nombre VARCHAR(255) NOT NULL,
    cargo VARCHAR(100) NOT NULL CHECK (cargo IN ('presidente', 'secretario', 'tesorero', 'vocal', 'suplente')),
    periodo VARCHAR(20) NOT NULL, -- Ej: "2024-2025"
    fecha_eleccion DATE NOT NULL,
    fecha_culminacion DATE NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'culminado', 'renunciado')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

CREATE INDEX IF NOT EXISTS idx_scouts_codigo ON scouts(codigo_scout);
CREATE INDEX IF NOT EXISTS idx_scouts_documento ON scouts(numero_documento);
CREATE INDEX IF NOT EXISTS idx_scouts_rama ON scouts(rama_actual);
CREATE INDEX IF NOT EXISTS idx_scouts_estado ON scouts(estado);
CREATE INDEX IF NOT EXISTS idx_scouts_nombre ON scouts(nombres, apellidos);
CREATE INDEX IF NOT EXISTS idx_scouts_fecha_nacimiento ON scouts(fecha_nacimiento);

CREATE INDEX IF NOT EXISTS idx_familiares_scout ON familiares_scout(scout_id);
CREATE INDEX IF NOT EXISTS idx_dirigentes_scout ON dirigentes(scout_id);
CREATE INDEX IF NOT EXISTS idx_historial_scout ON historial_ramas(scout_id);

CREATE INDEX IF NOT EXISTS idx_miembros_patrulla_scout ON miembros_patrulla(scout_id);
CREATE INDEX IF NOT EXISTS idx_miembros_patrulla_patrulla ON miembros_patrulla(patrulla_id);

CREATE INDEX IF NOT EXISTS idx_participantes_actividad ON participantes_actividad(actividad_id);
CREATE INDEX IF NOT EXISTS idx_participantes_scout ON participantes_actividad(scout_id);

CREATE INDEX IF NOT EXISTS idx_asistencias_scout ON asistencias(scout_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_actividad ON asistencias(actividad_id);

CREATE INDEX IF NOT EXISTS idx_logros_scout ON logros_scout(scout_id);
CREATE INDEX IF NOT EXISTS idx_logros_tipo ON logros_scout(tipo_logro);
CREATE INDEX IF NOT EXISTS idx_logros_fecha ON logros_scout(fecha_obtencion);

CREATE INDEX IF NOT EXISTS idx_inscripciones_scout ON inscripciones_anuales(scout_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_ano ON inscripciones_anuales(ano);

CREATE INDEX IF NOT EXISTS idx_libro_oro_patrulla ON libro_oro(patrulla_id);
CREATE INDEX IF NOT EXISTS idx_libro_oro_fecha ON libro_oro(fecha);

CREATE INDEX IF NOT EXISTS idx_comite_padres_periodo ON comite_padres(periodo);
CREATE INDEX IF NOT EXISTS idx_comite_padres_estado ON comite_padres(estado);
CREATE INDEX IF NOT EXISTS idx_comite_padres_cargo ON comite_padres(cargo);

CREATE INDEX IF NOT EXISTS idx_actividades_fecha_inicio ON actividades_scout(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_actividades_rama ON actividades_scout(rama_objetivo);

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE TRIGGER update_scouts_updated_at
    BEFORE UPDATE ON scouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dirigentes_updated_at
    BEFORE UPDATE ON dirigentes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patrullas_updated_at
    BEFORE UPDATE ON patrullas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actividades_updated_at
    BEFORE UPDATE ON actividades_scout
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programa_updated_at
    BEFORE UPDATE ON programa_semanal
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_libro_oro_updated_at
    BEFORE UPDATE ON libro_oro
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comite_padres_updated_at
    BEFORE UPDATE ON comite_padres
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VISTAS PARA CÁLCULOS DINÁMICOS
-- ============================================

-- Vista para scouts con edad y rama calculada dinámicamente
CREATE OR REPLACE VIEW scouts_grupo AS
SELECT 
    s.*,
    EXTRACT(year FROM age(CURRENT_DATE, s.fecha_nacimiento))::INTEGER as edad,
    -- Determinar rama según edad
    CASE 
        WHEN EXTRACT(year FROM age(CURRENT_DATE, s.fecha_nacimiento)) BETWEEN 7 AND 10 THEN 'manada'
        WHEN EXTRACT(year FROM age(CURRENT_DATE, s.fecha_nacimiento)) BETWEEN 11 AND 14 THEN 'tropa'  
        WHEN EXTRACT(year FROM age(CURRENT_DATE, s.fecha_nacimiento)) BETWEEN 15 AND 17 THEN 'comunidad'
        WHEN EXTRACT(year FROM age(CURRENT_DATE, s.fecha_nacimiento)) >= 18 THEN 'dirigentes'
        ELSE 'sin_rama'
    END as rama,
    CASE 
        WHEN s.estado = 'activo' THEN true 
        ELSE false 
    END as activo
FROM scouts s;

-- Vista para actividades con duración calculada
CREATE OR REPLACE VIEW actividades_con_duracion AS
SELECT 
    a.*,
    EXTRACT(EPOCH FROM (a.fecha_fin - a.fecha_inicio)) / 3600 as duracion_horas,
    DATE(a.fecha_inicio) as fecha
FROM actividades_scout a;

-- Vista para dirigentes activos con información completa
CREATE OR REPLACE VIEW dirigentes_completos AS
SELECT 
    d.*,
    s.nombres,
    s.apellidos,
    s.celular,
    s.correo,
    EXTRACT(year FROM age(CURRENT_DATE, s.fecha_nacimiento))::INTEGER as edad,
    CASE 
        WHEN d.estado_dirigente = 'activo' THEN true 
        ELSE false 
    END as activo
FROM dirigentes d
JOIN scouts s ON d.scout_id = s.id;

-- Vista para patrullas con información completa
CREATE OR REPLACE VIEW patrullas_completas AS
SELECT 
    p.*,
    d.nombres as dirigente_nombre,
    d.apellidos as dirigente_apellido,
    CASE 
        WHEN p.estado = 'activa' THEN true 
        ELSE false 
    END as activa,
    (
        SELECT COUNT(*) 
        FROM miembros_patrulla mp 
        WHERE mp.patrulla_id = p.id AND mp.activo = true
    ) as total_miembros
FROM patrullas p
LEFT JOIN dirigentes_completos d ON p.dirigente_id = d.id;

-- Vista para asistencias con información de actividad
CREATE OR REPLACE VIEW asistencias_actividad AS
SELECT 
    a.id,
    a.scout_id,
    a.actividad_id,
    a.fecha,
    a.tipo_evento,
    CASE 
        WHEN a.estado_asistencia = 'presente' THEN true 
        ELSE false 
    END as presente,
    a.hora_llegada,
    a.hora_salida,
    a.justificacion,
    a.registrado_por,
    a.created_at,
    ac.nombre as actividad_nombre,
    ac.tipo_actividad
FROM asistencias a
LEFT JOIN actividades_scout ac ON a.actividad_id = ac.id;

-- Vista para logros del sistema (catálogo base)
CREATE OR REPLACE VIEW logros_sistema AS
SELECT DISTINCT
    l.tipo_logro as categoria,
    l.nombre_logro as nombre,
    l.descripcion,
    l.puntos,
    l.nivel,
    ROW_NUMBER() OVER (PARTITION BY l.nombre_logro ORDER BY l.id) as id
FROM logros_scout l
WHERE l.estado = 'otorgado';

-- ============================================
-- FUNCIONES DE UTILIDAD
-- ============================================

-- Función para generar código de scout único
CREATE OR REPLACE FUNCTION generar_codigo_scout()
RETURNS TEXT AS $$
DECLARE
    nuevo_codigo TEXT;
    contador INTEGER := 1;
BEGIN
    LOOP
        nuevo_codigo := 'SCT-' || LPAD(contador::TEXT, 4, '0');
        
        IF NOT EXISTS (SELECT 1 FROM scouts WHERE codigo_scout = nuevo_codigo) THEN
            RETURN nuevo_codigo;
        END IF;
        
        contador := contador + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Función para generar código de dirigente único
CREATE OR REPLACE FUNCTION generar_codigo_dirigente()
RETURNS TEXT AS $$
DECLARE
    nuevo_codigo TEXT;
    contador INTEGER := 1;
BEGIN
    LOOP
        nuevo_codigo := 'DIR-' || LPAD(contador::TEXT, 4, '0');
        
        IF NOT EXISTS (SELECT 1 FROM dirigentes WHERE codigo_dirigente = nuevo_codigo) THEN
            RETURN nuevo_codigo;
        END IF;
        
        contador := contador + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- POLÍTICAS RLS BÁSICAS
-- ============================================

-- Habilitar RLS en las tablas principales
ALTER TABLE scouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE familiares_scout ENABLE ROW LEVEL SECURITY;
ALTER TABLE dirigentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrullas ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades_scout ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE logros_scout ENABLE ROW LEVEL SECURITY;
ALTER TABLE programa_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE libro_oro ENABLE ROW LEVEL SECURITY;
ALTER TABLE comite_padres ENABLE ROW LEVEL SECURITY;

-- Políticas básicas: permitir todo para usuarios autenticados
CREATE POLICY "Permitir acceso completo" ON scouts FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acceso completo" ON familiares_scout FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acceso completo" ON dirigentes FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acceso completo" ON patrullas FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acceso completo" ON actividades_scout FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acceso completo" ON asistencias FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acceso completo" ON logros_scout FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acceso completo" ON programa_semanal FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acceso completo" ON libro_oro FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acceso completo" ON comite_padres FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acceso completo" ON participantes_actividad FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acceso completo" ON miembros_patrulla FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acceso completo" ON inscripciones_anuales FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acceso completo" ON historial_ramas FOR ALL TO authenticated USING (true);

-- ============================================
-- MENSAJE DE FINALIZACIÓN
-- ============================================

-- Crear una función de prueba para verificar que todo funciona
CREATE OR REPLACE FUNCTION test_schema_scout()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Schema del sistema scout creado exitosamente. Tablas: ' || 
           (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%scout%' OR table_name LIKE 'patrullas' OR table_name LIKE 'dirigentes' OR table_name LIKE 'asistencias' OR table_name LIKE 'actividades_scout')::TEXT ||
           ' | Vistas: ' ||
           (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public')::TEXT ||
           ' | Funciones: ' ||
           (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar prueba
SELECT test_schema_scout();