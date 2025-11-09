-- ============================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA DATABASE FUNCTIONS
-- ============================================
-- Este archivo soluciona el problema de Row Level Security
-- para permitir que las Database Functions funcionen correctamente

-- Opción 1: Deshabilitar RLS temporalmente (MÁS SIMPLE)
-- ============================================
ALTER TABLE scouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE familiares_scout DISABLE ROW LEVEL SECURITY;
ALTER TABLE dirigentes DISABLE ROW LEVEL SECURITY;
ALTER TABLE patrullas DISABLE ROW LEVEL SECURITY;
ALTER TABLE actividades_scout DISABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE logros_scout DISABLE ROW LEVEL SECURITY;
ALTER TABLE programa_semanal DISABLE ROW LEVEL SECURITY;
ALTER TABLE libro_oro DISABLE ROW LEVEL SECURITY;
ALTER TABLE comite_padres DISABLE ROW LEVEL SECURITY;
ALTER TABLE participantes_actividad DISABLE ROW LEVEL SECURITY;
ALTER TABLE miembros_patrulla DISABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones_anuales DISABLE ROW LEVEL SECURITY;
ALTER TABLE historial_ramas DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Permitir acceso completo" ON scouts;
DROP POLICY IF EXISTS "Permitir acceso completo" ON familiares_scout;
DROP POLICY IF EXISTS "Permitir acceso completo" ON dirigentes;
DROP POLICY IF EXISTS "Permitir acceso completo" ON patrullas;
DROP POLICY IF EXISTS "Permitir acceso completo" ON actividades_scout;
DROP POLICY IF EXISTS "Permitir acceso completo" ON asistencias;
DROP POLICY IF EXISTS "Permitir acceso completo" ON logros_scout;
DROP POLICY IF EXISTS "Permitir acceso completo" ON programa_semanal;
DROP POLICY IF EXISTS "Permitir acceso completo" ON libro_oro;
DROP POLICY IF EXISTS "Permitir acceso completo" ON comite_padres;
DROP POLICY IF EXISTS "Permitir acceso completo" ON participantes_actividad;
DROP POLICY IF EXISTS "Permitir acceso completo" ON miembros_patrulla;
DROP POLICY IF EXISTS "Permitir acceso completo" ON inscripciones_anuales;
DROP POLICY IF EXISTS "Permitir acceso completo" ON historial_ramas;

-- Verificar que RLS esté deshabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'scouts', 'familiares_scout', 'dirigentes', 'patrullas',
    'actividades_scout', 'asistencias', 'logros_scout',
    'programa_semanal', 'libro_oro', 'comite_padres'
);

-- ============================================
-- Opción 2: Políticas compatibles con Functions (MÁS SEGURO)
-- ============================================
-- Si prefieres mantener RLS, descomenta las siguientes líneas:

/*
-- Habilitar RLS nuevamente
ALTER TABLE scouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE familiares_scout ENABLE ROW LEVEL SECURITY;

-- Crear políticas que funcionen con Database Functions
-- Estas políticas permiten acceso completo sin restricciones de autenticación

-- Para scouts
CREATE POLICY "scouts_all_access" ON scouts FOR ALL 
USING (true) 
WITH CHECK (true);

-- Para familiares_scout  
CREATE POLICY "familiares_all_access" ON familiares_scout FOR ALL 
USING (true) 
WITH CHECK (true);

-- Para dirigentes
CREATE POLICY "dirigentes_all_access" ON dirigentes FOR ALL 
USING (true) 
WITH CHECK (true);

-- Y así sucesivamente para todas las tablas...
*/

-- ============================================
-- PRUEBA DE INSERCIÓN
-- ============================================
-- Esta función prueba si las políticas funcionan correctamente
CREATE OR REPLACE FUNCTION test_insert_scout()
RETURNS TEXT AS $$
DECLARE
    test_result TEXT;
    new_scout_id UUID;
BEGIN
    -- Intentar insertar un scout de prueba
    BEGIN
        INSERT INTO scouts (
            nombres, apellidos, fecha_nacimiento, numero_documento, codigo_scout
        ) VALUES (
            'Test', 'Prueba', '2010-01-01', 'TEST123', 'TEST-001'
        ) RETURNING id INTO new_scout_id;
        
        -- Si llegamos aquí, la inserción fue exitosa
        test_result := 'SUCCESS: Scout insertado con ID ' || new_scout_id::TEXT;
        
        -- Limpiar: eliminar el scout de prueba
        DELETE FROM scouts WHERE id = new_scout_id;
        
    EXCEPTION WHEN OTHERS THEN
        test_result := 'ERROR: ' || SQLERRM;
    END;
    
    RETURN test_result;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la prueba
SELECT test_insert_scout() as resultado_prueba;

-- ============================================
-- MENSAJE FINAL
-- ============================================
SELECT 
    'Políticas RLS actualizadas. ' ||
    'Tablas sin RLS: ' ||
    (SELECT COUNT(*) FROM pg_tables p 
     JOIN pg_class c ON c.relname = p.tablename 
     WHERE p.schemaname = 'public' 
     AND c.relrowsecurity = false
     AND p.tablename LIKE '%scout%' OR p.tablename IN ('patrullas', 'dirigentes', 'asistencias')
    )::TEXT ||
    ' de 14 tablas principales.' as status_final;