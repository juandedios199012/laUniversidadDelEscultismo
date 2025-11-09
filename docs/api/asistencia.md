# 📅 Asistencia API - Sistema Scout Lima 12

## 📋 **Resumen del Módulo**

El módulo de Asistencia gestiona el control de asistencias a reuniones, actividades y eventos, incluyendo estadísticas, alertas por inasistencia y reportes de participación. Contiene **~25 funciones** para el control completo de asistencias.

**Archivo:** `database/08_functions_asistencia.sql`

---

## 🔧 **Funciones Principales**

### **📝 REGISTRO DE ASISTENCIA**

#### **1. Registrar Asistencia**
```sql
registrar_asistencia(
  p_scout_id UUID,
  p_reunion_id UUID,
  p_presente BOOLEAN,
  p_hora_llegada TIME DEFAULT NULL,
  p_hora_salida TIME DEFAULT NULL,
  p_observaciones TEXT DEFAULT NULL,
  p_dirigente_registro_id UUID
) RETURNS JSON
```

**Ejemplo:**
```sql
SELECT registrar_asistencia(
  p_scout_id := 'scout123-456-789',
  p_reunion_id := 'reunion123-456-789',
  p_presente := true,
  p_hora_llegada := '15:30:00',
  p_hora_salida := '17:00:00',
  p_observaciones := 'Llegó 30 minutos tarde por estudios',
  p_dirigente_registro_id := 'dir123-456-789'
);
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "asistencia_id": "asist123-456-789",
    "scout_nombre": "Juan Pérez",
    "reunion_fecha": "2024-10-24",
    "presente": true,
    "hora_llegada": "15:30:00",
    "minutos_tardanza": 30,
    "estado_asistencia": "PRESENTE_TARDANZA"
  },
  "message": "Asistencia registrada exitosamente"
}
```

#### **2. Registrar Asistencia Masiva**
```sql
registrar_asistencia_masiva(
  p_reunion_id UUID,
  p_asistencias JSON,
  p_dirigente_registro_id UUID
) RETURNS JSON
```

**Estructura de asistencias JSON:**
```json
[
  {
    "scout_id": "scout123-456-789",
    "presente": true,
    "hora_llegada": "15:00:00",
    "observaciones": ""
  },
  {
    "scout_id": "scout456-789-123",
    "presente": false,
    "observaciones": "Enfermo - justificado por padres"
  }
]
```

#### **3. Actualizar Asistencia**
```sql
actualizar_asistencia(
  p_asistencia_id UUID,
  p_datos_actualizacion JSON
) RETURNS JSON
```

---

### **📋 GESTIÓN DE REUNIONES**

#### **4. Crear Reunión**
```sql
crear_reunion(
  p_fecha DATE,
  p_hora_inicio TIME,
  p_hora_fin TIME,
  p_tipo_reunion tipo_reunion_enum,
  p_rama rama_enum,
  p_tema VARCHAR(200),
  p_descripcion TEXT DEFAULT NULL,
  p_dirigente_responsable_id UUID,
  p_ubicacion VARCHAR(150) DEFAULT NULL
) RETURNS JSON
```

**Tipos de reunión:**
- `SEMANAL` - Reunión semanal regular
- `EXTRAORDINARIA` - Reunión especial
- `CAMPAMENTO` - Actividad de campamento
- `SALIDA` - Salida o excursión
- `CEREMONIA` - Ceremonia o evento especial
- `FORMACION` - Sesión de formación
- `CONSEJO` - Consejo de patrulla/tropa

**Ejemplo:**
```sql
SELECT crear_reunion(
  p_fecha := '2024-10-26',
  p_hora_inicio := '15:00:00',
  p_hora_fin := '17:00:00',
  p_tipo_reunion := 'SEMANAL',
  p_rama := 'LOBATOS',
  p_tema := 'Nudos y Pionerismo',
  p_descripcion := 'Aprendizaje de nudos básicos y construcción de estructuras simples',
  p_dirigente_responsable_id := 'dir123-456-789',
  p_ubicacion := 'Local Scout - Sala Principal'
);
```

