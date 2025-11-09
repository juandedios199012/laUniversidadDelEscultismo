-- ================================================================
-- 🔒 SEGURIDAD Y POLÍTICAS RLS - SISTEMA SCOUT LIMA 12
-- ================================================================
-- Archivo: 03_security.sql
-- Propósito: Configurar Row Level Security y políticas de acceso
-- Orden de ejecución: 4° (Después de functions)
-- ================================================================

-- ================================================================
-- CONFIGURACIÓN INICIAL DE SEGURIDAD
-- ================================================================

-- Deshabilitar RLS temporalmente para configuración inicial
-- (Para desarrollo/instalación inicial)
ALTER TABLE scouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE familiares_scout DISABLE ROW LEVEL SECURITY;
ALTER TABLE dirigentes DISABLE ROW LEVEL SECURITY;
ALTER TABLE patrullas DISABLE ROW LEVEL SECURITY;
ALTER TABLE miembros_patrulla DISABLE ROW LEVEL SECURITY;
ALTER TABLE actividades_scout DISABLE ROW LEVEL SECURITY;
ALTER TABLE participantes_actividad DISABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE logros_scout DISABLE ROW LEVEL SECURITY;
ALTER TABLE programa_semanal DISABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones_anuales DISABLE ROW LEVEL SECURITY;
ALTER TABLE comite_padres DISABLE ROW LEVEL SECURITY;
ALTER TABLE historial_cambios DISABLE ROW LEVEL SECURITY;

-- ================================================================
-- POLÍTICAS RLS PARA PRODUCCIÓN (COMENTADAS)
-- ================================================================
-- Descomenta las siguientes secciones cuando el sistema esté listo para producción
-- y se implemente autenticación de usuarios

