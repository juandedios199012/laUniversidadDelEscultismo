-- ================================================================
-- 📊 QUERIES DE VERIFICACIÓN - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Usa estas queries para verificar que los datos se persisten correctamente
-- en cada módulo del sistema Scout

-- ================================================================
-- 👤 MÓDULO: REGISTRO SCOUT
-- ================================================================
-- Tablas que se llenan al registrar un scout nuevo

-- 1️⃣ SCOUTS (tabla principal)
SELECT 
    id,
    codigo_scout,
    nombres,
    apellidos,
    fecha_nacimiento,
    EXTRACT(YEAR FROM age(fecha_nacimiento)) as edad_calculada,
    numero_documento,
    tipo_documento,
    celular,
    correo,
    rama_actual,
    estado,
    fecha_ingreso,
    created_at
FROM scouts 
ORDER BY created_at DESC;

-- 2️⃣ FAMILIARES_SCOUT (se crea automáticamente con el scout)
SELECT 
    fs.id,
    fs.scout_id,
    s.nombres || ' ' || s.apellidos as scout_nombre,
    fs.nombres || ' ' || fs.apellidos as familiar_nombre,
    fs.parentesco,
    fs.celular,
    fs.correo,
    fs.ocupacion,
    fs.es_contacto_emergencia,
    fs.created_at
FROM familiares_scout fs
JOIN scouts s ON fs.scout_id = s.id
ORDER BY fs.created_at DESC;

-- 3️⃣ VERIFICAR RELACIÓN SCOUT-FAMILIAR
SELECT 
    s.codigo_scout,
    s.nombres as scout_nombres,
    s.apellidos as scout_apellidos,
    COUNT(fs.id) as familiares_registrados,
    STRING_AGG(fs.nombres || ' (' || fs.parentesco || ')', ', ') as familiares_detalle
FROM scouts s
LEFT JOIN familiares_scout fs ON s.id = fs.scout_id
GROUP BY s.id, s.codigo_scout, s.nombres, s.apellidos
ORDER BY s.created_at DESC;

-- ================================================================
-- 🏕️ MÓDULO: PATRULLAS
-- ================================================================

-- 4️⃣ PATRULLAS (tabla principal)
SELECT 
    id,
    nombre,
    rama,
    lema,
    grito,
    colores,
    totem,
    estado,
    COALESCE(fecha_fundacion, created_at::date) as fecha_fundacion,
    created_at
FROM patrullas 
ORDER BY rama, nombre;

-- 5️⃣ MIEMBROS_PATRULLA (relación scouts-patrullas)
SELECT 
    mp.id,
    p.nombre as patrulla_nombre,
    s.codigo_scout,
    s.nombres || ' ' || s.apellidos as scout_nombre,
    mp.cargo_patrulla,
    mp.fecha_ingreso,
    mp.estado_miembro,
    mp.created_at
FROM miembros_patrulla mp
JOIN patrullas p ON mp.patrulla_id = p.id
JOIN scouts s ON mp.scout_id = s.id
ORDER BY p.nombre, mp.fecha_ingreso DESC;

-- 6️⃣ ESTADÍSTICAS POR PATRULLA
SELECT 
    p.nombre as patrulla,
    p.rama,
    COUNT(mp.scout_id) as total_miembros,
    COUNT(CASE WHEN mp.estado_miembro = 'activo' THEN 1 END) as miembros_activos,
    COUNT(CASE WHEN mp.cargo_patrulla = 'Guía' THEN 1 END) as guias,
    COUNT(CASE WHEN mp.cargo_patrulla = 'Subguía' THEN 1 END) as subguias
FROM patrullas p
LEFT JOIN miembros_patrulla mp ON p.id = mp.patrulla_id
GROUP BY p.id, p.nombre, p.rama
ORDER BY p.rama, total_miembros DESC;

-- ================================================================
-- 👨‍🏫 MÓDULO: DIRIGENTES
-- ================================================================

-- 7️⃣ DIRIGENTES (tabla principal)
SELECT 
    d.id,
    d.scout_id,
    s.codigo_scout,
    s.nombres || ' ' || s.apellidos as dirigente_nombre,
    d.codigo_dirigente,
    d.rama_responsable,
    d.cargo,
    d.nivel_formacion,
    d.fecha_ingreso_dirigente,
    d.insignia_madera,
    d.estado_dirigente,
    d.created_at
FROM dirigentes d
JOIN scouts s ON d.scout_id = s.id
ORDER BY d.rama_responsable, d.fecha_ingreso_dirigente DESC;

