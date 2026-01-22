# 🔍 Auditoría: Módulo de Reportes vs Base de Datos Real

**Fecha:** 21 de enero de 2026  
**Objetivo:** Validar compatibilidad del módulo de reportes con el modelo de datos actual

---

## 📊 Resumen Ejecutivo

### ✅ Estado General: **COMPATIBLE CON AJUSTES MENORES**

| Aspecto | Estado | Notas |
|---------|--------|-------|
| **Tablas principales** | ✅ Existen | personas, scouts, asistencias |
| **Relaciones FK** | ✅ Correctas | persona_id, scout_id funcionan |
| **Campos clave** | ⚠️ 90% compatible | Algunos nombres difieren |
| **ENUMs** | ✅ Completos | Todos los necesarios existen |
| **Nuevas tablas disponibles** | ✅ Oportunidad | familiares_scout, puntos_patrulla, inscripciones_anuales |

### 🎯 Acciones Requeridas

1. ✏️ **Ajustar nombres de tablas** en queries (3 cambios)
2. 🔧 **Actualizar interfaces TypeScript** (agregar campos faltantes)
3. ➕ **Agregar nuevos reportes** aprovechando datos adicionales
4. 📝 **Corregir tipos de datos** (anio_estudios: INTEGER → VARCHAR)

---

## 🗂️ Análisis por Tabla

### 1️⃣ PERSONAS (31 columnas)

#### ✅ Campos que coinciden perfectamente

| Campo Reporte | Campo BD | Tipo BD | Notas |
|---------------|----------|---------|-------|
| `nombre` | `nombres` | VARCHAR | ✅ |
| `apellido` | `apellidos` | VARCHAR | ✅ |
| `fechaNacimiento` | `fecha_nacimiento` | DATE | ✅ |
| `sexo` | `sexo` | sexo_enum | ✅ |
| `tipoDocumento` | `tipo_documento` | tipo_documento_enum | ✅ |
| `numeroDocumento` | `numero_documento` | VARCHAR | ✅ |
| `direccion` | `direccion` | TEXT | ✅ |
| `departamento` | `departamento` | VARCHAR | ✅ |
| `provincia` | `provincia` | VARCHAR | ✅ |
| `distrito` | `distrito` | VARCHAR | ✅ |
| `celular` | `celular` | VARCHAR | ✅ |
| `telefono` | `telefono` | VARCHAR | ✅ |
| `email` / `correo` | `correo` | VARCHAR | ✅ |
| `religion` | `religion` | VARCHAR | ✅ |
| `grupoSanguineo` | `grupo_sanguineo` | VARCHAR | ✅ |
| `factorSanguineo` | `factor_sanguineo` | VARCHAR | ✅ |
| `tipoDiscapacidad` | `tipo_discapacidad` | VARCHAR | ✅ |
| `carnetConadis` | `carnet_conadis` | VARCHAR | ✅ |
| `descripcionDiscapacidad` | `descripcion_discapacidad` | TEXT | ✅ |
| `fechaIngreso` | `fecha_ingreso` | DATE | ✅ **Arreglado recientemente** |

#### ➕ Campos adicionales en BD (no en reportes)

| Campo BD | Tipo | Uso potencial en reportes |
|----------|------|---------------------------|
| `pais` | VARCHAR | Agregar para scouts extranjeros |
| `foto_url` | TEXT | **Incluir en reportes con foto** |
| `observaciones` | TEXT | Agregar a reportes detallados |
| `estado` | estado_enum | **Filtrar scouts activos/inactivos** |
| `correo_institucional` | VARCHAR | Agregar como contacto alternativo |
| `celular_secundario` | VARCHAR | ✅ Ya en reportes |
| `correo_secundario` | VARCHAR | ✅ Ya en reportes |
| `codigo_postal` | VARCHAR | Agregar para reportes geográficos |

#### 🔧 Ajustes recomendados

```typescript
// src/modules/reports/types/reportTypes.ts
export interface ScoutReportData {
  // ... campos existentes ...
  
  // AGREGAR:
  pais?: string;
  fotoUrl?: string;
  codigoPostal?: string;
  observacionesPersona?: string;
  estadoPersona?: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'ELIMINADO';
}
```

