# 🏕️ Patrullas API - Sistema Scout Lima 12

## 📋 **Resumen del Módulo**

El módulo de Patrullas gestiona la organización, puntos, proyectos y competencias entre patrullas, incluyendo el sistema de reconocimientos y liderazgo. Contiene **~15 funciones** para la administración completa del sistema de patrullas.

**Archivo:** `database/10_functions_patrullas.sql`

---

## 🔧 **Funciones Principales**

### **🏕️ GESTIÓN DE PATRULLAS**

#### **1. Crear Patrulla**
```sql
crear_patrulla(
  p_nombre VARCHAR(100),
  p_rama rama_enum,
  p_totem VARCHAR(50),
  p_grito_patrulla VARCHAR(200) DEFAULT NULL,
  p_colores_patrulla VARCHAR(100) DEFAULT NULL,
  p_jefe_patrulla_id UUID DEFAULT NULL,
  p_subjefe_patrulla_id UUID DEFAULT NULL,
  p_descripcion TEXT DEFAULT NULL
) RETURNS JSON
```

**Ejemplo:**
```sql
SELECT crear_patrulla(
  p_nombre := 'Águilas Doradas',
  p_rama := 'SCOUTS',
  p_totem := 'AGUILA',
  p_grito_patrulla := '¡Águilas Doradas, volando alto!',
  p_colores_patrulla := 'Dorado y Azul',
  p_jefe_patrulla_id := 'scout123-456-789',
  p_subjefe_patrulla_id := 'scout456-789-123',
  p_descripcion := 'Patrulla fundada en 2024, especializada en actividades al aire libre'
);
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "patrulla_id": "patr123-456-789",
    "nombre": "Águilas Doradas",
    "codigo_patrulla": "PAT2024001",
    "rama": "SCOUTS",
    "totem": "AGUILA",
    "estado": "ACTIVA",
    "fecha_creacion": "2024-10-24T10:30:00Z",
    "miembros_iniciales": 0,
    "puntos_acumulados": 0
  },
  "message": "Patrulla creada exitosamente"
}
```

#### **2. Actualizar Datos Patrulla**
```sql
actualizar_datos_patrulla(
  p_patrulla_id UUID,
  p_datos_actualizacion JSON
) RETURNS JSON
```

#### **3. Obtener Patrulla por ID**
```sql
obtener_patrulla_por_id(p_patrulla_id UUID) RETURNS JSON
```

#### **4. Listar Patrullas por Rama**
```sql
obtener_patrullas_por_rama(p_rama rama_enum) RETURNS JSON
```

---

### **👥 GESTIÓN DE MIEMBROS**

#### **5. Asignar Scout a Patrulla**
```sql
asignar_scout_patrulla(
  p_scout_id UUID,
  p_patrulla_id UUID,
  p_cargo_patrulla cargo_patrulla_enum DEFAULT 'MIEMBRO',
  p_fecha_asignacion DATE DEFAULT CURRENT_DATE,
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSON
```

**Cargos en patrulla:**
- `JEFE_PATRULLA` - Jefe de patrulla
- `SUBJEFE_PATRULLA` - Subjefe de patrulla
- `SECRETARIO` - Secretario de patrulla
- `TESORERO` - Tesorero de patrulla
- `GUIA` - Guía especializado
- `MIEMBRO` - Miembro regular

#### **6. Cambiar Cargo en Patrulla**
```sql
cambiar_cargo_patrulla(
  p_scout_id UUID,
  p_patrulla_id UUID,
  p_nuevo_cargo cargo_patrulla_enum,
  p_fecha_cambio DATE DEFAULT CURRENT_DATE,
  p_motivo TEXT DEFAULT NULL
) RETURNS JSON
```

