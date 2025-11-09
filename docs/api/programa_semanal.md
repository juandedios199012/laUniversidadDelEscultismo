# 📝 Programa Semanal API - Sistema Scout Lima 12

## 📋 **Resumen del Módulo**

El módulo de Programa Semanal gestiona la planificación, ejecución y evaluación de las actividades semanales de cada rama, incluyendo la metodología scout y el seguimiento del programa educativo. Contiene **~10 funciones** especializadas en programación semanal.

**Archivo:** `database/13_functions_programa_semanal.sql`

---

## 🔧 **Funciones Principales**

### **📅 PLANIFICACIÓN SEMANAL**

#### **1. Crear Programa Semanal**
```sql
crear_programa_semanal(
  p_rama rama_enum,
  p_fecha_inicio DATE,
  p_fecha_fin DATE,
  p_tema_central VARCHAR(200),
  p_objetivos_educativos JSON,
  p_dirigente_planificador_id UUID,
  p_metodologia VARCHAR(100) DEFAULT 'TRADICIONAL',
  p_materiales_necesarios JSON DEFAULT '[]',
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSON
```

**Metodologías disponibles:**
- `TRADICIONAL` - Metodología scout tradicional
- `APRENDER_HACIENDO` - Énfasis en aprendizaje experiencial
- `JUEGO_DRAMATICO` - Basado en juegos y dramatización
- `PROYECTO` - Metodología de proyectos
- `EXPLORACION` - Metodología de exploración y descubrimiento
- `COOPERATIVO` - Aprendizaje cooperativo
- `MIXTA` - Combinación de metodologías

**Ejemplo:**
```sql
SELECT crear_programa_semanal(
  p_rama := 'LOBATOS',
  p_fecha_inicio := '2024-11-04',
  p_fecha_fin := '2024-11-08',
  p_tema_central := 'Los Exploradores del Amazonas',
  p_objetivos_educativos := '{
    "fisico": [
      "Desarrollar habilidades de orientación básica",
      "Practicar nudos simples"
    ],
    "intelectual": [
      "Conocer la fauna amazónica",
      "Aprender sobre conservación"
    ],
    "social": [
      "Trabajar en equipo durante las expediciones",
      "Respetar las ideas de los compañeros"
    ],
    "espiritual": [
      "Valorar la naturaleza como creación",
      "Reflexionar sobre nuestro papel en la conservación"
    ]
  }'::json,
  p_dirigente_planificador_id := 'dir123-456-789',
  p_metodologia := 'JUEGO_DRAMATICO',
  p_materiales_necesarios := '[
    "Brújulas de cartón",
    "Mapas del amazonas",
    "Cuerda para nudos",
    "Figuras de animales",
    "Material para disfraces"
  ]'::json,
  p_observaciones := 'Programa especial previo al campamento de noviembre'
);
```

#### **2. Agregar Actividad al Programa**
```sql
agregar_actividad_programa(
  p_programa_id UUID,
  p_nombre_actividad VARCHAR(200),
  p_descripcion TEXT,
  p_tipo_actividad tipo_actividad_programa_enum,
  p_duracion_minutos INTEGER,
  p_orden_secuencia INTEGER,
  p_objetivos_especificos JSON DEFAULT '[]',
  p_materiales JSON DEFAULT '[]',
  p_responsable_dirigente_id UUID DEFAULT NULL,
  p_observaciones_metodologicas TEXT DEFAULT NULL
) RETURNS JSON
```

**Tipos de actividad:**
- `APERTURA` - Apertura y bienvenida
- `JUEGO_INICIAL` - Juego inicial de integración
- `ACTIVIDAD_PRINCIPAL` - Actividad principal del tema
- `MANUALIDAD` - Actividad manual o artesanal
- `JUEGO_TRADICIONAL` - Juego tradicional scout
- `HISTORIA_CUENTO` - Narración de historias
- `REFLEXION` - Momento de reflexión
- `CANCION` - Cantos y canciones
- `CIERRE` - Cierre y despedida
- `REFRIGERIO` - Momento de refrigerio

