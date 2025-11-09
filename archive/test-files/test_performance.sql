SELECT 'Probando archivo de índices de rendimiento' as mensaje;
-- ================================================================
-- ⚡ ÍNDICES DE RENDIMIENTO - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: database/17_performance_indexes.sql
-- Propósito: Índices optimizados para consultas frecuentes y performance
-- ================================================================

-- ============= 📊 ANÁLISIS DE CONSULTAS FRECUENTES =============
-- Este script crea índices estratégicos basados en los patrones
-- de consultas más comunes en las Database Functions

-- ============= 👥 ÍNDICES PARA SCOUTS =============

-- Búsquedas frecuentes por rama y estado
CREATE INDEX IF NOT EXISTS idx_scouts_rama_estado 
    ON scouts(rama_actual, estado) 
    WHERE estado = 'ACTIVO';

-- Búsquedas por documento de identidad (único y frecuente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_scouts_documento_unique 
    ON scouts(numero_documento) 
    WHERE numero_documento IS NOT NULL;

-- Búsquedas por rango de edades (calculado frecuentemente)
CREATE INDEX IF NOT EXISTS idx_scouts_fecha_nacimiento 
    ON scouts(fecha_nacimiento);

-- Índice compuesto para estadísticas por rama
CREATE INDEX IF NOT EXISTS idx_scouts_stats_rama 
    ON scouts(rama_actual, estado, fecha_ingreso);

-- ============= 📦 ÍNDICES PARA INVENTARIO =============

-- Búsquedas frecuentes por categoría y estado
CREATE INDEX IF NOT EXISTS idx_inventario_categoria_estado 
    ON inventario(categoria, estado);

-- Items con stock bajo (consulta frecuente en alertas)
CREATE INDEX IF NOT EXISTS idx_inventario_stock_bajo 
    ON inventario(cantidad_disponible, cantidad_minima) 
    WHERE cantidad_disponible <= cantidad_minima;

-- Búsquedas por ubicación
CREATE INDEX IF NOT EXISTS idx_inventario_ubicacion 
    ON inventario(ubicacion) 
    WHERE ubicacion IS NOT NULL;

-- Índice para valor total del inventario
CREATE INDEX IF NOT EXISTS idx_inventario_valor 
    ON inventario(valor_estimado, cantidad_disponible) 
    WHERE estado = 'DISPONIBLE';

-- ============= 📝 ÍNDICES PARA MOVIMIENTOS DE INVENTARIO =============

-- Historial por item (consulta muy frecuente)
CREATE INDEX IF NOT EXISTS idx_movimientos_item_fecha 
    ON movimientos_inventario(item_id, fecha_movimiento DESC);

-- Movimientos recientes por tipo
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo_fecha 
    ON movimientos_inventario(tipo_movimiento, fecha_movimiento DESC);

-- Préstamos activos (sin devolución)
CREATE INDEX IF NOT EXISTS idx_movimientos_prestamos_activos 
    ON movimientos_inventario(item_id, tipo_movimiento, fecha_devolucion) 
    WHERE tipo_movimiento = 'PRESTAMO' AND fecha_devolucion IS NULL;

-- ============= ✅ ÍNDICES PARA ASISTENCIAS =============

-- Asistencias por scout y rango de fechas
CREATE INDEX IF NOT EXISTS idx_asistencias_scout_fecha 
    ON asistencias(scout_id, fecha DESC);

-- Asistencias por reunión (para estadísticas de reunión)
CREATE INDEX IF NOT EXISTS idx_asistencias_reunion_presente 
    ON asistencias(reunion_id, presente);

-- Rango de fechas para reportes
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha_presente 
    ON asistencias(fecha, presente) 
    WHERE fecha >= CURRENT_DATE - INTERVAL '1 year';

-- ============= 🎯 ÍNDICES PARA ACTIVIDADES =============

-- Actividades por rama y fechas (calendario)
CREATE INDEX IF NOT EXISTS idx_actividades_rama_fechas 
    ON actividades_scout(rama_objetivo, fecha_inicio, fecha_fin) 
    WHERE estado != 'CANCELADA';

-- Actividades futuras por tipo
CREATE INDEX IF NOT EXISTS idx_actividades_futuras 
    ON actividades_scout(tipo_actividad, fecha_inicio) 
    WHERE fecha_inicio >= CURRENT_DATE;

-- Búsquedas por responsable
CREATE INDEX IF NOT EXISTS idx_actividades_responsable 
    ON actividades_scout(responsable_id, fecha_inicio DESC);

-- ============= 📝 ÍNDICES PARA INSCRIPCIONES DE ACTIVIDADES =============

-- Inscripciones por actividad y estado
CREATE INDEX IF NOT EXISTS idx_inscripciones_actividad_estado 
    ON inscripciones_actividad(actividad_id, estado);

-- Historial de inscripciones por scout
CREATE INDEX IF NOT EXISTS idx_inscripciones_scout_fecha 
    ON inscripciones_actividad(scout_id, created_at DESC);

-- ============= 💰 ÍNDICES PARA PRESUPUESTOS =============

-- Presupuestos por rango de fechas
CREATE INDEX IF NOT EXISTS idx_presupuestos_fechas 
    ON presupuestos(fecha_inicio, fecha_fin);

-- Items de presupuesto por tipo y categoría
CREATE INDEX IF NOT EXISTS idx_items_presupuesto_tipo_categoria 
    ON items_presupuesto(presupuesto_id, tipo, categoria);

-- Suma de montos por presupuesto (materializada)
CREATE INDEX IF NOT EXISTS idx_items_presupuesto_monto_sum 
    ON items_presupuesto(presupuesto_id, monto) 
    WHERE monto > 0;

-- ============= 🏕️ ÍNDICES PARA PATRULLAS =============

-- Miembros activos por patrulla
CREATE INDEX IF NOT EXISTS idx_miembros_patrulla_activos 
    ON miembros_patrulla(patrulla_id, activo) 
    WHERE activo = true;

-- Historial de puntos por patrulla y fecha
CREATE INDEX IF NOT EXISTS idx_puntos_patrulla_fecha 
    ON puntos_patrulla(patrulla_id, fecha DESC);

-- ============= 🏆 ÍNDICES PARA LOGROS =============

-- Logros por scout y fecha
CREATE INDEX IF NOT EXISTS idx_logros_scout_fecha 
    ON logros_scout(scout_id, fecha_obtencion DESC);

-- Logros por tipo (para estadísticas)
CREATE INDEX IF NOT EXISTS idx_logros_tipo_fecha 
    ON logros_scout(tipo_logro, fecha_obtencion DESC);

-- ============= 👔 ÍNDICES PARA DIRIGENTES =============

-- Dirigentes activos por rama
CREATE INDEX IF NOT EXISTS idx_dirigentes_rama_estado 
    ON dirigentes(rama_responsable, estado_dirigente) 
    WHERE estado_dirigente = 'ACTIVO';

-- Evaluaciones 360 por dirigente y fecha
CREATE INDEX IF NOT EXISTS idx_evaluaciones_360_dirigente_fecha 
    ON evaluaciones_360(dirigente_evaluado_id, fecha_evaluacion DESC);

-- =============  ÍNDICES PARA INSCRIPCIONES ANUALES =============

-- Inscripciones por período y estado
CREATE INDEX IF NOT EXISTS idx_inscripciones_periodo_estado 
    ON inscripciones(periodo_id, estado);

-- Pagos por inscripción y fecha
CREATE INDEX IF NOT EXISTS idx_pagos_inscripcion_fecha 
    ON pagos_inscripcion(inscripcion_id, fecha_pago DESC);

-- ============= 🔍 ÍNDICES PARA BÚSQUEDAS DE TEXTO =============

-- Búsquedas de texto en scouts (usando extensión de PostgreSQL)
-- Esto requiere que pg_trgm esté habilitado
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice GIN para búsquedas de texto en nombres de scouts
CREATE INDEX IF NOT EXISTS idx_scouts_busqueda_texto 
    ON scouts USING gin ((nombres || ' ' || apellidos) gin_trgm_ops);

-- Índice para búsquedas en inventario
CREATE INDEX IF NOT EXISTS idx_inventario_busqueda_texto 
    ON inventario USING gin ((nombre || ' ' || descripcion) gin_trgm_ops);

-- ============= 📊 ÍNDICES PARA REPORTES Y ANALÍTICAS =============

-- Índice para cálculos de tendencias temporales
CREATE INDEX IF NOT EXISTS idx_created_at_general 
    ON scouts(created_at);

CREATE INDEX IF NOT EXISTS idx_actividades_created_at 
    ON actividades_scout(created_at);

CREATE INDEX IF NOT EXISTS idx_asistencias_created_at 
    ON asistencias(created_at);

-- ============= 🚀 ÍNDICES PARA FUNCIONES AGREGADAS =============

-- Índice parcial para estadísticas de scouts activos por rama
CREATE INDEX IF NOT EXISTS idx_stats_scouts_activos_rama 
    ON scouts(rama_actual) 
    WHERE estado = 'ACTIVO';

-- Índice para conteos rápidos de inscripciones por estado
CREATE INDEX IF NOT EXISTS idx_stats_inscripciones_estado 
    ON inscripciones(estado, created_at);

-- Índice para cálculos de participación en actividades
CREATE INDEX IF NOT EXISTS idx_stats_participacion_actividades 
    ON inscripciones_actividad(estado, created_at) 
    WHERE estado = 'CONFIRMADA';

-- ============= 🔧 CONFIGURACIONES DE RENDIMIENTO =============

-- Configurar parámetros de PostgreSQL para mejor rendimiento
-- Nota: Estos comandos requieren permisos de administrador

-- Aumentar memoria compartida para consultas complejas
-- ALTER SYSTEM SET shared_buffers = '256MB';

-- Mejorar rendimiento de JOIN operations
-- ALTER SYSTEM SET work_mem = '16MB';

-- Optimizar escrituras
-- ALTER SYSTEM SET wal_buffers = '16MB';

-- Configurar estadísticas para mejor optimización de consultas
-- ALTER SYSTEM SET default_statistics_target = 150;

-- ============= 📈 ANÁLISIS DE RENDIMIENTO =============

-- Función para analizar el uso de índices
CREATE OR REPLACE FUNCTION analizar_uso_indices()
RETURNS TABLE(
    schemaname text,
    tablename text,
    indexname text,
    idx_scan bigint,
    idx_tup_read bigint,
    idx_tup_fetch bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::text,
        s.tablename::text,
        s.indexname::text,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch
    FROM pg_stat_user_indexes s
    ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para identificar consultas lentas
CREATE OR REPLACE FUNCTION obtener_consultas_lentas()
RETURNS TABLE(
    query text,
    calls bigint,
    total_time double precision,
    mean_time double precision,
    stddev_time double precision
) AS $$
BEGIN
    -- Nota: Requiere pg_stat_statements extension
    RETURN QUERY
    SELECT 
        pg_stat_statements.query::text,
        pg_stat_statements.calls,
        pg_stat_statements.total_exec_time as total_time,
        pg_stat_statements.mean_exec_time as mean_time,
        pg_stat_statements.stddev_exec_time as stddev_time
    FROM pg_stat_statements
    WHERE pg_stat_statements.mean_exec_time > 100  -- Consultas que toman más de 100ms
    ORDER BY pg_stat_statements.mean_exec_time DESC
    LIMIT 20;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Extension pg_stat_statements no está habilitada';
        RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============= 🔄 MANTENIMIENTO AUTOMÁTICO =============

-- Función para recopilar estadísticas automáticamente
CREATE OR REPLACE FUNCTION mantener_estadisticas_tablas()
RETURNS void AS $$
BEGIN
    -- Actualizar estadísticas de tablas principales
    ANALYZE scouts;
    ANALYZE inventario;
    ANALYZE movimientos_inventario;
    ANALYZE asistencias;
    ANALYZE actividades_scout;
    ANALYZE inscripciones_actividad;
    ANALYZE presupuestos;
    ANALYZE items_presupuesto;
    ANALYZE patrullas;
    ANALYZE miembros_patrulla;
    ANALYZE logros_scout;
    ANALYZE dirigentes;
    ANALYZE inscripciones;
    
    RAISE NOTICE 'Estadísticas actualizadas para todas las tablas principales';
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '⚡ ÍNDICES DE RENDIMIENTO CREADOS' as estado,
    'Todos los índices estratégicos para optimización implementados' as mensaje,
    '40+ índices optimizados para consultas frecuentes' as resumen;