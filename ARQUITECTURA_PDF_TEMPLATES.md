# 📄 Arquitectura de Generación de PDFs Dinámicos

## Sistema de Gestión Scout - Grupo Scout Lima 12

---

## 🎯 Visión General

Sistema de generación de documentos PDF con **configuración dinámica desde base de datos**, permitiendo modificar estructura, contenido y estilos sin cambios en código.

### Principios de Diseño

| Principio | Implementación |
|-----------|----------------|
| **Separación de Concerns** | Datos de presentación separados de lógica de renderizado |
| **Open/Closed** | Nuevos templates sin modificar código existente |
| **Single Responsibility** | Cada componente tiene una única responsabilidad |
| **DRY** | Configuración centralizada, reutilización de componentes |

---

## 🏗️ Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAPA DE PRESENTACIÓN                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   PDFViewer     │  │   PDFDownload   │  │   PDFPreview    │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │            │
│           └────────────────────┼────────────────────┘            │
│                                │                                  │
├────────────────────────────────┼─────────────────────────────────┤
│                        CAPA DE TEMPLATES                         │
│                                │                                  │
│  ┌─────────────────────────────▼─────────────────────────────┐  │
│  │                   PDFTemplateEngine                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │ TableRenderer│ │ FieldRenderer│ │ SectionRenderer │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                │                                  │
├────────────────────────────────┼─────────────────────────────────┤
│                        CAPA DE SERVICIOS                         │
│                                │                                  │
│  ┌─────────────────────────────▼─────────────────────────────┐  │
│  │                  TemplateConfigService                     │  │
│  │  - getTemplateConfig(templateId)                          │  │
│  │  - getTemplateFilas(templateId, seccion)                  │  │
│  │  - getFieldMappings(templateId)                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                │                                  │
├────────────────────────────────┼─────────────────────────────────┤
│                        CAPA DE DATOS                             │
│                                │                                  │
│  ┌─────────────────────────────▼─────────────────────────────┐  │
│  │                      Supabase/PostgreSQL                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │  │
│  │  │pdf_templates │  │pdf_secciones │  │pdf_template_filas│ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Modelo de Datos

### Tabla: `pdf_templates`

Templates maestros de documentos.

```sql
CREATE TABLE pdf_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,      -- 'ANEXO_11', 'DNGI_03', etc.
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    page_size VARCHAR(20) DEFAULT 'A4',       -- A4, LETTER, LEGAL
    orientation VARCHAR(20) DEFAULT 'portrait', -- portrait, landscape
    margins JSONB DEFAULT '{"top": 40, "bottom": 40, "left": 40, "right": 40}',
    header_config JSONB,                       -- Logo, título, subtítulo
    footer_config JSONB,                       -- Numeración, fecha
    styles JSONB,                              -- Estilos globales
    es_activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ejemplo
INSERT INTO pdf_templates (codigo, nombre, descripcion)
VALUES ('ANEXO_11', 'Historia Médica del Scout', 'Formulario oficial de historia médica');
```

### Tabla: `pdf_secciones`

Secciones dentro de cada template.

```sql
CREATE TABLE pdf_secciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES pdf_templates(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,              -- 'DATOS_GENERALES', 'CONDICIONES', etc.
    titulo VARCHAR(200),
    descripcion TEXT,
    tipo VARCHAR(30) NOT NULL,                -- 'header', 'table', 'fields', 'signature'
    orden INT NOT NULL,
    config JSONB,                             -- Configuración específica de sección
    es_visible BOOLEAN DEFAULT true,
    UNIQUE(template_id, codigo)
);

-- Ejemplo
INSERT INTO pdf_secciones (template_id, codigo, titulo, tipo, orden, config)
VALUES 
    ('{template_id}', 'HEADER', NULL, 'header', 1, '{"showLogo": true}'),
    ('{template_id}', 'DATOS_PERSONALES', 'DATOS DEL SCOUT', 'fields', 2, NULL),
    ('{template_id}', 'CONDICIONES', 'CONDICIONES MÉDICAS', 'table', 3, '{"columns": 4}');
```

### Tabla: `pdf_template_filas`

Filas individuales de cada sección (para tablas con contenido fijo).