/*
-- ================================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ================================================================

ALTER TABLE scouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE familiares_scout ENABLE ROW LEVEL SECURITY;
ALTER TABLE dirigentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrullas ENABLE ROW LEVEL SECURITY;
ALTER TABLE miembros_patrulla ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades_scout ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes_actividad ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE logros_scout ENABLE ROW LEVEL SECURITY;
ALTER TABLE programa_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones_anuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE comite_padres ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_cambios ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- FUNCIONES DE SEGURIDAD
-- ================================================================

-- Función para verificar si el usuario es dirigente
CREATE OR REPLACE FUNCTION es_dirigente_activo(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM dirigentes d
        JOIN scouts s ON d.scout_id = s.id
        WHERE s.id = user_id 
        AND d.estado_dirigente = 'ACTIVO'
        AND s.estado = 'ACTIVO'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es jefe de grupo
CREATE OR REPLACE FUNCTION es_jefe_grupo(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM dirigentes d
        JOIN scouts s ON d.scout_id = s.id
        WHERE s.id = user_id 
        AND d.cargo ILIKE '%jefe%grupo%'
        AND d.estado_dirigente = 'ACTIVO'
        AND s.estado = 'ACTIVO'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el ID del scout actual
CREATE OR REPLACE FUNCTION obtener_scout_id_actual()
RETURNS UUID AS $$
BEGIN
    -- En producción, esto debería obtener el ID del usuario autenticado
    -- Por ahora retorna NULL para permitir acceso completo
    RETURN auth.uid()::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- POLÍTICAS PARA TABLA SCOUTS
-- ================================================================

-- Los dirigentes pueden ver todos los scouts
CREATE POLICY "dirigentes_pueden_ver_scouts" ON scouts
    FOR SELECT TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- Los scouts pueden ver su propia información
CREATE POLICY "scouts_pueden_ver_propio_perfil" ON scouts
    FOR SELECT TO authenticated
    USING (id = obtener_scout_id_actual());

-- Solo dirigentes pueden crear scouts
CREATE POLICY "dirigentes_pueden_crear_scouts" ON scouts
    FOR INSERT TO authenticated
    WITH CHECK (es_dirigente_activo(obtener_scout_id_actual()));

-- Solo dirigentes pueden actualizar scouts
CREATE POLICY "dirigentes_pueden_actualizar_scouts" ON scouts
    FOR UPDATE TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- Solo jefe de grupo puede eliminar scouts
CREATE POLICY "jefe_grupo_puede_eliminar_scouts" ON scouts
    FOR DELETE TO authenticated
    USING (es_jefe_grupo(obtener_scout_id_actual()));

-- ================================================================
-- POLÍTICAS PARA TABLA FAMILIARES_SCOUT
-- ================================================================

-- Los dirigentes pueden ver todos los familiares
CREATE POLICY "dirigentes_pueden_ver_familiares" ON familiares_scout
    FOR SELECT TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- Los scouts pueden ver información de sus familiares
CREATE POLICY "scouts_pueden_ver_sus_familiares" ON familiares_scout
    FOR SELECT TO authenticated
    USING (scout_id = obtener_scout_id_actual());

-- Solo dirigentes pueden gestionar familiares
CREATE POLICY "dirigentes_pueden_gestionar_familiares" ON familiares_scout
    FOR ALL TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- ================================================================
-- POLÍTICAS PARA TABLA DIRIGENTES
-- ================================================================

-- Todos los dirigentes pueden ver información de otros dirigentes
CREATE POLICY "dirigentes_pueden_ver_dirigentes" ON dirigentes
    FOR SELECT TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- Solo jefe de grupo puede crear/modificar dirigentes
CREATE POLICY "jefe_grupo_gestiona_dirigentes" ON dirigentes
    FOR ALL TO authenticated
    USING (es_jefe_grupo(obtener_scout_id_actual()));

-- ================================================================
-- POLÍTICAS PARA TABLA PATRULLAS
-- ================================================================

-- Todos pueden ver patrullas activas
CREATE POLICY "todos_pueden_ver_patrullas" ON patrullas
    FOR SELECT TO authenticated
    USING (estado = 'ACTIVO');

-- Solo dirigentes pueden gestionar patrullas
CREATE POLICY "dirigentes_pueden_gestionar_patrullas" ON patrullas
    FOR ALL TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- ================================================================
-- POLÍTICAS PARA TABLA MIEMBROS_PATRULLA
-- ================================================================

-- Todos pueden ver membresías activas
CREATE POLICY "todos_pueden_ver_miembros_patrulla" ON miembros_patrulla
    FOR SELECT TO authenticated
    USING (estado_miembro = 'ACTIVO');

-- Solo dirigentes pueden gestionar membresías
CREATE POLICY "dirigentes_pueden_gestionar_miembros" ON miembros_patrulla
    FOR ALL TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- ================================================================
-- POLÍTICAS PARA TABLA ACTIVIDADES_SCOUT
-- ================================================================

-- Todos pueden ver actividades confirmadas y en progreso
CREATE POLICY "todos_pueden_ver_actividades_publicas" ON actividades_scout
    FOR SELECT TO authenticated
    USING (estado IN ('CONFIRMADA', 'EN_PROGRESO', 'FINALIZADA'));

-- Dirigentes pueden ver todas las actividades
CREATE POLICY "dirigentes_pueden_ver_todas_actividades" ON actividades_scout
    FOR SELECT TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- Solo dirigentes pueden gestionar actividades
CREATE POLICY "dirigentes_pueden_gestionar_actividades" ON actividades_scout
    FOR ALL TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- ================================================================
-- POLÍTICAS PARA TABLA PARTICIPANTES_ACTIVIDAD
-- ================================================================

-- Los scouts pueden ver sus propias participaciones
CREATE POLICY "scouts_pueden_ver_sus_participaciones" ON participantes_actividad
    FOR SELECT TO authenticated
    USING (scout_id = obtener_scout_id_actual());

-- Dirigentes pueden ver todas las participaciones
CREATE POLICY "dirigentes_pueden_ver_participaciones" ON participantes_actividad
    FOR SELECT TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- Los scouts pueden inscribirse en actividades
CREATE POLICY "scouts_pueden_inscribirse" ON participantes_actividad
    FOR INSERT TO authenticated
    WITH CHECK (scout_id = obtener_scout_id_actual());

-- Solo dirigentes pueden modificar participaciones
CREATE POLICY "dirigentes_pueden_modificar_participaciones" ON participantes_actividad
    FOR UPDATE TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- ================================================================
-- POLÍTICAS PARA TABLA ASISTENCIAS
-- ================================================================

-- Los scouts pueden ver su propia asistencia
CREATE POLICY "scouts_pueden_ver_su_asistencia" ON asistencias
    FOR SELECT TO authenticated
    USING (scout_id = obtener_scout_id_actual());

-- Dirigentes pueden ver y registrar todas las asistencias
CREATE POLICY "dirigentes_pueden_gestionar_asistencias" ON asistencias
    FOR ALL TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- ================================================================
-- POLÍTICAS PARA TABLA LOGROS_SCOUT
-- ================================================================

-- Los scouts pueden ver sus propios logros
CREATE POLICY "scouts_pueden_ver_sus_logros" ON logros_scout
    FOR SELECT TO authenticated
    USING (scout_id = obtener_scout_id_actual());

-- Dirigentes pueden ver todos los logros
CREATE POLICY "dirigentes_pueden_ver_logros" ON logros_scout
    FOR SELECT TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- Solo dirigentes pueden otorgar logros
CREATE POLICY "dirigentes_pueden_otorgar_logros" ON logros_scout
    FOR INSERT TO authenticated
    WITH CHECK (es_dirigente_activo(obtener_scout_id_actual()));

-- Solo dirigentes pueden modificar logros
CREATE POLICY "dirigentes_pueden_modificar_logros" ON logros_scout
    FOR UPDATE TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- ================================================================
-- POLÍTICAS PARA TABLA PROGRAMA_SEMANAL
-- ================================================================

-- Todos pueden ver programas publicados
CREATE POLICY "todos_pueden_ver_programas_publicados" ON programa_semanal
    FOR SELECT TO authenticated
    USING (estado = 'PUBLICADO');

-- Dirigentes pueden ver todos los programas
CREATE POLICY "dirigentes_pueden_ver_todos_programas" ON programa_semanal
    FOR SELECT TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- Solo dirigentes pueden gestionar programas
CREATE POLICY "dirigentes_pueden_gestionar_programas" ON programa_semanal
    FOR ALL TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- ================================================================
-- POLÍTICAS PARA TABLA INSCRIPCIONES_ANUALES
-- ================================================================

-- Los scouts pueden ver sus propias inscripciones
CREATE POLICY "scouts_pueden_ver_sus_inscripciones" ON inscripciones_anuales
    FOR SELECT TO authenticated
    USING (scout_id = obtener_scout_id_actual());

-- Dirigentes pueden ver todas las inscripciones
CREATE POLICY "dirigentes_pueden_ver_inscripciones" ON inscripciones_anuales
    FOR SELECT TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- Solo dirigentes pueden gestionar inscripciones
CREATE POLICY "dirigentes_pueden_gestionar_inscripciones" ON inscripciones_anuales
    FOR ALL TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- ================================================================
-- POLÍTICAS PARA TABLA COMITE_PADRES
-- ================================================================

-- Todos pueden ver el comité activo
CREATE POLICY "todos_pueden_ver_comite_activo" ON comite_padres
    FOR SELECT TO authenticated
    USING (estado = 'ACTIVO');

-- Solo dirigentes pueden gestionar el comité
CREATE POLICY "dirigentes_pueden_gestionar_comite" ON comite_padres
    FOR ALL TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- ================================================================
-- POLÍTICAS PARA TABLA HISTORIAL_CAMBIOS
-- ================================================================

-- Solo dirigentes pueden ver el historial
CREATE POLICY "dirigentes_pueden_ver_historial" ON historial_cambios
    FOR SELECT TO authenticated
    USING (es_dirigente_activo(obtener_scout_id_actual()));

-- Solo jefe de grupo puede eliminar historial
CREATE POLICY "jefe_grupo_puede_eliminar_historial" ON historial_cambios
    FOR DELETE TO authenticated
    USING (es_jefe_grupo(obtener_scout_id_actual()));

*/

