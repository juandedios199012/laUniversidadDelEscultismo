-- ================================================================
-- 📊 DATOS DE EJEMPLO - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 04_seed_data.sql
-- Propósito: Insertar datos de ejemplo para testing y demostración
-- Orden de ejecución: 5° (Después de security)
-- ================================================================

-- ================================================================
-- LIMPIAR DATOS EXISTENTES (OPCIONAL)
-- ================================================================
-- Descomenta si necesitas limpiar datos existentes
/*
TRUNCATE TABLE historial_cambios CASCADE;
TRUNCATE TABLE comite_padres CASCADE;
TRUNCATE TABLE inscripciones_anuales CASCADE;
TRUNCATE TABLE programa_semanal CASCADE;
TRUNCATE TABLE logros_scout CASCADE;
TRUNCATE TABLE asistencias CASCADE;
TRUNCATE TABLE participantes_actividad CASCADE;
TRUNCATE TABLE actividades_scout CASCADE;
TRUNCATE TABLE miembros_patrulla CASCADE;
TRUNCATE TABLE patrullas CASCADE;
TRUNCATE TABLE dirigentes CASCADE;
TRUNCATE TABLE familiares_scout CASCADE;
TRUNCATE TABLE scouts CASCADE;
*/

-- ================================================================
-- MENSAJE INICIAL
-- ================================================================
SELECT 
    '📊 INSERTANDO DATOS DE EJEMPLO' as estado,
    'Creando scouts, dirigentes, patrullas y actividades de ejemplo' as proceso,
    NOW() as inicio_proceso;

-- ================================================================
-- SCOUTS DE EJEMPLO
-- ================================================================

-- Scouts Lobatos (6-10 años)
INSERT INTO scouts (id, codigo_scout, nombres, apellidos, fecha_nacimiento, sexo, numero_documento, tipo_documento, celular, correo, direccion, distrito, rama_actual, estado, observaciones) VALUES
('11111111-1111-1111-1111-111111111111', 'SCT-0001', 'Ana María', 'García López', '2016-03-15', 'FEMENINO', '12345678', 'DNI', '987654321', 'ana.garcia@email.com', 'Av. Primavera 123, San Borja', 'San Borja', 'Lobatos', 'ACTIVO', 'Muy participativa en actividades'),
('11111111-1111-1111-1111-111111111112', 'SCT-0002', 'Carlos Eduardo', 'Mendoza Silva', '2015-08-22', 'MASCULINO', '12345679', 'DNI', '987654322', 'carlos.mendoza@email.com', 'Jr. Los Rosales 456, Surco', 'Santiago de Surco', 'Lobatos', 'ACTIVO', 'Excelente en deportes'),
('11111111-1111-1111-1111-111111111113', 'SCT-0003', 'Sofía Isabella', 'Rojas Fernández', '2016-12-05', 'FEMENINO', '12345680', 'DNI', '987654323', 'sofia.rojas@email.com', 'Calle Las Flores 789, La Molina', 'La Molina', 'Lobatos', 'ACTIVO', 'Le encanta la naturaleza'),
('11111111-1111-1111-1111-111111111114', 'SCT-0004', 'Diego Alejandro', 'Vargas Torres', '2015-06-18', 'MASCULINO', '12345681', 'DNI', '987654324', 'diego.vargas@email.com', 'Av. Universitaria 321, Los Olivos', 'Los Olivos', 'Lobatos', 'ACTIVO', 'Muy creativo y artístico');