#### **5. Obtener Reuniones por Fecha**
```sql
obtener_reuniones_por_fecha(
  p_fecha_desde DATE,
  p_fecha_hasta DATE,
  p_rama rama_enum DEFAULT NULL
) RETURNS JSON
```

#### **6. Finalizar Reunión**
```sql
finalizar_reunion(
  p_reunion_id UUID,
  p_resumen_actividades TEXT DEFAULT NULL,
  p_observaciones_generales TEXT DEFAULT NULL
) RETURNS JSON
```

---

### **📊 ESTADÍSTICAS DE ASISTENCIA**

#### **7. Obtener Estadísticas Scout**
```sql
obtener_estadisticas_asistencia_scout(
  p_scout_id UUID,
  p_fecha_desde DATE DEFAULT CURRENT_DATE - INTERVAL '3 months',
  p_fecha_hasta DATE DEFAULT CURRENT_DATE
) RETURNS JSON
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "scout_id": "scout123-456-789",
    "periodo": {
      "fecha_desde": "2024-07-24",
      "fecha_hasta": "2024-10-24"
    },
    "estadisticas": {
      "total_reuniones": 16,
      "asistencias": 14,
      "faltas": 2,
      "porcentaje_asistencia": 87.5,
      "tardanzas": 3,
      "asistencias_perfectas": 11,
      "faltas_justificadas": 1,
      "faltas_injustificadas": 1
    },
    "tendencia": "ESTABLE",
    "alerta_inasistencia": false,
    "ultima_asistencia": "2024-10-19"
  }
}
```

#### **8. Estadísticas por Rama**
```sql
obtener_estadisticas_rama(
  p_rama rama_enum,
  p_fecha_desde DATE DEFAULT CURRENT_DATE - INTERVAL '1 month',
  p_fecha_hasta DATE DEFAULT CURRENT_DATE
) RETURNS JSON
```

#### **9. Ranking de Asistencia**
```sql
generar_ranking_asistencia(
  p_rama rama_enum DEFAULT NULL,
  p_periodo_meses INTEGER DEFAULT 3,
  p_limite INTEGER DEFAULT 20
) RETURNS JSON
```

---

### **🚨 ALERTAS Y NOTIFICACIONES**

#### **10. Detectar Scouts en Riesgo**
```sql
detectar_scouts_riesgo_inasistencia(
  p_umbral_faltas INTEGER DEFAULT 3,
  p_periodo_semanas INTEGER DEFAULT 4
) RETURNS JSON
```

**Criterios de riesgo:**
- 3 o más faltas en 4 semanas
- Tendencia decreciente en asistencia
- Faltas consecutivas sin justificación

#### **11. Generar Alertas Automáticas**
```sql
generar_alertas_asistencia() RETURNS JSON
```

#### **12. Notificar Padres por Inasistencia**
```sql
notificar_padres_inasistencia(
  p_scout_id UUID,
  p_tipo_notificacion VARCHAR(50) DEFAULT 'FALTA_CONSECUTIVA'
) RETURNS JSON
```

---

### **📈 ANÁLISIS Y TENDENCIAS**

#### **13. Analizar Tendencias de Participación**
```sql
analizar_tendencias_participacion(
  p_rama rama_enum DEFAULT NULL,
  p_periodo_meses INTEGER DEFAULT 6
) RETURNS JSON
```

#### **14. Patrones de Asistencia por Día**
```sql
analizar_patrones_asistencia_dia() RETURNS JSON
```

**Identifica:**
- Días con mayor/menor asistencia
- Horarios óptimos por rama
- Impacto de condiciones climáticas
- Correlación con actividades escolares

#### **15. Efectividad de Actividades**
```sql
medir_efectividad_actividades_asistencia(
  p_tipo_reunion tipo_reunion_enum DEFAULT NULL,
  p_periodo_meses INTEGER DEFAULT 6
) RETURNS JSON
```

