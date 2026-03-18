# Arquitectura Escalable para Templates de PDF

## Sistema de Gestión Scout - Grupo Scout Lima 12
**Fecha:** 16 de marzo de 2026  
**Estado:** Propuesta (No implementado)  
**Prioridad:** Baja (El sistema actual es funcional)

---

## 📋 Resumen Ejecutivo

Este documento describe una arquitectura escalable para la generación de PDFs que permite:
- Configurar filas de tablas desde la base de datos
- Modificar templates sin recompilar código
- Soportar múltiples formatos de documentos
- Mantener consistencia entre catálogos y PDFs

---

## 🏗️ Arquitectura Actual vs. Propuesta

### Estado Actual (Funcional)

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
├─────────────────────────────────────────────────────────┤
│  HistoriaMedicaReportTemplate.tsx                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  FILAS HARDCODEADAS EN CÓDIGO                   │   │
│  │  { fila: 'Diabetes', nombres: ['diabetes'] }    │   │
│  │  { fila: 'Asma', nombres: ['asma'] }            │   │
│  │  ...                                             │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  React-PDF renderiza JSX → PDF                   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE                              │
├─────────────────────────────────────────────────────────┤
│  catalogo_condiciones    │  historia_condiciones        │
│  ├── id                  │  ├── nombre                  │
│  └── nombre              │  ├── tratamiento             │
│                          │  └── fecha_diagnostico       │
└─────────────────────────────────────────────────────────┘
```

**Problemas identificados:**
- ❌ Filas duplicadas: código + catálogo BD
- ❌ Cambiar fila = modificar código + deploy
- ❌ Violación de DRY (Don't Repeat Yourself)
- ❌ Violación de OCP (Open/Closed Principle)

---

### Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
├─────────────────────────────────────────────────────────┤
│  HistoriaMedicaReportTemplate.tsx                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  TEMPLATE GENÉRICO                               │   │
│  │  {props.filasCondiciones.map(fila => (          │   │
│  │    <FilaCondicion config={fila} data={data} />  │   │
│  │  ))}                                             │   │
│  └─────────────────────────────────────────────────┘   │
│                         ▲                               │
│                         │ Props                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  PDFConfigService                                │   │
│  │  getFilasTemplate('anexo11_condiciones')        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE                              │
├─────────────────────────────────────────────────────────┤
│  pdf_template_filas (NUEVA)                             │
│  ├── id UUID                                            │
│  ├── template_nombre VARCHAR(50)                        │
│  ├── fila_texto VARCHAR(200)                            │
│  ├── keywords TEXT[]                                    │
│  ├── campo_adicional VARCHAR(50)                        │
│  ├── orden INT                                          │
│  └── activo BOOLEAN                                     │
├─────────────────────────────────────────────────────────┤
│  catalogo_condiciones    │  historia_condiciones        │
│  (sin cambios)           │  (sin cambios)               │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Modelo de Datos

### Nueva Tabla: `pdf_template_filas`

```sql
-- ================================================================
-- CONFIGURACIÓN DE TEMPLATES PDF
-- Almacena la estructura de filas para cada tipo de documento
-- ================================================================

CREATE TABLE pdf_template_filas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificación del template
    template_nombre VARCHAR(50) NOT NULL,
    -- Ej: 'anexo11_condiciones', 'anexo11_alergias', 'anexo11_vacunas'
    --     'ficha_inscripcion_datos', 'autorizacion_salida'
    
    -- Contenido de la fila
    fila_texto VARCHAR(200) NOT NULL,
    -- Lo que se muestra en el PDF
    -- Ej: 'Diabetes Mellitus', 'Tratamiento psicológico o psiquiátrico'
    
    -- Matching con datos del usuario
    keywords TEXT[] NOT NULL,
    -- Array de palabras clave para buscar coincidencia
    -- Ej: ARRAY['diabetes', 'diabetico']
    -- Ej: ARRAY['psicolog', 'psiquiat']
    
    -- Configuración de campo adicional
    campo_adicional VARCHAR(50),
    -- Qué campo mostrar junto a la fila
    -- 'fecha' → fechaDiagnostico
    -- 'tratamiento' → tratamiento
    -- 'mencionar' → mencionar
    -- NULL → solo SI/NO
    
    -- Tipo de celda adicional
    tipo_celda_adicional VARCHAR(20) DEFAULT 'fecha',
    -- 'fecha' → Formatea como fecha
    -- 'texto' → Muestra texto directo
    -- 'texto_pequeño' → Texto en fuente menor debajo del título
    
    -- Ordenamiento y estado
    orden INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_template_orden UNIQUE (template_nombre, orden)
);