---

### 2️⃣ SCOUTS (17 columnas)

#### ✅ Campos que coinciden

| Campo Reporte | Campo BD | Tipo BD | Notas |
|---------------|----------|---------|-------|
| `rama` | `rama_actual` | rama_enum | ✅ |
| `centroEstudio` | `centro_estudio` | VARCHAR | ✅ |
| `numeroRegistro` | `codigo_scout` | VARCHAR | ✅ |
| `fechaIngreso` | `fecha_ingreso` | DATE | ⚠️ **Redundante con personas.fecha_ingreso** |
| `seguroMedico` | `seguro_medico` | VARCHAR | ✅ |

#### ⚠️ Campos con diferencias

| Campo Reporte | Campo BD | Tipo Reporte | Tipo BD | Problema |
|---------------|----------|--------------|---------|----------|
| `anioEstudios` | `anio_estudios` | `string` | **VARCHAR** | ✅ OK - Ya está como string |

#### ➕ Campos adicionales en BD

| Campo BD | Tipo | Uso potencial |
|----------|------|---------------|
| `ocupacion` | VARCHAR | Agregar para scouts que trabajan |
| `centro_laboral` | VARCHAR | Agregar para scouts empleados |
| `fecha_ultimo_pago` | DATE | **Reporte de morosidad** |
| `observaciones` | TEXT | Notas específicas del scout |
| `estado` | estado_enum | Filtrar scouts activos |
| `codigo_asociado` | VARCHAR | **ID de asociación nacional** |
| `es_dirigente` | BOOLEAN | ✅ Ya se usa en queries |

#### 🔧 Ajustes recomendados

```typescript
export interface ScoutReportData {
  // ... campos existentes ...
  
  // AGREGAR:
  ocupacion?: string;
  centroLaboral?: string;
  fechaUltimoPago?: string;
  codigoAsociado?: string;
  estadoScout?: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'ELIMINADO';
  observacionesScout?: string;
}
```

---

### 3️⃣ FAMILIARES_SCOUT (12 columnas)

#### ⚠️ PROBLEMA CRÍTICO: Nombre de tabla incorrecto

**En módulo de reportes:** Se asume tabla `familiares`  
**En BD real:** La tabla es `familiares_scout`

#### ✅ Estructura correcta

| Campo Reporte | Campo BD | Tipo BD | Relación |
|---------------|----------|---------|----------|
| `id` | `id` | UUID | ✅ |
| `nombres` | → `personas.nombres` | VARCHAR | Via `persona_id` FK |
| `apellidos` | → `personas.apellidos` | VARCHAR | Via `persona_id` FK |
| `parentesco` | `parentesco` | parentesco_enum | ✅ |
| `correo` | → `personas.correo` | VARCHAR | Via `persona_id` FK |
| `celular` | → `personas.celular` | VARCHAR | Via `persona_id` FK |
| `esContactoEmergencia` | `es_contacto_emergencia` | BOOLEAN | ✅ |
| `esAutorizadoRecoger` | `es_autorizado_recoger` | BOOLEAN | ✅ |

#### 🔧 Cambios requeridos

**1. En queries de servicios:**

```typescript
// ANTES (INCORRECTO):
FROM familiares f

// DESPUÉS (CORRECTO):
FROM familiares_scout fs
INNER JOIN personas p ON fs.persona_id = p.id
WHERE fs.scout_id = $1
```

**2. En reportDataService.ts:**

```typescript
// Actualizar todas las referencias de 'familiares' a 'familiares_scout'
const { data: familiares } = await supabase
  .from('familiares_scout')  // ← CAMBIO AQUÍ
  .select(`
    id,
    parentesco,
    es_contacto_emergencia,
    es_autorizado_recoger,
    profesion,
    centro_laboral,
    cargo,
    personas (
      nombres,
      apellidos,
      tipo_documento,
      numero_documento,
      correo,
      celular,
      telefono,
      direccion
    )
  `)
  .eq('scout_id', scoutId);
```

