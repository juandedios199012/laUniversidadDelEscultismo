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
    ON inventario(categoria, estado_item);

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
    ON inventario(valor_unitario, cantidad_disponible) 
    WHERE estado_item = 'DISPONIBLE';

-- ============= 📝 ÍNDICES PARA MOVIMIENTOS DE INVENTARIO =============

-- Historial por item (consulta muy frecuente)
CREATE INDEX IF NOT EXISTS idx_movimientos_item_fecha 
    ON movimientos_inventario(item_id, created_at DESC);

-- Movimientos recientes por tipo
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo_fecha 
    ON movimientos_inventario(tipo_movimiento, created_at DESC);

-- Índice para consultas por scout que realizó movimiento
CREATE INDEX IF NOT EXISTS idx_movimientos_scout 
    ON movimientos_inventario(scout_id, created_at DESC) 
    WHERE scout_id IS NOT NULL;

-- ============= ✅ ÍNDICES PARA ASISTENCIAS =============

-- Asistencias por scout y rango de fechas
CREATE INDEX IF NOT EXISTS idx_asistencias_scout_fecha 
    ON asistencias(scout_id, fecha DESC);

-- Asistencias por actividad (para estadísticas de actividad)
CREATE INDEX IF NOT EXISTS idx_asistencias_actividad_estado 
    ON asistencias(actividad_id, estado_asistencia) 
    WHERE actividad_id IS NOT NULL;

-- Rango de fechas para reportes
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha_estado 