-- Índices
CREATE INDEX idx_pdf_template_filas_nombre ON pdf_template_filas(template_nombre);
CREATE INDEX idx_pdf_template_filas_activo ON pdf_template_filas(template_nombre, activo) WHERE activo = TRUE;

-- Comentarios
COMMENT ON TABLE pdf_template_filas IS 'Configuración de filas para templates de PDF';
COMMENT ON COLUMN pdf_template_filas.keywords IS 'Array de palabras clave para matching con datos del usuario (sin tildes, lowercase)';
```

### Datos Iniciales

```sql
-- ================================================================
-- DATOS: ANEXO 11 - CONDICIONES MÉDICAS
-- ================================================================
INSERT INTO pdf_template_filas (template_nombre, fila_texto, keywords, campo_adicional, tipo_celda_adicional, orden) VALUES
('anexo11_condiciones', 'Diabetes Mellitus', 
 ARRAY['diabetes', 'diabetico', 'diabetica'], 'fechaDiagnostico', 'fecha', 1),

('anexo11_condiciones', 'Hipertension Arterial', 
 ARRAY['hipertension', 'hipertensión', 'presion alta'], 'fechaDiagnostico', 'fecha', 2),

('anexo11_condiciones', 'Asma', 
 ARRAY['asma', 'asmatico', 'asmatica'], 'fechaDiagnostico', 'fecha', 3),

('anexo11_condiciones', 'Convulsiones', 
 ARRAY['convulsion', 'epilepsia', 'epileptico'], 'fechaDiagnostico', 'fecha', 4),

('anexo11_condiciones', 'Lesion traumatica', 
 ARRAY['lesion', 'trauma', 'traumatica', 'traumatico', 'fractura'], 'fechaDiagnostico', 'fecha', 5),

('anexo11_condiciones', 'Tratamiento psicologico o psiquiatrico', 
 ARRAY['psicolog', 'psiquiat', 'mental', 'ansiedad', 'depresion'], 'fechaDiagnostico', 'fecha', 6),

('anexo11_condiciones', 'Cirugias y hospitalizaciones', 
 ARRAY['cirugia', 'hospital', 'operacion', 'intervencion'], 'fechaDiagnostico', 'fecha', 7),

('anexo11_condiciones', 'Otra condicion no mencionada en la presente lista:', 
 ARRAY['otra condicion', 'otra'], 'tratamiento', 'texto_pequeño', 8);

-- ================================================================
-- DATOS: ANEXO 11 - ALERGIAS
-- ================================================================
INSERT INTO pdf_template_filas (template_nombre, fila_texto, keywords, campo_adicional, tipo_celda_adicional, orden) VALUES
('anexo11_alergias', 'Medicamentos', 
 ARRAY['medicamento', 'penicilina', 'aspirina', 'ibuprofeno', 'sulfa', 'anestesico'], 'mencionar', 'texto', 1),

('anexo11_alergias', 'Alimentos', 
 ARRAY['alimento', 'comida', 'mani', 'marisco', 'huevo', 'leche', 'gluten'], 'mencionar', 'texto', 2),

('anexo11_alergias', 'Plantas', 
 ARRAY['planta', 'polen', 'acaro', 'polvo', 'moho', 'ambiental'], 'mencionar', 'texto', 3),

('anexo11_alergias', 'Picaduras / mordeduras de insectos', 
 ARRAY['picadura', 'insecto', 'mordedura', 'abeja', 'avispa'], 'mencionar', 'texto', 4),

('anexo11_alergias', 'Sustancias u otros', 
 ARRAY['sustancia', 'otra', 'latex', 'niquel', 'cosmetico', 'contacto'], 'mencionar', 'texto', 5);

-- ================================================================
-- DATOS: ANEXO 11 - VACUNAS
-- ================================================================
INSERT INTO pdf_template_filas (template_nombre, fila_texto, keywords, campo_adicional, tipo_celda_adicional, orden) VALUES
('anexo11_vacunas', 'Antiamarilica (fiebre amarilla)', 
 ARRAY['amaril', 'fiebre amarilla', 'antiamarilica'], 'fechaAplicacion', 'fecha', 1),