-- Scouts de la rama Scouts (11-14 años)  
INSERT INTO scouts (id, codigo_scout, nombres, apellidos, fecha_nacimiento, sexo, numero_documento, tipo_documento, celular, correo, direccion, distrito, rama_actual, estado, observaciones) VALUES
('22222222-2222-2222-2222-222222222221', 'SCT-0005', 'Miguel Ángel', 'Castillo Herrera', '2012-04-10', 'MASCULINO', '23456789', 'DNI', '987654325', 'miguel.castillo@email.com', 'Calle San Martín 567, Miraflores', 'Miraflores', 'Scouts', 'ACTIVO', 'Líder natural'),
('22222222-2222-2222-2222-222222222222', 'SCT-0006', 'Valentina', 'Cruz Delgado', '2011-09-14', 'FEMENINO', '23456790', 'DNI', '987654326', 'valentina.cruz@email.com', 'Jr. Pizarro 890, Cercado de Lima', 'Lima', 'Scouts', 'ACTIVO', 'Excelente en primeros auxilios'),
('22222222-2222-2222-2222-222222222223', 'SCT-0007', 'Sebastián', 'Morales Jiménez', '2012-11-30', 'MASCULINO', '23456791', 'DNI', '987654327', 'sebastian.morales@email.com', 'Av. Javier Prado 234, San Isidro', 'San Isidro', 'Scouts', 'ACTIVO', 'Muy bueno en orientación'),
('22222222-2222-2222-2222-222222222224', 'SCT-0008', 'Isabella', 'Ramos Vega', '2011-07-08', 'FEMENINO', '23456792', 'DNI', '987654328', 'isabella.ramos@email.com', 'Calle Los Cedros 678, Surquillo', 'Surquillo', 'Scouts', 'ACTIVO', 'Especialista en nudos');

-- Scouts Rovers (15-21 años)
INSERT INTO scouts (id, codigo_scout, nombres, apellidos, fecha_nacimiento, sexo, numero_documento, tipo_documento, celular, correo, direccion, distrito, rama_actual, estado, observaciones) VALUES
('33333333-3333-3333-3333-333333333331', 'SCT-0009', 'Rodrigo Andrés', 'Silva Montoya', '2007-02-25', 'MASCULINO', '34567890', 'DNI', '987654329', 'rodrigo.silva@email.com', 'Av. El Sol 345, San Miguel', 'San Miguel', 'Rovers', 'ACTIVO', 'Coordinador de proyectos'),
('33333333-3333-3333-3333-333333333332', 'SCT-0010', 'Camila Andrea', 'Torres Aguirre', '2006-12-16', 'FEMENINO', '34567891', 'DNI', '987654330', 'camila.torres@email.com', 'Jr. Libertad 912, Breña', 'Breña', 'Rovers', 'ACTIVO', 'Líder en servicio comunitario'),
('33333333-3333-3333-3333-333333333333', 'SCT-0011', 'Mateo', 'Guerrero Salas', '2007-05-12', 'MASCULINO', '34567892', 'DNI', '987654331', 'mateo.guerrero@email.com', 'Calle Real 456, Jesús María', 'Jesús María', 'Rovers', 'ACTIVO', 'Especialista en campismo');

-- Dirigentes
INSERT INTO scouts (id, codigo_scout, nombres, apellidos, fecha_nacimiento, sexo, numero_documento, tipo_documento, celular, correo, direccion, distrito, rama_actual, estado, es_dirigente, observaciones) VALUES
('44444444-4444-4444-4444-444444444441', 'SCT-0012', 'Carmen Rosa', 'Pérez Maldonado', '1985-03-20', 'FEMENINO', '45678901', 'DNI', '987654332', 'carmen.perez@email.com', 'Av. Arequipa 789, Lince', 'Lince', 'Dirigentes', 'ACTIVO', true, 'Jefa de Grupo'),
('44444444-4444-4444-4444-444444444442', 'SCT-0013', 'Luis Fernando', 'Gonzales Rivera', '1980-11-08', 'MASCULINO', '45678902', 'DNI', '987654333', 'luis.gonzales@email.com', 'Calle Tacna 234, Magdalena', 'Magdalena del Mar', 'Dirigentes', 'ACTIVO', true, 'Subjefe de Grupo'),
('44444444-4444-4444-4444-444444444443', 'SCT-0014', 'María Elena', 'Vásquez Cabrera', '1992-07-15', 'FEMENINO', '45678903', 'DNI', '987654334', 'maria.vasquez@email.com', 'Jr. Cusco 567, La Victoria', 'La Victoria', 'Dirigentes', 'ACTIVO', true, 'Akela - Manada de Lobatos'),
('44444444-4444-4444-4444-444444444444', 'SCT-0015', 'Jorge Alberto', 'Mendoza Ruiz', '1988-09-30', 'MASCULINO', '45678904', 'DNI', '987654335', 'jorge.mendoza@email.com', 'Av. Venezuela 890, Cercado', 'Lima', 'Dirigentes', 'ACTIVO', true, 'Jefe de Tropa Scout');

