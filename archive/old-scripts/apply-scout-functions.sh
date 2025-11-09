#!/bin/bash

# =====================================================
# 🚀 Script de Aplicación de Database Functions
# =====================================================

echo "🚀 Aplicando Database Functions al proyecto Scout Lima 12..."

# Configurar variables de entorno
export PGPASSWORD="pjQNLnUBzKkWoAF0"
export SUPABASE_DB_HOST="aws-0-us-east-1.pooler.supabase.com"
export SUPABASE_DB_PORT="6543"
export SUPABASE_DB_NAME="postgres"
export SUPABASE_DB_USER="postgres.bbvbthspmemszazhiefy"

# Comando base de psql
PSQL_CMD="psql -h $SUPABASE_DB_HOST -p $SUPABASE_DB_PORT -U $SUPABASE_DB_USER -d $SUPABASE_DB_NAME"

echo "📊 Aplicando Database Functions para Scouts..."

# Aplicar funciones de scouts
$PSQL_CMD -f database/06_functions_scouts.sql

echo "✅ Database Functions aplicadas correctamente!"
echo "🔗 Conectando a: $SUPABASE_DB_HOST"
echo "📋 Base de datos: $SUPABASE_DB_NAME"

# Verificar que las funciones se hayan creado
echo "🔍 Verificando funciones creadas..."
$PSQL_CMD -c "
SELECT 
    schemaname, 
    functionname, 
    definition 
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN pg_catalog.pg_description d ON d.objoid = p.oid
WHERE functionname LIKE 'obtener_scouts%' 
    OR functionname LIKE 'obtener_estadisticas%'
ORDER BY functionname;
"

echo "🎉 ¡Database Functions aplicadas y verificadas!"