```sql
CREATE TABLE pdf_template_filas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seccion_id UUID REFERENCES pdf_secciones(id) ON DELETE CASCADE,
    etiqueta VARCHAR(300) NOT NULL,           -- Texto a mostrar
    data_key VARCHAR(100),                    -- Campo de datos a mapear
    match_type VARCHAR(20) DEFAULT 'exact',   -- 'exact', 'contains', 'startsWith'
    match_value VARCHAR(300),                 -- Valor para matching
    orden INT NOT NULL,
    columna INT DEFAULT 1,                    -- Para tablas multi-columna
    tiene_campo_adicional BOOLEAN DEFAULT false,
    campo_adicional_label VARCHAR(100),       -- 'Tratamiento:', 'Especificar:', etc.
    campo_adicional_key VARCHAR(100),         -- Key del campo adicional
    styles JSONB,                             -- Estilos específicos de fila
    es_visible BOOLEAN DEFAULT true
);

-- Ejemplo: Condiciones médicas de Anexo 11
INSERT INTO pdf_template_filas (seccion_id, etiqueta, data_key, match_type, match_value, orden, columna) VALUES
    -- Columna 1
    ('{seccion_id}', 'Alergias', 'condiciones', 'exact', 'Alergias', 1, 1),
    ('{seccion_id}', 'Asma', 'condiciones', 'exact', 'Asma', 2, 1),
    ('{seccion_id}', 'Diabetes', 'condiciones', 'exact', 'Diabetes', 3, 1),
    ('{seccion_id}', 'Epilepsia', 'condiciones', 'exact', 'Epilepsia', 4, 1),
    -- Columna 2
    ('{seccion_id}', 'Sonambulismo', 'condiciones', 'exact', 'Sonambulismo', 5, 2),
    ('{seccion_id}', 'Presión Alta', 'condiciones', 'exact', 'Presión Alta', 6, 2),
    -- Con campo adicional
    ('{seccion_id}', 'Otra condición', 'condiciones', 'startsWith', 'Otra', 20, 2),
    -- El config tiene: tiene_campo_adicional=true, campo_adicional_label='Especificar:', campo_adicional_key='tratamiento'
```

### Tabla: `pdf_field_mappings`

Mapeo de campos para secciones tipo 'fields'.

```sql
CREATE TABLE pdf_field_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seccion_id UUID REFERENCES pdf_secciones(id) ON DELETE CASCADE,
    label VARCHAR(200) NOT NULL,              -- 'Nombre completo'
    data_path VARCHAR(200) NOT NULL,          -- 'scout.nombres + scout.apellidos'
    field_type VARCHAR(30) DEFAULT 'text',    -- 'text', 'date', 'boolean', 'image'
    format VARCHAR(100),                      -- 'DD/MM/YYYY', 'uppercase', etc.
    width VARCHAR(20),                        -- '50%', '100px', 'auto'
    orden INT NOT NULL,
    row_group INT,                            -- Para agrupar campos en filas
    styles JSONB,
    es_requerido BOOLEAN DEFAULT false,
    es_visible BOOLEAN DEFAULT true
);

-- Ejemplo
INSERT INTO pdf_field_mappings (seccion_id, label, data_path, field_type, orden, row_group) VALUES
    ('{seccion_id}', 'Nombres', 'scout.nombres', 'text', 1, 1),
    ('{seccion_id}', 'Apellidos', 'scout.apellido_paterno || " " || scout.apellido_materno', 'text', 2, 1),
    ('{seccion_id}', 'Fecha de Nacimiento', 'scout.fecha_nacimiento', 'date', 3, 2),
    ('{seccion_id}', 'Código Scout', 'scout.codigo_scout', 'text', 4, 2);
```

---

## 🔧 Servicio de Configuración

### `TemplateConfigService.ts`

