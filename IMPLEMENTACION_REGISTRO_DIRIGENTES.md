# 🎯 IMPLEMENTACIÓN REGISTRO DE DIRIGENTES

**Fecha:** 23 de enero de 2026  
**Versión:** 2.1 - Sistema DNGI-02  
**Objetivo:** Sistema completo de registro de adultos voluntarios con diseño Glassmorphism

---

## 📋 ÍNDICE

1. [Resumen del Sistema](#-resumen-del-sistema)
2. [Arquitectura](#-arquitectura)
3. [Sistema de Exportación PDF/Word](#-sistema-de-exportación-pdfword)
4. [Gestión de Documentos](#-gestión-de-documentos)
5. [Base de Datos](#-base-de-datos)
6. [Instalación](#-instalación)
7. [Guía de Uso](#-guía-de-uso)

---

## 🚀 RESUMEN DEL SISTEMA

### Características Principales
- ✅ **Diseño Glassmorphism** con animaciones Framer Motion
- ✅ **Formato DNGI-02** oficial de la Asociación de Scouts del Perú
- ✅ **Exportación a PDF y Word** con formatos profesionales
- ✅ **Gestión de Documentos** con verificación de estados
- ✅ **Métricas en Dashboard** (KPIs de dirigentes)
- ✅ **Datos de Salud centralizados** en tabla `personas` (DRY principle)

### Stack Tecnológico
| Componente | Tecnología |
|------------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS |
| Animaciones | Framer Motion |
| PDF | jsPDF + jspdf-autotable |
| Word | HTML-to-Word (Blob) / docx library |
| Backend | Supabase PostgreSQL + RPC Functions |

---

## 🏗 ARQUITECTURA

### Estructura de Archivos

```
src/components/DirigentesV2/
├── index.ts                    # Exports
├── DirigentesV2.tsx           # Vista principal con lista y métricas
├── FormularioDirigente.tsx    # Formulario DNGI-02 completo
├── GestionDocumentos.tsx      # Gestión de documentos adjuntos
└── generarPDFDirigente.ts     # Generadores PDF y Word

src/services/
└── dirigenteServiceV2.ts      # Servicio de API para Supabase

src/types/
└── dirigente.ts               # Tipos TypeScript

database/dirigentes/
└── 01_modelo_datos_dngi02.sql # Esquema completo con RPC functions
```

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DirigentesV2                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │   Dashboard     │  │    Filtros      │  │   Lista Dirigentes  │ │
│  │   (KPIs)        │  │   (Búsqueda)    │  │   (Cards)           │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
          │                    │                      │
          ▼                    ▼                      ▼
┌──────────────────┐ ┌──────────────────┐ ┌───────────────────────────┐
│ MetricCard       │ │ SelectField      │ │ FormularioDirigente       │
│ (GlassUI)        │ │ (GlassUI)        │ │ - Datos Personales        │
└──────────────────┘ └──────────────────┘ │ - Datos Institucionales   │
                                          │ - Salud (→ personas)      │
                                          │ - Declaraciones Juradas   │
                                          │ - Contacto Emergencia     │
                                          └───────────────────────────┘
```

---

## 📄 SISTEMA DE EXPORTACIÓN PDF/WORD

### Arquitectura de Exportación

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DirigentesV2.tsx                               │
│  ┌─────────────────┐    ┌──────────────────────────────────────┐   │
│  │ Botón "Exportar"│───▶│ Menú Dropdown:                       │   │
│  │  (Header)       │    │  • CSV (lista completa)              │   │
│  └─────────────────┘    │  • PDF masivo (todos los filtrados)  │   │
│                         └──────────────────────────────────────┘   │
│  ┌─────────────────┐    ┌──────────────────────────────────────┐   │
│  │ Botón ⬇ (fila) │───▶│ Hover Menú:                          │   │
│  │ (Por dirigente) │    │  • PDF individual (DNGI-02)          │   │
│  └─────────────────┘    │  • Word individual (editable)        │   │
│                         └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
              ┌──────────────────────────────────────┐
              │     generarPDFDirigente.ts           │
              │  ┌────────────────────────────────┐  │
              │  │ generarPDFDirigente(dirigente) │  │
              │  │  • jsPDF con diseño DNGI-02    │  │
              │  │  • Secciones estructuradas     │  │
              │  │  • Return: Blob                │  │
              │  └────────────────────────────────┘  │
              │  ┌────────────────────────────────┐  │
              │  │ generarWordDirigente(dirigente)│  │
              │  │  • HTML → Word (.doc)          │  │
              │  │  • Return: Blob                │  │
              │  └────────────────────────────────┘  │
              └──────────────────────────────────────┘
```

### Funciones de Exportación

| Función | Descripción | Formato |
|---------|-------------|---------|
| `handleExportarCSV()` | Lista de todos los dirigentes filtrados | `.csv` |
| `handleExportarTodosPDF()` | Descarga PDF individual por cada dirigente | Múltiples `.pdf` |
| `handleExportarPDFIndividual(d)` | Un solo formulario DNGI-02 | `.pdf` |
| `handleExportarWordIndividual(d)` | Un solo formulario editable | `.doc` |

### Librerías Utilizadas

```json
{
  "jspdf": "^3.0.0",
  "jspdf-autotable": "^5.0.2",
  "docx": "^9.5.1",
  "docxtemplater": "^3.67.1",
  "@react-pdf/renderer": "^4.3.2"
}
```

### Estructura del PDF DNGI-02

```
┌────────────────────────────────────────────────────┐
│  LOGO │ FORMATO DE REGISTRO INSTITUCIONAL          │
│       │ PARA ADULTOS VOLUNTARIOS                   │
│       │ DNGI-02 | Versión 2.1                      │
├────────────────────────────────────────────────────┤
│  1. DATOS PERSONALES                               │
│  • Apellidos, Nombres, Documento, Nacimiento       │
├────────────────────────────────────────────────────┤
│  2. INFORMACIÓN DE CONTACTO                        │
│  • Correo, Celular, Teléfono                       │
├────────────────────────────────────────────────────┤
│  3. DOMICILIO                                      │
│  • Departamento, Provincia, Distrito, Dirección    │
├────────────────────────────────────────────────────┤
│  4. DATOS INSTITUCIONALES SCOUT                    │
│  • Región, Localidad, Grupo, Unidad, Cargo         │
├────────────────────────────────────────────────────┤
│  5. INFORMACIÓN DE SALUD                           │
│  • Grupo Sanguíneo, Seguro, Discapacidad           │
├────────────────────────────────────────────────────┤
│  6. FORMACIÓN SCOUT                                │
│  • Nivel, SFH1, Membresía                          │
├────────────────────────────────────────────────────┤
│  7. DECLARACIONES JURADAS                          │
│  ☑ Política de Protección                         │
│  ☑ Código de Conducta                             │
│  ☑ Antecedentes                                   │
├────────────────────────────────────────────────────┤
│  8. CONTACTO DE EMERGENCIA                         │
├────────────────────────────────────────────────────┤
│  [FIRMA]                          [HUELLA]         │
└────────────────────────────────────────────────────┘
```

### Uso desde la UI

1. **Botón "Exportar"** en la cabecera → Menú con opciones:
   - **CSV**: Exporta lista tabular para Excel
   - **PDF Masivo**: Descarga todos los DNGI-02 de los filtrados

2. **Icono ⬇ en cada fila** (hover para ver menú):
   - **PDF**: Descarga DNGI-02 de ese dirigente
   - **Word**: Descarga versión editable

---

## 📁 GESTIÓN DE DOCUMENTOS

### Tipos de Documentos Soportados
- DNI Anverso/Reverso
- Certificado SFH1 (Safe from Harm)
- Certificados de Formación (INAF, CAB, CAF)
- Antecedentes Policiales/Penales
- Otros documentos

### Estados de Documentos
| Estado | Color | Descripción |
|--------|-------|-------------|
| `PENDIENTE` | 🟡 Amarillo | Subido, pendiente de verificación |
| `VERIFICADO` | 🟢 Verde | Documento válido y verificado |
| `VENCIDO` | 🔴 Rojo | Documento expirado |
| `RECHAZADO` | ⚫ Gris | Documento inválido |

### Flujo de Verificación
```
Subida → PENDIENTE → [Verificador revisa] → VERIFICADO
                                          → RECHAZADO
                  → [Fecha vence]        → VENCIDO
```

---

## 🗄 BASE DE DATOS

### Tablas Principales

```sql
-- Tabla principal de dirigentes
dirigentes (
  id, persona_id, grupo_id, codigo_credencial,
  unidad, cargo, nivel_formacion,
  acepta_politica_proteccion, acepta_codigo_conducta,
  aprobo_sfh1, autoriza_uso_imagen,
  declara_sin_antecedentes_*,
  estado, created_at, updated_at
)

-- Datos personales + salud centralizados (DRY)
personas (
  id, nombres, apellidos, fecha_nacimiento, sexo,
  tipo_documento, numero_documento,
  correo, correo_institucional, celular, telefono,
  departamento, provincia, distrito, direccion,
  -- Datos de salud centralizados
  religion, grupo_sanguineo, factor_sanguineo,
  seguro_medico, tipo_discapacidad, carnet_conadis
)

-- Contactos de emergencia
contactos_emergencia_dirigentes (
  id, dirigente_id, nombre_completo, telefono, parentesco
)

-- Documentos adjuntos
dirigentes_documentos (
  id, dirigente_id, tipo_documento, url_archivo,
  estado, fecha_vencimiento
)

-- Historial de formación
dirigentes_formacion (
  id, dirigente_id, tipo_curso, fecha_certificado,
  numero_certificado, estado
)
```

### Funciones RPC

| Función | Descripción |
|---------|-------------|
| `registrar_dirigente_completo(p_datos)` | Registra nuevo dirigente |
| `obtener_dirigentes_completo(p_filtros)` | Lista con filtros |
| `obtener_dirigente_por_id(p_id)` | Detalle completo |
| `actualizar_dirigente(p_id, p_datos)` | Actualiza dirigente |
| `obtener_estadisticas_dirigentes()` | KPIs del dashboard |

---

## 📋 INSTALACIÓN

### **PASO 1: Ejecutar Script SQL** ⚠️

1. Abre **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Copia el contenido de `database/dirigentes/01_modelo_datos_dngi02.sql`
4. Ejecuta el script
5. Verifica que aparezca: `✅ Sistema de Dirigentes DNGI-02 creado exitosamente`

### **PASO 2: Verificar Constraint en Personas**

Si recibes error "no unique or exclusion constraint matching ON CONFLICT", ejecuta:

```sql
-- Agregar constraint único para documento
ALTER TABLE personas 
ADD CONSTRAINT uq_persona_documento UNIQUE (tipo_documento, numero_documento);
```

### **PASO 3: Iniciar Frontend**

```bash
npm run dev
```

---

## 🎯 GUÍA DE USO

### Pantalla Principal

1. **Dashboard con KPIs:**
   - Total de dirigentes activos
   - Con SFH1 aprobado
   - Documentos completos
   - Membresías por vencer

2. **Filtros:**
   - Por cargo (Jefe Grupo, Dirigente, etc.)
   - Por nivel de formación (SFH1, INAF, CAB, CAF)
   - Por rama asignada
   - Por estado (Activo, Inactivo)

3. **Lista con tarjetas:**
   - Información del dirigente
   - Indicadores de formación
   - Progreso de documentos
   - Acciones rápidas

### Exportación

#### CSV (Lista completa)
1. Click en botón **"Exportar"**
2. Selecciona **"Exportar a CSV"**
3. Se descarga archivo Excel-compatible

#### PDF Individual
1. En la fila del dirigente, hover sobre **⬇**
2. Click en **"PDF"**
3. Se descarga formulario DNGI-02 oficial

#### Word Individual
1. En la fila del dirigente, hover sobre **⬇**
2. Click en **"Word"**
3. Se descarga versión editable

#### PDF Masivo
1. Aplica filtros deseados
2. Click en **"Exportar"**
3. Selecciona **"Descargar todos en PDF"**
4. Se descargan todos los DNGI-02 filtrados

---

## ⚠️ TROUBLESHOOTING

### Error: "no unique or exclusion constraint"
```sql
ALTER TABLE personas 
ADD CONSTRAINT uq_persona_documento UNIQUE (tipo_documento, numero_documento);
```

### Error: "invalid input value for enum sexo_enum: M"
El sistema convierte automáticamente M → MASCULINO, F → FEMENINO

### Error: "ON CONFLICT does not support deferrable"
El constraint `uq_contacto_principal` ya NO es DEFERRABLE

### Error: "dirigente.persona.nombres is undefined"
Ejecuta la función actualizada `obtener_dirigentes_completo` que retorna `persona` como objeto anidado

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Script SQL ejecutado en Supabase
- [ ] Constraint `uq_persona_documento` existe
- [ ] Componente DirigentesV2 carga sin errores
- [ ] Puedo registrar un nuevo dirigente
- [ ] Los dirigentes aparecen en la lista
- [ ] El buscador funciona
- [ ] Puedo exportar a CSV
- [ ] Puedo exportar a PDF individual
- [ ] Puedo exportar a Word individual
- [ ] El menú de exportación hover se muestra correctamente

---

## 🎉 RESULTADO FINAL

**Sistema completo DNGI-02 que incluye:**
- ✅ Diseño moderno Glassmorphism
- ✅ Formulario oficial DNGI-02
- ✅ Exportación PDF/Word/CSV
- ✅ Gestión de documentos
- ✅ Dashboard con métricas
- ✅ Datos de salud centralizados en personas (DRY)
- ✅ Validaciones completas en backend
- ✅ UI responsive y accesible

---

**Versión 2.1 - 23 de enero de 2026 🚀**
