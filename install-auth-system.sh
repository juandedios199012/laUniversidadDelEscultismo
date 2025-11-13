#!/bin/bash

# 🔐 SCRIPT DE INSTALACIÓN DEL SISTEMA DE AUTENTICACIÓN
# Aplica las tablas y configuraciones necesarias para autenticación multi-tenant

echo "🔐 Instalando Sistema de Autenticación Multi-tenant..."
echo "=================================================="

# Verificar que existe el archivo SQL
if [ ! -f "database/02_authentication_system.sql" ]; then
    echo "❌ Error: No se encontró database/02_authentication_system.sql"
    exit 1
fi

echo "📋 Configuraciones necesarias antes de continuar:"
echo "1. Configura Google OAuth en Google Cloud Console"
echo "2. Configura las credenciales en Supabase Dashboard"
echo "3. Ajusta las variables de entorno de GitHub Secrets"
echo ""

read -p "¿Has completado la configuración de Google OAuth? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "⚠️  Por favor completa la configuración OAuth primero."
    echo "📖 Ve la guía: docs/GOOGLE_OAUTH_SETUP.md"
    exit 1
fi

echo "📄 Aplicando script de tablas de autenticación..."

# Mostrar el archivo SQL que se va a ejecutar
echo "📂 Archivo a ejecutar: database/02_authentication_system.sql"
echo ""

# Mostrar instrucciones para ejecutar manualmente
echo "🔧 INSTRUCCIONES DE EJECUCIÓN:"
echo "1. Abre tu proyecto de Supabase"
echo "2. Ve a SQL Editor"
echo "3. Copia y ejecuta el contenido del archivo database/02_authentication_system.sql"
echo "4. Verifica que las tablas se crearon correctamente"
echo ""
echo "📋 TABLAS QUE SE CREARÁN:"
echo "   • dirigentes_autorizados - Lista blanca de dirigentes"
echo "   • solicitudes_acceso - Solicitudes de nuevos dirigentes"  
echo "   • sesiones_dirigentes - Control de sesiones activas"
echo ""

echo "✅ Script de instalación preparado."
echo "📖 Para más detalles ve: docs/GOOGLE_OAUTH_SETUP.md"
echo ""
echo "🚀 Próximos pasos:"
echo "   1. Ejecutar el SQL en Supabase Dashboard"
echo "   2. Configurar Google OAuth"
echo "   3. Agregar dirigentes autorizados"
echo "   4. Testear el flujo de autenticación"