```typescript
import { supabase } from '@/lib/supabase';

export interface TemplateConfig {
  id: string;
  codigo: string;
  nombre: string;
  pageSize: string;
  orientation: string;
  margins: { top: number; bottom: number; left: number; right: number };
  headerConfig: any;
  footerConfig: any;
  styles: any;
}

export interface SeccionConfig {
  id: string;
  codigo: string;
  titulo: string;
  tipo: 'header' | 'table' | 'fields' | 'signature';
  orden: number;
  config: any;
  filas?: FilaConfig[];
  fields?: FieldMapping[];
}

export interface FilaConfig {
  id: string;
  etiqueta: string;
  dataKey: string;
  matchType: 'exact' | 'contains' | 'startsWith';
  matchValue: string;
  orden: number;
  columna: number;
  tieneCampoAdicional: boolean;
  campoAdicionalLabel?: string;
  campoAdicionalKey?: string;
  styles?: any;
}

export interface FieldMapping {
  id: string;
  label: string;
  dataPath: string;
  fieldType: string;
  format?: string;
  width?: string;
  orden: number;
  rowGroup?: number;
  styles?: any;
}

export class TemplateConfigService {
  /**
   * Obtener configuración completa de un template
   */
  static async getTemplateConfig(codigo: string): Promise<TemplateConfig | null> {
    const { data, error } = await supabase
      .from('pdf_templates')
      .select('*')
      .eq('codigo', codigo)
      .eq('es_activo', true)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      codigo: data.codigo,
      nombre: data.nombre,
      pageSize: data.page_size,
      orientation: data.orientation,
      margins: data.margins,
      headerConfig: data.header_config,
      footerConfig: data.footer_config,
      styles: data.styles,
    };
  }

  /**
   * Obtener secciones de un template con sus filas/campos
   */
  static async getTemplateSecciones(templateId: string): Promise<SeccionConfig[]> {
    const { data: secciones, error } = await supabase
      .from('pdf_secciones')
      .select(`
        *,
        pdf_template_filas(*),
        pdf_field_mappings(*)
      `)
      .eq('template_id', templateId)
      .eq('es_visible', true)
      .order('orden');

    if (error || !secciones) return [];

    return secciones.map(s => ({
      id: s.id,
      codigo: s.codigo,
      titulo: s.titulo,
      tipo: s.tipo,
      orden: s.orden,
      config: s.config,
      filas: s.pdf_template_filas?.map((f: any) => ({
        id: f.id,
        etiqueta: f.etiqueta,
        dataKey: f.data_key,
        matchType: f.match_type,
        matchValue: f.match_value,
        orden: f.orden,
        columna: f.columna,
        tieneCampoAdicional: f.tiene_campo_adicional,
        campoAdicionalLabel: f.campo_adicional_label,
        campoAdicionalKey: f.campo_adicional_key,
        styles: f.styles,
      })).sort((a: any, b: any) => a.orden - b.orden),
      fields: s.pdf_field_mappings?.map((f: any) => ({
        id: f.id,
        label: f.label,
        dataPath: f.data_path,
        fieldType: f.field_type,
        format: f.format,
        width: f.width,
        orden: f.orden,
        rowGroup: f.row_group,
        styles: f.styles,
      })).sort((a: any, b: any) => a.orden - b.orden),
    }));
  }

  /**
   * Evaluar si un item de datos coincide con una fila de template
   */
  static matchesRow(dataItem: any, fila: FilaConfig): boolean {
    const value = this.normalizar(dataItem[fila.dataKey] || dataItem.nombre || '');
    const matchValue = this.normalizar(fila.matchValue);

    switch (fila.matchType) {
      case 'exact':
        return value === matchValue;
      case 'contains':
        return value.includes(matchValue);
      case 'startsWith':
        return value.startsWith(matchValue);
      default:
        return false;
    }
  }

  /**
   * Normalizar texto (quitar tildes, minúsculas)
   */
  private static normalizar(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /**
   * Evaluar expresión de data_path para obtener valor
   */
  static evaluateDataPath(data: any, path: string): any {
    // Soporta: 'scout.nombres', 'scout.apellido_paterno || " " || scout.apellido_materno'
    if (path.includes('||')) {
      // Concatenación
      const parts = path.split('||').map(p => p.trim());
      return parts.map(part => {
        if (part.startsWith('"') && part.endsWith('"')) {
          return part.slice(1, -1); // Literal string
        }
        return this.getNestedValue(data, part) || '';
      }).join('');
    }
    return this.getNestedValue(data, path);
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
```

---

## 🖨️ Motor de Templates

### `PDFTemplateEngine.tsx`

```tsx
import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { TemplateConfig, SeccionConfig, FilaConfig } from '@/services/TemplateConfigService';

interface PDFTemplateEngineProps {
  templateConfig: TemplateConfig;
  secciones: SeccionConfig[];
  data: any;
}

export const PDFTemplateEngine: React.FC<PDFTemplateEngineProps> = ({
  templateConfig,
  secciones,
  data,
}) => {
  const styles = StyleSheet.create({
    page: {
      padding: templateConfig.margins.top,
      fontFamily: 'Helvetica',
      fontSize: 9,
    },
    section: {
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: 'bold',
      backgroundColor: '#1e40af',
      color: 'white',
      padding: 4,
      marginBottom: 5,
    },
    // ... más estilos base
  });

  const renderSeccion = (seccion: SeccionConfig) => {
    switch (seccion.tipo) {
      case 'header':
        return <HeaderRenderer config={seccion} data={data} />;
      case 'table':
        return <TableRenderer config={seccion} data={data} />;
      case 'fields':
        return <FieldsRenderer config={seccion} data={data} />;
      case 'signature':
        return <SignatureRenderer config={seccion} data={data} />;
      default:
        return null;
    }
  };

  return (
    <Document>
      <Page size={templateConfig.pageSize as any} style={styles.page}>
        {secciones.map((seccion) => (
          <View key={seccion.id} style={styles.section}>
            {seccion.titulo && (
              <Text style={styles.sectionTitle}>{seccion.titulo}</Text>
            )}
            {renderSeccion(seccion)}
          </View>
        ))}
      </Page>
    </Document>
  );
};
```