-- 8️⃣ DIRIGENTES CON INFORMACIÓN COMPLETA
SELECT 
    s.codigo_scout,
    s.nombres || ' ' || s.apellidos as nombre_completo,
    s.celular,
    s.correo,
    d.codigo_dirigente,
    d.rama_responsable,
    d.cargo,
    d.nivel_formacion,
    CASE WHEN d.insignia_madera THEN 'Sí' ELSE 'No' END as tiene_insignia_madera,
    d.estado_dirigente
FROM scouts s
JOIN dirigentes d ON s.id = d.scout_id
WHERE d.estado_dirigente = 'activo'
ORDER BY d.rama_responsable, s.apellidos;

-- ================================================================
-- 📅 MÓDULO: ACTIVIDADES SCOUT
-- ================================================================

-- 9️⃣ ACTIVIDADES_SCOUT (tabla principal)
SELECT 
    id,
    nombre,
    descripcion,
    tipo_actividad,
    fecha_inicio,
    fecha_fin,
    lugar,
    rama_objetivo,
    dirigente_responsable,
    costo,
    maximo_participantes,
    estado,
    created_at
FROM actividades_scout 
ORDER BY fecha_inicio DESC;

-- 🔟 PARTICIPACIONES_ACTIVIDAD (inscripciones)
SELECT 
    pa.id,
    a.nombre as actividad,
    s.codigo_scout,
    s.nombres || ' ' || s.apellidos as scout_nombre,
    pa.fecha_inscripcion,
    pa.estado_inscripcion,
    pa.pago_realizado,
    pa.monto_pagado,
    pa.observaciones
FROM participaciones_actividad pa
JOIN actividades_scout a ON pa.actividad_id = a.id
JOIN scouts s ON pa.scout_id = s.id
ORDER BY a.fecha_inicio DESC, pa.fecha_inscripcion DESC;

-- 1️⃣1️⃣ ESTADÍSTICAS DE ACTIVIDADES
SELECT 
    a.nombre as actividad,
    a.fecha_inicio,
    a.maximo_participantes,
    COUNT(pa.scout_id) as inscritos,
    COUNT(CASE WHEN pa.estado_inscripcion = 'confirmada' THEN 1 END) as confirmados,
    COUNT(CASE WHEN pa.pago_realizado THEN 1 END) as pagos_realizados,
    SUM(pa.monto_pagado) as total_recaudado
FROM actividades_scout a
LEFT JOIN participaciones_actividad pa ON a.id = pa.actividad_id
GROUP BY a.id, a.nombre, a.fecha_inicio, a.maximo_participantes
ORDER BY a.fecha_inicio DESC;

-- ================================================================
-- 📋 MÓDULO: ASISTENCIAS
-- ================================================================

-- 1️⃣2️⃣ ASISTENCIAS (tabla principal)
SELECT 
    a.id,
    s.codigo_scout,
    s.nombres || ' ' || s.apellidos as scout_nombre,
    a.fecha,
    a.estado_asistencia,
    a.tipo_evento,
    a.hora_llegada,
    a.registrado_por,
    a.observaciones,
    a.created_at
FROM asistencias a
JOIN scouts s ON a.scout_id = s.id
ORDER BY a.fecha DESC, a.hora_llegada;

-- 1️⃣3️⃣ ESTADÍSTICAS DE ASISTENCIA POR SCOUT
SELECT 
    s.codigo_scout,
    s.nombres || ' ' || s.apellidos as scout_nombre,
    s.rama_actual,
    COUNT(a.id) as total_registros,
    COUNT(CASE WHEN a.estado_asistencia = 'presente' THEN 1 END) as presentes,
    COUNT(CASE WHEN a.estado_asistencia = 'tardanza' THEN 1 END) as tardanzas,
    COUNT(CASE WHEN a.estado_asistencia = 'ausente' THEN 1 END) as ausencias,
    ROUND(
        (COUNT(CASE WHEN a.estado_asistencia = 'presente' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0)), 
        2
    ) as porcentaje_asistencia
FROM scouts s
LEFT JOIN asistencias a ON s.id = a.scout_id
WHERE s.estado = 'activo'
GROUP BY s.id, s.codigo_scout, s.nombres, s.apellidos, s.rama_actual
ORDER BY porcentaje_asistencia DESC;

-- ================================================================
-- 🏆 MÓDULO: LIBRO DE ORO (LOGROS)
-- ================================================================