#### **7. Transferir Scout entre Patrullas**
```sql
transferir_scout_patrulla(
  p_scout_id UUID,
  p_patrulla_origen_id UUID,
  p_patrulla_destino_id UUID,
  p_motivo TEXT,
  p_fecha_transferencia DATE DEFAULT CURRENT_DATE
) RETURNS JSON
```

#### **8. Obtener Miembros de Patrulla**
```sql
obtener_miembros_patrulla(p_patrulla_id UUID) RETURNS JSON
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "patrulla_info": {
      "id": "patr123-456-789",
      "nombre": "Águilas Doradas",
      "total_miembros": 8
    },
    "miembros": [
      {
        "scout_id": "scout123-456-789",
        "nombre_completo": "Juan Pérez",
        "cargo": "JEFE_PATRULLA",
        "fecha_ingreso": "2024-01-15",
        "antiguedad_dias": 282,
        "especialidades": ["Campismo", "Primeros Auxilios"]
      },
      {
        "scout_id": "scout456-789-123",
        "nombre_completo": "María García",
        "cargo": "SUBJEFE_PATRULLA",
        "fecha_ingreso": "2024-02-01",
        "antiguedad_dias": 265,
        "especialidades": ["Cocina", "Orientación"]
      }
    ]
  }
}
```

---

### **🏆 SISTEMA DE PUNTOS**

#### **9. Registrar Puntos Patrulla**
```sql
registrar_puntos_patrulla(
  p_patrulla_id UUID,
  p_puntos INTEGER,
  p_categoria categoria_puntos_enum,
  p_actividad_id UUID DEFAULT NULL,
  p_descripcion VARCHAR(200),
  p_fecha_otorgamiento DATE DEFAULT CURRENT_DATE,
  p_otorgado_por_id UUID,
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSON
```

**Categorías de puntos:**
- `DISCIPLINA` - Puntos por disciplina y comportamiento
- `CAMPISMO` - Actividades de campismo y vida al aire libre
- `SERVICIO` - Servicio a la comunidad
- `ESPECIALIDADES` - Logro de especialidades
- `LIDERAZGO` - Demostración de liderazgo
- `CREATIVIDAD` - Actividades creativas y artísticas
- `DEPORTES` - Actividades deportivas
- `CONOCIMIENTOS` - Pruebas de conocimientos scouts
- `PROYECTO` - Proyectos especiales de patrulla
- `COMPETENCIA` - Competencias inter-patrullas

**Ejemplo:**
```sql
SELECT registrar_puntos_patrulla(
  p_patrulla_id := 'patr123-456-789',
  p_puntos := 25,
  p_categoria := 'CAMPISMO',
  p_actividad_id := 'camp123-456-789',
  p_descripcion := 'Excelente armado de campamento y fogata',
  p_fecha_otorgamiento := '2024-10-20',
  p_otorgado_por_id := 'dir123-456-789',
  p_observaciones := 'Patrulla demostró excelente trabajo en equipo'
);
```

#### **10. Obtener Ranking de Patrullas**
```sql
obtener_ranking_patrullas(
  p_rama rama_enum DEFAULT NULL,
  p_fecha_desde DATE DEFAULT CURRENT_DATE - INTERVAL '3 months',
  p_fecha_hasta DATE DEFAULT CURRENT_DATE
) RETURNS JSON
```

#### **11. Historial de Puntos Patrulla**
```sql
obtener_historial_puntos_patrulla(
  p_patrulla_id UUID,
  p_fecha_desde DATE DEFAULT NULL,
  p_fecha_hasta DATE DEFAULT NULL
) RETURNS JSON
```

---

### **📋 PROYECTOS DE PATRULLA**

#### **12. Crear Proyecto de Patrulla**
```sql
crear_proyecto_patrulla(
  p_patrulla_id UUID,
  p_titulo VARCHAR(200),
  p_descripcion TEXT,
  p_objetivos JSON,
  p_fecha_inicio DATE,
  p_fecha_fin_estimada DATE,
  p_responsable_proyecto_id UUID,
  p_presupuesto_estimado DECIMAL(10,2) DEFAULT 0,
  p_categoria_proyecto VARCHAR(100) DEFAULT 'GENERAL'
) RETURNS JSON
```