### `TableRenderer.tsx`

Renderiza tablas con filas configurables desde BD.

```tsx
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { SeccionConfig, FilaConfig } from '@/services/TemplateConfigService';
import { TemplateConfigService } from '@/services/TemplateConfigService';

interface TableRendererProps {
  config: SeccionConfig;
  data: any;
}

export const TableRenderer: React.FC<TableRendererProps> = ({ config, data }) => {
  const numColumnas = config.config?.columns || 2;
  
  // Agrupar filas por columna
  const filasPorColumna: FilaConfig[][] = [];
  for (let i = 1; i <= numColumnas; i++) {
    filasPorColumna.push(
      (config.filas || []).filter(f => f.columna === i)
    );
  }

  // Función para verificar si una fila tiene datos
  const tieneData = (fila: FilaConfig): boolean => {
    const dataArray = data[fila.dataKey] || [];
    return dataArray.some((item: any) => 
      TemplateConfigService.matchesRow(item, fila)
    );
  };

  // Obtener datos adicionales de una fila
  const getDatosAdicionales = (fila: FilaConfig): string => {
    if (!fila.tieneCampoAdicional || !fila.campoAdicionalKey) return '';
    
    const dataArray = data[fila.dataKey] || [];
    const match = dataArray.find((item: any) => 
      TemplateConfigService.matchesRow(item, fila)
    );
    
    return match?.[fila.campoAdicionalKey] || '';
  };

  return (
    <View style={styles.table}>
      <View style={styles.tableRow}>
        {filasPorColumna.map((columna, colIndex) => (
          <View key={colIndex} style={[styles.column, { width: `${100/numColumnas}%` }]}>
            {columna.map((fila) => (
              <View key={fila.id} style={styles.filaRow}>
                {/* Checkbox SI/NO */}
                <View style={styles.checkboxContainer}>
                  <View style={[styles.checkbox, tieneData(fila) && styles.checkboxMarked]}>
                    {tieneData(fila) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>SI</Text>
                  <View style={[styles.checkbox, !tieneData(fila) && styles.checkboxMarked]}>
                    {!tieneData(fila) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>NO</Text>
                </View>
                
                {/* Etiqueta */}
                <Text style={styles.filaEtiqueta}>{fila.etiqueta}</Text>
                
                {/* Campo adicional si existe */}
                {fila.tieneCampoAdicional && tieneData(fila) && (
                  <View style={styles.campoAdicional}>
                    <Text style={styles.campoAdicionalLabel}>
                      {fila.campoAdicionalLabel}: {getDatosAdicionales(fila)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  table: { borderWidth: 1, borderColor: '#e5e7eb' },
  tableRow: { flexDirection: 'row' },
  column: { borderRightWidth: 1, borderColor: '#e5e7eb' },
  filaRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', width: 60 },
  checkbox: { width: 10, height: 10, borderWidth: 1, borderColor: '#000', marginRight: 2 },
  checkboxMarked: { backgroundColor: '#1e40af' },
  checkmark: { color: 'white', fontSize: 7, textAlign: 'center' },
  checkboxLabel: { fontSize: 6, marginRight: 4 },
  filaEtiqueta: { flex: 1, fontSize: 8 },
  campoAdicional: { marginTop: 2 },
  campoAdicionalLabel: { fontSize: 7, fontStyle: 'italic' },
});
```

---

## 📝 Uso del Sistema

### Generar un PDF

