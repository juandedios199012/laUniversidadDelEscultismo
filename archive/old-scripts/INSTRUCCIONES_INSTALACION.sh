#!/bin/bash

# 🎯 GUÍA DE INSTALACIÓN DE FUNCIONES BACKEND PARA SUPABASE
# ================================================================
# 
# Este script te guía para instalar todas las funciones necesarias
# para que la arquitectura de microservicios funcione correctamente.
#
# ⚠️  IMPORTANTE: Ejecuta estos scripts EN ORDEN en tu consola SQL de Supabase
#
# 📍 Ubicación: Supabase Dashboard > SQL Editor > Nueva consulta

echo "🚀 INSTALACIÓN DEL SISTEMA SCOUT - ARQUITECTURA EMPRESARIAL"
echo "=========================================================="
echo ""

echo "📋 PASO 1: Scripts que debes ejecutar EN ORDEN:"
echo ""

echo "1️⃣  SISTEMA BASE (Obligatorio):"
echo "   📄 Archivo: DATABASE_COMPLETE_SYSTEM.sql"
echo "   📋 Contiene: Funciones básicas de Scout e Inventario"
echo "   🎯 Funciones: api_buscar_scouts, api_registrar_scout, api_actualizar_scout"
echo ""

echo "2️⃣  MÓDULOS EXTENDIDOS (Obligatorio):"
echo "   📄 Archivo: DATABASE_MODULES_EXTENDED.sql"  
echo "   📋 Contiene: Presupuestos, Dirigentes, Patrullas, Asistencia"
echo "   🎯 Funciones: api_crear_presupuesto, api_asignar_dirigente, api_registrar_asistencia"
echo ""

echo "3️⃣  MÓDULOS FINALES (Obligatorio):"
echo "   📄 Archivo: DATABASE_FINAL_MODULES.sql"
echo "   📋 Contiene: Actividades, ComitePadres, ProgramaSemanal, LibroOro, Dashboard"
echo "   🎯 Funciones: api_dashboard_principal, api_crear_actividad, api_crear_programa_semanal"
echo ""

echo "4️⃣  ALTERNATIVA - SCRIPT ÚNICO (Opcional):"
echo "   📄 Archivo: SCRIPT_MAESTRO_SISTEMA_COMPLETO.sql"
echo "   📋 Contiene: TODO el sistema en un solo archivo"
echo "   ⚠️  Usar SOLO si prefieres instalar todo de una vez"
echo ""

echo "🔧 INSTRUCCIONES DE INSTALACIÓN:"
echo "================================"
echo ""
echo "1. Ve a Supabase Dashboard: https://app.supabase.com"
echo "2. Selecciona tu proyecto"
echo "3. Ve a 'SQL Editor' en el menú lateral"
echo "4. Haz clic en 'New query'"
echo "5. Copia y pega el contenido de cada archivo SQL EN ORDEN"
echo "6. Ejecuta cada script haciendo clic en 'Run'"
echo ""

echo "⚡ FUNCIONES PRINCIPALES QUE SE INSTALARÁN:"
echo "=========================================="
echo ""
echo "📊 Dashboard y Estadísticas:"
echo "   • api_dashboard_principal() - Estadísticas del grupo"
echo ""
echo "👥 Gestión de Scouts:"
echo "   • api_buscar_scouts(p_filtros) - Búsqueda y listado"
echo "   • api_registrar_scout(p_datos_scout, p_datos_familiar) - Registro"
echo "   • api_actualizar_scout(p_scout_id, p_datos_scout) - Actualización"
echo "   • api_eliminar_scout(p_scout_id) - Eliminación lógica"
echo ""
echo "📦 Inventario:"
echo "   • api_crear_item_inventario(p_datos_item) - Crear item"
echo "   • api_registrar_movimiento(p_datos_movimiento) - Movimientos"
echo "   • api_buscar_inventario(p_filtros) - Búsqueda"
echo ""
echo "💰 Presupuestos:"
echo "   • api_crear_presupuesto(p_datos_presupuesto) - Crear presupuesto"
echo "   • api_ejecutar_gasto_presupuesto(p_datos_gasto) - Registrar gasto"
echo ""
echo "🎯 Actividades:"
echo "   • api_crear_actividad(p_datos_actividad) - Crear actividad"
echo "   • api_inscribir_scout_actividad(p_scout_id, p_actividad_id) - Inscripción"
echo ""

echo "✅ VERIFICACIÓN POST-INSTALACIÓN:"
echo "================================="
echo ""
echo "Después de ejecutar los scripts, verifica que funcionan:"
echo ""
echo "-- Probar dashboard"
echo "SELECT api_dashboard_principal();"
echo ""
echo "-- Probar búsqueda de scouts"
echo "SELECT api_buscar_scouts('{\"estado\": \"ACTIVO\"}'::jsonb);"
echo ""

echo "🆘 SOLUCIÓN DE PROBLEMAS:"
echo "========================"
echo ""
echo "Si encuentras errores:"
echo "1. Verifica que ejecutaste los scripts EN ORDEN"
echo "2. Revisa que tu usuario tenga permisos de creación de funciones"
echo "3. Si hay errores de 'function already exists', es normal en re-ejecuciones"
echo "4. Contacta al equipo si persisten los errores"
echo ""

echo "🎉 ¡Listo! Una vez ejecutados los scripts, tu sistema funcionará completamente."