-- ================================================================
-- FAMILIARES DE SCOUTS
-- ================================================================

-- Familiares de Ana María García López
INSERT INTO familiares_scout (id, scout_id, nombres, apellidos, parentesco, celular, correo, es_contacto_emergencia, observaciones) VALUES
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Roberto Carlos', 'García Jiménez', 'padre', '987654340', 'roberto.garcia@email.com', true, 'Ingeniero de sistemas'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Patricia María', 'López Sandoval', 'madre', '987654341', 'patricia.lopez@email.com', true, 'Profesora de primaria');

-- Familiares de Carlos Eduardo Mendoza Silva
INSERT INTO familiares_scout (id, scout_id, nombres, apellidos, parentesco, celular, correo, es_contacto_emergencia, observaciones) VALUES
(gen_random_uuid(), '11111111-1111-1111-1111-111111111112', 'Eduardo José', 'Mendoza Guerrero', 'padre', '987654342', 'eduardo.mendoza@email.com', true, 'Médico pediatra'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111112', 'Carmen Isabel', 'Silva Morales', 'madre', '987654343', 'carmen.silva@email.com', true, 'Nutricionista');

-- Familiares de Miguel Ángel Castillo (Scout)
INSERT INTO familiares_scout (id, scout_id, nombres, apellidos, parentesco, celular, correo, es_contacto_emergencia, observaciones) VALUES
(gen_random_uuid(), '22222222-2222-2222-2222-222222222221', 'Miguel Antonio', 'Castillo Vargas', 'padre', '987654344', 'miguel.castillo.sr@email.com', true, 'Arquitecto'),
(gen_random_uuid(), '22222222-2222-2222-2222-222222222221', 'Rosa Elena', 'Herrera Campos', 'madre', '987654345', 'rosa.herrera@email.com', true, 'Contadora'),
(gen_random_uuid(), '22222222-2222-2222-2222-222222222221', 'Carlos Miguel', 'Castillo Herrera', 'hermano', '987654346', 'carlos.castillo@email.com', false, 'Estudiante universitario');

-- ================================================================
-- DIRIGENTES
-- ================================================================

INSERT INTO dirigentes (id, scout_id, codigo_dirigente, cargo, nivel_formacion, fecha_ingreso_dirigente, estado_dirigente, observaciones) VALUES
(gen_random_uuid(), '44444444-4444-4444-4444-444444444441', 'DIR-0001', 'Jefa de Grupo', 'Avanzada', '2020-01-15', 'ACTIVO', 'Líder con 15 años de experiencia'),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444442', 'DIR-0002', 'Subjefe de Grupo', 'Avanzada', '2020-01-15', 'ACTIVO', 'Especialista en campismo y montañismo'),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444443', 'DIR-0003', 'Akela', 'Intermedia', '2021-03-10', 'ACTIVO', 'Responsable de la Manada de Lobatos'),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'DIR-0004', 'Jefe de Tropa', 'Avanzada', '2021-03-10', 'ACTIVO', 'Paramédico certificado');

-- ================================================================
-- PATRULLAS
-- ================================================================

INSERT INTO patrullas (id, codigo_patrulla, nombre, rama, lema, grito, colores, dirigente_responsable_id, estado, observaciones) VALUES
(gen_random_uuid(), 'PAT-0001', 'Águilas Doradas', 'Scouts', 'Siempre hacia las alturas', '¡Volamos alto como las águilas!', 'Dorado', (SELECT id FROM dirigentes WHERE codigo_dirigente = 'DIR-0004'), 'ACTIVO', 'Patrulla fundadora del grupo'),
(gen_random_uuid(), 'PAT-0002', 'Lobos Grises', 'Scouts', 'Fuerza en la unidad', '¡Unidos como la manada!', 'Gris', (SELECT id FROM dirigentes WHERE codigo_dirigente = 'DIR-0004'), 'ACTIVO', 'Especialistas en rastreo'),
(gen_random_uuid(), 'PAT-0003', 'Clan Cóndor', 'Rovers', 'Servicio y aventura', '¡Cóndores del Perú!', 'Negro', (SELECT id FROM dirigentes WHERE codigo_dirigente = 'DIR-0002'), 'ACTIVO', 'Clan de servicio comunitario');

