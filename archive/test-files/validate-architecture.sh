#!/bin/bash

# ================================================================
# 🚀 SCRIPT DE VALIDACIÓN RÁPIDA - SISTEMA SCOUT
# ================================================================
# Archivo: validate-architecture.sh
# Propósito: Validación rápida de la arquitectura completa
# Uso: ./validate-architecture.sh
# ================================================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${2:-$NC}$1${NC}"
}

# Header
echo -e "${MAGENTA}================================================================${NC}"
echo -e "${MAGENTA}🚀 VALIDACIÓN AUTOMATIZADA DE ARQUITECTURA SCOUT${NC}"
echo -e "${MAGENTA}================================================================${NC}"

# Verificar Node.js
log "🔍 Verificando Node.js..." $BLUE
if ! command -v node &> /dev/null; then
    log "❌ Node.js no encontrado. Por favor instala Node.js primero." $RED
    exit 1
fi
log "✅ Node.js $(node --version) encontrado" $GREEN

# Verificar npm
log "🔍 Verificando npm..." $BLUE
if ! command -v npm &> /dev/null; then
    log "❌ npm no encontrado." $RED
    exit 1
fi
log "✅ npm $(npm --version) encontrado" $GREEN

# Verificar variables de entorno
log "🔍 Verificando variables de entorno..." $BLUE
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    log "⚠️  Variables de entorno no configuradas" $YELLOW
    log "ℹ️  Creando archivo .env de ejemplo..." $BLUE
    cat > .env << EOF
# Configuración Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima

# Instrucciones:
# 1. Reemplaza 'tu-proyecto' con tu ID de proyecto Supabase
# 2. Reemplaza 'tu-clave-anonima' con tu clave anon de Supabase
# 3. Ejecuta: source .env && ./validate-architecture.sh
EOF
    log "📝 Archivo .env creado. Configúralo y ejecuta: source .env && ./validate-architecture.sh" $YELLOW
    exit 1
else
    log "✅ Variables de entorno configuradas" $GREEN
fi

# Verificar package.json
log "🔍 Verificando configuración de testing..." $BLUE
if [ ! -f "package.json" ]; then
    log "📦 Copiando configuración de testing..." $BLUE
    cp package-test.json package.json
    log "✅ Configuración de testing lista" $GREEN
fi

# Instalar dependencias si es necesario
log "🔍 Verificando dependencias..." $BLUE
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    log "📦 Instalando dependencias..." $BLUE
    npm install --silent
    if [ $? -eq 0 ]; then
        log "✅ Dependencias instaladas correctamente" $GREEN
    else
        log "❌ Error instalando dependencias" $RED
        exit 1
    fi
else
    log "✅ Dependencias ya instaladas" $GREEN
fi

# Ejecutar validación de Database Functions
log "\n🧪 EJECUTANDO VALIDACIÓN DE DATABASE FUNCTIONS..." $CYAN
npm run test:database
DATABASE_RESULT=$?

if [ $DATABASE_RESULT -eq 0 ]; then
    log "✅ Database Functions validadas correctamente" $GREEN
else
    log "❌ Errores en Database Functions" $RED
fi

# Ejecutar validación de servicios
log "\n🔗 EJECUTANDO VALIDACIÓN DE SERVICIOS..." $CYAN
npm run test:services
SERVICES_RESULT=$?

if [ $SERVICES_RESULT -eq 0 ]; then
    log "✅ Servicios validados correctamente" $GREEN
else
    log "❌ Errores en servicios" $RED
fi

# Resumen final
echo -e "\n${MAGENTA}================================================================${NC}"
echo -e "${MAGENTA}📊 RESUMEN DE VALIDACIÓN${NC}"
echo -e "${MAGENTA}================================================================${NC}"

if [ $DATABASE_RESULT -eq 0 ] && [ $SERVICES_RESULT -eq 0 ]; then
    log "🎉 ¡VALIDACIÓN COMPLETA EXITOSA!" $GREEN
    log "✅ Database Functions: FUNCIONANDO" $GREEN
    log "✅ Servicios: INTEGRADOS CORRECTAMENTE" $GREEN
    log "✅ Arquitectura Microservice: VALIDADA" $GREEN
    echo ""
    log "🚀 El sistema está listo para producción" $GREEN
    exit 0
else
    log "⚠️  VALIDACIÓN PARCIAL" $YELLOW
    if [ $DATABASE_RESULT -ne 0 ]; then
        log "❌ Database Functions: REQUIEREN ATENCIÓN" $RED
    fi
    if [ $SERVICES_RESULT -ne 0 ]; then
        log "❌ Servicios: REQUIEREN ATENCIÓN" $RED
    fi
    echo ""
    log "📋 Revisa los logs anteriores para identificar problemas específicos" $YELLOW
    exit 1
fi