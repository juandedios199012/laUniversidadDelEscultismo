#!/bin/bash

# ============================================================
# 🔍 VALIDADOR DE CAMPOS - BASE DE DATOS VS SERVICIOS
# ============================================================
# Este script compara los campos de las tablas de BD con los servicios

echo "🔍 VALIDACIÓN COMPLETA DE CAMPOS"
echo "========================================"

# Función para extraer campos de SQL
extract_sql_fields() {
    local table_name="$1"
    local sql_file="$2"
    echo "📋 Campos de tabla $table_name en SQL:"
    grep -A 30 "CREATE TABLE.*$table_name" "$sql_file" | grep -E "    [a-z_]+ " | sed 's/    //' | sed 's/ .*//' | sort
}

# Función para extraer campos de TypeScript
extract_ts_fields() {
    local service_file="$1"
    echo "📋 Campos usados en $service_file:"
    grep -E "(\.insert\(|\.update\()" -A 20 "$service_file" | grep -E "            [a-z_A-Z]+:" | sed 's/.*: //' | sed 's/:.*$//' | sed 's/ .*//' | sort | uniq
}

echo ""
echo "🎯 1. VALIDANDO TABLA SCOUTS"
echo "----------------------------------------"

# Extraer campos de la tabla scouts en SQL
echo "📄 Campos definidos en MASTER_INSTALLATION_COMPLETO.sql:"
extract_sql_fields "scouts" "database/MASTER_INSTALLATION_COMPLETO.sql"

echo ""
echo "📄 Campos usados en scoutService.ts:"
extract_ts_fields "src/services/scoutService.ts"

echo ""
echo "🎯 2. BUSCANDO INCONSISTENCIAS EN SCOUT SERVICE"
echo "----------------------------------------"

# Buscar campos en camelCase que deberían ser snake_case
echo "⚠️  Campos potencialmente problemáticos en scoutService.ts:"
grep -n -E "(fechaNacimiento|numeroDocumento|tipoDocumento|ramaActual|fechaIngreso|centroEstudio|fechaUltimoPago)" src/services/scoutService.ts | head -10

echo ""
echo "🎯 3. VALIDANDO OTROS SERVICIOS"
echo "----------------------------------------"

# Verificar si existen otros servicios
if [ -f "src/services/inventoryService.ts" ]; then
    echo "📦 Validando inventoryService.ts..."
    extract_ts_fields "src/services/inventoryService.ts"
fi

if [ -f "src/services/activityService.ts" ]; then
    echo "🎯 Validando activityService.ts..."
    extract_ts_fields "src/services/activityService.ts"
fi

echo ""
echo "🎯 4. RECOMENDACIONES"
echo "----------------------------------------"
echo "✅ Usar SIEMPRE snake_case para nombres de columnas:"
echo "   ❌ fechaNacimiento -> ✅ fecha_nacimiento"
echo "   ❌ numeroDocumento -> ✅ numero_documento"
echo "   ❌ tipoDocumento -> ✅ tipo_documento"
echo "   ❌ ramaActual -> ✅ rama_actual"
echo "   ❌ fechaIngreso -> ✅ fecha_ingreso"
echo ""
echo "📋 Próximo paso: Corregir campos en servicios para usar snake_case"