-- ================================================================
-- MIEMBROS DE PATRULLA
-- ================================================================

-- Obtener IDs de patrullas
DO $$
DECLARE
    patrulla_aguilas UUID;
    patrulla_lobos UUID;
    patrulla_condor UUID;
BEGIN
    SELECT id INTO patrulla_aguilas FROM patrullas WHERE nombre = 'Águilas Doradas';
    SELECT id INTO patrulla_lobos FROM patrullas WHERE nombre = 'Lobos Grises';
    SELECT id INTO patrulla_condor FROM patrullas WHERE nombre = 'Clan Cóndor';
    
    -- Miembros de Águilas Doradas
    INSERT INTO miembros_patrulla (id, patrulla_id, scout_id, cargo_patrulla, fecha_ingreso, estado_miembro, observaciones) VALUES
    (gen_random_uuid(), patrulla_aguilas, '22222222-2222-2222-2222-222222222221', 'JEFE', CURRENT_DATE - INTERVAL '6 months', 'ACTIVO', 'Jefe desde la formación de la patrulla'),
    (gen_random_uuid(), patrulla_aguilas, '22222222-2222-2222-2222-222222222223', 'SUBJEFE', CURRENT_DATE - INTERVAL '6 months', 'ACTIVO', 'Subjefe con excelente liderazgo');
    
    -- Miembros de Lobos Grises
    INSERT INTO miembros_patrulla (id, patrulla_id, scout_id, cargo_patrulla, fecha_ingreso, estado_miembro, observaciones) VALUES
    (gen_random_uuid(), patrulla_lobos, '22222222-2222-2222-2222-222222222222', 'JEFE', CURRENT_DATE - INTERVAL '4 months', 'ACTIVO', 'Líder natural con gran carisma'),
    (gen_random_uuid(), patrulla_lobos, '22222222-2222-2222-2222-222222222224', 'SUBJEFE', CURRENT_DATE - INTERVAL '4 months', 'ACTIVO', 'Experta en técnicas scout');
    
    -- Miembros de Clan Cóndor
    INSERT INTO miembros_patrulla (id, patrulla_id, scout_id, cargo_patrulla, fecha_ingreso, estado_miembro, observaciones) VALUES
    (gen_random_uuid(), patrulla_condor, '33333333-3333-3333-3333-333333333331', 'COORDINADOR', CURRENT_DATE - INTERVAL '8 months', 'ACTIVO', 'Coordinador de proyectos de servicio'),
    (gen_random_uuid(), patrulla_condor, '33333333-3333-3333-3333-333333333333', 'SUBCOORDINADOR', CURRENT_DATE - INTERVAL '8 months', 'ACTIVO', 'Especialista en logística');
END $$;

-- ================================================================
-- ACTIVIDADES SCOUT
-- ================================================================

INSERT INTO actividades_scout (id, nombre, descripcion, fecha_inicio, fecha_fin, lugar, costo, cupos_disponibles, rama_objetivo, tipo_actividad, nivel_dificultad, estado, observaciones) VALUES
(gen_random_uuid(), 'Campamento de Lobatos - Aventura en la Selva', 'Campamento temático para lobatos con actividades de descubrimiento de la naturaleza', '2024-03-15 08:00:00', '2024-03-17 16:00:00', 'Centro Vacacional Huampani', 150.00, 20, 'Lobatos', 'CAMPAMENTO', 'BASICO', 'CONFIRMADA', 'Incluye todas las comidas y materiales'),

(gen_random_uuid(), 'Hike Nocturno - Luna Llena', 'Caminata nocturna con orientación y observación astronómica', '2024-03-22 19:00:00', '2024-03-23 02:00:00', 'Lomas de Lúcumo', 25.00, 15, 'Scouts', 'HIKE', 'INTERMEDIO', 'CONFIRMADA', 'Traer linterna y ropa abrigadora'),

