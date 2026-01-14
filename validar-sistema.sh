#!/bin/bash
# ==========================================
# Script de Validación Automática
# Sistema Scout Lima 12
# ==========================================

echo "🔍 Iniciando validación automática del sistema..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# ==========================================
# 1. VALIDAR ESTRUCTURA DE ARCHIVOS
# ==========================================
echo "📁 Validando estructura de archivos..."

required_files=(
  "src/components/Asistencia/Asistencia.tsx"
  "src/components/Asistencia/AsistenciaMigrated.tsx"
  "src/services/asistenciaService.ts"
  "src/services/scoutService.ts"
  "src/lib/supabase.ts"
)

for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file existe"
  else
    echo -e "${RED}✗${NC} $file NO ENCONTRADO"
    ((ERRORS++))
  fi
done

echo ""

# ==========================================
# 2. VALIDAR SINTAXIS TYPESCRIPT
# ==========================================
echo "🔧 Validando sintaxis TypeScript..."

if command -v npx &> /dev/null; then
  npx tsc --noEmit --skipLibCheck 2>&1 | tee /tmp/tsc-errors.log
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Sin errores de TypeScript"
  else
    echo -e "${RED}✗${NC} Errores de TypeScript detectados"
    ((ERRORS++))
  fi
else
  echo -e "${YELLOW}⚠${NC} TypeScript no disponible, saltando validación"
  ((WARNINGS++))
fi

echo ""

# ==========================================
# 3. VALIDAR VALORES DE ENUM
# ==========================================
echo "📊 Validando valores de enum estado_asistencia..."

check_enum_values() {
  local file=$1
  local correct_values=("PRESENTE" "AUSENTE" "TARDANZA" "JUSTIFICADO")
  local found_errors=0
  
  for value in "${correct_values[@]}"; do
    if grep -q "'$value'" "$file" || grep -q "\"$VALUE\"" "$file"; then
      echo -e "${GREEN}✓${NC} $file usa $value correctamente"
    fi
  done
  
  # Buscar valores incorrectos (minúsculas)
  if grep -qi "'presente'\|\"presente\"\|'ausente'\|\"ausente\"\|'tardanza'\|\"tardanza\"" "$file"; then
    if grep -q "estadoMap" "$file"; then
      echo -e "${GREEN}✓${NC} $file mapea correctamente los valores"
    else
      echo -e "${RED}✗${NC} $file contiene valores enum en minúsculas sin mapeo"
      ((ERRORS++))
      found_errors=1
    fi
  fi
  
  return $found_errors
}

check_enum_values "src/components/Asistencia/Asistencia.tsx"
check_enum_values "src/components/Asistencia/AsistenciaMigrated.tsx"

echo ""

# ==========================================
# 4. VALIDAR CAMPOS DE BASE DE DATOS
# ==========================================
echo "💾 Validando campos de base de datos..."

check_db_fields() {
  local file=$1
  
  # Verificar que se usa actividad_id (no reunion_id)
  if grep -q "actividad_id" "$file"; then
    echo -e "${GREEN}✓${NC} $file usa 'actividad_id' correctamente"
  else
    echo -e "${YELLOW}⚠${NC} $file no usa 'actividad_id'"
    ((WARNINGS++))
  fi
  
  # Verificar que se usa estado_asistencia (no estado)
  if grep -q "estado_asistencia" "$file"; then
    echo -e "${GREEN}✓${NC} $file usa 'estado_asistencia' correctamente"
  else
    echo -e "${YELLOW}⚠${NC} $file no usa 'estado_asistencia'"
    ((WARNINGS++))
  fi
}

check_db_fields "src/components/Asistencia/Asistencia.tsx"
check_db_fields "src/components/Asistencia/AsistenciaMigrated.tsx"
check_db_fields "src/services/asistenciaService.ts"

echo ""

# ==========================================
# 5. VALIDAR IMPORTS
# ==========================================
echo "📦 Validando imports..."

check_imports() {
  local file=$1
  local required_imports=("useState" "useEffect" "supabase")
  
  for import in "${required_imports[@]}"; do
    if grep -q "$import" "$file"; then
      echo -e "${GREEN}✓${NC} $file importa '$import'"
    fi
  done
}

check_imports "src/components/Asistencia/Asistencia.tsx"

echo ""

# ==========================================
# 6. VALIDAR MANEJO DE ERRORES
# ==========================================
echo "🛡️ Validando manejo de errores..."

check_error_handling() {
  local file=$1
  
  if grep -q "try {" "$file" && grep -q "catch" "$file"; then
    echo -e "${GREEN}✓${NC} $file tiene bloques try-catch"
  else
    echo -e "${YELLOW}⚠${NC} $file sin manejo de errores"
    ((WARNINGS++))
  fi
  
  if grep -q "console.error" "$file"; then
    echo -e "${GREEN}✓${NC} $file registra errores en consola"
  fi
}

check_error_handling "src/components/Asistencia/Asistencia.tsx"
check_error_handling "src/services/asistenciaService.ts"

echo ""

# ==========================================
# 7. VALIDAR INTEGRACIÓN CON SUPABASE
# ==========================================
echo "🔌 Validando integración con Supabase..."

if grep -q "from('asistencias')" "src/services/asistenciaService.ts"; then
  echo -e "${GREEN}✓${NC} Servicio usa tabla 'asistencias'"
else
  echo -e "${RED}✗${NC} Servicio no accede a tabla 'asistencias'"
  ((ERRORS++))
fi

if grep -q ".insert\|.upsert\|.update" "src/services/asistenciaService.ts"; then
  echo -e "${GREEN}✓${NC} Servicio tiene operaciones de escritura"
else
  echo -e "${YELLOW}⚠${NC} Servicio sin operaciones de escritura"
  ((WARNINGS++))
fi

echo ""

# ==========================================
# 8. VALIDAR COMPONENTES REACT
# ==========================================
echo "⚛️ Validando componentes React..."

check_react_component() {
  local file=$1
  
  if grep -q "export default function" "$file"; then
    echo -e "${GREEN}✓${NC} $file exporta componente correctamente"
  else
    echo -e "${RED}✗${NC} $file sin export default"
    ((ERRORS++))
  fi
  
  if grep -q "useState\|useEffect" "$file"; then
    echo -e "${GREEN}✓${NC} $file usa React hooks"
  fi
}

check_react_component "src/components/Asistencia/Asistencia.tsx"

echo ""

# ==========================================
# RESUMEN
# ==========================================
echo "================================================"
echo "📊 RESUMEN DE VALIDACIÓN"
echo "================================================"
echo -e "Errores críticos: ${RED}$ERRORS${NC}"
echo -e "Advertencias: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Validación exitosa - Sistema listo para usar${NC}"
  exit 0
else
  echo -e "${RED}❌ Validación falló - Corregir $ERRORS error(es)${NC}"
  exit 1
fi
