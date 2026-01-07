# 📄 Cómo Generar el PDF DNGI-03

## 🎯 OPCIÓN 1: Desde el Diseñador PDF (Para pruebas)

### Pasos:

1. **Ve al módulo "Diseñador PDF"** en el menú lateral
2. **Selecciona** "DNGI-03 - Registro Institucional"
3. **Obtén un ID de Scout:**
   - Ve a "Registro Scout" o "Lista de Scouts"
   - Copia el ID del scout (está en la base de datos)
   - O usa la consola del navegador: 
     ```javascript
     // Abre las herramientas de desarrollador (F12)
     // Ve a Console y ejecuta:
     const scouts = await supabase.from('scouts').select('id, nombres, apellidos').limit(5);
     console.table(scouts.data);
     ```

4. **Pega el ID** en el campo "ID del Scout"
5. **Haz clic en "Ver Vista Previa"**

---

## 🎯 OPCIÓN 2: Desde Registro de Scouts (Recomendado)

### Necesitas agregar el botón de PDF en el listado:

Te voy a modificar el componente para que tengas un botón de "Generar PDF" en cada scout.

---

## 🎯 OPCIÓN 3: Usar la Consola de Supabase

### Si no tienes scouts registrados:

1. Ve a tu dashboard de Supabase
2. Abre la tabla `scouts`
3. Copia algún `id` de scout existente
4. Úsalo en el Diseñador PDF

---

## 🔍 SOLUCIÓN AL PROBLEMA ACTUAL

El problema que ves es que **no estás ingresando un ID de Scout válido**. El módulo "Diseñador PDF" necesita:

1. Un ID real de un scout en la base de datos
2. O crear datos de prueba automáticamente

### Te voy a hacer dos cosas:

1. ✅ **Agregar un botón en Registro de Scouts** para generar el PDF directamente
2. ✅ **Mejorar el Diseñador PDF** para cargar scouts automáticamente

---

## 📝 PRÓXIMOS PASOS

Dime cuál prefieres:
- **A)** Agrego el botón en el listado de scouts
- **B)** Mejoro el diseñador PDF para mostrar scouts disponibles
- **C)** Ambas opciones

¿Cuál prefieres?