(gen_random_uuid(), 'Proyecto Rovers - Limpieza de Playa', 'Proyecto de servicio comunitario en playas de Chorrillos', '2024-03-30 07:00:00', '2024-03-30 15:00:00', 'Playa La Herradura, Chorrillos', 0.00, 25, 'Rovers', 'SERVICIO', 'BASICO', 'EN_PROGRESO', 'Coordinado con la Municipalidad de Chorrillos'),

(gen_random_uuid(), 'Rally Scout Intercultural', 'Competencia de habilidades scout con temática peruana', '2024-04-12 09:00:00', '2024-04-12 17:00:00', 'Parque Zonal Huiracocha', 30.00, 40, 'Scouts', 'COMPETENCIA', 'INTERMEDIO', 'PLANIFICADA', 'Premio para las mejores patrullas'),

(gen_random_uuid(), 'Fogata de Promesa', 'Ceremonia especial para renovación de promesa scout', '2024-04-20 18:00:00', '2024-04-20 21:00:00', 'Local Scout Lima 12', 15.00, 50, 'Todas', 'CEREMONIA', 'BASICO', 'PLANIFICADA', 'Evento familiar, pueden asistir padres');

-- ================================================================
-- PARTICIPANTES EN ACTIVIDADES
-- ================================================================

DO $$
DECLARE
    actividad_campamento UUID;
    actividad_hike UUID;
    actividad_servicio UUID;
