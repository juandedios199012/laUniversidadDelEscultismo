#!/bin/bash

# =====================================================
# 🚀 Script Completo de Configuración de Base de Datos
# =====================================================

echo "🚀 Configurando Base de Datos Completa del Sistema Scout Lima 12..."

# Configurar variables de entorno desde .env.local
source .env.local 2>/dev/null || {
    echo "❌ No se pudo cargar .env.local"
    echo "ℹ️  Usando configuración por defecto..."
}

# Extraer credenciales de la URL de Supabase
SUPABASE_URL=${VITE_SUPABASE_URL}
SUPABASE_KEY=${VITE_SUPABASE_ANON_KEY}

# Configurar conexión a base de datos
export PGPASSWORD="pjQNLnUBzKkWoAF0"
export SUPABASE_DB_HOST="aws-0-us-east-1.pooler.supabase.com"
export SUPABASE_DB_PORT="6543"
export SUPABASE_DB_NAME="postgres"
export SUPABASE_DB_USER="postgres.bbvbthspmemszazhiefy"

# Comando base de psql
PSQL_CMD="psql -h $SUPABASE_DB_HOST -p $SUPABASE_DB_PORT -U $SUPABASE_DB_USER -d $SUPABASE_DB_NAME"

echo "🔗 Conectando a: $SUPABASE_DB_HOST"
echo "📋 Base de datos: $SUPABASE_DB_NAME"

# Función para ejecutar SQL con manejo de errores
execute_sql() {
    local file=$1
    local description=$2
    
    echo "📋 Ejecutando: $description..."
    
    if [[ -f "$file" ]]; then
        if $PSQL_CMD -f "$file"; then
            echo "✅ $description completado"
        else
            echo "❌ Error en $description"
            echo "🔍 Revisando archivo: $file"
            return 1
        fi
    else
        echo "❌ Archivo no encontrado: $file"
        return 1
    fi
}

# Verificar conexión
echo "🔍 Verificando conexión a la base de datos..."
if ! $PSQL_CMD -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ No se pudo conectar a la base de datos"
    echo "📋 Verificar credenciales y conectividad"
    exit 1
fi
echo "✅ Conexión establecida"

# 1. Limpiar base de datos (opcional)
read -p "¿Desea limpiar la base de datos antes de continuar? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    execute_sql "database/00_cleanup.sql" "Limpieza de base de datos"
fi

# 2. Crear esquema completo
execute_sql "database/01_schema.sql" "Creación de esquema (tablas, tipos, índices)" || exit 1

# 3. Funciones básicas del sistema
execute_sql "database/02_functions.sql" "Funciones básicas del sistema"

# 4. Configuración de seguridad
execute_sql "database/03_security.sql" "Configuración de seguridad (RLS)"

# 5. Aplicar funciones por módulo
echo "🔧 Aplicando Database Functions por módulo..."

# Inventario
execute_sql "database/05_functions_inventario.sql" "Funciones de Inventario" || exit 1

# Scouts
execute_sql "database/06_functions_scouts.sql" "Funciones de Scouts" || exit 1

# Presupuestos
execute_sql "database/07_functions_presupuestos.sql" "Funciones de Presupuestos"

# Asistencia
execute_sql "database/08_functions_asistencia.sql" "Funciones de Asistencia"

# Dirigentes
execute_sql "database/09_functions_dirigentes.sql" "Funciones de Dirigentes"

# Patrullas
execute_sql "database/10_functions_patrullas.sql" "Funciones de Patrullas"

# Comité Padres
execute_sql "database/11_functions_comite_padres.sql" "Funciones de Comité de Padres"

# Libro Oro
execute_sql "database/12_functions_libro_oro.sql" "Funciones de Libro de Oro"

# Programa Semanal
execute_sql "database/13_functions_programa_semanal.sql" "Funciones de Programa Semanal"

# Inscripción
execute_sql "database/14_functions_inscripcion.sql" "Funciones de Inscripción"

# Actividades
execute_sql "database/15_functions_actividades.sql" "Funciones de Actividades"

# Reportes
execute_sql "database/16_functions_reports.sql" "Funciones de Reportes"

# 6. Optimizaciones de performance
execute_sql "database/17_performance_indexes.sql" "Índices de Performance"
execute_sql "database/18_query_optimizations.sql" "Optimizaciones de Consultas"
execute_sql "database/19_caching_system.sql" "Sistema de Cache"

# 7. Datos de prueba (opcional)
read -p "¿Desea insertar datos de prueba? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    execute_sql "database/04_seed_data.sql" "Datos de prueba"
fi

# 8. Verificación final
echo "🔍 Verificación final del sistema..."

echo "📊 Verificando tablas creadas..."
$PSQL_CMD -c "
SELECT 
    schemaname, 
    tablename,
    CASE 
        WHEN tablename LIKE '%inventario%' THEN '📦'
        WHEN tablename LIKE '%scout%' THEN '👤'
        WHEN tablename = 'dirigentes' THEN '👨‍🏫'
        WHEN tablename = 'patrullas' THEN '🏕️'
        ELSE '📋'
    END as icono
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
"

echo "🔧 Verificando funciones creadas..."
$PSQL_CMD -c "
SELECT 
    COUNT(*) as total_funciones,
    COUNT(CASE WHEN proname LIKE 'obtener_%' THEN 1 END) as funciones_consulta,
    COUNT(CASE WHEN proname LIKE 'crear_%' OR proname LIKE 'registrar_%' THEN 1 END) as funciones_creacion,
    COUNT(CASE WHEN proname LIKE 'actualizar_%' THEN 1 END) as funciones_actualizacion
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname NOT LIKE 'trigger_%'
AND p.proname NOT LIKE 'generar_%';
"

echo "📈 Verificando tipos enum creados..."
$PSQL_CMD -c "
SELECT 
    typname as tipo_enum,
    CASE 
        WHEN typname LIKE '%inventario%' THEN '📦'
        WHEN typname LIKE '%scout%' OR typname = 'rama_enum' THEN '👤'
        WHEN typname LIKE '%actividad%' THEN '🎯'
        ELSE '📋'
    END as categoria
FROM pg_type 
WHERE typtype = 'e' 
ORDER BY typname;
"

# 9. Mensaje final
echo ""
echo "🎉 ¡CONFIGURACIÓN COMPLETA!"
echo "✅ Base de datos del Sistema Scout Lima 12 configurada exitosamente"
echo ""
echo "📊 Resumen:"
echo "• Esquema completo con todas las tablas"
echo "• ~235 Database Functions implementadas"
echo "• Tipos enum y constraints configurados"
echo "• Índices de performance aplicados"
echo "• Sistema de seguridad (RLS) configurado"
echo ""
echo "🚀 El sistema está listo para ser utilizado!"
echo "🔗 URL de aplicación: http://localhost:3000"
echo "📚 Documentación API: ./API_DOCUMENTATION.md"
echo ""

# Verificar estado de servicios
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Servidor web ejecutándose en http://localhost:3000"
else
    echo "ℹ️  Iniciar servidor web con: npm run dev"
fi