#### **3. Actualizar Programa Semanal**
```sql
actualizar_programa_semanal(
  p_programa_id UUID,
  p_datos_actualizacion JSON
) RETURNS JSON
```

---

### **📋 EJECUCIÓN Y SEGUIMIENTO**

#### **4. Registrar Ejecución de Actividad**
```sql
registrar_ejecucion_actividad(
  p_actividad_id UUID,
  p_fecha_ejecucion DATE,
  p_hora_inicio TIME,
  p_hora_fin TIME,
  p_scouts_participantes JSON,
  p_dirigente_ejecutor_id UUID,
  p_nivel_participacion INTEGER DEFAULT 5,
  p_objetivos_logrados JSON DEFAULT '[]',
  p_observaciones_ejecucion TEXT DEFAULT NULL,
  p_modificaciones_realizadas TEXT DEFAULT NULL
) RETURNS JSON
```

**Ejemplo:**
```sql
SELECT registrar_ejecucion_actividad(
  p_actividad_id := 'act123-456-789',
  p_fecha_ejecucion := '2024-11-05',
  p_hora_inicio := '15:30:00',
  p_hora_fin := '16:15:00',
  p_scouts_participantes := '[
    {"scout_id": "scout123", "participacion": "ALTA"},
    {"scout_id": "scout456", "participacion": "MEDIA"},
    {"scout_id": "scout789", "participacion": "ALTA"}
  ]'::json,
  p_dirigente_ejecutor_id := 'dir123-456-789',
  p_nivel_participacion := 8,
  p_objetivos_logrados := '[
    "Los scouts aprendieron 3 nudos básicos",
    "Mostraron excelente trabajo en equipo",
    "Demostraron creatividad en las dramatizaciones"
  ]'::json,
  p_observaciones_ejecucion := 'Actividad muy exitosa, los scouts se mostraron muy motivados con la temática amazónica',
  p_modificaciones_realizadas := 'Se extendió 15 minutos por el alto interés mostrado'
);
```

#### **5. Obtener Programa por Fecha**
```sql
obtener_programa_por_fecha(
  p_rama rama_enum,
  p_fecha DATE
) RETURNS JSON
```

#### **6. Listar Programas de Rama**
```sql
listar_programas_rama(
  p_rama rama_enum,
  p_fecha_desde DATE DEFAULT CURRENT_DATE - INTERVAL '1 month',
  p_fecha_hasta DATE DEFAULT CURRENT_DATE + INTERVAL '1 month'
) RETURNS JSON
```

---

### **📊 EVALUACIÓN Y ANÁLISIS**

#### **7. Evaluar Programa Semanal**
```sql
evaluar_programa_semanal(
  p_programa_id UUID,
  p_evaluador_id UUID,
  p_criterios_evaluacion JSON,
  p_puntos_fuertes TEXT DEFAULT NULL,
  p_areas_mejora TEXT DEFAULT NULL,
  p_sugerencias TEXT DEFAULT NULL,
  p_calificacion_general INTEGER DEFAULT 5
) RETURNS JSON
```

**Criterios de evaluación:**
```json
{
  "planificacion": {
    "puntaje": 4.5,
    "observaciones": "Excelente planificación, objetivos claros"
  },
  "metodologia": {
    "puntaje": 4.0,
    "observaciones": "Metodología apropiada para la edad"
  },
  "participacion_scouts": {
    "puntaje": 4.8,
    "observaciones": "Alta participación y entusiasmo"
  },
  "logro_objetivos": {
    "puntaje": 4.2,
    "observaciones": "Objetivos mayormente alcanzados"
  },
  "creatividad": {
    "puntaje": 4.6,
    "observaciones": "Actividades muy creativas y motivadoras"
  }
}
```

