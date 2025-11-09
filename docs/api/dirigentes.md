# 👨‍🏫 Dirigentes API - Sistema Scout Lima 12

## 📋 **Resumen del Módulo**

El módulo de Dirigentes gestiona la información, formación, evaluaciones y desarrollo de los dirigentes del grupo scout. Contiene **~20 funciones** para la administración completa del equipo dirigente.

**Archivo:** `database/09_functions_dirigentes.sql`

---

## 🔧 **Funciones Principales**

### **👥 GESTIÓN DE DIRIGENTES**

#### **1. Registrar Dirigente**
```sql
registrar_dirigente(
  p_nombre VARCHAR(100),
  p_apellidos VARCHAR(150),
  p_email VARCHAR(200),
  p_telefono VARCHAR(20),
  p_cargo cargo_dirigente_enum,
  p_rama_asignada rama_enum DEFAULT NULL,
  p_fecha_inicio DATE DEFAULT CURRENT_DATE,
  p_nivel_formacion nivel_formacion_enum DEFAULT 'INICIAL',
  p_datos_contacto JSON DEFAULT '{}',
  p_experiencia_previa TEXT DEFAULT NULL
) RETURNS JSON
```

**Cargos de dirigente:**
- `COORDINADOR_GENERAL` - Coordinador del grupo
- `COORDINADOR_RAMA` - Coordinador de rama específica
- `DIRIGENTE` - Dirigente de sección
- `ASISTENTE` - Asistente de dirigente
- `ESPECIALISTA` - Especialista en área específica
- `CONSEJERO` - Consejero de rovers
- `INSTRUCTOR` - Instructor de formación

**Niveles de formación:**
- `INICIAL` - Formación básica pendiente
- `BASICO` - Curso básico completado
- `INTERMEDIO` - Formación intermedia
- `AVANZADO` - Formación avanzada
- `ESPECIALIZADO` - Especialización en área

**Ejemplo:**
```sql
SELECT registrar_dirigente(
  p_nombre := 'María Elena',
  p_apellidos := 'García Rodríguez',
  p_email := 'maria.garcia@scoutlima12.org',
  p_telefono := '987654321',
  p_cargo := 'COORDINADOR_RAMA',
  p_rama_asignada := 'LOBATOS',
  p_fecha_inicio := '2024-01-15',
  p_nivel_formacion := 'INTERMEDIO',
  p_datos_contacto := '{
    "direccion": "Av. Principal 456, San Isidro",
    "telefono_emergencia": "987123456",
    "contacto_familiar": "Carlos García - Esposo"
  }'::json,
  p_experiencia_previa := '5 años como dirigente en Grupo Scout San Martín'
);
```

#### **2. Actualizar Datos Dirigente**
```sql
actualizar_datos_dirigente(
  p_dirigente_id UUID,
  p_datos_actualizacion JSON
) RETURNS JSON
```

#### **3. Obtener Dirigente por ID**
```sql
obtener_dirigente_por_id(p_dirigente_id UUID) RETURNS JSON
```

#### **4. Buscar Dirigentes por Criterio**
```sql
buscar_dirigentes_criterio(
  p_filtros JSON DEFAULT '{}',
  p_limite INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS JSON
```

**Filtros disponibles:**
```json
{
  "cargo": "COORDINADOR_RAMA",
  "rama_asignada": "LOBATOS",
  "estado": "ACTIVO",
  "nivel_formacion": "INTERMEDIO",
  "texto_busqueda": "María",
  "fecha_inicio_desde": "2024-01-01",
  "experiencia_minima_anos": 2
}
```

---

### **📚 FORMACIÓN Y CAPACITACIÓN**