**Categorías de proyecto:**
- `SERVICIO_COMUNITARIO` - Proyectos de servicio
- `CONSERVACION` - Proyectos ambientales
- `CULTURAL` - Proyectos culturales
- `DEPORTIVO` - Proyectos deportivos
- `EDUCATIVO` - Proyectos educativos
- `ARTISTICO` - Proyectos artísticos
- `TECNOLOGICO` - Proyectos de tecnología

#### **13. Actualizar Progreso Proyecto**
```sql
actualizar_progreso_proyecto(
  p_proyecto_id UUID,
  p_porcentaje_avance INTEGER,
  p_actividades_completadas JSON,
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSON
```

#### **14. Obtener Proyectos Activos**
```sql
obtener_proyectos_activos_patrulla(p_patrulla_id UUID) RETURNS JSON
```

---

### **📊 ESTADÍSTICAS Y ANÁLISIS**

#### **15. Estadísticas Generales de Patrullas**
```sql
obtener_estadisticas_patrullas() RETURNS JSON
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total_patrullas": 12,
    "patrullas_activas": 11,
    "por_rama": {
      "LOBATOS": 3,
      "SCOUTS": 4,
      "VENTURES": 3,
      "ROVERS": 2
    },
    "miembros_promedio_patrulla": 7.5,
    "patrulla_mayor_puntuacion": {
      "nombre": "Águilas Doradas",
      "puntos": 485,
      "rama": "SCOUTS"
    },
    "proyectos_activos": 8,
    "competencias_mes": 3,
    "participacion_promedio": 89.5
  }
}
```

---

## 🏆 **Sistema de Reconocimientos**

### **Reconocimientos por Puntos:**
```sql
-- Automático basado en puntos acumulados
- Insignia de Excelencia: 500+ puntos en 6 meses
- Patrulla Destacada: Top 3 en ranking mensual
- Mejor Proyecto: Evaluación de proyectos completados
- Espíritu de Patrulla: Participación y compañerismo
```

### **Competencias Inter-Patrullas:**
```sql
-- Tipos de competencias
SELECT crear_competencia_patrullas(
  p_titulo := 'Gran Juego de Otoño',
  p_descripcion := 'Competencia de habilidades scouts',
  p_categorias := '["CAMPISMO", "PRIMEROS_AUXILIOS", "ORIENTACION"]'::json,
  p_fecha_competencia := '2024-11-15'
);
```

---

## 🔒 **Validaciones y Reglas de Negocio**

### **Validaciones Automáticas:**
- ✅ **Nombre único por rama** - No permitir nombres duplicados en la misma rama
- ✅ **Límite de miembros** - Máximo 8 scouts por patrulla
- ✅ **Un jefe por patrulla** - Solo un jefe de patrulla activo
- ✅ **Transferencias justificadas** - Motivo obligatorio para transferencias
- ✅ **Puntos positivos** - No permitir puntos negativos (usar sistema de sanciones separado)

### **Reglas de Liderazgo:**
```sql
-- Jefe de patrulla debe tener mínimo 6 meses en el grupo
-- Subjefe debe ser propuesto por el jefe actual
-- Rotación de cargos cada 6-12 meses recomendada
-- Evaluación de liderazgo trimestral
```

---

## 📊 **Performance y Optimización**

### **Índices Estratégicos:**
- `idx_patrullas_rama_estado` - Consultas por rama y estado
- `idx_miembros_patrulla_scout` - Relación scout-patrulla
- `idx_puntos_patrulla_fecha` - Ranking por fecha
- `idx_proyectos_estado_fecha` - Proyectos activos