-- 1️⃣4️⃣ LOGROS_SCOUT (tabla principal)
SELECT 
    l.id,
    s.codigo_scout,
    s.nombres || ' ' || s.apellidos as scout_nombre,
    l.tipo_logro,
    l.nombre_logro,
    l.descripcion,
    l.fecha_obtencion,
    l.nivel_dificultad,
    l.puntos_otorgados,
    l.dirigente_evaluador,
    l.estado_logro,
    l.created_at
FROM logros_scout l
JOIN scouts s ON l.scout_id = s.id
ORDER BY l.fecha_obtencion DESC;

-- 1️⃣5️⃣ ESTADÍSTICAS DE LOGROS POR SCOUT
SELECT 
    s.codigo_scout,
    s.nombres || ' ' || s.apellidos as scout_nombre,
    s.rama_actual,
    COUNT(l.id) as total_logros,
    COUNT(CASE WHEN l.tipo_logro = 'Insignia' THEN 1 END) as insignias,
    COUNT(CASE WHEN l.tipo_logro = 'Especialidad' THEN 1 END) as especialidades,
    COUNT(CASE WHEN l.tipo_logro = 'Progresión' THEN 1 END) as progresiones,
    SUM(l.puntos_otorgados) as puntos_totales
FROM scouts s
LEFT JOIN logros_scout l ON s.id = l.scout_id AND l.estado_logro = 'otorgado'
WHERE s.estado = 'activo'
GROUP BY s.id, s.codigo_scout, s.nombres, s.apellidos, s.rama_actual
ORDER BY puntos_totales DESC;

-- ================================================================
-- 📅 MÓDULO: PROGRAMA SEMANAL
-- ================================================================

-- 1️⃣6️⃣ PROGRAMA_SEMANAL (tabla principal)
SELECT 
    id,
    semana_inicio,
    semana_fin,
    rama_objetivo,
    tema_semanal,
    objetivo_educativo,
    dirigente_responsable,
    estado_programa,
    created_at
FROM programa_semanal 
ORDER BY semana_inicio DESC;

-- 1️⃣7️⃣ ACTIVIDADES_PROGRAMA (actividades de cada programa)
SELECT 
    ap.id,
    ps.tema_semanal,
    ps.rama_objetivo,
    ap.dia_semana,
    ap.hora_inicio,
    ap.hora_fin,
    ap.nombre_actividad,
    ap.descripcion_actividad,
    ap.tipo_actividad,
    ap.materiales_necesarios,
    ap.responsable_actividad
FROM actividades_programa ap
JOIN programa_semanal ps ON ap.programa_id = ps.id
ORDER BY ps.semana_inicio DESC, ap.dia_semana, ap.hora_inicio;

-- 1️⃣8️⃣ PROGRAMA COMPLETO CON ACTIVIDADES
SELECT 
    ps.tema_semanal,
    ps.semana_inicio,
    ps.semana_fin,
    ps.rama_objetivo,
    COUNT(ap.id) as total_actividades,
    STRING_AGG(
        ap.dia_semana || ': ' || ap.nombre_actividad || ' (' || ap.hora_inicio || ')', 
        E'\n' ORDER BY ap.dia_semana, ap.hora_inicio
    ) as cronograma_actividades
FROM programa_semanal ps
LEFT JOIN actividades_programa ap ON ps.id = ap.programa_id
GROUP BY ps.id, ps.tema_semanal, ps.semana_inicio, ps.semana_fin, ps.rama_objetivo
ORDER BY ps.semana_inicio DESC;

-- ================================================================
-- 👥 MÓDULO: COMITÉ DE PADRES
-- ================================================================

-- 1️⃣9️⃣ COMITE_PADRES (tabla principal)
SELECT 
    cp.id,
    fs.nombres || ' ' || fs.apellidos as padre_nombre,
    s.codigo_scout,
    s.nombres || ' ' || s.apellidos as scout_hijo,
    cp.cargo_comite,
    cp.fecha_inicio_cargo,
    cp.fecha_fin_cargo,
    cp.estado_miembro,
    cp.telefono_contacto,
    cp.email_contacto,
    cp.created_at
FROM comite_padres cp
JOIN familiares_scout fs ON cp.familiar_id = fs.id
JOIN scouts s ON fs.scout_id = s.id
ORDER BY cp.fecha_inicio_cargo DESC;

