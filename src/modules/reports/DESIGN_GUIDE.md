# 🎨 Guía de Diseño de PDFs - Previsualización en Tiempo Real

## ✅ ¿Cómo Ver el Diseño Mientras Trabajas?

Tienes **2 opciones** para ver cómo va quedando tu PDF:

---

## 📺 OPCIÓN 1: Vista Previa en el Navegador (Recomendada)

### Componente `ReportPreview` ya creado

```tsx
import { ReportPreview } from '@/modules/reports';

function MyPage() {
  return <ReportPreview />;
}
```

### ¿Cómo usarlo?

1. **Abre la página de reportes:**
   ```
   http://localhost:3000/reportes
   ```

2. **Selecciona tab "Vista Previa (Diseño)"**

3. **Elige tipo de reporte y carga datos**

4. **¡Ves el PDF en tiempo real en el navegador!**

### Flujo de trabajo:

```
1. Editas plantilla en: src/modules/reports/templates/pdf/ScoutReportTemplate.tsx
2. Guardas el archivo
3. Vite recarga automáticamente
4. Clic en "Ver Vista Previa"
5. ¡Ves los cambios al instante!
```

---

## 🔄 OPCIÓN 2: Descargar y Abrir

Menos conveniente pero funciona:

```tsx
// En ReportManager, clic en "Descargar PDF"
// Se descarga → abres en navegador/PDF reader
// Haces cambios → descargas de nuevo → refrescas PDF
```

---

## 💻 Workflow Recomendado

### Para diseñar/modificar una plantilla:

```bash
# Terminal 1: Servidor corriendo
npm run dev

# Terminal 2: Editor de código
# Editas: src/modules/reports/templates/pdf/MiTemplate.tsx
```

### En el navegador:

1. Abre: `http://localhost:3000/reportes`
2. Tab: **"Vista Previa (Diseño)"**
3. Selecciona tipo de reporte
4. Clic "Ver Vista Previa"

### Ahora puedes:

- ✅ Ver el PDF en pantalla completa
- ✅ Hacer scroll para ver todas las páginas
- ✅ Hacer zoom con los controles del viewer
- ✅ Editar código y recargar para ver cambios

---

## 🎯 Ejemplo Práctico: Crear el Formato de Registro

### Paso 1: Crea la plantilla

```typescript
// src/modules/reports/templates/pdf/InstitutionalRegistrationTemplate.tsx

import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { baseStyles } from '../../styles/pdfStyles';

export const InstitutionalRegistrationTemplate = ({ scout, metadata }) => {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <View style={baseStyles.header}>
          <Text style={baseStyles.title}>
            FORMATO DE REGISTRO INSTITUCIONAL
          </Text>
        </View>
        
        {/* Ir agregando elementos... */}
        <Text>Apellidos: {scout.apellido}</Text>
        <Text>Nombres: {scout.nombre}</Text>
        
      </Page>
    </Document>
  );
};
```

### Paso 2: Agregar al ReportPreview

Edita `src/modules/reports/components/ReportPreview.tsx`:

```typescript
// Importar nueva plantilla
import InstitutionalRegistrationTemplate from '../templates/pdf/InstitutionalRegistrationTemplate';

// Agregar al selector
<option value="INSTITUTIONAL">Registro Institucional</option>

// Agregar al renderPDFContent
case 'INSTITUTIONAL':
  return <InstitutionalRegistrationTemplate scout={data.scout} metadata={data.metadata} />;
```

### Paso 3: Ver en tiempo real

1. Guarda archivos
2. Ve a navegador
3. Selecciona "Registro Institucional"
4. ¡Lo ves renderizado!

### Paso 4: Iterar diseño

```
Editas código → Guardas → Alt+Tab al navegador → Recarga → ¡Ves cambios!
```

---

## 🛠️ Tips para Diseñar

### 1. Usa los estilos predefinidos

```typescript
import { baseStyles, colors, spacing } from '../../styles/pdfStyles';

<Text style={baseStyles.title}>Mi Título</Text>
<View style={{ padding: spacing.md }}>...</View>
```

### 2. Crea estilos específicos

```typescript
const myStyles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
  },
  table: {
    width: '100%',
    border: '1px solid black',
  }
});
```

### 3. Usa flexbox (como CSS)

```typescript
<View style={{ 
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
  <Text>Izquierda</Text>
  <Text>Derecha</Text>
</View>
```

### 4. Tablas con bordes

```typescript
<View style={{ 
  borderWidth: 1, 
  borderColor: '#000',
  padding: 10 
}}>
  <Text>Celda</Text>
</View>
```

---

## 📱 PDFViewer Features

El componente `PDFViewer` incluye:

- ✅ Zoom in/out
- ✅ Navegación entre páginas
- ✅ Pantalla completa
- ✅ Descarga directa
- ✅ Impresión

---

## ⚡ Hot Reload

Vite recarga automáticamente:

```
Cambias código → Guardas → 
Vite recarga módulo → 
Clic "Ver Vista Previa" → 
¡Ves nueva versión!
```

---

## 🎨 Propiedades CSS Soportadas

@react-pdf/renderer NO soporta todas las propiedades CSS. Solo:

### ✅ Soportadas:
- flexbox (flexDirection, justifyContent, alignItems)
- padding, margin
- backgroundColor, color
- fontSize, fontFamily, fontWeight
- borderWidth, borderColor, borderRadius
- width, height, position

### ❌ NO Soportadas:
- float, clear
- grid
- animation
- transform (parcial)
- muchas propiedades CSS modernas

### 📖 Referencia completa:
https://react-pdf.org/styling

---

## 🚀 Empezar Ahora

```bash
# 1. Asegúrate de que el servidor esté corriendo
npm run dev

# 2. Abre en navegador
http://localhost:3000/reportes

# 3. Ve a tab "Vista Previa (Diseño)"

# 4. ¡Empieza a diseñar!
```

---

## 💡 Próximo Paso

¿Quieres que cree la plantilla del **Formato de Registro Institucional** que mostraste en la imagen?

Tomaría 30-60 minutos y podrías verla en tiempo real con el `ReportPreview` que acabamos de crear.