#### **5. Registrar Formación**
```sql
registrar_formacion_dirigente(
  p_dirigente_id UUID,
  p_tipo_formacion VARCHAR(100),
  p_nombre_curso VARCHAR(200),
  p_institucion VARCHAR(150),
  p_fecha_inicio DATE,
  p_fecha_fin DATE DEFAULT NULL,
  p_horas_academicas INTEGER DEFAULT NULL,
  p_certificado_url TEXT DEFAULT NULL,
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSON
```

**Tipos de formación:**
- `CURSO_BASICO` - Curso básico de dirigentes
- `CURSO_INTERMEDIO` - Curso intermedio
- `ESPECIALIZACION` - Especialización en área específica
- `TALLER` - Taller de capacitación
- `SEMINARIO` - Seminario o conferencia
- `DIPLOMADO` - Diplomado en liderazgo scout
- `CERTIFICACION` - Certificación internacional

**Ejemplo:**
```sql
SELECT registrar_formacion_dirigente(
  p_dirigente_id := 'dir123-456-789',
  p_tipo_formacion := 'CURSO_INTERMEDIO',
  p_nombre_curso := 'Gestión de Programas Scouts',
  p_institucion := 'Asociación de Scouts del Perú',
  p_fecha_inicio := '2024-03-15',
  p_fecha_fin := '2024-03-17',
  p_horas_academicas := 24,
  p_certificado_url := 'https://storage/certificados/cert_001.pdf',
  p_observaciones := 'Curso completado con calificación Excelente'
);
```

#### **6. Obtener Historial de Formación**
```sql
obtener_historial_formacion(p_dirigente_id UUID) RETURNS JSON
```

#### **7. Verificar Requisitos de Formación**
```sql
verificar_requisitos_formacion(
  p_dirigente_id UUID,
  p_cargo_objetivo cargo_dirigente_enum DEFAULT NULL
) RETURNS JSON
```

#### **8. Programar Capacitación**
```sql
programar_capacitacion(
  p_titulo VARCHAR(200),
  p_descripcion TEXT,
  p_fecha_capacitacion DATE,
  p_hora_inicio TIME,
  p_duracion_horas INTEGER,
  p_instructor VARCHAR(150),
  p_dirigentes_objetivo JSON DEFAULT '[]',
  p_ubicacion VARCHAR(200) DEFAULT NULL
) RETURNS JSON
```

---

### **📊 EVALUACIONES Y DESEMPEÑO**

#### **9. Crear Evaluación Dirigente**
```sql
crear_evaluacion_dirigente(
  p_dirigente_id UUID,
  p_periodo_evaluacion VARCHAR(50),
  p_evaluador_id UUID,
  p_criterios_evaluacion JSON,
  p_observaciones TEXT DEFAULT NULL,
  p_plan_mejora TEXT DEFAULT NULL
) RETURNS JSON
```

**Estructura de criterios_evaluacion:**
```json
{
  "liderazgo": {
    "puntaje": 4.5,
    "observaciones": "Excelente capacidad de motivar a los scouts"
  },
  "planificacion": {
    "puntaje": 4.0,
    "observaciones": "Buena organización de actividades"
  },
  "comunicacion": {
    "puntaje": 4.2,
    "observaciones": "Comunicación clara y efectiva"
  },
  "trabajo_equipo": {
    "puntaje": 4.8,
    "observaciones": "Colabora excelentemente con otros dirigentes"
  },
  "formacion_continua": {
    "puntaje": 3.8,
    "observaciones": "Debe continuar con capacitaciones"
  }
}
```

#### **10. Obtener Evaluaciones Dirigente**
```sql
obtener_evaluaciones_dirigente(
  p_dirigente_id UUID,
  p_fecha_desde DATE DEFAULT NULL,
  p_fecha_hasta DATE DEFAULT NULL
) RETURNS JSON
```

#### **11. Generar Reporte de Desempeño**
```sql
generar_reporte_desempeno(
  p_dirigente_id UUID,
  p_periodo VARCHAR(50) DEFAULT 'ANUAL'
) RETURNS JSON
```

---

### **📈 DESARROLLO Y CARRERA**

