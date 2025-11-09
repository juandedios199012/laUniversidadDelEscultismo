# 🎯 INSTALACIÓN DEL BACKEND - SISTEMA SCOUT

## 📋 Scripts que necesitas ejecutar EN ORDEN

### ✅ **OPCIÓN A: Instalación paso a paso (Recomendado)**

Ejecuta estos 3 scripts EN ORDEN en tu consola SQL de Supabase:

#### 1️⃣ **Sistema Base**
```sql
-- Archivo: DATABASE_COMPLETE_SYSTEM.sql
-- Funciones: api_buscar_scouts, api_registrar_scout, api_actualizar_scout
```

#### 2️⃣ **Módulos Extendidos** 
```sql
-- Archivo: DATABASE_MODULES_EXTENDED.sql
-- Funciones: api_crear_presupuesto, api_asignar_dirigente, api_registrar_asistencia
```

#### 3️⃣ **Módulos Finales**
```sql
-- Archivo: DATABASE_FINAL_MODULES.sql  
-- Funciones: api_dashboard_principal, api_crear_actividad, api_crear_programa_semanal
```

### ✅ **OPCIÓN B: Instalación completa de una vez**

```sql
-- Archivo: SCRIPT_MAESTRO_SISTEMA_COMPLETO.sql
-- Contiene: TODO el sistema completo
```

---

## 🔧 **INSTRUCCIONES PASO A PASO**

### 1. **Accede a Supabase Dashboard**
   - Ve a: https://app.supabase.com
   - Selecciona tu proyecto
   - Ve a **SQL Editor** en el menú lateral

### 2. **Ejecuta los scripts**
   - Haz clic en **"New query"**
   - Copia y pega el contenido del archivo SQL
   - Haz clic en **"Run"** 
   - Repite para cada archivo EN ORDEN

### 3. **Verifica la instalación**
   ```sql
   -- Probar dashboard
   SELECT api_dashboard_principal();
   
   -- Probar búsqueda de scouts
   SELECT api_buscar_scouts('{"estado": "ACTIVO"}'::jsonb);
   ```

---

## ⚡ **FUNCIONES QUE SE INSTALARÁN**

| Categoría | Función | Descripción |
|-----------|---------|-------------|
| 📊 **Dashboard** | `api_dashboard_principal()` | Estadísticas del grupo |
| 👥 **Scouts** | `api_buscar_scouts(filtros)` | Búsqueda y listado |
| 👥 **Scouts** | `api_registrar_scout(datos, familiar)` | Registro completo |
| 👥 **Scouts** | `api_actualizar_scout(id, datos)` | Actualización |
| 👥 **Scouts** | `api_eliminar_scout(id)` | Eliminación lógica |
| 📦 **Inventario** | `api_crear_item_inventario(datos)` | Crear items |
| 📦 **Inventario** | `api_registrar_movimiento(datos)` | Movimientos |
| 💰 **Presupuestos** | `api_crear_presupuesto(datos)` | Crear presupuesto |
| 💰 **Presupuestos** | `api_ejecutar_gasto_presupuesto(datos)` | Registrar gasto |
| 🎯 **Actividades** | `api_crear_actividad(datos)` | Crear actividad |
| 🎯 **Actividades** | `api_inscribir_scout_actividad(scout, actividad)` | Inscripción |

---

## 🆘 **SOLUCIÓN DE PROBLEMAS**

### ❌ **Error: "function already exists"**
**Solución:** Es normal en re-ejecuciones. Los scripts usan `CREATE OR REPLACE FUNCTION`.

### ❌ **Error: "permission denied"**  
**Solución:** Verifica que tu usuario tenga permisos de administrador en Supabase.

### ❌ **Error: "table does not exist"**
**Solución:** Ejecuta los scripts EN ORDEN. El primer script crea las tablas necesarias.

### ❌ **Error: "invalid json"**
**Solución:** Verifica la sintaxis JSON en los parámetros de prueba.

---

## 🎉 **¡DESPUÉS DE LA INSTALACIÓN!**

Una vez ejecutados los scripts:

1. ✅ **Tu frontend funcionará sin errores 404/400**
2. ✅ **Las estadísticas se calcularán dinámicamente** 
3. ✅ **Todas las operaciones CRUD estarán disponibles**
4. ✅ **El sistema seguirá la arquitectura de microservicios**

**¡Tu sistema Scout estará completamente funcional!** 🚀