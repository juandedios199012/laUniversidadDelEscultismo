# 📊 Módulo de Reportes - Sistema Scout

Sistema completo de generación de reportes en PDF y Word para el sistema de gestión Scout.

## 🎯 Características

- ✅ **Múltiples formatos**: PDF y Word (DOCX)
- ✅ **Tipos de reportes**: Perfil de Scout, Asistencia, Progreso
- ✅ **Diseño profesional**: Plantillas personalizadas y reutilizables
- ✅ **Integración con Supabase**: Datos en tiempo real
- ✅ **Exportación directa**: Descarga inmediata al navegador
- ✅ **TypeScript**: Tipado completo y seguro

## 📁 Estructura del Módulo

```
src/modules/reports/
├── components/          # Componentes React UI
│   ├── ReportManager.tsx           # Gestor principal de reportes
│   └── ReportExportButton.tsx      # Botón de exportación
├── templates/           # Plantillas de documentos
│   └── pdf/
│       ├── ScoutReportTemplate.tsx
│       ├── AttendanceReportTemplate.tsx
│       └── ProgressReportTemplate.tsx
├── services/            # Lógica de negocio
│   ├── pdfService.ts               # Generación de PDFs
│   ├── docxService.ts              # Generación de Word
│   └── reportDataService.ts        # Obtención de datos
├── types/               # Tipos TypeScript
│   └── reportTypes.ts
├── styles/              # Estilos para PDFs
│   └── pdfStyles.ts
└── index.ts             # Punto de entrada
```

## 🚀 Uso Básico

### Importar el módulo

```typescript
import { ReportManager } from '@/modules/reports';
```

### Usar el componente principal

```tsx
import { ReportManager } from '@/modules/reports';

function ReportsPage() {
  return (
    <div className="container mx-auto p-6">
      <ReportManager />
    </div>
  );
}
```

## 📖 Ejemplos de Uso Avanzado

### 1. Generar Reporte de Scout Programáticamente

```typescript
import {
  generateAndDownloadPDF,
  ScoutReportTemplate,
  getScoutData,
  generateReportMetadata,
} from '@/modules/reports';

async function downloadScoutReport(scoutId: string) {
  const scoutData = await getScoutData(scoutId);
  const metadata = generateReportMetadata();

  if (scoutData) {
    await generateAndDownloadPDF(
      <ScoutReportTemplate scout={scoutData} metadata={metadata} />,
      `reporte_scout_${scoutData.numeroRegistro}`
    );
  }
}
```

### 2. Generar Reporte de Asistencia en Word

```typescript
import {
  generateAndDownloadDOCX,
  createAttendanceReportDOCX,
  getAttendanceData,
  generateReportMetadata,
} from '@/modules/reports';

async function downloadAttendanceReportWord() {
  const attendanceData = await getAttendanceData({
    dateFrom: '2024-01-01',
    dateTo: '2024-12-31',
  });
  
  const metadata = generateReportMetadata();
  const doc = createAttendanceReportDOCX(
    attendanceData,
    metadata,
    { from: '2024-01-01', to: '2024-12-31' }
  );

  await generateAndDownloadDOCX(doc, 'asistencia_2024');
}
```

### 3. Crear Plantilla PDF Personalizada

```typescript
import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { baseStyles } from '@/modules/reports';

export const CustomReportTemplate = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <View style={baseStyles.header}>
          <Text style={baseStyles.title}>Mi Reporte Personalizado</Text>
        </View>
        
        <View style={baseStyles.section}>
          <Text style={baseStyles.text}>Contenido aquí...</Text>
        </View>
      </Page>
    </Document>
  );
};
```

### 4. Usar Botón de Exportación Independiente

```typescript
import { ReportExportButton, ExportFormat } from '@/modules/reports';

function MyCustomReport() {
  const handleExport = async (format: ExportFormat) => {
    // Tu lógica de exportación
    console.log(`Exportando en formato: ${format}`);
    return { status: 'success', fileName: 'mi-reporte' };
  };

  return (
    <ReportExportButton
      onExport={handleExport}
      formats={[ExportFormat.PDF, ExportFormat.DOCX]}
      label="Descargar Reporte"
    />
  );
}
```

## 🎨 Personalización de Estilos

Los estilos están centralizados en `styles/pdfStyles.ts`:

```typescript
import { colors, fontSizes, spacing } from '@/modules/reports';

// Usar colores predefinidos
const myColor = colors.primary; // #0066CC

// Usar tamaños de fuente
const myFontSize = fontSizes.heading; // 16

// Usar espaciado
const mySpacing = spacing.lg; // 16
```

## 🔧 Configuración de Supabase

Asegúrate de tener las siguientes tablas en Supabase:

```sql
-- Tabla scouts
scouts (
  id, nombre, apellido, fecha_nacimiento, rama, patrulla,
  numero_registro, fecha_ingreso, direccion, telefono, email, etc.
)

-- Tabla asistencias
asistencias (
  id, scout_id, fecha, presente, justificado, motivo
)

-- Tablas de Progresión (módulo de etapas: Pista, Senda, Rumbo, Travesía)
etapas_progresion (id, codigo, nombre, descripcion, orden)
areas_crecimiento (id, codigo, nombre, icono, color)
objetivos_educativos (id, etapa_id, area_id, titulo, descripcion)
progreso_scout (id, scout_id, objetivo_id, completado, fecha_completado)
scout_etapa (id, scout_id, etapa_id, fecha_inicio, fecha_fin)

-- Tablas de Especialidades (módulo separado)
especialidades (id, codigo, nombre, area_id, descripcion)
scout_especialidad_progreso (id, scout_id, especialidad_id, fase_exploracion, fase_taller, fase_desafio)
```

## 📦 Dependencias

El módulo utiliza:

- **@react-pdf/renderer** (^4.x): Generación de PDFs
- **docx** (^9.x): Generación de archivos Word
- **file-saver** (^2.x): Descarga de archivos
- **lucide-react**: Iconos

## 🎯 Tipos de Reportes Disponibles

### 1. Reporte de Scout (SCOUT_PROFILE)
- Información personal completa
- Datos de contacto
- Información familiar
- Observaciones

### 2. Reporte de Asistencia (ATTENDANCE)
- Registro por fechas
- Estadísticas de asistencia
- Estados: Presente, Ausente, Justificado
- Vista en formato tabla

### 3. Reporte de Progreso (PROGRESS)
- Etapas de progresión: Pista, Senda, Rumbo, Travesía
- Progreso por áreas de crecimiento (Corporalidad, Creatividad, Carácter, etc.)
- Objetivos educativos completados
- Estados: Completado, En Progreso, Pendiente
- Barras de progreso visuales

### 4. Reporte de Especialidades (ESPECIALIDADES)
- Especialidades asignadas a cada scout
- Fases: Exploración, Taller, Desafío
- Estados de cada fase
- Dashboard con métricas

## 🔍 Filtros Disponibles

```typescript
interface ReportFilters {
  dateFrom?: string;      // Fecha inicial
  dateTo?: string;        // Fecha final
  rama?: string;          // Filtrar por rama
  patrulla?: string;      // Filtrar por patrulla
  scoutIds?: string[];    // IDs específicos de scouts
}
```

## 💡 Mejores Prácticas

1. **Reutilización**: Usa las plantillas existentes como base
2. **Estilos**: Aprovecha los estilos predefinidos en `pdfStyles.ts`
3. **Datos**: Valida los datos antes de generar reportes
4. **Errores**: Maneja errores con try-catch
5. **Performance**: Para reportes grandes, considera paginación

## 🐛 Solución de Problemas

### Error: "Cannot find module '@/modules/reports'"

Asegúrate de tener configurado el alias en `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Los PDFs no se descargan

Verifica que `file-saver` esté instalado correctamente:

```bash
npm install file-saver @types/file-saver
```

### Estilos no se aplican en PDF

Los estilos de @react-pdf/renderer son diferentes a CSS normal. Usa solo propiedades soportadas por la librería.

## 📝 Próximas Mejoras

- [ ] Reporte de resumen grupal
- [ ] Historial de actividades
- [ ] Gráficos y estadísticas
- [ ] Envío de reportes por email
- [ ] Programación de reportes automáticos
- [ ] Plantillas configurables desde UI

## 🤝 Contribuir

Para agregar un nuevo tipo de reporte:

1. Crear plantilla en `templates/pdf/`
2. Agregar tipo en `types/reportTypes.ts`
3. Implementar servicio de datos en `services/reportDataService.ts`
4. Actualizar `ReportManager.tsx`

## 📄 Licencia

Parte del sistema de gestión Scout - Grupo Scout Lima 12