BEGIN
    SELECT id INTO actividad_campamento FROM actividades_scout WHERE nombre LIKE 'Campamento de Lobatos%';
    SELECT id INTO actividad_hike FROM actividades_scout WHERE nombre LIKE 'Hike Nocturno%';
    SELECT id INTO actividad_servicio FROM actividades_scout WHERE nombre LIKE 'Proyecto Rovers%';
    
    -- Participantes en Campamento de Lobatos
    INSERT INTO participantes_actividad (id, actividad_id, scout_id, fecha_inscripcion, estado_participacion, pago_realizado, observaciones) VALUES
    (gen_random_uuid(), actividad_campamento, '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '5 days', 'CONFIRMADO', true, 'Primer campamento'),
    (gen_random_uuid(), actividad_campamento, '11111111-1111-1111-1111-111111111112', CURRENT_DATE - INTERVAL '4 days', 'CONFIRMADO', true, 'Muy emocionado por la actividad'),
    (gen_random_uuid(), actividad_campamento, '11111111-1111-1111-1111-111111111113', CURRENT_DATE - INTERVAL '3 days', 'CONFIRMADO', true, 'Lleva su propia carpa'),
    (gen_random_uuid(), actividad_campamento, '11111111-1111-1111-1111-111111111114', CURRENT_DATE - INTERVAL '2 days', 'INSCRITO', false, 'Pendiente de pago');
    
    -- Participantes en Hike Nocturno
    INSERT INTO participantes_actividad (id, actividad_id, scout_id, fecha_inscripcion, estado_participacion, pago_realizado, observaciones) VALUES
    (gen_random_uuid(), actividad_hike, '22222222-2222-2222-2222-222222222221', CURRENT_DATE - INTERVAL '6 days', 'CONFIRMADO', true, 'Líder de patrulla'),
    (gen_random_uuid(), actividad_hike, '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '5 days', 'CONFIRMADO', true, 'Experta en orientación'),
    (gen_random_uuid(), actividad_hike, '22222222-2222-2222-2222-222222222223', CURRENT_DATE - INTERVAL '4 days', 'CONFIRMADO', true, 'Primera vez en hike nocturno'),
    (gen_random_uuid(), actividad_hike, '22222222-2222-2222-2222-222222222224', CURRENT_DATE - INTERVAL '3 days', 'CONFIRMADO', true, 'Lleva telescopio para observación');
    
    -- Participantes en Proyecto de Servicio
    INSERT INTO participantes_actividad (id, actividad_id, scout_id, fecha_inscripcion, estado_participacion, pago_realizado, observaciones) VALUES
    (gen_random_uuid(), actividad_servicio, '33333333-3333-3333-3333-333333333331', CURRENT_DATE - INTERVAL '7 days', 'CONFIRMADO', true, 'Coordinador del proyecto'),
    (gen_random_uuid(), actividad_servicio, '33333333-3333-3333-3333-333333333332', CURRENT_DATE - INTERVAL '6 days', 'CONFIRMADO', true, 'Responsable de logística'),
    (gen_random_uuid(), actividad_servicio, '33333333-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '5 days', 'CONFIRMADO', true, 'Fotógrafo del evento');
END $$;

-- ================================================================
-- ASISTENCIAS
-- ================================================================

-- Crear asistencias para reuniones regulares
INSERT INTO asistencias (id, scout_id, fecha, tipo_reunion, presente, justificada, observaciones) VALUES
-- Semana 1
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '14 days', 'REUNION_MANADA', true, false, 'Participó activamente'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111112', CURRENT_DATE - INTERVAL '14 days', 'REUNION_MANADA', true, false, 'Excelente comportamiento'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111113', CURRENT_DATE - INTERVAL '14 days', 'REUNION_MANADA', false, true, 'Viaje familiar'),
(gen_random_uuid(), '22222222-2222-2222-2222-222222222221', CURRENT_DATE - INTERVAL '14 days', 'REUNION_TROPA', true, false, 'Dirigió juego de patrulla'),
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '14 days', 'REUNION_TROPA', true, false, 'Enseñó nudos a nuevos'),

-- Semana 2
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '7 days', 'REUNION_MANADA', true, false, 'Completó especialidad'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111112', CURRENT_DATE - INTERVAL '7 days', 'REUNION_MANADA', true, false, 'Ayudó en orden'),
(gen_random_uuid(), '22222222-2222-2222-2222-222222222221', CURRENT_DATE - INTERVAL '7 days', 'REUNION_TROPA', true, false, 'Liderazgo sobresaliente'),
(gen_random_uuid(), '33333333-3333-3333-3333-333333333331', CURRENT_DATE - INTERVAL '7 days', 'REUNION_CLAN', true, false, 'Presentó proyecto comunitario');

-- ================================================================
-- LOGROS SCOUT
-- ================================================================

INSERT INTO logros_scout (id, scout_id, tipo_logro, nombre_logro, descripcion, fecha_otorgado, otorgado_por, observaciones) VALUES
-- Insignias de Progresión Lobatos
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'INSIGNIA_PROGRESION', 'Pata Tierna', 'Primera etapa de progresión en Manada', CURRENT_DATE - INTERVAL '3 months', '44444444-4444-4444-4444-444444444443', 'Completó todos los requisitos básicos'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111112', 'INSIGNIA_PROGRESION', 'Saltador', 'Segunda etapa de progresión en Manada', CURRENT_DATE - INTERVAL '2 months', '44444444-4444-4444-4444-444444444443', 'Excelente desarrollo personal'),

-- Especialidades Scouts
(gen_random_uuid(), '22222222-2222-2222-2222-222222222221', 'ESPECIALIDAD', 'Campista', 'Especialidad en técnicas de campismo', CURRENT_DATE - INTERVAL '1 month', '44444444-4444-4444-4444-444444444444', 'Demostró excelentes habilidades'),
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'ESPECIALIDAD', 'Primeros Auxilios', 'Especialidad en atención de emergencias', CURRENT_DATE - INTERVAL '2 weeks', '44444444-4444-4444-4444-444444444444', 'Curso certificado completado'),

-- Insignias de Actividad
(gen_random_uuid(), '22222222-2222-2222-2222-222222222223', 'INSIGNIA_ACTIVIDAD', 'Excursionista', 'Por participación en 5 excursiones', CURRENT_DATE - INTERVAL '1 week', '44444444-4444-4444-4444-444444444444', 'Siempre dispuesto a nuevas aventuras'),

-- Reconocimientos Rovers
(gen_random_uuid(), '33333333-3333-3333-3333-333333333331', 'RECONOCIMIENTO', 'Líder Comunitario', 'Por coordinar 3 proyectos de servicio', CURRENT_DATE - INTERVAL '1 month', '44444444-4444-4444-4444-444444444441', 'Impacto positivo en la comunidad');