---

### 4️⃣ PATRULLAS (13 columnas)

#### ✅ Todos los campos coinciden

| Campo Reporte | Campo BD | Tipo BD | ✅ |
|---------------|----------|---------|-----|
| `nombre` | `nombre` | VARCHAR | ✅ |
| `lema` | `lema` | VARCHAR | ✅ |
| `animalTotem` | `animal_totem` | VARCHAR | ✅ |
| `colorPatrulla` | `color_patrulla` | VARCHAR | ✅ |
| `rama` | `rama` | rama_enum | ✅ |
| `liderId` | `lider_id` | UUID | ✅ |
| `subliderId` | `sublider_id` | UUID | ✅ |
| `fechaFundacion` | `fecha_fundacion` | DATE | ✅ |

#### 📊 Relación con scouts

**Para obtener miembros de patrulla:**

```sql
-- Tabla intermedia: miembros_patrulla
SELECT 
  s.codigo_scout,
  p.nombres,
  p.apellidos,
  mp.cargo_patrulla,
  mp.fecha_ingreso
FROM miembros_patrulla mp
INNER JOIN scouts s ON mp.scout_id = s.id
INNER JOIN personas p ON s.persona_id = p.id
WHERE mp.patrulla_id = $1
AND mp.estado_miembro = 'ACTIVO'
```

---

### 5️⃣ PUNTAJES/PUNTOS_PATRULLA (9 columnas)

#### ⚠️ PROBLEMA: Nombre incorrecto en código

**En módulo reportes:** Se puede asumir `puntajes_patrulla`  
**En BD real:** La tabla es `puntos_patrulla`

#### ✅ Estructura

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `patrulla_id` | UUID | FK a patrullas |
| `concepto` | VARCHAR | Razón del puntaje |
| `puntos_obtenidos` | INTEGER | Cantidad de puntos |
| `fecha_otorgamiento` | DATE | Cuándo se otorgó |
| `actividad_id` | UUID | Relacionado con actividad |
| `dirigente_otorgante_id` | UUID | Quién otorgó |

#### 🔧 Query correcta para reportes

```typescript
const { data } = await supabase
  .from('puntos_patrulla')  // ← NO 'puntajes_patrulla'
  .select(`
    concepto,
    puntos_obtenidos,
    fecha_otorgamiento,
    patrullas (nombre, rama)
  `)
  .eq('patrulla_id', patrullaId)
  .order('fecha_otorgamiento', { ascending: false });
```

---

### 6️⃣ ASISTENCIAS (12 columnas)

#### ✅ Campos completos

| Campo Reporte | Campo BD | Tipo BD | ✅ |
|---------------|----------|---------|-----|
| `scoutId` | `scout_id` | UUID | ✅ |
| `fecha` | `fecha` | DATE | ✅ |
| `estado` | `estado_asistencia` | estado_asistencia_enum | ✅ |
| `tipoReunion` | `tipo_reunion` | VARCHAR | ✅ |
| `horaLlegada` | `hora_llegada` | TIME | ✅ |
| `horaSalida` | `hora_salida` | TIME | ✅ |
| `observaciones` | `observaciones` | TEXT | ✅ |

#### ➕ Campos adicionales útiles

| Campo BD | Uso en reportes |
|----------|-----------------|
| `actividad_id` | Relacionar con programa_actividades |
| `rama` | Filtrar por rama |
| `registrado_por` | Auditoría: quién registró |

#### 📊 Query mejorada para reportes

```typescript
const { data } = await supabase
  .from('asistencias')
  .select(`
    fecha,
    estado_asistencia,
    tipo_reunion,
    hora_llegada,
    hora_salida,
    rama,
    scouts (
      codigo_scout,
      rama_actual,
      personas (nombres, apellidos)
    ),
    programa_actividades (nombre, desarrollo)
  `)
  .gte('fecha', fechaInicio)
  .lte('fecha', fechaFin)
  .order('fecha', { ascending: false });
```

---

### 7️⃣ INSCRIPCIONES_ANUALES (13 columnas)