('anexo11_vacunas', 'Hepatitis B', 
 ARRAY['hepatitis', 'hepatitis b'], 'fechaAplicacion', 'fecha', 2),

('anexo11_vacunas', 'Influenza', 
 ARRAY['influenza', 'gripe', 'flu'], 'fechaAplicacion', 'fecha', 3),

('anexo11_vacunas', 'COVID - 19', 
 ARRAY['covid', 'coronavirus', 'sars'], 'fechaAplicacion', 'fecha', 4),

('anexo11_vacunas', 'Neumococo', 
 ARRAY['neumococo', 'neumonia', 'pneumo'], 'fechaAplicacion', 'fecha', 5);
```

---

## 🔧 Implementación del Servicio

### `src/services/pdfConfigService.ts`

```typescript
import { supabase } from '@/lib/supabase';

// ================================================================
// TIPOS
// ================================================================

export interface FilaTemplateConfig {
  id: string;
  templateNombre: string;
  filaTexto: string;
  keywords: string[];
  campoAdicional: string | null;
  tipoCeldaAdicional: 'fecha' | 'texto' | 'texto_pequeño';
  orden: number;
}

// ================================================================
// SERVICIO
// ================================================================

export class PDFConfigService {
  /**
   * Obtiene las filas configuradas para un template específico
   * @param templateNombre - Identificador del template (ej: 'anexo11_condiciones')
   * @returns Array de configuración de filas ordenado
   */
  static async getFilasTemplate(templateNombre: string): Promise<FilaTemplateConfig[]> {
    const { data, error } = await supabase
      .from('pdf_template_filas')
      .select('*')
      .eq('template_nombre', templateNombre)
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) {
      console.error(`Error obteniendo filas para template ${templateNombre}:`, error);
      throw error;
    }

    return (data || []).map(row => ({
      id: row.id,
      templateNombre: row.template_nombre,
      filaTexto: row.fila_texto,
      keywords: row.keywords,
      campoAdicional: row.campo_adicional,
      tipoCeldaAdicional: row.tipo_celda_adicional || 'fecha',
      orden: row.orden,
    }));
  }

  /**
   * Obtiene todas las configuraciones necesarias para el Anexo 11
   * Optimizado para una sola llamada
   */
  static async getAnexo11Config(): Promise<{
    condiciones: FilaTemplateConfig[];
    alergias: FilaTemplateConfig[];
    vacunas: FilaTemplateConfig[];
  }> {
    const { data, error } = await supabase
      .from('pdf_template_filas')
      .select('*')
      .in('template_nombre', ['anexo11_condiciones', 'anexo11_alergias', 'anexo11_vacunas'])
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error obteniendo configuración Anexo 11:', error);
      throw error;
    }

    const mapRow = (row: any): FilaTemplateConfig => ({
      id: row.id,
      templateNombre: row.template_nombre,
      filaTexto: row.fila_texto,
      keywords: row.keywords,
      campoAdicional: row.campo_adicional,
      tipoCeldaAdicional: row.tipo_celda_adicional || 'fecha',
      orden: row.orden,
    });

    return {
      condiciones: (data || []).filter(r => r.template_nombre === 'anexo11_condiciones').map(mapRow),
      alergias: (data || []).filter(r => r.template_nombre === 'anexo11_alergias').map(mapRow),
      vacunas: (data || []).filter(r => r.template_nombre === 'anexo11_vacunas').map(mapRow),
    };
  }

  /**
   * Utilidad: Normaliza texto para comparación (quita tildes, lowercase)
   */
  static normalizar(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /**
   * Busca coincidencia entre un nombre y los keywords de una fila
   */
  static matchKeywords(nombre: string, keywords: string[]): boolean {
    const nombreNorm = this.normalizar(nombre);
    return keywords.some(keyword => nombreNorm.includes(this.normalizar(keyword)));
  }
}
```

---

## 📄 Template Refactorizado

### `src/modules/reports/templates/pdf/HistoriaMedicaReportTemplate.tsx`

```tsx
import { FilaTemplateConfig, PDFConfigService } from '@/services/pdfConfigService';

// ================================================================
// TIPOS EXTENDIDOS
// ================================================================

interface HistoriaMedicaReportProps {
  data: HistoriaMedicaReportData;
  metadata: ReportMetadata;
  config: {
    filasCondiciones: FilaTemplateConfig[];
    filasAlergias: FilaTemplateConfig[];
    filasVacunas: FilaTemplateConfig[];
  };
}