#### **8. Generar Reporte de Efectividad**
```sql
generar_reporte_efectividad_programas(
  p_rama rama_enum DEFAULT NULL,
  p_fecha_desde DATE DEFAULT CURRENT_DATE - INTERVAL '3 months',
  p_fecha_hasta DATE DEFAULT CURRENT_DATE,
  p_dirigente_id UUID DEFAULT NULL
) RETURNS JSON
```

---

### **📈 ANÁLISIS Y MEJORA CONTINUA**

#### **9. Analizar Tendencias de Participación**
```sql
analizar_tendencias_participacion_programas(
  p_rama rama_enum,
  p_periodo_meses INTEGER DEFAULT 6
) RETURNS JSON
```

**Análisis incluye:**
- Niveles de participación por tipo de actividad
- Metodologías más efectivas
- Temas que generan mayor interés
- Horarios de mayor/menor participación
- Correlación con asistencia general

#### **10. Obtener Sugerencias de Mejora**
```sql
obtener_sugerencias_mejora_programa(
  p_rama rama_enum,
  p_basado_en_historico BOOLEAN DEFAULT true
) RETURNS JSON
```

---

## 📋 **Estructura del Programa Scout**

### **Metodología por Rama:**

#### **🌟 CASTORES (6-8 años):**
```sql
-- Enfoque en juego y exploración
-- Actividades de 15-20 minutos máximo
-- Énfasis en desarrollo de habilidades básicas
-- Metodología principalmente lúdica
```

#### **🐺 LOBATOS (8-11 años):**
```sql
-- Metodología de "Libro de la Selva"
-- Actividades de 20-30 minutos
-- Desarrollo de habilidades scouts básicas
-- Énfasis en trabajo en seisena
```

#### **⚜️ SCOUTS (11-14 años):**
```sql
-- Sistema de patrullas
-- Actividades de 30-45 minutos
-- Desarrollo de liderazgo
-- Énfasis en aventura y campismo
```

#### **🏔️ VENTURES (14-17 años):**
```sql
-- Metodología de proyectos
-- Actividades de 45-60 minutos
-- Servicio comunitario
-- Desarrollo de especialidades
```

#### **🎯 ROVERS (17-21 años):**
```sql
-- Autogestión y liderazgo
-- Proyectos de servicio prolongados
-- Mentoría a ramas menores
-- Preparación para vida adulta
```

---

## 🔒 **Validaciones y Reglas de Negocio**

### **Validaciones Automáticas:**
- ✅ **Duración apropiada** - Actividades acordes a la edad de la rama
- ✅ **Secuencia lógica** - Orden coherente de actividades
- ✅ **Objetivos educativos** - Mínimo 1 objetivo por área de desarrollo
- ✅ **Metodología coherente** - Metodología apropiada para la rama
- ✅ **Materiales disponibles** - Verificar disponibilidad en inventario

### **Reglas Pedagógicas:**
```sql
-- Máximo 60% de actividades sedentarias por programa
-- Mínimo 1 actividad al aire libre por programa
-- Equilibrio entre las 4 áreas de desarrollo
-- Rotación de responsabilidades entre dirigentes
```

---

## 📊 **Dashboards y Métricas**

### **KPIs del Programa:**
```sql
-- Métricas de efectividad
SELECT obtener_kpis_programa_semanal();

-- Resultado esperado:
{
  "participacion_promedio": 87.5,
  "satisfaccion_scouts": 4.3,
  "cumplimiento_objetivos": 89.2,
  "programas_evaluados": 95.8,
  "metodologias_mas_efectivas": ["JUEGO_DRAMATICO", "PROYECTO"],
  "temas_mayor_interes": ["Aventura", "Naturaleza", "Tecnología"]
}
```

---

## 🧪 **Testing y Validación**

### **Funciones de Prueba:**
```sql
-- Validar módulo completo
SELECT validar_functions_programa_semanal();

-- Generar programas de prueba
SELECT generar_programas_prueba_rama('LOBATOS', 8);

-- Test de evaluaciones
SELECT test_evaluaciones_programa();
```