#### ✅ Nueva tabla no contemplada en reportes originales

**Oportunidad:** Crear reportes financieros y de inscripciones

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `scout_id` | UUID | FK a scouts |
| `ano` | INTEGER | Año de inscripción |
| `fecha_inscripcion` | DATE | Cuándo se inscribió |
| `monto_inscripcion` | NUMERIC | Monto a pagar |
| `fecha_pago` | DATE | Cuándo pagó |
| `estado_pago` | VARCHAR | Pagado/Pendiente |
| `documentos_completos` | BOOLEAN | Docs entregados |
| `certificado_medico` | BOOLEAN | Cert. médico entregado |
| `autorizacion_padres` | BOOLEAN | Autorización entregada |

#### 📊 Nuevos reportes posibles

1. **Reporte de Morosidad**
   - Scouts con pagos pendientes
   - Monto total pendiente por rama
   
2. **Reporte de Documentación**
   - Scouts con documentos incompletos
   - Certificados médicos vencidos

3. **Reporte Financiero Anual**
   - Ingresos por inscripciones
   - Proyección vs realidad

---

## 🔧 Cambios Requeridos en Código

### 1. Actualizar nombres de tablas

```typescript
// src/modules/reports/services/reportDataService.ts

// CAMBIO 1: familiares → familiares_scout
export async function getFamiliaresData(scoutId: string) {
  const { data } = await supabase
    .from('familiares_scout')  // ← CAMBIO AQUÍ
    .select(`
      *,
      personas (*)
    `)
    .eq('scout_id', scoutId);
  
  return data;
}

// CAMBIO 2: puntajes_patrulla → puntos_patrulla
export async function getPuntajesPatrulla(patrullaId: string) {
  const { data } = await supabase
    .from('puntos_patrulla')  // ← CAMBIO AQUÍ
    .select('*')
    .eq('patrulla_id', patrullaId);
  
  return data;
}
```

### 2. Agregar campos faltantes en interfaces

```typescript
// src/modules/reports/types/reportTypes.ts

export interface ScoutReportData {
  // Campos existentes...
  
  // AGREGAR ESTOS:
  pais?: string;
  fotoUrl?: string;
  codigoPostal?: string;
  ocupacion?: string;
  centroLaboral?: string;
  fechaUltimoPago?: string;
  codigoAsociado?: string;
  observacionesScout?: string;
  estadoScout?: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'ELIMINADO';
}

export interface FamiliarReportData {
  // Campos existentes...
  
  // AGREGAR ESTOS:
  profesion?: string;
  centroLaboral?: string;
  cargo?: string;
}

// NUEVA INTERFACE:
export interface InscripcionReportData {
  id: string;
  scoutId: string;
  ano: number;
  fechaInscripcion: string;
  montoInscripcion: number;
  fechaPago?: string;
  estadoPago: string;
  documentosCompletos: boolean;
  certificadoMedico: boolean;
  autorizacionPadres: boolean;
}
```

### 3. Ajustar ENUMs

```typescript
// Verificar que estos ENUMs existen en types
export enum Rama {
  LOBATOS = 'Lobatos',
  SCOUTS = 'Scouts',      // En BD también existe "Tropa"
  TROPA = 'Tropa',        // AGREGAR
  ROVERS = 'Rovers',
  MANADA = 'Manada',      // AGREGAR
  COMUNIDAD = 'Comunidad', // AGREGAR
  CLAN = 'Clan',          // AGREGAR
  DIRIGENTES = 'Dirigentes'
}

export enum EstadoAsistencia {
  PRESENTE = 'PRESENTE',
  AUSENTE = 'AUSENTE',
  TARDANZA = 'TARDANZA',
  JUSTIFICADO = 'JUSTIFICADO'
}

export enum Parentesco {
  PADRE = 'PADRE',
  MADRE = 'MADRE',
  TUTOR = 'TUTOR',
  HERMANO = 'HERMANO',
  TIO = 'TIO',
  ABUELO = 'ABUELO',
  OTRO = 'OTRO'
}
```

---

## ➕ Nuevos Reportes Sugeridos