// ================================================================
// COMPONENTE GENÉRICO DE FILA
// ================================================================

interface FilaCondicionProps {
  config: FilaTemplateConfig;
  condiciones: CondicionData[];
  isLast: boolean;
}

const FilaCondicion: React.FC<FilaCondicionProps> = ({ config, condiciones, isLast }) => {
  // Buscar coincidencia
  const condicionEncontrada = condiciones.find(c => 
    PDFConfigService.matchKeywords(c.nombre, config.keywords)
  );
  const tieneSI = !!condicionEncontrada;
  
  // Obtener valor del campo adicional
  const getValorAdicional = () => {
    if (!tieneSI || !condicionEncontrada || !config.campoAdicional) return '';
    
    const valor = condicionEncontrada[config.campoAdicional as keyof CondicionData];
    
    if (config.tipoCeldaAdicional === 'fecha' && valor) {
      return formatDate(valor as string);
    }
    return valor as string || '';
  };

  return (
    <View style={isLast ? styles.tableRowLast : styles.tableRow}>
      {/* Checkbox SI */}
      <View style={styles.checkboxCell}>
        <Text>{tieneSI ? 'X' : ''}</Text>
      </View>
      
      {/* Checkbox NO */}
      <View style={styles.checkboxCell}>
        <Text>{!tieneSI ? 'X' : ''}</Text>
      </View>
      
      {/* Nombre de la condición */}
      <View style={styles.condicionCell}>
        <Text>{config.filaTexto}</Text>
        {config.tipoCeldaAdicional === 'texto_pequeño' && tieneSI && (
          <Text style={{ fontSize: 7, marginTop: 2 }}>
            {getValorAdicional()}
          </Text>
        )}
      </View>
      
      {/* Columna adicional (fecha o texto) */}
      <View style={styles.fechaCell}>
        {config.tipoCeldaAdicional !== 'texto_pequeño' && (
          <Text>{getValorAdicional()}</Text>
        )}
      </View>
    </View>
  );
};

// ================================================================
// TEMPLATE PRINCIPAL
// ================================================================

