# 🚀 Guía de Aplicación Manual de Database Functions

## ⚠️ **PROBLEMA IDENTIFICADO**

Los tipos `categoria_inventario_enum`, `estado_item_enum`, `tipo_movimiento_enum`, etc. no existen en la base de datos, causando el error:

```
ERROR: 42704: type categoria_inventario_enum does not exist
```

## 🛠️ **SOLUCIÓN PASO A PASO**

### **Paso 1: Acceder al Dashboard de Supabase**

1. Abrir el navegador
2. Ir a: https://supabase.com/dashboard
3. Hacer login con tu cuenta
4. Seleccionar el proyecto del Sistema Scout Lima 12

### **Paso 2: Ir al SQL Editor**

1. En el menú lateral, hacer clic en **"SQL Editor"**
2. Hacer clic en **"New query"**

### **Paso 3: Aplicar el Esquema Completo**

**3.1 Copiar y pegar el contenido completo del archivo:**
```
database/01_schema.sql
```

**3.2 Ejecutar la consulta haciendo clic en "Run"**

⚠️ **IMPORTANTE**: Este archivo ahora incluye:
- ✅ Todos los tipos enum necesarios (categoria_inventario_enum, etc.)
- ✅ Todas las tablas del sistema (inventario, movimientos_inventario, etc.)
- ✅ Índices optimizados
- ✅ Triggers y constraints

### **Paso 4: Aplicar las Funciones de Inventario**

**4.1 Nueva consulta en SQL Editor**

**4.2 Copiar y pegar el contenido del archivo:**
```
database/05_functions_inventario.sql
```

**4.3 Ejecutar la consulta**

✅ Ahora debería funcionar sin errores porque los tipos ya existen

### **Paso 5: Aplicar las Funciones de Scouts**

**5.1 Nueva consulta en SQL Editor**

**5.2 Copiar y pegar el contenido del archivo:**
```
database/06_functions_scouts.sql
```

**5.3 Ejecutar la consulta**

### **Paso 6: Verificar que Todo Funciona**

**6.1 Probar una función de inventario:**
```sql
SELECT obtener_inventario_completo();
```

**6.2 Probar una función de scouts:**
```sql
SELECT obtener_scouts('{}');
```

## 🎯 **ORDEN CORRECTO DE APLICACIÓN**

```
1. ✅ database/01_schema.sql          (ESQUEMA COMPLETO - YA ACTUALIZADO)
2. ✅ database/05_functions_inventario.sql  (FUNCIONES DE INVENTARIO)
3. ✅ database/06_functions_scouts.sql      (FUNCIONES DE SCOUTS)
4. 📋 database/07_functions_presupuestos.sql (OPCIONAL)
5. 📋 database/08_functions_asistencia.sql   (OPCIONAL)
... (resto de módulos)
```

## 🔍 **VERIFICACIÓN RÁPIDA**

Una vez aplicado el esquema y las funciones, verificar en SQL Editor:

```sql
-- Verificar tipos enum creados
SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;

-- Verificar tablas creadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Verificar funciones creadas
SELECT proname FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' AND proname LIKE 'obtener_%' 
ORDER BY proname;
```

## 🚀 **DESPUÉS DE LA APLICACIÓN**

1. **Reiniciar el servidor web:** `npm run dev`
2. **Probar la aplicación:** http://localhost:3000
3. **Verificar el módulo de registro de scouts**
4. **Confirmar que los errores han desaparecido**

## 📚 **ARCHIVOS CLAVE ACTUALIZADOS**

- ✅ `database/01_schema.sql` - **ACTUALIZADO** con tipos de inventario y tablas
- ✅ `src/services/scoutService.ts` - **CORREGIDO** con funciones existentes
- ✅ Documentación API completa disponible

---

**🎉 Una vez completados estos pasos, el Sistema Scout Lima 12 estará completamente funcional con todas las Database Functions operativas!**