#!/bin/bash

# ================================================================
# 🎯 INSTALADOR MAESTRO ACTUALIZADO - SISTEMA SCOUT LIMA 12
# ================================================================
# VERSIÓN: 2.0 - Consolidación completa
# INCLUYE: Esquemas + Funciones + Optimizaciones + Caching
# ARQUITECTURA: Enterprise-level con todos los módulos
# ================================================================

echo "🚀 =========================================="
echo "🎯 INSTALADOR MAESTRO SISTEMA SCOUT LIMA 12"
echo "🚀 =========================================="
echo "📋 VERSIÓN: 2.0 - Consolidación Enterprise"
echo "📅 FECHA: $(date '+%Y-%m-%d %H:%M:%S')"
echo "🚀 =========================================="

# Verificar si estamos en el directorio correcto
if [ ! -f "MASTER_INSTALLATION_COMPLETO.sql" ] || [ ! -f "MASTER_FUNCTIONS_COMPLETO.sql" ]; then
    echo "❌ ERROR: No se encontraron los archivos maestros necesarios"
    echo "📋 Asegúrate de estar en el directorio correcto y tener:"
    echo "   - MASTER_INSTALLATION_COMPLETO.sql"
    echo "   - MASTER_FUNCTIONS_COMPLETO.sql"
    exit 1
fi

echo ""
echo "📋 PREREQUISITOS VERIFICADOS"
echo "✅ MASTER_INSTALLATION_COMPLETO.sql encontrado"
echo "✅ MASTER_FUNCTIONS_COMPLETO.sql encontrado"
echo ""

# Verificar variables de entorno
echo "🔍 VERIFICANDO CONFIGURACIÓN..."
echo ""

if [ -z "$SUPABASE_URL" ]; then
    echo "⚠️  Variable SUPABASE_URL no configurada"
    echo "📋 Ejemplo: export SUPABASE_URL='https://tu-proyecto.supabase.co'"
fi

if [ -z "$SUPABASE_KEY" ]; then
    echo "⚠️  Variable SUPABASE_KEY no configurada"
    echo "📋 Ejemplo: export SUPABASE_KEY='tu-service-role-key'"
fi

echo ""
echo "🎯 =========================================="
echo "📋 INSTRUCCIONES DE INSTALACIÓN PASO A PASO"
echo "🎯 =========================================="
echo ""

echo "📋 PASO 1: ACCEDER AL SQL EDITOR DE SUPABASE"
echo "   1. Ve a tu proyecto en https://app.supabase.com"
echo "   2. Navega a 'SQL Editor' en el panel izquierdo"
echo "   3. Crea una nueva query/consulta"
echo ""

echo "📋 PASO 2: EJECUTAR MASTER INSTALLATION"
echo "   1. Copia TODO el contenido de: MASTER_INSTALLATION_COMPLETO.sql"
echo "   2. Pégalo en el SQL Editor de Supabase"
echo "   3. Haz clic en 'RUN' para ejecutar"
echo "   4. Espera a que termine (puede tomar 2-3 minutos)"
echo "   5. Verifica que veas el mensaje: '✅ MASTER INSTALLATION COMPLETADO EXITOSAMENTE'"
echo ""

echo "📋 PASO 3: EJECUTAR MASTER FUNCTIONS"
echo "   1. Limpia el SQL Editor (borra el contenido anterior)"
echo "   2. Copia TODO el contenido de: MASTER_FUNCTIONS_COMPLETO.sql"
echo "   3. Pégalo en el SQL Editor de Supabase"
echo "   4. Haz clic en 'RUN' para ejecutar"
echo "   5. Espera a que termine (puede tomar 1-2 minutos)"
echo "   6. Verifica que veas el mensaje: '✅ MASTER FUNCTIONS COMPLETADO EXITOSAMENTE'"
echo ""

echo "🎯 =========================================="
echo "📊 CONTENIDO DE LA INSTALACIÓN COMPLETA"
echo "🎯 =========================================="
echo ""

echo "🏗️  MASTER INSTALLATION INCLUYE:"
echo "   ✅ 19 tablas principales del sistema"
echo "   ✅ 15+ tipos ENUM personalizados"
echo "   ✅ 40+ índices optimizados para performance"
echo "   ✅ 3 vistas materializadas para caching"
echo "   ✅ Sistema de auditoría automática"
echo "   ✅ Triggers para timestamps automáticos"
echo "   ✅ Extensiones PostgreSQL (uuid-ossp, pg_trgm)"
echo "   ✅ Tablas de cache y estadísticas pre-calculadas"
echo ""

echo "🚀 MASTER FUNCTIONS INCLUYE:"
echo "   ✅ 25+ APIs principales (api_*)"
echo "   ✅ Módulo Scouts completo"
echo "   ✅ Módulo Inventario completo"
echo "   ✅ Módulo Actividades completo"
echo "   ✅ Sistema de caching inteligente"
echo "   ✅ Dashboard y reportes avanzados"
echo "   ✅ Funciones de mantenimiento automático"
echo "   ✅ Health check del sistema"
echo "   ✅ Funciones de utilidad (validación, logging)"
echo ""

echo "🎯 =========================================="
echo "🔧 CARACTERÍSTICAS TÉCNICAS AVANZADAS"
echo "🎯 =========================================="
echo ""