### **Views Materializadas:**
```sql
-- Ranking actualizado diariamente
SELECT * FROM mv_ranking_patrullas;

-- Estadísticas por rama
SELECT * FROM mv_estadisticas_patrullas_rama;
```

---

## 🧪 **Testing y Validación**

### **Funciones de Prueba:**
```sql
-- Validar módulo completo
SELECT validar_functions_patrullas();

-- Generar patrullas de prueba
SELECT generar_datos_prueba_patrullas(8);

-- Test de sistema de puntos
SELECT test_sistema_puntos_patrullas();
```

---

## 📱 **Integración con Frontend**

### **Ejemplo TypeScript:**
```typescript
interface Patrulla {
  id: string;
  nombre: string;
  rama: Rama;
  totem: string;
  grito: string;
  colores: string;
  jefePatrulla?: Scout;
  subjefePatrulla?: Scout;
  miembros: MiembroPatrulla[];
  puntosAcumulados: number;
  proyectosActivos: ProyectoPatrulla[];
}

export class PatrullaService {
  static async crear(patrulla: CrearPatrullaData): Promise<Patrulla> {
    const response = await DatabaseFunctions.callFunction('crear_patrulla', {
      p_nombre: patrulla.nombre,
      p_rama: patrulla.rama,
      p_totem: patrulla.totem,
      p_grito_patrulla: patrulla.grito,
      p_colores_patrulla: patrulla.colores
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data;
  }
  
  static async obtenerRanking(rama?: Rama, periodo?: PeriodoRanking): Promise<RankingPatrulla[]> {
    const response = await DatabaseFunctions.callFunction('obtener_ranking_patrullas', {
      p_rama: rama,
      p_fecha_desde: periodo?.fechaDesde,
      p_fecha_hasta: periodo?.fechaHasta
    });
    
    return response.success ? response.data : [];
  }
  
  static async registrarPuntos(puntos: RegistroPuntosData): Promise<void> {
    const response = await DatabaseFunctions.callFunction('registrar_puntos_patrulla', {
      p_patrulla_id: puntos.patrullaId,
      p_puntos: puntos.puntos,
      p_categoria: puntos.categoria,
      p_descripcion: puntos.descripcion,
      p_otorgado_por_id: puntos.otorgadoPorId
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
  }
}
```

---

## 🎯 **Casos de Uso Comunes**

### **1. Formación de Nueva Patrulla:**
```sql
-- 1. Crear patrulla
SELECT crear_patrulla('Lobos Grises', 'SCOUTS', 'LOBO');

-- 2. Asignar scouts
SELECT asignar_scout_patrulla(scout_id, patrulla_id, 'JEFE_PATRULLA');
SELECT asignar_scout_patrulla(scout_id2, patrulla_id, 'MIEMBRO');

-- 3. Crear primer proyecto
SELECT crear_proyecto_patrulla(
  patrulla_id,
  'Proyecto de Integración',
  'Conocerse y definir tradiciones de patrulla'
);
```

### **2. Gestión de Puntos y Ranking:**
```sql
-- Registrar puntos por actividad
SELECT registrar_puntos_patrulla(
  patrulla_id, 30, 'CAMPISMO', 
  'Excelente construcción de refugio'
);

-- Obtener ranking actual
SELECT obtener_ranking_patrullas('SCOUTS');

-- Analizar tendencias
SELECT obtener_historial_puntos_patrulla(patrulla_id);
```

### **3. Competencia Inter-Patrullas:**
```sql
-- Crear competencia
SELECT crear_competencia_patrullas(...);

-- Registrar resultados
SELECT registrar_puntos_patrulla(patrulla_id, 50, 'COMPETENCIA', ...);

-- Generar resultados finales
SELECT obtener_ranking_patrullas('SCOUTS', fecha_competencia, fecha_competencia);
```

---

**📈 Total: 15 funciones implementadas para gestión completa de patrullas**

**🔗 [Volver a API Principal](../API_DOCUMENTATION.md)**