#!/bin/bash

# ================================================================
# 🚀 INSTALACIÓN COMPLETA DEL BACKEND - SISTEMA SCOUT
# ================================================================
# Script: install-backend-complete.sh
# Propósito: Instalar todo el sistema backend en el orden correcto
# Uso: ./install-backend-complete.sh
# ================================================================

echo "🎯 ========================================"
echo "🎯 INSTALACIÓN BACKEND SISTEMA SCOUT"
echo "🎯 ========================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar pasos
show_step() {
    echo -e "${BLUE}📋 PASO $1: $2${NC}"
}

# Función para mostrar errores
show_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
}

# Función para mostrar éxito
show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para mostrar advertencias
show_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ================================================================
# VERIFICAR ARCHIVOS NECESARIOS
# ================================================================
show_step "1" "Verificando archivos necesarios"

required_files=(
    "database/01_schema.sql"
    "DATABASE_UTILITY_FUNCTIONS.sql"
    "DATABASE_FINAL_MODULES_CORREGIDO.sql"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        show_error "Archivo no encontrado: $file"
        exit 1
    else
        show_success "Encontrado: $file"
    fi
done

echo ""

# ================================================================
# INSTRUCCIONES PARA SUPABASE
# ================================================================
show_step "2" "Instrucciones de instalación en Supabase"

echo -e "${YELLOW}"
cat << 'EOF'
📋 INSTRUCCIONES PARA SUPABASE SQL EDITOR:

1. Ve a tu proyecto en https://app.supabase.com
2. Navega a "SQL Editor" en el menú lateral
3. Ejecuta los siguientes scripts EN ORDEN:

EOF
echo -e "${NC}"

echo -e "${GREEN}🏗️  PASO 1: Crear esquema base${NC}"
echo "   📁 Archivo: database/01_schema.sql"
echo "   📝 Descripción: Crea todas las tablas, tipos ENUM e índices"
echo ""

echo -e "${GREEN}🔧 PASO 2: Crear funciones de utilidad${NC}"
echo "   📁 Archivo: DATABASE_UTILITY_FUNCTIONS.sql"
echo "   📝 Descripción: Funciones de validación, respuestas JSON y paginación"
echo ""

echo -e "${GREEN}🎯 PASO 3: Crear módulos finales${NC}"
echo "   📁 Archivo: DATABASE_FINAL_MODULES_CORREGIDO.sql"
echo "   📝 Descripción: APIs para actividades y dashboard principal"
echo ""

# ================================================================
# COMANDOS SQL PARA VERIFICACIÓN
# ================================================================
show_step "3" "Comandos de verificación"

echo -e "${BLUE}"
cat << 'EOF'
🧪 COMANDOS DE PRUEBA (Ejecutar en SQL Editor):

-- Probar dashboard principal
SELECT api_dashboard_principal();

-- Probar búsqueda de actividades
SELECT api_buscar_actividades('{"estado": "PLANIFICADA"}'::jsonb);

-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%scout%'
ORDER BY table_name;

-- Verificar funciones creadas
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'api_%'
ORDER BY routine_name;

EOF
echo -e "${NC}"

# ================================================================
# CONTENIDO DE ARCHIVOS PARA COPY-PASTE
# ================================================================
show_step "4" "Contenido de archivos listos para copy-paste"

echo ""
echo -e "${GREEN}📋 CONTENIDOS PREPARADOS:${NC}"
echo "   ✅ database/01_schema.sql - Listo para copy-paste"
echo "   ✅ DATABASE_UTILITY_FUNCTIONS.sql - Listo para copy-paste"  
echo "   ✅ DATABASE_FINAL_MODULES_CORREGIDO.sql - Listo para copy-paste"

echo ""
echo -e "${YELLOW}📌 ORDEN DE EJECUCIÓN CRÍTICO:${NC}"
echo "   1️⃣ database/01_schema.sql (crear tablas)"
echo "   2️⃣ DATABASE_UTILITY_FUNCTIONS.sql (funciones de soporte)"
echo "   3️⃣ DATABASE_FINAL_MODULES_CORREGIDO.sql (APIs finales)"

echo ""
echo -e "${GREEN}🎉 ¡INSTALACIÓN LISTA!${NC}"
echo -e "${BLUE}Copia y pega cada archivo en Supabase SQL Editor en el orden indicado.${NC}"

echo ""
echo "🎯 ========================================"
echo "🎯 FIN DE INSTRUCCIONES"
echo "🎯 ========================================"