---

### **📋 REPORTES ESPECIALIZADOS**

#### **16. Reporte de Asistencia Mensual**
```sql
generar_reporte_asistencia_mensual(
  p_mes INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
  p_ano INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  p_rama rama_enum DEFAULT NULL
) RETURNS JSON
```

#### **17. Certificado de Asistencia**
```sql
generar_certificado_asistencia(
  p_scout_id UUID,
  p_fecha_desde DATE,
  p_fecha_hasta DATE
) RETURNS JSON
```

#### **18. Reporte de Padres**
```sql
generar_reporte_padres_asistencia(
  p_scout_id UUID,
  p_periodo_meses INTEGER DEFAULT 3
) RETURNS JSON
```

---

### **🔍 CONSULTAS AVANZADAS**

#### **19. Buscar Asistencias por Criterios**
```sql
buscar_asistencias_criterios(
  p_filtros JSON DEFAULT '{}',
  p_limite INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
) RETURNS JSON
```

**Filtros disponibles:**
```json
{
  "rama": "LOBATOS",
  "fecha_desde": "2024-10-01",
  "fecha_hasta": "2024-10-31",
  "presente": true,
  "tipo_reunion": "SEMANAL",
  "scout_id": "scout123-456-789",
  "tiene_tardanza": true,
  "tiene_observaciones": false
}
```

#### **20. Obtener Histórico Completo Scout**
```sql
obtener_historico_asistencia_scout(
  p_scout_id UUID,
  p_incluir_detalles BOOLEAN DEFAULT true
) RETURNS JSON
```

#### **21. Scouts Ausentes en Reunión**
```sql
obtener_scouts_ausentes_reunion(p_reunion_id UUID) RETURNS JSON
```

---

### **📊 MÉTRICAS Y KPIs**

#### **22. KPIs de Asistencia General**
```sql
obtener_kpis_asistencia_general() RETURNS JSON
```

**KPIs incluidos:**
```json
{
  "porcentaje_asistencia_global": 85.7,
  "scouts_asistencia_perfecta": 45,
  "scouts_en_riesgo": 8,
  "promedio_tardanzas_mes": 12.3,
  "tendencia_participacion": "CRECIENTE",
  "reunion_mayor_asistencia": {
    "fecha": "2024-10-19",
    "tema": "Fogata de grupo",
    "asistencia": 98.5
  }
}
```

#### **23. Comparativa entre Ramas**
```sql
comparar_asistencia_entre_ramas(
  p_periodo_meses INTEGER DEFAULT 3
) RETURNS JSON
```

#### **24. Impacto de Factores Externos**
```sql
analizar_impacto_factores_externos(
  p_incluir_clima BOOLEAN DEFAULT true,
  p_incluir_eventos_escolares BOOLEAN DEFAULT true
) RETURNS JSON
```

---

### **🔧 MANTENIMIENTO Y UTILIDADES**

#### **25. Consolidar Asistencias Históricas**
```sql
consolidar_asistencias_historicas(
  p_fecha_desde DATE,
  p_fecha_hasta DATE
) RETURNS JSON
```

**Proceso de consolidación:**
- Calcular estadísticas acumuladas
- Detectar inconsistencias en datos
- Generar resúmenes por período
- Actualizar métricas de scouts

---

## 🔒 **Validaciones y Reglas de Negocio**

### **Validaciones Automáticas:**
- ✅ **Reunión debe existir** - No permitir asistencia sin reunión creada
- ✅ **Scout activo** - Solo scouts activos pueden registrar asistencia
- ✅ **Fecha coherente** - No permitir asistencia en fechas futuras
- ✅ **Hora lógica** - Hora de llegada debe ser antes que hora de salida
- ✅ **Una asistencia por reunión** - Evitar duplicados de asistencia