const HistoriaMedicaTemplate: React.FC<HistoriaMedicaReportProps> = ({ 
  data, 
  metadata,
  config 
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ... Header y otros componentes ... */}
        
        {/* TABLA DE CONDICIONES - RENDERIZADO DINÁMICO */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableRow}>
            <View style={[styles.tableHeaderCell, { width: 30 }]}>
              <Text>SI</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 30 }]}>
              <Text>NO</Text>
            </View>
            <View style={[styles.tableHeaderCell, { flex: 1 }]}>
              <Text>CONDICION</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 120 }]}>
              <Text>Fecha de Atencion</Text>
            </View>
          </View>
          
          {/* Filas dinámicas desde configuración */}
          {config.filasCondiciones.map((fila, idx) => (
            <FilaCondicion
              key={fila.id}
              config={fila}
              condiciones={data.condiciones}
              isLast={idx === config.filasCondiciones.length - 1}
            />
          ))}
        </View>
        
        {/* ... Resto del template ... */}
      </Page>
    </Document>
  );
};
```

---

## 🔄 Flujo de Datos Completo

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USUARIO SOLICITA PDF                                          │
│    ReportPage.tsx → handleExportPDF()                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. CARGA DE DATOS EN PARALELO                                    │
│    reportDataService.ts → getHistoriaMedicaData()                │
│                                                                  │
│    Promise.all([                                                 │
│      getScoutData(scoutId),           // Datos del scout         │
│      getHistoriaMedica(personaId),    // Condiciones, alergias   │
│      PDFConfigService.getAnexo11Config(), // Config de filas     │
│    ])                                                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. RENDERIZADO DEL TEMPLATE                                      │
│    HistoriaMedicaReportTemplate.tsx                              │
│                                                                  │
│    <HistoriaMedicaTemplate                                       │
│      data={historiaMedicaData}                                   │
│      config={filasConfig}            // ← Configuración de BD    │
│    />                                                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. MATCHING DINÁMICO                                             │
│    FilaCondicion component                                       │
│                                                                  │
│    config.keywords = ['diabetes', 'diabetico']                   │
│    data.condiciones = [{ nombre: 'Diabetes Mellitus', ... }]     │
│                                                                  │
│    → 'diabetes mellitus'.includes('diabetes') = TRUE             │
│    → Marca SI ✓                                                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. GENERACIÓN PDF                                                │
│    React-PDF → Blob → Download                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📈 Beneficios y Trade-offs

### ✅ Beneficios

| Aspecto | Descripción |
|---------|-------------|
| **Mantenibilidad** | Cambios en filas = UPDATE en BD, sin deploy |
| **Escalabilidad** | Nuevos templates = INSERT filas, mismo código |
| **Consistencia** | Una sola fuente de verdad para estructura de PDFs |
| **Testing** | Configuración mockeable para tests unitarios |
| **Auditoría** | Historial de cambios en BD |
| **Multi-tenant** | Fácil agregar columna `grupo_id` para personalización |

### ⚠️ Trade-offs

| Aspecto | Consideración |
|---------|---------------|
| **Complejidad inicial** | Más código, más tablas, más queries |
| **Performance** | 1 query extra por generación de PDF (~50ms) |
| **Debugging** | Revisar BD además de código |
| **Overhead** | Para un sistema pequeño puede ser excesivo |

---

## 🚀 Plan de Implementación

### Fase 1: Preparación (30 min)
- [ ] Crear tabla `pdf_template_filas`
- [ ] Insertar datos iniciales
- [ ] Crear `PDFConfigService`

### Fase 2: Refactor Template (1 hora)
- [ ] Crear componente `FilaCondicion` genérico
- [ ] Crear componente `FilaAlergia` genérico
- [ ] Crear componente `FilaVacuna` genérico
- [ ] Actualizar `HistoriaMedicaReportTemplate`

### Fase 3: Integración (30 min)
- [ ] Actualizar `reportDataService` para cargar config
- [ ] Actualizar llamadas en exportación PDF
- [ ] Remover código hardcodeado

### Fase 4: Testing (30 min)
- [ ] Test: Generación con config de BD
- [ ] Test: Fila desactivada no aparece
- [ ] Test: Nueva fila aparece sin deploy

---

## 📋 Checklist de Migración

```markdown
- [ ] Backup de código actual
- [ ] Ejecutar script SQL de creación de tabla
- [ ] Ejecutar script SQL de datos iniciales
- [ ] Crear PDFConfigService
- [ ] Actualizar types en reportDataService
- [ ] Refactorizar template condiciones
- [ ] Refactorizar template alergias
- [ ] Refactorizar template vacunas
- [ ] Testing en desarrollo
- [ ] Deploy a producción
- [ ] Verificar generación de PDFs
- [ ] Limpiar código hardcodeado comentado
```

---

## 🔮 Extensiones Futuras

### Multi-idioma
```sql
ALTER TABLE pdf_template_filas ADD COLUMN idioma VARCHAR(5) DEFAULT 'es';
-- Agregar filas en inglés, portugués, etc.
```

### Versionamiento
```sql
ALTER TABLE pdf_template_filas ADD COLUMN version INT DEFAULT 1;
-- Mantener versiones anteriores para documentos históricos
```

### Personalización por Grupo
```sql
ALTER TABLE pdf_template_filas ADD COLUMN grupo_id UUID REFERENCES grupos(id);
-- Cada grupo scout puede tener sus propias filas
```

### Editor Admin (Opcional)
```
/admin/pdf-templates
├── Lista de templates
├── Crear/Editar filas
├── Reordenar drag-and-drop
├── Preview en tiempo real
└── Historial de cambios
```

---

## 📚 Referencias

- **React-PDF Documentation**: https://react-pdf.org/
- **SOLID Principles**: https://en.wikipedia.org/wiki/SOLID
- **Clean Architecture**: Robert C. Martin
- **Supabase PostgreSQL**: https://supabase.com/docs

---

## 📝 Notas

> **Decisión actual (marzo 2026):** Se mantiene la arquitectura con filas hardcodeadas por las siguientes razones:
> 1. El Anexo 11 de Scouts del Perú es un formato estándar que raramente cambia
> 2. El equipo de desarrollo tiene acceso directo al código
> 3. La complejidad adicional no justifica el beneficio para un único grupo scout
>
> Esta documentación sirve como referencia para una futura migración si:
> - Se require soportar múltiples grupos con formatos diferentes
> - Se implementa un panel de administración
> - Se comercializa el sistema como SaaS

---

*Documento creado por GitHub Copilot - Sistema de Gestión Scout Lima 12*