### 1. Reporte de Inscripciones Anuales

**Propósito:** Control financiero y administrativo

**Datos disponibles:**
- Scouts inscritos por año
- Estado de pagos (pagado/pendiente)
- Monto recaudado vs proyectado
- Documentos faltantes por scout

**Componentes:**
```
📄 InscripcionesReportTemplate.tsx
🔧 getInscripcionesData() en reportDataService.ts
📊 createInscripcionesReportDOCX() en docxService.ts
```

### 2. Reporte de Ranking de Patrullas

**Propósito:** Gamificación y motivación

**Datos disponibles:**
- Puntos totales por patrulla
- Histórico de puntos por fecha
- Conceptos de puntajes
- Gráfico de evolución

**Tabla:** `puntos_patrulla`

### 3. Reporte de Contactos de Emergencia

**Propósito:** Seguridad en actividades

**Datos disponibles:**
- Familiares marcados como contacto de emergencia
- Múltiples números de contacto
- Datos médicos del scout
- Autorizados para recoger

**Tablas:** `familiares_scout` + `personas` + `scouts`

### 4. Reporte de Documentación Pendiente

**Propósito:** Compliance administrativo

**Datos disponibles:**
- Certificados médicos faltantes
- Autorizaciones pendientes
- Documentos de inscripción incompletos

**Tabla:** `inscripciones_anuales`

### 5. Reporte de Dirigentes

**Propósito:** Organigrama y certificaciones

**Datos disponibles:**
- Cargo y rama asignada
- Especialidades y certificaciones
- Fecha de inicio como dirigente
- Estado (activo/inactivo/licencia)

**Tabla:** `dirigentes` + `personas`

---

## 📝 Plan de Implementación

### Fase 1: Correcciones Críticas (1-2 horas)

1. ✏️ Cambiar `familiares` → `familiares_scout` en todos los servicios
2. ✏️ Cambiar `puntajes_patrulla` → `puntos_patrulla`
3. 🔧 Actualizar interfaces con campos faltantes
4. ✅ Probar reportes existentes

### Fase 2: Mejoras de Datos (2-3 horas)

5. ➕ Agregar campos adicionales a reportes (foto_url, ocupacion, etc.)
6. 🔧 Mejorar queries con JOINs correctos
7. 📊 Agregar filtros por estado y rama
8. ✅ Validar con datos reales

### Fase 3: Nuevos Reportes (4-6 horas)

9. 📄 Crear reporte de inscripciones anuales
10. 📄 Crear reporte de ranking de patrullas
11. 📄 Crear reporte de contactos de emergencia
12. 📄 Crear reporte de documentación pendiente

---

## ✅ Checklist de Validación

### Antes de usar en producción

- [ ] Cambiar nombres de tablas en todos los servicios
- [ ] Actualizar interfaces TypeScript
- [ ] Probar cada tipo de reporte con datos reales
- [ ] Validar que los JOINs funcionan correctamente
- [ ] Verificar que los ENUMs coinciden
- [ ] Testear exportación PDF y DOCX
- [ ] Revisar performance con >100 scouts
- [ ] Implementar manejo de errores para datos faltantes
- [ ] Agregar loading states en UI
- [ ] Documentar cambios en README del módulo

---

## 🎯 Conclusión

### ✅ Lo que funciona bien

- Estructura base del módulo de reportes es sólida
- Integración con Supabase es correcta
- Tipos de reportes (PDF/DOCX) funcionan
- La mayoría de campos existen y coinciden

### ⚠️ Lo que requiere ajustes

- 3 nombres de tablas incorrectos
- Campos adicionales no aprovechados
- Falta aprovechar tablas nuevas (inscripciones, puntos_patrulla)

### 💡 Oportunidades

- Crear 5 nuevos tipos de reportes valiosos
- Mejorar reportes existentes con datos adicionales
- Implementar dashboards con métricas en tiempo real

**Estimación total de trabajo:** 8-12 horas para tener todo completamente funcional y con los nuevos reportes implementados.

---

**Próximo paso:** ¿Quieres que implemente las correcciones críticas (Fase 1) primero?