#### **12. Definir Plan de Desarrollo**
```sql
definir_plan_desarrollo(
  p_dirigente_id UUID,
  p_objetivos JSON,
  p_actividades_desarrollo JSON,
  p_fecha_objetivo DATE,
  p_responsable_seguimiento_id UUID
) RETURNS JSON
```

#### **13. Actualizar Progreso Desarrollo**
```sql
actualizar_progreso_desarrollo(
  p_plan_id UUID,
  p_progreso_actividades JSON,
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSON
```

#### **14. Obtener Dirigentes Próximos a Promoción**
```sql
obtener_dirigentes_promocion(
  p_cargo_objetivo cargo_dirigente_enum DEFAULT NULL
) RETURNS JSON
```

---

### **🎯 ASIGNACIONES Y RESPONSABILIDADES**

#### **15. Asignar Responsabilidad**
```sql
asignar_responsabilidad_dirigente(
  p_dirigente_id UUID,
  p_tipo_responsabilidad VARCHAR(100),
  p_descripcion TEXT,
  p_fecha_inicio DATE DEFAULT CURRENT_DATE,
  p_fecha_fin DATE DEFAULT NULL,
  p_rama rama_enum DEFAULT NULL,
  p_metadata JSON DEFAULT '{}'
) RETURNS JSON
```

**Tipos de responsabilidad:**
- `COORDINACION_RAMA` - Coordinación de rama específica
- `PROGRAMA_SEMANAL` - Responsable del programa semanal
- `CAMPAMENTOS` - Coordinación de campamentos
- `INVENTARIO` - Gestión de inventario
- `FINANZAS` - Administración financiera
- `FORMACION` - Formación de otros dirigentes
- `RELACIONES_PUBLICAS` - Comunicación externa

#### **16. Obtener Responsabilidades Activas**
```sql
obtener_responsabilidades_dirigente(p_dirigente_id UUID) RETURNS JSON
```

#### **17. Transferir Responsabilidad**
```sql
transferir_responsabilidad(
  p_responsabilidad_id UUID,
  p_nuevo_dirigente_id UUID,
  p_fecha_transferencia DATE DEFAULT CURRENT_DATE,
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSON
```

---

### **📊 ESTADÍSTICAS Y REPORTES**

#### **18. Estadísticas Generales Dirigentes**
```sql
obtener_estadisticas_dirigentes() RETURNS JSON
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total_dirigentes": 25,
    "dirigentes_activos": 22,
    "dirigentes_en_formacion": 8,
    "por_cargo": {
      "COORDINADOR_GENERAL": 1,
      "COORDINADOR_RAMA": 5,
      "DIRIGENTE": 12,
      "ASISTENTE": 5,
      "ESPECIALISTA": 2
    },
    "por_nivel_formacion": {
      "INICIAL": 3,
      "BASICO": 8,
      "INTERMEDIO": 10,
      "AVANZADO": 4,
      "ESPECIALIZADO": 2
    },
    "antiguedad_promedio_anos": 3.5,
    "dirigentes_nuevos_ano": 4
  }
}
```

#### **19. Análisis de Carga de Trabajo**
```sql
analizar_carga_trabajo_dirigentes() RETURNS JSON
```

#### **20. Reporte de Formación Pendiente**
```sql
generar_reporte_formacion_pendiente() RETURNS JSON
```

---

## 🔒 **Validaciones y Reglas de Negocio**

### **Validaciones Automáticas:**
- ✅ **Email único** - No permitir emails duplicados
- ✅ **Formación requerida** - Validar formación mínima por cargo
- ✅ **Asignación coherente** - Un dirigente por rama como coordinador
- ✅ **Evaluaciones periódicas** - Evaluación anual obligatoria
- ✅ **Límite de responsabilidades** - Máximo 3 responsabilidades activas por dirigente

