#!/bin/bash

# ============================================================
# 🔍 VALIDADOR COMPLETO DE CAMPOS - TODOS LOS MÓDULOS
# ============================================================

echo "🔍 VALIDACIÓN COMPLETA DE CAMPOS EN TODOS LOS SERVICIOS"
echo "============================================================"

# Función para validar un servicio específico
validate_service() {
    local service_file="$1"
    local table_name="$2"
    
    if [ ! -f "$service_file" ]; then
        echo "⚠️  Archivo $service_file no encontrado"
        return
    fi
    
    echo ""
    echo "🎯 VALIDANDO: $service_file -> tabla $table_name"
    echo "----------------------------------------"
    
    # Buscar campos problemáticos en camelCase
    echo "❌ Campos en camelCase (PROBLEMÁTICOS):"
    grep -n -E "(fechaNacimiento|numeroDocumento|tipoDocumento|ramaActual|fechaIngreso|centroEstudio|fechaUltimoPago|codigoScout|estadoItem|cantidadDisponible|valorUnitario|fechaAdquisicion|tipoActividad|fechaInicio|fechaFin|dirigentResponsable|capacidadMaxima|participantesConfirmados|requiereAutorizacion|materialNecesario|estadoActividad|estadoAsistencia|horaLlegada|horaSalida|registradoPor|tipoReunion)" "$service_file" | head -5
    
    # Buscar campos correctos en snake_case
    echo ""
    echo "✅ Campos en snake_case (CORRECTOS):"
    grep -n -E "(fecha_nacimiento|numero_documento|tipo_documento|rama_actual|fecha_ingreso|centro_estudio|fecha_ultimo_pago|codigo_scout|estado_item|cantidad_disponible|valor_unitario|fecha_adquisicion|tipo_actividad|fecha_inicio|fecha_fin|dirigente_responsable|capacidad_maxima|participantes_confirmados|requiere_autorizacion|material_necesario|estado_actividad|estado_asistencia|hora_llegada|hora_salida|registrado_por|tipo_reunion)" "$service_file" | head -5
    
    # Buscar operaciones de insert/update
    echo ""
    echo "📝 Operaciones de BD encontradas:"
    grep -n -E "\.insert\(|\.update\(|\.from\(" "$service_file" | head -3
}

# Validar todos los servicios principales
validate_service "src/services/scoutService.ts" "scouts"
validate_service "src/services/inventarioService.ts" "inventario"
validate_service "src/services/actividadesService.ts" "actividades_scout"
validate_service "src/services/asistenciaService.ts" "asistencias"
validate_service "src/services/dirigenteService.ts" "dirigentes"
validate_service "src/services/patrullaService.ts" "patrullas"
validate_service "src/services/presupuestoService.ts" "presupuestos"

echo ""
echo "🎯 RESUMEN DE CAMPOS DE BASE DE DATOS"
echo "============================================================"

# Mostrar campos de las tablas principales
echo "📋 TABLA SCOUTS:"
grep -A 25 "CREATE TABLE.*scouts" database/MASTER_INSTALLATION_COMPLETO.sql | grep -E "    [a-z_]+ " | sed 's/    /  ✅ /' | head -15

echo ""
echo "📋 TABLA INVENTARIO:"
grep -A 20 "CREATE TABLE.*inventario" database/MASTER_INSTALLATION_COMPLETO.sql | grep -E "    [a-z_]+ " | sed 's/    /  ✅ /' | head -10

echo ""
echo "📋 TABLA ACTIVIDADES_SCOUT:"
grep -A 20 "CREATE TABLE.*actividades_scout" database/MASTER_INSTALLATION_COMPLETO.sql | grep -E "    [a-z_]+ " | sed 's/    /  ✅ /' | head -10

echo ""
echo "🔧 PLAN DE CORRECCIÓN"
echo "============================================================"
echo "1. ❌ Cambiar TODOS los campos camelCase por snake_case"
echo "2. ✅ Usar nombres exactos de las columnas de BD"
echo "3. 🧪 Probar cada módulo después de las correcciones"
echo "4. 🚀 Ejecutar script de instalación en Supabase"
echo ""
echo "📋 Campos más comunes a corregir:"
echo "   fechaNacimiento → fecha_nacimiento"
echo "   numeroDocumento → numero_documento"
echo "   tipoDocumento → tipo_documento"
echo "   ramaActual → rama_actual"
echo "   fechaIngreso → fecha_ingreso"
echo "   codigoScout → codigo_scout"