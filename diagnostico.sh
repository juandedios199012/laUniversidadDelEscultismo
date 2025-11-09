#!/bin/bash

# Script de diagnóstico para el sistema Scout
echo "🔍 Diagnóstico del Sistema Scout Lima 12"
echo "========================================"

# 1. Verificar si hay errores de sintaxis en TypeScript
echo "📋 1. Verificando sintaxis TypeScript..."
npm run build 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Sintaxis TypeScript correcta"
else
    echo "❌ Errores de sintaxis en TypeScript"
fi

# 2. Verificar estructura de archivos críticos
echo ""
echo "📋 2. Verificando archivos críticos..."

if [ -f "src/services/scoutService.ts" ]; then
    echo "✅ scoutService.ts existe"
    
    # Verificar si usa codigo_scout en lugar de codigo
    if grep -q "codigo_scout" src/services/scoutService.ts; then
        echo "✅ scoutService.ts usa codigo_scout (correcto)"
    else
        echo "❌ scoutService.ts no usa codigo_scout"
    fi
    
    if grep -q "codigo:" src/services/scoutService.ts; then
        echo "⚠️  scoutService.ts todavía tiene 'codigo:' - revisar"
    fi
else
    echo "❌ scoutService.ts no encontrado"
fi

if [ -f ".env" ]; then
    echo "✅ Archivo .env existe"
    
    if grep -q "demo-project" .env; then
        echo "⚠️  .env tiene URLs demo - necesita credenciales reales"
    else
        echo "✅ .env parece tener configuración personalizada"
    fi
else
    echo "❌ Archivo .env no encontrado"
fi

# 3. Verificar scripts de base de datos
echo ""
echo "📋 3. Verificando scripts de base de datos..."

if [ -f "database/MASTER_INSTALLATION_COMPLETO.sql" ]; then
    echo "✅ MASTER_INSTALLATION_COMPLETO.sql existe"
    
    # Verificar que define codigo_scout
    if grep -q "codigo_scout" database/MASTER_INSTALLATION_COMPLETO.sql; then
        echo "✅ Script define codigo_scout correctamente"
    else
        echo "❌ Script no define codigo_scout"
    fi
else
    echo "❌ MASTER_INSTALLATION_COMPLETO.sql no encontrado"
fi

if [ -f "database/MASTER_FUNCTIONS_COMPLETO.sql" ]; then
    echo "✅ MASTER_FUNCTIONS_COMPLETO.sql existe"
    
    # Verificar que define api_registrar_scout
    if grep -q "api_registrar_scout" database/MASTER_FUNCTIONS_COMPLETO.sql; then
        echo "✅ Script define api_registrar_scout"
    else
        echo "❌ Script no define api_registrar_scout"
    fi
else
    echo "❌ MASTER_FUNCTIONS_COMPLETO.sql no encontrado"
fi

echo ""
echo "📋 4. Pasos recomendados:"
echo "1. Configura .env con tus credenciales reales de Supabase"
echo "2. Ejecuta MASTER_INSTALLATION_COMPLETO.sql en tu base de datos"
echo "3. Ejecuta MASTER_FUNCTIONS_COMPLETO.sql en tu base de datos"
echo "4. Reinicia el servidor local (npm run dev)"
echo ""
echo "🔧 Para configurar Supabase:"
echo "1. Ve a https://supabase.com/dashboard/projects"
echo "2. Crea un nuevo proyecto o abre uno existente"
echo "3. Ve a Settings > API"
echo "4. Copia URL y anon public key al archivo .env"