-- 2️⃣0️⃣ COMITÉ ACTIVO CON INFORMACIÓN COMPLETA
SELECT 
    fs.nombres || ' ' || fs.apellidos as nombre_completo,
    cp.cargo_comite,
    cp.telefono_contacto,
    cp.email_contacto,
    fs.ocupacion,
    s.nombres || ' ' || s.apellidos as hijo_scout,
    s.rama_actual as rama_hijo,
    cp.fecha_inicio_cargo
FROM comite_padres cp
JOIN familiares_scout fs ON cp.familiar_id = fs.id
JOIN scouts s ON fs.scout_id = s.id
WHERE cp.estado_miembro = 'activo'
ORDER BY cp.cargo_comite, fs.apellidos;

-- ================================================================
-- 📦 MÓDULO: INVENTARIO
-- ================================================================

-- 2️⃣1️⃣ INVENTARIO (tabla principal)
SELECT 
    id,
    COALESCE(codigo_item, 'SIN-CODIGO') as codigo_item,
    nombre,
    categoria,
    descripcion,
    cantidad,
    cantidad_minima,
    estado,
    ubicacion,
    costo,
    proveedor,
    COALESCE(fecha_adquisicion, created_at::date) as fecha_adquisicion,
    created_at
FROM inventario 
ORDER BY categoria, nombre;

-- 2️⃣2️⃣ MOVIMIENTOS_INVENTARIO (entradas y salidas)
SELECT 
    mi.id,
    i.codigo_item,
    i.nombre as item_nombre,
    mi.tipo_movimiento,
    mi.cantidad_movimiento,
    mi.motivo,
    mi.responsable,
    mi.fecha_movimiento,
    mi.observaciones,
    mi.created_at
FROM movimientos_inventario mi
JOIN inventario i ON mi.inventario_id = i.id
ORDER BY mi.fecha_movimiento DESC;

-- 2️⃣3️⃣ ESTADO ACTUAL DEL INVENTARIO
SELECT 
    i.categoria,
    i.codigo_item,
    i.nombre,
    i.cantidad as stock_actual,
    i.cantidad_minima,
    CASE 
        WHEN i.cantidad <= i.cantidad_minima THEN 'CRÍTICO'
        WHEN i.cantidad <= (i.cantidad_minima * 1.5) THEN 'BAJO'
        ELSE 'OK'
    END as estado_stock,
    i.ubicacion,
    i.estado
FROM inventario i
ORDER BY 
    CASE 
        WHEN i.cantidad <= i.cantidad_minima THEN 1
        WHEN i.cantidad <= (i.cantidad_minima * 1.5) THEN 2
        ELSE 3
    END,
    i.categoria, i.nombre;

-- ================================================================
-- 💰 MÓDULO: PRESUPUESTOS
-- ================================================================

-- 2️⃣4️⃣ PRESUPUESTOS (tabla principal)
SELECT 
    id,
    nombre_presupuesto,
    descripcion,
    año_fiscal,
    mes_inicio,
    mes_fin,
    monto_total_planificado,
    estado_presupuesto,
    responsable,
    COALESCE(fecha_creacion, created_at::date) as fecha_creacion,
    created_at
FROM presupuestos 
ORDER BY año_fiscal DESC, mes_inicio;

-- 2️⃣5️⃣ ITEMS_PRESUPUESTO (desglose de gastos)
SELECT 
    ip.id,
    p.nombre_presupuesto,
    ip.categoria_gasto,
    ip.subcategoria,
    ip.descripcion_item,
    ip.monto_planificado,
    ip.monto_ejecutado,
    ip.fecha_planificada,
    ip.proveedor_sugerido,
    ROUND(
        CASE 
            WHEN ip.monto_planificado > 0 
            THEN (ip.monto_ejecutado * 100.0 / ip.monto_planificado)
            ELSE 0 
        END, 2
    ) as porcentaje_ejecutado
FROM items_presupuesto ip
JOIN presupuestos p ON ip.presupuesto_id = p.id
ORDER BY p.año_fiscal DESC, ip.categoria_gasto, ip.fecha_planificada;

-- 2️⃣6️⃣ RESUMEN PRESUPUESTARIO
SELECT 
    p.nombre_presupuesto,
    p.año_fiscal,
    p.monto_total_planificado,
    SUM(ip.monto_planificado) as suma_items_planificado,
    SUM(ip.monto_ejecutado) as total_ejecutado,
    ROUND(
        (SUM(ip.monto_ejecutado) * 100.0 / p.monto_total_planificado), 2
    ) as porcentaje_ejecutado_global