---

## 📱 **Integración con Frontend**

### **Ejemplo TypeScript:**
```typescript
interface ProgramaSemanal {
  id: string;
  rama: Rama;
  fechaInicio: string;
  fechaFin: string;
  temaCentral: string;
  objetivosEducativos: ObjetivosEducativos;
  metodologia: MetodologiaPrograma;
  actividades: ActividadPrograma[];
  materialesNecesarios: string[];
  dirigentePlanificador: Dirigente;
  estado: EstadoPrograma;
}

export class ProgramaSemanalService {
  static async crear(programa: CrearProgramaData): Promise<ProgramaSemanal> {
    const response = await DatabaseFunctions.callFunction('crear_programa_semanal', {
      p_rama: programa.rama,
      p_fecha_inicio: programa.fechaInicio,
      p_fecha_fin: programa.fechaFin,
      p_tema_central: programa.temaCentral,
      p_objetivos_educativos: programa.objetivosEducativos,
      p_dirigente_planificador_id: programa.dirigentePlanificadorId,
      p_metodologia: programa.metodologia,
      p_materiales_necesarios: programa.materialesNecesarios
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data;
  }
  
  static async obtenerPorFecha(rama: Rama, fecha: string): Promise<ProgramaSemanal | null> {
    const response = await DatabaseFunctions.callFunction('obtener_programa_por_fecha', {
      p_rama: rama,
      p_fecha: fecha
    });
    
    return response.success ? response.data : null;
  }
  
  static async evaluarPrograma(evaluacion: EvaluacionProgramaData): Promise<void> {
    const response = await DatabaseFunctions.callFunction('evaluar_programa_semanal', {
      p_programa_id: evaluacion.programaId,
      p_evaluador_id: evaluacion.evaluadorId,
      p_criterios_evaluacion: evaluacion.criterios,
      p_puntos_fuertes: evaluacion.puntosFuertes,
      p_areas_mejora: evaluacion.areasMejora,
      p_calificacion_general: evaluacion.calificacionGeneral
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
  }
}
```

---

## 🎯 **Casos de Uso Comunes**

### **1. Planificación Semanal:**
```sql
-- 1. Crear programa base
SELECT crear_programa_semanal(
  'LOBATOS', '2024-11-04', '2024-11-08', 'Aventuras en la Selva'
);

-- 2. Agregar actividades secuenciales
SELECT agregar_actividad_programa(programa_id, 'Gran Aullido', 'APERTURA', 15, 1);
SELECT agregar_actividad_programa(programa_id, 'Caza del Tesoro', 'ACTIVIDAD_PRINCIPAL', 30, 2);
SELECT agregar_actividad_programa(programa_id, 'Historia de Mowgli', 'HISTORIA_CUENTO', 20, 3);

-- 3. Verificar materiales disponibles
SELECT verificar_disponibilidad_materiales(programa_id);
```

### **2. Ejecución del Programa:**
```sql
-- Registrar ejecución de cada actividad
SELECT registrar_ejecucion_actividad(
  actividad_id, CURRENT_DATE, '15:30:00', '16:00:00', scouts_json
);

-- Documentar observaciones
UPDATE actividades_programa 
SET observaciones_ejecucion = 'Excelente participación'
WHERE id = actividad_id;
```

### **3. Evaluación y Mejora:**
```sql
-- Evaluar programa completo
SELECT evaluar_programa_semanal(programa_id, evaluador_id, criterios_json);

-- Generar reporte de efectividad
SELECT generar_reporte_efectividad_programas('LOBATOS', '2024-09-01', '2024-11-30');

-- Obtener sugerencias
SELECT obtener_sugerencias_mejora_programa('LOBATOS', true);
```

---

**📈 Total: 10 funciones implementadas para gestión completa del programa semanal**

**🔗 [Volver a API Principal](../API_DOCUMENTATION.md)**