-- ================================================================
-- PROGRAMA SEMANAL
-- ================================================================

INSERT INTO programa_semanal (id, fecha_reunion, hora_inicio, hora_fin, tema_principal, objetivos, actividades_planificadas, materiales_necesarios, rama, responsable_id, estado, observaciones) VALUES
-- Próxima reunión Lobatos
(gen_random_uuid(), CURRENT_DATE + INTERVAL '2 days', '15:00:00', '17:00:00', 'Los Animales del Bosque', 'Conocer la fauna local y desarrollar amor por la naturaleza', 'Juego de reconocimiento de animales, Canto "Los Animales", Manualidad: Máscaras de animales', 'Cartulinas, plumones, tijeras, pegamento, plantillas de animales', 'Lobatos', '44444444-4444-4444-4444-444444444443', 'PUBLICADO', 'Reunión especial con invitado biólogo'),

-- Próxima reunión Scouts
(gen_random_uuid(), CURRENT_DATE + INTERVAL '3 days', '14:00:00', '17:00:00', 'Orientación y Cartografía', 'Desarrollar habilidades de orientación usando brújula y mapa', 'Explicación teórica orientación, Práctica con brújula, Carrera de orientación en el parque', 'Brújulas, mapas topográficos, banderas de control, cronómetros', 'Scouts', '44444444-4444-4444-4444-444444444444', 'PUBLICADO', 'Preparación para próximo campamento'),

-- Próxima reunión Rovers  
(gen_random_uuid(), CURRENT_DATE + INTERVAL '4 days', '16:00:00', '19:00:00', 'Planificación Proyecto de Servicio', 'Definir proyecto comunitario del trimestre', 'Lluvia de ideas proyectos, Análisis de viabilidad, Formación de comisiones de trabajo', 'Papelógrafos, marcadores, laptop, proyector', 'Rovers', '44444444-4444-4444-4444-444444444442', 'BORRADOR', 'Pendiente confirmación lugar'),

-- Programa anterior (ejemplo histórico)
(gen_random_uuid(), CURRENT_DATE - INTERVAL '7 days', '15:00:00', '17:00:00', 'Nudos y Amarres', 'Reforzar conocimientos de cabuyería básica', 'Repaso nudos básicos, Competencia de velocidad, Construcción con amarres', 'Cuerdas de diferentes grosores, cronómetro, premios', 'Scouts', '44444444-4444-4444-4444-444444444444', 'EJECUTADO', 'Actividad muy exitosa');

-- ================================================================
-- INSCRIPCIONES ANUALES
-- ================================================================

