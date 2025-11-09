-- Script para deshabilitar RLS temporalmente
-- Ejecutar en Supabase SQL Editor para permitir acceso público

-- DESHABILITAR RLS temporalmente para desarrollo
ALTER TABLE inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario DISABLE ROW LEVEL SECURITY;

-- Verificar que los datos están ahí
SELECT COUNT(*) as total_items FROM inventario;
SELECT nombre, categoria, estado FROM inventario LIMIT 5;

-- NOTA: Esto es solo para desarrollo
-- En producción debes configurar políticas RLS apropiadas