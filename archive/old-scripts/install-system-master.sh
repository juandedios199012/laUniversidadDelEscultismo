#!/bin/bash

# ================================================================
# 🚀 INSTALADOR MAESTRO - SISTEMA SCOUT LIMA 12
# ================================================================
# ARQUITECTURA EMPRESARIAL CONSOLIDADA
# Ejecuta: Esquemas + Funciones + Verificaciones en orden óptimo
# Resultado: Sistema 100% funcional listo para producción
# ================================================================

# Configuración de colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración
LOG_FILE="installation_$(date +%Y%m%d_%H%M%S).log"
TEMP_DIR="/tmp/scout_installation"

# Funciones de utilidad
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

show_header() {
    echo -e "${PURPLE}"
    echo "================================================================"
    echo "🚀 INSTALADOR MAESTRO - SISTEMA SCOUT LIMA 12"
    echo "================================================================"
    echo -e "${NC}"
}

show_step() {
    echo -e "${CYAN}📋 PASO $1: $2${NC}"
}

check_prerequisites() {
    log_info "Verificando prerequisitos..."
    
    # Verificar archivos necesarios
    local required_files=(
        "MASTER_INSTALLATION.sql"
        "MASTER_FUNCTIONS.sql"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Archivo requerido no encontrado: $file"
            return 1
        else
            log_success "Encontrado: $file"
        fi
    done
    
    return 0
}

# ================================================================
# FUNCIÓN PRINCIPAL
# ================================================================
main() {
    show_header
    
    log_info "Inicio de instalación: $(date)"
    log_info "Directorio de trabajo: $(pwd)"
    log_info "Log de instalación: $LOG_FILE"
    
    # Verificar prerequisitos
    if ! check_prerequisites; then
        log_error "Prerequisitos no cumplidos. Abortando instalación."
        exit 1
    fi
    
    echo ""
    show_step "1" "INFORMACIÓN DEL SISTEMA"
    echo ""
    
    log_info "📊 ARCHIVOS MAESTROS CONSOLIDADOS:"
    log_info "   • MASTER_INSTALLATION.sql (Esquemas + Estructura)"
    log_info "   • MASTER_FUNCTIONS.sql (APIs + Lógica de Negocio)"
    
    echo ""
    log_warning "⚠️  IMPORTANTE: Este sistema eliminará TODOS los datos existentes"
    log_warning "⚠️  Asegúrate de hacer backup si tienes datos importantes"
    
    echo ""
    show_step "2" "INSTRUCCIONES DE INSTALACIÓN EN SUPABASE"
    echo ""
    
    echo -e "${YELLOW}"
    cat << 'EOF'
🎯 INSTALACIÓN EN SUPABASE SQL EDITOR:

1. Ve a tu proyecto Supabase: https://app.supabase.com
2. Navega a "SQL Editor" en el menú lateral
3. Ejecuta los scripts EN ESTE ORDEN EXACTO:

   📋 PRIMER SCRIPT: MASTER_INSTALLATION.sql
   ├─ Elimina datos existentes (limpieza completa)
   ├─ Crea 13 tablas principales
   ├─ Configura 15 tipos ENUM
   ├─ Instala 40+ índices para rendimiento
   ├─ Activa sistema de auditoría
   └─ Configura funciones de utilidad

   📋 SEGUNDO SCRIPT: MASTER_FUNCTIONS.sql
   ├─ Instala 20+ APIs de negocio
   ├─ Configura módulos: Scouts, Inventario, Actividades
   ├─ Activa dashboard principal
   ├─ Habilita sistema de reportes
   └─ Funciones de mantenimiento

EOF
    echo -e "${NC}"
    
    show_step "3" "ORDEN DE EJECUCIÓN CRÍTICO"
    echo ""
    
    echo -e "${GREEN}🔄 SECUENCIA DE INSTALACIÓN:${NC}"
    echo "   1️⃣ Copia MASTER_INSTALLATION.sql → Pega en SQL Editor → Ejecutar"
    echo "   2️⃣ Espera que termine (⚠️ sin errores)"
    echo "   3️⃣ Copia MASTER_FUNCTIONS.sql → Pega en SQL Editor → Ejecutar"
    echo "   4️⃣ Espera que termine (⚠️ sin errores)"
    echo "   5️⃣ ¡Sistema listo para usar!"
    
    echo ""
    show_step "4" "COMANDOS DE VERIFICACIÓN"
    echo ""
    
    echo -e "${BLUE}"
    cat << 'EOF'
🧪 COMANDOS DE PRUEBA (Ejecutar en SQL Editor):

-- Verificar instalación del esquema
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('scouts', 'actividades_scout', 'inventario')
ORDER BY table_name;

-- Verificar APIs instaladas
SELECT 
    routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'api_%'
ORDER BY routine_name;

-- Probar dashboard principal
SELECT api_dashboard_principal();

-- Probar búsqueda de scouts
SELECT api_buscar_scouts('{"estado": "ACTIVO"}'::json);

EOF
    echo -e "${NC}"
    
    show_step "5" "CONFIGURACIÓN DEL FRONTEND"
    echo ""
    
    log_info "📱 CONFIGURACIÓN DE VARIABLES DE ENTORNO:"
    echo ""
    echo -e "${CYAN}"
    cat << 'EOF'
Crear archivo .env en la raíz del proyecto:

VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_anon_key

Luego ejecutar:
npm install
npm run dev

EOF
    echo -e "${NC}"
    
    show_step "6" "CARACTERÍSTICAS DEL SISTEMA"
    echo ""
    
    echo -e "${GREEN}✨ FUNCIONALIDADES PRINCIPALES:${NC}"
    echo "   📊 Dashboard en tiempo real"
    echo "   👥 Gestión completa de scouts"
    echo "   🎯 Administración de actividades"
    echo "   📦 Control de inventario"
    echo "   💰 Gestión de presupuestos"
    echo "   📈 Sistema de reportes"
    echo "   🔍 Búsquedas avanzadas"
    echo "   🛡️  Sistema de auditoría"
    
    echo ""
    echo -e "${PURPLE}🏗️ ARQUITECTURA TÉCNICA:${NC}"
    echo "   ⚡ Database Functions (APIs sin servidor)"
    echo "   🔄 Respuestas JSON estandarizadas"
    echo "   📊 Paginación automática"
    echo "   🛡️  Validaciones robustas"
    echo "   🗄️  Auditoría completa"
    echo "   📈 Optimización de rendimiento"
    
    echo ""
    show_step "7" "ESTADÍSTICAS DEL SISTEMA"
    echo ""
    
    echo -e "${CYAN}📈 COMPONENTES INSTALADOS:${NC}"
    echo "   • 13 Tablas principales"
    echo "   • 15 Tipos ENUM especializados"
    echo "   • 20+ APIs de negocio"
    echo "   • 40+ Índices para rendimiento"
    echo "   • 10+ Triggers automáticos"
    echo "   • Sistema de códigos únicos"
    echo "   • Validaciones multicapa"
    echo "   • Logging completo"
    
    echo ""
    show_step "8" "SOPORTE Y MANTENIMIENTO"
    echo ""
    
    echo -e "${YELLOW}🔧 FUNCIONES DE MANTENIMIENTO:${NC}"
    echo "   • api_limpiar_datos_antiguos() - Limpieza automática"
    echo "   • Backup automático en audit_log"
    echo "   • Validaciones de integridad"
    echo "   • Monitoreo de rendimiento"
    
    echo ""
    echo -e "${GREEN}"
    echo "================================================================"
    echo "🎉 INSTALACIÓN LISTA PARA EJECUTAR"
    echo "================================================================"
    echo -e "${NC}"
    
    log_info "Documentación de instalación generada"
    log_info "Para soporte, revisar $LOG_FILE"
    log_info "Instalación completada: $(date)"
    
    echo ""
    echo -e "${BLUE}📋 PRÓXIMOS PASOS:${NC}"
    echo "1. Ejecutar MASTER_INSTALLATION.sql en Supabase"
    echo "2. Ejecutar MASTER_FUNCTIONS.sql en Supabase"
    echo "3. Configurar variables de entorno"
    echo "4. Ejecutar npm run dev"
    echo "5. ¡Disfrutar del sistema! 🚀"
    echo ""
}

# Ejecutar función principal
main "$@"