### **Reglas de Promoción:**
```sql
-- COORDINADOR_RAMA requiere nivel INTERMEDIO mínimo
-- COORDINADOR_GENERAL requiere nivel AVANZADO
-- Evaluación promedio > 4.0 para promoción
-- Mínimo 2 años de experiencia para coordinador
```

---

## 📊 **Performance y Dashboards**

### **KPIs de Dirigentes:**
```sql
-- Métricas clave
SELECT obtener_kpis_dirigentes();

-- Resultado esperado:
{
  "ratio_dirigentes_scouts": "1:5.2",
  "porcentaje_formacion_actualizada": 85.5,
  "satisfaccion_promedio_dirigentes": 4.3,
  "rotacion_anual": 8.5,
  "dirigentes_con_evaluacion_excelente": 12,
  "horas_formacion_promedio_ano": 32
}
```

### **Índices de Performance:**
- `idx_dirigentes_email` - Búsqueda por email único
- `idx_dirigentes_cargo_rama` - Filtros por cargo y rama
- `idx_formacion_dirigente_fecha` - Historial de formación
- `idx_evaluaciones_periodo` - Evaluaciones por período

---

## 🧪 **Testing y Validación**

### **Funciones de Prueba:**
```sql
-- Validar módulo completo
SELECT validar_functions_dirigentes();

-- Generar datos de prueba
SELECT generar_datos_prueba_dirigentes(15);

-- Test de evaluaciones
SELECT test_sistema_evaluaciones();
```

---

## 📱 **Integración con Frontend**

### **Ejemplo TypeScript:**
```typescript
interface Dirigente {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  cargo: CargoDirigente;
  ramaAsignada?: Rama;
  nivelFormacion: NivelFormacion;
  fechaInicio: string;
  estado: EstadoDirigente;
  responsabilidades: Responsabilidad[];
}

export class DirigenteService {
  static async registrar(dirigente: RegistroDirigenteData): Promise<Dirigente> {
    const response = await DatabaseFunctions.callFunction('registrar_dirigente', {
      p_nombre: dirigente.nombre,
      p_apellidos: dirigente.apellidos,
      p_email: dirigente.email,
      p_telefono: dirigente.telefono,
      p_cargo: dirigente.cargo,
      p_rama_asignada: dirigente.ramaAsignada,
      p_nivel_formacion: dirigente.nivelFormacion
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data;
  }
  
  static async obtenerEstadisticas(): Promise<EstadisticasDirigentes> {
    const response = await DatabaseFunctions.callFunction('obtener_estadisticas_dirigentes');
    return response.success ? response.data : null;
  }
}
```

---

## 🎯 **Casos de Uso Comunes**

### **1. Incorporación de Nuevo Dirigente:**
```sql
-- 1. Registrar dirigente
SELECT registrar_dirigente(...);

-- 2. Asignar responsabilidades iniciales
SELECT asignar_responsabilidad_dirigente(...);

-- 3. Programar formación básica
SELECT programar_capacitacion(...);

-- 4. Definir plan de desarrollo
SELECT definir_plan_desarrollo(...);
```

### **2. Evaluación Anual:**
```sql
-- Crear evaluación
SELECT crear_evaluacion_dirigente(...);

-- Generar reporte de desempeño
SELECT generar_reporte_desempeno(dirigente_id, 'ANUAL');

-- Verificar requisitos para promoción
SELECT verificar_requisitos_formacion(dirigente_id, 'COORDINADOR_RAMA');
```

### **3. Gestión de Formación:**
```sql
-- Verificar formación pendiente
SELECT generar_reporte_formacion_pendiente();

-- Registrar nueva formación
SELECT registrar_formacion_dirigente(...);

-- Analizar carga de trabajo
SELECT analizar_carga_trabajo_dirigentes();
```

---

**📈 Total: 20 funciones implementadas para gestión completa de dirigentes**

**🔗 [Volver a API Principal](../API_DOCUMENTATION.md)**