FROM presupuestos p
LEFT JOIN items_presupuesto ip ON p.id = ip.presupuesto_id
GROUP BY p.id, p.nombre_presupuesto, p.año_fiscal, p.monto_total_planificado
ORDER BY p.año_fiscal DESC;

-- ================================================================
-- 📊 QUERIES DE ESTADÍSTICAS GENERALES
-- ================================================================

-- 2️⃣7️⃣ RESUMEN GENERAL DEL SISTEMA
SELECT 
    'Scouts Activos' as concepto,
    COUNT(*) as cantidad
FROM scouts WHERE estado = 'activo'
UNION ALL
SELECT 
    'Dirigentes Activos' as concepto,
    COUNT(*) as cantidad
FROM dirigentes WHERE estado_dirigente = 'activo'
UNION ALL
SELECT 
    'Patrullas Activas' as concepto,
    COUNT(*) as cantidad
FROM patrullas WHERE estado = 'activa'
UNION ALL
SELECT 
    'Actividades Este Año' as concepto,
    COUNT(*) as cantidad
FROM actividades_scout WHERE EXTRACT(YEAR FROM fecha_inicio) = EXTRACT(YEAR FROM CURRENT_DATE)
UNION ALL
SELECT 
    'Logros Otorgados Este Año' as concepto,
    COUNT(*) as cantidad
FROM logros_scout WHERE EXTRACT(YEAR FROM fecha_obtencion) = EXTRACT(YEAR FROM CURRENT_DATE)
UNION ALL
SELECT 
    'Items en Inventario' as concepto,
    COUNT(*) as cantidad
FROM inventario WHERE estado = 'disponible';

-- 2️⃣8️⃣ SCOUTS POR RAMA
SELECT 
    rama_actual,
    COUNT(*) as cantidad_scouts,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM scouts WHERE estado = 'activo')), 2) as porcentaje
FROM scouts 
WHERE estado = 'activo'
GROUP BY rama_actual
ORDER BY cantidad_scouts DESC;

-- ================================================================
-- 🔍 QUERIES DE VERIFICACIÓN DE INTEGRIDAD
-- ================================================================

-- 2️⃣9️⃣ SCOUTS SIN FAMILIARES
SELECT 
    s.codigo_scout,
    s.nombres || ' ' || s.apellidos as scout_nombre,
    s.rama_actual,
    s.fecha_ingreso
FROM scouts s
LEFT JOIN familiares_scout fs ON s.id = fs.scout_id
WHERE fs.id IS NULL AND s.estado = 'activo';

-- 3️⃣0️⃣ DIRIGENTES SIN INFORMACIÓN COMPLETA
SELECT 
    s.codigo_scout,
    s.nombres || ' ' || s.apellidos as dirigente_nombre,
    d.codigo_dirigente,
    CASE WHEN s.celular IS NULL OR s.celular = '' THEN 'Sin teléfono' END as falta_telefono,
    CASE WHEN s.correo IS NULL OR s.correo = '' THEN 'Sin email' END as falta_email,
    CASE WHEN d.nivel_formacion IS NULL THEN 'Sin nivel formación' END as falta_formacion
FROM scouts s
JOIN dirigentes d ON s.id = d.scout_id
WHERE d.estado_dirigente = 'activo'
AND (s.celular IS NULL OR s.celular = '' OR s.correo IS NULL OR s.correo = '' OR d.nivel_formacion IS NULL);

-- ================================================================
-- 📝 INSTRUCCIONES DE USO
-- ================================================================
/*
CÓMO USAR ESTAS QUERIES:

1. 📋 VERIFICACIÓN BÁSICA:
   - Ejecuta las queries 1-3 después de registrar un scout
   - Verifica que aparezcan en scouts y familiares_scout

2. 🏕️ VERIFICACIÓN POR MÓDULO:
   - Cada módulo tiene sus queries numeradas
   - Ejecuta las queries correspondientes después de usar cada módulo

3. 📊 ESTADÍSTICAS:
   - Las queries 27-28 te dan un resumen general
   - Úsalas para verificar el estado global del sistema

4. 🔍 INTEGRIDAD:
   - Las queries 29-30 detectan problemas de datos
   - Ejecútalas periódicamente para mantener calidad

5. 🎯 ORDEN RECOMENDADO:
   - Query 27 (resumen general) primero
   - Luego las queries del módulo que acabas de probar
   - Finalmente queries de integridad si hay dudas

¡Estas queries te permitirán verificar que toda la funcionalidad 
del sistema Scout está funcionando correctamente! 🚀
*/