```tsx
import { useState, useEffect } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { TemplateConfigService } from '@/services/TemplateConfigService';
import { PDFTemplateEngine } from '@/components/pdf/PDFTemplateEngine';

export const HistoriaMedicaPDF = ({ scoutId }: { scoutId: string }) => {
  const [config, setConfig] = useState<any>(null);
  const [secciones, setSecciones] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplate = async () => {
      // 1. Cargar configuración del template
      const templateConfig = await TemplateConfigService.getTemplateConfig('ANEXO_11');
      if (!templateConfig) return;
      
      // 2. Cargar secciones con filas/campos
      const templateSecciones = await TemplateConfigService.getTemplateSecciones(templateConfig.id);
      
      // 3. Cargar datos del scout
      const scoutData = await loadScoutMedicalData(scoutId);
      
      setConfig(templateConfig);
      setSecciones(templateSecciones);
      setData(scoutData);
      setLoading(false);
    };
    
    loadTemplate();
  }, [scoutId]);

  if (loading) return <div>Cargando...</div>;

  return (
    <PDFViewer width="100%" height="600px">
      <PDFTemplateEngine
        templateConfig={config}
        secciones={secciones}
        data={data}
      />
    </PDFViewer>
  );
};
```

### Agregar Nueva Fila (sin código)

Solo SQL:

```sql
INSERT INTO pdf_template_filas (
  seccion_id, 
  etiqueta, 
  data_key, 
  match_type, 
  match_value, 
  orden, 
  columna
) VALUES (
  '{id_seccion_condiciones}',
  'Nueva Condición Médica',
  'condiciones',
  'exact',
  'Nueva Condición Médica',
  21,
  2
);
```

### Agregar Nuevo Template

```sql
-- 1. Crear template
INSERT INTO pdf_templates (codigo, nombre, descripcion)
VALUES ('DNGI_03', 'Solicitud de Datos Scout', 'Formulario DNGI-03');

-- 2. Agregar secciones
INSERT INTO pdf_secciones (template_id, codigo, titulo, tipo, orden)
VALUES 
  ((SELECT id FROM pdf_templates WHERE codigo = 'DNGI_03'), 'DATOS_SCOUT', 'Datos del Scout', 'fields', 1);

-- 3. Agregar campos
INSERT INTO pdf_field_mappings (seccion_id, label, data_path, orden, row_group)
VALUES
  ((SELECT id FROM pdf_secciones WHERE codigo = 'DATOS_SCOUT'), 'Nombre', 'scout.nombres', 1, 1),
  ((SELECT id FROM pdf_secciones WHERE codigo = 'DATOS_SCOUT'), 'Apellidos', 'scout.apellido_paterno', 2, 1);
```

---

## 🔄 Migración desde Código Hardcodeado

### Paso 1: Crear estructura en BD

Ejecutar scripts de creación de tablas.

### Paso 2: Poblar con datos existentes

```sql
-- Exportar configuración actual a BD
INSERT INTO pdf_template_filas (seccion_id, etiqueta, data_key, match_value, orden, columna)
SELECT 
  '{seccion_id}',
  condicion,
  'condiciones',
  condicion,
  ROW_NUMBER() OVER (),
  CASE WHEN ROW_NUMBER() OVER () <= 10 THEN 1 ELSE 2 END
FROM (
  VALUES 
    ('Alergias'),
    ('Asma'),
    ('Diabetes'),
    -- ... resto de condiciones
) AS t(condicion);
```

### Paso 3: Actualizar componente React

Cambiar de array hardcodeado a carga desde servicio.

---

## ✅ Beneficios

| Aspecto | Antes (Hardcoded) | Después (DB-Driven) |
|---------|-------------------|---------------------|
| **Agregar fila** | Editar código + deploy | Solo INSERT en BD |
| **Cambiar orden** | Editar código + deploy | UPDATE orden en BD |
| **Personalización** | Requiere desarrollador | Usuario admin puede hacerlo |
| **Versionamiento** | Git commits | Histórico en BD + Git |
| **Multi-tenant** | Un código para todos | Templates por organización |
| **Testing** | Unit tests por template | Tests genéricos del engine |
| **Rollback** | Revert commit | UPDATE es_activo = false |

---

## 🛡️ Consideraciones de Seguridad

1. **RLS (Row Level Security):** Aplicar políticas en tablas de configuración
2. **Validación:** Sanitizar data_path antes de evaluar
3. **Permisos:** Solo admins pueden modificar configuración
4. **Auditoría:** Log de cambios en templates

```sql
-- RLS para pdf_templates
ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates" ON pdf_templates
FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
);

CREATE POLICY "Anyone can read active templates" ON pdf_templates
FOR SELECT USING (es_activo = true);
```

---

## 📚 Referencias

- **React-PDF:** https://react-pdf.org/
- **Supabase:** https://supabase.com/docs
- **PDF Specification:** ISO 32000-1:2008

---

## 👥 Contribuidores

- Sistema de Gestión Scout - Grupo Scout Lima 12
- Fecha: Marzo 2026
