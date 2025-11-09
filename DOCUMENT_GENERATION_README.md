# 📋 Sistema de Generación de Documentos - Anexo-3

## 🎯 Propósito

Sistema completo para la generación automática de documentos Word basado en el template "Anexo-3-FORMATO-DE-DATOS-PERSONALES" del Grupo Scout Lima 12, implementando **Clean Architecture** y principios **SOLID**.

## 🏗️ Arquitectura

```
src/
├── 🎯 domain/
│   └── entities/
│       ├── DocumentTemplate.ts    # Template configuration & structure
│       ├── DocumentData.ts        # Scout, Group & Activity data types
│       └── Common.ts              # Result pattern & utilities
│
├── 📋 application/
│   └── use-cases/
│       └── GenerateDocumentUseCase.ts  # Business logic orchestration
│
├── 🔧 infrastructure/
│   ├── document-engines/
│   │   ├── IDocumentEngine.ts          # Engine interface
│   │   └── DocxDocumentEngine.ts       # Word document implementation
│   ├── repositories/
│   │   └── TemplateRepository.ts       # Template storage & management
│   ├── factories/
│   │   └── Anexo3DocumentFactory.ts    # Document generation factory
│   └── templates/
│       └── Anexo3PersonalDataTemplate.ts  # Specific template config
│
└── 🖥️ components/
    ├── documents/
    │   └── Anexo3DocumentGenerator.tsx    # React UI component
    └── demo/
        └── DocumentSystemDemo.tsx         # Complete demo
```

## ✨ Características Clave

### 🏛️ Clean Architecture
- **Domain Layer**: Entidades puras sin dependencias externas
- **Application Layer**: Casos de uso y lógica de negocio
- **Infrastructure Layer**: Implementaciones concretas y frameworks
- **UI Layer**: Componentes React para interfaz de usuario

### 🎯 SOLID Principles
- **S**ingle Responsibility: Cada clase tiene una responsabilidad específica
- **O**pen/Closed: Extensible para nuevos templates y formatos
- **L**iskov Substitution: Interfaces consistentes para document engines
- **I**nterface Segregation: Interfaces específicas y cohesivas
- **D**ependency Inversion: Dependencias hacia abstracciones

### 📄 Template System
- Configuración declarativa de templates
- Mapeo automático de datos scout a campos del documento
- Soporte para headers, footers y firmas
- Validación de permisos por rol de usuario

### 🔧 Document Engines
- Arquitectura plugin para múltiples formatos
- Engine DOCX implementado con `docx.js`
- Extensible para PDF, HTML, etc.

## 🚀 Uso Rápido

### 1. Componente React

```tsx
import Anexo3DocumentGenerator from './components/documents/Anexo3DocumentGenerator';

function App() {
  return (
    <Anexo3DocumentGenerator
      scoutId="L12-2024-001"
      userRole="dirigente"
      userName="Director Scout"
      onDocumentGenerated={(response) => {
        console.log('Documento generado:', response.filename);
      }}
    />
  );
}
```

### 2. Uso Programático

```typescript
import { Anexo3DocumentFactory } from './infrastructure/factories/Anexo3DocumentFactory';
import { TemplateRepository } from './infrastructure/repositories/TemplateRepository';
import { DocxDocumentEngine } from './infrastructure/document-engines/DocxDocumentEngine';

// Configurar dependencias
const templateRepo = new TemplateRepository();
const docEngine = new DocxDocumentEngine();
const factory = new Anexo3DocumentFactory(templateRepo, docEngine);

// Generar documento
const request = {
  templateId: 'anexo-3-datos-personales',
  scoutId: 'L12-2024-001',
  outputFormat: 'docx' as const,
  generatedBy: 'Sistema Scout',
  userRole: 'dirigente'
};

const result = await factory.generatePersonalDataDocument(request);

if (result.isSuccess) {
  const document = result.getValue();
  // Documento listo: document.documentBuffer
}
```

## 📊 Estructura del Anexo-3

El template incluye las siguientes secciones:

### I. Datos Personales
- Nombres y apellidos
- Fecha de nacimiento y edad
- Tipo y número de documento
- Contacto (celular, email)

### II. Dirección de Residencia
- Departamento, provincia, distrito
- Dirección completa

### III. Información Educativa/Laboral
- Centro de estudios
- Ocupación y centro laboral

### IV. Información Scout
- Código scout y rama actual
- Fecha de ingreso y tiempo en movimiento
- Patrulla y cargo

### V. Contacto de Emergencia
- Datos del contacto principal
- Teléfonos y dirección

### VI. Observaciones
- Notas adicionales del scout

## 🔒 Sistema de Permisos

| Rol        | Ver Templates | Generar Docs | Editar Templates |
|------------|---------------|--------------|------------------|
| `admin`    | ✅            | ✅           | ✅               |
| `dirigente`| ✅            | ✅           | ❌               |
| `secretario`| ✅           | ✅           | ❌               |
| `padre`    | ⚠️ Limitado   | ❌           | ❌               |

## 🎨 Personalización

### Agregar Nuevo Template

```typescript
import { DocumentTemplate, DocumentType } from './domain/entities/DocumentTemplate';

const customTemplate: DocumentTemplate = {
  id: 'mi-nuevo-template',
  name: 'Mi Nuevo Formato',
  type: DocumentType.CUSTOM,
  sections: [
    {
      id: 'seccion-1',
      title: 'Mi Sección',
      fields: [
        {
          id: 'campo-1',
          name: 'miCampo',
          label: 'Mi Campo',
          type: FieldType.TEXT,
          dataSource: 'scout.miDato'
        }
      ]
    }
  ],
  // ... más configuración
};

await templateRepository.save(customTemplate);
```

### Agregar Nuevo Engine

```typescript
import { IDocumentEngine } from './infrastructure/document-engines/IDocumentEngine';

class PdfDocumentEngine implements IDocumentEngine {
  async generateDocument(template, data, options) {
    // Implementar generación PDF
    // usando jsPDF, PDFKit, etc.
  }
  
  getSupportedFormats() {
    return ['pdf'];
  }
}
```

## 🧪 Testing

### Ejecutar Demo

```bash
npm run dev
```

Navegar a la página con el componente `DocumentSystemDemo` para ver el sistema completo en funcionamiento.

### Casos de Prueba

1. **Generación Exitosa**: Scout válido + template disponible
2. **Errores de Permisos**: Usuario sin acceso al template
3. **Datos Faltantes**: Scout inexistente o datos incompletos
4. **Formatos Múltiples**: Generar tanto DOCX como PDF

## 🔧 Dependencias

### Principales
- `docx`: Generación de documentos Word
- `react`: Interfaz de usuario
- `typescript`: Type safety

### Opcionales para Extensión
- `jspdf` o `pdfkit`: Para engine PDF
- `handlebars`: Templates dinámicos avanzados
- `nodemailer`: Envío automático por email

## 📈 Roadmap

### ✅ Implementado
- [x] Clean Architecture completa
- [x] Template Anexo-3 configurado
- [x] Document Engine DOCX
- [x] Componente React funcional
- [x] Sistema de permisos básico
- [x] Error handling robusto

### 🔄 En Progreso
- [ ] Integración con base de datos real
- [ ] Engine PDF nativo
- [ ] Templates adicionales (médico, actividades)
- [ ] API REST endpoints

### 🚀 Próximas Funcionalidades
- [ ] Editor visual de templates
- [ ] Generación masiva de documentos
- [ ] Firmas digitales
- [ ] Versionado de documentos
- [ ] Audit trail completo
- [ ] Integración con sistema de notificaciones

## 🤝 Contribución

1. Fork del repositorio
2. Crear feature branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Add nueva funcionalidad'`
4. Push branch: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📝 Licencia

Proyecto interno del Grupo Scout Lima 12 - La Universidad del Escultismo.

---

> 🏕️ **Nota**: Este sistema fue diseñado siguiendo las mejores prácticas de desarrollo de software, enfocándose en mantenibilidad, escalabilidad y extensibilidad para futuras necesidades del grupo scout.