-- ================================================================
-- CONFIGURACIÓN DE PERMISOS PARA ROLES
-- ================================================================

-- Para desarrollo: permitir acceso completo a usuarios autenticados
DO $$
BEGIN
    -- Crear rol para dirigentes si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dirigentes_scout') THEN
        CREATE ROLE dirigentes_scout;
    END IF;
    
    -- Crear rol para scouts si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'scouts_miembros') THEN
        CREATE ROLE scouts_miembros;
    END IF;
    
    -- Crear rol para padres si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'padres_familia') THEN
        CREATE ROLE padres_familia;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignorar errores de permisos en entornos administrados como Supabase
        NULL;
END $$;

-- ================================================================
-- FUNCIONES DE AUDITORÍA
-- ================================================================

-- Función para registrar cambios automáticamente
CREATE OR REPLACE FUNCTION trigger_auditoría()
RETURNS TRIGGER AS $$
DECLARE
    campos_modificados TEXT[];
    valores_anteriores JSONB;
    valores_nuevos JSONB;
BEGIN
    -- Solo auditar UPDATE y DELETE
    IF TG_OP = 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    -- Preparar datos para auditoría
    IF TG_OP = 'UPDATE' THEN
        -- Identificar campos modificados
        campos_modificados := ARRAY[]::TEXT[];
        valores_anteriores := to_jsonb(OLD);
        valores_nuevos := to_jsonb(NEW);
        
        -- Aquí podrías agregar lógica para identificar campos específicos modificados
        
    ELSIF TG_OP = 'DELETE' THEN
        valores_anteriores := to_jsonb(OLD);
        valores_nuevos := NULL;
    END IF;
    
    -- Insertar en historial (solo si la tabla existe)
    BEGIN
        INSERT INTO historial_cambios (
            tabla_afectada,
            registro_id,
            tipo_cambio,
            campos_modificados,
            valores_anteriores,
            valores_nuevos,
            modificado_por_id
        ) VALUES (
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            TG_OP,
            campos_modificados,
            valores_anteriores,
            valores_nuevos,
            NULL -- En producción, obtener del contexto de usuario
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- No fallar si hay problemas con auditoría
            NULL;
    END;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de auditoría a tablas principales
-- (Comentado para evitar overhead en desarrollo)
/*
CREATE TRIGGER trigger_auditoría_scouts
    AFTER UPDATE OR DELETE ON scouts
    FOR EACH ROW EXECUTE FUNCTION trigger_auditoría();

CREATE TRIGGER trigger_auditoría_dirigentes
    AFTER UPDATE OR DELETE ON dirigentes
    FOR EACH ROW EXECUTE FUNCTION trigger_auditoría();

CREATE TRIGGER trigger_auditoría_patrullas
    AFTER UPDATE OR DELETE ON patrullas
    FOR EACH ROW EXECUTE FUNCTION trigger_auditoría();
*/

-- ================================================================
-- FUNCIONES DE VALIDACIÓN DE SEGURIDAD
-- ================================================================

-- Verificar configuración de seguridad
CREATE OR REPLACE FUNCTION verificar_configuracion_seguridad()
RETURNS TABLE(
    tabla VARCHAR(50),
    rls_habilitado BOOLEAN,
    politicas_activas BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::VARCHAR(50),
        c.relrowsecurity as rls_habilitado,
        COUNT(p.polname)::BIGINT as politicas_activas
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    LEFT JOIN pg_policy p ON p.polrelid = c.oid
    WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    GROUP BY t.tablename, c.relrowsecurity
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- CONFIGURACIÓN PARA DESARROLLO
-- ================================================================

-- Función para habilitar modo desarrollo (sin RLS)
CREATE OR REPLACE FUNCTION habilitar_modo_desarrollo()
RETURNS TEXT AS $$
DECLARE
    tabla RECORD;
    contador INTEGER := 0;
BEGIN
    FOR tabla IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
    ) LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tabla.tablename);
        contador := contador + 1;
    END LOOP;
    
    RETURN 'Modo desarrollo habilitado. RLS deshabilitado en ' || contador || ' tablas.';
END;
$$ LANGUAGE plpgsql;

-- Función para habilitar modo producción (con RLS)
CREATE OR REPLACE FUNCTION habilitar_modo_producción()
RETURNS TEXT AS $$
DECLARE
    tabla RECORD;
    contador INTEGER := 0;
BEGIN
    FOR tabla IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
    ) LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tabla.tablename);
        contador := contador + 1;
    END LOOP;
    
    RETURN 'Modo producción habilitado. RLS habilitado en ' || contador || ' tablas.';
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- CONFIGURACIÓN INICIAL
-- ================================================================

-- Ejecutar configuración inicial para desarrollo
SELECT habilitar_modo_desarrollo() as configuracion_inicial;

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 
    '🔒 SEGURIDAD CONFIGURADA' as estado,
    'Sistema configurado para desarrollo (RLS deshabilitado)' as mensaje,
    'Para producción, ejecutar: SELECT habilitar_modo_producción()' as instrucciones,
    NOW() as timestamp_configuracion;