echo "⚡ PERFORMANCE OPTIMIZADO:"
echo "   ✅ Búsquedas de texto full-text con pg_trgm"
echo "   ✅ Índices estratégicos para consultas frecuentes"
echo "   ✅ Vistas materializadas para estadísticas rápidas"
echo "   ✅ Cache inteligente con expiración automática"
echo "   ✅ Paginación optimizada en todas las consultas"
echo ""

echo "🔒 SEGURIDAD Y AUDITORÍA:"
echo "   ✅ Validación de entrada en todas las funciones"
echo "   ✅ Manejo de errores robusto"
echo "   ✅ Logging automático de operaciones críticas"
echo "   ✅ Constraints de integridad referencial"
echo ""

echo "🏗️  ARQUITECTURA ENTERPRISE:"
echo "   ✅ Database Functions como microservicios"
echo "   ✅ Respuestas JSON estandarizadas"
echo "   ✅ Separación clara entre datos y lógica"
echo "   ✅ Escalabilidad horizontal preparada"
echo ""

echo "🎯 =========================================="
echo "📋 VERIFICACIÓN POST-INSTALACIÓN"
echo "🎯 =========================================="
echo ""

echo "✅ PRUEBAS RECOMENDADAS DESPUÉS DE LA INSTALACIÓN:"
echo ""
echo "1. 🏥 HEALTH CHECK:"
echo "   SELECT * FROM api_health_check();"
echo ""
echo "2. 📊 DASHBOARD:"
echo "   SELECT * FROM api_dashboard_principal();"
echo ""
echo "3. 👥 REGISTRAR SCOUT DE PRUEBA:"
echo "   SELECT * FROM api_registrar_scout("
echo "     '{\"nombres\":\"Juan\", \"apellidos\":\"Pérez\", \"fecha_nacimiento\":\"2010-01-01\","
echo "       \"documento_identidad\":\"12345678\", \"sexo\":\"MASCULINO\"}'"
echo "   );"
echo ""
echo "4. 📦 CREAR ITEM DE INVENTARIO:"
echo "   SELECT * FROM api_crear_inventario_item("
echo "     '{\"nombre\":\"Cuerda\", \"categoria\":\"CAMPING\", \"cantidad_inicial\":5}'"
echo "   );"
echo ""

echo "🎯 =========================================="
echo "🚨 RESOLUCIÓN DE PROBLEMAS COMUNES"
echo "🎯 =========================================="
echo ""

echo "❌ SI VES ERROR 'relation already exists':"
echo "   - Es normal, el script limpia automáticamente"
echo "   - Continúa con la ejecución completa"
echo ""

echo "❌ SI VES ERROR 'permission denied':"
echo "   - Verifica que uses el Service Role Key"
echo "   - No uses la clave anon/public"
echo ""

echo "❌ SI FALTA UNA FUNCIÓN ESPECÍFICA:"
echo "   - Verifica que ambos scripts se ejecutaron completamente"
echo "   - Revisa la consola para errores específicos"
echo ""

echo "❌ SI EL PERFORMANCE ES LENTO:"
echo "   - Ejecuta: SELECT * FROM api_mantenimiento_sistema();"
echo "   - Esto actualizará estadísticas y optimizará el cache"
echo ""

echo "🎯 =========================================="
echo "📞 INFORMACIÓN DE CONTACTO Y SOPORTE"
echo "🎯 =========================================="
echo ""

echo "📧 DOCUMENTACIÓN COMPLETA:"
echo "   - README_MASTER.md (en el proyecto)"
echo "   - API_DOCUMENTATION.md (documentación de APIs)"
echo ""

echo "🔧 MANTENIMIENTO RECOMENDADO:"
echo "   - Ejecutar api_mantenimiento_sistema() semanalmente"
echo "   - Monitorear api_health_check() diariamente"
echo "   - Hacer backup antes de actualizaciones mayores"
echo ""

echo "🎯 =========================================="
echo "🎉 ¡INSTALACIÓN LISTA PARA COMENZAR!"
echo "🎯 =========================================="
echo ""

echo "📋 RESUMEN FINAL:"
echo "   1. ✅ Ejecuta MASTER_INSTALLATION_COMPLETO.sql en Supabase SQL Editor"
echo "   2. ✅ Ejecuta MASTER_FUNCTIONS_COMPLETO.sql en Supabase SQL Editor"
echo "   3. ✅ Prueba con api_health_check()"
echo "   4. ✅ ¡Tu sistema está listo!"
echo ""
echo "🚀 ¡ÉXITO! Sistema Scout Lima 12 Enterprise listo para producción"
echo ""

# Opcional: Mostrar tamaño de archivos
echo "📁 INFORMACIÓN DE ARCHIVOS:"
if [ -f "MASTER_INSTALLATION_COMPLETO.sql" ]; then
    INSTALL_SIZE=$(wc -l < "MASTER_INSTALLATION_COMPLETO.sql")
    echo "   📄 MASTER_INSTALLATION_COMPLETO.sql: $INSTALL_SIZE líneas"
fi

if [ -f "MASTER_FUNCTIONS_COMPLETO.sql" ]; then
    FUNCTIONS_SIZE=$(wc -l < "MASTER_FUNCTIONS_COMPLETO.sql")
    echo "   📄 MASTER_FUNCTIONS_COMPLETO.sql: $FUNCTIONS_SIZE líneas"
fi

echo ""
echo "⏰ Tiempo estimado total de instalación: 5-10 minutos"
echo "💾 Espacio requerido en BD: ~50MB iniciales"
echo ""
echo "🎉 ¡GRACIAS POR USAR EL SISTEMA SCOUT LIMA 12!"