### **Reglas de Negocio:**
```sql
-- Tardanza > 15 minutos se considera falta
-- 3 faltas consecutivas genera alerta automática
-- Asistencia < 70% en el mes requiere reunión con padres
-- Reuniones deben tener al menos 1 dirigente presente
```

---

## 📊 **Performance y Optimización**

### **Índices Estratégicos:**
- `idx_asistencias_scout_fecha` - Consultas por scout y fecha
- `idx_asistencias_reunion_presente` - Filtros por reunión y presencia
- `idx_reuniones_fecha_rama` - Búsquedas por fecha y rama
- `idx_asistencias_stats` - Cálculos de estadísticas

### **Vistas Materializadas:**
```sql
-- Vista con estadísticas de asistencia (actualizada diariamente)
SELECT * FROM mv_estadisticas_asistencia;

-- Resumen mensual por rama
SELECT * FROM mv_asistencia_mensual_rama;
```

---

## 🧪 **Testing y Validación**

### **Funciones de Prueba:**
```sql
-- Validar módulo completo
SELECT validar_functions_asistencia();

-- Generar reuniones de prueba
SELECT generar_reuniones_prueba(30);

-- Test de cálculos estadísticos
SELECT test_estadisticas_asistencia();
```

---

## 📱 **Integración con Frontend**

### **Ejemplo TypeScript:**
```typescript
interface Asistencia {
  id: string;
  scoutId: string;
  reunionId: string;
  presente: boolean;
  horaLlegada?: string;
  horaSalida?: string;
  observaciones?: string;
  fechaRegistro: string;
}

export class AsistenciaService {
  static async registrarAsistencia(asistencia: RegistroAsistenciaData): Promise<Asistencia> {
    const response = await DatabaseFunctions.callFunction('registrar_asistencia', {
      p_scout_id: asistencia.scoutId,
      p_reunion_id: asistencia.reunionId,
      p_presente: asistencia.presente,
      p_hora_llegada: asistencia.horaLlegada,
      p_observaciones: asistencia.observaciones,
      p_dirigente_registro_id: asistencia.dirigenteId
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data;
  }
  
  static async obtenerEstadisticasScout(scoutId: string, periodo?: PeriodoAsistencia): Promise<EstadisticasAsistencia> {
    const response = await DatabaseFunctions.callFunction('obtener_estadisticas_asistencia_scout', {
      p_scout_id: scoutId,
      p_fecha_desde: periodo?.fechaDesde,
      p_fecha_hasta: periodo?.fechaHasta
    });
    
    return response.success ? response.data : null;
  }
}
```

---

## 🎯 **Casos de Uso Comunes**

### **1. Registro de Asistencia en Reunión:**
```sql
-- 1. Crear reunión semanal
SELECT crear_reunion(
  CURRENT_DATE + INTERVAL '7 days',
  '15:00:00',
  '17:00:00',
  'SEMANAL',
  'LOBATOS',
  'Juegos de Kim'
);

-- 2. Registrar asistencias masivas
SELECT registrar_asistencia_masiva(reunion_id, asistencias_json);

-- 3. Generar estadísticas post-reunión
SELECT obtener_estadisticas_rama('LOBATOS');
```

### **2. Control de Inasistencias:**
```sql
-- Detectar scouts en riesgo
SELECT detectar_scouts_riesgo_inasistencia(3, 4);

-- Generar alertas automáticas
SELECT generar_alertas_asistencia();

-- Notificar a padres
SELECT notificar_padres_inasistencia(scout_id, 'FALTA_CONSECUTIVA');
```

### **3. Reportes Mensuales:**
```sql
-- Reporte mensual por rama
SELECT generar_reporte_asistencia_mensual(10, 2024, 'LOBATOS');

-- KPIs generales
SELECT obtener_kpis_asistencia_general();

-- Análisis de tendencias
SELECT analizar_tendencias_participacion('LOBATOS', 6);
```

---

**📈 Total: 25 funciones implementadas para control completo de asistencia**

**🔗 [Volver a API Principal](../API_DOCUMENTATION.md)**