INSERT INTO inscripciones_anuales (id, scout_id, año_inscripcion, fecha_inscripcion, monto_pagado, fecha_pago, estado_inscripcion, observaciones) VALUES
-- Inscripciones 2024
('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 2024, '2024-02-15', 200.00, '2024-02-15', 'VIGENTE', 'Inscripción completa'),
('aaaa1111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111112', 2024, '2024-02-20', 200.00, '2024-02-20', 'VIGENTE', 'Pago al contado'),
('aaaa1111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111113', 2024, '2024-02-25', 200.00, '2024-02-25', 'VIGENTE', 'Primera inscripción'),
('aaaa1111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111114', 2024, '2024-03-01', 200.00, '2024-03-01', 'VIGENTE', 'Inscripción con descuento hermano'),

('bbbb2222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222221', 2024, '2024-02-10', 250.00, '2024-02-10', 'VIGENTE', 'Inscripción con especialidades'),
('bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 2024, '2024-02-12', 250.00, '2024-02-12', 'VIGENTE', 'Renovación anual'),
('bbbb2222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222223', 2024, '2024-02-18', 250.00, '2024-02-18', 'VIGENTE', 'Pago en cuotas'),
('bbbb2222-2222-2222-2222-222222222224', '22222222-2222-2222-2222-222222222224', 2024, '2024-02-22', 250.00, '2024-02-22', 'VIGENTE', 'Transferencia bancaria'),

('cccc3333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333331', 2024, '2024-02-05', 150.00, '2024-02-05', 'VIGENTE', 'Tarifa Rover'),
('cccc3333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333332', 2024, '2024-02-08', 150.00, '2024-02-08', 'VIGENTE', 'Inscripción universitaria'),
('cccc3333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 2024, '2024-02-14', 150.00, '2024-02-14', 'VIGENTE', 'Pago efectivo');

-- ================================================================
-- COMITÉ DE PADRES
-- ================================================================

INSERT INTO comite_padres (id, familiar_id, cargo, fecha_nombramiento, fecha_fin_periodo, estado, observaciones) VALUES
-- Obtener IDs de familiares para el comité
(gen_random_uuid(), (SELECT id FROM familiares_scout WHERE nombres = 'Roberto Carlos' AND apellidos = 'García Jiménez'), 'PRESIDENTE', '2024-01-15', '2024-12-31', 'ACTIVO', 'Elegido por unanimidad'),
(gen_random_uuid(), (SELECT id FROM familiares_scout WHERE nombres = 'Eduardo José' AND apellidos = 'Mendoza Guerrero'), 'VICEPRESIDENTE', '2024-01-15', '2024-12-31', 'ACTIVO', 'Gran experiencia organizacional'),
(gen_random_uuid(), (SELECT id FROM familiares_scout WHERE nombres = 'Patricia María' AND apellidos = 'López Sandoval'), 'SECRETARIO', '2024-01-15', '2024-12-31', 'ACTIVO', 'Excelente organización'),
(gen_random_uuid(), (SELECT id FROM familiares_scout WHERE nombres = 'Carmen Isabel' AND apellidos = 'Silva Morales'), 'TESORERO', '2024-01-15', '2024-12-31', 'ACTIVO', 'Contadora profesional'),
(gen_random_uuid(), (SELECT id FROM familiares_scout WHERE nombres = 'Miguel Antonio' AND apellidos = 'Castillo Vargas'), 'VOCAL', '2024-01-15', '2024-12-31', 'ACTIVO', 'Apoyo en actividades especiales');

-- ================================================================
-- VERIFICACIÓN DE DATOS INSERTADOS
-- ================================================================

-- Contar registros insertados
SELECT 
    '📊 RESUMEN DE DATOS INSERTADOS' as titulo,
    (SELECT COUNT(*) FROM scouts) as total_scouts,
    (SELECT COUNT(*) FROM familiares_scout) as total_familiares,
    (SELECT COUNT(*) FROM dirigentes) as total_dirigentes,
    (SELECT COUNT(*) FROM patrullas) as total_patrullas,
    (SELECT COUNT(*) FROM miembros_patrulla) as total_miembros_patrulla,
    (SELECT COUNT(*) FROM actividades_scout) as total_actividades,
    (SELECT COUNT(*) FROM participantes_actividad) as total_participantes,
    (SELECT COUNT(*) FROM asistencias) as total_asistencias,
    (SELECT COUNT(*) FROM logros_scout) as total_logros,
    (SELECT COUNT(*) FROM programa_semanal) as total_programas,
    (SELECT COUNT(*) FROM inscripciones_anuales) as total_inscripciones,
    (SELECT COUNT(*) FROM comite_padres) as total_comite_miembros;

-- Mostrar distribución por rama
SELECT 
    '👥 DISTRIBUCIÓN POR RAMA' as titulo,
    rama,
    COUNT(*) as cantidad_scouts,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM scouts WHERE estado = 'ACTIVO'), 1) as porcentaje
FROM scouts 
WHERE estado = 'ACTIVO'
GROUP BY rama
ORDER BY 
    CASE rama
        WHEN 'Lobatos' THEN 1
        WHEN 'Scouts' THEN 2  
        WHEN 'Rovers' THEN 3
        WHEN 'Dirigentes' THEN 4
    END;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '✅ DATOS DE EJEMPLO INSERTADOS EXITOSAMENTE' as estado,
    'Sistema listo para pruebas y desarrollo' as mensaje,
    'Usar estos datos para validar funcionalidades' as instrucciones,
    NOW() as timestamp_completado;