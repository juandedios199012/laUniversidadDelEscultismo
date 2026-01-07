#!/bin/bash
# ================================================================
# INSTALACIÓN COMPLETA: INSCRIPCIONES CON PAGOS PARCIALES
# ================================================================
# Descripción: Script para ejecutar todas las migraciones necesarias
# Fecha: 7 de enero de 2026
# ================================================================

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
DB_URL="postgresql://postgres.bpvizrdbfozxxvlkzkda:l6CQBVDJQGWsPyaP@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}INSTALACIÓN: INSCRIPCIONES CON PAGOS${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 1. Fix Foreign Key
echo -e "${YELLOW}[1/3] Corrigiendo foreign key de inscripciones...${NC}"
psql "$DB_URL" -f database/fix_inscripciones_foreign_key.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Foreign key corregida${NC}"
else
    echo -e "${RED}❌ Error corrigiendo foreign key${NC}"
    exit 1
fi
echo ""

# 2. Agregar columna monto_pagado
echo -e "${YELLOW}[2/3] Agregando columna monto_pagado y estado PARCIAL...${NC}"
psql "$DB_URL" -f database/add_monto_pagado_inscripciones.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Columna monto_pagado agregada${NC}"
else
    echo -e "${RED}❌ Error agregando columna${NC}"
    exit 1
fi
echo ""

# 3. Actualizar funciones
echo -e "${YELLOW}[3/3] Actualizando funciones SQL...${NC}"
psql "$DB_URL" -f database/api_inscripciones_anuales_v2.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Funciones actualizadas${NC}"
else
    echo -e "${RED}❌ Error actualizando funciones${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ INSTALACIÓN COMPLETADA${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Funciones disponibles:${NC}"
echo "  - api_registrar_inscripcion_anual"
echo "  - api_obtener_inscripciones (con monto_pagado)"
echo "  - api_actualizar_inscripcion (con monto_pagado)"
echo "  - api_eliminar_inscripcion"
echo "  - api_estadisticas_inscripciones"
echo "  - api_inscribir_masivo"
echo "  - api_registrar_pago_inscripcion (NUEVO)"
echo ""
echo -e "${GREEN}Servidor frontend: http://localhost:3000${NC}"
echo -e "${YELLOW}Navega a: Dashboard → Inscripción Anual${NC}"
