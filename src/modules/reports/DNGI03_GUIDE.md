# 📄 Guía del Formato DNGI-03

## ✅ ¿Qué se ha creado?

Se ha implementado el **Formato de Registro Institucional DNGI-03** completo con las 4 páginas del documento oficial de Scouts del Perú.

## 🎯 Cómo probarlo

### 1. Ve al Diseñador PDF
- En el menú lateral, haz clic en **"📄 Diseñador PDF"**

### 2. Selecciona el formato
- En el dropdown "Tipo de Reporte", selecciona: **"📄 DNGI-03 - Registro Institucional"**

### 3. Ingresa el ID del Scout
- Escribe el ID de un scout de tu base de datos
- Por ejemplo: `1`, `2`, `3`, etc.

### 4. Haz clic en "Cargar Vista Previa"
- Verás el PDF completo de 4 páginas en tiempo real

## 📊 Datos que extrae de Supabase

El formato DNGI-03 **SÍ extrae datos** automáticamente de tu tabla `scouts`:

### ✅ Datos que se llenan automáticamente:
- **Apellidos y Nombres** → `scout.apellido`, `scout.nombre`
- **Fecha de Nacimiento** → `scout.fechaNacimiento`
- **Número de Documento** → `scout.numeroRegistro`
- **Dirección** → `scout.direccion`
- **Email Personal** → `scout.email`
- **Celular** → `scout.telefono`
- **Nombres del Padre** → `scout.nombrePadre`
- **Nombres de la Madre** → `scout.nombreMadre`
- **Observaciones** → `scout.observaciones`

### 📝 Campos que quedan en blanco (por ahora):
Estos campos requieren datos de otros módulos que aún no existen:
- Sexo
- Tipo de documento
- Código postal
- Correo institucional
- Teléfono domicilio
- Religión
- Centro de estudios y año
- Datos médicos (grupo sanguíneo, seguro, discapacidad)
- Datos completos de padres (documento, correos, ocupación, etc.)

## 🔄 Cómo agregar más datos

### Opción 1: Agregar columnas a la tabla scouts
```sql
ALTER TABLE scouts ADD COLUMN sexo VARCHAR(10);
ALTER TABLE scouts ADD COLUMN tipo_documento VARCHAR(50);
ALTER TABLE scouts ADD COLUMN codigo_postal VARCHAR(10);
ALTER TABLE scouts ADD COLUMN correo_institucional VARCHAR(100);
-- etc...
```

### Opción 2: Crear tabla de padres
```sql
CREATE TABLE padres (
  id UUID PRIMARY KEY,
  scout_id UUID REFERENCES scouts(id),
  tipo VARCHAR(20), -- 'padre' o 'madre'
  apellidos VARCHAR(100),
  nombres VARCHAR(100),
  sexo VARCHAR(10),
  tipo_documento VARCHAR(50),
  numero_documento VARCHAR(20),
  parentesco VARCHAR(50),
  email1 VARCHAR(100),
  email2 VARCHAR(100),
  direccion TEXT,
  departamento VARCHAR(50),
  provincia VARCHAR(50),
  distrito VARCHAR(50),
  profesion VARCHAR(100),
  centro_laboral VARCHAR(100),
  cargo VARCHAR(100),
  celular1 VARCHAR(20),
  celular2 VARCHAR(20),
  telefono_domicilio VARCHAR(20)
);
```

### Opción 3: Modificar la plantilla
Si quieres llenar campos con datos fijos o de prueba:

```tsx
// En DNGI03Template.tsx, línea ~310 (ejemplo)
<View style={[styles.tableCell, styles.tableCellBorder, { width: '15%' }]}>
  <Text>Masculino</Text>  {/* Dato fijo para pruebas */}
</View>
```

## 🎨 Cómo personalizar el diseño

### Cambiar colores de headers
```tsx
// Busca: backgroundColor: '#999'
// Cambia a: backgroundColor: '#4A90E2'
```

### Cambiar tamaño de fuente
```tsx
// En los estilos, busca:
fontSize: 9,
// Cambia a:
fontSize: 10,
```

### Agregar logo
1. Coloca el logo en `/public/logo-scouts.png`
2. En DNGI03Template.tsx, línea ~223:
```tsx
<View style={styles.logoSection}>
  <Image 
    src="/logo-scouts.png" 
    style={styles.logo}
  />
</View>
```

## 🚀 Cómo usar en producción

### Para generar el PDF programáticamente:
```typescript
import { DNGI03Template } from '@/modules/reports';
import { generateAndDownloadPDF } from '@/modules/reports';

// Obtener datos del scout
const scout = await getScoutData(scoutId);

// Generar PDF
await generateAndDownloadPDF(
  <DNGI03Template 
    scout={scout}
    metadata={generateReportMetadata()}
    additionalData={{
      tipoRegistro: 'Renovación',
      fechaRegistro: new Date().toLocaleDateString('es-PE')
    }}
  />,
  `DNGI-03-${scout.nombre}-${scout.apellido}.pdf`
);
```

## 📋 Estructura del archivo

```
src/modules/reports/templates/pdf/DNGI03Template.tsx
├── Página 1: Datos del Miembro Juvenil
│   ├── Tabla principal con 10 filas de datos
│   └── Todos los campos del scout
├── Página 2: Datos de los Padres
│   ├── Tabla del padre/tutor 1
│   └── Tabla de la madre/tutor 2
├── Página 3: Declaración del Apoderado
│   ├── Texto de compromiso
│   └── Lista numerada de 6 declaraciones
└── Página 4: Firma y Anexos
    ├── Declaración final
    ├── Tipo de registro
    ├── Lista de anexos
    ├── Campo de fecha
    ├── Firma
    └── Huella digital
```

## 🔍 Próximos pasos sugeridos

1. **Agregar logo oficial** de Scouts del Perú
2. **Crear tabla de padres** en Supabase
3. **Agregar campos médicos** a la tabla scouts
4. **Implementar firma digital** con tablet o mouse
5. **Captura de huella** digital con dispositivo biométrico
6. **Validación de datos** antes de generar PDF
7. **Envío automático** por email del PDF firmado

## 💡 Tips

- **Vista previa en tiempo real**: Cada cambio que hagas en el código se verá inmediatamente en el diseñador
- **Inspección del PDF**: Puedes hacer zoom in/out en el visor
- **Descarga directa**: Desde el ReportManager puedes descargar directamente
- **Campos vacíos**: Los campos sin datos aparecerán como espacios en blanco

## 🆘 Resolución de problemas

### No veo datos del scout
- Verifica que el ID del scout exista en la tabla
- Revisa la consola del navegador para errores
- Comprueba que la tabla `scouts` tenga las columnas necesarias

### El PDF no se genera
- Verifica que no haya errores de TypeScript
- Revisa que todos los imports sean correctos
- Comprueba que el servidor Vite esté corriendo

### Los estilos se ven mal
- Los estilos PDF son diferentes a CSS
- Usa solo propiedades soportadas por @react-pdf/renderer
- Consulta la documentación: https://react-pdf.org/styling

---

**¡Listo! Tu formato DNGI-03 está completamente funcional y extrayendo datos de Supabase.** 🎉
