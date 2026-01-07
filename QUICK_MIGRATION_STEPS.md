# 🚀 MIGRACIÓN RÁPIDA - Pasos Esenciales

## ⚠️ IMPORTANTE
Esta migración convierte tu sistema de **scouts** a **personas + roles**. Los datos antiguos se preservan en tablas `*_legacy`.

## 📝 Pre-requisitos
- [ ] Backup de la base de datos
- [ ] Servidor de desarrollo detenido (`Ctrl+C` en terminal)

## 🔧 Pasos de Ejecución

### 1️⃣ Abrir Supabase SQL Editor
https://supabase.com/dashboard → Tu Proyecto → SQL Editor → New Query

### 2️⃣ Ejecutar los 3 Scripts en Orden

#### Script 1: Crear Estructura (Personas + Roles)
**Archivo:** `database/sistema_personas_roles.sql`
- Copia TODO el contenido del archivo
- Pega en SQL Editor
- Click **RUN**
- ✅ Debe decir "Success" y mostrar: "Sistema de Personas y Roles creado exitosamente"

**Qué hace:**
- Crea tabla `personas` (base para todos)
- Crea tabla `roles_persona` (roles múltiples)
- Crea tabla `scouts` nueva (referencia a personas)
- Crea tabla `dirigentes` (referencia a personas)
- Crea tabla `familiares_scout` nueva (referencia a personas)
- Crea tabla `asignaciones_dirigente_rama`
- Renombra tablas antiguas a `*_legacy` como backup

#### Script 2: Migrar Datos
**Archivo:** `database/migracion_personas_roles.sql`
- Copia TODO el contenido del archivo
- Pega en SQL Editor (nueva query)
- Click **RUN**
- ✅ Debe mostrar resumen de migración con contadores

**Qué hace:**
- Migra scouts a personas + crea roles SCOUT
- Migra familiares a personas + crea roles PADRE_FAMILIA
- Crea dirigentes + roles DIRIGENTE para scouts con `es_dirigente=true`
- Crea asignaciones dirigente-rama
- Muestra resumen completo

#### Script 3: Crear Funciones API
**Archivo:** `database/funciones_api_personas.sql`
- Copia TODO el contenido del archivo
- Pega en SQL Editor (nueva query)
- Click **RUN**
- ✅ Debe decir "Success" y mostrar: "Funciones API para sistema personas/roles creadas exitosamente"

**Qué hace:**
- Crea función `api_registrar_persona` (crear/actualizar personas)
- Crea función `api_registrar_scout_completo` (registrar scout + familiar)
- Crea f migrados
- Dirigentes migrados
- Familiares migrados
- Roles por tipo (SCOUT, DIRIGENTE, PADRE_FAMILIA)
- Personas con múltiples roles

### 4️⃣ Ejecutar Script de Funciones API

**Archivo:** `database/funciones_api_personas.sql`
- Copia TODO el contenido del archivo
- Pega en SQL Editor (nueva query)
- Click **RUN**
- ✅ Debe crear las funciones RPC necesarias

### 5️⃣ Reiniciar y Probar

```bash
# Terminal: Iniciar servidor
npm run dev
```

Luego en el navegador:
1. Ir **Script 1** ejecutado - `sistema_personas_roles.sql` (estructura personas + roles)
- [ ] **Script 2** ejecutado - `migracion_personas_roles.sql` (migración de datos)
- [ ] **Script 3** ejecutado - `funciones_api_personas.sql` (funciones API/RPC)
- [ ] Verificación muestra contadores correctos
- [ ] Servidor reiniciado con `npm run dev`
## ✅ Checklist Completo
- [ ] Script 1 ejecutado (estructura personas + roles)
- [ ] Script 2 ejecutado (migración de datos)
- [ ] Script 3 ejecutado (funciones API)
- [ ] Verificación muestra contadores correctos
- [ ] Servidor reiniciado
- [ ] Scout de prueba registrado exitosamente

## 🐛 Problemas Comunes

**Error: "relation personas already exists"**
→ El script incluye DROP TABLE, esto es normal. Continúa.

**Error: "column does not exist"**
→ Asegúrate de ejecutar Script 1 primero completamente

**Error: "relation scouts_legacy does not exist"**
→ No hay datos antiguos para migrar, omite Script 2

**Frontend: "RPC function not found"**
→ Ejecutar Script 3 (funciones API) y reiniciar servidor

## 📚 Documentación Completa
Ver `MIGRATION_EXECUTION_GUIDE.md` para guía detallada con troubleshooting.

---
**Tiempo estimado:** 5-10 minutos
**Última actualización:** 3 de enero de 2026
