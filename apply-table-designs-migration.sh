#!/bin/bash

# ================================================================
# SCRIPT PARA APLICAR MIGRACIÓN DE TABLA DE DISEÑOS
# Ejecutar manualmente para crear la tabla table_designs
# ================================================================

echo "🚀 Aplicando migración para tabla de diseños..."
echo "================================================"

# Variables de conexión (puedes modificarlas si es necesario)
DB_URL="postgresql://postgres.ztpqklghfayhlkfsdqwm:JohnCena123!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
MIGRATION_FILE="database/20_table_designs.sql"

# Verificar que el archivo de migración existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: No se encuentra el archivo $MIGRATION_FILE"
    exit 1
fi

echo "📁 Archivo de migración encontrado: $MIGRATION_FILE"
echo "🔗 Conectando a la base de datos..."

# Aplicar la migración
psql "$DB_URL" -f "$MIGRATION_FILE"

# Verificar el resultado
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Migración aplicada exitosamente!"
    echo "📋 Se ha creado la tabla 'table_designs' con:"
    echo "   - Estructura completa para guardar diseños"
    echo "   - Políticas de seguridad (RLS)"
    echo "   - Diseños por defecto (DNGI-03 y Lista Simple)"
    echo "   - Funciones auxiliares"
    echo ""
    echo "🎯 Próximos pasos:"
    echo "   1. Crear TableDesignService"
    echo "   2. Actualizar VisualDocumentDesigner"
    echo "   3. Probar persistencia en base de datos"
else
    echo ""
    echo "❌ Error al aplicar la migración"
    echo "💡 Verifica la conexión a la base de datos"
    exit 1
fi